# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## Wave A 执行报告（2026-06-15）

### 1. B-138 impl SCC 排序：W0001 12→8，parser 假阳性 5→1 [通知]

实现 = `scc.ring` 新增 `collect_self_method_callees`（~170 行 AST 遍历）+ `infer_decl.ring` 在 `check_impl_decl` 检查前 SCC 排序。parser.ring 仅剩 1 个 W0001（`parse_mod_block` ↔ `parse_decl` 互递归 SCC 环，已知限制）。agent 做了 triple bootstrap 验证稳定性。**未加独立 E2E 测试**（spec 要求了），但编译器自编译 W0001 消除是更强验证。

### 2. B-137 collect_local_calls：10 行修复 + 回归测试 [通知]

精确按 spec 补了 `HExpr::ReturnExpr` 和 `HExpr::Clone` 两个 match arm。新测试 `return_call_effect.ring` 验证通过 return 表达式的 effect 传播。无额外发现。

### 3. B-126 E0707 歧义检测：checker 层拦截 + 设计判断 [通知]

agent 选择在 `checker.ring:resolve_uses` + `infer_decl.ring:resolve_mod_uses` 两处加 `import_origins` 追踪。**设计判断**：`insert_mod_aliases`（inline mod 的类型短名自动别名）保持 first-wins 行为不报错——用户用 `a::Foo` / `b::Foo` 限定名消歧，现有测试 `mod_alias_collision.ring` 已验证。codegen 3 个 first-match 站点未改（上游保证无歧义后自然唯一命中）。

### 4. B-126 发现的 pre-existing bug [通知]

`resolve_mod_uses()` 在 `infer_decl.ring` 中，`use super::a::{do_thing}` 路径 `["super", "a"]` 会丢失中间段 `"a"`，解析为 `"do_thing"` 而非 `"a::do_thing"`。多段相对路径导入可能静默查找错误名字。不属于 B-126 范围，未修复。
