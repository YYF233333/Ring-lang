// A failed const owner may allocate callable identities and constrain their
// ownership UF before a later expression aborts inference. None of that
// discarded authority may contaminate the independent GOOD owner.

fn plus_one(value: Int) -> Int { value + 1 }

const BAD = {
    let callback = plus_one
    let observed = callback(1)
    for item in 1 { print(item) }
    observed
}

const GOOD: fn(Int) -> Int = plus_one

fn main() {
    print(GOOD(41))
}
