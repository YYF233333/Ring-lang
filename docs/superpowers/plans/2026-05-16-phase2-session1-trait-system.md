# Phase 2 Session 1: Trait System + Generic Constraints — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add trait declarations, `impl Trait for Type`, generic constraint checking, and dictionary-passing codegen to the Ring-lang compiler.

**Architecture:** Extend all 5 pipeline stages (Lexer → Parser → Checker → HIR → Codegen). Traits are resolved at type-check time and compiled to dictionary objects passed as implicit arguments to generic functions. All existing tests must continue to pass at every commit.

**Tech Stack:** TypeScript strict mode, node:test, existing compiler infrastructure.

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| Modify | `compiler/src/parser/lexer.ts` | Add `trait` keyword token |
| Modify | `compiler/src/ast/index.ts` | Add `TraitDecl` node, extend `Decl` union, extend `TypeParam.constraint` → `bounds` |
| Modify | `compiler/src/parser/parser.ts` | Parse `trait` decls, `impl Trait for Type`, multi-bounds `T: A + B` |
| Modify | `compiler/src/parser/parser.test.ts` | Parser tests for trait syntax |
| Modify | `compiler/src/hir/index.ts` | Add `HTraitDecl`, `HImplTraitDecl` nodes, extend `HDecl` union, add `trait_dict_name()` |
| Modify | `compiler/src/checker/env.ts` | Add `TraitDef`, `ImplEntry` interfaces, extend `TypeEnv` with trait/impl storage |
| Modify | `compiler/src/checker/infer.ts` | Register traits, check impl completeness, resolve trait methods, validate constraints |
| Modify | `compiler/src/checker/checker.test.ts` | Checker tests for trait constraints |
| Modify | `compiler/src/codegen/codegen.ts` | Emit dictionaries, pass dict args to generic functions |
| Modify | `compiler/src/codegen/codegen.test.ts` | Codegen tests for dictionary output |
| Create | `tests/cases/trait_basic.ring` | E2E test: trait + impl + constrained generic call |
| Modify | `tests/e2e.test.ts` | Register `trait_basic.ring` |

---

### Task 1: Add `trait` keyword to Lexer

**Files:**
- Modify: `compiler/src/parser/lexer.ts:8-31` (TokenKind enum)
- Modify: `compiler/src/parser/lexer.ts:85-108` (KEYWORDS map)
- Modify: `compiler/src/parser/parser.test.ts:11-22` (keyword tokenization test)

- [ ] **Step 1: Update keyword tokenization test**

In `compiler/src/parser/parser.test.ts`, update the keyword test to include `trait`:

```typescript
it("tokenizes keywords", () => {
    const lexer = new Lexer("fn let var struct enum match impl effect handle with if else or catch test return for in pub where true false trait");
    const tokens = lexer.tokenize();
    const kinds = tokens.map(t => t.kind).filter(k => k !== TokenKind.Eof);
    assert.deepEqual(kinds, [
      TokenKind.Fn, TokenKind.Let, TokenKind.Var, TokenKind.Struct, TokenKind.Enum,
      TokenKind.Match, TokenKind.Impl, TokenKind.Effect, TokenKind.Handle, TokenKind.With,
      TokenKind.If, TokenKind.Else, TokenKind.Or, TokenKind.Catch, TokenKind.Test,
      TokenKind.Return, TokenKind.For, TokenKind.In, TokenKind.Pub, TokenKind.Where,
      TokenKind.True, TokenKind.False, TokenKind.Trait,
    ]);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd compiler && npm test`
Expected: FAIL — `TokenKind.Trait` does not exist.

- [ ] **Step 3: Add `Trait` to TokenKind enum and KEYWORDS map**

In `compiler/src/parser/lexer.ts`, add to the `TokenKind` enum after `False`:

```typescript
  Trait = "trait",
```

And add to the `KEYWORDS` record:

```typescript
  trait: TokenKind.Trait,
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd compiler && npm test`
Expected: all 80 tests pass (existing + updated keyword test).

- [ ] **Step 5: Commit**

```bash
git add compiler/src/parser/lexer.ts compiler/src/parser/parser.test.ts
git commit -m "feat(lexer): add trait keyword token"
```

---

### Task 2: Add `TraitDecl` AST node and extend `TypeParam`

**Files:**
- Modify: `compiler/src/ast/index.ts:28-31` (TypeExpr union — no change needed)
- Modify: `compiler/src/ast/index.ts:338-344` (Decl union)
- Modify: `compiler/src/ast/index.ts:346-350` (TypeParam)

- [ ] **Step 1: Add `TraitDecl` interface and `TypeBound` to AST**

In `compiler/src/ast/index.ts`, add before the `Program` section (after `TestDecl`):

```typescript
// ============================================================
// Type Bounds (for generic constraints)
// ============================================================

export interface TypeBound {
  trait_name: string;
  type_args: TypeExpr[];
  span: Span;
}

// ============================================================
// Trait Declarations
// ============================================================

export interface TraitDecl {
  kind: "trait_decl";
  name: string;
  type_params: TypeParam[];
  supertraits: TypeBound[];
  methods: FnDecl[];
  is_pub: boolean;
  span: Span;
}
```

- [ ] **Step 2: Update `Decl` union type to include `TraitDecl`**

Change the `Decl` type to:

```typescript
export type Decl =
  | FnDecl
  | StructDecl
  | EnumDecl
  | ImplDecl
  | EffectDecl
  | TestDecl
  | TraitDecl;
```

- [ ] **Step 3: Extend `TypeParam` to support multiple bounds**

Replace the existing `TypeParam`:

```typescript
export interface TypeParam {
  name: string;
  bounds: TypeBound[];
  span: Span;
}
```

Note: the old `constraint?: TypeExpr` field is replaced by `bounds: TypeBound[]`. An empty array means no constraints. This is a breaking change to the existing AST — all call sites using `TypeParam` need updating.

- [ ] **Step 4: Fix all TypeParam usage sites to use `bounds`**

In `compiler/src/parser/parser.ts`, update `parse_type_params()` to produce `bounds: []` instead of `constraint: undefined` (this will be done in Task 3). For now, just make it compile.

The key call sites that reference `TypeParam.constraint`:
- `parser.ts: parse_type_params()` — will be updated in Task 3
- `infer.ts` — only uses `tp.name`, doesn't read `constraint`
- `hir/index.ts` — imports `TypeParam`, used structurally

Search for `.constraint` usage and replace with `.bounds` as needed. If no file actually reads `constraint`, just removing it and adding `bounds: TypeBound[]` is sufficient.

- [ ] **Step 5: Run `npm run typecheck` to verify compilation**

Run: `cd compiler && npm run typecheck`
Expected: may have errors in parser.ts (parse_type_params still produces `constraint`). Fix them:

In `parser.ts` `parse_type_params()`, change:

```typescript
// Old:
params.push({ name, constraint, span: this.make_span(tp_start, tp_end) });
// New (temporary, will be improved in Task 4):
const bounds: TypeBound[] = [];
// If there was a constraint parsed, convert it to a single bound
// (We'll properly parse multi-bounds in Task 4)
if (constraint_type_expr) {
  // constraint was a TypeExpr — treat as single trait bound
  // For now, just store empty bounds; Task 4 will parse properly
}
params.push({ name, bounds, span: this.make_span(tp_start, tp_end) });
```

Actually, the simplest approach: since `parse_type_params` currently parses `<T: Constraint>` as a single `TypeExpr`, temporarily convert it:

```typescript
private parse_type_params(): TypeParam[] {
    if (!this.check(TokenKind.Lt)) return [];
    this.advance(); // consume <
    const params: TypeParam[] = [];
    while (!this.check(TokenKind.Gt) && !this.at_end()) {
      const tp_start = this.current_span_start();
      const name = this.expect(TokenKind.Ident).value;
      const bounds: TypeBound[] = [];
      if (this.try_consume(TokenKind.Colon)) {
        // Parse first bound
        const bound_start = this.current_span_start();
        const bound_name = this.expect(TokenKind.Ident).value;
        let bound_type_args: TypeExpr[] = [];
        if (this.check(TokenKind.Lt)) {
          const save = this.pos;
          this.advance();
          try {
            bound_type_args.push(this.parse_type_expr());
            while (this.try_consume(TokenKind.Comma)) {
              bound_type_args.push(this.parse_type_expr());
            }
            if (!this.check(TokenKind.Gt)) {
              this.pos = save;
              bound_type_args = [];
            } else {
              this.advance();
            }
          } catch {
            this.pos = save;
            bound_type_args = [];
          }
        }
        const bound_end = this.current_span_start();
        bounds.push({ trait_name: bound_name, type_args: bound_type_args, span: this.make_span(bound_start, bound_end) });
        // Parse additional bounds: + Trait2 + Trait3
        while (this.check(TokenKind.Plus)) {
          this.advance();
          const b_start = this.current_span_start();
          const b_name = this.expect(TokenKind.Ident).value;
          let b_type_args: TypeExpr[] = [];
          if (this.check(TokenKind.Lt)) {
            const save = this.pos;
            this.advance();
            try {
              b_type_args.push(this.parse_type_expr());
              while (this.try_consume(TokenKind.Comma)) {
                b_type_args.push(this.parse_type_expr());
              }
              if (!this.check(TokenKind.Gt)) {
                this.pos = save;
                b_type_args = [];
              } else {
                this.advance();
              }
            } catch {
              this.pos = save;
              b_type_args = [];
            }
          }
          const b_end = this.current_span_start();
          bounds.push({ trait_name: b_name, type_args: b_type_args, span: this.make_span(b_start, b_end) });
        }
      }
      const tp_end = this.current_span_start();
      params.push({ name, bounds, span: this.make_span(tp_start, tp_end) });
      this.try_consume(TokenKind.Comma);
    }
    this.expect(TokenKind.Gt);
    return params;
  }
```

- [ ] **Step 6: Run all tests to verify nothing broke**

Run: `cd compiler && npm test`
Expected: all 80 tests pass.

- [ ] **Step 7: Commit**

```bash
git add compiler/src/ast/index.ts compiler/src/parser/parser.ts
git commit -m "feat(ast): add TraitDecl, TypeBound, multi-bound TypeParam"
```

---

### Task 3: Parse `trait` declarations

**Files:**
- Modify: `compiler/src/parser/parser.ts:98-112` (parse_decl switch)
- Modify: `compiler/src/parser/parser.test.ts`

- [ ] **Step 1: Write parser test for trait declaration**

Add to `compiler/src/parser/parser.test.ts`:

```typescript
  describe("trait declarations", () => {
    it("parses a simple trait", () => {
      const source = `
        trait Greetable {
          fn greet(self) -> Str
        }
      `;
      const program = Parser.parse(source);
      assert.equal(program.decls.length, 1);
      const decl = program.decls[0];
      assert.equal(decl.kind, "trait_decl");
      if (decl.kind === "trait_decl") {
        assert.equal(decl.name, "Greetable");
        assert.equal(decl.methods.length, 1);
        assert.equal(decl.methods[0].name, "greet");
        assert.equal(decl.supertraits.length, 0);
      }
    });

    it("parses trait with default method", () => {
      const source = `
        trait Describable {
          fn name(self) -> Str
          fn describe(self) -> Str {
            "unnamed"
          }
        }
      `;
      const program = Parser.parse(source);
      const decl = program.decls[0];
      assert.equal(decl.kind, "trait_decl");
      if (decl.kind === "trait_decl") {
        assert.equal(decl.methods.length, 2);
        assert.equal(decl.methods[0].name, "name");
        assert.equal(decl.methods[1].name, "describe");
      }
    });

    it("parses generic constraint with bounds", () => {
      const source = `
        trait Ord {
          fn compare(self, other: Int) -> Int
        }
        fn sort<T: Ord>(x: T) -> T { x }
      `;
      const program = Parser.parse(source);
      const fn_decl = program.decls[1];
      assert.equal(fn_decl.kind, "fn_decl");
      if (fn_decl.kind === "fn_decl") {
        assert.equal(fn_decl.type_params.length, 1);
        assert.equal(fn_decl.type_params[0].name, "T");
        assert.equal(fn_decl.type_params[0].bounds.length, 1);
        assert.equal(fn_decl.type_params[0].bounds[0].trait_name, "Ord");
      }
    });

    it("parses multi-bound constraints", () => {
      const source = `
        trait A { fn a(self) -> Int }
        trait B { fn b(self) -> Str }
        fn f<T: A + B>(x: T) -> Int { x.a() }
      `;
      const program = Parser.parse(source);
      const fn_decl = program.decls[2];
      if (fn_decl.kind === "fn_decl") {
        assert.equal(fn_decl.type_params[0].bounds.length, 2);
        assert.equal(fn_decl.type_params[0].bounds[0].trait_name, "A");
        assert.equal(fn_decl.type_params[0].bounds[1].trait_name, "B");
      }
    });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd compiler && npm test`
Expected: FAIL — `parse_decl` does not handle `TokenKind.Trait`.

- [ ] **Step 3: Implement `parse_trait_decl`**

In `compiler/src/parser/parser.ts`, add `TraitDecl` to the imports from ast:

```typescript
import {
  Program, Decl, FnDecl, StructDecl, EnumDecl, ImplDecl, EffectDecl, TestDecl, TraitDecl,
  // ... rest of imports ...
  TypeBound,
} from "../ast/index.js";
```

Add the `trait` case to `parse_decl`:

```typescript
  case TokenKind.Trait: return this.parse_trait_decl(is_pub);
```

Add the method:

```typescript
  private parse_trait_decl(is_pub: boolean): TraitDecl {
    const start = this.current_span_start();
    this.expect(TokenKind.Trait);
    const name = this.expect(TokenKind.Ident).value;
    const type_params = this.parse_type_params();
    const supertraits: TypeBound[] = [];
    // Optional supertrait bounds: trait Ord: Eq { ... }
    // (Not needed for Session 1 MVP — skip for now)
    this.expect(TokenKind.LBrace);
    const methods: FnDecl[] = [];
    while (!this.check(TokenKind.RBrace) && !this.at_end()) {
      const m_pub = this.try_consume(TokenKind.Pub);
      methods.push(this.parse_fn_decl(m_pub));
    }
    this.expect(TokenKind.RBrace);
    const end = this.current_span_start();
    return {
      kind: "trait_decl", name, type_params, supertraits, methods, is_pub,
      span: this.make_span(start, end),
    };
  }
```

Note: `parse_fn_decl` already handles methods with optional bodies (a method without a body block will need special handling — see Step 4).

- [ ] **Step 4: Handle trait methods without bodies (abstract methods)**

Trait methods like `fn greet(self) -> Str` have no body block. The current `parse_fn_decl` calls `this.parse_block_expr()` unconditionally. We need to handle the case where a trait method has no body.

Add a new method `parse_trait_method` or modify `parse_fn_decl` to accept a `body_optional` parameter:

```typescript
  private parse_fn_decl(is_pub: boolean, body_optional: boolean = false): FnDecl {
    const start = this.current_span_start();
    this.expect(TokenKind.Fn);
    const name = this.expect(TokenKind.Ident).value;
    const type_params = this.parse_type_params();
    this.expect(TokenKind.LParen);
    const params = this.parse_params();
    this.expect(TokenKind.RParen);
    const return_type = this.try_consume(TokenKind.Arrow) ? this.parse_type_expr() : undefined;
    // Body is optional for trait method declarations
    let body: BlockExpr;
    if (body_optional && !this.check(TokenKind.LBrace)) {
      // Abstract method — synthesize empty body as placeholder
      const body_span = this.make_span(start, this.current_span_start());
      body = { kind: "block", stmts: [], span: body_span };
    } else {
      body = this.parse_block_expr();
    }
    const end = this.current_span_start();
    return {
      kind: "fn_decl", name, type_params, params, return_type, body, is_pub,
      span: this.make_span(start, end),
    };
  }
```

Update `parse_trait_decl` to call `this.parse_fn_decl(m_pub, true)` (pass `body_optional = true`).

Also add an `is_abstract` flag to `FnDecl` in `ast/index.ts` so the checker can distinguish abstract trait methods from methods with bodies:

```typescript
export interface FnDecl {
  kind: "fn_decl";
  name: string;
  type_params: TypeParam[];
  params: Param[];
  return_type?: TypeExpr;
  body: BlockExpr;
  is_pub: boolean;
  is_abstract?: boolean; // true for trait methods without body
  span: Span;
}
```

When `body_optional && !this.check(TokenKind.LBrace)`, set `is_abstract: true`.

- [ ] **Step 5: Run tests**

Run: `cd compiler && npm test`
Expected: all tests pass (old + 4 new parser tests).

- [ ] **Step 6: Commit**

```bash
git add compiler/src/parser/parser.ts compiler/src/parser/parser.test.ts compiler/src/ast/index.ts
git commit -m "feat(parser): parse trait declarations and multi-bound generic constraints"
```

---

### Task 4: Add HIR nodes for traits

**Files:**
- Modify: `compiler/src/hir/index.ts`

- [ ] **Step 1: Add `HTraitDecl` and `HImplTraitDecl` to HIR**

In `compiler/src/hir/index.ts`, add after `HTestDecl`:

```typescript
export interface HTraitMethod {
  name: string;
  params: HParam[];
  return_type: Type;
  has_default: boolean;
  body?: HBlock;
}

export interface HTraitDecl {
  kind: "trait_decl";
  name: string;
  type_params: TypeParam[];
  methods: HTraitMethod[];
  is_pub: boolean;
  span: Span;
}
```

- [ ] **Step 2: Update `HDecl` union to include `HTraitDecl`**

```typescript
export type HDecl =
  | HFnDecl
  | HStructDecl
  | HEnumDecl
  | HImplDecl
  | HEffectDecl
  | HTestDecl
  | HTraitDecl;
```

- [ ] **Step 3: Add `trait_dict_name` shared naming function**

Add after `variant_js_name`:

```typescript
export function trait_dict_name(type_name: string, trait_name: string): string {
  return `${type_name}_${trait_name}`;
}
```

- [ ] **Step 4: Run `npm run typecheck` to find all `assertNever` breakage**

Run: `cd compiler && npm run typecheck`
Expected: errors at all `assertNever` sites (emit_decl, register_decl, check_decl) because `HDecl`/`Decl` union is now larger.

- [ ] **Step 5: Add stub handling for `trait_decl` in all switch sites**

In `compiler/src/checker/infer.ts` `register_decl`:
```typescript
      case "trait_decl":
        this.register_trait(decl);
        break;
```

In `compiler/src/checker/infer.ts` `check_decl`:
```typescript
      case "trait_decl":
        return this.check_trait_decl(decl);
```

Add stub methods (will be implemented in Task 6):
```typescript
  private register_trait(decl: TraitDecl): void {
    // Stub — Task 6
  }

  private check_trait_decl(decl: TraitDecl): HTraitDecl {
    // Stub — Task 6
    return {
      kind: "trait_decl",
      name: decl.name,
      type_params: decl.type_params,
      methods: [],
      is_pub: decl.is_pub,
      span: decl.span,
    };
  }
```

In `compiler/src/codegen/codegen.ts` `emit_decl`:
```typescript
      case "trait_decl": this.emit_trait_decl(decl); break;
```

Add stub:
```typescript
  private emit_trait_decl(_decl: HTraitDecl): void {
    // Trait declarations themselves don't produce code.
    // Dictionaries are emitted from impl blocks.
  }
```

Update imports in `infer.ts` to include `TraitDecl` from ast and `HTraitDecl` from hir.
Update imports in `codegen.ts` to include `HTraitDecl` from hir.

- [ ] **Step 6: Run all tests**

Run: `cd compiler && npm test`
Expected: all tests pass (stubs are in place, no functionality yet).

- [ ] **Step 7: Commit**

```bash
git add compiler/src/hir/index.ts compiler/src/checker/infer.ts compiler/src/codegen/codegen.ts
git commit -m "feat(hir): add HTraitDecl node, trait_dict_name, wire assertNever stubs"
```

---

### Task 5: Trait storage in TypeEnv

**Files:**
- Modify: `compiler/src/checker/env.ts`

- [ ] **Step 1: Add `TraitDef` and `ImplEntry` interfaces**

In `compiler/src/checker/env.ts`, add after `EffectDef`:

```typescript
export interface TraitMethodDef {
  name: string;
  type: FnType;
  has_default: boolean;
}

export interface TraitDef {
  name: string;
  type_params: string[];
  type_param_vars: number[];
  methods: TraitMethodDef[];
}

export interface ImplEntry {
  trait_name: string;
  target_type_name: string;
  type_params: string[];
  method_names: string[];
}
```

- [ ] **Step 2: Add trait maps to TypeEnv**

In `TypeEnv` class, add fields:

```typescript
  public traits: Map<string, TraitDef> = new Map();
  public trait_impls: ImplEntry[] = [];
```

- [ ] **Step 3: Run tests to verify compilation**

Run: `cd compiler && npm test`
Expected: all tests pass (new fields are unused so far).

- [ ] **Step 4: Commit**

```bash
git add compiler/src/checker/env.ts
git commit -m "feat(env): add TraitDef, ImplEntry storage in TypeEnv"
```

---

### Task 6: Register and check traits in the Checker

**Files:**
- Modify: `compiler/src/checker/infer.ts`
- Modify: `compiler/src/checker/checker.test.ts`

- [ ] **Step 1: Write checker test for trait type-checking**

Add to `compiler/src/checker/checker.test.ts`:

```typescript
  describe("trait declarations", () => {
    it("type-checks a simple trait + impl", () => {
      const source = `
        trait Greetable {
          fn greet(self) -> Str
        }
        struct User { name: Str }
        impl Greetable for User {
          fn greet(self) -> Str { self.name }
        }
        fn main() -> Str {
          let u = User { name: "yufeng" }
          u.greet()
        }
      `;
      const fn_decl = check_fn(source);
      assert.equal(fn_decl.return_type.kind, "str");
    });

    it("type-checks generic function with trait bound", () => {
      const source = `
        trait ToStr {
          fn to_str(self) -> Str
        }
        struct Num { val: Int }
        impl ToStr for Num {
          fn to_str(self) -> Str { "num" }
        }
        fn show<T: ToStr>(x: T) -> Str {
          x.to_str()
        }
        fn main() -> Str {
          show(Num { val: 42 })
        }
      `;
      const fn_decl = check_fn(source);
      assert.equal(fn_decl.return_type.kind, "str");
    });

    it("rejects missing trait impl method", () => {
      const source = `
        trait Greetable {
          fn greet(self) -> Str
        }
        struct User { name: Str }
        impl Greetable for User {
        }
      `;
      assert.throws(() => check_source(source), /missing.*method.*greet/i);
    });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd compiler && npm test`
Expected: FAIL — trait registration and method resolution not implemented.

- [ ] **Step 3: Implement `register_trait`**

Replace the stub in `compiler/src/checker/infer.ts`:

```typescript
  private register_trait(decl: TraitDecl): void {
    const saved_tp_scope = new Map(this.type_param_scope);
    const type_param_names = decl.type_params.map(tp => tp.name);
    const type_param_vars: number[] = [];
    for (const tp of decl.type_params) {
      const tv = this.env.fresh_var();
      type_param_vars.push(tv.id);
      this.type_param_scope.set(tp.name, tv);
    }

    const self_type = this.env.fresh_var();
    const methods: TraitMethodDef[] = [];
    for (const method of decl.methods) {
      const param_types = method.params.map(p => {
        if (p.name === "self") return self_type;
        return p.type_annotation ? this.resolve_type_expr(p.type_annotation) : this.env.fresh_var();
      });
      const ret_type = method.return_type ? this.resolve_type_expr(method.return_type) : this.env.fresh_var();
      const fn_type: FnType = {
        kind: "fn", params: param_types, return_type: ret_type, effects: EMPTY_ROW,
      };
      methods.push({
        name: method.name,
        type: fn_type,
        has_default: !method.is_abstract,
      });
    }

    this.type_param_scope = saved_tp_scope;
    const def: TraitDef = { name: decl.name, type_params: type_param_names, type_param_vars, methods };
    this.env.traits.set(decl.name, def);
  }
```

Import `TraitDef`, `TraitMethodDef`, `ImplEntry` from `./env.js`.

- [ ] **Step 4: Implement `register_impl` for trait impls**

Update the existing `register_impl` method to handle trait impls (when `decl.trait_name` is present):

```typescript
  private register_impl(decl: ImplDecl): void {
    let methods = this.env.impl_methods.get(decl.target_type);
    if (!methods) {
      methods = new Map();
      this.env.impl_methods.set(decl.target_type, methods);
    }

    for (const method of decl.methods) {
      const param_types = method.params.map(p =>
        p.type_annotation ? this.resolve_type_expr(p.type_annotation) : this.env.fresh_var()
      );
      const ret_type = method.return_type ? this.resolve_type_expr(method.return_type) : this.env.fresh_var();
      const fn_type: FnType = {
        kind: "fn", params: param_types, return_type: ret_type, effects: EMPTY_ROW,
      };
      methods.set(method.name, { type: fn_type, type_vars: [] });
    }

    // If this is a trait impl, register it and validate completeness
    if (decl.trait_name) {
      const trait_def = this.env.traits.get(decl.trait_name);
      if (!trait_def) {
        throw new TypeCheckError(`Unknown trait: ${decl.trait_name}`, decl.span);
      }
      // Check all required (non-default) methods are implemented
      const impl_method_names = new Set(decl.methods.map(m => m.name));
      for (const tm of trait_def.methods) {
        if (!tm.has_default && !impl_method_names.has(tm.name)) {
          throw new TypeCheckError(
            `Missing method '${tm.name}' in impl ${decl.trait_name} for ${decl.target_type}`,
            decl.span,
          );
        }
      }
      this.env.trait_impls.push({
        trait_name: decl.trait_name,
        target_type_name: decl.target_type,
        type_params: decl.type_params.map(tp => tp.name),
        method_names: decl.methods.map(m => m.name),
      });
    }
  }
```

- [ ] **Step 5: Update `check_trait_decl` stub**

Replace the stub:

```typescript
  private check_trait_decl(decl: TraitDecl): HTraitDecl {
    const trait_def = this.env.traits.get(decl.name)!;
    return {
      kind: "trait_decl",
      name: decl.name,
      type_params: decl.type_params,
      methods: trait_def.methods.map(m => ({
        name: m.name,
        params: m.type.params.map((t, i) => ({ name: decl.methods.find(dm => dm.name === m.name)?.params[i]?.name ?? `p${i}`, type: t })),
        return_type: m.type.return_type,
        has_default: m.has_default,
      })),
      is_pub: decl.is_pub,
      span: decl.span,
    };
  }
```

- [ ] **Step 6: Extend method resolution to find trait methods**

In `infer_method_call`, after the existing impl method lookup, add trait method lookup:

```typescript
    // If no direct impl method found, check trait impls
    if (!method_type && (recv_type.kind === "struct" || recv_type.kind === "enum")) {
      const type_name = recv_type.name;
      for (const impl_entry of this.env.trait_impls) {
        if (impl_entry.target_type_name === type_name) {
          const trait_def = this.env.traits.get(impl_entry.trait_name);
          if (trait_def) {
            const tm = trait_def.methods.find(m => m.name === method);
            if (tm) {
              // Found a trait method — instantiate fresh copy
              method_type = this.env.instantiate({ type: tm.type, type_vars: trait_def.type_param_vars });
              break;
            }
          }
        }
      }
    }
```

This goes right after the existing `recv_type.kind === "enum"` block in `infer_method_call` (around line 847), before `// Infer arguments`.

- [ ] **Step 7: Run tests**

Run: `cd compiler && npm test`
Expected: all old tests pass + 3 new checker tests pass.

- [ ] **Step 8: Commit**

```bash
git add compiler/src/checker/infer.ts compiler/src/checker/checker.test.ts compiler/src/checker/env.ts
git commit -m "feat(checker): trait registration, impl validation, trait method resolution"
```

---

### Task 7: Dictionary codegen for `impl Trait for Type`

**Files:**
- Modify: `compiler/src/codegen/codegen.ts`
- Modify: `compiler/src/codegen/codegen.test.ts`

- [ ] **Step 1: Write codegen test for trait dictionary**

Add to `compiler/src/codegen/codegen.test.ts`:

```typescript
  describe("trait dictionary generation", () => {
    it("generates dictionary object for impl Trait for Type", () => {
      const source = `
        trait Greetable {
          fn greet(self) -> Str
        }
        struct User { name: Str }
        impl Greetable for User {
          fn greet(self) -> Str { self.name }
        }
      `;
      const ast = Parser.parse(source);
      const hir = check(ast);
      const js = generate(hir);
      // Should contain a dictionary: const User_Greetable = { greet: ... }
      assert.ok(js.includes("User_Greetable"), "Should generate trait dictionary");
      assert.ok(js.includes("greet:"), "Dictionary should contain method");
    });
  });
```

Import `generate` and `check` at top of test file if not already:
```typescript
import { check } from "../checker/checker.js";
import { generate } from "./codegen.js";  // may already be imported
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd compiler && npm test`
Expected: FAIL — no dictionary generated.

- [ ] **Step 3: Implement dictionary emission in `emit_impl_decl`**

Update `emit_impl_decl` in `compiler/src/codegen/codegen.ts`:

```typescript
  private emit_impl_decl(decl: HImplDecl): void {
    if (decl.trait_name) {
      // Trait impl → emit dictionary object + standalone methods
      this.emit_trait_dictionary(decl);
    }
    // Always emit methods as standalone functions (for UFCS and direct calls)
    for (const method of decl.methods) {
      this.emit_fn_decl(method, decl.target_type);
    }
  }

  private emit_trait_dictionary(decl: HImplDecl): void {
    const dict_name = trait_dict_name(decl.target_type, decl.trait_name!);
    const entries = decl.methods.map(m => {
      const method_name = `${safe_ident(decl.target_type)}_${safe_ident(m.name)}`;
      return `${safe_ident(m.name)}: ${method_name}`;
    });
    this.emit(`const ${dict_name} = { ${entries.join(", ")} };`);
  }
```

Import `trait_dict_name` from `../hir/index.js`.

- [ ] **Step 4: Run tests**

Run: `cd compiler && npm test`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add compiler/src/codegen/codegen.ts compiler/src/codegen/codegen.test.ts
git commit -m "feat(codegen): emit trait dictionary objects from impl Trait for Type"
```

---

### Task 8: Dictionary passing for generic functions

**Files:**
- Modify: `compiler/src/codegen/codegen.ts`
- Modify: `compiler/src/hir/index.ts` (add `trait_bounds` to HFnDecl)
- Modify: `compiler/src/checker/infer.ts` (propagate bounds to HIR)
- Modify: `compiler/src/codegen/codegen.test.ts`

- [ ] **Step 1: Add `trait_bounds` field to `HFnDecl`**

In `compiler/src/hir/index.ts`, extend `HFnDecl`:

```typescript
export interface HFnDecl {
  kind: "fn_decl";
  name: string;
  type_params: TypeParam[];
  params: HParam[];
  return_type: Type;
  effects: EffectRow;
  body: HBlock;
  is_pub: boolean;
  trait_bounds: { type_param: string; trait_name: string }[];
  span: Span;
}
```

- [ ] **Step 2: Propagate trait bounds from AST to HIR in `check_fn_decl`**

In `compiler/src/checker/infer.ts`, in `check_fn_decl`, collect bounds:

```typescript
    // After type_params loop, collect trait bounds for codegen
    const trait_bounds: { type_param: string; trait_name: string }[] = [];
    for (const tp of decl.type_params) {
      for (const bound of tp.bounds) {
        trait_bounds.push({ type_param: tp.name, trait_name: bound.trait_name });
      }
    }
```

Add `trait_bounds` to the returned HFnDecl:

```typescript
    return {
      kind: "fn_decl",
      name: decl.name,
      type_params: decl.type_params,
      params: final_params,
      return_type: ret_type,
      effects,
      body: body_result.hexpr as HBlock,
      is_pub: decl.is_pub,
      trait_bounds,
      span: decl.span,
    };
```

**Important**: Fix all other places that construct `HFnDecl` to include `trait_bounds: []`:
- `check_impl_decl` → methods inherit from parent (usually `[]`)
- Any test helpers

- [ ] **Step 3: Write codegen test for dictionary passing**

Add to `compiler/src/codegen/codegen.test.ts`:

```typescript
    it("passes dictionary as implicit parameter to generic function", () => {
      const source = `
        trait Greetable {
          fn greet(self) -> Str
        }
        struct User { name: Str }
        impl Greetable for User {
          fn greet(self) -> Str { self.name }
        }
        fn show<T: Greetable>(x: T) -> Str {
          x.greet()
        }
        fn main() -> Str {
          show(User { name: "test" })
        }
      `;
      const ast = Parser.parse(source);
      const hir = check(ast);
      const js = generate(hir);
      // show() should accept a dictionary parameter
      assert.ok(js.includes("function show(x, __Greetable)"), "Generic fn should have dict param");
      // call site should pass User_Greetable
      assert.ok(js.includes("User_Greetable"), "Should pass dictionary at call site");
    });
```

- [ ] **Step 4: Run test to verify it fails**

Run: `cd compiler && npm test`
Expected: FAIL — no dict param in generated code.

- [ ] **Step 5: Implement dictionary parameter injection in codegen**

In `emit_fn_decl`, check if the function has trait bounds and add dictionary params:

```typescript
  private emit_fn_decl(decl: HFnDecl, prefix?: string): void {
    const name = prefix ? `${prefix}_${safe_ident(decl.name)}` : safe_ident(decl.name);
    const param_names = decl.params.map(p => safe_ident(p.name));
    // Add dictionary params for trait bounds
    const dict_params = (decl.trait_bounds ?? []).map(b => `__${b.trait_name}`);
    const all_params = [...param_names, ...dict_params].join(", ");
    const star = this.has_non_fail_effects(decl.effects) ? "*" : "";
    this.emit(`function${star} ${name}(${all_params}) {`);
    this.push_indent();
    this.emit_block_body(decl.body);
    this.pop_indent();
    this.emit("}");
  }
```

- [ ] **Step 6: Implement dictionary argument injection at call sites**

This requires the codegen to know, when generating a function call, whether the callee is a generic function with trait bounds and what the concrete type argument is.

The key insight: when the checker resolves a call like `show(User { ... })`, it knows `T = User` and the bound is `T: Greetable`. The codegen needs this information.

**Approach**: Store resolved trait dictionaries in `HCall` nodes.

In `compiler/src/hir/index.ts`, extend `HCall`:

```typescript
export interface HCall extends HExprBase {
  kind: "call";
  callee: HExpr;
  args: HExpr[];
  type_args: Type[];
  resolved_dicts: string[];  // dictionary names to pass (e.g., ["User_Greetable"])
}
```

In `compiler/src/checker/infer.ts`, in `infer_call`, after resolving the callee type, determine dictionaries needed:

```typescript
    // After unifying args and determining the concrete type arguments,
    // resolve trait dictionaries
    const resolved_dicts: string[] = [];
    if (callee_expr.kind === "ident") {
      const fn_decl_ast = /* find the original FnDecl */ null;
      // Simpler approach: look up the function's trait bounds from the AST
      // For now, use a lookup from env
    }
```

A simpler approach: store the trait bounds on the FnType itself, or look them up from a `fn_trait_bounds` map in the environment.

**Simpler implementation**: Add a `fn_bounds` map in TypeEnv:

```typescript
  // In TypeEnv
  public fn_bounds: Map<string, { type_param: string; trait_name: string }[]> = new Map();
```

Populate it during `register_fn`:

```typescript
  private register_fn(decl: FnDecl): void {
    // ... existing code ...
    // Store trait bounds
    const bounds: { type_param: string; trait_name: string }[] = [];
    for (const tp of decl.type_params) {
      for (const b of tp.bounds) {
        bounds.push({ type_param: tp.name, trait_name: b.trait_name });
      }
    }
    if (bounds.length > 0) {
      this.env.fn_bounds.set(decl.name, bounds);
    }
  }
```

In `infer_call`, resolve dictionaries:

```typescript
    // After all arg unification is done, resolve trait dictionaries
    const resolved_dicts: string[] = [];
    if (expr_callee.kind === "ident") {
      const fn_name = expr_callee.name;
      const bounds = this.env.fn_bounds.get(fn_name);
      if (bounds) {
        for (const b of bounds) {
          // Find what type the type param was instantiated to
          const tp_type = this.type_param_scope.get(b.type_param);
          if (tp_type) {
            const resolved = apply(s, tp_type);
            if (resolved.kind === "struct" || resolved.kind === "enum") {
              resolved_dicts.push(trait_dict_name(resolved.name, b.trait_name));
            }
          }
        }
      }
    }
```

Wait — the type_param_scope is for the *current* function's type params, not the *callee's*. We need a different approach.

**Better approach**: When `infer_call` instantiates the callee's type scheme (which creates fresh type vars for each type param), track the mapping from type param name to fresh var. After unification, resolve each fresh var to its concrete type.

Let me revise. In `infer_call`, after `this.env.instantiate(scheme)` for the callee, we need to know what each type parameter resolved to. Currently `instantiate` just returns a type — it doesn't expose the mapping.

Add a variant that returns the mapping:

```typescript
  // In TypeEnv
  instantiate_with_mapping(scheme: TypeScheme): { type: Type; mapping: Map<number, Type> } {
    if (scheme.type_vars.length === 0) return { type: scheme.type, mapping: new Map() };
    const mapping = new Map<number, Type>();
    for (const tv of scheme.type_vars) {
      mapping.set(tv, this.fresh_var());
    }
    return { type: substitute_type(scheme.type, mapping), mapping };
  }
```

Then in `infer_call`, when calling a function with bounds:

```typescript
    // Detect if callee is a named function with trait bounds
    let resolved_dicts: string[] = [];
    if (callee.kind === "ident") {
      const scheme = this.env.lookup(callee.name);
      const bounds = this.env.fn_bounds.get(callee.name);
      if (scheme && bounds && bounds.length > 0) {
        // We need to know what each type param resolved to
        // The callee type was already instantiated during infer_ident
        // We need to re-instantiate to get the mapping... or store it.
        // Simpler: after all unification, resolve the original type param vars
        // by finding what they map to through the substitution chain.
      }
    }
```

This is getting complex. **Simplest viable approach for Session 1**:

After all argument unification, look at each arg's concrete type and match it to the callee's trait bounds positionally. For `show<T: Greetable>(x: T)`, the first positional type param `T` is constrained. After unification, if arg 0 has type `User` (a struct), and the callee has bound `T: Greetable`, emit `User_Greetable`.

```typescript
    // In infer_call, after unification:
    if (callee.kind === "ident") {
      const bounds_list = this.env.fn_bounds.get(callee.name);
      if (bounds_list && callee_type.kind === "fn") {
        // Build mapping: type_param_name → resolved concrete type
        // This works because register_fn stored type vars in order
        const fn_scheme = this.env.lookup(callee.name);
        if (fn_scheme && fn_scheme.type_vars.length > 0) {
          // The original fn's type params are quantified as fn_scheme.type_vars
          // When we instantiated, each was mapped to a fresh var
          // After unification, those fresh vars are resolved
          // We need the fn decl's type_param *names* — stored in fn_bounds
          // Group bounds by type_param
          const param_names = [...new Set(bounds_list.map(b => b.type_param))];
          // The fn_scheme.type_vars correspond to param_names (same order as decl.type_params)
          // But we've already instantiated and unified — we need to find the concrete type for each
          // Use the unified argument types: if param i has type T and T resolved to User, done
          for (const bound of bounds_list) {
            // Find which arg corresponds to this type param
            // This is tricky in general. Simple heuristic for MVP:
            // Look through the resolved arg types and find a struct/enum type
            for (const harg of hargs) {
              const arg_type = apply(s, harg.type);
              if ((arg_type.kind === "struct" || arg_type.kind === "enum") &&
                  this.env.trait_impls.some(
                    impl => impl.target_type_name === arg_type.name && impl.trait_name === bound.trait_name
                  )) {
                resolved_dicts.push(trait_dict_name(arg_type.name, bound.trait_name));
                break;
              }
            }
          }
        }
      }
    }
```

This is the simplest approach for MVP. Store `resolved_dicts` on the HCall node.

In `gen_call` in codegen, append dictionary args:

```typescript
  private gen_call(expr: HExpr & { kind: "call" }): string {
    // ... existing UFCS detection code ...

    const callee = this.gen_expr(expr.callee);
    const args = expr.args.map(a => this.gen_expr(a));
    // Append resolved dictionary arguments
    const dict_args = (expr.resolved_dicts ?? []);
    const all_args = [...args, ...dict_args].join(", ");
    const prefix = this.needs_yield_star(expr.callee.type) ? "yield* " : "";
    return `${prefix}${callee}(${all_args})`;
  }
```

- [ ] **Step 7: Handle trait method calls via dictionary in codegen**

When inside a generic function like `show<T: Greetable>(x: T)`, a call `x.greet()` should be translated to `__Greetable.greet(x)` (dictionary dispatch).

In codegen's `gen_call`, detect when the callee is a trait method invocation. The checker stores this information... or we detect it by pattern:

The callee of `x.greet()` is resolved as `field_access(x, "greet")` → but for generic T, there's no concrete method. The checker needs to emit something the codegen can recognize.

**Approach**: In `infer_method_call`, when the method is resolved from a trait bound (not a concrete impl), emit an `HCall` that calls the dictionary instead:

When inside a function with `T: Greetable`, and we see `x.greet()` where `x: T`, the checker should resolve this as: "call `greet` from the `Greetable` dictionary". Produce:

```typescript
// HCall where callee = HIdent("__Greetable.greet")
// or better: HExpr of kind "trait_method_call" (new node)
```

Simplest approach without new HIR node: the checker produces an `HCall` where the callee encodes the dictionary lookup:

```typescript
// x.greet() inside generic fn with T: Greetable becomes:
{
  kind: "call",
  callee: { kind: "ident", name: "__Greetable_greet_dispatch", ... },
  args: [/* x */],
  ...
}
```

Actually, the simplest is to add a `dict_dispatch` field to the existing `HCall`:

```typescript
export interface HCall extends HExprBase {
  kind: "call";
  callee: HExpr;
  args: HExpr[];
  type_args: Type[];
  resolved_dicts: string[];
  dict_dispatch?: { dict_param: string; method: string };  // for trait method calls on generic types
}
```

When `dict_dispatch` is set, codegen emits `__Greetable.greet(x)`.

In `infer_method_call`, when the receiver is a type variable with trait bounds:

```typescript
    // Check if receiver is a type variable with trait bounds
    if (recv_type.kind === "var" || (recv_type.kind === "var" && /* check bounds */)) {
      // Look through the current function's type params to find matching bounds
      // If we find one, resolve via dict_dispatch
    }
```

This requires knowing the current function's type params and their bounds at the infer_method_call point. Store them as a field on InferEngine:

```typescript
  private current_fn_bounds: { type_param_var_id: number; trait_name: string }[] = [];
```

Set this at the start of `check_fn_decl`:

```typescript
    // After creating type param vars:
    const saved_fn_bounds = this.current_fn_bounds;
    this.current_fn_bounds = [];
    for (const tp of decl.type_params) {
      const tv = /* the type var created for this param */;
      for (const bound of tp.bounds) {
        this.current_fn_bounds.push({ type_param_var_id: tv.id, trait_name: bound.trait_name });
      }
    }
```

Restore at the end:
```typescript
    this.current_fn_bounds = saved_fn_bounds;
```

Then in `infer_method_call`, after the existing impl lookup fails:

```typescript
    // Check if receiver is a bounded type variable (trait dispatch)
    const resolved_recv = apply(s, recv_r.hexpr.type);
    if (!method_type && resolved_recv.kind === "var") {
      for (const fb of this.current_fn_bounds) {
        if (fb.type_param_var_id === resolved_recv.id) {
          const trait_def = this.env.traits.get(fb.trait_name);
          if (trait_def) {
            const tm = trait_def.methods.find(m => m.name === method);
            if (tm) {
              method_type = this.env.instantiate({ type: tm.type, type_vars: trait_def.type_param_vars });
              // Mark this call for dictionary dispatch in codegen
              dict_dispatch = { dict_param: `__${fb.trait_name}`, method };
              break;
            }
          }
        }
      }
    }
```

Then construct HCall with `dict_dispatch` set.

In `gen_call`, handle `dict_dispatch`:

```typescript
    if (expr.dict_dispatch) {
      const { dict_param, method: meth } = expr.dict_dispatch;
      const receiver = this.gen_expr(expr.args[0]); // first arg is self
      const rest_args = expr.args.slice(1).map(a => this.gen_expr(a));
      const all = [receiver, ...rest_args].join(", ");
      return `${dict_param}.${safe_ident(meth)}(${all})`;
    }
```

- [ ] **Step 8: Run tests**

Run: `cd compiler && npm test`
Expected: all tests pass.

- [ ] **Step 9: Commit**

```bash
git add compiler/src/hir/index.ts compiler/src/checker/infer.ts compiler/src/checker/env.ts compiler/src/codegen/codegen.ts compiler/src/codegen/codegen.test.ts
git commit -m "feat(codegen): dictionary passing for generic functions with trait bounds"
```

---

### Task 9: End-to-end test

**Files:**
- Create: `tests/cases/trait_basic.ring`
- Modify: `tests/e2e.test.ts`

- [ ] **Step 1: Create `trait_basic.ring`**

```ring
trait Greetable {
    fn greet(self) -> Str
}

struct User { name: Str }

impl Greetable for User {
    fn greet(self) -> Str { self.name }
}

fn show<T: Greetable>(x: T) -> Str {
    x.greet()
}

fn main() {
    print(show(User { name: "hello-trait" }))
}
```

- [ ] **Step 2: Register in e2e test runner**

In `tests/e2e.test.ts`, add to the `cases` array:

```typescript
  { file: "trait_basic.ring", expected: "hello-trait\n" },
```

- [ ] **Step 3: Run e2e tests**

Run: `cd compiler && npm test` (this runs unit tests)

Then run e2e:
```bash
cd tests && npm test
```

Or from compiler:
```bash
node dist/cli.js run ../tests/cases/trait_basic.ring
```

Expected: output `hello-trait`

If it fails, debug by checking intermediate output:
```bash
node dist/cli.js build ../tests/cases/trait_basic.ring --debug
```

- [ ] **Step 4: Fix any issues and re-run**

Common issues:
- Dictionary emitted after the function that uses it → reorder declarations
- Method resolution ambiguity between trait method and direct impl
- Missing dictionary arg at call site

- [ ] **Step 5: Run full test suite**

Run: `cd compiler && npm test` and `cd tests && npm test`
Expected: all 80+ unit tests + all 24+ e2e tests pass.

- [ ] **Step 6: Commit**

```bash
git add tests/cases/trait_basic.ring tests/e2e.test.ts
git commit -m "feat(e2e): add trait_basic.ring end-to-end test"
```

---

### Task 10: Final — lint, full test pass, cleanup

**Files:** All modified files.

- [ ] **Step 1: Run lint**

```bash
cd compiler && npm run lint
```

Fix any issues (unused imports, `as any`, etc.).

- [ ] **Step 2: Run full test suite**

```bash
cd compiler && npm test
cd tests && npm test
```

All tests must pass.

- [ ] **Step 3: Final commit if any cleanup was needed**

```bash
git add -A
git commit -m "chore: lint cleanup for trait system implementation"
```

---

## Spec Coverage Cross-Check

| Spec Requirement | Task |
|-----------------|------|
| `trait` keyword in lexer | Task 1 |
| `TraitDecl` AST node | Task 2 |
| `TypeBound`, multi-bounds `T: A + B` | Task 2, Task 3 |
| Parse `trait { ... }` | Task 3 |
| Parse abstract methods (no body) | Task 3 |
| `HTraitDecl` HIR node | Task 4 |
| `trait_dict_name` shared convention | Task 4 |
| `TraitDef`, `ImplEntry` in TypeEnv | Task 5 |
| Trait registration in checker | Task 6 |
| Impl completeness validation | Task 6 |
| Trait method resolution | Task 6 |
| Dictionary object generation | Task 7 |
| Dictionary parameter passing | Task 8 |
| Dictionary dispatch for `x.method()` | Task 8 |
| E2E test | Task 9 |
| All existing tests pass | Task 10 |
