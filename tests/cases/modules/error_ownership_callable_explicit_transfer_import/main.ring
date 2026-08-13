use library::{make_consumer}

fn main() {
    let source = 7
    let callback = make_consumer()
    print(callback(source))
    print(source)
}
