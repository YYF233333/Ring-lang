// Same leaf as the forward, incompatible signature: never a candidate.
pub fn bridge(value: Str) -> Str { value }

// Same signature as a real FFI declaration but no reverse dependency: it
// must not capture the raw ABI call.
pub fn parse_int(value: Str) -> Option<Int> { none }

pub fn keep_decoy() -> Int { 0 }
