// Test: Str.byte_at — direct character access (panics on out of bounds)
fn main() {
    let s = "hello"
    let c = s.byte_at(0)
    print(c)
    let d = s.byte_at(4)
    print(d)
}

// expect: h
// expect: o
