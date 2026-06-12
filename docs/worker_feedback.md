# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

（上一批：B-104 D4 + 验收棒 + 下一杠杆组，2026-06-12 Discussion 处理完毕——主决策拍板 = 选项 C 归因先行（D5，落 B-104 执行序，数据出来回桌拍 A/B，不预批）；capstone 全强度 ASan 挂账待用户指定在场时间；2 条 dict dispatch pre-existing [决策] 合并立项 **B-121** [P2]；10 条 [通知] 纯信息/已闭环确认删除；残留③ dist-llvm warning 数字顺手更新进 B-099 备忘（~970→~1020）。）
