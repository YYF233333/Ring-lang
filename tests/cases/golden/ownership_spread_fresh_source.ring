// Fresh aggregate spread sources are evaluated once, materialized once, and
// dropped after C has duplicated every uncovered field. Borrowed sources keep
// their ordinary borrow/dup semantics; overriding every field copies nothing.

struct Resource { label: Str }

impl Drop for Resource {
    fn drop(self) {}
}

struct Packet {
    resource: Resource,
    scalar: Int,
}

enum Envelope {
    Entry { resource: Resource, scalar: Int },
    Empty,
}

fn packet(label: Str, scalar: Int) -> Packet {
    Packet { resource: Resource { label: label }, scalar: scalar }
}

fn entry(label: Str, scalar: Int) -> Envelope {
    Entry { resource: Resource { label: label }, scalar: scalar }
}

fn main() {
    // Borrowed source: the owner-bearing field is overridden, while the
    // uncovered scalar remains a borrow/dup and the source stays live.
    let borrowed = packet("borrowed-source", 11)
    let borrowed_copy = Packet {
        ..borrowed,
        resource: Resource { label: "borrowed-copy" },
    }
    print("borrowed=${borrowed.resource.label}:${borrowed.scalar}")
    print("borrowed_copy=${borrowed_copy.resource.label}:${borrowed_copy.scalar}")

    // All reachable control-flow branches are borrowed. The owner field is
    // overridden, so only a scalar projection is copied and both sources stay
    // live without materialization.
    let borrowed_other = packet("borrowed-other", 12)
    let borrowed_phi = Packet {
        ..if true { borrowed } else { borrowed_other },
        resource: Resource { label: "borrowed-phi" },
    }
    print("borrowed_phi=${borrowed_phi.resource.label}:${borrowed_phi.scalar}|${borrowed.resource.label}|${borrowed_other.resource.label}")

    // Direct call, direct constructor, block, if and nested constructor shapes
    // all create one owned aggregate source requiring cleanup.
    let from_call = Packet { ..packet("call", 20), scalar: 21 }
    let from_ctor = Packet {
        ..Packet { resource: Resource { label: "ctor" }, scalar: 30 },
        scalar: 31,
    }
    let from_block = Packet {
        ..{ packet("block", 40) },
        scalar: 41,
    }
    let from_if = Packet {
        ..if true { packet("if-then", 50) } else { packet("if-else", 51) },
        scalar: 52,
    }
    let from_match = Packet {
        ..match 0 {
            0 => packet("match-first", 53),
            _ => packet("match-second", 54),
        },
        scalar: 55,
    }
    let nested = Packet {
        ..Packet { ..packet("nested", 60), scalar: 61 },
        scalar: 62,
    }
    print("fresh=${from_call.resource.label}:${from_call.scalar}|${from_ctor.resource.label}:${from_ctor.scalar}|${from_block.resource.label}:${from_block.scalar}|${from_if.resource.label}:${from_if.scalar}|${from_match.resource.label}:${from_match.scalar}|${nested.resource.label}:${nested.scalar}")

    // All fields overridden: evaluate/drop the source, but copy no source
    // field into the result.
    let all_overridden = Packet {
        ..packet("discarded", 70),
        resource: Resource { label: "replacement" },
        scalar: 71,
    }
    print("all=${all_overridden.resource.label}:${all_overridden.scalar}")

    // Named-variant spread follows the same source lifetime rule.
    let variant: Envelope = Entry { ..entry("variant", 80), scalar: 81 }
    match variant {
        Entry { resource, scalar } =>
            print("variant=${resource.label}:${scalar}"),
        Empty => print("variant=empty"),
    }

    // Observable side effect proves the source expression is evaluated once.
    let mut calls = 0
    let make_once = fn() -> Packet {
        calls = calls + 1
        packet("once", 90)
    }
    let once = Packet { ..make_once(), scalar: 91 }
    print("once=${calls}:${once.resource.label}:${once.scalar}")

    // Magnify any lost source Drop for the alloc-stats gate.
    for i in 0..128 {
        let loop_value = Packet { ..packet("loop", i), scalar: i + 1 }
        assert(loop_value.scalar == i + 1, "fresh spread loop")
    }
}
