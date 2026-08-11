struct Resource { id: Int }

impl Drop for Resource {
    fn drop(self) {}
}

fn main() {
    let resource = Resource { id: 6 }
    let read_local = fn() -> Int {
        let resource = Resource { id: 7 }
        resource.id
    }
    print(read_local())
    print(resource.id)
}
