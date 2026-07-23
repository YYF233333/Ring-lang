---
name: worker
description: Execute Ring-lang backlog or audit items with Codex multi-agent orchestration. Use for “执行”, “开始工作”, “下一个 wave”, “worker”, “并行执行”, “修 audit”, “fix audit”, or any request to implement queued/open items.
---

# Worker

作为 root orchestrator 选择工作、创建 worktree、调度持久 implementer、review、merge 和维护看板。M / L / XL item 不由 root 实现；S 快速通道是唯一例外。

开始前完整读取 `AGENTS.md`、`CLAUDE.md` 和 `docs/workflow.md`。

## 1. 选择 item

运行：

```powershell
python .agents/scripts/validate_workflow.py
rg -n "\[queued\]" docs/backlog.md
rg -n "\[open\]" docs/audit-report.md
```

按 `P0 > critical > P1 > medium > P2 > low > P3` 排序，跳过 `waiting-feedback`。

对候选逐项：

1. 验证 spec 的文件、API 和前提仍与 main 一致。
2. 复核 `mechanical` / `judgment`。
3. 分析依赖和文件冲突。
4. spec 漂移时停止该 item、恢复原状态并报告，不猜测修订。

## 2. 选择执行路径

### S 快速通道

只有满足全部条件时才由 root 在 main 直接实现：

- 标记为 S；
- 解法唯一；
- 不与运行中 worktree 修改同一文件；
- 不产生新的设计选择。

超出 S 后立即停止，转标准路径。

### 标准路径

- `mechanical`：优先使用 `deepseek-dispatch`（可用且 DS 可达时），否则使用 implementer。
- `judgment`：使用 Codex `implementer` role。

按当前 runtime 容量派发，不假设一定有四个 subagent。普通 wave 最多三个 implementer；高风险 judgment wave 优先保留一个 reviewer 槽位。

## 3. 创建隔离 worktree

root 在 spawn 前完成：

1. 用 `git -C <main> rev-parse HEAD` 记录 `EXPECTED_BASE`。
2. **串行**创建 `.worktrees/<task-name>` 和 `codex/<task-name>` 分支。
3. 创建后核对 worktree HEAD。
4. 将 item 标为 `doing`。

所有 agent 使用绝对 worktree 路径。git 命令一律 `git -C <path>`；其他命令显式设置 workdir。不要依赖共享 cwd，也不要伪造 provider-specific 的隐式 worktree API。

native / ASan 和 LLVM addon 的准备遵循 CLAUDE.md。需要从 main 复制 ignored artifact 时，由 root 明确准备并记录来源。

## 4. Spawn 持久 implementer

使用当前 session 暴露的 collaboration spawn 工具，并请求 `implementer` role。Prompt 至少包含：

- task name、worktree 绝对路径、branch、`EXPECTED_BASE`；
- backlog / audit 的完整 spec 与验收标准；
- 允许修改的文件集合；
- 先读 AGENTS.md 与 CLAUDE.md；
- 禁止修改 main、design、两个看板、worker_feedback 和 CLAUDE.md；
- blocker 立即发消息给 root；
- 非 trivial 修复方向不得自行拍板；
- 使用 CLAUDE.md 当前构建、测试和 bootstrap 命令；
- 完成后提交 scoped commit并报告测试证据。

Implementer 不是 one-shot。保存其 task name / agent id，在实现、review 和返修阶段持续复用。

## 5. 实时监督

- implementer 的澄清和 blocker 用 agent 消息即时处理；
- 方向偏离时向原 agent 发送修正；
- agent 完成一轮后，使用 follow-up / resume 让同一 agent 返修；
- agent 卡死、越界或继续会造成损失时 interrupt；
- 用 wait 工具等待状态，不轮询文件模拟通信。

只有需要跨用户回合或跨 session 保存的决策 / WIP 才写 `worker_feedback.md`。不得要求每个完成 item 强制产生 `[通知]`。

## 6. Review 与返修

任一 implementer 返回后立即：

1. 核对 worktree base、commit 和实际 diff。
2. 检查 spec、回归测试、边界和越界修改。
3. judgment / 高风险 item 有可用槽位时派 `reviewer`；否则 root review。
4. 把 actionable review 发回**原 implementer**修改，不重新生成上下文为空的 agent。
5. 直到 diff 和定向测试满足验收标准。

Reviewer 只读，不直接修代码。

## 7. Merge 与验证

只有 root 操作 main：

1. merge 已通过的 commit；
2. 按 CLAUDE.md 执行 dist-llvm rebuild、fixpoint / double-bootstrap 和相关测试；
3. 测试失败时定位到具体 merge，并把修复交回原 implementer；
4. 删除完成 item、更新 CLAUDE.md 和 bookkeeping；
5. amend 实现 commit；
6. 清理 worktree；
7. 从最新 main 创建下一个 worktree补位。

源码语义冲突或新设计问题必须交给用户。需要等待时保存 branch、commit、已跑测试和下一步，将 item 改为 `waiting-feedback`；其他独立 item 可以继续。

## 8. 结束

队列或本次授权范围耗尽后运行：

```powershell
python .agents/scripts/validate_workflow.py
python tests/run_tests.py
```

最终报告列出完成 item、commit、测试、仍在等待的决策和未处理队列。不要自动扩大到下一 wave。
