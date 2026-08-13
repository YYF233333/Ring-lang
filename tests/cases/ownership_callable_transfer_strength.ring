// FORCE is internal producer/interface authority, not a fourth FnType mode.
// A body-inferred generic Move remains OWNING when transported through an
// annotated alias, a callable HParam, or a returned-callable factory.
fn forward<T>(value: T) -> T { value }

fn invoke(callback: fn(move Int) -> Int, value: Int) -> Int {
    callback(value)
}

fn make_forward() -> fn(move Int) -> Int {
    forward
}

fn main() {
    let direct_source = 7
    let direct: fn(move Int) -> Int = forward
    let direct_result = direct(direct_source)
    print("${direct_result}/${direct_source}")

    let hof_source = 8
    let hof_result = invoke(forward, hof_source)
    print("${hof_result}/${hof_source}")

    let factory_source = 9
    let callback = make_forward()
    let factory_result = callback(factory_source)
    print("${factory_result}/${factory_source}")
}
