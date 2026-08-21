// Exact-DefId regression: same-spelled bindings own distinct cleanup slots.
// The verifier must accept both values without a shared-name overwrite.

fn main() {
    let s = "hello"
    let s = "world"
    print(s)
}
