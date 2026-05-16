// Phase 1: catch expression with error binding
fn risky() -> Int {
    42
}

fn main() {
    let result = risky() catch fn(e) { 0 }
    print(result)
}
