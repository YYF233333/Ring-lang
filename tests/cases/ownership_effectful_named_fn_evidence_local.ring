effect LocalReading {
    fn read() -> Int
}

fn read_local() -> Int with {LocalReading} {
    LocalReading.read()
}

fn read_through_local_value() -> Int {
    handle {
        let reader = read_local
        reader()
    } with {
        LocalReading.read() => 41,
    }
}

fn read_through_local_value_early() -> Int {
    handle {
        let reader = read_local
        return reader()
        0
    } with {
        LocalReading.read() => 42,
    }
}

fn main() {
    print(read_through_local_value())
    print(read_through_local_value_early())
}
