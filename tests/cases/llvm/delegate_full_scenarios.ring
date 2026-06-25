// B-100 P1.1 parity: delegate full scenarios — delegate with assoc type,
// delegate with default method, delegate with mut self, delegate with
// supertrait bound. JS backend is oracle.

// --- 1. Delegate with associated type ---

trait Container {
    type Item
    fn get(self) -> Item
    fn describe(self) -> Str
}

struct IntStore { val: Int }

impl Container for IntStore {
    type Item = Int
    fn get(self) -> Int { self.val }
    fn describe(self) -> Str { "store(${self.val})" }
}

struct StoreWrapper { inner: IntStore }

impl StoreWrapper {
    delegate inner: Container
}

// --- 2. Delegate with default method ---

trait Describable {
    fn name(self) -> Str
    fn describe_full(self) -> Str {
        "I am ${self.name()}"
    }
}

struct User { user_name: Str }

impl Describable for User {
    fn name(self) -> Str { self.user_name }
}

struct Admin { base: User, level: Int }

impl Admin {
    delegate base: Describable
}

fn print_desc<T: Describable>(item: T) -> Str {
    item.describe_full()
}

// --- 3. Delegate with mut self ---

trait MutCounter {
    fn inc(mut self)
    fn count(self) -> Int
}

struct SimpleCounter { pub value: Int }

impl MutCounter for SimpleCounter {
    fn inc(mut self) { self.value = self.value + 1 }
    fn count(self) -> Int { self.value }
}

struct WrappedCounter { pub inner: SimpleCounter }

impl WrappedCounter {
    delegate inner: MutCounter
}

// --- 4. Delegate with supertrait bound ---

trait Named {
    fn the_name(self) -> Str
}

trait Greeter: Named {
    fn greet(self) -> Str
}

struct Person { name_val: Str }

impl Named for Person {
    fn the_name(self) -> Str { self.name_val }
}

impl Greeter for Person {
    fn greet(self) -> Str { "Hello, ${self.the_name()}!" }
}

struct Employee { person: Person }

impl Employee {
    delegate person: Greeter
}

fn print_named<T: Named>(x: T) -> Str {
    x.the_name()
}

fn main() {
    // 1. Delegate assoc type
    let sw = StoreWrapper { inner: IntStore { val: 42 } }
    let v = sw.get()
    let sum = v + 10
    print("assoc_get=${sum}")
    print("assoc_desc=${sw.describe()}")

    // 2. Delegate default method
    let admin = Admin { base: User { user_name: "Alice" }, level: 5 }
    print("name=${admin.name()}")
    print("desc=${admin.describe_full()}")
    print("trait_desc=${print_desc(admin)}")

    // 3. Delegate mut self
    let mut wc = WrappedCounter { inner: SimpleCounter { value: 0 } }
    wc.inc()
    wc.inc()
    wc.inc()
    print("mut_count=${wc.count()}")

    // 4. Delegate supertrait bound
    let emp = Employee { person: Person { name_val: "Bob" } }
    print("emp_name=${print_named(emp)}")
    print("emp_greet=${emp.greet()}")
}
