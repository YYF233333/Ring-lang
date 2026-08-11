effect Probe {
    fn read() -> Int
}

struct Resource { id: Int }

impl Drop for Resource {
    fn drop(self) {}
}

fn consume(move value: Resource) {}

fn main() {
    let source = Resource { id: 6 }
    consume(source)
    let recovered = handle {
        Probe.read()
    } with {
        Probe.read() => source.id,
    }
    print(recovered)
}
