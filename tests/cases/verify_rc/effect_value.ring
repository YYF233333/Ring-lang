// B-104 D2 negative case: a catch expression value (TryCatch) is never owned
// by its binding (abort-path aliasing, B-002).  The verifier must report the
// documented x-effect-value class for the non-droppable binding.

fn might_fail(s: Str) -> Str {
    if s == "" { fail.raise("empty") }
    s
}

fn main() {
    let result = might_fail("ok") catch { _ => "error" }
    print(result)
}
