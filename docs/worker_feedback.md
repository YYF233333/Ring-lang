# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## Wave A+B 审计修复（2026-05-23）

### 1. #89 Result prelude 需要 load_prelude Enum 支持 [通知]

修复 #89 时发现 `load_prelude()` Phase 2 只处理 `Decl::Impl` 和 `Decl::Fn`，不处理 `Decl::Enum`。即使将 `result.ring` 加入 `STD_FILES`，Result enum 构造器也不会被编译到 prelude JS。已同步修复。

### 2. #90 理想修复被 checker prelude 限制阻止 [通知]

Set.insert/remove 的理想修复是移到 `impl<T: Eq> Set`，用 Ring 实现（调用 self.contains()）。但 `load_prelude` 对 bounded impl (`impl<T: Eq>`) 内方法间调用会误报 E0503。已改用 runtime `__ring_deep_eq` 实现。差异：使用结构相等而非 Eq trait dispatch，对自定义 Eq 实现会有语义偏差。`Set.union/intersect/difference` 仍使用 JS `===`。

### 3. #96 IndexExpr 赋值可变性检查超预期 [通知]

Agent 不仅标记了 wildcard 不可达，还完整实现了 `Expr::IndexExpr` 赋值目标的可变性检查（含 `find_root_expr` 扩展）。为未来 `list[i] = val` 语法做好了准备。

### 4. #89 现有测试冲突 [通知]

`type_alias_generic.ring` 中有 `type Result<T> = Option<T>` 定义，与 Result prelude 化后冲突。已重命名为 `MaybeVal<T>`。

---

## Audit 观察报告（2026-05-23）

### 1. [观察] 穷尽性检查对非有限类型报告 "missing pattern for `_`"

**现状**：当 match 缺少对 Int/Float/Str 的 wildcard 覆盖时，错误信息报告"missing pattern for `_`"。语义正确但文案可更明确（如"非有限类型需要 wildcard 或 binding pattern"）。
**为什么值得注意**：纯粹的用户体验改进。`_` 作为缺失 pattern 的名称可能让新用户困惑——他们可能认为需要字面上匹配 `_` 而非理解它代表 wildcard 模式。

### 2. [观察] `remove_specific_fail_effect` 定义但从未调用

**现状**：infer_ctx.ring:1070 定义了 `remove_specific_fail_effect`（按 error type 精准移除 fail effect），infer.ring:29 import 了但从未调用。`infer_catch` 始终使用 `remove_fail_effect`（移除全部 fail effect）。
**为什么值得注意**：该函数可能是为未来"部分 catch"特性准备的，也可能是重构遗留。当前设计明确 catch 总是消除全部 fail effect，所以是 dead code。不影响正确性但增加维护负担。

### 3. [观察] `List.last()` 空列表时依赖负索引的实现定义行为

**现状**：std/list.ring:9 `self.get(self.len() - 1)` 空列表时变为 `self.get(-1)`。JS runtime 的 `get` 对负索引返回 `undefined` → Ring 映射为 `none`，结果恰好正确。但语义依赖 JS 实现细节。
**为什么值得注意**：如果未来 `get` 的运行时实现改变（如 LLVM 后端），`get(-1)` 可能 panic 而非返回 none。应加 `if self.is_empty() { return none }` 前置检查。

