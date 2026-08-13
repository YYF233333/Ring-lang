use facade::{forward, make_forward}

fn main() {
    let direct_source = 7
    let direct: fn(move Int) -> Int = forward
    let direct_result = direct(direct_source)
    print("${direct_result}/${direct_source}")

    let factory_source = 8
    let callback = make_forward()
    let factory_result = callback(factory_source)
    print("${factory_result}/${factory_source}")
}
