// expect-error: E0801
struct Resource { id: Int }
impl Drop for Resource { fn drop(self) {} }

fn consume(value: Resource) -> Resource { value }

fn main() {
    let captured = Resource { id: 1 }
    let closure = fn() -> Resource { consume(captured) }
    let moved = closure()
    print(moved.id)
}
