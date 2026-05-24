# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-004 关联类型

### 1. E0513 bound 验证未深度实施 [通知]

关联类型带 bound（`type Iter: Iterator<T>`）的验证基础设施已搭建（E0513 错误码 + ImplEntry.assoc_types），但 impl 中赋值类型是否满足 bound 的完整验证尚未深度实施。当前关联类型的 bound 信息被存储但不触发错误报告。覆盖主要用例不受影响（basic/qualified/constraint/default 均正常），bound 验证是边缘场景。

### 2. `Self::Item` 在 trait body 中不支持 [通知]

trait body 中引用关联类型需使用裸名 `Item`（通过 `type_param_scope` 注入），`Self::Item` 路径不支持。这是因为 `Self` 在当前实现中不被视为 `type_param_scope` 中的类型参数。Rust 两种写法都支持，Ring 当前仅支持裸名。spec 中 `where I::Item == Int` 语法也按计划未实现。

### 3. `parse_type_bound` 使用 rollback 策略解析 assoc constraint [通知]

`parse_type_bound` 中解析 `<...>` 内容时使用 `save_pos` / `sink.save()` / `sink.restore()` 的 rollback 策略区分 assoc constraint (`Name =`) 和普通 type arg。这要求 DiagnosticSink 支持 checkpoint/restore。

## B-053 Debug derive FnType

### 1. 新增 FieldAction::FnLiteral variant [通知]

选择了新增 `FieldAction::FnLiteral` variant 方案（而非在 `Identity` 分支内判断类型），更清晰且扩展性好。Eq/Clone/Ord 的 `gen_action_*` 函数中对 `FnLiteral` 直接 panic unreachable，因为 FnType 字段对这些 trait 返回 `none`（阻止派生）。

