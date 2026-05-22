# Audit Report

> 活的 bug 看板。修复后删除条目，只在 git commit message 留记录。
> 条目格式：`### #xxx <标题> [严重度] [状态]`
> 状态流转：`open` → `doing` → 删除
> 工作流规范见 `docs/workflow.md`

---

## 代码质量 / 可维护性

| # | 问题 | 影响 | 备注 |
|---|------|------|------|
| 6 | `runtime.ring` 用数百个 `.push()` 拼接 JS 运行时代码 | 可维护性 | 改用 raw string 或外部 .js 文件 |
| 7 | `infer.ring` 2763 行单文件 | 可导航性 | 拆分为 infer_stmt/infer_expr/infer |
| 8 | `compiler_mod.ring` ESM 输出 310 行单函数 | 可维护性 | 提取 helper |
| 14 | 68 处 `panic()` 调用（约 40 处 unreachable） | 崩溃而非友好报错 | 逐步替换为 DiagnosticSink |

## 架构债

| # | 问题 | 影响 | 备注 |
|---|------|------|------|
| 16 | StructType/EnumType 携带冗余 fields/variants 数据 | 类型表示不一致 | 改为 nominal 表示 |
| 19 | Ring 编译器缺少 `assertNever` 等效编译期保护 | 新 variant 易遗漏 | 确保所有 match 穷尽 |
| 20 | HExpr/HStmt match 在 5+ pass 中重复 | 维护负担 | 扩展 hir-visitor |

## Checker 关注项

| # | 问题 | 影响 | 备注 |
|---|------|------|------|
| 22 | `bind_pattern` named constructor 不验证字段完整性 | 低 | 穷尽性检查兜底 |
| 26 | `CollectingSink.report()` 非 var self 但通过引用突变 | 语义不一致 | 深不可变性强制前不会 break |
| 45 | `StructType`/`EnumType` 在 `apply_subst` 中不替换 fields | 设计约束 | fields 是模板字段（含递归引用），递归替换会导致 `Node<T>` 等递归类型栈溢出。当前 `infer_field_access` 的 inst_map 兜底是正确设计。如需修复需改为 nominal 表示（关联 #16） |
| 42 | **Impl 方法 effect 不回传**：impl 方法在 Pass 1 注册为 `EMPTY_ROW`，Pass 2 推断出实际 effect 后不更新环境。导致 `fail.raise()` 在 impl 方法中无法通过 `catch` 正确捕获 | **中** | Workaround：parser 用 `__ring_raise_fail` extern fn 绕过 evidence passing；codegen `gen_try_catch` 已去除 `has_fail_effect` 前置检查。正式修复需在 impl 方法检查后回传 effect 到环境 |
| 71 | **未 handle 的自定义 effect 无编译错误**：E0403 已定义但 checker 中无触发点。未 handle 的自定义 effect 到达 codegen 后缺少 evidence 参数，产生运行时错误 | **Bug** | checker 需在 `main` 或模块边界检查残余的 CustomEffect 是否已 handle |
| 72 | **`impl<T: Eq>` bounded impl 方法跨类型调用冲突**：`check_impl_decl` 为 impl 类型参数创建的 fresh type var 在方法体检查后泄漏。同一作用域对不同具体类型（如 `List<Int>.has_item()` 和 `List<Str>.has_item()`）调用 bounded impl 方法时，第二次调用因 type var 已被统一为第一次的具体类型而报 "cannot unify Str with Int"。同一类型多次调用正常 | **Bug** | `check_impl_decl` 中 impl type param 的 fresh var 应在每次方法调用时独立实例化，而非在整个 impl 检查期间共享。可能需要将 type var 创建移到方法查找/实例化阶段 |

## Codegen 关注项

| # | 问题 | 影响 | 备注 |
|---|------|------|------|
| 28 | HOF inline 代码在 List/Map/Set/Option 间重复 | ~100 行重复 | 抽象迭代模式 |
| 29 | Runtime 耦合 Node.js ESM（createRequire） | 可移植性 | |
| 30 | Codegen match labeled break 与用户 break 语义交互 | 低 | 需文档说明 |

## 模块/诊断

| # | 问题 | 影响 | 备注 |
|---|------|------|------|
| 34 | 错误码编号有缺口（E0202/E0400/E0401 等） | 文档 | |
| 59 | 嵌套 mod 块产生错误限定名 | Concern | `mod a { mod b { fn f } }` → 注册为 `b::f` 而非 `a::b::f`。`prefix_decl_name` 不处理 ModBlock，内层 mod 丢失外层前缀 |

## Effect 标注（F1）关注项

| # | 问题 | 影响 | 备注 |
|---|------|------|------|
| 64 | `effects_match_kind` 只做 kind 级匹配，忽略 fail 错误类型 | Issue（设计决策） | `with {fail<Str>}` 匹配 `fail<Int>` 不报错。标注中的错误类型是装饰性的。若标注作为公共契约，应验证类型参数 |
| 66 | `register_impl_method` 接收 `declared_effects` 参数但完全不使用 | Issue（已知限制扩展） | impl 方法 effect 注册为 `EMPTY_ROW`，显式 `with {io}` 标注被忽略。关联 #42 |
| 67 | `std/io.ring` 的 `print`/`assert`/`exit` 缺少 `with {io}` 标注 | Issue | 纯函数 `with {}` 内调用 `print()` 不报 E0404——extern fn 无标注时注册为 EMPTY_ROW |
| 68 | `resolve_effect_expr` 不验证 effect 名是否存在 | Concern | `with {typo}` 静默创建 CustomEffect，不报错。因为标注是上界，不使用的 effect 合法，但拼写错误无法捕获 |

## 设计-实现差距（未实现特性）

| # | 设计功能 | 状态 | 优先级 |
|---|----------|------|--------|
| 36 | Refinement types (where 子句) | 语法解析但语义忽略 | Phase C |
| 37 | `mut<S>` 参数化 effect | 未实现 | Phase B |
| 38 | Post-resume handler / Full algebraic effect | 未实现 | 未排期 |
| 39 | `dyn Trait` 动态分发 | 未实现 | 未排期 |
| 40 | Supertrait 继承 | AST 字段存在但空 | 未排期 |
| 41 | 关联类型 | 未实现 | 未排期 |
