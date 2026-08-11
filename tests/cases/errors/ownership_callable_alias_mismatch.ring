// expect-error: E0801
struct Resource { id: Int }
impl Drop for Resource { fn drop(self) {} }

fn borrow_value(value: Resource) -> Int { value.id }

fn move_value(value: Resource) -> Int {
    let owned = value
    owned.id
}

fn main() {
    let callback = if true { borrow_value } else { move_value }
    let value = Resource { id: 1 }
    print(callback(value))
}
