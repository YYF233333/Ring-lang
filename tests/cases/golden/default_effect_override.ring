// B-100 P1.1: default effect override — effects with default bodies can be
// used without handle...with (using the default), or overridden partially
// or fully with an explicit handler. Tests that default evidence construction
// and override dispatch work correctly.

effect Logger {
    fn log(msg: Str) -> Unit {
        print("DEFAULT: ${msg}")
    }
}

effect Counter {
    fn get() -> Int { 0 }
    fn step() -> Int { 1 }
}

fn greet(name: Str) {
    Logger.log("Hello, ${name}")
}

fn use_counter() -> Int with {Counter} {
    let base = Counter.get()
    let s = Counter.step()
    base + s
}

fn multi_log() {
    Logger.log("first")
    Logger.log("second")
    Logger.log("third")
}

fn main() {
    // Test 1: default body — no handle needed
    greet("World")

    // Test 2: override default with explicit handler
    handle {
        greet("Override")
    } with {
        Logger.log(msg) => print("CUSTOM: ${msg}"),
    }

    // Test 3: default Counter — get()=0, step()=1, result=1
    let r1 = use_counter()
    print("T3: ${r1.to_str()}")

    // Test 4: override get() only, step() keeps default
    let r2 = handle {
        use_counter()
    } with {
        Counter.get() => 10,
    }
    print("T4: ${r2.to_str()}")

    // Test 5: override both ops
    let r3 = handle {
        use_counter()
    } with {
        Counter.get() => 100,
        Counter.step() => 5,
    }
    print("T5: ${r3.to_str()}")

    // Test 6: multiple default calls in sequence
    multi_log()

    // Test 7: override step() only, get() keeps default
    let r4 = handle {
        use_counter()
    } with {
        Counter.step() => 50,
    }
    print("T7: ${r4.to_str()}")

    print("default_effect_override: done")
}
