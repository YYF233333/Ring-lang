// B-100 P1.1: trait default method parity — default method without override,
// override of default method, and default method calling another trait method.
//
// KNOWN LIMITATION: LLVM backend does not support default trait methods
// (pre-existing, noted in CLAUDE.md). This test is expected to diverge on LLVM
// until that limitation is lifted. It serves as a parity certification gate.

trait Greet {
    fn name(self) -> Str
    fn greet(self) -> Str {
        "Hello, ${self.name()}"
    }
}

struct Cat { n: Str }
impl Greet for Cat {
    fn name(self) -> Str { self.n }
    // uses default greet()
}

struct Dog { n: Str }
impl Greet for Dog {
    fn name(self) -> Str { self.n }
    fn greet(self) -> Str {
        "Woof! I am ${self.name()}"
    }
}

fn show<T: Greet>(x: T) -> Str {
    x.greet()
}

fn show_name<T: Greet>(x: T) -> Str {
    x.name()
}

fn main() {
    let cat = Cat { n: "Whiskers" }
    let dog = Dog { n: "Rex" }

    // default method (not overridden)
    print(cat.greet())
    print(show(cat))

    // overridden default method
    print(dog.greet())
    print(show(dog))

    // non-default method
    print(show_name(Cat { n: "Mittens" }))
    print(show_name(Dog { n: "Buddy" }))
}
