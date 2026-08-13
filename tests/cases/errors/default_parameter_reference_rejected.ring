// Call-site default expansion cannot transport a callee parameter DefId. It
// must reject this form until preceding arguments are materialized once.

fn select(value: Int, fallback: Int = value) -> Int {
    fallback
}

// Recovery must pop select's parameter scope before checking later owners.
fn value() -> Int { 2 }
const AFTER = value()

fn main() {
    print(AFTER)
    // The retained default-owner failure projects ErrorType only after its
    // full transaction rolls back, so this use must not cascade with an
    // unrelated "expects 2 arguments" diagnostic.
    print(select(1))
}
