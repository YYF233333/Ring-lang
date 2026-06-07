// B-104 regression: ANF/materialize of fresh-owned intermediate temporaries +
// the `&&` / `||` aliasing exclusion.
//
// The ANF pre-pass (perceus.ring) hoists fresh-owned intermediate sub-expressions
// (call args, arith/compare operands, conditions, interpolation pieces) into
// `let __anf_N = <expr>` so the clone-all-escape RC pass reclaims them via the
// normal scope-end-drop.  This file stresses the materialised positions that are
// the bulk of the diagnosed live≈allocs 1:1 leak, AND the ONE class that must NOT
// be materialised: `&&` / `||` results.
//
// THE BUG THIS PINS: gen_and / gen_or emit a phi whose short-circuit-taken edge is
// the RHS operand VERBATIM (`a && b` yields b's own box when a is true).  When the
// RHS is a BORROW (a struct field / list element read), materialising the `&&` and
// scope-dropping the binding over-frees a value owned elsewhere -> native UAF
// (originally caught by ASan: register_impl_method freeing parse_param's is_mutable
// Bool, reached via `if first_p.name == "self" && first_p.is_mutable`).  The JS
// oracle pins the output; the native build must match AND not crash (over-free
// aborts under RC).  A *wrong* fix (materialising And/Or, or making `let x = a && b`
// droppable) double-frees the RHS borrow.

struct Flagged {
    name: Str,
    on: Bool
}

// `f.name == "self"` is a fresh comparison; `f.on` (the `&&` RHS) is a BORROW of the
// struct's field.  The `&&` result aliases `f.on` on the taken path — it must not be
// materialised + dropped, or `f.on` is freed while the struct still owns it.
fn count_active(items: List<Flagged>) -> Int {
    let mut n = 0
    for it in items {
        // `&&` with a field-read RHS bound implicitly into the if condition.
        if it.name.len() > 0 && it.on {
            n = n + 1
        }
        // `||` with a field-read RHS.
        let keep = it.on || it.name.len() > 3
        if keep {
            n = n + 0
        }
    }
    n
}

// Materialisation-heavy: nested fresh-owned call args, arith operands, interpolation.
fn doubled_sum(xs: List<Int>) -> Int {
    let mut acc = 0
    let mut i = 0
    while i < xs.len() {
        // `i + 1` (arith temp), `xs.len()` (call temp in condition) materialise.
        acc = acc + xs[i] * 2
        i = i + 1
    }
    acc
}

fn label(f: Flagged) -> Str {
    // String interpolation with a fresh-owned arith piece + a bool field read.
    "${f.name}=${f.on}"
}

fn main() {
    let items = [
        Flagged { name: "alpha", on: true },
        Flagged { name: "beta", on: false },
        Flagged { name: "gamma", on: true }
    ]
    print("active=${count_active(items)}")          // active=2

    let nums = [3, 5, 7]
    print("dsum=${doubled_sum(nums)}")              // dsum=30

    // f(g(x)) nesting + index-read borrow into a fresh List.
    let first = items[0]
    print(label(first))                             // alpha=true

    // Boolean chain bound to a let, then used — the `&&`/`||` result must round-trip
    // identically on both backends (and not over-free the field-read RHS).
    let a = items[0].on && items[2].on
    let b = items[1].on || items[0].on
    print("a=${a} b=${b}")                          // a=true b=true
}
