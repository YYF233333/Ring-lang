use types::{Type, Effect, EffectRow, UNIT, EMPTY_ROW, effect_to_string}
use ast::{Program, Decl, Expr, Param, TypeExpr, TypeParam, Span, EffectOpDecl, EffectExpr}
use hir::{HDecl, HParam, HExpr, HProgram, DerivedImpl, TraitBound,
    HStructField, HEnumVariant, HEffectOp, HTraitMethod,
    hexpr_type}
use env::{TypeScheme, apply_subst}
use unify::{empty_subst}
use diagnostics::{DiagnosticContext}
use codes::{E0201, E0204, E0402, E0404, E0501}
use infer_ctx::{InferCtx, InferResult, FnBoundsEntry, CompileError,
    type_error,
    unify_at, update_fn_effects,
    resolve_type_expr, resolve_self_type,
    generalize}
use infer_register::{register_decls_two_phase, resolve_declared_effects, prefix_decl_name}
use infer::{infer_block, infer_expr}
use zonk::{ZonkCtx, zonk_type, zonk_row, zonk_param, zonk_block}
use derive::{run_derive_pass}

// ============================================================
// Pass 2: Check declarations (from infer.ts)
// ============================================================

fn check_decl(var ctx: InferCtx, decl: Decl) -> HDecl {
    match decl {
        Decl::Struct { name, type_params, is_pub, span, .. } =>
            check_struct_decl(ctx, name, type_params, is_pub, span),
        Decl::Enum { name, type_params, is_pub, span, .. } =>
            check_enum_decl(ctx, name, type_params, is_pub, span),
        Decl::Effect { name, type_params, ops, is_pub, span } =>
            check_effect_decl(ctx, name, type_params, ops, is_pub, span),
        Decl::Impl { target_type, type_params, trait_name, methods, span } =>
            check_impl_decl(ctx, target_type, type_params, trait_name, methods, span),
        Decl::Fn { name, type_params, params, return_type, declared_effects, body, is_pub, span, .. } =>
            check_fn_decl(ctx, name, type_params, params, return_type, declared_effects, body, is_pub, span, none),
        Decl::Test { description, body, span } =>
            check_test_decl(ctx, description, body, span),
        Decl::Trait { name, type_params, methods, is_pub, span, .. } =>
            check_trait_decl(ctx, name, type_params, methods, is_pub, span),
        Decl::ExternFn { name, type_params, params, return_type, declared_effects, is_pub, span } =>
            check_extern_fn_decl(ctx, name, type_params, params, declared_effects, is_pub, span),
        Decl::ExternType { name, type_params, is_pub, span } =>
            HDecl::ExternType { name: name, type_params: type_params, is_pub: is_pub, span: span },
        Decl::TypeAlias { name, is_pub, span, .. } => {
            let alias_type = match ctx.env.types.type_aliases.get(name) {
                some(alias) => alias.ty,
                none => UNIT
            }
            HDecl::TypeAlias { name: name, ty: alias_type, is_pub: is_pub, span: span }
        },
        Decl::Const { name, type_annotation, init, is_pub, span } =>
            check_const_decl(ctx, name, type_annotation, init, is_pub, span),
        Decl::ModBlock { name, decls, is_pub, span } =>
            check_mod_decl(ctx, name, decls, is_pub, span)
    }
}

fn check_mod_decl(var ctx: InferCtx, mod_name: Str, decls: List<Decl>, is_pub: Bool, span: Span) -> HDecl {
    // Register short-name aliases for mod-internal types so that
    // type annotations like `c: Circle` resolve to `shapes::Circle`.
    // These aliases remain in scope for the rest of the file, which
    // is acceptable because inline mods share the file scope.
    for decl in decls {
        match decl {
            Decl::Struct { name, .. } => {
                let qualified = "${mod_name}::${name}"
                match ctx.env.types.structs.get(qualified) {
                    some(sdef) => {
                        ctx.env.types.structs.insert(name, sdef)
                    },
                    none => {}
                }
            },
            Decl::Enum { name, .. } => {
                let qualified = "${mod_name}::${name}"
                match ctx.env.types.enums.get(qualified) {
                    some(edef) => {
                        ctx.env.types.enums.insert(name, edef)
                    },
                    none => {}
                }
            },
            _ => {}
        }
    }

    var hdecls: List<HDecl> = []
    for decl in decls {
        let prefixed = prefix_decl_name(mod_name, decl)
        let result = some(check_decl(ctx, prefixed)) catch { _ => none }
        match result {
            some(hd) => hdecls.push(hd),
            none => {}
        }
    }
    HDecl::ModBlock { name: mod_name, decls: hdecls, is_pub: is_pub, span: span }
}

fn check_const_decl(var ctx: InferCtx, name: Str, type_annotation: TypeExpr?, init: Expr, is_pub: Bool, span: Span) -> HDecl {
    let saved_subst = ctx.subst
    ctx.subst = empty_subst()
    // Retrieve the def_id assigned during registration
    let old_def_id = match ctx.env.lookup(name) {
        some(sc) => sc.def_id,
        none => none
    }
    var expected_ty: Type? = none
    match type_annotation {
        some(texpr) => { expected_ty = some(resolve_type_expr(ctx, texpr)) },
        none => {}
    }
    let init_r = infer_expr(ctx, init, ctx.subst)
    var s = init_r.subst
    var init_ty = hexpr_type(init_r.hexpr)
    match expected_ty {
        some(ann_ty) => {
            s = unify_at(ctx.sink, ctx.env, init_ty, ann_ty, s, span)
            init_ty = apply_subst(s, ann_ty)
        },
        none => {}
    }
    let resolved = apply_subst(s, init_ty)
    let gen_scheme = generalize(ctx.env, resolved, s)
    // Preserve the original def_id so mutability checks work
    let scheme = TypeScheme { ty: gen_scheme.ty, type_vars: gen_scheme.type_vars, bounds: gen_scheme.bounds, def_id: old_def_id }
    ctx.env.rebind(name, scheme)
    ctx.subst = saved_subst
    HDecl::Const { name: name, def_id: old_def_id, ty: resolved, init: init_r.hexpr, is_pub: is_pub, span: span }
}

fn check_struct_decl(ctx: InferCtx, name: Str, type_params: List<TypeParam>, is_pub: Bool, span: Span) -> HDecl {
    let def = match ctx.env.types.structs.get(name) {
        some(d) => d,
        none => {
            let _ = type_error(ctx.sink, E0204, "struct not found: ${name}", span,
                DiagnosticContext::OtherContext { detail: some("struct '${name}' was not registered") })
            fail.raise(CompileError {})
        }
    }
    var hfields: List<HStructField> = []
    for f in def.fields {
        hfields.push(HStructField { name: f.name, ty: f.ty, is_pub: f.is_pub })
    }
    HDecl::Struct { name: name, type_params: type_params, fields: hfields, is_pub: is_pub, span: span }
}

fn check_enum_decl(ctx: InferCtx, name: Str, type_params: List<TypeParam>, is_pub: Bool, span: Span) -> HDecl {
    let def = match ctx.env.types.enums.get(name) {
        some(d) => d,
        none => {
            let _ = type_error(ctx.sink, E0204, "enum not found: ${name}", span,
                DiagnosticContext::OtherContext { detail: some("enum '${name}' was not registered") })
            fail.raise(CompileError {})
        }
    }
    var hvariants: List<HEnumVariant> = []
    for v in def.variants {
        hvariants.push(HEnumVariant { name: v.name, fields: v.fields, field_names: v.field_names })
    }
    HDecl::Enum { name: name, type_params: type_params, variants: hvariants, is_pub: is_pub, span: span }
}

fn check_effect_decl(ctx: InferCtx, name: Str, type_params: List<TypeParam>, ast_ops: List<EffectOpDecl>, is_pub: Bool, span: Span) -> HDecl {
    let def = match ctx.env.types.effects.get(name) {
        some(d) => d,
        none => {
            let _ = type_error(ctx.sink, E0402, "effect not found: ${name}", span,
                DiagnosticContext::OtherContext { detail: some("effect '${name}' was not registered") })
            fail.raise(CompileError {})
        }
    }
    var hops: List<HEffectOp> = []
    var oi = 0
    for op in def.ops {
        var op_params: List<HParam> = []
        var pi = 0
        for pt in op.params {
            let p_name = match ast_ops.get(oi) {
                some(ast_op) => match ast_op.params.get(pi) {
                    some(ap) => ap.name,
                    none => "p${pi.to_str()}"
                },
                none => "p${pi.to_str()}"
            }
            op_params.push(HParam { name: p_name, ty: pt, def_id: none, is_mutable: false })
            pi = pi + 1
        }
        hops.push(HEffectOp { name: op.name, params: op_params, return_type: op.return_type })
        oi = oi + 1
    }
    HDecl::Effect { name: name, type_params: type_params, ops: hops, is_pub: is_pub, span: span }
}

fn check_impl_decl(var ctx: InferCtx, target_type: Str, type_params: List<TypeParam>, trait_name: Str?, methods: List<Decl>, span: Span) -> HDecl {
    let impl_self_type = resolve_self_type(ctx, target_type)
    var hmethods: List<HDecl> = []
    for method in methods {
        match method {
            Decl::ExternFn { name, type_params: mtps, params, return_type, declared_effects, is_pub, span: mspan } =>
                hmethods.push(check_extern_fn_decl(ctx, name, mtps, params, declared_effects, is_pub, mspan)),
            Decl::Fn { name, type_params: mtps, params, return_type, declared_effects, body, is_pub, span: mspan, .. } =>
                hmethods.push(check_fn_decl(ctx, name, mtps, params, return_type, declared_effects, body, is_pub, mspan, some(impl_self_type))),
            _ => {}
        }
    }
    HDecl::Impl { target_type: target_type, type_params: type_params, trait_name: trait_name, methods: hmethods, span: span }
}

fn check_trait_decl(var ctx: InferCtx, name: Str, type_params: List<TypeParam>, ast_methods: List<Decl>, is_pub: Bool, span: Span) -> HDecl {
    let trait_def = match ctx.env.trait_reg.traits.get(name) {
        some(d) => d,
        none => {
            let _ = type_error(ctx.sink, E0501, "trait not found: ${name}", span,
                DiagnosticContext::TraitError { detail: "trait '${name}' was not registered" })
            fail.raise(CompileError {})
        }
    }

    var self_var: Type = ctx.env.fresh_var()
    if trait_def.methods.len() > 0 {
        match trait_def.methods.first() {
            some(first_method) => match first_method.ty {
                Type::FnType { params: fps, .. } => {
                    if fps.len() > 0 {
                        match fps.first() { some(fp) => { self_var = fp }, none => {} }
                    }
                },
                _ => {}
            },
            none => {}
        }
    }

    var hmethods: List<HTraitMethod> = []
    for m in trait_def.methods {
        let ast_method = find_ast_fn_by_name(ast_methods, m.name)
        let fn_params: List<Type> = match m.ty {
            Type::FnType { params, .. } => params,
            _ => []
        }
        let fn_ret = match m.ty {
            Type::FnType { return_type, .. } => return_type,
            _ => UNIT
        }
        let ast_params = match ast_method {
            some(am) => match am { Decl::Fn { params, .. } => some(params), _ => none },
            none => none
        }

        var hparams: List<HParam> = []
        var pi = 0
        for param_type in fn_params {
            let p_name = match ast_params {
                some(aps) => match aps.get(pi) { some(ap) => ap.name, none => "p${pi.to_str()}" },
                none => "p${pi.to_str()}"
            }
            let p_mutable = match ast_params {
                some(aps) => match aps.get(pi) { some(ap) => ap.is_mutable, none => false },
                none => false
            }
            hparams.push(HParam { name: p_name, ty: param_type, def_id: none, is_mutable: p_mutable })
            pi = pi + 1
        }

        var method_body: HExpr? = none
        if m.has_default {
            match ast_method {
                some(am) => match am {
                    Decl::Fn { body: abody, .. } => {
                        let has_body = match abody {
                            Expr::Block { stmts, tail, .. } => stmts.len() > 0 || tail.is_some(),
                            _ => true
                        }
                        if has_body {
                            method_body = check_trait_default_body(ctx, name, self_var, hparams, abody)
                        }
                    },
                    _ => {}
                },
                none => {}
            }
        }

        hmethods.push(HTraitMethod { name: m.name, params: hparams, return_type: fn_ret, has_default: m.has_default, body: method_body })
    }

    HDecl::Trait { name: name, type_params: type_params, methods: hmethods, is_pub: is_pub, span: span }
}

fn check_trait_default_body(var ctx: InferCtx, trait_name: Str, self_var: Type, hparams: List<HParam>, body: Expr) -> HExpr? {
    let saved_subst = ctx.subst
    ctx.subst = empty_subst()
    ctx.env.push_scope()
    ctx.fn_bounds_stack.push(ctx.current_fn_bounds)
    ctx.current_fn_bounds = []

    match self_var {
        Type::TypeVar { id, .. } => {
            ctx.current_fn_bounds.push(FnBoundsEntry {
                type_param_var_id: id, trait_name: trait_name, type_param_name: "self"
            })
        },
        _ => {}
    }

    for p in hparams {
        ctx.env.bind_mono(p.name, p.ty)
        if p.is_mutable {
            match ctx.env.lookup(p.name) {
                some(ps) => match ps.def_id {
                    some(did) => { ctx.env.scope.mutable_vars.insert(did) },
                    none => {}
                },
                none => {}
            }
        }
    }

    let body_result = some(infer_block(ctx, body, none)) catch { _ => none }

    ctx.env.pop_scope()
    ctx.current_fn_bounds = match ctx.fn_bounds_stack.pop() { some(prev) => prev, none => [] }

    let final_body = match body_result {
        some(br) => {
            ctx.subst = br.subst
            let zctx = ZonkCtx { subst: ctx.subst, names: map_new() }
            let result = some(zonk_block(zctx, br.hexpr))
            ctx.subst = saved_subst
            result
        },
        none => { ctx.subst = saved_subst; none }
    }
    final_body
}

fn find_ast_fn_by_name(methods: List<Decl>, name: Str) -> Decl? {
    methods.find(fn(d) {
        match d { Decl::Fn { name: n, .. } => n == name, _ => false }
    })
}

fn check_extern_fn_decl(ctx: InferCtx, name: Str, type_params: List<TypeParam>, params: List<Param>, declared_effects: List<EffectExpr>?, is_pub: Bool, span: Span) -> HDecl {
    let scheme = match ctx.env.lookup(name) {
        some(s) => s,
        none => {
            let _ = type_error(ctx.sink, E0201, "extern fn not found: ${name}", span,
                DiagnosticContext::OtherContext { detail: some("extern fn '${name}' was not registered") })
            fail.raise(CompileError {})
        }
    }
    let fn_params: List<Type> = match scheme.ty {
        Type::FnType { params: fps, .. } => fps,
        _ => []
    }
    let fn_ret = match scheme.ty {
        Type::FnType { return_type, .. } => return_type,
        _ => UNIT
    }
    var hparams: List<HParam> = []
    var i = 0
    for p in params {
        let ptype = match fn_params.get(i) { some(t) => t, none => UNIT }
        hparams.push(HParam { name: p.name, ty: ptype, def_id: none, is_mutable: false })
        i = i + 1
    }
    let extern_effects = match declared_effects {
        some(de) => resolve_declared_effects(ctx, de),
        none => EMPTY_ROW
    }
    HDecl::ExternFn {
        name: name, def_id: scheme.def_id, type_params: type_params,
        params: hparams, return_type: fn_ret, effects: extern_effects,
        is_pub: is_pub, span: span
    }
}

struct FnBodyResult {
    params: List<HParam>,
    ret: Type,
    eff: EffectRow,
    body: HExpr
}

fn check_fn_body(var ctx: InferCtx, type_params: List<TypeParam>, hparams: List<HParam>, expected_ret: Type, body: Expr, saved_tp_scope: Map<Str, Type>, span: Span) -> FnBodyResult {
    let body_result = infer_block(ctx, body, some(ctx.subst))
    ctx.subst = body_result.subst
    ctx.subst = unify_at(ctx.sink, ctx.env, hexpr_type(body_result.hexpr), expected_ret, ctx.subst, span)

    let local_names: Map<Int, Str> = map_new()
    for tp in type_params {
        match ctx.type_param_scope.get(tp.name) {
            some(tv) => match tv {
                Type::TypeVar { .. } => {
                    let resolved = apply_subst(ctx.subst, tv)
                    match resolved { Type::TypeVar { id: rid, .. } => { local_names.insert(rid, tp.name) }, _ => {} }
                },
                _ => {}
            },
            none => {}
        }
    }
    let declared_names: Set<Str> = set_new()
    for tp in type_params { declared_names.insert(tp.name) }
    for entry in ctx.type_param_scope.entries() {
        let (tpname, tv) = entry
        if !saved_tp_scope.contains_key(tpname) && !declared_names.contains(tpname) {
            match tv {
                Type::TypeVar { .. } => {
                    let resolved = apply_subst(ctx.subst, tv)
                    match resolved { Type::TypeVar { id: rid, .. } => { local_names.insert(rid, tpname) }, _ => {} }
                },
                _ => {}
            }
        }
    }

    let zctx = ZonkCtx { subst: ctx.subst, names: local_names }
    var final_params: List<HParam> = []
    for hp in hparams { final_params.push(zonk_param(zctx, hp)) }
    let final_ret = zonk_type(zctx, expected_ret)
    let eff = zonk_row(zctx, body_result.effects)
    let final_body = zonk_block(zctx, body_result.hexpr)
    FnBodyResult { params: final_params, ret: final_ret, eff: eff, body: final_body }
}

fn effects_match_kind(a: Effect, b: Effect) -> Bool {
    match a {
        Effect::IoEffect => match b { Effect::IoEffect => true, _ => false },
        Effect::MutEffect { .. } => match b { Effect::MutEffect { .. } => true, _ => false },
        Effect::FailEffect { .. } => match b { Effect::FailEffect { .. } => true, _ => false },
        Effect::CustomEffect { name: na, .. } => match b {
            Effect::CustomEffect { name: nb, .. } => na == nb,
            _ => false
        }
    }
}

fn check_fn_decl(var ctx: InferCtx, name: Str, type_params: List<TypeParam>, params: List<Param>, return_type: TypeExpr?, declared_effects: List<EffectExpr>?, body: Expr, is_pub: Bool, span: Span, self_type: Type?) -> HDecl {
    let saved_subst = ctx.subst
    ctx.subst = empty_subst()
    ctx.env.push_scope()

    let saved_tp_scope = map_clone(ctx.type_param_scope)
    for tp in type_params {
        let tv = ctx.env.fresh_var()
        ctx.type_param_scope.insert(tp.name, tv)
        ctx.env.bind_mono(tp.name, tv)
    }

    ctx.fn_bounds_stack.push(ctx.current_fn_bounds)
    ctx.current_fn_bounds = []
    for tp in type_params {
        match ctx.type_param_scope.get(tp.name) {
            some(tv) => match tv {
                Type::TypeVar { id, .. } => {
                    for bound in tp.bounds {
                        ctx.current_fn_bounds.push(FnBoundsEntry {
                            type_param_var_id: id, trait_name: bound.trait_name, type_param_name: tp.name
                        })
                    }
                },
                _ => {}
            },
            none => {}
        }
    }

    var hparams: List<HParam> = []
    for p in params {
        let ptype = match p.type_annotation {
            some(ta) => resolve_type_expr(ctx, ta),
            none => {
                if p.name == "self" {
                    match self_type { some(st) => st, none => ctx.env.fresh_var() }
                } else {
                    ctx.env.fresh_var()
                }
            }
        }
        ctx.env.bind_mono(p.name, ptype)
        let param_scheme = ctx.env.lookup(p.name)
        match param_scheme {
            some(ps) => {
                match ps.def_id {
                    some(did) => {
                        ctx.env.record_def_span(did, p.span)
                        if p.is_mutable { ctx.env.scope.mutable_vars.insert(did) }
                    },
                    none => {}
                }
                hparams.push(HParam { name: p.name, ty: ptype, def_id: ps.def_id, is_mutable: p.is_mutable })
            },
            none => hparams.push(HParam { name: p.name, ty: ptype, def_id: none, is_mutable: p.is_mutable })
        }
    }

    let saved_fn_return = ctx.current_fn_return_type
    let expected_ret = match return_type {
        some(rt) => resolve_type_expr(ctx, rt),
        none => ctx.env.fresh_var()
    }
    ctx.current_fn_return_type = some(expected_ret)

    let try_result = some(
        check_fn_body(ctx, type_params, hparams, expected_ret, body, saved_tp_scope, span)
    ) catch { _ => none }

    // Cleanup
    ctx.current_fn_return_type = saved_fn_return
    ctx.env.pop_scope()
    ctx.type_param_scope = saved_tp_scope
    ctx.current_fn_bounds = match ctx.fn_bounds_stack.pop() { some(prev) => prev, none => [] }
    ctx.subst = saved_subst

    let fn_result = match try_result {
        some(r) => r,
        none => fail.raise(CompileError {})
    }
    let final_params = fn_result.params
    let final_ret = fn_result.ret
    let inferred_effects = fn_result.eff
    let final_body = fn_result.body

    // Verify: inferred effects <= declared effects
    let final_effects = match declared_effects {
        some(de) => {
            let declared_row = resolve_declared_effects(ctx, de)
            // Check each inferred effect is in declared set
            for inferred_eff in inferred_effects.effects {
                var found = false
                for declared_eff in declared_row.effects {
                    if effects_match_kind(inferred_eff, declared_eff) {
                        found = true
                    }
                }
                if !found {
                    let _ = type_error(ctx.sink, E0404,
                        "Function '${name}' has undeclared effect: ${effect_to_string(inferred_eff)}",
                        span,
                        DiagnosticContext::OtherContext { detail: some("effect annotation violation") })
                }
            }
            // Use declared effects (they are the public contract)
            declared_row
        },
        none => inferred_effects
    }

    var trait_bounds: List<TraitBound> = []
    for tp in type_params {
        for bound in tp.bounds {
            trait_bounds.push(TraitBound { type_param: tp.name, trait_name: bound.trait_name })
        }
    }

    let fn_scheme = ctx.env.lookup(name)
    let fn_def_id = match fn_scheme { some(s) => s.def_id, none => none }
    match fn_def_id {
        some(did) => ctx.env.record_def_span(did, span),
        none => {}
    }

    HDecl::Fn {
        name: name, def_id: fn_def_id, type_params: type_params,
        params: final_params, return_type: final_ret, effects: final_effects,
        body: final_body, is_pub: is_pub, trait_bounds: trait_bounds, span: span
    }
}

fn check_test_decl(var ctx: InferCtx, description: Str, body: Expr, span: Span) -> HDecl {
    let saved_subst = ctx.subst
    ctx.subst = empty_subst()
    ctx.env.push_scope()
    let body_result = some(infer_block(ctx, body, none)) catch { _ => none }
    ctx.env.pop_scope()

    let final_body = match body_result {
        some(br) => {
            ctx.subst = br.subst
            let zctx = ZonkCtx { subst: ctx.subst, names: map_new() }
            let result = zonk_block(zctx, br.hexpr)
            ctx.subst = saved_subst
            result
        },
        none => { ctx.subst = saved_subst; fail.raise(CompileError {}) }
    }

    HDecl::Test { description: description, body: final_body, span: span }
}

// ============================================================
// Public entry point
// ============================================================

fn check_one_decl(var ctx: InferCtx, decl: Decl, var hdecls: List<HDecl>) {
    let hd = check_decl(ctx, decl)
    hdecls.push(hd)
    match hd {
        HDecl::Fn { name, effects, .. } => {
            if effects.effects.len() > 0 {
                update_fn_effects(ctx.env, name, effects)
            }
        },
        _ => {}
    }
}

pub fn check(var ctx: InferCtx, program: Program) -> HProgram {
    register_decls_two_phase(ctx, program.decls)
    let derived_impls = run_derive_pass(ctx.env)

    var hdecls: List<HDecl> = []
    for decl in program.decls {
        let result = some(check_one_decl(ctx, decl, hdecls)) catch { _ => none }
    }

    HProgram { decls: hdecls, derived_impls: derived_impls }
}

pub fn resolve_type_expr_public(var ctx: InferCtx, texpr: TypeExpr) -> Type {
    resolve_type_expr(ctx, texpr)
}

pub fn check_prelude_decl(var ctx: InferCtx, decl: Decl) -> HDecl {
    // Note: check_decl uses fail.raise internally. Due to the known limitation
    // where cross-module effect propagation doesn't work (effects registered as
    // EMPTY_ROW in Pass 1), we must explicitly surface the fail effect here so
    // callers pass the __ring_ev_fail evidence.
    let result = check_decl(ctx, decl)
    if false { fail.raise(CompileError {}) }
    result
}
