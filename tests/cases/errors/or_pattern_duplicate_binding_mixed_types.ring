// expect-error: E0301
enum Pair {
    Pair(Int, Str),
}

fn show(pair: Pair) {
    match pair {
        Pair(value, value) => print(value),
    }
}

fn main() {
    show(Pair(1, "two"))
}
