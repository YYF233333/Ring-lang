# Audit Report

> 活的 bug 看板。修复后删除条目，只在 git commit message 留记录。
> 条目格式：`### #xxx <标题> [严重度] [dispatch] [状态]`
> dispatch 标记：`mechanical`（DS 可执行）/ `judgment`（Claude 执行）
> 状态流转：`open` → `doing` → 删除
> 工作流规范见 `docs/workflow.md`

---

## 前端


---

## LLVM Codegen



### #212 ring_assert 调用签名不匹配：Bool 未 unbox 到 i64（9 个 E2E segfault）[medium] [judgment] [open]

`gen_runtime_call` fallback 路径直接传 boxed `ptr` 参数给 `ring_assert(i64, ptr)`，但第一参数应为 unboxed `i64`（Bool 值）。LLVM verify 报类型错误后仍 emit → 运行时 segfault。

**影响用例**：default_effect_body_io / default_effect_topo / mod_effect_evidence / api_clone / map_clone / iterator / map_iteration / set_struct_eq / set_ops_deep_eq（均因调用 `assert()` 触发）。

**修复方向**：在 fallback 路径对 Bool 参数加 `unbox_to_i1` → `zext i1 to i64`；或在 `ring_assert` 声明侧改为接受 `ptr`。

发现者：B-100 P2 E2E 迁移根因调查

### #213 Map HOF 运行时崩溃：map_values / filter / fold segfault [medium] [judgment] [open]

编译通过（LLVM verify 无错误），`map_values`/`filter`/`fold` 运行时 0xC0000005。可能是 dict-dispatch wrapper 调用约定不匹配或 runtime 函数内存访问越界。

**影响用例**：map_ufcs_bug / map_hof。与 #138 同域但根因不同——#138 是方法映射缺失，这里是映射存在但运行时 crash。

发现者：B-100 P2 E2E 迁移根因调查

### #214 泛型函数赋值 wrapper 漏传 dict 参数 [low] [judgment] [open]

`let f = display` 将泛型函数赋值给变量时，wrapper 生成代码漏传 trait dict 参数。LLVM verify 报 "Incorrect number of arguments"。

**影响用例**：trait_alias。

发现者：B-100 P2 E2E 迁移根因调查

### #215 LLVM 后端 test block 未实现 [low] [judgment] [open]

`codegen_llvm_decl.ring:138` 跳过 `HDecl::Test`。仅含 `test` 块（无 `fn main()`）的文件在 LLVM 后端输出为空。

**影响用例**：scc_mutual_recursion（测试内容在 `test` 块中）。

发现者：B-100 P2 E2E 迁移根因调查

### #216 ring_runtime.cpp 缺 parseInt / parseFloat [low] [mechanical] [open]

`extern fn parseInt(s: Str) -> Int` 和 `parseFloat` 在 JS 后端由宿主引擎提供，ring_runtime.cpp 未实现。

**影响用例**：modules/extern_fn / modules/extern_type。

发现者：B-100 P2 E2E 迁移根因调查

### #29 Runtime 耦合 Node.js ESM（createRequire）[low] [judgment] [open]

可移植性问题。

### #138 Map/Set clone 方法语法在 native 落 panic-stub [low] [judgment] [open] [latent]

**已修复（2026-06-25）**：Map.fold/Set.fold/Map.filter/Map.any/Map.map_values/Set.filter/Set.any/Set.all 全部实现 runtime + 映射。

**残留（latent）**：str-keyed `Map.clone()` / `List.clone()` / `Set.clone()` 方法语法（int-keyed 有映射、str-keyed 落空；直呼 `map_clone(m)` 经 `ring_` fallback 正常）。发现者：B-103 Wave A。

---

## 跨模块代码健康


### #202 LLVM extern 类型重声明分散在 5 个 codegen 文件 [low] [judgment] [open]

`codegen_llvm.ring:18-27`、`codegen_llvm_ctx.ring:6-12`、`codegen_llvm_decl.ring:46-52`、`codegen_llvm_stmt.ring:9-13`、`codegen_llvm_expr.ring:25-31`：每个文件独立重声明所有 LLVM opaque 类型（`LLVMContextRef`/`LLVMModuleRef`/`LLVMBuilderRef` 等）。注释说明是为避免 ESM 跨模块导入问题。导致新增 LLVM-C API 调用需更新 5 处，遗漏则运行时链接错误。

若 ESM 导入问题已解决，应集中到 `llvm_ffi.ring` 统一声明。

发现者：DS


### #205 verify_rc 负面测试套件覆盖不全（22 类中 9 类仍缺专用测试）[low] [mechanical] [open]

覆盖已从 3/22 扩展到 13/22（+10 个新用例）。剩余 9 类均为 fatal 类别，仅从 RC pass 回归触发（非源码 pattern），需要新 mutation 类型支持。

发现者：DS



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
