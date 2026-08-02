fn hash_value<T: Hash>(value: T) -> Int {
    value.hash()
}

fn use_hash<T: Hash>(
    value: T,
    f: fn(T) -> Int = hash_value
) -> Int {
    f(value)
}

fn main() {
    // The shared default must be rejected at its definition.  Reusing it at
    // two caller instantiations must not bind one fn_defaults TypeVar and then
    // report an unrelated Int-vs-Str mismatch.
    print(use_hash(1))
    print(use_hash("caller two"))
}
