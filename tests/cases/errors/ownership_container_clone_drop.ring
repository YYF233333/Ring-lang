// expect-error
struct Resource { id: Int }
impl Drop for Resource { fn drop(self) {} }

fn main() {
    let list = [Resource { id: 1 }]
    let list_copy = list.clone()
    print(list_copy.len())
}
