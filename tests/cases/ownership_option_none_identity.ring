fn absent<T>() -> T? { none }

fn main() {
    let value: Int? = absent()
    print(value.is_none())
}
