# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-136 G-b Set 排序确定化

### 1. generalize() 是 G-b 差异的主根因 [通知]

`generalize()`（infer_ctx.ring）的 `free_type_vars` 返回 `Set<Int>`，迭代序不确定导致 `TypeScheme.type_vars` 排序在两后端不同。级联：`instantiate()` 按 type_vars 顺序分配 fresh var ID → 不同 ID → effect 解析结果不同 → codegen 传不同 evidence 参数。这是 5/44 差异的**唯一根因**，其余三处排序是防御性修复。

### 2. collect_local_calls 漏 HExpr::ReturnExpr [通知]

`codegen.ring:387-488` 的 `collect_local_calls` 有 `_ => {}` wildcard 静默丢弃 `HExpr::ReturnExpr` 和 `HExpr::Clone`——仅通过 return 表达式调用其他本地函数的情况（`return some_fn(x)`）不会被收入 callee 图 → 传递闭包漏效果传播。两后端行为一致所以不影响 G-b，但是独立正确性 bug。建议排队修复。

## #141 parser catch W0001 调查

### 1. W0001 是 impl effect 传播限制的假阳性 [通知]

确认 `parse_use_decl` 可 fail（经 `expect` → `error` → `__ring_raise_fail`）。`__ring_raise_fail` 是无 effect 声明的 extern fn，checker 看不到 fail effect → W0001 误报。尝试给 extern fn 加 `with {fail}` 声明——直接调用者（`error`/`report_error`）获得 fail，但 impl 方法间传播仍不工作（同 impl 块内所有方法检查完才 `update_fn_effects`，中间方法的 fail effect 对后续方法不可见）。W0001 未消除，故 revert。结论：#141 是 checker 架构限制，非 S 级可修。
