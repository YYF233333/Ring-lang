use unspellable_identity_support::{project_marker}

fn ring_slot_read() -> Int { 811 }

fn main() {
    print(project_marker())
    print(ring_slot_read())

    let stored = map_from([("key", 97)])
    print(stored["key"])
}
