// expect-error: E0801
struct Resource { id: Int }
impl Drop for Resource { fn drop(self) {} }

struct Wrapper { value: Resource }

fn consume(value: Resource) -> Resource { value }

fn main() {
    let wrapped = Wrapper { value: Resource { id: 1 } }
    let moved = consume(wrapped.value)
    print(moved.id)
}
