pub fn consume<T>(move value: T) -> T { value }

pub fn make_consumer() -> fn(move Int) -> Int {
    consume
}
