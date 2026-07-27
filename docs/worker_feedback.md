# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
>
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

---

## B-163 Phase 2 P2.1 parity 基线（2026-07-27）[通知]

merge `156b005` 已把 Phase 2 的证据层落成机器门：81 行 matrix（65 covered / 13 known-gap / 3 manual），enum variant closure、完整双后端 lane bundle、repo-relative gap identity、orphan companion 与 `EXPECT_PANIC` 作用域都由 runner 反向校验。完整结果与五个 LLVM 间歇 `0xC0000005` 样本已回填 backlog B-163。

后续恢复顺序固定为：

1. P2.2 对 11 个 shared-positive gap 做根因聚类并修复；唯一 check-only gap audit #222 已闭合，LLVM-only `default_effect_topo` 保留为退役证据，不为即将删除的后端扩修。
2. 把三个 manual 项变成自动门或删除死面：`HStmt::Dup` 无生产者、C `#line`、extern-handle RC 结构断言。
3. 对抗 review + 全量 C/LLVM/diff/RC/self-compile 固定点；只有认证门闭合后才创建 `llvm-c-backend-final` tag 并进入删除清单。

当前禁止把 matrix 的 wiring PASS 当语义执行 PASS；`--suite parity` 输出已明确标注这一点。LLVM tag/删除、dist-c anchor 与 CI bootstrap 尚未开始。
