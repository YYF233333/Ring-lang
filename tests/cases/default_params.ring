// B-069: Default parameter values

fn add(a: Int, b: Int = 10) -> Int {
    a + b
}

fn greet(name: Str, greeting: Str = "Hello", suffix: Str = "!") -> Str {
    "${greeting}, ${name}${suffix}"
}

fn connect(host: Str, port: Int = 8080, timeout: Int = 30) -> Str {
    "${host}:${port.to_str()} (timeout=${timeout.to_str()})"
}

fn main() {
    // Single default param - omit
    print(add(5).to_str())       // 15

    // Single default param - provide
    print(add(5, 20).to_str())   // 25

    // Multiple defaults - omit all
    print(greet("World"))        // Hello, World!

    // Multiple defaults - provide first default only
    print(greet("World", "Hi"))  // Hi, World!

    // Multiple defaults - provide all
    print(greet("World", "Hey", "."))  // Hey, World.

    // Three params, two defaults - omit all defaults
    print(connect("localhost"))  // localhost:8080 (timeout=30)

    // Three params, two defaults - provide one default
    print(connect("localhost", 3000))  // localhost:3000 (timeout=30)

    // Three params, two defaults - provide all
    print(connect("localhost", 3000, 60))  // localhost:3000 (timeout=60)
}
