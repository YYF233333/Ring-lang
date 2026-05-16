# CLAUDE.md

## 项目概述

Ring-lang：面向大型多端应用的编程语言，转译到 JavaScript/V8 运行。

核心特性：代数 effect system、refinement types、ML 级类型推断、row polymorphism + OOP 手感模拟。设计目标：LLM vibe coding 友好性优于 TypeScript。

完整设计文档见 `docs/design.md`。

**当前状态：Phase 2 Session 3 完成** — 编译器支持 row polymorphism + evidence passing effect system + trait 系统。100 个单元测试 + 67 个端到端测试全部通过。详见 `docs/superpowers/specs/2026-05-17-phase2-session3-row-polymorphism.md`。

## 技术栈

- **编译器实现语言**：TypeScript（strict mode, ES2022, Node16 模块）
- **编译目标**：JavaScript（V8 运行时）
- **测试框架**：node:test（零外部依赖）
- **参考实现**：Koka 编译器（MIT 许可），用于 effect 推断、evidence passing 等复杂算法的翻译

## 项目结构

```
Ring-lang/
├── docs/
│   ├── design.md                    完整语言设计（15 章）
│   ├── phase2-readiness.md          Phase 2 准备度报告 + 机械约束清单
│   ├── specs/                       设计规格文档
│   │   ├── 2026-05-16-phase1-compiler-design.md
│   │   └── 2026-05-16-phase2-design.md
│   └── plans/                       实施计划
│       └── 2026-05-16-phase2-session1-trait-system.md
├── compiler/
│   ├── src/
│   │   ├── ast/index.ts             AST 节点类型定义
│   │   ├── types/index.ts           Type、Effect、EffectRow 表示
│   │   ├── hir/index.ts             HIR 节点定义 + 共享约定（variant_js_name, trait_dict_name, evidence_param_name）
│   │   ├── errors.ts                诊断/错误类型 + assertNever 穷尽检查
│   │   ├── parser/
│   │   │   ├── lexer.ts             手写词法分析器
│   │   │   ├── parser.ts            递归下降 + Pratt 优先级解析（含 trait 语法）
│   │   │   └── parser.test.ts       Parser 测试（41 tests）
│   │   ├── checker/
│   │   │   ├── env.ts               类型环境 + 作用域 + 内置定义
│   │   │   ├── unify.ts             HM Unification + 替换
│   │   │   ├── infer.ts             Algorithm W 类型推断
│   │   │   ├── exhaustive.ts        穷尽性检查
│   │   │   ├── checker.ts           主入口：check(Program) → HProgram
│   │   │   └── checker.test.ts      Checker 测试（29 tests）
│   │   ├── codegen/
│   │   │   ├── runtime.ts           JS 运行时辅助���码
│   │   │   ├── codegen.ts           HIR → JavaScript 生成
│   │   │   └── codegen.test.ts      Codegen 测试（30 tests）
│   │   └── cli.ts                   ring build/run/check 入口
│   ├── scripts/
│   │   └── lint.mjs                 自定义 lint 检查（as any 禁令等）
│   ├── package.json
│   └── tsconfig.json
├── examples/
│   ├── hello.ring                   基本示例（可运行）
│   └── effects.ring                 Effect 系统示例（可类型检查）
└── tests/
    ├── cases/                       端到端测试用例（23 个）
    │   ├── hello.ring               基础函数 + struct
    │   ├── enum_match.ring          enum + pattern matching
    │   ├── string_interp.ring       字符串插值
    │   ├── effect_or.ring           or 错误处理
    │   ├── effect_catch.ring        catch 错误处理
    │   ├── effect_handle_fail.ring  handle/with fail
    │   ├── effect_handle_io.ring    handle/with io mock（evidence passing）
    │   ├── effect_resume.ring       跨函数 effect 传播（evidence 转发）
    │   ├── effect_evidence.ring     基础 evidence passing handler
    │   ├── effect_multi_handler.ring 多 effect 同时 handle（io + fail）
    │   ├── effect_propagate.ring    3 层函数 evidence 转发
    │   ├── trait_basic.ring         trait + impl + dictionary passing
    │   ├── trait_chain.ring         泛型函数调用泛型函数 dictionary 转发
    │   ├── trait_multi_call.ring    同一表达式多次 trait 方法调用
    │   ├── effect_cell.ring         Cell<T> + mut effect
    │   ├── effect_cell_closure.ring 闭包捕获 Cell
    │   ├── effect_resume_side.ring  resume + side effect
    │   ├── row_basic.ring           record row poly 基本
    │   ├── row_multi_field.ring     多字段 record row
    │   ├── row_generic.ring         多 struct 共用一个 row fn
    │   ├── row_reject.ring          缺字段编译期拒绝（负面测试）
    │   ├── effect_row_strict.ring   effect row 推断 + handle
    │   └── effect_row_handle.ring   handle 消除 fail effect
    └── e2e.test.ts                  端到端测试运行器（67 tests）
```

## 编译器管线

```
源码 (.ring) �� Lexer → Parser → AST → Checker (HM + effects) → HIR → Codegen → JavaScript
```

- **AST**：忠实反映源码结构，所有节点带 Span 位置
- **HIR**：独立数据结构，每个表达式��带推断的 Type + EffectRow，语法糖已展开
- **设计意图**：HIR 独立于 AST，后续优化 pass 在 HIR → Codegen 之间插入

## 开发约定

- 编译器代码风格：TypeScript strict mode（含 noUnusedLocals/noImplicitReturns），snake_case 用于 Ring-lang 相关标识符
- 禁止 `as any` / `@ts-ignore`：使用 `npm run lint` 机械检查
- 编译器各阶段共享约定放 `hir/index.ts`（如 `variant_js_name`），不允许跨阶段硬编码字符串契约
- Ring-lang 注释语法：`//`（非 `--`），与 Rust/JS 一致，LLM 更友好
- 无 pipe 运算符：UFCS `.method()` 是唯一的链式调用方式（"一种事一种写法"）
- 编译器必须编译速度快（亚秒级增量编译），因为 IDE 耦合
- 生成的 JS 代码应是可读的——方便调试和理解翻译逻辑
- 复杂算法参考 Koka 的 Haskell 实现翻译，标注来源
- 新增 AST/HIR 节点后必须处理所有 `assertNever` 位置（编译器自动检查）
- 每个 PR 至少包含一个 e2e 测试用例（`tests/cases/*.ring` + `e2e.test.ts` 注册）
- PR 合入前必须通过 `npm run lint` + `npm test`

## 已实现功能

### Phase 1 ✅

- ✅ 手写 Lexer（含字符串插值 `${}`、raw string `r#"..."#`）
- ✅ 递归下降 Parser + Pratt 运算符优先级
- ✅ struct + enum + pattern matching（穷尽性检查）
- ✅ Hindley-Milner 类型推断（Algorithm W + let-polymorphism）
- ✅ Effect 推断（`io` + `fail<E>`，自动传播和消除）
- ✅ UFCS + impl 块方法解析
- ✅ `or` / `catch` 错误处理（编译为 evidence + try/catch）
- ✅ `handle...with` effect handler（编译为 evidence passing）
- ✅ 字符串插值 → JS template literals
- ✅ JS 代码生成（struct→class, enum→factory, match→switch）
- ✅ CLI：`ring build/run/check`

### Phase 2 Session 1 ✅ (Trait 系统)

- ✅ `trait` 声明（含抽象方法和默认方法）
- ✅ `impl Trait for Type`（含完整性验证——缺少必需方法时报错）
- ✅ 泛型约束 `<T: Trait>` 和多约束 `<T: A + B>`
- ✅ Trait 方法解析（具体类型直接调用 + 泛型类型变量 dictionary dispatch）
- ✅ Dictionary Passing codegen：`impl Trait for Type` → JS dictionary 对象，泛型函数接收 `__Trait` 参数
- ✅ Dictionary 转发：泛型函数调用另一个泛型函数时自动传递 dictionary
- ✅ 同一表达式多次 trait 方法调用（resolve_var_id 链追踪修复）

### Phase 2 Session 2 ✅ (Evidence Passing Effect System)

- ✅ Evidence Passing：所有 effect（io, fail, custom）统一为 evidence 参数传递
- ✅ Effect 操作 → evidence 方法调用（`io.read(x)` → `__ev_io.read(x)`）
- ✅ Handler codegen：`handle...with` → evidence 对象构造 + try/catch（abort 语义）
- ✅ 函数签名自动注入 `__ev_` 参数（按 effect name 字母序排列）
- ✅ Evidence 转发：跨多层函数调用自动传递 evidence
- ✅ `or` / `catch` 表达式：纯函数优化（直接返回）+ fail evidence 注入
- ✅ 顶层 main() evidence 注入（io → fs 真实实现，fail → throw）
- ✅ 运行时精简：删除 generator `__run_handler`，新增 `__EffectAbort` 类（6 行）

### Phase 2 Session 2b ✅ (Cell<T> + mut + resume)

- ✅ `Cell<T>` 运行时类型：`new`/`get`/`set`/`update` UFCS 方法
- ✅ `mut` effect 声明 + checker 注册
- ✅ Cell 运行时函数 codegen + UFCS dispatch
- ✅ 闭包捕获 Cell（依赖 JS 闭包语义）
- ✅ Resume side-effect 测试（handler body 中 io 操作 + 返回值）

### Phase 2 Session 3 ✅ (Row Polymorphism)

- ✅ Record row types：`{field: Type, ..rest}` 在函数参数类型中使用
- ✅ Koka 风格 row unification（record row 和 effect row 共用算法）
- ✅ Struct → Record coercion（单向：struct 满足 record 约束）
- ✅ Effect row 收紧（proper row variable matching 替代 lenient 模式）
- ✅ Record field access codegen（零成本：JS property access）
- ✅ Row variable generalization（函数 type scheme 包含 row variable）

## 已知限制

- Lambda 带 effect 时不注入 evidence 参数（依赖闭包捕获，跨作用域调用可能失败）
- Trait dictionary dispatch 不转发 evidence（trait 方法带 effect 时缺少 evidence 参数）
- Resume 仅支持隐式模式（handler body 返回值即 resume 值，不支持 resume 后继续执行额外代码）
- Record row types 仅在参数位置使用（无匿名 record 字面量、无 spread 运算符）
- Row variable 不暴露于泛型类型参数语法（无 `<R: Row>`）
- Refinement `where` 子句只解析不验证
- 不含模块系统、async/spawn
- Trait 系统暂不支持：关联类型、supertrait 继承、`dyn Trait` 动态分发

## MVP 路线图

### Phase 1：可以玩的编译器 ✅ (2026-05-16)
- ✅ Parser + HM 类型推断 + Effect 推断
- ✅ struct + enum + pattern matching + UFCS
- ✅ fail effect 4 层甜度 + JS 代码生成

### Phase 2：有手感的语言（分 4 个 Session）
- ✅ **Session 1**: Trait 系统 + 泛型约束 + Dictionary Passing (2026-05-16)
- ✅ **Session 2**: Evidence Passing Effect System (2026-05-17)
- ✅ **Session 3**: Row Polymorphism (2026-05-17)
- 🔲 **Session 4**: LSP server + `--error-format=llm`

### Phase 3：研究向扩展
- Refinement types（编译期验证 + 运行时检查）
- Dependent types lite
- Formatter 自动标注等级系统
- 渐进式自举

## 常用命令

```bash
# 编译器开发
cd compiler && npm install && npm run build

# 运行 Ring-lang 程序
node compiler/dist/cli.js run examples/hello.ring

# 编译为 JS（不执行）
node compiler/dist/cli.js build examples/hello.ring

# 仅类型检查
node compiler/dist/cli.js check examples/effects.ring

# 运行编译器单元测试（100 tests，自动先编译）
cd compiler && npm test

# 仅 TypeScript 类型检查（不编译输出）
cd compiler && npm run typecheck

# 机械 lint 检查（tsc strict + as any/ts-ignore/console.log 扫描）
cd compiler && npm run lint

# 调试模式（打印中间 AST/HIR/JS）
node compiler/dist/cli.js run --debug examples/hello.ring
```
