pub fn marker() -> Int { 0 }

extern fn ring_slot_write(mut value: Int, index: Int, extra: Int) -> Int

pub struct ShadowSlot {}

impl ShadowSlot {
    // A user-spellable impl extern with a raw-slot leaf must remain an ordinary
    // conservative interface; it is not the compiler's prelude intrinsic.
    extern fn ring_slot_take(mut self, mut value: Int) -> Int
}
