fn consume(move value: Str) {}

fn read_then_return(value: Str) -> Int {
    return value.len()
    consume(value)
}

fn main() {
    let text = "alive"
    print(read_then_return(text))
    print(text)
}
