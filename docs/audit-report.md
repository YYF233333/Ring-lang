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

### #7 `infer.ring` 2763 行单文件 [low] [open]

应拆分为 infer_stmt/infer_expr/infer。


### #14 68 处 `panic()` 调用（约 40 处 unreachable）[medium] [open]

崩溃而非友好报错。应逐步替换为 DiagnosticSink。

**修复方向**：分两类处理——(1) unreachable panic（match 兜底、不应到达的分支）：保留或改为 `panic("unreachable: ...")`，这些是内部断言；(2) 用户输入触发的 panic（文件找不到、类型错误兜底等）：替换为 `sink.emit()` 诊断 + 继续编译。优先处理第 2 类。

## 架构债

### #16 StructType/EnumType 携带冗余 fields/variants 数据 [low] [open] [deferred: LLVM]

类型表示不一致。应改为 nominal 表示。

**决策（2026-05-23）**：长期容忍，与 #45 一并推迟到 LLVM 后端阶段。

### #19 Ring 编译器缺少 `assertNever` 等效编译期保护 [low] [open]

新 variant 易遗漏。应确保所有 match 穷尽。

### #20 HExpr/HStmt match 在 5+ pass 中重复 [low] [open]

维护负担。应扩展 hir-visitor。

## 特性组合 Bug（2026-05-23 审计发现）

### #68 Delegate + default trait method 生成错误 JS codegen [critical] [open]

当 trait 有 default method（如 `fn optional(self) -> Str { ... }`）且 field 类型使用该默认实现时，delegate 生成的 forwarding 方法调用 `self.field.method()`，但 default method 不是 field 对象的属性——它只存在于 trait dict 中。运行时触发 `TypeError: self.inner.optional is not a function`。

**文件**：`compiler/infer_decl.ring:472-610`（expand_delegate_impls）
**测试复现**：`tests/cases/audit_delegate_default_method.ring` → build + run → TypeError at line 384
**修复方向**：expand_delegate_impls 中检查 trait method 是否 has_default 且 field 类型未显式实现。对这类方法，生成 trait dict 调用（`__Inner_HasDefault.optional(self.inner)`）而非 UFCS 调用。

发现者：Opus


### #71 Delegate 在 mod 块内：check 阶段跳过展开 [critical] [open]

`check_mod_decl`（infer_decl.ring:92-106）对子声明调用 `check_decl` 而非 `check_one_decl`。`check_one_decl` 是处理 delegate 展开（生成 forwarding HDecl::Impl）的唯一入口。结果：mod 块内 delegate 在注册阶段（Phase 3 `register_phase3_delegate`）正确注册了 ImplEntry，但 check 阶段不生成 forwarding 方法的 HIR 节点——trait impl 存在但无实际方法实现，运行时调用会崩溃。

**文件**：`compiler/infer_decl.ring:92-106`（check_mod_decl 调用 check_decl 而非 check_one_decl）
**修复方向**：在 check_mod_decl 中改为调用 check_one_decl（或在 check_mod_decl 中复制 delegate 展开逻辑）。同时需确保 `update_fn_effects` 也在 mod 内正确执行。

发现者：DS


## 类型系统健壮性（2026-05-23 审计发现）


### #76 `EffectAliasDef` 缺少 `type_param_vars` [medium] [open]

`EffectAliasDef`（env.ring:92-97）存储 `type_params: List<Str>` 但没有 `type_param_vars: List<Int>`（type variable IDs）。对比 `EffectDef`（env.ring:54）和 `TypeAliasDef`（env.ring:88）都有此字段。alias 展开时（expand_effect_exprs）用字符串名匹配做 substitution，未使用 fresh type variables。当 alias type param 与 call-site type var 重名时可能产生 shadowing 混淆。

**文件**：`compiler/env.ring:92-97`
**修复方向**：添加 `type_param_vars: List<Int>` 字段，在 `register_effect_alias` 时生成 fresh type vars。

发现者：DS

## Delegate 完整性（2026-05-23 审计发现）

### #77 Delegate forwarding 完整性：mutability / type_params / effect 标注 [low] [open]

expand_delegate_impls（infer_decl.ring）生成的 forwarding 方法有三处不完整：
1. **参数 mutability 始终 false**（line 523,535）：HParam `is_mutable: false` 硬编码。trait 方法有 `mut self` 时，forwarding 不传递 mut 语义，`mut<T>` effect 追踪失效。
2. **type_params 为空**（line 581）：`type_params: []` 硬编码。泛型 trait 方法（`fn convert<U>(self, x: U) -> U`）的类型参数丢失。
3. **effect 标注直接复制 trait 声明**（line 574-588）：forwarding 方法使用 trait method 声明的 effect，但 field 类型的实际 impl 可能有更强的 effect。应从实际 impl effect 获取标注。

**文件**：`compiler/infer_decl.ring:523,535,574-588,581`
**修复方向**：(1) 从 TraitMethodDef 或 `ctx.env.trait_reg.mut_methods` 获取 mutability 信息；(2) 从 trait method TypeScheme 提取 type params；(3) 从实际 impl effect 而非 trait 声明获取 effect 标注。

发现者：DS+Opus

### #79 Delegate 二元 trait 方法转发 `other` 参数错误 [medium] [open]

expand_delegate_impls（infer_decl.ring）生成的 forwarding 方法对二元 trait 方法（如 `Eq.eq(self, other)`）正确转发 `self.inner`，但将 `other` 原样传递而非 `other.inner`。导致 delegate Eq 等二元 trait 时运行时比较语义错误。一元方法（如 `describe(self)`）正常工作。

**文件**：`compiler/infer_decl.ring`（expand_delegate_impls 的参数转发逻辑）
**修复方向**：forwarding 方法对非 self 参数，若参数类型与 target_type 相同，需转发 `arg.field` 而非 `arg`。

发现者：B-049 worktree agent

### #78 `register_phase3_delegate` 用 catch 吞所有错误 [low] [open]

`register_decls_two_phase`（infer_register.ring:237）的 Phase 3 delegate 注册用 `some(register_phase3_delegate(ctx, decl)) catch { _ => none }` 包裹。delegate 注册阶段的任何错误（impl 查找失败、field 类型不匹配）被静默吞掉，用户不会看到错误报告。与 Phase 1/2 的 catch 行为一致但对 delegate 语义尤为危险。

**文件**：`compiler/infer_register.ring:237`
**修复方向**：catch 块中 emit 通用错误，或将 registration 错误分类——致命错误应传播。

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
