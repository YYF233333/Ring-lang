// expect-error: E0801
struct Resource { id: Int }
impl Drop for Resource { fn drop(self) {} }

fn consume(value: Resource) -> Resource { value }

fn main() {
    let value = Resource { id: 1 }
    while true {
        let moved = consume(value)
        print(moved.id)
        continue
    }
}
