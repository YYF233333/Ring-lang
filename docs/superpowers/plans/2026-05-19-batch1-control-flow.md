# Batch 1: Control Flow (var/= + while + for + break/continue)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add loop constructs (while, for..in range, break, continue) and enforce let immutability, preparing Ring-lang for self-hosting compiler development.

**Architecture:** Add WhileStmt, ForInStmt, BreakStmt, ContinueStmt to the Stmt discriminated union (AST + HIR), propagate through the full pipeline (Lexer → Parser → Checker → Codegen). Let immutability tracked via `mutable_vars: Set<number>` in TypeEnv. For..in only supports integer ranges (`start..end`) in this batch; general iterable support comes with List\<T\> in Batch 2.

**Tech Stack:** TypeScript strict mode, node:test, Ring-lang compiler pipeline

---

## Design Decisions

1. **while/for/break/continue are Stmt, not Expr** — they don't produce values (while/for return Unit implicitly). Consistent with return/let/var being statements.
2. **Range `..` only in for..in syntax** — not a general-purpose expression. Parsed inline by for..in parser. `DotDot` token already exists in lexer.
3. **Range precedence handled via parse_expr** — since `DotDot` has `Prec.None` in `infix_precedence`, `parse_expr()` naturally stops before `..`, letting the for..in parser consume it.
4. **ForInStmt stores range_start/range_end** — simple for Batch 1. Refactored to support general iterables in Batch 2.
5. **Let immutability via mutable_vars Set** — TypeEnv tracks which def_ids are mutable. assign_stmt checks target is mutable.
6. **Only ident targets checked for immutability** — field access (e.g., `point.x = 5`) deferred to later design.
7. **for..in range compiles to C-style for loop** — `for x in 0..10 { body }` → `for (let x = 0; x < 10; x++) { body }`. Zero-cost, no iterator abstraction.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `compiler/src/parser/lexer.ts` | Modify | Add `While`, `Break`, `Continue` keywords |
| `compiler/src/diagnostics/codes.ts` | Modify | Add E0205, E0206 error codes |
| `compiler/src/ast/index.ts` | Modify | Add WhileStmt, ForInStmt, BreakStmt, ContinueStmt to Stmt |
| `compiler/src/hir/index.ts` | Modify | Add HWhileStmt, HForInStmt, HBreakStmt, HContinueStmt to HStmt |
| `compiler/src/checker/env.ts` | Modify | Add `mutable_vars: Set<number>` tracking |
| `compiler/src/checker/infer.ts` | Modify | Add loop_depth tracking, let immutability check, infer new stmts |
| `compiler/src/codegen/codegen.ts` | Modify | Generate JS for new stmts |
| `compiler/src/parser/parser.ts` | Modify | Parse while/for/break/continue |
| `compiler/src/lsp/features/hover.ts` | Modify | Handle new HStmt kinds in HIR traversal |
| `compiler/src/lsp/features/completion.ts` | Modify | Handle new HStmt kinds in HIR traversal |
| `compiler/src/lsp/features/definition.ts` | Modify | Handle new HStmt kinds in HIR traversal |
| `compiler/src/lsp/features/references.ts` | Modify | Handle new HStmt kinds in HIR traversal |
| `compiler/src/lsp/features/rename.ts` | Modify | Handle new HStmt kinds in HIR traversal |
| `compiler/src/checker/zonk.ts` | Modify | Handle new HStmt kinds in zonk traversal |
| `tests/cases/*.ring` | Create | E2E test files |
| `tests/e2e.test.ts` | Modify | Register new test cases |
| `CLAUDE.md` | Modify | Update test counts and feature status |

---

### Task 1: Lexer + Error Codes

**Files:**
- Modify: `compiler/src/parser/lexer.ts:10-34` (TokenKind enum), `compiler/src/parser/lexer.ts:90-115` (KEYWORDS map)
- Modify: `compiler/src/diagnostics/codes.ts`

- [ ] **Step 1: Add While, Break, Continue to TokenKind enum**

In `compiler/src/parser/lexer.ts`, add after `Try = "try"` (line 34):

```typescript
  While = "while",
  Break = "break",
  Continue = "continue",
```

And in the KEYWORDS map (after line 114):

```typescript
  while: TokenKind.While,
  break: TokenKind.Break,
  continue: TokenKind.Continue,
```

- [ ] **Step 2: Add error codes E0205 and E0206**

In `compiler/src/diagnostics/codes.ts`, add to the `E` object:

```typescript
  E0205: "E0205", // assignment to immutable variable
  E0206: "E0206", // break/continue outside loop
```

Add to `ERROR_DESCRIPTIONS`:

```typescript
  [E.E0205]: "Assignment to immutable variable",
  [E.E0206]: "Break/continue outside loop",
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd compiler && npx tsc --noEmit`
Expected: No errors (new tokens/codes are additive)

- [ ] **Step 4: Commit**

```bash
git add compiler/src/parser/lexer.ts compiler/src/diagnostics/codes.ts
git commit -m "feat: add while/break/continue keywords and E0205/E0206 error codes"
```

---

### Task 2: AST + HIR Type Definitions

**Files:**
- Modify: `compiler/src/ast/index.ts:321-326` (Stmt union), add new interfaces
- Modify: `compiler/src/hir/index.ts:204-209` (HStmt union), add new interfaces

- [ ] **Step 1: Add new AST Stmt variants**

In `compiler/src/ast/index.ts`, expand the `Stmt` type union (line 321-326) to:

```typescript
export type Stmt =
  | LetStmt
  | VarStmt
  | AssignStmt
  | ExprStmt
  | ReturnStmt
  | WhileStmt
  | ForInStmt
  | BreakStmt
  | ContinueStmt;
```

Add the new interfaces after `ReturnStmt` (after line 364):

```typescript
export interface WhileStmt {
  kind: "while_stmt";
  condition: Expr;
  body: BlockExpr;
  span: Span;
}

export interface ForInStmt {
  kind: "for_in_stmt";
  binding: string;
  binding_span: Span;
  range_start: Expr;
  range_end: Expr;
  body: BlockExpr;
  span: Span;
}

export interface BreakStmt {
  kind: "break_stmt";
  span: Span;
}

export interface ContinueStmt {
  kind: "continue_stmt";
  span: Span;
}
```

Update imports at the top of the file to export the new types.

- [ ] **Step 2: Add new HIR HStmt variants**

In `compiler/src/hir/index.ts`, expand `HStmt` (line 204-209) to:

```typescript
export type HStmt =
  | HLetStmt
  | HVarStmt
  | HAssignStmt
  | HExprStmt
  | HReturnStmt
  | HWhileStmt
  | HForInStmt
  | HBreakStmt
  | HContinueStmt;
```

Add new interfaces after `HReturnStmt` (after line 248):

```typescript
export interface HWhileStmt {
  kind: "while_stmt";
  condition: HExpr;
  body: HBlock;
  span: Span;
}

export interface HForInStmt {
  kind: "for_in_stmt";
  binding: string;
  binding_span: Span;
  def_id?: number;
  range_start: HExpr;
  range_end: HExpr;
  body: HBlock;
  span: Span;
}

export interface HBreakStmt {
  kind: "break_stmt";
  span: Span;
}

export interface HContinueStmt {
  kind: "continue_stmt";
  span: Span;
}
```

- [ ] **Step 3: Fix all assertNever compile errors**

Running `npx tsc --noEmit` will show errors at every `switch` on `Stmt`/`HStmt` that uses `assertNever`. These are in:
- `compiler/src/checker/infer.ts` (`infer_stmt`)
- `compiler/src/codegen/codegen.ts` (`gen_stmt_inline`, `emit_stmt`)
- `compiler/src/checker/zonk.ts` (zonk traversal)
- `compiler/src/lsp/features/*.ts` (HIR traversal functions)

For each file, add placeholder cases that throw "not yet implemented" errors. These will be replaced with real implementations in subsequent tasks.

Example for `infer_stmt` in `infer.ts`:
```typescript
case "while_stmt":
case "for_in_stmt":
case "break_stmt":
case "continue_stmt":
  throw new Error(`${stmt.kind} not yet implemented in checker`);
```

Example for `gen_stmt_inline` in `codegen.ts`:
```typescript
case "while_stmt":
case "for_in_stmt":
case "break_stmt":
case "continue_stmt":
  throw new Error(`${stmt.kind} handled in emit_stmt`);
```

Example for `emit_stmt` in `codegen.ts`:
```typescript
case "while_stmt":
case "for_in_stmt":
case "break_stmt":
case "continue_stmt":
  throw new Error(`${stmt.kind} codegen not yet implemented`);
```

- [ ] **Step 4: Verify TypeScript compiles and existing tests pass**

Run: `cd compiler && npx tsc --noEmit && npm test`
Expected: All compile, all 209 unit tests + 161 e2e tests pass (no behavioral change)

- [ ] **Step 5: Commit**

```bash
git add compiler/src/ast/index.ts compiler/src/hir/index.ts compiler/src/checker/infer.ts compiler/src/codegen/codegen.ts compiler/src/checker/zonk.ts compiler/src/lsp/features/
git commit -m "feat: add WhileStmt/ForInStmt/BreakStmt/ContinueStmt to AST + HIR type definitions"
```

---

### Task 3: Let Immutability Enforcement

**Files:**
- Modify: `compiler/src/checker/env.ts:84-100` (TypeEnv class)
- Modify: `compiler/src/checker/infer.ts:797-826` (var_stmt + assign_stmt)
- Create: `tests/cases/error_assign_immutable.ring`
- Modify: `tests/e2e.test.ts` (register negative test)

- [ ] **Step 1: Write failing e2e test**

Create `tests/cases/error_assign_immutable.ring`:
```ring
fn main() {
    let x = 10
    x = 20
    print(x)
}
```

Register in `tests/e2e.test.ts` in the `negative_cases` array:
```typescript
{ file: "error_assign_immutable.ring", error_pattern: "E0205" },
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd compiler && npm run build && npm run test:e2e`
Expected: `error_assign_immutable.ring` test FAILS because the compiler doesn't report E0205 yet (it currently allows assignment to let-bound variables).

- [ ] **Step 3: Add mutable_vars tracking to TypeEnv**

In `compiler/src/checker/env.ts`, add a field to `TypeEnv` (after line 97):

```typescript
  public mutable_vars: Set<number> = new Set();
```

- [ ] **Step 4: Mark var-bound variables as mutable in checker**

In `compiler/src/checker/infer.ts`, in the `"var_stmt"` case (around line 807), after `this.env.bind_mono(...)`:

```typescript
this.env.mutable_vars.add(var_scheme.def_id!);
```

- [ ] **Step 5: Check immutability in assign_stmt**

In `compiler/src/checker/infer.ts`, in the `"assign_stmt"` case (line 815), add a check at the beginning before inferring target/value:

```typescript
case "assign_stmt": {
  if (stmt.target.kind === "ident") {
    const scheme = this.env.lookup(stmt.target.name);
    if (scheme && scheme.def_id !== undefined && !this.env.mutable_vars.has(scheme.def_id)) {
      this.type_error(
        E.E0205,
        `Cannot assign to immutable variable '${stmt.target.name}' (declared with 'let'). Use 'var' for mutable bindings.`,
        stmt.target.span,
        { notes: [`'${stmt.target.name}' is declared here`] }
      );
    }
  }
  const target_r = this.infer_expr(stmt.target, subst);
  // ... rest unchanged
```

- [ ] **Step 6: Run tests**

Run: `cd compiler && npm run build && npm run test:all`
Expected: All existing tests pass + `error_assign_immutable.ring` negative test passes (E0205 reported).

- [ ] **Step 7: Add unit test for immutability check**

In `compiler/src/checker/checker.test.ts`, add:

```typescript
test("assign to let binding reports E0205", () => {
  const src = `fn main() { let x = 1; x = 2; }`;
  const sink = new CollectingSink();
  assert.throws(() => check_source(src, sink));
  assert.ok(sink.diagnostics.some(d => d.code === "E0205"));
});

test("assign to var binding is allowed", () => {
  const src = `fn main() { var x = 1; x = 2; }`;
  const sink = new CollectingSink();
  check_source(src, sink);
  assert.strictEqual(sink.diagnostics.length, 0);
});
```

- [ ] **Step 8: Run all tests**

Run: `cd compiler && npm run build && npm test`
Expected: All pass including new unit tests.

- [ ] **Step 9: Commit**

```bash
git add compiler/src/checker/env.ts compiler/src/checker/infer.ts tests/cases/error_assign_immutable.ring tests/e2e.test.ts compiler/src/checker/checker.test.ts
git commit -m "feat: enforce let immutability — assignment to let-bound variables reports E0205"
```

---

### Task 4: While Loop

**Files:**
- Modify: `compiler/src/parser/parser.ts:513-556` (parse_stmt), add parse_while_stmt
- Modify: `compiler/src/checker/infer.ts:46-54` (add loop_depth), `776-858` (infer_stmt)
- Modify: `compiler/src/codegen/codegen.ts:398-413` (emit_stmt), `624-642` (gen_stmt_inline)
- Create: `tests/cases/while_basic.ring`
- Modify: `tests/e2e.test.ts`

- [ ] **Step 1: Write failing e2e test**

Create `tests/cases/while_basic.ring`:
```ring
fn main() {
    var i = 0
    var sum = 0
    while i < 5 {
        sum += i
        i += 1
    }
    print(sum)
}
```

Register in `tests/e2e.test.ts` cases array:
```typescript
{ file: "while_basic.ring", expected: "10\n" },
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd compiler && npm run build && npm run test:e2e`
Expected: FAILS — parser doesn't recognize `while`.

- [ ] **Step 3: Add parse_while_stmt to parser**

In `compiler/src/parser/parser.ts`, update the imports at the top (line 3) to include:
```typescript
WhileStmt, ForInStmt, BreakStmt, ContinueStmt,
```

In `parse_stmt()` (after the `Return` check at line 522-524), add:

```typescript
    if (this.check(TokenKind.While)) {
      return this.parse_while_stmt();
    }
```

Add the method (after `parse_return_stmt`, around line 590):

```typescript
  private parse_while_stmt(): WhileStmt {
    const start = this.current_span_start();
    this.expect(TokenKind.While);
    const condition = this.parse_expr();
    this.expect(TokenKind.LBrace);
    const body = this.parse_block();
    const end = this.current_span_start();
    return {
      kind: "while_stmt",
      condition,
      body,
      span: this.make_span(start, end),
    };
  }
```

- [ ] **Step 4: Add while_stmt to checker**

In `compiler/src/checker/infer.ts`, add a `loop_depth` field to `InferEngine` (after line 54):

```typescript
  private loop_depth: number = 0;
```

Replace the placeholder `case "while_stmt"` in `infer_stmt` with:

```typescript
      case "while_stmt": {
        const cond_r = this.infer_expr(stmt.condition, subst);
        let s = this.unify_at(cond_r.hexpr.type, BOOL, cond_r.subst, stmt.condition.span);
        this.env.push_scope();
        this.loop_depth++;
        const body_r = this.infer_block(stmt.body, s);
        this.loop_depth--;
        this.env.pop_scope();
        s = body_r.subst;
        let effects: EffectRow;
        [effects, s] = this.merge_effects(cond_r.effects, body_r.effects, s);
        return {
          hstmt: {
            kind: "while_stmt",
            condition: cond_r.hexpr,
            body: body_r.hexpr as HBlock,
            span: stmt.span,
          },
          subst: s,
          effects,
        };
      }
```

Note: `infer_block` is the existing method used by `BlockExpr` inference. Verify it exists and accepts an optional `initial_subst` parameter.

- [ ] **Step 5: Add while_stmt to codegen**

In `compiler/src/codegen/codegen.ts`, in `emit_stmt` (line 398-413), add before the `default` case:

```typescript
      case "while_stmt":
        this.emit(`while (${this.gen_expr(stmt.condition)}) {`);
        this.push_indent();
        this.emit_block_in_stmt_context(stmt.body, "discard");
        this.pop_indent();
        this.emit("}");
        return;
```

- [ ] **Step 6: Run tests**

Run: `cd compiler && npm run build && npm run test:all`
Expected: All pass including `while_basic.ring`.

- [ ] **Step 7: Add parser + checker unit tests**

In `compiler/src/parser/parser.test.ts`:
```typescript
test("parse while statement", () => {
  const ast = parse_source("fn main() { while true { print(1); } }");
  const body = (ast.decls[0] as any).body.stmts;
  assert.strictEqual(body[0].kind, "while_stmt");
  assert.strictEqual(body[0].condition.kind, "bool_lit");
  assert.strictEqual(body[0].body.stmts.length, 1);
});
```

In `compiler/src/checker/checker.test.ts`:
```typescript
test("while condition must be Bool", () => {
  const src = `fn main() { while 42 { print(1); } }`;
  const sink = new CollectingSink();
  assert.throws(() => check_source(src, sink));
  assert.ok(sink.diagnostics.some(d => d.code === "E0301"));
});
```

- [ ] **Step 8: Run all tests**

Run: `cd compiler && npm run build && npm test`
Expected: All pass.

- [ ] **Step 9: Commit**

```bash
git add compiler/src/parser/parser.ts compiler/src/checker/infer.ts compiler/src/codegen/codegen.ts tests/cases/while_basic.ring tests/e2e.test.ts compiler/src/parser/parser.test.ts compiler/src/checker/checker.test.ts
git commit -m "feat: implement while loop — parser, checker (Bool condition), codegen"
```

---

### Task 5: Break / Continue

**Files:**
- Modify: `compiler/src/parser/parser.ts` (parse_stmt)
- Modify: `compiler/src/checker/infer.ts` (infer_stmt — validate loop_depth)
- Modify: `compiler/src/codegen/codegen.ts` (emit_stmt)
- Create: `tests/cases/break_continue.ring`
- Create: `tests/cases/error_break_outside.ring`
- Modify: `tests/e2e.test.ts`

- [ ] **Step 1: Write failing e2e tests**

Create `tests/cases/break_continue.ring`:
```ring
fn main() {
    var sum = 0
    var i = 0
    while true {
        if i == 5 {
            break
        }
        if i == 3 {
            i += 1
            continue
        }
        sum += i
        i += 1
    }
    print(sum)
}
```
Expected output: `3\n` (0 + 1 + 2 + 4 = 7... wait let me recalculate)

Actually: i=0: sum+=0 (sum=0), i=1; i=1: sum+=1 (sum=1), i=2; i=2: sum+=2 (sum=3), i=3; i=3: continue (i becomes 4); i=4: sum+=4 (sum=7), i=5; i=5: break. Output: 7.

Wait, when i=3: first we check i==5, nope. Then i==3, yes → i+=1 (i=4), continue. So we skip sum+=i and i+=1 at the bottom.

i=4: check i==5? no. check i==3? no. sum+=4 (sum=7). i+=1 (i=5).
i=5: check i==5? yes → break.

Output: 7.

Create `tests/cases/break_continue.ring`:
```ring
fn main() {
    var sum = 0
    var i = 0
    while true {
        if i == 5 {
            break
        }
        if i == 3 {
            i += 1
            continue
        }
        sum += i
        i += 1
    }
    print(sum)
}
```

Register: `{ file: "break_continue.ring", expected: "7\n" }`

Create `tests/cases/error_break_outside.ring`:
```ring
fn main() {
    break
}
```

Register negative: `{ file: "error_break_outside.ring", error_pattern: "E0206" }`

- [ ] **Step 2: Parse break and continue**

In `compiler/src/parser/parser.ts`, in `parse_stmt()`, add after the while check:

```typescript
    if (this.check(TokenKind.Break)) {
      return this.parse_break_stmt();
    }
    if (this.check(TokenKind.Continue)) {
      return this.parse_continue_stmt();
    }
```

Add the methods:

```typescript
  private parse_break_stmt(): BreakStmt {
    const start = this.current_span_start();
    this.expect(TokenKind.Break);
    this.try_consume(TokenKind.Semi);
    const end = this.current_span_start();
    return { kind: "break_stmt", span: this.make_span(start, end) };
  }

  private parse_continue_stmt(): ContinueStmt {
    const start = this.current_span_start();
    this.expect(TokenKind.Continue);
    this.try_consume(TokenKind.Semi);
    const end = this.current_span_start();
    return { kind: "continue_stmt", span: this.make_span(start, end) };
  }
```

- [ ] **Step 3: Check break/continue in checker**

In `compiler/src/checker/infer.ts`, replace placeholder cases:

```typescript
      case "break_stmt": {
        if (this.loop_depth === 0) {
          this.type_error(E.E0206, "'break' can only be used inside a loop", stmt.span, {});
        }
        return {
          hstmt: { kind: "break_stmt", span: stmt.span },
          subst,
          effects: EMPTY_ROW,
        };
      }
      case "continue_stmt": {
        if (this.loop_depth === 0) {
          this.type_error(E.E0206, "'continue' can only be used inside a loop", stmt.span, {});
        }
        return {
          hstmt: { kind: "continue_stmt", span: stmt.span },
          subst,
          effects: EMPTY_ROW,
        };
      }
```

- [ ] **Step 4: Emit break/continue in codegen**

In `compiler/src/codegen/codegen.ts`, in `emit_stmt`, add:

```typescript
      case "break_stmt":
        this.emit("break;");
        return;
      case "continue_stmt":
        this.emit("continue;");
        return;
```

- [ ] **Step 5: Build and run tests**

Run: `cd compiler && npm run build && npm run test:all`
Expected: All pass including break_continue.ring and error_break_outside.ring.

- [ ] **Step 6: Commit**

```bash
git add compiler/src/parser/parser.ts compiler/src/checker/infer.ts compiler/src/codegen/codegen.ts tests/cases/break_continue.ring tests/cases/error_break_outside.ring tests/e2e.test.ts
git commit -m "feat: implement break/continue with loop-context validation (E0206)"
```

---

### Task 6: For..in with Range

**Files:**
- Modify: `compiler/src/parser/parser.ts` (parse_stmt, add parse_for_in_stmt)
- Modify: `compiler/src/checker/infer.ts` (infer_stmt — for_in_stmt case)
- Modify: `compiler/src/codegen/codegen.ts` (emit_stmt — for_in_stmt case)
- Create: `tests/cases/for_range.ring`
- Modify: `tests/e2e.test.ts`

- [ ] **Step 1: Write failing e2e test**

Create `tests/cases/for_range.ring`:
```ring
fn main() {
    var sum = 0
    for i in 0..5 {
        sum += i
    }
    print(sum)
}
```

Register: `{ file: "for_range.ring", expected: "10\n" }`

- [ ] **Step 2: Parse for..in statement**

In `compiler/src/parser/parser.ts`, in `parse_stmt()`, add (after the while/break/continue checks):

```typescript
    if (this.check(TokenKind.For)) {
      return this.parse_for_in_stmt();
    }
```

Remove the error in `parse_prefix()` (line 723-725):
```typescript
    // DELETE these lines:
    // if (tok.kind === TokenKind.For) {
    //   throw this.error("for loops are not yet implemented");
    // }
```

Add the method:

```typescript
  private parse_for_in_stmt(): ForInStmt {
    const start = this.current_span_start();
    this.expect(TokenKind.For);
    const name_tok = this.expect(TokenKind.Ident);
    const binding = name_tok.value;
    const binding_span = name_tok.span;
    this.expect(TokenKind.In);
    const range_start = this.parse_expr();
    if (!this.check(TokenKind.DotDot)) {
      throw this.error("for..in currently only supports range iteration (e.g., for x in 0..10 { ... })");
    }
    this.advance();
    const range_end = this.parse_expr();
    this.expect(TokenKind.LBrace);
    const body = this.parse_block();
    const end = this.current_span_start();
    return {
      kind: "for_in_stmt",
      binding,
      binding_span,
      range_start,
      range_end,
      body,
      span: this.make_span(start, end),
    };
  }
```

- [ ] **Step 3: Type-check for..in statement**

In `compiler/src/checker/infer.ts`, replace the placeholder `case "for_in_stmt"`:

```typescript
      case "for_in_stmt": {
        const start_r = this.infer_expr(stmt.range_start, subst);
        let s = this.unify_at(start_r.hexpr.type, INT, start_r.subst, stmt.range_start.span);
        const end_r = this.infer_expr(stmt.range_end, s);
        s = this.unify_at(end_r.hexpr.type, INT, end_r.subst, stmt.range_end.span);
        this.env.push_scope();
        this.env.bind_mono(stmt.binding, INT);
        const binding_scheme = this.env.lookup(stmt.binding)!;
        this.env.record_def_span(binding_scheme.def_id!, stmt.binding_span);
        this.loop_depth++;
        const body_r = this.infer_block(stmt.body, s);
        this.loop_depth--;
        this.env.pop_scope();
        s = body_r.subst;
        let effects: EffectRow;
        [effects, s] = this.merge_effects(start_r.effects, end_r.effects, s);
        [effects, s] = this.merge_effects(effects, body_r.effects, s);
        return {
          hstmt: {
            kind: "for_in_stmt",
            binding: stmt.binding,
            binding_span: stmt.binding_span,
            def_id: binding_scheme.def_id,
            range_start: start_r.hexpr,
            range_end: end_r.hexpr,
            body: body_r.hexpr as HBlock,
            span: stmt.span,
          },
          subst: s,
          effects,
        };
      }
```

- [ ] **Step 4: Generate JS for for..in**

In `compiler/src/codegen/codegen.ts`, in `emit_stmt`, add:

```typescript
      case "for_in_stmt": {
        const start = this.gen_expr(stmt.range_start);
        const end = this.gen_expr(stmt.range_end);
        const binding = safe_ident(stmt.binding);
        this.emit(`for (let ${binding} = ${start}; ${binding} < ${end}; ${binding}++) {`);
        this.push_indent();
        this.emit_block_in_stmt_context(stmt.body, "discard");
        this.pop_indent();
        this.emit("}");
        return;
      }
```

- [ ] **Step 5: Build and run tests**

Run: `cd compiler && npm run build && npm run test:all`
Expected: All pass including for_range.ring.

- [ ] **Step 6: Add more test coverage**

Create `tests/cases/for_range_nested.ring`:
```ring
fn main() {
    var sum = 0
    for i in 0..3 {
        for j in 0..3 {
            sum += 1
        }
    }
    print(sum)
}
```

Register: `{ file: "for_range_nested.ring", expected: "9\n" }`

Create `tests/cases/for_range_break.ring`:
```ring
fn main() {
    var sum = 0
    for i in 0..10 {
        if i == 5 {
            break
        }
        sum += i
    }
    print(sum)
}
```

Register: `{ file: "for_range_break.ring", expected: "10\n" }`

- [ ] **Step 7: Run all tests**

Run: `cd compiler && npm run build && npm run test:all`
Expected: All pass.

- [ ] **Step 8: Commit**

```bash
git add compiler/src/parser/parser.ts compiler/src/checker/infer.ts compiler/src/codegen/codegen.ts tests/cases/for_range.ring tests/cases/for_range_nested.ring tests/cases/for_range_break.ring tests/e2e.test.ts
git commit -m "feat: implement for..in range loop — for i in 0..n { body }"
```

---

### Task 7: Zonk + LSP Traversal Updates

**Files:**
- Modify: `compiler/src/checker/zonk.ts`
- Modify: `compiler/src/lsp/features/hover.ts`
- Modify: `compiler/src/lsp/features/completion.ts`
- Modify: `compiler/src/lsp/features/definition.ts`
- Modify: `compiler/src/lsp/features/references.ts`
- Modify: `compiler/src/lsp/features/rename.ts`

These files iterate over HIR nodes and need to handle the new HStmt kinds. Since the exact traversal patterns vary by file, the implementer should:

- [ ] **Step 1: Update zonk.ts**

Find all functions in `zonk.ts` that switch on `HStmt.kind`. For each new stmt kind, add appropriate traversal:

For `while_stmt`: zonk the condition and recursively zonk the body block.
For `for_in_stmt`: zonk range_start, range_end, and body block.
For `break_stmt` / `continue_stmt`: no children to zonk — just add empty cases.

- [ ] **Step 2: Update LSP features**

Each LSP feature file has functions that traverse the HIR tree. Find all places that iterate over `HStmt[]` or switch on `HStmt.kind`. Add handling for:

- `while_stmt`: recurse into condition (HExpr) and body (HBlock)
- `for_in_stmt`: recurse into range_start, range_end (HExpr) and body (HBlock); for definition/references, also check `def_id` for the loop binding
- `break_stmt` / `continue_stmt`: no children to traverse

Key files and patterns:
- `hover.ts`: `find_node_at_position` — recurse into while/for children
- `completion.ts`: `collect_local_variables` — for_in binding should appear as a local variable
- `definition.ts`: `find_def_at_position` — for_in binding has a def_id
- `references.ts`: `find_references` — for_in binding has a def_id, match against idents in body
- `rename.ts`: same as references — for_in binding is renameable

- [ ] **Step 3: Verify TypeScript compiles and tests pass**

Run: `cd compiler && npm run build && npm run test:all`
Expected: All pass including LSP tests (39 tests).

- [ ] **Step 4: Commit**

```bash
git add compiler/src/checker/zonk.ts compiler/src/lsp/features/
git commit -m "feat: update zonk + LSP traversal for while/for/break/continue HIR nodes"
```

---

### Task 8: Documentation + Final Verification

**Files:**
- Modify: `CLAUDE.md`
- Modify: `docs/design.md` (implementation status appendix, if it has one)

- [ ] **Step 1: Run full test suite**

Run: `cd compiler && npm run lint && npm run test:all`
Expected: All lint checks pass, all tests pass.

- [ ] **Step 2: Update CLAUDE.md**

Update the following sections:
- **当前状态**: Add "while/for..in range/break/continue 循环" to the feature list
- **已知限制 → 基础设施限制**: Change "无控制流循环（无 loop/for/range）" to describe the new state: "循环仅支持 while 和 for..in range（无一般 iterable 支持，Batch 2 将添加）"
- **Test counts**: Update unit test and e2e test counts
- **已实现功能**: Add a new section for Phase 3a Batch 1

- [ ] **Step 3: Update parser import in parser.ts**

Ensure the parser imports all new AST types at the top of `parser.ts` (line 2-14).

- [ ] **Step 4: Final full verification**

Run: `cd compiler && npm run lint && npm run build && npm run test:all`
Expected: All green.

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md docs/design.md
git commit -m "docs: update CLAUDE.md for Batch 1 — while/for/break/continue + let immutability"
```

---

## Summary

| Task | What | Key Changes |
|------|------|-------------|
| 1 | Lexer + Error Codes | While/Break/Continue keywords, E0205/E0206 |
| 2 | AST + HIR Types | 4 new Stmt variants, placeholder assertNever cases |
| 3 | Let Immutability | mutable_vars tracking, E0205 on let assignment |
| 4 | While Loop | Full pipeline: parse → check (Bool cond) → codegen |
| 5 | Break/Continue | Full pipeline: parse → check (loop_depth) → codegen |
| 6 | For..in Range | Full pipeline: parse `for x in 0..n` → check (Int) → codegen (C-style for) |
| 7 | Zonk + LSP | HIR traversal for all new node types |
| 8 | Docs + Verify | CLAUDE.md, final test run |
