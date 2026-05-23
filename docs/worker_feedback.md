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

### 1. #99 dead code 清理 [通知]

删除了 `remove_specific_fail_effect`（infer_ctx.ring）及其 import（infer.ring）。该函数是早期"部分 catch"设计的遗留，当前 catch 总是消除全部 fail effect，所以从未被调用。

### 2. #68 E0407 unknown effect 验证 [通知]

在 `resolve_effect_expr` 中添加了自定义 effect 存在性检查。`with {typo}` 现在报 E0407。

**值得注意**：E0407 会在 Pass 1（注册阶段）和 Pass 2（检查阶段）各报一次，导致同一个 unknown effect 出现两条错误。这是多 pass 架构的固有行为，与其他错误码（如 E0207 重复定义）一致。如果认为需要去重，可以在 DiagnosticSink 层面加 dedup——但这是独立的改进项，不属于 #68 scope。

### 3. #64 effect 标注类型参数匹配 [通知]

在 `infer_decl.ring` 的标注验证循环中，kind 匹配成功后增加了 `unify_at` 调用来验证类型参数。`fn foo() -> Int with {fail<Str>} { fail.raise(42) }` 现在报 E0301（type mismatch: Int vs Str）。

**设计判断**：没有修改 `effects_match_kind` 函数本身——它在 `unify.ring` 的 row unification 中被使用，那里 kind-only 匹配是正确的（后续由 `unify_effect_params` 处理类型参数）。也没有修改 capability checking（`check_effects_capability`）——module capability 只需 kind 级检查。

### 4. WT-A3 base drift [通知]

WT-A3 agent（#64）的 worktree 创建时发生 base drift——拿到的是旧 commit 而非预期的 `e160568`。Agent 没有正确停止并报告。最终 #64 的改动由 orchestrator 手动应用在 WT-A2 的分支上，经验证后 merge 回 main。

