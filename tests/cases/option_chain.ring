// Test: Option chaining with ? operator in various contexts

fn find_user(id: Int) -> Option<Str> {
    if id == 1 { some("alice") }
    else if id == 2 { some("bob") }
    else { none }
}

fn find_age(name: Str) -> Option<Int> {
    if name == "alice" { some(30) }
    else { none }
}

// Chain of ? operations — returns Option via fail effect
fn get_user_age(id: Int) -> Int {
    let name = find_user(id)?
    let age = find_age(name)?
    age
}

// ? with method calls
fn first_positive(xs: List<Int>) -> Int {
    let found = xs.find(fn(x) { x > 0 })?
    found * 10
}

fn main() {
    // Successful chain — use try to capture result as Option
    let age1 = try { get_user_age(1) }
    assert(age1.unwrap_or(0) == 30, "chain success")

    // First ? fails
    let age3 = try { get_user_age(3) }
    assert(age3.is_none(), "chain fail at first")

    // Second ? fails (bob has no age)
    let age2 = try { get_user_age(2) }
    assert(age2.is_none(), "chain fail at second")

    // ? with method calls
    let pos = try { first_positive([-1, -2, 5, 3]) }
    assert(pos.unwrap_or(0) == 50, "? with method chain")

    let no_pos = try { first_positive([-1, -2]) }
    assert(no_pos.is_none(), "? with method chain none")

    // catch as alternative to try+unwrap
    let age_or = get_user_age(1) catch { _ => -1 }
    assert(age_or == 30, "catch with ? chain success")

    let age_or_fail = get_user_age(99) catch { _ => -1 }
    assert(age_or_fail == -1, "catch with ? chain fail")

    print("option_chain: all tests passed")
}
