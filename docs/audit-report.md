# Audit Report

> 活的 bug 看板。修复后删除条目，只在 git commit message 留记录。
> 条目格式：`### #xxx <标题> [严重度] [dispatch] [状态]`
> dispatch 标记：`mechanical`（路径唯一，可直接执行）/ `judgment`（需要跨模块推理、Argument 或独立 review）
> 状态流转：`open` → `doing` → 删除
> 工作流规范见 `docs/workflow.md`

---

## 前端

### #261 编译器自身间歇 AV（exit 3221225477）底噪 ~1 次/全量轮，先于 B-107 分支存在 [medium] [judgment] [open]

2026-07-31 B-107 merge 门禁的 main 基线 ×3 实测定量：a511d50 时代 ring.exe（= B-107 分支分叉点）跑全量套件，AV 频次 round1=0 / round2=2（`closure_capture_loop`、`supertrait_evidence`）/ round3=1（`struct_basic`——最基础用例也能炸）；B-107 worktree 侧另有独立观测（`adversarial_method_set_all`、`effect_custom_typed` 各 1 次）。用例无规律、复跑即过——是编译器进程自身的间歇堆损坏，非被测程序缺陷；历史「间歇 AV 复跑即过」流程豁免对应的正是这个从未立案的问题。

**影响**：CI/自编译假红；更深层是历史 compiler 曾存在真实内存错误，不能排除同根源有静默产物路径。旧 LLVM verify/emit finding 已随 lane 退役删除，不再作为当前归因候选；现只按下方 C-only 重分类门判断是退役信号还是共享层/RC blocker。

> **2026-07-31 补充观测（B-107 merge 收官轮，merged 编译器）**：单轮 3 AV——`adversarial_dispatch_option_and_then`、`adversarial_effect_multi_delegate`、`generic_ord_dispatch`，全部 dict/dispatch 族聚集（B-107 动过 dict evidence 面），高于基线 ~1/轮但单轮样本不足定论；B-107 worktree 干净 ×3 的 AV 用例（effect/range/catch/reexport 族）无此聚集。#265 修复后的全量轮继续记录：若 dict 族聚集复现，优先用 ASan gating 跑该三用例。

> **2026-08-01 takeover 补充观测（#266/#259 merged 编译器）**：聚合轮在 LLVM golden 的 `closure_capture_nonloop` 出现唯一一次无诊断 `0xC0000005`，随后同用例隔离 ×3 全绿；其余在外层 30 分钟限额前完成的 e2e / golden / RC / self-compile 前两轮累计 1338 pass / 7 contract skip，未见 dict 族聚集。信号与本条既有随机、复跑即过基线一致，原始失败保留，不以整轮重跑抹除。

> **2026-08-01 tuple/structural merge 补充观测**：完整轮唯一失败为 LLVM golden `trait_default_method.ring` 无诊断 `0xC0000005`，隔离 ×3 全绿；全轮其余 1438 pass / 8 contract skip，self-compile 三代一致，未见 tuple/structural 或 dict 族聚集。原始失败与日志保留，不以隔离复跑替代全轮结论。

> **2026-08-03 C-only 重分类门**：LLVM/`dist-llvm` 已从 main 退役，上述样本只能证明历史 lane 曾存在随机 AV，不能证明当前 `dist-c` compiler 仍受影响。B-163 收官先用 clean-clone C-only compiler 跑全套 ×3，并对历史高频 dict/effect/closure fixture 跑 ASan gating；零复现且进程/产物 hash 稳定则以“退役 lane 信号消亡”关闭，任一 C-only AV 或不稳定产物则立即升级为 critical release blocker 并保留 alloc/free 栈。

发现者：Repository Steward main 基线 ×3 定量

### #267 Unit-return effect op 的 arm 值在 perform 点必然泄漏（EffectOp 保守不 drop 家族）[low] [judgment] [open]

2026-07-31 #265 review 发现并记录：tail-resumptive handler 中 Unit-return op 的 arm 值（如 arm 尾值为 Str）按语句语义丢弃，但 arm body 以 escape=true 处理（perceus.ring:2519 附近，行号=立案时）owned 返回，perform 点的 EffectOp 值被 Perceus 有意不 drop（"leak, crash-free"）——豁免使该必然泄漏形态重新合法化。非新泄漏类：非 Unit op 的语句位丢弃同形态既有。与 #217（block-expr/IIFE 临时值无 HIR 层 drop）同族。

**修复方向**：EffectOp 结果在 Unit 消费位补 drop（需与 handler evidence 生命周期协调）；或并入 #217 的统一临时值 drop 方案。回归：`handler_unit_op_arm_discard.ring` 已锁行为，泄漏侧待 RC sweep 覆盖（该 fixture 在 tests/cases/ 非 llvm/，不进 rc lane）。

发现者：#265 独立 review

### #262 derived Hash/Eq 泛型嵌套字段每次调用现场构造/回收动态 wrapped dict [medium] [judgment] [open]

2026-07-31 B-107 merge review（b973859）发现：`Outer<T>` 的嵌套泛型字段（如 `Inner<Inner<T>>`）每次 `hash()`/`eq()` 都经 `resolve_derived_extra_dicts` 现场构造 dynamic wrapped dict（dict+closure+env 三次 alloc/method slot）再由当前 C `emit_c_derived_dict_call` 路径 drop。Map/Set 探测是热路径——探测一次 = 每层泛型字段一轮 alloc/free。`dict_lower.ring:36-38` 注释自认只 memoise 全 static wrapper。功能正确（128 轮循环测试验证），纯 perf；是否优先由 B-181 生成程序 allocation baseline 决定，不与 B-176/B-180 的工具链反馈专项混排。

**修复方向**：dynamic wrapped dict 的 per-callsite/per-monomorph 缓存，或在 derived 方法入口一次构造复用。

发现者：B-107 merge 独立 review

### #263 `ImplDictBound.type_param_index` 假设 impl 头参数与类型声明参数位置一致 [medium] [judgment] [open]

2026-07-31 B-107 merge review（b973859）发现：`resolve_named_impl_dict_ref`（infer_ctx.ring ~825，行号=立项时）用 impl 侧 index 直接取用点类型的 `type_params[i]`——`impl<A,B> Trait for Foo<B,A>` 形态会取错 evidence。`env.ring:100-102` 注释自认不完整。旧代码更糟（所有参数套同一 trait），新代码是净改善，但该假设现在承载 runtime evidence 正确性。

**修复方向**：按 impl 头类型实参到声明参数的映射重排 index；补 reorder 形态的行为/负面测试。

发现者：B-107 merge 独立 review

### #264 derived hash 对缺失字段/未知 enum tag 静默降级（失真不响）[medium] [judgment] [open]

2026-07-31 B-107 merge review（b973859）发现当前 C derived hash 两处防御性静默，与公理④「失真必须响」相悖：① `emit_struct_hash_fn` 对 field name 查不到时 `if field_idx >= 0` 静默跳过该字段——「Eq 区分、hash 相同」的静默失真（Eq/Ord 也有同型旧模式）；② enum hash 的 default 分支（未知 tag = 内存损坏时）静默返回 `DERIVED_HASH_SEED` 而非 panic。**修复方向**：两处统一 fail-loud（panic）并排查 Eq/Ord 同型位置；以 C golden/structural gate 锁定未知字段/tag 失败路径。

发现者：B-107 merge 独立 review

## Runtime


### #260 `json_stringify<T>` 的 native runtime 无条件按 Str 解引用 [critical] [judgment] [open]

2026-07-29 B-107 HOF 正式门禁发现并由 direct-call 对照确认：`std/io.ring` 与语言规范公开声明 `json_stringify<T>(value: T) -> Str`，但 native `ring_json_stringify(void*)` 除 null 外无条件把参数转成 `RingStr*`。当前 C-native 安全源码直接执行 `json_stringify(107)` 时，会把 tagged Int `0xD7` 当字符串指针解引用并以 `0xC0000005` 崩溃；不需要一等函数或字典传递即可触发。

**修复约束**：公开签名与 native 实现必须一致。若保留 `<T>`，需设计可证明覆盖所承诺类型的序列化/type-evidence 或单态 type-directed lowering，并让直接调用与一等 extern wrapper 共用同一路径；若只支持 Str，则必须收窄标准库签名和规范，不能继续让 checker 接受会越界访问的安全程序。验收至少覆盖 Int/Float/Bool/Str、直接调用/一等函数值、C-native/structural/self-host，并对不支持的结构类型给出编译期诊断而非 runtime UB。任何收窄公开签名的候选先形成用户决策包。

发现者：B-107 HOF implementation + independent review


### #227 drop_closure_env / drop_dict / drop_evidence 三函数体完全相同 [medium] [mechanical] [open]

`ring_runtime.cpp:3212-3276`：三个 drop 函数实现逐字节相同——读 count-prefixed 数组，逐 slot 调 ring_drop。每个约 8 行，总共 24 行做同一件事。

**修复方向**：提取 `drop_counted_slots(void* data)` 共享函数，三处调用。

发现者：Opus+DS

### #228 ring_str_join / ring_list_join 相同实现参数反序 [low] [mechanical] [open]

`ring_runtime.cpp:766` vs `ring_runtime.cpp:3338`：两个函数实现完全一致，仅参数顺序不同——`ring_str_join(sep, list)` vs `ring_list_join(list, sep)`。

**修复方向**：一个调用另一个即可。

发现者：Opus
### #229 CHK/CHK_ARG 永久禁用宏 + 16 调用点死代码 [low] [mechanical] [open]

`ring_runtime.cpp:565-566`：`CHK(name)` 和 `CHK_ARG(name, arg)` 定义为 `do {} while(0)`（注释 "retired after #134 hunt closed"），但 16 个调用点散布在 ring_list_*、ring_map_*、ring_print 等函数中。纯视觉噪音。

**修复方向**：删除宏定义及全部 16 个调用点。

发现者：DS

### #231 magic number 4096 用于 drop_table / never_drop_table [low] [mechanical] [open]

`ring_runtime.cpp:120,133,284`：数组大小和边界检查中多处使用未命名常量 `4096`。

**修复方向**：定义 `#define RING_MAX_TYPEIDS 4096` 统一引用。

发现者：Opus

### #232 _ReturnAddress() 无跨平台守卫 [low] [mechanical] [open]

`ring_runtime.cpp:338,345,381,669,2337,2353`：`_ReturnAddress()`（MSVC intrinsic）在 `RING_BOX_PROFILE` 和 `RING_RC_DEBUG` 块内使用，但无 `_WIN32` 守卫。Linux/macOS 启用这些调试宏时编译失败。B-175 已把 Linux 纳入 preview CI，本条不再是“仅 Windows、影响有限”的潜伏清理；profiling/RC debug 是 release 性能与内存归因信道，须在跨平台基线前修复。

**修复方向**：添加 `#ifdef _MSC_VER ... #else __builtin_return_address(0) #endif` 宏。

发现者：DS


## Native codegen 与 RC

### #255 `impl Drop for <enum>` 的用户 drop 从不被调用 [critical] [judgment] [open]

checker 对 enum 的 `impl Drop` 照常收进 `drop_types`（E0801 move 语义生效），但当前 C drop glue 的 enum 路径只做 payload 递归 drop，**用户 drop body 静默不执行**（用户以为 RAII 生效实则没有）。这是现行 C-only 产品路径的直接 correctness blocker，不再保留旧 oracle parity 叙述。

**修复方向**（解法明确）：C enum drop fn 在 tag switch 前插入用户 drop 调用（对齐 struct 路径）并锁定 enum 变体持资源、用户 drop 与 payload drop 的精确顺序；与 B-168/B-002 的 failure cleanup 共享同一 Drop identity，不在 runtime 另造特判。

发现者：step 7 worker（feedback 分诊）

### #256 Result 壳 RC 归零时 payload 不递归释放 [critical] [judgment] [open]

当前 C drop glue 对 `Result` 仍沿用“由 runtime 处理”的 skip，但 **runtime 没有 `drop_result`**（对照：Option 有固定 drop 路径）——Result 对象 RC 归零时只 free 外壳，ok/err payload 不递归 drop。

**修复方向**：在“共享 enum drop glue”与“固定 runtime typeid drop”两候选间做 bounded Argument，优先减少 builtin 特例并与 B-152 RIIR 终态一致；无论选择哪条，Result/Option/普通 enum 的 drop identity 必须唯一，修复后跑 RC 泄漏敏感 golden ×3、ASan 与 self-host fixed point。

发现者：step 7 worker（feedback 分诊）

### #244 checker 级 mangling 歧义：用户 enum 遮蔽 prelude 类型时 impl 方法同名碰撞 [medium] [judgment] [open]

用户自定义 `enum Result` + `impl Result { and_then }` 与 prelude `std/result.ring` 的同名方法都 mangle 成 `ring_Result_and_then`——共享 codegen identity 未区分用户类型与被遮蔽的 prelude 类型。当前 C `CCtx.emitted_fns` 采用 first-wins 缓解，函数 body/prototype 与 evidence metadata 仍可能来自不同声明；重名双方 effect row 不同时会形成原型/实参不一致。用户 `fn drop_Foo()` 也会与 struct Foo 的生成 drop symbol 碰撞，当前表现为 clang redefinition 硬错误。

**修复方向**：checker/HIR mangling 层让 user/prelude/builtin/module/generated symbol 使用同一唯一 identity 来源；C codegen 只消费该 identity，不做 first-wins 仲裁。歧义存在期间至少发 W/E 级诊断并给 qualified/rename 建议；补同 method 不同 effect、生成 drop collision 与跨模块 shadow 回归。

发现者：step 4 worker（feedback 分诊）

### #257 verify_rc 对同名 local shadow 仍假定共享 alloca [medium] [judgment] [open]

`verify_rc.ring` 的 shadow 检查仍假定同名 local 复用一个 alloca；当前 C codegen 已为每个 lexical binding 分配独立存储并在离开 match / catch / if-let 分支时恢复外层名称。因此合法的 `let x = ...` 后再以 pattern binding shadow `x` 会被误报为 `uaf-shadow-mismatch` / `uaf-drop-borrow`，而 C-native 直接执行结果正确。

**证据**：`compiler/verify_rc.ring:350-365` 的注释和判定仍编码旧假设；含 match / catch / if-let local shadow 的直接 probe 产生 12 条误报，等价的参数 shadow 回归在 C-native 保持外层值。修复应让 verifier 按 binding identity / lexical scope 跟踪，而不是按裸名称合并；不得削弱真实 use-after-free 检查。

发现者：B-163 Phase 2 P2.2 对抗 review

### #217 Perceus 未对 block-expr / IIFE 临时值插入 HIR 层 drop [low] [judgment] [open]

block 表达式作为 if/match 条件（`if { let v = 5; v > 3 } { ... }`）和 IIFE（`(fn(x) { x * x })(5)`）产出的 owned 临时值在 HIR 层无显式 drop。codegen 层正确处理（unbox 后丢弃 / 调用后释放闭包），运行时无泄漏，但 verify_rc 静态检查报 `leak-temp`。

**触发用例**：`expr_block.ring:13,17`、`lambda_closure_effect.ring:26`

**修复方向**：Perceus RC pass 对这两类位置插入显式 `HDrop`——block-expr 在条件位置的结果值、IIFE 的闭包对象。修复后 verify_rc 的 `leak-temp` skip 列表可缩小。

发现者：B-151 CI（Python runner RC sweep 首次全量覆盖暴露）

### #138 str-keyed 容器 clone 方法 dispatch 落 panic-stub [low] [judgment] [open] [latent]

str-keyed `Map.clone()` / `List.clone()` / `Set.clone()` 的方法语法仍缺共享 dispatch；直接调用对应 clone 函数可工作。只跟踪该残留，不保留已修复的 fold/filter/any/all 历史。

**修复方向**：让方法解析与普通函数调用消费同一 HIR/builtin identity；不得按 key 叶名在 C codegen 新增特判。补 int/str/user-keyed 正反回归。

---

## 跨模块代码健康


### #237 45 处 sort_by(compare_by_first) 缺 sorted_entries 工具函数 [low] [mechanical] [open]

2026-08-03 C-only main 复核：`builtins/checker/codegen_c*/derive/exports/infer*/resolver/scc` 共 12 个文件、45 个调用点先复制 entries 再 `sort_by(compare_by_first)`，用于确定性 Map 迭代。旧 LLVM 调用点已随退役消亡，但当前 C/shared 路径的重复量反而已增长，仍有统一 helper 价值。

**修复方向**：添加 `Map.sorted_entries()` 方法到 `std/map.ring`，或在编译器内部提供 `sorted_entries(map)` 工具函数。

发现者：Opus+DS

### #239 DictRef::Wrapped extra_dicts codegen 未消费 [medium] [judgment] [open]

`hir.ring:38-39`：`DictRef::Wrapped` 变体注释明确声明 "codegen ignores extra_dicts — pre-existing gap"。Eq/Ord 二元操作的附加字典从不被 codegen 消费，trait 多态 dispatch 的某些路径可能走不到正确字典。

**修复方向**：让 codegen 消费 BinOp 的 extra_dicts，或在 checker 层拒绝该路径。需先确认是否有测试用例能触发此路径。

发现者：DS

### #240 ForIn 可迭代类型解析嵌套 10+ 层 [low] [judgment] [open]

`infer.ring:296-521`：225 行代码处理 Iterable→Iterator→Item 链解析，嵌套 9+ 层 match。可读性差，难以定位具体类型解析失败点。

**修复方向**：提取 `resolve_iterable_element_type` 函数，使用 early-return 风格扁平化嵌套。

发现者：Opus
