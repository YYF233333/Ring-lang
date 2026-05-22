pub const E0101: Str = "E0101"
pub const E0102: Str = "E0102"
pub const E0103: Str = "E0103"
pub const E0104: Str = "E0104"
pub const E0201: Str = "E0201"
pub const E0203: Str = "E0203"
pub const E0204: Str = "E0204"
pub const E0205: Str = "E0205"
pub const E0206: Str = "E0206"
pub const E0207: Str = "E0207"
pub const E0208: Str = "E0208"
pub const E0301: Str = "E0301"
pub const E0302: Str = "E0302"
pub const E0303: Str = "E0303"
pub const E0304: Str = "E0304"
pub const E0305: Str = "E0305"
pub const E0306: Str = "E0306"
pub const E0307: Str = "E0307"
pub const E0308: Str = "E0308"
pub const E0402: Str = "E0402"
pub const E0403: Str = "E0403"
pub const E0404: Str = "E0404"
pub const E0501: Str = "E0501"
pub const E0502: Str = "E0502"
pub const E0503: Str = "E0503"
pub const E0405: Str = "E0405"
pub const E0504: Str = "E0504"
pub const E0601: Str = "E0601"
pub const E0702: Str = "E0702"
pub const E0703: Str = "E0703"
pub const E0704: Str = "E0704"
pub const E0705: Str = "E0705"
pub const E0706: Str = "E0706"

pub fn error_description(code: Str) -> Str {
    if code == "E0101" { return "Unexpected token" }
    if code == "E0102" { return "Unterminated string literal" }
    if code == "E0103" { return "Expected token" }
    if code == "E0104" { return "Empty parentheses on enum variant" }
    if code == "E0201" { return "Undefined variable" }
    if code == "E0203" { return "Unknown struct or invalid constructor fields" }
    if code == "E0204" { return "Unknown type" }
    if code == "E0205" { return "Assignment to immutable variable" }
    if code == "E0206" { return "Break/continue outside loop" }
    if code == "E0207" { return "Duplicate definition" }
    if code == "E0208" { return "Mutating method on immutable binding" }
    if code == "E0301" { return "Type mismatch" }
    if code == "E0302" { return "Infinite type (occurs check)" }
    if code == "E0303" { return "Numeric type required" }
    if code == "E0304" { return "Invalid field access" }
    if code == "E0305" { return "Undefined method" }
    if code == "E0306" { return "Type does not support indexing" }
    if code == "E0307" { return "Type does not implement Eq" }
    if code == "E0308" { return "Type does not implement Ord" }
    if code == "E0402" { return "Unknown effect operation" }
    if code == "E0403" { return "Unhandled effect" }
    if code == "E0404" { return "Effect annotation violation" }
    if code == "E0405" { return "Capability violation" }
    if code == "E0501" { return "Unknown trait" }
    if code == "E0502" { return "Missing trait method implementation" }
    if code == "E0503" { return "Unsatisfied trait bound" }
    if code == "E0504" { return "Ambiguous trait method" }
    if code == "E0601" { return "Non-exhaustive pattern match" }
    if code == "E0702" { return "Module not found" }
    if code == "E0703" { return "Symbol not found in module" }
    if code == "E0704" { return "Circular dependency detected" }
    if code == "E0705" { return "Relative path out of scope" }
    if code == "E0706" { return "Use declaration must appear before other declarations" }
    "Unknown error"
}

pub fn error_category(code: Str) -> Str {
    if code.starts_with("E01") { return "parse" }
    if code.starts_with("E02") { return "resolution" }
    if code.starts_with("E03") { return "type" }
    if code.starts_with("E04") { return "effect" }
    if code.starts_with("E05") { return "trait" }
    if code.starts_with("E06") { return "pattern" }
    if code.starts_with("E07") { return "module" }
    "unknown"
}
