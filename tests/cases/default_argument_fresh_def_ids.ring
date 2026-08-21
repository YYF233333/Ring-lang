enum DefaultChoice {
    DefaultLeft(Int),
    DefaultRight(Int),
}

fn default_recover() -> Int with {fail<Int>} {
    fail.raise(0)
}

// Every omitted call expands a retained template containing source, lambda,
// capture, loop, catch, or-pattern, destructure and if-let binders. The two
// expansions must never reuse any of those exact identities or boxed metadata.
fn invoke(value: Int = {
    let mut base = 40
    let add = fn(delta: Int) -> Int { base + delta }
    base = add(1)
    for step in 0..1 {
        base = base + step
    }
    let caught = default_recover() catch { error => base + error }
    let selected = match DefaultLeft(caught) {
        DefaultLeft(payload) | DefaultRight(payload) => payload,
    }
    let (answer, _) = (selected, 0)
    let mut result = 0
    if let some(iflet_value) = some(answer) {
        result = iflet_value
    }
    result
}) -> Int {
    value
}

fn main() {
    print(invoke())
    print(invoke())
}
