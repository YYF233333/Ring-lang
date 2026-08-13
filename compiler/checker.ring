use types::{Type, EffectRow, OwnershipMetadata, UNIT, nominal_display_name,
    types_equal_with_ownership,
    CALLABLE_SOURCE_BUILTIN,
    set_callable_result_role, set_returned_callable_result_role,
    set_callable_result_role_spine,
    merge_callable_ownership_descriptor, merge_ownership_shape,
    clone_callable_transfer_levels, callable_transfer_levels_equal,
    callable_interface_transfer_levels, set_callable_transfer_levels}
use ast::{Program, Decl, UseDecl, UseImport, Span, TypeParam, Param,
    TypeExpr, EffectExpr, Expr, span_zero}
use hir::{HDecl, HParam, HProgram, ModuleImplFact, ValueBindingKind,
    CHECKER_ONLY_EXTERN_CALLABLES,
    compare_by_first, hexpr_type,
    map_index_helper_source_name, map_index_helper_identity,
    prelude_extern_identity}
use diagnostics::{Severity, DiagnosticContext, CollectingSink, new_collecting_sink, make_diag}
use env::{TypeEnv, TypeScheme, SchemeBound, SigDef, ImplEntry,
    TraitDef, TraitMethodDef,
    new_type_env, add_impl, find_impl, install_method_scheme,
    new_local_callable_scheme, new_local_callable_identity_scheme,
    new_local_callable_identity_scheme_with_transfer_levels,
    update_local_callable_scheme,
    impl_method_origin}
use builtins::{register_builtins, register_hof_intrinsics}
use infer_decl::{check as infer_check, check_module_identity, check_prelude_decl}
use ownership::{solve_and_plan_ownership}
use dict_lower::{lower_dicts}
use andor_lower::{lower_andor}
use infer_ctx::{InferCtx, type_error, record_value_origin, record_variant_ctor_origin,
    record_value_binding_kind, install_project_namespace_plan}
use infer_register::{register_prelude_decl_public,
    exact_prelude_extern_ownership, exact_prelude_extern_source,
    exact_prelude_extern_result_role}
use exports::{ModuleExports, TypeDef, freeze_module_exports_ownership}
use resolver::{ResolvedNamespacePlan, ModuleFramePlan, AstSite, ImportIssue,
    ImportIssueKind, NamespaceKind}
use codes::{E0504, E0702, E0703, E0704, E0705, E0707}
use parser::{parse}
use union_find::{UnionFind}
use unify::{empty_subst}

pub struct CheckResult {
    pub program: HProgram,
    pub env: TypeEnv,
    pub fn_mut_params: Map<Str, List<Bool>>,
    // Exact lexical DefId -> final canonical value identity. Re-export
    // extraction follows this map instead of preserving intermediate aliases.
    pub value_origins: Map<Int, Str>,
    // Exact lexical DefId -> registration kind.  Export extraction consumes
    // this map so same-file inline aliases retain provenance across arbitrary
    // pub-use hops without falling back to leaf-name guesses.
    pub value_binding_kinds: Map<Int, ValueBindingKind>,
    // User-declared impl blocks with the canonical target identity resolved
    // during checking (while namespace frames were live). Collected from the
    // module's own HIR before prelude decls are prepended, so exports never
    // have to re-resolve an impl target against the rolled-back environment.
    pub impl_facts: List<ModuleImplFact>
}

const STD_FILES: List<Str> =
    ["io.ring", "iterator.ring", "list.ring", "map.ring", "set.ring", "str.ring", "num.ring", "result.ring", "fs.ring", "path.ring", "process.ring"]

fn rebuild_prelude_fn_decl_firebreak(
    name: Str, type_params: List<TypeParam>, params: List<Param>,
    return_type: TypeExpr?, declared_effects: List<EffectExpr>?, body: Expr,
    is_pub: Bool, is_abstract: Bool, span: Span
) -> Decl {
    let rebuilt_name = name
    let rebuilt_type_params = type_params
    let rebuilt_params = params
    let rebuilt_return_type = return_type
    let rebuilt_declared_effects = declared_effects
    let rebuilt_body = body
    let rebuilt_span = span
    Decl::Fn {
        name: rebuilt_name,
        type_params: rebuilt_type_params,
        params: rebuilt_params,
        return_type: rebuilt_return_type,
        declared_effects: rebuilt_declared_effects,
        body: rebuilt_body,
        is_pub: is_pub,
        is_abstract: is_abstract,
        span: rebuilt_span
    }
}

fn canonicalize_prelude_decl(decl: Decl) -> Decl {
    match decl {
        Decl::Fn { name, type_params, params, return_type, declared_effects,
                   body, is_pub, is_abstract, span } => {
            if name == map_index_helper_source_name() {
                // Compiler-synthesised Map indexing must target an identity no
                // Ring source identifier can spell.  Keep the raw API as an
                // environment alias below; the emitted definition is private
                // so project-link candidate collection ignores it.
                rebuild_prelude_fn_decl_firebreak(
                    map_index_helper_identity(), type_params, params,
                    return_type, declared_effects, body,
                    false, is_abstract, span)
            } else {
                rebuild_prelude_fn_decl_firebreak(
                    name, type_params, params, return_type,
                    declared_effects, body, is_pub, is_abstract, span)
            }
        },
        _ => decl
    }
}

fn std_dir_result_firebreak(dir: Str) -> Str? {
    let found_dir = dir
    some(found_dir)
}

fn find_std_dir() -> Str? {
    let candidates = [
        path_resolve(path_join(path_dirname(path_resolve(".")), "std")),
        path_resolve("std")
    ]
    for dir in candidates {
        if file_exists(dir) { return std_dir_result_firebreak(dir) }
    }
    none
}

fn canonicalize_loaded_prelude_decl_firebreak(decl: Decl) -> Decl {
    let source_decl = decl
    canonicalize_prelude_decl(source_decl)
}

fn rebind_prelude_extern_firebreak(
    mut ctx: InferCtx, name: Str, scheme: TypeScheme
) {
    let rebound_name = name
    ctx.env.rebind(rebound_name, scheme)
}

fn append_prelude_hdecl_firebreak(
    mut prelude_hdecls: List<HDecl>, hdecl: HDecl
) {
    let appended_hdecl = hdecl
    prelude_hdecls.push(appended_hdecl)
}

fn append_prelude_fn_method_firebreak(
    mut methods: List<Decl>, method: Decl
) {
    let appended_method = method
    methods.push(appended_method)
}

fn filtered_prelude_impl_decl_firebreak(
    target_type: Str, type_params: List<TypeParam>, trait_name: Str?,
    methods: List<Decl>, span: Span
) -> Decl {
    let filtered_target_type = target_type
    let filtered_type_params = type_params
    let filtered_trait_name = trait_name
    let filtered_methods = methods
    let filtered_span = span
    Decl::Impl {
        target_type: filtered_target_type,
        type_params: filtered_type_params,
        trait_name: filtered_trait_name,
        methods: filtered_methods,
        span: filtered_span
    }
}

fn record_emitted_prelude_extern_firebreak(
    mut emitted: Set<Int>, def_id: Int
) {
    let emitted_def_id = def_id
    emitted.insert(emitted_def_id)
}

fn append_prelude_extern_hdecl_firebreak(
    mut prelude_hdecls: List<HDecl>, name: Str, abi_name: Str,
    def_id: Int?, type_params: List<TypeParam>, params: List<HParam>,
    return_type: Type, effects: EffectRow, is_pub: Bool, span: Span
) {
    let emitted_name = name
    let emitted_abi_name = abi_name
    let emitted_def_id = def_id
    let emitted_type_params = type_params
    let emitted_params = params
    let emitted_return_type = return_type
    let emitted_effects = effects
    let emitted_span = span
    prelude_hdecls.push(HDecl::ExternFn {
        name: emitted_name,
        abi_name: emitted_abi_name,
        def_id: emitted_def_id,
        type_params: emitted_type_params,
        params: emitted_params,
        return_type: emitted_return_type,
        effects: emitted_effects,
        is_pub: is_pub,
        span: emitted_span
    })
}

fn load_prelude(mut ctx: InferCtx) -> List<HDecl> {
    let mut prelude_hdecls: List<HDecl> = []
    match find_std_dir() {
        some(std_dir) => {
            // Phase 1: collect and register all prelude declarations
            let mut all_prelude_decls: List<Decl> = []
            for file in (STD_FILES) {
                let file_path = path_join(std_dir, file)
                if file_exists(file_path) {
                    let source = read_file(file_path)
                    let prelude_sink = new_collecting_sink()
                    let ast = parse(source, file_path, prelude_sink)
                    for decl in ast.decls {
                        let canonical_decl =
                            canonicalize_loaded_prelude_decl_firebreak(decl)
                        let registration_decl = canonical_decl
                        register_prelude_decl_public(ctx, registration_decl)
                        all_prelude_decls.push(canonical_decl)
                    }
                }
            }
            // Install the source-level API spelling as an alias of the exact
            // canonical scheme/DefId. record_value_origin makes ordinary
            // explicit calls use the same backend-safe canonical identity too.
            let map_get_name = map_index_helper_source_name()
            let map_get_identity = map_index_helper_identity()
            match ctx.env.lookup(map_get_identity) {
                some(scheme) => {
                    let bound_map_get_name = map_get_name
                    ctx.env.bind(bound_map_get_name, scheme)
                    record_value_origin(ctx, map_get_name, map_get_identity)
                },
                none => {}
            }
            // Phase 1 has finished, so duplicate std declarations now resolve
            // to their final exact DefIds. Give every top-level prelude extern
            // an unspellable semantic identity; later user fn/const bindings
            // receive distinct DefIds and cannot collide in backend registries.
            for decl in all_prelude_decls {
                match decl {
                    Decl::ExternFn { name, params, .. } => {
                        let exact_origin = prelude_extern_identity(name)
                        let source = exact_prelude_extern_source(name)
                        if source == CALLABLE_SOURCE_BUILTIN {
                            match ctx.env.lookup(name) {
                                some(scheme) => {
                                    let updated = update_local_callable_scheme(
                                        ctx.env, scheme,
                                        exact_prelude_extern_ownership(
                                            ctx.env, name, params),
                                        source)
                                    let exact_def_id = match updated.def_id {
                                        some(id) => id,
                                        none => panic("unreachable: exact prelude extern has no DefId")
                                    }
                                    if name == "ring_slot_dealloc" {
                                        let exact_type = updated.ty
                                        set_callable_transfer_levels(
                                            ctx.env.types.ownership_metadata,
                                            exact_def_id, source,
                                            callable_interface_transfer_levels(
                                                ctx.env.types.ownership_metadata,
                                                exact_type))
                                    }
                                    set_callable_result_role(
                                        ctx.env.types.ownership_metadata,
                                        exact_def_id,
                                        exact_prelude_extern_result_role(name))
                                    rebind_prelude_extern_firebreak(
                                        ctx, name, updated)
                                },
                                none => panic("unreachable: prelude extern registration is missing")
                            }
                        }
                        record_value_origin(ctx, name, exact_origin)
                    },
                    _ => {}
                }
            }
            // Phase 2: compile declarations needed by native codegen. Top-level
            // ExternFn declarations also become HDecl metadata: unlike impl
            // extern methods, their first-class values need an exact
            // declaration identity -> ABI leaf mapping in both backends.
            // Multiple pure-Ring collection files declare the same slot bridge;
            // phase 1 intentionally resolves those declarations to one final
            // DefId, so emit that exact HIR binder only once.
            let mut emitted_prelude_externs: Set<Int> = set_new()
            for decl in all_prelude_decls {
                match decl {
                    Decl::Struct { .. } => {
                        let result = some(check_prelude_decl(ctx, decl)) catch { _ => none }
                        match result {
                            some(hd) => {
                                append_prelude_hdecl_firebreak(
                                    prelude_hdecls, hd)
                            },
                            none => {}
                        }
                    },
                    Decl::Enum { .. } => {
                        let result = some(check_prelude_decl(ctx, decl)) catch { _ => none }
                        match result {
                            some(hd) => {
                                append_prelude_hdecl_firebreak(
                                    prelude_hdecls, hd)
                            },
                            none => {}
                        }
                    },
                    Decl::Trait { .. } => {
                        let result = some(check_prelude_decl(ctx, decl)) catch { _ => none }
                        match result {
                            some(hd) => {
                                append_prelude_hdecl_firebreak(
                                    prelude_hdecls, hd)
                            },
                            none => {}
                        }
                    },
                    Decl::Impl { target_type, type_params, trait_name, methods, span } => {
                        // Filter to only Fn methods — ExternFn methods are already handled
                        // by the runtime and cannot be looked up via check_extern_fn_decl
                        // because they're registered in impl_methods_map, not the main scope.
                        let mut fn_methods: List<Decl> = []
                        for m in methods {
                            match m {
                                Decl::Fn { .. } => {
                                    append_prelude_fn_method_firebreak(
                                        fn_methods, m)
                                },
                                _ => {}
                            }
                        }
                        if fn_methods.len() > 0 {
                            let filtered_decl =
                                filtered_prelude_impl_decl_firebreak(
                                    target_type, type_params, trait_name,
                                    fn_methods, span)
                            let result = some(check_prelude_decl(ctx, filtered_decl)) catch { _ => none }
                            match result {
                                some(hd) => {
                                    append_prelude_hdecl_firebreak(
                                        prelude_hdecls, hd)
                                },
                                none => {}
                            }
                        }
                    },
                    Decl::Fn { .. } => {
                        let result = some(check_prelude_decl(ctx, decl)) catch { _ => none }
                        match result {
                            some(hd) => {
                                append_prelude_hdecl_firebreak(
                                    prelude_hdecls, hd)
                            },
                            none => {}
                        }
                    },
                    Decl::ExternFn { .. } => {
                        let result = some(check_prelude_decl(ctx, decl)) catch { _ => none }
                        match result {
                            some(HDecl::ExternFn {
                                name, abi_name, def_id, type_params, params,
                                return_type, effects, is_pub, span
                            }) => {
                                let emit = match def_id {
                                    some(id) => {
                                        if emitted_prelude_externs.contains(id) {
                                            false
                                        } else {
                                            record_emitted_prelude_extern_firebreak(
                                                emitted_prelude_externs, id)
                                            true
                                        }
                                    },
                                    none => true
                                }
                                // A small number of compiler-owned extern
                                // bridges carry an unspellable exact origin on
                                // their DefId. Preserve it in HDecl while
                                // keeping the parsed ABI leaf separately.
                                let exact_name = match def_id {
                                    some(id) => match ctx.use_aliases.get(id) {
                                        some(origin) => origin,
                                        none => name
                                    },
                                    none => name
                                }
                                if emit {
                                    append_prelude_extern_hdecl_firebreak(
                                        prelude_hdecls, exact_name, abi_name,
                                        def_id, type_params, params,
                                        return_type, effects, is_pub, span)
                                }
                            },
                            some(_) => {},
                            none => {}
                        }
                    },
                    _ => {}
                }
            }
        },
        none => {},
    }
    prelude_hdecls
}

fn new_infer_ctx(sink: CollectingSink) -> InferCtx {
    let mut env = new_type_env()
    register_builtins(env, sink)
    register_hof_intrinsics(env, sink)

    let mut ctx = InferCtx {
        env: env,
        subst: empty_subst(),
        sink: sink,
        type_param_scope: map_new(),
        current_fn_return_type: none,
        current_fn_bounds: [],
        fn_bounds_stack: [],
        pending_dict_obligations: [],
        loop_depth: 0,
        mod_path_stack: [],
        use_aliases: map_new(),
        value_binding_kinds: map_new(),
        boxed_vars: set_new(),
        lambda_depth: 0,
        var_lambda_depth: map_new(),
        fn_mut_params: map_new(),
        file_extern_types: set_new(),
        effect_default_deps: map_new(),
        qualified_assoc_scope: map_new(),
        rebind_assoc_provenance: map_new(),
        impl_effect_precheck_active: false,
        impl_effect_precheck_blocked: false,
        discarded_fn_precheck_active: false,
        discarded_fn_precheck_blocked: false,
        impl_effect_precheck_undo: [],
        pre_solve_exact_value_alias_targets: map_new(),
        pending_inferred_const_def_ids: set_new(),
        pending_precheck_callable_def_ids: set_new(),
        pre_solve_const_getter_aliases: set_new(),
        pre_solve_callable_alias_targets: map_new(),
        pre_solve_callable_alias_arities: map_new(),
        pre_solve_callable_alias_contracts: map_new(),
        speculative_default_authority_def_ids: set_new(),
        fn_defaults: map_new(),
        fn_default_var_bounds: map_new(),
        fn_min_arity: map_new(),
        latest_value_instantiation_maps: map_new(),
        pending_fn_default_seed_values: map_new(),
        pending_fn_default_seed_var_bounds: map_new(),
        pending_fn_default_seed_min_arities: map_new(),
        default_template_live_schemes: map_new(),
        pending_fn_default_error_rebinds: set_new(),
        mod_unsafe_allowed: false,
        project_namespace_file_key: none,
        project_namespace_root_frame: none,
        project_namespace_child_frames: map_new(),
        project_namespace_bindings: map_new(),
        project_namespace_ctor_enums: map_new(),
        project_namespace_frame_stack: []
    }
    // These bindings are created only by register_builtins above. Record their
    // freshly allocated DefIds now; later same-spelled locals cannot inherit
    // this provenance. `some` remains on the independent variant-ctor path.
    for builtin in (CHECKER_ONLY_EXTERN_CALLABLES) {
        record_value_binding_kind(ctx, builtin, ValueBindingKind::ExternCallable)
    }
    ctx
}

// Collect ModuleImplFact entries from a module's own HIR (pre-prelude).
// Non-public inline mods are skipped: their impls were never exported by the
// AST-walking extractor either, so consumers cannot observe those methods.
fn append_module_impl_method_name_firebreak(
    mut method_names: List<Str>, name: Str
) {
    let current_name = name
    method_names.push(current_name)
}

fn module_impl_target_result_firebreak(target_type: Str) -> Str {
    let current_target = target_type
    current_target
}

fn collect_module_impl_facts(
    decls: List<HDecl>, is_top_level: Bool, mut facts: List<ModuleImplFact>
) {
    for decl in decls {
        match decl {
            HDecl::Impl { target_type, trait_name, methods, .. } => {
                let mut method_names: List<Str> = []
                for m in methods {
                    match m {
                        HDecl::Fn { name, .. } =>
                            append_module_impl_method_name_firebreak(
                                method_names, name),
                        _ => {}
                    }
                }
                facts.push(ModuleImplFact {
                    target: module_impl_target_result_firebreak(target_type),
                    is_trait_impl: trait_name.is_some(),
                    method_names: method_names,
                    is_top_level: is_top_level
                })
            },
            HDecl::ModBlock { decls: mod_decls, is_pub, .. } => {
                if is_pub {
                    collect_module_impl_facts(mod_decls, false, facts)
                }
            },
            _ => {}
        }
    }
}

fn checker_sink_result_firebreak(sink: CollectingSink) -> CollectingSink {
    let current_sink = sink
    current_sink
}

fn append_checked_program_decl_firebreak(
    mut decls: List<HDecl>, decl: HDecl
) {
    let current_decl = decl
    decls.push(current_decl)
}

pub fn check(program: Program, sink: CollectingSink) -> CheckResult {
    let mut ctx = new_infer_ctx(checker_sink_result_firebreak(sink))
    let prelude_hdecls = load_prelude(ctx)
    let hprogram = infer_check(ctx, program)
    let mut impl_facts: List<ModuleImplFact> = []
    collect_module_impl_facts(hprogram.decls, true, impl_facts)
    // Prepend prelude hdecls to the program's decls
    let mut all_decls = list_clone(prelude_hdecls)
    for d in hprogram.decls {
        append_checked_program_decl_firebreak(all_decls, d)
    }
    // B-104 D7: lower `&&`/`||` to if-else (andor_lower), then B-104 D4:
    // first-class the dict evidence (static singleton set + local
    // constructions for dynamic wrapped dicts) — both before perceus/codegen.
    let assembled = HProgram { decls: all_decls, derived_impls: hprogram.derived_impls, boxed_vars: hprogram.boxed_vars, static_dicts: [], extern_type_names: hprogram.extern_type_names, ownership_metadata: hprogram.ownership_metadata }
    // Do not let ownership fail-loud invariants replace an earlier frontend
    // diagnostic.  The caller discards this program whenever the collecting
    // sink contains an error, so preserving the assembled HIR is sufficient
    // on that path.  Programs with no prior errors still pass through the
    // complete ownership and dictionary-lowering pipeline.
    let checked_program = if ctx.sink.has_errors() {
        assembled
    } else {
        let ownership_planned = solve_and_plan_ownership(
            ctx.env, lower_andor(assembled), ctx.sink,
            map_clone(ctx.value_binding_kinds),
            set_clone(ctx.pre_solve_const_getter_aliases),
            map_clone(ctx.pre_solve_callable_alias_targets),
            map_clone(ctx.pre_solve_callable_alias_arities),
            map_clone(ctx.pre_solve_callable_alias_contracts))
        lower_dicts(ownership_planned)
    }
    CheckResult {
        program: checked_program,
        env: ctx.env,
        fn_mut_params: ctx.fn_mut_params,
        value_origins: map_clone(ctx.use_aliases),
        value_binding_kinds: map_clone(ctx.value_binding_kinds),
        impl_facts: impl_facts
    }
}

struct NamespaceFrameAst {
    uses: List<UseDecl>,
    decls: List<Decl>
}

fn namespace_decl_span_result_firebreak(span: Span) -> Span {
    let exact_span = span
    exact_span
}

fn namespace_frame_plan_result_firebreak(
    frame: ModuleFramePlan
) -> ModuleFramePlan? {
    let exact_frame = frame
    some(exact_frame)
}

fn namespace_frame_ast_result_firebreak(
    uses: List<UseDecl>, decls: List<Decl>
) -> NamespaceFrameAst {
    let exact_uses = uses
    let exact_decls = decls
    NamespaceFrameAst { uses: exact_uses, decls: exact_decls }
}

fn namespace_kind_name(namespace: NamespaceKind) -> Str {
    match namespace {
        NamespaceKind::Value => "value",
        NamespaceKind::Struct => "struct",
        NamespaceKind::Enum => "enum",
        NamespaceKind::TypeAlias => "type alias",
        NamespaceKind::Effect => "effect",
        NamespaceKind::EffectAlias => "effect alias",
        NamespaceKind::Trait => "trait",
        NamespaceKind::Sig => "sig"
    }
}

fn namespace_decl_span(decl: Decl) -> Span {
    match decl {
        Decl::Fn { span, .. } => namespace_decl_span_result_firebreak(span),
        Decl::Struct { span, .. } => namespace_decl_span_result_firebreak(span),
        Decl::Enum { span, .. } => namespace_decl_span_result_firebreak(span),
        Decl::Impl { span, .. } => namespace_decl_span_result_firebreak(span),
        Decl::Effect { span, .. } => namespace_decl_span_result_firebreak(span),
        Decl::Test { span, .. } => namespace_decl_span_result_firebreak(span),
        Decl::Trait { span, .. } => namespace_decl_span_result_firebreak(span),
        Decl::ExternFn { span, .. } => namespace_decl_span_result_firebreak(span),
        Decl::ExternType { span, .. } => namespace_decl_span_result_firebreak(span),
        Decl::TypeAlias { span, .. } => namespace_decl_span_result_firebreak(span),
        Decl::Const { span, .. } => namespace_decl_span_result_firebreak(span),
        Decl::ModBlock { span, .. } => namespace_decl_span_result_firebreak(span),
        Decl::Sig { span, .. } => namespace_decl_span_result_firebreak(span),
        Decl::EffectAlias { span, .. } => namespace_decl_span_result_firebreak(span),
        Decl::Delegate { span, .. } => namespace_decl_span_result_firebreak(span),
        Decl::AssocType { span, .. } => namespace_decl_span_result_firebreak(span)
    }
}

fn find_namespace_frame(
    plan: ResolvedNamespacePlan, file_key: Str, frame_index: Int
) -> ModuleFramePlan? {
    for frame in plan.frames {
        if frame.file_key == file_key && frame.frame_index == frame_index {
            return namespace_frame_plan_result_firebreak(frame)
        }
    }
    none
}

// Recover an inline frame through its exact parent frame and declaration
// index. Duplicate same-named ModBlocks therefore remain distinct AST sites.
fn find_namespace_frame_ast(
    program: Program, plan: ResolvedNamespacePlan,
    file_key: Str, frame_index: Int
) -> NamespaceFrameAst? {
    match find_namespace_frame(plan, file_key, frame_index) {
        none => none,
        some(frame) => {
            if frame.parent_frame_index < 0 {
                return some(NamespaceFrameAst {
                    uses: program.uses,
                    decls: program.decls
                })
            }
            match find_namespace_frame_ast(
                program, plan, file_key, frame.parent_frame_index) {
                none => none,
                some(parent) => match parent.decls.get(frame.decl_index) {
                    some(Decl::ModBlock { uses, decls, .. }) =>
                        some(namespace_frame_ast_result_firebreak(uses, decls)),
                    _ => none
                }
            }
        }
    }
}

fn namespace_issue_span(
    program: Program, plan: ResolvedNamespacePlan, site: AstSite
) -> Span {
    match find_namespace_frame_ast(
        program, plan, site.file_key, site.frame_index) {
        none => program.span,
        some(frame) => {
            if site.use_index >= 0 {
                match frame.uses.get(site.use_index) {
                    none => return program.span,
                    some(use_decl) => {
                        if site.item_index >= 0 {
                            match use_decl.imports {
                                UseImport::NamedItems { names } => {
                                    match names.get(site.item_index) {
                                        some(item) => return item.span,
                                        none => {}
                                    }
                                },
                                UseImport::Module => {}
                            }
                        }
                        return use_decl.path.span
                    }
                }
            }
            if site.use_index == -1 && site.item_index >= 0 {
                match frame.decls.get(site.item_index) {
                    some(decl) => return namespace_decl_span(decl),
                    none => {}
                }
            }
            program.span
        }
    }
}

fn report_namespace_plan_issues(
    mut ctx: InferCtx, module_key: Str,
    program: Program, plan: ResolvedNamespacePlan
) {
    for issue in plan.issues {
        if issue.site.file_key != module_key { continue }
        let span = namespace_issue_span(program, plan, issue.site)
        let namespace = namespace_kind_name(issue.namespace)
        let source_owner = nominal_display_name(issue.source_owner)
        match issue.kind {
            ImportIssueKind::RelativeOutOfScope => {
                let message = if issue.site.frame_index == 0 {
                    "Cannot use '${issue.source_name}::' at file level — relative paths are only supported inside mod blocks"
                } else {
                    "Cannot use 'super::' — relative path exceeds module nesting depth"
                }
                ctx.sink.report(make_diag(
                    E0705, Severity::SevError, message, span,
                    DiagnosticContext::OtherContext {
                        detail: some("relative path out of scope")
                    }))
            },
            ImportIssueKind::SourceFrameMissing => {
                ctx.sink.report(make_diag(
                    E0702, Severity::SevError,
                    "Module '${source_owner}' not found", span,
                    DiagnosticContext::OtherContext {
                        detail: some("source namespace frame not found")
                    }))
            },
            ImportIssueKind::SourceNameMissing => {
                let message = if issue.source_name == "" {
                    "Import from module '${source_owner}' does not name a symbol"
                } else {
                    "Symbol '${issue.source_name}' not found in module '${source_owner}'"
                }
                ctx.sink.report(make_diag(
                    E0703, Severity::SevError, message, span,
                    DiagnosticContext::OtherContext {
                        detail: some("source name not found")
                    }))
            },
            ImportIssueKind::AmbiguousBinding => {
                let mut related: List<Str> = []
                for payload in issue.related_owners {
                    related.push(nominal_display_name(payload))
                }
                let conflict = if related.len() == 2 {
                    "'${related.get(0).unwrap_or("")}' and '${related.get(1).unwrap_or("")}'"
                } else {
                    related.join(", ")
                }
                ctx.sink.report(make_diag(
                    E0707, Severity::SevError,
                    "Ambiguous ${namespace} name '${issue.local_name}': conflicting payloads ${conflict}",
                    span,
                    DiagnosticContext::OtherContext {
                        detail: some("ambiguous ${namespace} binding")
                    }))
            },
            ImportIssueKind::UnresolvedImportCycle => {
                let subject = if issue.local_name == "" {
                    ""
                } else {
                    " for '${issue.local_name}'"
                }
                ctx.sink.report(make_diag(
                    E0704, Severity::SevError,
                    "Unresolved ${namespace} import dependency SCC${subject} in module '${source_owner}'",
                    span,
                    DiagnosticContext::OtherContext {
                        detail: some("namespace import dependency SCC")
                    }))
            }
        }
    }
}

pub fn check_module(
    program: Program, module_key: Str, module_prefix: Str,
    namespace_plan: ResolvedNamespacePlan,
    module_exports: List<ModuleExports>, sink: CollectingSink
) -> CheckResult {
    let mut ctx = new_infer_ctx(checker_sink_result_firebreak(sink))
    let prelude_hdecls = load_prelude(ctx)
    inject_module_exports(ctx, module_exports)
    let _ = install_project_namespace_plan(ctx, module_key, namespace_plan)
    report_namespace_plan_issues(ctx, module_key, program, namespace_plan)
    let hprogram = check_module_identity(ctx, program, module_prefix)
    let mut impl_facts: List<ModuleImplFact> = []
    collect_module_impl_facts(hprogram.decls, true, impl_facts)
    // Prepend prelude hdecls to the program's decls
    let mut all_decls = list_clone(prelude_hdecls)
    for d in hprogram.decls {
        append_checked_program_decl_firebreak(all_decls, d)
    }
    // B-104 D7 + D4: see check() above.
    let assembled = HProgram { decls: all_decls, derived_impls: hprogram.derived_impls, boxed_vars: hprogram.boxed_vars, static_dicts: [], extern_type_names: hprogram.extern_type_names, ownership_metadata: hprogram.ownership_metadata }
    // As in check(), retain the original diagnostics as the authority.  A
    // malformed module must not cross into ownership planning and panic before
    // compile_phases can surface the diagnostic already present in the sink.
    let checked_program = if ctx.sink.has_errors() {
        assembled
    } else {
        let ownership_planned = solve_and_plan_ownership(
            ctx.env, lower_andor(assembled), ctx.sink,
            map_clone(ctx.value_binding_kinds),
            set_clone(ctx.pre_solve_const_getter_aliases),
            map_clone(ctx.pre_solve_callable_alias_targets),
            map_clone(ctx.pre_solve_callable_alias_arities),
            map_clone(ctx.pre_solve_callable_alias_contracts))
        lower_dicts(ownership_planned)
    }
    CheckResult {
        program: checked_program,
        env: ctx.env,
        fn_mut_params: ctx.fn_mut_params,
        value_origins: map_clone(ctx.use_aliases),
        value_binding_kinds: map_clone(ctx.value_binding_kinds),
        impl_facts: impl_facts
    }
}

fn report_hydrated_method_collision(
    mut ctx: InferCtx, target_type: Str, method_name: Str, span: Span
) {
    let _ = type_error(ctx.sink, E0504,
        "Ambiguous method '${method_name}' on '${nominal_display_name(target_type)}': dependency exports contain distinct implementation origins",
        span, DiagnosticContext::TraitError {
            detail: "same-origin re-exports dedupe, distinct origins collide"
    })
}
fn localize_imported_value_scheme(
    mut ctx: InferCtx, exports: ModuleExports, scheme: TypeScheme
) -> TypeScheme {
    let alias_scheme = TypeScheme { ..scheme, def_id: none }
    let exported_def_id = match scheme.def_id {
        some(def_id) => def_id,
        none => match scheme.ty {
            Type::FnType { .. } => panic(
                "unreachable: imported callable value has no exact DefId"),
            _ => return alias_scheme
        }
    }
    match exports.ownership_metadata.callable_by_def_id.get(
            exported_def_id) {
        some(ownership_term) => {
            let imported_state = match exports.ownership_metadata
                    .callable_state_by_def_id.get(exported_def_id) {
                some(state) => state,
                none => panic(
                    "unreachable: imported callable value has no ownership state")
            }
            let localized = new_local_callable_identity_scheme_with_transfer_levels(
                ctx.env, alias_scheme, ownership_term,
                imported_state.source,
                clone_callable_transfer_levels(
                    imported_state.transfer_levels))
            let local_def_id = match localized.def_id {
                some(id) => id,
                none => panic(
                    "unreachable: localized imported callable has no DefId")
            }
            let direct_role = match exports.ownership_metadata
                    .callable_result_role_by_def_id.get(exported_def_id) {
                some(role) => role,
                none => panic(
                    "unreachable: imported callable has no direct result role")
            }
            let returned_role = match exports.ownership_metadata
                    .returned_callable_result_role_by_def_id.get(
                        exported_def_id) {
                some(role) => role,
                none => panic(
                    "unreachable: imported callable has no returned result role")
            }
            let direct_role_local_def_id = local_def_id
            let returned_role_local_def_id = local_def_id
            set_callable_result_role(ctx.env.types.ownership_metadata,
                direct_role_local_def_id, direct_role)
            set_returned_callable_result_role(
                ctx.env.types.ownership_metadata, returned_role_local_def_id,
                returned_role)
            let imported_role_spine = match exports.ownership_metadata
                    .callable_result_role_spine_by_def_id.get(exported_def_id) {
                some(spine) => list_clone(spine),
                none => panic(
                    "unreachable: imported callable has no result role spine")
            }
            set_callable_result_role_spine(
                ctx.env.types.ownership_metadata, local_def_id,
                imported_role_spine)
            localized
        },
        none => match scheme.ty {
            Type::FnType { .. } => panic(
                "unreachable: imported callable value has no ownership contract"),
            _ => alias_scheme
        }
    }
}

fn imported_int_lists_equal(a: List<Int>, b: List<Int>) -> Bool {
    if a.len() != b.len() { return false }
    let mut index = 0
    while index < a.len() {
        if a.get(index) != b.get(index) { return false }
        index = index + 1
    }
    true
}

fn imported_optional_int_lists_equal(
    a: List<Int>?, b: List<Int>?
) -> Bool {
    if a.is_some() != b.is_some() { return false }
    if !a.is_some() { return true }
    let left = a.unwrap()
    let right = b.unwrap()
    imported_int_lists_equal(left, right)
}

fn imported_scheme_bounds_equal(
    metadata: OwnershipMetadata,
    a: List<SchemeBound>, b: List<SchemeBound>
) -> Bool {
    if a.len() != b.len() { return false }
    let mut index = 0
    while index < a.len() {
        match (a.get(index), b.get(index)) {
            (some(left), some(right)) => {
                if left.type_var != right.type_var ||
                   left.trait_name != right.trait_name ||
                   left.assoc_constraints.len() !=
                       right.assoc_constraints.len() {
                    return false
                }
                let mut assoc_index = 0
                while assoc_index < left.assoc_constraints.len() {
                    match (left.assoc_constraints.get(assoc_index),
                           right.assoc_constraints.get(assoc_index)) {
                        (some(lc), some(rc)) => {
                            if lc.name != rc.name ||
                               !types_equal_with_ownership(
                                   metadata, lc.ty, rc.ty) {
                                return false
                            }
                        },
                        _ => return false
                    }
                    assoc_index = assoc_index + 1
                }
            },
            _ => return false
        }
        index = index + 1
    }
    true
}

// Foreign DefIds are localized, so they are deliberately excluded. Every
// other part of the frozen scheme is identity-bearing and must agree for two
// facades that claim the same canonical origin.
fn imported_schemes_equal(
    local_metadata: OwnershipMetadata,
    incoming_metadata: OwnershipMetadata,
    a: TypeScheme, b: TypeScheme
) -> Bool {
    let roles_equal = match (a.def_id, b.def_id) {
        (some(local_id), some(incoming_id)) => {
            let incoming_is_callable = incoming_metadata.callable_by_def_id
                .contains_key(incoming_id)
            if incoming_is_callable {
                let transfer_equal = match (
                    local_metadata.callable_state_by_def_id.get(local_id),
                    incoming_metadata.callable_state_by_def_id.get(
                        incoming_id)) {
                    (some(local_state), some(incoming_state)) =>
                        callable_transfer_levels_equal(
                            local_state.transfer_levels,
                            incoming_state.transfer_levels),
                    _ => false
                }
                local_metadata.callable_by_def_id.contains_key(local_id) &&
                    local_metadata.callable_result_role_by_def_id.get(
                        local_id) == incoming_metadata
                        .callable_result_role_by_def_id.get(incoming_id) &&
                    local_metadata.returned_callable_result_role_by_def_id.get(
                        local_id) == incoming_metadata
                        .returned_callable_result_role_by_def_id.get(
                            incoming_id) &&
                    imported_optional_int_lists_equal(
                        local_metadata.callable_result_role_spine_by_def_id.get(
                            local_id),
                        incoming_metadata.callable_result_role_spine_by_def_id.get(
                            incoming_id)) && transfer_equal
            } else {
                true
            }
        },
        _ => true
    }
    types_equal_with_ownership(local_metadata, a.ty, b.ty) &&
        imported_int_lists_equal(a.type_vars, b.type_vars) &&
        imported_scheme_bounds_equal(local_metadata, a.bounds, b.bounds) &&
        roles_equal
}

fn freeze_imported_module_exports_firebreak(
    incoming: ModuleExports
) -> ModuleExports {
    let exact_exports = incoming
    freeze_module_exports_ownership(exact_exports)
}

fn insert_localized_impl_method_scheme_firebreak(
    mut methods: Map<Str, TypeScheme>,
    method_name: Str, scheme: TypeScheme
) {
    let stored_method_name = method_name
    let stored_scheme = scheme
    methods.insert(stored_method_name, stored_scheme)
}

fn insert_localized_impl_target_methods_firebreak(
    mut methods_by_target: Map<Str, Map<Str, TypeScheme>>,
    target_type: Str, methods: Map<Str, TypeScheme>
) {
    let stored_target_type = target_type
    let stored_methods = methods
    methods_by_target.insert(stored_target_type, stored_methods)
}

fn append_imported_value_origin_firebreak(
    mut origins: List<Str>, origin: Str
) {
    let exact_origin = origin
    origins.push(exact_origin)
}

fn append_imported_ctor_origin_if_missing_firebreak(
    mut origins: List<Str>, origin: Str
) {
    let compared_origin = origin
    if !origins.contains(compared_origin) {
        let stored_origin = origin
        origins.push(stored_origin)
    }
}

fn record_imported_binding_kind_firebreak(
    mut ctx: InferCtx, name: Str, kind: ValueBindingKind
) {
    let exact_name = name
    let exact_kind = kind
    record_value_binding_kind(ctx, exact_name, exact_kind)
}

fn record_imported_ctor_origin_firebreak(
    mut ctx: InferCtx, name: Str, origin: Str
) {
    let exact_name = name
    let exact_origin = origin
    record_variant_ctor_origin(ctx, exact_name, exact_origin)
}

fn store_imported_fn_mut_params_firebreak(
    mut fn_mut_params: Map<Str, List<Bool>>,
    fn_name: Str, flags: List<Bool>
) {
    let stored_fn_name = fn_name
    let stored_flags = flags
    fn_mut_params.insert(stored_fn_name, stored_flags)
}

fn insert_localized_sig_member_scheme_firebreak(
    mut members: Map<Str, TypeScheme>,
    member_name: Str, scheme: TypeScheme
) {
    let stored_member_name = member_name
    let stored_scheme = scheme
    members.insert(stored_member_name, stored_scheme)
}

fn insert_localized_trait_impl_method_scheme_firebreak(
    mut methods: Map<Str, TypeScheme>,
    method_name: Str, scheme: TypeScheme
) {
    let stored_method_name = method_name
    let stored_scheme = scheme
    methods.insert(stored_method_name, stored_scheme)
}

fn insert_imported_mut_method_name_firebreak(
    mut methods: Set<Str>, method_name: Str
) {
    let stored_method_name = method_name
    methods.insert(stored_method_name)
}

fn insert_imported_mut_method_set_firebreak(
    mut registry: Map<Str, Set<Str>>,
    type_name: Str, methods: Set<Str>
) {
    let stored_type_name = type_name
    let stored_methods = methods
    registry.insert(stored_type_name, stored_methods)
}

fn inject_module_exports(mut ctx: InferCtx, exports: List<ModuleExports>) {
    // Canonical value payloads are the only source keys consumed by the
    // resolver plan. Export display keys are intentionally not hydrated:
    // same-leaf exports from unrelated modules may coexist, while each exact
    // value/constructor origin is installed once with a checker-local DefId.
    let mut hydrated_value_origins: Set<Str> = set_new()
    let mut hydrated_method_schemes: Map<Str, TypeScheme> = map_new()
    let mut hydrated_trait_methods: Map<Str, TraitMethodDef> = map_new()
    let mut hydrated_trait_def_ids: Map<Str, Int> = map_new()
    let mut hydrated_sig_schemes: Map<Str, TypeScheme> = map_new()
    for incoming in exports {
        // Imported module interfaces must already be exact. Re-freezing here
        // catches malformed/missing dynamic descriptors before any payload is
        // merged into checker-local registries.
        let mod_ = freeze_imported_module_exports_firebreak(incoming)
        // Ownership summaries do not participate in order-sensitive lookup;
        // avoid sorting an empty shadow map for every project module.
        for entry in mod_.ownership_metadata.ownership_shapes.entries() {
            let (type_identity, shape) = entry
            let imported_type_identity = type_identity
            let imported_shape = shape
            merge_ownership_shape(
                ctx.env.types.ownership_metadata,
                imported_type_identity, imported_shape)
        }
        for entry in mod_.ownership_metadata.callable_descriptors.entries() {
            let (ownership_id, descriptor) = entry
            let imported_ownership_id = ownership_id
            let imported_descriptor = descriptor
            merge_callable_ownership_descriptor(
                ctx.env.types.ownership_metadata,
                imported_ownership_id, imported_descriptor)
        }
        let mut localized_impl_methods: Map<Str, Map<Str, TypeScheme>> = map_new()
        let mut method_targets = mod_.impl_methods.entries()
        method_targets.sort_by(compare_by_first)
        for target_entry in method_targets {
            let (target_type, methods) = target_entry
            let origins = mod_.method_origins.get(target_type)
            let mut localized_methods: Map<Str, TypeScheme> = map_new()
            let mut method_entries = methods.entries()
            method_entries.sort_by(compare_by_first)
            for method_entry in method_entries {
                let (method_name, scheme) = method_entry
                match origins {
                    some(origin_map) => match origin_map.get(method_name) {
                        some(method_origin_) => {
                            let key = impl_method_origin(
                                method_origin_.origin, method_name)
                            let local_scheme = match hydrated_method_schemes.get(key) {
                                some(existing) => {
                                    if !imported_schemes_equal(
                                            ctx.env.types.ownership_metadata,
                                            mod_.ownership_metadata,
                                            existing, scheme) {
                                        panic("unreachable: same-origin imported method scheme differs")
                                    }
                                    existing
                                },
                                none => {
                                    let localized = localize_imported_value_scheme(
                                        ctx, mod_, scheme)
                                    let stored_localized = localized
                                    hydrated_method_schemes.insert(
                                        key, stored_localized)
                                    localized
                                }
                            }
                            insert_localized_impl_method_scheme_firebreak(
                                localized_methods, method_name, local_scheme)
                        },
                        none => report_hydrated_method_collision(
                            ctx, target_type, method_name, span_zero())
                    },
                    none => report_hydrated_method_collision(
                        ctx, target_type, method_name, span_zero())
                }
            }
            insert_localized_impl_target_methods_firebreak(
                localized_impl_methods, target_type, localized_methods)
        }
        let mut sorted_values = mod_.values.entries()
        sorted_values.sort_by(compare_by_first)
        for entry in sorted_values {
            let (lookup_name, scheme) = entry
            let value_origin = mod_.value_origins.get(lookup_name)
            let ctor_origin = mod_.variant_ctor_origins.get(lookup_name)
            let mut exact_origins: List<Str> = []
            match value_origin {
                some(origin) => {
                    append_imported_value_origin_firebreak(
                        exact_origins, origin)
                },
                none => {}
            }
            match ctor_origin {
                some(origin) => {
                    append_imported_ctor_origin_if_missing_firebreak(
                        exact_origins, origin)
                },
                none => {}
            }
            for origin in exact_origins {
                if hydrated_value_origins.contains(origin) {
                    // A canonical origin may arrive through multiple facade
                    // modules.  Reuse its first checker-local DefId, but fail
                    // loudly if a later facade publishes a different callable
                    // contract for that same origin.
                    match ctx.env.lookup(origin) {
                        some(local) => {
                            if !imported_schemes_equal(
                                    ctx.env.types.ownership_metadata,
                                    mod_.ownership_metadata,
                                    local, scheme) {
                                panic("unreachable: same-origin imported value scheme differs")
                            }
                        },
                        none => panic(
                            "unreachable: hydrated imported value is missing")
                    }
                } else {
                    let local_scheme = localize_imported_value_scheme(
                        ctx, mod_, scheme)
                    let bound_origin = origin
                    ctx.env.bind(bound_origin, local_scheme)
                    let ultimate = match value_origin {
                        some(value) => value,
                        none => origin
                    }
                    let value_origin_name = origin
                    record_value_origin(ctx, value_origin_name, ultimate)
                    match mod_.value_binding_kinds.get(lookup_name) {
                        some(kind) => {
                            let binding_kind_name = origin
                            record_imported_binding_kind_firebreak(
                                ctx, binding_kind_name, kind)
                        },
                        none => {}
                    }
                    match ctor_origin {
                        some(ctor) => {
                            let ctor_origin_name = origin
                            record_imported_ctor_origin_firebreak(
                                ctx, ctor_origin_name, ctor)
                        },
                        none => {}
                    }
                    match mod_.fn_mut_params.get(lookup_name) {
                        some(flags) => {
                            let fn_mut_name = origin
                            store_imported_fn_mut_params_firebreak(
                                ctx.fn_mut_params, fn_mut_name, flags)
                        },
                        none => {}
                    }
                    let hydrated_origin = origin
                    hydrated_value_origins.insert(hydrated_origin)
                }
            }
        }
        let mut sorted_types = mod_.types.entries()
        sorted_types.sort_by(compare_by_first)
        for entry in sorted_types {
            let (name, def) = entry
            match def {
                TypeDef::StructDef_(sdef) => {
                    if sdef.is_extern {
                        // Dependency hydration exposes only the raw ABI source.
                        // Named/wildcard imports install visible spellings via
                        // the project namespace frame; infer_decl snapshots
                        // their raw codegen identities before frame rollback.
                        let stored_extern_struct_def = sdef
                        ctx.env.types.extern_structs.insert(
                            stored_extern_struct_def.name,
                            stored_extern_struct_def)
                    } else {
                        let stored_struct_def = sdef
                        ctx.env.types.structs.insert(
                            stored_struct_def.name, stored_struct_def)
                    }
                },
                TypeDef::EnumDef_(edef) => {
                    let stored_enum_def = edef
                    ctx.env.types.enums.insert(
                        stored_enum_def.name, stored_enum_def)
                },
            }
        }
        let mut sorted_type_aliases = mod_.type_aliases.entries()
        sorted_type_aliases.sort_by(compare_by_first)
        for entry in sorted_type_aliases {
            let (_, adef) = entry
            let stored_type_alias_def = adef
            ctx.env.types.type_aliases.insert(
                stored_type_alias_def.name, stored_type_alias_def)
        }
        let mut sorted_effects = mod_.effects.entries()
        sorted_effects.sort_by(compare_by_first)
        for entry in sorted_effects {
            let (name, effdef) = entry
            let stored_effect_def = effdef
            ctx.env.types.effects.insert(
                stored_effect_def.name, stored_effect_def)
        }
        let mut sorted_aliases = mod_.effect_aliases.entries()
        sorted_aliases.sort_by(compare_by_first)
        for entry in sorted_aliases {
            let (name, adef) = entry
            let stored_effect_alias_def = adef
            ctx.env.types.effect_aliases.insert(
                stored_effect_alias_def.name, stored_effect_alias_def)
        }
        let mut sorted_traits = mod_.traits.entries()
        sorted_traits.sort_by(compare_by_first)
        for entry in sorted_traits {
            let (_, tdef) = entry
            let local_trait_def_id = match hydrated_trait_def_ids.get(tdef.name) {
                some(existing) => existing,
                none => {
                    let fresh = ctx.env.fresh_def_id()
                    let stored_trait_def_id = fresh
                    hydrated_trait_def_ids.insert(
                        tdef.name, stored_trait_def_id)
                    let local_trait_def_id = fresh
                    local_trait_def_id
                }
            }
            let mut local_methods: List<TraitMethodDef> = []
            for method in tdef.methods {
                let key = "${tdef.name}::${method.name}"
                let local_method = match hydrated_trait_methods.get(key) {
                    some(existing) => {
                        if !types_equal_with_ownership(
                                ctx.env.types.ownership_metadata,
                                existing.ty, method.ty) {
                            panic("unreachable: same imported trait method type differs")
                        }
                        existing
                    },
                    none => {
                        let scheme = localize_imported_value_scheme(
                            ctx, mod_, TypeScheme {
                                ty: method.ty, type_vars: [], bounds: [],
                                def_id: some(method.def_id)
                            })
                        let def_id = match scheme.def_id {
                            some(id) => id,
                            none => panic("unreachable: imported trait method has no local DefId")
                        }
                        let localized = TraitMethodDef {
                            ..method, def_id: def_id, ty: scheme.ty
                        }
                        let stored_localized = localized
                        hydrated_trait_methods.insert(key, stored_localized)
                        localized
                    }
                }
                local_methods.push(local_method)
            }
            ctx.env.trait_reg.traits.insert(tdef.name, TraitDef {
                ..tdef, def_id: local_trait_def_id, methods: local_methods
            })
        }
        let mut sorted_sigs = mod_.sigs.entries()
        sorted_sigs.sort_by(compare_by_first)
        for entry in sorted_sigs {
            let (_, sigdef) = entry
            // Resolver bindings consume canonical payload identities. Display
            // and leaf aliases are transactional namespace-frame overlays.
            let mut local_members: Map<Str, TypeScheme> = map_new()
            let mut member_entries = sigdef.members.entries()
            member_entries.sort_by(compare_by_first)
            for member_entry in member_entries {
                let (member_name, scheme) = member_entry
                let key = "${sigdef.name}::${member_name}"
                let local_scheme = match hydrated_sig_schemes.get(key) {
                    some(existing) => {
                        if !imported_schemes_equal(
                                ctx.env.types.ownership_metadata,
                                mod_.ownership_metadata,
                                existing, scheme) {
                            panic("unreachable: same imported sig member scheme differs")
                        }
                        existing
                    },
                    none => {
                        let localized = localize_imported_value_scheme(
                            ctx, mod_, scheme)
                        let stored_localized = localized
                        hydrated_sig_schemes.insert(key, stored_localized)
                        localized
                    }
                }
                insert_localized_sig_member_scheme_firebreak(
                    local_members, member_name, local_scheme)
            }
            ctx.env.types.sigs.insert(sigdef.name, SigDef {
                ..sigdef, members: local_members
            })
        }
        for impl_ in mod_.trait_impls {
            let mut local_method_schemes: Map<Str, TypeScheme> = map_new()
            let mut exported_method_entries = impl_.method_schemes.entries()
            exported_method_entries.sort_by(compare_by_first)
            for method_entry in exported_method_entries {
                let (method_name, exported_scheme) = method_entry
                let key = impl_method_origin(impl_.origin, method_name)
                let localized = match hydrated_method_schemes.get(key) {
                    some(existing) => {
                        if !imported_schemes_equal(
                                ctx.env.types.ownership_metadata,
                                mod_.ownership_metadata,
                                existing, exported_scheme) {
                            panic("unreachable: same-origin imported impl method scheme differs")
                        }
                        existing
                    },
                    none => {
                        let scheme = localize_imported_value_scheme(
                            ctx, mod_, exported_scheme)
                        let stored_scheme = scheme
                        hydrated_method_schemes.insert(key, stored_scheme)
                        scheme
                    }
                }
                insert_localized_trait_impl_method_scheme_firebreak(
                    local_method_schemes, method_name, localized)
            }
            let local_impl = ImplEntry {
                ..impl_, method_schemes: local_method_schemes
            }
            match find_impl(
                ctx.env.trait_reg,
                local_impl.target_type_name,
                local_impl.trait_name) {
                some(existing) => {
                    if existing.origin != local_impl.origin {
                        let _ = type_error(ctx.sink, E0504,
                            "Duplicate impl '${nominal_display_name(local_impl.trait_name)}' for '${nominal_display_name(local_impl.target_type_name)}' from distinct dependency origins",
                            local_impl.span, DiagnosticContext::TraitError {
                                detail: "duplicate imported target/trait implementation"
                            })
                    }
                },
                none => {}
            }
            add_impl(ctx.env.trait_reg, local_impl)
        }
        let mut sorted_impl_methods = localized_impl_methods.entries()
        sorted_impl_methods.sort_by(compare_by_first)
        for entry in sorted_impl_methods {
            let (type_name, methods) = entry
            let exported_origins = mod_.method_origins.get(type_name)
            let mut sorted_meths = methods.entries()
            sorted_meths.sort_by(compare_by_first)
            for mentry in sorted_meths {
                let (method_name, scheme) = mentry
                match exported_origins {
                    some(origins) => match origins.get(method_name) {
                        some(origin) => {
                            let _ = install_method_scheme(
                                ctx.env.trait_reg, ctx.sink,
                                type_name, method_name, scheme, origin)
                        },
                        none => {
                            report_hydrated_method_collision(
                                ctx, type_name, method_name, span_zero())
                        }
                    },
                    none => {
                        report_hydrated_method_collision(
                            ctx, type_name, method_name, span_zero())
                    }
                }
            }
        }
        // Inject mut_methods
        let mut sorted_mut = mod_.mut_methods.entries()
        sorted_mut.sort_by(compare_by_first)
        for entry in sorted_mut {
            let (type_name, method_set) = entry
            match ctx.env.trait_reg.mut_methods.get(type_name) {
                some(existing) => {
                    for m in method_set.to_list() {
                        insert_imported_mut_method_name_firebreak(existing, m)
                    }
                },
                none => {
                    let mut new_set: Set<Str> = set_new()
                    for m in method_set.to_list() {
                        insert_imported_mut_method_name_firebreak(new_set, m)
                    }
                    insert_imported_mut_method_set_firebreak(
                        ctx.env.trait_reg.mut_methods, type_name, new_set)
                },
            }
        }
        // Inject fn_mut_params
        let mut sorted_fmp = mod_.fn_mut_params.entries()
        sorted_fmp.sort_by(compare_by_first)
        for entry in sorted_fmp {
            let (fn_name, flags) = entry
            store_imported_fn_mut_params_firebreak(
                ctx.fn_mut_params, fn_name, flags)
        }
    }
}
