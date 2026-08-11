// B-104 Range edge ownership: Break must carry an explicit HIR Drop for the
// fresh counter binding, while Continue must reach the backend increment-label
// cleanup without an earlier Drop.

fn break_edge() -> Int {
    let mut total = 0
    for i in 0..5 {
        if i == 3 { break }
        total = total + i
    }
    total
}

fn continue_edge() -> Int {
    let mut total = 0
    for i in 0..5 {
        if i == 2 { continue }
        total = total + i
    }
    total
}

fn main() {
    print(break_edge() + continue_edge())
}
