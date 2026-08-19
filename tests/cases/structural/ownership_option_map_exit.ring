// Compile-only S′ fixture. Generated C proves that only exact Option::none
// mutable slots with no-op escape tails join the existing cleanup path.

extern type CleanupHandle

struct CleanupResource {
    id: Int
}

impl Drop for CleanupResource {
    fn drop(self) {}
}

struct BorrowedFlags {
    ready: Bool
}

fn cleanup_fresh_bool_tail() -> Bool {
    let mut wrapped: CleanupResource? = none
    wrapped = some(CleanupResource { id: 1 })
    true
}

fn cleanup_nested_fresh_tail() -> Bool {
    let mut wrapped: CleanupResource? = none
    wrapped = some(CleanupResource { id: 11 })
    {
        let local = "nested"
        true
    }
}

fn cleanup_normal_and_early(flag: Bool) -> Int {
    let mut wrapped: CleanupResource? = none
    wrapped = some(CleanupResource { id: 10 })
    if flag { return 1 }
    2
}

fn cleanup_borrowed_bool_tail(flag: Bool) -> Bool {
    let mut wrapped: CleanupResource? = none
    flag
}

fn cleanup_borrowed_bool_block(flag: Bool) {
    {
        let mut wrapped: CleanupResource? = none
        flag
    }
}

fn cleanup_borrowed_str_block(value: Str) {
    {
        let mut wrapped: CleanupResource? = none
        value
    }
}

fn cleanup_borrowed_int_tail(value: Int) -> Int {
    let mut wrapped: CleanupResource? = none
    value
}

fn cleanup_borrowed_field_tail(flags: BorrowedFlags) -> Bool {
    let mut wrapped: CleanupResource? = none
    flags.ready
}

fn cleanup_borrow_return_call_tail(value: Bool?) -> Bool {
    let mut wrapped: CleanupResource? = none
    value.unwrap()
}

fn cleanup_unrelated_list_tail(values: List<Int>) -> Int {
    {
        let mut wrapped: CleanupResource? = none
        values
    }
    values.len()
}

fn cleanup_move_resource_tail(value: CleanupResource) -> Int {
    {
        let mut wrapped: CleanupResource? = none
        value
    }
    value.id
}

fn cleanup_boxed_control() -> Int {
    let mut wrapped: Str? = none
    let assign = fn() {
        wrapped = some("boxed")
    }
    assign()
    8
}

fn cleanup_contains_extern_control() -> Bool {
    let mut wrapped: CleanupHandle? = none
    wrapped.is_none()
}

fn cleanup_payload_borrow() -> Int {
    let mut wrapped: CleanupResource? = none
    wrapped = some(CleanupResource { id: 9 })
    match wrapped {
        some(value) => value.id,
        none => 0
    }
}

fn main() {}
