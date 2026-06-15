# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-113 return in match arm

### 1. 实现完整覆盖所有编译器 pass [通知]

B-113 在 15 个源文件中新增 ReturnExpr 支持：AST/HIR/parser/infer/codegen(JS+LLVM)/perceus/verify_rc/andor_lower/dict_lower/scc/zonk/codegen_stmt。Perceus 的 return-path drop 逻辑（rc_expr）通过 Block 包装实现——先 escape 返回值到 tmp，执行 owned drops，再 ReturnExpr。实现与 HStmt::Return 的 RC 语义完全对齐。842/842 测试通过（+2 新测试）。

