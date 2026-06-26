# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## Audit 观察报告（2026-06-26，LLVM 通路审计）

### 1. [观察] verify_rc 15 种 fatal 发现类别仅 3 种有专用负面测试

**现状**：`tests/cases/llvm/verify_rc_*` 下仅覆盖 `x-overwrite-field`、`leak-temp`、`uaf-drop-borrow` 三类。其余 12 类（`leak-binding`/`leak-return`/`uaf-escaped-borrow` 等）依赖 self-verify 门和 LLVM 用例扫荡间接覆盖。

**为什么值得注意**：若 verify_rc 因重构静默停止报告某类发现，无直接回归测试捕获。风险不高（穷尽 match 保护），但在 B-100 P1.3 上下文中值得补全。

### 2. [观察] perceus.ring 和 verify_rc.ring 的 droppable_init 分类重复

**现状**：`perceus.ring:1678-1837` 的 `is_droppable_init` 和 `verify_rc.ring:100-102` 的 `v_droppable_init` 各自维护「哪些 HExpr 变体初始化是可丢弃的」。verify_rc 注释称"drift shows up immediately as self-verify findings"。

**为什么值得注意**：漂移检测依赖 self-verify 门触发而非形式化保证。新增 HExpr 变体时若仅更新 perceus 侧，verify_rc 可能产生假阴性。短期可接受，长期应考虑共享分类表。

### 3. [观察] codegen 级 RC drop（7 处）超出 verify_rc 静态验证范围

**现状**：while-condition Bool box、match-guard Bool box、Set 迭代转换 list、range 循环计数器/边界盒子、字符串插值 SB/中间串、handler evidence struct、closure env capture dup——这 7 处 drop 仅存在于 codegen 级，verify_rc 边界说明已文档化（`verify_rc.ring:65-78`）。

**为什么值得注意**：这些 drop 的正确性仅能通过 ASan 检测（×3 策略），无静态覆盖。长期可考虑将部分提升为 HIR 节点（如 `HStmt::CodegenDrop`）以扩大 verify_rc 覆盖面。

### 4. [观察] Debug trait 实现的字符串所有权契约未文档化

**现状**：derive Debug 实现（`codegen_llvm_decl.ring:2423-2427`）对 dict-dispatch 的 Debug 调用返回值无条件 `ring_drop`，假定返回值总是 fresh-owned。`gen_str_lit_simple` 确保了字面量路径正确。`emit_identity_to_debug_str` 的 heap 路径通过 `ring_dup` 补偿。

**为什么值得注意**：若未来某个用户自定义 Debug impl 返回 borrow 的字符串（当前无 std 类型如此），此处 drop 会 UAF。属结构性安全契约，应在 design.md 的 Debug trait 小节显式记录。


