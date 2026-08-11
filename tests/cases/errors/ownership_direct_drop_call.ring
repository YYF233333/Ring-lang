// expect-error: E0801
struct Resource { id: Int }

impl Drop for Resource {
    fn drop(self) {}
}

fn main() {
    let value = Resource { id: 1 }
    value.drop()
}
