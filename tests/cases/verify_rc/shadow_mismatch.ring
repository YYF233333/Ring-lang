// Exact DefIds keep these same-spelled bindings in separate RC slots, so there
// is no shadow mismatch.  The catch-produced value still exercises the
// documented effect-value exemption: lax verification accepts it and strict
// verification prints exactly that local exemption.

fn might_fail(s: Str) -> Str {
    if s == "" { fail.raise("empty") }
    s
}

fn main() {
    let x = "hello"
    let x = might_fail("ok") catch { _ => "error" }
    print(x)
}
