use facade::{make_consumer}

fn main() {
    let factory_source = 8
    let callback = make_consumer()
    print(callback(factory_source))
    print(factory_source)
}
