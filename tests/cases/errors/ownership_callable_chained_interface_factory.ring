// A second callable-valued result cannot wash out the interface-only root of a
// nested factory chain. Each call-result DefId must retain producer authority.
fn invoke(factory: fn() -> fn() -> fn(Int) -> Int) {
    let callback = factory()()
    print(callback(1))
}

fn plus_one(value: Int) -> Int { value + 1 }
fn make_reader() -> fn(Int) -> Int { plus_one }

fn main() {
    invoke(fn() -> fn() -> fn(Int) -> Int { make_reader })
}
