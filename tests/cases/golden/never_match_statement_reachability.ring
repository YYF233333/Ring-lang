// Regression: a diverging first match arm is bottom, not the match result.
// The Unit arm keeps the match statement reachable and the following value
// must survive ANF reachability pruning.

enum Probe {
    Abort,
    Continue,
}

fn after_never_match(probe: Probe) -> Int {
    match probe {
        Probe::Abort => panic("unreachable"),
        Probe::Continue => {},
    }
    let preserved = 40
    preserved + 2
}

fn main() {
    print(after_never_match(Probe::Continue))
}
