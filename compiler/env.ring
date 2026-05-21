use types::{Type, Effect, EffectRow, StructField, EnumVariant, RecordField, INT}
use ast::{Span}

// ============================================================
// Type Scheme (for let-polymorphism)
// ============================================================

pub struct SchemeBound {
    pub type_var: Int,
    pub trait_name: Str
}

pub struct TypeScheme {
    pub ty: Type,
    pub type_vars: List<Int>,
    pub bounds: List<SchemeBound>,
    pub def_id: Int?
}

// ============================================================
// Struct / Enum / Effect definitions stored in environment
// ============================================================

pub struct StructDef {
    pub name: Str,
    pub type_params: List<Str>,
    pub type_param_vars: List<Int>,
    pub fields: List<StructField>
}

pub struct EnumDef {
    pub name: Str,
    pub type_params: List<Str>,
    pub type_param_vars: List<Int>,
    pub variants: List<EnumVariant>
}

pub struct EffectOpDef {
    pub name: Str,
    pub params: List<Type>,
    pub return_type: Type
}

pub enum BuiltInKind { BkIo, BkFail, BkMut }

pub struct EffectDef {
    pub name: Str,
    pub type_params: List<Str>,
    pub ops: List<EffectOpDef>,
    pub built_in_kind: BuiltInKind?
}

// ============================================================
// Trait definitions
// ============================================================

pub struct TraitMethodDef {
    pub name: Str,
    pub ty: Type,
    pub has_default: Bool
}

pub struct TraitDef {
    pub name: Str,
    pub type_params: List<Str>,
    pub type_param_vars: List<Int>,
    pub methods: List<TraitMethodDef>
}

pub struct ImplEntry {
    pub trait_name: Str,
    pub target_type_name: Str,
    pub type_params: List<Str>,
    pub method_names: List<Str>
}

// ============================================================
// Type alias + function bounds
// ============================================================

pub struct TypeAliasDef {
    pub type_params: List<Str>,
    pub type_param_vars: List<Int>,
    pub ty: Type
}

pub struct FnBound {
    pub type_param: Str,
    pub trait_name: Str
}

// ============================================================
// Scope
// ============================================================

pub struct Scope {
    pub variables: Map<Str, TypeScheme>
}

// ============================================================
// TypeEnv
// ============================================================

pub struct TypeEnv {
    pub next_type_var_id: Int,
    pub next_def_id: Int,
    pub scopes: List<Scope>,
    pub structs: Map<Str, StructDef>,
    pub enums: Map<Str, EnumDef>,
    pub effects: Map<Str, EffectDef>,
    pub impl_methods: Map<Str, Map<Str, TypeScheme>>,
    pub variant_to_enum: Map<Str, Str>,
    pub traits: Map<Str, TraitDef>,
    pub trait_impls: List<ImplEntry>,
    pub fn_bounds: Map<Str, List<FnBound>>,
    pub var_bounds: Map<Int, Set<Str>>,
    pub def_spans: Map<Int, Span>,
    pub mutable_vars: Set<Int>,
    pub type_aliases: Map<Str, TypeAliasDef>
}

// ============================================================
// Empty list helpers (Ring cannot infer element type of `[]`)
// ============================================================

fn empty_ints() -> List<Int> { let x = [0]; x.clear(); x }
fn empty_strs() -> List<Str> { let x = [""]; x.clear(); x }

fn empty_bounds() -> List<SchemeBound> {
    let dummy = SchemeBound { type_var: 0, trait_name: "" }
    let x = [dummy]; x.clear(); x
}

fn empty_impl_entries() -> List<ImplEntry> {
    let dummy = ImplEntry { trait_name: "", target_type_name: "", type_params: ["x"], method_names: ["x"] }
    let x = [dummy]; x.clear(); x
}

// ============================================================
// Constructor + helpers
// ============================================================

pub fn mono(ty: Type) -> TypeScheme {
    TypeScheme { ty: ty, type_vars: empty_ints(), bounds: empty_bounds(), def_id: none }
}

pub fn new_type_env() -> TypeEnv {
    let initial_scope = Scope { variables: map_new() }
    TypeEnv {
        next_type_var_id: 0,
        next_def_id: 0,
        scopes: [initial_scope],
        structs: map_new(),
        enums: map_new(),
        effects: map_new(),
        impl_methods: map_new(),
        variant_to_enum: map_new(),
        traits: map_new(),
        trait_impls: empty_impl_entries(),
        fn_bounds: map_new(),
        var_bounds: map_new(),
        def_spans: map_new(),
        mutable_vars: set_new(),
        type_aliases: map_new()
    }
}

// ============================================================
// TypeEnv methods
// ============================================================

impl TypeEnv {
    pub fn current_var_id(self) -> Int { self.next_type_var_id }

    pub fn fresh_var(var self) -> Type {
        let id = self.next_type_var_id
        self.next_type_var_id = id + 1
        Type::TypeVar { id: id, name: none }
    }

    pub fn fresh_var_id(var self) -> Int {
        let id = self.next_type_var_id
        self.next_type_var_id = id + 1
        id
    }

    pub fn fresh_def_id(var self) -> Int {
        let id = self.next_def_id
        self.next_def_id = id + 1
        id
    }

    pub fn push_scope(var self) {
        self.scopes.push(Scope { variables: map_new() })
    }

    pub fn pop_scope(var self) {
        if self.scopes.len() <= 1 {
            panic("Cannot pop global scope")
        }
        self.scopes.pop()
    }

    pub fn bind(var self, name: Str, scheme: TypeScheme) {
        let s = match scheme.def_id {
            some(_) => scheme,
            none => TypeScheme { ..scheme, def_id: some(self.fresh_def_id()) }
        }
        let idx = self.scopes.len() - 1
        match self.scopes.get(idx) {
            some(scope) => scope.variables.insert(name, s),
            none => panic("no current scope")
        }
    }

    pub fn bind_mono(var self, name: Str, ty: Type) {
        self.bind(name, mono(ty))
    }

    pub fn record_def_span(var self, def_id: Int, span: Span) {
        self.def_spans.insert(def_id, span)
    }

    pub fn rebind(var self, name: Str, scheme: TypeScheme) {
        var i = self.scopes.len() - 1
        while i >= 0 {
            match self.scopes.get(i) {
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
    }

    pub fn lookup(self, name: Str) -> TypeScheme? {
        var i = self.scopes.len() - 1
        while i >= 0 {
            let found = match self.scopes.get(i) {
                some(scope) => scope.variables.get(name),
                none => none
            }
            if found.is_some() { return found }
            i = i - 1
        }
        none
    }

    pub fn instantiate(var self, scheme: TypeScheme) -> Type {
        if scheme.type_vars.len() == 0 { return scheme.ty }
        let mapping: Map<Int, Type> = map_new()
        for tv in scheme.type_vars {
            mapping.insert(tv, self.fresh_var())
        }
        for bound in scheme.bounds {
            match mapping.get(bound.type_var) {
                some(fresh) => match fresh {
                    Type::TypeVar { id, .. } => {
                        let existing: Set<Str> = match self.var_bounds.get(id) {
                            some(s) => s,
                            none => set_new()
                        }
                        existing.insert(bound.trait_name)
                        self.var_bounds.insert(id, existing)
                    },
                    _ => {}
                },
                none => {}
            }
        }
        apply_subst(mapping, scheme.ty)
    }
}

// ============================================================
// Substitution: apply type variable mapping to a type
// Kept here (not in unify.ring) to avoid circular dependency
// ============================================================

pub fn apply_subst(subst: Map<Int, Type>, t: Type) -> Type {
    match t {
        Type::IntType => t,
        Type::FloatType => t,
        Type::StrType => t,
        Type::BoolType => t,
        Type::UnitType => t,
        Type::NeverType => t,
        Type::AnyType => t,
        Type::TypeVar { id, .. } => match subst.get(id) {
            some(resolved) => apply_subst(subst, resolved),
            none => t
        },
        Type::FnType { params, return_type, effects } =>
            Type::FnType {
                params: params.map(fn(p) { apply_subst(subst, p) }),
                return_type: apply_subst(subst, return_type),
                effects: apply_subst_row(subst, effects)
            },
        Type::StructType { name, type_params, fields } =>
            Type::StructType {
                name: name,
                type_params: type_params.map(fn(p) { apply_subst(subst, p) }),
                fields: fields
            },
        Type::EnumType { name, type_params, variants } =>
            Type::EnumType {
                name: name,
                type_params: type_params.map(fn(p) { apply_subst(subst, p) }),
                variants: variants
            },
        Type::GenericType { base, args } =>
            Type::GenericType {
                base: apply_subst(subst, base),
                args: args.map(fn(a) { apply_subst(subst, a) })
            },
        Type::RecordType { fields, tail, tail_name } => {
            let mapped_fields = fields.map(fn(f) {
                RecordField { name: f.name, ty: apply_subst(subst, f.ty) }
            })
            match tail {
                some(t_id) => match subst.get(t_id) {
                    some(resolved) => {
                        let chased = apply_subst(subst, resolved)
                        match chased {
                            Type::TypeVar { id: new_id, name: new_name } =>
                                Type::RecordType { fields: mapped_fields, tail: some(new_id), tail_name: new_name },
                            Type::RecordType { fields: extra_fields, tail: extra_tail, tail_name: extra_tn } => {
                                let all_fields = list_clone(mapped_fields)
                                for ef in extra_fields {
                                    all_fields.push(RecordField { name: ef.name, ty: apply_subst(subst, ef.ty) })
                                }
                                Type::RecordType { fields: all_fields, tail: extra_tail, tail_name: extra_tn }
                            },
                            _ => Type::RecordType { fields: mapped_fields, tail: none, tail_name: none }
                        }
                    },
                    none => Type::RecordType { fields: mapped_fields, tail: some(t_id), tail_name: tail_name }
                },
                none => Type::RecordType { fields: mapped_fields, tail: none, tail_name: tail_name }
            }
        },
        Type::EffectRowType { effects, tail } => {
            let row = apply_subst_row(subst, EffectRow { effects: effects, tail: tail })
            Type::EffectRowType { effects: row.effects, tail: row.tail }
        },
        Type::TupleType { elements } =>
            Type::TupleType { elements: elements.map(fn(e) { apply_subst(subst, e) }) }
    }
}

fn apply_subst_effect(subst: Map<Int, Type>, e: Effect) -> Effect {
    match e {
        Effect::FailEffect { error_type } =>
            Effect::FailEffect { error_type: apply_subst(subst, error_type) },
        Effect::CustomEffect { name, type_args } =>
            Effect::CustomEffect { name: name, type_args: type_args.map(fn(a) { apply_subst(subst, a) }) },
        _ => e
    }
}

pub fn apply_subst_row(subst: Map<Int, Type>, row: EffectRow) -> EffectRow {
    let effects = row.effects.map(fn(e) { apply_subst_effect(subst, e) })
    match row.tail {
        some(t_id) => match subst.get(t_id) {
            some(resolved) => {
                let chased = apply_subst(subst, resolved)
                match chased {
                    Type::TypeVar { id: new_id, .. } =>
                        EffectRow { effects: effects, tail: some(new_id) },
                    Type::EffectRowType { effects: extra_effs, tail: extra_tail } => {
                        let merged = list_clone(effects)
                        for ee in extra_effs {
                            merged.push(apply_subst_effect(subst, ee))
                        }
                        EffectRow { effects: merged, tail: extra_tail }
                    },
                    _ => EffectRow { effects: effects, tail: none }
                }
            },
            none => EffectRow { effects: effects, tail: some(t_id) }
        },
        none => EffectRow { effects: effects, tail: none }
    }
}
