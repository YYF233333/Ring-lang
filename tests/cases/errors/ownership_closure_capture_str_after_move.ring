fn consume(move value: Str) -> Int { value.len() }

fn main() {
    let source = "moved"
    print(consume(source))
    let reader = fn() -> Int { source.len() }
    print(reader())
}
