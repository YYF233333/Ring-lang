// expect-error: E0801
struct Resource { id: Int }
impl Drop for Resource { fn drop(self) {} }

fn borrow_value(value: Resource) -> Int { value.id }

fn apply_mut(
    callback: fn(mut Resource) -> Int,
    mut value: Resource
) -> Int {
    callback(value)
}

fn main() {
    let mut value = Resource { id: 4 }
    print(apply_mut(borrow_value, value))
}
