struct Resource { id: Int }

impl Drop for Resource {
    fn drop(self) {}
}

fn raise_text() -> Int with {fail<Str>} {
    fail.raise("again")
}

fn consume(move value: Resource) -> Int {
    value.id
}

fn main() {
    let outer = Resource { id: 13 }
    let recovered = handle {
        handle {
            raise_text()
        } with {
            fail.raise(message) => {
                print("handler-read:${outer.id}")
                fail.raise(message)
            },
        }
    } with {
        fail.raise(message) => message.len(),
    }
    print("handled:${recovered}")
    print("outer-read:${outer.id}")
    print("outer-moved:${consume(outer)}")
}
