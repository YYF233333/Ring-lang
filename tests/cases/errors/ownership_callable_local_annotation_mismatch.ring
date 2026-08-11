// expect-error: E0801
struct Resource { id: Int }
impl Drop for Resource { fn drop(self) {} }

fn borrow_value(value: Resource) -> Int { value.id }

fn main() {
    let callback: fn(move Resource) -> Int = borrow_value
    print(callback(Resource { id: 5 }))
}
