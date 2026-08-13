struct TupleStoredResource {
    id: Int
}

impl Drop for TupleStoredResource {
    fn drop(self) -> Unit {}
}

fn store_in_tuple(value: TupleStoredResource) -> (TupleStoredResource, Int) {
    (value, 1)
}

fn main() {
    let source = TupleStoredResource { id: 7 }
    let stored = store_in_tuple(source)
    print(stored.1)
    print(source.id)
}
