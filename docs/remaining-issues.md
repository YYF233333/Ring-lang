# Phase 2 剩余问题工作清单

**更新日期**: 2026-05-19
**状态**: 所有 10 Critical + 17 Important 已修复。209 单元测试 + 161 E2E 测试全部通过。

---

## 未修复 Important（2 项，均为设计决策非 bug）

| # | 问题 | 说明 |
|---|------|------|
| I6 | `update_fn_effects` 写回 zonked effects 但其他字段仍为旧变量 ID | **误报**：scheme params/return_type 是量化变量，代表函数接口，不需要 subst 更新 |
| I7 | `infer_or` Option/fail dispatch 依赖类型解析时序 | **设计决策**：`or` 按已解析类型 dispatch，未解析 var 走 fail path，与 CLAUDE.md 文档一致 |

## Minor（影响不大或低频触发）

| # | 问题 | 位置 |
|---|------|------|
| M1 | `types_equal` fn effect row 比较依赖顺序 | `types/index.ts` |
| M3 | `row_merge` 尾变量选取不对称 | `types/index.ts` |
| M4 | 穷尽性错误消息显示小写 variant 名 | `exhaustive.ts` |
| M5 | `zonk_expr` block case 与 `zonk_block` 逻辑重复 | `zonk.ts` |
| M6 | `option_inner` 无防御性检查 | `types/index.ts` |
| M7 | `Option<A, B>` 错误消息显示 "Unknown type" 而非参数数量错误 | `infer.ts` |
| M8 | `types_equal` record 比较 O(n²) | `types/index.ts` |
| M9 | HIR 直接使用 AST 的 Pattern 和 TypeParam | `hir/index.ts` |
| M10 | `infer_call` effect_tail 创建后从未被约束 | `infer.ts` |
| M11 | Struct literal 大写首字母启发式不完美 | `parser.ts` |
| M12 | `::` 未实现为 token（两个 Colon） | `lexer.ts` |
| N5 | Lexer 转义序列不完整（无 `\x`/`\u`/`\0`） | `lexer.ts` |
| N6 | 数字字面量不支持 hex/octal/binary | `lexer.ts` |
| N25 | 未知异常使用未注册的 E0000 错误码 | `cli.ts` |

## Surprise（设计决策讨论）

| # | 问题 | 说明 |
|---|------|------|
| S1 | `or` 行为取决于类型而非语法 | Option unwrap vs fail catch 按类型 dispatch |
| S2 | `if` 无 `else` 产生 `undefined` | 应限制无 else 的 if 只在 statement 位置使用 |
| S3 | 测试名误导 | `effect_or.ring`/`effect_catch.ring` 不测试错误处理路径 |
| S4 | 无整数溢出保护 | Int 是 JS number，>2^53 静默丢失精度 |
| S5 | `print` 类型签名 vs 运行时不同步 | 运行时 variadic，类型系统 `(T) -> Unit` |
| S6 | Enum unit variant 需要空括号 | `red()` 而非 `Red` |
| S7 | StructType.fields 含注册时类型变量 | 未实例化，读取可能看到错误类型 |

## 架构建议

| # | 建议 | 说明 |
|---|------|------|
| A1 | 拆分 `infer.ts`（~1900 行） | 按功能拆为 infer-expr/infer-decl/infer-effect |
| A2 | HIR Pattern 解糖 | 消除 HIR 对 AST Pattern 的直接依赖 |
| A3 | `where` 子句 | 要么实现要么报错，当前静默丢弃 |
| A4 | `suggestions.ts` 规则 | 框架已就绪，需要填充实际规则 |
