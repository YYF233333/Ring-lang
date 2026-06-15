use types::{Type, Effect, EffectRow, UNIT, EMPTY_ROW, type_to_string, effect_to_string, effects_match_kind, effect_kind_name}
use ast::{Program, Decl, Expr, Param, TypeExpr, TypeParam, Span, Position, EffectOpDecl, EffectExpr,
    UseDecl, UseImport, NamedImport, SigMember}
use hir::{HDecl, HParam, HExpr, HProgram, DerivedImpl, TraitBound, HAssocType,
    HStructField, HEnumVariant, HEffectOp, HTraitMethod, HSigMember,
    DictDispatchInfo, trait_dict_name,
    hexpr_type, hexpr_effects, hexpr_span}
use env::{TypeScheme, apply_subst, find_impl}
use unify::{empty_subst}
use diagnostics::{DiagnosticContext, DiagnosticNote}
use codes::{E0201, E0204, E0402, E0403, E0404, E0405, E0409, E0410, E0501, E0507, E0705, E0707}
use infer_ctx::{InferCtx, InferResult, FnBoundsEntry, CompileError,
    type_error, type_error_with_notes,
    unify_at, unify_at_noted, update_fn_effects,
    resolve_type_expr, resolve_self_type,
    generalize, resolve_relative_qualifier}
use infer_register::{register_decls_two_phase, resolve_declared_effects, prefix_decl_name, insert_mod_aliases, collect_all_supertraits, inject_assoc_types_from_bounds}
use infer::{infer_block, infer_expr}
use zonk::{ZonkCtx, zonk_type, zonk_row, zonk_param, zonk_block, zonk_expr}
use derive::{run_derive_pass}
use scc::{build_call_graph, tarjan_scc, collect_registered_fn_names, collect_self_method_callees}

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
            check_sig_decl(ctx, name, members, is_pub, span),
        Decl::EffectAlias { name, is_pub, span, .. } =>
            HDecl::TypeAlias { name: name, ty: UNIT, is_pub: is_pub, span: span },
        Decl::Delegate { span, .. } =>
            // Delegate is only valid inside impl blocks; handled by check_impl_decl
            HDecl::TypeAlias { name: "<delegate>", ty: UNIT, is_pub: false, span: span },
        Decl::AssocType { span, .. } =>
            // Associated types are only valid inside trait/impl blocks; handled there
            HDecl::TypeAlias { name: "<assoc_type>", ty: UNIT, is_pub: false, span: span }
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
                // Update fn effects (same as check_one_decl)
                match hd {
                    HDecl::Fn { name, effects, .. } => {
                        if effects.effects.len() > 0 {
                            update_fn_effects(ctx.env, name, effects)
                        }
                    },
                    _ => {}
                }
                // Check capability restriction on function declarations
                match cap_row {
                    some(cap) => check_capability(ctx, hd, cap, span),
                    none => {}
                }
                hdecls.push(hd)
            },
            none => {}
        }

        // Expand delegates inside mod-scoped impl blocks (same as check_one_decl)
        match prefixed {
            Decl::Impl { target_type, type_params: impl_tps, methods, span: impl_span, .. } => {
                for m in methods {
                    match m {
                        Decl::Delegate { field, trait_names, span: dspan } => {
                            let delegate_impls = expand_delegate_impls(ctx, target_type, impl_tps, field, trait_names, dspan)
                            for di in delegate_impls {
                                // Check capability on delegate-generated impls too
                                match cap_row {
                                    some(cap) => check_capability(ctx, di, cap, span),
                                    none => {}
                                }
                                hdecls.push(di)
                            }
                        },
                        _ => {}
                    }
                }
            },
            _ => {}
        }
    }
    ctx.mod_path_stack.pop()
    HDecl::ModBlock { name: mod_name, decls: hdecls, is_pub: is_pub, span: span }
}

fn check_capability(mut ctx: InferCtx, decl: HDecl, cap: EffectRow, mod_span: Span) {
    match decl {
        HDecl::Fn { name, effects, span, .. } => {
            check_effects_capability(ctx, name, effects, cap, span)
        },
        HDecl::Impl { methods, .. } => {
            for method in methods {
                match method {
                    HDecl::Fn { name, effects, span, .. } => {
                        check_effects_capability(ctx, name, effects, cap, span)
                    },
                    _ => {}
                }
            }
        },
        _ => {}
    }
}

fn check_effects_capability(mut ctx: InferCtx, name: Str, effects: EffectRow, cap: EffectRow, span: Span) {
    for eff in effects.effects {
        let kind = effect_kind_name(eff)
        let in_cap = cap.effects.any(fn(c) { effects_match_kind(eff, c) })
        if !in_cap {
            let _ = type_error(ctx.sink, E0405,
                "'${name}' uses effect '${kind}' which is not in the module's requires set",
                span,
                DiagnosticContext::OtherContext { detail: some("capability violation") })
        }
    }
    // Note: an open effect row tail (type variable) represents effect
    // polymorphism — the function *may* carry additional effects depending
    // on its call site.  We do NOT reject open tails here because:
    //   1. The per-effect loop above already catches every *concrete* effect
    //      that is not in the capability set.
    //   2. A truly pure function (e.g. `fn id(x: Int) -> Int { x }`) has
    //      effects=[] with an open tail simply because the row was never
    //      closed — rejecting it would be a false positive.
    //   3. For genuinely polymorphic functions (e.g. accepting a callback
    //      with an open effect row), any concrete effect that flows through
    //      will surface in the *caller's* effect row and be caught by the
    //      per-effect check on that caller's declaration.
    //   This is why E0408 ("Open effect row in capability-restricted module")
    //   is defined but never emitted.
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
    // Track which qualified source each imported local name came from, for ambiguity detection
    let mut import_origins: Map<Str, Str> = map_new()

    for use_decl in uses {
        let segments = use_decl.path.segments
        if segments.len() == 0 { continue }
        let first = segments.get(0).unwrap_or("")

        // Check if path starts with relative prefix
        if first != "self" && first != "super" { continue }

        // Build qualifier from relative segments
        // First collect self/super prefix, then append remaining intermediate segments
        let mut qualifier = first
        let mut name_start_idx = 1
        let mut i = 1
        // Collect chained super:: segments (e.g. super::super)
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
        // Determine how many remaining segments are intermediate path components.
        // For NamedItems (use super::a::b::{Foo}): ALL remaining segments are path prefix.
        // For Module (use super::a::b): all remaining except the last are path prefix;
        //   the last segment is the imported name (handled in the Module branch below).
        let remaining_end = match use_decl.imports {
            UseImport::NamedItems { names } => segments.len(),
            UseImport::Module => {
                if segments.len() > 0 { segments.len() - 1 } else { 0 }
            }
        }
        while i < remaining_end {
            let seg = segments.get(i).unwrap_or("")
            qualifier = "${qualifier}::${seg}"
            name_start_idx = i + 1
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

                            // Check for ambiguous import
                            match import_origins.get(local_name) {
                                some(prev_qualified) => {
                                    if prev_qualified != qualified_name {
                                        let _ = type_error(ctx.sink, E0707,
                                            "Ambiguous name '${local_name}': imported from both '${prev_qualified}' and '${qualified_name}'. Use qualified name to disambiguate",
                                            item.span,
                                            DiagnosticContext::OtherContext { detail: some("ambiguous import") })
                                        continue
                                    }
                                },
                                none => {}
                            }

                            match ctx.env.lookup(qualified_name) {
                                some(scheme) => {
                                    ctx.env.bind(local_name, scheme)
                                    import_origins.insert(local_name, qualified_name)
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

                            // Check for ambiguous import
                            match import_origins.get(name) {
                                some(prev_qualified) => {
                                    if prev_qualified != qualified_name {
                                        let _ = type_error(ctx.sink, E0707,
                                            "Ambiguous name '${name}': imported from both '${prev_qualified}' and '${qualified_name}'. Use qualified name to disambiguate",
                                            use_decl.path.span,
                                            DiagnosticContext::OtherContext { detail: some("ambiguous import") })
                                        continue
                                    }
                                },
                                none => {}
                            }

                            match ctx.env.lookup(qualified_name) {
                                some(scheme) => {
                                    ctx.env.bind(name, scheme)
                                    import_origins.insert(name, qualified_name)
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

fn check_effect_decl(mut ctx: InferCtx, name: Str, type_params: List<TypeParam>, ast_ops: List<EffectOpDecl>, is_pub: Bool, span: Span) -> HDecl {
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
        // Type-check default body if present
        let ast_op_opt = ast_ops.get(oi)
        let mut default_body: HExpr? = none
        match ast_op_opt {
            some(ast_op) => match ast_op.body {
                some(body_expr) => {
                    // Bind op params in a new scope for type checking the default body
                    ctx.env.push_scope()
                    for p in op_params {
                        ctx.env.bind_mono(p.name, p.ty)
                    }
                    let body_result = infer_block(ctx, body_expr, none)
                    ctx.subst = body_result.subst
                    let body_type = hexpr_type(body_result.hexpr)
                    ctx.subst = unify_at(ctx.sink, ctx.env, body_type, op.return_type, ctx.subst, span)
                    // Zonk the default body
                    let zctx = ZonkCtx { subst: ctx.subst, names: map_new() }
                    default_body = some(zonk_block(zctx, body_result.hexpr))
                    ctx.env.pop_scope()
                },
                none => {},
            },
            none => {},
        }
        hops.push(HEffectOp { name: op.name, params: op_params, return_type: op.return_type, has_default: op.has_default, default_body: default_body })
        oi = oi + 1
    }

    // Validate default handler body effect dependencies:
    // Collect all custom effects used by default bodies and verify each has all_have_defaults.
    // Also record the dependency graph for cycle detection.
    let mut all_defaults = true
    for op in def.ops {
        if !op.has_default { all_defaults = false }
    }
    if all_defaults && def.ops.len() > 0 {
        let mut deps: List<Str> = []
        let mut dep_set: Set<Str> = set_new()
        for hop in hops {
            match hop.default_body {
                some(body) => {
                    let body_effs = hexpr_effects(body)
                    for eff in body_effs.effects {
                        let eff_name = effect_kind_name(eff)
                        // Skip: io (builtin), fail (builtin), mut (marker), self (same effect)
                        if eff_name == "io" || eff_name == "fail" || eff_name == "mut" || eff_name == name {
                            continue
                        }
                        // Check if the referenced effect has all defaults
                        match ctx.env.types.effects.get(eff_name) {
                            some(dep_def) => {
                                if !dep_def.all_have_defaults {
                                    let _ = type_error(ctx.sink, E0409,
                                        "Default handler body of effect '${name}' uses effect '${eff_name}' which has no default handler; all-default effects cannot depend on effects without defaults",
                                        span,
                                        DiagnosticContext::OtherContext { detail: some("default effect dependency violation") })
                                } else {
                                    if !dep_set.contains(eff_name) {
                                        dep_set.insert(eff_name)
                                        deps.push(eff_name)
                                    }
                                }
                            },
                            none => {}
                        }
                    }
                },
                none => {}
            }
        }
        if deps.len() > 0 {
            ctx.effect_default_deps.insert(name, deps)
        }
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
    let saved_qualified_assoc = map_clone(ctx.qualified_assoc_scope)
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

    // Inject Self into type_param_scope so Self::Item resolves in impl methods
    ctx.type_param_scope.insert("Self", impl_self_type)

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
                        // Expand supertrait bounds
                        let supers = collect_all_supertraits(ctx, bound.trait_name)
                        for st_name in supers {
                            impl_bounds.push(FnBoundsEntry {
                                type_param_var_id: id, trait_name: st_name, type_param_name: tp.name
                            })
                        }
                    }
                },
                _ => {}
            },
            none => {}
        }
    }
    ctx.current_fn_bounds = impl_bounds

    // Collect associated types from impl
    let mut hassoc_types: List<HAssocType> = []
    for method in methods {
        match method {
            Decl::AssocType { name: aname, bounds: abounds, value: avalue, .. } => {
                let mut bound_names: List<Str> = []
                for b in abounds { bound_names.push(b.trait_name) }
                let concrete = match avalue {
                    some(v) => some(resolve_type_expr(ctx, v)),
                    none => none
                }
                hassoc_types.push(HAssocType { name: aname, bounds: bound_names, concrete: concrete })
                // Inject concrete type into type_param_scope for method signature resolution
                match concrete {
                    some(ct) => {
                        ctx.type_param_scope.insert(aname, ct)
                        // Also inject Self::ItemName into qualified_assoc_scope
                        ctx.qualified_assoc_scope.insert("Self::${aname}", ct)
                    },
                    none => {}
                }
            },
            _ => {}
        }
    }

    // B-138: Reorder impl methods by SCC topological order so that callees
    // are checked before callers, enabling correct effect propagation.
    // Step 1: Collect Decl::Fn method names
    let mut impl_fn_names: Set<Str> = set_new()
    let mut impl_fn_map: Map<Str, Decl> = map_new()
    for method in methods {
        match method {
            Decl::Fn { name, .. } => {
                impl_fn_names.insert(name)
                impl_fn_map.insert(name, method)
            },
            _ => {}
        }
    }

    // Step 2: Build impl-internal call graph (self.method() edges)
    let mut impl_call_graph: Map<Str, List<Str>> = map_new()
    for method in methods {
        match method {
            Decl::Fn { name, body, .. } => {
                let mut callees: Set<Str> = set_new()
                collect_self_method_callees(body, impl_fn_names, callees)
                let mut sorted_callees: List<Str> = []
                for c in callees {
                    if c != name { sorted_callees.push(c) }
                }
                sorted_callees.sort()
                impl_call_graph.insert(name, sorted_callees)
            },
            _ => {}
        }
    }

    // Step 3: Run Tarjan SCC to get reverse topo order (callees first)
    let sccs = tarjan_scc(impl_call_graph)

    // Step 4: Build reordered method list — SCC-ordered Fn methods, then non-Fn decls
    let mut ordered_methods: List<Decl> = []
    let mut ordered_fn_names: Set<Str> = set_new()
    for scc in sccs {
        for name in scc {
            if !ordered_fn_names.contains(name) {
                match impl_fn_map.get(name) {
                    some(decl) => {
                        ordered_methods.push(decl)
                        ordered_fn_names.insert(name)
                    },
                    none => {}
                }
            }
        }
    }
    // Append non-Fn decls (ExternFn, AssocType, Delegate) in original order
    for method in methods {
        match method {
            Decl::Fn { .. } => {},  // Already in ordered_methods
            _ => ordered_methods.push(method)
        }
    }

    let mut hmethods: List<HDecl> = []
    for method in ordered_methods {
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
            Decl::Delegate { .. } => {},  // Handled at check_one_decl level
            Decl::AssocType { .. } => {},  // Already handled above
            _ => {}
        }
    }

    ctx.current_fn_bounds = saved_impl_bounds
    ctx.type_param_scope = saved_tp_scope
    ctx.qualified_assoc_scope = saved_qualified_assoc
    HDecl::Impl { target_type: target_type, type_params: type_params, trait_name: trait_name, methods: hmethods, assoc_types: hassoc_types, span: span }
}

fn expand_delegate_impls(
    mut ctx: InferCtx,
    target_type: Str, type_params: List<TypeParam>,
    field: Str, trait_names: List<Str>, span: Span
) -> List<HDecl> {
    let mut result: List<HDecl> = []

    // Look up the field type from the struct definition
    match ctx.env.types.structs.get(target_type) {
        none => { result },  // Error already reported in Pass 1
        some(struct_def) => {
            let mut field_type: Type? = none
            for f in struct_def.fields {
                if f.name == field {
                    field_type = some(f.ty)
                }
            }
            match field_type {
                none => { result },  // Error already reported in Pass 1
                some(ft) => {
                    // Build self_type (same logic as check_impl_decl)
                    let self_type = if type_params.len() > 0 {
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

                    // Collect all traits to generate: explicit traits + their supertraits
                    let mut all_traits: List<Str> = []
                    for tname in trait_names {
                        all_traits.push(tname)
                        let supers = collect_all_supertraits(ctx, tname)
                        for st_name in supers {
                            // Avoid duplicates
                            if !all_traits.contains(st_name) {
                                all_traits.push(st_name)
                            }
                        }
                    }

                    // #125/#128: Get the field type name for looking up resolved methods
                    let field_type_name = match ft {
                        Type::StructType { name: n, .. } => some(n),
                        Type::EnumType { name: n, .. } => some(n),
                        _ => none
                    }
                    let field_impl_methods = match field_type_name {
                        some(ftn) => ctx.env.trait_reg.impl_methods.get(ftn),
                        none => none
                    }

                    for tname in all_traits {
                        match ctx.env.trait_reg.traits.get(tname) {
                            none => {},  // Error already reported in Pass 1
                            some(trait_def) => {
                                // #128: Look up field type's ImplEntry for assoc_types
                                let mut field_assoc_map: Map<Str, Type> = map_new()
                                match field_type_name {
                                    some(ftn) => {
                                        match find_impl(ctx.env.trait_reg, ftn, tname) {
                                            some(field_impl) => { field_assoc_map = map_clone(field_impl.assoc_types) },
                                            none => {}
                                        }
                                    },
                                    none => {}
                                }

                                let mut trait_hmethods: List<HDecl> = []
                                for tm in trait_def.methods {
                                    // #125: Look up field type's resolved method to get concrete
                                    // assoc types for ret_ty / param types, but keep trait def's
                                    // method type for binary-method detection (Self type var matching).
                                    let resolved_method_scheme = match field_impl_methods {
                                        some(fm_map) => fm_map.get(tm.name),
                                        none => none
                                    }
                                    match tm.ty {
                                        Type::FnType { params: trait_params, return_type: trait_ret_ty, effects: trait_eff } => {
                                            // Use resolved return type and effects from field type's method
                                            // if available (concrete assoc types), else fall back to trait def
                                            let ret_ty = match resolved_method_scheme {
                                                some(rs) => match rs.ty {
                                                    Type::FnType { return_type: resolved_ret, .. } => resolved_ret,
                                                    _ => trait_ret_ty
                                                },
                                                none => trait_ret_ty
                                            }
                                            let eff = match resolved_method_scheme {
                                                some(rs) => match rs.ty {
                                                    Type::FnType { effects: resolved_eff, .. } => resolved_eff,
                                                    _ => trait_eff
                                                },
                                                none => trait_eff
                                            }
                                            // Build resolved param types from field method (skipping self)
                                            let resolved_non_self_params = match resolved_method_scheme {
                                                some(rs) => match rs.ty {
                                                    Type::FnType { params: rp, .. } => some(rp),
                                                    _ => none
                                                },
                                                none => none
                                            }
                                            // Build HParam list: first is self, rest are synthetic params
                                            let mut hparams: List<HParam> = []
                                            let def_id_self = ctx.env.fresh_def_id()
                                            // #77: Read self mutability from trait method declaration
                                            let self_is_mut = match tm.param_mutabilities.get(0) {
                                                some(m) => m,
                                                none => false
                                            }
                                            hparams.push(HParam { name: "self", ty: self_type, def_id: some(def_id_self), is_mutable: self_is_mut })

                                            // Determine the trait's Self type (first param) for binary method detection
                                            let trait_self_type = match trait_params.first() {
                                                some(t) => t,
                                                none => UNIT
                                            }

                                            // Build args for the forwarding call (beyond self)
                                            let mut forward_args: List<HExpr> = []
                                            let mut pi = 1
                                            while pi < trait_params.len() {
                                                let pname = "__p${pi - 1}"
                                                let pty = match trait_params.get(pi) {
                                                    some(t) => t,
                                                    none => UNIT
                                                }
                                                // #125: Use resolved param type from field method if available
                                                // (resolves assoc type vars to concrete types)
                                                let resolved_pty = match resolved_non_self_params {
                                                    some(rp) => match rp.get(pi) {
                                                        some(rpt) => rpt,
                                                        none => pty
                                                    },
                                                    none => pty
                                                }
                                                let pid = ctx.env.fresh_def_id()
                                                // #77: Read param mutability from trait method declaration
                                                let p_is_mut = match tm.param_mutabilities.get(pi) {
                                                    some(m) => m,
                                                    none => false
                                                }

                                                // #79: For binary trait methods (e.g. eq(self, other: Self)),
                                                // if the param type is the trait's Self type, forward arg.field
                                                // instead of arg so the field type's method receives the right value.
                                                // Use original trait type vars (pty) for this check.
                                                let is_self_typed = match (pty, trait_self_type) {
                                                    (Type::TypeVar { id: a, .. }, Type::TypeVar { id: b, .. }) => a == b,
                                                    _ => false
                                                }
                                                // For binary Self-typed params, use self_type; otherwise use resolved type
                                                let param_ty = if is_self_typed { self_type } else { resolved_pty }
                                                hparams.push(HParam { name: pname, ty: param_ty, def_id: some(pid), is_mutable: p_is_mut })

                                                if is_self_typed {
                                                    // Forward: __p0.field (access the delegated field from the arg)
                                                    let arg_ident = HExpr::Ident {
                                                        name: pname, resolved_name: none, def_id: some(pid),
                                                        dict_closure_dicts: none,
                                                        ty: self_type, effects: EMPTY_ROW, span: span
                                                    }
                                                    forward_args.push(HExpr::FieldAccess {
                                                        receiver: arg_ident,
                                                        field: field,
                                                        ty: ft,
                                                        effects: EMPTY_ROW,
                                                        span: span
                                                    })
                                                } else {
                                                    forward_args.push(HExpr::Ident {
                                                        name: pname, resolved_name: none, def_id: some(pid),
                                                        dict_closure_dicts: none,
                                                        ty: resolved_pty, effects: EMPTY_ROW, span: span
                                                    })
                                                }
                                                pi = pi + 1
                                            }

                                            // Build: self.field
                                            let field_access = HExpr::FieldAccess {
                                                receiver: HExpr::Ident {
                                                    name: "self", resolved_name: none, def_id: some(def_id_self),
                                                    dict_closure_dicts: none,
                                                    ty: self_type, effects: EMPTY_ROW, span: span
                                                },
                                                field: field,
                                                ty: ft,
                                                effects: EMPTY_ROW,
                                                span: span
                                            }

                                            // #68: Check if this method is a default method without explicit impl
                                            // on the field type. If so, use trait dict dispatch instead of UFCS.
                                            let mut use_dict_dispatch = false
                                            if tm.has_default {
                                                // Get the field type name
                                                let ftn = match ft {
                                                    Type::StructType { name: n, .. } => some(n),
                                                    Type::EnumType { name: n, .. } => some(n),
                                                    _ => none
                                                }
                                                match ftn {
                                                    some(field_tn) => {
                                                        // Check if the field type has an explicit impl for this method
                                                        let mut has_explicit = false
                                                        match ctx.env.trait_reg.impl_methods.get(field_tn) {
                                                            some(methods_map) => {
                                                                has_explicit = methods_map.contains_key(tm.name)
                                                            },
                                                            none => {}
                                                        }
                                                        if !has_explicit {
                                                            use_dict_dispatch = true
                                                        }
                                                    },
                                                    none => {}
                                                }
                                            }

                                            let call_expr = if use_dict_dispatch {
                                                // Generate dict dispatch: __FieldType_Trait.method(self.field, args...)
                                                let ftn = match ft {
                                                    Type::StructType { name: n, .. } => n,
                                                    Type::EnumType { name: n, .. } => n,
                                                    _ => ""
                                                }
                                                let dict_name = trait_dict_name(ftn, tname)
                                                let mut dict_args: List<HExpr> = []
                                                dict_args.push(field_access)
                                                dict_args.extend(forward_args)
                                                HExpr::Call {
                                                    callee: HExpr::Ident {
                                                        name: dict_name, resolved_name: none, def_id: none,
                                                        dict_closure_dicts: none,
                                                        ty: tm.ty, effects: EMPTY_ROW, span: span
                                                    },
                                                    args: dict_args,
                                                    type_args: [],
                                                    resolved_dicts: [],
                                                    dict_dispatch: some(DictDispatchInfo { dict_param: dict_name, method: tm.name }),
                                                    ty: ret_ty,
                                                    effects: eff,
                                                    span: span
                                                }
                                            } else {
                                                // Build: self.field.method — as FieldAccess for UFCS dispatch
                                                let method_access = HExpr::FieldAccess {
                                                    receiver: field_access,
                                                    field: tm.name,
                                                    ty: tm.ty,
                                                    effects: EMPTY_ROW,
                                                    span: span
                                                }

                                                // Build: self.field.method(args...) — as Call with UFCS callee
                                                HExpr::Call {
                                                    callee: method_access,
                                                    args: forward_args,
                                                    type_args: [],
                                                    resolved_dicts: [],
                                                    dict_dispatch: none,
                                                    ty: ret_ty,
                                                    effects: eff,
                                                    span: span
                                                }
                                            }

                                            trait_hmethods.push(HDecl::Fn {
                                                name: tm.name,
                                                def_id: some(ctx.env.fresh_def_id()),
                                                // #77: Copy method type_params from trait method declaration
                                                type_params: tm.method_type_params,
                                                params: hparams,
                                                return_type: ret_ty,
                                                effects: eff,
                                                body: call_expr,
                                                is_pub: false,
                                                trait_bounds: [],
                                                span: span
                                            })
                                        },
                                        _ => {}
                                    }
                                }

                                // #128: Build HAssocType list from field type's assoc_types
                                let mut h_assoc_types: List<HAssocType> = []
                                let mut sorted_assoc = field_assoc_map.entries()
                                sorted_assoc.sort_by(fn(a, b) { if a.0 < b.0 { -1 } else if a.0 > b.0 { 1 } else { 0 } })
                                for entry in sorted_assoc {
                                    let (aname, aty) = entry
                                    h_assoc_types.push(HAssocType { name: aname, bounds: [], concrete: some(aty) })
                                }

                                result.push(HDecl::Impl {
                                    target_type: target_type,
                                    type_params: type_params,
                                    trait_name: some(tname),
                                    methods: trait_hmethods,
                                    assoc_types: h_assoc_types,
                                    span: span
                                })
                            }
                        }
                    }
                    result
                }
            }
        }
    }
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

    // Build HAssocType list from trait def
    let mut hassoc_types: List<HAssocType> = []
    for atdef in trait_def.assoc_types {
        hassoc_types.push(HAssocType { name: atdef.name, bounds: atdef.bounds, concrete: atdef.default_type })
    }

    HDecl::Trait { name: name, type_params: type_params, methods: hmethods, supertraits: trait_def.supertraits, assoc_types: hassoc_types, is_pub: is_pub, span: span }
}

fn check_trait_default_body(mut ctx: InferCtx, trait_name: Str, self_var: Type, hparams: List<HParam>, body: Expr) -> HExpr? {
    let saved_subst = ctx.subst
    ctx.subst = empty_subst()
    ctx.env.push_scope()
    let saved_tp_scope = map_clone(ctx.type_param_scope)
    let saved_qualified_assoc = map_clone(ctx.qualified_assoc_scope)
    ctx.fn_bounds_stack.push(ctx.current_fn_bounds)
    ctx.current_fn_bounds = []

    match self_var {
        Type::TypeVar { id, .. } => {
            ctx.current_fn_bounds.push(FnBoundsEntry {
                type_param_var_id: id, trait_name: trait_name, type_param_name: "self"
            })
            // Expand supertrait bounds for trait default body
            let supers = collect_all_supertraits(ctx, trait_name)
            for st_name in supers {
                ctx.current_fn_bounds.push(FnBoundsEntry {
                    type_param_var_id: id, trait_name: st_name, type_param_name: "self"
                })
            }
        },
        _ => {}
    }

    // Inject Self into type_param_scope so Self::Item resolves
    ctx.type_param_scope.insert("Self", self_var)

    // Inject associated types into qualified_assoc_scope for Self::Item paths
    match ctx.env.trait_reg.traits.get(trait_name) {
        some(tdef) => {
            for atdef in tdef.assoc_types {
                // Associated types are already in type_param_scope (bare name, e.g. "Item")
                // from register_trait. Now also inject Self::Item qualified path.
                match ctx.type_param_scope.get(atdef.name) {
                    some(at_ty) => {
                        ctx.qualified_assoc_scope.insert("Self::${atdef.name}", at_ty)
                    },
                    none => {}
                }
            }
        },
        none => {}
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
    ctx.type_param_scope = saved_tp_scope
    ctx.qualified_assoc_scope = saved_qualified_assoc

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

fn check_extern_fn_decl(mut ctx: InferCtx, name: Str, type_params: List<TypeParam>, params: List<Param>, declared_effects: List<EffectExpr>?, is_pub: Bool, span: Span) -> HDecl {
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
    let fn_body_notes: List<DiagnosticNote> = [
        DiagnosticNote { message: "function return type is declared as '${type_to_string(apply_subst(ctx.subst, expected_ret))}'", span: some(span) },
        DiagnosticNote { message: "function body evaluates to '${type_to_string(apply_subst(ctx.subst, hexpr_type(body_result.hexpr)))}'", span: some(hexpr_span(body_result.hexpr)) }
    ]
    ctx.subst = unify_at_noted(ctx.sink, ctx.env, hexpr_type(body_result.hexpr), expected_ret, ctx.subst, span, fn_body_notes)

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
    let mut sorted_tp_scope2 = ctx.type_param_scope.entries()
    sorted_tp_scope2.sort_by(fn(a, b) { if a.0 < b.0 { -1 } else if a.0 > b.0 { 1 } else { 0 } })
    for entry in sorted_tp_scope2 {
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

    // Add associated type variable names from trait bounds so error messages
    // show "Item" instead of "?NNN" for associated types
    let mut seen_traits: Set<Str> = set_new()
    for fb in ctx.current_fn_bounds {
        if seen_traits.contains(fb.trait_name) { continue }
        seen_traits.insert(fb.trait_name)
        match ctx.env.trait_reg.traits.get(fb.trait_name) {
            some(tdef) => {
                for atdef in tdef.assoc_types {
                    if !local_names.contains_key(atdef.var_id) {
                        let resolved = apply_subst(ctx.subst, Type::TypeVar { id: atdef.var_id, name: none })
                        match resolved { Type::TypeVar { id: rid, .. } => { local_names.insert(rid, atdef.name) }, _ => {} }
                    }
                }
            },
            none => {}
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

fn is_value_type(t: Type) -> Bool {
    match t {
        Type::IntType => true,
        Type::FloatType => true,
        Type::BoolType => true,
        Type::StrType => true,
        _ => false
    }
}

fn check_fn_decl(mut ctx: InferCtx, name: Str, type_params: List<TypeParam>, params: List<Param>, return_type: TypeExpr?, declared_effects: List<EffectExpr>?, body: Expr, is_pub: Bool, span: Span, self_type: Type?) -> HDecl {
    let saved_subst = ctx.subst
    ctx.subst = empty_subst()
    ctx.env.push_scope()

    let saved_tp_scope = map_clone(ctx.type_param_scope)
    let saved_qualified_assoc = map_clone(ctx.qualified_assoc_scope)
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
                        // Expand supertrait bounds: if T: Ord and Ord: Eq, add T: Eq too
                        let supers = collect_all_supertraits(ctx, bound.trait_name)
                        for st_name in supers {
                            ctx.current_fn_bounds.push(FnBoundsEntry {
                                type_param_var_id: id, trait_name: st_name, type_param_name: tp.name
                            })
                        }
                    }
                },
                _ => {}
            },
            none => {}
        }
    }

    // Inject associated types from type param bounds into type_param_scope
    // so that zonk names map includes associated type variable names (e.g., Item instead of ?NNN)
    inject_assoc_types_from_bounds(ctx, type_params)

    let mut hparams: List<HParam> = []
    let mut param_types: List<Type> = []
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
                        ctx.var_lambda_depth.insert(did, ctx.lambda_depth)
                        if p.is_mutable {
                            ctx.env.scope.mutable_vars.insert(did)
                            ctx.env.scope.mut_param_defs.insert(did)
                            // Auto-box mut value-type parameters (not self)
                            if p.name != "self" {
                                let resolved_pt = apply_subst(ctx.subst, ptype)
                                if is_value_type(resolved_pt) {
                                    ctx.boxed_vars.insert(did)
                                }
                            }
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
        param_types.push(ptype)
    }

    // B-069: Infer default value expressions and store in hparams
    let mut default_hexprs: List<HExpr> = []
    let mut min_arity = params.len()
    let mut pi = 0
    for p in params {
        match p.default_value {
            some(dv) => {
                let dv_result = infer_expr(ctx, dv, ctx.subst)
                ctx.subst = dv_result.subst
                // Unify default value type with param type
                match param_types.get(pi) {
                    some(pt) => {
                        ctx.subst = unify_at(ctx.sink, ctx.env, hexpr_type(dv_result.hexpr), pt, ctx.subst, p.span)
                    },
                    none => {}
                }
                // Check that default value is pure (no effects)
                let dv_effects = dv_result.effects
                if dv_effects.effects.len() > 0 {
                    let _ = type_error(ctx.sink, E0404,
                        "Default parameter value for '${p.name}' must be a pure expression (no effects)",
                        p.span,
                        DiagnosticContext::OtherContext { detail: some("default parameter effect") })
                }
                default_hexprs.push(dv_result.hexpr)
                if min_arity == params.len() {
                    // First default param sets the min arity
                    min_arity = pi
                }
            },
            none => {}
        }
        pi = pi + 1
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
    ctx.qualified_assoc_scope = saved_qualified_assoc
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
                        match (inferred_eff, declared_eff) {
                            (Effect::FailEffect { error_type: ie }, Effect::FailEffect { error_type: de }) => {
                                ctx.subst = unify_at(ctx.sink, ctx.env, ie, de, ctx.subst, span)
                            },
                            (Effect::MutEffect { state_type: is }, Effect::MutEffect { state_type: ds }) => {
                                ctx.subst = unify_at(ctx.sink, ctx.env, is, ds, ctx.subst, span)
                            },
                            (Effect::CustomEffect { type_args: ia, .. }, Effect::CustomEffect { type_args: da, .. }) => {
                                let mut i = 0
                                while i < ia.len() && i < da.len() {
                                    ctx.subst = unify_at(ctx.sink, ctx.env, ia.get(i).unwrap_or(UNIT), da.get(i).unwrap_or(UNIT), ctx.subst, span)
                                    i = i + 1
                                }
                            },
                            _ => {}
                        }
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
    // Exception: effects where all ops have default handlers are allowed (auto-injected evidence).
    if name == "main" {
        for eff in final_effects.effects {
            match eff {
                Effect::CustomEffect { name: eff_name, .. } => {
                    let mut skip = false
                    match ctx.env.types.effects.get(eff_name) {
                        some(edef) => {
                            if edef.all_have_defaults { skip = true }
                        },
                        none => {}
                    }
                    if !skip {
                        let effect_notes: List<DiagnosticNote> = [
                            DiagnosticNote { message: "effect '${eff_name}' is used but not handled in main", span: some(span) },
                            DiagnosticNote { message: "use 'handle ... with { ${eff_name} { op_name(args) => result } }' to handle this effect", span: none }
                        ]
                        let _ = type_error_with_notes(ctx.sink, E0403,
                            "Unhandled effect '${eff_name}' in main function; custom effects must be handled before reaching main",
                            span,
                            DiagnosticContext::EffectUnhandled { eff: eff_name, in_function: some("main") },
                            effect_notes)
                    }
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

    // Register fn_mut_params for call-site pre-boxing analysis
    // Only flag params that are mut AND value-type (Int/Float/Bool/Str).
    // self params and reference-type params are never boxed.
    let mut mut_flags: List<Bool> = []
    let mut fi = 0
    for p in params {
        if p.name == "self" || !p.is_mutable {
            mut_flags.push(false)
        } else {
            // Check if the param's resolved type is a value type
            match final_params.get(fi) {
                some(fp) => mut_flags.push(is_value_type(fp.ty)),
                none => mut_flags.push(false)
            }
        }
        fi = fi + 1
    }
    ctx.fn_mut_params.insert(name, mut_flags)

    // B-069: Register default parameter info for call-site expansion
    if default_hexprs.len() > 0 {
        // Zonk the default HExprs so they are fully resolved
        let zctx_defaults = ZonkCtx { subst: ctx.subst, names: map_new() }
        let mut zonked_defaults: List<HExpr> = []
        for dh in default_hexprs {
            zonked_defaults.push(zonk_expr(zctx_defaults, dh))
        }
        ctx.fn_defaults.insert(name, zonked_defaults)
        ctx.fn_min_arity.insert(name, min_arity)
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

    // Update fn effects before push (modifies ctx.env, not hdecls)
    match hd {
        HDecl::Fn { name, effects, .. } => {
            if effects.effects.len() > 0 {
                update_fn_effects(ctx.env, name, effects)
            }
        },
        _ => {}
    }

    // Expand delegates first, collect results before pushing anything to hdecls.
    // If expand_delegate_impls fails (raises CompileError), neither the impl HIR
    // nor partial delegate HIR will be left in hdecls.
    let mut delegate_decls: List<HDecl> = []
    match decl {
        Decl::Impl { target_type, type_params, methods, span, .. } => {
            for m in methods {
                match m {
                    Decl::Delegate { field, trait_names, span: dspan } => {
                        let delegate_impls = expand_delegate_impls(ctx, target_type, type_params, field, trait_names, dspan)
                        for di in delegate_impls { delegate_decls.push(di) }
                    },
                    _ => {}
                }
            }
        },
        _ => {}
    }

    // Only push after everything succeeded
    hdecls.push(hd)
    for di in delegate_decls { hdecls.push(di) }
}

// B-122: Check a declaration and rebind fn/impl-method types with resolved types.
// After check_fn_decl, the registered type scheme still has unresolved fresh vars
// from Pass 1. Rebinding replaces it with the fully-resolved type from inference,
// so that subsequent callers (in SCC topological order) see correct return types.
fn check_one_decl_with_rebind(mut ctx: InferCtx, decl: Decl, mut hdecls: List<HDecl>) {
    let hd = check_decl(ctx, decl)

    // Update fn effects and rebind resolved types
    match hd {
        HDecl::Fn { name, params, return_type, effects, .. } => {
            if effects.effects.len() > 0 {
                update_fn_effects(ctx.env, name, effects)
            }
            // B-122: Rebind with fully-resolved type from inference
            rebind_fn_type(ctx, name, params, return_type, effects)
        },
        HDecl::Impl { methods, .. } => {
            // Rebind each impl method's resolved type
            for method in methods {
                match method {
                    HDecl::Fn { name: mname, params: mparams, return_type: mret, effects: meff, .. } => {
                        if meff.effects.len() > 0 {
                            update_fn_effects(ctx.env, mname, meff)
                        }
                        rebind_fn_type(ctx, mname, mparams, mret, meff)
                    },
                    _ => {}
                }
            }
        },
        _ => {}
    }

    // Delegate expansion (same as check_one_decl)
    let mut delegate_decls: List<HDecl> = []
    match decl {
        Decl::Impl { target_type, type_params, methods, span, .. } => {
            for m in methods {
                match m {
                    Decl::Delegate { field, trait_names, span: dspan } => {
                        let delegate_impls = expand_delegate_impls(ctx, target_type, type_params, field, trait_names, dspan)
                        for di in delegate_impls { delegate_decls.push(di) }
                    },
                    _ => {}
                }
            }
        },
        _ => {}
    }

    hdecls.push(hd)
    for di in delegate_decls { hdecls.push(di) }
}

// B-122: Rebind a fn's type scheme with resolved return type and effects.
//
// After check_fn_decl, the registered type scheme may have a free TypeVar for
// the return type (from Pass 1 registration of unannotated returns). This var
// is never bound globally — each caller independently instantiates it, making
// the return type effectively polymorphic (#149).
//
// We fix this by replacing the scheme's return type with the concrete resolved
// type from inference. For polymorphic fns where the resolved return type still
// contains TypeVars (e.g., generic identity fn), we build a mapping from
// check-time var ids to registration-time var ids using param correspondence,
// so the scheme remains consistent.
fn rebind_fn_type(mut ctx: InferCtx, name: Str, params: List<HParam>, return_type: Type, effects: EffectRow) {
    match ctx.env.lookup(name) {
        some(scheme) => match scheme.ty {
            Type::FnType { params: reg_params, return_type: reg_ret, .. } => {
                // Build mapping: check-time var id → registration-time var id
                // by comparing resolved params with registered params position-by-position.
                let mut var_mapping: Map<Int, Type> = map_new()
                let mut pi = 0
                for p in params {
                    match reg_params.get(pi) {
                        some(reg_p) => {
                            build_var_mapping(p.ty, reg_p, var_mapping)
                        },
                        none => {}
                    }
                    pi = pi + 1
                }

                // Map the resolved return type back to registration-time vars
                let mapped_ret = apply_var_mapping(return_type, var_mapping)

                // Also map effects
                let mapped_effects = map_effect_row(effects, var_mapping)

                let new_type = Type::FnType {
                    params: reg_params, return_type: mapped_ret, effects: mapped_effects
                }
                ctx.env.rebind(name, TypeScheme { ..scheme, ty: new_type })
            },
            _ => {}
        },
        none => {}
    }
}

// Build a var-id mapping by structurally comparing two types.
// If check_ty = TypeVar(?42) and reg_ty = TypeVar(?1), records ?42 → ?1.
fn build_var_mapping(check_ty: Type, reg_ty: Type, mut mapping: Map<Int, Type>) {
    match (check_ty, reg_ty) {
        (Type::TypeVar { id: check_id, .. }, _) => {
            if !mapping.contains_key(check_id) {
                mapping.insert(check_id, reg_ty)
            }
        },
        (Type::FnType { params: cp, return_type: cr, .. },
         Type::FnType { params: rp, return_type: rr, .. }) => {
            let mut i = 0
            for c in cp {
                match rp.get(i) {
                    some(r) => build_var_mapping(c, r, mapping),
                    none => {}
                }
                i = i + 1
            }
            build_var_mapping(cr, rr, mapping)
        },
        (Type::StructType { type_params: ct, .. }, Type::StructType { type_params: rt, .. }) => {
            let mut i = 0
            for c in ct {
                match rt.get(i) {
                    some(r) => build_var_mapping(c, r, mapping),
                    none => {}
                }
                i = i + 1
            }
        },
        (Type::EnumType { type_params: ct, .. }, Type::EnumType { type_params: rt, .. }) => {
            let mut i = 0
            for c in ct {
                match rt.get(i) {
                    some(r) => build_var_mapping(c, r, mapping),
                    none => {}
                }
                i = i + 1
            }
        },
        (Type::TupleType { elements: ce }, Type::TupleType { elements: re }) => {
            let mut i = 0
            for c in ce {
                match re.get(i) {
                    some(r) => build_var_mapping(c, r, mapping),
                    none => {}
                }
                i = i + 1
            }
        },
        _ => {}
    }
}

// Apply var-id mapping to a type: replace check-time TypeVars with registration-time types.
fn apply_var_mapping(ty: Type, mapping: Map<Int, Type>) -> Type {
    match ty {
        Type::TypeVar { id, .. } => {
            match mapping.get(id) {
                some(mapped) => mapped,
                none => ty  // unmapped var — keep as-is (concrete types don't have this)
            }
        },
        Type::FnType { params, return_type, effects } => {
            let mut mapped_params: List<Type> = []
            for p in params { mapped_params.push(apply_var_mapping(p, mapping)) }
            Type::FnType {
                params: mapped_params,
                return_type: apply_var_mapping(return_type, mapping),
                effects: map_effect_row(effects, mapping)
            }
        },
        Type::StructType { name, type_params, fields } => {
            let mut mapped_tps: List<Type> = []
            for tp in type_params { mapped_tps.push(apply_var_mapping(tp, mapping)) }
            Type::StructType { name: name, type_params: mapped_tps, fields: fields }
        },
        Type::EnumType { name, type_params, variants } => {
            let mut mapped_tps: List<Type> = []
            for tp in type_params { mapped_tps.push(apply_var_mapping(tp, mapping)) }
            Type::EnumType { name: name, type_params: mapped_tps, variants: variants }
        },
        Type::TupleType { elements } => {
            let mut mapped_els: List<Type> = []
            for e in elements { mapped_els.push(apply_var_mapping(e, mapping)) }
            Type::TupleType { elements: mapped_els }
        },
        Type::GenericType { base, args } => {
            let mut mapped_args: List<Type> = []
            for a in args { mapped_args.push(apply_var_mapping(a, mapping)) }
            Type::GenericType { base: apply_var_mapping(base, mapping), args: mapped_args }
        },
        _ => ty  // IntType, FloatType, StrType, BoolType, UnitType, etc. — concrete, no mapping needed
    }
}

// Apply var-id mapping to an effect row
fn map_effect_row(row: EffectRow, mapping: Map<Int, Type>) -> EffectRow {
    if mapping.len() == 0 { return row }
    let mut mapped_effects: List<Effect> = []
    for eff in row.effects {
        match eff {
            Effect::FailEffect { error_type } =>
                mapped_effects.push(Effect::FailEffect { error_type: apply_var_mapping(error_type, mapping) }),
            Effect::MutEffect { state_type } =>
                mapped_effects.push(Effect::MutEffect { state_type: apply_var_mapping(state_type, mapping) }),
            Effect::CustomEffect { name, type_args } => {
                let mut mapped_args: List<Type> = []
                for a in type_args { mapped_args.push(apply_var_mapping(a, mapping)) }
                mapped_effects.push(Effect::CustomEffect { name: name, type_args: mapped_args })
            },
            Effect::IoEffect => mapped_effects.push(eff)
        }
    }
    EffectRow { effects: mapped_effects, tail: row.tail }
}

// ============================================================
// Default effect handler cycle detection
// ============================================================

fn check_default_effect_cycles(mut ctx: InferCtx, decls: List<Decl>) {
    // Build span lookup for error reporting
    let mut effect_spans: Map<Str, Span> = map_new()
    collect_effect_spans(decls, effect_spans)

    // DFS-based cycle detection on effect_default_deps graph
    // States: 0 = unvisited, 1 = in-progress (on stack), 2 = done
    let mut state: Map<Str, Int> = map_new()
    let mut path: List<Str> = []

    let mut sorted_edd = ctx.effect_default_deps.entries()
    sorted_edd.sort_by(fn(a, b) { if a.0 < b.0 { -1 } else if a.0 > b.0 { 1 } else { 0 } })
    for entry in sorted_edd {
        let (eff_name, _) = entry
        if !state.contains_key(eff_name) {
            dfs_detect_cycle(ctx, eff_name, state, path, effect_spans)
        }
    }
}

fn collect_effect_spans(decls: List<Decl>, mut spans: Map<Str, Span>) {
    for decl in decls {
        match decl {
            Decl::Effect { name, span, .. } => {
                spans.insert(name, span)
            },
            Decl::ModBlock { decls: mod_decls, .. } => {
                collect_effect_spans(mod_decls, spans)
            },
            _ => {}
        }
    }
}

fn dfs_detect_cycle(mut ctx: InferCtx, name: Str, mut state: Map<Str, Int>, mut path: List<Str>, effect_spans: Map<Str, Span>) {
    state.insert(name, 1)  // mark as in-progress
    path.push(name)

    match ctx.effect_default_deps.get(name) {
        some(deps) => {
            for dep in deps {
                match state.get(dep) {
                    some(s) => {
                        if s == 1 {
                            // Found a cycle: build cycle path description
                            let mut cycle_parts: List<Str> = []
                            let mut found_start = false
                            for p in path {
                                if p == dep { found_start = true }
                                if found_start { cycle_parts.push(p) }
                            }
                            cycle_parts.push(dep)
                            let cycle_str = cycle_parts.join(" -> ")
                            let err_span = match effect_spans.get(name) {
                                some(sp) => sp,
                                none => Span { file: "", start: Position { line: 0, column: 0, offset: 0 }, end: Position { line: 0, column: 0, offset: 0 } }
                            }
                            let _ = type_error(ctx.sink, E0410,
                                "Cyclic dependency in default effect handlers: ${cycle_str}",
                                err_span,
                                DiagnosticContext::OtherContext { detail: some("cyclic default effect dependency") })
                        }
                        // s == 2 means already processed, no cycle through this node
                    },
                    none => {
                        // Unvisited: recurse
                        dfs_detect_cycle(ctx, dep, state, path, effect_spans)
                    }
                }
            }
        },
        none => {}
    }

    path.pop()
    state.insert(name, 2)  // mark as done
}

pub fn check(mut ctx: InferCtx, program: Program) -> HProgram {
    register_decls_two_phase(ctx, program.decls)
    let derived_impls = run_derive_pass(ctx.env)

    // Effect pre-pass: check impl blocks to populate impl_methods with inferred effects.
    // Without this, callers defined before impl blocks see EMPTY_ROW effects from Pass 1.
    // The main pass re-checks with correct effects visible.
    // DiagnosticSink deduplication (by code+span) prevents double error reporting.
    for decl in program.decls {
        match decl {
            Decl::Impl { target_type, type_params, trait_name, methods, span } => {
                let _ = some(check_impl_decl(ctx, target_type, type_params, trait_name, methods, span)) catch { _ => none }
            },
            _ => {}
        }
    }

    // B-122: Build SCC for fn/impl declaration ordering.
    // Callees are checked before callers so that rebinding makes resolved
    // return types visible to callers (fixing the #149 unsound ret-var hole).
    let registered_fns = collect_registered_fn_names(program.decls)
    let call_graph = build_call_graph(program.decls, registered_fns)
    let scc_groups = tarjan_scc(call_graph)

    // Build lookup: SCC node name → index in program.decls
    let mut fn_name_to_idx: Map<Str, Int> = map_new()
    let mut impl_node_to_idx: Map<Str, Int> = map_new()
    let mut idx = 0
    for decl in program.decls {
        match decl {
            Decl::Fn { name, .. } => {
                fn_name_to_idx.insert(name, idx)
            },
            Decl::Impl { target_type, trait_name, .. } => {
                let inode = match trait_name {
                    some(tn) => "impl::${target_type}::${tn}",
                    none => "impl::${target_type}"
                }
                impl_node_to_idx.insert(inode, idx)
            },
            _ => {}
        }
        idx = idx + 1
    }

    let mut hdecls: List<HDecl> = []
    let mut checked: Set<Int> = set_new()

    // Phase 1: Check non-fn/non-impl declarations in source order.
    // These (struct, enum, effect, trait, extern, const, type-alias, sig, test, mod)
    // do not participate in the fn call graph.
    let mut di = 0
    for decl in program.decls {
        match decl {
            Decl::Fn { .. } => {},
            Decl::Impl { .. } => {},
            _ => {
                let result = some(check_one_decl_with_rebind(ctx, decl, hdecls)) catch { _ => none }
                checked.insert(di)
            }
        }
        di = di + 1
    }

    // Phase 2a: Check impl blocks in source order (before top-level fns).
    // This re-checks impls with effects populated by the pre-pass.
    // Must happen before top-level fns so that method effects are visible
    // to callers (method calls are invisible to the call graph).
    let mut ii = 0
    for decl in program.decls {
        match decl {
            Decl::Impl { .. } => {
                if !checked.contains(ii) {
                    let result = some(check_one_decl_with_rebind(ctx, decl, hdecls)) catch { _ => none }
                    checked.insert(ii)
                }
            },
            _ => {}
        }
        ii = ii + 1
    }

    // Phase 2b: Check top-level fn declarations in SCC topological order.
    // tarjan_scc returns SCCs with leaf dependencies first (reverse topo),
    // so callees are checked before callers. After each check, rebinding
    // makes the resolved return type visible to subsequent callers.
    for scc_group in scc_groups {
        for name in scc_group {
            match fn_name_to_idx.get(name) {
                some(i) => {
                    if !checked.contains(i) {
                        match program.decls.get(i) {
                            some(decl) => {
                                let result = some(check_one_decl_with_rebind(ctx, decl, hdecls)) catch { _ => none }
                                checked.insert(i)
                            },
                            none => {}
                        }
                    }
                },
                none => {}
            }
        }
    }

    // Phase 3: Check any remaining unchecked decls (safety net for decls
    // not reached by SCC — e.g., dead code or decls with no call graph edges).
    let mut ri = 0
    for decl in program.decls {
        if !checked.contains(ri) {
            let result = some(check_one_decl_with_rebind(ctx, decl, hdecls)) catch { _ => none }
        }
        ri = ri + 1
    }

    // Check for cyclic dependencies in default effect handlers
    check_default_effect_cycles(ctx, program.decls)

    // static_dicts is populated by dict_lower (checker pipeline) — empty here.
    HProgram { decls: hdecls, derived_impls: derived_impls, boxed_vars: ctx.boxed_vars, static_dicts: [] }
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
