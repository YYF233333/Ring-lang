# Full Codebase Review — 2026-05-17

审查方法：4 路 Claude Opus 并行审计 + DeepSeek 交叉验证（DS 因配置问题未出结果）

## 修复状态汇总

| Bug | 状态 | 修复内容 |
|-----|------|---------|
| #1 substitute_effect_row tail | ✅ FIXED | 添加 tail 变量替换逻辑 |
| #2 Row unification 丢失 tail | ✅ FIXED | 双方 surplus+open 时创建 fresh 共享 tail |
| #3 occurs_in 遗漏 effect row | ✅ FIXED | fn 类型 occurs check 增加 effect row 检查 |
| #4 gen_stmt_inline safe_ident | ✅ FIXED | 添加 safe_ident 调用 |
| #5 gen_pattern_bindings safe_ident | ✅ FIXED | 添加 safe_ident 调用 |
| #6 泛型 struct 字段访问 | ✅ FIXED | 添加 instantiation_map 替换 |
| #7 泛型 enum pattern binding | ✅ FIXED | 添加 instantiation_map 替换 |
| #8 struct-to-record occurs-check | ✅ FIXED | 改为抛出错误而非静默跳过 |
| #9 Lexer raw string EOF | ✅ FIXED | 改为抛出 Error |
| #10 r# fallback 吞 # | ✅ FIXED | 回退 pos 和 column |
| #11 e2e error_pattern 未使用 | ✅ FIXED | 添加 error message assertion |
| #12 Block 分号尾表达式 | ✅ FIXED | ExprStmt.has_semi + parse_block_expr 检查 |
| #13 or 右结合 | ❌ FALSE POSITIVE | 验证后确认已是左结合 |
| #14 collect_free_vars effect row | ✅ FIXED | fn 类型遍历 effect row tail + type args |
| #15 update_fn_effects 原地修改 | ⏸️ DEFERRED | 互递归场景低风险，暂不修改 |

## 基础设施 TODO（记录待后续处理）

- [ ] 添加 `.github/workflows/ci.yml`（lint + test 自动化）
- [ ] 拆分 `infer.ts`（1550 行 → core + trait resolution + effects）
- [ ] `tsconfig.json` 添加 `noUncheckedIndexedAccess`
- [ ] `package.json` 修正 `"main"` 字段 + 添加 `"engines"`
- [ ] 扩展 lint.mjs（`as unknown as T`、`!` 非空断言）
- [ ] e2e 测试添加 timeout + 更多 negative cases
- [ ] CLI 重构：提取 programmatic API（为 LSP 铺路）

## 一、Critical Bugs

### Bug #1: `substitute_effect_row` 不替换 tail 变量
- **文件**: `compiler/src/checker/env.ts:291-304`
- **问题**: `instantiate` 时 effect row 的 tail 变量从不被替换为新变量。同一多态函数的多次实例化共享同一个 effect row tail，导致错误的 unification 或不健全的 effect 推断。
- **对比**: 同文件 `substitute_type` 对 RecordType 的 tail 正确做了替换。

### Bug #2: Row unification 在双方都有多余字段时丢失 tail 约束
- **文件**: `compiler/src/checker/unify.ts:388-408`
- **问题**: `unify_record_rows` 中，当两个 record 都有独有字段且开放 tail 时，分别绑定各自 tail 到对方多余字段，但跳过剩余 tail 之间的 unification。按 Koka 的 row unification 算法需要统一两个 tail 的剩余部分。

### Bug #3: `occurs_in` 不检查 fn 类型中的 effect row tail
- **文件**: `compiler/src/checker/unify.ts:158-160`
- **问题**: occurs check 检查 fn 的 params 和 return_type，但完全不检查 effect row tail。可能允许通过 effect row tail 构造无限类型。

### Bug #4: `gen_stmt_inline` 不对变量名调用 `safe_ident()` ✅ FIXED
- **文件**: `compiler/src/codegen/codegen.ts:526-530`
- **问题**: IIFE 块上下文中 `let_stmt`/`var_stmt` 直接输出变量名。对比 `emit_stmt` 正确使用了 `safe_ident`。

### Bug #5: `gen_pattern_bindings` 同样缺少 `safe_ident()` ✅ FIXED
- **文件**: `compiler/src/codegen/codegen.ts:489-506`
- **问题**: 模式匹配绑定名直接输出，JS 保留字问题同上。

## 二、Medium Bugs

### Bug #6: 泛型 struct 字段访问返回未实例化的类型变量
- **文件**: `compiler/src/checker/infer.ts:1218-1228`
- **问题**: `infer_field_access` 从 struct 定义中直接取字段类型，不根据实际 type_params 做替换。因 UFCS 方法走另一条路径暂未暴露。

### Bug #7: Pattern binding 对泛型 enum 使用未实例化的 variant 字段类型
- **文件**: `compiler/src/checker/infer.ts:1360-1386`
- **问题**: 匹配 `Result<Int, Str>` 的 `Ok(x)` 时，`x` 绑定到定义时类型变量而非具体 `Int`。

### Bug #8: `unify_struct_with_record` occurs-check 为真时静默跳过绑定
- **文件**: `compiler/src/checker/unify.ts:436-438`
- **问题**: 与 `unify_record_rows`（抛错）行为不一致，可能导致不健全的类型。

### Bug #9: Lexer raw string 未终止时静默返回 token ✅ FIXED
- **文件**: `compiler/src/parser/lexer.ts:268-282`
- **问题**: 普通字符串未终止会抛错误，但 `r#"...` 在 EOF 时静默返回。

### Bug #10: `r#` 后非 `"` 时 `#` 字符被吞掉 ✅ FIXED
- **文件**: `compiler/src/parser/lexer.ts:259-266`
- **问题**: 已消费 `r` 和 `#` 后回退为 `Ident("r")`，`#` 丢失。

### Bug #11: e2e 测试中 `error_pattern` 字段声明但从未使用 ✅ FIXED
- **文件**: `tests/e2e.test.ts:109-126`
- **问题**: 负面测试不验证错误消息内容。

## 三、Design Issues

### Issue #12: Block 尾表达式无法用分号抑制
- **文件**: `compiler/src/parser/parser.ts:886-908`
- **问题**: `{ expr; }` 和 `{ expr }` 产生相同结果。Rust 中分号抑制返回值。
- **讨论**: 需要决定语言语义。

### Issue #13: `or` 表达式为右结合
- **文件**: `compiler/src/parser/parser.ts:811`
- **问题**: `a or b or c` 解析为 `a or (b or c)`。作为 fallback 操作左结合更自然。
- **讨论**: 语义无害（or 在 fail 语境下等价），但不直觉。

### Issue #14: `collect_free_vars` 不遍历 fn 类型的 effect row
- **文件**: `compiler/src/checker/infer.ts:69-96`
- **问题**: Effect row tail 变量可能被错误泛化。

### Issue #15: `update_fn_effects` 原地修改 TypeScheme
- **文件**: `compiler/src/checker/infer.ts:148-153`
- **问题**: 互递归场景下已实例化副本不被更新。

## 四、设计文档与实现不一致

| 设计文档特性 | 状态 | CLAUDE.md 是否记录 |
|---|---|---|
| `Option<T>` + `?` postfix + `try` block | 完全未实现 | **未记录** |
| `catch ParseError fn(e) {...}` 类型化 catch | 未实现 | 未记录 |
| `map_fail` 错误转换 | 未实现 | 未记录 |
| Enum named fields `circle(radius: Float)` | 未实现（仅位置字段） | 未记录 |
| `loop` / `for` / range `0..100` | 未实现（`for` 仅为保留字） | 未记录 |
| `delegate` 语法 | 未实现 | 未记录 |
| `mut<S>` 带类型参数的 effect | 实现为无参数 `mut` | 未记录 |
| `io.read/write` 使用 `Bytes` 类型 | 实现为 `Str` | 未记录 |
| `pub` 可见性检查 | 仅解析存储，不强制执行 | 未记录 |

## 五、基础设施改进建议

### P0（紧急）
1. **无 CI 管线** — 无 `.github/workflows/`，lint+test 无自动化保证。
2. **`infer.ts` 1550 行** — 应拆分为 core inference + trait resolution + effect inference。

### P1（高优）
3. **`tsconfig.json` 缺少 `noUncheckedIndexedAccess`** — 编译器频繁索引数组/map。
4. **无 `--error-format=llm` CLI flag** — 函数存在但未接入。
5. **负面测试仅 1 个** — 各错误类别应有测试。
6. **无 barrel export / programmatic API** — LSP 需要。

### P2（中优）
7. **`package.json` 问题** — `"main"` 指向 CLI，缺 `"engines"`，无统一 test 脚本。
8. **lint 规则不够** — 应检查 `as unknown as T`、`!` 非空断言等。
9. **e2e 测试无 timeout** — `execSync` 无超时。
10. **LSP 准备度低** — 无增量编译、无位置→节点查找、异常式报错。

## 六、项目结构评估

**优点**:
- 模块依赖图严格分层，无循环依赖
- AST/HIR 分离设计合理
- 类型定义文件纯类型无逻辑

**改进方向**:
- `infer.ts` 需拆分
- 需要 `compiler/src/index.ts` barrel export
- CLI 需重构为薄壳 + 可编程 API
