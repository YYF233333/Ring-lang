// A Move call edge whose operand is a dropping block is rewritten by Perceus
// through a pass-owned __rc_scope temporary.  The live pass must publish the
// synthetic slot transfer as an exact Take.  Under --rc-mutate=missing-take,
// both call edges below revert to bare Idents and verify_rc must reject them.

struct Resource { id: Int }
impl Drop for Resource { fn drop(self) {} }

fn block_value() -> Resource? {
    let wrapped = some({
        let cleanup = Resource { id: 10 }
        Resource { id: 11 }
    })
    wrapped
}

fn match_value(flag: Bool) -> Resource? {
    let wrapped = some({
        let cleanup = Resource { id: 20 }
        match flag {
            true => Resource { id: 21 },
            false => Resource { id: 22 }
        }
    })
    wrapped
}

fn main() {}
