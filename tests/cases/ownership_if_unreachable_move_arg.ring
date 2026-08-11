fn consume(move value: Str) -> Int {
    value.len()
}

fn consume_selected(value: Str, enabled: Bool) -> Int {
    consume(if enabled { value } else { return 0 })
}

fn main() {
    print(consume_selected("if", true))
    print(consume_selected("unused", false))
}
