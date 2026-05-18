# CLAUDE.md

## 项目概述

Ring-lang：面向大型多端应用的编程语言，转译到 JavaScript/V8 运行。

核心特性：代数 effect system、refinement types、ML 级类型推断、row polymorphism + OOP 手感模拟。设计目标：LLM vibe coding 友好性优于 TypeScript。

完整设计文档见 `docs/design.md`（含实现状态附录）。

**当前状态：Phase 2 全部完成 + Phase 3a Batch 1 完成** — 编译器支持 Option<T>（统一为 EnumType） + `?`/`try`/`or` 双用途 + typed catch + row polymorphism + evidence passing + trait 系统（含高阶 dict closure + TypeScheme bounds 传递） + diagnostics 管线 + declaration 级多错误恢复 + **LSP server（def_id 作用域感知）+ VSCode 插件** + **let 不可变性强制（E0205）** + **while 循环 + break/continue（E0206）** + **`for x in 0..N` range 循环（Rust 风格 `..` 运算符）**。215 个编译器单元测试 + 178 个端到端测试（含 54 正向 + 13 负向 + 3 LLM 格式）全部通过。

## 技术栈

- **编译器实现语言**：TypeScript（strict mode, ES2022, Node16 模块）
- **编译目标**：JavaScript（V8 运行时）
- **测试框架**：node:test（零外部依赖）
- **参考实现**：Koka 编译器（MIT 许可），用于 effect 推断、evidence passing 等复杂算法的翻译

## 项目结构

```
Ring-lang/
├── docs/
│   └── design.md                       完整语言设计（15 章 + 实现状态附录）
├── compiler/
│   ├── src/
│   │   ├── ast/index.ts                AST 节点类型定义
│   │   ├── types/index.ts              Type（含 EffectRowType）、Effect、EffectRow 表示
│   │   ├── hir/index.ts                HIR 节点定义 + 共享约定（variant_js_name, trait_dict_name, evidence_param_name）
│   │   ├── errors.ts                   诊断/错误类型 + assertNever 穷尽检查
│   │   ├── parser/
│   │   │   ├── lexer.ts                手写词法分析器
│   │   │   ├── parser.ts               递归下降 + Pratt 优先级解析（含 trait 语法 + 错误恢复）
│   │   │   └── parser.test.ts          Parser 测试（45 tests）
│   │   ├── checker/
│   │   │   ├── env.ts                  类型环境 + 作用域 + TypeScheme（含 bounds）+ 内置定义
│   │   │   ├── unify.ts                HM Unification + Row Unification（含 EffectRowType）+ 替换
│   │   │   ├── infer.ts                Algorithm W 类型推断
│   │   │   ├── exhaustive.ts           穷尽性检查
│   │   │   ├── checker.ts              主入口：check(Program) → HProgram
│   │   │   ├── zonk.ts                 Zonk 工具（apply subst + label type var names）
│   │   │   └── checker.test.ts         Checker 测试（43 tests）
│   │   ├── codegen/
│   │   │   ├── runtime.ts              JS 运行时辅助代码
│   │   │   ├── codegen.ts              HIR → JavaScript 生成
│   │   │   └── codegen.test.ts         Codegen 测试（31 tests）
│   │   ├── diagnostics/
│   │   │   ├── index.ts                DiagnosticSink、CollectingSink、Diagnostic 类型
│   │   │   ├── codes.ts                错误码目录（E0101-E0601）
│   │   │   ├── formatter.ts            format_human + format_llm 输出格式化
│   │   │   ├── suggestions.ts          建议增强框架（框架就绪，规则待填充）
│   │   │   └── diagnostics.test.ts     Diagnostics 测试（10 tests）
│   │   ├── lsp/
│   │   │   ├── server.ts              LSP server 主入口（connection + handler 注册）
│   │   │   ├── document-manager.ts    文档状态管理 + 编译缓存
│   │   │   ├── utils.ts               Span ↔ LSP 坐标转换
│   │   │   ├── features/
│   │   │   │   ├── diagnostics.ts     编译器 Diagnostic → LSP Diagnostic
│   │   │   │   ├── hover.ts           HIR 节点查找 → 类型悬停
│   │   │   │   ├── completion.ts      上下文感知自动补全
│   │   │   │   ├── definition.ts      符号表 → 跳转到定义
│   │   │   │   ├── references.ts      HIR 遍历 → 查找引用
│   │   │   │   ├── rename.ts          引用收集 → 重命名
│   │   │   │   ├── symbols.ts         AST 声明 → 文档符号（大纲）
│   │   │   │   └── code-actions.ts    诊断建议 → Quick Fix
│   │   │   └── lsp.test.ts            LSP 测试（39 单元 + 1 E2E）
│   │   └── cli.ts                      ring build/run/check/lsp 入口 + --error-format 支持
│   ├── scripts/
│   │   └── lint.mjs                    自定义 lint 检查（as any 禁令等）
│   ├── package.json
│   └── tsconfig.json
├── editor/
│   └── vscode/
│       ├── src/extension.ts            VSCode 插件入口（LSP client 启动）
│       ├── syntaxes/ring.tmLanguage.json  TextMate 语法高亮
│       ├── language-configuration.json    括号匹配、注释、缩进规则
│       ├── package.json                VSCode extension manifest
│       └── tsconfig.json
├── examples/
│   ├── hello.ring                      基本示例（可运行）
│   └── effects.ring                    Effect 系统示例（可类型检查）
└── tests/
    ├── cases/                          端到端测试用例（54 正向 + 13 负向 = 67 个 .ring 文件）
    └── e2e.test.ts                     端到端测试运行器（178 tests: run + check + build + negative + llm-format）
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
- **禁止 worktree 隔离**：Agent 工具不得使用 `isolation: "worktree"`，所有改动直接在 main 工作目录上进行。worktree 基于旧版本分叉后无法干净 merge 回来，浪费时间。
- **决策必须讨论**：发现问题后不得自行决定修复方案，除非问题trival且有唯一正确修复方式。所有需要判断的问题必须先列出来让用户拍板，然后一次性执行。不讨论就动手 = 错误。
- **禁止忽略问题**：列出来的问题不能以"推迟到下阶段"、"很难触发"、"当前阶段不重要"等原因**主动**替用户忽略，必须上报用户阐明推荐理由，由用户拍板。
- **文档时效性**：每次修改编译器功能后，必须同步更新 CLAUDE.md 和 docs/design.md 中受影响的描述（测试数量、已知限制、实现状态附录等）。过时文档比没有文档更有害。已完成的 review/plan/spec 文件应删除而非保留。
- **禁止temp fix**：禁止以fix很大，费时费力为由使用偷懒的、局部的、会给后续开发埋下隐患的修复方式。修复应当以提升项目健壮性，不增加技术债的方式进行，即使这样会比简单修复有更大的工作量。
- bug fix后如果问题典型且有后续再犯风险，应当补充regression test，加强测试边界。

## 已实现功能

### Phase 1 ✅ (2026-05-16)

- 手写 Lexer（含字符串插值 `${}`、raw string `r#"..."#`）
- 递归下降 Parser + Pratt 运算符优先级
- struct + enum + pattern matching（穷尽性检查）
- Hindley-Milner 类型推断（Algorithm W + let-polymorphism）
- Effect 推断（`io` + `fail<E>`，自动传播和消除）
- UFCS + impl 块方法解析
- `or` / `catch` 错误处理（编译为 evidence + try/catch）
- `handle...with` effect handler（编译为 evidence passing）
- 字符串插值 → JS template literals
- JS 代码生成（struct→class, enum→factory, match→switch）
- CLI：`ring build/run/check`

### Phase 2 Session 1 ✅ — Trait 系统 (2026-05-16)

- `trait` 声明（含抽象方法和默认方法）
- `impl Trait for Type`（含完整性验证——缺少必需方法时报错）
- 泛型约束 `<T: Trait>` 和多约束 `<T: A + B>`
- Trait 方法解析（具体类型直接调用 + 泛型类型变量 dictionary dispatch）
- Dictionary Passing codegen：`impl Trait for Type` → JS dictionary 对象，泛型函数接收 `__Trait` 参数
- Dictionary 转发：泛型函数调用另一个泛型函数时自动传递 dictionary

### Phase 2 Session 2 ✅ — Evidence Passing Effect System (2026-05-17)

- Evidence Passing：所有 effect（io, fail, custom）统一为 evidence 参数传递
- Effect 操作 → evidence 方法调用（`io.read(x)` → `__ev_io.read(x)`）
- Handler codegen：`handle...with` → evidence 对象构造 + try/catch（**abort 语义**）
- 函数签名自动注入 `__ev_` 参数（按 effect name 字母序排列）
- Evidence 转发：跨多层函数调用自动传递 evidence
- 顶层 main() evidence 注入（io → fs 真实实现，fail → throw）
- 运行时精简：`__EffectAbort` 类（6 行），无 generator 开销

### Phase 2 Session 2b ✅ — Cell<T> + mut + resume (2026-05-17)

- `Cell<T>` 运行时类型：`new`/`get`/`set`/`update` UFCS 方法
- `mut` effect 声明 + checker 注册
- Cell 运行时函数 codegen + UFCS dispatch
- 闭包捕获 Cell（依赖 JS 闭包语义）

### Phase 2 Session 3 ✅ — Row Polymorphism (2026-05-17)

- Record row types：`{field: Type, ..rest}` 在函数参数类型中使用
- Koka 风格 row unification（record row 和 effect row 共用算法）
- Struct → Record coercion（单向：struct 满足 record 约束）
- Effect row 收紧（proper row variable matching 替代 lenient 模式）
- Record field access codegen（零成本：JS property access）
- Row variable generalization（函数 type scheme 包含 row variable）

### Phase 2 Session 4a ✅ — Diagnostics 管线 (2026-05-17)

- `--error-format=human|llm` CLI flag（LLM 格式输出结构化 JSON）
- DiagnosticSink 抽象 + CollectingSink 多错误收集
- 错误码目录（E0101 parse ~ E0601 codegen）
- Parser 声明级错误恢复（`synchronize()` 跳到下一个声明边界）
- format_llm：version/diagnostics/summary JSON 结构
- 建议增强框架（`suggestions.ts`，规则待填充）

### Phase 2 Session 5 ✅ — Option<T> + Typed Catch (2026-05-17)

- `Option<T>` 内置 enum（`some(T)` / `none` 构造器 + pattern matching）
- `T?` 类型标注语法（等价于 `Option<T>`）
- `?` postfix 操作符：Option → fail 提升（`expr?` 拆箱 some 或 raise fail）
- `try` block：fail → Option 捕获（`try { expr }` 包装为 `some(result)` 或 `none`）
- `or` 双用途：Option 值（`opt or default`）和 fail effect（`risky() or fallback`）
- Typed catch：`catch TypeName fn(e) { handler }` 按错误类型选择性捕获
- `Unit` 类型标注支持（`-> Unit`）

### Phase 2 Session 4b ✅ — LSP Server + VSCode Extension (2026-05-18)

- LSP server 内嵌于编译器包（`compiler/src/lsp/`），直接复用编译管线
- `ring lsp` CLI 子命令（stdio 传输，动态 import）
- 文档管理：打开/变更/关闭 → 自动重编译 + 150ms debounce
- 8 项 LSP 功能：
  - publishDiagnostics（编译器 Diagnostic → LSP Diagnostic + relatedInformation）
  - hover（HIR 遍历 → 最小节点类型签名 + struct/enum/effect/trait 声明签名，Markdown 格式）
  - completion（局部变量/参数 + 作用域变量/函数 + `.` 后 struct 字段/UFCS 方法 + `::` enum 构造器 + 关键字）
  - definition（def_id 作用域感知查找 → 跳转到定义）
  - references（def_id 匹配 → 精确跨作用域隔离）
  - rename（引用收集 → WorkspaceEdit，拒绝内置名称 + 非法标识符，name_span 精确替换）
  - documentSymbol（AST 声明 → 大纲视图，含嵌套字段/变体/方法）
  - codeAction（诊断建议 → QuickFix）
- VSCode 插件：TextMate 语法高亮（关键字/类型/字符串插值/注释）+ language-configuration + LSP client
- 39 个 LSP 测试（38 单元 + 1 E2E）

### Phase 2 Milestone Review 修复 ✅ (2026-05-19)

- **C1**: `==`/`!=` 编译为 JS `===`/`!==` 严格相等（codegen bin_op 映射）
- **C2**: 嵌套构造器模式匹配（`some(some(v))`）——递归 `gen_pattern_condition`/`gen_pattern_bindings`
- **C3**: guard + 同 variant 多 arm——match codegen 从 switch 重构为统一 if-chain
- **C4**: `safe_ident` 一致性——`gen_struct_lit` + `emit_impl_decl` 统一应用
- **C5**: Effect row unification 双尾丢弃 effect——新增 `EffectRowType` 到 Type union，`apply_to_effect_row` 支持 merge
- **C6**: Trait bound 别名绕过——`TypeScheme` 新增 `bounds` 字段，`instantiate` 记录 `var_bounds`，`generalize` 传递 bounds
- **C7**: LSP definition/references/rename 跨作用域碰撞——HIR 全链路 `def_id` 追踪，checker `bind()` 分配唯一 ID，`infer_ident` 传递到 HIdent，LSP 按 def_id 匹配
- **C8**: LSP references 使用语句 span 而非标识符 span——AST/HIR `name_span` 从 parser 到 LSP 全链路传递
- **C9**: `try_parse_type_args` 推测解析泄漏诊断——`DiagnosticSink` save/restore + parser error_count 回滚
- **C10**: `return` 在 if-IIFE 内不退出外层函数——双模式 codegen：语句位置的 if/block/match 生成 JS 语句（不包 IIFE），表达式位置保留 ternary/IIFE
- **I2+I3**: Zonk `label_vars` 补全 fn effect row + record tail name
- **I5**: `remove_specific_fail_effect` 对 target 应用 substitution
- **I8**: `never` 统一移到 var 绑定之后
- **I22**: Lexer 尾部反斜杠 EOF 边界检查
- 14 个新 e2e 测试文件 + 2 个 unify 单元测试 + 4 个 LSP 单元测试 + 2 个 codegen/parser 单元测试

### Phase 2 Remaining Issues 修复 ✅ (2026-05-19)

- **I1**: 穷尽性检查递归嵌套模式（每列独立检查，能检测 `some(none)` 缺失）
- **I4**: 具体类型调用未定义方法报 E0305 错误（新增错误码）
- **I9**: `free_type_vars_in_env` 量化变量 ID 通过 subst 解析后再排除
- **I10**: `substitute_type` record tail 非 var 情况与 `apply` 行为一致（merge/drop）
- **I11**: `?` 操作符 fail effect 使用 fresh var 替代硬编码 `fail<Unit>`
- **I12**: `infer_handle` 过滤前先 `apply_to_effect_row` 解析 effect row tail
- **I13**: `impl_methods` standalone impl 优先，trait impl 不覆盖已有条目
- **I14**: dict_closure 包装器转发 evidence 参数
- **I15**: Lambda codegen 声明 evidence 参数（不再依赖闭包捕获）
- **I16**: 新增 `npm run test:e2e` + `npm run test:all` 脚本
- **I17**: LSP Hover 对 struct/enum/effect/trait 声明显示完整签名
- **I18**: LSP Completion 遍历 HIR 收集函数参数和局部变量
- **I19**: `::` enum 构造器补全代码就绪（待 `::` token 实现后激活）
- **I20**: LSP Rename 验证新名字为合法标识符
- **I21**: Diagnostic relatedInformation 过滤内置定义无效 URI
- **I23**: catch 表达式需 type name 后紧跟 `fn` 才识别为 typed catch
- **M2**: Struct literal 缺字段和多余字段报 E0203 错误
- 3 个新 e2e 负向测试 + 11 个新单元测试

### Phase 3a Batch 1 ✅ — 控制流 + let 不可变性 (2026-05-19)

- **let 不可变性强制**：`let` 绑定禁止赋值（E0205），`var` 保持可变。TypeEnv 通过 `mutable_vars: Set<number>` 追踪可变 def_id
- **while 循环**：`while condition { body }` 全管线实现，condition 必须为 Bool，codegen 生成 JS `while`
- **break / continue**：循环内控制流，`loop_depth` 追踪循环嵌套层级，循环外使用报 E0206
- **Range 表达式 `..`**：Rust 风格中缀运算符，Pratt parser `Prec.Range`（高于 Compare 低于 AddSub），生成 `RangeExpr` AST 节点，类型为 `Range<Int>`（内部 EnumType 表示）
- **for..in 循环**：`for x in expr { body }` 语句，iterable 为通用 Expr（Batch 1 仅支持 Range），binding 有 def_id（LSP 跳转/引用/重命名可用）
- **Codegen**：`for x in range` 优化为 `for (let x = start; x < end; x++)`，零运行时开销；非 range iterable 回退到 `for (const x of iter)`
- AST + HIR 新增 4 个 Stmt 变体 + 1 个 Expr 变体，zonk + LSP 全部支持
- 6 个新 e2e 测试 + 6 个新单元测试 + 2 个负向测试

## 已知限制

### Effect / Codegen 限制

- **Handler 支持 tail-resumptive + abort 两种语义**：非 abort effect（io/custom）的 handler 返回值即 resume 值，计算继续；`fail.raise` 为 abort 语义。不支持 post-resume handler（resume 后继续执行额外代码）
- **Trait dictionary dispatch 不转发 evidence**：trait 方法带 effect 时缺少 evidence 参数（trait dict closure 已支持高阶传递）
- **Untyped `or`/`catch` 一刀切移除所有 fail effect**：typed catch 可选择性捕获特定类型，untyped 仍全部移除
- **`or` 按类型 dispatch，不叠加语义**：`expr or default` 根据 `expr` 的类型选择 Option path（unwrap）或 fail path（try/catch），两者不混合。若表达式既是 `Option<T>` 又带 `fail` effect，`or` 只处理 Option 解包，fail 仍需调用方额外处理（设计决策："一种事一种写法"）
- **表达式位置的 block/if 包含 `return` 时 IIFE 仍会截获**：语句位置（函数体、expr_stmt）已修复（C10），但 `let x = { return y; 0 }` 这类表达式位置的 return 仍被 IIFE 截获。实践中极少遇到。

### 类型系统限制

- Record row types 仅在参数位置使用（无匿名 record 字面量、无 spread 运算符）
- Refinement `where` 子句只解析不验证（tokens 被消费后丢弃）
- Trait 系统暂不支持：关联类型、supertrait 继承、`dyn Trait` 动态分发
- `pub` 可见性仅解析存储，checker 不强制执行访问控制
- 穷尽性检查支持嵌套模式递归检查（每列独立检查，多字段交叉组合不验证）

### LSP 限制

- `::` enum 构造器补全需要文档可编译（`::` 尚未作为独立 token 实现，M12）

### 基础设施限制

- 不含模块系统（无 `mod`/`import`/`export`）
- 无 `loop` 无限循环语法（`while true` 可替代），无 range 以外的自定义迭代器
- 无 CI 管线（lint + test 依赖手动执行）
- LSP server 为单文件编译（无跨文件引用，无增量编译）
- Checker 多错误恢复：declaration 级（同一函数内仍停于首错）
- E2E 测试通过 `npm run test:e2e` 运行，`npm run test:all` 运行全部（单元 + E2E）

## MVP 路线图

### Phase 1：可以玩的编译器 ✅ (2026-05-16)
- Parser + HM 类型推断 + Effect 推断
- struct + enum + pattern matching + UFCS
- fail effect 4 层甜度 + JS 代码生成

### Phase 2：有手感的语言
- ✅ **Session 1**: Trait 系统 + Dictionary Passing (2026-05-16)
- ✅ **Session 2**: Evidence Passing Effect System (2026-05-17)
- ✅ **Session 2b**: Cell<T> + mut + resume (2026-05-17)
- ✅ **Session 3**: Row Polymorphism (2026-05-17)
- ✅ **Session 4a**: `--error-format=llm` + DiagnosticSink (2026-05-17)
- ✅ **Session 4b**: LSP server + VSCode Extension (2026-05-18)
- ✅ **Session 5**: Option<T> + `?` postfix + `try` block + `or` 双用途 + typed catch (2026-05-17)

### Phase 3a：自举准备
- ✅ **Batch 1**: 控制流 + let 不可变性（while/for..in/break/continue/E0205/E0206）(2026-05-19)
- **Batch 2**: 核心类型方法（字符串方法 + List\<T\>）
- **Batch 3**: 扩展集合 + 类型窄化（Map\<K,V\> + Set\<T\> + match 窄化）
- **Batch 4**: 模块系统（import/export）

### Phase 3b：研究向扩展
- `mut<S>` 参数化 effect（当前 `mut` 无类型参数，Cell<T> 泛型保证类型安全）
- Full algebraic effect（post-resume handler，需要 delimited continuation）
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

# 启动 LSP server（stdio 传输，供编辑器连接）
node compiler/dist/cli.js lsp

# 类型检查 + LLM 格式错误输出
node compiler/dist/cli.js check --error-format=llm examples/effects.ring

# 运行编译器单元测试（209 tests，自动先编译）
cd compiler && npm test

# 仅 TypeScript 类型检查（不编译输出）
cd compiler && npm run typecheck

# 机械 lint 检查（tsc strict + as any/ts-ignore/console.log 扫描）
cd compiler && npm run lint

# 调试模式（打印中间 AST/HIR/JS）
node compiler/dist/cli.js run --debug examples/hello.ring
```
