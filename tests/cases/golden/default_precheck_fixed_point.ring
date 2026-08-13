// Defaults are declaration metadata, not discarded-body diagnostics. Mutual
// recursion must converge after both defaults publish, and an inline import
// used inside a default must retain its exact callable authority when copied
// into a const owner.

fn left(n: Int = 0) -> Int {
    if n == 0 { 10 } else { right(n - 1) }
}

fn right(n: Int = 0) -> Int {
    if n == 0 { 20 } else { left(n - 1) }
}

// The owner body itself must see the provisional default tuple. The omitted
// recursive edge is retained for checking but not taken by this runtime call.
fn self_seeded(n: Int = 30) -> Int {
    if n == 30 { n } else { self_seeded() }
}

fn mutual_seeded_left(n: Int = 40) -> Int {
    if n == 40 { n } else { mutual_seeded_right() }
}

fn mutual_seeded_right(n: Int = 50) -> Int {
    if n == 50 { n } else { mutual_seeded_left() }
}

// Tarjan visits this two-node SCC in peer-first order. The right default needs
// the left header to insert `1`, constrain T=Int and discharge Eq before any
// body summary is authoritative.
fn generic_seed_left<T: Eq>(value: T = 1) -> Int {
    if false { generic_seed_right() } else { 70 }
}

fn generic_seed_right(value: Int = generic_seed_left()) -> Int {
    if false { generic_seed_left() } else { value + 10 }
}

fn identity<T>(move value: T) -> T { value }

struct DefaultBox<A> {
    marker: A
}

impl<A> DefaultBox {
    // The registration scheme owns A before this method's T. Default-template
    // normalization must use the explicit method-type-parameter offset.
    fn apply<T>(self, value: T, callback: fn(move T) -> T = identity) -> T {
        callback(value)
    }
}

struct MethodSeedBox { marker: Int }

impl MethodSeedBox {
    fn a<T: Eq>(self, value: T = 1) -> Int {
        if false { self.b() } else { 80 }
    }

    fn b(self, value: Int = MethodSeedBox { marker: 0 }.a()) -> Int {
        if false { self.a() } else { value + 10 }
    }
}

struct SeedA { marker: Int }
struct SeedB<T> { marker: Int }

impl SeedA {
    fn value(self, fallback: Int = SeedB { marker: 0 }.value()) -> Int {
        fallback
    }
}

impl<T: Eq> SeedB {
    fn value(self, fallback: T = 1) -> Int {
        if false { SeedA { marker: 0 }.value() } else { 2 }
    }
}

fn pure(value: Int) -> Int { value }

pub mod inline_default {
    use super::{pure}
    use super::{identity as q}

    fn select(value: Int = pure(40)) -> Int {
        value + 2
    }

    pub const STORED = self::select()

    pub fn apply<T>(value: T, callback: fn(move T) -> T = q) -> T {
        callback(value)
    }
}

// No local call expands this default. Pruning its template-only scheme cache
// must not delete q's independent public re-export authority.
pub mod unused_default_export {
    pub use super::{identity as q}

    pub fn apply<T>(value: T, callback: fn(move T) -> T = q) -> T {
        callback(value)
    }
}

fn main() {
    print(left())
    print(right())
    print(self_seeded())
    print(mutual_seeded_left())
    print(mutual_seeded_right())
    print(generic_seed_right())
    print(DefaultBox { marker: "outer" }.apply(60))
    print(DefaultBox { marker: 0 }.apply("method"))
    print(MethodSeedBox { marker: 0 }.b())
    print(SeedA { marker: 0 }.value())
    print(inline_default::STORED)
    print(inline_default::apply("alias"))
}
