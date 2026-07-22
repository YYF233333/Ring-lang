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

## [通知] B-163 step 8 canonical identity 收尾 WIP handoff（2026-07-15，额度停止点）

**边界**：本轮只做 step 8 收尾，**step 9 未开始**。用户因额度不足要求停止；以下改动已提交为可恢复 WIP，但最后一轮 bootstrap / 双后端 gate 尚未完成，不应宣称 step 8 已通过最终验收。

### 已实现

1. **统一 file-module identity**：普通函数、const、struct、enum、trait、effect、type/effect alias 等内部 identity 统一为 `<resolver module_prefix>$$_<decl>`；inline module 子项继续用 `::child`。诊断显示通过 `nominal_display_name` 还原为 `a::Type`，不泄漏 `$$_`。`extern fn` 与 `extern type` 保留 raw ABI 名称；后者是 bootstrap 中确认的必要边界（LLVM C-API handle 必须跨源文件同一类型）。
2. **binding origin 不再按拼写猜测**：`InferCtx.use_aliases` 改为本地 `DefId -> canonical origin`。跨模块 import 会清掉导出模块 DefId、在消费者分配本地 DefId 后记录 origin；局部同名 closure/变量产生新 DefId，自然屏蔽 module/import alias。qualified ident 的 early-return 路径也读取 DefId origin。
3. **跨模块 export/re-export origin**：`ModuleExports.value_origins` 保存真实定义 origin；named、alias、whole-module、transitive pub use 均转发 payload/origin，不再从 facade path 猜定义模块。fn mutability、impl/inherent/mut method metadata 同步转发。
4. **nominal / trait / effect 身份**：struct/enum/custom effect/trait 定义均携带 canonical name；impl target 通过 env 中 StructDef/EnumDef 解析，不再用 `contains("::")` 猜是否已限定；supertrait、type-param bounds、SchemeBound/FnBounds/HIR impl trait 均 canonicalize。effect handler/op 使用 EffectDef.name；effect alias body中的 effect 名在定义模块注册时 canonicalize，避免消费者同名 decoy 重绑定。
5. **pattern identity**：match/catch/if-let 进入 HIR 前递归 canonicalize enum qualifier 与 struct name，覆盖 tuple/or/nested/named patterns。C/LLVM pattern lookup 删除全局“第一个同名 variant/后缀 struct”扫描，要求 exact identity。
6. **function lookup / SCC**：qualified source call（如 `inner::f`）写入 HIR 时通过 binding DefId 取得 canonical origin；C/LLVM 可达的 module prefix enumeration 与 `$$_name` suffix fallback 已删除。SCC collector 按 caller 的 exact file/inline scope 解析 source callee，恢复 canonical declaration 间的依赖边。
7. **C symbol injection**：canonical identity 统一经 reversible `c_module_symbol` / `c_symbol_fragment` 编码；函数、方法、ctor、drop、dict、evidence、default thunk 等 identity-bearing 符号不再仅靠 `c_sanitize`，避免 `a::b` 与 `a_b` 冲突。LLVM resolve/mangle 同样识别 canonical name，避免重复加 prefix。
8. **inline pub use**：parser 允许 ModBlock 内 `pub use`；exports 将 `self`/`super` 相对路径解析为 file-prefix canonical source，并转发 values/origins/types/effects/effect aliases/traits 和相关 metadata。此项为停止前最后补丁，尚未完成最终 bootstrap 验证。
9. **既有 effect rebind 修复保留**：`rebind_fn_type` 量化 effect row free vars，并保留 var_bounds / associated constraints；runtime runner 的编译优化由 `-O0` 改为 `-O2`。

### 正式回归用例

- nominal struct/enum 同名隔离与 cross-type E0301；enum 不同 tag 顺序 + guarded/nested pattern。
- same-name trait/impl 隔离；impl metadata、transitive re-export metadata、type rename facade 携带 trait impl。
- named/module/transitive value re-export origin decoy；module top/import value被局部 closure shadow。
- 两个 file module 各自 `inner::value` 的 exact qualified call；C project key collision（`a::b` vs `a_b`）。
- effect alias origin decoy、effect bound rebind/assoc negative、Drop fail effect、effect monomorphic rebind。
- inline ModBlock pub-use origin。

### 已取得的验证证据（晚期补丁前）

- 使用中间编译器 `ring_new`/`ring_new2` 手动构建并运行：struct/enum isolation、三类 re-export decoy、transitive/same-name metadata、C key collision、effect bound rebind 均在 LLVM+C 得到预期输出；cross nominal 与 assoc negative 得到预期 E0301/E0513；extern ABI、inline module LLVM、cross-module method、pub_use 通过。
- 诊断显示验证：`cannot unify a::Packet with b::Packet`，无 `$$_` 泄漏。
- 旧中间编译器对新增测试做语法/基线 check：`module_value_origin_shadow`、`module_nominal_enum_pattern_tags`、`module_inline_fn_origin`、`module_nominal_trait_isolation` 通过；`reexport_type_alias_trait_impl` 与 `module_effect_alias_origin` 在旧行为下按预期失败，证明测试能捕获缺口。inline `pub use` 因旧 parser 不支持而失败，当前源码已补 parser。
- `git diff --check` 在停止前一轮为 clean；临时 compiler/probe 目录已按用户要求删除。

### 最后 bootstrap 状态（必须照实保留）

stage-0 来源：

- 路径：`C:\Users\Yufeng Ying\Desktop\Ring-lang\.claude\worktrees\agent-a268973c3c61d7b2a\ring.exe`
- SHA256：`73468AF6B14EE2F97C18D6349C68A66B2C2E371B369BDAC439B6F3AC1B3C8DF2`
- git：未 tracked，命中 `.gitignore:32 /ring*.exe`
- mtime：`2026-07-13T00:04:16.1809038+09:00`

两次用 `ring_new2` bootstrap（约 251s / 259s）均因该可执行文件自身仍内置“ExternType canonicalize”旧行为而把各源文件的 LLVM ABI handles 分裂，报大量跨模块 E0301；这属于 stage chicken-and-egg，源码随后已让 ExternType 保留 raw ABI identity。改用上述原始 stage-0 后运行 341s，**exit=1，无 object/最终 compiler 产物**；它已越过 ABI 问题，最后仅报 `exports.ring` inline helper 两处读取不存在的 `TraitRegistry.inherent_methods`。这两个读取随后已删除（同模块 impl 抽取本就负责填充 collector），但依用户停止指令**未重跑**，因此该最后补丁仍未编译验证。

### 续跑顺序（下个 worker 从这里开始）

1. 先用上述 stage-0 对当前 `compiler/main.ring` 做一次 LLVM build 到全新 temp out-dir；不得直接用旧 `ring_new2`，否则会重复 ExternType chicken-and-egg。
2. 从 runtime C 源显式 `clang -O2 -c` 到 temp，链接临时新 compiler；不要复用来源不明的 runtime object。
3. 用新 compiler 先跑短 gate：`module_value_origin_shadow`、三类 `reexport_*_origin_decoy`、`module_nominal_enum_pattern_tags`、`module_inline_fn_origin`、`module_nominal_trait_isolation`、`module_effect_alias_origin`、`reexport_type_alias_trait_impl`、`inline_pub_use_origin`。
4. 对所有正向 gate 分别 LLVM+C build/run，并逐项比较 `.expected`；再跑 E0301/E0513/E0803 等负向 diagnostics，确认输出无 `$$_`。
5. 再跑 Step 8 metadata/key/effect 旧回归与必要 suite。最终 self-compile ×3 仍由主 agent 按既定边界执行；本 WIP 未执行。
6. 任一 gate 失败先修 step 8；**不要直接进入 step 9**。

---

## B-163 step 8 — 2026-07-21 quota checkpoint（未完成、未 merge）

**停止边界**：用户再次要求额度耗尽前完成手头工作、落档并停止。已停止长编译；本保存点仍属于 step 8，step 9 从未开始。

### 本轮新增修复与正式回归

- 修复 `ModuleExports` 对 public type alias 的直接、named/module/transitive re-export 传播；`TypeAliasDef` 增加 canonical `name`。
- 修复 inline `pub use self/super` 对 struct/enum/type alias/effect/effect alias/trait/extern type/value等命名空间的传播，并补 module alias 处理。
- 修复 canonical file-module `main` 的 E0403 检查、`$$_` 用户诊断泄漏、C project symbol 对 `ring_` 前缀模块的碰撞。
- 修复 export 侧 inherent/mut method metadata：Impl 的 raw `target_type` 先解析到 canonical nominal identity，再读取 registry。正式用例 `module_inherent_method_identity` 锁两个模块同名 `Counter` 的不同 mut/read 方法。
- SCC 新增 exact qualified/self/super 解析与四个 E0403 负例；源码当前实现为“从 inline roots 沿 caller→callee 的依赖闭包做 leaf-first 预检”，避免普通 file module 全量双检查。
- 新增正式用例：`c_symbol_ring_prefix_collision`、`inline_pub_use_namespaces`、`module_main_unhandled_effect`、`module_trait_diagnostic_display`、`module_type_alias_direct`、`module_type_alias_reexport`，以及四个 `scc_*` 负例。

### Bootstrap 证据与新根因

1. 原始 stage-0 成功编译 method-export 修复版；随后新编译器自编译在 LLVM codegen 报 `field access on non-struct type: ?..., field: is_occurs_check`。全量 SCC 预检同时造成约 21GB WS / 36GB paged 与 712s 异常轨迹，因此先收窄预检。
2. 原始 stage-0 成功编译 inline-only 过渡源码：`main.o` 5,153,368 bytes，SHA256 `74076637D931A80B79A8F5FCACC65DA74A6D4E028B18B894ED92EA94F328636E`。以 `-O2` runtime 链接的 `ring_inline_bridge.exe` SHA256 `668AF3F167F9AE0848E03C4CCCD5426834D85AB285CDC9DFCCE83CB8E23ADABD`。
3. 对照证明用例有效：旧 full-precheck compiler 四个 `scc_*` 均 E0403；inline-only bridge 前三个 E0403，但 `scc_super_top_effect` exit 0。故最终源码改为 inline 依赖闭包，必须包含其 file-root callee。
4. inline-only bridge 编译闭包源码耗时约 324s 后仍在 `is_occurs_check` panic。静态确认 compiler/std 无 inline ModBlock，故这次失败不是闭包预检执行或 HIR 双检查污染。
5. 最小 probe 精确定位真正根因：canonical call graph 正确给出 `lib$$_raise_problem` 先于 `lib$$_fail_via_helper`；跨模块直接调用 `raise_problem` 的 typed catch 正常，但同模块 `fail_via_helper -> raise_problem` 丢 fail effect并触发 W0001/panic。`insert_file_module_aliases` 在注册后复制了 canonical scheme 到源码短名；`rebind_fn_type` 只刷新 canonical binding，后继同模块调用仍读取短名的注册期 EMPTY_ROW/未解析 return var。
6. 当前源码已新增 `rebind_fn_scheme_with_alias`：canonical rebind 后仅在短名与 canonical `def_id` 相同的情况下同步 scheme，覆盖 file top-level 与 inline display alias，避免覆盖 shadow/import。临时给 catch 变量加类型注解的规避已撤销；临时 SCC probe 源已删除。`git diff --check` clean。

### 当前验证边界（务必不要误报完成）

- alias 同步补丁刚落盘，依停止要求**未重新编译**；闭包版源码也尚未产出可执行 compiler。
- 新编译器的二代自举、定向 LLVM/C gate、必要 suites、LLVM self-compile ×3 确定性 gate全部未完成。
- 根审另发现 inline `pub use` 的 raw ABI `extern fn` 仍缺 fallback/`extern_values` 与 origin 传播；enum facade constructor 也需实际构造用例确认。两项尚未修，不能 merge。
- `tests/.tmp_step8_resume` 仅为本轮 probe/build 临时产物，不得提交；正式 tests 与 compiler diff保留在本 WIP checkpoint。

### 下次恢复的最短顺序

1. 先补 inline public re-export 的 raw `extern fn` fallback + `extern_values`/origin，并让 `inline_pub_use_namespaces` 实际调用 runtime extern fn、实际构造 facade enum。
2. 增加短 alias scheme 两个正式锁：`fail_now -> via_helper` 的 typed catch/E0403 传播；`fn leaf(){1}` 后声明 `Bool` caller 必须 E0301。
3. 用原始 stage-0（SHA256 见上一个 checkpoint）编当前源码到全新目录；runtime 明确 `-O2` 链接。先验证新增 alias tests与四个 SCC negatives。
4. 用该 compiler 再编同一源码；必须不再出现 `is_occurs_check` codegen panic，也不应新增 infer_ctx/infer_decl 的虚假 W0001。
5. 再执行原 checkpoint 的双后端短 gate、必要 suites、最终 LLVM self-compile ×3。全部通过后才允许 merge和 step 8 bookkeeping；完成即停，仍禁止进入 step 9。

---

## B-163 step 8 — 2026-07-22 known-gaps follow-up（仍未 bootstrap/merge）

### 本轮完成

- `copy_inline_export` 对 file-module raw ABI `extern fn` 增加受 AST 约束的 leaf fallback：仅当源文件顶层确有同名 `ExternFn` 时，才从 `module$$_abi_name` 回退到 `abi_name`，并同步传播 facade value scheme、raw ABI `value_origins`、`extern_values` 与 mut-param metadata。这样不会把缺失 canonical binding 误解析到同名普通/import alias。
- 将 `inline_pub_use_namespaces` 的 `origin` 改为 private inline module，所有公开能力只经 `facade` 暴露；正式执行面新增 `facade::parse_number("42")`（runtime extern fn）以及 `facade::Choice::Number(9)` 的构造和 match。
- private origin 暴露了真实 enum ctor 缺口：旧实现只复制 `EnumDef`，没有 ctor scheme。现从 canonical `EnumDef` 重建与注册期一致的 constructor scheme，导出 `facade::Choice::Variant -> canonical Enum::Variant` 精确 origin；为兼容现有 named-enum import，只在 leaf 未占用时补 legacy variant binding，避免同名 variant 覆盖。
- 正式补锁短 alias scheme：`module_scheme_alias_fail_catch` 覆盖同 file module `fail_now -> via_helper` 后 typed enum catch；`module_scheme_alias_return` 锁 unannotated `leaf() -> Int` 被 `Bool` caller 使用必须 E0301。既有 `module_main_unhandled_effect` 改为同模块 `fail_now -> via_helper`，继续要求 main 报 E0403。
- 静态复核 `rebind_fn_scheme_with_alias`：canonical 与 display alias 的 `DefId` 同一性门能排除 shadow/import，file top-level 与 `outer::fn` inline display 计算和 `insert_file_module_aliases` 一致；未发现需另改的明显语义/语法问题。

### 分钟级旧锚验证（不是当前源码 GREEN）

- 原始 stage-0 对 `module_scheme_alias_fail_catch`：build/link/run PASS，输出匹配 `17`；对 `module_scheme_alias_return`：negative PASS（E0301）。这证明新用例本身语法/运行规约成立，但 stage-0 尚无 canonical alias 机制，不能作为 alias 修复 GREEN。
- 原始 stage-0 对修改后的 `module_main_unhandled_effect`：negative PASS（E0403）。
- 原始 stage-0 对 `inline_pub_use_namespaces`：按预期 RED，停在旧 parser 不支持 ModBlock `pub use` 的 E0101；因此 raw extern/enum facade 新路径仍必须由下一代 compiler 验证。
- `git diff --check` clean。本轮按边界未启动 compiler bootstrap、全量 suite 或后台任务。

### 下一步（边界不变）

1. 用原始 stage-0 编译当前 compiler 源码并以显式 `-O2` runtime 链接第一代新 compiler。
2. 先跑本节三个 alias gates、四个 SCC negatives 和扩充后的 `inline_pub_use_namespaces`；后者必须在 LLVM/C 双后端输出 `7,8,41,9,42`。
3. 再由第一代新 compiler 编同一源码，确认无 `is_occurs_check` panic/虚假 W0001；随后执行原 checkpoint 的双后端 gate、必要 suites 与 LLVM self-compile ×3。
4. 所有 Step 8 hard gates 通过后才 merge/bookkeeping；完成即停，禁止进入 Step 9。

---

## B-163 step 8 — 2026-07-22 inline-use lexical registration follow-up

### 根因与修复

- 第一代新 compiler 实跑 `inline_pub_use_namespaces` 后发现：ModBlock `use/pub use` 原先只在 `check_mod_decl`（body checking）绑定；但函数、type alias 等声明的签名已在 `infer_register` 更早解析。因此 export collector 虽能形成 facade，facade 内后续声明仍看不到 `Count`、`RootItem`、`Handle` 等导入。
- relative-use resolver 已从 `infer_decl` 移到 `infer_ctx` 成为唯一共享实现。`register_mod_block_items` 进入与 `check_mod_decl` 相同的 mod path stack 后，先用同一 canonical identity、namespace binding 与 E0707 冲突规则安装 imports，再注册该 inline module 的所有声明；checking 阶段重新安装正确的词法 binding 并负责报告 diagnostics。注册阶段静默 diagnostics，避免同一个非法 use 报两次，但 ambiguous import 仍采取同一“保留首个、拒绝冲突项”规则。
- 新增 `InferCtx.file_extern_values`，只由当前源文件的顶层 `ExternFn` AST 填充。relative import 对 file-module raw ABI extern fn 可从 `module$$_name` 精确回退到 ABI `name`，同时不会把 prelude-only extern 伪装成 `super::` 文件成员；与 export collector 的 AST guard 边界一致。
- `inline_pub_use_namespaces` 再强化：facade 内新增 `pub type PublicCount = Count`，consumer 使用 `facade::PublicCount`，锁定 imports 在 type-alias registration 与后续 fn signature 中均可见。

### 分钟级证据与边界

- RED（第一代 `ring_step8.exe`，修复前二进制）：`PublicCount = Count`、`RootItem`/`RootCount`/`Handle` 均 E0204，`super::parse_int` E0201。
- 当前源码用同一 compiler 以 `compiler/infer_decl.ring` 为局部 entry 编译：LLVM target PASS（约 40s）；C target 生成并经 clang 编译 PASS（约 38s）。这验证共享 resolver、InferCtx 字段、注册调用链在两后端均通过类型检查/codegen，不是完整 compiler bootstrap。
- 尚无包含本补丁的新 compiler，因此 semantic GREEN 必须由下一次短 bootstrap 后运行 `inline_pub_use_namespaces` 得到；本轮未启动 compiler self-bootstrap、全量 suite 或后台任务。

### 下一步

1. 从上一代 `ring_step8.exe` 编译当前 compiler 并以 `-O2` runtime 链接下一代。
2. 首先以 LLVM+C 跑 `inline_pub_use_namespaces`，必须输出 `7,8,41,9,42`；同时跑 `mod_relative_path`、`mod_relative_path_multi`、`error_relative_path_bad_segment`，确认共享 resolver 的 nested super 与错误规则无回归。
3. 再继续 alias/SCC gates 与二代自举；仍禁止进入 Step 9。

---

## B-163 step 8 — 2026-07-22 extern-type boundary / forward-facade follow-up

### 边界与顺序修复 [通知]

- raw ABI extern type fallback 现在与 extern value 对称：`InferCtx.file_extern_types` 只由当前文件顶层 `ExternType` AST 填充；relative import 与 export collector 都必须先通过 current-file AST guard，才允许从 canonical identity 回退到 raw ABI identity。这样保留 `ForeignHandle` 正向 facade，同时禁止把 prelude-only `Set` 伪装成 `super::Set` 文件成员。
- 新增负例 `inline_super_extern_type_boundary`。上一代 `ring_step8.exe` 错误接受并生成 object，确认测试为有效 RED；当前源码需由下一代 compiler 验证 E0201 GREEN。
- inline module 的两阶段注册语义应与 sibling 源码顺序无关。实现采用有界、稳定排序：同层先注册非 `ModBlock` 声明，再仅依据 sibling `use` 的直接 `super::<sibling>` 首段依赖拓扑注册 ModBlock；无进展/循环依赖保留剩余源码顺序，继续由 checker 产出诊断。`inline_pub_use_namespaces` 已将 facade 移到 private origin 前，上一代 compiler 按预期 RED。

### 有意保留的覆盖边界 [通知]

- 本轮没有建立通用模块依赖图；排序不推导 `self::child`、连续多级 `super::super::...`、任意祖先路径或函数体内的依赖。当前目标仅是消除“facade 直接导入同层后置 sibling”这一注册顺序缺口，避免把 Step 8 收尾扩大成模块系统重构。
- 循环 sibling facade 不在本修复中求解；稳定回退只保证确定性，语义错误仍由现有 checking 路径处理。

### 分钟级验证

- 当前源码以 `compiler/checker.ring` 为局部 entry：LLVM target PASS，C target 生成并经 clang 编译 PASS；输出仅含既有 W0001 与“无 main”提示。
- `git diff --check` clean。未运行 bootstrap、全量 suite、自编译或 Step 9；semantic GREEN 仍需下一代 compiler 跑 `inline_pub_use_namespaces` 与 `inline_super_extern_type_boundary`。

---

## B-163 step 8 — 2026-07-22 project extern-forward bridge follow-up

### 根因与修复设计 [通知]

- 第二代 compiler 已将 Ring function 定义 canonicalize，但 `codegen_llvm_stmt.ring` 为破除 `codegen_llvm_expr` 循环依赖而保留的 raw `ExternFn` forward declarations 仍落入 backend unknown-extern fallback，最终引用 `gen_llvm_expr`、`discard`、`is_boxed_def` 等 raw linker symbols。恢复 suffix/leaf 搜索会重新引入跨模块同名误绑定，因此没有采用。
- `compile_phases` 在所有模块完成 checking 后构造 LLVM/C 共用的 exact bridge plan。候选必须同时满足：canonical public Ring `Fn`、leaf 相同、resolved signature（type params、参数 mutability/type、return、effects）相同，且 provider 模块直接依赖 forward declaration 模块；最后一条刻画“正常反向 use 会成环”的 intentional forward 结构，也隔离无关真实 FFI。
- 唯一候选生成 `declaring_prefix$$_raw -> provider canonical identity`；零候选明确保留 raw FFI；多个相容候选报 E0708 并停止，不允许 first-wins。bounded generic forward 暂不桥接，因为当前结构还不能精确比较其 trait constraints。
- LLVM/C resolver 均在显式 imports 之后、current-module prefix/bare fallback 之前消费同一 bridge map。known runtime/LLVM-C ABI 分支不变；不存在 bridge 时仍按真实外部符号链接。

### 正式回归与分钟级证据

- `extern_forward_project_bridge` 同时覆盖：有效反向 forward、同 leaf 但签名不相容 decoy、同签名但无反向依赖的 `parse_int` Ring decoy不得劫持真实 FFI。预期 LLVM/C 输出均为 `42`、`7`。
- `error_extern_forward_ambiguous` 包含两个签名相容且都直接依赖 forward 模块的 provider，要求 E0708。
- 旧 `ring_step8.exe` 对正例 LLVM/C 都生成 raw `bridge` 引用；两后端 object 链接均以 `undefined symbol: bridge` 失败，证明正例有效 RED。旧 compiler 对歧义负例错误接受（exit 0），同样为有效 RED。
- 当前源码的 `codegen_llvm_ctx.ring`、`codegen_c_ctx.ring` LLVM partial compile PASS。`compiler_mod.ring` 旧锚 partial build 在 180 秒边界被终止，只出现既有 parser W0001，无遗留进程；未重跑长探针。完整语义 GREEN 需下一代 compiler build 后由主 agent验证。
