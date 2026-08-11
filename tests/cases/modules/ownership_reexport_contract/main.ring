use facade::{Resource, move_resource}

fn main() {
    let original = Resource { id: 13 }
    let moved = move_resource(original)
    print(moved.id)
}
