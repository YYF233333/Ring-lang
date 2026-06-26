// B-104 D2 negative case (fatal): re-binding a name flips droppability on the
// shared alloca — the first let produces a droppable (K_OWNED) binding, the
// second let (a catch value) produces a non-droppable (K_NONOWNED) binding.
// The scope-end drop from the first classification frees a non-owned value.
// The verifier must report the fatal uaf-shadow-mismatch class (and the
// consequent uaf-drop-borrow on the scope-end Drop).

fn might_fail(s: Str) -> Str {
    if s == "" { fail.raise("empty") }
    s
}

fn main() {
    let x = "hello"
    let x = might_fail("ok") catch { _ => "error" }
    print(x)
}
