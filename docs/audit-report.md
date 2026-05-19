# 自举 Blocker 审计报告

审计时间：2026-05-20  
审计方式：Claude Opus + DS V4 Pro 并行独立审计，合并去重  
审计范围：编译器全部源码 vs Ring-lang 当前能力，识别自举阻塞项

---

## Critical — 必须修复才能开始自举

### B1: ✅ 递归 enum 类型不工作
- **来源**: DS C1（已验证）
- **文件**: `compiler/src/checker/infer-register.ts:95-127`
- **描述**: `register_enum` 在处理 variant 字段时，enum 名字尚未注入类型环境。`enum Expr { BinOp { left: Expr, right: Expr } }` 编译报 `E0204: Unknown type: Expr`。编译器 AST/Type/HIR 全部是递归类型，没有这个特性无法定义任何数据结构。
- **验证**: `tests/cases/recursive_enum_test.ring` 编译失败
- **修复**: 在 `register_enum` 开头先注册 enum 占位类型到 `ctx.env.enums`，再解析 variant 字段，最后更新完整定义。类似于 C 编译器处理 forward declaration。

### B2: ✅ 无文件 I/O / OS API
- **来源**: Claude C8 + DS C2+C3
- **文件**: `compiler/src/cli.ts:3-5`, `compiler/src/modules/resolver.ts:5-6`, `compiler/src/checker/checker.ts:1-3`
- **描述**: 编译器需要 `fs.readFileSync`/`writeFileSync`/`existsSync`、`path.resolve`/`join`/`dirname`/`basename`、`process.argv`/`exit`/`stderr.write`。Ring 目前无法访问任何 OS API。
- **修复**: 新增 `std/fs.ring`、`std/path.ring`、`std/process.ring`，通过 `extern fn` 包装 Node.js API。runtime.ts 注入对应 JS 全局函数。

### B3: ✅ `extern fn` 无法映射 Node.js 模块函数
- **来源**: DS C2
- **文件**: `compiler/src/codegen/codegen-decl.ts`（extern fn codegen）
- **描述**: `extern fn read_file(path: Str) -> Str` 假设 JS 全局存在 `read_file` 函数，但实际需要 `require('fs').readFileSync(path, 'utf8')`。当前 extern fn codegen 不生成任何代码（单文件模式），只生成 `const module$name = name` 别名（多文件模式）。
- **修复**: 在 runtime.ts 中注入 wrapper 函数（如 `function read_file(p) { return require('fs').readFileSync(p, 'utf8'); }`），extern fn 映射到这些 wrapper。

### B4: ✅ 缺少关键集合方法
- **来源**: DS C7 + Claude N1 + Claude I4
- **缺失方法**:
  - `List<T>`: `join(sep)`, `sort()`, `shift()`, `find_index(f)`, `index_of(item)`
  - `Map<K,V>`: `clone()`
  - `Str`: 无缺失（16 个方法基本够用）
- **使用场景**: BFS 用 `shift`（模块解析器），effect name 排序用 `sort`，字符串拼接用 `join`，unification 用 `map_clone`
- **修复**: 在 std/list.ring + std/map.ring 添加 extern fn，runtime.ts 添加对应 JS 函数

---

## Important — 显著增加自举复杂度

### I1: ✅ 无 struct update 语法（object spread）
- **来源**: Claude I3 + DS C5
- **文件**: `compiler/src/checker/zonk.ts:41-58`, `compiler/src/checker/unify.ts:46-105` 等
- **描述**: 编译器大量使用 `{ ...type, params: newParams }` 模式做浅克隆+修改。zonk、apply、unify 每次递归都用。Ring 无此语法，需手动列出所有字段重建 struct。估计 2000+ 行额外代码。
- **修复**: 实现 `MyStruct { ..existing, field: new_val }` 语法（JS 风格，`..base` 在开头）。支持 struct 和 enum 命名变体。全管线：Parser 解析 `..expr` → Checker 类型统一 + 跳过缺字段检查 → Codegen 生成 `new Struct(base.f1, override_f2)` / IIFE 包装复杂表达式 → Zonk/LSP 全部支持。

### I2: ✅ 无 mutable self 方法
- **来源**: Claude C1
- **文件**: 所有使用 class 的文件（TypeEnv, Parser, Lexer, CodeGenerator, InferEngine 等 9 个 class）
- **描述**: 编译器 9 个核心 class 都通过 `this.field = value` 累积可变状态。Ring 的 `impl` 方法接收 `self` 按值传递，无法修改 struct 字段。
- **修复**: 实现通用 `var` 参数支持。`fn method(var self)` 允许方法内修改 struct 字段。同时修复了 field assignment 对 `let` 绑定的缺失检查（`p.field = x` 现在正确报 E0205）。

### I3: ❌ ~~无 `?.` 可选链运算符~~ — 设计评审后移除
- **来源**: Claude I5 + DS I1
- **决策**: `?.` 违反设计哲学——`?` 已定义为 Option→fail 提升（§1.5），`?.` 给 `?` 附加第二层语义（Option map），违反"一种事一种写法"原则。且 `?.` 创建平行于 UFCS 的链式机制，与"`.method()` 是唯一链式调用方式"冲突。
- **正确方案**: 补 Option\<T\> 方法（map/and_then/is_some/unwrap_or），走 UFCS 路线。对应设计评审 P2-2，另有 session 处理。

### I4: ✅ 所有 optional field 需改为 `Option<T>`
- **来源**: Claude C7 + DS I6
- **文件**: AST/HIR/Type 中数百个 `field?: Type` 字段
- **描述**: TS 的 `foo?: Bar` 需全部改为 Ring 的 `foo: Option<Bar>`。机械替换但量大。构造时需显式 `some(x)` / `none`。
- **修复**: 实现 `field?: Type` 语法糖。Parser 在字段名后检测 `?` token → AST `is_optional` 标记 → register 阶段脱糖为 `Option<Type>` → 构造时可省略（checker 自动填充 `none` HIR 节点）。struct 和 enum 命名变体均支持。

### I5: class 继承（extends Error）需重构为 enum + effect
- **来源**: Claude C2 + DS I3
- **文件**: `compiler/src/errors.ts:3,16`, `compiler/src/checker/unify.ts:197`
- **描述**: `CompileError extends Error` 和 `UnificationError extends Error` 用 `instanceof` 做类型判别。Ring 无继承。
- **Workaround**: 定义 `enum CompilerError { compile(...), unification(...) }` + `fail<CompilerError>` effect。实际上更符合 Ring 设计哲学。
- **修复**: 不需要语言改动，用 Ring 现有特性即可

### I6: 无 async/await（LSP 动态加载）
- **来源**: Claude I9 + DS N4
- **文件**: `compiler/src/cli.ts:56,67`
- **描述**: 仅 `main()` 用 `async` + `await import("./lsp/server.js")`。核心编译管线完全同步。
- **Workaround**: 静态导入 LSP 模块（增加少量启动时间）
- **修复**: 不阻塞核心编译器自举

---

## Nice-to-have — 不阻塞但改善体验

### N1: 无正则表达式
- **来源**: Claude I2
- **文件**: 3 处使用（cli.ts 路径替换, codegen-expr.ts 字符串转义, LSP completion）
- **Workaround**: 全部可用 `Str.replace` / `Str.ends_with` + `Str.slice` 替代

### N2: 无 ternary 运算符
- **来源**: Claude N4
- **Workaround**: Ring 的 `if cond { a } else { b }` 已是表达式

### N3: 无 string `+` 拼接
- **来源**: Claude N5
- **Workaround**: 使用字符串插值 `"${a}${b}"`

### N4: JSON parse
- **来源**: DS C4
- **描述**: 编译器自身不需要 JSON 反序列化，仅 `--debug` 模式用 `JSON.stringify`
- **Workaround**: `extern fn` 包装

### N5: `typeof` / `instanceof` 类型检查
- **来源**: Claude I7+I8
- **Workaround**: 替换为 enum pattern matching（更好）

---

## 已确认的非问题（两份报告中的 false positive）

| 项目 | 说明 |
|------|------|
| discriminated unions | Ring enum 命名字段（Batch 7）已支持，可表达 AST/Type/HIR |
| heterogeneous union (`string \| Expr`) | 用 wrapper enum（如 `enum InterpPart { text(Str), expr(Expr) }`）解决 |
| interface | 数据用 struct，行为用 trait（含默认方法） |
| `switch` + `assertNever` | Ring `match` 穷尽性检查更好 |
| `Array.map/filter/fold` | Ring `List.map/filter/fold` 已有 |
| `for...of` | Ring `for x in iterable` 已有 |
| `??` 空值合并 | Ring `or` 运算符等价 |
| closure capture | Ring lambda 编译为 JS closure |

---

## 建议实施顺序

### Phase A: 语言修复（预估 2-3 session）
1. **B1: 递归 enum** — 修改 `register_enum` 注入占位类型。预计 1-2 小时。
2. **B2+B3: OS API + extern fn runtime 注入** — 新增 std/fs.ring、std/path.ring、std/process.ring + runtime wrapper。预计 3-4 小时。
3. **B4: 缺失集合方法** — join/sort/shift/find_index/clone。预计 2 小时。

### Phase B: 工效特性（预估 3-5 session）
4. **I1: struct update 语法** — `{ ..existing, field: new }` 全管线。预计 6-8 小时。
5. **I2: mutable self** — `impl` 方法 `var self` 支持。预计 6-10 小时。
6. **I4: optional field 语法糖** — `field?: Type` 脱糖。预计 2-4 小时。
7. **I3: `?.` 可选链** — Option 链式语法糖。预计 4-6 小时。

### Phase C: 编译器逐模块重写（预估 10-15 session）
8. types/index.ts → Ring enum
9. ast/index.ts → Ring enum
10. errors + diagnostics → Ring enum + fail effect
11. parser (Lexer + Parser) → Ring struct + impl
12. checker (env + unify + infer) → Ring struct + impl
13. codegen → Ring struct + impl
14. modules → Ring
15. CLI → Ring

---

## 统计

| 类别 | 数量 |
|------|------|
| Critical | 4 (B1-B4) |
| Important | 6 (I1-I6) |
| Nice-to-have | 5 (N1-N5) |
| False positive | 8 |
| **总计** | 23 |
