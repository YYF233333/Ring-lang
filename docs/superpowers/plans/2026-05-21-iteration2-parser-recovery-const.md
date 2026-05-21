# Phase 3 Iteration 2: Parser Error Recovery + const Declaration

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the parser recover from syntax errors at declaration boundaries (report multiple errors per file instead of crashing on the first), add `const` top-level declarations, and verify string interpolation nested quotes.

**Architecture:** Parser `error()` switches from `panic()` to `fail.raise()`. `parse_program` wraps each `parse_decl()` call in `catch` for declaration-level recovery. `parse()` accepts a `CollectingSink` parameter so callers can inspect parse diagnostics. `const` is a new `Decl` variant with full pipeline support (lexer → parser → AST → checker → HIR → codegen).

**Tech Stack:** Ring compiler (self-hosted), node:test E2E framework

---

## Task 1: A4 — Verify Nested String Interpolation

The CLAUDE.md limitation about `"${fn("arg")}"` failing may already be fixed. The lexer's `interp_brace_depth` stack correctly handles nested string literals inside interpolation, and `tests/cases/string_interp_nested.ring` already tests `"a${"b${x}c"}d"`.

**Files:**
- Create: `tests/cases/string_interp_fn_call.ring`
- Modify: `tests/e2e.test.ts`
- Modify: `CLAUDE.md` (remove limitation if confirmed working)

- [ ] **Step 1: Write a test that exercises the documented limitation**

```ring
// tests/cases/string_interp_fn_call.ring
fn greet(name: Str) -> Str {
    "hello ${name}"
}

fn concat(a: Str, b: Str) -> Str {
    "${a}${b}"
}

fn main() {
    // Direct: string arg inside interpolation
    let r1 = "${greet("world")}"
    assert(r1 == "hello world", "direct call in interp")

    // Multiple string args
    let r2 = "result: ${concat("hello", "world")}"
    assert(r2 == "result: helloworld", "multi-arg call in interp")

    // Nested interpolation with function call
    let x = "inner"
    let r3 = "outer(${greet("${x}")})"
    assert(r3 == "outer(hello inner)", "nested interp in fn call")

    print("string_interp_fn_call: all tests passed")
}
```

- [ ] **Step 2: Register the test in e2e.test.ts**

Add to the positive cases array in `tests/e2e.test.ts`:

```typescript
{ file: "string_interp_fn_call.ring", expected: "string_interp_fn_call: all tests passed\n" },
```

- [ ] **Step 3: Run the test**

```bash
cd compiler && npm test -- --test-name-pattern="string_interp_fn_call"
```

- [ ] **Step 4a: If PASS — update CLAUDE.md**

Remove the "字符串插值不支持嵌套引号" limitation from CLAUDE.md's "已知限制" section. The feature works.

- [ ] **Step 4b: If FAIL — document the exact failure**

Keep the limitation in CLAUDE.md. File a detailed bug report as a comment in the test case explaining what broke. Mark the test as a negative test or skip it.

- [ ] **Step 5: Commit**

```
feat(A4): verify string interpolation nested quotes — [works/documented]
```

---

## Task 2: B1.1 — Change `parse()` signature to accept CollectingSink

Currently `parse()` creates its own internal sink and returns only `Program`. Parse errors either panic (via `error()`) or are collected but then cause a panic at the end of `parse_program()`. We need the caller to see parse diagnostics.

**Files:**
- Modify: `compiler/parser.ring` — `parse()` function (line ~145)
- Modify: `compiler/cli.ring` — single-file path (line ~40)
- Modify: `compiler/checker.ring` — `load_prelude()` (line ~42)
- Modify: `compiler/compiler_mod.ring` — anywhere `parse()` is called

- [ ] **Step 1: Find all callers of `parse()`**

```bash
cd F:\Code\Ring-lang && grep -rn "parse(" compiler/*.ring | grep -v "parse_" | grep "parse("
```

Expected callers: `cli.ring`, `checker.ring` (`load_prelude`), `compiler_mod.ring`.

- [ ] **Step 2: Change `parse()` to accept a sink parameter**

In `compiler/parser.ring`, change the `parse` function (around line 145):

```ring
pub fn parse(source: Str, file: Str, sink: CollectingSink) -> Program {
    var lexer = new_lexer(source, file, sink)
    let tokens = lexer.tokenize()
    var parser = new_parser(tokens, file, sink)
    parser.parse_program()
}
```

- [ ] **Step 3: Update `cli.ring` — single-file path**

Move sink creation before parse, pass it through:

```ring
// Single-file mode: create sink early, share between parse and check
let sink = new_collecting_sink()
let ast = parse(source, file_path, sink)

// If parse had errors, report and exit
if sink.has_errors() {
    let diagnostics = sink.items
    if parsed.error_format == "llm" {
        print(format_llm(diagnostics, file_path))
    } else {
        eprintln(format_human(diagnostics, source))
    }
    exit_process(1)
    return
}

let check_result = check_single(ast, sink)
// ... rest stays the same
```

Note: the existing check error reporting (lines 89-98) stays as-is. The new block above intercepts parse errors before they reach the checker.

- [ ] **Step 4: Update `checker.ring` — `load_prelude`**

`load_prelude` parses standard library files. These should never have errors. Create a local sink:

```ring
fn load_prelude(var ctx: InferCtx) {
    match find_std_dir() {
        some(std_dir) => {
            for file in STD_FILES() {
                let file_path = path_join(std_dir, file)
                if file_exists(file_path) {
                    let source = read_file(file_path)
                    let prelude_sink = new_collecting_sink()
                    let ast = parse(source, file_path, prelude_sink)
                    for decl in ast.decls {
                        register_decl_public(ctx, decl)
                    }
                }
            }
        },
        none => {},
    }
}
```

- [ ] **Step 5: Update `compiler_mod.ring`**

Search for `parse(` calls in `compiler_mod.ring` and update each to pass a local sink. Multi-file compilation has its own error handling — create a local sink for each file parse, check for errors after parse, and integrate them into the compilation result.

- [ ] **Step 6: Verify compilation**

Rebuild the compiler:
```bash
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
```

This step uses the OLD dist/ to compile the new source. If there are compile errors, fix them before proceeding.

- [ ] **Step 7: Commit**

```
refactor(B1): parse() accepts CollectingSink parameter — callers can inspect parse diagnostics
```

---

## Task 3: B1.2 — Replace parser `error()` panic with `fail.raise()`

This is the core change that enables error recovery. `error()` currently calls `panic()` (an unrecoverable JS throw). We change it to `fail.raise()` (a catchable Ring fail effect), keeping the `-> Never` return type with an unreachable `panic()` after the raise.

**Files:**
- Modify: `compiler/parser.ring` — `error()` function (line ~236)

- [ ] **Step 1: Change `error()` to use `fail.raise()` + unreachable panic**

Replace the `error` function (around line 236):

```ring
fn error(var self, msg: Str) -> Never {
    let tok = self.peek()
    self.report_error(E0103(), msg, some(tok.span))
    fail.raise(msg)
    // Unreachable: fail.raise always unwinds to the nearest catch.
    // The panic satisfies the -> Never return type for the type checker.
    panic("unreachable after fail.raise")
}
```

Key property: `fail.raise(msg)` introduces a `fail<Str>` effect that propagates through the call chain. Every function that calls `error()` (directly or transitively via `expect()`) now has `fail<Str>` in its inferred effect signature. The `catch` in `parse_program` (Task 4) will catch this effect.

- [ ] **Step 2: Verify compilation**

```bash
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
```

The compiler should compile without errors. The `fail<Str>` effect propagates automatically through Ring's effect inference — no caller signatures need manual changes.

- [ ] **Step 3: Commit**

```
refactor(B1): parser error() uses fail.raise instead of panic — enables catch-based recovery
```

---

## Task 4: B1.3 — Declaration-level recovery in `parse_program`

Wrap `parse_decl()` with `catch` so that when `error()` raises `fail`, the parser synchronizes to the next declaration boundary and continues parsing.

**Files:**
- Modify: `compiler/parser.ring` — `parse_program()` function (lines ~246-303)

- [ ] **Step 1: Add catch wrapper around parse_decl()**

In `parse_program()`, replace the current dispatch block (around lines 280-289):

```ring
decls_started = true
let maybe_decl: Decl? = self.parse_decl() catch { _ => none }
match maybe_decl {
    some(decl) => decls.push(decl),
    none => {
        while !self.at_end() {
            if is_decl_start(self.peek().kind) { break }
            self.advance()
        }
    }
}
```

How it works:
- `self.parse_decl()` returns `Decl?`. Normally: `some(decl)` or `none`.
- If any parser function inside raises `fail` (via `error()`), the `catch` catches it and returns `none`.
- `none` triggers the sync loop, which skips tokens until the next declaration-start keyword.
- The `report_error` call inside `error()` already recorded the diagnostic — no information is lost.

- [ ] **Step 2: Remove the end-of-function panic**

Remove lines ~291-300 (the `if self.sink.has_errors() { ... panic(...) }` block). Replace with nothing — `parse_program` now returns a partial AST with whatever declarations parsed successfully. The caller checks the sink for errors.

After removal, the end of `parse_program` should be:

```ring
        }  // end of while !self.at_end()
        let end = self.current_span_start()
        Program { uses: uses, decls: decls, span: self.make_span(start, end) }
    }
```

- [ ] **Step 3: Also wrap the `pub use` backtrack path**

The `pub use` handling (lines ~263-278) has a `self.parse_use_decl(true)` call that could also raise fail. Wrap it:

```ring
if self.check(TokenKind::TkPub) {
    let save_pos = self.pos
    let save_errors = self.error_count
    let sink_checkpoint = self.sink.save()
    self.advance()
    if self.check(TokenKind::TkUse) {
        if decls_started {
            self.report_error(E0706(), "Use declaration must appear before other declarations", some(self.tokens.get(save_pos).unwrap_or(self.peek()).span))
        }
        let use_decl = self.parse_use_decl(true) catch { _ =>
            // Recovery: skip to next decl start
            while !self.at_end() {
                if is_decl_start(self.peek().kind) { break }
                self.advance()
            }
            continue
        }
        uses.push(use_decl)
        continue
    }
    self.pos = save_pos
    self.error_count = save_errors
    self.sink.restore(sink_checkpoint)
}
```

Note: `parse_use_decl` returns `UseDecl`, not `Decl?`. The catch handles failures by syncing and continuing the main loop.

- [ ] **Step 4: Wrap the non-pub use path similarly**

```ring
if self.check(TokenKind::TkUse) {
    if decls_started {
        self.report_error(E0706(), "Use declaration must appear before other declarations", some(self.peek().span))
    }
    let use_decl = self.parse_use_decl(false) catch { _ =>
        while !self.at_end() {
            if is_decl_start(self.peek().kind) { break }
            self.advance()
        }
        continue
    }
    uses.push(use_decl)
    continue
}
```

- [ ] **Step 5: Rebuild and verify**

```bash
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
```

- [ ] **Step 6: Commit**

```
feat(B1): parser declaration-level error recovery — catch + sync replaces panic
```

---

## Task 5: B1.4 — Fix failing tests + add multi-error test

With error recovery in place, the parser no longer panics on syntax errors. Tests that expect specific error codes should now pass.

**Files:**
- Modify: `tests/e2e.test.ts` — adjust test expectations if needed
- Create: `tests/cases/error_multi_decl.ring` — multi-error recovery test
- Possibly modify: `tests/cases/error_multi_parse.ring`

- [ ] **Step 1: Run the full test suite and capture results**

```bash
cd compiler && npm test 2>&1
```

Identify which tests changed status (previously failing → now passing, or new failures).

- [ ] **Step 2: Analyze each previously-failing test**

Expected changes:
- `error_multi_parse.ring` (expects E0103): should now PASS — parser reports the error via diagnostics instead of panicking
- `error_unterminated_str.ring` (expects E0102): should now PASS — lexer error token is handled gracefully
- "outputs valid JSON for parse errors": should now PASS — the CLI outputs formatted diagnostics instead of panic stack trace
- `error_operator.ring` (expects E0301): this is a checker error code mismatch, not parser — investigate separately

- [ ] **Step 3: Fix any test expectation mismatches**

If a test expects a specific error code but gets a different one (e.g., E0103 vs E0101), update the test expectation or the error code in the parser to match.

Check: the `--error-format=llm` test expects valid JSON output. With recovery, the CLI should output JSON-formatted diagnostics via `format_llm()`. Verify the test's JSON parsing works.

- [ ] **Step 4: Write a multi-error test case**

Create `tests/cases/error_multi_decl.ring`:

```ring
// Negative test: multiple parse errors in one file
// The parser should report all errors, not just the first

fn broken1( {
    let x = 1
}

fn broken2(x Int) -> {
    x
}

fn valid() -> Int {
    42
}
```

Add to negative_cases in `tests/e2e.test.ts`:

```typescript
{ file: "error_multi_decl.ring", error_pattern: "E0103" },
```

- [ ] **Step 5: Write a test that verifies multi-error reporting**

In `tests/e2e.test.ts`, add a specific test in the `--error-format=llm` section:

```typescript
test("reports multiple parse errors in one file", () => {
    const result = ring_check(path.join(CASES_DIR, "error_multi_decl.ring"));
    assert.strictEqual(result.success, false);
    // Count how many E0103 errors appear
    const errorCount = (result.error_output.match(/E0103/g) || []).length;
    assert.ok(errorCount >= 2, `Expected at least 2 parse errors, got ${errorCount}`);
});
```

Note: the exact test implementation depends on how `ring_check` is defined in the test file. Adapt accordingly — the key assertion is that multiple errors are reported, not just the first.

- [ ] **Step 6: Run full test suite to verify all green**

```bash
cd compiler && npm test
```

Target: 332+ passing (previous passing tests still pass + newly fixed tests).

- [ ] **Step 7: Commit**

```
feat(B1): parser error recovery tests — multi-error reporting verified
```

---

## Task 6: A3.1 — Add `TkConst` keyword to lexer

**Files:**
- Modify: `compiler/lexer.ring` — `TokenKind` enum, `token_kind_value`, `keyword_lookup`

- [ ] **Step 1: Add `TkConst` to TokenKind enum**

In `compiler/lexer.ring`, add `TkConst` to the Keywords section (line ~11):

```ring
pub enum TokenKind {
    // Keywords
    TkFn, TkLet, TkVar, TkConst, TkStruct, TkEnum, TkMatch,
    // ... rest unchanged
```

- [ ] **Step 2: Add to `token_kind_value`**

In the match at line ~47, add:

```ring
TkConst => "const",
```

Place it near `TkLet` and `TkVar` for logical grouping.

- [ ] **Step 3: Add to `keyword_lookup`**

In the match at line ~78, add:

```ring
"const" => some(TokenKind::TkConst),
```

- [ ] **Step 4: Add `TkConst` to `is_decl_start` in parser.ring**

In `compiler/parser.ring`, find `is_decl_start` (around line 87) and add `TkConst`:

```ring
fn is_decl_start(k: TokenKind) -> Bool {
    match k {
        TkFn => true, TkStruct => true, TkEnum => true,
        TkEffect => true, TkTrait => true, TkImpl => true,
        TkExtern => true, TkUse => true, TkPub => true, TkTest => true,
        TkConst => true,
        _ => false
    }
}
```

- [ ] **Step 5: Rebuild and verify**

```bash
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
```

- [ ] **Step 6: Commit**

```
feat(A3): add TkConst keyword to lexer — reserved for const declarations
```

---

## Task 7: A3.2 — Add `Decl::Const` to AST + parser

**Files:**
- Modify: `compiler/ast.ring` — Decl enum
- Modify: `compiler/parser.ring` — `parse_decl`, new `parse_const_decl`

- [ ] **Step 1: Add `Const` variant to Decl enum**

In `compiler/ast.ring` (line ~258), add before the closing `}`:

```ring
    Const { name: Str, type_annotation: TypeExpr?, init: Expr, is_pub: Bool, span: Span }
```

- [ ] **Step 2: Add `parse_const_decl` to parser**

In `compiler/parser.ring`, add a new function (near `parse_fn_decl`):

```ring
fn parse_const_decl(var self, is_pub: Bool) -> Decl {
    let start = self.current_span_start()
    self.expect(TokenKind::TkConst)
    let name = self.expect(TokenKind::TkIdent).value
    var type_annotation: TypeExpr? = none
    if self.try_consume(TokenKind::TkColon) {
        type_annotation = some(self.parse_type_expr())
    }
    self.expect(TokenKind::TkEq)
    let init = self.parse_expr()
    let end = self.current_span_start()
    Decl::Const { name: name, type_annotation: type_annotation, init: init, is_pub: is_pub, span: self.make_span(start, end) }
}
```

Syntax: `const NAME = expr` or `const NAME: Type = expr` or `pub const NAME = expr`.

- [ ] **Step 3: Wire `TkConst` into `parse_decl`**

In `parse_decl` (around line 600), add a new match arm:

```ring
TkConst => some(self.parse_const_decl(is_pub)),
```

- [ ] **Step 4: Handle `Decl::Const` in all match sites that need it**

Every exhaustive `match decl` on the AST `Decl` enum needs a new arm. Based on the codebase search:

**`compiler/infer_register.ring:591` — `register_decl`:**
```ring
Decl::Const { .. } => {}
```
Const doesn't register type-level definitions (it's a value, not a type/struct/enum). Registration is a no-op. The type inference happens in `check_decl`.

**`compiler/exports.ring:49` — `extract_exports`:**
```ring
Decl::Const { name, is_pub, .. } => {
    if is_pub {
        match env.lookup(name) {
            some(scheme) => { values.insert(name, scheme) },
            none => {},
        }
    }
},
```
Public consts are exported as values, same as functions.

Note: Match sites with `_ => {}` catch-all arms (like `infer_register.ring:20`, `:34`, `:42`, and `compiler_mod.ring:281`, `:310`, `:326`) already handle unknown variants — no changes needed there.

- [ ] **Step 5: Rebuild and verify**

```bash
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
```

If the compiler reports "non-exhaustive match" errors at any other `match decl` site, add the appropriate arm.

- [ ] **Step 6: Commit**

```
feat(A3): add Decl::Const to AST + parser — const NAME [: Type] = expr
```

---

## Task 8: A3.3 — HIR + type inference for const

**Files:**
- Modify: `compiler/hir.ring` — `HDecl` enum
- Modify: `compiler/infer.ring` — `check_decl` function
- Modify: `compiler/infer_register.ring` — `register_phase1` (register const name in env)

- [ ] **Step 1: Add `HDecl::Const` to HIR**

In `compiler/hir.ring` (line ~148), add before the closing `}`:

```ring
    Const { name: Str, def_id: Int?, ty: Type, init: HExpr, is_pub: Bool, span: Span }
```

- [ ] **Step 2: Register const in Phase 1 (infer_register.ring)**

Const values need their name registered before type checking (so other declarations in the same file can reference them). Add to `register_decl` (around line 590):

```ring
Decl::Const { name, type_annotation, init, span, .. } => {
    register_const(ctx, name, type_annotation, span)
},
```

Add the new function:

```ring
fn register_const(var ctx: InferCtx, name: Str, type_annotation: TypeExpr?, span: Span) {
    match type_annotation {
        some(texpr) => {
            let ty = resolve_type_expr(ctx, texpr)
            let scheme = TypeScheme { type_params: [], bounds: [], ty: ty }
            ctx.env.bind(name, scheme, span)
        },
        none => {
            let tv = ctx.fresh_type_var()
            let scheme = TypeScheme { type_params: [], bounds: [], ty: tv }
            ctx.env.bind(name, scheme, span)
        }
    }
}
```

Note: `resolve_type_expr` and `fresh_type_var` may need to be imported or available from the InferCtx. Check the existing `register_fn` function for the pattern.

- [ ] **Step 3: Add check_const_decl in infer.ring**

In `compiler/infer.ring`, add to `check_decl` match (around line 2176):

```ring
Decl::Const { name, type_annotation, init, is_pub, span } =>
    check_const_decl(ctx, name, type_annotation, init, is_pub, span),
```

And implement:

```ring
fn check_const_decl(var ctx: InferCtx, name: Str, type_annotation: TypeExpr?, init: Expr, is_pub: Bool, span: Span) -> HDecl {
    var expected_ty: Type? = none
    match type_annotation {
        some(texpr) => {
            expected_ty = some(resolve_type_expr(ctx, texpr))
        },
        none => {}
    }

    let hinit = infer_expr(ctx, init, expected_ty)
    let init_ty = hexpr_type(hinit)

    match expected_ty {
        some(ann_ty) => {
            unify(ctx, ann_ty, init_ty, span)
        },
        none => {}
    }

    let final_ty = apply_subst(ctx.subst, init_ty)
    let gen_scheme = generalize(ctx.env, final_ty, [])
    let did = ctx.env.rebind(name, gen_scheme, span)

    HDecl::Const { name: name, def_id: some(did), ty: final_ty, init: hinit, is_pub: is_pub, span: span }
}
```

Note: Adapt this to use the exact APIs available in InferCtx. Study `check_fn_decl` or the let-binding inference in `infer_stmt` for the correct generalization pattern. The key point: const uses `generalize` (polymorphic, like `let`) not `bind_mono` (monomorphic, like `var`).

- [ ] **Step 4: Handle HDecl::Const in codegen match sites**

In `compiler/codegen.ring`, the match sites at lines ~74, ~100, ~148 all have `_ => {}` catch-all arms — they already handle unknown variants. No changes needed.

In `compiler/codegen_decl.ring:16` (`emit_decl`), this is an exhaustive match — add an arm (placeholder, real impl in Task 9):

```ring
HDecl::Const { name, init, .. } =>
    emit_const_decl(ctx, name, init),
```

- [ ] **Step 5: Rebuild and verify**

```bash
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
```

- [ ] **Step 6: Commit**

```
feat(A3): const type inference + HIR — generalized binding like let
```

---

## Task 9: A3.4 — Codegen for const

**Files:**
- Modify: `compiler/codegen_decl.ring` — `emit_const_decl` function

- [ ] **Step 1: Implement `emit_const_decl`**

In `compiler/codegen_decl.ring`, add:

```ring
fn emit_const_decl(var ctx: CodegenCtx, name: Str, init: HExpr) {
    let sn = qualify(ctx, name)
    emit(ctx, "const ${sn} = ")
    emit_expr(ctx, init)
    emit_raw(ctx, ";\n")
}
```

Note: `emit_expr` is defined in `codegen_expr.ring`. Import it if not already imported. Check how `emit_fn_decl` uses `emit_expr` for the body expression.

`qualify()` handles module-prefix qualification. For single-file compilation, it returns the plain name. For multi-file ESM, it adds the module prefix.

- [ ] **Step 2: Handle `pub const` in multi-file exports**

In `compiler/compiler_mod.ring`, the export-names passes (lines ~310, ~326) have `_ => {}` catch-all arms. To export `pub const` names, add an arm in the Pass 1 block:

```ring
Decl::Const { name, is_pub, .. } => { if is_pub { export_names.push(safe_ident(name)) } },
```

- [ ] **Step 3: Rebuild and verify**

```bash
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
```

- [ ] **Step 4: Commit**

```
feat(A3): const codegen — emits JS const at module scope
```

---

## Task 10: A3.5 — Tests for const

**Files:**
- Create: `tests/cases/const_basic.ring`
- Create: `tests/cases/error_const_assign.ring`
- Modify: `tests/e2e.test.ts`

- [ ] **Step 1: Write positive test**

```ring
// tests/cases/const_basic.ring
const PI: Float = 3.14159
const GREETING = "hello"
const NUMS: List<Int> = [1, 2, 3]

fn use_const() -> Str {
    "${GREETING} ${PI.to_str()}"
}

fn main() {
    assert(PI > 3.0, "PI value")
    assert(GREETING == "hello", "GREETING value")
    assert(NUMS.len() == 3, "NUMS length")
    assert(use_const() == "hello 3.14159", "const in function")
    print("const_basic: all tests passed")
}
```

- [ ] **Step 2: Write negative test — assignment to const**

```ring
// tests/cases/error_const_assign.ring
const X = 42

fn main() {
    X = 99
}
```

Expected: `E0205` (assignment to immutable) or similar error. Check what error code `let` assignment produces and use the same.

- [ ] **Step 3: Register tests in e2e.test.ts**

Positive:
```typescript
{ file: "const_basic.ring", expected: "const_basic: all tests passed\n" },
```

Negative:
```typescript
{ file: "error_const_assign.ring", error_pattern: "E0205" },
```

- [ ] **Step 4: Run tests**

```bash
cd compiler && npm test -- --test-name-pattern="const_basic|error_const_assign"
```

- [ ] **Step 5: Commit**

```
test(A3): const declaration positive + negative tests
```

---

## Task 11: A3.6 — Migrate compiler constants (batched)

Convert zero-argument constant functions to `const` declarations. Do this in batches, rebuilding between each to catch issues early.

**Files:**
- Modify: `compiler/types.ring` — BUILTIN_*, INT, FLOAT, etc.
- Modify: `compiler/parser.ring` — PREC_* constants
- Modify: `compiler/hir.ring` — ENUM_TAG_FIELD, OPTION_*_TAG, etc.
- Modify: `compiler/builtin_methods.ring` — *_METHODS constants
- Modify: `compiler/codegen_ctx.ring` — JS_RESERVED
- Modify: all files that call these functions — remove `()`

- [ ] **Step 1: Batch 1 — Small constants in hir.ring**

Convert helper functions to const. Example pattern:

Before:
```ring
pub fn ENUM_TAG_FIELD() -> Str { "$tag" }
```

After:
```ring
pub const ENUM_TAG_FIELD: Str = "$tag"
```

Update all call sites: `ENUM_TAG_FIELD()` → `ENUM_TAG_FIELD`.

Rebuild and test:
```bash
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
cd compiler && npm test
```

- [ ] **Step 2: Batch 2 — PREC_* in parser.ring**

Convert all precedence constants:

Before:
```ring
fn PREC_NONE() -> Int { 0 }
fn PREC_ASSIGN() -> Int { 1 }
// ...
```

After:
```ring
const PREC_NONE: Int = 0
const PREC_ASSIGN: Int = 1
// ...
```

Update all call sites within parser.ring. Rebuild and test.

- [ ] **Step 3: Batch 3 — BUILTIN_* and type helpers in types.ring**

Convert BUILTIN_INT, BUILTIN_FLOAT, ..., BUILTIN_CELL, and INT(), FLOAT(), ..., EMPTY_ROW().

Before:
```ring
pub fn BUILTIN_INT() -> Str { "Int" }
pub fn INT() -> Type { Type::Named { name: "Int", args: [] } }
```

After:
```ring
pub const BUILTIN_INT: Str = "Int"
pub const INT: Type = Type::Named { name: "Int", args: [] }
```

This batch has the most call sites (~200+). Use search-and-replace: `BUILTIN_INT()` → `BUILTIN_INT`, `INT()` → `INT`, etc.

**Critical:** Some of these constants create struct literals (e.g., `Type::Named { ... }`). The `const` init expression must be evaluated at module load time. Since Ring compiles to JS, this means the struct literal is created once when the module loads — exactly what we want.

Rebuild and test after this batch.

- [ ] **Step 4: Batch 4 — *_METHODS in builtin_methods.ring**

Convert CELL_METHODS, STR_METHODS, etc. These return `List<Str>` or `Set<Str>`:

Before:
```ring
pub fn CELL_METHODS() -> List<Str> { ["get", "set"] }
```

After:
```ring
pub const CELL_METHODS: List<Str> = ["get", "set"]
```

Rebuild and test.

- [ ] **Step 5: Batch 5 — JS_RESERVED in codegen_ctx.ring**

This one builds a `Set<Str>` from a list:

Before:
```ring
fn JS_RESERVED() -> Set<Str> {
    set_from(["break", "case", ...])
}
```

After:
```ring
const JS_RESERVED: Set<Str> = set_from(["break", "case", ...])
```

Rebuild and test.

- [ ] **Step 6: Batch 6 — RUNTIME_CODE and RUNTIME_EXPORT_NAMES in runtime.ring**

Convert if feasible. These return large strings/lists. Same pattern.

Rebuild and full test suite:
```bash
cd compiler && npm test
```

- [ ] **Step 7: Commit (one commit per batch, or one combined)**

```
refactor(A3): migrate constant functions to const declarations — ~300 call sites
```

---

## Task 12: Bootstrap verification + documentation

**Files:**
- Modify: `CLAUDE.md` — update test counts, remove resolved limitations
- Modify: `docs/design.md` — update if needed
- Delete: completed plan/spec files if any

- [ ] **Step 1: Full bootstrap cycle**

Rebuild the compiler from the modified .ring sources:

```bash
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
```

Then rebuild AGAIN using the newly built compiler (double bootstrap):

```bash
node compiler/dist/main.js build compiler/main.ring --out-dir=compiler/dist
```

Both builds should succeed with identical output.

- [ ] **Step 2: Full test suite**

```bash
cd compiler && npm test
```

All previously-passing tests must still pass. New tests must pass. Note the final pass/total count.

- [ ] **Step 3: Update CLAUDE.md**

Update these sections:
- **Test counts** — update `332/337` to the new count
- **已知限制 → 基础设施限制** — change "Ring parser 无错误恢复" to describe the new declaration-level recovery
- **已知限制 → 语法与表达式限制** — remove "字符串插值不支持嵌套引号" if Task 1 confirmed it works
- **已实现功能** — add `const` declarations
- **常用命令** — no changes needed

- [ ] **Step 4: Update docs/design.md implementation status appendix**

Add `const` to the list of implemented features. Update parser error recovery status.

- [ ] **Step 5: Clean up spec files**

Delete `docs/syntax-revision-2026-05-21.md` and `docs/superpowers/plans/2026-05-21-syntax-revision.md` if they describe fully-completed work.

- [ ] **Step 6: Final commit**

```
docs: update for Iteration 2 completion — parser recovery, const, test counts
```
