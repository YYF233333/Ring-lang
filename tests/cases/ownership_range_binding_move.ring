fn consume(move value: Int) -> Int { value }

fn main() {
    let mut total = 0
    for i in 0..4 {
        total = total + consume(i)
    }
    print(total)
}
