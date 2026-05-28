# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-011 LLVM Wave 2b

### 1. Lambda closure call fallback 已修复 [通知]

合并后发现：标准库中 lambda 参数（如 `f`）被 `gen_direct_call` 当作全局函数查找（`ring_f`）导致 panic。修复：当函数名在 `ctx.functions` 中找不到时，检查 `ctx.named_values` 是否有同名的 closure 变量，有则走 `gen_closure_call` 路径。

### 2. LLVM 验证仍然跳过 [通知]

Wave 2b 实现了所有 HExpr/HStmt 模式，但部分生成的 IR 仍可能有验证问题（如 terminator 位置不当）。验证恢复推迟到 Wave 2c（effect evidence 精确传递完善后）。

### 3. ring_bool_to_str 已添加到 ring_runtime.cpp [通知]

Wave 2a feedback 中提到的 `ring_bool_to_str` 缺失问题已解决。函数返回 `"true"` 或 `"false"`。

### 4. Effect evidence 传递仍为 null [通知]

当前所有 evidence 参数传递 null。对于 hello.ring 等简单程序不影响（runtime 函数不使用 evidence）。但编译器自身迁移需要完整的 evidence 传递。这是 Wave 2c 的重点。

