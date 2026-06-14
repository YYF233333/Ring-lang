# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-089 G-b emit 排序确定化（2026-06-14，Worker）

### 1. LLVM 后端 Str `>` 运算符缺失 — 附带修复 [通知]

sort_by 闭包中 `a.0 > b.0`（Str 比较）触发 `gen_str_binop` panic（`BinOp::Gt` 未实现）。已顺带加上：swap args 复用 `ring_str_lt`，一行改动。dist-llvm 编译前此操作符即不可用——是 LLVM 后端的已有缺口，本次修复属 incidental fix。`Le`/`Ge` 仍缺，未来如需可同模式补。

### 2. first-match 查找站点的隐式顺序依赖 [观察]

三个 Map 迭代站点使用 `return some(first_match)` 模式——排序后确定化，但根因（多模块同名函数歧义）仍在：
- `codegen_stmt.ring:23` — struct suffix 查找（多 module 同名 struct 时 first match）
- `codegen_llvm_expr.ring:1777` — imports_map 前缀枚举（多 module 同名 fn 时 first match）
- `codegen_llvm_expr.ring:1803` — functions 后缀回退（同上）

当前编译器自举无歧义（测试全绿），排序保证确定性。但如果将来出现真实的同名冲突，排序只是把"随机选一个"变成"选字典序最小的一个"——仍是隐式消歧。长期应改为显式报错或 qualifier 要求。

### 3. Set.to_list() 迭代未排序 [观察]

全局排查确认 codegen 中无 Set.to_list() 影响 emit 顺序的站点。fn_callees 的 Set<Str>.to_list() 在单调固定点循环内使用（迭代序不影响最终结果），故跳过。如果将来新增 Set 迭代用于 emit，需注意排序。

### 4. LLVM 后端 `List.sort_by` 运行时映射缺失 — 附带修复 [通知]

native ring.exe 自编译时 panic `missing method 'List.sort_by'`——`codegen_llvm_expr.ring` 的方法映射表有 `sort` → `ring_list_sort_default` 但无 `sort_by` → `ring_list_sort`。已补映射（一行 + 闭合括号对齐）。runtime `ring_list_sort(list, closure)` 已存在。

### 5. G-b 排序范围远超 codegen——编译器全流水线 Map 迭代均需确定化 [通知]

native self-compile 比对显示 43/44 文件仍有差异。已完成的 codegen 14 站点只覆盖了一部分来源。剩余差异来自：
- **compiler_mod.ring**（14 个站点）：ESM import 行生成（`build_dep_import_pairs` 中 `values/types/inherent_methods.entries()`）、exports 收集、cross-module 元数据构建
- **函数定义 emit 序**：derive 生成的 impl 函数（如 Clone impls）顺序不同，源头疑在 checker/derive 的 Map 迭代
- **全编译器**：共 62 个 `.entries()` 调用分布在 17 个文件中

**下次继续的工作**：按影响层级修——compiler_mod.ring（import/export 行序）→ checker/derive/exports（函数定义序）→ 剩余站点。每轮修完重测 native self-compile 比对，量化进展。
