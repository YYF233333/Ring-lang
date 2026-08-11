// expect-error: E0801
struct Resource { id: Int }

impl Drop for Resource {
    fn drop(self) {}
}

fn consume(move value: Resource) -> Int {
    value.id
}

fn invoke_factory(factory: fn() -> fn(move Resource) -> Int) {
    // A callable produced by an interface-only factory call is opaque even
    // though its FnType carries an exact-looking nested contract.
    let from_factory = factory()
    let merged = if true { from_factory } else { consume }
    let alias = merged
    print(alias(Resource { id: 2 }))
}

fn main() {
    invoke_factory(fn() -> fn(move Resource) -> Int { consume })
}
