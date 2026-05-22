use types::{Type, Effect, EffectRow, UNIT, EMPTY_ROW, effect_to_string, effects_match_kind, effect_kind_name}
use ast::{Program, Decl, Expr, Param, TypeExpr, TypeParam, Span, EffectOpDecl, EffectExpr,
    UseDecl, UseImport, NamedImport, SigMember}
use hir::{HDecl, HParam, HExpr, HProgram, DerivedImpl, TraitBound,
    HStructField, HEnumVariant, HEffectOp, HTraitMethod, HSigMember,
    hexpr_type}
use env::{TypeScheme, apply_subst}
use unify::{empty_subst}
use diagnostics::{DiagnosticContext}
use codes::{E0201, E0204, E0402, E0403, E0404, E0405, E0501, E0705}
use infer_ctx::{InferCtx, InferResult, FnBoundsEntry, CompileError,
    type_error,
    unify_at, update_fn_effects,
    resolve_type_expr, resolve_self_type,
    generalize, resolve_relative_qualifier}
use infer_register::{register_decls_two_phase, resolve_declared_effects, prefix_decl_name, insert_mod_aliases}
use infer::{infer_block, infer_expr}
use zonk::{ZonkCtx, zonk_type, zonk_row, zonk_param, zonk_block}
use derive::{run_derive_pass}

// ============================================================
// Pass 2: Check declarations (from infer.ts)
// ============================================================

fn check_decl(mut ctx: InferCtx, decl: Decl) -> HDecl {
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
        Decl::ModBlock { name, uses, decls, required_effects, is_pub, span } =>
            check_mod_decl(ctx, name, uses, decls, required_effects, is_pub, span),
        Decl::Sig { name, members, is_pub, span } =>
            check_sig_decl(ctx, name, members, is_pub, span)
    }
}

fn check_mod_decl(mut ctx: InferCtx, mod_name: Str, uses: List<UseDecl>, decls: List<Decl>, required_effects: List<EffectExpr>?, is_pub: Bool, span: Span) -> HDecl {
    // Push only the last segment onto mod_path_stack for self::/super:: resolution.
    // mod_name may be fully qualified (e.g. "a::b") when nested mods are prefixed.
    let segments = mod_name.split("::")
    let simple_name = segments.get(segments.len() - 1).unwrap_or(mod_name)
    ctx.mod_path_stack.push(simple_name)

    // Register short-name aliases for mod-internal types so that
    // type annotations like `c: Circle` resolve to `shapes::Circle`.
    // These aliases remain in scope for the rest of the file, which
    // is acceptable because inline mods share the file scope.
    insert_mod_aliases(ctx, mod_name, decls, false)

    // Resolve use declarations with relative paths (self::/super::)
    resolve_mod_uses(ctx, uses)

    // Resolve required effects if present
    let mut cap_row: EffectRow? = none
    match required_effects {
        some(req_effs) => {
            cap_row = some(resolve_declared_effects(ctx, req_effs))
        },
        none => {}
    }

    let mut hdecls: List<HDecl> = []
    for decl in decls {
        let prefixed = prefix_decl_name(mod_name, decl)
        let result = some(check_decl(ctx, prefixed)) catch { _ => none }
        match result {
            some(hd) => {
                // Check capability restriction on function declarations
                match cap_row {
                    some(cap) => check_capability(ctx, hd, cap, span),
                    none => {}
                }
                hdecls.push(hd)
            },
            none => {}
        }
    }
    ctx.mod_path_stack.pop()
    HDecl::ModBlock { name: mod_name, decls: hdecls, is_pub: is_pub, span: span }
}

fn check_capability(mut ctx: InferCtx, decl: HDecl, cap: EffectRow, mod_span: Span) {
    match decl {
        HDecl::Fn { name, effects, span, .. } => {
            for eff in effects.effects {
                let kind = effect_kind_name(eff)
                let in_cap = cap.effects.any(fn(c) { effects_match_kind(eff, c) })
                if !in_cap {
                    let _ = type_error(ctx.sink, E0405,
                        "Function '${name}' uses effect '${kind}' which is not in the module's requires set",
                        span,
                        DiagnosticContext::OtherContext { detail: some("capability violation") })
                }
            }
        },
        _ => {}
    }
}

fn check_sig_decl(mut ctx: InferCtx, name: Str, members: List<SigMember>, is_pub: Bool, span: Span) -> HDecl {
    let mut hmembers: List<HSigMember> = []
    match ctx.env.types.sigs.get(name) {
        some(sig_def) => {
            for m in members {
                match sig_def.members.get(m.name) {
                    some(scheme) => {
                        hmembers.push(HSigMember { name: m.name, fn_type: scheme.ty, span: m.span })
                    },
                    none => {
                        hmembers.push(HSigMember { name: m.name, fn_type: UNIT, span: m.span })
                    }
                }
            }
        },
        none => {}
    }
    HDecl::Sig { name: name, members: hmembers, is_pub: is_pub, span: span }
}

fn resolve_mod_uses(mut ctx: InferCtx, uses: List<UseDecl>) {
    for use_decl in uses {
        let segments = use_decl.path.segments
        if segments.len() == 0 { continue }
        let first = segments.get(0).unwrap_or("")

        // Check if path starts with relative prefix
        if first != "self" && first != "super" { continue }

        // Build qualifier from relative segments
        let mut qualifier = first
        let mut name_start_idx = 1
        let mut i = 1
        while i < segments.len() {
            let seg = segments.get(i).unwrap_or("")
            if seg == "super" {
                qualifier = "${qualifier}::${seg}"
                name_start_idx = i + 1
            } else {
                break
            }
            i = i + 1
        }

        // Resolve the relative qualifier against mod_path_stack
        let resolved = resolve_relative_qualifier(qualifier, ctx.mod_path_stack)
        match resolved {
            none => {
                let _ = type_error(ctx.sink, E0705,
                    "Cannot use '${qualifier}' — relative path exceeds module nesting depth",
                    use_decl.path.span,
                    DiagnosticContext::OtherContext { detail: some("relative path out of scope") })
                continue
            },
            some(prefix) => {
                // Rebuild the actual path: prefix + remaining segments
                match use_decl.imports {
                    UseImport::NamedItems { names } => {
                        for item in names {
                            let local_name = match item.alias {
                                some(a) => a,
                                none => item.name
                            }
                            let qualified_name = if prefix == "" { item.name } else { "${prefix}::${item.name}" }
                            match ctx.env.lookup(qualified_name) {
                                some(scheme) => {
                                    ctx.env.bind(local_name, scheme)
                                    // Track alias so codegen emits the qualified name
                                    if local_name != qualified_name {
                                        ctx.use_aliases.insert(local_name, qualified_name)
                                    }
                                },
                                none => {
                                    let _ = type_error(ctx.sink, E0201,
                                        "Undefined variable: ${qualified_name}",
                                        item.span,
                                        DiagnosticContext::UndefinedVariable { name: qualified_name, scope_locals: none })
                                }
                            }
                        }
                    },
                    UseImport::Module => {
                        // use super::name — single name import (last segment is the name)
                        if name_start_idx < segments.len() {
                            let name = segments.get(segments.len() - 1).unwrap_or("")
                            let qualified_name = if prefix == "" { name } else { "${prefix}::${name}" }
                            match ctx.env.lookup(qualified_name) {
                                some(scheme) => {
                                    ctx.env.bind(name, scheme)
                                    // Track alias so codegen emits the qualified name
                                    if name != qualified_name {
                                        ctx.use_aliases.insert(name, qualified_name)
                                    }
                                },
                                none => {
                                    let _ = type_error(ctx.sink, E0201,
                                        "Undefined variable: ${qualified_name}",
                                        use_decl.path.span,
                                        DiagnosticContext::UndefinedVariable { name: qualified_name, scope_locals: none })
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

fn check_const_decl(mut ctx: InferCtx, name: Str, type_annotation: TypeExpr?, init: Expr, is_pub: Bool, span: Span) -> HDecl {
    let saved_subst = ctx.subst
    ctx.subst = empty_subst()
    // Retrieve the def_id assigned during registration
    let old_def_id = match ctx.env.lookup(name) {
        some(sc) => sc.def_id,
        none => none
    }
    let mut expected_ty: Type? = none
    match type_annotation {
        some(texpr) => { expected_ty = some(resolve_type_expr(ctx, texpr)) },
        none => {}
    }
    let init_r = infer_expr(ctx, init, ctx.subst)
    let mut s = init_r.subst
    let mut init_ty = hexpr_type(init_r.hexpr)
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
    let mut hfields: List<HStructField> = []
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
    let mut hvariants: List<HEnumVariant> = []
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
    let mut hops: List<HEffectOp> = []
    let mut oi = 0
    for op in def.ops {
        let mut op_params: List<HParam> = []
        let mut pi = 0
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

fn update_impl_method_effects(ctx: InferCtx, target_type: Str, method_name: Str, effects: EffectRow) {
    match ctx.env.trait_reg.impl_methods.get(target_type) {
        some(methods_map) => {
            match methods_map.get(method_name) {
                some(scheme) => {
                    match scheme.ty {
                        Type::FnType { params, return_type, .. } => {
                            let updated_ty = Type::FnType { params: params, return_type: return_type, effects: effects }
                            methods_map.insert(method_name, TypeScheme {
                                ty: updated_ty,
                                type_vars: scheme.type_vars,
                                bounds: scheme.bounds,
                                def_id: scheme.def_id
                            })
                        },
                        _ => {}
                    }
                },
                none => {}
            }
        },
        none => {}
    }
}

fn check_impl_decl(mut ctx: InferCtx, target_type: Str, type_params: List<TypeParam>, trait_name: Str?, methods: List<Decl>, span: Span) -> HDecl {
    let saved_tp_scope = map_clone(ctx.type_param_scope)
    for tp in type_params {
        let tv = ctx.env.fresh_var()
        ctx.type_param_scope.insert(tp.name, tv)
    }

    let impl_self_type = if type_params.len() > 0 {
        let mut impl_tp_types: List<Type> = []
        for tp in type_params {
            match ctx.type_param_scope.get(tp.name) {
                some(tv) => impl_tp_types.push(tv),
                none => impl_tp_types.push(ctx.env.fresh_var())
            }
        }
        match ctx.env.types.structs.get(target_type) {
            some(def) => Type::StructType { name: def.name, type_params: impl_tp_types, fields: def.fields },
            none => match ctx.env.types.enums.get(target_type) {
                some(def) => Type::EnumType { name: def.name, type_params: impl_tp_types, variants: def.variants },
                none => resolve_self_type(ctx, target_type)
            }
        }
    } else {
        resolve_self_type(ctx, target_type)
    }

    let saved_impl_bounds = ctx.current_fn_bounds
    let mut impl_bounds: List<FnBoundsEntry> = []
    for tp in type_params {
        match ctx.type_param_scope.get(tp.name) {
            some(tv) => match tv {
                Type::TypeVar { id, .. } => {
                    for bound in tp.bounds {
                        impl_bounds.push(FnBoundsEntry {
                            type_param_var_id: id, trait_name: bound.trait_name, type_param_name: tp.name
                        })
                    }
                },
                _ => {}
            },
            none => {}
        }
    }
    ctx.current_fn_bounds = impl_bounds

    let mut hmethods: List<HDecl> = []
    for method in methods {
        match method {
            Decl::ExternFn { name, type_params: mtps, params, return_type, declared_effects, is_pub, span: mspan } =>
                hmethods.push(check_extern_fn_decl(ctx, name, mtps, params, declared_effects, is_pub, mspan)),
            Decl::Fn { name, type_params: mtps, params, return_type, declared_effects, body, is_pub, span: mspan, .. } => {
                let hdecl = check_fn_decl(ctx, name, mtps, params, return_type, declared_effects, body, is_pub, mspan, some(impl_self_type))
                hmethods.push(hdecl)
                match hdecl {
                    HDecl::Fn { name: mname, effects: inferred_effects, .. } => {
                        if inferred_effects.effects.len() > 0 {
                            update_impl_method_effects(ctx, target_type, mname, inferred_effects)
                        }
                    },
                    _ => {}
                }
            },
            _ => {}
        }
    }

    ctx.current_fn_bounds = saved_impl_bounds
    ctx.type_param_scope = saved_tp_scope
    HDecl::Impl { target_type: target_type, type_params: type_params, trait_name: trait_name, methods: hmethods, span: span }
}

fn check_trait_decl(mut ctx: InferCtx, name: Str, type_params: List<TypeParam>, ast_methods: List<Decl>, is_pub: Bool, span: Span) -> HDecl {
    let trait_def = match ctx.env.trait_reg.traits.get(name) {
        some(d) => d,
        none => {
            let _ = type_error(ctx.sink, E0501, "trait not found: ${name}", span,
                DiagnosticContext::TraitError { detail: "trait '${name}' was not registered" })
            fail.raise(CompileError {})
        }
    }

    let mut self_var: Type = ctx.env.fresh_var()
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

    let mut hmethods: List<HTraitMethod> = []
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

        let mut hparams: List<HParam> = []
        let mut pi = 0
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

        let mut method_body: HExpr? = none
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

fn check_trait_default_body(mut ctx: InferCtx, trait_name: Str, self_var: Type, hparams: List<HParam>, body: Expr) -> HExpr? {
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
    let mut hparams: List<HParam> = []
    let mut i = 0
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

fn check_fn_body(mut ctx: InferCtx, type_params: List<TypeParam>, hparams: List<HParam>, expected_ret: Type, body: Expr, saved_tp_scope: Map<Str, Type>, span: Span) -> FnBodyResult {
    let body_result = infer_block(ctx, body, some(ctx.subst))
    ctx.subst = body_result.subst
    ctx.subst = unify_at(ctx.sink, ctx.env, hexpr_type(body_result.hexpr), expected_ret, ctx.subst, span)

    let mut local_names: Map<Int, Str> = map_new()
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
    let mut declared_names: Set<Str> = set_new()
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
    let mut final_params: List<HParam> = []
    for hp in hparams { final_params.push(zonk_param(zctx, hp)) }
    let final_ret = zonk_type(zctx, expected_ret)
    let eff = zonk_row(zctx, body_result.effects)
    let final_body = zonk_block(zctx, body_result.hexpr)
    FnBodyResult { params: final_params, ret: final_ret, eff: eff, body: final_body }
}

fn check_fn_decl(mut ctx: InferCtx, name: Str, type_params: List<TypeParam>, params: List<Param>, return_type: TypeExpr?, declared_effects: List<EffectExpr>?, body: Expr, is_pub: Bool, span: Span, self_type: Type?) -> HDecl {
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
    let mut inherited_bounds: List<FnBoundsEntry> = []
    for ib in ctx.current_fn_bounds { inherited_bounds.push(ib) }
    ctx.current_fn_bounds = inherited_bounds
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

    let mut hparams: List<HParam> = []
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
                        if p.is_mutable {
                            ctx.env.scope.mutable_vars.insert(did)
                        } else {
                            ctx.env.scope.let_defs.insert(did)
                        }
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

    // Save complete bounds (inherited + own) before pop
    let complete_fn_bounds = ctx.current_fn_bounds

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
                let mut found = false
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

    // Check: main function must not have unhandled custom effects.
    // io/fail/mut are allowed (io is implicit, fail has default handler, mut is Cell-based),
    // but CustomEffect requires an explicit handler and cannot propagate past main.
    if name == "main" {
        for eff in final_effects.effects {
            match eff {
                Effect::CustomEffect { name: eff_name, .. } => {
                    let _ = type_error(ctx.sink, E0403,
                        "Unhandled effect '${eff_name}' in main function; custom effects must be handled before reaching main",
                        span,
                        DiagnosticContext::EffectUnhandled { eff: eff_name, in_function: some("main") })
                },
                _ => {}
            }
        }
    }

    let mut trait_bounds: List<TraitBound> = []
    for fb in complete_fn_bounds {
        trait_bounds.push(TraitBound { type_param: fb.type_param_name, trait_name: fb.trait_name })
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

fn check_test_decl(mut ctx: InferCtx, description: Str, body: Expr, span: Span) -> HDecl {
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

fn check_one_decl(mut ctx: InferCtx, decl: Decl, mut hdecls: List<HDecl>) {
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

pub fn check(mut ctx: InferCtx, program: Program) -> HProgram {
    register_decls_two_phase(ctx, program.decls)
    let derived_impls = run_derive_pass(ctx.env)

    let mut hdecls: List<HDecl> = []
    for decl in program.decls {
        let result = some(check_one_decl(ctx, decl, hdecls)) catch { _ => none }
    }

    HProgram { decls: hdecls, derived_impls: derived_impls }
}

pub fn resolve_type_expr_public(mut ctx: InferCtx, texpr: TypeExpr) -> Type {
    resolve_type_expr(ctx, texpr)
}

pub fn check_prelude_decl(mut ctx: InferCtx, decl: Decl) -> HDecl {
    // Note: check_decl uses fail.raise internally. Due to the known limitation
    // where cross-module effect propagation doesn't work (effects registered as
    // EMPTY_ROW in Pass 1), we must explicitly surface the fail effect here so
    // callers pass the __ring_ev_fail evidence.
    let result = check_decl(ctx, decl)
    if false { fail.raise(CompileError {}) }
    result
}
