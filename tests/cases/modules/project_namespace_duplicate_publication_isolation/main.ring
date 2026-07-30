pub mod same {
    fn hidden() -> Int { 7 }
}

pub mod same {
    pub use self::{hidden}
}

fn main() {
    print(same::hidden())
}
