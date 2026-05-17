# Phase 2 Session 5: Option<T> + Typed Catch + Unit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement `Option<T>` as a first-class enum with `?` postfix, `try` block, dual-use `or`, typed `catch`, and `Unit` type annotation — completing design.md Section 1.5 and Section 2.3 Layer 2.

**Architecture:** Option is a builtin enum (`some(T)` / `none`) registered in `TypeEnv`, using existing enum codegen (`_tag` discriminator). `?` postfix promotes Option to fail effect. `try` block captures fail into Option. `or` branches at checker time on operand type (Option vs fail). Typed catch filters `__EffectAbort.value` via `instanceof` at runtime.

**Tech Stack:** TypeScript compiler (strict mode), node:test, zero dependencies.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `compiler/src/parser/lexer.ts` | Modify | Add `Try` keyword |
| `compiler/src/ast/index.ts` | Modify | Add `OptionUnwrapExpr`, `TryBlockExpr` nodes; extend `CatchExpr` |
| `compiler/src/parser/parser.ts` | Modify | Parse `?` postfix, `try { }`, typed catch |
| `compiler/src/types/index.ts` | Read only | `OptionType` already exists |
| `compiler/src/checker/env.ts` | Modify | Register `Option` enum + `some`/`none` constructors |
| `compiler/src/checker/infer.ts` | Modify | `Unit` resolution, `option_unwrap`, `try_block`, `or` dual-use, typed catch |
| `compiler/src/hir/index.ts` | Modify | Add `HOptionUnwrap`, `HTryBlock`, `HOptionOr` nodes |
| `compiler/src/codegen/codegen.ts` | Modify | Codegen for new HIR nodes |
| `compiler/src/checker/checker.test.ts` | Modify | Unit tests |
| `compiler/src/parser/parser.test.ts` | Modify | Unit tests |
| `tests/cases/*.ring` | Create | 5 new e2e test cases |
| `tests/e2e.test.ts` | Modify | Register new cases |

---

### Task 1: Unit Type Annotation

**Files:**
- Modify: `compiler/src/checker/infer.ts:1714-1719`
- Test: `compiler/src/checker/checker.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `compiler/src/checker/checker.test.ts`:

```typescript
it("accepts Unit as return type annotation", () => {
  const src = `fn noop() -> Unit { }`;
  const program = parse(src);
  const hprogram = check(program);
  assert.equal(hprogram.decls.length, 1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd compiler && npm test 2>&1 | Select-String "Unit"`
Expected: FAIL — "Unknown type: Unit"

- [ ] **Step 3: Add Unit to resolve_named_type**

In `compiler/src/checker/infer.ts`, inside `resolve_named_type` (line 1714-1719), add after `case "Never": return NEVER;`:

```typescript
case "Unit": return UNIT;
```

Ensure `UNIT` is already imported (check top of file for `import { ..., UNIT, ... } from "../types/index.js"`).

- [ ] **Step 4: Run test to verify it passes**

Run: `cd compiler && npm test`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```
git add compiler/src/checker/infer.ts compiler/src/checker/checker.test.ts
git commit -m "feat(checker): support Unit as type annotation"
```

---

### Task 2: Option<T> Builtin Enum Registration

**Files:**
- Modify: `compiler/src/checker/env.ts:145-189`
- Modify: `compiler/src/checker/infer.ts` (resolve_named_type for `Option`)
- Create: `tests/cases/option_basic.ring`
- Modify: `tests/e2e.test.ts`

- [ ] **Step 1: Write the e2e test case**

Create `tests/cases/option_basic.ring`:

```ring
fn find(x: Int) -> Int? {
    if x > 0 { some(x) } else { none }
}

fn main() {
    let a = find(42)
    let result = match a {
        some(v) => v,
        none => 0,
    }
    print(result)
}
```

Register in `tests/e2e.test.ts`, add to the `cases` array:

```typescript
{ file: "option_basic.ring", expected: "42\n" },
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd compiler && npm test 2>&1 | Select-String "option_basic"`
Expected: FAIL — `some` and `none` are undefined

- [ ] **Step 3: Register Option enum in TypeEnv**

In `compiler/src/checker/env.ts`, at end of `register_builtins()` (line 189, before the closing `}`), add:

```typescript
// Built-in: Option<T> — optional value
const option_t = this.fresh_var();
this.enums.set("Option", {
  name: "Option",
  type_params: ["T"],
  type_param_vars: [option_t.id],
  variants: [
    { name: "some", fields: [option_t] },
    { name: "none", fields: [] },
  ],
});
this.variant_to_enum.set("some", "Option");
this.variant_to_enum.set("none", "Option");

// some constructor: fn<T>(T) -> Option<T>
const some_t = this.fresh_var();
const option_some_type: Type = { kind: "option", inner: some_t };
this.bind("some", {
  type: { kind: "fn", params: [some_t], return_type: option_some_type, effects: EMPTY_ROW } as FnType,
  type_vars: [some_t.id],
});

// none constructor: forall T. Option<T>
const none_t = this.fresh_var();
const option_none_type: Type = { kind: "option", inner: none_t };
this.bind("none", {
  type: option_none_type,
  type_vars: [none_t.id],
});
```

Import `FnType` and `EMPTY_ROW` from types if not already imported.

- [ ] **Step 4: Bridge OptionType ↔ EnumType in unify and codegen**

In `compiler/src/checker/unify.ts`, add a case to `unify_types` for when one side is `option` and the other is `enum` named "Option":

```typescript
// OptionType ↔ EnumType "Option" equivalence
if (a.kind === "option" && b.kind === "enum" && b.name === "Option") {
  if (b.type_params.length === 1) {
    return unify_types(a.inner, b.type_params[0], subst);
  }
}
if (b.kind === "option" && a.kind === "enum" && a.name === "Option") {
  if (a.type_params.length === 1) {
    return unify_types(a.type_params[0], b.inner, subst);
  }
}
```

In `compiler/src/checker/infer.ts`, in `resolve_named_type` default branch, add before the struct check:

```typescript
// Option<T> resolves to OptionType
if (name === "Option" && type_args.length === 1) {
  return { kind: "option", inner: this.resolve_type_expr(type_args[0]) };
}
```

- [ ] **Step 5: Codegen for Option constructors**

Option uses standard enum codegen. In `compiler/src/codegen/codegen.ts`, the variant constructor functions for `some` and `none` need to be emitted. Since they're builtins (not declared in user code), add to the runtime preamble in `generate()`:

```typescript
// After the existing runtime preamble lines, add:
lines.push(`function Option_some(_0) { return { _tag: "some", _0 }; }`);
lines.push(`function Option_none() { return { _tag: "none" }; }`);
// Alias for direct use (some(x) and none):
lines.push(`const some = Option_some;`);
lines.push(`const none = Option_none();`);
```

Note: `none` is a value (not a function call), since it has zero fields.

- [ ] **Step 6: Pattern matching for Option variants**

The existing enum pattern matching should already work since Option is registered as an enum. The codegen for `match` uses `_tag` discriminator, which `some`/`none` objects have. Verify this works with the e2e test.

- [ ] **Step 7: Run tests**

Run: `cd compiler && npm test`
Expected: ALL PASS including `option_basic.ring`

- [ ] **Step 8: Commit**

```
git add compiler/src/checker/env.ts compiler/src/checker/infer.ts compiler/src/checker/unify.ts compiler/src/codegen/codegen.ts tests/cases/option_basic.ring tests/e2e.test.ts
git commit -m "feat(option): register Option<T> builtin enum with some/none"
```

---

### Task 3: `?` Postfix Operator (Option → fail promotion)

**Files:**
- Modify: `compiler/src/ast/index.ts:116-135`
- Modify: `compiler/src/parser/parser.ts:39-59, 632-662`
- Modify: `compiler/src/hir/index.ts:11-29`
- Modify: `compiler/src/checker/infer.ts:780-837`
- Modify: `compiler/src/codegen/codegen.ts:300-340`
- Create: `tests/cases/option_unwrap.ring`
- Modify: `tests/e2e.test.ts`

- [ ] **Step 1: Write the e2e test case**

Create `tests/cases/option_unwrap.ring`:

```ring
fn find(x: Int) -> Int? {
    if x > 0 { some(x) } else { none }
}

fn use_find() -> Int {
    let v = find(42)?
    v + 1
}

fn main() {
    let result = use_find() or 0
    print(result)
}
```

Register in `tests/e2e.test.ts`:

```typescript
{ file: "option_unwrap.ring", expected: "43\n" },
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd compiler && npm test 2>&1 | Select-String "option_unwrap"`
Expected: FAIL — parser doesn't handle `?` after expression

- [ ] **Step 3: Add AST node**

In `compiler/src/ast/index.ts`, add to the `Expr` union (after `| LambdaExpr`):

```typescript
| OptionUnwrapExpr;
```

Add the interface:

```typescript
export interface OptionUnwrapExpr {
  kind: "option_unwrap";
  expr: Expr;
  span: Span;
}
```

- [ ] **Step 4: Add `?` to infix_precedence and parser loop**

In `compiler/src/parser/parser.ts`:

1. In `infix_precedence` (line 39-59), add before `default`:

```typescript
case TokenKind.Question: return Prec.Postfix;
```

2. In `parse_expr_bp` loop (line 632-662), add after the `LParen` branch (line 648):

```typescript
} else if (tok.kind === TokenKind.Question) {
  this.advance();
  const end_span = tok.span;
  left = { kind: "option_unwrap", expr: left, span: this.make_span(left.span.start, end_span.end) } as OptionUnwrapExpr;
  last_was_comparison = false;
```

Import `OptionUnwrapExpr` from ast.

- [ ] **Step 5: Add HIR node**

In `compiler/src/hir/index.ts`, add to `HExpr` union:

```typescript
| HOptionUnwrap;
```

Add the interface:

```typescript
export interface HOptionUnwrap extends HExprBase {
  kind: "option_unwrap";
  expr: HExpr;
}
```

- [ ] **Step 6: Add checker logic**

In `compiler/src/checker/infer.ts`, in `infer_expr` switch (before `default`), add:

```typescript
case "option_unwrap":
  return this.infer_option_unwrap(expr.expr, expr.span, subst);
```

Add the method:

```typescript
private infer_option_unwrap(inner_expr: Expr, span: Span, subst: Substitution): InferResult {
  const inner_r = this.infer_expr(inner_expr, subst);
  let s = inner_r.subst;

  // Expr must be Option<T>
  const inner_type = this.env.fresh_var();
  s = unify(inner_r.hexpr.type, { kind: "option", inner: inner_type }, s);
  const unwrapped = apply(s, inner_type);

  // Introduce fail<Unit> effect
  const fail_eff: Effect = { kind: "fail", error_type: UNIT };
  const effects = row_merge(inner_r.effects, { effects: [fail_eff] });

  return {
    hexpr: { kind: "option_unwrap", expr: inner_r.hexpr, type: unwrapped, effects, span },
    subst: s,
    effects,
  };
}
```

Import `Effect` from types if needed.

- [ ] **Step 7: Add codegen**

In `compiler/src/codegen/codegen.ts`, in `gen_expr` switch (before `default`), add:

```typescript
case "option_unwrap":
  return this.gen_option_unwrap(expr);
```

Add the method:

```typescript
private gen_option_unwrap(expr: HExpr & { kind: "option_unwrap" }): string {
  const inner = this.gen_expr(expr.expr);
  return `((v) => v._tag === "some" ? v._0 : ${evidence_param_name("fail")}.raise(undefined))(${inner})`;
}
```

- [ ] **Step 8: Run tests**

Run: `cd compiler && npm test`
Expected: ALL PASS. If TypeScript compilation fails on `assertNever`, add the new cases to all switch exhaustive checks.

- [ ] **Step 9: Commit**

```
git add compiler/src/ast/index.ts compiler/src/parser/parser.ts compiler/src/hir/index.ts compiler/src/checker/infer.ts compiler/src/codegen/codegen.ts tests/cases/option_unwrap.ring tests/e2e.test.ts
git commit -m "feat(option): ? postfix operator promotes Option to fail"
```

---

### Task 4: `try` Block (fail → Option capture)

**Files:**
- Modify: `compiler/src/parser/lexer.ts:7-84, 86-110`
- Modify: `compiler/src/ast/index.ts`
- Modify: `compiler/src/parser/parser.ts:668-749`
- Modify: `compiler/src/hir/index.ts`
- Modify: `compiler/src/checker/infer.ts`
- Modify: `compiler/src/codegen/codegen.ts`
- Create: `tests/cases/option_try.ring`
- Modify: `tests/e2e.test.ts`

- [ ] **Step 1: Write the e2e test case**

Create `tests/cases/option_try.ring`:

```ring
fn risky(x: Int) -> Int {
    if x > 0 { x } else { fail.raise("negative") }
}

fn main() {
    let a = try { risky(42) }
    let b = try { risky(-1) }
    let va = match a { some(v) => v, none => 0 }
    let vb = match b { some(v) => v, none => 0 }
    print(va + vb)
}
```

Register in `tests/e2e.test.ts`:

```typescript
{ file: "option_try.ring", expected: "42\n" },
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd compiler && npm test 2>&1 | Select-String "option_try"`
Expected: FAIL — `try` is not a keyword

- [ ] **Step 3: Add `Try` keyword to lexer**

In `compiler/src/parser/lexer.ts`:

1. Add to `TokenKind` enum (after `Trait = "trait"`, line 31):

```typescript
Try = "try",
```

2. Add to `KEYWORDS` map (after `trait: TokenKind.Trait`, line 109):

```typescript
try: TokenKind.Try,
```

- [ ] **Step 4: Add AST node**

In `compiler/src/ast/index.ts`, add to `Expr` union:

```typescript
| TryBlockExpr;
```

Add the interface:

```typescript
export interface TryBlockExpr {
  kind: "try_block";
  body: Expr;
  span: Span;
}
```

- [ ] **Step 5: Add parser prefix case**

In `compiler/src/parser/parser.ts`, in `parse_prefix` (after the `Handle` case at line 731), add:

```typescript
// Try block: try { body }
if (tok.kind === TokenKind.Try) {
  this.advance();
  const body = this.parse_block_expr();
  return { kind: "try_block", body, span: this.make_span(start, body.span.end) } as TryBlockExpr;
}
```

Import `TryBlockExpr` from ast.

- [ ] **Step 6: Add HIR node**

In `compiler/src/hir/index.ts`, add to `HExpr` union:

```typescript
| HTryBlock;
```

Add the interface:

```typescript
export interface HTryBlock extends HExprBase {
  kind: "try_block";
  body: HExpr;
}
```

- [ ] **Step 7: Add checker logic**

In `compiler/src/checker/infer.ts`, in `infer_expr` switch (before `default`), add:

```typescript
case "try_block":
  return this.infer_try_block(expr.body, expr.span, subst);
```

Add the method:

```typescript
private infer_try_block(body: Expr, span: Span, subst: Substitution): InferResult {
  const body_r = this.infer_expr(body, subst);
  const result_type: OptionType = { kind: "option", inner: body_r.hexpr.type };
  const effects = this.remove_fail_effect(body_r.effects);

  return {
    hexpr: { kind: "try_block", body: body_r.hexpr, type: result_type, effects, span },
    subst: body_r.subst,
    effects,
  };
}
```

Import `OptionType` from types if needed.

- [ ] **Step 8: Add codegen**

In `compiler/src/codegen/codegen.ts`, in `gen_expr` switch (before `default`), add:

```typescript
case "try_block":
  return this.gen_try_block(expr);
```

Add the method:

```typescript
private gen_try_block(expr: HExpr & { kind: "try_block" }): string {
  const body = this.gen_expr(expr.body);
  return `(function() { const __ev_fail = { raise: (__err) => { throw new __EffectAbort("fail", __err); } }; try { return { _tag: "some", _0: ${body} }; } catch (__e) { if (__e instanceof __EffectAbort && __e.effect === "fail") return { _tag: "none" }; throw __e; } })()`;
}
```

- [ ] **Step 9: Run tests**

Run: `cd compiler && npm test`
Expected: ALL PASS

- [ ] **Step 10: Commit**

```
git add compiler/src/parser/lexer.ts compiler/src/ast/index.ts compiler/src/parser/parser.ts compiler/src/hir/index.ts compiler/src/checker/infer.ts compiler/src/codegen/codegen.ts tests/cases/option_try.ring tests/e2e.test.ts
git commit -m "feat(option): try block captures fail into Option"
```

---

### Task 5: `or` Dual-Use (Option + fail)

**Files:**
- Modify: `compiler/src/hir/index.ts`
- Modify: `compiler/src/checker/infer.ts:1491-1519`
- Modify: `compiler/src/codegen/codegen.ts`
- Create: `tests/cases/option_or.ring`
- Modify: `tests/e2e.test.ts`

- [ ] **Step 1: Write the e2e test case**

Create `tests/cases/option_or.ring`:

```ring
fn find(x: Int) -> Int? {
    if x > 0 { some(x) } else { none }
}

fn main() {
    let a = find(42) or 0
    let b = find(-1) or 99
    print(a + b)
}
```

Register in `tests/e2e.test.ts`:

```typescript
{ file: "option_or.ring", expected: "141\n" },
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd compiler && npm test 2>&1 | Select-String "option_or"`
Expected: FAIL — `or` tries to unify `Option<Int>` with `Int`, type mismatch

- [ ] **Step 3: Add HIR node for option_or**

In `compiler/src/hir/index.ts`, add to `HExpr` union:

```typescript
| HOptionOr;
```

Add the interface:

```typescript
export interface HOptionOr extends HExprBase {
  kind: "option_or";
  expr: HExpr;
  default_value: HExpr;
}
```

- [ ] **Step 4: Modify infer_or to branch on type**

In `compiler/src/checker/infer.ts`, replace `infer_or` (lines 1491-1519) with:

```typescript
private infer_or(expr: Expr, default_value: Expr, span: Span, subst: Substitution): InferResult {
  const expr_r = this.infer_expr(expr, subst);
  let s = expr_r.subst;
  const expr_type = apply(s, expr_r.hexpr.type);

  // Option path: expr is Option<T>, default is T
  if (expr_type.kind === "option") {
    const default_r = this.infer_expr(default_value, s);
    s = default_r.subst;
    s = unify(expr_type.inner, default_r.hexpr.type, s);
    const result_type = apply(s, expr_type.inner);
    const effects = row_merge(expr_r.effects, default_r.effects);
    return {
      hexpr: { kind: "option_or", expr: expr_r.hexpr, default_value: default_r.hexpr, type: result_type, effects, span },
      subst: s,
      effects,
    };
  }

  // Fail path: existing behavior
  const default_r = this.infer_expr(default_value, s);
  s = default_r.subst;
  s = unify(expr_r.hexpr.type, default_r.hexpr.type, s);
  let effects = row_merge(expr_r.effects, default_r.effects);
  effects = this.remove_fail_effect(effects);
  const result_type = apply(s, expr_r.hexpr.type);
  return {
    hexpr: { kind: "try_catch", body: expr_r.hexpr, handler: default_r.hexpr, type: result_type, effects, span },
    subst: s,
    effects,
  };
}
```

- [ ] **Step 5: Add codegen for option_or**

In `compiler/src/codegen/codegen.ts`, in `gen_expr` switch (before `default`), add:

```typescript
case "option_or":
  return this.gen_option_or(expr);
```

Add the method:

```typescript
private gen_option_or(expr: HExpr & { kind: "option_or" }): string {
  const inner = this.gen_expr(expr.expr);
  const def = this.gen_expr(expr.default_value);
  return `((v) => v._tag === "some" ? v._0 : ${def})(${inner})`;
}
```

- [ ] **Step 6: Run tests**

Run: `cd compiler && npm test`
Expected: ALL PASS, including existing `or` tests (fail path unchanged) and new `option_or.ring`

- [ ] **Step 7: Commit**

```
git add compiler/src/hir/index.ts compiler/src/checker/infer.ts compiler/src/codegen/codegen.ts tests/cases/option_or.ring tests/e2e.test.ts
git commit -m "feat(option): or expression works with both Option and fail"
```

---

### Task 6: Typed Catch

**Files:**
- Modify: `compiler/src/ast/index.ts:264-270`
- Modify: `compiler/src/parser/parser.ts:838-848`
- Modify: `compiler/src/hir/index.ts:136-142`
- Modify: `compiler/src/checker/infer.ts:1521-1554, 1676-1681`
- Modify: `compiler/src/codegen/codegen.ts:579-596`
- Create: `tests/cases/catch_typed.ring`
- Modify: `tests/e2e.test.ts`

- [ ] **Step 1: Write the e2e test case**

Create `tests/cases/catch_typed.ring`:

```ring
struct ParseError { msg: Str }

fn may_fail(x: Int) -> Int {
    if x > 0 { x } else { fail.raise(ParseError { msg: "bad" }) }
}

fn main() {
    let result = may_fail(-1) catch ParseError fn(e) { 99 }
    print(result)
}
```

Register in `tests/e2e.test.ts`:

```typescript
{ file: "catch_typed.ring", expected: "99\n" },
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd compiler && npm test 2>&1 | Select-String "catch_typed"`
Expected: FAIL — parser chokes on `ParseError` before `fn`

- [ ] **Step 3: Extend CatchExpr AST with error_type**

In `compiler/src/ast/index.ts`, modify `CatchExpr` (lines 264-270):

```typescript
export interface CatchExpr {
  kind: "catch_expr";
  expr: Expr;
  error_type?: string;
  error_binding: string;
  handler: Expr;
  span: Span;
}
```

- [ ] **Step 4: Modify parser to accept optional type name**

In `compiler/src/parser/parser.ts`, replace `parse_catch_expr` (lines 838-848):

```typescript
private parse_catch_expr(left: Expr): CatchExpr {
  this.advance(); // consume 'catch'
  // Optional: type name before fn (e.g., catch ParseError fn(e) { ... })
  let error_type: string | undefined;
  if (this.peek().kind === TokenKind.Ident) {
    error_type = this.advance().value;
  }
  this.expect(TokenKind.Fn);
  this.expect(TokenKind.LParen);
  const error_binding = this.expect(TokenKind.Ident).value;
  this.expect(TokenKind.RParen);
  const handler = this.parse_block_expr();
  const span = this.make_span(left.span.start, handler.span.end);
  return { kind: "catch_expr", expr: left, error_type, error_binding, handler, span };
}
```

This works because `fn` is `TokenKind.Fn` (keyword), not `TokenKind.Ident`.

- [ ] **Step 5: Extend HTryCatch with error_type**

In `compiler/src/hir/index.ts`, modify `HTryCatch` (lines 137-142):

```typescript
export interface HTryCatch extends HExprBase {
  kind: "try_catch";
  body: HExpr;
  error_binding?: string;
  error_type?: string;
  handler: HExpr;
}
```

- [ ] **Step 6: Add selective fail removal to checker**

In `compiler/src/checker/infer.ts`, add next to `remove_fail_effect` (after line 1681):

```typescript
private remove_specific_fail_effect(row: EffectRow, target: Type, subst: Substitution): EffectRow {
  return {
    effects: row.effects.filter(e =>
      !(e.kind === "fail" && types_equal(apply(subst, e.error_type), target))
    ),
    tail: row.tail,
  };
}
```

Import `types_equal` from types if not already imported.

- [ ] **Step 7: Modify infer_catch to handle typed catch**

In `compiler/src/checker/infer.ts`, modify the `infer_catch` call site (line 829-830):

```typescript
case "catch_expr":
  return this.infer_catch(expr.expr, expr.error_type, expr.error_binding, expr.handler, expr.span, subst);
```

Replace `infer_catch` method (lines 1521-1554):

```typescript
private infer_catch(expr: Expr, error_type_name: string | undefined, error_binding: string, handler: Expr, span: Span, subst: Substitution): InferResult {
  const expr_r = this.infer_expr(expr, subst);
  let s = expr_r.subst;

  this.env.push_scope();

  let error_var_type: Type;
  if (error_type_name) {
    error_var_type = this.resolve_named_type(error_type_name, [], span);
  } else {
    error_var_type = this.env.fresh_var();
  }
  this.env.bind_mono(error_binding, error_var_type);

  const handler_r = this.infer_expr(handler, s);
  s = handler_r.subst;
  this.env.pop_scope();

  s = unify(expr_r.hexpr.type, handler_r.hexpr.type, s);

  let effects = row_merge(expr_r.effects, handler_r.effects);
  if (error_type_name) {
    effects = this.remove_specific_fail_effect(effects, error_var_type, s);
  } else {
    effects = this.remove_fail_effect(effects);
  }

  const result_type = apply(s, expr_r.hexpr.type);

  return {
    hexpr: {
      kind: "try_catch",
      body: expr_r.hexpr,
      error_binding,
      error_type: error_type_name,
      handler: handler_r.hexpr,
      type: result_type,
      effects,
      span,
    },
    subst: s,
    effects,
  };
}
```

- [ ] **Step 8: Modify codegen for typed catch**

In `compiler/src/codegen/codegen.ts`, modify `gen_try_catch` (lines 579-596). When `error_type` is present, add an instanceof guard:

```typescript
private gen_try_catch(expr: HExpr & { kind: "try_catch" }): string {
  const body_has_fail = expr.body.effects.effects.some(e => e.kind === "fail");
  const body = this.gen_expr(expr.body);
  const handler = this.gen_expr(expr.handler);

  if (!body_has_fail) {
    return body;
  }

  if (expr.error_binding) {
    const binding = safe_ident(expr.error_binding);
    if (expr.error_type) {
      // Typed catch: only catch matching error type
      const type_name = safe_ident(expr.error_type);
      return `(function() { const __ev_fail = { raise: (${binding}) => { throw new __EffectAbort("fail", ${binding}); } }; try { return ${body}; } catch (__e) { if (__e instanceof __EffectAbort && __e.effect === "fail" && __e.value instanceof ${type_name}) { const ${binding} = __e.value; return ${handler}; } throw __e; } })()`;
    }
    // Untyped catch
    return `(function() { const __ev_fail = { raise: (${binding}) => { throw new __EffectAbort("fail", ${binding}); } }; try { return ${body}; } catch (__e) { if (__e instanceof __EffectAbort && __e.effect === "fail") { const ${binding} = __e.value; return ${handler}; } throw __e; } })()`;
  }

  // or expression
  return `(function() { const __ev_fail = { raise: (__err) => { throw new __EffectAbort("fail", undefined); } }; try { return ${body}; } catch (__e) { if (__e instanceof __EffectAbort && __e.effect === "fail") return ${handler}; throw __e; } })()`;
}
```

- [ ] **Step 9: Run tests**

Run: `cd compiler && npm test`
Expected: ALL PASS, including existing catch tests (untyped path unchanged) and new `catch_typed.ring`

- [ ] **Step 10: Commit**

```
git add compiler/src/ast/index.ts compiler/src/parser/parser.ts compiler/src/hir/index.ts compiler/src/checker/infer.ts compiler/src/codegen/codegen.ts tests/cases/catch_typed.ring tests/e2e.test.ts
git commit -m "feat(catch): typed catch filters by error type"
```

---

### Task 7: Regression + CLAUDE.md Update

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Run full test suite**

Run: `cd compiler && npm run lint && npm test`
Expected: Zero errors, all tests pass.

- [ ] **Step 2: Run e2e tests separately to verify count**

Run: `cd compiler && npm test 2>&1 | Select-String "tests|pass|fail"`
Expected: Test count should be 113 + (new unit tests) unit, 72 + (5 new cases × 3 modes = 15) = 87 e2e.

- [ ] **Step 3: Update CLAUDE.md**

Update test counts, add Session 5 to completed features list, move relevant items out of "已知限制", update the status line.

- [ ] **Step 4: Commit**

```
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for Phase 2 Session 5 completion"
```
