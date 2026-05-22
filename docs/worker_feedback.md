# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## Wave A — Phase C 首波（2026-05-23）

### 1. #98 Set ops 修复使用了 `__ring_set_has` 辅助函数 [通知]

新增了 `__ring_set_has(s, x)` 辅助函数（线性扫描 + `__ring_deep_eq`），被 `_Set_union`/`_Set_intersect`/`_Set_difference` 共用。已加入 `RUNTIME_EXPORT_NAMES`。这使得 Set 操作的深度相等语义与 `_Set_insert`/`_Set_remove` 完全一致。性能为 O(n²)，对小集合无碍，大集合需等 #97 修复后改为 Ring 层 Eq trait dispatch。

### 2. B-034 Effect Alias 实现为纯 resolve 阶段展开 [通知]

Effect alias 在 `resolve_declared_effects()` 中展开为 effect 列表，HIR/codegen 完全不知道 alias 存在。`EffectAliasDef` 存储 AST 层的 `EffectExpr`（而非 resolve 后的 `Effect`），因为展开时需要做泛型类型参数替换。`infer_decl.ring` 中为 `Decl::EffectAlias` 返回了 dummy `HDecl::TypeAlias { ty: UNIT }` 以满足 match 穷尽性——不优雅但功能正确，后续如需可加专用 HDecl variant。

### 3. B-034 `alias` 作为上下文关键字 [通知]

`alias` 不是 lexer 关键字——在 `parse_effect_decl()` 中读取 ident 后判断是否为 `"alias"` 字符串。这意味着用户不能定义名为 `alias` 的 effect（`effect alias { ... }` 会被解析为 effect alias 声明），但可以有名为 `alias` 的变量/函数/struct。如果这成为问题，后续可改为 lexer 关键字。

### 4. B-040 错误文案修改仅在 infer.ring 层面 [通知]

穷尽性检查的核心逻辑（exhaustive.ring）未修改——witness 仍返回 `"_"`。改动仅在 infer.ring 消费 witness 时检测 `m == "_"` 并切换消息文案。match 和 catch 两处都已更新。enum 类型的错误消息不受影响（witness 为具体 variant 名如 `"Some"`，不等于 `"_"`）。

### 5. [观察] B-034 循环检测使用 expanding Set 而非全局标记

`expand_effect_exprs` 通过传入 `expanding: Set<Str>` 参数检测循环，每次递归前 insert、返回后 remove。这是栈式检测（只检测当前展开路径上的循环），不是 Tarjan 式全局拓扑排序。对于正常使用足够，但如果 alias 图很大（数百个互相引用的 alias），理论上可能重复展开同一个非循环 alias 多次。实践中不会成为问题。

