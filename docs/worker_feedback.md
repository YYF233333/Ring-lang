# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## LLVM 调试进展（2026-05-31，Session 3）

### 1. 环境恢复 [通知]

LLVM 从 D 盘搬迁到 C 盘后重建开发环境：
- scoop LLVM 20.1.8 → 22.1.6 升级
- N-API addon `binding.gyp` 路径修复，重新编译（`41e84a1`）
- LLVM-C 22 headers 从源码 sparse checkout 获取 + Config 文件生成（X86 target）
- 删除迁移 commit `771b4e4`，保留 `ring_runtime.cpp` debug 代码和 `worker_feedback.md` 为本地修改

### 2. Match exhaustion failure 根因定位 [通知]

**根因**：`apply_subst` 在构造复合 Type（如 FnType）时，`.map()` 返回的 `List<Type>` 被错误存入 `return_type` 等预期是 Type 的字段。下游再次调用 `apply_subst` 时收到 `std::vector<void*>` 而非 Type 指针，match 穷尽失败。

**证据**：
- `ring_debug_verify_type` 捕获到损坏的 "Type" 实际是 `std::vector`（`MATCH: this is a List`）
- List 内有 1 个合法 TypeVar（tag=7），确认为 `type_params` 列表
- 调用链：`expand_delegate_impls` → `check_fn_decl` → ... → `apply_subst`（crash at #261）
- 同一 bug 在 `--target=js` 和 `--target=llvm` 都触发

**Workaround**：在 LLVM codegen 的 enum match 入口插入 `ring_sanitize_type` 调用——若 scrutinee 非合法 Type（tag 超出 0-15），尝试将其当作 `std::vector` 并返回第一个元素。同时保留 `ring_debug_verify_type` 在 match.default 块作为 fallback 诊断。

### 3. 进展与下一个阻塞 [通知]

Workaround 生效后，ring.exe 突破 match exhaustion，前进了 ~800k chk 步。在 chk=350107 触发首次 recovery（IntType from list），随即在 chk=350108 遇到新 crash：

```
CRASH chk=350108 fn=list_get code=0xc0000005 fault_addr=0x0
caller (infer_method_call)
InferResult* 字段损坏（hexpr/subst/effects 为 ASCII 文本）
```

**分析**：`ring_list_get(null)` — 空 list 指针解引用。InferResult 结构体损坏（字段包含 ASCII 文本 "Users\Yufeng\Ying"），可能是栈或堆内存复用/越界写入。这可能是 List-as-Type bug 的连锁反应（sanitize 返回了正确的 Type，但上游某处存储字段时 GEP 偏移错误导致了后续内存损坏）。

**待查**：`infer_method_call` 中 InferResult 的构造。可能需要检查 LLVM codegen 中 method call 返回值的 struct 字段存储。

### 4. 基础设施记录 [通知]

- 当前 LLVM: 22.1.6（scoop，`C:\Users\Yufeng Ying\scoop\apps\llvm\current\`）
- N-API addon: 91 个 LLVM-C 函数导出，编译正常
- `llvm_ffi.ring` 声明的函数在 LLVM codegen 编译自身时会生成 "unknown function" 警告（因为这些 `extern fn` 需要通过 N-API addon 而非 LLVM IR 解析——不影响 ring.exe 的 checker 阶段）
