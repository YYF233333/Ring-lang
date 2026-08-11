fn alias_length(value: Str) -> Int {
    // A plain non-Drop alias acquires an RC share; it is not a Move sink.
    let alias = value
    alias.len()
}

fn main() {
    let source = "shared"
    print(alias_length(source))
    print(source)
}
