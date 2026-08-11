struct Resource { id: Int }

impl Drop for Resource {
    fn drop(self) {}
}

fn main() {
    let outer = fn() -> Int {
        let local = Resource { id: 5 }
        let inner = fn() -> Int { local.id }
        inner()
    }
    print(outer())
}
