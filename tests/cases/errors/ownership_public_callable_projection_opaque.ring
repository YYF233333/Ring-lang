// A module-level callable const may not carry deterministic recovery when its
// producer is only an opaque projection. `pub use` can expose a private const,
// so the durable identity boundary cannot rely only on the declaration's pub.
struct CallbackHolder { callback: fn(Int) -> Int }

fn plus_one(value: Int) -> Int { value + 1 }

const HIDDEN_CALLBACK: fn(Int) -> Int =
    CallbackHolder { callback: plus_one }.callback

pub mod facade {
    pub use super::HIDDEN_CALLBACK as callback
}

fn main() {}
