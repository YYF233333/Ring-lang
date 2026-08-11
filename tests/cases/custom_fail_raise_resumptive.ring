// A user effect may reuse the public fail.raise spelling. Its authoritative
// EffectDef has no BkFail identity, so it dispatches through handler evidence
// and resumes the handled body instead of lowering to ring_raise/longjmp.
effect fail {
    fn raise(value: Int) -> Int
}

fn main() {
    let result = handle {
        fail.raise(40) + 2
    } with {
        fail.raise(value) => value + 1,
    }
    assert(result == 43, "custom fail.raise resumes body")
    print("custom_fail_raise_resumptive: all tests passed")
}
