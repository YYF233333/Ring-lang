# Audit Report

> 活的 bug 看板。修复后删除条目，只在 git commit message 留记录。
> 条目格式：`### #xxx <标题> [严重度] [dispatch] [状态]`
> dispatch 标记：`mechanical`（DS 可执行）/ `judgment`（Claude 执行）
> 状态流转：`open` → `doing` → 删除
> 工作流规范见 `docs/workflow.md`

---

## 🔴 Critical（阻塞 native 自举）

（无 open 项。#134 已由 B-098 clone-all-escape 从根消除（2026-06-04，git `c54e7c6`）；native 自举余项归 B-089。）

## Checker



### #45 `StructType`/`EnumType` 在 `apply_subst` 中不替换 fields [low] [judgment] [open] [deferred: LLVM]

设计约束：fields 是模板字段（含递归引用），递归替换会导致 `Node<T>` 等递归类型栈溢出。当前 `infer_field_access` 的 inst_map 兜底是正确设计。如需修复需改为 nominal 表示（关联 #16）。

**决策（2026-05-23）**：长期容忍。当前方案正确且无性能问题，改动大（L-XL）收益主要在未来后端。等 LLVM 后端需要时与 #16 一并重构。





## Codegen

<!-- #156 closed: contains/index_of 已由 std/list.ring impl<T: Eq> List 走 Eq trait 派发（两后端均用 Ring impl，runtime ring_list_contains/index_of 为死代码），2026-06-15；List.find 是谓词式不涉及 ===；Map key 残留归 B-107；死代码清理并入 B-130 -->

### #158 字符串操作系统性字节 vs 字符索引分歧：native UTF-8 字节偏移 vs JS UTF-16 码元偏移 [medium] [judgment] [open]

ring_runtime.cpp 的所有字符串操作使用 `std::string` 的字节级 API，JS 后端使用 JS 原生 UTF-16 码元级 API。对 ASCII 两者一致；对非 ASCII（CJK、emoji 等）**系统性发散**：

| 操作 | JS（runtime.ring） | Native（ring_runtime.cpp） | 例：`"你好world"` |
|------|-------------------|--------------------------|-----------------|
| `len` | `self.length`（UTF-16 码元数） | `str->size()`（字节数） | JS=7, native=11 |
| `index_of("world")` | `self.indexOf()`（码元偏移） | `str->find()`（字节偏移） | JS=2, native=6 |
| `char_at(0)` | `self[0]`（返回字符 "你"） | `(*str)[0]`（返回单字节 0xE4，**无效 UTF-8**） | JS="你", native=乱码 |
| `slice(0,1)` | `self.slice(0,1)`（码元切片） | `str->substr(0,1)`（字节切片，**切断多字节字符**） | JS="你", native=0xE4 |

**影响**：
- `char_at` 对多字节字符返回**无效 UTF-8 单字节**——不只是数值差异，是语义损坏
- `slice` 可切断多字节字符产生无效 UTF-8 字符串——后续字符串操作可能行为未定义
- 当前 llvm_diff 测试全部使用 ASCII → 分歧**不可见**（oracle 盲区）
- JS 退役后 native 字节语义成为唯一行为，无安全网

**修复方向**（需设计拍板）：
- (A) Ring 定义字符串为 UTF-8 字节串（Rust 模型）→ native 正确，JS 是"临时近似"，退役后无影响。但 `char_at`/`slice` 对用户不友好（需 byte 级思考），且 `char_at` 返回无效 UTF-8 仍是 bug
- (B) Ring 定义字符串为 Unicode 字符串（Python 模型）→ native 需改为 code-point 级操作（遍历 UTF-8 计数/切片），性能代价更高但语义正确
- 不论选 A/B，`char_at` 返回无效 UTF-8 这条**两种模型下都是 bug**——A 模型也应改为返回完整 code point 或报错
- **B-100 JS 退役前必须拍板**，否则语义在退役时静默变化

发现者：Audit workflow (oracle-blind + backend-parity lens, 2026-06-13)

<!-- #159 closed: 转为 B-130（List.sort() Ord bound + 死代码清理），2026-06-15 -->

### #29 Runtime 耦合 Node.js ESM（createRequire）[low] [judgment] [open]

可移植性问题。

> #130（闭包 env 捕获泄漏）/ #131（perceus drop 落不了地，96 rc-warn）已于 2026-06-03 并入 B-084（✅ 已落地删除，见 git）；剩余闭包 RC 收口归 **B-096**。

### #136 LLVM 后端 5 个 mapped-but-missing runtime 符号 [low] [judgment] [doing]

B-103 全量枚举 ring_runtime.cpp 时发现：`method_to_runtime`（codegen_llvm_expr.ring）映射了 5 个 **ring_runtime.cpp 中不存在**的符号——`ring_str_to_int`（Str.to_int）、`ring_str_to_float`（Str.to_float）、`ring_list_enumerate`（List.enumerate，且在 codegen_llvm.ring:174 被无条件 declare）、`ring_map_is_empty`（Map.is_empty）、`ring_set_is_empty`（Set.is_empty）。任何程序在 `--target=llvm` 下调用这些方法 → 链接失败（undefined symbol）。当前编译器/测试零使用（`.enumerate` 仅注释提及）→ latent。修复方向：补 runtime 实现或删映射改走 Ring impl；**注意其中 to_int/to_float/enumerate 三个已由 B-094 拍板「确定不加、清死映射」（2026-06-03，enumerate 真做时归 B-095）——本条净增量 = `ring_map_is_empty`/`ring_set_is_empty` 两个，修复时勿与 B-094 决策冲突**。发现者：B-103 Wave A。

<!-- #137 closed: B-123 落地（reverse/sort/sort_default 改原地），2026-06-13 -->

### #138 std 已声明但 method_to_runtime 未映射的方法在 native 落 panic-stub [low] [judgment] [doing]

`StringBuilder.line` / `StringBuilder.add_int`、`Set<Str>.clear`、`Set.union` / `intersect` / `difference`（runtime 符号 `ring_sb_line`/`ring_sb_add_int`/`ring_set_clear`/`ring_set_union`/... **存在**但 method 派发不可达），以及 str-keyed `Map.clone()` / `List.clone()` / `Set<Str>.clone()` 方法语法（int-keyed 分支有映射、str-keyed 落空；直呼 `map_clone(m)`/`list_clone(l)` 经 gen_direct_call 的 `ring_` fallback 正常）。这些方法调用在 native 生成 "unknown method" panic-stub，运行即 panic。当前编译器自身零使用（`.line(`/`.union(` 等 grep 为 0）→ latent。发现者：B-103 Wave A。

**精化（2026-06-11，B-104 D1 Stage 3 实测命中）**：`Set.clear` 的不可达对 **Set<Str> 与 Set<Int> 都成立**——`is_int_set` 重定向表里虽有 `"clear" => "ring_set_int_clear"`，但重定向仅在 `method_to_runtime` 基础查找命中后运行，基础表无 `"Set"/"clear"` 条目 → 重定向是死代码。Stage 3 的 `remove_clear_drop_rc.ring` 首跑以 `s.clear()` 实测 panic（`ring panic: LLVM: missing method 'Set.clear'`），不再是纯推导 latent；该用例已将 Set.clear 移出 LLVM 锁面（RC 侧本就无账可结——值内联），JS 行为由 `tests/cases/collection_clear.ring` 覆盖。修复（补映射 + 死重定向接通）属 codegen 改动，仍按本条走。

**精化（2026-06-12，#150 收口核实）**：**`Map.fold` / `Set.fold` 同属本条家族**——builtins.ring 有类型（MAP_HOF_METHODS/SET_HOF_METHODS 含 fold）、JS 后端走 `gen_hof_fold` 正常，但 native 侧 `method_to_runtime` 无 `"Map"/"fold"`、`"Set"/"fold"` 条目且 runtime 无 `ring_map_fold`/`ring_set_fold` 符号 → 落 "unknown method 'Map.fold'" panic-stub。audit #150 原文「map/set fold 同形」断言经此核实不成立（无符号即无 verbatim 路径，#150 的 dup 修复只需落 `ring_list_fold` 一处）。当前编译器零使用 → latent。

### #140 extern handle 的闭包捕获 dup 不受 #139 类型级排除覆盖 [low] [judgment] [open] [latent]

#139 的类型级排除盖住了 perceus 的四个机制（Clone/Drop/owned/materialise）+ codegen drop_T 字段递归，但 **gen_lambda 的捕获 dup 是第五条 RC 路径**：闭包构造时对每个捕获一律 `ring_dup`（B-098 all-owned captures），且 env 死亡时 `drop_closure_env` 逐 slot `ring_drop`——若 lambda 捕获 extern handle（或含 handle 的容器），dup 写外来内存 / env drop 释放外来指针，与 #139 同类损坏。**现状零实存站点**（grep 实证 codegen_llvm_* 五模块零闭包使用——无 .map/.filter/.fold/lambda），纯 latent；且与 #139 同等 dormant（仅 B-099 native 自跑 --target=llvm 触发）。修法方向：gen_lambda 捕获循环按捕获绑定的 HIR 类型跳过 dup + drop_closure_env 对应 slot 跳过（需 env 布局携带 per-slot 标志），或 D1 Stage 2 时统一处理。发现者：B-104 D1 Stage 1。

> （#139 本体已修复并删除，2026-06-11：类型级 RC 排除落地于 B-104 D1 Stage 1，git `bfd4fe6`..`b62423b`，回归 `tests/cases/llvm/extern_handle_rc_exclusion.ring`；runtime 级终验已挂 B-099 验收。）

### #146 extern type 经 `use` 导入（无本地重声明）时漏出类型级排除 [low] [judgment] [open] [latent]

`hir.ring: collect_extern_type_names` 按模块收集 `HDecl::ExternType`（perceus 逐模块运行；现状 codegen_llvm_* 五模块均本地重声明 extern types，模块内收集即覆盖全部使用点）。若未来某模块通过 `use` 导入 extern type 而不本地重声明，其值不被排除——dup/drop 触及外来指针（crash 方向，同 #139 类）。今日代码库零实存形态；出现时需把 extern 名集合从 checker 全局导出（如挂 HProgram）。已记 hir.ring 帮助函数注释，本条防注释埋没。发现者：B-104 D1 Stage 1。

### #147 跨模块裸名 nominal 碰撞可误伤 extern-handle 排除判定 [low] [judgment] [open] [latent]

`is_extern_handle_type` 按 `Type::StructType.name` 裸名匹配：若另一模块存在与某 extern type 同裸名的用户 struct，且其值流入声明该 extern type 的模块，会被误排除（漏 dup/drop → 潜在 double-free）。与既有「跨模块 nominal 类型按名 unify」语义同级（`types_equal` 本就按名），现实概率≈0（`LLVM*Ref` 命名空间独占）。真解 = extern 名集合带模块限定（可与 #146 的 checker 导出一并做）。发现者：B-104 D1 Stage 1。

<!-- #148 closed: B-124 落地（join 签名收紧为 List<Str>），2026-06-13 -->

### #157 fresh payload-enum 局部 match-then-discard 未 scope-end-drop（leak 类）[low] [judgment] [open]

D9 probe-E 撞出：`let c = Color::Blue{shade}` 在循环内 matched-then-discarded（match 只投影标量 payload、不消费外壳），每轮泄 `tid68=n`。fresh owned payload-enum 作为 let 绑定应被 scope-end-drop 回收，但实际未 drop——疑似 perceus scope 建模对 matched-then-projected 的 let 绑定遗漏。与 D9 Part 2（UnitType 单例化、const-enum 类）无关，与 Part 1（interp SB codegen-drop）无关——是独立 RC gap。subagent 已改写 probe 绕开以隔离 const 类测量。发现者：B-104 D9 probe 构造期。

<!-- #152 runtime HOF 三类 drop 修复已落地并删除（2026-06-15）：谓词 Bool box / fold 中间累加器 / for_each 合成 key。ring_runtime.cpp 10 函数修复 + D5 诊断计数器删除 + 回归 tests/cases/llvm/hof_drop_runtime.ring。待 ×3 llvm_diff 终验。 -->





## 诊断 / CLI

### #141 parser.ring:301 catch 触发 W0001「handler 永不执行」[low] [judgment] [open]

`some(self.parse_use_decl(false)) catch { _ => none }` 被 checker 判定无 fail effect。B-112 把 warnings 接到出口后，每次 self-compile stderr 打 12 条（parser 5 + infer 5 + infer_register 1 + infer_decl 1）。**已确认（2026-06-15）：`parse_use_decl` 确实可 fail**（`expect` → `error` → `__ring_raise_fail`），W0001 是假阳性。根因 = impl 方法 effect 传播限制——同 impl 块内方法全部检查完才 `update_fn_effects`，中间方法的 fail effect 对后续方法不可见。给 `extern fn __ring_raise_fail` 加 `with {fail}` 只解决直接调用者，间接链仍断裂。**修复需 checker 架构改造**（impl 方法逐个检查 + 逐个更新 effect，或多轮固定点），非 S 级。发现者：B-112。

<!-- #142 --error-format=llm 多文件已修复并删除（2026-06-15）：error_format 从 cli.ring plumb 到 resolver/compiler_mod，所有 format_human 调用点加 llm 分支。回归 2 个 E2E 测试。 -->

<!-- #143 closed: E0105 注册 codes.ring + parser 改用常量，2026-06-13 -->

<!-- #144 closed: 单文件 run 实现 + 临时文件清理，2026-06-15 -->

## 代码质量 / 可维护性

<!-- #6 runtime.ring push 重构已落地并删除（2026-06-15）：~240 个 push 调用合并为 ~30 个 raw string 块，生成 JS 字节一致。 -->

### #7 `infer.ring` 2826 行单文件 [low] [judgment] [open]

编译器最大单文件，从 2565→2763→2826 行持续增长。应拆分为 infer_stmt/infer_expr/infer。





## 架构债

### #16 StructType/EnumType 携带冗余 fields/variants 数据 [low] [judgment] [open] [deferred: LLVM]

类型表示不一致。应改为 nominal 表示。

**决策（2026-05-23）**：长期容忍，与 #45 一并推迟到 LLVM 后端阶段。改 nominal 表示（只存 `name + type_args`，fields 走 registry 查）后，#45（apply_subst 不递归 fields）/ 原 #108（occurs check 不查 fields——2026-06-03 贴码核为正确 nominal 语义非 bug 已 wontfix 删除：fields/variants 是声明模板，环只能经 type_params 形成、occurs check 已覆盖，递归查模板 var 反而误判）随之一并消解——它们都是当前 fields-as-template 表示的衍生现象。

<!-- #19 closed: Ring 已有编译期 match 穷尽检查，原诉求（assertNever）已被语言特性覆盖，2026-06-15 -->
<!-- #20 closed: D2 结论"不立项"——visitor 对 RC/verifier 不适用，叶子谓词已共享（git efe6054），2026-06-15 -->

## Delegate 完整性（2026-05-23 审计发现）


### #93 Delegate expansion 绕过类型推断直接合成 HIR [low] [judgment] [open]

`expand_delegate_impls` 直接合成 `HDecl::Fn`（HIR），绕过 `check_fn_decl` 的推断流程。当前所有被委托的 trait（Eq/Clone/Ord/Debug）均为无 effect 纯函数，因此无实际影响。但未来 `delegate` 用于带 effect 的自定义 trait 时，合成的 forwarding call 的 effect 仅取自 trait 声明而非实际推断，可能导致 effect 不匹配。

**#77 修复后的状态更新（2026-05-24）**：#77 修复了 `register_trait` 丢弃 `declared_effects` 的根因，trait 方法的 FnType 现在正确携带 effect 信息。同时修复了 dict dispatch 的 evidence 转发。因此 delegate expansion 合成的 forwarding call 现在能拿到正确的 effect 签名。但 expansion 仍绕过推断流程（直接合成 HIR），对于带复杂 effect 的 trait method，合成的 effect 可能与实际推断结果有细微差异。风险降低但架构问题仍在。

**文件**：`compiler/infer_decl.ring`（`expand_delegate_impls`）
**修复方向**：让合成的 forwarding 方法走完整的类型推断流程，或在合成时从实际 impl 的推断结果获取 effect 信息。

发现者：Opus

### #123 Delegate dict dispatch effect 转发在 catch 块内可能不足 [low] [judgment] [open]

`get_callee_evidence_args`（`codegen_expr.ring:352-393`）有两个路径：(1) callee_type 路径——从 FnType 提取 effect 并返回 evidence params；(2) callee_name 路径——从 `local_fn_effects` 查找实际 effect 并检查 `ctx.in_try_fail`。Delegate 的 dict dispatch 走路径 (1)（callee_name 为 `none`），其效应从 trait method 的 FnType 推导。路径 (1) 不检查 `ctx.in_try_fail`，这意味着如果在 `catch` 块内对 delegate field 调用带 `fail` 的 trait 方法，且该 `fail` effect 的 evidence 依赖 catch 上下文，evidence 可能不完整。当前实践中难触发—默认 trait（Eq/Clone/Ord/Debug）均无 `fail` effect，#77 修复后 trait method FnType 也正确携带 effect 信息。

**文件**：`compiler/codegen_expr.ring:352-360`
**修复方向**：在 callee_type 路径中也注入 `ctx.in_try_fail` 的 `fail` evidence（与 callee_name 路径一致）。

发现者：Opus




### #122 `gen_handle_body` IIFE 仅传递 handled effects 的 evidence，未 handling 的依赖闭包 [low] [judgment] [open]

`gen_handle_body`（`codegen_expr.ring:1421-1444`）的 IIFE 仅传 `by_effect.entries()` 中的 evidence params。若 body 中有 effect op 对应 unhandled effect（带默认 handler 但不在当前 `handle...with` 列表中），该 evidence 需通过 JS 闭包从外部作用域解析。嵌套 handle 时中间作用域若不保留 evidence 变量，闭包链可能断裂。

**文件**：`compiler/codegen_expr.ring:1421-1444`
**修复方向**：将 body 的 HExpr 中所有涉及 effects 的 evidence 都传入 IIFE（不仅是 handled effects），确保显式 evidence 访问不依赖闭包链。

发现者：Opus


## 设计-实现差距（参考，已在 backlog 跟踪）

> 以下为未实现特性的跟踪参考，不作为 Worker 任务源。实际实现由 backlog 对应条目驱动。

| # | 设计功能 | Backlog 对应 | 状态 |
|---|----------|--------------|------|
| 36 | Refinement types (where 子句) | B-001 | 语法解析但语义忽略 |
| 37 | `mut<S>` 参数化 effect | B-037 | ✅ 已实现（调用点注入） |
| 38 | Post-resume handler / Full AE | 已取消 (B-009) | 不实现 |
| 39 | `dyn Trait` 动态分发 | B-006 | 未实现 |
| 40 | Supertrait 继承 | B-005 | ✅ 已实现 |
| 41 | 关联类型 | B-004 | ✅ 已实现 |
