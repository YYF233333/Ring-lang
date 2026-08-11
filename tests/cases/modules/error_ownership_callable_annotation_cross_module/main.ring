use library::{Resource, borrow_value}

fn main() {
    let callback: fn(move Resource) -> Int = borrow_value
    print(callback(Resource { id: 7 }))
}
