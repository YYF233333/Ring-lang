// B-104 D2 negative case: non-scalar mut-var reassignment leaks the old
// value (W4 covers scalars only).  The verifier must report the documented
// x-overwrite-var class at the reassignment.

fn main() {
    let mut name = "alice"
    name = "bob"
    print(name)
}
