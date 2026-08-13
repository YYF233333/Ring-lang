struct Resource { id: Int }
impl Drop for Resource { fn drop(self) {} }

fn main() {
    let source = Resource { id: 5 }
    let wrapped = some(source)
    print(wrapped.is_some())
    print(source.id)
}
