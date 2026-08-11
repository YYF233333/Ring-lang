effect Probe {
    fn read() -> Int
}

fn consume(move value: Str) {}

fn main() {
    let source = "alive"
    let recovered = handle {
        consume(source)
        Probe.read()
    } with {
        Probe.read() => source.len(),
    }
    print(recovered)
}
