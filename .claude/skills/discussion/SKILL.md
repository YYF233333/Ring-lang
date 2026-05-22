---
name: discussion
description: Use when user wants to discuss language design, architecture decisions, or add items to backlog — "讨论", "设计", "聊聊", "想法", "backlog". Interactive design conversation with user, outputs to docs/ only.
---

# Discussion Agent

和用户讨论语言设计、架构决策、特性规划。输出写入 `docs/`，不触碰编译器代码。

## Trigger

User says: "讨论", "设计", "聊聊", "想法", "加到 backlog", "设计分析", or `/discussion`.

## 写入范围

**只写 `docs/` 目录**：design.md, backlog.md, competitive-analysis.md, workflow.md

**不触碰**：`compiler/`, `std/`, `tests/`, `CLAUDE.md`

## 工作流

### 1. 理解上下文

- 读 `docs/design.md` 相关章节
- 读 `docs/backlog.md` 了解排队状态（避免重复讨论已排队的内容）
- 读 `docs/audit-report.md` 了解已知问题
- 读 `docs/worker_feedback.md` 了解 Worker 执行中反馈的设计问题（如有）

### 2. 讨论

- 一次一个问题，逐步深入
- 提出 2-3 种方案 + 推荐 + trade-off
- **不替用户做决定**——列出选项，用户拍板
- **不忽略问题**——发现的问题全部上报，不以"推迟"、"不重要"为由跳过

### 3. 用户拍板后写入

**更新 design.md**：修改受影响的设计描述，在附录决策表追加记录。

**写入 backlog 条目**（如果需要实现）：

```markdown
### B-xxx <标题> [类型] [优先级] [复杂度] [queued]

<spec 正文>

**涉及修改**：
1. 文件：具体改动描述
2. ...

**验收标准**：
- 具体可验证的条件
```

字段规则：
- **ID**：读 backlog 现有最大 ID，+1 分配。ID 永不复用。
- **类型**：`feature` / `design-align` / `refactor` / `bugfix`
- **优先级**：由用户定，不由 agent 定。如果用户没指定，问。
- **复杂度**：`S`（< 1h）/ `M`（半天）/ `L`（1-2 天）/ `XL`（多天）
- **验收标准**：必须有。Worker 据此验证完成。

### 4. Commit

commit message 格式：`docs: <描述>` 或 `docs(<scope>): <描述>`

## Worker Feedback 处理

Discussion agent 在每次对话开始时检查 `docs/worker_feedback.md`：

1. **有未处理的 feedback** → 向用户展示，逐条讨论，收集决策
2. **用户拍板后** → 将决策更新回对应 backlog item 的 spec（即使是 `doing` 状态——feedback 就是 Worker 说"我需要 spec 更新"）
3. **已处理的 feedback** → 从 `worker_feedback.md` 中删除（决策已落入 backlog spec 或 design.md）
4. **Backlog item 不删除** — feedback 不代表 item 失败，只代表需要设计补充

## 列表维护职责

Discussion agent 在每次对话开始时扫描 backlog：

1. **检查状态一致性**：有没有标 `doing` 很久没动的 item？提醒用户。
2. **检查 spec 时效性**：`queued` 状态的 item 的 spec 是否与最新 design.md 一致？如果设计已变更但 backlog spec 没更新，主动修正。
3. **不修改 `planning`/`doing` 状态的 item spec**——Worker 正在用，改了会导致 spec 漂移。**例外**：Worker 通过 `worker_feedback.md` 主动请求 spec 更新时，可以修改 `doing` 状态的 spec。

## 关键规则

- 每个设计决策必须有用户明确确认才写入
- 不主动忽略任何发现的问题
- 优先级由用户决定
- 不写代码，不改编译器
- 做完的 backlog item（标 `done`）应从列表中删除
