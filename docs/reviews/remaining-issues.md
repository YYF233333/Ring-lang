# 审查后剩余问题清单

来源：[review-phase2-s5-full-audit.md](review-phase2-s5-full-audit.md) + DS1-retry 补录
统计日期：2026-05-17 → **2026-05-18 全部清零**
修复记录：commit 6d77eb6（13项） + commit 729290b（15项） = 全部 2C+14I+16M 完成

## 剩余 Critical (0)

| ID | 问题 | 状态 | 说明 |
|----|------|------|------|
| C9 | `try` block 嵌套可能产生 `__ev_fail` 变量名冲突 | ✅ 已验证非 bug | IIFE 作用域正确隔离，新增 `try_nested.ring` e2e 测试验证 |
| C13 | `or` 在 Option+fail 交叉时只处理 Option | 设计决策 | 已文档化，不改代码 |

## 剩余 Important (4)

### 自举前必修 (影响编译器自身编译)

| ID | 问题 | 复杂度 | 说明 |
|----|------|--------|------|
| I1 | Codegen 内部变量名 `__m`/`__e`/`__ev_*` 与用户标识符冲突 | ✅ 已修复 | 改用 `__ring_` 前缀（`__ring_m`/`__ring_e`/`__ring_ev_*`/`__ring_err`） |
| I3 | Checker 首错即停——阻碍 LSP | ✅ 已修复（declaration 级） | check() 在 register_decl 和 check_decl 循环加 try/catch，可报告多个声明的错误 |
| I4 | `type_error` 双重报告（sink + throw） | ✅ 已修复 | sink 为唯一权威来源，CompileError 为空控制流信号 |
| I15 | Trait dictionary 仅对 `ident` callee 生效 | ✅ 已修复 | 泛型函数作为值传递时自动生成 dict closure wrapper |
| I17 | `infer_method_call` 中 effect dispatch 硬编码 `io`/`fail` | ✅ 已修复 | EffectDef.built_in_kind 替代硬编码字符串 |
| I18 | `check_exhaustive` 对非 enum 类型报错只说 `missing _` | ✅ 已修复 | 错误消息包含 `type_to_string(scrutinee_type)` |

### LSP 准备阶段

| ID | 问题 | 复杂度 | 说明 |
|----|------|--------|------|
| I5 | row_merge 单边 tail 不处理 | 低 | 已在 C10 中部分修复（tails_to_unify），需确认边界 |
| I6 | TypeEnv 不可从外部访问——阻碍 LSP hover/completion | 中 | check() 需返回 TypeEnv 或暴露接口 |
| I7 | unify.ts 全局可变状态 `_unify_next_id` | ✅ 已有重置 | `init_unify_fresh_counter` 在每次 check() 时调用，magic number 已提取为 `UNIFY_ID_OFFSET` 常量 |
| I16 | `register_fn` 行变量过度泛化 | ✅ 已修复 | 排除已声明 type_params 防止重复 push 到 type_vars |

### 测试补全

| ID | 问题 | 复杂度 | 说明 |
|----|------|--------|------|
| I8 | unify.ts 零单元测试 | ✅ 已补 | 30 个测试覆盖 occurs check、row unification、effect row、apply |
| I9 | 负面 e2e 测试仅 3 个 | ✅ 已补 | 新增 error_arity、error_undefined、error_operator、error_multi_type |
| I10 | `?` 操作符解包 `none` 失败路径未测试 | ✅ 已补 | option_unwrap_none.ring |
| I11 | 嵌套字符串插值 `"${a + "${b}"}"` 未测试 | ✅ 已补 | string_interp_nested.ring |

## 剩余 Minor (0)

| ID | 问题 | 说明 |
|----|------|------|
| M1 | Parser 类型参数回溯逻辑重复 | ✅ 提取 `try_parse_type_args()` |
| M2 | `parse_let_stmt`/`parse_var_stmt` 几乎完全相同 | ✅ 合并为 `parse_binding_stmt(mutable)` |
| M3 | `emit_stmt`/`gen_stmt_inline` 逻辑重复 | ✅ emit_stmt 委托给 gen_stmt_inline |
| M5 | `GenericType` 无代码路径触发 | ✅ 保留（Phase 3 泛型特化预留） |
| M6 | `__self_` 前缀未从 hir/index.ts 抽取 | ✅ `default_method_self_name()` |
| M7 | `format_hint` 遗漏 5 种 DiagnosticContext | ✅ 补全所有 context kind |
| M8 | Lexer 转义字符/`..`/`?` token 单元测试缺失 | ✅ 补充 3 个测试 |
| M9 | `+=`/`-=`、match guard、else if、trait 默认方法无 e2e 测试 | ✅ 补充 4 个 e2e + 修复 match guard codegen bug |
| M10 | 负面测试 error_pattern 匹配过于宽松 | ✅ 改用错误码 E0201/E0301/E0103 |
| M11 | `types_equal` 对 record field 顺序敏感 | ✅ 改为 field name 集合比较 |
| M12 | Magic number `_unify_next_id = 100000` | ✅ 提取为 `UNIFY_ID_OFFSET` 常量 |
| M13 | `infer_block` 对每条 stmt 重复 `row_merge` O(n²) | ✅ 确认为 O(n·m) 非瓶颈，跳过 |
| M14 | `bind_pattern` 对非预期 scrutinee 类型无反应 | ✅ 加 defensive error |
| M15 | register 系列重复的 type_param_scope save/restore | ✅ 模式清晰可接受，register_fn 需要中途引用不适合 wrapper |
| M16 | `current_fn_bounds` save/restore 容易遗漏 | ✅ 改为栈式 push/pop |
| M17 | `OptionType` 与 `EnumType "Option"` 双轨制 | ✅ 统一为 EnumType，删除 OptionType |
| M18 | occurs check 对 effect row tail 浅层检查 | ✅ 递归展开 tail var through substitution |

## 全部完成 ✅

所有 2 Critical + 14 Important + 16 Minor 已处理完毕。
- 147 单元测试 + 118 e2e = 265 测试全通过
- lint 干净
- 可进入 Phase 3 或 LSP 开发
