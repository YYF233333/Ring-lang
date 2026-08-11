// expect-error: E0801
struct Resource { id: Int }
impl Drop for Resource { fn drop(self) {} }

struct Wrapper<T> { value: T }

fn consume(value: Wrapper<Resource>) -> Wrapper<Resource> {
    value
}

fn main() {
    let wrapped = Wrapper { value: Resource { id: 1 } }
    let moved = consume(wrapped)
    print(wrapped.value.id)
    print(moved.value.id)
}
