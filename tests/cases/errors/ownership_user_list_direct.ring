// expect-error: E0207
struct List { value: Int }

fn main() {
    let value = List { value: 1 }
    print(value.value)
}
