# Phase 1 审查报告 — 剩余问题

**原始审查日期**: 2026-05-16
**修复批次 1**: 2026-05-16（C1-C11, I10, I13, I14 已修复）
**修复批次 2**: 2026-05-16（I1-I3, I5, I7, I9, I12, I18, I20, I22, I23 已修复）
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

## 二、剩余问题（低优先级，可延至 Phase 2）

### I4. `remove_fail_effect` 不区分错误类型

- **文件**: `compiler/src/checker/infer.ts`
- **问题**: 如果函数同时有 `fail<ParseError>` 和 `fail<IoError>`，一个 `or` 表达式会同时移除两者。
- **影响**: 低——Phase 1 中很少出现多 fail 类型共存的场景。Phase 2 trait 系统后自然解决。

### I6. yield 在非 generator 上下文中

- **文件**: `compiler/src/codegen/codegen.ts`
- **问题**: `gen_effect_op` 统一生成 `yield`。非 `handle` 上下文中 effect op 会生成非法 JS。
- **影响**: 中——`fail.raise` 应编译为 `throw`，其他 effect 需 propagation 标记。Phase 2 effect handler 重构会解决。

### I8. 穷尽性不检查嵌套 pattern

- **文件**: `compiler/src/checker/exhaustive.ts`
- **问题**: 只看顶层 variant 名称，不检查嵌套 pattern 完整性。
- **影响**: 低——Phase 1 中 nested pattern matching 的使用有限，且有运行时 `__match_fail` 兜底。

### I11. Struct 字面量字段顺序假设

- **文件**: `compiler/src/codegen/codegen.ts`
- **问题**: `new Type(arg1, arg2)` 假设字段顺序与声明一致。`Point { y: 2, x: 1 }` 可能将 y 赋给 x。
- **影响**: 中——需要 codegen 查找 struct 定义并按声明顺序排列字段。

### I15. 比较运算符结合性

- **文件**: `compiler/src/parser/parser.ts`
- **问题**: `a == b == c` 被解析为 `(a == b) == c`。比较运算符应为非结合。
- **影响**: 低——极少有人写链式比较，且结果是类型错误（Bool == Int）。

### I16. 插值内字符串被误当插值结束

- **文件**: `compiler/src/parser/lexer.ts`
- **问题**: 插值表达式内部的字符串字面量中的 `"` 被当作插值结束符处理。
- **影响**: 中——需要在 lexer 中维护括号深度计数器。

### I17. UFCS method call codegen 错误

- **文件**: `compiler/src/codegen/codegen.ts`
- **问题**: impl 方法被编译为独立函数 `TypeName_methodName`，但 method call 生成 `obj.method(args)` 而非 `TypeName_methodName(obj, args)`。
- **影响**: 高——但 Phase 1 示例中未暴露（hello.ring 不用 method call），需要 codegen 识别 HIR 中的 UFCS 调用模式。

### I19. fail effect 从未被添加到 effect row

- **文件**: `compiler/src/checker/infer.ts`
- **问题**: 没有代码向函数的 effect row 添加 `fail` effect。`or`/`catch` 移除一个从未被添加的 effect。
- **影响**: 中——effect 追踪不完整，但不影响代码生成正确性。Phase 2 effect 系统完善时必须修复。

### I21. Diagnostic 系统完全未使用

- **文件**: `compiler/src/errors.ts`
- **问题**: `CompileError`/`Diagnostic` 系统已定义但未使用。
- **影响**: 低——Phase 2 LSP 前必须迁移。

---

## 三、已修复问题记录

### 批次 1（2026-05-16）

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
| — | `Any` 类型用户可用 | 从 resolve_named_type 移除；print 改为泛型；infer.ts 完全移除 ANY |

### 批次 2（2026-05-16）

| ID | 问题 | 修复摘要 |
|----|------|----------|
| I1 | FnType unify 跳过 effects | 在 FnType 统一中增加 fail error_type 的 unify |
| I2 | `types_equal` 忽略 FnType effects | 增加 effects 数组比较 |
| I3 | `effects_equal` 忽略 CustomEffect type_args | 增加 type_args 逐项比较 |
| I5 | Match guard fallthrough → match_fail | guard 失败改为 `if (guard) { return; } break;` |
| I7 | 穷尽性不验证 variant 属于目标 enum | 用 `variant_names.has()` 验证 |
| I9 | 穷尽性视 guard pattern 为完整覆盖 | 带 guard 的 pattern 不计入 covered |
| I12 | Effect op param name 索引错误 | 改为 `(op, op_idx)` + `params[i]` |
| I18 | `field_access` 非 struct 静默返回 ANY | 抛 TypeCheckError（type var 用 fresh var 延迟） |
| I20 | handle 不验证 handler 类型 | handler params/resume 从 effect def 获取类型 |
| I22 | JS 保留字冲突未处理 | 添加 `safe_ident()` 前缀转义 |
| I23 | 字符串插值反斜杠未转义 | 先转义 `\` 再转义 `` ` `` 和 `${` |
| — | infer.ts 残余 ANY 使用 | 全部替换为 fresh_type_var()，移除 ANY 导入 |
