// B-104 D2 negative case (B-109 regression instance ②): call-result Option /
// Str temporaries in scrutinee / receiver / arg / operand positions.  The
// LIVE pass materialises + scope-end-drops every one of them (verify must be
// 0 errors); under the TEST-ONLY --rc-mutate=skip-anf degradation the
// temporaries lose their bindings and the verifier must report fatal
// leak-temp at these positions — proving an ANF-coverage regression is caught
// statically (at `npm test` time) instead of as a native memory wall.

fn classify(s: Str) -> Str {
    let mut kind = "none"
    match s.char_code_at(0) {
        some(c) => {
            if c > 96 {
                kind = "lower"
            } else {
                kind = "upper"
            }
        },
        none => {
            kind = "empty"
        },
    }
    kind
}

fn shout(s: Str) -> Int {
    s.to_upper().len()
}

fn main() {
    print(classify("ring"))
    print(classify("Ring"))
    print(classify(""))
    print("${shout("abc") + 1}")
}
