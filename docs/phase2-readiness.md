# Phase 2 准备度报告

> 2026-05-16 Phase 1 清理后编写

## Phase 1 健康状态

| 指标 | 数值 |
|------|------|
| 编译器单元测试 | 80 pass / 0 fail |
| 端到端测试 | 24 pass / 0 fail |
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

### 1. Effect handler codegen 语义

当前 generator-based handler 在简单场景（单次 yield + mock 返回）下能工作，但以下场景未验证：

- handler 中调用 `resume` 多次（多次恢复）
- 多层嵌套 handler（外层 handler 拦截内层未处理的 effect）
- handler 中产生新的 effect

Phase 2 实现 evidence passing 时需要重写 `gen_handle`。已有 e2e 测试（`effect_handle_io.ring`、`effect_resume.ring`）作为回归保护。

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
