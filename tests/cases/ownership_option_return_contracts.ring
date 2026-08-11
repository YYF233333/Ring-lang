struct Resource { id: Int }

impl Drop for Resource {
    fn drop(self) {}
}

fn fallback() -> Resource {
    Resource { id: 20 }
}

fn some_to_fail() -> Resource with {fail<Resource>} {
    some(Resource { id: 21 }).to_fail(Resource { id: 22 })
}

fn none_to_fail() -> Resource with {fail<Resource>} {
    let absent: Resource? = none
    absent.to_fail(Resource { id: 23 })
}

fn main() {
    let from_some = some(Resource { id: 18 }).unwrap_or_else(fallback)
    print(from_some.id)

    let absent: Resource? = none
    let from_none = absent.unwrap_or_else(fallback)
    print(from_none.id)

    let successful = some_to_fail()
    print(successful.id)

    let recovered = none_to_fail() catch {
        error => error,
    }
    print(recovered.id)
}
