// expect-error: E0802
struct Resource { id: Int }
impl Drop for Resource { fn drop(self) {} }

struct Wrapper { value: Resource }

impl Clone for Wrapper {
    fn clone(self) -> Wrapper { self }
}

fn main() {}
