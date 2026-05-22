# Worker Feedback

> Worker 的消息通道。两种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
>
> Worker session 很长，用户无法回看全部过程。这里是 worker → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## Wave A+B 执行报告（2026-05-23）

### 1. [通知] B-028 StringBuilder `mut self` 偏离

**现状**：B-028 spec 指定 `.add()`/`.line()`/`.add_int()` 为 `mut self` 方法。实现 agent 使用了 plain `self`，与现有 List/Map/Set extern type 的惯例一致（extern type 通过 JS 引用变异，不需要 Ring 层面的 `mut self` 追踪）。
**原因**：extern type 的 mutating 方法在 Ring 类型系统中一直使用 plain `self`（JS runtime 负责变异），`mut self` 仅用于 Ring-native struct。
**影响**：如果 B-030（mut enforcement）落地后 extern type 也要纳入 mut 检查，需要回过头给所有 extern type mutating methods 加 `mut self`。当前实现与现有惯例一致，无功能问题。

### 2. [通知] B-025 暴露了 `parse_call_expr` 的 span end bug

**现状**：`parse_call_expr` 使用 `current_span_start()`（下一 token 的起始位置）作为 Call 表达式的 span end，而非 `)` token 本身的 end。B-025 的 postfix `[` 处理依赖 newline guard（`tok.line > left.end.line`），错误的 span end 导致 guard 失效（`foo()\n[1,2,3]` 中 Call span end 指向 `[` 的行号，与 `[` 同行）。
**修复**：已改为使用 `rparen.span.end`。测试全绿。
**影响**：这是 pre-existing bug，B-025 只是暴露了它。类似的 span end 问题可能存在于其他使用 `current_span_start()` 的 parser 函数中——建议未来 review 其他 `current_span_start()` 使用点。

### 3. [通知] WTB1 worktree base drift

**现状**：B-028 的 worktree agent 拿到了错误的 base commit（历史中没有 `b6c8ab3`）。
**原因**：Claude Code worktree 创建的 race condition（已知问题，CLAUDE.md 有记录）。
**处理**：改用 cherry-pick 合并，手动解决 `runtime.ring` 源码冲突和 dist 冲突，重建 dist 后测试全绿。
**建议**：下次派发 worktree 前可考虑加入短延迟（50-100ms），减少 race condition 概率。

### 4. [通知] 未追踪 effect_custom_* 测试文件已补提交

**现状**：5 个 `effect_custom_*.ring` 测试文件在 e2e.test.ts 中注册但从未 commit，导致 worktree agent 报告 12 个 pre-existing failures。
**修复**：已提交。后续 worktree agent 不再受此影响。

### 5. [通知] B-025 的 `str[i]` 下标语义

**现状**：B-025 实现了 `str[i]` 下标，返回第 i 位的 `Str`（单字符）。越界时 panic。
**注意**：这使用了 JS 的 UTF-16 code unit 索引。LLVM backend 阶段如果 Str 语义统一到 code point 索引（B-011 提到），`str[i]` 的语义需要跟着变。当前 JS backend 下行为正确。
