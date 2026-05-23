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


### #14 28 处 `panic()` 调用 [medium] [open]

已从 68 处减少到 28 处（2026-05-24 审计确认）。分布：infer(8), exhaustive(5), derive(4), env(3), parser(2), unify(2), union_find(2), compiler_mod(1), zonk(1)。多数为内部一致性断言（unreachable），但部分可能被畸形输入触发。

**修复方向**：分两类处理——(1) unreachable panic（match 兜底、不应到达的分支）：保留或改为 `panic("unreachable: ...")`，这些是内部断言；(2) 用户输入触发的 panic（文件找不到、类型错误兜底等）：替换为 `sink.emit()` 诊断 + 继续编译。优先处理第 2 类。

## 技术债 / DRY 违反（2026-05-24 审计发现）

### #99 `register_impl_method` 与 `register_impl_extern_method` 近乎相同 [medium] [open]

两函数共 ~130 行，仅差 13 行（`register_impl_method` 多一段 `outer_saved` 类型参数作用域检查）。其余逻辑——类型参数作用域设置、self_type 解析、参数类型构建、effect 解析、methods_map 插入、mut self 追踪——完全重复。

**文件**：`compiler/infer_register.ring:733-856`
**修复方向**：合并为一个函数，用 `Bool` 参数控制 `outer_saved` 检查。可节省 ~65 行。

发现者：Opus

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

### #102 `[""]` + `.clear()` 空列表 workaround 96 处 [low] [open]

`let mut x: List<Str> = [""]; x.clear()` 模式在 codegen 文件中出现 96 次（codegen_expr:43, codegen_decl:18, codegen_derive:10 等），作为空列表类型推断的 workaround。同项目中 `let mut x: List<Str> = []` 已有 230 处正常使用（因有类型标注），该 workaround 不必要。

**文件**：codegen_expr.ring(43), codegen_decl.ring(18), codegen_derive.ring(10), resolver.ring(7), compiler_mod.ring(6), exports.ring(5), codegen_stmt.ring(5), codegen.ring(1), cli.ring(1)
**修复方向**：全局替换为 `let mut x: List<Str> = []`。机械性修改，低风险。

发现者：Opus

## 架构债

### #16 StructType/EnumType 携带冗余 fields/variants 数据 [low] [open] [deferred: LLVM]

类型表示不一致。应改为 nominal 表示。

**决策（2026-05-23）**：长期容忍，与 #45 一并推迟到 LLVM 后端阶段。

### #19 Ring 编译器缺少 `assertNever` 等效编译期保护 [low] [open]

新 variant 易遗漏。应确保所有 match 穷尽。

### #20 HExpr/HStmt match 在 5+ pass 中重复 [low] [open]

维护负担。应扩展 hir-visitor。

## 模块系统交互 Bug（2026-05-23 审计发现）

### #91 `impl` 目标类型不支持限定路径 [low] [open]

Parser 的 `impl Trait for mod::Type` 不支持——解析到 `::` 时报错。用户必须将 impl 放在 mod 块内部。

**文件**：`compiler/parser.ring`（parse_impl_decl）
**修复方向**：扩展 impl 目标类型解析支持限定路径。低优先级，workaround 是将 impl 放在 mod 内。

发现者：Opus

## 特性组合 Bug（2026-05-23 审计发现）

## 类型系统健壮性（2026-05-23 审计发现）



### #92 `effects_match_kind` 与 `effects_same_kind` 对 MutEffect 行为不一致 [low] [open]

`effects_match_kind`（types.ring，用于 `unify_effect_rows`）对 `MutEffect` 仅检查 variant 匹配；`effects_same_kind`（types.ring，用于 `row_merge` 去重）对 `MutEffect` 使用 `types_equal(sa, sb)` 完整类型比较。同时产生 `mut<Int>` 和 `mut<Str>` 时，`row_merge` 保留两个（视为不同），而 `unify_effect_rows` 会匹配它们然后尝试 unification（报 type mismatch）。可能导致 effect row 中出现重复 `mut` 条目。

**文件**：`compiler/types.ring`
**修复方向**：统一语义——让 `effects_match_kind` 也做完整类型比较（更安全），或让 `effects_same_kind` 只做 variant 匹配。

发现者：DS

## Delegate 完整性（2026-05-23 审计发现）

### #77 Delegate forwarding 完整性：mutability / type_params / effect 标注 / evidence [low] [open]

expand_delegate_impls（infer_decl.ring）生成的 forwarding 方法有四处不完整：
1. **参数 mutability 始终 false**（line 523,535）：HParam `is_mutable: false` 硬编码。trait 方法有 `mut self` 时，forwarding 不传递 mut 语义，`mut<T>` effect 追踪失效。
2. **type_params 为空**（line 581）：`type_params: []` 硬编码。泛型 trait 方法（`fn convert<U>(self, x: U) -> U`）的类型参数丢失。
3. **effect 标注直接复制 trait 声明**（line 574-588）：forwarding 方法使用 trait method 声明的 effect，但 field 类型的实际 impl 可能有更强的 effect。应从实际 impl effect 获取标注。
4. **合成调用不传递 effect evidence**（codegen 层）：UFCS 路径的 `FieldAccess` 的 `effects: EMPTY_ROW` 硬编码（line 692），`get_callee_evidence_args` 不会追加 evidence；dict_dispatch 路径直接生成 `dict_name.method(args)` 也完全没有 evidence 参数。当 trait method 带 effect 时，forwarding call 缺失 evidence。

**文件**：`compiler/infer_decl.ring:523,535,574-588,581,692`
**修复方向**：(1-3) 同上次审计；(4) 从实际 impl 的 effect 获取 evidence 参数，或在合成调用体中标注正确的 effects 使 codegen 能提取 evidence args。

发现者：DS+Opus

### #93 Delegate expansion 绕过类型推断直接合成 HIR [low] [open]

`expand_delegate_impls` 直接合成 `HDecl::Fn`（HIR），绕过 `check_fn_decl` 的推断流程。当前所有被委托的 trait（Eq/Clone/Ord/Debug）均为无 effect 纯函数，因此无实际影响。但未来 `delegate` 用于带 effect 的自定义 trait 时，合成的 forwarding call 的 effect 仅取自 trait 声明而非实际推断，可能导致 effect 不匹配。

**文件**：`compiler/infer_decl.ring`（`expand_delegate_impls`）
**修复方向**：让合成的 forwarding 方法走完整的类型推断流程，或在合成时从实际 impl 的推断结果获取 effect 信息。与 #77 相关——#77 修复时应一并考虑。

发现者：Opus

### #78 `register_phase3_delegate` 用 catch 吞所有错误 [low] [open]

`register_decls_two_phase`（infer_register.ring:237）的 Phase 3 delegate 注册用 `some(register_phase3_delegate(ctx, decl)) catch { _ => none }` 包裹。delegate 注册阶段的任何错误（impl 查找失败、field 类型不匹配）被静默吞掉，用户不会看到错误报告。与 Phase 1/2 的 catch 行为一致但对 delegate 语义尤为危险。

**文件**：`compiler/infer_register.ring:237`
**修复方向**：catch 块中 emit 通用错误，或将 registration 错误分类——致命错误应传播。

发现者：DS

## Effect 系统健壮性

### #90 `mod requires {effects}` 不检查 open effect row tail [medium] [open]

`check_effects_capability`（infer_decl.ring:163-173）只遍历 `effects.effects`，不检查 row tail（open effect row 的多态剩余）。有 open effect row（`tail: some(var_id)`）的函数通过 tail 传播的 effect 不受 capability 限制检查。

**文件**：`compiler/infer_decl.ring:163-173`
**修复方向**：当 `effects.tail` 非空时，保守拒绝（要求 closed effect row）或报告警告（无法静态验证 open row 中可能出现的 effect）。

发现者：DS

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
