// expect-error: E0801
struct Inner { id: Int }

impl Drop for Inner {
    fn drop(self) {}
}

struct Outer { inner: Inner }

impl Outer {
    // The builtin Drop implementation must have one authoritative body; a
    // generated delegate cannot stand in for that body.
    delegate inner: Drop
}

fn main() {}
