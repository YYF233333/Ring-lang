// Ownership-planner/Perceus verifier boundary: Move applies to every type.
// The live planner enforces logical Move for Str, extern H, and Ptr<Int> even
// though those types do not all carry physical RC cleanup.  The tracked-value
// self-reassignment below also provides one inferred post-RC Move edge: under
// --rc-mutate=missing-take, verify_rc must reject exactly that fixture-local
// bare binding.  Explicit non-RC Move is enforced by the ownership planner and
// is intentionally not used as the verifier mutation oracle.

fn consume(move value: Str) -> Int {
    value.len()
}

struct Tracked { id: Int }
impl Drop for Tracked { fn drop(self) {} }

fn consume_tracked(move value: Tracked) -> Int { value.id }

impl Tracked {
    fn into_id(move self) -> Int { self.id }
}

fn keep_tracked(value: Tracked) -> Tracked { value }

fn reassign_tracked() {
    let mut current = Tracked { id: 11 }
    current = keep_tracked(current)
    print(current.id)
}

fn main() {
    let text = "move me"
    print(consume(text))
    let direct = Tracked { id: 7 }
    print(consume_tracked(direct))
    let receiver = Tracked { id: 9 }
    print(receiver.into_id())
    reassign_tracked()
}

// Extern payload containment probe.  Both list parameters are logical Move
// sources because either may become the return value.  The live verifier must
// nevertheless accept their cleanup shape without treating H as deep-Drop.
// This function is compiled and verified but never invoked.
extern type H

fn consume_handle(move value: H) {}

fn take_handle(value: H) {
    consume_handle(value)
}

fn consume_ptr(move value: Ptr<Int>) {}

fn take_ptr(value: Ptr<Int>) {
    consume_ptr(value)
}
