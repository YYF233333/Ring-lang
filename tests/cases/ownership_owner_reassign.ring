struct Tracked { label: Str }

impl Drop for Tracked {
    fn drop(self) {
        // The authoritative Drop body may borrow/read self. Each label printed
        // below is therefore also an exact-once destructor observation.
        print("drop:${self.label}")
    }
}

struct Wrapper { item: Tracked }

fn keep_tracked(move value: Tracked) -> Tracked {
    value
}

fn keep_wrapper(move value: Wrapper) -> Wrapper {
    value
}

fn direct_plain_reassign() {
    let mut value = Tracked { label: "direct-old" }
    value = Tracked { label: "direct-new" }
    print("live:${value.label}")
}

fn direct_self_move_reassign() {
    let mut value = Tracked { label: "direct-self" }
    value = keep_tracked(value)
    print("live:${value.label}")
}

fn transitive_plain_reassign() {
    let mut value = Wrapper {
        item: Tracked { label: "transitive-old" },
    }
    value = Wrapper {
        item: Tracked { label: "transitive-new" },
    }
    print("live:${value.item.label}")
}

fn transitive_self_move_reassign() {
    let mut value = Wrapper {
        item: Tracked { label: "transitive-self" },
    }
    value = keep_wrapper(value)
    print("live:${value.item.label}")
}

fn main() {
    direct_plain_reassign()
    direct_self_move_reassign()
    transitive_plain_reassign()
    transitive_self_move_reassign()
}
