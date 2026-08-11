fn main() {
    let text = "hello"
    let values = [1, 2, 3]
    let read_text = fn() -> Int { text.len() }
    let read_values = fn() -> Int { values.len() }

    print(read_text())
    print(read_values())
    print(text)
    print(values.len())
}
