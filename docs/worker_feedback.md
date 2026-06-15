# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-131 字符串编码模型 design-probe

### 1. 推荐 UTF-8 字节串（Rust 模型），待拍板 [决策]

**现状**：design.md §1.7.1 已写入 227 行完整分析。推荐 A（UTF-8 字节串），B（Python code-point 模型）否决理由：O(n) len 不可承受（自编译 2-5x 退化）+ 需 ByteStr 补位违反公理⑧。

**待决策**：
- (A) 接受推荐，选 UTF-8 字节串模型——立实现 backlog items（6 阶段，P0-P6）
- (B) 选 code-point 模型——需重新评估实现方案
- (C) 需要更多信息再决定

## B-128 Set for-in 检测加固

### 1. 同类 `name ==` 模式在其他位置也存在 [通知]

B-128 修复了 `codegen_llvm_stmt.ring` 中 Set for-in 的 `name == "Set"` 裸检查，加固为 `name == "Set" && type_params.len() == 1 && fields.len() == 0`。agent 发现同样的 `name == "X"` 无结构校验模式存在于：`codegen_llvm_ctx.ring`（get_builtin_typeid）、`codegen_llvm_expr.ring`（method_to_runtime / is_int_set / is_int_keyed_map）、`types.ring`（is_set_type / is_map_type / is_list_type）。当前零冲突（无同名用户类型），但模式一致性可考虑统一加固。

## B-131 字符串编码模型 design-probe

### 1. 推荐 UTF-8 字节串（Rust 模型），待拍板 [决策]

审计发现：LLVM 按字节（`char_at` 返回无效 UTF-8 单字节），JS 按 UTF-16 码元（`"😀".char_at(0)` 返回 high surrogate）。design.md 写的 code point 语义**两边都没实现**。不论选 A/B，`char_at` 当前行为都是 bug。当前 llvm_diff 全 ASCII 所以分歧不可见。

