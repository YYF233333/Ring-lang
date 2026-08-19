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
}
