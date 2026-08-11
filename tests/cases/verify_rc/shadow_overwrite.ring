// Exact DefIds give same-spelled lexical bindings independent RC slots.  This
// regression proves that shadowing does not revive the retired shared-alloca
// overwrite exemption.

fn main() {
    let s = "hello"
    let s = "world"
    print(s)
}
