# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-011 LLVM Wave 2c

### 1. N-API addon 的 LLVMVerifyModule 不支持非致命模式 [通知]

addon 的 `LLVMVerifyModule` wrapper 在验证失败时总是 `napi_throw_error`，不管 action 参数值。当前只能跳过验证。修复方案：(a) 改 addon 的 wrapper 使 action=2 时只返回错误码不 throw，或 (b) 等自举后直接调用 LLVM-C API。

### 2. "Terminator in middle of basic block" 待修复 [通知]

标准库某些函数（带 `return` 语句后有后续代码的路径）生成的 IR 有 terminator 位置错误。这些函数在 hello.ring 中不被调用所以不影响 .o 生成。Wave 3（bootstrap 尝试）时需要修复。根因是 `emit_return` 后当前 basic block 已终止，但后续语句仍在往同一个 block 写入。

### 3. Wave 2 codegen 全部完成 [通知]

Wave 2 的全部子任务（2a-2g）已完成：编排器 + 全量 HExpr/HStmt + runtime 修正 + evidence threading + trait dict dispatch。下一阶段是 Wave 3（std lib C ABI 补全 → 首次 bootstrap 尝试）。

