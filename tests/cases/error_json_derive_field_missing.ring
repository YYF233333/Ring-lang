@derive(Json)
struct JsonFieldMissing {
    callback: fn(Int) -> Int
}

fn main() {
    let value = JsonFieldMissing { callback: fn(x) { x + 1 } }
    print(json_stringify(value))
}
