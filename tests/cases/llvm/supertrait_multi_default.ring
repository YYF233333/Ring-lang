// B-100 P1.1 parity: supertrait multi-level + default methods — multi-level
// supertrait chains (Base -> Mid -> Top), supertrait default method bodies
// calling supertrait methods.

// --- Multi-level supertrait chain ---

trait Base {
    fn base_val(self) -> Int
}

trait Mid: Base {
    fn mid_val(self) -> Int
}

trait Top: Mid {
    fn top_val(self) -> Int
}

struct MyStruct { v: Int }

impl Base for MyStruct {
    fn base_val(self) -> Int { self.v }
}

impl Mid for MyStruct {
    fn mid_val(self) -> Int { self.v * 2 }
}

impl Top for MyStruct {
    fn top_val(self) -> Int { self.v * 3 }
}

fn use_top<T: Top>(x: T) -> Int {
    x.base_val() + x.mid_val() + x.top_val()
}

// --- Supertrait default method calling supertrait method ---

trait Nameable {
    fn get_name(self) -> Str
}

trait Greetable: Nameable {
    fn greet(self) -> Str {
        "Hello, ${self.get_name()}!"
    }
}

struct Person { first: Str }

impl Nameable for Person {
    fn get_name(self) -> Str { self.first }
}

impl Greetable for Person {}

fn greet_someone<T: Greetable>(x: T) -> Str {
    x.greet()
}

fn main() {
    // Multi-level: 10 + 20 + 30 = 60
    let s = MyStruct { v: 10 }
    print("top_sum=${use_top(s)}")

    // Each level accessible via Top bound
    let s2 = MyStruct { v: 5 }
    print("base=${s2.base_val()}")
    print("mid=${s2.mid_val()}")
    print("top=${s2.top_val()}")

    // Default method on supertrait
    let p = Person { first: "Alice" }
    print("greet=${greet_someone(p)}")
    print("direct=${p.greet()}")
    print("name=${p.get_name()}")
}
