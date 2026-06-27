# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## Audit 观察报告（2026-06-27）

### 1. [观察] ring_try（栈分配 catch frame）存在但 codegen 未使用

**现状**：`ring_runtime.cpp:2481-2499` 定义了 `ring_try`，使用栈分配的 `RingCatchFrame`（零堆开销）。但 LLVM codegen（`codegen_llvm_expr.ring:5288-5334`）仍使用 `ring_catch_push`/`ring_catch_pop`（每次 try/catch 堆分配+释放一个 RingCatchFrame）。
**为什么值得注意**：ring_try 的栈分配方案更高效，且 ring_catch_push 虽然不泄漏（codegen 确保两条路径都调用 pop），但堆分配是不必要的开销。如果 codegen 改用 ring_try 模式（内联 setjmp + 栈帧），可消除每次 try/catch 的 malloc/free。

### 2. [观察] __ring_raise_fail 标记为 "Effect workaround"

**现状**：`codegen_llvm.ring:332` 注释 "Effect workaround"。`__ring_raise_fail` 是 `ring_raise` 的薄包装，供 parser.ring 的错误路径直接调用运行时 raise。
**为什么值得注意**：标签暗示这是临时方案，但 parser 直接调 runtime raise（绕过 effect 系统）可能是有意设计——parser 需要在 effect 基础设施建立前就能报错。应明确记录为 intended escape hatch 或列入清理计划。

### 3. [观察] 编译器 6 个 >2000 行大文件概览

**现状**：codegen_llvm_expr.ring (5634)、perceus.ring (2473)、codegen_llvm_decl.ring (2367)、infer.ring (2285)、parser.ring (2189)、infer_decl.ring (1998)。codegen_llvm_expr 是次大文件的 2.3 倍。
**为什么值得注意**：除 codegen_llvm_expr（已进 audit-report #235）外，其余文件虽大但职责相对聚合。perceus 和 parser 拆分收益不明显。观察记录，不建议立即行动。

### 4. [观察] extract_decl_export 函数签名 14 个可变参数

**现状**：`exports.ring:40-56` 的 `extract_decl_export` 有 14 个 `mut Map/Set` 参数——极难阅读和维护。
**为什么值得注意**：Ring 当前没有 struct 字面量在条件位置的语法限制解决方案，打包为 ExportCollector 结构体后需要在每次调用时构造。如果语言层面支持 struct 构造器在调用位置，这个问题会更易解决。

### 5. [观察] get/find/lookup/resolve 四动词前缀混用

**现状**：全编译器中 `get_*` 18+ 处、`find_*` 12+ 处、`lookup_*` 5+ 处、`resolve_*` 31+ 处，无统一语义边界。
**为什么值得注意**：不影响正确性但增加阅读认知负担。建议约定：get = 必得（panic if missing）、find = 返回 Option、resolve = 可失败+有副作用、废弃 lookup。

## B-125 Wave 1 执行报告（2026-06-27）

### 1. [通知] Wave 1 实施——requires 机制已 enforce，非"解析未检查"

**实施前假设**：Discussion 和 codebase scan 认为 `mod requires` 是"已解析但未检查"。实际 `infer_decl.ring:73-147` 的 `check_mod_decl` 已完整 enforce `required_effects`（`check_capability` 函数，E0405 错误码）。Wave 1 只需加 `UnsafeEffect` variant + `ctx.mod_unsafe_allowed` flag，现有 capability 机制自动生效。代价比预期小。

### 2. [通知] unsafe 不可被 handle 的实现方式

`infer.ring:2325` 在 handle-expr 的 effect 过滤中，`UnsafeEffect => true`（始终保留 = 不被任何 handler 消除）。这保证了 unsafe 只能被 `unsafe {}` 块 discharge，不能被 `handle` 绕过。如果未来需要改变这一行为（极不可能），改这一行即可。

### 3. [通知] e2e 测试发现两个 pre-existing Map runtime crash

`map_hof.ring` 和 `map_ufcs_bug.ring` 在 ring.exe 下 access violation（exit 3221225477）。非本次改动引起——已加入 LLVM_SKIP。可能与 Map 的 std::unordered_map 交互有关，B-152 RIIR 会重写 Map 底层。

### 4. [通知] fixpoint rebuild 需要两次编译

merge 后首次 rebuild dist-llvm/ 产出与 worktree 带来的版本不同（符合预期——worktree 基于旧 base 编译，main 上多了 B-154 cli.ring 变更）。第二次 rebuild 与第一次 0 diff = 收敛。B-155 IR 非确定性（ring.exe 自编译）不影响 JS 编译器 rebuild。

