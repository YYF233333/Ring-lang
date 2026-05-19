# CLAUDE.md

## 项目概述

Ring-lang：面向大型多端应用的编程语言，转译到 JavaScript/V8 运行。

核心特性：代数 effect system、refinement types、ML 级类型推断、row polymorphism + OOP 手感模拟。设计目标：LLM vibe coding 友好性优于 TypeScript。

完整设计文档见 `docs/design.md`（含实现状态附录）。

**当前状态：Phase 2 全部完成 + Phase 3a Batch 1-7 完成** — 编译器支持 Option<T>（统一为 EnumType） + `?`/`try`/`or` 双用途 + typed catch + row polymorphism + evidence passing + trait 系统（含高阶 dict closure + TypeScheme bounds 传递） + diagnostics 管线 + declaration 级多错误恢复 + **LSP server（def_id 作用域感知 + 跨模块类型信息）+ VSCode 插件** + **let 不可变性强制（E0205）** + **while 循环 + break/continue（E0206）** + **`for x in 0..N` range 循环（Rust 风格 `..` / `..=` 运算符）** + **Str 内置方法（16 个）** + **List\<T\> 可变集合类型（18 个方法 + `[]` 字面量 + for..in 迭代 + HOF effect 多态）** + **Tuple 类型（`(T1, T2)` 字面量 + 模式匹配 + `let (a, b) = expr` 解构）** + **Map\<K,V\> 可变键值集合（13 个方法 + `map_from`/`map_new` 构造 + HOF effect 多态）** + **Set\<T\> 可变集合（13 个方法 + 集合运算 + for..in 迭代）** + **if-let 语句（单 arm 模式匹配）** + **模块系统（`use` 导入 + `pub use` 再导出 + `pub` 可见性强制 + 多文件编译 + 单文件 JS bundle）** + **`extern fn` FFI 声明（JS 函数直接映射 + 跨模块导出）** + **标准库（`std/` Ring 源码 + `extern type` 声明 + prelude 自动加载）** + **Enum 命名字段（声明 + 构造 + 模式匹配 + field punning + partial match `..`）**。258 个编译器单元测试 + 329 个端到端测试（含 94 正向 + 26 负向 + 3 LLM 格式 + 25 多文件模块）全部通过。

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
│   │   │   ├── env.ts                  类型环境 + 作用域 + TypeScheme（含 bounds）
│   │   │   ├── builtins.ts             内置类型/方法注册（从 env.ts 拆分）
│   │   │   ├── unify.ts                HM Unification + Row Unification（含 EffectRowType）+ 替换
│   │   │   ├── infer.ts                Algorithm W 类型推断
│   │   │   ├── exhaustive.ts           穷尽性检查（Maranget 风格 pattern matrix）
│   │   │   ├── checker.ts              主入口：check(Program) → HProgram
│   │   │   ├── zonk.ts                 Zonk 工具（apply subst + label type var names）
│   │   │   └── checker.test.ts         Checker 测试（47 tests）
│   │   ├── codegen/
│   │   │   ├── runtime.ts              JS 运行时辅助代码
│   │   │   ├── codegen.ts              HIR → JavaScript 生成
│   │   │   └── codegen.test.ts         Codegen 测试（31 tests）
│   │   ├── diagnostics/
│   │   │   ├── index.ts                DiagnosticSink、CollectingSink、Diagnostic 类型
│   │   │   ├── codes.ts                错误码目录（E0101-E0706，E0104/E0401 已清理）
│   │   │   ├── formatter.ts            format_human + format_llm 输出格式化
│   │   │   ├── suggestions.ts          建议增强框架（框架就绪，规则待填充）
│   │   │   └── diagnostics.test.ts     Diagnostics 测试（10 tests）
│   │   ├── lsp/
│   │   │   ├── server.ts              LSP server 主入口（connection + handler 注册）
│   │   │   ├── document-manager.ts    文档状态管理 + 编译缓存
│   │   │   ├── utils.ts               Span ↔ LSP 坐标转换
│   │   │   ├── hir-visitor.ts         共享 HIR 遍历器（消除 feature 间重复）
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
│   │   ├── modules/
│   │   │   ├── resolver.ts            模块解析（文件发现 + 依赖图 + 拓扑排序 + 循环检测）
│   │   │   ├── exports.ts             ModuleExports 类型 + extract_exports 导出提取
│   │   │   ├── compiler.ts            多文件编译编排器（resolve → parse → check → codegen → bundle）
│   │   │   └── resolver.test.ts       Module resolver 测试（14 tests）
│   │   └── cli.ts                      ring build/run/check/lsp 入口 + --error-format + 多文件自动检测
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
├── std/
│   ├── io.ring                         标准库：print/assert/panic/exit
│   ├── list.ring                       标准库：extern type List<T> + 10 非 HOF 方法
│   ├── map.ring                        标准库：extern type Map<K,V> + 9 方法 + map_new/map_from
│   ├── set.ring                        标准库：extern type Set<T> + 9 方法 + set_new/set_from
│   └── str.ring                        标准库：impl Str 12 方法
├── examples/
│   ├── hello.ring                      基本示例（可运行）
│   └── effects.ring                    Effect 系统示例（可类型检查）
└── tests/
    ├── cases/                          端到端测试用例（84 正向 + 22 负向 = 106 个 .ring 文件）
    └── e2e.test.ts                     端到端测试运行器（275 tests: run + check + build + negative + llm-format）
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

## 测试策略：从测试到类型安全的渐进过渡

Ring 的长期目标是"编译通过 ≈ 证明正确"（弱/强形式化验证）。随着类型系统变强（effect tracking → linear types → refinement types → dependent types），编译器能验证的正确性越来越多，测试覆盖的范围自然收缩。**测试应该写在类型系统验证能力的边界上。**

### 测试分类与投资策略

**E2E 语义测试（`tests/cases/*.ring`）— 大量写，永远保留**

本质上是语言规范的可执行版本。每个语义点一个测试文件。自举时作为回归测试，形式化阶段作为 spec 文档。不浪费。

**负面测试（期望编译错误）— 大量写，含 pending**

定义类型系统的目标边界。即使当前还没有对应特性（如 linear types），也可以写 pending 测试标记为"预期将来会通过"。Pending 测试是路线图的可执行版本——比文档里写"将来要做 X"精确得多。

**编译器内部单元测试 — 只对核心算法写**

HM unification、effect inference、exhaustiveness checking 等核心算法值得单元测试（自举时算法逻辑会迁移）。不对 AST 节点字段名、内部数据结构布局写单元测试——自举重写时全部作废。

**Property-based 测试 — 过渡期最有价值**

弱形式化验证的穷人版。专注写 soundness property：
- "类型正确的程序不 panic"
- "effect 标注正确的程序没有未追踪的副作用"
- "exhaustive match 不遗漏分支"

每个 property 将来直接变成一条 theorem。

### 写测试前的判断标准

1. **这个测试在自举后还有用吗？** 语义层面（E2E + negative + property）→ 有用。实现层面（TS 内部单元）→ 大概率作废。
2. **这个 bug 将来会被类型系统捕获吗？** 如果 refinement types 落地后编译器自动拒绝这类代码，当前的运行时测试是临时替身，标注 `// TODO: will be caught by refinement types` 即可。
3. **不要追求覆盖率数字。** 度量语义覆盖（多少语言特性有 E2E 测试），不度量代码行覆盖。
4. **Bug fix 回归测试写 E2E 层**。修 codegen bug 时写一个 E2E 测试验证正确行为，不写"第 X 行生成的 JS 应该是 Y"——codegen 会被替换。

### 演进路径

```
现在：E2E 大量写 + 负面测试大量写 + 算法单元测试 + 开始引入 property-based
自举后：测试迁移到 Ring，TS 单元测试随 TS 代码消失，property-based 成为主力
Refinement types 后：部分运行时测试被类型系统替代，标注的 TODO 可以清理
形式化后：E2E/负面测试保留为 spec 文档，property 全部升级为 theorem
```

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
- 错误码目录（E01xx parse, E02xx checker, E03xx type, E04xx effect, E05xx trait, E06xx exhaustive）
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
- **Checker scope 安全**：所有 `push_scope`/`pop_scope` 加 try/finally 保护，type_error 抛出不再泄漏 scope/loop_depth
- AST + HIR 新增 4 个 Stmt 变体 + 1 个 Expr 变体，zonk + LSP 全部支持（含 for_in binding 补全、def_id 引用）
- 8 个新 e2e 测试 + 12 个新单元测试 + 2 个负向测试

### Phase 3a Batch 2 ✅ — Str Methods + List\<T\> (2026-05-19)

- **Str 内置方法**（12 个）：len, contains, starts_with, ends_with, slice, trim, to_upper, to_lower, replace（全替换 replaceAll）, split, char_at, index_of。全部纯函数，通过 impl_methods.set("Str", ...) 注册，codegen 生成 `Str_method(self, ...)` 运行时调用
- **List\<T\> 内置类型**：可变集合，StructType 表示，JS Array 底层。push/concat/reverse 原地修改，HOF 方法返回新 List
- **`[expr, ...]` 列表字面量语法**：Parser 解析 `LBracket` → 逗号分隔表达式 → `RBracket`，支持尾逗号。空列表 `[]` 无法推断 T 时报 E0301
- **List 方法**（18 个）：
  - 读取 6：len, get, first, last, contains, is_empty
  - 变换 4：push, concat, slice, reverse（返回新 List）
  - HOF 5：map, filter, flat_map, any, all（effect 多态——回调的 effect 自动传播）
  - 折叠 3：fold(init, f)（Rust 风格参数序）, find, flat_map
- **HOF effect 多态**：map/filter/fold 等的回调函数参数使用 effect row 变量，回调的 effect 自动传播到外层。Codegen 内联 JS Array 方法调用（不走 runtime 函数），callback 通过 JS 闭包捕获 evidence
- **for..in 扩展**：`for x in list { ... }` 编译为 JS `for...of`，checker 接受 Range 和 List 两种 iterable
- **Checker 扩展**：infer_method_call 支持 primitive type 方法查找（Str/Int/Float → impl_methods key）
- **LSP**：Str/List 方法 dot-completion（primitive type 方法补全），list_lit HIR 遍历全部 LSP feature 支持
- **match 语句 codegen 修复**：`emit_match_stmt` 改用 labeled block (`__ring_match: { ... }`) + `break __ring_match`。修复同一函数内多个 match 语句的两个 bug：(1) `const __ring_m` 重复声明（block scope 隔离），(2) discard 模式匹配成功后 fallthrough 到 `__match_fail`（break 退出）
- AST + HIR 新增 1 个 Expr 变体（ListLitExpr / HListLit），runtime 新增 22 个辅助函数
- 9 个新正向 e2e 测试 + 1 个负向测试 + 1 个 match 回归测试

### Phase 3a Batch 3 ✅ — Tuple + Map\<K,V\> + Set\<T\> + if-let (2026-05-19)

- **Tuple 类型**：`TupleType { kind: "tuple", elements: Type[] }` 结构类型。`(expr, expr)` 字面量编译为 JS 数组，`(Type, Type)` 类型注解，`(pat, pat)` 模式匹配（含穷尽性按列检查）。`let (a, b) = expr` 解构绑定（`LetDestructureStmt` / `HLetDestructureStmt`）。HM unification 逐元素统一
- **Map\<K,V\> 可变键值集合**：StructType 表示，JS Map 底层。`map_from([(k,v)])` / `map_new()` 构造。13 个方法：读取 7（len/get/contains_key/is_empty/keys/values/entries）+ 变换 2（insert/remove 原地修改，返回 Unit）+ HOF 4（map_values/filter/fold/any，effect 多态，返回新值）。HOF 内联 IIFE 生成
- **Set\<T\> 可变集合**：StructType 表示，JS Set 底层。`set_from(list)` / `set_new()` 构造。13 个方法：读取 4（len/contains/is_empty/to_list）+ 变换 5（insert/remove 原地修改返回 Unit，union/intersect/difference 返回新 Set）+ HOF 4（filter/fold/any/all，effect 多态，返回新值）。for..in 迭代支持
- **if-let 语句**：`if let pattern = expr { body } else { else_body }` 单 arm 模式匹配。else 分支可选。`IfLetStmt` / `HIfLetStmt` AST/HIR 节点。主用途：Option\<T\> 解包（配合 `Map.get()` 返回 `Option<V>`）
- **Parser 换行感知修复**：Pratt 解析器 `(` 作为后缀运算符时检查是否与前缀表达式同行，避免跨行 tuple 被误解析为函数调用
- AST + HIR 新增 TupleLitExpr/HTupleLit + LetDestructureStmt/HLetDestructureStmt + IfLetStmt/HIfLetStmt，Pattern 新增 TuplePattern
- runtime 新增 22 个 Map/Set 辅助函数 + 4 个构造函数
- 16 个新正向 e2e 测试 + LSP 全面支持所有新节点

### Phase 3a Batch 4 ✅ — 模块系统 (2026-05-19)

- **`use` 导入语法**：Rust 风格路径分隔符 `::`。支持单符号 `use parser::Token`、多符号 `use parser::{Token, parse}`、整模块 `use parser`、重命名 `use parser as p`、嵌套路径 `use checker::env::TypeEnv`、名称别名 `use parser::{Token as T}`
- **`pub use` 再导出**：模块门面模式，`pub use inner::greet` 将依赖模块的导出提升为当前模块的公开接口
- **`pub` 可见性强制**：多文件模式下，未标记 `pub` 的声明不可被其他模块导入。单文件模式保持向后兼容（不强制）
- **模块解析**：文件 = 模块，`::` 映射到文件系统 `/`。从入口文件目录作为项目根。禁止循环依赖（Kahn 拓扑排序 + 环检测）
- **多文件编译**：编译器自动检测（`use` 声明存在即切换多文件模式）。BFS 发现依赖 → 拓扑排序 → 按序 parse → check（注入依赖 ModuleExports）→ codegen（`module$name` 前缀命名空间化）→ 单文件 JS bundle 输出
- **Codegen 命名空间化**：`qualify()` 方法为每个模块的顶层声明添加 `module$` 前缀（如 `parser$parse`、`parser$Token`），跨模块引用通过 `imports_map` 解析。内置类型（Option、List 等）和运行时函数不加前缀
- **E07xx 错误码**：E0701（导入非 pub 符号）、E0702（模块未找到）、E0703（模块中无此符号）、E0704（循环依赖）、E0705（重复导入）、E0706（use 不在文件顶部）
- **LSP 跨模块支持**：文档含 `use` 声明时自动解析依赖模块，注入 exports 提供正确的类型检查、hover 和补全
- Lexer 新增 3 个 token（Use、As、ColonColon），AST 新增 UseDecl/UsePath/UseImport 类型
- 新增 `compiler/src/modules/` 目录（resolver + exports + compiler 三个文件）
- 14 个 resolver 单元测试 + 7 个 parser 单元测试 + 11 个正向 e2e 测试（含跨模块 struct 方法/Option/effect/trait）+ 11 个 check 测试 + 1 个负向测试

### Phase 3a Batch 5 ✅ — extern fn + 集合可变化 (2026-05-19)

- **`extern fn` FFI 声明**：`extern fn name(params) -> RetType` 声明外部 JS 函数，函数名直接映射 JS 全局函数名。支持 `pub` 可见性、跨模块导入导出。Lexer 新增 `Extern` 关键字，AST/HIR 新增 `ExternFnDecl`/`HExternFnDecl` 声明类型。Checker 注册函数签名到类型环境（无函数体，类型从声明推断）。Codegen 单文件模式不生成代码（JS 函数假设已存在），多文件模式生成 `const module$name = name` 别名。LSP 全面支持（hover 显示 `extern fn` 签名、symbols 大纲、定义跳转、补全）
- **集合可变化（breaking change）**：List/Map/Set 的修改方法改为原地操作（返回 Unit）：List 的 `push`/`concat`/`reverse`、Map 的 `insert`/`remove`、Set 的 `insert`/`remove` 原地修改。HOF 方法（map/filter/fold 等）和派生方法（slice/union/intersect/difference）保持返回新值不变
- ModuleExports 新增 `extern_values: Set<string>` 字段，跨模块导入 extern fn 时不添加模块前缀（保留原始 JS 函数名）
- 2 个新正向 e2e 测试（单文件 extern_fn_basic + 多文件 modules/extern_fn）

### Phase 3a Batch 6 ✅ — 标准库 + extern type (2026-05-19)

- **`extern type` 声明**：`extern type Name<T>` 声明 opaque 类型（运行时存在但表示不透明），不可构造、不可解构、不可访问字段。类型系统中表示为 `StructType(fields: [])`。全管线支持：AST/HIR 新增 `ExternTypeDecl`/`HExternTypeDecl`、Parser 解析 `extern type`、Checker 注册为 StructType、Codegen 不生成代码、LSP hover/symbols/definition/completion 全部支持、Module exports 导出 extern type
- **`impl` 块内 `extern fn` 方法**：允许 `impl<T> ExternType { pub extern fn method(self: ExternType<T>) -> RetType }` 语法，为 extern type 和 primitive 类型（如 Str）声明外部实现的方法。Checker 正确处理 impl 级别类型参数，创建多态 TypeScheme
- **Ring 标准库（`std/` 目录）**：5 个 Ring 源码文件声明内置类型和方法：
  - `std/io.ring`：`print<T>`、`assert`、`panic`、`exit`
  - `std/list.ring`：`extern type List<T>` + 10 个非 HOF 方法（len/get/first/last/contains/is_empty/push/concat/slice/reverse）
  - `std/map.ring`：`extern type Map<K,V>` + 9 个方法 + `map_new`/`map_from`
  - `std/set.ring`：`extern type Set<T>` + 9 个方法 + `set_new`/`set_from`
  - `std/str.ring`：`impl Str` 12 个方法
- **Prelude 自动加载**：编译器启动时自动解析 `std/*.ring` 并注入 TypeEnv，单文件和多文件模式均支持。加载顺序：builtins（Option/Cell/io/fail）→ prelude（stdlib 声明）→ HOF intrinsics（effect 多态方法）
- **builtins.ts 瘦身**：从 455 行缩减到 ~280 行。移除了所有非 HOF 方法注册（44 个方法 + 4 个全局函数），仅保留 Option/Cell/io/fail 核心类型和 15 个需要 effect 多态的 HOF 方法（List 7 + Map 4 + Set 4）
- **`register_impl` 升级**：正确处理 impl 块的类型参数，创建多态 TypeScheme（之前 `type_vars: []` 对现有代码偶然正确但不严谨）

### Phase 3a Batch 7 ✅ — Enum 命名字段 (2026-05-19)

- **Enum 命名字段声明**：花括号语法 `Variant { field: Type, ... }` 区分于位置字段的圆括号语法 `Variant(Type, ...)`。两者可在同一 enum 中共存。AST `EnumVariant` 新增 `named_fields?: NamedEnumField[]`，类型系统 `EnumVariant` 和 `EnumDef` 新增 `field_names?: string[]`
- **命名变体构造**：`Variant { field: expr, ... }` 语法，复用 struct 字面量解析路径。Checker 检测名称为 enum variant 时生成 `HNamedVariantConstruct` HIR 节点。支持 field punning（`Variant { field }` = `Variant { field: field }`）。Struct 字面量同步支持 punning
- **命名模式匹配**：`Variant { field, field: binding, .. }` 语法。新增 `NamedConstructorPattern` AST 模式。支持 field punning（`{ field }` = `{ field: field }`）和 partial match（`..` 忽略其余字段）
- **穷尽性检查**：命名字段模式通过 `named_pattern_to_positional` 转换为位置形式，复用现有 Maranget 矩阵算法
- **Codegen**：命名字段变体的 JS 构造函数使用字段名作为参数名和属性名（`{ _tag: "Variant", field1, field2 }`），模式匹配通过字段名访问（`target.field1`）
- **错误诊断**：构造时缺失字段或使用不存在的字段名报 E0203
- 全管线支持：Zonk、LSP（hir-visitor + completion + definition）均处理新节点
- 3 个正向 e2e 测试（基本 + 泛型 + 混合位置/命名）+ 2 个负向测试（错误字段名 + 缺失字段）

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
- `pub` 可见性在多文件模式下强制执行，单文件模式不强制（向后兼容）
- 穷尽性检查支持嵌套模式递归检查（每列独立检查，多字段交叉组合不验证）
- `List.contains` / `List.find` / `Map` key 查找 / `Set.contains` 等使用 JS `===` 引用相等——对 primitive 正确，对 struct/enum 仅比较引用。待 Eq trait 实现后升级为结构相等
- Tuple 无 `.0` / `.1` 位置字段访问（需解构绑定或模式匹配访问元素）

### LSP 限制

- `::` enum 构造器补全需要文档可编译
- 跨文件跳转定义和查找引用尚未实现（hover 和类型检查已支持跨模块）

### 基础设施限制

- 无 `loop` 无限循环语法（`while true` 可替代），无 Range/List/Set/Map 以外的自定义迭代器
- `for..in` 不支持 Map 直接迭代（需 `for entry in map.entries()` + 解构）
- 无 CI 管线（lint + test 依赖手动执行）
- 模块系统不支持：`sig` 签名、first-class modules、inline `mod` 块、capability 限制、相对路径（`super::`/`self::`）
- Checker 多错误恢复：declaration 级（同一函数内仍停于首错）
- E2E 测试通过 `npm run test:e2e` 运行（329 tests），`npm run test:all` 运行全部（258 单元 + 329 E2E）

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
- ✅ **Batch 2**: 核心类型方法（Str 方法 12 个 + List\<T\> 18 个方法 + `[]` 字面量 + for..in 扩展）(2026-05-19)
- ✅ **Batch 3**: Tuple + Map\<K,V\> + Set\<T\> + if-let (2026-05-19)
- ✅ **Batch 4**: 模块系统（`use` 导入 + `pub use` 再导出 + `pub` 可见性 + 多文件编译）(2026-05-19)
- ✅ **Batch 5**: `extern fn` FFI 声明 + List/Map/Set 集合可变化（breaking change）(2026-05-19)
- ✅ **Batch 6**: 标准库（`extern type` + `impl extern fn` + `std/` Ring 源码 + prelude 自动加载）(2026-05-19)
- ✅ **Batch 7**: Enum 命名字段（声明 + 构造 + 模式匹配 + field punning + partial match `..`）(2026-05-19)

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

# 运行编译器单元测试（233 tests，自动先编译）
cd compiler && npm test

# 仅 TypeScript 类型检查（不编译输出）
cd compiler && npm run typecheck

# 机械 lint 检查（tsc strict + as any/ts-ignore/console.log 扫描）
cd compiler && npm run lint

# 调试模式（打印中间 AST/HIR/JS）
node compiler/dist/cli.js run --debug examples/hello.ring
```
