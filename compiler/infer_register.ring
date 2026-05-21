use types::{Type, Effect, EffectRow, StructField, EnumVariant,
    EMPTY_ROW}
use ast::{Decl, Span, TypeParam, Param, TypeExpr, EffectOpDecl, StructFieldDecl,
    EnumVariantDecl, NamedEnumField, TypeBound, span_zero, EffectExpr}
use env::{TypeEnv, TypeScheme, SchemeBound, StructDef, EnumDef, EffectDef, EffectOpDef,
    TraitDef, TraitMethodDef, ImplEntry, TypeAliasDef, FnBound, mono, apply_subst}
use diagnostics::{DiagnosticContext}
use codes::{E0207, E0501, E0502}
use infer_ctx::{InferCtx, CompileError, type_error, resolve_type_expr, resolve_self_type}

// ============================================================
// Public entry points
// ============================================================

pub fn register_decl_public(var ctx: InferCtx, decl: Decl) {
    register_decl(ctx, decl)
}

fn register_phase1(var ctx: InferCtx, decl: Decl, var deferred_struct_names: List<Str>, var deferred_enum_names: List<Str>) {
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

fn register_phase2_struct(var ctx: InferCtx, decl: Decl) {
    match decl {
        Decl::Struct { name, type_params, fields, span, .. } =>
            complete_struct_fields(ctx, name, fields),
        _ => {}
    }
}

fn register_phase2_enum(var ctx: InferCtx, decl: Decl) {
    match decl {
        Decl::Enum { name, type_params, variants, span, .. } =>
            complete_enum_variants(ctx, name, type_params, variants),
        _ => {}
    }
}

pub fn register_decls_two_phase(var ctx: InferCtx, decls: List<Decl>) {
    var deferred_struct_names: List<Str> = []
    var deferred_enum_names: List<Str> = []

    for decl in decls {
        let result = some(register_phase1(ctx, decl, deferred_struct_names, deferred_enum_names)) catch { _ => none }
    }

    for decl in decls {
        let result = some(register_phase2_struct(ctx, decl)) catch { _ => none }
    }
    for decl in decls {
        let result = some(register_phase2_enum(ctx, decl)) catch { _ => none }
    }
}

// ============================================================
// Struct registration
// ============================================================

fn preregister_struct(var ctx: InferCtx, name: Str, type_params: List<TypeParam>) {
    var tp_names: List<Str> = []
    var tp_vars: List<Int> = []
    for tp in type_params {
        tp_names.push(tp.name)
        let tv = ctx.env.fresh_var()
        match tv { Type::TypeVar { id, .. } => { tp_vars.push(id) }, _ => {} }
        ctx.type_param_scope.insert(tp.name, tv)
    }
    let def = StructDef { name: name, type_params: tp_names, type_param_vars: tp_vars, fields: [] }
    ctx.env.types.structs.insert(name, def)
}

fn complete_struct_fields(var ctx: InferCtx, name: Str, fields: List<StructFieldDecl>) {
    match ctx.env.types.structs.get(name) {
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
    var tp_names: List<Str> = []
    var tv_ids: List<Int> = []
    for tp in type_params {
        tp_names.push(tp.name)
        let tv = ctx.env.fresh_var()
        match tv { Type::TypeVar { id, .. } => { tv_ids.push(id) }, _ => {} }
        ctx.type_param_scope.insert(tp.name, tv)
    }
    let def = EnumDef { name: name, type_params: tp_names, type_param_vars: tv_ids, variants: [] }
    ctx.env.types.enums.insert(name, def)
}

fn complete_enum_variants(var ctx: InferCtx, name: Str, type_params: List<TypeParam>, variants: List<EnumVariantDecl>) {
    match ctx.env.types.enums.get(name) {
        some(def) => {
            let saved = map_clone(ctx.type_param_scope)
            var tv_types: List<Type> = []
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
                            var field_types: List<Type> = []
                            var field_names: List<Str> = []
                            for f in nf {
                                field_types.push(resolve_type_expr(ctx, f.type_expr))
                                field_names.push(f.name)
                            }
                            def.variants.push(EnumVariant { name: v.name, fields: field_types, field_names: some(field_names) })
                        } else {
                            var field_types: List<Type> = []
                            for f in v.fields { field_types.push(resolve_type_expr(ctx, f)) }
                            def.variants.push(EnumVariant { name: v.name, fields: field_types, field_names: none })
                        }
                    },
                    none => {
                        var field_types: List<Type> = []
                        for f in v.fields { field_types.push(resolve_type_expr(ctx, f)) }
                        def.variants.push(EnumVariant { name: v.name, fields: field_types, field_names: none })
                    }
                }
            }

            let enum_type = Type::EnumType { name: name, type_params: tv_types, variants: def.variants }
            let tv_ids = def.type_param_vars
            for variant in def.variants {
                ctx.env.types.variant_to_enum.insert(variant.name, name)
                if variant.field_names.is_some() {
                    bind_variant_constructor(ctx, variant.name, enum_type, tv_ids)
                } else if variant.fields.len() == 0 {
                    bind_variant_constructor(ctx, variant.name, enum_type, tv_ids)
                } else {
                    let fn_type = Type::FnType { params: variant.fields, return_type: enum_type, effects: EMPTY_ROW }
                    if tv_ids.len() > 0 {
                        ctx.env.bind(variant.name, TypeScheme { ty: fn_type, type_vars: tv_ids, bounds: [], def_id: none })
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
        ctx.env.bind(variant_name, TypeScheme { ty: enum_type, type_vars: tv_ids, bounds: [], def_id: none })
    } else {
        ctx.env.bind_mono(variant_name, enum_type)
    }
}

// ============================================================
// Effect registration
// ============================================================

fn register_effect(ctx: InferCtx, name: Str, type_params: List<TypeParam>, ops: List<EffectOpDecl>) {
    var tp_names: List<Str> = []
    for tp in type_params { tp_names.push(tp.name) }
    var effect_ops: List<EffectOpDef> = []
    for op in ops {
        var param_types: List<Type> = []
        for p in op.params {
            match p.type_annotation {
                some(ta) => param_types.push(resolve_type_expr(ctx, ta)),
                none => param_types.push(ctx.env.fresh_var())
            }
        }
        let ret = resolve_type_expr(ctx, op.return_type)
        effect_ops.push(EffectOpDef { name: op.name, params: param_types, return_type: ret })
    }
    ctx.env.types.effects.insert(name, EffectDef { name: name, type_params: tp_names, ops: effect_ops, built_in_kind: none })
}

// ============================================================
// Trait registration
// ============================================================

fn register_trait(var ctx: InferCtx, name: Str, type_params: List<TypeParam>, methods: List<Decl>) {
    let saved = map_clone(ctx.type_param_scope)
    var tp_names: List<Str> = []
    var tp_vars: List<Int> = []
    for tp in type_params {
        tp_names.push(tp.name)
        let tv = ctx.env.fresh_var()
        match tv { Type::TypeVar { id, .. } => { tp_vars.push(id) }, _ => {} }
        ctx.type_param_scope.insert(tp.name, tv)
    }

    let self_var = ctx.env.fresh_var()
    var trait_methods: List<TraitMethodDef> = []
    for method in methods {
        match method {
            Decl::Fn { name: mname, params, return_type, is_abstract, .. } => {
                var param_types: List<Type> = []
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
                let fn_type = Type::FnType { params: param_types, return_type: ret, effects: EMPTY_ROW }
                trait_methods.push(TraitMethodDef { name: mname, ty: fn_type, has_default: !is_abstract })
            },
            _ => {}
        }
    }

    ctx.type_param_scope = saved
    ctx.env.trait_reg.traits.insert(name, TraitDef { name: name, type_params: tp_names, type_param_vars: tp_vars, methods: trait_methods })
}

// ============================================================
// Impl registration
// ============================================================

fn register_impl(var ctx: InferCtx, target_type: Str, type_params: List<TypeParam>, trait_name: Str?, methods: List<Decl>, span: Span) {
    let impl_methods_map = match ctx.env.trait_reg.impl_methods.get(target_type) {
        some(m) => m,
        none => {
            let new_map: Map<Str, TypeScheme> = map_new()
            ctx.env.trait_reg.impl_methods.insert(target_type, new_map)
            new_map
        }
    }

    let saved = map_clone(ctx.type_param_scope)
    var impl_tv_ids: List<Int> = []
    for tp in type_params {
        let tv = ctx.env.fresh_var()
        match tv { Type::TypeVar { id, .. } => { impl_tv_ids.push(id) }, _ => {} }
        ctx.type_param_scope.insert(tp.name, tv)
    }

    for method in methods {
        match method {
            Decl::Fn { name: mname, type_params: mtps, params, return_type, declared_effects, .. } =>
                register_impl_method(ctx, impl_methods_map, impl_tv_ids, target_type, mname, mtps, params, return_type, declared_effects, saved),
            Decl::ExternFn { name: mname, type_params: mtps, params, return_type, declared_effects, .. } =>
                register_impl_extern_method(ctx, impl_methods_map, impl_tv_ids, target_type, mname, mtps, params, return_type, declared_effects, saved),
            _ => {}
        }
    }

    match trait_name {
        some(tname) => {
            match ctx.env.trait_reg.traits.get(tname) {
                some(trait_def) => {
                    let impl_method_names: Set<Str> = set_new()
                    for m in methods {
                        match m { Decl::Fn { name: mn, .. } => { impl_method_names.insert(mn) }, _ => {} }
                    }
                    for tm in trait_def.methods {
                        if !tm.has_default && !impl_method_names.contains(tm.name) {
                            let _ = type_error(ctx.sink, E0502,
                                "Missing method '${tm.name}' in impl ${tname} for ${target_type}",
                                span, DiagnosticContext::TraitError { detail: "missing method '${tm.name}'" })
                        }
                    }
                    var tp_names: List<Str> = []
                    for tp in type_params { tp_names.push(tp.name) }
                    var method_names: List<Str> = []
                    for m in methods {
                        match m {
                            Decl::Fn { name: mn, .. } => { method_names.push(mn) },
                            Decl::ExternFn { name: mn, .. } => { method_names.push(mn) },
                            _ => {}
                        }
                    }
                    ctx.env.trait_reg.trait_impls.push(ImplEntry {
                        trait_name: tname, target_type_name: target_type,
                        type_params: tp_names, method_names: method_names
                    })
                },
                none => { let _ = type_error(ctx.sink, E0501,
                    "Unknown trait: ${tname}", span,
                    DiagnosticContext::TraitError { detail: "unknown trait '${tname}'" }) }
            }
        },
        none => {}
    }

    ctx.type_param_scope = saved
}

fn register_impl_method(
    var ctx: InferCtx, methods_map: Map<Str, TypeScheme>, impl_tv_ids: List<Int>,
    target_type: Str, mname: Str, mtps: List<TypeParam>, params: List<Param>,
    return_type: TypeExpr?, declared_effects: List<EffectExpr>?, outer_saved: Map<Str, Type>
) {
    let saved_method = map_clone(ctx.type_param_scope)
    var method_tv_ids: List<Int> = []
    for mtp in mtps {
        let tv = ctx.env.fresh_var()
        match tv { Type::TypeVar { id, .. } => { method_tv_ids.push(id) }, _ => {} }
        ctx.type_param_scope.insert(mtp.name, tv)
    }

    let self_type = resolve_self_type(ctx, target_type)
    var param_types: List<Type> = []
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

    let impl_m_effects = match declared_effects {
        some(de) => resolve_declared_effects(ctx, de),
        none => EMPTY_ROW
    }
    let fn_type = Type::FnType { params: param_types, return_type: ret, effects: impl_m_effects }
    methods_map.insert(mname, TypeScheme { ty: fn_type, type_vars: all_tvs, bounds: [], def_id: none })
    ctx.type_param_scope = saved_method
}

fn register_impl_extern_method(
    var ctx: InferCtx, methods_map: Map<Str, TypeScheme>, impl_tv_ids: List<Int>,
    target_type: Str, mname: Str, mtps: List<TypeParam>, params: List<Param>,
    return_type: TypeExpr?, declared_effects: List<EffectExpr>?, outer_saved: Map<Str, Type>
) {
    let saved_method = map_clone(ctx.type_param_scope)
    var method_tv_ids: List<Int> = []
    for mtp in mtps {
        let tv = ctx.env.fresh_var()
        match tv { Type::TypeVar { id, .. } => { method_tv_ids.push(id) }, _ => {} }
        ctx.type_param_scope.insert(mtp.name, tv)
    }
    let self_type = resolve_self_type(ctx, target_type)
    var param_types: List<Type> = []
    for p in params {
        match p.type_annotation {
            some(ta) => param_types.push(resolve_type_expr(ctx, ta)),
            none => if p.name == "self" { param_types.push(self_type) } else { param_types.push(ctx.env.fresh_var()) }
        }
    }
    let ret = match return_type { some(rt) => resolve_type_expr(ctx, rt), none => ctx.env.fresh_var() }
    var all_tvs = list_clone(impl_tv_ids)
    for mtv in method_tv_ids { all_tvs.push(mtv) }
    let impl_ext_effects = match declared_effects {
        some(de) => resolve_declared_effects(ctx, de),
        none => EMPTY_ROW
    }
    let fn_type = Type::FnType { params: param_types, return_type: ret, effects: impl_ext_effects }
    methods_map.insert(mname, TypeScheme { ty: fn_type, type_vars: all_tvs, bounds: [], def_id: none })
    ctx.type_param_scope = saved_method
}

// ============================================================
// Effect annotation resolution
// ============================================================

pub fn resolve_effect_expr(ctx: InferCtx, eff: EffectExpr) -> Effect {
    if eff.name == "io" { return Effect::IoEffect }
    if eff.name == "mut" { return Effect::MutEffect }
    if eff.name == "fail" {
        let err_type = if eff.type_args.len() > 0 {
            match eff.type_args.first() {
                some(t) => resolve_type_expr(ctx, t),
                none => ctx.env.fresh_var()
            }
        } else {
            ctx.env.fresh_var()
        }
        return Effect::FailEffect { error_type: err_type }
    }
    // Custom effects
    var resolved_args: List<Type> = []
    for ta in eff.type_args {
        resolved_args.push(resolve_type_expr(ctx, ta))
    }
    Effect::CustomEffect { name: eff.name, type_args: resolved_args }
}

pub fn resolve_declared_effects(ctx: InferCtx, decl_effects: List<EffectExpr>) -> EffectRow {
    var effects: List<Effect> = []
    for eff in decl_effects {
        effects.push(resolve_effect_expr(ctx, eff))
    }
    EffectRow { effects: effects, tail: none }
}

// ============================================================
// Function registration
// ============================================================

fn check_duplicate_def(ctx: InferCtx, name: Str, span: Span) {
    match ctx.env.lookup(name) {
        some(existing) => match existing.def_id {
            some(did) => match ctx.env.scope.def_spans.get(did) {
                some(_) => { let _ = type_error(ctx.sink, E0207,
                    "Duplicate definition: '${name}' is already defined", span,
                    DiagnosticContext::TypeMismatch { expected: "unique name", actual: name, expression: none }) },
                none => {}
            },
            none => {}
        },
        none => {}
    }
}

fn register_fn(var ctx: InferCtx, name: Str, type_params: List<TypeParam>, params: List<Param>, return_type: TypeExpr?, declared_effects: List<EffectExpr>?, span: Span) {
    check_duplicate_def(ctx, name, span)
    var type_vars: List<Int> = []
    let saved = map_clone(ctx.type_param_scope)
    for tp in type_params {
        let tv = ctx.env.fresh_var()
        match tv { Type::TypeVar { id, .. } => { type_vars.push(id) }, _ => {} }
        ctx.type_param_scope.insert(tp.name, tv)
    }

    var param_types: List<Type> = []
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

    let effects = match declared_effects {
        some(de) => resolve_declared_effects(ctx, de),
        none => EMPTY_ROW
    }
    let fn_type = Type::FnType { params: param_types, return_type: ret, effects: effects }

    var fn_bounds_list: List<FnBound> = []
    var scheme_bounds: List<SchemeBound> = []
    for tp in type_params {
        let tv = ctx.type_param_scope.get(tp.name)
        for b in tp.bounds {
            if !ctx.env.trait_reg.traits.contains_key(b.trait_name) {
                let _ = type_error(ctx.sink, E0501,
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
    if fn_bounds_list.len() > 0 { ctx.env.scope.fn_bounds.insert(name, fn_bounds_list) }

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

fn register_extern_fn(var ctx: InferCtx, name: Str, type_params: List<TypeParam>, params: List<Param>, return_type: TypeExpr?, declared_effects: List<EffectExpr>?, span: Span) {
    var type_vars: List<Int> = []
    let saved = map_clone(ctx.type_param_scope)
    for tp in type_params {
        let tv = ctx.env.fresh_var()
        match tv { Type::TypeVar { id, .. } => { type_vars.push(id) }, _ => {} }
        ctx.type_param_scope.insert(tp.name, tv)
    }

    var param_types: List<Type> = []
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

    let reg_effects = match declared_effects {
        some(de) => resolve_declared_effects(ctx, de),
        none => EMPTY_ROW
    }
    let fn_type = Type::FnType { params: param_types, return_type: ret, effects: reg_effects }

    var scheme_bounds: List<SchemeBound> = []
    for tp in type_params {
        let tv = ctx.type_param_scope.get(tp.name)
        for b in tp.bounds {
            if !ctx.env.trait_reg.traits.contains_key(b.trait_name) {
                let _ = type_error(ctx.sink, E0501,
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
    var tp_names: List<Str> = []
    let saved = map_clone(ctx.type_param_scope)
    var tp_vars: List<Int> = []
    for tp in type_params {
        tp_names.push(tp.name)
        let tv = ctx.env.fresh_var()
        match tv { Type::TypeVar { id, .. } => { tp_vars.push(id) }, _ => {} }
        ctx.type_param_scope.insert(tp.name, tv)
    }
    ctx.type_param_scope = saved
    ctx.env.types.structs.insert(name, StructDef { name: name, type_params: tp_names, type_param_vars: tp_vars, fields: [] })
}

fn register_type_alias(var ctx: InferCtx, name: Str, type_params: List<TypeParam>, type_expr: TypeExpr) {
    let saved = map_clone(ctx.type_param_scope)
    var tp_vars: List<Int> = []
    for tp in type_params {
        let tv = ctx.env.fresh_var()
        match tv { Type::TypeVar { id, .. } => { tp_vars.push(id) }, _ => {} }
        ctx.type_param_scope.insert(tp.name, tv)
    }
    let resolved = resolve_type_expr(ctx, type_expr)
    ctx.type_param_scope = saved
    var tp_names: List<Str> = []
    for tp in type_params { tp_names.push(tp.name) }
    ctx.env.types.type_aliases.insert(name, TypeAliasDef { type_params: tp_names, type_param_vars: tp_vars, ty: resolved })
}

fn register_const(var ctx: InferCtx, name: Str, type_annotation: TypeExpr?, span: Span) {
    check_duplicate_def(ctx, name, span)
    match type_annotation {
        some(texpr) => {
            let ty = resolve_type_expr(ctx, texpr)
            ctx.env.bind_mono(name, ty)
        },
        none => {
            let tv = ctx.env.fresh_var()
            ctx.env.bind_mono(name, tv)
        }
    }
    match ctx.env.lookup(name) {
        some(s) => match s.def_id { some(did) => ctx.env.record_def_span(did, span), none => {} },
        none => {}
    }
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
        Decl::Fn { name, type_params, params, return_type, declared_effects, span, .. } =>
            register_fn(ctx, name, type_params, params, return_type, declared_effects, span),
        Decl::Test { .. } => {},
        Decl::Trait { name, type_params, methods, .. } =>
            register_trait(ctx, name, type_params, methods),
        Decl::ExternFn { name, type_params, params, return_type, declared_effects, span, .. } =>
            register_extern_fn(ctx, name, type_params, params, return_type, declared_effects, span),
        Decl::ExternType { name, type_params, .. } =>
            register_extern_type(ctx, name, type_params),
        Decl::TypeAlias { name, type_params, type_expr, .. } =>
            register_type_alias(ctx, name, type_params, type_expr),
        Decl::Const { name, type_annotation, span, .. } =>
            register_const(ctx, name, type_annotation, span)
    }
}
