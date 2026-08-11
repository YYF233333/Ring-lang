fn consume(move value: Str) {}

fn main() {
    let source = "moved"
    consume(source)
    let recovered = handle {
        fail.raise(1)
    } with {
        fail.raise(error) => source.len(),
    }
    print(recovered)
}
