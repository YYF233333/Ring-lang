// expect-error: E0801
// Named-variant spread uses the same reachable-branch ownership lattice as
// struct spread. Both branch orientations must reject rather than leak the
// selected fresh Envelope.

struct Resource { label: Str }
impl Drop for Resource { fn drop(self) {} }

enum Envelope {
    Entry { resource: Resource, scalar: Int },
    Empty,
}

fn entry(label: Str, scalar: Int) -> Envelope {
    Entry { resource: Resource { label: label }, scalar: scalar }
}

fn borrowed_first(source: Envelope, tag: Int) -> Envelope {
    Entry {
        ..match tag {
            0 => source,
            _ => entry("fresh-second", 1),
        },
        resource: Resource { label: "replacement-a" },
    }
}

fn fresh_first_nested(source: Envelope, tag: Int) -> Envelope {
    Entry {
        ..{
            match tag {
                0 => entry("fresh-first", 2),
                _ => source,
            }
        },
        resource: Resource { label: "replacement-b" },
        scalar: 3,
    }
}

fn main() {}
