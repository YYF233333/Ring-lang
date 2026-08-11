fn consume(move value: Str) {}

fn abort_before_move(value: Str) -> Int with {fail<Str>} {
    fail.raise("stop")
    consume(value)
    0
}

fn main() {
    let text = "alive"
    let recovered = abort_before_move(text) catch { _ => 7 }
    print(recovered)
    print(text)
}
