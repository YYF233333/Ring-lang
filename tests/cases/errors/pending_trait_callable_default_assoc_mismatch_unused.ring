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

// The ground Source dictionary exists, but its Item = Int contract conflicts
// with the callback's annotated Str result.  The unused definition itself is
// the diagnostic owner; no caller final-zonk exists to rescue this check.
fn invalid_default(
    source: IntSource,
    reader: fn(IntSource) -> Str = read_source
) -> Str {
    reader(source)
}

fn main() { () }
