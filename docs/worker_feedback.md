# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-151 CI 重设计（2026-06-27）

### 1. P1-P4 全部完成 [通知]

- P1：从 e2e.test.ts 提取 408 个 .expected/.error 文件（比原估 ~294 多——cases 数组实际 299 条）
- P2：Python test runner（768 行，4 套件：e2e/llvm/rc/self-compile），零外部依赖
- P3：GitHub Actions CI workflow（3 jobs：check/test/bootstrap），Windows + choco LLVM + Python 3.11
- P4：package.json description 更新

### 2. P2 测试发现的预存问题 [通知]

Python runner 实测发现 9 个 e2e fail + 1 个 llvm fail，均为预存 LLVM 后端 bug（runtime assertion / stack overflow），非 runner 问题。CI 首次跑可能显示这些 failure——它们在 Node runner 下也存在但被 LLVM_SKIP 遮盖。可能需要将这些也加入 LLVM_SKIP 或单独追踪修复。

### 3. ring.exe CLI 参数格式 [通知]

发现 `ring.exe` 的 `--out-dir` 参数必须用 `--out-dir=<path>`（等号形式），不接受 `--out-dir <path>`（空格分隔）。Python runner 已适配。
