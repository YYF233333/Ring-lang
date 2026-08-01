struct DelegateIter { pub value: Int, pub limit: Int }

impl Iterator for DelegateIter {
    type Item = Int
    fn next(mut self) -> Int? {
        if self.value < self.limit {
            let value = self.value
            self.value = self.value + 1
            some(value)
        } else {
            none
        }
    }
}

struct DelegateSource { pub limit: Int }

impl Iterable for DelegateSource {
    type Item = Int
    type Iter = DelegateIter
    fn iter(self) -> DelegateIter {
        DelegateIter { value: 0, limit: self.limit }
    }
}

struct DelegateWrapper { pub inner: DelegateSource }

impl DelegateWrapper {
    delegate inner: Iterable
}

fn main() {
    for value in (DelegateWrapper {
        inner: DelegateSource { limit: 2 }
    }) {
        print("delegate=${value}")
    }
}
