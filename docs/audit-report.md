# Ring 编译器技术债清单

自举审计 (2026-05-21) 产出。三路并行审计（Claude×2 + DS V4 Pro）去重合并后的长期跟踪清单。
已修复项以删除线标记。53 项中 29 项已修复（#1-5, #9, #11-13, #15, #17-18, #21, #23-24, #25, #27, #31, #33, #35, #43-44, #46-50, C1-C3）。

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
