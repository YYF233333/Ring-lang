// expect-error: E0801
// Uniform source ownership is required before lowering even when every field
// is overridden: the selected fresh aggregate must still be evaluated and
// dropped exactly once.

struct Resource { label: Str }
impl Drop for Resource { fn drop(self) {} }

struct Packet {
    resource: Resource,
    scalar: Int,
}

fn packet(label: Str, scalar: Int) -> Packet {
    Packet { resource: Resource { label: label }, scalar: scalar }
}

fn replace_everything(source: Packet, choose: Bool) -> Packet {
    Packet {
        ..if choose { source } else { packet("fresh", 1) },
        resource: Resource { label: "replacement" },
        scalar: 2,
    }
}

fn main() {}
