// expect-error: E0801
fn consume(move value: Str) -> Int { value.len() }

fn main() {
    let text = "moved"
    print(consume(text))
    print(text)
}
