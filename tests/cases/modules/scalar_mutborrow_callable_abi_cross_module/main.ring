use helper::{bump, apply}

fn main() {
    let mut direct = 50
    assert(bump(direct) == 51, "imported direct return")
    assert(direct == 51, "imported direct writeback")

    let imported_alias = bump
    let mut via_alias = 60
    assert(imported_alias(via_alias) == 61, "imported alias return")
    assert(via_alias == 61, "imported alias writeback")

    let mut via_hof = 70
    assert(apply(bump, via_hof) == 71, "imported HOF return")
    assert(via_hof == 71, "imported HOF writeback")

    print("scalar_mutborrow_callable_abi_cross_module: all tests passed")
}
