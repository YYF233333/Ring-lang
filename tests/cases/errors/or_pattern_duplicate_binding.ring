// expect-error: E0301
enum Pair {
    Left(Int, Int),
    Right(Int, Int),
}

fn value(pair: Pair) -> Int {
    match pair {
        Left(value, value) | Right(value, value) => value,
    }
}

fn main() {
    print(value(Left(1, 2)))
}
