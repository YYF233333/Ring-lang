pub fn forward<T>(value: T) -> T { value }

pub fn make_forward() -> fn(move Int) -> Int {
    forward
}
