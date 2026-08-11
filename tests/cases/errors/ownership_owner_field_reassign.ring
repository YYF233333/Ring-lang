// expect-error: E0801
struct Resource { id: Int }

impl Drop for Resource {
    fn drop(self) {}
}

struct Holder { resource: Resource }

fn main() {
    let mut holder = Holder { resource: Resource { id: 1 } }
    holder.resource = Resource { id: 2 }
}
