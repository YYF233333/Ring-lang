struct Resource { id: Int }

impl Drop for Resource {
    fn drop(self) {}
}

struct CallbackHolder {
    callback: fn(Resource) -> Int
}

enum CallbackState {
    Ready { callback: fn(Resource) -> Int },
    Empty,
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
    let optional = some(consume_resource)
    match optional {
        some(callback) => print(callback(Resource { id: 1 })),
        none => {},
    }

    let tupled = (consume_resource, 2)
    let (tuple_callback, marker) = tupled
    print(tuple_callback(Resource { id: marker }))

    let holder = CallbackHolder { callback: consume_resource }
    match holder {
        CallbackHolder { callback } =>
            print(callback(Resource { id: 3 })),
    }

    let state = Ready { callback: consume_resource }
    match state {
        Ready { callback } => print(callback(Resource { id: 4 })),
        Empty => {},
    }

    let nested = some((consume_resource, 5))
    let nested_alias = nested
    if let some((callback, value)) = nested_alias {
        print(callback(Resource { id: value }))
    }

    let choice = if true {
        Left(consume_resource)
    } else {
        Right(consume_resource)
    }
    match choice {
        Left(callback) | Right(callback) =>
            print(callback(Resource { id: 6 })),
    }
}
