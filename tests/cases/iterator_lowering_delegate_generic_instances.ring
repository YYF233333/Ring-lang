struct DelegateGenericIter<T> {
    pub items: List<T>,
    pub index: Int
}

impl<T> Iterator for DelegateGenericIter<T> {
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

struct DelegateGenericSource<T> { pub items: List<T> }

impl<T: Hash> Iterable for DelegateGenericSource<T> {
    type Item = T
    type Iter = DelegateGenericIter<T>
    fn iter(self) -> DelegateGenericIter<T> {
        DelegateGenericIter { items: self.items, index: 0 }
    }
}

struct DelegateGenericWrapper<T> {
    pub inner: DelegateGenericSource<T>
}

impl<T> DelegateGenericWrapper {
    delegate inner: Iterable
}

fn print_ints(wrapper: DelegateGenericWrapper<Int>) {
    for value in wrapper { print("int=${value}") }
}

fn print_strs(wrapper: DelegateGenericWrapper<Str>) {
    for value in wrapper { print("str=${value}") }
}

fn main() {
    print_ints(DelegateGenericWrapper {
        inner: DelegateGenericSource { items: [1, 2] }
    })
    print_strs(DelegateGenericWrapper {
        inner: DelegateGenericSource { items: ["a", "b"] }
    })
    print_strs(DelegateGenericWrapper {
        inner: DelegateGenericSource { items: ["c", "d"] }
    })
    print_ints(DelegateGenericWrapper {
        inner: DelegateGenericSource { items: [3, 4] }
    })
}
