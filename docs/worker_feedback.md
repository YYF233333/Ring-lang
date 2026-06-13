# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-104 D9（门① 收尾）— 待下次 /discussion 同步两件

### [待办·design 同步] §7.11「门① 收尾」premise 修正（Part 1 [决策] 已拍 A，2026-06-13）

D9 Part 1 [决策] **用户已拍 = (A) `gen_string_interp` codegen-drop**（详见 backlog B-104 D9 块 Part 1 + A 实现要点）。但 design.md §7.11 当前仍写「codegen-drop 仅兜底、违 D4 豁免类永存」——**此 premise 被 D9 实测推翻**（interp SB 是 codegen 合成、从不进 HIR、codegen-drop 零新增豁免 = verify_rc 头注 codegen-level boundary 第 4 类，orchestrator 核实）。**下次 /discussion 把 §7.11 Part 1 的 codegen-drop 从「兜底」改「首选/原则 garbage-free 修法」、删「违 D4 豁免类永存」误判**（worker 不碰 design.md，故挂此）。Part 1 实现本身暂停（并发会话占主仓 + 用户暂停），A 已落 backlog 备接棒。

### [观察·待 triage] probe 撞出可能独立的 RC gap（非 D9 范围）

probe-E `let c = Color::Blue{shade}` 循环里 matched-then-discarded，每轮泄 `tid68=n`——**fresh payload-enum 局部**（非 const，与 Part 2 无关）matched 时只投影标量、未 scope-end-drop。subagent 已改写 probe 避开以隔离 const 类。可能是独立 RC 漏点，**下次 /discussion triage**（是否转 audit-report）。

（已处理并落账：D9 Part 2 ✅ done git `70db1ef`（Type::UnitType 单例化，Type 22.7M→~0.3M、总 live 185.2M→162.3M，全验证绿——明细见 backlog B-104 D9 块 + git）；D9 Part 1 [决策] 已拍 A（见上待办）。更早 D8 组 2026-06-13、D6/D7 组 2026-06-13、D5 组 2026-06-12 已处理。）
