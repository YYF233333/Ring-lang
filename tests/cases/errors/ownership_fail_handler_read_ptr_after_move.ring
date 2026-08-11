fn consume(move value: Ptr<Int>) {}
fn observe(value: Ptr<Int>) -> Int { 0 }

fn probe(source: Ptr<Int>) -> Int {
    consume(source)
    handle {
        fail.raise(1)
    } with {
        fail.raise(error) => observe(source),
    }
}

fn main() {}
