// expect-error: E0801
struct Resource { id: Int }

impl Drop for Resource {
    fn drop(self) {}
}

enum CallbackChoice {
    Left(fn(Resource) -> Int),
    Right(fn(Resource) -> Int),
}

fn consume_resource(value: Resource) -> Int {
    let owned = value
    owned.id
}

fn main() {
    let choose_left = true
    let choice = if choose_left {
        Left(consume_resource)
    } else {
        Right(consume_resource)
    }
    match choice {
        Left(callback) | Right(_) =>
            print(callback(Resource { id: 1 })),
    }
}
