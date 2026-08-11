// expect-error: E0801
extern type ForeignHandle

impl Drop for ForeignHandle {
    fn drop(self) {}
}

fn main() {}
