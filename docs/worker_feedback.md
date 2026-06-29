# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-152 P0 StringBuilder RIIR (2026-06-29)

### [通知] 发现的编译器 bug

1. **prelude impl 方法中 `return ()` 导致整个 impl 静默丢失**：std/*.ring 的 impl 方法体中使用 `return ()` 会导致 `check_prelude_decl` 抛 fail。由于 checker.ring 的 prelude 加载用 `catch { _ => none }` 吞掉了错误，整个 impl block 的所有方法都找不到（E0305）。workaround 是用 if-else 替代 early return。这是个 checker bug，影响所有在 std/ 中写 Ring impl 方法的场景。建议追踪为 backlog item。

2. **`get_or_declare_runtime_fn` 与 Ring 编译函数同名时 LLVM 名字冲突**：当 Ring 编译的函数（如 `ring_string_builder`）已存在于 LLVM module 中，再用 `get_or_declare_runtime_fn` 声明同名但类型不同的函数，LLVM 会加 `.XX` 后缀，导致 undefined symbol。gen_string_interp 因此继续使用旧 C++ ring_sb_* 函数。

### [通知] 实现决策

- **保留旧 ring_sb_* C++ 函数**：gen_string_interp 仍用 C++ 的 ring_sb_new/add/to_str 做字符串插值（避免跨模块查找问题）。用户代码中 `sb.add()` 等走 Ring method dispatch。这意味着字符串插值和显式 StringBuilder 用法走不同路径，但行为完全一致。
- **Ptr<Int> 作为 byte buffer 类型参数**：Ring 没有 U8/Byte 类型，Ptr<Int> 的 Int 类型参数在 LLVM 层被擦除为 `ptr`，语义上是 byte buffer pointer。
- **mut self 破坏性变更**：StringBuilder 从 extern type 变为 Ring struct 后，mutation 方法需要 `mut self`，调用方需 `let mut sb = string_builder()`。影响所有 StringBuilder 用户代码。

