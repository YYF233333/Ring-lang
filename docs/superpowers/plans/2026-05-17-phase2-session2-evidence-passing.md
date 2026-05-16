# Phase 2 Session 2: Evidence Passing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace generator-based effect codegen with evidence passing — each effect becomes a dictionary parameter.

**Architecture:** Effect operations compile to method calls on evidence parameters (`__ev_{effect}.{op}(args)`). Handlers construct evidence objects. Abort-semantic operations (fail.raise) use `__EffectAbort` + try/catch to unwind.

**Tech Stack:** TypeScript (compiler), Node.js test runner, zero external dependencies.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `compiler/src/hir/index.ts` | Modify | Add `evidence_param_name()` shared convention |
| `compiler/src/codegen/runtime.ts` | Modify | Replace `__run_handler` with `__EffectAbort` class |
| `compiler/src/codegen/codegen.ts` | Modify | Rewrite effect codegen (evidence params, gen_handle, gen_effect_op, call sites) |
| `compiler/src/codegen/codegen.test.ts` | Modify | Update/add unit tests for evidence codegen |
| `tests/cases/effect_evidence.ring` | Create | Basic evidence passing e2e test |
| `tests/cases/effect_multi_handler.ring` | Create | Multi-effect handler test |
| `tests/cases/effect_propagate.ring` | Create | Cross-function evidence forwarding test |
| `tests/e2e.test.ts` | Modify | Register new tests, skip `effect_resume.ring` |

---

### Task 1: Add `evidence_param_name` to HIR conventions

**Files:**
- Modify: `compiler/src/hir/index.ts:336-344`

- [ ] **Step 1: Write the failing test**

In `compiler/src/codegen/codegen.test.ts`, add at the top-level `describe` block:

```typescript
describe("evidence_param_name", () => {
  it("generates __ev_ prefixed name", () => {
    const { evidence_param_name } = await import("../hir/index.js");
    assert.strictEqual(evidence_param_name("io"), "__ev_io");
    assert.strictEqual(evidence_param_name("fail"), "__ev_fail");
    assert.strictEqual(evidence_param_name("custom_eff"), "__ev_custom_eff");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd compiler && npm test`
Expected: FAIL — `evidence_param_name` is not exported from `hir/index.js`

- [ ] **Step 3: Implement `evidence_param_name`**

Add to `compiler/src/hir/index.ts` after the `trait_dict_name` function (line ~343):

```typescript
// JS codegen naming convention for effect evidence parameters
export function evidence_param_name(effect_name: string): string {
  return `__ev_${effect_name}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd compiler && npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add compiler/src/hir/index.ts compiler/src/codegen/codegen.test.ts
git commit -m "feat(hir): add evidence_param_name convention"
```

---

### Task 2: Replace runtime `__run_handler` with `__EffectAbort`

**Files:**
- Modify: `compiler/src/codegen/runtime.ts`

- [ ] **Step 1: Write the failing test**

In `compiler/src/codegen/codegen.test.ts`, add:

```typescript
describe("runtime", () => {
  it("includes __EffectAbort class", () => {
    const { RUNTIME_CODE } = await import("./runtime.js");
    assert.ok(RUNTIME_CODE.includes("class __EffectAbort"));
    assert.ok(RUNTIME_CODE.includes("this.effect = effect"));
    assert.ok(RUNTIME_CODE.includes("this.value = value"));
  });

  it("does not include __run_handler", () => {
    const { RUNTIME_CODE } = await import("./runtime.js");
    assert.ok(!RUNTIME_CODE.includes("__run_handler"));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd compiler && npm test`
Expected: FAIL — `RUNTIME_CODE` still contains `__run_handler` and not `__EffectAbort`

- [ ] **Step 3: Replace runtime code**

Replace the full content of `compiler/src/codegen/runtime.ts`:

```typescript
// Ring-lang runtime helpers — emitted as preamble in generated JS.

export const RUNTIME_CODE = `// === Ring-lang Runtime ===
class __EffectAbort {
  constructor(effect, value) {
    this.effect = effect;
    this.value = value;
  }
}

function __match_fail(value) {
  throw new Error("Non-exhaustive match: " + JSON.stringify(value));
}

function print(...args) {
  console.log(...args);
}

function assert(cond, msg) {
  if (!cond) {
    throw new Error("Assertion failed" + (msg ? ": " + msg : ""));
  }
}

function panic(msg) {
  throw new Error("panic: " + msg);
}

function exit(code) {
  process.exit(code);
}

`;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd compiler && npm test`
Expected: runtime tests PASS (other tests may break — that's expected, we fix them in subsequent tasks)

- [ ] **Step 5: Commit**

```bash
git add compiler/src/codegen/runtime.ts compiler/src/codegen/codegen.test.ts
git commit -m "feat(runtime): replace __run_handler with __EffectAbort"
```

---

### Task 3: Rewrite `gen_effect_op` — effect operations become evidence calls

**Files:**
- Modify: `compiler/src/codegen/codegen.ts:604-607`

- [ ] **Step 1: Write the failing test**

In `compiler/src/codegen/codegen.test.ts`, add:

```typescript
import { effect_row, Effect } from "../types/index.js";

describe("effect_op codegen", () => {
  it("generates evidence method call for io.read", () => {
    const io_effect: Effect = { kind: "io" };
    const decl: HFnDecl = {
      kind: "fn_decl",
      name: "f",
      type_params: [],
      params: [],
      return_type: STR,
      effects: effect_row(io_effect),
      body: block([], {
        kind: "effect_op",
        effect_name: "io",
        op_name: "read",
        args: [str_lit("file.txt")],
        type: STR,
        effects: effect_row(io_effect),
        span: S,
      }),
      is_pub: false,
      trait_bounds: [],
      span: S,
    };
    const js = generate(program([decl]));
    assert.ok(js.includes("__ev_io.read("));
    assert.ok(js.includes('"file.txt"'));
    assert.ok(!js.includes("yield"));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd compiler && npm test`
Expected: FAIL — currently generates `yield { effect: "io"...`

- [ ] **Step 3: Rewrite `gen_effect_op`**

In `compiler/src/codegen/codegen.ts`, replace the `gen_effect_op` method:

```typescript
private gen_effect_op(expr: HExpr & { kind: "effect_op" }): string {
  const ev_name = evidence_param_name(expr.effect_name);
  const args = expr.args.map(a => this.gen_expr(a)).join(", ");
  return `${ev_name}.${expr.op_name}(${args})`;
}
```

Add the import at the top of the file:

```typescript
import {
  HProgram, HDecl, HFnDecl, HStructDecl, HEnumDecl, HImplDecl,
  HEffectDecl, HTestDecl, HTraitDecl, HStmt, HExpr, HBlock, HMatchArm,
  variant_js_name, trait_dict_name, evidence_param_name,
} from "../hir/index.js";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd compiler && npm test`
Expected: new test PASSES

- [ ] **Step 5: Commit**

```bash
git add compiler/src/codegen/codegen.ts compiler/src/codegen/codegen.test.ts
git commit -m "feat(codegen): gen_effect_op emits evidence method calls"
```

---

### Task 4: Add evidence parameters to function signatures

**Files:**
- Modify: `compiler/src/codegen/codegen.ts:119-130`

- [ ] **Step 1: Write the failing test**

In `compiler/src/codegen/codegen.test.ts`:

```typescript
describe("evidence params in function signatures", () => {
  it("adds __ev_ params for functions with effects", () => {
    const io_effect: Effect = { kind: "io" };
    const fail_effect: Effect = { kind: "fail", error_type: STR };
    const decl: HFnDecl = {
      kind: "fn_decl",
      name: "load",
      type_params: [],
      params: [{ name: "path", type: STR }],
      return_type: STR,
      effects: effect_row(io_effect, fail_effect),
      body: block([], str_lit("data")),
      is_pub: false,
      trait_bounds: [],
      span: S,
    };
    const js = generate(program([decl]));
    assert.ok(js.includes("function load(path, __ev_fail, __ev_io)"));
  });

  it("does not add evidence params for pure functions", () => {
    const decl: HFnDecl = {
      kind: "fn_decl",
      name: "pure",
      type_params: [],
      params: [{ name: "x", type: INT }],
      return_type: INT,
      effects: EMPTY_ROW,
      body: block([], ident("x")),
      is_pub: false,
      trait_bounds: [],
      span: S,
    };
    const js = generate(program([decl]));
    assert.ok(js.includes("function pure(x)"));
    assert.ok(!js.includes("__ev_"));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd compiler && npm test`
Expected: FAIL — no `__ev_` params in function signature

- [ ] **Step 3: Implement evidence parameter injection in `emit_fn_decl`**

In `compiler/src/codegen/codegen.ts`, replace `emit_fn_decl`:

```typescript
private emit_fn_decl(decl: HFnDecl, prefix?: string): void {
  const name = prefix ? `${prefix}_${safe_ident(decl.name)}` : safe_ident(decl.name);
  const param_names = decl.params.map(p => safe_ident(p.name));
  const dict_params = (decl.trait_bounds ?? []).map(b => `__${b.type_param}_${b.trait_name}`);
  const ev_params = this.get_evidence_params(decl.effects);
  const all_params = [...param_names, ...dict_params, ...ev_params].join(", ");
  this.emit(`function ${name}(${all_params}) {`);
  this.push_indent();
  this.emit_block_body(decl.body);
  this.pop_indent();
  this.emit("}");
}
```

Add the helper method to `CodeGenerator`:

```typescript
private get_evidence_params(effects: { effects: { kind: string; name?: string }[] }): string[] {
  const effect_names: string[] = [];
  for (const e of effects.effects) {
    let name: string;
    if (e.kind === "io") name = "io";
    else if (e.kind === "fail") name = "fail";
    else if (e.kind === "mut") name = "mut";
    else name = (e as any).name ?? "unknown";
    if (!effect_names.includes(name)) {
      effect_names.push(name);
    }
  }
  effect_names.sort();
  return effect_names.map(n => evidence_param_name(n));
}
```

Also remove `has_non_fail_effects` and `needs_yield_star` methods — they are no longer needed. Remove the `function*` generator star logic. Remove `gen_generator_body` method.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd compiler && npm test`
Expected: new tests PASS

- [ ] **Step 5: Commit**

```bash
git add compiler/src/codegen/codegen.ts compiler/src/codegen/codegen.test.ts
git commit -m "feat(codegen): inject evidence params into function signatures"
```

---

### Task 5: Rewrite `gen_handle` — evidence construction + try/catch

**Files:**
- Modify: `compiler/src/codegen/codegen.ts:560-582`

- [ ] **Step 1: Write the failing test**

In `compiler/src/codegen/codegen.test.ts`:

```typescript
describe("handle_expr codegen", () => {
  it("generates evidence object + try/catch for fail handler", () => {
    const fail_effect: Effect = { kind: "fail", error_type: STR };
    const handle_expr: HExpr = {
      kind: "handle_expr",
      body: {
        kind: "effect_op",
        effect_name: "fail",
        op_name: "raise",
        args: [str_lit("err")],
        type: INT,
        effects: effect_row(fail_effect),
        span: S,
      },
      handlers: [{
        effect_name: "fail",
        op_name: "raise",
        params: [{ name: "e", type: STR }],
        body: int_lit(42),
      }],
      type: INT,
      effects: EMPTY_ROW,
      span: S,
    };
    const decl: HFnDecl = {
      kind: "fn_decl",
      name: "f",
      type_params: [],
      params: [],
      return_type: INT,
      effects: EMPTY_ROW,
      body: block([], handle_expr),
      is_pub: false,
      trait_bounds: [],
      span: S,
    };
    const js = generate(program([decl]));
    assert.ok(js.includes("__ev_fail"));
    assert.ok(js.includes("__EffectAbort"));
    assert.ok(js.includes("try"));
    assert.ok(js.includes("catch"));
    assert.ok(!js.includes("__run_handler"));
    assert.ok(!js.includes("yield"));
  });

  it("generates evidence object for io handler (no try/catch needed if no abort)", () => {
    const io_effect: Effect = { kind: "io" };
    const handle_expr: HExpr = {
      kind: "handle_expr",
      body: {
        kind: "effect_op",
        effect_name: "io",
        op_name: "read",
        args: [str_lit("file.txt")],
        type: STR,
        effects: effect_row(io_effect),
        span: S,
      },
      handlers: [{
        effect_name: "io",
        op_name: "read",
        params: [{ name: "path", type: STR }],
        body: str_lit("mock-data"),
      }],
      type: STR,
      effects: EMPTY_ROW,
      span: S,
    };
    const decl: HFnDecl = {
      kind: "fn_decl",
      name: "f",
      type_params: [],
      params: [],
      return_type: STR,
      effects: EMPTY_ROW,
      body: block([], handle_expr),
      is_pub: false,
      trait_bounds: [],
      span: S,
    };
    const js = generate(program([decl]));
    assert.ok(js.includes("__ev_io"));
    assert.ok(js.includes("read"));
    assert.ok(js.includes('"mock-data"'));
    assert.ok(!js.includes("__run_handler"));
    assert.ok(!js.includes("function*"));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd compiler && npm test`
Expected: FAIL

- [ ] **Step 3: Rewrite `gen_handle`**

Replace the `gen_handle` method in `compiler/src/codegen/codegen.ts`:

```typescript
private gen_handle(expr: HExpr & { kind: "handle_expr" }): string {
  // Group handlers by effect name
  const by_effect = new Map<string, typeof expr.handlers>();
  for (const h of expr.handlers) {
    const existing = by_effect.get(h.effect_name) ?? [];
    existing.push(h);
    by_effect.set(h.effect_name, existing);
  }

  // Build evidence objects for each handled effect
  const ev_decls: string[] = [];
  let has_abort = false;

  for (const [effect_name, handlers] of by_effect) {
    const entries: string[] = [];
    for (const h of handlers) {
      const params = h.params.map(p => safe_ident(p.name)).join(", ");
      const body = this.gen_expr(h.body);
      // Check if this is an abort operation (fail.raise returns Never)
      const is_abort = effect_name === "fail" && h.op_name === "raise";
      if (is_abort) {
        has_abort = true;
        entries.push(`${h.op_name}: (${params}) => { throw new __EffectAbort("${effect_name}", ${body}); }`);
      } else {
        entries.push(`${h.op_name}: (${params}) => ${body}`);
      }
    }
    const ev_name = evidence_param_name(effect_name);
    ev_decls.push(`const ${ev_name} = { ${entries.join(", ")} };`);
  }

  // Generate the body as an IIFE that receives evidence params
  const ev_param_names = [...by_effect.keys()].sort().map(n => evidence_param_name(n));
  const ev_arg_names = ev_param_names.join(", ");
  const body = this.gen_expr(expr.body);

  // Helper for block bodies:
  // private gen_handle_body_block(block: HBlock, ev_params: string): string {
  //   const parts: string[] = [];
  //   parts.push(`(function(${ev_params}) {`);
  //   for (const stmt of block.stmts) parts.push("  " + this.gen_stmt_inline(stmt));
  //   if (block.tail) parts.push(`  return ${this.gen_expr(block.tail)};`);
  //   parts.push(`})(${ev_params})`);
  //   return parts.join("\n");
  // }

  const decls = ev_decls.join(" ");
  // Generate body — for block bodies, emit statements inline
  const body_code = expr.body.kind === "block"
    ? this.gen_handle_body_block(expr.body as HBlock, ev_arg_names)
    : `(function(${ev_arg_names}) { return ${body}; })(${ev_arg_names})`;

  if (has_abort) {
    return `(function() { ${decls} try { return ${body_code}; } catch (__e) { if (__e instanceof __EffectAbort) return __e.value; throw __e; } })()`;
  } else {
    return `(function() { ${decls} return ${body_code}; })()`;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd compiler && npm test`
Expected: new tests PASS

- [ ] **Step 5: Commit**

```bash
git add compiler/src/codegen/codegen.ts compiler/src/codegen/codegen.test.ts
git commit -m "feat(codegen): rewrite gen_handle with evidence objects"
```

---

### Task 6: Evidence forwarding at call sites

**Files:**
- Modify: `compiler/src/codegen/codegen.ts` (gen_call method)

- [ ] **Step 1: Write the failing test**

In `compiler/src/codegen/codegen.test.ts`:

```typescript
import { FnType } from "../types/index.js";

describe("evidence forwarding at call sites", () => {
  it("forwards evidence when calling a function with effects", () => {
    const io_effect: Effect = { kind: "io" };
    const callee_type: FnType = {
      kind: "fn",
      params: [STR],
      return_type: STR,
      effects: effect_row(io_effect),
    };
    // fn main() with {io} { helper("x") }  where helper has io effect
    const decl: HFnDecl = {
      kind: "fn_decl",
      name: "main_test",
      type_params: [],
      params: [],
      return_type: STR,
      effects: effect_row(io_effect),
      body: block([], {
        kind: "call",
        callee: { kind: "ident", name: "helper", type: callee_type, effects: EMPTY_ROW, span: S },
        args: [str_lit("x")],
        type_args: [],
        resolved_dicts: [],
        type: STR,
        effects: effect_row(io_effect),
        span: S,
      }),
      is_pub: false,
      trait_bounds: [],
      span: S,
    };
    const js = generate(program([decl]));
    // Calling helper should forward __ev_io
    assert.ok(js.includes('helper("x", __ev_io)'));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd compiler && npm test`
Expected: FAIL — call site doesn't append evidence args

- [ ] **Step 3: Implement evidence forwarding in `gen_call`**

In `compiler/src/codegen/codegen.ts`, modify `gen_call`. After computing `all_args` (with dict args), also compute and append evidence args based on the callee's type:

```typescript
private gen_call(expr: HExpr & { kind: "call" }): string {
  // Trait method dispatch via dictionary (unchanged)
  if (expr.dict_dispatch) {
    const { dict_param, method: meth } = expr.dict_dispatch;
    const receiver_arg = expr.callee.kind === "field_access" ? this.gen_expr(expr.callee.receiver) : this.gen_expr(expr.args[0]);
    const other_args = expr.args.map(a => this.gen_expr(a));
    const all = [receiver_arg, ...other_args].join(", ");
    return `${dict_param}.${safe_ident(meth)}(${all})`;
  }

  // Detect UFCS method call
  if (expr.callee.kind === "field_access") {
    const recv_type = expr.callee.receiver.type;
    const method = expr.callee.field;
    const type_name = recv_type.kind === "struct" ? recv_type.name
      : recv_type.kind === "enum" ? recv_type.name
      : null;
    const impl_key = type_name ? `${type_name}.${method}` : null;
    if (type_name && impl_key && this.impl_methods.has(impl_key)) {
      const trait_name = this.impl_methods.get(impl_key);
      const fn_name = trait_name
        ? `${safe_ident(type_name)}_${safe_ident(trait_name)}_${safe_ident(method)}`
        : `${safe_ident(type_name)}_${safe_ident(method)}`;
      const receiver = this.gen_expr(expr.callee.receiver);
      const args = expr.args.map(a => this.gen_expr(a)).join(", ");
      const all_args = args ? `${receiver}, ${args}` : receiver;
      return `${fn_name}(${all_args})`;
    }
  }

  // Standard call with dict args + evidence forwarding
  const callee = this.gen_expr(expr.callee);
  const args = expr.args.map(a => this.gen_expr(a)).join(", ");
  const dict_args = (expr.resolved_dicts ?? []).join(", ");
  const ev_args = this.get_callee_evidence_args(expr.callee.type);
  const all_parts = [args, dict_args, ev_args].filter(s => s.length > 0);
  const all_args = all_parts.join(", ");
  return `${callee}(${all_args})`;
}

private get_callee_evidence_args(callee_type: import("../types/index.js").Type): string {
  if (callee_type.kind !== "fn") return "";
  const effects = callee_type.effects;
  if (!effects || effects.effects.length === 0) return "";
  return this.get_evidence_params(effects).join(", ");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd compiler && npm test`
Expected: new test PASSES

- [ ] **Step 5: Commit**

```bash
git add compiler/src/codegen/codegen.ts compiler/src/codegen/codegen.test.ts
git commit -m "feat(codegen): forward evidence args at call sites"
```

---

### Task 7: Remove generator logic & fix block expressions

**Files:**
- Modify: `compiler/src/codegen/codegen.ts`

- [ ] **Step 1: Remove dead generator code**

Remove these methods/logic from `codegen.ts`:
- `has_non_fail_effects` method
- `needs_yield_star` method  
- `gen_generator_body` method
- Generator star (`*`) in `emit_fn_decl` (already done in Task 4)
- `yield*` prefix in `gen_call` and UFCS call (already done in Task 6)
- Generator IIFE in `gen_block_expr` — replace with plain IIFE:

```typescript
private gen_block_expr(block: HBlock): string {
  if (block.stmts.length === 0 && block.tail) {
    return this.gen_expr(block.tail);
  }
  const parts: string[] = [];
  parts.push("(function() {");
  for (const stmt of block.stmts) {
    parts.push("  " + this.gen_stmt_inline(stmt));
  }
  if (block.tail) {
    parts.push(`  return ${this.gen_expr(block.tail)};`);
  }
  parts.push("})()");
  return parts.join("\n");
}
```

- [ ] **Step 2: Run all tests**

Run: `cd compiler && npm test`
Expected: Unit tests pass. Some e2e tests may still fail (will fix in Task 8).

- [ ] **Step 3: Commit**

```bash
git add compiler/src/codegen/codegen.ts
git commit -m "refactor(codegen): remove generator-based effect machinery"
```

---

### Task 8: Fix `gen_try_catch` for `or`/`catch` with evidence passing

**Files:**
- Modify: `compiler/src/codegen/codegen.ts`

The `or` and `catch` expressions compile to `HTryCatch` in HIR. Under evidence passing, the body of `or`/`catch` may call functions that have `fail` effect. We need to provide a `__ev_fail` that throws `__EffectAbort`, then catch it.

- [ ] **Step 1: Write the failing test**

```typescript
describe("try_catch (or/catch) with evidence", () => {
  it("generates __ev_fail evidence for or expression", () => {
    const fail_effect: Effect = { kind: "fail", error_type: STR };
    const callee_type: FnType = {
      kind: "fn",
      params: [],
      return_type: INT,
      effects: effect_row(fail_effect),
    };
    const try_catch_expr: HExpr = {
      kind: "try_catch",
      body: {
        kind: "call",
        callee: { kind: "ident", name: "risky", type: callee_type, effects: EMPTY_ROW, span: S },
        args: [],
        type_args: [],
        resolved_dicts: [],
        type: INT,
        effects: effect_row(fail_effect),
        span: S,
      },
      handler: int_lit(0),
      type: INT,
      effects: EMPTY_ROW,
      span: S,
    };
    const decl: HFnDecl = {
      kind: "fn_decl",
      name: "f",
      type_params: [],
      params: [],
      return_type: INT,
      effects: EMPTY_ROW,
      body: block([], try_catch_expr),
      is_pub: false,
      trait_bounds: [],
      span: S,
    };
    const js = generate(program([decl]));
    assert.ok(js.includes("__ev_fail"));
    assert.ok(js.includes("__EffectAbort"));
    assert.ok(js.includes("try"));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd compiler && npm test`
Expected: FAIL — current `gen_try_catch` uses simple try/catch without evidence

- [ ] **Step 3: Rewrite `gen_try_catch`**

```typescript
private gen_try_catch(expr: HExpr & { kind: "try_catch" }): string {
  // The body may call functions that need __ev_fail.
  // Provide evidence that throws __EffectAbort, catch it and return handler value.
  const body = this.gen_expr(expr.body);
  const handler = this.gen_expr(expr.handler);
  const binding = expr.error_binding ?? "__e";

  if (expr.error_binding) {
    // catch expression: expose error to handler
    return `(function() { const __ev_fail = { raise: (${binding}) => { throw new __EffectAbort("fail", ${binding}); } }; try { return ${body}; } catch (__e) { if (__e instanceof __EffectAbort && __e.effect === "fail") { const ${binding} = __e.value; return ${handler}; } throw __e; } })()`;
  } else {
    // or expression: handler doesn't use error value
    return `(function() { const __ev_fail = { raise: (__err) => { throw new __EffectAbort("fail", undefined); } }; try { return ${body}; } catch (__e) { if (__e instanceof __EffectAbort && __e.effect === "fail") return ${handler}; throw __e; } })()`;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd compiler && npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add compiler/src/codegen/codegen.ts compiler/src/codegen/codegen.test.ts
git commit -m "feat(codegen): gen_try_catch uses evidence-based __EffectAbort"
```

---

### Task 9: Top-level evidence injection for `main()` calls

**Files:**
- Modify: `compiler/src/codegen/codegen.ts` (the `generate` method, main call section)

- [ ] **Step 1: Write the failing test**

```typescript
describe("top-level evidence injection", () => {
  it("provides __ev_io and __ev_fail when main has effects", () => {
    const io_effect: Effect = { kind: "io" };
    const fail_effect: Effect = { kind: "fail", error_type: STR };
    const decl: HFnDecl = {
      kind: "fn_decl",
      name: "main",
      type_params: [],
      params: [],
      return_type: UNIT,
      effects: effect_row(io_effect, fail_effect),
      body: block([]),
      is_pub: false,
      trait_bounds: [],
      span: S,
    };
    const js = generate(program([decl]));
    assert.ok(js.includes("main(__ev_fail, __ev_io)"));
    // Should define top-level evidence
    assert.ok(js.includes('const __ev_io = {'));
    assert.ok(js.includes('const __ev_fail = {'));
  });

  it("calls main() without evidence when pure", () => {
    const decl: HFnDecl = {
      kind: "fn_decl",
      name: "main",
      type_params: [],
      params: [],
      return_type: UNIT,
      effects: EMPTY_ROW,
      body: block([]),
      is_pub: false,
      trait_bounds: [],
      span: S,
    };
    const js = generate(program([decl]));
    assert.ok(js.includes("main();"));
    assert.ok(!js.includes("__ev_"));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd compiler && npm test`
Expected: FAIL

- [ ] **Step 3: Implement top-level evidence injection**

In the `generate` method of `CodeGenerator`, replace the main-call section:

```typescript
// Auto-call main() if present, with top-level evidence if needed
const main_decl = program.decls.find(
  d => d.kind === "fn_decl" && d.name === "main"
) as HFnDecl | undefined;
if (main_decl) {
  const ev_params = this.get_evidence_params(main_decl.effects);
  if (ev_params.length > 0) {
    this.emit_toplevel_evidence(main_decl.effects);
    this.emit(`main(${ev_params.join(", ")});`);
  } else {
    this.emit("main();");
  }
}
```

Add the helper method:

```typescript
private emit_toplevel_evidence(effects: { effects: { kind: string; name?: string }[] }): void {
  const effect_names: string[] = [];
  for (const e of effects.effects) {
    let name: string;
    if (e.kind === "io") name = "io";
    else if (e.kind === "fail") name = "fail";
    else if (e.kind === "mut") name = "mut";
    else name = (e as any).name ?? "unknown";
    if (!effect_names.includes(name)) {
      effect_names.push(name);
    }
  }
  effect_names.sort();

  for (const name of effect_names) {
    const ev_name = evidence_param_name(name);
    if (name === "io") {
      this.emit(`const ${ev_name} = { read: (p) => require("fs").readFileSync(p, "utf-8"), write: (p, d) => require("fs").writeFileSync(p, d, "utf-8") };`);
    } else if (name === "fail") {
      this.emit(`const ${ev_name} = { raise: (error) => { throw error; } };`);
    } else {
      this.emit(`const ${ev_name} = {};`);
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd compiler && npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add compiler/src/codegen/codegen.ts compiler/src/codegen/codegen.test.ts
git commit -m "feat(codegen): inject top-level evidence for main()"
```

---

### Task 10: Fix existing e2e tests

**Files:**
- Modify: `tests/e2e.test.ts`
- Possibly modify: `tests/cases/effect_or.ring`, `tests/cases/effect_catch.ring`

The existing e2e tests should still produce the same output. The codegen changes should be transparent. However, `effect_resume.ring` requires resume support we don't have — skip it.

- [ ] **Step 1: Skip `effect_resume.ring` in e2e test registry**

In `tests/e2e.test.ts`, comment out or remove the effect_resume entry:

```typescript
// { file: "effect_resume.ring", expected: "processed: mock-data\n" },  // requires resume (Phase 2 Session 2b)
```

- [ ] **Step 2: Build and run all tests**

Run: `cd compiler && npm run build && npm test`

- [ ] **Step 3: Debug and fix any failures**

Common issues to expect:
1. `effect_or.ring` — `risky()` doesn't actually use `fail` effect (it's pure). The `or` expression wraps it anyway. Under evidence passing, `risky()` doesn't need `__ev_fail` so the `or` expression shouldn't pass it. Need to check if the body's callee actually requires fail evidence.
2. `effect_handle_io.ring` — body contains `io.read` which now becomes `__ev_io.read`. The handler provides the evidence. Should work.
3. `effect_handle_fail.ring` — `may_fail()` is pure, handler for fail just wraps with __EffectAbort.

For `or`/`catch` cases where the body is already pure (no fail effect in body's effect row): the simple try/catch should still work. Check `expr.body.effects` — if it has no fail effect, we can use a simpler codegen that just returns the body directly (no evidence needed).

Update `gen_try_catch` to handle pure bodies:

```typescript
private gen_try_catch(expr: HExpr & { kind: "try_catch" }): string {
  const body_has_fail = expr.body.effects.effects.some(e => e.kind === "fail");
  const body = this.gen_expr(expr.body);
  const handler = this.gen_expr(expr.handler);
  const binding = expr.error_binding ?? "__e";

  if (!body_has_fail) {
    // Body doesn't actually produce fail effect — just return body directly
    // (or/catch on a pure expression is effectively a no-op)
    return body;
  }

  if (expr.error_binding) {
    return `(function() { const __ev_fail = { raise: (${binding}) => { throw new __EffectAbort("fail", ${binding}); } }; try { return ${body}; } catch (__e) { if (__e instanceof __EffectAbort && __e.effect === "fail") { const ${binding} = __e.value; return ${handler}; } throw __e; } })()`;
  } else {
    return `(function() { const __ev_fail = { raise: (__err) => { throw new __EffectAbort("fail", undefined); } }; try { return ${body}; } catch (__e) { if (__e instanceof __EffectAbort && __e.effect === "fail") return ${handler}; throw __e; } })()`;
  }
}
```

Similarly, update `gen_handle` to handle cases where body is pure for the handled effect.

- [ ] **Step 4: Verify all e2e tests pass (except skipped resume)**

Run: `cd compiler && npm run build && npm test`
Expected: ALL PASS (11 e2e cases × 3 modes = 33 tests, minus 3 for resume skip = 30)

- [ ] **Step 5: Commit**

```bash
git add tests/e2e.test.ts compiler/src/codegen/codegen.ts
git commit -m "fix(codegen): handle pure bodies in or/catch, skip resume test"
```

---

### Task 11: New e2e test — `effect_evidence.ring`

**Files:**
- Create: `tests/cases/effect_evidence.ring`
- Modify: `tests/e2e.test.ts`

- [ ] **Step 1: Create the test case**

Create `tests/cases/effect_evidence.ring`:

```ring
// Evidence passing: handler provides mock io.read implementation
fn read_config() -> Str {
    io.read("config.toml")
}

fn main() {
    let data = handle {
        read_config()
    } with {
        io.read(path) => "mock-data",
    }
    print(data)
}
```

- [ ] **Step 2: Register in e2e**

In `tests/e2e.test.ts`, add to the `cases` array:

```typescript
{ file: "effect_evidence.ring", expected: "mock-data\n" },
```

- [ ] **Step 3: Run and verify**

Run: `cd compiler && npm run build && npm test`
Expected: `effect_evidence.ring` PASSES

- [ ] **Step 4: Commit**

```bash
git add tests/cases/effect_evidence.ring tests/e2e.test.ts
git commit -m "test(e2e): add effect_evidence.ring for basic evidence passing"
```

---

### Task 12: New e2e test — `effect_multi_handler.ring`

**Files:**
- Create: `tests/cases/effect_multi_handler.ring`
- Modify: `tests/e2e.test.ts`

- [ ] **Step 1: Create the test case**

Create `tests/cases/effect_multi_handler.ring`:

```ring
// Multiple effects handled simultaneously
fn load_or_fail() -> Str {
    let data = io.read("input.txt")
    if data == "" {
        fail.raise("empty file")
    }
    data
}

fn main() {
    let result = handle {
        load_or_fail()
    } with {
        io.read(path) => "file-content",
        fail.raise(e) => "error-handled",
    }
    print(result)
}
```

- [ ] **Step 2: Register in e2e**

```typescript
{ file: "effect_multi_handler.ring", expected: "file-content\n" },
```

- [ ] **Step 3: Run and verify**

Run: `cd compiler && npm run build && npm test`
Expected: PASSES — io.read is handled, returns "file-content", fail.raise is never reached

- [ ] **Step 4: Commit**

```bash
git add tests/cases/effect_multi_handler.ring tests/e2e.test.ts
git commit -m "test(e2e): add effect_multi_handler.ring for multi-evidence"
```

---

### Task 13: New e2e test — `effect_propagate.ring`

**Files:**
- Create: `tests/cases/effect_propagate.ring`
- Modify: `tests/e2e.test.ts`

- [ ] **Step 1: Create the test case**

Create `tests/cases/effect_propagate.ring`:

```ring
// Evidence propagation across 3 function call layers
fn inner() -> Str {
    io.read("deep.txt")
}

fn middle() -> Str {
    inner()
}

fn main() {
    let result = handle {
        middle()
    } with {
        io.read(path) => "propagated",
    }
    print(result)
}
```

- [ ] **Step 2: Register in e2e**

```typescript
{ file: "effect_propagate.ring", expected: "propagated\n" },
```

- [ ] **Step 3: Run and verify**

Run: `cd compiler && npm run build && npm test`
Expected: PASSES — evidence flows main → middle → inner

- [ ] **Step 4: Commit**

```bash
git add tests/cases/effect_propagate.ring tests/e2e.test.ts
git commit -m "test(e2e): add effect_propagate.ring for cross-function evidence"
```

---

### Task 14: Final lint check & cleanup

**Files:**
- Potentially all modified files

- [ ] **Step 1: Run typecheck**

Run: `cd compiler && npm run typecheck`
Expected: No errors

- [ ] **Step 2: Run lint**

Run: `cd compiler && npm run lint`
Expected: No errors

- [ ] **Step 3: Run full test suite**

Run: `cd compiler && npm test`
Expected: ALL PASS

- [ ] **Step 4: Verify generated JS readability**

Run: `node compiler/dist/cli.js build tests/cases/effect_evidence.ring`

Inspect the output: should see clear `__ev_io` variables, no generators, no `yield`.

- [ ] **Step 5: Clean up any dead code**

Ensure no unused imports, no leftover generator references, no `__run_handler` anywhere.

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "chore: cleanup dead generator code and pass lint"
```

---

## Summary

| Task | Description | Risk |
|------|-------------|------|
| 1 | `evidence_param_name` convention | Low |
| 2 | Runtime: `__EffectAbort` replaces `__run_handler` | Low |
| 3 | `gen_effect_op` → evidence calls | Low |
| 4 | Evidence params in function signatures | Medium |
| 5 | `gen_handle` rewrite | High |
| 6 | Evidence forwarding at call sites | High |
| 7 | Remove generator logic | Low |
| 8 | `gen_try_catch` evidence-based | Medium |
| 9 | Top-level evidence for main() | Medium |
| 10 | Fix existing e2e tests | High |
| 11-13 | New e2e tests | Low |
| 14 | Lint & cleanup | Low |
