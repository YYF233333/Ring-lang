// A default HIR expression is a template. Each omitted call must receive its
// own local-binding identities rather than copying the template DefIds.

fn invoke(value: Int = {
    let base = 40
    base + 1
}) -> Int {
    value
}

fn identity<T>(move value: T) -> T { value }

fn apply_default<T>(
    value: T,
    callback: fn(move T) -> T = identity
) -> T {
    callback(value)
}

// The retained template itself is not executable HIR. Its lambda authority
// must be pruned when no caller expands the default.
fn unused_default(
    callback: fn(Int) -> Int = fn(value: Int) -> Int { value }
) -> Int {
    0
}

const FIRST = invoke()
const SECOND = invoke()

fn main() {
    print(FIRST)
    print(SECOND)
    print(apply_default(7))
    print(apply_default("generic"))
}
