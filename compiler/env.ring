use types::{Type, Effect, EffectRow, StructField, EnumVariant, RecordField,
    OwnershipMetadata, FnMeta, INT, new_ownership_metadata,
    effects_match_kind_with_ownership, nominal_display_name,
    record_callable_ownership,
    fn_meta, freeze_callable_ownership_type}
use union_find::{UnionFind, uf_find, uf_lookup}
use ast::{Span, EffectExpr, TypeParam}
use diagnostics::{CollectingSink, DiagnosticSink, DiagnosticContext, Severity,
    make_diag}
use codes::{E0504}

// ============================================================
// Type Scheme (for let-polymorphism)
// ============================================================

pub struct AssocConstraintEntry {
    pub name: Str,   // "Item"
    pub ty: Type     // the constrained concrete type
}

pub struct SchemeBound {
    pub type_var: Int,
    pub trait_name: Str,
    pub assoc_constraints: List<AssocConstraintEntry>
}

pub struct TypeScheme {
    pub ty: Type,
    pub type_vars: List<Int>,
    pub bounds: List<SchemeBound>,
    pub def_id: Int?
}

// Follow a scheme's lexical DefId to its final declaration identity. Alias
// consumers in checker/export must share this rule: an intermediate re-export
// key is a lookup location, never callable provenance.
pub fn exact_scheme_value_origin(
    exact_origins: Map<Int, Str>, scheme: TypeScheme, fallback: Str
) -> Str {
    match scheme.def_id {
        some(def_id) => match exact_origins.get(def_id) {
            some(origin) => {
                let exact_origin = origin
                exact_origin
            },
            none => fallback
        },
        none => fallback
    }
}

// ============================================================
// Struct / Enum / Effect definitions stored in environment
// ============================================================

pub struct StructDef {
    pub name: Str,
    pub type_params: List<Str>,
    pub type_param_vars: List<Int>,
    pub fields: List<StructField>,
    // True for opaque extern (FFI) types registered as zero-field structs.
    // Carries cross-module via TypeDef::StructDef_ so both the declaring and
    // consuming modules can exclude it from trait derivation (B-074).
    pub is_extern: Bool
}

pub struct EnumDef {
    pub name: Str,
    pub type_params: List<Str>,
    pub type_param_vars: List<Int>,
    pub variants: List<EnumVariant>,
    pub variant_index: Map<Str, Int>
}

pub fn lookup_variant(def: EnumDef, name: Str) -> EnumVariant? {
    match def.variant_index.get(name) {
        some(idx) => def.variants.get(idx),
        none => none
    }
}

pub struct EffectOpDef {
    pub name: Str,
    pub params: List<Type>,
    pub return_type: Type,
    pub has_default: Bool
}

pub enum BuiltInKind { BkIo, BkFail, BkMut }

pub struct EffectDef {
    pub name: Str,
    pub type_params: List<Str>,
    pub type_param_vars: List<Int>,
    pub ops: List<EffectOpDef>,
    pub built_in_kind: BuiltInKind?,
    pub all_have_defaults: Bool
}

// ============================================================
// Trait definitions
// ============================================================

pub struct TraitMethodDef {
    pub name: Str,
    // Declaration-local callable identity.  Specializations allocate their own
    // local DefIds; this ID continues to identify the trait declaration itself.
    pub def_id: Int,
    pub ty: Type,
    pub has_default: Bool,
    pub param_mutabilities: List<Bool>,
    pub method_type_params: List<TypeParam>
}

pub struct AssocTypeDef {
    pub name: Str,
    pub bounds: List<Str>,        // trait name bounds
    pub default_type: Type?,      // trait-level default value
    pub var_id: Int               // type variable ID used in trait method signatures
}

pub struct TraitDef {
    pub name: Str,
    // Checker-local declaration identity. Trait spelling is never sufficient
    // to recognize a semantic builtin such as Drop because imports and lexical
    // shadowing may reuse the same display name.
    pub def_id: Int,
    pub type_params: List<Str>,
    pub type_param_vars: List<Int>,
    pub methods: List<TraitMethodDef>,
    pub supertraits: List<Str>,
    pub assoc_types: List<AssocTypeDef>
}

// Ordered impl predicates that require runtime dictionary evidence.
// This is not a complete impl predicate: current impl registration does not
// carry TypeBound type_args or assoc_constraints here.
pub struct ImplDictBound {
    pub type_param_index: Int,
    pub trait_name: Str
}

pub struct ImplEntry {
    pub trait_name: Str,
    pub target_type_name: Str,
    pub type_params: List<Str>,
    pub dict_bounds: List<ImplDictBound>,
    pub method_names: List<Str>,
    pub assoc_types: Map<Str, Type>,
    // Trait-specific method evidence.  This is authoritative for protocol
    // lowering; impl_methods remains only the unambiguous ordinary-call view.
    pub method_schemes: Map<Str, TypeScheme>,
    // Stable semantic role derived from the exact builtin Drop trait DefId in
    // the exporting checker.  Imported checker-local DefIds are deliberately
    // not compared across modules.
    pub is_authoritative_drop: Bool,
    // Stable across export/re-export hydration.  Distinct source impl blocks
    // must never be collapsed merely because target/trait spellings match.
    pub origin: Str,
    pub span: Span
}

pub struct MethodOrigin {
    pub origin: Str,
    pub trait_name: Str?,
    pub is_authoritative_drop: Bool,
    pub span: Span
}

pub fn trait_is_authoritative_drop(
    registry: TraitRegistry, trait_name: Str?
) -> Bool {
    match (registry.authoritative_drop_def_id, trait_name) {
        (some(drop_def_id), some(name)) =>
            match registry.traits.get(name) {
                some(trait_def) => trait_def.def_id == drop_def_id,
                none => false
            },
        _ => false
    }
}

// ============================================================
// Type alias + function bounds
// ============================================================

pub struct TypeAliasDef {
    pub name: Str,
    pub type_params: List<Str>,
    pub type_param_vars: List<Int>,
    pub ty: Type
}

pub struct EffectAliasDef {
    pub name: Str,
    pub type_params: List<Str>,
    pub type_param_vars: List<Int>,
    pub effects: List<EffectExpr>,
    pub span: Span
}

pub struct FnBound {
    pub type_param: Str,
    pub trait_name: Str
}

pub struct SigDef {
    pub name: Str,
    pub members: Map<Str, TypeScheme>,
    pub is_pub: Bool
}

// ============================================================
// Scope
// ============================================================

pub struct Scope {
    pub variables: Map<Str, TypeScheme>
}

// ============================================================
// TypeEnv sub-structs
// ============================================================

pub struct TypeRegistry {
    pub structs: Map<Str, StructDef>,
    // Stable raw-ABI extern definitions. Ordinary nominal aliases may replace
    // the same leaf in `structs`, but must never erase the extern declaration.
    pub extern_structs: Map<Str, StructDef>,
    pub enums: Map<Str, EnumDef>,
    pub effects: Map<Str, EffectDef>,
    pub variant_to_enum: Map<Str, Str>,
    // Exact constructor provenance keyed by the lexical binding DefId. This is
    // a codegen identity table for every variant constructor; ownership
    // freshness is classified separately in shared HIR helpers.
    pub variant_ctor_origins: Map<Int, Str>,
    pub type_aliases: Map<Str, TypeAliasDef>,
    pub sigs: Map<Str, SigDef>,
    pub effect_aliases: Map<Str, EffectAliasDef>,
    // Compact callable descriptors, exact DefId contracts, provenance/solver
    // state and nominal ownership shapes travel as one bundle.
    pub ownership_metadata: OwnershipMetadata
}

pub struct TraitRegistry {
    pub traits: Map<Str, TraitDef>,
    // Exact checker-local DefId minted for the compiler builtin Clone trait.
    // A qualified or shadowing user trait named `Clone` is not this trait.
    pub authoritative_clone_def_id: Int?,
    // Exact checker-local DefId minted for the compiler builtin Drop trait.
    // Imported/user traits named `Drop` do not replace this authority.
    pub authoritative_drop_def_id: Int?,
    pub trait_impls: Map<Str, List<ImplEntry>>,
    pub impl_methods: Map<Str, Map<Str, TypeScheme>>,
    pub method_origins: Map<Str, Map<Str, MethodOrigin>>,
    pub mut_methods: Map<Str, Set<Str>>
}

pub struct ScopeManager {
    pub scopes: List<Scope>,
    pub fn_bounds: Map<Str, List<FnBound>>,
    pub var_bounds: Map<Int, Set<Str>>,
    pub def_spans: Map<Int, Span>,
    pub mutable_vars: Set<Int>,
    pub let_defs: Set<Int>,
    pub mut_param_defs: Set<Int>
}

pub struct IdGen {
    pub next_type_var_id: Int,
    pub next_def_id: Int
}

// ============================================================
// TypeEnv
// ============================================================

pub struct TypeEnv {
    pub types: TypeRegistry,
    pub trait_reg: TraitRegistry,
    pub scope: ScopeManager,
    pub ids: IdGen
}

// ============================================================
// Constructor + helpers
// ============================================================

pub fn mono(ty: Type) -> TypeScheme {
    TypeScheme { ty: ty, type_vars: [], bounds: [], def_id: none }
}

// Allocate one checker-local DefId for an exact callable identity.  Most
// callable identities have a FnType surface scheme, but a const getter is an
// implicit zero-argument call whose scheme describes the stored value instead.
// Both forms must enter the local registry through the same metadata path.
pub fn new_local_callable_identity_scheme(
    mut env: TypeEnv, scheme: TypeScheme, ownership_term: Int,
    source: Int
) -> TypeScheme {
    let def_id = env.fresh_def_id()
    record_callable_ownership(
        env.types.ownership_metadata, def_id, ownership_term, source)
    TypeScheme { ..scheme, def_id: some(def_id) }
}

// The sole constructor for an ordinary FnType scheme that is entering a local
// registry.  DefIds are checker-local declaration identities: imported or
// specialized schemes must never carry a foreign DefId into this map.
pub fn new_local_callable_scheme(
    mut env: TypeEnv, scheme: TypeScheme,
    source: Int
) -> TypeScheme {
    let ownership_term = match scheme.ty {
        Type::FnType { meta, .. } => meta.ownership_term,
        _ => panic("unreachable: local callable scheme is not a function")
    }
    new_local_callable_identity_scheme(
        env, scheme, ownership_term, source)
}

// Replace the contract on an already-local callable without changing its
// declaration identity.  Used by the prelude loader only after it has proven
// the exact unspellable origin of a raw ABI declaration.
pub fn update_local_callable_scheme(
    mut env: TypeEnv, scheme: TypeScheme, ownership_id: Int,
    source: Int
) -> TypeScheme {
    let def_id = match scheme.def_id {
        some(id) => id,
        none => panic("unreachable: local callable scheme has no DefId")
    }
    let updated_type = match scheme.ty {
        Type::FnType { params, return_type, meta } => {
            let params_ = params
            let return_type_ = return_type
            Type::FnType {
                params: params_, return_type: return_type_,
                meta: fn_meta(meta.effects, ownership_id)
            }
        },
        _ => panic("unreachable: local callable scheme is not a function")
    }
    record_callable_ownership(
        env.types.ownership_metadata, def_id, ownership_id,
        source)
    TypeScheme { ..scheme, ty: updated_type }
}

fn freeze_assoc_constraints(
    metadata: OwnershipMetadata, bounds: List<SchemeBound>
) -> List<SchemeBound> {
    let mut frozen: List<SchemeBound> = []
    for bound in bounds {
        frozen.push(SchemeBound { ..bound,
            assoc_constraints: bound.assoc_constraints.map(fn(entry) {
                AssocConstraintEntry { name: entry.name,
                    ty: freeze_callable_ownership_type(
                        metadata, entry.ty) }
            }) })
    }
    frozen
}

pub fn freeze_scheme_ownership(
    metadata: OwnershipMetadata, scheme: TypeScheme
) -> TypeScheme {
    TypeScheme { ..scheme,
        ty: freeze_callable_ownership_type(metadata, scheme.ty),
        bounds: freeze_assoc_constraints(metadata, scheme.bounds) }
}

pub fn freeze_struct_def_ownership(
    metadata: OwnershipMetadata, def: StructDef
) -> StructDef {
    StructDef { ..def, fields: def.fields.map(fn(field) {
        StructField { ..field,
            ty: freeze_callable_ownership_type(metadata, field.ty) }
    }) }
}

pub fn freeze_enum_def_ownership(
    metadata: OwnershipMetadata, def: EnumDef
) -> EnumDef {
    EnumDef { ..def, variants: def.variants.map(fn(variant) {
        EnumVariant { ..variant,
            fields: variant.fields.map(fn(field) {
                freeze_callable_ownership_type(metadata, field)
            }) }
    }) }
}

pub fn freeze_effect_def_ownership(
    metadata: OwnershipMetadata, def: EffectDef
) -> EffectDef {
    EffectDef { ..def, ops: def.ops.map(fn(op) {
        EffectOpDef { ..op,
            params: op.params.map(fn(param) {
                freeze_callable_ownership_type(metadata, param)
            }),
            return_type: freeze_callable_ownership_type(
                metadata, op.return_type) }
    }) }
}

pub fn freeze_trait_def_ownership(
    metadata: OwnershipMetadata, def: TraitDef
) -> TraitDef {
    TraitDef { ..def,
        methods: def.methods.map(fn(method) {
            TraitMethodDef { ..method,
                ty: freeze_callable_ownership_type(metadata, method.ty) }
        }),
        assoc_types: def.assoc_types.map(fn(assoc) {
            AssocTypeDef { ..assoc,
                default_type: match assoc.default_type {
                    some(ty) => some(freeze_callable_ownership_type(
                        metadata, ty)),
                    none => none
                } }
        }) }
}

pub fn freeze_impl_entry_ownership(
    metadata: OwnershipMetadata, impl_: ImplEntry
) -> ImplEntry {
    let mut assoc_types: Map<Str, Type> = map_new()
    for entry in impl_.assoc_types.entries() {
        assoc_types.insert(entry.0,
            freeze_callable_ownership_type(metadata, entry.1))
    }
    let mut methods: Map<Str, TypeScheme> = map_new()
    for entry in impl_.method_schemes.entries() {
        methods.insert(entry.0,
            freeze_scheme_ownership(metadata, entry.1))
    }
    ImplEntry { ..impl_, assoc_types: assoc_types,
        method_schemes: methods }
}

pub fn freeze_sig_def_ownership(
    metadata: OwnershipMetadata, def: SigDef
) -> SigDef {
    let mut members: Map<Str, TypeScheme> = map_new()
    for member in def.members.entries() {
        members.insert(member.0,
            freeze_scheme_ownership(metadata, member.1))
    }
    SigDef { ..def, members: members }
}

// Exhaustive TypeEnv side of the atomic ownership freeze. The first metadata
// bundle is checker-private and resolves terms; frozen_metadata contains only
// exact DefId contracts and no inference UF state.
pub fn freeze_type_env_ownership(
    mut env: TypeEnv, metadata: OwnershipMetadata,
    frozen_metadata: OwnershipMetadata
) {
    for scope in env.scope.scopes {
        for entry in scope.variables.entries() {
            scope.variables.insert(entry.0,
                freeze_scheme_ownership(metadata, entry.1))
        }
    }
    for entry in env.types.structs.entries() {
        env.types.structs.insert(entry.0,
            freeze_struct_def_ownership(metadata, entry.1))
    }
    for entry in env.types.extern_structs.entries() {
        env.types.extern_structs.insert(entry.0,
            freeze_struct_def_ownership(metadata, entry.1))
    }
    for entry in env.types.enums.entries() {
        env.types.enums.insert(entry.0,
            freeze_enum_def_ownership(metadata, entry.1))
    }
    for entry in env.types.effects.entries() {
        env.types.effects.insert(entry.0,
            freeze_effect_def_ownership(metadata, entry.1))
    }
    for entry in env.types.type_aliases.entries() {
        env.types.type_aliases.insert(entry.0,
            TypeAliasDef { ..entry.1,
                ty: freeze_callable_ownership_type(
                    metadata, entry.1.ty) })
    }
    for entry in env.types.sigs.entries() {
        env.types.sigs.insert(entry.0,
            freeze_sig_def_ownership(metadata, entry.1))
    }
    for entry in env.trait_reg.traits.entries() {
        env.trait_reg.traits.insert(entry.0,
            freeze_trait_def_ownership(metadata, entry.1))
    }
    for target in env.trait_reg.impl_methods.entries() {
        let mut methods: Map<Str, TypeScheme> = map_new()
        for method in target.1.entries() {
            methods.insert(method.0,
                freeze_scheme_ownership(metadata, method.1))
        }
        env.trait_reg.impl_methods.insert(target.0, methods)
    }
    for target in env.trait_reg.trait_impls.entries() {
        env.trait_reg.trait_impls.insert(target.0,
            target.1.map(fn(impl_) {
                freeze_impl_entry_ownership(metadata, impl_)
            }))
    }
    env.types.ownership_metadata = frozen_metadata
}

pub fn new_type_env() -> TypeEnv {
    let initial_scope = Scope { variables: map_new() }
    TypeEnv {
        types: TypeRegistry {
            structs: map_new(),
            extern_structs: map_new(),
            enums: map_new(),
            effects: map_new(),
            variant_to_enum: map_new(),
            variant_ctor_origins: map_new(),
            type_aliases: map_new(),
            sigs: map_new(),
            effect_aliases: map_new(),
            ownership_metadata: new_ownership_metadata()
        },
        trait_reg: TraitRegistry {
            traits: map_new(),
            authoritative_clone_def_id: none,
            authoritative_drop_def_id: none,
            trait_impls: map_new(),
            impl_methods: map_new(),
            method_origins: map_new(),
            mut_methods: map_new()
        },
        scope: ScopeManager {
            scopes: [initial_scope],
            fn_bounds: map_new(),
            var_bounds: map_new(),
            def_spans: map_new(),
            mutable_vars: set_new(),
            let_defs: set_new(),
            mut_param_defs: set_new()
        },
        ids: IdGen {
            next_type_var_id: 0,
            next_def_id: 0
        }
    }
}

// ============================================================
// TypeEnv methods
// ============================================================

impl TypeEnv {
    pub fn current_var_id(self) -> Int { self.ids.next_type_var_id }

    pub fn fresh_var(mut self) -> Type {
        let id = self.ids.next_type_var_id
        self.ids.next_type_var_id = id + 1
        Type::TypeVar { id: id, name: none }
    }

    pub fn fresh_var_id(mut self) -> Int {
        let id = self.ids.next_type_var_id
        self.ids.next_type_var_id = id + 1
        id
    }

    pub fn fresh_def_id(mut self) -> Int {
        let id = self.ids.next_def_id
        self.ids.next_def_id = id + 1
        id
    }

    pub fn push_scope(mut self) {
        self.scope.scopes.push(Scope { variables: map_new() })
    }

    pub fn pop_scope(mut self) {
        if self.scope.scopes.len() <= 1 {
            panic("unreachable: cannot pop global scope")
        }
        self.scope.scopes.pop()
    }

    pub fn bind(mut self, name: Str, scheme: TypeScheme) {
        let s = match scheme.def_id {
            some(_) => scheme,
            none => TypeScheme { ..scheme, def_id: some(self.fresh_def_id()) }
        }
        let idx = self.scope.scopes.len() - 1
        match self.scope.scopes.get(idx) {
            some(scope) => scope.variables.insert(name, s),
            none => panic("unreachable: no current scope")
        }
    }

    pub fn bind_mono(mut self, name: Str, ty: Type) {
        let ty_ = ty
        self.bind(name, mono(ty_))
    }

    pub fn record_def_span(mut self, def_id: Int, span: Span) {
        self.scope.def_spans.insert(def_id, span)
    }

    pub fn rebind(mut self, name: Str, scheme: TypeScheme) {
        let mut i = self.scope.scopes.len() - 1
        while i >= 0 {
            match self.scope.scopes.get(i) {
                some(scope) => {
                    if scope.variables.contains_key(name) {
                        scope.variables.insert(name, scheme)
                        return
                    }
                },
                none => {}
            }
            i = i - 1
        }
        panic("unreachable: rebind failed — variable '${name}' not found in any scope")
    }

    pub fn lookup(self, name: Str) -> TypeScheme? {
        let mut i = self.scope.scopes.len() - 1
        while i >= 0 {
            let found = match self.scope.scopes.get(i) {
                some(scope) => scope.variables.get(name),
                none => none
            }
            if found.is_some() { return found }
            i = i - 1
        }
        none
    }

    pub fn instantiate(mut self, scheme: TypeScheme) -> Type {
        if scheme.type_vars.len() == 0 { return scheme.ty }
        let mut mapping: Map<Int, Type> = map_new()
        for tv in scheme.type_vars {
            let type_var = tv
            mapping.insert(type_var, self.fresh_var())
        }
        for bound in scheme.bounds {
            match mapping.get(bound.type_var) {
                some(fresh) => match fresh {
                    Type::TypeVar { id, .. } => {
                        let mut existing: Set<Str> = match self.scope.var_bounds.get(id) {
                            some(s) => s,
                            none => set_new()
                        }
                        existing.insert(bound.trait_name)
                        let bound_id = id
                        self.scope.var_bounds.insert(bound_id, existing)
                    },
                    _ => {}
                },
                none => {}
            }
        }
        apply_subst_map(mapping, scheme.ty)
    }
}

// ============================================================
// trait_impls helpers (Map<Str, List<ImplEntry>> keyed by target_type_name)
// ============================================================

pub fn impl_origin(
    target_type_name: Str, trait_name: Str?, span: Span
) -> Str {
    let trait_part = match trait_name {
        some(name) => name,
        none => "<inherent>"
    }
    "${span.file}:${span.start.offset.to_str()}:${target_type_name}:${trait_part}"
}

fn path_has_suffix(path: Str, suffix: Str) -> Bool {
    let normalized = path.replace("\\", "/")
    if normalized.len() < suffix.len() { return false }
    normalized.slice(normalized.len() - suffix.len(), normalized.len()) == suffix
}

// List/Map/Set HOF schemes are compiler predeclarations for the matching
// standard-library impl blocks. Give the declaration and definition one
// stable source identity so the definition may rebind its inferred effects
// without weakening duplicate detection for any user impl block.
pub fn impl_decl_origin(
    target_type_name: Str, trait_name: Str?,
    type_params: List<TypeParam>, span: Span
) -> Str {
    if trait_name.is_none() {
        let has_bounds = type_params.any(fn(param) {
            param.bounds.len() > 0
        })
        if target_type_name == "List" && !has_bounds &&
           path_has_suffix(span.file, "std/list.ring") {
            return "<std-predecl>:List:unbounded"
        }
        if target_type_name == "Map" &&
           path_has_suffix(span.file, "std/map.ring") {
            if has_bounds {
                return "<std-predecl>:Map:bounded"
            }
            return "<std-predecl>:Map:unbounded"
        }
        if target_type_name == "Set" &&
           path_has_suffix(span.file, "std/set.ring") {
            if has_bounds {
                return "<std-predecl>:Set:bounded"
            }
            return "<std-predecl>:Set:unbounded"
        }
    }
    impl_origin(target_type_name, trait_name, span)
}

pub fn impl_method_origin(impl_origin_: Str, method_name: Str) -> Str {
    "${impl_origin_}::${method_name}"
}

fn method_owner_display(trait_name: Str?) -> Str {
    match trait_name {
        some(name) => "trait '${nominal_display_name(name)}'",
        none => "an inherent impl"
    }
}

// The sole writer for the ordinary method lookup table and its provenance.
// Re-export hydration may replay the same origin, but no distinct source may
// replace an existing same-target/same-name identity.
pub fn install_method_scheme(
    mut reg: TraitRegistry, mut sink: CollectingSink,
    target_type: Str, method_name: Str,
    scheme: TypeScheme, incoming: MethodOrigin
) -> Bool {
    let mut methods = match reg.impl_methods.get(target_type) {
        some(existing) => existing,
        none => {
            let created: Map<Str, TypeScheme> = map_new()
            let stored_methods = created
            let target_key = target_type
            reg.impl_methods.insert(target_key, stored_methods)
            created
        }
    }
    let mut origins = match reg.method_origins.get(target_type) {
        some(existing) => existing,
        none => {
            let created: Map<Str, MethodOrigin> = map_new()
            let stored_origins = created
            let target_key = target_type
            reg.method_origins.insert(target_key, stored_origins)
            created
        }
    }

    match origins.get(method_name) {
        some(existing) => {
            if existing.origin == incoming.origin {
                if existing.is_authoritative_drop !=
                   incoming.is_authoritative_drop {
                    panic(
                        "unreachable: same-origin method destructor role differs")
                }
                let scheme_key = method_name
                let origin_key = method_name
                let stored_scheme = scheme
                let stored_origin = incoming
                methods.insert(scheme_key, stored_scheme)
                origins.insert(origin_key, stored_origin)
                true
            } else {
                let old_owner = method_owner_display(existing.trait_name)
                let new_owner = method_owner_display(incoming.trait_name)
                sink.report(make_diag(
                    E0504, Severity::SevError,
                    "Ambiguous method '${method_name}' on '${nominal_display_name(target_type)}': provided by ${old_owner} and ${new_owner}",
                    incoming.span,
                    DiagnosticContext::TraitError {
                        detail: "same-target method origins must be unique"
                    }))
                false
            }
        },
        none => {
            if methods.contains_key(method_name) {
                // A scheme without provenance cannot be proven identical to
                // the incoming method. Preserve the prior recovery view.
                sink.report(make_diag(
                    E0504, Severity::SevError,
                    "Ambiguous method '${method_name}' on '${nominal_display_name(target_type)}': existing method identity has no stable origin",
                    incoming.span,
                    DiagnosticContext::TraitError {
                        detail: "method scheme is missing origin provenance"
                    }))
                false
            } else {
                let scheme_key = method_name
                let origin_key = method_name
                let stored_scheme = scheme
                let stored_origin = incoming
                methods.insert(scheme_key, stored_scheme)
                origins.insert(origin_key, stored_origin)
                true
            }
        }
    }
}

pub fn add_impl(mut reg: TraitRegistry, entry: ImplEntry) {
    match reg.trait_impls.get(entry.target_type_name) {
        some(impls) => {
            // The same exported impl may arrive through both its defining
            // module and one or more facades.  Preserve one exact entry while
            // retaining genuinely distinct, already-diagnosed collisions for
            // checker recovery.
            let same_origin = impls.find(fn(i) {
                i.origin == entry.origin
            })
            match same_origin {
                some(existing) => if existing.is_authoritative_drop !=
                        entry.is_authoritative_drop {
                    panic(
                        "unreachable: same-origin impl destructor role differs")
                },
                none => {
                    let stored_entry = entry
                    impls.push(stored_entry)
                }
            }
        },
        none => {
            let mut list: List<ImplEntry> = []
            let target_key = entry.target_type_name
            let stored_entry = entry
            list.push(stored_entry)
            reg.trait_impls.insert(target_key, list)
        }
    }
}

pub fn has_impl(reg: TraitRegistry, type_name: Str, trait_name: Str) -> Bool {
    match reg.trait_impls.get(type_name) {
        some(impls) => impls.any(fn(i) { i.trait_name == trait_name }),
        none => false
    }
}

pub fn find_impl(reg: TraitRegistry, type_name: Str, trait_name: Str) -> ImplEntry? {
    match reg.trait_impls.get(type_name) {
        some(impls) => impls.find(fn(i) { i.trait_name == trait_name }),
        none => none
    }
}

pub fn find_impl_by_origin(
    reg: TraitRegistry, type_name: Str, origin: Str
) -> ImplEntry? {
    match reg.trait_impls.get(type_name) {
        some(impls) => impls.find(fn(i) { i.origin == origin }),
        none => none
    }
}

// ============================================================
// Map-based substitution: apply a local Map<Int, Type> mapping to a type.
// Used for local type parameter instantiation maps (not the global substitution).
// ============================================================

fn chase_type_var_map(subst: Map<Int, Type>, id: Int, depth: Int) -> Type {
    if depth > 100 { return Type::TypeVar { id: id, name: none } }
    match subst.get(id) {
        some(resolved) => match resolved {
            Type::TypeVar { id: next_id, .. } => chase_type_var_map(subst, next_id, depth + 1),
            _ => apply_subst_map(subst, resolved)
        },
        none => Type::TypeVar { id: id, name: none }
    }
}

pub fn apply_subst_map(subst: Map<Int, Type>, t: Type) -> Type {
    match t {
        Type::IntType => Type::IntType,
        Type::FloatType => Type::FloatType,
        Type::StrType => Type::StrType,
        Type::BoolType => Type::BoolType,
        Type::UnitType => Type::UnitType,
        Type::NeverType => Type::NeverType,
        Type::AnyType => Type::AnyType,
        Type::TypeVar { id, .. } => chase_type_var_map(subst, id, 0),
        Type::FnType { params, return_type, meta } => {
            let mut mapped_params: List<Type> = []
            for p in params {
                let param_ = p
                mapped_params.push(apply_subst_map(subst, param_))
            }
            let return_type_ = return_type
            let effects_ = meta.effects
            Type::FnType {
                params: mapped_params,
                return_type: apply_subst_map(subst, return_type_),
                meta: FnMeta {
                    effects: apply_subst_row_map(subst, effects_),
                    ownership_term: meta.ownership_term
                }
            }
        },
        Type::StructType { type_params, .. } => {
            let mut mapped_params: List<Type> = []
            for p in type_params {
                let param_ = p
                mapped_params.push(apply_subst_map(subst, param_))
            }
            Type::StructType { ..t, type_params: mapped_params }
        },
        Type::EnumType { type_params, .. } => {
            let mut mapped_params: List<Type> = []
            for p in type_params {
                let param_ = p
                mapped_params.push(apply_subst_map(subst, param_))
            }
            Type::EnumType { ..t, type_params: mapped_params }
        },
        Type::GenericType { base, args } => {
            let base_ = base
            let new_base = apply_subst_map(subst, base_)
            let mut mapped_args: List<Type> = []
            for a in args {
                let arg_ = a
                mapped_args.push(apply_subst_map(subst, arg_))
            }
            Type::GenericType { base: new_base, args: mapped_args }
        },
        Type::RecordType { fields, tail, tail_name } => {
            let mut mapped_fields: List<RecordField> = []
            for f in fields {
                let field_name = f.name
                let field_type = f.ty
                mapped_fields.push(RecordField { name: field_name,
                    ty: apply_subst_map(subst, field_type) })
            }
            match tail {
                some(t_id) => match subst.get(t_id) {
                    some(resolved) => {
                        let resolved_ = resolved
                        let chased = apply_subst_map(subst, resolved_)
                        match chased {
                            Type::TypeVar { id: new_id, name: new_name } => {
                                let result_fields = mapped_fields
                                let result_id = new_id
                                let result_name = new_name
                                Type::RecordType { fields: result_fields,
                                    tail: some(result_id),
                                    tail_name: result_name }
                            },
                            Type::RecordType { fields: extra_fields, tail: extra_tail, tail_name: extra_tn } => {
                                let mut all_fields = list_clone(mapped_fields)
                                for ef in extra_fields {
                                    let field_name = ef.name
                                    let field_type = ef.ty
                                    all_fields.push(RecordField {
                                        name: field_name,
                                        ty: apply_subst_map(subst, field_type) })
                                }
                                let result_tail = extra_tail
                                let result_tail_name = extra_tn
                                Type::RecordType { fields: all_fields,
                                    tail: result_tail,
                                    tail_name: result_tail_name }
                            },
                            _ => {
                                let result_fields = mapped_fields
                                Type::RecordType { fields: result_fields,
                                    tail: none, tail_name: none }
                            }
                        }
                    },
                    none => {
                        let result_fields = mapped_fields
                        let result_id = t_id
                        let result_name = tail_name
                        Type::RecordType { fields: result_fields,
                            tail: some(result_id), tail_name: result_name }
                    }
                },
                none => {
                    let result_fields = mapped_fields
                    let result_name = tail_name
                    Type::RecordType { fields: result_fields,
                        tail: none, tail_name: result_name }
                }
            }
        },
        Type::EffectRowType { effects, tail } => {
            let effects_ = effects
            let tail_ = tail
            let row = apply_subst_row_map(subst,
                EffectRow { effects: effects_, tail: tail_ })
            let result_effects = row.effects
            let result_tail = row.tail
            Type::EffectRowType { effects: result_effects, tail: result_tail }
        },
        Type::TupleType { elements } => {
            let mut mapped_elements: List<Type> = []
            for e in elements {
                let element_ = e
                mapped_elements.push(apply_subst_map(subst, element_))
            }
            Type::TupleType { elements: mapped_elements }
        },
        Type::PtrType { pointee } => {
            let pointee_ = pointee
            Type::PtrType { pointee: apply_subst_map(subst, pointee_) }
        },
        Type::ErrorType => Type::ErrorType
    }
}

pub fn apply_subst_effect_map(subst: Map<Int, Type>, e: Effect) -> Effect {
    match e {
        Effect::FailEffect { error_type } => {
            let error_type_ = error_type
            Effect::FailEffect {
                error_type: apply_subst_map(subst, error_type_) }
        },
        Effect::MutEffect { state_type } => {
            let state_type_ = state_type
            Effect::MutEffect {
                state_type: apply_subst_map(subst, state_type_) }
        },
        Effect::CustomEffect { type_args, .. } => {
            let mut mapped_args: List<Type> = []
            for a in type_args {
                let arg_ = a
                mapped_args.push(apply_subst_map(subst, arg_))
            }
            Effect::CustomEffect { ..e, type_args: mapped_args }
        },
        Effect::IoEffect => Effect::IoEffect,
        Effect::UnsafeEffect => Effect::UnsafeEffect
    }
}

pub fn apply_subst_row_map(subst: Map<Int, Type>, row: EffectRow) -> EffectRow {
    let mut effects: List<Effect> = []
    for e in row.effects {
        let effect_ = e
        effects.push(apply_subst_effect_map(subst, effect_))
    }
    match row.tail {
        some(t_id) => match subst.get(t_id) {
            some(resolved) => {
                let resolved_ = resolved
                let chased = apply_subst_map(subst, resolved_)
                match chased {
                    Type::TypeVar { id: new_id, .. } => {
                        let result_effects = effects
                        let result_id = new_id
                        EffectRow { effects: result_effects,
                            tail: some(result_id) }
                    },
                    Type::EffectRowType { effects: extra_effs, tail: extra_tail } => {
                        let mut merged = list_clone(effects)
                        for ee in extra_effs {
                            let effect_ = ee
                            merged.push(apply_subst_effect_map(subst, effect_))
                        }
                        let result_tail = extra_tail
                        EffectRow { effects: merged, tail: result_tail }
                    },
                    _ => {
                        let result_effects = effects
                        EffectRow { effects: result_effects, tail: none }
                    }
                }
            },
            none => {
                let result_effects = effects
                let result_id = t_id
                EffectRow { effects: result_effects, tail: some(result_id) }
            }
        },
        none => {
            let result_effects = effects
            EffectRow { effects: result_effects, tail: none }
        }
    }
}

// ============================================================
// Shared structural TypeVar mapping
// ============================================================

fn collect_effect_var_mappings(
    metadata: OwnershipMetadata,
    source_row: EffectRow, target_row: EffectRow,
    source_vars: Set<Int>, mut result: Map<Int, Type>
) {
    match (source_row.tail, target_row.tail) {
        (some(source_id), some(target_id)) => {
            if source_vars.contains(source_id) {
                let mapping_key = source_id
                let mapping_target = target_id
                result.insert(mapping_key, Type::TypeVar {
                    id: mapping_target, name: none
                })
            }
        },
        _ => {}
    }

    for source_effect in source_row.effects {
        for target_effect in target_row.effects {
            let compare_source = source_effect
            let compare_target = target_effect
            let match_source = source_effect
            let match_target = target_effect
            if effects_match_kind_with_ownership(
                metadata, compare_source, compare_target
            ) {
                match (match_source, match_target) {
                    (Effect::FailEffect { error_type: source_type },
                     Effect::FailEffect { error_type: target_type }) => {
                        let source_type_ = source_type
                        let target_type_ = target_type
                        collect_var_mappings(
                            metadata, source_type_, target_type_,
                            source_vars, result)
                    },
                    (Effect::MutEffect { state_type: source_type },
                     Effect::MutEffect { state_type: target_type }) => {
                        let source_type_ = source_type
                        let target_type_ = target_type
                        collect_var_mappings(
                            metadata, source_type_, target_type_,
                            source_vars, result)
                    },
                    (Effect::CustomEffect { type_args: source_args, .. },
                     Effect::CustomEffect { type_args: target_args, .. }) => {
                        let mut i = 0
                        while i < source_args.len() && i < target_args.len() {
                            match (source_args.get(i), target_args.get(i)) {
                                (some(source_arg), some(target_arg)) => {
                                    let source_arg_ = source_arg
                                    let target_arg_ = target_arg
                                    collect_var_mappings(
                                        metadata,
                                        source_arg_, target_arg_,
                                        source_vars, result)
                                },
                                _ => {}
                            }
                            i = i + 1
                        }
                    },
                    _ => {}
                }
            }
        }
    }
}

fn collect_var_mappings(
    metadata: OwnershipMetadata,
    source_type: Type, target_type: Type,
    source_vars: Set<Int>, mut result: Map<Int, Type>
) {
    match source_type {
        Type::TypeVar { id, .. } => {
            if source_vars.contains(id) {
                let mapping_key = id
                let mapping_type = target_type
                result.insert(mapping_key, mapping_type)
            }
        },
        Type::StructType { name: source_name, type_params: source_params } =>
            match target_type {
                Type::StructType {
                    name: target_name, type_params: target_params
                } => {
                    if source_name == target_name {
                        let mut i = 0
                        while i < source_params.len() && i < target_params.len() {
                            match (source_params.get(i), target_params.get(i)) {
                                (some(source_param), some(target_param)) => {
                                    let source_param_ = source_param
                                    let target_param_ = target_param
                                    collect_var_mappings(
                                        metadata,
                                        source_param_, target_param_,
                                        source_vars, result)
                                },
                                _ => {}
                            }
                            i = i + 1
                        }
                    }
                },
                _ => {}
            },
        Type::EnumType { name: source_name, type_params: source_params } =>
            match target_type {
                Type::EnumType {
                    name: target_name, type_params: target_params
                } => {
                    if source_name == target_name {
                        let mut i = 0
                        while i < source_params.len() && i < target_params.len() {
                            match (source_params.get(i), target_params.get(i)) {
                                (some(source_param), some(target_param)) => {
                                    let source_param_ = source_param
                                    let target_param_ = target_param
                                    collect_var_mappings(
                                        metadata,
                                        source_param_, target_param_,
                                        source_vars, result)
                                },
                                _ => {}
                            }
                            i = i + 1
                        }
                    }
                },
                _ => {}
            },
        Type::FnType {
            params: source_params, return_type: source_return,
            meta: source_meta
        } => match target_type {
            Type::FnType {
                params: target_params, return_type: target_return,
                meta: target_meta
            } => {
                let mut i = 0
                while i < source_params.len() && i < target_params.len() {
                    match (source_params.get(i), target_params.get(i)) {
                        (some(source_param), some(target_param)) => {
                            let source_param_ = source_param
                            let target_param_ = target_param
                            collect_var_mappings(
                                metadata,
                                source_param_, target_param_,
                                source_vars, result)
                        },
                        _ => {}
                    }
                    i = i + 1
                }
                let source_return_ = source_return
                let target_return_ = target_return
                collect_var_mappings(
                    metadata, source_return_, target_return_,
                    source_vars, result)
                let source_effects = source_meta.effects
                let target_effects = target_meta.effects
                collect_effect_var_mappings(
                    metadata,
                    source_effects, target_effects, source_vars, result)
            },
            _ => {}
        },
        Type::TupleType { elements: source_elements } => match target_type {
            Type::TupleType { elements: target_elements } => {
                let mut i = 0
                while i < source_elements.len() && i < target_elements.len() {
                    match (source_elements.get(i), target_elements.get(i)) {
                        (some(source_element), some(target_element)) => {
                            let source_element_ = source_element
                            let target_element_ = target_element
                            collect_var_mappings(
                                metadata,
                                source_element_, target_element_,
                                source_vars, result)
                        },
                        _ => {}
                    }
                    i = i + 1
                }
            },
            _ => {}
        },
        Type::GenericType { base: source_base, args: source_args } =>
            match target_type {
                Type::GenericType { base: target_base, args: target_args } => {
                    let source_base_ = source_base
                    let target_base_ = target_base
                    collect_var_mappings(
                        metadata, source_base_, target_base_,
                        source_vars, result)
                    let mut i = 0
                    while i < source_args.len() && i < target_args.len() {
                        match (source_args.get(i), target_args.get(i)) {
                            (some(source_arg), some(target_arg)) => {
                                let source_arg_ = source_arg
                                let target_arg_ = target_arg
                                collect_var_mappings(
                                    metadata,
                                    source_arg_, target_arg_,
                                    source_vars, result)
                            },
                            _ => {}
                        }
                        i = i + 1
                    }
                },
                _ => {}
            },
        Type::RecordType { fields: source_fields, tail: source_tail, .. } =>
            match target_type {
                Type::RecordType { fields: target_fields, tail: target_tail, .. } => {
                    for source_field in source_fields {
                        match target_fields.find(fn(field) {
                            field.name == source_field.name
                        }) {
                            some(target_field) => {
                                let source_field_type = source_field.ty
                                let target_field_type = target_field.ty
                                collect_var_mappings(
                                    metadata,
                                    source_field_type, target_field_type,
                                    source_vars, result)
                            },
                            none => {}
                        }
                    }
                    let source_tail_ = source_tail
                    let target_tail_ = target_tail
                    match (source_tail_, target_tail_) {
                        (some(source_id), some(target_id)) => {
                            if source_vars.contains(source_id) {
                                let mapping_key = source_id
                                let mapping_target = target_id
                                result.insert(mapping_key, Type::TypeVar {
                                    id: mapping_target, name: none
                                })
                            }
                        },
                        _ => {}
                    }
                },
                _ => {}
            },
        Type::PtrType { pointee: source_pointee } => match target_type {
            Type::PtrType { pointee: target_pointee } => {
                let source_pointee_ = source_pointee
                let target_pointee_ = target_pointee
                collect_var_mappings(
                    metadata, source_pointee_, target_pointee_,
                    source_vars, result)
            },
            _ => {}
        },
        Type::EffectRowType {
            effects: source_effects, tail: source_tail
        } => match target_type {
            Type::EffectRowType {
                effects: target_effects, tail: target_tail
            } => {
                let source_effects_ = source_effects
                let source_tail_ = source_tail
                let target_effects_ = target_effects
                let target_tail_ = target_tail
                collect_effect_var_mappings(
                    metadata,
                    EffectRow { effects: source_effects_, tail: source_tail_ },
                    EffectRow { effects: target_effects_, tail: target_tail_ },
                    source_vars, result)
            },
            _ => {}
        },
        _ => {}
    }
}

pub fn build_type_var_map(
    metadata: OwnershipMetadata,
    source_type: Type, target_type: Type, source_var_ids: List<Int>
) -> Map<Int, Type> {
    let mut result: Map<Int, Type> = map_new()
    let source_type_ = source_type
    let target_type_ = target_type
    let source_var_ids_ = source_var_ids
    collect_var_mappings(
        metadata, source_type_, target_type_,
        set_from(source_var_ids_), result)
    result
}

pub fn build_scheme_var_map(
    metadata: OwnershipMetadata,
    scheme: TypeScheme, instantiated_type: Type
) -> Map<Int, Type> {
    let scheme_type = scheme.ty
    let scheme_vars = scheme.type_vars
    let instantiated_type_ = instantiated_type
    build_type_var_map(
        metadata, scheme_type, instantiated_type_, scheme_vars)
}

fn collect_type_var_ids(t: Type, mut result: Set<Int>) {
    match t {
        Type::TypeVar { id, .. } => {
            let type_var_id = id
            result.insert(type_var_id)
        },
        Type::FnType { params, return_type, meta } => {
            for param in params { collect_type_var_ids(param, result) }
            collect_type_var_ids(return_type, result)
            match meta.effects.tail {
                some(id) => {
                    let effect_var_id = id
                    result.insert(effect_var_id)
                },
                none => {}
            }
            for eff in meta.effects.effects {
                match eff {
                    Effect::FailEffect { error_type } =>
                        collect_type_var_ids(error_type, result),
                    Effect::MutEffect { state_type } =>
                        collect_type_var_ids(state_type, result),
                    Effect::CustomEffect { type_args, .. } => {
                        for arg in type_args { collect_type_var_ids(arg, result) }
                    },
                    _ => {}
                }
            }
        },
        Type::StructType { type_params, .. } => {
            for param in type_params { collect_type_var_ids(param, result) }
        },
        Type::EnumType { type_params, .. } => {
            for param in type_params { collect_type_var_ids(param, result) }
        },
        Type::GenericType { base, args } => {
            collect_type_var_ids(base, result)
            for arg in args { collect_type_var_ids(arg, result) }
        },
        Type::RecordType { fields, tail, .. } => {
            for field in fields { collect_type_var_ids(field.ty, result) }
            match tail {
                some(id) => {
                    let row_var_id = id
                    result.insert(row_var_id)
                },
                none => {}
            }
        },
        Type::TupleType { elements } => {
            for element in elements { collect_type_var_ids(element, result) }
        },
        Type::PtrType { pointee } => collect_type_var_ids(pointee, result),
        Type::EffectRowType { effects, tail } => {
            match tail {
                some(id) => {
                    let effect_var_id = id
                    result.insert(effect_var_id)
                },
                none => {}
            }
            for eff in effects {
                match eff {
                    Effect::FailEffect { error_type } =>
                        collect_type_var_ids(error_type, result),
                    Effect::MutEffect { state_type } =>
                        collect_type_var_ids(state_type, result),
                    Effect::CustomEffect { type_args, .. } => {
                        for arg in type_args { collect_type_var_ids(arg, result) }
                    },
                    _ => {}
                }
            }
        },
        _ => {}
    }
}

// Specialize a trait declaration method for one concrete/generic impl owner.
// Default methods and built-in impl entries share this exact construction.
pub fn specialize_trait_method_scheme(
    metadata: OwnershipMetadata,
    trait_def: TraitDef, method: TraitMethodDef,
    self_type: Type, trait_type_args: List<Type>,
    impl_type_vars: List<Int>, assoc_types: Map<Str, Type>,
    bounds: List<SchemeBound>
) -> TypeScheme {
    let mut mapping: Map<Int, Type> = map_new()
    match method.ty {
        Type::FnType { params, .. } => match params.first() {
            some(receiver) => {
                let mut receiver_vars: Set<Int> = set_new()
                collect_type_var_ids(receiver, receiver_vars)
                let receiver_map = build_type_var_map(
                    metadata, receiver, self_type,
                    receiver_vars.to_list())
                let mut receiver_ids = receiver_map.keys()
                receiver_ids.sort()
                for id in receiver_ids {
                    match receiver_map.get(id) {
                        some(mapped) => {
                            let mapping_id = id
                            let mapping_type = mapped
                            mapping.insert(mapping_id, mapping_type)
                        },
                        none => {}
                    }
                }
            },
            none => {}
        },
        _ => {}
    }

    let mut trait_index = 0
    while trait_index < trait_def.type_params.len() &&
          trait_index < trait_def.type_param_vars.len() &&
          trait_index < trait_type_args.len() {
        match (trait_def.type_param_vars.get(trait_index),
               trait_type_args.get(trait_index)) {
            (some(source_id), some(target_type)) => {
                let mapping_id = source_id
                let mapping_type = target_type
                mapping.insert(mapping_id, mapping_type)
            },
            _ => {}
        }
        trait_index = trait_index + 1
    }
    for assoc_def in trait_def.assoc_types {
        match assoc_types.get(assoc_def.name) {
            some(concrete) => {
                let mapping_id = assoc_def.var_id
                let mapping_type = concrete
                mapping.insert(mapping_id, mapping_type)
            },
            none => {}
        }
    }

    let specialized_type = apply_subst_map(mapping, method.ty)
    let mut quantified = list_clone(impl_type_vars)
    let mut remaining: Set<Int> = set_new()
    collect_type_var_ids(specialized_type, remaining)
    let mut remaining_ids = remaining.to_list()
    remaining_ids.sort()
    for id in remaining_ids {
        if !quantified.contains(id) {
            let quantified_id = id
            quantified.push(quantified_id)
        }
    }
    TypeScheme {
        ty: specialized_type,
        type_vars: quantified,
        bounds: bounds,
        def_id: none
    }
}

// ============================================================
// Union-Find substitution: apply UnionFind-based substitution to a type.
// This is the primary apply_subst used by the type inference engine.
// Uses uf_find for O(alpha(n)) path-compressed type variable resolution.
// ============================================================

pub fn apply_subst(subst: UnionFind, t: Type) -> Type {
    match t {
        Type::IntType => Type::IntType,
        Type::FloatType => Type::FloatType,
        Type::StrType => Type::StrType,
        Type::BoolType => Type::BoolType,
        Type::UnitType => Type::UnitType,
        Type::NeverType => Type::NeverType,
        Type::AnyType => Type::AnyType,
        Type::TypeVar { id, name } => match uf_lookup(subst, id) {
            some(resolved) => apply_subst(subst, resolved),
            none => {
                // Always construct a new TypeVar to avoid returning borrowed `t`.
                // Perceus treats Call results as owned and inserts scope-end Drop;
                // returning the borrowed parameter `t` would cause UAF on the
                // original holder (UF table / effect list).
                let root = uf_find(subst, id)
                let result_name = name
                Type::TypeVar { id: root, name: result_name }
            }
        },
        Type::FnType { params, return_type, meta } => {
            let mut mapped_params: List<Type> = []
            for p in params {
                let param_ = p
                mapped_params.push(apply_subst(subst, param_))
            }
            let return_type_ = return_type
            let effects_ = meta.effects
            Type::FnType {
                params: mapped_params,
                return_type: apply_subst(subst, return_type_),
                meta: FnMeta {
                    effects: apply_subst_row(subst, effects_),
                    ownership_term: meta.ownership_term
                }
            }
        },
        Type::StructType { type_params, .. } => {
            let mut mapped_params: List<Type> = []
            for p in type_params {
                let param_ = p
                mapped_params.push(apply_subst(subst, param_))
            }
            Type::StructType { ..t, type_params: mapped_params }
        },
        Type::EnumType { type_params, .. } => {
            let mut mapped_params: List<Type> = []
            for p in type_params {
                let param_ = p
                mapped_params.push(apply_subst(subst, param_))
            }
            Type::EnumType { ..t, type_params: mapped_params }
        },
        Type::GenericType { base, args } => {
            let base_ = base
            let new_base = apply_subst(subst, base_)
            let mut mapped_args: List<Type> = []
            for a in args {
                let arg_ = a
                mapped_args.push(apply_subst(subst, arg_))
            }
            Type::GenericType { base: new_base, args: mapped_args }
        },
        Type::RecordType { fields, tail, tail_name } => {
            let mut mapped_fields: List<RecordField> = []
            for f in fields {
                let field_name = f.name
                let field_type = f.ty
                mapped_fields.push(RecordField { name: field_name,
                    ty: apply_subst(subst, field_type) })
            }
            match tail {
                some(t_id) => {
                    let root_id = uf_find(subst, t_id)
                    match uf_lookup(subst, root_id) {
                        some(resolved) => {
                            let resolved_ = resolved
                            let chased = apply_subst(subst, resolved_)
                            match chased {
                                Type::TypeVar { id: new_id, name: new_name } => {
                                    let result_fields = mapped_fields
                                    let result_id = new_id
                                    let result_name = new_name
                                    Type::RecordType { fields: result_fields,
                                        tail: some(result_id),
                                        tail_name: result_name }
                                },
                                Type::RecordType { fields: extra_fields, tail: extra_tail, tail_name: extra_tn } => {
                                    let mut all_fields = list_clone(mapped_fields)
                                    for ef in extra_fields {
                                        let field_name = ef.name
                                        let field_type = ef.ty
                                        all_fields.push(RecordField {
                                            name: field_name,
                                            ty: apply_subst(subst, field_type) })
                                    }
                                    let result_tail = extra_tail
                                    let result_tail_name = extra_tn
                                    Type::RecordType { fields: all_fields,
                                        tail: result_tail,
                                        tail_name: result_tail_name }
                                },
                                _ => {
                                    let result_fields = mapped_fields
                                    Type::RecordType { fields: result_fields,
                                        tail: none, tail_name: none }
                                }
                            }
                        },
                        none => {
                            let actual_id = if root_id == t_id { t_id } else { root_id }
                            let result_fields = mapped_fields
                            let result_id = actual_id
                            let result_name = tail_name
                            Type::RecordType { fields: result_fields,
                                tail: some(result_id), tail_name: result_name }
                        }
                    }
                },
                none => {
                    let result_fields = mapped_fields
                    let result_name = tail_name
                    Type::RecordType { fields: result_fields,
                        tail: none, tail_name: result_name }
                }
            }
        },
        Type::EffectRowType { effects, tail } => {
            let effects_ = effects
            let tail_ = tail
            let row = apply_subst_row(subst,
                EffectRow { effects: effects_, tail: tail_ })
            let result_effects = row.effects
            let result_tail = row.tail
            Type::EffectRowType { effects: result_effects, tail: result_tail }
        },
        Type::TupleType { elements } => {
            let mut mapped_elements: List<Type> = []
            for e in elements {
                let element_ = e
                mapped_elements.push(apply_subst(subst, element_))
            }
            Type::TupleType { elements: mapped_elements }
        },
        Type::PtrType { pointee } => {
            let pointee_ = pointee
            Type::PtrType { pointee: apply_subst(subst, pointee_) }
        },
        Type::ErrorType => Type::ErrorType
    }
}

fn apply_subst_effect(subst: UnionFind, e: Effect) -> Effect {
    match e {
        Effect::FailEffect { error_type } => {
            let error_type_ = error_type
            Effect::FailEffect { error_type: apply_subst(subst, error_type_) }
        },
        Effect::MutEffect { state_type } => {
            let state_type_ = state_type
            Effect::MutEffect { state_type: apply_subst(subst, state_type_) }
        },
        Effect::CustomEffect { type_args, .. } => {
            let mut mapped_args: List<Type> = []
            for a in type_args {
                let arg_ = a
                mapped_args.push(apply_subst(subst, arg_))
            }
            Effect::CustomEffect { ..e, type_args: mapped_args }
        },
        Effect::IoEffect => Effect::IoEffect,
        Effect::UnsafeEffect => Effect::UnsafeEffect
    }
}

pub fn apply_subst_row(subst: UnionFind, row: EffectRow) -> EffectRow {
    let mut effects: List<Effect> = []
    for e in row.effects {
        let effect_ = e
        effects.push(apply_subst_effect(subst, effect_))
    }
    match row.tail {
        some(t_id) => {
            let root_id = uf_find(subst, t_id)
            match uf_lookup(subst, root_id) {
                some(resolved) => {
                    let resolved_ = resolved
                    let chased = apply_subst(subst, resolved_)
                    match chased {
                        Type::TypeVar { id: new_id, .. } => {
                            let result_effects = effects
                            let result_id = new_id
                            EffectRow { effects: result_effects,
                                tail: some(result_id) }
                        },
                        Type::EffectRowType { effects: extra_effs, tail: extra_tail } => {
                            let mut merged = list_clone(effects)
                            for ee in extra_effs {
                                let effect_ = ee
                                merged.push(apply_subst_effect(subst, effect_))
                            }
                            let result_tail = extra_tail
                            EffectRow { effects: merged, tail: result_tail }
                        },
                        _ => {
                            let result_effects = effects
                            EffectRow { effects: result_effects, tail: none }
                        }
                    }
                },
                none => {
                    let actual_id = if root_id == t_id { t_id } else { root_id }
                    let result_effects = effects
                    let result_id = actual_id
                    EffectRow { effects: result_effects,
                        tail: some(result_id) }
                }
            }
        },
        none => {
            let result_effects = effects
            EffectRow { effects: result_effects, tail: none }
        }
    }
}
