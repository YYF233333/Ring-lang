// #206 regression: catch arm guards must be evaluated.
// NOTE: guards that reference the catch-bound variable (e.g. `x if x > 10`)
// are broken in the JS backend (binding emitted after guard eval) — tracked
// separately. These tests use outer variables in guards to avoid that bug.

fn risky(n: Int) -> Str {
    fail.raise(n)
}

fn test_guard_basic() {
    let threshold = 42
    let result = risky(10) catch {
        _ if threshold > 100 => "big",
        _ if threshold > 10 => "medium",
        _ => "small",
    }
    assert(result == "medium", "threshold=42 should be medium, got ${result}")
}

fn test_guard_first() {
    let threshold = 200
    let result = risky(10) catch {
        _ if threshold > 100 => "big",
        _ if threshold > 10 => "medium",
        _ => "small",
    }
    assert(result == "big", "threshold=200 should be big, got ${result}")
}

fn test_guard_fallthrough() {
    let threshold = 3
    let result = risky(10) catch {
        _ if threshold > 100 => "big",
        _ if threshold > 10 => "medium",
        _ => "small",
    }
    assert(result == "small", "threshold=3 should be small, got ${result}")
}

fn test_guard_with_binding() {
    // Guard uses outer variable, binding captures the error value
    let flag = true
    let result = risky(99) catch {
        x if flag => x.to_str(),
        _ => "fallback",
    }
    assert(result == "99", "flag=true should give '99', got ${result}")
}

fn test_guard_false_binding() {
    let flag = false
    let result = risky(99) catch {
        x if flag => x.to_str(),
        _ => "fallback",
    }
    assert(result == "fallback", "flag=false should give 'fallback', got ${result}")
}

fn main() {
    test_guard_basic()
    test_guard_first()
    test_guard_fallthrough()
    test_guard_with_binding()
    test_guard_false_binding()
    print("catch_arm_guard: all tests passed")
}
