// B-121 gap 2: delegate-expanded dict dispatch where dict_param is a static
// dict name (e.g. __Inner_Eq) rather than a __ring_T_X parameter.  The default
// method `ne` is not explicitly implemented on Inner, so the delegate stub uses
// dict dispatch with dict_param = "__Inner_Eq".  Previously the LLVM backend
// returned null when named_values lookup missed, crashing on the subsequent
// method slot load.  Fix: fall back to resolve_static_dict_by_name.

struct Inner { x: Int }

impl Eq for Inner {
    fn eq(self, other: Inner) -> Bool {
        self.x == other.x
    }
}

struct Wrapper { inner: Inner }

impl Wrapper {
    delegate inner: Eq
}

fn main() {
    let a = Wrapper { inner: Inner { x: 42 } }
    let b = Wrapper { inner: Inner { x: 42 } }
    let c = Wrapper { inner: Inner { x: 99 } }
    print("eq=${a == b}")
    print("neq=${a != c}")
    print("eq2=${a == c}")
    print("neq2=${a != b}")
}
