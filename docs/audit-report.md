# Audit Report

> 活的 bug 看板。修复后删除条目，只在 git commit message 留记录。
> 条目格式：`### #xxx <标题> [严重度] [状态]`
> 状态流转：`open` → `doing` → 删除
> 工作流规范见 `docs/workflow.md`

---

## Critical Bugs

| # | 问题 | 影响 | 发现者 | 备注 |
|---|------|------|--------|------|
| 69 | Tuple `==`/`!=` 使用 JS `===` 引用比较 | **运行时错误** | Opus | `(1,2) == (1,2)` 永远 false。`infer_bin_op`（infer.ring:882）把 tuple 标记为 `is_builtin`，codegen 发出 `===`。Tuple 编译为 JS Array，`===` 是引用比较。应移除 `is_tuple_type` 从 `is_builtin` 检查，对 tuple 生成逐元素比较 |
| 70 | Int 除法产生 Float | **类型不安全** | Opus | `7/2` 类型推断为 `Int` 但运行时结果为 `3.5`。codegen（codegen_expr.ring:188）发出 JS `/`（浮点除法）。应对 Int `/` 发出 `Math.trunc(a/b)` |
| 71 | Struct match 模式生成错误 `_tag` 检查 | **运行时错误** | DS | `gen_pattern_condition`（codegen_stmt.ring:380）对 `NamedConstructor` 统一生成 `_tag` 检查，但 struct 实例是 JS class（无 `_tag`），条件永远 false → `__match_fail`。`gen_catch_pattern_condition`（codegen_expr.ring:876-895）已有正确的 `instanceof` 区分，需将同样逻辑应用到 `gen_pattern_condition`。此外 `bind_named_constructor_pattern`（infer_ctx.ring:883）不处理 struct 类型，静默跳过不报错 |

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
| 45 | `StructType`/`EnumType` 在 `apply_subst` 中不替换 fields | 设计约束 | fields 是模板字段（含递归引用），递归替换会导致 `Node<T>` 等递归类型栈溢出。当前 `infer_field_access` 的 inst_map 兜底是正确设计。如需修复需改为 nominal 表示（关联 #16） |
| 42 | **Impl 方法 effect 不回传**：impl 方法在 Pass 1 注册为 `EMPTY_ROW`，Pass 2 推断出实际 effect 后不更新环境。导致 `fail.raise()` 在 impl 方法中无法通过 `catch` 正确捕获 | **中** | Workaround：parser 用 `__ring_raise_fail` extern fn 绕过 evidence passing；codegen `gen_try_catch` 已去除 `has_fail_effect` 前置检查。正式修复需在 impl 方法检查后回传 effect 到环境 |
| 74 | `check_capability` 只检查 `HDecl::Fn`，遗漏 Impl/Const | 中（Opus） | `mod requires {effects}` 的 capability 限制（infer_decl.ring:102-118）只 match `HDecl::Fn`，impl 方法和 const 初始化器中的 effect 使用不受检查 |
| 75 | `check_assign_target_mutable` 不检查临时值 | 中（DS） | `fn_returning_struct().field = value` 静默通过（infer.ring:550-573）。receiver 不是 Ident 时走 `_ => {}` 不报错，修改的临时对象即被丢弃。应报"不能对临时值进行 mutating 操作" |
| 77 | `infer_numeric_op` 无条件将 TypeVar 统一为 Int | 低（Opus） | `fn add<T>(a: T, b: T) -> T { a + b }` 静默约束 T=Int（infer.ring:937-949）。无 Num trait 前合理但可能令人困惑 |

## Codegen 关注项

| # | 问题 | 影响 | 备注 |
|---|------|------|------|
| 28 | HOF inline 代码在 List/Map/Set/Option 间重复 | ~100 行重复 | 抽象迭代模式 |
| 29 | Runtime 耦合 Node.js ESM（createRequire） | 可移植性 | |
| 30 | Codegen match labeled break 与用户 break 语义交互 | 低 | 需文档说明 |
| 72 | Auto-derive 对 TupleType 使用 `FieldAction::Identity` | 中（Opus） | 关联 #69。derive.ring:301 将 TupleType 映射为 Identity：Eq 用 `===`（引用比较）、Clone 浅拷贝（共享引用）、Ord 用 JS 字符串转换比较。struct 含 tuple 字段时 derive 全部错误 |
| 73 | `gen_call` dict_dispatch 非 FieldAccess 分支可能重复首参 | 低/潜在（Opus） | codegen_expr.ring:317-337 中 receiver 从 `args.get(0)` 取出后，又遍历全部 args push，导致 args[0] 出现两次。当前未触发（dict_dispatch callee 总是 FieldAccess），但是潜在 codegen bug |
| 76 | `is_tuple_field` 过于宽松 | 低（DS） | codegen_expr.ring:196-202 只检查首字符是否为数字，`"0abc"` 等非法名也被当作 tuple 索引处理。类型检查器通常提前拦截，但 ErrorType 传播时可能漏过 |

## 模块/诊断

| # | 问题 | 影响 | 备注 |
|---|------|------|------|
| 34 | 错误码编号有缺口（E0202/E0400/E0401 等） | 文档 | |

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
| 37 | `mut<S>` 参数化 effect | ~~已实现~~（Cell 已移除，MutEffect 基础设施为死代码） | 清理项 |
| 38 | Post-resume handler / Full algebraic effect | 未实现 | 未排期 |
| 39 | `dyn Trait` 动态分发 | 未实现 | 未排期 |
| 40 | Supertrait 继承 | AST 字段存在但空 | 未排期 |
| 41 | 关联类型 | 未实现 | 未排期 |
