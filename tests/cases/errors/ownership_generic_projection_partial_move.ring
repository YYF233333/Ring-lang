// expect-error: E0801
struct Pair<A, B> {
    first: A,
    second: B,
}

// A and B may carry Drop. These field reads cannot become owning constructor
// inputs without a representable partial move or an illicit implicit clone.
fn swap_pair<A, B>(p: Pair<A, B>) -> Pair<B, A> {
    Pair { first: p.second, second: p.first }
}

fn main() {}
