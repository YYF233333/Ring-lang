// Frontend-positive check-only coverage. Keep this fixture companion-free until
// shared OR-pattern binders are safe to execute through the C/native lane.
struct Resource { id: Int }

impl Drop for Resource {
    fn drop(self) {}
}

enum SamePathChoice {
    SamePath(fn(Resource) -> Int),
    OtherPath(fn(Resource) -> Int),
}

enum DisjointChoice {
    DisjointLeft(fn(Resource) -> Int),
    DisjointRight(fn(Resource) -> Int),
}

enum TupleChoice {
    TupleLeft((fn(Resource) -> Int, Int)),
    TupleRight((fn(Resource) -> Int, Int)),
}

enum NamedChoice {
    NamedLeft { callback: fn(Resource) -> Int, marker: Int },
    NamedRight { callback: fn(Resource) -> Int, marker: Int },
}

enum DeadGuardChoice {
    Left(fn(Resource) -> Int),
    Right(fn(Resource) -> Int),
}

fn consume_left(value: Resource) -> Int {
    let owned = value
    owned.id
}

fn consume_right(value: Resource) -> Int {
    let owned = value
    owned.id
}

fn consume(move value: Resource) -> Int {
    value.id
}

fn borrow_value(value: Resource) -> Int {
    value.id
}

fn dead_guard_or_projection(selector: Int) -> Int {
    let choice = match selector {
        0 if {
            return 0
            false
        } => Left(consume),
        _ => Right(borrow_value),
    }
    let source = Resource { id: 7 }
    let result = match choice {
        Left(callback) | Right(callback) => callback(source),
    }
    result + source.id
}

fn main() {
    let choose_left = true

    let same_path = if choose_left {
        SamePath(consume_left)
    } else {
        SamePath(consume_left)
    }
    match same_path {
        SamePath(callback) | SamePath(callback) =>
            print(callback(Resource { id: 1 })),
        OtherPath(_) => {},
    }

    let disjoint = if choose_left {
        DisjointLeft(consume_left)
    } else {
        DisjointRight(consume_right)
    }
    match disjoint {
        DisjointLeft(callback) | DisjointRight(callback) =>
            print(callback(Resource { id: 2 })),
    }

    let tupled = if choose_left {
        TupleLeft((consume_left, 3))
    } else {
        TupleRight((consume_right, 4))
    }
    match tupled {
        TupleLeft((callback, _)) | TupleRight((callback, _)) =>
            print(callback(Resource { id: 3 })),
    }

    let named = if choose_left {
        NamedLeft { callback: consume_left, marker: 5 }
    } else {
        NamedRight { callback: consume_right, marker: 6 }
    }
    match named {
        NamedLeft { callback, marker: _ } |
        NamedRight { callback, marker: _ } =>
            print(callback(Resource { id: 4 })),
    }

    print(dead_guard_or_projection(1))
}
