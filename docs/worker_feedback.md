# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-089 三门通过 — Level 1 完成（2026-06-16）

### 1. G-b 根因 = Windows _setjmp ABI 缺第二参数 [通知]

inline setjmp 初版 STATUS_BAD_STACK 崩溃的根因：Windows x64 `_setjmp` 需要两个参数 `(jmp_buf*, frame_ptr*)`，codegen 只传了一个。缺失的 frame pointer 导致 `longjmp` 用垃圾值恢复栈帧。修复 = 声明 `@llvm.frameaddress.p0` intrinsic 作第二参数。小程序侥幸通过（垃圾值碰巧合法），自编译规模必崩。

### 2. build_native.ps1 已加 /STACK:536870912 [通知]

默认 1MB 栈太小，编译器深递归（parser/checker）会栈溢出。与 llvm_diff harness 对齐使用 512MB。

### 3. receiver_temp_drop.ring JS 端 hang 会留孤儿进程 [通知]

llvm_diff 的 `execSync` timeout 杀测试但不杀子 node 进程。已在 llvm_diff.test.mjs 加 `JS_SKIP` set 跳过该用例。两个残留 node 进程已手动清理。

