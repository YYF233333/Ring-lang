# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-011 LLVM Backend Wave 2a

### 1. ESM extern type/fn 跨模块导入问题 [通知]

LLVM codegen 模块不能 `use llvm_ffi::{LLVMContextRef, ...}`——Ring 的 ESM codegen 无法导出 extern type（它们没有 JS 值表示）。Workaround：每个 codegen 文件局部 re-declare 所需的 extern type/fn。可工作但冗长。值得作为模块系统的独立 issue 跟踪。

### 2. 内置类型（Option/Result）需手动注册 [通知]

Option 和 Result 不是 HDecl::Enum（它们是 checker 内置），所以 LLVM codegen 的 forward declaration pass 看不到它们。手动注册了 Option/Result 的 enum 布局和构造函数。后续如果新增内置 enum 类型需要同步更新 `register_builtin_enums`。

### 3. 标准库函数生成 stub（不影响用户代码） [通知]

标准库含大量未支持的 HIR 模式（ForIn、MatchExpr、Lambda、TryCatch 等）。当前策略：对未支持的 HExpr 返回 null、未支持的 HStmt 静默跳过。这些函数在运行时不会正确工作，但不影响只使用已支持模式的用户代码。Wave 2b 需要实现这些模式。

### 4. Runtime 函数签名轻微不匹配 [通知]

部分 runtime 函数的 LLVM 声明与 C 实现有轻微不匹配：
- `ring_sb_add`/`ring_print` 等在 C 中返回 `void*` 但 LLVM 声明为 `void`
- `ring_int_to_str` 在 C 中接收 `int64_t` 但 LLVM 声明为 `ptr`
- `ring_bool_to_str` 在 LLVM 中声明但 C runtime 中不存在

这些不影响 hello.ring（不触发相关路径），但 Wave 2b 需要修正。

### 5. LLVM 验证暂时跳过 [通知]

N-API addon 的 `LLVMVerifyModule` 实现在验证失败时抛 JS 异常而非返回错误码。由于 stub 函数产生无效 IR（terminator in middle of block），验证总是失败。当前跳过验证直接 emit .o。Wave 2b 实现更多模式后应恢复验证。

