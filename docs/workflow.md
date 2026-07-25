# Ring-lang 开发工作流

三种用户入口工作流共享两个持久看板。Discussion / Worker / Audit 是 root agent 的工作模式，不是常驻 subagent；Codex 的 implementer / reviewer / finder / skeptic 才是按任务生成的执行角色。

## 核心原则

1. **用户掌握设计主权**：非 trivial 且存在多种正确方向的问题必须交给用户拍板。
2. **Spec 是执行契约**：实现严格遵循 backlog / audit item；spec 与仓库现状不符时停止，不猜测。
3. **持久状态与即时通信分离**：看板记录跨 session 真值；Codex agent 之间的进度、澄清和 review 意见走实时消息。
4. **单写者维护看板**：root agent 更新 backlog、audit-report、worker_feedback 和 CLAUDE.md；subagent 不修改这些文件。
5. **Audit 每次只执行一轮**：一轮包含 finder fan-out、对抗验证、终审和落表。完成后停止；修复后是否再审由用户手动发起。
6. **不静默绕过问题**：真实 bug 必须修复或记录；不能改测试绕开、以“既有问题”为由忽略。
7. **上下文显式分区**：连续注意力任务必须装进一个可在单次未压缩上下文内完成的 context lease；自动压缩不是正常 phase boundary。
8. **当前状态与历史分离**：agent 交接只传当前契约、当前事实和未完成工作；过程日志落盘，不能把追加式聊天历史当作恢复协议。

## 上下文预算与连续注意力

本节定义所有 provider 共用的上下文治理。Codex adapter 的具体参数和 spawn 参数属于 `.agents/` / `.codex/`，不得反向污染这里的状态机。

### Context lease

`context lease` 是一个 agent 在一次未发生自动压缩的上下文 epoch 内，对一个连续注意力单元承担的责任。一个 lease 必须能闭环：

```text
读取 task packet → 定向调查 → 实现或验证 → 定向测试 → commit / verdict → current-state handoff
```

- work package 按共享 invariant、执行路径和验收门切分，不按“平均文件数”机械切分。
- 一个 lease 只允许一个明确交付物；不得把“清空队列”“持续审到没有问题”等开放式目标交给 subagent。
- 自动压缩只能用于事故恢复。若 agent 即将跨过压缩边界仍未闭环，必须先停在可提交或可复现的安全点，写 current-state handoff，再由 fresh-context agent 接手。
- 发生压缩后的 agent 不继续承担需要依赖压缩前细节的实现、语义 review 或 finding 复现；root 将其视为 lease 已终止。

试运行采用保守预算：

- 规划 work package 时，以约 `120K` token 的总上下文占用作为 soft budget；读集大、生成物多或不确定性高时继续下调。
- 当 runtime 报出首次 context warning，或估算占用接近 `180K` 时，不再扩大调查面；只允许收敛、验证和交接。
- rollout / reasoning budget 不等于可安全使用的上下文容量。若 provider 不暴露精确用量，使用“读集是否仍在扩大、是否进入第二个独立问题、是否需要第二轮大返修”作为强制 handoff 信号。
- 这些数值是试运行护栏，不是模型容量声明；只能经 Discussion 根据实测向上调整。

### Task packet

root 或 planner 必须为每个 lease 生成 self-contained task packet。packet 至少包含：

- 固定 base commit、branch / worktree、任务 ID 和交付物；
- 已拍板决定、允许读取的入口和允许修改的文件范围；
- 必须保持的 invariant、明确排除项和停止条件；
- 验收标准、定向测试命令，以及哪些门由 root 在 merge 后执行；
- 已知风险与最多一屏的必要 provenance；不得附带整段父对话或整份看板。

subagent 缺少关键事实时向 root 请求 packet amendment；root 回复增量事实，不倾倒父 session 历史。

### Current-state handoff

未在一个 lease 内完成时，只写一份可替换的 current-state handoff：

```text
base / head / worktree
contract version 或 packet hash
当前结论与已拍板决定
已完成
唯一下一步
已运行测试及结果
未验证项与已知反例
```

同一活跃 item 只保留一个 current checkpoint，新 checkpoint 替换旧 checkpoint。详细命令输出、trace 和中间推理写入 worktree artifact 或 commit，不追加到 `worker_feedback.md`。任务完成后立即删除 checkpoint；历史由 git 和测试日志追溯。

## 用户入口

### Discussion（前台设计）

- **触发**：用户要求讨论设计、架构、想法或 backlog。
- **读取**：CLAUDE.md、相关设计文档、看板 heading / compact index、目标 item 和未解决 feedback；除非需要全局去重，不默认展开整份看板正文。
- **写入**：docs/ 下的设计文档、backlog、workflow 和已处理的 feedback。
- **流程**：确认事实 → 给出方案与 trade-off → 用户拍板 → 更新设计真值 → 写入带验收标准的 backlog item。
- **边界**：不实现编译器代码；不修改正在 `planning` / `doing` 的 spec，除非 Worker 明确请求。
- **旧信息立项**：基于旧 review、旧限制或 TS 时代记录立项前，先做分钟级双后端 probe 验证前提。

### Worker（实现编排）

- **触发**：用户要求执行、下一个 wave、修 audit 或实现 backlog。
- **root 职责**：选项、状态、worktree、调度、review、merge、测试门、bookkeeping 和最终汇报。
- **subagent 职责**：只在分配的 worktree 内实现和提交指定 item。
- **快速通道**：S 复杂度 item 可以由 root 直接在 main 实现；这是“orchestrator 不实现”的唯一例外，且只能在不与运行中 worktree 冲突时使用。
- **调用边界**：一次 Worker 调用只完成一个有界 integration batch；完成本批 merge、测试门和 bookkeeping 后停止，不滚动执行到队列耗尽。

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
| `planner` | 把 L / XL item 按 invariant 和验收门切成 context-bounded work packages | 只读；只输出 task packets |
| `implementer` | 在指定 worktree 的一个 context lease 内完成一个 work package | 仅该 worktree 的 packet 范围 |
| `reviewer` | 审查实现 diff、验收标准和测试证据 | 只读 |
| `finder` | 按分配 lens 搜索候选 finding | 只读 |
| `skeptic` | 独立复现或反驳候选 finding | 只读 |

所有角色默认从 fresh context 启动，只接收 task packet，不继承 root 的完整 transcript。`planner` 是逻辑必需角色；专用 provider role 尚未安装时，由 fresh-context 只读 agent 执行同一契约。

agent 身份只在一个 context lease 内稳定：实现完成后最多接受一轮窄范围返修。第二轮实质性返修、scope 扩张、需要重新理解核心 invariant，或发生自动压缩时，root 终止该 lease，更新 task packet，并生成 fresh-context agent。需要立即止损时由 root interrupt。

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
3. L / XL item 禁止直接 dispatch：先由 planner 产出 work-package DAG、每包 task packet 和 merge / validation 顺序。S / M 仅在 scope 与 invariant 已完整时可直接打包。
4. 按文件所有权和依赖分组；同时运行的 implementer 不得修改同一文件。
5. root 为本次调用选择一个有界 integration batch，并将选中 item 标为 `doing`。

默认一个 batch 是一个高风险 work package，或最多三个彼此独立的小 package。batch 大小还必须受可用 context lease 和 merge 后测试成本约束；并发槽位空闲不是扩大 batch 的理由。

### 2. 创建 worktree

Codex subagent 默认共享当前文件系统，不提供隐式 worktree 隔离。root 必须在 spawn 前创建：

1. 记录 `EXPECTED_BASE`。
2. **串行**创建 worktree，禁止并发创建。
3. 创建后立即核对 HEAD 等于 `EXPECTED_BASE`。
4. 使用 provider-neutral 的 `.worktrees/<task-name>` 和 `codex/<task-name>` 分支。
5. 每条 git 命令使用 `git -C <absolute-path>`；其他命令显式设置绝对 workdir，不依赖共享 cwd。

初始并发批次可从同一个 base 创建；同一有界 batch 内确需补位时从最新 main 创建，不得借补位扩成下一批。native / ASan 任务和 ignored LLVM addon 的准备规则以 CLAUDE.md 为准。

### 3. Spawn 与实时监督

根据当前 runtime 的可用槽位派发，不硬编码四个 subagent。默认上限由 `.codex/config.toml` 控制：

- 普通 wave：最多三个 implementer；
- judgment / 高风险 wave：两个 implementer + 一个 reviewer；
- 没有 reviewer 槽位时由 root review。

每个 implementer prompt 必须包含：

- worktree 绝对路径、任务名、branch 和 `EXPECTED_BASE`；
- self-contained task packet：交付物、必要 spec、invariant、验收标准、读写边界和停止条件；
- 要求先读 AGENTS.md 与 CLAUDE.md；
- 禁止修改设计文档、看板、worker_feedback 和 CLAUDE.md；
- 发现 blocker 时立即向 root 发消息，不自行决定非 trivial 方向；
- 使用当前 CLAUDE.md 中的构建、测试和 bootstrap 命令；
- 完成后提交 scoped commit，并以不超过约 `2K` token 的报告说明 diff、测试、残留风险和 handoff；长日志写入 worktree artifact。

root 使用当前 session 暴露的 collaboration tools 完成 spawn、消息、follow-up、wait 和 interrupt；每次 spawn 必须显式请求 fresh context，禁止依赖 provider 的 full-history 默认值，也禁止在 skill 中伪造 provider API 或隐式 worktree 参数。

### 4. Review、返修、合并

任一 implementer 完成后立即处理：

1. root 核对 base、commit 和 diff；必要时让 reviewer 独立检查。
2. 有 actionable finding 时，若仍在原 packet 范围且属于一轮窄修，发回同一个 implementer；否则结束 lease，以更新后的 packet 交给 fresh-context implementer。
3. 通过后由 root merge；subagent 不操作 main。
4. 按 CLAUDE.md 完成 dist-llvm rebuild、fixpoint / double-bootstrap 和相关测试。
5. root 删除完成条目、更新 CLAUDE.md 和必要 bookkeeping，并 amend 到实现 commit。
6. 清理 worktree；本 batch 全部完成后停止并向用户汇报，不自动开始下一批。

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

把 `一个 lens × 一个有界模块或文件分区` 作为 finder lease；不要让单个 finder 因槽位充足就承担多个独立 lens。finder：

- 审查固定的 main snapshot；
- 输出文件、行号、执行路径、影响和可复现证据；
- 把候选压缩为独立 candidate dossier，包含必要代码片段入口、probe 和反证线索；
- 不修改代码、测试或 audit-report；
- 不把猜测包装成 finding。

在 DS 可用且 `deepseek-dispatch` 可调用的机器上，保留一路独立 DS finder；不可用时注明并继续，不阻塞本轮。

### Phase 2：对抗验证

Finder 返回候选后，为每个候选或紧密相关的候选簇生成 fresh-context skeptic；禁止把原 finder 改扮为 skeptic，也禁止向 skeptic 注入整轮审计历史。每个候选至少经过：

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

feedback 不是 append-only 日志：

- 每个活跃 item 最多保留一个 current-state checkpoint；恢复时以新 checkpoint 替换旧版本。
- 已解决的 `[决策]` 融入设计真值或 item spec 后删除；已完成任务的 `[通知]` / checkpoint 立即删除。
- 完整 provenance 留在 branch、commit、测试日志和必要的 worktree artifact 中，不通过累积 feedback 消耗所有后续 agent 的上下文。

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
- provider adapter 必须把“fresh context spawn、task packet、lease 终止、单批次停止”映射到自身真实工具参数；若能力缺失，必须 fail closed 或由 root 明确执行等价步骤。

### Codex 迁移门

B-166 完成前，Codex root 必须在每次实际 spawn 时手工执行本节的 fresh-context、task-packet 和 bounded-batch 规则；不得再启动依赖旧的 full-history fork 或长寿命 agent 的新 wave。当前已在 `doing` 的工作先停在其既有安全边界，随后 B-166 作为下一项工作流基础设施 gate 落地 adapter、role 和 validator。

## 一致性验证

修改 workflow、Codex skills、看板 heading 或 `.codex/config.toml` 后运行：

```powershell
python .agents/scripts/validate_workflow.py
```

当前检查验证活动 heading 协议、Audit 单轮政策、Codex skill 中的过期 CC 调用，以及 role config 的 TOML 路径。B-166 必须把 context-lease、fresh spawn、planner gate 和 stale feedback 约束加入可执行校验；在此之前由 root 按迁移门人工复核。
