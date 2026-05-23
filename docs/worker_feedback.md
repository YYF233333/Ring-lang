# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## Worker Wave A（2026-05-24 bug 修复轮）

### 1. 上轮 worker 遗漏了 5 个已完成条目的清理 [通知]

从 git history 发现 #90、#92、#78（audit-report）和 B-047、B-050（backlog）都有对应的 fix commit，但表中仍保留着原始条目。已全部清理。未来 merge 后的 bookkeeping 需更严格执行。

### 2. #14 全部 28 处 panic 均为 unreachable 内部断言 [通知]

Agent 审查了全部 28 处 panic() 调用（分布在 9 个文件），确认没有任何一个可由用户 .ring 代码触发。全部加了 `unreachable:` 前缀统一标识。

### 3. #91 impl 限定路径——checker 无需修改 [通知]

Parser 新增 `parse_qualified_ident()` 方法后，checker 的 `register_impl` 函数无需任何修改。原因：`prefix_decl_name` 已有逻辑在 `target_type.contains("::")` 时跳过前缀添加，qualified name 直接匹配 registry 中的 key。

### 4. B-022 IIFE return 修复——类型检查器已阻止部分场景 [通知]

Agent 发现 `return` 在 if/match 表达式分支中（如 `let y = if true { return 100 } else { 200 }`）实际被**类型检查器**拒绝（`return` 类型为 `Unit` 而非 `Never`/bottom type），不会到达 codegen。codegen 修复主要影响 block 表达式中的 return（`let x = { return 42; 0 }`）。`stmts_contain_return` 的 wildcard 分支跳过了 `Assign` 语句的 RHS 检查，为已知的 minor gap（极罕见场景，fallback 仍为原有 IIFE 行为）。

## Worker Wave B（2026-05-24 bug 修复轮续）

### 5. #77 delegate 仅修复了 sub-issue 1+2，3+4 为已知限制 [通知]

Sub-issue 1（param mutability）和 2（method type_params）通过扩展 `TraitMethodDef` 结构体（新增 `param_mutabilities` 和 `method_type_params` 字段）干净地修复。Sub-issue 3（effect annotation 用 trait 声明值）是保守安全的决策。Sub-issue 4（effect evidence 不传递）是带 effect 的自定义 trait 使用 delegate 时的已知限制，当前无内建 trait 受影响。

### 6. B-024 引入了 `DictRef` enum 和 inline wrapper dict——影响面较大 [通知]

修复深层嵌套泛型 UFCS 调用需要改变 HIR 数据结构：`resolved_dicts: List<Str>` → `List<DictRef>`，`TraitDispatch::Direct` 的 `extra_dicts` 也从 `List<Str>` → `List<DictRef>`。这是对 HIR/codegen pipeline 的结构性变更。codegen 中 `dict_ref_to_js` 对 Eq/Clone/Debug/Ord 四个内建 trait 硬编码了 wrapper dict 的方法签名，用户自定义 trait 会 fallback 到裸 dict 名。自举编译器正常编译自身，确认无回归。
