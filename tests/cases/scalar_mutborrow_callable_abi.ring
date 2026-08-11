// Scalar MutBorrow ABI must follow the frozen callable descriptor at every
// exact DefId edge: direct function, alias, lambda, and HOF callback.
fn bump(mut value: Int) -> Int {
    value = value + 1
    value
}

fn apply(callback: fn(mut Int) -> Int, mut value: Int) -> Int {
    callback(value)
    value
}

fn main() {
    let mut direct = 1
    assert(bump(direct) == 2, "direct return")
    assert(direct == 2, "direct writeback")

    let alias = bump
    let mut via_alias = 10
    assert(alias(via_alias) == 11, "alias return")
    assert(via_alias == 11, "alias writeback")

    let lambda = fn(mut value: Int) -> Int {
        value = value + 2
        value
    }
    let mut via_lambda = 20
    assert(lambda(via_lambda) == 22, "lambda return")
    assert(via_lambda == 22, "lambda writeback")

    let mut via_hof = 30
    assert(apply(bump, via_hof) == 31, "HOF named return")
    assert(via_hof == 31, "HOF named writeback")

    let mut via_hof_lambda = 40
    assert(apply(lambda, via_hof_lambda) == 42, "HOF lambda return")
    assert(via_hof_lambda == 42, "HOF lambda writeback")

    print("scalar_mutborrow_callable_abi: all tests passed")
}
