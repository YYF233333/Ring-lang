# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-099 native 自托管 LLVM 后端（2026-06-16 第二轮）

### 1. codegen-level extern-type RC guard 导致 ~20GB OOM regression [通知]

**问题**：前轮 B-099 worker 在 codegen_llvm_stmt.ring（Drop/Dup）和 codegen_llvm_expr.ring（gen_clone）加了 `type_contains_extern_handle` guard，跳过包含 extern type 的值的 ring_drop/ring_dup/Clone emit。该函数递归检查类型树，导致 `LlvmCtx`、`Map<Str, LLVMValueRef>`、`ExternFnInfo` 等容器类型全部被排除——这些容器本身是 Ring 分配的（有 RC header），必须 drop。结果 native ring.exe 自编译从 ~700MB 暴涨到 19.5GB+（机器 OOM 硬重启）。

**根因**：guard 用了 `type_contains_extern_handle`（递归）而不是 `is_extern_handle_type`（直接）。容器类型不应跳过 drop——只有直接 extern type（LLVMContextRef 等裸 opaque ref）需要跳过。

**修复**：删除三处 codegen-level guard，回到 B-089 行为。extern type 的 RC 防护全靠 runtime guard（ring_dup/ring_drop 中的 tid/rc 校验，也是 B-099 引入的，这层没问题）。验证：自编译 697MB / 879 E2E 全绿。

**过程违规**：该 guard 不在 B-099 spec 要求范围内（spec 只要求 runtime 级终验），worker 自行引入"defense-in-depth"未经讨论——违反「决策必须讨论」。

### 2. B-099 剩余 scope 待讨论 [通知]

codegen-level guard 删除后，B-099 的 extern-type RC 防护策略退化为 runtime-only（tid/rc 校验 in ring_dup/ring_drop）。这对 JS-target 自编译已验证安全（697MB，879 E2E）。但 B-099 的终极目标——`ring.exe build compiler/main.ring --target=llvm`（native 自编译 LLVM 目标）——尚未测试。该路径实际执行 codegen_llvm 函数，会碰 LLVMValueRef，届时 runtime guard 是否足够（还是需要更精确的 codegen-level 排除策略）需要 Discussion 拍板后再动。

### 3. Windows OOM 无 OOM killer — 高内存 subagent 需安全措施 [通知]

subagent 跑 build_native.ps1 触发 OOM，Windows 不像 Linux 有 OOM killer 精准杀进程——整台机器冻死需硬重启。已在 memory 记录反馈，后续高内存任务（build_native、self-compile）应加内存监控或由用户手动在独立终端跑。

## B-097 LLVM custom effect handler parity（2026-06-16）

### 1. Custom-abort 并非 parity gap，而是新功能 [通知]

B-097 spec sub-item 1 声称 JS 后端有通用 custom-abort 支持（"EffectAbort + effect-name 匹配"），LLVM 应跟进。实测 JS 后端 `codegen_expr.ring:1451` 硬编码 `effect_name == "fail" && h.op_name == "raise"` 判断 abort——只有 `fail.raise` 走 abort 路径，其他 effect 无 abort 支持。两后端行为一致，不存在 parity gap。如需通用 custom-abort，应作为新功能单独立项。

### 2. Delegate stub 不转发 custom effect evidence [通知]

llvm_diff 测试发现：当 trait 方法签名带 `with {CustomEffect}`，delegate stub 正确接收 evidence 参数但不转发给内层 impl 方法调用。这是 JS 后端的已有问题（生成的 `__Wrapper_Trait_method` 有 `__ring_ev_X` 参数但调用 `__Inner_Trait.method(self.inner)` 时漏传），非 LLVM 特有。变通方案：在 trait 方法 body 内调用 free function（evidence 通过正常参数传递），不在 delegate 签名上直接标 custom effect。已在 `delegate_custom_effect.ring` 测试中使用此模式。

