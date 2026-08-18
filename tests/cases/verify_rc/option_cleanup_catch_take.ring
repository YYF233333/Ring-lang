// Post-planner mutation fixture. The source catch arm is RC-neutral and must
// verify clean; `inject-option-catch-drop` prepends one exact outer-slot Drop,
// which #167 must reject before restoring the try-body snapshot.

struct CatchResource {
    id: Int
}

impl Drop for CatchResource {
    fn drop(self) {}
}

fn raise_catch_option() -> Bool with {fail<Int>} {
    fail.raise(1)
}

fn main() {
    let mut wrapped: CatchResource? = none
    wrapped = some(CatchResource { id: 1 })
    raise_catch_option() catch {
        _ => false
    }
    print(wrapped.is_some())
}
