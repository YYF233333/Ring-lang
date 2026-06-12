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

### #149 未标注 fn 的返回类型被过度泛化为自由 TypeVar（健全性洞）[critical] [judgment] [open]

`fn tp(mut xs: List<Int>) { xs.push(1) }`（无 `-> T` 标注）的返回类型在 generalization 后是**自由类型变量**——`let x: Str = tp([1])` **通过类型检查**（实测 `check` OK）。JS 后端 x = undefined 静默流动；native 后端是**致命组合**：tp 的 body tail 是 receiver-returning Unit builtin（`xs.push` 结果 Unit-typed 被 rc 排除 → move verbatim 不 dup）→ ABI 返回**活 receiver 指针**、call-site 类型却是 TypeVar → 规则②（Unit 类型级排除）拦不住 → 任何 droppable 位置（`let r = tp(a)` 自 B-103 起；arg/receiver/statement 位随 Stage 2 各轮）把它 scope-end-drop → **与 caller 容器 double-free**（ASan 双向实证：c470d13 上 `let r = tp(a)` UAF；守卫后 EXIT 0）。**Perceus 侧已加 unknown-ownership 守卫**（`is_unresolved_var_type`：TypeVar/ErrorType 不材料化、不 droppable，Clone 保留；git 89d2eb7，泄漏方向，单态 call-site zonk 后不受影响）。**本条是 checker 根修**：未标注 fn 的 expected_ret fresh var 应与 body 类型 unify 后不被 generalize（infer_decl.ring:1304-1311 路径），修复方向需拍板（涉及推断语义）。回归：`tests/cases/llvm/exprstmt_discard_drop.ring` #149 段锁守卫；checker 修复后应加负面测试断言 `let x: Str = tp([1])` 报错。Stage 2 commit message 中曾以 #148 引用。发现者：B-104 D1 Stage 2（Round C3，llvm_diff `mutator_result_binding.ring` ×3 确定性触发后追根）。







## Codegen

### #29 Runtime 耦合 Node.js ESM（createRequire）[low] [judgment] [open]

可移植性问题。

> #130（闭包 env 捕获泄漏）/ #131（perceus drop 落不了地，96 rc-warn）已于 2026-06-03 并入 B-084（✅ 已落地删除，见 git）；剩余闭包 RC 收口归 **B-096**。

### #136 LLVM 后端 5 个 mapped-but-missing runtime 符号 [low] [judgment] [open]

B-103 全量枚举 ring_runtime.cpp 时发现：`method_to_runtime`（codegen_llvm_expr.ring）映射了 5 个 **ring_runtime.cpp 中不存在**的符号——`ring_str_to_int`（Str.to_int）、`ring_str_to_float`（Str.to_float）、`ring_list_enumerate`（List.enumerate，且在 codegen_llvm.ring:174 被无条件 declare）、`ring_map_is_empty`（Map.is_empty）、`ring_set_is_empty`（Set.is_empty）。任何程序在 `--target=llvm` 下调用这些方法 → 链接失败（undefined symbol）。当前编译器/测试零使用（`.enumerate` 仅注释提及）→ latent。修复方向：补 runtime 实现或删映射改走 Ring impl；**注意其中 to_int/to_float/enumerate 三个已由 B-094 拍板「确定不加、清死映射」（2026-06-03，enumerate 真做时归 B-095）——本条净增量 = `ring_map_is_empty`/`ring_set_is_empty` 两个，修复时勿与 B-094 决策冲突**。发现者：B-103 Wave A。

### #137 List.reverse / List.sort 后端语义分歧（JS 原地 vs LLVM fresh 丢弃）[medium] [judgment] [open]

std/list.ring 声明 `reverse`/`sort` 返回 Unit（原地变异语义）；JS 后端确实原地（runtime.ring:87 `self.reverse()`，sort 同）。但 LLVM runtime `ring_list_reverse`/`ring_list_sort_default` **构造 fresh 副本返回、不动接收者**——语句位调用在 native 等于 no-op。编译器自身有 8 处 `.sort(`（穷尽性/codegen 排序等），native 自编译产出的 JS 与 node 版可能**顺序不一致 → G-b（double-bootstrap 字节一致门）地雷**。B-103 已为两个 runtime fn 补元素 dup（RC 健全），但语义分歧未动（修复方向需拍板：LLVM runtime 改原地、或 codegen 把结果写回 receiver alloca）。`tests/cases/llvm/list_share_ops_rc.ring` 的 reverse 用例刻意只断言 len 不断言顺序。发现者：B-103 Wave A。

### #138 std 已声明但 method_to_runtime 未映射的方法在 native 落 panic-stub [low] [judgment] [open]

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

### #148 泛型 `join` 对非 Str 元素 native 堆溢出（oracle 盲区类）[medium] [judgment] [open]

`std/list.ring: join(self: List<T>, separator: Str) -> Str` 对 T 无约束——`List<Int>.join` 过 checker；JS 后端靠 JS 自动 coercion 正常输出，native `ring_list_join` 把元素按 `std::string*` 读 → **heap-buffer-overflow**（ASan 实证：boxed int 16B 被当 32B std::string 读越界；llvm_diff 新用例首跑即触发）。属 B-100 已登记的 oracle 盲区类（JS oracle 本身失真、差分测不出）。修复方向拍板项：① checker 给 join 加 `T: Str`（或 Display）约束 ② runtime 按 typeid 分派 stringification。Stage 2 commit message 中曾以 #147 引用（编号让位于既有条目）。发现者：B-104 D1 Stage 2（Round C1）。

### #152 runtime HOF 内部临时不 drop：谓词 Bool box / fold 中间累加器 / for_each 合成 key（leak 类）[medium] [judgment] [open]

ring_runtime.cpp 的 HOF 家族在循环内持有闭包结果/合成临时但从不 drop（贴码核实，#150 收口时发现）：① `ring_list_filter` / `ring_list_any` / `ring_list_all` / `ring_list_find` / `ring_list_find_index`——谓词结果 Bool box `void* r = fn(...)` unbox 后既不 drop 也无人接手 → **每元素泄 1 BOOL**（闭包返回值经 clone-all-escape 必 owned）；② `ring_list_fold` 非空路径——`acc = fn(env, acc, elem)` 直接覆盖，中间累加器（闭包的 owned 结果）无 drop → **每次 fold 泄 n-1 个中间值**（init 是 borrow 不可 drop，但 i≥1 的旧 acc 是 fold 自有的 owned 值）；③ `ring_map_for_each` / `ring_set_for_each`——每 entry `ring_alloc` 合成 fresh STR key/elem 传给闭包后从不释放 → **每 entry 泄 1 STR**（int-keyed 变体待核）。全部 leak-direction、crash-free、HIR/codegen 双重不可见（runtime 内部，verifier/ANF 永远盖不到）。编译器自编译重度使用 filter/any/find/for_each → 疑似 BOOL 67.8M / STR 86.5M residual（@2.382B）的未归因部分（#151 之外）。修复方向（需拍板）：runtime 循环内 `ring_drop(r)` / fold 对 i≥1 旧 acc drop / for_each 用后释放合成 key——属 runtime 改动但逐函数核对面大，建议独立 wave + ×3 全套。发现者：B-104 D1 Stage 3（#150 收口贴码）。

> （#150 fold 空表 verbatim 返回 init 的 double-free 洞已于 2026-06-12 修复删除：`ring_list_fold` 空表路径 dup-on-share + fold 退役出 `is_arg_returning_call` + anf_arg 机制删除，git `0f80b42`/`735a669`，回归 `tests/cases/llvm/fold_empty_owner_init.ring`。原文「map/set fold 同形」经核实**不成立**——`ring_map_fold`/`ring_set_fold` 符号不存在，见 #138 精化。）

### #151 codegen 合成的 builtin Eq/Ord dict + 闭包 per-call-site 构造后不 drop（CLOSURE/TUPLE 残余泄漏主体嫌疑）[medium] [judgment] [open]

泛型 Eq/Ord dict 派发在调用点合成 fresh dict（`ring_get_builtin_dict` → fresh TUPLE of fresh closures，分类表已标 FRESH）——这些是 **codegen 合成临时、HIR 不可见**，ANF/材料化永远盖不到，构造后无人 drop。Stage 2 收口全部 ANF 可达位置后，自编译残余 live 主体 = STR 86.5M / BOOL 67.8M / **CLOSURE 63.8M / TUPLE 31.9M**（@2.382B）——CLOSURE+TUPLE 高度疑似本项（编译器自身闭包多为 HOF 实参、已被 W1 回收）。发现者：B-104 D1 Stage 2（残余归因）。（首报时列的两个修复方向即后来三案中的 (a)/(b)，已被下方拍板取代。）

**诊断坐实（2026-06-12，probe 实证 + 站点清单）**：5 probe × 100K 热循环逐 box 计数——泛型 Eq 派发恰泄 **1 TUPLE + 2 CLOSURE + 1 STR/次**（STR = dict 名字串，resolve 站点 gen_str_lit 每次 fresh，**本项第三个成员**）；用户 `ring_dict_init` 路径 1 TUPLE + 1 CLOSURE/次；**单态 `xs.contains()` 同样 4 box/次**（影响面不限泛型代码）；对照组 0 泄漏。泛型 Ord 另泄 cmp 结果 INT box/次（`gen_ord_dispatch_llvm` unbox 后不 drop，同 while-cond box 家族，收口时一并补）。合成站点 4 路（resolve_dict_ref 三子路径 / TraitDispatch::Direct / gen_dict_closure_wrapper / build_wrapped_dict）全部 per-call-site-execution fresh、dict 数据零复用；**JS 后端同名 dict = 模块级单例 const → fresh-per-execution 是 LLVM 后端独有偏离**。自编译 @2.382B TUPLE:CLOSURE = 31.7M:63.4M 恰 1:2（Eq-dict 指纹）→ 本项 ≈ residual live 的 **28%~38%，当前最大单一泄漏类**。

**修复方向已拍板（2026-06-12 Discussion）= (c) dict evidence HIR 一等化 + 吸收 (b) 单例语义（静态单例 + 动态局部）**：静态 dict = HIR 模块级单例实体（使用点 borrow 引用，两后端同源 lower），动态 wrapped = HIR 局部 evidence 构造值（owned，D1/D2 正常覆盖，verifier 豁免类删除）；Ord-result-box 一并补。否决 (a) per-use drop / 纯 (b) codegen 级缓存。spec = backlog **B-104 D4**；设计真值 = design.md §7.11「dict evidence HIR 一等化」+ 决策表。修后量化验证（tid7/tid10/tid3 + churn）归 D4 验收。





### #145 Option HOF/find inline 模板硬编码 `_tag`/`"some"`/`_0` JS 字符串 [low] [mechanical] [open]

codegen_expr.ring 的 Option HOF（map/and_then/unwrap_or_else）与 find 模板硬编码 `_tag`/`"some"`/`_0`，而紧邻的 `to_fail` 分支用 `ENUM_TAG_FIELD`/`OPTION_SOME_TAG`/`OPTION_PAYLOAD_FIELD` 常量。pre-existing（#28 重构按「纯重构」如实保留）。修复：统一改用常量。发现者：#28 重构。

## 诊断 / CLI

### #141 parser.ring:301 catch 触发 W0001「handler 永不执行」[low] [judgment] [open]

`some(self.parse_use_decl(false)) catch { _ => none }` 被 checker 判定无 fail effect。B-112 把 warnings 接到出口后，每次 self-compile stderr 打 1 条。若 `parse_use_decl` 确实可 fail → impl-effect-propagation bug（CLAUDE.md 已知限制）的假阳性实证；若不可 fail → dead catch 应删。二者皆需拍板，顺带消除 self-compile 噪音。发现者：B-112。

### #142 多文件管线 `--error-format=llm` 整体失效 [low] [judgment] [open]

resolver / compiler_mod 的 error 与 warning 输出内联 `eprintln(format_human(...))`，`error_format` 未下传——multi-file 模式 `--error-format=llm` 静默退化为 human（error 与 warning 皆然，pre-existing）。修复方向：诊断收集上提至 cli.ring 统一格式化，或 plumbing error_format。发现者：B-112。

### #143 E0105 在 parser 硬编码且未注册 codes.ring [low] [mechanical] [open]

parser.ring:2143/2147 以字符串字面量 `"E0105"` 报错，codes.ring 无 const 也无 error_description 条目——违反「不允许跨阶段硬编码字符串契约」。修复：注册 E0105 + parser 改用 const。发现者：B-115。

### #144 单文件 `run` 子命令是 stub 且泄漏临时文件 [low] [judgment] [open]

cli.ring:177 "Single-file run not yet implemented"（EXIT 1），且在源文件目录残留 `.ring_tmp_run.js`（orchestrator 实测复现）。CLAUDE.md 常用命令已改为 build + node 流。修复方向：实现单文件 run（编译 + 执行 + 清理临时产物），或删 stub 改提示 build 流；`--debug` 同路径一并处理。发现者：B-115。

## 代码质量 / 可维护性

### #6 `runtime.ring` 用数百个 `.push()` 拼接 JS 运行时代码 [low] [mechanical] [open]

应改用 raw string 或外部 .js 文件。

### #7 `infer.ring` 2826 行单文件 [low] [judgment] [open]

编译器最大单文件，从 2565→2763→2826 行持续增长。应拆分为 infer_stmt/infer_expr/infer。





## 架构债

### #16 StructType/EnumType 携带冗余 fields/variants 数据 [low] [judgment] [open] [deferred: LLVM]

类型表示不一致。应改为 nominal 表示。

**决策（2026-05-23）**：长期容忍，与 #45 一并推迟到 LLVM 后端阶段。改 nominal 表示（只存 `name + type_args`，fields 走 registry 查）后，#45（apply_subst 不递归 fields）/ 原 #108（occurs check 不查 fields——2026-06-03 贴码核为正确 nominal 语义非 bug 已 wontfix 删除：fields/variants 是声明模板，环只能经 type_params 形成、occurs check 已覆盖，递归查模板 var 反而误判）随之一并消解——它们都是当前 fields-as-template 表示的衍生现象。

### #19 Ring 编译器缺少 `assertNever` 等效编译期保护 [low] [mechanical] [open]

新 variant 易遗漏。应确保所有 match 穷尽。

### #20 HExpr/HStmt match 在 5+ pass 中重复 [low] [judgment] [open]

维护负担。应扩展 hir-visitor。

**D2 重估结论（2026-06-12，git `efe6054` 归档）**：verifier（第 6 个全量 match）**不建**通用 visitor——位置敏感所有权记账（同一表达式在 consume/borrow/cond 位行为不同 + 路径快照/恢复/分支合并）无法折进 fold visitor；叶子分类经 pub 谓词共享（无重复代码）。「扩展 hir-visitor」方向对 RC/verifier 类 pass 已证不适用，#20 维持不立项；如未来出现纯结构遍历的新 pass 再重估。

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
