use types::{Type, Effect, EffectRow, RecordField, OwnershipMetadata,
    UNIT, EMPTY_ROW, type_to_string, effect_to_string,
    nominal_display_name, effects_match_kind_with_ownership,
    effect_kind_name,
    types_equal_with_ownership,
    PARAM_OWNERSHIP_BORROW, CALLABLE_BORROW_OWNED,
    callable_param_ownership, type_may_own, fn_meta}
use ast::{Program, Decl, Expr, Param, TypeExpr, TypeParam, Span, Position, EffectOpDecl, EffectExpr,
    UseDecl, SigMember}
use hir::{HDecl, HParam, HExpr, HStmt, HProgram, DerivedImpl, TraitBound, HAssocType,
    HStructField, HEnumVariant, HEffectOp, HTraitMethod, HSigMember,
    DictDispatchInfo, trait_dict_name,
    hexpr_type, hexpr_effects, hexpr_span,
    collect_extern_type_names, compare_by_first, extern_abi_leaf,
    hparam_flags, hparam_is_mutable,
    hparam_mark_external_drop_owner}
use env::{TypeScheme, SchemeBound, MethodOrigin,
    apply_subst, apply_subst_map, apply_subst_row_map,
    find_impl, find_impl_by_origin, impl_origin, impl_decl_origin,
    impl_method_origin,
    install_method_scheme, build_type_var_map,
    trait_is_authoritative_drop}
use union_find::{UnionFind}
use unify::{empty_subst}
use diagnostics::{DiagnosticContext, DiagnosticNote}
use codes::{E0201, E0204, E0301, E0402, E0403, E0404, E0405, E0409, E0410, E0501, E0503, E0507, E0802, E0803}
use infer_ctx::{InferCtx, InferResult, FnBoundsEntry, AssocRebindEntry, CompileError,
    type_error, type_error_with_notes,
    unify_at, unify_at_noted, update_fn_effects,
    resolve_type_expr, resolve_self_type, resolve_dicts_from_scheme,
    pending_dict_checkpoint, drain_pending_dicts, rollback_pending_dicts,
    settle_default_pending_dicts, assert_pending_dict_owner_closed,
    generalize, collect_free_vars, free_type_vars_in_env, resolve_mod_uses,
    fresh_call_result_callable_def_id,
    enter_project_root_frame, enter_project_child_frame,
    exit_project_namespace_frame}
use infer_helpers::{is_value_type}
use infer_register::{register_decls_two_phase, register_module_decls_two_phase,
    resolve_declared_effects, prefix_decl_name, insert_mod_aliases,
    collect_all_supertraits, inject_assoc_types_from_bounds,
    resolve_trait_identity, resolve_nominal_identity,
    solve_ownership_shapes, direct_drop_target_has_codegen_glue,
    first_impl_trait_bound_span}
use infer::{infer_block, infer_expr,
    register_bounded_callable_value_shadows,
    register_default_bounded_callable_value_shadows}
use zonk::{ZonkCtx, zonk_type, zonk_row, zonk_param, zonk_block, zonk_expr}
use derive::{run_derive_pass}
use scc::{build_call_graph, tarjan_scc, collect_registered_fn_names, collect_self_method_callees}

fn ownership_from_fn_type(ty: Type, param_count: Int) -> Int {
    match ty {
        Type::FnType { meta, .. } => meta.ownership_term,
        _ => CALLABLE_BORROW_OWNED
    }
}

// ============================================================
// Pass 2: Check declarations (from infer.ts)
// ============================================================

fn finish_checked_decl_firebreak(
    mut ctx: InferCtx, obligation_checkpoint: Int, hdecl: HDecl
) -> HDecl {
    assert_pending_dict_owner_closed(ctx, obligation_checkpoint)
    let checked_decl = hdecl
    checked_decl
}

fn check_decl(
    mut ctx: InferCtx, decl: Decl, frame_decl_index: Int?
) -> HDecl {
    let obligation_checkpoint = pending_dict_checkpoint(ctx)
    let result = some(check_decl_inner(
        ctx, decl, frame_decl_index)) catch { _ => none }
    match result {
        some(hdecl) => finish_checked_decl_firebreak(
            ctx, obligation_checkpoint, hdecl),
        none => {
            rollback_pending_dicts(ctx, obligation_checkpoint)
            fail.raise(CompileError {})
        }
    }
}

fn check_struct_decl_arm_firebreak(
    ctx: InferCtx, name: Str, type_params: List<TypeParam>,
    is_pub: Bool, span: Span
) -> HDecl {
    let checked_name = name
    let checked_type_params = type_params
    let checked_span = span
    check_struct_decl(
        ctx, checked_name, checked_type_params, is_pub, checked_span)
}

fn check_enum_decl_arm_firebreak(
    ctx: InferCtx, name: Str, type_params: List<TypeParam>,
    is_pub: Bool, span: Span
) -> HDecl {
    let checked_name = name
    let checked_type_params = type_params
    let checked_span = span
    check_enum_decl(
        ctx, checked_name, checked_type_params, is_pub, checked_span)
}

fn check_effect_decl_arm_firebreak(
    mut ctx: InferCtx, name: Str, type_params: List<TypeParam>,
    ops: List<EffectOpDecl>, is_pub: Bool, span: Span
) -> HDecl {
    let checked_name = name
    let checked_type_params = type_params
    let checked_ops = ops
    let checked_span = span
    check_effect_decl(
        ctx, checked_name, checked_type_params, checked_ops,
        is_pub, checked_span)
}

fn check_impl_decl_arm_firebreak(
    mut ctx: InferCtx, target_type: Str, type_params: List<TypeParam>,
    trait_name: Str?, methods: List<Decl>, span: Span
) -> HDecl {
    let checked_target_type = target_type
    let checked_type_params = type_params
    let checked_trait_name = trait_name
    let checked_methods = methods
    let checked_span = span
    check_impl_decl(
        ctx, checked_target_type, checked_type_params,
        checked_trait_name, checked_methods, checked_span)
}

fn check_test_decl_arm_firebreak(
    mut ctx: InferCtx, description: Str, body: Expr, span: Span
) -> HDecl {
    let checked_description = description
    let checked_body = body
    let checked_span = span
    check_test_decl(ctx, checked_description, checked_body, checked_span)
}

fn check_trait_decl_arm_firebreak(
    mut ctx: InferCtx, name: Str, type_params: List<TypeParam>,
    methods: List<Decl>, is_pub: Bool, span: Span
) -> HDecl {
    let checked_name = name
    let checked_type_params = type_params
    let checked_methods = methods
    let checked_span = span
    check_trait_decl(
        ctx, checked_name, checked_type_params, checked_methods,
        is_pub, checked_span)
}

fn check_extern_fn_decl_arm_firebreak(
    mut ctx: InferCtx, name: Str, type_params: List<TypeParam>,
    params: List<Param>, declared_effects: List<EffectExpr>?,
    is_pub: Bool, span: Span
) -> HDecl {
    let checked_name = name
    let checked_type_params = type_params
    let checked_params = params
    let checked_declared_effects = declared_effects
    let checked_span = span
    check_extern_fn_decl(
        ctx, checked_name, checked_type_params, checked_params,
        checked_declared_effects, is_pub, checked_span, none)
}

fn checked_extern_type_decl_firebreak(
    name: Str, type_params: List<TypeParam>, is_pub: Bool, span: Span
) -> HDecl {
    let checked_name = name
    let checked_type_params = type_params
    let checked_span = span
    HDecl::ExternType {
        name: checked_name, type_params: checked_type_params,
        is_pub: is_pub, span: checked_span
    }
}

fn checked_type_alias_decl_result_firebreak(
    name: Str, alias_type: Type, is_pub: Bool, span: Span
) -> HDecl {
    let checked_name = name
    let checked_alias_type = alias_type
    let checked_span = span
    HDecl::TypeAlias {
        name: checked_name, ty: checked_alias_type,
        is_pub: is_pub, span: checked_span
    }
}

fn check_type_alias_decl_arm_firebreak(
    ctx: InferCtx, name: Str, is_pub: Bool, span: Span
) -> HDecl {
    let alias_type = match ctx.env.types.type_aliases.get(name) {
        some(alias) => alias.ty,
        none => UNIT
    }
    checked_type_alias_decl_result_firebreak(
        name, alias_type, is_pub, span)
}

fn check_const_decl_arm_firebreak(
    mut ctx: InferCtx, name: Str, type_annotation: TypeExpr?,
    init: Expr, is_pub: Bool, span: Span
) -> HDecl {
    let checked_name = name
    let checked_type_annotation = type_annotation
    let checked_init = init
    let checked_span = span
    check_const_decl(
        ctx, checked_name, checked_type_annotation, checked_init,
        is_pub, checked_span)
}

fn check_sig_decl_arm_firebreak(
    mut ctx: InferCtx, name: Str, members: List<SigMember>,
    is_pub: Bool, span: Span
) -> HDecl {
    let checked_name = name
    let checked_members = members
    let checked_span = span
    check_sig_decl(ctx, checked_name, checked_members, is_pub, checked_span)
}

fn checked_effect_alias_decl_firebreak(
    name: Str, is_pub: Bool, span: Span
) -> HDecl {
    let checked_name = name
    let checked_span = span
    HDecl::TypeAlias {
        name: checked_name, ty: UNIT, is_pub: is_pub, span: checked_span
    }
}

fn checked_placeholder_decl_firebreak(name: Str, span: Span) -> HDecl {
    let checked_name = name
    let checked_span = span
    HDecl::TypeAlias {
        name: checked_name, ty: UNIT, is_pub: false, span: checked_span
    }
}

fn check_decl_inner(
    mut ctx: InferCtx, decl: Decl, frame_decl_index: Int?
) -> HDecl {
    match decl {
        Decl::Struct { name, type_params, is_pub, span, .. } =>
            check_struct_decl_arm_firebreak(
                ctx, name, type_params, is_pub, span),
        Decl::Enum { name, type_params, is_pub, span, .. } =>
            check_enum_decl_arm_firebreak(
                ctx, name, type_params, is_pub, span),
        Decl::Effect { name, type_params, ops, is_pub, span } =>
            check_effect_decl_arm_firebreak(
                ctx, name, type_params, ops, is_pub, span),
        Decl::Impl { target_type, type_params, trait_name, methods, span } =>
            check_impl_decl_arm_firebreak(
                ctx, target_type, type_params, trait_name, methods, span),
        Decl::Fn { name, type_params, params, return_type, declared_effects, body, is_pub, span, .. } =>
            check_fn_decl(ctx, name, type_params, params, return_type,
                declared_effects, body, is_pub, span, none, none, none),
        Decl::Test { description, body, span } =>
            check_test_decl_arm_firebreak(ctx, description, body, span),
        Decl::Trait { name, type_params, methods, is_pub, span, .. } =>
            check_trait_decl_arm_firebreak(
                ctx, name, type_params, methods, is_pub, span),
        Decl::ExternFn { name, type_params, params, return_type, declared_effects, is_pub, span } =>
            check_extern_fn_decl_arm_firebreak(
                ctx, name, type_params, params,
                declared_effects, is_pub, span),
        Decl::ExternType { name, type_params, is_pub, span } =>
            checked_extern_type_decl_firebreak(
                name, type_params, is_pub, span),
        Decl::TypeAlias { name, is_pub, span, .. } =>
            check_type_alias_decl_arm_firebreak(ctx, name, is_pub, span),
        Decl::Const { name, type_annotation, init, is_pub, span } =>
            check_const_decl_arm_firebreak(
                ctx, name, type_annotation, init, is_pub, span),
        Decl::ModBlock { name, uses, decls, required_effects, is_pub, span } =>
            check_mod_decl(
                ctx, name, uses, decls, required_effects,
                is_pub, span, frame_decl_index),
        Decl::Sig { name, members, is_pub, span } =>
            check_sig_decl_arm_firebreak(ctx, name, members, is_pub, span),
        Decl::EffectAlias { name, is_pub, span, .. } =>
            checked_effect_alias_decl_firebreak(name, is_pub, span),
        Decl::Delegate { span, .. } =>
            // Delegate is only valid inside impl blocks; handled by check_impl_decl
            checked_placeholder_decl_firebreak("<delegate>", span),
        Decl::AssocType { span, .. } =>
            // Associated types are only valid inside trait/impl blocks; handled there
            checked_placeholder_decl_firebreak("<assoc_type>", span)
    }
}

fn check_indexed_decl_firebreak(
    mut ctx: InferCtx, decl: Decl, decl_index: Int
) -> HDecl {
    let checked_decl = decl
    let checked_decl_index = decl_index
    check_decl(ctx, checked_decl, some(checked_decl_index))
}

fn update_checked_fn_effects_firebreak(
    mut ctx: InferCtx, name: Str, effects: EffectRow
) {
    let checked_name = name
    let checked_effects = effects
    update_fn_effects(ctx.env, checked_name, checked_effects)
}

fn append_checked_hdecl_firebreak(
    mut hdecls: List<HDecl>, hdecl: HDecl
) {
    let checked_decl = hdecl
    hdecls.push(checked_decl)
}

fn resolve_checked_nominal_identity_firebreak(
    ctx: InferCtx, target_type: Str
) -> Str {
    let checked_target_type = target_type
    resolve_nominal_identity(ctx, checked_target_type)
}

fn expand_delegate_impls_firebreak(
    mut ctx: InferCtx, target_type: Str, type_params: List<TypeParam>,
    field: Str, trait_names: List<Str>, span: Span
) -> List<HDecl> {
    let checked_target_type = target_type
    let checked_type_params = type_params
    let checked_field = field
    let checked_trait_names = trait_names
    let checked_span = span
    expand_delegate_impls(
        ctx, checked_target_type, checked_type_params,
        checked_field, checked_trait_names, checked_span)
}

fn check_mod_decl_body(
    mut ctx: InferCtx, mod_name: Str, uses: List<UseDecl>,
    decls: List<Decl>, required_effects: List<EffectExpr>?,
    is_pub: Bool, span: Span, project_frame_active: Bool
) -> HDecl {
    // Register short-name aliases for mod-internal types so that
    // type annotations like `c: Circle` resolve to `shapes::Circle`.
    // These aliases remain in scope for the rest of the file, which
    // is acceptable because inline mods share the file scope.
    if !project_frame_active {
        insert_mod_aliases(ctx, mod_name, decls, false)
        // Resolve use declarations with relative paths (self::/super::)
        resolve_mod_uses(ctx, uses, true)
    }

    // Resolve required effects if present
    let mut cap_row: EffectRow? = none
    match required_effects {
        some(req_effs) => {
            cap_row = some(resolve_declared_effects(ctx, req_effs))
        },
        none => {}
    }

    // B-125: set mod_unsafe_allowed based on whether unsafe is in required effects
    match cap_row {
        some(cap) => {
            ctx.mod_unsafe_allowed = cap.effects.any(fn(e) {
                match e { Effect::UnsafeEffect => true, _ => false }
            })
        },
        none => {
            ctx.mod_unsafe_allowed = false
        }
    }

    let mut hdecls: List<HDecl> = []
    for decl_index in 0..decls.len() {
        let decl = decls.get(decl_index).unwrap()
        // Project extern types retain their foreign ABI identity. Registration
        // keeps only that raw source definition and the exact namespace frame
        // supplies its visible spelling; HIR must therefore use the same raw
        // identity. Single-file inline modules keep their legacy prefix.
        let prefixed = if project_frame_active {
            match decl {
                Decl::ExternType { .. } => decl,
                _ => prefix_decl_name(mod_name, decl)
            }
        } else {
            prefix_decl_name(mod_name, decl)
        }
        let result = some(check_indexed_decl_firebreak(
            ctx, prefixed, decl_index)) catch { _ => none }
        match result {
            some(hd) => {
                // Update fn effects (same as check_one_decl)
                match hd {
                    HDecl::Fn { name, effects, .. } => {
                        if effects.effects.len() > 0 {
                            update_checked_fn_effects_firebreak(
                                ctx, name, effects)
                        }
                    },
                    _ => {}
                }
                // Check capability restriction on function declarations
                match cap_row {
                    some(cap) => check_capability(ctx, hd, cap, span),
                    none => {}
                }
                append_checked_hdecl_firebreak(hdecls, hd)
            },
            none => {}
        }

        // Expand delegates inside mod-scoped impl blocks (same as check_one_decl)
        match prefixed {
            Decl::Impl { target_type, type_params: impl_tps, methods, span: impl_span, .. } => {
                let canonical_target = resolve_checked_nominal_identity_firebreak(
                    ctx, target_type)
                for m in methods {
                    match m {
                        Decl::Delegate { field, trait_names, span: dspan } => {
                            let delegate_impls = expand_delegate_impls_firebreak(
                                ctx, canonical_target, impl_tps,
                                field, trait_names, dspan)
                            for di in delegate_impls {
                                // Check capability on delegate-generated impls too
                                match cap_row {
                                    some(cap) => check_capability(ctx, di, cap, span),
                                    none => {}
                                }
                                append_checked_hdecl_firebreak(hdecls, di)
                            }
                        },
                        _ => {}
                    }
                }
            },
            _ => {}
        }
    }
    HDecl::ModBlock { name: mod_name, decls: hdecls, is_pub: is_pub, span: span }
}

fn check_mod_decl_body_firebreak(
    mut ctx: InferCtx, mod_name: Str, uses: List<UseDecl>,
    decls: List<Decl>, required_effects: List<EffectExpr>?,
    is_pub: Bool, span: Span, project_frame_active: Bool
) -> HDecl {
    let checked_mod_name = mod_name
    let checked_uses = uses
    let checked_decls = decls
    let checked_required_effects = required_effects
    let checked_span = span
    check_mod_decl_body(
        ctx, checked_mod_name, checked_uses, checked_decls,
        checked_required_effects, is_pub, checked_span,
        project_frame_active)
}

fn check_mod_decl(
    mut ctx: InferCtx, mod_name: Str, uses: List<UseDecl>,
    decls: List<Decl>, required_effects: List<EffectExpr>?,
    is_pub: Bool, span: Span, frame_decl_index: Int?
) -> HDecl {
    let project_active = ctx.project_namespace_file_key.is_some()
    let mut entered_project_frame = false
    if project_active {
        entered_project_frame = match frame_decl_index {
            some(decl_index) => enter_project_child_frame(ctx, decl_index),
            none => false
        }
        if !entered_project_frame {
            panic("unreachable: resolver plan missing inline check frame")
        }
    }

    // Keep self/super path state paired with the exact namespace frame.
    let segments = mod_name.split("::")
    let simple_name = segments.get(segments.len() - 1).unwrap_or(mod_name)
    ctx.mod_path_stack.push(simple_name)
    let prev_unsafe_allowed = ctx.mod_unsafe_allowed
    let result = check_mod_decl_body_firebreak(
        ctx, mod_name, uses, decls, required_effects,
        is_pub, span, project_active) catch { _ => {
            ctx.mod_unsafe_allowed = prev_unsafe_allowed
            let _ = ctx.mod_path_stack.pop()
            if entered_project_frame {
                let _ = exit_project_namespace_frame(ctx)
            }
            fail.raise(CompileError {})
        }
    }
    ctx.mod_unsafe_allowed = prev_unsafe_allowed
    let _ = ctx.mod_path_stack.pop()
    if entered_project_frame {
        let _ = exit_project_namespace_frame(ctx)
    }
    result
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
        let name_display = nominal_display_name(name)
        let kind_display = effect_to_string(eff)
        let in_cap = cap.effects.any(fn(c) {
            effects_match_kind_with_ownership(
                ctx.env.types.ownership_metadata, eff, c)
        })
        if !in_cap {
            let _ = type_error(ctx.sink, E0405,
                "'${name_display}' uses effect '${kind_display}' which is not in the module's requires set",
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

fn const_zonk_ctx_firebreak(ctx: InferCtx, subst: UnionFind) -> ZonkCtx {
    let zonk_subst = subst
    let zonk_dict_resolver = ctx
    let zonk_ownership_metadata = ctx.env.types.ownership_metadata
    ZonkCtx {
        subst: zonk_subst, names: map_new(),
        dict_resolver: some(zonk_dict_resolver),
        ownership_metadata: some(zonk_ownership_metadata),
        require_exact_ownership: false
    }
}

fn check_const_decl(mut ctx: InferCtx, name: Str, type_annotation: TypeExpr?, init: Expr, is_pub: Bool, span: Span) -> HDecl {
    let obligation_checkpoint = pending_dict_checkpoint(ctx)
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
    // Annotation constraints are final for this const owner.  Callable-value
    // shadows join the same assoc fixed point without publishing DictRefs.
    register_bounded_callable_value_shadows(
        ctx, init_r.hexpr, s)
    drain_pending_dicts(ctx, obligation_checkpoint, s)
    // A const initializer is a value position.  Resolve its fully unified
    // function-value evidence before restoring the declaration substitution;
    // otherwise a bounded module function reaches codegen without its DictRef.
    let zctx = const_zonk_ctx_firebreak(ctx, s)
    let resolved = zonk_type(zctx, init_ty)
    let zonked_init = some(zonk_expr(zctx, init_r.hexpr)) catch { _ => none }
    let final_init = match zonked_init {
        some(value) => value,
        none => {
            // Declaration-level recovery continues checking later declarations.
            // Never leak this const's isolated substitution through that path.
            rollback_pending_dicts(ctx, obligation_checkpoint)
            ctx.subst = saved_subst
            fail.raise(CompileError {})
        }
    }
    let gen_scheme = generalize(ctx.env, resolved, s)
    // Preserve the original def_id so mutability checks work
    let scheme_def_id = old_def_id
    let scheme = TypeScheme {
        ty: gen_scheme.ty, type_vars: gen_scheme.type_vars,
        bounds: gen_scheme.bounds, def_id: scheme_def_id
    }
    let rebind_name = name
    ctx.env.rebind(rebind_name, scheme)
    ctx.subst = saved_subst
    HDecl::Const { name: name, def_id: old_def_id, ty: resolved, init: final_init, is_pub: is_pub, span: span }
}

fn check_struct_decl(ctx: InferCtx, name: Str, type_params: List<TypeParam>, is_pub: Bool, span: Span) -> HDecl {
    let def = match ctx.env.types.structs.get(name) {
        some(d) => d,
        none => {
            let display = nominal_display_name(name)
            let _ = type_error(ctx.sink, E0204, "struct not found: ${display}", span,
                DiagnosticContext::OtherContext { detail: some("struct '${display}' was not registered") })
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
            let display = nominal_display_name(name)
            let _ = type_error(ctx.sink, E0204, "enum not found: ${display}", span,
                DiagnosticContext::OtherContext { detail: some("enum '${display}' was not registered") })
            fail.raise(CompileError {})
        }
    }
    let mut hvariants: List<HEnumVariant> = []
    for v in def.variants {
        hvariants.push(HEnumVariant { name: v.name, fields: v.fields, field_names: v.field_names })
    }
    HDecl::Enum { name: name, type_params: type_params, variants: hvariants, is_pub: is_pub, span: span }
}

fn append_effect_param_firebreak(
    mut op_params: List<HParam>, name: Str, ty: Type, def_id: Int
) {
    let param_name = name
    let param_type = ty
    let param_def_id = def_id
    op_params.push(HParam {
        name: param_name, ty: param_type, def_id: some(param_def_id),
        flags: hparam_flags(false, PARAM_OWNERSHIP_BORROW)
    })
}

fn check_effect_default_body_firebreak(
    mut ctx: InferCtx, body_expr: Expr, return_type: Type,
    span: Span, obligation_checkpoint: Int
) -> HExpr {
    let checked_body_expr = body_expr
    let body_result = infer_block(ctx, checked_body_expr, none)
    ctx.subst = body_result.subst
    let body_type = hexpr_type(body_result.hexpr)
    let checked_return_type = return_type
    ctx.subst = unify_at(
        ctx.sink, ctx.env, body_type,
        checked_return_type, ctx.subst, span)
    register_bounded_callable_value_shadows(
        ctx, body_result.hexpr, ctx.subst)
    drain_pending_dicts(ctx, obligation_checkpoint, ctx.subst)
    // Zonk only after the owner obligation transaction.
    let zonk_subst = ctx.subst
    let zonk_dict_resolver = ctx
    let zonk_ownership_metadata = ctx.env.types.ownership_metadata
    let zctx = ZonkCtx {
        subst: zonk_subst, names: map_new(),
        dict_resolver: some(zonk_dict_resolver),
        ownership_metadata: some(zonk_ownership_metadata),
        require_exact_ownership: false
    }
    let zonk_body = body_result.hexpr
    zonk_block(zctx, zonk_body)
}

fn checked_effect_default_body_result_firebreak(
    checked_body: HExpr
) -> HExpr? {
    let default_body = checked_body
    some(default_body)
}

fn append_effect_dependency_firebreak(
    mut dep_set: Set<Str>, mut deps: List<Str>, dependency: Str
) {
    let set_dependency = dependency
    dep_set.insert(set_dependency)
    let list_dependency = dependency
    deps.push(list_dependency)
}

fn store_effect_default_dependencies_firebreak(
    mut ctx: InferCtx, name: Str, deps: List<Str>
) {
    let dependency_owner = name
    let stored_dependencies = deps
    ctx.effect_default_deps.insert(dependency_owner, stored_dependencies)
}

fn check_effect_decl(mut ctx: InferCtx, name: Str, type_params: List<TypeParam>, ast_ops: List<EffectOpDecl>, is_pub: Bool, span: Span) -> HDecl {
    let def = match ctx.env.types.effects.get(name) {
        some(d) => d,
        none => {
            let display = nominal_display_name(name)
            let _ = type_error(ctx.sink, E0402, "effect not found: ${display}", span,
                DiagnosticContext::OtherContext { detail: some("effect '${display}' was not registered") })
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
            let p_def_id = ctx.env.fresh_def_id()
            append_effect_param_firebreak(
                op_params, p_name, pt, p_def_id)
            pi = pi + 1
        }
        // Type-check default body if present
        let ast_op_opt = ast_ops.get(oi)
        let mut default_body: HExpr? = none
        match ast_op_opt {
            some(ast_op) => match ast_op.body {
                some(body_expr) => {
                    let obligation_checkpoint = pending_dict_checkpoint(ctx)
                    // Bind op params in a new scope for type checking the default body
                    ctx.env.push_scope()
                    for p in op_params {
                        let param_def_id = match p.def_id {
                            some(id) => id,
                            none => panic(
                                "unreachable: effect parameter has no exact DefId")
                        }
                        ctx.env.bind(p.name, TypeScheme {
                            ty: p.ty, type_vars: [], bounds: [],
                            def_id: some(param_def_id)
                        })
                    }
                    let checked_default = some(
                        check_effect_default_body_firebreak(
                            ctx, body_expr, op.return_type,
                            span, obligation_checkpoint)) catch { _ => none }
                    let _ = ctx.env.pop_scope()
                    match checked_default {
                        some(checked_body) => {
                            assert_pending_dict_owner_closed(
                                ctx, obligation_checkpoint)
                            default_body =
                                checked_effect_default_body_result_firebreak(
                                    checked_body)
                        },
                        none => {
                            rollback_pending_dicts(
                                ctx, obligation_checkpoint)
                            fail.raise(CompileError {})
                        }
                    }
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
                                    let effect_display = nominal_display_name(name)
                                    let dep_display = nominal_display_name(eff_name)
                                    let _ = type_error(ctx.sink, E0409,
                                        "Default handler body of effect '${effect_display}' uses effect '${dep_display}' which has no default handler; all-default effects cannot depend on effects without defaults",
                                        span,
                                        DiagnosticContext::OtherContext { detail: some("default effect dependency violation") })
                                } else {
                                    if !dep_set.contains(eff_name) {
                                        append_effect_dependency_firebreak(
                                            dep_set, deps, eff_name)
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
            store_effect_default_dependencies_firebreak(ctx, name, deps)
        }
    }

    HDecl::Effect { name: name, type_params: type_params, ops: hops, is_pub: is_pub, span: span }
}

fn registered_type_scheme_result_firebreak(value: TypeScheme) -> TypeScheme {
    let registered_scheme = value
    registered_scheme
}

fn registered_impl_method_scheme(
    ctx: InferCtx, target_type: Str, trait_name: Str?,
    origin: Str, method_name: Str
) -> TypeScheme {
    let scheme = match trait_name {
        some(_) => match find_impl_by_origin(
            ctx.env.trait_reg, target_type, origin) {
            some(entry) => entry.method_schemes.get(method_name),
            none => none
        },
        none => match ctx.env.trait_reg.method_origins.get(target_type) {
            some(origins) => match origins.get(method_name) {
                some(method_origin_) => {
                    if method_origin_.origin == origin {
                        match ctx.env.trait_reg.impl_methods.get(target_type) {
                            some(methods) => methods.get(method_name),
                            none => none
                        }
                    } else { none }
                },
                none => none
            },
            none => none
        }
    }
    match scheme {
        some(value) => registered_type_scheme_result_firebreak(value),
        none => panic(
            "unreachable: impl callable registration is missing for '${method_name}'")
    }
}

fn insert_registered_impl_scheme_firebreak(
    mut method_schemes: Map<Str, TypeScheme>,
    method_name: Str, scheme: TypeScheme
) {
    let stored_method_name = method_name
    let stored_scheme = scheme
    method_schemes.insert(stored_method_name, stored_scheme)
}

fn method_origin_firebreak(
    ctx: InferCtx, origin: Str, trait_name: Str?, span: Span
) -> MethodOrigin {
    let stored_origin = origin
    let stored_trait_name = trait_name
    let authority_trait_name = trait_name
    let stored_span = span
    MethodOrigin {
        origin: stored_origin, trait_name: stored_trait_name,
        is_authoritative_drop: trait_is_authoritative_drop(
            ctx.env.trait_reg, authority_trait_name),
        span: stored_span
    }
}

fn store_rebound_impl_method_scheme(
    mut ctx: InferCtx, target_type: Str, trait_name: Str?,
    origin: Str, method_name: Str, scheme: TypeScheme, span: Span
) {
    match trait_name {
        some(_) => match find_impl_by_origin(
            ctx.env.trait_reg, target_type, origin) {
            some(entry) => insert_registered_impl_scheme_firebreak(
                entry.method_schemes, method_name, scheme),
            none => {}
        },
        none => {}
    }

    let installed_method_name = method_name
    let installed_scheme = scheme
    let installed_origin = method_origin_firebreak(
        ctx, origin, trait_name, span)
    let _ = install_method_scheme(
        ctx.env.trait_reg, ctx.sink,
        target_type, installed_method_name, installed_scheme,
        installed_origin)
}

fn check_impl_decl_with_trait_firebreak(
    mut ctx: InferCtx, target_type: Str, type_params: List<TypeParam>,
    trait_name: Str, methods: List<Decl>, span: Span
) -> HDecl {
    let checked_trait_name = trait_name
    let canonical_trait = resolve_trait_identity(ctx, checked_trait_name)
    let checked_target_type = target_type
    let checked_type_params = type_params
    let checked_methods = methods
    let checked_span = span
    check_impl_decl_canonical(
        ctx, checked_target_type, checked_type_params,
        some(canonical_trait), checked_methods, checked_span)
}

fn check_inherent_impl_decl_firebreak(
    mut ctx: InferCtx, target_type: Str, type_params: List<TypeParam>,
    methods: List<Decl>, span: Span
) -> HDecl {
    let checked_target_type = target_type
    let checked_type_params = type_params
    let checked_methods = methods
    let checked_span = span
    check_impl_decl_canonical(
        ctx, checked_target_type, checked_type_params,
        none, checked_methods, checked_span)
}

fn check_impl_decl(mut ctx: InferCtx, target_type: Str, type_params: List<TypeParam>, trait_name: Str?, methods: List<Decl>, span: Span) -> HDecl {
    let canonical_target = resolve_nominal_identity(ctx, target_type)
    match trait_name {
        some(name) => check_impl_decl_with_trait_firebreak(
            ctx, canonical_target, type_params, name, methods, span),
        none => check_inherent_impl_decl_firebreak(
            ctx, canonical_target, type_params, methods, span)
    }
}

fn is_authoritative_drop_trait(ctx: InferCtx, trait_name: Str?) -> Bool {
    trait_is_authoritative_drop(ctx.env.trait_reg, trait_name)
}

fn marked_external_self_param_firebreak(self_param: HParam) -> HParam {
    let checked_self_param = self_param
    hparam_mark_external_drop_owner(checked_self_param)
}

fn rebuild_external_drop_method_firebreak(
    name: Str, def_id: Int?, type_params: List<TypeParam>,
    params: List<HParam>, return_type: Type, effects: EffectRow,
    body: HExpr, is_pub: Bool, trait_bounds: List<TraitBound>, span: Span
) -> HDecl {
    let checked_name = name
    let checked_def_id = def_id
    let checked_type_params = type_params
    let checked_params = params
    let checked_return_type = return_type
    let checked_effects = effects
    let checked_body = body
    let checked_trait_bounds = trait_bounds
    let checked_span = span
    HDecl::Fn {
        name: checked_name, def_id: checked_def_id,
        type_params: checked_type_params, params: checked_params,
        return_type: checked_return_type, effects: checked_effects,
        body: checked_body, is_pub: is_pub,
        trait_bounds: checked_trait_bounds, span: checked_span
    }
}

fn mark_external_drop_owner_on_method(method: HDecl) -> HDecl {
    match method {
        HDecl::Fn { name, def_id, type_params, params, return_type,
                    effects, body, is_pub, trait_bounds, span } => {
            let mut marked_params = params
            match marked_params.get(0) {
                some(self_param) => marked_params.set(0,
                    marked_external_self_param_firebreak(self_param)),
                none => {}
            }
            rebuild_external_drop_method_firebreak(
                name, def_id, type_params, marked_params,
                return_type, effects, body, is_pub, trait_bounds, span)
        },
        _ => method
    }
}

fn is_authoritative_drop_trait_firebreak(
    ctx: InferCtx, trait_name: Str?
) -> Bool {
    let checked_trait_name = trait_name
    is_authoritative_drop_trait(ctx, checked_trait_name)
}

fn method_name_result_firebreak(name: Str) -> Str? {
    let checked_name = name
    some(checked_name)
}

fn append_external_drop_method_firebreak(
    mut result: List<HDecl>, method: HDecl
) {
    let checked_method = method
    result.push(mark_external_drop_owner_on_method(checked_method))
}

fn append_unmodified_method_firebreak(
    mut result: List<HDecl>, method: HDecl
) {
    let checked_method = method
    result.push(checked_method)
}

fn mark_authoritative_drop_self_params(
    ctx: InferCtx, trait_name: Str?, methods: List<HDecl>
) -> List<HDecl> {
    if !is_authoritative_drop_trait_firebreak(ctx, trait_name) {
        return methods
    }
    let trait_def = match trait_name {
        some(name) => match ctx.env.trait_reg.traits.get(name) {
            some(def) => def,
            none => return methods
        },
        none => return methods
    }
    let mut result: List<HDecl> = []
    for method in methods {
        let method_name = match method {
            HDecl::Fn { name, .. } => method_name_result_firebreak(name),
            _ => none
        }
        let mut is_drop_slot = false
        match method_name {
            some(name) => {
                for trait_method in trait_def.methods {
                    if trait_method.name == name { is_drop_slot = true }
                }
            },
            none => {}
        }
        if is_drop_slot {
            append_external_drop_method_firebreak(result, method)
        } else {
            append_unmodified_method_firebreak(result, method)
        }
    }
    result
}

fn append_impl_type_param_firebreak(
    mut impl_tp_types: List<Type>, type_param: Type
) {
    let current_type_param = type_param
    impl_tp_types.push(current_type_param)
}

fn insert_impl_self_scope_firebreak(
    mut ctx: InferCtx, self_type: Type
) {
    let scoped_self_type = self_type
    ctx.type_param_scope.insert("Self", scoped_self_type)
}

fn append_impl_bound_firebreak(
    mut impl_bounds: List<FnBoundsEntry>, type_param_var_id: Int,
    trait_name: Str, type_param_name: Str
) {
    let current_type_param_var_id = type_param_var_id
    let current_trait_name = trait_name
    let current_type_param_name = type_param_name
    impl_bounds.push(FnBoundsEntry {
        type_param_var_id: current_type_param_var_id,
        trait_name: current_trait_name,
        type_param_name: current_type_param_name
    })
}

fn append_impl_assoc_type_firebreak(
    mut assoc_types: List<HAssocType>, assoc_name: Str,
    bounds: List<Str>, concrete: Type?
) {
    let current_assoc_name = assoc_name
    let current_bounds = bounds
    let current_concrete = concrete
    assoc_types.push(HAssocType {
        name: current_assoc_name,
        bounds: current_bounds,
        concrete: current_concrete
    })
}

fn bind_impl_assoc_type_firebreak(
    mut ctx: InferCtx, assoc_name: Str, concrete: Type
) {
    let bare_assoc_name = assoc_name
    let qualified_assoc_name = assoc_name
    let bare_concrete = concrete
    let qualified_concrete = concrete
    ctx.type_param_scope.insert(bare_assoc_name, bare_concrete)
    ctx.qualified_assoc_scope.insert(
        "Self::${qualified_assoc_name}", qualified_concrete)
}

fn record_impl_fn_firebreak(
    mut impl_fn_names: Set<Str>, mut impl_fn_map: Map<Str, Decl>,
    name: Str, method: Decl
) {
    let set_name = name
    let map_name = name
    let stored_method = method
    impl_fn_names.insert(set_name)
    impl_fn_map.insert(map_name, stored_method)
}

fn append_impl_callee_firebreak(
    mut sorted_callees: List<Str>, callee: Str
) {
    let current_callee = callee
    sorted_callees.push(current_callee)
}

fn record_impl_call_graph_firebreak(
    mut impl_call_graph: Map<Str, List<Str>>, name: Str,
    sorted_callees: List<Str>
) {
    let current_name = name
    let current_callees = sorted_callees
    impl_call_graph.insert(current_name, current_callees)
}

fn record_ordered_impl_method_firebreak(
    mut ordered_methods: List<Decl>, mut ordered_fn_names: Set<Str>,
    decl: Decl, name: Str
) {
    let current_decl = decl
    let current_name = name
    ordered_methods.push(current_decl)
    ordered_fn_names.insert(current_name)
}

fn append_non_fn_impl_method_firebreak(
    mut ordered_methods: List<Decl>, method: Decl
) {
    let current_method = method
    ordered_methods.push(current_method)
}

fn registered_impl_method_scheme_firebreak(
    ctx: InferCtx, target_type: Str, trait_name: Str?,
    origin: Str, method_name: Str
) -> TypeScheme {
    let current_target_type = target_type
    let current_trait_name = trait_name
    let current_origin = origin
    let current_method_name = method_name
    registered_impl_method_scheme(
        ctx, current_target_type, current_trait_name,
        current_origin, current_method_name)
}

fn check_impl_extern_method_firebreak(
    mut ctx: InferCtx, name: Str, type_params: List<TypeParam>,
    params: List<Param>, declared_effects: List<EffectExpr>?,
    is_pub: Bool, span: Span, registration_scheme: TypeScheme
) -> HDecl {
    let current_name = name
    let current_type_params = type_params
    let current_params = params
    let current_declared_effects = declared_effects
    let current_span = span
    let current_registration_scheme = registration_scheme
    check_extern_fn_decl(
        ctx, current_name, current_type_params, current_params,
        current_declared_effects, is_pub, current_span,
        some(current_registration_scheme))
}

fn check_impl_fn_method_firebreak(
    mut ctx: InferCtx, name: Str, type_params: List<TypeParam>,
    params: List<Param>, return_type: TypeExpr?,
    declared_effects: List<EffectExpr>?, body: Expr,
    is_pub: Bool, span: Span, self_type: Type,
    registration_scheme: TypeScheme, rebind_identity: Str
) -> HDecl {
    let current_name = name
    let current_type_params = type_params
    let current_params = params
    let current_return_type = return_type
    let current_declared_effects = declared_effects
    let current_body = body
    let current_span = span
    let current_self_type = self_type
    let current_registration_scheme = registration_scheme
    let current_rebind_identity = rebind_identity
    check_fn_decl(
        ctx, current_name, current_type_params, current_params,
        current_return_type, current_declared_effects, current_body,
        is_pub, current_span, some(current_self_type),
        some(current_registration_scheme), some(current_rebind_identity))
}

fn insert_impl_fn_mut_flags_firebreak(
    mut ctx: InferCtx, qualified_key: Str, flags: List<Bool>
) {
    let current_qualified_key = qualified_key
    let current_flags = flags
    ctx.fn_mut_params.insert(current_qualified_key, current_flags)
}

fn store_rebound_impl_method_scheme_firebreak(
    mut ctx: InferCtx, target_type: Str, trait_name: Str?,
    origin: Str, method_name: Str, scheme: TypeScheme, span: Span
) {
    let current_target_type = target_type
    let current_trait_name = trait_name
    let current_origin = origin
    let current_method_name = method_name
    let current_scheme = scheme
    let current_span = span
    store_rebound_impl_method_scheme(
        ctx, current_target_type, current_trait_name, current_origin,
        current_method_name, current_scheme, current_span)
}

fn impl_trait_name_view_firebreak(trait_name: Str?) -> Str? {
    let current_trait_name = trait_name
    current_trait_name
}

fn check_impl_decl_canonical(mut ctx: InferCtx, target_type: Str, type_params: List<TypeParam>, trait_name: Str?, methods: List<Decl>, span: Span) -> HDecl {
    let trait_name_for_drop_check =
        impl_trait_name_view_firebreak(trait_name)
    let trait_name_for_recovery =
        impl_trait_name_view_firebreak(trait_name)
    let trait_name_for_origin =
        impl_trait_name_view_firebreak(trait_name)
    let trait_name_for_extern_registration =
        impl_trait_name_view_firebreak(trait_name)
    let trait_name_for_fn_registration =
        impl_trait_name_view_firebreak(trait_name)
    let trait_name_for_rebound_store =
        impl_trait_name_view_firebreak(trait_name)
    let trait_name_for_drop_marking =
        impl_trait_name_view_firebreak(trait_name)
    let trait_name_for_validation =
        impl_trait_name_view_firebreak(trait_name)
    let trait_name_for_result =
        impl_trait_name_view_firebreak(trait_name)
    let is_authoritative_drop = is_authoritative_drop_trait(
        ctx, trait_name_for_drop_check)
    // Registration already reports E0801 for this recovery path and
    // deliberately publishes neither an ImplEntry nor method origins.  Do
    // not try to retrieve those absent schemes during body checking.
    if is_authoritative_drop &&
       (!direct_drop_target_has_codegen_glue(ctx, target_type) ||
        first_impl_trait_bound_span(type_params).is_some()) {
        return HDecl::Impl {
            target_type: target_type, type_params: type_params,
            trait_name: trait_name_for_recovery,
            methods: [], assoc_types: [], span: span
        }
    }
    let origin = impl_decl_origin(
        target_type, trait_name_for_origin, type_params, span)
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
                some(tv) => append_impl_type_param_firebreak(
                    impl_tp_types, tv),
                none => impl_tp_types.push(ctx.env.fresh_var())
            }
        }
        match ctx.env.types.structs.get(target_type) {
            some(def) => Type::StructType { name: def.name, type_params: impl_tp_types },
            none => match ctx.env.types.enums.get(target_type) {
                some(def) => Type::EnumType { name: def.name, type_params: impl_tp_types },
                none => resolve_self_type(ctx, target_type)
            }
        }
    } else {
        resolve_self_type(ctx, target_type)
    }

    // Inject Self into type_param_scope so Self::Item resolves in impl methods
    insert_impl_self_scope_firebreak(ctx, impl_self_type)

    let saved_impl_bounds = ctx.current_fn_bounds
    let mut impl_bounds: List<FnBoundsEntry> = []
    for tp in type_params {
        match ctx.type_param_scope.get(tp.name) {
            some(tv) => match tv {
                Type::TypeVar { id, .. } => {
                    for bound in tp.bounds {
                        let bound_trait = resolve_trait_identity(ctx, bound.trait_name)
                        append_impl_bound_firebreak(
                            impl_bounds, id, bound_trait, tp.name)
                        // Expand supertrait bounds
                        let supers = collect_all_supertraits(ctx, bound_trait)
                        for st_name in supers {
                            append_impl_bound_firebreak(
                                impl_bounds, id, st_name, tp.name)
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
                for b in abounds { bound_names.push(resolve_trait_identity(ctx, b.trait_name)) }
                let concrete = match avalue {
                    some(v) => some(resolve_type_expr(ctx, v)),
                    none => none
                }
                append_impl_assoc_type_firebreak(
                    hassoc_types, aname, bound_names, concrete)
                // Inject concrete type into type_param_scope for method signature resolution
                match concrete {
                    some(ct) => {
                        bind_impl_assoc_type_firebreak(ctx, aname, ct)
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
                record_impl_fn_firebreak(
                    impl_fn_names, impl_fn_map, name, method)
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
                    if c != name {
                        append_impl_callee_firebreak(sorted_callees, c)
                    }
                }
                sorted_callees.sort()
                record_impl_call_graph_firebreak(
                    impl_call_graph, name, sorted_callees)
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
                        record_ordered_impl_method_firebreak(
                            ordered_methods, ordered_fn_names, decl, name)
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
            _ => append_non_fn_impl_method_firebreak(
                ordered_methods, method)
        }
    }

    let mut hmethods: List<HDecl> = []
    for method in ordered_methods {
        match method {
            Decl::ExternFn { name, type_params: mtps, params, return_type, declared_effects, is_pub, span: mspan } => {
                let registration_scheme = registered_impl_method_scheme_firebreak(
                    ctx, target_type, trait_name_for_extern_registration,
                    origin, name)
                hmethods.push(check_impl_extern_method_firebreak(
                    ctx, name, mtps, params, declared_effects,
                    is_pub, mspan, registration_scheme))
            },
            Decl::Fn { name, type_params: mtps, params, return_type, declared_effects, body, is_pub, span: mspan, .. } => {
                let registration_scheme = registered_impl_method_scheme_firebreak(
                    ctx, target_type, trait_name_for_fn_registration,
                    origin, name)
                let rebind_identity = impl_method_origin(origin, name)
                let hdecl = check_impl_fn_method_firebreak(
                    ctx, name, mtps, params, return_type, declared_effects,
                    body, is_pub, mspan, impl_self_type,
                    registration_scheme, rebind_identity)
                // #210: Also register fn_mut_params with qualified key for cross-module export.
                // check_fn_decl inserts with unqualified `name`; exports.ring looks up
                // with "${target_type}_${mname}", so we mirror that key here.
                let qual_key = "${target_type}_${name}"
                match ctx.fn_mut_params.get(name) {
                    some(flags) => insert_impl_fn_mut_flags_firebreak(
                        ctx, qual_key, flags),
                    none => {}
                }
                match hdecl {
                    HDecl::Fn {
                        name: mname, params: mparams,
                        return_type: mret, effects: meffects,
                        span: checked_span, ..
                    } => {
                        let rebound = rebind_checked_fn_scheme(
                            ctx, rebind_identity, registration_scheme,
                            mparams, mret, meffects, checked_span)
                        store_rebound_impl_method_scheme_firebreak(
                            ctx, target_type, trait_name_for_rebound_store,
                            origin,
                            mname, rebound, checked_span)
                    },
                    _ => {}
                }
                hmethods.push(hdecl)
            },
            Decl::Delegate { .. } => {},  // Handled at check_one_decl level
            Decl::AssocType { .. } => {},  // Already handled above
            _ => {}
        }
    }

    // B-002p1: impl Drop validation
    if is_authoritative_drop {
        let drop_trait_name = trait_name_for_drop_marking
        hmethods = mark_authoritative_drop_self_params(
            ctx, drop_trait_name, hmethods)
    }
    match trait_name_for_validation {
        some(tn) => {
            if is_authoritative_drop {
                // Drop + Clone conflict: a Drop type cannot also impl Clone
                let mut has_authoritative_clone = false
                match (
                    ctx.env.trait_reg.authoritative_clone_def_id,
                    ctx.env.trait_reg.trait_impls.get(target_type)) {
                    (some(clone_def_id), some(impls)) => {
                        for impl_ in impls {
                            match ctx.env.trait_reg.traits.get(
                                    impl_.trait_name) {
                                some(trait_def) => if trait_def.def_id ==
                                        clone_def_id {
                                    has_authoritative_clone = true
                                },
                                none => {}
                            }
                        }
                    },
                    _ => {}
                }
                if has_authoritative_clone {
                    let target_display = nominal_display_name(target_type)
                    let _ = type_error(ctx.sink, E0802,
                        "type '${target_display}' cannot implement both Drop and Clone",
                        span, DiagnosticContext::TraitError { detail: "Drop and Clone are mutually exclusive" })
                }
                // Drop method must not have fail effect
                for hm in hmethods {
                    match hm {
                        HDecl::Fn { name: mname, effects: meff, span: mspan, .. } => {
                            if mname == "drop" {
                                for eff in meff.effects {
                                    match eff {
                                        Effect::FailEffect { .. } => {
                                            let _ = type_error(ctx.sink, E0803,
                                                "Drop::drop must not have fail effect",
                                                mspan, DiagnosticContext::TraitError { detail: "drop must not fail" })
                                        },
                                        _ => {}
                                    }
                                }
                            }
                        },
                        _ => {}
                    }
                }
            }
            // Reverse check: Clone impl on a Drop type
            let is_authoritative_clone = match (
                ctx.env.trait_reg.authoritative_clone_def_id,
                ctx.env.trait_reg.traits.get(tn)) {
                (some(clone_def_id), some(trait_def)) =>
                    trait_def.def_id == clone_def_id,
                _ => false
            }
            if is_authoritative_clone {
                if type_may_own(
                        ctx.env.types.ownership_metadata, impl_self_type) {
                    let target_display = nominal_display_name(target_type)
                    let _ = type_error(ctx.sink, E0802,
                        "owner-bearing type '${target_display}' cannot implement Clone",
                        span, DiagnosticContext::TraitError { detail: "Clone cannot duplicate a direct or transitively contained Drop value" })
                }
            }
        },
        none => {}
    }

    ctx.current_fn_bounds = saved_impl_bounds
    ctx.type_param_scope = saved_tp_scope
    ctx.qualified_assoc_scope = saved_qualified_assoc
    HDecl::Impl { target_type: target_type, type_params: type_params,
        trait_name: trait_name_for_result, methods: hmethods,
        assoc_types: hassoc_types, span: span }
}

fn append_delegate_impl_type_param_firebreak(
    mut impl_tp_types: List<Type>, type_param: Type
) {
    let current_type_param = type_param
    impl_tp_types.push(current_type_param)
}

fn resolve_delegate_trait_identity_firebreak(
    ctx: InferCtx, trait_name: Str
) -> Str {
    let current_trait_name = trait_name
    resolve_trait_identity(ctx, current_trait_name)
}

fn collect_delegate_supertraits_firebreak(
    ctx: InferCtx, trait_name: Str
) -> List<Str> {
    let current_trait_name = trait_name
    collect_all_supertraits(ctx, current_trait_name)
}

fn delegate_trait_is_authoritative_drop_firebreak(
    ctx: InferCtx, trait_name: Str
) -> Bool {
    let current_trait_name = trait_name
    is_authoritative_drop_trait(ctx, some(current_trait_name))
}

fn append_delegate_trait_firebreak(
    mut all_traits: List<Str>, trait_name: Str
) {
    let current_trait_name = trait_name
    all_traits.push(current_trait_name)
}

fn some_delegate_nominal_name_firebreak(name: Str) -> Str? {
    let current_name = name
    some(current_name)
}

fn delegate_nominal_name_leaf_firebreak(name: Str) -> Str {
    let current_name = name
    current_name
}

fn delegate_nominal_type_name_firebreak(ty: Type) -> Str? {
    let current_type = ty
    match current_type {
        Type::StructType { name, .. } =>
            some_delegate_nominal_name_firebreak(name),
        Type::EnumType { name, .. } =>
            some_delegate_nominal_name_firebreak(name),
        _ => none
    }
}

fn delegate_nominal_type_name_or_empty_firebreak(ty: Type) -> Str {
    let current_type = ty
    match current_type {
        Type::StructType { name, .. } =>
            delegate_nominal_name_leaf_firebreak(name),
        Type::EnumType { name, .. } =>
            delegate_nominal_name_leaf_firebreak(name),
        _ => ""
    }
}

fn insert_delegate_field_var_firebreak(
    mut field_var_map: Map<Int, Type>, source_id: Int, mapped: Type
) {
    let current_source_id = source_id
    let current_mapped = mapped
    field_var_map.insert(current_source_id, current_mapped)
}

fn append_delegate_bounds_firebreak(
    mut generated_trait_bounds: List<TraitBound>,
    mut generated_fn_bounds: List<FnBoundsEntry>,
    type_param_name: Str, type_param_var_id: Int, trait_name: Str
) {
    let trait_bound_type_param = type_param_name
    let trait_bound_trait_name = trait_name
    generated_trait_bounds.push(TraitBound {
        type_param: trait_bound_type_param,
        trait_name: trait_bound_trait_name
    })
    let fn_bound_type_param_name = type_param_name
    let fn_bound_trait_name = trait_name
    generated_fn_bounds.push(FnBoundsEntry {
        type_param_var_id: type_param_var_id,
        trait_name: fn_bound_trait_name,
        type_param_name: fn_bound_type_param_name
    })
}

fn insert_delegate_assoc_type_firebreak(
    mut field_assoc_map: Map<Str, Type>, assoc_name: Str,
    field_var_map: Map<Int, Type>, assoc_type: Type
) {
    let current_assoc_name = assoc_name
    let current_field_var_map = field_var_map
    let current_assoc_type = assoc_type
    field_assoc_map.insert(
        current_assoc_name,
        apply_subst_map(current_field_var_map, current_assoc_type))
}

fn append_delegate_self_param_firebreak(
    mut hparams: List<HParam>, self_type: Type, def_id: Int,
    is_mutable: Bool, ownership_metadata: OwnershipMetadata,
    method_ownership: Int
) {
    let current_self_type = self_type
    let current_def_id = def_id
    hparams.push(HParam {
        name: "self", ty: current_self_type,
        def_id: some(current_def_id),
        flags: hparam_flags(is_mutable, callable_param_ownership(
            ownership_metadata, method_ownership, 0))
    })
}

fn delegate_types_are_same_var_firebreak(left: Type, right: Type) -> Bool {
    let current_left = left
    let current_right = right
    match (current_left, current_right) {
        (Type::TypeVar { id: a, .. }, Type::TypeVar { id: b, .. }) => a == b,
        _ => false
    }
}

fn delegate_param_type_firebreak(
    is_self_typed: Bool, self_type: Type, resolved_type: Type
) -> Type {
    let current_self_type = self_type
    let current_resolved_type = resolved_type
    if is_self_typed { current_self_type } else { current_resolved_type }
}

fn append_delegate_param_firebreak(
    mut hparams: List<HParam>, name: Str, ty: Type, def_id: Int,
    is_mutable: Bool, ownership_metadata: OwnershipMetadata,
    method_ownership: Int, param_index: Int
) {
    let current_name = name
    let current_type = ty
    let current_def_id = def_id
    hparams.push(HParam {
        name: current_name, ty: current_type,
        def_id: some(current_def_id),
        flags: hparam_flags(is_mutable, callable_param_ownership(
            ownership_metadata, method_ownership, param_index))
    })
}

fn append_delegate_self_forward_arg_firebreak(
    mut forward_args: List<HExpr>, name: Str, def_id: Int,
    self_type: Type, field: Str, field_type: Type, span: Span
) {
    let ident_name = name
    let ident_def_id = def_id
    let ident_type = self_type
    let ident_span = span
    let arg_ident = HExpr::Ident {
        name: ident_name, resolved_name: none,
        def_id: some(ident_def_id), dict_closure_dicts: none,
        ty: ident_type, effects: EMPTY_ROW, span: ident_span
    }
    let access_field = field
    let access_type = field_type
    let access_span = span
    forward_args.push(HExpr::FieldAccess {
        receiver: arg_ident, field: access_field, ty: access_type,
        effects: EMPTY_ROW, span: access_span
    })
}

fn append_delegate_forward_arg_firebreak(
    mut forward_args: List<HExpr>, name: Str, def_id: Int,
    ty: Type, span: Span
) {
    let current_name = name
    let current_def_id = def_id
    let current_type = ty
    let current_span = span
    forward_args.push(HExpr::Ident {
        name: current_name, resolved_name: none,
        def_id: some(current_def_id), dict_closure_dicts: none,
        ty: current_type, effects: EMPTY_ROW, span: current_span
    })
}

fn build_delegate_field_access_firebreak(
    def_id: Int, self_type: Type, field: Str, field_type: Type, span: Span
) -> HExpr {
    let ident_def_id = def_id
    let ident_type = self_type
    let ident_span = span
    let receiver = HExpr::Ident {
        name: "self", resolved_name: none,
        def_id: some(ident_def_id), dict_closure_dicts: none,
        ty: ident_type, effects: EMPTY_ROW, span: ident_span
    }
    let access_field = field
    let access_type = field_type
    let access_span = span
    HExpr::FieldAccess {
        receiver: receiver, field: access_field, ty: access_type,
        effects: EMPTY_ROW, span: access_span
    }
}

fn delegate_method_def_id_result_firebreak(method_def_id: Int) -> Int? {
    let exact_method_def_id = method_def_id
    some(exact_method_def_id)
}

fn finish_delegate_dict_call_firebreak(
    mut ctx: InferCtx, dict_name: Str, method_name: Str,
    method_def_id: Int, method_type: Type,
    field_access: HExpr, forward_args: List<HExpr>,
    return_type: Type, effects: EffectRow, span: Span
) -> HExpr {
    let mut dict_args: List<HExpr> = []
    let current_field_access = field_access
    let current_forward_args = forward_args
    dict_args.push(current_field_access)
    dict_args.extend(current_forward_args)
    let callee_name = dict_name
    let callee_type = method_type
    let callee_span = span
    let callee = HExpr::Ident {
        name: callee_name, resolved_name: none, def_id: none,
        dict_closure_dicts: none,
        ty: callee_type, effects: EMPTY_ROW, span: callee_span
    }
    let result_type_for_def_id = return_type
    let callable_result_def_id =
        fresh_call_result_callable_def_id(ctx, result_type_for_def_id)
    let dispatch_dict_name = dict_name
    let dispatch_method_name = method_name
    let call_return_type = return_type
    let call_effects = effects
    let call_span = span
    HExpr::Call {
        callee: callee,
        callee_def_id: delegate_method_def_id_result_firebreak(method_def_id),
        callable_result_def_id: callable_result_def_id,
        args: dict_args, type_args: [], resolved_dicts: [],
        dict_dispatch: some(DictDispatchInfo {
            dict_param: dispatch_dict_name, method: dispatch_method_name
        }),
        ty: call_return_type, effects: call_effects, span: call_span
    }
}

fn build_delegate_dict_call_firebreak(
    mut ctx: InferCtx, field_type: Type, trait_name: Str,
    method_name: Str, method_def_id: Int, method_type: Type,
    field_access: HExpr, forward_args: List<HExpr>,
    return_type: Type, effects: EffectRow, span: Span
) -> HExpr {
    let field_type_name =
        delegate_nominal_type_name_or_empty_firebreak(field_type)
    let current_trait_name = trait_name
    let dict_name = trait_dict_name(field_type_name, current_trait_name)
    finish_delegate_dict_call_firebreak(
        ctx, dict_name, method_name, method_def_id, method_type,
        field_access, forward_args, return_type, effects, span)
}

fn delegate_field_method_def_id_firebreak(
    field_method_scheme: TypeScheme?, trait_method_def_id: Int
) -> Int? {
    match field_method_scheme {
        some(scheme) => scheme.def_id,
        none => delegate_method_def_id_result_firebreak(trait_method_def_id)
    }
}

fn build_delegate_ufcs_call_firebreak(
    mut ctx: InferCtx, field_method_scheme: TypeScheme?,
    field_var_map: Map<Int, Type>,
    generated_fn_bounds: List<FnBoundsEntry>,
    field_access: HExpr, forward_args: List<HExpr>,
    method_name: Str, method_def_id: Int, method_type: Type,
    return_type: Type, effects: EffectRow, span: Span
) -> HExpr {
    let resolved_forward_dicts = match field_method_scheme {
        some(field_scheme) => {
            let current_field_var_map = field_var_map
            let current_field_scheme_type = field_scheme.ty
            let field_callee_type = apply_subst_map(
                current_field_var_map, current_field_scheme_type)
            let current_generated_fn_bounds = generated_fn_bounds
            let current_field_scheme = field_scheme
            let current_field_callee_type = field_callee_type
            let current_subst = ctx.subst
            let resolve_span = span
            resolve_dicts_from_scheme(
                ctx.sink, ctx.env, current_generated_fn_bounds,
                current_field_scheme, current_field_callee_type,
                current_subst, resolve_span)
        },
        none => []
    }
    let access_method_name = method_name
    let access_method_type = method_type
    let access_span = span
    let method_access = HExpr::FieldAccess {
        receiver: field_access, field: access_method_name,
        ty: access_method_type, effects: EMPTY_ROW, span: access_span
    }
    let callee_def_id = delegate_field_method_def_id_firebreak(
        field_method_scheme, method_def_id)
    let result_type_for_def_id = return_type
    let callable_result_def_id =
        fresh_call_result_callable_def_id(ctx, result_type_for_def_id)
    let call_return_type = return_type
    let call_effects = effects
    let call_span = span
    HExpr::Call {
        callee: method_access, callee_def_id: callee_def_id,
        callable_result_def_id: callable_result_def_id,
        args: forward_args, type_args: [],
        resolved_dicts: resolved_forward_dicts,
        dict_dispatch: none, ty: call_return_type,
        effects: call_effects, span: call_span
    }
}

fn append_delegate_method_firebreak(
    mut trait_hmethods: List<HDecl>, name: Str, def_id: Int,
    type_params: List<TypeParam>, params: List<HParam>,
    return_type: Type, effects: EffectRow, body: HExpr,
    trait_bounds: List<TraitBound>, span: Span
) {
    let current_name = name
    let current_def_id = def_id
    let current_type_params = type_params
    let current_params = params
    let current_return_type = return_type
    let current_effects = effects
    let current_body = body
    let current_trait_bounds = trait_bounds
    let current_span = span
    trait_hmethods.push(HDecl::Fn {
        name: current_name, def_id: some(current_def_id),
        type_params: current_type_params, params: current_params,
        return_type: current_return_type, effects: current_effects,
        body: current_body, is_pub: false,
        trait_bounds: current_trait_bounds, span: current_span
    })
}

fn append_delegate_assoc_result_firebreak(
    mut h_assoc_types: List<HAssocType>, name: Str, ty: Type
) {
    let current_name = name
    let current_type = ty
    h_assoc_types.push(HAssocType {
        name: current_name, bounds: [], concrete: some(current_type)
    })
}

fn append_delegate_impl_result_firebreak(
    mut result: List<HDecl>, target_type: Str,
    type_params: List<TypeParam>, trait_name: Str,
    methods: List<HDecl>, assoc_types: List<HAssocType>, span: Span
) {
    let current_target_type = target_type
    let current_type_params = type_params
    let current_trait_name = trait_name
    let current_methods = methods
    let current_assoc_types = assoc_types
    let current_span = span
    result.push(HDecl::Impl {
        target_type: current_target_type,
        type_params: current_type_params,
        trait_name: some(current_trait_name),
        methods: current_methods, assoc_types: current_assoc_types,
        span: current_span
    })
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
                                some(tv) => append_delegate_impl_type_param_firebreak(
                                    impl_tp_types, tv),
                                none => impl_tp_types.push(ctx.env.fresh_var())
                            }
                        }
                        match ctx.env.types.structs.get(target_type) {
                            some(def) => Type::StructType { name: def.name, type_params: impl_tp_types },
                            none => match ctx.env.types.enums.get(target_type) {
                                some(def) => Type::EnumType { name: def.name, type_params: impl_tp_types },
                                none => resolve_self_type(ctx, target_type)
                            }
                        }
                    } else {
                        resolve_self_type(ctx, target_type)
                    }

                    // Collect all traits to generate: explicit traits + their supertraits
                    let mut all_traits: List<Str> = []
                    for tname in trait_names {
                        let canonical_trait =
                            resolve_delegate_trait_identity_firebreak(ctx, tname)
                        let supers = collect_delegate_supertraits_firebreak(
                            ctx, canonical_trait)
                        let mut reaches_authoritative_drop =
                            delegate_trait_is_authoritative_drop_firebreak(
                                ctx, canonical_trait)
                        for st_name in supers {
                            if delegate_trait_is_authoritative_drop_firebreak(
                                    ctx, st_name) {
                                reaches_authoritative_drop = true
                            }
                        }
                        // Registration already emitted E0801.  Do not build a
                        // partial forwarding HIR path after that diagnostic.
                        if !reaches_authoritative_drop {
                            append_delegate_trait_firebreak(
                                all_traits, canonical_trait)
                            for st_name in supers {
                                // Avoid duplicates
                                if !all_traits.contains(st_name) {
                                    append_delegate_trait_firebreak(
                                        all_traits, st_name)
                                }
                            }
                        }
                    }

                    // #125/#128: Get the field type name for looking up resolved methods
                    let field_type_name =
                        delegate_nominal_type_name_firebreak(ft)
                    for tname in all_traits {
                        match ctx.env.trait_reg.traits.get(tname) {
                            none => {},  // Error already reported in Pass 1
                            some(trait_def) => {
                                let delegate_impl = find_impl(
                                    ctx.env.trait_reg, target_type, tname)
                                let field_impl = match field_type_name {
                                    some(ftn) => find_impl(
                                        ctx.env.trait_reg, ftn, tname),
                                    none => none
                                }

                                // Use the exact registered delegate receiver so
                                // HIR, method schemes, and dictionary bounds all
                                // share the same wrapper impl variables.
                                let mut exact_self_type = self_type
                                let mut found_exact_self = false
                                match delegate_impl {
                                    some(delegate_entry) => {
                                        let mut exact_entries =
                                            delegate_entry.method_schemes.entries()
                                        exact_entries.sort_by(compare_by_first)
                                        for exact_entry in exact_entries {
                                            if !found_exact_self {
                                                let (_, exact_scheme) = exact_entry
                                                match exact_scheme.ty {
                                                    Type::FnType { params, .. } =>
                                                        match params.first() {
                                                            some(receiver) => {
                                                                exact_self_type = receiver
                                                                found_exact_self = true
                                                            },
                                                            none => {}
                                                        },
                                                    _ => {}
                                                }
                                            }
                                        }
                                    },
                                    none => {}
                                }

                                let mut declared_params: List<Type> = []
                                let mut declared_index = 0
                                for declared_id in struct_def.type_param_vars {
                                    let declared_name = match
                                        struct_def.type_params.get(declared_index) {
                                        some(name) =>
                                            some_delegate_nominal_name_firebreak(name),
                                        none => none
                                    }
                                    declared_params.push(Type::TypeVar {
                                        id: declared_id, name: declared_name
                                    })
                                    declared_index = declared_index + 1
                                }
                                let declared_self_type = Type::StructType {
                                    name: struct_def.name,
                                    type_params: declared_params
                                }
                                let field_owner_map = build_type_var_map(
                                    ctx.env.types.ownership_metadata,
                                    declared_self_type, exact_self_type,
                                    struct_def.type_param_vars)
                                let resolved_ft = apply_subst_map(
                                    field_owner_map, ft)

                                // Derive one source-impl mapping from exact field
                                // receivers to the wrapper's actual field type.
                                let mut field_var_map: Map<Int, Type> = map_new()
                                match field_impl {
                                    some(field_entry) => {
                                        let mut field_methods =
                                            field_entry.method_schemes.entries()
                                        field_methods.sort_by(compare_by_first)
                                        for field_method in field_methods {
                                            let (_, field_scheme) = field_method
                                            match field_scheme.ty {
                                                Type::FnType { params, .. } =>
                                                    match params.first() {
                                                        some(field_receiver) => {
                                                            let candidate = build_type_var_map(
                                                                ctx.env.types.ownership_metadata,
                                                                field_receiver, resolved_ft,
                                                                field_scheme.type_vars)
                                                            let mut source_ids = candidate.keys()
                                                            source_ids.sort()
                                                            for source_id in source_ids {
                                                                match candidate.get(source_id) {
                                                                    some(mapped) =>
                                                                        insert_delegate_field_var_firebreak(
                                                                            field_var_map,
                                                                            source_id, mapped),
                                                                    none => {}
                                                                }
                                                            }
                                                        },
                                                        none => {}
                                                    },
                                                _ => {}
                                            }
                                        }
                                    },
                                    none => {}
                                }

                                let mut generated_trait_bounds: List<TraitBound> = []
                                let mut generated_fn_bounds: List<FnBoundsEntry> = []
                                let wrapper_type_args = match exact_self_type {
                                    Type::StructType { type_params, .. } => type_params,
                                    Type::EnumType { type_params, .. } => type_params,
                                    _ => []
                                }
                                match delegate_impl {
                                    some(delegate_entry) => {
                                        for dict_bound in delegate_entry.dict_bounds {
                                            match (delegate_entry.type_params.get(
                                                        dict_bound.type_param_index),
                                                   wrapper_type_args.get(
                                                        dict_bound.type_param_index)) {
                                                (some(type_param_name),
                                                 some(Type::TypeVar { id, .. })) => {
                                                    append_delegate_bounds_firebreak(
                                                        generated_trait_bounds,
                                                        generated_fn_bounds,
                                                        type_param_name, id,
                                                        dict_bound.trait_name)
                                                },
                                                _ => {}
                                            }
                                        }
                                    },
                                    none => {}
                                }

                                // #128: Look up field type's exact ImplEntry for assoc_types
                                let mut field_assoc_map: Map<Str, Type> = map_new()
                                match field_impl {
                                    some(field_entry) => {
                                        let mut assoc_entries =
                                            field_entry.assoc_types.entries()
                                        assoc_entries.sort_by(compare_by_first)
                                        for assoc_entry in assoc_entries {
                                            let (assoc_name, assoc_type) = assoc_entry
                                            insert_delegate_assoc_type_firebreak(
                                                field_assoc_map, assoc_name,
                                                field_var_map, assoc_type)
                                        }
                                    },
                                    none => {}
                                }

                                let mut trait_hmethods: List<HDecl> = []
                                for tm in trait_def.methods {
                                    // The wrapper ImplEntry owns the specialized
                                    // public signature; the field ImplEntry owns
                                    // the forwarded callee and its predicates.
                                    let resolved_method_scheme = match delegate_impl {
                                        some(wrapper_entry) => match
                                            wrapper_entry.method_schemes.get(tm.name) {
                                            some(scheme) => scheme,
                                            none => panic(
                                                "unreachable: registered delegate method scheme is missing")
                                        },
                                        none => panic(
                                            "unreachable: registered delegate impl is missing")
                                    }
                                    let resolved_method_def_id = match
                                        resolved_method_scheme.def_id {
                                        some(def_id) => def_id,
                                        none => panic(
                                            "unreachable: registered delegate method has no local DefId")
                                    }
                                    let field_method_scheme = match field_impl {
                                        some(field_entry) =>
                                            field_entry.method_schemes.get(tm.name),
                                        none => none
                                    }
                                    match tm.ty {
                                        Type::FnType { params: trait_params, .. } => {
                                            // The registered wrapper scheme is
                                            // authoritative for the generated
                                            // signature and ownership identity.
                                            let ret_ty = match resolved_method_scheme {
                                                TypeScheme { ty: Type::FnType {
                                                    return_type: resolved_ret, ..
                                                }, .. } => resolved_ret,
                                                _ => panic(
                                                    "unreachable: registered delegate method is not callable")
                                            }
                                            let eff = match resolved_method_scheme.ty {
                                                Type::FnType { meta, .. } => meta.effects,
                                                _ => panic(
                                                    "unreachable: registered delegate method is not callable")
                                            }
                                            let method_ownership = ownership_from_fn_type(
                                                resolved_method_scheme.ty,
                                                trait_params.len())
                                            // Build resolved param types from field method (skipping self)
                                            let resolved_non_self_params = match resolved_method_scheme {
                                                TypeScheme { ty: Type::FnType {
                                                    params: resolved_params, ..
                                                }, .. } => resolved_params,
                                                _ => panic(
                                                    "unreachable: registered delegate method is not callable")
                                            }
                                            // Build HParam list: first is self, rest are synthetic params
                                            let mut hparams: List<HParam> = []
                                            let def_id_self = ctx.env.fresh_def_id()
                                            // #77: Read self mutability from trait method declaration
                                            let self_is_mut = match tm.param_mutabilities.get(0) {
                                                some(m) => m,
                                                none => false
                                            }
                                            append_delegate_self_param_firebreak(
                                                hparams, exact_self_type,
                                                def_id_self, self_is_mut,
                                                ctx.env.types.ownership_metadata,
                                                method_ownership)

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
                                                let resolved_pty = match
                                                    resolved_non_self_params.get(pi) {
                                                    some(rpt) => rpt,
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
                                                let is_self_typed =
                                                    delegate_types_are_same_var_firebreak(
                                                        pty, trait_self_type)
                                                // For binary Self-typed params, use self_type; otherwise use resolved type
                                                let param_ty = delegate_param_type_firebreak(
                                                    is_self_typed, exact_self_type,
                                                    resolved_pty)
                                                append_delegate_param_firebreak(
                                                    hparams, pname, param_ty, pid,
                                                    p_is_mut,
                                                    ctx.env.types.ownership_metadata,
                                                    method_ownership, pi)

                                                if is_self_typed {
                                                    // Forward: __p0.field (access the delegated field from the arg)
                                                    append_delegate_self_forward_arg_firebreak(
                                                        forward_args, pname, pid,
                                                        exact_self_type, field,
                                                        resolved_ft, span)
                                                } else {
                                                    append_delegate_forward_arg_firebreak(
                                                        forward_args, pname, pid,
                                                        resolved_pty, span)
                                                }
                                                pi = pi + 1
                                            }

                                            // Build: self.field
                                            let field_access =
                                                build_delegate_field_access_firebreak(
                                                    def_id_self, exact_self_type,
                                                    field, resolved_ft, span)

                                            // #68: Check if this method is a default method without explicit impl
                                            // on the field type. If so, use trait dict dispatch instead of UFCS.
                                            let mut use_dict_dispatch = false
                                            if tm.has_default {
                                                // Get the field type name
                                                let ftn =
                                                    delegate_nominal_type_name_firebreak(
                                                        resolved_ft)
                                                match ftn {
                                                    some(field_tn) => {
                                                        // Check if the field type has an explicit impl for this method
                                                        let mut has_explicit = false
                                                        match field_impl {
                                                            some(field_entry) => {
                                                                has_explicit = field_entry.method_names.contains(tm.name)
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
                                                build_delegate_dict_call_firebreak(
                                                    ctx, resolved_ft, tname,
                                                    tm.name, tm.def_id, tm.ty,
                                                    field_access, forward_args,
                                                    ret_ty, eff, span)
                                            } else {
                                                // Build: self.field.method(args...) — as Call with UFCS callee
                                                build_delegate_ufcs_call_firebreak(
                                                    ctx, field_method_scheme,
                                                    field_var_map,
                                                    generated_fn_bounds,
                                                    field_access, forward_args,
                                                    tm.name, tm.def_id, tm.ty,
                                                    ret_ty, eff, span)
                                            }

                                            // #77: Copy method type_params from trait method declaration
                                            append_delegate_method_firebreak(
                                                trait_hmethods, tm.name,
                                                resolved_method_def_id,
                                                tm.method_type_params, hparams,
                                                ret_ty, eff, call_expr,
                                                generated_trait_bounds, span)
                                        },
                                        _ => {}
                                    }
                                }

                                // #128: Build HAssocType list from field type's assoc_types
                                let mut h_assoc_types: List<HAssocType> = []
                                let mut sorted_assoc = field_assoc_map.entries()
                                sorted_assoc.sort_by(compare_by_first)
                                for entry in sorted_assoc {
                                    let (aname, aty) = entry
                                    append_delegate_assoc_result_firebreak(
                                        h_assoc_types, aname, aty)
                                }

                                append_delegate_impl_result_firebreak(
                                    result, target_type, type_params, tname,
                                    trait_hmethods, h_assoc_types, span)
                            }
                        }
                    }
                    result
                }
            }
        }
    }
}

fn some_trait_ast_params_firebreak(params: List<Param>) -> List<Param>? {
    let current_params = params
    some(current_params)
}

fn append_trait_param_firebreak(
    mut hparams: List<HParam>, name: Str, ty: Type,
    is_mutable: Bool, ownership_metadata: OwnershipMetadata,
    fn_ownership: Int, param_index: Int, def_id: Int
) {
    let current_name = name
    let current_type = ty
    let current_def_id = def_id
    hparams.push(HParam {
        name: current_name, ty: current_type,
        def_id: some(current_def_id),
        flags: hparam_flags(is_mutable, callable_param_ownership(
            ownership_metadata, fn_ownership, param_index))
    })
}

fn check_trait_default_body_firebreak(
    mut ctx: InferCtx, trait_name: Str, method_identity: Str,
    self_var: Type, hparams: List<HParam>, method_return: Type,
    method_effects: EffectRow, method_span: Span, body: Expr
) -> HExpr? {
    let current_trait_name = trait_name
    let current_method_identity = method_identity
    let current_self_var = self_var
    let current_hparams = hparams
    let current_method_return = method_return
    let current_method_effects = method_effects
    let current_method_span = method_span
    let current_body = body
    check_trait_default_body(
        ctx, current_trait_name, current_method_identity,
        current_self_var, current_hparams, current_method_return,
        current_method_effects, current_method_span, current_body)
}

fn set_trait_default_return_type_firebreak(
    mut ctx: InferCtx, method_return: Type
) {
    let current_method_return = method_return
    ctx.current_fn_return_type = some(current_method_return)
}

fn append_trait_default_bound_firebreak(
    mut ctx: InferCtx, type_param_var_id: Int, trait_name: Str
) {
    let current_trait_name = trait_name
    ctx.current_fn_bounds.push(FnBoundsEntry {
        type_param_var_id: type_param_var_id,
        trait_name: current_trait_name,
        type_param_name: "self"
    })
}

fn collect_trait_default_supertraits_firebreak(
    ctx: InferCtx, trait_name: Str
) -> List<Str> {
    let current_trait_name = trait_name
    collect_all_supertraits(ctx, current_trait_name)
}

fn insert_trait_default_self_scope_firebreak(
    mut ctx: InferCtx, self_type: Type
) {
    let current_self_type = self_type
    ctx.type_param_scope.insert("Self", current_self_type)
}

fn insert_trait_default_assoc_scope_firebreak(
    mut ctx: InferCtx, assoc_name: Str, assoc_type: Type
) {
    let current_assoc_name = assoc_name
    let current_assoc_type = assoc_type
    ctx.qualified_assoc_scope.insert(
        "Self::${current_assoc_name}", current_assoc_type)
}

fn mark_trait_default_mutable_firebreak(mut ctx: InferCtx, def_id: Int) {
    let current_def_id = def_id
    ctx.env.scope.mutable_vars.insert(current_def_id)
}

fn constrain_trait_default_return_firebreak(
    mut ctx: InferCtx, body: HExpr, body_type: Type,
    method_return: Type
) {
    let body_for_terminal_check = body
    if !block_ends_with_return_statement(body_for_terminal_check) {
        let subst_for_return_display = ctx.subst
        let return_type_for_display = method_return
        let body_type_for_display = body_type
        let body_for_note_span = body
        let return_notes: List<DiagnosticNote> = [
            DiagnosticNote {
                message: "trait method return type is '${type_to_string(apply_subst(subst_for_return_display, return_type_for_display))}'",
                span: none
            },
            DiagnosticNote {
                message: "trait default body evaluates to '${type_to_string(body_type_for_display)}'",
                span: some(hexpr_span(body_for_note_span))
            }
        ]
        let body_for_type = body
        let return_type_for_unify = method_return
        let subst_for_unify = ctx.subst
        let body_for_unify_span = body
        ctx.subst = unify_at_noted(
            ctx.sink, ctx.env, hexpr_type(body_for_type),
            return_type_for_unify, subst_for_unify,
            hexpr_span(body_for_unify_span), return_notes)
    }
}

fn constrain_trait_default_effects_firebreak(
    mut ctx: InferCtx, method_identity: Str, body_effects: EffectRow,
    method_effects: EffectRow, method_span: Span
) {
    let current_method_identity = method_identity
    let current_body_effects = body_effects
    let current_method_effects = method_effects
    let current_method_span = method_span
    let current_subst = ctx.subst
    let (_, constrained_subst) = constrain_declared_fn_effects(
        ctx, current_method_identity, current_body_effects,
        current_method_effects, current_method_span, current_subst)
    let current_constrained_subst = constrained_subst
    ctx.subst = current_constrained_subst
}

fn zonk_trait_default_body_firebreak(
    ctx: InferCtx, body: HExpr
) -> HExpr? {
    let current_subst = ctx.subst
    let current_ownership_metadata = ctx.env.types.ownership_metadata
    let current_ctx = ctx
    let zctx = ZonkCtx {
        subst: current_subst, names: map_new(),
        dict_resolver: some(current_ctx),
        ownership_metadata: some(current_ownership_metadata),
        require_exact_ownership: false
    }
    let current_body = body
    some(zonk_block(zctx, current_body))
}

fn trait_default_previous_bounds_firebreak(
    previous_bounds: List<FnBoundsEntry>
) -> List<FnBoundsEntry> {
    let current_previous_bounds = previous_bounds
    current_previous_bounds
}

fn restore_trait_default_bounds_firebreak(mut ctx: InferCtx) {
    ctx.current_fn_bounds = match ctx.fn_bounds_stack.pop() {
        some(prev) => trait_default_previous_bounds_firebreak(prev),
        none => []
    }
}

fn check_trait_decl(mut ctx: InferCtx, name: Str, type_params: List<TypeParam>, ast_methods: List<Decl>, is_pub: Bool, span: Span) -> HDecl {
    let trait_def = match ctx.env.trait_reg.traits.get(name) {
        some(d) => d,
        none => {
            let display = nominal_display_name(name)
            let _ = type_error(ctx.sink, E0501, "trait not found: ${display}", span,
                DiagnosticContext::TraitError { detail: "trait '${display}' was not registered" })
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
        let fn_effects = match m.ty {
            Type::FnType { meta, .. } => meta.effects,
            _ => EMPTY_ROW
        }
        let fn_ownership = ownership_from_fn_type(m.ty, fn_params.len())
        let ast_params = match ast_method {
            some(am) => match am {
                Decl::Fn { params, .. } =>
                    some_trait_ast_params_firebreak(params),
                _ => none
            },
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
            let p_def_id = ctx.env.fresh_def_id()
            append_trait_param_firebreak(
                hparams, p_name, param_type, p_mutable,
                ctx.env.types.ownership_metadata, fn_ownership, pi,
                p_def_id)
            pi = pi + 1
        }

        let mut method_body: HExpr? = none
        if m.has_default {
            match ast_method {
                some(am) => match am {
                    Decl::Fn { body: abody, span: method_span, .. } => {
                        let has_body = match abody {
                            Expr::Block { stmts, tail, .. } => stmts.len() > 0 || tail.is_some(),
                            _ => true
                        }
                        if has_body {
                            let method_identity = "${name}::${m.name}"
                            method_body = check_trait_default_body_firebreak(
                                ctx, name, method_identity,
                                self_var, hparams, fn_ret, fn_effects,
                                method_span, abody)
                        }
                    },
                    _ => {}
                },
                none => {}
            }
        }

        hmethods.push(HTraitMethod {
            name: m.name, def_id: m.def_id,
            params: hparams, return_type: fn_ret,
            effects: fn_effects,
            has_default: m.has_default, body: method_body
        })
    }

    // Build HAssocType list from trait def
    let mut hassoc_types: List<HAssocType> = []
    for atdef in trait_def.assoc_types {
        hassoc_types.push(HAssocType { name: atdef.name, bounds: atdef.bounds, concrete: atdef.default_type })
    }

    HDecl::Trait { name: name, type_params: type_params, methods: hmethods, supertraits: trait_def.supertraits, assoc_types: hassoc_types, is_pub: is_pub, span: span }
}

fn check_trait_default_body(
    mut ctx: InferCtx, trait_name: Str, method_identity: Str,
    self_var: Type, hparams: List<HParam>, method_return: Type,
    method_effects: EffectRow, method_span: Span, body: Expr
) -> HExpr? {
    let obligation_checkpoint = pending_dict_checkpoint(ctx)
    let saved_subst = ctx.subst
    let saved_fn_return = ctx.current_fn_return_type
    ctx.subst = empty_subst()
    // Trait defaults are function owners too.  Keep the declared return live
    // during inference so explicit returns constrain pending call variables.
    set_trait_default_return_type_firebreak(ctx, method_return)
    ctx.env.push_scope()
    let saved_tp_scope = map_clone(ctx.type_param_scope)
    let saved_qualified_assoc = map_clone(ctx.qualified_assoc_scope)
    ctx.fn_bounds_stack.push(ctx.current_fn_bounds)
    ctx.current_fn_bounds = []

    match self_var {
        Type::TypeVar { id, .. } => {
            append_trait_default_bound_firebreak(ctx, id, trait_name)
            // Expand supertrait bounds for trait default body
            let supers = collect_trait_default_supertraits_firebreak(
                ctx, trait_name)
            for st_name in supers {
                append_trait_default_bound_firebreak(ctx, id, st_name)
            }
        },
        _ => {}
    }

    // Inject Self into type_param_scope so Self::Item resolves
    insert_trait_default_self_scope_firebreak(ctx, self_var)

    // Inject associated types into qualified_assoc_scope for Self::Item paths
    match ctx.env.trait_reg.traits.get(trait_name) {
        some(tdef) => {
            for atdef in tdef.assoc_types {
                // Associated types are already in type_param_scope (bare name, e.g. "Item")
                // from register_trait. Now also inject Self::Item qualified path.
                match ctx.type_param_scope.get(atdef.name) {
                    some(at_ty) => {
                        insert_trait_default_assoc_scope_firebreak(
                            ctx, atdef.name, at_ty)
                    },
                    none => {}
                }
            }
        },
        none => {}
    }

    for p in hparams {
        let param_is_mutable = hparam_is_mutable(p)
        let param_def_id = match p.def_id {
            some(id) => id,
            none => panic(
                "unreachable: trait default parameter has no exact DefId")
        }
        // TypeScheme and the mutable-variable registry are independent owning
        // sinks. Give each the same exact scalar identity through a fresh whole
        // view so neither sink tries to re-read a value already transferred by
        // the other.
        let scheme_param_def_id = param_def_id
        let mutable_param_def_id = param_def_id
        ctx.env.bind(p.name, TypeScheme {
            ty: p.ty, type_vars: [], bounds: [],
            def_id: some(scheme_param_def_id)
        })
        if param_is_mutable {
            mark_trait_default_mutable_firebreak(ctx, mutable_param_def_id)
        }
    }

    let body_result = some(infer_block(ctx, body, none)) catch { _ => none }

    let final_body = match body_result {
        some(br) => {
            ctx.subst = br.subst
            let body_type = apply_subst(ctx.subst, hexpr_type(br.hexpr))
            match body_type {
                Type::NeverType => {},
                _ => {
                    // A terminal return statement has already constrained
                    // method_return while infer_stmt handled its value.  The
                    // enclosing no-tail block is represented as Unit, not as
                    // a second value-producing return path.
                    constrain_trait_default_return_firebreak(
                        ctx, br.hexpr, body_type, method_return)
                }
            }
            // Trait defaults own the same declared-effect constraint surface
            // as ordinary functions.  Payloads can be the only source for a
            // pending call's hidden type parameter, so thread the resulting
            // substitution before callable shadows and owner drain.
            constrain_trait_default_effects_firebreak(
                ctx, method_identity, br.effects, method_effects,
                method_span)
            register_bounded_callable_value_shadows(
                ctx, br.hexpr, ctx.subst)
            drain_pending_dicts(ctx, obligation_checkpoint, ctx.subst)
            let result = zonk_trait_default_body_firebreak(ctx, br.hexpr)
            ctx.subst = saved_subst
            result
        },
        none => {
            rollback_pending_dicts(ctx, obligation_checkpoint)
            ctx.subst = saved_subst
            none
        }
    }
    // Keep the trait's Self/supertrait bounds and parameter scope alive
    // through value-zonk so bounded function values can capture them.
    ctx.current_fn_return_type = saved_fn_return
    ctx.env.pop_scope()
    restore_trait_default_bounds_firebreak(ctx)
    ctx.type_param_scope = saved_tp_scope
    ctx.qualified_assoc_scope = saved_qualified_assoc
    assert_pending_dict_owner_closed(ctx, obligation_checkpoint)
    final_body
}

fn find_ast_fn_by_name(methods: List<Decl>, name: Str) -> Decl? {
    methods.find(fn(d) {
        match d { Decl::Fn { name: n, .. } => n == name, _ => false }
    })
}

fn exact_def_span_result_firebreak(span: Span) -> Span {
    let exact_span = span
    exact_span
}

fn record_extern_def_span_firebreak(
    mut ctx: InferCtx, def_id: Int?, span: Span
) {
    match (def_id, span) {
        (some(id), exact_span) => {
            let id_for_span = id
            ctx.env.record_def_span(
                id_for_span, exact_def_span_result_firebreak(exact_span))
        },
        (none, _) => panic(
            "unreachable: registered extern callable has no local DefId")
    }
}

fn check_extern_fn_decl(
    mut ctx: InferCtx, name: Str, type_params: List<TypeParam>,
    params: List<Param>, declared_effects: List<EffectExpr>?,
    is_pub: Bool, span: Span, registration_override: TypeScheme?
) -> HDecl {
    // Impl externs live in the exact method registry, not the leaf value
    // namespace. Consume the registration captured by impl origin so an
    // unrelated top-level callable with the same spelling cannot donate its
    // DefId or ownership contract.
    let scheme = match registration_override {
        some(value) => value,
        none => match ctx.env.lookup(name) {
            some(value) => value,
            none => {
                let _ = type_error(ctx.sink, E0201,
                    "extern fn not found: ${name}", span,
                    DiagnosticContext::OtherContext {
                        detail: some("extern fn '${name}' was not registered")
                    })
                fail.raise(CompileError {})
            }
        }
    }
    let def_id_for_span = scheme.def_id
    let extern_def_span = span
    record_extern_def_span_firebreak(ctx, def_id_for_span, extern_def_span)
    let fn_params: List<Type> = match scheme.ty {
        Type::FnType { params: fps, .. } => fps,
        _ => []
    }
    let fn_ret = match scheme.ty {
        Type::FnType { return_type, .. } => return_type,
        _ => UNIT
    }
    let ownership = ownership_from_fn_type(scheme.ty, fn_params.len())
    let mut hparams: List<HParam> = []
    let mut i = 0
    for p in params {
        let ptype = match fn_params.get(i) { some(t) => t, none => UNIT }
        // Preserve the declared mutability as project-link metadata. Genuine
        // FFI marshalling ignores this field, while an exact internal extern
        // forward must distinguish `mut T` from `T`.
        hparams.push(HParam {
            name: p.name, ty: ptype, def_id: none,
            flags: hparam_flags(p.is_mutable, callable_param_ownership(
                ctx.env.types.ownership_metadata, ownership, i))
        })
        i = i + 1
    }
    let extern_effects = match declared_effects {
        some(de) => resolve_declared_effects(ctx, de),
        none => EMPTY_ROW
    }
    let extern_name = name
    let name_for_abi = name
    let extern_span = span
    HDecl::ExternFn {
        name: extern_name, abi_name: extern_abi_leaf(name_for_abi),
        def_id: scheme.def_id, type_params: type_params,
        params: hparams, return_type: fn_ret, effects: extern_effects,
        is_pub: is_pub, span: extern_span
    }
}

struct FnBodyResult {
    params: List<HParam>,
    ret: Type,
    eff: EffectRow,
    body: HExpr
}

// Statement-form `return value` constrains current_fn_return_type directly,
// while a no-tail block is still represented as Unit.  Distinguish that
// terminal control transfer from a genuinely Unit-valued function body.
fn block_ends_with_return_statement(body: HExpr) -> Bool {
    match body {
        HExpr::Block { stmts, tail, .. } => {
            if tail.is_some() { return false }
            let mut terminal_return = false
            for stmt in stmts {
                terminal_return = match stmt {
                    HStmt::Return { .. } => true,
                    _ => false
                }
            }
            terminal_return
        },
        _ => false
    }
}

fn declared_effect_pair_subst_result_firebreak(
    subst: UnionFind
) -> UnionFind {
    let result_subst = subst
    result_subst
}

fn constrain_declared_effect_pair_firebreak(
    mut ctx: InferCtx,
    inferred_eff: Effect,
    declared_eff: Effect,
    subst: UnionFind,
    span: Span
) -> UnionFind {
    match (inferred_eff, declared_eff, subst, span) {
        (Effect::FailEffect { error_type: ie },
         Effect::FailEffect { error_type: de }, pair_subst, pair_span) => {
            let inferred_error = ie
            let declared_error = de
            unify_at(
                ctx.sink, ctx.env, inferred_error, declared_error,
                pair_subst, pair_span)
        },
        (Effect::MutEffect { state_type: is },
         Effect::MutEffect { state_type: ds }, pair_subst, pair_span) => {
            let inferred_state = is
            let declared_state = ds
            unify_at(
                ctx.sink, ctx.env, inferred_state, declared_state,
                pair_subst, pair_span)
        },
        (Effect::CustomEffect { type_args: ia, .. },
         Effect::CustomEffect { type_args: da, .. }, pair_subst, pair_span) => {
            let mut s = pair_subst
            let mut i = 0
            while i < ia.len() && i < da.len() {
                let inferred_arg = ia.get(i).unwrap_or(UNIT)
                let declared_arg = da.get(i).unwrap_or(UNIT)
                s = unify_at(
                    ctx.sink, ctx.env, inferred_arg, declared_arg,
                    s, pair_span)
                i = i + 1
            }
            s
        },
        (_, _, pair_subst, _) =>
            declared_effect_pair_subst_result_firebreak(pair_subst)
    }
}

fn constrain_captured_declared_effect_pair_firebreak(
    mut ctx: InferCtx,
    inferred_eff: Effect,
    declared_eff: Effect,
    subst: UnionFind,
    span: Span
) -> UnionFind {
    let pair_inferred_effect = inferred_eff
    let pair_declared_effect = declared_eff
    let pair_subst = subst
    let pair_span = span
    constrain_declared_effect_pair_firebreak(
        ctx, pair_inferred_effect, pair_declared_effect,
        pair_subst, pair_span)
}

// Declared effects are part of the function owner's constraint surface, not a
// post-zonk API check.  Their payload types can be the only source that fixes
// a pending call's hidden type arguments, so apply them before owner drain.
fn constrain_declared_fn_effects(
    mut ctx: InferCtx, fn_name: Str,
    inferred_effects: EffectRow, declared_row: EffectRow, span: Span,
    subst: UnionFind
) -> (EffectRow, UnionFind) {
    let mut s = subst
    for inferred_eff in inferred_effects.effects {
        let mut found = false
        for declared_eff in declared_row.effects {
            if effects_match_kind_with_ownership(
                ctx.env.types.ownership_metadata,
                inferred_eff, declared_eff
            ) {
                found = true
                s = constrain_captured_declared_effect_pair_firebreak(
                    ctx, inferred_eff, declared_eff, s, span)
            }
        }
        if !found {
            let fn_display = nominal_display_name(fn_name)
            let _ = type_error(ctx.sink, E0404,
                "Function '${fn_display}' has undeclared effect: ${effect_to_string(inferred_eff)}",
                span,
                DiagnosticContext::OtherContext {
                    detail: some("effect annotation violation")
                })
        }
    }
    (declared_row, s)
}

fn declared_effect_row_constraint_view_firebreak(
    effects: EffectRow
) -> EffectRow {
    let exact_effects = effects
    exact_effects
}

fn owner_declared_effect_result_firebreak(
    effects: EffectRow, subst: UnionFind
) -> (EffectRow, UnionFind) {
    let result_effects = effects
    let result_subst = subst
    (result_effects, result_subst)
}

fn constrain_owner_declared_effects_firebreak(
    mut ctx: InferCtx,
    fn_name: Str,
    inferred_effects: EffectRow,
    declared_effects: EffectRow?,
    span: Span,
    subst: UnionFind
) -> (EffectRow, UnionFind) {
    match (declared_effects, fn_name, inferred_effects, span, subst) {
        (some(declared_row), owner_name, owner_inferred_effects,
         owner_span, owner_subst) => {
            let declared_row_for_constraint =
                declared_effect_row_constraint_view_firebreak(declared_row)
            constrain_declared_fn_effects(
                ctx, owner_name, owner_inferred_effects,
                declared_row_for_constraint, owner_span, owner_subst)
        },
        (none, _, owner_inferred_effects, _, owner_subst) =>
            owner_declared_effect_result_firebreak(
                owner_inferred_effects, owner_subst)
    }
}

fn insert_resolved_local_type_name_sink_firebreak(
    mut names: Map<Int, Str>, id: Int, name: Str
) {
    let recorded_id = id
    let recorded_name = name
    names.insert(recorded_id, recorded_name)
}

fn insert_local_type_name_firebreak(
    mut names: Map<Int, Str>, resolved: Type, name: Str
) {
    match resolved {
        Type::TypeVar { id, .. } => {
            let resolved_id = id
            insert_resolved_local_type_name_sink_firebreak(
                names, resolved_id, name)
        },
        _ => {}
    }
}

fn assoc_rebind_owner_name_view_firebreak(name: Str) -> Str {
    let exact_name = name
    exact_name
}

fn capture_assoc_rebind_provenance_if_registered_firebreak(
    mut ctx: InferCtx,
    fn_name: Str,
    registration_scheme: TypeScheme?,
    checked_params: List<HParam>,
    checked_return: Type,
    checked_effects: EffectRow,
    final_subst: UnionFind
) {
    match (registration_scheme, fn_name, checked_params,
           checked_return, checked_effects, final_subst) {
        (some(owner_scheme), owner_name, owner_params,
         owner_return, owner_effects, owner_subst) => {
            let owner_name_for_capture =
                assoc_rebind_owner_name_view_firebreak(owner_name)
            capture_assoc_rebind_provenance(
                ctx, owner_name_for_capture, owner_scheme, owner_params,
                owner_return, owner_effects, owner_subst)
        },
        _ => {}
    }
}

fn make_decl_zonk_ctx_firebreak(
    ctx: InferCtx, subst: UnionFind, names: Map<Int, Str>
) -> ZonkCtx {
    let ctx_for_dict_resolver = ctx
    let ctx_for_ownership_metadata = ctx
    ZonkCtx {
        subst: subst,
        names: names,
        dict_resolver: some(ctx_for_dict_resolver),
        ownership_metadata: some(
            ctx_for_ownership_metadata.env.types.ownership_metadata),
        require_exact_ownership: false
    }
}

fn non_never_final_subst_result_firebreak(
    subst: UnionFind
) -> UnionFind {
    let final_subst = subst
    final_subst
}

fn constrain_non_never_fn_body_return_firebreak(
    mut ctx: InferCtx,
    body: HExpr,
    body_type: Type,
    expected_ret: Type,
    subst: UnionFind,
    span: Span
) -> UnionFind {
    let body_for_terminal = body
    let body_for_constraint = body
    let terminal = block_ends_with_return_statement(body_for_terminal)
    match (terminal, body_for_constraint, body_type,
           expected_ret, subst, span) {
        (true, _, _, _, final_subst, _) =>
            non_never_final_subst_result_firebreak(final_subst),
        (false, checked_body, resolved_body_type,
         declared_return, current_subst, declared_span) => {
            let body_span_source = checked_body
            let body_for_unify = checked_body
            let expected_for_note = declared_return
            let expected_for_unify = declared_return
            let subst_for_expected_note = current_subst
            let subst_for_unify = current_subst
            let span_for_note = declared_span
            let span_for_unify = declared_span
            let fn_body_notes: List<DiagnosticNote> = [
                DiagnosticNote {
                    message: "function return type is declared as '${type_to_string(apply_subst(subst_for_expected_note, expected_for_note))}'",
                    span: some(span_for_note)
                },
                DiagnosticNote {
                    message: "function body evaluates to '${type_to_string(resolved_body_type)}'",
                    span: some(hexpr_span(body_span_source))
                }
            ]
            unify_at_noted(
                ctx.sink, ctx.env, hexpr_type(body_for_unify),
                expected_for_unify, subst_for_unify,
                span_for_unify, fn_body_notes)
        }
    }
}

fn fn_body_expected_return_constraint_view_firebreak(
    expected_ret: Type
) -> Type {
    let exact_expected_ret = expected_ret
    exact_expected_ret
}

fn fn_body_return_constraint_span_view_firebreak(span: Span) -> Span {
    let exact_span = span
    exact_span
}

fn check_fn_body(
    mut ctx: InferCtx,
    fn_name: Str,
    registration_scheme: TypeScheme?,
    type_params: List<TypeParam>,
    hparams: List<HParam>,
    expected_ret: Type,
    declared_effects: EffectRow?,
    body: Expr,
    saved_tp_scope: Map<Str, Type>,
    span: Span,
    obligation_checkpoint: Int
) -> FnBodyResult {
    let body_result = infer_block(ctx, body, some(ctx.subst))
    ctx.subst = body_result.subst
    // Skip body-vs-return unification when the body type is Never (bottom).
    // Never is compatible with any type, but unify(Never, ?T) would bind ?T = Never,
    // contaminating the return type.  With B-122 rebind_fn_type this turns the
    // scheme's return type into Never, so all callers see the function as diverging.
    // Functions whose body ends with fail.raise / panic still have correct return
    // types from their `return` statements (which unify with expected_ret directly).
    let body_type_resolved = apply_subst(ctx.subst, hexpr_type(body_result.hexpr))
    match body_type_resolved {
        Type::NeverType => {},
        _ => {
            let expected_ret_for_constraint =
                fn_body_expected_return_constraint_view_firebreak(
                    expected_ret)
            let span_for_return_constraint =
                fn_body_return_constraint_span_view_firebreak(span)
            ctx.subst = constrain_non_never_fn_body_return_firebreak(
                ctx, body_result.hexpr, body_type_resolved,
                expected_ret_for_constraint, ctx.subst,
                span_for_return_constraint)
        },
    }

    let fn_name_for_effects = fn_name
    let inferred_effects_for_owner = body_result.effects
    let declared_effects_for_owner = declared_effects
    let span_for_effects = span
    let subst_for_effects = ctx.subst
    let constrained_owner_effects =
        constrain_owner_declared_effects_firebreak(
            ctx, fn_name_for_effects, inferred_effects_for_owner,
            declared_effects_for_owner, span_for_effects,
            subst_for_effects)
    ctx.subst = constrained_owner_effects.1
    let owner_effects = constrained_owner_effects.0

    register_bounded_callable_value_shadows(
        ctx, body_result.hexpr, ctx.subst)

    // Defaults and the body share this function owner's inference variables.
    // Return/annotation/arm/effect constraints are now complete; settle every
    // call slot before zonk or restoration can detach those variables.
    drain_pending_dicts(ctx, obligation_checkpoint, ctx.subst)

    let mut local_names: Map<Int, Str> = map_new()
    for tp in type_params {
        match ctx.type_param_scope.get(tp.name) {
            some(tv) => match tv {
                Type::TypeVar { .. } => {
                    let resolved = apply_subst(ctx.subst, tv)
                    insert_local_type_name_firebreak(
                        local_names, resolved, tp.name)
                },
                _ => {}
            },
            none => {}
        }
    }
    let mut declared_names: Set<Str> = set_new()
    for tp in type_params { declared_names.insert(tp.name) }
    let mut sorted_tp_scope2 = ctx.type_param_scope.entries()
    sorted_tp_scope2.sort_by(compare_by_first)
    for entry in sorted_tp_scope2 {
        let (tpname, tv) = entry
        if !saved_tp_scope.contains_key(tpname) && !declared_names.contains(tpname) {
            match tv {
                Type::TypeVar { .. } => {
                    let resolved = apply_subst(ctx.subst, tv)
                    insert_local_type_name_firebreak(
                        local_names, resolved, tpname)
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
                        let resolved = apply_subst(
                            ctx.subst,
                            Type::TypeVar { id: atdef.var_id, name: none })
                        insert_local_type_name_firebreak(
                            local_names, resolved, atdef.name)
                    }
                }
            },
            none => {}
        }
    }

    let subst_for_zonk = ctx.subst
    let zctx = make_decl_zonk_ctx_firebreak(
        ctx, subst_for_zonk, local_names)
    let mut final_params: List<HParam> = []
    for hp in hparams { final_params.push(zonk_param(zctx, hp)) }
    let final_ret = zonk_type(zctx, expected_ret)
    let eff = zonk_row(zctx, owner_effects)
    let final_body = zonk_block(zctx, body_result.hexpr)
    let subst_for_provenance = ctx.subst
    let fn_name_for_provenance = fn_name
    let registration_for_provenance = registration_scheme
    let params_for_provenance = final_params
    let return_for_provenance = final_ret
    let effects_for_provenance = eff
    capture_assoc_rebind_provenance_if_registered_firebreak(
        ctx, fn_name_for_provenance,
        registration_for_provenance, params_for_provenance,
        return_for_provenance, effects_for_provenance,
        subst_for_provenance)
    FnBodyResult { params: final_params, ret: final_ret, eff: eff, body: final_body }
}

// Capture the owner-qualified identity of check-time associated-type variables
// while the function's transient scopes are still live. rebind_fn_type runs
// after check_fn_decl returns, when qualified_assoc_scope/current_fn_bounds have
// already been restored, so it cannot reconstruct this safely from a bare
// TypeVar id.
fn build_assoc_owner_mapping_pair_firebreak(
    metadata: OwnershipMetadata,
    checked_type: Type,
    registration_type: Type,
    mut owner_mapping: Map<Int, Type>,
    mut owner_conflicts: Set<Int>
) {
    let checked_for_mapping = checked_type
    let registration_for_mapping = registration_type
    build_var_mapping(
        metadata, checked_for_mapping, registration_for_mapping,
        owner_mapping, owner_conflicts)
}

fn append_assoc_rebind_entry_firebreak(
    mut captured: List<AssocRebindEntry>,
    check_type: Type,
    registration_type: Type?,
    owner_name: Str,
    trait_name: Str,
    assoc_name: Str
) {
    let entry_check_type = check_type
    let entry_registration_type = registration_type
    let entry_owner_name = owner_name
    let entry_trait_name = trait_name
    let entry_assoc_name = assoc_name
    captured.push(AssocRebindEntry {
        check_type: entry_check_type,
        registration_type: entry_registration_type,
        owner_name: entry_owner_name,
        trait_name: entry_trait_name,
        assoc_name: entry_assoc_name
    })
}

fn capture_assoc_rebind_provenance(
    mut ctx: InferCtx,
    fn_name: Str,
    registration_scheme: TypeScheme,
    checked_params: List<HParam>,
    checked_return: Type,
    checked_effects: EffectRow,
    final_subst: UnionFind
) {
    let mut captured: List<AssocRebindEntry> = []
    match registration_scheme.ty {
        Type::FnType {
            params: registration_params,
            return_type: registration_return,
            meta: registration_meta
        } => {
            let registration_effects = registration_meta.effects
            // First map each check-time owner (T/U/...) back to the corresponding
            // registration-time owner using the ordinary function shape.
            let mut owner_mapping: Map<Int, Type> = map_new()
            let mut owner_conflicts: Set<Int> = set_new()
            let mut param_index = 0
            for checked_param in checked_params {
                match registration_params.get(param_index) {
                    some(registration_param) => {
                        let checked_param_type = checked_param.ty
                        let registration_param_type = registration_param
                        build_assoc_owner_mapping_pair_firebreak(
                            ctx.env.types.ownership_metadata,
                            checked_param_type, registration_param_type,
                            owner_mapping, owner_conflicts
                        )
                    },
                    none => {}
                }
                param_index = param_index + 1
            }
            let checked_return_for_mapping = checked_return
            let registration_return_for_mapping = registration_return
            build_assoc_owner_mapping_pair_firebreak(
                ctx.env.types.ownership_metadata,
                checked_return_for_mapping, registration_return_for_mapping,
                owner_mapping, owner_conflicts
            )
            build_effect_var_mapping(
                ctx.env.types.ownership_metadata,
                checked_effects, registration_effects,
                owner_mapping, owner_conflicts
            )

            for fn_bound in ctx.current_fn_bounds {
                let checked_owner = apply_subst(
                    final_subst,
                    Type::TypeVar {
                        id: fn_bound.type_param_var_id,
                        name: some(fn_bound.type_param_name)
                    }
                )
                let registration_owner_id = match checked_owner {
                    Type::TypeVar { id: checked_owner_id, .. } => {
                        if owner_conflicts.contains(checked_owner_id) {
                            none
                        } else {
                            let registration_owner = apply_subst_map(
                                owner_mapping, checked_owner
                            )
                            match registration_owner {
                                Type::TypeVar { id, .. } => {
                                    let registration_id = id
                                    some(registration_id)
                                },
                                _ => none
                            }
                        }
                    },
                    _ => none
                }

                match ctx.env.trait_reg.traits.get(fn_bound.trait_name) {
                    some(trait_def) => {
                        for assoc_def in trait_def.assoc_types {
                            let origin = "${fn_bound.type_param_name}::${assoc_def.name}"
                            match ctx.qualified_assoc_scope.get(origin) {
                                some(checked_assoc) => {
                                    let zonked_assoc = apply_subst(
                                        final_subst, checked_assoc
                                    )
                                    let mut found_target = false
                                    match registration_owner_id {
                                        some(owner_id) => {
                                            for scheme_bound in registration_scheme.bounds {
                                                if scheme_bound.type_var == owner_id &&
                                                   scheme_bound.trait_name == fn_bound.trait_name {
                                                    for constraint in scheme_bound.assoc_constraints {
                                                        if constraint.name == assoc_def.name {
                                                            found_target = true
                                                            append_assoc_rebind_entry_firebreak(
                                                                captured,
                                                                zonked_assoc,
                                                                some(constraint.ty),
                                                                fn_bound.type_param_name,
                                                                fn_bound.trait_name,
                                                                assoc_def.name)
                                                        }
                                                    }
                                                }
                                            }
                                        },
                                        none => {}
                                    }
                                    if !found_target {
                                        append_assoc_rebind_entry_firebreak(
                                            captured, zonked_assoc, none,
                                            fn_bound.type_param_name,
                                            fn_bound.trait_name,
                                            assoc_def.name)
                                    }
                                },
                                none => {}
                            }
                        }
                    },
                    none => {}
                }
            }
        },
        _ => {}
    }
    ctx.rebind_assoc_provenance.insert(fn_name, captured)
}

fn check_fn_decl_transaction_firebreak(
    mut ctx: InferCtx,
    name: Str,
    type_params: List<TypeParam>,
    params: List<Param>,
    return_type: TypeExpr?,
    declared_effects: List<EffectExpr>?,
    body: Expr,
    is_pub: Bool,
    span: Span,
    self_type: Type?,
    registration_override: TypeScheme?,
    rebind_identity: Str?,
    obligation_checkpoint: Int
) -> HDecl {
    let owner_name = name
    let owner_type_params = type_params
    let owner_params = params
    let owner_return_type = return_type
    let owner_declared_effects = declared_effects
    let owner_body = body
    let owner_span = span
    let owner_self_type = self_type
    let owner_registration = registration_override
    let owner_rebind_identity = rebind_identity
    check_fn_decl_transaction(
        ctx, owner_name, owner_type_params, owner_params,
        owner_return_type, owner_declared_effects, owner_body,
        is_pub, owner_span, owner_self_type, owner_registration,
        owner_rebind_identity, obligation_checkpoint)
}

fn check_fn_decl(
    mut ctx: InferCtx, name: Str, type_params: List<TypeParam>,
    params: List<Param>, return_type: TypeExpr?,
    declared_effects: List<EffectExpr>?, body: Expr,
    is_pub: Bool, span: Span, self_type: Type?,
    registration_override: TypeScheme?, rebind_identity: Str?
) -> HDecl {
    let obligation_checkpoint = pending_dict_checkpoint(ctx)
    let result = some(check_fn_decl_transaction_firebreak(
        ctx, name, type_params, params, return_type,
        declared_effects, body, is_pub, span, self_type,
        registration_override, rebind_identity,
        obligation_checkpoint)) catch { _ => none }
    match result {
        some(hdecl) => {
            assert_pending_dict_owner_closed(ctx, obligation_checkpoint)
            let checked_decl = hdecl
            checked_decl
        },
        none => {
            rollback_pending_dicts(ctx, obligation_checkpoint)
            fail.raise(CompileError {})
        }
    }
}

fn check_fn_body_catch_firebreak(
    mut ctx: InferCtx,
    fn_name: Str,
    registration_scheme: TypeScheme?,
    type_params: List<TypeParam>,
    hparams: List<HParam>,
    expected_ret: Type,
    declared_effects: EffectRow?,
    body: Expr,
    saved_tp_scope: Map<Str, Type>,
    span: Span,
    obligation_checkpoint: Int
) -> FnBodyResult {
    let body_owner_name = fn_name
    let body_registration = registration_scheme
    let body_type_params = type_params
    let body_params = hparams
    let body_expected_ret = expected_ret
    let body_declared_effects = declared_effects
    let body_expr = body
    let body_saved_tp_scope = saved_tp_scope
    let body_span = span
    check_fn_body(
        ctx, body_owner_name, body_registration, body_type_params,
        body_params, body_expected_ret, body_declared_effects,
        body_expr, body_saved_tp_scope, body_span,
        obligation_checkpoint)
}

fn report_unhandled_main_effect_firebreak(
    mut ctx: InferCtx, effect_display: Str, span: Span
) {
    let effect_for_used_note = effect_display
    let effect_for_handler_note = effect_display
    let effect_for_message = effect_display
    let effect_for_context = effect_display
    let used_span = span
    let error_span = span
    let effect_notes: List<DiagnosticNote> = [
        DiagnosticNote {
            message: "effect '${effect_for_used_note}' is used but not handled in main",
            span: some(used_span)
        },
        DiagnosticNote {
            message: "use 'handle ... with { ${effect_for_handler_note} { op_name(args) => result } }' to handle this effect",
            span: none
        }
    ]
    let _ = type_error_with_notes(
        ctx.sink, E0403,
        "Unhandled effect '${effect_for_message}' in main function; custom effects must be handled before reaching main",
        error_span,
        DiagnosticContext::EffectUnhandled {
            eff: effect_for_context, in_function: some("main")
        },
        effect_notes)
}

fn record_fn_def_span_firebreak(
    mut ctx: InferCtx, def_id: Int?, span: Span
) {
    match (def_id, span) {
        (some(id), exact_span) => {
            let exact_id = id
            ctx.env.record_def_span(
                exact_id, exact_def_span_result_firebreak(exact_span))
        },
        (none, _) => {}
    }
}

fn is_mut_value_param_type_firebreak(
    ctx: InferCtx, param_type: Type
) -> Bool {
    let exact_param_type = param_type
    is_value_type(apply_subst(ctx.subst, exact_param_type))
}

fn publish_fn_defaults_firebreak(
    mut ctx: InferCtx,
    name: Str,
    defaults: List<HExpr>,
    min_arity: Int
) {
    let name_for_defaults = name
    let name_for_min_arity = name
    let exact_defaults = defaults
    ctx.fn_defaults.insert(name_for_defaults, exact_defaults)
    ctx.fn_min_arity.insert(name_for_min_arity, min_arity)
}

fn check_fn_decl_transaction(
    mut ctx: InferCtx, name: Str, type_params: List<TypeParam>,
    params: List<Param>, return_type: TypeExpr?,
    declared_effects: List<EffectExpr>?, body: Expr,
    is_pub: Bool, span: Span, self_type: Type?,
    registration_override: TypeScheme?, rebind_identity: Str?,
    obligation_checkpoint: Int
) -> HDecl {
    // This check owns the declaration's default metadata. Clear both halves
    // before entering transient scopes so impl-method seeds or earlier SCC
    // prechecks with the same spelling cannot leak into this owner.
    ctx.fn_defaults.remove(name)
    ctx.fn_min_arity.remove(name)

    // Save the registration scheme before entering the parameter scope: a
    // parameter is allowed to have the same spelling as its function.
    let registration_scheme = match registration_override {
        some(scheme) => {
            let exact_registration = scheme
            some(exact_registration)
        },
        none => ctx.env.lookup(name)
    }
    let registration_for_ownership = registration_scheme
    let ownership_contract = match registration_for_ownership {
        some(scheme) => ownership_from_fn_type(scheme.ty, params.len()),
        none => CALLABLE_BORROW_OWNED
    }
    let rebind_identity_for_key = rebind_identity
    let name_for_provenance_key = name
    let provenance_key = match rebind_identity_for_key {
        some(identity) => identity,
        none => name_for_provenance_key
    }
    // A failed or repeated check must never reuse provenance from an earlier
    // inline/SCC precheck of the same canonical function identity.
    let provenance_key_for_clear = provenance_key
    ctx.rebind_assoc_provenance.insert(provenance_key_for_clear, [])

    let saved_subst = ctx.subst
    ctx.subst = empty_subst()
    ctx.env.push_scope()

    let saved_tp_scope = map_clone(ctx.type_param_scope)
    let saved_qualified_assoc = map_clone(ctx.qualified_assoc_scope)
    for tp in type_params {
        let tv = ctx.env.fresh_var()
        let tv_for_scope = tv
        ctx.type_param_scope.insert(tp.name, tv_for_scope)
        let tv_for_binding = tv
        ctx.env.bind_mono(tp.name, tv_for_binding)
    }

    ctx.fn_bounds_stack.push(ctx.current_fn_bounds)
    let mut inherited_bounds: List<FnBoundsEntry> = []
    for ib in ctx.current_fn_bounds {
        let inherited_bound = ib
        inherited_bounds.push(inherited_bound)
    }
    ctx.current_fn_bounds = inherited_bounds
    for tp in type_params {
        match ctx.type_param_scope.get(tp.name) {
            some(tv) => match tv {
                Type::TypeVar { id, .. } => {
                    for bound in tp.bounds {
                        let bound_trait = resolve_trait_identity(ctx, bound.trait_name)
                        let bound_trait_for_entry = bound_trait
                        ctx.current_fn_bounds.push(FnBoundsEntry {
                            type_param_var_id: id,
                            trait_name: bound_trait_for_entry,
                            type_param_name: tp.name
                        })
                        // Expand supertrait bounds: if T: Ord and Ord: Eq, add T: Eq too
                        let bound_trait_for_supers = bound_trait
                        let supers = collect_all_supertraits(
                            ctx, bound_trait_for_supers)
                        for st_name in supers {
                            let supertrait_name = st_name
                            ctx.current_fn_bounds.push(FnBoundsEntry {
                                type_param_var_id: id,
                                trait_name: supertrait_name,
                                type_param_name: tp.name
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
    let mut ownership_param_index = 0
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
        let ptype_for_binding = ptype
        ctx.env.bind_mono(p.name, ptype_for_binding)
        let param_scheme = ctx.env.lookup(p.name)
        let param_def_id = match param_scheme {
            some(ps) => {
                let def_id_for_maps = ps.def_id
                match def_id_for_maps {
                    some(did) => {
                        let did_for_span = did
                        ctx.env.record_def_span(did_for_span, p.span)
                        let did_for_depth = did
                        ctx.var_lambda_depth.insert(
                            did_for_depth, ctx.lambda_depth)
                        if p.is_mutable {
                            let did_for_mutable = did
                            ctx.env.scope.mutable_vars.insert(did_for_mutable)
                            let did_for_mut_param = did
                            ctx.env.scope.mut_param_defs.insert(
                                did_for_mut_param)
                            // Auto-box mut value-type parameters (not self)
                            if p.name != "self" {
                                if is_mut_value_param_type_firebreak(
                                    ctx, ptype) {
                                    let did_for_boxing = did
                                    ctx.boxed_vars.insert(did_for_boxing)
                                }
                            }
                        } else {
                            let did_for_let = did
                            ctx.env.scope.let_defs.insert(did_for_let)
                        }
                    },
                    none => {}
                }
                ps.def_id
            },
            none => none
        }
        let ptype_for_hparam = ptype
        hparams.push(HParam {
            name: p.name, ty: ptype_for_hparam, def_id: param_def_id,
            flags: hparam_flags(p.is_mutable,
                callable_param_ownership(
                    ctx.env.types.ownership_metadata,
                    ownership_contract, ownership_param_index))
        })
        let ptype_for_param_types = ptype
        param_types.push(ptype_for_param_types)
        ownership_param_index = ownership_param_index + 1
    }

    // B-069: Infer default value expressions and store in hparams
    let mut default_hexprs: List<HExpr> = []
    let mut default_evidence_valid = true
    let mut min_arity = params.len()
    let mut pi = 0
    for p in params {
        match p.default_value {
            some(dv) => {
                let default_obligation_checkpoint =
                    pending_dict_checkpoint(ctx)
                // Generic defaults are shared metadata, not one caller
                // instantiation.  Hide caller-specific bound dictionaries
                // while checking them: ground/static evidence still resolves,
                // while dynamic evidence becomes an explicit pending failure.
                let saved_default_bounds = ctx.current_fn_bounds
                ctx.current_fn_bounds = []
                let default_result = some(
                    infer_expr(ctx, dv, ctx.subst)) catch { _ => none }
                ctx.current_fn_bounds = saved_default_bounds
                let dv_result = match default_result {
                    some(result) => result,
                    none => fail.raise(CompileError {})
                }
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
                register_default_bounded_callable_value_shadows(
                    ctx, dv_result.hexpr, ctx.subst)
                if !settle_default_pending_dicts(
                    ctx, default_obligation_checkpoint, ctx.subst) {
                    default_evidence_valid = false
                }
                assert_pending_dict_owner_closed(
                    ctx, default_obligation_checkpoint)
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
    let expected_ret_for_scope = expected_ret
    ctx.current_fn_return_type = some(expected_ret_for_scope)
    // Resolve while this owner's type-parameter and associated-type scopes
    // are live.  check_fn_body applies the payload constraints before drain.
    let owner_declared_effects = match declared_effects {
        some(de) => some(resolve_declared_effects(ctx, de)),
        none => none
    }

    let try_result = some(
        check_fn_body_catch_firebreak(
            ctx, provenance_key, registration_scheme, type_params, hparams,
            expected_ret, owner_declared_effects,
            body, saved_tp_scope, span,
            obligation_checkpoint
        )
    ) catch { _ => none }

    // Default expressions share the function's type variables, but their
    // dictionary evidence belongs to each CALLER instantiation.  Zonk only
    // types/effects here and preserve unresolved function-value provenance;
    // caller final-zonk resolves DictRefs with its substitution and bounds.
    let mut zonked_defaults: List<HExpr> = []
    match try_result {
        some(_) => {
            let zctx_defaults = ZonkCtx {
                subst: ctx.subst, names: map_new(),
                dict_resolver: none,
                ownership_metadata: some(ctx.env.types.ownership_metadata),
                require_exact_ownership: false
            }
            for dh in default_hexprs {
                zonked_defaults.push(zonk_expr(zctx_defaults, dh))
            }
        },
        none => {},
    }

    // Save complete bounds (inherited + own) before pop
    let complete_fn_bounds = ctx.current_fn_bounds

    // Cleanup
    ctx.current_fn_return_type = saved_fn_return
    ctx.env.pop_scope()
    ctx.type_param_scope = saved_tp_scope
    ctx.qualified_assoc_scope = saved_qualified_assoc
    ctx.current_fn_bounds = match ctx.fn_bounds_stack.pop() {
        some(prev) => {
            let restored_bounds = prev
            restored_bounds
        },
        none => []
    }
    ctx.subst = saved_subst

    let fn_result = match try_result {
        some(r) => r,
        none => fail.raise(CompileError {})
    }
    // Invalid default evidence has already produced its precise E0503.  Abort
    // only after restoring all transient owner scopes, and never publish the
    // shared fn_defaults value that carried caller-owned inference variables.
    let registration_for_error_rebind = registration_scheme
    if !default_evidence_valid {
        // Phase 1 has already made a top-level declaration visible to later
        // bodies.  Replace that preregistered scheme with ErrorType before
        // recovery continues: otherwise later calls reinterpret the omitted
        // default as a required parameter and cascade with E0301 / bound
        // failures.  Impl methods use their origin-keyed registration path and
        // are rolled back by the enclosing impl owner, so do not rebind an
        // unrelated same-spelled global here.
        if rebind_identity.is_none() {
            match registration_for_error_rebind {
                some(scheme) => ctx.env.rebind(name, TypeScheme {
                    ty: Type::ErrorType,
                    type_vars: [],
                    bounds: [],
                    def_id: scheme.def_id
                }),
                none => {}
            }
        }
        fail.raise(CompileError {})
    }
    let final_params = fn_result.params
    let final_ret = fn_result.ret
    let final_effects = fn_result.eff
    let final_body = fn_result.body

    // Check: main function must not have unhandled custom effects.
    // io/fail/mut are allowed (io is implicit, fail has default handler, mut is Cell-based),
    // but CustomEffect requires an explicit handler and cannot propagate past main.
    // Exception: effects where all ops have default handlers are allowed (auto-injected evidence).
    if name == "main" || name.ends_with("$$_main") {
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
                        let effect_display = nominal_display_name(eff_name)
                        report_unhandled_main_effect_firebreak(
                            ctx, effect_display, span)
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

    // The registration captured before entering parameter scope is the sole
    // declaration identity. In particular, an impl method must never fall back
    // to an unrelated same-spelled top-level binding.
    let fn_def_id = match registration_scheme {
        some(scheme) => scheme.def_id,
        none => none
    }
    let fn_def_id_for_span = fn_def_id
    let function_span_for_def = span
    record_fn_def_span_firebreak(
        ctx, fn_def_id_for_span, function_span_for_def)

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
    let name_for_mut_params = name
    ctx.fn_mut_params.insert(name_for_mut_params, mut_flags)

    // B-069: Register default parameter info for call-site expansion
    if zonked_defaults.len() > 0 {
        publish_fn_defaults_firebreak(
            ctx, name, zonked_defaults, min_arity)
    }

    let final_name = name
    let final_span = span
    HDecl::Fn {
        name: final_name, def_id: fn_def_id, type_params: type_params,
        params: final_params, return_type: final_ret, effects: final_effects,
        body: final_body, is_pub: is_pub, trait_bounds: trait_bounds,
        span: final_span
    }
}

fn check_test_decl(mut ctx: InferCtx, description: Str, body: Expr, span: Span) -> HDecl {
    let obligation_checkpoint = pending_dict_checkpoint(ctx)
    let saved_subst = ctx.subst
    ctx.subst = empty_subst()
    ctx.env.push_scope()
    let body_result = some(infer_block(ctx, body, none)) catch { _ => none }

    let final_body = match body_result {
        some(br) => {
            ctx.subst = br.subst
            register_bounded_callable_value_shadows(
                ctx, br.hexpr, ctx.subst)
            drain_pending_dicts(ctx, obligation_checkpoint, ctx.subst)
            let subst_for_zonk = ctx.subst
            let zctx = make_decl_zonk_ctx_firebreak(
                ctx, subst_for_zonk, map_new())
            let result = zonk_block(zctx, br.hexpr)
            ctx.subst = saved_subst
            result
        },
        none => {
            rollback_pending_dicts(ctx, obligation_checkpoint)
            ctx.subst = saved_subst
            // The scope must be restored before re-raising the declaration
            // error; the success path pops once below after value-zonk.
            ctx.env.pop_scope()
            fail.raise(CompileError {})
        }
    }
    ctx.env.pop_scope()

    HDecl::Test { description: description, body: final_body, span: span }
}

// ============================================================
// Public entry point
// ============================================================

fn resolve_delegate_check_target_firebreak(
    ctx: InferCtx, target_type: Str
) -> Str {
    let exact_target = target_type
    resolve_nominal_identity(ctx, exact_target)
}

fn expand_checked_delegate_impls_firebreak(
    mut ctx: InferCtx,
    canonical_target: Str,
    type_params: List<TypeParam>,
    field: Str,
    trait_names: List<Str>,
    span: Span
) -> List<HDecl> {
    let delegate_target = canonical_target
    let delegate_type_params = type_params
    let delegate_field = field
    let delegate_traits = trait_names
    let delegate_span = span
    expand_delegate_impls(
        ctx, delegate_target, delegate_type_params,
        delegate_field, delegate_traits, delegate_span)
}

fn check_one_decl(
    mut ctx: InferCtx, decl: Decl, frame_decl_index: Int?,
    mut hdecls: List<HDecl>
) {
    let hd = check_decl(ctx, decl, frame_decl_index)

    // Update fn effects before push (modifies ctx.env, not hdecls)
    match hd {
        HDecl::Fn { name, effects, .. } => {
            if effects.effects.len() > 0 {
                let effect_owner_name = name
                let checked_effects = effects
                update_fn_effects(
                    ctx.env, effect_owner_name, checked_effects)
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
            let canonical_target = resolve_delegate_check_target_firebreak(
                ctx, target_type)
            for m in methods {
                match m {
                    Decl::Delegate { field, trait_names, span: dspan } => {
                        let delegate_impls = expand_checked_delegate_impls_firebreak(
                            ctx, canonical_target, type_params,
                            field, trait_names, dspan)
                        for di in delegate_impls {
                            let delegate_decl = di
                            delegate_decls.push(delegate_decl)
                        }
                    },
                    _ => {}
                }
            }
        },
        _ => {}
    }

    // Only push after everything succeeded
    hdecls.push(hd)
    for di in delegate_decls {
        let delegate_decl = di
        hdecls.push(delegate_decl)
    }
}

// B-122: Check a declaration and rebind fn/impl-method types with resolved types.
// After check_fn_decl, the registered type scheme still has unresolved fresh vars
// from Pass 1. Rebinding replaces it with the fully-resolved type from inference,
// so that subsequent callers (in SCC topological order) see correct return types.
fn check_one_decl_with_rebind(
    mut ctx: InferCtx, decl: Decl, frame_decl_index: Int?,
    mut hdecls: List<HDecl>
) {
    let hd = check_decl(ctx, decl, frame_decl_index)

    // Update fn effects and rebind resolved types
    match hd {
        HDecl::Fn { name, params, return_type, effects, span, .. } => {
            // update_fn_effects installs check-time effect variables into the
            // live scheme.  Snapshot the authoritative registration identity
            // first so effect-only type parameters still map back to the same
            // variables owned by type_vars / SchemeBounds during rebind.
            let registration_scheme = ctx.env.lookup(name)
            if effects.effects.len() > 0 {
                let effect_owner_name = name
                let checked_effects = effects
                update_fn_effects(
                    ctx.env, effect_owner_name, checked_effects)
            }
            // B-122: Rebind with fully-resolved type from inference
            rebind_fn_type(
                ctx, name, params, return_type, effects, span,
                registration_scheme)
        },
        // Impl methods are rebound against their exact ImplEntry schemes in
        // check_impl_decl_canonical; a bare method spelling is not an identity.
        HDecl::Impl { .. } => {},
        _ => {}
    }

    // Delegate expansion (same as check_one_decl)
    let mut delegate_decls: List<HDecl> = []
    match decl {
        Decl::Impl { target_type, type_params, methods, span, .. } => {
            let canonical_target = resolve_delegate_check_target_firebreak(
                ctx, target_type)
            for m in methods {
                match m {
                    Decl::Delegate { field, trait_names, span: dspan } => {
                        let delegate_impls = expand_checked_delegate_impls_firebreak(
                            ctx, canonical_target, type_params,
                            field, trait_names, dspan)
                        for di in delegate_impls {
                            let delegate_decl = di
                            delegate_decls.push(delegate_decl)
                        }
                    },
                    _ => {}
                }
            }
        },
        _ => {}
    }

    hdecls.push(hd)
    for di in delegate_decls {
        let delegate_decl = di
        hdecls.push(delegate_decl)
    }
}

// Locate one inline function by its exact canonical SCC node and pre-check it
// in the same module context used by the final HIR pass.  This lets recursive
// call-graph ordering cross ModBlock boundaries without flattening the emitted
// HIR or losing self/super import resolution.
fn precheck_one_decl_with_rebind_firebreak(
    mut ctx: InferCtx,
    decl: Decl,
    decl_index: Int,
    mut discarded: List<HDecl>
) {
    let precheck_decl = decl
    let precheck_index = decl_index
    check_one_decl_with_rebind(
        ctx, precheck_decl, some(precheck_index), discarded)
}

fn precheck_inline_fn_in_mod_body(
    mut ctx: InferCtx,
    mod_name: Str,
    uses: List<UseDecl>,
    decls: List<Decl>,
    required_effects: List<EffectExpr>?,
    target_name: Str,
    project_frame_active: Bool
) -> Bool {
    if !project_frame_active {
        insert_mod_aliases(ctx, mod_name, decls, false)
        resolve_mod_uses(ctx, uses, true)
    }
    match required_effects {
        some(req_effs) => {
            let cap = resolve_declared_effects(ctx, req_effs)
            ctx.mod_unsafe_allowed = cap.effects.any(fn(e) {
                match e { Effect::UnsafeEffect => true, _ => false }
            })
        },
        none => { ctx.mod_unsafe_allowed = false }
    }

    let mut found = false
    for decl_index in 0..decls.len() {
        let decl = decls.get(decl_index).unwrap()
        let prefixed = prefix_decl_name(mod_name, decl)
        match prefixed {
            Decl::Fn { name, .. } => {
                if name == target_name {
                    let mut discarded: List<HDecl> = []
                    let result = some(
                        precheck_one_decl_with_rebind_firebreak(
                            ctx, prefixed, decl_index,
                            discarded)) catch { _ => none }
                    found = true
                }
            },
            Decl::ModBlock { name, uses: nested_uses, decls: nested_decls, required_effects: nested_required, .. } => {
                if !found && precheck_inline_fn_in_mod(
                    ctx, name, nested_uses, nested_decls,
                    nested_required, target_name, decl_index) {
                    found = true
                }
            },
            _ => {}
        }
        if found { break }
    }
    found
}

fn precheck_inline_fn_in_mod(
    mut ctx: InferCtx,
    mod_name: Str,
    uses: List<UseDecl>,
    decls: List<Decl>,
    required_effects: List<EffectExpr>?,
    target_name: Str,
    frame_decl_index: Int
) -> Bool {
    let project_active = ctx.project_namespace_file_key.is_some()
    let mut entered_project_frame = false
    if project_active {
        entered_project_frame = enter_project_child_frame(
            ctx, frame_decl_index)
        if !entered_project_frame {
            panic("unreachable: resolver plan missing inline precheck frame")
        }
    }
    let segments = mod_name.split("::")
    let simple_name = segments.get(segments.len() - 1).unwrap_or(mod_name)
    ctx.mod_path_stack.push(simple_name)
    let prev_unsafe_allowed = ctx.mod_unsafe_allowed
    let result = precheck_inline_fn_in_mod_body(
        ctx, mod_name, uses, decls, required_effects,
        target_name, project_active) catch { _ => {
            ctx.mod_unsafe_allowed = prev_unsafe_allowed
            let _ = ctx.mod_path_stack.pop()
            if entered_project_frame {
                let _ = exit_project_namespace_frame(ctx)
            }
            fail.raise(CompileError {})
        }
    }
    ctx.mod_unsafe_allowed = prev_unsafe_allowed
    let _ = ctx.mod_path_stack.pop()
    if entered_project_frame {
        let _ = exit_project_namespace_frame(ctx)
    }
    result
}

fn precheck_inline_fn(
    mut ctx: InferCtx, decls: List<Decl>, target_name: Str
) -> Bool {
    for decl_index in 0..decls.len() {
        let decl = decls.get(decl_index).unwrap()
        match decl {
            Decl::ModBlock { name, uses, decls: mod_decls, required_effects, .. } => {
                if precheck_inline_fn_in_mod(
                    ctx, name, uses, mod_decls, required_effects,
                    target_name, decl_index) { return true }
            },
            _ => {}
        }
    }
    false
}

fn collect_impl_scc_fn_names(
    decls: List<Decl>, prefix: Str?, mut names: Set<Str>
) {
    for decl in decls {
        match decl {
            Decl::Impl { methods, .. } => {
                for method in methods {
                    match method {
                        Decl::Fn { name, .. } => {
                            let full_name = match prefix {
                                some(p) => "${p}::${name}",
                                none => name
                            }
                            names.insert(full_name)
                        },
                        _ => {}
                    }
                }
            },
            Decl::ModBlock { name, decls: nested, .. } => {
                let nested_prefix = match prefix {
                    some(p) => "${p}::${name}",
                    none => name
                }
                collect_impl_scc_fn_names(nested, some(nested_prefix), names)
            },
            _ => {}
        }
    }
}

fn inline_dependency_closure(
    graph: Map<Str, List<Str>>, roots: Set<Str>, blocked: Set<Str>
) -> Set<Str> {
    let mut closure: Set<Str> = set_new()
    let mut pending: List<Str> = []
    for root in roots {
        let root_for_closure = root
        closure.insert(root_for_closure)
        let root_for_pending = root
        pending.push(root_for_pending)
    }
    while pending.len() > 0 {
        match pending.pop() {
            some(node) => match graph.get(node) {
                some(deps) => {
                    for dep in deps {
                        if !blocked.contains(dep) && !dep.starts_with("impl::") && !closure.contains(dep) {
                            let dep_for_closure = dep
                            closure.insert(dep_for_closure)
                            let dep_for_pending = dep
                            pending.push(dep_for_pending)
                        }
                    }
                },
                none => {}
            },
            none => {}
        }
    }
    closure
}

fn precheck_top_level_fn_at(
    mut ctx: InferCtx, decls: List<Decl>, index: Int
) {
    match decls.get(index) {
        some(decl) => {
            let mut discarded: List<HDecl> = []
            let result = some(check_one_decl_with_rebind(
                ctx, decl, none, discarded)) catch { _ => none }
        },
        none => {}
    }
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
// A checked function can have its canonical value binding plus source-spelled,
// inline-published, and consumer aliases. File-module canonical names contain
// `$$_`, while single-file inline names do not, so exact origin — never the
// spelling shape — is the selection criterion. Every alias
// deliberately has its own lexical DefId, whose recorded origin is flattened
// to the canonical binding. Refresh every exact-origin alias together with the
// canonical scheme; otherwise a pub-use chain can keep the registration-time
// EMPTY_ROW / unresolved return variables. Each fresh alias DefId must survive
// the refresh so local shadowing and provenance remain lexical.
fn insert_rebound_alias_scheme_firebreak(
    mut variables: Map<Str, TypeScheme>,
    alias_name: Str,
    scheme: TypeScheme,
    alias_def_id: Int?
) {
    let scheme_for_ty = scheme
    let scheme_for_type_vars = scheme
    let scheme_for_bounds = scheme
    let rebound_alias_name = alias_name
    let rebound_ty = scheme_for_ty.ty
    let rebound_type_vars = scheme_for_type_vars.type_vars
    let rebound_bounds = scheme_for_bounds.bounds
    let exact_alias_def_id = alias_def_id
    variables.insert(rebound_alias_name, TypeScheme {
        ty: rebound_ty,
        type_vars: rebound_type_vars,
        bounds: rebound_bounds,
        def_id: exact_alias_def_id
    })
}

fn rebind_fn_scheme_with_alias(mut ctx: InferCtx, name: Str, scheme: TypeScheme) {
    let canonical_name_for_rebind = name
    let canonical_scheme_for_rebind = scheme
    ctx.env.rebind(canonical_name_for_rebind, canonical_scheme_for_rebind)

    // Update the map entry in its owning scope rather than calling
    // TypeEnv.rebind(alias_name): two lexical scopes may contain the same
    // spelling, and only the DefId whose exact origin is `name` may change.
    for scope in ctx.env.scope.scopes {
        let mut aliases = scope.variables.entries()
        aliases.sort_by(compare_by_first)
        for entry in aliases {
            let (alias_name, alias_scheme) = entry
            match alias_scheme.def_id {
                some(alias_id) => match ctx.use_aliases.get(alias_id) {
                    some(origin) => {
                        if origin == name {
                            insert_rebound_alias_scheme_firebreak(
                                scope.variables, alias_name, scheme,
                                alias_scheme.def_id)
                        }
                    },
                    none => {}
                },
                none => {}
            }
        }
    }
}

fn type_contains_fn(ty: Type) -> Bool {
    match ty {
        Type::FnType { .. } => true,
        Type::StructType { type_params, .. } => {
            for tp in type_params {
                if type_contains_fn(tp) { return true }
            }
            false
        },
        Type::EnumType { type_params, .. } => {
            for tp in type_params {
                if type_contains_fn(tp) { return true }
            }
            false
        },
        Type::GenericType { base, args } => {
            if type_contains_fn(base) { return true }
            for arg in args {
                if type_contains_fn(arg) { return true }
            }
            false
        },
        Type::RecordType { fields, .. } => {
            for field in fields {
                if type_contains_fn(field.ty) { return true }
            }
            false
        },
        Type::EffectRowType { effects, .. } => {
            for eff in effects {
                match eff {
                    Effect::FailEffect { error_type } => {
                        if type_contains_fn(error_type) { return true }
                    },
                    Effect::MutEffect { state_type } => {
                        if type_contains_fn(state_type) { return true }
                    },
                    Effect::CustomEffect { type_args, .. } => {
                        for arg in type_args {
                            if type_contains_fn(arg) { return true }
                        }
                    },
                    _ => {}
                }
            }
            false
        },
        Type::TupleType { elements } => {
            for element in elements {
                if type_contains_fn(element) { return true }
            }
            false
        },
        Type::PtrType { pointee } => type_contains_fn(pointee),
        _ => false
    }
}

fn report_rebind_shape_mismatch(
    mut ctx: InferCtx, fn_name: Str, reg_ty: Type, check_ty: Type, span: Span
) {
    let display = nominal_display_name(fn_name)
    let expected = type_to_string(reg_ty)
    let actual = type_to_string(check_ty)
    let _ = type_error(ctx.sink, E0301,
        "Cannot safely rebind higher-order parameter in '${display}': registered shape '${expected}' does not match inferred shape '${actual}'",
        span,
        DiagnosticContext::TypeMismatch {
            expected: expected, actual: actual,
            expression: some("higher-order parameter rebind")
        })
}

// A check-time variable is safe to write into a scheme only when the existing
// positional mapping takes it back to a variable already owned by that scheme
// (or to a concrete type). Named variables and variables carrying var_bounds
// may denote declared generics/associated types; generalizing them as a fresh
// anonymous fail payload would discard their bound provenance.
fn audit_fail_payload_var(
    mut ctx: InferCtx,
    fn_name: Str,
    id: Int,
    var_name: Str?,
    mapping: Map<Int, Type>,
    original_scheme_vars: Set<Int>,
    mut unsafe_vars: Set<Int>,
    mut diagnosed_vars: Set<Int>,
    span: Span
) {
    // Conflicted or ownerless associated-type provenance is pre-seeded by
    // rebind_fn_type. Reject it only if it is about to escape through a newly
    // written fail payload; unrelated associated types remain untouched.
    if unsafe_vars.contains(id) {
        if !diagnosed_vars.contains(id) {
            diagnosed_vars.insert(id)
            let display = nominal_display_name(fn_name)
            let detail = "owner-qualified associated type has no unique registration-time target"
            let _ = type_error(ctx.sink, E0503,
                "Cannot rebind fail payload in '${display}': ${detail}",
                span,
                DiagnosticContext::TraitError { detail: detail })
        }
        return
    }

    let var_name_for_mapping = var_name
    let mapped = apply_subst_map(
        mapping, Type::TypeVar { id: id, name: var_name_for_mapping })
    let mut mapped_vars: Set<Int> = set_new()
    collect_free_vars(mapped, mapped_vars)
    let mut new_vars: List<Int> = []
    for mapped_id in mapped_vars {
        if !original_scheme_vars.contains(mapped_id) {
            let new_var_id = mapped_id
            new_vars.push(new_var_id)
        }
    }
    if new_vars.len() == 0 { return }

    let var_name_for_check = var_name
    let check_name = match var_name_for_check {
        some(n) => n,
        none => ""
    }
    let mut trait_names: Set<Str> = set_new()
    match ctx.env.scope.var_bounds.get(id) {
        some(bounds) => {
            for trait_name in bounds {
                let bound_trait_name = trait_name
                trait_names.insert(bound_trait_name)
            }
        },
        none => {}
    }
    for mapped_id in new_vars {
        match ctx.env.scope.var_bounds.get(mapped_id) {
            some(bounds) => {
                for trait_name in bounds {
                    let bound_trait_name = trait_name
                    trait_names.insert(bound_trait_name)
                }
            },
            none => {}
        }
    }
    if check_name == "" && trait_names.len() == 0 { return }

    let id_for_unsafe_insert = id
    unsafe_vars.insert(id_for_unsafe_insert)
    for mapped_id in new_vars {
        let unsafe_mapped_id = mapped_id
        unsafe_vars.insert(unsafe_mapped_id)
    }
    let id_for_diagnosed_check = id
    if diagnosed_vars.contains(id_for_diagnosed_check) { return }
    let id_for_diagnosed_insert = id
    diagnosed_vars.insert(id_for_diagnosed_insert)
    for mapped_id in new_vars {
        let diagnosed_mapped_id = mapped_id
        diagnosed_vars.insert(diagnosed_mapped_id)
    }

    let display = nominal_display_name(fn_name)
    let mut sorted_traits = trait_names.to_list()
    sorted_traits.sort()
    let traits_display = sorted_traits.join(", ")
    let detail = if check_name != "" && sorted_traits.len() > 0 {
        "named check-time variable '${check_name}' has untracked obligations: ${traits_display}"
    } else if check_name != "" {
        "named check-time variable '${check_name}' has no registration-time provenance"
    } else {
        "check-time variable has untracked obligations: ${traits_display}"
    }
    let _ = type_error(ctx.sink, E0503,
        "Cannot rebind fail payload in '${display}': ${detail}",
        span,
        DiagnosticContext::TraitError { detail: detail })
}

fn audit_fail_payload_type(
    mut ctx: InferCtx,
    fn_name: Str,
    ty: Type,
    mapping: Map<Int, Type>,
    original_scheme_vars: Set<Int>,
    mut unsafe_vars: Set<Int>,
    mut diagnosed_vars: Set<Int>,
    span: Span
) {
    match ty {
        Type::TypeVar { id, name } =>
            {
                let payload_id = id
                let payload_name = name
                audit_fail_payload_var(
                    ctx, fn_name, payload_id, payload_name,
                    mapping, original_scheme_vars,
                    unsafe_vars, diagnosed_vars, span)
            },
        Type::FnType { params, return_type, meta } => {
            for param in params {
                audit_fail_payload_type(
                    ctx, fn_name, param, mapping, original_scheme_vars,
                    unsafe_vars, diagnosed_vars, span
                )
            }
            audit_fail_payload_type(
                ctx, fn_name, return_type, mapping, original_scheme_vars,
                unsafe_vars, diagnosed_vars, span
            )
            for eff in meta.effects.effects {
                match eff {
                    Effect::FailEffect { error_type } =>
                        audit_fail_payload_type(
                            ctx, fn_name, error_type, mapping, original_scheme_vars,
                            unsafe_vars, diagnosed_vars, span
                        ),
                    Effect::MutEffect { state_type } =>
                        audit_fail_payload_type(
                            ctx, fn_name, state_type, mapping, original_scheme_vars,
                            unsafe_vars, diagnosed_vars, span
                        ),
                    Effect::CustomEffect { type_args, .. } => {
                        for arg in type_args {
                            audit_fail_payload_type(
                                ctx, fn_name, arg, mapping, original_scheme_vars,
                                unsafe_vars, diagnosed_vars, span
                            )
                        }
                    },
                    _ => {}
                }
            }
        },
        Type::StructType { type_params, .. } => {
            for tp in type_params {
                audit_fail_payload_type(
                    ctx, fn_name, tp, mapping, original_scheme_vars,
                    unsafe_vars, diagnosed_vars, span
                )
            }
        },
        Type::EnumType { type_params, .. } => {
            for tp in type_params {
                audit_fail_payload_type(
                    ctx, fn_name, tp, mapping, original_scheme_vars,
                    unsafe_vars, diagnosed_vars, span
                )
            }
        },
        Type::GenericType { base, args } => {
            audit_fail_payload_type(
                ctx, fn_name, base, mapping, original_scheme_vars,
                unsafe_vars, diagnosed_vars, span
            )
            for arg in args {
                audit_fail_payload_type(
                    ctx, fn_name, arg, mapping, original_scheme_vars,
                    unsafe_vars, diagnosed_vars, span
                )
            }
        },
        Type::RecordType { fields, .. } => {
            for field in fields {
                audit_fail_payload_type(
                    ctx, fn_name, field.ty, mapping, original_scheme_vars,
                    unsafe_vars, diagnosed_vars, span
                )
            }
        },
        Type::EffectRowType { effects, .. } => {
            for eff in effects {
                match eff {
                    Effect::FailEffect { error_type } =>
                        audit_fail_payload_type(
                            ctx, fn_name, error_type, mapping, original_scheme_vars,
                            unsafe_vars, diagnosed_vars, span
                        ),
                    Effect::MutEffect { state_type } =>
                        audit_fail_payload_type(
                            ctx, fn_name, state_type, mapping, original_scheme_vars,
                            unsafe_vars, diagnosed_vars, span
                        ),
                    Effect::CustomEffect { type_args, .. } => {
                        for arg in type_args {
                            audit_fail_payload_type(
                                ctx, fn_name, arg, mapping, original_scheme_vars,
                                unsafe_vars, diagnosed_vars, span
                            )
                        }
                    },
                    _ => {}
                }
            }
        },
        Type::TupleType { elements } => {
            for element in elements {
                audit_fail_payload_type(
                    ctx, fn_name, element, mapping, original_scheme_vars,
                    unsafe_vars, diagnosed_vars, span
                )
            }
        },
        Type::PtrType { pointee } =>
            audit_fail_payload_type(
                ctx, fn_name, pointee, mapping, original_scheme_vars,
                unsafe_vars, diagnosed_vars, span
            ),
        _ => {}
    }
}

fn type_contains_exact(
    metadata: OwnershipMetadata, ty: Type, needle: Type
) -> Bool {
    if types_equal_with_ownership(metadata, ty, needle) { return true }
    match ty {
        Type::FnType { params, return_type, meta } => {
            for param in params {
                if type_contains_exact(metadata, param, needle) { return true }
            }
            if type_contains_exact(metadata, return_type, needle) { return true }
            for eff in meta.effects.effects {
                match eff {
                    Effect::FailEffect { error_type } => {
                        if type_contains_exact(metadata, error_type, needle) { return true }
                    },
                    Effect::MutEffect { state_type } => {
                        if type_contains_exact(metadata, state_type, needle) { return true }
                    },
                    Effect::CustomEffect { type_args, .. } => {
                        for arg in type_args {
                            if type_contains_exact(metadata, arg, needle) { return true }
                        }
                    },
                    _ => {}
                }
            }
            false
        },
        Type::StructType { type_params, .. } => {
            for param in type_params {
                if type_contains_exact(metadata, param, needle) { return true }
            }
            false
        },
        Type::EnumType { type_params, .. } => {
            for param in type_params {
                if type_contains_exact(metadata, param, needle) { return true }
            }
            false
        },
        Type::GenericType { base, args } => {
            if type_contains_exact(metadata, base, needle) { return true }
            for arg in args {
                if type_contains_exact(metadata, arg, needle) { return true }
            }
            false
        },
        Type::RecordType { fields, .. } => {
            for field in fields {
                if type_contains_exact(metadata, field.ty, needle) { return true }
            }
            false
        },
        Type::EffectRowType { effects, .. } => {
            for eff in effects {
                match eff {
                    Effect::FailEffect { error_type } => {
                        if type_contains_exact(metadata, error_type, needle) { return true }
                    },
                    Effect::MutEffect { state_type } => {
                        if type_contains_exact(metadata, state_type, needle) { return true }
                    },
                    Effect::CustomEffect { type_args, .. } => {
                        for arg in type_args {
                            if type_contains_exact(metadata, arg, needle) { return true }
                        }
                    },
                    _ => {}
                }
            }
            false
        },
        Type::TupleType { elements } => {
            for element in elements {
                if type_contains_exact(metadata, element, needle) { return true }
            }
            false
        },
        Type::PtrType { pointee } =>
            type_contains_exact(metadata, pointee, needle),
        _ => false
    }
}

fn unsafe_structured_assoc_origin(
    ctx: InferCtx, fn_name: Str, payload: Type
) -> Str? {
    match ctx.rebind_assoc_provenance.get(fn_name) {
        some(entries) => {
            for entry in entries {
                match entry.check_type {
                    Type::TypeVar { .. } => {},
                    checked_shape => {
                        let represented_by_scheme = match entry.registration_type {
                            some(registration_shape) =>
                                types_equal_with_ownership(
                                    ctx.env.types.ownership_metadata,
                                    checked_shape, registration_shape
                                ),
                            none => false
                        }
                        if !represented_by_scheme &&
                           type_contains_exact(
                               ctx.env.types.ownership_metadata,
                               payload, checked_shape
                           ) {
                            let trait_display = nominal_display_name(entry.trait_name)
                            return some(
                                "${entry.owner_name}::${entry.assoc_name} (${trait_display})"
                            )
                        }
                    }
                }
            }
        },
        none => {}
    }
    none
}

fn audit_fail_row(
    mut ctx: InferCtx,
    fn_name: Str,
    row: EffectRow,
    mapping: Map<Int, Type>,
    original_scheme_vars: Set<Int>,
    mut unsafe_vars: Set<Int>,
    mut diagnosed_vars: Set<Int>,
    span: Span
) {
    for eff in row.effects {
        match eff {
            Effect::FailEffect { error_type } => {
                match unsafe_structured_assoc_origin(ctx, fn_name, error_type) {
                    some(origin) => {
                        let display = nominal_display_name(fn_name)
                        let detail = "associated type '${origin}' was constrained to a structure that the registration scheme cannot represent"
                        let _ = type_error(ctx.sink, E0503,
                            "Cannot rebind fail payload in '${display}': ${detail}",
                            span,
                            DiagnosticContext::TraitError { detail: detail })
                    },
                    none => {}
                }
                audit_fail_payload_type(
                    ctx, fn_name, error_type, mapping, original_scheme_vars,
                    unsafe_vars, diagnosed_vars, span
                )
            },
            _ => {}
        }
    }
}

fn audit_fail_rows_in_type(
    mut ctx: InferCtx,
    fn_name: Str,
    ty: Type,
    mapping: Map<Int, Type>,
    original_scheme_vars: Set<Int>,
    mut unsafe_vars: Set<Int>,
    mut diagnosed_vars: Set<Int>,
    span: Span
) {
    match ty {
        Type::FnType { params, return_type, meta } => {
            audit_fail_row(
                ctx, fn_name, meta.effects, mapping, original_scheme_vars,
                unsafe_vars, diagnosed_vars, span
            )
            for param in params {
                audit_fail_rows_in_type(
                    ctx, fn_name, param, mapping, original_scheme_vars,
                    unsafe_vars, diagnosed_vars, span
                )
            }
            audit_fail_rows_in_type(
                ctx, fn_name, return_type, mapping, original_scheme_vars,
                unsafe_vars, diagnosed_vars, span
            )
        },
        Type::StructType { type_params, .. } => {
            for tp in type_params {
                audit_fail_rows_in_type(
                    ctx, fn_name, tp, mapping, original_scheme_vars,
                    unsafe_vars, diagnosed_vars, span
                )
            }
        },
        Type::EnumType { type_params, .. } => {
            for tp in type_params {
                audit_fail_rows_in_type(
                    ctx, fn_name, tp, mapping, original_scheme_vars,
                    unsafe_vars, diagnosed_vars, span
                )
            }
        },
        Type::GenericType { base, args } => {
            audit_fail_rows_in_type(
                ctx, fn_name, base, mapping, original_scheme_vars,
                unsafe_vars, diagnosed_vars, span
            )
            for arg in args {
                audit_fail_rows_in_type(
                    ctx, fn_name, arg, mapping, original_scheme_vars,
                    unsafe_vars, diagnosed_vars, span
                )
            }
        },
        Type::RecordType { fields, .. } => {
            for field in fields {
                audit_fail_rows_in_type(
                    ctx, fn_name, field.ty, mapping, original_scheme_vars,
                    unsafe_vars, diagnosed_vars, span
                )
            }
        },
        Type::TupleType { elements } => {
            for element in elements {
                audit_fail_rows_in_type(
                    ctx, fn_name, element, mapping, original_scheme_vars,
                    unsafe_vars, diagnosed_vars, span
                )
            }
        },
        Type::PtrType { pointee } =>
            audit_fail_rows_in_type(
                ctx, fn_name, pointee, mapping, original_scheme_vars,
                unsafe_vars, diagnosed_vars, span
            ),
        _ => {}
    }
}

// Preserve the registration-time parameter skeleton. Checked shapes are used
// only to update effect rows of structurally corresponding function nodes.
// The one expansion is an unquantified registration TypeVar refined directly
// to a FnType; this is required for unannotated higher-order parameters.
fn rebind_type_var_shape_firebreak(id: Int, name: Str?) -> Type {
    let shape_name = name
    Type::TypeVar { id: id, name: shape_name }
}

fn rebind_fn_shape_firebreak(
    params: List<Type>, return_type: Type,
    effects: EffectRow, ownership_term: Int
) -> Type {
    let shape_params = params
    let shape_return = return_type
    let shape_effects = effects
    let shape_ownership_term = ownership_term
    Type::FnType {
        params: shape_params, return_type: shape_return,
        meta: fn_meta(shape_effects, shape_ownership_term)
    }
}

fn rebind_struct_shape_firebreak(name: Str, args: List<Type>) -> Type {
    let shape_name = name
    let shape_args = args
    Type::StructType { name: shape_name, type_params: shape_args }
}

fn rebind_enum_shape_firebreak(name: Str, args: List<Type>) -> Type {
    let shape_name = name
    let shape_args = args
    Type::EnumType { name: shape_name, type_params: shape_args }
}

fn rebind_tuple_shape_firebreak(elements: List<Type>) -> Type {
    let shape_elements = elements
    Type::TupleType { elements: shape_elements }
}

fn rebind_generic_shape_firebreak(base: Type, args: List<Type>) -> Type {
    let shape_base = base
    let shape_args = args
    Type::GenericType { base: shape_base, args: shape_args }
}

fn rebind_record_shape_firebreak(
    fields: List<RecordField>, tail: Int?, tail_name: Str?
) -> Type {
    let shape_fields = fields
    let shape_tail = tail
    let shape_tail_name = tail_name
    Type::RecordType {
        fields: shape_fields, tail: shape_tail, tail_name: shape_tail_name
    }
}

fn report_rebind_shape_mismatch_and_preserve_firebreak(
    mut ctx: InferCtx, fn_name: Str,
    registered: Type, checked: Type, span: Span
) -> Type {
    let report_registration = registered
    let preserved_registration = registered
    report_rebind_shape_mismatch(
        ctx, fn_name, report_registration, checked, span)
    preserved_registration
}

fn preserve_or_report_fn_shape_firebreak(
    mut ctx: InferCtx, fn_name: Str,
    registered: Type, checked: Type, span: Span
) -> Type {
    let registration_probe = registered
    let checked_probe = checked
    let report_registration = registered
    let preserved_registration = registered
    let report_checked = checked
    if type_contains_fn(registration_probe) || type_contains_fn(checked_probe) {
        report_rebind_shape_mismatch(
            ctx, fn_name, report_registration, report_checked, span)
    }
    preserved_registration
}

fn record_monomorphic_expansion_var_firebreak(
    mut monomorphic_expansion_vars: Set<Int>, free_id: Int
) {
    let recorded_id = free_id
    monomorphic_expansion_vars.insert(recorded_id)
}

fn record_diagnosed_unsafe_var_firebreak(
    mut diagnosed_vars: Set<Int>, mut unsafe_vars: Set<Int>, free_id: Int
) {
    let diagnosed_id = free_id
    let unsafe_id = free_id
    diagnosed_vars.insert(diagnosed_id)
    unsafe_vars.insert(unsafe_id)
}

fn rebind_param_type_pair_firebreak(
    mut ctx: InferCtx,
    fn_name: Str,
    registration_type: Type,
    checked_type: Type,
    mapping: Map<Int, Type>,
    original_type_vars: List<Int>,
    original_scheme_vars: Set<Int>,
    mut row_candidates: Set<Int>,
    mut monomorphic_expansion_vars: Set<Int>,
    mut unsafe_vars: Set<Int>,
    mut diagnosed_vars: Set<Int>,
    span: Span
) -> Type {
    let registration_view = registration_type
    let checked_view = checked_type
    rebind_param_fn_rows(
        ctx, fn_name, registration_view, checked_view, mapping,
        original_type_vars, original_scheme_vars,
        row_candidates, monomorphic_expansion_vars,
        unsafe_vars, diagnosed_vars, span)
}

fn append_rebound_type_pair_firebreak(
    mut rebound: List<Type>,
    mut ctx: InferCtx,
    fn_name: Str,
    registration_type: Type,
    checked_type: Type,
    mapping: Map<Int, Type>,
    original_type_vars: List<Int>,
    original_scheme_vars: Set<Int>,
    mut row_candidates: Set<Int>,
    mut monomorphic_expansion_vars: Set<Int>,
    mut unsafe_vars: Set<Int>,
    mut diagnosed_vars: Set<Int>,
    span: Span
) {
    let rebound_type = rebind_param_type_pair_firebreak(
        ctx, fn_name, registration_type, checked_type, mapping,
        original_type_vars, original_scheme_vars,
        row_candidates, monomorphic_expansion_vars,
        unsafe_vars, diagnosed_vars, span)
    rebound.push(rebound_type)
}

fn rebind_param_fn_rows(
    mut ctx: InferCtx,
    fn_name: Str,
    reg_ty: Type,
    check_ty: Type,
    mapping: Map<Int, Type>,
    original_type_vars: List<Int>,
    original_scheme_vars: Set<Int>,
    mut row_candidates: Set<Int>,
    mut monomorphic_expansion_vars: Set<Int>,
    mut unsafe_vars: Set<Int>,
    mut diagnosed_vars: Set<Int>,
    span: Span
) -> Type {
    match (reg_ty, check_ty) {
        (Type::TypeVar { id, name },
         Type::FnType { params: check_params, return_type: check_ret, meta: check_meta }) => {
            let check_meta_for_shape_effects = check_meta
            let check_meta_for_shape_ownership = check_meta
            let registered = rebind_type_var_shape_firebreak(id, name)
            let checked = rebind_fn_shape_firebreak(
                check_params, check_ret,
                check_meta_for_shape_effects.effects,
                check_meta_for_shape_ownership.ownership_term)
            if original_type_vars.contains(id) {
                return report_rebind_shape_mismatch_and_preserve_firebreak(
                    ctx, fn_name, registered, checked, span)
            }

            let checked_for_audit = checked
            let checked_for_mapping = checked
            audit_fail_rows_in_type(
                ctx, fn_name, checked_for_audit, mapping, original_scheme_vars,
                unsafe_vars, diagnosed_vars, span
            )
            let mapped = apply_subst_map(mapping, checked_for_mapping)
            let mut mapped_free: Set<Int> = set_new()
            collect_free_vars(mapped, mapped_free)
            let mut sorted_free = mapped_free.to_list()
            sorted_free.sort()
            for free_id in sorted_free {
                if !original_scheme_vars.contains(free_id) {
                    record_monomorphic_expansion_var_firebreak(
                        monomorphic_expansion_vars, free_id)
                    match ctx.env.scope.var_bounds.get(free_id) {
                        some(bounds) => {
                            if bounds.len() > 0 && !diagnosed_vars.contains(free_id) {
                                record_diagnosed_unsafe_var_firebreak(
                                    diagnosed_vars, unsafe_vars, free_id)
                                let mut traits = bounds.to_list()
                                traits.sort()
                                let display = nominal_display_name(fn_name)
                                let traits_display = traits.join(", ")
                                let detail = "inferred higher-order parameter variable has untracked obligations: ${traits_display}"
                                let _ = type_error(ctx.sink, E0503,
                                    "Cannot rebind inferred higher-order parameter in '${display}': ${detail}",
                                    span,
                                    DiagnosticContext::TraitError { detail: detail })
                            }
                        },
                        none => {}
                    }
                }
            }
            mapped
        },
        (Type::TypeVar { id, name }, checked) => {
            let registered = rebind_type_var_shape_firebreak(id, name)
            preserve_or_report_fn_shape_firebreak(
                ctx, fn_name, registered, checked, span)
        },
        (Type::FnType { params: reg_params, return_type: reg_ret, meta: reg_meta },
         Type::FnType { params: check_params, return_type: check_ret, meta: check_meta }) => {
            let reg_meta_for_effects = reg_meta
            let reg_meta_for_shape_effects = reg_meta
            let reg_meta_for_shape_ownership = reg_meta
            let reg_meta_for_result = reg_meta
            let check_meta_for_effects = check_meta
            let check_meta_for_shape_effects = check_meta
            let check_meta_for_shape_ownership = check_meta
            let reg_effects = reg_meta_for_effects.effects
            let check_effects = check_meta_for_effects.effects
            if reg_params.len() != check_params.len() {
                let registered = rebind_fn_shape_firebreak(
                    reg_params, reg_ret,
                    reg_meta_for_shape_effects.effects,
                    reg_meta_for_shape_ownership.ownership_term)
                let checked = rebind_fn_shape_firebreak(
                    check_params, check_ret,
                    check_meta_for_shape_effects.effects,
                    check_meta_for_shape_ownership.ownership_term)
                return report_rebind_shape_mismatch_and_preserve_firebreak(
                    ctx, fn_name, registered, checked, span)
            }

            audit_fail_row(
                ctx, fn_name, check_effects, mapping, original_scheme_vars,
                unsafe_vars, diagnosed_vars, span
            )
            let mapped_effects = apply_subst_row_map(mapping, check_effects)
            match reg_effects.tail {
                some(owner_id) => {
                    if original_type_vars.contains(owner_id) {
                        collect_free_vars(Type::EffectRowType {
                            effects: mapped_effects.effects, tail: mapped_effects.tail
                        }, row_candidates)
                    }
                },
                none => {}
            }

            let mut rebound_params: List<Type> = []
            let mut i = 0
            while i < reg_params.len() {
                match (reg_params.get(i), check_params.get(i)) {
                    (some(reg_param), some(check_param)) =>
                        append_rebound_type_pair_firebreak(
                            rebound_params,
                            ctx, fn_name, reg_param, check_param, mapping,
                            original_type_vars, original_scheme_vars,
                            row_candidates, monomorphic_expansion_vars,
                            unsafe_vars, diagnosed_vars, span
                        ),
                    _ => {}
                }
                i = i + 1
            }
            let rebound_ret = rebind_param_type_pair_firebreak(
                ctx, fn_name, reg_ret, check_ret, mapping,
                original_type_vars, original_scheme_vars,
                row_candidates, monomorphic_expansion_vars,
                unsafe_vars, diagnosed_vars, span
            )
            Type::FnType {
                params: rebound_params,
                return_type: rebound_ret,
                meta: fn_meta(mapped_effects, reg_meta_for_result.ownership_term)
            }
        },
        (Type::StructType { name: reg_name, type_params: reg_args },
         Type::StructType { name: check_name, type_params: check_args }) => {
            if reg_name != check_name || reg_args.len() != check_args.len() {
                let registered = rebind_struct_shape_firebreak(reg_name, reg_args)
                let checked = rebind_struct_shape_firebreak(check_name, check_args)
                return preserve_or_report_fn_shape_firebreak(
                    ctx, fn_name, registered, checked, span)
            }
            let mut rebound_args: List<Type> = []
            let mut i = 0
            while i < reg_args.len() {
                match (reg_args.get(i), check_args.get(i)) {
                    (some(reg_arg), some(check_arg)) =>
                        append_rebound_type_pair_firebreak(
                            rebound_args,
                            ctx, fn_name, reg_arg, check_arg, mapping,
                            original_type_vars, original_scheme_vars,
                            row_candidates, monomorphic_expansion_vars,
                            unsafe_vars, diagnosed_vars, span
                        ),
                    _ => {}
                }
                i = i + 1
            }
            rebind_struct_shape_firebreak(reg_name, rebound_args)
        },
        (Type::EnumType { name: reg_name, type_params: reg_args },
         Type::EnumType { name: check_name, type_params: check_args }) => {
            if reg_name != check_name || reg_args.len() != check_args.len() {
                let registered = rebind_enum_shape_firebreak(reg_name, reg_args)
                let checked = rebind_enum_shape_firebreak(check_name, check_args)
                return preserve_or_report_fn_shape_firebreak(
                    ctx, fn_name, registered, checked, span)
            }
            let mut rebound_args: List<Type> = []
            let mut i = 0
            while i < reg_args.len() {
                match (reg_args.get(i), check_args.get(i)) {
                    (some(reg_arg), some(check_arg)) =>
                        append_rebound_type_pair_firebreak(
                            rebound_args,
                            ctx, fn_name, reg_arg, check_arg, mapping,
                            original_type_vars, original_scheme_vars,
                            row_candidates, monomorphic_expansion_vars,
                            unsafe_vars, diagnosed_vars, span
                        ),
                    _ => {}
                }
                i = i + 1
            }
            rebind_enum_shape_firebreak(reg_name, rebound_args)
        },
        (Type::TupleType { elements: reg_elements },
         Type::TupleType { elements: check_elements }) => {
            if reg_elements.len() != check_elements.len() {
                let registered = rebind_tuple_shape_firebreak(reg_elements)
                let checked = rebind_tuple_shape_firebreak(check_elements)
                return preserve_or_report_fn_shape_firebreak(
                    ctx, fn_name, registered, checked, span)
            }
            let mut rebound_elements: List<Type> = []
            let mut i = 0
            while i < reg_elements.len() {
                match (reg_elements.get(i), check_elements.get(i)) {
                    (some(reg_element), some(check_element)) =>
                        append_rebound_type_pair_firebreak(
                            rebound_elements,
                            ctx, fn_name, reg_element, check_element, mapping,
                            original_type_vars, original_scheme_vars,
                            row_candidates, monomorphic_expansion_vars,
                            unsafe_vars, diagnosed_vars, span
                        ),
                    _ => {}
                }
                i = i + 1
            }
            Type::TupleType { elements: rebound_elements }
        },
        (Type::GenericType { base: reg_base, args: reg_args },
         Type::GenericType { base: check_base, args: check_args }) => {
            if reg_args.len() != check_args.len() {
                let registered = rebind_generic_shape_firebreak(reg_base, reg_args)
                let checked = rebind_generic_shape_firebreak(check_base, check_args)
                return preserve_or_report_fn_shape_firebreak(
                    ctx, fn_name, registered, checked, span)
            }
            let rebound_base = rebind_param_type_pair_firebreak(
                ctx, fn_name, reg_base, check_base, mapping,
                original_type_vars, original_scheme_vars,
                row_candidates, monomorphic_expansion_vars,
                unsafe_vars, diagnosed_vars, span
            )
            let mut rebound_args: List<Type> = []
            let mut i = 0
            while i < reg_args.len() {
                match (reg_args.get(i), check_args.get(i)) {
                    (some(reg_arg), some(check_arg)) =>
                        append_rebound_type_pair_firebreak(
                            rebound_args,
                            ctx, fn_name, reg_arg, check_arg, mapping,
                            original_type_vars, original_scheme_vars,
                            row_candidates, monomorphic_expansion_vars,
                            unsafe_vars, diagnosed_vars, span
                        ),
                    _ => {}
                }
                i = i + 1
            }
            Type::GenericType { base: rebound_base, args: rebound_args }
        },
        (Type::RecordType { fields: reg_fields, tail: reg_tail, tail_name: reg_tail_name },
         Type::RecordType { fields: check_fields, tail: check_tail, tail_name: check_tail_name }) => {
            let mut reliable = reg_fields.len() == check_fields.len()
            for reg_field in reg_fields {
                let mut found = false
                for check_field in check_fields {
                    if reg_field.name == check_field.name { found = true }
                }
                if !found { reliable = false }
            }
            if !reliable {
                let registered = rebind_record_shape_firebreak(
                    reg_fields, reg_tail, reg_tail_name)
                let checked = rebind_record_shape_firebreak(
                    check_fields, check_tail, check_tail_name)
                return preserve_or_report_fn_shape_firebreak(
                    ctx, fn_name, registered, checked, span)
            }

            let mut rebound_fields: List<RecordField> = []
            for reg_field in reg_fields {
                let mut found = false
                let mut check_field_type = UNIT
                for check_field in check_fields {
                    if reg_field.name == check_field.name {
                        found = true
                        check_field_type = check_field.ty
                    }
                }
                if found {
                    rebound_fields.push(RecordField {
                        name: reg_field.name,
                        ty: rebind_param_type_pair_firebreak(
                            ctx, fn_name, reg_field.ty, check_field_type, mapping,
                            original_type_vars, original_scheme_vars,
                            row_candidates, monomorphic_expansion_vars,
                            unsafe_vars, diagnosed_vars, span
                        )
                    })
                }
            }
            rebind_record_shape_firebreak(
                rebound_fields, reg_tail, reg_tail_name)
        },
        (Type::PtrType { pointee: reg_pointee },
         Type::PtrType { pointee: check_pointee }) =>
            Type::PtrType {
                pointee: rebind_param_type_pair_firebreak(
                    ctx, fn_name, reg_pointee, check_pointee, mapping,
                    original_type_vars, original_scheme_vars,
                    row_candidates, monomorphic_expansion_vars,
                    unsafe_vars, diagnosed_vars, span
                )
            },
        (registered, checked) => {
            preserve_or_report_fn_shape_firebreak(
                ctx, fn_name, registered, checked, span)
        }
    }
}

fn record_original_scheme_var_firebreak(
    mut original_scheme_vars: Set<Int>, owned_var: Int
) {
    let recorded_var = owned_var
    original_scheme_vars.insert(recorded_var)
}

fn build_registration_check_mapping_firebreak(
    metadata: OwnershipMetadata,
    checked_type: Type,
    registration_type: Type,
    mut mapping: Map<Int, Type>,
    mut conflicts: Set<Int>
) {
    let checked_view = checked_type
    let registration_view = registration_type
    build_var_mapping(
        metadata, checked_view, registration_view, mapping, conflicts)
}

fn record_assoc_unsafe_var_firebreak(
    mut assoc_unsafe_vars: Set<Int>, check_id: Int
) {
    let recorded_id = check_id
    assoc_unsafe_vars.insert(recorded_id)
}

fn record_assoc_target_firebreak(
    mut assoc_targets: Map<Int, Type>, check_id: Int, target: Type
) {
    let recorded_id = check_id
    let recorded_target = target
    assoc_targets.insert(recorded_id, recorded_target)
}

fn record_rebind_mapping_target_firebreak(
    mut mapping: Map<Int, Type>, check_id: Int, target: Type
) {
    let recorded_id = check_id
    let recorded_target = target
    mapping.insert(recorded_id, recorded_target)
}

fn record_row_free_candidate_firebreak(
    mut row_free: Set<Int>, candidate: Int
) {
    let recorded_candidate = candidate
    row_free.insert(recorded_candidate)
}

fn append_generalized_type_var_firebreak(
    mut new_type_vars: List<Int>, var_id: Int
) {
    let generalized_id = var_id
    new_type_vars.push(generalized_id)
}

fn append_generalized_scheme_bound_firebreak(
    mut new_bounds: List<SchemeBound>, var_id: Int, trait_name: Str
) {
    let bound_var = var_id
    let bound_trait = trait_name
    new_bounds.push(SchemeBound {
        type_var: bound_var,
        trait_name: bound_trait,
        assoc_constraints: []
    })
}

// Shared exact-scheme rebind. Top-level functions and impl methods both pass
// their own authoritative registration scheme through this one algorithm.
fn rebind_checked_fn_scheme(
    mut ctx: InferCtx, name: Str, scheme: TypeScheme,
    params: List<HParam>, return_type: Type,
    effects: EffectRow, span: Span
) -> TypeScheme {
    let mut original_scheme_vars: Set<Int> = set_new()
    collect_free_vars(scheme.ty, original_scheme_vars)
    // Associated-type variables may be owned exclusively by a SchemeBound
    // constraint and not occur in the registration-time function shape until
    // an open callback row is refined.
    for owned_var in scheme.type_vars {
        record_original_scheme_var_firebreak(
            original_scheme_vars, owned_var)
    }
    for scheme_bound in scheme.bounds {
        original_scheme_vars.insert(scheme_bound.type_var)
        for constraint in scheme_bound.assoc_constraints {
            collect_free_vars(constraint.ty, original_scheme_vars)
        }
    }
    match scheme.ty {
            Type::FnType {
                params: reg_params, return_type: reg_ret,
                meta: reg_meta
            } => {
                let reg_effects = reg_meta.effects
                let return_for_mapping = return_type
                let return_for_substitution = return_type
                let effects_for_mapping = effects
                let effects_for_substitution = effects
                let effects_for_audit = effects
                // Build mapping: check-time var id → registration-time var id
                // by comparing resolved params with registered params position-by-position.
                let mut var_mapping: Map<Int, Type> = map_new()
                let mut structural_conflicts: Set<Int> = set_new()
                let mut pi = 0
                for p in params {
                    match reg_params.get(pi) {
                        some(reg_p) => build_registration_check_mapping_firebreak(
                            ctx.env.types.ownership_metadata,
                            p.ty, reg_p, var_mapping, structural_conflicts
                        ),
                        none => {}
                    }
                    pi = pi + 1
                }
                // Return/effect positions can own variables that never appear
                // in ordinary parameters.
                build_registration_check_mapping_firebreak(
                    ctx.env.types.ownership_metadata,
                    return_for_mapping, reg_ret,
                    var_mapping, structural_conflicts
                )
                build_effect_var_mapping(
                    ctx.env.types.ownership_metadata,
                    effects_for_mapping, reg_effects,
                    var_mapping, structural_conflicts
                )

                // Reconcile the structural candidates above with the
                // owner-qualified associated-type targets captured before
                // cleanup. A check variable unified with both T::Item and some
                // other registered variable represents an equality that the
                // current scheme cannot publish, so it must fail closed.
                let mut assoc_targets: Map<Int, Type> = map_new()
                let mut assoc_unsafe_vars: Set<Int> = set_new()
                match ctx.rebind_assoc_provenance.get(name) {
                    some(entries) => {
                        for entry in entries {
                            match entry.check_type {
                                Type::TypeVar { id: check_var_id, .. } => {
                                    if structural_conflicts.contains(check_var_id) {
                                        // Only conflicts on the associated
                                        // payload identity are relevant here.
                                        // Ordinary generic/row conflicts may
                                        // already be represented by the
                                        // registration scheme and must not
                                        // poison unrelated fail<T> payloads.
                                        record_assoc_unsafe_var_firebreak(
                                            assoc_unsafe_vars, check_var_id)
                                    } else {
                                        match entry.registration_type {
                                            some(target) => {
                                                match assoc_targets.get(check_var_id) {
                                                    some(existing) => {
                                                        if !types_equal_with_ownership(
                                                            ctx.env.types.ownership_metadata,
                                                            existing, target
                                                        ) {
                                                            // A single check-time
                                                            // variable was unified
                                                            // from two different
                                                            // associated-type owners.
                                                            record_assoc_unsafe_var_firebreak(
                                                                assoc_unsafe_vars, check_var_id)
                                                        }
                                                    },
                                                    none => record_assoc_target_firebreak(
                                                        assoc_targets, check_var_id, target)
                                                }
                                            },
                                            none => record_assoc_unsafe_var_firebreak(
                                                assoc_unsafe_vars, check_var_id)
                                        }
                                    }
                                },
                                // Structured associated types are audited
                                // directly at each new fail payload below. They
                                // cannot be represented as a TypeVar substitution.
                                _ => {}
                            }
                        }
                    },
                    none => {}
                }
                let mut sorted_assoc_ids = assoc_targets.keys()
                sorted_assoc_ids.sort()
                for check_id in sorted_assoc_ids {
                    match assoc_targets.get(check_id) {
                        some(target) => {
                            if !assoc_unsafe_vars.contains(check_id) {
                                match var_mapping.get(check_id) {
                                    some(structural_target) => {
                                        if !types_equal_with_ownership(
                                            ctx.env.types.ownership_metadata,
                                            structural_target, target
                                        ) {
                                            record_assoc_unsafe_var_firebreak(
                                                assoc_unsafe_vars, check_id)
                                        }
                                    },
                                    none => {
                                        // Owner-qualified provenance supplies
                                        // the otherwise missing identity.
                                        record_rebind_mapping_target_firebreak(
                                            var_mapping, check_id, target)
                                    }
                                }
                            }
                        },
                        none => {}
                    }
                }

                // Map the resolved return type back to registration-time vars
                let mapped_ret = apply_subst_map(
                    var_mapping, return_for_substitution)

                // Also map effects
                let mapped_effects = apply_subst_row_map(
                    var_mapping, effects_for_substitution)

                // Preserve only checked effect-row refinements inside the
                // registration parameter skeleton. Arbitrary inferred shapes
                // must not become a new public parameter ABI.
                let mut mapped_params: List<Type> = []
                let mut param_row_candidates: Set<Int> = set_new()
                let mut monomorphic_expansion_vars: Set<Int> = set_new()
                let mut unsafe_provenance_vars = assoc_unsafe_vars
                let mut diagnosed_vars: Set<Int> = set_new()
                audit_fail_row(
                    ctx, name, effects_for_audit,
                    var_mapping, original_scheme_vars,
                    unsafe_provenance_vars, diagnosed_vars, span
                )
                let mut mapped_pi = 0
                for p in params {
                    match reg_params.get(mapped_pi) {
                        some(reg_param) =>
                            append_rebound_type_pair_firebreak(
                                mapped_params,
                                ctx, name, reg_param, p.ty, var_mapping,
                                scheme.type_vars, original_scheme_vars,
                                param_row_candidates, monomorphic_expansion_vars,
                                unsafe_provenance_vars, diagnosed_vars, span
                            ),
                        none => {}
                    }
                    mapped_pi = mapped_pi + 1
                }

                // Generalize only outer-row variables and parameter-row
                // variables owned by an originally quantified registration
                // tail. Mono→Fn expansion variables remain shared.
                // Mirroring infer_ctx::generalize is important here: a
                // monomorphic env variable (e.g. an unannotated `raise_arg(x)`)
                // must remain shared, while a body-local/callee-instantiation
                // variable gets a fresh instance at every call site.
                let mut row_free: Set<Int> = set_new()
                for candidate in param_row_candidates {
                    record_row_free_candidate_firebreak(row_free, candidate)
                }
                collect_free_vars(Type::EffectRowType {
                    effects: mapped_effects.effects, tail: mapped_effects.tail
                }, row_free)
                let env_free = free_type_vars_in_env(ctx.env, empty_subst())
                let mut new_type_vars = list_clone(scheme.type_vars)
                let mut new_bounds = list_clone(scheme.bounds)
                let mut sorted_row_free = row_free.to_list()
                sorted_row_free.sort()
                for v in sorted_row_free {
                    if new_type_vars.contains(v) == false &&
                       env_free.contains(v) == false &&
                       monomorphic_expansion_vars.contains(v) == false &&
                       unsafe_provenance_vars.contains(v) == false {
                        append_generalized_type_var_firebreak(new_type_vars, v)

                        // instantiate() records trait obligations for fresh
                        // variables in var_bounds.  Preserve those obligations
                        // when the propagated effect variable is generalized,
                        // using the same deterministic reconstruction contract
                        // as infer_ctx::generalize.  Existing SchemeBounds —
                        // including associated constraints — are left intact.
                        match ctx.env.scope.var_bounds.get(v) {
                            some(traits) => {
                                let mut sorted_traits = traits.to_list()
                                sorted_traits.sort()
                                for trait_name in sorted_traits {
                                    let exists = new_bounds.any(fn(b) {
                                        b.type_var == v && b.trait_name == trait_name
                                    })
                                    if !exists {
                                        append_generalized_scheme_bound_firebreak(
                                            new_bounds, v, trait_name)
                                    }
                                }
                            },
                            none => {},
                        }
                    }
                }

                let new_type = Type::FnType {
                    params: mapped_params, return_type: mapped_ret,
                    meta: fn_meta(mapped_effects, reg_meta.ownership_term)
                }
                TypeScheme {
                    ..scheme,
                    ty: new_type,
                    type_vars: new_type_vars,
                    bounds: new_bounds
                }
            },
            _ => scheme
    }
}

fn rebind_registered_fn_type_firebreak(
    mut ctx: InferCtx,
    name: Str,
    scheme: TypeScheme,
    params: List<HParam>,
    return_type: Type,
    effects: EffectRow,
    span: Span
) {
    let checked_name = name
    let alias_name = name
    let scheme_for_rebind =
        registered_type_scheme_result_firebreak(scheme)
    let rebound = rebind_checked_fn_scheme(
        ctx, checked_name, scheme_for_rebind,
        params, return_type, effects, span)
    rebind_fn_scheme_with_alias(ctx, alias_name, rebound)
}

fn rebind_fn_type(
    mut ctx: InferCtx, name: Str, params: List<HParam>, return_type: Type,
    effects: EffectRow, span: Span, registration_scheme: TypeScheme?
) {
    match registration_scheme {
        some(scheme) => rebind_registered_fn_type_firebreak(
            ctx, name, scheme, params, return_type, effects, span),
        none => {}
    }
}

// Build a var-id mapping by structurally comparing two types.
// If check_ty = TypeVar(?42) and reg_ty = TypeVar(?1), records ?42 → ?1.
fn record_var_mapping(
    metadata: OwnershipMetadata,
    check_id: Int,
    registration_type: Type,
    mut mapping: Map<Int, Type>,
    mut conflicts: Set<Int>
) {
    // update_fn_effects runs immediately before rebind and may place a
    // check-time variable into the scheme's outer effect row. Mapping that
    // variable to itself carries no registration identity; treating it as a
    // candidate would conflict with the real parameter/bound target.
    match registration_type {
        Type::TypeVar { id: registration_id, .. } => {
            if registration_id == check_id { return }
        },
        _ => {}
    }
    match mapping.get(check_id) {
        some(existing) => {
            if !types_equal_with_ownership(
                metadata, existing, registration_type
            ) {
                conflicts.insert(check_id)
            }
        },
        none => mapping.insert(check_id, registration_type)
    }
}

fn record_check_registration_mapping_firebreak(
    metadata: OwnershipMetadata,
    check_id: Int,
    registration_type: Type,
    mut mapping: Map<Int, Type>,
    mut conflicts: Set<Int>
) {
    let recorded_id = check_id
    let registration_view = registration_type
    record_var_mapping(
        metadata, recorded_id, registration_view, mapping, conflicts)
}

fn record_optional_tail_mapping_firebreak(
    metadata: OwnershipMetadata,
    check_tail: Int?,
    registration_tail: Int?,
    mut mapping: Map<Int, Type>,
    mut conflicts: Set<Int>
) {
    match (check_tail, registration_tail) {
        (some(checked_id), some(registered_id)) => {
            record_check_registration_mapping_firebreak(
                metadata,
                checked_id,
                rebind_type_var_shape_firebreak(registered_id, none),
                mapping,
                conflicts)
        },
        _ => {}
    }
}

fn record_captured_optional_tail_mapping_firebreak(
    metadata: OwnershipMetadata,
    check_tail: Int?,
    registration_tail: Int?,
    mut mapping: Map<Int, Type>,
    mut conflicts: Set<Int>
) {
    let checked_tail_for_mapping = check_tail
    let registered_tail_for_mapping = registration_tail
    record_optional_tail_mapping_firebreak(
        metadata, checked_tail_for_mapping,
        registered_tail_for_mapping, mapping, conflicts)
}

fn build_effect_payload_mapping_firebreak(
    metadata: OwnershipMetadata,
    check_effect: Effect,
    registration_effect: Effect,
    mut mapping: Map<Int, Type>,
    mut conflicts: Set<Int>
) {
    match (check_effect, registration_effect) {
        (Effect::FailEffect { error_type: checked_type },
         Effect::FailEffect { error_type: registered_type }) =>
            build_registration_check_mapping_firebreak(
                metadata, checked_type, registered_type, mapping, conflicts),
        (Effect::MutEffect { state_type: checked_type },
         Effect::MutEffect { state_type: registered_type }) =>
            build_registration_check_mapping_firebreak(
                metadata, checked_type, registered_type, mapping, conflicts),
        (Effect::CustomEffect { type_args: checked_args, .. },
         Effect::CustomEffect { type_args: registered_args, .. }) => {
            let mut i = 0
            while i < checked_args.len() && i < registered_args.len() {
                match (checked_args.get(i), registered_args.get(i)) {
                    (some(checked_type), some(registered_type)) =>
                        build_registration_check_mapping_firebreak(
                            metadata, checked_type, registered_type,
                            mapping, conflicts),
                    _ => {}
                }
                i = i + 1
            }
        },
        _ => {}
    }
}

fn build_matching_effect_mapping_firebreak(
    metadata: OwnershipMetadata,
    check_effect: Effect,
    registration_effect: Effect,
    mut mapping: Map<Int, Type>,
    mut conflicts: Set<Int>
) {
    let kind_check = check_effect
    let kind_registration = registration_effect
    let payload_check = check_effect
    let payload_registration = registration_effect
    if effects_match_kind_with_ownership(
        metadata, kind_check, kind_registration
    ) {
        build_effect_payload_mapping_firebreak(
            metadata, payload_check, payload_registration,
            mapping, conflicts)
    }
}

fn build_var_mapping(
    metadata: OwnershipMetadata,
    check_ty: Type,
    reg_ty: Type,
    mut mapping: Map<Int, Type>,
    mut conflicts: Set<Int>
) {
    match (check_ty, reg_ty) {
        (Type::TypeVar { id: check_id, .. }, registration_type) => {
            record_check_registration_mapping_firebreak(
                metadata, check_id, registration_type, mapping, conflicts)
        },
        (Type::FnType { params: cp, return_type: cr, meta: cm },
         Type::FnType { params: rp, return_type: rr, meta: rm }) => {
            let mut i = 0
            for c in cp {
                match rp.get(i) {
                    some(r) => build_registration_check_mapping_firebreak(
                        metadata, c, r, mapping, conflicts),
                    none => {}
                }
                i = i + 1
            }
            build_registration_check_mapping_firebreak(
                metadata, cr, rr, mapping, conflicts)
            build_effect_var_mapping(
                metadata, cm.effects, rm.effects, mapping, conflicts)
        },
        (Type::StructType { name: cn, type_params: ct },
         Type::StructType { name: rn, type_params: rt }) => {
            if cn == rn && ct.len() == rt.len() {
                let mut i = 0
                for c in ct {
                    match rt.get(i) {
                        some(r) => build_registration_check_mapping_firebreak(
                            metadata, c, r, mapping, conflicts),
                        none => {}
                    }
                    i = i + 1
                }
            }
        },
        (Type::EnumType { name: cn, type_params: ct },
         Type::EnumType { name: rn, type_params: rt }) => {
            if cn == rn && ct.len() == rt.len() {
                let mut i = 0
                for c in ct {
                    match rt.get(i) {
                        some(r) => build_registration_check_mapping_firebreak(
                            metadata, c, r, mapping, conflicts),
                        none => {}
                    }
                    i = i + 1
                }
            }
        },
        (Type::TupleType { elements: ce }, Type::TupleType { elements: re }) => {
            if ce.len() == re.len() {
                let mut i = 0
                for c in ce {
                    match re.get(i) {
                        some(r) => build_registration_check_mapping_firebreak(
                            metadata, c, r, mapping, conflicts),
                        none => {}
                    }
                    i = i + 1
                }
            }
        },
        (Type::GenericType { base: cb, args: ca },
         Type::GenericType { base: rb, args: ra }) => {
            if ca.len() == ra.len() {
                build_registration_check_mapping_firebreak(
                    metadata, cb, rb, mapping, conflicts)
                let mut i = 0
                for c in ca {
                    match ra.get(i) {
                        some(r) => build_registration_check_mapping_firebreak(
                            metadata, c, r, mapping, conflicts),
                        none => {}
                    }
                    i = i + 1
                }
            }
        },
        (Type::RecordType { fields: cf, tail: ct, .. },
         Type::RecordType { fields: rf, tail: rt, .. }) => {
            // Common named fields remain reliable even when an open
            // registration row has expanded with additional checked fields.
            // Skipping them would hide owner conflicts nested in those fields.
            for check_field in cf {
                for reg_field in rf {
                    if check_field.name == reg_field.name {
                        build_registration_check_mapping_firebreak(
                            metadata, check_field.ty, reg_field.ty,
                            mapping, conflicts
                        )
                    }
                }
            }

            // Tail identity is only reliable when both visible field sets are
            // exactly the same. Extra/missing fields may have been absorbed by
            // an open row and change what the tail denotes.
            let mut same_fields = cf.len() == rf.len()
            for reg_field in rf {
                let mut found = false
                for check_field in cf {
                    if check_field.name == reg_field.name { found = true }
                }
                if !found { same_fields = false }
            }
            if same_fields {
                record_captured_optional_tail_mapping_firebreak(
                    metadata, ct, rt, mapping, conflicts)
            }
        },
        (Type::PtrType { pointee: cp }, Type::PtrType { pointee: rp }) =>
            build_registration_check_mapping_firebreak(
                metadata, cp, rp, mapping, conflicts),
        _ => {}
    }
}

fn build_effect_var_mapping(
    metadata: OwnershipMetadata,
    check_row: EffectRow,
    reg_row: EffectRow,
    mut mapping: Map<Int, Type>,
    mut conflicts: Set<Int>
) {
    record_optional_tail_mapping_firebreak(
        metadata, check_row.tail, reg_row.tail, mapping, conflicts)

    for check_eff in check_row.effects {
        for reg_eff in reg_row.effects {
            build_matching_effect_mapping_firebreak(
                metadata, check_eff, reg_eff, mapping, conflicts)
        }
    }
}

// ============================================================
// Default effect handler cycle detection
// ============================================================

fn visit_default_effect_node_firebreak(
    mut ctx: InferCtx,
    effect_name: Str,
    mut state: Map<Str, Int>,
    mut path: List<Str>,
    effect_spans: Map<Str, Span>
) {
    let visited_name = effect_name
    dfs_detect_cycle(ctx, visited_name, state, path, effect_spans)
}

fn record_effect_span_firebreak(
    mut spans: Map<Str, Span>, name: Str, span: Span
) {
    let recorded_name = name
    let recorded_span = span
    spans.insert(recorded_name, recorded_span)
}

fn visit_unseen_effect_dependency_firebreak(
    mut ctx: InferCtx,
    dependency: Str,
    mut state: Map<Str, Int>,
    mut path: List<Str>,
    effect_spans: Map<Str, Span>
) {
    let visited_dependency = dependency
    dfs_detect_cycle(
        ctx, visited_dependency, state, path, effect_spans)
}

fn check_default_effect_cycles(mut ctx: InferCtx, decls: List<Decl>) {
    // Build span lookup for error reporting
    let mut effect_spans: Map<Str, Span> = map_new()
    collect_effect_spans(decls, effect_spans)

    // DFS-based cycle detection on effect_default_deps graph
    // States: 0 = unvisited, 1 = in-progress (on stack), 2 = done
    let mut state: Map<Str, Int> = map_new()
    let mut path: List<Str> = []

    let mut sorted_edd = ctx.effect_default_deps.entries()
    sorted_edd.sort_by(compare_by_first)
    for entry in sorted_edd {
        let (eff_name, _) = entry
        if !state.contains_key(eff_name) {
            visit_default_effect_node_firebreak(
                ctx, eff_name, state, path, effect_spans)
        }
    }
}

fn collect_effect_spans(decls: List<Decl>, mut spans: Map<Str, Span>) {
    for decl in decls {
        match decl {
            Decl::Effect { name, span, .. } => {
                record_effect_span_firebreak(spans, name, span)
            },
            Decl::ModBlock { decls: mod_decls, .. } => {
                collect_effect_spans(mod_decls, spans)
            },
            _ => {}
        }
    }
}

fn dfs_detect_cycle(mut ctx: InferCtx, name: Str, mut state: Map<Str, Int>, mut path: List<Str>, effect_spans: Map<Str, Span>) {
    let in_progress_name = name
    let path_name = name
    let dependency_name = name
    let error_span_name = name
    let done_name = name
    state.insert(in_progress_name, 1)  // mark as in-progress
    path.push(path_name)

    match ctx.effect_default_deps.get(dependency_name) {
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
                                if found_start { cycle_parts.push(nominal_display_name(p)) }
                            }
                            cycle_parts.push(nominal_display_name(dep))
                            let cycle_str = cycle_parts.join(" -> ")
                            let err_span = match effect_spans.get(error_span_name) {
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
                        visit_unseen_effect_dependency_firebreak(
                            ctx, dep, state, path, effect_spans)
                    }
                }
            }
        },
        none => {}
    }

    path.pop()
    state.insert(done_name, 2)  // mark as done
}

fn check_registered_body_transaction_firebreak(
    mut ctx: InferCtx, program: Program,
    derived_impls: List<DerivedImpl>
) -> HProgram {
    let checked_program = program
    let checked_derived_impls = derived_impls
    check_registered_body(ctx, checked_program, checked_derived_impls)
}

pub fn check(mut ctx: InferCtx, program: Program) -> HProgram {
    register_decls_two_phase(ctx, program.decls)
    check_registered(ctx, program)
}

pub fn check_module_identity(mut ctx: InferCtx, program: Program, module_prefix: Str) -> HProgram {
    let qualified_decls = register_module_decls_two_phase(ctx, module_prefix, program.decls)
    let qualified = Program { uses: program.uses, decls: qualified_decls, span: program.span }
    check_registered(ctx, qualified)
}

fn check_registered(mut ctx: InferCtx, program: Program) -> HProgram {
    solve_ownership_shapes(ctx)
    // Derive mutates canonical registries. Complete it before the lexical root
    // overlay snapshots any payload, so frame aliases always observe the
    // authoritative post-derive definitions.
    let derived_impls = run_derive_pass(ctx.env, ctx.sink)
    let project_active = ctx.project_namespace_file_key.is_some()
    let mut entered_project_frame = false
    if project_active {
        entered_project_frame = enter_project_root_frame(ctx)
        if !entered_project_frame {
            panic("unreachable: resolver plan missing file root check frame")
        }
    }
    let result = check_registered_body_transaction_firebreak(
        ctx, program, derived_impls) catch { _ => {
        if entered_project_frame {
            let _ = exit_project_namespace_frame(ctx)
        }
        fail.raise(CompileError {})
    } }
    if entered_project_frame {
        let _ = exit_project_namespace_frame(ctx)
    }
    result
}

fn precheck_impl_target_result_firebreak(target_type: Str) -> Str {
    let exact_target = target_type
    exact_target
}

fn precheck_impl_effects_firebreak(
    mut ctx: InferCtx,
    target_type: Str,
    type_params: List<TypeParam>,
    trait_name: Str?,
    methods: List<Decl>,
    span: Span
) {
    let checked_target = target_type
    let checked_type_params = type_params
    let checked_trait = trait_name
    let checked_methods = methods
    let checked_span = span
    let _ = some(check_impl_decl(
        ctx, precheck_impl_target_result_firebreak(checked_target),
        checked_type_params,
        checked_trait, checked_methods, checked_span)) catch { _ => none }
}

fn record_fn_decl_index_firebreak(
    mut fn_name_to_idx: Map<Str, Int>, name: Str, index: Int
) {
    let indexed_name = name
    let indexed_value = index
    fn_name_to_idx.insert(indexed_name, indexed_value)
}

fn record_impl_decl_index_firebreak(
    mut impl_node_to_idx: Map<Str, Int>, inode: Str, index: Int
) {
    let indexed_node = inode
    let indexed_value = index
    impl_node_to_idx.insert(indexed_node, indexed_value)
}

fn record_inline_root_firebreak(
    mut inline_roots: Set<Str>, name: Str
) {
    let recorded_name = name
    inline_roots.insert(recorded_name)
}

fn phase_decl_index_result_firebreak(index: Int) -> Int? {
    let exact_index = index
    some(exact_index)
}

fn check_indexed_phase_decl_firebreak(
    mut ctx: InferCtx,
    decl: Decl,
    index: Int,
    mut hdecls: List<HDecl>,
    mut checked: Set<Int>
) {
    let checked_decl = decl
    let checked_index = index
    let recorded_index = index
    let _ = some(check_one_decl_with_rebind(
        ctx, checked_decl,
        phase_decl_index_result_firebreak(checked_index),
        hdecls)) catch { _ => none }
    checked.insert(recorded_index)
}

fn check_scc_decl_index_firebreak(
    mut ctx: InferCtx,
    decls: List<Decl>,
    index: Int,
    mut hdecls: List<HDecl>,
    mut checked: Set<Int>
) {
    let lookup_index = index
    let checked_index = index
    match decls.get(lookup_index) {
        some(decl) => check_indexed_phase_decl_firebreak(
            ctx, decl, checked_index, hdecls, checked),
        none => {}
    }
}

fn check_remaining_decl_firebreak(
    mut ctx: InferCtx,
    decl: Decl,
    index: Int,
    mut hdecls: List<HDecl>
) {
    let checked_decl = decl
    let checked_index = index
    let _ = some(check_one_decl_with_rebind(
        ctx, checked_decl,
        phase_decl_index_result_firebreak(checked_index),
        hdecls)) catch { _ => none }
}

fn check_registered_body(
    mut ctx: InferCtx, program: Program,
    derived_impls: List<DerivedImpl>
) -> HProgram {
    // Effect pre-pass: check impl blocks to populate impl_methods with inferred effects.
    // Without this, callers defined before impl blocks see EMPTY_ROW effects from Pass 1.
    // The main pass re-checks with correct effects visible.
    // DiagnosticSink deduplication (by code+span) prevents double error reporting.
    for decl in program.decls {
        match decl {
            Decl::Impl { target_type, type_params, trait_name, methods, span } => {
                precheck_impl_effects_firebreak(
                    ctx, target_type, type_params, trait_name, methods, span)
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

    // Build lookup before the inline pre-pass. Besides driving Phase 2b, this
    // distinguishes top-level SCC nodes that are already checked exactly once
    // below from inline nodes that need module-context prechecking.
    let mut fn_name_to_idx: Map<Str, Int> = map_new()
    let mut impl_node_to_idx: Map<Str, Int> = map_new()
    let mut idx = 0
    for decl in program.decls {
        let current_idx = idx
        let next_idx = idx + 1
        match decl {
            Decl::Fn { name, .. } => {
                record_fn_decl_index_firebreak(
                    fn_name_to_idx, name, current_idx)
            },
            Decl::Impl { target_type, trait_name, .. } => {
                let inode = match trait_name {
                    some(tn) => "impl::${target_type}::${tn}",
                    none => "impl::${target_type}"
                }
                record_impl_decl_index_firebreak(
                    impl_node_to_idx, inode, current_idx)
            },
            _ => {}
        }
        idx = next_idx
    }

    // Inline functions are emitted inside HDecl::ModBlock and therefore have
    // no direct program.decls index for Phase 2b below. Starting from those
    // nodes, follow caller -> callee edges and pre-check only that dependency
    // closure leaf-first. This includes file-root callees reached via super::,
    // while ordinary file modules with no inline functions do no extra work.
    let mut impl_fn_names: Set<Str> = set_new()
    collect_impl_scc_fn_names(program.decls, none, impl_fn_names)
    let mut inline_roots: Set<Str> = set_new()
    for name in registered_fns {
        if !fn_name_to_idx.contains_key(name) && !impl_fn_names.contains(name) {
            record_inline_root_firebreak(inline_roots, name)
        }
    }
    let precheck_nodes = inline_dependency_closure(call_graph, inline_roots, impl_fn_names)
    for scc_group in scc_groups {
        for name in scc_group {
            if precheck_nodes.contains(name) {
                match fn_name_to_idx.get(name) {
                    some(i) => precheck_top_level_fn_at(ctx, program.decls, i),
                    none => { let _ = precheck_inline_fn(ctx, program.decls, name) }
                }
            }
        }
    }

    let mut hdecls: List<HDecl> = []
    let mut checked: Set<Int> = set_new()

    // Phase 1: Check non-fn/non-impl declarations in source order.
    // These (struct, enum, effect, trait, extern, const, type-alias, sig, test, mod)
    // do not participate in the fn call graph.
    let mut di = 0
    for decl in program.decls {
        let current_di = di
        let next_di = di + 1
        match decl {
            Decl::Fn { .. } => {},
            Decl::Impl { .. } => {},
            _ => {
                check_indexed_phase_decl_firebreak(
                    ctx, decl, current_di, hdecls, checked)
            }
        }
        di = next_di
    }

    // Phase 2a: Check impl blocks in source order (before top-level fns).
    // This re-checks impls with effects populated by the pre-pass.
    // Must happen before top-level fns so that method effects are visible
    // to callers (method calls are invisible to the call graph).
    let mut ii = 0
    for decl in program.decls {
        let current_ii = ii
        let next_ii = ii + 1
        match decl {
            Decl::Impl { .. } => {
                if !checked.contains(current_ii) {
                    check_indexed_phase_decl_firebreak(
                        ctx, decl, current_ii, hdecls, checked)
                }
            },
            _ => {}
        }
        ii = next_ii
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
                        check_scc_decl_index_firebreak(
                            ctx, program.decls, i, hdecls, checked)
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
        let current_ri = ri
        let next_ri = ri + 1
        if !checked.contains(current_ri) {
            check_remaining_decl_firebreak(
                ctx, decl, current_ri, hdecls)
        }
        ri = next_ri
    }

    // Check for cyclic dependencies in default effect handlers
    check_default_effect_cycles(ctx, program.decls)

    // static_dicts is populated by dict_lower (checker pipeline) — empty here.
    // B-144/B-145: declarations contribute directly. In project mode the root
    // namespace frame is still active here, so explicitly imported externs are
    // visible transactionally in `structs`; capture their raw ABI identities
    // for codegen before the caller rolls the frame back. Unimported dependency
    // externs live only in `extern_structs` and therefore cannot enter this set.
    let mut extern_names = collect_extern_type_names(hdecls)
    if ctx.project_namespace_file_key.is_some() {
        for entry in ctx.env.types.structs.entries() {
            let (_, def) = entry
            if def.is_extern {
                extern_names.insert(def.name)
            }
        }
    }
    HProgram {
        decls: hdecls, derived_impls: derived_impls,
        boxed_vars: ctx.boxed_vars, static_dicts: [],
        extern_type_names: extern_names,
        ownership_metadata: ctx.env.types.ownership_metadata
    }
}

pub fn resolve_type_expr_public(mut ctx: InferCtx, texpr: TypeExpr) -> Type {
    resolve_type_expr(ctx, texpr)
}

pub fn check_prelude_decl(mut ctx: InferCtx, decl: Decl) -> HDecl {
    // Note: check_decl uses fail.raise internally. Due to the known limitation
    // where cross-module effect propagation doesn't work (effects registered as
    // EMPTY_ROW in Pass 1), we must explicitly surface the fail effect here so
    // callers pass the __ring_ev_fail evidence.
    let result = check_decl(ctx, decl, none)
    if false { fail.raise(CompileError {}) }
    result
}
