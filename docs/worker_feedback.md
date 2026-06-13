# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## Wave C (2026-06-13)

### 1. B-080 Int/Bool tagged pointer [通知]

Codegen inline tag/untag (`shl+or+inttoptr` / `ptrtoint+ashr`) 替换所有 ~20 处 `ring_box_int`/`ring_unbox_int` 运行时调用。Runtime 侧 `ring_dup`/`ring_drop` tagged 早返回 + `ring_box_int`/`ring_box_bool` 改返回 tagged（系统中不再有 boxed Int/Bool）。

**Merge 后发现 14 个 llvm_diff 失败**——runtime 的 Eq/Ord/Map/Set closure 函数（`ring_cl_eq_int`、`ring_map_int_get` 等）直接 `*(int64_t*)ptr` 解引用 tagged pointer → access violation。修复：全量替换为 `ring_unbox_int()`/`ring_unbox_bool()`（已支持 tagged）。修后 76/76 ×3 全绿。

### 2. B-080 遗留待验 [通知]

以下验收项需用户在场时补做：
- alloc-stats 量化（tid0 INT / tid2 BOOL 应归零）
- native 自编译耗时对比（基线 492s @O2）
- double-bootstrap 字节一致
- ASan gating
