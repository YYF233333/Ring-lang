// expect-error: E0801
struct Resource { id: Int }
impl Drop for Resource { fn drop(self) {} }

struct Rc<T> { payload: T }

fn consume_rc(value: Rc<Resource>) -> Int {
    let owned = value
    owned.payload.id
}

fn main() {
    let value = Rc { payload: Resource { id: 1 } }
    print(consume_rc(value))
    print(value.payload.id)
}
