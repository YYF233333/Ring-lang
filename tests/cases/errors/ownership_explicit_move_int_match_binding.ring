fn consume(move value: Int) -> Int { value }

fn main() {
    let source = 9
    let taken = consume(match true {
        true => source,
        false => source,
    })
    print(taken)
    print(source)
}
