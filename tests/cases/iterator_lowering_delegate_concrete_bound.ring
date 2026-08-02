struct ConcreteDelegateIter<T> {
    pub items: List<T>,
    pub index: Int
}

impl<T> Iterator for ConcreteDelegateIter<T> {
    type Item = T
    fn next(mut self) -> T? {
        if self.index < self.items.len() {
            let value = self.items.get(self.index)
            self.index = self.index + 1
            value
        } else {
            none
        }
    }
}

struct ConcreteDelegateSource<T> { pub items: List<T> }

impl<T: Hash> Iterable for ConcreteDelegateSource<T> {
    type Item = T
    type Iter = ConcreteDelegateIter<T>
    fn iter(self) -> ConcreteDelegateIter<T> {
        ConcreteDelegateIter { items: self.items, index: 0 }
    }
}

struct ConcreteDelegateWrapper {
    pub inner: ConcreteDelegateSource<Int>
}

impl ConcreteDelegateWrapper {
    delegate inner: Iterable
}

fn main() {
    for value in (ConcreteDelegateWrapper {
        inner: ConcreteDelegateSource { items: [5, 7] }
    }) {
        print("concrete=${value}")
    }
}
