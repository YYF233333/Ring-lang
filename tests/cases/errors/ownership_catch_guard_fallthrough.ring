// expect-error: E0801
struct Resource { id: Int }
impl Drop for Resource { fn drop(self) {} }

fn consume_truth(value: Resource) -> Bool {
    let owned = value
    owned.id > 0
}

fn raise_number() -> Int with {fail<Int>} {
    fail.raise(1)
}

fn main() {
    let value = Resource { id: 1 }
    let result = raise_number() catch {
        1 if consume_truth(value) => 1,
        _ => value.id,
    }
    print(result)
}
