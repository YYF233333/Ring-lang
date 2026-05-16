# Phase 2 Session 2: Evidence Passing Effect System

## Overview

Replace the generator-based effect handler codegen with **evidence passing**: each effect becomes a dictionary of operation implementations, passed as hidden parameters to functions that use that effect.

**Scope (minimal subset):**
- Unified evidence passing for ALL effects (io, fail, custom)
- No resume support (abort-only handlers)
- `effect_resume.ring` test skipped until resume is implemented

## Compilation Model

```
Source:  fn foo() -> Int with {io, fail<Err>} { io.read("x") }
HIR:     HFnDecl { effects: [io, fail<Err>], body: HEffectOp("io", "read", ["x"]) }
JS:      function foo(__ev_io, __ev_fail) { return __ev_io.read("x"); }
```

## Evidence Object Structure

Each effect's evidence is a JS object mapping operation names to implementation functions:

```javascript
// effect io { fn read(path: Str) -> Str; fn write(path: Str, data: Str) -> Unit }
const __ev_io = {
    read: (path) => fs.readFileSync(path, "utf-8"),
    write: (path, data) => fs.writeFileSync(path, data, "utf-8")
};

// effect fail<E> { fn raise(error: E) -> Never }
const __ev_fail = {
    raise: (error) => { throw new __EffectAbort("fail", error); }
};
```

## Naming Conventions

Shared convention in `hir/index.ts`:

```typescript
export function evidence_param_name(effect_name: string): string {
    return `__ev_${effect_name}`;
}
```

## Parameter Order

Fixed order for generated function signatures:

```
user params → trait dict params → evidence params
```

Evidence params sorted alphabetically by effect name for stability.

Example:
```javascript
// fn process<T: Show>(item: T) -> Str with {io, fail<Err>}
function process(item, __Show, __ev_fail, __ev_io) { ... }
```

## __EffectAbort Runtime Class

```javascript
class __EffectAbort {
    constructor(effect, value) {
        this.effect = effect;
        this.value = value;
    }
}
```

Purpose: abort-semantic operations (like `fail.raise` with return type `Never`) must unwind the stack. The handler's try/catch catches `__EffectAbort` specifically.

## Handler Codegen

```ring
handle { body } with {
    io.read(path) => "mock",
    fail.raise(e) => "default"
}
```

Compiles to:

```javascript
(function() {
    const __ev_fail = { raise: (e) => { throw new __EffectAbort("fail", "default"); } };
    const __ev_io = { read: (path) => "mock" };
    try {
        return (function(__ev_fail, __ev_io) { /* body */ })(__ev_fail, __ev_io);
    } catch (__e) {
        if (__e instanceof __EffectAbort && __e.effect === "fail") return __e.value;
        throw __e;
    }
})()
```

Key rules:
- Non-abort operations (io.read) return values directly — no throw/catch needed for them alone
- Abort operations (fail.raise, return type Never) throw `__EffectAbort`
- Handler try/catch ONLY catches `__EffectAbort`, re-throws everything else
- Optimization: if no abort-semantic handlers exist, skip try/catch entirely

## Effect Operation Codegen

Current: `yield { effect: "io", op: "read", args: [path] }`

New: `__ev_io.read(path)`

```typescript
function gen_effect_op(node: HEffectOp): string {
    const ev_name = evidence_param_name(node.effect_name);
    const args = node.args.map(gen_expr).join(", ");
    return `${ev_name}.${node.op_name}(${args})`;
}
```

## Evidence Forwarding at Call Sites

When calling a function with effects, the caller forwards its own evidence:

```ring
fn helper() -> Str with {io} { io.read("config.txt") }
fn main() -> Str with {io} { helper() }
```

```javascript
function helper(__ev_io) { return __ev_io.read("config.txt"); }
function main(__ev_io) { return helper(__ev_io); }
```

The caller determines the callee's required effects from the callee's type (EffectRow on FnType in HIR).

## `or` / `catch` Expressions

```ring
let x = risky() or "fallback"
```

```javascript
const x = (function() {
    const __ev_fail = { raise: (_e) => { throw new __EffectAbort("fail", "fallback"); } };
    try { return risky(__ev_fail /* + other evidence from enclosing scope */); }
    catch (__e) { if (__e instanceof __EffectAbort && __e.effect === "fail") return __e.value; throw __e; }
})();
```

`catch` is similar but exposes the error value.

## Top-Level Evidence Injection

Module entry / main function provides "real" evidence for built-in effects:

```javascript
const __ev_fail = {
    raise: (error) => { throw error; }
};
const __ev_io = {
    read: (path) => require("fs").readFileSync(path, "utf-8"),
    write: (path, data) => require("fs").writeFileSync(path, data, "utf-8")
};
```

Top-level `__ev_fail` throws raw error (no `__EffectAbort`) — unhandled effect = runtime crash.

## Nested Handlers

Inner handler's evidence shadows outer:

```ring
handle {
    handle { io.read("x") } with { io.read(p) => "inner" }
} with { io.read(p) => "outer" }
```

Inner body sees `__ev_io = { read: _ => "inner" }`. Lexical scoping — natural JS behavior.

## Closures

Closures don't capture evidence; they receive it as parameters when called:

```javascript
function make_reader(__ev_io) {
    function inner(__ev_io) { return __ev_io.read("x"); }
    return inner;  // caller provides __ev_io when invoking inner
}
```

## Deletions

- Remove `__run_handler` runtime function
- Remove `function*` generator generation
- Remove `yield` generation in `gen_effect_op`

## Testing

### Existing tests (must pass):
- `effect_or.ring` — output unchanged
- `effect_catch.ring` — output unchanged
- `effect_handle_fail.ring` — output unchanged
- `effect_handle_io.ring` — output unchanged (codegen changes, behavior same)

### Skipped:
- `effect_resume.ring` — requires resume support (future session)

### New tests:
| File | Purpose |
|------|---------|
| `effect_evidence.ring` | Basic evidence passing: handler mocks io.read |
| `effect_multi_handler.ring` | Handle io + fail simultaneously, verify multi-evidence |
| `effect_propagate.ring` | Evidence forwarding across 3+ function call layers |

### Acceptance criteria:
- `npm test` passes (with `effect_resume.ring` skipped)
- `npm run lint` passes
- Generated JS is readable — clear evidence variable names, no unnecessary wrapping
