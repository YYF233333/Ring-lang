// expect-error: E0801
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

fn return_from_handler(trigger: Bool) -> Int {
    let outer = Resource { id: 12 }
    let result = handle {
        if trigger { raise_text() } else { 0 }
    } with {
        // An abort handler is lowered as a handler body, not as a second owner
        // of captured outer cleanup state.
        fail.raise(message) => return consume(outer),
    }
    result
}

fn main() {
    print(return_from_handler(true))
}
