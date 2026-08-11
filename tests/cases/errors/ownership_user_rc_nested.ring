// expect-error: E0801
struct Resource { id: Int }
impl Drop for Resource { fn drop(self) {} }

struct Rc<T> { payload: T }
struct Envelope<T> { inner: T }

fn consume_nested(value: Envelope<Rc<Resource>>) -> Int {
    let owned = value
    owned.inner.payload.id
}

fn main() {
    let value = Envelope {
        inner: Rc { payload: Resource { id: 2 } }
    }
    print(consume_nested(value))
    print(value.inner.payload.id)
}
