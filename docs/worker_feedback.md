# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-089 G-b 深度调查（2026-06-15）

### 1. G-b 5 文件差异根因：native 跨模块 effect 传播断裂 [通知]

B-136 修了 Ring 层 Set 排序（generalize + codegen 传递闭包），G-b 从 32→5 文件差异但 5/44 未动。进一步调查确认：

- **直接 `fail.raise` 正常**：`check_fn_decl` 在 native 有 1 个 effect（代码中的 `fail.raise(CompileError{})`）
- **跨模块导入函数的 effect 丢失**：`merge_effects` 调 imported `unify`（unify.js 两后端完全一致、fail effect=2），但 native 推断 effect=0
- 所有 Ring 层 Set/Map 迭代已确认排序（fork 全量扫描 50+ 站点）
- codegen 传递闭包只覆盖模块内调用，跨模块 effect 只能靠 checker 推断

**结论**：native 的 `infer_call` 处理 imported function 的 TypeScheme 时读不到 FnType 的 effects。最可能：LLVM codegen 对 TypeScheme/FnType/EffectRow 的数据布局有 bug（字段偏移错位，native 运行时读 effect 字段拿到空值）。建议立项排查。

### 2. collect_local_calls 漏 HExpr::ReturnExpr [通知]

`codegen.ring:387-488` 的 `collect_local_calls` 有 `_ => {}` wildcard 静默丢弃 `HExpr::ReturnExpr` 和 `HExpr::Clone`——仅通过 return 表达式调用的本地函数不进 callee 图。两后端行为一致不影响 G-b，但是独立正确性 bug。

### 3. #141 W0001 = impl effect 传播限制的假阳性 [通知]

确认 `parse_use_decl` 可 fail（`expect` → `error` → `__ring_raise_fail`）。根因：impl 块内方法全部检查完才 update_fn_effects，中间方法的 fail effect 对后续方法不可见。给 extern fn 加 `with {fail}` 只解决直接调用者，间接链仍断裂。#141 是 checker 架构限制，非 S 级可修。

