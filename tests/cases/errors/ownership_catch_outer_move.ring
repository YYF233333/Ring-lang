// expect-error: E0801
struct Resource { id: Int }
impl Drop for Resource { fn drop(self) {} }

fn consume(value: Resource) -> Resource { value }

fn main() {
    let outer = Resource { id: 1 }
    let moved = consume(outer) catch { _ => Resource { id: 2 } }
    print(moved.id)
}
