// B-100 Phase 1.3 adversarial: Set.any — no method_to_runtime mapping,
// JS backend inlines via for-of; LLVM path falls to user-impl lookup.
fn main() {
    let mut s: Set<Str> = set_new()
    s.insert("hello")
    s.insert("world")
    let has_long = s.any(fn(v) { v.len() > 4 })
    print("any_long=${has_long}")
    let has_short = s.any(fn(v) { v.len() < 3 })
    print("any_short=${has_short}")
}
