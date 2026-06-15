# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-141 parse_expr 多余参数（2026-06-16）

### 1. 根因不同于预期 [通知]

原假说"LLVM codegen 方法名解析混淆"是错的。实际是 `parser.ring:2362` 源码 bug：`self.parse_expr(PREC_NONE)` 多传了参数（`parse_expr` 无参）。JS 忽略多余参数故从未暴露。修复后 LLVM verify 0 errors，但 **G-b 8 文件差异不变**——此 bug 不是 evidence 丢失的根因。

### 2. Checker 不拒绝多余参数的方法调用 [通知]

`infer.ring:2031-2046` 的方法调用检查不报错当 `hargs.len() > mt_params.len() - 1`。这是独立 bug——任何 `obj.method(x, y)` 其中 method 只接受 1 个参数，checker 静默通过。JS 运行时忽略多余参数所以无外显症状，但 LLVM 严格检查。建议立项。
