// NO_REACHABLE_VALUE is neutral in the spread ownership lattice. Diverging
// branches do not veto a reachable uniform class, and divergence before branch
// selection means the spread produces no value at all.

struct Resource { label: Str }
impl Drop for Resource { fn drop(self) {} }

struct Packet {
    resource: Resource,
    scalar: Int,
}

fn packet(label: Str, scalar: Int) -> Packet {
    Packet { resource: Resource { label: label }, scalar: scalar }
}

fn one_diverging_branch(choose: Bool) -> Packet {
    Packet {
        ..if choose { panic("diverging branch") }
          else { packet("reachable-fresh", 1) },
        scalar: 2,
    }
}

fn all_branches_diverge(choose: Bool) -> Packet {
    Packet {
        ..if choose { panic("left") } else { panic("right") },
        resource: Resource { label: "unreachable" },
        scalar: 3,
    }
}

fn diverging_condition(source: Packet) -> Packet {
    Packet {
        ..if panic("condition") { packet("fresh", 4) } else { source },
        resource: Resource { label: "unreachable" },
    }
}

fn diverging_scrutinee(source: Packet) -> Packet {
    Packet {
        ..match panic("scrutinee") {
            _ if true => packet("fresh", 5),
            _ => source,
        },
        resource: Resource { label: "unreachable" },
    }
}

fn diverging_guard(source: Packet, tag: Int) -> Packet {
    Packet {
        ..match tag {
            0 if panic("guard") => packet("ignored-fresh", 6),
            _ => source,
        },
        resource: Resource { label: "guard-result" },
    }
}

fn main() {
    let one = one_diverging_branch(false)
    let borrowed = packet("borrowed", 7)
    let guard = diverging_guard(borrowed, 1)
    print("${one.resource.label}:${one.scalar}")
    print("${guard.resource.label}:${guard.scalar}|${borrowed.resource.label}")
}
