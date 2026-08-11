struct Resource { id: Int }

impl Drop for Resource {
    fn drop(self) {}
}

fn main() {
    let resource = Resource { id: 1 }
    let reader = fn() -> Int { resource.id }
    print(reader())
}
