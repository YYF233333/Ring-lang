// A bounded extern function value validates its trait constraint statically,
// but the bound is not a runtime dictionary parameter of the foreign ABI.
// Re-declaring the exact builtin identity gives this test a real runtime target:
// an accidental dictionary capture/argument would corrupt the print call.

extern fn print<T: Hash>(value: T) -> Unit with {io}

fn call_bounded(
    f: fn(Int) -> Unit with {io},
    value: Int
) -> Unit with {io} {
    f(value)
}

fn main() {
    call_bounded(print, 107)
}
