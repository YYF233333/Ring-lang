fn risky(x: Int) -> Int {
    if x > 0 { x + 1 } else { fail.raise("zero") }
}

fn main() {
    // Nested try: inner try catches fail from risky, outer try catches fail from ?
    let result = try {
        let inner = try { risky(0) }
        // inner is Option<Int> = none (risky(0) fails)
        inner?
    }
    // result is Option<Int> = none (inner? fails on none)
    let v1 = match result { some(v) => v, none => -1 }
    print(v1)

    // Non-failing inner
    let result2 = try {
        let inner2 = try { risky(5) }
        // inner2 is Option<Int> = some(6)
        inner2?
    }
    // result2 is Option<Int> = some(6)
    let v2 = match result2 { some(v) => v, none => -1 }
    print(v2)
}
