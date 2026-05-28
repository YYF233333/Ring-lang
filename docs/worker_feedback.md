# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-011 LLVM Bootstrap Debugging (post Wave 3b)

### 1. N-API addon 已构建 [通知]

从 Scoop LLVM 22.1.6 二进制分发构建 N-API addon（`compiler/llvm-addon/`，.gitignore）。需要手动下载 LLVM-C headers（`Core.h` 等）到 Scoop 安装目录，因为二进制分发不含开发头文件。关键：`napi_enumerable` 属性让 `Object.assign(globalThis, addon)` 生效。

### 2. Lambda 生成器定位修复（根因）[通知]

`gen_lambda` 在生成 lambda 函数体后未正确恢复 builder 插入点。修改前用 `LLVMGetInsertBlock(ctx.builder)`（返回 lambda 内的 block），改为保存+恢复 `saved_bb`。此 bug 导致 ~1600 个 basic block 缺失 terminator。

### 3. Match 表达式 IR 结构重写 [通知]

- **Enum match wildcard**：改用 switch default block，不再为所有 variant 添加重复 case
- **If-else chain（非 enum match）**：tuple/wildcard/binding arm 正确连接 block 链
- **default_bb 始终填充 panic+unreachable**，确保所有 block 有 terminator

### 4. 短路运算符 PHI 修复 [通知]

`gen_and`/`gen_or` 的 `false_val`/`true_val` 生成移到分支前，确保 PHI 节点是 merge block 的首条指令。

### 5. 剩余 3 个 verify error（不阻塞 .o 生成）[观察]

"Instruction does not dominate all uses" — lambda 捕获变量定义在 for 循环体/match arm 的 basic block 中，但捕获代码在不同 block。根因：alloca 应放在函数 entry block（LLVM 标准做法）。当前不影响 .o 生成但可能在运行时出错。

### 6. 缺失的 List HOF 映射 [通知]

补充 `ring_list_any/all/find/flat_map/enumerate` 运行时函数声明和 method_to_runtime 映射。`.sort()` 无参调用映射到 `ring_list_sort_default`。

### 7. 验收状态 [通知]

- `node compiler/dist/main.js build compiler/main.ring --target=llvm` 不 panic，生成 1.5MB `main.o`
- 715 E2E 测试全部通过
- LLVM IR: 212K 行，1560 个函数，930 个 extern 声明

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

