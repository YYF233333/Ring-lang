# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## Wave A: #99, #68, #64（2026-05-23）

### 1. E0407 重复报错 [通知]
#68 的 E0407 在 Pass 1 和 Pass 2 各报一次。多 pass 架构固有行为，如需去重可在 DiagnosticSink 层加 dedup。

### 2. Worktree base drift [通知]
WT-A3 和 WT-B1 均发生 base drift，拿到旧 commit。Agent 未正确停止。改动由 orchestrator 手动应用。

## Wave B: #97, #77（2026-05-23）

### 1. #97 根因比预期更深 [通知]
单独修复 checker.ring（删除冗余 type_param_scope 设置）不够。根因在 `resolve_dicts_from_scheme` 的 TypeVar 匹配——`uf_find` 只查 parent map，但 `bind_var` 通过 types map 链接变量。增加 `apply_subst` 路径解决。新增 `Set.has()` 作为永久回归测试。

### 2. #77 rigid vs inference 区分 [通知]
不能无差别拒绝所有 TypeVar 的数值运算——`.fold(0, fn(acc, x) { acc + x })` 中 lambda 参数是 fresh inference variable，需要通过 + 约束为 Int。修复只拒绝 rigid type parameters（`type_param_scope` 中的），保留 inference variable 行为。
