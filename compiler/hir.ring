use ast::{Span, Pattern, BinOp, UnaryOp, TypeParam}
use types::{Type, EffectRow, StructField, EnumVariant, RecordField}

pub use types::{BUILTIN_INT, BUILTIN_FLOAT, BUILTIN_STR, BUILTIN_BOOL,
    BUILTIN_RANGE, BUILTIN_LIST, BUILTIN_MAP, BUILTIN_SET,
    BUILTIN_OPTION, BUILTIN_CELL, BUILTIN_STRING_BUILDER}

pub use builtin_methods::{CELL_METHODS, STR_METHODS, INT_METHODS, FLOAT_METHODS,
    LIST_NON_HOF_METHODS, LIST_HOF_METHODS,
    MAP_NON_HOF_METHODS, MAP_HOF_METHODS,
    SET_NON_HOF_METHODS, SET_HOF_METHODS,
    OPTION_NON_HOF_METHODS, OPTION_HOF_METHODS,
    STRINGBUILDER_METHODS}

pub struct HParam {
    pub name: Str,
    pub ty: Type,
    pub def_id: Int?,
    pub is_mutable: Bool
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
//                   + Simple(local).  After dict_lower, Wrapped survives ONLY
//                   in BinOp eq/ord_dispatch extra_dicts (JS-only consumption;
//                   the LLVM backend ignores extra_dicts — pre-existing gap).
pub enum DictRef {
    Simple(Str),
    Wrapped { dict: Str, trait_name: Str, inner_dicts: List<DictRef> },
    Static(Str)
}

// B-104 D4: a module-level static dict singleton definition (HProgram.static_dicts).
//   inner == []  — a PLAIN static dict (impl dict or builtin primitive dict).
//                  Its definition already exists (JS: impl const / runtime
//                  preamble; LLVM: ring_dict_init_* / runtime builtin synthesis);
//                  the entry records the module's static-dict footprint and the
//                  LLVM backend memoises the named singleton on first use.
//                  trait_name may be "" (not recoverable from the name alone —
//                  backends do not need it for plain dicts).
//   inner != [] — a fully-static WRAPPED INSTANCE: base_dict's trait methods
//                  partially applied with the inner singletons.  Both backends
//                  emit ONE module-level definition (JS: const; LLVM: lazy
//                  memoised getter) and use sites borrow it via DictRef::Static.
pub struct HDictDef {
    pub name: Str,
    pub base_dict: Str,
    pub trait_name: Str,
    pub inner: List<Str>
}

// Naming convention for a fully-static wrapped dict instance (cross-stage
// contract: dict_lower mints it, both backends define/reference it).  `$` is
// legal in JS identifiers and LLVM symbols, and cannot appear in user type
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
    Dict { param: Str }
}

pub struct DictDispatchInfo {
    pub dict_param: Str,
    pub method: Str
}

pub struct HStructFieldInit {
    pub name: Str,
    pub value: HExpr
}

pub struct HMatchArm {
    pub pattern: Pattern,
    pub guard: HExpr?,
    pub body: HExpr,
    pub span: Span
}

pub struct HEffectHandler {
    pub effect_name: Str,
    pub op_name: Str,
    pub params: List<HParam>,
    pub resume_name: Str?,
    pub body: HExpr
}

pub enum HStringInterpPart {
    Literal(Str),
    Expression(HExpr)
}

pub enum HExpr {
    IntLit { value: Int, ty: Type, effects: EffectRow, span: Span },
    FloatLit { value: Float, ty: Type, effects: EffectRow, span: Span },
    StrLit { value: Str, ty: Type, effects: EffectRow, span: Span },
    BoolLit { value: Bool, ty: Type, effects: EffectRow, span: Span },
    Ident { name: Str, resolved_name: Str?, def_id: Int?, dict_closure_dicts: List<Str>?, ty: Type, effects: EffectRow, span: Span },
    BinOp { op: BinOp, left: HExpr, right: HExpr, eq_dispatch: TraitDispatch?, ord_dispatch: TraitDispatch?, ty: Type, effects: EffectRow, span: Span },
    UnaryOp { op: UnaryOp, operand: HExpr, ty: Type, effects: EffectRow, span: Span },
    Call { callee: HExpr, args: List<HExpr>, type_args: List<Type>, resolved_dicts: List<DictRef>, dict_dispatch: DictDispatchInfo?, ty: Type, effects: EffectRow, span: Span },
    FieldAccess { receiver: HExpr, field: Str, ty: Type, effects: EffectRow, span: Span },
    StructLit { name: Str, type_args: List<Type>, fields: List<HStructFieldInit>, spread: HExpr?, ty: Type, effects: EffectRow, span: Span },
    NamedVariantConstruct { enum_name: Str, variant_name: Str, fields: List<HStructFieldInit>, spread: HExpr?, ty: Type, effects: EffectRow, span: Span },
    MatchExpr { scrutinee: HExpr, arms: List<HMatchArm>, ty: Type, effects: EffectRow, span: Span },
    Block { stmts: List<HStmt>, tail: HExpr?, ty: Type, effects: EffectRow, span: Span },
    IfExpr { condition: HExpr, then_branch: HExpr, else_branch: HExpr?, ty: Type, effects: EffectRow, span: Span },
    StringInterp { parts: List<HStringInterpPart>, ty: Type, effects: EffectRow, span: Span },
    TryCatch { body: HExpr, arms: List<HMatchArm>, ty: Type, effects: EffectRow, span: Span },
    HandleExpr { body: HExpr, handlers: List<HEffectHandler>, ty: Type, effects: EffectRow, span: Span },
    Lambda { params: List<HParam>, return_type: Type, body: HExpr, ty: Type, effects: EffectRow, span: Span },
    EffectOp { effect_name: Str, op_name: Str, args: List<HExpr>, ty: Type, effects: EffectRow, span: Span },
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
    // (clone-all-escape) for --target=llvm only.  Wraps an escaping value that
    // already has an independent owner (Ident binding / FieldAccess / IndexExpr /
    // container read result) so the escape gets its own owned reference rather
    // than aliasing the still-live source.  codegen lowers `Clone{inner}` to
    // eval inner -> ring_dup(result) -> result (ty/effects/span taken from inner).
    Clone { inner: HExpr, ty: Type, effects: EffectRow, span: Span },
    ReturnExpr { value: HExpr?, ty: Type, effects: EffectRow, span: Span }
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
    IfLet { pattern: Pattern, expr: HExpr, then_block: HExpr, else_block: HExpr?, span: Span },

    // Perceus RC: explicit reference counting ops (inserted by RC pass for --target=llvm only)
    Drop { name: Str, ty: Type, span: Span },
    Dup { name: Str, ty: Type, span: Span }
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
    ExternFn { name: Str, def_id: Int?, type_params: List<TypeParam>, params: List<HParam>, return_type: Type, effects: EffectRow, is_pub: Bool, span: Span },
    ExternType { name: Str, type_params: List<TypeParam>, is_pub: Bool, span: Span },
    TypeAlias { name: Str, ty: Type, is_pub: Bool, span: Span },
    Const { name: Str, def_id: Int?, ty: Type, init: HExpr, is_pub: Bool, span: Span },
    ModBlock { name: Str, decls: List<HDecl>, is_pub: Bool, span: Span },
    Sig { name: Str, members: List<HSigMember>, is_pub: Bool, span: Span }
}

pub enum FieldAction {
    Identity,
    FloatIdentity,
    BoolIdentity,
    Call { dict_name: Str, extra_dicts: List<Str> },
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
    pub fields: List<DerivedField>,
    pub has_named_fields: Bool
}

pub enum TypeKind { StructKind, EnumKind }

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
    // all modules.  perceus / codegen_llvm / verify_rc read this instead of
    // re-collecting per-module (which misses use-imported extern types).
    pub extern_type_names: Set<Str>
}

// B-102 R-clean (2026-06-07) — the A1 Type-DAG never-drop special case
// (is_type_dag_type_name / is_type_dag_type) is REMOVED.  Type and the
// structs/enums reachable from it now participate in ordinary Perceus RC:
// codegen_llvm generates a recursive ring_drop_T for them, perceus Clone-wraps
// every escaping owner-bearing Type substructure (so the shallow ring_dup is
// balanced by the deep recursive drop), and the working-set is reclaimed at
// scope end.  See design.md §7.11 "Type-DAG 内存回收：pure Perceus RC".

// JS codegen naming conventions
pub fn variant_js_name(enum_name: Str, variant_name: Str) -> Str {
    "${enum_name}_${variant_name}"
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

pub fn default_evidence_name(effect_name: Str) -> Str {
    let safe = if effect_name.contains("::") { effect_name.replace("::", "$") } else { effect_name }
    "__ring_default_ev_${safe}"
}

// B-090: declaration-order index of an op within its effect. This is the
// cross-phase contract between gen_handle_expr (which lays out the N-slot
// evidence struct, slot k = op k's {fn_ptr, env} closure) and gen_effect_op
// (which GEPs to this slot to dispatch). Slot order = op order in the effect
// declaration. Property is identical to variant_js_name: a naming/layout
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

pub const ENUM_TAG_FIELD: Str = "_tag"
pub const OPTION_SOME_TAG: Str = "some"
pub const OPTION_NONE_TAG: Str = "none"
pub const OPTION_PAYLOAD_FIELD: Str = "_0"
pub const RUNTIME_EFFECT_ABORT: Str = "__EffectAbort"
pub const RUNTIME_MATCH_FAIL: Str = "__match_fail"

pub fn hexpr_type(e: HExpr) -> Type {
    match e {
        HExpr::IntLit { ty, .. } => ty,
        HExpr::FloatLit { ty, .. } => ty,
        HExpr::StrLit { ty, .. } => ty,
        HExpr::BoolLit { ty, .. } => ty,
        HExpr::Ident { ty, .. } => ty,
        HExpr::BinOp { ty, .. } => ty,
        HExpr::UnaryOp { ty, .. } => ty,
        HExpr::Call { ty, .. } => ty,
        HExpr::FieldAccess { ty, .. } => ty,
        HExpr::StructLit { ty, .. } => ty,
        HExpr::NamedVariantConstruct { ty, .. } => ty,
        HExpr::MatchExpr { ty, .. } => ty,
        HExpr::Block { ty, .. } => ty,
        HExpr::IfExpr { ty, .. } => ty,
        HExpr::StringInterp { ty, .. } => ty,
        HExpr::TryCatch { ty, .. } => ty,
        HExpr::HandleExpr { ty, .. } => ty,
        HExpr::Lambda { ty, .. } => ty,
        HExpr::EffectOp { ty, .. } => ty,
        HExpr::RangeExpr { ty, .. } => ty,
        HExpr::ListLit { ty, .. } => ty,
        HExpr::TupleLit { ty, .. } => ty,
        HExpr::IndexExpr { ty, .. } => ty,
        HExpr::DictConstruct { ty, .. } => ty,
        HExpr::Clone { ty, .. } => ty,
        HExpr::ReturnExpr { ty, .. } => ty
    }
}

pub fn hexpr_effects(e: HExpr) -> EffectRow {
    match e {
        HExpr::IntLit { effects, .. } => effects,
        HExpr::FloatLit { effects, .. } => effects,
        HExpr::StrLit { effects, .. } => effects,
        HExpr::BoolLit { effects, .. } => effects,
        HExpr::Ident { effects, .. } => effects,
        HExpr::BinOp { effects, .. } => effects,
        HExpr::UnaryOp { effects, .. } => effects,
        HExpr::Call { effects, .. } => effects,
        HExpr::FieldAccess { effects, .. } => effects,
        HExpr::StructLit { effects, .. } => effects,
        HExpr::NamedVariantConstruct { effects, .. } => effects,
        HExpr::MatchExpr { effects, .. } => effects,
        HExpr::Block { effects, .. } => effects,
        HExpr::IfExpr { effects, .. } => effects,
        HExpr::StringInterp { effects, .. } => effects,
        HExpr::TryCatch { effects, .. } => effects,
        HExpr::HandleExpr { effects, .. } => effects,
        HExpr::Lambda { effects, .. } => effects,
        HExpr::EffectOp { effects, .. } => effects,
        HExpr::RangeExpr { effects, .. } => effects,
        HExpr::ListLit { effects, .. } => effects,
        HExpr::TupleLit { effects, .. } => effects,
        HExpr::IndexExpr { effects, .. } => effects,
        HExpr::DictConstruct { effects, .. } => effects,
        HExpr::Clone { effects, .. } => effects,
        HExpr::ReturnExpr { effects, .. } => effects
    }
}

pub fn hexpr_span(e: HExpr) -> Span {
    match e {
        HExpr::IntLit { span, .. } => span,
        HExpr::FloatLit { span, .. } => span,
        HExpr::StrLit { span, .. } => span,
        HExpr::BoolLit { span, .. } => span,
        HExpr::Ident { span, .. } => span,
        HExpr::BinOp { span, .. } => span,
        HExpr::UnaryOp { span, .. } => span,
        HExpr::Call { span, .. } => span,
        HExpr::FieldAccess { span, .. } => span,
        HExpr::StructLit { span, .. } => span,
        HExpr::NamedVariantConstruct { span, .. } => span,
        HExpr::MatchExpr { span, .. } => span,
        HExpr::Block { span, .. } => span,
        HExpr::IfExpr { span, .. } => span,
        HExpr::StringInterp { span, .. } => span,
        HExpr::TryCatch { span, .. } => span,
        HExpr::HandleExpr { span, .. } => span,
        HExpr::Lambda { span, .. } => span,
        HExpr::EffectOp { span, .. } => span,
        HExpr::RangeExpr { span, .. } => span,
        HExpr::ListLit { span, .. } => span,
        HExpr::TupleLit { span, .. } => span,
        HExpr::IndexExpr { span, .. } => span,
        HExpr::DictConstruct { span, .. } => span,
        HExpr::Clone { span, .. } => span,
        HExpr::ReturnExpr { span, .. } => span
    }
}

// ============================================================
// B-104 D1 built-in rule ① — extern-handle type-level RC exclusion (audit #139)
// ============================================================
//
// `extern type` declarations (llvm_ffi.ring / the codegen_llvm_* re-declarations)
// describe OPAQUE FOREIGN handles: their values are raw pointers produced by a
// non-Ring allocator (LLVM-C API), with NO ring_alloc RC header at ptr-8.
// ring_dup on one WRITES a refcount into foreign memory; ring_drop READS a
// garbage header and may free a foreign interior pointer — both corrupt the
// foreign heap.  Such values are therefore EXCLUDED from RC entirely, decided at
// the TYPE level (not a name-list of the 59 LLVM-C externs, which would drift as
// the FFI grows — 2026-06-11 user decision, backlog B-104 D1 rule ①):
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
            HDecl::ExternType { name, .. } => { out.insert(name) },
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
// (JS backend yields undefined); at the LLVM ABI a Unit-typed call may
// accidentally return a live pointer (the receiver-returning mutators —
// `return list;` etc., see perceus.ring's B-103 classification table), so
// dup/drop bookkeeping on it is at best a pin-leak and at worst a UAF.
pub fn is_rc_excluded_type(ty: Type, externs: Set<Str>) -> Bool {
    match ty {
        Type::UnitType => true,
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
// A SHALLOW ring_dup on a non-extern container of extern handles is safe (the
// container itself has a real RC header), so Clone-on-escape stays allowed for
// these (only the DIRECT extern type suppresses Clone — is_extern_handle_type).
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

fn type_contains_extern_rec(ty: Type, externs: Set<Str>, mut visited: Set<Str>) -> Bool {
    match ty {
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

// A method call whose result is a BORROW of (an inner reference of) its
// receiver or an argument, returned WITHOUT a dup by the runtime — escaping it
// needs a Clone, and scope-end-dropping its binding would free a reference
// owned elsewhere.  Membership = the 4 Option projections (B-104 D1 rule ②
// retired the 9 receiver-returning mutator names — their protection is the
// type-level Unit exclusion).  Safety asymmetry: omitting a genuine borrow
// returner CRASHES (UAF); mis-listing a fresh returner only leaks.
pub fn is_borrow_returning_call(callee: HExpr) -> Bool {
    match callee {
        HExpr::FieldAccess { field, .. } =>
            field == "unwrap" || field == "to_fail"
            || field == "unwrap_or" || field == "unwrap_or_else",
        _ => false,
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
//   * Call, unless borrow-returning (unwrap family → borrow of the receiver's
//     payload): a Ring fn returns OWNED (clone-all-escape Clone-wraps tail
//     borrows) and scalar builtins are boxed fresh at the call site (`fold`
//     included since the #150 empty-path dup — owned on every path).
//   * BoolLit → a fresh box per evaluation (`while true`).
//   * Clone → an owned dup by construction (a dropping cond-block's
//     Clone-wrapped tail — rc_block_inner's tail-escape invariant).
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
pub fn is_fresh_owned_bool_value(expr: HExpr) -> Bool {
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
        HExpr::Call { callee, .. } =>
            is_borrow_returning_call(callee) == false,
        HExpr::BoolLit { .. } => true,
        HExpr::Clone { .. } => true,
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
                    some(init) => is_fresh_owned_bool_value(init),
                    none => false,
                },
                _ => is_fresh_owned_bool_value(t),
            },
            none => false,
        },
        HExpr::IfExpr { then_branch, else_branch, .. } => match else_branch {
            none => false,
            some(eb) => is_fresh_owned_bool_value(then_branch) && is_fresh_owned_bool_value(eb),
        },
        HExpr::MatchExpr { arms, .. } => {
            let mut all = arms.len() > 0
            for arm in arms {
                if is_fresh_owned_bool_value(arm.body) == false { all = false }
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
                if n == name { found = some(init) }
            },
            HStmt::Var { name: n, init, .. } => {
                if n == name { found = some(init) }
            },
            _ => {},
        }
    }
    found
}
