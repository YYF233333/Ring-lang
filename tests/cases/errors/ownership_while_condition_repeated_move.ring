// A while condition is re-evaluated on every normal/continue back-edge. A
// complete binding consumed by that condition cannot remain live for round 2.
struct Resource { id: Int }

impl Drop for Resource {
    fn drop(self) {}
}

fn keep_running(move value: Resource) -> Bool { value.id > 0 }

fn main() {
    let source = Resource { id: 1 }
    while keep_running(source) {
        print(1)
    }
}
