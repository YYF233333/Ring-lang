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


## 技术债 / DRY 违反（2026-05-24 审计发现）


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
