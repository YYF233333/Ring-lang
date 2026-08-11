// expect-error: E0801
struct Resource { id: Int }

impl Drop for Resource {
    fn drop(self) {}
}

fn consume(move value: Resource) -> Int {
    value.id
}

fn maybe_raise(enabled: Bool) -> Unit with {fail<Str>} {
    if enabled {
        fail.raise("stop")
    }
}

fn main() {
    let outer = Resource { id: 3 }
    let result = handle {
        maybe_raise(false)
        consume(outer)
    } with {
        fail.raise(message) => 0,
    }
    print(result)
}
