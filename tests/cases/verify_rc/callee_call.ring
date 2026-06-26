// B-104 D2 negative case: a callee that is itself a Call (e.g. f()(x)) stays
// a conservative borrow (anf_borrow) — the intermediate closure leaks.  The
// verifier must report the documented x-callee-call class.

fn make_adder(n: Int) -> fn(Int) -> Int {
    fn(x: Int) -> Int { x + n }
}

fn main() {
    let result = make_adder(5)(10)
    print("${result}")
}
