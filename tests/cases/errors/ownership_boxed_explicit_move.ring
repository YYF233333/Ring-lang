// expect-error: E0801
fn consume(move value: Str) {}

fn main() {
    let mut value = "live"
    let writer = fn() { value = "updated" }
    consume(value)
    writer()
}
