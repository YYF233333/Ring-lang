# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## Worker Wave A+B（2026-05-23）

### 1. lookup name vs canonical name 是系统性问题 [通知]

#81（struct literal）和 #82（effect op）暴露了同一模式：mod 内查找到定义后，代码使用 lookup key（短名如 `"Vec2"`）而非 `def.name`（canonical name 如 `"geo::Vec2"`）构建类型/HIR 节点。WT-A2 agent 在修 #82 时主动发现并修复了 `infer_effect_op` 和 `resolve_effect_expr` 中的同类问题。建议未来审计时系统性检查所有"从 registry 查找后使用 name"的代码路径。

### 2. #88 修复范围超出预期——compiler_mod.ring 也需要改 [通知]

WT-B3 agent 发现仅修 `exports.ring` 不够——`compiler_mod.ring` 的 `is_pub_type_in_decls` 和 impl export 收集也不递归进 ModBlock。agent 提取了 `collect_impl_exports` 递归函数并扩展了 `is_pub_type_in_decls`。

### 3. #86 的 parser 修复与 checker 整合是关键 [通知]

Parser 支持 `fx::Logger` 限定路径只是表面层。实际还需要修 `infer_method_call` 来构建 qualified effect name（从 `Expr::Ident` 的 `qualifier` 字段），否则 checker 仍然用短名查找 effect registry 失败。

### 4. WT-A3 (#83) 已完成但按计划丢弃 [通知]

B-050（`insert_mod_aliases` 增量化）是根因修复，#83 留给 Wave D。

### 5. 所有 worktree agent base 漂移到 483d242 [通知]

worktree 创建机制的已知限制，增加了 cherry-pick 冲突解决的 orchestrator 工作量。

