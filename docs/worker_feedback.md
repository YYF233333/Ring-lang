# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-083 Perceus RC pass 正确性修复

### 1. #1 Lambda 捕获 + #3 循环内闭包已修复合入 [通知]

#1/#3 已修复（commit 0095c59）。关键发现：旧 Lambda 分支传错 `locals`（传成 lambda 自身的 `lambda_locals` 而非外层 `locals`），导致闭包捕获**零检测**——既不 dup 也不 move，比 spec 描述的"只 insert 没 dup"更糟。现改为结构性算捕获 ∩ 外层 owned locals + 标准 Perceus last-use（非最后使用 dup / 最后使用 move），并修了 Set 别名陷阱（`set_clone` snapshot）。#3 用 seed body live 强制 per-iteration dup + 从保守 once-before-loop dup 排除（防 double）+ 分析后 restore liveness。补了 3 个 llvm_diff 用例（closure_capture_loop/move/nonloop）。728 JS + 14/14 llvm_diff 全过。codegen 实测确认 `gen_lambda` 存裸指针不 dup（dup 责任在 perceus）。

### 2. #2 TryCatch spec 前提与现状不符，退回重新设计 [决策]

**现状**：spec 说修"异常不匹配直接传播的路径"。但 CLAUDE.md 明确 Ring 的 catch 是穷尽捕获点（catch arms 经穷尽性检查），异常一定被某 arm 捕获——该路径理论上不存在。Worker 因此未照 spec 猜着做。
**原因**：真正的 RC 难点是 try body 中途 abort 时已分配局部值的清理——abort 经 `ring_try` longjmp 式 unwind，绕过正常 drop 序列 → 泄漏。这是 RC + 异常的硬问题。
**待决策**：
- (A) 并入 B-002（Drop/RAII）统一设计 abort-unwind 时的资源清理（推荐——同源问题）
- (B) 作为独立 item 设计 perceus 在 TryCatch abort 路径的 drop 插入
- (C) 暂不处理，待 native 自编译实测是否频繁触发再定优先级

### 3. #4 Match guard spec 框架与现状不符，退回重新设计 [决策]

**现状**：spec 说"guard 在 body 之后分析但运行时先执行"是 bug。但当前 backward 分析 body-先-guard-后对 guard-**真**路径是**正确的**（body 运行时在后，backward 本应先分析 body）；Explore agent 建议的"反转顺序"反而会引入错误。
**原因**：真正 bug 在 guard 求值为**假** → fall-through 到下一 arm 的路径未建模（guard 可能已消费/dup 变量而 body 没跑，下一 arm 又用 → UAF/泄漏）。
**待决策**：
- (A) 设计 guard-false fall-through 的控制流合并分析（需先厘清 guard 在 codegen 怎么 lower）
- (B) 暂不处理（guard 在编译器自身用得少，native 自编译可能不触发）

### 4. runtime 闭包 env drop 缺陷（已记 audit #130）[通知]

#1/#3 修复 dup 后暴露配套 drop 缺失：`drop_closure` 因 env 与 `{fn_ptr,env_ptr}` pair 复用 typeid，只 drop env 的 slot[1]，捕获指针泄漏。方向安全（泄漏非 UAF），但拉高 native 自编译内存峰值。已记 audit-report #130，建议 native 终验前修（可能并入 B-002）。

