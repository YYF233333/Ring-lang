// Every omitted call expands a retained block template with fresh binder IDs.
fn invoke(value: Int = {
    let base = 40
    base + 1
}) -> Int {
    value
}

fn main() {
    print(invoke())
    print(invoke())
}
