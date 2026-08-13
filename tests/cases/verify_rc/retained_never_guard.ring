// A Never-valued Match/Catch guard is evaluated and verified, but its
// dependent body has no RC edge. Pattern miss still reaches the next arm.
struct GuardResource { id: Int }

impl Drop for GuardResource {
    fn drop(self) {}
}

fn consume_guard(move value: GuardResource) -> Int { value.id }

fn raise_number() -> Int with {fail<Int>} { fail.raise(1) }

fn match_guard() -> Int {
    let source = GuardResource { id: 1 }
    match 0 {
        0 if {
            return 1
            false
        } => consume_guard(source),
        _ => 0,
    }
}

fn catch_guard() -> Int {
    let source = GuardResource { id: 2 }
    raise_number() catch {
        1 if {
            return 2
            false
        } => consume_guard(source),
        _ => 0,
    }
}

fn match_guard_pattern_miss(tag: Int) -> Int {
    let source = GuardResource { id: 4 }
    match tag {
        0 if {
            consume_guard(source)
            return 3
            false
        } => 0,
        _ => source.id,
    }
}

fn catch_guard_pattern_miss(tag: Int) -> Int {
    // Catch retains the current B-168 fail-loud boundary: taking an outer slot
    // across setjmp recovery is illegal. Keep the guard-divergence/pattern-miss
    // oracle here; Match above owns the moved-state distinction.
    fail.raise(tag) catch {
        0 if {
            return 5
            false
        } => 0,
        _ => 6,
    }
}

fn main() {
    print(match_guard())
    print(catch_guard())
    print(match_guard_pattern_miss(0))
    print(match_guard_pattern_miss(1))
    print(catch_guard_pattern_miss(0))
    print(catch_guard_pattern_miss(1))
}
