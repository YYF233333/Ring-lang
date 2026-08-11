// expect-error: E0801
struct Resource { id: Int }

impl Drop for Resource {
    fn drop(self) {}
}

fn consume(move value: Resource) -> Int {
    value.id
}

fn main() {
    let outer = Resource { id: 11 }
    let normal = true
    let result = handle {
        if normal { consume(outer) } else { fail.raise("abort") }
    } with {
        fail.raise(message) => message.len(),
    }
    print(result)
    print(outer.id)
}
