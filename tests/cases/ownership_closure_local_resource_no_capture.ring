struct Resource { id: Int }

impl Drop for Resource {
    fn drop(self) {}
}

fn main() {
    let run = fn() -> Int {
        let local = Resource { id: 4 }
        let nested = fn() -> Int { 0 }
        local.id + nested()
    }
    print(run())
}
