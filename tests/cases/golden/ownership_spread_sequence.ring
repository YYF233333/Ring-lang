// Spread evaluation is source-first at every ownership stage. Borrowed-return
// calls stay borrowed (and their holders remain live), while nested field
// hoists run only after the source. A terminating source physically removes
// dead fields so they neither run nor infer Move for their captured parameter.

effect Trace {
    fn mark(label: Str) -> Unit
}

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

fn traced_label(label: Str) -> Str with {Trace} {
    Trace.mark(label)
    label
}

fn borrowed_struct_sequence(holder: Option<Packet>) -> Packet with {Trace} {
    Packet {
        ..{
            Trace.mark("struct-source")
            holder.unwrap()
        },
        resource: Resource {
            label: "${traced_label("struct-field")}",
        },
    }
}

fn borrowed_variant_sequence(
    holder: Option<Envelope>
) -> Envelope with {Trace} {
    Entry {
        ..{
            Trace.mark("variant-source")
            holder.unwrap()
        },
        resource: Resource {
            label: "${traced_label("variant-field")}",
        },
    }
}

fn fresh_sequence() -> Packet with {Trace} {
    Packet {
        ..{
            Trace.mark("fresh-source")
            packet("fresh-original", 30)
        },
        resource: Resource {
            label: "${traced_label("fresh-field")}",
        },
    }
}

fn dead_struct_field(payload: Resource) -> Packet with {Trace} {
    Packet {
        ..{
            return packet("dead-struct-return", 40)
            packet("unreachable-struct-tail", 400)
        },
        resource: {
            Trace.mark("dead-struct-field")
            payload
        },
        scalar: 41,
    }
}

fn dead_variant_field(payload: Resource) -> Envelope with {Trace} {
    Entry {
        ..{
            return entry("dead-variant-return", 50)
            entry("unreachable-variant-tail", 500)
        },
        resource: {
            Trace.mark("dead-variant-field")
            payload
        },
        scalar: 51,
    }
}

fn dead_if_branch_mode(payload: Resource) -> Int with {fail<Str>} {
    if panic("dead-if-condition") {
        let stored = payload
        stored.label.len()
    } else {
        0
    }
}

fn dead_match_scrutinee_mode(payload: Resource) -> Int with {fail<Str>} {
    match panic("dead-match-scrutinee") {
        _ => {
            let stored = payload
            stored.label.len()
        },
    }
}

fn dead_match_guard_mode(
    payload: Resource, tag: Int
) -> Int with {fail<Str>} {
    match tag {
        0 if panic("dead-match-guard") => {
            let stored = payload
            stored.label.len()
        },
        _ => tag,
    }
}

fn main() {
    handle {
        // Exact built-in Borrowed-return calls are valid direct spread sources
        // when every uncovered field is non-owner-bearing.
        let holder = some(packet("holder", 10))
        let direct = Packet {
            ..holder.unwrap(),
            resource: Resource { label: "direct-copy" },
        }
        print("direct=${direct.resource.label}:${direct.scalar}|holder=${holder.unwrap().resource.label}")

        let ordered = borrowed_struct_sequence(holder)
        print("ordered=${ordered.resource.label}:${ordered.scalar}|holder=${holder.unwrap().resource.label}")

        let variant_holder = some(entry("variant-holder", 20))
        let direct_variant: Envelope = Entry {
            ..variant_holder.unwrap(),
            resource: Resource { label: "direct-variant-copy" },
        }
        match direct_variant {
            Entry { resource, scalar } =>
                print("direct_variant=${resource.label}:${scalar}|holder=${variant_holder.is_some()}"),
            Empty => print("direct_variant=empty"),
        }

        let ordered_variant = borrowed_variant_sequence(variant_holder)
        match ordered_variant {
            Entry { resource, scalar } =>
                print("ordered_variant=${resource.label}:${scalar}|holder=${variant_holder.is_some()}"),
            Empty => print("ordered_variant=empty"),
        }

        let fresh = fresh_sequence()
        print("fresh=${fresh.resource.label}:${fresh.scalar}")

        // If the dead field were still visited by the callable-mode solver,
        // these parameters would become Move and the post-call reads would be
        // rejected. If planner/ANF failed to prune them, Trace would print the
        // forbidden dead-* markers (or the planner would ICE on a bare edge).
        let struct_payload = Resource { label: "struct-payload-live" }
        let dead_struct = dead_struct_field(struct_payload)
        print("dead_struct=${dead_struct.resource.label}:${dead_struct.scalar}|${struct_payload.label}")

        let variant_payload = Resource { label: "variant-payload-live" }
        let dead_variant = dead_variant_field(variant_payload)
        match dead_variant {
            Entry { resource, scalar } =>
                print("dead_variant=${resource.label}:${scalar}|${variant_payload.label}"),
            Empty => print("dead_variant=empty"),
        }

        let if_payload = Resource { label: "if-payload-live" }
        let if_result = dead_if_branch_mode(if_payload) catch { _ => -1 }
        print("dead_if=${if_result}|${if_payload.label}")

        let scrutinee_payload = Resource {
            label: "scrutinee-payload-live",
        }
        let scrutinee_result = dead_match_scrutinee_mode(
            scrutinee_payload) catch { _ => -2 }
        print("dead_scrutinee=${scrutinee_result}|${scrutinee_payload.label}")

        let guard_payload = Resource { label: "guard-payload-live" }
        let guard_result = dead_match_guard_mode(guard_payload, 1)
        print("dead_guard=${guard_result}|${guard_payload.label}")

        // Magnify destination allocations that escape before a Never/Return
        // spread source. With correct source-first C lowering these loops add
        // no live destination aggregate at process exit.
        for i in 0..128 {
            let loop_struct_payload = Resource { label: "loop-struct" }
            let loop_struct = dead_struct_field(loop_struct_payload)
            assert(loop_struct.scalar == 40, "dead struct loop")
            assert(loop_struct_payload.label == "loop-struct",
                "dead struct payload remains borrowed")

            let loop_variant_payload = Resource { label: "loop-variant" }
            let loop_variant = dead_variant_field(loop_variant_payload)
            match loop_variant {
                Entry { resource: _, scalar } =>
                    assert(scalar == 50, "dead variant loop"),
                Empty => panic("dead variant loop empty"),
            }
            assert(loop_variant_payload.label == "loop-variant",
                "dead variant payload remains borrowed")
        }
    } with {
        Trace.mark(label) => print("trace:${label}"),
    }
}
