# Plan: B-163 C 后端迁移（LLVM-C API → C 源码发射）

> 2026-07-10 Discussion 拍板。状态跟踪见 backlog B-163 条目。
> 本文档是活的执行计划——完成后删除，结论归档进 commit message + design.md 后端章节改写。
> 执行 session 开工前请整体读完本文档，Phase 0 必须先于一切。

## 0. 背景与决策记录

### 0.1 动机

B-155（自编译 IR 非确定性）历经三轮深度调查（06-27 / 06-30 / 07-01）未关单，CI bootstrap 因此禁用。结构性诊断：LLVM-C 直连后端把开发推进了一个验证信道全面失效的环境——

1. **产物不可审计**：codegen 是 91 个 extern fn 调用在内存里搭 IR，错误表现为延迟爆炸的间歇性堆损坏（×3 才 ~1/3 命中率），agent 会把假绿当真绿。
2. **FFI marshalling 层是类型系统真空**：`StrToCstrAndLen` 这类"一个 Ring 参数展开两个 C 参数"的特殊路径处在 Perceus RC 生命周期决策与 C ABI 的交界上，"编译器是最终权威"公理管不到这里。
3. **证据太贵**：全强度 ASan self-compile 过夜；反汇编级调试只有用户本人能做。
4. **单后端无 oracle**：JS 退役后失去差分信道，self-compile 产出垃圾时没有第二信道说"正确长什么样"。

### 0.2 B-155 机制假设（Phase 0 检验）

**自洽尸体假设**：Str 对象在 marshalling 前被（旧 dist-llvm 二进制中错误的）RC drop 释放，内存块被另一个结构相同的活对象复用 → header 的 len 与 buf 内容来自"新住户"，两者自洽（`strlen(buf) == s->len` 诊断通过）但值已非原字符串。可解释全部已确认事实：垃圾内容是进程自己的堆数据（别的字符串搬进来了）；恰好全是 31 字符的串出问题（同一 allocator size class 才被同类复用）；小文件正常大文件出错（堆翻腾决定尸体是否被复用）；新产出 IR 查无 drop 顺序问题（**bug 在正在执行的旧二进制机器码里，不在新源码里**）。

传播机制是**执行层污染**而非 IR 遗传：旧 .o 冻结了带病 codegen，每次 rebuild 由带病二进制执行，垃圾常量烤进下一代 .rdata。

### 0.3 目标选型

**选 C（C11，clang 编译）**。理由：

- **整类消灭 B-155 类 bug**：codegen 变成纯 Ring 字符串拼接（StringBuilder），编译过程零 FFI、零 marshalling、零 LLVM 链接——出问题的机制物理上不存在。
- **clang 成为免费的去相关验证信道**：生成的 C 过 clang 类型检查，参数个数/类型错误编译期就响。
- **产物可读、可 diff、可审计**：`#line` 指令映射 .ring 行号后，ASan/UBSan 报告直指 Ring 源码；双 bootstrap 检查变成 .c 文本字节比较，天然确定性；冻结 stage 0 是人和 agent 都能读的 C 文本。
- **实现比 LLVM-C 后端简单一个量级**：无 SSA/phi（局部变量赋值）、无 basic block 簿记（#198 builder save/restore 类 bug 整类消失）、无 GEP 手算。
- **与既有路线自洽**：runtime 终态已定为纯 C ~400 行（design.md §7.12）；参考实现 Koka 即编到 C（75-85% of C 已验证）；philosophy 层 1 ⑦（native / 零强制 runtime / C ABI）满足。

**否决 Rust**：borrow checker 检查的是手写代码的所有权协商，机器生成的代码无法参与——Perceus 已在 HIR 层决定全部 dup/drop，rustc 用不匹配的模型复查只有两个出口：全 `unsafe`（= 语法更重的 C）或 `Rc<RefCell>`（运行时 panic + 性能回退）。外加 rustc 编译速度拖累 self-compile 循环。

**否决文本 .ll**：同样消灭 FFI 层且改动最小，但保留 SSA/phi/GEP 手工管理与 IR 不可读性，clang 对 .ll 只给 verifier 级检查不给类型语义检查。既然动发射层，一步到 C 边际成本小、收益差距大。

### 0.4 信任面辨析（回应"clang 不在审查范畴"顾虑）

LLVM 的 optimizer + backend 在 LLVM-C 路线下**本来就在信任基内**（从未被我们审查）。C 路线的净变化 = 用 clang C 前端（全世界被锤打最狠的 C 前端）替换自研的 91-extern marshalling 层 + 不可读的内存 IR 构建。且生成的 C 可被 gcc/MSVC 交叉编译作去相关信道——Diverse Double-Compiling 从"不可能"（LLVM IR 只有一个消费者）变为"可行"（C 有多个独立实现）。净信任面收缩，可审计性上升。真正咬过我们的信任问题是**自己的冻结二进制**（dist-llvm/.o），不是 clang；文本 .c stage 0 恰好把这个面缩到最小。

---

## 1. Phase 0 — stage 0 清洁重建（B-155 方向 B，先行探针）

> 对应 workflow「立项前实测前提」规则：Phase 0 即本计划的前提探针。
> **必须先于 Phase 1**：C 后端移植需要由干净的 ring.exe 执行，否则污染继续传播。

**步骤**（2026-07-10 修订：原 Step 1「JS dist/ 单跳编 HEAD」不可行——dist/ 冻结于 `0bd7822`，无 Ptr/unsafe/Drop/Hash，编不了 B-152 RIIR 后的 std。探针已实锤：JS dist/ 编 source@0bd7822 产出与提交版 main.o 逐字节一致 = 干净锚点。用户拍板方案 A：全量链式重放 + 代际审计）：
1. **链式重放**：从干净锚点 `0bd7822` 起，按 dist-llvm rebuild commit 顺序逐代重放（~17 代际至 HEAD）——gen N ring.exe 编 source@commit(N+1)，产出与该 commit 提交版 main.o 逐字节比对。每代用该 commit 的 ring_runtime.cpp（-O2）构建链接；B-152 P2（`fae4738`）/ P3（`8871592`）数据结构重构点按 CLAUDE.md 纪律 double bootstrap；revert 对（`26abe34`→`a5fb9a4`）跳过。每代顺带扫描产出中的超尺寸垃圾常量（`[109 x i8]` / `[1410 x i8]` 型）。
2. **首个分歧代分类**：出现字节分歧时区分 .text vs .rdata、核对 B-155 垃圾常量签名，并对该代做 ×2 重编确定性检查——判别「历史污染引入点」（干净重放产物本身干净）vs「活 bug」（干净链条也复现垃圾/非确定性）。
3. 链条走到 HEAD 后：用干净 dist-llvm@HEAD 构建 ring.exe，self-compile ×3 逐轮字节比较 + 垃圾常量归零检查（原 Step 2/3 不变）。

**结果路由**：
- **×3 字节一致 + 垃圾常量消失** → 污染假设实锤。B-155 关单（结论写入 commit message），CI bootstrap 重新启用，进入 Phase 1。
- **仍不一致** → 现行源码存在活的 RC/marshalling bug。回填 B-155（方向 C：Perceus extern fn 参数生命周期审计），**该 bug 与 Phase 1 并行不冲突**（C 后端移除 marshalling 层，但若 bug 是通用 RC 排序问题则 C 后端同样受影响，必须修）。拿到的干净 stage 0 baseline 无论如何是后续调查的基准。

**验收**：明确的二选一结论 + 干净 dist-llvm/ + B-155 条目更新。

---

## 2. Phase 1 — C 后端实现（agent 化，golden 驱动）

### 2.1 设计决定

| 维度 | 决定 |
|------|------|
| 方言 | C11，clang 编译（现有工具链，-O2 约定沿用）；不使用 clang 独有扩展，保持 gcc/MSVC 可编译（远期差分信道） |
| 值表示 | **不变**。boxed 指针 + 现有 typeid 体系，ring_runtime.cpp 的 C ABI 函数原样调用；method_to_runtime 映射逻辑直接迁移 |
| 翻译单元 | **单个 .c**（镜像现状的单 LLVM Module，B-105 跨模块单态化问题不在本期解决；拆分留给 B-105，与其 per-module .o 设计合并考虑） |
| 控制流 | 表达式语句化 + 临时局部变量；match/循环用 if/goto+label。无 SSA、无 phi |
| 字符串常量 | 显式长度字节数组（binary-safe，不依赖 strlen），保持 null-terminated 以兼容 ring_str_to_cstr 零拷贝约定。**B-155 类问题在文本层肉眼可见** |
| 源映射 | `#line` 指令映射 .ring 文件/行号（sanitizer/调试器直指 Ring 源码）；提供开关（关掉便于人读生成码） |
| fail/abort | 沿用现 LLVM 后端的语义方案原样映射到 C（worker 移植前先读现实现确认机制，不自行重新设计） |
| 发射层 | 纯 Ring StringBuilder 拼接，编译期零 FFI。`.c` 写盘后 shell out `clang -c` |
| 确定性 | 文本产出 + 现有 sorted_entries 纪律（audit #237）→ 字节级确定性是硬验收 |

**不变量（省心清单）**：HIR 之前全链路（Lexer→Checker→HIR）、Perceus RC pass、verify_rc、dict_lower/andor_lower、runtime——全部零改动。换的只是 HIR 之后的发射层。

**已定语义对齐细节（steps 1-3 落地，2026-07-11 从 worker feedback 沉淀；Phase 2 改写 design.md 后端章节时取用）**：
- **Float `!=`**：发射 `(a<b||a>b)`——LLVM ONE 是 ordered（NaN→false），C `!=` 对 NaN 是 unordered-true，直译会翻转 NaN 语义
- **整数 `+`/`-`/`*`**：经 `RING_IADD` 等无符号 wrap 宏——LLVM 无 nsw 标志 = wrap 语义，C 有符号溢出是 UB；除零 guard 照抄 B-148
- **`#line` 默认开**，`--no-c-lines` 关（人读生成码用）；实测自编译级用例 ~636 条指令
- **符号冲突**：撞 ring_runtime 符号表的 prelude Ring 函数（map_new 等 3 处）定义加 `__ring` 后缀，调用点经 CFnInfo.c_name 透明解析（LLVM 后端靠 module 自动重命名兜底，C 是硬链接错误，必须显式）
- **局部变量全部提升到函数顶部声明**（LLVM entry-alloca 等价物）——一次性绕开 C 块作用域坑（跨块临时、goto 跨声明、shadowing）；for 的 `continue` 映射 `goto __ring_incr_N`（增量 + binding drop 序列），while 直接 `continue`
- **未移植构造 stub 策略**：prelude 全量流经后端（单文件模式 checker 前置整个 std），未移植构造发射为编译期干净的 runtime-panic stub（interned 去重消息，grep `c_stub_` 列全）；副作用 = clang 2 条良性 divzero warning（stub 死代码，运行不可达，stub 清零后消失）
- **exec_sync**：std 早有声明但 native 从未实现，steps 1-3 补上（Windows `_spawnvp` + 手动 argv 引号 / POSIX fork+execvp），clang shell-out 前提；clang 失败 → `exit_process(1)`（对照 audit #242：LLVM 后端 emit 失败漏 exit）
- clang 调用参数 `-std=c11 -O2 -c`；`--out-dir` 显式给出时 .c/.o 进该目录，否则落源文件旁（对齐 LLVM 单文件行为）

**已定语义对齐细节（step 4 落地，2026-07-11 沉淀）**：
- **match = 统一 if/goto 测试链**（`gen_c_match_expr`，LLVM `gen_match_if_else` 的 C 渲染；LLVM tag-switch 自注明是纯优化，未移植）。两个允许性偏离（均只在 checker 保证不可达路径可观测）：① 非末位 wildcard + 后续 ctor arm 的病态程序，C 按源序（LLVM switch 路径违反源序提升 wildcard 进 default）；② 穷尽失败 panic 消息 C 统一 `match exhaustion failure #N`（LLVM switch 路径带 enum 名+tag）
- **typeid 分配时机**：C 在 forward pass 分配（LLVM lazy）——数值可能与 LLVM 不同，typeid 本就 per-binary 各自内部一致；**Option typeid 钉死 8**（RING_TYPEID_OPTION，LLVM 未钉，C 防御性对齐 ctor 常量）
- **struct ctor**：forward pass 后统一 declare+define，fn 恒胜 struct ctor 抢 `ring_<Name>`（decl 顺序无关）；enum ctor forward pass 注册 first-come-wins
- **record row 访问 default 分支**：C 发 `ring_panic`（LLVM 发 `unreachable` UB）——更稳健的允许性偏离
- **调用位名字解析局部作用域优先**（named_values 先于 functions map，语言作用域规则；LLVM 侧 #243 已随 step 5 修复对齐）；**同名 mangled impl 方法 first-wins**（`CCtx.emitted_fns`，与 LLVM 符号 uniquing 等效语义；根因 mangling 歧义 = audit #244）

**已定语义对齐细节（step 5 落地，2026-07-11 沉淀）**：
- **closure ABI**：`{fn_ptr, env}` 对（typeid 7）+ `{i64 count, slots...}` env（typeid 15），布局与 LLVM/runtime 一致；调用位渲染为函数指针 cast 调用，cast 形参数由调用位决定（与 LLVM call-site fn_ty 同构）。裸函数值（零 dict）统一包 thunk closure（LLVM FnType fallback parity）
- **嵌套函数发射 bracket**：`c_push_fn`/`c_pop_fn`（LLVM builder save/restore 的 C 等价物，#198 家族防护）
- **impl trait dict build fn 预注册**（对 LLVM lazy 链的**有意偏离**）：forward pass 预注册全部 impl trait dict（`CCtx.dict_build_fns`），getter 内容与 decl 顺序无关——规避 LLVM 的 decl-order 缺陷（audit #249）；derived dict 按 LLVM 同序 emit，手写 impl 优先
- **derived clone 签名与 checker scheme 对齐**（接收 dict 参数 body 忽略；LLVM 靠静默多传参掩盖 = audit #248）
- **trait 方法序 / supertrait DFS 序**：从 `hir.ring` 单一来源消费（`scan_trait_method_order` / `collect_all_supertraits`）

**已定语义对齐细节（step 6 落地，2026-07-12 沉淀）**：
- **abort/catch = inline setjmp/longjmp**：C 用 `<setjmp.h>` 标准宏（clang 自动处理 Win-x64 帧指针 ABI；LLVM 侧是手工 `_setjmp` + frameaddress，同一管线路径）；setjmp 只出现在 if 完整控制表达式位（C11 7.13.1.1p5）
- **tail-resumptive = evidence struct** `{i64 count, slots...}`（typeid 21），slot 序走 `hir::effect_op_slot` 契约；B-096 drop / B-097 default 合并 / B-161 sibling 重定向 / B-100 Fix 7 逐条对齐
- **default evidence**：C 为独立合成函数 `__ring_default_evidence_init()` + static 全局（LLVM 在 main entry 内联构造），语义相同的形态偏离
- **cleanup stack 按嵌套函数隔离**（`c_push_fn`/`c_pop_fn` 保存清空/恢复）——对 LLVM 的有意正确性偏离（LLVM gen_lambda 泄漏 = audit #253）
- **catch 穷尽失败发 `ring_panic`**（LLVM unreachable）——match 家族同款稳健性偏离；evidence drop 按唯一 C 变量名记账（嵌套同 effect 不双 free）；`<setjmp.h>` 无条件进 preamble（确定性优先）
- **LLVM_SKIP 重评估遗留处置（后续波）**：default_effect_topo / exhaustive_generic_payload / map_hof / map_ufcs_bug 四用例 C 下 PASS——需 runner 支持"LLVM 例外但 C 跑"的分化后挪出；其余同构失败条目保持 SKIP（共享层缺陷，证据在 audit #219/#220/#221）

### 2.2 移植顺序（叶到根，每步 golden 子集验收）

1. 模块骨架：codegen_c_ctx / 类型布局映射 / runtime 函数声明生成
2. 字面量 + 算术/比较 + 局部变量 + 函数调用
3. 控制流：if/while/for/block 表达式
4. struct/enum 构造 + 字段访问 + match 编译（现 match 策略逻辑可复用，只换发射）
5. closure / trait dict / evidence passing 调用序列
6. effect handler（tail-resumptive + abort）+ catch
7. Perceus RC 标注消费（dup/drop 调用点发射）+ emit_drop_functions
8. extern fn / FFI 声明、emit_c_main、模块初始化
9. 自编译冲刺：ring.exe --target=c 编译编译器自身

### 2.3 验证策略

- **双后端差分（本期核心红利）**：移植期间 LLVM 后端保留为 oracle。每个用例 C/LLVM 双后端编译运行，输出 diff = 0（LLVM_SKIP 用例除外）。这是 JS 退役后第一次重新拥有双信道。
- Golden 210+ 快照全量复用（断言程序输出，后端无关）。
- **×3 规则照旧**：涉及 RC 的每步 ×3 跑全套；ASan gating 档随内循环，capstone 全量过夜在自编译冲刺后跑一次。
- Worktree 规则照旧；native-debug 任务不走 worktree 隔离（workflow.md）。
- #219-#222（LLVM_SKIP 的 runtime crash 用例）在 C 后端下逐个重评估——预期部分被移植顺带修复，仍挂的转成 C 后端 bug 条目。

### 2.4 验收标准（Phase 1 整体）

- 全部 E2E + golden 套件在 C 后端通过
- 双后端差分 diff = 0（除显式 skip 清单）
- **self-compile via C 后端 ×3，.c 文本字节一致**（B-155 验收的升级版）
- ASan capstone 全量通过
- 自编译耗时回填实测数（预期单 .c clang -O2 增加数十秒量级；若不可接受，内循环降 -O1 / 拆分提前，作为 tuning 决策上报）

### 2.5 移植注意事项（B-152 P3 反馈回流，2026-07-10 Discussion 拍板）

1. ~~trait-bounded impl 方法 dict 转发 bug（B-152 P3 遗留，step 5 时调查）~~ **✅ 调查完成（2026-07-11 step 5）**：HEAD 无法复现——双后端五场景 probe + Map Ring 路径 probe 全绿，共享层无缺陷。闭环实验（删 Map method_to_runtime + ring_map_* shim → 关 B-152 P3 遗留验收）**留 step 9 自编译后做**（self-compile via C 是最终判据）。
2. ~~trait_method_order 不复制双层注册模式~~ **✅ 落地（2026-07-11 step 5）**：trait 方法序单一来源 = `hir.ring`（`scan_trait_method_order` 内建 seed + `collect_all_supertraits` DFS 序跨阶段契约），C 后端零本地注册表。**注意**：LLVM 侧私有副本（`scan_trait_decls` / `collect_all_supertraits_llvm`）未切换（避免触碰重编敏感面，逻辑逐字一致），Phase 2 随退役删除；在此之前新增内建 trait 需 hir.ring seed + LLVM 副本两处同步。
3. **step 6 catch arm 必须接入嵌套模式检查（audit #246，2026-07-11 #245 worker 发现）**：LLVM catch lowering 对 ctor arm 只做顶层 tag 测试即 bind——`check_nested_ctor_tags` 从未接入 catch 路径，嵌套 ctor tag / literal 子模式全都不查（`catch { MyErr(0) => .., MyErr(n) => .. }` 疑似 wrong-code）。C 后端移植 catch（step 6）时**直接接入 `check_c_nested_ctor_tags`**（#245 修复后已覆盖 tag/literal/tuple 递归全族），勿 faithful port 此缺陷；LLVM 侧同步修复见 #246，两后端 diff=0 验收。

---

## 3. Phase 2 — parity 认证 + LLVM-C 后端退役

复用 B-100 (Z) 策略：覆盖矩阵 → gap 修复 → 对抗 review → 全绿。

**退役清单**：
1. tag `llvm-c-backend-final` 归档
2. 删除 codegen_llvm*（5 模块）+ llvm_ffi.ring + llvm-addon 依赖 + `-lLLVM-C` 链接
3. dist-c/（冻结 .c 文本 + 构建脚本）成为 stage 0 信任锚；dist/（JS）+ dist-llvm/ 的去留单独上报用户拍板（建议：tag 后删除，紧急回退靠 tag checkout）
4. CI：bootstrap 一致性检查重新启用（.c 文本 diff，比 .o 比较更强）

**文档 bookkeeping**（全部完成才算关单）：
- CLAUDE.md：技术栈 / 项目结构 / 编译器管线 / 常用命令 / ASan 章节
- README：后端描述
- backlog「架构：后端策略」章节改写（C 唯一后端 + LLVM 归档 + 重启 gates 指针）
- design.md：后端章节改写 + 公理仲裁决策表加一行（本决策 dossier：B-155 调查记录 + 本文档 §0）
- 本文档删除

---

## 4. Phase 3（远期决策记录，不立项）— LLVM target 重启 gates

> 记录于此供未来引用；届时走 philosophy.md 修宪程序级 dossier。

**触发条件**（任一，需实测证据非直觉）：
- **性能**：代表性负载上 C 后端与手写 C 差距经归因分析确认受限于 C 不可表达层面（跨函数尾调用保证、精确寄存器/调用约定控制、LTO 粒度），且 clang 侧无解
- **调试**：Ring 级 DWARF 变量信息（#line 只给行映射）成为用户面刚需
- **平台**：目标平台无成熟 C 工具链

**前置条件**：
- 验证基建成熟：golden + 双后端差分 harness + codegen property fuzz（随机良类型程序双后端差分）
- **C 后端永久保留为参考后端**（差分 oracle + stage 0 信任锚）。LLVM 是"第二后端"，不是"替代"——不再出现单后端不可审计状态

**形态约束（B-155 教训条款）**：
- 重启时发射**文本 .ll**，编译器进程内零 FFI、零 in-memory IR 构建。B-155 的教训是信道（FFI marshalling × RC 生命周期 × 不可读产物），不是 LLVM 本身

### 自有后端（Ring native codegen）的角色约束

> 2026-07-10 Discussion 拍板。适用于任何"Ring 自己发射机器码"的未来提案（含 backlog「已排除的后端」中 QBE(Ring) 远期愿景的角色修正）。

**定位：第三信道 / 信任锚，永不担任生产后端，也不是 LLVM 重启的替代方案。**

论证（压缩版，防止未来讨论重新踩一遍）：
- **所有权 ≠ 信任**。LLVM-C codegen 五个模块是完全自有的，B-155 污染照样发生——且正因为全链自有，没有外部参照物能指认"正确长什么样"。Trusting trust 的要点即：自举链是信任问题的来源，不是解药。
- **自有后端 = 编译器的自证清白**。生成者与验证者同源，错误相关；"不可靠信道的叠加无法变得可靠"对编译器自身同样成立。
- **正解是多样性（Diverse Double-Compiling），其前提是多个独立信任根**。C 后端把生成代码接入 clang/gcc/MSVC 三个独立消费者；Ring-only 后端把信道收敛回一条，拓扑上倒退回 B-155 前夜。
- **"完全掌控"是渐近线**：后端之下还有 linker/loader/OS/微码/硅片，链条必然在某层落回"信任别人"，落点处的机制仍是多样性 + 可复现性。

**若未来实施，形态必须满足**：
1. **刻意朴素、显然正确、不求性能**——naive codegen，代码量以"一个人一个下午能审完一遍"为量级目标；任何性能优化提案自动否决（复杂化侵蚀"显然正确"即失去存在意义）
2. 职责仅限：参与多后端差分、DDC 不动点比对、作 bootstrappable 信任种子
3. 不进入用户面工具链，不承担 CI 主路径
4. 立项走修宪程序级 dossier

**掌控构建链的正确阶梯**（替代"自有后端 = 终点"叙事）：可复现构建（确定性 .c + 钉死 clang 版本 + 哈希记录，C 后端自带）→ gcc/MSVC 例行交叉差分 → DDC 按需执行 → 信任种子后端（本节，远期）。

---

## 5. 风险清单

| 风险 | 应对 |
|------|------|
| Phase 0 发现活 bug 而非纯污染 | 方向 C 审计并入执行；C 后端仍推进（消灭 marshalling 层），通用 RC 排序 bug 单独修 |
| 移植期双后端行为差异难仲裁 | 以语义测试预期为准（golden .expected 是规约）；两后端都错的场景补 E2E |
| 自编译耗时回退 | 实测回填；内循环 -O1 / 提前拆分作为 tuning 上报 |
| fail/abort 机制在 C 映射不顺 | worker 先读现实现，遇设计分歧走 waiting-feedback，不自行发明 |
| B-152 RIIR 剩余阶段（P4 Set / P1s2 Str / P5）与本计划撞车 | 建议 B-152 剩余暂停，B-163 完成后在 C 后端上继续（RIIR 纯 Ring 代码天然跨后端，损失小） |
