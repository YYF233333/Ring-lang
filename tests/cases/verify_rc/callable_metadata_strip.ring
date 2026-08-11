// Live post-RC HIR carries exact callable descriptors for all three ordinary
// binder classes below. The strip-callable-metadata mutation removes only that
// authority so verify_rc must fail at parameter, let, and assignment binding.
fn plus_one(value: Int) -> Int { value + 1 }
fn plus_two(value: Int) -> Int { value + 2 }

fn apply(callback: fn(Int) -> Int, value: Int) -> Int {
    callback(value)
}

fn main() {
    let direct = plus_one
    let mut selected = direct
    selected = plus_two
    print(apply(selected, 40))
}
