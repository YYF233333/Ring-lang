use prelude::slot::{
    ring_slot_read as project_slot_read,
    ring_slot_take as project_slot_take,
    ring_slot_write as project_slot_write
}

fn main() {
    let stored = map_from([("key", 91)])
    print(stored["key"])
    print(project_slot_read())
    print(project_slot_take())
    print(project_slot_write())
}
