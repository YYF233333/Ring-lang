// B-104 D2 negative case: `let _ = <owned>` discards a fresh owned value
// without a drop.  The verifier must report the documented x-discard class.

fn make() -> Str { "value" }

fn main() {
    let _ = make()
    print("done")
}
