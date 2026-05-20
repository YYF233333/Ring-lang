use types::{Type, Effect, EffectRow, StructField, EnumVariant,
    EMPTY_ROW, empty_types, empty_fields}
use ast::{Decl, Span, TypeParam, Param, TypeExpr, EffectOpDecl, StructFieldDecl,
    EnumVariantDecl, NamedEnumField, TypeBound, span_zero}
use env::{TypeEnv, TypeScheme, SchemeBound, StructDef, EnumDef, EffectDef, EffectOpDef,
    TraitDef, TraitMethodDef, ImplEntry, TypeAliasDef, FnBound, mono, apply_subst}
use diagnostics::{DiagnosticContext}
use codes::{E0207, E0501, E0502}
use infer_ctx::{InferCtx, CompileError, type_error, resolve_type_expr, resolve_self_type}

// ============================================================
// Empty list helpers
// ============================================================

fn empty_ints() -> List<Int> { let x = [0]; x.clear(); x }
fn empty_strs() -> List<Str> { let x = [""]; x.clear(); x }
fn empty_struct_fields() -> List<StructField> {
    let dummy = StructField { name: "", ty: Type::UnitType, is_pub: false }
    let x = [dummy]; x.clear(); x
}
fn empty_enum_variants() -> List<EnumVariant> {
    let dummy = EnumVariant { name: "", fields: empty_types(), field_names: none }
    let x = [dummy]; x.clear(); x
}
fn empty_effect_ops() -> List<EffectOpDef> {
    let dummy = EffectOpDef { name: "", params: empty_types(), return_type: Type::UnitType }
    let x = [dummy]; x.clear(); x
}
fn empty_trait_methods() -> List<TraitMethodDef> {
    let dummy = TraitMethodDef { name: "", ty: Type::UnitType, has_default: false }
    let x = [dummy]; x.clear(); x
}
fn empty_scheme_bounds() -> List<SchemeBound> {
    let dummy = SchemeBound { type_var: 0, trait_name: "" }
    let x = [dummy]; x.clear(); x
}
fn empty_fn_bounds() -> List<FnBound> {
    let dummy = FnBound { type_param: "", trait_name: "" }
    let x = [dummy]; x.clear(); x
}

// ============================================================
// Public entry points
// ============================================================

pub fn register_decl_public(var ctx: InferCtx, decl: Decl) {
    register_decl(ctx, decl)
}

pub fn register_decls_two_phase(var ctx: InferCtx, decls: List<Decl>) {
    var deferred_struct_names = empty_strs()
    var deferred_enum_names = empty_strs()

    for decl in decls {
        let result = try {
            match decl {
                Decl::Struct { name, type_params, fields, span, .. } => {
                    preregister_struct(ctx, name, type_params)
                    deferred_struct_names.push(name)
                },
                Decl::Enum { name, type_params, variants, span, .. } => {
                    preregister_enum(ctx, name, type_params)
                    deferred_enum_names.push(name)
                },
                _ => register_decl(ctx, decl)
            }
        }
    }

    for decl in decls {
        let result = try {
            match decl {
                Decl::Struct { name, type_params, fields, span, .. } =>
                    complete_struct_fields(ctx, name, fields),
                _ => {}
            }
        }
    }
    for decl in decls {
        let result = try {
            match decl {
                Decl::Enum { name, type_params, variants, span, .. } =>
                    complete_enum_variants(ctx, name, type_params, variants),
                _ => {}
            }
        }
    }
}

// ============================================================
// Struct registration
// ============================================================

fn preregister_struct(var ctx: InferCtx, name: Str, type_params: List<TypeParam>) {
    var tp_names = empty_strs()
    var tp_vars = empty_ints()
    for tp in type_params {
        tp_names.push(tp.name)
        let tv = ctx.env.fresh_var()
        match tv { Type::TypeVar { id, .. } => { tp_vars.push(id) }, _ => {} }
        ctx.type_param_scope.insert(tp.name, tv)
    }
    let def = StructDef { name: name, type_params: tp_names, type_param_vars: tp_vars, fields: empty_struct_fields() }
    ctx.env.structs.insert(name, def)
}

fn complete_struct_fields(var ctx: InferCtx, name: Str, fields: List<StructFieldDecl>) {
    match ctx.env.structs.get(name) {
        some(def) => {
            let saved = map_clone(ctx.type_param_scope)
            var i = 0
            while i < def.type_params.len() {
                match (def.type_params.get(i), def.type_param_vars.get(i)) {
                    (some(tp_name), some(tp_var)) =>
                        ctx.type_param_scope.insert(tp_name, Type::TypeVar { id: tp_var, name: none }),
                    _ => {}
                }
                i = i + 1
            }
            for f in fields {
                def.fields.push(StructField {
                    name: f.name,
                    ty: resolve_type_expr(ctx, f.type_annotation),
                    is_pub: f.is_pub
                })
            }
            ctx.type_param_scope = saved
        },
        none => {}
    }
}

// ============================================================
// Enum registration
// ============================================================

fn preregister_enum(var ctx: InferCtx, name: Str, type_params: List<TypeParam>) {
    var tp_names = empty_strs()
    var tv_ids = empty_ints()
    for tp in type_params {
        tp_names.push(tp.name)
        let tv = ctx.env.fresh_var()
        match tv { Type::TypeVar { id, .. } => { tv_ids.push(id) }, _ => {} }
        ctx.type_param_scope.insert(tp.name, tv)
    }
    let def = EnumDef { name: name, type_params: tp_names, type_param_vars: tv_ids, variants: empty_enum_variants() }
    ctx.env.enums.insert(name, def)
}

fn complete_enum_variants(var ctx: InferCtx, name: Str, type_params: List<TypeParam>, variants: List<EnumVariantDecl>) {
    match ctx.env.enums.get(name) {
        some(def) => {
            let saved = map_clone(ctx.type_param_scope)
            var tv_types = empty_types()
            var i = 0
            while i < def.type_params.len() {
                match (def.type_params.get(i), def.type_param_vars.get(i)) {
                    (some(tp_name), some(tp_var)) => {
                        let tv = Type::TypeVar { id: tp_var, name: none }
                        ctx.type_param_scope.insert(tp_name, tv)
                        tv_types.push(tv)
                    },
                    _ => {}
                }
                i = i + 1
            }

            for v in variants {
                match v.named_fields {
                    some(nf) => {
                        if nf.len() > 0 {
                            var field_types = empty_types()
                            var field_names = empty_strs()
                            for f in nf {
                                field_types.push(resolve_type_expr(ctx, f.type_expr))
                                field_names.push(f.name)
                            }
                            def.variants.push(EnumVariant { name: v.name, fields: field_types, field_names: some(field_names) })
                        } else {
                            var field_types = empty_types()
                            for f in v.fields { field_types.push(resolve_type_expr(ctx, f)) }
                            def.variants.push(EnumVariant { name: v.name, fields: field_types, field_names: none })
                        }
                    },
                    none => {
                        var field_types = empty_types()
                        for f in v.fields { field_types.push(resolve_type_expr(ctx, f)) }
                        def.variants.push(EnumVariant { name: v.name, fields: field_types, field_names: none })
                    }
                }
            }

            let enum_type = Type::EnumType { name: name, type_params: tv_types, variants: def.variants }
            let tv_ids = def.type_param_vars
            for variant in def.variants {
                ctx.env.variant_to_enum.insert(variant.name, name)
                if variant.field_names.is_some() {
                    bind_variant_constructor(ctx, variant.name, enum_type, tv_ids)
                } else if variant.fields.len() == 0 {
                    bind_variant_constructor(ctx, variant.name, enum_type, tv_ids)
                } else {
                    let fn_type = Type::FnType { params: variant.fields, return_type: enum_type, effects: EMPTY_ROW() }
                    if tv_ids.len() > 0 {
                        ctx.env.bind(variant.name, TypeScheme { ty: fn_type, type_vars: tv_ids, bounds: empty_scheme_bounds(), def_id: none })
                    } else {
                        ctx.env.bind_mono(variant.name, fn_type)
                    }
                }
            }

            ctx.type_param_scope = saved
        },
        none => {}
    }
}

fn bind_variant_constructor(ctx: InferCtx, variant_name: Str, enum_type: Type, tv_ids: List<Int>) {
    if tv_ids.len() > 0 {
        ctx.env.bind(variant_name, TypeScheme { ty: enum_type, type_vars: tv_ids, bounds: empty_scheme_bounds(), def_id: none })
    } else {
        ctx.env.bind_mono(variant_name, enum_type)
    }
}

// ============================================================
// Effect registration
// ============================================================

fn register_effect(ctx: InferCtx, name: Str, type_params: List<TypeParam>, ops: List<EffectOpDecl>) {
    var tp_names = empty_strs()
    for tp in type_params { tp_names.push(tp.name) }
    var effect_ops = empty_effect_ops()
    for op in ops {
        var param_types = empty_types()
        for p in op.params {
            match p.type_annotation {
                some(ta) => param_types.push(resolve_type_expr(ctx, ta)),
                none => param_types.push(ctx.env.fresh_var())
            }
        }
        let ret = resolve_type_expr(ctx, op.return_type)
        effect_ops.push(EffectOpDef { name: op.name, params: param_types, return_type: ret })
    }
    ctx.env.effects.insert(name, EffectDef { name: name, type_params: tp_names, ops: effect_ops, built_in_kind: none })
}

// ============================================================
// Trait registration
// ============================================================

fn register_trait(var ctx: InferCtx, name: Str, type_params: List<TypeParam>, methods: List<Decl>) {
    let saved = map_clone(ctx.type_param_scope)
    var tp_names = empty_strs()
    var tp_vars = empty_ints()
    for tp in type_params {
        tp_names.push(tp.name)
        let tv = ctx.env.fresh_var()
        match tv { Type::TypeVar { id, .. } => { tp_vars.push(id) }, _ => {} }
        ctx.type_param_scope.insert(tp.name, tv)
    }

    let self_var = ctx.env.fresh_var()
    var trait_methods = empty_trait_methods()
    for method in methods {
        match method {
            Decl::Fn { name: mname, params, return_type, is_abstract, .. } => {
                var param_types = empty_types()
                for p in params {
                    if p.name == "self" {
                        param_types.push(self_var)
                    } else {
                        match p.type_annotation {
                            some(ta) => param_types.push(resolve_type_expr(ctx, ta)),
                            none => param_types.push(ctx.env.fresh_var())
                        }
                    }
                }
                let ret = match return_type {
                    some(rt) => resolve_type_expr(ctx, rt),
                    none => ctx.env.fresh_var()
                }
                let fn_type = Type::FnType { params: param_types, return_type: ret, effects: EMPTY_ROW() }
                trait_methods.push(TraitMethodDef { name: mname, ty: fn_type, has_default: !is_abstract })
            },
            _ => {}
        }
    }

    ctx.type_param_scope = saved
    ctx.env.traits.insert(name, TraitDef { name: name, type_params: tp_names, type_param_vars: tp_vars, methods: trait_methods })
}

// ============================================================
// Impl registration
// ============================================================

fn register_impl(var ctx: InferCtx, target_type: Str, type_params: List<TypeParam>, trait_name: Str?, methods: List<Decl>, span: Span) {
    let impl_methods_map = match ctx.env.impl_methods.get(target_type) {
        some(m) => m,
        none => {
            let new_map: Map<Str, TypeScheme> = map_new()
            ctx.env.impl_methods.insert(target_type, new_map)
            new_map
        }
    }

    let saved = map_clone(ctx.type_param_scope)
    var impl_tv_ids = empty_ints()
    for tp in type_params {
        let tv = ctx.env.fresh_var()
        match tv { Type::TypeVar { id, .. } => { impl_tv_ids.push(id) }, _ => {} }
        ctx.type_param_scope.insert(tp.name, tv)
    }

    for method in methods {
        match method {
            Decl::Fn { name: mname, type_params: mtps, params, return_type, .. } =>
                register_impl_method(ctx, impl_methods_map, impl_tv_ids, target_type, mname, mtps, params, return_type, saved),
            Decl::ExternFn { name: mname, type_params: mtps, params, return_type, .. } =>
                register_impl_extern_method(ctx, impl_methods_map, impl_tv_ids, target_type, mname, mtps, params, return_type, saved),
            _ => {}
        }
    }

    match trait_name {
        some(tname) => {
            match ctx.env.traits.get(tname) {
                some(trait_def) => {
                    let impl_method_names: Set<Str> = set_new()
                    for m in methods {
                        match m { Decl::Fn { name: mn, .. } => { impl_method_names.insert(mn) }, _ => {} }
                    }
                    for tm in trait_def.methods {
                        if !tm.has_default && !impl_method_names.contains(tm.name) {
                            type_error(ctx.sink, E0502(),
                                "Missing method '${tm.name}' in impl ${tname} for ${target_type}",
                                span, DiagnosticContext::TraitError { detail: "missing method '${tm.name}'" })
                        }
                    }
                    var tp_names = empty_strs()
                    for tp in type_params { tp_names.push(tp.name) }
                    var method_names = empty_strs()
                    for m in methods {
                        match m {
                            Decl::Fn { name: mn, .. } => { method_names.push(mn) },
                            Decl::ExternFn { name: mn, .. } => { method_names.push(mn) },
                            _ => {}
                        }
                    }
                    ctx.env.trait_impls.push(ImplEntry {
                        trait_name: tname, target_type_name: target_type,
                        type_params: tp_names, method_names: method_names
                    })
                },
                none => type_error(ctx.sink, E0501(),
                    "Unknown trait: ${tname}", span,
                    DiagnosticContext::TraitError { detail: "unknown trait '${tname}'" })
            }
        },
        none => {}
    }

    ctx.type_param_scope = saved
}

fn register_impl_method(
    var ctx: InferCtx, methods_map: Map<Str, TypeScheme>, impl_tv_ids: List<Int>,
    target_type: Str, mname: Str, mtps: List<TypeParam>, params: List<Param>,
    return_type: TypeExpr?, outer_saved: Map<Str, Type>
) {
    let saved_method = map_clone(ctx.type_param_scope)
    var method_tv_ids = empty_ints()
    for mtp in mtps {
        let tv = ctx.env.fresh_var()
        match tv { Type::TypeVar { id, .. } => { method_tv_ids.push(id) }, _ => {} }
        ctx.type_param_scope.insert(mtp.name, tv)
    }

    let self_type = resolve_self_type(ctx, target_type)
    var param_types = empty_types()
    for p in params {
        match p.type_annotation {
            some(ta) => param_types.push(resolve_type_expr(ctx, ta)),
            none => if p.name == "self" { param_types.push(self_type) } else { param_types.push(ctx.env.fresh_var()) }
        }
    }
    let ret = match return_type { some(rt) => resolve_type_expr(ctx, rt), none => ctx.env.fresh_var() }

    var all_tvs = list_clone(impl_tv_ids)
    for mtv in method_tv_ids { all_tvs.push(mtv) }

    let declared_names: Set<Str> = set_new()
    for entry in ctx.type_param_scope.entries() {
        let (tpname, _) = entry
        if outer_saved.contains_key(tpname) { declared_names.insert(tpname) }
    }
    for entry in ctx.type_param_scope.entries() {
        let (tpname, tv) = entry
        if !outer_saved.contains_key(tpname) && !declared_names.contains(tpname) {
            match tv { Type::TypeVar { id, .. } => {
                if !all_tvs.contains(id) { all_tvs.push(id) }
            }, _ => {} }
        }
    }

    let fn_type = Type::FnType { params: param_types, return_type: ret, effects: EMPTY_ROW() }
    methods_map.insert(mname, TypeScheme { ty: fn_type, type_vars: all_tvs, bounds: empty_scheme_bounds(), def_id: none })
    ctx.type_param_scope = saved_method
}

fn register_impl_extern_method(
    var ctx: InferCtx, methods_map: Map<Str, TypeScheme>, impl_tv_ids: List<Int>,
    target_type: Str, mname: Str, mtps: List<TypeParam>, params: List<Param>,
    return_type: TypeExpr?, outer_saved: Map<Str, Type>
) {
    let saved_method = map_clone(ctx.type_param_scope)
    var method_tv_ids = empty_ints()
    for mtp in mtps {
        let tv = ctx.env.fresh_var()
        match tv { Type::TypeVar { id, .. } => { method_tv_ids.push(id) }, _ => {} }
        ctx.type_param_scope.insert(mtp.name, tv)
    }
    let self_type = resolve_self_type(ctx, target_type)
    var param_types = empty_types()
    for p in params {
        match p.type_annotation {
            some(ta) => param_types.push(resolve_type_expr(ctx, ta)),
            none => if p.name == "self" { param_types.push(self_type) } else { param_types.push(ctx.env.fresh_var()) }
        }
    }
    let ret = match return_type { some(rt) => resolve_type_expr(ctx, rt), none => ctx.env.fresh_var() }
    var all_tvs = list_clone(impl_tv_ids)
    for mtv in method_tv_ids { all_tvs.push(mtv) }
    let fn_type = Type::FnType { params: param_types, return_type: ret, effects: EMPTY_ROW() }
    methods_map.insert(mname, TypeScheme { ty: fn_type, type_vars: all_tvs, bounds: empty_scheme_bounds(), def_id: none })
    ctx.type_param_scope = saved_method
}

// ============================================================
// Function registration
// ============================================================

fn check_duplicate_def(ctx: InferCtx, name: Str, span: Span) {
    match ctx.env.lookup(name) {
        some(existing) => match existing.def_id {
            some(did) => match ctx.env.def_spans.get(did) {
                some(_) => type_error(ctx.sink, E0207(),
                    "Duplicate definition: '${name}' is already defined", span,
                    DiagnosticContext::TypeMismatch { expected: "unique name", actual: name, expression: none }),
                none => {}
            },
            none => {}
        },
        none => {}
    }
}

fn register_fn(var ctx: InferCtx, name: Str, type_params: List<TypeParam>, params: List<Param>, return_type: TypeExpr?, span: Span) {
    check_duplicate_def(ctx, name, span)
    var type_vars = empty_ints()
    let saved = map_clone(ctx.type_param_scope)
    for tp in type_params {
        let tv = ctx.env.fresh_var()
        match tv { Type::TypeVar { id, .. } => { type_vars.push(id) }, _ => {} }
        ctx.type_param_scope.insert(tp.name, tv)
    }

    var param_types = empty_types()
    for p in params {
        match p.type_annotation {
            some(ta) => param_types.push(resolve_type_expr(ctx, ta)),
            none => param_types.push(ctx.env.fresh_var())
        }
    }
    let ret = match return_type { some(rt) => resolve_type_expr(ctx, rt), none => ctx.env.fresh_var() }

    let declared_names: Set<Str> = set_new()
    for tp in type_params { declared_names.insert(tp.name) }
    for entry in ctx.type_param_scope.entries() {
        let (tpname, tv) = entry
        if !saved.contains_key(tpname) && !declared_names.contains(tpname) {
            match tv { Type::TypeVar { id, .. } => { type_vars.push(id) }, _ => {} }
        }
    }

    let fn_type = Type::FnType { params: param_types, return_type: ret, effects: EMPTY_ROW() }

    var fn_bounds_list = empty_fn_bounds()
    var scheme_bounds = empty_scheme_bounds()
    for tp in type_params {
        let tv = ctx.type_param_scope.get(tp.name)
        for b in tp.bounds {
            if !ctx.env.traits.contains_key(b.trait_name) {
                type_error(ctx.sink, E0501(),
                    "Unknown trait: ${b.trait_name}", tp.span,
                    DiagnosticContext::TraitError { detail: "unknown trait '${b.trait_name}'" })
            }
            fn_bounds_list.push(FnBound { type_param: tp.name, trait_name: b.trait_name })
            match tv {
                some(t) => match t { Type::TypeVar { id, .. } => {
                    scheme_bounds.push(SchemeBound { type_var: id, trait_name: b.trait_name })
                }, _ => {} },
                none => {}
            }
        }
    }
    if fn_bounds_list.len() > 0 { ctx.env.fn_bounds.insert(name, fn_bounds_list) }

    ctx.type_param_scope = saved

    if type_vars.len() > 0 {
        ctx.env.bind(name, TypeScheme { ty: fn_type, type_vars: type_vars, bounds: scheme_bounds, def_id: none })
    } else {
        ctx.env.bind_mono(name, fn_type)
    }
    match ctx.env.lookup(name) {
        some(s) => match s.def_id { some(did) => ctx.env.record_def_span(did, span), none => {} },
        none => {}
    }
}

fn register_extern_fn(var ctx: InferCtx, name: Str, type_params: List<TypeParam>, params: List<Param>, return_type: TypeExpr?, span: Span) {
    var type_vars = empty_ints()
    let saved = map_clone(ctx.type_param_scope)
    for tp in type_params {
        let tv = ctx.env.fresh_var()
        match tv { Type::TypeVar { id, .. } => { type_vars.push(id) }, _ => {} }
        ctx.type_param_scope.insert(tp.name, tv)
    }

    var param_types = empty_types()
    for p in params {
        match p.type_annotation {
            some(ta) => param_types.push(resolve_type_expr(ctx, ta)),
            none => param_types.push(ctx.env.fresh_var())
        }
    }
    let ret = match return_type { some(rt) => resolve_type_expr(ctx, rt), none => ctx.env.fresh_var() }

    let declared_names: Set<Str> = set_new()
    for tp in type_params { declared_names.insert(tp.name) }
    for entry in ctx.type_param_scope.entries() {
        let (tpname, tv) = entry
        if !saved.contains_key(tpname) && !declared_names.contains(tpname) {
            match tv { Type::TypeVar { id, .. } => { type_vars.push(id) }, _ => {} }
        }
    }

    let fn_type = Type::FnType { params: param_types, return_type: ret, effects: EMPTY_ROW() }

    var scheme_bounds = empty_scheme_bounds()
    for tp in type_params {
        let tv = ctx.type_param_scope.get(tp.name)
        for b in tp.bounds {
            if !ctx.env.traits.contains_key(b.trait_name) {
                type_error(ctx.sink, E0501(),
                    "Unknown trait: ${b.trait_name}", tp.span,
                    DiagnosticContext::TraitError { detail: "unknown trait '${b.trait_name}'" })
            }
            match tv {
                some(t) => match t { Type::TypeVar { id, .. } => {
                    scheme_bounds.push(SchemeBound { type_var: id, trait_name: b.trait_name })
                }, _ => {} },
                none => {}
            }
        }
    }

    ctx.type_param_scope = saved

    if type_vars.len() > 0 {
        ctx.env.bind(name, TypeScheme { ty: fn_type, type_vars: type_vars, bounds: scheme_bounds, def_id: none })
    } else {
        ctx.env.bind_mono(name, fn_type)
    }
    match ctx.env.lookup(name) {
        some(s) => match s.def_id { some(did) => ctx.env.record_def_span(did, span), none => {} },
        none => {}
    }
}

fn register_extern_type(var ctx: InferCtx, name: Str, type_params: List<TypeParam>) {
    var tp_names = empty_strs()
    let saved = map_clone(ctx.type_param_scope)
    var tp_vars = empty_ints()
    for tp in type_params {
        tp_names.push(tp.name)
        let tv = ctx.env.fresh_var()
        match tv { Type::TypeVar { id, .. } => { tp_vars.push(id) }, _ => {} }
        ctx.type_param_scope.insert(tp.name, tv)
    }
    ctx.type_param_scope = saved
    ctx.env.structs.insert(name, StructDef { name: name, type_params: tp_names, type_param_vars: tp_vars, fields: empty_struct_fields() })
}

fn register_type_alias(var ctx: InferCtx, name: Str, type_params: List<TypeParam>, type_expr: TypeExpr) {
    let saved = map_clone(ctx.type_param_scope)
    var tp_vars = empty_ints()
    for tp in type_params {
        let tv = ctx.env.fresh_var()
        match tv { Type::TypeVar { id, .. } => { tp_vars.push(id) }, _ => {} }
        ctx.type_param_scope.insert(tp.name, tv)
    }
    let resolved = resolve_type_expr(ctx, type_expr)
    ctx.type_param_scope = saved
    var tp_names = empty_strs()
    for tp in type_params { tp_names.push(tp.name) }
    ctx.env.type_aliases.insert(name, TypeAliasDef { type_params: tp_names, type_param_vars: tp_vars, ty: resolved })
}

// ============================================================
// Dispatch: register individual declaration
// ============================================================

fn register_decl(var ctx: InferCtx, decl: Decl) {
    match decl {
        Decl::Struct { name, type_params, fields, span, .. } => {
            preregister_struct(ctx, name, type_params)
            complete_struct_fields(ctx, name, fields)
        },
        Decl::Enum { name, type_params, variants, span, .. } => {
            preregister_enum(ctx, name, type_params)
            complete_enum_variants(ctx, name, type_params, variants)
        },
        Decl::Effect { name, type_params, ops, .. } =>
            register_effect(ctx, name, type_params, ops),
        Decl::Impl { target_type, type_params, trait_name, methods, span } =>
            register_impl(ctx, target_type, type_params, trait_name, methods, span),
        Decl::Fn { name, type_params, params, return_type, span, .. } =>
            register_fn(ctx, name, type_params, params, return_type, span),
        Decl::Test { .. } => {},
        Decl::Trait { name, type_params, methods, .. } =>
            register_trait(ctx, name, type_params, methods),
        Decl::ExternFn { name, type_params, params, return_type, span, .. } =>
            register_extern_fn(ctx, name, type_params, params, return_type, span),
        Decl::ExternType { name, type_params, .. } =>
            register_extern_type(ctx, name, type_params),
        Decl::TypeAlias { name, type_params, type_expr, .. } =>
            register_type_alias(ctx, name, type_params, type_expr)
    }
}
