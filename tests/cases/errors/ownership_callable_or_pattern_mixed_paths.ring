// expect-error: E0801
struct Resource { id: Int }

impl Drop for Resource {
    fn drop(self) {}
}

enum CallbackChoice {
    Left(fn(Resource) -> Int, Int),
    Right(Int, fn(Resource) -> Int),
}

fn observe_resource(value: Resource) -> Int {
    value.id
}

fn consume_resource(value: Resource) -> Int {
    let owned = value
    owned.id
}

fn main() {
    let choose_left = true
    let choice = if choose_left {
        Left(observe_resource, 1)
    } else {
        Right(2, consume_resource)
    }
    match choice {
        Left(callback, _) | Right(_, callback) =>
            print(callback(Resource { id: 3 })),
    }
}
