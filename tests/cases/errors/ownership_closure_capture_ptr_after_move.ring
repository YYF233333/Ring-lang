fn consume(move value: Ptr<Int>) {}
fn observe(value: Ptr<Int>) -> Int { 0 }

fn probe(source: Ptr<Int>) {
    consume(source)
    let reader = fn() -> Int { observe(source) }
    print(reader())
}

fn main() {}
