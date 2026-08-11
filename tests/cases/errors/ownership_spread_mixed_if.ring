// expect-error: E0801
// A fresh aggregate branch needs one cleanup-visible materialization while a
// borrowed branch must stay unowned. Treating their phi as merely borrowed
// leaks the fresh source even when only a scalar field remains uncovered.

struct Resource { label: Str }
impl Drop for Resource { fn drop(self) {} }

struct Packet {
    resource: Resource,
    scalar: Int,
}

fn packet(label: Str, scalar: Int) -> Packet {
    Packet { resource: Resource { label: label }, scalar: scalar }
}

fn fresh_then(source: Packet, choose: Bool) -> Packet {
    Packet {
        ..if choose { packet("fresh-then", 1) } else { source },
        resource: Resource { label: "replacement-a" },
    }
}

fn fresh_else_nested(source: Packet, choose: Bool) -> Packet {
    Packet {
        ..{ if choose { source } else { packet("fresh-else", 2) } },
        resource: Resource { label: "replacement-b" },
    }
}

fn main() {}
