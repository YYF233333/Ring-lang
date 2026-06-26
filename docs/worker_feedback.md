# Agent Feedback

> Agent → 用户的异步消息通道。Worker / Auditor / 其他 agent 均可写入。
> 三种类型：
> - `[决策]`：需要用户判断的设计问题，阻塞对应 backlog item（转 `waiting-feedback`）
> - `[通知]`：值得用户了解的信息，不阻塞工作（实现取舍、跳过步骤的原因、潜在改进点等）
> - `[观察]`：不算 bug 但值得注意的现象（代码异味、设计不一致、潜在改进方向等）
>
> Agent session 很长，用户无法回看全部过程。这里是 agent → 用户的异步摘要。
> Discussion agent 在每次对话开始时呈现，用户确认后删除。

## Audit 修复 batch（2026-06-26）

### 1. #211 collect_local_calls GenericType 分支 [通知]

新增 `Type::GenericType { base, .. }` 分支，从 `base` 中提取 StructType/EnumType 名做 qualified lookup。`TypeVar` 接收者仍为 unqualified fallback——这是已知限制（需要泛型方法名恰好与带 effect 的顶层函数同名才触发）。

### 2. #210 fn_mut_params qualified key [通知]

采用"双 key"策略：`check_fn_decl` 插入的 unqualified key 保留（intra-module 使用），额外插入 qualified key 供 exports.ring 跨模块查找。不改动 exports.ring 侧。

### 3. #207 catch arm guard binding 顺序 [通知]

修复后有 guard 的 catch arm 从 if-else 链改为独立 if 块——确保 guard 失败后正确 fallthrough 到下一个 arm。无 guard 的 arm 保持 if-else 链。新增 3 个回归测试。

### 4. #203 discard 函数去重 [通知]

唯一定义保留在 `codegen_llvm_expr.ring`（`pub fn`）。`codegen_llvm.ring` 和 `codegen_llvm_decl.ring` 通过 `use` import；`codegen_llvm_stmt.ring` 因循环依赖用 `extern fn` 前向声明（与 `gen_llvm_expr`、`unbox_to_i1` 等已有函数同模式）。

## B-100 Phase 2 — JS 后端退役（2026-06-27）

### 5. Golden 快照替代 JS oracle [通知]

210 个 llvm_diff 用例的 LLVM 输出已生成为 `.expected` golden 文件。`llvm_diff.test.mjs` 完全移除了 `runJs()` 和 JS oracle 逻辑，改为对照 golden 快照。新增 `--update-golden` 选项供后续重新生成快照。

### 6. 共享函数提取到 effect_analysis.ring [通知]

从 `codegen.ring` 提取 `collect_fn_callees` / `collect_local_calls` / `collect_local_calls_stmt`，从 `codegen_ctx.ring` 提取 `extract_effect_names`，合并到新文件 `effect_analysis.ring`。LLVM 后端和 JS 后端（当时仍存在）都改为从此文件 import。

### 7. E2E 测试迁移到 LLVM CLI [通知]

`e2e.test.ts` 不再调用 `generate()`（JS codegen），改为 `node RING build --target=llvm` → clang 链接 → 运行 native exe。28 个用例被 skip（LLVM 后端 gap），经逐一验证全部是真 gap。测试从约 1 分钟变为约 2.5 分钟。

### 8. JS 后端删除 [通知]

删除 7 个 .ring 源文件 + 7 个 dist/ .js 文件，净减约 15,000 行代码。`cli.ring` 默认 target 改为 `llvm`，`run` 子命令移除（LLVM 目标需 link 才能执行）。`compiler_mod.ring` 删除 `compile_project_esm()` 及全部 ESM/bundle 辅助函数（约 600 行）。dist/ JS 文件成为冻结的 stage 0 bootstrap。

### 9. 13 个 JS-only 测试删除 + 15 个真 gap 登记 audit [通知]

28 个 skip 中：9 个编译拒绝（non-tail-resumptive handler + or_pattern）+ 4 个 JS-only builtin（debug/extern_fn/json_stringify）= 13 个删除。剩余 15 个（12 segfault + 1 空输出 + 2 module）经根因调查归为 5 个 audit 条目（#212-#216），其中 #212（ring_assert Bool 未 unbox）一旦修复可解锁 9 个用例。

### 10. Bootstrap 工作流变更 [决策]

dist/ JS 文件现在是**冻结的 stage 0 bootstrap**——不再通过 `node dist/main.js build main.ring --out-dir=dist` 重建（该命令现在会产出 .o 而非 .js）。日常开发改用 ring.exe（native）自编译。CLAUDE.md 的 rebuild 命令和开发约定需要更新以反映新的 bootstrap 流程。

**待决策**：
- (A) dist/ 冻结不动，只维护 dist-llvm/ + ring.exe
- (B) dist/ 删除，完全切换到 native bootstrap（需要 ring.exe 作为唯一入口）
- (C) 保留 dist/ 作为紧急回退，但标记为 frozen（不 rebuild）

