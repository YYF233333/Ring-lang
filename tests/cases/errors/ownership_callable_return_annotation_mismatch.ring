// expect-error: E0801
struct Resource { id: Int }
impl Drop for Resource { fn drop(self) {} }

fn borrow_value(value: Resource) -> Int { value.id }

fn bad_factory() -> fn(move Resource) -> Int {
    borrow_value
}

fn main() {
    print(bad_factory()(Resource { id: 6 }))
}
