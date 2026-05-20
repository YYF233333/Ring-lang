pub fn E0101() -> Str { "E0101" }
pub fn E0102() -> Str { "E0102" }
pub fn E0103() -> Str { "E0103" }
pub fn E0201() -> Str { "E0201" }
pub fn E0203() -> Str { "E0203" }
pub fn E0204() -> Str { "E0204" }
pub fn E0205() -> Str { "E0205" }
pub fn E0206() -> Str { "E0206" }
pub fn E0207() -> Str { "E0207" }
pub fn E0301() -> Str { "E0301" }
pub fn E0302() -> Str { "E0302" }
pub fn E0303() -> Str { "E0303" }
pub fn E0304() -> Str { "E0304" }
pub fn E0305() -> Str { "E0305" }
pub fn E0307() -> Str { "E0307" }
pub fn E0308() -> Str { "E0308" }
pub fn E0402() -> Str { "E0402" }
pub fn E0403() -> Str { "E0403" }
pub fn E0501() -> Str { "E0501" }
pub fn E0502() -> Str { "E0502" }
pub fn E0503() -> Str { "E0503" }
pub fn E0601() -> Str { "E0601" }
pub fn E0702() -> Str { "E0702" }
pub fn E0703() -> Str { "E0703" }
pub fn E0704() -> Str { "E0704" }
pub fn E0706() -> Str { "E0706" }

pub fn error_description(code: Str) -> Str {
    if code == "E0101" { return "Unexpected token" }
    if code == "E0102" { return "Unterminated string literal" }
    if code == "E0103" { return "Expected token" }
    if code == "E0201" { return "Undefined variable" }
    if code == "E0203" { return "Unknown struct or invalid constructor fields" }
    if code == "E0204" { return "Unknown type" }
    if code == "E0205" { return "Assignment to immutable variable" }
    if code == "E0206" { return "Break/continue outside loop" }
    if code == "E0207" { return "Duplicate definition" }
    if code == "E0301" { return "Type mismatch" }
    if code == "E0302" { return "Infinite type (occurs check)" }
    if code == "E0303" { return "Numeric type required" }
    if code == "E0304" { return "Invalid field access" }
    if code == "E0305" { return "Undefined method" }
    if code == "E0307" { return "Type does not implement Eq" }
    if code == "E0308" { return "Type does not implement Ord" }
    if code == "E0402" { return "Unknown effect operation" }
    if code == "E0403" { return "Unhandled effect" }
    if code == "E0501" { return "Unknown trait" }
    if code == "E0502" { return "Missing trait method implementation" }
    if code == "E0503" { return "Unsatisfied trait bound" }
    if code == "E0601" { return "Non-exhaustive pattern match" }
    if code == "E0702" { return "Module not found" }
    if code == "E0703" { return "Symbol not found in module" }
    if code == "E0704" { return "Circular dependency detected" }
    if code == "E0706" { return "Use declaration must appear before other declarations" }
    "Unknown error"
}
