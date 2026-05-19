// Test: json_stringify — converts values to JSON strings

struct Point { x: Int, y: Int }

enum Color { Red, Blue }

fn main() {
    // Primitives
    assert(json_stringify(42) == "42")
    assert(json_stringify("hello") == "\"hello\"")
    assert(json_stringify(true) == "true")

    // List
    let xs = [1, 2, 3]
    assert(json_stringify(xs) == "[1,2,3]")

    // Struct (JS class with named fields)
    let p = Point { x: 1, y: 2 }
    let s = json_stringify(p)
    assert(s.contains("\"x\":1"))
    assert(s.contains("\"y\":2"))

    // Enum variant
    let c = Red
    let cs = json_stringify(c)
    assert(cs.contains("\"_tag\":\"Red\""))

    print("json_stringify: all tests passed")
}
