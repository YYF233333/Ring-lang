# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## LLVM 调试进展（2026-05-29）

### 1. 三类系统性 codegen 遗漏 [通知]

LLVM 二进制 crash 的根因：(1) extern_fn_to_runtime 只覆盖 10/24 个 builtin 函数，缺失调用生成 null；(2) method_to_runtime 缺少 Str.len/char_at/Option.unwrap_or 等；(3) imports_map 未填充，跨模块 aliased import 无法解析。已全部修复。

### 2. ring_list_any/all 返回类型不匹配 [通知]

C 函数返回 `void*`（boxed bool）但 LLVM 声明为 `i64`，导致 `has_errors()` 对所有文件误报有错。改为返回 raw `int64_t` 修复。类似问题可能存在于其他 HOF closure-based runtime 函数。

### 3. checker 阶段 crash 待查 [通知]

修复以上问题后 ring.exe 执行到 checkpoint ~35909（深入 checker/inference），仍有 access violation。不是缺失函数（panic fallback 未触发），是 LLVM IR 生成代码的逻辑问题。下一步需要精确定位 crash 函数。
