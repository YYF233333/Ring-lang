# CLAUDE.md

## 项目概述

Ring-lang：面向大型多端应用的编程语言，转译到 JavaScript/V8 运行。

核心特性：代数 effect system、refinement types、ML 级类型推断、row polymorphism + OOP 手感模拟。设计目标：LLM vibe coding 友好性优于 TypeScript。

完整设计文档见 `docs/design.md`。

**当前状态：Phase 1 完成 + Phase 2 准备就绪** — 编译器可以编译并运行基本 Ring-lang 程序（struct、enum、pattern matching、HM 类型推断、effect 推断、or/catch/handle 错误处理）。80 个单元测试 + 24 个端到端测试全部通过。机械约束体系已建立（详见 `docs/phase2-readiness.md`）。

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
│   └── specs/                       设计规格文档
│       └── 2026-05-16-phase1-compiler-design.md
├── compiler/
│   ├── src/
│   │   ├── ast/index.ts             AST 节点类型定义
│   │   ├── types/index.ts           Type、Effect、EffectRow 表示
│   │   ├── hir/index.ts             HIR（Typed IR）节点定义 + 跨阶段共享约定
│   │   ├── errors.ts                诊断/错误类型 + assertNever 穷尽检查
│   │   ├── parser/
│   │   │   ├── lexer.ts             手写词法分析器
│   │   │   ├── parser.ts            递归下降 + Pratt 优先级解析
│   │   │   └── parser.test.ts       Parser 测试（37 tests）
│   │   ├── checker/
│   │   │   ├── env.ts               类型环境 + 作用域 + 内置定义
│   │   │   ├── unify.ts             HM Unification + 替换
│   │   │   ├── infer.ts             Algorithm W 类型推断
│   │   │   ├── exhaustive.ts        穷尽性检查
│   │   │   ├── checker.ts           主入口：check(Program) → HProgram
│   │   │   └── checker.test.ts      Checker 测试（26 tests）
│   │   ├── codegen/
│   │   │   ├── runtime.ts           JS 运行时辅助���码
│   │   │   ├── codegen.ts           HIR → JavaScript 生成
│   │   │   └── codegen.test.ts      Codegen 测试（17 tests）
│   │   └── cli.ts                   ring build/run/check 入口
│   ├── scripts/
│   │   └── lint.mjs                 自定义 lint 检查（as any 禁令等）
│   ├── package.json
│   └── tsconfig.json
├── examples/
│   ├── hello.ring                   基本示例（可运行）
│   └── effects.ring                 Effect 系统示例（可类型检查）
└── tests/
    ├── cases/                       端到端测试用例（8 个）
    │   ├── hello.ring               基础函数 + struct
    │   ├── enum_match.ring          enum + pattern matching
    │   ├── string_interp.ring       字符串插值
    │   ├── effect_or.ring           or 错误处理
    │   ├── effect_catch.ring        catch 错误处理
    │   ├── effect_handle_fail.ring  handle/with fail
    │   ├── effect_handle_io.ring    handle/with io mock
    │   └── effect_resume.ring       跨函数 effect 传播
    └── e2e.test.ts                  端到端测试运行器（24 tests）
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

## Phase 1 已实现功能

- ✅ 手写 Lexer（含字符串插值 `${}`、raw string `r#"..."#`）
- ✅ 递归下降 Parser + Pratt 运算符优先级
- ✅ struct + enum + pattern matching（穷尽性检查）
- ✅ Hindley-Milner 类型推断（Algorithm W + let-polymorphism）
- ✅ Effect 推断（`io` + `fail<E>`，自动传播和消除）
- ✅ UFCS + impl 块方法解析
- ✅ `or` / `catch` 错误处理（编译为 try/catch）
- ✅ `handle...with` effect handler（编译为 generator）
- ✅ 字符串插值 → JS template literals
- ✅ JS 代码生成（struct→class, enum→factory, match→switch）
- ✅ CLI：`ring build/run/check`

## Phase 1 已知限制

- `effects.ring` 的完整 io mock handler 运行时需完善 generator wrapping
- Refinement `where` 子句只解析不验证
- 不含 trait 系统、泛型约束、row polymorphism
- 不含模块系统、async/spawn

## MVP 路线图

### Phase 1：可以玩的编译器 ✅ (2026-05-16)
- ✅ Parser（递归下降 + Pratt）
- ✅ struct + enum + pattern matching（穷尽性检查）
- ✅ HM 类型推断
- ✅ UFCS + impl 块方法解析
- ✅ fail effect 的 4 层甜度（冒泡/or/catch/handle）
- ✅ JS 代码生成 + 运行
- ⚠️ 完整 effect handler generator 运行时待完善

### Phase 2：有手感的语言
- Trait 系统 + 泛型约束
- Effect 推断完善（mut effect）
- Row polymorphism
- 完整 effect handler（evidence passing 优化）
- 基础 LSP server
- `--error-format=llm` 结构化错误输出

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

# 运行编译器单元测试（80 tests，自动先编译）
cd compiler && npm test

# 仅 TypeScript 类型检查（不编译输出）
cd compiler && npm run typecheck

# 机械 lint 检查（tsc strict + as any/ts-ignore/console.log 扫描）
cd compiler && npm run lint

# 调试模式（打印中间 AST/HIR/JS）
node compiler/dist/cli.js run --debug examples/hello.ring
```
