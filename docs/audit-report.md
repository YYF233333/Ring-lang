# Audit Report

> 活的 bug 看板。修复后删除条目，只在 git commit message 留记录。
> 条目格式：`### #xxx <标题> [严重度] [状态]`
> 状态流转：`open` → `doing` → 删除
> 工作流规范见 `docs/workflow.md`

---

## Checker



### #45 `StructType`/`EnumType` 在 `apply_subst` 中不替换 fields [low] [open] [deferred: LLVM]

设计约束：fields 是模板字段（含递归引用），递归替换会导致 `Node<T>` 等递归类型栈溢出。当前 `infer_field_access` 的 inst_map 兜底是正确设计。如需修复需改为 nominal 表示（关联 #16）。

**决策（2026-05-23）**：长期容忍。当前方案正确且无性能问题，改动大（L-XL）收益主要在未来后端。等 LLVM 后端需要时与 #16 一并重构。

### #108 Occurs check 对 StructType/EnumType 仅检查组 type_params，不检查 fields/variants [medium] [open]

`occurs_in` 函数（`unify.ring:55-58`）对 `StructType` 和 `EnumType` 仅递归到 `type_params`，不检查 `fields` 或 `variants` 中的类型。若一个 type variable 被统一到 struct 类型而其 field 类型中包含该 variable 自身，occurs check 会遗漏，理论上可构造无限类型。

**现实触发难度**：struct/enum 是 nominal 类型且 fields 在 `apply_subst` 中也不被替换（#45），实际很少触发。与 #45 相关——两者均需 fields 遍历才能完整修复。

**文件**：`compiler/unify.ring:55-58`
**修复方向**：在 `occurs_in` 中递归到每个 field 的 `.ty` 和每个 variant 的 `.fields`。需与 #45 修复协调（否则 fields 含未替换 type var，occurs check 会看到错误的变量）。

发现者：Opus

### #115 E0513 dead error code: associated type bound not satisfied [medium] [open]

`E0513` is defined at `codes.ring:52` with description "Associated type bound not satisfied" but never emitted by any compiler pass. When a trait declares `type Item: Eq` (an associated type with bounds), `AssocTypeDef.bounds` stores the bound list but `register_impl` (`infer_register.ring:756-770`) only checks for missing/extra associated types, not whether concrete types satisfy declared bounds. For example `impl T for S { type Item = Int }` when `trait T { type Item: Clone }` would succeed without verifying `Int` satisfies `Clone`.

**文件**：`compiler/codes.ring:52`、`compiler/infer_register.ring:756-770`
**修复方向**：在 `register_impl` 中增加 bound 验证：对每个 `trait_def.assoc_types` 中带 bounds 的条目，检查 `assoc_type_map` 中的具体类型是否满足所有 trait bounds。

发现者：DS

### #116 `FnType` `types_equal` 用 exact ID 比较 open effect row tail [low] [open]

`types_equal` 对 `FnType` 比较 `optional_ids_equal(ea.tail, eb.tail)`（`types.ring:305`）。当两个函数都有 open effect row tail（不同 type var `?N1` 和 `?N2`），这返回 false，即使它们实际表示相同的 open effect row 语义。`row_merge` 的 `effects_match_kind` 对此处理正确，但 `types_equal` 过于严格，可能导致错误消息/调试输出中的比较误判。

**文件**：`compiler/types.ring:301-306`
**修复方向**：对 open tail 考虑是否有意要区分不同 type var ID（它们语义相同），或添加注释说明设计意图。

发现者：DS

### #120 `resolve_assoc_type` 歧义时返回 fresh var 而非 ErrorType [low] [open]

当关联类型名解析到多个 trait bound（E0512 歧义错误），`resolve_assoc_type`（`infer_ctx.ring:889-895`）报告错误后仍返回 `found_types.get(0)`（fresh type var），而非 `ErrorType`。这使 checker 在已报错后继续类型解析，可能导致后续级联错误信息。

**文件**：`compiler/infer_ctx.ring:889-895`
**修复方向**：歧义时返回 ErrorType 抑制级联错误。

发现者：Opus


### #129 `resolve_assoc_type` 忽略限定的类型参数名 [medium] [open]

`resolve_assoc_type(ctx, type_param_name, assoc_name, span)`（`infer_ctx.ring:818-828`）首先检查 `type_param_scope.get(assoc_name)`，若找到立即返回，**完全忽略 `type_param_name` 参数**。当两个类型参数 `T: TraitA` 和 `U: TraitB` 各有同名关联类型 `Item` 时，写 `U::Item` 会返回 `T` 的 `Item`（如果 `T` 的 bound 先被处理并将 `Item` 注入了共享的 `type_param_scope`）。

**文件**：`compiler/infer_ctx.ring:821-826`
**修复方向**：在 first-pass 检查中验证返回的类型是否来自特定 `type_param_name` 的 bound 注入。可能需要 per-type-param 的 scope 跟踪。

发现者：Opus

### #121 `check_fn_body` Zonk names 不包含关联类型变量名 [low] [open]

`check_fn_body`（`infer_decl.ring:1038-1049`）构建 ZonkCtx names map 时仅迭代 `type_params`（函数级泛型参数），但 `inject_assoc_types_from_bounds`（在 `register_fn_common` 中调用）会为 `Item` 等关联类型注入 fresh type var 到 `type_param_scope`。这些 var 在 ZonkCtx 中无名称，错误消息和调试输出中显示为 `?NNN` 而非 `Item`。

**文件**：`compiler/infer_decl.ring:1038-1049`
**修复方向**：收集 type_param 名称后，额外迭代 `ctx.type_param_scope` 为未覆盖的条目添加名称。

发现者：Opus

## Codegen


### #28 HOF inline 代码在 List/Map/Set/Option 间重复 [low] [open]

~100 行重复。应抽象迭代模式。

### #29 Runtime 耦合 Node.js ESM（createRequire）[low] [open]

可移植性问题。





## 代码质量 / 可维护性

### #6 `runtime.ring` 用数百个 `.push()` 拼接 JS 运行时代码 [low] [open]

应改用 raw string 或外部 .js 文件。

### #7 `infer.ring` 2826 行单文件 [low] [open]

编译器最大单文件，从 2565→2763→2826 行持续增长。应拆分为 infer_stmt/infer_expr/infer。

### #111 `emit_if_as_assign` brace 耦合脆弱 [low] [open]

`emit_if_as_assign` 以 `emit(ctx, "} else if (${cond}) {")` 开头，假设调用方已打开 `if` block 且未关闭 `}`。当前仅从 `gen_if:1150` 调用，正确但脆弱——若未来从其他路径调用可能产生悬空 `}`。

**文件**：`compiler/codegen_expr.ring:1093`
**修复方向**：重构以明确 brace 不变式，或检查输出 buffer 中的 brace 平衡。

发现者：DS

### #112 `zonk_block` 对非 Block 表达式 panic 而非报内部错误 [low] [open]

`zonk_block` 对非 Block HExpr 调用 `panic("unreachable: zonk_block expected Block")`。若编译器其他部分有 bug 传入非 Block 类型，编译器 crash 而非报 graceful internal error。

**文件**：`compiler/zonk.ring:126`
**修复方向**：转换为 compiler error 或使用 `zonk_expr` 作为 fallback。

发现者：Opus

### #119 `register_decl_info` + `scan_fn_mut_params` 使用 `_ => {}` 静默忽略 HDecl 变体 [low] [open]

`codegen.ring:299`（`register_decl_info`）显式处理 `Fn`、`Struct`、`Enum`、`Trait`、`Impl`、`Effect`、`Const`、`ModBlock`，然后 `_ => {}` 静默忽略 `Sig`、`ExternFn`、`ExternType`、`TypeAlias`、`AssocType`、`Test`。`codegen.ring:490`（`scan_fn_mut_params`）有相同模式。新增 HDecl 变体时编译器不会警告，违反 #19 的编译期保护原则。

**文件**：`compiler/codegen.ring:299, 490`
**修复方向**：显式列出每个被忽略的变体并加注释说明为何是 no-op。

发现者：DS


## 架构债

### #16 StructType/EnumType 携带冗余 fields/variants 数据 [low] [open] [deferred: LLVM]

类型表示不一致。应改为 nominal 表示。

**决策（2026-05-23）**：长期容忍，与 #45 一并推迟到 LLVM 后端阶段。

### #19 Ring 编译器缺少 `assertNever` 等效编译期保护 [low] [open]

新 variant 易遗漏。应确保所有 match 穷尽。

### #20 HExpr/HStmt match 在 5+ pass 中重复 [low] [open]

维护负担。应扩展 hir-visitor。

## Delegate 完整性（2026-05-23 审计发现）


### #93 Delegate expansion 绕过类型推断直接合成 HIR [low] [open]

`expand_delegate_impls` 直接合成 `HDecl::Fn`（HIR），绕过 `check_fn_decl` 的推断流程。当前所有被委托的 trait（Eq/Clone/Ord/Debug）均为无 effect 纯函数，因此无实际影响。但未来 `delegate` 用于带 effect 的自定义 trait 时，合成的 forwarding call 的 effect 仅取自 trait 声明而非实际推断，可能导致 effect 不匹配。

**#77 修复后的状态更新（2026-05-24）**：#77 修复了 `register_trait` 丢弃 `declared_effects` 的根因，trait 方法的 FnType 现在正确携带 effect 信息。同时修复了 dict dispatch 的 evidence 转发。因此 delegate expansion 合成的 forwarding call 现在能拿到正确的 effect 签名。但 expansion 仍绕过推断流程（直接合成 HIR），对于带复杂 effect 的 trait method，合成的 effect 可能与实际推断结果有细微差异。风险降低但架构问题仍在。

**文件**：`compiler/infer_decl.ring`（`expand_delegate_impls`）
**修复方向**：让合成的 forwarding 方法走完整的类型推断流程，或在合成时从实际 impl 的推断结果获取 effect 信息。

发现者：Opus

### #123 Delegate dict dispatch effect 转发在 catch 块内可能不足 [low] [open]

`get_callee_evidence_args`（`codegen_expr.ring:352-393`）有两个路径：(1) callee_type 路径——从 FnType 提取 effect 并返回 evidence params；(2) callee_name 路径——从 `local_fn_effects` 查找实际 effect 并检查 `ctx.in_try_fail`。Delegate 的 dict dispatch 走路径 (1)（callee_name 为 `none`），其效应从 trait method 的 FnType 推导。路径 (1) 不检查 `ctx.in_try_fail`，这意味着如果在 `catch` 块内对 delegate field 调用带 `fail` 的 trait 方法，且该 `fail` effect 的 evidence 依赖 catch 上下文，evidence 可能不完整。当前实践中难触发—默认 trait（Eq/Clone/Ord/Debug）均无 `fail` effect，#77 修复后 trait method FnType 也正确携带 effect 信息。

**文件**：`compiler/codegen_expr.ring:352-360`
**修复方向**：在 callee_type 路径中也注入 `ctx.in_try_fail` 的 `fail` evidence（与 callee_name 路径一致）。

发现者：Opus

### #103 Auto-boxing 仅 box 值类型依赖 JS 引用语义 [medium] [open] [deferred: LLVM]

B-047 实现中，`mut` 参数的自动 boxing 仅针对值类型（Int/Float/Bool/Str）。引用类型（struct/List/Map/Set）的 `mut` 参数不 box，依赖 JS 按引用传递对象的语义。LLVM 后端无此语义——所有类型需要统一的 boxing/pointer 策略。

**已知限制**：引用类型 `mut` 参数的重赋值（`list = new_list`）不会反映到调用方。

**文件**：`compiler/codegen_stmt.ring`、`compiler/codegen_expr.ring`（auto-boxing 相关逻辑）
**修复方向**：LLVM 后端实现时，所有 `mut` 参数统一使用指针传递。JS 后端保持现状。

发现者：Worker Wave A+B

### #130 `effects_match_kind` MutEffect 非对称 `is_type_var` 回退 [low] [open]

`effects_match_kind`（`types.ring:92-93`）对 `MutEffect` 使用 `is_type_var(sa) || is_type_var(sb) || types_equal(sa, sb)` 判断"同类"，而 `effects_same_kind`（`types.ring:199`）要求 `types_equal(sa, sb)`。前者用于 `row_merge` 去重——若有 `mut<Int>` 和 `mut<?T>`（未解析），`row_merge` 认为它们"同类"并可能丢弃一个，导致 effect 追踪精度下降。

**文件**：`compiler/types.ring:89-102`
**修复方向**：确认 `is_type_var` 回退是否仍需要（unification 阶段 type var 可能未解析）。若需要，添加注释说明理由；否则与 `effects_same_kind` 保持一致。

发现者：Opus

### #131 `FailEffect` 在 `effects_match_kind` 中忽略错误类型 [low] [open]

`effects_match_kind`（`types.ring:96`）对任意两个 `FailEffect` 均返回 `true`，不考虑错误类型参数。这意味着 `fail<Int>` 和 `fail<Str>` 被视为"同类"——`row_merge` 去重时可能丢弃其中一个。这是 single-fail-effect 设计的有意行为（unification 引擎单独处理类型参数合并），但缺少注释说明，可能误导未来开发者。

**文件**：`compiler/types.ring:96`
**修复方向**：添加注释说明此为 intentional——single fail effect 设计。

发现者：Opus

### #132 `exports.ring` ModBlock 不处理 ExternFn/ExternType 声明 [low] [open]

`extract_exports` 处理 `ModBlock` 内的声明时（`exports.ring:178-260`），显式处理了 `Fn`、`Struct`、`Enum`、`Const`、`Effect`、`EffectAlias`、`Trait`、`Impl`、`ModBlock`，但遗漏了 `ExternFn` 和 `ExternType`。`pub mod foo { pub extern fn bar() ... }` 中的 `bar` 不会被导出，其他模块无法 import。顶层 `ExternFn`（`exports.ring:153`）处理正确。

**文件**：`compiler/exports.ring:178-260`
**修复方向**：在 ModBlock 处理中增加 `Decl::ExternFn` 和 `Decl::ExternType` 分支，与顶层处理逻辑一致。

发现者：Opus

### #113 `RecordType` `types_equal` 不检查 field 顺序 [low] [open]

`types_equal` 对 RecordType 使用 `fa.all(fn(f) { fb.any(...) })` 视 fields 为无序集合。对于 row type 语义这可能是有意的（field order 不影响 record subtyping），但与其他类型比较（如 `TupleType` 检查元素顺序）不一致。

**文件**：`compiler/types.ring:323-332`
**修复方向**：确认设计意图后，添加注释说明或增加顺序检查。

发现者：Opus

### #117 Magic number 10 硬编码证据前缀长度 [low] [open]

`codegen_decl.ring:461, 495, 527` 三处使用 `dp.slice(10, dp.len())` 剥离 `__ring_ev_` 前缀。若 `evidence_param_name()`（`hir.ring:223-226`）的前缀格式变动，这些硬编码会无声断裂。

**文件**：`compiler/codegen_decl.ring:461, 495, 527`
**修复方向**：定义常量 `const EVIDENCE_PREFIX_LEN = "__ring_ev_".len()` 或抽取 helper 函数 `fn evidence_param_to_effect_name(dp: Str) -> Str`。

发现者：DS

### #118 `collect_local_calls` 遗漏限定的调用路径 [low] [open]

`collect_local_calls`（`codegen.ring:336-340`）仅匹配 `HExpr::Ident` 作为 callee。若本地函数通过限定名调用（`mod_name::fn()` 或 `super::helper()`），callee 不匹配 `HExpr::Ident`，调用不会被记录。effect 传播优化可能遗漏通过限定路径的 effect 依赖。

**文件**：`compiler/codegen.ring:336-340`
**修复方向**：同时检查 `FieldAccess` callee（receiver 为模块名）或使用 `resolved_name`（如可用）。

发现者：DS

### #122 `gen_handle_body` IIFE 仅传递 handled effects 的 evidence，未 handling 的依赖闭包 [low] [open]

`gen_handle_body`（`codegen_expr.ring:1421-1444`）的 IIFE 仅传 `by_effect.entries()` 中的 evidence params。若 body 中有 effect op 对应 unhandled effect（带默认 handler 但不在当前 `handle...with` 列表中），该 evidence 需通过 JS 闭包从外部作用域解析。嵌套 handle 时中间作用域若不保留 evidence 变量，闭包链可能断裂。

**文件**：`compiler/codegen_expr.ring:1421-1444`
**修复方向**：将 body 的 HExpr 中所有涉及 effects 的 evidence 都传入 IIFE（不仅是 handled effects），确保显式 evidence 访问不依赖闭包链。

发现者：Opus


## 模块/诊断

### #126 `mut_methods` 多文件编译不导出/导入 [medium] [open]

`TraitRegistry.mut_methods`（跟踪哪些方法是 `mut self`）在单文件编译中正确填充，但不包含在 `ModuleExports` 中，`inject_module_exports` 也不注入。在多文件模式下，对来自其他模块的类型调用 `mut self` 方法时：(1) 不会注入 `mut<T>` effect；(2) 不会检查不可变绑定调用 mutating 方法（E0208）。

**文件**：`compiler/exports.ring`（缺失）、`compiler/checker.ring:154-199`（`inject_module_exports`）
**修复方向**：在 `ModuleExports` 中增加 `mut_methods: Map<Str, Set<Str>>`，在 `extract_exports` 中填充，在 `inject_module_exports` 中注入。

发现者：Opus

### #127 `fn_mut_params` 多文件编译不导出/导入 [medium] [open]

`fn_mut_params`（跟踪哪些函数参数是 `mut` 值类型参数以便自动 boxing）在单文件编译中正确填充，但不导出到 `ModuleExports`。在多文件模式下，调用来自其他模块的带 `mut` 值类型参数的函数时，调用点不生成 `{value: ...}` 包装，mutation 不会反映回调用方。

**文件**：`compiler/exports.ring`（缺失）、`compiler/checker.ring:121`
**修复方向**：在 `ModuleExports` 中增加 `fn_mut_params: Map<Str, List<Bool>>`，在 `extract_exports` 中填充，在 `inject_module_exports` 中注入到 `ctx.fn_mut_params`。

发现者：Opus

### #114 E0408 dead error code: "Open effect row in capability-restricted module" [medium] [open]

`E0408` 在 `codes.ring:40` 定义、`codes.ring:89` 有描述，但从未被任何编译器 pass 实际 emit。`mod requires {effects}` capability 限制（E0405）正常工作，但未检查 open effect row tail 是否从受限模块泄漏。带 open effect row tail（`fn() -> T with {io, ?N}`）的函数可从 capability-restricted 模块导出而无错误。

**文件**：`compiler/codes.ring:40, 89`
**修复方向**：在 `check_fn_decl` 中当 `mod_path_stack` 在 `requires {}` 块内时实现 open row 检查，或将 E0408 标记为 deferred feature 并在 `error_description` 中注明。

发现者：DS


## 设计-实现差距（参考，已在 backlog 跟踪）

> 以下为未实现特性的跟踪参考，不作为 Worker 任务源。实际实现由 backlog 对应条目驱动。

| # | 设计功能 | Backlog 对应 | 状态 |
|---|----------|--------------|------|
| 36 | Refinement types (where 子句) | B-001 | 语法解析但语义忽略 |
| 37 | `mut<S>` 参数化 effect | B-037 | ✅ 已实现（调用点注入） |
| 38 | Post-resume handler / Full AE | 已取消 (B-009) | 不实现 |
| 39 | `dyn Trait` 动态分发 | B-006 | 未实现 |
| 40 | Supertrait 继承 | B-005 | ✅ 已实现 |
| 41 | 关联类型 | B-004 | ✅ 已实现 |
