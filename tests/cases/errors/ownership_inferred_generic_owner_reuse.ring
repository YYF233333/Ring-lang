struct Resource { id: Int }
impl Drop for Resource { fn drop(self) {} }

fn forward<T>(value: T) -> T { value }

fn main() {
    let source = Resource { id: 9 }
    let returned = forward(source)
    print(returned.id)
    print(source.id)
}
