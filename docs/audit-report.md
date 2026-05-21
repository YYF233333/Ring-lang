# Ring 编译器技术债清单

自举审计 (2026-05-21) + Phase B Wave 1 审计 (2026-05-22) 产出。三路并行审计（Claude×2 + DS V4 Pro）去重合并后的长期跟踪清单。
已修复项以删除线标记。69 项中 37 项已修复（#1-5, #9, #11-13, #15, #17-18, #21, #23-24, #25, #27, #31, #33, #35, #43-44, #46-50, #54-58, #60-61, #65, C1-C3）。
Phase B Wave 1 审计新增 16 项（#54-69），其中 #54-58, #60-61 已修复。

---

## 代码质量 / 可维护性

| # | 问题 | 影响 | 备注 |
|---|------|------|------|
| 1 | ~~`empty_xxx()` 空列表 boilerplate~~ | ~~可读性~~ | **已修复**：`[]` 类型推断 + 全量清理（Phase 3 Iter 1） |
| 2 | ~~`hexpr_type`/`expr_type`/`expr_effects` accessor 重复~~ | ~~维护陷阱~~ | **已修复**：统一到 `hir.ring`（Phase 3 Iter 1） |
| 3 | ~~`types_equal` 148 行重复模式~~ | ~~可读性~~ | **已修复**：C5 提取 helper（Phase 3） |
| 4 | ~~`JS_RESERVED()` 每次 `safe_ident()` 调用重建 Set~~ | ~~性能~~ | **已修复**：迁移为 `const`（Phase 3 Iter 2） |
| 5 | ~~`BUILTIN_*()` 每次调用分配新字符串~~ | ~~性能~~ | **已修复**：75 个常量函数迁移为 `const`（Phase 3 Iter 2） |
| 6 | `runtime.ring` 用数百个 `.push()` 拼接 JS 运行时代码 | 可维护性 | 改用 raw string 或外部 .js 文件 |
| 7 | `infer.ring` 2763 行单文件 | 可导航性 | 拆分为 infer_stmt/infer_expr/infer |
| 8 | `compiler_mod.ring` ESM 输出 310 行单函数 | 可维护性 | 提取 helper |
| 9 | ~~嵌套 if/else 链代替 match（derive.ring, codegen_derive.ring）~~ | ~~可读性~~ | **已修复**：C6 改为 match（Phase 3） |
| 10 | `token_kind_value` 字符串比较代替 Eq trait 派生 | 性能 | 为 TokenKind derive Eq |
| 11 | ~~`MergeResult` 等 wrapper struct~~ | ~~噪音~~ | **已修复**：MergeResult 已用 `.0`/`.1` 替代（Phase 3 Iter 1） |
| 12 | ~~`index_of_int`/`index_of_str` 重复实现~~ | ~~小重复~~ | **已修复**：函数已在自举重构中移除 |
| 49 | ~~4 处重复的 effect→name 转换函数~~ | ~~维护负担~~ | **已修复**：提取 `effect_kind_name` 到 `types.ring`，4 个调用点统一引用 |
| 50 | ~~`package.json` 含未使用的 LSP 依赖~~ | ~~安装体积~~ | **已修复**：移除 `vscode-languageserver` + `textdocument` 依赖 |
| 13 | ~~`try_eq_dispatch` 用空字符串作 sentinel~~ | ~~脆弱约定~~ | **已修复**：C8 改为 `Option<Str>`（Phase 3） |
| 14 | 68 处 `panic()` 调用（约 40 处 unreachable） | 崩溃而非友好报错 | 逐步替换为 DiagnosticSink |

## 架构债

| # | 问题 | 影响 | 备注 |
|---|------|------|------|
| 15 | ~~TypeEnv 17+ public mutable 字段（god object）~~ | ~~**最大架构债**~~ | **已修复**：C3 拆分为 4 个 sub-struct（Phase 3） |
| 16 | StructType/EnumType 携带冗余 fields/variants 数据 | 类型表示不一致 | 改为 nominal 表示 |
| 17 | ~~Substitution 每次 unify 复制整个 Map（O(n²)）~~ | ~~性能~~ | **已修复**：C4 改用 union-find（Phase 3） |
| 18 | ~~模块 resolver 对每个文件 parse 两次~~ | ~~性能~~ | **已修复**：C7 缓存 AST（Phase 3） |
| 19 | Ring 编译器缺少 `assertNever` 等效编译期保护 | 新 variant 易遗漏 | 确保所有 match 穷尽 |
| 20 | HExpr/HStmt match 在 5+ pass 中重复 | 维护负担 | 扩展 hir-visitor |

## Checker 关注项

| # | 问题 | 影响 | 备注 |
|---|------|------|------|
| 21 | ~~Trait 方法查找无歧义检测~~ | ~~潜在错误解析~~ | **已修复**：`lookup_trait_method` 检测到多 trait 同名方法时报 E0504 歧义错误 |
| 22 | `bind_pattern` named constructor 不验证字段完整性 | 低 | 穷尽性检查兜底 |
| 23 | ~~`infer_if` 无 else 返回 UNIT 不与 then 分支统一~~ | ~~表达式位置意外~~ | **已修复**：无 else 返回 UNIT 是正确语义，有 else 时已正确 unify 两个分支 |
| 24 | ~~`is_primitive_eq` 缺少 NeverType/AnyType~~ | ~~边界情况~~ | **已修复**：添加 NeverType/AnyType 分支 |
| 25 | ~~`?` 运算符 `fail<fresh_var>` 错误类型未约束~~ | ~~极低~~ | **已修复**：`?` 运算符已移除（语法修订），替换为 `unwrap`/`to_fail` 方法 |
| 26 | `CollectingSink.report()` 非 var self 但通过引用突变 | 语义不一致 | 深不可变性强制前不会 break |
| 43 | ~~`infer_catch` 只取最后一个 `FailEffect` 的 error_type~~ | ~~类型推断不准~~ | **已修复**：收集所有 fail effect 的 error_type 并 unify 为统一类型 |
| 44 | ~~`infer_numeric_op` 对 `TypeVar` 直接返回 `INT`~~ | ~~类型多态丢失~~ | **已修复**：对 TypeVar 调用 `unify_at(resolved, INT)` 正确约束类型变量 |
| 45 | `StructType`/`EnumType` 在 `apply_subst` 中不替换 fields | 设计约束 | fields 是模板字段（含递归引用），递归替换会导致 `Node<T>` 等递归类型栈溢出。当前 `infer_field_access` 的 inst_map 兜底是正确设计。如需修复需改为 nominal 表示（关联 #16） |
| 46 | ~~`rebind` 找不到变量时静默失败~~ | ~~掩盖调用端 bug~~ | **已修复**：找不到变量时 panic 报告内部错误 |
| 47 | ~~`apply_subst_map` 无循环引用深度保护~~ | ~~潜在栈溢出~~ | **已修复**：TypeVar 追踪提取为 `chase_type_var_map`，深度超过 100 时终止递归 |
| 48 | ~~`unify_effect_rows` 同 tail 不匹配 effects 静默跳过~~ | ~~语义待确认~~ | **已修复**：同 tail 有 unmatched effects 时，绑定 tail 到包含所有 unmatched effects 的扩展行（符合 Koka row unification 语义） |
| 42 | **Impl 方法 effect 不回传**：impl 方法在 Pass 1 注册为 `EMPTY_ROW`，Pass 2 推断出实际 effect 后不更新环境。导致 `fail.raise()` 在 impl 方法中无法通过 `catch` 正确捕获 | **中** | Workaround：parser 用 `__ring_raise_fail` extern fn 绕过 evidence passing；codegen `gen_try_catch` 已去除 `has_fail_effect` 前置检查。正式修复需在 impl 方法检查后回传 effect 到环境 |

## Codegen 关注项

| # | 问题 | 影响 | 备注 |
|---|------|------|------|
| 27 | ~~IIFE match 表达式不转发 evidence~~ | ~~低概率~~ | **已修复**：`gen_match` 通过 CodegenCtx 正确传递 evidence 参数 |
| 28 | HOF inline 代码在 List/Map/Set/Option 间重复 | ~100 行重复 | 抽象迭代模式 |
| 29 | Runtime 耦合 Node.js ESM（createRequire） | 可移植性 | |
| 30 | Codegen match labeled break 与用户 break 语义交互 | 低 | 需文档说明 |

## 模块/诊断

| # | 问题 | 影响 | 备注 |
|---|------|------|------|
| 31 | ~~`extract_exports` 包含 builtin impls 导致重复注册~~ | ~~低~~ | **已修复**：仅导出用户 AST 中的 impl，builtin impls 已正确过滤 |
| 32 | 循环依赖检测返回 none 无诊断详情 | 用户体验 | 报告具体循环路径 |
| 33 | ~~`load_prelude` 找不到 std 目录时静默跳过~~ | ~~误导性错误~~ | **已修复**：函数已在自举重构中移除/重构 |
| 34 | 错误码编号有缺口（E0202/E0400/E0401 等） | 文档 | |
| 35 | ~~`resolver.ring:39` 未使用的 `relative` 变量~~ | ~~死代码~~ | **已修复**：删除未使用变量 |
| 51 | ~~4 个错误码缺负向测试覆盖~~ | ~~回归保护不完整~~ | **部分修复**：E0101/E0207/E0706 已补充负向测试；E0403 定义但未实现（无触发点），待 effect 检查完善后补充 |
| 52 | effect 标注语法（F1）测试覆盖薄 | 回归保护不充分 | 仅 3 个用例（正向×2+负向×1），缺多 effect 组合、impl 方法交互、effect 类型不匹配等边界用例 |
| 53 | 模块负向测试不验证具体错误码 | 测试精度不足 | `e2e.test.ts` 模块负向测试仅断言 `!result.success`，与单文件负向测试（验证具体错误码）标准不一致 |

## 设计-实现差距（未实现特性）

| # | 设计功能 | 状态 | 优先级 |
|---|----------|------|--------|
| 36 | Refinement types (where 子句) | 语法解析但语义忽略 | Phase C |
| 37 | `mut<S>` 参数化 effect | 未实现 | Phase B |
| 38 | Post-resume handler / Full algebraic effect | 未实现 | 未排期 |
| 39 | `dyn Trait` 动态分发 | 未实现 | 未排期 |
| 40 | Supertrait 继承 | AST 字段存在但空 | 未排期 |
| 41 | 关联类型 | 未实现 | 未排期 |

---

## Phase B Wave 1 审计 (2026-05-22)

三路并行审计（Claude Opus + Claude Sonnet + DS V4 Pro）。审计范围：S1（标准库迁移）、F1（effect 标注语法）、M1（inline mod 块）。

### Mod 块实现缺陷

| # | 问题 | 影响 | 发现者 | 备注 |
|---|------|------|--------|------|
| 54 | ~~`prefix_decl_name` 仅处理 Fn/Struct/Enum/ExternFn/Const，对 Impl/Trait/Effect/TypeAlias/ExternType/ModBlock 返回原值~~ | ~~**Bug：mod 内 impl 方法注册在未限定名下，外部调用报 E0305**~~ | Claude×2+DS | **已修复**：扩展 `prefix_decl_name` 处理 Impl/Trait/Effect/ExternType/TypeAlias；ModBlock 注册增加 Trait/Effect 短名别名；codegen 补充 ModBlock 内 Impl/Trait 收集 |
| 55 | ~~`parse_type_expr` 不支持限定类型语法 `mod::Type`~~ | ~~**Bug：函数签名不能引用 mod 内类型**~~ | Sonnet | **已修复**：`TypeExpr::Named` 增加 `qualifier: Str?` 字段，`parse_type_expr` 支持 `mod::Type` 和 `super::Type` 语法，`resolve_type_expr` 使用 qualifier 构建限定名 |
| 56 | ~~两级限定访问 `mod::Enum::Variant` 不支持~~ | ~~**Bug：无法引用 mod 内 enum 变体**~~ | Sonnet | **已修复**：表达式和模式 parser 支持 `mod::Enum::Variant` 三级限定访问；enum 名称解析改用 `enum_def.name`（规范名）而非查找键 |
| 57 | ~~`is_decl_start` 缺少 `TkMod`~~ | ~~**Bug：解析错误恢复跳过 mod 块**~~ | Opus+Sonnet | **已修复**：`TkMod` 已在 `is_decl_start` 中（发现时已修复） |
| 58 | ~~`exports.ring` + `compiler_mod.ring` 的 ModBlock 分支遗漏 Enum 导出~~ | ~~Issue：多文件 pub mod 中的 enum 类型对外不可见~~ | Opus+Sonnet | **已修复**：（commit 4657e0d）exports.ring 和 compiler_mod.ring 已正确处理 ModBlock Enum 及 variant 导出 |
| 59 | 嵌套 mod 块产生错误限定名 | Concern | Opus+DS | `mod a { mod b { fn f } }` → 注册为 `b::f` 而非 `a::b::f`。`prefix_decl_name` 不处理 ModBlock，内层 mod 丢失外层前缀 |
| 60 | ~~`parse_mod_block` 缺少错误恢复~~ | ~~Issue~~ | Sonnet | **已修复**：添加 `catch { _ => none }` + 声明级恢复扫描（与 `parse_program` 一致） |
| 61 | ~~短名别名泄漏且可互相覆盖~~ | ~~Issue~~ | Opus+Sonnet+DS | **已修复**：注册阶段别名插入前检查 `contains_key`，已有别名不覆盖（first wins）；用户通过限定名 `mod::Type` 消歧义 |
| 62 | 短名别名插入逻辑在 3 处重复 | Concern | Opus | `register_phase1`、`register_decl`（ModBlock 分支）、`check_mod_decl` 中重复相同的 Struct/Enum 别名插入，维护风险 |
| 63 | 无 mod 块负向测试、无 impl-in-mod 测试、无 const-in-mod 测试、无嵌套 mod 测试 | Concern | 全部 | 仅有 `mod_basic.ring`（函数）和 `mod_struct.ring`（struct）两个正向测试 |

### Effect 标注（F1）缺陷

| # | 问题 | 影响 | 发现者 | 备注 |
|---|------|------|--------|------|
| 64 | `effects_match_kind` 只做 kind 级匹配，忽略 fail 错误类型 | Issue（设计决策） | Opus | `with {fail<Str>}` 匹配 `fail<Int>` 不报错。标注中的错误类型是装饰性的。若标注作为公共契约，应验证类型参数 |
| 65 | ~~`effects_match_kind` 在 `unify.ring` 和 `infer_decl.ring` 中完全重复~~ | ~~Issue~~ | DS | **已修复**：提取到 `types.ring` 作为 `pub fn effects_match_kind`，两处改为 import |
| 66 | `register_impl_method` 接收 `declared_effects` 参数但完全不使用 | Issue（已知限制扩展） | DS | impl 方法 effect 注册为 `EMPTY_ROW`，显式 `with {io}` 标注被忽略。关联 #42 |
| 67 | `std/io.ring` 的 `print`/`assert`/`exit` 缺少 `with {io}` 标注 | Issue | Sonnet | 纯函数 `with {}` 内调用 `print()` 不报 E0404——extern fn 无标注时注册为 EMPTY_ROW |
| 68 | `resolve_effect_expr` 不验证 effect 名是否存在 | Concern | Opus | `with {typo}` 静默创建 CustomEffect，不报错。因为标注是上界，不使用的 effect 合法，但拼写错误无法捕获 |

### 文档 / 其他

| # | 问题 | 影响 | 发现者 | 备注 |
|---|------|------|--------|------|
| 69 | `docs/design.md` 仍将 inline mod 块列为"未实现" | 文档过时 | Opus | M1 已完成，需更新 design.md 实现状态附录 |
