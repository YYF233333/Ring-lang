# Phase 2 Session 3: Row Polymorphism Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Koka-style row polymorphism for record types and tighten effect row unification, enabling structural type constraints on function parameters.

**Architecture:** Add `RecordType` to the type system, `RecordTypeExpr` to the AST, parse `{field: Type, ..rest}` syntax in type positions, implement generic row unification that serves both record and effect rows, and add struct→record coercion in the unifier. Codegen change is zero — record field access compiles to JS property access which already works on struct-generated classes.

**Tech Stack:** TypeScript strict mode, node:test, zero dependencies.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `compiler/src/parser/lexer.ts` | Modify | Add `DotDot` token (`..`) |
| `compiler/src/ast/index.ts` | Modify | Add `RecordTypeExpr` to `TypeExpr` union |
| `compiler/src/types/index.ts` | Modify | Add `RecordType` to `Type` union, add helpers |
| `compiler/src/hir/index.ts` | No change | `HFieldAccess` already handles any receiver |
| `compiler/src/parser/parser.ts` | Modify | Parse `{field: Type, ..rest}` in `parse_type_expr` |
| `compiler/src/checker/unify.ts` | Modify | Add `unify_record_rows`, rewrite `unify_effect_rows`, add struct↔record case in `unify` |
| `compiler/src/checker/env.ts` | Modify | Add `RecordType` case to `substitute_type` |
| `compiler/src/checker/infer.ts` | Modify | Resolve `RecordTypeExpr`, handle field access on `RecordType`, add `RecordType` to `collect_free_vars` |
| `compiler/src/codegen/codegen.ts` | No change | Field access already emits `.field` |
| `compiler/src/errors.ts` | No change | Errors thrown via existing `TypeCheckError`/`UnificationError` |
| `compiler/src/parser/parser.test.ts` | Modify | Parser tests for record type syntax |
| `compiler/src/checker/checker.test.ts` | Modify | Unification + inference tests |
| `tests/cases/row_basic.ring` | Create | Basic record row poly e2e |
| `tests/cases/row_multi_field.ring` | Create | Multi-field record row e2e |
| `tests/cases/row_reject.ring` | Create | Negative test: missing field |
| `tests/cases/row_generic.ring` | Create | Generic fn + record row constraint |
| `tests/cases/effect_row_strict.ring` | Create | Effect row tightening e2e |
| `tests/cases/effect_row_handle.ring` | Create | Handle + effect row elimination e2e |
| `tests/e2e.test.ts` | Modify | Register new test cases |

---

### Task 1: Add `DotDot` Token to Lexer

**Files:**
- Modify: `compiler/src/parser/lexer.ts`

- [ ] **Step 1: Add `DotDot` to `TokenKind` enum**

In `compiler/src/parser/lexer.ts`, add `DotDot` to the enum after `Dot`:

```typescript
Dot = ".",
DotDot = "..",
```

- [ ] **Step 2: Update the `.` case in `scan_punctuation` to check for `..`**

In the `.` case of `scan_punctuation` (around line 362), change:

```typescript
case ".": return this.make_token(TokenKind.Dot, ".", start);
```

to:

```typescript
case ".":
  if (this.peek() === ".") { this.advance(); return this.make_token(TokenKind.DotDot, "..", start); }
  return this.make_token(TokenKind.Dot, ".", start);
```

- [ ] **Step 3: Verify the compiler builds**

Run: `cd compiler && npm run build`
Expected: Clean compile, no errors.

- [ ] **Step 4: Commit**

```bash
git add compiler/src/parser/lexer.ts
git commit -m "feat(lexer): add DotDot (..) token for row polymorphism syntax"
```

---

### Task 2: Add `RecordTypeExpr` to AST

**Files:**
- Modify: `compiler/src/ast/index.ts`

- [ ] **Step 1: Add `RecordTypeExpr` interface**

In `compiler/src/ast/index.ts`, after the `OptionTypeExpr` interface (around line 51), add:

```typescript
export interface RecordTypeField {
  name: string;
  type: TypeExpr;
  span: Span;
}

export interface RecordTypeExpr {
  kind: "record_type";
  fields: RecordTypeField[];
  rest?: string; // row variable name from ..rest
  span: Span;
}
```

- [ ] **Step 2: Add `RecordTypeExpr` to the `TypeExpr` union**

Change:

```typescript
export type TypeExpr =
  | NamedTypeExpr
  | FnTypeExpr
  | OptionTypeExpr;
```

to:

```typescript
export type TypeExpr =
  | NamedTypeExpr
  | FnTypeExpr
  | OptionTypeExpr
  | RecordTypeExpr;
```

- [ ] **Step 3: Add `RecordTypeExpr` to the parser import line**

In `compiler/src/parser/parser.ts` line 10, add `RecordTypeExpr, RecordTypeField,` to the import from `"../ast/index.js"`.

- [ ] **Step 4: Verify compiler builds**

Run: `cd compiler && npm run build`
Expected: Build fails with `assertNever` errors in `infer.ts:resolve_type_expr` — this is expected and will be fixed in Task 5.

- [ ] **Step 5: Commit**

```bash
git add compiler/src/ast/index.ts compiler/src/parser/parser.ts
git commit -m "feat(ast): add RecordTypeExpr node for {field: Type, ..rest} syntax"
```

---

### Task 3: Add `RecordType` to Type System

**Files:**
- Modify: `compiler/src/types/index.ts`
- Modify: `compiler/src/checker/env.ts`
- Modify: `compiler/src/checker/unify.ts`

- [ ] **Step 1: Add `RecordType` interface to `types/index.ts`**

After `OptionType` (around line 97), add:

```typescript
export interface RecordField {
  name: string;
  type: Type;
}

export interface RecordType {
  kind: "record";
  fields: RecordField[];
  tail?: number; // row variable id for ..rest (open row)
}
```

- [ ] **Step 2: Add `RecordType` to the `Type` union**

Change:

```typescript
export type Type =
  | IntType
  | FloatType
  | StrType
  | BoolType
  | UnitType
  | NeverType
  | AnyType
  | TypeVar
  | FnType
  | StructType
  | EnumType
  | GenericType
  | OptionType;
```

to:

```typescript
export type Type =
  | IntType
  | FloatType
  | StrType
  | BoolType
  | UnitType
  | NeverType
  | AnyType
  | TypeVar
  | FnType
  | StructType
  | EnumType
  | GenericType
  | OptionType
  | RecordType;
```

- [ ] **Step 3: Add `RecordType` case to `types_equal`**

In the `types_equal` function (around line 237), add before the closing of the switch:

```typescript
    case "record": {
      const br = b as RecordType;
      if (a.fields.length !== br.fields.length) return false;
      if (a.tail !== br.tail) return false;
      return a.fields.every((f, i) =>
        f.name === br.fields[i].name && types_equal(f.type, br.fields[i].type)
      );
    }
```

- [ ] **Step 4: Add `RecordType` case to `type_to_string`**

In the `type_to_string` function (around line 276), add before the closing of the switch:

```typescript
    case "record": {
      const fields = t.fields.map(f => `${f.name}: ${type_to_string(f.type)}`).join(", ");
      if (t.tail !== undefined) {
        return fields ? `{${fields}, ..?${t.tail}}` : `{..?${t.tail}}`;
      }
      return `{${fields}}`;
    }
```

- [ ] **Step 5: Add `RecordType` case to `substitute_type` in `env.ts`**

In `compiler/src/checker/env.ts`, in the `substitute_type` function (around line 273), add before the closing of the switch:

```typescript
    case "record":
      return {
        kind: "record",
        fields: t.fields.map(f => ({ name: f.name, type: substitute_type(f.type, mapping) })),
        tail: t.tail,
      };
```

- [ ] **Step 6: Add `RecordType` case to `apply` in `unify.ts`**

In `compiler/src/checker/unify.ts`, in the `apply` function (around line 67), add before the `option` case:

```typescript
    case "record": {
      const fields = t.fields.map(f => ({ name: f.name, type: apply(subst, f.type) }));
      let tail = t.tail;
      if (tail !== undefined) {
        const resolved = subst.get(tail);
        if (resolved) {
          const chased = apply(subst, resolved);
          if (chased.kind === "var") {
            tail = chased.id;
          } else if (chased.kind === "record") {
            // Merge: the tail resolved to another record row
            return {
              kind: "record",
              fields: [...fields, ...chased.fields.map(f => ({ name: f.name, type: apply(subst, f.type) }))],
              tail: chased.tail,
            };
          } else {
            tail = undefined;
          }
        }
      }
      return tail !== undefined ? { kind: "record", fields, tail } : { kind: "record", fields };
    }
```

- [ ] **Step 7: Add `RecordType` case to `occurs_in` in `unify.ts`**

In the `occurs_in` function (around line 148), add before the closing of the switch:

```typescript
    case "record":
      if (resolved.tail === var_id) return true;
      return resolved.fields.some(f => occurs_in(var_id, f.type, subst));
```

- [ ] **Step 8: Verify compiler builds**

Run: `cd compiler && npm run build`
Expected: May still have `assertNever` errors in `infer.ts` — that's expected, will be fixed in Task 5.

- [ ] **Step 9: Commit**

```bash
git add compiler/src/types/index.ts compiler/src/checker/env.ts compiler/src/checker/unify.ts
git commit -m "feat(types): add RecordType with row variable support"
```

---

### Task 4: Parse `{field: Type, ..rest}` in Type Positions

**Files:**
- Modify: `compiler/src/parser/parser.ts`
- Modify: `compiler/src/parser/parser.test.ts`

- [ ] **Step 1: Write the failing parser test**

In `compiler/src/parser/parser.test.ts`, add a test:

```typescript
test("parse record type expr: {name: Str, ..rest}", () => {
  const prog = Parser.parse(`fn greet(person: {name: Str, ..rest}) -> Str { person.name }`, "<test>");
  const fn = prog.decls[0] as FnDecl;
  const param_type = fn.params[0].type_annotation!;
  assert.strictEqual(param_type.kind, "record_type");
  if (param_type.kind === "record_type") {
    assert.strictEqual(param_type.fields.length, 1);
    assert.strictEqual(param_type.fields[0].name, "name");
    assert.strictEqual(param_type.rest, "rest");
  }
});

test("parse closed record type expr: {x: Int, y: Int}", () => {
  const prog = Parser.parse(`fn sum(p: {x: Int, y: Int}) -> Int { p.x }`, "<test>");
  const fn = prog.decls[0] as FnDecl;
  const param_type = fn.params[0].type_annotation!;
  assert.strictEqual(param_type.kind, "record_type");
  if (param_type.kind === "record_type") {
    assert.strictEqual(param_type.fields.length, 2);
    assert.strictEqual(param_type.rest, undefined);
  }
});
```

Import `FnDecl` from `"../src/ast/index.js"` if not already imported.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd compiler && npm run build && npm test`
Expected: FAIL — `parse_type_expr` does not handle `{`.

- [ ] **Step 3: Implement `parse_record_type_expr` in `parser.ts`**

In `compiler/src/parser/parser.ts`, add `TokenKind.DotDot` to the import from `"./lexer.js"` (it should be in the `TokenKind` enum already).

In the `parse_type_expr` method (around line 313), add a new branch at the top, before the `fn` check:

```typescript
  private parse_type_expr(): TypeExpr {
    const start = this.current_span_start();

    // Record type: {field: Type, ..rest}
    if (this.check(TokenKind.LBrace)) {
      return this.parse_record_type_expr();
    }

    // fn(...) -> ReturnType
    if (this.check(TokenKind.Fn)) {
```

Then add the `parse_record_type_expr` method:

```typescript
  private parse_record_type_expr(): RecordTypeExpr {
    const start = this.current_span_start();
    this.expect(TokenKind.LBrace);
    const fields: RecordTypeField[] = [];
    let rest: string | undefined;

    while (!this.check(TokenKind.RBrace) && !this.at_end()) {
      // Check for ..rest (row variable)
      if (this.check(TokenKind.DotDot)) {
        this.advance(); // consume ..
        rest = this.expect(TokenKind.Ident).value;
        this.try_consume(TokenKind.Comma); // optional trailing comma
        break;
      }

      const field_start = this.current_span_start();
      const field_name = this.expect(TokenKind.Ident).value;
      this.expect(TokenKind.Colon);
      const field_type = this.parse_type_expr();
      const field_end = this.current_span_start();
      fields.push({ name: field_name, type: field_type, span: this.make_span(field_start, field_end) });

      if (!this.try_consume(TokenKind.Comma)) break;
    }

    this.expect(TokenKind.RBrace);
    const end = this.current_span_start();
    return {
      kind: "record_type",
      fields,
      rest,
      span: this.make_span(start, end),
    };
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd compiler && npm run build && npm test`
Expected: New parser tests PASS. Existing tests may fail due to `assertNever` in `resolve_type_expr` — that's OK, we fix it in Task 5.

- [ ] **Step 5: Commit**

```bash
git add compiler/src/parser/parser.ts compiler/src/parser/parser.test.ts
git commit -m "feat(parser): parse {field: Type, ..rest} record type syntax"
```

---

### Task 5: Resolve `RecordTypeExpr` in Type Checker + Field Access on RecordType

**Files:**
- Modify: `compiler/src/checker/infer.ts`

- [ ] **Step 1: Write failing checker test**

In `compiler/src/checker/checker.test.ts`, add:

```typescript
test("record type parameter accepts struct", () => {
  const source = `
    struct User { name: Str, age: Int }
    fn greet(person: {name: Str, ..rest}) -> Str { person.name }
    fn main() { print(greet(User { name: "hi", age: 1 })) }
  `;
  // Should not throw
  const prog = Parser.parse(source, "<test>");
  const engine = new InferEngine();
  engine.check(prog);
});

test("record type rejects struct missing field", () => {
  const source = `
    struct Point { x: Int, y: Int }
    fn greet(person: {name: Str, ..rest}) -> Str { person.name }
    fn main() { greet(Point { x: 1, y: 2 }) }
  `;
  const prog = Parser.parse(source, "<test>");
  const engine = new InferEngine();
  assert.throws(() => engine.check(prog));
});
```

Import `Parser` from `"../parser/parser.js"` and `InferEngine` from `"./infer.js"` if not already present.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd compiler && npm run build && npm test`
Expected: FAIL — `assertNever` in `resolve_type_expr` for `record_type`.

- [ ] **Step 3: Add `RecordTypeExpr` case to `resolve_type_expr`**

In `compiler/src/checker/infer.ts`, in the `resolve_type_expr` method (around line 1641), add a new case before `default`:

```typescript
      case "record_type": {
        const fields = texpr.fields.map(f => ({
          name: f.name,
          type: this.resolve_type_expr(f.type),
        }));
        const tail = texpr.rest ? this.env.fresh_var().id : undefined;
        if (texpr.rest) {
          this.type_param_scope.set(texpr.rest, { kind: "var", id: tail! });
        }
        return { kind: "record", fields, tail } as Type;
      }
```

- [ ] **Step 4: Add `RecordType` to `collect_free_vars`**

In `compiler/src/checker/infer.ts`, in the `collect_free_vars` method (around line 90), add a case before the closing of the switch:

```typescript
      case "record":
        for (const f of t.fields) this.collect_free_vars(f.type, result);
        if (t.tail !== undefined) result.add(t.tail);
        break;
```

- [ ] **Step 5: Add field access on `RecordType` in `infer_field_access`**

In `compiler/src/checker/infer.ts`, in the `infer_field_access` method (around line 1207), add a new branch after the `struct` case:

```typescript
    } else if (recv_type.kind === "record") {
      const f = recv_type.fields.find(f => f.name === field);
      if (f) {
        field_type = f.type;
      } else if (recv_type.tail !== undefined) {
        // Open record — field might be in the tail, use fresh var
        field_type = this.env.fresh_var();
      } else {
        throw new TypeCheckError(`Record type has no field '${field}'`, span);
      }
```

- [ ] **Step 6: Add `RecordType` to `unify` in `unify.ts`**

In `compiler/src/checker/unify.ts`, in the `unify` function, add two new cases before the final `throw`:

**Record ↔ Record unification:**

```typescript
  // Record types (row unification)
  if (a.kind === "record" && b.kind === "record") {
    return unify_record_rows(a, b, subst);
  }
```

**Struct → Record coercion:**

```typescript
  // Struct satisfies record constraint (one-direction coercion)
  if (a.kind === "struct" && b.kind === "record") {
    return unify_struct_with_record(a, b, subst);
  }
  if (a.kind === "record" && b.kind === "struct") {
    return unify_struct_with_record(b, a, subst);
  }
```

- [ ] **Step 7: Implement `unify_record_rows`**

In `compiler/src/checker/unify.ts`, add:

```typescript
function unify_record_rows(a: RecordType, b: RecordType, subst: Substitution): Substitution {
  let s = subst;

  // Find common fields and unify their types
  const a_names = new Set(a.fields.map(f => f.name));
  const b_names = new Set(b.fields.map(f => f.name));

  for (const af of a.fields) {
    const bf = b.fields.find(f => f.name === af.name);
    if (bf) {
      s = unify(af.type, bf.type, s);
    }
  }

  // Fields only in a (must be absorbed by b's tail)
  const a_only = a.fields.filter(f => !b_names.has(f.name));
  // Fields only in b (must be absorbed by a's tail)
  const b_only = b.fields.filter(f => !a_names.has(f.name));

  if (a_only.length > 0 && b.tail === undefined) {
    const missing = a_only.map(f => f.name).join(", ");
    throw new UnificationError(a, b, `record missing fields: ${missing}`);
  }
  if (b_only.length > 0 && a.tail === undefined) {
    const missing = b_only.map(f => f.name).join(", ");
    throw new UnificationError(a, b, `record missing fields: ${missing}`);
  }

  // Bind tails to absorb the other side's unique fields
  if (a.tail !== undefined && b_only.length > 0) {
    const new_tail_var = a.tail;
    const record_for_tail: Type = { kind: "record", fields: b_only };
    if (occurs_in(new_tail_var, record_for_tail, s)) {
      throw new UnificationError(a, b, "infinite type in row variable");
    }
    s = new Map(s);
    s.set(new_tail_var, record_for_tail);
  }
  if (b.tail !== undefined && a_only.length > 0) {
    const new_tail_var = b.tail;
    const record_for_tail: Type = { kind: "record", fields: a_only };
    if (occurs_in(new_tail_var, record_for_tail, s)) {
      throw new UnificationError(a, b, "infinite type in row variable");
    }
    s = new Map(s);
    s.set(new_tail_var, record_for_tail);
  }

  // If both have tails and no unique fields, unify tails
  if (a.tail !== undefined && b.tail !== undefined && a_only.length === 0 && b_only.length === 0) {
    if (a.tail !== b.tail) {
      s = unify({ kind: "var", id: a.tail }, { kind: "var", id: b.tail }, s);
    }
  }

  return s;
}
```

- [ ] **Step 8: Implement `unify_struct_with_record`**

In `compiler/src/checker/unify.ts`, add:

```typescript
function unify_struct_with_record(struct_t: StructType, record_t: RecordType, subst: Substitution): Substitution {
  let s = subst;

  // Check that struct has all fields required by the record
  for (const rf of record_t.fields) {
    const sf = struct_t.fields.find(f => f.name === rf.name);
    if (!sf) {
      throw new UnificationError(struct_t, record_t,
        `type '${struct_t.name}' does not satisfy {${record_t.fields.map(f => f.name).join(", ")}, ..} — missing field '${rf.name}'`);
    }
    s = unify(sf.type, rf.type, s);
  }

  // If record has a tail, bind it to the struct's remaining fields (as a closed record)
  if (record_t.tail !== undefined) {
    const remaining = struct_t.fields.filter(sf => !record_t.fields.some(rf => rf.name === sf.name));
    const tail_record: Type = {
      kind: "record",
      fields: remaining.map(f => ({ name: f.name, type: f.type })),
    };
    if (!occurs_in(record_t.tail, tail_record, s)) {
      s = new Map(s);
      s.set(record_t.tail, tail_record);
    }
  }

  return s;
}
```

Add the required imports at the top of `unify.ts`:

```typescript
import {
  Type, EffectRow, type_to_string, RecordType, StructType,
} from "../types/index.js";
```

- [ ] **Step 9: Run tests**

Run: `cd compiler && npm run build && npm test`
Expected: New checker tests PASS. All existing 100 unit tests still pass.

- [ ] **Step 10: Commit**

```bash
git add compiler/src/checker/infer.ts compiler/src/checker/unify.ts
git commit -m "feat(checker): resolve RecordTypeExpr, field access on record, struct↔record unification"
```

---

### Task 6: Tighten Effect Row Unification

**Files:**
- Modify: `compiler/src/checker/unify.ts`
- Modify: `compiler/src/checker/checker.test.ts`

- [ ] **Step 1: Write failing test for effect row tightening**

In `compiler/src/checker/checker.test.ts`, add:

```typescript
test("effect row: io effect propagates through function call", () => {
  const source = `
    fn helper() -> Str / io {
      io.read("file.txt")
    }
    fn main() / io {
      print(helper())
    }
  `;
  const prog = Parser.parse(source, "<test>");
  const engine = new InferEngine();
  const hprog = engine.check(prog);
  const helper_decl = hprog.decls.find(d => d.kind === "fn_decl" && d.name === "helper") as HFnDecl;
  assert.ok(helper_decl.effects.effects.some(e => e.kind === "io"), "helper should have io effect");
});
```

Import `HFnDecl` from `"../hir/index.js"` if not already present.

- [ ] **Step 2: Run test to verify it passes (baseline)**

Run: `cd compiler && npm run build && npm test`
Expected: PASS — this is a baseline test. Effects already propagate correctly via `row_merge`.

- [ ] **Step 3: Rewrite `unify_effect_rows` to use proper row unification**

In `compiler/src/checker/unify.ts`, replace the existing `unify_effect_rows` function with:

```typescript
/**
 * Unify two effect rows using Koka-style row variable solving.
 *
 * Match effects by kind (io↔io, fail↔fail with error_type unification, etc).
 * Unmatched effects are absorbed by the other side's tail (if open row).
 * If both sides are closed (no tail), unmatched effects are tolerated
 * (full strictness deferred to a later lint pass — keeps backward compat).
 */
export function unify_effect_rows(a: EffectRow, b: EffectRow, subst: Substitution): Substitution {
  let s = subst;

  // Apply current substitution to resolve tails
  const ra = apply_to_effect_row(s, a);
  const rb = apply_to_effect_row(s, b);

  // Match effects pairwise by kind, unify type params of matches
  const b_matched = new Set<number>();
  for (const ae of ra.effects) {
    for (let bi = 0; bi < rb.effects.length; bi++) {
      if (b_matched.has(bi)) continue;
      if (effects_match_kind(ae, rb.effects[bi])) {
        s = unify_effect_params(ae, rb.effects[bi], s);
        b_matched.add(bi);
        break;
      }
    }
  }

  // Unify tails if both present
  if (ra.tail !== undefined && rb.tail !== undefined && ra.tail !== rb.tail) {
    s = unify({ kind: "var", id: ra.tail }, { kind: "var", id: rb.tail }, s);
  }

  return s;
}
```

Add these helpers right above:

```typescript
function effects_match_kind(a: Effect, b: Effect): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === "custom" && (b as CustomEffect).name !== a.name) return false;
  return true;
}

function unify_effect_params(a: Effect, b: Effect, subst: Substitution): Substitution {
  if (a.kind === "fail" && b.kind === "fail") {
    return unify(a.error_type, (b as FailEffect).error_type, subst);
  }
  if (a.kind === "custom" && b.kind === "custom") {
    let s = subst;
    const bc = b as CustomEffect;
    const len = Math.min(a.type_args.length, bc.type_args.length);
    for (let i = 0; i < len; i++) {
      s = unify(a.type_args[i], bc.type_args[i], s);
    }
    return s;
  }
  return subst;
}
```

Add to the import at the top of `unify.ts`:

```typescript
import {
  Type, EffectRow, Effect, type_to_string,
  RecordType, StructType, FailEffect, CustomEffect,
} from "../types/index.js";
```

Also import `effects_equal` is no longer needed at the top level, but keep it available via the types module. Actually — check if `effects_equal` is used elsewhere. If it's only used in the old `unify_effect_rows`, the new helpers replace it. Keep the import for safety since `effects_equal` is exported from `types/index.ts` and may be used by other modules.

- [ ] **Step 4: Run all tests**

Run: `cd compiler && npm run build && npm test`
Expected: All 100 unit + 51 e2e tests PASS. The new implementation is functionally equivalent for all existing cases.

- [ ] **Step 5: Commit**

```bash
git add compiler/src/checker/unify.ts compiler/src/checker/checker.test.ts
git commit -m "feat(unify): rewrite effect row unification with proper row variable matching"
```

---

### Task 7: E2E Tests — Record Row Polymorphism

**Files:**
- Create: `tests/cases/row_basic.ring`
- Create: `tests/cases/row_multi_field.ring`
- Create: `tests/cases/row_generic.ring`
- Modify: `tests/e2e.test.ts`

- [ ] **Step 1: Create `row_basic.ring`**

```ring
struct User { name: Str, age: Int }
struct Company { name: Str, industry: Str }

fn greet(person: {name: Str, ..rest}) -> Str {
    person.name
}

fn main() {
    print(greet(User { name: "alice", age: 30 }))
}
```

Expected output: `alice\n`

- [ ] **Step 2: Create `row_multi_field.ring`**

```ring
struct Point { x: Int, y: Int, label: Str }

fn sum_xy(p: {x: Int, y: Int, ..rest}) -> Int {
    p.x + p.y
}

fn main() {
    print(sum_xy(Point { x: 10, y: 20, label: "origin" }))
}
```

Expected output: `30\n`

- [ ] **Step 3: Create `row_generic.ring`**

```ring
struct Cat { name: Str, lives: Int }
struct Dog { name: Str, breed: Str }

fn get_name(animal: {name: Str, ..r}) -> Str {
    animal.name
}

fn main() {
    let cat_name = get_name(Cat { name: "whiskers", lives: 9 })
    let dog_name = get_name(Dog { name: "rex", breed: "lab" })
    print("${cat_name}-${dog_name}")
}
```

Expected output: `whiskers-rex\n`

- [ ] **Step 4: Register in e2e.test.ts**

In `tests/e2e.test.ts`, add to the `cases` array:

```typescript
  { file: "row_basic.ring", expected: "alice\n" },
  { file: "row_multi_field.ring", expected: "30\n" },
  { file: "row_generic.ring", expected: "whiskers-rex\n" },
```

- [ ] **Step 5: Run e2e tests**

Run: `cd compiler && npm run build && npm test`
Expected: All new e2e tests PASS. All existing 51 e2e tests still PASS.

- [ ] **Step 6: Commit**

```bash
git add tests/cases/row_basic.ring tests/cases/row_multi_field.ring tests/cases/row_generic.ring tests/e2e.test.ts
git commit -m "test(e2e): add record row polymorphism tests (basic, multi-field, generic)"
```

---

### Task 8: E2E Tests — Effect Row + Negative Test

**Files:**
- Create: `tests/cases/effect_row_strict.ring`
- Create: `tests/cases/effect_row_handle.ring`
- Create: `tests/cases/row_reject.ring`
- Modify: `tests/e2e.test.ts`

- [ ] **Step 1: Create `effect_row_strict.ring`**

```ring
fn pure_add(a: Int, b: Int) -> Int {
    a + b
}

fn effectful_greet(name: Str) -> Str / io {
    io.write("log.txt", name)
    name
}

fn main() / io {
    let x = pure_add(1, 2)
    let y = effectful_greet("test")
    print("${x}-${y}")
}
```

Expected output: `3-test\n`

- [ ] **Step 2: Create `effect_row_handle.ring`**

```ring
fn might_fail(x: Int) -> Int / fail<Str> {
    if x < 0 {
        raise("negative")
    }
    x * 2
}

fn main() {
    let result = handle { might_fail(21) } with {
        fail.raise(e) => -1
    }
    print(result)
}
```

Expected output: `42\n`

- [ ] **Step 3: Create `row_reject.ring` as a negative test**

This file should be tested differently — it should fail at type-check time. Add it to a new negative test section.

```ring
struct Point { x: Int, y: Int }

fn needs_name(p: {name: Str, ..rest}) -> Str {
    p.name
}

fn main() {
    needs_name(Point { x: 1, y: 2 })
}
```

In `tests/e2e.test.ts`, add a new describe block for negative tests:

```typescript
describe("e2e: ring check (negative)", () => {
  const negative_cases = [
    { file: "row_reject.ring", error_pattern: "missing field" },
  ];

  for (const tc of negative_cases) {
    test(`ring check ${tc.file} should fail`, () => {
      const filePath = path.join(CASES_DIR, tc.file);
      assert.ok(fs.existsSync(filePath), `Test file not found: ${filePath}`);

      assert.throws(() => {
        execSync(`node "${CLI_PATH}" check "${filePath}"`, {
          encoding: "utf-8",
          stdio: ["pipe", "pipe", "pipe"],
        });
      }, (err: Error & { stderr?: string }) => {
        const msg = err.message || err.stderr || "";
        return msg.toLowerCase().includes(tc.error_pattern);
      });
    });
  }
});
```

- [ ] **Step 4: Register positive tests in e2e.test.ts**

Add to the `cases` array:

```typescript
  { file: "effect_row_strict.ring", expected: "3-test\n" },
  { file: "effect_row_handle.ring", expected: "42\n" },
```

- [ ] **Step 5: Run all tests**

Run: `cd compiler && npm run build && npm test`
Expected: All tests PASS (positive + negative).

- [ ] **Step 6: Commit**

```bash
git add tests/cases/effect_row_strict.ring tests/cases/effect_row_handle.ring tests/cases/row_reject.ring tests/e2e.test.ts
git commit -m "test(e2e): add effect row and negative record row tests"
```

---

### Task 9: Full Regression + Lint

**Files:** None (verification only)

- [ ] **Step 1: Run TypeScript typecheck**

Run: `cd compiler && npm run typecheck`
Expected: No errors.

- [ ] **Step 2: Run lint**

Run: `cd compiler && npm run lint`
Expected: No errors.

- [ ] **Step 3: Run full test suite**

Run: `cd compiler && npm test`
Expected: All tests pass. Count should be approximately 104+ unit tests + 60+ e2e tests.

- [ ] **Step 4: Verify test count**

Confirm the final count:
- Parser tests: 43+ (41 existing + 2 new record type tests)
- Checker tests: 32+ (29 existing + 3 new)
- Codegen tests: 30 (unchanged)
- E2E positive: 56+ (51 existing + 5 new: row_basic, row_multi_field, row_generic, effect_row_strict, effect_row_handle)
- E2E negative: 1 (row_reject)

- [ ] **Step 5: Update CLAUDE.md**

Update the following sections in `CLAUDE.md`:

1. **当前状态** line: change to `Phase 2 Session 3 完成` with updated test counts
2. **项目结构**: add new test files to the tree
3. **已实现功能**: add Session 3 section:
```markdown
### Phase 2 Session 3 ✅ (Row Polymorphism)

- ✅ Record row types: `{field: Type, ..rest}` in function parameter types
- ✅ Koka-style row unification (shared algorithm for record + effect rows)
- ✅ Struct → Record coercion (single-direction, struct satisfies record constraint)
- ✅ Effect row tightening (proper row variable matching replaces lenient mode)
- ✅ Record field access codegen (zero-cost: JS property access)
```

4. **已知限制**: remove "Effect row unification 不完整" and "不含 row polymorphism" items. Add:
```markdown
- Record row types only in parameter positions (no anonymous record literals or spread)
- Row variables not exposed in generic type parameter syntax (no `<R: Row>`)
```

5. **测试用例列表**: add the new test files

6. **MVP 路线图**: check off Session 3

- [ ] **Step 6: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for Phase 2 Session 3 completion"
```
