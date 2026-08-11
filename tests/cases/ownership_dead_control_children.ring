// Never-valued control roots and guards do not expose their dependent bodies
// to callable-mode solving or closure-capture ownership policy. Reachable
// Move/Borrow branches remain covered by the callable factory error fixtures.

struct Resource { id: Int }
impl Drop for Resource { fn drop(self) {} }

fn consume(move value: Resource) -> Int { value.id }
fn borrow_value(value: Resource) -> Int { value.id }

fn dead_guard_factory(selector: Int) -> fn(Resource) -> Int {
    match selector {
        0 if {
            return borrow_value
            false
        } => consume,
        _ => borrow_value,
    }
}

fn dead_if_capture(source: Resource) -> Int {
    if {
        return source.id
        true
    } {
        let reader = fn() -> Int { source.id }
        reader()
    } else {
        0
    }
}

fn dead_scrutinee_capture(source: Resource) -> Int {
    match {
        return source.id
        0
    } {
        _ => {
            let reader = fn() -> Int { source.id }
            reader()
        },
    }
}

fn dead_match_guard_capture(source: Resource) -> Int {
    match 0 {
        0 if {
            return source.id
            false
        } => {
            let reader = fn() -> Int { source.id }
            reader()
        },
        _ => 0,
    }
}

fn dead_guard_let_callback(selector: Int) -> Int {
    let callback = match selector {
        0 if {
            return 0
            false
        } => consume,
        _ => borrow_value,
    }
    let source = Resource { id: 15 }
    let result = callback(source)
    result + source.id
}

fn dead_guard_var_callback(selector: Int) -> Int {
    let mut callback = match selector {
        0 if {
            return 0
            false
        } => consume,
        _ => borrow_value,
    }
    let source = Resource { id: 16 }
    let result = callback(source)
    result + source.id
}

fn main() {
    print(dead_if_capture(Resource { id: 11 }))
    print(dead_scrutinee_capture(Resource { id: 12 }))
    print(dead_match_guard_capture(Resource { id: 13 }))

    let callback = dead_guard_factory(1)
    let source = Resource { id: 14 }
    print(callback(source))
    print(source.id)
    print(dead_guard_let_callback(1))
    print(dead_guard_var_callback(1))
}
