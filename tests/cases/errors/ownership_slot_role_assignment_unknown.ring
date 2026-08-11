// expect-error: E0801
// Rebinding a proven slot bridge alias to an ordinary generic callable must
// publish UNKNOWN, never leave the old FRESH role attached to the local DefId.

extern fn user_slot_read<T>(slot: Ptr<T>, index: Int) -> T

mod probe requires {unsafe} {
pub fn run() {
    unsafe {
        let mut reader = ring_slot_read
        reader = super::user_slot_read
        let slot = alloc(1)
        reader(slot, 0)
    }
}
}

fn main() { probe::run() }
