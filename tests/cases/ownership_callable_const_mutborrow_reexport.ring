fn bump(mut value: Int) -> Int {
    value = value + 1
    value
}

const CALLBACK: fn(mut Int) -> Int = bump

pub mod facade {
    pub use super::CALLBACK as callback
}

fn main() {
    let mut value = 10
    assert(facade::callback(value) == 11, "call result")
    assert(value == 11, "mut borrow writeback")
    print("ownership_callable_const_mutborrow_reexport: all tests passed")
}
