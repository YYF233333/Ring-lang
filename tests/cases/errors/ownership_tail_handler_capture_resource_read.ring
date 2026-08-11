struct Resource {
    id: Int
}

impl Drop for Resource {
    fn drop(self) {}
}

effect Probe {
    fn read() -> Int
}

fn main() {
    let source = Resource { id: 7 }
    let result = handle {
        Probe.read()
    } with {
        Probe.read() => source.id,
    }
    print(result)
}
