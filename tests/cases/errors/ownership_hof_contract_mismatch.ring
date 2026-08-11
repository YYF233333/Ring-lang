// expect-error: E0801
struct Resource { id: Int }
impl Drop for Resource { fn drop(self) {} }

fn move_value(value: Resource) -> Int {
    let owned = value
    owned.id
}

fn apply(callback: fn(Resource) -> Int, value: Resource) -> Int {
    callback(value)
}

fn main() {
    let value = Resource { id: 1 }
    print(apply(move_value, value))
}
