fn find(x: Int) -> Int? {
    if x > 0 { some(x) } else { none }
}

fn use_find() -> Int {
    let v = find(42)?
    v + 1
}

fn main() {
    let result = use_find() or 0
    print(result)
}
