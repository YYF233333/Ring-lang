// expect-error: E0207
struct Resource { id: Int }
impl Drop for Resource { fn drop(self) {} }

struct Ptr { resource: Resource }

fn main() {
    let value = Ptr { resource: Resource { id: 1 } }
    print(value.resource.id)
}
