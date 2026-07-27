# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
>
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

---

## B-163 Phase 2 P2.1 parity 基线（2026-07-27）[通知]

merge `156b005` 已把 Phase 2 的证据层落成机器门：81 行 matrix（65 covered / 13 known-gap / 3 manual），enum variant closure、完整双后端 lane bundle、repo-relative gap identity、orphan companion 与 `EXPECT_PANIC` 作用域都由 runner 反向校验。完整结果与五个 LLVM 间歇 `0xC0000005` 样本已回填 backlog B-163。

后续恢复顺序固定为：

1. P2.2 对剩余 9 个 shared-positive gap 做根因聚类并修复；唯一 check-only gap audit #222、module-qualified effect evidence 与 default effect body pipeline 已闭合，matrix 当前 69 covered / 10 known-gap / 3 manual；LLVM-only `default_effect_topo` 保留为退役证据，不为即将删除的后端扩修。
2. 把三个 manual 项变成自动门或删除死面：`HStmt::Dup` 无生产者、C `#line`、extern-handle RC 结构断言。
3. 对抗 review + 全量 C/LLVM/diff/RC/self-compile 固定点；只有认证门闭合后才创建 `llvm-c-backend-final` tag 并进入删除清单。

当前禁止把 matrix 的 wiring PASS 当语义执行 PASS；`--suite parity` 输出已明确标注这一点。LLVM tag/删除、dist-c anchor 与 CI bootstrap 尚未开始。

## B-163 Phase 2 Set 语义选择（2026-07-27）[决策]

剩余的 `api_clone`、`set_struct_eq`、`set_ops_deep_eq` 同属 native Set 泛型 ABI 缺口：现实现只真正支持 Int/Str，`Set<Point>` 会被错当 `RingStr`。B-152 P4 原计划让 Set 复用纯 Ring Map，但当前公开约束是 `Set<T: Eq>`，而 Map 需要 `Hash + Eq`，derive Hash 又尚未落地。

- 方案 A：以纯 Ring List + Eq 实现 Set，保留现有 `Set<T: Eq>` 兼容性，代价是线性复杂度且偏离“复用 Map”的旧计划。
- 方案 B：按旧计划复用 Map，把 Set 收紧为 `Hash + Eq`；需同步提前 derive Hash 或接受现有 `Set<Point>` 源码不兼容。

该决策只阻塞 Set 三项；handler autobox、abort effect arm、struct pattern、tuple equality 与 Iterator 可独立继续。
