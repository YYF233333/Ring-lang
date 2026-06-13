# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

（上一批：B-104 D8 门① 归因测量组 [通知]+[决策]，2026-06-13 Discussion 处理完毕——fork 拍定 = D9 收口（interp/join SB 收口 + Type::UnitType 单例化，HIR-first 优先）+ 门① 判据 refine（孤儿类→~0 + leak%→~0/有界 + verifier 全绿 + 无 per-iteration 无界类，非绝对 plateau），spec 落 design.md §7.11「门① 收尾」+ backlog B-104 D9 块。更早 D6/D7 组 2026-06-13 已处理、D5 组 2026-06-12 已处理。）
