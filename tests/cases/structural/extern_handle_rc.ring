// Compile-only structural fixture. No function accepting StructuralRawHandle is
// ever executed: the generated C is the oracle for foreign-handle RC exclusion.

extern type StructuralRawHandle
extern fn structural_make_raw_handle() -> StructuralRawHandle

struct StructuralHolder {
    raw: StructuralRawHandle,
    owned: Str
}

enum StructuralChoice {
    Raw(StructuralRawHandle),
    Owned(Str)
}

fn structural_raw_identity(value: StructuralRawHandle) {
    let local = value
}

fn structural_owned_identity(value: Str) {
    let local = value
}

fn structural_raw_option(value: StructuralRawHandle) {
    let wrapped = some(value)
}

fn structural_owned_option(value: Str) {
    let wrapped = some(value)
}

fn structural_raw_list(value: StructuralRawHandle) {
    let mut values: List<StructuralRawHandle> = []
    values.push(value)
}

fn structural_owned_list(value: Str) {
    let mut values: List<Str> = []
    values.push(value)
}

fn main() {
    // Intentionally empty: raw foreign handles cannot be fabricated safely.
}
