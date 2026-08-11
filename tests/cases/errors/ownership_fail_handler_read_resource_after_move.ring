struct Resource { id: Int }

impl Drop for Resource {
    fn drop(self) {}
}

fn consume(move value: Resource) {}

fn main() {
    let source = Resource { id: 3 }
    consume(source)
    let recovered = handle {
        fail.raise(1)
    } with {
        fail.raise(error) => source.id,
    }
    print(recovered)
}
