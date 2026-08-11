// B-104 D2 negative case: assignment to a (mut) parameter overwrites a value
// owned by the caller.  The verifier must report the documented
// x-overwrite-param class at the assignment.

fn update(mut s: Str) {
    s = "updated"
    print(s)
}

fn main() {
    update("original")
}
