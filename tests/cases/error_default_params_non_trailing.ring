// B-069: Non-trailing default parameter should be rejected (E0106)

fn bad(a: Int = 10, b: Int) -> Int {
    a + b
}

fn main() {
    print(bad(1, 2).to_str())
}
