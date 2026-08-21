trait ExactDefaultTrait {
    fn compute(self, value: Int) -> Int {
        let value = value + 1
        let read_value = fn() -> Int { value }
        read_value()
    }
}

struct ExactDefaultCarrier {}

impl ExactDefaultTrait for ExactDefaultCarrier {}

fn invoke_trait<T: ExactDefaultTrait>(item: T) -> Int {
    item.compute(40)
}

fn mixed_evidence_capture<T: Ord>(left: T, right: T) -> Bool {
    let __ring_T_Ord = true
    let mixed = fn() -> Bool { __ring_T_Ord && left < right }
    mixed()
}

effect ExactDefaultEffect {
    fn compute(value: Int) -> Int {
        let value = value + 2
        let read_value = fn() -> Int { value }
        read_value()
    }
}

fn main() {
    print(invoke_trait(ExactDefaultCarrier {}))
    print(ExactDefaultEffect.compute(40))
    print(mixed_evidence_capture(1, 2))
}
