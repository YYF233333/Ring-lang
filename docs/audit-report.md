# Audit Report

> 活的 bug 看板。修复后删除条目，只在 git commit message 留记录。
> 条目格式：`### #xxx <标题> [严重度] [dispatch] [状态]`
> dispatch 标记：`mechanical`（DS 可执行）/ `judgment`（Claude 执行）
> 状态流转：`open` → `doing` → 删除
> 工作流规范见 `docs/workflow.md`

---

## 前端



### #198 Parser 不支持负数字面量 pattern [low] [judgment] [doing]

`parser.ring:1792-1928` 的 `parse_pattern` 处理 `TkIntLit` 和 `TkFloatLit`，但不处理前导 `TkMinus` + 数字字面量组合。`match x { -1 => ... }` 会产生 parse error。用户可通过 guard 或变量绑定 workaround，但这是常见的预期语法。

**修复**：在 `parse_pattern` 开头检查 `TkMinus` + `TkIntLit`/`TkFloatLit`，消费两个 token 生成 negated `Pattern::Literal`。需讨论是否作为当前优先级的特性实现。

发现者：Opus（前端审计）

---

## LLVM Codegen





### #183 RetIntToBoxed 使用 ZExt 而非 SExt [medium] [mechanical] [doing]

`codegen_llvm_expr.ring:1978-1981` 将 C int (i32) 返回值扩展为 Ring Int (i64) 时使用 `LLVMBuildZExt`（零扩展），注释写的是 "sext to i64"。对返回负值的 C 函数，零扩展会产生错误的大正数。当前 LLVM-C 函数返回 int 只返回 0/1（LLVMBool），所以是 latent。`LLVMBuildSExt` 未在任何 `.ring` 文件中声明。

**修复**：在 `llvm_ffi.ring` 中声明 `LLVMBuildSExt`，替换 `codegen_llvm_expr.ring:1980` 的 `LLVMBuildZExt`。

发现者：Opus（LLVM 审计）

### #184 字符串插值 fallback 将非基本类型当 Int 处理 [medium] [mechanical] [doing]

`codegen_llvm_expr.ring:3157-3164` 的 `convert_to_str` 对 Str/Int/Float/Bool 之外的类型，fallback 调用 `unbox_int(val)`（`ptrtoint >> 1`）再 `ring_int_to_str`。对 struct/enum/list/option 值做字符串插值 `"${my_struct}"` 时会输出无意义的整数而非有意义的表示。

**即时修复（2026-06-25 Discussion 拍板）**：checker 阶段对非 Str/Int/Float/Bool 类型的字符串插值报编译错误。后续 B-149 Display trait 实现后放宽为"要求 Display impl"。

发现者：Opus（LLVM 审计）


### #186 LLVMGetTargetFromTriple 错误时静默继续 [medium] [judgment] [doing]

`codegen_llvm_expr.ring:2019-2027` 中 `gen_extern_LLVMGetTargetFromTriple` 调用后未检查返回值。若 triple 无效，output alloca 保持 null，后续 LLVM API 调用 null target → segfault。注释承认 `// TODO: could emit a conditional panic here`。

**修复**：emit 条件分支检查返回值，非零则 panic 并输出错误消息。参考 `emit_divzero_guard` 模式。

发现者：Opus（LLVM 审计）+ DS（独立发现）


### #188 Lambda 捕获变量未找到时静默存入 null [medium] [judgment] [doing]

`codegen_llvm_expr.ring:4797-4799` 中 `gen_lambda` 构造闭包环境时，若捕获变量在 `ctx.named_values` 中找不到，fallback 存入 `LLVMConstPointerNull`。Checker 保证捕获变量有效，所以正常情况下不触发。但若发生（codegen 与 checker 的 scope 不一致等边角），运行时使用 null 捕获值会 segfault，且无任何诊断信息。

**修复**：将 null fallback 替换为 codegen panic（`panic("LLVM codegen: captured variable not found: ${cap_name}")`），使问题在编译时暴露而非运行时静默崩溃。

发现者：DS（独立发现）

### #189 codegen_llvm_decl derive 四实现 ~1700 行结构性重复 [medium] [judgment] [doing]

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





### #204 RING_TYPEID 常量不一致——部分命名、部分裸数字 [low] [mechanical] [doing]

`codegen_llvm_expr.ring` 中部分 typeid 用命名常量（`RING_TYPEID_DICT_STATIC`），另一些用裸整数：`7` (CLOSURE, line 1523)、`10` (TUPLE, line 4511)、`21` (EVIDENCE, line 5493)。`codegen_llvm_ctx.ring` 已定义 CELL/CLOSURE_ENV/DICT_STATIC/DICT_DYN 常量，但 CLOSURE/EVIDENCE/TUPLE 缺失。

**修复**：在 `codegen_llvm_ctx.ring` 中补充 `RING_TYPEID_CLOSURE = 7`、`RING_TYPEID_TUPLE = 10`、`RING_TYPEID_EVIDENCE = 21`，全局替换裸数字。

发现者：Opus（LLVM 审计）+ DS（独立发现同类问题）

### #205 Perceus is_droppable_init / anf_should_materialize 必须手动同步 [low] [judgment] [doing]

`perceus.ring:248-367` 的 `is_droppable_init` 和 `1658-1817` 的 `anf_should_materialize` 独立分类哪些表达式产生 fresh-owned 值。两者维护独立，新增表达式类型时一个改了另一个忘改会导致：materialize 而不 drop（leak）或 drop 而不 materialize（UAF）。无编程手段强制同步。

**修复方向**：合并为单一分类函数返回 `(droppable: Bool, materialize: Bool)` 或在注释中交叉引用。

发现者：Opus（LLVM 审计）

### #206 LLVM comparison predicate 魔法数字未命名 [low] [mechanical] [open]

`codegen_llvm_expr.ring` 和 `codegen_llvm_decl.ring` 中 LLVM 整数比较谓词 `32`(LLVMIntEQ)、`33`(LLVMIntNE) 等作为裸数字出现 15+ 处。浮点比较谓词 `1`(LLVMRealOEQ)、`4`(LLVMRealOLT) 等同理。

**修复**：定义命名常量 `LLVM_INT_EQ = 32`、`LLVM_INT_NE = 33`、`LLVM_REAL_OEQ = 1` 等。

发现者：DS（独立发现）

### #207 lambda_counter 递增但未使用 [low] [mechanical] [doing]

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

### #192 andor_lower / dict_lower HIR walker 结构性重复 [medium] [judgment] [deferred]

`andor_lower.ring:55-318` 和 `dict_lower.ring:65-431` 包含近乎相同的 HIR 结构遍历器。

**推迟理由**（2026-06-25 Worker 评估）：andor_lower 无状态，dict_lower 穿线 3 个可变参数；24 个 expr arm 只有 2 个有差异；通用 visitor 需 ~150 行 trait 基础设施换 ~250 行节省，且编译器穷尽 match 已能 catch 新 variant 遗漏。投入/产出比不合算。

发现者：Opus（前端审计）



### #200 sort_by 比较器 lambda 55+ 处重复 [low] [mechanical] [open]

`fn(a, b) { if a.0 < b.0 { -1 } else if a.0 > b.0 { 1 } else { 0 } }` 在 16 个文件中出现 55+ 次，用于 map entries 的确定性迭代排序。

**修复**：在共享工具模块中提取 `compare_by_key` helper。

发现者：Opus（前端审计）

### #201 exports.ring mod block 导出 3 级手动展开 [low] [judgment] [doing]

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
