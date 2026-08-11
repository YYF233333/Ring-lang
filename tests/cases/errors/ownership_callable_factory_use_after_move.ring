// expect-error: E0801
struct Resource { id: Int }
impl Drop for Resource { fn drop(self) {} }

fn consume(move value: Resource) -> Int { value.id }

fn make_consumer() -> fn(move Resource) -> Int { consume }

fn main() {
    let value = Resource { id: 2 }
    print(make_consumer()(value))
    print(value.id)
}
