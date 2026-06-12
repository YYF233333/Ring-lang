# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

（上一批：B-104 D5 归因测量组，2026-06-12 Discussion 处理完毕——主决策拍板 = **D6 none+const 单例化先行 → D7 And/Or lower 成 if-else**（路线 (b)，否决 (a) post-unbox drop 半套），spec 落 backlog B-104 D6/D7 块 + design.md §7.11「D5 归因后收口」节；#152 拍板降级用户面收口（脱 G-a 路径，B-104 落地后与 B-121 同档，header 加 [deferred: B-104]）；#155 拍板修法 = harness 嵌 asInvoker manifest（先行/随 D6 首棒解锁 72/72）；#153/#154 收口归 D6；6 条 [通知] 纯信息/已转 audit 追踪确认删除；capstone 全强度 ASan 继续挂账待用户指定在场时间。）
