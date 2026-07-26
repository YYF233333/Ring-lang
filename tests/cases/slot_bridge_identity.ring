// Slot bridge ownership is attached to the exact prelude DefId, not these
// user-spellable names.  Local, parameter, and module bindings below must keep
// ordinary Ring call/return/argument RC semantics.

mod user_module {
    fn ring_slot_read(left: Str, right: Str) -> Str {
        "${left}:${right}"
    }

    fn ring_slot_take(left: Str, right: Str) -> Str {
        "${left}/${right}"
    }

    fn ring_slot_write(left: Str, right: Str, value: Str) -> Str {
        "${left}+${right}+${value}"
    }

    pub fn run() -> Str {
        let read = self::ring_slot_read("module", "read")
        let take = self::ring_slot_take("module", "take")
        let write = self::ring_slot_write("module", "write", "value")
        "${read}|${take}|${write}"
    }
}

fn local_shadows() -> Str {
    let ring_slot_read = fn(left: Str, right: Str) { "${left}:${right}" }
    let ring_slot_take = fn(left: Str, right: Str) { "${left}/${right}" }
    let ring_slot_write = fn(left: Str, right: Str, value: Str) {
        "${left}+${right}+${value}"
    }
    let read = ring_slot_read("local", "read")
    let take = ring_slot_take("local", "take")
    let write = ring_slot_write("local", "write", "value")
    "${read}|${take}|${write}"
}

fn parameter_shadows(
    ring_slot_read: fn(Str, Str) -> Str,
    ring_slot_take: fn(Str, Str) -> Str,
    ring_slot_write: fn(Str, Str, Str) -> Str
) -> Str {
    let read = ring_slot_read("param", "read")
    let take = ring_slot_take("param", "take")
    let write = ring_slot_write("param", "write", "value")
    "${read}|${take}|${write}"
}

mod real_prelude requires {unsafe} {
    pub fn run() -> Str {
        unsafe {
            let slot: Ptr<Str> = alloc(1)
            ring_slot_write(slot, 0, "stored")
            let read = ring_slot_read(slot, 0)
            let taken = ring_slot_take(slot, 0)
            dealloc(slot, 1)
            "${read}/${taken}"
        }
    }
}

fn main() {
    print(user_module::run())
    print(local_shadows())
    print(parameter_shadows(
        fn(left, right) { "${left}:${right}" },
        fn(left, right) { "${left}/${right}" },
        fn(left, right, value) { "${left}+${right}+${value}" }
    ))
    print(real_prelude::run())
}
