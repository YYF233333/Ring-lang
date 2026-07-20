struct Marker {
    value: Int,
}

impl Drop for Marker {
    fn drop(self) {
        print("drop ring_a")
    }
}

pub fn run() {
    let marker = Marker { value: 2 }
    print("body ring_a")
}
