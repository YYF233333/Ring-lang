// builtins.ring — Combined translation of builtins-core.ts + builtins-hof.ts
// Registers built-in effects, types, traits, and HOF intrinsics into TypeEnv.

use types::{Type, Effect, EffectRow, StructField, EnumVariant,
    INT, FLOAT, STR, BOOL, UNIT, NEVER, EMPTY_ROW,
    BUILTIN_LIST, BUILTIN_MAP, BUILTIN_SET, BUILTIN_OPTION, BUILTIN_CELL,
    make_option_type, make_map_type, fn_meta,
    CALLABLE_BORROW_OWNED, CALLABLE_MOVE_OWNED,
    CALLABLE_FIRST_MUT_BORROW_OWNED, CALLABLE_BORROW_BORROWED,
    CALLABLE_MUT_MOVE_OWNED, CALLABLE_BORROW_MOVE_BORROWED,
    CALLABLE_MOVE_BORROW_OWNED, CALLABLE_BORROW_MUT_BORROW_OWNED,
    CALLABLE_SOURCE_BUILTIN}
use env::{TypeEnv, TypeScheme, SchemeBound, StructDef, EnumDef,
    EffectDef, EffectOpDef, BuiltInKind, TraitDef, TraitMethodDef,
    ImplEntry, ImplDictBound, MethodOrigin, mono, add_impl,
    install_method_scheme, specialize_trait_method_scheme,
    new_local_callable_scheme, new_local_callable_owning_scheme}
use ast::{span_zero}
use hir::{variant_ctor_name, compare_by_first}
use diagnostics::{CollectingSink}

// ============================================================
// Struct for open_row return value
// ============================================================

struct OpenRow {
    eff: EffectRow,
    tail_id: Int
}

fn bind_builtin_callable(
    mut env: TypeEnv, name: Str, scheme: TypeScheme
) {
    let local_scheme = new_local_callable_owning_scheme(
        env, scheme, CALLABLE_SOURCE_BUILTIN)
    env.bind(name, local_scheme)
}

// ============================================================
// Shared built-in method installation
// ============================================================

fn install_builtin_method_map(
    mut env: TypeEnv, sink: CollectingSink,
    target_type_name: Str, origin: Str,
    trait_name: Str?, methods: Map<Str, TypeScheme>
) -> Map<Str, TypeScheme> {
    let span = span_zero()
    let mut localized: Map<Str, TypeScheme> = map_new()
    let mut entries = methods.entries()
    entries.sort_by(compare_by_first)
    for entry in entries {
        let (method_name, scheme) = entry
        let scheme_def_id = scheme.def_id
        let local_scheme = match scheme_def_id {
            some(_) => {
                let existing_scheme = scheme
                existing_scheme
            },
            none => {
                let unlocalized_scheme = scheme
                new_local_callable_owning_scheme(
                    env, unlocalized_scheme, CALLABLE_SOURCE_BUILTIN)
            }
        }
        let localized_method_name = method_name
        let installed_method_name = method_name
        let localized_scheme_value = local_scheme
        let installed_scheme_value = local_scheme
        localized.insert(localized_method_name, localized_scheme_value)
        let installed_target_name = target_type_name
        let installed_origin = origin
        let installed_trait_name = trait_name
        let installed_span = span
        let _ = install_method_scheme(
            env.trait_reg, sink,
            installed_target_name, installed_method_name,
            installed_scheme_value,
            MethodOrigin {
                origin: installed_origin,
                trait_name: installed_trait_name,
                is_authoritative_drop: false,
                span: installed_span
            })
    }
    localized
}

fn builtin_trait_method(
    mut env: TypeEnv, name: Str, ty: Type, has_default: Bool,
    param_mutabilities: List<Bool>
) -> TraitMethodDef {
    let scheme = new_local_callable_owning_scheme(env,
        TypeScheme { ty: ty, type_vars: [], bounds: [], def_id: none },
        CALLABLE_SOURCE_BUILTIN)
    let def_id = match scheme.def_id {
        some(id) => id,
        none => panic("unreachable: builtin trait method has no local DefId")
    }
    TraitMethodDef {
        name: name, def_id: def_id, ty: scheme.ty,
        has_default: has_default,
        param_mutabilities: param_mutabilities,
        method_type_params: []
    }
}

fn bind_builtin_force_callable(
    mut env: TypeEnv, name: Str, scheme: TypeScheme
) {
    let local_scheme = new_local_callable_scheme(
        env, scheme, CALLABLE_SOURCE_BUILTIN)
    env.bind(name, local_scheme)
}

fn builtin_force_trait_method(
    mut env: TypeEnv, name: Str, ty: Type, has_default: Bool,
    param_mutabilities: List<Bool>
) -> TraitMethodDef {
    let scheme = new_local_callable_scheme(env,
        TypeScheme { ty: ty, type_vars: [], bounds: [], def_id: none },
        CALLABLE_SOURCE_BUILTIN)
    let def_id = match scheme.def_id {
        some(id) => id,
        none => panic("unreachable: FORCE builtin trait method has no local DefId")
    }
    TraitMethodDef {
        name: name, def_id: def_id, ty: scheme.ty,
        has_default: has_default,
        param_mutabilities: param_mutabilities,
        method_type_params: []
    }
}

fn builtin_impl_enum_self_type_firebreak(
    name: Str, type_args: List<Type>
) -> Type {
    let enum_name = name
    let enum_args = type_args
    Type::EnumType { name: enum_name, type_params: enum_args }
}

fn builtin_impl_struct_self_type_firebreak(
    name: Str, type_args: List<Type>
) -> Type {
    let struct_name = name
    let struct_args = type_args
    Type::StructType { name: struct_name, type_params: struct_args }
}

fn builtin_impl_self_type(
    target_type_name: Str, type_args: List<Type>
) -> Type {
    match target_type_name {
        "Int" => INT,
        "Float" => FLOAT,
        "Str" => STR,
        "Bool" => BOOL,
        other => {
            if other == BUILTIN_OPTION {
                builtin_impl_enum_self_type_firebreak(other, type_args)
            } else {
                builtin_impl_struct_self_type_firebreak(other, type_args)
            }
        }
    }
}

fn add_builtin_impl(
    mut env: TypeEnv, sink: CollectingSink,
    trait_name: Str, target_type_name: Str,
    type_params: List<Str>, type_var_ids: List<Int>,
    dict_bounds: List<ImplDictBound>,
    method_names: List<Str>
) {
    let origin = "<builtin>:${target_type_name}:${trait_name}"
    let span = span_zero()
    let self_target_type_name = target_type_name
    let install_target_type_name = target_type_name
    let entry_target_type_name = target_type_name
    let lookup_trait_name = trait_name
    let install_trait_name = trait_name
    let entry_trait_name = trait_name
    let install_origin = origin
    let entry_origin = origin
    let entry_span = span
    let mut type_args: List<Type> = []
    for type_var_id in type_var_ids {
        type_args.push(Type::TypeVar { id: type_var_id, name: none })
    }
    let self_type = builtin_impl_self_type(self_target_type_name, type_args)
    let mut scheme_bounds: List<SchemeBound> = []
    for dict_bound in dict_bounds {
        match type_var_ids.get(dict_bound.type_param_index) {
            some(type_var_id) => scheme_bounds.push(SchemeBound {
                type_var: type_var_id,
                trait_name: dict_bound.trait_name,
                assoc_constraints: []
            }),
            none => {}
        }
    }
    let mut exact: Map<Str, TypeScheme> = map_new()
    match env.trait_reg.traits.get(lookup_trait_name) {
        some(trait_def) => {
            for method_name in method_names {
                let searched_method_name = method_name
                let installed_method_name = method_name
                match trait_def.methods.find(fn(method) {
                    method.name == searched_method_name
                }) {
                    some(method) => {
                        let specialized_trait_def = trait_def
                        let specialized_self_type = self_type
                        let specialized_type_var_ids = type_var_ids
                        let specialized_bounds = scheme_bounds
                        exact.insert(installed_method_name,
                            specialize_trait_method_scheme(
                                env.types.ownership_metadata,
                                specialized_trait_def, method,
                                specialized_self_type, [],
                                specialized_type_var_ids, map_new(),
                                specialized_bounds))
                    },
                    none => {}
                }
            }
        },
        none => {}
    }
    let local_exact = install_builtin_method_map(
        env, sink, install_target_type_name, install_origin,
        some(install_trait_name), exact)
    add_impl(env.trait_reg, ImplEntry {
        trait_name: entry_trait_name,
        target_type_name: entry_target_type_name,
        type_params: type_params,
        dict_bounds: dict_bounds,
        method_names: method_names,
        assoc_types: map_new(),
        method_schemes: map_clone(local_exact),
        is_authoritative_drop: false,
        origin: entry_origin,
        span: entry_span
    })
}

// ============================================================
// Helper: create an open effect row (for HOF effect polymorphism)
// ============================================================

fn open_row(mut env: TypeEnv) -> OpenRow {
    let tail_id = env.fresh_var_id()
    let row_tail_id = tail_id
    let result_tail_id = tail_id
    OpenRow {
        eff: EffectRow { effects: [], tail: some(row_tail_id) },
        tail_id: result_tail_id
    }
}

// ============================================================
// Helper: make a List<T> struct type from a type variable
// ============================================================

fn make_list_struct(t: Type) -> Type {
    Type::StructType { name: BUILTIN_LIST, type_params: [t] }
}

// ============================================================
// Helper: make a Set<T> struct type from a type variable
// ============================================================

fn make_set_struct(t: Type) -> Type {
    Type::StructType { name: BUILTIN_SET, type_params: [t] }
}

// Builtin signatures are persistent compiler metadata. Rebuild every repeated
// type/effect occurrence from its stable inference identity so no declaration
// depends on aliasing a previously consumed metadata node.
fn builtin_type_var(id: Int) -> Type {
    Type::TypeVar { id: id, name: none }
}

fn builtin_open_effect_row(tail_id: Int) -> EffectRow {
    EffectRow { effects: [], tail: some(tail_id) }
}

fn builtin_unsafe_effect_row() -> EffectRow {
    EffectRow { effects: [Effect::UnsafeEffect], tail: none }
}

// ============================================================
// Main entry point: register all builtins
// ============================================================

pub fn register_builtins(mut env: TypeEnv, sink: CollectingSink) {
    register_effects(env)
    register_cell(env, sink)
    register_option(env, sink)
    register_eq_trait(env, sink)
    register_option_eq(env, sink)
    register_clone_trait(env, sink)
    register_option_clone(env, sink)
    register_drop_trait(env)
    register_ord_trait(env, sink)
    register_debug_trait(env, sink)
    register_option_debug(env, sink)
    register_hash_trait(env, sink)
    register_mut_methods(env)
    register_ptr_builtins(env, sink)
}

// ============================================================
// Register built-in mut methods (mutating method names per type)
// ============================================================

fn register_mut_methods(mut env: TypeEnv) {
    let mut list_mut: Set<Str> = set_new()
    for m in ["push", "pop", "set", "extend", "reverse", "sort", "shift", "clear", "sort_by"] {
        let method_name = m
        list_mut.insert(method_name)
    }
    env.trait_reg.mut_methods.insert("List", list_mut)

    let mut map_mut: Set<Str> = set_new()
    for m in ["insert", "remove", "clear"] {
        let method_name = m
        map_mut.insert(method_name)
    }
    env.trait_reg.mut_methods.insert("Map", map_mut)

    let mut set_mut: Set<Str> = set_new()
    for m in ["insert", "remove", "clear"] {
        let method_name = m
        set_mut.insert(method_name)
    }
    env.trait_reg.mut_methods.insert("Set", set_mut)
}

// Main entry point: register all HOF intrinsics
pub fn register_hof_intrinsics(mut env: TypeEnv, sink: CollectingSink) {
    register_list_hof(env, sink)
    register_map_hof(env, sink)
    register_set_hof(env, sink)
    register_option_hof(env, sink)
}

// ============================================================
// register_effects: "io" and "fail" built-in effects
// ============================================================

fn register_effects(mut env: TypeEnv) {
    // io effect
    env.types.effects.insert("io", EffectDef {
        name: "io",
        type_params: [],
        type_param_vars: [],
        ops: [
            EffectOpDef { name: "read", params: [STR], return_type: STR, has_default: false },
            EffectOpDef { name: "write", params: [STR, STR], return_type: UNIT, has_default: false }
        ],
        built_in_kind: some(BuiltInKind::BkIo),
        all_have_defaults: false
    })

    // fail effect
    let fail_t_id = env.fresh_var_id()
    let fail_t = Type::TypeVar { id: fail_t_id, name: none }
    env.types.effects.insert("fail", EffectDef {
        name: "fail",
        type_params: ["E"],
        type_param_vars: [fail_t_id],
        ops: [
            EffectOpDef { name: "raise", params: [fail_t], return_type: NEVER, has_default: false }
        ],
        built_in_kind: some(BuiltInKind::BkFail),
        all_have_defaults: false
    })
}

// ============================================================
// register_cell: Cell<T> struct + get/set/update methods
// ============================================================

fn register_cell(mut env: TypeEnv, sink: CollectingSink) {
    // Register Cell struct definition
    let cell_t_id = env.fresh_var_id()
    let cell_t = Type::TypeVar { id: cell_t_id, name: none }
    env.types.structs.insert(BUILTIN_CELL, StructDef {
        name: BUILTIN_CELL,
        type_params: ["T"],
        type_param_vars: [cell_t_id],
        fields: [StructField { name: "value", ty: cell_t, is_pub: true }],
        derive_attrs: [],
        is_extern: false
    })

    // Register Cell constructor function
    let ctor_t_id = env.fresh_var_id()
    let ctor_t = Type::TypeVar { id: ctor_t_id, name: none }
    let ctor_param_t = ctor_t
    let ctor_return_t = ctor_t
    let ctor_ret = Type::StructType {
        name: BUILTIN_CELL,
        type_params: [ctor_return_t]
    }
    bind_builtin_callable(env, BUILTIN_CELL, TypeScheme {
        ty: Type::FnType { params: [ctor_param_t], return_type: ctor_ret, meta: fn_meta(EMPTY_ROW, CALLABLE_BORROW_OWNED) },
        type_vars: [ctor_t_id],
        bounds: [],
        def_id: none
    })

    // Methods: get, set, update
    let m_t_id = env.fresh_var_id()
    let get_self_type = Type::StructType {
        name: BUILTIN_CELL,
        type_params: [Type::TypeVar { id: m_t_id, name: none }]
    }
    let set_self_type = Type::StructType {
        name: BUILTIN_CELL,
        type_params: [Type::TypeVar { id: m_t_id, name: none }]
    }
    let update_self_type = Type::StructType {
        name: BUILTIN_CELL,
        type_params: [Type::TypeVar { id: m_t_id, name: none }]
    }

    let mut methods: Map<Str, TypeScheme> = map_new()

    // get: (Cell<T>) -> T / mut
    methods.insert("get", TypeScheme {
        ty: Type::FnType {
            params: [get_self_type],
            return_type: Type::TypeVar { id: m_t_id, name: none },
            meta: fn_meta(EffectRow {
                effects: [Effect::MutEffect {
                    state_type: Type::TypeVar { id: m_t_id, name: none }
                }], tail: none
            }, CALLABLE_BORROW_OWNED)
        },
        type_vars: [m_t_id],
        bounds: [],
        def_id: none
    })

    // set: (Cell<T>, T) -> () / mut
    methods.insert("set", TypeScheme {
        ty: Type::FnType {
            params: [set_self_type,
                Type::TypeVar { id: m_t_id, name: none }],
            return_type: UNIT,
            meta: fn_meta(EffectRow {
                effects: [Effect::MutEffect {
                    state_type: Type::TypeVar { id: m_t_id, name: none }
                }], tail: none
            }, CALLABLE_MUT_MOVE_OWNED)
        },
        type_vars: [m_t_id],
        bounds: [],
        def_id: none
    })

    // update: (Cell<T>, (T) -> T) -> () / mut
    let update_cb = Type::FnType {
        params: [Type::TypeVar { id: m_t_id, name: none }],
        return_type: Type::TypeVar { id: m_t_id, name: none },
        meta: fn_meta(EMPTY_ROW, CALLABLE_MOVE_OWNED)
    }
    methods.insert("update", TypeScheme {
        ty: Type::FnType {
            params: [update_self_type, update_cb], return_type: UNIT,
            meta: fn_meta(EffectRow {
                effects: [Effect::MutEffect {
                    state_type: Type::TypeVar { id: m_t_id, name: none }
                }], tail: none
            }, CALLABLE_FIRST_MUT_BORROW_OWNED)
        },
        type_vars: [m_t_id],
        bounds: [],
        def_id: none
    })

    let _ = install_builtin_method_map(
        env, sink, BUILTIN_CELL, "<builtin-inherent>:Cell:core",
        none, methods)
}

// ============================================================
// register_option: Option<T> enum + some/none constructors + methods
// ============================================================

fn register_option(mut env: TypeEnv, sink: CollectingSink) {
    // Register Option enum definition
    let option_t_id = env.fresh_var_id()
    let option_t = Type::TypeVar { id: option_t_id, name: none }
    let mut option_vi: Map<Str, Int> = map_new()
    option_vi.insert("some", 0)
    option_vi.insert("none", 1)
    env.types.enums.insert(BUILTIN_OPTION, EnumDef {
        name: BUILTIN_OPTION,
        type_params: ["T"],
        type_param_vars: [option_t_id],
        variants: [
            EnumVariant { name: "some", fields: [option_t], field_names: none },
            EnumVariant { name: "none", fields: [], field_names: none }
        ],
        derive_attrs: [],
        variant_index: option_vi
    })

    env.types.variant_to_enum.insert("some", BUILTIN_OPTION)
    env.types.variant_to_enum.insert("none", BUILTIN_OPTION)

    // some constructor: (T) -> Option<T>
    let some_t_id = env.fresh_var_id()
    let some_t = Type::TypeVar { id: some_t_id, name: none }
    let some_param_t = some_t
    let some_return_t = some_t
    bind_builtin_callable(env, "some", TypeScheme {
        ty: Type::FnType {
            params: [some_param_t],
            return_type: make_option_type(some_return_t),
            meta: fn_meta(EMPTY_ROW, CALLABLE_MOVE_OWNED)
        },
        type_vars: [some_t_id],
        bounds: [],
        def_id: none
    })
    // `some` is a normal payload constructor. Preserve exact constructor
    // identity through its DefId so call lowering and sink classification do
    // not depend on a same-spelled local/global.
    match env.lookup("some") {
        some(scheme) => match scheme.def_id {
            some(def_id) => {
                let ctor_def_id = def_id
                env.types.variant_ctor_origins.insert(ctor_def_id,
                    variant_ctor_name(BUILTIN_OPTION, "some"))
            },
            none => {}
        },
        none => {}
    }

    // none: Option<T> (not a function, just a polymorphic value)
    let none_t_id = env.fresh_var_id()
    let none_t = Type::TypeVar { id: none_t_id, name: none }
    env.bind("none", TypeScheme {
        ty: make_option_type(none_t),
        type_vars: [none_t_id],
        bounds: [],
        def_id: none
    })
    // `none` still needs its exact canonical identity so both backends select
    // the runtime singleton symbol. Ownership freshness is classified
    // separately: is_nullary_variant_ctor_ident excludes this one borrowed
    // built-in constructor result.
    match env.lookup("none") {
        some(scheme) => match scheme.def_id {
            some(def_id) => {
                let ctor_def_id = def_id
                env.types.variant_ctor_origins.insert(ctor_def_id,
                    variant_ctor_name(BUILTIN_OPTION, "none"))
            },
            none => {}
        },
        none => {}
    }

    // Option methods: is_some, is_none, unwrap_or
    let mut methods: Map<Str, TypeScheme> = map_new()

    let t_id = env.fresh_var_id()
    let is_some_self_type = make_option_type(
        Type::TypeVar { id: t_id, name: none })
    let is_none_self_type = make_option_type(
        Type::TypeVar { id: t_id, name: none })
    let unwrap_or_self_type = make_option_type(
        Type::TypeVar { id: t_id, name: none })
    let unwrap_self_type = make_option_type(
        Type::TypeVar { id: t_id, name: none })

    methods.insert("is_some", TypeScheme {
        ty: Type::FnType { params: [is_some_self_type], return_type: BOOL, meta: fn_meta(EMPTY_ROW, CALLABLE_BORROW_OWNED) },
        type_vars: [t_id],
        bounds: [],
        def_id: none
    })

    methods.insert("is_none", TypeScheme {
        ty: Type::FnType { params: [is_none_self_type], return_type: BOOL, meta: fn_meta(EMPTY_ROW, CALLABLE_BORROW_OWNED) },
        type_vars: [t_id],
        bounds: [],
        def_id: none
    })

    methods.insert("unwrap_or", TypeScheme {
        ty: Type::FnType {
            params: [unwrap_or_self_type,
                Type::TypeVar { id: t_id, name: none }],
            return_type: Type::TypeVar { id: t_id, name: none },
            meta: fn_meta(EMPTY_ROW, CALLABLE_BORROW_BORROWED)
        },
        type_vars: [t_id],
        bounds: [],
        def_id: none
    })

    methods.insert("unwrap", TypeScheme {
        ty: Type::FnType {
            params: [unwrap_self_type],
            return_type: Type::TypeVar { id: t_id, name: none },
            meta: fn_meta(EMPTY_ROW, CALLABLE_BORROW_BORROWED)
        },
        type_vars: [t_id],
        bounds: [],
        def_id: none
    })

    let e_id = env.fresh_var_id()
    let self_type2 = make_option_type(Type::TypeVar { id: t_id, name: none })
    let fail_eff = Effect::FailEffect {
        error_type: Type::TypeVar { id: e_id, name: none }
    }
    methods.insert("to_fail", TypeScheme {
        ty: Type::FnType {
            params: [self_type2,
                Type::TypeVar { id: e_id, name: none }],
            return_type: Type::TypeVar { id: t_id, name: none },
            meta: fn_meta(
                EffectRow { effects: [fail_eff], tail: none },
                CALLABLE_BORROW_MOVE_BORROWED)
        },
        type_vars: [t_id, e_id],
        bounds: [],
        def_id: none
    })
    let _ = install_builtin_method_map(
        env, sink, BUILTIN_OPTION, "<builtin-inherent>:Option:core",
        none, methods)
}

// ============================================================
// register_eq_trait: Eq trait + primitive impls
// ============================================================

fn register_eq_trait(mut env: TypeEnv, sink: CollectingSink) {
    let self_var_id = env.fresh_var_id()

    let eq_fn = Type::FnType { params: [
        Type::TypeVar { id: self_var_id, name: none },
        Type::TypeVar { id: self_var_id, name: none }
    ], return_type: BOOL, meta: fn_meta(EMPTY_ROW, CALLABLE_BORROW_OWNED) }
    let ne_fn = Type::FnType { params: [
        Type::TypeVar { id: self_var_id, name: none },
        Type::TypeVar { id: self_var_id, name: none }
    ], return_type: BOOL, meta: fn_meta(EMPTY_ROW, CALLABLE_BORROW_OWNED) }

    let trait_def_id = env.fresh_def_id()
    env.trait_reg.traits.insert("Eq", TraitDef {
        name: "Eq",
        def_id: trait_def_id,
        type_params: [],
        type_param_vars: [self_var_id],
        methods: [
            builtin_trait_method(env, "eq", eq_fn, false, [false, false]),
            builtin_trait_method(env, "ne", ne_fn, true, [false, false])
        ],
        supertraits: [],
        assoc_types: []
    })

    // Register Eq impls for primitive types
    for prim in ["Int", "Float", "Str", "Bool"] {
        let primitive_name = prim
        add_builtin_impl(
            env, sink, "Eq", primitive_name, [], [], [], ["eq", "ne"])
    }
}

// ============================================================
// register_option_eq: Option<T: Eq> Eq impl
// ============================================================

fn register_option_eq(mut env: TypeEnv, sink: CollectingSink) {
    let t_id = env.fresh_var_id()
    add_builtin_impl(env, sink, "Eq", BUILTIN_OPTION, ["T"], [t_id],
        [ImplDictBound { type_param_index: 0, trait_name: "Eq" }],
        ["eq", "ne"])
}

// ============================================================
// register_clone_trait: Clone trait + primitive + collection impls
// ============================================================

fn register_clone_trait(mut env: TypeEnv, sink: CollectingSink) {
    let self_var_id = env.fresh_var_id()

    let clone_fn = Type::FnType {
        params: [Type::TypeVar { id: self_var_id, name: none }],
        return_type: Type::TypeVar { id: self_var_id, name: none },
        meta: fn_meta(EMPTY_ROW, CALLABLE_BORROW_OWNED)
    }

    let trait_def_id = env.fresh_def_id()
    let authoritative_clone_def_id = trait_def_id
    let clone_trait_def_id = trait_def_id
    env.trait_reg.authoritative_clone_def_id = some(authoritative_clone_def_id)
    env.trait_reg.traits.insert("Clone", TraitDef {
        name: "Clone",
        def_id: clone_trait_def_id,
        type_params: [],
        type_param_vars: [self_var_id],
        methods: [
            builtin_trait_method(env, "clone", clone_fn, false, [false])
        ],
        supertraits: [],
        assoc_types: []
    })

    // Primitive impls
    for prim in ["Int", "Float", "Str", "Bool"] {
        let primitive_name = prim
        add_builtin_impl(
            env, sink, "Clone", primitive_name, [], [], [], ["clone"])
    }

    // Collection impls
    let list_t_id = env.fresh_var_id()
    add_builtin_impl(env, sink, "Clone", BUILTIN_LIST,
        ["T"], [list_t_id],
        [ImplDictBound { type_param_index: 0, trait_name: "Clone" }],
        ["clone"])
    let map_k_id = env.fresh_var_id()
    let map_v_id = env.fresh_var_id()
    add_builtin_impl(env, sink, "Clone", BUILTIN_MAP,
        ["K", "V"], [map_k_id, map_v_id], [
            ImplDictBound { type_param_index: 0, trait_name: "Clone" },
            ImplDictBound { type_param_index: 1, trait_name: "Clone" }
        ], ["clone"])
    let set_t_id = env.fresh_var_id()
    add_builtin_impl(env, sink, "Clone", BUILTIN_SET,
        ["T"], [set_t_id],
        [ImplDictBound { type_param_index: 0, trait_name: "Clone" }],
        ["clone"])
}

// ============================================================
// register_drop_trait: Drop trait (B-002p1)
// ============================================================

fn register_drop_trait(mut env: TypeEnv) {
    let self_var_id = env.fresh_var_id()

    // drop(self) -> Unit, with {io} effect (allows flush/log/close)
    let io_row = EffectRow { effects: [Effect::IoEffect], tail: none }
    let drop_fn = Type::FnType {
        params: [Type::TypeVar { id: self_var_id, name: none }],
        return_type: UNIT,
        meta: fn_meta(io_row, CALLABLE_MOVE_OWNED)
    }

    let trait_def_id = env.fresh_def_id()
    let authoritative_drop_def_id = trait_def_id
    let drop_trait_def_id = trait_def_id
    env.trait_reg.authoritative_drop_def_id = some(authoritative_drop_def_id)
    env.trait_reg.traits.insert("Drop", TraitDef {
        name: "Drop",
        def_id: drop_trait_def_id,
        type_params: [],
        type_param_vars: [self_var_id],
        methods: [
            builtin_force_trait_method(env, "drop", drop_fn, false, [false])
        ],
        supertraits: [],
        assoc_types: []
    })
}

// ============================================================
// register_option_clone: Option<T: Clone> Clone impl
// ============================================================

fn register_option_clone(mut env: TypeEnv, sink: CollectingSink) {
    let t_id = env.fresh_var_id()
    add_builtin_impl(env, sink, "Clone", BUILTIN_OPTION, ["T"], [t_id],
        [ImplDictBound { type_param_index: 0, trait_name: "Clone" }],
        ["clone"])
}

// ============================================================
// register_ord_trait: Ord trait + primitive impls
// ============================================================

fn register_ord_trait(mut env: TypeEnv, sink: CollectingSink) {
    let self_var_id = env.fresh_var_id()

    let cmp_fn = Type::FnType { params: [
        Type::TypeVar { id: self_var_id, name: none },
        Type::TypeVar { id: self_var_id, name: none }
    ], return_type: INT, meta: fn_meta(EMPTY_ROW, CALLABLE_BORROW_OWNED) }

    let trait_def_id = env.fresh_def_id()
    env.trait_reg.traits.insert("Ord", TraitDef {
        name: "Ord",
        def_id: trait_def_id,
        type_params: [],
        type_param_vars: [self_var_id],
        methods: [
            builtin_trait_method(env, "cmp", cmp_fn, false, [false, false])
        ],
        supertraits: [],
        assoc_types: []
    })

    for prim in ["Int", "Float", "Str", "Bool"] {
        let primitive_name = prim
        add_builtin_impl(
            env, sink, "Ord", primitive_name, [], [], [], ["cmp"])
    }
}

// ============================================================
// register_debug_trait: Debug trait + primitive + collection impls
// ============================================================

fn register_debug_trait(mut env: TypeEnv, sink: CollectingSink) {
    let self_var_id = env.fresh_var_id()

    let debug_fn = Type::FnType {
        params: [Type::TypeVar { id: self_var_id, name: none }],
        return_type: STR,
        meta: fn_meta(EMPTY_ROW, CALLABLE_BORROW_OWNED)
    }

    let trait_def_id = env.fresh_def_id()
    env.trait_reg.traits.insert("Debug", TraitDef {
        name: "Debug",
        def_id: trait_def_id,
        type_params: [],
        type_param_vars: [self_var_id],
        methods: [
            builtin_trait_method(env, "debug", debug_fn, false, [false])
        ],
        supertraits: [],
        assoc_types: []
    })

    // Primitive impls
    for prim in ["Int", "Float", "Str", "Bool"] {
        let primitive_name = prim
        add_builtin_impl(
            env, sink, "Debug", primitive_name, [], [], [], ["debug"])
    }

    // List<T: Debug> Debug impl
    let list_t_id = env.fresh_var_id()
    add_builtin_impl(env, sink, "Debug", BUILTIN_LIST,
        ["T"], [list_t_id],
        [ImplDictBound { type_param_index: 0, trait_name: "Debug" }],
        ["debug"])

    // Map<K, V> Debug impl (no bounds required in TS source)
    let map_k_id = env.fresh_var_id()
    let map_v_id = env.fresh_var_id()
    add_builtin_impl(env, sink, "Debug", BUILTIN_MAP,
        ["K", "V"], [map_k_id, map_v_id], [], ["debug"])

    // Set<T> Debug impl (no bounds required in TS source)
    let set_t_id = env.fresh_var_id()
    add_builtin_impl(env, sink, "Debug", BUILTIN_SET,
        ["T"], [set_t_id], [], ["debug"])
}

// ============================================================
// register_option_debug: Option<T: Debug> Debug impl
// ============================================================

fn register_option_debug(mut env: TypeEnv, sink: CollectingSink) {
    let t_id = env.fresh_var_id()
    add_builtin_impl(env, sink, "Debug", BUILTIN_OPTION, ["T"], [t_id],
        [ImplDictBound { type_param_index: 0, trait_name: "Debug" }],
        ["debug"])
}

// ============================================================
// register_hash_trait: Hash trait + primitive impls
// ============================================================

fn register_hash_trait(mut env: TypeEnv, sink: CollectingSink) {
    let self_var_id = env.fresh_var_id()

    let hash_fn = Type::FnType {
        params: [Type::TypeVar { id: self_var_id, name: none }],
        return_type: INT,
        meta: fn_meta(EMPTY_ROW, CALLABLE_BORROW_OWNED)
    }

    let trait_def_id = env.fresh_def_id()
    env.trait_reg.traits.insert("Hash", TraitDef {
        name: "Hash",
        def_id: trait_def_id,
        type_params: [],
        type_param_vars: [self_var_id],
        methods: [
            builtin_trait_method(env, "hash", hash_fn, false, [false])
        ],
        supertraits: [],
        assoc_types: []
    })

    for prim in ["Int", "Str", "Bool"] {
        let primitive_name = prim
        add_builtin_impl(
            env, sink, "Hash", primitive_name, [], [], [], ["hash"])
    }
}

// ============================================================
// HOF: register_list_hof
// ============================================================

fn register_list_hof(mut env: TypeEnv, sink: CollectingSink) {
    let mut methods: Map<Str, TypeScheme> = map_new()

    // map: (List<T>, (T) -> U / e) -> List<U> / e
    let mut t_id = env.fresh_var_id()
    let mut t = Type::TypeVar { id: t_id, name: none }
    let mut u_id = env.fresh_var_id()
    let mut u = Type::TypeVar { id: u_id, name: none }
    let mut orow = open_row(env)
    let mut cb = Type::FnType {
        params: [builtin_type_var(t_id)],
        return_type: builtin_type_var(u_id),
        meta: fn_meta(builtin_open_effect_row(orow.tail_id),
            CALLABLE_BORROW_OWNED)
    }
    methods.insert("map", TypeScheme {
        ty: Type::FnType {
            params: [make_list_struct(builtin_type_var(t_id)), cb],
            return_type: make_list_struct(builtin_type_var(u_id)),
            meta: fn_meta(builtin_open_effect_row(orow.tail_id),
                CALLABLE_BORROW_OWNED)
        },
        type_vars: [t_id, u_id, orow.tail_id],
        bounds: [],
        def_id: none
    })

    // filter: (List<T>, (T) -> Bool / e) -> List<T> / e
    t_id = env.fresh_var_id()
    t = Type::TypeVar { id: t_id, name: none }
    orow = open_row(env)
    cb = Type::FnType {
        params: [builtin_type_var(t_id)], return_type: BOOL,
        meta: fn_meta(builtin_open_effect_row(orow.tail_id),
            CALLABLE_BORROW_OWNED)
    }
    methods.insert("filter", TypeScheme {
        ty: Type::FnType {
            params: [make_list_struct(builtin_type_var(t_id)), cb],
            return_type: make_list_struct(builtin_type_var(t_id)),
            meta: fn_meta(builtin_open_effect_row(orow.tail_id),
                CALLABLE_BORROW_OWNED)
        },
        type_vars: [t_id, orow.tail_id],
        bounds: [],
        def_id: none
    })

    // flat_map: (List<T>, (T) -> List<U> / e) -> List<U> / e
    t_id = env.fresh_var_id()
    t = Type::TypeVar { id: t_id, name: none }
    u_id = env.fresh_var_id()
    u = Type::TypeVar { id: u_id, name: none }
    orow = open_row(env)
    cb = Type::FnType {
        params: [builtin_type_var(t_id)],
        return_type: make_list_struct(builtin_type_var(u_id)),
        meta: fn_meta(builtin_open_effect_row(orow.tail_id),
            CALLABLE_BORROW_OWNED)
    }
    methods.insert("flat_map", TypeScheme {
        ty: Type::FnType {
            params: [make_list_struct(builtin_type_var(t_id)), cb],
            return_type: make_list_struct(builtin_type_var(u_id)),
            meta: fn_meta(builtin_open_effect_row(orow.tail_id),
                CALLABLE_BORROW_OWNED)
        },
        type_vars: [t_id, u_id, orow.tail_id],
        bounds: [],
        def_id: none
    })

    // fold: (List<T>, U, (U, T) -> U / e) -> U / e
    t_id = env.fresh_var_id()
    t = Type::TypeVar { id: t_id, name: none }
    u_id = env.fresh_var_id()
    u = Type::TypeVar { id: u_id, name: none }
    orow = open_row(env)
    cb = Type::FnType {
        params: [builtin_type_var(u_id), builtin_type_var(t_id)],
        return_type: builtin_type_var(u_id),
        meta: fn_meta(builtin_open_effect_row(orow.tail_id),
            CALLABLE_BORROW_OWNED)
    }
    methods.insert("fold", TypeScheme {
        ty: Type::FnType {
            params: [make_list_struct(builtin_type_var(t_id)),
                builtin_type_var(u_id), cb],
            return_type: builtin_type_var(u_id),
            meta: fn_meta(builtin_open_effect_row(orow.tail_id),
                CALLABLE_BORROW_OWNED)
        },
        type_vars: [t_id, u_id, orow.tail_id],
        bounds: [],
        def_id: none
    })

    // any: (List<T>, (T) -> Bool / e) -> Bool / e
    t_id = env.fresh_var_id()
    t = Type::TypeVar { id: t_id, name: none }
    orow = open_row(env)
    cb = Type::FnType {
        params: [builtin_type_var(t_id)], return_type: BOOL,
        meta: fn_meta(builtin_open_effect_row(orow.tail_id),
            CALLABLE_BORROW_OWNED)
    }
    methods.insert("any", TypeScheme {
        ty: Type::FnType {
            params: [make_list_struct(builtin_type_var(t_id)), cb],
            return_type: BOOL,
            meta: fn_meta(builtin_open_effect_row(orow.tail_id),
                CALLABLE_BORROW_OWNED)
        },
        type_vars: [t_id, orow.tail_id],
        bounds: [],
        def_id: none
    })

    // all: (List<T>, (T) -> Bool / e) -> Bool / e
    t_id = env.fresh_var_id()
    t = Type::TypeVar { id: t_id, name: none }
    orow = open_row(env)
    cb = Type::FnType {
        params: [builtin_type_var(t_id)], return_type: BOOL,
        meta: fn_meta(builtin_open_effect_row(orow.tail_id),
            CALLABLE_BORROW_OWNED)
    }
    methods.insert("all", TypeScheme {
        ty: Type::FnType {
            params: [make_list_struct(builtin_type_var(t_id)), cb],
            return_type: BOOL,
            meta: fn_meta(builtin_open_effect_row(orow.tail_id),
                CALLABLE_BORROW_OWNED)
        },
        type_vars: [t_id, orow.tail_id],
        bounds: [],
        def_id: none
    })

    // find: (List<T>, (T) -> Bool / e) -> Option<T> / e
    t_id = env.fresh_var_id()
    t = Type::TypeVar { id: t_id, name: none }
    orow = open_row(env)
    cb = Type::FnType {
        params: [builtin_type_var(t_id)], return_type: BOOL,
        meta: fn_meta(builtin_open_effect_row(orow.tail_id),
            CALLABLE_BORROW_OWNED)
    }
    methods.insert("find", TypeScheme {
        ty: Type::FnType {
            params: [make_list_struct(builtin_type_var(t_id)), cb],
            return_type: make_option_type(builtin_type_var(t_id)),
            meta: fn_meta(builtin_open_effect_row(orow.tail_id),
                CALLABLE_BORROW_OWNED)
        },
        type_vars: [t_id, orow.tail_id],
        bounds: [],
        def_id: none
    })

    // find_index: (List<T>, (T) -> Bool / e) -> Option<Int> / e
    t_id = env.fresh_var_id()
    t = Type::TypeVar { id: t_id, name: none }
    orow = open_row(env)
    cb = Type::FnType {
        params: [builtin_type_var(t_id)], return_type: BOOL,
        meta: fn_meta(builtin_open_effect_row(orow.tail_id),
            CALLABLE_BORROW_OWNED)
    }
    methods.insert("find_index", TypeScheme {
        ty: Type::FnType {
            params: [make_list_struct(builtin_type_var(t_id)), cb],
            return_type: make_option_type(INT),
            meta: fn_meta(builtin_open_effect_row(orow.tail_id),
                CALLABLE_BORROW_OWNED)
        },
        type_vars: [t_id, orow.tail_id],
        bounds: [],
        def_id: none
    })

    // sort_by: (List<T>, (T, T) -> Int / e) -> () / e
    t_id = env.fresh_var_id()
    t = Type::TypeVar { id: t_id, name: none }
    orow = open_row(env)
    cb = Type::FnType {
        params: [builtin_type_var(t_id), builtin_type_var(t_id)],
        return_type: INT,
        meta: fn_meta(builtin_open_effect_row(orow.tail_id),
            CALLABLE_BORROW_OWNED)
    }
    methods.insert("sort_by", TypeScheme {
        ty: Type::FnType {
            params: [make_list_struct(builtin_type_var(t_id)), cb],
            return_type: UNIT,
            meta: fn_meta(builtin_open_effect_row(orow.tail_id),
                CALLABLE_FIRST_MUT_BORROW_OWNED)
        },
        type_vars: [t_id, orow.tail_id],
        bounds: [],
        def_id: none
    })
    let _ = install_builtin_method_map(
        env, sink, BUILTIN_LIST, "<std-predecl>:List:unbounded",
        none, methods)
}

// ============================================================
// HOF: register_map_hof
// ============================================================

fn register_map_hof(mut env: TypeEnv, sink: CollectingSink) {
    let mut methods: Map<Str, TypeScheme> = map_new()

    // map_values: (Map<K,V>, (V) -> U / e) -> Map<K,U> / e
    let mut k_id = env.fresh_var_id()
    let mut k = Type::TypeVar { id: k_id, name: none }
    let mut v_id = env.fresh_var_id()
    let mut v = Type::TypeVar { id: v_id, name: none }
    let mut u_id = env.fresh_var_id()
    let mut u = Type::TypeVar { id: u_id, name: none }
    let mut orow = open_row(env)
    let mut cb = Type::FnType {
        params: [builtin_type_var(v_id)],
        return_type: builtin_type_var(u_id),
        meta: fn_meta(builtin_open_effect_row(orow.tail_id),
            CALLABLE_BORROW_OWNED)
    }
    methods.insert("map_values", TypeScheme {
        ty: Type::FnType {
            params: [make_map_type(
                builtin_type_var(k_id), builtin_type_var(v_id)), cb],
            return_type: make_map_type(
                builtin_type_var(k_id), builtin_type_var(u_id)),
            meta: fn_meta(builtin_open_effect_row(orow.tail_id),
                CALLABLE_BORROW_OWNED)
        },
        type_vars: [k_id, v_id, u_id, orow.tail_id],
        bounds: [],
        def_id: none
    })

    // filter: (Map<K,V>, (K, V) -> Bool / e) -> Map<K,V> / e
    k_id = env.fresh_var_id()
    k = Type::TypeVar { id: k_id, name: none }
    v_id = env.fresh_var_id()
    v = Type::TypeVar { id: v_id, name: none }
    orow = open_row(env)
    cb = Type::FnType {
        params: [builtin_type_var(k_id), builtin_type_var(v_id)],
        return_type: BOOL,
        meta: fn_meta(builtin_open_effect_row(orow.tail_id),
            CALLABLE_BORROW_OWNED)
    }
    methods.insert("filter", TypeScheme {
        ty: Type::FnType {
            params: [make_map_type(
                builtin_type_var(k_id), builtin_type_var(v_id)), cb],
            return_type: make_map_type(
                builtin_type_var(k_id), builtin_type_var(v_id)),
            meta: fn_meta(builtin_open_effect_row(orow.tail_id),
                CALLABLE_BORROW_OWNED)
        },
        type_vars: [k_id, v_id, orow.tail_id],
        bounds: [],
        def_id: none
    })

    // fold: (Map<K,V>, U, (U, K, V) -> U / e) -> U / e
    k_id = env.fresh_var_id()
    k = Type::TypeVar { id: k_id, name: none }
    v_id = env.fresh_var_id()
    v = Type::TypeVar { id: v_id, name: none }
    u_id = env.fresh_var_id()
    u = Type::TypeVar { id: u_id, name: none }
    orow = open_row(env)
    cb = Type::FnType {
        params: [builtin_type_var(u_id), builtin_type_var(k_id),
            builtin_type_var(v_id)],
        return_type: builtin_type_var(u_id),
        meta: fn_meta(builtin_open_effect_row(orow.tail_id),
            CALLABLE_BORROW_OWNED)
    }
    methods.insert("fold", TypeScheme {
        ty: Type::FnType {
            params: [make_map_type(
                builtin_type_var(k_id), builtin_type_var(v_id)),
                builtin_type_var(u_id), cb],
            return_type: builtin_type_var(u_id),
            meta: fn_meta(builtin_open_effect_row(orow.tail_id),
                CALLABLE_BORROW_OWNED)
        },
        type_vars: [k_id, v_id, u_id, orow.tail_id],
        bounds: [],
        def_id: none
    })

    // any: (Map<K,V>, (K, V) -> Bool / e) -> Bool / e
    k_id = env.fresh_var_id()
    k = Type::TypeVar { id: k_id, name: none }
    v_id = env.fresh_var_id()
    v = Type::TypeVar { id: v_id, name: none }
    orow = open_row(env)
    cb = Type::FnType {
        params: [builtin_type_var(k_id), builtin_type_var(v_id)],
        return_type: BOOL,
        meta: fn_meta(builtin_open_effect_row(orow.tail_id),
            CALLABLE_BORROW_OWNED)
    }
    methods.insert("any", TypeScheme {
        ty: Type::FnType {
            params: [make_map_type(
                builtin_type_var(k_id), builtin_type_var(v_id)), cb],
            return_type: BOOL,
            meta: fn_meta(builtin_open_effect_row(orow.tail_id),
                CALLABLE_BORROW_OWNED)
        },
        type_vars: [k_id, v_id, orow.tail_id],
        bounds: [],
        def_id: none
    })
    let mut unbounded_methods: Map<Str, TypeScheme> = map_new()
    let mut bounded_methods: Map<Str, TypeScheme> = map_new()
    for entry in methods.entries() {
        let (method_name, scheme) = entry
        if method_name == "filter" || method_name == "map_values" {
            let bounded_method_name = method_name
            let bounded_scheme = scheme
            bounded_methods.insert(bounded_method_name, bounded_scheme)
        } else {
            let unbounded_method_name = method_name
            let unbounded_scheme = scheme
            unbounded_methods.insert(unbounded_method_name, unbounded_scheme)
        }
    }
    let _ = install_builtin_method_map(
        env, sink, BUILTIN_MAP, "<std-predecl>:Map:unbounded",
        none, unbounded_methods)
    let _ = install_builtin_method_map(
        env, sink, BUILTIN_MAP, "<std-predecl>:Map:bounded",
        none, bounded_methods)
}

// ============================================================
// HOF: register_set_hof
// ============================================================

fn register_set_hof(mut env: TypeEnv, sink: CollectingSink) {
    let mut methods: Map<Str, TypeScheme> = map_new()

    // filter: (Set<T>, (T) -> Bool / e) -> Set<T> / e
    let mut t_id = env.fresh_var_id()
    let mut t = Type::TypeVar { id: t_id, name: none }
    let mut orow = open_row(env)
    let mut cb = Type::FnType {
        params: [builtin_type_var(t_id)], return_type: BOOL,
        meta: fn_meta(builtin_open_effect_row(orow.tail_id),
            CALLABLE_BORROW_OWNED)
    }
    methods.insert("filter", TypeScheme {
        ty: Type::FnType {
            params: [make_set_struct(builtin_type_var(t_id)), cb],
            return_type: make_set_struct(builtin_type_var(t_id)),
            meta: fn_meta(builtin_open_effect_row(orow.tail_id),
                CALLABLE_BORROW_OWNED)
        },
        type_vars: [t_id, orow.tail_id],
        bounds: [
            SchemeBound { type_var: t_id, trait_name: "Hash", assoc_constraints: [] },
            SchemeBound { type_var: t_id, trait_name: "Eq", assoc_constraints: [] }
        ],
        def_id: none
    })

    // fold: (Set<T>, U, (U, T) -> U / e) -> U / e
    t_id = env.fresh_var_id()
    t = Type::TypeVar { id: t_id, name: none }
    let u_id = env.fresh_var_id()
    let u = Type::TypeVar { id: u_id, name: none }
    orow = open_row(env)
    cb = Type::FnType {
        params: [builtin_type_var(u_id), builtin_type_var(t_id)],
        return_type: builtin_type_var(u_id),
        meta: fn_meta(builtin_open_effect_row(orow.tail_id),
            CALLABLE_BORROW_OWNED)
    }
    methods.insert("fold", TypeScheme {
        ty: Type::FnType {
            params: [make_set_struct(builtin_type_var(t_id)),
                builtin_type_var(u_id), cb],
            return_type: builtin_type_var(u_id),
            meta: fn_meta(builtin_open_effect_row(orow.tail_id),
                CALLABLE_BORROW_OWNED)
        },
        type_vars: [t_id, u_id, orow.tail_id],
        bounds: [],
        def_id: none
    })

    // any: (Set<T>, (T) -> Bool / e) -> Bool / e
    t_id = env.fresh_var_id()
    t = Type::TypeVar { id: t_id, name: none }
    orow = open_row(env)
    cb = Type::FnType {
        params: [builtin_type_var(t_id)], return_type: BOOL,
        meta: fn_meta(builtin_open_effect_row(orow.tail_id),
            CALLABLE_BORROW_OWNED)
    }
    methods.insert("any", TypeScheme {
        ty: Type::FnType {
            params: [make_set_struct(builtin_type_var(t_id)), cb],
            return_type: BOOL,
            meta: fn_meta(builtin_open_effect_row(orow.tail_id),
                CALLABLE_BORROW_OWNED)
        },
        type_vars: [t_id, orow.tail_id],
        bounds: [],
        def_id: none
    })

    // all: (Set<T>, (T) -> Bool / e) -> Bool / e
    t_id = env.fresh_var_id()
    t = Type::TypeVar { id: t_id, name: none }
    orow = open_row(env)
    cb = Type::FnType {
        params: [builtin_type_var(t_id)], return_type: BOOL,
        meta: fn_meta(builtin_open_effect_row(orow.tail_id),
            CALLABLE_BORROW_OWNED)
    }
    methods.insert("all", TypeScheme {
        ty: Type::FnType {
            params: [make_set_struct(builtin_type_var(t_id)), cb],
            return_type: BOOL,
            meta: fn_meta(builtin_open_effect_row(orow.tail_id),
                CALLABLE_BORROW_OWNED)
        },
        type_vars: [t_id, orow.tail_id],
        bounds: [],
        def_id: none
    })
    let mut unbounded_methods: Map<Str, TypeScheme> = map_new()
    let mut bounded_methods: Map<Str, TypeScheme> = map_new()
    for entry in methods.entries() {
        let (method_name, scheme) = entry
        if method_name == "filter" {
            let bounded_method_name = method_name
            let bounded_scheme = scheme
            bounded_methods.insert(bounded_method_name, bounded_scheme)
        } else {
            let unbounded_method_name = method_name
            let unbounded_scheme = scheme
            unbounded_methods.insert(unbounded_method_name, unbounded_scheme)
        }
    }
    let _ = install_builtin_method_map(
        env, sink, BUILTIN_SET, "<std-predecl>:Set:unbounded",
        none, unbounded_methods)
    let _ = install_builtin_method_map(
        env, sink, BUILTIN_SET, "<std-predecl>:Set:bounded",
        none, bounded_methods)
}

// ============================================================
// HOF: register_option_hof
// ============================================================

fn register_option_hof(mut env: TypeEnv, sink: CollectingSink) {
    let mut methods: Map<Str, TypeScheme> = map_new()

    // map: (Option<T>, (T) -> U / e) -> Option<U> / e
    let mut t_id = env.fresh_var_id()
    let mut t = Type::TypeVar { id: t_id, name: none }
    let mut u_id = env.fresh_var_id()
    let mut u = Type::TypeVar { id: u_id, name: none }
    let mut orow = open_row(env)
    let mut cb = Type::FnType {
        params: [builtin_type_var(t_id)],
        return_type: builtin_type_var(u_id),
        meta: fn_meta(builtin_open_effect_row(orow.tail_id),
            CALLABLE_BORROW_OWNED)
    }
    methods.insert("map", TypeScheme {
        ty: Type::FnType {
            params: [make_option_type(builtin_type_var(t_id)), cb],
            return_type: make_option_type(builtin_type_var(u_id)),
            meta: fn_meta(builtin_open_effect_row(orow.tail_id),
                CALLABLE_BORROW_OWNED)
        },
        type_vars: [t_id, u_id, orow.tail_id],
        bounds: [],
        def_id: none
    })

    // and_then: (Option<T>, (T) -> Option<U> / e) -> Option<U> / e
    t_id = env.fresh_var_id()
    t = Type::TypeVar { id: t_id, name: none }
    u_id = env.fresh_var_id()
    u = Type::TypeVar { id: u_id, name: none }
    orow = open_row(env)
    cb = Type::FnType {
        params: [builtin_type_var(t_id)],
        return_type: make_option_type(builtin_type_var(u_id)),
        meta: fn_meta(builtin_open_effect_row(orow.tail_id),
            CALLABLE_BORROW_OWNED)
    }
    methods.insert("and_then", TypeScheme {
        ty: Type::FnType {
            params: [make_option_type(builtin_type_var(t_id)), cb],
            return_type: make_option_type(builtin_type_var(u_id)),
            meta: fn_meta(builtin_open_effect_row(orow.tail_id),
                CALLABLE_BORROW_OWNED)
        },
        type_vars: [t_id, u_id, orow.tail_id],
        bounds: [],
        def_id: none
    })

    // unwrap_or_else returns an owned value on both runtime branches: Some
    // duplicates its payload; None forwards the callback's owned result.
    t_id = env.fresh_var_id()
    t = Type::TypeVar { id: t_id, name: none }
    orow = open_row(env)
    cb = Type::FnType {
        params: [], return_type: builtin_type_var(t_id),
        meta: fn_meta(builtin_open_effect_row(orow.tail_id),
            CALLABLE_BORROW_OWNED)
    }
    methods.insert("unwrap_or_else", TypeScheme {
        ty: Type::FnType {
            params: [make_option_type(builtin_type_var(t_id)), cb],
            return_type: builtin_type_var(t_id),
            meta: fn_meta(builtin_open_effect_row(orow.tail_id),
                CALLABLE_BORROW_OWNED)
        },
        type_vars: [t_id, orow.tail_id],
        bounds: [],
        def_id: none
    })
    let _ = install_builtin_method_map(
        env, sink, BUILTIN_OPTION, "<builtin-inherent>:Option:hof",
        none, methods)
}

// ============================================================
// B-125: register Ptr<T> builtin functions and methods
// ============================================================

fn register_ptr_builtins(mut env: TypeEnv, sink: CollectingSink) {
    // ---- Top-level builtin functions ----

    // alloc(count: Int) -> Ptr<T> / unsafe
    let alloc_t_id = env.fresh_var_id()
    let alloc_t = Type::TypeVar { id: alloc_t_id, name: none }
    let alloc_ptr = Type::PtrType { pointee: alloc_t }
    bind_builtin_callable(env, "alloc", TypeScheme {
        ty: Type::FnType { params: [INT], return_type: alloc_ptr,
            meta: fn_meta(builtin_unsafe_effect_row(),
                CALLABLE_BORROW_OWNED) },
        type_vars: [alloc_t_id],
        bounds: [],
        def_id: none
    })

    // dealloc(p: Ptr<T>, count: Int) -> () / unsafe
    let dealloc_t_id = env.fresh_var_id()
    let dealloc_t = Type::TypeVar { id: dealloc_t_id, name: none }
    let dealloc_ptr = Type::PtrType { pointee: dealloc_t }
    bind_builtin_force_callable(env, "dealloc", TypeScheme {
        ty: Type::FnType {
            params: [dealloc_ptr, INT], return_type: UNIT,
            meta: fn_meta(builtin_unsafe_effect_row(),
                CALLABLE_MOVE_BORROW_OWNED)
        },
        type_vars: [dealloc_t_id],
        bounds: [],
        def_id: none
    })

    // ptr_copy(src: Ptr<T>, dst: Ptr<T>, count: Int) -> () / unsafe
    let copy_t_id = env.fresh_var_id()
    bind_builtin_callable(env, "ptr_copy", TypeScheme {
        ty: Type::FnType {
            params: [
                Type::PtrType { pointee: builtin_type_var(copy_t_id) },
                Type::PtrType { pointee: builtin_type_var(copy_t_id) },
                INT
            ], return_type: UNIT,
            meta: fn_meta(builtin_unsafe_effect_row(),
                CALLABLE_BORROW_MUT_BORROW_OWNED)
        },
        type_vars: [copy_t_id],
        bounds: [],
        def_id: none
    })

    // ptr_from_addr(a: Int) -> Ptr<T> (safe)
    let from_t_id = env.fresh_var_id()
    let from_t = Type::TypeVar { id: from_t_id, name: none }
    let from_ptr = Type::PtrType { pointee: from_t }
    bind_builtin_callable(env, "ptr_from_addr", TypeScheme {
        ty: Type::FnType { params: [INT], return_type: from_ptr, meta: fn_meta(EMPTY_ROW, CALLABLE_BORROW_OWNED) },
        type_vars: [from_t_id],
        bounds: [],
        def_id: none
    })

    // ---- Ptr<T> methods ----

    let mut methods: Map<Str, TypeScheme> = map_new()

    // read: (Ptr<T>) -> T / unsafe
    let read_t_id = env.fresh_var_id()
    methods.insert("read", TypeScheme {
        ty: Type::FnType {
            params: [Type::PtrType {
                pointee: builtin_type_var(read_t_id) }],
            return_type: builtin_type_var(read_t_id),
            meta: fn_meta(builtin_unsafe_effect_row(),
                CALLABLE_BORROW_OWNED)
        },
        type_vars: [read_t_id],
        bounds: [],
        def_id: none
    })

    // take: (Ptr<T>) -> T / unsafe
    let take_t_id = env.fresh_var_id()
    methods.insert("take", TypeScheme {
        ty: Type::FnType {
            params: [Type::PtrType {
                pointee: builtin_type_var(take_t_id) }],
            return_type: builtin_type_var(take_t_id),
            meta: fn_meta(builtin_unsafe_effect_row(),
                CALLABLE_FIRST_MUT_BORROW_OWNED)
        },
        type_vars: [take_t_id],
        bounds: [],
        def_id: none
    })

    // write: (Ptr<T>, T) -> () / unsafe
    let write_t_id = env.fresh_var_id()
    methods.insert("write", TypeScheme {
        ty: Type::FnType {
            params: [Type::PtrType {
                pointee: builtin_type_var(write_t_id) },
                builtin_type_var(write_t_id)],
            return_type: UNIT,
            meta: fn_meta(builtin_unsafe_effect_row(),
                CALLABLE_MUT_MOVE_OWNED)
        },
        type_vars: [write_t_id],
        bounds: [],
        def_id: none
    })

    // offset: (Ptr<T>, Int) -> Ptr<T> / unsafe
    let off_t_id = env.fresh_var_id()
    methods.insert("offset", TypeScheme {
        ty: Type::FnType {
            params: [Type::PtrType {
                pointee: builtin_type_var(off_t_id) }, INT],
            return_type: Type::PtrType {
                pointee: builtin_type_var(off_t_id) },
            meta: fn_meta(builtin_unsafe_effect_row(),
                CALLABLE_BORROW_BORROWED)
        },
        type_vars: [off_t_id],
        bounds: [],
        def_id: none
    })

    // cast: (Ptr<T>) -> Ptr<U> (safe)
    let cast_t_id = env.fresh_var_id()
    let cast_t = Type::TypeVar { id: cast_t_id, name: none }
    let cast_u_id = env.fresh_var_id()
    let cast_u = Type::TypeVar { id: cast_u_id, name: none }
    let cast_ptr_t = Type::PtrType { pointee: cast_t }
    let cast_ptr_u = Type::PtrType { pointee: cast_u }
    methods.insert("cast", TypeScheme {
        ty: Type::FnType {
            params: [cast_ptr_t], return_type: cast_ptr_u,
            meta: fn_meta(EMPTY_ROW, CALLABLE_BORROW_BORROWED)
        },
        type_vars: [cast_t_id, cast_u_id],
        bounds: [],
        def_id: none
    })

    // addr: (Ptr<T>) -> Int (safe)
    let addr_t_id = env.fresh_var_id()
    let addr_t = Type::TypeVar { id: addr_t_id, name: none }
    let addr_ptr = Type::PtrType { pointee: addr_t }
    methods.insert("addr", TypeScheme {
        ty: Type::FnType { params: [addr_ptr], return_type: INT, meta: fn_meta(EMPTY_ROW, CALLABLE_BORROW_OWNED) },
        type_vars: [addr_t_id],
        bounds: [],
        def_id: none
    })
    let _ = install_builtin_method_map(
        env, sink, "Ptr", "<builtin-inherent>:Ptr:core",
        none, methods)
}
