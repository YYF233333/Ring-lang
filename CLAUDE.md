# CLAUDE.md

## 项目概述

Ring-lang：面向大型多端应用的编程语言，转译到 JavaScript/V8 运行。

核心特性：代数 effect system、refinement types、ML 级类型推断、row polymorphism + OOP 手感模拟。设计目标：LLM vibe coding 友好性优于 TypeScript。

完整设计文档见 `docs/design.md`（含实现状态附录）。

**当前状态：Phase 2 全部完成 + Phase 3a Batch 1-8 完成 + 自举准备修复 + 设计评审修复完成。** 编译器已覆盖完整的类型系统（HM 推断 + effect system + trait + row polymorphism）、控制流、集合类型（List/Map/Set/Tuple）、模块系统、FFI、标准库、auto-derive traits（Eq/Clone/Debug/Ord）、LSP + VSCode 插件。详见下方"已实现功能"摘要。

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
│   │   ├── types/index.ts              Type、Effect、EffectRow 表示 + BUILTIN_* 常量 + type_to_builtin_name
│   │   ├── hir/index.ts                HIR 节点定义 + 共享约定（variant_js_name, trait_dict_name, evidence_param_name）
│   │   ├── builtin-methods.ts          内置方法名注册表（*_METHODS 常量，checker + codegen 共享）
│   │   ├── errors.ts                   诊断/错误类型 + assertNever 穷尽检查
│   │   ├── parser/
│   │   │   ├── lexer.ts                手写词法分析器
│   │   │   ├── parser-ctx.ts           ParserCtx 接口 + Prec 优先级枚举
│   │   │   ├── parser.ts               Parser 类薄壳 + parse_program/parse_stmt 调度
│   │   │   ├── parser-decl.ts          声明解析（fn/struct/enum/impl/trait/effect/extern/use）
│   │   │   ├── parser-expr.ts          Pratt 表达式解析 + 类型表达式 + 模式解析
│   │   │   └── parser.test.ts          Parser 测试
│   │   ├── checker/
│   │   │   ├── env.ts                  类型环境 + 作用域 + TypeScheme（含 bounds）
│   │   │   ├── builtins.ts             Re-export shell（向后兼容入口）
│   │   │   ├── builtins-core.ts       核心内置注册（effects/Cell/Option/Eq/Clone/Ord/Debug traits）
│   │   │   ├── builtins-hof.ts        HOF 方法注册（List/Map/Set/Option 的 effect 多态方法）
│   │   │   ├── derive.ts              Auto-derive fixpoint pass（Eq/Clone/Debug/Ord 自动派生）
│   │   │   ├── unify.ts                HM Unification + Row Unification（含 EffectRowType）+ 替换
│   │   │   ├── infer-ctx.ts            InferCtx 接口 + 16 个 helper 函数（type resolution/generalize/bind_pattern 等）
│   │   │   ├── infer.ts                InferEngine 类薄壳 + check/infer_expr 调度
│   │   │   ├── infer-stmt.ts          语句推断（let/var/assign/return/while/for/break/continue/destructure/if-let）
│   │   │   ├── infer-register.ts       Pass 1 声明注册（register_struct/enum/trait/impl 等）
│   │   │   ├── infer-expr.ts           19 个表达式推断函数（call/match/if/lambda/handle 等）
│   │   │   ├── infer-modules.ts        多模块支持（inject_module_exports/resolve_uses）
│   │   │   ├── exhaustive.ts           穷尽性检查（Maranget 风格 pattern matrix）
│   │   │   ├── checker.ts              主入口：check(Program) → HProgram
│   │   │   ├── zonk.ts                 Zonk 工具（apply subst + label type var names）
│   │   │   └── checker.test.ts         Checker 测试
│   │   ├── codegen/
│   │   │   ├── runtime.ts              JS 运行时辅助代码
│   │   │   ├── codegen-ctx.ts          CodegenCtx 接口 + safe_ident + 辅助函数
│   │   │   ├── codegen.ts              CodeGenerator 类薄壳 + generate() 入口
│   │   │   ├── codegen-decl.ts         声明 codegen（fn/struct/enum/impl/trait/effect）
│   │   │   ├── codegen-stmt.ts         语句 codegen + match 语句 + pattern condition/bindings
│   │   │   ├── codegen-expr.ts         表达式 codegen（call/struct_lit/match/if/lambda 等）
│   │   │   ├── codegen-derive.ts      Auto-derive trait codegen（Eq/Clone/Debug/Ord）
│   │   │   └── codegen.test.ts         Codegen 测试
│   │   ├── diagnostics/
│   │   │   ├── index.ts                DiagnosticSink、CollectingSink、Diagnostic 类型
│   │   │   ├── codes.ts                错误码目录（E0101-E0706，E0104/E0401 已清理）
│   │   │   ├── formatter.ts            format_human + format_llm 输出格式化
│   │   │   └── diagnostics.test.ts     Diagnostics 测试
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
│   │   │   └── lsp.test.ts            LSP 测试
│   │   ├── modules/
│   │   │   ├── resolver.ts            模块解析（文件发现 + 依赖图 + 拓扑排序 + 循环检测）
│   │   │   ├── exports.ts             ModuleExports 类型 + extract_exports 导出提取
│   │   │   ├── compiler.ts            多文件编译编排器（resolve → parse → check → codegen → bundle）
│   │   │   └── resolver.test.ts       Module resolver 测试
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
│   ├── io.ring                         标准库：print/assert(cond,msg)/panic/exit/json_stringify
│   ├── list.ring                       标准库：extern type List<T> + 17 非 HOF 方法 + list_clone
│   ├── map.ring                        标准库：extern type Map<K,V> + 10 方法 + map_new/map_from/map_clone
│   ├── set.ring                        标准库：extern type Set<T> + 10 方法 + set_new/set_from/set_clone
│   ├── str.ring                        标准库：impl Str 16 方法
│   └── num.ring                        标准库：Int::to_str, Float::to_str, parse_int, parse_float
├── examples/
│   ├── hello.ring                      基本示例（可运行）
│   └── effects.ring                    Effect 系统示例（可类型检查）
└── tests/
    ├── cases/                          端到端测试用例（正向 + 负向 .ring 文件）
    └── e2e.test.ts                     端到端测试运行器（run + negative + modules + llm-format + determinism，concurrency 3）
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

### Phase 1 ✅ — 可以玩的编译器 (2026-05-16)

Lexer + Parser + HM 类型推断 + Effect 推断 + struct/enum/match + UFCS + `or`/`catch`/`handle` + 字符串插值 + JS codegen + CLI

### Phase 2 ✅ — 有手感的语言 (2026-05-16 ~ 2026-05-19)

| Session | 主题 | 关键特性 |
|---------|------|----------|
| S1 | Trait 系统 | `trait`/`impl Trait for Type`、泛型约束 `<T: A + B>`、dictionary passing codegen |
| S2 | Effect System | evidence passing（所有 effect 统一为参数传递）、handler codegen（abort 语义） |
| S2b | Cell\<T\> | `Cell<T>` 运行时类型、`mut` effect |
| S3 | Row Polymorphism | record row types `{f: T, ..rest}`、Koka 风格 row unification |
| S4a | Diagnostics | `--error-format=human\|llm`、DiagnosticSink 多错误收集、E0xxx 错误码体系 |
| S4b | LSP + VSCode | 8 项 LSP 功能（hover/completion/definition/references/rename/symbols/codeAction/diagnostics）、TextMate 语法高亮 |
| S5 | Option\<T\> | `T?` 语法、`?` postfix、`try` block、`or` 双用途、typed catch |
| Review | Bug 修复 | 严格相等 codegen、嵌套模式匹配、guard + if-chain match、effect row merge、trait bounds 传递、def_id 全链路、IIFE return 修复等 |

### Phase 3a ✅ — 自举准备 (2026-05-19 ~ 2026-05-20)

| Batch | 主题 | 关键特性 |
|-------|------|----------|
| 1 | 控制流 | `let` 不可变性（E0205）、`while`/`break`/`continue`（E0206）、`for x in 0..N` range 循环 |
| 2 | Str + List | Str 16 个方法、List\<T\> 26 个方法 + `[]` 字面量 + HOF effect 多态 + for..in |
| 3 | Tuple + Map + Set + if-let | Tuple `(T1, T2)` + 解构、Map\<K,V\> 14 个方法、Set\<T\> 14 个方法、if-let 语句 |
| 4 | 模块系统 | `use` 导入 + `pub use` 再导出 + `pub` 可见性 + 多文件编译 + 单文件 JS bundle |
| 5 | FFI + 集合可变化 | `extern fn` 声明、List/Map/Set 修改方法改为原地操作 |
| 6 | 标准库 | `extern type` 声明、`std/` Ring 源码 6 文件、prelude 自动加载 |
| 7 | Enum 命名字段 | `Variant { field: Type }` 声明/构造/模式匹配、field punning、partial match `..` |
| 修复 | 自举 Blocker | `var` 参数 + `var self`（可变参数/方法）、struct update 语法 `{ ..base, field: val }` |
| 修复 | 设计评审 | `sort()` 数值比较器修复 + `sort_by(cmp)` HOF、`concat` 返回新 List + `extend` 原地追加、`Enum::Variant` 限定语法 |
| 修复 | 设计评审 P2 | `list_clone`/`set_clone`、`List.pop()`、`Str.pad_end()`、集合 `clear()`、`Option<T>` 方法（is_some/is_none/unwrap_or/map/and_then） |
| 8 | Auto-derive Traits | Eq/Clone/Debug/Ord 四个 trait auto-derive、`==`/`!=` Eq 解糖、`<`/`>`/`<=`/`>=` Ord 解糖、fixpoint derive pass、E0307/E0308 错误码 |

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
- 穷尽性检查支持嵌套模式递归检查（含 Option<Option<T>> 等嵌套 enum）；多字段交叉组合不验证
- `List.contains` / `List.find` / `Map` key 查找 / `Set.contains` 等仍使用 JS `===` 引用相等——`==` 运算符已解糖为 Eq trait dispatch（struct/enum 结构相等），但集合内部方法尚未升级
- 深层嵌套泛型类型（如 `Pair<Pair<Int, Int>, Int>`）的 trait method UFCS 调用不支持——auto-derive codegen 和 operator dispatch 正常工作，但 `.eq()`/`.clone()`/`.debug()`/`.cmp()` 直接方法调用受限
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
- E2E 测试通过 `npm run test:e2e` 运行（concurrency 3），`npm run test:all` 运行全部（单元 + E2E）

### 架构技术债（推迟到自举阶段）

- **TypeEnv god object**（env.ts）：17 个 public mutable 字段无封装，自举时重构为 sub-objects
- **Type 冗余结构数据**：StructType 携带 fields[]、EnumType 携带 variants[] 与 TypeEnv 重复，自举时改为 nominal 表示
- **HExpr/HStmt switch 重复**（codegen-expr/zonk/hir-visitor/completion）：多 pass 编译器固有模式，可扩展 hir-visitor 覆盖 completion 用例
- **definition.ts AST 遍历重复**：90 行 switch 平行于 infer-expr 调度，可迁移到 HIR-based 方案
- **DerivedImpl 跨 3 文件耦合**（derive.ts + hir/index.ts + codegen-derive.ts）：结构良好可接受

## Phase 3b 路线图（未来方向）

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

# 运行编译器单元测试（自动先编译）
cd compiler && npm test

# 仅 TypeScript 类型检查（不编译输出）
cd compiler && npm run typecheck

# 机械 lint 检查（tsc strict + as any/ts-ignore/console.log 扫描）
cd compiler && npm run lint

# 调试模式（打印中间 AST/HIR/JS）
node compiler/dist/cli.js run --debug examples/hello.ring
```
