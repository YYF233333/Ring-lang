# Ring-lang 自举路线图

> 2026-05-20。统一的自举迁移计划，覆盖准备、执行、收尾、推迟特性四个阶段。
> 替代原 `bootstrap-plan.md` 和 `phase2-vision.md`。

## 总览

将 TS 编译器逐模块翻译为 Ring。需翻译的源文件共 ~13,340 行（30 个文件），LSP 相关代码 ~1,600 行暂不迁移。Ring→JS 和 TS→JS 同运行时（V8），可逐模块替换、边翻译边验证。

**语言特性差距分析结论**：Ring 现有特性已足以翻译整个编译器，无需新增语言特性。所有差距为翻译模式（class→struct+impl, try-catch→fail effect 等）。

**总计估算**：~9-12 天（Batch 1-5） + 收尾验证。

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

### Batch 1: 数据定义 ✅ 已完成

5 个 Ring 源文件（`compiler/ring/`）+ 1 个 smoke test：

| Ring 文件 | 行数 | TS 原文件 | 状态 |
|-----------|------|-----------|------|
| `types.ring` | 467 | `types/index.ts` (471) | ✅ |
| `ast.ring` | 272 | `ast/index.ts` (644) | ✅ |
| `hir.ring` | 214 | `hir/index.ts` (559) | ✅ |
| `codes.ring` | 55 | `diagnostics/codes.ts` (74) | ✅ |
| `builtin_methods.ring` | 35 | `builtin-methods.ts` (30) | ✅ |
| `main.ring` | 33 | （集成 smoke test） | ✅ |

`errors.ts` (18 行) 不翻译：`assertNever` 在 Ring 中无需（穷尽匹配内置），`CompileError` 移至 Batch 2（依赖 Diagnostic）。

**翻译中发现并修复的编译器问题**：
1. **两阶段类型注册**（`infer-register.ts`）— 互递归枚举（Type↔Effect）需先注册所有名称再解析字段
2. **trait_dict_name 命名冲突**（`hir/index.ts` + 5 文件）— `Type_Trait` 与 `Enum_Variant` 同名，改为 `__Type_Trait` 前缀
3. **元组模式 `(none, none)` codegen bug**（`types.ring`）— 用通配符 `_` 绕行

**翻译模式补充**：
- 模块级常量 → 零参函数：`pub fn BUILTIN_INT() -> Str { "Int" }`
- `type` 字段 → `ty`（Ring 关键字）
- 空列表字面量 `[]` 类型推断有限 → 用 `fn empty_xxx() -> List<Xxx> { [] }` 辅助函数
- `(T, T)?` 不支持 → 用 `Option<(T, T)>` 显式泛型

### Batch 2: 诊断 + 词法分析 ✅ 已完成

3 个 Ring 源文件（`compiler/ring/`）：

| Ring 文件 | 行数 | TS 原文件 | 状态 |
|-----------|------|-----------|------|
| `diagnostics.ring` | 170 | `diagnostics/index.ts` (81) | ✅ |
| `formatter.ring` | 199 | `diagnostics/formatter.ts` (94) | ✅ |
| `lexer.ring` | 477 | `parser/lexer.ts` (509) | ✅ |
| `main.ring` | 102 | （集成 smoke test，已更新） | ✅ |

**翻译模式补充**：
- `effect` 字段名 → `eff`（Ring 关键字冲突，同 `type` → `ty` 模式）
- TS 枚举 `TokenKind` → Ring enum 用 `Tk` 前缀避免关键字冲突（`TkFn`, `TkLet` 等）
- `List.set(index, value)` 不可用 → pop/push 操作最后一个元素（string interpolation brace depth tracking）
- DiagnosticSink trait 保留定义但用 CollectingSink 具体类型（无 `dyn Trait` 支持）
- 空列表推断限制扩展确认：即使 `let x: List<T> = []` 带类型标注也无法推断，必须用 `[dummy].clear()` 模式
- 字符范围比较（`ch >= "a"`）→ `char_code_at` + 整数比较（避免 Str 上 Ord trait 依赖）
- `let x = expr \n next_expr` 行分隔歧义 → 用 if-else 或辅助函数代替 `return expr` / 裸表达式
- format_llm 手工构建 JSON 字符串（Ring 枚举 `_tag` + Option 序列化与 TS 的 `kind` + undefined 省略不兼容）

### Batch 3: 语法分析（~1,837 行，~1.5 天）

| 文件 | 行数 | 翻译要点 |
|------|------|----------|
| `parser/parser-ctx.ts` | 102 | ParserCtx interface → trait + Prec 枚举 |
| `parser/parser.ts` | 472 | Parser class → struct+impl 薄壳 |
| `parser/parser-decl.ts` | 388 | 声明解析（fn/struct/enum/impl/trait/effect/extern/use） |
| `parser/parser-expr.ts` | 875 | Pratt 表达式解析 + 类型表达式 + 模式解析 |

**风险**：低-中。parser-expr 875 行是本 batch 最大文件，但 Pratt 解析模式重复度高。
**验证**：对比 TS parser 和 Ring parser 对所有 E2E 用例产出的 AST（序列化后 diff）。

### Batch 4: 类型检查（~5,703 行，~4-6 天，最高风险）

内部严格按依赖链串行翻译，每个子阶段翻译后立即全量 E2E diff：

| 子阶段 | 文件 | 行数 | 翻译要点 |
|--------|------|------|----------|
| 4a | `checker/env.ts` | 192 | TypeEnv class → struct + impl + var self |
| 4b | `checker/builtins.ts` | 3 | Re-export shell |
| 4b | `checker/builtins-core.ts` | 372 | 核心内置注册（effects/Cell/Option/Eq/Clone/Ord/Debug traits） |
| 4b | `checker/builtins-hof.ts` | 239 | HOF 方法注册（List/Map/Set/Option 的 effect 多态方法） |
| 4c | `checker/unify.ts` | 549 | HM unification + row unification（**最高风险**） |
| 4d | `checker/infer-ctx.ts` | 545 | InferCtx interface → trait + 16 个 helper 函数 |
| 4d | `checker/infer.ts` | 554 | InferEngine 薄壳 + check/infer_expr 调度 |
| 4e | `checker/infer-register.ts` | 457 | Pass 1 声明注册 |
| 4e | `checker/infer-expr.ts` | 1,223 | 19 个表达式推断函数（**最大文件**） |
| 4e | `checker/infer-stmt.ts` | 384 | 语句推断（let/var/assign/return/while/for/break/continue/destructure/if-let） |
| 4e | `checker/infer-modules.ts` | 158 | 多模块支持 |
| 4f | `checker/exhaustive.ts` | 256 | 穷尽性检查（Maranget 风格 pattern matrix） |
| 4f | `checker/derive.ts` | 501 | Auto-derive fixpoint pass（Eq/Clone/Debug/Ord 自动派生） |
| 4f | `checker/zonk.ts` | 194 | Substitution application |
| 4g | `checker/checker.ts` | 79 | 主入口 check(Program) → HProgram |

**风险**：高。unify.ts 和 infer-expr.ts 是核心算法，任何翻译错误会导致类型推断结果偏差。
**串行原因**：checker 内部模块强耦合，env→builtins→unify→infer→derive→checker 有严格依赖链。
**验证**：每个子阶段翻译后立即做全量 E2E diff，不要累积到 batch 结束。

### Batch 5: 代码生成 + 模块系统 + CLI（~3,315 行，~2-3 天）

| 文件 | 行数 | 翻译要点 |
|------|------|----------|
| `codegen/runtime.ts` | 226 | JS 运行时字符串模板生成 |
| `codegen/codegen-ctx.ts` | 122 | CodegenCtx interface → trait + safe_ident + 辅助函数 |
| `codegen/codegen.ts` | 257 | CodeGenerator 薄壳 + generate() 入口 |
| `codegen/codegen-decl.ts` | 211 | 声明 codegen（fn/struct/enum/impl/trait/effect） |
| `codegen/codegen-stmt.ts` | 345 | 语句 codegen + match 语句 + pattern condition/bindings |
| `codegen/codegen-expr.ts` | 602 | 表达式 codegen（call/struct_lit/match/if/lambda 等） |
| `codegen/codegen-derive.ts` | 312 | Auto-derive trait codegen（Eq/Clone/Debug/Ord） |
| `modules/resolver.ts` | 195 | 模块解析（文件发现 + 依赖图 + 拓扑排序 + 循环检测） |
| `modules/exports.ts` | 219 | ModuleExports 类型 + extract_exports 导出提取 |
| `modules/compiler.ts` | 570 | 多文件编译编排器（resolve → parse → check → codegen → bundle） |
| `cli.ts` | 256 | CLI 入口（ring build/run/check） |

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

- [ ] Batch 1-5 所有文件翻译完成
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
- Optional chaining (`?.`) → 编译器未使用（0 处） ✓
- Nullish coalescing (`??`) → 编译器未使用（0 处） ✓

### 需要翻译模式转换（无需新语言特性）

- ~8 个 class → struct + impl + var self
- 170+ interface (data) → struct / enum 命名字段
- ~10 interface (behavior) → trait
- ~37 处 try-catch → fail effect + handle/catch
- ~210 处 `as Type` → match / if-let
- 61 处 switch → match
