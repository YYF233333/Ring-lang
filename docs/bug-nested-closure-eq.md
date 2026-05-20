# Bug: `==` in nested closures may fail

**Priority**: Fix before Batch 4 (checker translation has ~31 affected call sites)

## Symptom

In `types.ring`, string `==` inside a double-nested closure doesn't work correctly. A `str_eq()` helper function is used as workaround:

```ring
// Workaround — works:
fn str_eq(a: Str, b: Str) -> Bool { a == b }

fa.all(fn(f) {
    fb.any(fn(bf) { str_eq(bf.name, f.name) && types_equal(f.ty, bf.ty) })
})

// Expected to work but doesn't:
fa.all(fn(f) {
    fb.any(fn(bf) { bf.name == f.name && types_equal(f.ty, bf.ty) })
})
```

## Suspected root cause

Evidence passing for Eq trait dispatch may not thread correctly through nested closure captures. When `==` is used inside a closure that is itself inside another closure, the `__Str_Eq` evidence dictionary might not be in scope at the codegen level.

Single-level closures appear fine — a quick test of `names.find(fn(n) { n == target })` generated correct `n === target` JS. The bug likely triggers when:

1. Closure A captures variable `f` from outer scope
2. Closure B (inside A) tries to use `==` on `f.name` (accessing captured-then-projected value)
3. Evidence parameter for Eq is not forwarded into the inner closure

## Reproduction steps

Write a test case with this structure:

```ring
fn main() {
    let items = [("a", 1), ("b", 2), ("c", 3)]
    let targets = ["a", "c"]

    // Double-nested closure: outer captures `targets`, inner captures `t` from outer
    let results = items.filter(fn(item) {
        let (name, _) = item
        targets.any(fn(t) { t == name })    // <-- does this generate correct JS?
    })

    assert(results.len() == 2, "should find 2 matches")
    print("nested closure eq: passed")
}
```

Also test with struct field access (closer to the actual types.ring pattern):

```ring
struct Named { name: Str, value: Int }

fn main() {
    let haystack = [Named { name: "x", value: 1 }, Named { name: "y", value: 2 }]
    let needles = [Named { name: "y", value: 0 }]

    let found = needles.all(fn(n) {
        haystack.any(fn(h) { h.name == n.name })   // <-- double-nested, field access
    })

    assert(found, "should find all needles")
    print("nested closure struct eq: passed")
}
```

## Where to look

- `compiler/src/codegen/codegen-expr.ts` — lambda/closure codegen, check if evidence params are captured
- `compiler/src/checker/infer-expr.ts` — lambda type checking, verify evidence is in scope for inner closures
- `compiler/src/codegen/codegen-ctx.ts` — `get_evidence_params`, check if nested scopes inherit evidence

## Impact on bootstrap

Batch 4 (checker, ~5700 lines) has ~31 instances of `.find()` / `.some()` / `.filter()` with `==` inside callbacks. Using `str_eq()` workaround for all 31 is possible but degrades readability in the most complex and highest-risk translation batch.
