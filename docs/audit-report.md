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

**影响**：CI/自编译假红；更深层是编译器存在真实内存错误，当前仅以崩溃形式暴露（fail loud），不排除同根源存在静默错误产出路径。**归因方向**：ASan gating 档跑受累用例集定位；与 #247/#242（module verification failed 族）是否同根待查。B-163 P2 LLVM 退役后若信号消失可归因 LLVM 信道并关闭；若 C 后端仍现则为共享层/RC 问题升级处理。

> **2026-07-31 补充观测（B-107 merge 收官轮，merged 编译器）**：单轮 3 AV——`adversarial_dispatch_option_and_then`、`adversarial_effect_multi_delegate`、`generic_ord_dispatch`，全部 dict/dispatch 族聚集（B-107 动过 dict evidence 面），高于基线 ~1/轮但单轮样本不足定论；B-107 worktree 干净 ×3 的 AV 用例（effect/range/catch/reexport 族）无此聚集。#265 修复后的全量轮继续记录：若 dict 族聚集复现，优先用 ASan gating 跑该三用例。

发现者：Repository Steward main 基线 ×3 定量

### #267 Unit-return effect op 的 arm 值在 perform 点必然泄漏（EffectOp 保守不 drop 家族）[low] [judgment] [open]

2026-07-31 #265 review 发现并记录：tail-resumptive handler 中 Unit-return op 的 arm 值（如 arm 尾值为 Str）按语句语义丢弃，但 arm body 以 escape=true 处理（perceus.ring:2519 附近，行号=立案时）owned 返回，perform 点的 EffectOp 值被 Perceus 有意不 drop（"leak, crash-free"）——豁免使该必然泄漏形态重新合法化。非新泄漏类：非 Unit op 的语句位丢弃同形态既有。与 #217（block-expr/IIFE 临时值无 HIR 层 drop）同族。

**修复方向**：EffectOp 结果在 Unit 消费位补 drop（需与 handler evidence 生命周期协调）；或并入 #217 的统一临时值 drop 方案。回归：`handler_unit_op_arm_discard.ring` 已锁行为，泄漏侧待 RC sweep 覆盖（该 fixture 在 tests/cases/ 非 llvm/，不进 rc lane）。

发现者：#265 独立 review

### #266 expression merge 静默擦除冲突的 fail payload，使 catch 类型依赖源码顺序 [critical] [judgment] [doing]

2026-08-01 takeover 复核确认：公开 effect 规范要求 `fail<T> ~ fail<U>` 时统一 `T/U`，且实现注释明确采用 single-fail-effect design；当前 `merge_effects` 却只对同名 custom effect 执行硬参数统一。两个分支分别产生 `fail<Str>` / `fail<Int>` 时，后一 payload 的统一错误被 best-effort 路径吞掉，随后 `row_merge` 按 kind 去重并静默删除它。

仅交换分支顺序即可让同一显式 `with {fail<Str>}` 程序在“接受 / E0301”之间变化；无显式 effect 注解时，`catch` 绑定值也会随分支顺序被静态认成 `Str` 或 `Int`。这会让安全源码跨越错误的 payload 类型边界，属于类型健全性回归，不是契约空白。历史 #114 已要求合并 fail payload；本条曾在 `ce75122` 立案，后续删除时没有对应修复、证伪或 duplicate mapping，现恢复接管。

**修复约束**：对同 kind `FailEffect × FailEffect` 恢复硬 `unify_effect_params` 与 E0301/E0302；保留 `mut<T>` 多实例并存语义和 #265。回归至少锁定两种分支顺序、同 payload / TypeVar 正例及 `mut_row_multi_instance.ring`。

发现者：takeover root 复核 + 独立 skeptic

### #262 derived Hash/Eq 泛型嵌套字段每次调用现场构造/回收动态 wrapped dict [medium] [judgment] [open]

2026-07-31 B-107 merge review（b973859）发现：`Outer<T>` 的嵌套泛型字段（如 `Inner<Inner<T>>`）每次 `hash()`/`eq()` 都经 `resolve_derived_extra_dicts` 现场构造 dynamic wrapped dict（dict+closure+env 三次 alloc/method slot）再 drop（`emit_dict_hash_call`/`emit_c_derived_dict_call`，双后端同型）。Map/Set 探测是热路径——探测一次 = 每层泛型字段一轮 alloc/free。`dict_lower.ring:36-38` 注释自认只 memoise 全 static wrapper。功能正确（128 轮循环测试验证），纯 perf。

**修复方向**：dynamic wrapped dict 的 per-callsite/per-monomorph 缓存，或在 derived 方法入口一次构造复用。

发现者：B-107 merge 独立 review

### #263 `ImplDictBound.type_param_index` 假设 impl 头参数与类型声明参数位置一致 [medium] [judgment] [open]

2026-07-31 B-107 merge review（b973859）发现：`resolve_named_impl_dict_ref`（infer_ctx.ring ~825，行号=立项时）用 impl 侧 index 直接取用点类型的 `type_params[i]`——`impl<A,B> Trait for Foo<B,A>` 形态会取错 evidence。`env.ring:100-102` 注释自认不完整。旧代码更糟（所有参数套同一 trait），新代码是净改善，但该假设现在承载 runtime evidence 正确性。

**修复方向**：按 impl 头类型实参到声明参数的映射重排 index；补 reorder 形态的行为/负面测试。

发现者：B-107 merge 独立 review

### #264 derived hash 对缺失字段/未知 enum tag 静默降级（失真不响）[medium] [judgment] [open]

2026-07-31 B-107 merge review（b973859）发现两处防御性静默，与公理④「失真必须响」相悖：① `emit_struct_hash_fn`（LLVM/C 同型）对 field name 查不到时 `if field_idx >= 0` 静默跳过该字段——「Eq 区分、hash 相同」的静默失真（同型旧模式在 Eq/Ord 也存在）；② enum hash 的 default 分支（未知 tag = 内存损坏时）两后端静默返回 `DERIVED_HASH_SEED` 而非 panic。**修复方向**：两处统一 fail-loud（panic）；顺带排查 Eq/Ord 同型位置。另记录：`map_set_for_each` golden 弱化为 order-independent 总长（Set 迭代序 unspecified 口径），跨后端一致性由 `derive_hash_set` hash 值 golden 兜底——已接受，无行动项。

发现者：B-107 merge 独立 review

### #259 inline mod 短类型别名泄漏使顶层显式注解发生 registration/check 身份分裂 [critical] [judgment] [doing]

2026-07-29 B-107 HOF 门禁实锤：文件先声明 raw `extern type Item`，后有 inline mod re-export 普通 `origin::Item`，顶层 `keep_raw(value: Item) -> Item` 会先注册为 `(raw Item) -> raw Item`，最终却导出成 `(raw Item) -> origin::Item`。若调用方把 `ring_raw_alloc` 的无 RC header 指针传入该函数，HIR 与公开 scheme 对 nominal identity 的分歧可使 Perceus/codegen 对 raw 指针执行 `ring_dup` / `ring_drop`，存在越界 header 读写和内存破坏风险。

首次污染链：`infer_register.ring::register_fn_common` 在 registration 阶段正确解析 raw/raw；`infer_decl.ring::check_mod_decl` 调用 `resolve_mod_uses` 后不恢复 inline mod 的短类型别名，令 `types.structs["Item"]` 指向普通 nominal；随后 `check_fn_decl` 二次解析显式参数/返回注解为 normal/normal。`rebind_fn_type` 对参数保留 registration skeleton，却直接用 check-time return 生成 `mapped_ret`，于是发布 raw/normal；`exports.ring` 只转发该已污染 scheme，并非首次污染点。

**修复约束**：显式类型注解必须在同一 lexical type context 下绑定一次并保持 exact nominal identity，或让 inline mod 的短类型别名按 lexical scope 恢复。禁止只让 rebind return 保留 registration type：那会掩盖 scheme 分裂，但 HIR 参数、返回与函数体此前已按错误 normal identity 检查。验收至少覆盖 raw extern / 普通 struct 同叶、inline re-export 位于顶层函数前后、直接调用与一等函数值、C/LLVM/diff 以及 raw alloc/dealloc 路径的 RC 文本/运行检查。

发现者：B-107 HOF implementation + independent review

> **2026-07-31 B-107 Unit 3 merge 后注记**：Unit 3 的 delta journal frame 进出（value + 七类 type-like alias 恢复）与 `ModuleImplFact` 导出通道可能已修复本条的污染链；`inline_pub_use_namespaces` fixture 部分覆盖该场景但未含 raw extern type 同叶形态。下一 wave（C′ 主体，同在 resolver/frame 域）必须先按本条原始场景构造精确复现：已修则补回归 fixture 后关闭，未修则按修复约束实施。不得未验证即关闭。


## Runtime


### #260 `json_stringify<T>` 的 native runtime 无条件按 Str 解引用 [critical] [judgment] [open]

2026-07-29 B-107 HOF 正式门禁发现并由 direct-call 对照确认：`std/io.ring` 与语言规范公开声明 `json_stringify<T>(value: T) -> Str`，但 native `ring_json_stringify(void*)` 除 null 外无条件把参数转成 `RingStr*`。安全源码直接执行 `json_stringify(107)` 时，C 与 LLVM 后端均把 tagged Int `0xD7` 当字符串指针解引用并以 `0xC0000005` 崩溃；不需要一等函数或字典传递即可触发。

**修复约束**：公开签名与 native 实现必须一致。若保留 `<T>`，需设计可证明覆盖所承诺类型的序列化/type-evidence 或单态 type-directed lowering，并让直接调用与一等 extern wrapper 共用同一路径；若只支持 Str，则必须收窄标准库签名和规范，不能继续让 checker 接受会越界访问的安全程序。验收至少覆盖 Int/Float/Bool/Str、直接调用/一等函数值、C/LLVM/diff，并对不支持的结构类型给出编译期诊断而非 runtime UB。

发现者：B-107 HOF implementation + independent review


### #226 Map<Int>/Map<Str> + Set<Int>/Set<Str> 按 key 类型 ~700 行重复 [medium] [judgment] [open]

> 2026-07-10 更新：Map 半已被 B-152 P3 消除（`ring_map_int_*` 现为单行 redirect 到统一 shim）。剩余 = Set 半（`RingSetInt` 仍是 `RingSet` 的独立 STL 实现，~250 行，ring_runtime.cpp:2079 起）。

`ring_runtime.cpp`：Set<Int> 是 Set<Str> 的逐行拷贝（~250 行），逻辑相同仅 key 类型不同。修改 Set 行为需同步两份代码。

**修复方向**：B-152 P4（Set RIIR，暂停中，B-163 后恢复）会整体消除——届时本条目随 P4 关单，不单独修。

发现者：Opus

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

### #230 ring_alloc + placement new 样板模式 55+ 处 [low] [mechanical] [open]

`ring_runtime.cpp` 中约 55 处 `void* data = ring_alloc(sizeof(std::string), RING_TYPEID_STR); new (data) std::string(...)` 两行样板。List 类型约 21 处同理。

**修复方向**：提取 `ring_new_str(...)` / `ring_new_list()` 内联帮助函数。注意 B-152 RIIR 会重写容器——可推迟。

发现者：Opus

### #231 magic number 4096 用于 drop_table / never_drop_table [low] [mechanical] [open]

`ring_runtime.cpp:120,133,284`：数组大小和边界检查中多处使用未命名常量 `4096`。

**修复方向**：定义 `#define RING_MAX_TYPEIDS 4096` 统一引用。

发现者：Opus

### #232 _ReturnAddress() 无跨平台守卫 [low] [mechanical] [open]

`ring_runtime.cpp:338,345,381,669,2337,2353`：`_ReturnAddress()`（MSVC intrinsic）在 `RING_BOX_PROFILE` 和 `RING_RC_DEBUG` 块内使用，但无 `_WIN32` 守卫。Linux/macOS 启用这些调试宏时编译失败。当前仅目标 Windows，影响有限。

**修复方向**：添加 `#ifdef _MSC_VER ... #else __builtin_return_address(0) #endif` 宏。

发现者：DS


## LLVM Codegen

### #255 `impl Drop for <enum>` 的用户 drop 从不被调用（两后端一致的既有 gap）[critical] [judgment] [open]

> 2026-07-12 B-163 step 7 worker 发现（C 侧按 oracle parity 照搬保持 diff=0，两侧都缺）。

checker 对 enum 的 `impl Drop` 照常收进 `drop_types`（E0801 move 语义生效），但 LLVM `emit_drop_functions` 只在 struct 循环里查 `drop_types` 调用户 drop——enum 循环只做 payload 递归 drop，**用户 drop body 静默不执行**（静默资源泄漏：用户以为 RAII 生效实则没有）。C 侧 step 7 忠实移植同 gap。

**修复方向**（解法明确）：两后端 enum drop fn 里 tag switch 前插用户 drop 调用（对齐 struct 循环的处理）+ E2E 锁定（enum 变体持资源 + impl Drop 触发顺序）。双后端同修保持 diff=0。

发现者：step 7 worker（feedback 分诊）

### #256 Result 壳 RC 归零时 payload 不递归释放（两后端同构泄漏）[critical] [judgment] [open]

> 2026-07-12 B-163 step 7 worker 发现（skip 集逐一对齐时暴露）。既有行为，非 step 7 引入。

LLVM `emit_drop_functions` 的 enum 循环 skip "Result"（预期 runtime 处理），但 **runtime 没有 drop_result**（对照：Option 有 drop_option 固定 tid 8）——Result 对象 RC 归零时整壳 free、payload（ok/err 内含的堆对象）不递归 drop = 泄漏。两后端同构。

**修复方向**（二选一，倾向 ①）：① runtime 加 `drop_result` 固定 tid 64（对齐 Option 先例，一致性最好；runtime 改动需同步 bootstrap 考虑）；② 两侧 codegen 取消 skip、为 Result 生成 drop fn（零 runtime 改动但两处发射）。修复后跑 RC 泄漏敏感 golden ×3。

发现者：step 7 worker（feedback 分诊）

### #254 LLVM 用户 drop 调用 under-call（evidence 实参缺失，潜伏炸点）[medium] [judgment] [open] [deferred: B-163p2-retire]

> 2026-07-12 B-163 step 7 worker 发现（C 侧已按正确 arity 补齐 evidence 实参，有意偏离）。

`fn drop(self)` 推断带 `{io}` → 原型两参，但 LLVM `emit_drop_functions` 构建用户 drop 调用只传 data_ptr 一个实参——callee 从垃圾寄存器读 evidence 参，io 路径恰好不读所以不炸。**潜伏条件**：drop 方法带「有 default ops 的自定义 effect」且 body 调 op 时，LLVM 读垃圾 evidence 指针即炸；C 侧正确（default evidence 全局或 RING_UNIT）。

**修复方向**：LLVM 侧调用补齐 evidence 实参对齐 C；或不修随 Phase 2 退役消亡。

发现者：step 7 worker（feedback 分诊）

### #252 catch 顶层 TuplePattern / OrPattern 在 LLVM 链路径是静默空分支 [medium] [judgment] [open]

> 2026-07-12 B-163 step 6 worker 发现（#246 修复时的相邻观察，未扩面）。

#246 修复覆盖了 ctor 嵌套 + 顶层 literal，但 LLVM catch 链路径对顶层 tuple/or-pattern arm 仍是 `_ => {}` 空分支——若 checker 放行此类 arm（`fail<(Int,Str)>` 的 tuple 模式），LLVM 侧静默跳过该 arm；C 侧 `emit_c_match_arm` 天然支持，双后端不对称。

**修复方向**：先复核 checker 是否放行 catch arm 顶层 tuple/or-pattern——不放行则本条降级关闭；放行则 LLVM 链路径补支持（对照 match 路径现成逻辑），差分验收。

发现者：step 6 worker（feedback 分诊）

### #253 LLVM gen_lambda 不隔离 handle_cleanup_stack——lambda 内 return 错误发射 catch pop [medium] [judgment] [open] [deferred: B-163p2-retire]

> 2026-07-12 B-163 step 6 worker 发现（C 侧以 `c_push_fn`/`c_pop_fn` 隔离，有意正确性偏离；LLVM 侧未动）。

嵌套函数（lambda/dict getter/thunk）是独立栈帧，lambda body 里的 `return` 不得 pop 外层函数的 catch frame。LLVM `gen_lambda` 未保存/清空 `handle_cleanup_stack`——handler body 的 lambda 内含显式 `return` 时，会在 lambda 帧里错误发射 `ring_catch_pop`（栈不平衡 → 后续 catch 行为未定义）。触发面窄（handler body 内 lambda 显式 return）。

**修复方向**：`gen_lambda` 进入时保存并清空 cleanup stack、退出时恢复（对齐 C 侧 bracket）；或不修随 Phase 2 退役消亡。

发现者：step 6 worker（feedback 分诊）

### #247 合法 match 程序触发 module verification failed（IR 与文本形式不一致，行为正确）[medium] [judgment] [open]

> 2026-07-11 #245 worker 范围外发现（基线 `44e69f9` 对照确认预存在，与 #245 修复无关）。

`fn f(o: Int?) -> Str { match o { some(n) => "n=${n}", none => "none" } }` + main 两次调用即触发 `LLVM module verification failed (1 errors)`。怪异点：dump 的 ring_output.ll 经 clang 解析编译**无错**——in-memory module 与文本形式不一致（疑似空 block / 游离 block 类，#198 builder 簿记家族）；运行输出正确。

**影响**：verify 信道被既有噪声污染——verify 失败无法作为硬门槛（见 #242 扩注的 fail-stop 决策依赖）。**修复方向**：最小复现 → `LLVMVerifyModule` 的具体错误文本定位（action=2 会打到 stderr，先抓全错误内容）→ 定位发射游离/空 block 的路径。注：LLVM 后端 Phase 2 退役后本条随之消亡，但它 gate 着 verify fail-stop 决策，且 Phase 1 期间 LLVM 是 oracle——oracle 自身 verify 不过削弱差分可信度。

发现者：#245 worker（feedback 分诊）

> **2026-07-31 升级注记（#265 修复过程观测）**：含 #258（`6a67552`）的编译器上警告已**全局化**——任何 LLVM build（含 hello.ring）都打印 `LLVM module verification failed (1 errors) — attempting emit anyway`，082f9a7 与 6b1be7d 均复现；退出码与产物行为仍正确。触发源大概率是 #258 的 handler contract 发射模式落入本条的游离/空 block 家族。B-163 P2 期间 LLVM 仍是差分 oracle，全局 verify 噪声进一步削弱 oracle 可信度——若定位成本低应在退役前修，至少定位到具体发射位置再决定修/豁免。

### #248 LLVM derived clone 签名与 checker scheme 契约不一致（静默多传参）[low] [judgment] [open] [deferred: B-163p2-retire]

> 2026-07-11 step 5 worker 发现（clang 在 C 侧把它变成硬错误而暴露；C 侧已修，LLVM 未动）。

checker（`derive.ring` `register_derived_impl`）给 derived clone 注册带 `[T: Clone]` bounds 的 scheme → 调用位按 scheme 传 dict 参数；LLVM `emit_clone_fn` 却用 empty_bounds 生成单参函数——调用位多传 1 个 dict 参数，LLVM-C 不校验、x64 调用约定下静默无害（plan §0.1「类型系统真空」实例）。C 侧修复 = clone 签名与 scheme 对齐（接收 dict 参数，body 忽略）。

**修复方向**：`emit_clone_fn` 传 `di.bounds` 对齐 scheme；或不修随 Phase 2 退役消亡。Phase 1 期间动 LLVM derived 区的任何改动需先修此项。

发现者：step 5 worker（feedback 分诊）

### #244 checker 级 mangling 歧义：用户 enum 遮蔽 prelude 类型时 impl 方法同名碰撞 [medium] [judgment] [open]

> 2026-07-11 step 4 worker 发现（C 侧硬重定义错误暴露；已按 LLVM 等效语义 first-wins 缓解，根因未修）。

用户自定义 `enum Result` + `impl Result { and_then }` 与 prelude `std/result.ring` 的同名方法都 mangle 成 `ring_Result_and_then`——codegen 身份未区分用户类型与被遮蔽的 prelude 类型。LLVM 后端「通过」纯属侥幸（forward pass 重名去重后第二个 body 成死块，调用点全走 prelude 定义，恰好语义相同）；C 后端 `2b85e9f` 起 `CCtx.emitted_fns` first-wins（等效语义，同样是缓解不是修复）。**次生 wrinkle**：`c_declare_fn`/LLVM forward_declare 对重名的 `fn_evidence_params` 是 last-wins（body/proto 是 first-wins）——重名双方 effect 行不同时调用点 evidence 实参数与原型不匹配（现有用例未触发）。

**修复方向**：checker/mangling 层给用户定义类型与 prelude/builtin 类型不同的 codegen 身份（如模块前缀入 mangled name），两后端消费同一来源；歧义存在期间至少发 W/E 级诊断（用户 enum 遮蔽 prelude 类型名）。涉及 checker + hir 共享约定，需设计判断。

> 2026-07-12 同族补充（step 7 worker）：用户 `fn drop_Foo()` mangle 成 `ring_drop_Foo` 会撞 struct Foo 的 drop fn 符号——LLVM 静默 rename 兜底，C 是 clang redefinition 硬错误（更响但报错不友好）。概率极低，随本条 mangling 方案一并解决。

发现者：step 4 worker（feedback 分诊）

### #242 finalize_llvm_module emit 失败后进程退出码仍为 0 [medium] [mechanical] [open]

> 2026-07-11 从 worker feedback 分诊入表（Phase 0 worker 发现冻结 JS 版同病 → 现源码查证同病）。

`codegen_llvm.ring:1759-1764`：`LLVMTargetMachineEmitToFile` 失败只 `eprintln("Failed to emit object file")` 后正常返回，进程 exit 0——脚本/CI 假绿隐患。典型事故：dist-llvm rebuild 时 emit 失败但脚本继续链接旧 main.o，用旧编译器却以为是新的。Python runner 靠 ".o file not found" 兜底，但直接调 ring.exe 的脚本（CLAUDE.md 常用命令、rebuild 流程）无此防护。对照：cli.ring 全部 lex/parse/check 错误路径正确 `exit_process(1)`；C 后端 `codegen_c.ring:69` clang 失败正确 `exit_process(1)`。

**修复方向**（解法唯一）：emit 失败分支加 `exit_process(1)`，对齐 C 后端先例。同函数 verify 失败（L1746，注释明示 attempting emit anyway）与 pass 失败（L1753）是故意继续的既有行为，**保持不动**。注：本条属 codegen_llvm，若不修将随 B-163 Phase 2 LLVM 后端退役消亡；但 Phase 1 期间 LLVM 仍是主力构建路径 + 差分 oracle，1 行修复值得做。

> **2026-07-11 扩注（#245 worker [观察] 分诊）——verify 失败 fail-stop**：invalid IR（duplicate switch case）下 "attempting emit anyway" 实测会**挂死 ring.exe 进程**（滞留占文件锁），违背「失真必须响」。建议 verify 失败直接 fail-stop（exit 非零）而非继续 emit——**但被 #247 gate**：现存在合法程序触发 verification failed 的既有噪声（行为正确的假阳性），先修 #247 才能启用 fail-stop，否则合法程序编译失败。执行序：#247 根因修复 → Steward 通过 Argument/定向回归启用 verify fail-stop（届时本条 emit/verify 两处一并收口）。这是恢复既有诊断保证的内部工程决定；只有接受继续 emit 或降低“失真必须响”门槛才需用户 waiver。

发现者：Phase 0 worker（feedback 分诊）

### #233 method_to_runtime + 4 配套查找链需同步维护 [medium] [judgment] [open]

`codegen_llvm_expr.ring:2776-2891`：5 个独立 if-else 链映射同一组运行时方法（method_to_runtime、method_to_llvm_return_type、method_needs_list_content_type、method_is_void、method_extra_args）。新增一个方法映射需同步修改 5 处，遗漏导致 codegen 错误。

**修复方向**：合并为单一 `RuntimeMethodInfo` 结构体（含 runtime_name, return_type, needs_content_type, is_void, extra_args），单一查找函数返回该结构。

发现者：Opus

### #234 codegen 层硬编码类型名 vs types.ring 常量 91 处 [medium] [mechanical] [open]

`codegen_llvm_expr.ring` 中约 91 处使用原始字符串 `"Int"`, `"Str"`, `"Bool"`, `"Float"`, `"List"`, `"Map"`, `"Set"` 等进行类型判断，而 `types.ring` 已定义 `BUILTIN_INT`, `BUILTIN_STR` 等常量。字符串拼写错误不会被编译器捕获。

**修复方向**：codegen 层统一使用 `types.ring` 的常量。

发现者：Opus

### #235 codegen_llvm_expr.ring 5634 行——编译器最大文件需拆分 [medium] [judgment] [open]

`codegen_llvm_expr.ring` 是编译器最大文件（5634 行），是次大文件（`perceus.ring` 2473 行）的 2.3 倍。包含表达式 codegen、match 编译（~1500 行）、lambda/handler/证据构造、emit_c_main、RC drop 辅助等职责过多。

**修复方向**：沿职责边界拆分——至少拆出 `codegen_llvm_match.ring`（match 编译约 1500 行）和 `codegen_llvm_entry.ring`（emit_c_main + 模块初始化）。

发现者：Opus+DS


### #221 tuple eq dispatch runtime crash [medium] [judgment] [doing]

两个用例 runtime assertion 失败：`tuple_eq.ring`（"tuple eq same values"）、`tuple_eq_struct.ring`（"tuples with equal structs should be equal"）。tuple 的 `==` 派发在共享层有误。

> **2026-07-12 差分证据（B-163 step 6 重评估）**：两用例在 C 后端**同构失败**（同 assertion）——缺陷在**共享层**（tuple `==` 派发），非 LLVM codegen。「LLVM 后端 codegen 问题」表述作废。

> **2026-07-27 部分闭环**：`struct_match_pattern.ring` 的独立根因是 C/LLVM codegen 未检查 struct named-pattern 字段值，且 pattern/arm bindings 会污染后续分支；已由双后端字段递归检查、字段名映射和 lexical scope 恢复修复，并补 match / catch / if-let / nested / or-pattern 回归。该用例已移出本条。

**SHARED_POSITIVE_GAPS**：`tests/cases/tuple_eq.ring`、`tests/cases/tuple_eq_struct.ring`。修好后移除。

发现者：B-151 CI

### #257 verify_rc 对同名 local shadow 仍假定共享 alloca [medium] [judgment] [open]

`verify_rc.ring` 的 shadow 检查仍假定同名 local 复用一个 alloca；当前 C/LLVM codegen 已为每个 lexical binding 分配独立存储并在离开 match / catch / if-let 分支时恢复外层名称。因此合法的 `let x = ...` 后再以 pattern binding shadow `x` 会被误报为 `uaf-shadow-mismatch` / `uaf-drop-borrow`，而双后端直接执行结果正确。

**证据**：`compiler/verify_rc.ring:350-365` 的注释和判定仍编码旧假设；含 match / catch / if-let local shadow 的直接 probe 产生 12 条误报，等价的参数 shadow 回归在 C/LLVM 均保持外层值。修复应让 verifier 按 binding identity / lexical scope 跟踪，而不是按裸名称合并；不得削弱真实 use-after-free 检查。

发现者：B-163 Phase 2 P2.2 对抗 review

### #217 Perceus 未对 block-expr / IIFE 临时值插入 HIR 层 drop [low] [judgment] [open]

block 表达式作为 if/match 条件（`if { let v = 5; v > 3 } { ... }`）和 IIFE（`(fn(x) { x * x })(5)`）产出的 owned 临时值在 HIR 层无显式 drop。codegen 层正确处理（unbox 后丢弃 / 调用后释放闭包），运行时无泄漏，但 verify_rc 静态检查报 `leak-temp`。

**触发用例**：`expr_block.ring:13,17`、`lambda_closure_effect.ring:26`

**修复方向**：Perceus RC pass 对这两类位置插入显式 `HDrop`——block-expr 在条件位置的结果值、IIFE 的闭包对象。修复后 verify_rc 的 `leak-temp` skip 列表可缩小。

发现者：B-151 CI（Python runner RC sweep 首次全量覆盖暴露）

### #29 Runtime 耦合 Node.js ESM（createRequire）[low] [judgment] [open]

可移植性问题。

### #138 Map/Set clone 方法语法在 native 落 panic-stub [low] [judgment] [open] [latent]

**已修复（2026-06-25）**：Map.fold/Set.fold/Map.filter/Map.any/Map.map_values/Set.filter/Set.any/Set.all 全部实现 runtime + 映射。

**残留（latent）**：str-keyed `Map.clone()` / `List.clone()` / `Set.clone()` 方法语法（int-keyed 有映射、str-keyed 落空；直呼 `map_clone(m)` 经 `ring_` fallback 正常）。发现者：B-103 Wave A。

---

## 跨模块代码健康


### #202 LLVM extern 类型重声明分散在 5 个 codegen 文件 [low] [judgment] [open]

`codegen_llvm.ring:18-27`、`codegen_llvm_ctx.ring:6-12`、`codegen_llvm_decl.ring:46-52`、`codegen_llvm_stmt.ring:9-13`、`codegen_llvm_expr.ring:25-31`：每个文件独立重声明所有 LLVM opaque 类型（`LLVMContextRef`/`LLVMModuleRef`/`LLVMBuilderRef` 等）。注释说明是为避免 ESM 跨模块导入问题。导致新增 LLVM-C API 调用需更新 5 处，遗漏则运行时链接错误。

若 ESM 导入问题已解决，应集中到 `llvm_ffi.ring` 统一声明。

发现者：DS


### #205 verify_rc 负面测试套件覆盖不全（22 类中 9 类仍缺专用测试）[low] [mechanical] [open]

覆盖已从 3/22 扩展到 13/22（+10 个新用例）。剩余 9 类均为 fatal 类别，仅从 RC pass 回归触发（非源码 pattern），需要新 mutation 类型支持。

发现者：DS



### #237 34+ 处 sort_by(compare_by_first) 缺 sorted_entries 工具函数 [low] [mechanical] [open]

`checker.ring`, `derive.ring`, `codegen_llvm_expr.ring`, `infer_decl.ring`, `infer_register.ring`, `resolver.ring`, `scc.ring` 等 11 个文件中共 34+ 处使用 `map.entries().sort_by(compare_by_first)` 模式实现确定性 Map 迭代。68+ 行样板。

**修复方向**：添加 `Map.sorted_entries()` 方法到 `std/map.ring`，或在编译器内部提供 `sorted_entries(map)` 工具函数。

发现者：Opus+DS

### #238 collect_all_supertraits_llvm 跨模块拷贝 [low] [mechanical] [open]

`codegen_llvm_decl.ring:22-45`：注释 "Local copy to avoid circular dependency"，与 checker 中的同名函数算法完全相同。变更算法需改两处。

**修复方向**：移至 `codegen_llvm_ctx.ring` 或 `hir.ring` 共享模块，消除循环依赖。

发现者：Opus

### #239 DictRef::Wrapped extra_dicts codegen 未消费 [medium] [judgment] [open]

`hir.ring:38-39`：`DictRef::Wrapped` 变体注释明确声明 "codegen ignores extra_dicts — pre-existing gap"。Eq/Ord 二元操作的附加字典从不被 codegen 消费，trait 多态 dispatch 的某些路径可能走不到正确字典。

**修复方向**：让 codegen 消费 BinOp 的 extra_dicts，或在 checker 层拒绝该路径。需先确认是否有测试用例能触发此路径。

发现者：DS

### #240 ForIn 可迭代类型解析嵌套 10+ 层 [low] [judgment] [open]

`infer.ring:296-521`：225 行代码处理 Iterable→Iterator→Item 链解析，嵌套 9+ 层 match。可读性差，难以定位具体类型解析失败点。

**修复方向**：提取 `resolve_iterable_element_type` 函数，使用 early-return 风格扁平化嵌套。

发现者：Opus

### #192 andor_lower / dict_lower HIR walker 结构性重复 [medium] [judgment] [deferred]

`andor_lower.ring:55-318` 和 `dict_lower.ring:65-431` 包含近乎相同的 HIR 结构遍历器。

**推迟理由**（2026-06-25 Worker 评估）：andor_lower 无状态，dict_lower 穿线 3 个可变参数；24 个 expr arm 只有 2 个有差异；通用 visitor 需 ~150 行 trait 基础设施换 ~250 行节省，且编译器穷尽 match 已能 catch 新 variant 遗漏。投入/产出比不合算。

发现者：Opus（前端审计）





---

## 设计-实现差距（参考，已在 backlog 跟踪）

> 以下为未实现特性的跟踪参考，不作为 Worker 任务源。实际实现由 backlog 对应条目驱动。

| # | 设计功能 | Backlog 对应 | 状态 |
|---|----------|--------------|------|
| 36 | Refinement types (where 子句) | B-001 | 语法解析但语义忽略 |
| 37 | ~~`mut<S>` 参数化 effect~~ | B-037 | ✅ 已实现 → **已移除**（2026-06-24 design.md §7.9；实现保留但 effect 语义废弃，mutation 改由参数推断承载） |
| 38 | Post-resume handler / Full AE | 已取消 (B-009) | 不实现 |
| 39 | `dyn Trait` 动态分发 | B-006 | 未实现 |
| 40 | Supertrait 继承 | B-005 | ✅ 已实现 |
| 41 | 关联类型 | B-004 | ✅ 已实现 |
