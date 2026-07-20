pub extern type ForeignHandle

pub struct TopItem { value: Int }
pub type TopCount = Int
pub fn top_value() -> Int { 41 }
pub fn make_top(value: Int) -> TopItem { TopItem { value: value } }

pub mod origin {
    pub struct Item { value: Int }

    pub enum Choice {
        Number(Int),
        Empty,
    }

    pub trait Read {
        fn read(self) -> Int
    }

    impl Read for Item {
        fn read(self) -> Int { self.value }
    }

    pub effect Signal {
        fn value() -> Int
    }

    pub effect alias Signaling = {Signal}
    pub type Count = Int

    pub fn make_item(value: Int) -> Item { Item { value: value } }
}

pub mod facade {
    pub use super::origin::{Item, Choice, Read, Signal, Signaling, Count}
    pub use super::ForeignHandle as Handle
    pub use super::TopItem as RootItem
    pub use super::TopCount as RootCount
    pub use super::top_value as value

    pub fn read_item(value: Item) -> Count { value.read() }
    pub fn read_root(value: RootItem) -> RootCount { value.value }
    pub fn signal_value() -> Int with {Signaling} { Signal.value() }
    pub fn keep_handle(value: Handle) -> Handle { value }
}
