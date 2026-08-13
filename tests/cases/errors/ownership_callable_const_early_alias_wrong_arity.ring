pub mod early {
    use super::CALLBACK as callback

    pub fn invoke() -> Int {
        callback()
    }
}

fn plus_one(value: Int) -> Int { value + 1 }

const CALLBACK = plus_one

fn main() {
    print(early::invoke())
}
