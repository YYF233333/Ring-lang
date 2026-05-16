# Phase 1 编译器设计文档

## 目标

实现 Ring-lang Phase 1 编译器，能够编译并运行 `examples/effects.ring`。

Phase 1 交付物：`ring run examples/effects.ring` 输出正确结果。

## 架构

```
源码 (.ring)
     │
     ▼
┌──────────┐
│  Parser  │  源码 → AST（未类型化）
└────┬─────┘
     ▼
┌──────────┐
│ Checker  │  AST → HIR（带完整类型 + effect 标注）
└────┬─────┘
     ▼
┌──────────┐      ┌──────────────┐
│ Codegen  │  →   │ JavaScript   │  → V8 执行
└──────────┘      └──────────────┘
```

HIR 是独立数据结构（非 AST 装饰），为后续优化 pass 预留插入点：

```
Phase 2+: HIR → [Optimizer passes] → Optimized HIR → Codegen
```

## 目录结构

```
compiler/src/
├── ast/           AST 节点类型定义
│   └── index.ts
├── types/         Type、Effect 表示 + 工具函数
│   └── index.ts
├── hir/           HIR 节点类型定义
│   └── index.ts
├── parser/        Lexer + 递归下降 Parser
│   ├── lexer.ts
│   ├── parser.ts
│   └── parser.test.ts
├── checker/       类型推断 + effect 推断 + AST→HIR
│   ├── infer.ts        HM Algorithm W
│   ├── effects.ts      effect 推断
│   ├── resolver.ts     名称解析 + impl 方法解析
│   ├── exhaustive.ts   pattern match 穷尽性检查
│   ├── lower.ts        AST → HIR 降级
│   └── checker.test.ts
├── codegen/       HIR → JavaScript
│   ├── codegen.ts
│   ├── runtime.ts      嵌入式 runtime 代码
│   └── codegen.test.ts
└── cli.ts         ring build / ring run 入口
```

## 核心数据结构

### AST 节点

```typescript
// 所有节点带 span 位置信息
interface Span { start: number; end: number; line: number; col: number }

// === 表达式 ===
type Expr =
  | { kind: "int_lit"; value: number; span: Span }
  | { kind: "float_lit"; value: number; span: Span }
  | { kind: "str_lit"; value: string; span: Span }
  | { kind: "bool_lit"; value: boolean; span: Span }
  | { kind: "ident"; name: string; span: Span }
  | { kind: "bin_op"; op: BinOp; left: Expr; right: Expr; span: Span }
  | { kind: "unary_op"; op: UnaryOp; operand: Expr; span: Span }
  | { kind: "call"; callee: Expr; args: Expr[]; span: Span }
  | { kind: "method_call"; object: Expr; method: string; args: Expr[]; span: Span }
  | { kind: "field_access"; object: Expr; field: string; span: Span }
  | { kind: "struct_lit"; name: string; fields: { name: string; value: Expr }[]; span: Span }
  | { kind: "match"; subject: Expr; arms: MatchArm[]; span: Span }
  | { kind: "block"; stmts: Stmt[]; expr?: Expr; span: Span }
  | { kind: "if"; condition: Expr; then: Expr; else_?: Expr; span: Span }
  | { kind: "string_interp"; parts: (string | Expr)[]; span: Span }
  | { kind: "or"; left: Expr; right: Expr; span: Span }
  | { kind: "catch"; expr: Expr; handler: Expr; span: Span }
  | { kind: "handle"; body: Expr; handlers: Handler[]; span: Span }
  | { kind: "lambda"; params: Param[]; body: Expr; span: Span }

type BinOp = "+" | "-" | "*" | "/" | "%" | "==" | "!=" | "<" | ">" | "<=" | ">=" | "&&" | "||"
type UnaryOp = "-" | "!"

interface MatchArm { pattern: Pattern; body: Expr }
interface Handler { effect: string; op?: string; params: string[]; body: Expr }
interface Param { name: string; type_ann?: TypeExpr }

// === Pattern ===
type Pattern =
  | { kind: "wildcard" }
  | { kind: "binding"; name: string }
  | { kind: "constructor"; name: string; fields: Pattern[] }
  | { kind: "literal"; value: Expr }

// === 语句 ===
type Stmt =
  | { kind: "let"; name: string; type_ann?: TypeExpr; value: Expr; span: Span }
  | { kind: "var"; name: string; type_ann?: TypeExpr; value: Expr; span: Span }
  | { kind: "assign"; target: Expr; value: Expr; span: Span }
  | { kind: "expr"; expr: Expr; span: Span }
  | { kind: "return"; value?: Expr; span: Span }

// === 声明 ===
type Decl =
  | { kind: "fn"; name: string; params: Param[]; ret_type?: TypeExpr; body: Expr; pub: boolean; span: Span }
  | { kind: "struct"; name: string; fields: StructField[]; span: Span }
  | { kind: "enum"; name: string; variants: EnumVariant[]; span: Span }
  | { kind: "impl"; target: string; methods: Decl[]; span: Span }
  | { kind: "effect"; name: string; operations: EffectOp[]; span: Span }
  | { kind: "test"; name: string; body: Expr; span: Span }

interface StructField { name: string; type_ann: TypeExpr; refinement?: Expr; pub: boolean }
interface EnumVariant { name: string; fields: { name: string; type_ann: TypeExpr }[] }
interface EffectOp { name: string; params: Param[]; ret_type: TypeExpr }

// === 类型表达式（源码中的类型标注）===
type TypeExpr =
  | { kind: "named"; name: string; args?: TypeExpr[] }
  | { kind: "fn"; params: TypeExpr[]; ret: TypeExpr }
  | { kind: "option"; inner: TypeExpr }  // T?
```

### Type 内部表示

```typescript
type Type =
  | { kind: "int" }
  | { kind: "float" }
  | { kind: "str" }
  | { kind: "bool" }
  | { kind: "unit" }
  | { kind: "never" }
  | { kind: "var"; id: number }                          // 类型变量（unification 用）
  | { kind: "fn"; params: Type[]; ret: Type; effects: EffectRow }
  | { kind: "struct"; name: string; fields: Map<string, Type> }
  | { kind: "enum"; name: string; variants: Map<string, Type[]> }
  | { kind: "generic"; name: string; args: Type[] }
  | { kind: "option"; inner: Type }

// Effect 行类型 — 类似 row polymorphism
interface EffectRow {
  effects: Effect[];
  tail?: number;  // effect 行变量 ID（开放行）
}

type Effect =
  | { kind: "io" }
  | { kind: "fail"; error: Type }
```

### HIR 节点

HIR 与 AST 结构对应，但每个表达式节点额外携带：

```typescript
interface HExpr {
  // ...与 AST Expr 相似的 kind + 字段
  type: Type;           // 推断完成的类型
  effects: EffectRow;   // 此表达式涉及的 effect
}
```

HIR 中的语法糖已展开：
- `or` → try/catch 语义结构
- `method_call` → 解析后的函数调用（附 impl 解析信息）
- 类型变量已全部替换为具体类型

## 模块职责

### Parser

**职责**：源码字符串 → AST + 诊断

**实现**：
- Lexer：手写，产出 Token 流（含位置）
- Parser：递归下降，Pratt parsing 处理运算符优先级

**Phase 1 语法覆盖**：
- 关键字：`fn`, `let`, `var`, `struct`, `enum`, `match`, `impl`, `effect`, `handle`, `with`, `if`, `else`, `or`, `catch`, `test`, `return`, `for`, `in`, `pub`
- 字面量：整数、浮点、字符串（含 `${}` 插值）、布尔
- 运算符：算术 + 比较 + 逻辑
- 方法调用：`x.method(args)`
- Pattern matching：字面量、构造器、通配符 `_`、变量绑定
- Refinement `where` 子句：解析并存储（checker 不验证）
- 注释：`//` 行注释

**不含**：trait 声明、泛型参数/约束、模块语法、async/spawn/await

### Checker

**职责**：AST → HIR（类型推断 + effect 推断 + 降级）

**子模块**：

1. **resolver.ts** — 名称解析
   - 建立作用域链
   - 解析 struct/enum/fn/impl 声明
   - 解析 `.method()` 到对应 impl 函数

2. **infer.ts** — HM 类型推断
   - Algorithm W 变体（含 let-polymorphism）
   - Unification + occurs check
   - 产出 substitution map

3. **effects.ts** — Effect 推断
   - 分析函数体中的 effect 操作调用
   - effect 行 unification
   - Phase 1 只追踪 `fail<E>` + `io`

4. **exhaustive.ts** — 穷尽性检查
   - enum match 必须覆盖所有 variant
   - 有 `_` 通配符时自动穷尽

5. **lower.ts** — AST → HIR 降级
   - 将推断结果附加到节点
   - 展开 `or` 为 try/catch 语义
   - 解析所有类型变量

**Phase 1 不含**：trait 约束求解、row polymorphism、refinement 验证、effect 多态

### Codegen

**职责**：HIR → JavaScript 源码

**翻译规则**：

| Ring-lang | JavaScript |
|-----------|-----------|
| `struct Point { x, y }` | `class Point { constructor(x, y) { this.x = x; this.y = y; } }` |
| `enum Shape { circle(r), rect(w,h) }` | 工厂函数 `Shape_circle(r) => ({_tag:"circle",r})` |
| `match expr { ... }` | `switch`（on `_tag`）/ `if` 链 |
| `let x = ...` | `const x = ...` |
| `var x = ...` | `let x = ...` |
| `fn foo(a, b) { ... }` | `function foo(a, b) { ... }` |
| `x.method(y)` | 解析后直接调用目标函数 |
| `or` (HIR 中已展开) | `try { ... } catch { ... }` |
| `catch fn(e) {...}` | `try { ... } catch(e) { ... }` |
| `handle {...} with {...}` | generator function + `__run_handler()` |
| `"hello ${name}"` | `` `hello ${name}` `` |
| `effect` 操作调用 | `yield { effect: "name", op: "op", args: [...] }` |

**Runtime 辅助函数（嵌入生成的 JS 头部）**：
- `__run_handler(gen, handlers)` — 驱动 generator，截获 yield 的 effect
- `__match_fail(value)` — 非穷尽 match 运行时 panic
- `print(...)` — `console.log` 包装

### CLI

**职责**：命令行入口

- `ring build <file>` — 编译为 `.js`
- `ring run <file>` — 编译 + 执行
- `ring check <file>` — 类型检查但不生成代码
- 错误报告：带源码位置的友好诊断

## Phase 1 Effect 系统实现策略

### 简化模型

Phase 1 只处理两种 effect：

1. **`fail<E>`** — 可失败操作
   - 语义：函数可能通过 `raise(e)` 抛出错误
   - JS 编码：`throw` / `try-catch`
   - 90% 场景特化为普通 try/catch，零 generator 开销

2. **`io`** — IO 操作
   - 语义：标记函数执行了 IO
   - JS 编码：直接调用（无额外代码），纯标记用

### Effect Handler 编码

**简单场景（fail only）**— 直接 try/catch：
```javascript
// handle { load_config(path) } with { fail(e) => default_config() }
try { load_config(path) } catch (e) { default_config() }
```

**复杂场景（io mock 等）**— generator + runner：
```javascript
// handle { body } with { io.read(path) => mock_data }
function* __effectful() {
  const raw = yield { effect: "io", op: "read", args: [path] };
  return toml_parse(raw);
}
__run_handler(__effectful(), {
  "io.read": (_path) => mock_data,
});
```

### 推断规则

- 调用了 `io.xxx()` 的函数自动带 `io` effect
- 调用了可能 raise 的函数自动带 `fail<E>` effect
- `or` / `catch` / `handle` 捕获 effect（从函数签名中消除）
- Effect 行用 unification 合并

## 测试策略

### 单元测试

每模块独立 `*.test.ts`，使用 `node:test`：

- **Parser 测试**：源码片段 → 断言 AST 结构
- **Checker 测试**：AST 片段 → 断言推断类型 + effect + 错误
- **Codegen 测试**：HIR 片段 → 断言生成的 JS

### 端到端测试

```
tests/
├── cases/
│   ├── basic_struct.ring     → basic_struct.expected.js
│   ├── enum_match.ring       → enum_match.expected.js
│   ├── type_infer.ring       → type_infer.expected.js
│   ├── fail_or.ring          → fail_or.expected.js
│   └── effect_handler.ring   → effect_handler.expected.js
└── run.ts                    编译 + 执行 + 断言输出
```

### 通过标志

`ring run examples/effects.ring` 正确执行并输出预期结果 = Phase 1 完成。

## 实现顺序（并行策略）

```
Step 1: ast/ + types/ + hir/ (共享类型定义)
        │
        ├─────────────────────────┐
        ▼                         ▼
Step 2: parser/              codegen/ (用 mock HIR 测试)
        │                         │
        ▼                         │
Step 3: checker/                  │
        │                         │
        ▼                         ▼
Step 4: 集成 (parser → checker → codegen)
        │
        ▼
Step 5: effects.ring 端到端通过 ✓
```

**并行窗口**：Step 2 中 Parser 和 Codegen 完全并行。Checker 只需等 AST 类型定义（Step 1），不需要等 Parser 实现完成。

## 内置函数与标准库 Stub

Phase 1 不实现标准库模块系统。`effects.ring` 中使用的外部函数作为编译器内置处理：

| 函数 | Phase 1 行为 |
|------|-------------|
| `print(...)` | 内置，编译为 `console.log(...)` |
| `assert(cond)` | 内置，编译为 `if (!cond) throw new Error("assertion failed")` |
| `io.read(path)` | effect 操作，生成 yield/throw |
| `toml.parse(raw)` | 假设为普通函数调用，可 raise `fail`。Phase 1 中 checker 视为 `extern fn(Str) -> Map<Str, Any> with {fail<ParseError>}` |
| `exit(code)` | 内置，编译为 `process.exit(code)` |

这些内置函数在 checker 中有预定义的类型签名，不需要用户声明。

## 设计决策记录

| 决策 | 选择 | 理由 |
|------|------|------|
| 注释语法 | `//` | LLM 更熟悉，与 Rust/JS 一致 |
| Pipe 运算符 | 移除 | UFCS `.method()` 已提供等价语法，"一种事一种写法" |
| HIR 独立结构 | 是 | 为后续优化 pass 预留插入点 |
| Phase 1 Effect 范围 | `fail<E>` + `io` only | 足够跑 effects.ring，不含 mut/async |
| Refinement where | 解析但不验证 | Phase 1 存储语法，不实现编译期证明 |
| 测试框架 | node:test | 零依赖，package.json 已配置 |
| Effect handler 编码 | generator + 特化 | 简单 fail 用 try/catch，复杂场景用 generator |
| 开发模式 | Agent 并行 | 定义接口后多 Agent 同时实现各模块 |
