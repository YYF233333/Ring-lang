// expect-error: E0801
// A control-flow alias whose exact targets disagree on semantic result role is
// UNKNOWN at the unresolved generic use site and must fail loud.

extern fn user_slot_read<T>(slot: Ptr<T>, index: Int) -> T

mod probe requires {unsafe} {
pub fn run() {
    unsafe {
        let reader = if true {
            ring_slot_read
        } else {
            super::user_slot_read
        }
        let slot = alloc(1)
        reader(slot, 0)
    }
}
}

fn main() { probe::run() }
