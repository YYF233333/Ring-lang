// expect-error: E0801
struct Resource { id: Int }
impl Drop for Resource { fn drop(self) {} }

enum CallbackBox {
    Callback(fn(Resource) -> Int),
    Empty,
}

fn consume_resource(value: Resource) -> Int {
    let owned = value
    owned.id
}

fn build_callback() -> CallbackBox {
    Callback(consume_resource)
}

fn main() {
    match build_callback() {
        Callback(callback) =>
            print(callback(Resource { id: 1 })),
        Empty => {},
    }
}
