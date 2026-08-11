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
    print("done")
}
