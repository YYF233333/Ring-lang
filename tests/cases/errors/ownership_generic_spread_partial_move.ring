// expect-error: E0801
struct Pair<A, B> {
    first: A,
    second: B,
}

// The explicit first field is a whole-binding move, but the spread would copy
// an unknown B projection out of p. B may carry Drop, so that copy is rejected.
fn replace_first<A, B>(p: Pair<A, B>, first: A) -> Pair<A, B> {
    Pair { ..p, first: first }
}

fn main() {}
