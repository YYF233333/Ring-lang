# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## B-100 Phase 2 + B-150 + JS 残留清理（2026-06-27）

### 1. B-100 Phase 2 完成——JS 后端完整退役 [通知]

Phase 2 全部完成：golden .expected 快照已建立（210+ 文件）、JS codegen 7 个 .ring 源文件 + 7 个 dist/ .js 文件已删除（commit `5df6c99`）、CLAUDE.md + design.md 已更新为 LLVM-only、backlog 顶部已完成的计划段落已清理（~45 行 → ~7 行）。dist/ 按 (C) 决策冻结作 stage 0 回退。

### 2. B-150 发现 2 个实际 bug [通知]

`ring_str_eq` 和 `ring_str_lt` 仅注册在 `rt_method_returns_i64` 而不在 `rt_method_returns_bool` 中。由于 codegen 先查 bool 列表再查 i64 列表，这两个函数的返回值被当 Int 装箱而非 Bool。**现有 660 个测试全部通过**——bug 潜伏未触发。已补回归测试 `str_eq_bool_box.ring`（9 个断言覆盖 eq/lt/!= 在布尔上下文中的使用）。另修复 5 个一致性缺失（bool 列表有但 i64 列表缺），确保 i64 是 bool 的严格超集。

### 3. JS 残留清理——3 项全部完成 [通知]

- 删除死代码 `CompileProjectResult.js` 字段（compiler_mod.ring 3 处）
- 重命名 `variant_js_name` → `variant_ctor_name`（hir.ring 定义 + infer_helpers.ring/perceus.ring 调用点 + CLAUDE.md 引用）
- 清理 ~33 处过时 JS backend 注释（compiler/*.ring 15 文件 + tests/ ~130 文件）
- 终验审计追加修复 5 处引用已删除 JS codegen 文件名的注释

### 4. Bootstrap 依赖确认（不清理） [通知]

以下 JS 残留是合法的 bootstrap 依赖，dist/ 冻结期间需保留：
- codegen_llvm*.ring 中的 ESM extern type 重声明（5 个文件）——JS ESM 模块边界问题 workaround
- dist/__ring_runtime.js——frozen artifact
- 测试 runner（e2e.test.ts / verify_rc.test.mjs / llvm_diff.test.mjs）引用 dist/——正常 bootstrap 路径
- audit-report #29（Runtime 耦合 Node.js ESM）——是 bootstrap 依赖，非 JS codegen 残留
