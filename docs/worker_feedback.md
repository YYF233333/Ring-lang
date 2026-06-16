# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

（无待处理项）

## B-097 LLVM custom effect handler parity（2026-06-16）

### 1. Custom-abort 并非 parity gap，而是新功能 [通知]

B-097 spec sub-item 1 声称 JS 后端有通用 custom-abort 支持（"EffectAbort + effect-name 匹配"），LLVM 应跟进。实测 JS 后端 `codegen_expr.ring:1451` 硬编码 `effect_name == "fail" && h.op_name == "raise"` 判断 abort——只有 `fail.raise` 走 abort 路径，其他 effect 无 abort 支持。两后端行为一致，不存在 parity gap。如需通用 custom-abort，应作为新功能单独立项。

### 2. Delegate stub 不转发 custom effect evidence [通知]

llvm_diff 测试发现：当 trait 方法签名带 `with {CustomEffect}`，delegate stub 正确接收 evidence 参数但不转发给内层 impl 方法调用。这是 JS 后端的已有问题（生成的 `__Wrapper_Trait_method` 有 `__ring_ev_X` 参数但调用 `__Inner_Trait.method(self.inner)` 时漏传），非 LLVM 特有。变通方案：在 trait 方法 body 内调用 free function（evidence 通过正常参数传递），不在 delegate 签名上直接标 custom effect。已在 `delegate_custom_effect.ring` 测试中使用此模式。

