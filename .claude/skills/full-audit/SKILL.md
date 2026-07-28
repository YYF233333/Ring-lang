---
name: full-audit
description: Run one repository-wide bounded adversarial audit round. Use only for global/全面/彻底 codebase “审查”, “review” or “全局自查”, “交叉验证”, `/full-audit`, exemption-list audit, or a Repository Steward risk-triggered Audit; ordinary PR/commit/diff review belongs to steward.
---

# Full Audit

每次调用只执行一个固定 snapshot 的 bounded round：finder → 对抗验证 → root 终审 → 落表。不得在同一 round 中循环到 dry 或开启第二轮；完成后返回 Repository Steward。

Steward 可在高风险 milestone、信任边界变化、修复批次后或队列空档自主触发未来的新 round，无需用户手动发令。每个新 round 仍必须独立、有限。开始前完整读取 `AGENTS.md`、`CLAUDE.md`、`docs/workflow.md`、backlog、audit-report 和 Steward Inbox。

同一 trigger + 未变 snapshot 最多一轮。没有新 commit、新 lens 证据或新的风险事件时，不得仅因队列仍空就立即重开；无 finding 的 round 返回维护/队列扫描，否则属于形式 bounded、实质 loop-until-dry。

## 边界

- 普通 PR、commit 或 scoped diff review 属于 Steward 的 reviewer 流程，不触发 full-audit；单说“审查/review”只有在上下文指向仓库级审计时才走本 skill；
- finder / skeptic 只读；
- root 的 worktree 写入只限 `docs/audit-report.md` 和必要的用户保留决策包；另由共享 helper 写专用 Git notes ledger；
- Audit 子流程不修代码，探针只放临时目录；
- finding 落表后返回 Steward，由新的执行任务接管；
- 用户明确要求“只审不修”时，完成本 round 即结束该用户范围。

## Durable Audit ledger

所有 provider 共用 `.agents/scripts/audit_ledger.py` 和专用 `refs/notes/ring-steward-audit-ledger`。Canonical key 只能由 stable trigger/event id + audited source SHA + normalized lens set 组成。

Lens 是六项闭集：`rc-memory`、`type-soundness`、`backend-parity`、`runtime-abi`、`design-drift`、`oracle-blind`；排序、去重后进入 key。动态 lens、日期 lens、序号后缀或未知 lens 必须由 helper 拒绝并 exit 2。专项豁免子类放入 stable trigger/event id，lens 仍限上述六项。

普通 first-round trigger 必须稳定；`round`、`run`、`retry`、`attempt`、`counter` 或裸数字递增 suffix（如 `audit:round-2`、`audit:2`）一律 exit 2。可重开的 anchored evidence event 只允许 `evidence:commit:<full-sha>`。Helper 必须用 Git 验证 full SHA 是真实 commit、不同于 audited source SHA，且 audited source 是 evidence commit 的 ancestor；evidence commit 还必须由至少一个 `refs/heads/*`、`refs/remotes/*` 或 `refs/tags/*` reachable durable ref 包含。`refs/notes/*`、reflog 和纯 object-only 均排除，dangling commit 必须拒绝并 exit 2。外部 finding / issue 必须先落成基于 audited source 的 durable evidence commit，再使用该 commit SHA。

1. Session 恢复时对拟恢复的 Audit key 执行 `query`。
2. Round 开始前执行 `check`；同一 canonical key 已记录时 helper 返回 `skip-recorded`/exit 3。相同 audited source SHA + normalized lens set 已有任一 record 时，不同 trigger 只有合法 anchored evidence event 才能开始；普通 `risk:next-event` / `risk:post-fix-batch` exit 2。新的 audited source SHA 或真正不同的 normalized lens set 仍可使用普通 stable trigger。
3. Round 结束时，无论结果是 findings 还是 no-findings，都执行 `record --outcome findings|no-findings`；record 成功前 round 未闭环。

```powershell
python .agents/scripts/audit_ledger.py --repo <repo> query --trigger-id <stable-id> --source-sha <sha> --lens <lens>
python .agents/scripts/audit_ledger.py --repo <repo> check --trigger-id <stable-id> --source-sha <sha> --lens <lens>
python .agents/scripts/audit_ledger.py --repo <repo> record --trigger-id <stable-id> --source-sha <sha> --lens <lens> --outcome <findings-or-no-findings>
```

禁止用当前日期、随机 id 或递增 counter 制造新 trigger 绕过防抖。Ledger note commit 不算 source snapshot 变化；同 scope 只能由合法 anchored evidence event 形成新 key。Ledger 是 repo-local 治理状态，不写 Steward Inbox，也不进入用户过程摘要。

## 固定本 round

1. 记录 main commit；所有角色审查同一 snapshot。
2. 读取 backlog、audit-report 和 Inbox，标记 `planning` / `doing` 范围。
3. 运行 workflow validator。
4. 按风险选择 rc-memory、type-soundness、backend-parity、runtime-abi、design-drift、oracle-blind lens；“彻底审查”只扩大本 round 覆盖，不增加 round。

## Finder 与对抗验证

按当前可用槽位派至少两路独立视角；一个 finder 可负责相邻 lens。跨 provider finder 可用时保留不同 provider 的证据路线；不可达时记录证据缺口，但不得把同一视角重复计票。输出必须包含文件、行号、执行路径、影响和可复核证据，不确定项标为 hypothesis。

每个候选至少执行：

1. 非原 finder reproduce 或给出独立代码证明；
2. 另一独立视角主动 refute correctness、可达性或影响；
3. root 检查 backlog、audit-report 和 doing 范围去重。

落表 finding 至少两个独立支持判断，且 refutation 已被解释；`already-tracked` 只做去重，不计支持票；critical 由 root 亲自读码。killed、duplicate、in-progress 或 insufficient-evidence 只进入本 round Summary，不包装成用户实现流水或新 finding。

## 分级与落表

严重度只允许 `critical|medium|low`，dispatch 只允许 `mechanical|judgment`。root 使用活动 heading 协议写入 `docs/audit-report.md`，运行 validator，并生成一个 audit commit：

```markdown
### #xxx <标题> [critical|medium|low] [mechanical|judgment] [open]

<问题、文件与行号、影响、证据、建议修复方向>

发现者：<finder>；验证：<reproduce / refute / root verdict>
```

## verify_rc 豁免专项

“审豁免”仍是一个 bounded round。先核对 `compiler/verify_rc.ring` 头注和运行尾随 boundary note，再分派 skeptic 尝试构造 UAF/无界泄漏反例，或攻击安全论证中未被 invariant/测试钉住的前提。反例成立按正常 finding 落表；论证成立只记录检查路径，不自动扩大到下一批。

## Round Summary

只报告固定 commit/lens、新 finding 与最高风险、killed/duplicate/in-progress/insufficient-evidence 计数、仓库健康影响和下一步。不要报告 finder 等待、命令进度、原始日志或实现流水。

本次调用不得修复 finding、再次 fan-out 或开启第二轮；结束后返回 Steward。未来新 round 只能作为新的 bounded 风险任务自主启动。
