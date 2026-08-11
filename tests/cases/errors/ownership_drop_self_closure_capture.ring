struct Resource { id: Int }

impl Drop for Resource {
    fn drop(self) {
        let reader = fn() -> Int { self.id }
        print(reader())
    }
}

fn main() {}
