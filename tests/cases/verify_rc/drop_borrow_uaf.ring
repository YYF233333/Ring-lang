// B-104 D2 negative case (UAF direction): all parameters BORROW (design.md
// §7.11 point 4) — the callee never drops a parameter.  Under the TEST-ONLY
// --rc-mutate=drop-params degradation every function body additionally Drops
// its params; the verifier must report fatal uaf-drop-borrow — proving a
// drop-of-borrow regression in the pass is caught at compile time, before it
// reaches ASan / a native crash.  The LIVE pass must verify clean (0 errors).

fn describe(name: Str, age: Int) -> Str {
    "${name}:${age}"
}

fn main() {
    let n = "ada"
    print(describe(n, 36))
}
