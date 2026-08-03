// B-104 ANF regression case: a callee that is itself a Call (e.g. f()(x)) is a
// fresh callable value.  anf_callee must materialise and scope-drop that
// intermediate closure; RC verification must remain fatal-clean.  If the
// materialisation regresses, verify_rc reports fatal leak-temp.

fn make_adder(n: Int) -> fn(Int) -> Int {
    fn(x: Int) -> Int { x + n }
}

fn main() {
    let result = make_adder(5)(10)
    print("${result}")
}
