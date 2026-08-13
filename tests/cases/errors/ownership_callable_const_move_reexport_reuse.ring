fn consume(move value: Int) -> Int { value }

const CALLBACK: fn(move Int) -> Int = consume

pub mod facade {
    pub use super::CALLBACK as callback
}

fn main() {
    let source = 7
    print(facade::callback(source))
    print(source)
}
