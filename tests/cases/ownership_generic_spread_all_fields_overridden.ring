struct Resource { label: Str }

impl Drop for Resource {
    fn drop(self) {}
}

struct Cell<T> { value: T }

// T remains unresolved while this body is checked and may carry Drop. The
// spread is nevertheless a borrow: its only field is explicitly overridden,
// so no projection of source is transferred into the result.
fn replace<T>(source: Cell<T>, replacement: T) -> Cell<T> {
    Cell { ..source, value: replacement }
}

fn main() {
    let resource_source = Cell {
        value: Resource { label: "old-resource" },
    }
    let resource_replaced = replace(
        resource_source,
        Resource { label: "new-resource" },
    )
    print("resource_replacement=${resource_replaced.value.label}")
    print("resource_source=${resource_source.value.label}")

    let str_source = Cell { value: "old-str" }
    let str_replaced = replace(str_source, "new-str")
    print("str_replacement=${str_replaced.value}")
    print("str_source=${str_source.value}")
}
