# Ring-lang Phase 1 Compiler Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working Ring-lang compiler that can compile and run `examples/effects.ring`, covering struct, enum, pattern matching, HM type inference, fail/io effects, and effect handlers.

**Architecture:** Source → Lexer → Parser → AST → Checker (HM inference + effect inference) → HIR → Codegen → JavaScript. HIR is an independent data structure for future optimization passes.

**Tech Stack:** TypeScript (strict mode, ES2022, Node16 modules), node:test for testing, Node.js for execution.

**Parallel execution groups:**
- **Phase A** (sequential): Task 1 (shared types) — must complete first
- **Phase B** (parallel): Task 2 (parser) ‖ Task 3 (codegen+runtime)
- **Phase C** (after Phase A): Task 4 (checker)
- **Phase D** (after all): Task 5 (CLI + integration + e2e)

---

## File Structure

```
compiler/src/
├── ast/
│   └── index.ts              AST node types, Span, Pattern, TypeExpr
├── types/
│   └── index.ts              Internal Type, Effect, EffectRow, utility functions
├── hir/
│   └── index.ts              HIR node types (typed + effect-annotated)
├── parser/
│   ├── lexer.ts              Hand-written lexer producing Token[]
│   ├── parser.ts             Recursive descent + Pratt parsing
│   └── parser.test.ts        Parser unit tests
├── checker/
│   ├── env.ts                Type environment + scope management
│   ├── infer.ts              HM Algorithm W + unification
│   ├── effects.ts            Effect inference + row unification
│   ├── exhaustive.ts         Pattern match exhaustiveness checking
│   ├── lower.ts              AST → HIR lowering with resolved types
│   ├── checker.ts            Main entry: orchestrates resolve → infer → lower
│   └── checker.test.ts       Checker unit tests
├── codegen/
│   ├── codegen.ts            HIR → JavaScript source generation
│   ├── runtime.ts            Runtime helper JS code (embedded string)
│   └── codegen.test.ts       Codegen unit tests
├── errors.ts                 Diagnostic types + formatting
└── cli.ts                    CLI entry point (ring build/run/check)

tests/
├── e2e.test.ts               End-to-end test runner
└── cases/
    ├── hello.ring             Basic struct + fn + print
    ├── enum_match.ring        Enum + pattern matching
    ├── type_infer.ring        HM inference showcase
    ├── fail_or.ring           fail effect + or expression
    └── effect_handler.ring    Full effect handler with io mock
```

---

## Task 1: Shared Type Definitions

**Dependency:** None (must complete before all other tasks)

**Files:**
- Create: `compiler/src/ast/index.ts`
- Create: `compiler/src/types/index.ts`
- Create: `compiler/src/hir/index.ts`
- Create: `compiler/src/errors.ts`

- [ ] **Step 1: Create AST type definitions**

Create `compiler/src/ast/index.ts`:

```typescript
export interface Span {
  start: number;
  end: number;
  line: number;
  col: number;
}

export type BinOp =
  | "+" | "-" | "*" | "/" | "%"
  | "==" | "!=" | "<" | ">" | "<=" | ">="
  | "&&" | "||";

export type UnaryOp = "-" | "!";

export interface Param {
  name: string;
  type_ann?: TypeExpr;
  span: Span;
}

export type TypeExpr =
  | { kind: "named"; name: string; args?: TypeExpr[]; span: Span }
  | { kind: "fn_type"; params: TypeExpr[]; ret: TypeExpr; span: Span }
  | { kind: "option"; inner: TypeExpr; span: Span };

export type Pattern =
  | { kind: "wildcard"; span: Span }
  | { kind: "binding"; name: string; span: Span }
  | { kind: "constructor"; name: string; fields: Pattern[]; span: Span }
  | { kind: "literal"; expr: Expr; span: Span };

export interface MatchArm {
  pattern: Pattern;
  body: Expr;
  span: Span;
}

export interface EffectHandler {
  effect: string;
  op?: string;
  params: string[];
  body: Expr;
  span: Span;
}

export type Expr =
  | { kind: "int_lit"; value: number; span: Span }
  | { kind: "float_lit"; value: number; span: Span }
  | { kind: "str_lit"; value: string; span: Span }
  | { kind: "bool_lit"; value: boolean; span: Span }
  | { kind: "ident"; name: string; span: Span }
  | { kind: "bin_op"; op: BinOp; left: Expr; right: Expr; span: Span }
  | { kind: "unary_op"; op: UnaryOp; operand: Expr; span: Span }
  | { kind: "call"; callee: Expr; args: Expr[]; span: Span }
  | { kind: "method_call"; object: Expr; method: string; args: Expr[]; span: Span }
  | { kind: "field_access"; object: Expr; field: string; span: Span }
  | { kind: "struct_lit"; name: string; fields: { name: string; value: Expr }[]; span: Span }
  | { kind: "match_expr"; subject: Expr; arms: MatchArm[]; span: Span }
  | { kind: "block"; stmts: Stmt[]; expr?: Expr; span: Span }
  | { kind: "if_expr"; condition: Expr; then_branch: Expr; else_branch?: Expr; span: Span }
  | { kind: "string_interp"; parts: (string | Expr)[]; span: Span }
  | { kind: "or_expr"; left: Expr; right: Expr; span: Span }
  | { kind: "catch_expr"; expr: Expr; handler: Expr; span: Span }
  | { kind: "handle_expr"; body: Expr; handlers: EffectHandler[]; span: Span }
  | { kind: "lambda"; params: Param[]; body: Expr; span: Span };

export type Stmt =
  | { kind: "let_stmt"; name: string; type_ann?: TypeExpr; value: Expr; span: Span }
  | { kind: "var_stmt"; name: string; type_ann?: TypeExpr; value: Expr; span: Span }
  | { kind: "assign_stmt"; target: Expr; value: Expr; span: Span }
  | { kind: "expr_stmt"; expr: Expr; span: Span }
  | { kind: "return_stmt"; value?: Expr; span: Span };

export interface StructField {
  name: string;
  type_ann: TypeExpr;
  refinement?: Expr;
  pub: boolean;
  span: Span;
}

export interface EnumVariant {
  name: string;
  fields: { name: string; type_ann: TypeExpr }[];
  span: Span;
}

export interface EffectOp {
  name: string;
  params: Param[];
  ret_type: TypeExpr;
  span: Span;
}

export type Decl =
  | { kind: "fn_decl"; name: string; params: Param[]; ret_type?: TypeExpr; body: Expr; pub: boolean; span: Span }
  | { kind: "struct_decl"; name: string; fields: StructField[]; span: Span }
  | { kind: "enum_decl"; name: string; variants: EnumVariant[]; span: Span }
  | { kind: "impl_decl"; target: string; methods: Decl[]; span: Span }
  | { kind: "effect_decl"; name: string; operations: EffectOp[]; span: Span }
  | { kind: "test_decl"; name: string; body: Expr; span: Span };

export interface Program {
  decls: Decl[];
  span: Span;
}
```

- [ ] **Step 2: Create Type system types**

Create `compiler/src/types/index.ts`:

```typescript
export type Type =
  | { kind: "int" }
  | { kind: "float" }
  | { kind: "str" }
  | { kind: "bool" }
  | { kind: "unit" }
  | { kind: "never" }
  | { kind: "var"; id: number }
  | { kind: "fn"; params: Type[]; ret: Type; effects: EffectRow }
  | { kind: "struct"; name: string; fields: Map<string, Type> }
  | { kind: "enum"; name: string; variants: Map<string, Type[]> }
  | { kind: "generic"; name: string; args: Type[] }
  | { kind: "option"; inner: Type }
  | { kind: "any" };

export interface EffectRow {
  effects: Effect[];
  tail?: number;
}

export type Effect =
  | { kind: "io" }
  | { kind: "fail"; error: Type };

let next_type_var_id = 0;

export function fresh_type_var(): Type {
  return { kind: "var", id: next_type_var_id++ };
}

export function reset_type_var_counter(): void {
  next_type_var_id = 0;
}

export function empty_effect_row(): EffectRow {
  return { effects: [], tail: undefined };
}

export function effect_row(...effects: Effect[]): EffectRow {
  return { effects, tail: undefined };
}

export function open_effect_row(effects: Effect[], tail: number): EffectRow {
  return { effects, tail };
}

export function type_to_string(t: Type): string {
  switch (t.kind) {
    case "int": return "Int";
    case "float": return "Float";
    case "str": return "Str";
    case "bool": return "Bool";
    case "unit": return "Unit";
    case "never": return "Never";
    case "any": return "Any";
    case "var": return `?${t.id}`;
    case "fn": {
      const params = t.params.map(type_to_string).join(", ");
      const ret = type_to_string(t.ret);
      const effs = effect_row_to_string(t.effects);
      return effs ? `fn(${params}) -> ${ret} with {${effs}}` : `fn(${params}) -> ${ret}`;
    }
    case "struct": return t.name;
    case "enum": return t.name;
    case "generic": return `${t.name}<${t.args.map(type_to_string).join(", ")}>`;
    case "option": return `${type_to_string(t.inner)}?`;
  }
}

export function effect_to_string(e: Effect): string {
  switch (e.kind) {
    case "io": return "io";
    case "fail": return `fail<${type_to_string(e.error)}>`;
  }
}

export function effect_row_to_string(row: EffectRow): string {
  const parts = row.effects.map(effect_to_string);
  if (row.tail !== undefined) parts.push(`..?${row.tail}`);
  return parts.join(", ");
}

export const INT: Type = { kind: "int" };
export const FLOAT: Type = { kind: "float" };
export const STR: Type = { kind: "str" };
export const BOOL: Type = { kind: "bool" };
export const UNIT: Type = { kind: "unit" };
export const NEVER: Type = { kind: "never" };
export const ANY: Type = { kind: "any" };
```

- [ ] **Step 3: Create HIR type definitions**

Create `compiler/src/hir/index.ts`:

```typescript
import { Type, EffectRow } from "../types/index.js";
import { Span, BinOp, UnaryOp, Param } from "../ast/index.js";

export interface HMatchArm {
  pattern: HPattern;
  body: HExpr;
}

export type HPattern =
  | { kind: "wildcard" }
  | { kind: "binding"; name: string }
  | { kind: "constructor"; name: string; fields: HPattern[] }
  | { kind: "literal"; value: number | string | boolean };

export interface HEffectHandler {
  effect: string;
  op?: string;
  params: string[];
  body: HExpr;
}

export type HExpr =
  | { kind: "int_lit"; value: number; type: Type; effects: EffectRow }
  | { kind: "float_lit"; value: number; type: Type; effects: EffectRow }
  | { kind: "str_lit"; value: string; type: Type; effects: EffectRow }
  | { kind: "bool_lit"; value: boolean; type: Type; effects: EffectRow }
  | { kind: "ident"; name: string; type: Type; effects: EffectRow }
  | { kind: "bin_op"; op: BinOp; left: HExpr; right: HExpr; type: Type; effects: EffectRow }
  | { kind: "unary_op"; op: UnaryOp; operand: HExpr; type: Type; effects: EffectRow }
  | { kind: "call"; callee: HExpr; args: HExpr[]; type: Type; effects: EffectRow }
  | { kind: "field_access"; object: HExpr; field: string; type: Type; effects: EffectRow }
  | { kind: "struct_lit"; name: string; fields: { name: string; value: HExpr }[]; type: Type; effects: EffectRow }
  | { kind: "match_expr"; subject: HExpr; arms: HMatchArm[]; type: Type; effects: EffectRow }
  | { kind: "block"; stmts: HStmt[]; expr?: HExpr; type: Type; effects: EffectRow }
  | { kind: "if_expr"; condition: HExpr; then_branch: HExpr; else_branch?: HExpr; type: Type; effects: EffectRow }
  | { kind: "string_interp"; parts: (string | HExpr)[]; type: Type; effects: EffectRow }
  | { kind: "try_catch"; try_expr: HExpr; catch_expr: HExpr; type: Type; effects: EffectRow }
  | { kind: "handle_expr"; body: HExpr; handlers: HEffectHandler[]; type: Type; effects: EffectRow }
  | { kind: "lambda"; params: string[]; body: HExpr; type: Type; effects: EffectRow }
  | { kind: "effect_op"; effect: string; op: string; args: HExpr[]; type: Type; effects: EffectRow };

export type HStmt =
  | { kind: "let_stmt"; name: string; value: HExpr; type: Type }
  | { kind: "var_stmt"; name: string; value: HExpr; type: Type }
  | { kind: "assign_stmt"; name: string; value: HExpr }
  | { kind: "expr_stmt"; expr: HExpr }
  | { kind: "return_stmt"; value?: HExpr };

export interface HStructDecl {
  name: string;
  fields: { name: string; type: Type }[];
}

export interface HEnumDecl {
  name: string;
  variants: { name: string; fields: Type[] }[];
}

export interface HFnDecl {
  name: string;
  params: { name: string; type: Type }[];
  ret_type: Type;
  effects: EffectRow;
  body: HExpr;
}

export interface HImplDecl {
  target: string;
  methods: HFnDecl[];
}

export interface HTestDecl {
  name: string;
  body: HExpr;
}

export type HDecl =
  | { kind: "fn_decl"; decl: HFnDecl }
  | { kind: "struct_decl"; decl: HStructDecl }
  | { kind: "enum_decl"; decl: HEnumDecl }
  | { kind: "impl_decl"; decl: HImplDecl }
  | { kind: "test_decl"; decl: HTestDecl };

export interface HProgram {
  decls: HDecl[];
}
```

- [ ] **Step 4: Create error/diagnostic types**

Create `compiler/src/errors.ts`:

```typescript
import { Span } from "./ast/index.js";

export type DiagnosticSeverity = "error" | "warning" | "info";

export interface Diagnostic {
  severity: DiagnosticSeverity;
  message: string;
  span: Span;
  notes?: string[];
}

export class CompileError extends Error {
  diagnostics: Diagnostic[];

  constructor(diagnostics: Diagnostic[]) {
    const msg = diagnostics.map(d => format_diagnostic(d, "")).join("\n");
    super(msg);
    this.diagnostics = diagnostics;
  }
}

export function format_diagnostic(d: Diagnostic, source: string): string {
  const loc = `${d.span.line}:${d.span.col}`;
  const prefix = d.severity === "error" ? "error" : d.severity === "warning" ? "warning" : "info";
  let result = `${prefix}[${loc}]: ${d.message}`;
  if (d.notes) {
    for (const note of d.notes) {
      result += `\n  note: ${note}`;
    }
  }
  return result;
}

export function error_at(span: Span, message: string, notes?: string[]): Diagnostic {
  return { severity: "error", message, span, notes };
}
```

- [ ] **Step 5: Verify TypeScript compilation**

Run: `cd compiler && npx tsc --noEmit`

Expected: no errors (type definitions only, no implementation logic to fail)

- [ ] **Step 6: Commit shared types**

```bash
git add compiler/src/ast/index.ts compiler/src/types/index.ts compiler/src/hir/index.ts compiler/src/errors.ts
git commit -m "feat: add shared type definitions (AST, Type, HIR, Errors)"
```

---

## Task 2: Parser (Lexer + Recursive Descent)

**Dependency:** Task 1 (shared types)
**Parallel with:** Task 3 (codegen)

**Files:**
- Create: `compiler/src/parser/lexer.ts`
- Create: `compiler/src/parser/parser.ts`
- Create: `compiler/src/parser/parser.test.ts`

- [ ] **Step 1: Write lexer tests**

Create `compiler/src/parser/parser.test.ts`:

```typescript
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { lex, Token, TokenKind } from "./lexer.js";
import { parse } from "./parser.js";

describe("Lexer", () => {
  it("tokenizes keywords and identifiers", () => {
    const tokens = lex("fn let var struct enum match");
    const kinds = tokens.map(t => t.kind);
    assert.deepEqual(kinds, ["fn", "let", "var", "struct", "enum", "match", "eof"]);
  });

  it("tokenizes numbers", () => {
    const tokens = lex("42 3.14");
    assert.equal(tokens[0].kind, "int_lit");
    assert.equal(tokens[0].value, "42");
    assert.equal(tokens[1].kind, "float_lit");
    assert.equal(tokens[1].value, "3.14");
  });

  it("tokenizes strings with interpolation", () => {
    const tokens = lex('"hello ${name} world"');
    assert.equal(tokens[0].kind, "string_start");
    assert.equal(tokens[1].kind, "string_part");
    assert.equal(tokens[1].value, "hello ");
    assert.equal(tokens[2].kind, "interp_start");
    assert.equal(tokens[3].kind, "ident");
    assert.equal(tokens[3].value, "name");
    assert.equal(tokens[4].kind, "interp_end");
    assert.equal(tokens[5].kind, "string_part");
    assert.equal(tokens[5].value, " world");
    assert.equal(tokens[6].kind, "string_end");
  });

  it("tokenizes operators", () => {
    const tokens = lex("+ - * / == != <= >= && || !");
    const kinds = tokens.map(t => t.kind).filter(k => k !== "eof");
    assert.deepEqual(kinds, ["plus", "minus", "star", "slash", "eq_eq", "bang_eq", "lt_eq", "gt_eq", "amp_amp", "pipe_pipe", "bang"]);
  });

  it("tokenizes delimiters", () => {
    const tokens = lex("( ) { } [ ] , : . => =>");
    const kinds = tokens.map(t => t.kind).filter(k => k !== "eof");
    assert.deepEqual(kinds, ["lparen", "rparen", "lbrace", "rbrace", "lbracket", "rbracket", "comma", "colon", "dot", "fat_arrow", "fat_arrow"]);
  });

  it("skips line comments", () => {
    const tokens = lex("let x // this is a comment\nlet y");
    const kinds = tokens.map(t => t.kind).filter(k => k !== "eof");
    assert.deepEqual(kinds, ["let", "ident", "let", "ident"]);
  });

  it("tracks line and column", () => {
    const tokens = lex("let x\nlet y");
    assert.equal(tokens[0].span.line, 1);
    assert.equal(tokens[0].span.col, 1);
    assert.equal(tokens[2].span.line, 2);
    assert.equal(tokens[2].span.col, 1);
  });
});

describe("Parser", () => {
  it("parses struct declaration", () => {
    const ast = parse("struct Point { x: Int, y: Int }");
    assert.equal(ast.decls.length, 1);
    const decl = ast.decls[0];
    assert.equal(decl.kind, "struct_decl");
    if (decl.kind === "struct_decl") {
      assert.equal(decl.name, "Point");
      assert.equal(decl.fields.length, 2);
      assert.equal(decl.fields[0].name, "x");
      assert.equal(decl.fields[1].name, "y");
    }
  });

  it("parses enum declaration", () => {
    const ast = parse("enum Shape { circle(radius: Float), rect(w: Float, h: Float) }");
    assert.equal(ast.decls.length, 1);
    const decl = ast.decls[0];
    assert.equal(decl.kind, "enum_decl");
    if (decl.kind === "enum_decl") {
      assert.equal(decl.name, "Shape");
      assert.equal(decl.variants.length, 2);
      assert.equal(decl.variants[0].name, "circle");
      assert.equal(decl.variants[0].fields.length, 1);
    }
  });

  it("parses function declaration", () => {
    const ast = parse("fn add(a: Int, b: Int) -> Int { a + b }");
    assert.equal(ast.decls.length, 1);
    const decl = ast.decls[0];
    assert.equal(decl.kind, "fn_decl");
    if (decl.kind === "fn_decl") {
      assert.equal(decl.name, "add");
      assert.equal(decl.params.length, 2);
      assert.equal(decl.params[0].name, "a");
    }
  });

  it("parses match expression", () => {
    const ast = parse(`fn f(x: Int) -> Str {
      match x {
        0 => "zero",
        _ => "other",
      }
    }`);
    const decl = ast.decls[0];
    assert.equal(decl.kind, "fn_decl");
    if (decl.kind === "fn_decl") {
      const body = decl.body;
      assert.equal(body.kind, "block");
      if (body.kind === "block" && body.expr) {
        assert.equal(body.expr.kind, "match_expr");
      }
    }
  });

  it("parses or expression", () => {
    const ast = parse("fn f() -> Int { get_value() or 42 }");
    const decl = ast.decls[0];
    if (decl.kind === "fn_decl") {
      const body = decl.body;
      if (body.kind === "block" && body.expr) {
        assert.equal(body.expr.kind, "or_expr");
      }
    }
  });

  it("parses handle expression", () => {
    const ast = parse(`fn f() -> Int {
      handle {
        load()
      } with {
        fail(e) => 0,
      }
    }`);
    const decl = ast.decls[0];
    if (decl.kind === "fn_decl") {
      const body = decl.body;
      if (body.kind === "block" && body.expr) {
        assert.equal(body.expr.kind, "handle_expr");
      }
    }
  });

  it("parses method call", () => {
    const ast = parse("fn f(s: Str) -> Int { s.len() }");
    const decl = ast.decls[0];
    if (decl.kind === "fn_decl") {
      const body = decl.body;
      if (body.kind === "block" && body.expr) {
        assert.equal(body.expr.kind, "method_call");
      }
    }
  });

  it("parses struct literal", () => {
    const ast = parse('fn f() -> Point { Point { x: 1, y: 2 } }');
    const decl = ast.decls[0];
    if (decl.kind === "fn_decl") {
      const body = decl.body;
      if (body.kind === "block" && body.expr) {
        assert.equal(body.expr.kind, "struct_lit");
      }
    }
  });

  it("parses impl block", () => {
    const ast = parse("impl Point { fn origin() -> Point { Point { x: 0, y: 0 } } }");
    assert.equal(ast.decls[0].kind, "impl_decl");
  });

  it("parses effect declaration", () => {
    const ast = parse("effect io { fn read(path: Str) -> Str }");
    assert.equal(ast.decls[0].kind, "effect_decl");
  });

  it("parses test declaration", () => {
    const ast = parse('test "basic math" { assert(1 + 1 == 2) }');
    assert.equal(ast.decls[0].kind, "test_decl");
  });

  it("parses string interpolation", () => {
    const ast = parse('fn f(name: Str) -> Str { "hello ${name}!" }');
    const decl = ast.decls[0];
    if (decl.kind === "fn_decl") {
      const body = decl.body;
      if (body.kind === "block" && body.expr) {
        assert.equal(body.expr.kind, "string_interp");
      }
    }
  });

  it("parses lambda expression", () => {
    const ast = parse("fn f() -> Int { let g = fn(x) { x + 1 }; g(5) }");
    const decl = ast.decls[0];
    if (decl.kind === "fn_decl") {
      const body = decl.body;
      if (body.kind === "block") {
        const letStmt = body.stmts[0];
        if (letStmt.kind === "let_stmt") {
          assert.equal(letStmt.value.kind, "lambda");
        }
      }
    }
  });

  it("parses refinement where clause", () => {
    const ast = parse("struct Config { port: Int where 1024 < it < 65536 }");
    const decl = ast.decls[0];
    if (decl.kind === "struct_decl") {
      assert.notEqual(decl.fields[0].refinement, undefined);
    }
  });

  it("parses catch expression", () => {
    const ast = parse("fn f() -> Int { get() catch fn(e) { 0 } }");
    const decl = ast.decls[0];
    if (decl.kind === "fn_decl") {
      const body = decl.body;
      if (body.kind === "block" && body.expr) {
        assert.equal(body.expr.kind, "catch_expr");
      }
    }
  });

  it("handles operator precedence", () => {
    const ast = parse("fn f() -> Int { 1 + 2 * 3 }");
    const decl = ast.decls[0];
    if (decl.kind === "fn_decl") {
      const body = decl.body;
      if (body.kind === "block" && body.expr && body.expr.kind === "bin_op") {
        assert.equal(body.expr.op, "+");
        assert.equal(body.expr.right.kind, "bin_op");
        if (body.expr.right.kind === "bin_op") {
          assert.equal(body.expr.right.op, "*");
        }
      }
    }
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd compiler && npx tsc && node --test dist/parser/parser.test.js`

Expected: compilation error (lexer.ts and parser.ts don't exist yet)

- [ ] **Step 3: Implement the lexer**

Create `compiler/src/parser/lexer.ts`:

```typescript
import { Span } from "../ast/index.js";

export type TokenKind =
  // Keywords
  | "fn" | "let" | "var" | "struct" | "enum" | "match" | "impl"
  | "effect" | "handle" | "with" | "if" | "else" | "or" | "catch"
  | "test" | "return" | "for" | "in" | "pub" | "where" | "true" | "false"
  // Literals
  | "int_lit" | "float_lit" | "str_lit"
  // String interpolation
  | "string_start" | "string_part" | "string_end" | "interp_start" | "interp_end"
  // Identifiers
  | "ident"
  // Operators
  | "plus" | "minus" | "star" | "slash" | "percent"
  | "eq_eq" | "bang_eq" | "lt" | "gt" | "lt_eq" | "gt_eq"
  | "amp_amp" | "pipe_pipe" | "bang"
  | "eq" | "plus_eq" | "minus_eq"
  // Delimiters
  | "lparen" | "rparen" | "lbrace" | "rbrace" | "lbracket" | "rbracket"
  | "comma" | "colon" | "dot" | "fat_arrow" | "arrow" | "semicolon"
  // Special
  | "eof";

export interface Token {
  kind: TokenKind;
  value: string;
  span: Span;
}

const KEYWORDS: Set<string> = new Set([
  "fn", "let", "var", "struct", "enum", "match", "impl",
  "effect", "handle", "with", "if", "else", "or", "catch",
  "test", "return", "for", "in", "pub", "where", "true", "false",
]);

export function lex(source: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;
  let line = 1;
  let col = 1;

  function span_here(): Span {
    return { start: pos, end: pos, line, col };
  }

  function make_token(kind: TokenKind, value: string, start_line: number, start_col: number, start_pos: number): Token {
    return { kind, value, span: { start: start_pos, end: pos, line: start_line, col: start_col } };
  }

  function peek(): string {
    return pos < source.length ? source[pos] : "\0";
  }

  function peek_next(): string {
    return pos + 1 < source.length ? source[pos + 1] : "\0";
  }

  function advance(): string {
    const ch = source[pos];
    pos++;
    if (ch === "\n") { line++; col = 1; } else { col++; }
    return ch;
  }

  function skip_whitespace(): void {
    while (pos < source.length) {
      const ch = source[pos];
      if (ch === " " || ch === "\t" || ch === "\r" || ch === "\n") {
        advance();
      } else if (ch === "/" && peek_next() === "/") {
        while (pos < source.length && source[pos] !== "\n") { advance(); }
      } else {
        break;
      }
    }
  }

  function read_number(): Token {
    const start_pos = pos;
    const start_line = line;
    const start_col = col;
    let is_float = false;

    while (pos < source.length && /[0-9]/.test(source[pos])) { advance(); }
    if (pos < source.length && source[pos] === "." && pos + 1 < source.length && /[0-9]/.test(source[pos + 1])) {
      is_float = true;
      advance(); // consume '.'
      while (pos < source.length && /[0-9]/.test(source[pos])) { advance(); }
    }

    const value = source.slice(start_pos, pos);
    return make_token(is_float ? "float_lit" : "int_lit", value, start_line, start_col, start_pos);
  }

  function read_ident(): Token {
    const start_pos = pos;
    const start_line = line;
    const start_col = col;

    while (pos < source.length && /[a-zA-Z0-9_]/.test(source[pos])) { advance(); }
    const value = source.slice(start_pos, pos);
    const kind: TokenKind = KEYWORDS.has(value) ? value as TokenKind : "ident";
    return make_token(kind, value, start_line, start_col, start_pos);
  }

  function read_string(): Token[] {
    const result: Token[] = [];
    const start_pos = pos;
    const start_line = line;
    const start_col = col;
    advance(); // consume opening "

    result.push(make_token("string_start", '"', start_line, start_col, start_pos));

    let current_part = "";
    let part_start_pos = pos;
    let part_start_line = line;
    let part_start_col = col;

    while (pos < source.length && source[pos] !== '"') {
      if (source[pos] === "$" && pos + 1 < source.length && source[pos + 1] === "{") {
        if (current_part.length > 0 || part_start_pos === pos) {
          result.push(make_token("string_part", current_part, part_start_line, part_start_col, part_start_pos));
        }
        current_part = "";

        const interp_start_pos = pos;
        const interp_start_line = line;
        const interp_start_col = col;
        advance(); advance(); // consume ${
        result.push(make_token("interp_start", "${", interp_start_line, interp_start_col, interp_start_pos));

        let brace_depth = 1;
        let interp_content_start = pos;
        while (pos < source.length && brace_depth > 0) {
          if (source[pos] === "{") brace_depth++;
          if (source[pos] === "}") brace_depth--;
          if (brace_depth > 0) advance();
        }

        const interp_source = source.slice(interp_content_start, pos);
        const interp_tokens = lex(interp_source);
        for (const t of interp_tokens) {
          if (t.kind !== "eof") result.push(t);
        }

        const end_pos = pos;
        advance(); // consume }
        result.push(make_token("interp_end", "}", line, col - 1, end_pos));

        part_start_pos = pos;
        part_start_line = line;
        part_start_col = col;
      } else if (source[pos] === "\\") {
        advance();
        const escaped = advance();
        switch (escaped) {
          case "n": current_part += "\n"; break;
          case "t": current_part += "\t"; break;
          case "\\": current_part += "\\"; break;
          case '"': current_part += '"'; break;
          default: current_part += escaped; break;
        }
      } else {
        current_part += advance();
      }
    }

    if (current_part.length > 0) {
      result.push(make_token("string_part", current_part, part_start_line, part_start_col, part_start_pos));
    }

    const end_line = line;
    const end_col = col;
    if (pos < source.length) advance(); // consume closing "
    result.push(make_token("string_end", '"', end_line, end_col, pos - 1));

    return result;
  }

  function read_raw_string(): Token {
    const start_pos = pos;
    const start_line = line;
    const start_col = col;
    advance(); advance(); advance(); // consume r#"
    let content = "";
    while (pos < source.length) {
      if (source[pos] === '"' && pos + 1 < source.length && source[pos + 1] === "#") {
        advance(); advance(); // consume "#
        break;
      }
      content += advance();
    }
    return make_token("str_lit", content, start_line, start_col, start_pos);
  }

  while (pos < source.length) {
    skip_whitespace();
    if (pos >= source.length) break;

    const start_pos = pos;
    const start_line = line;
    const start_col = col;
    const ch = source[pos];

    if (/[0-9]/.test(ch)) {
      tokens.push(read_number());
    } else if (/[a-zA-Z_]/.test(ch)) {
      if (ch === "r" && pos + 2 < source.length && source[pos + 1] === "#" && source[pos + 2] === '"') {
        tokens.push(read_raw_string());
      } else {
        tokens.push(read_ident());
      }
    } else if (ch === '"') {
      const string_tokens = read_string();
      // If it's a simple string (no interpolation), emit as str_lit
      if (string_tokens.length === 3 && string_tokens[1].kind === "string_part") {
        tokens.push(make_token("str_lit", string_tokens[1].value, start_line, start_col, start_pos));
      } else if (string_tokens.length === 2) {
        // empty string
        tokens.push(make_token("str_lit", "", start_line, start_col, start_pos));
      } else {
        tokens.push(...string_tokens);
      }
    } else {
      // Operators and delimiters
      advance();
      switch (ch) {
        case "(": tokens.push(make_token("lparen", "(", start_line, start_col, start_pos)); break;
        case ")": tokens.push(make_token("rparen", ")", start_line, start_col, start_pos)); break;
        case "{": tokens.push(make_token("lbrace", "{", start_line, start_col, start_pos)); break;
        case "}": tokens.push(make_token("rbrace", "}", start_line, start_col, start_pos)); break;
        case "[": tokens.push(make_token("lbracket", "[", start_line, start_col, start_pos)); break;
        case "]": tokens.push(make_token("rbracket", "]", start_line, start_col, start_pos)); break;
        case ",": tokens.push(make_token("comma", ",", start_line, start_col, start_pos)); break;
        case ":": tokens.push(make_token("colon", ":", start_line, start_col, start_pos)); break;
        case ";": tokens.push(make_token("semicolon", ";", start_line, start_col, start_pos)); break;
        case ".": tokens.push(make_token("dot", ".", start_line, start_col, start_pos)); break;
        case "+":
          if (peek() === "=") { advance(); tokens.push(make_token("plus_eq", "+=", start_line, start_col, start_pos)); }
          else { tokens.push(make_token("plus", "+", start_line, start_col, start_pos)); }
          break;
        case "-":
          if (peek() === ">") { advance(); tokens.push(make_token("arrow", "->", start_line, start_col, start_pos)); }
          else if (peek() === "=") { advance(); tokens.push(make_token("minus_eq", "-=", start_line, start_col, start_pos)); }
          else { tokens.push(make_token("minus", "-", start_line, start_col, start_pos)); }
          break;
        case "*": tokens.push(make_token("star", "*", start_line, start_col, start_pos)); break;
        case "/": tokens.push(make_token("slash", "/", start_line, start_col, start_pos)); break;
        case "%": tokens.push(make_token("percent", "%", start_line, start_col, start_pos)); break;
        case "=":
          if (peek() === "=") { advance(); tokens.push(make_token("eq_eq", "==", start_line, start_col, start_pos)); }
          else if (peek() === ">") { advance(); tokens.push(make_token("fat_arrow", "=>", start_line, start_col, start_pos)); }
          else { tokens.push(make_token("eq", "=", start_line, start_col, start_pos)); }
          break;
        case "!":
          if (peek() === "=") { advance(); tokens.push(make_token("bang_eq", "!=", start_line, start_col, start_pos)); }
          else { tokens.push(make_token("bang", "!", start_line, start_col, start_pos)); }
          break;
        case "<":
          if (peek() === "=") { advance(); tokens.push(make_token("lt_eq", "<=", start_line, start_col, start_pos)); }
          else { tokens.push(make_token("lt", "<", start_line, start_col, start_pos)); }
          break;
        case ">":
          if (peek() === "=") { advance(); tokens.push(make_token("gt_eq", ">=", start_line, start_col, start_pos)); }
          else { tokens.push(make_token("gt", ">", start_line, start_col, start_pos)); }
          break;
        case "&":
          if (peek() === "&") { advance(); tokens.push(make_token("amp_amp", "&&", start_line, start_col, start_pos)); }
          break;
        case "|":
          if (peek() === "|") { advance(); tokens.push(make_token("pipe_pipe", "||", start_line, start_col, start_pos)); }
          break;
        default:
          // Skip unknown characters
          break;
      }
    }
  }

  tokens.push({ kind: "eof", value: "", span: span_here() });
  return tokens;
}
```

- [ ] **Step 4: Implement the parser**

Create `compiler/src/parser/parser.ts`:

```typescript
import { Token, TokenKind, lex } from "./lexer.js";
import {
  Program, Decl, Expr, Stmt, Pattern, MatchArm, Param, TypeExpr,
  StructField, EnumVariant, EffectOp, EffectHandler, Span, BinOp, UnaryOp
} from "../ast/index.js";

class Parser {
  private tokens: Token[];
  private pos: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token {
    return this.tokens[this.pos] ?? this.tokens[this.tokens.length - 1];
  }

  private peek_kind(): TokenKind {
    return this.peek().kind;
  }

  private advance(): Token {
    const tok = this.tokens[this.pos];
    this.pos++;
    return tok;
  }

  private expect(kind: TokenKind): Token {
    const tok = this.peek();
    if (tok.kind !== kind) {
      throw new Error(`Expected ${kind}, got ${tok.kind} ("${tok.value}") at ${tok.span.line}:${tok.span.col}`);
    }
    return this.advance();
  }

  private check(kind: TokenKind): boolean {
    return this.peek_kind() === kind;
  }

  private match_token(...kinds: TokenKind[]): Token | null {
    if (kinds.includes(this.peek_kind())) {
      return this.advance();
    }
    return null;
  }

  private span_from(start: Span): Span {
    const end = this.tokens[this.pos - 1]?.span ?? start;
    return { start: start.start, end: end.end, line: start.line, col: start.col };
  }

  // === Top-Level Parsing ===

  parse_program(): Program {
    const decls: Decl[] = [];
    const start = this.peek().span;
    while (!this.check("eof")) {
      decls.push(this.parse_decl());
    }
    return { decls, span: this.span_from(start) };
  }

  private parse_decl(): Decl {
    const is_pub = this.match_token("pub") !== null;

    switch (this.peek_kind()) {
      case "fn": return this.parse_fn_decl(is_pub);
      case "struct": return this.parse_struct_decl();
      case "enum": return this.parse_enum_decl();
      case "impl": return this.parse_impl_decl();
      case "effect": return this.parse_effect_decl();
      case "test": return this.parse_test_decl();
      default:
        throw new Error(`Unexpected token ${this.peek_kind()} at ${this.peek().span.line}:${this.peek().span.col}`);
    }
  }

  private parse_fn_decl(pub_: boolean): Decl {
    const start = this.peek().span;
    this.expect("fn");
    const name = this.expect("ident").value;
    this.expect("lparen");
    const params = this.parse_params();
    this.expect("rparen");

    let ret_type: TypeExpr | undefined;
    if (this.match_token("arrow")) {
      ret_type = this.parse_type_expr();
    }

    const body = this.parse_block_expr();
    return { kind: "fn_decl", name, params, ret_type, body, pub: pub_, span: this.span_from(start) };
  }

  private parse_params(): Param[] {
    const params: Param[] = [];
    while (!this.check("rparen") && !this.check("eof")) {
      const start = this.peek().span;
      const name = this.expect("ident").value;
      let type_ann: TypeExpr | undefined;
      if (this.match_token("colon")) {
        type_ann = this.parse_type_expr();
      }
      params.push({ name, type_ann, span: this.span_from(start) });
      if (!this.check("rparen")) {
        this.expect("comma");
      }
    }
    return params;
  }

  private parse_struct_decl(): Decl {
    const start = this.peek().span;
    this.expect("struct");
    const name = this.expect("ident").value;
    this.expect("lbrace");
    const fields: StructField[] = [];
    while (!this.check("rbrace") && !this.check("eof")) {
      const field_start = this.peek().span;
      const field_pub = this.match_token("pub") !== null;
      const field_name = this.expect("ident").value;
      this.expect("colon");
      const type_ann = this.parse_type_expr();
      let refinement: Expr | undefined;
      if (this.match_token("where")) {
        refinement = this.parse_expr();
      }
      fields.push({ name: field_name, type_ann, refinement, pub: field_pub, span: this.span_from(field_start) });
      this.match_token("comma");
    }
    this.expect("rbrace");
    return { kind: "struct_decl", name, fields, span: this.span_from(start) };
  }

  private parse_enum_decl(): Decl {
    const start = this.peek().span;
    this.expect("enum");
    const name = this.expect("ident").value;
    this.expect("lbrace");
    const variants: EnumVariant[] = [];
    while (!this.check("rbrace") && !this.check("eof")) {
      const v_start = this.peek().span;
      const v_name = this.expect("ident").value;
      const fields: { name: string; type_ann: TypeExpr }[] = [];
      if (this.match_token("lparen")) {
        while (!this.check("rparen") && !this.check("eof")) {
          const f_name = this.expect("ident").value;
          this.expect("colon");
          const f_type = this.parse_type_expr();
          fields.push({ name: f_name, type_ann: f_type });
          if (!this.check("rparen")) this.expect("comma");
        }
        this.expect("rparen");
      }
      variants.push({ name: v_name, fields, span: this.span_from(v_start) });
      this.match_token("comma");
    }
    this.expect("rbrace");
    return { kind: "enum_decl", name, variants, span: this.span_from(start) };
  }

  private parse_impl_decl(): Decl {
    const start = this.peek().span;
    this.expect("impl");
    const target = this.expect("ident").value;
    this.expect("lbrace");
    const methods: Decl[] = [];
    while (!this.check("rbrace") && !this.check("eof")) {
      const is_pub = this.match_token("pub") !== null;
      methods.push(this.parse_fn_decl(is_pub));
    }
    this.expect("rbrace");
    return { kind: "impl_decl", target, methods, span: this.span_from(start) };
  }

  private parse_effect_decl(): Decl {
    const start = this.peek().span;
    this.expect("effect");
    const name = this.expect("ident").value;
    this.expect("lbrace");
    const operations: EffectOp[] = [];
    while (!this.check("rbrace") && !this.check("eof")) {
      const op_start = this.peek().span;
      this.expect("fn");
      const op_name = this.expect("ident").value;
      this.expect("lparen");
      const params = this.parse_params();
      this.expect("rparen");
      this.expect("arrow");
      const ret_type = this.parse_type_expr();
      operations.push({ name: op_name, params, ret_type, span: this.span_from(op_start) });
    }
    this.expect("rbrace");
    return { kind: "effect_decl", name, operations, span: this.span_from(start) };
  }

  private parse_test_decl(): Decl {
    const start = this.peek().span;
    this.expect("test");
    const name = this.expect("str_lit").value;
    const body = this.parse_block_expr();
    return { kind: "test_decl", name, body, span: this.span_from(start) };
  }

  // === Type Expressions ===

  private parse_type_expr(): TypeExpr {
    const start = this.peek().span;

    if (this.check("fn")) {
      this.advance();
      this.expect("lparen");
      const params: TypeExpr[] = [];
      while (!this.check("rparen") && !this.check("eof")) {
        params.push(this.parse_type_expr());
        if (!this.check("rparen")) this.expect("comma");
      }
      this.expect("rparen");
      this.expect("arrow");
      const ret = this.parse_type_expr();
      return { kind: "fn_type", params, ret, span: this.span_from(start) };
    }

    const name = this.expect("ident").value;
    let args: TypeExpr[] | undefined;
    if (this.match_token("lt")) {
      args = [];
      while (!this.check("gt") && !this.check("eof")) {
        args.push(this.parse_type_expr());
        if (!this.check("gt")) this.expect("comma");
      }
      this.expect("gt");
    }

    let result: TypeExpr = { kind: "named", name, args, span: this.span_from(start) };

    // Handle T? sugar for Option<T>
    if (this.peek_kind() === "ident" && this.peek().value === "?") {
      // Actually ? is not an ident. In Phase 1 we skip this.
    }

    return result;
  }

  // === Expressions ===

  private parse_expr(): Expr {
    return this.parse_or_expr();
  }

  private parse_or_expr(): Expr {
    let left = this.parse_catch_expr();
    while (this.match_token("or")) {
      const right = this.parse_catch_expr();
      left = { kind: "or_expr", left, right, span: this.span_from(left.span) };
    }
    return left;
  }

  private parse_catch_expr(): Expr {
    let expr = this.parse_logical_or();
    if (this.match_token("catch")) {
      const handler = this.parse_primary();
      expr = { kind: "catch_expr", expr, handler, span: this.span_from(expr.span) };
    }
    return expr;
  }

  private parse_logical_or(): Expr {
    let left = this.parse_logical_and();
    while (this.match_token("pipe_pipe")) {
      const right = this.parse_logical_and();
      left = { kind: "bin_op", op: "||", left, right, span: this.span_from(left.span) };
    }
    return left;
  }

  private parse_logical_and(): Expr {
    let left = this.parse_equality();
    while (this.match_token("amp_amp")) {
      const right = this.parse_equality();
      left = { kind: "bin_op", op: "&&", left, right, span: this.span_from(left.span) };
    }
    return left;
  }

  private parse_equality(): Expr {
    let left = this.parse_comparison();
    while (true) {
      const op = this.match_token("eq_eq", "bang_eq");
      if (!op) break;
      const right = this.parse_comparison();
      left = { kind: "bin_op", op: op.value as BinOp, left, right, span: this.span_from(left.span) };
    }
    return left;
  }

  private parse_comparison(): Expr {
    let left = this.parse_additive();
    while (true) {
      const op = this.match_token("lt", "gt", "lt_eq", "gt_eq");
      if (!op) break;
      const op_str = op.kind === "lt" ? "<" : op.kind === "gt" ? ">" : op.kind === "lt_eq" ? "<=" : ">=";
      const right = this.parse_additive();
      left = { kind: "bin_op", op: op_str as BinOp, left, right, span: this.span_from(left.span) };
    }
    return left;
  }

  private parse_additive(): Expr {
    let left = this.parse_multiplicative();
    while (true) {
      const op = this.match_token("plus", "minus");
      if (!op) break;
      const op_str = op.kind === "plus" ? "+" : "-";
      const right = this.parse_multiplicative();
      left = { kind: "bin_op", op: op_str as BinOp, left, right, span: this.span_from(left.span) };
    }
    return left;
  }

  private parse_multiplicative(): Expr {
    let left = this.parse_unary();
    while (true) {
      const op = this.match_token("star", "slash", "percent");
      if (!op) break;
      const op_str = op.kind === "star" ? "*" : op.kind === "slash" ? "/" : "%";
      const right = this.parse_unary();
      left = { kind: "bin_op", op: op_str as BinOp, left, right, span: this.span_from(left.span) };
    }
    return left;
  }

  private parse_unary(): Expr {
    const start = this.peek().span;
    if (this.check("minus") || this.check("bang")) {
      const op_tok = this.advance();
      const op: UnaryOp = op_tok.kind === "minus" ? "-" : "!";
      const operand = this.parse_unary();
      return { kind: "unary_op", op, operand, span: this.span_from(start) };
    }
    return this.parse_postfix();
  }

  private parse_postfix(): Expr {
    let expr = this.parse_primary();

    while (true) {
      if (this.check("dot")) {
        this.advance();
        const name = this.expect("ident").value;
        if (this.check("lparen")) {
          this.advance();
          const args = this.parse_call_args();
          this.expect("rparen");
          expr = { kind: "method_call", object: expr, method: name, args, span: this.span_from(expr.span) };
        } else {
          expr = { kind: "field_access", object: expr, field: name, span: this.span_from(expr.span) };
        }
      } else if (this.check("lparen")) {
        this.advance();
        const args = this.parse_call_args();
        this.expect("rparen");
        expr = { kind: "call", callee: expr, args, span: this.span_from(expr.span) };
      } else {
        break;
      }
    }

    return expr;
  }

  private parse_call_args(): Expr[] {
    const args: Expr[] = [];
    while (!this.check("rparen") && !this.check("eof")) {
      args.push(this.parse_expr());
      if (!this.check("rparen")) this.expect("comma");
    }
    return args;
  }

  private parse_primary(): Expr {
    const start = this.peek().span;

    switch (this.peek_kind()) {
      case "int_lit": {
        const tok = this.advance();
        return { kind: "int_lit", value: parseInt(tok.value, 10), span: tok.span };
      }
      case "float_lit": {
        const tok = this.advance();
        return { kind: "float_lit", value: parseFloat(tok.value), span: tok.span };
      }
      case "str_lit": {
        const tok = this.advance();
        return { kind: "str_lit", value: tok.value, span: tok.span };
      }
      case "string_start": {
        return this.parse_string_interp();
      }
      case "true": {
        this.advance();
        return { kind: "bool_lit", value: true, span: this.span_from(start) };
      }
      case "false": {
        this.advance();
        return { kind: "bool_lit", value: false, span: this.span_from(start) };
      }
      case "ident": {
        const tok = this.advance();
        // Check for struct literal: Name { ... }
        if (this.check("lbrace") && /^[A-Z]/.test(tok.value)) {
          return this.parse_struct_lit(tok.value, start);
        }
        return { kind: "ident", name: tok.value, span: tok.span };
      }
      case "fn": {
        return this.parse_lambda();
      }
      case "if": {
        return this.parse_if_expr();
      }
      case "match": {
        return this.parse_match_expr();
      }
      case "handle": {
        return this.parse_handle_expr();
      }
      case "lbrace": {
        return this.parse_block_expr();
      }
      case "lparen": {
        this.advance();
        const expr = this.parse_expr();
        this.expect("rparen");
        return expr;
      }
      default:
        throw new Error(`Unexpected token ${this.peek_kind()} ("${this.peek().value}") at ${this.peek().span.line}:${this.peek().span.col}`);
    }
  }

  private parse_string_interp(): Expr {
    const start = this.peek().span;
    this.expect("string_start");
    const parts: (string | Expr)[] = [];

    while (!this.check("string_end") && !this.check("eof")) {
      if (this.check("string_part")) {
        parts.push(this.advance().value);
      } else if (this.check("interp_start")) {
        this.advance();
        const expr = this.parse_expr();
        parts.push(expr);
        this.expect("interp_end");
      }
    }
    this.expect("string_end");
    return { kind: "string_interp", parts, span: this.span_from(start) };
  }

  private parse_struct_lit(name: string, start: Span): Expr {
    this.expect("lbrace");
    const fields: { name: string; value: Expr }[] = [];
    while (!this.check("rbrace") && !this.check("eof")) {
      const field_name = this.expect("ident").value;
      this.expect("colon");
      const value = this.parse_expr();
      fields.push({ name: field_name, value });
      this.match_token("comma");
    }
    this.expect("rbrace");
    return { kind: "struct_lit", name, fields, span: this.span_from(start) };
  }

  private parse_lambda(): Expr {
    const start = this.peek().span;
    this.expect("fn");
    this.expect("lparen");
    const params = this.parse_params();
    this.expect("rparen");
    const body = this.parse_block_expr();
    return { kind: "lambda", params, body, span: this.span_from(start) };
  }

  private parse_if_expr(): Expr {
    const start = this.peek().span;
    this.expect("if");
    const condition = this.parse_expr();
    const then_branch = this.parse_block_expr();
    let else_branch: Expr | undefined;
    if (this.match_token("else")) {
      if (this.check("if")) {
        else_branch = this.parse_if_expr();
      } else {
        else_branch = this.parse_block_expr();
      }
    }
    return { kind: "if_expr", condition, then_branch, else_branch, span: this.span_from(start) };
  }

  private parse_match_expr(): Expr {
    const start = this.peek().span;
    this.expect("match");
    const subject = this.parse_expr();
    this.expect("lbrace");
    const arms: MatchArm[] = [];
    while (!this.check("rbrace") && !this.check("eof")) {
      const arm_start = this.peek().span;
      const pattern = this.parse_pattern();
      this.expect("fat_arrow");
      const body = this.parse_expr();
      arms.push({ pattern, body, span: this.span_from(arm_start) });
      this.match_token("comma");
    }
    this.expect("rbrace");
    return { kind: "match_expr", subject, arms, span: this.span_from(start) };
  }

  private parse_pattern(): Pattern {
    const start = this.peek().span;

    if (this.peek_kind() === "ident" && this.peek().value === "_") {
      this.advance();
      return { kind: "wildcard", span: this.span_from(start) };
    }

    if (this.peek_kind() === "int_lit" || this.peek_kind() === "float_lit" || this.peek_kind() === "str_lit") {
      const expr = this.parse_primary();
      return { kind: "literal", expr, span: this.span_from(start) };
    }

    if (this.peek_kind() === "true" || this.peek_kind() === "false") {
      const expr = this.parse_primary();
      return { kind: "literal", expr, span: this.span_from(start) };
    }

    if (this.peek_kind() === "ident") {
      const name = this.advance().value;
      if (this.check("lparen")) {
        this.advance();
        const fields: Pattern[] = [];
        while (!this.check("rparen") && !this.check("eof")) {
          fields.push(this.parse_pattern());
          if (!this.check("rparen")) this.expect("comma");
        }
        this.expect("rparen");
        return { kind: "constructor", name, fields, span: this.span_from(start) };
      }
      return { kind: "binding", name, span: this.span_from(start) };
    }

    throw new Error(`Unexpected pattern token ${this.peek_kind()} at ${this.peek().span.line}:${this.peek().span.col}`);
  }

  private parse_handle_expr(): Expr {
    const start = this.peek().span;
    this.expect("handle");
    const body = this.parse_block_expr();
    this.expect("with");
    this.expect("lbrace");
    const handlers: EffectHandler[] = [];
    while (!this.check("rbrace") && !this.check("eof")) {
      const h_start = this.peek().span;
      // Parse: effect.op(params) => body, OR effect(params) => body, OR io => perform
      let effect = this.expect("ident").value;
      let op: string | undefined;
      let params: string[] = [];

      if (this.match_token("dot")) {
        op = this.expect("ident").value;
        if (this.match_token("lparen")) {
          while (!this.check("rparen") && !this.check("eof")) {
            const p = this.expect("ident").value;
            params.push(p);
            if (!this.check("rparen")) this.expect("comma");
          }
          this.expect("rparen");
        }
      } else if (this.match_token("lparen")) {
        while (!this.check("rparen") && !this.check("eof")) {
          const p = this.expect("ident").value;
          params.push(p);
          if (!this.check("rparen")) this.expect("comma");
        }
        this.expect("rparen");
      }

      this.expect("fat_arrow");
      const h_body = this.parse_expr();
      handlers.push({ effect, op, params, body: h_body, span: this.span_from(h_start) });
      this.match_token("comma");
    }
    this.expect("rbrace");
    return { kind: "handle_expr", body, handlers, span: this.span_from(start) };
  }

  private parse_block_expr(): Expr {
    const start = this.peek().span;
    this.expect("lbrace");
    const stmts: Stmt[] = [];
    let final_expr: Expr | undefined;

    while (!this.check("rbrace") && !this.check("eof")) {
      if (this.check("let") || this.check("var")) {
        stmts.push(this.parse_let_or_var());
      } else if (this.check("return")) {
        stmts.push(this.parse_return());
      } else {
        const expr = this.parse_expr();
        // If followed by } it's the block's return expression
        if (this.check("rbrace")) {
          final_expr = expr;
        } else {
          stmts.push({ kind: "expr_stmt", expr, span: expr.span });
          this.match_token("semicolon");
        }
      }
    }

    this.expect("rbrace");
    return { kind: "block", stmts, expr: final_expr, span: this.span_from(start) };
  }

  private parse_let_or_var(): Stmt {
    const start = this.peek().span;
    const is_var = this.peek_kind() === "var";
    this.advance(); // consume let/var
    const name = this.expect("ident").value;
    let type_ann: TypeExpr | undefined;
    if (this.match_token("colon")) {
      type_ann = this.parse_type_expr();
    }
    this.expect("eq");
    const value = this.parse_expr();
    this.match_token("semicolon");
    const kind = is_var ? "var_stmt" : "let_stmt";
    return { kind, name, type_ann, value, span: this.span_from(start) } as Stmt;
  }

  private parse_return(): Stmt {
    const start = this.peek().span;
    this.expect("return");
    let value: Expr | undefined;
    if (!this.check("rbrace") && !this.check("semicolon")) {
      value = this.parse_expr();
    }
    this.match_token("semicolon");
    return { kind: "return_stmt", value, span: this.span_from(start) };
  }
}

export function parse(source: string): Program {
  const tokens = lex(source);
  const parser = new Parser(tokens);
  return parser.parse_program();
}
```

- [ ] **Step 5: Run parser tests**

Run: `cd compiler && npx tsc && node --test dist/parser/parser.test.js`

Expected: All tests pass. If any fail, fix the parser/lexer until they pass.

- [ ] **Step 6: Commit parser**

```bash
git add compiler/src/parser/
git commit -m "feat: implement lexer and recursive descent parser"
```

---

## Task 3: Codegen + Runtime

**Dependency:** Task 1 (shared types)
**Parallel with:** Task 2 (parser)

**Files:**
- Create: `compiler/src/codegen/runtime.ts`
- Create: `compiler/src/codegen/codegen.ts`
- Create: `compiler/src/codegen/codegen.test.ts`

- [ ] **Step 1: Write codegen tests**

Create `compiler/src/codegen/codegen.test.ts`:

```typescript
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generate } from "./codegen.js";
import { HProgram, HExpr, HStmt, HFnDecl, HDecl } from "../hir/index.js";
import { Type, EffectRow, INT, STR, BOOL, UNIT, empty_effect_row } from "../types/index.js";

const NO_EFF = empty_effect_row();

function make_int(value: number): HExpr {
  return { kind: "int_lit", value, type: INT, effects: NO_EFF };
}

function make_str(value: string): HExpr {
  return { kind: "str_lit", value, type: STR, effects: NO_EFF };
}

function make_ident(name: string, type: Type = INT): HExpr {
  return { kind: "ident", name, type, effects: NO_EFF };
}

describe("Codegen", () => {
  it("generates struct class", () => {
    const program: HProgram = {
      decls: [{
        kind: "struct_decl",
        decl: { name: "Point", fields: [{ name: "x", type: INT }, { name: "y", type: INT }] }
      }]
    };
    const js = generate(program);
    assert.ok(js.includes("class Point"));
    assert.ok(js.includes("constructor(x, y)"));
    assert.ok(js.includes("this.x = x"));
  });

  it("generates enum factory functions", () => {
    const program: HProgram = {
      decls: [{
        kind: "enum_decl",
        decl: { name: "Shape", variants: [
          { name: "circle", fields: [INT] },
          { name: "rect", fields: [INT, INT] },
        ]}
      }]
    };
    const js = generate(program);
    assert.ok(js.includes("function Shape_circle"));
    assert.ok(js.includes('_tag: "circle"'));
    assert.ok(js.includes("function Shape_rect"));
  });

  it("generates function declaration", () => {
    const body: HExpr = {
      kind: "bin_op", op: "+",
      left: make_ident("a"), right: make_ident("b"),
      type: INT, effects: NO_EFF,
    };
    const program: HProgram = {
      decls: [{
        kind: "fn_decl",
        decl: {
          name: "add",
          params: [{ name: "a", type: INT }, { name: "b", type: INT }],
          ret_type: INT,
          effects: NO_EFF,
          body: { kind: "block", stmts: [], expr: body, type: INT, effects: NO_EFF },
        }
      }]
    };
    const js = generate(program);
    assert.ok(js.includes("function add(a, b)"));
    assert.ok(js.includes("a + b"));
  });

  it("generates let/var bindings", () => {
    const program: HProgram = {
      decls: [{
        kind: "fn_decl",
        decl: {
          name: "f",
          params: [],
          ret_type: INT,
          effects: NO_EFF,
          body: {
            kind: "block",
            stmts: [
              { kind: "let_stmt", name: "x", value: make_int(42), type: INT },
              { kind: "var_stmt", name: "y", value: make_int(0), type: INT },
            ],
            expr: make_ident("x"),
            type: INT, effects: NO_EFF,
          }
        }
      }]
    };
    const js = generate(program);
    assert.ok(js.includes("const x = 42"));
    assert.ok(js.includes("let y = 0"));
  });

  it("generates match expression on enum", () => {
    const program: HProgram = {
      decls: [{
        kind: "fn_decl",
        decl: {
          name: "describe",
          params: [{ name: "s", type: { kind: "enum", name: "Shape", variants: new Map() } }],
          ret_type: STR,
          effects: NO_EFF,
          body: {
            kind: "block", stmts: [],
            expr: {
              kind: "match_expr",
              subject: make_ident("s", { kind: "enum", name: "Shape", variants: new Map() }),
              arms: [
                { pattern: { kind: "constructor", name: "circle", fields: [{ kind: "binding", name: "r" }] }, body: make_str("circle") },
                { pattern: { kind: "wildcard" }, body: make_str("other") },
              ],
              type: STR, effects: NO_EFF,
            },
            type: STR, effects: NO_EFF,
          }
        }
      }]
    };
    const js = generate(program);
    assert.ok(js.includes("_tag"));
    assert.ok(js.includes('"circle"'));
  });

  it("generates try-catch for or/catch expressions", () => {
    const program: HProgram = {
      decls: [{
        kind: "fn_decl",
        decl: {
          name: "safe",
          params: [],
          ret_type: INT,
          effects: NO_EFF,
          body: {
            kind: "block", stmts: [],
            expr: {
              kind: "try_catch",
              try_expr: { kind: "call", callee: make_ident("get_value"), args: [], type: INT, effects: NO_EFF },
              catch_expr: make_int(42),
              type: INT, effects: NO_EFF,
            },
            type: INT, effects: NO_EFF,
          }
        }
      }]
    };
    const js = generate(program);
    assert.ok(js.includes("try"));
    assert.ok(js.includes("catch"));
    assert.ok(js.includes("42"));
  });

  it("generates effect handler with generator", () => {
    const program: HProgram = {
      decls: [{
        kind: "fn_decl",
        decl: {
          name: "test_fn",
          params: [],
          ret_type: UNIT,
          effects: NO_EFF,
          body: {
            kind: "block", stmts: [],
            expr: {
              kind: "handle_expr",
              body: {
                kind: "call",
                callee: make_ident("load"),
                args: [make_str("test.txt")],
                type: STR, effects: NO_EFF,
              },
              handlers: [
                { effect: "io", op: "read", params: ["_path"], body: make_str("mock data") },
              ],
              type: STR, effects: NO_EFF,
            },
            type: STR, effects: NO_EFF,
          }
        }
      }]
    };
    const js = generate(program);
    assert.ok(js.includes("function*"));
    assert.ok(js.includes("yield"));
    assert.ok(js.includes("__run_handler"));
  });

  it("generates string interpolation as template literal", () => {
    const program: HProgram = {
      decls: [{
        kind: "fn_decl",
        decl: {
          name: "greet",
          params: [{ name: "name", type: STR }],
          ret_type: STR,
          effects: NO_EFF,
          body: {
            kind: "block", stmts: [],
            expr: {
              kind: "string_interp",
              parts: ["hello ", make_ident("name", STR), "!"],
              type: STR, effects: NO_EFF,
            },
            type: STR, effects: NO_EFF,
          }
        }
      }]
    };
    const js = generate(program);
    assert.ok(js.includes("`hello ${name}!`"));
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd compiler && npx tsc && node --test dist/codegen/codegen.test.js`

Expected: compilation error (codegen.ts and runtime.ts don't exist)

- [ ] **Step 3: Implement runtime helpers**

Create `compiler/src/codegen/runtime.ts`:

```typescript
export const RUNTIME_CODE = `
// Ring-lang runtime helpers
function __run_handler(gen, handlers) {
  let result = gen.next();
  while (!result.done) {
    const effect = result.value;
    const key = effect.op ? effect.effect + "." + effect.op : effect.effect;
    const handler = handlers[key];
    if (handler) {
      const handled = handler(...effect.args);
      result = gen.next(handled);
    } else {
      throw new Error("Unhandled effect: " + key);
    }
  }
  return result.value;
}

function __match_fail(value) {
  throw new Error("Non-exhaustive match: " + JSON.stringify(value));
}

function print(...args) {
  console.log(...args);
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || "Assertion failed");
}
`;
```

- [ ] **Step 4: Implement the codegen**

Create `compiler/src/codegen/codegen.ts`:

```typescript
import { HProgram, HDecl, HExpr, HStmt, HFnDecl, HStructDecl, HEnumDecl, HImplDecl, HTestDecl, HMatchArm, HPattern, HEffectHandler } from "../hir/index.js";
import { RUNTIME_CODE } from "./runtime.js";

class CodeGenerator {
  private output: string[] = [];
  private indent_level: number = 0;

  generate(program: HProgram): string {
    this.output = [RUNTIME_CODE];

    for (const decl of program.decls) {
      this.emit_decl(decl);
      this.emit("");
    }

    // Auto-call main() if it exists
    const has_main = program.decls.some(d => d.kind === "fn_decl" && d.decl.name === "main");
    if (has_main) {
      this.emit("main();");
    }

    return this.output.join("\n");
  }

  private emit(line: string): void {
    const indent = "  ".repeat(this.indent_level);
    this.output.push(indent + line);
  }

  private emit_decl(decl: HDecl): void {
    switch (decl.kind) {
      case "fn_decl": this.emit_fn(decl.decl); break;
      case "struct_decl": this.emit_struct(decl.decl); break;
      case "enum_decl": this.emit_enum(decl.decl); break;
      case "impl_decl": this.emit_impl(decl.decl); break;
      case "test_decl": this.emit_test(decl.decl); break;
    }
  }

  private emit_struct(s: HStructDecl): void {
    const fields = s.fields.map(f => f.name);
    this.emit(`class ${s.name} {`);
    this.indent_level++;
    this.emit(`constructor(${fields.join(", ")}) {`);
    this.indent_level++;
    for (const f of fields) {
      this.emit(`this.${f} = ${f};`);
    }
    this.indent_level--;
    this.emit("}");
    this.indent_level--;
    this.emit("}");
  }

  private emit_enum(e: HEnumDecl): void {
    for (const v of e.variants) {
      const params = v.fields.map((_, i) => `_${i}`);
      if (params.length === 0) {
        this.emit(`function ${e.name}_${v.name}() { return { _tag: "${v.name}" }; }`);
      } else {
        this.emit(`function ${e.name}_${v.name}(${params.join(", ")}) { return { _tag: "${v.name}", ${params.map((p, i) => `${p}`).join(", ")} }; }`);
      }
    }
  }

  private emit_fn(f: HFnDecl): void {
    const params = f.params.map(p => p.name).join(", ");
    this.emit(`function ${f.name}(${params}) {`);
    this.indent_level++;
    this.emit_expr_as_return(f.body);
    this.indent_level--;
    this.emit("}");
  }

  private emit_impl(impl: HImplDecl): void {
    for (const method of impl.methods) {
      const all_params = [{ name: "self", type: { kind: "any" as const } }, ...method.params];
      const params = all_params.map(p => p.name).join(", ");
      this.emit(`function ${impl.target}_${method.name}(${params}) {`);
      this.indent_level++;
      this.emit_expr_as_return(method.body);
      this.indent_level--;
      this.emit("}");
    }
  }

  private emit_test(t: HTestDecl): void {
    this.emit(`// test: ${t.name}`);
    this.emit(`(function() {`);
    this.indent_level++;
    this.emit_expr_as_return(t.body);
    this.indent_level--;
    this.emit(`})();`);
  }

  private emit_expr_as_return(expr: HExpr): void {
    if (expr.kind === "block") {
      for (const stmt of expr.stmts) {
        this.emit_stmt(stmt);
      }
      if (expr.expr) {
        this.emit(`return ${this.expr_to_js(expr.expr)};`);
      }
    } else {
      this.emit(`return ${this.expr_to_js(expr)};`);
    }
  }

  private emit_stmt(stmt: HStmt): void {
    switch (stmt.kind) {
      case "let_stmt":
        this.emit(`const ${stmt.name} = ${this.expr_to_js(stmt.value)};`);
        break;
      case "var_stmt":
        this.emit(`let ${stmt.name} = ${this.expr_to_js(stmt.value)};`);
        break;
      case "assign_stmt":
        this.emit(`${stmt.name} = ${this.expr_to_js(stmt.value)};`);
        break;
      case "expr_stmt":
        this.emit(`${this.expr_to_js(stmt.expr)};`);
        break;
      case "return_stmt":
        if (stmt.value) {
          this.emit(`return ${this.expr_to_js(stmt.value)};`);
        } else {
          this.emit("return;");
        }
        break;
    }
  }

  private expr_to_js(expr: HExpr): string {
    switch (expr.kind) {
      case "int_lit": return String(expr.value);
      case "float_lit": return String(expr.value);
      case "str_lit": return JSON.stringify(expr.value);
      case "bool_lit": return String(expr.value);
      case "ident": return expr.name;
      case "bin_op": return `(${this.expr_to_js(expr.left)} ${expr.op} ${this.expr_to_js(expr.right)})`;
      case "unary_op": return `(${expr.op}${this.expr_to_js(expr.operand)})`;
      case "call": return `${this.expr_to_js(expr.callee)}(${expr.args.map(a => this.expr_to_js(a)).join(", ")})`;
      case "field_access": return `${this.expr_to_js(expr.object)}.${expr.field}`;
      case "struct_lit": return `new ${expr.name}(${expr.fields.map(f => this.expr_to_js(f.value)).join(", ")})`;
      case "string_interp": return this.interp_to_js(expr.parts);
      case "if_expr": return this.if_to_js(expr);
      case "match_expr": return this.match_to_js(expr);
      case "try_catch": return this.try_catch_to_js(expr);
      case "handle_expr": return this.handle_to_js(expr);
      case "lambda": return `(function(${expr.params.join(", ")}) { ${this.block_body_to_js(expr.body)} })`;
      case "block": return this.block_to_iife(expr);
      case "effect_op": return `yield { effect: "${expr.effect}", op: "${expr.op}", args: [${expr.args.map(a => this.expr_to_js(a)).join(", ")}] }`;
    }
  }

  private interp_to_js(parts: (string | HExpr)[]): string {
    const segments = parts.map(p => {
      if (typeof p === "string") return p.replace(/`/g, "\\`").replace(/\$/g, "\\$");
      return "${" + this.expr_to_js(p) + "}";
    });
    return "`" + segments.join("") + "`";
  }

  private if_to_js(expr: HExpr & { kind: "if_expr" }): string {
    const cond = this.expr_to_js(expr.condition);
    const then_ = this.expr_to_js(expr.then_branch);
    const else_ = expr.else_branch ? this.expr_to_js(expr.else_branch) : "undefined";
    return `(${cond} ? ${then_} : ${else_})`;
  }

  private match_to_js(expr: HExpr & { kind: "match_expr" }): string {
    const subject = this.expr_to_js(expr.subject);
    const tmp = `__match_${Math.random().toString(36).slice(2, 8)}`;
    let code = `(function() { const ${tmp} = ${subject};\n`;
    for (const arm of expr.arms) {
      const { condition, bindings } = this.pattern_to_condition(tmp, arm.pattern);
      code += `  if (${condition}) { ${bindings}return ${this.expr_to_js(arm.body)}; }\n`;
    }
    code += `  __match_fail(${tmp});\n})()`;
    return code;
  }

  private pattern_to_condition(subject: string, pattern: HPattern): { condition: string; bindings: string } {
    switch (pattern.kind) {
      case "wildcard":
        return { condition: "true", bindings: "" };
      case "binding":
        return { condition: "true", bindings: `const ${pattern.name} = ${subject}; ` };
      case "literal":
        return { condition: `${subject} === ${JSON.stringify(pattern.value)}`, bindings: "" };
      case "constructor": {
        let condition = `${subject}._tag === "${pattern.name}"`;
        let bindings = "";
        for (let i = 0; i < pattern.fields.length; i++) {
          const field_access = `${subject}._${i}`;
          const sub = this.pattern_to_condition(field_access, pattern.fields[i]);
          if (sub.condition !== "true") condition += ` && ${sub.condition}`;
          bindings += sub.bindings;
        }
        return { condition, bindings };
      }
    }
  }

  private try_catch_to_js(expr: HExpr & { kind: "try_catch" }): string {
    const try_js = this.expr_to_js(expr.try_expr);
    const catch_js = this.expr_to_js(expr.catch_expr);
    return `(function() { try { return ${try_js}; } catch (__e) { return ${catch_js}; } })()`;
  }

  private handle_to_js(expr: HExpr & { kind: "handle_expr" }): string {
    const has_io_handler = expr.handlers.some(h => h.effect === "io" || h.op);
    if (!has_io_handler) {
      // Simple fail-only handler → try/catch
      const body_js = this.expr_to_js(expr.body);
      const fail_handler = expr.handlers.find(h => h.effect === "fail");
      if (fail_handler) {
        const param = fail_handler.params[0] || "__e";
        const handler_body = this.expr_to_js(fail_handler.body);
        return `(function() { try { return ${body_js}; } catch (${param}) { return ${handler_body}; } })()`;
      }
      return body_js;
    }

    // Complex handler → generator
    const body_js = this.gen_body_to_js(expr.body);
    let handlers_obj = "{\n";
    for (const h of expr.handlers) {
      if (h.effect === "fail") continue;
      const key = h.op ? `"${h.effect}.${h.op}"` : `"${h.effect}"`;
      const params = h.params.join(", ");
      handlers_obj += `    ${key}: function(${params}) { return ${this.expr_to_js(h.body)}; },\n`;
    }
    handlers_obj += "  }";

    let code = `__run_handler((function*() {\n`;
    code += `    ${body_js}\n`;
    code += `  })(), ${handlers_obj})`;

    // Wrap with try/catch if there's a fail handler
    const fail_handler = expr.handlers.find(h => h.effect === "fail");
    if (fail_handler) {
      const param = fail_handler.params[0] || "__e";
      const fh_body = this.expr_to_js(fail_handler.body);
      code = `(function() { try { return ${code}; } catch (${param}) { return ${fh_body}; } })()`;
    }

    return code;
  }

  private gen_body_to_js(expr: HExpr): string {
    if (expr.kind === "block") {
      const parts: string[] = [];
      for (const stmt of expr.stmts) {
        parts.push(this.stmt_to_gen_js(stmt));
      }
      if (expr.expr) {
        parts.push(`return ${this.gen_expr_to_js(expr.expr)};`);
      }
      return parts.join("\n    ");
    }
    return `return ${this.gen_expr_to_js(expr)};`;
  }

  private stmt_to_gen_js(stmt: HStmt): string {
    switch (stmt.kind) {
      case "let_stmt": return `const ${stmt.name} = ${this.gen_expr_to_js(stmt.value)};`;
      case "var_stmt": return `let ${stmt.name} = ${this.gen_expr_to_js(stmt.value)};`;
      case "assign_stmt": return `${stmt.name} = ${this.gen_expr_to_js(stmt.value)};`;
      case "expr_stmt": return `${this.gen_expr_to_js(stmt.expr)};`;
      case "return_stmt": return stmt.value ? `return ${this.gen_expr_to_js(stmt.value)};` : "return;";
    }
  }

  private gen_expr_to_js(expr: HExpr): string {
    if (expr.kind === "effect_op") {
      return `yield { effect: "${expr.effect}", op: "${expr.op}", args: [${expr.args.map(a => this.gen_expr_to_js(a)).join(", ")}] }`;
    }
    if (expr.kind === "call") {
      const callee = this.gen_expr_to_js(expr.callee);
      const args = expr.args.map(a => this.gen_expr_to_js(a)).join(", ");
      return `${callee}(${args})`;
    }
    return this.expr_to_js(expr);
  }

  private block_to_iife(expr: HExpr & { kind: "block" }): string {
    let code = "(function() {\n";
    for (const stmt of expr.stmts) {
      code += `  ${this.stmt_to_inline_js(stmt)}\n`;
    }
    if (expr.expr) {
      code += `  return ${this.expr_to_js(expr.expr)};\n`;
    }
    code += "})()";
    return code;
  }

  private stmt_to_inline_js(stmt: HStmt): string {
    switch (stmt.kind) {
      case "let_stmt": return `const ${stmt.name} = ${this.expr_to_js(stmt.value)};`;
      case "var_stmt": return `let ${stmt.name} = ${this.expr_to_js(stmt.value)};`;
      case "assign_stmt": return `${stmt.name} = ${this.expr_to_js(stmt.value)};`;
      case "expr_stmt": return `${this.expr_to_js(stmt.expr)};`;
      case "return_stmt": return stmt.value ? `return ${this.expr_to_js(stmt.value)};` : "return;";
    }
  }

  private block_body_to_js(expr: HExpr): string {
    if (expr.kind === "block") {
      const parts: string[] = [];
      for (const stmt of expr.stmts) {
        parts.push(this.stmt_to_inline_js(stmt));
      }
      if (expr.expr) parts.push(`return ${this.expr_to_js(expr.expr)};`);
      return parts.join(" ");
    }
    return `return ${this.expr_to_js(expr)};`;
  }
}

export function generate(program: HProgram): string {
  const gen = new CodeGenerator();
  return gen.generate(program);
}
```

- [ ] **Step 5: Run codegen tests**

Run: `cd compiler && npx tsc && node --test dist/codegen/codegen.test.js`

Expected: All tests pass.

- [ ] **Step 6: Commit codegen**

```bash
git add compiler/src/codegen/
git commit -m "feat: implement JS codegen with effect handler support"
```

---

## Task 4: Type Checker (HM Inference + Effects + Lowering)

**Dependency:** Task 1 (shared types)
**Can start after:** Task 1 completes (does not need parser or codegen)

**Files:**
- Create: `compiler/src/checker/env.ts`
- Create: `compiler/src/checker/infer.ts`
- Create: `compiler/src/checker/effects.ts`
- Create: `compiler/src/checker/exhaustive.ts`
- Create: `compiler/src/checker/lower.ts`
- Create: `compiler/src/checker/checker.ts`
- Create: `compiler/src/checker/checker.test.ts`

- [ ] **Step 1: Write checker tests**

Create `compiler/src/checker/checker.test.ts`:

```typescript
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { check } from "./checker.js";
import { parse } from "../parser/parser.js";
import { type_to_string } from "../types/index.js";

function check_source(source: string) {
  const ast = parse(source);
  return check(ast);
}

describe("Type Inference", () => {
  it("infers integer literal type", () => {
    const hir = check_source("fn f() -> Int { 42 }");
    const fn_decl = hir.decls[0];
    assert.equal(fn_decl.kind, "fn_decl");
    if (fn_decl.kind === "fn_decl") {
      assert.equal(type_to_string(fn_decl.decl.ret_type), "Int");
    }
  });

  it("infers binary operation type", () => {
    const hir = check_source("fn add(a: Int, b: Int) -> Int { a + b }");
    const fn_decl = hir.decls[0];
    if (fn_decl.kind === "fn_decl") {
      assert.equal(type_to_string(fn_decl.decl.ret_type), "Int");
    }
  });

  it("infers function return type from body", () => {
    const hir = check_source("fn f() { 42 }");
    const fn_decl = hir.decls[0];
    if (fn_decl.kind === "fn_decl") {
      assert.equal(type_to_string(fn_decl.decl.ret_type), "Int");
    }
  });

  it("type-checks struct construction", () => {
    const hir = check_source(`
      struct Point { x: Int, y: Int }
      fn make() -> Point { Point { x: 1, y: 2 } }
    `);
    assert.equal(hir.decls.length, 2);
  });

  it("type-checks field access", () => {
    const hir = check_source(`
      struct Point { x: Int, y: Int }
      fn get_x(p: Point) -> Int { p.x }
    `);
    const fn_decl = hir.decls[1];
    if (fn_decl.kind === "fn_decl") {
      assert.equal(type_to_string(fn_decl.decl.ret_type), "Int");
    }
  });

  it("infers let binding type", () => {
    const hir = check_source("fn f() -> Int { let x = 10; x + 1 }");
    const fn_decl = hir.decls[0];
    if (fn_decl.kind === "fn_decl") {
      assert.equal(type_to_string(fn_decl.decl.ret_type), "Int");
    }
  });

  it("rejects type mismatch", () => {
    assert.throws(() => {
      check_source('fn f() -> Int { "hello" }');
    });
  });

  it("checks enum pattern matching", () => {
    const hir = check_source(`
      enum Color { red(), green(), blue() }
      fn name(c: Color) -> Str {
        match c {
          red() => "red",
          green() => "green",
          blue() => "blue",
        }
      }
    `);
    assert.equal(hir.decls.length, 2);
  });

  it("rejects non-exhaustive match", () => {
    assert.throws(() => {
      check_source(`
        enum Color { red(), green(), blue() }
        fn name(c: Color) -> Str {
          match c {
            red() => "red",
          }
        }
      `);
    });
  });

  it("accepts wildcard as exhaustive", () => {
    const hir = check_source(`
      enum Color { red(), green(), blue() }
      fn name(c: Color) -> Str {
        match c {
          red() => "red",
          _ => "other",
        }
      }
    `);
    assert.equal(hir.decls.length, 2);
  });
});

describe("Effect Inference", () => {
  it("infers io effect from io operations", () => {
    const hir = check_source(`
      fn read_file(path: Str) -> Str {
        io.read(path)
      }
    `);
    const fn_decl = hir.decls[0];
    if (fn_decl.kind === "fn_decl") {
      const has_io = fn_decl.decl.effects.effects.some(e => e.kind === "io");
      assert.ok(has_io);
    }
  });

  it("or expression removes fail effect", () => {
    const hir = check_source(`
      fn safe() -> Int {
        get_value() or 0
      }
    `);
    const fn_decl = hir.decls[0];
    if (fn_decl.kind === "fn_decl") {
      const has_fail = fn_decl.decl.effects.effects.some(e => e.kind === "fail");
      assert.ok(!has_fail);
    }
  });

  it("handle expression removes handled effects", () => {
    const hir = check_source(`
      fn safe() -> Int {
        handle {
          risky()
        } with {
          fail(e) => 0,
        }
      }
    `);
    const fn_decl = hir.decls[0];
    if (fn_decl.kind === "fn_decl") {
      const has_fail = fn_decl.decl.effects.effects.some(e => e.kind === "fail");
      assert.ok(!has_fail);
    }
  });
});
```

- [ ] **Step 2: Implement type environment**

Create `compiler/src/checker/env.ts`:

```typescript
import { Type, EffectRow, fresh_type_var, empty_effect_row, INT, FLOAT, STR, BOOL, UNIT, NEVER, ANY } from "../types/index.js";

export interface TypeScheme {
  vars: number[];
  type: Type;
}

export class TypeEnv {
  private scopes: Map<string, TypeScheme>[] = [new Map()];
  private struct_defs: Map<string, { fields: Map<string, Type> }> = new Map();
  private enum_defs: Map<string, { variants: Map<string, Type[]> }> = new Map();
  private impl_methods: Map<string, Map<string, Type>> = new Map(); // "TypeName" -> "method" -> Type
  private effect_ops: Map<string, Map<string, { params: Type[]; ret: Type }>> = new Map();

  constructor() {
    this.register_builtins();
  }

  private register_builtins(): void {
    // Built-in functions
    this.define("print", {
      vars: [],
      type: { kind: "fn", params: [ANY], ret: UNIT, effects: empty_effect_row() }
    });
    this.define("assert", {
      vars: [],
      type: { kind: "fn", params: [BOOL], ret: UNIT, effects: empty_effect_row() }
    });
    this.define("exit", {
      vars: [],
      type: { kind: "fn", params: [INT], ret: NEVER, effects: empty_effect_row() }
    });
    this.define("panic", {
      vars: [],
      type: { kind: "fn", params: [STR], ret: NEVER, effects: empty_effect_row() }
    });

    // Built-in effect: io
    this.effect_ops.set("io", new Map([
      ["read", { params: [STR], ret: STR }],
      ["write", { params: [STR, STR], ret: UNIT }],
    ]));

    // Built-in module stub: toml
    this.define("toml", {
      vars: [],
      type: { kind: "struct", name: "toml", fields: new Map([
        ["parse", { kind: "fn", params: [STR], ret: ANY, effects: { effects: [{ kind: "fail", error: STR }], tail: undefined } }]
      ])}
    });
  }

  push_scope(): void {
    this.scopes.push(new Map());
  }

  pop_scope(): void {
    this.scopes.pop();
  }

  define(name: string, scheme: TypeScheme): void {
    this.scopes[this.scopes.length - 1].set(name, scheme);
  }

  lookup(name: string): TypeScheme | undefined {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      const found = this.scopes[i].get(name);
      if (found) return found;
    }
    return undefined;
  }

  define_struct(name: string, fields: Map<string, Type>): void {
    this.struct_defs.set(name, { fields });
  }

  get_struct(name: string): { fields: Map<string, Type> } | undefined {
    return this.struct_defs.get(name);
  }

  define_enum(name: string, variants: Map<string, Type[]>): void {
    this.enum_defs.set(name, { variants });
  }

  get_enum(name: string): { variants: Map<string, Type[]> } | undefined {
    return this.enum_defs.get(name);
  }

  define_impl_method(target: string, method: string, type: Type): void {
    if (!this.impl_methods.has(target)) {
      this.impl_methods.set(target, new Map());
    }
    this.impl_methods.get(target)!.set(method, type);
  }

  get_impl_method(target: string, method: string): Type | undefined {
    return this.impl_methods.get(target)?.get(method);
  }

  get_effect_op(effect: string, op: string): { params: Type[]; ret: Type } | undefined {
    return this.effect_ops.get(effect)?.get(op);
  }

  define_effect(name: string, ops: Map<string, { params: Type[]; ret: Type }>): void {
    this.effect_ops.set(name, ops);
  }

  instantiate(scheme: TypeScheme): Type {
    if (scheme.vars.length === 0) return scheme.type;
    const subst = new Map<number, Type>();
    for (const v of scheme.vars) {
      subst.set(v, fresh_type_var());
    }
    return this.apply_subst(scheme.type, subst);
  }

  private apply_subst(type: Type, subst: Map<number, Type>): Type {
    switch (type.kind) {
      case "var": return subst.get(type.id) ?? type;
      case "fn": return {
        kind: "fn",
        params: type.params.map(p => this.apply_subst(p, subst)),
        ret: this.apply_subst(type.ret, subst),
        effects: type.effects,
      };
      case "option": return { kind: "option", inner: this.apply_subst(type.inner, subst) };
      case "generic": return { kind: "generic", name: type.name, args: type.args.map(a => this.apply_subst(a, subst)) };
      default: return type;
    }
  }
}
```

- [ ] **Step 3: Implement HM type inference (unification + Algorithm W)**

Create `compiler/src/checker/infer.ts`:

```typescript
import { Type, EffectRow, Effect, fresh_type_var, empty_effect_row, effect_row, type_to_string, INT, FLOAT, STR, BOOL, UNIT, NEVER, ANY } from "../types/index.js";
import { Expr, Stmt, BinOp, Pattern, TypeExpr } from "../ast/index.js";
import { TypeEnv, TypeScheme } from "./env.js";
import { CompileError, error_at } from "../errors.js";

export type Substitution = Map<number, Type>;

export function new_subst(): Substitution {
  return new Map();
}

export function apply(subst: Substitution, type: Type): Type {
  switch (type.kind) {
    case "var": {
      const bound = subst.get(type.id);
      if (bound) return apply(subst, bound);
      return type;
    }
    case "fn": return {
      kind: "fn",
      params: type.params.map(p => apply(subst, p)),
      ret: apply(subst, type.ret),
      effects: apply_effects(subst, type.effects),
    };
    case "option": return { kind: "option", inner: apply(subst, type.inner) };
    case "generic": return { kind: "generic", name: type.name, args: type.args.map(a => apply(subst, a)) };
    case "struct": {
      const fields = new Map<string, Type>();
      for (const [k, v] of type.fields) fields.set(k, apply(subst, v));
      return { kind: "struct", name: type.name, fields };
    }
    case "enum": {
      const variants = new Map<string, Type[]>();
      for (const [k, v] of type.variants) variants.set(k, v.map(t => apply(subst, t)));
      return { kind: "enum", name: type.name, variants };
    }
    default: return type;
  }
}

export function apply_effects(subst: Substitution, row: EffectRow): EffectRow {
  return {
    effects: row.effects.map(e => apply_effect(subst, e)),
    tail: row.tail,
  };
}

function apply_effect(subst: Substitution, e: Effect): Effect {
  if (e.kind === "fail") return { kind: "fail", error: apply(subst, e.error) };
  return e;
}

export function compose(s1: Substitution, s2: Substitution): Substitution {
  const result = new Map<number, Type>();
  for (const [k, v] of s2) {
    result.set(k, apply(s1, v));
  }
  for (const [k, v] of s1) {
    if (!result.has(k)) result.set(k, v);
  }
  return result;
}

export function unify(t1: Type, t2: Type, subst: Substitution): Substitution {
  const a = apply(subst, t1);
  const b = apply(subst, t2);

  if (a.kind === "any" || b.kind === "any") return subst;
  if (a.kind === "never" || b.kind === "never") return subst;

  if (a.kind === "var") return bind(a.id, b, subst);
  if (b.kind === "var") return bind(b.id, a, subst);

  if (a.kind === b.kind) {
    switch (a.kind) {
      case "int": case "float": case "str": case "bool": case "unit":
        return subst;
      case "fn": {
        const bf = b as Type & { kind: "fn" };
        if (a.params.length !== bf.params.length) {
          throw new Error(`Function arity mismatch: expected ${a.params.length} params, got ${bf.params.length}`);
        }
        let s = subst;
        for (let i = 0; i < a.params.length; i++) {
          s = unify(a.params[i], bf.params[i], s);
        }
        s = unify(a.ret, bf.ret, s);
        return s;
      }
      case "option": {
        const bo = b as Type & { kind: "option" };
        return unify(a.inner, bo.inner, subst);
      }
      case "struct": {
        const bs = b as Type & { kind: "struct" };
        if (a.name !== bs.name) throw new Error(`Type mismatch: ${a.name} vs ${bs.name}`);
        return subst;
      }
      case "enum": {
        const be = b as Type & { kind: "enum" };
        if (a.name !== be.name) throw new Error(`Type mismatch: ${a.name} vs ${be.name}`);
        return subst;
      }
      case "generic": {
        const bg = b as Type & { kind: "generic" };
        if (a.name !== bg.name) throw new Error(`Type mismatch: ${a.name} vs ${bg.name}`);
        let s = subst;
        for (let i = 0; i < a.args.length; i++) {
          s = unify(a.args[i], bg.args[i], s);
        }
        return s;
      }
    }
  }

  throw new Error(`Cannot unify ${type_to_string(a)} with ${type_to_string(b)}`);
}

function bind(id: number, type: Type, subst: Substitution): Substitution {
  if (type.kind === "var" && type.id === id) return subst;
  if (occurs_in(id, type)) {
    throw new Error(`Infinite type: ?${id} occurs in ${type_to_string(type)}`);
  }
  const result = new Map(subst);
  result.set(id, type);
  return result;
}

function occurs_in(id: number, type: Type): boolean {
  switch (type.kind) {
    case "var": return type.id === id;
    case "fn": return type.params.some(p => occurs_in(id, p)) || occurs_in(id, type.ret);
    case "option": return occurs_in(id, type.inner);
    case "generic": return type.args.some(a => occurs_in(id, a));
    default: return false;
  }
}

export function resolve_type_expr(texpr: TypeExpr, env: TypeEnv): Type {
  switch (texpr.kind) {
    case "named": {
      switch (texpr.name) {
        case "Int": return INT;
        case "Float": return FLOAT;
        case "Str": return STR;
        case "Bool": return BOOL;
        case "Unit": return UNIT;
        case "Never": return NEVER;
        default: {
          const struct_def = env.get_struct(texpr.name);
          if (struct_def) return { kind: "struct", name: texpr.name, fields: struct_def.fields };
          const enum_def = env.get_enum(texpr.name);
          if (enum_def) return { kind: "enum", name: texpr.name, variants: enum_def.variants };
          return ANY;
        }
      }
    }
    case "fn_type": {
      const params = texpr.params.map(p => resolve_type_expr(p, env));
      const ret = resolve_type_expr(texpr.ret, env);
      return { kind: "fn", params, ret, effects: empty_effect_row() };
    }
    case "option": {
      const inner = resolve_type_expr(texpr.inner, env);
      return { kind: "option", inner };
    }
  }
}

export function infer_binop(op: BinOp, left: Type, right: Type, subst: Substitution): { type: Type; subst: Substitution } {
  switch (op) {
    case "+": case "-": case "*": case "/": case "%": {
      let s = unify(left, INT, subst);
      s = unify(right, INT, s);
      return { type: INT, subst: s };
    }
    case "==": case "!=": case "<": case ">": case "<=": case ">=": {
      let s = unify(left, right, subst);
      return { type: BOOL, subst: s };
    }
    case "&&": case "||": {
      let s = unify(left, BOOL, subst);
      s = unify(right, BOOL, s);
      return { type: BOOL, subst: s };
    }
  }
}
```

- [ ] **Step 4: Implement exhaustiveness checking**

Create `compiler/src/checker/exhaustive.ts`:

```typescript
import { Pattern } from "../ast/index.js";
import { Type } from "../types/index.js";
import { TypeEnv } from "./env.js";

export function check_exhaustive(patterns: Pattern[], subject_type: Type, env: TypeEnv): string | null {
  if (patterns.some(p => p.kind === "wildcard" || p.kind === "binding")) {
    return null; // wildcard/binding covers everything
  }

  if (subject_type.kind === "enum") {
    const enum_def = env.get_enum(subject_type.name);
    if (!enum_def) return null;

    const covered_variants = new Set<string>();
    for (const p of patterns) {
      if (p.kind === "constructor") {
        covered_variants.add(p.name);
      }
    }

    for (const variant_name of enum_def.variants.keys()) {
      if (!covered_variants.has(variant_name)) {
        return variant_name;
      }
    }
    return null;
  }

  // For non-enum types, require wildcard
  return "non-exhaustive";
}
```

- [ ] **Step 5: Implement effect inference**

Create `compiler/src/checker/effects.ts`:

```typescript
import { Effect, EffectRow, empty_effect_row, Type } from "../types/index.js";

export function merge_effects(a: EffectRow, b: EffectRow): EffectRow {
  const effects = [...a.effects];
  for (const e of b.effects) {
    if (!effects.some(existing => effects_equal(existing, e))) {
      effects.push(e);
    }
  }
  return { effects, tail: a.tail ?? b.tail };
}

export function remove_effect(row: EffectRow, to_remove: string): EffectRow {
  return {
    effects: row.effects.filter(e => e.kind !== to_remove),
    tail: row.tail,
  };
}

export function remove_fail_effect(row: EffectRow): EffectRow {
  return {
    effects: row.effects.filter(e => e.kind !== "fail"),
    tail: row.tail,
  };
}

function effects_equal(a: Effect, b: Effect): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === "io" && b.kind === "io") return true;
  if (a.kind === "fail" && b.kind === "fail") return true; // simplified: don't compare error types
  return false;
}
```

- [ ] **Step 6: Implement AST → HIR lowering + main checker**

Create `compiler/src/checker/lower.ts`:

```typescript
import { Expr, Stmt, Decl, Program, Pattern, MatchArm } from "../ast/index.js";
import { HExpr, HStmt, HDecl, HProgram, HPattern, HMatchArm, HFnDecl, HEffectHandler } from "../hir/index.js";
import { Type, EffectRow, Effect, fresh_type_var, empty_effect_row, effect_row, type_to_string, INT, FLOAT, STR, BOOL, UNIT, NEVER, ANY } from "../types/index.js";
import { TypeEnv, TypeScheme } from "./env.js";
import { Substitution, new_subst, apply, unify, compose, resolve_type_expr, infer_binop } from "./infer.js";
import { merge_effects, remove_effect, remove_fail_effect } from "./effects.js";
import { check_exhaustive } from "./exhaustive.js";
import { CompileError, error_at } from "../errors.js";

export function check(program: Program): HProgram {
  const env = new TypeEnv();
  let subst = new_subst();

  // First pass: register all top-level declarations
  for (const decl of program.decls) {
    register_decl(decl, env);
  }

  // Second pass: type-check and lower
  const hir_decls: HDecl[] = [];
  for (const decl of program.decls) {
    const { hdecl, new_subst: s } = check_decl(decl, env, subst);
    subst = s;
    if (hdecl) hir_decls.push(hdecl);
  }

  return { decls: hir_decls };
}

function register_decl(decl: Decl, env: TypeEnv): void {
  switch (decl.kind) {
    case "struct_decl": {
      const fields = new Map<string, Type>();
      for (const f of decl.fields) {
        fields.set(f.name, resolve_type_expr(f.type_ann, env));
      }
      env.define_struct(decl.name, fields);
      const struct_type: Type = { kind: "struct", name: decl.name, fields };
      env.define(decl.name, { vars: [], type: struct_type });
      break;
    }
    case "enum_decl": {
      const variants = new Map<string, Type[]>();
      for (const v of decl.variants) {
        variants.set(v.name, v.fields.map(f => resolve_type_expr(f.type_ann, env)));
      }
      env.define_enum(decl.name, variants);
      // Register constructor functions
      for (const v of decl.variants) {
        const param_types = v.fields.map(f => resolve_type_expr(f.type_ann, env));
        const enum_type: Type = { kind: "enum", name: decl.name, variants };
        const fn_type: Type = { kind: "fn", params: param_types, ret: enum_type, effects: empty_effect_row() };
        env.define(v.name, { vars: [], type: fn_type });
      }
      break;
    }
    case "fn_decl": {
      const param_types = decl.params.map(p => p.type_ann ? resolve_type_expr(p.type_ann, env) : fresh_type_var());
      const ret_type = decl.ret_type ? resolve_type_expr(decl.ret_type, env) : fresh_type_var();
      const fn_type: Type = { kind: "fn", params: param_types, ret: ret_type, effects: empty_effect_row() };
      env.define(decl.name, { vars: [], type: fn_type });
      break;
    }
    case "impl_decl": {
      for (const method of decl.methods) {
        if (method.kind === "fn_decl") {
          const param_types = method.params.map(p => p.type_ann ? resolve_type_expr(p.type_ann, env) : fresh_type_var());
          const ret_type = method.ret_type ? resolve_type_expr(method.ret_type, env) : fresh_type_var();
          const fn_type: Type = { kind: "fn", params: param_types, ret: ret_type, effects: empty_effect_row() };
          env.define_impl_method(decl.target, method.name, fn_type);
        }
      }
      break;
    }
    case "effect_decl": {
      const ops = new Map<string, { params: Type[]; ret: Type }>();
      for (const op of decl.operations) {
        ops.set(op.name, {
          params: op.params.map(p => p.type_ann ? resolve_type_expr(p.type_ann, env) : ANY),
          ret: resolve_type_expr(op.ret_type, env),
        });
      }
      env.define_effect(decl.name, ops);
      break;
    }
  }
}

function check_decl(decl: Decl, env: TypeEnv, subst: Substitution): { hdecl: HDecl | null; new_subst: Substitution } {
  switch (decl.kind) {
    case "struct_decl": {
      const fields = decl.fields.map(f => ({
        name: f.name,
        type: resolve_type_expr(f.type_ann, env),
      }));
      return { hdecl: { kind: "struct_decl", decl: { name: decl.name, fields } }, new_subst: subst };
    }
    case "enum_decl": {
      const variants = decl.variants.map(v => ({
        name: v.name,
        fields: v.fields.map(f => resolve_type_expr(f.type_ann, env)),
      }));
      return { hdecl: { kind: "enum_decl", decl: { name: decl.name, variants } }, new_subst: subst };
    }
    case "fn_decl": {
      const { hfn, new_subst: s } = check_fn(decl.name, decl.params, decl.ret_type, decl.body, env, subst);
      return { hdecl: { kind: "fn_decl", decl: hfn }, new_subst: s };
    }
    case "impl_decl": {
      const methods: HFnDecl[] = [];
      let s = subst;
      for (const method of decl.methods) {
        if (method.kind === "fn_decl") {
          const { hfn, new_subst: ns } = check_fn(method.name, method.params, method.ret_type, method.body, env, s);
          methods.push(hfn);
          s = ns;
        }
      }
      return { hdecl: { kind: "impl_decl", decl: { target: decl.target, methods } }, new_subst: s };
    }
    case "test_decl": {
      const { hexpr, new_subst: s } = infer_expr(decl.body, env, subst);
      return { hdecl: { kind: "test_decl", decl: { name: decl.name, body: hexpr } }, new_subst: s };
    }
    case "effect_decl": {
      return { hdecl: null, new_subst: subst };
    }
  }
}

function check_fn(
  name: string,
  params: { name: string; type_ann?: any; span: any }[],
  ret_type_expr: any | undefined,
  body: Expr,
  env: TypeEnv,
  subst: Substitution
): { hfn: HFnDecl; new_subst: Substitution } {
  env.push_scope();

  const param_types: { name: string; type: Type }[] = [];
  for (const p of params) {
    const t = p.type_ann ? resolve_type_expr(p.type_ann, env) : fresh_type_var();
    param_types.push({ name: p.name, type: t });
    env.define(p.name, { vars: [], type: t });
  }

  const { hexpr, new_subst: s1, effects } = infer_expr(body, env, subst);
  let s = s1;

  const inferred_ret = apply(s, hexpr.type);
  const expected_ret = ret_type_expr ? resolve_type_expr(ret_type_expr, env) : fresh_type_var();

  s = unify(inferred_ret, expected_ret, s);
  const final_ret = apply(s, expected_ret);
  const final_effects = effects;

  env.pop_scope();

  const resolved_params = param_types.map(p => ({ name: p.name, type: apply(s, p.type) }));

  return {
    hfn: {
      name,
      params: resolved_params,
      ret_type: final_ret,
      effects: final_effects,
      body: hexpr,
    },
    new_subst: s,
  };
}

function infer_expr(expr: Expr, env: TypeEnv, subst: Substitution): { hexpr: HExpr; new_subst: Substitution; effects: EffectRow } {
  switch (expr.kind) {
    case "int_lit":
      return { hexpr: { kind: "int_lit", value: expr.value, type: INT, effects: empty_effect_row() }, new_subst: subst, effects: empty_effect_row() };
    case "float_lit":
      return { hexpr: { kind: "float_lit", value: expr.value, type: FLOAT, effects: empty_effect_row() }, new_subst: subst, effects: empty_effect_row() };
    case "str_lit":
      return { hexpr: { kind: "str_lit", value: expr.value, type: STR, effects: empty_effect_row() }, new_subst: subst, effects: empty_effect_row() };
    case "bool_lit":
      return { hexpr: { kind: "bool_lit", value: expr.value, type: BOOL, effects: empty_effect_row() }, new_subst: subst, effects: empty_effect_row() };

    case "ident": {
      const scheme = env.lookup(expr.name);
      if (!scheme) throw new Error(`Undefined variable: ${expr.name} at ${expr.span.line}:${expr.span.col}`);
      const t = env.instantiate(scheme);
      return { hexpr: { kind: "ident", name: expr.name, type: t, effects: empty_effect_row() }, new_subst: subst, effects: empty_effect_row() };
    }

    case "bin_op": {
      const { hexpr: left, new_subst: s1, effects: e1 } = infer_expr(expr.left, env, subst);
      const { hexpr: right, new_subst: s2, effects: e2 } = infer_expr(expr.right, env, s1);
      const { type: result_type, subst: s3 } = infer_binop(expr.op, apply(s2, left.type), apply(s2, right.type), s2);
      const merged = merge_effects(e1, e2);
      return { hexpr: { kind: "bin_op", op: expr.op, left, right, type: result_type, effects: merged }, new_subst: s3, effects: merged };
    }

    case "unary_op": {
      const { hexpr: operand, new_subst: s1, effects } = infer_expr(expr.operand, env, subst);
      let result_type: Type;
      let s = s1;
      if (expr.op === "!") {
        s = unify(operand.type, BOOL, s);
        result_type = BOOL;
      } else {
        s = unify(operand.type, INT, s);
        result_type = INT;
      }
      return { hexpr: { kind: "unary_op", op: expr.op, operand, type: result_type, effects }, new_subst: s, effects };
    }

    case "call": {
      const { hexpr: callee, new_subst: s1, effects: callee_effects } = infer_expr(expr.callee, env, subst);
      let s = s1;
      const hargs: HExpr[] = [];
      let all_effects = callee_effects;
      for (const arg of expr.args) {
        const { hexpr: harg, new_subst: ns, effects: ae } = infer_expr(arg, env, s);
        hargs.push(harg);
        s = ns;
        all_effects = merge_effects(all_effects, ae);
      }
      const ret_var = fresh_type_var();
      const fn_type: Type = { kind: "fn", params: hargs.map(a => a.type), ret: ret_var, effects: empty_effect_row() };
      s = unify(apply(s, callee.type), fn_type, s);
      const result_type = apply(s, ret_var);
      // Merge callee function's effects
      const callee_resolved = apply(s, callee.type);
      if (callee_resolved.kind === "fn") {
        all_effects = merge_effects(all_effects, callee_resolved.effects);
      }
      return { hexpr: { kind: "call", callee, args: hargs, type: result_type, effects: all_effects }, new_subst: s, effects: all_effects };
    }

    case "method_call": {
      const { hexpr: obj, new_subst: s1, effects: obj_effects } = infer_expr(expr.object, env, subst);
      let s = s1;
      const obj_type = apply(s, obj.type);

      // Check for effect operation: io.read(path) pattern
      if (expr.object.kind === "ident") {
        const effect_op = env.get_effect_op(expr.object.name, expr.method);
        if (effect_op) {
          const hargs: HExpr[] = [];
          let all_effects = obj_effects;
          for (const arg of expr.args) {
            const { hexpr: harg, new_subst: ns, effects: ae } = infer_expr(arg, env, s);
            hargs.push(harg);
            s = ns;
            all_effects = merge_effects(all_effects, ae);
          }
          const effect: Effect = expr.object.name === "io" ? { kind: "io" } : { kind: "fail", error: STR };
          all_effects = merge_effects(all_effects, effect_row(effect));
          return {
            hexpr: { kind: "effect_op", effect: expr.object.name, op: expr.method, args: hargs, type: effect_op.ret, effects: all_effects },
            new_subst: s, effects: all_effects,
          };
        }
      }

      // Check for field access that returns a function (e.g., toml.parse)
      if (obj_type.kind === "struct" && obj_type.fields.has(expr.method)) {
        const method_type = obj_type.fields.get(expr.method)!;
        if (method_type.kind === "fn") {
          const hargs: HExpr[] = [];
          let all_effects = obj_effects;
          for (const arg of expr.args) {
            const { hexpr: harg, new_subst: ns, effects: ae } = infer_expr(arg, env, s);
            hargs.push(harg);
            s = ns;
            all_effects = merge_effects(all_effects, ae);
          }
          all_effects = merge_effects(all_effects, method_type.effects);
          const callee_expr: HExpr = { kind: "field_access", object: obj, field: expr.method, type: method_type, effects: empty_effect_row() };
          return {
            hexpr: { kind: "call", callee: callee_expr, args: hargs, type: method_type.ret, effects: all_effects },
            new_subst: s, effects: all_effects,
          };
        }
      }

      // Check impl methods
      let target_name = "";
      if (obj_type.kind === "struct") target_name = obj_type.name;
      else if (obj_type.kind === "enum") target_name = obj_type.name;

      if (target_name) {
        const method_type = env.get_impl_method(target_name, expr.method);
        if (method_type && method_type.kind === "fn") {
          const hargs: HExpr[] = [];
          let all_effects = obj_effects;
          for (const arg of expr.args) {
            const { hexpr: harg, new_subst: ns, effects: ae } = infer_expr(arg, env, s);
            hargs.push(harg);
            s = ns;
            all_effects = merge_effects(all_effects, ae);
          }
          const callee_name = `${target_name}_${expr.method}`;
          const callee_expr: HExpr = { kind: "ident", name: callee_name, type: method_type, effects: empty_effect_row() };
          const all_args = [obj, ...hargs];
          return {
            hexpr: { kind: "call", callee: callee_expr, args: all_args, type: method_type.ret, effects: all_effects },
            new_subst: s, effects: all_effects,
          };
        }
      }

      // Fallback: treat as method call on the object's prototype
      const hargs: HExpr[] = [];
      let all_effects = obj_effects;
      for (const arg of expr.args) {
        const { hexpr: harg, new_subst: ns, effects: ae } = infer_expr(arg, env, s);
        hargs.push(harg);
        s = ns;
        all_effects = merge_effects(all_effects, ae);
      }
      const ret = fresh_type_var();
      return {
        hexpr: { kind: "call", callee: { kind: "field_access", object: obj, field: expr.method, type: ANY, effects: empty_effect_row() }, args: hargs, type: ret, effects: all_effects },
        new_subst: s, effects: all_effects,
      };
    }

    case "field_access": {
      const { hexpr: obj, new_subst: s1, effects } = infer_expr(expr.object, env, subst);
      const obj_type = apply(s1, obj.type);
      let field_type: Type = ANY;
      if (obj_type.kind === "struct") {
        const ft = obj_type.fields.get(expr.field);
        if (ft) field_type = ft;
      }
      return { hexpr: { kind: "field_access", object: obj, field: expr.field, type: field_type, effects }, new_subst: s1, effects };
    }

    case "struct_lit": {
      const struct_def = env.get_struct(expr.name);
      if (!struct_def) throw new Error(`Unknown struct: ${expr.name}`);
      let s = subst;
      let all_effects = empty_effect_row();
      const hfields: { name: string; value: HExpr }[] = [];
      for (const f of expr.fields) {
        const { hexpr: hval, new_subst: ns, effects: fe } = infer_expr(f.value, env, s);
        const expected_type = struct_def.fields.get(f.name);
        if (expected_type) s = unify(hval.type, expected_type, ns);
        else s = ns;
        hfields.push({ name: f.name, value: hval });
        all_effects = merge_effects(all_effects, fe);
      }
      const result_type: Type = { kind: "struct", name: expr.name, fields: struct_def.fields };
      return { hexpr: { kind: "struct_lit", name: expr.name, fields: hfields, type: result_type, effects: all_effects }, new_subst: s, effects: all_effects };
    }

    case "match_expr": {
      const { hexpr: subject, new_subst: s1, effects: subj_effects } = infer_expr(expr.subject, env, subst);
      let s = s1;
      let all_effects = subj_effects;
      const result_type = fresh_type_var();
      const harms: HMatchArm[] = [];

      for (const arm of expr.arms) {
        env.push_scope();
        bind_pattern(arm.pattern, apply(s, subject.type), env);
        const { hexpr: hbody, new_subst: ns, effects: arm_effects } = infer_expr(arm.body, env, s);
        s = unify(hbody.type, result_type, ns);
        all_effects = merge_effects(all_effects, arm_effects);
        harms.push({ pattern: lower_pattern(arm.pattern), body: hbody });
        env.pop_scope();
      }

      // Exhaustiveness check
      const missing = check_exhaustive(expr.arms.map(a => a.pattern), apply(s, subject.type), env);
      if (missing) throw new Error(`Non-exhaustive match: missing variant "${missing}"`);

      return { hexpr: { kind: "match_expr", subject, arms: harms, type: apply(s, result_type), effects: all_effects }, new_subst: s, effects: all_effects };
    }

    case "block": {
      env.push_scope();
      let s = subst;
      let all_effects = empty_effect_row();
      const hstmts: HStmt[] = [];

      for (const stmt of expr.stmts) {
        const { hstmt, new_subst: ns, effects: se } = infer_stmt(stmt, env, s);
        hstmts.push(hstmt);
        s = ns;
        all_effects = merge_effects(all_effects, se);
      }

      let result_type: Type = UNIT;
      let final_expr: HExpr | undefined;
      if (expr.expr) {
        const { hexpr, new_subst: ns, effects: ee } = infer_expr(expr.expr, env, s);
        final_expr = hexpr;
        s = ns;
        result_type = hexpr.type;
        all_effects = merge_effects(all_effects, ee);
      }

      env.pop_scope();
      return { hexpr: { kind: "block", stmts: hstmts, expr: final_expr, type: result_type, effects: all_effects }, new_subst: s, effects: all_effects };
    }

    case "if_expr": {
      const { hexpr: cond, new_subst: s1, effects: ce } = infer_expr(expr.condition, env, subst);
      let s = unify(cond.type, BOOL, s1);
      const { hexpr: then_b, new_subst: s2, effects: te } = infer_expr(expr.then_branch, env, s);
      s = s2;
      let all_effects = merge_effects(ce, te);
      let else_b: HExpr | undefined;
      if (expr.else_branch) {
        const { hexpr: eb, new_subst: s3, effects: ee } = infer_expr(expr.else_branch, env, s);
        s = unify(then_b.type, eb.type, s3);
        else_b = eb;
        all_effects = merge_effects(all_effects, ee);
      }
      return { hexpr: { kind: "if_expr", condition: cond, then_branch: then_b, else_branch: else_b, type: apply(s, then_b.type), effects: all_effects }, new_subst: s, effects: all_effects };
    }

    case "string_interp": {
      let s = subst;
      let all_effects = empty_effect_row();
      const hparts: (string | HExpr)[] = [];
      for (const part of expr.parts) {
        if (typeof part === "string") {
          hparts.push(part);
        } else {
          const { hexpr, new_subst: ns, effects: pe } = infer_expr(part, env, s);
          hparts.push(hexpr);
          s = ns;
          all_effects = merge_effects(all_effects, pe);
        }
      }
      return { hexpr: { kind: "string_interp", parts: hparts, type: STR, effects: all_effects }, new_subst: s, effects: all_effects };
    }

    case "or_expr": {
      const { hexpr: left, new_subst: s1, effects: le } = infer_expr(expr.left, env, subst);
      const { hexpr: right, new_subst: s2, effects: re } = infer_expr(expr.right, env, s1);
      let s = unify(left.type, right.type, s2);
      // or removes fail effect from left side
      const cleaned_effects = remove_fail_effect(le);
      const all_effects = merge_effects(cleaned_effects, re);
      return { hexpr: { kind: "try_catch", try_expr: left, catch_expr: right, type: apply(s, left.type), effects: all_effects }, new_subst: s, effects: all_effects };
    }

    case "catch_expr": {
      const { hexpr: try_expr, new_subst: s1, effects: te } = infer_expr(expr.expr, env, subst);
      const { hexpr: handler, new_subst: s2, effects: he } = infer_expr(expr.handler, env, s1);
      let s = s2;
      // Handler should be a function that returns same type as try_expr
      if (handler.type.kind === "fn") {
        s = unify(handler.type.ret, try_expr.type, s);
      }
      const cleaned_effects = remove_fail_effect(te);
      const all_effects = merge_effects(cleaned_effects, he);
      return { hexpr: { kind: "try_catch", try_expr, catch_expr: handler, type: apply(s, try_expr.type), effects: all_effects }, new_subst: s, effects: all_effects };
    }

    case "handle_expr": {
      const { hexpr: body, new_subst: s1, effects: body_effects } = infer_expr(expr.body, env, subst);
      let s = s1;
      const hhandlers: HEffectHandler[] = [];
      let all_effects = body_effects;

      for (const h of expr.handlers) {
        env.push_scope();
        for (const p of h.params) {
          env.define(p, { vars: [], type: ANY });
        }
        const { hexpr: hbody, new_subst: ns } = infer_expr(h.body, env, s);
        s = ns;
        hhandlers.push({ effect: h.effect, op: h.op, params: h.params, body: hbody });
        env.pop_scope();

        // Remove handled effects
        if (h.effect === "fail") {
          all_effects = remove_fail_effect(all_effects);
        } else {
          all_effects = remove_effect(all_effects, h.effect);
        }
      }

      return { hexpr: { kind: "handle_expr", body, handlers: hhandlers, type: body.type, effects: all_effects }, new_subst: s, effects: all_effects };
    }

    case "lambda": {
      env.push_scope();
      const param_types: string[] = [];
      const fn_params: Type[] = [];
      for (const p of expr.params) {
        const t = p.type_ann ? resolve_type_expr(p.type_ann, env) : fresh_type_var();
        env.define(p.name, { vars: [], type: t });
        param_types.push(p.name);
        fn_params.push(t);
      }
      const { hexpr: body, new_subst: s1, effects } = infer_expr(expr.body, env, subst);
      env.pop_scope();
      const fn_type: Type = { kind: "fn", params: fn_params, ret: body.type, effects };
      return { hexpr: { kind: "lambda", params: param_types, body, type: fn_type, effects: empty_effect_row() }, new_subst: s1, effects: empty_effect_row() };
    }

    default:
      throw new Error(`Unhandled expression kind: ${(expr as any).kind}`);
  }
}

function infer_stmt(stmt: Stmt, env: TypeEnv, subst: Substitution): { hstmt: HStmt; new_subst: Substitution; effects: EffectRow } {
  switch (stmt.kind) {
    case "let_stmt": case "var_stmt": {
      const { hexpr, new_subst: s, effects } = infer_expr(stmt.value, env, subst);
      const var_type = apply(s, hexpr.type);
      if (stmt.type_ann) {
        const ann_type = resolve_type_expr(stmt.type_ann, env);
        const s2 = unify(var_type, ann_type, s);
        env.define(stmt.name, { vars: [], type: apply(s2, ann_type) });
        return { hstmt: { kind: stmt.kind, name: stmt.name, value: hexpr, type: apply(s2, ann_type) }, new_subst: s2, effects };
      }
      env.define(stmt.name, { vars: [], type: var_type });
      return { hstmt: { kind: stmt.kind, name: stmt.name, value: hexpr, type: var_type }, new_subst: s, effects };
    }
    case "assign_stmt": {
      const { hexpr: value, new_subst: s, effects } = infer_expr(stmt.value, env, subst);
      const target_name = stmt.target.kind === "ident" ? stmt.target.name : "__unknown";
      return { hstmt: { kind: "assign_stmt", name: target_name, value: hexpr }, new_subst: s, effects };
    }
    case "expr_stmt": {
      const { hexpr, new_subst: s, effects } = infer_expr(stmt.expr, env, subst);
      return { hstmt: { kind: "expr_stmt", expr: hexpr }, new_subst: s, effects };
    }
    case "return_stmt": {
      if (stmt.value) {
        const { hexpr, new_subst: s, effects } = infer_expr(stmt.value, env, subst);
        return { hstmt: { kind: "return_stmt", value: hexpr }, new_subst: s, effects };
      }
      return { hstmt: { kind: "return_stmt" }, new_subst: subst, effects: empty_effect_row() };
    }
  }
}

function bind_pattern(pattern: Pattern, type: Type, env: TypeEnv): void {
  switch (pattern.kind) {
    case "binding":
      env.define(pattern.name, { vars: [], type });
      break;
    case "constructor": {
      if (type.kind === "enum") {
        const variant_types = type.variants.get(pattern.name);
        if (variant_types) {
          for (let i = 0; i < pattern.fields.length; i++) {
            bind_pattern(pattern.fields[i], variant_types[i] ?? ANY, env);
          }
        }
      }
      break;
    }
    case "wildcard": case "literal": break;
  }
}

function lower_pattern(pattern: Pattern): HPattern {
  switch (pattern.kind) {
    case "wildcard": return { kind: "wildcard" };
    case "binding": return { kind: "binding", name: pattern.name };
    case "constructor": return { kind: "constructor", name: pattern.name, fields: pattern.fields.map(lower_pattern) };
    case "literal": {
      if (pattern.expr.kind === "int_lit") return { kind: "literal", value: pattern.expr.value };
      if (pattern.expr.kind === "str_lit") return { kind: "literal", value: pattern.expr.value };
      if (pattern.expr.kind === "bool_lit") return { kind: "literal", value: pattern.expr.value };
      return { kind: "wildcard" };
    }
  }
}
```

- [ ] **Step 7: Create main checker entry point**

Create `compiler/src/checker/checker.ts`:

```typescript
import { Program } from "../ast/index.js";
import { HProgram } from "../hir/index.js";
import { check as lower_and_check } from "./lower.js";
import { reset_type_var_counter } from "../types/index.js";

export function check(program: Program): HProgram {
  reset_type_var_counter();
  return lower_and_check(program);
}
```

- [ ] **Step 8: Run checker tests**

Run: `cd compiler && npx tsc && node --test dist/checker/checker.test.js`

Expected: All tests pass. Debug and fix any failures.

- [ ] **Step 9: Commit checker**

```bash
git add compiler/src/checker/
git commit -m "feat: implement HM type inference + effect inference + exhaustiveness checker"
```

---

## Task 5: CLI + Integration + End-to-End Tests

**Dependency:** Tasks 1-4 (all modules)

**Files:**
- Modify: `compiler/src/cli.ts`
- Create: `tests/e2e.test.ts`
- Create: `tests/cases/hello.ring`
- Create: `tests/cases/enum_match.ring`
- Create: `tests/cases/fail_or.ring`
- Create: `tests/cases/effect_handler.ring`
- Modify: `examples/hello.ring` (update comments to //)
- Modify: `examples/effects.ring` (update comments to //)

- [ ] **Step 1: Implement CLI**

Replace `compiler/src/cli.ts`:

```typescript
#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { parse } from "./parser/parser.js";
import { check } from "./checker/checker.js";
import { generate } from "./codegen/codegen.js";

const args = process.argv.slice(2);
const command = args[0];

if (!command || command === "help") {
  console.log(`Ring-lang compiler v0.1.0

Usage:
  ring build <file.ring>    Compile to JavaScript
  ring run <file.ring>      Compile and execute
  ring check <file.ring>    Type-check without emitting

Options:
  --error-format=llm        Output structured errors for LLM consumption
`);
  process.exit(0);
}

const file = args[1];
if (!file) {
  console.error("Error: no input file specified");
  process.exit(1);
}

try {
  const source = readFileSync(file, "utf-8");
  const ast = parse(source);

  if (command === "check") {
    check(ast);
    console.log("Type check passed.");
    process.exit(0);
  }

  const hir = check(ast);
  const js = generate(hir);

  if (command === "build") {
    const out_file = file.replace(/\.ring$/, ".js");
    writeFileSync(out_file, js, "utf-8");
    console.log(`Compiled to ${out_file}`);
  } else if (command === "run") {
    const tmp_file = file.replace(/\.ring$/, ".tmp.js");
    writeFileSync(tmp_file, js, "utf-8");
    try {
      execSync(`node "${tmp_file}"`, { stdio: "inherit" });
    } finally {
      try { require("fs").unlinkSync(tmp_file); } catch {}
    }
  } else {
    console.error(`Unknown command: ${command}`);
    process.exit(1);
  }
} catch (e: any) {
  if (args.includes("--error-format=llm")) {
    console.error(JSON.stringify({ error: e.message, file }));
  } else {
    console.error(`Error: ${e.message}`);
  }
  process.exit(1);
}
```

- [ ] **Step 2: Update example files to use // comments**

Update `examples/hello.ring`:

```ring
// Ring-lang: Hello World
// 这个文件展示语言的基本语法

struct Greeting {
    target: Str,
    enthusiasm: Int,
}

fn greet(g: Greeting) -> Str {
    "Hello, ${g.target}!"
}

fn main() {
    let g = Greeting { target: "Ring-lang", enthusiasm: 3 }
    print(greet(g))
}
```

Update `examples/effects.ring`:

```ring
// Ring-lang: Effect system demo
// 展示 4 层错误处理甜度和 effect handler

struct Config {
    host: Str,
    port: Int,
}

// 层级 0：冒泡（零语法，effect 自动传播）
fn load_config(path: Str) -> Config {
    let raw = io.read(path)
    let table = toml.parse(raw)
    Config {
        host: table.get("host"),
        port: table.get_int("port"),
    }
}

// 层级 1：or 兜底
fn get_config() -> Config {
    load_config("custom.toml") or load_config("default.toml")
}

// 层级 2：catch 轻量捕获
fn get_port(path: Str) -> Int {
    let config = load_config(path) catch fn(e) {
        Config { host: "localhost", port: 8080 }
    }
    config.port
}

// 层级 4：完整 handler（测试 mock）
test "load_config parses correctly" {
    handle {
        let config = load_config("fake.toml")
        assert(config.port == 3000)
        assert(config.host == "example.com")
    } with {
        io.read(_path) => r#"host = "example.com"\nport = 3000"#,
        fail(e) => panic("unexpected error"),
    }
}

// 入口
fn main() {
    handle {
        let config = get_config()
        print("Server at ${config.host}:${config.port}")
    } with {
        fail(e) => { print("Error: ${e}"); exit(1) },
        io => perform,
    }
}
```

- [ ] **Step 3: Create simpler e2e test cases**

Create `tests/cases/hello.ring`:

```ring
struct Point {
    x: Int,
    y: Int,
}

fn add(a: Int, b: Int) -> Int {
    a + b
}

fn main() {
    let p = Point { x: 1, y: 2 }
    print(add(p.x, p.y))
}
```

Create `tests/cases/enum_match.ring`:

```ring
enum Color {
    red(),
    green(),
    blue(),
}

fn name(c: Color) -> Str {
    match c {
        red() => "red",
        green() => "green",
        blue() => "blue",
    }
}

fn main() {
    let c = red()
    print(name(c))
}
```

Create `tests/cases/fail_or.ring`:

```ring
fn risky(x: Int) -> Int {
    if x > 0 { x } else { panic("negative") }
}

fn safe(x: Int) -> Int {
    risky(x) or 0
}

fn main() {
    print(safe(5))
    print(safe(-1))
}
```

Create `tests/cases/effect_handler.ring`:

```ring
fn read_data(path: Str) -> Str {
    io.read(path)
}

test "mock io" {
    handle {
        let data = read_data("test.txt")
        assert(data == "hello")
    } with {
        io.read(_path) => "hello",
    }
}

fn main() {
    print("effect handler tests passed")
}
```

- [ ] **Step 4: Create e2e test runner**

Create `tests/e2e.test.ts`:

```typescript
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { parse } from "../compiler/src/parser/parser.js";
import { check } from "../compiler/src/checker/checker.js";
import { generate } from "../compiler/src/codegen/codegen.js";

function compile_and_run(file: string): string {
  const source = readFileSync(file, "utf-8");
  const ast = parse(source);
  const hir = check(ast);
  const js = generate(hir);
  // Execute the generated JS and capture output
  const result = execSync(`node -e ${JSON.stringify(js)}`, { encoding: "utf-8" });
  return result.trim();
}

describe("End-to-end", () => {
  it("compiles and runs hello.ring", () => {
    const output = compile_and_run("tests/cases/hello.ring");
    assert.equal(output, "3");
  });

  it("compiles and runs enum_match.ring", () => {
    const output = compile_and_run("tests/cases/enum_match.ring");
    assert.equal(output, "red");
  });

  it("compiles and runs fail_or.ring", () => {
    const output = compile_and_run("tests/cases/fail_or.ring");
    assert.equal(output, "5\n0");
  });

  it("compiles and runs effect_handler.ring", () => {
    const output = compile_and_run("tests/cases/effect_handler.ring");
    assert.equal(output, "effect handler tests passed");
  });
});
```

- [ ] **Step 5: Update package.json test script**

Modify `compiler/package.json` to include all test files:

```json
{
  "name": "ring-lang-compiler",
  "version": "0.1.0",
  "description": "Ring-lang compiler - transpiles to JavaScript",
  "type": "module",
  "main": "dist/cli.js",
  "bin": {
    "ring": "dist/cli.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "node --test dist/**/*.test.js",
    "test:e2e": "node --test ../tests/e2e.test.js",
    "clean": "rm -rf dist"
  },
  "devDependencies": {
    "typescript": "^5.8.0",
    "@types/node": "^22.0.0"
  }
}
```

- [ ] **Step 6: Build and run all tests**

Run:
```bash
cd compiler && npm install && npx tsc
node --test dist/parser/parser.test.js
node --test dist/checker/checker.test.js
node --test dist/codegen/codegen.test.js
```

Expected: All unit tests pass.

- [ ] **Step 7: Run end-to-end tests**

Run: `cd compiler && node dist/cli.js run ../tests/cases/hello.ring`

Expected: outputs `3`

Run: `cd compiler && node dist/cli.js run ../tests/cases/enum_match.ring`

Expected: outputs `red`

- [ ] **Step 8: Fix integration issues**

Debug any failures from Steps 6-7. Common issues:
- Import path mismatches (ensure `.js` extensions in all imports)
- Type inference edge cases in checker
- Codegen output not producing valid JS

Iterate until all e2e cases pass.

- [ ] **Step 9: Run the ultimate test — effects.ring**

Run: `cd compiler && node dist/cli.js run ../examples/effects.ring`

This is the Phase 1 completion gate. If it fails, debug the specific error and fix.

- [ ] **Step 10: Commit integration**

```bash
git add compiler/src/cli.ts examples/ tests/
git commit -m "feat: complete Phase 1 - CLI, integration, e2e tests passing"
```

---

## Parallel Execution Summary

```
                    ┌─────────────────┐
                    │  Task 1: Types  │ (must complete first)
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
    ┌─────────────────┐ ┌────────────┐ ┌─────────────┐
    │ Task 2: Parser  │ │ Task 3:    │ │ Task 4:     │
    │ (lexer+parser)  │ │ Codegen    │ │ Checker     │
    └────────┬────────┘ └─────┬──────┘ └──────┬──────┘
              │               │               │
              └───────────────┴───────────────┘
                             │
                    ┌────────▼────────┐
                    │ Task 5: CLI +   │
                    │ Integration     │
                    └─────────────────┘
```

**Agent assignment:**
- Agent A: Task 2 (Parser) — after Task 1 completes
- Agent B: Task 3 (Codegen) — after Task 1 completes (parallel with A)
- Agent C: Task 4 (Checker) — after Task 1 completes (parallel with A and B)
- Main: Task 1 first, then Task 5 after A/B/C complete
