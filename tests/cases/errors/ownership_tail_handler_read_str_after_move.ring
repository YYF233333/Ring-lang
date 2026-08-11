effect Probe {
    fn read() -> Int
}

fn consume(move value: Str) {}

fn main() {
    let source = "moved"
    consume(source)
    let recovered = handle {
        Probe.read()
    } with {
        Probe.read() => source.len(),
    }
    print(recovered)
}
