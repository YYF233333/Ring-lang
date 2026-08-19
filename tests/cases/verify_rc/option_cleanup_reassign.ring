// One exact cleanup-active Option slot owns both W4 mutation ordinals.

struct ReassignResource {
    id: Int
}

impl Drop for ReassignResource {
    fn drop(self) {}
}

fn option_cleanup_reassign() {
    let mut wrapped: ReassignResource? = none
    wrapped = some(ReassignResource { id: 1 })
    wrapped = none
    print(wrapped.is_none())
}

fn main() {
    option_cleanup_reassign()
}
