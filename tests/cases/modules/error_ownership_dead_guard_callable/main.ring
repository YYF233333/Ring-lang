use library::{Resource, dead_guard}

fn require_move(
    callback: fn(move Resource) -> Int
) {}

fn main() {
    require_move(dead_guard)
}
