# Phase 2 Session 4a: `--error-format=llm` + DiagnosticSink 管道

## 目标

为 Ring-lang 编译器添加面向 LLM 的结构化错误输出，同时改进人类可读错误格式。引入 DiagnosticSink 管道架构，为后续 LSP（Session 4b）和智能 suggestion 提供基础。

## 范围

**包含**：
- DiagnosticSink 接口 + CollectingSink 实现
- Diagnostic 类型增强（error code、结构化 context、suggestions 框架）
- Parser 多错误收集 + 声明边界同步恢复
- Checker 适配（sink.report + throw）
- `--error-format=human|llm` CLI flag
- Human 格式改进（rustc 风格：源码行 + 下划线指示）
- LLM JSON 格式输出
- SuggestionEnricher 框架（空规则）

**不包含**：
- Checker 多错误恢复（Session 4b）
- 智能 suggestion 规则（后续逐步积累）
- LSP server（Session 4b）
- 跨文件编译

## 架构

### 管道流向

```
Parser(source, sink)
  │ 收集语法错误，同步到声明边界继续
  │ 最多 20 个错误后停止
  ▼
Checker(ast, sink)
  │ sink.report(diagnostic) → throw CompileError
  │ CLI catch，错误已在 sink 中
  ▼
SuggestionEnricher.enrich(sink.diagnostics())
  │ 按 context.kind 匹配规则，填充 suggestions[]
  ▼
OutputFormatter.format(diagnostics, format, source)
  │ human: rustc 风格带源码上下文
  │ llm: JSON 结构化输出
  ▼
stdout / stderr
```

### 文件结构

```
compiler/src/diagnostics/
├── index.ts          // Diagnostic, DiagnosticSink, CollectingSink
├── codes.ts          // 错误码常量 + 描述映射
├── formatter.ts      // format_human(), format_llm()
└── suggestions.ts    // SuggestionEnricher 框架
```

## 类型定义

### Diagnostic

```typescript
interface Diagnostic {
  severity: "error" | "warning" | "info" | "hint"
  code: string
  message: string
  span: Span
  notes: DiagnosticNote[]
  context: DiagnosticContext
  suggestions: Suggestion[]
}

type DiagnosticContext =
  | { kind: "type_mismatch"; expected: string; actual: string; expression?: string }
  | { kind: "undefined_variable"; name: string; scope_locals?: string[] }
  | { kind: "missing_field"; field: string; type: string; available?: string[] }
  | { kind: "effect_unhandled"; effect: string; in_function?: string }
  | { kind: "parse_error"; token: string; expected?: string[] }
  | { kind: "other"; detail?: string }

interface Suggestion {
  message: string
  replacement?: string
  span?: Span
}
```

### DiagnosticSink

```typescript
interface DiagnosticSink {
  report(diagnostic: Diagnostic): void
  has_errors(): boolean
  diagnostics(): readonly Diagnostic[]
}

class CollectingSink implements DiagnosticSink {
  private items: Diagnostic[] = []
  report(d: Diagnostic) { this.items.push(d) }
  has_errors() { return this.items.some(d => d.severity === "error") }
  diagnostics() { return this.items }
}
```

## 错误码体系

| 范围 | 阶段 | 示例 |
|------|------|------|
| E01xx | Parser | E0101 unexpected token, E0102 unterminated string |
| E02xx | Checker 通用 | E0201 undefined variable, E0202 arity mismatch |
| E03xx | 类型 | E0301 type mismatch, E0302 cannot unify |
| E04xx | Effect | E0401 unhandled effect, E0402 effect mismatch |
| E05xx | Trait | E0501 missing impl method, E0502 unsatisfied constraint |

## 输出格式

### Human（默认）

```
error[E0301]: Type mismatch
  --> app.ring:42:5
   |
42 |   let x: Int = "hello"
   |                 ^^^^^^^ expected Int, got Str
   |
```

### LLM JSON（`--error-format=llm`）

```json
{
  "version": 1,
  "file": "app.ring",
  "diagnostics": [
    {
      "code": "E0301",
      "severity": "error",
      "message": "Type mismatch",
      "span": { "line": 42, "col": 5, "end_line": 42, "end_col": 12 },
      "context": {
        "kind": "type_mismatch",
        "expected": "Int",
        "actual": "Str",
        "expression": "let x: Int = \"hello\""
      },
      "suggestions": []
    }
  ]
}
```

## Parser 多错误收集

### 恢复策略

- 遇到语法错误时：`sink.report(diagnostic)` → 调用 `synchronize()`
- `synchronize()` 消耗 token 直到遇到声明边界关键字：`fn` / `struct` / `enum` / `trait` / `impl` / `let` / EOF
- 表达式内部错误不尝试恢复
- 最多收集 20 个错误后停止解析

### Checker 适配

- Checker 入口签名：`check(program: Program, sink: DiagnosticSink): HProgram`
- 内部 throw 前先 `sink.report(diagnostic)`
- `CompileError` 改为携带 `Diagnostic[]`
- 保持单错误中断行为（多错误恢复留给 Session 4b）

## SuggestionEnricher

```typescript
function enrich(diagnostics: Diagnostic[]): Diagnostic[] {
  return diagnostics.map(d => {
    const suggestions = suggest(d)
    return suggestions.length > 0 ? { ...d, suggestions } : d
  })
}

function suggest(d: Diagnostic): Suggestion[] {
  switch (d.context.kind) {
    // 后续逐条加规则
    default:
      return []
  }
}
```

Session 4a 中为空框架。后续积累路径：每修一类常见错误，在 `suggest()` 的对应 case 中加一条规则。

## CLI 改动

```
ring build <file> [--error-format=human|llm] [--debug]
ring run <file> [--error-format=human|llm] [--debug]
ring check <file> [--error-format=human|llm] [--debug]
```

默认 `--error-format=human`。

## 测试策略

### 单元测试改动

- `parser.test.ts`：传入 CollectingSink，验证多错误收集 + 同步恢复
- `checker.test.ts`：传入 CollectingSink，验证 diagnostic 的 code/context 正确性
- `codegen.test.ts`：不受影响

### 新增测试

- `diagnostics.test.ts`：formatter 输出验证（human 格式 + LLM JSON 格式）
- `suggestions.test.ts`：空规则不崩溃验证

### E2E 测试

- 现有 67 个 case：runner 改为 sink 模式，成功 case 验证 `sink.has_errors() === false`
- 新增负面 case：
  - `error_multi_parse.ring`：多语法错误，验证收集 ≥2 个 diagnostic
  - `error_type_mismatch.ring`：类型错误，验证 JSON context 正确
  - `error_format_llm.ring`：验证 `--error-format=llm` 完整输出结构

### 测试总量

新增 ~15-20 个测试。

## 对现有代码的影响

| 文件 | 变化 |
|------|------|
| `errors.ts` | 精简：只保留 CompileError（携带 Diagnostic[]）+ assertNever |
| `parser.ts` | 接收 sink，error() 改为 report + synchronize，新增 synchronize() |
| `checker.ts` | 接收 sink，throw 前 report |
| `infer.ts` | 所有 throw TypeCheckError 改为构造 Diagnostic + report + throw |
| `cli.ts` | 解析 --error-format，组装管道 |
| `*.test.ts` | 传入 sink，断言方式改为检查 sink.diagnostics() |
| `e2e.test.ts` | runner 适配 sink |

## 预估

- 新代码：~500-600 LOC
- 修改现有代码：~200 LOC
- 风险：低（不改语言语义，只改错误报告管道）
