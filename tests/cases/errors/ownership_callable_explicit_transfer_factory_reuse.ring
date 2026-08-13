fn consume<T>(move value: T) -> T { value }
fn make_consumer() -> fn(move Int) -> Int { consume }

fn main() {
    let callback = make_consumer()
    let source = 7
    print(callback(source))
    print(source)
}
