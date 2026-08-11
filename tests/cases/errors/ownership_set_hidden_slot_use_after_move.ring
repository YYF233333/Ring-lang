// expect-error: E0801
struct Resource { id: Int }
impl Drop for Resource { fn drop(self) {} }

fn consume(move values: Set<Resource>) -> Int { values.len() }

fn main() {
    let mut values: Set<Resource> = set_new()
    values.insert(Resource { id: 1 })
    print(consume(values))
    print(values.len())
}
