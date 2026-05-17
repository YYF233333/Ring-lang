fn find(x: Int) -> Int? {
    if x > 0 { some(x) } else { none }
}

fn try_find(x: Int) -> Int {
    let v = find(x)?
    v + 1
}

fn main() {
    let a = try_find(-1) or 99
    let b = try_find(5) or 99
    print(a)
    print(b)
}
