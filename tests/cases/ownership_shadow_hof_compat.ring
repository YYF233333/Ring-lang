// `some` owns its payload, so a higher-order parameter transporting that exact
// constructor must spell the same Move contract.  The caller retains its local
// by passing a fresh Int expression rather than relying on a legacy callable
// compatibility shim.
fn apply_option(
    constructor: fn(move Int) -> Option<Int>,
    move value: Int
) -> Option<Int> {
    constructor(value)
}

fn main() {
    let original = 41
    match apply_option(some, original + 0) {
        some(value) => print(value),
        none => print(-1),
    }
    print(original + 1)
}
