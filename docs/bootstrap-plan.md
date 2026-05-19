# Ring-lang 自举计划：增量替换方案

> 2026-05-19。将 TS 编译器逐模块翻译为 Ring，利用 Ring→JS 和 TS→JS 同运行时的特性实现边翻译边验证。

## 核心原理

Ring 编译到 JS，现有 TS 编译器也编译到 JS，两者跑在同一个 V8 里。因此可以**逐模块替换**：

1. 翻译一个 TS 模块为 Ring
2. 用现有 TS 编译器把 Ring 源码编译成 JS
3. 将生成的 JS 替换进编译器
4. 跑 242 个 E2E 测试——全过说明翻译正确
5. 下一个模块

不做大爆炸重写。每一步都有测试兜底。

## 前置依赖（自举开始前必须完成）

| 特性 | 原因 | 预估 |
|------|------|------|
| **Module system**（`mod`/`import`/`export`，多文件编译） | 编译器不可能是单文件 | 3-5 天 |
| **File I/O**（通过 effect，读源码写输出） | CLI 需要文件操作 | 1 天 |

Map/Set/Tuple 已就绪。Auto-derive、Refinement types、Linear types 等是自举**之后**的特性，不阻塞。

## 模块翻译顺序

按依赖关系和复杂度分五批。前两批可并行，第三批串行验证。

### 第一批：纯数据定义（机械翻译）

全是 struct/enum 定义，AI 几乎不会翻错。可开多 session 并行。

| 模块 | 行数(约) | 内容 |
|------|---------|------|
| `types/index.ts` | ~200 | Type、Effect、EffectRow 类型定义 |
| `ast/index.ts` | ~300 | AST 节点类型 |
| `hir/index.ts` | ~400 | HIR 节点 + 共享约定（variant_js_name 等） |
| `errors.ts` | ~100 | 诊断/错误类型 + assertNever |
| `diagnostics/codes.ts` | ~80 | 错误码常量映射 |

**预估：1 天，3 个 session 并行。**

### 第二批：简单算法

逻辑直接，字符串操作为主。可与第一批并行。

| 模块 | 行数(约) | 内容 |
|------|---------|------|
| `parser/lexer.ts` | ~500 | 手写状态机，字符级操作 |
| `diagnostics/index.ts` | ~150 | DiagnosticSink 接口 |
| `diagnostics/formatter.ts` | ~200 | format_human / format_llm 字符串拼接 |
| `codegen/runtime.ts` | ~300 | JS 运行时辅助函数 |

**预估：1-2 天，可并行。**

### 第三批：核心算法（风险集中）

类型推断、unification、穷尽性检查。最容易出 bug，**必须逐模块翻译、逐模块测试**，不可并行。

| 模块 | 行数(约) | 风险 | 注意事项 |
|------|---------|------|---------|
| `checker/env.ts` | ~400 | 中 | 类型环境 + 作用域，数据结构密集 |
| `checker/unify.ts` | ~500 | 高 | HM unification + row unification，算法核心 |
| `checker/exhaustive.ts` | ~200 | 中 | 穷尽性检查，递归模式匹配 |
| `checker/zonk.ts` | ~200 | 中 | 替换应用 + 类型变量命名 |
| `checker/infer.ts` | ~1500 | 极高 | 类型推断主体，最大最复杂的单文件 |
| `checker/checker.ts` | ~300 | 中 | 主入口，串联各模块 |

**翻译 `infer.ts` 前建议先拆分**：按职责拆为表达式推断、语句推断、pattern 推断、effect 推断等子模块。小文件翻译成功率更高，出 bug 也更容易定位。

**预估：3-5 天，串行，每个模块翻译后立刻跑 E2E。**

### 第四批：输出层

| 模块 | 行数(约) | 内容 |
|------|---------|------|
| `codegen/codegen.ts` | ~800 | HIR → JavaScript 生成 |
| `parser/parser.ts` | ~1000 | 递归下降 + Pratt 解析 |
| `cli.ts` | ~150 | 入口，依赖 File I/O |

**预估：1-2 天。**

### 第五批：LSP（可延后）

| 模块 | 行数(约) | 说明 |
|------|---------|------|
| `lsp/**` | ~1500 | LSP server + 8 个 feature |

LSP 不影响编译器核心功能。可以在自举完成后再翻译，或者暂时保留 TS 版本单独运行。

**预估：2-3 天，不阻塞自举里程碑。**

## 验证策略

三重保障，任一层发现问题都停下来修：

### 1. E2E 测试（金标准）

每替换一个模块后跑全量 E2E（当前 242 个）。全部通过才进入下一个模块。

```bash
npm run test:e2e  # 替换模块后立刻跑
```

### 2. 输出 diff

对同一个 `.ring` 文件，新旧编译器生成的 JS 做 diff：

```bash
# 旧编译器（纯 TS）
node compiler-old/dist/cli.js build test.ring > old.js

# 新编译器（部分 Ring 模块）
node compiler/dist/cli.js build test.ring > new.js

diff old.js new.js  # 应该完全一致
```

### 3. Ring 类型检查

翻译后的 Ring 代码被 Ring 自己的类型系统检查：
- Effect tracking 捕获遗漏的副作用
- Exhaustive match 捕获遗漏的分支
- 类型推断捕获类型不匹配

这是自举的直接收益——TS 版本中类型系统放过的 bug，Ring 版本的类型系统可能会拦住。

## 并行执行策略

```
Day 1-5:  Module system + File I/O（前置依赖）

Day 6:    ┌─ Session A: 第一批（types + ast + hir + errors）
          ├─ Session B: 第二批前半（lexer + diagnostics）
          └─ Session C: 第二批后半（runtime + formatter）

Day 7-8:  集成第一二批，跑 E2E 验证

Day 8-12: 第三批，逐模块串行
          env → unify → exhaustive → zonk → infer → checker
          每个模块：翻译 → E2E → 通过 → 下一个

Day 12-13: 第四批（codegen + parser + cli）

Day 13-15: 全模块联调，修边界问题，跑全量测试

Day 15+:  第五批 LSP（可选，不阻塞里程碑）
```

**总计：~15 天（含前置依赖）。** 并行 session 用得好可压到 ~12 天。

## 里程碑判定

自举完成的标准：

1. Ring 编译器源码全部为 `.ring` 文件（LSP 除外可延后）
2. 用 TS 编译器编译 Ring 编译器源码 → 得到 JS 版编译器
3. 用 JS 版编译器编译自身源码 → 得到第二份 JS 版编译器
4. 两份 JS 版编译器输出一致（定点验证）
5. 242+ E2E 测试全部通过

达成后，TS 编译器可以归档。后续开发全部在 Ring 上进行。

## 自举后立即获得的收益

- Ring 的 effect system 覆盖编译器自身开发 → LLM 代码可靠性提升
- 可以放心开更多并行 session → 有效并行度从 ~3x 提升到 ~10-20x
- 为后续 Refinement types、Linear types 提供第一个大型测试项目
- 推广素材："AI 用语言的类型系统验证自己写的编译器代码"
