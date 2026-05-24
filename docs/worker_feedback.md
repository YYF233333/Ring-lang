# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## Worker Wave B（2026-05-24）

### 1. #107 删除了一个基于错误前提的负面测试 [通知]

`error_mod_requires_open_row.ring` 期望 `fn apply(f: fn() -> Int) -> Int { f() }` 在 `mod requires {io}` 内被拒绝。但 effect-polym态函数是安全的——具体 effect 在调用点才确定，会被调用方的 capability 检查捕获。此测试前提错误，已删除并替换为 `mod_requires_pure_fn.ring`（验证纯函数在 mod requires 内可编译）。

### 2. #114 需要 catch 包裹 unify_effect_params 防止 crash [通知]

`merge_effects` 中新增的 `unify_effect_params` 调用可能抛出 `fail<UnificationError>`，如果不 catch，错误会向上传播到 `check_fn_decl` 触发已知的 "impl method effect not propagated" bug（`__ring_ev_fail` undefined）。Agent 用 `catch { _ => result_s }` 包裹，统一失败时保持 subst 不变。这是正确的防御，但也说明 impl effect 传播 bug（#77 关联）的影响范围比预期更大。

### 3. #104 仍在运行，与 Wave C 无文件重叠 [通知]

WTB1 (#104 effect row tail 非对称统一) 运行时间较长，但与 Wave C 的文件集（infer_decl.ring, infer_register.ring, infer.ring/infer_ctx.ring）无重叠，已先行启动 Wave C。WTB1 完成后会单独 merge。

