// B-104 D2 negative case: a match expression used as a statement (ExprStmt)
// whose arms produce fresh owned values that nobody consumes.  The verifier
// must report the documented x-cf-value class for each non-diverging arm.

fn make_str() -> Str { "hello" }

fn main() {
    let x = 1
    match x {
        1 => make_str(),
        _ => make_str(),
    }
    print("done")
}
