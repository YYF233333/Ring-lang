// The prelude contains generic read/take bindings whose unnamed TypeVar result
// needs the exact FreshOwnedSlotResult role. Live RC must drop those results;
// role/drop mutations must fail independently in verify_rc.
fn main() {
    let values = ["one", "two", "three"]
    let first = values.first()
    match first {
        some(value) => print(value),
        none => print("none"),
    }
}
