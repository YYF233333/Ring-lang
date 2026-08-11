// expect-error: E0801
fn forward(value: Str) -> Str {
    value
}

fn main() {
    let source = "return"
    let moved = forward(source)
    print(moved)
    print(source)
}
