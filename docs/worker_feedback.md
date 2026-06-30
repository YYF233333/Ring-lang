# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-152 P3 Map RIIR

### 1. method_to_runtime 保留为 C++ shim（非设计目标，是 workaround）[通知]

Agent 发现删除 `method_to_runtime` Map 条目后 double bootstrap 崩溃——trait-bounded impl 块（`impl<K: Hash + Eq, V> Map`）的方法需要 Hash+Eq dict 参数，但 codegen 的方法调用路径在某些场景下未正确传递 dict。暂通过保留 `method_to_runtime` + C++ shim（重写为理解新 struct 布局）绕过。

**结果**：Map 的数据结构已是 Ring struct，Ring impl 方法已存在，但运行时方法调用仍经由 C++ shim 路由。**后续需要调查 codegen 对 trait-bounded impl 方法的 dict 转发**——修好后删除 C++ shim 和 method_to_runtime 条目，Map 方法将直接走 Ring 代码路径。

### 2. malloc(0) 导致 heap corruption [通知]

初始 `map_new()` 用 `ring_buf_alloc(0)` / `ring_slot_alloc(0)` 创建零容量 Map，后续 `drop_map` 遍历空 buffer 时 Windows heap validator 报 heap corruption。改为预分配 8 slot 解决。可能是 `malloc(0)` 返回的 sentinel pointer 被 free 的行为差异（MSVC vs glibc）。

### 3. let mut in map_new 导致 effect 泄漏 [通知]

`map_new()` 用 while 循环初始化 meta buffer（`let mut i = 0; while i < cap { ... }`）会泄漏 `mut` effect 到函数签名，导致编译器自身大量调用 `map_new()` 的地方 effect 不匹配。新增 `ring_buf_alloc_zeroed` C bridge 函数绕过（RIIR 陷阱 #2 的又一次命中）。

### 4. 5 个 golden test snapshot 更新 [通知]

Map 迭代顺序从 `std::unordered_map`（链式哈希）变为开放寻址（线性探测），导致 `for_each`/`entries`/`keys` 的输出顺序变化。5 个 golden snapshot 已更新。语义正确，只是遍历顺序不同。

### 5. Hash trait 的 trait_method_order 注册 [通知]

Phase 3a（Hash trait）发现新增 trait 不仅要在 `builtins.ring` 注册 checker 层信息，还需在 `codegen_llvm.ring:scan_trait_decls` 中注册 `trait_method_order`（codegen 层硬编码）。两层独立，漏一个就 panic。这不是 bug，是现有架构的固有模式。

