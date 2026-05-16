# Phase 2 Session 2b: Cell<T> + mut effect Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Cell<T> built-in type with get/set/update methods that carry `{mut}` effect, enabling type-safe shared mutable state across closures.

**Architecture:** Cell<T> is a factory function returning `{ value }` objects. Methods are built-in impl functions registered in the checker with pre-set `{mut}` effect. Codegen resolves them via normal UFCS path. `__ev_mut` is an empty runtime object (JS is already mutable).

**Tech Stack:** TypeScript (compiler), Node.js test runner, zero external dependencies.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `compiler/src/checker/env.ts` | Modify | Register Cell struct + constructor fn + impl methods with {mut} |
| `compiler/src/codegen/runtime.ts` | Modify | Add Cell factory + Cell_get/set/update functions |
| `compiler/src/codegen/codegen.ts` | Modify | Pre-populate impl_methods for Cell |
| `compiler/src/codegen/codegen.test.ts` | Modify | Unit test for Cell codegen |
| `tests/cases/effect_cell.ring` | Create | Cell + mut propagation e2e |
| `tests/cases/effect_cell_closure.ring` | Create | Cell in closures e2e |
| `tests/cases/effect_resume_side.ring` | Create | Handler side-effects + return e2e |
| `tests/e2e.test.ts` | Modify | Register new tests |

---

### Task 1: Register Cell<T> in checker env

**Files:**
- Modify: `compiler/src/checker/env.ts:100-143`

- [ ] **Step 1: Register Cell struct and impl methods**

In `register_builtins()`, after the `fail` effect registration (around line 141), add:

```typescript
    // Built-in: Cell<T> — shared mutable reference
    const cell_t = this.fresh_var();
    this.structs.set("Cell", {
      name: "Cell",
      type_params: ["T"],
      type_param_vars: [cell_t.id],
      fields: [{ name: "value", type: cell_t, is_pub: true }],
    });

    // Cell constructor: fn<T>(T) -> Cell<T>
    const cell_ctor_t = this.fresh_var();
    const cell_struct_type: Type = {
      kind: "struct", name: "Cell",
      type_params: [cell_ctor_t],
      fields: [{ name: "value", type: cell_ctor_t, is_pub: true }],
    };
    this.bind("Cell", {
      type: { kind: "fn", params: [cell_ctor_t], return_type: cell_struct_type, effects: EMPTY_ROW } as FnType,
      type_vars: [cell_ctor_t.id],
    });

    // Cell impl methods — all carry {mut} effect
    const mut_row: EffectRow = { effects: [{ kind: "mut" }] };
    const cell_m_t = this.fresh_var();
    const cell_self_type: Type = {
      kind: "struct", name: "Cell",
      type_params: [cell_m_t],
      fields: [{ name: "value", type: cell_m_t, is_pub: true }],
    };
    const cell_methods = new Map<string, TypeScheme>();
    // get(self) -> T with {mut}
    cell_methods.set("get", {
      type: { kind: "fn", params: [cell_self_type], return_type: cell_m_t, effects: mut_row } as FnType,
      type_vars: [cell_m_t.id],
    });
    // set(self, val: T) -> Unit with {mut}
    cell_methods.set("set", {
      type: { kind: "fn", params: [cell_self_type, cell_m_t], return_type: UNIT, effects: mut_row } as FnType,
      type_vars: [cell_m_t.id],
    });
    // update(self, f: fn(T) -> T) -> Unit with {mut}
    const update_fn_type: FnType = { kind: "fn", params: [cell_m_t], return_type: cell_m_t, effects: EMPTY_ROW };
    cell_methods.set("update", {
      type: { kind: "fn", params: [cell_self_type, update_fn_type], return_type: UNIT, effects: mut_row } as FnType,
      type_vars: [cell_m_t.id],
    });
    this.impl_methods.set("Cell", cell_methods);
```

You'll need to import `Type` at the top (it's likely already imported, but verify `EffectRow` is also imported — it should be from the existing import line).

- [ ] **Step 2: Build and verify typecheck**

Run: `cd compiler && npm run build`
Expected: Compiles without errors.

- [ ] **Step 3: Run existing tests**

Run: `cd compiler && npm test`
Expected: All 100 tests pass (no regression).

- [ ] **Step 4: Commit**

```bash
git add compiler/src/checker/env.ts
git commit -m "feat(checker): register Cell<T> with mut effect methods"
```

---

### Task 2: Add Cell to runtime preamble

**Files:**
- Modify: `compiler/src/codegen/runtime.ts`

- [ ] **Step 1: Add Cell functions to RUNTIME_CODE**

After the `__EffectAbort` class in runtime.ts, add:

```javascript
function Cell(value) { return { value }; }
function Cell_get(self, __ev_mut) { return self.value; }
function Cell_set(self, val, __ev_mut) { self.value = val; }
function Cell_update(self, f, __ev_mut) { self.value = f(self.value); }
```

The full `RUNTIME_CODE` should now be:

```typescript
export const RUNTIME_CODE = `// === Ring-lang Runtime ===
class __EffectAbort {
  constructor(effect, value) {
    this.effect = effect;
    this.value = value;
  }
}

function Cell(value) { return { value }; }
function Cell_get(self, __ev_mut) { return self.value; }
function Cell_set(self, val, __ev_mut) { self.value = val; }
function Cell_update(self, f, __ev_mut) { self.value = f(self.value); }

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

- [ ] **Step 2: Build and test**

Run: `cd compiler && npm run build && npm test`
Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add compiler/src/codegen/runtime.ts
git commit -m "feat(runtime): add Cell factory and Cell_get/set/update functions"
```

---

### Task 3: Pre-populate codegen impl_methods for Cell

**Files:**
- Modify: `compiler/src/codegen/codegen.ts:64-96`

- [ ] **Step 1: Add Cell methods to impl_methods in generate()**

In the `generate()` method of CodeGenerator, after the loop that collects `impl_methods` from program decls (around line 76), add:

```typescript
    // Built-in Cell impl methods (registered in runtime, not in source)
    this.impl_methods.set("Cell.get", undefined);
    this.impl_methods.set("Cell.set", undefined);
    this.impl_methods.set("Cell.update", undefined);
```

This ensures that when `gen_call` sees a UFCS call `c.get()` on a Cell receiver, it generates `Cell_get(c, ...)` instead of trying to access a property.

- [ ] **Step 2: Build and test**

Run: `cd compiler && npm run build && npm test`
Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add compiler/src/codegen/codegen.ts
git commit -m "feat(codegen): register Cell UFCS methods for codegen dispatch"
```

---

### Task 4: E2e test — effect_cell.ring

**Files:**
- Create: `tests/cases/effect_cell.ring`
- Modify: `tests/e2e.test.ts`

- [ ] **Step 1: Create test file**

Create `tests/cases/effect_cell.ring`:

```ring
// Cell<T> + mut effect propagation
fn increment(c: Cell<Int>) -> Unit {
    c.set(c.get() + 1)
}

fn main() {
    let c = Cell(0)
    increment(c)
    increment(c)
    print(c.get())
}
```

- [ ] **Step 2: Register in e2e.test.ts**

Add to the `cases` array:

```typescript
  { file: "effect_cell.ring", expected: "2\n" },
```

- [ ] **Step 3: Build and run**

Run: `cd compiler && npm run build && npm test`
Expected: `effect_cell.ring` passes with output `2\n`.

- [ ] **Step 4: Commit**

```bash
git add tests/cases/effect_cell.ring tests/e2e.test.ts
git commit -m "test(e2e): add effect_cell.ring for Cell<T> + mut effect"
```

---

### Task 5: E2e test — effect_cell_closure.ring

**Files:**
- Create: `tests/cases/effect_cell_closure.ring`
- Modify: `tests/e2e.test.ts`

- [ ] **Step 1: Create test file**

Create `tests/cases/effect_cell_closure.ring`:

```ring
// Cell shared through closure
fn main() {
    let counter = Cell(0)
    let inc = fn() { counter.set(counter.get() + 1) }
    inc()
    inc()
    inc()
    print(counter.get())
}
```

- [ ] **Step 2: Register in e2e.test.ts**

Add to the `cases` array:

```typescript
  { file: "effect_cell_closure.ring", expected: "3\n" },
```

- [ ] **Step 3: Build and run**

Run: `cd compiler && npm run build && npm test`
Expected: `effect_cell_closure.ring` passes with output `3\n`.

- [ ] **Step 4: Commit**

```bash
git add tests/cases/effect_cell_closure.ring tests/e2e.test.ts
git commit -m "test(e2e): add effect_cell_closure.ring for Cell in closures"
```

---

### Task 6: E2e test — effect_resume_side.ring (resume verification)

**Files:**
- Create: `tests/cases/effect_resume_side.ring`
- Modify: `tests/e2e.test.ts`

- [ ] **Step 1: Create test file**

Create `tests/cases/effect_resume_side.ring`:

```ring
// Handler body with side-effects before return (implicit resume)
fn work() -> Str {
    io.read("input.txt")
}

fn main() {
    let result = handle {
        work()
    } with {
        io.read(path) => {
            print("reading: ${path}")
            "mock-result"
        },
    }
    print(result)
}
```

- [ ] **Step 2: Register in e2e.test.ts**

Add to the `cases` array:

```typescript
  { file: "effect_resume_side.ring", expected: "reading: input.txt\nmock-result\n" },
```

- [ ] **Step 3: Build and run**

Run: `cd compiler && npm run build && npm test`
Expected: passes with two lines of output.

- [ ] **Step 4: Commit**

```bash
git add tests/cases/effect_resume_side.ring tests/e2e.test.ts
git commit -m "test(e2e): add effect_resume_side.ring verifying handler side-effects"
```

---

### Task 7: Final lint check & verification

**Files:**
- All modified files

- [ ] **Step 1: Run typecheck**

Run: `cd compiler && npm run typecheck`
Expected: No errors.

- [ ] **Step 2: Run lint**

Run: `cd compiler && npm run lint`
Expected: No errors.

- [ ] **Step 3: Run full test suite**

Run: `cd compiler && npm test`
Expected: ALL pass (103+ unit + 45 e2e).

- [ ] **Step 4: Verify Cell generated JS**

Run: `node compiler/dist/cli.js build tests/cases/effect_cell.ring`
Inspect output: should show `Cell(0)` call, `Cell_get(c, __ev_mut)`, `Cell_set(c, ...)` calls, `__ev_mut = {}` at top level.
Delete generated file after inspection.

- [ ] **Step 5: Commit if any cleanup was needed**

```bash
git add -A
git commit -m "chore: lint cleanup for Cell<T> + mut implementation"
```

---

## Summary

| Task | Description | Risk |
|------|-------------|------|
| 1 | Register Cell<T> in checker | Medium (type plumbing) |
| 2 | Cell functions in runtime | Low |
| 3 | Codegen impl_methods for Cell | Low |
| 4 | E2e: effect_cell.ring | Medium (integration) |
| 5 | E2e: effect_cell_closure.ring | Medium (closure capture) |
| 6 | E2e: effect_resume_side.ring | Low (already works) |
| 7 | Lint & cleanup | Low |
