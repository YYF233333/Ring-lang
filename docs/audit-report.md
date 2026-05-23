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

### #104 Effect row 统一在非对称 tail 场景静默丢弃未匹配 effect [medium] [open]

当一方 effect row 为 closed（无 tail）、另一方为 open（有 tail）时，`unify_effect_rows` 的 tail match 中 `(some, none)` 和 `(none, some)` case 落入 `_ => {}`。如果 closed 方有 unmatched effect 而 open 方无 unmatched effect，错误检查（L175-182）不会触发——因为 open 方 tail.is_some() = true 使 closed 方的 unmatched 检查（"&& rb.tail.is_none()"）为 false。结果 closed 方的未匹配 effect 被静默丢弃。

**场景**：`[io, fail]` (closed) 与 `[io, ?a]` (open) 统一时，`fail` 被丢弃。

**文件**：`compiler/unify.ring:175-223`
**修复方向**：为 `(some, none)` 和 `(none, some)` 添加 case——将 unmatched effect 推入 open 方的 tail variable。若 closed 方有 unmatched 而 open 方无 tail（不可能——已是 closed vs closed 由现有错误检查覆盖），报错。

发现者：DS，Opus 交叉验证

### #107 `check_effects_capability` 拒绝所有多态 effect row（含空 effect 函数）[medium] [open]

`check_effects_capability` 在检测到 open tail（`effects.tail` 为 `some`）时无条件报 E0408。这意味着任何未标注 effect 的函数（如 `fn id(x: Int) -> Int { x }`）在 `mod requires {io}` 内部都会被拒绝，即使该函数完全无副作用。

**文件**：`compiler/infer_decl.ring:177-184`
**修复方向**：仅当 open tail 为非类型变量（即包含具体 effect）且具体 effect 不在 capability 集内时才拒绝。类型变量 tail（多态）应允许通过，或默认化为 capability 集。

发现者：DS，Opus 交叉验证

### #108 Occurs check 对 StructType/EnumType 仅检查组 type_params，不检查 fields/variants [medium] [open]

`occurs_in` 函数（`unify.ring:55-58`）对 `StructType` 和 `EnumType` 仅递归到 `type_params`，不检查 `fields` 或 `variants` 中的类型。若一个 type variable 被统一到 struct 类型而其 field 类型中包含该 variable 自身，occurs check 会遗漏，理论上可构造无限类型。

**现实触发难度**：struct/enum 是 nominal 类型且 fields 在 `apply_subst` 中也不被替换（#45），实际很少触发。与 #45 相关——两者均需 fields 遍历才能完整修复。

**文件**：`compiler/unify.ring:55-58`
**修复方向**：在 `occurs_in` 中递归到每个 field 的 `.ty` 和每个 variant 的 `.fields`。需与 #45 修复协调（否则 fields 含未替换 type var，occurs check 会看到错误的变量）。

发现者：Opus


### #114 `row_merge` 不统一同 kind effect 的类型参数 [medium] [open]

`row_merge`（`types.ring:211-231`）用 `effects_same_kind` 去重 effect。`effects_same_kind` 对 `FailEffect` 要求 `types_equal(ea, eb)`，因此 `fail<Str>` 和 `fail<Int>` 被视为不同 kind，两者都被保留在 merged row 中。`merge_effects`（`infer_ctx.ring:260-276`）在 merge 后仅统一 tail，不统一同 kind effect 的类型参数。

**后果**：函数内部若一个分支 raise `fail<Str>` 另一个分支 raise `fail<Int>`，merged effect row 会包含两个不同类型的 fail effect。后续 `unify_effect_rows` 只匹配第一个 fail 对并统一，第二个 fail 成为 unmatched 进入 tail variable。这可能导致：(a) effect row 中携带多个 fail effect 未被检测；(b) catch 只捕获一种错误类型而遗漏另一种。

**实际影响**：Ring 函数通常只有一种 fail error type，触发概率低。但语义上不正确。

**文件**：`compiler/types.ring:211-231`、`compiler/infer_ctx.ring:260-276`
**修复方向**：在 `merge_effects` 中，row_merge 后遍历 merged row 中同 kind 的 effect（用 `effects_match_kind` 而非 `effects_same_kind`），统一它们的类型参数。或在 `row_merge` 阶段就合并同 kind effect。

发现者：Opus

## Codegen


### #28 HOF inline 代码在 List/Map/Set/Option 间重复 [low] [open]

~100 行重复。应抽象迭代模式。

### #29 Runtime 耦合 Node.js ESM（createRequire）[low] [open]

可移植性问题。




### #115 外部限定 struct pattern（`inner::Pair { a, b }`）报 E0201 [medium] [open]

从 mod 外部使用限定路径 `inner::Pair { a, b }` 做 struct pattern 匹配时，checker 报 E0201（未定义类型）。Checker 在 pattern 位置不识别限定 struct 名。mod 内部的 struct pattern 已修复（#110），此为独立的遗留问题。

**文件**：`compiler/infer.ring`（pattern 名字解析逻辑）
**修复方向**：pattern 解析时对限定路径（`mod::Type`）查找 mod 的导出 struct。

发现者：WTA1 agent（#110 修复过程中发现）

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


## 技术债 / DRY 违反（2026-05-24 审计发现）

### #100 `register_fn` 与 `register_extern_fn` 近乎相同 [medium] [open]

两函数共 ~150 行，共享 ~90% 逻辑：类型参数作用域、参数类型解析、declared_names 过滤、effect 解析、scheme bounds + supertrait 展开。差异仅在 `register_fn` 多了 `check_duplicate_def`、`fn_bounds_list`、`fn_mut_params` 追踪。

**文件**：`compiler/infer_register.ring:1195-1350`
**修复方向**：抽取共享注册逻辑为 helper，`register_fn` 在其上增加 fn_bounds + duplicate check。

发现者：Opus

### #101 ModBlock 注册逻辑在 `register_phase1` 和 `register_decl` 中重复 [medium] [open]

ModBlock 的 5-pass 注册策略（struct/enum → aliases → traits+aliases → effects/extern → 其余）在两处完整重复，各 ~65 行。注释结构、`insert_mod_aliases` 调用、pass 顺序完全相同。如果注册顺序需要变更，必须同步两处，维护风险高。

**文件**：`compiler/infer_register.ring:134-199` 和 `compiler/infer_register.ring:1488-1555`
**修复方向**：抽取 `register_mod_block_inner(ctx, mod_name, mod_decls, register_fn)` helper，接受 per-item 注册函数作为参数。

发现者：Opus

## 架构债

### #16 StructType/EnumType 携带冗余 fields/variants 数据 [low] [open] [deferred: LLVM]

类型表示不一致。应改为 nominal 表示。

**决策（2026-05-23）**：长期容忍，与 #45 一并推迟到 LLVM 后端阶段。

### #19 Ring 编译器缺少 `assertNever` 等效编译期保护 [low] [open]

新 variant 易遗漏。应确保所有 match 穷尽。

### #20 HExpr/HStmt match 在 5+ pass 中重复 [low] [open]

维护负担。应扩展 hir-visitor。

## Delegate 完整性（2026-05-23 审计发现）

### #77 Delegate forwarding：effect 标注 / evidence 未传递 [low] [open]

子项 1（mutability）和 2（type_params）已修复。剩余：
3. **effect 标注直接复制 trait 声明**：保守但安全，当前不修。
4. **合成调用不传递 effect evidence**：用户定义带 effect 的 trait 使用 delegate 时会触发。

发现者：DS+Opus

### #93 Delegate expansion 绕过类型推断直接合成 HIR [low] [open]

`expand_delegate_impls` 直接合成 `HDecl::Fn`（HIR），绕过 `check_fn_decl` 的推断流程。当前所有被委托的 trait（Eq/Clone/Ord/Debug）均为无 effect 纯函数，因此无实际影响。但未来 `delegate` 用于带 effect 的自定义 trait 时，合成的 forwarding call 的 effect 仅取自 trait 声明而非实际推断，可能导致 effect 不匹配。

**文件**：`compiler/infer_decl.ring`（`expand_delegate_impls`）
**修复方向**：让合成的 forwarding 方法走完整的类型推断流程，或在合成时从实际 impl 的推断结果获取 effect 信息。与 #77 相关——#77 修复时应一并考虑。

发现者：Opus

### #106 `check_one_decl` 在 delegate expansion 前将 impl HIR 推入 hdecls [medium] [open]

`check_one_decl` 在 L1293 将 `hd`（impl block HIR）推入 `hdecls`，之后在 L1305-1316 执行 delegate expansion。若 `expand_delegate_impls` 失败（raise CompileError），catch 在 L1420 捕获错误，但不含 delegate forwarding 方法的部分 impl HIR 已留在 `hdecls` 中。Codegen 会生成缺少 delegate 转发方法的 impl JS，导致运行时 missing-method 错误。

**文件**：`compiler/infer_decl.ring:1291-1319, 1418-1421`
**修复方向**：将 `hdecls.push(hd)` 移到 delegate expansion 成功之后，或在 expansion 失败时从 hdecls 回滚。

发现者：DS

## Codegen 技术债

### #103 Auto-boxing 仅 box 值类型依赖 JS 引用语义 [medium] [open] [deferred: LLVM]

B-047 实现中，`mut` 参数的自动 boxing 仅针对值类型（Int/Float/Bool/Str）。引用类型（struct/List/Map/Set）的 `mut` 参数不 box，依赖 JS 按引用传递对象的语义。LLVM 后端无此语义——所有类型需要统一的 boxing/pointer 策略。

**已知限制**：引用类型 `mut` 参数的重赋值（`list = new_list`）不会反映到调用方。

**文件**：`compiler/codegen_stmt.ring`、`compiler/codegen_expr.ring`（auto-boxing 相关逻辑）
**修复方向**：LLVM 后端实现时，所有 `mut` 参数统一使用指针传递。JS 后端保持现状。

发现者：Worker Wave A+B

### #113 `RecordType` `types_equal` 不检查 field 顺序 [low] [open]

`types_equal` 对 RecordType 使用 `fa.all(fn(f) { fb.any(...) })` 视 fields 为无序集合。对于 row type 语义这可能是有意的（field order 不影响 record subtyping），但与其他类型比较（如 `TupleType` 检查元素顺序）不一致。

**文件**：`compiler/types.ring:323-332`
**修复方向**：确认设计意图后，添加注释说明或增加顺序检查。

发现者：Opus

## 模块/诊断



## 设计-实现差距（参考，已在 backlog 跟踪）

> 以下为未实现特性的跟踪参考，不作为 Worker 任务源。实际实现由 backlog 对应条目驱动。

| # | 设计功能 | Backlog 对应 | 状态 |
|---|----------|--------------|------|
| 36 | Refinement types (where 子句) | B-001 | 语法解析但语义忽略 |
| 37 | `mut<S>` 参数化 effect | B-037 | ✅ 已实现（调用点注入） |
| 38 | Post-resume handler / Full AE | 已取消 (B-009) | 不实现 |
| 39 | `dyn Trait` 动态分发 | B-006 | 未实现 |
| 40 | Supertrait 继承 | B-005 | ✅ 已实现 |
| 41 | 关联类型 | B-004 | 未实现 |
