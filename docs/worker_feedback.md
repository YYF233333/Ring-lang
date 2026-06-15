# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-089 G-b 全编译器 Map 迭代确定化（2026-06-15，Worker Wave A）

### 1. 排序覆盖面：62/62 站点全审计 [通知]

48 个新排序站点（加此前 14 个 = 62 总计），分布在 13 个 Ring 源文件。按影响层级：compiler_mod.ring 14 个（ESM import/export 行序）> checker.ring 10 个（模块数据导入序）> infer_register.ring 6 个 > resolver.ring 4 个 > derive/infer_decl 各 3 个 > codegen_decl 2 个 > codegen/codegen_expr/exports/infer/infer_ctx/scc 各 1 个。perceus.ring（注释中非代码）和 runtime.ring:106（JS 定义非迭代）正确跳过。

### 2. 排序对内部不影响 emit 的路径也做了 [通知]

infer*.ring 的 type_param_scope/assoc_type_map、resolver.ring 的拓扑排序、scc.ring 的 Tarjan 图遍历等站点严格来说不直接影响 JS emit 输出（内部处理顺序）。但为全面确定性统一排序——确保未来任何新增的 emit 路径不会因上游顺序不确定而引入非确定性。代价是每次排序的 O(n log n)，但这些 Map 都很小（编译器自身最大的 type_param_scope 通常 < 50 条目）。

### 3. G-b native 比对已执行——32/44 文件仍有差异 [通知]

native ring.exe 自编译（新 dist-llvm main.o，含排序代码）产出与 node dist 比对：44/44 文件数一致，12/44 字节一致，**32/44 仍有 diff**（从上次 43/44 改善为 32/44）。差异全部是**函数定义 emit 序**（非 import 序——import 已被 Map.entries() 排序修复）。

典型 diff 示例：derive.js 中 `has_manual_impl`/`int_at`/`str_at` 定义顺序不同；types.js 中 `effect_kind_name`/`effect_row` 位置不同。函数体内容完全相同，只是在文件中的位置不同。

**根因分析**：.entries() 排序覆盖了 Map 迭代序，但函数定义列表（HProgram.decls）的构建顺序还依赖于其他非确定性源——可能是 checker 内部的注册顺序、derive 生成序、或 trait impl 列表构建序。这些路径不一定经过 .entries() 但仍受 C++ vs JS 容器迭代序影响（如 trait_impls 是 List 但其内容来自 Map 遍历的插入顺序）。

**下一步**：需要追踪 HProgram.decls 列表的构建路径，找出哪些步骤引入了顺序依赖。这是 B-089 G-b 的残余工作。

## #152 runtime HOF 三类内存泄漏修复（2026-06-15，Worker Wave A）

### 1. 修复范围：10 个 C++ 函数 [通知]

三类修复覆盖 ring_runtime.cpp 中 10 个函数：① 谓词 Bool drop（filter/any/all/find/find_index = 5 个）② fold 中间累加器 drop（1 个）③ for_each 合成 key drop（map/map_int/set/set_int for_each = 4 个）。修复模式统一：提取值后立即 ring_drop，fold 特殊处理 i==0（init 是 caller 的 borrow 不可 drop）。

### 2. D5 诊断计数器已清除 [通知]

RING_D5_COUNT 宏及 4 个全局计数器（g_hof_pred_bool/g_hof_fold_acc/g_foreach_key_str/g_foreach_key_int）和 ring_alloc_stats_report 中的 [hof-stats] 输出行已删除——修复后不再泄漏，计数器失去意义。

### 3. 回归测试只覆盖 List HOF [通知]

`tests/cases/llvm/hof_drop_runtime.ring` 覆盖 filter/any/all/find/find_index/fold（含 String 累加器测真实堆泄漏）。Map/Set for_each 未入测试——两后端迭代顺序不同导致 llvm_diff 必然 diff 失败。for_each drop 修复的正确性依赖代码审查 + 后续 ×3 llvm_diff 全套验证。

### 4. 待执行 ×3 llvm_diff 终验 [通知]

ring_runtime.cpp 改动需要重编译 native binary（clang）+ ×3 llvm_diff 全套。这是 #152 的最终验收门，本次 worker session 未执行（worktree 无 native 工具链）。建议下次会话与 G-b native 比对合并执行。

## 环境修复：llvm-addon 重建完成（2026-06-15，Worker 验证阶段）

### 1. addon 已重建——91→99 函数 [通知]

llvm-addon 缺少 B-117/B-126 新增 LLVM-C 函数已修复。根因：Scoop LLVM 22 精简安装缺 `llvm-c/Error.h` 和 `llvm-c/Transforms/PassBuilder.h`。手动从 LLVM 22.1.6 源码下载补入后 `npx node-gyp rebuild` 成功（91→99 函数）。binding.gyp 路径也已更新（`C:/Users/.../scoop/...` → `D:/software/Scoop/...`）。

×3 llvm_diff 全绿（81/81 × 3 轮），#152 终验通过。dist-llvm 已重建并提交。
