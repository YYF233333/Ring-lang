# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

（当前无待处理条目。上一批：B-104 D1 Stage 3 收尾组，2026-06-12 Discussion 处理完毕——4 条 [通知] 已落账确认删除（#150 修复 = git `0f80b42`/`735a669` + audit 墓碑；map/set fold 核实 = #138 精化；HOF 泄漏类 = audit #152 [open]；退役方式 = git）；[观察] dist-llvm 970 warning 已转 B-099 条目既有现象备忘。）
