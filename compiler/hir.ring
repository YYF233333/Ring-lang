use ast::{Span, Pattern, BinOp, UnaryOp, TypeParam}
use types::{Type, EffectRow, StructField, EnumVariant, RecordField,
    OwnershipMetadata, PARAM_OWNERSHIP_UNKNOWN,
    RETURN_OWNERSHIP_OWNED, RETURN_OWNERSHIP_BORROWED,
    callable_return_ownership}

pub use types::{BUILTIN_INT, BUILTIN_FLOAT, BUILTIN_STR, BUILTIN_BOOL,
    BUILTIN_RANGE, BUILTIN_LIST, BUILTIN_MAP, BUILTIN_SET,
    BUILTIN_OPTION, BUILTIN_CELL, BUILTIN_STRING_BUILDER}

pub use builtin_methods::{CELL_METHODS, STR_METHODS, INT_METHODS, FLOAT_METHODS,
    LIST_NON_HOF_METHODS, LIST_HOF_METHODS,
    MAP_NON_HOF_METHODS, MAP_HOF_METHODS,
    SET_NON_HOF_METHODS, SET_HOF_METHODS,
    OPTION_NON_HOF_METHODS, OPTION_HOF_METHODS,
    STRINGBUILDER_METHODS}

// Checker DefIds are non-negative. Post-checker passes use disjoint negative
// namespaces so every synthetic binder has a deterministic identity without
// consulting source spellings or a backend-local name table. The ordinal is
// the pass's deterministic program traversal index; ranges are deliberately
// disjoint from dynamic callable descriptor IDs (-1..-2147483629).
pub const SYNTHETIC_DICT_DEF_ID_BASE: Int = 0 - 3000000000
pub const SYNTHETIC_ANF_DEF_ID_BASE: Int = 0 - 4000000000
pub const SYNTHETIC_RC_DEF_ID_BASE: Int = 0 - 5000000000
pub const SYNTHETIC_DEF_ID_NAMESPACE_SIZE: Int = 1000000000

pub fn synthetic_def_id(base: Int, ordinal: Int) -> Int {
    if ordinal <= 0 || ordinal >= SYNTHETIC_DEF_ID_NAMESPACE_SIZE {
        panic("unreachable: synthetic DefId namespace exhausted")
    }
    base - ordinal
}

pub fn is_synthetic_anf_def_id(def_id: Int) -> Bool {
    def_id < SYNTHETIC_ANF_DEF_ID_BASE &&
        def_id > SYNTHETIC_ANF_DEF_ID_BASE -
            SYNTHETIC_DEF_ID_NAMESPACE_SIZE
}

pub fn is_synthetic_rc_def_id(def_id: Int) -> Bool {
    def_id < SYNTHETIC_RC_DEF_ID_BASE &&
        def_id > SYNTHETIC_RC_DEF_ID_BASE -
            SYNTHETIC_DEF_ID_NAMESPACE_SIZE
}

// Callable values installed directly by builtins.ring rather than parsed from
// a Decl. Checker provenance and both native backends must consume this one
// list so a newly added checker-only callable cannot drift across phases.
pub const CHECKER_ONLY_EXTERN_CALLABLES: List<Str> =
    ["Cell", "alloc", "dealloc", "ptr_copy", "ptr_from_addr"]

// File-module declaration identity. `$` is not legal in a Ring identifier,
// while resolver module prefixes use `$` between path segments.  Therefore
// `$$_` is an unambiguous boundary between a module path and its declaration;
// inline-module components remain after the declaration as `::child`.
//
// This string is an internal identity, never a user-facing display name.
pub fn module_item_identity(module_prefix: Str, decl_name: Str) -> Str {
    "${module_prefix}$$_${decl_name}"
}

pub fn is_module_item_identity(name: Str) -> Bool {
    name.index_of("$$_").is_some()
}

// One user-declared impl block, described by the identity the checker's
// registration pass resolved while the module's namespace frames were still
// live. Export extraction runs after the frame journal has been rolled back,
// so it must consume these persisted facts instead of re-resolving the impl
// target spelling against a dead environment (checker/exports shared
// contract; see check_impl_decl and extract_exports).
pub struct ModuleImplFact {
    // Canonical nominal identity chosen by resolve_nominal_identity during
    // checking: a declaration identity for user types, the bare builtin
    // spelling (e.g. "Str") for builtin impls.
    pub target: Str,
    pub is_trait_impl: Bool,
    // fn-method names in declaration order (delegates excluded upstream by
    // HIR construction only when they do not lower to HDecl::Fn).
    pub method_names: List<Str>,
    // True for impls declared at file level (frame zero); inline-mod impls
    // keep the public-frame gate applied during collection.
    pub is_top_level: Bool
}

// Foreign declarations have two independent identities: `HDecl::ExternFn.name`
// is the exact Ring declaration identity used by lookup/provenance, while the
// ABI symbol remains the final source leaf. Keeping this split explicit stops
// equal extern leaves in different modules from contaminating backend lookup.
pub fn extern_abi_leaf(identity: Str) -> Str {
    let inline_parts = identity.split("::")
    let inline_leaf = inline_parts.get(inline_parts.len() - 1).unwrap_or(identity)
    let file_parts = inline_leaf.split("$$_")
    file_parts.get(file_parts.len() - 1).unwrap_or(inline_leaf)
}

// Compiler-synthesised definitions live below an unspellable module prefix.
// Resolver path segments come only from a filesystem basename after `/` and
// `\` have been split away, or from a legal use/inline-module identifier.
// Therefore no segment can contain `/`; module_prefix joins segments only with
// `$`, so no source declaration identity can begin with this sentinel.
fn compiler_intrinsic_identity(namespace: Str, source_name: Str) -> Str {
    module_item_identity("/$compiler_intrinsic$${namespace}", source_name)
}

// Synthetic Map indexing must bypass every user-spellable binding while the
// raw helper remains available as an ordinary prelude API.  Checker and infer
// share both spellings here so neither phase can drift from the other.
pub fn map_index_helper_source_name() -> Str {
    "map_get_panic"
}

pub fn map_index_helper_identity() -> Str {
    compiler_intrinsic_identity("prelude$map", map_index_helper_source_name())
}

// The raw slot bridge spellings remain callable prelude APIs, so their
// ownership contracts must not attach to those user-spellable names.  The
// checker records these unspellable identities on the exact prelude DefIds;
// RC and both native backends consume only the identities below.
pub fn slot_read_source_name() -> Str {
    "ring_slot_read"
}

pub fn slot_take_source_name() -> Str {
    "ring_slot_take"
}

pub fn slot_write_source_name() -> Str {
    "ring_slot_write"
}

fn slot_bridge_identity(source_name: Str) -> Str {
    compiler_intrinsic_identity("prelude$slot", source_name)
}

pub fn slot_read_identity() -> Str {
    slot_bridge_identity(slot_read_source_name())
}

pub fn slot_take_identity() -> Str {
    slot_bridge_identity(slot_take_source_name())
}

pub fn slot_write_identity() -> Str {
    slot_bridge_identity(slot_write_source_name())
}

// Every parsed top-level prelude extern receives an unspellable semantic
// identity. This keeps its declaration distinct from a user fn/const with the
// same leaf in every project module; `HDecl::ExternFn.abi_name` remains raw.
// Slot bridges retain their specific identities because RC consumes those
// exact ownership contracts.
pub fn prelude_extern_identity(source_name: Str) -> Str {
    if source_name == slot_read_source_name() { return slot_read_identity() }
    if source_name == slot_take_source_name() { return slot_take_identity() }
    if source_name == slot_write_source_name() { return slot_write_identity() }
    compiler_intrinsic_identity("prelude$extern", source_name)
}

// Convert only a proven prelude slot identity back to its C ABI symbol.
// Ordinary Ring bindings with the same source spelling intentionally miss.
pub fn slot_bridge_runtime_name(identity: Str) -> Str? {
    if identity == slot_read_identity() { return some(slot_read_source_name()) }
    if identity == slot_take_identity() { return some(slot_take_source_name()) }
    if identity == slot_write_identity() { return some(slot_write_source_name()) }
    none
}

pub struct HParam {
    pub name: Str,
    pub ty: Type,
    pub def_id: Int?,
    // Bit 0 is local binding mutability, bits 1..2 are the independent
    // caller/callee ownership mode, bit 3 marks the checker-verified
    // external owner passed to the authoritative Drop destructor.  The latter
    // remains Move at the ABI edge but is borrowed inside the user body because
    // the runtime glue alone owns and destroys the complete allocation.
    // Bit 4 independently records that Move is a declared logical FORCE edge;
    // body inference may later publish the same Move mode without setting it.
    pub flags: Int
}

const HPARAM_EXTERNAL_DROP_OWNER: Int = 8
const HPARAM_DECLARED_FORCE: Int = 16

pub fn hparam_flags(is_mutable: Bool, ownership: Int) -> Int {
    ownership * 2 + if is_mutable { 1 } else { 0 }
}

pub fn hparam_flags_with_force(
    is_mutable: Bool, ownership: Int, declared_force: Bool
) -> Int {
    hparam_flags(is_mutable, ownership) +
        if declared_force { HPARAM_DECLARED_FORCE } else { 0 }
}

pub fn hparam_is_mutable(param: HParam) -> Bool {
    param.flags % 2 == 1
}

pub fn hparam_ownership(param: HParam) -> Int {
    let mode = (param.flags / 2) % 4
    if mode >= 0 && mode <= PARAM_OWNERSHIP_UNKNOWN {
        mode
    } else {
        PARAM_OWNERSHIP_UNKNOWN
    }
}

pub fn hparam_is_external_drop_owner(param: HParam) -> Bool {
    (param.flags / HPARAM_EXTERNAL_DROP_OWNER) % 2 == 1
}

pub fn hparam_is_declared_force(param: HParam) -> Bool {
    (param.flags / HPARAM_DECLARED_FORCE) % 2 == 1
}

pub fn hparam_mark_external_drop_owner(param: HParam) -> HParam {
    if hparam_is_external_drop_owner(param) { return param }
    HParam { ..param, flags: param.flags + HPARAM_EXTERNAL_DROP_OWNER }
}

pub fn hparam_replace_ownership(param: HParam, ownership: Int) -> HParam {
    let external_role = if hparam_is_external_drop_owner(param) {
        HPARAM_EXTERNAL_DROP_OWNER
    } else { 0 }
    let force_role = if hparam_is_declared_force(param) {
        HPARAM_DECLARED_FORCE
    } else { 0 }
    HParam { ..param,
        flags: hparam_flags(hparam_is_mutable(param), ownership) +
            external_role + force_role }
}

// B-104 D4 (#151): dict evidence is FIRST-CLASS in HIR.  Three reference forms:
//   Simple(name)  — a SCOPE reference: a dict PARAM (`__ring_T_Eq`, from
//                   trait_bound_param_name) or a dict LOCAL synthesised by the
//                   dict-lowering pass (`__ring_dictlocal_N`).  Borrow — the
//                   referenced binding owns the dict.
//   Static(name)  — a MODULE-LEVEL STATIC dict singleton reference (borrow):
//                   either a plain dict (`__Type_Trait` impl dict / builtin
//                   primitive dict) or a fully-static wrapped INSTANCE
//                   (dict_instance_name).  Singletons live for the program
//                   lifetime — never Clone'd, never Drop'ed, never owned.
//                   Produced by infer (plain) / dict_lower (instances).
//   Wrapped{..}   — the infer-side RESOLUTION form for a parameterized type's
//                   dict (base dict + inner dicts).  dict_lower rewrites every
//                   use site: all-static → Static(instance); any dynamic inner
//                   → a local `let __ring_dictlocal_N = HExpr::DictConstruct`
//                   + Simple(local).  After dict_lower, Wrapped survives in
//                   BinOp eq/ord_dispatch extra_dicts and in dynamic derived
//                   FieldAction evidence, whose synthetic methods construct
//                   and reclaim the wrapper directly.
pub enum DictRef {
    Simple(Str),
    Wrapped { dict: Str, trait_name: Str, inner_dicts: List<DictRef> },
    Static(Str)
}

// B-104 D4: a module-level static dict singleton definition (HProgram.static_dicts).
//   inner == []  — a PLAIN static dict (impl dict or builtin primitive dict).
//                  Its definition already exists (ring_dict_init_* / runtime
//                  builtin synthesis); the entry records the module's
//                  static-dict footprint and codegen memoises the named
//                  singleton on first use.
//                  trait_name may be "" (not recoverable from the name alone —
//                  backends do not need it for plain dicts).
//   inner != [] — a fully-static WRAPPED INSTANCE: base_dict's trait methods
//                  partially applied with the inner singletons.  Codegen emits
//                  ONE module-level definition (lazy memoised getter) and use
//                  sites borrow it via DictRef::Static.
pub struct HDictDef {
    pub name: Str,
    pub base_dict: Str,
    pub trait_name: Str,
    pub inner: List<Str>
}

// Naming convention for a fully-static wrapped dict instance (cross-stage
// contract: dict_lower mints it, codegen defines/references it).  `$` is
// legal in LLVM symbols (and JS identifiers in dist/), and cannot appear in user type
// names, so the encoding is collision-free and deterministic.
pub fn dict_instance_name(base_dict: Str, inner: List<Str>) -> Str {
    if inner.len() == 0 {
        base_dict
    } else {
        "${base_dict}$${inner.join("$")}"
    }
}

pub enum TraitDispatch {
    Builtin,
    Direct { dict: Str, extra_dicts: List<DictRef> },
    Dict { param: Str },
    // Tuple equality is structural, but every element still follows the
    // ordinary Eq resolver (builtin, direct impl, or an in-scope dictionary).
    // Keeping that resolved evidence in HIR makes both backends consumers of
    // one authoritative plan instead of re-deriving trait rules in codegen.
    Tuple { element_types: List<Type>, elements: List<TraitDispatch> }
}

pub struct DictDispatchInfo {
    pub dict_param: Str,
    pub method: Str
}

pub struct HStructFieldInit {
    pub name: Str,
    pub value: HExpr
}

// Exact lexical identities introduced by a pattern. The AST Pattern remains
// the source-shape description used by exhaustiveness and backend tests; this
// parallel list is the authoritative binding transport for body Ident nodes.
pub struct HPatternBinding {
    pub name: Str,
    pub def_id: Int,
    pub ty: Type
}

// Exact outer lexical binding referenced from a nested callable body. The
// caller supplies the candidate DefId set from its live lexical slot table;
// therefore this transport never promotes a same-spelled local/module value
// into a capture and never needs a backend name lookup.
pub struct HFreeBinding {
    pub name: Str,
    pub def_id: Int,
    pub ty: Type,
    pub span: Span
}

pub struct HMatchArm {
    pub pattern: Pattern,
    pub bindings: List<HPatternBinding>,
    pub guard: HExpr?,
    pub body: HExpr,
    pub span: Span
}

pub struct HEffectHandler {
    pub effect_name: Str,
    pub op_name: Str,
    // Authoritative builtin identity, resolved from EffectDef.built_in_kind.
    // User-defined effects may intentionally reuse the public `fail.raise`
    // spelling without acquiring the builtin abort/longjmp semantics.
    pub is_abortive: Bool,
    pub params: List<HParam>,
    pub resume_binding: HPatternBinding?,
    pub body: HExpr
}

pub enum HStringInterpPart {
    Literal(Str),
    Expression(HExpr)
}

// Exact checker provenance for value bindings whose source-level type alone
// cannot determine how an identifier must be evaluated. LocalBorrow is the
// fail-closed default when a DefId has no explicit registration provenance.
pub enum ValueBindingKind {
    DirectCallable,
    // Extern/builtin direct ABI accepts no Ring trait-dictionary parameters,
    // even when its type scheme carries bounds for static checking.
    ExternCallable,
    ConstGetter,
    LocalBorrow
}

pub enum HExpr {
    IntLit { value: Int, ty: Type, effects: EffectRow, span: Span },
    FloatLit { value: Float, ty: Type, effects: EffectRow, span: Span },
    StrLit { value: Str, ty: Type, effects: EffectRow, span: Span },
    BoolLit { value: Bool, ty: Type, effects: EffectRow, span: Span },
    Ident { name: Str, resolved_name: Str?, def_id: Int?, dict_closure_dicts: List<DictRef>?, ty: Type, effects: EffectRow, span: Span },
    BinOp { op: BinOp, left: HExpr, right: HExpr, eq_dispatch: TraitDispatch?, ord_dispatch: TraitDispatch?, ty: Type, effects: EffectRow, span: Span },
    UnaryOp { op: UnaryOp, operand: HExpr, ty: Type, effects: EffectRow, span: Span },
    // Exact callable identity selected by inference. For a direct/lambda call
    // this is the declaration DefId; for a function-value call it is the local
    // callable slot DefId. Method and dictionary dispatch store the selected
    // impl/trait-method DefId here rather than recovering it from spelling.
    // A callable-valued result receives its own checker-minted static identity.
    // This is distinct from `callee_def_id`: the returned closure's parameter
    // contract is not the contract of the function that produced it.
    Call { callee: HExpr, callee_def_id: Int?, callable_result_def_id: Int?, args: List<HExpr>, type_args: List<Type>, resolved_dicts: List<DictRef>, dict_dispatch: DictDispatchInfo?, ty: Type, effects: EffectRow, span: Span },
    FieldAccess { receiver: HExpr, field: Str, ty: Type, effects: EffectRow, span: Span },
    StructLit { name: Str, type_args: List<Type>, fields: List<HStructFieldInit>, spread: HExpr?, ty: Type, effects: EffectRow, span: Span },
    NamedVariantConstruct { enum_name: Str, variant_name: Str, fields: List<HStructFieldInit>, spread: HExpr?, ty: Type, effects: EffectRow, span: Span },
    MatchExpr { scrutinee: HExpr, arms: List<HMatchArm>, ty: Type, effects: EffectRow, span: Span },
    Block { stmts: List<HStmt>, tail: HExpr?, ty: Type, effects: EffectRow, span: Span },
    IfExpr { condition: HExpr, then_branch: HExpr, else_branch: HExpr?, ty: Type, effects: EffectRow, span: Span },
    StringInterp { parts: List<HStringInterpPart>, ty: Type, effects: EffectRow, span: Span },
    TryCatch { body: HExpr, arms: List<HMatchArm>, ty: Type, effects: EffectRow, span: Span },
    HandleExpr { body: HExpr, handlers: List<HEffectHandler>, ty: Type, effects: EffectRow, span: Span },
    // Lambdas are callable solver nodes, not anonymous type-only values. The
    // checker allocates this deterministic local DefId before body inference.
    Lambda { def_id: Int, params: List<HParam>, return_type: Type, body: HExpr, ty: Type, effects: EffectRow, span: Span },
    EffectOp { effect_name: Str, op_name: Str, is_abortive: Bool, args: List<HExpr>, ty: Type, effects: EffectRow, span: Span },
    RangeExpr { start: HExpr, end: HExpr, inclusive: Bool, ty: Type, effects: EffectRow, span: Span },
    ListLit { elements: List<HExpr>, ty: Type, effects: EffectRow, span: Span },
    TupleLit { elements: List<HExpr>, ty: Type, effects: EffectRow, span: Span },
    IndexExpr { receiver: HExpr, index: HExpr, ty: Type, effects: EffectRow, span: Span },
    // B-104 D4 (#151): LOCAL construction of a DYNAMIC wrapped dict (at least
    // one inner is a dict param / dict local — unknowable at module scope).
    // Synthesised by dict_lower as the init of a `let __ring_dictlocal_N = …`
    // immediately above the consuming call; the binding is FRESH-OWNED and is
    // reclaimed by the ordinary Perceus scope-end drop (D1/D2 coverage).
    // `inner` entries are Simple (param/local borrow) or Static (singleton
    // borrow) — never Wrapped (dict_lower flattens nested dynamics into their
    // own locals first).  ty is TupleType{[]} (a dict IS a tuple of method
    // closures); effects are pure.
    DictConstruct { base_dict: Str, trait_name: Str, inner: List<DictRef>, ty: Type, effects: EffectRow, span: Span },
    // B-098: value-level clone inserted by the Perceus L1 borrow-inference pass
    // (clone-all-escape).  Wraps an escaping value that
    // already has an independent owner (Ident binding / FieldAccess / IndexExpr /
    // container read result) so the escape gets its own owned reference rather
    // than aliasing the still-live source.  codegen lowers `Clone{inner}` to
    // eval inner -> ring_dup(result) -> result (ty/effects/span taken from inner).
    Clone { inner: HExpr, ty: Type, effects: EffectRow, span: Span },
    // Exact full-binding ownership transfer. The checker emits Take only for a
    // cleanup-visible local/parameter DefId; partial projections are rejected.
    // Native lowering materialises the old slot value, clears that exact slot
    // to null, then returns the materialised value to the consuming edge.
    Take { name: Str, source_def_id: Int, ty: Type, effects: EffectRow, span: Span },
    ReturnExpr { value: HExpr?, ty: Type, effects: EffectRow, span: Span },
    UnsafeBlock { body: HExpr, ty: Type, effects: EffectRow, span: Span }
}

pub struct HForInDestructure {
    pub name: Str,
    pub def_id: Int?
}

pub struct HLetDestructureBinding {
    pub name: Str,
    pub def_id: Int?,
    pub ty: Type
}

pub enum HStmt {
    Let { name: Str, name_span: Span, def_id: Int?, ty: Type, init: HExpr, span: Span },
    Var { name: Str, name_span: Span, def_id: Int?, ty: Type, init: HExpr, span: Span },
    Assign { target: HExpr, value: HExpr, span: Span },
    ExprStmt { expr: HExpr, span: Span },
    Return { value: HExpr?, span: Span },
    While { condition: HExpr, body: HExpr, span: Span },
    ForIn { binding: Str, binding_span: Span, def_id: Int?, destructure: List<HForInDestructure>?, iterable: HExpr, body: HExpr, iterable_type_name: Str?, iter_type_name: Str?, span: Span },
    Break { span: Span },
    Continue { span: Span },
    LetDestructure { pattern: Pattern, bindings: List<HLetDestructureBinding>, init: HExpr, span: Span },
    IfLet { pattern: Pattern, bindings: List<HPatternBinding>, expr: HExpr, then_block: HExpr, else_block: HExpr?, span: Span },

    // Perceus RC: explicit reference counting op inserted by the RC pass.
    Drop { name: Str, def_id: Int, ty: Type, span: Span }
}

pub struct HStructField {
    pub name: Str,
    pub ty: Type,
    pub is_pub: Bool
}

pub struct HEnumVariant {
    pub name: Str,
    pub fields: List<Type>,
    pub field_names: List<Str>?
}

pub struct HEffectOp {
    pub name: Str,
    pub params: List<HParam>,
    pub return_type: Type,
    pub has_default: Bool,
    pub default_body: HExpr?
}

pub struct HTraitMethod {
    pub name: Str,
    pub def_id: Int,
    pub params: List<HParam>,
    pub return_type: Type,
    pub effects: EffectRow,
    pub has_default: Bool,
    pub body: HExpr?
}

pub struct TraitBound {
    pub type_param: Str,
    pub trait_name: Str
}

pub struct HAssocType {
    pub name: Str,
    pub bounds: List<Str>,
    pub concrete: Type?
}

pub struct HSigMember {
    pub name: Str,
    pub fn_type: Type,
    pub span: Span
}

pub enum HDecl {
    Fn { name: Str, def_id: Int?, type_params: List<TypeParam>, params: List<HParam>, return_type: Type, effects: EffectRow, body: HExpr, is_pub: Bool, trait_bounds: List<TraitBound>, span: Span },
    Struct { name: Str, type_params: List<TypeParam>, fields: List<HStructField>, is_pub: Bool, span: Span },
    Enum { name: Str, type_params: List<TypeParam>, variants: List<HEnumVariant>, is_pub: Bool, span: Span },
    Impl { target_type: Str, type_params: List<TypeParam>, trait_name: Str?, methods: List<HDecl>, assoc_types: List<HAssocType>, span: Span },
    Effect { name: Str, type_params: List<TypeParam>, ops: List<HEffectOp>, is_pub: Bool, span: Span },
    Test { description: Str, body: HExpr, span: Span },
    Trait { name: Str, type_params: List<TypeParam>, methods: List<HTraitMethod>, supertraits: List<Str>, assoc_types: List<HAssocType>, is_pub: Bool, span: Span },
    ExternFn { name: Str, abi_name: Str, def_id: Int?, type_params: List<TypeParam>, params: List<HParam>, return_type: Type, effects: EffectRow, is_pub: Bool, span: Span },
    ExternType { name: Str, type_params: List<TypeParam>, is_pub: Bool, span: Span },
    TypeAlias { name: Str, ty: Type, is_pub: Bool, span: Span },
    Const { name: Str, def_id: Int?, ty: Type, init: HExpr, is_pub: Bool, span: Span },
    ModBlock { name: Str, decls: List<HDecl>, is_pub: Bool, span: Span },
    Sig { name: Str, members: List<HSigMember>, is_pub: Bool, span: Span }
}

pub enum FieldAction {
    // Eq/Clone/Ord/Debug may use primitive identity actions.  Hash derivation
    // intentionally uses Call/Tuple only so every leaf is backed by Hash
    // evidence and no backend can fall back to an address-derived value.
    Identity,
    FloatIdentity,
    BoolIdentity,
    // The callee's base dict stays name-addressed; each trailing type-param
    // evidence value is a full DictRef so nested parameterized fields retain
    // every wrapper layer until dict_lower/codegen.
    Call { dict_name: Str, extra_dicts: List<DictRef> },
    Tuple { element_actions: List<FieldAction> },
    FnLiteral
}

pub struct DerivedField {
    pub name: Str,
    pub positional_index: Int?,
    pub action: FieldAction
}

pub struct DerivedVariant {
    pub name: Str,
    // Stable declaration-order discriminator mixed into derived Hash before
    // payload fields.  This is a front-end contract, not a backend type/name
    // hash or allocation-dependent value.
    pub discriminator: Int,
    pub fields: List<DerivedField>,
    pub has_named_fields: Bool
}

pub enum TypeKind { StructKind, EnumKind }

// Shared initial state for C/LLVM structural Hash emission.  Kept within the
// signed 63-bit Ring Int range so boxing/unboxing is identical in both
// backends.
pub const DERIVED_HASH_SEED: Int = 1469598103934665603

pub struct DerivedImpl {
    pub type_name: Str,
    pub trait_name: Str,
    pub type_params: List<Str>,
    pub bounds: List<TraitBound>,
    pub type_kind: TypeKind,
    pub struct_fields: List<DerivedField>?,
    pub enum_variants: List<DerivedVariant>?
}

pub struct HProgram {
    pub decls: List<HDecl>,
    pub derived_impls: List<DerivedImpl>,
    pub boxed_vars: Set<Int>,
    // B-104 D4: the module's static dict singleton set (see HDictDef), collected
    // by dict_lower (checker pipeline) in registration order (inners before the
    // wrapped instances that reference them).
    pub static_dicts: List<HDictDef>,
    // B-144: global set of extern type names, collected at checker phase across
    // all modules.  perceus / codegen_c / verify_rc read this instead of
    // re-collecting per-module (which misses use-imported extern types).
    pub extern_type_names: Set<Str>,
    // Shadow descriptors/DefId contracts/provenance and symbolic type shapes.
    pub ownership_metadata: OwnershipMetadata
}

// Every definition site represented in HIR must have one program-unique
// identity. This boundary check makes source/synthetic collisions fail where
// they are introduced instead of letting a later cleanup or backend silently
// select a same-spelled slot. References (Ident/Assign/Take/Drop/Call) are not
// registered here; they are consumers of these definition identities.
pub fn validate_hir_binder_def_ids(program: HProgram) {
    let mut seen: Set<Int> = set_new()
    validate_hir_decls(program.decls, seen)
}

fn validate_hir_binder(mut seen: Set<Int>, def_id: Int, label: Str) {
    if seen.contains(def_id) {
        panic("HIR binder DefId collision ${def_id} at ${label}")
    }
    let recorded_def_id = def_id
    seen.insert(recorded_def_id)
}

fn validate_hir_optional_binder(
    mut seen: Set<Int>, def_id: Int?, label: Str
) {
    match def_id {
        some(id) => validate_hir_binder(seen, id, label),
        none => {},
    }
}

fn validate_hir_synthetic_binder(name: Str, def_id: Int?) {
    if name.starts_with("__ring_dictlocal_") ||
       name.starts_with("__anf_") ||
       name.starts_with("__rc_scope_") ||
       name.starts_with("__ownership_take_") {
        match def_id {
            some(_) => {},
            none => panic(
                "HIR synthetic binder '${name}' has no exact DefId"),
        }
    }
}

fn validate_hir_params(
    params: List<HParam>, mut seen: Set<Int>, label: Str
) {
    for param in params {
        validate_hir_optional_binder(
            seen, param.def_id, "${label} parameter '${param.name}'")
    }
}

fn collect_hir_pattern_names(pattern: Pattern, mut names: Set<Str>) {
    match pattern {
        Pattern::Binding { name, .. } => {
            // `_` is the parser's binding-shaped wildcard spelling. Inference
            // intentionally allocates no DefId/HPatternBinding for it, so the
            // HIR validator must not require exact metadata for that non-slot.
            if name != "_" {
                let owned_name = name
                names.insert(owned_name)
            }
        },
        Pattern::Constructor { fields, .. } => {
            for field in fields { collect_hir_pattern_names(field, names) }
        },
        Pattern::NamedConstructor { fields, .. } => {
            for field in fields {
                collect_hir_pattern_names(field.pattern, names)
            }
        },
        Pattern::TuplePattern { elements, .. } => {
            for element in elements {
                collect_hir_pattern_names(element, names)
            }
        },
        Pattern::OrPattern { patterns, .. } => {
            for alternative in patterns {
                collect_hir_pattern_names(alternative, names)
            }
        },
        Pattern::Wildcard { .. } | Pattern::Literal { .. } => {},
    }
}

fn validate_hir_pattern_bindings(
    pattern: Pattern, bindings: List<HPatternBinding>,
    mut seen: Set<Int>, label: Str
) {
    let mut pattern_names: Set<Str> = set_new()
    collect_hir_pattern_names(pattern, pattern_names)
    let mut metadata_names: Set<Str> = set_new()
    for binding in bindings {
        if !pattern_names.contains(binding.name) {
            panic("HIR ${label} metadata has non-pattern binding '${binding.name}'")
        }
        if metadata_names.contains(binding.name) {
            panic("HIR ${label} repeats binding metadata for '${binding.name}'")
        }
        metadata_names.insert(binding.name)
        validate_hir_binder(
            seen, binding.def_id, "${label} binding '${binding.name}'")
    }
    for name in pattern_names {
        if !metadata_names.contains(name) {
            panic("HIR ${label} binding '${name}' has no exact metadata")
        }
    }
}

fn validate_hir_match_arm(
    arm: HMatchArm, mut seen: Set<Int>, label: Str
) {
    validate_hir_pattern_bindings(
        arm.pattern, arm.bindings, seen, label)
    match arm.guard {
        some(guard) => validate_hir_expr(guard, seen),
        none => {},
    }
    validate_hir_expr(arm.body, seen)
}

fn validate_hir_handler(handler: HEffectHandler, mut seen: Set<Int>) {
    let label = "handler '${handler.effect_name}.${handler.op_name}'"
    validate_hir_params(handler.params, seen, label)
    match handler.resume_binding {
        some(binding) => validate_hir_binder(
            seen, binding.def_id,
            "${label} resume binding '${binding.name}'"),
        none => {},
    }
    validate_hir_expr(handler.body, seen)
}

fn validate_hir_stmt(stmt: HStmt, mut seen: Set<Int>) {
    match stmt {
        HStmt::Let { name, def_id, init, .. } => {
            validate_hir_synthetic_binder(name, def_id)
            validate_hir_optional_binder(
                seen, def_id, "let binding '${name}'")
            validate_hir_expr(init, seen)
        },
        HStmt::Var { name, def_id, init, .. } => {
            validate_hir_synthetic_binder(name, def_id)
            validate_hir_optional_binder(
                seen, def_id, "var binding '${name}'")
            validate_hir_expr(init, seen)
        },
        HStmt::Assign { target, value, .. } => {
            validate_hir_expr(target, seen)
            validate_hir_expr(value, seen)
        },
        HStmt::ExprStmt { expr, .. } => validate_hir_expr(expr, seen),
        HStmt::Return { value, .. } => match value {
            some(expr) => validate_hir_expr(expr, seen),
            none => {},
        },
        HStmt::While { condition, body, .. } => {
            validate_hir_expr(condition, seen)
            validate_hir_expr(body, seen)
        },
        HStmt::ForIn { binding, def_id, destructure,
                       iterable, body, .. } => {
            validate_hir_optional_binder(
                seen, def_id, "for binding '${binding}'")
            match destructure {
                some(bindings) => {
                    for binding_ in bindings {
                        validate_hir_optional_binder(seen, binding_.def_id,
                            "for destructure binding '${binding_.name}'")
                    }
                },
                none => {},
            }
            validate_hir_expr(iterable, seen)
            validate_hir_expr(body, seen)
        },
        HStmt::LetDestructure { bindings, init, .. } => {
            for binding in bindings {
                validate_hir_optional_binder(seen, binding.def_id,
                    "let destructure binding '${binding.name}'")
            }
            validate_hir_expr(init, seen)
        },
        HStmt::IfLet { pattern, bindings, expr,
                       then_block, else_block, .. } => {
            validate_hir_expr(expr, seen)
            validate_hir_pattern_bindings(
                pattern, bindings, seen, "if-let pattern")
            validate_hir_expr(then_block, seen)
            match else_block {
                some(block) => validate_hir_expr(block, seen),
                none => {},
            }
        },
        HStmt::Break { .. } | HStmt::Continue { .. } |
        HStmt::Drop { .. } => {},
    }
}

fn validate_hir_expr(expr: HExpr, mut seen: Set<Int>) {
    match expr {
        HExpr::BinOp { left, right, .. } => {
            validate_hir_expr(left, seen)
            validate_hir_expr(right, seen)
        },
        HExpr::UnaryOp { operand, .. } => validate_hir_expr(operand, seen),
        HExpr::Call { callee, callable_result_def_id, args, .. } => {
            match callable_result_def_id {
                some(def_id) => validate_hir_binder(
                    seen, def_id, "callable-valued call result"),
                none => {}
            }
            validate_hir_expr(callee, seen)
            for arg in args { validate_hir_expr(arg, seen) }
        },
        HExpr::FieldAccess { receiver, .. } =>
            validate_hir_expr(receiver, seen),
        HExpr::StructLit { fields, spread, .. } => {
            for field in fields { validate_hir_expr(field.value, seen) }
            match spread {
                some(value) => validate_hir_expr(value, seen),
                none => {},
            }
        },
        HExpr::NamedVariantConstruct { fields, spread, .. } => {
            for field in fields { validate_hir_expr(field.value, seen) }
            match spread {
                some(value) => validate_hir_expr(value, seen),
                none => {},
            }
        },
        HExpr::MatchExpr { scrutinee, arms, .. } => {
            validate_hir_expr(scrutinee, seen)
            for arm in arms {
                validate_hir_match_arm(arm, seen, "match arm")
            }
        },
        HExpr::Block { stmts, tail, .. } => {
            for stmt in stmts { validate_hir_stmt(stmt, seen) }
            match tail {
                some(value) => validate_hir_expr(value, seen),
                none => {},
            }
        },
        HExpr::IfExpr { condition, then_branch, else_branch, .. } => {
            validate_hir_expr(condition, seen)
            validate_hir_expr(then_branch, seen)
            match else_branch {
                some(branch) => validate_hir_expr(branch, seen),
                none => {},
            }
        },
        HExpr::StringInterp { parts, .. } => {
            for part in parts {
                match part {
                    HStringInterpPart::Expression(value) =>
                        validate_hir_expr(value, seen),
                    HStringInterpPart::Literal(_) => {},
                }
            }
        },
        HExpr::TryCatch { body, arms, .. } => {
            validate_hir_expr(body, seen)
            for arm in arms {
                validate_hir_match_arm(arm, seen, "catch arm")
            }
        },
        HExpr::HandleExpr { body, handlers, .. } => {
            validate_hir_expr(body, seen)
            for handler in handlers { validate_hir_handler(handler, seen) }
        },
        HExpr::Lambda { def_id, params, body, .. } => {
            validate_hir_binder(seen, def_id, "lambda")
            validate_hir_params(params, seen, "lambda")
            validate_hir_expr(body, seen)
        },
        HExpr::EffectOp { args, .. } => {
            for arg in args { validate_hir_expr(arg, seen) }
        },
        HExpr::RangeExpr { start, end, .. } => {
            validate_hir_expr(start, seen)
            validate_hir_expr(end, seen)
        },
        HExpr::ListLit { elements, .. } => {
            for element in elements { validate_hir_expr(element, seen) }
        },
        HExpr::TupleLit { elements, .. } => {
            for element in elements { validate_hir_expr(element, seen) }
        },
        HExpr::IndexExpr { receiver, index, .. } => {
            validate_hir_expr(receiver, seen)
            validate_hir_expr(index, seen)
        },
        HExpr::Clone { inner, .. } => validate_hir_expr(inner, seen),
        HExpr::ReturnExpr { value, .. } => match value {
            some(returned) => validate_hir_expr(returned, seen),
            none => {},
        },
        HExpr::UnsafeBlock { body, .. } => validate_hir_expr(body, seen),
        HExpr::IntLit { .. } | HExpr::FloatLit { .. } |
        HExpr::StrLit { .. } | HExpr::BoolLit { .. } |
        HExpr::Ident { .. } | HExpr::DictConstruct { .. } |
        HExpr::Take { .. } => {},
    }
}

fn validate_hir_decls(decls: List<HDecl>, mut seen: Set<Int>) {
    for decl in decls {
        match decl {
            HDecl::Fn { name, def_id, params, body, .. } => {
                validate_hir_optional_binder(
                    seen, def_id, "function '${name}'")
                validate_hir_params(params, seen, "function '${name}'")
                validate_hir_expr(body, seen)
            },
            HDecl::Impl { methods, .. } =>
                validate_hir_decls(methods, seen),
            HDecl::Test { body, .. } => validate_hir_expr(body, seen),
            HDecl::Effect { name, ops, .. } => {
                for op in ops {
                    let label = "effect operation '${name}.${op.name}'"
                    validate_hir_params(op.params, seen, label)
                    match op.default_body {
                        some(body) => validate_hir_expr(body, seen),
                        none => {},
                    }
                }
            },
            HDecl::Trait { name, methods, .. } => {
                for method in methods {
                    let label = "trait method '${name}.${method.name}'"
                    validate_hir_binder(seen, method.def_id, label)
                    validate_hir_params(method.params, seen, label)
                    match method.body {
                        some(body) => validate_hir_expr(body, seen),
                        none => {},
                    }
                }
            },
            HDecl::ExternFn { name, def_id, params, .. } => {
                validate_hir_optional_binder(
                    seen, def_id, "extern function '${name}'")
                validate_hir_params(
                    params, seen, "extern function '${name}'")
            },
            HDecl::Const { name, def_id, init, .. } => {
                validate_hir_optional_binder(
                    seen, def_id, "const '${name}'")
                validate_hir_expr(init, seen)
            },
            HDecl::ModBlock { decls: inner, .. } =>
                validate_hir_decls(inner, seen),
            HDecl::Struct { .. } | HDecl::Enum { .. } |
            HDecl::ExternType { .. } | HDecl::TypeAlias { .. } |
            HDecl::Sig { .. } => {},
        }
    }
}

// B-102 R-clean (2026-06-07) — the A1 Type-DAG never-drop special case
// (is_type_dag_type_name / is_type_dag_type) is REMOVED.  Type and the
// structs/enums reachable from it now participate in ordinary Perceus RC:
// codegen_c generates a recursive ring_drop_T for them, perceus Clone-wraps
// every escaping owner-bearing Type substructure (so the shallow ring_dup is
// balanced by the deep recursive drop), and the working-set is reclaimed at
// scope end.  See design.md §7.11 "Type-DAG 内存回收：pure Perceus RC".

// Codegen naming conventions
pub fn variant_ctor_name(enum_name: Str, variant_name: Str) -> Str {
    "${enum_name}_${variant_name}"
}

// A fieldless user enum variant is represented by inference as an Ident whose
// resolved_name comes from exact DefId-keyed constructor provenance. Unlike an
// ordinary Ident read, evaluating that node CALLS the constructor and therefore
// produces a fresh owned enum box. Keep this cross-stage ownership fact in one
// place so Perceus and the post-RC verifier cannot disagree.
pub fn is_nullary_variant_ctor_ident(expr: HExpr) -> Bool {
    match expr {
        HExpr::Ident { resolved_name, ty, .. } => match resolved_name {
            some(rn) => match ty {
                Type::EnumType { name, .. } =>
                    // Option::none is the sole fieldless constructor whose
                    // codegen result is a borrowed never-drop runtime singleton
                    // rather than a fresh enum allocation. It still carries
                    // resolved_name so codegen can select ring_Option_none.
                    rn != variant_ctor_name(BUILTIN_OPTION, "none") &&
                    rn.starts_with(variant_ctor_name(name, "")),
                _ => false,
            },
            none => false,
        },
        _ => false,
    }
}

// An Ident carrying some(dicts) is not a borrow read: codegen allocates a fresh
// direct-ABI wrapper closure (some([]) is the explicit zero-bound marker).
// Control-flow wrappers preserve that fact only when every value-producing path
// yields the same fresh callable. Perceus and verify_rc share this predicate.
pub fn is_materialized_fn_value(expr: HExpr) -> Bool {
    match expr {
        HExpr::Ident { dict_closure_dicts, .. } => dict_closure_dicts.is_some(),
        HExpr::Block { tail, .. } => match tail {
            some(value) => is_materialized_fn_value(value),
            none => false
        },
        HExpr::IfExpr { then_branch, else_branch, .. } => match else_branch {
            some(value) =>
                is_materialized_fn_value(then_branch) &&
                is_materialized_fn_value(value),
            none => false
        },
        HExpr::MatchExpr { arms, .. } => {
            let mut all = arms.len() > 0
            for arm in arms {
                if is_materialized_fn_value(arm.body) == false { all = false }
            }
            all
        },
        _ => false
    }
}

// A pattern can match without running its dependent body when its guard
// diverges. Match and Catch share this exact boundary in ownership, capture
// discovery, RC verification, and backend pruning.
pub fn hmatch_arm_body_is_reachable(arm: HMatchArm) -> Bool {
    match arm.guard {
        some(guard) => expr_has_reachable_value(guard),
        none => true
    }
}

// Whether evaluating an expression can reach a normal value-producing edge.
// This is deliberately structural as well as type-aware: a Block can retain
// its ordinary result type even when an earlier ReturnExpr/Never statement
// makes its syntactic tail dead.  Move-edge validation in ownership, Perceus,
// and verify_rc must all agree on exactly those reachable value paths.
pub fn expr_has_reachable_value(expr: HExpr) -> Bool {
    match hexpr_type(expr) {
        Type::NeverType => return false,
        _ => {}
    }
    match expr {
        HExpr::BinOp { left, right, .. } =>
            expr_has_reachable_value(left) &&
            expr_has_reachable_value(right),
        HExpr::UnaryOp { operand, .. } =>
            expr_has_reachable_value(operand),
        HExpr::Call { callee, args, .. } => {
            if !expr_has_reachable_value(callee) { return false }
            for arg in args {
                if !expr_has_reachable_value(arg) { return false }
            }
            true
        },
        HExpr::FieldAccess { receiver, .. } =>
            expr_has_reachable_value(receiver),
        // Keep the two constructor forms separate for bootstrap: the old C
        // backend does not reliably materialize binders shared by an
        // OR-pattern before the arm body reads them.
        HExpr::StructLit { fields, spread, .. } => {
            for field in fields {
                if !expr_has_reachable_value(field.value) { return false }
            }
            match spread {
                some(source) => expr_has_reachable_value(source),
                none => true
            }
        },
        HExpr::NamedVariantConstruct { fields, spread, .. } => {
            for field in fields {
                if !expr_has_reachable_value(field.value) { return false }
            }
            match spread {
                some(source) => expr_has_reachable_value(source),
                none => true
            }
        },
        HExpr::MatchExpr { scrutinee, arms, .. } => {
            if !expr_has_reachable_value(scrutinee) { return false }
            for arm in arms {
                if hmatch_arm_body_is_reachable(arm) &&
                   expr_has_reachable_value(arm.body) {
                    return true
                }
            }
            false
        },
        HExpr::Block { stmts, tail, .. } => {
            for stmt in stmts {
                if !stmt_reaches_next(stmt) { return false }
            }
            match tail {
                some(value) => expr_has_reachable_value(value),
                none => true
            }
        },
        HExpr::IfExpr { condition, then_branch, else_branch, .. } => {
            if !expr_has_reachable_value(condition) { return false }
            if expr_has_reachable_value(then_branch) { return true }
            match else_branch {
                some(branch) => expr_has_reachable_value(branch),
                none => true
            }
        },
        HExpr::StringInterp { parts, .. } => {
            for part in parts {
                match part {
                    HStringInterpPart::Expression(value) =>
                        if !expr_has_reachable_value(value) { return false },
                    HStringInterpPart::Literal(_) => {}
                }
            }
            true
        },
        HExpr::TryCatch { body, arms, .. } => {
            if expr_has_reachable_value(body) { return true }
            for arm in arms {
                if hmatch_arm_body_is_reachable(arm) &&
                   expr_has_reachable_value(arm.body) {
                    return true
                }
            }
            false
        },
        HExpr::HandleExpr { body, handlers, .. } => {
            if expr_has_reachable_value(body) { return true }
            for handler in handlers {
                if handler.is_abortive &&
                   expr_has_reachable_value(handler.body) {
                    return true
                }
            }
            false
        },
        HExpr::EffectOp { args, .. } => {
            for arg in args {
                if !expr_has_reachable_value(arg) { return false }
            }
            true
        },
        HExpr::RangeExpr { start, end, .. } =>
            expr_has_reachable_value(start) &&
            expr_has_reachable_value(end),
        HExpr::ListLit { elements, .. } => {
            for element in elements {
                if !expr_has_reachable_value(element) { return false }
            }
            true
        },
        HExpr::TupleLit { elements, .. } => {
            for element in elements {
                if !expr_has_reachable_value(element) { return false }
            }
            true
        },
        HExpr::IndexExpr { receiver, index, .. } =>
            expr_has_reachable_value(receiver) &&
            expr_has_reachable_value(index),
        HExpr::Clone { inner, .. } => expr_has_reachable_value(inner),
        HExpr::ReturnExpr { .. } => false,
        HExpr::UnsafeBlock { body, .. } => expr_has_reachable_value(body),
        HExpr::Take { .. } | HExpr::Ident { .. } |
        HExpr::DictConstruct { .. } | HExpr::Lambda { .. } |
        HExpr::IntLit { .. } | HExpr::FloatLit { .. } |
        HExpr::StrLit { .. } | HExpr::BoolLit { .. } => true
    }
}

// Option::none is the other non-binding constructor Ident. Unlike ordinary
// nullary variants it evaluates to the immortal runtime singleton, so it is
// borrowed rather than fresh; either way ownership planning must never try to
// invalidate its global constructor DefId as though it were a closure capture.
pub fn is_option_none_ctor_ident(expr: HExpr) -> Bool {
    match expr {
        HExpr::Ident { resolved_name, ty, .. } => match resolved_name {
            some(rn) => match ty {
                Type::EnumType { name, .. } =>
                    name == BUILTIN_OPTION &&
                    rn == variant_ctor_name(BUILTIN_OPTION, "none"),
                _ => false
            },
            none => false
        },
        _ => false
    }
}

pub fn stmt_reaches_next(stmt: HStmt) -> Bool {
    match stmt {
        HStmt::Return { .. } | HStmt::Break { .. } |
        HStmt::Continue { .. } => false,
        HStmt::Let { init, .. } => expr_has_reachable_value(init),
        HStmt::Var { init, .. } => expr_has_reachable_value(init),
        HStmt::ExprStmt { expr: init, .. } =>
            expr_has_reachable_value(init),
        HStmt::LetDestructure { init, .. } =>
            expr_has_reachable_value(init),
        HStmt::Assign { target, value, .. } =>
            expr_has_reachable_value(target) &&
            expr_has_reachable_value(value),
        HStmt::While { condition, .. } =>
            expr_has_reachable_value(condition),
        HStmt::ForIn { iterable, .. } =>
            expr_has_reachable_value(iterable),
        HStmt::IfLet { expr, then_block, else_block, .. } => {
            if !expr_has_reachable_value(expr) { return false }
            if expr_has_reachable_value(then_block) { return true }
            match else_block {
                some(branch) => expr_has_reachable_value(branch),
                // Pattern miss is a normal fallthrough path.
                none => true
            }
        },
        HStmt::Drop { .. } => true
    }
}

// Detect a complete binding that reaches a Move edge without a Take.  The
// post-RC verifier passes through_clone=true so an illicit Clone cannot hide
// the missing Take; the planner and Perceus use false before Clone insertion.
pub fn move_edge_has_reachable_bare_binding(
    expr: HExpr, through_clone: Bool
) -> Bool {
    match hexpr_type(expr) {
        Type::UnitType | Type::NeverType |
        Type::EffectRowType { .. } | Type::ErrorType => return false,
        _ => {}
    }
    if !expr_has_reachable_value(expr) { return false }
    match expr {
        HExpr::Take { .. } => false,
        HExpr::Ident { .. } =>
            !is_nullary_variant_ctor_ident(expr) &&
            !is_option_none_ctor_ident(expr) &&
            !is_materialized_fn_value(expr),
        HExpr::Clone { inner, .. } =>
            through_clone && move_edge_has_reachable_bare_binding(
                inner, through_clone),
        HExpr::Block { tail, .. } => match tail {
            some(value) => move_edge_has_reachable_bare_binding(
                value, through_clone),
            none => false
        },
        HExpr::IfExpr { then_branch, else_branch, .. } => {
            if move_edge_has_reachable_bare_binding(
                    then_branch, through_clone) {
                return true
            }
            match else_branch {
                some(value) => move_edge_has_reachable_bare_binding(
                    value, through_clone),
                none => false
            }
        },
        HExpr::MatchExpr { arms, .. } => {
            for arm in arms {
                if hmatch_arm_body_is_reachable(arm) &&
                   move_edge_has_reachable_bare_binding(
                        arm.body, through_clone) {
                    return true
                }
            }
            false
        },
        HExpr::TryCatch { body, arms, .. } => {
            if move_edge_has_reachable_bare_binding(body, through_clone) {
                return true
            }
            for arm in arms {
                if hmatch_arm_body_is_reachable(arm) &&
                   move_edge_has_reachable_bare_binding(
                        arm.body, through_clone) {
                    return true
                }
            }
            false
        },
        HExpr::HandleExpr { body, handlers, .. } => {
            if move_edge_has_reachable_bare_binding(body, through_clone) {
                return true
            }
            for handler in handlers {
                if handler.is_abortive &&
                   move_edge_has_reachable_bare_binding(
                       handler.body, through_clone) {
                    return true
                }
            }
            false
        },
        HExpr::UnsafeBlock { body, .. } =>
            move_edge_has_reachable_bare_binding(body, through_clone),
        _ => false
    }
}

// Collect references to an exact candidate set of bindings through an entire
// nested callable body. DefIds are program-unique, so a reference is free with
// respect to this callable exactly when it names a candidate outer slot.
// Nested lambdas are traversed deliberately: their construction occurs inside
// this callable and their free values must first be available from this env.
pub fn collect_exact_free_bindings(
    expr: HExpr, candidates: Set<Int>
) -> List<HFreeBinding> {
    let mut seen: Set<Int> = set_new()
    let mut result: List<HFreeBinding> = []
    collect_exact_free_binding_expr(expr, candidates, seen, result)
    result
}

fn push_exact_free_binding(
    candidates: Set<Int>, mut seen: Set<Int>,
    mut result: List<HFreeBinding>,
    name: Str, def_id: Int, ty: Type, span: Span
) {
    if !candidates.contains(def_id) || seen.contains(def_id) { return }
    let seen_def_id = def_id
    seen.insert(seen_def_id)
    let owned_name = name
    let owned_def_id = def_id
    let owned_ty = ty
    let owned_span = span
    result.push(HFreeBinding {
        name: owned_name, def_id: owned_def_id,
        ty: owned_ty, span: owned_span
    })
}

fn collect_exact_free_binding_expr(
    expr: HExpr, candidates: Set<Int>, mut seen: Set<Int>,
    mut result: List<HFreeBinding>
) {
    match expr {
        HExpr::Ident { name, def_id, ty, span, .. } => match def_id {
            some(id) => push_exact_free_binding(
                candidates, seen, result, name, id, ty, span),
            none => {}
        },
        HExpr::Take { name, source_def_id, ty, span, .. } =>
            push_exact_free_binding(
                candidates, seen, result, name, source_def_id, ty, span),
        HExpr::BinOp { left, right, .. } => {
            collect_exact_free_binding_expr(left, candidates, seen, result)
            collect_exact_free_binding_expr(right, candidates, seen, result)
        },
        HExpr::UnaryOp { operand, .. } =>
            collect_exact_free_binding_expr(
                operand, candidates, seen, result),
        HExpr::Call { callee, args, .. } => {
            collect_exact_free_binding_expr(callee, candidates, seen, result)
            for arg in args {
                collect_exact_free_binding_expr(
                    arg, candidates, seen, result)
            }
        },
        HExpr::FieldAccess { receiver, .. } =>
            collect_exact_free_binding_expr(
                receiver, candidates, seen, result),
        HExpr::StructLit { fields, spread, .. } => {
            for field in fields {
                collect_exact_free_binding_expr(
                    field.value, candidates, seen, result)
            }
            match spread {
                some(source) => collect_exact_free_binding_expr(
                    source, candidates, seen, result),
                none => {}
            }
        },
        HExpr::NamedVariantConstruct { fields, spread, .. } => {
            for field in fields {
                collect_exact_free_binding_expr(
                    field.value, candidates, seen, result)
            }
            match spread {
                some(source) => collect_exact_free_binding_expr(
                    source, candidates, seen, result),
                none => {}
            }
        },
        HExpr::MatchExpr { scrutinee, arms, .. } => {
            collect_exact_free_binding_expr(
                scrutinee, candidates, seen, result)
            if expr_has_reachable_value(scrutinee) {
                for arm in arms {
                    let guard_reaches_value =
                        hmatch_arm_body_is_reachable(arm)
                    match arm.guard {
                        some(guard) => collect_exact_free_binding_expr(
                            guard, candidates, seen, result),
                        none => {}
                    }
                    if guard_reaches_value {
                        collect_exact_free_binding_expr(
                            arm.body, candidates, seen, result)
                    }
                }
            }
        },
        HExpr::Block { stmts, tail, .. } => {
            for stmt in stmts {
                collect_exact_free_binding_stmt(
                    stmt, candidates, seen, result)
                // The terminating statement itself may read captures (for
                // example, its returned value), but later statements and the
                // syntactic tail cannot contribute to the closure env.
                if !stmt_reaches_next(stmt) { return }
            }
            match tail {
                some(value) => collect_exact_free_binding_expr(
                    value, candidates, seen, result),
                none => {}
            }
        },
        HExpr::IfExpr { condition, then_branch, else_branch, .. } => {
            collect_exact_free_binding_expr(
                condition, candidates, seen, result)
            if expr_has_reachable_value(condition) {
                collect_exact_free_binding_expr(
                    then_branch, candidates, seen, result)
                match else_branch {
                    some(branch) => collect_exact_free_binding_expr(
                        branch, candidates, seen, result),
                    none => {}
                }
            }
        },
        HExpr::StringInterp { parts, .. } => {
            for part in parts {
                match part {
                    HStringInterpPart::Expression(value) =>
                        collect_exact_free_binding_expr(
                            value, candidates, seen, result),
                    HStringInterpPart::Literal(_) => {}
                }
            }
        },
        HExpr::TryCatch { body, arms, .. } => {
            collect_exact_free_binding_expr(body, candidates, seen, result)
            for arm in arms {
                let guard_reaches_value =
                    hmatch_arm_body_is_reachable(arm)
                match arm.guard {
                    some(guard) => collect_exact_free_binding_expr(
                        guard, candidates, seen, result),
                    none => {}
                }
                if guard_reaches_value {
                    collect_exact_free_binding_expr(
                        arm.body, candidates, seen, result)
                }
            }
        },
        HExpr::HandleExpr { body, handlers, .. } => {
            collect_exact_free_binding_expr(body, candidates, seen, result)
            for handler in handlers {
                collect_exact_free_binding_expr(
                    handler.body, candidates, seen, result)
            }
        },
        HExpr::Lambda { body, .. } =>
            collect_exact_free_binding_expr(body, candidates, seen, result),
        HExpr::UnsafeBlock { body, .. } =>
            collect_exact_free_binding_expr(body, candidates, seen, result),
        HExpr::Clone { inner: body, .. } =>
            collect_exact_free_binding_expr(body, candidates, seen, result),
        HExpr::EffectOp { args, .. } => {
            for arg in args {
                collect_exact_free_binding_expr(
                    arg, candidates, seen, result)
            }
        },
        HExpr::RangeExpr { start, end, .. } => {
            collect_exact_free_binding_expr(start, candidates, seen, result)
            collect_exact_free_binding_expr(end, candidates, seen, result)
        },
        HExpr::ListLit { elements, .. } => {
            for element in elements {
                collect_exact_free_binding_expr(
                    element, candidates, seen, result)
            }
        },
        HExpr::TupleLit { elements, .. } => {
            for element in elements {
                collect_exact_free_binding_expr(
                    element, candidates, seen, result)
            }
        },
        HExpr::IndexExpr { receiver, index, .. } => {
            collect_exact_free_binding_expr(
                receiver, candidates, seen, result)
            collect_exact_free_binding_expr(index, candidates, seen, result)
        },
        HExpr::ReturnExpr { value, .. } => match value {
            some(returned) => collect_exact_free_binding_expr(
                returned, candidates, seen, result),
            none => {}
        },
        HExpr::DictConstruct { .. } | HExpr::IntLit { .. } |
        HExpr::FloatLit { .. } | HExpr::StrLit { .. } |
        HExpr::BoolLit { .. } => {}
    }
}

fn collect_exact_free_binding_stmt(
    stmt: HStmt, candidates: Set<Int>, mut seen: Set<Int>,
    mut result: List<HFreeBinding>
) {
    match stmt {
        HStmt::Let { init, .. } =>
            collect_exact_free_binding_expr(init, candidates, seen, result),
        HStmt::Var { init, .. } =>
            collect_exact_free_binding_expr(init, candidates, seen, result),
        HStmt::ExprStmt { expr: init, .. } =>
            collect_exact_free_binding_expr(init, candidates, seen, result),
        HStmt::LetDestructure { init, .. } =>
            collect_exact_free_binding_expr(init, candidates, seen, result),
        HStmt::Assign { target, value, .. } => {
            collect_exact_free_binding_expr(target, candidates, seen, result)
            collect_exact_free_binding_expr(value, candidates, seen, result)
        },
        HStmt::Return { value, .. } => match value {
            some(returned) => collect_exact_free_binding_expr(
                returned, candidates, seen, result),
            none => {}
        },
        HStmt::While { condition, body, .. } => {
            collect_exact_free_binding_expr(
                condition, candidates, seen, result)
            if expr_has_reachable_value(condition) {
                collect_exact_free_binding_expr(
                    body, candidates, seen, result)
            }
        },
        HStmt::ForIn { iterable, body, .. } => {
            collect_exact_free_binding_expr(
                iterable, candidates, seen, result)
            if expr_has_reachable_value(iterable) {
                collect_exact_free_binding_expr(
                    body, candidates, seen, result)
            }
        },
        HStmt::IfLet { expr, then_block, else_block, .. } => {
            collect_exact_free_binding_expr(expr, candidates, seen, result)
            if expr_has_reachable_value(expr) {
                collect_exact_free_binding_expr(
                    then_block, candidates, seen, result)
                match else_block {
                    some(branch) => collect_exact_free_binding_expr(
                        branch, candidates, seen, result),
                    none => {}
                }
            }
        },
        HStmt::Drop { name, def_id, ty, span } =>
            push_exact_free_binding(
                candidates, seen, result, name, def_id, ty, span),
        HStmt::Break { .. } | HStmt::Continue { .. } => {}
    }
}

pub fn trait_dict_name(type_name: Str, trait_name: Str) -> Str {
    let safe_type = if type_name.contains("::") { type_name.replace("::", "$") } else { type_name }
    let safe_trait = if trait_name.contains("::") { trait_name.replace("::", "$") } else { trait_name }
    "__${safe_type}_${safe_trait}"
}

pub fn evidence_param_name(effect_name: Str) -> Str {
    let safe = if effect_name.contains("::") { effect_name.replace("::", "$") } else { effect_name }
    "__ring_ev_${safe}"
}

// Reverse evidence_param_name back to the canonical effect identity used by
// checker/codegen registries.  File-module identities have the shape
// `path$segments$$_Decl::inline`; the `$` before the `$$_` boundary belongs to
// the resolver module prefix and must stay encoded.  Only `$` after that
// boundary represents inline `::`.  Without a file-module boundary, every `$`
// represents an inline module separator because `$` is illegal in source
// identifiers.
pub fn effect_name_from_evidence_param(param_name: Str) -> Str {
    let prefix = "__ring_ev_"
    let encoded = param_name.slice(prefix.len(), param_name.len())
    match encoded.index_of("$$_") {
        some(boundary_start) => {
            let suffix_start = boundary_start + "$$_".len()
            let file_identity = encoded.slice(0, suffix_start)
            let inline_suffix = encoded.slice(suffix_start, encoded.len()).replace("$", "::")
            "${file_identity}${inline_suffix}"
        },
        none => encoded.replace("$", "::"),
    }
}

pub fn default_evidence_name(effect_name: Str) -> Str {
    let safe = if effect_name.contains("::") { effect_name.replace("::", "$") } else { effect_name }
    "__ring_default_ev_${safe}"
}

// B-090: declaration-order index of an op within its effect. This is the
// cross-phase contract between gen_handle_expr (which lays out the N-slot
// evidence struct, slot k = op k's {fn_ptr, env} closure) and gen_effect_op
// (which GEPs to this slot to dispatch). Slot order = op order in the effect
// declaration. Property is identical to variant_ctor_name: a naming/layout
// convention shared across codegen phases that must never be hardcoded per-site.
// Returns -1 if the op is not found (well-typed code never hits this — the
// checker rejects ops not declared on the effect).
pub fn effect_op_slot(effect_ops: Map<Str, List<HEffectOp>>, effect_name: Str, op_name: Str) -> Int {
    match effect_ops.get(effect_name) {
        some(ops) => {
            let mut idx = 0
            let mut found = -1
            for o in ops {
                if o.name == op_name && found == -1 { found = idx }
                idx = idx + 1
            }
            found
        },
        none => -1,
    }
}

pub fn trait_bound_param_name(type_param: Str, trait_name: Str) -> Str {
    let safe_trait = if trait_name.contains("::") { trait_name.replace("::", "$") } else { trait_name }
    "__ring_${type_param}_${safe_trait}"
}

pub fn default_method_self_name(type_name: Str) -> Str {
    "__ring_self_${type_name}"
}

// B-163 step 5 (plan §2.5 #2): trait dict SLOT ORDER is a cross-stage contract
// (dict emitters fill slot i, dispatch sites GEP slot i) — the single source
// lives HERE, not per-backend.  Both maps are derived from HDecl::Trait decls
// plus the built-in trait seeds; a backend must consume these instead of
// hardcoding its own registry (the LLVM backend's private scan_trait_decls
// predates this and is retired with the backend in B-163 Phase 2).
pub fn scan_trait_method_order(decls: List<HDecl>, mut trait_method_order: Map<Str, List<Str>>, mut trait_supertraits: Map<Str, List<Str>>) {
    for decl in decls {
        match decl {
            HDecl::Trait { name, methods, supertraits, .. } => {
                let mut method_names: List<Str> = []
                for m in methods {
                    method_names.push(m.name)
                }
                let method_trait_name = name
                let super_trait_name = name
                let owned_supertraits = supertraits
                trait_method_order.insert(method_trait_name, method_names)
                trait_supertraits.insert(
                    super_trait_name, owned_supertraits)
            },
            HDecl::ModBlock { decls: md, .. } => {
                scan_trait_method_order(md, trait_method_order, trait_supertraits)
            },
            _ => {},
        }
    }
    // Built-in traits that never appear as HDecl::Trait.
    if trait_method_order.get("Eq").is_none() {
        trait_method_order.insert("Eq", ["eq", "ne"])
    }
    if trait_method_order.get("Clone").is_none() {
        trait_method_order.insert("Clone", ["clone"])
    }
    if trait_method_order.get("Ord").is_none() {
        trait_method_order.insert("Ord", ["cmp"])
    }
    if trait_method_order.get("Debug").is_none() {
        trait_method_order.insert("Debug", ["debug"])
    }
    if trait_method_order.get("Hash").is_none() {
        trait_method_order.insert("Hash", ["hash"])
    }
}

// Transitive supertrait closure in deterministic DFS order — the ORDER is a
// cross-stage contract too: default trait method functions take supertrait
// dicts as leading params in exactly this order (declarer and every caller
// must agree).
pub fn collect_all_supertraits(trait_supertraits: Map<Str, List<Str>>, trait_name: Str) -> List<Str> {
    let mut result: List<Str> = []
    let mut visited: Set<Str> = set_new()
    let mut stack: List<Str> = []
    match trait_supertraits.get(trait_name) {
        some(supers) => {
            for st in supers {
                let owned_super = st
                stack.push(owned_super)
            }
        },
        none => {},
    }
    while stack.len() > 0 {
        let current = stack.pop().unwrap()
        if visited.contains(current) { continue }
        let visited_current = current
        let result_current = current
        visited.insert(visited_current)
        result.push(result_current)
        match trait_supertraits.get(current) {
            some(parent_supers) => {
                for ps in parent_supers {
                    let owned_parent = ps
                    stack.push(owned_parent)
                }
            },
            none => {},
        }
    }
    result
}

pub const ENUM_TAG_FIELD: Str = "_tag"
pub const OPTION_SOME_TAG: Str = "some"
pub const OPTION_NONE_TAG: Str = "none"
pub const OPTION_PAYLOAD_FIELD: Str = "_0"
pub const RUNTIME_EFFECT_ABORT: Str = "__EffectAbort"
pub const RUNTIME_MATCH_FAIL: Str = "__match_fail"

// Exact identity available directly on a first-class callable expression.
// A control-flow wrapper preserves identity only when every reachable value
// path yields the SAME DefId; Never/return paths are neutral because they
// produce no callable.  This helper never consults a source name or type, so a
// mixed producer still has to be bound to a DefId-backed slot before an
// ownership-sensitive call.
pub fn hexpr_callable_def_id(expr: HExpr) -> Int? {
    if !expr_has_reachable_value(expr) { return none }
    match expr {
        HExpr::Ident { def_id, .. } => {
            let owned_def_id = def_id
            owned_def_id
        },
        HExpr::Lambda { def_id, .. } => {
            let owned_def_id = def_id
            some(owned_def_id)
        },
        HExpr::Call { callable_result_def_id, .. } => {
            let owned_result_id = callable_result_def_id
            owned_result_id
        },
        HExpr::Block { tail, .. } => match tail {
            some(value) => hexpr_callable_def_id(value),
            none => none
        },
        HExpr::IfExpr { then_branch, else_branch, .. } => {
            let then_id = hexpr_callable_def_id(then_branch)
            match else_branch {
                some(branch) => {
                    let else_id = hexpr_callable_def_id(branch)
                    match (then_id, else_id) {
                        (some(left), some(right)) =>
                            if left == right {
                                let owned_left = left
                                some(owned_left)
                            } else { none },
                        (some(left), none) =>
                            if !expr_has_reachable_value(branch) {
                                let owned_left = left
                                some(owned_left)
                            } else { none },
                        (none, some(right)) =>
                            if !expr_has_reachable_value(then_branch) {
                                let owned_right = right
                                some(owned_right)
                            } else { none },
                        (none, none) => none
                    }
                },
                none => none
            }
        },
        HExpr::MatchExpr { arms, .. } => {
            let mut result: Int? = none
            for arm in arms {
                if hmatch_arm_body_is_reachable(arm) &&
                   expr_has_reachable_value(arm.body) {
                    match hexpr_callable_def_id(arm.body) {
                        some(id) => match result {
                            some(expected) => if expected != id { return none },
                            none => {
                                let owned_id = id
                                result = some(owned_id)
                            }
                        },
                        none => return none
                    }
                }
            }
            result
        },
        HExpr::Clone { inner, .. } => hexpr_callable_def_id(inner),
        HExpr::UnsafeBlock { body, .. } => hexpr_callable_def_id(body),
        _ => none
    }
}

fn push_unique_callable_source(mut sources: List<Int>, def_id: Int) {
    for existing in sources {
        if existing == def_id { return }
    }
    let pushed_def_id = def_id
    sources.push(pushed_def_id)
}

// Exact producer identities for a callable-valued expression. Unlike
// hexpr_callable_def_id, this preserves a control-flow join whose reachable
// values have different DefIds but the same frozen callable contract. Diverging
// value paths are neutral. A reachable path without an exact identity poisons
// the whole result; neither spelling nor FnType is an identity fallback.
fn collect_hexpr_callable_source_def_ids(
    expr: HExpr, mut sources: List<Int>
) -> Bool {
    if !expr_has_reachable_value(expr) { return true }
    match expr {
        HExpr::Ident { def_id, .. } => match def_id {
            some(id) => {
                push_unique_callable_source(sources, id)
                true
            },
            none => false
        },
        HExpr::Lambda { def_id, .. } => {
            push_unique_callable_source(sources, def_id)
            true
        },
        HExpr::Call { callable_result_def_id, .. } =>
            match callable_result_def_id {
                some(id) => {
                    push_unique_callable_source(sources, id)
                    true
                },
                none => false
            },
        HExpr::Clone { inner, .. } =>
            collect_hexpr_callable_source_def_ids(inner, sources),
        HExpr::Block { tail, .. } => match tail {
            some(value) =>
                collect_hexpr_callable_source_def_ids(value, sources),
            none => false
        },
        HExpr::UnsafeBlock { body, .. } =>
            collect_hexpr_callable_source_def_ids(body, sources),
        HExpr::IfExpr { then_branch, else_branch, .. } => {
            if !collect_hexpr_callable_source_def_ids(
                    then_branch, sources) {
                return false
            }
            match else_branch {
                some(branch) =>
                    collect_hexpr_callable_source_def_ids(branch, sources),
                none => false
            }
        },
        HExpr::MatchExpr { arms, .. } => {
            let mut any = false
            for arm in arms {
                if hmatch_arm_body_is_reachable(arm) &&
                   expr_has_reachable_value(arm.body) {
                    if !collect_hexpr_callable_source_def_ids(
                            arm.body, sources) {
                        return false
                    }
                    any = true
                }
            }
            any
        },
        _ => false
    }
}

pub fn hexpr_callable_source_def_ids(expr: HExpr) -> List<Int>? {
    let mut sources: List<Int> = []
    if !collect_hexpr_callable_source_def_ids(expr, sources) ||
       sources.len() == 0 {
        return none
    }
    some(sources)
}

// HExpr metadata accessors borrow the expression.  Pattern fields are
// therefore borrowed projections; materialize an ordinary RC copy before
// returning an owned metadata value across the callable ABI.
fn copy_hexpr_type(value: Type) -> Type {
    let copied = value
    copied
}

fn copy_hexpr_effects(value: EffectRow) -> EffectRow {
    let copied = value
    copied
}

fn copy_hexpr_span(value: Span) -> Span {
    let copied = value
    copied
}

pub fn hexpr_type(e: HExpr) -> Type {
    match e {
        HExpr::IntLit { ty, .. } => copy_hexpr_type(ty),
        HExpr::FloatLit { ty, .. } => copy_hexpr_type(ty),
        HExpr::StrLit { ty, .. } => copy_hexpr_type(ty),
        HExpr::BoolLit { ty, .. } => copy_hexpr_type(ty),
        HExpr::Ident { ty, .. } => copy_hexpr_type(ty),
        HExpr::BinOp { ty, .. } => copy_hexpr_type(ty),
        HExpr::UnaryOp { ty, .. } => copy_hexpr_type(ty),
        HExpr::Call { ty, .. } => copy_hexpr_type(ty),
        HExpr::FieldAccess { ty, .. } => copy_hexpr_type(ty),
        HExpr::StructLit { ty, .. } => copy_hexpr_type(ty),
        HExpr::NamedVariantConstruct { ty, .. } => copy_hexpr_type(ty),
        HExpr::MatchExpr { ty, .. } => copy_hexpr_type(ty),
        HExpr::Block { ty, .. } => copy_hexpr_type(ty),
        HExpr::IfExpr { ty, .. } => copy_hexpr_type(ty),
        HExpr::StringInterp { ty, .. } => copy_hexpr_type(ty),
        HExpr::TryCatch { ty, .. } => copy_hexpr_type(ty),
        HExpr::HandleExpr { ty, .. } => copy_hexpr_type(ty),
        HExpr::Lambda { ty, .. } => copy_hexpr_type(ty),
        HExpr::EffectOp { ty, .. } => copy_hexpr_type(ty),
        HExpr::RangeExpr { ty, .. } => copy_hexpr_type(ty),
        HExpr::ListLit { ty, .. } => copy_hexpr_type(ty),
        HExpr::TupleLit { ty, .. } => copy_hexpr_type(ty),
        HExpr::IndexExpr { ty, .. } => copy_hexpr_type(ty),
        HExpr::DictConstruct { ty, .. } => copy_hexpr_type(ty),
        HExpr::Clone { ty, .. } => copy_hexpr_type(ty),
        HExpr::Take { ty, .. } => copy_hexpr_type(ty),
        HExpr::ReturnExpr { ty, .. } => copy_hexpr_type(ty),
        HExpr::UnsafeBlock { ty, .. } => copy_hexpr_type(ty)
    }
}

pub fn hexpr_effects(e: HExpr) -> EffectRow {
    match e {
        HExpr::IntLit { effects, .. } => copy_hexpr_effects(effects),
        HExpr::FloatLit { effects, .. } => copy_hexpr_effects(effects),
        HExpr::StrLit { effects, .. } => copy_hexpr_effects(effects),
        HExpr::BoolLit { effects, .. } => copy_hexpr_effects(effects),
        HExpr::Ident { effects, .. } => copy_hexpr_effects(effects),
        HExpr::BinOp { effects, .. } => copy_hexpr_effects(effects),
        HExpr::UnaryOp { effects, .. } => copy_hexpr_effects(effects),
        HExpr::Call { effects, .. } => copy_hexpr_effects(effects),
        HExpr::FieldAccess { effects, .. } => copy_hexpr_effects(effects),
        HExpr::StructLit { effects, .. } => copy_hexpr_effects(effects),
        HExpr::NamedVariantConstruct { effects, .. } => copy_hexpr_effects(effects),
        HExpr::MatchExpr { effects, .. } => copy_hexpr_effects(effects),
        HExpr::Block { effects, .. } => copy_hexpr_effects(effects),
        HExpr::IfExpr { effects, .. } => copy_hexpr_effects(effects),
        HExpr::StringInterp { effects, .. } => copy_hexpr_effects(effects),
        HExpr::TryCatch { effects, .. } => copy_hexpr_effects(effects),
        HExpr::HandleExpr { effects, .. } => copy_hexpr_effects(effects),
        HExpr::Lambda { effects, .. } => copy_hexpr_effects(effects),
        HExpr::EffectOp { effects, .. } => copy_hexpr_effects(effects),
        HExpr::RangeExpr { effects, .. } => copy_hexpr_effects(effects),
        HExpr::ListLit { effects, .. } => copy_hexpr_effects(effects),
        HExpr::TupleLit { effects, .. } => copy_hexpr_effects(effects),
        HExpr::IndexExpr { effects, .. } => copy_hexpr_effects(effects),
        HExpr::DictConstruct { effects, .. } => copy_hexpr_effects(effects),
        HExpr::Clone { effects, .. } => copy_hexpr_effects(effects),
        HExpr::Take { effects, .. } => copy_hexpr_effects(effects),
        HExpr::ReturnExpr { effects, .. } => copy_hexpr_effects(effects),
        HExpr::UnsafeBlock { effects, .. } => copy_hexpr_effects(effects)
    }
}

pub fn hexpr_span(e: HExpr) -> Span {
    match e {
        HExpr::IntLit { span, .. } => copy_hexpr_span(span),
        HExpr::FloatLit { span, .. } => copy_hexpr_span(span),
        HExpr::StrLit { span, .. } => copy_hexpr_span(span),
        HExpr::BoolLit { span, .. } => copy_hexpr_span(span),
        HExpr::Ident { span, .. } => copy_hexpr_span(span),
        HExpr::BinOp { span, .. } => copy_hexpr_span(span),
        HExpr::UnaryOp { span, .. } => copy_hexpr_span(span),
        HExpr::Call { span, .. } => copy_hexpr_span(span),
        HExpr::FieldAccess { span, .. } => copy_hexpr_span(span),
        HExpr::StructLit { span, .. } => copy_hexpr_span(span),
        HExpr::NamedVariantConstruct { span, .. } => copy_hexpr_span(span),
        HExpr::MatchExpr { span, .. } => copy_hexpr_span(span),
        HExpr::Block { span, .. } => copy_hexpr_span(span),
        HExpr::IfExpr { span, .. } => copy_hexpr_span(span),
        HExpr::StringInterp { span, .. } => copy_hexpr_span(span),
        HExpr::TryCatch { span, .. } => copy_hexpr_span(span),
        HExpr::HandleExpr { span, .. } => copy_hexpr_span(span),
        HExpr::Lambda { span, .. } => copy_hexpr_span(span),
        HExpr::EffectOp { span, .. } => copy_hexpr_span(span),
        HExpr::RangeExpr { span, .. } => copy_hexpr_span(span),
        HExpr::ListLit { span, .. } => copy_hexpr_span(span),
        HExpr::TupleLit { span, .. } => copy_hexpr_span(span),
        HExpr::IndexExpr { span, .. } => copy_hexpr_span(span),
        HExpr::DictConstruct { span, .. } => copy_hexpr_span(span),
        HExpr::Clone { span, .. } => copy_hexpr_span(span),
        HExpr::Take { span, .. } => copy_hexpr_span(span),
        HExpr::ReturnExpr { span, .. } => copy_hexpr_span(span),
        HExpr::UnsafeBlock { span, .. } => copy_hexpr_span(span)
    }
}

// ============================================================
// B-104 D1 built-in rule ① — extern-handle type-level RC exclusion (audit #139)
// ============================================================
//
// `extern type` declarations can describe opaque foreign handles: their values
// are raw pointers produced by a non-Ring allocator, with no ring_alloc RC
// header at ptr-8.
// ring_dup on one WRITES a refcount into foreign memory; ring_drop READS a
// garbage header and may free a foreign interior pointer — both corrupt the
// foreign heap.  Such values are therefore EXCLUDED from RC entirely, decided at
// the TYPE level rather than a name list that would drift as the FFI grows
// (2026-06-11 user decision, backlog B-104 D1 rule ①):
//   * never Clone   (rc_escape: escape = MOVE, no ring_dup)
//   * never Drop    (is_droppable_init: false → never enters the owned set)
//   * never materialise (anf_should_materialize: false → no __anf binding)
//
// The registry side: checker registers `extern type X` as
// `StructDef { fields: [], is_extern: true }` (infer_register.ring), and every
// use site resolves to `Type::StructType { name: X, .. }` carrying the SAME name
// as the `HDecl::ExternType` decl (bare for file-level decls; `${mod}::${name}`
// for inline-mod decls — check_mod_decl prefixes the decl BEFORE check_decl, so
// HIR decl name and StructType name agree in both forms).
//
// B-144: HProgram.extern_type_names carries the set of extern type names
// visible to this module.  In single-file mode, collect_extern_type_names
// (below) scans the HIR decls.  In multi-file mode, compiler_mod::compile_phases
// computes a per-module set that covers use-imported extern types without
// bare-name collisions (B-145: the old blind global union stamped module A's
// `extern type Foo` onto module B which had its own `struct Foo`, falsely
// RC-excluding B's Foo).

// Collect the extern type names declared by this module's HIR (recursing into
// inline mod blocks, whose decl names are already module-prefixed).
pub fn collect_extern_type_names(decls: List<HDecl>) -> Set<Str> {
    let mut out: Set<Str> = set_new()
    collect_extern_type_names_rec(decls, out)
    out
}

fn collect_extern_type_names_rec(decls: List<HDecl>, mut out: Set<Str>) {
    for d in decls {
        match d {
            HDecl::ExternType { name, .. } => {
                let owned_name = name
                out.insert(owned_name)
            },
            HDecl::ModBlock { decls: md, .. } => { collect_extern_type_names_rec(md, out) },
            _ => {},
        }
    }
}

// A type whose values ARE foreign handles (direct extern type).  ring_dup /
// ring_drop on such a value corrupts foreign memory — full RC exclusion.
pub fn is_extern_handle_type(ty: Type, externs: Set<Str>) -> Bool {
    if externs.len() == 0 {
        false
    } else {
        match ty {
            Type::StructType { name, .. } => externs.contains(name),
            _ => false,
        }
    }
}

// B-104 D1 rule ② (Unit) + rule ① (direct extern): a value of this type must
// never be Clone'd, never be Drop'ed, never enter the owned set, and never be
// materialised.  UnitType: the checker guarantees Unit has no value semantics
// (Unit has no value semantics); at the ABI level a Unit-typed call may
// accidentally return a live pointer (the receiver-returning mutators —
// `return list;` etc., see perceus.ring's B-103 classification table), so
// dup/drop bookkeeping on it is at best a pin-leak and at worst a UAF.
pub fn is_rc_excluded_type(ty: Type, externs: Set<Str>) -> Bool {
    match ty {
        Type::UnitType => true,
        Type::PtrType { .. } => true,
        _ => is_extern_handle_type(ty, externs),
    }
}

// A type whose values, when DEEP-DROPPED, would reach a foreign handle: the
// extern type itself, or a container / Option / tuple / struct / enum that
// transitively holds one (e.g. `List<LLVMTypeRef>` — drop_list ring_drops each
// element; `LLVMValueRef?` — drop_option drops the payload; `LlvmCtx` — its
// drop_T would drop extern fields and `Map<Str, LLVMValueRef>` fields whose
// runtime drop_map drops the foreign values).  Such values must never be
// scope-end-dropped or materialised (leak instead — crash-free direction).
// Even though a shallow ring_dup could touch only a container's own header,
// Clone would manufacture another owner whose eventual deep Drop reaches the
// foreign payload. Therefore both Clone and Drop use the same fail-closed
// physical eligibility predicate below.
//
// FnType is NOT recursed: a closure's captures are not described by its
// signature, and drop_closure_env releases captures, not param/return values.
// Recursive types terminate via an on-stack visited set (struct/enum names);
// monotone OR + one full exploration per name keeps reachability exact.
pub fn type_contains_extern_handle(ty: Type, externs: Set<Str>) -> Bool {
    if externs.len() == 0 {
        false
    } else {
        let mut visited: Set<Str> = set_new()
        type_contains_extern_rec(ty, externs, visited)
    }
}

// One physical RC authority shared by the RC pass and its verifier. Logical
// ownership transfer is intentionally absent: Int/Ptr/extern values can still
// be invalidated by an exact Move contract, while a List<extern> is likewise
// logically movable but must never be Clone'd or Drop'ed deeply.
pub fn type_is_physical_rc_eligible(
    ty: Type, externs: Set<Str>
) -> Bool {
    !is_rc_excluded_type(ty, externs) &&
    !type_contains_extern_handle(ty, externs)
}

// Logical binding invalidation is deliberately separate from physical RC.
// FORCE uses the first predicate: even scalar, Ptr and direct-extern bindings
// are source-language values and become unavailable.  OWNING uses the second:
// scalar/Ptr/direct-extern values copy by value, while aggregates (including a
// List<extern>) still cross an owning edge and require an exact Take.
pub fn type_has_logical_transfer_value(ty: Type) -> Bool {
    match ty {
        Type::UnitType | Type::NeverType |
        Type::EffectRowType { .. } | Type::ErrorType => false,
        Type::IntType | Type::FloatType | Type::BoolType |
        Type::StrType | Type::AnyType | Type::TypeVar { .. } |
        Type::FnType { .. } | Type::StructType { .. } |
        Type::EnumType { .. } | Type::GenericType { .. } |
        Type::RecordType { .. } | Type::TupleType { .. } |
        Type::PtrType { .. } => true
    }
}

pub fn type_crosses_logical_owning_edge_by_value(
    ty: Type, externs: Set<Str>
) -> Bool {
    if !type_has_logical_transfer_value(ty) { return false }
    match ty {
        Type::IntType | Type::FloatType | Type::BoolType |
        Type::PtrType { .. } => false,
        Type::StructType { name, .. } => !externs.contains(name),
        Type::GenericType { base, .. } =>
            type_crosses_logical_owning_edge_by_value(base, externs),
        _ => true
    }
}

fn type_contains_extern_rec(ty: Type, externs: Set<Str>, mut visited: Set<Str>) -> Bool {
    match ty {
        // B-152: Ptr<T> is RC-excluded (B-125); ring_drop on a raw pointer reads
        // garbage headers.  Skip it in the field-drop loop, same as extern handles.
        Type::PtrType { .. } => true,
        Type::StructType { name, type_params } => {
            if externs.contains(name) {
                true
            } else if visited.contains("S:${name}") {
                false
            } else {
                visited.insert("S:${name}")
                let mut found = false
                for tp in type_params {
                    if type_contains_extern_rec(tp, externs, visited) { found = true }
                }
                found
            }
        },
        Type::EnumType { name, type_params } => {
            if visited.contains("E:${name}") {
                false
            } else {
                visited.insert("E:${name}")
                let mut found = false
                for tp in type_params {
                    if type_contains_extern_rec(tp, externs, visited) { found = true }
                }
                found
            }
        },
        Type::TupleType { elements } => {
            let mut found = false
            for e in elements {
                if type_contains_extern_rec(e, externs, visited) { found = true }
            }
            found
        },
        Type::GenericType { base, args } => {
            let mut found = type_contains_extern_rec(base, externs, visited)
            for a in args {
                if type_contains_extern_rec(a, externs, visited) { found = true }
            }
            found
        },
        Type::RecordType { fields, .. } => {
            let mut found = false
            for f in fields {
                if type_contains_extern_rec(f.ty, externs, visited) { found = true }
            }
            found
        },
        _ => false,
    }
}

// ============================================================
// B-104 return-mode predicates (shared perceus ↔ LLVM codegen)
// ============================================================
//
// These were perceus-internal until D1 Stage 2; the codegen-level condition-box
// drops (emit_while / match-guard post-unbox — see is_fresh_owned_bool_value)
// need the same classification, and cross-stage contracts live in hir.ring.
// THE EVIDENCE RECORD (the complete B-103 ring_runtime.cpp return-mode
// classification table, function by function) remains in perceus.ring directly
// above its former location — read it before touching membership here.

// Exact return ownership for a call edge. No source spelling or method leaf is
// ownership authority: inference records the selected callable DefId and the
// ownership solver publishes its canonical descriptor.
pub fn call_returns_borrowed(
    metadata: OwnershipMetadata, callee_def_id: Int?
) -> Bool {
    let def_id = match callee_def_id {
        some(id) => id,
        none => panic("unreachable: call return ownership has no exact callee DefId")
    }
    let ownership_id = match metadata.callable_by_def_id.get(def_id) {
        some(id) => id,
        none => panic("unreachable: exact callee DefId has no return ownership descriptor")
    }
    let result = callable_return_ownership(metadata, ownership_id)
    if result == RETURN_OWNERSHIP_BORROWED {
        true
    } else if result == RETURN_OWNERSHIP_OWNED {
        false
    } else {
        panic("unreachable: exact call return ownership is unknown")
    }
}

// is_arg_returning_call (sole member `fold`) was RETIRED here on 2026-06-12
// (B-104 D1 Stage 3, audit #150): ring_list_fold now dups `init` on the
// empty-receiver path, so no runtime callee returns an argument verbatim with
// a moved result — every call result is OWNED on every path.

// B-104 D1 Stage 2 — fresh-owned Bool CONDITION value (the while-cond /
// match-guard box).  HIR cannot express "unbox the condition, THEN release the
// box" — the unbox is emitted inside codegen's condition lowering, so the drop
// must be emitted there too (same pattern as the B-104b range-loop drops in
// emit_for_in_range_direct).  This predicate is the perceus-blessed ownership
// answer: TRUE iff the expression's value is a freshly-allocated Bool box whose
// FINAL consumer is that unbox, so a post-unbox ring_drop is balanced:
//   * BinOp → comparison/eq lowers to box_bool (fresh).  (`&&`/`||` never
//     appear here — B-104 D7: andor_lower rewrites them to IfExpr at checker
//     end; their phi classifies via the If/Match recursion below.)
//   * UnaryOp → `!x` boxes a fresh result.
//   * Call, unless its exact callee DefId descriptor says Borrowed: a Ring fn
//     returns OWNED (clone-all-escape Clone-wraps tail
//     borrows) and scalar builtins are boxed fresh at the call site (`fold`
//     included since the #150 empty-path dup — owned on every path).
//   * BoolLit → a fresh box per evaluation (`while true`).
//   * Clone → an owned dup by construction (a dropping cond-block's
//     Clone-wrapped tail — rc_block_inner's tail-escape invariant).
//   * Take → the exact source slot was cleared and its sole owned value was
//     transferred to the condition.  This is the post-RC shape of an inner
//     short-circuit branch whose value crosses its own scope-end drops.
//   * Block → its value is its tail's value → recurse.
//   * If/Match (B-104 D2) → TRUE iff EVERY branch tail is itself
//     is_fresh_owned_bool_value (the W3a branch-value recursion, bottoming
//     out on the same leaf classification).  Covers the match-valued
//     while-cond (`while match make(i) { some(p) => p.flag, none => false }`):
//     in a DROPPING cond-block the tail-escape invariant Clone-wraps every
//     owner-bearing arm tail, so the phi box is always a fresh dup/box that
//     leaked once per ITERATION pre-D2 (verifier finding on
//     receiver_temp_drop.ring).  A bare borrow arm tail (`m => obj.flag`,
//     un-Cloned in a no-drop cond) classifies false → whole phi false →
//     conservative no-drop, exactly as before.  A DIVERGING arm (Block ending
//     in return — no tail) classifies false → conservative leak-direction.
// Everything else (Ident / FieldAccess / IndexExpr reads, EffectOp, …) →
// false: borrow or unknown ownership — leak-direction.  The
// BoolType requirement is a belt against audit #149 TypeVar-typed conditions
// (an unannotated fn's over-generalised return — unknown ownership, possibly
// the Unit ABI receiver-return accident).
pub fn is_fresh_owned_bool_value(
    metadata: OwnershipMetadata, expr: HExpr
) -> Bool {
    let is_bool = match hexpr_type(expr) {
        Type::BoolType => true,
        _ => false,
    }
    if is_bool == false {
        return false
    }
    match expr {
        HExpr::BinOp { .. } => true,
        HExpr::UnaryOp { .. } => true,
        HExpr::Call { callee_def_id, .. } =>
            call_returns_borrowed(metadata, callee_def_id) == false,
        HExpr::BoolLit { .. } => true,
        HExpr::Clone { .. } => true,
        HExpr::Take { .. } => true,
        // A Block's value is its tail's value.  POST-RC SHAPE: a block that
        // emits scope-end drops has its tail HOISTED by rc_block_inner into a
        // fresh `let __rc_scope_N = <escape-processed tail>` (so the drops run
        // after the tail is computed) and the syntactic tail becomes an Ident
        // referencing it.  That binding's value is OWNED by construction (the
        // tail-escape invariant moves a fresh tail / Clone-wraps an
        // owner-bearing one) and is never in the block's own drop set (it is
        // created after block_locals).  So: a non-Ident tail classifies
        // directly; an Ident tail classifies via the init of the LAST Let/Var
        // of that name among this block's direct statements (the hoist, or a
        // user binding — which, in a NON-dropping block, was necessarily
        // non-droppable, so its init classifies false: borrows stay
        // un-dropped).  An Ident with no binding in this block is an outer
        // borrow → false.
        HExpr::Block { stmts, tail, .. } => match tail {
            some(t) => match t {
                HExpr::Ident { name, .. } => match block_local_init(stmts, name) {
                    some(init) => is_fresh_owned_bool_value(metadata, init),
                    none => false,
                },
                _ => is_fresh_owned_bool_value(metadata, t),
            },
            none => false,
        },
        HExpr::IfExpr { then_branch, else_branch, .. } => match else_branch {
            none => false,
            some(eb) => is_fresh_owned_bool_value(metadata, then_branch) &&
                is_fresh_owned_bool_value(metadata, eb),
        },
        HExpr::MatchExpr { arms, .. } => {
            let mut all = arms.len() > 0
            for arm in arms {
                if is_fresh_owned_bool_value(metadata, arm.body) == false {
                    all = false
                }
            }
            all
        },
        _ => false,
    }
}

// Comparator for sort_by on (Str, _) tuples — compares by first element.
// Used across 55+ call sites to deterministically sort Map.entries() etc.
pub fn compare_by_first<T>(a: (Str, T), b: (Str, T)) -> Int {
    if a.0 < b.0 { -1 } else if a.0 > b.0 { 1 } else { 0 }
}

// The initialiser of the LAST direct `let`/`var` statement binding `name` in a
// statement list (helper for is_fresh_owned_bool_value's post-RC Block arm).
fn block_local_init(stmts: List<HStmt>, name: Str) -> HExpr? {
    let mut found: HExpr? = none
    for s in stmts {
        match s {
            HStmt::Let { name: n, init, .. } => {
                if n == name {
                    let owned_init = init
                    found = some(owned_init)
                }
            },
            HStmt::Var { name: n, init, .. } => {
                if n == name {
                    let owned_init = init
                    found = some(owned_init)
                }
            },
            _ => {},
        }
    }
    found
}
