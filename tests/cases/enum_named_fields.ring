// Test: Enum named fields — declaration, construction, pattern matching, punning

enum Shape {
    Circle { radius: Int },
    Rect { width: Int, height: Int },
    Point,
}

fn area(s: Shape) -> Int {
    match s {
        Circle { radius } => radius * radius * 3,
        Rect { width, height } => width * height,
        Point => 0,
    }
}

fn main() {
    let c = Circle { radius: 5 }
    let r = Rect { width: 3, height: 4 }
    let p = Point

    assert(area(c) == 75)
    assert(area(r) == 12)
    assert(area(p) == 0)

    // Explicit binding in pattern (not punning)
    match r {
        Rect { width: w, height: h } => {
            assert(w == 3)
            assert(h == 4)
        },
        _ => assert(false),
    }

    // Partial match with ..
    match c {
        Circle { .. } => assert(true),
        _ => assert(false),
    }

    // Construction with punning
    let w = 10
    let h = 20
    let r2 = Rect { width: w, height: h }
    assert(area(r2) == 200)

    print("enum_named_fields: all tests passed")
}
