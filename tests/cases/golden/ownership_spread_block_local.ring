// A fresh aggregate held in a block-local binding must leave that exact DefId
// through Take before the whole block result is materialized for spread. The
// source binding is then dropped once after the constructor copies its fields.

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

fn main() {
    // The outer exact slot moves wholly into the block-local slot, which then
    // moves wholly into the materialized spread source.
    let outer_source = packet("outer-source", 8)
    let outer_local = Packet {
        ..{
            let local = outer_source
            local
        },
        scalar: 9,
    }

    // Immutable block-local aliases preserve the same exact ownership chain.
    let chain_source = packet("chain-source", 12)
    let alias_chain = Packet {
        ..{
            let first = chain_source
            let second = first
            second
        },
        scalar: 13,
    }

    let local_struct = Packet {
        ..{
            let source = packet("block-local", 10)
            source
        },
        scalar: 11,
    }

    let all_overridden = Packet {
        ..{
            let source = packet("discarded", 20)
            source
        },
        resource: Resource { label: "replacement" },
        scalar: 21,
    }

    let scalar_only = Packet {
        ..{
            let source = packet("scalar-source", 22)
            source
        },
        resource: Resource { label: "scalar-replacement" },
    }

    let branch_local = Packet {
        ..if true {
            let source = packet("if-local-left", 30)
            source
        } else {
            let source = packet("if-local-right", 31)
            source
        },
        scalar: 32,
    }

    let match_local = Packet {
        ..match 0 {
            0 => {
                let source = packet("match-local-left", 40)
                source
            },
            _ => {
                let source = packet("match-local-right", 41)
                source
            },
        },
        scalar: 42,
    }

    let variant_local: Envelope = Entry {
        ..{
            let source = entry("variant-local", 50)
            source
        },
        scalar: 51,
    }

    print("${outer_local.resource.label}:${outer_local.scalar}")
    print("${alias_chain.resource.label}:${alias_chain.scalar}")
    print("${local_struct.resource.label}:${local_struct.scalar}")
    print("${all_overridden.resource.label}:${all_overridden.scalar}")
    print("${scalar_only.resource.label}:${scalar_only.scalar}")
    print("${branch_local.resource.label}:${branch_local.scalar}")
    print("${match_local.resource.label}:${match_local.scalar}")
    match variant_local {
        Entry { resource, scalar } => print("${resource.label}:${scalar}"),
        Empty => print("empty"),
    }

    // Magnify a missing local Take or source Drop for the alloc-stats gate.
    for i in 0..128 {
        let value = Packet {
            ..{
                let source = packet("loop-local", i)
                source
            },
            scalar: i + 1,
        }
        assert(value.scalar == i + 1, "block-local spread loop")
    }
}
