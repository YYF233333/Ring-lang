extern type H

fn select(
    flag: Bool, a: List<H>, b: List<H>
) -> List<H> {
    if flag { a } else { b }
}

fn probe() {
    let left: List<H> = []
    let right: List<H> = []
    let selected = select(true, left, right)
    print(selected.len())
    print(left.len())
}

fn main() {}
