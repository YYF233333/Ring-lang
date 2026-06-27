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

### #218 default effect handler dispatch：sibling op 调用走错路径 [medium] [judgment] [open]

`default_effect_sibling_op.ring` runtime assertion 失败："increment default should call overridden get"。default effect handler 的 sibling op 调用未正确 dispatch 到 override handler，走了 default 路径。

**LLVM_SKIP**：`default_effect_sibling_op.ring`（e2e）、`default_effect_sibling.ring`（llvm golden）。修好后移除。

发现者：B-151 CI

### #219 effect handler 交互：custom effect + fail 组合 runtime crash [medium] [judgment] [open]

`effect_custom_and_fail.ring`（"fail on bad port"）和 `effect_custom_multi_effect.ring`（"log called twice"）runtime assertion 失败。custom effect handler 与 fail effect 交互时 evidence 传递或 handler 栈有误。

**LLVM_SKIP**：`effect_custom_and_fail.ring`、`effect_custom_multi_effect.ring`。修好后移除。

发现者：B-151 CI

### #220 exhaustive match + generic payload runtime crash [medium] [judgment] [open]

`exhaustive_generic_payload.ring` runtime assertion "some-false" 失败。泛型 enum payload 在穷尽 match 的某个分支 codegen 有误（可能是 tag 比较或 payload 提取问题）。

**LLVM_SKIP**：`exhaustive_generic_payload.ring`。修好后移除。

发现者：B-151 CI

### #221 struct match pattern + tuple eq dispatch runtime crash [medium] [judgment] [open]

三个用例 runtime assertion 失败：`struct_match_pattern.ring`（"y-axis"）、`tuple_eq.ring`（"tuple eq same values"）、`tuple_eq_struct.ring`（"tuples with equal structs should be equal"）。struct 的 match pattern 和 tuple 的 eq 比较在 LLVM 后端有 codegen 问题。

**LLVM_SKIP**：`struct_match_pattern.ring`、`tuple_eq.ring`、`tuple_eq_struct.ring`。修好后移除。

发现者：B-151 CI

### #222 ring.exe check 行为与 in-process checker 不一致（2 个负向用例）[low] [judgment] [open]

- `error_occurs_check.ring`：ring.exe check 无输出（预期 E0302），in-process checker 正确报错
- `error_tuple_oob.ring`：ring.exe check panic（"unreachable: tuple index bounds already checked"）而非报 E0304

两者均为 frozen dist-llvm 编译的 ring.exe 与最新 checker 源码的行为差异。可能在下次 dist-llvm rebuild 后自然修复。

**LLVM_SKIP**：`error_occurs_check.ring`、`error_tuple_oob.ring`。修好后移除。

发现者：B-151 CI

### #217 Perceus 未对 block-expr / IIFE 临时值插入 HIR 层 drop [low] [judgment] [open]

block 表达式作为 if/match 条件（`if { let v = 5; v > 3 } { ... }`）和 IIFE（`(fn(x) { x * x })(5)`）产出的 owned 临时值在 HIR 层无显式 drop。codegen 层正确处理（unbox 后丢弃 / 调用后释放闭包），运行时无泄漏，但 verify_rc 静态检查报 `leak-temp`。

**触发用例**：`expr_block.ring:13,17`、`lambda_closure_effect.ring:26`

**修复方向**：Perceus RC pass 对这两类位置插入显式 `HDrop`——block-expr 在条件位置的结果值、IIFE 的闭包对象。修复后 verify_rc 的 `leak-temp` skip 列表可缩小。

发现者：B-151 CI（Python runner RC sweep 首次全量覆盖暴露）

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
