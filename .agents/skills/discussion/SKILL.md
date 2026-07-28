---
name: discussion
description: Discuss Ring-lang language direction, architecture, backlog, or batched Repository Steward decisions. Use for “讨论”, “设计”, “聊聊”, “想法”, “backlog”, check-ins, or resolving a waiting-feedback item that needs a user-reserved decision.
---

# Discussion

作为用户与 Repository Steward 的低频设计和决策界面，不实现编译器代码。先完整读取 `AGENTS.md`、`CLAUDE.md`、`docs/workflow.md`、相关设计/看板和 Steward Inbox。

## 用户保留决定

只有以下事项必须由用户拍板：

- 改变语言公开语义、语法、effect / ownership / safety 保证或设计公理；
- breaking public API/ABI、平台支持撤销、永久依赖或 runtime TCB 扩张；
- 新 P0、长期路线重排或显著扩大投入；
- 降低测试、验证、可移植性或安全门槛的豁免；
- release、公开发布、历史重写、不可恢复删除、仓库外权限/秘密/付费资源。

修复违反既有公开语义、safety 或 ownership 保证的 bug，是恢复既有契约，不等于修改保证，也不因 safety/ownership 关键词自动进入用户 Inbox。候选都恢复既有契约时，由 Steward 做 Argument + 独立反驳并选择内部实现；只有接受已知违约、降低/豁免保证或修改契约才呈交用户。

普通实现、维护和 refactor 的多个工程方案不进入用户 Inbox；Steward 应先做事实核验、Argument 和独立 review，再在授权内决定。

## 处理顺序

1. 先呈现开放的用户保留 `[决策]`：一句话问题、影响、最多三条事实、明确推荐和 1–2 个真实备选；随后压缩呈现 `[里程碑]` / `[全局阻塞]`。
2. 用户答复后先把 verdict / 约束写入所属 design、backlog 或 workflow 真值并 commit；再删除 dossier；最后把对应 item 从 `waiting-feedback` 改回 `queued`。禁止先删 dossier。
3. 再处理用户主动提出的新设计、架构或 backlog 方向。
4. 基于旧限制、旧 review 或 TS 时代记录立项前，先做分钟级双后端 probe 核验前提。

## 写入

只写 `docs/` 治理真值，不碰编译器代码。新 backlog item 必须包含唯一 ID、优先级、复杂度、dispatch、具体文件/模块和可证伪验收标准；新 P0 由用户决定，Steward 可按证据创建 P1–P3 工程项。

不要修改无关的 `planning` / `doing` spec；治理真值同步或 Steward 明确请求的 spec 修订除外。

## 用户 check-in

保持低噪声，按“需要拍板 → 已完成结果 → 仓库健康/真实风险 → 下一步自主方向”汇报。不要呈现 subagent/命令等待、普通实现取舍、工具过程、原始日志或逐文件实现流水。

完成治理修改后运行 `python .agents/scripts/validate_workflow.py`。一次 Discussion 只生成一个治理/docs commit。
