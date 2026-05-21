# Ring 编译器技术债清单

自举审计 (2026-05-21) 产出。三路并行审计（Claude×2 + DS V4 Pro）去重合并后的长期跟踪清单。
已修复项已移除，仅保留待处理项。

---

## 代码质量 / 可维护性

| # | 问题 | 影响 | 备注 |
|---|------|------|------|
| 1 | ~300 行 `empty_xxx()` 空列表 boilerplate | 可读性 | 需语言层改进：`[]` 类型推断或 `List::new<T>()` |
| 2 | `hexpr_type`/`expr_type`/`expr_effects` accessor 在 3 个文件重复 | 维护陷阱 | 应统一到 `hir.ring`，最高 ROI 重构 |
| 3 | `types_equal` 148 行重复模式 | 可读性 | 抽象为 `list_zip_all` helper |
| 4 | `JS_RESERVED()` 每次 `safe_ident()` 调用重建 Set | 性能 | 缓存到 CodegenCtx |
| 5 | `BUILTIN_*()` 每次调用分配新字符串 | 性能 | 需 `const` 语言特性 |
| 6 | `runtime.ring` 用数百个 `.push()` 拼接 JS 运行时代码 | 可维护性 | 改用 raw string 或外部 .js 文件 |
| 7 | `infer.ring` 2763 行单文件 | 可导航性 | 拆分为 infer_stmt/infer_expr/infer |
| 8 | `compiler_mod.ring` ESM 输出 310 行单函数 | 可维护性 | 提取 helper |
| 9 | 嵌套 if/else 链代替 match（derive.ring, codegen_derive.ring） | 可读性 | 改为 match |
| 10 | `token_kind_value` 字符串比较代替 Eq trait 派生 | 性能 | 为 TokenKind derive Eq |
| 11 | `MergeResult` 等 wrapper struct | 噪音 | 需 `.0`/`.1` tuple 字段访问 |
| 12 | `index_of_int`/`index_of_str` 重复实现 | 小重复 | |
| 13 | `try_eq_dispatch` 用空字符串作 sentinel | 脆弱约定 | 改用 `Option<Str>` |
| 14 | 68 处 `panic()` 调用（约 40 处 unreachable） | 崩溃而非友好报错 | 逐步替换为 DiagnosticSink |

## 架构债

| # | 问题 | 影响 | 备注 |
|---|------|------|------|
| 15 | TypeEnv 17+ public mutable 字段（god object） | **最大架构债** | 拆分为 StructEnv/TraitEnv/ScopeEnv |
| 16 | StructType/EnumType 携带冗余 fields/variants 数据 | 类型表示不一致 | 改为 nominal 表示 |
| 17 | Substitution 每次 unify 复制整个 Map（O(n²)） | 性能 | 改用 union-find |
| 18 | 模块 resolver 对每个文件 parse 两次 | 性能 | 缓存 AST |
| 19 | Ring 编译器缺少 `assertNever` 等效编译期保护 | 新 variant 易遗漏 | 确保所有 match 穷尽 |
| 20 | HExpr/HStmt match 在 5+ pass 中重复 | 维护负担 | 扩展 hir-visitor |

## Checker 关注项

| # | 问题 | 影响 | 备注 |
|---|------|------|------|
| 21 | Trait 方法查找无歧义检测 | 潜在错误解析 | 多 trait 同名方法取第一个 |
| 22 | `bind_pattern` named constructor 不验证字段完整性 | 低 | 穷尽性检查兜底 |
| 23 | `infer_if` 无 else 返回 UNIT 不与 then 分支统一 | 表达式位置意外 | 考虑 warning |
| 24 | `is_primitive_eq` 缺少 NeverType/AnyType | 边界情况 | |
| 25 | `?` 运算符 `fail<fresh_var>` 错误类型未约束 | 极低 | 实践中被 or/catch 兜住 |
| 26 | `CollectingSink.report()` 非 var self 但通过引用突变 | 语义不一致 | 深不可变性强制前不会 break |

## Codegen 关注项

| # | 问题 | 影响 | 备注 |
|---|------|------|------|
| 27 | IIFE match 表达式不转发 evidence | 低概率 | |
| 28 | HOF inline 代码在 List/Map/Set/Option 间重复 | ~100 行重复 | 抽象迭代模式 |
| 29 | Runtime 耦合 Node.js ESM（createRequire） | 可移植性 | |
| 30 | Codegen match labeled break 与用户 break 语义交互 | 低 | 需文档说明 |

## 模块/诊断

| # | 问题 | 影响 | 备注 |
|---|------|------|------|
| 31 | `extract_exports` 包含 builtin impls 导致重复注册 | 低 | |
| 32 | 循环依赖检测返回 none 无诊断详情 | 用户体验 | 报告具体循环路径 |
| 33 | `load_prelude` 找不到 std 目录时静默跳过 | 误导性错误 | 显式报错 |
| 34 | 错误码编号有缺口（E0202/E0400/E0401 等） | 文档 | |
| 35 | `resolver.ring:39` 未使用的 `relative` 变量 | 死代码 | |

## 设计-实现差距（未实现特性）

| # | 设计功能 | 状态 | 优先级 |
|---|----------|------|--------|
| 36 | Refinement types (where 子句) | 语法解析但语义忽略 | Phase 3 |
| 37 | `mut<S>` 参数化 effect | 未实现 | Phase 3 |
| 38 | Post-resume handler / Full algebraic effect | 未实现 | Phase 3 |
| 39 | `dyn Trait` 动态分发 | 未实现 | 未排期 |
| 40 | Supertrait 继承 | AST 字段存在但空 | 未排期 |
| 41 | 关联类型 | 未实现 | 未排期 |
