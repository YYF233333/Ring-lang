struct Resource { id: Int }

impl Drop for Resource {
    fn drop(self) {}
}

fn observe<T>(value: T) {}

fn read_captured<T>(value: T) {
    let reader = fn() -> Unit { observe(value) }
    reader()
}

fn main() {
    read_captured(Resource { id: 3 })
}
