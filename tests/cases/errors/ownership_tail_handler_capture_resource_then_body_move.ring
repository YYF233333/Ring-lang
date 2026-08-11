effect Probe {
    fn read() -> Int
}

struct Resource { id: Int }

impl Drop for Resource {
    fn drop(self) {}
}

fn consume(move value: Resource) {}

fn main() {
    let source = Resource { id: 8 }
    let recovered = handle {
        consume(source)
        Probe.read()
    } with {
        Probe.read() => source.id,
    }
    print(recovered)
}
