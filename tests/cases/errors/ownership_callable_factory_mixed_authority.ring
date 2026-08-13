// One exact local factory cannot wash an interface-only sibling out of a
// callable alias set. Callable-return provenance is an ALL-path proof.
struct Resource { id: Int }

impl Drop for Resource {
    fn drop(self) {}
}

fn consume(move value: Resource) -> Int { value.id }

fn make_consumer() -> fn(move Resource) -> Int { consume }

fn invoke(other: fn() -> fn(move Resource) -> Int) {
    let factory = if true { make_consumer } else { other }
    let callback = factory()
    print(callback(Resource { id: 1 }))
}

fn main() {
    invoke(fn() -> fn(move Resource) -> Int { consume })
}
