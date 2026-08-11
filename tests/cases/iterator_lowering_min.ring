struct TinyCounter { pub value: Int, pub max: Int }

impl Iterator for TinyCounter {
    type Item = Int
    fn next(mut self) -> Int? {
        if self.value < self.max {
            let value = self.value
            self.value = self.value + 1
            some(value)
        } else {
            none
        }
    }
}

impl Iterable for TinyCounter {
    type Item = Int
    type Iter = TinyCounter
    // Iterable.iter is a Borrow interface. Return an independent iterator
    // value instead of silently strengthening the implementation to Move.
    fn iter(self) -> TinyCounter { self.clone() }
}

fn main() {
    let mut total = 0
    for value in (TinyCounter { value: 0, max: 3 }) {
        total = total + value
    }
    print(total)
}
