# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-057 / #108 / #45 occurs-check + apply_subst fields 遍历

### 1. occurs_in/apply_subst 对 struct/enum fields 的处理与 #45 决策冲突 [决策]

**现状**：
- `occurs_in`（`unify.ring:55-58`）对 StructType/EnumType 只递归 `type_params`，不查 `fields`/`variants`（#108）。
- `apply_subst`（#45）同样不替换 fields 中的类型。
- B-057 要求**同时**修两者（occurs_in + apply_subst 递归 fields），原标 mechanical。

**原因（冲突点）**：
- #45（2026-05-23 决策）明确决定 apply_subst **不**递归 fields：fields 是模板字段含递归引用（如 `Node<T>`），递归替换会栈溢出；当前 `infer_field_access` 的 inst_map 兜底是正确设计；长期容忍，等改 nominal 表示时与 #16 一并重构。
- #108 自己的 interlock 注释：只修 occurs_in 而不修 apply_subst，会让 occurs_in 看到未替换的 type var → 看到错误的变量。
- 所以 B-057「mechanical 同时修两半」与 #45「apply_subst 不该递归」直接矛盾，单修 occurs_in 也不完备。这不是 mechanical 任务。

**待决策**（用户 2026-06-03 已选「跳过，转 Discussion 重新设计」，此条记录供 Discussion agent 落实）：
- 方向：改 nominal 表示（关联 #16/#45），用 nominal field 引用消除递归替换需求，再统一修 occurs_in + apply_subst（L-XL 工作量）。
- Discussion agent 需要：评估 nominal 重构的具体方案 + 排期，或确认长期容忍现状（关掉 B-057，#108 标 wontfix）。
- B-057 已转 `waiting-feedback` 并从 mechanical 升级为 judgment；#108 加了交叉引用。
