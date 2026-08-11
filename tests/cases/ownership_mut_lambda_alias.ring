struct Resource { id: Int }

impl Drop for Resource {
    fn drop(self) {}
}

fn main() {
    let callback = fn(mut value: Resource) -> Int { value.id }
    let alias = callback
    let mut resource = Resource { id: 8 }
    print(callback(resource))
    print(alias(resource))
    print(resource.id)
}
