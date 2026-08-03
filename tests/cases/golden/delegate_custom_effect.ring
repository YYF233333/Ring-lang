// B-097 sub-item 3: delegate forwarding with custom effect through handle...with
// Tests that a delegated trait method carrying a custom effect annotation can
// dispatch through the evidence struct when called inside a handle block.

effect Config {
    fn get(key: Str) -> Str
}

fn read_mode() -> Str {
    Config.get("mode")
}

trait Describable {
    fn describe(self) -> Str with {Config}
}

struct Inner { name: Str }

impl Describable for Inner {
    fn describe(self) -> Str with {Config} {
        let mode = read_mode()
        "${self.name}:${mode}"
    }
}

struct Wrapper { inner: Inner }

impl Wrapper {
    delegate inner: Describable
}

fn main() {
    let w = Wrapper { inner: Inner { name: "node" } }
    let result = handle {
        w.describe()
    } with {
        Config.get(k) => "test-${k}",
    }
    assert(result == "node:test-mode", "delegate should forward custom effect")
    print("delegate_custom_effect: ok")
}
