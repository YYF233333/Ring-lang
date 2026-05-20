# Ring-lang 自举路线图

> 2026-05-20。统一的自举迁移计划，覆盖准备、执行、收尾、推迟特性四个阶段。
> 替代原 `bootstrap-plan.md` 和 `phase2-vision.md`。

## 总览

将 TS 编译器逐模块翻译为 Ring。Ring→JS 和 TS→JS 同运行时（V8），可逐模块替换、边翻译边验证。LSP 暂不迁移（保留 TS 版本）。

**语言特性差距分析结论**：Ring 现有特性已足以翻译整个编译器，无需新增语言特性。所有差距为翻译模式（class→struct+impl, try-catch→fail effect 等）。

**总计估算**：~8-12 天（Batch 1-4） + 收尾验证。

---

## Part I: 自举前准备

### 1. TS 编译器保留

翻译期间保留完整 TS 编译器作为参考实现。每个 batch 翻译完后，对所有 E2E 用例分别用 TS 编译器和 Ring 编译器编译，diff JS 输出——必须完全一致。翻译全部完成并通过 fixed point 验证后，TS 编译器归档。

### 2. extern fn 补充

编译器依赖的 Node.js API 需要在 Ring 侧声明 extern fn：

| 分类 | 需要声明的函数 |
|------|--------------|
| 文件 I/O | `read_file(path: Str) -> Str`, `write_file(path: Str, content: Str)`, `file_exists(path: Str) -> Bool` |
| Path | `path_resolve(path: Str) -> Str`, `path_join(a: Str, b: Str) -> Str`, `path_dirname(path: Str) -> Str` |
| Process | `argv() -> List<Str>`, `exit(code: Int)`, `cwd() -> Str` |
| Child process | `exec_sync(cmd: Str) -> Str` |

### 3. 翻译模式手册

全程一致的 TS→Ring 映射规则：

| TypeScript 模式 | Ring 等价物 |
|----------------|------------|
| `class X { field; method() {} }` | `struct X { field: T }` + `impl X { fn method(var self) {} }` |
| `interface X { field: T }` (数据) | `struct X { field: T }` 或 enum 命名字段 |
| `interface X { method(): T }` (行为) | `trait X { fn method(self) -> T }` |
| `type X = A \| B \| C` (union) | `enum X { A(...), B(...), C(...) }` |
| `type X = "a" \| "b"` (string union) | `enum X { A, B }` |
| `try { ... } catch(e) { ... }` | `handle { ... } catch ErrorType fn(e) { ... }` 或 `expr or default` |
| `x?.field` / `x ?? default` | `x.map(fn(v) { v.field })` / `x.unwrap_or(default)` |
| `x as Type` | `match x { Type(v) => v }` 或 `if let Type(v) = x { ... }` |
| `switch(x.kind) { case "a": ... }` | `match x { A(...) => ... }` |
| `arr.push(x)` | `list.push(x)` (var self) |
| `map.get(k) ?? default` | `map.get(k).unwrap_or(default)` |
| `throw new Error(msg)` | `raise(Error { msg })` (fail effect) |
| `obj.field !== undefined` | `match obj.field { Some(v) => ..., None => ... }` |

### 4. 增量替换管线

每个 batch 的工作流：

```
1. 翻译 batch 内 .ts → .ring
2. ring build compiler/ring/main.ring --out-dir=compiler/dist  用 TS 编译器编译 Ring 源码
3. Ring 编译的 .js 直接替换 compiler/dist/ 中对应的 tsc 输出（ESM 接口兼容）
4. npm test 验证全部 E2E 通过
5. 进入下一个 batch
```

---

## Part II: 自举执行

### Batch 1: 数据定义（~1 天，可并行 3 个 session）

| 文件 | ~行数 | 翻译要点 |
|------|-------|----------|
| `types/index.ts` | 200 | type union → enum Type / Effect / EffectRow |
| `ast/index.ts` | 300 | interfaces → enum AST 节点（命名字段） |
| `hir/index.ts` | 400 | interfaces → enum HIR 节点 + 共享约定函数 |
| `errors.ts` | 100 | CompileError class → struct + fail effect |
| `diagnostics/codes.ts` | 80 | 错误码常量 |

**风险**：低。纯数据定义，无复杂逻辑。
**验证**：类型定义无直接输出，验证方式为后续 batch 编译通过。

### Batch 2: 基础设施（~1-2 天，可与 Batch 1 部分并行）

| 文件 | ~行数 | 翻译要点 |
|------|-------|----------|
| `parser/lexer.ts` | 500 | 字符状态机，纯函数式，直接翻译 |
| `diagnostics/index.ts` | 150 | DiagnosticSink interface → trait |
| `diagnostics/formatter.ts` | 200 | format_human / format_llm 纯函数 |
| `codegen/runtime.ts` | 300 | JS 运行时字符串模板生成 |

**风险**：低-中。Lexer 是最大文件，但逻辑简单（字符匹配 + token 产出）。
**验证**：Lexer 可通过 token stream 对比验证。

### Batch 3: 核心算法（~3-5 天，严格串行，最高风险）

| 文件 | ~行数 | 翻译要点 |
|------|-------|----------|
| `checker/env.ts` | 400 | TypeEnv class → struct + impl + var self |
| `checker/builtins.ts` | 300 | 内置类型/trait 注册 |
| `checker/unify.ts` | 500 | HM unification + row unification（**最高风险**） |
| `checker/infer-ctx.ts` | 200 | InferCtx interface → trait |
| `checker/infer.ts` | 200 | InferEngine 薄壳 + 调度 |
| `checker/infer-register.ts` | 400 | Pass 1 声明注册 |
| `checker/infer-expr.ts` | 800 | 19 个表达式推断函数（**最大文件**） |
| `checker/infer-modules.ts` | 150 | 多模块支持 |
| `checker/exhaustive.ts` | 200 | 穷尽性检查（Maranget 风格） |
| `checker/derive.ts` | 200 | Auto-derive fixpoint pass |
| `checker/zonk.ts` | 150 | Substitution application |
| `checker/checker.ts` | 300 | 主入口 check(Program) → HProgram |

**风险**：高。unify.ts 和 infer-expr.ts 是核心算法，任何翻译错误会导致类型推断结果偏差。
**串行原因**：checker 内部模块强耦合，env→unify→infer 有严格依赖链。
**验证**：每个文件翻译后立即做全量 E2E diff，不要累积到 batch 结束。

### Batch 4: 输出 + 前端（~1-2 天）

| 文件 | ~行数 | 翻译要点 |
|------|-------|----------|
| `codegen/codegen-ctx.ts` | 100 | CodegenCtx interface → trait |
| `codegen/codegen.ts` | 100 | CodeGenerator 薄壳 |
| `codegen/codegen-decl.ts` | 400 | 声明 codegen（fn/struct/enum/impl/trait/effect） |
| `codegen/codegen-stmt.ts` | 400 | 语句 codegen + match pattern |
| `codegen/codegen-expr.ts` | 400 | 表达式 codegen |
| `parser/parser-ctx.ts` | 50 | ParserCtx + Prec 枚举 |
| `parser/parser.ts` | 200 | Parser 薄壳 |
| `parser/parser-decl.ts` | 500 | 声明解析 |
| `parser/parser-expr.ts` | 600 | Pratt 表达式解析 |
| `cli.ts` | 150 | CLI 入口（ring build/run/check） |

**风险**：中。Codegen 和 Parser 逻辑量大但模式重复（每个 AST/HIR 节点一个 case）。
**验证**：全量 E2E diff + E2E 测试。

---

## Part III: 自举收尾

### 3.1 自编译验证（Fixed Point）

```
Step 1: TS 编译器编译 Ring 源码 → JS 编译器 v1
Step 2: JS 编译器 v1 编译 Ring 源码 → JS 编译器 v2
Step 3: diff v1 v2 → 必须 byte-identical
```

如果不一致，说明翻译存在语义偏差（TS 编译器和 Ring 编译器对同一源码产出不同 JS）。定位偏差点、修复，重复直到收敛。

### 3.2 TS 编译器退休

- 打 git tag `ts-compiler-final` 归档 TS 源码
- 编译器主干切换到 Ring 源码
- LSP 暂时保留 TS 版本（独立运行，不影响自举里程碑）
- 更新 CLAUDE.md、design.md、package.json 等项目配置

### 3.3 测试迁移

- **E2E 用例（`.ring` 文件）**：不变，继续使用
- **E2E 运行器（`e2e.test.ts`）**：暂保留 TS，后续可迁移
- **单元测试（`checker.test.ts` 等）**：随 TS 代码归档，不迁移（自举后直接在 Ring 层写新测试）

### 3.4 完成标准

- [ ] Batch 1-4 所有文件翻译完成
- [ ] 全部 E2E 测试通过（Ring 编译器运行）
- [ ] Fixed point 验证通过（v1 = v2）
- [ ] TS 编译器归档
- [ ] 文档同步更新

---

## Part IV: 推迟特性

自举期间明确不用，自举后按优先级推进：

### 高优先级（自举后立即可做）

| 特性 | 价值 |
|------|------|
| Refinement types | 飞轮起点——编译期验证更多正确性，LLM 并行可信度↑ |
| Linear types（自动推断） | 性能优化基础，Perceus RC 前置条件 |
| `mut<S>` 参数化 effect | mut effect 精确到具体 state，soundness 提升 |

### 中优先级

| 特性 | 价值 |
|------|------|
| Full algebraic effects | post-resume handler，需 delimited continuation |
| Module signatures | first-class modules，大型项目组织 |
| 关联类型 + supertrait | trait 系统完善 |
| `dyn Trait` 动态分发 | 运行时多态 |

### 低优先级

| 特性 | 价值 |
|------|------|
| LLVM native backend | 性能跃迁，依赖 linear types + Perceus |
| Dependent types lite | 类型级编程 |
| `async` / `spawn` / `Future` | 并发模型 |
| Formatter + 自动标注等级 | 代码质量工具链 |

---

## 附录：语言特性差距分析

### 已确认兼容（无需改动）

- Discriminated unions → Ring enum ✓
- Generics + trait bounds → Ring 泛型 ✓
- Map/Set/List 操作 → Ring 内置方法 ✓
- String 方法 → Ring Str 16 个方法 ✓
- File I/O → Ring runtime built-in ✓
- HOF (map/filter/find) → Ring List 方法 ✓
- 正则表达式 → 编译器未使用 ✓
- async/await → 编译器逻辑未使用（仅 LSP 异步，暂不迁移） ✓

### 需要翻译模式转换（无需新语言特性）

- 3 个 class → struct + impl + var self
- 40+ interface (data) → struct / enum 命名字段
- 5+ interface (behavior) → trait
- 10+ try-catch → fail effect + handle/catch
- 27 处 `?.` → Option 方法
- 392 处 `??` → `unwrap_or()` / `or`
- 124 处 `as Type` → match / if-let
