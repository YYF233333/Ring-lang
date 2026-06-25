# Audit Report

> 活的 bug 看板。修复后删除条目，只在 git commit message 留记录。
> 条目格式：`### #xxx <标题> [严重度] [dispatch] [状态]`
> dispatch 标记：`mechanical`（DS 可执行）/ `judgment`（Claude 执行）
> 状态流转：`open` → `doing` → 删除
> 工作流规范见 `docs/workflow.md`

---

## LLVM Codegen

### #158 ~~字符串操作系统性字节 vs 字符索引分歧~~ [medium] [judgment] [closed — B-133 跟踪]

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


### #161 Str <= / Str >= LLVM codegen panic [medium] [mechanical] [doing]

`gen_str_binop`（`codegen_llvm_expr.ring:913`）只处理 `Eq/Neq/Lt/Gt`，`Lte` 和 `Gte` 落入 `_ => panic("LLVM codegen: unsupported str binop")`。checker 允许所有比较操作符作用于 Str（`infer.ring:878` + `is_primitive_ord` 对 StrType 返回 true）。

**影响**：`str_a <= str_b` 类型检查通过但 LLVM 编译阶段 panic。JS 后端正确。

**修复**：添加 `BinOp::Lte => negate(ring_str_lt(rhs, lhs))` 和 `BinOp::Gte => negate(ring_str_lt(lhs, rhs))`。

发现者：Opus（codegen audit + cross-validation confirmed）

### #162 Match string literal pattern 泄漏临时字符串 [medium] [mechanical] [open]

`gen_literal_pattern_cond`（`codegen_llvm_expr.ring:4244-4249`）为 `StrVal` pattern 调用 `gen_str_lit` 分配堆字符串（RC=1），`ring_str_eq` 比较后从未 drop。Perceus 无法追踪此路径（pattern 条件在 LLVM codegen 内部生成，不在 HIR 表达式作用域内）。循环中的 string match 每次评估泄漏一个 RingStr。

**修复**：`ring_str_eq` 调用后 emit `ring_drop(lit_str)`。对照 `gen_string_interp`（line 3023）正确 drop 其字面字符串。

发现者：Opus+Opus（codegen + RC/safety 两路独立发现）

### #163 Float Identity derive 对 Float box 调用 ring_str_eq — 类型混淆 UB [medium] [mechanical] [open]

`derive.ring:256` 将 `FloatType => FieldAction::Identity`。LLVM codegen 的 `emit_identity_eq_cmp`（`codegen_llvm_decl.ring:1451-1456`）heap 路径对非 tagged 值调用 `ring_str_eq`，假设是 Str。Float 经 `ring_box_float` 堆分配无 tag bit，命中 heap 路径——将 `double*` 当 `std::string*` 解引用，是 UB。

**影响**：当前 latent——代码库中无含 Float 字段的 struct derive Eq。用户写 `struct Point { x: Float }` 并 derive Eq 即触发。同样影响 `emit_identity_cmp`（Ord）和 `emit_identity_to_debug_str`（Debug）。

**修复**：新增 `FieldAction::FloatIdentity`（或等价）→ codegen 用 `ring_unbox_float` + `LLVMBuildFCmp`。方向唯一。

发现者：Opus（codegen audit）

### #164 Dict struct 类型硬编码 4 方法 slot — trait 5+ 方法时 LLVM UB [medium] [mechanical] [open]

`gen_dict_dispatch_call`（`codegen_llvm_expr.ring:1676`）和 `load_dict_method`（`:699`）使用硬编码 `{ i64, ptr, ptr, ptr, ptr }` struct 类型（最多 GEP index 4）。trait 有 5+ 方法时 `LLVMBuildStructGEP2` 越界——LLVM IR 级 UB。`build_wrapped_dict` 已正确使用动态方法数。

**影响**：当前 latent——代码库最大 trait 方法数 = 3（DiagnosticSink）。用户定义 5+ 方法 trait 即触发。

**修复**：从 `ctx.trait_method_order[trait_name].len()` 动态构建 struct 类型，对齐 `build_wrapped_dict`。

发现者：Opus+Opus（codegen + RC/safety 两路独立发现）

### #166 ~~longjmp 跳过 C++ 析构函数~~ [medium] [closed — RIIR 会去掉 C++ runtime]

RIIR（B-125 之后用纯 Ring + `Ptr<T>` 重写 runtime）将消除 C++ RAII 对象，longjmp 不再有析构跳过问题。不单独修复。

发现者：Opus（RC/safety audit）

### #173 handle/try 内 return 跳过 evidence cleanup 和 catch stack pop [medium] [mechanical] [open]

`gen_handle_expr`（`codegen_llvm_expr.ring:5577`）中如果 body 包含 `return` 语句，`emit_return` 发射 `LLVMBuildRet` 并创建死 `after.ret` block。后续的 `ring_catch_pop()`、`emit_evidence_drops()`、`LLVMBuildBr(merge_bb)` 全部落入不可达代码——函数返回时 catch 帧未 pop（破坏调用者后续 try/catch 栈）且 evidence 结构体泄漏。同样影响 `gen_try_catch`（line 5129-5132）。

**影响**：当前 latent——编译器自身和测试中无 handle/try body 内使用 return。但 checker 不禁止此语法，用户代码可触发。

**设计决策（2026-06-25）**：return 的自然语义 = "effect 没有触发，正常退出 handle 结构"。类比 Python try/finally：return 时 finally 保证执行。

**修复**：`emit_return` 检测当前是否在 handle/try 上下文内（维护 cleanup 栈），若是则先 emit cleanup（`ring_catch_pop` + `emit_evidence_drops`）再 `LLVMBuildRet`。需追踪嵌套 handle/try 深度。

发现者：DS（独立发现）+ Opus（cross-validation confirmed）

### #174 Wrapped dict thunk evidence 参数与 inner dict 参数顺序交叉 [medium] [mechanical] [open]

`build_wrapped_dict_typed`（`codegen_llvm_expr.ring:1506-1507`）计算 `dispatch_arity = LLVMCountParams(method_fn) - inner_count`，仅减去 inner dict 数量，未减 evidence 参数。thunk 转发顺序为 `(regular..., evidence..., inner_dicts...)`，但实际方法签名期望 `(regular..., inner_dicts..., evidence...)`——当 `inner_count > 0` 且有 evidence 参数时，dict 和 evidence 位置交叉，传参错误。

**影响**：当前 latent——所有现用 trait 方法（Eq/Ord/Clone/Debug）无 effect（无 evidence），不触发。用户定义含 effect 的 trait 方法 + 需要 inner dict 时触发。

**修复**：thunk 构建时也减去 evidence 参数数量，或者调整转发顺序对齐方法签名的参数布局。方向唯一。

发现者：DS（独立发现）+ Opus（cross-validation confirmed）

### #168 Missing Float % Float LLVM codegen — panic [low] [mechanical] [doing]

`gen_float_binop`（`codegen_llvm_expr.ring:880`）处理 `Add/Sub/Mul/Div` 和比较，但缺 `Mod`。checker 不拒绝 `%` on floats，`1.5 % 0.5` 在 JS 编译通过但 LLVM codegen panic。

**修复**：添加 `BinOp::Mod => LLVMBuildFRem(ctx.builder, lhs_raw, rhs_raw, ...)`。

发现者：Opus（codegen audit）

### #169 Debug Identity 对 Bool 渲染为 "0"/"1" 而非 "true"/"false" [low] [mechanical] [open]

`emit_identity_to_debug_str`（`codegen_llvm_decl.ring:2366-2404`）仅检查 tag bit，Bool 和 Int 同走 `ring_int_to_str` 路径。`true` 渲染为 "1"，`false` 为 "0"。JS 后端用 `String(val)` 产出 "true"/"false"。

**修复**：对 Bool 值（范围 0-1）分流到 `ring_bool_to_str`。

发现者：Opus（codegen audit）


### #172 单文件 generate_llvm 跳过 LLVMVerifyModule [low] [mechanical] [open]

`codegen_llvm.ring:1547-1557`：单文件 codegen 路径在 `LLVMRunPasses` 前跳过模块验证。多模块 `generate_llvm_project`（line 1733）有验证。无效 IR 传入优化器可导致难调试的崩溃。

**修复**：在 `LLVMRunPasses` 前添加 `LLVMVerifyModule(module, 2)`。

发现者：Opus（codegen audit）


### #176 LLVM codegen match/if-let catch-all 将未识别 pattern 类型视为 irrefutable [low] [mechanical] [open]

`codegen_llvm_expr.ring:3931-3950` 和 `codegen_llvm_stmt.ring:861-874` 的 match wildcard 分支对未识别 pattern 类型无条件跳转到 arm body。当前安全（编译器穷尽检查保证只有合法 pattern），但 HIR 扩展新 pattern 类型时会静默匹配而非 panic。

**修复**：wildcard 分支改为 `panic("LLVM codegen: unsupported pattern type")`。

发现者：DS（独立发现）

### #177 scan_fn_effects 以裸方法名存储 impl 方法 effects — 碰撞风险 [low] [mechanical] [open]

`codegen_llvm.ring:974-984` 中两个不同 impl 块同名方法会在 `local_fn_effects` 中覆盖彼此。

**修复**：key 改为 `"${target_type}_${method_name}"`。

发现者：Opus（codegen audit）

### #178 深层嵌套泛型 struct Eq 总返回 false [medium] [judgment] [open]

3 层泛型 struct 嵌套（`A_outer<T>` → `B_mid<T>` → `C_inner<T>`）的 auto-derive Eq 在 LLVM 后端总返回 `false`。Round 2 修复了泛型 derive 的 dict params 传递（1 层），但多层嵌套的 dict 链传递仍有问题。

**复现**：`tests/cases/llvm/adversarial_regress_generic_derive_deep.ring`（LLVM output 所有 `==` 返回 false）

**根因方向**：`codegen_llvm_decl.ring` 的 `resolve_dict_for_derived` 在嵌套调用时可能取到外层的 dict 而非当前层的。需要跟踪 dict 在多层 derive 调用中的传递路径。

发现者：Phase 1.3 Round 3 对抗回归测试


### #180 泛型函数 catch 路径返回 Str 时输出 garbage pointer [medium] [judgment] [open]

`fn extract<T: Eq>(input: Input<T>, fallback: T) -> T` 中 `T=Str` + catch arm 返回 Str 时，LLVM 输出 raw pointer 数字而非字符串。`T=Int` 正常。可能是 Round 2 的 Never 类型 fix 的残留边角，或 catch path 的返回值 boxing 问题。

**复现**：`tests/cases/llvm/adversarial_regress_never_match_arms.ring`（T11/T12 输出 garbage）

发现者：Phase 1.3 Round 3 对抗回归测试

### #181 Int literal or-pattern 在 LLVM codegen crash [medium] [mechanical] [open]

`match n { 0 | 1 => "small", _ => "big" }` 在 `--target=llvm` 编译时 crash（exit code 5）。Enum variant or-pattern 正常。仅 Int literal or-pattern 触发。

**复现**：`match n: Int { 0 | 1 => ... }` 编译即崩

**修复方向**：`codegen_llvm_expr.ring` 的 or-pattern 处理只考虑了 enum variant（`LLVMAddCase` per variant tag），未处理 literal pattern。需对 `Pattern::OrPattern` 中的 `Pattern::Literal` 子模式生成 `icmp` + `or` 条件链。

发现者：Phase 1.3 Round 3 对抗测试（全新角度）

### #29 Runtime 耦合 Node.js ESM（createRequire）[low] [judgment] [open]

可移植性问题。

### #138 Map/Set clone 方法语法在 native 落 panic-stub [low] [judgment] [open] [latent]

**已修复（2026-06-25）**：Map.fold/Set.fold/Map.filter/Map.any/Map.map_values/Set.filter/Set.any/Set.all 全部实现 runtime + 映射。

**残留（latent）**：str-keyed `Map.clone()` / `List.clone()` / `Set.clone()` 方法语法（int-keyed 有映射、str-keyed 落空；直呼 `map_clone(m)` 经 `ring_` fallback 正常）。发现者：B-103 Wave A。


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
