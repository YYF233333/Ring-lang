# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## Audit 修复 batch（2026-06-26）

### 1. #211 collect_local_calls GenericType 分支 [通知]

新增 `Type::GenericType { base, .. }` 分支，从 `base` 中提取 StructType/EnumType 名做 qualified lookup。`TypeVar` 接收者仍为 unqualified fallback——这是已知限制（需要泛型方法名恰好与带 effect 的顶层函数同名才触发）。

### 2. #210 fn_mut_params qualified key [通知]

采用"双 key"策略：`check_fn_decl` 插入的 unqualified key 保留（intra-module 使用），额外插入 qualified key 供 exports.ring 跨模块查找。不改动 exports.ring 侧。

### 3. #207 catch arm guard binding 顺序 [通知]

修复后有 guard 的 catch arm 从 if-else 链改为独立 if 块——确保 guard 失败后正确 fallthrough 到下一个 arm。无 guard 的 arm 保持 if-else 链。新增 3 个回归测试。

### 4. #203 discard 函数去重 [通知]

唯一定义保留在 `codegen_llvm_expr.ring`（`pub fn`）。`codegen_llvm.ring` 和 `codegen_llvm_decl.ring` 通过 `use` import；`codegen_llvm_stmt.ring` 因循环依赖用 `extern fn` 前向声明（与 `gen_llvm_expr`、`unbox_to_i1` 等已有函数同模式）。

