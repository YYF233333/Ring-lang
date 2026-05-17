# 审查后剩余问题清单

来源：[review-phase2-s5-full-audit.md](review-phase2-s5-full-audit.md) + DS1-retry 补录
统计日期：2026-05-17

## 剩余 Critical (2)

| ID | 问题 | 状态 | 说明 |
|----|------|------|------|
| C9 | `try` block 嵌套可能产生 `__ev_fail` 变量名冲突 | 需验证 | 写测试 `try { try { expr? } }` 确认是否真的冲突 |
| C13 | `or` 在 Option+fail 交叉时只处理 Option | 设计决策 | 已文档化，不改代码 |

## 剩余 Important (14)

### 自举前必修 (影响编译器自身编译)

| ID | 问题 | 复杂度 | 说明 |
|----|------|--------|------|
| I1 | Codegen 内部变量名 `__m`/`__e`/`__ev_*` 与用户标识符冲突 | 低 | 声明 `__` 前缀预留或 safe_ident 处理 |
| I3 | Checker 首错即停——阻碍 LSP | 高 | 需要 Checker 级错误恢复，用 fresh type var 替代失败类型继续推断 |
| I4 | `type_error` 双重报告（sink + throw） | 低 | 去掉 throw 中的 diag 或改为只 throw 不 report |
| I15 | Trait dictionary 仅对 `ident` callee 生效 | 中 | 非 ident callee（高阶函数返回值）缺少 dictionary resolve |
| I17 | `infer_method_call` 中 effect dispatch 硬编码 `io`/`fail` | 低 | 统一通过 EffectDef 查找构造 Effect |
| I18 | `check_exhaustive` 对非 enum 类型报错只说 `missing _` | 低 | 错误信息加上实际类型名 |

### LSP 准备阶段

| ID | 问题 | 复杂度 | 说明 |
|----|------|--------|------|
| I5 | row_merge 单边 tail 不处理 | 低 | 已在 C10 中部分修复（tails_to_unify），需确认边界 |
| I6 | TypeEnv 不可从外部访问——阻碍 LSP hover/completion | 中 | check() 需返回 TypeEnv 或暴露接口 |
| I7 | unify.ts 全局可变状态 `_unify_next_id` | 低 | LSP 多次编译会 ID 递增，需重置机制 |
| I16 | `register_fn` 行变量过度泛化 | 低 | 用显式 `row_vars` set 替代 type_param_scope 差集 |

### 测试补全

| ID | 问题 | 复杂度 | 说明 |
|----|------|--------|------|
| I8 | unify.ts 零单元测试 | 中 | occurs check、row unification、effect row 边界需覆盖 |
| I9 | 负面 e2e 测试仅 3 个 | 中 | 至少补：参数数量不匹配、undefined 变量、操作符类型错误 |
| I10 | `?` 操作符解包 `none` 失败路径未测试 | 低 | 补 e2e：`none?` 在 `or` 内 |
| I11 | 嵌套字符串插值 `"${a + "${b}"}"` 未测试 | 低 | 验证 lexer brace depth 跟踪 |

## 剩余 Minor (16)

| ID | 问题 | 说明 |
|----|------|------|
| M1 | Parser 类型参数回溯逻辑重复 | 提取 `try_parse_type_args()` |
| M2 | `parse_let_stmt`/`parse_var_stmt` 几乎完全相同 | 合并为带参数方法 |
| M3 | `emit_stmt`/`gen_stmt_inline` 逻辑重复 | 一个调用另一个 |
| M5 | `GenericType` 无代码路径触发 | 评估是否死代码 |
| M6 | `__self_` 前缀未从 hir/index.ts 抽取 | 机械重构 |
| M7 | `format_hint` 遗漏 5 种 DiagnosticContext | 补充 hint 文本 |
| M8 | Lexer 转义字符/`..`/`?` token 单元测试缺失 | 补充 |
| M9 | `+=`/`-=`、match guard、else if、trait 默认方法无 e2e 测试 | 补充 |
| M10 | 负面测试 error_pattern 匹配过于宽松 | 改用错误码匹配 |
| M11 | `types_equal` 对 record field 顺序敏感 | 当前安全但脆弱 |
| M12 | Magic number `_unify_next_id = 100000` | 改为共享 ID 生成器 |
| M13 | `infer_block` 对每条 stmt 重复 `row_merge` O(n²) | 性能优化 |
| M14 | `bind_pattern` 对非预期 scrutinee 类型无反应 | C12 部分缓解 |
| M15 | register 系列重复的 type_param_scope save/restore | 提取 helper |
| M16 | `current_fn_bounds` save/restore 容易遗漏 | 改为栈式 |
| M17 | `OptionType` 与 `EnumType "Option"` 双轨制 | 统一表示 |
| M18 | occurs check 对 effect row tail 浅层检查 | 当前安全但脆弱 |

## 按优先级排序的行动建议

### 自举前必修（6 项 Important）
I1 → I4 → I17 → I18 → I15 → I3

### 自举前建议（4 项测试）
I8 → I9 → I10 → I11

### LSP 准备（4 项 Important）
I6 → I7 → I5 → I16

### 代码卫生（16 项 Minor）
按开发节奏穿插进行，不阻塞功能开发。
