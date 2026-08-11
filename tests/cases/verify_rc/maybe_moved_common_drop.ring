// A Move edge clears the source slot to null.  When another reachable edge
// leaves that exact owned slot live, the unconditional Perceus scope Drop is
// both necessary and sufficient: it releases the live edge and is a no-op on
// the moved edge.
struct Resource {
    id: Int
}

impl Drop for Resource {
    fn drop(self) {}
}

fn consume(value: Resource) -> Resource {
    value
}

fn consume_truth(value: Resource) -> Bool {
    let moved = consume(value)
    moved.id >= 0
}

fn if_common_drop(flag: Bool) {
    let value = Resource { id: 1 }
    if flag {
        let moved = consume(value)
        print(moved.id)
    }
}

fn match_common_drop(selector: Int) {
    let value = Resource { id: 2 }
    match selector {
        0 => {
            let moved = consume(value)
            print(moved.id)
        },
        _ => {}
    }
}

fn guard_common_drop(selector: Int) {
    let value = Resource { id: 3 }
    match selector {
        0 if consume_truth(value) => {},
        _ => {}
    }
}

fn if_let_common_drop(flag: Bool) {
    let value = Resource { id: 4 }
    let marker = if flag { some(1) } else { none }
    if let some(_) = marker {
        let moved = consume(value)
        print(moved.id)
    }
}

fn break_common_drop(run: Bool) {
    let value = Resource { id: 5 }
    while run {
        let moved = consume(value)
        print(moved.id)
        break
    }
}

fn nested_break_common_drop(outer: Bool, inner: Bool) {
    let value = Resource { id: 6 }
    while outer {
        while inner {
            let moved = consume(value)
            print(moved.id)
            break
        }
        break
    }
}

fn multiple_break_common_drop(run: Bool, take_first: Bool) {
    let value = Resource { id: 7 }
    while run {
        if take_first {
            let moved = consume(value)
            print(moved.id)
            break
        }
        break
    }
}

fn main() {
    if_common_drop(true)
    if_common_drop(false)
    match_common_drop(0)
    match_common_drop(1)
    guard_common_drop(0)
    guard_common_drop(1)
    if_let_common_drop(true)
    if_let_common_drop(false)
    break_common_drop(true)
    break_common_drop(false)
    nested_break_common_drop(true, true)
    nested_break_common_drop(true, false)
    nested_break_common_drop(false, true)
    multiple_break_common_drop(true, true)
    multiple_break_common_drop(true, false)
    multiple_break_common_drop(false, true)
}
