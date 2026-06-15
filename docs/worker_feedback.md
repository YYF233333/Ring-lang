# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-130 List.sort() Ord bound

### 1. Checker 不强制 trait bound on impl blocks [通知]

`List<NonOrdType>.sort()` 通过类型检查但运行时产生错误结果。原因：checker 不验证 `impl<T: Ord> List` 的 `T: Ord` bound 在调用点是否满足。这是**预存问题**——`impl<T: Eq> List.contains()` 也有同样行为。负面测试（`List<UserStruct>.sort()` → 编译错误）因此未能加入。应作为独立 issue 跟踪。

### 2. 三遍 bootstrap 才收敛 [通知]

Ring impl 生成的 `List_sort` 与 runtime 的 `List_sort` 同名冲突，需要三遍 bootstrap：第一遍用旧 dist 编译新源码（产出含冲突），手动 patch 中间 dist（删 runtime 中的 List_sort），再编译一遍得到稳定产出。worktree agent 自行解决了这个问题。

## B-132 穷尽性检查性能优化

### 1. 自编译 129s → 79s（-39%），未达 60s 目标 [通知]

四项优化：(1) Set<Str>→Map<Str,Bool>（O(1) lookup，主力提升 ~50s）(2) finite_type_ctors + type_is_recursive memoize (3) named_pattern_to_positional 用 List.set 替代 O(n) 重建 (4) specialize_row 用 slice 替代逐元素 copy。exhaustive 从 ~74s 降到 ~21s（-72%）。残余 ~58s 是其他编译器阶段（lexer/parser/checker/codegen），超出 B-132 scope。

### 2. 根因：Set<Str> 用 __ring_deep_eq 线性扫描 [通知]

最大性能杀手是 JS 后端的 Set<Str> 实现——每次 contains/insert 都走 __ring_deep_eq O(n) 线性扫描。改用 Map<Str,Bool>（底层 JS Map.has() O(1)）后一项就省了 ~50s。这个问题影响所有使用 Set<Str> 的编译器代码，但只在 exhaustive 中因为高频调用暴露出来。

## B-113 return in match arm

### 1. 实现完整覆盖所有编译器 pass [通知]

B-113 在 15 个源文件中新增 ReturnExpr 支持：AST/HIR/parser/infer/codegen(JS+LLVM)/perceus/verify_rc/andor_lower/dict_lower/scc/zonk/codegen_stmt。Perceus 的 return-path drop 逻辑（rc_expr）通过 Block 包装实现——先 escape 返回值到 tmp，执行 owned drops，再 ReturnExpr。实现与 HStmt::Return 的 RC 语义完全对齐。842/842 测试通过（+2 新测试）。

