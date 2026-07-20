use defs

fn identity(value: facade::Count) -> facade::Count { value }

fn main() {
    let item = origin::make_item(identity(7))
    print(facade::read_item(item))
    print(facade::read_root(make_top(8)))
    print(facade::value())
}
