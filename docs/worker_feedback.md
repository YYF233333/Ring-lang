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

## B-096 Perceus 闭包 RC 完整收口（2026-06-17）

### 1. Sub-items 3 和 4 无需修复 [通知]

**Sub-item 3 (guard-false 边泄漏)**：经代码审计确认，pattern bindings 是 scrutinee 的 borrow projections（perceus.ring:2238: "loaded without a dup"），不是 dup'd 值。Guard-false 跳转到下一个 arm 时无 dup'd 值需要 drop。Spec 的前提（"pattern 绑定在进入 arm 前被 dup"）不成立——codegen 中 `bind_constructor_fields` 仅做 GEP + load，无 `ring_dup`。

**Sub-item 4 (Range drop_T)**：Range 用 typeid 10 (TUPLE)，`drop_tuple` 是 no-op，但 `ring_drop` 在 drop_tuple 后仍调 `free()` 释放 Range struct 本身。Range 的 start/end/inclusive 三个字段均为 B-080 tagged pointer（Int/Bool），`ring_drop` 对 tagged pointer 直接 return——无需递归 drop。Range 已正确释放。

### 2. Evidence struct 嵌套 handle double-free 陷阱 [通知]

Sub-item 5 实现中发现：嵌套 handle 处理同一 effect 时（如内外层都 handle Config），内层 handle 会覆盖 `ctx.named_values` 中的 evidence alloca。如果 drop 时按 name 查找 alloca，外层 handle scope 结束时会加载内层的 alloca，导致 double-free。修复方案：`emit_evidence_drops` 直接持有 alloca LLVMValueRef，不经过名字查找。`effect_nested_handle.ring` llvm_diff 测试覆盖了此场景。

### 3. 实现选型：typeid 21 + count-prefixed layout [通知]

Evidence struct 从 typeid 7 (CLOSURE) 改为 21 (EVIDENCE)，layout 从 flat `{ ptr, ptr, ... }` 改为 `{ i64 count, ptr slot0, ptr slot1, ... }`。选专属 typeid 而非复用 CLOSURE_ENV (15) 的理由：语义清晰，避免 CLOSURE_ENV 的 drop 路径被非预期触发。Default evidence (B-097 的 `build_default_evidence_all`) 使用相同 typeid 和 layout，但不显式 drop（process-lifetime，初始 RC=1 永不归零）。

## B-097 LLVM custom effect handler parity（2026-06-16）

### 1. Custom-abort 并非 parity gap，而是新功能 [通知]

B-097 spec sub-item 1 声称 JS 后端有通用 custom-abort 支持（"EffectAbort + effect-name 匹配"），LLVM 应跟进。实测 JS 后端 `codegen_expr.ring:1451` 硬编码 `effect_name == "fail" && h.op_name == "raise"` 判断 abort——只有 `fail.raise` 走 abort 路径，其他 effect 无 abort 支持。两后端行为一致，不存在 parity gap。如需通用 custom-abort，应作为新功能单独立项。

### 2. Delegate stub 不转发 custom effect evidence [通知]

llvm_diff 测试发现：当 trait 方法签名带 `with {CustomEffect}`，delegate stub 正确接收 evidence 参数但不转发给内层 impl 方法调用。这是 JS 后端的已有问题（生成的 `__Wrapper_Trait_method` 有 `__ring_ev_X` 参数但调用 `__Inner_Trait.method(self.inner)` 时漏传），非 LLVM 特有。变通方案：在 trait 方法 body 内调用 free function（evidence 通过正常参数传递），不在 delegate 签名上直接标 custom effect。已在 `delegate_custom_effect.ring` 测试中使用此模式。

