fn find(x: Int) -> Int? {
    if x > 0 { some(x) } else { none }
}

fn main() {
    let a = find(42) or 0
    let b = find(-1) or 99
    print(a + b)
}
