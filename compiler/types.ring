pub const BUILTIN_INT: Str = "Int"
pub const BUILTIN_FLOAT: Str = "Float"
pub const BUILTIN_STR: Str = "Str"
pub const BUILTIN_BOOL: Str = "Bool"
pub const BUILTIN_RANGE: Str = "Range"
pub const BUILTIN_LIST: Str = "List"
pub const BUILTIN_MAP: Str = "Map"
pub const BUILTIN_SET: Str = "Set"
pub const BUILTIN_OPTION: Str = "Option"
pub const BUILTIN_CELL: Str = "Cell"
pub const BUILTIN_STRING_BUILDER: Str = "StringBuilder"
pub const BUILTIN_PTR: Str = "Ptr"

pub struct StructField {
    pub name: Str,
    pub ty: Type,
    pub is_pub: Bool
}

pub struct EnumVariant {
    pub name: Str,
    pub fields: List<Type>,
    pub field_names: List<Str>?
}

pub struct RecordField {
    pub name: Str,
    pub ty: Type
}

// Callable ownership is a shadow-only, compact tag in Unit 1.  Candidate A
// keeps the Type enum at three payload slots by grouping effects and ownership
// in FnMeta; FnMeta is a real heap object, not an allocation-neutral shim.  A
// bounded wall/RSS data gate will compare this representation with flat4 after
// integration. Descriptor/provenance data lives in OwnershipMetadata. Legacy
// equality, unification, rendering, acceptance and lowering intentionally
// ignore the ownership tag until the solver and Take lowering cut over
// atomically.
pub const PARAM_OWNERSHIP_BORROW: Int = 0
pub const PARAM_OWNERSHIP_MUT_BORROW: Int = 1
pub const PARAM_OWNERSHIP_MOVE: Int = 2
pub const PARAM_OWNERSHIP_UNKNOWN: Int = 3

pub const RETURN_OWNERSHIP_OWNED: Int = 0
pub const RETURN_OWNERSHIP_BORROWED: Int = 1
pub const RETURN_OWNERSHIP_UNKNOWN: Int = 2

pub const CALLABLE_SOURCE_BODY_INFERRED: Int = 0
pub const CALLABLE_SOURCE_DECLARED: Int = 1
pub const CALLABLE_SOURCE_BUILTIN: Int = 2
pub const CALLABLE_SOURCE_CONSERVATIVE_INTERFACE: Int = 3
pub const CALLABLE_SOURCE_CALL_CONSTRAINT: Int = 4

// Canonical descriptor IDs. Uniform descriptors have no arity-sized list.
// The non-uniform IDs cover the current builtin/slot boundaries exactly; user
// interfaces use either uniform Borrow or first-MutBorrow/rest-Borrow.
pub const CALLABLE_BORROW_OWNED: Int = 0
pub const CALLABLE_MOVE_OWNED: Int = 1
pub const CALLABLE_UNKNOWN: Int = 2
pub const CALLABLE_FIRST_MUT_BORROW_OWNED: Int = 3
pub const CALLABLE_BORROW_BORROWED: Int = 4
pub const CALLABLE_MUT_MOVE_OWNED: Int = 5
pub const CALLABLE_BORROW_MOVE_BORROWED: Int = 6
pub const CALLABLE_MOVE_BORROW_OWNED: Int = 7
pub const CALLABLE_BORROW_MUT_BORROW_OWNED: Int = 8
pub const CALLABLE_MUT_BORROW_MOVE_OWNED: Int = 9
pub const CALLABLE_SLOT_MOVE_OWNED: Int = 10

// `rest_param >= 0` applies after the explicit prefix without storing an
// arity-sized list. `rest_param == -1` makes the prefix exact; out-of-range
// lookup then fails closed to Unknown.
pub struct CallableOwnershipDescriptor {
    pub prefix_params: List<Int>,
    pub rest_param: Int,
    pub result: Int
}

pub struct CallableOwnershipState {
    pub source: Int,
    pub inference_id: Int?
}

pub struct FnMeta {
    pub effects: EffectRow,
    pub ownership_id: Int
}

// Symbolic ownership shape for one nominal type constructor.  `may_own`
// means every instantiation may directly/transitively contain a user Drop
// value; `param_deps[i]` means the answer additionally depends on whether the
// i-th actual type argument may own one.  This finite bit-vector is the fixed
// point exported between modules.
pub struct OwnershipShape {
    pub may_own: Bool,
    pub param_deps: List<Bool>
}

// One transport bundle crosses TypeEnv, HProgram and ModuleExports. DefIds are
// the only declaration identity: no name-keyed fallback is permitted. Solver
// state remains separate from canonical descriptors so singleton contracts do
// not multiply by source, call count or arity.
pub struct OwnershipMetadata {
    pub callable_descriptors: Map<Int, CallableOwnershipDescriptor>,
    pub callable_by_def_id: Map<Int, Int>,
    pub callable_state_by_def_id: Map<Int, CallableOwnershipState>,
    pub ownership_shapes: Map<Str, OwnershipShape>
}

pub enum Type {
    IntType,
    FloatType,
    StrType,
    BoolType,
    UnitType,
    NeverType,
    AnyType,
    TypeVar { id: Int, name: Str? },
    FnType { params: List<Type>, return_type: Type, meta: FnMeta },
    StructType { name: Str, type_params: List<Type> },
    EnumType { name: Str, type_params: List<Type> },
    GenericType { base: Type, args: List<Type> },
    RecordType { fields: List<RecordField>, tail: Int?, tail_name: Str? },
    EffectRowType { effects: List<Effect>, tail: Int? },
    TupleType { elements: List<Type> },
    PtrType { pointee: Type },
    ErrorType
}

pub enum Effect {
    IoEffect,
    FailEffect { error_type: Type },
    MutEffect { state_type: Type },
    CustomEffect { name: Str, type_args: List<Type> },
    UnsafeEffect
}

pub struct EffectRow {
    pub effects: List<Effect>,
    pub tail: Int?
}

pub struct RowMergeResult {
    pub row: EffectRow,
    pub tails_to_unify: Option<(Int, Int)>
}

pub const INT: Type = Type::IntType
pub const FLOAT: Type = Type::FloatType
pub const STR: Type = Type::StrType
pub const BOOL: Type = Type::BoolType
pub const UNIT: Type = Type::UnitType
pub const NEVER: Type = Type::NeverType
pub const ANY: Type = Type::AnyType

pub const EMPTY_ROW: EffectRow = EffectRow { effects: [], tail: none }

pub fn fn_meta(effects: EffectRow, ownership_id: Int) -> FnMeta {
    FnMeta { effects: effects, ownership_id: ownership_id }
}

pub fn new_ownership_metadata() -> OwnershipMetadata {
    OwnershipMetadata {
        // Canonical 0..10 descriptors are decoded without Map/List allocation.
        // This table is reserved for genuinely dynamic mixed solver results.
        callable_descriptors: map_new(),
        callable_by_def_id: map_new(),
        callable_state_by_def_id: map_new(),
        ownership_shapes: map_new()
    }
}

pub fn is_canonical_callable_ownership(ownership_id: Int) -> Bool {
    ownership_id >= CALLABLE_BORROW_OWNED &&
        ownership_id <= CALLABLE_SLOT_MOVE_OWNED
}

pub fn callable_descriptors_equal(
    a: CallableOwnershipDescriptor, b: CallableOwnershipDescriptor
) -> Bool {
    if a.rest_param != b.rest_param || a.result != b.result ||
       a.prefix_params.len() != b.prefix_params.len() {
        return false
    }
    let mut index = 0
    while index < a.prefix_params.len() {
        if a.prefix_params.get(index) != b.prefix_params.get(index) {
            return false
        }
        index = index + 1
    }
    true
}

pub fn record_callable_ownership(
    mut metadata: OwnershipMetadata, def_id: Int, ownership_id: Int,
    source: Int, inference_id: Int?
) {
    if !is_canonical_callable_ownership(ownership_id) &&
       !metadata.callable_descriptors.contains_key(ownership_id) {
        panic("unreachable: callable ownership descriptor is not registered")
    }
    metadata.callable_by_def_id.insert(def_id, ownership_id)
    metadata.callable_state_by_def_id.insert(def_id, CallableOwnershipState {
        source: source, inference_id: inference_id
    })
}

pub fn callable_param_ownership(
    metadata: OwnershipMetadata, ownership_id: Int, index: Int
) -> Int {
    if ownership_id == CALLABLE_BORROW_OWNED ||
       ownership_id == CALLABLE_BORROW_BORROWED {
        return PARAM_OWNERSHIP_BORROW
    }
    if ownership_id == CALLABLE_MOVE_OWNED {
        return PARAM_OWNERSHIP_MOVE
    }
    if ownership_id == CALLABLE_UNKNOWN {
        return PARAM_OWNERSHIP_UNKNOWN
    }
    if ownership_id == CALLABLE_FIRST_MUT_BORROW_OWNED {
        return if index == 0 {
            PARAM_OWNERSHIP_MUT_BORROW
        } else {
            PARAM_OWNERSHIP_BORROW
        }
    }
    if ownership_id == CALLABLE_MUT_MOVE_OWNED {
        if index == 0 { return PARAM_OWNERSHIP_MUT_BORROW }
        if index == 1 { return PARAM_OWNERSHIP_MOVE }
        return PARAM_OWNERSHIP_UNKNOWN
    }
    if ownership_id == CALLABLE_BORROW_MOVE_BORROWED {
        if index == 0 { return PARAM_OWNERSHIP_BORROW }
        if index == 1 { return PARAM_OWNERSHIP_MOVE }
        return PARAM_OWNERSHIP_UNKNOWN
    }
    if ownership_id == CALLABLE_MOVE_BORROW_OWNED {
        if index == 0 { return PARAM_OWNERSHIP_MOVE }
        if index == 1 { return PARAM_OWNERSHIP_BORROW }
        return PARAM_OWNERSHIP_UNKNOWN
    }
    if ownership_id == CALLABLE_BORROW_MUT_BORROW_OWNED {
        if index == 0 || index == 2 { return PARAM_OWNERSHIP_BORROW }
        if index == 1 { return PARAM_OWNERSHIP_MUT_BORROW }
        return PARAM_OWNERSHIP_UNKNOWN
    }
    if ownership_id == CALLABLE_MUT_BORROW_MOVE_OWNED {
        if index == 0 { return PARAM_OWNERSHIP_MUT_BORROW }
        if index == 1 { return PARAM_OWNERSHIP_BORROW }
        if index == 2 { return PARAM_OWNERSHIP_MOVE }
        return PARAM_OWNERSHIP_UNKNOWN
    }
    if ownership_id == CALLABLE_SLOT_MOVE_OWNED {
        if index == 0 || index == 2 {
            return PARAM_OWNERSHIP_MUT_BORROW
        }
        if index == 1 || index == 3 || index == 4 {
            return PARAM_OWNERSHIP_BORROW
        }
        return PARAM_OWNERSHIP_UNKNOWN
    }
    match metadata.callable_descriptors.get(ownership_id) {
        some(descriptor) => match descriptor.prefix_params.get(index) {
            some(mode) => mode,
            none => if descriptor.rest_param >= 0 {
                descriptor.rest_param
            } else {
                PARAM_OWNERSHIP_UNKNOWN
            }
        },
        none => PARAM_OWNERSHIP_UNKNOWN
    }
}

pub fn callable_return_ownership(
    metadata: OwnershipMetadata, ownership_id: Int
) -> Int {
    if ownership_id == CALLABLE_UNKNOWN {
        return RETURN_OWNERSHIP_UNKNOWN
    }
    if ownership_id == CALLABLE_BORROW_BORROWED ||
       ownership_id == CALLABLE_BORROW_MOVE_BORROWED {
        return RETURN_OWNERSHIP_BORROWED
    }
    if is_canonical_callable_ownership(ownership_id) {
        return RETURN_OWNERSHIP_OWNED
    }
    match metadata.callable_descriptors.get(ownership_id) {
        some(descriptor) => descriptor.result,
        none => RETURN_OWNERSHIP_UNKNOWN
    }
}

pub fn effect_kind_name(e: Effect) -> Str {
    match e {
        Effect::IoEffect => "io",
        Effect::MutEffect { .. } => "mut",
        Effect::FailEffect { .. } => "fail",
        Effect::CustomEffect { name, .. } => name,
        Effect::UnsafeEffect => "unsafe"
    }
}

fn is_type_var(t: Type) -> Bool {
    match t { Type::TypeVar { .. } => true, _ => false }
}

pub fn effects_match_kind(a: Effect, b: Effect) -> Bool {
    match a {
        Effect::IoEffect => match b { Effect::IoEffect => true, _ => false },
        // is_type_var fallback: during row_merge, type vars may not yet be resolved.
        // Without this, mut<?T> and mut<Int> (where ?T will resolve to Int) would be
        // kept as separate effects. The broader match ensures deduplication in row_merge;
        // effects_same_kind (used elsewhere) requires exact type equality for stricter checks.
        Effect::MutEffect { state_type: sa } => match b {
            Effect::MutEffect { state_type: sb } => is_type_var(sa) || is_type_var(sb) || types_equal(sa, sb),
            _ => false
        },
        // Intentional: all FailEffects match regardless of error type parameter.
        // Ring uses single-fail-effect design — the unification engine separately
        // handles error type parameter merging during row unification.
        Effect::FailEffect { .. } => match b { Effect::FailEffect { .. } => true, _ => false },
        Effect::CustomEffect { name: na, .. } => match b {
            Effect::CustomEffect { name: nb, .. } => na == nb,
            _ => false
        },
        Effect::UnsafeEffect => match b { Effect::UnsafeEffect => true, _ => false }
    }
}

pub fn type_to_builtin_name(t: Type) -> Str? {
    match t {
        Type::IntType => some(BUILTIN_INT),
        Type::FloatType => some(BUILTIN_FLOAT),
        Type::StrType => some(BUILTIN_STR),
        Type::BoolType => some(BUILTIN_BOOL),
        Type::UnitType => some("Unit"),
        Type::PtrType { .. } => some(BUILTIN_PTR),
        Type::StructType { name, .. } => some(name),
        Type::EnumType { name, .. } => some(name),
        Type::ErrorType => none,
        _ => none
    }
}

pub fn make_option_type(inner: Type) -> Type {
    Type::EnumType {
        name: BUILTIN_OPTION,
        type_params: [inner]
    }
}

pub fn is_option_type(t: Type) -> Bool {
    match t {
        Type::EnumType { name, type_params, .. } =>
            name == BUILTIN_OPTION && type_params.len() == 1,
        _ => false
    }
}

pub fn option_inner(t: Type) -> Type {
    match t {
        Type::EnumType { type_params, .. } => type_params.first().unwrap_or(UNIT),
        _ => UNIT
    }
}

pub fn make_list_type(element: Type) -> Type {
    Type::StructType { name: BUILTIN_LIST, type_params: [element] }
}

pub fn is_list_type(t: Type) -> Bool {
    match t {
        Type::StructType { name, type_params, .. } => name == BUILTIN_LIST && type_params.len() == 1,
        _ => false
    }
}

pub fn list_element(t: Type) -> Type {
    match t {
        Type::StructType { type_params, .. } => type_params.first().unwrap_or(UNIT),
        _ => UNIT
    }
}

pub fn make_map_type(key: Type, value: Type) -> Type {
    Type::StructType { name: BUILTIN_MAP, type_params: [key, value] }
}

pub fn is_map_type(t: Type) -> Bool {
    match t {
        Type::StructType { name, type_params, .. } => name == BUILTIN_MAP && type_params.len() == 2,
        _ => false
    }
}

pub fn make_set_type(element: Type) -> Type {
    Type::StructType { name: BUILTIN_SET, type_params: [element] }
}

pub fn is_set_type(t: Type) -> Bool {
    match t {
        Type::StructType { name, type_params, .. } => name == BUILTIN_SET && type_params.len() == 1,
        _ => false
    }
}

pub fn effect_row(effects: List<Effect>) -> EffectRow {
    EffectRow { effects: effects, tail: none }
}

pub fn open_effect_row(effects: List<Effect>, tail: Int) -> EffectRow {
    EffectRow { effects: effects, tail: some(tail) }
}

pub fn row_contains(row: EffectRow, eff: Effect) -> Bool {
    row.effects.any(fn(e) { effects_equal(e, eff) })
}

pub fn effects_same_kind(a: Effect, b: Effect) -> Bool {
    match a {
        Effect::IoEffect => match b { Effect::IoEffect => true, _ => false },
        Effect::MutEffect { state_type: sa } => match b { Effect::MutEffect { state_type: sb } => types_equal(sa, sb), _ => false },
        Effect::FailEffect { error_type: ea } => match b {
            Effect::FailEffect { error_type: eb } => types_equal(ea, eb),
            _ => false
        },
        Effect::CustomEffect { name: na, .. } => match b {
            Effect::CustomEffect { name: nb, .. } => na == nb,
            _ => false
        },
        Effect::UnsafeEffect => match b { Effect::UnsafeEffect => true, _ => false }
    }
}

pub fn row_merge(a: EffectRow, b: EffectRow) -> RowMergeResult {
    let mut merged = list_clone(a.effects)
    for eff in b.effects {
        if !merged.any(fn(e) { effects_match_kind(e, eff) }) {
            merged.push(eff)
        }
    }
    let tail: Int? = match (a.tail, b.tail) {
        (some(ta), _) => some(ta),
        (_, some(tb)) => some(tb),
        _ => none
    }
    let tails_to_unify: Option<(Int, Int)> = match (a.tail, b.tail) {
        (some(ta), some(tb)) => if ta != tb { some((ta, tb)) } else { none },
        _ => none
    }
    RowMergeResult {
        row: EffectRow { effects: merged, tail: tail },
        tails_to_unify: tails_to_unify
    }
}

fn type_lists_equal(a: List<Type>, b: List<Type>) -> Bool {
    if a.len() != b.len() { return false }
    let mut i = 0
    while i < a.len() {
        if let some(x) = a.get(i) {
            if let some(y) = b.get(i) {
                if !types_equal(x, y) { return false }
            }
        }
        i = i + 1
    }
    true
}

fn effects_list_equal(a: List<Effect>, b: List<Effect>) -> Bool {
    if a.len() != b.len() { return false }
    let mut i = 0
    while i < a.len() {
        if let some(x) = a.get(i) {
            if let some(y) = b.get(i) {
                if !effects_equal(x, y) { return false }
            }
        }
        i = i + 1
    }
    true
}

fn optional_ids_equal(a: Int?, b: Int?) -> Bool {
    match (a, b) {
        (some(x), some(y)) => x == y,
        _ => a.is_none() && b.is_none()
    }
}

pub fn param_ownership_compatible(a: Int, b: Int) -> Bool {
    a == b || a == PARAM_OWNERSHIP_UNKNOWN || b == PARAM_OWNERSHIP_UNKNOWN
}

pub fn return_ownership_compatible(a: Int, b: Int) -> Bool {
    a == b || a == RETURN_OWNERSHIP_UNKNOWN || b == RETURN_OWNERSHIP_UNKNOWN
}

// Solver-only relation. Keeping it separate prevents Unknown from becoming a
// wildcard in the language's ordinary equivalence relation.
pub fn callable_ownership_compatible(
    metadata: OwnershipMetadata, a: Int, b: Int, param_count: Int
) -> Bool {
    let mut index = 0
    while index < param_count {
        if !param_ownership_compatible(
            callable_param_ownership(metadata, a, index),
            callable_param_ownership(metadata, b, index)) {
            return false
        }
        index = index + 1
    }
    return_ownership_compatible(
        callable_return_ownership(metadata, a),
        callable_return_ownership(metadata, b))
}

// Canonical IDs make exact shadow equality O(1). This remains intentionally
// disconnected from ordinary Type equality and unification in Unit 1.
pub fn callable_ownership_exact_equal(a: Int, b: Int) -> Bool {
    a == b
}

pub fn effects_equal(a: Effect, b: Effect) -> Bool {
    match a {
        Effect::IoEffect => match b { Effect::IoEffect => true, _ => false },
        Effect::MutEffect { state_type: sa } => match b {
            Effect::MutEffect { state_type: sb } => types_equal(sa, sb),
            _ => false
        },
        Effect::FailEffect { error_type: et_a } => match b {
            Effect::FailEffect { error_type: et_b } => types_equal(et_a, et_b),
            _ => false
        },
        Effect::CustomEffect { name: na, type_args: args_a } => match b {
            Effect::CustomEffect { name: nb, type_args: args_b } =>
                na == nb && type_lists_equal(args_a, args_b),
            _ => false
        },
        Effect::UnsafeEffect => match b { Effect::UnsafeEffect => true, _ => false }
    }
}

pub fn types_equal(a: Type, b: Type) -> Bool {
    match a {
        Type::IntType => match b { Type::IntType => true, _ => false },
        Type::FloatType => match b { Type::FloatType => true, _ => false },
        Type::StrType => match b { Type::StrType => true, _ => false },
        Type::BoolType => match b { Type::BoolType => true, _ => false },
        Type::UnitType => match b { Type::UnitType => true, _ => false },
        Type::NeverType => match b { Type::NeverType => true, _ => false },
        Type::AnyType => match b { Type::AnyType => true, _ => false },
        Type::ErrorType => match b { Type::ErrorType => true, _ => false },
        Type::TypeVar { id: id_a, .. } => match b {
            Type::TypeVar { id: id_b, .. } => id_a == id_b,
            _ => false
        },
        // Unit 1 compatibility gate: ownership is transported in shadow but
        // does not change the legacy accepted program set.
        Type::FnType { params: pa, return_type: ra, meta: ma } => match b {
            Type::FnType { params: pb, return_type: rb, meta: mb } =>
                type_lists_equal(pa, pb) && types_equal(ra, rb)
                    && effects_list_equal(ma.effects.effects, mb.effects.effects)
                    // Open effect row tails are compared by exact TypeVar ID (structural equality).
                    // Two different open tails (?N1, ?N2) are structurally distinct even though both
                    // represent "open row" semantically. Semantic equivalence is handled by unification,
                    // not types_equal — this function is for error messages and debug output.
                    && optional_ids_equal(ma.effects.tail, mb.effects.tail),
            _ => false
        },
        Type::StructType { name: na, type_params: tpa, .. } => match b {
            Type::StructType { name: nb, type_params: tpb, .. } =>
                na == nb && type_lists_equal(tpa, tpb),
            _ => false
        },
        Type::EnumType { name: na, type_params: tpa, .. } => match b {
            Type::EnumType { name: nb, type_params: tpb, .. } =>
                na == nb && type_lists_equal(tpa, tpb),
            _ => false
        },
        Type::GenericType { base: ba, args: aa } => match b {
            Type::GenericType { base: bb, args: ab } =>
                types_equal(ba, bb) && type_lists_equal(aa, ab),
            _ => false
        },
        // Record fields are compared as unordered sets (row polymorphism semantics).
        // Field order does not affect type equality, unlike TupleType where position matters.
        Type::RecordType { fields: fa, tail: ta, .. } => match b {
            Type::RecordType { fields: fb, tail: tb, .. } => {
                if fa.len() != fb.len() { return false }
                if !optional_ids_equal(ta, tb) { return false }
                fa.all(fn(f) {
                    fb.any(fn(bf) { bf.name == f.name && types_equal(f.ty, bf.ty) })
                })
            },
            _ => false
        },
        Type::EffectRowType { effects: ea, tail: ta } => match b {
            Type::EffectRowType { effects: eb, tail: tb } => {
                if !optional_ids_equal(ta, tb) { return false }
                if ea.len() != eb.len() { return false }
                ea.all(fn(ae) { eb.any(fn(be) { effects_equal(ae, be) }) })
            },
            _ => false
        },
        Type::TupleType { elements: ea } => match b {
            Type::TupleType { elements: eb } => type_lists_equal(ea, eb),
            _ => false
        },
        Type::PtrType { pointee: pa } => match b {
            Type::PtrType { pointee: pb } => types_equal(pa, pb),
            _ => false
        }
    }
}

// Convert the compiler's canonical module identity back to source spelling.
// This is shared by every user-facing type/effect/trait diagnostic so the
// internal `$$_` separator never leaks through error messages.
pub fn nominal_display_name(identity: Str) -> Str {
    identity.replace("$$_", "::").replace("$", "::")
}

pub fn type_to_string(t: Type) -> Str {
    match t {
        Type::IntType => BUILTIN_INT,
        Type::FloatType => BUILTIN_FLOAT,
        Type::StrType => BUILTIN_STR,
        Type::BoolType => BUILTIN_BOOL,
        Type::UnitType => "()",
        Type::NeverType => "Never",
        Type::AnyType => "Any",
        Type::TypeVar { name, id } => match name {
            some(n) => n,
            none => "?${id.to_str()}"
        },
        Type::FnType { params, return_type, meta } => {
            let ps = params.map(fn(p) { type_to_string(p) }).join(", ")
            let ret = type_to_string(return_type)
            let eff = effect_row_to_string(meta.effects)
            if eff.len() > 0 { "(${ps}) -> ${ret} / ${eff}" }
            else { "(${ps}) -> ${ret}" }
        },
        Type::StructType { name, type_params, .. } => {
            let display = nominal_display_name(name)
            if type_params.len() == 0 { display }
            else { "${display}<${type_params.map(fn(p) { type_to_string(p) }).join(", ")}>" }
        },
        Type::EnumType { name, type_params, .. } => {
            let display = nominal_display_name(name)
            if name == BUILTIN_OPTION && type_params.len() == 1 {
                "${type_to_string(type_params.first().unwrap_or(UNIT))}?"
            } else if type_params.len() == 0 { display }
            else { "${display}<${type_params.map(fn(p) { type_to_string(p) }).join(", ")}>" }
        },
        Type::GenericType { base, args } => {
            "${type_to_string(base)}<${args.map(fn(a) { type_to_string(a) }).join(", ")}>"
        },
        Type::RecordType { fields, tail, tail_name } => {
            let fs = fields.map(fn(f) { "${f.name}: ${type_to_string(f.ty)}" }).join(", ")
            match tail {
                some(t) => {
                    let ts = match tail_name { some(n) => n, none => "?${t.to_str()}" }
                    if fs.len() > 0 { "{${fs}, ..${ts}}" } else { "{..${ts}}" }
                },
                none => "{${fs}}"
            }
        },
        Type::EffectRowType { effects, tail } => {
            let es = effects.map(fn(e) { effect_to_string(e) }).join(", ")
            match tail {
                some(t) => "<${es}, ?${t.to_str()}>",
                none => "<${es}>"
            }
        },
        Type::TupleType { elements } =>
            "(${elements.map(fn(e) { type_to_string(e) }).join(", ")})",
        Type::PtrType { pointee } =>
            "Ptr<${type_to_string(pointee)}>",
        Type::ErrorType => "<error>"
    }
}

pub fn effect_to_string(e: Effect) -> Str {
    match e {
        Effect::IoEffect => "io",
        Effect::MutEffect { state_type } => "mut<${type_to_string(state_type)}>",
        Effect::FailEffect { error_type } => "fail<${type_to_string(error_type)}>",
        Effect::CustomEffect { name, type_args } => {
            let display = nominal_display_name(name)
            if type_args.len() == 0 { display }
            else { "${display}<${type_args.map(fn(a) { type_to_string(a) }).join(", ")}>" }
        },
        Effect::UnsafeEffect => "unsafe"
    }
}

pub fn effect_row_to_string(row: EffectRow) -> Str {
    if row.effects.len() == 0 && row.tail.is_none() { return "" }
    let mut parts = row.effects.map(fn(e) { effect_to_string(e) })
    match row.tail {
        some(t) => parts.push("?${t.to_str()}"),
        none => {}
    }
    parts.join(", ")
}
