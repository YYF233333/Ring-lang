use types::{Type, EffectRow, StructField, EnumVariant,
    INT, STR, BOOL, EMPTY_ROW}
use env::{TypeEnv, TypeScheme, SchemeBound, StructDef, EnumDef, ImplEntry}
use hir::{DerivedImpl, DerivedField, DerivedVariant, FieldAction,
    TraitBound, TypeKind, trait_dict_name, trait_bound_param_name}

fn str_at(list: List<Str>, i: Int) -> Str {
    match list.get(i) { some(v) => v, none => panic("str_at: out of bounds") }
}

fn int_at(list: List<Int>, i: Int) -> Int {
    match list.get(i) { some(v) => v, none => panic("int_at: out of bounds") }
}

fn type_at(list: List<Type>, i: Int) -> Type {
    match list.get(i) { some(v) => v, none => panic("type_at: out of bounds") }
}

fn df_at(list: List<DerivedField>, i: Int) -> DerivedField {
    match list.get(i) { some(v) => v, none => panic("df_at: out of bounds") }
}

fn BUILTIN_TYPES() -> Set<Str> {
    var s = set_new()
    s.insert("Option")
    s.insert("Cell")
    s.insert("List")
    s.insert("Map")
    s.insert("Set")
    s.insert("Range")
    s
}

// ================================================================
// Public entry point
// ================================================================

pub fn run_derive_pass(var env: TypeEnv) -> List<DerivedImpl> {
    var derived_impls: List<DerivedImpl> = empty_derived_impls()
    let all_types = collect_user_types(env)
    derive_trait(env, all_types, "Eq", derived_impls)
    derive_trait(env, all_types, "Clone", derived_impls)
    derive_trait(env, all_types, "Ord", derived_impls)
    derive_trait(env, all_types, "Debug", derived_impls)
    derived_impls
}

// ================================================================
// Collect user-defined types
// ================================================================

struct UserType {
    name: Str,
    type_kind: TypeKind,
    struct_def: StructDef?,
    enum_def: EnumDef?
}

fn collect_user_types(env: TypeEnv) -> List<UserType> {
    let builtins = BUILTIN_TYPES()
    var result: List<UserType> = empty_user_types()
    for entry in env.structs.entries() {
        let (name, def) = entry
        if builtins.contains(name) == false {
            result.push(UserType { name: name, type_kind: TypeKind::StructKind, struct_def: some(def), enum_def: none })
        }
    }
    for entry in env.enums.entries() {
        let (name, def) = entry
        if builtins.contains(name) == false {
            result.push(UserType { name: name, type_kind: TypeKind::EnumKind, struct_def: none, enum_def: some(def) })
        }
    }
    result
}

// ================================================================
// Fixpoint derivation for a single trait
// ================================================================

fn derive_trait(var env: TypeEnv, all_types: List<UserType>, trait_name: Str, var derived_impls: List<DerivedImpl>) {
    var known = set_new()
    for imp in env.trait_impls {
        if imp.trait_name == trait_name {
            known.insert(imp.target_type_name)
        }
    }
    known.insert("Int")
    known.insert("Float")
    known.insert("Str")
    known.insert("Bool")

    var changed = true
    while changed {
        changed = false
        for ut in all_types {
            if known.contains(ut.name) { } else {
                if has_manual_impl(env, ut.name, trait_name) { } else {
                    let result = try_derive(env, ut, trait_name, known)
                    match result {
                        some(di) => {
                            known.insert(ut.name)
                            register_derived_impl(env, di, trait_name)
                            derived_impls.push(di)
                            changed = true
                        },
                        none => {},
                    }
                }
            }
        }
    }
}

fn has_manual_impl(env: TypeEnv, type_name: Str, trait_name: Str) -> Bool {
    for imp in env.trait_impls {
        if imp.trait_name == trait_name {
            if imp.target_type_name == type_name {
                return true
            }
        }
    }
    false
}

// ================================================================
// Try to derive a trait for a single type
// ================================================================

fn try_derive(env: TypeEnv, ut: UserType, trait_name: Str, known: Set<Str>) -> DerivedImpl? {
    var bounds: List<TraitBound> = empty_trait_bounds()

    match ut.type_kind {
        TypeKind::StructKind => match ut.struct_def {
            some(def) => {
                let field_entries = def.fields.map(fn(f) { FieldEntry { name: f.name, ty: f.ty } })
                let fields = try_derive_fields(env, field_entries, def.type_param_vars, def.type_params, trait_name, known, ut.name, bounds)
                match fields {
                    some(fs) => some(DerivedImpl {
                        type_name: ut.name,
                        trait_name: trait_name,
                        type_params: def.type_params,
                        bounds: bounds,
                        type_kind: TypeKind::StructKind,
                        struct_fields: some(fs),
                        enum_variants: none
                    }),
                    none => none,
                }
            },
            none => none,
        },
        TypeKind::EnumKind => match ut.enum_def {
            some(def) => {
                var variants: List<DerivedVariant> = empty_derived_variants()
                var ok = true
                for v in def.variants {
                    if ok {
                        let has_named_fields = match v.field_names {
                            some(fns) => fns.len() > 0,
                            none => false,
                        }
                        var field_entries: List<FieldEntry> = empty_field_entries()
                        for i in 0..v.fields.len() {
                            let fname = if has_named_fields {
                                match v.field_names {
                                    some(fns) => str_at(fns, i),
                                    none => "_${i}",
                                }
                            } else {
                                "_${i}"
                            }
                            field_entries.push(FieldEntry { name: fname, ty: type_at(v.fields, i) })
                        }
                        let fields = try_derive_fields(env, field_entries, def.type_param_vars, def.type_params, trait_name, known, ut.name, bounds)
                        match fields {
                            some(fs) => {
                                var final_fields = fs
                                if has_named_fields == false {
                                    var updated: List<DerivedField> = empty_derived_fields()
                                    for j in 0..fs.len() {
                                        let f = df_at(fs, j)
                                        updated.push(DerivedField { name: f.name, positional_index: some(j), action: f.action })
                                    }
                                    final_fields = updated
                                }
                                variants.push(DerivedVariant { name: v.name, fields: final_fields, has_named_fields: has_named_fields })
                            },
                            none => { ok = false },
                        }
                    }
                }
                if ok {
                    some(DerivedImpl {
                        type_name: ut.name,
                        trait_name: trait_name,
                        type_params: def.type_params,
                        bounds: bounds,
                        type_kind: TypeKind::EnumKind,
                        struct_fields: none,
                        enum_variants: some(variants)
                    })
                } else {
                    none
                }
            },
            none => none,
        },
    }
}

// ================================================================
// Try to derive fields
// ================================================================

struct FieldEntry {
    name: Str,
    ty: Type
}

fn try_derive_fields(
    env: TypeEnv,
    fields: List<FieldEntry>,
    type_param_vars: List<Int>,
    type_param_names: List<Str>,
    trait_name: Str,
    known: Set<Str>,
    self_type_name: Str,
    var bounds: List<TraitBound>
) -> List<DerivedField>? {
    var result: List<DerivedField> = empty_derived_fields()
    for field in fields {
        let action = resolve_field_action(env, field.ty, type_param_vars, type_param_names, trait_name, known, self_type_name, bounds)
        match action {
            some(a) => result.push(DerivedField { name: field.name, positional_index: none, action: a }),
            none => { return none },
        }
    }
    some(result)
}

// ================================================================
// Resolve field action
// ================================================================

fn resolve_field_action(
    env: TypeEnv,
    field_type: Type,
    type_param_vars: List<Int>,
    type_param_names: List<Str>,
    trait_name: Str,
    known: Set<Str>,
    self_type_name: Str,
    var bounds: List<TraitBound>
) -> FieldAction? {
    match field_type {
        Type::IntType => some(FieldAction::Identity),
        Type::FloatType => some(FieldAction::Identity),
        Type::StrType => some(FieldAction::Identity),
        Type::BoolType => some(FieldAction::Identity),
        Type::UnitType => some(FieldAction::Identity),
        Type::TypeVar { id, .. } => {
            let param_idx = index_of_int(type_param_vars, id)
            if param_idx < 0 { return none }
            let param_name = str_at(type_param_names, param_idx)
            if has_bound(bounds, param_name, trait_name) == false {
                bounds.push(TraitBound { type_param: param_name, trait_name: trait_name })
            }
            some(FieldAction::Call {
                dict_name: trait_bound_param_name(param_name, trait_name),
                extra_dicts: empty_strs()
            })
        },
        Type::StructType { name, type_params, .. } => {
            if name == self_type_name {
                let extra = resolve_extra_dicts(type_params, type_param_vars, type_param_names, trait_name, known, self_type_name, bounds)
                match extra {
                    some(e) => some(FieldAction::Call { dict_name: trait_dict_name(name, trait_name), extra_dicts: e }),
                    none => none,
                }
            } else {
                if known.contains(name) {
                    let extra = resolve_extra_dicts(type_params, type_param_vars, type_param_names, trait_name, known, self_type_name, bounds)
                    match extra {
                        some(e) => some(FieldAction::Call { dict_name: trait_dict_name(name, trait_name), extra_dicts: e }),
                        none => none,
                    }
                } else {
                    none
                }
            }
        },
        Type::EnumType { name, type_params, .. } => {
            if name == self_type_name {
                let extra = resolve_extra_dicts(type_params, type_param_vars, type_param_names, trait_name, known, self_type_name, bounds)
                match extra {
                    some(e) => some(FieldAction::Call { dict_name: trait_dict_name(name, trait_name), extra_dicts: e }),
                    none => none,
                }
            } else {
                if known.contains(name) {
                    let extra = resolve_extra_dicts(type_params, type_param_vars, type_param_names, trait_name, known, self_type_name, bounds)
                    match extra {
                        some(e) => some(FieldAction::Call { dict_name: trait_dict_name(name, trait_name), extra_dicts: e }),
                        none => none,
                    }
                } else {
                    none
                }
            }
        },
        Type::TupleType { .. } => some(FieldAction::Identity),
        Type::FnType { .. } => {
            if trait_name == "Debug" {
                some(FieldAction::Identity)
            } else {
                none
            }
        },
        _ => none,
    }
}

// ================================================================
// Resolve extra dicts
// ================================================================

fn resolve_extra_dicts(
    type_args: List<Type>,
    type_param_vars: List<Int>,
    type_param_names: List<Str>,
    trait_name: Str,
    known: Set<Str>,
    self_type_name: Str,
    var bounds: List<TraitBound>
) -> List<Str>? {
    var dicts: List<Str> = empty_strs()
    for arg in type_args {
        let dict = resolve_type_arg_dict(arg, type_param_vars, type_param_names, trait_name, known, self_type_name, bounds)
        match dict {
            some(d) => dicts.push(d),
            none => { return none },
        }
    }
    some(dicts)
}

fn resolve_type_arg_dict(
    arg: Type,
    type_param_vars: List<Int>,
    type_param_names: List<Str>,
    trait_name: Str,
    known: Set<Str>,
    self_type_name: Str,
    var bounds: List<TraitBound>
) -> Str? {
    match arg {
        Type::IntType => some(trait_dict_name("Int", trait_name)),
        Type::FloatType => some(trait_dict_name("Float", trait_name)),
        Type::StrType => some(trait_dict_name("Str", trait_name)),
        Type::BoolType => some(trait_dict_name("Bool", trait_name)),
        Type::UnitType => some(trait_dict_name("Unit", trait_name)),
        Type::TypeVar { id, .. } => {
            let param_idx = index_of_int(type_param_vars, id)
            if param_idx < 0 { return none }
            let param_name = str_at(type_param_names, param_idx)
            if has_bound(bounds, param_name, trait_name) == false {
                bounds.push(TraitBound { type_param: param_name, trait_name: trait_name })
            }
            some(trait_bound_param_name(param_name, trait_name))
        },
        Type::StructType { name, .. } => {
            if name == self_type_name {
                some(trait_dict_name(name, trait_name))
            } else {
                if known.contains(name) {
                    some(trait_dict_name(name, trait_name))
                } else {
                    none
                }
            }
        },
        Type::EnumType { name, .. } => {
            if name == self_type_name {
                some(trait_dict_name(name, trait_name))
            } else {
                if known.contains(name) {
                    some(trait_dict_name(name, trait_name))
                } else {
                    none
                }
            }
        },
        _ => none,
    }
}

// ================================================================
// Register derived impl
// ================================================================

fn register_derived_impl(var env: TypeEnv, di: DerivedImpl, trait_name: Str) {
    env.trait_impls.push(ImplEntry {
        trait_name: trait_name,
        target_type_name: di.type_name,
        type_params: di.type_params,
        method_names: get_method_names(trait_name)
    })

    var methods = match env.impl_methods.get(di.type_name) {
        some(m) => m,
        none => map_new(),
    }

    var type_var_ids: List<Int> = empty_ints()
    var self_type_params: List<Type> = empty_type_list()
    for i in 0..di.type_params.len() {
        let var_id = env.fresh_var_id()
        type_var_ids.push(var_id)
        self_type_params.push(Type::TypeVar { id: var_id, name: none })
    }

    let self_type = build_self_type(env, di.type_name, di.type_kind, self_type_params)

    var scheme_bounds: List<SchemeBound> = empty_scheme_bounds()
    for b in di.bounds {
        let param_idx = index_of_str(di.type_params, b.type_param)
        if param_idx >= 0 {
            scheme_bounds.push(SchemeBound { type_var: int_at(type_var_ids, param_idx), trait_name: b.trait_name })
        }
    }

    register_trait_methods(methods, trait_name, self_type, type_var_ids, scheme_bounds)
    env.impl_methods.insert(di.type_name, methods)
}

fn get_method_names(trait_name: Str) -> List<Str> {
    if trait_name == "Eq" {
        let r = ["eq"]; r.push("ne"); r
    } else {
        if trait_name == "Clone" {
            ["clone"]
        } else {
            if trait_name == "Debug" {
                ["debug"]
            } else {
                if trait_name == "Ord" {
                    ["cmp"]
                } else {
                    let e: List<Str> = empty_strs()
                    e
                }
            }
        }
    }
}

fn build_self_type(env: TypeEnv, type_name: Str, type_kind: TypeKind, type_params: List<Type>) -> Type {
    match type_kind {
        TypeKind::StructKind => {
            let def = env.structs.get(type_name)
            let fields = match def {
                some(d) => d.fields.map(fn(f) { StructField { name: f.name, ty: f.ty, is_pub: f.is_pub } }),
                none => {
                    let e: List<StructField> = empty_struct_fields()
                    e
                },
            }
            Type::StructType { name: type_name, type_params: type_params, fields: fields }
        },
        TypeKind::EnumKind => {
            let def = env.enums.get(type_name)
            let variants = match def {
                some(d) => d.variants.map(fn(v) { EnumVariant { name: v.name, fields: v.fields, field_names: v.field_names } }),
                none => {
                    let e: List<EnumVariant> = empty_enum_variants()
                    e
                },
            }
            Type::EnumType { name: type_name, type_params: type_params, variants: variants }
        },
    }
}

fn register_trait_methods(
    var methods: Map<Str, TypeScheme>,
    trait_name: Str,
    self_type: Type,
    type_var_ids: List<Int>,
    bounds: List<SchemeBound>
) {
    if trait_name == "Eq" {
        let eq_fn = Type::FnType { params: [self_type, self_type], return_type: BOOL(), effects: EMPTY_ROW() }
        methods.insert("eq", TypeScheme { ty: eq_fn, type_vars: type_var_ids, bounds: bounds, def_id: none })
        let ne_fn = Type::FnType { params: [self_type, self_type], return_type: BOOL(), effects: EMPTY_ROW() }
        methods.insert("ne", TypeScheme { ty: ne_fn, type_vars: type_var_ids, bounds: bounds, def_id: none })
    } else {
        if trait_name == "Clone" {
            let clone_fn = Type::FnType { params: [self_type], return_type: self_type, effects: EMPTY_ROW() }
            methods.insert("clone", TypeScheme { ty: clone_fn, type_vars: type_var_ids, bounds: bounds, def_id: none })
        } else {
            if trait_name == "Ord" {
                let cmp_fn = Type::FnType { params: [self_type, self_type], return_type: INT(), effects: EMPTY_ROW() }
                methods.insert("cmp", TypeScheme { ty: cmp_fn, type_vars: type_var_ids, bounds: bounds, def_id: none })
            } else {
                if trait_name == "Debug" {
                    let debug_fn = Type::FnType { params: [self_type], return_type: STR(), effects: EMPTY_ROW() }
                    methods.insert("debug", TypeScheme { ty: debug_fn, type_vars: type_var_ids, bounds: bounds, def_id: none })
                }
            }
        }
    }
}

// ================================================================
// Helpers
// ================================================================

fn index_of_int(list: List<Int>, target: Int) -> Int {
    for i in 0..list.len() {
        if int_at(list, i) == target { return i }
    }
    0 - 1
}

fn index_of_str(list: List<Str>, target: Str) -> Int {
    for i in 0..list.len() {
        if str_at(list, i) == target { return i }
    }
    0 - 1
}

fn has_bound(bounds: List<TraitBound>, type_param: Str, trait_name: Str) -> Bool {
    for b in bounds {
        if b.type_param == type_param {
            if b.trait_name == trait_name {
                return true
            }
        }
    }
    false
}

fn empty_strs() -> List<Str> { let x = [""]; x.clear(); x }
fn empty_ints() -> List<Int> { let x = [0]; x.clear(); x }
fn empty_derived_impls() -> List<DerivedImpl> { let x = [0]; x.clear(); x.map(fn(i: Int) -> DerivedImpl { panic("unreachable") }) }
fn empty_user_types() -> List<UserType> { let x = [0]; x.clear(); x.map(fn(i: Int) -> UserType { panic("unreachable") }) }
fn empty_trait_bounds() -> List<TraitBound> { let x = [0]; x.clear(); x.map(fn(i: Int) -> TraitBound { panic("unreachable") }) }
fn empty_derived_variants() -> List<DerivedVariant> { let x = [0]; x.clear(); x.map(fn(i: Int) -> DerivedVariant { panic("unreachable") }) }
fn empty_field_entries() -> List<FieldEntry> { let x = [0]; x.clear(); x.map(fn(i: Int) -> FieldEntry { panic("unreachable") }) }
fn empty_derived_fields() -> List<DerivedField> { let x = [0]; x.clear(); x.map(fn(i: Int) -> DerivedField { panic("unreachable") }) }
fn empty_type_list() -> List<Type> { let x = [0]; x.clear(); x.map(fn(i: Int) -> Type { panic("unreachable") }) }
fn empty_scheme_bounds() -> List<SchemeBound> { let x = [0]; x.clear(); x.map(fn(i: Int) -> SchemeBound { panic("unreachable") }) }
fn empty_struct_fields() -> List<StructField> { let x = [0]; x.clear(); x.map(fn(i: Int) -> StructField { panic("unreachable") }) }
fn empty_enum_variants() -> List<EnumVariant> { let x = [0]; x.clear(); x.map(fn(i: Int) -> EnumVariant { panic("unreachable") }) }
