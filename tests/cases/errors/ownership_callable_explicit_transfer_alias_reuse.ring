fn consume<T>(move value: T) -> T { value }

fn main() {
    let callback: fn(move Int) -> Int = consume
    let source = 7
    print(callback(source))
    print(source)
}
