// Test: generic struct declaration, construction, field access, methods

struct Pair<A, B> {
    first: A,
    second: B,
}

struct Wrapper<T> {
    value: T,
}

fn wrap<T>(x: T) -> Wrapper<T> {
    Wrapper { value: x }
}

// Whole generic bindings may be reordered without projecting a potentially
// Drop-bearing field out of an aggregate.
fn swap_pair<A, B>(first: A, second: B) -> Pair<B, A> {
    Pair { first: second, second: first }
}

fn main() {
    // Basic generic struct
    let p = Pair { first: 1, second: "hello" }
    assert(p.first == 1, "pair first")
    assert(p.second == "hello", "pair second")

    // Generic function with struct
    // This concrete Pair has only non-may-own fields, so its projections are
    // ordinary borrowed reads that may cross the two Move edges by RC dup.
    let q = swap_pair(p.first, p.second)
    assert(q.first == "hello", "swap first")
    assert(q.second == 1, "swap second")

    // Nested generic structs
    let w = wrap(Pair { first: true, second: 42 })
    assert(w.value.first == true, "nested generic")
    assert(w.value.second == 42, "nested generic 2")

    // Generic struct with same type for both params
    let p2 = Pair { first: 10, second: 20 }
    assert(p2.first + p2.second == 30, "same type pair")

    // Wrapper around a list
    let wl = Wrapper { value: [1, 2, 3] }
    assert(wl.value.len() == 3, "wrapper of list")

    print("generic_struct: all tests passed")
}
