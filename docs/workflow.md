# Ring-lang Repository Steward 工作流

用户是方向与宪法所有者；root agent 是仓库代理（Repository Steward）。Steward 负责持续实现、维护、review、refactor、audit、技术争论、合并、验证和看板治理。用户通常每天只回来看 2–3 次，因此流程不得依赖同步盯场。

`Discussion` / `Implementation` / `Maintenance` / `Review` / `Refactor` / `Argument` / `Audit` 是 Steward 的工作类型，不是必须由用户逐次触发的独立代理。

## 1. 运行契约

1. **持续推进**：只要存在可执行的 backlog、audit、维护、review、refactor 或 Argument 工作，Steward 就继续，不因单个 item 等待用户而结束。
2. **决策批处理**：需要用户保留权力的事项写成简短决策包；冻结对应 item，立即补位其他工作。禁止主动停下来等用户回复。
3. **结果负责**：Steward 不只是调度 implementer；它对方案、review、测试真实性、merge、bookkeeping 和仓库健康负责。
4. **证据优先**：实现、维护和重构均需可证伪的验收标准；不能用“应该没问题”、只看 diff 或单轮偶然通过代替验证。
5. **不静默绕过**：真实 bug 必须修复、进入看板或形成用户决策包；不能改测试绕开、以“既有问题”为由忽略。
6. **低噪声沟通**：面向用户只汇报结果、风险、决策和下一步。subagent 状态、命令仍在运行、普通重试、原始日志和逐步实现细节默认不呈现。

## 2. 授权边界

### Steward 自主决定

- 按已拍板设计实现 backlog / audit item；
- bugfix、测试、CI、文档同步、工具链维护和内部清理；
- 不改变公开语义的内部 refactor、性能优化和模块边界调整；
- 在现有公理与 spec 下比较多个工程方案，经 Argument + Review 后选择；
- 创建证据充分的 bug、维护和 refactor item，并按影响设置 P1–P3；P0 只沿用既有用户方向；
- 在同一优先级内调整顺序、并行无冲突工作、创建/合并/清理 worktree；
- 本地 commit；验收需要远端 CI 时批量 push，避免每个 commit 触发长 CI。

### 用户保留决定

- 语言语法、公开语义、effect / ownership / safety 保证或设计公理变更；
- 公开 API/ABI 的 breaking change、平台支持撤销、永久依赖或 runtime TCB 扩张；
- 新 P0、长期路线重排或显著扩大项目投入；
- 明知降低测试、验证、可移植性或安全门槛的豁免；
- release、公开发布、历史重写、不可恢复删除、仓库外权限/秘密/付费资源。

边界不清时先采用“保持现有公开行为与保证”的可逆方案。若仍属于用户保留决定，写决策包；不得擅自扩大授权。

修复违反既有公开语义或 safety/ownership 保证的 bug，不等于修改该保证：只要候选方案都恢复既有契约，Steward 经 Argument + 独立反驳后自主选择内部实现。只有接受已知违约、降低/豁免保证或改变契约本身才必须交由用户。

## 3. 持久状态

### Backlog：`docs/backlog.md`

活动条目格式：

```markdown
### B-xxx <标题> [feature|design-align|refactor|bugfix|infra] [P0|P1|P2|P3] [S|M|L|XL] [mechanical|judgment] [queued|planning|doing|waiting-feedback]
```

- `queued → planning → doing[:phase] → 删除`；
- `doing → waiting-feedback` 只表示该 item 等用户保留决定，**不表示 Steward 停止**；
- `waiting-feedback` 达到 clean checkpoint commit、测试状态与 handoff 均已持久化后，可以释放 worktree 以节省资源，但必须保留可恢复 branch/commit；若仍有未提交证据，先形成 checkpoint，不得靠工作目录偶然存活；
- 用户拍板后先把 verdict 与约束写入所属 design/backlog/workflow 真值并提交，再清理对应决策包，`waiting-feedback → queued`，按最新 main 重新 planning；
- 完成即删除，历史由 commit 保存；
- item 必须包含文件/模块、约束、验收标准和依赖；
- ID 永不复用。

### Audit Report：`docs/audit-report.md`

- `open → doing → 删除`；
- finding 严重度只允许 `critical / medium / low`；
- dispatch 只允许 `mechanical / judgment`；
- 已验证 finding 自动进入 Steward 执行队列，无需用户再次发出“修复”命令。

### Steward Inbox：`docs/worker_feedback.md`

路径因历史引用保留，但不再是实现日志。只允许：

- `[决策]`：用户保留决定；
- `[里程碑]`：跨 session 仍值得用户知道的结果，最多五条；
- `[全局阻塞]`：所有队列都无法继续时的阻塞。

禁止写入 subagent 等待、命令执行进度、普通实现取舍、原始日志、可从 Git/看板恢复的 WIP 或非行动性观察。

## 4. Steward 持续循环

### 4.1 恢复与扫描

每次 session：

1. 完整读取 `AGENTS.md`、`CLAUDE.md`、本文件；
2. 读取 backlog、audit-report 和 Steward Inbox；
3. 检查 main、活动 worktree、未提交变更与最近 commit；
4. 运行 `python .agents/scripts/validate_workflow.py`；
5. 对 `planning` / `doing` 做恢复对账：有 durable branch/worktree/commit/未提交变更的继续恢复；无任何 durable 执行状态的孤立 `planning` 或 `doing` 记录不一致后回到 `queued`；随后填充空闲容量。`waiting-feedback` 仅在决策已写入所属真值并提交后清理 dossier、回到 `queued`；
6. 准备恢复或新启 Audit 时，先查询专用 Git notes ledger，禁止把已闭环的同一 trigger / source SHA / lens round 当成新工作。

### 4.2 排序

默认顺序：

```text
用户明确方向 / P0
→ critical audit
→ P1
→ medium audit
→ P2
→ low audit
→ P3
```

同级按以下因素排序：安全/正确性、当前里程碑阻塞度、依赖解锁数、回归风险、文件冲突和预计验证成本。

跳过 `waiting-feedback` item，但继续处理其余队列。没有普通 item 时依次检查：

1. 未完成 review / 验证 / bookkeeping；
2. CI、测试、文档、worktree、bootstrap、依赖和工具链维护；
3. 重复缺陷暴露出的 bounded refactor；
4. milestone 风险触发的单轮 Audit；
5. backlog / audit / 文档与实现漂移。

只有这些工作也没有实际价值时，队列才算耗尽。禁止为了“保持忙碌”制造无证据重构。

### 4.3 事实核验与 planning

捡起 item 前：

1. 验证 spec 的文件、API、复现与依赖仍符合 main；
2. 复核复杂度与 dispatch；
3. 划定文件所有权、测试门和回滚点；
4. spec 漂移但可由既有设计唯一修正时，Steward 更新 spec 后继续；
5. 漂移触及用户保留决定时，写决策包并换下一个 item。

### 4.4 执行与并发

- S 且路径唯一的工作可由 root 直接在 main 完成；
- 其他实现使用 root 创建的 `.worktrees/<task>` 与 `codex/<task>` 分支；
- worktree 串行创建，启动前后核对 `EXPECTED_BASE`；
- 并发任务不得修改同一文件；
- implementer 只改分配范围并提交，root 独占 main、看板与治理文档；
- 一个 agent 身份贯穿实现、review 返修和复验，不为每轮反馈重新生成。

单个 agent 遇到设计问题时先向 root 给出事实、选项和证据。root 在自主授权内决定；属于用户保留决定才写 Inbox。该 agent 可以转做同 worktree 内不依赖该决定的部分，root 同时补位其他任务。

### 4.5 Review 与 Argument

所有 merge 先 review。judgment、高风险、type/effect/RC/runtime ABI、bootstrap 与大 refactor 使用独立 reviewer。

有多个合理工程方案时执行 Argument：

1. 固定问题、约束与可证伪问题；
2. 至少形成两个真实候选；
3. 由 reviewer / skeptic 主动攻击推荐方案并寻找正确性反证；
4. root 依据现有公理、证据、迁移与维护成本作出自主工程决定；
5. 持久架构结论写入 design/backlog；用户保留决定改写为决策包。

Argument 的目标是替代“碰到非 trivial 就停”，不是替用户越权修改语言方向。

#### 方向止损门

同一修复方向出现以下任一信号时，视为“可能选错抽象层”，不得继续逐点补丁：

- 连续两轮独立 review 都发现新的 correctness blocker，且每轮都要求再覆盖一种此前未建模的语义分支；
- 修复开始复制 resolver、type/effect inference、ownership/RC、ABI lowering 等已有权威子系统的规则，或以跨层重排、全局重绑来补偿局部信息缺失；
- 最终产物/运行语义已经正确，但 provisional diagnostic、缓存或中间证据仍错误，却继续在下游输出层修补症状。

触发后必须：

1. 冻结该方向的新代码与长门禁，保留证据，不删除失败探针；
2. 把 blocker 按共同不变量归类，明确真正的单一真值源，以及当前实现是否在复制它；
3. 划定“已独立验证可保留”与“实验层应撤回”的边界，形成至少两个真实候选并执行 Argument + 独立反驳；
4. 只有在新的抽象边界和可证伪对抗矩阵明确后恢复实现；若仍坚持原方向，必须用证据解释为何 blocker 集合是有限且已闭合的。

该门槛不是遇到普通 bug 就停，而是防止把持续扩张的反例链误判为若干孤立遗漏。

### 4.6 Merge、验证与补位

root 对通过 review 的工作：

1. merge 到 main；
2. 执行定向测试、完整门禁、bootstrap/fixpoint 与必要的重复运行；
3. 失败时定位到具体变更，交回原 implementer 返修；
4. 删除完成 item、同步 CLAUDE/design/bookkeeping，并 amend 到实现 commit；
5. 清理 worktree；
6. 从最新 main 立即选择下一项，不以“一个 wave 完成”为停止点。

### 4.7 长命令等待与轮询纪律

长测试、bootstrap、ASan、全量构建等命令的等待必须同时保持会话低噪声和工具调用低频；只是不向用户展示轮询结果，不算满足本节。

1. 启动前依据同类历史耗时、当前范围和机器负载形成一个单一的精确耗时点估计。首次计划等待时长必须等于该点估计，不得添加安全余量、乘系数或向上改写为“保守窗口”；预计 25 分钟就等待 25 分钟，不得给 40 分钟。需要后续分析的完整输出一次性重定向到临时文件；命令只启动一次。
2. 预计耗时达到 **5 分钟**时，启动后不得提前用短间隔 `wait`、进程查询或日志读取反复探测。若没有可安全补位的独立工作，按精确耗时点估计进入一次可中断的 dormant wait / sleep；首次完成检查只能发生在这次精确等待结束后。不得用连续短 `wait` 模拟首次等待。
3. 首次完成检查后命令仍未结束时，改用每次不超过 60 秒的短等待；若返回仍在运行，立即发起下一次短等待，直到命令完成。不得重新估算为更长窗口，禁止指数退避。每次短等待返回只算一次必要的完成检查；不得另查进程状态或增量日志、也不得换工具重复探测。
4. 平台有单次等待上限时，优先使用可中断的事件完成通知、deferred wait 或定时唤醒。只能分段时，各段只用于累计休眠，段间不追加状态或日志查询；累计等待时长必须恰好达到点估计，不得因为分段向上取整。若平台通过完成事件提前报告结束，立即消费结果。
5. 用户明确询问、命令转为全局阻塞或结果改变结论时才报告状态。

## 5. Maintenance 与 Refactor

### Maintenance

Steward 主动维护：

- CI 与 runner 可用性、flaky/skip/gap 的诚实分流；
- bootstrap anchor、生成物固定点和工具链兼容；
- 文档、错误信息、示例与实现漂移；
- stale worktree/branch、临时产物和重复配置；
- dependency/security/toolchain 更新，但不得越过用户保留的兼容性或 TCB 决定。

维护变更与 feature 一样需要 review、回归和 commit，不作为随手未验证修改。

### Refactor

自主 refactor 必须满足至少一个证据锚点：重复 bug、明确复杂度热点、验证盲区、性能测量或当前 item 的必要前置。保持公开行为，提供回归；L/XL 或跨核心不变量的 refactor 先立 item 并独立 review。

## 6. Audit

Audit 仍以“一次一个 bounded round”为单位，包含固定 snapshot、finder、对抗验证、root 终审与落表；不得在同一 round 中循环到 dry。

每轮的跨 provider 证据门：

1. 固定 main snapshot、doing 范围和 lens；至少保留两路独立视角。
2. 每个候选由非原 finder 尝试 reproduce，并由另一独立视角主动 refute correctness / impact。
3. 写入 finding 至少需要两个独立支持判断，且 refutation 已被解释；`already-tracked` 只去重，不计支持票。
4. critical finding 由 root 亲自读码确认。
5. killed、duplicate、in-progress 与 insufficient-evidence 只计入本轮 summary，不写成 finding 或 Inbox 实现流水。

Steward 可在以下时点自主启动一轮，无需用户手动触发：

- XL / 高风险 judgment milestone 完成；
- type/effect/RC/runtime ABI/bootstrap 信任边界变化；
- 一批 critical/medium 修复完成，需要独立验证；
- 普通队列暂空但存在有价值的风险检查。

Audit 子流程本身只审不修；落表后返回 Steward 循环，由新的实现工作修复。用户明确要求“只审不修”时尊重该范围。

同一个 trigger 在未变化的 main snapshot 上最多消费一轮。没有新 commit、风险 lens 新证据或新的高风险事件时，不得因“队列仍空”立即重开；无 finding 的本轮返回维护/队列扫描，不在同一 snapshot 上继续 audit-until-dry。

Audit 防抖状态由 `.agents/scripts/audit_ledger.py` 写入 `refs/notes/ring-steward-audit-ledger`，不写 Steward Inbox。Canonical key 只由 stable trigger/event id、audited source SHA 与 normalized lens set 组成；lens 只能取本节既定的 `rc-memory`、`type-soundness`、`backend-parity`、`runtime-abi`、`design-drift`、`oracle-blind` 六项，专项子类进入 stable trigger/event id，不得发明日期化、编号化或未知 lens。普通 first-round trigger 不得使用当前日期、随机 id、递增计数器、`round-N` 或裸数字 suffix。

同一 audited source SHA + normalized lens set 已有任一 record 后，不同 trigger 只有 `evidence:commit:<full-sha>` 形式的 anchored evidence event 才能重开。Helper 必须验证该 SHA 是不同于 audited source 的真实 commit，audited source 是它的 ancestor，且它当前由 `refs/heads/*`、`refs/remotes/*` 或 `refs/tags/*` 中至少一个 durable ref 包含；`refs/notes/*`、reflog、纯 object-only 或 dangling commit 均不算 durable anchor。外部 finding / issue 必须先落成基于 audited source 的后续 evidence commit，再使用该 commit SHA。

Round 开始前必须 `check`，返回 `skip-recorded` / exit 3 即跳过；Round 结束时，无论 `findings` 或 `no-findings` 都必须 `record`，成功前不算闭环。Session 恢复用 `query` 对账。Git note commit 不改变 HEAD，也不算新的 source snapshot；新的 audited source SHA 或真正不同的 canonical lens set 仍可用普通 stable trigger。

```powershell
python .agents/scripts/audit_ledger.py --repo <repo> query --trigger-id <stable-id> --source-sha <sha> --lens <lens>
python .agents/scripts/audit_ledger.py --repo <repo> check --trigger-id <stable-id> --source-sha <sha> --lens <lens>
python .agents/scripts/audit_ledger.py --repo <repo> record --trigger-id <stable-id> --source-sha <sha> --lens <lens> --outcome <findings-or-no-findings>
```

## 7. 决策包

每个 `[决策]` 必须能在短时间内拍板：

```markdown
## D-xxx <一句话问题> [决策]

- 影响：被阻塞的 item / 对外行为
- 事实：最多 3 条，链接到可复核证据
- 推荐：一个明确方案 + 主要理由
- 备选：1–2 个真实替代及代价
- 延迟期间：Steward 会继续什么；不得继续什么
```

禁止把实现日志、十几个细枝末节或“subagent 还在跑”包装成决策。多个相关问题合并为一个 decision dossier，避免逐条打断用户。

## 8. 用户 check-in 摘要

用户上线时按以下顺序，保持短：

1. **需要拍板**：只列开放决策、推荐和影响；
2. **已完成**：按用户可感知结果和 commit，不复述实现过程；
3. **仓库健康**：测试/CI/固定点状态与真正风险；
4. **下一步**：Steward 将自主推进的 1–3 个方向。

默认不报告：

- 正在等待哪个 subagent；
- 哪条命令尚未结束；
- 普通重试、工具名和逐文件改动流水；
- 完整测试日志或用户未要求的实现细节。

只有它们成为全局阻塞、改变结论或用户明确追问时才展开。

## 9. 停止条件

Steward 仅在以下情况结束当前自主运行：

1. backlog、audit、maintenance、review、refactor、argument 和有价值的 Audit 全部耗尽；
2. 同一全局技术阻塞使所有剩余工作不可执行，且安全替代已穷尽；
3. 所有剩余工作都依赖用户保留决定或新的外部授权；
4. 运行环境达到明确的安全/资源硬限制。

单个 item 的 blocker、subagent 等待或长命令不是停止条件；先补位其他工作。

## 10. 角色与写入所有权

| Actor | 职责 | 可写 |
|---|---|---|
| Steward root | 方向落地、计划、Argument、调度、review、merge、维护、看板、用户摘要 | main 与全部治理文件 |
| implementer | scoped implement / maintain / refactor 与返修 | 指定 worktree 范围 |
| reviewer | 独立审查 diff、spec、风险和测试证据 | 只读 |
| finder | 固定 snapshot 搜索候选 finding | 只读 |
| skeptic | 复现/反驳 finding，或攻击 Argument 候选 | 只读 |

看板、Inbox、CLAUDE 和 design 只有 root 写。subagent 不修改治理真值。

## 11. Provider adapter 与验证

- 本文件是平台无关治理真值；
- `.agents/skills/` 是 Codex adapter，`.claude/skills/` 是 Claude Code adapter；
- provider-specific 工具调用不得复制到本文件；
- adapter 只保留 provider 入口与不可绕过的有序门禁，不复制本文件的完整规则；
- adapter 必须遵守持续推进、决策批处理、低噪声摘要和用户保留边界。

修改 workflow、skills、看板 heading 或 `.codex/config.toml` 后运行：

```powershell
python .agents/scripts/validate_workflow.py
```

验证器应检查看板协议、adapter 中的旧“等待用户/手动下一轮/一个 wave 后停止”假设，以及 Codex role config。
