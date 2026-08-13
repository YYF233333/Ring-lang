// expect-error: E0301
enum Mixed {
    Number(Int),
    Text(Str),
}

fn show(value: Mixed) {
    match value {
        Number(payload) | Text(payload) => print(payload),
    }
}

fn main() {
    show(Number(1))
}
