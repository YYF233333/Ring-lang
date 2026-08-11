struct Box<T> { value: T }

impl<T: Eq> Drop for Box<T> {
    fn drop(self) {
        if self.value == self.value {}
    }
}

fn main() {}
