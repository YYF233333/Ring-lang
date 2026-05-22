# Audit Report

> 活的 bug 看板。修复后删除条目，只在 git commit message 留记录。
> 条目格式：`### #xxx <标题> [严重度] [状态]`
> 状态流转：`open` → `doing` → 删除
> 工作流规范见 `docs/workflow.md`

---

## Checker

### #42 Impl 方法 effect 不回传 [medium] [open] [blocked: B-005]

Impl 方法在 Pass 1 注册为 `EMPTY_ROW`，Pass 2 推断出实际 effect 后不更新环境。导致 `fail.raise()` 在 impl 方法中无法通过 `catch` 正确捕获。

Workaround：parser 用 `__ring_raise_fail` extern fn 绕过 evidence passing；codegen `gen_try_catch` 已去除 `has_fail_effect` 前置检查。正式修复需在 impl 方法检查后回传 effect 到环境。

**决策（2026-05-23）**：推迟到 B-005 supertrait 重构时统一处理——supertrait 会大改 trait/impl 注册流程，届时一并修复 effect 回传。workaround 暂留。关联 #66、#67 随此推迟。

### #77 `infer_numeric_op` 无条件将 TypeVar 统一为 Int [low] [open]

`fn add<T>(a: T, b: T) -> T { a + b }` 静默约束 T=Int（infer.ring:937-949）。无 Num trait 前合理但可能令人困惑。

发现者：Opus


### #45 `StructType`/`EnumType` 在 `apply_subst` 中不替换 fields [low] [open] [deferred: LLVM]

设计约束：fields 是模板字段（含递归引用），递归替换会导致 `Node<T>` 等递归类型栈溢出。当前 `infer_field_access` 的 inst_map 兜底是正确设计。如需修复需改为 nominal 表示（关联 #16）。

**决策（2026-05-23）**：长期容忍。当前方案正确且无性能问题，改动大（L-XL）收益主要在未来后端。等 LLVM 后端需要时与 #16 一并重构。

## Codegen


### #28 HOF inline 代码在 List/Map/Set/Option 间重复 [low] [open]

~100 行重复。应抽象迭代模式。

### #29 Runtime 耦合 Node.js ESM（createRequire）[low] [open]

可移植性问题。


## Effect 标注

### #64 `effects_match_kind` 只做 kind 级匹配，忽略 fail 错误类型 [medium] [open] [after: B-034]

`with {fail<Str>}` 匹配 `fail<Int>` 不报错。标注中的错误类型是装饰性的。若标注作为公共契约，应验证类型参数。

**决策（2026-05-23）**：应验证类型参数。排在 B-034 Effect Aliases 之后修复——effect alias 可能改变标注的解析逻辑，先稳定再加精确匹配。

发现者：设计决策项

### #66 `register_impl_method` declared_effects 已使用但 Pass 2 仍不回传 [medium] [open] [blocked: B-005]

~~原报告称 declared_effects 参数完全不使用——已修复（infer_register.ring:573-577 现在 resolve 并应用 declared_effects）。~~ 但核心问题仍在：Pass 2 推断出的实际 effect 不回传到环境。关联 #42。

**决策（2026-05-23）**：随 #42 推迟到 B-005 supertrait 重构时统一处理。

发现者：Opus（2026-05-23 更新）

### #67 `std/io.ring` 的 `print`/`assert`/`exit` 缺少 `with {io}` 标注 [medium] [open] [blocked: #42]

纯函数 `with {}` 内调用 `print()` 不报 E0404——extern fn 无标注时注册为 EMPTY_ROW。

**决策（2026-05-23）**：依赖 #42（impl effect 回传）修复后才能正确处理 extern fn effect 标注。随 #42 推迟。

### #68 `resolve_effect_expr` 不验证 effect 名是否存在 [medium] [open]

`with {typo}` 静默创建 CustomEffect，不报错。未声明的 effect 无对应 handler，属于类型系统漏洞。

**修复方向**：`resolve_effect_expr` 中，effect 名必须是内置（io/fail/mut）或已声明的自定义 effect / effect alias，否则报 error（新错误码，如 E0505 "unknown effect `typo`"）。

### #99 `remove_specific_fail_effect` dead code [low] [open]

`infer_ctx.ring:1070` 定义了 `remove_specific_fail_effect`，`infer.ring:29` import 但从未调用。当前设计 catch 总是消除全部 fail effect，该函数为遗留 dead code。应删除定义和 import。

发现者：Auditor（2026-05-23）

### #100 `List.last()` 空列表时依赖 JS 负索引行为 [low] [open]

`std/list.ring` 的 `last()` 实现 `self.get(self.len() - 1)`，空列表时变为 `self.get(-1)`。JS runtime 对负索引返回 `undefined` → 映射为 `none`，结果恰好正确但依赖 JS 实现细节。LLVM 后端可能 panic。应加 `if self.is_empty() { return none }` 前置检查。

发现者：Auditor（2026-05-23）

## 代码质量 / 可维护性

### #6 `runtime.ring` 用数百个 `.push()` 拼接 JS 运行时代码 [low] [open]

应改用 raw string 或外部 .js 文件。

### #7 `infer.ring` 2763 行单文件 [low] [open]

应拆分为 infer_stmt/infer_expr/infer。


### #14 68 处 `panic()` 调用（约 40 处 unreachable）[low] [open]

崩溃而非友好报错。应逐步替换为 DiagnosticSink。

## 架构债

### #16 StructType/EnumType 携带冗余 fields/variants 数据 [low] [open] [deferred: LLVM]

类型表示不一致。应改为 nominal 表示。

**决策（2026-05-23）**：长期容忍，与 #45 一并推迟到 LLVM 后端阶段。

### #19 Ring 编译器缺少 `assertNever` 等效编译期保护 [low] [open]

新 variant 易遗漏。应确保所有 match 穷尽。

### #20 HExpr/HStmt match 在 5+ pass 中重复 [low] [open]

维护负担。应扩展 hir-visitor。

## 模块/诊断

### #97 `load_prelude` 对 bounded impl 内方法间调用误报 E0503 [medium] [open] [after: B-005]

`impl<T: Eq> Set` 中 `insert` 调用同 impl 的 `contains` 时，prelude 编译报 E0503（"Type does not satisfy trait bound 'Eq'"）。`load_prelude` 设置了 type_param_scope 但 bounded impl 上下文的 bounds 不传播到方法间调用。导致 #90 的理想修复（Ring 层 Eq-aware Set.insert）无法实现，只能用 runtime `__ring_deep_eq` 替代。

**决策（2026-05-23）**：应修复。排在 B-005 supertrait 之后——共享 trait 注册逻辑，修完后 Set 方法可改为 Ring 实现（Eq trait dispatch），删除 `__ring_deep_eq` hack。

发现者：Worker B3 agent（2026-05-23）


## 设计-实现差距（参考，已在 backlog 跟踪）

> 以下为未实现特性的跟踪参考，不作为 Worker 任务源。实际实现由 backlog 对应条目驱动。

| # | 设计功能 | Backlog 对应 | 状态 |
|---|----------|--------------|------|
| 36 | Refinement types (where 子句) | B-001 | 语法解析但语义忽略 |
| 37 | `mut<S>` 参数化 effect | B-037 | Cell 已移除，MutEffect 基础设施为死代码 |
| 38 | Post-resume handler / Full AE | 已取消 (B-009) | 不实现 |
| 39 | `dyn Trait` 动态分发 | B-006 | 未实现 |
| 40 | Supertrait 继承 | B-005 | AST 字段存在但空 |
| 41 | 关联类型 | B-004 | 未实现 |
