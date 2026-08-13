fn plus_one(value: Int) -> Int { value + 1 }

const HIDDEN_CALLBACK = plus_one

pub mod facade {
    pub use super::HIDDEN_CALLBACK as callback
}

fn main() {
    print(facade::callback(1))
}
