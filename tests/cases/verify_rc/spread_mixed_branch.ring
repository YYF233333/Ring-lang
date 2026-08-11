// Normal HIR has two all-fresh spread phis. The mixed-spread-source mutation
// runs only after ownership planning and replaces each else branch with the
// function's exact first-parameter DefId. verify_rc must independently reject
// those mixed reachable branches at the two constructor locations below.

struct Resource { label: Str }
impl Drop for Resource { fn drop(self) {} }

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

fn struct_phi(borrowed: Packet, choose: Bool) -> Packet {
    Packet {
        ..if choose {
            Packet { resource: Resource { label: "left" }, scalar: 1 }
        } else {
            Packet { resource: Resource { label: "right" }, scalar: 2 }
        },
        scalar: 3,
    }
}

fn variant_phi(borrowed: Envelope, choose: Bool) -> Envelope {
    Entry {
        ..match choose {
            true => Entry {
                resource: Resource { label: "left" }, scalar: 4
            },
            false => Entry {
                resource: Resource { label: "right" }, scalar: 5
            },
        },
        scalar: 6,
    }
}

fn borrowed_match(left: Packet, right: Packet, choose: Bool) -> Packet {
    Packet {
        ..match choose {
            true => left,
            false => right,
        },
        resource: Resource { label: "borrowed-match" },
    }
}

fn main() {
    let p = struct_phi(packet("borrowed", 0), true)
    let e = variant_phi(entry("borrowed", 0), false)
    let b = borrowed_match(packet("borrowed-left", 7),
        packet("borrowed-right", 8), true)
    print("${p.resource.label}:${p.scalar}")
    print("${b.resource.label}:${b.scalar}")
    match e {
        Entry { resource, scalar } => print("${resource.label}:${scalar}"),
        Empty => print("empty"),
    }
}
