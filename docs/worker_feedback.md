# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-125 Wave 2 执行报告（2026-06-27）

### 1. [通知] Ptr 方法 codegen 采用混合方案：runtime + 内联 LLVM IR

alloc/dealloc/copy 走 runtime 函数（涉及 malloc/free/memmove），read/take/write/offset/cast/addr 内联 LLVM IR（1-2 条指令，消除函数调用开销）。

### 2. [通知] ring_raw_alloc 做了 zero-init（memset 0）

设计说"返回未初始化内存"，但实现做了 `memset(p, 0, count * 8)`——防御性选择，未初始化读取得到 null 而非 garbage。如果将来性能敏感，可加 `alloc_uninit` 变体。

### 3. [通知] read() 对 pointee 类型做条件 dup

基本类型（Int/Float/Bool/Unit/Ptr）不 dup，复合类型（Str/List/Struct 等）dup。避免对 tagged integer 做无意义的 ring_dup 调用。

### 4. [通知] 1 个 pre-existing flaky test

`impl_bounds.ring` 间歇性 runtime crash。与 Ptr 改动无关，多次跑约 1/3 出现。
