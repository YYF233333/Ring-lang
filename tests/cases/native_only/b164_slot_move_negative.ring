fn main() {
    let slots: Ptr<Int> = ring_slot_alloc(0)
    ring_slot_move(slots, 0, slots, 0, -1)
}
