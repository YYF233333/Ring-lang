// expect-error: E0801
enum Either<L, R> {
    Left(L),
    Right(R),
}

// Match payload bindings borrow projections of the scrutinee. Returning an
// unresolved R would transfer that projection without a whole-binding Take.
fn get_right_or<L, R>(value: Either<L, R>, default: R) -> R {
    match value {
        Left(left) => default,
        Right(right) => right,
    }
}

fn main() {}
