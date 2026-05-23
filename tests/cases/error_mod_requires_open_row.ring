// expect-error: E0408
// A function that accepts a callback with unspecified effects
// should be rejected by mod requires {} because its effect row
// is open (polymorphic), meaning it could propagate any effect.

mod safe requires {} {
    pub fn apply(f: fn() -> Int) -> Int { f() }
}
