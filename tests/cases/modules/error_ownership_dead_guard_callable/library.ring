pub struct Resource { pub id: Int }
impl Drop for Resource { fn drop(self) {} }

// The body that would consume `value` is unreachable because its guard has no
// value. The exported exact callable descriptor must therefore remain Borrow.
pub fn dead_guard(value: Resource) -> Int {
    match 1 {
        0 if {
            return 0
            false
        } => {
            let stored = value
            stored.id
        },
        _ => 1,
    }
}
