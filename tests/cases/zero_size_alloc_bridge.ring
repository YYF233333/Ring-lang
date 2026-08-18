fn exercise_positive_slots() -> Str {
    let slots: Ptr<Int> = ring_slot_alloc(1)
    let value = 101
    ring_slot_write(slots, 0, value)
    let read_back = ring_slot_read(slots, 0)
    let taken = ring_slot_take(slots, 0)
    ring_slot_dealloc(slots, 1)
    "${read_back}/${taken}"
}

fn exercise_positive_buffer() -> Int {
    let buffer = ring_buf_alloc(1)
    ring_buf_set_byte(buffer, 0, 17)
    let read_back = ring_buf_get_byte(buffer, 0)
    ring_buf_dealloc(buffer)
    read_back
}

fn exercise_positive_zeroed_buffer() -> Str {
    let buffer = ring_buf_alloc_zeroed(1)
    let before = ring_buf_get_byte(buffer, 0)
    ring_buf_set_byte(buffer, 0, 49)
    let after = ring_buf_get_byte(buffer, 0)
    ring_buf_dealloc(buffer)
    "${before}/${after}"
}

fn exercise_zero_handles() -> Str {
    let slots: Ptr<Int> = ring_slot_alloc(0)
    let buffer = ring_buf_alloc(0)
    let zeroed = ring_buf_alloc_zeroed(0)
    ring_slot_move(slots, 0, slots, 0, 0)
    let addresses = "${slots.addr()}/${buffer.addr()}/${zeroed.addr()}"
    ring_slot_dealloc(slots, 0)
    ring_buf_dealloc(buffer)
    ring_buf_dealloc(zeroed)
    addresses
}

fn exercise_zero_cap_list() -> Str {
    let mut values: List<Int> = List {
        buf: ring_slot_alloc(0),
        len: 0,
        cap: 0
    }
    values.push(7)
    "${values.len}/${values.cap}/${values[0]}"
}

fn exercise_zero_cap_map_grow() -> Str {
    let mut values: Map<Int, Int> = Map {
        meta: ring_buf_alloc_zeroed(0),
        keys: ring_slot_alloc(0),
        values: ring_slot_alloc(0),
        len: 0,
        cap: 0
    }
    values.insert(5, 9)
    "${values.len}/${values.cap}/${values[5]}"
}

fn exercise_zero_cap_map_drop() -> Str {
    let empty: Map<Int, Int> = Map {
        meta: ring_buf_alloc(0),
        keys: ring_slot_alloc(0),
        values: ring_slot_alloc(0),
        len: 0,
        cap: 0
    }
    "${empty.len}/${empty.cap}"
}

fn main() {
    print("slots=${exercise_positive_slots()}")
    print("buf=${exercise_positive_buffer()}")
    print("zeroed=${exercise_positive_zeroed_buffer()}")
    print("zero=${exercise_zero_handles()}")
    print("list-grow=${exercise_zero_cap_list()}")
    print("map-grow=${exercise_zero_cap_map_grow()}")
    print("map-drop=${exercise_zero_cap_map_drop()}")
}
