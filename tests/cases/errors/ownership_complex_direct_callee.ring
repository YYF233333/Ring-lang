// expect-error: E0801
struct Resource { id: Int }
impl Drop for Resource { fn drop(self) {} }

fn consume_resource(value: Resource) -> Int {
    let owned = value
    owned.id
}

fn main() {
    let value = Resource { id: 1 }
    print((if true { consume_resource } else { consume_resource })(value))
}
