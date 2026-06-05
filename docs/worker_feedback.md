# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-102 native over-free 链终结（Worker Wave A，2026-06-05）

### 1. Phase 1 DONE — over-free 链（UAF 类）终结 [通知]

head-start worktree `dabccab` 的半成品修复（前次 worker 进程退出丢失、源码完好未提交）经 orchestrator 完整重验后落地，git `1a6b1d7`：
- **改动**：`perceus.ring` `rc_block_inner` owned 集改增量可见（binding 只从 `let` 起进 visible_owned 且可 scope-drop，新 `stmt_droppable_locals`；`owned.concat([])` 防别名；shadow 名不重复 drop）；`ring_runtime.cpp` `ring_list_extend` 元素 escape-dup。
- **根因**：codegen 把同名 local lower 成同一 function-entry alloca，旧的「整块 block_locals 一次性纳入 owned + 全部 scope-drop」在「该名未构造的分支」over-free（layer-3 = `resolve_type_expr` 读已 free 的 `TypeExpr`；layer-4 = owned 别名污染 sibling 分支；layer-5 = extend 共享元素双释放）。
- **验证全绿**：native `real_program.ring` EXIT 0 ×3 + 精确输出 + **ASan-clean（orchestrator 独立 ASan 跑确认，无 UAF/heap-overflow）**；JS 731×3 / llvm_diff 51×3 / double-bootstrap 字节一致。

### 2. self-compile 余下 blocker = OOM 泄漏，非 UAF（Phase 1 已尽） [通知]

native 自编译过去崩在 prelude（UAF），现在**清掉全部 prelude/parse/resolve UAF**，推进到对真实声明做 exhaustiveness check。ASan self-compile 一路无界分配、**全程无任何 UAF 报告**冲到 9GB（用户为护机器手动打断；抢救数据里更早的同源 run 是 ASan 8GB OOM-abort in `ring_alloc`）= 已知 G-a 泄漏（Type never-drop），正是 **Phase 2 A2 hash-cons** 的修复对象。**over-free（UAF）链已终结，泄漏归 Phase 2。**

### 3. 流程：后台 native-debug subagent 进程退出 → 抢救可行；native 工具链绑定环境 [通知]

后台 subagent 因外部进程退出丢失（非自身崩溃、未提交）。抢救路径有效：worktree 留有 ASan 实验输出（`tmp_asan_rp_err_*` 全空 = real_program clean；`tmp_selfasan_err` = self-compile OOM），head-start 源码完好在 `dabccab`，orchestrator cherry-pick 源码 + 独立重验 + 落地。**教训**：native-debug 任务依赖本地构建的 `llvm-addon`（gitignored），fresh worktree 无 addon 无法重编译验证——这类任务宜在主仓或「已含 addon 的 worktree」做，worktree 隔离对 native 任务不友好。ASan 构建配方已记入 backlog B-102（`-D_DISABLE_STRING/VECTOR_ANNOTATION` 避 `stl_asan.lib` 缺失 + asan DLL 入 PATH）。

### 4. Phase 2（A2 hash-cons）unblocked，但验证吃内存 [通知]

native 正确性已打通 → Phase 2（A2 Type intern → G-a 内存门）gate 解除。用户选择**停在 Phase 1 等 review**，Phase 2 留待专门推进。⚠️ Phase 2 验证（实测 peak RSS << 25.9GB）需跑 self-compile 到完成，**A2 生效前的测试运行可能再次冲高内存**（本机刚出现 9GB），需注意护机器。B-089 capstone：G-b/G-c 基本达成，**G-a 仍 gate 在 Phase 2**。
