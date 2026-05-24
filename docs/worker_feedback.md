# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## Worker #77 + #116（2026-05-24）

### 1. #77 根因不在 delegate 而在 register_trait [通知]

审计原始描述认为问题在 `expand_delegate_impls` 的合成调用不传递 evidence。实际根因是 `register_trait`（infer_register.ring ~L575）在匹配 trait 方法声明时用 `..` 丢弃了 `declared_effects` 字段，导致 trait 方法的 FnType 永远是 `EMPTY_ROW`。这影响所有 trait method 的 effect 传播，不仅仅是 delegate。修复：捕获 `declared_effects` 并调用 `resolve_declared_effects`。

### 2. #77 同时修复了 dict dispatch 的 evidence 转发 [通知]

`codegen_expr.ring` 的 dict dispatch 调用路径从未附加 evidence args。这意味着通过 trait dict 调用的方法（不仅是 delegate，还包括泛型函数中的 trait bound 方法调用）也缺少 evidence。修复：在 dict dispatch call 中添加 `get_callee_evidence_args` 调用。

### 3. #77 修复后 `__ring_raise_fail` workaround 值得检查 [通知]

CLAUDE.md 提到 parser 的 `__ring_raise_fail` workaround 是因为"跨模块 effect 传播的独立问题"。#77 修复了 trait method effect 注册的根因，可能已消除该 workaround 的必要性。建议在下次 session 中验证 `__ring_raise_fail` 是否可以移除。

### 4. #116 是两行修复 [通知]

在 `merge_effects` 开头添加 `apply_subst_row(s, a)` 和 `apply_subst_row(s, b)`，确保 merge 在 resolved 的 effect rows 上操作。纯正确性修复，无行为变化（现有测试已覆盖）。

