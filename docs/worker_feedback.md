# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## Worker Wave C（2026-05-24）

### 1. #100+101 净减 74 行代码 [通知]

`register_fn_common` 统一了 register_fn/register_extern_fn，用三个 bool flag（check_dup/track_mut_params/track_fn_bounds）控制差异。ModBlock 5-pass 注册抽取为 `register_mod_block_items` helper，用 `deferred_struct_names/deferred_enum_names` 的 Option 区分 phase1 和 register_decl 模式。两处重构均为纯行为保持。

### 2. #115 修复发现 resolve_pattern_enum 有 spurious E0201 [通知]

外部限定 struct pattern（`inner::Pair { a, b }`）失败不仅因为 struct_name 构建错误（`q` vs `${q}::${name}`），还因为 `resolve_pattern_enum` 在尝试 enum 查找失败时就报了 E0201 错误。Agent 添加了 `try_resolve_pattern_enum`（不报错版）先试 enum 路径，失败后静默 fallthrough 到 struct 路径。同时添加了 `self::`/`super::` 相对路径支持。

### 3. #106 是纯重排序修复 [通知]

`hdecls.push(hd)` 从 delegate expansion 前移到后，加一个中间 `delegate_decls` list 缓冲。成功路径行为不变，失败路径不再泄漏不完整 HIR。

### 4. #104 发现 merge_effects/row_merge 不应用 substitution [通知]

WTB1 修复 effect row 非对称 tail 统一时发现：`row_merge` 不对 effect rows 应用 substitution 就直接 merge。当 tail variable 已被 bound 到 closed row 时，raw merge 会产生冲突。Agent 的 workaround 是"无 unmatched 时不 bind tail"，避免 over-constraining。长期正确修复是 `merge_effects` 在 merge 前先 apply_subst_row。这是预存问题，不是新引入的。

