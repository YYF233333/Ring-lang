fn hash_identity<T: Hash>(value: T) -> T { value }

fn unsupported_default<T: Hash>(
    value: T,
    copy: T = hash_identity(value)
) -> T {
    copy
}
