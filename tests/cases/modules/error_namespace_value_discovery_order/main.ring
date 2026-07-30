use other::{V as OtherRoot}
use fast::{V as FastRoot}
use slow::{V as SlowRoot}

pub mod target {
    pub use other::{V}
}

pub mod target {
    pub use slow::{V}
    pub use fast::{V}
}

fn main() {}
