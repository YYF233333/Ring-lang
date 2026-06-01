# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-012 Perceus RC 核心 (L0)

### 1. Perceus pass Ident 包装导致 LLVM codegen panic [通知]

RC pass 最初把所有 `HExpr::Ident`（包括全局函数如 `print`）包装成 `Block{Dup, Ident}`。LLVM codegen 的 `gen_call` 期望 callee 是 `Ident`，Block 导致 panic。**已修复**：添加 `locals` 集合追踪本地定义变量，只对 locals 做 RC，跳过全局函数引用。

### 2. Assignment target 被 RC 变换 [通知]

Perceus pass 对 `HStmt::Assign` 的 target（L-value）也调用了 `rc_expr`，导致 target 被包装成 Block。LLVM codegen 的 `emit_assign` 只处理 `Ident` 和 `FieldAccess` target，Block 导致 panic。**已修复**：assignment target 不经过 rc_expr。

### 3. ring_runtime.cpp 改造量比预期大 [通知]

runtime 有 ~80 处 `new`/`malloc` 分配需要全部转为 `ring_alloc` + placement new。A1 agent 连接中断，完成了约 70%，由 continuation agent 完成剩余 30%（Set/Path/SB/Closure/IO 函数 + container drop bodies + drop table 注册）。总改动 560 行新增 / 236 行删除。

### 4. RC pass 尚未端到端验证内存下降 [通知]

B-012 的代码基础设施已全部就绪（runtime RC + HIR Drop/Dup + Perceus pass + LLVM codegen 集成），728 E2E + 11 LLVM diff 全过。但尚未实际编译编译器自身（40 模块）观察内存峰值下降。这需要在有足够内存的机器上测试。B-012 spec 的最终验收标准（内存下降 + 完整 native 自举 + 二次自举一致性）需要后续验证。

### 5. Perceus pass Block 包装的架构隐患 [通知]

当前的 dup 实现通过 `HExpr::Block { stmts: [Dup], tail: Ident }` 在表达式层插入 dup。虽然 `locals` 检查避免了全局函数问题，但 Block 包装会改变 HIR 表达式树结构，可能影响其他 codegen 路径（如 FieldAccess 的 receiver、StructLit 的字段值等）。更健壮的方案是将 dup 收集到语句层统一 emit，但需要较大重构。当前方案对 L0 足够，但如果后续发现更多 codegen 不兼容，应考虑迁移到语句层 dup 方案。
