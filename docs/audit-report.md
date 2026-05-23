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


### #45 `StructType`/`EnumType` 在 `apply_subst` 中不替换 fields [low] [open] [deferred: LLVM]

设计约束：fields 是模板字段（含递归引用），递归替换会导致 `Node<T>` 等递归类型栈溢出。当前 `infer_field_access` 的 inst_map 兜底是正确设计。如需修复需改为 nominal 表示（关联 #16）。

**决策（2026-05-23）**：长期容忍。当前方案正确且无性能问题，改动大（L-XL）收益主要在未来后端。等 LLVM 后端需要时与 #16 一并重构。

## Codegen


### #28 HOF inline 代码在 List/Map/Set/Option 间重复 [low] [open]

~100 行重复。应抽象迭代模式。

### #29 Runtime 耦合 Node.js ESM（createRequire）[low] [open]

可移植性问题。


## Effect 标注


### #66 `register_impl_method` declared_effects 已使用但 Pass 2 仍不回传 [medium] [open] [blocked: B-005]

~~原报告称 declared_effects 参数完全不使用——已修复（infer_register.ring:573-577 现在 resolve 并应用 declared_effects）。~~ 但核心问题仍在：Pass 2 推断出的实际 effect 不回传到环境。关联 #42。

**决策（2026-05-23）**：随 #42 推迟到 B-005 supertrait 重构时统一处理。

发现者：Opus（2026-05-23 更新）

### #67 `std/io.ring` 的 `print`/`assert`/`exit` 缺少 `with {io}` 标注 [medium] [open] [blocked: #42]

纯函数 `with {}` 内调用 `print()` 不报 E0404——extern fn 无标注时注册为 EMPTY_ROW。

**决策（2026-05-23）**：依赖 #42（impl effect 回传）修复后才能正确处理 extern fn effect 标注。随 #42 推迟。



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

## 模块/诊断



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
