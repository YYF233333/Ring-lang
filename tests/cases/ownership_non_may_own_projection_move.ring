struct Holder { text: Str }

fn consume(move value: Str) -> Str {
    "taken:${value}"
}

fn main() {
    let holder = Holder { text: "field" }
    print(consume(holder.text))
    print("field-still:${holder.text}")

    let values = ["indexed"]
    print(consume(values[0]))
    print("index-still:${values[0]}")
}
