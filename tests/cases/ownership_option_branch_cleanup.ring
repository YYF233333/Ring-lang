// A binding whose reachable producers are owned `some(...)` values and the
// exact immortal Option::none singleton must be scope-end dropped.  The Drop
// is observable only on owned paths; all-none paths remain no-op, and a
// diverging path is neutral rather than poisoning the reachable owner.

struct Resource {
    id: Int
}

impl Drop for Resource {
    fn drop(self) {
        print("drop ${self.id}")
    }
}

fn if_choice(flag: Bool) {
    let chosen: Resource? = if flag {
        some(Resource { id: 10 })
    } else {
        none
    }
    print(chosen.is_some())
}

fn match_choice(selector: Int) {
    let chosen: Resource? = match selector {
        0 => none,
        _ => some(Resource { id: 20 })
    }
    print(chosen.is_some())
}

fn all_none(flag: Bool) {
    let chosen: Resource? = if flag { none } else { none }
    print(chosen.is_none())
}

fn diverge_or_owned(flag: Bool) {
    let chosen: Resource? = if flag {
        some(Resource { id: 30 })
    } else {
        panic("unreachable fixture branch")
    }
    print(chosen.is_some())
}

fn early_return(flag: Bool) {
    let chosen: Resource? = if flag {
        some(Resource { id: 40 })
    } else {
        none
    }
    if flag { return }
    print(chosen.is_none())
}

fn option_none_var_only() {
    let mut wrapped: Resource? = none
    print(wrapped.is_none())
}

// The first two cleanup-active W4 sites in declaration order deliberately
// target this same exact slot. Mutation ordinal 1 removes the Some overwrite
// Drop; ordinal 2 removes the re-armed reset-to-none Drop.
fn option_reset_none() {
    let mut wrapped: Resource? = none
    wrapped = some(Resource { id: 90 })
    wrapped = none
    print(wrapped.is_none())
}

fn option_resource_normal() {
    let mut wrapped: Resource? = none
    wrapped = some(Resource { id: 50 })
    print(wrapped.is_some())
}

fn option_resource_early() {
    let mut wrapped: Resource? = none
    wrapped = some(Resource { id: 51 })
    print("resource early")
    return
}

fn resource_map(id: Int) -> Map<Int, Resource> {
    let mut values: Map<Int, Resource> = map_new()
    values.insert(id, Resource { id: id })
    values
}

fn option_map_normal() {
    let mut wrapped: Map<Int, Resource>? = none
    wrapped = some(resource_map(60))
    print(wrapped.is_some())
}

fn option_map_early() {
    let mut wrapped: Map<Int, Resource>? = none
    wrapped = some(resource_map(61))
    print("map early")
    return
}

fn option_conditional(flag: Bool) {
    let mut wrapped: Resource? = none
    if flag {
        wrapped = some(Resource { id: 70 })
    }
    print(wrapped.is_some())
}

fn option_loop(count: Int) {
    let mut wrapped: Resource? = none
    let mut i = 0
    while i < count {
        wrapped = some(Resource { id: 80 + i })
        i = i + 1
    }
    print(wrapped.is_some())
}

fn option_fresh_bool_tail() -> Bool {
    let mut wrapped: Resource? = none
    wrapped = some(Resource { id: 100 })
    true
}

fn option_nested_fresh_tail() -> Bool {
    let mut wrapped: Resource? = none
    wrapped = some(Resource { id: 101 })
    {
        let local = "nested"
        true
    }
}

fn option_shadow() {
    let mut wrapped: Resource? = none
    wrapped = some(Resource { id: 110 })
    {
        let mut wrapped: Resource? = none
        wrapped = some(Resource { id: 111 })
        print(wrapped.is_some())
    }
    print(wrapped.is_some())
}

fn direct_some_control() {
    let wrapped = some(Resource { id: 120 })
    print(wrapped.is_some())
}

fn borrowed_str_block(value: Str) {
    {
        let mut wrapped: Resource? = none
        value
    }
    print(value)
}

fn option_cleanup_fail() -> Bool with {fail<Int>} {
    fail.raise(1)
}

fn option_catch_borrow() {
    let mut wrapped: Resource? = none
    wrapped = some(Resource { id: 130 })
    let caught = option_cleanup_fail() catch {
        _ => wrapped.is_some()
    }
    print(caught)
    print(wrapped.is_some())
}

fn main() {
    if_choice(true)
    if_choice(false)
    match_choice(1)
    match_choice(0)
    all_none(true)
    all_none(false)
    diverge_or_owned(true)
    early_return(true)
    early_return(false)
    option_none_var_only()
    option_resource_normal()
    option_resource_early()
    option_map_normal()
    option_map_early()
    option_conditional(true)
    option_conditional(false)
    option_loop(0)
    option_loop(1)
    option_loop(3)
    option_reset_none()
    print(option_fresh_bool_tail())
    print(option_nested_fresh_tail())
    option_shadow()
    direct_some_control()
    borrowed_str_block("borrowed str")
    option_catch_borrow()
    print("done")
}
