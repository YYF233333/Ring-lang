struct MissingNestedIter<A> {}

impl<A> Iterator for MissingNestedIter<A> {
    type Item = A
    fn next(mut self) -> A? { none }
}

struct MissingNestedSource<A> {}

impl<A: Eq> Iterable for MissingNestedSource<A> {
    type Item = A
    type Iter = MissingNestedIter<A>
    fn iter(self) -> MissingNestedIter<A> { MissingNestedIter {} }
}

struct MissingNestedWrapper<T> {
    pub inner: MissingNestedSource<Option<T>>
}

impl<T> MissingNestedWrapper {
    delegate inner: Iterable
}

fn main() {}
