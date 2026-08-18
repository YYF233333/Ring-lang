fn main() {
    let slots: Ptr<Int> = ring_slot_alloc(-1)
    ring_slot_dealloc(slots, -1)
}
