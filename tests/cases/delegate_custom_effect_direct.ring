// Test: delegate forwarding correctly passes custom effect evidence
// B-139: Default trait methods with custom effects must receive evidence params,
// and delegate stubs forwarding through dict dispatch must pass them through.

effect Config {
    fn get_value() -> Str
}

trait Configurable {
    fn describe(self) -> Str with {Config}
    // Default method that calls describe() — exercises evidence forwarding
    // through the dict dispatch closure for default methods
    fn describe_wrapped(self) -> Str with {Config} {
        let v = self.describe()
        "wrapped:${v}"
    }
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

    // Test 1: Direct delegate of explicit method with custom effect
    let result1 = handle {
        w.describe()
    } with {
        Config.get_value() => "hello",
    }
    assert(result1 == "hello", "delegate should forward Config evidence for explicit method")

    // Test 2: Delegate through default method with custom effect
    // This is the actual B-139 bug: the default method function was missing
    // evidence params, and the dict closure didn't forward them.
    let result2 = handle {
        w.describe_wrapped()
    } with {
        Config.get_value() => "world",
    }
    assert(result2 == "wrapped:world", "delegate should forward Config evidence through default method")

    print("OK")
}
// expect: OK
