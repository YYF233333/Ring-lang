// expect-error: E0801
struct Resource { id: Int }
impl Drop for Resource { fn drop(self) {} }

fn consume(move values: Map<Str, Resource>) -> Int { values.len() }

fn main() {
    let mut values: Map<Str, Resource> = map_new()
    values.insert("one", Resource { id: 1 })
    print(consume(values))
    print(values.len())
}
