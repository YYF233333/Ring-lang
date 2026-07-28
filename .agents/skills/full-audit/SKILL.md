---
name: full-audit
description: Run one repository-wide bounded adversarial audit round. Use only for global/全面/彻底 codebase “审查”, “review” or “全局自查”, “交叉验证”, `/full-audit`, exemption-list audit, or a Repository Steward risk-triggered Audit; ordinary PR/commit/diff review belongs to steward.
---

# Full Audit

每次调用只执行一个固定 snapshot 的 bounded round：finder → 对抗验证 → root 终审 → 落表。不得在同一 round 中循环到 dry 或开启第二轮；完成后返回 Repository Steward。

Steward 可在高风险 milestone、信任边界变化、修复批次后或队列空档自主触发未来的新 round，无需用户手动发令。每个新 round 仍必须独立、有限。开始前完整读取 `AGENTS.md`、`CLAUDE.md`、`docs/workflow.md`、backlog、audit-report 和 Steward Inbox。

同一 trigger + 未变 snapshot 最多一轮。没有新 commit、新 lens 证据或新的风险事件时，不得仅因队列仍空就立即重开；无 finding 的 round 返回维护/队列扫描，否则属于形式 bounded、实质 loop-until-dry。

## 写入边界

- 普通 PR、commit 或 scoped diff review 属于 Steward 的 reviewer 流程，不触发 full-audit；单说“审查/review”只有在上下文指向仓库级审计时才走本 skill；
- finder / skeptic：不修改任何仓库文件；
- root 的 worktree 写入只限 `docs/audit-report.md` 和必要的用户保留决策包；另由共享 helper 写专用 Git notes ledger；
- Audit 子流程不修复代码，不把探针加入正式测试；
- finding 落表后由新的执行任务接管，不能把修复混入本 round；
- 用户明确要求“只审不修”时，完成本 round 即结束该用户范围。

需要 probe 时使用临时目录；候选成立后由 Repository Steward 的执行任务决定正式 regression test。

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

## Phase 0：固定本轮

1. 记录 main commit；本轮所有 agent 审查同一 snapshot。
2. 读取 backlog、audit-report 和 Steward Inbox。
3. 标记 `planning` / `doing` 范围，避免重复。
4. 运行 `python .agents/scripts/validate_workflow.py`。
5. 按风险选择 lens：
   - rc-memory
   - type-soundness
   - backend-parity
   - runtime-abi
   - design-drift
   - oracle-blind

标准审计选择与近期改动最相关的 lens；“彻底审查”在**同一轮**覆盖全部六个 lens，不增加第二轮。

## Phase 1：Finder fan-out

按当前可用槽位派至少两路独立视角；一个 finder 可负责多个相邻 lens。跨 provider finder 可用时保留不同 provider 的证据路线；不可达时记录证据缺口，但不得把同一视角重复计票。Finder prompt 包含：

- 固定 commit 和审计范围；
- 分配的 lens；
- 当前 doing / 已追踪条目；
- 输出必须含文件、行号、执行路径、影响和证据；
- 禁止写仓库、禁止修复；
- 不确定项明确标为 hypothesis。

Finder 输出候选 finding，而不是直接写 audit-report。

## Phase 2：对抗验证

复用已经完成 finder turn 的 agent，给它们发送 skeptic follow-up。原 finder 不得单独验证自己的候选。

每个候选安排三种检查：

1. **reproduce**：非原 finder 尝试复现或给出独立代码证明；
2. **refute-correctness**：另一独立视角主动证明实现可能正确、不可达或影响被夸大；
3. **already-tracked**：root 检查 backlog、audit-report 和 doing 范围。

记录 finding 需要：

- 至少两个独立支持判断；
- refutation 已被解释；
- 证据可定位；
- critical 由 root 亲自读码确认。

`already-tracked` 只做路由与去重，不计支持票。killed、duplicate、in-progress 或 insufficient-evidence 只进入本 round Summary，不能静默丢弃，也不能写成新的 finding。

## Phase 3：分级与 dispatch

严重度只允许：

- `critical`：运行时错误、类型不安全、内存安全或明确严重语义错误；
- `medium`：确定影响正确性或健壮性，但非最高级；
- `low`：低影响缺陷、维护性风险或窄边界问题。

Dispatch：

- `mechanical`：修复路径唯一，描述足以直接执行；
- `judgment`：涉及设计、架构、effect / type / RC 推理或多种方案。

非 bug 且无行动价值的观察只保留在本 round 证据中，不写入 Steward Inbox；需要工程行动的验证缺口按风险分级落表，需要用户保留决定时才写决策包。

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

反例成立或关键安全前提缺少 invariant/回归锚点时，按正常 finding 分级写入 audit-report；论证成立只记录检查路径。本 round 不自动扩大到下一批。

## Round Summary 与边界

内部记录固定 commit/lens、证据路线、新 finding、killed/duplicate/in-progress/insufficient-evidence 计数、open 总数和 validator 结果。需要提交时只生成一个 audit commit。

本次调用不得修复 finding 或再次 fan-out；Steward 可在后续风险节点自主创建新的 round。面向用户只汇报新增 finding、最高风险、仓库健康影响和下一步，不报告 finder 等待、命令进度、原始日志或实现流水。
