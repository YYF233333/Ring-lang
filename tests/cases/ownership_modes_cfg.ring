struct Resource {
    id: Int
}

impl Drop for Resource {
    fn drop(self) {
        print("drop ${self.id}")
    }
}

impl Resource {
    fn into_resource(self) -> Resource {
        self
    }
}

trait Inspect {
    fn inspect(self) -> Int
}

impl Inspect for Resource {
    fn inspect(self) -> Int { self.id }
}

fn observe(value: Resource) -> Int {
    value.id
}

fn move_left(value: Resource) -> Resource {
    value
}

fn move_right(value: Resource) -> Resource {
    let owned = value
    owned
}

fn relay_left(value: Resource, direct: Bool) -> Resource {
    if direct { value } else { relay_right(value, true) }
}

fn relay_right(value: Resource, direct: Bool) -> Resource {
    if direct { value } else { relay_left(value, true) }
}

fn apply_reader(reader: fn(Resource) -> Int, value: Resource) -> Int {
    reader(value)
}

fn inspect_generic<T: Inspect>(value: T) -> Int {
    value.inspect()
}

fn consume_on_single_exit(value: Resource) {
    while true {
        let owned = value
        print(observe(owned))
        break
    }
}

fn raise_number() -> Int with {fail<Int>} {
    fail.raise(23)
}

fn exact_pattern_identity() {
    // Match and if-let bind same-spelled projections in child scopes. The
    // nested closures force codegen to transport those exact DefIds through
    // the closure environment instead of recapturing the outer binding.
    let selected = Resource { id: 13 }
    let wrapped = some(Resource { id: 14 })
    match wrapped {
        some(selected) => {
            let read_selected = fn() -> Int { selected.id }
            print(read_selected())
        },
        none => {}
    }
    print(observe(selected))

    let conditional = Resource { id: 15 }
    let maybe_conditional = some(Resource { id: 16 })
    if let some(conditional) = maybe_conditional {
        let read_conditional = fn() -> Int { conditional.id }
        print(read_conditional())
    }
    print(observe(conditional))

    let caught = 17
    let recovered = raise_number() catch {
        caught => {
            let read_caught = fn() -> Int { caught }
            read_caught()
        }
    }
    print(recovered)
    print(caught)
}

fn main() {
    let borrowed = Resource { id: 1 }
    print(observe(borrowed))
    print(observe(borrowed))

    let direct = Resource { id: 2 }
    let direct_result = move_left(direct)
    print(observe(direct_result))

    let method_value = Resource { id: 3 }
    let method_result = method_value.into_resource()
    print(observe(method_result))

    let function_value = if true { move_left } else { move_right }
    let aliased = Resource { id: 4 }
    let alias_result = function_value(aliased)
    print(observe(alias_result))

    let recursive = Resource { id: 5 }
    let recursive_result = relay_left(recursive, false)
    print(observe(recursive_result))

    let callback_value = Resource { id: 6 }
    let reader = fn(value: Resource) -> Int { value.id }
    print(apply_reader(reader, callback_value))
    print(observe(callback_value))

    let trait_value = Resource { id: 10 }
    print(inspect_generic(trait_value))
    print(observe(trait_value))

    let loop_value = Resource { id: 7 }
    consume_on_single_exit(loop_value)

    let mut reassigned = Resource { id: 8 }
    let old = move_right(reassigned)
    reassigned = Resource { id: 9 }
    print(observe(old))
    print(observe(reassigned))

    let shadowed = Resource { id: 11 }
    {
        let shadowed = Resource { id: 12 }
        print(observe(shadowed))
    }
    print(observe(shadowed))

    exact_pattern_identity()
}
