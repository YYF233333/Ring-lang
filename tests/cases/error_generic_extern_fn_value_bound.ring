// expect error: E0503
// The same extern value remains statically bounded: selecting T=Float must be
// rejected even though a successful extern closure captures no runtime dict.

extern fn print<T: Hash>(value: T) -> Unit with {io}

fn call_float(
    f: fn(Float) -> Unit with {io},
    value: Float
) -> Unit with {io} {
    f(value)
}

fn main() {
    call_float(print, 1.5)
}
