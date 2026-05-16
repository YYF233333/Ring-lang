// Phase 1: or expression handles fail effect
fn risky() -> Int {
    let x = 42
    x
}

fn main() {
    let result = risky() or 0
    print(result)
}
