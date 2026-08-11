// expect-error: E0801
struct Resource { id: Int }
impl Drop for Resource { fn drop(self) {} }

struct OpenValue { tag: Int, resource: Resource }

fn consume_open(value: {tag: Int, ..row}) -> Int {
    let owned = value
    owned.tag
}

fn main() {
    let value = OpenValue {
        tag: 3, resource: Resource { id: 4 }
    }
    print(consume_open(value))
    print(value.resource.id)
}
