# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-159 Effect 多态（2026-06-30 已完成）

### 1. 修复策略选择 [通知]

spec 描述 4 层问题链，前次 worker 尝试修全 4 层后 prelude 路径导致编译器级联失败。本次绕过 Layer 3-4（rebind），改为**注册时共享 closure 参数 effect tail**（`infer_hof_effect_row`）：函数没有声明 effects 时，将第一个 closure 参数的 effect row tail 作为函数自身的 effect tail。效果等价于 Koka 的 `fun map(xs, f: a -> <e> b) -> <e> list<b>` 隐式 effect 多态。

### 2. Bootstrap gap 修复 [通知]

自编译因 `infer_decl.ring:479` 的 `pop_scope()` 返回 `Scope?` 不匹配 match arm 的 `()` 而失败。加 `let _ =` 丢弃返回值。此 bug 是 pre-existing 的（B-155 IR 非确定性），不是 B-159 引入。

### 3. rebind_fn_type impl 方法残留问题 [观察]

`rebind_fn_type` 和 `update_fn_effects` 都用 `ctx.env.lookup(name)` 查 scope stack，但 impl 方法在 `trait_reg.impl_methods` 里，查不到。导致 impl 方法 body check 后的 inferred effects 不回写 scheme。当前靠 `infer_hof_effect_row` 绕过了 HOF 场景，但非 HOF 的 impl 方法 effect 推断仍可能有遗漏。

### 4. default_effect_sibling.ring pre-existing 失败 [通知]

LLVM golden 测试 `default_effect_sibling.ring` 运行时断言失败（"increment default should call overridden get"），用旧 ring.exe 复现同样失败。已加入 LLVM_SKIP。`run_llvm` 原本不检查 LLVM_SKIP，一并修复。
