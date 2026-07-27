// Regression test: evidence_param_name must round-trip unqualified and
// module-qualified effect identities when default evidence is looked up.

effect Plain {
    fn answer() -> Int {
        42
    }
}

mod fx {
    pub effect Greeter {
        fn greet(name: Str) -> Str {
            "Hello, ${name}"
        }
    }

    pub fn use_greeter() -> Str {
        Greeter.greet("World")
    }
}

mod outer {
    pub mod inner {
        pub effect Greeter {
            fn greet(name: Str) -> Str {
                "Nested hello, ${name}"
            }
        }

        pub fn use_greeter() -> Str {
            Greeter.greet("World")
        }
    }
}

fn main() {
    assert(Plain.answer() == 42, "unqualified default evidence should work")

    let result = fx::use_greeter()
    assert(result == "Hello, World", "module-qualified default evidence should work")

    let nested = outer::inner::use_greeter()
    assert(nested == "Nested hello, World", "nested default evidence should work")
    let qualified = outer::inner::Greeter.greet("Root")
    assert(qualified == "Nested hello, Root", "qualified nested effect op should work")

    print("mod effect evidence: ok")
}
