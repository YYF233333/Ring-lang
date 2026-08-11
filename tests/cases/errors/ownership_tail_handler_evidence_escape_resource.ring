struct Resource {
    id: Int
}

impl Drop for Resource {
    fn drop(self) {}
}

effect CapturedReading {
    fn read() -> Int
}

fn read_captured() -> Int with {CapturedReading} {
    CapturedReading.read()
}

fn make_reader() -> fn() -> Int with {CapturedReading} {
    let source = Resource { id: 41 }
    handle {
        read_captured
    } with {
        CapturedReading.read() => source.id,
    }
}

fn main() {
    let reader = make_reader()
    let result = handle {
        reader()
    } with {
        CapturedReading.read() => 99,
    }
    print(result)
}
