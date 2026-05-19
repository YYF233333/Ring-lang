// Test: Str.byte_at — returns Option<Str>, none for out of bounds
fn main() {
    let s = "hello"
    match s.byte_at(0) {
        some(c) => print(c),
        none => print("none"),
    }
    match s.byte_at(4) {
        some(c) => print(c),
        none => print("none"),
    }
    match s.byte_at(100) {
        some(c) => print(c),
        none => print("none"),
    }
}

// expect: h
// expect: o
// expect: none
