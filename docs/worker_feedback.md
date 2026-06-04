# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## [通知] B-098 实现：clone-all-escape 的两处必要偏离 + 一处观察（GATE 1+2 全过）

实现 B-098 借用推断引擎（clone-all-escape）时，§7.11 字面模型对编译器自身的 **共享图（DAG）数据结构** 不成立（self_type 例子是树形，编译器 HIR/inference 是共享图）。为达成「无崩」并通过 GATE 1（native 自编 a_empty.ring EXIT 0）+ GATE 2（731×3 + 49×3 全绿），做了两处保守偏离，均属同模型范畴的 fix-forward，记录待 review：

### 1. [决策→已按安全侧处理] revert 清单中 `map_values`/`map_entries`/`.get` 的 `_opt` 不能撤 dup
§7.11/backlog #5 把 `ring_map_values`(1111)/`ring_map_entries`(1129) 及（隐含）`.get` 的 `ring_list_get_opt`/`map_get_opt`/`map_int_get_opt` 列入「撤销 ring_dup」。但它们**新建 owned 容器**（`ring_alloc` 一个 List 或 `ring_enum_some` 一个 Option）并把元素 push 进去——这里的 `ring_dup` 是「逃逸进容器=clone」的运行时内联，不是 read-borrow dup。撤掉会让 `drop_list`/`drop_option` 释放借用元素 → double-free。**已保留这些 dup**；只撤销**直接返回元素指针**的 `ring_list_get`(701)/`map_get`(1062)/`map_int_get`(1171)（供 IndexExpr / for-in / tuple-field / `m[k]` 用）+ `gen_field_access` struct 投影。建议 §7.11 revert 清单订正：区分「直接元素读取」（撤 dup）vs「owned 容器构造器」（保留 dup）。

### 2. [决策→已按安全侧处理] `let x = <Call 结果>` 不做 scope-end drop（保守泄漏）
clone-all-escape 假设「callee 的 return 会 clone 逃逸值 → Call 结果是 fresh owned」。但编译器大量函数返回**与入参/全局共享子结构**的值（如 inference helper 返回的 `InferResult.subst` 别名线程化的 `UnionFind`；`perceus_transform` 的 pass-through HIR 节点）。把这类 `let` 绑定 scope-end drop 会释放仍活跃的共享状态 → native 自编 UAF（GATE 1 实测崩 `infer_method_call`/`resolve_type_expr`，drop 抑制后即通过，确证 drop 诱发）。**已收紧 `is_droppable_init`：仅当 init 是 fresh 构造器（struct/variant/list/tuple/range/lambda/literal/string-interp）或 owner-bearing（→Clone）时才 drop；Call/EffectOp/BinOp/控制流结果一律不 drop（泄漏，crash-free）。** 仍远少于 always-own（读取不再 dup）。精确化（DAG 感知 ownership / 借用图分析）属 L3-reuse / B-096 范畴。这是 §7.11「逃逸点分类」中 fresh-temp move 假设的现实修正——编译器自编工作负载证伪了「Call 结果总是 fresh」。

### 3. [观察] native 自编时 ~247 条 `[rc-warn] Drop: variable not found in named_values`
perceus 对部分嵌套作用域 `let` 绑定发的 Drop，codegen 在该点的 flat `named_values` 里找不到（fail-safe 跳过 = 泄漏，非崩）。GATE 1+2 行为全正确（49 个 llvm_diff 断言输出 ×3 全过 + native 自编 EXIT 0）证明无「误命中错误 alloca」的静默错编。根因是 perceus 的 block 作用域模型与 codegen flat-named_values 生命周期未精确对齐（shadowed 名 / 分支局部）。属内存优化精化，非正确性问题，留后续（与 #2 的精确 ownership 一并做）。
