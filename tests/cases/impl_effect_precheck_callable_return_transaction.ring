// The impl effect pre-pass may publish only its EffectRow. Inferred nested
// callable types must retain valid ownership terms, while speculative lambda
// and call-result DefIds are rebuilt by the retained-HIR pass.

struct Factory {}

fn make_top() -> fn(Int) -> Int {
    fn(value: Int) { value + 1 }
}

impl Factory {
    fn make_lambda(self) {
        fn(value: Int) { value + 1 }
    }

    fn make_call_result(self) {
        make_top()
    }

    fn make_annotated(self) -> fn(Int) -> Int {
        make_top()
    }
}

fn main() {
    print(Factory {}.make_lambda()(1))
    print(Factory {}.make_call_result()(2))
    print(Factory {}.make_annotated()(3))
}
