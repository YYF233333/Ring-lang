fn consume(move value: Ptr<Int>) {}
fn observe(value: Ptr<Int>) {}

fn probe(source: Ptr<Int>) {
    consume(source)
    observe(source)
}

fn main() {}
