// expect-error: E0801
struct Resource { id: Int }

fn consume(move value: Resource) {}

impl Drop for Resource {
    fn drop(self) {
        // Drop::drop owns the destruction event, but its self binding is not a
        // second transferable owner.
        consume(self)
    }
}

fn main() {}
