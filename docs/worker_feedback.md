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

## B-163 Phase 2 P2.2 当前状态（2026-07-28）[通知]

Phase 2 的机器证据门继续有效；audit #251 的 abort 半边已按用户拍板的方案 A 实现并通过独立 review。matrix 当前 **77 covered / 7 known-gap / 3 manual-evidence**，剩余 1 LLVM-only + 6 shared-positive：

1. `default_effect_topo` 是唯一 LLVM-only gap，保留为退役证据，不为即将删除的后端扩修。
2. shared-positive 为 `api_clone`、Iterator、两个 Set gap 和两个 tuple equality gap。`api_clone` + Set 归已拍板的 B-107/B-152 P4（Map-backed `Hash + Eq` + 自动 derive Hash）；Iterator 与 tuple equality 可独立修。
3. 三个 manual 项仍是死的 `HStmt::Dup`、C `#line` 和 extern-handle RC 结构断言，需自动化或删除死面。
4. LLVM tag/删除、dist-c anchor 与 CI bootstrap 尚未开始；只有其余认证门闭合后才创建 `llvm-c-backend-final` tag 并进入退役清单。

#251 现在执行 abort arm body：当前 handler/evidence 先失活，payload 再进入 arm 词法作用域，arm 恰好执行一次并替换整个 handle 结果，re-raise 逃向外层。开放 HOF row、registration-owned 单态变量与 owner-qualified associated type provenance 均有正负回归；不可安全表示的关联类型关系 fail-closed。通用 tail-resumptive arm 的静态 result/effect 缺口没有借机扩面，继续由 audit #258 跟踪。

最终源码快照下 C e2e `486/0/6`、LLVM e2e `485/0/7`、RC `548/0/2`、parity `77/0/10`；diff `575/2/7` 的两项均为既有 LLVM 无诊断 `0xC0000005`，同快照在 root/reviewer 隔离重试全部通过，原始失败仍如实保留。合并后完整 main runner 为 e2e `484/1/7`、golden `223/0`、RC `548/0/2`、self-compile `4/0`、parity `77/0/10`；唯一失败 `module_nominal_enum_pattern_tags` 也是无诊断 `0xC0000005`，隔离 `3/3` 全绿，未以重跑整轮抹除信号。三份独立 LLVM `main.o` 均为 4,828,560 bytes、SHA256 `A084097B38A14988F79C250768B2B455FC71471C7F92D908A0A37D6849BF614E`。LLVM verifier 的既有 warning 继续归 audit #247 baseline，不伪称 verifier clean。
