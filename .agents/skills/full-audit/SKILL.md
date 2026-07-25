---
name: full-audit
description: Run one bounded adversarial audit round over Ring-lang. Use for “审查”, “review”, “自查”, “全面检查”, “彻底审查”, “交叉验证”, `/full-audit`, or exemption-list audit requests. Each invocation performs one finder pass plus adversarial verification, records findings, and stops; it never loops until dry or starts a later round automatically.
---

# Full Audit

每次触发只执行一轮，不得自动开始下一轮。对抗验证是本轮的一部分；写入报告和 Summary 后停止。修复本轮 finding 后，必须由用户手动发起下一轮。

开始前完整读取 `AGENTS.md`、`CLAUDE.md` 和 `docs/workflow.md`。

## 写入边界

- finder / skeptic：不修改任何仓库文件；
- root：只写 `docs/audit-report.md` 和必要的 `docs/worker_feedback.md` `[观察]`；
- Audit 不修复代码，不把探针加入正式测试。

需要 probe 时使用临时目录；若候选最终成立，由后续 Worker 决定正式 regression test。

## Phase 0：固定本轮

1. 记录 main commit；本轮所有 agent 审查同一 snapshot。
2. 读取 backlog、audit-report 和 worker_feedback。
3. 标记 `planning` / `doing` 范围，避免重复。
4. 运行 `python .agents/scripts/validate_workflow.py`。
5. 选择 lens：
   - rc-memory
   - type-soundness
   - backend-parity
   - runtime-abi
   - design-drift
   - oracle-blind

标准审计选择与近期改动最相关的 lens；“彻底审查”在**同一轮**覆盖全部六个 lens，不增加第二轮。

## Phase 1：Finder fan-out

按当前可用槽位派 `finder` role，一个 finder 可负责多个相邻 lens。Finder prompt 包含：

- 固定 commit 和审计范围；
- 分配的 lens；
- 当前 doing / 已追踪条目；
- 输出必须含文件、行号、执行路径、影响和证据；
- 禁止写仓库、禁止修复；
- 不确定项明确标为 hypothesis。

在 DS 可用且 `deepseek-dispatch` 可调用的机器上，同时派一路独立 DS finder。DS 不可达时记录在 Summary，继续 Codex 审计，不阻塞。

Finder 输出候选 finding，而不是直接写 audit-report。

## Phase 2：对抗验证

复用已经完成 finder turn 的 agent，给它们发送 skeptic follow-up。原 finder 不得单独验证自己的候选。

每个候选安排三种检查：

1. **reproduce**：不同 agent 尝试复现或给出独立代码证明；
2. **refute-correctness**：不同视角主动证明实现可能正确、不可达或影响被夸大；
3. **already-tracked**：root 检查 backlog、audit-report 和 doing 范围。

记录 finding 需要：

- 至少两个独立支持判断；
- refutation 已被回应；
- 证据可定位；
- critical 由 root 亲自读码确认。

`already-tracked` 只做路由与去重，不计支持票。被杀候选必须在 Summary 中计为 killed、duplicate、in-progress 或 insufficient-evidence，不能静默丢弃。

## Phase 3：分级与 dispatch

严重度只允许：

- `critical`：运行时错误、类型不安全、内存安全或明确严重语义错误；
- `medium`：确定影响正确性或健壮性，但非最高级；
- `low`：低影响缺陷、维护性风险或窄边界问题。

Dispatch：

- `mechanical`：修复路径唯一，描述足以直接执行；
- `judgment`：涉及设计、架构、effect / type / RC 推理或多种方案。

Observation 写入 worker_feedback，不伪装成 bug。

## Phase 4：落表

root 使用格式：

```markdown
### #xxx <标题> [critical|medium|low] [mechanical|judgment] [open]

<问题、文件与行号、影响、证据、建议修复方向>

发现者：<finder>；验证：<reproduce / refute / root verdict>
```

规则：

- 新 ID = 历史最大 ID + 1；
- 与现有 active item 重复则不新增；
- 已修复旧 item 直接删除；
- root 是 audit-report 的唯一写者；
- 写入后运行 workflow validator。

## 专项：verify_rc 豁免抽审

本次调用仍然只是一轮。读取豁免清单头注和 boundary note，把本轮选定的豁免类分给 finder；skeptic 尝试：

1. 构造 UAF / 无界泄漏反例；
2. 找出安全论证依赖但未被测试或 invariant 钉住的前提。

反例成立写 audit-report；缺回归锚点写 `[观察]`；论证成立则在 Summary 记录检查路径。完成后停止，不自动抽下一批。

## Summary 与强制停止

输出：

- 固定 commit 和覆盖 lens；
- finder / DS 路线；
- 新 finding 数量和严重度；
- killed / duplicate / in-progress / insufficient-evidence 数量；
- observation；
- 当前 open 总数；
- validator 结果；
- “本轮已结束，下一轮需用户手动触发”。

需要提交时只生成一个 audit commit。**不得修复本轮 finding，不得再次 fan-out，不得在任何修复完成后自动复审。**
