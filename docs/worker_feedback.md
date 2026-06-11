# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-104 D1 Stage 3（规则④ runtime overwrite/remove drop，2026-06-11）

- `[通知]` **规则④ 全量落地（git `3830d59`/`366add9`/`26aadf1`，3 commits，runtime-only，dist 零改动）**：① 覆写 drop——`ring_list_set`/`ring_map_set`/`ring_map_int_set` store-then-drop 旧值（insert 侧核实：.set/.insert value 实参是 perceus sink → escape-Clone dup / fresh 转移，容器持 +1，正是 drop_list/drop_map 终老结算的账）；② 删除/清空 drop——`ring_map_delete`/`ring_map_int_delete` drop 被删 value，`ring_list_clear`/`ring_map_clear`/`ring_map_int_clear` 逐元素/value drop 后 clear（clear = 内容的提前终老）；③ `ring_map_from`/`ring_map_int_from` 重复 key 时 drop 被覆盖的本 map dup（后者胜，与 JS `new Map` oracle 一致）。**Key 账对称性核实**：Map key 值内联（节点拷 std::string 内容 / 读出 int64，不存 RC 指针，insert 侧从不 dup key）→ 覆写/删除均无 key 账可结；`ring_set_clear`/`ring_set_int_clear` 审计为 RC no-op（值内联，#135 set_clone 同结论），只加注释。**rc>1 锁边界**：所有 drop 只递减共享者（`let saved = m[k]` escape-Clone / 自赋值 `xs.set(0, xs[0])` 调用点 dup / map_from 的 entries 自持账），llvm_diff 三个新用例（overwrite_drop_rc / remove_clear_drop_rc / map_from_dup_key）+ ASan 单链锁死。
- `[通知]` **#138 实测命中精化（非新 bug，已追加进 audit #138）**：`remove_clear_drop_rc.ring` 首跑撞出 `Set.clear` native panic-stub——`method_to_runtime` 基础表无 `"Set"/"clear"`，且 `is_int_set` 重定向表的 `"clear"` 条目是**死代码**（重定向仅在基础查找命中后运行）→ Set<Str>/Set<Int> 双双不可达。修复属 codegen 改动，按本 stage runtime-only 纪律未动手；用例将 Set.clear 移出 LLVM 锁面（RC 侧无账可结），JS 行为由 collection_clear.ring 覆盖。
- `[通知]` **计数器自编译对比（@2.382B allocs 同里程碑）**：Stage 2 终点 14.1%（live 336.3M）→ Stage 3 **14.1%（live 336.26M，逐 typeid 完全持平：STR 86.49 / BOOL 67.84 / CLOSURE 63.81 / OPTION 61.08 / TUPLE 31.89M）**——编译器自身几乎不覆写 map key / 不 clear 容器 / map_from 无重复 key，规则④ 对自编译收益 ≈ 0（任务预期内，如实记录）。其价值 = 用户面程序的语义正确性（hot-slot 覆写/clear 是用户代码常态）+ D2 verifier 的 runtime 侧账目完备前提。peak 15.19GB 处按监督 kill（@~2.58B allocs，G-a 墙未解属预期，余项 #151 dict 等）。
- `[通知]` **验证**：llvm_diff 66/67/68 ×3 全绿（每 commit 各 ×3）+ JS 743 全绿（零扰动，dist 未动）+ real_program ASan gating ×3 clean + 三新用例 ASan 单链 EXIT 0 + native harness 3/3。
