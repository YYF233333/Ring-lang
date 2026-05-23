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

## Codegen 技术债

### #101 Auto-boxing 仅 box 值类型依赖 JS 引用语义 [medium] [open] [deferred: LLVM]

B-047 实现中，`mut` 参数的自动 boxing 仅针对值类型（Int/Float/Bool/Str）。引用类型（struct/List/Map/Set）的 `mut` 参数不 box，依赖 JS 按引用传递对象的语义。LLVM 后端无此语义——所有类型需要统一的 boxing/pointer 策略。

**已知限制**：引用类型 `mut` 参数的重赋值（`list = new_list`）不会反映到调用方。

**文件**：`compiler/codegen_stmt.ring`、`compiler/codegen_expr.ring`（auto-boxing 相关逻辑）
**修复方向**：LLVM 后端实现时，所有 `mut` 参数统一使用指针传递。JS 后端保持现状。

发现者：Worker Wave A+B

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
