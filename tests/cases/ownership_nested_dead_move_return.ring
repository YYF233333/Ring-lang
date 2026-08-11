fn consume(move value: Str) {}

fn return_before_nested_move(value: Str) {
    consume({
        return;
        value
    })
}

fn main() {
    let source = "alive"
    return_before_nested_move(source)
    print(source)
}
