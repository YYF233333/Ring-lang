// expect-error: E0801
struct Resource { id: Int }
impl Drop for Resource { fn drop(self) {} }

fn forward<T>(value: T) -> T { value }

fn main() {
    let values = [Resource { id: 1 }]
    let moved = forward(values)
    print(values.len())
    print(moved.len())
}
