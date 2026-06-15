# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## Wave B 执行报告（2026-06-15）

### 1. B-071 Phase 2 诊断 UX：4 个子项全覆盖 [通知]

空集合类型标注建议（检测 `List<?`）、row poly 字段缺失提示（message-based，span 不可得——需 plumb 到 unify 内部，超出增量范围）、E0403 effect 未处理 notes + handler 语法指引、`--error-format=llm` 的 `replacement` 字段增强（E0403/E0205/空集合/effect mismatch）。6 个新测试。

### 2. B-054 Parser 表达式级恢复：match/handle/if 三类 [通知]

新增 `skip_to_recovery_point(stop_tokens)` helper（花括号嵌套感知）。match arm / handle handler / if condition-branch 各自 catch + skip 恢复。3 个端到端恢复测试验证：parse error + 后续声明的 type error 都正确报告。`dummy_expr()` 用于 if condition 失败时的占位。

### 3. #157 payload-enum drop：调查确认不复现 [通知]

perceus 已正确处理（`NamedVariantConstruct` → `is_droppable_init=true` → scope-end Drop）。verify_rc 0 errors。D9 probe 的 tid68 泄漏可能是自编译场景特有或已被 D9 Part 2 单例化消除。新增 3 个 llvm 回归测试（single/multi-field + match-result-binding）。audit #157 已关闭。
