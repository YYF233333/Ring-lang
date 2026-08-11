struct Counter { value: Int }

fn add_both(mut left: Counter, mut right: Counter) -> Unit {
    left.value = left.value + 1
    right.value = right.value + 2
}

fn invoke_both(
    callback: fn(mut Counter, mut Counter) -> Unit,
    mut left: Counter,
    mut right: Counter
) -> Unit {
    callback(left, right)
}

fn main() {
    let mut left = Counter { value: 1 }
    let mut right = Counter { value: 10 }
    invoke_both(add_both, left, right)
    print(left.value)
    print(right.value)
}
