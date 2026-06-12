# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-104 D1 Stage 3 收尾（2026-06-12）

- **[通知] #150 修复落地（runtime dup + fold 全链退役）**：`ring_list_fold` 空表路径 `ring_dup(init)`（`0f80b42`）+ `is_arg_returning_call` 谓词从 hir.ring 整个删除（非仅清空成员——空成员谓词是死代码，三处调用点一并清理）+ `anf_arg` 删除、Call 实参统一 `anf_operand` + verifier `x-fold-arg` 豁免类退役（`735a669`）。自校验 0 errors 不变、豁免 1292→1289（x-fold-arg 原 3 处现已被材料化+drop 正常记账）。验证全绿：JS 818（817+1 新例）、llvm_diff 70 ×3、新例+real_program ASan gating 干净、dist-llvm 重编 exit 0。
- **[通知] 「map/set fold 同形」核实结论：不成立**。`ring_map_fold`/`ring_set_fold` 符号在 ring_runtime.cpp 不存在；`Map.fold`/`Set.fold` 有 checker 类型（builtins.ring + MAP/SET_HOF_METHODS）、JS 后端 `gen_hof_fold` 正常，但 native 侧 `method_to_runtime` 无映射 → 落 "unknown method" panic-stub（#138 家族，已追加精化到该条）。故 #150 的 dup 修复只需 `ring_list_fold` 一处即闭环。
- **[通知] 新发现 runtime HOF 内部泄漏类 → audit #152 [open]**：#150 贴码时发现 runtime HOF 循环内三类临时从不 drop——① filter/any/all/find/find_index 的谓词 Bool box（每元素 1 BOOL）② fold 非空路径中间累加器（每 fold 泄 n-1 个）③ map/set for_each 每 entry 合成的 fresh STR key（每 entry 1 STR）。全部 leak-direction、HIR/verifier 不可见（runtime 内部层，比 codegen 级边界更深一层）。编译器自编译重度使用这些 HOF → 疑似 BOOL 67.8M / STR 86.5M residual 的未归因部分（#151 之外的下一个候选归因类）。未动手（非本 spec 范围 + 修复面大需独立 wave ×3）。
- **[通知] 退役方式取舍**：spec 说「分类表清空」，实际执行为谓词整体删除——保留一个恒 false 的空成员谓词 + 三处 `== false` 调用点违背「不留过期注释」精神；hir.ring/perceus.ring 各留一段简短退役注记指向 git history（W1 证据块全文在 pre-2026-06-12 历史可查）。`is_fresh_owned_bool_value` 的 Call 分支随之只剩 borrow-returning 排除——其正确性依赖「fold 全路径 owned」，已由 runtime dup 成立。
- **[观察] dist-llvm 自编译既有 970 条 "unknown function 'LLVM*'" warning**：base 状态实测同样 970 条——非本次改动引入，属 dist-llvm 构建的既有现象（llvm_ffi extern fn 在 JS-host 编译路径下的输出形态），不另立项。
