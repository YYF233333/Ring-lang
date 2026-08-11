use library::{Resource, OpenValue, consume_open}

fn main() {
    let value = OpenValue {
        tag: 7, resource: Resource { id: 8 }
    }
    print(consume_open(value))
    print(value.resource.id)
}
