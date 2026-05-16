# Phase 1 审查报告 — 剩余问题

**原始审查日期**: 2026-05-16
**修复批次**: 2026-05-16（C1-C11, I10, I13, I14 已修复）
**审查方法**: Claude Opus × 5 并行代理 + DeepSeek V4 Pro × 3 并行代理，独立审查后交叉验证

---

## 一、Phase 2+ TODO（非 Phase 1 问题）

| 问题 | 归属 | 说明 |
|------|------|------|
| 无 Trait AST/推断/dispatch | Phase 2 | 路线图明确 |
| Row polymorphism 缺失 | Phase 2 | 路线图明确 |
| Evidence passing codegen | Phase 2 | 路线图明确 |
| Refinement types 验证 | Phase 3 | 路线图明确 |
| 模块系统 (import/mod) | Phase 2 | 路线图明确 |
| LSP server | Phase 2 | 路线图明确 |
| `--error-format=llm` 接入 | Phase 2 | 路线图明确 |
| Parser 错误恢复 (multi-error) | Phase 2 | IDE 耦合需要 |
| Source map 支持 | Phase 2 | 调试体验改进 |
| 增量编译/缓存 | Phase 2 | 路线图明确 |
| `type` 别名声明 | Phase 2+ | Phase 1 不需要 |
| `loop` 关键字 | Phase 2 | `for` 已改为报 not-implemented |
| 数组/列表字面量 `[...]` | Phase 2 | Phase 1 无标准库 List |
| 下标访问 `expr[index]` | Phase 2 | 同上 |
| 范围表达式 `0..100` | Phase 2 | 同上 |
| Unicode 标识符 | Phase 2+ | 不影响 Phase 1 |
| Hex/octal/binary 数字 | Phase 2+ | 不影响 Phase 1 |
| `where` 子句语义 | Phase 3 | Parser 跳过 token 的存根可接受 |
| Effect polymorphism (open row) | Phase 2 | `open_effect_row()` 是预留代码 |
| `map_fail` 支持 | Phase 2 | 需要标准库 |
| Enum named fields | Phase 2 | 位置字段在 Phase 1 足够 |
| 运行时提取为独立模块 | Phase 2 | 单文件嵌入 Phase 1 可接受 |
| Test 声明生产构建排除 | Phase 2 | Phase 1 无 build mode 区分 |
| `?` 后缀运算符 | Phase 1.5 | fail 4 层甜度范围 |
| `try` 块 | Phase 1.5 | 同上 |

---

## 二、剩余 Important 问题

### I1. FnType unify 跳过 effects

- **文件**: `compiler/src/checker/unify.ts:197-207`
- **问题**: 函数类型统一只统一参数和返回类型，不统一 effect row。`fn() -> Int / io` 和 `fn() -> Int` 可以被统一。
- **修复方向**: 在 FnType 分支中增加 `unify_effects(a.effects, b.effects, s)`。

### I2. `types_equal` 忽略 FnType effects

- **文件**: `compiler/src/types/index.ts:221-226`
- **问题**: `FnType` 的相等性检查只比较 `params` 和 `return_type`，忽略 `effects`。

### I3. `effects_equal` 忽略 CustomEffect type_args

- **文件**: `compiler/src/types/index.ts:201`
- **问题**: 只比较名称不比较类型参数。`custom_effect<Int>` 和 `custom_effect<Str>` 被视为相同。

### I4. `remove_fail_effect` 不区分错误类型

- **文件**: `compiler/src/checker/infer.ts:1188-1193`
- **问题**: 如果函数同时有 `fail<ParseError>` 和 `fail<IoError>`，一个 `or` 表达式会同时移除两者。

### I5. Match guard fallthrough → match_fail

- **文件**: `compiler/src/codegen/codegen.ts:289`
- **问题**: constructor match 的 guard 失败时用 `break` 跳出整个 switch，直接到 `__match_fail`，而非 fall through 到同一 `_tag` 的下一个 arm。

### I6. yield 在非 generator 上下文中

- **文件**: `compiler/src/codegen/codegen.ts:454-457`
- **问题**: `gen_effect_op` 统一生成 `yield`。如果 effect op 出现在非 `handle` 上下文中，生成的代码在普通函数中使用 `yield`，JS 语法错误。
- **修复方向**: fail.raise 特化为 throw；其他 effect op 需要 propagate 标记来决定 yield vs 调用。

### I7. 穷尽性不验证 variant 属于目标 enum

- **文件**: `compiler/src/checker/exhaustive.ts:29-33`
- **问题**: `covered.add(pat.name)` 无条件添加，不验证 variant 是否属于 scrutinee 类型。

### I8. 穷尽性不检查嵌套 pattern

- **文件**: `compiler/src/checker/exhaustive.ts:25-41`
- **问题**: 只看顶层 variant 名称，不检查嵌套 pattern。

### I9. 穷尽性视 guard pattern 为完整覆盖

- **文件**: `compiler/src/checker/exhaustive.ts`
- **问题**: 带 guard 的 pattern 不能保证完整覆盖，但被当作完整覆盖。

### I11. Struct 字面量字段顺序假设

- **文件**: `compiler/src/codegen/codegen.ts:236-239`
- **问题**: `new Type(arg1, arg2)` 假设字段顺序与声明一致。`Point { y: 2, x: 1 }` 可能将 y 赋给 x。

### I12. Effect op param name 索引错误

- **文件**: `compiler/src/checker/infer.ts:260-264`
- **问题**: `decl.ops[i]?.params[0]?.name` — 外层 `map` 的 `i` 是参数索引，`decl.ops[i]` 取的是第 i 个 operation。

### I15. 比较运算符结合性

- **文件**: `compiler/src/parser/parser.ts:511-538`
- **问题**: `a == b == c` 被解析为 `(a == b) == c`。比较运算符应为非结合。

### I16. 插值内字符串被误当插值结束

- **文件**: `compiler/src/parser/lexer.ts:213-216`
- **问题**: 插值表达式内部的字符串字面量 `"${prefix + "suffix"}"` 中的 `"` 被当作插值结束符处理。

### I17. UFCS method call codegen 错误

- **文件**: `compiler/src/codegen/codegen.ts:230-234`
- **问题**: method call 在 HIR 中生成 `obj.field(args)`，但 impl 方法被编译为独立函数 `TypeName_methodName`，调用应是 `TypeName_methodName(obj, args)`。

### I18. `field_access` 非 struct 静默返回 ANY

- **文件**: `compiler/src/checker/infer.ts:784-796`
- **问题**: 对枚举类型或未解析类型变量的 field access 不报错，静默退化到 ANY。

### I19. fail effect 从未被添加到 effect row

- **文件**: `compiler/src/checker/infer.ts`（全局）
- **问题**: 没有代码向函数的 effect row 添加 `fail` effect。`or`/`catch` 移除一个从未被添加的 effect。

### I20. handle 不验证 handler 类型

- **文件**: `compiler/src/checker/infer.ts:1077-1143`
- **问题**: Handler 参数绑定为 ANY，resume 回调为 `fn(Any) -> Any`，handler body 与 handle body 类型不统一。

### I21. Diagnostic 系统完全未使用

- **文件**: `compiler/src/errors.ts`（整个文件）
- **问题**: `CompileError`/`Diagnostic` 系统已定义，但未被使用。迁移作为 Phase 2 前置工作。

### I22. JS 保留字冲突未处理

- **文件**: `compiler/src/codegen/codegen.ts`（全局）
- **问题**: Ring-lang 标识符直接输出为 JS 标识符。`class`、`default`、`switch` 等会导致语法错误。

### I23. 字符串插值反斜杠未转义

- **文件**: `compiler/src/codegen/codegen.ts:401-409`
- **问题**: 字符串插值中只转义了反引号和 `${`，未转义反斜杠 `\`。

---

## 三、建议修复顺序（剩余项）

### 第一批：类型系统完善

1. **I1/I2/I3** — types_equal/unify 补全 effects 比较
2. **I4** — remove_fail_effect 按错误类型区分
3. **I7/I8/I9** — 穷尽性检查完善
4. **I12** — effect op param name 索引
5. **I18/I19/I20** — field access、fail 追踪、handle 验证

### 第二批：Codegen 正确性

6. **I5** — match guard fallthrough
7. **I6** — fail.raise 特化为 throw
8. **I17** — UFCS method call codegen
9. **I11** — struct 字面量字段排序
10. **I22** — JS 保留字检查
11. **I23** — 字符串插值反斜杠转义

### 第三批：Parser 健壮性

12. **I15** — 比较运算符非结合
13. **I16** — 插值内字符串处理

### 第四批：基础设施

14. **I21** — 迁移到 Diagnostic 系统（Phase 2 前置）

---

## 四、已修复问题记录

以下问题已在 2026-05-16 修复并通过 89 个测试验证：

| ID | 问题 | 修复摘要 |
|----|------|----------|
| C1 | let-generalization 缺失 | 实现 `generalize()` + let 使用 polymorphic TypeScheme |
| C2 | 泛型参数被忽略 | 添加 `type_param_scope`，register_fn/check_fn_decl 映射 type params |
| C3 | 全局 mutable subst 泄漏 | check_fn_decl/check_test_decl 保存/恢复 this.subst |
| C4 | `__run_handler` resume double-advance | 添加 `resumed` 标志防止重复推进 |
| C5 | fail handler 死代码 + 多 handler 忽略 | 删除 handler_parts 死代码 |
| C6 | `panic`/`exit` 无运行时实现 | 添加 panic() 和 exit() 到 RUNTIME_CODE |
| C7 | `fail.raise()` 不可调用 | 注册 fail 为命名 effect |
| C8 | `return` 语句类型不检查 | 添加 current_fn_return_type + unify |
| C9 | `for` 表达式静默丢弃绑定 | 改为抛 not-implemented 错误 |
| C10 | 未知类型名 → ANY | 改为抛 TypeCheckError |
| C11 | 泛型 enum type_params 为空 | register_enum 正确传递 type_vars |
| I10 | `infer_block` subst 初始化不一致 | 接受 initial_subst 参数 |
| I13 | 单 `&`/`|` 返回 Eof token | 改为抛词法错误 |
| I14 | 未终止字符串静默返回 | 改为抛错误 |
| — | `Any` 类型用户可用 | 从 resolve_named_type 移除；print 改为泛型；toml stub 移除 ANY |
