use library::{Resource, make_consumer}

fn main() {
    let value = Resource { id: 3 }
    print(make_consumer()(value))
    print(value.id)
}
