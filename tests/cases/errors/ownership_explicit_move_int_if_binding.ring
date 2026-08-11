fn consume(move value: Int) -> Int { value }

fn main() {
    let source = 8
    let taken = consume(if true { source } else { source })
    print(taken)
    print(source)
}
