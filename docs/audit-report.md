# 编译器审计报告 (2026-05-21)

自举完成后、TS 编译器归档前的全面审计。三路并行：Claude×2 + DS V4 Pro。

## 审计范围
- TypeScript 编译器 (`compiler/src/`, ~18K 行)
- Ring 自举编译器 (`compiler/ring/`, 31 文件 ~16K 行)
- 对照基线：`docs/design.md`

---

## P0：自举安全 ✅ 已修复

| # | 问题 | 状态 |
|---|------|------|
| 0.1 | Ring 编译器 dist/ 未入 git，TS 退役后丧失自举能力 | ✅ 9d5f96b |

## P1：TS 退役前修复的 Bug

| # | 问题 | 状态 |
|---|------|------|
| 1.1 | `effects_same_kind` 把所有 `fail<T>` 当同种 effect，`row_merge` 丢弃不同错误类型的 fail | ✅ 已修复（TS + Ring + dist） |
| 1.2 | `emit_toplevel_evidence` 用 `require("fs")` 而非 `__require("fs")` | ✅ 已修复（TS + Ring + dist） |
| 1.3 | `types_equal` 对 effect row 是顺序敏感的（应为集合比较） | ✅ 已修复（TS + Ring + dist） |
| 1.4 | Map/Set HOF 回调缺少 evidence capture（仅 List 有） | ❌ 误报：代码已正确使用 `gen_lambda_capture_evidence` |
| 1.5 | `?` 运算符添加 `fail<fresh_var>` 而非具体错误类型 | → P2：影响极低，实践中被 or/catch 兜住 |

## P2：退役后在 Ring 编译器上修的技术债

### 代码质量 / 可维护性

| # | 问题 | 来源 | 影响 |
|---|------|------|------|
| 2.1 | ~300 行 `empty_xxx()` 空列表 boilerplate（语言限制） | Claude-Ring + DS | 可读性，需语言层改进 |
| 2.2 | `hexpr_type`/`expr_type`/`expr_effects` 等 accessor 在 3 个文件重复 | Claude-Ring | 维护陷阱，新 variant 需改 3 处 |
| 2.3 | `types_equal` 148 行重复模式（应抽象为 list_zip_all） | Claude-Ring | 可读性 |
| 2.4 | `JS_RESERVED()` 每次 `safe_ident()` 调用都重建 Set | Claude-Ring | 性能 |
| 2.5 | `BUILTIN_*()` 每次调用分配新字符串 | Claude-Ring | 性能 |
| 2.6 | `runtime.ring` 用数百个 `.push()` 拼接 JS 运行时代码 | Claude-Ring | 可维护性 |
| 2.7 | `infer.ring` 2763 行单文件（应拆分 stmt/expr） | Claude-Ring + DS | 可导航性 |
| 2.8 | `compiler_mod.ring` ESM 输出 310 行单函数 | Claude-Ring | 可维护性 |
| 2.9 | 嵌套 if/else 链代替 match（derive.ring, codegen_derive.ring） | Claude-Ring | 可读性 |
| 2.10 | `token_kind_value` 字符串比较代替 Eq trait 派生 | Claude-Ring | 性能 |
| 2.11 | `MergeResult` 等 wrapper struct（缺少 tuple 字段访问的 workaround） | Claude-Ring + DS | 噪音 |
| 2.12 | `index_of_int`/`index_of_str` 重复实现 | Claude-Ring | 小重复 |
| 2.13 | `try_eq_dispatch` 用空字符串作 sentinel（应为 Option） | DS | 脆弱约定 |
| 2.14 | 68 处 `panic()` 调用（约 40 处 unreachable） | DS | 崩溃而非友好报错 |

### 架构债

| # | 问题 | 来源 | 影响 |
|---|------|------|------|
| 2.15 | TypeEnv 17+ public mutable 字段（god object） | 三方一致 | 最大架构债 |
| 2.16 | StructType/EnumType 携带冗余 fields/variants 数据 | Claude-TS + DS | 类型表示不一致 |
| 2.17 | Substitution 每次 unify 复制整个 Map（O(n²)） | Claude-TS | 性能 |
| 2.18 | 模块 resolver 对每个文件 parse 两次 | Claude-TS | 性能 |
| 2.19 | Ring 编译器缺少 TS 版 `assertNever` 等效编译期保护 | DS | 新 variant 易遗漏 |
| 2.20 | HExpr/HStmt match 在 5+ pass 中重复 | DS | 维护负担 |

### Checker 关注项

| # | 问题 | 来源 | 影响 |
|---|------|------|------|
| 2.21 | Trait 方法查找无歧义检测（多 trait 同名方法取第一个） | Claude-TS | 潜在错误解析 |
| 2.22 | `bind_pattern` named constructor 不验证字段完整性 | Claude-TS | 穷尽性检查兜底 |
| 2.23 | `infer_if` 无 else 分支返回 UNIT 不与 then 分支统一 | Claude-TS | 表达式位置可能意外 |
| 2.24 | `is_primitive_eq` 缺少 NeverType/AnyType | DS | 边界情况 |
| 2.25 | `never` 在 unify 中位于 `any` 检查之后 | DS | 极低概率 |
| 2.26 | `CollectingSink.report()` 非 var self 但通过引用突变 | Claude-Ring | 语义不一致 |

### Codegen 关注项

| # | 问题 | 来源 | 影响 |
|---|------|------|------|
| 2.27 | IIFE match 表达式不转发 evidence | Claude-TS | 低概率 |
| 2.28 | HOF inline 代码在 List/Map/Set/Option 间重复 | Claude-TS | ~100 行重复 |
| 2.29 | Runtime 耦合 Node.js ESM（createRequire） | Claude-TS | 可移植性 |
| 2.30 | Codegen match labeled break 与用户 break 语义交互 | DS | 需文档 |

### 模块/诊断

| # | 问题 | 来源 | 影响 |
|---|------|------|------|
| 2.31 | `extract_exports` 包含 builtin impls 导致重复注册 | Claude-TS | 低影响 |
| 2.32 | 循环依赖检测返回 none 无诊断详情 | Claude-Ring + DS | 用户体验 |
| 2.33 | `load_prelude` 找不到 std 目录时静默跳过 | Claude-Ring | 误导性错误 |
| 2.34 | 错误码编号有缺口（E0202/E0400/E0401 等） | Claude-TS + DS | 文档 |
| 2.35 | `resolver.ring:39` 有未使用的 `relative` 变量（死代码） | Claude-Ring | 清理 |

### 设计-实现差距

| # | 设计功能 | 状态 | 优先级 |
|---|----------|------|--------|
| 2.36 | Refinement types (where 子句) | 语法解析但语义忽略 | Phase 3 |
| 2.37 | `mut<S>` 参数化 effect | 未实现 | Phase 3 |
| 2.38 | Post-resume handler / Full algebraic effect | 未实现 | Phase 3 |
| 2.39 | `dyn Trait` 动态分发 | 未实现 | 未排期 |
| 2.40 | Supertrait 继承 | AST 字段存在但空 | 未排期 |
| 2.41 | 关联类型 | 未实现 | 未排期 |

## 审计统计

- **总发现数**: 去重后 42 项（P0: 1 已修, P1: 5 bug, P2: 36 debt/concern/suggestion）
- **审计来源**: Claude Ring Agent (21), Claude TS Agent (26), DS V4 Pro (51), 去重合并后 42
- **编译器健康度**: TS 编译器 A-（干净、穷尽检查完整）, Ring 编译器 B+（功能完整、可维护性待提升）
