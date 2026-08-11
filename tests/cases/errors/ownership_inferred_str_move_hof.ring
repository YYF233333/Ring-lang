// expect-error: E0801
fn store(value: Str) -> List<Str> {
    [value]
}

fn invoke(
    callback: fn(move Str) -> List<Str>,
    value: Str
) -> List<Str> {
    callback(value)
}

fn main() {
    let source = "hof"
    let values = invoke(store, source)
    print(values[0])
    print(source)
}
