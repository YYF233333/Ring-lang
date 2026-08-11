// Exact callable-result roles must survive local aliases, assignment,
// structural pattern extraction, and a callable-returning factory. The raw
// bridge name is consulted only during prelude registration.

fn make_reader() -> fn(Ptr<Str>, Int) -> Str {
    ring_slot_read
}

fn make_taker() -> fn(Ptr<Str>, Int) -> Str {
    ring_slot_take
}

mod role_probe requires {unsafe, io} {
pub fn run() {
    unsafe {
        let read_alias: fn(Ptr<Str>, Int) -> Str = ring_slot_read
        let read_slot: Ptr<Str> = alloc(1)
        ring_slot_write(read_slot, 0, "local-read")
        let local_read = read_alias(read_slot, 0)
        ring_slot_drop(read_slot, 0)
        dealloc(read_slot, 1)

        let mut assigned: fn(Ptr<Str>, Int) -> Str = ring_slot_read
        assigned = ring_slot_take
        let assigned_slot: Ptr<Str> = alloc(1)
        ring_slot_write(assigned_slot, 0, "assigned-take")
        let assigned_take = assigned(assigned_slot, 0)
        dealloc(assigned_slot, 1)

        let pair: (
            fn(Ptr<Str>, Int) -> Str,
            fn(Ptr<Str>, Int) -> Str,
        ) = (ring_slot_read, ring_slot_take)
        let (pattern_read, pattern_take) = pair
        let pattern_read_slot: Ptr<Str> = alloc(1)
        ring_slot_write(pattern_read_slot, 0, "pattern-read")
        let pattern_read_value = pattern_read(pattern_read_slot, 0)
        ring_slot_drop(pattern_read_slot, 0)
        dealloc(pattern_read_slot, 1)
        let pattern_take_slot: Ptr<Str> = alloc(1)
        ring_slot_write(pattern_take_slot, 0, "pattern-take")
        let pattern_take_value = pattern_take(pattern_take_slot, 0)
        dealloc(pattern_take_slot, 1)

        let returned_read = super::make_reader()
        let factory_read_slot: Ptr<Str> = alloc(1)
        ring_slot_write(factory_read_slot, 0, "factory-read")
        let factory_read = returned_read(factory_read_slot, 0)
        ring_slot_drop(factory_read_slot, 0)
        dealloc(factory_read_slot, 1)

        let returned_take = super::make_taker()
        let factory_take_slot: Ptr<Str> = alloc(1)
        ring_slot_write(factory_take_slot, 0, "factory-take")
        let factory_take = returned_take(factory_take_slot, 0)
        dealloc(factory_take_slot, 1)

        print("${local_read}|${assigned_take}|${pattern_read_value}|${pattern_take_value}|${factory_read}|${factory_take}")
    }
}
}

fn main() {
    role_probe::run()
}
