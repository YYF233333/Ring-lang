// B-139: delegate with custom effect — evidence forwarding for explicit methods
// Tests that delegate stubs correctly forward custom effect evidence parameters.
// Note: default method + custom effect + LLVM backend is now supported (B-141).

effect Config {
    fn get_value() -> Str
}

trait Configurable {
    fn describe(self) -> Str with {Config}
}

struct Inner {}

impl Configurable for Inner {
    fn describe(self) -> Str with {Config} {
        Config.get_value()
    }
}

struct Wrapper {
    inner: Inner
}

impl Wrapper {
    delegate inner: Configurable
}

fn main() {
    let w = Wrapper { inner: Inner {} }
    let result = handle {
        w.describe()
    } with {
        Config.get_value() => "hello",
    }
    assert(result == "hello", "delegate should forward Config evidence")
    print("delegate_custom_effect_direct: ok")
}
