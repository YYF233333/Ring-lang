// Fresh spread sources are materialized before RC so their cleanup-visible
// binding is dropped after every copied field read. The skip mutation removes
// only that materialization and verify_rc must fail independently.

struct Point {
    x: Int,
    y: Int
}

fn make_point() -> Point {
    Point { x: 1, y: 2 }
}

fn main() {
    let q = Point { ..make_point(), x: 3 }
    let r = Point {
        ..{
            let source = make_point()
            source
        },
        x: 4,
    }
    print("${q.x} ${q.y} ${r.x} ${r.y}")
}
