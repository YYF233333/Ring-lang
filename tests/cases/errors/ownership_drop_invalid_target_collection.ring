// expect-error: E0801
impl<T> Drop for List<T> {
    fn drop(self) {}
}

fn main() {}
