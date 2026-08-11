// The builtin fail.raise identity remains abortive: its handler arm supplies
// the whole handle value and execution after the raise inside the body is dead.
fn main() {
    let result = handle {
        fail.raise("boom")
        99
    } with {
        fail.raise(message: Str) => message.len(),
    }
    assert(result == 4, "builtin fail.raise aborts")
    print("builtin_fail_raise_abort_identity: all tests passed")
}
