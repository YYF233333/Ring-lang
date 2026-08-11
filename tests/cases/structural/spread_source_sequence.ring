// Structural + alloc-stats oracle for spread source sequencing. The two
// Never-source constructors return from their source before a destination can
// be allocated. The two borrowed-return constructors must not materialize or
// drop the borrowed aggregate returned by Option.unwrap().

struct Resource { id: Int }
impl Drop for Resource { fn drop(self) {} }

struct Packet {
    resource: Resource,
    scalar: Int,
}

enum Envelope {
    Entry { resource: Resource, scalar: Int },
    Empty,
}

fn make_packet(value: Int) -> Packet {
    Packet { resource: Resource { id: value }, scalar: value }
}

fn make_envelope(value: Int) -> Envelope {
    Entry { resource: Resource { id: value }, scalar: value }
}

fn spread_never_struct(value: Int) -> Packet {
    Packet {
        ..{
            return make_packet(value)
            make_packet(-1)
        },
        resource: Resource { id: -2 },
        scalar: -3,
    }
}

fn spread_never_variant(value: Int) -> Envelope {
    Entry {
        ..{
            return make_envelope(value)
            make_envelope(-1)
        },
        resource: Resource { id: -2 },
        scalar: -3,
    }
}

fn spread_borrowed_struct(holder: Option<Packet>) -> Packet {
    Packet {
        ..holder.unwrap(),
        resource: Resource { id: 700 },
    }
}

fn spread_borrowed_variant(holder: Option<Envelope>) -> Envelope {
    Entry {
        ..holder.unwrap(),
        resource: Resource { id: 800 },
    }
}

fn main() {
    for i in 0..256 {
        let from_never = spread_never_struct(i)
        assert(from_never.scalar == i, "never struct result")

        let variant_never = spread_never_variant(i)
        match variant_never {
            Entry { resource: _, scalar } =>
                assert(scalar == i, "never variant result"),
            Empty => panic("never variant empty"),
        }

        let holder = some(make_packet(i))
        let borrowed = spread_borrowed_struct(holder)
        assert(borrowed.scalar == i, "borrowed struct result")
        assert(holder.unwrap().scalar == i, "borrowed struct holder live")

        let variant_holder = some(make_envelope(i))
        let variant_borrowed = spread_borrowed_variant(variant_holder)
        match variant_borrowed {
            Entry { resource: _, scalar } =>
                assert(scalar == i, "borrowed variant result"),
            Empty => panic("borrowed variant empty"),
        }
        assert(variant_holder.is_some(), "borrowed variant holder live")
    }
}
