// expect-error: E0801
struct Resource { id: Int }
impl Drop for Resource { fn drop(self) {} }

fn apply_borrowed(
    callback: fn(Resource) -> Int, value: Resource
) -> Int {
    callback(value)
}

fn main() {
    let callback = fn(mut value: Resource) -> Int { value.id }
    let mut resource = Resource { id: 9 }
    print(apply_borrowed(callback, resource))
}
