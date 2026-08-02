trait Source {
    type Item
    fn item(self) -> Item
}

struct IntSource {}
impl Source for IntSource {
    type Item = Int
    fn item(self) -> Int { 1 }
}

fn read_source<T, S: Source<Item = T>>(source: S) -> T {
    source.item()
}

fn invalid_default(
    source: IntSource,
    reader: fn(IntSource) -> Str = read_source
) -> Str {
    reader(source)
}

fn main() {
    // The omitted argument must not be the first point that notices the bad
    // associated type, nor may invalid shared metadata cascade at this call.
    print(invalid_default(IntSource {}))
}
