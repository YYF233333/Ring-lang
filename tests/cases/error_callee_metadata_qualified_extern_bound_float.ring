// expect error: E0503
// A qualified two-hop ExternCallable validates bounds but has no Ring dict ABI.

pub mod origin {
    pub extern fn print<T: Hash>(value: T) -> Unit with {io}
}

pub mod middle {
    pub use super::origin::print as relay
}

pub mod facade {
    pub use super::middle::relay as emit
}

fn call_float(
    emit: fn(Float) -> Unit with {io},
    value: Float
) -> Unit with {io} {
    emit(value)
}

fn main() {
    call_float(facade::emit, 1.5)
}
