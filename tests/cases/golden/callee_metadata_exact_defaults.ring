// B-107 Unit 2: call metadata follows the inferred callee's exact DefId.
// All inline modules share one InferCtx so this does not depend on the
// separately scheduled cross-file default-HExpr remap. Canonical module names
// are owner-first in SCC lexical order, isolating metadata identity from the
// separately staged exact-alias call-graph scheduling work.

// The final alias below has this same spelling. A raw-name lookup would select
// this unrelated default instead of the re-export target's default.
fn forwarded(value: Int, delta: Int = 700) -> Int {
    value + delta
}

fn plus_three(value: Int) -> Int {
    value + 3
}

fn invoke_shadow(forwarded: fn(Int) -> Int) -> Int {
    // LocalBorrow must keep its one-argument closure ABI. It must not inherit
    // the unrelated top-level `forwarded` default metadata.
    forwarded(7)
}

pub mod aa_origin {
    pub fn select(value: Int, delta: Int = 2) -> Int {
        value + delta
    }
}

pub mod ab_decoy {
    // Same declaration leaf as aa_origin::select, but different metadata.
    pub fn select(value: Int, delta: Int = 100) -> Int {
        value + delta
    }
}

pub mod ba_target_middle {
    pub use super::aa_origin::select as relay
}

pub mod bb_decoy_middle {
    pub use super::ab_decoy::select as relay
}

pub mod ca_facade {
    pub use super::ba_target_middle::relay as forwarded
    pub use super::bb_decoy_middle::relay as decoy_forwarded
}

pub mod zz_consumer {
    pub fn target_omitted() -> Int {
        ca_facade::forwarded(40)
    }

    pub fn decoy_omitted() -> Int {
        ca_facade::decoy_forwarded(40)
    }
}

struct Seed {
    value: Int
}

impl Seed {
    // The impl pre-pass intentionally seeds unqualified `seeded` defaults.
    fn seeded(self, delta: Int = 900) -> Int {
        self.value + delta
    }
}

// This declaration is the authoritative owner of top-level `seeded` and has
// no default. Its one argument must not be supplemented from the impl seed.
fn seeded(value: Int) -> Int {
    value + 1
}

fn main() {
    print(zz_consumer::target_omitted())
    print(zz_consumer::decoy_omitted())
    print(invoke_shadow(plus_three))
    print(seeded(5))
}
