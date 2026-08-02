trait EmptyDefaults {
    fn tail_empty(self) -> Set<Int> {
        set_from([])
    }

    fn return_empty(self) -> Set<Int> {
        return set_from([])
    }
}

struct DefaultHost {}
impl EmptyDefaults for DefaultHost {}

fn main() {
    let tail_host = DefaultHost {}
    print("trait-tail=${tail_host.tail_empty().len()}")
    let return_host = DefaultHost {}
    print("trait-return=${return_host.return_empty().len()}")
}
