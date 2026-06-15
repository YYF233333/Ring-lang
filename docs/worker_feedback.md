# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-089 G-b inline setjmp 实现（2026-06-16）

### 1. setjmp wrapper UB 修复 [通知]

Worktree agent 的初版实现调用 `ring_catch_setjmp`（C wrapper 内部调 `setjmp` 后返回），5 个 llvm_diff fail/catch 用例 native 崩溃（exit 3 / 错误值）。根因 = C 标准 UB：wrapper 返回后其栈帧已销毁，`longjmp` 跳回死帧。修复 = 直接从 LLVM 生成的函数调用平台 `_setjmp`（通过 `ring_catch_get_buf` 获取 heap 上的 jmp_buf 指针），并标记 `returns_twice` 属性。修后 5/5 用例全过。

### 2. receiver_temp_drop.ring llvm_diff timeout [通知]

86/87 llvm_diff pass，唯一失败 = `receiver_temp_drop.ring` JS 端 hang（60s timeout），native 端正常完成且输出正确。这是 pre-existing 问题（与 inline setjmp 无关），JS 端 `node compiler/dist/main.js run` 该用例不返回。

### 3. ring_catch_setjmp 可清理 [观察]

`ring_runtime.cpp` 的 `ring_catch_setjmp` 函数不再被 LLVM codegen 调用。`codegen_llvm.ring` 的运行时声明已从 `ring_catch_setjmp` 换为 `ring_catch_get_buf`。runtime 函数本体可保留（兼容）或清理（dead code），由用户定。

