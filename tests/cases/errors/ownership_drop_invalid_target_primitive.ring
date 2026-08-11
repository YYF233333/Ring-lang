// expect-error: E0801
impl Drop for Str {
    fn drop(self) {}
}

fn main() {}
