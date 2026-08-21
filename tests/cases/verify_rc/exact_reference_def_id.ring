fn identity_reference_probe() -> Int {
    let reference_slot = 7
    reference_slot
}

fn identity_capture_probe() -> Int {
    let capture_slot = 8
    let read_capture = fn() -> Int { capture_slot }
    read_capture()
}

fn main() {
    print(identity_reference_probe())
    print(identity_capture_probe())
}
