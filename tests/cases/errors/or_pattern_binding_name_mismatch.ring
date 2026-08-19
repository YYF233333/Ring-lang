enum MismatchedChoice {
    Left(Int),
    Right(Int),
}

fn read(choice: MismatchedChoice) -> Int {
    match choice {
        Left(left) | Right(right) => left,
    }
}

fn main() {
    print(read(Left(1)))
}
