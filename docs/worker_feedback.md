# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## LLVM gap 修复 batch（2026-06-27）

### 1. #212-#216 全部修复 [通知]

5 个 audit item 全部修复：#212 ring_assert Bool unbox（9 E2E）/ #213 Map&lt;Int&gt; HOF（2 E2E）/ #214 泛型函数 wrapper dict（1 E2E）/ #215 test block（1 E2E）/ #216 extern_fn 重写（1 E2E）。总计解锁 14 个 E2E + 1 个 extern_fn 模块测试。extern_type 保留 skip（JS-specific opaque type 无 native 等价）。

### 2. Frozen dist/ 导致 2 个 E2E 仍在 LLVM_SKIP [通知]

`trait_alias.ring`（#214）和 `scc_mutual_recursion.ring`（#215）的 codegen 修复正确，但 E2E runner 用 `node dist/main.js`（frozen JS bootstrap）编译测试——dist/ 没有 #214 的 checker 修复和 #215 的 test block 实现。结果：编译产物 IR 仍然有问题 → 运行时 segfault。

**待解决**：E2E runner 切到 native `ring.exe` 后可移除这 2 个 skip。建议作为 B-100 Phase 2 的后续收尾任务。

### 3. #214 checker 修改：防止有 bounds 的 fn ident 泛化 [通知]

`infer.ring` 新增 `init_has_bounds` 检查——当 let 绑定的初始化表达式是有 trait bounds 的泛型函数时，阻止泛化。这意味着 `let f = display` 后 `f` 是单态的（不能同时 `f(42)` + `f("hello")`）。全量测试通过（660/660），没有现有代码受影响。但这是一个语义变更——如果未来有"多态函数变量"的需求，需要重新审视此设计。

### 4. #213 额外发现：rt_method_returns_bool/i64 缺失 [通知]

`ring_map_int_any` 需要同时添加到 `rt_method_returns_bool` 和 `rt_method_returns_i64` 才能正确工作。原始 audit spec 未覆盖此点——agent 在实现中发现 `any()` 永远返回 false 并追查到返回值未被 box 为 Bool 的根因。类似的 returns_bool/i64 遗漏可能存在于其他新增 runtime 函数中。
