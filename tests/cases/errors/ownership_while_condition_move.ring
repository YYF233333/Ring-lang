// expect-error: E0801
struct Resource { id: Int }
impl Drop for Resource { fn drop(self) {} }

fn consume_truth(value: Resource) -> Bool {
    let owned = value
    owned.id > 0
}

fn main() {
    let value = Resource { id: 1 }
    while consume_truth(value) {
        print("repeat")
    }
}
