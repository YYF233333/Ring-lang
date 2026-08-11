pub fn bump(mut value: Int) -> Int {
    value = value + 1
    value
}

pub fn apply(callback: fn(mut Int) -> Int, mut value: Int) -> Int {
    callback(value)
    value
}
