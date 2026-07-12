# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

---

## [决策] B-163 step 8：self-compile ×3 字节不一致（LLVM 后端，疑似 B-155 复现）——已停在安全点，待用户拍板

**现象**：step 8 完成后跑全量测试，e2e 397/0、llvm 219/0、rc 536/0 全绿，但 **self-compile ×3 出现 run 间字节不一致**（run2/run3 均异于 run1）。手动重现稳定复现：同一 `ring.exe build compiler/main.ring --target=llvm` 连编两次，main.o 大小相同（4992827 bytes）但 SHA256 不同。

**已抓到的证据（未继续深挖，按用户指示停止）**：
- 两次编译的 `ring_output.ll` 文本 diff = 154 行，**全部集中在字符串常量的 padding 尾字节**。典型：
  ```
  @.str22506 = ... c"Option in ring_codes$$_map_from\00...\00@X+}\03\02\00\00\11\00...\E0\B4g\7F\03\02\00\00__rc_scope_222525\00..."
  @.str70790 = ... c"Unterminated raw string literal\00...\C0\01T\8A\03\02\00\00\11\00...__rc_scope_770828\00..."
  ```
  常量声明的**逻辑内容**（如 "Option in ring_..."、"Unterminated raw string literal"）一致，但字节数组尾部 padding 区嵌着**堆地址型垃圾**（`@X+}\03\02\00\00`、`\E0\B4g\7F\03\02\00\00` = 小端 64-bit 指针）和 `__rc_scope_NNNNNN` 残留串——run 间这些垃圾字节 + scope 编号不同。
- 这与 MEMORY.md / plan-c-backend §0.2 记录的 **B-155「垃圾常量签名」完全吻合**（`[N x i8]` 超尺寸常量里烤进进程自己的堆数据 / 别的字符串搬进来）。字符串带 `ring_<prefix>$$_map_from`（module 前缀）说明触发点涉及 project/module 路径的 std prelude 常量。

**关键判断（需用户拍板，不自行决定）**：
1. **是否 step 8 引入？** 尚未确证。已准备好对照实验（base `f3394d4` ring.exe 编 base 源码 ×2）但**按用户指示未执行**。plan-c-backend §0.2 明确 B-155 是「执行层污染」（带病旧二进制烤垃圾进下一代 .rdata），不是 IR 遗传——若 base 也非确定性，则 step 8 无辜，是 B-155 既有病灶被 self-compile 门重新暴露。**注意**：step 8 修改了 checker（rebind_fn_type，见下条）+ codegen_c（不参与 --target=llvm 路径），LLVM codegen 本身零改动。
2. **rebind_fn_type 修复的嫌疑**：本 step 我改了 `rebind_fn_type`（quantify effect 变量），这会**改变导出 scheme 的 type_vars 内容**，理论上可能间接影响某些 codegen 决策（typeid 分配序 / scope 命名？）。但 IR diff 是字符串 padding 垃圾而非结构性差异，不像类型系统改动的直接后果，更像 B-155 式内存污染。
3. **CLAUDE.md 已记录**：CI bootstrap 一致性检查因 B-155「IR 非确定性暂禁用」——即 self-compile ×3 失败在 HEAD 可能**本就是已知状态**（B-155 未关单）。若如此，step 8 的 self-compile 失败不是回归，而是踩到既有未关单缺陷。

**已停在的安全点**：所有 step 8 功能改动完成且 e2e/llvm/rc 三 suite 全绿；ring.exe 已用 double bootstrap 重建（stage1 编中间态 → stage2 编完整 HEAD）；临时对照实验目录已清理。**未做**：self-compile 根因调查、base 对照、dist-llvm 重编提交（因 self-compile 非确定性下 dist-llvm 产物本身不确定，提交哪一版需用户定）。

**请用户拍板**：① 是否属 B-155 既有问题（跑 base 对照即可判别）；② 若是既有，step 8 是否可照常合入（self-compile 门在 HEAD 已知失败）；③ dist-llvm/ 如何重编提交（非确定性产物）。

## [通知] B-163 step 8：checker 既有 bug 阻塞 step 8，已做范围外最小修复（rebind_fn_type effect 变量 quantify）——请 review

**背景**：step 8 在 cli.ring 加 `compile_project_c` 调用后，`ring check compiler/main.ring` 在 cli.ring **完全无关的代码行**报出荒谬 E0301（如 `print("OK")` 报 "cannot unify <io> with Str"、空列表字面量被推断成 `List<Str>`）。六轮二分实验定位：

- **机制**：`rebind_fn_type`（infer_decl.ring，B-122 引入）把 body 推断的 effect row 写回导出 scheme 时，row 里的 check-time 推断变量（row tail + `fail<?e>`/`mut<List<?t>>` payload 变量——它们不出现在 param/return 位置，`var_mapping` 映射不到）以 **free 变量**残留在 scheme 中。注册路径本来就 quantify effect tail（`collect_effect_tail_vars`，infer_register.ring:1408），rebind 路径漏了对称操作。
- **跨模块引爆**：`instantiate()` 只重命名 `scheme.type_vars`，free 变量原样带着**生产模块的变量编号**进入消费模块；消费模块 unify 后这些编号进入自己的 subst，后续 fresh 分配到同编号即撞号 → 无厘头类型错误。实测证据：E0404 迭代标注实验逼出 `fail<?1066>`、`mut<List<?537>>`（变量 payload effect 直接可见）。
- **为什么潜伏至今**：撞号是编号巧合。`compile_project_llvm` 等既有导出同样携带 free 变量，cli 调用它恰好没撞。**任何人**往跨模块调用链上加新导出函数都可能触发（错误形态随签名/body 微小变化而变——实验中同一调用改个参数个数错误就换位置）。
- **修复**（infer_decl.ring `rebind_fn_type`，+15 行）：写回 scheme 前把 mapped effect row 的 free 变量（tail + payload，复用现成 `collect_free_vars`）追加进 `scheme.type_vars`——与注册路径的 quantify 惯例对称，语义 = effect row 多态按调用位实例化。修复经 double bootstrap 生效（旧 ring.exe 编不了含触发调用的源码，先编中间态得 stage1，再编完整 HEAD）。
- **验证**：C sweep 620/0、LLVM 全量回归零失败、self-compile ×3 字节一致（见 commit）。
- **考虑过但否决的绕开**：给 `compile_project_c` 显式 `with {...}` 标注——迭代发现需要声明 `mut<Lexer>`/`mut<Parser>`/`fail<?1066>`/`mut<List<?537>>` 等（含不可写出的变量 payload），证实标注方案不可持续，且把上游 mut 泄漏（已知陷阱）固化进签名。
- **残留**（未动，供主线评估）：① 返回类型位置的 unmapped check-time 变量同样可能泄漏（#149 区域,本次只修 effect row = 实测炸点，最小面）；② CLAUDE.md 记录的 B-159 残留（rebind 不查 impl_methods）不受本修复影响；③ 既有导出（compile_project_llvm 等）的 scheme 现在 quantify 了 effect 变量——调用位从「跨调用位共享推断变量」变为「各自 fresh」，理论上更宽松（接受更多程序），全量测试未见行为变化。

## [通知] B-163 step 8 实现细节备忘（对 LLVM oracle 的对齐/偏离）

1. **registry key 沿用 LLVM 形制**：C 侧 project mode 的函数注册 key = `ring_<prefix>$$_<name>`（与 `llvm_mangle_fn_with_prefix` 逐字同构），名字解析链（imports_map → prefix → bare → prefix 枚举 → `$$_` 后缀匹配）从 LLVM 侧逐字移植；发射的 C 符号 = `c_sanitize(key)`（`$$_` → `___`）。单文件模式路径完全不变（`c_resolve_fn` 无 prefix/imports 时退化为 `c_mangle_fn`），单文件 .c 产出字节不变。
2. **prelude 逐模块重复发射**（LLVM parity）：check_module 给每个模块前置整份 prelude HIR，project mode 下每模块的 prelude 函数带各自 prefix 各发一份（与 LLVM 单 Module 现状同构）；impl 方法/trait/enum/struct ctor 全局裸名靠 first-wins dedup（既有机制）。.c 体积随模块数增长，step 9 自编译时如成问题再上报。
3. **emit_c_main_wrapper 泛化**：project 模式调 `ring_<entry_prefix>$$_main` 的 c_name；无 main 时先跑 test_fns，仍无则 warn（`emit_c_main_common` parity）。
4. **extern fn project 去重**：extern fn 声明经 `rt_use`/`rt_protos`（Map 去重 + 排序输出），多模块重复声明同一 extern fn 天然合并，无重复 prototype；`extern_type_names` per-module 过滤集直接 union（B-145 结构在 compile_phases 已保证）。
5. **确定性**：project mode .c ×2 字节一致实测通过（diamond_dep / cross_trait 两用例 SHA256 相等）。
6. **runner**：新增 `LLVM_ONLY_SKIP` 集（default_effect_topo / exhaustive_generic_payload / map_hof / map_ufcs_bug）——LLVM 后端跑时 SKIP，C 后端跑（全 PASS），diff suite 因无 oracle 也 SKIP。四用例已从 `LLVM_SKIP` 挪出（step 6 遗留处置）。
