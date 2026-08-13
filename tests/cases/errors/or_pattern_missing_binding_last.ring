// expect-error: E0301
enum Choice {
    Left(Int),
    Right(Int),
}

fn value(choice: Choice) -> Int {
    match choice {
        Left(value) | Right(_) => value,
    }
}

fn main() {
    print(value(Right(2)))
}
