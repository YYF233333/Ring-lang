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

### #149 未标注 fn 的返回类型被过度泛化为自由 TypeVar（健全性洞）[critical] [judgment] [done] [fixed: B-122, 2026-06-14]

> **已修复**：B-122 落地——checker Pass 2 改为 SCC 拓扑序驱动 + `rebind_fn_type` 将推断后的 ret 映射回注册层。负面测试 `scc_ret_soundness.ring`（E0301）+ 正面测试 `scc_mutual_recursion.ring` 已覆盖。Perceus `is_unresolved_var_type` 守卫保留作 invariant 防线。







## Codegen

### #156 Eq 语义残留 identity 比较：native contains/index_of 裸指针 + JS find/Map key `===`（COW 可观测性洞）[medium] [judgment] [open]

- `ring_runtime.cpp:895/903`（`ring_list_contains` / `ring_list_index_of`）为裸指针比较（注释自认 "pointer comparison (bootstrap)"）；JS 后端 contains 已走 Eq trait → **两后端现行发散**。JS 侧残留 = `List.find` / Map key `===`（CLAUDE.md 已知限制在案）。
- **升格定性（2026-06-13 Discussion）**：不止正确性债——identity 比较是 RC 实现泄进语义的**现行窗口**（dup 副本同地址 → contains 判 true，深拷贝异地址 → 按值判定；COW/dup 因此可观测，design.md §7.9 四通道之②）。配套语言层负面承诺：**永不提供 ptr_eq/is 类算子**（含 `Rc<T>` 上）。
- 修复方向：Eq trait 派发统一（native contains/index_of 接 Eq dict 路径）；Map key 归 B-107（泛型 key + Hash trait）。

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

### #159 ring_list_sort_default 对非 Int 类型按内存地址排序（垃圾结果）[medium] [judgment] [open]

`ring_runtime.cpp:1127-1135` 的 `ring_list_sort_default`（`.sort()` 无 comparator 版本）使用 `ring_unbox_int(a) < ring_unbox_int(b)` 比较——对 tagged Int 正确，但对堆分配类型（Str、struct、enum 等）`ring_unbox_int` 把堆指针按位右移 1 位，结果是按半地址值排序，**输出垃圾但不 crash**。

JS 后端（`runtime.ring:89`）：`self.sort(function(a, b) { return a < b ? -1 : a > b ? 1 : 0; })`——对 Str 做词典序（JS `<` 触发 toString），对对象做 `[object Object]` 比较（同样不正确但结果不同）。

**两后端均不正确但方式不同** → 差分测试可能**两方都错 = diff 也通过**。当前编译器自身只用 `.sort_by()`（有 comparator），`.sort()` 零使用 → latent。但用户代码写 `strs.sort()` 会静默得到垃圾排序。

与 #156（Eq 族 identity 比较）同属「runtime 操作缺 trait dispatch」家族，但 #156 是 Eq 侧（contains/index_of），本条是 Ord 侧（sort）。修复方向类似：ring_list_sort_default 应接 Ord dict 参数做真实比较，或对未提供 comparator 的 `.sort()` 要求 `T: Ord` bound（checker 层拦截）。

发现者：Audit workflow (backend-parity + runtime-abi lens, 2026-06-13)

### #29 Runtime 耦合 Node.js ESM（createRequire）[low] [judgment] [open]

可移植性问题。

> #130（闭包 env 捕获泄漏）/ #131（perceus drop 落不了地，96 rc-warn）已于 2026-06-03 并入 B-084（✅ 已落地删除，见 git）；剩余闭包 RC 收口归 **B-096**。

### #136 LLVM 后端 5 个 mapped-but-missing runtime 符号 [low] [judgment] [open]

B-103 全量枚举 ring_runtime.cpp 时发现：`method_to_runtime`（codegen_llvm_expr.ring）映射了 5 个 **ring_runtime.cpp 中不存在**的符号——`ring_str_to_int`（Str.to_int）、`ring_str_to_float`（Str.to_float）、`ring_list_enumerate`（List.enumerate，且在 codegen_llvm.ring:174 被无条件 declare）、`ring_map_is_empty`（Map.is_empty）、`ring_set_is_empty`（Set.is_empty）。任何程序在 `--target=llvm` 下调用这些方法 → 链接失败（undefined symbol）。当前编译器/测试零使用（`.enumerate` 仅注释提及）→ latent。修复方向：补 runtime 实现或删映射改走 Ring impl；**注意其中 to_int/to_float/enumerate 三个已由 B-094 拍板「确定不加、清死映射」（2026-06-03，enumerate 真做时归 B-095）——本条净增量 = `ring_map_is_empty`/`ring_set_is_empty` 两个，修复时勿与 B-094 决策冲突**。发现者：B-103 Wave A。

<!-- #137 closed: B-123 落地（reverse/sort/sort_default 改原地），2026-06-13 -->

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

<!-- #148 closed: B-124 落地（join 签名收紧为 List<Str>），2026-06-13 -->

### #157 fresh payload-enum 局部 match-then-discard 未 scope-end-drop（leak 类）[low] [judgment] [open]

D9 probe-E 撞出：`let c = Color::Blue{shade}` 在循环内 matched-then-discarded（match 只投影标量 payload、不消费外壳），每轮泄 `tid68=n`。fresh owned payload-enum 作为 let 绑定应被 scope-end-drop 回收，但实际未 drop——疑似 perceus scope 建模对 matched-then-projected 的 let 绑定遗漏。与 D9 Part 2（UnitType 单例化、const-enum 类）无关，与 Part 1（interp SB codegen-drop）无关——是独立 RC gap。subagent 已改写 probe 绕开以隔离 const 类测量。发现者：B-104 D9 probe 构造期。

### #152 runtime HOF 内部临时不 drop：谓词 Bool box / fold 中间累加器 / for_each 合成 key（leak 类）[medium] [judgment] [open] [deferred: B-104]

ring_runtime.cpp 的 HOF 家族在循环内持有闭包结果/合成临时但从不 drop（贴码核实，#150 收口时发现）：① `ring_list_filter` / `ring_list_any` / `ring_list_all` / `ring_list_find` / `ring_list_find_index`——谓词结果 Bool box `void* r = fn(...)` unbox 后既不 drop 也无人接手 → **每元素泄 1 BOOL**（闭包返回值经 clone-all-escape 必 owned）；② `ring_list_fold` 非空路径——`acc = fn(env, acc, elem)` 直接覆盖，中间累加器（闭包的 owned 结果）无 drop → **每次 fold 泄 n-1 个中间值**（init 是 borrow 不可 drop，但 i≥1 的旧 acc 是 fold 自有的 owned 值）；③ `ring_map_for_each` / `ring_set_for_each`——每 entry `ring_alloc` 合成 fresh STR key/elem 传给闭包后从不释放 → **每 entry 泄 1 STR**（int-keyed 变体 `ring_map_int_for_each`/`ring_set_int_for_each` 同形合成 INT box，D5 已核实）。全部 leak-direction、crash-free、HIR/codegen 双重不可见（runtime 内部，verifier/ANF 永远盖不到）。修复方向（需拍板）：runtime 循环内 `ring_drop(r)` / fold 对 i≥1 旧 acc drop / for_each 用后释放合成 key——属 runtime 改动但逐函数核对面大，建议独立 wave + ×3 全套。发现者：B-104 D1 Stage 3（#150 收口贴码）。

> **D5 定量更新（2026-06-12，git `7323ee6`/`deab122` 直接计数器实测）**：原文「编译器自编译重度使用 filter/any/find/for_each → 疑似 BOOL 67.8M / STR 86.5M residual 未归因部分」**被证伪**——自编译 @2.382B 三类站点合计份额 ≈ 0（pred_bool=5,921 绝对值 = BOOL residual 的 0.008%；fold_acc=0；foreach_key_str/int=0；编译器源码以 for 循环为主，HOF 走得极少）。**本条对 G-a 零杠杆**，但泄漏类对用户面 HOF-heavy 程序仍真实——**已拍板（2026-06-12 Discussion）：降级用户面收口项，脱离 G-a 关键路径，B-104 落地后与 B-121 同档排期**（修法方向维持原文：runtime 循环内 drop，独立 wave + ×3 全套）。BOOL/STR residual 真身见 #153/#154 + And/Or-cond 类（D1 保守保留清单）。

> （#153 none per-eval fresh 泄漏 + #154 const-getter fresh 重物化已于 2026-06-12 修复删除：B-104 D6 落地（none = runtime lazy 单例 typeid 18 OPTION_NONE，codegen 只声明；Str const = lazy memoised getter + `ring_const_intern` 重标 typeid 19 CONST_STATIC；HIR/perceus/verify_rc 零修改零新增豁免），git `17a4ad3` + 落账 commit；re-measure @2.382B leak 9.2%→5.4%（OPTION 64.2M→0.04M = some 类水平、STR −29.4M 正中预测）、15GB kill 点 +67%、probe 固化 `tests/cases/llvm/none_const_singleton_hotloop.ring`。归因明细存档 = design.md §7.11「D5 归因后收口」+ git history。#154 注的 types.ring:386 同站点 `&&` 双臂 BOOL 类归 D7。）

> （#150 fold 空表 verbatim 返回 init 的 double-free 洞已于 2026-06-12 修复删除：`ring_list_fold` 空表路径 dup-on-share + fold 退役出 `is_arg_returning_call` + anf_arg 机制删除，git `0f80b42`/`735a669`，回归 `tests/cases/llvm/fold_empty_owner_init.ring`。原文「map/set fold 同形」经核实**不成立**——`ring_map_fold`/`ring_set_fold` 符号不存在，见 #138 精化。）

> （#151 dict evidence 泄漏已于 2026-06-12 修复删除：B-104 D4 dict evidence HIR 一等化落地（静态单例 + 动态局部），git `0411b4c`..`f8d8891` + 验收 `663827a`/`2635bcc`；re-measure @2.382B leak 14.0%→9.2%（−34.1%，预测 28~38% 实测 34% 正中）、CLOSURE/TUPLE 退出 top-6、5-probe 固化 `tests/cases/llvm/dict_singleton_hotloop.ring`。归因/三案对比存档 = design.md §7.11 + git history。）





## 诊断 / CLI

### #141 parser.ring:301 catch 触发 W0001「handler 永不执行」[low] [judgment] [open]

`some(self.parse_use_decl(false)) catch { _ => none }` 被 checker 判定无 fail effect。B-112 把 warnings 接到出口后，每次 self-compile stderr 打 1 条。若 `parse_use_decl` 确实可 fail → impl-effect-propagation bug（CLAUDE.md 已知限制）的假阳性实证；若不可 fail → dead catch 应删。二者皆需拍板，顺带消除 self-compile 噪音。发现者：B-112。

### #142 多文件管线 `--error-format=llm` 整体失效 [low] [judgment] [open]

resolver / compiler_mod 的 error 与 warning 输出内联 `eprintln(format_human(...))`，`error_format` 未下传——multi-file 模式 `--error-format=llm` 静默退化为 human（error 与 warning 皆然，pre-existing）。修复方向：诊断收集上提至 cli.ring 统一格式化，或 plumbing error_format。发现者：B-112。

<!-- #143 closed: E0105 注册 codes.ring + parser 改用常量，2026-06-13 -->

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
