// expect-error: E0801
fn store(value: Str) -> List<Str> {
    [value]
}

fn main() {
    let source = "list"
    let values = store(source)
    print(values[0])
    print(source)
}
