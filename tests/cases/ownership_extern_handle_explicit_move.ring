extern type H

fn consume(move h: H) {}

fn probe(h: H) {
    consume(h)
}

fn main() {
    // `probe` is compiled through ownership planning and C lowering without
    // introducing a foreign constructor symbol or fabricating a handle.
    print("extern-move-compiled")
}
