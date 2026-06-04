# Audit Report

> 活的 bug 看板。修复后删除条目，只在 git commit message 留记录。
> 条目格式：`### #xxx <标题> [严重度] [dispatch] [状态]`
> dispatch 标记：`mechanical`（DS 可执行）/ `judgment`（Claude 执行）
> 状态流转：`open` → `doing` → 删除
> 工作流规范见 `docs/workflow.md`

---

## 🔴 Critical（阻塞 native 自举）

### #134 native 二进制运行时 RC 损坏 — 系统性 L0 borrow-vs-own 缺口 [Critical] [judgment] [open]

**首次实跑 native 二进制即暴露**——历史只验过 `--target=llvm` 的 `.o` 生成 EXIT 0，从未运行过链接后的 `ring.exe`。native 二进制自 self-hosting 初期就一直崩、从未成功运行过。

**⚠️ 原"dropped boxing / 裸 int 57"假设已证伪**：那是更早一个 RC 损坏（次生堆破坏后 unbox 读到垃圾）的表象。深挖根因 = **系统性 L0 所有权模型缺口**：读取（字段访问 `gen_field_access`、容器元素 `ring_list_get`/`map_get`）按 **borrow（不 dup）** 返回，但 L0 的 callee-owns 约定（`transform_fn_body` 在退出 drop 未消费的参数）+ 绑定/struct 字段/返回/push 都取所有权 → 借用值流入 owned 槽位即被**双 free**。`fn main(){}` 也崩因编译器先解析含 extern fn 的 prelude。

**进展（2026-06-04，Worker 持续修复，7 个 RC 缺陷已修，chk 144→347K，约 2400×）**：
已修并提交（`82c472e` 5 连修 + `36e6c98`）；全程 JS E2E 731/731 · llvm_diff 49/49 ×3 零回归：
1. **perceus 分支平衡漏发散分支**（`balance_branch` 对 return/break/continue 结尾分支也插平衡 drop，发散分支已自清理 → 重复 drop 后 dup UAF）。新增 `expr_diverges`，4 个 balance 点跳过发散分支。
2. **Return handler drop-all-live 用 `r.live` 误 drop 被 move 进返回值的 var**（`return make_token(..,end)`）。改用 incoming `live`。
3. **boxed_vars 跨模块 def_id 冲突**（def_id 仅模块内唯一，LLVM 后端全局 union → `code_in_range` 的 `high` 误判 boxed → 双 unbox）。改 per-module。
4. **字段访问 borrow 逃逸**：`gen_field_access` 统一 dup 返回值。
5. **容器元素读取 borrow**：`ring_list_get`/`_opt`/`map_get(_opt)`/`map_int_get(_opt)`/`map_values`/`map_entries` 返回时 dup。
6. **read-then-reassign 可变变量 double-free**（`parse_expr_bp` 的 `last_was_comparison`）：Assign drop 旧值时把 target 加入返回 live → 之前读取改 dup。

**仍残留（同一系统性根因的其余表现，B-068 借用推断范畴）**：
- 当前确定性崩点：`register_impl_method`（chk=347204，tid-103=**`Type`** double-drop，已用 `RING_DUMP_TIDS` 环境变量 + ring.map 确认）。**精确根因**：`self_type`（Type）在 `for p in params` 循环体的 `none => if p.name=="self" { param_types.push(self_type) }` 里**条件 consume**；分支平衡给 else 分支插 `drop(self_type)`（对单次 if/else 正确）。但循环内：迭代0(self)consume 了它，迭代1+(非self)的 else 又 drop → double-free。Perceus 的循环保守 dup（`ForIn`/`While` handler）只对「循环后仍 live」的 loop_var 插 pre-loop dup，**没覆盖「循环内被条件 consume」的值**——需扩展为 per-iteration dup（类似 closure-capture 处理）。属深层 Perceus 循环语义手术，有回归风险。
- 还会有更多：mut-param 跨模块所有权语义、方法接收者借用、更多条件/循环 move。
- **本质 = 完成 L0 所有权模型**。两条路：(a) 继续逐点 "always-own" sweep（每个读取/move 站点补 dup/修 liveness，已覆盖字段+容器+read-reassign，收敛中但站点多、且 move-analysis 类需逐个 Perceus 改）；(b) 正式做 **B-068 借用推断**（一次性区分 borrow/owned，消除全部 dup 与泄漏）。**(a)/(b) 取舍需用户定**——见 worker_feedback.md。

**代价说明**：当前 "always-own" 修复在 borrow 位置（算术/条件操作数、只读 for-in 绑定）会泄漏（L0 correct-over-leak 容忍，B-068 后消除）。

**复现**：`build compiler/main.ring --target=llvm --out-dir=compiler/dist-llvm` → `clang dist-llvm/main.o ring_runtime.o -o ring.exe -lmsvcrt -Wl,/STACK:536870912 -Wl,/MAP:ring.map` → `ring.exe build tmp134/a_empty.ring`（`fn main(){}`，确定性崩 chk=347204）。`ring_runtime.cpp` 已含 #134 调试仪表（栈回溯 `dump_rc_backtrace`、保留 freed typeid、guard 打印 chk/caller-rva，仅 abort 路径，native 工作后清理）。RVA→Ring 函数用 `ring.map`（lld /MAP）查。

**阻塞**：B-089 G-a/b/c（内存峰值、双 bootstrap、native E2E）全部待此解锁。

**附带（架构 gap，非本 bug）**：`build compiler/main.ring --target=llvm` 有 `LLVMBuildRet` 等 LLVM-C extern fn 被塞 panic stub——native 二进制无法自托管 LLVM 后端（`--target=llvm` 路径 panic），完整 native 自举需 native 直接 link LLVM-C。单列待规划。

发现者：Worker（#133 修复后 B-089 G-a 首次本机实跑 native；2026-06-04 7 修推进）

## Checker



### #45 `StructType`/`EnumType` 在 `apply_subst` 中不替换 fields [low] [judgment] [open] [deferred: LLVM]

设计约束：fields 是模板字段（含递归引用），递归替换会导致 `Node<T>` 等递归类型栈溢出。当前 `infer_field_access` 的 inst_map 兜底是正确设计。如需修复需改为 nominal 表示（关联 #16）。

**决策（2026-05-23）**：长期容忍。当前方案正确且无性能问题，改动大（L-XL）收益主要在未来后端。等 LLVM 后端需要时与 #16 一并重构。

### #108 Occurs check 对 StructType/EnumType 仅检查 type_params [low] [judgment] [wontfix]

`occurs_in`（`unify.ring:55-58`）只递归 `type_params`，不查 `fields`/`variants`——经 2026-06-03 Discussion 贴码核查，确认这是**正确的 nominal 语义，非 bug**。

`StructType.fields`/`EnumType.variants` 自始至终是**声明模板**：`apply_subst` 原样保留 fields（`env.ring:525-536`），字段类型实例化走**局部 `inst_map`** 在读字段时进行、不写回（`infer_ctx.ring:1206/1319/1343`、`infer.ring:2166`）；类型相等也只比 `name + type_params`（`types.ring:319-325`，identity 已是 nominal）。因此无限类型的环只能经 `type_params` 形成（实例化传入的实际类型），occurs check **已覆盖**；fields 里是声明模板 var（与查询 var 不同 id），递归查反而误判。

原 B-057「同时补 occurs_in + apply_subst 的 fields 遍历」基于误解已撤销：补 `apply_subst` → 递归类型栈溢出（见 #45）；补 `occurs_in` → 误判模板 var。真正的表示统一是 **#16 nominal 重构**（已 deferred），届时此条自然消解。

发现者：Opus







## Codegen

### #28 HOF inline 代码在 List/Map/Set/Option 间重复 [low] [mechanical] [open]

~100 行重复。应抽象迭代模式。

### #29 Runtime 耦合 Node.js ESM（createRequire）[low] [judgment] [open]

可移植性问题。

### #132 LLVM `ring_print` 对非 Str 实参不做强制转换（双后端 parity gap）[medium] [judgment] [open]

**文件**：`ring_runtime.cpp`（`ring_print`）、`compiler/codegen_llvm_expr.ring`（print 调用 lowering）
**描述**：JS 后端 `print(x)` 对任意类型字符串化（Int/Float/Bool → 文本），LLVM 后端 `ring_print` 期望实参已是 `Str`，对 Int 等不做 Int→Str 强制转换，`print(intExpr)` 误打印。B-091 实现中发现（其测试改用 `print("${x}")` 字符串插值绕过，与现有 llvm 用例一致）。属 G-c 双后端 parity，可并入 B-087 一并修。
**修复方向**：LLVM print lowering 对非 Str 实参插入 to_string 转换（对照 JS codegen 字符串化路径），或 runtime `ring_print` 按 typeid 分派打印。
发现者：Worker Wave 4（B-091）

> #130（闭包 env 捕获泄漏）/ #131（perceus drop 落不了地，96 rc-warn）已于 2026-06-03 并入 backlog **B-084**（Perceus drop 精度 + drop_T 完整性），详见 backlog。





## 代码质量 / 可维护性

### #6 `runtime.ring` 用数百个 `.push()` 拼接 JS 运行时代码 [low] [mechanical] [open]

应改用 raw string 或外部 .js 文件。

### #7 `infer.ring` 2826 行单文件 [low] [judgment] [open]

编译器最大单文件，从 2565→2763→2826 行持续增长。应拆分为 infer_stmt/infer_expr/infer。





## 架构债

### #16 StructType/EnumType 携带冗余 fields/variants 数据 [low] [judgment] [open] [deferred: LLVM]

类型表示不一致。应改为 nominal 表示。

**决策（2026-05-23）**：长期容忍，与 #45 一并推迟到 LLVM 后端阶段。改 nominal 表示（只存 `name + type_args`，fields 走 registry 查）后，#45（apply_subst 不递归 fields）/ #108（occurs check 不查 fields）随之一并消解——它们都是当前 fields-as-template 表示的衍生现象。

### #19 Ring 编译器缺少 `assertNever` 等效编译期保护 [low] [mechanical] [open]

新 variant 易遗漏。应确保所有 match 穷尽。

### #20 HExpr/HStmt match 在 5+ pass 中重复 [low] [judgment] [open]

维护负担。应扩展 hir-visitor。

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

### #103 Auto-boxing 仅 box 值类型依赖 JS 引用语义 [medium] [judgment] [open] [deferred: LLVM]

B-047 实现中，`mut` 参数的自动 boxing 仅针对值类型（Int/Float/Bool/Str）。引用类型（struct/List/Map/Set）的 `mut` 参数不 box，依赖 JS 按引用传递对象的语义。LLVM 后端无此语义——所有类型需要统一的 boxing/pointer 策略。

**已知限制**：引用类型 `mut` 参数的重赋值（`list = new_list`）不会反映到调用方。

**文件**：`compiler/codegen_stmt.ring`、`compiler/codegen_expr.ring`（auto-boxing 相关逻辑）
**修复方向**：LLVM 后端实现时，所有 `mut` 参数统一使用指针传递。JS 后端保持现状。

**2026-06-03**：纳入 backlog **B-087**（LLVM codegen 双后端 parity），作为 G-c parity 的一部分落地，解除 deferred-LLVM 状态。

发现者：Worker Wave A+B







### #122 `gen_handle_body` IIFE 仅传递 handled effects 的 evidence，未 handling 的依赖闭包 [low] [judgment] [open]

`gen_handle_body`（`codegen_expr.ring:1421-1444`）的 IIFE 仅传 `by_effect.entries()` 中的 evidence params。若 body 中有 effect op 对应 unhandled effect（带默认 handler 但不在当前 `handle...with` 列表中），该 evidence 需通过 JS 闭包从外部作用域解析。嵌套 handle 时中间作用域若不保留 evidence 变量，闭包链可能断裂。

**文件**：`compiler/codegen_expr.ring:1421-1444`
**修复方向**：将 body 的 HExpr 中所有涉及 effects 的 evidence 都传入 IIFE（不仅是 handled effects），确保显式 evidence 访问不依赖闭包链。

发现者：Opus


## 模块/诊断





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
