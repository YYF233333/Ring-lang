// Test: trait with generic functions (not generic impl target)

trait Summable {
    fn total(self) -> Int
}

struct Scores {
    values: List<Int>,
}

impl Summable for Scores {
    fn total(self) -> Int {
        self.values.fold(0, fn(acc, x) { acc + x })
    }
}

struct Counts {
    a: Int,
    b: Int,
}

impl Summable for Counts {
    fn total(self) -> Int {
        self.a + self.b
    }
}

fn show_total<T: Summable>(x: T) -> Str {
    "total=${x.total()}"
}

fn main() {
    let s = Scores { values: [10, 20, 30] }
    assert(s.total() == 60, "scores total")
    assert(show_total(s) == "total=60", "show total scores")

    let c = Counts { a: 7, b: 3 }
    assert(c.total() == 10, "counts total")
    assert(show_total(c) == "total=10", "show total counts")

    print("trait_generic_impl: all tests passed")
}
