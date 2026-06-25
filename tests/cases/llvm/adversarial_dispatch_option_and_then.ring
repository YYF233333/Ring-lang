// B-100 P1.3 adversarial: Option.and_then — DISCOVERED GAP.
// Option.and_then is listed in OPTION_HOF_METHODS and works in the JS backend,
// but ring_Option_and_then is NOT implemented in ring_runtime.cpp, and there is
// no codegen mapping in codegen_llvm_expr.ring. The LLVM backend panics with:
//   ring panic: LLVM: missing method 'Option.and_then'
//
// This test will FAIL until the gap is fixed. It documents the exact semantics
// expected by the JS oracle.

fn main() {
    // and_then with Some -> Some
    let r1 = some(5).and_then(fn(x) { if x > 3 { some(x * 10) } else { none } })
    print("and_then_some=${r1.unwrap_or(0)}")           // and_then_some=50

    // and_then with Some -> None (closure returns none)
    let r2 = some(1).and_then(fn(x) { if x > 3 { some(x * 10) } else { none } })
    print("and_then_none=${r2.is_none()}")              // and_then_none=true

    // and_then on None (closure never called)
    let r3: Option<Int> = none
    let r3r = r3.and_then(fn(x) { some(x + 1) })
    print("and_then_on_none=${r3r.is_none()}")          // and_then_on_none=true

    // chained: map then and_then
    let r4 = some(4)
        .map(fn(x) { x * 2 })
        .and_then(fn(x) { if x > 5 { some(x + 100) } else { none } })
    print("chain_map_at=${r4.unwrap_or(0)}")            // chain_map_at=108

    // chained: and_then then map
    let r5 = some(10)
        .and_then(fn(x) { if x > 0 { some(x) } else { none } })
        .map(fn(x) { x * 3 })
    print("chain_at_map=${r5.unwrap_or(0)}")            // chain_at_map=30

    print("done")
}
