// Test: Str supplementary methods — pad_start, repeat, char_code_at
fn main() {
    let s = "42"
    let padded = s.pad_start(5, "0")
    print(padded)

    let r = "ab".repeat(3)
    print(r)

    let code = "A".char_code_at(0)
    print(code)
}

// expect: 00042
// expect: ababab
// expect: 65
