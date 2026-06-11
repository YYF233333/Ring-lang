// B-104 D2 negative case (B-109 regression instance ①): struct-field
// reassignment stores the new value WITHOUT dropping the old one (codegen
// L0 field-store convention) — the verifier must report the documented
// x-overwrite-field class at both assignments (scalar Int field — the lexer's
// `self.pos = self.pos + 1` hot path — and a non-scalar Str field), and the
// report must fail the strict gate (--verify-rc-strict exit 1).

struct Cursor {
    pos: Int,
    label: Str
}

fn advance(mut c: Cursor) {
    c.pos = c.pos + 1
    c.label = "moved"
}

fn main() {
    let mut c = Cursor { pos: 0, label: "start" }
    advance(c)
    print("${c.pos} ${c.label}")
}
