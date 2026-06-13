# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## Wave A (2026-06-13)

### 1. B-124 join 签名收紧 [通知]

纯机械改动，`List<T>` → `List<Str>`。全库 grep 确认所有 `.join()` 调用站点均为 `List<Str>`，迁移影响为零。负面测试 `join_non_str.ring` 锁定 E0301。dist 不需重建（只改 std/list.ring）。

### 2. B-094 死映射清理 [通知]

三处死映射（`Str.to_int`/`Str.to_float`/`List.enumerate`）+ 一处 forward declare 删除。JS 后端确认无对应映射，`ring_runtime.cpp` 确认无对应实现。闭合括号从 83 调整为 80。

### 3. #143 E0105 注册 [通知]

`codes.ring` 新增 `E0105` 常量 + `error_description` "Invalid impl type argument"。`parser.ring` 两处字符串字面量改用常量引用。dist-llvm 因 worktree 缺 llvm-addon 跳过重建，merge 后 main 侧 dist 重建覆盖。

### 4. B-126 backlog 清理 [通知]

B-126 (LLVM opt pass pipeline) 在本次 worker 启动前已由用户实现（commit `631f441`），但 backlog 未更新。本次清理删除该条目。
