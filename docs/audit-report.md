# Audit Report

> 活的 bug 看板。修复后删除条目，只在 git commit message 留记录。
> 条目格式：`### #xxx <标题> [严重度] [dispatch] [状态]`
> dispatch 标记：`mechanical`（DS 可执行）/ `judgment`（Claude 执行）
> 状态流转：`open` → `doing` → 删除
> 工作流规范见 `docs/workflow.md`

---

## 前端

### #181 Tarjan SCC index_counter 值类型语义导致索引冲突 [critical] [judgment] [doing]

`scc.ring:531-587` 的 `tarjan_strongconnect` 将 `mut index_counter: Int` 作为参数传递。Int 是值类型，`mut` 只允许本地修改——递归调用的计数器增量不会回传给调用者。导致兄弟子树中的节点获得相同的 index 值。

**具体反例**：图 `A → [B, C], B → E, C → E, E → A`

- 正确索引：A=0, B=1, E=2, C=3 → 正确 SCC = `{A, B, C, E}`
- 实际索引：A=0, B=1, E=2, C=1(与 B 冲突!) → C 的 lowlink(1)==index(1) 误判为 SCC root → 错误结果 `{C}` + `{A, B, E}`

**影响**：`tarjan_scc` 在 `infer_decl.ring:665`（impl 方法排序）和 `infer_decl.ring:2022`（顶层函数 SCC）中使用。错误的 SCC 分组导致函数以错误顺序类型检查，可能造成类型推断失败或 effect 传播遗漏。尚未观察到实际症状，但特定的依赖图拓扑**一定会触发**。

**修复**：将 `mut index_counter: Int` 改为 `List<Int>`（长度 1），与 `dict_lower.ring:51,159` 使用的共享计数器模式一致。读取用 `counter[0]`，递增用 `counter.set(0, counter[0] + 1)`。

发现者：Opus（前端审计）

### #197 resolve_fn_type_effect 与 resolve_effect_expr 逻辑分叉风险 [low] [mechanical] [open]

`infer_ctx.ring:1076-1103` 的 `resolve_fn_type_effect` 与 `infer_register.ring:1160-1202` 的 `resolve_effect_expr` 实现相同的 effect 解析逻辑（io/mut/fail/自定义 effect）。两份代码独立维护，`resolve_fn_type_effect` 缺少对未知自定义 effect 的错误诊断。修一个忘改另一个会导致 FnType 注解与运行时 effect 匹配出现不一致。

**修复**：让 `resolve_fn_type_effect` 调用已 pub 的 `resolve_effect_expr`，或提取共享逻辑。

发现者：Opus（前端审计）

### #198 Parser 不支持负数字面量 pattern [low] [judgment] [open]

`parser.ring:1792-1928` 的 `parse_pattern` 处理 `TkIntLit` 和 `TkFloatLit`，但不处理前导 `TkMinus` + 数字字面量组合。`match x { -1 => ... }` 会产生 parse error。用户可通过 guard 或变量绑定 workaround，但这是常见的预期语法。

**修复**：在 `parse_pattern` 开头检查 `TkMinus` + `TkIntLit`/`TkFloatLit`，消费两个 token 生成 negated `Pattern::Literal`。需讨论是否作为当前优先级的特性实现。

发现者：Opus（前端审计）

---

## LLVM Codegen

### #173 handle/try 内 return 跳过 evidence cleanup 和 catch stack pop [medium] [judgment] [doing]

`gen_handle_expr`（`codegen_llvm_expr.ring:5577`）中如果 body 包含 `return` 语句，`emit_return` 发射 `LLVMBuildRet` 并创建死 `after.ret` block。后续的 `ring_catch_pop()`、`emit_evidence_drops()`、`LLVMBuildBr(merge_bb)` 全部落入不可达代码——函数返回时 catch 帧未 pop（破坏调用者后续 try/catch 栈）且 evidence 结构体泄漏。同样影响 `gen_try_catch`（line 5129-5132）。

**影响**：当前 latent——编译器自身和测试中无 handle/try body 内使用 return。但 checker 不禁止此语法，用户代码可触发。

**设计决策（2026-06-25）**：return 的自然语义 = "effect 没有触发，正常退出 handle 结构"。类比 Python try/finally：return 时 finally 保证执行。

**修复**：`emit_return` 检测当前是否在 handle/try 上下文内（维护 cleanup 栈），若是则先 emit cleanup（`ring_catch_pop` + `emit_evidence_drops`）再 `LLVMBuildRet`。需追踪嵌套 handle/try 深度。

发现者：DS（独立发现）+ Opus（cross-validation confirmed）


### #180 泛型函数 catch 路径返回 Str 时输出 garbage pointer [medium] [judgment] [doing]

`fn extract<T: Eq>(input: Input<T>, fallback: T) -> T` 中 `T=Str` + catch arm 返回 Str 时，LLVM 输出 raw pointer 数字而非字符串。`T=Int` 正常。可能是 Round 2 的 Never 类型 fix 的残留边角，或 catch path 的返回值 boxing 问题。

**复现**：`tests/cases/llvm/adversarial_regress_never_match_arms.ring`（T11/T12 输出 garbage）

发现者：Phase 1.3 Round 3 对抗回归测试

### #182 LLVMSetDataLayout 未调用 [medium] [mechanical] [doing]

`codegen_llvm.ring:1443` 和 `1607` 调用 `LLVMSetTarget` 设置 target triple，但从未调用 `LLVMSetDataLayout`。`LLVMSetDataLayout` 在 `llvm_ffi.ring:46` 和 `codegen_llvm.ring:33` 都有声明但从未被调用。缺少 data layout 时 `LLVMSizeOf`（25+ 处调用）返回基于默认布局的值，可能与实际 ABI 不一致。当前 native 自编译正常工作（默认布局对 x86_64 + 全指针类型碰巧正确），但跨平台或优化器推理可能出错。

**修复**：在 `LLVMSetTarget` 后从 `LLVMCreateTargetMachine` 结果提取 data layout 并设置到 module。需在 FFI 中补充 `LLVMCreateTargetDataLayout` 和 `LLVMCopyStringRepOfTargetData`。

发现者：Opus（LLVM 审计）

### #183 RetIntToBoxed 使用 ZExt 而非 SExt [medium] [mechanical] [open]

`codegen_llvm_expr.ring:1978-1981` 将 C int (i32) 返回值扩展为 Ring Int (i64) 时使用 `LLVMBuildZExt`（零扩展），注释写的是 "sext to i64"。对返回负值的 C 函数，零扩展会产生错误的大正数。当前 LLVM-C 函数返回 int 只返回 0/1（LLVMBool），所以是 latent。`LLVMBuildSExt` 未在任何 `.ring` 文件中声明。

**修复**：在 `llvm_ffi.ring` 中声明 `LLVMBuildSExt`，替换 `codegen_llvm_expr.ring:1980` 的 `LLVMBuildZExt`。

发现者：Opus（LLVM 审计）

### #184 字符串插值 fallback 将非基本类型当 Int 处理 [medium] [mechanical] [open]

`codegen_llvm_expr.ring:3157-3164` 的 `convert_to_str` 对 Str/Int/Float/Bool 之外的类型，fallback 调用 `unbox_int(val)`（`ptrtoint >> 1`）再 `ring_int_to_str`。对 struct/enum/list/option 值做字符串插值 `"${my_struct}"` 时会输出无意义的整数而非有意义的表示。

**即时修复（2026-06-25 Discussion 拍板）**：checker 阶段对非 Str/Int/Float/Bool 类型的字符串插值报编译错误。后续 B-149 Display trait 实现后放宽为"要求 Display impl"。

发现者：Opus（LLVM 审计）

### #185 ring_unbox_float 缺少 null 检查 [medium] [mechanical] [doing]

`ring_runtime.cpp:629-631` 的 `ring_unbox_float` 直接 `return *(double*)p;` 无 null guard。对比 `ring_unbox_int`（line 619）有 `if (!p) { fprintf(stderr, ...); exit(1); }` 保护。null float 指针到达此函数会导致 segfault。

**修复**：添加 `if (!p) { fprintf(stderr, "ring panic: unbox_float(null)\n"); exit(1); }`。

发现者：Opus（LLVM 审计）

### #186 LLVMGetTargetFromTriple 错误时静默继续 [medium] [judgment] [open]

`codegen_llvm_expr.ring:2019-2027` 中 `gen_extern_LLVMGetTargetFromTriple` 调用后未检查返回值。若 triple 无效，output alloca 保持 null，后续 LLVM API 调用 null target → segfault。注释承认 `// TODO: could emit a conditional panic here`。

**修复**：emit 条件分支检查返回值，非零则 panic 并输出错误消息。参考 `emit_divzero_guard` 模式。

发现者：Opus（LLVM 审计）+ DS（独立发现）

### #187 verify_rc ReturnExpr 未检查 enclosing owned bindings 的 drop [medium] [mechanical] [doing]

`verify_rc.ring:808-817` 中 `HExpr::ReturnExpr` arm 只消费返回值，不检查所有 enclosing owned bindings 是否已 drop。对比 `HStmt::Return`（line 1063-1078）有完整的 live-owned-binding 遍历检查。如果 Perceus pass 对 expression position 的 return 遗漏了 drop 插入，verifier 不会报告泄漏。

**修复**：将 `HStmt::Return` 的 live-owned-binding 检查逻辑复制到 `HExpr::ReturnExpr` arm。

发现者：Opus（LLVM 审计）

### #188 Lambda 捕获变量未找到时静默存入 null [medium] [judgment] [open]

`codegen_llvm_expr.ring:4797-4799` 中 `gen_lambda` 构造闭包环境时，若捕获变量在 `ctx.named_values` 中找不到，fallback 存入 `LLVMConstPointerNull`。Checker 保证捕获变量有效，所以正常情况下不触发。但若发生（codegen 与 checker 的 scope 不一致等边角），运行时使用 null 捕获值会 segfault，且无任何诊断信息。

**修复**：将 null fallback 替换为 codegen panic（`panic("LLVM codegen: captured variable not found: ${cap_name}")`），使问题在编译时暴露而非运行时静默崩溃。

发现者：DS（独立发现）

### #189 codegen_llvm_decl derive 四实现 ~1700 行结构性重复 [medium] [judgment] [open]

`codegen_llvm_decl.ring:988-2665` 中 Eq/Clone/Debug/Ord 四个 derive 实现共享极为相似的结构：函数创建（检查已有 → 构建参数类型 → LLVMAddFunction → 保存/恢复状态）重复 ~12 次，enum tag 加载、字段 GEP 遍历、StringBuilder 样板、closure dispatch 均为 copy-paste。

**重构方向**：
1. 提取 `emit_derived_fn_scaffold(ctx, mangled_name, param_count) -> (fn_val, entry_bb, saved_fn)` 统一前导/尾随
2. 提取 `load_enum_tag_and_switch(ctx, val, enum_info) -> (tag_val, switch_inst, merge_bb)` 统一 enum 分支
3. 复用 `codegen_llvm_expr.ring` 中的 `load_dict_method` + `gen_closure_call` 而非内联重实现

发现者：Opus（LLVM 审计）+ DS（独立发现 derive prologue 重复）

### #190 method_to_runtime 97 级嵌套 if-else 链 [medium] [mechanical] [open]

`codegen_llvm_expr.ring:2663-2778` 的 `method_to_runtime` 用 97 级嵌套 `if-else` 映射方法名到 runtime 函数名。同类模式：`extern_fn_to_runtime`（29 级）、`rt_method_returns_i64`（15 级）、`rt_method_returns_bool`（15 级）。每增加一个方法需在正确深度插入，括号错位极易出错。

**修复**：转换为 `Map<Str, Str>` 查表（单次初始化），或改为平坦 `if ... { return ... }` 链（无嵌套）。

发现者：Opus（LLVM 审计）+ DS（独立发现）

### #191 generate_llvm / generate_llvm_project ~95% 重复 [medium] [mechanical] [doing]

`codegen_llvm.ring:1429-1584` vs `1593-1771`：两个入口点重复了整个 LLVM 初始化、context 创建、类型缓存、pass pipeline、验证、emit、cleanup 序列（~180 行相同代码）。

**修复**：提取共享基础设施为 helper 函数（`init_llvm_ctx`、`finalize_llvm_module` 等），两个入口点调用。

发现者：Opus（LLVM 审计）

### #194 ring_get_builtin_dict substring 匹配有误匹配风险 [low] [mechanical] [doing]

`ring_runtime.cpp:3209-3245` 的 `ring_get_builtin_dict` 使用 `n.find("Ord")`、`n.find("Eq")`、`n.find("Str")` 做子串匹配。用户类型名含 "Ord"（如 "OrdinaryThing"）或 "Str"（如 "StringHelper"）会错误匹配到内置 dict。

**修复**：改为后缀匹配 `n.ends_with("_Ord")` 或前缀+后缀模式匹配 `__Type_Trait` 命名约定。

发现者：Opus（LLVM 审计）

### #195 emit_struct_debug_fn 缺少 field_idx < 0 guard [low] [mechanical] [doing]

`codegen_llvm_decl.ring:2302-2303`：`find_field_index` 找不到字段时返回 -1，直接用作 `LLVMBuildStructGEP2` 索引产生无效 IR。`emit_struct_eq_fn`（line 1154）和 `emit_struct_cmp_fn`（line 1736）正确检查了 `if field_idx < 0 { continue }`，debug fn 遗漏。

**修复**：添加 `if field_idx < 0 { continue }`，与 eq/cmp 一致。

发现者：Opus（LLVM 审计）+ DS（独立发现）

### #196 emit_derived_debug_llvm 无条件创建 trait dict [low] [mechanical] [doing]

`codegen_llvm_decl.ring:2201-2213`：`emit_derived_debug_llvm` 在 `di.struct_fields` 或 `di.enum_variants` 为 `none` 时不 emit debug 方法，但 line 2213 的 `emit_derived_trait_dict(ctx, type_name, "Debug")` 无条件执行。dict 会引用不存在的方法 → null closure slot → 运行时调用 crash。

**修复**：将 `emit_derived_trait_dict` 移入 `some(fields)`/`some(variants)` 分支内。

发现者：Opus（LLVM 审计）

### #203 get_builtin_typeid 死代码 [low] [mechanical] [doing]

`codegen_llvm_ctx.ring:355-377`：`pub fn get_builtin_typeid` 定义但从未被调用（全 `.ring` 文件 grep 确认）。且内部的 `Map<Int>` (11) 和 `Set<Int>` (12) typeid 映射与实际不一致。

**修复**：删除。

发现者：Opus（LLVM 审计）

### #204 RING_TYPEID 常量不一致——部分命名、部分裸数字 [low] [mechanical] [open]

`codegen_llvm_expr.ring` 中部分 typeid 用命名常量（`RING_TYPEID_DICT_STATIC`），另一些用裸整数：`7` (CLOSURE, line 1523)、`10` (TUPLE, line 4511)、`21` (EVIDENCE, line 5493)。`codegen_llvm_ctx.ring` 已定义 CELL/CLOSURE_ENV/DICT_STATIC/DICT_DYN 常量，但 CLOSURE/EVIDENCE/TUPLE 缺失。

**修复**：在 `codegen_llvm_ctx.ring` 中补充 `RING_TYPEID_CLOSURE = 7`、`RING_TYPEID_TUPLE = 10`、`RING_TYPEID_EVIDENCE = 21`，全局替换裸数字。

发现者：Opus（LLVM 审计）+ DS（独立发现同类问题）

### #205 Perceus is_droppable_init / anf_should_materialize 必须手动同步 [low] [judgment] [open]

`perceus.ring:248-367` 的 `is_droppable_init` 和 `1658-1817` 的 `anf_should_materialize` 独立分类哪些表达式产生 fresh-owned 值。两者维护独立，新增表达式类型时一个改了另一个忘改会导致：materialize 而不 drop（leak）或 drop 而不 materialize（UAF）。无编程手段强制同步。

**修复方向**：合并为单一分类函数返回 `(droppable: Bool, materialize: Bool)` 或在注释中交叉引用。

发现者：Opus（LLVM 审计）

### #206 LLVM comparison predicate 魔法数字未命名 [low] [mechanical] [open]

`codegen_llvm_expr.ring` 和 `codegen_llvm_decl.ring` 中 LLVM 整数比较谓词 `32`(LLVMIntEQ)、`33`(LLVMIntNE) 等作为裸数字出现 15+ 处。浮点比较谓词 `1`(LLVMRealOEQ)、`4`(LLVMRealOLT) 等同理。

**修复**：定义命名常量 `LLVM_INT_EQ = 32`、`LLVM_INT_NE = 33`、`LLVM_REAL_OEQ = 1` 等。

发现者：DS（独立发现）

### #207 lambda_counter 递增但未使用 [low] [mechanical] [open]

`codegen_llvm_expr.ring:4682`：`gen_lambda` 中 `ctx.lambda_counter = ctx.lambda_counter + 1` 但该值从未被读取。lambda 名称由 `fresh_name(ctx, "ring_lambda_")` 生成，使用独立的内部计数器。

**修复**：用 `lambda_counter` 生成名称，或删除递增。

发现者：DS（独立发现）

### #29 Runtime 耦合 Node.js ESM（createRequire）[low] [judgment] [open]

可移植性问题。

### #138 Map/Set clone 方法语法在 native 落 panic-stub [low] [judgment] [open] [latent]

**已修复（2026-06-25）**：Map.fold/Set.fold/Map.filter/Map.any/Map.map_values/Set.filter/Set.any/Set.all 全部实现 runtime + 映射。

**残留（latent）**：str-keyed `Map.clone()` / `List.clone()` / `Set.clone()` 方法语法（int-keyed 有映射、str-keyed 落空；直呼 `map_clone(m)` 经 `ring_` fallback 正常）。发现者：B-103 Wave A。

---

## 跨模块代码健康

### #192 andor_lower / dict_lower HIR walker 结构性重复 [medium] [judgment] [open]

`andor_lower.ring:55-318` 和 `dict_lower.ring:65-431` 包含近乎相同的 HIR 结构遍历器（`al_decl`/`dl_decl`、`al_expr`/`dl_expr`、`al_stmt`/`dl_stmt`），每增加新 HExpr/HStmt variant 两个文件必须同步更新。唯一差异是变换逻辑（And/Or 降低 vs dict ref 改写）。

**重构方向**：提取通用 HIR map/fold visitor，两个 pass 成为 thin wrapper 传入各自的变换回调。

发现者：Opus（前端审计）

### #193 scc.ring AST walker 双份 collect_*_callees [medium] [mechanical] [doing]

`scc.ring:156-288` 的 `collect_expr_callees` 和 `332-456` 的 `collect_self_method_callees` 遍历完全相同的 AST 结构，~130 行 match arms 完全一致，只在发现 callee 时的记录逻辑不同。`collect_stmt_callees` / `collect_self_method_stmt_callees` 同理。

**修复**：提取单一 AST 遍历函数，接受 callee 记录回调。

发现者：Opus（前端审计）

### #199 is_value_type 三处相同实现 [low] [mechanical] [open]

`infer_helpers.ring:35-43`（pub）、`infer_decl.ring:1342-1350`（private）、`infer_register.ring:1307-1315`（private，名为 `is_register_value_type`）三处相同函数体：`IntType | FloatType | BoolType | StrType => true`。

**修复**：删除 `infer_decl.ring` 和 `infer_register.ring` 中的私有副本，import `infer_helpers.is_value_type`。

发现者：Opus（前端审计）+ DS（独立发现）

### #200 sort_by 比较器 lambda 55+ 处重复 [low] [mechanical] [open]

`fn(a, b) { if a.0 < b.0 { -1 } else if a.0 > b.0 { 1 } else { 0 } }` 在 16 个文件中出现 55+ 次，用于 map entries 的确定性迭代排序。

**修复**：在共享工具模块中提取 `compare_by_key` helper。

发现者：Opus（前端审计）

### #201 exports.ring mod block 导出 3 级手动展开 [low] [judgment] [open]

`exports.ring:56-420` 的 `extract_exports` 对 mod block 内联展开导出提取逻辑至 3 层嵌套，每层是上层的 copy-paste（~300 行重复），且不支持更深嵌套。

**修复**：重构为递归 `extract_decl_exports(decl, env, ...)` 函数。

发现者：Opus（前端审计）

### #202 codegen_llvm_expr pattern binding 代码 8 处重复 [low] [judgment] [open]

`codegen_llvm_expr.ring` 中 "GEP into enum struct, load field, store to alloca, insert into named_values" 模式在 match（3342-3474）、if-let（3796-3870）、try-catch（4079-4220, 5344-5429）间 copy-paste ~8 次，每次独立处理 Constructor、NamedConstructor、嵌套 pattern。

**修复**：提取 `bind_pattern_to_enum_fields(ctx, enum_info, data_ptr, pattern)` helper。

发现者：Opus（LLVM 审计）

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
