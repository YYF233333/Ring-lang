# Audit Report

> 活的 bug 看板。修复后删除条目，只在 git commit message 留记录。
> 条目格式：`### #xxx <标题> [严重度] [dispatch] [状态]`
> dispatch 标记：`mechanical`（路径唯一，可直接执行）/ `judgment`（需要跨模块推理、Argument 或独立 review）
> 状态流转：`open` → `doing` → 删除
> 工作流规范见 `docs/workflow.md`

---

## 前端

### #267 Unit-return effect op 的 arm 值在 perform 点必然泄漏（EffectOp 保守不 drop 家族）[low] [judgment] [open]

2026-07-31 #265 review 发现并记录：tail-resumptive handler 中 Unit-return op 的 arm 值（如 arm 尾值为 Str）按语句语义丢弃，但 arm body 以 escape=true 处理（perceus.ring:2519 附近，行号=立案时）owned 返回，perform 点的 EffectOp 值被 Perceus 有意不 drop（"leak, crash-free"）——豁免使该必然泄漏形态重新合法化。非新泄漏类：非 Unit op 的语句位丢弃同形态既有。与 #217（block-expr/IIFE 临时值无 HIR 层 drop）同族。

**修复方向**：EffectOp 结果在 Unit 消费位补 drop（需与 handler evidence 生命周期协调）；或并入 #217 的统一临时值 drop 方案。回归：`handler_unit_op_arm_discard.ring` 已进入 root RC sweep 并锁定行为，但 verifier 目前还不能捕获这类泄漏。

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

### #268 复合类型未传播 Drop-ness，默认安全路径可 double-drop 并损坏堆 [critical] [judgment] [doing]

`is_user_drop_type` 只判断名义 struct/enum 自身是否直接存在于 `drop_types`，不会把字段/variant payload 或泛型实参中的 `Drop` 语义传给外层类型。因而 `Wrapper { value: Resource }`、`Holder::Wrapped(Resource)` 等本应自动 derive Drop、保持 move-only 的复合值仍会被 Perceus Clone，并且默认 `check/build` 接受同一绑定被重复传入消费位。

2026-08-03 C-only 最小 probe 同时覆盖 struct 与 enum wrapper：普通 `check`、`build` 均成功；同一 wrapper 各消费两次后程序先多次访问资源，scope end 输出异常的第三次空资源 drop，最终以 `0xC0000374`（heap corruption）退出。显式 `--verify-rc` 能报 `rc-verify[uaf-double-drop]`，但 verifier 不是默认安全门，不能替代 checker 的 move 约束。该结果把原先的“复合 Drop 语义漂移”升级为安全源码可达的内存破坏。

**修复方向**：建立一个由 checker/HIR 持有、对递归类型图有界并对泛型实参敏感的 transitive Drop predicate，让 move checker、Perceus 与 verify_rc 共用同一真值；struct/enum/tuple/Option/Result/List 等所有可持有 Drop 值的复合形态都必须传播 move-only，不能只给本次 probe 的两个叶名打补丁。回归至少覆盖直接/嵌套/泛型复合、递归类型、消费后再使用的稳定诊断、正常单次析构顺序、C/RC/ASan 与 self-host fixed point。

2026-08-06 方向止损门：连续两轮独立 review 证明“共享类型 predicate + block 级 moved-name set”仍无法表达互斥分支合流、循环回边、closure capture 与参数 ownership mode；该实验分支冻结，不再追加控制流特例。#268 与 #269 转入共同 Argument：单一真值必须同时描述“类型是否可能持有 Drop”与“每条 HIR 边是否移交所有权”，checker、Perceus 与 verifier 只能消费该计划，不能各自重走表达式猜测。

发现者：#255/#256 独立核验后 Repository Steward 对抗 probe

### #269 参数 ownership mode 未推断，borrow 误拒且 move-return 默认路径重复析构 [critical] [judgment] [doing]

`check_moves_expr` 处理 `HExpr::Call` 时会在检查每个实参后无条件调用 `try_consume_ident`，没有读取或推断 callee 参数的 ownership mode。该行为与 design §7.3“参数默认 borrow；仅函数体将参数返回、存入字段或跨 spawn 时推断 move”冲突。

2026-08-06 在 `50a96a` 的 tracked C compiler 上验证出两侧违约：① `fn observe(value: Tracker) { print(value.tag) }` 只读参数，caller 调用后再次读取 `value.tag`，checker 错报 E0801；② `fn take(value: Tracker) -> Tracker { value }` 应推断 move，默认 `check/build` 却通过并生成 caller 原绑定与返回绑定的两次析构，运行打印第二次损坏值后以 `0xC0000374` 退出。显式 `--verify-rc` 能报 `uaf-escaped-borrow`，但默认安全门没有消费该证据。

**修复方向**：ownership mode 必须由函数体推断并进入函数签名/HIR call identity，让 checker、Perceus 与 verifier 消费同一模式；普通/方法/函数值/泛型/跨模块调用都按 borrow、mut 或 move 处理。不得按实参是否含 Drop 类型一律消费，也不得通过放宽 E0801 掩盖真正的 owning sink。验收覆盖只读参数后重复使用、参数返回/存字段后的 caller 失活、方法与函数值调用、跨分支/循环/closure 的状态合流、默认 checker 与 verifier 同结论、单次析构，以及 self-host fixed point。

**Argument verdict（2026-08-06）**：采用 design §7.3 的 A′——symbolic ownership shape + callable mode fixed point + 临时 CFG 数据流 + 显式 HIR `Take`/源槽置空。永久 CFG/SSA ownership IR 暂不采用；direct-callee 白名单与大面积保守拒绝不能作为最终修复。实施必须删除 block 级 moved-name 抑制和调用名猜测；closure capture transfer、partial move 与 B-168 前跨 catch 的 outer-binding Take 先 fail loud。验收矩阵至少覆盖 direct/method/fn-value/HOF/trait/reexport、recursive SCC、互斥分支、零/N 次循环、break/continue/return、重新赋值、shadow、容器 ownership shape、borrow capture 重复调用、默认 checker/verifier 一致与 double bootstrap。

**优先级裁决（2026-08-12，适用于 #268/#269）**：两项仍为 `[critical] [doing]`，finding、严重度与最终验收矩阵均不缩减。当前先关闭会阻断 strict `check/build compiler/main.ring`、可信 bootstrap 与 B-176 同快照测量的 development-blocking 部分（包括 impl effect-precheck transaction、project namespace callable alias provenance 及其精确 self-host checkpoint）；checkpoint 成立后，剩余不影响开发回路的长尾可在 B-176/B-180 实现期间显式暂缓。暂缓不等于关闭：任何触及当前优化 authority、破坏测量可比性或产生 panic/ICE/false-green 的 critical 立即回到前台，全部长尾仍阻塞 B-180 完成认定、完整门和 release。

**Development-blocking subitem closure（2026-08-13）**：用户已验收 `ownership-reachable-dispatch` item 完成。final A7 clean generation/native link、tracked anchor byte identity 与 focused callable/default/const/project/transaction/effect-mapping 矩阵共同满足 developer-unblock checkpoint；后续主线转入 B-176/B-180。#268/#269 继续保持 `[critical] [doing]` 仅表示 final-acceptance 长尾尚未清零，不得用来重新打开本 subitem 或阻塞性能实现；若性能工作发现会破坏该 checkpoint、baseline 可比性或 ownership authority 的确定失败，再按原 critical 优先级回切。

**Critical long-tail re-entry（2026-08-18）**：B-180 技术探索按停止门关闭后，`ownership_modes_cfg` 验收矩阵暴露一个真实的 lexical shadow 错绑：普通块内 `let shadowed = ...` 离开后，外层读取仍携带内层 DefId，generated C 在 drop 内层槽后再次读取该槽，观测值由应有的 11 漂成 12。根因是嵌套 `Expr::Block` 与 `if`/`unsafe` 分支直接调用 current-scope `infer_block`，没有建立并在失败时恢复子 scope。当前 correctness checkpoint 新增 fail-safe `infer_scoped_block`，只接到四个嵌套词法入口；函数 owner 及 loop/pattern binder 的既有 scope authority 不变。source/mutation authority 与 canonical structural wiring 已 PASS，隔离 generated-C 行为镜像对 ownership shadow、then/else shadow、普通/复杂/嵌套 block、pattern shadow 与 unsafe block 六个 fixture 全部 PASS。随后已把 8 月 7 日遗留的两项 Unit-1 假红迁移到 A′ 真值：`compiler.ownership_shadow_layout` 当前精确锁 `ownership_term`、call/call-result DefId、transfer state 与 content-addressed descriptor intern/merge/import，显式 structural 收据 1/1 PASS；spread source-sequence authority 则接受 source value 经 generated RC-scope 与 return temporary 的线性、无副作用标识符传递，同时仍拒绝错误别名、重排及中途 RC/call 操作，其 focused generated-C structural 收据同样 1/1 PASS。历史 `03b`/`03c` 仍分别保留为首个 stale-oracle failure。现在已有真实 source-built gen1：clean strict A6 crossing compiler 在 1380.61 s 内生成当前 source，峰值 commit 9,185,689,600 bytes；其 O3/ThinLTO native compiler 对 `ownership_modes_cfg` 的 check/build、精确 runtime 输出及失败嵌套块 scope-restore probe 全部 PASS，因此旧的“只有隔离 C 镜像、无 source-built compiler”边界已关闭。但 gen1→gen2 在 2279.57 s 触及固定 12 GiB Job commit 上限，stderr 仅 `ring_alloc failed (size=16, typeid=109)`，无 gen2 产物；这使 self-host 文本 fixed point 与 tracked `dist-c` 更新仍被资源峰值阻断。不得重跑同一命令、提高上限或把资源失败写成 correctness 失败；下一步必须是 materially different 的峰值削减/自举 construction，随后才可做 gen1/gen2 字节比较与剩余 #268/#269 完整验收。

**Peak-state candidate stop（2026-08-18）**：同一 source-built gen1 的纯 `check compiler/main.ring` 也在 2281.06 s 触及 12 GiB，证明 blocker 属于共享 front end 而不是 C/RC/codegen。随后唯一实现的 module-state construction 把每个完成模块的完整 `TypeEnv` 立即投影为 B-145 所需的 visible-extern-name `Set<Str>`；源码 authority、同名 extern 隔离 check 及 native build/run 均通过，但完整 check 在 2251.54 s 再次触及同一 cap，peak commit 只比 baseline 多 4096 bytes，stderr 逐字节相同。因此 full per-module TypeEnv 不是 material peak owner，候选 `a58bf3e4` performance-rejected，不合入、不进入 gen2、不重跑。后续若无直接 allocation/rebuild authority，不得继续以“提前 drop 另一个容器”为猜测扩展 critical 自举路径。

**Allocation census authority（2026-08-18）**：固定 source-built gen1 `main-lto.o` 仅换用 runtime 现有 `RING_ALLOC_STATS` 后，唯一 2400 s `check compiler/main.ring` 在硬超时前完成 1,238 个 2^25-allocation 周期样本，共 41,540,386,816 alloc / 41,500,267,011 free / 40,119,805 live；无 panic 或其他 stderr。最后样本的 `tid8=Option` 16,725,978 与 `tid5=Map` 16,725,286 只差 692，合计占 live 83.38%。从 3,355,443,200 alloc 样本到末样本，二者贡献净 live 增长的 96.44%；其余 top 为 List、`types::Type`、`types::EffectRow`、`hir::HExpr`。这把下一刀收窄到 coupled Option/Map producer 的 allocation-site/ownership attribution，并反驳无差别 container projection；但 stats 写计数表且刷出 1,238 行，逻辑进度未知，其 6.47 GiB commit / 5.20 GiB RSS 绝不能与未插桩 12 GiB baseline 当作改善。下一步只允许固定对象的短时 sampled RVA attribution；未证明单一 producer 前不得实现 cache/drop，且不得再跑 2400 s census 求更漂亮资源数。

**Call-site attribution stop（2026-08-19）**：measurement-only checkpoint `b8e40d79` 为 Map/Option 各设两条独立去周期采样 lane，记录 `(tid, lane, RA0, RA1, RA2)`，默认 runtime 的 O3 LLVM IR 与父快照逐字节一致。固定 `main-lto.o` 的唯一 `check compiler/main.ring` 在 208.78 s、2^32 allocation 处按设计自停（exit 86），五个 milestone、exact map、stack/table invariant 全部闭合；final exact live 为 Map 2,446,941、Option 2,475,254，四条 lane 的 sample estimate 误差为 1.21%–6.17%。但单一 full signature 的 final share 只有 29.82%–36.05%，Wilson 95% 下界只有 26.28%–32.35%；四条 lane 中两条发生 top 更换，第三末到 final 的 top growth 解释率也只有 45.38%–52.38%。事后合并 top2 虽得到 Map 62%–68%、Option 54%–57%，却对应 `compiler/unify.ring` 中 struct（197–215）与 enum（249–267）两个独立、同构的 `Map -> Option` producer，且 holdout 多数门未预先闭合。生成 C 证明两处都把 `created` move 入 `some`、借出 payload 后遗漏 Option local 的退出 drop，但本轮预注册的“单一 producer”授权门仍失败；结论为 `insufficient-evidence`，不得据此实现 source workaround/cache/drop，也不得重跑或改采样分组追求通过。固定点资源 blocker 与 #268/#269 最终验收保持开放。

**Cleanup abstraction re-entry（2026-08-19）**：新的最小 source-built fixture 不再依赖 profile：direct `Map`、direct `some(Resource)`、direct `some(Map)` 的 normal/early 路径都精确 Drop；只有 `let mut wrapped: T? = none; wrapped = some(owned)` 对 `Option<Resource>` / `Option<Map>`、normal / early return 全部漏 Drop，且 live `--verify-rc` false-green。生成 C 显示 `created` 已 move 并清 null，payload match 只 Borrow，但 `wrapped` 在所有出口均无 Drop。根因定位到 Perceus `stmt_droppable_locals` 只按初始 `none` 的 NOOP producer 分类；Assign 目标未进入 `owned`，因此既无 W4 旧值 Drop，也无 scope/return cleanup；verifier 镜像同一错误 kind。候选“把 none Var 直接塞入既有 owned”被独立反例否决：它会污染 `tail_escape`，给无关 borrowed tail 加 Clone 或触发 may-own panic。通用 post-RC 三态流实验 `56a3c95e` 因超过 1,000 行重复 HIR traversal、If/Match/Block tail source 未闭合及 Lambda/handler probe 污染而按方向止损保存，明确禁止 merge。当前只授权可逆 S′ 子集：exact-none / physical / nonboxed Var 所在 block 的每个 reachable tail 必须按表达式来源证明 escape 模式不插 Clone、不改变 Take、不中 may-own；Ident/Field/borrow-return Call、opaque control/effect 一律 fail closed。general finding、owner-bearing tail 与 shared-HIR provenance 终态仍保持开放；S′ 只有经独立 verifier mutation 与 source-built gen1/gen2 才能声称解除 fixed-point blocker。

**Safe-tail cleanup candidate（2026-08-19）**：S′ 已在 continuation 实现为 exact-DefId cleanup slot，并复用既有 W4/exit Drop；verifier 从 post-RC synthetic tail 独立恢复 producer，具有专用状态域和 first/rearmed W4、exit、false-admission、catch-arm mutation。独立 review 在补齐 TryCatch 正常返回 arm 审计和 strict A6 crossing 的局部转移槽后 CLEAR。source-built gen1 的 runtime Drop fixture 1/1、RC live/mutation 8/8、generated-C structural 1/1、parity 1/1 全部通过；A6 在 1435.52 s、9,351,241,728 bytes peak Job commit 内生成 24,431,738-byte C（SHA256 `DBC1547E1B7031949B990ECB8D63062D49CC94897091428833BF0B1EB2D9AA1A`），native O3/ThinLTO gen1 SHA256 为 `64CED1C43E95BC15314685E5EF78FF34D22D84D12BE1592708D4E36C0C14EB30`。这些结果证明 bounded correctness subset 与 verifier authority，不能被改写成 self-host fixed-point PASS。

**Safe-tail self-host and crossing stop（2026-08-19）**：candidate gen1 自身仍由旧 Perceus lowering 生成，因此新 cleanup 只会进入它尚未产出的下一代。唯一 full gen1→gen2 尝试在 2371.12 s 触及固定 12 GiB，stderr 为 `ring_alloc failed (size=16, typeid=8)`，无 gen2。Independent Argument 随后只授权一次一文件 bootstrap-lite：临时 mirror 把 3016-line `verify_rc.ring` 换成同 `RcFinding` 布局/三 public API、调用即 panic 的 30-line fail-closed stub；普通 parser/checker/ownership/Perceus/codegen/build 图保持原样。该 construction 仍在 2347.24 s 触及同一上限并产生 byte-identical typeid-8 stderr，无 lite C。停止门已经触发：不得继续删模块、提高 cap、postpatch generated C、加 runtime/typeid workaround、改 `unify.ring` 热点或重跑旧 profile。S′ 保留为 correctness-evidenced、未 fixed-point-accepted 的 continuation candidate；tracked `compiler/dist-c/main.c` 不得更新。完整证据在 ignored `bench/check/results/ownership-option-cleanup-20260819/s-prime-acceptance/`。

**A6-compatible seed prefix stop（2026-08-19）**：新 Argument 允许一个不合入的 seed：恢复 A6 的旧 scoped-block / exact-import 前端行为，同时保留 S′ Perceus/verifier。seed `098d8ea9` 经独立 review 后由 exact A6 一次生成成功（1385.47 s，peak Job commit 9,348,829,184 bytes），已精确 containment 两项旧行为并通过 S′ runtime 1/1、RC 8/8、structural 1/1、parity 1/1；但预注册的 2^32-allocation 对照门否决 full crossing。candidate final Map+Option exact live 4,890,080，仅比 control 4,922,195 低 0.652%，且 peak commit 2,313,269,248 仅低 1.126%；二者均未达到预先固定的 20% / 10% 改善门。因此未运行 seed→current1，禁止重试或把成功生成 seed 改写成 crossing progress。下一候选只允许先做 unity-source inline-module 等价小探针；未通过不得 full build。证据在 ignored `bench/check/results/ownership-option-cleanup-20260819/a6-seed-crossing/`。

**Unity-source small-probe stop（2026-08-19）**：首版机械 wrapper 的 physical controls 全部通过，但四个 unity entry 均因 root `use` 位于 module declarations 后精确报 E0706，未到 codegen；原始证据在 bootstrap-probe commit `f75d107f` 的 ignored `tmp-unity-seed-probe/01`–`06`。独立反驳进一步证明不能把 root uses 简单 hoist：CLI 会据 `ast.uses.len()>0` 进入 project mode，resolver 又无条件建立 physical dependency BFS，从而失去 single-file crossing。仅 compiler-specific no-use synthetic main 获准一次修订探针，脚本 contract commit `58075b40` 与 11 项 Python tests 通过；但第一次运行在五分钟前人工停止、stdout/stderr 为空，唯一 superseding 295 s wrapper 又因含空格路径 quoting 错误实际检查截断的 `C:\Users\Yufeng`，从未打开 unity source。按 stop contract 不做第三次；该路线是 orchestration-inconclusive，不是 compiler PASS/FAIL，full unity/current generations 均未运行。再次进入须先做新的 authority-boundary Argument，不能静默修 wrapper 重试。

**B-186 fixed crossing verdict（2026-08-19 用户批准，适用于 #268/#269）**：完成 repository convergence recovery 后，只对完全固定、无代码变化的 S′ gen1 运行一次 gen1→gen2：Job commit `23622320128` bytes（22 GiB）、active process `<=5`、无其他重负载、首次等待点精确 72 分钟、hard wall 90 分钟。gen1 仅为 bootstrap seed；若产出 gen2，gen2→gen3、C byte fixed point、完整 C/RC/ASan/self-host/final acceptance 全部恢复 `12884901888` bytes（12 GiB），且只有 gen2/gen3 C byte-identical 与原门全绿才能删除两项 finding。若 22 GiB 触顶、超时或无产物，资源加码永久停止，不试 24/32 GiB、pagefile 或重跑；转为 latest main 上独立重现/移植 S′并先完成其自身 fixed point，再分 checkpoint 重放 A′。S′ 不能脱离 A′时先新 Argument，不恢复 seed/unity probe tree。

**Exact crossing preflight closure（2026-08-20）**：B-186 恢复门通过后，从固定 `a11ea063` archive 做了一次零源码变化重建。exact A6（SHA256 `AB63D5632132497187677091FC511CC58B19CA73081A106321374244BEB7C8AE`）在 12 GiB / `<=5` 进程门内成功生成 24,431,738-byte C，SHA256 精确命中 `DBC1547E1B7031949B990ECB8D63062D49CC94897091428833BF0B1EB2D9AA1A`；但重建的 `main-lto.o` 为 `E7910C24663566D5D6397D2FA11DF8CC2A59844D6B7C70C7EC99EE83F9ACCDC5`，不等于权威 `5E86282616717D149A00E357ED23EAB023924F89E886DFE34FA4D805376AA527`，`runtime-lto.o` 为 `6A09B03514C08B70F4F0B460B247BB60970AFB999FAFE923CD7F24372FEF663E`，不等于权威 `9DFD32E60356D26C4EC138A9BACFB14490B1240019A41C904596B0C7F5C9871B`。Git 全 refs、B-186 bundle/WIP manifest、备份目录与现存 receipts 均没有另存的 object bytes 或完整历史 recipe；原 `219a` / `8166` ignored evidence 已在归档前被宿主回收。按预注册门在 link 前停止：不接受新 hash、不猜 flags/path、不以行为替代 identity，也不重试；22 GiB crossing 路线永久关闭且不算已消费一次 run。已激活既定 fallback：在 latest main 独立重现/移植 S′，先在 12 GiB 下达到自身 fixed point，再以 bounded checkpoints 重放 A′；若独立性审计失败，先新 Argument，禁止恢复 seed/unity tree。

**Latest-main S′ separability Argument（2026-08-20）**：只读矩阵证明 S′ 不能直接 cherry-pick，也不能在 name-only HIR 上用 Perceus/verifier side-domain 独立成立。latest main 的 `HStmt::Drop`、Perceus owned set、verifier 和 C backend 仍按裸名称找槽，且旧 `is_droppable_init` 把 `Option::none` 作为普通 `Ident` 纳入 cleanup；因此 A′ 切换 exact-none 为 NOOP 前，S′ 的 reassignment/exit 修复没有可区分行为，既不能杀死旧实现，也不能证明 `option_shadow` / catch mutation 操作了正确槽。独立 skeptic 反驳了两条捷径：只给 synthetic Drop 加 token 无法修复 Ident/Assign/capture/backend 的同名错槽；直接 atomic A′+S′ 又重新汇合已知 12 GiB 资源墙并失去故障隔离。root 选择第三条 `I′ -> S′ -> A′`：I′ 只建立可保留的 exact-slot identity，不引入 `OwnershipMetadata`、callable solver、ownership shape、CFG 或 `HExpr::Take`。它必须覆盖 `infer_scoped_block` 的正常/失败恢复，source/pattern/default/dict/ANF/RC binder 的唯一且互斥 DefId，DefId-bearing Ident/Assign/Drop/capture/pattern 从 HIR 经 Perceus/verifier 到 C slot 的全链 fail-loud，以及 nested-function slot-map 保存/恢复；default-HIR 每次展开要 freshen binder identity，or-pattern 每个成功 alternative 写同一个 arm slot。I′ 先以 same-name outer/inner、then/else、pattern/catch、closure capture、default 两次展开、or-pattern 与 generated-C exact-slot oracle证明行为等价。随后在单一 checkpoint 中同时引入 exact-none NOOP producer lattice和 S′ safe-tail re-admission；仍保留原 runtime 1/1、RC live/mutation 8/8、structural 1/1、parity 1/1，所有 Ident/Field/Index/Call/effect-control 在没有 canonical metadata 时 fail closed。只有该 surface 在原 `12884901888` bytes（12 GiB）下达到 C byte fixed point并通过完整 C/RC/ASan/self-host 门，才开始分段重放 A′；A′ 启用 callable metadata/CFG/Take 时须原子贯通 checker→HIR→Perceus→verifier→codegen并重跑全部 S′矩阵。任一 DefId-bearing路径回退名称、I′ 被迫引入 callable ownership、tail gate 开始猜 Call/Ident、原 fixture/mutation 被删减、12 GiB 触顶/超时/无产物/无 fixed point，或 A′ 只能部分激活，立即停止；不得退回 side-token、atomic crossing、unity 或资源加码。

**OrPattern public-semantics verdict（2026-08-20 用户选择 A，适用于 I′ 与未来 GADT）**：每个 alternative 必须各自恰好一次绑定相同的非 `_` 变量集合；同名绑定的类型、可变性与 ownership mode 必须兼容，并共享一个 canonical DefId/slot。绑定集合不同、单支重复绑定或同名类型不兼容均 E0301，禁止 common-definite/隐藏 alternative-local bindings。GADT 类型等式兼容是另一道独立门：`Lit(_) | Add(_, _)` 可因空绑定集合且同为 T=Int 合并，`Lit(n) | Add(a,b)` 即使等式兼容也必须拆 arm或改用 `_`。I′ 的 `bind_pattern` 是该集合/类型/canonical identity 的唯一 authority；下游不得复制 name-only gate或为 backend 回退。

发现者：#268 第二轮 oracle 复核

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
