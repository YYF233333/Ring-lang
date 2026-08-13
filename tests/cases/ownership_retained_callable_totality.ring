// Retained HIR is structurally complete even when an eager control root
// returns before its dependent child. These calls must have total callable
// metadata without contributing Move/capture/return edges to the outer CFG.

enum CallbackChoice {
    Left(fn(Int) -> Int),
    Right(fn(Int) -> Int),
    Named { callback: fn(Int) -> Int },
}

effect CallbackEffect {
    fn apply(callback: fn(Int) -> Int) -> Int
}

struct RetainedResource { id: Int }

impl Drop for RetainedResource {
    fn drop(self) {}
}

fn plus_one(value: Int) -> Int { value + 1 }

fn consume_retained(move value: RetainedResource) -> Int { value.id }

fn bump_retained(mut value: Int) -> Int {
    value = value + 1
    value
}

fn make_reader() -> fn(Int) -> Int { plus_one }

fn make_reader_factory() -> fn() -> fn(Int) -> Int { make_reader }

fn dead_direct_alias() -> Int {
    if {
        return 1
        true
    } {
        let mut reader = fn(value: Int) -> Int { value + 1 }
        let alias = reader
        alias(10)
    } else {
        0
    }
}

fn dead_factory_result() -> Int {
    if {
        return 2
        true
    } {
        let reader = make_reader()
        reader(10)
    } else {
        0
    }
}

fn dead_or_pattern_binding() -> Int {
    match {
        return 3
        Left(plus_one)
    } {
        Left(callback) | Right(callback) => callback(10),
        Named { callback } => callback(10),
    }
}

fn dead_named_pattern_binding() -> Int {
    match {
        return 4
        Named { callback: plus_one }
    } {
        Named { callback } => callback(10),
        Left(callback) | Right(callback) => callback(10),
    }
}

fn dead_if_let_binding() -> Int {
    if let some(callback) = {
        return 5
        some(plus_one)
    } {
        callback(10)
    }
    0
}

fn dead_destructure_binding() -> Int {
    return 6
    let pair = (plus_one, 10)
    let (callback, value) = pair
    callback(value)
}

fn dead_interface_factory_result(
    factory: fn() -> fn(Int) -> Int
) -> Int {
    if {
        return 7
        true
    } {
        let callback = factory()
        callback(10)
    } else {
        0
    }
}

fn dead_uncalled_lambda() -> Int {
    if {
        return 8
        true
    } {
        let callback = fn(value: Int) -> Int { value + 1 }
        0
    } else {
        0
    }
}

fn dead_while_interface_factory(
    factory: fn() -> fn(Int) -> Int
) -> Int {
    while {
        return 9
        true
    } {
        let callback = factory()
        callback(10)
    }
    0
}

fn dead_for_interface_factory(
    factory: fn() -> fn(Int) -> Int
) -> Int {
    for value in {
        return 10
        0..1
    } {
        let callback = factory()
        callback(value)
    }
    0
}

fn raise_callback() -> Int with {fail<fn(Int) -> Int>} {
    fail.raise(plus_one)
}

fn raise_retained_number() -> Int with {fail<Int>} {
    fail.raise(1)
}

fn dead_catch_callable_binding() -> Int {
    if {
        return 11
        true
    } {
        raise_callback() catch { callback => callback(10) }
    } else {
        0
    }
}

fn dead_handler_callable_binding() -> Int {
    if {
        return 12
        true
    } {
        handle {
            CallbackEffect.apply(plus_one)
        } with {
            CallbackEffect.apply(callback) => callback(10),
        }
    } else {
        0
    }
}

fn dead_while_move_child(source: RetainedResource) -> Int {
    while {
        return 13
        true
    } {
        consume_retained(source)
    }
    0
}

fn dead_if_mutborrow_child(source: Int) -> Int {
    if {
        return 14
        true
    } {
        bump_retained(source)
    } else {
        0
    }
}

fn dead_match_guard_move_child(source: RetainedResource) -> Int {
    match 0 {
        0 if {
            return 15
            false
        } => consume_retained(source),
        _ => 0,
    }
}

fn dead_catch_guard_move_child(source: RetainedResource) -> Int {
    raise_retained_number() catch {
        1 if {
            return 16
            false
        } => consume_retained(source),
        _ => 0,
    }
}

fn dead_match_guard_owned_local() -> Int {
    let source = RetainedResource { id: 17 }
    match 0 {
        0 if {
            return 17
            false
        } => consume_retained(source),
        _ => 0,
    }
}

fn dead_catch_guard_owned_local() -> Int {
    let source = RetainedResource { id: 18 }
    raise_retained_number() catch {
        1 if {
            return 18
            false
        } => consume_retained(source),
        _ => 0,
    }
}

fn match_guard_pattern_miss(tag: Int) -> Int {
    let source = RetainedResource { id: 21 }
    match tag {
        0 if {
            consume_retained(source)
            return 20
            false
        } => 0,
        _ => source.id,
    }
}

fn catch_guard_pattern_miss(tag: Int) -> Int {
    // Until B-168 replaces the setjmp cleanup boundary, catch guards may not
    // Take an outer slot. This pair therefore proves only that a matching
    // Never guard executes while pattern miss still reaches the wildcard; the
    // Match pair above carries the stronger moved-state edge oracle.
    fail.raise(tag) catch {
        0 if {
            return 22
            false
        } => 0,
        _ => 23,
    }
}

fn chained_factory_result() -> Int {
    let callback = make_reader_factory()()
    callback(18)
}

fn main() {
    print(dead_direct_alias())
    print(dead_factory_result())
    print(dead_or_pattern_binding())
    print(dead_named_pattern_binding())
    print(dead_if_let_binding())
    print(dead_destructure_binding())
    print(dead_interface_factory_result(
        fn() -> fn(Int) -> Int { plus_one }))
    print(dead_uncalled_lambda())
    print(dead_while_interface_factory(
        fn() -> fn(Int) -> Int { plus_one }))
    print(dead_for_interface_factory(
        fn() -> fn(Int) -> Int { plus_one }))
    print(dead_catch_callable_binding())
    print(dead_handler_callable_binding())
    let dead_while: fn(RetainedResource) -> Int = dead_while_move_child
    let while_source = RetainedResource { id: 13 }
    print(dead_while(while_source))
    print(while_source.id)

    let dead_if: fn(Int) -> Int = dead_if_mutborrow_child
    let if_source = 14
    print(dead_if(if_source))
    print(if_source)

    let dead_match: fn(RetainedResource) -> Int =
        dead_match_guard_move_child
    let match_source = RetainedResource { id: 15 }
    print(dead_match(match_source))
    print(match_source.id)

    let dead_catch: fn(RetainedResource) -> Int =
        dead_catch_guard_move_child
    let catch_source = RetainedResource { id: 16 }
    print(dead_catch(catch_source))
    print(catch_source.id)

    print(dead_match_guard_owned_local())
    print(dead_catch_guard_owned_local())
    print(chained_factory_result())
    print(match_guard_pattern_miss(0))
    print(match_guard_pattern_miss(1))
    print(catch_guard_pattern_miss(0))
    print(catch_guard_pattern_miss(1))
}
