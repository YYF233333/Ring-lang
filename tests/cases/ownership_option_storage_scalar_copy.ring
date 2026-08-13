// `some` is an owning storage edge, not a programmer-declared logical FORCE:
// concrete scalar payloads copy into the new enum box and remain reusable.
fn main() {
    let source = 7
    let wrapped = some(source)
    print(source)
    match wrapped {
        some(value) => print(value),
        none => print(-1)
    }
}
