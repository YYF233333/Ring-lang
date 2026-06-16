# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-099 native 自托管 LLVM 后端（进行中，2026-06-16）

### 1. 简单文件 native 编译已跑通 [通知]

`ring.exe build test.ring --target=llvm` → `.o` → link → 运行输出 "hello from native llvm"。B-099 codegen 核心（ExternFn C-ABI declare + call-site marshalling）+ 三层 extern-type RC 排除修复全部落地。879/879 E2E 测试全绿。

### 2. extern-type RC 排除是本次最大发现 [通知]

**根因**：Perceus 的 branch-balancing Dup/Drop 和 escape-clone（HExpr::Clone）对 extern type 值（LLVMValueRef 等）emit ring_dup/ring_drop。ring_dup 写 ptr-8（RC header），ring_drop 读 ptr-4 + free——对 LLVM opaque ref（无 Ring 分配 header）= 任意内存写入 → 静默损坏 → 后续 LLVM-C 调用 crash。

**修复三层**：(1) codegen_llvm_stmt: HStmt::Drop/Dup 检查 ty, extern type 跳过；(2) codegen_llvm_expr: gen_clone 检查 inner type, extern type 跳过；(3) ring_runtime: ring_dup + ring_drop 加 tid+rc 双重 guard（defense-in-depth，catch closure capture 等残余路径）。

### 3. 下一步：自编译 --target=llvm [通知]

简单文件已通，但 `ring.exe build compiler/main.ring --target=llvm`（自编译）未测试。这是 B-099 的终极验收——native 自产 native 代码。下个 session 继续。

### 4. ListToDataAndCountI64 ring_list_len 类型不匹配 [通知]

仅影响 LLVMConstArray2，低频。待自编译测试时核实。

### 5. build_native.ps1 已加 LLVM-C 链接 [通知]

`-LD:/software/Scoop/apps/llvm/current/lib -lLLVM-C`，路径硬编码（同 binding.gyp）。

