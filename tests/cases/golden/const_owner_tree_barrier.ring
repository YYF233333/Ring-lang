// Whole-tree const owners must complete in source preorder while function
// bodies remain delayed across ancestor module boundaries.

pub mod earlier {
    pub const N = 1
}

const FROM_EARLIER = earlier::N

pub mod forward_body {
    pub fn read_late() -> Int {
        super::LATE
    }
}

const LATE = 2

pub mod nested_retry {
    pub mod inner {
        pub const N = 3
    }

    const STORED = self::read_inner()

    fn read_inner() -> Int {
        inner::N
    }

    pub fn value() -> Int { self::STORED }
}

fn main() {
    print(FROM_EARLIER)
    print(forward_body::read_late())
    print(nested_retry::value())
}
