// Exact-DefId regression: the owned first `x` and opaque catch-result `x` are
// separate slots. Strict verification retains only the honest x-effect-value
// exemption for the catch result; shadowing itself is not a fatal mismatch.

fn might_fail(s: Str) -> Str {
    if s == "" { fail.raise("empty") }
    s
}

fn main() {
    let x = "hello"
    let x = might_fail("ok") catch { _ => "error" }
    print(x)
}
