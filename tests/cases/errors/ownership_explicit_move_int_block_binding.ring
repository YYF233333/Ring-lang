fn consume(move value: Int) -> Int { value }

fn main() {
    let source = 7
    let taken = consume({ source })
    print(taken)
    print(source)
}
