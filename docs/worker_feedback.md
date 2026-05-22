# Worker Feedback

> Worker 的消息通道。两种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
>
> Worker session 很长，用户无法回看全部过程。这里是 worker → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## Wave C 执行报告（2026-05-23）

### 1. [通知] B-032 worktree base drift（已用 cherry-pick 解决）

**现状**：B-032 worktree agent 拿到了错误 base（`953d246` 而非 `ffd6399`）。
**处理**：cherry-pick 到 main，手动解决 6 个 parser.ring 冲突（`var` → `let mut` 转换）+ dist/ 用 `--ours` + rebuild。测试全绿。

### 2. [通知] B-032 发现 B-025 修复被 B-019 回退

**现状**：B-025 修复的 `parse_call_expr` span end bug（`current_span_start()` → `rparen.span.end`）在 B-019 的批量 `var→mut` 迁移中被意外回退。
**修复**：B-032 重新应用了此修复。

### 3. [通知] #59 修复范围比预期大

**现状**：#59（嵌套 mod 块限定名）涉及 7 个编译器源文件，不仅修复了 `prefix_decl_name`，还扩展了 parser（支持多级限定路径 `a::b::c`）、checker（mod 路径回退查找）、codegen（嵌套 ModBlock 处理）、exports（嵌套导出）。
**影响**：嵌套 mod 块现在是完整支持的特性，不仅仅是 bug fix。

## Wave A+B 执行报告（2026-05-23）

### 1. [通知] B-031 移除 Cell 后 `mut<T>` effect 基础设施成为死代码

**现状**：B-031 移除了 Cell\<T\> 类型，但 `mut<T>` effect 的推断/unification/codegen 基础设施（MutEffect variant、相关匹配分支等）仍保留在编译器中。
**原因**：移除 Cell 时不扩大 scope，这些代码虽然不再被触发，但不影响正确性。
**建议**：如果确认 `mut<T>` effect 不再需要（Cell 已移除，`let mut` 替代），可以作为未来清理项移除相关代码。

### 2. [通知] B-030 将 `DiagnosticSink::report` 改为 `mut self`

**现状**：为了使 `CollectingSink.report()` 通过 mut enforcement（内部调用 `items.push()`），trait 方法签名改为 `fn report(mut self, d: Diagnostic)`。
**影响**：所有 `DiagnosticSink` 的实现者和调用者需要持有可变引用。当前只有 `CollectingSink` 一个实现，影响范围有限。

### 3. [通知] B-023 发现并修复了 `resolve_trait_dispatch` 的 pre-existing bug

**现状**：`resolve_trait_dispatch` 在匹配类型变量与 trait bounds 时，只用 `uf_find`（遍历 parent map）检查等价性。但 `uf_bind` 将类型绑定存在 types map 中，`uf_find` 无法遍历到。
**修复**：添加 `apply_subst` fallback，通过 types map 解析类型变量。
**影响**：此 bug 阻塞了 bounded impl 方法中使用 `==` 运算符的场景（B-023 的核心需求）。修复后 `impl<T: Eq> List` 等 bounded impl 可以正常调用 trait 方法。
