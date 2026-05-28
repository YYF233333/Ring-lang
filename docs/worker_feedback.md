# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-011 LLVM Wave 3a+3b

### 1. 多文件 --target=llvm 已接通 [通知]

`compile_project_llvm()` 新函数处理多模块编译。模块前缀通过 `llvm_mangle_fn_with_prefix` 处理。

### 2. ring_runtime.cpp 新增约 30 个函数 [通知]

path/file/集合/parse/字符串方法补全。总行数 ~650 → ~1100。

### 3. Bootstrap blocking issue: gen_field_access 对非 StructType panic [通知]

for-in 循环中 iterator 类型可能是 EnumType，`gen_field_access` 假设总是 StructType。下一 Wave 首要修复。

### 4. Const 声明实现为零参 getter 函数 [通知]

uniform boxing 下全局 const 需要 malloc，通过零参 getter 函数实现（首次调用初始化+缓存）。

### 5. 跨模块 find_fn_by_suffix fallback [通知]

后缀匹配 fallback 不精确（理论上可能有跨模块同名冲突），但编译器源码中未出现此问题。

