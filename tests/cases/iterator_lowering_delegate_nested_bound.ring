struct NestedDelegateIter<A> {
    pub items: List<A>,
    pub index: Int
}

impl<A> Iterator for NestedDelegateIter<A> {
    type Item = A
    fn next(mut self) -> A? {
        if self.index < self.items.len() {
            let value = self.items.get(self.index)
            self.index = self.index + 1
            value
        } else {
            none
        }
    }
}

struct NestedSource<A> { pub items: List<A> }

impl<A: Eq> Iterable for NestedSource<A> {
    type Item = A
    type Iter = NestedDelegateIter<A>
    fn iter(self) -> NestedDelegateIter<A> {
        NestedDelegateIter { items: self.items, index: 0 }
    }
}

struct NestedWrapper<T> {
    pub inner: NestedSource<Option<T>>
}

impl<T: Eq> NestedWrapper {
    delegate inner: Iterable
}

fn main() {
    let wrapper: NestedWrapper<Int> = NestedWrapper {
        inner: NestedSource { items: [some(1), none] }
    }
    for value in wrapper {
        match value {
            some(number) => print("nested=${number}"),
            none => print("nested=none")
        }
    }
}
