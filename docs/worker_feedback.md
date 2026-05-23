# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## Worker Wave A（2026-05-24，第二轮）

### 1. #110 修复使用了两种不同的名字分隔符 [通知]

Codegen 阶段 struct 名字用 `$` 分隔（`inner$Pair`，JS 标识符），exhaustive 阶段用 `::` 分隔（`inner::Pair`，Ring 语法）。修复时 `resolve_struct_name` 用 `$` 后缀匹配 struct_field_order，`names_match_struct` 用 `::` 后缀匹配 type name。两者独立正确，但说明编译器管线中名字表示不统一——checker 用 `::` 而 codegen 用 `$`。这是已知的设计分歧（checker 保留源码语义，codegen 生成 JS 标识符），不是 bug，但值得注意。

### 2. #110 发现新 bug：外部限定 struct pattern 不工作 [通知]

修复 mod 内部 struct pattern 匹配后，agent 测试了从 mod 外部用 `inner::Pair { a, b }` 做 pattern matching，发现 checker 报 E0201（未定义类型）。已记录为 #115。该 bug 独立于 #110——#110 修复的是 mod 内部的名字不一致，#115 是 checker pattern 解析不支持限定路径。

### 3. #109 新测试验证了 FnType 参数中的 bounded type param [通知]

添加的 `trait_fn_param.ring` 测试覆盖了 `fn<T: Showable>(f: fn(T) -> Str, x: T)` 场景——T: Showable 仅出现在 FnType 参数位置。测试通过，证明修复有效。TupleType 和 GenericType 路径虽然也添加了，但未能构造出触发这些路径的独立测试用例（需要 bounded type param 仅出现在 tuple 或泛型嵌套中的极端场景）。这些路径的正确性依靠代码审查确认。

### 4. #105 是防御性修复，当前无法构造触发路径 [通知]

`ast_ops.get(0).unwrap()` 的 panic 路径需要 effect def.ops 比 AST ops 多条目才能触发。正常编译流程中这不可能发生（两者来自同一解析结果）。修复是纯防御性的——将 unwrap() 替换为安全的 Option match。13 个现有 default effect handler 测试全部通过，确认未引入回归。

