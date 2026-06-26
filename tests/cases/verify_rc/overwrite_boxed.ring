// B-104 D2 negative case: auto-boxed mut cell writes leak the old cell
// value (B-091: the write mutates cell.value, no drop of the previous).
// The verifier must report the documented x-overwrite-boxed class.

fn main() {
    let mut count = 0
    let inc = fn() { count = count + 1 }
    count = 10
    inc()
    print("${count}")
}
