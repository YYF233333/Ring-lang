struct Resource { id: Int }

impl Drop for Resource {
    fn drop(self) {}
}

fn raise_text() -> Int with {fail<Str>} {
    fail.raise("stop")
}

fn consume(move value: Resource) -> Int {
    value.id
}

fn main() {
    let outer = Resource { id: 10 }
    let recovered = handle {
        raise_text()
    } with {
        fail.raise(message) => message.len(),
    }
    print("handled:${recovered}")
    print("read:${outer.id}")
    print("moved:${consume(outer)}")
}
