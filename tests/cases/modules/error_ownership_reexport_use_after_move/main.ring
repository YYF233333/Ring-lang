use facade::{Resource, move_resource}

fn main() {
    let original = Resource { id: 14 }
    let moved = move_resource(original)
    print(original.id)
    print(moved.id)
}
