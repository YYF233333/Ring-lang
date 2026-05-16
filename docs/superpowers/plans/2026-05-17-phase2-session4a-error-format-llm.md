# Phase 2 Session 4a: `--error-format=llm` + DiagnosticSink 管道 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce a DiagnosticSink pipeline architecture with structured error codes and context, enabling `--error-format=llm` JSON output and improved rustc-style human error display.

**Architecture:** All compiler stages (Parser, Checker) report diagnostics to a shared `CollectingSink`. Parser recovers at declaration boundaries to collect multiple errors. Output is piped through a `SuggestionEnricher` (empty framework) then formatted by `OutputFormatter` based on `--error-format` flag.

**Tech Stack:** TypeScript (strict mode), Node.js native test framework, zero external dependencies.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `compiler/src/diagnostics/index.ts` | Diagnostic types, DiagnosticSink interface, CollectingSink |
| Create | `compiler/src/diagnostics/codes.ts` | Error code constants + description registry |
| Create | `compiler/src/diagnostics/formatter.ts` | format_human(), format_llm() |
| Create | `compiler/src/diagnostics/suggestions.ts` | SuggestionEnricher framework |
| Create | `compiler/src/diagnostics/diagnostics.test.ts` | Formatter + enricher tests |
| Modify | `compiler/src/errors.ts` | Slim down to CompileError + assertNever |
| Modify | `compiler/src/parser/parser.ts` | Accept sink, multi-error with synchronize() |
| Modify | `compiler/src/parser/parser.test.ts` | Adapt to sink-based API |
| Modify | `compiler/src/checker/checker.ts` | Accept sink, pass to InferEngine |
| Modify | `compiler/src/checker/infer.ts` | Accept sink, report before throw, structured context |
| Modify | `compiler/src/checker/unify.ts` | Accept sink, report UnificationError |
| Modify | `compiler/src/checker/checker.test.ts` | Adapt to sink-based API |
| Modify | `compiler/src/cli.ts` | Parse --error-format, assemble pipeline |
| Modify | `tests/e2e.test.ts` | Adapt runner, add negative test cases |
| Create | `tests/cases/error_multi_parse.ring` | Multi-error parser test case |
| Create | `tests/cases/error_type_context.ring` | Type error with context test case |

---

## Task 1: Diagnostic Types + DiagnosticSink

**Files:**
- Create: `compiler/src/diagnostics/index.ts`

- [ ] **Step 1: Create diagnostics/index.ts with all types and CollectingSink**

```typescript
import { Span } from "../ast/index.js";

export type Severity = "error" | "warning" | "info" | "hint";

export interface DiagnosticNote {
  message: string;
  span?: Span;
}

export type DiagnosticContext =
  | { kind: "type_mismatch"; expected: string; actual: string; expression?: string }
  | { kind: "undefined_variable"; name: string; scope_locals?: string[] }
  | { kind: "missing_field"; field: string; type: string; available?: string[] }
  | { kind: "effect_unhandled"; effect: string; in_function?: string }
  | { kind: "parse_error"; token: string; expected?: string[] }
  | { kind: "pattern_error"; detail: string }
  | { kind: "trait_error"; detail: string }
  | { kind: "other"; detail?: string };

export interface Suggestion {
  message: string;
  replacement?: string;
  span?: Span;
}

export interface Diagnostic {
  severity: Severity;
  code: string;
  message: string;
  span: Span;
  notes: DiagnosticNote[];
  context: DiagnosticContext;
  suggestions: Suggestion[];
}

export interface DiagnosticSink {
  report(diagnostic: Diagnostic): void;
  has_errors(): boolean;
  diagnostics(): readonly Diagnostic[];
}

export class CollectingSink implements DiagnosticSink {
  private items: Diagnostic[] = [];

  report(d: Diagnostic): void {
    this.items.push(d);
  }

  has_errors(): boolean {
    return this.items.some(d => d.severity === "error");
  }

  diagnostics(): readonly Diagnostic[] {
    return this.items;
  }

  clear(): void {
    this.items = [];
  }
}

export function make_diagnostic(
  code: string,
  severity: Severity,
  message: string,
  span: Span,
  context: DiagnosticContext,
  notes: DiagnosticNote[] = [],
): Diagnostic {
  return { severity, code, message, span, notes, context, suggestions: [] };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd compiler && npx tsc --noEmit`
Expected: No errors related to diagnostics/index.ts

- [ ] **Step 3: Commit**

```bash
git add compiler/src/diagnostics/index.ts
git commit -m "feat(diagnostics): add Diagnostic types and CollectingSink"
```

---

## Task 2: Error Codes Registry

**Files:**
- Create: `compiler/src/diagnostics/codes.ts`

- [ ] **Step 1: Create codes.ts with all error code constants**

```typescript
export const E = {
  // Parser errors (E01xx)
  E0101: "E0101", // unexpected token
  E0102: "E0102", // unterminated string
  E0103: "E0103", // expected specific token
  E0104: "E0104", // invalid expression

  // Checker general (E02xx)
  E0201: "E0201", // undefined variable
  E0202: "E0202", // arity mismatch
  E0203: "E0203", // unknown struct
  E0204: "E0204", // unknown type

  // Type errors (E03xx)
  E0301: "E0301", // type mismatch (unification)
  E0302: "E0302", // infinite type (occurs check)
  E0303: "E0303", // numeric type required
  E0304: "E0304", // field access on non-struct

  // Effect errors (E04xx)
  E0401: "E0401", // unknown effect
  E0402: "E0402", // unknown effect operation
  E0403: "E0403", // unhandled effect

  // Trait errors (E05xx)
  E0501: "E0501", // unknown trait
  E0502: "E0502", // missing impl method
  E0503: "E0503", // unsatisfied trait bound

  // Pattern errors (E06xx)
  E0601: "E0601", // non-exhaustive match
} as const;

export const ERROR_DESCRIPTIONS: Record<string, string> = {
  [E.E0101]: "Unexpected token",
  [E.E0102]: "Unterminated string literal",
  [E.E0103]: "Expected token",
  [E.E0104]: "Invalid expression",
  [E.E0201]: "Undefined variable",
  [E.E0202]: "Arity mismatch",
  [E.E0203]: "Unknown struct",
  [E.E0204]: "Unknown type",
  [E.E0301]: "Type mismatch",
  [E.E0302]: "Infinite type (occurs check)",
  [E.E0303]: "Numeric type required",
  [E.E0304]: "Invalid field access",
  [E.E0401]: "Unknown effect",
  [E.E0402]: "Unknown effect operation",
  [E.E0403]: "Unhandled effect",
  [E.E0501]: "Unknown trait",
  [E.E0502]: "Missing trait method implementation",
  [E.E0503]: "Unsatisfied trait bound",
  [E.E0601]: "Non-exhaustive pattern match",
};
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd compiler && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add compiler/src/diagnostics/codes.ts
git commit -m "feat(diagnostics): add error code registry"
```

---

## Task 3: Output Formatter

**Files:**
- Create: `compiler/src/diagnostics/formatter.ts`
- Create: `compiler/src/diagnostics/diagnostics.test.ts`

- [ ] **Step 1: Write formatter tests**

```typescript
import { describe, it } from "node:test";
import * as assert from "node:assert/strict";
import { format_human, format_llm } from "./formatter.js";
import { Diagnostic } from "./index.js";

const sample_source = `fn main() {
  let x: Int = "hello"
  print(x)
}`;

const sample_diagnostic: Diagnostic = {
  severity: "error",
  code: "E0301",
  message: "Type mismatch: cannot unify Int with Str",
  span: {
    file: "test.ring",
    start: { line: 2, column: 15, offset: 27 },
    end: { line: 2, column: 22, offset: 34 },
  },
  notes: [],
  context: { kind: "type_mismatch", expected: "Int", actual: "Str", expression: '"hello"' },
  suggestions: [],
};

describe("Formatter", () => {
  describe("format_human", () => {
    it("renders rustc-style error with source context", () => {
      const output = format_human([sample_diagnostic], sample_source);
      assert.ok(output.includes("error[E0301]"));
      assert.ok(output.includes("--> test.ring:2:15"));
      assert.ok(output.includes('let x: Int = "hello"'));
      assert.ok(output.includes("^^^^^^^"));
    });

    it("handles multiple diagnostics", () => {
      const d2: Diagnostic = {
        ...sample_diagnostic,
        code: "E0201",
        message: "Undefined variable: y",
        span: { file: "test.ring", start: { line: 3, column: 8, offset: 45 }, end: { line: 3, column: 9, offset: 46 } },
        context: { kind: "undefined_variable", name: "y" },
      };
      const output = format_human([sample_diagnostic, d2], sample_source);
      assert.ok(output.includes("error[E0301]"));
      assert.ok(output.includes("error[E0201]"));
    });

    it("renders warning severity", () => {
      const warn: Diagnostic = { ...sample_diagnostic, severity: "warning" };
      const output = format_human([warn], sample_source);
      assert.ok(output.includes("warning[E0301]"));
    });
  });

  describe("format_llm", () => {
    it("outputs valid JSON with version field", () => {
      const output = format_llm([sample_diagnostic], "test.ring");
      const parsed = JSON.parse(output);
      assert.equal(parsed.version, 1);
      assert.equal(parsed.file, "test.ring");
      assert.equal(parsed.diagnostics.length, 1);
    });

    it("includes structured context", () => {
      const output = format_llm([sample_diagnostic], "test.ring");
      const parsed = JSON.parse(output);
      const d = parsed.diagnostics[0];
      assert.equal(d.code, "E0301");
      assert.equal(d.context.kind, "type_mismatch");
      assert.equal(d.context.expected, "Int");
      assert.equal(d.context.actual, "Str");
    });

    it("includes span info", () => {
      const output = format_llm([sample_diagnostic], "test.ring");
      const parsed = JSON.parse(output);
      const d = parsed.diagnostics[0];
      assert.equal(d.span.line, 2);
      assert.equal(d.span.col, 15);
      assert.equal(d.span.end_line, 2);
      assert.equal(d.span.end_col, 22);
    });

    it("includes empty suggestions array", () => {
      const output = format_llm([sample_diagnostic], "test.ring");
      const parsed = JSON.parse(output);
      assert.deepEqual(parsed.diagnostics[0].suggestions, []);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd compiler && npx tsc --noEmit`
Expected: FAIL — `formatter.js` module not found

- [ ] **Step 3: Implement formatter.ts**

```typescript
import { Diagnostic } from "./index.js";

export function format_human(diagnostics: readonly Diagnostic[], source: string): string {
  const lines = source.split("\n");
  const parts: string[] = [];

  for (const d of diagnostics) {
    const severity_label = d.severity;
    parts.push(`${severity_label}[${d.code}]: ${d.message}`);
    parts.push(`  --> ${d.span.file}:${d.span.start.line}:${d.span.start.column}`);
    parts.push("   |");

    const line_num = d.span.start.line;
    const source_line = lines[line_num - 1];
    if (source_line !== undefined) {
      const gutter = String(line_num).padStart(3, " ");
      parts.push(`${gutter} | ${source_line}`);

      const underline_start = d.span.start.column;
      const underline_len = d.span.start.line === d.span.end.line
        ? Math.max(1, d.span.end.column - d.span.start.column)
        : Math.max(1, source_line.length - underline_start);
      const padding = " ".repeat(underline_start);
      const carets = "^".repeat(underline_len);

      const hint = format_hint(d);
      parts.push(`${"   "} | ${padding}${carets}${hint ? " " + hint : ""}`);
    }

    parts.push("   |");
    parts.push("");
  }

  return parts.join("\n");
}

function format_hint(d: Diagnostic): string {
  switch (d.context.kind) {
    case "type_mismatch":
      return `expected ${d.context.expected}, got ${d.context.actual}`;
    case "undefined_variable":
      return `not found in this scope`;
    case "missing_field":
      return `field '${d.context.field}' not found`;
    default:
      return "";
  }
}

export interface LlmOutput {
  version: number;
  file: string;
  diagnostics: LlmDiagnostic[];
}

export interface LlmDiagnostic {
  code: string;
  severity: string;
  message: string;
  span: { line: number; col: number; end_line: number; end_col: number };
  context: Record<string, unknown>;
  suggestions: { message: string; replacement?: string }[];
}

export function format_llm(diagnostics: readonly Diagnostic[], file: string): string {
  const output: LlmOutput = {
    version: 1,
    file,
    diagnostics: diagnostics.map(d => ({
      code: d.code,
      severity: d.severity,
      message: d.message,
      span: {
        line: d.span.start.line,
        col: d.span.start.column,
        end_line: d.span.end.line,
        end_col: d.span.end.column,
      },
      context: d.context as unknown as Record<string, unknown>,
      suggestions: d.suggestions.map(s => ({
        message: s.message,
        ...(s.replacement !== undefined ? { replacement: s.replacement } : {}),
      })),
    })),
  };
  return JSON.stringify(output, null, 2);
}
```

- [ ] **Step 4: Run tests**

Run: `cd compiler && npm run build && node --test dist/diagnostics/diagnostics.test.js`
Expected: All 7 tests pass

- [ ] **Step 5: Commit**

```bash
git add compiler/src/diagnostics/formatter.ts compiler/src/diagnostics/diagnostics.test.ts
git commit -m "feat(diagnostics): implement human and LLM output formatters"
```

---

## Task 4: SuggestionEnricher Framework

**Files:**
- Create: `compiler/src/diagnostics/suggestions.ts`

- [ ] **Step 1: Add suggestion tests to diagnostics.test.ts**

Append to `compiler/src/diagnostics/diagnostics.test.ts`:

```typescript
import { enrich } from "./suggestions.js";

describe("SuggestionEnricher", () => {
  it("returns diagnostics unchanged when no rules match", () => {
    const result = enrich([sample_diagnostic]);
    assert.equal(result.length, 1);
    assert.deepEqual(result[0].suggestions, []);
  });

  it("preserves all diagnostic fields", () => {
    const result = enrich([sample_diagnostic]);
    assert.equal(result[0].code, "E0301");
    assert.equal(result[0].message, sample_diagnostic.message);
    assert.deepEqual(result[0].context, sample_diagnostic.context);
  });
});
```

- [ ] **Step 2: Implement suggestions.ts**

```typescript
import { Diagnostic, Suggestion } from "./index.js";

export function enrich(diagnostics: readonly Diagnostic[]): Diagnostic[] {
  return diagnostics.map(d => {
    const suggestions = suggest(d);
    return suggestions.length > 0 ? { ...d, suggestions } : { ...d };
  });
}

function suggest(_d: Diagnostic): Suggestion[] {
  // Framework placeholder — rules added incrementally in future sessions
  // switch (d.context.kind) {
  //   case "type_mismatch": ...
  //   case "undefined_variable": ...
  // }
  return [];
}
```

- [ ] **Step 3: Run tests**

Run: `cd compiler && npm run build && node --test dist/diagnostics/diagnostics.test.js`
Expected: All 9 tests pass (7 formatter + 2 enricher)

- [ ] **Step 4: Commit**

```bash
git add compiler/src/diagnostics/suggestions.ts compiler/src/diagnostics/diagnostics.test.ts
git commit -m "feat(diagnostics): add SuggestionEnricher framework"
```

---

## Task 5: Slim Down errors.ts

**Files:**
- Modify: `compiler/src/errors.ts`

- [ ] **Step 1: Rewrite errors.ts to only keep CompileError + assertNever**

Replace entire `compiler/src/errors.ts` with:

```typescript
import { Diagnostic } from "./diagnostics/index.js";

export class CompileError extends Error {
  public diagnostics: Diagnostic[];

  constructor(diagnostics: Diagnostic[]) {
    const msg = diagnostics.map(d => `${d.code}: ${d.message} (${d.span.file}:${d.span.start.line}:${d.span.start.column})`).join("\n");
    super(msg);
    this.name = "CompileError";
    this.diagnostics = diagnostics;
  }
}

export function assertNever(x: never, context: string): never {
  throw new Error(`assertNever failed in ${context}: unexpected value ${JSON.stringify(x)}`);
}
```

- [ ] **Step 2: Update imports across codebase**

Files that import from `errors.ts` need updating. The old imports of `Diagnostic`, `DiagnosticNote`, `format_diagnostic`, `format_diagnostic_llm`, `error_at`, `warning_at` must be redirected to `diagnostics/index.js` or removed if unused.

Check all importers:
- `compiler/src/checker/infer.ts`: imports `assertNever` — keep as-is
- `compiler/src/checker/exhaustive.ts`: imports `assertNever` — keep as-is
- `compiler/src/codegen/codegen.ts`: imports `assertNever` — keep as-is
- `compiler/src/cli.ts`: imports `CompileError` (if any) — update later in Task 8

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd compiler && npx tsc --noEmit`
Expected: No errors (all old callers only used `assertNever` or `CompileError`)

- [ ] **Step 4: Commit**

```bash
git add compiler/src/errors.ts
git commit -m "refactor(errors): slim down to CompileError + assertNever, types moved to diagnostics/"
```

---

## Task 6: Parser Multi-Error Collection

**Files:**
- Modify: `compiler/src/parser/parser.ts`
- Modify: `compiler/src/parser/parser.test.ts`

- [ ] **Step 1: Modify Parser to accept DiagnosticSink**

In `compiler/src/parser/parser.ts`, update the class:

```typescript
import { DiagnosticSink, CollectingSink, make_diagnostic } from "../diagnostics/index.js";
import { E } from "../diagnostics/codes.js";
import { CompileError } from "../errors.js";
```

Update class fields and constructor:

```typescript
export class Parser {
  private tokens: Token[];
  private pos: number = 0;
  private file: string;
  private sink: DiagnosticSink;
  private error_count: number = 0;
  private static MAX_ERRORS = 20;

  constructor(tokens: Token[], file: string = "<stdin>", sink?: DiagnosticSink) {
    this.tokens = tokens;
    this.file = file;
    this.sink = sink ?? new CollectingSink();
  }

  static parse(source: string, file: string = "<stdin>", sink?: DiagnosticSink): Program {
    const lexer = new Lexer(source, file);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens, file, sink);
    return parser.parse_program();
  }
```

- [ ] **Step 2: Add synchronize() method and replace error()**

```typescript
  private report_error(code: string, msg: string, span?: Span): void {
    const tok = this.peek();
    const error_span = span ?? tok.span;
    this.sink.report(make_diagnostic(
      code,
      "error",
      msg,
      error_span,
      { kind: "parse_error", token: tok.value, expected: undefined },
    ));
    this.error_count++;
  }

  private synchronize(): void {
    this.advance(); // skip the problematic token
    while (!this.is_at_end()) {
      const tok = this.peek();
      if (
        tok.kind === TokenKind.Fn ||
        tok.kind === TokenKind.Struct ||
        tok.kind === TokenKind.Enum ||
        tok.kind === TokenKind.Trait ||
        tok.kind === TokenKind.Impl ||
        tok.kind === TokenKind.Let ||
        tok.kind === TokenKind.Effect
      ) {
        return;
      }
      this.advance();
    }
  }

  private error_and_sync(code: string, msg: string): void {
    this.report_error(code, msg);
    if (this.error_count >= Parser.MAX_ERRORS) {
      throw new CompileError((this.sink as CollectingSink).diagnostics().slice() as any);
    }
    this.synchronize();
  }
```

- [ ] **Step 3: Update parse_program() to use error recovery**

Replace the error throwing in `parse_program()` loop with:

```typescript
  private parse_program(): Program {
    const decls: Decl[] = [];
    while (!this.is_at_end()) {
      try {
        const decl = this.parse_decl();
        if (decl) decls.push(decl);
      } catch (e) {
        if (e instanceof CompileError) throw e; // max errors reached
        // For unexpected errors, report and synchronize
        const tok = this.peek();
        this.report_error(E.E0101, `Unexpected token '${tok.value}' (${tok.kind})`, tok.span);
        this.synchronize();
      }
    }
    if (this.sink.has_errors()) {
      throw new CompileError([...(this.sink.diagnostics() as Diagnostic[])]);
    }
    return { decls, span: /* compute full span */ };
  }
```

Note: Keep existing `parse_decl()` logic mostly intact. Replace `throw this.error(...)` calls within `parse_decl` (at top-level dispatch) with `error_and_sync()`. Inside nested expression parsing, let errors propagate up to `parse_program`'s try/catch.

- [ ] **Step 4: Replace all `throw this.error(...)` at declaration level**

In the parser, there are ~15 `throw this.error(...)` calls. Categorize them:

- **Declaration-level** (in `parse_decl` dispatch): convert to `this.error_and_sync(E.E0101, msg); continue;`
- **Inside expressions/statements** (in `parse_expr`, `parse_pattern`, etc.): convert to `throw new CompileError([...])` after reporting (these bubble up to `parse_program`'s catch)

For the `expect()` helper method:
```typescript
  private expect(kind: TokenKind): Token {
    const tok = this.peek();
    if (tok.kind !== kind) {
      this.report_error(E.E0103, `Expected '${kind}', got '${tok.value}' (${tok.kind})`, tok.span);
      throw new Error("expect_failed"); // will be caught by parse_program try/catch
    }
    return this.advance();
  }
```

- [ ] **Step 5: Update parser.test.ts**

Update test helpers and error tests to use sink:

```typescript
import { CollectingSink } from "../diagnostics/index.js";
import { CompileError } from "../errors.js";

// Update existing error tests to check sink contents:
it("reports error on unexpected token", () => {
  const sink = new CollectingSink();
  assert.throws(() => Parser.parse("fn 123() {}", "<test>", sink), CompileError);
  assert.ok(sink.has_errors());
  const diags = sink.diagnostics();
  assert.ok(diags.length >= 1);
  assert.ok(diags[0].code.startsWith("E01"));
});

it("collects multiple parse errors across declarations", () => {
  const source = `
fn foo( { }
fn bar() -> Int { return "x" }
`;
  const sink = new CollectingSink();
  assert.throws(() => Parser.parse(source, "<test>", sink), CompileError);
  const diags = sink.diagnostics();
  assert.ok(diags.length >= 1, `Expected at least 1 diagnostic, got ${diags.length}`);
});
```

- [ ] **Step 6: Run all tests**

Run: `cd compiler && npm run build && npm test`
Expected: All parser tests pass (some may need adjustment for new error format)

- [ ] **Step 7: Commit**

```bash
git add compiler/src/parser/parser.ts compiler/src/parser/parser.test.ts
git commit -m "feat(parser): multi-error collection with declaration-boundary synchronization"
```

---

## Task 7: Checker Sink Adaptation

**Files:**
- Modify: `compiler/src/checker/checker.ts`
- Modify: `compiler/src/checker/infer.ts`
- Modify: `compiler/src/checker/unify.ts`
- Modify: `compiler/src/checker/checker.test.ts`

- [ ] **Step 1: Update checker.ts entry point**

Replace `compiler/src/checker/checker.ts`:

```typescript
import { Program } from "../ast/index.js";
import { HProgram } from "../hir/index.js";
import { DiagnosticSink, CollectingSink } from "../diagnostics/index.js";
import { InferEngine } from "./infer.js";

export { TypeCheckError } from "./infer.js";
export { UnificationError } from "./unify.js";

export function check(program: Program, sink?: DiagnosticSink): HProgram {
  const s = sink ?? new CollectingSink();
  const engine = new InferEngine(s);
  return engine.check(program);
}
```

- [ ] **Step 2: Update InferEngine constructor to accept sink**

In `compiler/src/checker/infer.ts`:

Add import:
```typescript
import { DiagnosticSink, make_diagnostic } from "../diagnostics/index.js";
import { E } from "../diagnostics/codes.js";
import { CompileError } from "../errors.js";
```

Update class:
```typescript
export class InferEngine {
  public env: TypeEnv;
  private subst: Substitution;
  private sink: DiagnosticSink;
  private type_param_scope: Map<string, Type> = new Map();
  private current_fn_return_type: Type | null = null;
  private current_fn_bounds: { type_param_var_id: number; trait_name: string; type_param_name: string }[] = [];

  constructor(sink: DiagnosticSink) {
    this.sink = sink;
    this.env = new TypeEnv();
    this.subst = empty_subst();
    init_unify_fresh_counter(this.env.current_var_id);
  }
```

- [ ] **Step 3: Add type_error helper method to InferEngine**

```typescript
  private type_error(code: string, message: string, span: Span, context: DiagnosticContext): never {
    const diag = make_diagnostic(code, "error", message, span, context);
    this.sink.report(diag);
    throw new CompileError([diag]);
  }
```

- [ ] **Step 4: Replace all TypeCheckError throws with type_error()**

Convert each `throw new TypeCheckError(msg, span)` to `this.type_error(code, msg, span, context)`:

| Original | Replacement |
|----------|-------------|
| `throw new TypeCheckError(\`Unknown trait: ${name}\`, span)` | `this.type_error(E.E0501, \`Unknown trait: ${name}\`, span, { kind: "trait_error", detail: \`unknown trait '${name}'\` })` |
| `throw new TypeCheckError(\`Missing method '${m}' in impl...\`, span)` | `this.type_error(E.E0502, \`Missing method '${m}' in impl ${trait} for ${type}\`, span, { kind: "trait_error", detail: \`missing method '${m}'\` })` |
| `throw new TypeCheckError(\`Undefined variable: ${name}\`, span)` | `this.type_error(E.E0201, \`Undefined variable: ${name}\`, span, { kind: "undefined_variable", name })` |
| `throw new TypeCheckError(\`Operator ${op} requires numeric...\`, span)` | `this.type_error(E.E0303, msg, span, { kind: "type_mismatch", expected: "Int or Float", actual: type_to_string(t), expression: op })` |
| `throw new TypeCheckError(\`Unary - requires numeric...\`, span)` | `this.type_error(E.E0303, msg, span, { kind: "type_mismatch", expected: "Int or Float", actual: type_to_string(t) })` |
| `throw new TypeCheckError(\`Type does not satisfy trait bound...\`, span)` | `this.type_error(E.E0503, msg, span, { kind: "trait_error", detail: \`type does not satisfy '${bound}'\` })` |
| `throw new TypeCheckError(\`Unknown effect: ${name}\`, span)` | `this.type_error(E.E0401, msg, span, { kind: "effect_unhandled", effect: name })` |
| `throw new TypeCheckError(\`Effect ${name} has no operation ${op}\`, span)` | `this.type_error(E.E0402, msg, span, { kind: "other", detail: \`no operation '${op}' on effect '${name}'\` })` |
| `throw new TypeCheckError(\`Struct ${name} has no field ${f}\`, span)` | `this.type_error(E.E0304, msg, span, { kind: "missing_field", field: f, type: name })` |
| `throw new TypeCheckError(\`Unknown struct: ${name}\`, span)` | `this.type_error(E.E0203, msg, span, { kind: "other", detail: \`unknown struct '${name}'\` })` |
| `throw new TypeCheckError(\`Record type has no field '${f}'\`, span)` | `this.type_error(E.E0304, msg, span, { kind: "missing_field", field: f, type: "record" })` |
| `throw new TypeCheckError(\`Cannot access field '${f}'...\`, span)` | `this.type_error(E.E0304, msg, span, { kind: "missing_field", field: f, type: type_to_string(t) })` |
| `throw new TypeCheckError(\`Non-exhaustive match...\`, span)` | `this.type_error(E.E0601, msg, span, { kind: "pattern_error", detail: \`missing: ${missing}\` })` |
| `throw new TypeCheckError(\`Unknown type: ${name}\`, span)` | `this.type_error(E.E0204, msg, span, { kind: "other", detail: \`unknown type '${name}'\` })` |

- [ ] **Step 5: Update UnificationError in unify.ts**

In `compiler/src/checker/unify.ts`, the `UnificationError` is thrown but doesn't carry span. Keep it as-is for now — the caller (infer.ts) catches it or lets it propagate. The CLI will wrap it.

Actually, update the `unify()` function to accept an optional sink parameter, or keep UnificationError as a plain Error and let the CLI format it. The simplest approach: **keep UnificationError unchanged**, but have the CLI catch it and format it properly using the type info in the message.

- [ ] **Step 6: Remove TypeCheckError class from infer.ts**

Since we now use `CompileError` via `type_error()`, remove the old `TypeCheckError` class. Update the export in `checker.ts` accordingly:

```typescript
// Remove: export { TypeCheckError } from "./infer.js";
// CompileError from errors.ts is now the single error type
```

- [ ] **Step 7: Update checker.test.ts**

```typescript
import { CollectingSink } from "../diagnostics/index.js";
import { CompileError } from "../errors.js";

function check_source(source: string, sink?: CollectingSink): HProgram {
  const s = sink ?? new CollectingSink();
  const ast = Parser.parse(source, "<test>", s);
  return check(ast, s);
}

// Update error assertions:
it("reports undefined variable with diagnostic", () => {
  const sink = new CollectingSink();
  assert.throws(() => check_source(`fn main() { print(xyz) }`, sink), CompileError);
  assert.ok(sink.has_errors());
  const d = sink.diagnostics()[0];
  assert.equal(d.code, "E0201");
  assert.equal(d.context.kind, "undefined_variable");
});

it("reports non-exhaustive match", () => {
  const source = `
enum Shape { circle, rect(Int, Int) }
fn area(s: Shape) -> Int {
  match s { Shape.circle => 0 }
}`;
  const sink = new CollectingSink();
  assert.throws(() => check_source(source, sink), CompileError);
  const d = sink.diagnostics()[0];
  assert.equal(d.code, "E0601");
});
```

Convert all existing `assert.throws` tests to check diagnostic codes and context. Keep the same test semantics, just update assertion style.

- [ ] **Step 8: Run all tests**

Run: `cd compiler && npm run build && npm test`
Expected: All tests pass

- [ ] **Step 9: Commit**

```bash
git add compiler/src/checker/checker.ts compiler/src/checker/infer.ts compiler/src/checker/unify.ts compiler/src/checker/checker.test.ts
git commit -m "feat(checker): integrate DiagnosticSink with structured error codes and context"
```

---

## Task 8: CLI Pipeline Assembly

**Files:**
- Modify: `compiler/src/cli.ts`

- [ ] **Step 1: Rewrite cli.ts with --error-format flag and pipeline**

```typescript
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { Parser } from "./parser/parser.js";
import { check } from "./checker/checker.js";
import { generate } from "./codegen/codegen.js";
import { CollectingSink } from "./diagnostics/index.js";
import { enrich } from "./diagnostics/suggestions.js";
import { format_human, format_llm } from "./diagnostics/formatter.js";
import { CompileError } from "./errors.js";

type ErrorFormat = "human" | "llm";

function parse_args(args: string[]): { command: string; file: string; debug: boolean; error_format: ErrorFormat } {
  let debug = false;
  let error_format: ErrorFormat = "human";
  const positional: string[] = [];

  for (const arg of args) {
    if (arg === "--debug") {
      debug = true;
    } else if (arg.startsWith("--error-format=")) {
      const fmt = arg.slice("--error-format=".length);
      if (fmt !== "human" && fmt !== "llm") {
        console.error(`Unknown error format: ${fmt}. Use 'human' or 'llm'.`);
        process.exit(1);
      }
      error_format = fmt;
    } else {
      positional.push(arg);
    }
  }

  const command = positional[0] ?? "help";
  const file = positional[1] ?? "";
  return { command, file, debug, error_format };
}

function usage(): void {
  console.log(`Ring-lang compiler

Usage: ring <command> <file> [options]

Commands:
  build <file.ring>   Compile to JavaScript
  run <file.ring>     Compile and execute
  check <file.ring>   Type-check only
  help                Show this message

Options:
  --debug             Print intermediate AST/HIR/JS
  --error-format=human|llm  Error output format (default: human)
`);
}

function main(): void {
  const args = process.argv.slice(2);
  const { command, file, debug, error_format } = parse_args(args);

  if (command === "help" || !file) {
    usage();
    process.exit(command === "help" ? 0 : 1);
  }

  const file_path = path.resolve(file);
  if (!fs.existsSync(file_path)) {
    console.error(`File not found: ${file_path}`);
    process.exit(1);
  }

  const source = fs.readFileSync(file_path, "utf-8");
  const sink = new CollectingSink();

  try {
    // Parse
    const ast = Parser.parse(source, file_path, sink);
    if (debug) console.log("=== AST ===\n", JSON.stringify(ast, null, 2));

    // Type-check
    const hir = check(ast, sink);
    if (debug) console.log("=== HIR ===\n", JSON.stringify(hir, null, 2));

    if (command === "check") {
      console.log("OK");
      process.exit(0);
    }

    // Codegen
    const js = generate(hir);
    if (debug) console.log("=== JS ===\n", js);

    if (command === "build") {
      const out_path = file_path.replace(/\.ring$/, ".js");
      fs.writeFileSync(out_path, js, "utf-8");
      console.log(out_path);
    } else if (command === "run") {
      const tmp_path = file_path.replace(/\.ring$/, ".tmp.js");
      fs.writeFileSync(tmp_path, js, "utf-8");
      try {
        const output = execSync(`node "${tmp_path}"`, { encoding: "utf-8" });
        process.stdout.write(output);
      } finally {
        fs.unlinkSync(tmp_path);
      }
    }
  } catch (err) {
    // Collect all diagnostics (from sink + error)
    let diagnostics = [...sink.diagnostics()];
    if (err instanceof CompileError) {
      // CompileError diagnostics may already be in the sink, deduplicate
      for (const d of err.diagnostics) {
        if (!diagnostics.includes(d)) {
          diagnostics.push(d);
        }
      }
    } else if (err instanceof Error) {
      // Unexpected error — wrap as diagnostic
      const { make_diagnostic } = await_import_hack();
      diagnostics.push(make_diagnostic(
        "E0000", "error", err.message,
        { file: file_path, start: { line: 1, column: 0, offset: 0 }, end: { line: 1, column: 0, offset: 0 } },
        { kind: "other", detail: err.message },
      ));
    }

    // Enrich with suggestions
    diagnostics = enrich(diagnostics);

    // Format and output
    if (error_format === "llm") {
      console.log(format_llm(diagnostics, file_path));
    } else {
      console.error(format_human(diagnostics, source));
    }
    process.exit(1);
  }
}

main();
```

Note: The `await_import_hack()` above is not real — replace with direct import of `make_diagnostic` at top of file (already imported from `./diagnostics/index.js`). The catch block should be:

```typescript
  } catch (err) {
    let diagnostics = [...sink.diagnostics()];
    if (err instanceof CompileError) {
      for (const d of err.diagnostics) {
        if (!diagnostics.includes(d)) {
          diagnostics.push(d);
        }
      }
    } else if (err instanceof Error) {
      diagnostics.push(make_diagnostic(
        "E0000", "error", err.message,
        { file: file_path, start: { line: 1, column: 0, offset: 0 }, end: { line: 1, column: 0, offset: 0 } },
        { kind: "other", detail: err.message },
      ));
    }

    diagnostics = enrich(diagnostics);

    if (error_format === "llm") {
      console.log(format_llm(diagnostics, file_path));
    } else {
      console.error(format_human(diagnostics, source));
    }
    process.exit(1);
  }
```

- [ ] **Step 2: Test manually**

Run: `cd compiler && npm run build && node dist/cli.js check examples/hello.ring`
Expected: `OK`

Run: `cd compiler && npm run build && node dist/cli.js check --error-format=llm examples/hello.ring`
Expected: `OK` (no errors to format)

- [ ] **Step 3: Test error output**

Create a temporary bad file and test:
```bash
echo 'fn main() { let x: Int = "bad" }' > /tmp/bad.ring
node dist/cli.js check /tmp/bad.ring
node dist/cli.js check --error-format=llm /tmp/bad.ring
```

Expected: Human format shows rustc-style error; LLM format shows JSON.

- [ ] **Step 4: Commit**

```bash
git add compiler/src/cli.ts
git commit -m "feat(cli): add --error-format=human|llm flag with diagnostic pipeline"
```

---

## Task 9: E2E Test Adaptation

**Files:**
- Modify: `tests/e2e.test.ts`
- Create: `tests/cases/error_multi_parse.ring`
- Create: `tests/cases/error_type_context.ring`

- [ ] **Step 1: Create error_multi_parse.ring**

```ring
fn foo( {
  let x = 1
}

fn bar {
  let y = 2
}

fn baz() -> Int {
  return "hello"
}
```

This file has two parse errors (missing `)` in foo, missing `()` in bar).

- [ ] **Step 2: Create error_type_context.ring**

```ring
fn main() -> Int {
  let x: Int = "hello"
  return x
}
```

This has a type mismatch error.

- [ ] **Step 3: Update e2e.test.ts negative test section**

Add new negative test cases and update the runner to also test `--error-format=llm`:

```typescript
// Negative tests — should fail with diagnostics
const negative_cases: { file: string; error_pattern: string; error_code?: string }[] = [
  { file: "row_reject.ring", error_pattern: "missing field", error_code: "E0304" },
  { file: "error_multi_parse.ring", error_pattern: "Expected", error_code: "E0103" },
  { file: "error_type_context.ring", error_pattern: "unify", error_code: "E0301" },
];

describe("negative cases (ring check should fail)", () => {
  for (const tc of negative_cases) {
    it(`rejects ${tc.file}`, () => {
      const filePath = path.join(CASES_DIR, tc.file);
      try {
        execSync(`node "${CLI_PATH}" check "${filePath}"`, { encoding: "utf-8", stdio: "pipe" });
        assert.fail(`Expected ${tc.file} to fail`);
      } catch (err: any) {
        const output = (err.stderr ?? "") + (err.stdout ?? "") + (err.message ?? "");
        assert.ok(
          output.toLowerCase().includes(tc.error_pattern.toLowerCase()),
          `Expected error containing "${tc.error_pattern}", got: ${output.slice(0, 300)}`
        );
      }
    });

    if (tc.error_code) {
      it(`${tc.file} --error-format=llm contains code ${tc.error_code}`, () => {
        const filePath = path.join(CASES_DIR, tc.file);
        try {
          execSync(`node "${CLI_PATH}" check --error-format=llm "${filePath}"`, { encoding: "utf-8", stdio: "pipe" });
          assert.fail(`Expected ${tc.file} to fail`);
        } catch (err: any) {
          const stdout = err.stdout?.toString() ?? "";
          const parsed = JSON.parse(stdout);
          assert.equal(parsed.version, 1);
          assert.ok(parsed.diagnostics.length >= 1);
          assert.ok(
            parsed.diagnostics.some((d: any) => d.code === tc.error_code),
            `Expected diagnostic with code ${tc.error_code}`
          );
        }
      });
    }
  }
});
```

- [ ] **Step 4: Run full test suite**

Run: `cd compiler && npm run build && npm test`
Expected: All tests pass (unit + e2e)

- [ ] **Step 5: Commit**

```bash
git add tests/e2e.test.ts tests/cases/error_multi_parse.ring tests/cases/error_type_context.ring
git commit -m "test: add error format e2e tests and multi-parse negative cases"
```

---

## Task 10: Final Verification + Lint

**Files:** None (verification only)

- [ ] **Step 1: Run TypeScript typecheck**

Run: `cd compiler && npm run typecheck`
Expected: No errors

- [ ] **Step 2: Run lint**

Run: `cd compiler && npm run lint`
Expected: No violations

- [ ] **Step 3: Run full test suite**

Run: `cd compiler && npm test`
Expected: All tests pass

- [ ] **Step 4: Manual smoke test**

```bash
cd compiler
node dist/cli.js run ../examples/hello.ring
node dist/cli.js check ../examples/effects.ring
node dist/cli.js check --error-format=llm ../examples/effects.ring
```

Expected: hello.ring runs and outputs correctly, effects.ring passes check, LLM format outputs `OK` (or empty diagnostics JSON if we want to always output JSON — design decision: only output JSON on error).

- [ ] **Step 5: Final commit (if any cleanup needed)**

```bash
git add -A
git commit -m "chore: session 4a final cleanup and verification"
```
