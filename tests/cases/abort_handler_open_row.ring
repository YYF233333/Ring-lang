// Audit #251 regression: an abort handler refines an otherwise-open callback
// row to fail<payload> plus a polymorphic residual row. The refinement must be
// written back to the function scheme so compatible callbacks execute and the
// handled fail does not escape.

fn recover(callback: fn() -> Int) -> Int {
    handle {
        callback()
    } with {
        fail.raise(message: Str) => message.len(),
    }
}

fn apply(callback: fn() -> Int) -> Int {
    callback()
}

// With no payload annotation or use, fail's operation parameter remains
// polymorphic. Refining the checked callback parameter must generalize that
// new payload variable when the function scheme is rebound.
fn recover_any(callback: fn() -> Int) -> Int {
    handle {
        callback()
    } with {
        fail.raise(unused) => 0,
    }
}

fn raise_text() -> Int with {fail<Str>} {
    fail.raise("open-row")
}

fn raise_number() -> Int with {fail<Int>} {
    fail.raise(7)
}

fn main() {
    let recovered = recover(fn() -> Int { raise_text() })

    // Ordinary effect-polymorphic HOF inference remains unchanged for both a
    // pure callback and a callback whose fail row escapes to an outer catch.
    let pure = apply(fn() -> Int { 7 })
    let propagated = apply(fn() -> Int { raise_text() }) catch { _ => 9 }

    // A closed pure body remains valid: only an actual open tail is refined.
    let normal = handle {
        41
    } with {
        fail.raise(message: Str) => message.len(),
    }

    // The newly written-back fail<E> payload is generalized, so the same HOF
    // scheme can instantiate E as Str and then Int in one caller.
    let any_text = recover_any(fn() -> Int { raise_text() })
    let any_number = recover_any(fn() -> Int { raise_number() })

    assert(recovered == 8, "open callback fail is handled")
    assert(pure == 7, "pure HOF callback remains valid")
    assert(propagated == 9, "ordinary HOF still propagates fail")
    assert(normal == 41, "closed pure handled body remains valid")
    assert(any_text == 0 && any_number == 0, "abort payload type is generalized")
    print("open-row=${recovered} pure=${pure} propagated=${propagated} normal=${normal} any=${any_text}/${any_number}")
}
