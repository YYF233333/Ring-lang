# CLAUDE.md

## 项目概述

Ring-lang：面向大型多端应用的编程语言，转译到 JavaScript/V8 运行。

核心特性：代数 effect system、refinement types、ML 级类型推断、row polymorphism + OOP 手感模拟。设计目标：LLM vibe coding 友好性优于 TypeScript。

完整设计文档见 `docs/design.md`（含实现状态附录）。

**当前状态：自举完成（2026-05-21）。** 编译器已从 TypeScript 完全迁移到 Ring 自举实现（31 个 .ring 源文件）。TS 编译器已归档于 git tag `ts-compiler-final`。编译器覆盖完整的类型系统（HM 推断 + effect system + trait + row polymorphism）、控制流、集合类型（List/Map/Set/Tuple）、模块系统、FFI、标准库、auto-derive traits（Eq/Clone/Debug/Ord）。334/339 E2E 测试通过（5 个失败为 Ring parser 缺少错误恢复导致 panic）。LSP 暂不可用（原 TS 实现未移植）。详见下方"已实现功能"摘要。

## 技术栈

- **编译器实现语言**：Ring（自举，31 个 .ring 源文件编译为 JS）
- **编译目标**：JavaScript（V8 运行时）
- **测试框架**：node:test（零外部依赖）
- **参考实现**：Koka 编译器（MIT 许可），用于 effect 推断、evidence passing 等复杂算法的翻译
- **历史**：TypeScript 原始实现归档于 git tag `ts-compiler-final`

## 项目结构

```
Ring-lang/
├── docs/
│   ├── design.md                       完整语言设计（15 章 + 实现状态附录）
│   └── audit-report.md                 技术债清单（41 项）
├── compiler/
│   ├── ast.ring                        AST 节点类型定义
│   ├── types.ring                      Type、Effect、EffectRow 表示 + BUILTIN_* 常量 + type_to_builtin_name
│   ├── hir.ring                        HIR 节点定义 + 共享约定（variant_js_name, trait_dict_name, evidence_param_name）
│   ├── builtin_methods.ring            内置方法名注册表（*_METHODS 常量，checker + codegen 共享）
│   ├── codes.ring                      错误码目录（E0101-E0706）
│   ├── diagnostics.ring                DiagnosticSink trait、CollectingSink、Diagnostic 类型
│   ├── formatter.ring                  format_human + format_llm 输出格式化
│   ├── lexer.ring                      手写词法分析器
│   ├── parser.ring                     Pratt 表达式解析 + 声明/语句/类型/模式解析（合并自 TS 的 4 个 parser 文件）
│   ├── env.ring                        类型环境 + 作用域 + TypeScheme（含 bounds）
│   ├── builtins.ring                   核心内置注册（effects/Cell/Option/Eq/Clone/Ord/Debug traits）+ HOF 方法注册
│   ├── unify.ring                      HM Unification + Row Unification（含 EffectRowType）+ 替换
│   ├── infer_ctx.ring                  InferCtx struct + helper 函数（type resolution/generalize/bind_pattern 等）
│   ├── infer.ring                      类型推断引擎（表达式/语句/模块推断，合并自 TS 的 infer + infer-expr + infer-stmt + infer-modules）
│   ├── infer_register.ring             Pass 1 声明注册（register_struct/enum/trait/impl 等）
│   ├── exhaustive.ring                 穷尽性检查（Maranget 风格 pattern matrix）
│   ├── derive.ring                     Auto-derive fixpoint pass（Eq/Clone/Debug/Ord 自动派生）
│   ├── zonk.ring                       Zonk 工具（apply subst + label type var names）
│   ├── checker.ring                    主入口：check(Program) -> HProgram
│   ├── runtime.ring                    JS 运行时辅助代码 + RUNTIME_EXPORT_NAMES + runtime_esm_code()
│   ├── codegen_ctx.ring                CodegenCtx struct + safe_ident + 辅助函数
│   ├── codegen.ring                    CodeGenerator 入口 + generate() + builtin method 注册
│   ├── codegen_decl.ring               声明 codegen（fn/struct/enum/impl/trait/effect）
│   ├── codegen_stmt.ring               语句 codegen + match 语句 + pattern condition/bindings
│   ├── codegen_expr.ring               表达式 codegen（call/struct_lit/match/if/lambda 等）
│   ├── codegen_derive.ring             Auto-derive trait codegen（Eq/Clone/Debug/Ord）
│   ├── resolver.ring                   模块解析（文件发现 + 依赖图 + 拓扑排序 + 循环检测）
│   ├── exports.ring                    ModuleExports 类型 + extract_exports 导出提取
│   ├── compiler_mod.ring               多文件编译编排器（compile_phases + compile_project bundle + compile_project_esm）
│   ├── cli.ring                        ring build/run/check 入口 + --error-format + --out-dir + 多文件 ESM 输出
│   ├── main.ring                       编译器入口点（调用 cli 解析 + 执行）
│   ├── dist/                           编译器 JS 产出（入 git，自举安全网）
│   └── package.json                    npm test 入口
├── editor/
│   └── vscode/
│       ├── syntaxes/ring.tmLanguage.json  TextMate 语法高亮
│       ├── language-configuration.json    括号匹配、注释、缩进规则
│       └── package.json                VSCode extension manifest（LSP 暂不可用）
├── std/
│   ├── io.ring                         标准库：print/assert(cond,msg)/panic/exit/json_stringify
│   ├── list.ring                       标准库：extern type List<T> + 17 非 HOF 方法 + list_clone
│   ├── map.ring                        标准库：extern type Map<K,V> + 10 方法 + map_new/map_from/map_clone
│   ├── set.ring                        标准库：extern type Set<T> + 10 方法 + set_new/set_from/set_clone
│   ├── str.ring                        标准库：impl Str 16 方法
│   ├── num.ring                        标准库：Int::to_str, Float::to_str, parse_int, parse_float
│   └── result.ring                     标准库：Result<T,E> enum + impl（map/and_then/unwrap_or/is_ok/is_err）+ to_result
├── examples/
│   ├── hello.ring                      基本示例（可运行）
│   └── effects.ring                    Effect 系统示例（可类型检查）
├── tests/
│   ├── cases/                          E2E 测试用例（正向 + 负向 .ring 文件）
│   └── e2e.test.ts                     测试运行器（in-process Ring 编译器 ESM 模块调用）
└── CLAUDE.md
```

## 编译器管线

```
源码 (.ring) → Lexer → Parser → AST → Checker (HM + effects) → HIR → Codegen → JavaScript
                                  ↓ (errors)
                           DiagnosticSink → format_human / format_llm
```

- **AST**：忠实反映源码结构，所有节点带 Span 位置
- **HIR**：独立数据结构，每个表达式均带推断的 Type + EffectRow，语法糖已展开
- **DiagnosticSink**：Lexer、Parser 和 Checker 的错误统一收集，支持多错误报告（Lexer 产出 Error token 不 crash，Parser 有声明级恢复，Checker 有 declaration 级恢复——跨声明继续检查报告多个错误）
- **设计意图**：HIR 独立于 AST，后续优化 pass 在 HIR → Codegen 之间插入

## 开发约定

- 编译器源码是 Ring（`compiler/*.ring`），snake_case 命名
- 编译器各阶段共享约定放 `hir.ring`（如 `variant_js_name`），不允许跨阶段硬编码字符串契约
- **修改编译器后必须重新编译 dist/**：`node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist`，并提交更新后的 dist/ 文件
- Ring-lang 注释语法：`//`（非 `--`），与 Rust/JS 一致，LLM 更友好
- 无 pipe 运算符：UFCS `.method()` 是唯一的链式调用方式（"一种事一种写法"）
- 编译器必须编译速度快（亚秒级增量编译），因为 IDE 耦合
- 生成的 JS 代码应是可读的——方便调试和理解翻译逻辑
- 复杂算法参考 Koka 的 Haskell 实现翻译，标注来源
- 新增 AST/HIR 节点后必须处理所有 match 穷尽分支（Ring 编译器自动检查）
- 每个 PR 至少包含一个 e2e 测试用例（`tests/cases/*.ring` + `e2e.test.ts` 注册）
- PR 合入前必须通过 `npm test`（从 `compiler/` 目录运行）
- **禁止 worktree 隔离**：Agent 工具不得使用 `isolation: "worktree"`，所有改动直接在 main 工作目录上进行。worktree 基于旧版本分叉后无法干净 merge 回来，浪费时间。
- **决策必须讨论**：发现问题后不得自行决定修复方案，除非问题trival且有唯一正确修复方式。所有需要判断的问题必须先列出来让用户拍板，然后一次性执行。不讨论就动手 = 错误。
- **禁止忽略问题**：列出来的问题不能以"推迟到下阶段"、"很难触发"、"当前阶段不重要"等原因**主动**替用户忽略，必须上报用户阐明推荐理由，由用户拍板。
- **文档时效性**：每次修改编译器功能后，必须同步更新 CLAUDE.md 和 docs/design.md 中受影响的描述（测试数量、已知限制、实现状态附录等）。过时文档比没有文档更有害。已完成的 review/plan/spec 文件应删除而非保留。
- **禁止temp fix**：禁止以fix很大，费时费力为由使用偷懒的、局部的、会给后续开发埋下隐患的修复方式。修复应当以提升项目健壮性，不增加技术债的方式进行，即使这样会比简单修复有更大的工作量。
- bug fix后如果问题典型且有后续再犯风险，应当补充regression test，加强测试边界。

## 测试策略

- **E2E 语义测试**（`tests/cases/*.ring`）：语言规范的可执行版本，每个特性一个文件，大量写
- **负面测试**（期望编译错误）：定义类型系统边界，含 pending 测试标记未来特性
- **Bug fix 回归测试写 E2E 层**：不写"第 X 行生成的 JS 应该是 Y"——codegen 实现可变
- **不要追求覆盖率数字**：度量语义覆盖（多少语言特性有 E2E 测试），不度量代码行覆盖

## 已实现功能

完整的类型系统（HM 推断 + effect system + trait + row polymorphism）、控制流（while/for/break/continue）、集合类型（List/Map/Set/Tuple）、模块系统（use/pub use/多文件 ESM）、FFI（extern fn/extern type）、标准库（7 个 .ring 文件，含 `Result<T,E>`）、auto-derive traits（Eq/Clone/Debug/Ord）、Option\<T\>（T? 类型语法 / `unwrap` / `to_fail` / `unwrap_or` / `unwrap_or_else`）、`catch { pattern => handler }` match-arm 风格错误处理、`Result<T,E>` 标准库类型（`to_result()` 桥接 fail→Result）、字符串插值、enum 命名字段（无字段变体统一为裸名）、struct update 语法、var self 可变方法、空列表字面量 `[]` 类型推断、tuple 位置字段访问（`.0`/`.1`/`.2`）、普通函数调用的 lambda 参数双向类型推断。开发历史详见 git log。

## 已知限制

### Effect / Codegen 限制

- **Handler 支持 tail-resumptive + abort 两种语义**：非 abort effect（io/custom）的 handler 返回值即 resume 值，计算继续；`fail.raise` 为 abort 语义。不支持 post-resume handler（resume 后继续执行额外代码）
- **Trait dictionary dispatch 不转发 evidence**：trait 方法带 effect 时缺少 evidence 参数（trait dict closure 已支持高阶传递）
- **`catch` 使用 match-arm 语法**：`expr catch { pattern => handler, ... }`。有 catch-all arm（wildcard/binding 无 guard）时移除 fail effect，否则 fail 传播。支持 enum variant 多 arm 匹配、struct 解构、guard 表达式
- **表达式位置的 block/if 包含 `return` 时 IIFE 仍会截获**：语句位置（函数体、expr_stmt）已修复（C10），但 `let x = { return y; 0 }` 这类表达式位置的 return 仍被 IIFE 截获。实践中极少遇到。

### 类型系统限制

- Record row types 仅在参数位置使用（无匿名 record 字面量、无 spread 运算符）
- Refinement `where` 子句只解析不验证（tokens 被消费后丢弃）
- Trait 系统暂不支持：关联类型、supertrait 继承、`dyn Trait` 动态分发
- `pub` 可见性在多文件模式下强制执行，单文件模式不强制（向后兼容）
- 穷尽性检查支持嵌套模式递归检查（含 Option<Option<T>> 等嵌套 enum）；多字段交叉组合不验证
- `List.contains` / `List.find` / `Map` key 查找 / `Set.contains` 等仍使用 JS `===` 引用相等——`==` 运算符已解糖为 Eq trait dispatch（struct/enum 结构相等），但集合内部方法尚未升级
- 深层嵌套泛型类型（如 `Pair<Pair<Int, Int>, Int>`）的 trait method UFCS 调用不支持——auto-derive codegen 和 operator dispatch 正常工作，但 `.eq()`/`.clone()`/`.debug()`/`.cmp()` 直接方法调用受限

### LSP 限制

- **LSP 暂不可用**：LSP 服务器原为 TS 实现，未移植到 Ring 自举编译器。VSCode 插件仅提供语法高亮。
- 跨文件跳转定义和查找引用尚未实现（hover 和类型检查已支持跨模块）

### 语法与表达式限制

- **字符串无 `+` 拼接运算符**：`"a" + "b"` 报 E0303（要求数值类型）。所有字符串拼接必须用插值 `"${a}${b}"` 或 `List<Str>.join()`
- **`return` 不能出现在 match arm 表达式位置**：match arm 是表达式，`return` 是语句。需要提取到独立函数用 `return`，或重构为 if-else
- **`[x].clear()` 返回 `Unit`**：`clear()` 是原地操作返回 `()`，不能链式调用 `.map()`。必须分为 `let x = [v]; x.clear(); x.map(...)` 三条语句
- **`List.get(i)` 返回 `Option<T>`**：无直接下标访问 `list[i]`。需要 `match list.get(i) { some(v) => v, ... }` 或封装 `_at()` helper
- **无 `List.set(i, v)` 方法**：修改列表中间元素需要重建整个列表
- **`for..in` 闭包捕获 `var` 限制**：`.map()` 闭包不能捕获 `var` 变量，需改用 `for` 循环 + `push`
- **`BinOp::Eq {` 解析歧义**：`op == BinOp::Eq` 后跟 `{` 时，parser 将 `Eq {` 解析为命名字段变体构造而非比较+块。需加括号 `(op == BinOp::Eq)`

### 基础设施限制

- 无 `loop` 无限循环语法（`while true` 可替代），无 Range/List/Set/Map 以外的自定义迭代器
- `for..in` 不支持 Map 直接迭代（需 `for entry in map.entries()` + 解构）
- 无 CI 管线（test 依赖手动执行）
- 模块系统不支持：`sig` 签名、first-class modules、inline `mod` 块、capability 限制、相对路径（`super::`/`self::`）
- Checker 多错误恢复：declaration 级（同一函数内仍停于首错）
- Ring parser 无错误恢复（遇到语法错误直接 panic），5/339 负面测试因此失败
- E2E 测试通过 `cd compiler && npm test` 运行（334/339 通过）

## Phase 4 路线图（未来方向）

### 自举编译器改进（近期）

- Parser 错误恢复（消除 panic-on-error，修复 6 个失败测试）
- LSP 移植到 Ring（从 TS 归档版本翻译）
- 技术债清理（41 项，详见 `docs/audit-report.md`）

### 语言特性（中期）

- `mut<S>` 参数化 effect（当前 `mut` 无类型参数，Cell<T> 泛型保证类型安全）
- Full algebraic effect（post-resume handler，需要 delimited continuation）
- Refinement types（编译期验证 + 运行时检查）
- 关联类型 + supertrait 继承
- `dyn Trait` 动态分发

### 长期目标

- Dependent types lite
- LLVM native backend
- Formatter 自动标注等级系统

## 常用命令

```bash
# 运行 Ring-lang 程序
node compiler/dist/main.js run examples/hello.ring

# 编译为 JS（不执行）
node compiler/dist/main.js build examples/hello.ring

# 仅类型检查
node compiler/dist/main.js check examples/effects.ring

# 类型检查 + LLM 格式错误输出
node compiler/dist/main.js check --error-format=llm examples/effects.ring

# 运行 E2E 测试（334/339 通过）
cd compiler && npm test

# 多文件编译（ESM 输出）
node compiler/dist/main.js build examples/multifile/main.ring          # → dist/
node compiler/dist/main.js build examples/multifile/main.ring --out-dir=build  # → build/

# 重新编译 Ring 编译器自身（修改 compiler/*.ring 后）
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist

# 调试模式（打印中间 AST/HIR/JS）
node compiler/dist/main.js run --debug examples/hello.ring
```
