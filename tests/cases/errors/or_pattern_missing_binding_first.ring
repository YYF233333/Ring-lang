// expect-error: E0301
enum Choice {
    Left(Int),
    Right(Int),
}

fn value(choice: Choice) -> Int {
    match choice {
        Left(_) | Right(value) => value,
    }
}

fn main() {
    print(value(Left(1)))
}
