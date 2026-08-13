pub mod early {
    use super::CALLBACK as callback

    pub fn invoke() -> Int {
        callback(1)
    }
}

const CALLBACK = 42

fn main() {
    print(early::invoke())
}
