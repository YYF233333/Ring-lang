pub fn make_reader() -> fn(Ptr<Str>, Int) -> Str {
    ring_slot_read
}

pub fn make_taker() -> fn(Ptr<Str>, Int) -> Str {
    ring_slot_take
}

pub const SLOT_READER: fn(Ptr<Str>, Int) -> Str = ring_slot_read
pub const SLOT_TAKER: fn(Ptr<Str>, Int) -> Str = ring_slot_take
