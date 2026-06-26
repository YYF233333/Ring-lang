# Audit Report

> 活的 bug 看板。修复后删除条目，只在 git commit message 留记录。
> 条目格式：`### #xxx <标题> [严重度] [dispatch] [状态]`
> dispatch 标记：`mechanical`（DS 可执行）/ `judgment`（Claude 执行）
> 状态流转：`open` → `doing` → 删除
> 工作流规范见 `docs/workflow.md`

---

## 前端

### #196 effects_match_kind 对 MutEffect 的 TypeVar 去重可能过早丢弃 effect [medium] [judgment] [open]

`types.ring:96-97`：`effects_match_kind` 在 `row_merge` 期间，当 `MutEffect` 的任一 `state_type` 是 TypeVar 时即视为"同种"并去重。若 `mut<?T>` 和 `mut<Int>` 被去重，后续 `?T` 解析为 `Str` 时，`mut<Str>` effect 被静默丢弃——可能导致 LLVM codegen 跳过 evidence 设置。

需要验证所有 `row_merge` 调用点是否被后续 `unify_effect_rows` 覆盖。若未覆盖，应限制 TypeVar 回退仅在两侧均为 TypeVar 时生效。

发现者：Opus


---

## LLVM Codegen



### #198 emit_trait_dict 未保存/恢复 builder 插入块 [low] [mechanical] [open]

`codegen_llvm_decl.ring:699-778`：`emit_trait_dict` 保存/恢复 `ctx.current_fn`，但不保存 `LLVMGetInsertBlock`。函数返回后 builder 停留在 memoised getter 的块上。对比 `emit_derived_trait_dict` 正确保存/恢复了 insert block。

目前无 bug（调用后无立即 emit IR 的代码），但 latent——新代码在 `emit_trait_dict` 后 emit IR 会产生错位指令。

发现者：Opus


### #29 Runtime 耦合 Node.js ESM（createRequire）[low] [judgment] [open]

可移植性问题。

### #138 Map/Set clone 方法语法在 native 落 panic-stub [low] [judgment] [open] [latent]

**已修复（2026-06-25）**：Map.fold/Set.fold/Map.filter/Map.any/Map.map_values/Set.filter/Set.any/Set.all 全部实现 runtime + 映射。

**残留（latent）**：str-keyed `Map.clone()` / `List.clone()` / `Set.clone()` 方法语法（int-keyed 有映射、str-keyed 落空；直呼 `map_clone(m)` 经 `ring_` fallback 正常）。发现者：B-103 Wave A。

---

## 跨模块代码健康

### #201 emit_c_main / emit_c_main_project 代码重复 ~90% [low] [judgment] [open]

`codegen_llvm.ring:1336-1427` vs `1708-1777`：单文件与多文件 C main 生成函数逻辑高度重复。单文件路径检查 `ctx.functions` 后才声明 `ring_runtime_init`，多文件路径无条件 `LLVMAddFunction`。一处修复的 bug 不一定在另一处同步。

应提取共享的 `emit_c_main_common(ctx, ring_main_name)` 消除重复。

发现者：Opus

### #202 LLVM extern 类型重声明分散在 5 个 codegen 文件 [low] [judgment] [open]

`codegen_llvm.ring:18-27`、`codegen_llvm_ctx.ring:6-12`、`codegen_llvm_decl.ring:46-52`、`codegen_llvm_stmt.ring:9-13`、`codegen_llvm_expr.ring:25-31`：每个文件独立重声明所有 LLVM opaque 类型（`LLVMContextRef`/`LLVMModuleRef`/`LLVMBuilderRef` 等）。注释说明是为避免 ESM 跨模块导入问题。导致新增 LLVM-C API 调用需更新 5 处，遗漏则运行时链接错误。

若 ESM 导入问题已解决，应集中到 `llvm_ffi.ring` 统一声明。

发现者：DS

### #203 discard 函数在 4 个 codegen 文件中重复定义 [low] [mechanical] [open]

`codegen_llvm.ring:90-92`、`codegen_llvm_stmt.ring:54-56`、`codegen_llvm_decl.ring:2619`、`codegen_llvm_expr.ring:3226-3228`：相同的空函数定义了 4 次。应提取到共享模块。

发现者：DS

### #205 verify_rc 负面测试套件覆盖不全（15 类仅 3 类有专用测试）[low] [mechanical] [open]

`tests/cases/llvm/verify_rc_*` 下仅覆盖 `x-overwrite-field`、`leak-temp`、`uaf-drop-borrow` 三类。其余 12 类（`leak-binding`/`leak-return`/`leak-loop-exit`/`leak-scalar-reassign`/`uaf-escaped-borrow`/`uaf-use-after-drop`/`uaf-double-drop`/`uaf-drop-unknown`/`uaf-shadow-mismatch`/`rc-imbalance`/`x-spread`/`x-shadow-overwrite`/`x-overwrite-param`）依赖 self-verify 门和 LLVM 用例扫荡间接覆盖，无直接负面回归测试。

应为每个未覆盖类别构造最小触发用例。

发现者：DS

### #204 fieldless enum Eq 比较中 4 条死 IR 指令 [low] [mechanical] [open]

`codegen_llvm_decl.ring:1279-1309`：`result`、`ext`、`tags_equal`、`as_i64` 四条 LLVM IR 指令被 emit 但未使用，为不完整重构的残留。LLVM 优化器会移除，但增加代码可读性负担。

发现者：Opus

### #192 andor_lower / dict_lower HIR walker 结构性重复 [medium] [judgment] [deferred]

`andor_lower.ring:55-318` 和 `dict_lower.ring:65-431` 包含近乎相同的 HIR 结构遍历器。

**推迟理由**（2026-06-25 Worker 评估）：andor_lower 无状态，dict_lower 穿线 3 个可变参数；24 个 expr arm 只有 2 个有差异；通用 visitor 需 ~150 行 trait 基础设施换 ~250 行节省，且编译器穷尽 match 已能 catch 新 variant 遗漏。投入/产出比不合算。

发现者：Opus（前端审计）





---

## 设计-实现差距（参考，已在 backlog 跟踪）

> 以下为未实现特性的跟踪参考，不作为 Worker 任务源。实际实现由 backlog 对应条目驱动。

| # | 设计功能 | Backlog 对应 | 状态 |
|---|----------|--------------|------|
| 36 | Refinement types (where 子句) | B-001 | 语法解析但语义忽略 |
| 37 | ~~`mut<S>` 参数化 effect~~ | B-037 | ✅ 已实现 → **已移除**（2026-06-24 design.md §7.9；实现保留但 effect 语义废弃，mutation 改由参数推断承载） |
| 38 | Post-resume handler / Full AE | 已取消 (B-009) | 不实现 |
| 39 | `dyn Trait` 动态分发 | B-006 | 未实现 |
| 40 | Supertrait 继承 | B-005 | ✅ 已实现 |
| 41 | 关联类型 | B-004 | ✅ 已实现 |
