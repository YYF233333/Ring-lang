// expect-error: E0801
struct Resource { id: Int }

impl Drop for Resource {
    fn drop(self) {}
}

enum CallbackBox {
    Callback(fn(move Resource) -> Int),
    Empty,
}

fn consume(move value: Resource) -> Int {
    value.id
}

fn make_box() -> CallbackBox {
    Callback(consume)
}

fn main() {
    match make_box() {
        Callback(from_pattern) => {
            // A callable projection is not an authoritative ownership source.
            // Neither a branch join nor one/two aliases may wash it clean.
            let merged = if true { from_pattern } else { consume }
            let one_hop = merged
            let two_hop = one_hop
            print(two_hop(Resource { id: 1 }))
        },
        Empty => {},
    }
}
