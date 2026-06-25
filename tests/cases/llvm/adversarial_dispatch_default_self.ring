// B-100 P1.3 adversarial: trait default method calling another method on self.
// The default body must dispatch through the dict to reach the impl's override.
// Also tests: default method calling another default method.

trait Describable {
    fn name(self) -> Str
    fn kind(self) -> Str

    // Default method that calls two other trait methods via self
    fn describe(self) -> Str {
        "${self.kind()}: ${self.name()}"
    }
}

struct Dog { tag: Str }
impl Describable for Dog {
    fn name(self) -> Str { self.tag }
    fn kind(self) -> Str { "dog" }
    // describe uses default
}

struct Cat {}
impl Describable for Cat {
    fn name(self) -> Str { "whiskers" }
    fn kind(self) -> Str { "cat" }
    // describe uses default
}

// Generic function that calls the default method
fn show_thing<T: Describable>(t: T) -> Str {
    t.describe()
}

// Trait with default calling default
trait Greetable {
    fn greeting(self) -> Str {
        "hello"
    }
    fn farewell(self) -> Str {
        "goodbye"
    }
    fn full_exchange(self) -> Str {
        "${self.greeting()} ... ${self.farewell()}"
    }
}

struct Person { who: Str }
impl Greetable for Person {
    fn greeting(self) -> Str { "hi ${self.who}" }
    // farewell and full_exchange use default
}

fn greet_someone<T: Greetable>(t: T) -> Str {
    t.full_exchange()
}

fn main() {
    // Default method calling impl overrides via self
    print(show_thing(Dog { tag: "Rex" }))    // dog: Rex
    print(show_thing(Cat {}))                // cat: whiskers

    // Default method calling mix of default and override
    print(greet_someone(Person { who: "Alice" }))   // hi Alice ... goodbye
}
