// expect-error: E0801
struct Holder { text: Str }

fn store(value: Str) -> Holder {
    Holder { text: value }
}

fn main() {
    let source = "struct"
    let holder = store(source)
    print(holder.text)
    print(source)
}
