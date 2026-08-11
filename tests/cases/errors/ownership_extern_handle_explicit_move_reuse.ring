extern type H

fn consume(move h: H) {}

fn probe(h: H) {
    consume(h)
    consume(h)
}

fn main() {}
