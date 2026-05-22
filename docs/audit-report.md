# Audit Report

> 活的 bug 看板。修复后删除条目，只在 git commit message 留记录。
> 条目格式：`### #xxx <标题> [严重度] [状态]`
> 状态流转：`open` → `doing` → 删除
> 工作流规范见 `docs/workflow.md`

---

## Checker

### #42 Impl 方法 effect 不回传 [medium] [open]

Impl 方法在 Pass 1 注册为 `EMPTY_ROW`，Pass 2 推断出实际 effect 后不更新环境。导致 `fail.raise()` 在 impl 方法中无法通过 `catch` 正确捕获。

Workaround：parser 用 `__ring_raise_fail` extern fn 绕过 evidence passing；codegen `gen_try_catch` 已去除 `has_fail_effect` 前置检查。正式修复需在 impl 方法检查后回传 effect 到环境。

### #74 `check_capability` 只检查 `HDecl::Fn`，遗漏 Impl/Const [medium] [open]

`mod requires {effects}` 的 capability 限制（infer_decl.ring:102-118）只 match `HDecl::Fn`，impl 方法和 const 初始化器中的 effect 使用不受检查。

发现者：Opus

### #75 `check_assign_target_mutable` 不检查临时值 [medium] [open]

`fn_returning_struct().field = value` 静默通过（infer.ring:550-573）。receiver 不是 Ident 时走 `_ => {}` 不报错，修改的临时对象即被丢弃。应报"不能对临时值进行 mutating 操作"。

发现者：DS

### #77 `infer_numeric_op` 无条件将 TypeVar 统一为 Int [low] [open]

`fn add<T>(a: T, b: T) -> T { a + b }` 静默约束 T=Int（infer.ring:937-949）。无 Num trait 前合理但可能令人困惑。

发现者：Opus

### #81 `uf_union` 双方有类型绑定时静默丢弃一方 [medium] [open]

`uf_union`（union_find.ring:60-76）按 rank 合并两个等价类时，如果子节点和父节点都已有类型绑定，子节点的绑定被 `some(_) => {}` 静默丢弃。当前 `uf_union` 未被 Ring 编译器源码调用（仅定义未 import），所以此 bug 未触发。但作为 pub 函数，将来使用时会导致类型信息丢失。应在双方都有绑定时检查一致性或 panic。

发现者：DS

### #82 空 pattern 列表构造脆弱 [medium] [open]

`infer_match`（infer.ring:2113-2116）用 `[0].clear().map(fn(i: Int) -> Pattern { panic("unreachable") })` 构造空 `List<Pattern>`。依赖 `List.map` 对空列表返回空列表的行为，且 `[0].clear()` 是 Ring 语言的 workaround（`clear()` 返回 `Unit` 不可链式）。应引入更清晰的空列表构造方式。

发现者：DS

### #84 `uf_lookup` 通过非 mut 参数触发 path compression 副作用 [medium] [open]

`uf_lookup`（union_find.ring:45）签名为 `fn uf_lookup(uf: UnionFind, id: Int) -> Type?`（非 mut），但内部调用 `uf_find(mut uf: UnionFind, id: Int)` 进行 path compression（修改 `parent` map）。由于 Ring 的 `Map` 是引用类型，mutation 通过非 mut 绑定静默生效。这违反了 Ring 的可变性保证——调用方认为 `uf_lookup` 是只读操作，实际上它修改了内部状态。

发现者：Opus

### #86 `infer_if` else 分支 wildcard 静默默认 Unit [low] [open]

`infer_if`（infer.ring:2221）else 分支 match 有三个 arm：`Block`、`IfExpr`、wildcard。Wildcard 将 result_type 设为 `UNIT` 不报错。实践中 parser 总是将 else 包装进 Block（不触发），但如果 parser 有 bug 产生裸表达式，类型推断会静默丢弃类型信息。应将 wildcard 改为 panic 标记不可达。

发现者：DS

### #22 `bind_pattern` named constructor 不验证字段完整性 [low] [open]

穷尽性检查兜底，影响低。

### #45 `StructType`/`EnumType` 在 `apply_subst` 中不替换 fields [low] [open]

设计约束：fields 是模板字段（含递归引用），递归替换会导致 `Node<T>` 等递归类型栈溢出。当前 `infer_field_access` 的 inst_map 兜底是正确设计。如需修复需改为 nominal 表示（关联 #16）。

## Codegen

### #73 `gen_call` dict_dispatch 非 FieldAccess 分支可能重复首参 [low] [open]

codegen_expr.ring:317-337 中 receiver 从 `args.get(0)` 取出后，又遍历全部 args push，导致 args[0] 出现两次。当前未触发（dict_dispatch callee 总是 FieldAccess），但是潜在 codegen bug。

发现者：Opus

### #76 `is_tuple_field` 过于宽松 [low] [open]

codegen_expr.ring:196-202 只检查首字符是否为数字，`"0abc"` 等非法名也被当作 tuple 索引处理。类型检查器通常提前拦截，但 ErrorType 传播时可能漏过。

发现者：DS

### #28 HOF inline 代码在 List/Map/Set/Option 间重复 [low] [open]

~100 行重复。应抽象迭代模式。

### #29 Runtime 耦合 Node.js ESM（createRequire）[low] [open]

可移植性问题。

### #30 Codegen match labeled break 与用户 break 语义交互 [low] [open]

需文档说明。

## Effect 标注

### #64 `effects_match_kind` 只做 kind 级匹配，忽略 fail 错误类型 [medium] [open]

`with {fail<Str>}` 匹配 `fail<Int>` 不报错。标注中的错误类型是装饰性的。若标注作为公共契约，应验证类型参数。

发现者：设计决策项

### #66 `register_impl_method` 接收 `declared_effects` 参数但完全不使用 [medium] [open]

impl 方法 effect 注册为 `EMPTY_ROW`，显式 `with {io}` 标注被忽略。关联 #42。

### #67 `std/io.ring` 的 `print`/`assert`/`exit` 缺少 `with {io}` 标注 [medium] [open]

纯函数 `with {}` 内调用 `print()` 不报 E0404——extern fn 无标注时注册为 EMPTY_ROW。

### #68 `resolve_effect_expr` 不验证 effect 名是否存在 [low] [open]

`with {typo}` 静默创建 CustomEffect，不报错。因为标注是上界，不使用的 effect 合法，但拼写错误无法捕获。

## 代码质量 / 可维护性

### #6 `runtime.ring` 用数百个 `.push()` 拼接 JS 运行时代码 [low] [open]

应改用 raw string 或外部 .js 文件。

### #7 `infer.ring` 2763 行单文件 [low] [open]

应拆分为 infer_stmt/infer_expr/infer。

### #8 `compiler_mod.ring` ESM 输出 310 行单函数 [low] [open]

应提取 helper。

### #14 68 处 `panic()` 调用（约 40 处 unreachable）[low] [open]

崩溃而非友好报错。应逐步替换为 DiagnosticSink。

## 架构债

### #16 StructType/EnumType 携带冗余 fields/variants 数据 [low] [open]

类型表示不一致。应改为 nominal 表示。

### #19 Ring 编译器缺少 `assertNever` 等效编译期保护 [low] [open]

新 variant 易遗漏。应确保所有 match 穷尽。

### #20 HExpr/HStmt match 在 5+ pass 中重复 [low] [open]

维护负担。应扩展 hir-visitor。

## 模块/诊断

### #34 错误码编号有缺口（E0202/E0400/E0401 等）[low] [open]

文档问题。

## 设计-实现差距（参考，已在 backlog 跟踪）

> 以下为未实现特性的跟踪参考，不作为 Worker 任务源。实际实现由 backlog 对应条目驱动。

| # | 设计功能 | Backlog 对应 | 状态 |
|---|----------|--------------|------|
| 36 | Refinement types (where 子句) | B-001 | 语法解析但语义忽略 |
| 37 | `mut<S>` 参数化 effect | B-037 | Cell 已移除，MutEffect 基础设施为死代码 |
| 38 | Post-resume handler / Full AE | 已取消 (B-009) | 不实现 |
| 39 | `dyn Trait` 动态分发 | B-006 | 未实现 |
| 40 | Supertrait 继承 | B-005 | AST 字段存在但空 |
| 41 | 关联类型 | B-004 | 未实现 |
