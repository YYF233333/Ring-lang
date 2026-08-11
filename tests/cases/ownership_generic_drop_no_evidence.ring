struct Box<T> { value: T }

impl<T> Drop for Box<T> {
    fn drop(self) {}
}

fn main() {
    let value = Box { value: 7 }
    print(value.value)
}
