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



<!-- #45 done (2026-06-25): auto-resolved by #16 nominal refactor — fields no longer in Type, apply_subst only substitutes type_params. -->





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

<!-- #136 closed: 5 个 mapped-but-missing 符号全部解决——to_int/to_float/enumerate 死映射已清理（B-094），map_is_empty/set_is_empty runtime 已实现 + 映射已补齐。2026-06-16 核实 -->

<!-- #137 closed: B-123 落地（reverse/sort/sort_default 改原地），2026-06-13 -->

### #138 Map/Set.fold + clone 方法语法在 native 落 panic-stub [low] [judgment] [open] [latent]

**已修复（2026-06-16 核实）**：StringBuilder.line/add_int、Set.clear/union/intersect/difference 已补齐 method_to_runtime 映射 + runtime 符号。

**残留（latent，编译器零使用）**：`Map.fold` / `Set.fold`（无 runtime 符号 + 无映射）；str-keyed `Map.clone()` / `List.clone()` / `Set.clone()` 方法语法（int-keyed 有映射、str-keyed 落空；直呼 `map_clone(m)` 经 `ring_` fallback 正常）。发现者：B-103 Wave A。

<!-- #140 done (B-144, 2026-06-25): gen_lambda 闭包捕获 extern handle 跳过 dup。collect_extern_capture_names HIR walker 识别 extern type 捕获。ring_drop null-safe，无需 runtime 改动。 -->

<!-- #146 done (B-144, 2026-06-25): HProgram.extern_type_names 全局集合，checker 阶段收集所有模块的 extern type names，compiler_mod 做全局 union。perceus/codegen/verify_rc 改用 program-level set。 -->

### #147 跨模块裸名碰撞可误伤 extern-handle 排除判定 [low] [judgment] [open] [latent]

`is_extern_handle_type`（hir.ring:504）按裸名匹配 `externs.contains(name)`。B-144 全局化了集合但未改匹配策略——同名用户 struct 仍会被误排除。当前风险≈0（`LLVM*Ref` 命名空间独占）。真解 = 模块限定名。发现者：B-104 D1 Stage 1。

<!-- #148 closed: B-124 落地（join 签名收紧为 List<Str>），2026-06-13 -->

<!-- #157 closed: 调查确认不复现——perceus 已正确 scope-end-drop fresh payload-enum let 绑定（NamedVariantConstruct → is_droppable_init=true → Drop emitted）。verify_rc 通过 0 errors。D9 probe 的 tid68 泄漏可能是自编译场景下更复杂的组合或已在 D9 Part 2 单例化后消除。回归测试：tests/cases/llvm/enum_payload_drop.ring。 -->

<!-- #152 runtime HOF 三类 drop 修复已落地并删除（2026-06-15）：谓词 Bool box / fold 中间累加器 / for_each 合成 key。ring_runtime.cpp 10 函数修复 + D5 诊断计数器删除 + 回归 tests/cases/llvm/hof_drop_runtime.ring。待 ×3 llvm_diff 终验。 -->





## 诊断 / CLI

<!-- #141 closed: B-138 修复 impl SCC 排序后 parser W0001 假阳性从 5 降到 1（仅剩互递归 SCC 环），self-compile W0001 总数 12→8。2026-06-15 -->

<!-- #142 --error-format=llm 多文件已修复并删除（2026-06-15）：error_format 从 cli.ring plumb 到 resolver/compiler_mod，所有 format_human 调用点加 llm 分支。回归 2 个 E2E 测试。 -->

<!-- #143 closed: E0105 注册 codes.ring + parser 改用常量，2026-06-13 -->

<!-- #144 closed: 单文件 run 实现 + 临时文件清理，2026-06-15 -->

## 代码质量 / 可维护性

<!-- #6 runtime.ring push 重构已落地并删除（2026-06-15）：~240 个 push 调用合并为 ~30 个 raw string 块，生成 JS 字节一致。 -->

<!-- #7 done (2026-06-25): infer.ring 3196→2362 行（-834）。24 函数 + 2 struct 提取到 infer_helpers.ring (870 行)。互递归核心（infer_block/stmt/expr）留 infer.ring，独立 helper 单向依赖提取。909 E2E。 -->





## 架构债

<!-- #16 done (2026-06-25): nominal StructType/EnumType — removed inline fields/variants. 20 source files, 800+/872- lines. Registry lookup via TypeEnv.types.structs/enums. #45 (apply_subst field skip) auto-resolved. 909 E2E, double bootstrap, dist+dist-llvm rebuilt. -->

<!-- #19 closed: Ring 已有编译期 match 穷尽检查，原诉求（assertNever）已被语言特性覆盖，2026-06-15 -->
<!-- #20 closed: D2 结论"不立项"——visitor 对 RC/verifier 不适用，叶子谓词已共享（git efe6054），2026-06-15 -->

## Delegate 完整性（2026-05-23 审计发现）

<!-- #93 closed (wontfix, 2026-06-25): delegate 合成的转发 body 类型完全由字段 impl 决定，跑推断结果不变。架构不纯但功能正确——delegate 支持 custom effect trait 且 23 个测试覆盖。深度调研（infer_decl.ring expand_delegate_impls）确认。 -->

<!-- #123 closed (wontfix, 2026-06-25): JS 端 callee_type 路径"笨转发"所有 evidence，JS 闭包作用域保证变量可达；LLVM 端 dict dispatch 走闭包 slot，evidence 在 dict 构建时捕获，fail 用 setjmp 不需 evidence param。两后端均无触发路径。深度调研确认。 -->

<!-- #122 closed (not-a-bug, 2026-06-25): JS 端未 handled 的 evidence 通过闭包链正确传播（effect_row_runtime.ring 测试证明）；LLVM 端 ctx.named_values 只覆写 handled effects 的 alloca，unhandled 原地可达。两后端均验证无问题。 -->


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
