trait ConsumeDefault {
    fn consume_default(self, move value: Int) -> Int {
        value
    }
}

struct Host {}
impl ConsumeDefault for Host {}

fn main() {
    let host = Host {}
    let source = 7
    print(host.consume_default(source))
    print(source)
}
