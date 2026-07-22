use defs

fn identity(value: facade::Count) -> facade::Count { value }

fn choice_value(value: facade::Choice) -> Int {
    match value {
        facade::Choice::Number(n) => n,
        facade::Choice::Empty => 0,
    }
}

fn main() {
    let item = facade::make_item(identity(7))
    print(facade::read_item(item))
    print(facade::read_root(make_top(8)))
    print(facade::value())
    print(choice_value(facade::Choice::Number(9)))
    let parsed = facade::parse_number("42")
    match parsed {
        some(value) => print(value),
        none => print(-1),
    }
}
