# Phase 2 准备度报告

> 2026-05-16 Phase 1 清理后编写，Session 2 完成后更新（2026-05-17）

## 当前健康状态（Session 2 完成后）

| 指标 | 数值 |
|------|------|
| 编译器单元测试 | 100 pass / 0 fail |
| 端到端测试 | 42 pass / 0 fail（14 cases × 3 modes） |
| `tsc --strict` | 零错误（含 noUnusedLocals, noImplicitReturns） |
| `npm run lint` | 零错误（as any 禁令 + console.log 检测） |
| `as any` 残留 | 0 |
| 全局可变状态 | 0（type var counter 已迁入 TypeEnv） |

## 已建立的机械约束

### 编译期约束（tsconfig.json）

- `strict: true` — 全面类型检查
- `noUnusedLocals: true` — 死代码编译时报错
- `noUnusedParameters: true` — 未使用参数编译时报错
- `noImplicitReturns: true` — 缺少 return 分支时报错
- `noFallthroughCasesInSwitch: true` — switch 穿透报错

### 运行时类型安全（assertNever）

关键 switch 分发点已加入 `assertNever` exhaustive check：

| 位置 | 作用 |
|------|------|
| `infer.ts: infer_expr` | 新增 AST 表达式类型时编译报错 |
| `infer.ts: register_decl` | 新增声明类型时编译报错 |
| `infer.ts: check_decl` | 新增声明类型时编译报错 |
| `codegen.ts: emit_decl` | 新增 HIR 声明时编译报错 |
| `codegen.ts: gen_expr` | 新增 HIR 表达式时编译报错 |
| `codegen.ts: gen_stmt_inline` | 新增 HIR 语句时编译报错 |

**效果**：Phase 2 新增 AST/HIR 节点时，如果任何一个阶段漏加处理，TypeScript 编译器会直接报错，而非产生运行时 bug。

### 自定义 lint（scripts/lint.mjs）

- 禁止 `as any` — 防止绕过类型系统
- 禁止 `@ts-ignore` / `@ts-nocheck` — 防止绕过编译检查
- 检测非运行时 `console.log` — 防止调试残留

### 构建流程约束（package.json）

- `pretest` → 每次 `npm test` 前自动编译，不可能跑旧代码
- `npm run lint` → 一键执行 tsc + 自定义检查
- `npm run typecheck` → 仅类型检查，不生成输出

## Phase 1 清理中修复的问题

### Bug 修复

1. **struct 泛型字段类型替换空操作**：`infer_struct_lit` 中，泛型 struct 实例化时字段类型未正确替换。根源是 `StructDef` 未保存注册时的 type var id。已修复：新增 `type_param_vars` 字段 + `substitute_type` 应用。

2. **codegen 多 fail handler 只用第一个分支**：`gen_handle` 在多 fail handler 时构建了所有分支但只 emit 了 `branches[0]`。已简化为最后一个 handler 生效（标准遮蔽）。

### 架构改进

3. **type var counter 全局 → 实例**：从 `types/index.ts` 全局变量迁入 `TypeEnv` 实例。为 Phase 2 LSP 多会话并行做好准备。

4. **enum variant 命名契约统一**：`${Enum}_${Variant}` 格式从 infer.ts + codegen.ts 各自硬编码提取为 `variant_js_name()` 共享函数（定义在 `hir/index.ts`）。

## Phase 2 已知风险

### 1. Evidence Passing 边界场景（Session 2 遗留）

Generator-based handler 已完全替换为 evidence passing。以下场景是已知限制：

- Lambda 带 effect 时不注入 evidence 参数（依赖闭包捕获，跨作用域调用可能 ReferenceError）
- Trait dictionary dispatch（`dict.method()`）不转发 evidence（trait 方法本身带 effect 时失败）
- One-shot resume 未实现（handler 无法在 resume 前后执行额外逻辑）
- 多层嵌套 handler 的 evidence 遮蔽已通过词法作用域自然支持，但未有专门测试覆盖

### 2. where 子句只解析不验证

Parser 消费 `where` token 但不保存语义信息。Phase 2 引入 refinement types 时需要重新设计 AST 节点和 checker 逻辑。

### 3. 模块系统不存在

当前 `io.read` / `io.write` 是在 `TypeEnv` 中硬编码为 built-in effect op。Phase 2 需要实现模块解析、import/export、跨文件类型检查。`toml` 模块硬编码已在清理中移除。

### 4. 跨阶段字符串契约

`_tag` 字段名在 codegen 中硬编码。`variant_js_name` 模式已建立，后续新增的跨阶段约定必须走同样路径——共享函数/常量，不允许字符串字面量耦合。

## Phase 2 开发规则

1. **每个 PR 至少包含一个 e2e 测试用例**（在 `tests/cases/` 中添加 `.ring` 文件 + 在 `e2e.test.ts` 中注册预期输出）
2. **新增 AST/HIR 节点必须在所有 assertNever 位置补充处理**（编译器会强制你做到）
3. **跨阶段约定必须用共享函数**（放在 `hir/index.ts`），不允许裸字符串耦合
4. **PR 合入前必须通过 `npm run lint` + `npm test`**
5. **禁止引入 `as any` / `@ts-ignore`**（lint 机械检查）

---

## Session 1 完成报告：Trait 系统 + 泛型约束

> 2026-05-16

### 新增功能

| 管线阶段 | 变更 |
|---------|------|
| Lexer | `trait` 关键字 |
| AST | `TraitDecl`、`TypeBound` 节点；`TypeParam.bounds` 多约束；`FnDecl.is_abstract` |
| Parser | `parse_trait_decl`、`parse_type_bound`、`<T: A + B>` 多约束语法 |
| Checker | trait 注册、impl 完整性验证、trait 方法解析、`fn_bounds` 追踪、dictionary dispatch |
| HIR | `HTraitDecl`、`trait_dict_name`、`HFnDecl.trait_bounds`、`HCall.resolved_dicts` + `dict_dispatch` |
| Codegen | dictionary 对象生成、泛型函数 dictionary 参数注入、`__Trait.method()` dispatch |

### Codegen 策略

**Dictionary Passing**：每个 `impl Trait for Type` 生成一个 JS 对象（如 `const User_Greetable = { greet: User_greet }`）。泛型函数 `fn show<T: Greetable>(x: T)` 编译为 `function show(x, __Greetable)`。调用点自动传递对应 dictionary。

### 自测中发现并修复的 Bug

1. **泛型函数调用泛型函数时 dictionary 未转发**：`show<T: Trait>` 调用 `stringify<T: Trait>(x)` 时，`x` 是类型变量，原逻辑只匹配具体类型。修复：识别类型变量的 trait bound 并转发当前函数的 `__Trait` 参数。
2. **同一表达式多次 trait 方法调用**：`x.size() + x.size()` 中，第一次调用 unify 改变了 substitution chain，第二次调用的 type var ID 无法匹配原始 bound。修复：`resolve_var_id` 追踪 substitution chain 到终点再比较。

### Session 1 已知限制（留后续 Session）

- 关联类型（`type Item`）未实现
- Supertrait 继承（`trait Ord: Eq`）未实现
- `dyn Trait` 动态分发未实现
- Dictionary 内联优化（已知具体类型时跳过 dictionary）未实现

---

## Session 2 完成报告：Evidence Passing Effect System

> 2026-05-17

### 架构变更

**从 generator-based 到 evidence passing 的完整重写**：

| 变更前 | 变更后 |
|--------|--------|
| `yield { effect, op, args }` | `__ev_io.read(args)` |
| `function*` generator 函数 | 普通 `function` |
| `__run_handler(gen, handlers)` 运行时 | `__EffectAbort` 类（6 行） |
| try/catch（仅 fail）+ generator（其他 effect） | 统一 evidence passing |

### Codegen 策略

**Evidence Passing**：每个 effect 成为函数的隐藏参数（`__ev_{name}`）。Handler 构造 evidence 对象并通过 IIFE 传递给 body。Abort 语义操作（`fail.raise`）使用 `__EffectAbort` + try/catch 来 unwind 栈。

参数顺序：`user params → trait dicts → evidence params`（evidence 按 effect name 字母序排列）。

### 新增 e2e 测试

| 文件 | 验证场景 |
|------|----------|
| `effect_evidence.ring` | 基础 evidence passing（handler mock io.read） |
| `effect_multi_handler.ring` | 多 effect 同时 handle（io + fail） |
| `effect_propagate.ring` | 3 层函数调用的 evidence 转发 |

### 性能影响

- fail effect：零开销不变（evidence 的 raise 直接 throw）
- io/custom effect：从 10-100x（generator 帧开销）降至 1-2x（函数调用 + 间接引用）
- 运行时精简：从 20 行 `__run_handler` 降至 6 行 `__EffectAbort`

### Session 2 已知限制

- Lambda + effect：gen_lambda 不注入 evidence 参数
- Trait dict_dispatch + effect：不转发 evidence
- One-shot resume：未实现（handler 无法 resume 后执行逻辑）
- mut effect：类型已定义但 codegen 未特殊处理（留待下一轮）
