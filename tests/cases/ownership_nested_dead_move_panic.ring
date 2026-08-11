fn consume(move value: Str) {}

fn panic_before_nested_move(value: Str) {
    consume({
        panic("stop");
        value
    })
}

fn main() {
    // The function above is compiled and ownership-planned, but deliberately
    // not executed because panic is a Never producer.
    print("nested-panic-compiled")
}
