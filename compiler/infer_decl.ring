use types::{Type, Effect, EffectRow, RecordField, OwnershipMetadata,
    CallableOwnershipState,
    UNIT, EMPTY_ROW, type_to_string, effect_to_string,
    nominal_display_name, effects_match_kind_with_ownership,
    effect_kind_name,
    types_equal_with_ownership,
    PARAM_OWNERSHIP_BORROW, PARAM_OWNERSHIP_MOVE,
    CALLABLE_BORROW_OWNED,
    callable_param_ownership, callable_return_ownership,
    type_may_own, fn_meta}
use ast::{Program, Decl, Expr, Param, TypeExpr, TypeParam, Span, Position, EffectOpDecl, EffectExpr,
    UseDecl, SigMember}
use hir::{HDecl, HParam, HExpr, HStmt, HProgram, DerivedImpl, TraitBound, HAssocType,
    HStructField, HEnumVariant, HEffectOp, HTraitMethod, HSigMember,
    HStringInterpPart,
    DictDispatchInfo, ValueBindingKind, trait_dict_name,
    hexpr_type, hexpr_effects, hexpr_span,
    collect_extern_type_names, compare_by_first, extern_abi_leaf,
    hparam_flags, hparam_flags_with_force, hparam_is_mutable,
    hparam_mark_external_drop_owner}
use env::{TypeScheme, SchemeBound, MethodOrigin, Scope,
    StructDef, EnumDef, TypeAliasDef, EffectDef, EffectAliasDef, SigDef, TraitDef,
    apply_subst, apply_subst_map, apply_subst_row, apply_subst_row_map,
    find_impl, find_impl_by_origin, impl_origin, impl_decl_origin,
    impl_method_origin,
    install_method_scheme, build_type_var_map,
    trait_is_authoritative_drop}
use union_find::{UnionFind, clone_union_find}
use unify::{empty_subst}
use diagnostics::{DiagnosticContext, DiagnosticNote, DiagnosticSink}
use codes::{E0201, E0204, E0301, E0402, E0403, E0404, E0405, E0409, E0410, E0501, E0503, E0507, E0802, E0803}
use infer_ctx::{InferCtx, InferResult, FnBoundsEntry, AssocRebindEntry,
    ImplEffectPrecheckUndo, CompileError,
    type_error, type_error_with_notes,
    unify_at, unify_at_noted, update_fn_effects,
    resolve_type_expr, resolve_self_type, resolve_dicts_from_scheme,
    pending_dict_checkpoint, drain_pending_dicts, rollback_pending_dicts,
    settle_default_pending_dicts, assert_pending_dict_owner_closed,
    generalize, collect_free_vars, free_type_vars, free_type_vars_in_env,
    resolve_mod_uses,
    fresh_call_result_callable_def_id,
    promote_pre_solve_callable_aliases_for_source,
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
    register_default_bounded_callable_value_shadows,
    default_template_var_ids, rewrite_default_template_types}
use zonk::{ZonkCtx, zonk_type, zonk_row, zonk_param, zonk_block, zonk_expr}
use derive::{run_derive_pass}
use scc::{build_call_graph, tarjan_scc, collect_registered_fn_names, collect_self_method_callees}

// Const initializers are declaration owners, while function/impl/test/default
// bodies are retained only after the whole declaration tree has crossed the
// owner barrier.  Cache the one authoritative HIR node for each const locally
// to check_registered_body; speculative checks must never see this cache.
struct ConstOwnerCache {
    checked: Map<Int, HDecl>,
    failed: Set<Int>,
    emitted: Set<Int>
}

struct DeclOwnerSite {
    path: List<Int>,
    canonical_name: Str?
}

fn duplicate_decl_owner_site(site: DeclOwnerSite) -> DeclOwnerSite {
    DeclOwnerSite {
        path: list_clone(site.path),
        canonical_name: duplicate_impl_precheck_trait_name(
            site.canonical_name)
    }
}

struct LegacyModuleOverlaySnapshot {
    scope_variables: List<Map<Str, TypeScheme>>,
    structs: Map<Str, StructDef>,
    enums: Map<Str, EnumDef>,
    type_aliases: Map<Str, TypeAliasDef>,
    effects: Map<Str, EffectDef>,
    effect_aliases: Map<Str, EffectAliasDef>,
    sigs: Map<Str, SigDef>,
    traits: Map<Str, TraitDef>,
    variant_to_enum: Map<Str, Str>,
    variant_ctor_origins: Map<Int, Str>,
    use_aliases: Map<Int, Str>,
    value_binding_kinds: Map<Int, ValueBindingKind>,
    fn_mut_params: Map<Str, List<Bool>>
}

// A successful discarded function check may publish default-argument HIR used
// as a template by later retained callers. Preserve only exact value/binder
// identities reachable from that template which did not exist before the
// check; call sites freshen those identities and the template's type variables.
// Type-variable bounds have their own namespace and are intentionally not
// indexed through this DefId-keyed capture.
struct DefaultAuthorityCapture {
    def_ids: Set<Int>,
    callable_by_def_id: Map<Int, Int>,
    callable_state_by_def_id: Map<Int, CallableOwnershipState>,
    callable_result_role_by_def_id: Map<Int, Int>,
    returned_callable_result_role_by_def_id: Map<Int, Int>,
    callable_result_role_spine_by_def_id: Map<Int, List<Int>>,
    use_aliases: Map<Int, Str>,
    value_binding_kinds: Map<Int, ValueBindingKind>,
    live_schemes_by_def_id: Map<Int, TypeScheme>,
    variant_ctor_origins: Map<Int, Str>,
    exact_value_alias_targets: Map<Int, Int>,
    const_getter_aliases: Set<Int>,
    callable_alias_targets: Map<Int, Int>,
    callable_alias_arities: Map<Int, Int>,
    callable_alias_contracts: Map<Int, Int>,
    def_spans: Map<Int, Span>,
    boxed_vars: Set<Int>,
    var_lambda_depth: Map<Int, Int>,
    mutable_vars: Set<Int>,
    let_defs: Set<Int>,
    mut_param_defs: Set<Int>
}

// Const initializers are authoritative retained owners, but any failed owner
// must leave the checker exactly at its root-frame baseline (apart from the
// diagnostics it intentionally emitted and monotonic ID allocation).
struct ConstOwnerTransactionSnapshot {
    subst: UnionFind,
    scope_variables: List<Map<Str, TypeScheme>>,
    callable_by_def_id: Map<Int, Int>,
    callable_state_by_def_id: Map<Int, CallableOwnershipState>,
    callable_result_role_by_def_id: Map<Int, Int>,
    returned_callable_result_role_by_def_id: Map<Int, Int>,
    callable_result_role_spine_by_def_id: Map<Int, List<Int>>,
    callable_inference_parents: Map<Int, Int>,
    callable_inference_solutions: Map<Int, Int>,
    use_aliases: Map<Int, Str>,
    value_binding_kinds: Map<Int, ValueBindingKind>,
    structs: Map<Str, StructDef>,
    enums: Map<Str, EnumDef>,
    type_aliases: Map<Str, TypeAliasDef>,
    effects: Map<Str, EffectDef>,
    effect_aliases: Map<Str, EffectAliasDef>,
    sigs: Map<Str, SigDef>,
    traits: Map<Str, TraitDef>,
    variant_to_enum: Map<Str, Str>,
    variant_ctor_origins: Map<Int, Str>,
    exact_value_alias_targets: Map<Int, Int>,
    pending_inferred_const_def_ids: Set<Int>,
    pending_precheck_callable_def_ids: Set<Int>,
    const_getter_aliases: Set<Int>,
    callable_alias_targets: Map<Int, Int>,
    callable_alias_arities: Map<Int, Int>,
    callable_alias_contracts: Map<Int, Int>,
    speculative_default_authority_def_ids: Set<Int>,
    boxed_vars: Set<Int>,
    var_lambda_depth: Map<Int, Int>,
    fn_mut_params: Map<Str, List<Bool>>,
    fn_defaults: Map<Int, List<HExpr>>,
    fn_default_var_bounds: Map<Int, Map<Int, Set<Str>>>,
    fn_min_arity: Map<Int, Int>,
    latest_value_instantiation_maps: Map<Int, Map<Int, Type>>,
    default_template_live_schemes: Map<Int, TypeScheme>,
    rebind_assoc_provenance: Map<Str, List<AssocRebindEntry>>,
    type_param_scope: Map<Str, Type>,
    qualified_assoc_scope: Map<Str, Type>,
    current_fn_return_type: Type?,
    current_fn_bounds: List<FnBoundsEntry>,
    fn_bounds_stack: List<List<FnBoundsEntry>>,
    loop_depth: Int,
    lambda_depth: Int,
    def_spans: Map<Int, Span>,
    var_bounds: Map<Int, Set<Str>>,
    mutable_vars: Set<Int>,
    let_defs: Set<Int>,
    mut_param_defs: Set<Int>,
    mod_path_depth: Int,
    project_frame_depth: Int,
    mod_unsafe_allowed: Bool,
    dict_checkpoint: Int
}

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
    mut ctx: InferCtx, decl: Decl, frame_decl_index: Int?,
    const_owners: ConstOwnerCache?
) -> HDecl {
    let obligation_checkpoint = pending_dict_checkpoint(ctx)
    let result = some(check_decl_inner(
        ctx, decl, frame_decl_index, const_owners)) catch { _ => none }
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

fn registered_const_def_id_firebreak(ctx: InferCtx, name: Str) -> Int {
    match ctx.env.lookup(name) {
        some(scheme) => match scheme.def_id {
            some(def_id) => def_id,
            none => panic("unreachable: registered const has no DefId")
        },
        none => panic("unreachable: registered const is missing")
    }
}

fn maybe_registered_const_def_id(ctx: InferCtx, name: Str) -> Int? {
    match ctx.env.lookup(name) {
        some(scheme) => scheme.def_id,
        none => none
    }
}

fn replay_const_owner_hdecl(
    ctx: InferCtx, name: Str, mut cache: ConstOwnerCache
) -> HDecl {
    let def_id = match maybe_registered_const_def_id(ctx, name) {
        some(id) => id,
        none => fail.raise(CompileError {})
    }
    if cache.failed.contains(def_id) {
        fail.raise(CompileError {})
    }
    if cache.emitted.contains(def_id) {
        fail.raise(CompileError {})
    }
    match cache.checked.get(def_id) {
        some(HDecl::Const { def_id: some(cached_def_id), .. }) => {
            if cached_def_id != def_id {
                panic("unreachable: const owner cache DefId mismatch")
            }
            cache.emitted.insert(def_id)
            match cache.checked.get(def_id) {
                some(hdecl) => {
                    let replayed_hdecl = hdecl
                    replayed_hdecl
                },
                none => panic("unreachable: const owner cache lost HIR")
            }
        },
        some(_) => panic("unreachable: const owner cache contains non-const HIR"),
        none => panic("unreachable: final const body missed owner cache")
    }
}

fn check_const_decl_arm_firebreak(
    mut ctx: InferCtx, name: Str, type_annotation: TypeExpr?,
    init: Expr, is_pub: Bool, span: Span,
    const_owners: ConstOwnerCache?
) -> HDecl {
    match const_owners {
        some(cache) => return replay_const_owner_hdecl(ctx, name, cache),
        none => {}
    }
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
    mut ctx: InferCtx, decl: Decl, frame_decl_index: Int?,
    const_owners: ConstOwnerCache?
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
                declared_effects, body, is_pub, span, none, none, none, 0),
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
                ctx, name, type_annotation, init, is_pub, span,
                const_owners),
        Decl::ModBlock { name, uses, decls, required_effects, is_pub, span } =>
            check_mod_decl(
                ctx, name, uses, decls, required_effects,
                is_pub, span, frame_decl_index, const_owners),
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
    mut ctx: InferCtx, decl: Decl, decl_index: Int,
    const_owners: ConstOwnerCache?
) -> HDecl {
    let checked_decl = decl
    let checked_decl_index = decl_index
    check_decl(
        ctx, checked_decl, some(checked_decl_index), const_owners)
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
    is_pub: Bool, span: Span, project_frame_active: Bool,
    const_owners: ConstOwnerCache?
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

    // The outer SCC prepass enters a module before its source-ordered consts
    // are checked. Build a direct-function SCC view that can be retried in the
    // already-active module/project frame after each inner inferred const.
    let mut mod_fn_decls: List<Decl> = []
    let mut mod_fn_name_to_idx: Map<Str, Int> = map_new()
    let mut mod_registered_fns: Set<Str> = set_new()
    for source_decl in decls {
        let mod_name_for_prefix = "${mod_name}"
        let source_for_prefix = source_decl
        let prefixed_source = prefix_decl_name(
            mod_name_for_prefix, source_for_prefix)
        let prefixed_for_match = prefixed_source
        let prefixed_for_store = prefixed_source
        match prefixed_for_match {
            Decl::Fn { name, .. } => {
                let name_for_index = "${name}"
                let name_for_registered = "${name}"
                let fn_index = mod_fn_decls.len()
                mod_fn_decls.push(prefixed_for_store)
                mod_fn_name_to_idx.insert(name_for_index, fn_index)
                mod_registered_fns.insert(name_for_registered)
            },
            _ => {}
        }
    }
    let mod_call_graph = build_call_graph(
        mod_fn_decls, mod_registered_fns)
    let mod_scc_groups = tarjan_scc(mod_call_graph)

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
        match prefixed {
            // Direct functions are retained only after every non-function
            // declaration in this module (including nested modules/consts)
            // has completed, mirroring the file-root phase boundary.
            Decl::Fn { .. } | Decl::Impl { .. } |
            Decl::ModBlock { .. } => { continue },
            _ => {}
        }
        let result = some(check_indexed_decl_firebreak(
            ctx, prefixed, decl_index, const_owners)) catch { _ => none }
        match result {
            some(hd) => {
                // Update fn effects (same as check_one_decl)
                match hd {
                    HDecl::Fn {
                        name, params, return_type, effects, span: fn_span, ..
                    } => {
                        let registration_scheme = ctx.env.lookup(name)
                        if effects.effects.len() > 0 {
                            update_checked_fn_effects_firebreak(
                                ctx, name, effects)
                        }
                        rebind_fn_type(
                            ctx, name, params, return_type, effects,
                            fn_span, registration_scheme)
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
    // Nested modules may finalize inferred consts used by this module's impls.
    // Check them after direct data/const declarations but before impl bodies.
    for decl_index in 0..decls.len() {
        let decl = decls.get(decl_index).unwrap()
        let prefixed = if project_frame_active {
            match decl {
                Decl::ExternType { .. } => decl,
                _ => prefix_decl_name(mod_name, decl)
            }
        } else {
            prefix_decl_name(mod_name, decl)
        }
        match prefixed {
            Decl::ModBlock { .. } => {
                let result = some(check_indexed_decl_firebreak(
                    ctx, prefixed, decl_index,
                    const_owners)) catch { _ => none }
                match result {
                    some(hd) => {
                        match cap_row {
                            some(cap) => check_capability(
                                ctx, hd, cap, span),
                            none => {}
                        }
                        append_checked_hdecl_firebreak(hdecls, hd)
                    },
                    none => {}
                }
            },
            _ => {}
        }
    }

    // Retained impl methods run only after every const in this module subtree
    // is final, so their effect summaries cannot bind an isolated TypeVar.
    for decl_index in 0..decls.len() {
        let decl = decls.get(decl_index).unwrap()
        let prefixed = if project_frame_active {
            match decl {
                Decl::ExternType { .. } => decl,
                _ => prefix_decl_name(mod_name, decl)
            }
        } else {
            prefix_decl_name(mod_name, decl)
        }
        match prefixed {
            Decl::Impl {
                target_type, type_params: impl_tps,
                methods, span: impl_span, ..
            } => {
                let result = some(check_indexed_decl_firebreak(
                    ctx, prefixed, decl_index,
                    const_owners)) catch { _ => none }
                match result {
                    some(hd) => {
                        match cap_row {
                            some(cap) => check_capability(
                                ctx, hd, cap, span),
                            none => {}
                        }
                        append_checked_hdecl_firebreak(hdecls, hd)
                    },
                    none => {}
                }
                let canonical_target =
                    resolve_checked_nominal_identity_firebreak(
                        ctx, target_type)
                for method in methods {
                    match method {
                        Decl::Delegate {
                            field, trait_names, span: dspan
                        } => {
                            let delegate_impls = expand_delegate_impls_firebreak(
                                ctx, canonical_target, impl_tps,
                                field, trait_names, dspan)
                            for delegated in delegate_impls {
                                match cap_row {
                                    some(cap) => check_capability(
                                        ctx, delegated, cap, span),
                                    none => {}
                                }
                                append_checked_hdecl_firebreak(
                                    hdecls, delegated)
                            }
                        },
                        _ => {}
                    }
                }
            },
            _ => {}
        }
    }
    // All direct/nested const owners are now final. Re-run any blocked summary
    // SCC once more, then emit retained function HIR leaf-first. A bad final
    // const type is diagnosed here as an ordinary type mismatch; no pending
    // registration TypeVar can cross into the retained body.
    for scc_group in mod_scc_groups {
        for name in scc_group {
            set_fn_precheck_pending(ctx, name, false)
        }
        for name in scc_group {
            match mod_fn_name_to_idx.get(name) {
                some(fn_index) => match mod_fn_decls.get(fn_index) {
                    some(fn_decl) => {
                        let result = some(check_indexed_decl_firebreak(
                            ctx, fn_decl, fn_index,
                            const_owners)) catch { _ => none }
                        match result {
                            some(hd) => {
                                match hd {
                                    HDecl::Fn {
                                        name: checked_name,
                                        params, return_type, effects,
                                        span: fn_span, ..
                                    } => {
                                        let registration_scheme =
                                            ctx.env.lookup(checked_name)
                                        if effects.effects.len() > 0 {
                                            update_checked_fn_effects_firebreak(
                                                ctx, checked_name, effects)
                                        }
                                        rebind_fn_type(
                                            ctx, checked_name, params,
                                            return_type, effects, fn_span,
                                            registration_scheme)
                                    },
                                    _ => panic(
                                        "unreachable: inline fn SCC emitted a non-fn")
                                }
                                match cap_row {
                                    some(cap) => check_capability(
                                        ctx, hd, cap, span),
                                    none => {}
                                }
                                append_checked_hdecl_firebreak(hdecls, hd)
                            },
                            none => {}
                        }
                    },
                    none => panic(
                        "unreachable: inline fn SCC index is missing")
                },
                none => {}
            }
        }
    }
    HDecl::ModBlock { name: mod_name, decls: hdecls, is_pub: is_pub, span: span }
}

fn check_mod_decl_body_firebreak(
    mut ctx: InferCtx, mod_name: Str, uses: List<UseDecl>,
    decls: List<Decl>, required_effects: List<EffectExpr>?,
    is_pub: Bool, span: Span, project_frame_active: Bool,
    const_owners: ConstOwnerCache?
) -> HDecl {
    let checked_mod_name = mod_name
    let checked_uses = uses
    let checked_decls = decls
    let checked_required_effects = required_effects
    let checked_span = span
    check_mod_decl_body(
        ctx, checked_mod_name, checked_uses, checked_decls,
        checked_required_effects, is_pub, checked_span,
        project_frame_active, const_owners)
}

fn check_mod_decl(
    mut ctx: InferCtx, mod_name: Str, uses: List<UseDecl>,
    decls: List<Decl>, required_effects: List<EffectExpr>?,
    is_pub: Bool, span: Span, frame_decl_index: Int?,
    const_owners: ConstOwnerCache?
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
        is_pub, span, project_active, const_owners) catch { _ => {
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
    let registration_scheme = ctx.env.lookup(name)
    let old_def_id = match registration_scheme {
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
    // Keep the registration variable aligned with the completed owner before
    // rebinding. Exact aliases are fail-closed at value use while this source
    // is still a TypeVar, so no isolated consumer substitution is replayed
    // here (which would incorrectly monomorphize a generalized const).
    let restored_subst = match registration_scheme {
        some(registered) => unify_at(
            ctx.sink, ctx.env, registered.ty, resolved,
            saved_subst, span),
        none => saved_subst
    }
    let rebind_name = name
    rebind_scheme_with_exact_aliases(ctx, rebind_name, scheme)
    match old_def_id {
        some(def_id) => {
            ctx.pending_inferred_const_def_ids.remove(def_id)
        },
        none => {}
    }
    ctx.subst = restored_subst
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

fn duplicate_impl_precheck_str(value: Str) -> Str {
    "${value}"
}

fn duplicate_impl_precheck_trait_name(value: Str?) -> Str? {
    match value {
        some(name) => some("${name}"),
        none => none
    }
}

fn duplicate_impl_precheck_span(value: Span) -> Span {
    Span {
        file: "${value.file}",
        start: Position {
            line: value.start.line,
            column: value.start.column,
            offset: value.start.offset
        },
        end: Position {
            line: value.end.line,
            column: value.end.column,
            offset: value.end.offset
        }
    }
}

fn store_rebound_impl_method_scheme(
    mut ctx: InferCtx, target_type: Str, trait_name: Str?,
    origin: Str, method_name: Str, scheme: TypeScheme, span: Span
) {
    let method_name_for_entry = method_name
    let method_name_for_install = method_name
    let scheme_for_entry = scheme
    let scheme_for_install = scheme
    if ctx.impl_effect_precheck_active {
        let previous = registered_impl_method_scheme(
            ctx,
            duplicate_impl_precheck_str(target_type),
            duplicate_impl_precheck_trait_name(trait_name),
            duplicate_impl_precheck_str(origin),
            duplicate_impl_precheck_str(method_name))
        ctx.impl_effect_precheck_undo.push(ImplEffectPrecheckUndo {
            target_type: duplicate_impl_precheck_str(target_type),
            trait_name: duplicate_impl_precheck_trait_name(trait_name),
            origin: duplicate_impl_precheck_str(origin),
            method_name: duplicate_impl_precheck_str(method_name),
            previous_scheme: previous,
            span: duplicate_impl_precheck_span(span)
        })
    }
    match trait_name {
        some(_) => match find_impl_by_origin(
            ctx.env.trait_reg, target_type, origin) {
            some(entry) => insert_registered_impl_scheme_firebreak(
                entry.method_schemes,
                method_name_for_entry, scheme_for_entry),
            none => {}
        },
        none => {}
    }

    let installed_method_name = method_name_for_install
    let installed_scheme = scheme_for_install
    let installed_origin = method_origin_firebreak(
        ctx, origin, trait_name, span)
    let _ = install_method_scheme(
        ctx.env.trait_reg, ctx.sink,
        target_type, installed_method_name, installed_scheme,
        installed_origin)
}

struct ImplEffectPrecheckCommit {
    target_type: Str,
    trait_name: Str?,
    origin: Str,
    method_name: Str,
    scheme: TypeScheme,
    span: Span
}

fn impl_effect_precheck_projection(
    registration: TypeScheme, rebound: TypeScheme
) -> TypeScheme {
    let projected_type = match (registration.ty, rebound.ty) {
        (Type::FnType {
            params, return_type, meta
        }, Type::FnType { meta: rebound_meta, .. }) => Type::FnType {
            params: params,
            return_type: return_type,
            meta: fn_meta(rebound_meta.effects, meta.ownership_term)
        },
        _ => registration.ty
    }
    // Keep the rebind's effect-variable ownership, but never publish the
    // speculative parameter/return callable shape checked by this pre-pass.
    TypeScheme {
        ..registration,
        ty: projected_type,
        type_vars: rebound.type_vars,
        bounds: rebound.bounds
    }
}

fn rollback_impl_effect_precheck_schemes(
    mut ctx: InferCtx, checkpoint: Int
) {
    if checkpoint > ctx.impl_effect_precheck_undo.len() {
        panic("unreachable: invalid impl effect precheck checkpoint")
    }
    let mut index = ctx.impl_effect_precheck_undo.len()
    while index > checkpoint {
        index = index - 1
        match ctx.impl_effect_precheck_undo.get(index) {
            some(undo) => {
                let target_type = duplicate_impl_precheck_str(undo.target_type)
                let trait_name = duplicate_impl_precheck_trait_name(
                    undo.trait_name)
                let origin = duplicate_impl_precheck_str(undo.origin)
                let method_name = duplicate_impl_precheck_str(undo.method_name)
                let previous_scheme = undo.previous_scheme
                let span = duplicate_impl_precheck_span(undo.span)
                store_rebound_impl_method_scheme(
                    ctx, target_type, trait_name, origin,
                    method_name, previous_scheme, span)
            },
            none => panic("unreachable: missing impl effect precheck undo")
        }
    }
    ctx.impl_effect_precheck_undo =
        ctx.impl_effect_precheck_undo.slice(0, checkpoint)
}

fn collect_impl_effect_precheck_commits(
    ctx: InferCtx, checkpoint: Int
) -> List<ImplEffectPrecheckCommit> {
    let mut result: List<ImplEffectPrecheckCommit> = []
    let mut index = checkpoint
    while index < ctx.impl_effect_precheck_undo.len() {
        match ctx.impl_effect_precheck_undo.get(index) {
            some(undo) => {
                let lookup_target_type = duplicate_impl_precheck_str(
                    undo.target_type)
                let lookup_trait_name = duplicate_impl_precheck_trait_name(
                    undo.trait_name)
                let lookup_origin = duplicate_impl_precheck_str(undo.origin)
                let lookup_method_name = duplicate_impl_precheck_str(
                    undo.method_name)
                let rebound = registered_impl_method_scheme(
                    ctx, lookup_target_type, lookup_trait_name,
                    lookup_origin, lookup_method_name)
                let target_type = duplicate_impl_precheck_str(undo.target_type)
                let trait_name = duplicate_impl_precheck_trait_name(
                    undo.trait_name)
                let origin = duplicate_impl_precheck_str(undo.origin)
                let method_name = duplicate_impl_precheck_str(undo.method_name)
                let previous_scheme = undo.previous_scheme
                let span = duplicate_impl_precheck_span(undo.span)
                result.push(ImplEffectPrecheckCommit {
                    target_type: target_type,
                    trait_name: trait_name,
                    origin: origin,
                    method_name: method_name,
                    scheme: impl_effect_precheck_projection(
                        previous_scheme, rebound),
                    span: span
                })
            },
            none => panic("unreachable: missing impl effect precheck commit")
        }
        index = index + 1
    }
    result
}

fn publish_impl_effect_precheck_commits(
    mut ctx: InferCtx, commits: List<ImplEffectPrecheckCommit>
) {
    for commit in commits {
        let target_type = duplicate_impl_precheck_str(commit.target_type)
        let trait_name = duplicate_impl_precheck_trait_name(commit.trait_name)
        let origin = duplicate_impl_precheck_str(commit.origin)
        let method_name = duplicate_impl_precheck_str(commit.method_name)
        let scheme = commit.scheme
        let span = duplicate_impl_precheck_span(commit.span)
        store_rebound_impl_method_scheme(
            ctx, target_type, trait_name, origin,
            method_name, scheme, span)
    }
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
    registration_scheme: TypeScheme, rebind_identity: Str,
    registration_type_param_offset: Int
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
    let current_registration_type_param_offset =
        registration_type_param_offset
    check_fn_decl(
        ctx, current_name, current_type_params, current_params,
        current_return_type, current_declared_effects, current_body,
        is_pub, current_span, some(current_self_type),
        some(current_registration_scheme), some(current_rebind_identity),
        current_registration_type_param_offset)
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
    let current_target_type = duplicate_impl_precheck_str(target_type)
    let current_trait_name = duplicate_impl_precheck_trait_name(trait_name)
    let current_origin = duplicate_impl_precheck_str(origin)
    let current_method_name = duplicate_impl_precheck_str(method_name)
    let current_scheme = scheme
    let current_span = duplicate_impl_precheck_span(span)
    store_rebound_impl_method_scheme(
        ctx, current_target_type, current_trait_name, current_origin,
        current_method_name, current_scheme, current_span)
}

fn impl_trait_name_view_firebreak(trait_name: Str?) -> Str? {
    let current_trait_name = trait_name
    current_trait_name
}

fn check_impl_decl_canonical(mut ctx: InferCtx, target_type: Str, type_params: List<TypeParam>, trait_name: Str?, methods: List<Decl>, span: Span) -> HDecl {
    let target_for_pending = target_type
    let target_for_drop_check = target_type
    let target_for_recovery = target_type
    let target_for_origin = target_type
    let target_for_struct_lookup = target_type
    let target_for_enum_lookup = target_type
    let target_for_generic_self = target_type
    let target_for_plain_self = target_type
    let target_for_extern_registration = target_type
    let target_for_fn_registration = target_type
    let target_for_qualified_key = target_type
    let target_for_rebound_store = target_type
    let target_for_trait_impl_lookup = target_type
    let target_for_drop_display = target_type
    let target_for_clone_display = target_type
    let target_for_result = target_type
    if !ctx.impl_effect_precheck_active {
        set_impl_precheck_methods_pending(
            ctx, target_for_pending, type_params, trait_name, methods, span,
            false)
    }
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
       (!direct_drop_target_has_codegen_glue(ctx, target_for_drop_check) ||
        first_impl_trait_bound_span(type_params).is_some()) {
        return HDecl::Impl {
            target_type: target_for_recovery, type_params: type_params,
            trait_name: trait_name_for_recovery,
            methods: [], assoc_types: [], span: span
        }
    }
    let origin = impl_decl_origin(
        target_for_origin,
        trait_name_for_origin, type_params, span)
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
        match ctx.env.types.structs.get(target_for_struct_lookup) {
            some(def) => Type::StructType { name: def.name, type_params: impl_tp_types },
            none => match ctx.env.types.enums.get(target_for_enum_lookup) {
                some(def) => Type::EnumType { name: def.name, type_params: impl_tp_types },
                none => resolve_self_type(ctx, target_for_generic_self)
            }
        }
    } else {
        resolve_self_type(ctx, target_for_plain_self)
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
                    ctx, target_for_extern_registration,
                    trait_name_for_extern_registration,
                    origin, name)
                hmethods.push(check_impl_extern_method_firebreak(
                    ctx, name, mtps, params, declared_effects,
                    is_pub, mspan, registration_scheme))
            },
            Decl::Fn { name, type_params: mtps, params, return_type, declared_effects, body, is_pub, span: mspan, .. } => {
                let registration_scheme = registered_impl_method_scheme_firebreak(
                    ctx, target_for_fn_registration,
                    trait_name_for_fn_registration,
                    origin, name)
                let rebind_identity = impl_method_origin(origin, name)
                let checked_method = some(check_impl_fn_method_firebreak(
                    ctx, name, mtps, params, return_type, declared_effects,
                    body, is_pub, mspan, impl_self_type,
                    registration_scheme, rebind_identity,
                    type_params.len())) catch { _ => none }
                match checked_method {
                    some(hdecl) => {
                        let hdecl_for_rebind = hdecl
                        let hdecl_for_hir = hdecl
                        // #210: Also register fn_mut_params with qualified key for cross-module export.
                        // check_fn_decl inserts with unqualified `name`; exports.ring looks up
                        // with "${target_type}_${mname}", so we mirror that key here.
                        let qual_key = "${target_for_qualified_key}_${name}"
                        match ctx.fn_mut_params.get(name) {
                            some(flags) => insert_impl_fn_mut_flags_firebreak(
                                ctx, qual_key, flags),
                            none => {}
                        }
                        match hdecl_for_rebind {
                            HDecl::Fn {
                                name: mname, params: mparams,
                                return_type: mret, effects: meffects,
                                span: checked_span, ..
                            } => {
                                let rebound = rebind_checked_fn_scheme(
                                    ctx, rebind_identity,
                                    registration_scheme,
                                    mparams, mret, meffects, checked_span)
                                store_rebound_impl_method_scheme_firebreak(
                                    ctx, target_for_rebound_store,
                                    trait_name_for_rebound_store, origin,
                                    mname, rebound, checked_span)
                            },
                            _ => {}
                        }
                        hmethods.push(hdecl_for_hir)
                    },
                    none => {
                        if ctx.impl_effect_precheck_active {
                            // Continue through the impl so later method headers
                            // can seed an earlier peer that failed on an omitted
                            // default.  The enclosing impl remains blocked and
                            // commits no body/effect summaries this round.
                            ctx.impl_effect_precheck_blocked = true
                        } else {
                            fail.raise(CompileError {})
                        }
                    }
                }
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
                    ctx.env.trait_reg.trait_impls.get(
                        target_for_trait_impl_lookup)) {
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
                    let target_display = nominal_display_name(
                        target_for_drop_display)
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
                    let target_display = nominal_display_name(
                        target_for_clone_display)
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
    HDecl::Impl { target_type: target_for_result, type_params: type_params,
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
    is_mutable: Bool, is_move: Bool,
    ownership_metadata: OwnershipMetadata,
    fn_ownership: Int, param_index: Int, def_id: Int
) {
    let current_name = name
    let current_type = ty
    let current_def_id = def_id
    hparams.push(HParam {
        name: current_name, ty: current_type,
        def_id: some(current_def_id),
        flags: hparam_flags_with_force(is_mutable, if is_move {
            PARAM_OWNERSHIP_MOVE
        } else {
            callable_param_ownership(
                ownership_metadata, fn_ownership, param_index)
        }, is_move)
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
            let p_move = match ast_params {
                some(aps) => match aps.get(pi) {
                    some(ap) => ap.is_move,
                    none => false
                },
                none => false
            }
            let p_def_id = ctx.env.fresh_def_id()
            append_trait_param_firebreak(
                hparams, p_name, param_type, p_mutable, p_move,
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
            flags: hparam_flags_with_force(
                p.is_mutable, callable_param_ownership(
                    ctx.env.types.ownership_metadata, ownership, i),
                p.is_move)
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
    registration_type_param_offset: Int,
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
    let owner_registration_type_param_offset =
        registration_type_param_offset
    check_fn_decl_transaction(
        ctx, owner_name, owner_type_params, owner_params,
        owner_return_type, owner_declared_effects, owner_body,
        is_pub, owner_span, owner_self_type, owner_registration,
        owner_rebind_identity, owner_registration_type_param_offset,
        obligation_checkpoint)
}

fn check_fn_decl(
    mut ctx: InferCtx, name: Str, type_params: List<TypeParam>,
    params: List<Param>, return_type: TypeExpr?,
    declared_effects: List<EffectExpr>?, body: Expr,
    is_pub: Bool, span: Span, self_type: Type?,
    registration_override: TypeScheme?, rebind_identity: Str?,
    registration_type_param_offset: Int
) -> HDecl {
    let obligation_checkpoint = pending_dict_checkpoint(ctx)
    let error_projection_name = name
    let error_projection_registration = registration_override
    let default_seed_owner_def_id = match registration_override {
        some(scheme) => scheme.def_id,
        none => match ctx.env.lookup(name) {
            some(scheme) => scheme.def_id,
            none => none
        }
    }
    let default_authority_before = snapshot_default_authority_surface(ctx)
    // A formal function body is an inference owner just like a const
    // initializer. Any failure may occur before its local cleanup path (for
    // example while inferring a default), so retain a complete reversible
    // baseline while deliberately leaving emitted diagnostics intact.
    let owner_transaction_before = snapshot_const_owner_transaction(ctx)
    let result = some(check_fn_decl_transaction_firebreak(
        ctx, name, type_params, params, return_type,
        declared_effects, body, is_pub, span, self_type,
        registration_override, rebind_identity,
        registration_type_param_offset,
        obligation_checkpoint)) catch { _ => none }
    let project_default_error =
        ctx.pending_fn_default_error_rebinds.contains(
            error_projection_name)
    ctx.pending_fn_default_error_rebinds.remove(error_projection_name)
    let pending_seed_authority = match default_seed_owner_def_id {
        some(def_id) => match ctx.pending_fn_default_seed_values.get(def_id) {
            some(defaults) => some(capture_default_authority_delta(
                ctx, defaults, default_authority_before)),
            none => none
        },
        none => none
    }
    match result {
        some(hdecl) => {
            assert_pending_dict_owner_closed(ctx, obligation_checkpoint)
            let checked_decl = hdecl
            checked_decl
        },
        none => {
            restore_const_owner_transaction(
                ctx, owner_transaction_before)
            reapply_pending_fn_default_seeds(ctx)
            match pending_seed_authority {
                some(capture) => merge_default_authority_capture(ctx, capture),
                none => {}
            }
            if project_default_error {
                let recovery_registration = error_projection_registration
                let recovery_scheme = if recovery_registration.is_some() {
                    some(recovery_registration.unwrap())
                } else {
                    ctx.env.lookup(error_projection_name)
                }
                match recovery_scheme {
                    some(scheme) => ctx.env.rebind(
                        error_projection_name, TypeScheme {
                            ty: Type::ErrorType,
                            type_vars: [], bounds: [],
                            def_id: scheme.def_id
                        }),
                    none => {}
                }
            }
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

fn build_default_owner_registration_mapping(
    ctx: InferCtx, fn_name: Str, registration_scheme: TypeScheme?,
    type_params: List<TypeParam>, checked_params: List<HParam>,
    checked_return: Type, checked_effects: EffectRow,
    registration_type_param_offset: Int
) -> Map<Int, Type> {
    let mut mapping: Map<Int, Type> = map_new()
    let mut conflicts: Set<Int> = set_new()
    match registration_scheme {
        some(scheme) => {
            // Declared owner variables have stable positional identity even
            // when one is absent from the callable surface and appears only
            // inside a default expression.
            let mut type_param_index = 0
            for type_param in type_params {
                match (ctx.type_param_scope.get(type_param.name),
                       scheme.type_vars.get(
                           registration_type_param_offset +
                           type_param_index)) {
                    (some(checked_owner), some(registration_id)) => {
                        let resolved_owner = apply_subst(
                            ctx.subst, checked_owner)
                        match resolved_owner {
                            Type::TypeVar { id: checked_id, .. } =>
                                record_check_registration_mapping_firebreak(
                                    ctx.env.types.ownership_metadata,
                                    checked_id,
                                    Type::TypeVar {
                                        id: registration_id, name: none
                                    },
                                    mapping, conflicts),
                            _ => {}
                        }
                    },
                    _ => {}
                }
                type_param_index = type_param_index + 1
            }

            match scheme.ty {
                Type::FnType {
                    params: registration_params,
                    return_type: registration_return,
                    meta: registration_meta
                } => {
                    let mut param_index = 0
                    for checked_param in checked_params {
                        match registration_params.get(param_index) {
                            some(registration_param) =>
                                build_registration_check_mapping_firebreak(
                                    ctx.env.types.ownership_metadata,
                                    checked_param.ty, registration_param,
                                    mapping, conflicts),
                            none => {}
                        }
                        param_index = param_index + 1
                    }
                    build_registration_check_mapping_firebreak(
                        ctx.env.types.ownership_metadata,
                        checked_return, registration_return,
                        mapping, conflicts)
                    build_effect_var_mapping(
                        ctx.env.types.ownership_metadata,
                        checked_effects, registration_meta.effects,
                        mapping, conflicts)
                },
                _ => {}
            }

            // Associated-type variables may live only in SchemeBounds. Their
            // exact owner mapping was captured while the function scope was
            // still live by check_fn_body.
            match ctx.rebind_assoc_provenance.get(fn_name) {
                some(entries) => {
                    for entry in entries {
                        match (entry.check_type, entry.registration_type) {
                            (Type::TypeVar { id: checked_id, .. },
                             some(registration_type)) =>
                                record_check_registration_mapping_firebreak(
                                    ctx.env.types.ownership_metadata,
                                    checked_id, registration_type,
                                    mapping, conflicts),
                            _ => {}
                        }
                    }
                },
                none => {}
            }
        },
        none => {}
    }
    for conflict in conflicts { mapping.remove(conflict) }
    mapping
}

fn collect_default_local_var_bounds(
    ctx: InferCtx, defaults: List<HExpr>, registration_scheme: TypeScheme?
) -> Map<Int, Set<Str>> {
    let mut owner_vars: Set<Int> = set_new()
    match registration_scheme {
        some(scheme) => {
            for var_id in scheme.type_vars { owner_vars.insert(var_id) }
            for var_id in free_type_vars(scheme.ty, empty_subst()) {
                owner_vars.insert(var_id)
            }
            for bound in scheme.bounds {
                owner_vars.insert(bound.type_var)
                for constraint in bound.assoc_constraints {
                    for var_id in free_type_vars(
                            constraint.ty, empty_subst()) {
                        owner_vars.insert(var_id)
                    }
                }
            }
        },
        none => {}
    }
    let mut result: Map<Int, Set<Str>> = map_new()
    let template_vars = default_template_var_ids(defaults)
    for var_id in template_vars {
        if !owner_vars.contains(var_id) {
            match ctx.env.scope.var_bounds.get(var_id) {
                some(bounds) => result.insert(var_id, set_clone(bounds)),
                none => {}
            }
        }
    }
    result
}

fn publish_fn_defaults_firebreak(
    mut ctx: InferCtx,
    owner_def_id: Int?,
    defaults: List<HExpr>,
    local_var_bounds: Map<Int, Set<Str>>,
    min_arity: Int
) {
    match owner_def_id {
        some(def_id) => {
            let id_for_defaults = def_id
            let id_for_bounds = def_id
            let id_for_min_arity = def_id
            let exact_defaults = defaults
            ctx.fn_defaults.insert(id_for_defaults, exact_defaults)
            ctx.fn_default_var_bounds.insert(id_for_bounds, local_var_bounds)
            ctx.fn_min_arity.insert(id_for_min_arity, min_arity)
        },
        none => {}
    }
}

fn default_owner_def_id_for_name(ctx: InferCtx, name: Str) -> Int? {
    match ctx.env.lookup(name) {
        some(scheme) => scheme.def_id,
        none => none
    }
}

fn default_values_for_name(ctx: InferCtx, name: Str) -> List<HExpr>? {
    match default_owner_def_id_for_name(ctx, name) {
        some(def_id) => ctx.fn_defaults.get(def_id),
        none => none
    }
}

fn restore_fn_default_metadata_firebreak(
    mut ctx: InferCtx,
    defaults: Map<Int, List<HExpr>>,
    local_var_bounds: Map<Int, Map<Int, Set<Str>>>,
    min_arities: Map<Int, Int>
) {
    ctx.fn_defaults = defaults
    ctx.fn_default_var_bounds = local_var_bounds
    ctx.fn_min_arity = min_arities
}

fn store_pending_fn_default_seed(
    mut ctx: InferCtx, owner_def_id: Int?
) {
    match owner_def_id {
        some(def_id) => match (
            ctx.fn_defaults.get(def_id),
            ctx.fn_default_var_bounds.get(def_id),
            ctx.fn_min_arity.get(def_id)
        ) {
            (some(values), some(bounds), some(min_arity)) => {
                let seed_values = values
                let seed_bounds = bounds
                ctx.pending_fn_default_seed_values.insert(def_id, seed_values)
                ctx.pending_fn_default_seed_var_bounds.insert(def_id, seed_bounds)
                ctx.pending_fn_default_seed_min_arities.insert(
                    def_id, min_arity)
            },
            _ => {}
        },
        none => {}
    }
}

fn clear_pending_fn_default_seed(
    mut ctx: InferCtx, owner_def_id: Int?
) {
    match owner_def_id {
        some(def_id) => {
            ctx.pending_fn_default_seed_values.remove(def_id)
            ctx.pending_fn_default_seed_var_bounds.remove(def_id)
            ctx.pending_fn_default_seed_min_arities.remove(def_id)
        },
        none => {}
    }
}

fn reapply_pending_fn_default_seeds(mut ctx: InferCtx) {
    for entry in ctx.pending_fn_default_seed_values.entries() {
        let (def_id, values) = entry
        let seed_values = values
        match (
            ctx.pending_fn_default_seed_var_bounds.get(def_id),
            ctx.pending_fn_default_seed_min_arities.get(def_id)
        ) {
            (some(bounds), some(min_arity)) => {
                let seed_bounds = bounds
                ctx.fn_defaults.insert(def_id, seed_values)
                ctx.fn_default_var_bounds.insert(def_id, seed_bounds)
                ctx.fn_min_arity.insert(def_id, min_arity)
            },
            _ => panic(
                "unreachable: pending function default seed is incomplete")
        }
    }
}

fn finalize_pending_fn_default_seeds(mut ctx: InferCtx) {
    let seed_count = ctx.pending_fn_default_seed_values.entries().len()
    if seed_count != ctx.pending_fn_default_seed_var_bounds.entries().len() ||
       seed_count != ctx.pending_fn_default_seed_min_arities.entries().len() {
        panic("unreachable: pending function default seed maps diverged")
    }
    if seed_count == 0 { return }
    if !ctx.sink.has_errors() {
        panic("unreachable: valid program retained pending function default seeds")
    }
    // Error recovery may skip an owner whose registration failed.  Its retry
    // seed is not part of retained HIR and must not survive into freeze.
    let mut stale_ids: List<Int> = []
    for entry in ctx.pending_fn_default_seed_values.entries() {
        stale_ids.push(entry.0)
    }
    for def_id in stale_ids {
        ctx.fn_defaults.remove(def_id)
        ctx.fn_default_var_bounds.remove(def_id)
        ctx.fn_min_arity.remove(def_id)
    }
    ctx.pending_fn_default_seed_values.clear()
    ctx.pending_fn_default_seed_var_bounds.clear()
    ctx.pending_fn_default_seed_min_arities.clear()
}

fn preliminary_default_owner_effects(
    registration_scheme: TypeScheme?,
    declared_effects: EffectRow?
) -> EffectRow {
    match declared_effects {
        some(row) => row,
        none => match registration_scheme {
            some(scheme) => match scheme.ty {
                Type::FnType { meta, .. } => meta.effects,
                _ => EMPTY_ROW
            },
            none => EMPTY_ROW
        }
    }
}

fn check_fn_decl_transaction(
    mut ctx: InferCtx, name: Str, type_params: List<TypeParam>,
    params: List<Param>, return_type: TypeExpr?,
    declared_effects: List<EffectExpr>?, body: Expr,
    is_pub: Bool, span: Span, self_type: Type?,
    registration_override: TypeScheme?, rebind_identity: Str?,
    registration_type_param_offset: Int,
    obligation_checkpoint: Int
) -> HDecl {
    let name_for_registration_lookup = name
    let name_for_provenance_key = name
    let name_for_default_marker = name
    let name_for_error_rebind = name
    let name_for_main_equality = name
    let name_for_main_suffix = name
    let name_for_mut_params = name
    let final_name = name
    // This check owns the declaration's default metadata. Keep an atomic
    // snapshot so a failed retained check cannot erase the last authoritative
    // precheck summary. The current owner installs its own normalized triple
    // before checking the body, which lets direct recursion use omitted
    // defaults without observing a stale same-spelled owner.
    let fn_defaults_before = map_clone(ctx.fn_defaults)
    let fn_default_var_bounds_before = map_clone(
        ctx.fn_default_var_bounds)
    let fn_min_arity_before = map_clone(ctx.fn_min_arity)
    // Save the registration scheme before entering the parameter scope: a
    // parameter is allowed to have the same spelling as its function.
    let registration_scheme = match registration_override {
        some(scheme) => {
            let exact_registration = scheme
            some(exact_registration)
        },
        none => ctx.env.lookup(name_for_registration_lookup)
    }
    let default_owner_def_id = match registration_scheme {
        some(scheme) => scheme.def_id,
        none => none
    }
    match default_owner_def_id {
        some(def_id) => {
            ctx.fn_defaults.remove(def_id)
            ctx.fn_default_var_bounds.remove(def_id)
            ctx.fn_min_arity.remove(def_id)
        },
        none => {}
    }
    let registration_for_ownership = registration_scheme
    let ownership_contract = match registration_for_ownership {
        some(scheme) => ownership_from_fn_type(scheme.ty, params.len()),
        none => CALLABLE_BORROW_OWNED
    }
    let rebind_identity_for_key = rebind_identity
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
            flags: hparam_flags_with_force(p.is_mutable, if p.is_move {
                PARAM_OWNERSHIP_MOVE
            } else {
                callable_param_ownership(
                    ctx.env.types.ownership_metadata,
                    ownership_contract, ownership_param_index)
            }, p.is_move)
        })
        let ptype_for_param_types = ptype
        param_types.push(ptype_for_param_types)
        ownership_param_index = ownership_param_index + 1
    }

    // B-069: Infer default value expressions and store in hparams
    let mut has_declared_defaults = false
    for param in params {
        if param.default_value.is_some() { has_declared_defaults = true }
    }
    // Once a retained canonical owner enters default checking, any terminal
    // failure must invalidate its preregistered callable scheme after the full
    // owner transaction rolls back.  Otherwise later omitted calls reinterpret
    // the same default as a required argument and cascade.  Speculative fn and
    // impl prechecks never publish this recovery projection.
    if has_declared_defaults && rebind_identity.is_none() &&
       !ctx.discarded_fn_precheck_active &&
       !ctx.impl_effect_precheck_active {
        ctx.pending_fn_default_error_rebinds.insert(name_for_default_marker)
    }
    let default_authority_before = if has_declared_defaults {
        some(snapshot_default_authority_surface(ctx))
    } else { none }
    let mut default_hexprs: List<HExpr> = []
    let mut default_evidence_valid = true
    let mut default_parameter_references_valid = true
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
                // Defaults are expanded into caller HIR.  A reference to a
                // callee parameter would therefore be a dangling exact DefId;
                // substituting the caller expression would also duplicate
                // evaluation.  Keep this boundary explicit until call-site
                // ANF can materialize preceding arguments exactly once.
                let mut default_def_ids: Set<Int> = set_new()
                collect_default_authority_expr(
                    dv_result.hexpr, default_def_ids)
                let mut references_param = false
                for hparam in hparams {
                    match hparam.def_id {
                        some(param_def_id) => if default_def_ids.contains(
                                param_def_id) {
                            references_param = true
                        },
                        none => {}
                    }
                }
                if references_param {
                    let _ = type_error(ctx.sink, E0301,
                        "Default parameter value for '${p.name}' cannot reference another parameter",
                        p.span,
                        DiagnosticContext::OtherContext {
                            detail: some(
                                "call-site defaults require independent expressions")
                        })
                    // Keep the owner alive until its transient function scope,
                    // substitution and bound stacks have been restored below.
                    default_parameter_references_valid = false
                }
                // Check that default value is pure (no effects)
                let dv_effects = apply_subst_row(
                    ctx.subst, dv_result.effects)
                if dv_effects.effects.len() > 0 ||
                   dv_effects.tail.is_some() {
                    let _ = type_error(ctx.sink, E0404,
                        "Default parameter value for '${p.name}' must be a pure expression (no effects)",
                        p.span,
                        DiagnosticContext::OtherContext { detail: some("default parameter effect") })
                    default_evidence_valid = false
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

    // Recursive calls in the owner body resolve defaults through the same
    // global metadata path as every other call. Publish a provisional but
    // registration-normalized template before entering the body; the final
    // body substitution below replaces it atomically on success.
    if default_hexprs.len() > 0 {
        let preliminary_zctx = ZonkCtx {
            subst: ctx.subst, names: map_new(),
            dict_resolver: none,
            ownership_metadata: some(ctx.env.types.ownership_metadata),
            require_exact_ownership: false
        }
        let mut preliminary_defaults: List<HExpr> = []
        for default in default_hexprs {
            preliminary_defaults.push(zonk_expr(
                preliminary_zctx, default))
        }
        let preliminary_effects = apply_subst_row(
            ctx.subst,
            preliminary_default_owner_effects(
                registration_scheme, owner_declared_effects))
        let preliminary_mapping =
            build_default_owner_registration_mapping(
                ctx, provenance_key, registration_scheme, type_params,
                hparams, apply_subst(ctx.subst, expected_ret),
                preliminary_effects,
                registration_type_param_offset)
        let mut normalized_preliminary_defaults: List<HExpr> = []
        for default in preliminary_defaults {
            normalized_preliminary_defaults.push(
                rewrite_default_template_types(
                    default, preliminary_mapping))
        }
        let preliminary_local_var_bounds =
            collect_default_local_var_bounds(
                ctx, normalized_preliminary_defaults,
                registration_scheme)
        publish_fn_defaults_firebreak(
            ctx, default_owner_def_id, normalized_preliminary_defaults,
            preliminary_local_var_bounds, min_arity)
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
    let mut default_local_var_bounds: Map<Int, Set<Str>> = map_new()
    let mut default_authority_capture: DefaultAuthorityCapture? = none
    match try_result {
        some(checked_fn) => {
            let zctx_defaults = ZonkCtx {
                subst: ctx.subst, names: map_new(),
                dict_resolver: none,
                ownership_metadata: some(ctx.env.types.ownership_metadata),
                require_exact_ownership: false
            }
            for dh in default_hexprs {
                zonked_defaults.push(zonk_expr(zctx_defaults, dh))
            }
            let owner_mapping = build_default_owner_registration_mapping(
                ctx, provenance_key, registration_scheme, type_params,
                checked_fn.params, checked_fn.ret, checked_fn.eff,
                registration_type_param_offset)
            let mut normalized_defaults: List<HExpr> = []
            for default in zonked_defaults {
                normalized_defaults.push(rewrite_default_template_types(
                    default, owner_mapping))
            }
            zonked_defaults = normalized_defaults
            default_local_var_bounds = collect_default_local_var_bounds(
                ctx, zonked_defaults, registration_scheme)
            match default_authority_before {
                some(before) => {
                    default_authority_capture = some(
                        capture_default_authority_delta(
                            ctx, zonked_defaults, before))
                },
                none => {}
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
        none => {
            if default_parameter_references_valid &&
               default_evidence_valid &&
               (ctx.discarded_fn_precheck_active ||
                ctx.impl_effect_precheck_active) {
                store_pending_fn_default_seed(ctx, default_owner_def_id)
            } else if !ctx.discarded_fn_precheck_active &&
                      !ctx.impl_effect_precheck_active {
                clear_pending_fn_default_seed(ctx, default_owner_def_id)
            }
            restore_fn_default_metadata_firebreak(
                ctx, fn_defaults_before,
                fn_default_var_bounds_before,
                fn_min_arity_before)
            fail.raise(CompileError {})
        }
    }
    if !default_parameter_references_valid {
        clear_pending_fn_default_seed(ctx, default_owner_def_id)
        match default_authority_capture {
            some(capture) => remove_default_authority_def_ids(
                ctx, capture.def_ids),
            none => {}
        }
        restore_fn_default_metadata_firebreak(
            ctx, fn_defaults_before,
            fn_default_var_bounds_before,
            fn_min_arity_before)
        fail.raise(CompileError {})
    }
    // Invalid default evidence has already produced its precise E0503.  Abort
    // only after restoring all transient owner scopes, and never publish the
    // shared fn_defaults value that carried caller-owned inference variables.
    let registration_for_error_rebind = registration_scheme
    if !default_evidence_valid {
        clear_pending_fn_default_seed(ctx, default_owner_def_id)
        match default_authority_capture {
            some(capture) => remove_default_authority_def_ids(
                ctx, capture.def_ids),
            none => {}
        }
        // Phase 1 has already made a top-level declaration visible to later
        // bodies.  Replace that preregistered scheme with ErrorType before
        // recovery continues: otherwise later calls reinterpret the omitted
        // default as a required parameter and cascade with E0301 / bound
        // failures.  Impl methods use their origin-keyed registration path and
        // are rolled back by the enclosing impl owner, so do not rebind an
        // unrelated same-spelled global here.
        if rebind_identity.is_none() &&
           !ctx.discarded_fn_precheck_active {
            match registration_for_error_rebind {
                some(_) => {
                    ctx.pending_fn_default_error_rebinds.insert(
                        name_for_error_rebind)
                },
                none => {}
            }
        }
        restore_fn_default_metadata_firebreak(
            ctx, fn_defaults_before,
            fn_default_var_bounds_before,
            fn_min_arity_before)
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
    if name_for_main_equality == "main" ||
       name_for_main_suffix.ends_with("$$_main") {
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
    ctx.fn_mut_params.insert(name_for_mut_params, mut_flags)

    // B-069: Register default parameter info for call-site expansion
    if zonked_defaults.len() > 0 {
        match default_authority_capture {
            some(capture) => merge_default_authority_capture(ctx, capture),
            none => {}
        }
        publish_fn_defaults_firebreak(
            ctx, default_owner_def_id, zonked_defaults,
            default_local_var_bounds, min_arity)
    }
    clear_pending_fn_default_seed(ctx, default_owner_def_id)

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
    mut hdecls: List<HDecl>, const_owners: ConstOwnerCache?
) {
    let hd = check_decl(ctx, decl, frame_decl_index, const_owners)

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
    mut hdecls: List<HDecl>, const_owners: ConstOwnerCache?
) {
    let hd = check_decl(ctx, decl, frame_decl_index, const_owners)

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
        ctx, precheck_decl, some(precheck_index), discarded, none)
}

fn precheck_inline_fn_in_mod_body(
    mut ctx: InferCtx,
    mod_name: Str,
    uses: List<UseDecl>,
    decls: List<Decl>,
    required_effects: List<EffectExpr>?,
    target_name: Str,
    project_frame_active: Bool,
    default_authority_before: DefaultAuthorityCapture,
    mut default_authority_captures: List<DefaultAuthorityCapture>
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
                    match result {
                        some(_) => {
                            match default_values_for_name(ctx, target_name) {
                                some(defaults) => {
                                    default_authority_captures.push(
                                        capture_default_authority_delta(
                                            ctx, defaults,
                                            default_authority_before))
                                },
                                none => {}
                            }
                            found = true
                        },
                        none => fail.raise(CompileError {})
                    }
                }
            },
            Decl::ModBlock { name, uses: nested_uses, decls: nested_decls, required_effects: nested_required, .. } => {
                if !found && precheck_inline_fn_in_mod(
                    ctx, name, nested_uses, nested_decls,
                    nested_required, target_name, decl_index,
                    default_authority_before,
                    default_authority_captures) {
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
    frame_decl_index: Int,
    default_authority_before: DefaultAuthorityCapture,
    mut default_authority_captures: List<DefaultAuthorityCapture>
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
        target_name, project_active, default_authority_before,
        default_authority_captures) catch { _ => {
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
    mut ctx: InferCtx, decls: List<Decl>, target_name: Str,
    default_authority_before: DefaultAuthorityCapture,
    mut default_authority_captures: List<DefaultAuthorityCapture>
) -> Bool {
    for decl_index in 0..decls.len() {
        let decl = decls.get(decl_index).unwrap()
        match decl {
            Decl::ModBlock { name, uses, decls: mod_decls, required_effects, .. } => {
                if precheck_inline_fn_in_mod(
                    ctx, name, uses, mod_decls, required_effects,
                    target_name, decl_index, default_authority_before,
                    default_authority_captures) { return true }
            },
            _ => {}
        }
    }
    false
}

fn inline_fn_is_in_mod(
    mod_name: Str, decls: List<Decl>, target_name: Str
) -> Bool {
    for decl_index in 0..decls.len() {
        let source_decl = decls.get(decl_index)
        if !source_decl.is_some() { continue }
        let decl = source_decl.unwrap()
        let mod_name_for_prefix = "${mod_name}"
        let prefixed = prefix_decl_name(mod_name_for_prefix, decl)
        match prefixed {
            Decl::Fn { name, .. } => {
                if name == target_name { return true }
            },
            Decl::ModBlock { name, decls: nested, .. } => {
                let nested_name = "${name}"
                let nested_decls = list_clone(nested)
                let nested_target = "${target_name}"
                if inline_fn_is_in_mod(
                    nested_name, nested_decls, nested_target
                ) {
                    return true
                }
            },
            _ => {}
        }
    }
    false
}

fn inline_fn_owner_index(
    decls: List<Decl>, target_name: Str
) -> Int? {
    for index in 0..decls.len() {
        match decls.get(index) {
            some(Decl::ModBlock { name, decls: nested, .. }) => {
                if inline_fn_is_in_mod(name, nested, target_name) {
                    return some(index)
                }
            },
            _ => {}
        }
    }
    none
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
                ctx, decl, none, discarded, none)) catch { _ => none }
            match result {
                some(_) => {},
                none => fail.raise(CompileError {})
            }
        },
        none => {}
    }
}

fn set_fn_precheck_pending(
    mut ctx: InferCtx, name: Str, pending: Bool
) {
    match ctx.env.lookup(name) {
        some(scheme) => match scheme.def_id {
            some(def_id) => {
                if pending {
                    ctx.pending_precheck_callable_def_ids.insert(def_id)
                } else {
                    ctx.pending_precheck_callable_def_ids.remove(def_id)
                }
            },
            none => {}
        },
        none => {}
    }
}

fn collect_default_authority_optional_def_id(
    def_id: Int?, mut result: Set<Int>
) {
    match def_id {
        some(id) => { result.insert(id) },
        none => {}
    }
}

fn collect_default_authority_stmt(stmt: HStmt, mut result: Set<Int>) {
    match stmt {
        HStmt::Let { def_id, init, .. } |
        HStmt::Var { def_id, init, .. } => {
            collect_default_authority_optional_def_id(def_id, result)
            collect_default_authority_expr(init, result)
        },
        HStmt::Assign { target, value, .. } => {
            collect_default_authority_expr(target, result)
            collect_default_authority_expr(value, result)
        },
        HStmt::ExprStmt { expr, .. } =>
            collect_default_authority_expr(expr, result),
        HStmt::Return { value, .. } => match value {
            some(expr) => collect_default_authority_expr(expr, result),
            none => {}
        },
        HStmt::While { condition, body, .. } => {
            collect_default_authority_expr(condition, result)
            collect_default_authority_expr(body, result)
        },
        HStmt::ForIn {
            def_id, destructure, iterable, body, ..
        } => {
            collect_default_authority_optional_def_id(def_id, result)
            match destructure {
                some(bindings) => {
                    for binding in bindings {
                        collect_default_authority_optional_def_id(
                            binding.def_id, result)
                    }
                },
                none => {}
            }
            collect_default_authority_expr(iterable, result)
            collect_default_authority_expr(body, result)
        },
        HStmt::LetDestructure { bindings, init, .. } => {
            for binding in bindings {
                collect_default_authority_optional_def_id(
                    binding.def_id, result)
            }
            collect_default_authority_expr(init, result)
        },
        HStmt::IfLet {
            bindings, expr, then_block, else_block, ..
        } => {
            for binding in bindings { result.insert(binding.def_id) }
            collect_default_authority_expr(expr, result)
            collect_default_authority_expr(then_block, result)
            match else_block {
                some(block) => collect_default_authority_expr(block, result),
                none => {}
            }
        },
        HStmt::Drop { def_id, .. } => { result.insert(def_id) },
        HStmt::Break { .. } | HStmt::Continue { .. } => {}
    }
}

fn collect_default_authority_expr(expr: HExpr, mut result: Set<Int>) {
    match expr {
        HExpr::Ident { def_id, .. } =>
            collect_default_authority_optional_def_id(def_id, result),
        HExpr::BinOp { left, right, .. } => {
            collect_default_authority_expr(left, result)
            collect_default_authority_expr(right, result)
        },
        HExpr::UnaryOp { operand, .. } =>
            collect_default_authority_expr(operand, result),
        HExpr::Call {
            callee, callee_def_id, callable_result_def_id, args, ..
        } => {
            collect_default_authority_optional_def_id(callee_def_id, result)
            collect_default_authority_optional_def_id(
                callable_result_def_id, result)
            collect_default_authority_expr(callee, result)
            for arg in args { collect_default_authority_expr(arg, result) }
        },
        HExpr::FieldAccess { receiver, .. } =>
            collect_default_authority_expr(receiver, result),
        HExpr::StructLit { fields, spread, .. } |
        HExpr::NamedVariantConstruct { fields, spread, .. } => {
            for field in fields {
                collect_default_authority_expr(field.value, result)
            }
            match spread {
                some(value) => collect_default_authority_expr(value, result),
                none => {}
            }
        },
        HExpr::MatchExpr { scrutinee, arms, .. } => {
            collect_default_authority_expr(scrutinee, result)
            for arm in arms {
                for binding in arm.bindings { result.insert(binding.def_id) }
                match arm.guard {
                    some(guard) => collect_default_authority_expr(guard, result),
                    none => {}
                }
                collect_default_authority_expr(arm.body, result)
            }
        },
        HExpr::TryCatch { body, arms, .. } => {
            collect_default_authority_expr(body, result)
            for arm in arms {
                for binding in arm.bindings { result.insert(binding.def_id) }
                match arm.guard {
                    some(guard) => collect_default_authority_expr(guard, result),
                    none => {}
                }
                collect_default_authority_expr(arm.body, result)
            }
        },
        HExpr::Block { stmts, tail, .. } => {
            for stmt in stmts { collect_default_authority_stmt(stmt, result) }
            match tail {
                some(value) => collect_default_authority_expr(value, result),
                none => {}
            }
        },
        HExpr::IfExpr {
            condition, then_branch, else_branch, ..
        } => {
            collect_default_authority_expr(condition, result)
            collect_default_authority_expr(then_branch, result)
            match else_branch {
                some(branch) => collect_default_authority_expr(branch, result),
                none => {}
            }
        },
        HExpr::StringInterp { parts, .. } => {
            for part in parts {
                match part {
                    HStringInterpPart::Expression(value) =>
                        collect_default_authority_expr(value, result),
                    HStringInterpPart::Literal(_) => {}
                }
            }
        },
        HExpr::HandleExpr { body, handlers, .. } => {
            collect_default_authority_expr(body, result)
            for handler in handlers {
                for param in handler.params {
                    collect_default_authority_optional_def_id(
                        param.def_id, result)
                }
                match handler.resume_binding {
                    some(binding) => { result.insert(binding.def_id) },
                    none => {}
                }
                collect_default_authority_expr(handler.body, result)
            }
        },
        HExpr::Lambda { def_id, params, body, .. } => {
            result.insert(def_id)
            for param in params {
                collect_default_authority_optional_def_id(param.def_id, result)
            }
            collect_default_authority_expr(body, result)
        },
        HExpr::EffectOp { args, .. } => {
            for arg in args {
                collect_default_authority_expr(arg, result)
            }
        },
        HExpr::RangeExpr { start, end, .. } => {
            collect_default_authority_expr(start, result)
            collect_default_authority_expr(end, result)
        },
        HExpr::ListLit { elements, .. } |
        HExpr::TupleLit { elements, .. } => {
            for element in elements {
                collect_default_authority_expr(element, result)
            }
        },
        HExpr::IndexExpr { receiver, index, .. } => {
            collect_default_authority_expr(receiver, result)
            collect_default_authority_expr(index, result)
        },
        HExpr::Clone { inner, .. } =>
            collect_default_authority_expr(inner, result),
        HExpr::Take { source_def_id, .. } => { result.insert(source_def_id) },
        HExpr::ReturnExpr { value, .. } => match value {
            some(returned) => collect_default_authority_expr(returned, result),
            none => {}
        },
        HExpr::UnsafeBlock { body, .. } =>
            collect_default_authority_expr(body, result),
        HExpr::IntLit { .. } | HExpr::FloatLit { .. } |
        HExpr::StrLit { .. } | HExpr::BoolLit { .. } |
        HExpr::DictConstruct { .. } => {}
    }
}

fn snapshot_default_authority_surface(ctx: InferCtx) -> DefaultAuthorityCapture {
    DefaultAuthorityCapture {
        def_ids: set_new(),
        callable_by_def_id: map_clone(
            ctx.env.types.ownership_metadata.callable_by_def_id),
        callable_state_by_def_id: map_clone(
            ctx.env.types.ownership_metadata.callable_state_by_def_id),
        callable_result_role_by_def_id: map_clone(
            ctx.env.types.ownership_metadata.callable_result_role_by_def_id),
        returned_callable_result_role_by_def_id: map_clone(
            ctx.env.types.ownership_metadata
                .returned_callable_result_role_by_def_id),
        callable_result_role_spine_by_def_id: map_clone(
            ctx.env.types.ownership_metadata
                .callable_result_role_spine_by_def_id),
        use_aliases: map_clone(ctx.use_aliases),
        value_binding_kinds: map_clone(ctx.value_binding_kinds),
        live_schemes_by_def_id: map_clone(
            ctx.default_template_live_schemes),
        variant_ctor_origins: map_clone(ctx.env.types.variant_ctor_origins),
        exact_value_alias_targets: map_clone(
            ctx.pre_solve_exact_value_alias_targets),
        const_getter_aliases: set_clone(ctx.pre_solve_const_getter_aliases),
        callable_alias_targets: map_clone(ctx.pre_solve_callable_alias_targets),
        callable_alias_arities: map_clone(ctx.pre_solve_callable_alias_arities),
        callable_alias_contracts: map_clone(
            ctx.pre_solve_callable_alias_contracts),
        def_spans: map_clone(ctx.env.scope.def_spans),
        boxed_vars: set_clone(ctx.boxed_vars),
        var_lambda_depth: map_clone(ctx.var_lambda_depth),
        mutable_vars: set_clone(ctx.env.scope.mutable_vars),
        let_defs: set_clone(ctx.env.scope.let_defs),
        mut_param_defs: set_clone(ctx.env.scope.mut_param_defs)
    }
}

fn capture_default_authority_delta(
    ctx: InferCtx, defaults: List<HExpr>, before: DefaultAuthorityCapture
) -> DefaultAuthorityCapture {
    let mut referenced: Set<Int> = set_new()
    for default in defaults {
        collect_default_authority_expr(default, referenced)
    }
    let mut pending: List<Int> = []
    for def_id in referenced { pending.push(def_id) }
    while pending.len() > 0 {
        let def_id = pending.pop().unwrap()
        match ctx.pre_solve_exact_value_alias_targets.get(def_id) {
            some(target) => if !referenced.contains(target) {
                referenced.insert(target)
                pending.push(target)
            },
            none => {}
        }
        match ctx.pre_solve_callable_alias_targets.get(def_id) {
            some(target) => if !referenced.contains(target) {
                referenced.insert(target)
                pending.push(target)
            },
            none => {}
        }
    }

    let mut captured = DefaultAuthorityCapture {
        def_ids: set_new(), callable_by_def_id: map_new(),
        callable_state_by_def_id: map_new(),
        callable_result_role_by_def_id: map_new(),
        returned_callable_result_role_by_def_id: map_new(),
        callable_result_role_spine_by_def_id: map_new(),
        use_aliases: map_new(), value_binding_kinds: map_new(),
        live_schemes_by_def_id: map_new(),
        variant_ctor_origins: map_new(), exact_value_alias_targets: map_new(),
        const_getter_aliases: set_new(), callable_alias_targets: map_new(),
        callable_alias_arities: map_new(), callable_alias_contracts: map_new(),
        def_spans: map_new(), boxed_vars: set_new(),
        var_lambda_depth: map_new(),
        mutable_vars: set_new(), let_defs: set_new(),
        mut_param_defs: set_new()
    }
    for def_id in referenced {
        let is_lexical_alias =
            ctx.pre_solve_exact_value_alias_targets.contains_key(def_id) ||
            ctx.use_aliases.contains_key(def_id)
        if is_lexical_alias {
            let mut live_scheme: TypeScheme? = none
            let mut scope_index = ctx.env.scope.scopes.len() - 1
            while scope_index >= 0 && live_scheme.is_none() {
                match ctx.env.scope.scopes.get(scope_index) {
                    some(scope) => {
                        for entry in scope.variables.entries() {
                            let entry_scheme = entry.1
                            match entry_scheme.def_id {
                                some(candidate_id) => if
                                        candidate_id == def_id {
                                    let stored_scheme = entry_scheme
                                    live_scheme = some(stored_scheme)
                                },
                                none => {}
                            }
                            if live_scheme.is_some() { break }
                        }
                    },
                    none => {}
                }
                scope_index = scope_index - 1
            }
            if live_scheme.is_none() {
                let cached_scheme =
                    ctx.default_template_live_schemes.get(def_id)
                if cached_scheme.is_some() {
                    live_scheme = some(cached_scheme.unwrap())
                }
            }
            match live_scheme {
                some(scheme) => {
                    let stored_scheme = scheme
                    captured.live_schemes_by_def_id.insert(
                        def_id, stored_scheme)
                },
                none => {}
            }
        }
        match ctx.env.types.ownership_metadata.callable_by_def_id.get(def_id) {
            some(value) => if !before.callable_by_def_id.contains_key(def_id) {
                captured.callable_by_def_id.insert(def_id, value)
                captured.def_ids.insert(def_id)
            },
            none => {}
        }
        let callable_state = ctx.env.types.ownership_metadata
            .callable_state_by_def_id.get(def_id)
        if callable_state.is_some() &&
           !before.callable_state_by_def_id.contains_key(def_id) {
                captured.callable_state_by_def_id.insert(
                    def_id, callable_state.unwrap())
                captured.def_ids.insert(def_id)
        }
        match ctx.env.types.ownership_metadata
                .callable_result_role_by_def_id.get(def_id) {
            some(value) => if !before.callable_result_role_by_def_id
                    .contains_key(def_id) {
                captured.callable_result_role_by_def_id.insert(def_id, value)
                captured.def_ids.insert(def_id)
            },
            none => {}
        }
        match ctx.env.types.ownership_metadata
                .returned_callable_result_role_by_def_id.get(def_id) {
            some(value) => if !before.returned_callable_result_role_by_def_id
                    .contains_key(def_id) {
                captured.returned_callable_result_role_by_def_id.insert(
                    def_id, value)
                captured.def_ids.insert(def_id)
            },
            none => {}
        }
        let role_spine = ctx.env.types.ownership_metadata
            .callable_result_role_spine_by_def_id.get(def_id)
        if role_spine.is_some() &&
           !before.callable_result_role_spine_by_def_id
                .contains_key(def_id) {
                captured.callable_result_role_spine_by_def_id.insert(
                    def_id, role_spine.unwrap())
                captured.def_ids.insert(def_id)
        }
        let use_alias = ctx.use_aliases.get(def_id)
        if use_alias.is_some() {
            captured.use_aliases.insert(def_id, use_alias.unwrap())
            if !before.use_aliases.contains_key(def_id) {
                captured.def_ids.insert(def_id)
            }
        }
        let binding_kind = ctx.value_binding_kinds.get(def_id)
        if binding_kind.is_some() {
            captured.value_binding_kinds.insert(
                def_id, binding_kind.unwrap())
            if !before.value_binding_kinds.contains_key(def_id) {
                captured.def_ids.insert(def_id)
            }
        }
        let variant_origin = ctx.env.types.variant_ctor_origins.get(def_id)
        if variant_origin.is_some() {
            captured.variant_ctor_origins.insert(
                def_id, variant_origin.unwrap())
            if !before.variant_ctor_origins.contains_key(def_id) {
                captured.def_ids.insert(def_id)
            }
        }
        match ctx.pre_solve_exact_value_alias_targets.get(def_id) {
            some(value) => if !before.exact_value_alias_targets
                    .contains_key(def_id) {
                captured.exact_value_alias_targets.insert(def_id, value)
                captured.def_ids.insert(def_id)
            },
            none => {}
        }
        if ctx.pre_solve_const_getter_aliases.contains(def_id) &&
           !before.const_getter_aliases.contains(def_id) {
            captured.const_getter_aliases.insert(def_id)
            captured.def_ids.insert(def_id)
        }
        match ctx.pre_solve_callable_alias_targets.get(def_id) {
            some(value) => if !before.callable_alias_targets.contains_key(def_id) {
                captured.callable_alias_targets.insert(def_id, value)
                captured.def_ids.insert(def_id)
            },
            none => {}
        }
        match ctx.pre_solve_callable_alias_arities.get(def_id) {
            some(value) => if !before.callable_alias_arities.contains_key(def_id) {
                captured.callable_alias_arities.insert(def_id, value)
                captured.def_ids.insert(def_id)
            },
            none => {}
        }
        match ctx.pre_solve_callable_alias_contracts.get(def_id) {
            some(value) => if !before.callable_alias_contracts.contains_key(def_id) {
                captured.callable_alias_contracts.insert(def_id, value)
                captured.def_ids.insert(def_id)
            },
            none => {}
        }
        let def_span = ctx.env.scope.def_spans.get(def_id)
        if def_span.is_some() && !before.def_spans.contains_key(def_id) {
                captured.def_spans.insert(def_id, def_span.unwrap())
                captured.def_ids.insert(def_id)
        }
        if ctx.boxed_vars.contains(def_id) &&
           !before.boxed_vars.contains(def_id) {
            captured.boxed_vars.insert(def_id)
            captured.def_ids.insert(def_id)
        }
        match ctx.var_lambda_depth.get(def_id) {
            some(value) => if !before.var_lambda_depth.contains_key(def_id) {
                captured.var_lambda_depth.insert(def_id, value)
                captured.def_ids.insert(def_id)
            },
            none => {}
        }
        if ctx.env.scope.mutable_vars.contains(def_id) &&
           !before.mutable_vars.contains(def_id) {
            captured.mutable_vars.insert(def_id)
            captured.def_ids.insert(def_id)
        }
        if ctx.env.scope.let_defs.contains(def_id) &&
           !before.let_defs.contains(def_id) {
            captured.let_defs.insert(def_id)
            captured.def_ids.insert(def_id)
        }
        if ctx.env.scope.mut_param_defs.contains(def_id) &&
           !before.mut_param_defs.contains(def_id) {
            captured.mut_param_defs.insert(def_id)
            captured.def_ids.insert(def_id)
        }
    }
    captured
}

fn merge_default_authority_capture(
    mut ctx: InferCtx, capture: DefaultAuthorityCapture
) {
    for entry in capture.live_schemes_by_def_id.entries() {
        let stored_scheme = entry.1
        ctx.default_template_live_schemes.insert(entry.0, stored_scheme)
    }
    for entry in capture.callable_by_def_id.entries() {
        ctx.env.types.ownership_metadata.callable_by_def_id.insert(
            entry.0, entry.1)
    }
    for entry in capture.callable_state_by_def_id.entries() {
        let stored_state = entry.1
        ctx.env.types.ownership_metadata.callable_state_by_def_id.insert(
            entry.0, stored_state)
    }
    for entry in capture.callable_result_role_by_def_id.entries() {
        ctx.env.types.ownership_metadata.callable_result_role_by_def_id.insert(
            entry.0, entry.1)
    }
    for entry in capture.returned_callable_result_role_by_def_id.entries() {
        ctx.env.types.ownership_metadata
            .returned_callable_result_role_by_def_id.insert(entry.0, entry.1)
    }
    for entry in capture.callable_result_role_spine_by_def_id.entries() {
        let stored_spine = entry.1
        ctx.env.types.ownership_metadata
            .callable_result_role_spine_by_def_id.insert(entry.0, stored_spine)
    }
    for entry in capture.use_aliases.entries() {
        let stored_alias = entry.1
        ctx.use_aliases.insert(entry.0, stored_alias)
    }
    for entry in capture.value_binding_kinds.entries() {
        let stored_kind = entry.1
        ctx.value_binding_kinds.insert(entry.0, stored_kind)
    }
    for entry in capture.variant_ctor_origins.entries() {
        let stored_origin = entry.1
        ctx.env.types.variant_ctor_origins.insert(entry.0, stored_origin)
    }
    for entry in capture.exact_value_alias_targets.entries() {
        ctx.pre_solve_exact_value_alias_targets.insert(entry.0, entry.1)
    }
    for def_id in capture.const_getter_aliases {
        ctx.pre_solve_const_getter_aliases.insert(def_id)
    }
    for entry in capture.callable_alias_targets.entries() {
        ctx.pre_solve_callable_alias_targets.insert(entry.0, entry.1)
    }
    for entry in capture.callable_alias_arities.entries() {
        ctx.pre_solve_callable_alias_arities.insert(entry.0, entry.1)
    }
    for entry in capture.callable_alias_contracts.entries() {
        ctx.pre_solve_callable_alias_contracts.insert(entry.0, entry.1)
    }
    for entry in capture.def_spans.entries() {
        let stored_span = entry.1
        ctx.env.scope.def_spans.insert(entry.0, stored_span)
    }
    for def_id in capture.boxed_vars { ctx.boxed_vars.insert(def_id) }
    for entry in capture.var_lambda_depth.entries() {
        ctx.var_lambda_depth.insert(entry.0, entry.1)
    }
    for def_id in capture.mutable_vars {
        ctx.env.scope.mutable_vars.insert(def_id)
    }
    for def_id in capture.let_defs { ctx.env.scope.let_defs.insert(def_id) }
    for def_id in capture.mut_param_defs {
        ctx.env.scope.mut_param_defs.insert(def_id)
    }
    for def_id in capture.def_ids {
        ctx.speculative_default_authority_def_ids.insert(def_id)
    }
}

fn remove_default_authority_def_ids(mut ctx: InferCtx, def_ids: Set<Int>) {
    for def_id in def_ids {
        ctx.default_template_live_schemes.remove(def_id)
        ctx.env.types.ownership_metadata.callable_by_def_id.remove(def_id)
        ctx.env.types.ownership_metadata.callable_state_by_def_id.remove(def_id)
        ctx.env.types.ownership_metadata
            .callable_result_role_by_def_id.remove(def_id)
        ctx.env.types.ownership_metadata
            .returned_callable_result_role_by_def_id.remove(def_id)
        ctx.env.types.ownership_metadata
            .callable_result_role_spine_by_def_id.remove(def_id)
        ctx.use_aliases.remove(def_id)
        ctx.value_binding_kinds.remove(def_id)
        ctx.env.types.variant_ctor_origins.remove(def_id)
        ctx.pre_solve_exact_value_alias_targets.remove(def_id)
        ctx.pre_solve_const_getter_aliases.remove(def_id)
        ctx.pre_solve_callable_alias_targets.remove(def_id)
        ctx.pre_solve_callable_alias_arities.remove(def_id)
        ctx.pre_solve_callable_alias_contracts.remove(def_id)
        ctx.env.scope.def_spans.remove(def_id)
        ctx.boxed_vars.remove(def_id)
        ctx.var_lambda_depth.remove(def_id)
        ctx.env.scope.mutable_vars.remove(def_id)
        ctx.env.scope.let_defs.remove(def_id)
        ctx.env.scope.mut_param_defs.remove(def_id)
        ctx.speculative_default_authority_def_ids.remove(def_id)
    }
}

fn collect_retained_default_authority_decl(
    decl: HDecl, mut retained: Set<Int>
) {
    match decl {
        HDecl::Fn { def_id, params, body, .. } => {
            collect_default_authority_optional_def_id(def_id, retained)
            for param in params {
                collect_default_authority_optional_def_id(param.def_id, retained)
            }
            collect_default_authority_expr(body, retained)
        },
        HDecl::Impl { methods, .. } => {
            for inner in methods {
                collect_retained_default_authority_decl(inner, retained)
            }
        },
        HDecl::ModBlock { decls, .. } => {
            for inner in decls {
                collect_retained_default_authority_decl(inner, retained)
            }
        },
        HDecl::Effect { ops, .. } => {
            for op in ops {
                for param in op.params {
                    collect_default_authority_optional_def_id(
                        param.def_id, retained)
                }
                match op.default_body {
                    some(body) => collect_default_authority_expr(body, retained),
                    none => {}
                }
            }
        },
        HDecl::Test { body, .. } =>
            collect_default_authority_expr(body, retained),
        HDecl::Trait { methods, .. } => {
            for method in methods {
                retained.insert(method.def_id)
                for param in method.params {
                    collect_default_authority_optional_def_id(
                        param.def_id, retained)
                }
                match method.body {
                    some(body) => collect_default_authority_expr(body, retained),
                    none => {}
                }
            }
        },
        HDecl::ExternFn { def_id, params, .. } => {
            collect_default_authority_optional_def_id(def_id, retained)
            for param in params {
                collect_default_authority_optional_def_id(param.def_id, retained)
            }
        },
        HDecl::Const { def_id, init, .. } => {
            collect_default_authority_optional_def_id(def_id, retained)
            collect_default_authority_expr(init, retained)
        },
        HDecl::Struct { .. } | HDecl::Enum { .. } |
        HDecl::ExternType { .. } | HDecl::TypeAlias { .. } |
        HDecl::Sig { .. } => {}
    }
}

fn prune_unretained_default_authority(
    mut ctx: InferCtx, hdecls: List<HDecl>
) {
    let mut retained: Set<Int> = set_new()
    for decl in hdecls {
        collect_retained_default_authority_decl(decl, retained)
    }
    let mut pending: List<Int> = []
    for def_id in retained { pending.push(def_id) }
    while pending.len() > 0 {
        let def_id = pending.pop().unwrap()
        match ctx.pre_solve_exact_value_alias_targets.get(def_id) {
            some(target) => if !retained.contains(target) {
                retained.insert(target)
                pending.push(target)
            },
            none => {}
        }
        match ctx.pre_solve_callable_alias_targets.get(def_id) {
            some(target) => if !retained.contains(target) {
                retained.insert(target)
                pending.push(target)
            },
            none => {}
        }
    }
    let mut discarded: Set<Int> = set_new()
    for def_id in ctx.speculative_default_authority_def_ids {
        if !retained.contains(def_id) { discarded.insert(def_id) }
    }
    remove_default_authority_def_ids(ctx, discarded)
    // Durable scheme fallback is template-only cache, but its DefId may also
    // be a pre-existing public re-export. Drop only the cache entry here;
    // full authority removal above is reserved for checker-minted speculative
    // identities absent from retained HIR.
    let mut stale_live_schemes: List<Int> = []
    for entry in ctx.default_template_live_schemes.entries() {
        if !retained.contains(entry.0) {
            stale_live_schemes.push(entry.0)
        }
    }
    for def_id in stale_live_schemes {
        ctx.default_template_live_schemes.remove(def_id)
    }
}

fn precheck_fn_node_firebreak(
    mut ctx: InferCtx, decls: List<Decl>, name: Str,
    top_level_index: Int?
) -> Bool {
    let diagnostic_checkpoint = ctx.sink.save()
    let default_authority_before = snapshot_default_authority_surface(ctx)
    let mut default_authority_captures: List<DefaultAuthorityCapture> = []
    let scope_variables_before = clone_scope_variable_maps(
        ctx.env.scope.scopes)
    let callable_by_def_id_before = map_clone(
        ctx.env.types.ownership_metadata.callable_by_def_id)
    let callable_state_before = map_clone(
        ctx.env.types.ownership_metadata.callable_state_by_def_id)
    let direct_roles_before = map_clone(
        ctx.env.types.ownership_metadata.callable_result_role_by_def_id)
    let returned_roles_before = map_clone(
        ctx.env.types.ownership_metadata
            .returned_callable_result_role_by_def_id)
    let role_spines_before = map_clone(
        ctx.env.types.ownership_metadata
            .callable_result_role_spine_by_def_id)
    let inference_parents_before = map_clone(
        ctx.env.types.ownership_metadata.callable_inference_parents)
    let inference_solutions_before = map_clone(
        ctx.env.types.ownership_metadata.callable_inference_solutions)
    let subst_before = clone_union_find(ctx.subst)
    let type_param_scope_before = map_clone(ctx.type_param_scope)
    let qualified_assoc_scope_before = map_clone(ctx.qualified_assoc_scope)
    let current_fn_return_before = ctx.current_fn_return_type
    let current_fn_bounds_before = list_clone(ctx.current_fn_bounds)
    let fn_bounds_stack_before = clone_impl_precheck_bounds_stack(
        ctx.fn_bounds_stack)
    let loop_depth_before = ctx.loop_depth
    let lambda_depth_before = ctx.lambda_depth
    let scope_depth_before = ctx.env.scope.scopes.len()
    let use_aliases_before = map_clone(ctx.use_aliases)
    let pre_solve_exact_value_alias_targets_before = map_clone(
        ctx.pre_solve_exact_value_alias_targets)
    let pending_inferred_const_def_ids_before = set_clone(
        ctx.pending_inferred_const_def_ids)
    let pre_solve_const_getter_aliases_before = set_clone(
        ctx.pre_solve_const_getter_aliases)
    let pre_solve_alias_targets_before = map_clone(
        ctx.pre_solve_callable_alias_targets)
    let pre_solve_alias_arities_before = map_clone(
        ctx.pre_solve_callable_alias_arities)
    let pre_solve_alias_contracts_before = map_clone(
        ctx.pre_solve_callable_alias_contracts)
    let value_binding_kinds_before = map_clone(ctx.value_binding_kinds)
    let boxed_vars_before = set_clone(ctx.boxed_vars)
    let var_lambda_depth_before = map_clone(ctx.var_lambda_depth)
    let fn_mut_params_before = map_clone(ctx.fn_mut_params)
    let rebind_provenance_before = map_clone(ctx.rebind_assoc_provenance)
    let fn_defaults_before = map_clone(ctx.fn_defaults)
    let fn_default_var_bounds_before = map_clone(
        ctx.fn_default_var_bounds)
    let fn_min_arity_before = map_clone(ctx.fn_min_arity)
    let latest_value_instantiation_maps_before = map_clone(
        ctx.latest_value_instantiation_maps)
    let default_template_live_schemes_before = map_clone(
        ctx.default_template_live_schemes)
    let def_spans_before = map_clone(ctx.env.scope.def_spans)
    let var_bounds_before = clone_impl_precheck_var_bounds(
        ctx.env.scope.var_bounds)
    let mutable_vars_before = set_clone(ctx.env.scope.mutable_vars)
    let let_defs_before = set_clone(ctx.env.scope.let_defs)
    let mut_param_defs_before = set_clone(ctx.env.scope.mut_param_defs)
    let dict_checkpoint = pending_dict_checkpoint(ctx)

    ctx.discarded_fn_precheck_blocked = false
    ctx.discarded_fn_precheck_active = true
    let checked = some(match top_level_index {
        some(index) => {
            precheck_top_level_fn_at(ctx, decls, index)
            match default_values_for_name(ctx, name) {
                some(defaults) => {
                    default_authority_captures.push(
                        capture_default_authority_delta(
                            ctx, defaults, default_authority_before))
                },
                none => {}
            }
        },
        none => {
            if !precheck_inline_fn(
                    ctx, decls, name, default_authority_before,
                    default_authority_captures) {
                panic("unreachable: inline precheck SCC node was not found")
            }
        }
    }) catch { _ => none }
    ctx.discarded_fn_precheck_active = false
    let blocked = ctx.discarded_fn_precheck_blocked
    let succeeded = checked.is_some() && !blocked
    let scheme_after = if succeeded { ctx.env.lookup(name) } else { none }
    ctx.discarded_fn_precheck_blocked = false
    if !succeeded {
        for entry in ctx.pending_fn_default_seed_values.entries() {
            default_authority_captures.push(
                capture_default_authority_delta(
                    ctx, entry.1, default_authority_before))
        }
    }
    // A discarded precheck is never the diagnostic owner.  Source-retained
    // const/function/impl passes will reproduce real errors after summaries
    // stabilize; transient arity/type errors must not become false reds.
    ctx.sink.restore(diagnostic_checkpoint)
    // The precheck publishes only the canonical scheme/default/mut summaries.
    // Every DefId-indexed identity allocated by its discarded HIR is local to
    // that check and must be removed even on success.
    ctx.env.types.ownership_metadata.callable_by_def_id =
        callable_by_def_id_before
    ctx.env.types.ownership_metadata.callable_state_by_def_id =
        callable_state_before
    ctx.env.types.ownership_metadata.callable_result_role_by_def_id =
        direct_roles_before
    ctx.env.types.ownership_metadata
        .returned_callable_result_role_by_def_id = returned_roles_before
    ctx.env.types.ownership_metadata.callable_result_role_spine_by_def_id =
        role_spines_before
    if !succeeded {
        ctx.env.types.ownership_metadata.callable_inference_parents =
            inference_parents_before
        ctx.env.types.ownership_metadata.callable_inference_solutions =
            inference_solutions_before
        ctx.fn_mut_params = fn_mut_params_before
        ctx.fn_defaults = fn_defaults_before
        ctx.fn_default_var_bounds = fn_default_var_bounds_before
        ctx.fn_min_arity = fn_min_arity_before
        reapply_pending_fn_default_seeds(ctx)
    }
    ctx.use_aliases = use_aliases_before
    ctx.pre_solve_exact_value_alias_targets =
        pre_solve_exact_value_alias_targets_before
    ctx.pending_inferred_const_def_ids =
        pending_inferred_const_def_ids_before
    ctx.pre_solve_const_getter_aliases =
        pre_solve_const_getter_aliases_before
    ctx.pre_solve_callable_alias_targets = pre_solve_alias_targets_before
    ctx.pre_solve_callable_alias_arities = pre_solve_alias_arities_before
    ctx.pre_solve_callable_alias_contracts = pre_solve_alias_contracts_before
    ctx.value_binding_kinds = value_binding_kinds_before
    ctx.boxed_vars = boxed_vars_before
    ctx.var_lambda_depth = var_lambda_depth_before
    ctx.rebind_assoc_provenance = rebind_provenance_before
    ctx.latest_value_instantiation_maps =
        latest_value_instantiation_maps_before
    ctx.default_template_live_schemes =
        default_template_live_schemes_before
    ctx.subst = subst_before
    ctx.type_param_scope = type_param_scope_before
    ctx.qualified_assoc_scope = qualified_assoc_scope_before
    ctx.current_fn_return_type = current_fn_return_before
    ctx.current_fn_bounds = current_fn_bounds_before
    ctx.fn_bounds_stack = fn_bounds_stack_before
    ctx.loop_depth = loop_depth_before
    ctx.lambda_depth = lambda_depth_before
    while ctx.env.scope.scopes.len() > scope_depth_before {
        ctx.env.pop_scope()
    }
    if ctx.env.scope.scopes.len() != scope_depth_before {
        panic("unreachable: discarded fn precheck removed an outer scope")
    }
    restore_scope_variable_maps(ctx, scope_variables_before)
    ctx.env.scope.def_spans = def_spans_before
    ctx.env.scope.var_bounds = var_bounds_before
    ctx.env.scope.mutable_vars = mutable_vars_before
    ctx.env.scope.let_defs = let_defs_before
    ctx.env.scope.mut_param_defs = mut_param_defs_before
    rollback_pending_dicts(ctx, dict_checkpoint)
    match scheme_after {
        some(scheme) => rebind_scheme_with_exact_aliases(
            ctx, name, scheme),
        none => {}
    }
    for capture in default_authority_captures {
        merge_default_authority_capture(ctx, capture)
    }
    succeeded
}

fn precheck_fn_scc_firebreak(
    mut ctx: InferCtx,
    decls: List<Decl>,
    scc_group: List<Str>,
    precheck_nodes: Set<Str>,
    fn_name_to_idx: Map<Str, Int>,
    mut blocked_names: Set<Str>
) {
    let mut relevant: List<Str> = []
    let mut schemes_before: Map<Str, TypeScheme> = map_new()
    for name in scc_group {
        if precheck_nodes.contains(name) {
            let relevant_name = "${name}"
            let lookup_name = "${name}"
            let stored_name = "${name}"
            let pending_name = "${name}"
            relevant.push(relevant_name)
            match ctx.env.lookup(lookup_name) {
                some(scheme) => {
                    let stored_scheme = scheme
                    schemes_before.insert(stored_name, stored_scheme)
                },
                none => {}
            }
            // Mutual recursion is one transaction: no member may observe a
            // stale pending marker owned by another member of the same SCC.
            set_fn_precheck_pending(ctx, pending_name, false)
        }
    }
    if relevant.len() == 0 { return }

    let default_authority_before = snapshot_default_authority_surface(ctx)
    let fn_defaults_before = map_clone(ctx.fn_defaults)
    let fn_default_var_bounds_before = map_clone(
        ctx.fn_default_var_bounds)
    let fn_min_arity_before = map_clone(ctx.fn_min_arity)
    let fn_mut_params_before = map_clone(ctx.fn_mut_params)
    let inference_parents_before = map_clone(
        ctx.env.types.ownership_metadata.callable_inference_parents)
    let inference_solutions_before = map_clone(
        ctx.env.types.ownership_metadata.callable_inference_solutions)
    let default_authority_ids_before = set_clone(
        ctx.speculative_default_authority_def_ids)
    let mut blocked = false
    for name in relevant {
        if !precheck_fn_node_firebreak(
            ctx, decls, name, fn_name_to_idx.get(name)) {
            blocked = true
        }
    }

    if blocked {
        // Header defaults are an independently checked SCC summary.  Promote
        // every member that reached a normalized triple, including members
        // whose body succeeded before a peer blocked the group.  The next
        // fixed-point round can then check every default/body against peer
        // headers without committing any peer body scheme early.
        for name in relevant {
            let owner_def_id = match ctx.env.lookup(name) {
                some(scheme) => scheme.def_id,
                none => match schemes_before.get(name) {
                    some(scheme) => scheme.def_id,
                    none => none
                }
            }
            store_pending_fn_default_seed(ctx, owner_def_id)
        }
        let mut pending_seed_captures: List<DefaultAuthorityCapture> = []
        for entry in ctx.pending_fn_default_seed_values.entries() {
            pending_seed_captures.push(capture_default_authority_delta(
                ctx, entry.1, default_authority_before))
        }
        let mut discarded_default_authority: Set<Int> = set_new()
        for def_id in ctx.speculative_default_authority_def_ids {
            if !default_authority_ids_before.contains(def_id) {
                discarded_default_authority.insert(def_id)
            }
        }
        remove_default_authority_def_ids(
            ctx, discarded_default_authority)
        ctx.speculative_default_authority_def_ids =
            default_authority_ids_before
        ctx.fn_defaults = fn_defaults_before
        ctx.fn_default_var_bounds = fn_default_var_bounds_before
        ctx.fn_min_arity = fn_min_arity_before
        reapply_pending_fn_default_seeds(ctx)
        ctx.fn_mut_params = fn_mut_params_before
        ctx.env.types.ownership_metadata.callable_inference_parents =
            inference_parents_before
        ctx.env.types.ownership_metadata.callable_inference_solutions =
            inference_solutions_before
        for capture in pending_seed_captures {
            merge_default_authority_capture(ctx, capture)
        }
        for name in relevant {
            match schemes_before.get(name) {
                some(scheme) => rebind_scheme_with_exact_aliases(
                    ctx, name, scheme),
                none => {}
            }
            set_fn_precheck_pending(ctx, name, true)
            let blocked_name = "${name}"
            blocked_names.insert(blocked_name)
        }
    } else {
        for name in relevant {
            set_fn_precheck_pending(ctx, name, false)
            blocked_names.remove(name)
        }
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

fn rebind_scheme_with_exact_aliases(
    mut ctx: InferCtx, name: Str, scheme: TypeScheme
) {
    let canonical_name_for_rebind = name
    let canonical_scheme_for_rebind = scheme
    let canonical_def_id = scheme.def_id
    ctx.env.rebind(canonical_name_for_rebind, canonical_scheme_for_rebind)
    match (canonical_def_id, scheme.ty) {
        (some(source_def_id), Type::FnType { .. }) =>
            promote_pre_solve_callable_aliases_for_source(
                ctx, source_def_id, scheme.ty),
        (none, Type::FnType { .. }) => panic(
            "unreachable: rebound callable source has no DefId"),
        _ => {}
    }

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
    rebind_scheme_with_exact_aliases(ctx, alias_name, rebound)
}

fn rebind_fn_type(
    mut ctx: InferCtx, name: Str, params: List<HParam>, return_type: Type,
    effects: EffectRow, span: Span, registration_scheme: TypeScheme?
) {
    match registration_scheme {
        some(scheme) => {
            rebind_registered_fn_type_firebreak(
                ctx, name, scheme, params, return_type, effects, span)
            set_fn_precheck_pending(ctx, name, false)
        },
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
    let check_type = Type::EffectRowType {
        effects: check_row.effects, tail: check_row.tail
    }
    let registration_type = Type::EffectRowType {
        effects: reg_row.effects, tail: reg_row.tail
    }
    let check_type_for_vars = check_type
    let check_type_for_mapping = check_type
    let check_vars = free_type_vars(
        check_type_for_vars, empty_subst()).to_list()
    let exact_mapping = build_type_var_map(
        metadata, check_type_for_mapping,
        registration_type, check_vars)
    for entry in exact_mapping.entries() {
        record_check_registration_mapping_firebreak(
            metadata, entry.0, entry.1, mapping, conflicts)
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

fn clone_impl_precheck_var_bounds(
    source: Map<Int, Set<Str>>
) -> Map<Int, Set<Str>> {
    let mut result: Map<Int, Set<Str>> = map_new()
    for entry in source.entries() {
        result.insert(entry.0, set_clone(entry.1))
    }
    result
}

fn clone_impl_precheck_bounds_stack(
    source: List<List<FnBoundsEntry>>
) -> List<List<FnBoundsEntry>> {
    let mut result: List<List<FnBoundsEntry>> = []
    for bounds in source {
        result.push(list_clone(bounds))
    }
    result
}

fn clone_scope_variable_maps(
    scopes: List<Scope>
) -> List<Map<Str, TypeScheme>> {
    let mut result: List<Map<Str, TypeScheme>> = []
    for scope in scopes {
        result.push(map_clone(scope.variables))
    }
    result
}

fn restore_scope_variable_maps(
    mut ctx: InferCtx, snapshots: List<Map<Str, TypeScheme>>
) {
    if ctx.env.scope.scopes.len() != snapshots.len() {
        panic("unreachable: precheck scope depth changed before restore")
    }
    let mut index = 0
    while index < snapshots.len() {
        match (ctx.env.scope.scopes.get(index), snapshots.get(index)) {
            (some(scope), some(variables)) => {
                let mut restored_scope = scope
                restored_scope.variables = variables
                ctx.env.scope.scopes.set(index, restored_scope)
            },
            _ => panic("unreachable: precheck scope snapshot is missing")
        }
        index = index + 1
    }
}

fn lookup_precheck_impl_method_scheme(
    ctx: InferCtx, target_type: Str, trait_name: Str?,
    origin: Str, method_name: Str
) -> TypeScheme? {
    match trait_name {
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
                            some(registered) => registered.get(method_name),
                            none => none
                        }
                    } else { none }
                },
                none => none
            },
            none => none
        }
    }
}

fn set_impl_precheck_methods_pending(
    mut ctx: InferCtx,
    target_type: Str,
    type_params: List<TypeParam>,
    trait_name: Str?,
    methods: List<Decl>,
    span: Span,
    pending: Bool
) {
    let canonical_target = resolve_nominal_identity(ctx, target_type)
    let trait_for_resolution = trait_name
    let canonical_trait = if trait_for_resolution.is_some() {
        some(resolve_trait_identity(ctx, trait_for_resolution.unwrap()))
    } else {
        none
    }
    let origin = impl_decl_origin(
        canonical_target, canonical_trait, type_params, span)
    for method in methods {
        match method {
            Decl::Fn { name, .. } => match lookup_precheck_impl_method_scheme(
                ctx, canonical_target, canonical_trait, origin, name) {
                some(scheme) => match scheme.def_id {
                    some(def_id) => {
                        if pending {
                            ctx.pending_precheck_callable_def_ids.insert(def_id)
                        } else {
                            ctx.pending_precheck_callable_def_ids.remove(def_id)
                        }
                    },
                    none => {}
                },
                none => {}
            },
            _ => {}
        }
    }
}

fn store_impl_precheck_default_seeds(
    mut ctx: InferCtx,
    target_type: Str,
    type_params: List<TypeParam>,
    trait_name: Str?,
    methods: List<Decl>,
    span: Span
) {
    let canonical_target = resolve_nominal_identity(ctx, target_type)
    let trait_for_resolution = trait_name
    let canonical_trait = if trait_for_resolution.is_some() {
        some(resolve_trait_identity(ctx, trait_for_resolution.unwrap()))
    } else {
        none
    }
    let origin = impl_decl_origin(
        canonical_target, canonical_trait, type_params, span)
    for method in methods {
        match method {
            Decl::Fn { name, .. } => match lookup_precheck_impl_method_scheme(
                ctx, canonical_target, canonical_trait, origin, name) {
                some(scheme) => store_pending_fn_default_seed(
                    ctx, scheme.def_id),
                none => {}
            },
            _ => {}
        }
    }
}

fn precheck_impl_effects_firebreak(
    mut ctx: InferCtx,
    target_type: Str,
    type_params: List<TypeParam>,
    trait_name: Str?,
    methods: List<Decl>,
    span: Span
) -> Bool {
    let target_for_initial_pending = target_type
    let target_for_check = target_type
    let target_for_seed = target_type
    let target_for_final_pending = target_type
    let diagnostic_checkpoint = ctx.sink.save()
    let default_authority_before = snapshot_default_authority_surface(ctx)
    // This pass exists only to make inferred effects visible before the main
    // declaration order. Everything else is speculative: the retained-HIR
    // pass must own its callable DefIds, defaults, boxing facts and provenance.
    // Ownership inference terms stay monotonic because an inferred EffectRow
    // may legitimately contain a callable type; only DefId-indexed identities
    // are rolled back.
    // A retry owns these exact method summaries. Temporarily clear its own
    // pending markers so recursive/self calls can be checked transactionally;
    // a pending dependency will re-mark the whole owner below.
    set_impl_precheck_methods_pending(
        ctx, target_for_initial_pending, type_params, trait_name, methods,
        span, false)
    let scope_variables_before = clone_scope_variable_maps(
        ctx.env.scope.scopes)
    let callable_by_def_id_before = map_clone(
        ctx.env.types.ownership_metadata.callable_by_def_id)
    let callable_state_before = map_clone(
        ctx.env.types.ownership_metadata.callable_state_by_def_id)
    let direct_roles_before = map_clone(
        ctx.env.types.ownership_metadata.callable_result_role_by_def_id)
    let returned_roles_before = map_clone(
        ctx.env.types.ownership_metadata
            .returned_callable_result_role_by_def_id)
    let role_spines_before = map_clone(
        ctx.env.types.ownership_metadata
            .callable_result_role_spine_by_def_id)
    let inference_parents_before = map_clone(
        ctx.env.types.ownership_metadata.callable_inference_parents)
    let inference_solutions_before = map_clone(
        ctx.env.types.ownership_metadata.callable_inference_solutions)

    let subst_before = clone_union_find(ctx.subst)
    let type_param_scope_before = map_clone(ctx.type_param_scope)
    let qualified_assoc_scope_before = map_clone(ctx.qualified_assoc_scope)
    let current_fn_return_before = ctx.current_fn_return_type
    let current_fn_bounds_before = list_clone(ctx.current_fn_bounds)
    let fn_bounds_stack_before = clone_impl_precheck_bounds_stack(
        ctx.fn_bounds_stack)
    let loop_depth_before = ctx.loop_depth
    let lambda_depth_before = ctx.lambda_depth
    let scope_depth_before = ctx.env.scope.scopes.len()
    let use_aliases_before = map_clone(ctx.use_aliases)
    let pre_solve_exact_value_alias_targets_before = map_clone(
        ctx.pre_solve_exact_value_alias_targets)
    let pending_inferred_const_def_ids_before = set_clone(
        ctx.pending_inferred_const_def_ids)
    let pre_solve_const_getter_aliases_before = set_clone(
        ctx.pre_solve_const_getter_aliases)
    let pre_solve_alias_targets_before = map_clone(
        ctx.pre_solve_callable_alias_targets)
    let pre_solve_alias_arities_before = map_clone(
        ctx.pre_solve_callable_alias_arities)
    let pre_solve_alias_contracts_before = map_clone(
        ctx.pre_solve_callable_alias_contracts)
    let value_binding_kinds_before = map_clone(ctx.value_binding_kinds)
    let boxed_vars_before = set_clone(ctx.boxed_vars)
    let var_lambda_depth_before = map_clone(ctx.var_lambda_depth)
    let fn_mut_params_before = map_clone(ctx.fn_mut_params)
    let rebind_provenance_before = map_clone(ctx.rebind_assoc_provenance)
    let fn_defaults_before = map_clone(ctx.fn_defaults)
    let fn_default_var_bounds_before = map_clone(
        ctx.fn_default_var_bounds)
    let fn_min_arity_before = map_clone(ctx.fn_min_arity)
    let latest_value_instantiation_maps_before = map_clone(
        ctx.latest_value_instantiation_maps)
    let default_template_live_schemes_before = map_clone(
        ctx.default_template_live_schemes)
    let def_spans_before = map_clone(ctx.env.scope.def_spans)
    let var_bounds_before = clone_impl_precheck_var_bounds(
        ctx.env.scope.var_bounds)
    let mutable_vars_before = set_clone(ctx.env.scope.mutable_vars)
    let let_defs_before = set_clone(ctx.env.scope.let_defs)
    let mut_param_defs_before = set_clone(ctx.env.scope.mut_param_defs)
    let dict_checkpoint = pending_dict_checkpoint(ctx)
    let scheme_checkpoint = ctx.impl_effect_precheck_undo.len()

    let checked_target = target_for_check
    let checked_type_params = type_params
    let checked_trait = trait_name
    let checked_methods = methods
    let checked_span = span
    ctx.impl_effect_precheck_blocked = false
    ctx.impl_effect_precheck_active = true
    let checked = some(check_impl_decl(
        ctx, precheck_impl_target_result_firebreak(checked_target),
        checked_type_params, checked_trait,
        checked_methods, checked_span)) catch { _ => none }
    ctx.impl_effect_precheck_active = false
    let precheck_blocked = ctx.impl_effect_precheck_blocked
    ctx.impl_effect_precheck_blocked = false
    // Effect-summary discovery is speculative.  The retained impl owner is the
    // sole diagnostic authority after the alternating fixed point settles.
    ctx.sink.restore(diagnostic_checkpoint)

    let mut precheck_succeeded = false
    let commits = match checked {
        some(_) => {
            if precheck_blocked {
                []
            } else {
                precheck_succeeded = true
                collect_impl_effect_precheck_commits(ctx, scheme_checkpoint)
            }
        },
        none => []
    }
    let fn_defaults_after = if precheck_succeeded {
        map_clone(ctx.fn_defaults)
    } else { map_new() }
    let fn_default_var_bounds_after = if precheck_succeeded {
        map_clone(ctx.fn_default_var_bounds)
    } else { map_new() }
    let fn_min_arity_after = if precheck_succeeded {
        map_clone(ctx.fn_min_arity)
    } else { map_new() }
    let mut default_authority_captures: List<DefaultAuthorityCapture> = []
    if precheck_succeeded {
        for entry in ctx.fn_defaults.entries() {
            default_authority_captures.push(
                capture_default_authority_delta(
                    ctx, entry.1, default_authority_before))
        }
    } else {
        store_impl_precheck_default_seeds(
            ctx, target_for_seed,
            type_params, trait_name, methods, span)
        for entry in ctx.pending_fn_default_seed_values.entries() {
            default_authority_captures.push(
                capture_default_authority_delta(
                    ctx, entry.1, default_authority_before))
        }
    }
    rollback_impl_effect_precheck_schemes(ctx, scheme_checkpoint)

    // Remove all speculative DefId identities. Keep successful ownership UF
    // work because committed effect types may reference its fresh terms. On a
    // failed precheck restore the old UF solution, but never reuse allocated
    // term numbers: next_callable_inference_term remains monotonic.
    ctx.env.types.ownership_metadata.callable_by_def_id =
        callable_by_def_id_before
    ctx.env.types.ownership_metadata.callable_state_by_def_id =
        callable_state_before
    ctx.env.types.ownership_metadata.callable_result_role_by_def_id =
        direct_roles_before
    ctx.env.types.ownership_metadata
        .returned_callable_result_role_by_def_id = returned_roles_before
    ctx.env.types.ownership_metadata.callable_result_role_spine_by_def_id =
        role_spines_before
    if !precheck_succeeded {
        ctx.env.types.ownership_metadata.callable_inference_parents =
            inference_parents_before
        ctx.env.types.ownership_metadata.callable_inference_solutions =
            inference_solutions_before
    }

    ctx.use_aliases = use_aliases_before
    ctx.pre_solve_exact_value_alias_targets =
        pre_solve_exact_value_alias_targets_before
    ctx.pending_inferred_const_def_ids =
        pending_inferred_const_def_ids_before
    ctx.pre_solve_const_getter_aliases =
        pre_solve_const_getter_aliases_before
    ctx.pre_solve_callable_alias_targets = pre_solve_alias_targets_before
    ctx.pre_solve_callable_alias_arities = pre_solve_alias_arities_before
    ctx.pre_solve_callable_alias_contracts = pre_solve_alias_contracts_before
    ctx.value_binding_kinds = value_binding_kinds_before
    ctx.boxed_vars = boxed_vars_before
    ctx.var_lambda_depth = var_lambda_depth_before
    ctx.fn_mut_params = fn_mut_params_before
    ctx.rebind_assoc_provenance = rebind_provenance_before
    ctx.fn_defaults = fn_defaults_before
    ctx.fn_default_var_bounds = fn_default_var_bounds_before
    ctx.fn_min_arity = fn_min_arity_before
    reapply_pending_fn_default_seeds(ctx)
    ctx.latest_value_instantiation_maps =
        latest_value_instantiation_maps_before
    ctx.default_template_live_schemes =
        default_template_live_schemes_before
    ctx.subst = subst_before
    ctx.type_param_scope = type_param_scope_before
    ctx.qualified_assoc_scope = qualified_assoc_scope_before
    ctx.current_fn_return_type = current_fn_return_before
    ctx.current_fn_bounds = current_fn_bounds_before
    ctx.fn_bounds_stack = fn_bounds_stack_before
    ctx.loop_depth = loop_depth_before
    ctx.lambda_depth = lambda_depth_before
    while ctx.env.scope.scopes.len() > scope_depth_before {
        ctx.env.pop_scope()
    }
    if ctx.env.scope.scopes.len() != scope_depth_before {
        panic("unreachable: impl effect precheck removed an outer scope")
    }
    restore_scope_variable_maps(ctx, scope_variables_before)
    ctx.env.scope.def_spans = def_spans_before
    ctx.env.scope.var_bounds = var_bounds_before
    ctx.env.scope.mutable_vars = mutable_vars_before
    ctx.env.scope.let_defs = let_defs_before
    ctx.env.scope.mut_param_defs = mut_param_defs_before
    rollback_pending_dicts(ctx, dict_checkpoint)

    if precheck_succeeded {
        publish_impl_effect_precheck_commits(ctx, commits)
        ctx.fn_defaults = fn_defaults_after
        ctx.fn_default_var_bounds = fn_default_var_bounds_after
        ctx.fn_min_arity = fn_min_arity_after
    }
    for capture in default_authority_captures {
        merge_default_authority_capture(ctx, capture)
    }
    set_impl_precheck_methods_pending(
        ctx, target_for_final_pending, type_params, trait_name, methods, span,
        !precheck_succeeded)
    precheck_succeeded
}

fn record_fn_decl_index_firebreak(
    mut fn_name_to_idx: Map<Str, Int>, name: Str, index: Int
) {
    let indexed_name = "${name}"
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

fn check_one_decl_with_const_owner_firebreak(
    mut ctx: InferCtx,
    decl: Decl,
    frame_decl_index: Int?,
    mut hdecls: List<HDecl>,
    const_owners: ConstOwnerCache
) {
    let checked_decl = decl
    let checked_index = frame_decl_index
    let checked_const_owners = const_owners
    check_one_decl_with_rebind(
        ctx, checked_decl, checked_index,
        hdecls, some(checked_const_owners))
}

fn check_indexed_phase_decl_firebreak(
    mut ctx: InferCtx,
    decl: Decl,
    index: Int,
    mut hdecls: List<HDecl>,
    mut checked: Set<Int>,
    const_owners: ConstOwnerCache
) {
    let checked_decl = decl
    let checked_index = index
    let recorded_index = index
    let _ = some(check_one_decl_with_const_owner_firebreak(
        ctx, checked_decl,
        phase_decl_index_result_firebreak(checked_index),
        hdecls, const_owners)) catch { _ => none }
    checked.insert(recorded_index)
}

fn check_scc_decl_index_firebreak(
    mut ctx: InferCtx,
    decls: List<Decl>,
    index: Int,
    mut hdecls: List<HDecl>,
    mut checked: Set<Int>,
    const_owners: ConstOwnerCache
) {
    let lookup_index = index
    let checked_index = index
    let indexed_decl = decls.get(lookup_index)
    if indexed_decl.is_some() {
        check_indexed_phase_decl_firebreak(
            ctx, indexed_decl.unwrap(), checked_index,
            hdecls, checked, const_owners)
    }
}

fn check_decl_at_index_firebreak(
    mut ctx: InferCtx,
    decls: List<Decl>,
    index: Int,
    mut hdecls: List<HDecl>,
    mut checked: Set<Int>,
    const_owners: ConstOwnerCache
) {
    let indexed_decl = decls.get(index)
    if indexed_decl.is_some() {
        check_indexed_phase_decl_firebreak(
            ctx, indexed_decl.unwrap(), index,
            hdecls, checked, const_owners)
    }
}

fn check_remaining_decl_firebreak(
    mut ctx: InferCtx,
    decl: Decl,
    index: Int,
    mut hdecls: List<HDecl>,
    const_owners: ConstOwnerCache
) {
    let checked_decl = decl
    let checked_index = index
    let _ = some(check_one_decl_with_const_owner_firebreak(
        ctx, checked_decl,
        phase_decl_index_result_firebreak(checked_index),
        hdecls, const_owners)) catch { _ => none }
}

fn snapshot_const_owner_transaction(
    ctx: InferCtx
) -> ConstOwnerTransactionSnapshot {
    ConstOwnerTransactionSnapshot {
        subst: clone_union_find(ctx.subst),
        scope_variables: clone_scope_variable_maps(ctx.env.scope.scopes),
        callable_by_def_id: map_clone(
            ctx.env.types.ownership_metadata.callable_by_def_id),
        callable_state_by_def_id: map_clone(
            ctx.env.types.ownership_metadata.callable_state_by_def_id),
        callable_result_role_by_def_id: map_clone(
            ctx.env.types.ownership_metadata.callable_result_role_by_def_id),
        returned_callable_result_role_by_def_id: map_clone(
            ctx.env.types.ownership_metadata
                .returned_callable_result_role_by_def_id),
        callable_result_role_spine_by_def_id: map_clone(
            ctx.env.types.ownership_metadata
                .callable_result_role_spine_by_def_id),
        callable_inference_parents: map_clone(
            ctx.env.types.ownership_metadata.callable_inference_parents),
        callable_inference_solutions: map_clone(
            ctx.env.types.ownership_metadata.callable_inference_solutions),
        use_aliases: map_clone(ctx.use_aliases),
        value_binding_kinds: map_clone(ctx.value_binding_kinds),
        structs: map_clone(ctx.env.types.structs),
        enums: map_clone(ctx.env.types.enums),
        type_aliases: map_clone(ctx.env.types.type_aliases),
        effects: map_clone(ctx.env.types.effects),
        effect_aliases: map_clone(ctx.env.types.effect_aliases),
        sigs: map_clone(ctx.env.types.sigs),
        traits: map_clone(ctx.env.trait_reg.traits),
        variant_to_enum: map_clone(ctx.env.types.variant_to_enum),
        variant_ctor_origins: map_clone(ctx.env.types.variant_ctor_origins),
        exact_value_alias_targets: map_clone(
            ctx.pre_solve_exact_value_alias_targets),
        pending_inferred_const_def_ids: set_clone(
            ctx.pending_inferred_const_def_ids),
        pending_precheck_callable_def_ids: set_clone(
            ctx.pending_precheck_callable_def_ids),
        const_getter_aliases: set_clone(ctx.pre_solve_const_getter_aliases),
        callable_alias_targets: map_clone(ctx.pre_solve_callable_alias_targets),
        callable_alias_arities: map_clone(ctx.pre_solve_callable_alias_arities),
        callable_alias_contracts: map_clone(
            ctx.pre_solve_callable_alias_contracts),
        speculative_default_authority_def_ids: set_clone(
            ctx.speculative_default_authority_def_ids),
        boxed_vars: set_clone(ctx.boxed_vars),
        var_lambda_depth: map_clone(ctx.var_lambda_depth),
        fn_mut_params: map_clone(ctx.fn_mut_params),
        fn_defaults: map_clone(ctx.fn_defaults),
        fn_default_var_bounds: map_clone(ctx.fn_default_var_bounds),
        fn_min_arity: map_clone(ctx.fn_min_arity),
        latest_value_instantiation_maps: map_clone(
            ctx.latest_value_instantiation_maps),
        default_template_live_schemes: map_clone(
            ctx.default_template_live_schemes),
        rebind_assoc_provenance: map_clone(ctx.rebind_assoc_provenance),
        type_param_scope: map_clone(ctx.type_param_scope),
        qualified_assoc_scope: map_clone(ctx.qualified_assoc_scope),
        current_fn_return_type: ctx.current_fn_return_type,
        current_fn_bounds: list_clone(ctx.current_fn_bounds),
        fn_bounds_stack: clone_impl_precheck_bounds_stack(ctx.fn_bounds_stack),
        loop_depth: ctx.loop_depth,
        lambda_depth: ctx.lambda_depth,
        def_spans: map_clone(ctx.env.scope.def_spans),
        var_bounds: clone_impl_precheck_var_bounds(ctx.env.scope.var_bounds),
        mutable_vars: set_clone(ctx.env.scope.mutable_vars),
        let_defs: set_clone(ctx.env.scope.let_defs),
        mut_param_defs: set_clone(ctx.env.scope.mut_param_defs),
        mod_path_depth: ctx.mod_path_stack.len(),
        project_frame_depth: ctx.project_namespace_frame_stack.len(),
        mod_unsafe_allowed: ctx.mod_unsafe_allowed,
        dict_checkpoint: pending_dict_checkpoint(ctx)
    }
}

fn restore_const_owner_transaction(
    mut ctx: InferCtx, snapshot: ConstOwnerTransactionSnapshot
) {
    while ctx.project_namespace_frame_stack.len() >
            snapshot.project_frame_depth {
        if !exit_project_namespace_frame(ctx) {
            panic("unreachable: const owner transaction lost project frame")
        }
    }
    if ctx.project_namespace_frame_stack.len() < snapshot.project_frame_depth {
        panic("unreachable: const owner transaction removed an outer project frame")
    }
    while ctx.mod_path_stack.len() > snapshot.mod_path_depth {
        let _ = ctx.mod_path_stack.pop()
    }
    if ctx.mod_path_stack.len() < snapshot.mod_path_depth {
        panic("unreachable: const owner transaction removed an outer module path")
    }
    while ctx.env.scope.scopes.len() > snapshot.scope_variables.len() {
        ctx.env.pop_scope()
    }
    if ctx.env.scope.scopes.len() < snapshot.scope_variables.len() {
        panic("unreachable: const owner transaction removed an outer scope")
    }
    restore_scope_variable_maps(ctx, snapshot.scope_variables)
    ctx.subst = snapshot.subst
    ctx.env.types.ownership_metadata.callable_by_def_id =
        snapshot.callable_by_def_id
    ctx.env.types.ownership_metadata.callable_state_by_def_id =
        snapshot.callable_state_by_def_id
    ctx.env.types.ownership_metadata.callable_result_role_by_def_id =
        snapshot.callable_result_role_by_def_id
    ctx.env.types.ownership_metadata
        .returned_callable_result_role_by_def_id =
            snapshot.returned_callable_result_role_by_def_id
    ctx.env.types.ownership_metadata.callable_result_role_spine_by_def_id =
        snapshot.callable_result_role_spine_by_def_id
    ctx.env.types.ownership_metadata.callable_inference_parents =
        snapshot.callable_inference_parents
    ctx.env.types.ownership_metadata.callable_inference_solutions =
        snapshot.callable_inference_solutions
    ctx.use_aliases = snapshot.use_aliases
    ctx.value_binding_kinds = snapshot.value_binding_kinds
    ctx.env.types.structs = snapshot.structs
    ctx.env.types.enums = snapshot.enums
    ctx.env.types.type_aliases = snapshot.type_aliases
    ctx.env.types.effects = snapshot.effects
    ctx.env.types.effect_aliases = snapshot.effect_aliases
    ctx.env.types.sigs = snapshot.sigs
    ctx.env.trait_reg.traits = snapshot.traits
    ctx.env.types.variant_to_enum = snapshot.variant_to_enum
    ctx.env.types.variant_ctor_origins = snapshot.variant_ctor_origins
    ctx.pre_solve_exact_value_alias_targets =
        snapshot.exact_value_alias_targets
    ctx.pending_inferred_const_def_ids =
        snapshot.pending_inferred_const_def_ids
    ctx.pending_precheck_callable_def_ids =
        snapshot.pending_precheck_callable_def_ids
    ctx.pre_solve_const_getter_aliases = snapshot.const_getter_aliases
    ctx.pre_solve_callable_alias_targets = snapshot.callable_alias_targets
    ctx.pre_solve_callable_alias_arities = snapshot.callable_alias_arities
    ctx.pre_solve_callable_alias_contracts = snapshot.callable_alias_contracts
    ctx.speculative_default_authority_def_ids =
        snapshot.speculative_default_authority_def_ids
    ctx.boxed_vars = snapshot.boxed_vars
    ctx.var_lambda_depth = snapshot.var_lambda_depth
    ctx.fn_mut_params = snapshot.fn_mut_params
    ctx.fn_defaults = snapshot.fn_defaults
    ctx.fn_default_var_bounds = snapshot.fn_default_var_bounds
    ctx.fn_min_arity = snapshot.fn_min_arity
    ctx.latest_value_instantiation_maps =
        snapshot.latest_value_instantiation_maps
    ctx.default_template_live_schemes =
        snapshot.default_template_live_schemes
    ctx.rebind_assoc_provenance = snapshot.rebind_assoc_provenance
    ctx.type_param_scope = snapshot.type_param_scope
    ctx.qualified_assoc_scope = snapshot.qualified_assoc_scope
    ctx.current_fn_return_type = snapshot.current_fn_return_type
    ctx.current_fn_bounds = snapshot.current_fn_bounds
    ctx.fn_bounds_stack = snapshot.fn_bounds_stack
    ctx.loop_depth = snapshot.loop_depth
    ctx.lambda_depth = snapshot.lambda_depth
    ctx.env.scope.def_spans = snapshot.def_spans
    ctx.env.scope.var_bounds = snapshot.var_bounds
    ctx.env.scope.mutable_vars = snapshot.mutable_vars
    ctx.env.scope.let_defs = snapshot.let_defs
    ctx.env.scope.mut_param_defs = snapshot.mut_param_defs
    ctx.mod_unsafe_allowed = snapshot.mod_unsafe_allowed
    rollback_pending_dicts(ctx, snapshot.dict_checkpoint)
}

fn collect_decl_owner_sites(
    decls: List<Decl>, path_prefix: List<Int>, parent_mod: Str?,
    mut const_sites: List<DeclOwnerSite>,
    mut impl_sites: List<DeclOwnerSite>
) {
    for decl_index in 0..decls.len() {
        let decl = decls.get(decl_index).unwrap()
        let mut path = list_clone(path_prefix)
        path.push(decl_index)
        match decl {
            Decl::Const { name, .. } => {
                let canonical_name = match parent_mod {
                    some(mod_name) => "${mod_name}::${name}",
                    none => name
                }
                const_sites.push(DeclOwnerSite {
                    path: path, canonical_name: some(canonical_name)
                })
            },
            Decl::Impl { .. } => {
                impl_sites.push(DeclOwnerSite {
                    path: path, canonical_name: none
                })
            },
            Decl::ModBlock { name, decls: nested, .. } => {
                let nested_mod = match parent_mod {
                    some(mod_name) => "${mod_name}::${name}",
                    none => name
                }
                collect_decl_owner_sites(
                    nested, path, some(nested_mod),
                    const_sites, impl_sites)
            },
            _ => {}
        }
    }
}

fn snapshot_legacy_module_overlay(ctx: InferCtx) -> LegacyModuleOverlaySnapshot {
    LegacyModuleOverlaySnapshot {
        scope_variables: clone_scope_variable_maps(ctx.env.scope.scopes),
        structs: map_clone(ctx.env.types.structs),
        enums: map_clone(ctx.env.types.enums),
        type_aliases: map_clone(ctx.env.types.type_aliases),
        effects: map_clone(ctx.env.types.effects),
        effect_aliases: map_clone(ctx.env.types.effect_aliases),
        sigs: map_clone(ctx.env.types.sigs),
        traits: map_clone(ctx.env.trait_reg.traits),
        variant_to_enum: map_clone(ctx.env.types.variant_to_enum),
        variant_ctor_origins: map_clone(ctx.env.types.variant_ctor_origins),
        use_aliases: map_clone(ctx.use_aliases),
        value_binding_kinds: map_clone(ctx.value_binding_kinds),
        fn_mut_params: map_clone(ctx.fn_mut_params)
    }
}

fn same_optional_def_id(left: Int?, right: Int?) -> Bool {
    match left {
        some(a) => match right { some(b) => a == b, none => false },
        none => right.is_none()
    }
}

fn restore_legacy_module_overlay(
    mut ctx: InferCtx, snapshot: LegacyModuleOverlaySnapshot
) {
    while ctx.env.scope.scopes.len() > snapshot.scope_variables.len() {
        ctx.env.pop_scope()
    }
    if ctx.env.scope.scopes.len() < snapshot.scope_variables.len() {
        panic("unreachable: owner-pass module changed scope depth")
    }
    let mut scope_index = 0
    while scope_index < snapshot.scope_variables.len() {
        match (ctx.env.scope.scopes.get(scope_index),
               snapshot.scope_variables.get(scope_index)) {
            (some(scope), some(before)) => {
                let mut restored_scope = scope
                let mut restored = map_clone(before)
                // Keep authoritative rebinds to an existing declaration, but
                // discard fresh lexical alias DefIds installed by this module.
                for entry in restored_scope.variables.entries() {
                    let (name, current) = entry
                    match before.get(name) {
                        some(previous) => if same_optional_def_id(
                                current.def_id, previous.def_id) {
                            let restored_name = name
                            let restored_scheme = current
                            restored.insert(restored_name, restored_scheme)
                        },
                        none => {}
                    }
                }
                restored_scope.variables = restored
                ctx.env.scope.scopes.set(scope_index, restored_scope)
            },
            _ => panic("unreachable: owner-pass scope snapshot is missing")
        }
        scope_index = scope_index + 1
    }
    ctx.env.types.structs = snapshot.structs
    ctx.env.types.enums = snapshot.enums
    ctx.env.types.type_aliases = snapshot.type_aliases
    ctx.env.types.effects = snapshot.effects
    ctx.env.types.effect_aliases = snapshot.effect_aliases
    ctx.env.types.sigs = snapshot.sigs
    ctx.env.trait_reg.traits = snapshot.traits
    ctx.env.types.variant_to_enum = snapshot.variant_to_enum
    ctx.env.types.variant_ctor_origins = snapshot.variant_ctor_origins
    ctx.use_aliases = snapshot.use_aliases
    ctx.value_binding_kinds = snapshot.value_binding_kinds
    ctx.fn_mut_params = snapshot.fn_mut_params
}

fn enter_owner_site_module_context(
    mut ctx: InferCtx, mod_name: Str, uses: List<UseDecl>,
    decls: List<Decl>, required_effects: List<EffectExpr>?,
    frame_decl_index: Int
) -> Bool {
    let project_active = ctx.project_namespace_file_key.is_some()
    if project_active && !enter_project_child_frame(ctx, frame_decl_index) {
        panic("unreachable: resolver plan missing owner-pass module frame")
    }
    let segments = mod_name.split("::")
    let simple_name = segments.get(segments.len() - 1).unwrap_or(mod_name)
    ctx.mod_path_stack.push(simple_name)
    if !project_active {
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
    project_active
}

fn restore_owner_site_module_context(
    mut ctx: InferCtx, project_frame_depth: Int, mod_path_depth: Int,
    previous_unsafe: Bool, legacy_snapshot: LegacyModuleOverlaySnapshot?
) {
    ctx.mod_unsafe_allowed = previous_unsafe
    while ctx.mod_path_stack.len() > mod_path_depth {
        let _ = ctx.mod_path_stack.pop()
    }
    while ctx.project_namespace_frame_stack.len() > project_frame_depth {
        if !exit_project_namespace_frame(ctx) {
            panic("unreachable: owner-pass module frame was not active")
        }
    }
    if legacy_snapshot.is_some() {
        restore_legacy_module_overlay(ctx, legacy_snapshot.unwrap())
    }
}

fn check_const_owner_nested_path_firebreak(
    mut ctx: InferCtx,
    mod_name: Str,
    uses: List<UseDecl>,
    nested: List<Decl>,
    required_effects: List<EffectExpr>?,
    decl_index: Int,
    path: List<Int>,
    depth: Int,
    mut cache: ConstOwnerCache
) -> Bool {
    let name_for_context = mod_name
    let name_for_parent = mod_name
    let uses_for_context = uses
    let nested_for_context = nested
    let nested_for_recursion = nested
    let effects_for_context = required_effects
    let path_for_recursion = path
    let cache_for_recursion = cache
    let _ = enter_owner_site_module_context(
        ctx, name_for_context, uses_for_context, nested_for_context,
        effects_for_context, decl_index)
    check_const_owner_at_path(
        ctx, nested_for_recursion, path_for_recursion,
        depth + 1, some(name_for_parent), cache_for_recursion)
}

fn canonical_const_owner_decl_firebreak(
    parent_mod: Str?, source_decl: Decl
) -> Decl {
    let parent_for_prefix = parent_mod
    let source_for_prefix = source_decl
    let source_without_parent = source_decl
    if parent_for_prefix.is_some() {
        prefix_decl_name(parent_for_prefix.unwrap(), source_for_prefix)
    } else {
        source_without_parent
    }
}

fn check_const_owner_at_path(
    mut ctx: InferCtx, decls: List<Decl>, path: List<Int>, depth: Int,
    parent_mod: Str?, mut cache: ConstOwnerCache
) -> Bool {
    let decl_index = match path.get(depth) {
        some(index) => index,
        none => panic("unreachable: const owner site path is truncated")
    }
    let source_decl = decls.get(decl_index)
    if source_decl.is_none() {
        panic("unreachable: const owner site index is invalid")
    }
    let canonical = canonical_const_owner_decl_firebreak(
        parent_mod, source_decl.unwrap())
    let canonical_for_match = canonical
    let canonical_for_check = canonical
    if depth + 1 == path.len() {
        match canonical_for_match {
            Decl::Const { name, .. } => {
                let def_id = match maybe_registered_const_def_id(ctx, name) {
                    some(id) => id,
                    none => return false
                }
                if cache.checked.contains_key(def_id) ||
                   cache.failed.contains(def_id) {
                    return false
                }
                let subst_before = clone_union_find(ctx.subst)
                let checked = some(check_decl(
                    ctx, canonical_for_check, none, none)) catch { _ => none }
                let checked_for_shape = checked
                let checked_for_storage = checked
                match checked_for_shape {
                    some(HDecl::Const {
                        def_id: some(checked_def_id), ..
                    }) => {
                        if checked_def_id != def_id {
                            panic("unreachable: checked const owner DefId mismatch")
                        }
                        match checked_for_storage {
                            some(hdecl) => {
                                let stored_hdecl = hdecl
                                cache.checked.insert(def_id, stored_hdecl)
                            },
                            none => panic("unreachable: checked const owner was lost")
                        }
                        true
                    },
                    some(_) => panic(
                        "unreachable: const owner check produced non-const HIR"),
                    none => {
                        ctx.subst = subst_before
                        cache.failed.insert(def_id)
                        false
                    }
                }
            },
            _ => panic("unreachable: const owner site does not name a const")
        }
    } else {
        match canonical_for_match {
            Decl::ModBlock {
                name, uses, decls: nested, required_effects, ..
            } => {
                let previous_unsafe = ctx.mod_unsafe_allowed
                let project_frame_depth =
                    ctx.project_namespace_frame_stack.len()
                let mod_path_depth = ctx.mod_path_stack.len()
                let legacy_snapshot = if ctx.project_namespace_file_key.is_some() {
                    none
                } else {
                    some(snapshot_legacy_module_overlay(ctx))
                }
                let result = some({
                    check_const_owner_nested_path_firebreak(
                        ctx, name, uses, nested, required_effects,
                        decl_index, path, depth, cache)
                }) catch { _ => none }
                restore_owner_site_module_context(
                    ctx, project_frame_depth, mod_path_depth,
                    previous_unsafe, legacy_snapshot)
                match result {
                    some(ok) => ok,
                    none => fail.raise(CompileError {})
                }
            },
            _ => panic("unreachable: const owner path crossed a non-module")
        }
    }
}

fn check_const_owner_site_transaction(
    mut ctx: InferCtx, decls: List<Decl>, site: DeclOwnerSite,
    mut cache: ConstOwnerCache
) -> Bool {
    let snapshot = snapshot_const_owner_transaction(ctx)
    let checked = some(check_const_owner_at_path(
        ctx, decls, site.path, 0, none, cache)) catch { _ => none }
    match checked {
        some(true) => true,
        _ => {
            restore_const_owner_transaction(ctx, snapshot)
            // Registration failures and duplicate sites are already diagnosed.
            // Mark only an otherwise uncached exact owner as failed so replay
            // cannot mistake a missing cache entry for an internal invariant.
            match site.canonical_name {
                some(name) => match maybe_registered_const_def_id(ctx, name) {
                    some(def_id) => if !cache.checked.contains_key(def_id) {
                        cache.failed.insert(def_id)
                    },
                    none => {}
                },
                none => {}
            }
            false
        }
    }
}

fn precheck_impl_nested_path_firebreak(
    mut ctx: InferCtx,
    mod_name: Str,
    uses: List<UseDecl>,
    nested: List<Decl>,
    required_effects: List<EffectExpr>?,
    decl_index: Int,
    path: List<Int>,
    depth: Int
) -> Bool {
    let name_for_context = mod_name
    let name_for_parent = mod_name
    let uses_for_context = uses
    let nested_for_context = nested
    let nested_for_recursion = nested
    let effects_for_context = required_effects
    let path_for_recursion = path
    let _ = enter_owner_site_module_context(
        ctx, name_for_context, uses_for_context, nested_for_context,
        effects_for_context, decl_index)
    precheck_impl_at_path(
        ctx, nested_for_recursion, path_for_recursion,
        depth + 1, some(name_for_parent))
}

fn precheck_impl_at_path(
    mut ctx: InferCtx, decls: List<Decl>, path: List<Int>, depth: Int,
    parent_mod: Str?
) -> Bool {
    let decl_index = match path.get(depth) {
        some(index) => index,
        none => panic("unreachable: impl precheck site path is truncated")
    }
    let source_decl = decls.get(decl_index)
    if source_decl.is_none() {
        panic("unreachable: impl precheck site index is invalid")
    }
    let canonical = canonical_const_owner_decl_firebreak(
        parent_mod, source_decl.unwrap())
    if depth + 1 == path.len() {
        match canonical {
            Decl::Impl {
                target_type, type_params, trait_name, methods, span
            } => precheck_impl_effects_firebreak(
                ctx, target_type, type_params, trait_name, methods, span),
            _ => panic("unreachable: impl precheck site does not name an impl")
        }
    } else {
        match canonical {
            Decl::ModBlock {
                name, uses, decls: nested, required_effects, ..
            } => {
                let previous_unsafe = ctx.mod_unsafe_allowed
                let project_frame_depth =
                    ctx.project_namespace_frame_stack.len()
                let mod_path_depth = ctx.mod_path_stack.len()
                let legacy_snapshot = if ctx.project_namespace_file_key.is_some() {
                    none
                } else {
                    some(snapshot_legacy_module_overlay(ctx))
                }
                let result = some({
                    precheck_impl_nested_path_firebreak(
                        ctx, name, uses, nested, required_effects,
                        decl_index, path, depth)
                }) catch { _ => none }
                restore_owner_site_module_context(
                    ctx, project_frame_depth, mod_path_depth,
                    previous_unsafe, legacy_snapshot)
                match result {
                    some(ok) => ok,
                    none => false
                }
            },
            _ => panic("unreachable: impl precheck path crossed a non-module")
        }
    }
}

fn summary_var_fingerprint(
    var_id: Int, mut canonical_vars: Map<Int, Int>,
    mut next_var: List<Int>
) -> Str {
    match canonical_vars.get(var_id) {
        some(index) => "v${index.to_str()}",
        none => {
            let index = next_var.get(0).unwrap_or(0)
            canonical_vars.insert(var_id, index)
            next_var.set(0, index + 1)
            "v${index.to_str()}"
        }
    }
}

// Sort unordered semantic collections before assigning alpha-variable
// ordinals. Sorting their rendered strings afterwards is too late: traversal
// order would already have changed v0/v1 assignment across equivalent retry
// snapshots.
fn summary_effect_kind_order_key(eff: Effect) -> Str {
    match eff {
        Effect::IoEffect => "0:io",
        Effect::FailEffect { .. } => "1:fail",
        Effect::MutEffect { .. } => "2:mut",
        Effect::CustomEffect { name, .. } => "3:${name}",
        Effect::UnsafeEffect => "4:unsafe"
    }
}

fn ordered_summary_effects(
    metadata: OwnershipMetadata, subst: UnionFind,
    effects: List<Effect>, canonical_vars: Map<Int, Int>,
    next_var: List<Int>
) -> List<Effect> {
    let mut keyed: List<(Str, Effect)> = []
    for eff_item in effects {
        // Same-kind effects may carry distinct generic payloads (multiple
        // mut<T>/mut<U> effects are legal). Render each candidate against an
        // isolated copy of the already-established alpha namespace so row
        // iteration order cannot decide which payload receives vN.
        let preview_vars = map_clone(canonical_vars)
        let preview_next = [next_var.get(0).unwrap_or(0)]
        let effect_for_preview = eff_item
        let effect_for_kind = eff_item
        let effect_for_store = eff_item
        let preview = summary_effect_fingerprint(
            metadata, subst, effect_for_preview,
            preview_vars, preview_next)
        let effect_kind_key = summary_effect_kind_order_key(effect_for_kind)
        keyed.push((
            "${effect_kind_key}:${preview}",
            effect_for_store))
    }
    keyed.sort_by(compare_by_first)
    let mut ordered: List<Effect> = []
    for entry in keyed {
        let stored_effect = entry.1
        ordered.push(stored_effect)
    }
    ordered
}

fn compare_summary_record_fields(
    left: RecordField, right: RecordField
) -> Int {
    if left.name < right.name { -1 }
    else if left.name > right.name { 1 }
    else { 0 }
}

fn summary_effect_fingerprint(
    metadata: OwnershipMetadata, subst: UnionFind, eff: Effect,
    mut canonical_vars: Map<Int, Int>, mut next_var: List<Int>
) -> Str {
    match eff {
        Effect::IoEffect => "io",
        Effect::FailEffect { error_type } =>
            "fail<${summary_type_fingerprint(
                metadata, subst, error_type,
                canonical_vars, next_var)}>",
        Effect::MutEffect { state_type } =>
            "mut<${summary_type_fingerprint(
                metadata, subst, state_type,
                canonical_vars, next_var)}>",
        Effect::CustomEffect { name, type_args } => {
            let mut args: List<Str> = []
            for arg in type_args {
                args.push(summary_type_fingerprint(
                    metadata, subst, arg, canonical_vars, next_var))
            }
            "${name}<${args.join(",")}>"
        },
        Effect::UnsafeEffect => "unsafe"
    }
}

fn summary_effect_row_fingerprint(
    metadata: OwnershipMetadata, subst: UnionFind, row: EffectRow,
    mut canonical_vars: Map<Int, Int>, mut next_var: List<Int>
) -> Str {
    let resolved = apply_subst_row(subst, row)
    let mut effects: List<Str> = []
    let ordered_effects = ordered_summary_effects(
        metadata, subst, resolved.effects, canonical_vars, next_var)
    for eff_item in ordered_effects {
        effects.push(summary_effect_fingerprint(
            metadata, subst, eff_item, canonical_vars, next_var))
    }
    let tail = match resolved.tail {
        some(id) => summary_var_fingerprint(
            id, canonical_vars, next_var),
        none => "!"
    }
    "${effects.join("+")}|${tail}"
}

fn summary_type_fingerprint(
    metadata: OwnershipMetadata, subst: UnionFind, ty: Type,
    mut canonical_vars: Map<Int, Int>, mut next_var: List<Int>
) -> Str {
    let resolved = apply_subst(subst, ty)
    match resolved {
        Type::IntType => "Int",
        Type::FloatType => "Float",
        Type::StrType => "Str",
        Type::BoolType => "Bool",
        Type::UnitType => "Unit",
        Type::NeverType => "Never",
        Type::AnyType => "Any",
        Type::TypeVar { id, .. } => summary_var_fingerprint(
            id, canonical_vars, next_var),
        Type::FnType { params, return_type, meta } => {
            let mut modes: List<Str> = []
            for param_index in 0..params.len() {
                modes.push(callable_param_ownership(
                    metadata, meta.ownership_term, param_index).to_str())
            }
            let result_mode = callable_return_ownership(
                metadata, meta.ownership_term).to_str()
            let mut param_types: List<Str> = []
            for param in params {
                param_types.push(summary_type_fingerprint(
                    metadata, subst, param, canonical_vars, next_var))
            }
            let return_summary = summary_type_fingerprint(
                metadata, subst, return_type,
                canonical_vars, next_var)
            let effect_summary = summary_effect_row_fingerprint(
                metadata, subst, meta.effects,
                canonical_vars, next_var)
            "fn(${param_types.join(",")})->${return_summary}/${effect_summary}/${modes.join(",")}:${result_mode}"
        },
        Type::StructType { name, type_params } => {
            let mut params: List<Str> = []
            for param in type_params {
                params.push(summary_type_fingerprint(
                    metadata, subst, param, canonical_vars, next_var))
            }
            "struct:${name}<${params.join(",")}>"
        },
        Type::EnumType { name, type_params } => {
            let mut params: List<Str> = []
            for param in type_params {
                params.push(summary_type_fingerprint(
                    metadata, subst, param, canonical_vars, next_var))
            }
            "enum:${name}<${params.join(",")}>"
        },
        Type::GenericType { base, args } => {
            let mut params: List<Str> = []
            for arg in args {
                params.push(summary_type_fingerprint(
                    metadata, subst, arg, canonical_vars, next_var))
            }
            "generic:${summary_type_fingerprint(
                metadata, subst, base,
                canonical_vars, next_var)}<${params.join(",")}>"
        },
        Type::RecordType { fields, tail, .. } => {
            let mut parts: List<Str> = []
            let mut ordered_fields = list_clone(fields)
            ordered_fields.sort_by(compare_summary_record_fields)
            for field in ordered_fields {
                parts.push("${field.name}:${summary_type_fingerprint(
                    metadata, subst, field.ty,
                    canonical_vars, next_var)}")
            }
            let tail_marker = match tail {
                some(id) => summary_var_fingerprint(
                    id, canonical_vars, next_var),
                none => "!"
            }
            "record:${parts.join(",")}|${tail_marker}"
        },
        Type::EffectRowType { effects, tail } => {
            let mut parts: List<Str> = []
            let ordered_effects = ordered_summary_effects(
                metadata, subst, effects, canonical_vars, next_var)
            for eff_item in ordered_effects {
                parts.push(summary_effect_fingerprint(
                    metadata, subst, eff_item,
                    canonical_vars, next_var))
            }
            let tail_marker = match tail {
                some(id) => summary_var_fingerprint(
                    id, canonical_vars, next_var),
                none => "!"
            }
            "effects:${parts.join(",")}|${tail_marker}"
        },
        Type::TupleType { elements } => {
            let mut parts: List<Str> = []
            for element in elements {
                parts.push(summary_type_fingerprint(
                    metadata, subst, element,
                    canonical_vars, next_var))
            }
            "tuple:${parts.join(",")}"
        },
        Type::PtrType { pointee } =>
            "ptr:${summary_type_fingerprint(
                metadata, subst, pointee,
                canonical_vars, next_var)}",
        Type::ErrorType => "error"
    }
}

fn summary_scheme_fingerprint(
    metadata: OwnershipMetadata, subst: UnionFind, scheme: TypeScheme,
    mut canonical_vars: Map<Int, Int>, mut next_var: List<Int>
) -> Str {
    let mut quantified_order: Map<Int, Int> = map_new()
    let mut resolved_quantified: List<Type> = []
    let mut quantified_index = 0
    // Quantifier order is part of the scheme's semantic identity. Seed those
    // alpha names before walking unordered effect rows, so two same-kind
    // payloads which mention T/U receive stable preview keys even when the row
    // storage order changes between fixed-point retries.
    for var_id in scheme.type_vars {
        let resolved = apply_subst(
            subst, Type::TypeVar { id: var_id, name: none })
        let resolved_for_seed = resolved
        let resolved_for_store = resolved
        match resolved_for_seed {
            Type::TypeVar { id, .. } => {
                quantified_order.insert(id, quantified_index)
                let _ = summary_var_fingerprint(
                    id, canonical_vars, next_var)
            },
            _ => {}
        }
        resolved_quantified.push(resolved_for_store)
        quantified_index = quantified_index + 1
    }
    let ty = summary_type_fingerprint(
        metadata, subst, scheme.ty, canonical_vars, next_var)
    let mut quantified: List<Str> = []
    for resolved in resolved_quantified {
        match resolved {
            Type::TypeVar { id, .. } => quantified.push(
                summary_var_fingerprint(id, canonical_vars, next_var)),
            _ => quantified.push(summary_type_fingerprint(
                metadata, subst, resolved, canonical_vars, next_var))
        }
    }
    let mut bounds: List<Str> = []
    let mut ordered_bounds: List<(Str, SchemeBound)> = []
    for bound in scheme.bounds {
        let bound_for_store = bound
        let resolved_owner_for_key = apply_subst(
            subst, Type::TypeVar { id: bound.type_var, name: none })
        let owner_key = match resolved_owner_for_key {
            Type::TypeVar { id, .. } => match quantified_order.get(id) {
                some(index) => index.to_str(),
                none => "unquantified"
            },
            _ => type_to_string(resolved_owner_for_key)
        }
        let mut assoc_names: List<Str> = []
        for constraint in bound.assoc_constraints {
            let assoc_name = "${constraint.name}"
            assoc_names.push(assoc_name)
        }
        assoc_names.sort()
        ordered_bounds.push((
            "${owner_key}:${bound.trait_name}:${assoc_names.join(",")}",
            bound_for_store))
    }
    ordered_bounds.sort_by(compare_by_first)
    for bound_entry in ordered_bounds {
        let (_, bound) = bound_entry
        let resolved_owner = apply_subst(
            subst, Type::TypeVar { id: bound.type_var, name: none })
        let owner = match resolved_owner {
            Type::TypeVar { id, .. } => summary_var_fingerprint(
                id, canonical_vars, next_var),
            _ => summary_type_fingerprint(
                metadata, subst, resolved_owner,
                canonical_vars, next_var)
        }
        let mut assoc: List<Str> = []
        let mut ordered_assoc = list_clone(bound.assoc_constraints)
        ordered_assoc.sort_by(fn(left, right) {
            if left.name < right.name { -1 }
            else if left.name > right.name { 1 }
            else { 0 }
        })
        for constraint in ordered_assoc {
            assoc.push("${constraint.name}=${summary_type_fingerprint(
                metadata, subst, constraint.ty,
                canonical_vars, next_var)}")
        }
        bounds.push("${owner}:${bound.trait_name}<${assoc.join(",")}>")
    }
    "${ty}:forall[${quantified.join(",")}]:where[${bounds.join(",")}]"
}

fn callable_def_id_summary_fingerprint(
    metadata: OwnershipMetadata, def_id: Int?
) -> Str {
    match def_id {
        none => "no-def",
        some(id) => match metadata.callable_by_def_id.get(id) {
            none => "def:${id.to_str()}:no-contract",
            some(term) => {
                let mut levels: List<Str> = []
                match metadata.callable_state_by_def_id.get(id) {
                    some(state) => {
                        for level in state.transfer_levels {
                            let mut modes: List<Str> = []
                            for param_index in 0..level.force_params.len() {
                                let force = level.force_params.get(
                                    param_index).unwrap_or(false)
                                let param_mode = callable_param_ownership(
                                    metadata, level.ownership_term,
                                    param_index).to_str()
                                let force_suffix = if force { "f" } else { "n" }
                                modes.push("${param_mode}${force_suffix}")
                            }
                            let return_mode = callable_return_ownership(
                                metadata, level.ownership_term).to_str()
                            levels.push("${modes.join(",")}:${return_mode}")
                        }
                        levels.push("source:${state.source.to_str()}")
                    },
                    none => levels.push("no-state")
                }
                let roles = match metadata
                        .callable_result_role_spine_by_def_id.get(id) {
                    some(spine) => spine.map(fn(role) {
                        role.to_str()
                    }).join(","),
                    none => "no-roles"
                }
                let direct_mode = callable_return_ownership(
                    metadata, term).to_str()
                "def:${id.to_str()}:${direct_mode}:${levels.join("/")}:${roles}"
            }
        }
    }
}

fn callable_summary_fingerprint(
    ctx: InferCtx, fn_names: Set<Str>
) -> Str {
    let metadata = ctx.env.types.ownership_metadata
    // One canonical variable namespace spans every scheme/default in this
    // snapshot.  This preserves cross-summary equality while remaining stable
    // when a retry allocates different raw checker-local variable IDs.
    let mut canonical_vars: Map<Int, Int> = map_new()
    let mut next_var: List<Int> = [0]
    let mut entries: List<Str> = []
    let mut ordered_fn_names: List<Str> = []
    for name in fn_names {
        let ordered_name = "${name}"
        ordered_fn_names.push(ordered_name)
    }
    ordered_fn_names.sort()
    for name in ordered_fn_names {
        match ctx.env.lookup(name) {
            some(scheme) => {
                let scheme_def_id = scheme.def_id
                let scheme_summary = summary_scheme_fingerprint(
                    metadata, ctx.subst, scheme,
                    canonical_vars, next_var)
                let def_summary = callable_def_id_summary_fingerprint(
                    metadata, scheme_def_id)
                entries.push("fn:${name}:${scheme_summary}:${def_summary}")
            },
            none => {}
        }
        let default_owner_def_id = default_owner_def_id_for_name(ctx, name)
        match default_owner_def_id {
            some(owner_def_id) => match (
                ctx.fn_min_arity.get(owner_def_id),
                ctx.fn_defaults.get(owner_def_id),
                ctx.fn_default_var_bounds.get(owner_def_id)
            ) {
            (some(min_arity), some(defaults), some(local_bounds)) => {
                let mut default_types: List<Str> = []
                for default in defaults {
                    let default_type = summary_type_fingerprint(
                        metadata, ctx.subst, hexpr_type(default),
                        canonical_vars, next_var)
                    let default_effects = summary_effect_row_fingerprint(
                        metadata, ctx.subst, hexpr_effects(default),
                        canonical_vars, next_var)
                    default_types.push("${default_type}/${default_effects}")
                }
                let mut template_vars =
                    default_template_var_ids(defaults).to_list()
                template_vars.sort()
                let mut template_var_parts: List<Str> = []
                for var_id in template_vars {
                    let mut bounds: List<Str> = match local_bounds.get(var_id) {
                        some(set) => set.to_list(),
                        none => []
                    }
                    bounds.sort()
                    let template_var = summary_var_fingerprint(
                        var_id, canonical_vars, next_var)
                    template_var_parts.push(
                        "${template_var}:${bounds.join("+")}")
                }
                let default_count = defaults.len().to_str()
                let default_type_summary = default_types.join(",")
                let template_var_summary = template_var_parts.join(",")
                entries.push(
                    "defaults:${name}:${min_arity.to_str()}:${default_count}:${default_type_summary}:${template_var_summary}")
            },
            _ => entries.push("defaults:${name}:none")
            },
            none => entries.push("defaults:${name}:none")
        }
    }
    let mut method_schemes: Map<Str, TypeScheme> = map_new()
    for target_entry in ctx.env.trait_reg.impl_methods.entries() {
        let (target, methods) = target_entry
        for method_entry in methods.entries() {
            let (method, scheme) = method_entry
            let stored_scheme = scheme
            method_schemes.insert(
                "impl:${target}:${method}", stored_scheme)
        }
    }
    for impl_entry in ctx.env.trait_reg.trait_impls.entries() {
        let (_, impls) = impl_entry
        for impl_ in impls {
            for method_entry in impl_.method_schemes.entries() {
                let (method, scheme) = method_entry
                let stored_scheme = scheme
                method_schemes.insert(
                    "trait:${impl_.origin}:${method}", stored_scheme)
            }
        }
    }
    let mut method_keys: List<Str> = []
    for entry in method_schemes.entries() {
        let method_key = entry.0
        method_keys.push(method_key)
    }
    method_keys.sort()
    for key in method_keys {
        match method_schemes.get(key) {
            some(scheme) => {
                let scheme_def_id = scheme.def_id
                let scheme_summary = summary_scheme_fingerprint(
                    metadata, ctx.subst, scheme,
                    canonical_vars, next_var)
                let def_summary = callable_def_id_summary_fingerprint(
                    metadata, scheme_def_id)
                entries.push("${key}:${scheme_summary}:${def_summary}")
                match scheme_def_id {
                    some(owner_def_id) => match (
                        ctx.fn_min_arity.get(owner_def_id),
                        ctx.fn_defaults.get(owner_def_id),
                        ctx.fn_default_var_bounds.get(owner_def_id)
                    ) {
                        (some(min_arity), some(defaults),
                         some(local_bounds)) => {
                            let mut default_types: List<Str> = []
                            for default in defaults {
                                let default_type = summary_type_fingerprint(
                                    metadata, ctx.subst,
                                    hexpr_type(default), canonical_vars,
                                    next_var)
                                let default_effects =
                                    summary_effect_row_fingerprint(
                                        metadata, ctx.subst,
                                        hexpr_effects(default),
                                        canonical_vars, next_var)
                                default_types.push(
                                    "${default_type}/${default_effects}")
                            }
                            let mut template_vars =
                                default_template_var_ids(defaults).to_list()
                            template_vars.sort()
                            let mut template_var_parts: List<Str> = []
                            for var_id in template_vars {
                                let mut bounds: List<Str> = match
                                        local_bounds.get(var_id) {
                                    some(set) => set.to_list(),
                                    none => []
                                }
                                bounds.sort()
                                let template_var = summary_var_fingerprint(
                                    var_id, canonical_vars, next_var)
                                template_var_parts.push(
                                    "${template_var}:${bounds.join("+")}")
                            }
                            let default_count = defaults.len().to_str()
                            let default_type_summary = default_types.join(",")
                            let template_var_summary =
                                template_var_parts.join(",")
                            entries.push(
                                "defaults:${key}:${min_arity.to_str()}:${default_count}:${default_type_summary}:${template_var_summary}")
                        },
                        _ => entries.push("defaults:${key}:none")
                    },
                    none => entries.push("defaults:${key}:none")
                }
            },
            none => panic(
                "unreachable: callable summary method key disappeared")
        }
    }
    let mut pending: List<Str> = []
    for def_id in ctx.pending_precheck_callable_def_ids {
        pending.push(def_id.to_str())
    }
    pending.sort()
    entries.push("pending:${pending.join(",")}")
    entries.sort()
    entries.join(";")
}

fn precheck_callable_summaries_to_fixed_point(
    mut ctx: InferCtx, decls: List<Decl>,
    impl_sites: List<DeclOwnerSite>,
    scc_groups: List<List<Str>>, precheck_nodes: Set<Str>,
    fn_name_to_idx: Map<Str, Int>,
    mut blocked_impl_prechecks: Set<Int>,
    mut blocked_fn_prechecks: Set<Str>
) {
    let mut previous = callable_summary_fingerprint(ctx, precheck_nodes)
    let mut round = 0
    let fuel = precheck_nodes.len() + impl_sites.len() + 2
    while round < fuel {
        // A validated default header is usable independently from its blocked
        // body summary.  Clear all such method/function markers together for
        // the round so mutually dependent impl owners do not alternate between
        // hiding headers that are already exact and available.
        for entry in ctx.pending_fn_default_seed_values.entries() {
            let seeded_def_id = entry.0
            ctx.pending_precheck_callable_def_ids.remove(seeded_def_id)
        }
        // Run functions first so a direct pending-const dependency marks its
        // DefId before any impl caller can consume the registration placeholder.
        // The next round propagates the inverse Function -> MethodCall edge.
        for scc_group in scc_groups {
            precheck_fn_scc_firebreak(
                ctx, decls, scc_group, precheck_nodes,
                fn_name_to_idx, blocked_fn_prechecks)
        }
        for impl_site_index in 0..impl_sites.len() {
            let site = impl_sites.get(impl_site_index).unwrap()
            if precheck_impl_at_path(
                    ctx, decls, site.path, 0, none) {
                blocked_impl_prechecks.remove(impl_site_index)
            } else {
                blocked_impl_prechecks.insert(impl_site_index)
            }
        }
        let current = callable_summary_fingerprint(ctx, precheck_nodes)
        if current == previous { return }
        previous = current
        round = round + 1
    }
    panic("unreachable: callable summary precheck did not converge")
}

fn check_registered_body(
    mut ctx: InferCtx, program: Program,
    derived_impls: List<DerivedImpl>
) -> HProgram {
    // Build one whole-file callable plan. Function and impl summaries alternate
    // to a fixed point because MethodCall edges are resolved by inference, not
    // by the syntactic direct-call SCC graph.
    let registered_fns = collect_registered_fn_names(program.decls)
    let call_graph = build_call_graph(program.decls, registered_fns)
    let scc_groups = tarjan_scc(call_graph)
    let mut fn_name_to_idx: Map<Str, Int> = map_new()
    let mut idx = 0
    for decl in program.decls {
        let current_idx = idx
        match decl {
            Decl::Fn { name, .. } => {
                record_fn_decl_index_firebreak(
                    fn_name_to_idx, name, current_idx)
            },
            _ => {}
        }
        idx = idx + 1
    }
    let mut impl_fn_names: Set<Str> = set_new()
    collect_impl_scc_fn_names(program.decls, none, impl_fn_names)
    let mut precheck_nodes: Set<Str> = set_new()
    for name in registered_fns {
        if !impl_fn_names.contains(name) {
            let precheck_name = "${name}"
            precheck_nodes.insert(precheck_name)
        }
    }

    let mut const_sites: List<DeclOwnerSite> = []
    let mut impl_sites: List<DeclOwnerSite> = []
    collect_decl_owner_sites(
        program.decls, [], none, const_sites, impl_sites)
    let mut const_owners = ConstOwnerCache {
        checked: map_new(), failed: set_new(), emitted: set_new()
    }
    let mut blocked_impl_prechecks: Set<Int> = set_new()
    let mut blocked_fn_prechecks: Set<Str> = set_new()

    precheck_callable_summaries_to_fixed_point(
        ctx, program.decls, impl_sites, scc_groups, precheck_nodes,
        fn_name_to_idx, blocked_impl_prechecks, blocked_fn_prechecks)
    for site in const_sites {
        let site_for_check = duplicate_decl_owner_site(site)
        let site_for_rebind = duplicate_decl_owner_site(site)
        let _ = check_const_owner_site_transaction(
            ctx, program.decls, site_for_check, const_owners)
        let canonical_name = site_for_rebind.canonical_name
        if canonical_name.is_some() {
            let name = canonical_name.unwrap()
            let name_for_lookup = "${name}"
            let name_for_rebind = "${name}"
            let final_scheme = ctx.env.lookup(name_for_lookup)
            if final_scheme.is_some() {
                rebind_scheme_with_exact_aliases(
                    ctx, name_for_rebind, final_scheme.unwrap())
            }
        } else {
            panic("unreachable: const owner site has no identity")
        }
        // A completed const can unblock either side of an alternating
        // Fn/Impl dependency chain. Always retry from the root frame.
        precheck_callable_summaries_to_fixed_point(
            ctx, program.decls, impl_sites, scc_groups, precheck_nodes,
            fn_name_to_idx, blocked_impl_prechecks,
            blocked_fn_prechecks)
    }

    let mut hdecls: List<HDecl> = []
    let mut checked: Set<Int> = set_new()

    // Retained body pass. Every const below replays its owner-pass HIR; body
    // declarations can therefore cross ancestor module boundaries without
    // observing a registration-time const placeholder.
    let mut di = 0
    while di < program.decls.len() {
        let current_di = di
        let is_deferred = match program.decls.get(current_di) {
            some(Decl::Fn { .. }) => true,
            some(Decl::Impl { .. }) => true,
            some(Decl::ModBlock { .. }) => true,
            _ => false
        }
        if !is_deferred {
            check_decl_at_index_firebreak(
                ctx, program.decls, current_di,
                hdecls, checked, const_owners)
        }
        di = di + 1
    }

    // Nested modules now only replay cached owners and emit retained bodies.
    let mut mi = 0
    while mi < program.decls.len() {
        let current_mi = mi
        let is_module = match program.decls.get(current_mi) {
            some(Decl::ModBlock { .. }) => true,
            _ => false
        }
        if is_module && !checked.contains(current_mi) {
            check_decl_at_index_firebreak(
                ctx, program.decls, current_mi,
                hdecls, checked, const_owners)
        }
        mi = mi + 1
    }

    // Phase 2a: Check impl blocks in source order (before top-level fns).
    // This re-checks impls with effects populated by the pre-pass.
    // Must happen before top-level fns so that method effects are visible
    // to callers (method calls are invisible to the call graph).
    let mut ii = 0
    while ii < program.decls.len() {
        let current_ii = ii
        let next_ii = ii + 1
        let is_impl = match program.decls.get(current_ii) {
            some(Decl::Impl { .. }) => true,
            _ => false
        }
        if is_impl && !checked.contains(current_ii) {
            check_decl_at_index_firebreak(
                ctx, program.decls, current_ii,
                hdecls, checked, const_owners)
        }
        ii = next_ii
    }

    // Phase 2b: Check top-level fn declarations in SCC topological order.
    // tarjan_scc returns SCCs with leaf dependencies first (reverse topo),
    // so callees are checked before callers. After each check, rebinding
    // makes the resolved return type visible to subsequent callers.
    for scc_group in scc_groups {
        for name in scc_group {
            set_fn_precheck_pending(ctx, name, false)
        }
        for name in scc_group {
            match fn_name_to_idx.get(name) {
                some(i) => {
                    if !checked.contains(i) {
                        check_scc_decl_index_firebreak(
                            ctx, program.decls, i, hdecls, checked,
                            const_owners)
                    }
                },
                none => {}
            }
        }
    }

    // Phase 3: Check any remaining unchecked decls (safety net for decls
    // not reached by SCC — e.g., dead code or decls with no call graph edges).
    let mut ri = 0
    while ri < program.decls.len() {
        let current_ri = ri
        let next_ri = ri + 1
        if !checked.contains(current_ri) {
            check_decl_at_index_firebreak(
                ctx, program.decls, current_ri,
                hdecls, checked, const_owners)
        }
        ri = next_ri
    }

    // Check for cyclic dependencies in default effect handlers
    check_default_effect_cycles(ctx, program.decls)

    finalize_pending_fn_default_seeds(ctx)

    // A default HIR template may carry exact lexical identities. Keep only
    // identities that actually reached retained HIR through call-site
    // expansion; otherwise its provisional transfer state would cross freeze.
    prune_unretained_default_authority(ctx, hdecls)

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
                let extern_name = "${def.name}"
                extern_names.insert(extern_name)
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
    let result = check_decl(ctx, decl, none, none)
    if false { fail.raise(CompileError {}) }
    result
}
