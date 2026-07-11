# Audit Report

> 活的 bug 看板。修复后删除条目，只在 git commit message 留记录。
> 条目格式：`### #xxx <标题> [严重度] [dispatch] [状态]`
> dispatch 标记：`mechanical`（DS 可执行）/ `judgment`（Claude 执行）
> 状态流转：`open` → `doing` → 删除
> 工作流规范见 `docs/workflow.md`

---

## 前端


## Runtime


### #226 Map<Int>/Map<Str> + Set<Int>/Set<Str> 按 key 类型 ~700 行重复 [medium] [judgment] [open]

> 2026-07-10 更新：Map 半已被 B-152 P3 消除（`ring_map_int_*` 现为单行 redirect 到统一 shim）。剩余 = Set 半（`RingSetInt` 仍是 `RingSet` 的独立 STL 实现，~250 行，ring_runtime.cpp:2079 起）。

`ring_runtime.cpp`：Set<Int> 是 Set<Str> 的逐行拷贝（~250 行），逻辑相同仅 key 类型不同。修改 Set 行为需同步两份代码。

**修复方向**：B-152 P4（Set RIIR，暂停中，B-163 后恢复）会整体消除——届时本条目随 P4 关单，不单独修。

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


## LLVM Codegen

### #245 共享 wrong-code：ctor 模式嵌套 literal 子模式不比较值（双后端一致）[critical] [judgment] [open]

> 2026-07-11 B-163 step 4 worker 发现（全量 sweep + faithful port 对照），从 feedback 分诊入表。**双后端共享，差分套件抓不到（diff=0 恰恰是病征）**。

```ring
match o { some(0) => "zero", some(n) => "n=${n}", none => "none" }
```
`some(7)` 在 LLVM 与 C 后端**都输出 "zero"**——`check_nested_ctor_tags`（codegen_llvm_expr，及 step 4 的 C port）对 `Pattern::Literal` 是 no-op：只查 ctor tag、不发射字面量值比较，首个 `some(_)` 形 arm 吞掉一切同 tag 值。同族 gap：tuple 元素位的 ctor 子模式只查一层 tag 不递归内层（`(Neg(Lit(n)), _)` 的 Lit 不验证）。tuple 顶层 literal 元素 B-087 已修，ctor 字段位漏网。

**影响**：常用模式写法产出 wrong-code = 直接违反「编译器是最终权威 / 失真必须响」。**oracle 污染**：golden .expected 由 LLVM oracle 生成，凡含此 pattern 的用例已把错误行为烤入快照——修复后受影响用例需 `--update-golden` 重生成并人工核对语义。

**修复方向**：① 两后端 `check_nested_ctor_tags` 族同改——ctor 字段位 literal 子模式发射值比较、tuple 元素位 ctor 子模式递归检查（策略逻辑先在 LLVM 侧改，C 侧对照移植，保持 diff=0）；② 排查 checker 穷尽性层对嵌套 literal 的处理是否同样漏（`some(0)`/`some(n)` 的覆盖判定）；③ 新增回归 e2e（手写 expected，不经 oracle）+ 受影响 golden 重生成核对；④ 动 match codegen → golden ×3 全套。

发现者：step 4 worker（feedback 分诊）

### #243 LLVM gen_direct_call 全局 functions map 先于局部 named_values——潜伏 miscompile [medium] [mechanical] [open]

> 2026-07-11 step 4 worker 发现（C 侧同 bug 被 clang arity 硬错误当场抓出并已修，LLVM 侧按纪律未动）。

`codegen_llvm_expr.ring` `gen_direct_call`：调用位名字解析先查全局 functions map 再查局部 named_values（closure 分支）——与语言作用域规则相反。用户程序定义与 prelude HOF 参数同名的全局 fn（如 `fn f(x)`）时，`List.fold` 体内 `f(acc, elem)` 被解析到全局 f，对 1 参函数发射 2 实参 `LLVMBuildCall2`。LLVM-C 不校验、静默生成错 call；现有用例中该 prelude HOF 恰为死代码故未爆——用户程序若真调用该 HOF 即活 miscompile。C 后端已修（局部作用域优先，`2b85e9f`），**两后端现不对称**：同场景 C 正确、LLVM 错，差分套件若撞上会以 FAIL 形式暴露。

**修复方向**（解法唯一）：`gen_direct_call` 查找顺序对齐 C 侧（局部 named_values 先于 functions map）。建议随 step 5 顺带修或等 Phase 2 退役——但 Phase 1 期间 LLVM 是差分 oracle，修掉可消除不对称。

发现者：step 4 worker（feedback 分诊）

### #244 checker 级 mangling 歧义：用户 enum 遮蔽 prelude 类型时 impl 方法同名碰撞 [medium] [judgment] [open]

> 2026-07-11 step 4 worker 发现（C 侧硬重定义错误暴露；已按 LLVM 等效语义 first-wins 缓解，根因未修）。

用户自定义 `enum Result` + `impl Result { and_then }` 与 prelude `std/result.ring` 的同名方法都 mangle 成 `ring_Result_and_then`——codegen 身份未区分用户类型与被遮蔽的 prelude 类型。LLVM 后端「通过」纯属侥幸（forward pass 重名去重后第二个 body 成死块，调用点全走 prelude 定义，恰好语义相同）；C 后端 `2b85e9f` 起 `CCtx.emitted_fns` first-wins（等效语义，同样是缓解不是修复）。**次生 wrinkle**：`c_declare_fn`/LLVM forward_declare 对重名的 `fn_evidence_params` 是 last-wins（body/proto 是 first-wins）——重名双方 effect 行不同时调用点 evidence 实参数与原型不匹配（现有用例未触发）。

**修复方向**：checker/mangling 层给用户定义类型与 prelude/builtin 类型不同的 codegen 身份（如模块前缀入 mangled name），两后端消费同一来源；歧义存在期间至少发 W/E 级诊断（用户 enum 遮蔽 prelude 类型名）。涉及 checker + hir 共享约定，需设计判断。

发现者：step 4 worker（feedback 分诊）

### #242 finalize_llvm_module emit 失败后进程退出码仍为 0 [medium] [mechanical] [open]

> 2026-07-11 从 worker feedback 分诊入表（Phase 0 worker 发现冻结 JS 版同病 → 现源码查证同病）。

`codegen_llvm.ring:1759-1764`：`LLVMTargetMachineEmitToFile` 失败只 `eprintln("Failed to emit object file")` 后正常返回，进程 exit 0——脚本/CI 假绿隐患。典型事故：dist-llvm rebuild 时 emit 失败但脚本继续链接旧 main.o，用旧编译器却以为是新的。Python runner 靠 ".o file not found" 兜底，但直接调 ring.exe 的脚本（CLAUDE.md 常用命令、rebuild 流程）无此防护。对照：cli.ring 全部 lex/parse/check 错误路径正确 `exit_process(1)`；C 后端 `codegen_c.ring:69` clang 失败正确 `exit_process(1)`。

**修复方向**（解法唯一）：emit 失败分支加 `exit_process(1)`，对齐 C 后端先例。同函数 verify 失败（L1746，注释明示 attempting emit anyway）与 pass 失败（L1753）是故意继续的既有行为，**保持不动**。注：本条属 codegen_llvm，若不修将随 B-163 Phase 2 LLVM 后端退役消亡；但 Phase 1 期间 LLVM 仍是主力构建路径 + 差分 oracle，1 行修复值得做。

发现者：Phase 0 worker（feedback 分诊）

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
