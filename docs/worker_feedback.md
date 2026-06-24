# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-139 Default trait method evidence forwarding

### 1. 实际根因与 spec 不同 [通知]

Spec 说 delegate stub 转发 call 时漏传 evidence——但调查发现 **delegate 转发路径本身是正确的**（codegen 的 `get_callee_evidence_args` 已处理）。真正的 bug 是 **`HTraitMethod` 缺少 `effects: EffectRow` 字段**，导致 codegen 为 default trait method 生成函数时无法产生 evidence 参数。修复为数据结构级变更（5 个源文件），需 double bootstrap。

### 2. LLVM 后端不支持 default trait methods [通知]

发现 LLVM 后端完全不支持 default trait methods——生成 `unknown method` warning + null closure，调用时 access violation。这是 pre-existing 限制，不在 B-139 范围内，但 llvm_diff 测试只覆盖了 explicit method 路径。

## B-140 Perceus UAF probe

### 3. HIR 层 RC 平衡正确——根因在更深层 [通知]

对 `perceus.ring` 的穷举分析（`is_droppable_init`、`rc_escape`、`rc_block_inner`、`sink_arg_indices`）确认 HIR 级 Clone/Drop 插入**正确平衡**。RC verifier 对触发模式报 0 errors。根因不在 Perceus 变换层——需要 ASan native 调试（LLVM IR dump + 完整 alloc/free 栈）来定位真实 free 路径。B-140 已更新 spec，重排为 queued 等待 ASan 调试。

<!-- B-099 UAF 决策已处理（2026-06-24）：用户拍板 (C) 先绕后修。Workaround commit f8302d8，根因修复排 B-140 [P1]。 -->

