fn forward<T>(value: T) -> T { value }
fn consume<T>(move value: T) -> T { value }

fn main() {
    let callback = if true { forward } else { consume }
    let source = 7
    print(callback(source))
    print(source)
}
