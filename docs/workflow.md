# Ring-lang 开发工作流

三种用户入口工作流共享两个持久看板。Discussion / Worker / Audit 是 root agent 的工作模式，不是常驻 subagent；Codex 的 implementer / reviewer / finder / skeptic 才是按任务生成的执行角色。

## 核心原则

1. **用户掌握设计主权**：非 trivial 且存在多种正确方向的问题必须交给用户拍板。
2. **Spec 是执行契约**：实现严格遵循 backlog / audit item；spec 与仓库现状不符时停止，不猜测。
3. **持久状态与即时通信分离**：看板记录跨 session 真值；Codex agent 之间的进度、澄清和 review 意见走实时消息。
4. **单写者维护看板**：root agent 更新 backlog、audit-report、worker_feedback 和 CLAUDE.md；subagent 不修改这些文件。
5. **Audit 每次只执行一轮**：一轮包含 finder fan-out、对抗验证、终审和落表。完成后停止；修复后是否再审由用户手动发起。
6. **不静默绕过问题**：真实 bug 必须修复或记录；不能改测试绕开、以“既有问题”为由忽略。

## 用户入口

### Discussion（前台设计）

- **触发**：用户要求讨论设计、架构、想法或 backlog。
- **读取**：CLAUDE.md、相关设计文档、两个看板和 worker_feedback。
- **写入**：docs/ 下的设计文档、backlog、workflow 和已处理的 feedback。
- **流程**：确认事实 → 给出方案与 trade-off → 用户拍板 → 更新设计真值 → 写入带验收标准的 backlog item。
- **边界**：不实现编译器代码；不修改正在 `planning` / `doing` 的 spec，除非 Worker 明确请求。
- **旧信息立项**：基于旧 review、旧限制或 TS 时代记录立项前，先做分钟级双后端 probe 验证前提。

### Worker（实现编排）

- **触发**：用户要求执行、下一个 wave、修 audit 或实现 backlog。
- **root 职责**：选项、状态、worktree、调度、review、merge、测试门、bookkeeping 和最终汇报。
- **subagent 职责**：只在分配的 worktree 内实现和提交指定 item。
- **快速通道**：S 复杂度 item 可以由 root 直接在 main 实现；这是“orchestrator 不实现”的唯一例外，且只能在不与运行中 worktree 冲突时使用。

### Audit（单轮对抗审计）

- **触发**：
  - `/full-audit`、审查、review、自查：标准单轮；
  - “彻底审查”：扩大本轮 lens 覆盖，仍然只执行一轮；
  - “审豁免”：对 verify_rc 豁免清单执行一轮专项对抗抽审。
- **写入**：root 只写 `docs/audit-report.md` 和必要的 `[观察]` feedback。
- **边界**：只审不修；finder / skeptic 不修改仓库。
- **停止条件**：本轮 Summary 和 audit commit 完成即停止。不得自动开始下一轮，不得在修复后自行复审。

## Codex spawned roles

角色由 `.codex/config.toml` 声明，入口 skill 根据任务选择：

| Role | 用途 | 写权限 |
|---|---|---|
| `implementer` | 在指定 worktree 实现一个 item，并在 review 后继续返修 | 仅该 worktree 的 spec 范围 |
| `reviewer` | 审查实现 diff、验收标准和测试证据 | 只读 |
| `finder` | 按分配 lens 搜索候选 finding | 只读 |
| `skeptic` | 独立复现或反驳候选 finding | 只读 |

一个 agent 在 session 内保持稳定身份。优先向原 agent 发送澄清、review 意见和 follow-up，不因一次返回就重新生成 agent。需要止损时由 root interrupt。

## Worker 编排

### 1. 扫描、排序、验证

读取：

```powershell
rg -n "\[queued\]" docs/backlog.md
rg -n "\[open\]" docs/audit-report.md
python .agents/scripts/validate_workflow.py
```

排序：P0 > critical open > P1 > medium open > P2 > low open > P3。跳过 `waiting-feedback`。

对每个候选：

1. 验证 spec 描述的文件、API 和前提仍与 main 一致。
2. 复核 `mechanical` / `judgment` dispatch；必要时升级或降级并说明。
3. 按文件所有权和依赖分组；同时运行的 implementer 不得修改同一文件。
4. root 将选中 item 标为 `doing`。

### 2. 创建 worktree

Codex subagent 默认共享当前文件系统，不提供隐式 worktree 隔离。root 必须在 spawn 前创建：

1. 记录 `EXPECTED_BASE`。
2. **串行**创建 worktree，禁止并发创建。
3. 创建后立即核对 HEAD 等于 `EXPECTED_BASE`。
4. 使用 provider-neutral 的 `.worktrees/<task-name>` 和 `codex/<task-name>` 分支。
5. 每条 git 命令使用 `git -C <absolute-path>`；其他命令显式设置绝对 workdir，不依赖共享 cwd。

初始并发批次可从同一个 base 创建；rolling dispatch 补位时从最新 main 创建。native / ASan 任务和 ignored LLVM addon 的准备规则以 CLAUDE.md 为准。

### 3. Spawn 与实时监督

根据当前 runtime 的可用槽位派发，不硬编码四个 subagent。默认上限由 `.codex/config.toml` 控制：

- 普通 wave：最多三个 implementer；
- judgment / 高风险 wave：两个 implementer + 一个 reviewer；
- 没有 reviewer 槽位时由 root review。

每个 implementer prompt 必须包含：

- worktree 绝对路径、任务名、branch 和 `EXPECTED_BASE`；
- 完整 spec、验收标准、允许修改的文件；
- 要求先读 AGENTS.md 与 CLAUDE.md；
- 禁止修改设计文档、看板、worker_feedback 和 CLAUDE.md；
- 发现 blocker 时立即向 root 发消息，不自行决定非 trivial 方向；
- 使用当前 CLAUDE.md 中的构建、测试和 bootstrap 命令；
- 完成后提交 scoped commit，并报告 diff、测试和残留风险。

root 使用当前 session 暴露的 collaboration tools 完成 spawn、消息、follow-up、wait 和 interrupt；禁止在 skill 中伪造 provider API 或隐式 worktree 参数。

### 4. Review、返修、合并

任一 implementer 完成后立即滚动处理：

1. root 核对 base、commit 和 diff；必要时让 reviewer 独立检查。
2. 有 actionable finding 时，把意见发回**同一个 implementer**返修并重新验证。
3. 通过后由 root merge；subagent 不操作 main。
4. 按 CLAUDE.md 完成 dist-llvm rebuild、fixpoint / double-bootstrap 和相关测试。
5. root 删除完成条目、更新 CLAUDE.md 和必要 bookkeeping，并 amend 到实现 commit。
6. 清理 worktree，再从最新 main 补位。

源码语义冲突、spec 偏差或设计 blocker 不能由 root 静默拍板。若必须等待用户，保存 branch / commit / 测试 / 下一步 checkpoint，将 item 改为 `waiting-feedback` 后结束当前阻塞链；其他独立 item 可继续。

## Audit：一轮 finder + 对抗验证

### Phase 0：固定本轮边界

1. 记录 main commit 和审计范围。
2. 读取 backlog / audit-report，标记正在 `planning` / `doing` 的范围。
3. 选择 lens：
   - `rc-memory`
   - `type-soundness`
   - `backend-parity`
   - `runtime-abi`
   - `design-drift`
   - `oracle-blind`
4. 标准档按近期改动选择最相关 lens；“彻底审查”在同一轮覆盖全部六个 lens。

### Phase 1：Finder fan-out

把 lens 分给可用 finder；一个 finder 可以负责多个相邻 lens。finder：

- 审查固定的 main snapshot；
- 输出文件、行号、执行路径、影响和可复现证据；
- 不修改代码、测试或 audit-report；
- 不把猜测包装成 finding。

在 DS 可用且 `deepseek-dispatch` 可调用的机器上，保留一路独立 DS finder；不可用时注明并继续，不阻塞本轮。

### Phase 2：对抗验证

Finder 返回候选后，复用空闲 agent 作为 skeptic。每个候选至少经过：

1. **reproduce**：非原 finder 尝试复现或给出独立代码证明；
2. **refute-correctness**：另一视角主动寻找“实现其实正确”的证据；
3. **already-tracked**：root 检查 backlog、audit-report 和 doing 范围。

记录 finding 至少需要两个独立支持判断，且 refutation 已被解释。`already-tracked` 只负责去重，不计支持票。critical finding 必须由 root 亲自读码确认。

被反驳、无法复现或重复的候选不能静默消失；在 Summary 中按 killed / duplicate / in-progress 统计。

### Phase 3：落表并停止

root 去重、分级、标注 dispatch，并写入：

```markdown
### #xxx <标题> [critical|medium|low] [mechanical|judgment] [open]

<文件路径、行号、影响、证据、建议修复方向>

发现者：<finder>；验证：<skeptic / root verdict>
```

写入后运行 workflow validator，生成单轮 Summary，提交一次 audit commit，然后停止。**对抗验证属于本轮，不代表开启第二轮。修复完成后必须等待用户再次触发 Audit。**

## 两个看板与 feedback

### Backlog

活的实现队列，完成即删。活动条目格式：

```markdown
### B-xxx <标题> [feature|design-align|refactor|bugfix|infra] [P0|P1|P2|P3] [S|M|L|XL] [mechanical|judgment] [queued|planning|doing|waiting-feedback]
```

- 优先级由用户决定。
- 每项必须有涉及修改和可验证的验收标准。
- ID 永不复用。
- `doing` 可带阶段说明，如 `[doing: phase1-step9]`。

### Audit Report

活的 bug 队列，严重度只允许 `critical` / `medium` / `low`；完成即删。Worker 依赖 `[open]` 扫描。

### Worker Feedback

只保存需要跨 turn / session 的 durable 信息：

- `[决策]`：阻塞且需要用户拍板；
- `[通知]`：影响后续执行、但当前不阻塞的关键事实；
- `[观察]`：审计发现的非 bug 现象。

Codex 的常规进度、实现取舍、review 意见和可在当前 session 内闭环的问题走实时消息，不要求每个 item 强制写 `[通知]`。因额度或 session 中断保存的 WIP checkpoint 在任务完成后清理。

## 写入所有权

| Actor | 可写 | 不可写 |
|---|---|---|
| Discussion root | docs/ 设计与队列文件 | 实现代码、CLAUDE.md |
| Worker root | 两个看板、worker_feedback、CLAUDE.md、main bookkeeping | design.md |
| Implementer | 分配 worktree 内的 spec 实现与测试 | main、设计文档、看板、feedback |
| Audit root | audit-report、必要的观察 feedback | 实现代码 |
| Reviewer / Finder / Skeptic | 无仓库写入 | 全部仓库文件 |

## Provider adapter

- `docs/workflow.md` 是平台无关的治理真值。
- `.agents/skills/` 只描述 Codex 的触发与工具编排。
- `.claude/skills/` 保留 Claude Code adapter；one-shot provider 可以使用更多 durable feedback，但不得改变核心状态机和“单轮 Audit”规则。
- provider-specific 命令、模型名和工具调用不得复制回 `docs/workflow.md`。

## 一致性验证

修改 workflow、Codex skills、看板 heading 或 `.codex/config.toml` 后运行：

```powershell
python .agents/scripts/validate_workflow.py
```

该检查验证活动 heading 协议、Audit 单轮政策、Codex skill 中的过期 CC 调用，以及 role config 的 TOML 路径。
