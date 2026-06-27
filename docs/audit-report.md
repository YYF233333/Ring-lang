# Audit Report

> 活的 bug 看板。修复后删除条目，只在 git commit message 留记录。
> 条目格式：`### #xxx <标题> [严重度] [dispatch] [状态]`
> dispatch 标记：`mechanical`（DS 可执行）/ `judgment`（Claude 执行）
> 状态流转：`open` → `doing` → 删除
> 工作流规范见 `docs/workflow.md`

---

## 前端

### #236 apply_var_mapping 重复 env.ring 的 apply_subst_map [medium] [mechanical] [open]

`infer_decl.ring:1855-1893` 的 `apply_var_mapping` 与 `env.ring:394-584` 的 `apply_subst_map` 功能完全相同——遍历相同的 Type match 分支做逐字段重建，仅变量来源不同（Map<Int,Type> vs SubstMap）。两处约 160 行近乎相同代码，修改 Type 结构时需同步两处。

**修复方向**：`infer_decl.ring` 的 `apply_var_mapping` 改为调用 `env.ring` 的 `apply_subst_map`，或提取带 resolver 回调的通用类型遍历器。

发现者：Opus

---

## Runtime

### #223 ring_str_lt 缺 null guard（ring_str_eq 有但 ring_str_lt 没有）[medium] [mechanical] [open]

`ring_runtime.cpp:691-692`：`ring_str_eq`（L687）有 `if (!a || !b) return (a == b) ? 1 : 0;` null guard，但 `ring_str_lt`（L691）直接解引用 `*(std::string*)a < *(std::string*)b`。ring_str_eq 的 null guard 证明 null 字符串在运行时可能出现——ring_str_lt 遇到 null 将段错误。

**修复方向**：添加与 ring_str_eq 一致的 null guard。null < non-null 可定义为 true（空串最小）或 panic。

发现者：Opus

### #224 ring_read_file 的 fread 返回值未检查 [medium] [mechanical] [open]

`ring_runtime.cpp:2273`：`fread(&(*result)[0], 1, (size_t)size, f);` 返回值未检查。若 I/O 错误导致短读，预分配的 `std::string((size_t)size, '\0')` 尾部保留 null 字节，编译器将静默处理含垃圾数据的源文件。

**修复方向**：检查 fread 返回值，短读时 panic 或 resize result。

发现者：Opus

### #225 ring_parse_int / ring_parse_float 裸 catch(...) 吞没所有异常 [medium] [mechanical] [open]

`ring_runtime.cpp:2862,2873`：两个解析函数使用 `try { std::stoll/stod } catch (...) {}`，吞没所有 C++ 异常——包括 `std::bad_alloc`（OOM 应终止而非静默返回 none）。

**修复方向**：捕获具体异常 `catch (const std::invalid_argument&)` 和 `catch (const std::out_of_range&)`，不捕获 `std::bad_alloc`。

发现者：DS

### #226 Map<Int>/Map<Str> + Set<Int>/Set<Str> 按 key 类型 ~700 行重复 [medium] [judgment] [open]

`ring_runtime.cpp:1381-2205`：Map<Int,V> 是 Map<Str,V> 的逐行拷贝（~450 行），Set<Int> 是 Set<Str> 的逐行拷贝（~250 行）。总计约 700 行完全相同逻辑仅 key 类型不同。修改 Map/Set 行为需同步两份代码。

**修复方向**：C++ 模板化或宏消除重复。注意 B-152 RIIR 会用纯 Ring 重写容器——如果 B-152 优先级足够近，可推迟此项。

发现者：Opus

### #227 drop_closure_env / drop_dict / drop_evidence 三函数体完全相同 [medium] [mechanical] [open]

`ring_runtime.cpp:3212-3276`：三个 drop 函数实现逐字节相同——读 count-prefixed 数组，逐 slot 调 ring_drop。每个约 8 行，总共 24 行做同一件事。

**修复方向**：提取 `drop_counted_slots(void* data)` 共享函数，三处调用。

发现者：Opus+DS

### #228 ring_str_join / ring_list_join 相同实现参数反序 [low] [mechanical] [open]

`ring_runtime.cpp:766` vs `ring_runtime.cpp:3338`：两个函数实现完全一致，仅参数顺序不同——`ring_str_join(sep, list)` vs `ring_list_join(list, sep)`。

**修复方向**：一个调用另一个即可。

发现者：Opus

### #229 CHK/CHK_ARG 永久禁用宏 + 16 调用点死代码 [low] [mechanical] [open]

`ring_runtime.cpp:565-566`：`CHK(name)` 和 `CHK_ARG(name, arg)` 定义为 `do {} while(0)`（注释 "retired after #134 hunt closed"），但 16 个调用点散布在 ring_list_*、ring_map_*、ring_print 等函数中。纯视觉噪音。

**修复方向**：删除宏定义及全部 16 个调用点。

发现者：DS

### #230 ring_alloc + placement new 样板模式 55+ 处 [low] [mechanical] [open]

`ring_runtime.cpp` 中约 55 处 `void* data = ring_alloc(sizeof(std::string), RING_TYPEID_STR); new (data) std::string(...)` 两行样板。List 类型约 21 处同理。

**修复方向**：提取 `ring_new_str(...)` / `ring_new_list()` 内联帮助函数。注意 B-152 RIIR 会重写容器——可推迟。

发现者：Opus

### #231 magic number 4096 用于 drop_table / never_drop_table [low] [mechanical] [open]

`ring_runtime.cpp:120,133,284`：数组大小和边界检查中多处使用未命名常量 `4096`。

**修复方向**：定义 `#define RING_MAX_TYPEIDS 4096` 统一引用。

发现者：Opus

### #232 _ReturnAddress() 无跨平台守卫 [low] [mechanical] [open]

`ring_runtime.cpp:338,345,381,669,2337,2353`：`_ReturnAddress()`（MSVC intrinsic）在 `RING_BOX_PROFILE` 和 `RING_RC_DEBUG` 块内使用，但无 `_WIN32` 守卫。Linux/macOS 启用这些调试宏时编译失败。当前仅目标 Windows，影响有限。

**修复方向**：添加 `#ifdef _MSC_VER ... #else __builtin_return_address(0) #endif` 宏。

发现者：DS

---

## LLVM Codegen

### #233 method_to_runtime + 4 配套查找链需同步维护 [medium] [judgment] [open]

`codegen_llvm_expr.ring:2776-2891`：5 个独立 if-else 链映射同一组运行时方法（method_to_runtime、method_to_llvm_return_type、method_needs_list_content_type、method_is_void、method_extra_args）。新增一个方法映射需同步修改 5 处，遗漏导致 codegen 错误。

**修复方向**：合并为单一 `RuntimeMethodInfo` 结构体（含 runtime_name, return_type, needs_content_type, is_void, extra_args），单一查找函数返回该结构。

发现者：Opus

### #234 codegen 层硬编码类型名 vs types.ring 常量 91 处 [medium] [mechanical] [open]

`codegen_llvm_expr.ring` 中约 91 处使用原始字符串 `"Int"`, `"Str"`, `"Bool"`, `"Float"`, `"List"`, `"Map"`, `"Set"` 等进行类型判断，而 `types.ring` 已定义 `BUILTIN_INT`, `BUILTIN_STR` 等常量。字符串拼写错误不会被编译器捕获。

**修复方向**：codegen 层统一使用 `types.ring` 的常量。

发现者：Opus

### #235 codegen_llvm_expr.ring 5634 行——编译器最大文件需拆分 [medium] [judgment] [open]

`codegen_llvm_expr.ring` 是编译器最大文件（5634 行），是次大文件（`perceus.ring` 2473 行）的 2.3 倍。包含表达式 codegen、match 编译（~1500 行）、lambda/handler/证据构造、emit_c_main、RC drop 辅助等职责过多。

**修复方向**：沿职责边界拆分——至少拆出 `codegen_llvm_match.ring`（match 编译约 1500 行）和 `codegen_llvm_entry.ring`（emit_c_main + 模块初始化）。

发现者：Opus+DS

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



### #237 34+ 处 sort_by(compare_by_first) 缺 sorted_entries 工具函数 [low] [mechanical] [open]

`checker.ring`, `derive.ring`, `codegen_llvm_expr.ring`, `infer_decl.ring`, `infer_register.ring`, `resolver.ring`, `scc.ring` 等 11 个文件中共 34+ 处使用 `map.entries().sort_by(compare_by_first)` 模式实现确定性 Map 迭代。68+ 行样板。

**修复方向**：添加 `Map.sorted_entries()` 方法到 `std/map.ring`，或在编译器内部提供 `sorted_entries(map)` 工具函数。

发现者：Opus+DS

### #238 collect_all_supertraits_llvm 跨模块拷贝 [low] [mechanical] [open]

`codegen_llvm_decl.ring:22-45`：注释 "Local copy to avoid circular dependency"，与 checker 中的同名函数算法完全相同。变更算法需改两处。

**修复方向**：移至 `codegen_llvm_ctx.ring` 或 `hir.ring` 共享模块，消除循环依赖。

发现者：Opus

### #239 DictRef::Wrapped extra_dicts codegen 未消费 [medium] [judgment] [open]

`hir.ring:38-39`：`DictRef::Wrapped` 变体注释明确声明 "codegen ignores extra_dicts — pre-existing gap"。Eq/Ord 二元操作的附加字典从不被 codegen 消费，trait 多态 dispatch 的某些路径可能走不到正确字典。

**修复方向**：让 codegen 消费 BinOp 的 extra_dicts，或在 checker 层拒绝该路径。需先确认是否有测试用例能触发此路径。

发现者：DS

### #240 ForIn 可迭代类型解析嵌套 10+ 层 [low] [judgment] [open]

`infer.ring:296-521`：225 行代码处理 Iterable→Iterator→Item 链解析，嵌套 9+ 层 match。可读性差，难以定位具体类型解析失败点。

**修复方向**：提取 `resolve_iterable_element_type` 函数，使用 early-return 风格扁平化嵌套。

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
