use library::{consume}

fn make_local_consumer() -> fn(move Int) -> Int {
    consume
}

fn main() {
    let source = 4
    let callback = make_local_consumer()
    print(callback(source))
    print(source)
}
