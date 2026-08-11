effect Probe {
    fn read() -> Int
}

fn consume(move value: Ptr<Int>) {}
fn observe(value: Ptr<Int>) -> Int { 0 }

fn probe(source: Ptr<Int>) -> Int {
    consume(source)
    handle {
        Probe.read()
    } with {
        Probe.read() => observe(source),
    }
}

fn main() {}
