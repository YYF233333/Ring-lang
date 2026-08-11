effect Probe {
    fn read() -> Int
}

fn observe<T>(value: T) -> Int { 0 }

fn probe<T>(source: T) -> Int {
    handle {
        Probe.read()
    } with {
        Probe.read() => observe(source),
    }
}

fn main() {}
