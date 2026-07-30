// expect error: E0503
// Resolving a callable default is not allowed to discard the expected
// function type's nested trait evidence.  hash_one<Wrap<Float>> needs
// Hash<Wrap<Float>>, whose impl in turn requires the missing Hash<Float>.

struct Wrap<T> {
    value: T
}

impl<T: Hash> Hash for Wrap<T> {
    fn hash(self) -> Int {
        self.value.hash()
    }
}

fn hash_one<T: Hash>(value: T) -> Int {
    value.hash()
}

fn hash_float_default(
    value: Wrap<Float>,
    f: fn(Wrap<Float>) -> Int = hash_one
) -> Int {
    f(value)
}

fn main() {
    print(hash_float_default(Wrap { value: 1.5 }))
}
