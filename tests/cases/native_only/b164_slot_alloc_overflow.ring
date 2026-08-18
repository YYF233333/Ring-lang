fn main() {
    let slots: Ptr<Int> = ring_slot_alloc(2305843009213693952)
    ring_slot_dealloc(slots, 2305843009213693952)
}
