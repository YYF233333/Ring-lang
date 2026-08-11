// expect-error: E0801
struct Resource { id: Int }

impl Drop for Resource {
    fn drop(self) {}
}

fn replace_borrowed(mut value: Resource) {
    value = Resource { id: 2 }
}

fn main() {
    let value = Resource { id: 1 }
    replace_borrowed(value)
}
