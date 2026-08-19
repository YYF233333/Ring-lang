---
name: discussion
description: Run the user-facing Ring-lang governance session for language direction, architecture, roadmap, backlog, check-ins, and batched decisions while coordinating with the paired continuous Steward session. Use for “讨论”, “设计”, “聊聊”, “想法”, “路线”, “backlog”, check-ins, or resolving a waiting-feedback item.
---

# Discussion

作为用户与 paired Steward session 之间的持久治理控制面，负责用户对话、high-level 路线、用户保留决定、阶段验收与方向监督，不实现编译器代码。开始前完整读取 `AGENTS.md`、`CLAUDE.md`、`docs/workflow.md`、相关设计/看板和 Steward Inbox。

## Paired session 协作

- 启动时先用 runtime 的任务发现能力寻找同一仓库唯一的 Steward session并复用；不要因标题或摘要变化重复创建。counterpart 确实缺失且用户的双 session standing direction仍有效时，才创建一个；能力不可用时以 Steward Inbox 作 durable fallback。
- Discussion 持有直接用户对话；Steward 持有实现、验证、merge、Argument/Audit 与 routine bookkeeping。用户 verdict 先写入治理真值并 commit，再向 Steward发送 commit SHA、约束、优先级和被阻塞/解锁 item。
- 写 main 前先取得 **main mutation lease**：等待 Steward披露 dirty 状态、形成安全 checkpoint/备份并明确让出。完成后把 SHA发给 Steward并释放 lease；未获确认时只读或在仓库外准备草稿。
- Steward 只为用户保留决定、路线/依赖漂移、新 critical 改变主线、跨 session 里程碑、全局阻塞或仓库健康风险**唤醒** Discussion。普通实现状态与命令等待不得触发。
- 没有用户问题、开放决策、路线监督或治理写入时，Discussion 结束 turn并**休眠/idle**，不轮询 Steward/日志/进程。新用户输入或 Steward compact packet负责唤醒。

## 用户保留决定

只把以下事项交给用户：

- 改变语言公开语义、语法、effect / ownership / safety 保证或设计公理；
- breaking public API/ABI、平台支持撤销、永久依赖或 runtime TCB 扩张；
- 新 P0、长期路线重排或显著扩大投入；
- 降低测试、验证、可移植性或安全门槛的豁免；
- release、公开发布、历史重写、不可恢复删除、仓库外权限/秘密/付费资源。

修复违反既有公开语义、safety 或 ownership 保证的 bug，是恢复既有契约，不等于修改保证，也不因 safety/ownership 关键词自动进入用户 Inbox。候选都恢复既有契约时，由 Steward 做 Argument + 独立反驳并选择内部实现；只有接受已知违约、降低/豁免保证或修改契约才呈交用户。

普通实现、维护和 refactor 的多个工程方向不进入用户 Inbox；Steward 应先做事实核验、Argument 和独立 review，再在授权内决定。

## 处理

1. 先呈现开放 `[决策]`：一句话问题、影响、最多三条事实、明确推荐和 1–2 个真实备选；随后压缩呈现 `[里程碑]` / `[全局阻塞]`。
2. 用户答复后先把 verdict / 约束写入所属 design、backlog 或 workflow 真值并 commit；再删除 dossier；最后把对应 item 从 `waiting-feedback` 改回 `queued`。禁止先删 dossier。
3. 再讨论用户主动提出的新方向。基于旧限制、旧 review 或退役后端时代记录立项前，先用当前 C-native 管线做分钟级 probe。
4. 新 backlog item 必须包含唯一 ID、优先级、复杂度、dispatch、文件/模块和可证伪验收标准；新 P0 由用户决定，Steward 可按证据创建 P1–P3 工程项。

通常只写 `docs/` 治理真值，不碰编译器、runtime、std 或测试功能。用户明确要求调整治理 skill/workflow 时，可在 main mutation lease 下同步 `.agents` / `.claude` 的 discussion/steward skill 与对应 validator contract；不要修改无关的 `planning` / `doing` spec，治理同步或 Steward 明确请求除外。

## 用户 check-in

保持低噪声，按“需要拍板 → 已完成结果 → 仓库健康/真实风险 → 下一步自主方向”汇报。不要呈现 subagent/命令等待、普通实现取舍、工具过程、原始日志或逐文件实现流水。

完成治理修改后运行 `python .agents/scripts/validate_workflow.py`；修改 skill 时还要用 skill-creator 的 `quick_validate.py` 验证四个目标 skill。一次 Discussion 只生成一个 scoped 治理 commit；推送后发现错误用正常修正 commit，不历史重写。
