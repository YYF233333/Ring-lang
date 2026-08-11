// expect-error: E0801
struct Resource { id: Int }

impl Drop for Resource {
    fn drop(self) {}
}

fn main() {
    let mut value = Resource { id: 1 }
    let replace = fn() {
        // Mutation from a closure makes `value` an auto-boxed shared cell;
        // overwriting an owner-bearing cell must fail closed.
        value = Resource { id: 2 }
    }
    replace()
}
