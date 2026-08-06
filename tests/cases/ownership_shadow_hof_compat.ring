// Unit 1 is transport-only: `some` already carries a Move parameter contract,
// while source `fn(Int) -> Option<Int>` still has the legacy borrow shape.
// Passing it through an ordinary HOF must keep checking and native generation
// compatible until callable inference/finalization is enabled atomically.
fn apply_option(
    constructor: fn(Int) -> Option<Int>,
    value: Int
) -> Option<Int> {
    constructor(value)
}

fn main() {
    let original = 41
    match apply_option(some, original) {
        some(value) => print(value),
        none => print(-1),
    }
    print(original + 1)
}
