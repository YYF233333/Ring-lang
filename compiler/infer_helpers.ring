use types::{Type, Effect, EffectRow,
    INT, FLOAT, STR, BOOL, UNIT, NEVER, ANY, EMPTY_ROW,
    type_to_string, nominal_display_name, types_equal_with_ownership,
    type_to_builtin_name, CALLABLE_BORROW_OWNED, fn_meta}
use ast::{Expr, Pattern, Span, NamedPatternField}
use hir::{HExpr, HStmt, TraitDispatch, DictRef, ValueBindingKind,
    trait_dict_name, trait_bound_param_name,
    hexpr_type, compare_by_first}
use diagnostics::{DiagnosticContext, DiagnosticNote}
use codes::{E0201, E0205, E0208, E0301, E0303, E0307, E0308, E0504, E0705}
use union_find::{UnionFind, uf_find, uf_lookup}
use env::{TypeEnv, TypeScheme,
    apply_subst, has_impl, lookup_variant}
use infer_ctx::{InferCtx, InferResult, FnBoundsEntry,
    CompileError, type_error, unify_at, resolve_relative_qualifier,
    resolve_dict_ref_for_type, resolve_dicts_from_scheme, variant_ctor_origin,
    value_binding_kind, fresh_call_result_callable_def_id}


pub struct MethodLookupResult {
    method_type: Type?,
    method_scheme: TypeScheme?,
    instantiation_map: Map<Int, Type>,
    is_authoritative_drop: Bool
}


pub struct StmtResult {
    hstmt: HStmt,
    subst: UnionFind,
    effects: EffectRow
}

pub struct LiveSchemeBinding {
    binding_key: Str,
    live_scheme: TypeScheme
}

pub struct CalleeDefaults {
    min_arity: Int,
    values: List<HExpr>,
    local_var_bounds: Map<Int, Set<Str>>
}

pub struct CalleeMetadata {
    def_id: Int,
    binding_key: Str,
    ultimate_origin: Str,
    kind: ValueBindingKind,
    live_scheme: TypeScheme,
    instantiation_map: Map<Int, Type>,
    defaults: CalleeDefaults?,
    mut_flags: List<Bool>?
}

fn instantiate_value_scheme(mut ctx: InferCtx, scheme: TypeScheme) -> Type {
    let instantiation = ctx.env.instantiate_with_map(scheme)
    match scheme.def_id {
        some(def_id) => {
            ctx.latest_value_instantiation_maps.insert(
                def_id, instantiation.var_map)
        },
        none => {}
    }
    instantiation.ty
}

fn exact_value_source_def_id(ctx: InferCtx, start: Int) -> Int {
    let mut current = start
    let mut visited: Set<Int> = set_new()
    let mut fuel = ctx.pre_solve_exact_value_alias_targets.entries().len() + 1
    while fuel > 0 {
        if visited.contains(current) { return current }
        visited.insert(current)
        match ctx.pre_solve_exact_value_alias_targets.get(current) {
            some(target) => { current = target },
            none => return current
        }
        fuel = fuel - 1
    }
    current
}

pub fn callable_defaults_by_def_id(
    ctx: InferCtx, def_id: Int
) -> CalleeDefaults? {
    let owner_def_id = exact_value_source_def_id(ctx, def_id)
    match (
        ctx.fn_min_arity.get(owner_def_id),
        ctx.fn_defaults.get(owner_def_id),
        ctx.fn_default_var_bounds.get(owner_def_id)
    ) {
        (some(min_arity), some(values), some(bounds)) =>
            some(CalleeDefaults {
                min_arity: min_arity,
                values: values,
                local_var_bounds: bounds
            }),
        _ => none
    }
}

// An exact import/project alias may be registered before an unannotated const
// owner has published its type. Function bodies use isolated substitutions, so
// accepting that TypeVar in any value position would lose the constraint when
// the body exits (and could later cross the callable freeze barrier). Reject
// the read itself; this covers calls, arguments, storage and projections with
// one source-order-safe boundary and does not monomorphize generalized consts.
fn exact_value_alias_is_unfinalized(
    ctx: InferCtx, scheme: TypeScheme
) -> Bool {
    let mut current = match scheme.def_id {
        some(def_id) => def_id,
        none => return false
    }
    let mut visited: Set<Int> = set_new()
    let mut fuel = ctx.pre_solve_exact_value_alias_targets.entries().len() + 1
    while fuel > 0 {
        if ctx.pending_inferred_const_def_ids.contains(current) {
            return true
        }
        if visited.contains(current) { return false }
        let visited_def_id = current
        visited.insert(visited_def_id)
        match ctx.pre_solve_exact_value_alias_targets.get(current) {
            some(source_def_id) => { current = source_def_id },
            none => return false
        }
        fuel = fuel - 1
    }
    panic("unreachable: exact value alias source chain exceeded its edge count")
}

fn abort_discarded_precheck_if_active(mut ctx: InferCtx) {
    let mut blocked = false
    if ctx.impl_effect_precheck_active {
        ctx.impl_effect_precheck_blocked = true
        blocked = true
    }
    if ctx.discarded_fn_precheck_active {
        ctx.discarded_fn_precheck_blocked = true
        blocked = true
    }
    if blocked { fail.raise(CompileError {}) }
}

pub fn precheck_callable_summary_is_pending(
    ctx: InferCtx, def_id: Int?
) -> Bool {
    let mut current = match def_id {
        some(exact_def_id) => exact_def_id,
        none => return false
    }
    let mut visited: Set<Int> = set_new()
    let mut fuel = ctx.pre_solve_exact_value_alias_targets.entries().len() + 1
    while fuel > 0 {
        if ctx.pending_precheck_callable_def_ids.contains(current) {
            return true
        }
        if visited.contains(current) { return false }
        let visited_def_id = current
        visited.insert(visited_def_id)
        match ctx.pre_solve_exact_value_alias_targets.get(current) {
            some(source_def_id) => { current = source_def_id },
            none => return false
        }
        fuel = fuel - 1
    }
    panic("unreachable: pending precheck callable chain exceeded its edge count")
}

pub fn guard_pending_precheck_callable_summary(
    mut ctx: InferCtx, def_id: Int?, display_name: Str, span: Span
) -> Bool {
    if !precheck_callable_summary_is_pending(ctx, def_id) { return false }
    abort_discarded_precheck_if_active(ctx)
    let _ = type_error(ctx.sink, E0301,
        "Cannot use callable '${display_name}' before its inferred effect summary is finalized",
        span, DiagnosticContext::TypeMismatch {
            expected: "finalized callable effect summary",
            actual: "discarded precheck summary",
            expression: none
        })
    true
}

fn unfinalized_exact_value_alias_result(
    mut ctx: InferCtx, name: Str, def_id: Int?, span: Span,
    subst: UnionFind
) -> InferResult {
    // This HIR and its substitution are discarded. Abort silently instead of
    // committing an open effect tail unrelated to the eventual const type;
    // the enclosing precheck records its exact callable summary as pending.
    abort_discarded_precheck_if_active(ctx)
    let _ = type_error(ctx.sink, E0301,
        "Cannot use exact value alias '${name}' before its inferred const source is finalized",
        span, DiagnosticContext::TypeMismatch {
            expected: "finalized inferred const type",
            actual: "unresolved exact alias type",
            expression: none
        })
    InferResult {
        hexpr: HExpr::Ident {
            name: name, resolved_name: none, def_id: def_id,
            dict_closure_dicts: none, ty: Type::ErrorType,
            effects: EMPTY_ROW, span: span
        },
        subst: subst, effects: EMPTY_ROW
    }
}

fn pending_precheck_callable_value_result(
    mut ctx: InferCtx, name: Str, def_id: Int?, span: Span,
    subst: UnionFind
) -> InferResult {
    let _ = guard_pending_precheck_callable_summary(
        ctx, def_id, name, span)
    InferResult {
        hexpr: HExpr::Ident {
            name: name, resolved_name: none, def_id: def_id,
            dict_closure_dicts: none, ty: Type::ErrorType,
            effects: EMPTY_ROW, span: span
        },
        subst: subst, effects: EMPTY_ROW
    }
}


// ============================================================
// Value type check (for auto-boxing)
// ============================================================

pub fn is_value_type(t: Type) -> Bool {
    match t {
        Type::IntType => true,
        Type::FloatType => true,
        Type::BoolType => true,
        Type::StrType => true,
        _ => false
    }
}

// ============================================================
// Local mut effect cancellation
// ============================================================

// When calling a function that has mut<T> effects, if the argument
// corresponding to the mut parameter is a local variable (not a
// mut function parameter), the mutation is not observable outside
// the current function, so the mut<T> effect should be cancelled.
//
// callee_params: the callee's FnType parameter types
// callee_effects: the callee's FnType effect row
// hargs: inferred argument HExprs (same length as callee_params for regular calls;
//        for method calls, hargs[i] corresponds to callee_params[param_offset + i])
// param_offset: 0 for regular calls, 1 for method calls (skip self)
pub fn cancel_local_mut_effects(
    ctx: InferCtx,
    effects: EffectRow,
    callee_params: List<Type>,
    callee_effects: EffectRow,
    hargs: List<HExpr>,
    param_offset: Int,
    s: UnionFind
) -> EffectRow {
    let mut cancel_types: List<Type> = []
    for eff in callee_effects.effects {
        match eff {
            Effect::MutEffect { state_type } => {
                let resolved_st = apply_subst(s, state_type)
                let mut pi = param_offset
                let mut ai = 0
                while ai < hargs.len() {
                    match callee_params.get(pi) {
                        some(pt) => {
                            let resolved_pt = apply_subst(s, pt)
                            if types_equal_with_ownership(
                                ctx.env.types.ownership_metadata,
                                resolved_pt, resolved_st
                            ) {
                                match hargs.get(ai) {
                                    some(harg) => match harg {
                                        HExpr::Ident { def_id: some(did), .. } => {
                                            if !ctx.env.scope.mut_param_defs.contains(did) {
                                                let cancel_type = resolved_st
                                                cancel_types.push(cancel_type)
                                            }
                                        },
                                        _ => {}
                                    },
                                    none => {}
                                }
                            }
                        },
                        none => {}
                    }
                    pi = pi + 1
                    ai = ai + 1
                }
            },
            _ => {}
        }
    }

    if cancel_types.len() == 0 {
        return effects
    }

    let mut filtered: List<Effect> = []
    for e in effects.effects {
        let mut keep = true
        match e {
            Effect::MutEffect { state_type } => {
                let resolved_st = apply_subst(s, state_type)
                for ct in cancel_types {
                    if types_equal_with_ownership(
                        ctx.env.types.ownership_metadata, ct, resolved_st
                    ) {
                        keep = false
                    }
                }
            },
            _ => {}
        }
        if keep {
            let filtered_effect = e
            filtered.push(filtered_effect)
        }
    }
    EffectRow { effects: filtered, tail: effects.tail }
}

// ============================================================
// Resolve substitution var chain
// ============================================================

pub fn resolve_var_id(id: Int, sub: UnionFind) -> Int {
    match uf_lookup(sub, id) {
        some(resolved) => match resolved {
            Type::TypeVar { id: new_id, .. } => resolve_var_id(new_id, sub),
            _ => id
        },
        none => uf_find(sub, id)
    }
}

// ============================================================
// Assignment target mutability check
// ============================================================

pub fn check_assign_target_mutable(ctx: InferCtx, target: Expr) {
    match target {
        Expr::Ident { name, span, .. } => {
            let scheme = ctx.env.lookup(name)
            match scheme {
                some(s) => match s.def_id {
                    some(did) => {
                        if !ctx.env.scope.mutable_vars.contains(did) {
                            let _ = type_error(ctx.sink, E0205,
                                "Cannot assign to immutable variable '${name}' (declared with 'let'). Use 'let mut' for mutable bindings.",
                                span, DiagnosticContext::OtherContext { detail: some("'${name}' is declared with 'let'") })
                        }
                    },
                    none => {}
                },
                none => {}
            }
        },
        Expr::FieldAccess { receiver, span, .. } => {
            let receiver_for_root = receiver
            let root = find_root_expr(receiver_for_root)
            match root {
                Expr::Ident { name, span: rspan, .. } => {
                    let scheme = ctx.env.lookup(name)
                    match scheme {
                        some(s) => match s.def_id {
                            some(did) => {
                                if !ctx.env.scope.mutable_vars.contains(did) {
                                    let _ = type_error(ctx.sink, E0205,
                                        "Cannot assign to field of immutable variable '${name}'. Use 'let mut' for mutable bindings.",
                                        span, DiagnosticContext::OtherContext { detail: some("'${name}' is not mutable") })
                                }
                            },
                            none => {}
                        },
                        none => {}
                    }
                },
                _ => {
                    let _ = type_error(ctx.sink, E0205,
                        "Cannot assign to field of a temporary value. Store the value in a 'let mut' variable first.",
                        span, DiagnosticContext::OtherContext { detail: some("assignment to temporary value") })
                }
            }
        },
        Expr::IndexExpr { receiver, span, .. } => {
            // Index assignment (e.g. list[i] = val) — check receiver mutability
            let receiver_for_root = receiver
            let root = find_root_expr(receiver_for_root)
            match root {
                Expr::Ident { name, span: rspan, .. } => {
                    let scheme = ctx.env.lookup(name)
                    match scheme {
                        some(s) => match s.def_id {
                            some(did) => {
                                if !ctx.env.scope.mutable_vars.contains(did) {
                                    let _ = type_error(ctx.sink, E0205,
                                        "Cannot assign to index of immutable variable '${name}'. Use 'let mut' for mutable bindings.",
                                        span, DiagnosticContext::OtherContext { detail: some("'${name}' is not mutable") })
                                }
                            },
                            none => {}
                        },
                        none => {}
                    }
                },
                _ => {
                    let _ = type_error(ctx.sink, E0205,
                        "Cannot assign to index of a temporary value. Store the value in a 'let mut' variable first.",
                        span, DiagnosticContext::OtherContext { detail: some("assignment to temporary value") })
                }
            }
        },
        _ => {}
    }
}

pub fn find_root_expr(e: Expr) -> Expr {
    match e {
        Expr::FieldAccess { receiver, .. } => {
            let receiver_for_root = receiver
            find_root_expr(receiver_for_root)
        },
        Expr::IndexExpr { receiver, .. } => {
            let receiver_for_root = receiver
            find_root_expr(receiver_for_root)
        },
        _ => e
    }
}

// B-056: Get def_id of root variable in an assignment target (AST level).
pub fn get_assign_target_root_def_id(ctx: InferCtx, target: Expr) -> Int? {
    let target_for_root = target
    let root = find_root_expr(target_for_root)
    match root {
        Expr::Ident { name, .. } => {
            match ctx.env.lookup(name) {
                some(s) => s.def_id,
                none => none
            }
        },
        _ => none
    }
}

// B-056: Get type of root HExpr in an assignment target (HIR level).
pub fn get_hexpr_root_type(target: HExpr) -> Type {
    match target {
        HExpr::FieldAccess { receiver, .. } => get_hexpr_root_type(receiver),
        HExpr::IndexExpr { receiver, .. } => get_hexpr_root_type(receiver),
        _ => hexpr_type(target)
    }
}

// ============================================================
// infer_ident (from infer-expr.ts)
// ============================================================

// Origin metadata is keyed by the lexical binding's DefId, so same-spelled
// locals cannot inherit an imported or module-level binding's origin.
fn exact_value_origin(ctx: InferCtx, spelling: Str, scheme: TypeScheme) -> Str {
    match scheme.def_id {
        some(def_id) => match ctx.use_aliases.get(def_id) {
            some(origin) => {
                let result_origin = origin
                result_origin
            },
            none => spelling
        },
        none => spelling
    }
}

pub fn infer_ident(mut ctx: InferCtx, name: Str, span: Span, subst: UnionFind, qualifier: Str?) -> InferResult {
    // Resolve relative paths (self::/super::) to actual qualified names
    let mut resolved_qualifier = qualifier
    match qualifier {
        some(q) => {
            if q == "self" || q.starts_with("super") {
                match resolve_relative_qualifier(q, ctx.mod_path_stack) {
                    some(prefix) => {
                        if prefix == "" {
                            // super from top-level mod — name is at root scope
                            resolved_qualifier = none
                        } else {
                            let qualifier_prefix = prefix
                            resolved_qualifier = some(qualifier_prefix)
                        }
                    },
                    none => {
                        let _ = type_error(ctx.sink, E0705,
                            "Cannot use '${q}' — relative path exceeds module nesting depth",
                            span, DiagnosticContext::OtherContext { detail: some("relative path out of scope") })
                        return InferResult {
                            hexpr: HExpr::Ident { name: name, resolved_name: none, def_id: none, dict_closure_dicts: none, ty: Type::ErrorType, effects: EMPTY_ROW, span: span },
                            subst: subst, effects: EMPTY_ROW
                        }
                    }
                }
            }
        },
        none => {}
    }

    // Try module-qualified lookup first: qualifier::name
    match resolved_qualifier {
        some(q) => {
            let qualified_name = "${q}::${name}"
            let mod_scheme = ctx.env.lookup(qualified_name)
            match mod_scheme {
                some(ms) => {
                    let t = instantiate_value_scheme(ctx, ms)
                    if exact_value_alias_is_unfinalized(ctx, ms) {
                        return unfinalized_exact_value_alias_result(
                            ctx, qualified_name, ms.def_id, span, subst)
                    }
                    if precheck_callable_summary_is_pending(ctx, ms.def_id) {
                        return pending_precheck_callable_value_result(
                            ctx, qualified_name, ms.def_id, span, subst)
                    }
                    let actual_name = exact_value_origin(ctx, qualified_name, ms)
                    return InferResult {
                        hexpr: HExpr::Ident { name: actual_name, resolved_name: variant_ctor_origin(ctx, ms), def_id: ms.def_id, dict_closure_dicts: none, ty: t, effects: EMPTY_ROW, span: span },
                        subst: subst, effects: EMPTY_ROW
                    }
                },
                none => {
                    // Fallback: try prepending current mod path for relative references
                    // e.g., inside mod outer, "inner::f" should resolve to "outer::inner::f"
                    if ctx.mod_path_stack.len() > 0 {
                        let mod_prefix = ctx.mod_path_stack.join("::")
                        let full_qualified = "${mod_prefix}::${qualified_name}"
                        let full_scheme = ctx.env.lookup(full_qualified)
                        match full_scheme {
                            some(fs) => {
                                let t = instantiate_value_scheme(ctx, fs)
                                if exact_value_alias_is_unfinalized(ctx, fs) {
                                    return unfinalized_exact_value_alias_result(
                                        ctx, full_qualified, fs.def_id,
                                        span, subst)
                                }
                                if precheck_callable_summary_is_pending(
                                    ctx, fs.def_id) {
                                    return pending_precheck_callable_value_result(
                                        ctx, full_qualified, fs.def_id,
                                        span, subst)
                                }
                                let actual_name = exact_value_origin(ctx, full_qualified, fs)
                                return InferResult {
                                    hexpr: HExpr::Ident { name: actual_name, resolved_name: variant_ctor_origin(ctx, fs), def_id: fs.def_id, dict_closure_dicts: none, ty: t, effects: EMPTY_ROW, span: span },
                                    subst: subst, effects: EMPTY_ROW
                                }
                            },
                            none => {}
                        }
                    }
                }
            }
        },
        none => {}
    }

    let scheme = ctx.env.lookup(name)
    match scheme {
        none => {
            match resolved_qualifier {
                some(q) => {
                    let qualifier_display = nominal_display_name(q)
                    let name_for_diagnostic = name
                    let _ = type_error(ctx.sink, E0201, "'${qualifier_display}' has no member '${name}'", span,
                        DiagnosticContext::UndefinedVariable {
                            name: name_for_diagnostic, scope_locals: none
                        })
                    return InferResult {
                        hexpr: HExpr::Ident { name: name, resolved_name: none, def_id: none, dict_closure_dicts: none, ty: Type::ErrorType, effects: EMPTY_ROW, span: span },
                        subst: subst, effects: EMPTY_ROW
                    }
                },
                none => {}
            }
            let name_for_diagnostic = name
            let _ = type_error(ctx.sink, E0201, "Undefined variable: ${name}", span,
                DiagnosticContext::UndefinedVariable {
                    name: name_for_diagnostic, scope_locals: none
                })
            InferResult {
                hexpr: HExpr::Ident { name: name, resolved_name: none, def_id: none, dict_closure_dicts: none, ty: Type::ErrorType, effects: EMPTY_ROW, span: span },
                subst: subst, effects: EMPTY_ROW
            }
        },
        some(s) => {
            let t = instantiate_value_scheme(ctx, s)
            if exact_value_alias_is_unfinalized(ctx, s) {
                return unfinalized_exact_value_alias_result(
                    ctx, name, s.def_id, span, subst)
            }
            if precheck_callable_summary_is_pending(ctx, s.def_id) {
                return pending_precheck_callable_value_result(
                    ctx, name, s.def_id, span, subst)
            }
            // Auto-boxing: mark mutable vars captured by closures
            match s.def_id {
                some(did) => {
                    if ctx.env.scope.mutable_vars.contains(did) {
                        match ctx.var_lambda_depth.get(did) {
                            some(def_depth) => {
                                if ctx.lambda_depth > def_depth {
                                    let boxed_def_id = did
                                    ctx.boxed_vars.insert(boxed_def_id)
                                }
                            },
                            none => {}
                        }
                    }
                },
                none => {}
            }
            // Check if this name was imported via use alias (e.g. use super::value)
            // If so, use the qualified name in HIR for correct codegen
            let name_for_origin = name
            let actual_name = exact_value_origin(ctx, name_for_origin, s)
            match resolved_qualifier {
                some(q) => {
                    match ctx.env.types.enums.get(q) {
                        some(enum_def) => {
                            if !enum_def.variant_index.contains_key(name) {
                                let qualifier_display = nominal_display_name(q)
                                let _ = type_error(ctx.sink, E0201, "'${qualifier_display}' has no variant '${name}'", span,
                                    DiagnosticContext::UndefinedVariable { name: name, scope_locals: none })
                            }
                        },
                        none => {
                            let qualifier_display = nominal_display_name(q)
                            let _ = type_error(ctx.sink, E0201, "'${qualifier_display}' has no variant '${name}'", span,
                                DiagnosticContext::UndefinedVariable { name: name, scope_locals: none })
                        }
                    }
                },
                none => {}
            }
            InferResult {
                hexpr: HExpr::Ident { name: actual_name, resolved_name: variant_ctor_origin(ctx, s), def_id: s.def_id, dict_closure_dicts: none, ty: t, effects: EMPTY_ROW, span: span },
                subst: subst, effects: EMPTY_ROW
            }
        }
    }
}

// ============================================================
// infer_numeric_op
// ============================================================

pub fn infer_numeric_op(ctx: InferCtx, left: HExpr, right: HExpr, s: UnionFind, span: Span, op_str: Str) -> Type {
    let resolved = apply_subst(s, hexpr_type(left))
    match resolved {
        Type::TypeVar { id: tv_id, .. } => {
            // Check if this TypeVar is a rigid type parameter (from fn<T> etc.)
            // Rigid type params should not silently unify to Int — report E0303.
            // Fresh inference variables (e.g. from fold callback) can unify to Int.
            let mut rigid_ids: Set<Int> = set_new()
            let mut sorted_tp_scope = ctx.type_param_scope.entries()
            sorted_tp_scope.sort_by(compare_by_first)
            for entry in sorted_tp_scope {
                let tp_type = entry.1
                match tp_type {
                    Type::TypeVar { id: tp_id, .. } => {
                        rigid_ids.insert(resolve_var_id(tp_id, s))
                    },
                    _ => {}
                }
            }
            let is_rigid = rigid_ids.contains(resolve_var_id(tv_id, s))
            if is_rigid {
                type_error(ctx.sink, E0303,
                    "Operator ${op_str} requires numeric types (Int or Float), got unresolved type",
                    span, DiagnosticContext::TypeMismatch { expected: "Int or Float", actual: "unresolved type", expression: none })
            } else {
                let _ = unify_at(ctx.sink, ctx.env, resolved, INT, s, span)
                INT
            }
        },
        Type::IntType => INT,
        Type::FloatType => FLOAT,
        _ => type_error(ctx.sink, E0303,
            "Operator ${op_str} requires numeric types, got ${type_to_string(resolved)}",
            span, DiagnosticContext::TypeMismatch { expected: "Int or Float", actual: type_to_string(resolved), expression: none })
    }
}

pub fn is_primitive_eq(t: Type) -> Bool {
    match t {
        Type::IntType => true,
        Type::FloatType => true,
        Type::StrType => true,
        Type::BoolType => true,
        Type::UnitType => true,
        Type::NeverType => true,
        Type::AnyType => true,
        _ => false
    }
}

pub fn is_primitive_ord(t: Type) -> Bool {
    match t {
        Type::IntType => true,
        Type::FloatType => true,
        Type::StrType => true,
        Type::BoolType => true,
        _ => false
    }
}

// Resolve tuple Eq structurally while delegating every non-tuple leaf to the
// normal trait resolver.  This is the single source of truth for the plan
// consumed by dict lowering, closure-capture census, and both native backends.
pub fn resolve_eq_dispatch(ctx: InferCtx, resolved: Type, subst: UnionFind,
                           span: Span, op: Str) -> TraitDispatch {
    match resolved {
        Type::TupleType { elements } => {
            let mut element_types: List<Type> = []
            let mut element_dispatches: List<TraitDispatch> = []
            for element in elements {
                let element_type = apply_subst(subst, element)
                let stored_element_type = element_type
                element_types.push(stored_element_type)
                element_dispatches.push(resolve_eq_dispatch(
                    ctx, element_type, subst, span, op))
            }
            TraitDispatch::Tuple {
                element_types: element_types,
                elements: element_dispatches
            }
        },
        _ => resolve_trait_dispatch(
            ctx, resolved, "Eq", E0307, subst, span, op,
            is_primitive_eq(resolved)),
    }
}

fn dispatch_from_dict_ref(dict_ref: DictRef) -> TraitDispatch {
    match dict_ref {
        DictRef::Static(dict) => {
            let result_dict = dict
            TraitDispatch::Direct { dict: result_dict, extra_dicts: [] }
        },
        DictRef::Wrapped { dict, inner_dicts, .. } => {
            let result_dict = dict
            let result_inner_dicts = inner_dicts
            TraitDispatch::Direct {
                dict: result_dict, extra_dicts: result_inner_dicts
            }
        },
        DictRef::Simple(param) => {
            let result_param = param
            TraitDispatch::Dict { param: result_param }
        }
    }
}

pub fn resolve_trait_dispatch(ctx: InferCtx, resolved: Type, trait_name: Str, error_code: Str, subst: UnionFind, span: Span, op: Str, is_builtin: Bool) -> TraitDispatch {
    if is_builtin { return TraitDispatch::Builtin }
    let trait_display = nominal_display_name(trait_name)

    match resolved {
        Type::TypeVar { id, .. } => {
            let bound = ctx.current_fn_bounds.find(fn(fb) {
                if fb.trait_name != trait_name { false } else
                if fb.type_param_var_id == id { true } else
                if uf_find(subst, fb.type_param_var_id) == id { true } else {
                    // Also check through type bindings: uf_bind stores var-to-var
                    // bindings in the types map, not the parent map, so uf_find alone
                    // may miss them. Resolve the bound var fully via apply_subst.
                    let bound_resolved = apply_subst(subst, Type::TypeVar { id: fb.type_param_var_id, name: none })
                    match bound_resolved {
                        Type::TypeVar { id: bid, .. } => bid == id,
                        _ => false
                    }
                }
            })
            match bound {
                some(b) => { return TraitDispatch::Dict { param: trait_bound_param_name(b.type_param_name, trait_name) } },
                none => {}
            }
            match ctx.env.scope.var_bounds.get(id) {
                some(var_bounds) => {
                    if var_bounds.contains(trait_name) { return TraitDispatch::Builtin }
                },
                none => {}
            }
            let _ = type_error(ctx.sink, error_code,
                "Type does not implement ${trait_display}, cannot use '${op}'",
                span, DiagnosticContext::TraitError { detail: "type does not implement ${trait_display}" })
            TraitDispatch::Builtin
        },
        Type::StructType { .. } => {
            match resolve_dict_ref_for_type(
                ctx.env, ctx.current_fn_bounds, resolved, subst, trait_name
            ) {
                some(dict_ref) => {
                    return dispatch_from_dict_ref(dict_ref)
                },
                none => {}
            }
            let _ = type_error(ctx.sink, error_code,
                "Type '${type_to_string(resolved)}' does not implement ${trait_display}, cannot use '${op}'",
                span, DiagnosticContext::TraitError { detail: "type '${type_to_string(resolved)}' does not implement ${trait_display}" })
            TraitDispatch::Builtin
        },
        Type::EnumType { .. } => {
            match resolve_dict_ref_for_type(
                ctx.env, ctx.current_fn_bounds, resolved, subst, trait_name
            ) {
                some(dict_ref) => {
                    return dispatch_from_dict_ref(dict_ref)
                },
                none => {}
            }
            let _ = type_error(ctx.sink, error_code,
                "Type '${type_to_string(resolved)}' does not implement ${trait_display}, cannot use '${op}'",
                span, DiagnosticContext::TraitError { detail: "type '${type_to_string(resolved)}' does not implement ${trait_display}" })
            TraitDispatch::Builtin
        },
        _ => {
            let _ = type_error(ctx.sink, error_code,
                "Type '${type_to_string(resolved)}' does not implement ${trait_display}, cannot use '${op}'",
                span, DiagnosticContext::TraitError { detail: "type '${type_to_string(resolved)}' does not implement ${trait_display}" })
            TraitDispatch::Builtin
        }
    }
}

// ============================================================
// Final value-position lowering for callable identifiers
// ============================================================

fn live_scheme_entry_by_def_id(
    entry: (Str, TypeScheme), wanted: Int
) -> LiveSchemeBinding? {
    let (binding_key, candidate) = entry
    match candidate.def_id {
        some(candidate_id) => {
            if candidate_id == wanted {
                let result_binding_key = binding_key
                let result_candidate = candidate
                return some(LiveSchemeBinding {
                    binding_key: result_binding_key,
                    live_scheme: result_candidate
                })
            }
        },
        none => {}
    }
    none
}

fn live_scheme_by_def_id(ctx: InferCtx, wanted: Int) -> LiveSchemeBinding? {
    let mut scope_idx = ctx.env.scope.scopes.len() - 1
    while scope_idx >= 0 {
        match ctx.env.scope.scopes.get(scope_idx) {
            some(scope) => {
                let entries = scope.variables.entries()
                for entry in entries {
                    match live_scheme_entry_by_def_id(entry, wanted) {
                        some(binding) => {
                            let result_binding = binding
                            return some(result_binding)
                        },
                        none => {}
                    }
                }
            },
            none => {}
        }
        scope_idx = scope_idx - 1
    }
    match ctx.default_template_live_schemes.get(wanted) {
        some(scheme) => some(LiveSchemeBinding {
            binding_key: match ctx.use_aliases.get(wanted) {
                some(origin) => origin,
                none => "<default-template:${wanted.to_str()}>"
            },
            live_scheme: scheme
        }),
        none => none
    }
}

pub fn resolve_callee_metadata(ctx: InferCtx, callee: HExpr) -> CalleeMetadata? {
    match callee {
        HExpr::Ident { def_id: some(def_id), .. } => {
            let def_id_for_kind = def_id
            let kind = value_binding_kind(ctx, some(def_id_for_kind))
            match live_scheme_by_def_id(ctx, def_id) {
                some(binding) => {
                    let ultimate_origin = match ctx.use_aliases.get(def_id) {
                        some(origin) => origin,
                        none => binding.binding_key
                    }

                    let mut defaults: CalleeDefaults? = none
                    let mut mut_flags: List<Bool>? = none
                    match kind {
                        ValueBindingKind::DirectCallable => {
                            defaults = callable_defaults_by_def_id(ctx, def_id)
                            mut_flags = match ctx.fn_mut_params.get(ultimate_origin) {
                                some(flags) => {
                                    let result_flags = flags
                                    some(result_flags)
                                },
                                none => match ctx.fn_mut_params.get(binding.binding_key) {
                                    some(flags) => {
                                        let result_flags = flags
                                        some(result_flags)
                                    },
                                    none => none
                                }
                            }
                        },
                        _ => {}
                    }

                    some(CalleeMetadata {
                        def_id: def_id,
                        binding_key: binding.binding_key,
                        ultimate_origin: ultimate_origin,
                        kind: kind,
                        live_scheme: binding.live_scheme,
                        instantiation_map: match
                            ctx.latest_value_instantiation_maps.get(def_id) {
                            some(mapping) => mapping,
                            none => map_new()
                        },
                        defaults: defaults,
                        mut_flags: mut_flags
                    })
                },
                none => match kind {
                    ValueBindingKind::LocalBorrow => none,
                    ValueBindingKind::DirectCallable |
                    ValueBindingKind::ExternCallable |
                    ValueBindingKind::ConstGetter =>
                        panic("internal error: declaration value DefId has no live scheme")
                }
            }
        },
        _ => none
    }
}

pub fn is_bounded_direct_callable_ident(ctx: InferCtx, expr: HExpr) -> Bool {
    match resolve_callee_metadata(ctx, expr) {
        some(metadata) => {
            match metadata.kind {
                ValueBindingKind::DirectCallable | ValueBindingKind::ExternCallable => {
                    metadata.live_scheme.bounds.len() > 0
                },
                _ => false
            }
        },
        _ => false
    }
}

pub fn resolve_value_ident(ctx: InferCtx, harg: HExpr, s: UnionFind) -> HExpr {
    let metadata = resolve_callee_metadata(ctx, harg)
    match harg {
        HExpr::Ident { name, resolved_name, def_id, dict_closure_dicts, ty, effects, span } => {
            let kind = match metadata {
                some(m) => m.kind,
                none => ValueBindingKind::LocalBorrow
            }

            // A const identifier denotes a call to its zero-argument getter.
            // This remains explicit even when the stored value itself is a
            // function, so an outer source call uses the closure ABI.
            match kind {
                ValueBindingKind::ConstGetter => {
                    let getter_return_type = ty
                    let getter_ty = Type::FnType {
                        params: [], return_type: getter_return_type,
                        meta: fn_meta(EMPTY_ROW, CALLABLE_BORROW_OWNED)
                    }
                    let getter_name = name
                    let getter_def_id = def_id
                    let getter_span = span
                    let getter = HExpr::Ident {
                        name: getter_name, resolved_name: none,
                        def_id: getter_def_id,
                        dict_closure_dicts: none, ty: getter_ty,
                        effects: EMPTY_ROW, span: getter_span
                    }
                    let call_callee_def_id = def_id
                    let callable_result_def_id =
                        fresh_call_result_callable_def_id(ctx, ty)
                    let call_result_type = ty
                    let call_effects = effects
                    let call_span = span
                    return HExpr::Call {
                        callee: getter, callee_def_id: call_callee_def_id,
                        callable_result_def_id: callable_result_def_id,
                        args: [], type_args: [],
                        resolved_dicts: [], dict_dispatch: none,
                        ty: call_result_type,
                        effects: call_effects,
                        span: call_span
                    }
                },
                _ => {}
            }

            // Already resolved by an earlier value-position walk.
            match dict_closure_dicts {
                some(_) => { return harg },
                none => {},
            }

            match ty {
                Type::FnType { .. } => {},
                _ => { return harg }
            }

            match kind {
                ValueBindingKind::DirectCallable => {
                    match metadata {
                        some(m) => {
                            let as_ = m.live_scheme
                            if as_.bounds.len() == 0 {
                                let result_name = name
                                let result_resolved_name = resolved_name
                                let result_def_id = def_id
                                let result_type = ty
                                let result_effects = effects
                                let result_span = span
                                HExpr::Ident {
                                    name: result_name,
                                    resolved_name: result_resolved_name,
                                    def_id: result_def_id,
                                    dict_closure_dicts: some([]),
                                    ty: result_type,
                                    effects: result_effects,
                                    span: result_span
                                }
                            } else {
                                let dicts = resolve_dicts_from_scheme(
                                    ctx.sink, ctx.env, ctx.current_fn_bounds,
                                    as_, ty, s, span
                                )
                                // Never attach partial evidence.  resolve_dicts_from_scheme
                                // has already emitted one E0503 for every missing bound.
                                if dicts.len() == as_.bounds.len() {
                                    let result_name = name
                                    let result_resolved_name = resolved_name
                                    let result_def_id = def_id
                                    let result_type = ty
                                    let result_effects = effects
                                    let result_span = span
                                    HExpr::Ident {
                                        name: result_name,
                                        resolved_name: result_resolved_name,
                                        def_id: result_def_id,
                                        dict_closure_dicts: some(dicts),
                                        ty: result_type,
                                        effects: result_effects,
                                        span: result_span
                                    }
                                } else { harg }
                            }
                        },
                        none => harg
                    }
                },
                ValueBindingKind::ExternCallable => {
                    match metadata {
                        some(m) => {
                            let as_ = m.live_scheme
                            let valid = if as_.bounds.len() > 0 {
                                let validated = resolve_dicts_from_scheme(
                                    ctx.sink, ctx.env, ctx.current_fn_bounds,
                                    as_, ty, s, span
                                )
                                validated.len() == as_.bounds.len()
                            } else {
                                true
                            }
                            if valid {
                                let result_name = name
                                let result_resolved_name = resolved_name
                                let result_def_id = def_id
                                let result_type = ty
                                let result_effects = effects
                                let result_span = span
                                HExpr::Ident {
                                    name: result_name,
                                    resolved_name: result_resolved_name,
                                    def_id: result_def_id,
                                    dict_closure_dicts: some([]),
                                    ty: result_type,
                                    effects: result_effects,
                                    span: result_span
                                }
                            } else {
                                harg
                            }
                        },
                        none => harg
                    }
                },
                ValueBindingKind::ConstGetter => harg,
                ValueBindingKind::LocalBorrow => {
                    // Positional variant constructors have their own exact
                    // DefId provenance and also need a zero-dict direct-ABI
                    // wrapper when used as values.
                    match resolved_name {
                        some(_) => {
                            let result_name = name
                            let result_resolved_name = resolved_name
                            let result_def_id = def_id
                            let result_type = ty
                            let result_effects = effects
                            let result_span = span
                            HExpr::Ident {
                                name: result_name,
                                resolved_name: result_resolved_name,
                                def_id: result_def_id,
                                dict_closure_dicts: some([]),
                                ty: result_type,
                                effects: result_effects,
                                span: result_span
                            }
                        },
                        none => harg
                    }
                }
            }
        },
        _ => harg
    }
}

// ============================================================
// Mutability check for method calls
// ============================================================

pub fn check_expr_is_let_def(ctx: InferCtx, expr: Expr) -> Bool {
    match expr {
        Expr::Ident { name, .. } => {
            match ctx.env.lookup(name) {
                some(s) => match s.def_id {
                    some(did) => ctx.env.scope.let_defs.contains(did),
                    none => false
                },
                none => false
            }
        },
        Expr::FieldAccess { receiver: inner, .. } => check_expr_is_let_def(ctx, inner),
        _ => false
    }
}

pub fn get_expr_def_id(ctx: InferCtx, expr: Expr) -> Int? {
    match expr {
        Expr::Ident { name, .. } => {
            match ctx.env.lookup(name) {
                some(s) => s.def_id,
                none => none
            }
        },
        // Do not recurse through FieldAccess: only direct ident receivers
        // qualify for mut<T> injection (e.g. list.push, not ctx.field.push)
        _ => none
    }
}

pub fn is_mut_method_call(ctx: InferCtx, recv_type: Type, method: Str) -> Bool {
    let mut type_name: Str? = none
    match recv_type {
        Type::StructType { name, .. } => {
            let result_name = name
            type_name = some(result_name)
        },
        Type::EnumType { name, .. } => {
            let result_name = name
            type_name = some(result_name)
        },
        _ => {
            match type_to_builtin_name(recv_type) {
                some(n) => {
                    let result_name = n
                    type_name = some(result_name)
                },
                none => {}
            }
        }
    }
    match type_name {
        some(tname) => {
            match ctx.env.trait_reg.mut_methods.get(tname) {
                some(mut_set) => mut_set.contains(method),
                none => false
            }
        },
        none => false
    }
}

pub fn check_receiver_mutability(mut ctx: InferCtx, receiver: Expr, recv_type: Type, method: Str, span: Span) {
    let mut type_name: Str? = none
    match recv_type {
        Type::StructType { name, .. } => {
            let result_name = name
            type_name = some(result_name)
        },
        Type::EnumType { name, .. } => {
            let result_name = name
            type_name = some(result_name)
        },
        _ => {
            match type_to_builtin_name(recv_type) {
                some(n) => {
                    let result_name = n
                    type_name = some(result_name)
                },
                none => {}
            }
        }
    }

    match type_name {
        some(tname) => {
            match ctx.env.trait_reg.mut_methods.get(tname) {
                some(mut_set) => {
                    if mut_set.contains(method) {
                        let is_let_def = check_expr_is_let_def(ctx, receiver)
                        if is_let_def {
                            let _ = type_error(ctx.sink, E0208,
                                "Cannot call mutating method '${method}' on immutable binding. Use 'let mut' to make it mutable.",
                                span, DiagnosticContext::OtherContext { detail: some("'${method}' requires a mutable receiver") })
                        }
                    }
                },
                none => {}
            }
        },
        none => {}
    }
}

// ============================================================
// Method lookup helpers
// ============================================================

pub fn lookup_impl_method(mut ctx: InferCtx, type_name: Str, method: Str) -> MethodLookupResult {
    match ctx.env.trait_reg.impl_methods.get(type_name) {
        some(impl_methods) => match impl_methods.get(method) {
            some(scheme) => {
                let instantiation = ctx.env.instantiate_with_map(scheme)
                let method_type = instantiation.ty
                let result_scheme = scheme
                MethodLookupResult {
                    method_type: some(method_type),
                    method_scheme: some(result_scheme),
                    instantiation_map: instantiation.var_map,
                    is_authoritative_drop: match
                        ctx.env.trait_reg.method_origins.get(type_name) {
                        some(origins) => match origins.get(method) {
                            some(origin) => origin.is_authoritative_drop,
                            none => panic(
                                "unreachable: installed method has no stable origin role")
                        },
                        none => panic(
                            "unreachable: installed method target has no origin table")
                    }
                }
            },
            none => MethodLookupResult { method_type: none,
                method_scheme: none, instantiation_map: map_new(),
                is_authoritative_drop: false }
        },
        none => MethodLookupResult { method_type: none,
            method_scheme: none, instantiation_map: map_new(),
            is_authoritative_drop: false }
    }
}

pub fn lookup_trait_method(
    mut ctx: InferCtx, type_name: Str, method: Str, span: Span
) -> MethodLookupResult {
    let mut found_type: Type? = none
    let mut found_scheme: TypeScheme? = none
    let mut found_instantiation_map: Map<Int, Type> = map_new()
    let mut found_trait_name: Str? = none
    let mut found_is_authoritative_drop = false
    match ctx.env.trait_reg.trait_impls.get(type_name) {
        some(type_impls) => {
            for impl_entry in type_impls {
                match ctx.env.trait_reg.traits.get(impl_entry.trait_name) {
                    some(trait_def) => {
                        let tm = trait_def.methods.find(fn(m) { m.name == method })
                        match tm {
                            some(found_method) => {
                                match found_trait_name {
                                    some(prev_trait) => {
                                        let type_display = nominal_display_name(type_name)
                                        let prev_display = nominal_display_name(prev_trait)
                                        let trait_display = nominal_display_name(impl_entry.trait_name)
                                        let _ = type_error(ctx.sink, E0504,
                                            "Ambiguous method '${method}' on '${type_display}': found in trait '${prev_display}' and '${trait_display}'",
                                            span, DiagnosticContext::OtherContext { detail: some("disambiguate by calling TraitName::${method}") })
                                        return MethodLookupResult {
                                            method_type: found_type,
                                            method_scheme: found_scheme,
                                            instantiation_map:
                                                found_instantiation_map,
                                            is_authoritative_drop:
                                                found_is_authoritative_drop
                                        }
                                    },
                                    none => {
                                        let exact_scheme = TypeScheme {
                                            ty: found_method.ty,
                                            type_vars: trait_def.type_param_vars,
                                            bounds: [],
                                            def_id: some(found_method.def_id)
                                        }
                                        let instantiation =
                                            ctx.env.instantiate_with_map(
                                                exact_scheme)
                                        found_type = some(instantiation.ty)
                                        found_instantiation_map =
                                            instantiation.var_map
                                        found_scheme = some(exact_scheme)
                                        found_trait_name = some(impl_entry.trait_name)
                                        found_is_authoritative_drop =
                                            impl_entry.is_authoritative_drop
                                    }
                                }
                            },
                            none => {}
                        }
                    },
                    none => {}
                }
            }
        },
        none => {}
    }
    MethodLookupResult {
        method_type: found_type,
        method_scheme: found_scheme,
        instantiation_map: found_instantiation_map,
        is_authoritative_drop: found_is_authoritative_drop
    }
}

// ============================================================
// rewrite_bare_enum_bindings
// ============================================================

fn rewrite_bare_enum_pattern_child(env: TypeEnv, child: Pattern) -> Pattern {
    let child_for_rewrite = child
    rewrite_bare_enum_bindings(env, child_for_rewrite)
}

fn rewrite_bare_enum_named_field(
    env: TypeEnv, field: NamedPatternField
) -> NamedPatternField {
    match field {
        NamedPatternField { name, pattern, span } => {
            let result_name = name
            let pattern_for_rewrite = pattern
            let result_span = span
            let rewritten_pattern = rewrite_bare_enum_pattern_child(
                env, pattern_for_rewrite)
            NamedPatternField {
                name: result_name,
                pattern: rewritten_pattern,
                span: result_span
            }
        }
    }
}

pub fn rewrite_bare_enum_bindings(env: TypeEnv, pattern: Pattern) -> Pattern {
    match pattern {
        Pattern::Binding { name, span } => {
            match env.types.variant_to_enum.get(name) {
                some(ve) => match env.types.enums.get(ve) {
                    some(edef) => {
                        let v = lookup_variant(edef, name)
                        match v {
                            some(found_v) => {
                                if found_v.fields.len() == 0 {
                                    let empty_pats: List<Pattern> = []
                                    let result_name = name
                                    let result_span = span
                                    Pattern::Constructor {
                                        name: result_name,
                                        qualifier: some(edef.name),
                                        fields: empty_pats,
                                        span: result_span
                                    }
                                } else {
                                    pattern
                                }
                            },
                            none => pattern,
                        }
                    },
                    none => pattern,
                },
                none => pattern,
            }
        },
        Pattern::TuplePattern { elements, span } => {
            let mut new_elems: List<Pattern> = []
            for elem in elements {
                let elem_for_rewrite = elem
                let rewritten_elem = rewrite_bare_enum_pattern_child(
                    env, elem_for_rewrite)
                new_elems.push(rewritten_elem)
            }
            let result_span = span
            Pattern::TuplePattern {
                elements: new_elems, span: result_span
            }
        },
        Pattern::Constructor { name, qualifier, fields, span } => {
            let mut new_fields: List<Pattern> = []
            for f in fields {
                let field_for_rewrite = f
                let rewritten_field = rewrite_bare_enum_pattern_child(
                    env, field_for_rewrite)
                new_fields.push(rewritten_field)
            }
            let canonical_qualifier = match qualifier {
                some(q) => match env.types.enums.get(q) {
                    some(edef) => some(edef.name), none => qualifier
                },
                none => env.types.variant_to_enum.get(name)
            }
            let result_name = name
            let result_span = span
            Pattern::Constructor {
                name: result_name,
                qualifier: canonical_qualifier,
                fields: new_fields,
                span: result_span
            }
        },
        Pattern::NamedConstructor { name, qualifier, fields, rest, span } => {
            let mut new_fields: List<NamedPatternField> = []
            for f in fields {
                let field_for_rewrite = f
                let rewritten_field = rewrite_bare_enum_named_field(
                    env, field_for_rewrite)
                new_fields.push(rewritten_field)
            }
            let canonical_enum = match qualifier {
                some(q) => match env.types.enums.get(q) {
                    some(edef) => some(edef.name), none => none
                },
                none => env.types.variant_to_enum.get(name)
            }
            match canonical_enum {
                some(ename) => {
                    let result_name = name
                    let result_enum_name = ename
                    let result_span = span
                    Pattern::NamedConstructor {
                        name: result_name,
                        qualifier: some(result_enum_name),
                        fields: new_fields,
                        rest: rest,
                        span: result_span
                    }
                },
                none => {
                    let struct_lookup = match qualifier {
                        some(q) => "${q}::${name}", none => name
                    }
                    match env.types.structs.get(struct_lookup) {
                        some(sdef) => {
                            let result_span = span
                            Pattern::NamedConstructor {
                                name: sdef.name,
                                qualifier: none,
                                fields: new_fields,
                                rest: rest,
                                span: result_span
                            }
                        },
                        none => {
                            let result_name = name
                            let result_qualifier = qualifier
                            let result_span = span
                            Pattern::NamedConstructor {
                                name: result_name,
                                qualifier: result_qualifier,
                                fields: new_fields,
                                rest: rest,
                                span: result_span
                            }
                        }
                    }
                }
            }
        },
        Pattern::OrPattern { patterns, span } => {
            let mut new_pats: List<Pattern> = []
            for p in patterns {
                let pattern_for_rewrite = p
                let rewritten_pattern = rewrite_bare_enum_pattern_child(
                    env, pattern_for_rewrite)
                new_pats.push(rewritten_pattern)
            }
            let result_span = span
            Pattern::OrPattern {
                patterns: new_pats, span: result_span
            }
        },
        _ => pattern,
    }
}
