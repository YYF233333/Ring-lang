// Perceus W4 hoists the new value, drops the exact old owned slot, and then
// assigns.  Non-scalar owned reassignment therefore has no overwrite
// exemption and must verify cleanly.

fn main() {
    let mut name = "alice"
    name = "bob"
    print(name)
}
