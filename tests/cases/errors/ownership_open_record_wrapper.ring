// expect-error: E0801
struct Resource { id: Int }
impl Drop for Resource { fn drop(self) {} }

struct OpenValue { tag: Int, resource: Resource }
struct Wrapper<T> { value: T }

fn consume_wrapped(
    wrapped: Wrapper<{tag: Int, ..row}>
) -> Int {
    let owned = wrapped
    owned.value.tag
}

fn main() {
    let wrapped = Wrapper {
        value: OpenValue {
            tag: 5, resource: Resource { id: 6 }
        }
    }
    print(consume_wrapped(wrapped))
    print(wrapped.value.resource.id)
}
