# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-142 apply_subst 类函数借用返回审计

### 1. 审计覆盖范围与残留 [通知]

审计覆盖 13 个函数/5 个文件（env.ring×4, andor_lower.ring×3, dict_lower.ring×3, perceus.ring×3）。所有「直接返回 RC-managed 函数参数」的 match 分支已改为解构+重构新值。

**残留**：`perceus.ring: anf_lvalue` 的 `_ => expr` wildcard 保留——该函数仅处理 lvalue（Ident/FieldAccess/IndexExpr），Ident 已显式重构处理，wildcard 捕获的 25+ 个 HExpr 变体在 lvalue 上下文中不可达。如果未来编译器增加新的 lvalue 形式（如 tuple destructure assignment），需要回来补充显式 arm。

### 2. Effect 枚举 wildcard 消除 [通知]

`apply_subst_effect` / `apply_subst_effect_map` 的 `_ => e` 原来只捕获 `Effect::IoEffect`（其余 FailEffect/MutEffect/CustomEffect 已显式处理）。改为 `Effect::IoEffect => Effect::IoEffect` 后，穷尽性检查确保未来新增 Effect 变体时编译器会报错——比 wildcard 更安全。

### 3. HDecl wildcard 展开 [通知]

`al_decl` / `dl_decl` 的 `_ => d` 展开为 7 个显式 arm（Struct/Enum/Effect/ExternFn/ExternType/TypeAlias/Sig）。同样地，未来新增 HDecl 变体时穷尽性检查会强制处理——比 wildcard 更安全。

<!-- B-139 #1(纯信息) #2(→B-141) 已处理 2026-06-24 -->
<!-- B-140 #3(纯信息) #4(→B-142+design.md约束) 已处理 2026-06-24 -->

<!-- B-099 UAF 决策已处理（2026-06-24）：用户拍板 (C) 先绕后修。Workaround commit f8302d8，根因修复排 B-140 [P1]。 -->

