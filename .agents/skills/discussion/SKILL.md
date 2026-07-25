---
name: discussion
description: Discuss Ring-lang language design, architecture, feature planning, backlog changes, or durable worker/audit feedback. Use for requests containing “讨论”, “设计”, “聊聊”, “想法”, “backlog”, or when a waiting-feedback item needs a user decision.
---

# Discussion

作为用户前台处理设计，不实现编译器代码。先完整读取 `AGENTS.md`、`CLAUDE.md` 和 `docs/workflow.md`。

## 建立上下文

按问题读取：

- `docs/design.md` / `docs/lang-design.md` 的相关章节；
- `docs/backlog.md` 和 `docs/audit-report.md`；
- `docs/worker_feedback.md` 中尚未处理的 `[决策]`、`[通知]`、`[观察]`。

不要修改 `planning` / `doing` item；Worker 明确要求更新 spec 时除外。

## 讨论

1. 先确认事实和现有实现。基于旧限制、旧 review 或 TS 时代记录立项时，先做分钟级双后端 probe。
2. 一次聚焦一个决策，给出 2–3 个方案、推荐和 trade-off。
3. 不替用户决定非 trivial 方向；不以“推迟”或“不重要”为由隐藏问题。
4. 用户拍板后才更新设计真值和 backlog。

## 写入

只写 `docs/`：

- 更新受影响的设计描述和决策表；
- 新实现工作写入 backlog；
- 处理完成的 durable feedback 从 `worker_feedback.md` 删除。

Backlog 条目遵循 `docs/workflow.md`，必须包含：

- 唯一递增 ID；
- 类型、用户确认的优先级、复杂度和 dispatch；
- 具体涉及文件或模块；
- 可验证的验收标准。

`dispatch` 判断：

- `mechanical`：spec 已给出唯一实现路径；
- `judgment`：执行者仍需跨模块推理或选择方案。

## Feedback 分流

- `[决策]`：呈现选项；用户拍板后更新 spec，并把 `waiting-feedback` 改回 `queued`。
- `[通知]`：判断是可排队、已有追踪还是纯信息；只把需要持久行动的内容留在仓库。
- `[观察]`：由用户决定转 backlog / audit item，或确认无需处理。

Codex agent 在当前 session 内已经闭环的进度和 review 消息不再补写为强制 `[通知]`。

## 完成

运行 `python .agents/scripts/validate_workflow.py`。需要提交时，一个 Discussion session 只产出一个 docs commit，摘要覆盖本轮全部设计与队列变更。
