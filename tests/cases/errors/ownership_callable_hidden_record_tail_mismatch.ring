// expect-error: E0301
// Two row tails are populated before they are unified.  The left tail hides
// Borrow/Move callable contracts behind nominal fields; the right tail shares
// one inferred callable type across matching structural fields.  The final
// merge must select transactional unification and reject the second contract.
struct Resource { id: Int }
impl Drop for Resource { fn drop(self) {} }

struct BorrowBox { callback: fn(Resource) -> Int }
struct MoveBox { callback: fn(move Resource) -> Int }

fn constrain_left(
    value: {tag: Int, first: BorrowBox, second: MoveBox}
) -> Unit {}

fn constrain_right<C>(
    value: {tag: Int, first: {callback: C}, second: {callback: C}}
) -> Unit {}

fn main() {
    // Keep the probe in a lambda so named-function signature rebind does not
    // add an unrelated higher-order-parameter diagnostic before the tail
    // unification itself is exercised.
    let expose_hidden_tail_mismatch = fn(
        left: {tag: Int, ..left_row},
        right: {tag: Int, ..right_row}
    ) -> Unit {
        constrain_left(left)
        constrain_right(right)
        // Branch unification sees only the two open record types.  It must
        // follow their already-bound tails rather than being selected
        // incidentally by a surrounding generic callable type.
        let merged = if true { left } else { right }
        print(merged.tag)
    }
}
