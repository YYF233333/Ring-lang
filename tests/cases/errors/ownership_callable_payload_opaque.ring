// expect-error: E0801
struct Resource { id: Int }
impl Drop for Resource { fn drop(self) {} }

enum CallbackBox {
    // Match the body-inferred Move contract so this probe reaches its real
    // boundary: build_callback returns an opaque container, which cannot
    // invent producer-specific callable provenance for the extracted payload.
    Callback(fn(move Resource) -> Int),
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
