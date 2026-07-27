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

### #255 `impl Drop for <enum>` 的用户 drop 从不被调用（两后端一致的既有 gap）[critical] [judgment] [open]

> 2026-07-12 B-163 step 7 worker 发现（C 侧按 oracle parity 照搬保持 diff=0，两侧都缺）。

checker 对 enum 的 `impl Drop` 照常收进 `drop_types`（E0801 move 语义生效），但 LLVM `emit_drop_functions` 只在 struct 循环里查 `drop_types` 调用户 drop——enum 循环只做 payload 递归 drop，**用户 drop body 静默不执行**（静默资源泄漏：用户以为 RAII 生效实则没有）。C 侧 step 7 忠实移植同 gap。

**修复方向**（解法明确）：两后端 enum drop fn 里 tag switch 前插用户 drop 调用（对齐 struct 循环的处理）+ E2E 锁定（enum 变体持资源 + impl Drop 触发顺序）。双后端同修保持 diff=0。

发现者：step 7 worker（feedback 分诊）

### #256 Result 壳 RC 归零时 payload 不递归释放（两后端同构泄漏）[critical] [judgment] [open]

> 2026-07-12 B-163 step 7 worker 发现（skip 集逐一对齐时暴露）。既有行为，非 step 7 引入。

LLVM `emit_drop_functions` 的 enum 循环 skip "Result"（预期 runtime 处理），但 **runtime 没有 drop_result**（对照：Option 有 drop_option 固定 tid 8）——Result 对象 RC 归零时整壳 free、payload（ok/err 内含的堆对象）不递归 drop = 泄漏。两后端同构。

**修复方向**（二选一，倾向 ①）：① runtime 加 `drop_result` 固定 tid 64（对齐 Option 先例，一致性最好；runtime 改动需同步 bootstrap 考虑）；② 两侧 codegen 取消 skip、为 Result 生成 drop fn（零 runtime 改动但两处发射）。修复后跑 RC 泄漏敏感 golden ×3。

发现者：step 7 worker（feedback 分诊）

### #254 LLVM 用户 drop 调用 under-call（evidence 实参缺失，潜伏炸点）[medium] [judgment] [open] [deferred: B-163p2-retire]

> 2026-07-12 B-163 step 7 worker 发现（C 侧已按正确 arity 补齐 evidence 实参，有意偏离）。

`fn drop(self)` 推断带 `{io}` → 原型两参，但 LLVM `emit_drop_functions` 构建用户 drop 调用只传 data_ptr 一个实参——callee 从垃圾寄存器读 evidence 参，io 路径恰好不读所以不炸。**潜伏条件**：drop 方法带「有 default ops 的自定义 effect」且 body 调 op 时，LLVM 读垃圾 evidence 指针即炸；C 侧正确（default evidence 全局或 RING_UNIT）。

**修复方向**：LLVM 侧调用补齐 evidence 实参对齐 C；或不修随 Phase 2 退役消亡。

发现者：step 7 worker（feedback 分诊）

### #251 abort handler 的 arm body 从不执行——checker 放行非恒等 body 但 codegen 忽略 [critical] [judgment] [open]

> 2026-07-12 B-163 step 6 worker 实测确认（双后端一致，共享设计缺陷；C 侧 faithful port 保持 diff=0）。

`handle { body } with { fail.raise(e) => <arm> }` 的实现是「raise 的值直接成为 handle 结果」——**arm body 从不执行**（LLVM `gen_handle_expr` 注释自述 "the catch path simply returns the error value"）。arm body 非恒等时（如 `fail.raise(e) => match e {...}` 做映射），checker 类型检查通过，但运行时拿到原始 error 值——enum 指针被当 Int 打印出垃圾数字（step 6 用例开发中实测）= 静默 wrong-code。

**修复方向**（二选一，涉及语义设计需讨论）：① codegen 真正执行 arm body（abort 路径把 error 绑定进 arm 作用域求值——两后端同改）；② checker 限制 abort effect 的 arm body 只允许恒等形（贫化但诚实）。倾向 ①（用户可见语义应与写下的代码一致）。修复时新增回归用例 expected 手写。

发现者：step 6 worker（feedback 分诊）

### #252 catch 顶层 TuplePattern / OrPattern 在 LLVM 链路径是静默空分支 [medium] [judgment] [open]

> 2026-07-12 B-163 step 6 worker 发现（#246 修复时的相邻观察，未扩面）。

#246 修复覆盖了 ctor 嵌套 + 顶层 literal，但 LLVM catch 链路径对顶层 tuple/or-pattern arm 仍是 `_ => {}` 空分支——若 checker 放行此类 arm（`fail<(Int,Str)>` 的 tuple 模式），LLVM 侧静默跳过该 arm；C 侧 `emit_c_match_arm` 天然支持，双后端不对称。

**修复方向**：先复核 checker 是否放行 catch arm 顶层 tuple/or-pattern——不放行则本条降级关闭；放行则 LLVM 链路径补支持（对照 match 路径现成逻辑），差分验收。

发现者：step 6 worker（feedback 分诊）

### #253 LLVM gen_lambda 不隔离 handle_cleanup_stack——lambda 内 return 错误发射 catch pop [medium] [judgment] [open] [deferred: B-163p2-retire]

> 2026-07-12 B-163 step 6 worker 发现（C 侧以 `c_push_fn`/`c_pop_fn` 隔离，有意正确性偏离；LLVM 侧未动）。

嵌套函数（lambda/dict getter/thunk）是独立栈帧，lambda body 里的 `return` 不得 pop 外层函数的 catch frame。LLVM `gen_lambda` 未保存/清空 `handle_cleanup_stack`——handler body 的 lambda 内含显式 `return` 时，会在 lambda 帧里错误发射 `ring_catch_pop`（栈不平衡 → 后续 catch 行为未定义）。触发面窄（handler body 内 lambda 显式 return）。

**修复方向**：`gen_lambda` 进入时保存并清空 cleanup stack、退出时恢复（对齐 C 侧 bracket）；或不修随 Phase 2 退役消亡。

发现者：step 6 worker（feedback 分诊）

### #247 合法 match 程序触发 module verification failed（IR 与文本形式不一致，行为正确）[medium] [judgment] [open]

> 2026-07-11 #245 worker 范围外发现（基线 `44e69f9` 对照确认预存在，与 #245 修复无关）。

`fn f(o: Int?) -> Str { match o { some(n) => "n=${n}", none => "none" } }` + main 两次调用即触发 `LLVM module verification failed (1 errors)`。怪异点：dump 的 ring_output.ll 经 clang 解析编译**无错**——in-memory module 与文本形式不一致（疑似空 block / 游离 block 类，#198 builder 簿记家族）；运行输出正确。

**影响**：verify 信道被既有噪声污染——verify 失败无法作为硬门槛（见 #242 扩注的 fail-stop 决策依赖）。**修复方向**：最小复现 → `LLVMVerifyModule` 的具体错误文本定位（action=2 会打到 stderr，先抓全错误内容）→ 定位发射游离/空 block 的路径。注：LLVM 后端 Phase 2 退役后本条随之消亡，但它 gate 着 verify fail-stop 决策，且 Phase 1 期间 LLVM 是 oracle——oracle 自身 verify 不过削弱差分可信度。

发现者：#245 worker（feedback 分诊）

### #248 LLVM derived clone 签名与 checker scheme 契约不一致（静默多传参）[low] [judgment] [open] [deferred: B-163p2-retire]

> 2026-07-11 step 5 worker 发现（clang 在 C 侧把它变成硬错误而暴露；C 侧已修，LLVM 未动）。

checker（`derive.ring` `register_derived_impl`）给 derived clone 注册带 `[T: Clone]` bounds 的 scheme → 调用位按 scheme 传 dict 参数；LLVM `emit_clone_fn` 却用 empty_bounds 生成单参函数——调用位多传 1 个 dict 参数，LLVM-C 不校验、x64 调用约定下静默无害（plan §0.1「类型系统真空」实例）。C 侧修复 = clone 签名与 scheme 对齐（接收 dict 参数，body 忽略）。

**修复方向**：`emit_clone_fn` 传 `di.bounds` 对齐 scheme；或不修随 Phase 2 退役消亡。Phase 1 期间动 LLVM derived 区的任何改动需先修此项。

发现者：step 5 worker（feedback 分诊）

### #250 `--target=llvm` 单文件模式不遵守 `--out-dir`（双后端 CLI 不对称）[low] [mechanical] [open]

> 2026-07-11 step 5 worker 发现（.o 落源文件旁，手动 Move-Item 绕过）。

`ring.exe build foo.ring --target=llvm --out-dir=<dir>` 单文件模式下 .o 落源文件旁；C 后端（steps 1-3 起）正确遵守 `out_dir_set`。project mode 两者都遵守。

**修复方向**（解法唯一）：LLVM 单文件路径消费 `out_dir_set`，对齐 C 后端行为。注意 Python runner 的 LLVM 单文件路径当前依赖"源旁 .o"现状（runner 取舍已备案），修复时同步调整 runner。

发现者：step 5 worker（feedback 分诊）

### #244 checker 级 mangling 歧义：用户 enum 遮蔽 prelude 类型时 impl 方法同名碰撞 [medium] [judgment] [open]

> 2026-07-11 step 4 worker 发现（C 侧硬重定义错误暴露；已按 LLVM 等效语义 first-wins 缓解，根因未修）。

用户自定义 `enum Result` + `impl Result { and_then }` 与 prelude `std/result.ring` 的同名方法都 mangle 成 `ring_Result_and_then`——codegen 身份未区分用户类型与被遮蔽的 prelude 类型。LLVM 后端「通过」纯属侥幸（forward pass 重名去重后第二个 body 成死块，调用点全走 prelude 定义，恰好语义相同）；C 后端 `2b85e9f` 起 `CCtx.emitted_fns` first-wins（等效语义，同样是缓解不是修复）。**次生 wrinkle**：`c_declare_fn`/LLVM forward_declare 对重名的 `fn_evidence_params` 是 last-wins（body/proto 是 first-wins）——重名双方 effect 行不同时调用点 evidence 实参数与原型不匹配（现有用例未触发）。

**修复方向**：checker/mangling 层给用户定义类型与 prelude/builtin 类型不同的 codegen 身份（如模块前缀入 mangled name），两后端消费同一来源；歧义存在期间至少发 W/E 级诊断（用户 enum 遮蔽 prelude 类型名）。涉及 checker + hir 共享约定，需设计判断。

> 2026-07-12 同族补充（step 7 worker）：用户 `fn drop_Foo()` mangle 成 `ring_drop_Foo` 会撞 struct Foo 的 drop fn 符号——LLVM 静默 rename 兜底，C 是 clang redefinition 硬错误（更响但报错不友好）。概率极低，随本条 mangling 方案一并解决。

发现者：step 4 worker（feedback 分诊）

### #242 finalize_llvm_module emit 失败后进程退出码仍为 0 [medium] [mechanical] [open]

> 2026-07-11 从 worker feedback 分诊入表（Phase 0 worker 发现冻结 JS 版同病 → 现源码查证同病）。

`codegen_llvm.ring:1759-1764`：`LLVMTargetMachineEmitToFile` 失败只 `eprintln("Failed to emit object file")` 后正常返回，进程 exit 0——脚本/CI 假绿隐患。典型事故：dist-llvm rebuild 时 emit 失败但脚本继续链接旧 main.o，用旧编译器却以为是新的。Python runner 靠 ".o file not found" 兜底，但直接调 ring.exe 的脚本（CLAUDE.md 常用命令、rebuild 流程）无此防护。对照：cli.ring 全部 lex/parse/check 错误路径正确 `exit_process(1)`；C 后端 `codegen_c.ring:69` clang 失败正确 `exit_process(1)`。

**修复方向**（解法唯一）：emit 失败分支加 `exit_process(1)`，对齐 C 后端先例。同函数 verify 失败（L1746，注释明示 attempting emit anyway）与 pass 失败（L1753）是故意继续的既有行为，**保持不动**。注：本条属 codegen_llvm，若不修将随 B-163 Phase 2 LLVM 后端退役消亡；但 Phase 1 期间 LLVM 仍是主力构建路径 + 差分 oracle，1 行修复值得做。

> **2026-07-11 扩注（#245 worker [观察] 分诊）——verify 失败 fail-stop 拍板点**：invalid IR（duplicate switch case）下 "attempting emit anyway" 实测会**挂死 ring.exe 进程**（滞留占文件锁），违背「失真必须响」。建议 verify 失败直接 fail-stop（exit 非零）而非继续 emit——**但被 #247 gate**：现存在合法程序触发 verification failed 的既有噪声（行为正确的假阳性），先修 #247 才能启用 fail-stop，否则合法程序编译失败。执行序：#247 根因修复 → verify fail-stop（届时本条 emit/verify 两处一并收口）。方向待用户确认。

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

> **2026-07-12 差分证据（B-163 step 6 重评估）**：两用例在 C 后端**同构失败**（同 assertion）——缺陷定位收窄至 HIR/checker/perceus **共享层**，codegen 单侧嫌疑排除。原「pre-existing LLVM backend bugs」归类作废。

**SHARED_POSITIVE_GAPS**：`tests/cases/effects/effect_custom_and_fail.ring`、`tests/cases/effects/effect_custom_multi_effect.ring`。修好后移除。

发现者：B-151 CI

### #221 struct match pattern + tuple eq dispatch runtime crash [medium] [judgment] [open]

三个用例 runtime assertion 失败：`struct_match_pattern.ring`（"y-axis"）、`tuple_eq.ring`（"tuple eq same values"）、`tuple_eq_struct.ring`（"tuples with equal structs should be equal"）。struct 的 match pattern 和 tuple 的 eq 比较在共享层有误。

> **2026-07-12 差分证据（B-163 step 6 重评估）**：三用例在 C 后端**同构失败**（同 assertion）——缺陷在**共享层**（tuple `==` 派发 / struct pattern 的 HIR 下沉），非 LLVM codegen。「LLVM 后端 codegen 问题」表述作废。

**SHARED_POSITIVE_GAPS**：`tests/cases/struct_match_pattern.ring`、`tests/cases/tuple_eq.ring`、`tests/cases/tuple_eq_struct.ring`。修好后移除。

发现者：B-151 CI

### #222 ring.exe check 对 tuple 越界 panic 而非报 E0304 [low] [judgment] [doing: B-163p2]

`error_tuple_oob.ring`：`ring.exe check` panic（"unreachable: tuple index bounds already checked"）而非报 E0304。

> **2026-07-27 B-163 Phase 2 P2.1 重评估**：原同条的 `error_occurs_check.ring` 已由最终 anchor 正确报告 E0302，恢复进 runner 并通过；仅 tuple-oob 仍失败。该 gap 属 backend-independent checker 路径，已从旧 LLVM_SKIP 拆入 `CHECK_ONLY_GAPS`，Phase 2 parity matrix 会持续显式报告。

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
