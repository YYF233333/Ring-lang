struct Resource { id: Int }

impl Drop for Resource {
    fn drop(self) {}
}

struct Factory {}

impl Factory {
    fn unwrap(self) -> Resource {
        Resource { id: 10 }
    }
}

fn main() {
    let resource = Factory {}.unwrap()
    print(resource.id)
}
