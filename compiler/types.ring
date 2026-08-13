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
pub const CALLABLE_SOURCE_SYNTHETIC_ANF: Int = 5
pub const CALLABLE_SOURCE_SYNTHETIC_RC: Int = 6
// A retained, structurally typed HIR callable whose producer has no reachable
// identity proof still needs total metadata through retained-HIR validation and
// ownership planning. The planner then removes dependent dead children before
// RC/codegen. This source is deterministic recovery only;
// it must never authorize a callable factory result or another provenance
// proof.
pub const CALLABLE_SOURCE_ERROR_RECOVERY: Int = 7

// Exact semantic result role for a callable DefId.  This is deliberately
// independent from the ordinary Owned/Borrowed return bit: the low-level slot
// read/take bridges return an owned reference even when their HIR result is an
// otherwise-unresolved TypeVar.  Every callable DefId has a total entry in both
// role maps below; UNKNOWN is proof poison, never an alias for NONE.
pub const CALLABLE_RESULT_ROLE_NONE: Int = 0
pub const CALLABLE_RESULT_ROLE_FRESH_OWNED_SLOT: Int = 1
pub const CALLABLE_RESULT_ROLE_UNKNOWN: Int = 2

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

// Exclusive checker-local inference bound. The exact tagged Int range is
// [-2^62, 2^62 - 1] (62 magnitude bits); keeping this below the positive
// maximum ensures both the comparison and the final in-range `term + 1`
// remain representable.
pub const CALLABLE_INFERENCE_TERM_LIMIT: Int = 4000000000000000000

// `rest_param >= 0` applies after the explicit prefix without storing an
// arity-sized list. `rest_param == -1` makes the prefix exact; out-of-range
// lookup then fails closed to Unknown.
pub struct CallableOwnershipDescriptor {
    pub prefix_params: List<Int>,
    pub rest_param: Int,
    pub result: Int
}

// Caller-side logical invalidation strength is deliberately not a fourth
// callable type mode.  Borrow/MutBorrow/Move remain the public type identity;
// each exact DefId additionally transports whether a Move parameter is a
// programmer/interface FORCE edge or a body/storage-inferred OWNING edge.
// A level describes the callable at one return-spine depth: level 0 is the
// callable itself, level 1 its directly returned callable, and so on.
pub struct CallableTransferLevel {
    pub ownership_term: Int,
    pub force_params: List<Bool>
}

pub struct CallableOwnershipState {
    pub source: Int,
    pub transfer_levels: List<CallableTransferLevel>
}

pub struct FnMeta {
    pub effects: EffectRow,
    // Closed tagged term: resolved exact descriptors are 0..10 except
    // CALLABLE_UNKNOWN, or negative content-addressed IDs. Checker-local
    // inference variables are strictly > 10 and never cross the freeze gate.
    pub ownership_term: Int
}

// Symbolic ownership shape for one nominal type constructor.  `may_own`
// means every instantiation may directly/transitively contain a user Drop
// value; `param_deps[i]` means the answer additionally depends on whether the
// i-th actual type argument may own one.  This finite bit-vector is the fixed
// point exported between modules.
pub struct OwnershipShape {
    // True only when the nominal declaration itself implements the
    // authoritative builtin Drop trait. Transitive field ownership never sets
    // this bit. The lattice invariant is direct_drop => may_own.
    pub direct_drop: Bool,
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
    // What invoking this exact callable returns.  `returned_...` summarizes the
    // result role carried by a callable value returned from this callable, so a
    // factory can instantiate the same role on a fresh call-result DefId.
    pub callable_result_role_by_def_id: Map<Int, Int>,
    pub returned_callable_result_role_by_def_id: Map<Int, Int>,
    // Complete invocation-result role spine. Index 0 mirrors the direct map,
    // index 1 mirrors the returned map, and later indices preserve nested
    // callable factories across bodyless/module boundaries.
    pub callable_result_role_spine_by_def_id: Map<Int, List<Int>>,
    // Checker-private ownership union-find.  These maps are emptied by the
    // atomic freeze barrier before HIR/export/backend consumption.
    pub callable_inference_parents: Map<Int, Int>,
    pub callable_inference_solutions: Map<Int, Int>,
    pub next_callable_inference_term: Int,
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

pub fn fn_meta(effects: EffectRow, ownership_term: Int) -> FnMeta {
    FnMeta { effects: effects, ownership_term: ownership_term }
}

pub fn callable_transfer_level(
    ownership_term: Int, force_params: List<Bool>
) -> CallableTransferLevel {
    CallableTransferLevel {
        ownership_term: ownership_term, force_params: force_params
    }
}

pub fn clone_callable_transfer_levels(
    levels: List<CallableTransferLevel>
) -> List<CallableTransferLevel> {
    let mut result: List<CallableTransferLevel> = []
    for level in levels {
        let mut force_params: List<Bool> = []
        for force in level.force_params {
            let copied_force = force
            force_params.push(copied_force)
        }
        result.push(CallableTransferLevel {
            ownership_term: level.ownership_term,
            force_params: force_params
        })
    }
    result
}

fn callable_type_transfer_levels(
    metadata: OwnershipMetadata, ty: Type, force_move_params: Bool
) -> List<CallableTransferLevel> {
    match ty {
        Type::FnType { params, return_type, meta } => {
            let mut force_params: List<Bool> = []
            let mut index = 0
            for _param in params {
                force_params.push(force_move_params &&
                    callable_param_ownership(
                        metadata, meta.ownership_term, index) ==
                        PARAM_OWNERSHIP_MOVE)
                index = index + 1
            }
            let mut result: List<CallableTransferLevel> = [
                CallableTransferLevel {
                    ownership_term: meta.ownership_term,
                    force_params: force_params
                }
            ]
            let returned_type = return_type
            for level in callable_type_transfer_levels(
                    metadata, returned_type, force_move_params) {
                let mut returned_forces: List<Bool> = []
                for force in level.force_params {
                    let copied_force = force
                    returned_forces.push(copied_force)
                }
                result.push(CallableTransferLevel {
                    ownership_term: level.ownership_term,
                    force_params: returned_forces
                })
            }
            result
        },
        _ => []
    }
}

// Bodyless/source-level callable interfaces interpret every written Move as a
// logical FORCE edge.  This is an internal call-view strength; it does not
// participate in FnType equality, so ordinary OWNING constructors such as
// `some` remain compatible with `fn(move T)` higher-order parameters.
pub fn callable_interface_transfer_levels(
    metadata: OwnershipMetadata, ty: Type
) -> List<CallableTransferLevel> {
    callable_type_transfer_levels(metadata, ty, true)
}

// Builtin storage/constructor producers and provisional body-inferred schemes
// use the same public Move modes but do not force scalar/direct-foreign source
// bindings to become unavailable.
pub fn callable_owning_transfer_levels(
    metadata: OwnershipMetadata, ty: Type
) -> List<CallableTransferLevel> {
    callable_type_transfer_levels(metadata, ty, false)
}

pub fn new_ownership_metadata() -> OwnershipMetadata {
    OwnershipMetadata {
        // Canonical 0..10 descriptors are decoded without Map/List allocation.
        // This table is reserved for genuinely dynamic mixed solver results.
        callable_descriptors: map_new(),
        callable_by_def_id: map_new(),
        callable_state_by_def_id: map_new(),
        callable_result_role_by_def_id: map_new(),
        returned_callable_result_role_by_def_id: map_new(),
        callable_result_role_spine_by_def_id: map_new(),
        callable_inference_parents: map_new(),
        callable_inference_solutions: map_new(),
        next_callable_inference_term: CALLABLE_SLOT_MOVE_OWNED + 1,
        ownership_shapes: map_new()
    }
}

// ============================================================
// Callable ownership tagged terms and checker-local constraints
// ============================================================

pub fn is_callable_ownership_inference_term(term: Int) -> Bool {
    term > CALLABLE_SLOT_MOVE_OWNED
}

pub fn is_callable_ownership_unknown_term(term: Int) -> Bool {
    term == CALLABLE_UNKNOWN
}

pub fn is_callable_ownership_encoded_exact_term(term: Int) -> Bool {
    term < 0 ||
        (term >= CALLABLE_BORROW_OWNED &&
         term <= CALLABLE_SLOT_MOVE_OWNED &&
         term != CALLABLE_UNKNOWN)
}

pub fn is_callable_ownership_term(term: Int) -> Bool {
    is_callable_ownership_encoded_exact_term(term) ||
        is_callable_ownership_unknown_term(term) ||
        is_callable_ownership_inference_term(term)
}

fn callable_descriptor_is_fully_resolved(
    descriptor: CallableOwnershipDescriptor
) -> Bool {
    if descriptor.result == RETURN_OWNERSHIP_UNKNOWN { return false }
    if descriptor.rest_param == PARAM_OWNERSHIP_UNKNOWN { return false }
    for mode in descriptor.prefix_params {
        if mode == PARAM_OWNERSHIP_UNKNOWN { return false }
    }
    true
}

pub fn is_resolved_callable_ownership_term(
    metadata: OwnershipMetadata, term: Int
) -> Bool {
    if term >= CALLABLE_BORROW_OWNED &&
       term <= CALLABLE_SLOT_MOVE_OWNED {
        return term != CALLABLE_UNKNOWN
    }
    if term < 0 {
        return match metadata.callable_descriptors.get(term) {
            some(descriptor) =>
                callable_descriptor_is_fully_resolved(descriptor),
            none => false
        }
    }
    false
}

// Ownership contracts are definition-rigid, not generalized. A generic HOF
// may quantify ordinary type variables while retaining one exact ownership
// vector; every instantiation in the checker run therefore shares this term.
pub fn fresh_callable_ownership_inference_term(
    mut metadata: OwnershipMetadata
) -> Int {
    let term = metadata.next_callable_inference_term
    if term <= CALLABLE_SLOT_MOVE_OWNED ||
       term >= CALLABLE_INFERENCE_TERM_LIMIT ||
       metadata.callable_inference_parents.contains_key(term) {
        panic("unreachable: callable ownership inference namespace exhausted")
    }
    metadata.next_callable_inference_term = term + 1
    let parent_key = term
    let parent_value = term
    metadata.callable_inference_parents.insert(parent_key, parent_value)
    term
}

fn callable_ownership_inference_root(
    metadata: OwnershipMetadata, term: Int
) -> Int {
    if !is_callable_ownership_inference_term(term) {
        panic("unreachable: callable ownership root requested for exact term")
    }
    let parent = match metadata.callable_inference_parents.get(term) {
        some(value) => value,
        none => panic(
            "unreachable: callable ownership inference term is unregistered")
    }
    if parent == term { return term }
    callable_ownership_inference_root(metadata, parent)
}

pub fn resolve_callable_ownership_term(
    metadata: OwnershipMetadata, term: Int
) -> Int {
    if !is_callable_ownership_inference_term(term) { return term }
    let root = callable_ownership_inference_root(metadata, term)
    match metadata.callable_inference_solutions.get(root) {
        some(solution) => {
            if !is_resolved_callable_ownership_term(metadata, solution) {
                panic("unreachable: ownership inference solution is not exact")
            }
            solution
        },
        none => root
    }
}

pub fn callable_ownership_constraint_compatible(
    metadata: OwnershipMetadata, left: Int, right: Int
) -> Bool {
    let a = resolve_callable_ownership_term(metadata, left)
    let b = resolve_callable_ownership_term(metadata, right)
    if is_callable_ownership_unknown_term(a) ||
       is_callable_ownership_unknown_term(b) {
        return false
    }
    if !is_callable_ownership_inference_term(a) &&
       !is_resolved_callable_ownership_term(metadata, a) {
        return false
    }
    if !is_callable_ownership_inference_term(b) &&
       !is_resolved_callable_ownership_term(metadata, b) {
        return false
    }
    if is_callable_ownership_inference_term(a) ||
       is_callable_ownership_inference_term(b) {
        return true
    }
    is_resolved_callable_ownership_term(metadata, a) &&
        is_resolved_callable_ownership_term(metadata, b) && a == b
}

// Commit only after callable_ownership_constraint_compatible preflight and
// ordinary type/effect unification have both succeeded. This function never
// partially mutates a conflicting constraint.
pub fn constrain_callable_ownership_terms(
    mut metadata: OwnershipMetadata, left: Int, right: Int
) -> Bool {
    if !callable_ownership_constraint_compatible(metadata, left, right) {
        return false
    }
    let a = resolve_callable_ownership_term(metadata, left)
    let b = resolve_callable_ownership_term(metadata, right)
    if a == b { return true }
    let a_var = is_callable_ownership_inference_term(a)
    let b_var = is_callable_ownership_inference_term(b)
    if a_var && b_var {
        let keep = if a < b { a } else { b }
        let merge = if a < b { b } else { a }
        metadata.callable_inference_parents.insert(merge, keep)
        return true
    }
    if a_var {
        metadata.callable_inference_solutions.insert(a, b)
        return true
    }
    if b_var {
        metadata.callable_inference_solutions.insert(b, a)
        return true
    }
    true
}

fn batch_callable_root(mut parents: Map<Int, Int>, term: Int) -> Int {
    let parent = match parents.get(term) {
        some(value) => value,
        none => {
            // Map's key/value slots are strict Move edges.  Preserve the
            // search term as the result and consume fresh scalar copies.
            let self_key = term
            let self_parent = term
            parents.insert(self_key, self_parent)
            term
        }
    }
    if parent == term { return term }
    let root = batch_callable_root(parents, parent)
    let compressed_term = term
    let compressed_root = root
    parents.insert(compressed_term, compressed_root)
    root
}

fn batch_callable_term(
    parents: Map<Int, Int>, solutions: Map<Int, Int>, term: Int
) -> Int {
    if !is_callable_ownership_inference_term(term) { return term }
    let root = batch_callable_root(parents, term)
    solutions.get(root).unwrap_or(root)
}

// Collective preflight uses an overlay containing only roots touched by this
// unification batch. No checker-global ownership UF state is cloned or
// mutated, and pair ordering cannot hide a later conflict.
pub fn callable_ownership_constraints_compatible(
    metadata: OwnershipMetadata, pairs: List<(Int, Int)>
) -> Bool {
    let mut parents: Map<Int, Int> = map_new()
    let mut solutions: Map<Int, Int> = map_new()
    for pair in pairs {
        let base_left = resolve_callable_ownership_term(metadata, pair.0)
        let base_right = resolve_callable_ownership_term(metadata, pair.1)
        if is_callable_ownership_unknown_term(base_left) ||
           is_callable_ownership_unknown_term(base_right) {
            return false
        }
        if !is_callable_ownership_inference_term(base_left) &&
           !is_resolved_callable_ownership_term(metadata, base_left) {
            return false
        }
        if !is_callable_ownership_inference_term(base_right) &&
           !is_resolved_callable_ownership_term(metadata, base_right) {
            return false
        }
        let left = batch_callable_term(parents, solutions, base_left)
        let right = batch_callable_term(parents, solutions, base_right)
        if left == right { continue }
        let left_var = is_callable_ownership_inference_term(left)
        let right_var = is_callable_ownership_inference_term(right)
        if !left_var && !right_var {
            return false
        }
        if left_var && right_var {
            let keep = if left < right { left } else { right }
            let merge = if left < right { right } else { left }
            parents.insert(merge, keep)
        } else if left_var {
            solutions.insert(batch_callable_root(parents, left), right)
        } else {
            solutions.insert(batch_callable_root(parents, right), left)
        }
    }
    true
}

pub fn commit_callable_ownership_constraints(
    mut metadata: OwnershipMetadata, pairs: List<(Int, Int)>
) {
    if !callable_ownership_constraints_compatible(metadata, pairs) {
        panic("unreachable: conflicting ownership batch reached commit")
    }
    for pair in pairs {
        if !constrain_callable_ownership_terms(metadata, pair.0, pair.1) {
            panic("unreachable: ownership constraint changed after preflight")
        }
    }
}

pub fn require_exact_callable_ownership_term(
    metadata: OwnershipMetadata, term: Int
) -> Int {
    let resolved = resolve_callable_ownership_term(metadata, term)
    if !is_resolved_callable_ownership_term(metadata, resolved) {
        panic("unreachable: unresolved callable ownership crossed freeze barrier")
    }
    resolved
}

fn rewrite_callable_ownership_effect(
    metadata: OwnershipMetadata, eff: Effect, freeze: Bool
) -> Effect {
    match eff {
        Effect::FailEffect { error_type } => {
            let owned_error_type = error_type
            Effect::FailEffect {
                error_type: rewrite_callable_ownership_type(
                    metadata, owned_error_type, freeze)
            }
        },
        Effect::MutEffect { state_type } => {
            let owned_state_type = state_type
            Effect::MutEffect {
                state_type: rewrite_callable_ownership_type(
                    metadata, owned_state_type, freeze)
            }
        },
        Effect::CustomEffect { name, type_args } => {
            let owned_name = name
            Effect::CustomEffect { name: owned_name,
                type_args: type_args.map(fn(arg) {
                    let owned_arg = arg
                    rewrite_callable_ownership_type(
                        metadata, owned_arg, freeze)
                }) }
        },
        Effect::IoEffect => eff,
        Effect::UnsafeEffect => eff
    }
}

fn rewrite_callable_ownership_row(
    metadata: OwnershipMetadata, row: EffectRow, freeze: Bool
) -> EffectRow {
    let owned_tail = row.tail
    EffectRow {
        effects: row.effects.map(fn(eff) {
            let owned_eff = eff
            rewrite_callable_ownership_effect(metadata, owned_eff, freeze)
        }),
        tail: owned_tail
    }
}

fn rewrite_callable_ownership_type(
    metadata: OwnershipMetadata, ty: Type, freeze: Bool
) -> Type {
    match ty {
        Type::FnType { params, return_type, meta } => {
            let term = if freeze {
                require_exact_callable_ownership_term(
                    metadata, meta.ownership_term)
            } else {
                resolve_callable_ownership_term(
                    metadata, meta.ownership_term)
            }
            let owned_return_type = return_type
            let owned_effects = meta.effects
            Type::FnType {
                params: params.map(fn(param) {
                    let owned_param = param
                    rewrite_callable_ownership_type(
                        metadata, owned_param, freeze)
                }),
                return_type: rewrite_callable_ownership_type(
                    metadata, owned_return_type, freeze),
                meta: fn_meta(rewrite_callable_ownership_row(
                    metadata, owned_effects, freeze), term)
            }
        },
        Type::StructType { name, type_params } => {
            let owned_name = name
            Type::StructType {
                name: owned_name, type_params: type_params.map(fn(param) {
                    let owned_param = param
                    rewrite_callable_ownership_type(
                        metadata, owned_param, freeze)
                })
            }
        },
        Type::EnumType { name, type_params } => {
            let owned_name = name
            Type::EnumType {
                name: owned_name, type_params: type_params.map(fn(param) {
                    let owned_param = param
                    rewrite_callable_ownership_type(
                        metadata, owned_param, freeze)
                })
            }
        },
        Type::GenericType { base, args } => {
            let owned_base = base
            Type::GenericType {
                base: rewrite_callable_ownership_type(
                    metadata, owned_base, freeze),
                args: args.map(fn(arg) {
                    let owned_arg = arg
                    rewrite_callable_ownership_type(
                        metadata, owned_arg, freeze)
                })
            }
        },
        Type::RecordType { fields, tail, tail_name } => {
            let owned_tail = tail
            let owned_tail_name = tail_name
            Type::RecordType {
                fields: fields.map(fn(field) {
                    let owned_name = field.name
                    let owned_ty = field.ty
                    RecordField {
                        name: owned_name,
                        ty: rewrite_callable_ownership_type(
                            metadata, owned_ty, freeze)
                    }
                }),
                tail: owned_tail, tail_name: owned_tail_name
            }
        },
        Type::EffectRowType { effects, tail } => {
            let owned_tail = tail
            Type::EffectRowType {
                effects: effects.map(fn(eff) {
                    let owned_eff = eff
                    rewrite_callable_ownership_effect(
                        metadata, owned_eff, freeze)
                }),
                tail: owned_tail
            }
        },
        Type::TupleType { elements } => Type::TupleType {
            elements: elements.map(fn(element) {
                let owned_element = element
                rewrite_callable_ownership_type(
                    metadata, owned_element, freeze)
            })
        },
        Type::PtrType { pointee } => {
            let owned_pointee = pointee
            Type::PtrType {
                pointee: rewrite_callable_ownership_type(
                    metadata, owned_pointee, freeze)
            }
        },
        Type::IntType => ty,
        Type::FloatType => ty,
        Type::StrType => ty,
        Type::BoolType => ty,
        Type::UnitType => ty,
        Type::NeverType => ty,
        Type::AnyType => ty,
        Type::TypeVar { .. } => ty,
        Type::ErrorType => ty
    }
}

pub fn resolve_callable_ownership_type(
    metadata: OwnershipMetadata, ty: Type
) -> Type {
    let owned_ty = ty
    rewrite_callable_ownership_type(metadata, owned_ty, false)
}

// The one recursive phase barrier shared by HIR, TypeEnv registries and module
// exports. It covers callable types nested through every structural Type form.
pub fn freeze_callable_ownership_type(
    metadata: OwnershipMetadata, ty: Type
) -> Type {
    let owned_ty = ty
    rewrite_callable_ownership_type(metadata, owned_ty, true)
}

pub fn resolve_callable_ownership_row(
    metadata: OwnershipMetadata, row: EffectRow
) -> EffectRow {
    let owned_row = row
    rewrite_callable_ownership_row(metadata, owned_row, false)
}

pub fn freeze_callable_ownership_row(
    metadata: OwnershipMetadata, row: EffectRow
) -> EffectRow {
    let owned_row = row
    rewrite_callable_ownership_row(metadata, owned_row, true)
}

pub fn is_callable_ownership_canonical_encoding(ownership_id: Int) -> Bool {
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

fn ownership_mode_lists_equal(a: List<Int>, b: List<Int>) -> Bool {
    if a.len() != b.len() { return false }
    let mut index = 0
    while index < a.len() {
        if a.get(index) != b.get(index) { return false }
        index = index + 1
    }
    true
}

fn valid_param_ownership(mode: Int) -> Bool {
    mode >= PARAM_OWNERSHIP_BORROW &&
        mode <= PARAM_OWNERSHIP_UNKNOWN
}

fn valid_return_ownership(mode: Int) -> Bool {
    mode >= RETURN_OWNERSHIP_OWNED &&
        mode <= RETURN_OWNERSHIP_UNKNOWN
}

// Descriptor identity is content identity.  A uniform tail makes any equal
// suffix in the explicit prefix redundant, so strip it before either matching
// a canonical 0..10 descriptor or hashing a dynamic one.  This is deliberately
// independent of Map iteration order, DefIds, source paths and allocation.
pub fn normalize_callable_ownership_descriptor(
    descriptor: CallableOwnershipDescriptor
) -> CallableOwnershipDescriptor {
    if descriptor.rest_param < 0 {
        if descriptor.rest_param != 0 - 1 {
            panic("unreachable: invalid callable ownership rest mode")
        }
    } else if !valid_param_ownership(descriptor.rest_param) {
        panic("unreachable: invalid callable ownership rest mode")
    }
    if !valid_return_ownership(descriptor.result) {
        panic("unreachable: invalid callable ownership result mode")
    }
    let mut prefix: List<Int> = []
    for mode in descriptor.prefix_params {
        if !valid_param_ownership(mode) {
            panic("unreachable: invalid callable ownership parameter mode")
        }
        let prefix_mode = mode
        prefix.push(prefix_mode)
    }
    if descriptor.rest_param >= 0 {
        let mut trimming = true
        while prefix.len() > 0 && trimming {
            match prefix.get(prefix.len() - 1) {
                some(mode) => if mode == descriptor.rest_param {
                    prefix.pop()
                    trimming = true
                } else {
                    trimming = false
                },
                none => { trimming = false }
            }
        }
    }
    CallableOwnershipDescriptor {
        prefix_params: prefix,
        rest_param: descriptor.rest_param,
        result: descriptor.result
    }
}

fn canonical_callable_ownership_id(
    descriptor: CallableOwnershipDescriptor
) -> Int? {
    let d = normalize_callable_ownership_descriptor(descriptor)
    if d.prefix_params.len() == 0 {
        if d.rest_param == PARAM_OWNERSHIP_BORROW {
            if d.result == RETURN_OWNERSHIP_OWNED {
                return some(CALLABLE_BORROW_OWNED)
            }
            if d.result == RETURN_OWNERSHIP_BORROWED {
                return some(CALLABLE_BORROW_BORROWED)
            }
        }
        if d.rest_param == PARAM_OWNERSHIP_MOVE &&
           d.result == RETURN_OWNERSHIP_OWNED {
            return some(CALLABLE_MOVE_OWNED)
        }
        if d.rest_param == PARAM_OWNERSHIP_UNKNOWN &&
           d.result == RETURN_OWNERSHIP_UNKNOWN {
            return some(CALLABLE_UNKNOWN)
        }
    }
    if ownership_mode_lists_equal(d.prefix_params,
                                  [PARAM_OWNERSHIP_MUT_BORROW]) &&
       d.rest_param == PARAM_OWNERSHIP_BORROW &&
       d.result == RETURN_OWNERSHIP_OWNED {
        return some(CALLABLE_FIRST_MUT_BORROW_OWNED)
    }
    if d.rest_param != 0 - 1 { return none }
    if ownership_mode_lists_equal(d.prefix_params,
            [PARAM_OWNERSHIP_MUT_BORROW, PARAM_OWNERSHIP_MOVE]) &&
       d.result == RETURN_OWNERSHIP_OWNED {
        return some(CALLABLE_MUT_MOVE_OWNED)
    }
    if ownership_mode_lists_equal(d.prefix_params,
            [PARAM_OWNERSHIP_BORROW, PARAM_OWNERSHIP_MOVE]) &&
       d.result == RETURN_OWNERSHIP_BORROWED {
        return some(CALLABLE_BORROW_MOVE_BORROWED)
    }
    if ownership_mode_lists_equal(d.prefix_params,
            [PARAM_OWNERSHIP_MOVE, PARAM_OWNERSHIP_BORROW]) &&
       d.result == RETURN_OWNERSHIP_OWNED {
        return some(CALLABLE_MOVE_BORROW_OWNED)
    }
    if ownership_mode_lists_equal(d.prefix_params,
            [PARAM_OWNERSHIP_BORROW, PARAM_OWNERSHIP_MUT_BORROW,
             PARAM_OWNERSHIP_BORROW]) &&
       d.result == RETURN_OWNERSHIP_OWNED {
        return some(CALLABLE_BORROW_MUT_BORROW_OWNED)
    }
    if ownership_mode_lists_equal(d.prefix_params,
            [PARAM_OWNERSHIP_MUT_BORROW, PARAM_OWNERSHIP_BORROW,
             PARAM_OWNERSHIP_MOVE]) &&
       d.result == RETURN_OWNERSHIP_OWNED {
        return some(CALLABLE_MUT_BORROW_MOVE_OWNED)
    }
    if ownership_mode_lists_equal(d.prefix_params,
            [PARAM_OWNERSHIP_MUT_BORROW, PARAM_OWNERSHIP_BORROW,
             PARAM_OWNERSHIP_MUT_BORROW, PARAM_OWNERSHIP_BORROW,
             PARAM_OWNERSHIP_BORROW]) &&
       d.result == RETURN_OWNERSHIP_OWNED {
        return some(CALLABLE_SLOT_MOVE_OWNED)
    }
    none
}

// A bounded polynomial hash keeps every intermediate inside signed 63-bit
// Ring Int while providing a process-stable negative ID.  Hash collisions are
// never repaired by probing (which would make identity insertion-order
// dependent): every intern/merge boundary compares content and fails loudly.
fn callable_descriptor_dynamic_id(
    descriptor: CallableOwnershipDescriptor
) -> Int {
    let d = normalize_callable_ownership_descriptor(descriptor)
    let modulus = 2147483629
    let mut hash = 146959810
    hash = (hash * 131 + d.prefix_params.len() + 1) % modulus
    for mode in d.prefix_params {
        hash = (hash * 131 + mode + 1) % modulus
    }
    hash = (hash * 131 + d.rest_param + 2) % modulus
    hash = (hash * 131 + d.result + 1) % modulus
    0 - (hash + 1)
}

pub fn intern_callable_ownership_descriptor(
    mut metadata: OwnershipMetadata,
    descriptor: CallableOwnershipDescriptor
) -> Int {
    let normalized = normalize_callable_ownership_descriptor(descriptor)
    match canonical_callable_ownership_id(normalized) {
        some(id) => id,
        none => {
            let id = callable_descriptor_dynamic_id(normalized)
            match metadata.callable_descriptors.get(id) {
                some(existing) => {
                    if !callable_descriptors_equal(existing, normalized) {
                        panic("unreachable: colliding callable ownership descriptor ID")
                    }
                },
                none => {
                    let descriptor_id = id
                    metadata.callable_descriptors.insert(
                        descriptor_id, normalized)
                }
            }
            id
        }
    }
}

// Source-level callable parameter contracts are exact vectors. Uniform
// Borrow/Move and first-MutBorrow/rest-Borrow reuse allocation-free canonical
// descriptors; arity remains a FnType invariant rather than descriptor state.
pub fn intern_callable_param_modes(
    mut metadata: OwnershipMetadata, modes: List<Int>
) -> Int {
    let first = modes.first().unwrap_or(PARAM_OWNERSHIP_BORROW)
    let mut uniform = true
    let mut first_mut_rest_borrow = modes.len() > 0 &&
        first == PARAM_OWNERSHIP_MUT_BORROW
    let mut index = 0
    for mode in modes {
        if mode != first { uniform = false }
        if index > 0 && mode != PARAM_OWNERSHIP_BORROW {
            first_mut_rest_borrow = false
        }
        index = index + 1
    }
    if modes.len() == 0 || (uniform && first == PARAM_OWNERSHIP_BORROW) {
        return CALLABLE_BORROW_OWNED
    }
    if uniform && first == PARAM_OWNERSHIP_MOVE {
        return CALLABLE_MOVE_OWNED
    }
    if first_mut_rest_borrow {
        return CALLABLE_FIRST_MUT_BORROW_OWNED
    }
    intern_callable_ownership_descriptor(metadata,
        CallableOwnershipDescriptor {
            prefix_params: modes, rest_param: 0 - 1,
            result: RETURN_OWNERSHIP_OWNED
        })
}

pub fn merge_callable_ownership_descriptor(
    mut metadata: OwnershipMetadata, ownership_id: Int,
    descriptor: CallableOwnershipDescriptor
) {
    let normalized = normalize_callable_ownership_descriptor(descriptor)
    match canonical_callable_ownership_id(normalized) {
        some(_) => panic(
            "unreachable: canonical callable ownership descriptor was exported dynamically"),
        none => {}
    }
    if ownership_id != callable_descriptor_dynamic_id(normalized) {
        panic("unreachable: callable ownership descriptor ID/content mismatch")
    }
    match metadata.callable_descriptors.get(ownership_id) {
        some(existing) => {
            if !callable_descriptors_equal(existing, normalized) {
                panic("unreachable: colliding callable ownership descriptor ID")
            }
        },
        none => metadata.callable_descriptors.insert(ownership_id, normalized)
    }
}

pub fn validate_callable_ownership_metadata(metadata: OwnershipMetadata) {
    if metadata.callable_inference_parents.entries().len() != 0 ||
       metadata.callable_inference_solutions.entries().len() != 0 ||
       metadata.next_callable_inference_term !=
           CALLABLE_SLOT_MOVE_OWNED + 1 {
        panic("unreachable: checker-local callable ownership solver state crossed final metadata barrier")
    }
    for entry in metadata.callable_descriptors.entries() {
        let (ownership_id, descriptor) = entry
        if !callable_descriptor_is_fully_resolved(descriptor) {
            panic("unreachable: unresolved callable ownership descriptor crossed final metadata barrier")
        }
        let mut scratch = new_ownership_metadata()
        let expected = intern_callable_ownership_descriptor(scratch, descriptor)
        if ownership_id != expected {
            panic("unreachable: final HIR callable ownership descriptor collision")
        }
    }
    for entry in metadata.callable_by_def_id.entries() {
        let (def_id, ownership_term) = entry
        if !metadata.callable_state_by_def_id.contains_key(def_id) {
            panic("unreachable: final callable ownership source state is missing")
        }
        let resolved = require_exact_callable_ownership_term(
            metadata, ownership_term)
        if resolved != ownership_term {
            panic("unreachable: provisional callable ownership crossed final metadata barrier")
        }
        match metadata.callable_result_role_by_def_id.get(def_id) {
            some(role) => if !callable_result_role_is_valid(role) {
                panic("unreachable: invalid callable result role crossed final metadata barrier")
            },
            none => panic(
                "unreachable: final callable ownership has no direct result role")
        }
        match metadata.returned_callable_result_role_by_def_id.get(def_id) {
            some(role) => if !callable_result_role_is_valid(role) {
                panic("unreachable: invalid returned callable result role crossed final metadata barrier")
            },
            none => panic(
                "unreachable: final callable ownership has no returned result role")
        }
        match metadata.callable_result_role_spine_by_def_id.get(def_id) {
            some(spine) => {
                if spine.len() < 2 {
                    panic("unreachable: final callable result role spine is incomplete")
                }
                for role in spine {
                    if !callable_result_role_is_valid(role) {
                        panic("unreachable: invalid callable result role spine crossed final metadata barrier")
                    }
                }
                if spine.get(0) != metadata.callable_result_role_by_def_id.get(def_id) ||
                   spine.get(1) != metadata.returned_callable_result_role_by_def_id.get(def_id) {
                    panic("unreachable: callable result role spine disagrees with compatibility maps")
                }
            },
            none => panic(
                "unreachable: final callable ownership has no result role spine")
        }
    }
    for entry in metadata.callable_state_by_def_id.entries() {
        if !metadata.callable_by_def_id.contains_key(entry.0) {
            panic("unreachable: final callable ownership source has no DefId contract")
        }
        let state = entry.1
        if state.transfer_levels.len() == 0 {
            panic("unreachable: final callable ownership has no transfer authority")
        }
        let expected_role_depth = if state.transfer_levels.len() < 2 {
            2
        } else {
            state.transfer_levels.len()
        }
        match metadata.callable_result_role_spine_by_def_id.get(entry.0) {
            some(spine) => if spine.len() != expected_role_depth {
                panic("unreachable: callable result role/transfer spine depth mismatch")
            },
            none => panic(
                "unreachable: callable transfer state has no result role spine")
        }
        let mut level_index = 0
        for level in state.transfer_levels {
            let exact_level_term = require_exact_callable_ownership_term(
                metadata, level.ownership_term)
            if level_index == 0 {
                let direct_term = require_exact_callable_ownership_term(
                    metadata, metadata.callable_by_def_id.get(entry.0).unwrap_or(
                        CALLABLE_UNKNOWN))
                if exact_level_term != direct_term {
                    panic("unreachable: callable direct transfer level disagrees with DefId contract")
                }
            }
            let mut param_index = 0
            for force in level.force_params {
                let param_mode = callable_param_ownership(
                    metadata, exact_level_term, param_index)
                if param_mode == PARAM_OWNERSHIP_UNKNOWN {
                    panic("unreachable: callable transfer vector exceeds its exact descriptor")
                }
                if force && param_mode != PARAM_OWNERSHIP_MOVE {
                    panic("unreachable: callable FORCE parameter is not Move")
                }
                param_index = param_index + 1
            }
            level_index = level_index + 1
        }
    }
    for entry in metadata.callable_result_role_by_def_id.entries() {
        if !metadata.callable_by_def_id.contains_key(entry.0) {
            panic("unreachable: callable result role has no DefId contract")
        }
    }
    for entry in metadata.returned_callable_result_role_by_def_id.entries() {
        if !metadata.callable_by_def_id.contains_key(entry.0) {
            panic("unreachable: returned callable result role has no DefId contract")
        }
    }
    for entry in metadata.callable_result_role_spine_by_def_id.entries() {
        if !metadata.callable_by_def_id.contains_key(entry.0) {
            panic("unreachable: callable result role spine has no DefId contract")
        }
    }
}

pub fn freeze_callable_ownership_metadata(
    metadata: OwnershipMetadata
) -> OwnershipMetadata {
    let mut exact_by_def_id: Map<Int, Int> = map_new()
    let mut exact_states: Map<Int, CallableOwnershipState> = map_new()
    for entry in metadata.callable_by_def_id.entries() {
        let (def_id, term) = entry
        let exact_def_id = def_id
        exact_by_def_id.insert(exact_def_id,
            require_exact_callable_ownership_term(metadata, term))
        match metadata.callable_state_by_def_id.get(def_id) {
            some(state) => {
                let state_def_id = def_id
                let state_source = state.source
                let mut exact_levels: List<CallableTransferLevel> = []
                for level in state.transfer_levels {
                    let mut exact_forces: List<Bool> = []
                    for force in level.force_params {
                        let copied_force = force
                        exact_forces.push(copied_force)
                    }
                    exact_levels.push(CallableTransferLevel {
                        ownership_term: require_exact_callable_ownership_term(
                            metadata, level.ownership_term),
                        force_params: exact_forces
                    })
                }
                exact_states.insert(state_def_id,
                    CallableOwnershipState {
                        source: state_source,
                        transfer_levels: exact_levels
                    })
            },
            none => panic(
                "unreachable: callable ownership state is missing at freeze")
        }
    }
    let frozen = OwnershipMetadata {
        callable_descriptors: map_clone(metadata.callable_descriptors),
        callable_by_def_id: exact_by_def_id,
        callable_state_by_def_id: exact_states,
        callable_result_role_by_def_id:
            map_clone(metadata.callable_result_role_by_def_id),
        returned_callable_result_role_by_def_id:
            map_clone(metadata.returned_callable_result_role_by_def_id),
        callable_result_role_spine_by_def_id:
            map_clone(metadata.callable_result_role_spine_by_def_id),
        callable_inference_parents: map_new(),
        callable_inference_solutions: map_new(),
        next_callable_inference_term: CALLABLE_SLOT_MOVE_OWNED + 1,
        ownership_shapes: map_clone(metadata.ownership_shapes)
    }
    validate_callable_ownership_metadata(frozen)
    frozen
}

pub fn ownership_shapes_equal(a: OwnershipShape, b: OwnershipShape) -> Bool {
    if a.direct_drop != b.direct_drop || a.may_own != b.may_own ||
       a.param_deps.len() != b.param_deps.len() {
        return false
    }
    let mut index = 0
    while index < a.param_deps.len() {
        if a.param_deps.get(index) != b.param_deps.get(index) {
            return false
        }
        index = index + 1
    }
    true
}

pub fn merge_ownership_shape(
    mut metadata: OwnershipMetadata, identity: Str, shape: OwnershipShape
) {
    if shape.direct_drop && !shape.may_own {
        panic("unreachable: direct Drop ownership shape does not own")
    }
    match metadata.ownership_shapes.get(identity) {
        some(existing) => if !ownership_shapes_equal(existing, shape) {
            panic("unreachable: cross-module ownership shape mismatch")
        },
        none => metadata.ownership_shapes.insert(identity, shape)
    }
}

fn nominal_type_may_own(
    metadata: OwnershipMetadata, name: Str, args: List<Type>
) -> Bool {
    // Ptr is a real canonical builtin ownership barrier. Registration rejects
    // an exact user nominal collision before any StructType/EnumType can carry
    // this identity, while genuine pointer annotations lower to PtrType.
    if name == BUILTIN_PTR { return false }
    match metadata.ownership_shapes.get(name) {
        some(shape) => {
            if shape.direct_drop || shape.may_own { return true }
            let mut index = 0
            while index < shape.param_deps.len() {
                match shape.param_deps.get(index) {
                    some(depends) => if depends {
                        match args.get(index) {
                            some(actual) => if type_may_own(metadata, actual) {
                                return true
                            },
                            // A missing actual for a dependent parameter is an
                            // unresolved instantiation, hence may-own.
                            none => return true
                        }
                    },
                    none => {}
                }
                index = index + 1
            }
            false
        },
        // No nominal summary is never proof of Copy/non-linearity.
        none => true
    }
}

// Generic-sensitive query shared by the checker, Perceus and the verifier.
// Unresolved variables/Any/Error fail closed to may-own; Ptr/Rc are the only
// explicit structural barriers.
pub fn type_may_own(metadata: OwnershipMetadata, ty: Type) -> Bool {
    match ty {
        Type::IntType | Type::FloatType | Type::StrType | Type::BoolType |
        Type::UnitType | Type::NeverType => false,
        Type::AnyType | Type::ErrorType | Type::TypeVar { .. } => true,
        Type::FnType { .. } => false,
        Type::PtrType { .. } => false,
        Type::StructType { name, type_params } =>
            nominal_type_may_own(metadata, name, type_params),
        Type::EnumType { name, type_params } =>
            nominal_type_may_own(metadata, name, type_params),
        Type::GenericType { base, args } => match base {
            Type::StructType { name, .. } =>
                nominal_type_may_own(metadata, name, args),
            Type::EnumType { name, .. } =>
                nominal_type_may_own(metadata, name, args),
            _ => type_may_own(metadata, base)
        },
        Type::RecordType { fields, tail, .. } => {
            // An open row may later contribute an owner-bearing field.  Until
            // the tail is closed, absence from the visible prefix is not proof
            // that the record is Copy/non-linear.
            tail.is_some() || fields.any(fn(field) {
                type_may_own(metadata, field.ty)
            })
        },
        Type::TupleType { elements } => elements.any(fn(element) {
            type_may_own(metadata, element)
        }),
        Type::EffectRowType { .. } => false
    }
}

fn transfer_force_lists_equal(a: List<Bool>, b: List<Bool>) -> Bool {
    if a.len() != b.len() { return false }
    let mut index = 0
    while index < a.len() {
        if a.get(index) != b.get(index) { return false }
        index = index + 1
    }
    true
}

pub fn callable_transfer_levels_equal(
    a: List<CallableTransferLevel>, b: List<CallableTransferLevel>
) -> Bool {
    if a.len() != b.len() { return false }
    let mut index = 0
    while index < a.len() {
        match (a.get(index), b.get(index)) {
            (some(left), some(right)) => {
                if left.ownership_term != right.ownership_term ||
                   !transfer_force_lists_equal(
                       left.force_params, right.force_params) {
                    return false
                }
            },
            _ => return false
        }
        index = index + 1
    }
    true
}

// Same-mode multi-source joins are legal public callable types.  Internally,
// caller invalidation is the conservative commutative join: FORCE dominates
// OWNING at every parameter and every returned-callable depth.
pub fn join_callable_transfer_levels(
    metadata: OwnershipMetadata,
    left: List<CallableTransferLevel>, right: List<CallableTransferLevel>
) -> List<CallableTransferLevel> {
    if left.len() != right.len() {
        panic("unreachable: callable transfer return-spine depth mismatch")
    }
    let mut result: List<CallableTransferLevel> = []
    let mut level_index = 0
    while level_index < left.len() {
        let left_level = match left.get(level_index) {
            some(value) => value,
            none => panic("unreachable: missing left callable transfer level")
        }
        let right_level = match right.get(level_index) {
            some(value) => value,
            none => panic("unreachable: missing right callable transfer level")
        }
        let left_term = require_exact_callable_ownership_term(
            metadata, left_level.ownership_term)
        let right_term = require_exact_callable_ownership_term(
            metadata, right_level.ownership_term)
        if left_term != right_term ||
           left_level.force_params.len() != right_level.force_params.len() {
            panic("unreachable: callable transfer levels disagree with exact callable type")
        }
        let mut forces: List<Bool> = []
        let mut param_index = 0
        while param_index < left_level.force_params.len() {
            forces.push(
                left_level.force_params.get(param_index).unwrap_or(false) ||
                right_level.force_params.get(param_index).unwrap_or(false))
            param_index = param_index + 1
        }
        result.push(CallableTransferLevel {
            ownership_term: left_term, force_params: forces
        })
        level_index = level_index + 1
    }
    result
}

pub fn record_callable_ownership_with_transfer_levels(
    mut metadata: OwnershipMetadata, def_id: Int, ownership_term: Int,
    source: Int, transfer_levels: List<CallableTransferLevel>
) {
    if !is_callable_ownership_term(ownership_term) {
        panic("unreachable: invalid callable ownership tagged term")
    }
    if is_callable_ownership_inference_term(ownership_term) {
        let _ = callable_ownership_inference_root(
            metadata, ownership_term)
    } else if ownership_term < 0 &&
              !metadata.callable_descriptors.contains_key(ownership_term) {
        panic("unreachable: callable ownership descriptor is not registered")
    }
    let contract_def_id = def_id
    let contract_term = ownership_term
    let state_def_id = def_id
    let direct_role_lookup_def_id = def_id
    let direct_role_insert_def_id = def_id
    let returned_role_lookup_def_id = def_id
    let returned_role_insert_def_id = def_id
    metadata.callable_by_def_id.insert(contract_def_id, contract_term)
    let state_source = source
    metadata.callable_state_by_def_id.insert(state_def_id, CallableOwnershipState {
        source: state_source,
        transfer_levels: clone_callable_transfer_levels(transfer_levels)
    })
    // Registration makes both semantic role maps total.  Specialized builtin,
    // alias and factory proofs overwrite these NONE seeds by exact DefId.
    if !metadata.callable_result_role_by_def_id.contains_key(
            direct_role_lookup_def_id) {
        metadata.callable_result_role_by_def_id.insert(
            direct_role_insert_def_id, CALLABLE_RESULT_ROLE_NONE)
    }
    if !metadata.returned_callable_result_role_by_def_id.contains_key(
            returned_role_lookup_def_id) {
        metadata.returned_callable_result_role_by_def_id.insert(
            returned_role_insert_def_id, CALLABLE_RESULT_ROLE_NONE)
    }
    if !metadata.callable_result_role_spine_by_def_id.contains_key(def_id) {
        metadata.callable_result_role_spine_by_def_id.insert(
            def_id, [CALLABLE_RESULT_ROLE_NONE, CALLABLE_RESULT_ROLE_NONE])
    }
}

// Provisional checker registrations deliberately carry no strength authority.
// Body solving, builtin/interface registration, import localization or
// deterministic recovery must replace this state before a successful frozen
// program may consume it.
pub fn record_callable_ownership(
    mut metadata: OwnershipMetadata, def_id: Int, ownership_term: Int,
    source: Int
) {
    record_callable_ownership_with_transfer_levels(
        metadata, def_id, ownership_term, source, [])
}

pub fn set_callable_transfer_levels(
    mut metadata: OwnershipMetadata, def_id: Int,
    source: Int, transfer_levels: List<CallableTransferLevel>
) {
    let ownership_term = match metadata.callable_by_def_id.get(def_id) {
        some(term) => term,
        none => panic(
            "unreachable: callable transfer state has no DefId contract")
    }
    record_callable_ownership_with_transfer_levels(
        metadata, def_id, ownership_term, source, transfer_levels)
}

pub fn callable_param_requires_force(
    metadata: OwnershipMetadata, def_id: Int, index: Int
) -> Bool? {
    match metadata.callable_state_by_def_id.get(def_id) {
        some(state) => match state.transfer_levels.get(0) {
            some(level) => level.force_params.get(index),
            none => none
        },
        none => none
    }
}

pub fn callable_transfer_levels_for_def_id(
    metadata: OwnershipMetadata, def_id: Int
) -> List<CallableTransferLevel>? {
    match metadata.callable_state_by_def_id.get(def_id) {
        some(state) => some(clone_callable_transfer_levels(
            state.transfer_levels)),
        none => none
    }
}

pub fn callable_result_role_is_valid(role: Int) -> Bool {
    role == CALLABLE_RESULT_ROLE_NONE ||
        role == CALLABLE_RESULT_ROLE_FRESH_OWNED_SLOT ||
        role == CALLABLE_RESULT_ROLE_UNKNOWN
}

pub fn set_callable_result_role(
    mut metadata: OwnershipMetadata, def_id: Int, role: Int
) {
    if !metadata.callable_by_def_id.contains_key(def_id) {
        panic("unreachable: callable result role has no exact DefId contract")
    }
    if !callable_result_role_is_valid(role) {
        panic("unreachable: invalid callable result role")
    }
    metadata.callable_result_role_by_def_id.insert(def_id, role)
    let mut spine = metadata.callable_result_role_spine_by_def_id.get(
        def_id).unwrap_or([CALLABLE_RESULT_ROLE_NONE,
                          CALLABLE_RESULT_ROLE_NONE])
    while spine.len() < 2 { spine.push(CALLABLE_RESULT_ROLE_NONE) }
    spine.set(0, role)
    metadata.callable_result_role_spine_by_def_id.insert(def_id, spine)
}

pub fn set_returned_callable_result_role(
    mut metadata: OwnershipMetadata, def_id: Int, role: Int
) {
    if !metadata.callable_by_def_id.contains_key(def_id) {
        panic("unreachable: returned callable result role has no exact DefId contract")
    }
    if !callable_result_role_is_valid(role) {
        panic("unreachable: invalid returned callable result role")
    }
    metadata.returned_callable_result_role_by_def_id.insert(def_id, role)
    let mut spine = metadata.callable_result_role_spine_by_def_id.get(
        def_id).unwrap_or([CALLABLE_RESULT_ROLE_NONE,
                          CALLABLE_RESULT_ROLE_NONE])
    while spine.len() < 2 { spine.push(CALLABLE_RESULT_ROLE_NONE) }
    spine.set(1, role)
    metadata.callable_result_role_spine_by_def_id.insert(def_id, spine)
}

pub fn set_callable_result_role_spine(
    mut metadata: OwnershipMetadata, def_id: Int, roles: List<Int>
) {
    if !metadata.callable_by_def_id.contains_key(def_id) {
        panic("unreachable: callable result role spine has no exact DefId contract")
    }
    let mut normalized = list_clone(roles)
    while normalized.len() < 2 {
        normalized.push(CALLABLE_RESULT_ROLE_NONE)
    }
    let mut role_index = 0
    while role_index < normalized.len() {
        let role = normalized.get(role_index).unwrap_or(
            CALLABLE_RESULT_ROLE_UNKNOWN)
        if !callable_result_role_is_valid(role) {
            panic("unreachable: invalid callable result role spine")
        }
        role_index = role_index + 1
    }
    let direct_role = normalized.get(0).unwrap_or(
        CALLABLE_RESULT_ROLE_NONE)
    let returned_role = normalized.get(1).unwrap_or(
        CALLABLE_RESULT_ROLE_NONE)
    metadata.callable_result_role_spine_by_def_id.insert(
        def_id, normalized)
    metadata.callable_result_role_by_def_id.insert(
        def_id, direct_role)
    metadata.returned_callable_result_role_by_def_id.insert(
        def_id, returned_role)
}

// Publish the complete ownership truth for one post-freeze synthetic callable
// slot. The FnType term is only a cross-check: every semantic field comes from
// one or more exact source DefIds already present in frozen metadata.
// Control-flow sources may differ in identity, but they must agree on the
// callable descriptor; result-role disagreement joins to UNKNOWN rather than
// silently choosing one branch. The merge is commutative and therefore
// independent of branch order.
//
// ANF targets may reference only ordinary or earlier ANF identities. RC targets
// are produced later and may additionally reference earlier RC identities. The
// caller separately proves the numeric namespace of target and negative sources;
// this layer proves the matching provenance and all four total metadata tables.
fn project_synthetic_callable_metadata(
    mut metadata: OwnershipMetadata, target_def_id: Int,
    expected_ownership_term: Int, source_def_ids: List<Int>,
    target_source: Int, allow_rc_sources: Bool
) {
    if source_def_ids.len() == 0 {
        panic("unreachable: synthetic callable has no exact source DefId")
    }
    if metadata.callable_by_def_id.contains_key(target_def_id) ||
       metadata.callable_state_by_def_id.contains_key(target_def_id) ||
       metadata.callable_result_role_by_def_id.contains_key(target_def_id) ||
       metadata.returned_callable_result_role_by_def_id.contains_key(
            target_def_id) {
        panic("unreachable: synthetic callable target metadata already exists")
    }
    let expected = require_exact_callable_ownership_term(
        metadata, expected_ownership_term)
    if expected != expected_ownership_term {
        panic("unreachable: synthetic callable FnType is not frozen")
    }

    let mut seen: Set<Int> = set_new()
    let mut first = true
    let mut direct_role = CALLABLE_RESULT_ROLE_UNKNOWN
    let mut returned_role = CALLABLE_RESULT_ROLE_UNKNOWN
    let mut merged_role_spine: List<Int>? = none
    let mut merged_transfer_levels: List<CallableTransferLevel>? = none
    for source_def_id in source_def_ids {
        if seen.contains(source_def_id) {
            panic("unreachable: synthetic callable repeats a source DefId")
        }
        let recorded_source = source_def_id
        seen.insert(recorded_source)
        let source_term = match metadata.callable_by_def_id.get(source_def_id) {
            some(term) => term,
            none => panic(
                "unreachable: synthetic callable source has no exact ownership descriptor")
        }
        if require_exact_callable_ownership_term(metadata, source_term) !=
               expected || source_term != expected {
            panic("unreachable: synthetic callable source descriptor disagrees with its frozen FnType")
        }
        match metadata.callable_state_by_def_id.get(source_def_id) {
            some(state) => {
                if source_def_id < 0 &&
                   state.source != CALLABLE_SOURCE_SYNTHETIC_ANF &&
                   (!allow_rc_sources ||
                    state.source != CALLABLE_SOURCE_SYNTHETIC_RC) {
                    panic("unreachable: synthetic callable source uses a foreign synthetic provenance")
                }
                let source_levels = clone_callable_transfer_levels(
                    state.transfer_levels)
                merged_transfer_levels = match merged_transfer_levels {
                    some(existing_levels) => some(
                        join_callable_transfer_levels(
                            metadata, existing_levels, source_levels)),
                    none => some(source_levels)
                }
            },
            none => panic(
                "unreachable: synthetic callable source has no ownership state")
        }
        let source_direct = match metadata.callable_result_role_by_def_id.get(
                source_def_id) {
            some(role) => if callable_result_role_is_valid(role) {
                role
            } else {
                panic("unreachable: synthetic callable source has an invalid direct result role")
            },
            none => panic(
                "unreachable: synthetic callable source has no direct result role")
        }
        let source_returned = match metadata
                .returned_callable_result_role_by_def_id.get(source_def_id) {
            some(role) => if callable_result_role_is_valid(role) {
                role
            } else {
                panic("unreachable: synthetic callable source has an invalid returned result role")
            },
            none => panic(
                "unreachable: synthetic callable source has no returned result role")
        }
        let source_spine = match metadata
                .callable_result_role_spine_by_def_id.get(source_def_id) {
            some(spine) => list_clone(spine),
            none => panic(
                "unreachable: synthetic callable source has no result role spine")
        }
        merged_role_spine = match merged_role_spine {
            some(existing_spine) => {
                if existing_spine.len() != source_spine.len() {
                    panic("unreachable: synthetic callable source role spine depth mismatch")
                }
                let mut joined: List<Int> = []
                let mut role_index = 0
                while role_index < existing_spine.len() {
                    let left_role = existing_spine.get(role_index).unwrap_or(
                        CALLABLE_RESULT_ROLE_UNKNOWN)
                    let right_role = source_spine.get(role_index).unwrap_or(
                        CALLABLE_RESULT_ROLE_UNKNOWN)
                    joined.push(if left_role == right_role {
                        left_role
                    } else {
                        CALLABLE_RESULT_ROLE_UNKNOWN
                    })
                    role_index = role_index + 1
                }
                some(joined)
            },
            none => some(source_spine)
        }
        if first {
            direct_role = source_direct
            returned_role = source_returned
            first = false
        } else {
            if direct_role != source_direct {
                direct_role = CALLABLE_RESULT_ROLE_UNKNOWN
            }
            if returned_role != source_returned {
                returned_role = CALLABLE_RESULT_ROLE_UNKNOWN
            }
        }
    }

    let direct_role_target_def_id = target_def_id
    let projected_levels = match merged_transfer_levels {
        some(levels) => levels,
        none => panic(
            "unreachable: synthetic callable sources have no transfer state")
    }
    record_callable_ownership_with_transfer_levels(
        metadata, target_def_id, expected, target_source, projected_levels)
    let projected_role_spine = match merged_role_spine {
        some(spine) => spine,
        none => [direct_role, returned_role]
    }
    set_callable_result_role_spine(
        metadata, direct_role_target_def_id, projected_role_spine)
}

pub fn project_synthetic_anf_callable_metadata(
    mut metadata: OwnershipMetadata, target_def_id: Int,
    expected_ownership_term: Int, source_def_ids: List<Int>
) {
    project_synthetic_callable_metadata(metadata, target_def_id,
        expected_ownership_term, source_def_ids,
        CALLABLE_SOURCE_SYNTHETIC_ANF, false)
}

pub fn project_synthetic_rc_callable_metadata(
    mut metadata: OwnershipMetadata, target_def_id: Int,
    expected_ownership_term: Int, source_def_ids: List<Int>
) {
    project_synthetic_callable_metadata(metadata, target_def_id,
        expected_ownership_term, source_def_ids,
        CALLABLE_SOURCE_SYNTHETIC_RC, true)
}

pub fn callable_param_ownership(
    metadata: OwnershipMetadata, ownership_term: Int, index: Int
) -> Int {
    let ownership_id = resolve_callable_ownership_term(
        metadata, ownership_term)
    if is_callable_ownership_inference_term(ownership_id) {
        return PARAM_OWNERSHIP_UNKNOWN
    }
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
    metadata: OwnershipMetadata, ownership_term: Int
) -> Int {
    let ownership_id = resolve_callable_ownership_term(
        metadata, ownership_term)
    if is_callable_ownership_inference_term(ownership_id) {
        return RETURN_OWNERSHIP_UNKNOWN
    }
    if ownership_id == CALLABLE_UNKNOWN {
        return RETURN_OWNERSHIP_UNKNOWN
    }
    if ownership_id == CALLABLE_BORROW_BORROWED ||
       ownership_id == CALLABLE_BORROW_MOVE_BORROWED {
        return RETURN_OWNERSHIP_BORROWED
    }
    if is_callable_ownership_canonical_encoding(ownership_id) {
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
        Effect::CustomEffect { name, .. } => {
            let owned_name = name
            owned_name
        },
        Effect::UnsafeEffect => "unsafe"
    }
}

fn is_type_var(t: Type) -> Bool {
    match t { Type::TypeVar { .. } => true, _ => false }
}

pub fn type_to_builtin_name(t: Type) -> Str? {
    match t {
        Type::IntType => some(BUILTIN_INT),
        Type::FloatType => some(BUILTIN_FLOAT),
        Type::StrType => some(BUILTIN_STR),
        Type::BoolType => some(BUILTIN_BOOL),
        Type::UnitType => some("Unit"),
        Type::PtrType { .. } => some(BUILTIN_PTR),
        Type::StructType { name, .. } => {
            let owned_name = name
            some(owned_name)
        },
        Type::EnumType { name, .. } => {
            let owned_name = name
            some(owned_name)
        },
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
    // Nested inspection keeps both Option inputs borrowed.  Building a tuple
    // here would make the helper's inferred ABI consume both scalar options.
    match a {
        some(x) => match b {
            some(y) => x == y,
            none => false
        },
        none => b.is_none()
    }
}

// Checker-time effect matching resolves callable ownership terms nested in
// effect parameters. There is deliberately no ownership-blind checker API.
pub fn effects_match_kind_with_ownership(
    metadata: OwnershipMetadata, a: Effect, b: Effect
) -> Bool {
    match a {
        Effect::IoEffect => match b { Effect::IoEffect => true, _ => false },
        Effect::MutEffect { state_type: sa } => match b {
            Effect::MutEffect { state_type: sb } =>
                is_type_var(sa) || is_type_var(sb) ||
                types_equal_with_ownership(metadata, sa, sb),
            _ => false
        },
        Effect::FailEffect { .. } => match b {
            Effect::FailEffect { .. } => true,
            _ => false
        },
        Effect::CustomEffect { name: na, .. } => match b {
            Effect::CustomEffect { name: nb, .. } => na == nb,
            _ => false
        },
        Effect::UnsafeEffect => match b {
            Effect::UnsafeEffect => true,
            _ => false
        }
    }
}

pub fn row_merge_with_ownership(
    metadata: OwnershipMetadata, a: EffectRow, b: EffectRow
) -> RowMergeResult {
    let mut merged = list_clone(a.effects)
    for eff in b.effects {
        if !merged.any(fn(e) {
            effects_match_kind_with_ownership(metadata, e, eff)
        }) {
            let owned_eff = eff
            merged.push(owned_eff)
        }
    }
    let result_a_tail = a.tail
    let result_b_tail = b.tail
    let tail: Int? = match (result_a_tail, result_b_tail) {
        (some(ta), _) => {
            let owned_ta = ta
            some(owned_ta)
        },
        (_, some(tb)) => {
            let owned_tb = tb
            some(owned_tb)
        },
        _ => none
    }
    let unify_a_tail = a.tail
    let unify_b_tail = b.tail
    let tails_to_unify: Option<(Int, Int)> = match (
        unify_a_tail, unify_b_tail
    ) {
        (some(ta), some(tb)) => if ta != tb {
            let owned_ta = ta
            let owned_tb = tb
            some((owned_ta, owned_tb))
        } else { none },
        _ => none
    }
    RowMergeResult {
        row: EffectRow { effects: merged, tail: tail },
        tails_to_unify: tails_to_unify
    }
}

fn effects_equal(a: Effect, b: Effect) -> Bool {
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

fn types_equal(a: Type, b: Type) -> Bool {
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
        // Callable ownership is part of the function type. During inference
        // definition-rigid variables compare by term identity; the freeze
        // barrier rewrites every successful program to exact descriptor IDs.
        Type::FnType { params: pa, return_type: ra, meta: ma } => match b {
            Type::FnType { params: pb, return_type: rb, meta: mb } =>
                type_lists_equal(pa, pb) && types_equal(ra, rb)
                    && effects_list_equal(ma.effects.effects, mb.effects.effects)
                    // Open effect row tails are compared by exact TypeVar ID (structural equality).
                    // Two different open tails (?N1, ?N2) are structurally distinct even though both
                    // represent "open row" semantically. Semantic equivalence is handled by unification,
                    // not types_equal — this function is for error messages and debug output.
                    && optional_ids_equal(ma.effects.tail, mb.effects.tail)
                    && ma.ownership_term == mb.ownership_term,
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

// Inference-time structural equality must observe the ownership union-find.
// Rewriting both operands first makes two terms joined by an earlier
// constraint compare equal without treating CALLABLE_UNKNOWN as a wildcard:
// Unknown only equals the same literal Unknown term. An unregistered checker
// variable still fails loudly through resolve_callable_ownership_term.
pub fn types_equal_with_ownership(
    metadata: OwnershipMetadata, a: Type, b: Type
) -> Bool {
    types_equal(
        resolve_callable_ownership_type(metadata, a),
        resolve_callable_ownership_type(metadata, b)
    )
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
            some(n) => {
                let owned_name = n
                owned_name
            },
            none => "?${id.to_str()}"
        },
        Type::FnType { params, return_type, meta } => {
            let ps = params.map(fn(p) { type_to_string(p) }).join(", ")
            let ret = type_to_string(return_type)
            let eff = effect_row_to_string(meta.effects)
            if eff.len() > 0 {
                "fn(${ps}) -> ${ret} / ${eff}"
            } else {
                "fn(${ps}) -> ${ret}"
            }
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
