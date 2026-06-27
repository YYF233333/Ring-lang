# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-125 Wave 2 执行报告（2026-06-27）

### 1. [通知] Ptr 方法 codegen 采用混合方案：runtime + 内联 LLVM IR

alloc/dealloc/copy 走 runtime 函数（涉及 malloc/free/memmove），read/take/write/offset/cast/addr 内联 LLVM IR（1-2 条指令，消除函数调用开销）。

### 2. [通知] ring_raw_alloc 做了 zero-init（memset 0）

设计说"返回未初始化内存"，但实现做了 `memset(p, 0, count * 8)`——防御性选择，未初始化读取得到 null 而非 garbage。如果将来性能敏感，可加 `alloc_uninit` 变体。

### 3. [通知] read() 对 pointee 类型做条件 dup

基本类型（Int/Float/Bool/Unit/Ptr）不 dup，复合类型（Str/List/Struct 等）dup。避免对 tagged integer 做无意义的 ring_dup 调用。

### 4. [通知] 1 个 pre-existing flaky test

`impl_bounds.ring` 间歇性 runtime crash。与 Ptr 改动无关，多次跑约 1/3 出现。

### 5. [通知] Wave 3 extern fn 签字推迟（用户拍板 C）

所有 327 个 extern fn 声明分布在 19 个文件顶层，无 `mod` 块包装。当前无文件级 `requires` 语法，强行迁移需 (A) 加 parser 语法 或 (B) 包装全部文件——工作量/风险不匹配。用户拍板推迟，extern fn 签字检查不进 B-125 scope，后续单独立项（需先设计文件级 `requires` 语法）。

## B-002p1 执行报告（2026-06-28）

### 1. [通知] Drop 基础设施大量已存在——实现比预期简单

`ring_drop_<TypeName>` codegen、`ring_register_drop(typeid, fn)` runtime、`HStmt::Drop` HIR 节点、`drops_for()` scope-end 插入——全部已在编译器中工作。B-002p1 的核心新增只有三件事：(1) 注册 Drop trait + 约束检查，(2) move checker 线性扫描，(3) codegen 中 user drop body 调用插入。535 行改动，14 个文件。

### 2. [通知] Move checker 采用保守策略——Phase 1 不做分支分析

`check_drop_moves()` 在 HIR 上线性扫描，任一分支中的 move 标记变量为 consumed，后续所有使用均报 E0801。不区分 if/else 分支条件 move（如"if 分支 move 了但 else 没有"不报不同错误）。这对 Phase 1 足够——RIIR 容器代码是线性的，不需要分支敏感的 move 分析。

### 3. [通知] Perceus Drop 类型 no-dup 实现：rc_escape 跳过 Clone wrapping

`perceus.ring` 的 `rc_escape()` 中，Drop 类型跳过 Clone-wrapping（`is_user_drop_type` 检查）。同时 `rc_block_inner()` 预扫描语句识别 Drop 类型 move，排除被 move 的变量不做 scope-end drop（避免 double-free）。

### 4. [通知] Drop 方法 effect 约束实现为推断后检查

`check_impl_decl` 中，在 drop 方法体推断完成后检查 effect row 是否含 FailEffect——如果有，报 E0803。这意味着 drop 方法体内任何可能 fail 的操作（包括间接调用带 fail effect 的函数）都会被捕获。允许 io effect（flush/log/close 场景）。

### 5. [通知] impl_bounds.ring flaky crash 持续

多次 e2e 运行中 `impl_bounds.ring` 约 1/3 概率 runtime crash（access violation）。B-002p1 改动前后均出现，与 Drop 无关。可能是 trait dictionary dispatch 的间歇性内存问题。
