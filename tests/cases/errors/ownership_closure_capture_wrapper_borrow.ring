struct Resource { id: Int }

impl Drop for Resource {
    fn drop(self) {}
}

struct Wrapper { value: Resource }

fn main() {
    let wrapped = Wrapper { value: Resource { id: 2 } }
    let reader = fn() -> Int { wrapped.value.id }
    print(reader())
}
