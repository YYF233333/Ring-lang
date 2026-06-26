// B-104 D2 negative case: re-binding a live owned name in the same scope
// (variable shadowing on a shared alloca) leaks the previous value.  The
// verifier must report the documented x-shadow-overwrite class.

fn main() {
    let s = "hello"
    let s = "world"
    print(s)
}
