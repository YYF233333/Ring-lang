// Handler arms are runtime closures. Mutable captures must share their cell
// with the enclosing scope, across multiple arms and nested handler scopes.
effect Accumulate {
    fn add(delta: Int) -> Unit
    fn add_twice(delta: Int) -> Unit
}

effect NestedBump {
    fn bump(delta: Int) -> Unit
}

fn run_accumulate() {
    Accumulate.add(1)
    Accumulate.add_twice(2)
    Accumulate.add(3)
}

fn main() {
    let mut arm_total = 0
    handle {
        run_accumulate()
    } with {
        Accumulate.add(delta) => {
            arm_total = arm_total + delta
            arm_total = arm_total + 10
        },
        Accumulate.add_twice(delta) => {
            arm_total = arm_total + delta
            arm_total = arm_total + delta
        },
    }
    assert(arm_total == 28, "multiple arms share repeated mutable updates")

    let mut outer_total = 0
    let mut inner_total = 0
    handle {
        NestedBump.bump(1)
        handle {
            NestedBump.bump(2)
        } with {
            NestedBump.bump(delta) => {
                inner_total = inner_total + delta
                inner_total = inner_total + 20
            },
        }
        NestedBump.bump(3)
    } with {
        NestedBump.bump(delta) => {
            outer_total = outer_total + delta
            outer_total = outer_total + 10
        },
    }
    assert(outer_total == 24, "outer handler keeps its mutable capture")
    assert(inner_total == 22, "nested handler keeps its mutable capture")

    let mut closure_total = 0
    let bump_closure = fn(delta: Int) {
        closure_total = closure_total + delta
        closure_total = closure_total + 1
    }
    bump_closure(4)
    closure_total = closure_total + 2
    assert(closure_total == 7, "adjacent ordinary closure keeps its own depth")

    print("effect_handler_mut_capture: all tests passed")
}
