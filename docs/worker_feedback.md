# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-011 LLVM Native Backend — Wave 1a (llvm_ffi.ring)

### 1. C stdlib 函数从 FFI 文件中省略 [通知]

Agent 决定省略 setjmp/longjmp/malloc/free 的 Ring extern fn 声明。理由：这些不是 LLVM-C API，不会通过 N-API addon 调用——它们会被 LLVM codegen 声明为 LLVM IR 中的 extern function（通过 `LLVMAddFunction`）。合理判断。

### 2. LLVMBool 映射为 Int 而非 Bool [通知]

LLVM-C 的 `LLVMBool` 是 `int`（非 C++ `bool`）。Agent 选择映射为 Ring `Int` 以避免 N-API 层额外 bool↔int 转换。这与 spec 一致。

### 3. 总计 87 个 extern fn（spec 预估 ~80）[通知]

比预估多 7 个函数，主要是 enum predicate 值的文档注释中列出的辅助信息。覆盖了 llvm-migration.md 列出的所有函数。

## B-011 LLVM Native Backend — Wave 1c (ring_runtime.cpp)

### 4. 文件 653 行（spec 预估 300-400 行）[通知]

实际实现比预估大约 60%，主要因为：(a) 更完整的函数覆盖（76 vs ~70）；(b) 更多的边界检查和错误处理（如 ring_raise 无 catch frame 时的 guard）；(c) MSVC 兼容的条件编译（`#ifdef _WIN32`）。质量上没有问题。

### 5. ring_list_sort 使用指针比较 [通知]

`ring_list_contains` 和 `ring_list_index_of` 使用指针比较（`==`）。对于 bootstrap 阶段够用（编译器的 List 操作大多是结构性的），但 LLVM 后端正式上线后需要改为调用 Eq trait 方法。

## B-068 Borrow-by-default 设计文档

### 6. design.md section 3.2 预设系统与 lv0/lv2 的关系 [通知]

design.md 已有 section 3.2 用 5 个预设（none/api/review/audit/full）描述 formatter 标注等级。B-068 引入 lv0/lv2 作为 Git 存储模型。我将 lv0/lv2 作为新的 3.2.1 节插入（Git 存储模型），原有预设系统改为 3.2.2（扩展预设/查看模式），两者互补而非冲突。如果你认为应该完全替换旧预设系统，需要另行讨论。

## B-042 Perceus RC + 循环引用策略

### 7. B-042 验收标准中的代码部分归入 B-012 [通知]

B-042 spec 中的验收标准包含"Weak<T> 类型可用"等要求实际可工作代码的条件。由于 Weak<T> 依赖 Perceus RC（B-012），这些代码实现部分归入了 B-012 的 spec（已更新）。B-042 作为 design task 完成的是设计文档写入 design.md 7.9 + B-012 spec 更新。

