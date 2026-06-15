// B-069: Default parameter values — LLVM diff test

fn add(a: Int, b: Int = 10) -> Int {
    a + b
}

fn greet(name: Str, greeting: Str = "Hello", suffix: Str = "!") -> Str {
    "${greeting}, ${name}${suffix}"
}

fn main() {
    print(add(5).to_str())
    print(add(5, 20).to_str())
    print(greet("World"))
    print(greet("World", "Hi"))
    print(greet("World", "Hey", "."))
}
