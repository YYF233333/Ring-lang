struct DelegateBoundIter<T> {
    pub items: List<T>,
    pub index: Int
}

impl<T> Iterator for DelegateBoundIter<T> {
    type Item = T
    fn next(mut self) -> T? { none }
}

struct DelegateBoundSource<T> { pub items: List<T> }

impl<T: Hash> Iterable for DelegateBoundSource<T> {
    type Item = T
    type Iter = DelegateBoundIter<T>
    fn iter(self) -> DelegateBoundIter<T> {
        DelegateBoundIter { items: self.items, index: 0 }
    }
}

struct DelegateBoundWrapper<T> {
    pub inner: DelegateBoundSource<T>
}

impl<T> DelegateBoundWrapper {
    delegate inner: Iterable
}

fn main() {
    for value in (DelegateBoundWrapper {
        inner: DelegateBoundSource { items: [1.5] }
    }) {
        print(value)
    }
}
