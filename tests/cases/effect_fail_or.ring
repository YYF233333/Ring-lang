// Test: fail effect with or (catch default), combining with Option

fn divide(a: Int, b: Int) -> Int {
    if b == 0 {
        fail.raise("division by zero")
    }
    a / b
}

fn safe_divide(a: Int, b: Int) -> Int {
    divide(a, b) or -1
}

fn main() {
    // or catches fail effect
    assert(safe_divide(10, 2) == 5, "safe div success")
    assert(safe_divide(10, 0) == -1, "safe div catch")

    // or with option
    let x: Int? = some(42)
    let y: Int? = none
    assert((x or 0) == 42, "option or some")
    assert((y or 0) == 0, "option or none")

    // try with fail
    let r1 = try { divide(10, 2) }
    assert(r1.unwrap_or(-1) == 5, "try success")
    let r2 = try { divide(10, 0) }
    assert(r2.is_none(), "try fail becomes none")

    print("effect_fail_or: all tests passed")
}
