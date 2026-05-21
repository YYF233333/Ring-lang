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

翻译过程中反复出现的额外模式（原表未覆盖）：

| TypeScript 模式 | Ring 等价物 |
|----------------|------------|
| `const X = "value"` (模块常量) | `pub fn X() -> Str { "value" }` 零参函数 |
| `field.type` / `field.effect` | `field.ty` / `field.eff`（Ring 关键字回避） |
| `new Array<T>()` / `[] as T[]` | `empty_xxx()` helper（`let x = [dummy]; x.clear(); x`） |
| `arr[i]` (直接下标) | `list.get(i)` → `Option<T>`，封装 `_at(list, i)` helper |
| `"a" + "b"` (字符串拼接) | `"\{a}\{b}"` 插值或 `[a, b].join("")` |
| `\`${expr}\`` (JS template literal) | `List<Str> + push + join("")`（Ring `${...}` 冲突） |
| `fn("str_arg")` inside `"\{...}"` | `let v = fn("str_arg"); "\{v}"`（嵌套引号回避） |
| `arr.map(x => ...)` 捕获 `var` | `for x in arr { result.push(...) }`（闭包不能捕获 var） |
| `return expr` in match arm | 提取为独立函数或改用 if-else（match arm 是表达式） |
| `StructDef \| EnumDef` union | `enum TypeDef { StructDef_(StructDef), EnumDef_(EnumDef) }` 包装 |

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

### Batch 3: 语法分析 ✅ 已完成

1 个 Ring 源文件（`compiler/ring/`）：

| Ring 文件 | 行数 | TS 原文件 | 状态 |
|-----------|------|-----------|------|
| `parser.ring` | ~1080 | `parser-ctx.ts` (102) + `parser.ts` (472) + `parser-decl.ts` (388) + `parser-expr.ts` (875) | ✅ |
| `main.ring` | ~175 | （集成 smoke test，已更新） | ✅ |

4 个 TS 文件合并为 1 个 Ring 文件（ParserCtx interface 不需要——循环依赖问题在单文件中消失）。

**翻译模式补充**：
- TS `const enum Prec` → Int 常量函数（`PREC_NONE() -> Int { 0 }` 等），避免 Ord derive 复杂性
- `tok.value as BinOp` → `str_to_binop(tok.value)` 转换函数（Ring BinOp 是 enum 不是 string）
- `parseInt`/`parseFloat` → Ring `parse_int`/`parse_float` + `unwrap_or`
- `expr.span` 直接访问 → `expr_span(e)` 辅助函数（Ring enum 不支持跨变体字段访问）
- `throw new Error("parse_decl_failed")` → `parse_decl` 返回 `Decl?`（none 表示失败），parse_program 用 match 恢复
- `try { ... } catch { restore }` → save/restore 位置模式（try_parse_type_args）
- `throw new CompileError(...)` → `panic("Compilation failed")`
- 递归类型空列表（`List<TypeExpr>`）→ `[0].clear().map(fn(i) -> TypeExpr { panic("unreachable") })` 利用 `panic -> Never` 底类型

**翻译中发现并修复的编译器问题**：
1. **`panic` 返回类型**（`std/io.ring`）— 从 `-> Unit` 改为 `-> Never`（底类型），使 `panic` 可用于任何需要特定类型的位置
2. **限定变体名查找 bug**（`infer-expr.ts` + `infer-ctx.ts`）— `EnumA::Foo` 应查找 EnumA 中的 Foo，而非全局 `variant_to_enum` map。修复 3 处：struct_lit 推断、constructor pattern、named_constructor pattern
3. **变体名冲突**（`ast.ring`）— `UseImport::Named` 与 `TypeExpr::Named` 冲突 → 改名 `NamedItems`；`StringInterpPart::Literal` 与 `Pattern::Literal` 冲突 → 改名 `LitPart`/`ExprPart`

### Batch 4: 类型检查（~5,295 行，~4-6 天，最高风险） ✅ 已完成

内部严格按依赖链串行翻译，每个子阶段翻译后立即全量 E2E diff：

| 子阶段 | 文件 | 行数 | 翻译要点 |
|--------|------|------|----------|
| 4a | `checker/env.ts` | 161 | TypeEnv class → struct + impl + var self ✅ |
| 4b | `checker/builtins.ts` | 3 | Re-export shell ✅ |
| 4b | `checker/builtins-core.ts` | 336 | 核心内置注册（effects/Cell/Option/Eq/Clone/Ord/Debug traits） ✅ |
| 4b | `checker/builtins-hof.ts` | 224 | HOF 方法注册（List/Map/Set/Option 的 effect 多态方法） ✅ |
| 4c | `checker/unify.ts` | 549 | HM unification + row unification（**最高风险**） ✅ |
| 4d | `checker/infer-ctx.ts` | 545 | InferCtx interface → trait + 16 个 helper 函数 ✅ |
| 4d | `checker/infer.ts` | 554 | InferEngine 合并为 infer.ring（含 infer-expr + infer-stmt + infer-modules） ✅ |
| 4e | `checker/infer-register.ts` | 457 | Pass 1 声明注册 ✅ |
| 4e | `checker/infer-expr.ts` | 1,223 | 19 个表达式推断函数（**最大文件**） ✅ |
| 4e | `checker/infer-stmt.ts` | 384 | 语句推断（let/var/assign/return/while/for/break/continue/destructure/if-let） ✅ |
| 4e | `checker/infer-modules.ts` | 158 | 多模块支持（待 Batch 5 ModuleExports 后完整集成） |
| 4f | `checker/exhaustive.ts` | 256 | 穷尽性检查（Maranget 风格 pattern matrix） ✅ |
| 4f | `checker/derive.ts` | 501 | Auto-derive fixpoint pass（Eq/Clone/Debug/Ord 自动派生） ✅ |
| 4f | `checker/zonk.ts` | 194 | Substitution application ✅ |
| 4g | `checker/checker.ts` | 79 | 主入口 check(Program) → HProgram ✅ |

**风险**：高。unify.ts 和 infer-expr.ts 是核心算法，任何翻译错误会导致类型推断结果偏差。
**串行原因**：checker 内部模块强耦合，env→builtins→unify→infer→derive→checker 有严格依赖链。
**验证**：每个子阶段翻译后立即做全量 E2E diff，不要累积到 batch 结束。

**翻译模式补充（4a+4b）**：
- TS `TypeScheme.type` → Ring `TypeScheme.ty`（`type` 为关键字，同 Batch 1-2 模式）
- TS `TypeScheme.bounds[].type_var` → Ring `SchemeBound`（避免 ast.ring `TypeBound` + hir.ring `TraitBound` 命名冲突）
- TS `EffectDef.built_in_kind?: "io"|"fail"|"mut"` → Ring `BuiltInKind?` 枚举（`BkIo`/`BkFail`/`BkMut`）
- TS block scoping `{ const t = ...; ... }` 在 Ring 中无效（`{ let x = ... }` 不创建新作用域）→ 同函数内多段注册必须用 `var` + 重赋值，或拆分为独立函数
- `env.fresh_var()` 返回 `Type`（非 TS 的 `TypeVar`）→ 用 `fresh_var_id()` + 手动构造 `Type::TypeVar { id, name: none }` 分离 id 和类型值
- `apply_subst` 保留在 env.ring（unify.ring 导入使用，避免循环依赖）
- `Map.set()` → `Map.insert()`，`new Map()` → `map_new()`，`new Set()` → `set_new()`
- `map_new()`/`set_new()` 支持从 struct 字段上下文推断泛型参数（与 `[]` 空列表不同）

**翻译模式补充（4c）**：
- `throw new UnificationError(...)` → `fail.raise(UnificationError { message, is_occurs_check })` via Ring fail effect
- `FreshIdGen = () => number` → 直接传 `var env: TypeEnv`，调用 `env.fresh_var_id()`
- `new Map(subst)` 拷贝语义 → `map_clone(subst)`（substitution 不可变更新）
- Ring 不支持 or-pattern `|` in match → 每个变体单独列 arm
- `return` 不可在 match arm 中作为裸表达式，需用 `{ return expr }` block 包裹或改用 `if` + helper 函数
- match arm 内 `var env` 调用端不写 `var`（`var` 仅在函数签名处声明）
- `Set<number>` 索引跟踪 → `Set<Int>` + `for` 循环手动维护索引计数器
- `filter((_, i) => ...)` 索引过滤 → 自定义 `filter_by_index_not_in` helper

**翻译模式补充（4d）**：
- `InferCtx` interface → Ring `pub struct InferCtx`（无 trait，字段直接暴露）
- `CompileError` → `pub struct CompileError {}` + `fail.raise(CompileError {})` via fail effect（声明级 `try { ... }` 捕获）
- `type_error(ctx, code, msg, span, context)` → `type_error(ctx.sink, code, msg, span, context)` 拆分 sink 传递
- `unify_at` 使用 `expr catch UnificationError fn(e) { type_error(...) }` 实现（catch handler 中 raise CompileError）
- `make_diagnostic(code, "error", ...)` → `make_diag(code, Severity::SevError, ...)`（Ring 版使用 Severity 枚举非字符串）
- `substitute_type(t, mapping)` → 直接用 `apply_subst(mapping, t)`（两者等价）
- `assertNever(expr, "...")` → 不需要（Ring 穷尽匹配内置）
- `for (const [, scheme] of scope.variables)` → `for entry in scope.variables.entries() { let (_, scheme) = entry }`
- 避免 `.map()` 闭包捕获 `var ctx` → 改用 `for` 循环 + `push`

**翻译中发现并修复的编译器问题**：
1. **`catch TypeName` 跨模块 codegen bug**（`codegen-expr.ts:473`）— typed catch 的 `instanceof` 检查使用裸名 `TypeName` 而非模块限定名 `module$TypeName`。修复：`safe_ident(expr.error_type)` → `ctx.qualify(safe_ident(expr.error_type))`

**翻译模式补充（4f+4g）**：
- `List.get(i)` 返回 `Option<T>` → 添加 `*_at(list, i)` helper 函数（`match list.get(i) { some(v) => v, none => panic("out of bounds") }`）
- 字符串拼接 `a + b` → 字符串插值 `"\{a}\{b}"`（Ring `+` 仅支持数值类型）
- 字符串插值不支持嵌套引号 → 预先计算到变量再插值（`let joined = join_strs(x, ", "); "\{joined}"`）
- `[T].clear()` 返回 `Unit` → 提取为 `empty_xxx()` helper 函数（`let x = [dummy]; x.clear(); x`）
- `var` 仅在函数签名中声明，调用处**不写** `var`
- 非 `pub` struct 定义需在文件中位于引用它的函数之前（两阶段注册顺序敏感）
- `FieldAction::Identity` / `FieldAction::Call { ... }` 替代 TS 的 `"identity"` / `{ kind: "call", ... }` union 类型
- `TypeKind::StructKind` / `TypeKind::EnumKind` 替代 TS 的 `"struct" | "enum"` 字符串 union
- `checker.ring` 入口：`new_type_env()` + `register_builtins` + `register_hof_intrinsics` + `load_prelude` + `infer_check`
- prelude 加载使用 `extern fn` 的 `read_file` / `file_exists` / `path_join`（声明在 std/fs.ring + std/path.ring）

### Batch 5: 代码生成 + 模块系统 + CLI（~3,315 行，~2-3 天） ✅ 已完成

| 文件 | 行数 | 翻译要点 |
|------|------|----------|
| `codegen/runtime.ts` | 226 | JS 运行时字符串模板生成 ✅ |
| `codegen/codegen-ctx.ts` | 122 | CodegenCtx struct + safe_ident + 辅助函数 ✅ |
| `codegen/codegen.ts` | 257 | generate() 入口 + builtin method 注册 ✅ |
| `codegen/codegen-decl.ts` | 211 | 声明 codegen（fn/struct/enum/impl/trait/effect） ✅ |
| `codegen/codegen-stmt.ts` | 345 | 语句 codegen + match 语句 + pattern condition/bindings ✅ |
| `codegen/codegen-expr.ts` | 602 | 表达式 codegen（call/struct_lit/match/if/lambda 等） ✅ |
| `codegen/codegen-derive.ts` | 312 | Auto-derive trait codegen（Eq/Clone/Debug/Ord） ✅ |
| `modules/resolver.ts` | 195 | 模块解析（文件发现 + 依赖图 + 拓扑排序 + 循环检测） ✅ |
| `modules/exports.ts` | 219 | ModuleExports 类型 + extract_exports 导出提取 ✅ |
| `modules/compiler.ts` | 570 | 多文件编译编排器（resolve → parse → check → codegen → bundle） ✅ |
| `cli.ts` | 256 | CLI 入口（ring build/check/help） ✅ |

**翻译模式补充（Batch 5）**：
- Ring `${...}` 字符串插值与 JS template literal `${...}` 冲突 → 通过 `List<Str> + join("")` 构建 JS 输出
- 字符串内不能有嵌套引号的 `\{fn("str")}` → 预计算到变量再插值
- `RUNTIME_CODE` 作为函数逐行 push 构建（190 行 JS 运行时代码）
- `escape_for_template_literal()` helper 替代 `.replace()` 链（避免 `$\{` 解析问题）
- `gen_binop()` 提取为独立函数避免 match arm 中 return
- `extern fn gen_expr_str` 声明解决 codegen_stmt → codegen_expr 循环依赖
- `TypeDef` enum 包装 `StructDef | EnumDef`（Ring 无法直接 union 两个 struct 类型）
- `cli.ring` 的 `run` 命令暂未完成（需要 `exec_sync` extern fn）

**统计**：31 个 Ring 文件，共 ~14,260 行。翻译自 30 个 TS 文件（~13,340 行）。

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

- [x] Batch 1-5 所有文件翻译完成（31 文件，~14,260 行 Ring 代码）
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
