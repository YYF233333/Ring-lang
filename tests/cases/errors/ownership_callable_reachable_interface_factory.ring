// A callable returned from an interface-only factory has an exact-looking
// FnType but no producer identity. The same shape is accepted in the retained
// dead-HIR fixture; invoking it on a reachable path must fail closed.
fn invoke(factory: fn() -> fn(Int) -> Int) {
    let callback = factory()
    print(callback(1))
}

fn plus_one(value: Int) -> Int { value + 1 }

fn main() {
    invoke(fn() -> fn(Int) -> Int { plus_one })
}
