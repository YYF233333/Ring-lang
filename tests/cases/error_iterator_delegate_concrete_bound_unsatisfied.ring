struct UnsatisfiedConcreteIter<T> {
    pub items: List<T>,
    pub index: Int
}

impl<T> Iterator for UnsatisfiedConcreteIter<T> {
    type Item = T
    fn next(mut self) -> T? { none }
}

struct UnsatisfiedConcreteSource<T> { pub items: List<T> }

impl<T: Hash> Iterable for UnsatisfiedConcreteSource<T> {
    type Item = T
    type Iter = UnsatisfiedConcreteIter<T>
    fn iter(self) -> UnsatisfiedConcreteIter<T> {
        UnsatisfiedConcreteIter { items: self.items, index: 0 }
    }
}

struct UnsatisfiedConcreteWrapper {
    pub inner: UnsatisfiedConcreteSource<Float>
}

impl UnsatisfiedConcreteWrapper {
    delegate inner: Iterable
}

fn main() {}
