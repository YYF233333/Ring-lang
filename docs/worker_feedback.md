# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

（上一批：B-104 D6（none/const 单例化）+ D7（And/Or lower）两组 [通知] 共 13 条，2026-06-13 Discussion 处理完毕——全数纯信息/已落 backlog，确认删除。其中 D7「B-089 Map 迭代序预警」转写入 B-089 spec 作 G-b 预警；门① live plateau 未达拍板方案 A 归因先行 → 落 B-104 D8 + design.md §7.11「门① 残余归因先行」。更早 D5 归因组 2026-06-12 已处理。）
