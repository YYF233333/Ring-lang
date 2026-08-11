// expect-error: E0207
struct Resource { id: Int }
impl Drop for Resource { fn drop(self) {} }

struct Ptr { resource: Resource }
struct Wrapper { value: Ptr }

fn main() {
    let wrapped = Wrapper {
        value: Ptr { resource: Resource { id: 2 } }
    }
    print(wrapped.value.resource.id)
}
