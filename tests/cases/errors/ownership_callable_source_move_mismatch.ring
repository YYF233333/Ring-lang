// expect-error: E0801
struct Resource { id: Int }
impl Drop for Resource { fn drop(self) {} }

fn borrow_value(value: Resource) -> Int { value.id }
fn move_value(move value: Resource) -> Int { value.id }

fn invoke_move(
    callback: fn(move Resource) -> Int,
    move value: Resource
) -> Int {
    callback(value)
}

fn main() {
    // The rejected HOF constraint must not rewrite borrow_value globally. A
    // direct borrow remains reusable, and an independent exact Move call still
    // receives its ordinary Take edge.
    let direct = Resource { id: 10 }
    print(borrow_value(direct))
    print(direct.id)

    let consumed = Resource { id: 11 }
    print(move_value(consumed))

    let value = Resource { id: 1 }
    print(invoke_move(borrow_value, value))
}
