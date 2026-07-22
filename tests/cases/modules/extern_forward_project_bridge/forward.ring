pub fn marker() -> Int { 0 }

// Intentional project-internal forward declaration: provider imports this
// module, so a normal reverse use would create a dependency cycle.
extern fn bridge(value: Int) -> Int

// This remains genuine FFI even though another project module defines a
// same-signature Ring function named parse_int: that module does not depend
// on this declaration module.
extern fn parse_int(value: Str) -> Option<Int>

pub fn call_bridge() -> Int { bridge(41) }
pub fn call_ffi() -> Int { parse_int("7").unwrap_or(0) }
