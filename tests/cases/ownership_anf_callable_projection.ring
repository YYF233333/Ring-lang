// B-104 ANF callable metadata: materialised callable control-flow values carry
// the exact source-set ownership contract; a call-produced closure carries its
// returned callable identity.

fn increment(x: Int) -> Int { x + 1 }
fn decrement(x: Int) -> Int { x - 1 }

fn apply(f: fn(Int) -> Int, value: Int) -> Int { f(value) }

fn make_adder(n: Int) -> fn(Int) -> Int {
    fn(x: Int) -> Int { x + n }
}

fn main() {
    let flag = true
    let branch_value = apply(
        if flag { increment } else { decrement }, 10)
    let match_value = apply(match flag {
        true => increment
        false => decrement
    }, 20)
    let call_value = make_adder(5)(30)
    print(branch_value + match_value + call_value)
}
