fn consume(move value: Str) -> Int { value.len() }

fn main() {
    let source = "alive"
    let reader = fn() -> Int { source.len() }
    print(consume(source))
    print(reader())
}
