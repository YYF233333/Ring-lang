# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-104 W4 攻坚（native session，2026-06-08）

### condition-result Bool box 未 drop [观察]

W4（scalar-reassign-drop，git `4fe2bef`）的隔离计数器测试（`while i < N { ... }` 10M 循环）顺带暴露：**while/if 条件的 Bool 结果 box 未被 drop** —— tid2(BOOL) 随循环次数线性爬（10M 循环 → 10M live BOOL）。这独立于 W4（W4 管 `x = expr` reassignment，不管 condition 结果）。

- **性质**：precise-RC gap。condition 是 fresh-owned 临时 Bool box，codegen 把它 unbox 到 i1 用于分支跳转后，box 即死、无人 drop → 每次求值泄漏一个。while 条件每轮泄漏一个。if 条件每次泄漏一个。
- **可回收性**：可回收（不像 ② 合法存活装箱标量）。修法 = codegen 在条件 lowering（unbox-to-i1 之后）drop 该 Bool box，或 perceus 在 While/If 的 condition 位标记 droppable 临时。需小心：condition 可能是借用（`if flag` 直接读 Bool 变量、非 fresh），只 drop fresh-owned condition box。
- **量级**：全自编译 BOOL @402M=14.6M（含 condition + 其他 Bool 临时），< INT 63M。**即便修也到不了 G-a，仍需 B-080**。故非紧急，按需排队。
- **建议**：可排队为 precise-RC 收尾小波（[bugfix] [P3] [S/M] [judgment]），或并入 B-080 前的清理。优先级待用户定。
