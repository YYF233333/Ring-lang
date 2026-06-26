// B-104 D2 negative case: struct spread copies the source's field pointers
// raw (no dup) — a fresh-owned spread source leaks.  The verifier must
// report the documented x-spread class when the spread source is owned.

struct Point {
    x: Int,
    y: Int
}

fn make_point() -> Point {
    Point { x: 1, y: 2 }
}

fn main() {
    let q = Point { ..make_point(), x: 3 }
    print("${q.x} ${q.y}")
}
