use types::{Type, Effect, EffectRow, StructField, EnumVariant,
    INT, FLOAT, STR, BOOL, UNIT, NEVER, ANY, EMPTY_ROW,
    type_to_string, make_option_type, is_option_type, option_inner,
    type_to_builtin_name, effect_row, nominal_display_name, fn_meta,
    PARAM_OWNERSHIP_BORROW, PARAM_OWNERSHIP_MUT_BORROW,
    PARAM_OWNERSHIP_MOVE,
    CALLABLE_BORROW_OWNED, CALLABLE_SOURCE_BODY_INFERRED,
    fresh_callable_ownership_inference_term, record_callable_ownership}
use ast::{Program, Decl, Expr, Stmt, Param, MatchArm, StructFieldInit,
    EffectHandler, StringInterpPart, Pattern, BinOp, UnaryOp, TypeExpr,
    TypeParam, TypeBound, Span, UseDecl, DestructureBinding, span_zero,
    EffectOpDecl}
use hir::{HExpr, HStmt, HDecl, HParam, HMatchArm, HEffectHandler,
    HPatternBinding,
    HStructFieldInit, HStringInterpPart, HProgram, DerivedImpl,
    TraitDispatch, DictDispatchInfo, DictRef, TraitBound,
    HStructField, HEnumVariant, HEffectOp, HTraitMethod,
    HForInDestructure, HLetDestructureBinding, ValueBindingKind,
    trait_bound_param_name,
    BUILTIN_RANGE, BUILTIN_LIST, BUILTIN_MAP, BUILTIN_SET, BUILTIN_OPTION,
    hexpr_type, hexpr_effects, hexpr_span, hexpr_callable_def_id,
    expr_has_reachable_value,
    map_index_helper_identity,
    hparam_flags, hparam_flags_with_force}
use diagnostics::{DiagnosticContext, DiagnosticNote, CollectingSink, Severity, make_diag}
use codes::{E0201, E0203, E0206, E0301, E0303, E0304, E0305, E0306,
    E0307, E0308, E0309, E0402, E0411, E0503, E0601, E0705,
    E0801, W0001}
use union_find::{UnionFind, new_union_find, uf_insert}
use env::{TypeEnv, TypeScheme, StructDef, EnumDef, EffectDef,
    EffectOpDef, TraitDef, TraitMethodDef, ImplEntry, TypeAliasDef,
    BuiltInKind, mono, apply_subst, apply_subst_row, apply_subst_map,
    build_scheme_var_map, build_type_var_map, find_impl, lookup_variant,
    trait_is_authoritative_drop}
use unify::{unify, empty_subst}
use infer_ctx::{InferCtx, InferResult, FnBoundsEntry, CompileError,
    PendingDictPurpose,
    type_error, type_error_with_notes, merge_effects, unify_at, unify_at_noted, update_fn_effects,
    resolve_type_expr, resolve_self_type, resolve_named_type,
    bind_pattern, resolve_dict_ref_for_type,
    resolve_or_defer_dicts_from_scheme,
    register_callable_value_shadow,
    fresh_call_result_callable_def_id,
    pending_dict_checkpoint, has_pending_dicts_since,
    remove_fail_effect,
    generalize, free_type_vars, resolve_relative_qualifier}
use exhaustive::{check_exhaustive}
use infer_helpers::{MethodLookupResult, StmtResult,
    cancel_local_mut_effects, resolve_var_id,
    check_assign_target_mutable, find_root_expr, get_assign_target_root_def_id, get_hexpr_root_type,
    infer_ident, infer_numeric_op, is_primitive_ord,
    resolve_trait_dispatch, resolve_eq_dispatch,
    is_bounded_direct_callable_ident, resolve_callee_metadata,
    guard_pending_precheck_callable_summary,
    check_expr_is_let_def, get_expr_def_id, is_mut_method_call, check_receiver_mutability,
    lookup_impl_method, lookup_trait_method, callable_defaults_by_def_id,
    rewrite_bare_enum_bindings}
use zonk::{ZonkCtx, zonk_expr}

// ============================================================
// Block inference (from infer-stmt.ts)
// ============================================================

pub fn infer_block(mut ctx: InferCtx, body: Expr, initial_subst: UnionFind?) -> InferResult {
    match body {
        Expr::Block { stmts, tail, span } => {
            let mut subst = match initial_subst { some(s) => s, none => ctx.subst }
            let mut effects: EffectRow = EMPTY_ROW
            let mut hstmts: List<HStmt> = []

            for stmt in stmts {
                let sr = infer_stmt(ctx, stmt, subst)
                subst = sr.subst
                let me = merge_effects(ctx.sink, ctx.env, effects, sr.effects, subst, span)
                effects = me.0
                subst = me.1
                hstmts.push(sr.hstmt)
            }

            let mut tail_hexpr: HExpr? = none
            let mut block_type: Type = UNIT

            match tail {
                some(t) => {
                    let tr = infer_expr(ctx, t, subst)
                    subst = tr.subst
                    let me = merge_effects(ctx.sink, ctx.env, effects, tr.effects, subst, span)
                    effects = me.0
                    subst = me.1
                    tail_hexpr = some(tr.hexpr)
                    block_type = hexpr_type(tr.hexpr)
                },
                none => {}
            }

            let hblock_effects = effects
            let hblock_span = span
            let hblock = HExpr::Block {
                stmts: hstmts, tail: tail_hexpr,
                ty: block_type, effects: hblock_effects, span: hblock_span
            }
            InferResult { hexpr: hblock, subst: subst, effects: effects }
        },
        _ => panic("unreachable: infer_block called with non-block expression")
    }
}

// ============================================================
// Statement inference (from infer-stmt.ts)
// ============================================================

fn collect_bounded_callable_values_in_stmt(
    ctx: InferCtx, stmt: HStmt, mut found: List<HExpr>
) {
    match stmt {
        HStmt::Let { init, .. } => {
            let let_init = init
            collect_bounded_callable_values(ctx, let_init, found)
        },
        HStmt::Var { init, .. } => {
            let var_init = init
            collect_bounded_callable_values(ctx, var_init, found)
        },
        HStmt::Assign { target, value, .. } => {
            let assign_target = target
            collect_bounded_callable_values(ctx, assign_target, found)
            let assign_value = value
            collect_bounded_callable_values(ctx, assign_value, found)
        },
        HStmt::ExprStmt { expr, .. } => {
            let statement_expr = expr
            collect_bounded_callable_values(ctx, statement_expr, found)
        },
        HStmt::Return { value, .. } => match value {
            some(v) => {
                let return_value = v
                collect_bounded_callable_values(ctx, return_value, found)
            },
            none => {}
        },
        HStmt::While { condition, body, .. } => {
            let while_condition = condition
            collect_bounded_callable_values(ctx, while_condition, found)
            let while_body = body
            collect_bounded_callable_values(ctx, while_body, found)
        },
        HStmt::ForIn { iterable, body, .. } => {
            let for_iterable = iterable
            collect_bounded_callable_values(ctx, for_iterable, found)
            let for_body = body
            collect_bounded_callable_values(ctx, for_body, found)
        },
        HStmt::LetDestructure { init, .. } => {
            let destructure_init = init
            collect_bounded_callable_values(ctx, destructure_init, found)
        },
        HStmt::IfLet { expr, then_block, else_block, .. } => {
            let iflet_expr = expr
            collect_bounded_callable_values(ctx, iflet_expr, found)
            let iflet_then_block = then_block
            collect_bounded_callable_values(ctx, iflet_then_block, found)
            match else_block {
                some(block) => {
                    let iflet_else_block = block
                    collect_bounded_callable_values(
                        ctx, iflet_else_block, found)
                },
                none => {}
            }
        },
        HStmt::Break { .. } => {},
        HStmt::Continue { .. } => {},
        HStmt::Drop { .. } => {}
    }
}

fn collect_bounded_callable_values(
    ctx: InferCtx, expr: HExpr, mut found: List<HExpr>
) {
    match expr {
        HExpr::Ident { .. } => {
            if is_bounded_direct_callable_ident(ctx, expr) {
                found.push(expr)
            }
        },
        HExpr::BinOp { left, right, .. } => {
            let bin_left = left
            collect_bounded_callable_values(ctx, bin_left, found)
            let bin_right = right
            collect_bounded_callable_values(ctx, bin_right, found)
        },
        HExpr::UnaryOp { operand, .. } => {
            let unary_operand = operand
            collect_bounded_callable_values(ctx, unary_operand, found)
        },
        HExpr::Call { callee, args, .. } => {
            // A bare Ident callee is a direct invocation, not a function value.
            match callee {
                HExpr::Ident { .. } => {},
                _ => {
                    let callable_callee = callee
                    collect_bounded_callable_values(
                        ctx, callable_callee, found)
                }
            }
            for arg in args {
                let call_arg = arg
                collect_bounded_callable_values(ctx, call_arg, found)
            }
        },
        HExpr::FieldAccess { receiver, .. } => {
            let field_receiver = receiver
            collect_bounded_callable_values(ctx, field_receiver, found)
        },
        HExpr::StructLit { fields, spread, .. } => {
            for field in fields {
                collect_bounded_callable_values(ctx, field.value, found)
            }
            match spread {
                some(value) => {
                    let struct_spread = value
                    collect_bounded_callable_values(ctx, struct_spread, found)
                },
                none => {}
            }
        },
        HExpr::NamedVariantConstruct { fields, spread, .. } => {
            for field in fields {
                collect_bounded_callable_values(ctx, field.value, found)
            }
            match spread {
                some(value) => {
                    let variant_spread = value
                    collect_bounded_callable_values(ctx, variant_spread, found)
                },
                none => {}
            }
        },
        HExpr::MatchExpr { scrutinee, arms, .. } => {
            let match_scrutinee = scrutinee
            collect_bounded_callable_values(ctx, match_scrutinee, found)
            for arm in arms {
                match arm.guard {
                    some(guard) => {
                        let match_guard = guard
                        collect_bounded_callable_values(ctx, match_guard, found)
                    },
                    none => {}
                }
                collect_bounded_callable_values(ctx, arm.body, found)
            }
        },
        HExpr::Block { stmts, tail, .. } => {
            for stmt in stmts {
                collect_bounded_callable_values_in_stmt(ctx, stmt, found)
            }
            match tail {
                some(value) => {
                    let block_tail = value
                    collect_bounded_callable_values(ctx, block_tail, found)
                },
                none => {}
            }
        },
        HExpr::IfExpr { condition, then_branch, else_branch, .. } => {
            let if_condition = condition
            collect_bounded_callable_values(ctx, if_condition, found)
            let if_then_branch = then_branch
            collect_bounded_callable_values(ctx, if_then_branch, found)
            match else_branch {
                some(value) => {
                    let if_else_branch = value
                    collect_bounded_callable_values(ctx, if_else_branch, found)
                },
                none => {}
            }
        },
        HExpr::StringInterp { parts, .. } => {
            for part in parts {
                match part {
                    HStringInterpPart::Expression(value) => {
                        let interpolation_value = value
                        collect_bounded_callable_values(
                            ctx, interpolation_value, found)
                    },
                    _ => {}
                }
            }
        },
        HExpr::TryCatch { body, arms, .. } => {
            let catch_body = body
            collect_bounded_callable_values(ctx, catch_body, found)
            for arm in arms {
                match arm.guard {
                    some(guard) => {
                        let catch_guard = guard
                        collect_bounded_callable_values(ctx, catch_guard, found)
                    },
                    none => {}
                }
                collect_bounded_callable_values(ctx, arm.body, found)
            }
        },
        HExpr::HandleExpr { body, handlers, .. } => {
            let handle_body = body
            collect_bounded_callable_values(ctx, handle_body, found)
            for handler in handlers {
                collect_bounded_callable_values(ctx, handler.body, found)
            }
        },
        HExpr::Lambda { body, .. } => {
            let lambda_body = body
            collect_bounded_callable_values(ctx, lambda_body, found)
        },
        HExpr::EffectOp { args, .. } => {
            for arg in args {
                let effect_arg = arg
                collect_bounded_callable_values(ctx, effect_arg, found)
            }
        },
        HExpr::RangeExpr { start, end, .. } => {
            let range_start = start
            collect_bounded_callable_values(ctx, range_start, found)
            let range_end = end
            collect_bounded_callable_values(ctx, range_end, found)
        },
        HExpr::ListLit { elements, .. } => {
            for element in elements {
                let list_element = element
                collect_bounded_callable_values(ctx, list_element, found)
            }
        },
        // Keep this separate from ListLit. LLVM OrPattern lowering does not
        // bind payload fields, so a shared arm leaks `elements` into codegen.
        HExpr::TupleLit { elements, .. } => {
            for element in elements {
                let tuple_element = element
                collect_bounded_callable_values(ctx, tuple_element, found)
            }
        },
        HExpr::IndexExpr { receiver, index, .. } => {
            let index_receiver = receiver
            collect_bounded_callable_values(ctx, index_receiver, found)
            let index_value = index
            collect_bounded_callable_values(ctx, index_value, found)
        },
        HExpr::Clone { inner, .. } => {
            let clone_operand = inner
            collect_bounded_callable_values(ctx, clone_operand, found)
        },
        HExpr::Take { .. } => {},
        HExpr::ReturnExpr { value, .. } => match value {
            some(inner) => {
                let returned_inner = inner
                collect_bounded_callable_values(ctx, returned_inner, found)
            },
            none => {}
        },
        HExpr::UnsafeBlock { body, .. } => {
            let unsafe_body = body
            collect_bounded_callable_values(ctx, unsafe_body, found)
        },
        HExpr::IntLit { .. } => {},
        HExpr::FloatLit { .. } => {},
        HExpr::StrLit { .. } => {},
        HExpr::BoolLit { .. } => {},
        HExpr::DictConstruct { .. } => {}
    }
}

fn hexpr_contains_bounded_callable_value(ctx: InferCtx, expr: HExpr) -> Bool {
    let found: List<HExpr> = []
    let root_expr = expr
    collect_bounded_callable_values(ctx, root_expr, found)
    found.len() > 0
}

// Register each exact DefId/live-scheme callable value once for its owner.
// The shadow shares the canonical evidence/assoc resolver with calls but never
// attaches DictRefs; resolve_value_ident remains the final-zonk authority.
fn register_bounded_callable_value_shadows_inner(
    mut ctx: InferCtx, expr: HExpr, s: UnionFind, is_default: Bool
) {
    let found: List<HExpr> = []
    let shadow_root_expr = expr
    collect_bounded_callable_values(ctx, shadow_root_expr, found)
    for callable in found {
        match resolve_callee_metadata(ctx, callable) {
            some(metadata) => match metadata.kind {
                ValueBindingKind::DirectCallable |
                ValueBindingKind::ExternCallable => {
                    if metadata.live_scheme.bounds.len() > 0 {
                        register_callable_value_shadow(
                            ctx, metadata.live_scheme,
                            hexpr_type(callable), s,
                            hexpr_span(callable), is_default)
                    }
                },
                ValueBindingKind::ConstGetter |
                ValueBindingKind::LocalBorrow => {
                }
            },
            none => {}
        }
    }
}

pub fn register_bounded_callable_value_shadows(
    ctx: InferCtx, expr: HExpr, s: UnionFind
) {
    register_bounded_callable_value_shadows_inner(ctx, expr, s, false)
}

pub fn register_default_bounded_callable_value_shadows(
    ctx: InferCtx, expr: HExpr, s: UnionFind
) {
    register_bounded_callable_value_shadows_inner(ctx, expr, s, true)
}

// B-163 C': non-Range for-in is lowered while inference still owns the
// authoritative trait registry, method schemes, dictionaries, and effects.
// These helpers deliberately validate a named protocol before invoking the
// ordinary method-call inference path; an inherent same-spelled method cannot
// manufacture Iterable/Iterator evidence.
fn require_for_protocol_impl(
    mut ctx: InferCtx, ty: Type, trait_name: Str,
    subst: UnionFind, span: Span
) -> ImplEntry {
    let concrete = apply_subst(subst, ty)
    match concrete {
        Type::TypeVar { .. } => {
            let trait_display = nominal_display_name(trait_name)
            let _ = type_error(ctx.sink, E0503,
                "for..in cannot lower abstract '${type_to_string(concrete)}: ${trait_display}' until associated iterator evidence is available",
                span, DiagnosticContext::TraitError { detail: "associated iterator dictionary evidence is unavailable" })
            fail.raise(CompileError {})
        },
        _ => {}
    }

    let type_name = match type_to_builtin_name(concrete) {
        some(name) => name,
        none => {
            let _ = type_error(ctx.sink, E0301,
                "for..in requires '${type_to_string(concrete)}' to implement '${nominal_display_name(trait_name)}'",
                span, DiagnosticContext::TraitError { detail: "iteration protocol requires a named implementation" })
            fail.raise(CompileError {})
        }
    }
    let impl_entry = match find_impl(ctx.env.trait_reg, type_name, trait_name) {
        some(entry) => entry,
        none => {
            let _ = type_error(ctx.sink, E0301,
                "for..in requires an iterable type (one that implements '${nominal_display_name(trait_name)}'), got ${type_to_string(concrete)}",
                span, DiagnosticContext::TraitError { detail: "same-spelled inherent methods do not satisfy the iteration protocol" })
            fail.raise(CompileError {})
        }
    }

    // Resolve the actual impl evidence now. This catches missing nested bounds
    // before lowering and never lets a later backend guess a dictionary.
    match resolve_dict_ref_for_type(
        ctx.env, ctx.current_fn_bounds, concrete, subst, trait_name
    ) {
        some(_) => impl_entry,
        none => {
            let _ = type_error(ctx.sink, E0503,
                "Cannot resolve '${nominal_display_name(trait_name)}' evidence for '${type_to_string(concrete)}'",
                span, DiagnosticContext::TraitError { detail: "iteration protocol dictionary evidence is unavailable" })
            fail.raise(CompileError {})
        }
    }
}

fn for_protocol_method_scheme(
    mut ctx: InferCtx, impl_entry: ImplEntry, method: Str, span: Span
) -> TypeScheme {
    match impl_entry.method_schemes.get(method) {
        some(scheme) => {
            let exact_scheme = scheme
            exact_scheme
        },
        none => {
            let _ = type_error(ctx.sink, E0305,
                "Iteration protocol implementation '${nominal_display_name(impl_entry.target_type_name)}' has no exact '${nominal_display_name(impl_entry.trait_name)}::${method}' method scheme",
                span, DiagnosticContext::TraitError {
                    detail: "protocol lowering does not fall back to default or flat method tables"
                })
            fail.raise(CompileError {})
        }
    }
}

struct MethodCallSelection {
    method_type: Type?,
    method_scheme: TypeScheme?,
    instantiation_map: Map<Int, Type>,
    dict_dispatch: DictDispatchInfo?,
    is_authoritative_drop: Bool
}

// Resolve an already-authoritative protocol impl into the same input consumed
// by ordinary method-call inference. No trait declaration reconstruction and
// no flat last-writer splice is permitted here: the exact ImplEntry scheme is
// the complete receiver/result/effect/bounds identity.
fn select_for_protocol_method(
    mut ctx: InferCtx, impl_entry: ImplEntry, method: Str, span: Span
) -> MethodCallSelection {
    let impl_scheme = for_protocol_method_scheme(ctx, impl_entry, method, span)
    let instantiation = ctx.env.instantiate_with_map(impl_scheme)
    MethodCallSelection {
        method_type: some(instantiation.ty),
        method_scheme: some(impl_scheme),
        instantiation_map: instantiation.var_map,
        dict_dispatch: none,
        is_authoritative_drop: impl_entry.is_authoritative_drop
    }
}

fn for_protocol_call_method_type(mut ctx: InferCtx, call: HExpr, span: Span) -> Type {
    match call {
        HExpr::Call { callee, .. } => match callee {
            HExpr::FieldAccess { ty, .. } => {
                let exact_method_type = ty
                exact_method_type
            },
            _ => {
                let _ = type_error(ctx.sink, E0305,
                    "Internal iteration lowering expected a method call",
                    span, DiagnosticContext::OtherContext { detail: some("protocol call lost method provenance") })
                fail.raise(CompileError {})
            }
        },
        _ => {
            let _ = type_error(ctx.sink, E0305,
                "Internal iteration lowering expected a call expression",
                span, DiagnosticContext::OtherContext { detail: some("protocol call was not lowered as an ordinary call") })
            fail.raise(CompileError {})
        }
    }
}

// Instantiate an impl-associated type through the exact method scheme that
// ordinary call inference instantiated. build_scheme_var_map follows scheme
// variable identity through the receiver/return structure; there is no
// positional associated-type substitution here.
fn for_protocol_assoc_type(
    mut ctx: InferCtx, impl_entry: ImplEntry, method: Str,
    assoc_name: Str, call: HExpr, subst: UnionFind, span: Span
) -> Type {
    let raw_assoc = match impl_entry.assoc_types.get(assoc_name) {
        some(ty) => ty,
        none => {
            let _ = type_error(ctx.sink, E0301,
                "Iteration protocol '${nominal_display_name(impl_entry.trait_name)}' implementation for '${nominal_display_name(impl_entry.target_type_name)}' is missing associated type '${assoc_name}'",
                span, DiagnosticContext::TraitError { detail: "protocol associated type is missing" })
            fail.raise(CompileError {})
        }
    }
    let scheme = for_protocol_method_scheme(ctx, impl_entry, method, span)
    let instantiated_method = for_protocol_call_method_type(ctx, call, span)
    let var_map = build_scheme_var_map(
        ctx.env.types.ownership_metadata, scheme, instantiated_method)
    apply_subst(subst, apply_subst_map(var_map, raw_assoc))
}

pub fn infer_stmt(mut ctx: InferCtx, stmt: Stmt, subst: UnionFind) -> StmtResult {
    match stmt {
        Stmt::Let { name, name_span, type_annotation, init, span } => {
            let obligation_checkpoint = pending_dict_checkpoint(ctx)
            let init_r = infer_expr(ctx, init, subst)
            let mut s = init_r.subst
            let mut var_type = hexpr_type(init_r.hexpr)
            match type_annotation {
                some(ta) => {
                    let annotated = resolve_type_expr(ctx, ta)
                    let declared_name_span = name_span
                    let notes: List<DiagnosticNote> = [
                        DiagnosticNote { message: "expected '${type_to_string(annotated)}' because variable '${name}' is declared with this type", span: some(declared_name_span) },
                        DiagnosticNote { message: "initializer has type '${type_to_string(apply_subst(s, var_type))}'", span: some(hexpr_span(init_r.hexpr)) }
                    ]
                    s = unify_at_noted(ctx.sink, ctx.env, var_type, annotated, s, span, notes)
                    var_type = apply_subst(s, annotated)
                },
                none => {}
            }
            let resolved = apply_subst(s, var_type)
            // A bounded direct callable hidden anywhere in a value position
            // must stay monomorphic until later uses determine its concrete
            // evidence. The DefId walk is shadow-safe and deliberately skips
            // only a bare direct-call callee.
            let init_has_bounds =
                hexpr_contains_bounded_callable_value(ctx, init_r.hexpr)
            // An initializer that created deferred evidence is a monomorphic
            // barrier.  Later statements must constrain the same variables;
            // generalizing here would detach the obligation from its value.
            let init_has_pending =
                has_pending_dicts_since(ctx, obligation_checkpoint)
            // Optimization: skip the expensive free_type_vars_in_env scan when the resolved
            // type is ground (no type variables). Most function-local let bindings have ground
            // types, so this avoids a full env scan on each one.
            let ftv = free_type_vars(resolved, empty_subst())
            let scheme_type = resolved
            let scheme = if ftv.len() == 0 || init_has_bounds || init_has_pending {
                mono(scheme_type)
            } else {
                generalize(ctx.env, scheme_type, s)
            }
            let binding_name = name
            ctx.env.bind(binding_name, scheme)
            let bound_scheme = ctx.env.lookup(name)
            let bound_def_id: Int? = match bound_scheme {
                some(bs) => {
                    match bs.def_id {
                        some(did) => {
                            let span_def_id = did
                            let let_def_id = did
                            let lambda_depth_def_id = did
                            let result_def_id = did
                            let def_name_span = name_span
                            ctx.env.record_def_span(
                                span_def_id, def_name_span)
                            ctx.env.scope.let_defs.insert(let_def_id)
                            ctx.var_lambda_depth.insert(
                                lambda_depth_def_id, ctx.lambda_depth)
                            some(result_def_id)
                        },
                        none => none
                    }
                },
                none => none
            }
            let hlet_name = name
            let hlet_name_span = name_span
            let hlet_span = span
            StmtResult {
                hstmt: HStmt::Let {
                    name: hlet_name, name_span: hlet_name_span,
                    def_id: bound_def_id, ty: resolved,
                    init: init_r.hexpr, span: hlet_span
                },
                subst: s,
                effects: init_r.effects
            }
        },
        Stmt::Var { name, name_span, type_annotation, init, span } => {
            let init_r = infer_expr(ctx, init, subst)
            let mut s = init_r.subst
            let mut var_type = hexpr_type(init_r.hexpr)
            match type_annotation {
                some(ta) => {
                    let annotated = resolve_type_expr(ctx, ta)
                    let declared_name_span = name_span
                    let notes: List<DiagnosticNote> = [
                        DiagnosticNote { message: "expected '${type_to_string(annotated)}' because variable '${name}' is declared with this type", span: some(declared_name_span) },
                        DiagnosticNote { message: "initializer has type '${type_to_string(apply_subst(s, var_type))}'", span: some(hexpr_span(init_r.hexpr)) }
                    ]
                    s = unify_at_noted(ctx.sink, ctx.env, var_type, annotated, s, span, notes)
                    var_type = apply_subst(s, annotated)
                },
                none => {}
            }
            let binding_name = name
            ctx.env.bind_mono(binding_name, apply_subst(s, var_type))
            let var_scheme = ctx.env.lookup(name)
            match var_scheme {
                some(vs) => {
                    match vs.def_id {
                        some(did) => {
                            let span_def_id = did
                            let mutable_def_id = did
                            let lambda_depth_def_id = did
                            let def_name_span = name_span
                            ctx.env.record_def_span(
                                span_def_id, def_name_span)
                            ctx.env.scope.mutable_vars.insert(mutable_def_id)
                            ctx.var_lambda_depth.insert(
                                lambda_depth_def_id, ctx.lambda_depth)
                        },
                        none => {}
                    }
                    let hvar_name = name
                    let hvar_name_span = name_span
                    let hvar_span = span
                    StmtResult {
                        hstmt: HStmt::Var {
                            name: hvar_name, name_span: hvar_name_span,
                            def_id: vs.def_id, ty: apply_subst(s, var_type),
                            init: init_r.hexpr, span: hvar_span
                        },
                        subst: s,
                        effects: init_r.effects
                    }
                },
                none => panic("unreachable: var_stmt lookup failed after bind")
            }
        },
        Stmt::Assign { target, value, span } => {
            check_assign_target_mutable(ctx, target)
            let target_r = infer_expr(ctx, target, subst)
            let value_r = infer_expr(ctx, value, target_r.subst)
            let assign_notes: List<DiagnosticNote> = [
                DiagnosticNote { message: "target has type '${type_to_string(apply_subst(value_r.subst, hexpr_type(target_r.hexpr)))}'", span: some(hexpr_span(target_r.hexpr)) },
                DiagnosticNote { message: "assigned value has type '${type_to_string(apply_subst(value_r.subst, hexpr_type(value_r.hexpr)))}'", span: some(hexpr_span(value_r.hexpr)) }
            ]
            let mut s = unify_at_noted(ctx.sink, ctx.env, hexpr_type(target_r.hexpr), hexpr_type(value_r.hexpr), value_r.subst, span, assign_notes)
            let me = merge_effects(ctx.sink, ctx.env, target_r.effects, value_r.effects, s, span)
            s = me.1
            let mut effects = me.0
            // B-056: Inject mut<T> effect when assigning to a captured outer mutable variable
            match get_assign_target_root_def_id(ctx, target) {
                some(did) => {
                    if ctx.env.scope.mutable_vars.contains(did) {
                        match ctx.var_lambda_depth.get(did) {
                            some(def_depth) => {
                                if ctx.lambda_depth > def_depth {
                                    let var_type = apply_subst(s, get_hexpr_root_type(target_r.hexpr))
                                    let mut_eff = Effect::MutEffect { state_type: var_type }
                                    let me2 = merge_effects(ctx.sink, ctx.env, effects, effect_row([mut_eff]), s, span)
                                    effects = me2.0
                                    s = me2.1
                                }
                            },
                            none => {}
                        }
                    }
                },
                none => {}
            }
            let assign_stmt_span = span
            StmtResult {
                hstmt: HStmt::Assign {
                    target: target_r.hexpr, value: value_r.hexpr,
                    span: assign_stmt_span
                },
                subst: s,
                effects: effects
            }
        },
        Stmt::ExprStmt { expr, span, .. } => {
            let r = infer_expr(ctx, expr, subst)
            let expr_stmt_span = span
            StmtResult {
                hstmt: HStmt::ExprStmt {
                    expr: r.hexpr, span: expr_stmt_span
                },
                subst: r.subst,
                effects: r.effects
            }
        },
        Stmt::Return { value, span } => match value {
            some(v) => {
                let r = infer_expr(ctx, v, subst)
                let mut s = r.subst
                match ctx.current_fn_return_type {
                    some(ret_type) => {
                        let return_notes: List<DiagnosticNote> = [
                            DiagnosticNote { message: "function return type is '${type_to_string(apply_subst(s, ret_type))}'", span: none },
                            DiagnosticNote { message: "return value has type '${type_to_string(apply_subst(s, hexpr_type(r.hexpr)))}'", span: some(hexpr_span(r.hexpr)) }
                        ]
                        s = unify_at_noted(ctx.sink, ctx.env, hexpr_type(r.hexpr), ret_type, s, span, return_notes)
                    },
                    none => {}
                }
                let return_stmt_span = span
                StmtResult {
                    hstmt: HStmt::Return {
                        value: some(r.hexpr), span: return_stmt_span
                    },
                    subst: s,
                    effects: r.effects
                }
            },
            none => {
                let mut s = subst
                match ctx.current_fn_return_type {
                    some(ret_type) => {
                        s = unify_at(ctx.sink, ctx.env, UNIT, ret_type, s, span)
                    },
                    none => {}
                }
                let return_stmt_span = span
                StmtResult {
                    hstmt: HStmt::Return {
                        value: none, span: return_stmt_span
                    },
                    subst: s,
                    effects: EMPTY_ROW
                }
            }
        },
        Stmt::While { condition, body, span } => {
            let cond_r = infer_expr(ctx, condition, subst)
            let mut s = unify_at(ctx.sink, ctx.env, hexpr_type(cond_r.hexpr), BOOL, cond_r.subst, span)
            ctx.env.push_scope()
            ctx.loop_depth = ctx.loop_depth + 1
            let body_result = some({
                let while_body_subst = s
                infer_block(ctx, body, some(while_body_subst))
            }) catch { _ => none }
            ctx.loop_depth = ctx.loop_depth - 1
            ctx.env.pop_scope()
            match body_result {
                some(body_r) => {
                    s = body_r.subst
                    let me = merge_effects(ctx.sink, ctx.env, cond_r.effects, body_r.effects, s, span)
                    let while_stmt_span = span
                    StmtResult {
                        hstmt: HStmt::While {
                            condition: cond_r.hexpr, body: body_r.hexpr,
                            span: while_stmt_span
                        },
                        subst: me.1,
                        effects: me.0
                    }
                },
                none => fail.raise(CompileError {})
            }
        },
        Stmt::ForIn { binding, binding_span, destructure, iterable, body, span } => {
            let iter_r = infer_expr(ctx, iterable, subst)
            let mut s = iter_r.subst
            let iter_type = apply_subst(s, hexpr_type(iter_r.hexpr))
            let mut element_type: Type = ctx.env.fresh_var()
            // Check for Range (builtin, keep special path)
            let is_range = match iter_type {
                Type::EnumType { name, .. } => name == BUILTIN_RANGE,
                _ => false
            }
            if !is_range {
                let protocol_binding = binding
                let protocol_binding_span = binding_span
                let protocol_span = span
                return lower_protocol_for_in(
                    ctx, protocol_binding, protocol_binding_span,
                    destructure, iter_r, body, protocol_span
                )
            }
            match iter_type {
                Type::EnumType { type_params, .. } => {
                    element_type = match type_params.first() { some(t) => t, none => INT }
                },
                _ => {}
            }

            ctx.env.push_scope()
            let mut hdestructure: List<HForInDestructure>? = none
            match destructure {
                some(destr) => {
                    match element_type {
                        Type::TupleType { elements: type_elems } => {
                            if destr.names.len() != type_elems.len() {
                                let _ = type_error(ctx.sink, E0301,
                                    "Destructure binding expects ${destr.names.len().to_str()} elements, but iterable element type is ${type_to_string(element_type)}",
                                    span, DiagnosticContext::OtherContext { detail: some("tuple arity mismatch") })
                            }
                        },
                        _ => {
                            let _ = type_error(ctx.sink, E0301,
                                "Destructure binding expects tuple elements, but iterable element type is ${type_to_string(element_type)}",
                                span, DiagnosticContext::OtherContext { detail: some("tuple arity mismatch") })
                        }
                    }
                    let mut hd: List<HForInDestructure> = []
                    let mut di = 0
                    while di < destr.names.len() {
                        match destr.names.get(di) {
                            some(dname) => {
                                let elem_t = match element_type {
                                    Type::TupleType { elements: type_elems } => match type_elems.get(di) {
                                        some(et) => et,
                                        none => ctx.env.fresh_var()
                                    },
                                    _ => ctx.env.fresh_var()
                                }
                                let destructure_binding_name = dname
                                ctx.env.bind_mono(destructure_binding_name, elem_t)
                                let dscheme = ctx.env.lookup(dname)
                                match dscheme {
                                    some(ds) => {
                                        match (ds.def_id, destr.spans.get(di)) {
                                            (some(did), some(dspan)) => {
                                                let span_def_id = did
                                                let lambda_depth_def_id = did
                                                let destructure_name_span = dspan
                                                ctx.env.record_def_span(
                                                    span_def_id,
                                                    destructure_name_span)
                                                ctx.var_lambda_depth.insert(
                                                    lambda_depth_def_id,
                                                    ctx.lambda_depth)
                                            },
                                            _ => {}
                                        }
                                        let destructure_name = dname
                                        hd.push(HForInDestructure {
                                            name: destructure_name,
                                            def_id: ds.def_id
                                        })
                                    },
                                    none => {
                                        let destructure_name = dname
                                        hd.push(HForInDestructure {
                                            name: destructure_name,
                                            def_id: none
                                        })
                                    }
                                }
                            },
                            none => {}
                        }
                        di = di + 1
                    }
                    hdestructure = some(hd)
                },
                none => {
                    let loop_binding_name = binding
                    ctx.env.bind_mono(loop_binding_name, element_type)
                }
            }
            let binding_scheme = ctx.env.lookup(binding)
            match binding_scheme {
                some(bs) => match bs.def_id {
                    some(did) => {
                        let span_def_id = did
                        let lambda_depth_def_id = did
                        let loop_binding_span = binding_span
                        ctx.env.record_def_span(
                            span_def_id, loop_binding_span)
                        ctx.var_lambda_depth.insert(
                            lambda_depth_def_id, ctx.lambda_depth)
                    },
                    none => {}
                },
                none => {}
            }
            ctx.loop_depth = ctx.loop_depth + 1
            let body_result = some({
                let for_body_subst = s
                infer_block(ctx, body, some(for_body_subst))
            }) catch { _ => none }
            ctx.loop_depth = ctx.loop_depth - 1
            ctx.env.pop_scope()
            match body_result {
                some(body_r) => {
                    s = body_r.subst
                    let me = merge_effects(ctx.sink, ctx.env, iter_r.effects, body_r.effects, s, span)
                    let hfor_binding = binding
                    let hfor_binding_span = binding_span
                    let hfor_span = span
                    StmtResult {
                        hstmt: HStmt::ForIn {
                            binding: hfor_binding,
                            binding_span: hfor_binding_span,
                            def_id: match binding_scheme { some(bs) => bs.def_id, none => none },
                            destructure: hdestructure,
                            iterable: iter_r.hexpr, body: body_r.hexpr,
                            iterable_type_name: none,
                            iter_type_name: none,
                            span: hfor_span
                        },
                        subst: me.1,
                        effects: me.0
                    }
                },
                none => fail.raise(CompileError {})
            }
        },
        Stmt::Break { span } => {
            if ctx.loop_depth == 0 {
                let _ = type_error(ctx.sink, E0206, "'break' can only be used inside a loop", span,
                    DiagnosticContext::OtherContext { detail: some("break outside loop") })
            }
            let break_span = span
            StmtResult {
                hstmt: HStmt::Break { span: break_span },
                subst: subst, effects: EMPTY_ROW
            }
        },
        Stmt::Continue { span } => {
            if ctx.loop_depth == 0 {
                let _ = type_error(ctx.sink, E0206, "'continue' can only be used inside a loop", span,
                    DiagnosticContext::OtherContext { detail: some("continue outside loop") })
            }
            let continue_span = span
            StmtResult {
                hstmt: HStmt::Continue { span: continue_span },
                subst: subst, effects: EMPTY_ROW
            }
        },
        Stmt::LetDestructure { pattern, init, span } => {
            let init_r = infer_expr(ctx, init, subst)
            let mut s = init_r.subst
            let init_type = apply_subst(s, hexpr_type(init_r.hexpr))
            match init_type {
                Type::TupleType { .. } => {},
                _ => { let _ = type_error(ctx.sink, E0301,
                    "let destructuring requires tuple type, got ${type_to_string(init_type)}",
                    span, DiagnosticContext::OtherContext { detail: some("not a tuple") }) }
            }
            let tuple_elements: List<Type> = match init_type {
                Type::TupleType { elements } => elements,
                _ => []
            }
            match pattern {
                Pattern::TuplePattern { elements: pat_elements, .. } => {
                    if pat_elements.len() != tuple_elements.len() {
                        let _ = type_error(ctx.sink, E0301,
                            "Tuple has ${tuple_elements.len().to_str()} elements but pattern has ${pat_elements.len().to_str()}",
                            span, DiagnosticContext::OtherContext { detail: some("tuple arity mismatch") })
                    }
                    let mut bindings: List<HLetDestructureBinding> = []
                    let mut bi = 0
                    while bi < pat_elements.len() {
                        match pat_elements.get(bi) {
                            some(p) => {
                                let elem_type = match tuple_elements.get(bi) { some(et) => et, none => UNIT }
                                match p {
                                    Pattern::Binding { name, span: pspan } => {
                                        let tuple_binding_name = name
                                        let tuple_binding_type = elem_type
                                        ctx.env.bind_mono(tuple_binding_name, tuple_binding_type)
                                        let bscheme = ctx.env.lookup(name)
                                        match bscheme {
                                            some(bs) => {
                                                match bs.def_id {
                                                    some(did) => {
                                                        let span_def_id = did
                                                        let let_def_id = did
                                                        let pattern_name_span = pspan
                                                        ctx.env.record_def_span(
                                                            span_def_id,
                                                            pattern_name_span)
                                                        ctx.env.scope.let_defs.insert(
                                                            let_def_id)
                                                    },
                                                    none => {}
                                            }
                                                let destructure_name = name
                                                bindings.push(
                                                    HLetDestructureBinding {
                                                        name: destructure_name,
                                                        def_id: bs.def_id,
                                                        ty: elem_type
                                                    })
                                            },
                                            none => {
                                                let destructure_name = name
                                                bindings.push(
                                                    HLetDestructureBinding {
                                                        name: destructure_name,
                                                        def_id: none,
                                                        ty: elem_type
                                                    })
                                            }
                                        }
                                    },
                                    Pattern::Wildcard { .. } => {
                                        bindings.push(HLetDestructureBinding { name: "_", def_id: none, ty: elem_type })
                                    },
                                    _ => {
                                        let _ = type_error(ctx.sink, E0301,
                                            "Only binding and wildcard patterns are supported in let destructuring",
                                            span, DiagnosticContext::OtherContext { detail: some("unsupported pattern kind") })
                                    }
                                }
                            },
                            none => {}
                        }
                        bi = bi + 1
                    }
                    let destructure_pattern = pattern
                    let destructure_stmt_span = span
                    StmtResult {
                        hstmt: HStmt::LetDestructure {
                            pattern: destructure_pattern,
                            bindings: bindings, init: init_r.hexpr,
                            span: destructure_stmt_span
                        },
                        subst: s,
                        effects: init_r.effects
                    }
                },
                _ => {
                    let _ = type_error(ctx.sink, E0301,
                        "let destructuring requires tuple pattern",
                        span, DiagnosticContext::OtherContext { detail: some("not a tuple pattern") })
                    let literal_span = span
                    let expr_stmt_span = span
                    StmtResult {
                        hstmt: HStmt::ExprStmt {
                            expr: HExpr::IntLit {
                                value: 0, ty: UNIT,
                                effects: EMPTY_ROW, span: literal_span
                            },
                            span: expr_stmt_span
                        },
                        subst: s,
                        effects: init_r.effects
                    }
                }
            }
        },
        Stmt::IfLet { pattern, expr, then_block, else_block, span } => {
            let expr_r = infer_expr(ctx, expr, subst)
            let iflet_pattern = pattern
            let iflet_span = span
            infer_if_let_from_result(
                ctx, iflet_pattern, expr_r,
                then_block, else_block, iflet_span)
        }
    }
}

fn infer_if_let_from_result(
    mut ctx: InferCtx, pattern: Pattern, expr_r: InferResult,
    then_block: Expr, else_block: Expr?, span: Span
) -> StmtResult {
    let mut s = expr_r.subst
    let expr_type = apply_subst(s, hexpr_type(expr_r.hexpr))
    let iflet_pattern = rewrite_bare_enum_bindings(ctx.env, pattern)

    let mut pattern_bindings: List<HPatternBinding> = []
    ctx.env.push_scope()
    let then_result = some({
        let pattern_subst = s
        s = bind_pattern(ctx, iflet_pattern, expr_type, pattern_subst)
        pattern_bindings = exact_pattern_bindings(ctx.env, iflet_pattern)
        let then_subst = s
        infer_block(ctx, then_block, some(then_subst))
    }) catch { _ => none }
    ctx.env.pop_scope()

    match then_result {
        some(then_r) => {
            s = then_r.subst
            let mut combined = merge_effects(
                ctx.sink, ctx.env, expr_r.effects, then_r.effects,
                s, span)
            let mut combined_effects = combined.0
            s = combined.1

            let mut else_hblock: HExpr? = none
            match else_block {
                some(eb) => {
                    ctx.env.push_scope()
                    let else_result = some({
                        let else_subst = s
                        infer_block(ctx, eb, some(else_subst))
                    }) catch { _ => none }
                    ctx.env.pop_scope()
                    match else_result {
                        some(else_r) => {
                            s = else_r.subst
                            else_hblock = some(else_r.hexpr)
                            let me2 = merge_effects(
                                ctx.sink, ctx.env, combined_effects,
                                else_r.effects, s, span)
                            combined_effects = me2.0
                            s = me2.1
                        },
                        none => fail.raise(CompileError {})
                    }
                },
                none => {}
            }

            StmtResult {
                hstmt: HStmt::IfLet {
                    pattern: iflet_pattern, bindings: pattern_bindings,
                    expr: expr_r.hexpr,
                    then_block: then_r.hexpr,
                    else_block: else_hblock, span: span
                },
                subst: s,
                effects: combined_effects
            }
        },
        none => fail.raise(CompileError {})
    }
}

fn lower_protocol_for_in(
    mut ctx: InferCtx, binding: Str, binding_span: Span,
    destructure: DestructureBinding?, iterable_result: InferResult,
    body: Expr, span: Span
) -> StmtResult {
    let mut s = iterable_result.subst
    let collection_type = apply_subst(s, hexpr_type(iterable_result.hexpr))

    // The generated locals live in one ordinary lexical block. Catch only to
    // guarantee that the synthetic scope is popped before propagating a
    // declaration-level CompileError.
    ctx.env.push_scope()
    let lowered_result: StmtResult? = some({
        let iterable_impl = require_for_protocol_impl(
            ctx, collection_type, "Iterable", s, span)

        let iterable_selection = select_for_protocol_method(
            ctx, iterable_impl, "iter", span)
        let iter_call_span = span
        let iter_call_result = infer_method_call_from_receiver(
            ctx, none, iterable_result, "iter", [], iter_call_span,
            some(iterable_selection))
        s = iter_call_result.subst

        let associated_iter_type = for_protocol_assoc_type(
            ctx, iterable_impl, "iter", "Iter",
            iter_call_result.hexpr, s, span)
        let associated_item_type = for_protocol_assoc_type(
            ctx, iterable_impl, "iter", "Item",
            iter_call_result.hexpr, s, span)
        let iter_type_note_span = span
        let iter_return_note_span = span
        let iter_notes: List<DiagnosticNote> = [
            DiagnosticNote {
                message: "Iterable::Iter is '${type_to_string(associated_iter_type)}'",
                span: some(iter_type_note_span)
            },
            DiagnosticNote {
                message: "iter() returns '${type_to_string(apply_subst(s, hexpr_type(iter_call_result.hexpr)))}'",
                span: some(iter_return_note_span)
            }
        ]
        s = unify_at_noted(
            ctx.sink, ctx.env,
            hexpr_type(iter_call_result.hexpr), associated_iter_type,
            s, span, iter_notes)
        let iterator_type = apply_subst(s, hexpr_type(iter_call_result.hexpr))
        let iterator_impl = require_for_protocol_impl(
            ctx, iterator_type, "Iterator", s, span)

        let iterator_name = "__ring_for_iterator_${ctx.env.ids.next_def_id.to_str()}"
        let iterator_binding_name = iterator_name
        let iterator_binding_type = iterator_type
        ctx.env.bind_mono(iterator_binding_name, iterator_binding_type)
        let iterator_scheme = match ctx.env.lookup(iterator_name) {
            some(scheme) => scheme,
            none => panic("unreachable: lowered for iterator binding missing")
        }
        match iterator_scheme.def_id {
            some(did) => {
                let iterator_span_def_id = did
                let iterator_def_span = span
                ctx.env.record_def_span(iterator_span_def_id, iterator_def_span)
                let iterator_mutable_def_id = did
                ctx.env.scope.mutable_vars.insert(iterator_mutable_def_id)
                let iterator_depth_def_id = did
                ctx.var_lambda_depth.insert(iterator_depth_def_id, ctx.lambda_depth)
            },
            none => {}
        }
        let iterator_stmt_name = iterator_name
        let iterator_name_span = span
        let iterator_stmt_span = span
        let iterator_stmt = HStmt::Var {
            name: iterator_stmt_name, name_span: iterator_name_span,
            def_id: iterator_scheme.def_id, ty: iterator_type,
            init: iter_call_result.hexpr, span: iterator_stmt_span
        }

        let initial_binding_name = binding
        let initial_binding_span = binding_span
        let mut payload_pattern = Pattern::Binding {
            name: initial_binding_name, span: initial_binding_span
        }
        let mut then_block = body
        match destructure {
            some(destr) => {
                let payload_name = "__ring_for_payload_${ctx.env.ids.next_def_id.to_str()}"
                let payload_pattern_name = payload_name
                let payload_binding_span = binding_span
                payload_pattern = Pattern::Binding {
                    name: payload_pattern_name, span: payload_binding_span
                }

                let mut tuple_patterns: List<Pattern> = []
                let mut di = 0
                while di < destr.names.len() {
                    match (destr.names.get(di), destr.spans.get(di)) {
                        (some(name), some(name_span)) => {
                            let tuple_binding_name = name
                            let tuple_binding_span = name_span
                            tuple_patterns.push(Pattern::Binding {
                                name: tuple_binding_name, span: tuple_binding_span
                            })
                        },
                        (some(name), none) => {
                            let tuple_binding_name = name
                            let tuple_binding_span = binding_span
                            tuple_patterns.push(Pattern::Binding {
                                name: tuple_binding_name, span: tuple_binding_span
                            })
                        },
                        _ => {}
                    }
                    di = di + 1
                }
                let destructure_pattern_span = span
                let destructure_ident_span = span
                let destructure_stmt_span = span
                let destructure_stmt = Stmt::LetDestructure {
                    pattern: Pattern::TuplePattern {
                        elements: tuple_patterns, span: destructure_pattern_span
                    },
                    init: Expr::Ident {
                        name: payload_name, qualifier: none,
                        span: destructure_ident_span
                    },
                    span: destructure_stmt_span
                }
                then_block = match then_block {
                    Expr::Block { stmts, tail, span: body_span } => {
                        let mut lowered_stmts: List<Stmt> = [destructure_stmt]
                        for original_stmt in stmts {
                            let lowered_original_stmt = original_stmt
                            lowered_stmts.push(lowered_original_stmt)
                        }
                        let lowered_tail = tail
                        let lowered_body_span = body_span
                        Expr::Block {
                            stmts: lowered_stmts, tail: lowered_tail,
                            span: lowered_body_span
                        }
                    },
                    _ => panic("unreachable: for-in body is not a block")
                }
            },
            none => {}
        }

        let some_pattern_span = span
        let some_pattern = Pattern::Constructor {
            name: "some", qualifier: some(BUILTIN_OPTION),
            fields: [payload_pattern], span: some_pattern_span
        }
        let exhausted_break_span = span
        let exhausted_block_span = span
        let exhausted_block = Expr::Block {
            stmts: [Stmt::Break { span: exhausted_break_span }],
            tail: none, span: exhausted_block_span
        }
        ctx.env.push_scope()
        ctx.loop_depth = ctx.loop_depth + 1
        let while_candidate: StmtResult? = some({
            let next_receiver_span = span
            let iterator_expr = make_for_protocol_iterator_receiver(
                iterator_name, next_receiver_span)
            let next_receiver_expr = iterator_expr
            let next_receiver_subst = s
            let next_receiver = infer_expr(
                ctx, next_receiver_expr, next_receiver_subst)
            let next_selection = select_for_protocol_method(
                ctx, iterator_impl, "next", span)
            let next_call_span = span
            let next_call_result = infer_method_call_from_receiver(
                ctx, some(iterator_expr), next_receiver,
                "next", [], next_call_span, some(next_selection))
            s = next_call_result.subst

            let iterator_item_type = for_protocol_assoc_type(
                ctx, iterator_impl, "next", "Item",
                next_call_result.hexpr, s, span)
            let option_item_type = iterator_item_type
            let next_expected = make_option_type(option_item_type)
            let next_item_note_type = iterator_item_type
            let next_item_note_span = span
            let next_return_note_span = span
            let next_notes: List<DiagnosticNote> = [
                DiagnosticNote {
                    message: "Iterator::Item is '${type_to_string(next_item_note_type)}'",
                    span: some(next_item_note_span)
                },
                DiagnosticNote {
                    message: "next() returns '${type_to_string(apply_subst(s, hexpr_type(next_call_result.hexpr)))}'",
                    span: some(next_return_note_span)
                }
            ]
            s = unify_at_noted(
                ctx.sink, ctx.env, hexpr_type(next_call_result.hexpr),
                next_expected, s, span, next_notes)

            let iterable_item_note_span = span
            let checked_item_note_type = iterator_item_type
            let checked_item_note_span = span
            let item_notes: List<DiagnosticNote> = [
                DiagnosticNote {
                    message: "Iterable::Item is '${type_to_string(apply_subst(s, associated_item_type))}'",
                    span: some(iterable_item_note_span)
                },
                DiagnosticNote {
                    message: "Iterator::Item is '${type_to_string(apply_subst(s, checked_item_note_type))}'",
                    span: some(checked_item_note_span)
                }
            ]
            let final_iterator_item_type = iterator_item_type
            s = unify_at_noted(
                ctx.sink, ctx.env,
                associated_item_type, final_iterator_item_type,
                s, span, item_notes)

            let checked_next_subst = s
            let checked_next = InferResult {
                hexpr: next_call_result.hexpr,
                subst: checked_next_subst,
                effects: next_call_result.effects
            }
            let branch_pattern = some_pattern
            let branch_exhausted_block = exhausted_block
            let branch_span = span
            let branch_result = infer_if_let_from_result(
                ctx, branch_pattern, checked_next, then_block,
                some(branch_exhausted_block), branch_span)
            s = branch_result.subst
            let loop_body_span = span
            let loop_body = HExpr::Block {
                stmts: [branch_result.hstmt], tail: none,
                ty: UNIT, effects: branch_result.effects,
                span: loop_body_span
            }
            let loop_condition_span = span
            let while_stmt_span = span
            let while_result_subst = s
            StmtResult {
                hstmt: HStmt::While {
                    condition: HExpr::BoolLit {
                        value: true, ty: BOOL,
                        effects: EMPTY_ROW, span: loop_condition_span
                    },
                    body: loop_body, span: while_stmt_span
                },
                subst: while_result_subst,
                effects: branch_result.effects
            }
        }) catch { _ => none }
        ctx.loop_depth = ctx.loop_depth - 1
        ctx.env.pop_scope()
        let while_result = match while_candidate {
            some(result) => result,
            none => fail.raise(CompileError {})
        }
        s = while_result.subst

        let mut block_effects = iter_call_result.effects
        let combined = merge_effects(
            ctx.sink, ctx.env, block_effects,
            while_result.effects, s, span)
        block_effects = combined.0
        s = combined.1

        let lowered_block_effects = block_effects
        let lowered_block_span = span
        let lowered_block = HExpr::Block {
            stmts: [iterator_stmt, while_result.hstmt],
            tail: none, ty: UNIT, effects: lowered_block_effects,
            span: lowered_block_span
        }
        let lowered_stmt_span = span
        let lowered_result_subst = s
        StmtResult {
            hstmt: HStmt::ExprStmt {
                expr: lowered_block, span: lowered_stmt_span
            },
            subst: lowered_result_subst, effects: block_effects
        }
    }) catch { _ => none }
    ctx.env.pop_scope()
    match lowered_result {
        some(result) => {
            let lowered = result
            lowered
        },
        none => fail.raise(CompileError {})
    }
}

// Keep construction of the owned iterator receiver outside the catch
// closure's capture transfer. The named leaf borrows the exact generated name
// and materializes the whole Expr in its own parameter scope.
fn make_for_protocol_iterator_receiver(
    iterator_name: Str, span: Span
) -> Expr {
    let receiver_name = iterator_name
    let receiver_span = span
    Expr::Ident {
        name: receiver_name, qualifier: none, span: receiver_span
    }
}

// ============================================================
// Expression inference dispatch (from infer.ts)
// ============================================================

pub fn infer_expr(mut ctx: InferCtx, expr: Expr, subst: UnionFind) -> InferResult {
    match expr {
        Expr::IntLit { value, span } => {
            let int_literal_span = span
            InferResult {
                hexpr: HExpr::IntLit {
                    value: value, ty: INT, effects: EMPTY_ROW,
                    span: int_literal_span
                },
                subst: subst, effects: EMPTY_ROW
            }
        },
        Expr::FloatLit { value, span } => {
            let float_literal_span = span
            InferResult {
                hexpr: HExpr::FloatLit {
                    value: value, ty: FLOAT, effects: EMPTY_ROW,
                    span: float_literal_span
                },
                subst: subst, effects: EMPTY_ROW
            }
        },
        Expr::StrLit { value, span } => {
            let string_literal_value = value
            let string_literal_span = span
            InferResult {
                hexpr: HExpr::StrLit {
                    value: string_literal_value, ty: STR,
                    effects: EMPTY_ROW, span: string_literal_span
                },
                subst: subst, effects: EMPTY_ROW
            }
        },
        Expr::BoolLit { value, span } => {
            let bool_literal_span = span
            InferResult {
                hexpr: HExpr::BoolLit {
                    value: value, ty: BOOL, effects: EMPTY_ROW,
                    span: bool_literal_span
                },
                subst: subst, effects: EMPTY_ROW
            }
        },
        Expr::Ident { name, qualifier, span } => {
            let ident_name = name
            let ident_span = span
            infer_ident(ctx, ident_name, ident_span, subst, qualifier)
        },
        Expr::BinOp { op, left, right, span } => {
            let binary_op = op
            let binary_span = span
            infer_bin_op(ctx, binary_op, left, right, binary_span, subst)
        },
        Expr::UnaryOp { op, operand, span } => {
            let unary_op = op
            let unary_span = span
            infer_unary_op(ctx, unary_op, operand, unary_span, subst)
        },
        Expr::Call { callee, args, span, .. } => {
            let call_span = span
            infer_call(ctx, callee, args, call_span, subst)
        },
        Expr::MethodCall { receiver, method, args, span, .. } => {
            let method_receiver = receiver
            infer_method_call(ctx, method_receiver, method, args, span, subst)
        },
        Expr::FieldAccess { receiver, field, span } => {
            let access_field = field
            let access_span = span
            infer_field_access(ctx, receiver, access_field, access_span, subst)
        },
        Expr::StructLit { name, qualifier, fields, spread, span, .. } => {
            let struct_name = name
            let struct_span = span
            infer_struct_lit(
                ctx, struct_name, fields, spread, struct_span,
                subst, qualifier)
        },
        Expr::MatchExpr { scrutinee, arms, span } => {
            let match_span = span
            infer_match(ctx, scrutinee, arms, match_span, subst)
        },
        Expr::Block { .. } =>
            infer_block(ctx, expr, some(subst)),
        Expr::IfExpr { condition, then_branch, else_branch, span } => {
            let if_span = span
            infer_if(
                ctx, condition, then_branch, else_branch, if_span, subst)
        },
        Expr::StringInterp { parts, span } => {
            let interpolation_span = span
            infer_string_interp(ctx, parts, interpolation_span, subst)
        },
        Expr::CatchExpr { expr: catch_expr, arms, span } => {
            let catch_span = span
            infer_catch(ctx, catch_expr, arms, catch_span, subst)
        },
        Expr::HandleExpr { body, handlers, span } => {
            let handle_span = span
            infer_handle(ctx, body, handlers, handle_span, subst)
        },
        Expr::Lambda { params, body, span, .. } => {
            let lambda_span = span
            infer_lambda(ctx, params, body, lambda_span, subst, none)
        },
        Expr::ListLit { elements, span } => {
            let list_span = span
            infer_list_literal(ctx, elements, list_span, subst)
        },
        Expr::TupleLit { elements, span } => {
            // () — unit literal: 0-element tuple is Unit
            if elements.len() == 0 {
                let unit_tuple_span = span
                return InferResult {
                    hexpr: HExpr::TupleLit {
                        elements: [], ty: UNIT, effects: EMPTY_ROW,
                        span: unit_tuple_span
                    },
                    subst: subst, effects: EMPTY_ROW
                }
            }
            let mut s = subst
            let mut helements: List<HExpr> = []
            let mut combined_effects: EffectRow = EMPTY_ROW
            for el in elements {
                let r = infer_expr(ctx, el, s)
                s = r.subst
                helements.push(r.hexpr)
                let me = merge_effects(ctx.sink, ctx.env, combined_effects, r.effects, s, span)
                combined_effects = me.0
                s = me.1
            }
            let mut elem_types: List<Type> = []
            for he in helements { elem_types.push(apply_subst(s, hexpr_type(he))) }
            let tuple_type = Type::TupleType { elements: elem_types }
            let tuple_effects = combined_effects
            let tuple_span = span
            InferResult {
                hexpr: HExpr::TupleLit {
                    elements: helements, ty: tuple_type,
                    effects: tuple_effects, span: tuple_span
                },
                subst: s, effects: combined_effects
            }
        },
        Expr::Range { start, end, inclusive, span } => {
            let start_r = infer_expr(ctx, start, subst)
            let mut s = unify_at(ctx.sink, ctx.env, hexpr_type(start_r.hexpr), INT, start_r.subst, span)
            let end_r = infer_expr(ctx, end, s)
            s = unify_at(ctx.sink, ctx.env, hexpr_type(end_r.hexpr), INT, end_r.subst, span)
            let me = merge_effects(ctx.sink, ctx.env, start_r.effects, end_r.effects, s, span)
            let mut range_effects = me.0
            s = me.1
            let range_type = Type::EnumType { name: BUILTIN_RANGE, type_params: [INT] }
            let range_expr_effects = range_effects
            let range_span = span
            InferResult {
                hexpr: HExpr::RangeExpr {
                    start: start_r.hexpr, end: end_r.hexpr, inclusive: inclusive,
                    ty: range_type, effects: range_expr_effects,
                    span: range_span
                },
                subst: s, effects: range_effects
            }
        },
        Expr::IndexExpr { receiver, index, span } => {
            let index_span = span
            infer_index_expr(ctx, receiver, index, index_span, subst)
        },
        Expr::ReturnExpr { value, span } => match value {
            some(v) => {
                let r = infer_expr(ctx, v, subst)
                let mut s = r.subst
                match ctx.current_fn_return_type {
                    some(ret_type) => {
                        let return_notes: List<DiagnosticNote> = [
                            DiagnosticNote { message: "function return type is '${type_to_string(apply_subst(s, ret_type))}'", span: none },
                            DiagnosticNote { message: "return value has type '${type_to_string(apply_subst(s, hexpr_type(r.hexpr)))}'", span: some(hexpr_span(r.hexpr)) }
                        ]
                        s = unify_at_noted(ctx.sink, ctx.env, hexpr_type(r.hexpr), ret_type, s, span, return_notes)
                    },
                    none => {}
                }
                let return_value_span = span
                InferResult {
                    hexpr: HExpr::ReturnExpr {
                        value: some(r.hexpr), ty: NEVER,
                        effects: r.effects, span: return_value_span
                    },
                    subst: s, effects: r.effects
                }
            },
            none => {
                let mut s = subst
                match ctx.current_fn_return_type {
                    some(ret_type) => {
                        s = unify_at(ctx.sink, ctx.env, UNIT, ret_type, s, span)
                    },
                    none => {}
                }
                let empty_return_span = span
                InferResult {
                    hexpr: HExpr::ReturnExpr {
                        value: none, ty: NEVER, effects: EMPTY_ROW,
                        span: empty_return_span
                    },
                    subst: s, effects: EMPTY_ROW
                }
            }
        },
        // B-125: unsafe block — discharge UnsafeEffect from body
        Expr::UnsafeBlock { body, span } => {
            // Check that the current module allows unsafe blocks
            if !ctx.mod_unsafe_allowed {
                let _ = type_error(ctx.sink, E0411,
                    "unsafe block requires `mod ... requires {unsafe}` declaration",
                    span,
                    DiagnosticContext::OtherContext { detail: some("unsafe block without requires") })
            }
            // Infer body (which is a Block expr from parse_block_expr)
            let body_r = infer_block(ctx, body, some(subst))
            // Discharge: filter out UnsafeEffect from the body's effect row
            let mut filtered: List<Effect> = []
            for e in body_r.effects.effects {
                match e {
                    Effect::UnsafeEffect => {},
                    _ => {
                        let filtered_effect = e
                        filtered.push(filtered_effect)
                    }
                }
            }
            let discharged_effects = EffectRow { effects: filtered, tail: body_r.effects.tail }
            let unsafe_block_effects = discharged_effects
            let unsafe_block_span = span
            InferResult {
                hexpr: HExpr::UnsafeBlock {
                    body: body_r.hexpr,
                    ty: hexpr_type(body_r.hexpr),
                    effects: unsafe_block_effects,
                    span: unsafe_block_span
                },
                subst: body_r.subst, effects: discharged_effects
            }
        }
    }
}

// ============================================================
// infer_index_expr: list[i] / map[key] / str[i]
// ============================================================

fn infer_index_expr(mut ctx: InferCtx, receiver: Expr, index: Expr, span: Span, subst: UnionFind) -> InferResult {
    let receiver_subst = subst
    let recv_r = infer_expr(ctx, receiver, receiver_subst)
    let mut s = recv_r.subst
    let mut combined_effects = recv_r.effects

    let idx_r = infer_expr(ctx, index, s)
    s = idx_r.subst
    let me = merge_effects(ctx.sink, ctx.env, combined_effects, idx_r.effects, s, span)
    combined_effects = me.0
    s = me.1

    let recv_type = apply_subst(s, hexpr_type(recv_r.hexpr))
    let idx_type = apply_subst(s, hexpr_type(idx_r.hexpr))

    let mut result_ty: Type = Type::ErrorType
    let mut map_key_type: Type? = none

    match recv_type {
        Type::StructType { name, type_params, .. } => {
            if name == BUILTIN_LIST {
                // list[i]: index must be Int, result is element type T
                s = unify_at(ctx.sink, ctx.env, idx_type, INT, s, span)
                result_ty = if type_params.len() > 0 { type_params.get(0).unwrap() } else { Type::ErrorType }
            } else if name == BUILTIN_MAP {
                // map[key]: index must be key type K, result is value type V
                if type_params.len() >= 2 {
                    let key_type = type_params.get(0).unwrap()
                    s = unify_at(ctx.sink, ctx.env, idx_type, key_type, s, span)
                    map_key_type = some(apply_subst(s, key_type))
                    result_ty = type_params.get(1).unwrap()
                } else {
                    result_ty = Type::ErrorType
                }
            } else {
                let _ = type_error(ctx.sink, E0306,
                    "Type '${type_to_string(recv_type)}' does not support indexing",
                    span, DiagnosticContext::OtherContext { detail: some("only List, Map, and Str support subscript operator []") })
                result_ty = Type::ErrorType
            }
        },
        Type::StrType => {
            // str[i]: index must be Int, result is Str
            s = unify_at(ctx.sink, ctx.env, idx_type, INT, s, span)
            result_ty = STR
        },
        Type::ErrorType => {
            result_ty = Type::ErrorType
        },
        _ => {
            let _ = type_error(ctx.sink, E0306,
                "Type '${type_to_string(recv_type)}' does not support indexing",
                span, DiagnosticContext::OtherContext { detail: some("only List, Map, and Str support subscript operator []") })
            result_ty = Type::ErrorType
        }
    }

    match map_key_type {
        some(key_type) => {
            // B-152 P3 closure: Map subscript is the bounded pure-Ring
            // map_get_panic call, not a backend/runtime projection.  Lowering
            // here preserves the Hash+Eq dictionaries.  The binding comes from
            // load_prelude's canonical TypeScheme/DefId, never from a lexical
            // name lookup that a local/parameter could shadow.
            let callee_name = map_index_helper_identity()
            let callee_scheme = match ctx.env.lookup(callee_name) {
                some(scheme) => scheme,
                none => panic("unreachable: canonical prelude map_get_panic is missing")
            }
            let callee_ty = ctx.env.instantiate(callee_scheme)
            let callee_span = span
            let callee = HExpr::Ident {
                name: callee_name, resolved_name: none,
                def_id: callee_scheme.def_id, dict_closure_dicts: none,
                ty: callee_ty, effects: EMPTY_ROW, span: callee_span
            }
            let effect_tail = ctx.env.fresh_var_id()
            let expected_key_type = key_type
            let expected_fn = Type::FnType {
                params: [apply_subst(s, recv_type), expected_key_type],
                return_type: apply_subst(s, result_ty),
                meta: fn_meta(
                    EffectRow { effects: [], tail: some(effect_tail) },
                    fresh_callable_ownership_inference_term(
                        ctx.env.types.ownership_metadata))
            }
            let callee_unify_span = span
            s = unify_at(
                ctx.sink, ctx.env, hexpr_type(callee), expected_fn, s,
                callee_unify_span)

            match apply_subst(s, hexpr_type(callee)) {
                Type::FnType { meta, .. } => {
                    let callee_effect_span = span
                    let me2 = merge_effects(ctx.sink, ctx.env,
                        combined_effects, meta.effects, s,
                        callee_effect_span)
                    combined_effects = me2.0
                    s = me2.1
                },
                _ => {}
            }

            let resolved_dicts: List<DictRef> = []
            let dict_output_slot = resolved_dicts
            let dict_callee_scheme = callee_scheme
            let dict_resolution_span = span
            resolve_or_defer_dicts_from_scheme(
                ctx, dict_callee_scheme, hexpr_type(callee), s,
                dict_resolution_span,
                PendingDictPurpose::DirectCallPublish {
                    output_slot: dict_output_slot
                })

            let final_result_ty = apply_subst(s, result_ty)
            let call_effects = combined_effects
            let final_callee_scheme = callee_scheme
            let final_map_call_span = span
            InferResult {
                hexpr: HExpr::Call {
                    callee: callee,
                    callee_def_id: final_callee_scheme.def_id,
                    callable_result_def_id:
                        fresh_call_result_callable_def_id(ctx, final_result_ty),
                    args: [recv_r.hexpr, idx_r.hexpr],
                    type_args: [],
                    resolved_dicts: resolved_dicts,
                    dict_dispatch: none,
                    ty: final_result_ty,
                    effects: call_effects,
                    span: final_map_call_span
                },
                subst: s, effects: combined_effects
            }
        },
        none => {
            let index_effects = combined_effects
            InferResult {
                hexpr: HExpr::IndexExpr {
                receiver: recv_r.hexpr, index: idx_r.hexpr,
                    ty: result_ty, effects: index_effects, span: span
                },
                subst: s, effects: combined_effects
            }
        }
    }
}

// ============================================================
// infer_bin_op (from infer-expr.ts)
// ============================================================

fn infer_bin_op(mut ctx: InferCtx, op: BinOp, left: Expr, right: Expr, span: Span, subst: UnionFind) -> InferResult {
    let left_subst = subst
    let lr = infer_expr(ctx, left, left_subst)
    let rr = infer_expr(ctx, right, lr.subst)
    let mut s = rr.subst
    let mut result_type: Type = UNIT
    let mut eq_dispatch: TraitDispatch? = none
    let mut ord_dispatch: TraitDispatch? = none

    match op {
        BinOp::Add => { result_type = infer_numeric_op(ctx, lr.hexpr, rr.hexpr, s, span, "+"); s = unify_at(ctx.sink, ctx.env, hexpr_type(lr.hexpr), hexpr_type(rr.hexpr), s, span) },
        BinOp::Sub => { result_type = infer_numeric_op(ctx, lr.hexpr, rr.hexpr, s, span, "-"); s = unify_at(ctx.sink, ctx.env, hexpr_type(lr.hexpr), hexpr_type(rr.hexpr), s, span) },
        BinOp::Mul => { result_type = infer_numeric_op(ctx, lr.hexpr, rr.hexpr, s, span, "*"); s = unify_at(ctx.sink, ctx.env, hexpr_type(lr.hexpr), hexpr_type(rr.hexpr), s, span) },
        BinOp::Div => { result_type = infer_numeric_op(ctx, lr.hexpr, rr.hexpr, s, span, "/"); s = unify_at(ctx.sink, ctx.env, hexpr_type(lr.hexpr), hexpr_type(rr.hexpr), s, span) },
        BinOp::Mod => { result_type = infer_numeric_op(ctx, lr.hexpr, rr.hexpr, s, span, "%"); s = unify_at(ctx.sink, ctx.env, hexpr_type(lr.hexpr), hexpr_type(rr.hexpr), s, span) },
        BinOp::Eq | BinOp::Neq => {
            s = unify_at(ctx.sink, ctx.env, hexpr_type(lr.hexpr), hexpr_type(rr.hexpr), s, span)
            result_type = BOOL
            let resolved = apply_subst(s, hexpr_type(lr.hexpr))
            let op_sym = match op { BinOp::Eq => "==", _ => "!=" }
            eq_dispatch = some(resolve_eq_dispatch(ctx, resolved, s, span, op_sym))
        },
        BinOp::Lt | BinOp::Lte | BinOp::Gt | BinOp::Gte => {
            s = unify_at(ctx.sink, ctx.env, hexpr_type(lr.hexpr), hexpr_type(rr.hexpr), s, span)
            result_type = BOOL
            let resolved = apply_subst(s, hexpr_type(lr.hexpr))
            let op_sym = match op { BinOp::Lt => "<", BinOp::Lte => "<=", BinOp::Gt => ">", _ => ">=" }
            ord_dispatch = some(resolve_trait_dispatch(ctx, resolved, "Ord", E0308, s, span, op_sym, is_primitive_ord(resolved)))
        },
        BinOp::And => {
            s = unify_at(ctx.sink, ctx.env, hexpr_type(lr.hexpr), BOOL, s, span)
            s = unify_at(ctx.sink, ctx.env, hexpr_type(rr.hexpr), BOOL, s, span)
            result_type = BOOL
        },
        BinOp::Or => {
            s = unify_at(ctx.sink, ctx.env, hexpr_type(lr.hexpr), BOOL, s, span)
            s = unify_at(ctx.sink, ctx.env, hexpr_type(rr.hexpr), BOOL, s, span)
            result_type = BOOL
        }
    }

    let me = merge_effects(ctx.sink, ctx.env, lr.effects, rr.effects, s, span)
    let mut effects = me.0
    s = me.1
    let bin_op_effects = effects
    InferResult {
        hexpr: HExpr::BinOp { op: op, left: lr.hexpr, right: rr.hexpr, eq_dispatch: eq_dispatch, ord_dispatch: ord_dispatch, ty: result_type, effects: bin_op_effects, span: span },
        subst: s, effects: effects
    }
}

// ============================================================
// infer_unary_op
// ============================================================

fn infer_unary_op(mut ctx: InferCtx, op: UnaryOp, operand: Expr, span: Span, subst: UnionFind) -> InferResult {
    let operand_subst = subst
    let r = infer_expr(ctx, operand, operand_subst)
    let mut s = r.subst
    let mut result_type: Type = UNIT
    match op {
        UnaryOp::Neg => {
            let resolved = apply_subst(s, hexpr_type(r.hexpr))
            match resolved {
                Type::TypeVar { .. } => { s = unify_at(ctx.sink, ctx.env, resolved, INT, s, span); result_type = INT },
                Type::IntType => { result_type = INT },
                Type::FloatType => { result_type = FLOAT },
                _ => { let _ = type_error(ctx.sink, E0303,
                    "Unary - requires numeric type, got ${type_to_string(resolved)}",
                    span, DiagnosticContext::TypeMismatch { expected: "Int or Float", actual: type_to_string(resolved), expression: none }) }
            }
        },
        UnaryOp::Not => {
            s = unify_at(ctx.sink, ctx.env, hexpr_type(r.hexpr), BOOL, s, span)
            result_type = BOOL
        }
    }
    InferResult {
        hexpr: HExpr::UnaryOp { op: op, operand: r.hexpr, ty: result_type, effects: r.effects, span: span },
        subst: s, effects: r.effects
    }
}

// ============================================================
// infer_call
// ============================================================

// Default arguments are retained HIR templates.  Every omitted-argument use
// is a distinct evaluation, so definition identities inside the template must
// be fresh just as if the expression had been inferred at that call site.
// References to declarations outside the template deliberately keep their
// exact DefIds.
fn collect_default_template_type(ty: Type, mut result: Set<Int>) {
    for var_id in free_type_vars(ty, new_union_find()) {
        result.insert(var_id)
    }
}

fn collect_default_template_row(row: EffectRow, mut result: Set<Int>) {
    collect_default_template_type(Type::EffectRowType {
        effects: row.effects, tail: row.tail
    }, result)
}

fn collect_default_template_param(param: HParam, mut result: Set<Int>) {
    collect_default_template_type(param.ty, result)
}

fn collect_default_template_pattern_binding(
    binding: HPatternBinding, mut result: Set<Int>
) {
    collect_default_template_type(binding.ty, result)
}

fn collect_default_template_dispatch_value(
    dispatch: TraitDispatch, mut result: Set<Int>
) {
    match dispatch {
        TraitDispatch::Tuple { element_types, elements } => {
            for element_type in element_types {
                collect_default_template_type(element_type, result)
            }
            for element in elements {
                collect_default_template_dispatch_value(element, result)
            }
        },
        _ => {}
    }
}

fn collect_default_template_dispatch(
    dispatch: TraitDispatch?, mut result: Set<Int>
) {
    match dispatch {
        some(exact) => collect_default_template_dispatch_value(exact, result),
        none => {}
    }
}

fn collect_default_template_match_arm(
    arm: HMatchArm, mut result: Set<Int>
) {
    for binding in arm.bindings {
        collect_default_template_pattern_binding(binding, result)
    }
    match arm.guard {
        some(guard) => collect_default_template_expr(guard, result),
        none => {}
    }
    collect_default_template_expr(arm.body, result)
}

fn collect_default_template_stmt(stmt: HStmt, mut result: Set<Int>) {
    match stmt {
        HStmt::Let { ty, init, .. } | HStmt::Var { ty, init, .. } => {
            collect_default_template_type(ty, result)
            collect_default_template_expr(init, result)
        },
        HStmt::Assign { target, value, .. } => {
            collect_default_template_expr(target, result)
            collect_default_template_expr(value, result)
        },
        HStmt::ExprStmt { expr, .. } =>
            collect_default_template_expr(expr, result),
        HStmt::Return { value, .. } => match value {
            some(expr) => collect_default_template_expr(expr, result),
            none => {}
        },
        HStmt::While { condition, body, .. } => {
            collect_default_template_expr(condition, result)
            collect_default_template_expr(body, result)
        },
        HStmt::ForIn { iterable, body, .. } => {
            collect_default_template_expr(iterable, result)
            collect_default_template_expr(body, result)
        },
        HStmt::LetDestructure { bindings, init, .. } => {
            for binding in bindings {
                collect_default_template_type(binding.ty, result)
            }
            collect_default_template_expr(init, result)
        },
        HStmt::IfLet {
            bindings, expr, then_block, else_block, ..
        } => {
            for binding in bindings {
                collect_default_template_pattern_binding(binding, result)
            }
            collect_default_template_expr(expr, result)
            collect_default_template_expr(then_block, result)
            match else_block {
                some(block) => collect_default_template_expr(block, result),
                none => {}
            }
        },
        HStmt::Drop { ty, .. } =>
            collect_default_template_type(ty, result),
        HStmt::Break { .. } | HStmt::Continue { .. } => {}
    }
}

fn collect_default_template_expr(expr: HExpr, mut result: Set<Int>) {
    collect_default_template_type(hexpr_type(expr), result)
    collect_default_template_row(hexpr_effects(expr), result)
    match expr {
        HExpr::BinOp {
            left, right, eq_dispatch, ord_dispatch, ..
        } => {
            collect_default_template_expr(left, result)
            collect_default_template_expr(right, result)
            collect_default_template_dispatch(eq_dispatch, result)
            collect_default_template_dispatch(ord_dispatch, result)
        },
        HExpr::UnaryOp { operand, .. } =>
            collect_default_template_expr(operand, result),
        HExpr::Call { callee, args, type_args, .. } => {
            collect_default_template_expr(callee, result)
            for arg in args { collect_default_template_expr(arg, result) }
            for type_arg in type_args {
                collect_default_template_type(type_arg, result)
            }
        },
        HExpr::FieldAccess { receiver, .. } =>
            collect_default_template_expr(receiver, result),
        HExpr::StructLit { type_args, fields, spread, .. } => {
            for type_arg in type_args {
                collect_default_template_type(type_arg, result)
            }
            for field in fields {
                collect_default_template_expr(field.value, result)
            }
            match spread {
                some(value) => collect_default_template_expr(value, result),
                none => {}
            }
        },
        HExpr::NamedVariantConstruct { fields, spread, .. } => {
            for field in fields {
                collect_default_template_expr(field.value, result)
            }
            match spread {
                some(value) => collect_default_template_expr(value, result),
                none => {}
            }
        },
        HExpr::MatchExpr { scrutinee, arms, .. } => {
            collect_default_template_expr(scrutinee, result)
            for arm in arms {
                collect_default_template_match_arm(arm, result)
            }
        },
        HExpr::Block { stmts, tail, .. } => {
            for stmt in stmts { collect_default_template_stmt(stmt, result) }
            match tail {
                some(value) => collect_default_template_expr(value, result),
                none => {}
            }
        },
        HExpr::IfExpr {
            condition, then_branch, else_branch, ..
        } => {
            collect_default_template_expr(condition, result)
            collect_default_template_expr(then_branch, result)
            match else_branch {
                some(value) => collect_default_template_expr(value, result),
                none => {}
            }
        },
        HExpr::StringInterp { parts, .. } => {
            for part in parts {
                match part {
                    HStringInterpPart::Literal(_) => {},
                    HStringInterpPart::Expression(value) =>
                        collect_default_template_expr(value, result)
                }
            }
        },
        HExpr::TryCatch { body, arms, .. } => {
            collect_default_template_expr(body, result)
            for arm in arms {
                collect_default_template_match_arm(arm, result)
            }
        },
        HExpr::HandleExpr { body, handlers, .. } => {
            collect_default_template_expr(body, result)
            for handler in handlers {
                for param in handler.params {
                    collect_default_template_param(param, result)
                }
                match handler.resume_binding {
                    some(binding) =>
                        collect_default_template_pattern_binding(
                            binding, result),
                    none => {}
                }
                collect_default_template_expr(handler.body, result)
            }
        },
        HExpr::Lambda { params, return_type, body, .. } => {
            for param in params {
                collect_default_template_param(param, result)
            }
            collect_default_template_type(return_type, result)
            collect_default_template_expr(body, result)
        },
        HExpr::EffectOp { args, .. } => {
            for arg in args { collect_default_template_expr(arg, result) }
        },
        HExpr::RangeExpr { start, end, .. } => {
            collect_default_template_expr(start, result)
            collect_default_template_expr(end, result)
        },
        HExpr::ListLit { elements, .. } |
        HExpr::TupleLit { elements, .. } => {
            for element in elements {
                collect_default_template_expr(element, result)
            }
        },
        HExpr::IndexExpr { receiver, index, .. } => {
            collect_default_template_expr(receiver, result)
            collect_default_template_expr(index, result)
        },
        HExpr::Clone { inner, .. } =>
            collect_default_template_expr(inner, result),
        HExpr::ReturnExpr { value, .. } => match value {
            some(inner) => collect_default_template_expr(inner, result),
            none => {}
        },
        HExpr::UnsafeBlock { body, .. } =>
            collect_default_template_expr(body, result),
        HExpr::Ident { .. } | HExpr::IntLit { .. } |
        HExpr::FloatLit { .. } | HExpr::StrLit { .. } |
        HExpr::BoolLit { .. } | HExpr::DictConstruct { .. } |
        HExpr::Take { .. } => {}
    }
}

pub fn default_template_var_ids(defaults: List<HExpr>) -> Set<Int> {
    let mut result: Set<Int> = set_new()
    for default in defaults {
        collect_default_template_expr(default, result)
    }
    result
}

fn default_type_mapping_subst(mapping: Map<Int, Type>) -> UnionFind {
    let mut subst = new_union_find()
    for entry in mapping.entries() {
        let (source_id, target_type) = entry
        let target_for_storage = target_type
        match target_type {
            Type::TypeVar { id: target_id, .. } => {
                if target_id != source_id {
                    uf_insert(subst, source_id, target_for_storage)
                }
            },
            _ => uf_insert(subst, source_id, target_for_storage)
        }
    }
    subst
}

pub fn rewrite_default_template_types(
    template: HExpr, mapping: Map<Int, Type>
) -> HExpr {
    zonk_expr(ZonkCtx {
        subst: default_type_mapping_subst(mapping),
        names: map_new(), dict_resolver: none,
        ownership_metadata: none, require_exact_ownership: false
    }, template)
}

fn fresh_default_binder_def_id(
    mut ctx: InferCtx, old_def_id: Int, mut remap: Map<Int, Int>
) -> Int {
    match remap.get(old_def_id) {
        some(existing) => existing,
        none => {
            let fresh = ctx.env.fresh_def_id()
            remap.insert(old_def_id, fresh)
            fresh
        }
    }
}

fn remap_default_def_id(def_id: Int, remap: Map<Int, Int>) -> Int {
    match remap.get(def_id) {
        some(fresh) => fresh,
        none => def_id
    }
}

fn remap_default_optional_def_id(
    def_id: Int?, remap: Map<Int, Int>
) -> Int? {
    match def_id {
        some(id) => some(remap_default_def_id(id, remap)),
        none => none
    }
}

fn freshen_default_param(
    mut ctx: InferCtx, param: HParam, mut remap: Map<Int, Int>
) -> HParam {
    let fresh_def_id = match param.def_id {
        some(id) => some(fresh_default_binder_def_id(ctx, id, remap)),
        none => none
    }
    HParam { ..param, def_id: fresh_def_id }
}

fn freshen_default_pattern_binding(
    mut ctx: InferCtx, binding: HPatternBinding,
    mut remap: Map<Int, Int>
) -> HPatternBinding {
    let fresh = fresh_default_binder_def_id(ctx, binding.def_id, remap)
    HPatternBinding { ..binding, def_id: fresh }
}

fn freshen_default_match_arm(
    mut ctx: InferCtx, arm: HMatchArm, mut remap: Map<Int, Int>
) -> HMatchArm {
    let mut bindings: List<HPatternBinding> = []
    for binding in arm.bindings {
        bindings.push(freshen_default_pattern_binding(ctx, binding, remap))
    }
    let guard = match arm.guard {
        some(value) => some(freshen_default_expr_inner(ctx, value, remap)),
        none => none
    }
    let body = freshen_default_expr_inner(ctx, arm.body, remap)
    HMatchArm { ..arm, bindings: bindings, guard: guard, body: body }
}

fn freshen_default_stmt(
    mut ctx: InferCtx, stmt: HStmt, mut remap: Map<Int, Int>
) -> HStmt {
    match stmt {
        HStmt::Let { def_id, init, .. } => {
            let fresh_init = freshen_default_expr_inner(ctx, init, remap)
            let fresh_def_id = match def_id {
                some(id) => some(fresh_default_binder_def_id(ctx, id, remap)),
                none => none
            }
            HStmt::Let { ..stmt, def_id: fresh_def_id, init: fresh_init }
        },
        HStmt::Var { def_id, init, .. } => {
            let fresh_init = freshen_default_expr_inner(ctx, init, remap)
            let fresh_def_id = match def_id {
                some(id) => some(fresh_default_binder_def_id(ctx, id, remap)),
                none => none
            }
            HStmt::Var { ..stmt, def_id: fresh_def_id, init: fresh_init }
        },
        HStmt::Assign { target, value, .. } =>
            HStmt::Assign { ..stmt,
                target: freshen_default_expr_inner(ctx, target, remap),
                value: freshen_default_expr_inner(ctx, value, remap) },
        HStmt::ExprStmt { expr, .. } =>
            HStmt::ExprStmt { ..stmt,
                expr: freshen_default_expr_inner(ctx, expr, remap) },
        HStmt::Return { value, .. } => {
            let fresh_value = match value {
                some(expr) => some(freshen_default_expr_inner(
                    ctx, expr, remap)),
                none => none
            }
            HStmt::Return { ..stmt, value: fresh_value }
        },
        HStmt::While { condition, body, .. } =>
            HStmt::While { ..stmt,
                condition: freshen_default_expr_inner(ctx, condition, remap),
                body: freshen_default_expr_inner(ctx, body, remap) },
        HStmt::ForIn { def_id, destructure, iterable, body, .. } => {
            let fresh_iterable = freshen_default_expr_inner(
                ctx, iterable, remap)
            let fresh_def_id = match def_id {
                some(id) => some(fresh_default_binder_def_id(ctx, id, remap)),
                none => none
            }
            let fresh_destructure = match destructure {
                some(bindings) => {
                    let mut result: List<HForInDestructure> = []
                    for binding in bindings {
                        let binding_def_id = match binding.def_id {
                            some(id) => some(fresh_default_binder_def_id(
                                ctx, id, remap)),
                            none => none
                        }
                        result.push(HForInDestructure {
                            ..binding, def_id: binding_def_id })
                    }
                    some(result)
                },
                none => none
            }
            let fresh_body = freshen_default_expr_inner(ctx, body, remap)
            HStmt::ForIn { ..stmt, def_id: fresh_def_id,
                destructure: fresh_destructure, iterable: fresh_iterable,
                body: fresh_body }
        },
        HStmt::LetDestructure { bindings, init, .. } => {
            let fresh_init = freshen_default_expr_inner(ctx, init, remap)
            let mut fresh_bindings: List<HLetDestructureBinding> = []
            for binding in bindings {
                let fresh_def_id = match binding.def_id {
                    some(id) => some(fresh_default_binder_def_id(
                        ctx, id, remap)),
                    none => none
                }
                fresh_bindings.push(HLetDestructureBinding {
                    ..binding, def_id: fresh_def_id })
            }
            HStmt::LetDestructure { ..stmt, bindings: fresh_bindings,
                init: fresh_init }
        },
        HStmt::IfLet { bindings, expr, then_block, else_block, .. } => {
            let fresh_expr = freshen_default_expr_inner(ctx, expr, remap)
            let mut fresh_bindings: List<HPatternBinding> = []
            for binding in bindings {
                fresh_bindings.push(freshen_default_pattern_binding(
                    ctx, binding, remap))
            }
            let fresh_then = freshen_default_expr_inner(
                ctx, then_block, remap)
            let fresh_else = match else_block {
                some(value) => some(freshen_default_expr_inner(
                    ctx, value, remap)),
                none => none
            }
            HStmt::IfLet { ..stmt, bindings: fresh_bindings,
                expr: fresh_expr, then_block: fresh_then,
                else_block: fresh_else }
        },
        HStmt::Drop { def_id, .. } => HStmt::Drop { ..stmt,
            def_id: remap_default_def_id(def_id, remap) },
        HStmt::Break { span } => {
            let result_span = span
            HStmt::Break { span: result_span }
        },
        HStmt::Continue { span } => {
            let result_span = span
            HStmt::Continue { span: result_span }
        }
    }
}

fn freshen_default_expr_inner(
    mut ctx: InferCtx, expr: HExpr, mut remap: Map<Int, Int>
) -> HExpr {
    match expr {
        HExpr::Ident { def_id, .. } => HExpr::Ident { ..expr,
            def_id: remap_default_optional_def_id(def_id, remap) },
        HExpr::BinOp { left, right, .. } => HExpr::BinOp { ..expr,
            left: freshen_default_expr_inner(ctx, left, remap),
            right: freshen_default_expr_inner(ctx, right, remap) },
        HExpr::UnaryOp { operand, .. } => HExpr::UnaryOp { ..expr,
            operand: freshen_default_expr_inner(ctx, operand, remap) },
        HExpr::Call {
            callee, callee_def_id, callable_result_def_id, args, ..
        } => {
            let fresh_callee = freshen_default_expr_inner(ctx, callee, remap)
            let fresh_callee_def_id = remap_default_optional_def_id(
                callee_def_id, remap)
            let fresh_result_def_id = match callable_result_def_id {
                some(id) => some(fresh_default_binder_def_id(ctx, id, remap)),
                none => none
            }
            let mut fresh_args: List<HExpr> = []
            for arg in args {
                fresh_args.push(freshen_default_expr_inner(ctx, arg, remap))
            }
            HExpr::Call { ..expr, callee: fresh_callee,
                callee_def_id: fresh_callee_def_id,
                callable_result_def_id: fresh_result_def_id,
                args: fresh_args }
        },
        HExpr::FieldAccess { receiver, .. } => HExpr::FieldAccess { ..expr,
            receiver: freshen_default_expr_inner(ctx, receiver, remap) },
        HExpr::StructLit { fields, spread, .. } => {
            let mut fresh_fields: List<HStructFieldInit> = []
            for field in fields {
                fresh_fields.push(HStructFieldInit { ..field,
                    value: freshen_default_expr_inner(
                        ctx, field.value, remap) })
            }
            let fresh_spread = match spread {
                some(value) => some(freshen_default_expr_inner(
                    ctx, value, remap)),
                none => none
            }
            HExpr::StructLit { ..expr, fields: fresh_fields,
                spread: fresh_spread }
        },
        HExpr::NamedVariantConstruct { fields, spread, .. } => {
            let mut fresh_fields: List<HStructFieldInit> = []
            for field in fields {
                fresh_fields.push(HStructFieldInit { ..field,
                    value: freshen_default_expr_inner(
                        ctx, field.value, remap) })
            }
            let fresh_spread = match spread {
                some(value) => some(freshen_default_expr_inner(
                    ctx, value, remap)),
                none => none
            }
            HExpr::NamedVariantConstruct { ..expr, fields: fresh_fields,
                spread: fresh_spread }
        },
        HExpr::MatchExpr { scrutinee, arms, .. } => {
            let fresh_scrutinee = freshen_default_expr_inner(
                ctx, scrutinee, remap)
            let mut fresh_arms: List<HMatchArm> = []
            for arm in arms {
                fresh_arms.push(freshen_default_match_arm(ctx, arm, remap))
            }
            HExpr::MatchExpr { ..expr, scrutinee: fresh_scrutinee,
                arms: fresh_arms }
        },
        HExpr::TryCatch { body, arms, .. } => {
            let fresh_body = freshen_default_expr_inner(ctx, body, remap)
            let mut fresh_arms: List<HMatchArm> = []
            for arm in arms {
                fresh_arms.push(freshen_default_match_arm(ctx, arm, remap))
            }
            HExpr::TryCatch { ..expr, body: fresh_body, arms: fresh_arms }
        },
        HExpr::Block { stmts, tail, .. } => {
            let mut fresh_stmts: List<HStmt> = []
            for stmt in stmts {
                fresh_stmts.push(freshen_default_stmt(ctx, stmt, remap))
            }
            let fresh_tail = match tail {
                some(value) => some(freshen_default_expr_inner(
                    ctx, value, remap)),
                none => none
            }
            HExpr::Block { ..expr, stmts: fresh_stmts, tail: fresh_tail }
        },
        HExpr::IfExpr { condition, then_branch, else_branch, .. } => {
            let fresh_else = match else_branch {
                some(value) => some(freshen_default_expr_inner(
                    ctx, value, remap)),
                none => none
            }
            HExpr::IfExpr { ..expr,
                condition: freshen_default_expr_inner(ctx, condition, remap),
                then_branch: freshen_default_expr_inner(
                    ctx, then_branch, remap),
                else_branch: fresh_else }
        },
        HExpr::StringInterp { parts, .. } => {
            let mut fresh_parts: List<HStringInterpPart> = []
            for part in parts {
                match part {
                    HStringInterpPart::Literal(value) => {
                        let literal_text = value
                        fresh_parts.push(HStringInterpPart::Literal(
                            literal_text))
                    },
                    HStringInterpPart::Expression(value) => {
                        let expression_for_freshen = value
                        let fresh_expression = freshen_default_expr_inner(
                            ctx, expression_for_freshen, remap)
                        fresh_parts.push(HStringInterpPart::Expression(
                            fresh_expression))
                    }
                }
            }
            HExpr::StringInterp { ..expr, parts: fresh_parts }
        },
        HExpr::HandleExpr { body, handlers, .. } => {
            let fresh_body = freshen_default_expr_inner(ctx, body, remap)
            let mut fresh_handlers: List<HEffectHandler> = []
            for handler in handlers {
                let mut fresh_params: List<HParam> = []
                for param in handler.params {
                    fresh_params.push(freshen_default_param(ctx, param, remap))
                }
                let fresh_resume = match handler.resume_binding {
                    some(binding) => some(freshen_default_pattern_binding(
                        ctx, binding, remap)),
                    none => none
                }
                let fresh_handler_body = freshen_default_expr_inner(
                    ctx, handler.body, remap)
                fresh_handlers.push(HEffectHandler { ..handler,
                    params: fresh_params, resume_binding: fresh_resume,
                    body: fresh_handler_body })
            }
            HExpr::HandleExpr { ..expr, body: fresh_body,
                handlers: fresh_handlers }
        },
        HExpr::Lambda { def_id, params, body, .. } => {
            let fresh_def_id = fresh_default_binder_def_id(
                ctx, def_id, remap)
            let mut fresh_params: List<HParam> = []
            for param in params {
                fresh_params.push(freshen_default_param(ctx, param, remap))
            }
            let fresh_body = freshen_default_expr_inner(ctx, body, remap)
            HExpr::Lambda { ..expr, def_id: fresh_def_id,
                params: fresh_params, body: fresh_body }
        },
        HExpr::EffectOp { args, .. } => {
            let mut fresh_args: List<HExpr> = []
            for arg in args {
                fresh_args.push(freshen_default_expr_inner(ctx, arg, remap))
            }
            HExpr::EffectOp { ..expr, args: fresh_args }
        },
        HExpr::RangeExpr { start, end, .. } => HExpr::RangeExpr { ..expr,
            start: freshen_default_expr_inner(ctx, start, remap),
            end: freshen_default_expr_inner(ctx, end, remap) },
        HExpr::ListLit { elements, .. } => {
            let mut fresh_elements: List<HExpr> = []
            for element in elements {
                fresh_elements.push(freshen_default_expr_inner(
                    ctx, element, remap))
            }
            HExpr::ListLit { ..expr, elements: fresh_elements }
        },
        HExpr::TupleLit { elements, .. } => {
            let mut fresh_elements: List<HExpr> = []
            for element in elements {
                fresh_elements.push(freshen_default_expr_inner(
                    ctx, element, remap))
            }
            HExpr::TupleLit { ..expr, elements: fresh_elements }
        },
        HExpr::IndexExpr { receiver, index, .. } => HExpr::IndexExpr { ..expr,
            receiver: freshen_default_expr_inner(ctx, receiver, remap),
            index: freshen_default_expr_inner(ctx, index, remap) },
        HExpr::Clone { inner, .. } => HExpr::Clone { ..expr,
            inner: freshen_default_expr_inner(ctx, inner, remap) },
        HExpr::Take { source_def_id, .. } => HExpr::Take { ..expr,
            source_def_id: remap_default_def_id(source_def_id, remap) },
        HExpr::ReturnExpr { value, .. } => {
            let fresh_value = match value {
                some(inner) => some(freshen_default_expr_inner(
                    ctx, inner, remap)),
                none => none
            }
            HExpr::ReturnExpr { ..expr, value: fresh_value }
        },
        HExpr::UnsafeBlock { body, .. } => HExpr::UnsafeBlock { ..expr,
            body: freshen_default_expr_inner(ctx, body, remap) },
        HExpr::IntLit { value, ty, effects, span } => {
            let result_ty = ty
            let result_effects = effects
            let result_span = span
            HExpr::IntLit { value: value, ty: result_ty,
                effects: result_effects, span: result_span }
        },
        HExpr::FloatLit { value, ty, effects, span } => {
            let result_ty = ty
            let result_effects = effects
            let result_span = span
            HExpr::FloatLit { value: value, ty: result_ty,
                effects: result_effects, span: result_span }
        },
        HExpr::StrLit { value, ty, effects, span } => {
            let result_value = value
            let result_ty = ty
            let result_effects = effects
            let result_span = span
            HExpr::StrLit { value: result_value, ty: result_ty,
                effects: result_effects, span: result_span }
        },
        HExpr::BoolLit { value, ty, effects, span } => {
            let result_ty = ty
            let result_effects = effects
            let result_span = span
            HExpr::BoolLit { value: value, ty: result_ty,
                effects: result_effects, span: result_span }
        },
        HExpr::DictConstruct {
            base_dict, trait_name, inner, ty, effects, span
        } => {
            let result_base_dict = base_dict
            let result_trait_name = trait_name
            let result_inner = inner
            let result_ty = ty
            let result_effects = effects
            let result_span = span
            HExpr::DictConstruct {
                base_dict: result_base_dict,
                trait_name: result_trait_name,
                inner: result_inner, ty: result_ty,
                effects: result_effects, span: result_span }
        }
    }
}

fn clone_default_authority_for_remap(
    mut ctx: InferCtx, remap: Map<Int, Int>
) {
    for entry in remap.entries() {
        let (old_def_id, fresh_def_id) = entry
        match ctx.env.types.ownership_metadata.callable_by_def_id.get(old_def_id) {
            some(value) => {
                ctx.env.types.ownership_metadata.callable_by_def_id.insert(
                    fresh_def_id, value)
            },
            none => {}
        }
        let callable_state = ctx.env.types.ownership_metadata
            .callable_state_by_def_id.get(old_def_id)
        if callable_state.is_some() {
            ctx.env.types.ownership_metadata.callable_state_by_def_id.insert(
                fresh_def_id, callable_state.unwrap())
        }
        match ctx.env.types.ownership_metadata.callable_result_role_by_def_id
                .get(old_def_id) {
            some(value) => {
                ctx.env.types.ownership_metadata.callable_result_role_by_def_id
                    .insert(fresh_def_id, value)
            },
            none => {}
        }
        match ctx.env.types.ownership_metadata
                .returned_callable_result_role_by_def_id.get(old_def_id) {
            some(value) => {
                ctx.env.types.ownership_metadata
                    .returned_callable_result_role_by_def_id.insert(
                        fresh_def_id, value)
            },
            none => {}
        }
        let role_spine = ctx.env.types.ownership_metadata
            .callable_result_role_spine_by_def_id.get(old_def_id)
        if role_spine.is_some() {
            ctx.env.types.ownership_metadata
                .callable_result_role_spine_by_def_id.insert(
                    fresh_def_id, role_spine.unwrap())
        }
        let use_alias = ctx.use_aliases.get(old_def_id)
        if use_alias.is_some() {
            ctx.use_aliases.insert(fresh_def_id, use_alias.unwrap())
        }
        let binding_kind = ctx.value_binding_kinds.get(old_def_id)
        if binding_kind.is_some() {
            ctx.value_binding_kinds.insert(
                fresh_def_id, binding_kind.unwrap())
        }
        let variant_origin = ctx.env.types.variant_ctor_origins.get(old_def_id)
        if variant_origin.is_some() {
            ctx.env.types.variant_ctor_origins.insert(
                fresh_def_id, variant_origin.unwrap())
        }
        match ctx.pre_solve_exact_value_alias_targets.get(old_def_id) {
            some(target) => {
                ctx.pre_solve_exact_value_alias_targets.insert(
                    fresh_def_id, remap_default_def_id(target, remap))
            },
            none => {}
        }
        if ctx.pre_solve_const_getter_aliases.contains(old_def_id) {
            ctx.pre_solve_const_getter_aliases.insert(fresh_def_id)
        }
        match ctx.pre_solve_callable_alias_targets.get(old_def_id) {
            some(target) => {
                ctx.pre_solve_callable_alias_targets.insert(
                    fresh_def_id, remap_default_def_id(target, remap))
            },
            none => {}
        }
        match ctx.pre_solve_callable_alias_arities.get(old_def_id) {
            some(value) => {
                ctx.pre_solve_callable_alias_arities.insert(
                    fresh_def_id, value)
            },
            none => {}
        }
        match ctx.pre_solve_callable_alias_contracts.get(old_def_id) {
            some(value) => {
                ctx.pre_solve_callable_alias_contracts.insert(
                    fresh_def_id, value)
            },
            none => {}
        }
        let def_span = ctx.env.scope.def_spans.get(old_def_id)
        if def_span.is_some() {
            ctx.env.scope.def_spans.insert(fresh_def_id, def_span.unwrap())
        }
        if ctx.boxed_vars.contains(old_def_id) {
            ctx.boxed_vars.insert(fresh_def_id)
        }
        let lambda_depth = ctx.var_lambda_depth.get(old_def_id)
        if lambda_depth.is_some() {
            ctx.var_lambda_depth.insert(fresh_def_id, lambda_depth.unwrap())
        }
        if ctx.env.scope.mutable_vars.contains(old_def_id) {
            ctx.env.scope.mutable_vars.insert(fresh_def_id)
        }
        if ctx.env.scope.let_defs.contains(old_def_id) {
            ctx.env.scope.let_defs.insert(fresh_def_id)
        }
        if ctx.env.scope.mut_param_defs.contains(old_def_id) {
            ctx.env.scope.mut_param_defs.insert(fresh_def_id)
        }
    }
}

fn merge_default_type_var_bounds(
    mut ctx: InferCtx, fresh_type: Type, bounds: Set<Str>
) {
    match fresh_type {
        Type::TypeVar { id, .. } => {
            let mut merged = match ctx.env.scope.var_bounds.get(id) {
                some(existing) => set_clone(existing),
                none => set_new()
            }
            for bound in bounds {
                let bound_for_insert = bound
                merged.insert(bound_for_insert)
            }
            if merged.len() > 0 {
                ctx.env.scope.var_bounds.insert(id, merged)
            }
        },
        _ => {}
    }
}

fn fresh_default_template_type_mapping(
    mut ctx: InferCtx, template: HExpr,
    live_scheme: TypeScheme, owner_instantiation_map: Map<Int, Type>,
    local_var_bounds: Map<Int, Set<Str>>
) -> Map<Int, Type> {
    // Owner variables follow this exact call's scheme instantiation. Any
    // remaining variable belongs only to the retained default template and
    // receives a fresh call-local identity.
    let mut mapping = map_clone(owner_instantiation_map)
    let template_vars = default_template_var_ids([template])
    let mut sorted_vars = template_vars.to_list()
    sorted_vars.sort()
    for template_var in sorted_vars {
        if !mapping.contains_key(template_var) {
            let fresh = ctx.env.fresh_var()
            let fresh_for_mapping = fresh
            mapping.insert(template_var, fresh_for_mapping)

            let mut bounds: Set<Str> = match local_var_bounds.get(
                    template_var) {
                some(local_bounds) => set_clone(local_bounds),
                none => set_new()
            }
            for scheme_bound in live_scheme.bounds {
                if scheme_bound.type_var == template_var {
                    let bound_trait_name = scheme_bound.trait_name
                    bounds.insert(bound_trait_name)
                }
            }
            merge_default_type_var_bounds(ctx, fresh, bounds)
        }
    }
    mapping
}

fn freshen_default_argument_hir(
    mut ctx: InferCtx, template: HExpr,
    live_scheme: TypeScheme, owner_instantiation_map: Map<Int, Type>,
    local_var_bounds: Map<Int, Set<Str>>
) -> HExpr {
    let template_for_mapping = template
    let template_for_rewrite = template
    let type_mapping = fresh_default_template_type_mapping(
        ctx, template_for_mapping, live_scheme, owner_instantiation_map,
        local_var_bounds)
    let typed_template = rewrite_default_template_types(
        template_for_rewrite, type_mapping)
    let mut remap: Map<Int, Int> = map_new()
    let fresh = freshen_default_expr_inner(ctx, typed_template, remap)
    clone_default_authority_for_remap(ctx, remap)
    fresh
}

fn infer_call(mut ctx: InferCtx, callee: Expr, args: List<Expr>, span: Span, subst: UnionFind) -> InferResult {
    let callee_subst = subst
    let callee_r = infer_expr(ctx, callee, callee_subst)
    let callee_metadata = resolve_callee_metadata(ctx, callee_r.hexpr)
    let pending_callee_name = match callee {
        Expr::Ident { name, .. } => name,
        _ => "<expression>"
    }
    let _ = guard_pending_precheck_callable_summary(
        ctx, hexpr_callable_def_id(callee_r.hexpr),
        pending_callee_name, span)
    let mut s = callee_r.subst
    let mut effects = callee_r.effects

    // Resolve callee type for lambda bidirectional inference
    let resolved_callee = apply_subst(s, hexpr_type(callee_r.hexpr))
    let callee_fn_type: Type? = match resolved_callee {
        Type::FnType { .. } => some(resolved_callee),
        _ => none
    }

    let mut hargs: List<HExpr> = []
    let mut arg_types: List<Type> = []
    let mut ai = 0
    for arg in args {
        let mut ar: InferResult = match arg {
            Expr::Lambda { params: lparams, body: lbody, span: lspan, .. } => {
                match callee_fn_type {
                    some(cft) => match cft {
                        Type::FnType { params: cft_params, .. } => {
                            if ai < cft_params.len() {
                                match cft_params.get(ai) {
                                    some(expected_raw) => {
                                        let expected = apply_subst(s, expected_raw)
                                        match expected {
                                            Type::FnType { params: exp_params, .. } => {
                                                let lambda_arg_span = lspan
                                                let lambda_expected_params = exp_params
                                                infer_lambda(
                                                    ctx, lparams, lbody,
                                                    lambda_arg_span, s,
                                                    some(lambda_expected_params))
                                            },
                                            _ => infer_expr(ctx, arg, s)
                                        }
                                    },
                                    none => infer_expr(ctx, arg, s)
                                }
                            } else { infer_expr(ctx, arg, s) }
                        },
                        _ => infer_expr(ctx, arg, s)
                    },
                    none => infer_expr(ctx, arg, s)
                }
            },
            _ => infer_expr(ctx, arg, s)
        }
        s = ar.subst
        let me = merge_effects(ctx.sink, ctx.env, effects, ar.effects, s, span)
        effects = me.0
        s = me.1
        hargs.push(ar.hexpr)
        arg_types.push(hexpr_type(ar.hexpr))
        ai = ai + 1
    }

    // B-069: Fill in default arguments only from exact DirectCallable
    // metadata. The resolver requires min/default maps as one atomic pair.
    match callee_metadata {
        some(metadata) => match metadata.defaults {
            some(defaults) => {
                let total_arity = defaults.min_arity + defaults.values.len()
                if args.len() < total_arity && args.len() >= defaults.min_arity {
                    let defaults_start = args.len() - defaults.min_arity
                    let mut di = defaults_start
                    while di < defaults.values.len() {
                        match defaults.values.get(di) {
                            some(dh) => {
                                let default_arg = freshen_default_argument_hir(
                                    ctx, dh, metadata.live_scheme,
                                    metadata.instantiation_map,
                                    defaults.local_var_bounds)
                                let default_arg_type = hexpr_type(default_arg)
                                hargs.push(default_arg)
                                arg_types.push(default_arg_type)
                            },
                            none => {}
                        }
                        di = di + 1
                    }
                }
            },
            none => {}
        },
        none => {}
    }

    let ret_var = ctx.env.fresh_var()
    let effect_tail = ctx.env.fresh_var_id()
    let expected_params = arg_types
    let expected_return_type = ret_var
    let expected_fn = Type::FnType {
        params: expected_params,
        return_type: expected_return_type,
        meta: fn_meta(
            EffectRow { effects: [], tail: some(effect_tail) },
            fresh_callable_ownership_inference_term(
                ctx.env.types.ownership_metadata))
    }

    let callee_name_for_note: Str = match callee { Expr::Ident { name: cn, .. } => cn, _ => "<expression>" }
    let call_note_span = span
    let call_notes: List<DiagnosticNote> = [
        DiagnosticNote {
            message: "calling '${callee_name_for_note}' with ${arg_types.len().to_str()} argument(s)",
            span: some(call_note_span)
        }
    ]
    let callee_unify_span = span
    s = unify_at_noted(
        ctx.sink, ctx.env, hexpr_type(callee_r.hexpr), expected_fn,
        s, callee_unify_span, call_notes)
    let resolved_callee_type = apply_subst(s, hexpr_type(callee_r.hexpr))
    match resolved_callee_type {
        Type::FnType { params: callee_params, meta, .. } => {
            let fn_effects = meta.effects
            let callee_effect_span = span
            let me = merge_effects(
                ctx.sink, ctx.env, effects, fn_effects, s,
                callee_effect_span)
            effects = me.0
            s = me.1
            // Cancel mut<T> effects for arguments that are local variables
            effects = cancel_local_mut_effects(ctx, effects, callee_params, fn_effects, hargs, 0, s)
        },
        _ => {}
    }

    let resolved_dicts: List<DictRef> = []
    match callee_metadata {
        some(metadata) => match metadata.kind {
            ValueBindingKind::DirectCallable => {
                if metadata.live_scheme.bounds.len() > 0 {
                    let dict_output_slot = resolved_dicts
                    let direct_dict_span = span
                    resolve_or_defer_dicts_from_scheme(
                        ctx, metadata.live_scheme,
                        hexpr_type(callee_r.hexpr), s, direct_dict_span,
                        PendingDictPurpose::DirectCallPublish {
                            output_slot: dict_output_slot
                        })
                }
            },
            ValueBindingKind::ExternCallable => {
                if metadata.live_scheme.bounds.len() > 0 {
                    // Extern ABI never receives Ring dictionaries. Resolution
                    // remains mandatory for static bound validation.
                    let extern_dict_span = span
                    resolve_or_defer_dicts_from_scheme(
                        ctx, metadata.live_scheme,
                        hexpr_type(callee_r.hexpr), s, extern_dict_span,
                        PendingDictPurpose::ExternCallValidate)
                }
            },
            ValueBindingKind::ConstGetter | ValueBindingKind::LocalBorrow => {}
        },
        none => {}
    }

    // B-100 Fix 3: compute result_type AFTER dict resolution so that
    // associated type vars unified during check_assoc_constraints are
    // reflected in the result.
    let final_ret_var = ret_var
    let result_type = apply_subst(s, final_ret_var)

    // Scalar MutBorrow pre-boxing is intentionally deferred until ownership
    // descriptors are frozen.  At this point aliases, lambdas and higher-order
    // parameters do not yet have an authoritative callable ABI.

    let call_effects = effects
    let final_call_span = span
    InferResult {
        hexpr: HExpr::Call {
            callee: callee_r.hexpr,
            callee_def_id: hexpr_callable_def_id(callee_r.hexpr),
            callable_result_def_id:
                fresh_call_result_callable_def_id(ctx, result_type),
            args: hargs, type_args: [],
            resolved_dicts: resolved_dicts, dict_dispatch: none,
            ty: result_type, effects: call_effects,
            span: final_call_span
        },
        subst: s, effects: effects
    }
}

// ============================================================
// infer_method_call
// ============================================================

fn infer_method_call(mut ctx: InferCtx, receiver: Expr, method: Str, args: List<Expr>, span: Span, subst: UnionFind) -> InferResult {
    // Check if receiver is an effect module
    match receiver {
        Expr::Ident { name: recv_name, qualifier, .. } => {
            let full_effect_name = match qualifier {
                some(q) => "${q}::${recv_name}",
                none => recv_name
            }
            match ctx.env.types.effects.get(full_effect_name) {
                some(_) => {
                    let effect_method = method
                    let effect_span = span
                    let effect_subst = subst
                    return infer_effect_op(
                        ctx, full_effect_name, effect_method, args,
                        effect_span, effect_subst)
                },
                none => {}
            }
        },
        _ => {}
    }

    let receiver_subst = subst
    let recv_r = infer_expr(ctx, receiver, receiver_subst)
    let source_method = method
    let source_span = span
    infer_method_call_from_receiver(
        ctx, some(receiver), recv_r, source_method, args,
        source_span, none)
}

// Shared method-call inference after receiver evaluation. Protocol lowering
// supplies an authoritative selection; ordinary source calls leave it absent
// and use the existing name resolver below. In both cases argument inference,
// unification, effects, dictionaries, and HIR construction remain identical.
fn infer_method_call_from_receiver(
    mut ctx: InferCtx, receiver_source: Expr?, recv_r: InferResult,
    method: Str, args: List<Expr>, span: Span,
    selection: MethodCallSelection?
) -> InferResult {
    let mut s = recv_r.subst
    let mut effects = recv_r.effects
    let recv_type = apply_subst(s, hexpr_type(recv_r.hexpr))
    let receiver_unify_span = span
    let argument_effect_merge_span = span
    let argument_expected_note_span = span
    let argument_unify_span = span
    let excess_arguments_span = span
    let missing_arguments_span = span
    let method_effect_merge_span = span
    let invalid_method_type_span = span
    let missing_method_span = span
    let dict_resolution_span = span
    let authoritative_drop_span = span
    let field_access_span = span
    let method_call_span = span

    // Check receiver mutability for mut self methods
    match receiver_source {
        some(receiver) =>
            check_receiver_mutability(ctx, receiver, recv_type, method, span),
        none => {}
    }

    // Inject mut<T> effect when calling mut method on a mut function parameter
    if is_mut_method_call(ctx, recv_type, method) {
        match receiver_source {
            some(receiver) => match get_expr_def_id(ctx, receiver) {
                some(did) => {
                    if ctx.env.scope.mut_param_defs.contains(did) {
                        let mut_state_type = recv_type
                        let mut_eff = Effect::MutEffect {
                            state_type: mut_state_type
                        }
                        let me = merge_effects(ctx.sink, ctx.env, effects, effect_row([mut_eff]), s, span)
                        effects = me.0
                        s = me.1
                    }
                },
                none => {}
            },
            none => {}
        }
    }

    let mut method_type: Type? = none
    let mut method_scheme: TypeScheme? = none
    let mut method_instantiation_map: Map<Int, Type> = map_new()
    let mut dict_dispatch: DictDispatchInfo? = none
    let mut is_authoritative_drop = false

    match selection {
        some(selected) => {
            method_type = selected.method_type
            method_scheme = selected.method_scheme
            method_instantiation_map = selected.instantiation_map
            dict_dispatch = selected.dict_dispatch
            is_authoritative_drop = selected.is_authoritative_drop
        },
        none => {}
    }

    // Look up method in impl for struct/enum
    if method_type.is_none() {
        match recv_type {
            Type::StructType { name, .. } => {
                let r = lookup_impl_method(ctx, name, method)
                method_type = r.method_type
                method_scheme = r.method_scheme
                method_instantiation_map = r.instantiation_map
                is_authoritative_drop = r.is_authoritative_drop
            },
            Type::EnumType { name, .. } => {
                let r = lookup_impl_method(ctx, name, method)
                method_type = r.method_type
                method_scheme = r.method_scheme
                method_instantiation_map = r.instantiation_map
                is_authoritative_drop = r.is_authoritative_drop
            },
            _ => {}
        }
    }

    // Method lookup for primitive types
    if method_type.is_none() {
        match type_to_builtin_name(recv_type) {
            some(prim_name) => {
                let r = lookup_impl_method(ctx, prim_name, method)
                method_type = r.method_type
                method_scheme = r.method_scheme
                method_instantiation_map = r.instantiation_map
                is_authoritative_drop = r.is_authoritative_drop
            },
            none => {}
        }
    }

    // Check trait impls
    if method_type.is_none() {
        match type_to_builtin_name(recv_type) {
            some(type_name) => {
                let r = lookup_trait_method(ctx, type_name, method, span)
                method_type = r.method_type
                method_scheme = r.method_scheme
                method_instantiation_map = r.instantiation_map
                is_authoritative_drop = r.is_authoritative_drop
            },
            none => {}
        }
    }

    // Check fn bounds for type variable receivers
    let recv_raw_type = hexpr_type(recv_r.hexpr)
    let recv_var_id = match recv_raw_type {
        Type::TypeVar { id, .. } => some(resolve_var_id(id, s)),
        _ => none
    }
    if method_type.is_none() {
        match recv_var_id {
            some(rvid) => {
                for fb in ctx.current_fn_bounds {
                    if resolve_var_id(fb.type_param_var_id, s) == rvid {
                        match ctx.env.trait_reg.traits.get(fb.trait_name) {
                            some(trait_def) => {
                                let tm = trait_def.methods.find(fn(m) { m.name == method })
                                match tm {
                                    some(found_method) => {
                                        let exact_scheme = TypeScheme {
                                            ty: found_method.ty,
                                            type_vars: trait_def.type_param_vars,
                                            bounds: [],
                                            def_id: some(found_method.def_id)
                                        }
                                        let instantiation =
                                            ctx.env.instantiate_with_map(
                                                exact_scheme)
                                        method_type = some(instantiation.ty)
                                        method_instantiation_map =
                                            instantiation.var_map
                                        method_scheme = some(exact_scheme)
                                        is_authoritative_drop =
                                            trait_is_authoritative_drop(
                                                ctx.env.trait_reg,
                                                some(fb.trait_name))
                                        let dispatch_method = method
                                        dict_dispatch = some(DictDispatchInfo {
                                            dict_param: trait_bound_param_name(
                                                fb.type_param_name,
                                                fb.trait_name),
                                            method: dispatch_method
                                        })
                                    },
                                    none => {}
                                }
                            },
                            none => {}
                        }
                    }
                }
            },
            none => {}
        }
    }

    match method_scheme {
        some(scheme) => {
            let _ = guard_pending_precheck_callable_summary(
                ctx, scheme.def_id, method, span)
        },
        none => {}
    }

    // Early receiver-method unification for bidirectional type checking
    match method_type {
        some(mt) => match mt {
            Type::FnType { params: mt_params, .. } => {
                if mt_params.len() > 0 {
                    match mt_params.first() {
                        some(first_param) => {
                            let recv_notes: List<DiagnosticNote> = [
                                DiagnosticNote { message: "method '${method}' expects receiver of type '${type_to_string(apply_subst(s, first_param))}'", span: some(span) },
                                DiagnosticNote { message: "receiver has type '${type_to_string(apply_subst(s, hexpr_type(recv_r.hexpr)))}'", span: some(hexpr_span(recv_r.hexpr)) }
                            ]
                            s = unify_at_noted(ctx.sink, ctx.env, hexpr_type(recv_r.hexpr), first_param, s, receiver_unify_span, recv_notes)
                        },
                        none => {}
                    }
                }
            },
            _ => {}
        },
        none => {}
    }

    // Infer arguments with lambda type propagation
    let mut hargs: List<HExpr> = []
    let mut ai = 0
    for arg in args {
        let mut ar: InferResult = match arg {
            Expr::Lambda { params: lparams, body: lbody, span: lspan, .. } => {
                match method_type {
                    some(mt) => match mt {
                        Type::FnType { params: mt_params, .. } => {
                            if ai + 1 < mt_params.len() {
                                match mt_params.get(ai + 1) {
                                    some(expected_raw) => {
                                        let expected = apply_subst(s, expected_raw)
                                        match expected {
                                            Type::FnType { params: exp_params, .. } => {
                                                let lambda_span = lspan
                                                let lambda_expected_params = exp_params
                                                infer_lambda(ctx, lparams, lbody, lambda_span, s, some(lambda_expected_params))
                                            },
                                            _ => infer_expr(ctx, arg, s)
                                        }
                                    },
                                    none => infer_expr(ctx, arg, s)
                                }
                            } else { infer_expr(ctx, arg, s) }
                        },
                        _ => infer_expr(ctx, arg, s)
                    },
                    none => infer_expr(ctx, arg, s)
                }
            },
            _ => infer_expr(ctx, arg, s)
        }
        s = ar.subst
        let me = merge_effects(ctx.sink, ctx.env, effects, ar.effects, s, argument_effect_merge_span)
        effects = me.0
        s = me.1
        hargs.push(ar.hexpr)
        ai = ai + 1
    }

    // Methods use the same default-template pipeline as direct functions, but
    // the receiver occupies parameter slot zero and is already evaluated.
    // Resolve metadata by the selected method DefId, never by its spelling.
    match method_scheme {
        some(scheme) => match scheme.def_id {
            some(method_def_id) => match callable_defaults_by_def_id(
                    ctx, method_def_id) {
                some(defaults) => {
                    let required_args = if defaults.min_arity > 0 {
                        defaults.min_arity - 1
                    } else { 0 }
                    let total_args = required_args + defaults.values.len()
                    if args.len() < total_args &&
                       args.len() >= required_args {
                        let defaults_start = args.len() - required_args
                        let mut di = defaults_start
                        while di < defaults.values.len() {
                            match defaults.values.get(di) {
                                some(template) => {
                                    let default_arg =
                                        freshen_default_argument_hir(
                                            ctx, template, scheme,
                                            method_instantiation_map,
                                            defaults.local_var_bounds)
                                    hargs.push(default_arg)
                                },
                                none => {}
                            }
                            di = di + 1
                        }
                    }
                },
                none => {}
            },
            none => {}
        },
        none => {}
    }

    let mut result_type: Type = ctx.env.fresh_var()
    match method_type {
        some(mt) => match mt {
            Type::FnType { params: mt_params, return_type: mt_ret, meta } => {
                let mt_effects = meta.effects
                let mut i = 0
                for harg in hargs {
                    if i + 1 < mt_params.len() {
                        match mt_params.get(i + 1) {
                            some(expected_param) => {
                                let current_argument_expected_note_span =
                                    argument_expected_note_span
                                let arg_num = (i + 1).to_str()
                                let marg_notes: List<DiagnosticNote> = [
                                    DiagnosticNote { message: "argument ${arg_num} of method '${method}' expects type '${type_to_string(apply_subst(s, expected_param))}'", span: some(current_argument_expected_note_span) },
                                    DiagnosticNote { message: "argument has type '${type_to_string(apply_subst(s, hexpr_type(harg)))}'", span: some(hexpr_span(harg)) }
                                ]
                                s = unify_at_noted(ctx.sink, ctx.env, hexpr_type(harg), expected_param, s, argument_unify_span, marg_notes)
                            },
                            none => {}
                        }
                    }
                    i = i + 1
                }
                // Check for excess arguments (mt_params[0] is self)
                let expected_args = mt_params.len() - 1
                if hargs.len() > expected_args {
                    let _ = type_error(ctx.sink, E0301,
                        "Method '${method}' expects ${expected_args.to_str()} argument(s), got ${hargs.len().to_str()}",
                        excess_arguments_span, DiagnosticContext::TypeMismatch { expected: "${expected_args.to_str()} args", actual: "${hargs.len().to_str()} args", expression: none })
                }
                // Check for too few arguments (mt_params[0] is self)
                if hargs.len() < expected_args {
                    let _ = type_error(ctx.sink, E0301,
                        "Method '${method}' expects ${expected_args.to_str()} argument(s), got ${hargs.len().to_str()}",
                        missing_arguments_span, DiagnosticContext::TypeMismatch { expected: "${expected_args.to_str()} args", actual: "${hargs.len().to_str()} args", expression: none })
                }
                result_type = apply_subst(s, mt_ret)
                let me = merge_effects(ctx.sink, ctx.env, effects, mt_effects, s, method_effect_merge_span)
                effects = me.0
                s = me.1
                // Cancel mut<T> effects for method arguments that are local variables
                // param_offset=1 because mt_params[0] is self
                effects = cancel_local_mut_effects(ctx, effects, mt_params, mt_effects, hargs, 1, s)
            },
            _ => {
                match recv_type {
                    Type::TypeVar { .. } => {},
                    _ => { let _ = type_error(ctx.sink, E0305,
                        "Type '${type_to_string(recv_type)}' has no method '${method}'",
                        invalid_method_type_span, DiagnosticContext::OtherContext { detail: some("no method '${method}' on type '${type_to_string(recv_type)}'") }) }
                }
            }
        },
        none => {
            match recv_type {
                Type::TypeVar { .. } => {},
                _ => { let _ = type_error(ctx.sink, E0305,
                    "Type '${type_to_string(recv_type)}' has no method '${method}'",
                    missing_method_span, DiagnosticContext::OtherContext { detail: some("no method '${method}' on type '${type_to_string(recv_type)}'") }) }
            }
        }
    }

    let resolved_dicts: List<DictRef> = []
    match method_scheme {
        some(ms) => {
            if ms.bounds.len() > 0 {
                match method_type {
                    some(mt) => {
                        let dict_output_slot = resolved_dicts
                        let dict_scheme = ms
                        let dict_method_type = mt
                        resolve_or_defer_dicts_from_scheme(
                            ctx, dict_scheme, dict_method_type, s, dict_resolution_span,
                            PendingDictPurpose::DirectCallPublish {
                                output_slot: dict_output_slot
                            })
                    },
                    none => {}
                }
            }
        },
        none => {}
    }

    // B-100 Fix 3: recompute result_type after dict resolution so
    // associated type unifications are visible.
    result_type = apply_subst(s, result_type)

    let callee_type = match method_type { some(mt) => mt, none => ctx.env.fresh_var() }
    let exact_method_def_id = match method_scheme {
        some(scheme) => scheme.def_id,
        none => none
    }
    if is_authoritative_drop {
        let _ = type_error(ctx.sink, E0801,
            "Drop::drop cannot be called directly", authoritative_drop_span,
            DiagnosticContext::OtherContext { detail: some(
                "release the owning binding normally; only runtime drop glue may invoke the user destructor") })
    }
    let method_call_effects = effects
    InferResult {
        hexpr: HExpr::Call {
            callee: HExpr::FieldAccess {
                receiver: recv_r.hexpr, field: method, ty: callee_type,
                effects: EMPTY_ROW, span: field_access_span
            },
            callee_def_id: exact_method_def_id,
            callable_result_def_id:
                fresh_call_result_callable_def_id(ctx, result_type),
            args: hargs, type_args: [], resolved_dicts: resolved_dicts,
            dict_dispatch: dict_dispatch,
            ty: result_type, effects: method_call_effects, span: method_call_span
        },
        subst: s, effects: effects
    }
}

// ============================================================
// infer_effect_op
// ============================================================

fn infer_effect_op(mut ctx: InferCtx, effect_name: Str, op_name: Str, args: List<Expr>, span: Span, subst: UnionFind) -> InferResult {
    let effect_def_opt = ctx.env.types.effects.get(effect_name)
    match effect_def_opt {
        none => {
            let effect_display = nominal_display_name(effect_name)
            let _ = type_error(ctx.sink, E0402,
                "Unknown effect: ${effect_display}",
                span, DiagnosticContext::OtherContext { detail: some("effect '${effect_display}' not found") })
            return InferResult {
                hexpr: HExpr::EffectOp { effect_name: effect_name,
                    op_name: op_name, is_abortive: false, args: [],
                    ty: Type::ErrorType, effects: EMPTY_ROW, span: span },
                subst: subst, effects: EMPTY_ROW
            }
        },
        _ => {}
    }
    let effect_def = match effect_def_opt { some(ed) => ed, none => panic("unreachable: effect_def_opt after none early return") }
    // Use canonical name from EffectDef so mod-internal unqualified references
    // (e.g. "Greeter") resolve to the declaration name (e.g. "fx::Greeter")
    let canonical_effect_name = effect_def.name
    let op_opt = effect_def.ops.find(fn(o) { o.name == op_name })
    match op_opt {
        none => {
            let effect_display = nominal_display_name(canonical_effect_name)
            let _ = type_error(ctx.sink, E0402,
                "Effect ${effect_display} has no operation ${op_name}",
                span, DiagnosticContext::OtherContext { detail: some("no operation '${op_name}' on effect '${effect_display}'") })
            return InferResult {
                hexpr: HExpr::EffectOp { effect_name: canonical_effect_name,
                    op_name: op_name, is_abortive: false, args: [],
                    ty: Type::ErrorType, effects: EMPTY_ROW, span: span },
                subst: subst, effects: EMPTY_ROW
            }
        },
        _ => {}
    }
    let op = match op_opt { some(o) => o, none => panic("unreachable: op_opt after none early return") }

    // Instantiate effect type params with fresh variables
    let mut inst_map: Map<Int, Type> = map_new()
    let mut inst_type_args: List<Type> = []
    let mut tpi = 0
    for tpv in effect_def.type_param_vars {
        let fresh = ctx.env.fresh_var()
        let instantiation_key = tpv
        let instantiation_value = fresh
        inst_map.insert(instantiation_key, instantiation_value)
        inst_type_args.push(fresh)
        tpi = tpi + 1
    }

    // Apply instantiation to op param types and return type
    let mut inst_params: List<Type> = []
    for pt in op.params {
        inst_params.push(apply_subst_map(inst_map, pt))
    }
    let inst_ret = apply_subst_map(inst_map, op.return_type)

    if args.len() != inst_params.len() {
        let effect_display = nominal_display_name(effect_name)
        let _ = type_error(ctx.sink, E0301,
            "Effect operation '${effect_display}.${op_name}' expects ${inst_params.len().to_str()} argument(s), got ${args.len().to_str()}",
            span, DiagnosticContext::TypeMismatch { expected: "${inst_params.len().to_str()} args", actual: "${args.len().to_str()} args", expression: none })
    }

    let mut s = subst
    let mut effects: EffectRow = EMPTY_ROW
    let mut hargs: List<HExpr> = []

    let mut i = 0
    for arg in args {
        let ar = infer_expr(ctx, arg, s)
        s = ar.subst
        let me = merge_effects(ctx.sink, ctx.env, effects, ar.effects, s, span)
        effects = me.0
        s = me.1
        hargs.push(ar.hexpr)
        match inst_params.get(i) {
            some(param_type) => { s = unify_at(ctx.sink, ctx.env, hexpr_type(ar.hexpr), param_type, s, span) },
            none => {}
        }
        i = i + 1
    }

    let custom_effect_name = canonical_effect_name
    let mut eff: Effect = Effect::CustomEffect {
        name: custom_effect_name, type_args: inst_type_args
    }
    let mut is_abortive = false
    match effect_def.built_in_kind {
        some(bik) => match bik {
            BuiltInKind::BkIo => { eff = Effect::IoEffect },
            BuiltInKind::BkFail => {
                let error_type = if hargs.len() > 0 { apply_subst(s, hexpr_type(match hargs.first() { some(h) => h, none => panic("unreachable: hargs.first() after len > 0 check") })) } else { UNIT }
                eff = Effect::FailEffect { error_type: error_type }
                is_abortive = op_name == "raise"
            },
            BuiltInKind::BkMut => { eff = Effect::MutEffect { state_type: ctx.env.fresh_var() } }
        },
        none => {}
    }

    let me = merge_effects(ctx.sink, ctx.env, effects, effect_row([eff]), s, span)
    effects = me.0
    s = me.1

    let effect_op_effects = effects
    InferResult {
        hexpr: HExpr::EffectOp { effect_name: canonical_effect_name,
            op_name: op_name, is_abortive: is_abortive, args: hargs,
            ty: inst_ret, effects: effect_op_effects, span: span },
        subst: s, effects: effects
    }
}

// ============================================================
// infer_field_access
// ============================================================

fn infer_field_access(mut ctx: InferCtx, receiver: Expr, field: Str, span: Span, subst: UnionFind) -> InferResult {
    let receiver_subst = subst
    let recv_r = infer_expr(ctx, receiver, receiver_subst)
    let s = recv_r.subst
    let recv_type = apply_subst(s, hexpr_type(recv_r.hexpr))

    let mut field_type: Type = ctx.env.fresh_var()
    match recv_type {
        Type::StructType { name, type_params, .. } => {
            match ctx.env.types.structs.get(name) {
                some(struct_def) => {
                    let f = struct_def.fields.find(fn(f_) { f_.name == field })
                    match f {
                        some(found_field) => {
                            let mut inst_map: Map<Int, Type> = map_new()
                            let mut fi = 0
                            while fi < struct_def.type_param_vars.len() && fi < type_params.len() {
                                match (struct_def.type_param_vars.get(fi), type_params.get(fi)) {
                                    (some(var_id), some(tp)) => {
                                        let type_param_id = var_id
                                        let type_param = tp
                                        inst_map.insert(type_param_id, type_param)
                                    },
                                    _ => {}
                                }
                                fi = fi + 1
                            }
                            field_type = apply_subst_map(inst_map, found_field.ty)
                        },
                        none => {
                            let missing_struct_field = field
                            let missing_struct_type_name = name
                            let _ = type_error(ctx.sink, E0304,
                            "Struct ${name} has no field ${field}",
                            span, DiagnosticContext::MissingField {
                                field: missing_struct_field,
                                ty: missing_struct_type_name, available: none
                            })
                        }
                    }
                },
                none => { let _ = type_error(ctx.sink, E0203,
                    "Unknown struct: ${name}",
                    span, DiagnosticContext::OtherContext { detail: some("unknown struct '${name}'") }) }
            }
        },
        Type::RecordType { fields: rec_fields, tail, .. } => {
            let f = rec_fields.find(fn(f_) { f_.name == field })
            match f {
                some(found_field) => { field_type = found_field.ty },
                none => match tail {
                    some(_) => {},
                    none => {
                        let missing_record_field = field
                        let _ = type_error(ctx.sink, E0304,
                        "Record type has no field '${field}'",
                        span, DiagnosticContext::MissingField {
                            field: missing_record_field,
                            ty: "record", available: none
                        })
                    }
                }
            }
        },
        Type::TupleType { elements } => {
            match parse_int(field) {
                none => {
                    let invalid_tuple_field = field
                    let _ = type_error(ctx.sink, E0304,
                    "Cannot access named field '${field}' on tuple type; use .0, .1, etc.",
                    span, DiagnosticContext::MissingField {
                        field: invalid_tuple_field,
                        ty: "tuple", available: none
                    })
                },
                some(i) => {
                    if i < 0 || i >= elements.len() {
                        let out_of_bounds_field = field
                        let _ = type_error(ctx.sink, E0304,
                            "Tuple index ${field} out of bounds; tuple has ${elements.len().to_str()} elements",
                            span, DiagnosticContext::MissingField {
                                field: out_of_bounds_field,
                                ty: "tuple", available: none
                            })
                        field_type = Type::ErrorType
                    } else {
                        match elements.get(i) {
                            some(t) => { field_type = t },
                            none => { field_type = Type::ErrorType }
                        }
                    }
                }
            }
        },
        Type::TypeVar { .. } => {},
        _ => {
            let invalid_access_field = field
            let _ = type_error(ctx.sink, E0304,
            "Cannot access field '${field}' on type ${type_to_string(recv_type)}",
            span, DiagnosticContext::MissingField {
                field: invalid_access_field,
                ty: type_to_string(recv_type), available: none
            })
        }
    }

    InferResult {
        hexpr: HExpr::FieldAccess { receiver: recv_r.hexpr, field: field, ty: field_type, effects: recv_r.effects, span: span },
        subst: s, effects: recv_r.effects
    }
}

// ============================================================
// infer_struct_lit
// ============================================================

fn infer_struct_lit(mut ctx: InferCtx, name: Str, fields: List<StructFieldInit>, spread: Expr?, span: Span, subst: UnionFind, qualifier: Str?) -> InferResult {
    // Resolve relative paths (self::/super::)
    let mut resolved_qualifier = qualifier
    match qualifier {
        some(q) => {
            if q == "self" || q.starts_with("super") {
                match resolve_relative_qualifier(q, ctx.mod_path_stack) {
                    some(prefix) => {
                        if prefix == "" {
                            resolved_qualifier = none
                        } else {
                            let resolved_prefix = prefix
                            resolved_qualifier = some(resolved_prefix)
                        }
                    },
                    none => {
                        let _ = type_error(ctx.sink, E0705,
                            "Cannot use '${q}' — relative path exceeds module nesting depth",
                            span, DiagnosticContext::OtherContext { detail: some("relative path out of scope") })
                        return InferResult {
                            hexpr: HExpr::StructLit { name: name, type_args: [], fields: [], spread: none, ty: Type::ErrorType, effects: EMPTY_ROW, span: span },
                            subst: subst, effects: EMPTY_ROW
                        }
                    }
                }
            }
        },
        none => {}
    }

    // Try module-qualified struct lookup: qualifier::name
    match resolved_qualifier {
        some(q) => {
            let qualified_name = "${q}::${name}"
            let mod_struct = ctx.env.types.structs.get(qualified_name)
            match mod_struct {
                some(_) => {
                    return infer_struct_lit(ctx, qualified_name, fields, spread, span, subst, none)
                },
                none => {
                    // Fallback: try prepending current mod path for relative references
                    if ctx.mod_path_stack.len() > 0 {
                        let mod_prefix = ctx.mod_path_stack.join("::")
                        let full_qualified = "${mod_prefix}::${qualified_name}"
                        let full_struct = ctx.env.types.structs.get(full_qualified)
                        match full_struct {
                            some(_) => {
                                return infer_struct_lit(ctx, full_qualified, fields, spread, span, subst, none)
                            },
                            none => {}
                        }
                    }
                }
            }
        },
        none => {}
    }

    // Check for named enum variant
    let mut variant_enum: Str? = none
    match resolved_qualifier {
        some(q) => {
            match ctx.env.types.enums.get(q) {
                some(enum_def) => {
                    if enum_def.variant_index.contains_key(name) { variant_enum = some(enum_def.name) }
                },
                none => {
                    // Fallback: try prepending current mod path
                    if ctx.mod_path_stack.len() > 0 {
                        let mod_prefix = ctx.mod_path_stack.join("::")
                        let full_q = "${mod_prefix}::${q}"
                        match ctx.env.types.enums.get(full_q) {
                            some(enum_def) => {
                                if enum_def.variant_index.contains_key(name) { variant_enum = some(enum_def.name) }
                            },
                            none => {}
                        }
                    }
                }
            }
        },
        none => { variant_enum = ctx.env.types.variant_to_enum.get(name) }
    }
    if variant_enum.is_none() && resolved_qualifier.is_some() {
        match resolved_qualifier {
            some(q) => {
                let qualifier_display = nominal_display_name(q)
                let missing_variant_name = name
                let _ = type_error(ctx.sink, E0201, "'${qualifier_display}' has no variant '${name}'", span,
                    DiagnosticContext::UndefinedVariable {
                        name: missing_variant_name, scope_locals: none
                    })
            },
            none => {}
        }
    }
    match variant_enum {
        some(ve) => match ctx.env.types.enums.get(ve) {
            some(enum_def) => {
                let variant = lookup_variant(enum_def, name)
                match variant {
                    some(v) => match v.field_names {
                        some(_) => {
                            let variant_enum_name = ve
                            return infer_named_variant_construct(ctx, variant_enum_name, name, v, enum_def, fields, spread, span, subst)
                        },
                        none => {}
                    },
                    none => {}
                }
            },
            none => {}
        },
        none => {}
    }

    let struct_def_opt = ctx.env.types.structs.get(name)
    match struct_def_opt {
        none => {
            let _ = type_error(ctx.sink, E0203, "Unknown struct: ${name}", span,
                DiagnosticContext::OtherContext { detail: some("unknown struct '${name}'") })
            return InferResult {
                hexpr: HExpr::StructLit { name: name, type_args: [], fields: [], spread: none, ty: Type::ErrorType, effects: EMPTY_ROW, span: span },
                subst: subst, effects: EMPTY_ROW
            }
        },
        _ => {}
    }
    let struct_def = match struct_def_opt { some(sd) => sd, none => panic("unreachable: struct_def_opt after none early return") }

    let mut inst_map: Map<Int, Type> = map_new()
    let mut type_param_types: List<Type> = []
    let mut tpi = 0
    while tpi < struct_def.type_param_vars.len() {
        match struct_def.type_param_vars.get(tpi) {
            some(var_id) => {
                let tv = ctx.env.fresh_var()
                let instantiation_key = var_id
                let instantiation_value = tv
                inst_map.insert(instantiation_key, instantiation_value)
                type_param_types.push(tv)
            },
            none => {}
        }
        tpi = tpi + 1
    }

    let mut s = subst
    let mut effects: EffectRow = EMPTY_ROW
    let mut hfields: List<HStructFieldInit> = []

    let mut hspread: HExpr? = none
    match spread {
        some(sp) => {
            let sr = infer_expr(ctx, sp, s)
            s = sr.subst
            let me = merge_effects(ctx.sink, ctx.env, effects, sr.effects, s, span)
            effects = me.0
            s = me.1
            let spread_type_params = type_param_types
            let spread_type = Type::StructType {
                name: struct_def.name, type_params: spread_type_params
            }
            s = unify_at(ctx.sink, ctx.env, hexpr_type(sr.hexpr), spread_type, s, span)
            hspread = some(sr.hexpr)
        },
        none => {}
    }

    for field in fields {
        let fr = infer_expr(ctx, field.value, s)
        s = fr.subst
        let me = merge_effects(ctx.sink, ctx.env, effects, fr.effects, s, span)
        effects = me.0
        s = me.1
        let def_field = struct_def.fields.find(fn(f) { f.name == field.name })
        match def_field {
            some(df) => {
                let ft = apply_subst_map(inst_map, df.ty)
                let field_notes: List<DiagnosticNote> = [
                    DiagnosticNote { message: "field '${field.name}' of struct '${name}' expects type '${type_to_string(ft)}'", span: some(field.span) },
                    DiagnosticNote { message: "provided value has type '${type_to_string(apply_subst(s, hexpr_type(fr.hexpr)))}'", span: some(hexpr_span(fr.hexpr)) }
                ]
                s = unify_at_noted(ctx.sink, ctx.env, hexpr_type(fr.hexpr), ft, s, span, field_notes)
            },
            none => {
                let missing_field_owner = name
                let _ = type_error(ctx.sink, E0203,
                "Struct '${name}' has no field '${field.name}'",
                field.span, DiagnosticContext::MissingField {
                    field: field.name, ty: missing_field_owner,
                    available: none
                })
            }
        }
        hfields.push(HStructFieldInit { name: field.name, value: fr.hexpr })
    }

    if spread.is_none() {
        let mut provided: Set<Str> = set_new()
        for f in fields { provided.insert(f.name) }
        for df in struct_def.fields {
            if !provided.contains(df.name) {
                let missing_field_owner = name
                let _ = type_error(ctx.sink, E0203,
                    "Missing field '${df.name}' in struct literal '${name}'",
                    span, DiagnosticContext::MissingField {
                        field: df.name, ty: missing_field_owner,
                        available: none
                    })
            }
        }
    }

    let struct_type = Type::StructType {
        name: struct_def.name, type_params: type_param_types
    }

    let struct_lit_effects = effects
    InferResult {
        hexpr: HExpr::StructLit { name: struct_def.name, type_args: [], fields: hfields, spread: hspread, ty: struct_type, effects: struct_lit_effects, span: span },
        subst: s, effects: effects
    }
}

fn infer_named_variant_construct(mut ctx: InferCtx, enum_name: Str, variant_name: Str, variant: EnumVariant, enum_def: EnumDef, fields: List<StructFieldInit>, spread: Expr?, span: Span, subst: UnionFind) -> InferResult {
    let field_names = match variant.field_names { some(fn_) => fn_, none => [] }

    let mut inst_map: Map<Int, Type> = map_new()
    let mut type_param_types: List<Type> = []
    let mut tpi = 0
    while tpi < enum_def.type_param_vars.len() {
        match enum_def.type_param_vars.get(tpi) {
            some(var_id) => {
                let tv = ctx.env.fresh_var()
                let instantiation_key = var_id
                let instantiation_value = tv
                inst_map.insert(instantiation_key, instantiation_value)
                type_param_types.push(tv)
            },
            none => {}
        }
        tpi = tpi + 1
    }

    let mut s = subst
    let mut effects: EffectRow = EMPTY_ROW
    let mut hfields: List<HStructFieldInit> = []

    let mut hspread: HExpr? = none
    match spread {
        some(sp) => {
            let sr = infer_expr(ctx, sp, s)
            s = sr.subst
            let me = merge_effects(ctx.sink, ctx.env, effects, sr.effects, s, span)
            effects = me.0
            s = me.1
            let spread_enum_name = enum_name
            let spread_type_params = type_param_types
            let spread_enum_type = Type::EnumType {
                name: spread_enum_name, type_params: spread_type_params
            }
            s = unify_at(ctx.sink, ctx.env, hexpr_type(sr.hexpr), spread_enum_type, s, span)
            hspread = some(sr.hexpr)
        },
        none => {}
    }

    for field in fields {
        let fr = infer_expr(ctx, field.value, s)
        s = fr.subst
        let me = merge_effects(ctx.sink, ctx.env, effects, fr.effects, s, span)
        effects = me.0
        s = me.1
        let field_idx = field_names.index_of(field.name)
        match field_idx {
            some(idx) => match variant.fields.get(idx) {
                some(ftype) => {
                    let ft = apply_subst_map(inst_map, ftype)
                    s = unify_at(ctx.sink, ctx.env, hexpr_type(fr.hexpr), ft, s, span)
                },
                none => {}
            },
            none => {
                let missing_field_variant = variant_name
                let _ = type_error(ctx.sink, E0203,
                "Variant '${variant_name}' has no field '${field.name}'",
                field.span, DiagnosticContext::MissingField {
                    field: field.name, ty: missing_field_variant,
                    available: none
                })
            }
        }
        hfields.push(HStructFieldInit { name: field.name, value: fr.hexpr })
    }

    if spread.is_none() {
        let mut provided: Set<Str> = set_new()
        for f in fields { provided.insert(f.name) }
        for fn_name in field_names {
            if !provided.contains(fn_name) {
                let missing_field_name = fn_name
                let missing_field_variant = variant_name
                let _ = type_error(ctx.sink, E0203,
                    "Missing field '${fn_name}' in variant '${variant_name}'",
                    span, DiagnosticContext::MissingField {
                        field: missing_field_name, ty: missing_field_variant,
                        available: none
                    })
            }
        }
    }

    let enum_type_name = enum_name
    let enum_type = Type::EnumType {
        name: enum_type_name, type_params: type_param_types
    }

    let variant_construct_effects = effects
    InferResult {
        hexpr: HExpr::NamedVariantConstruct {
            enum_name: enum_name, variant_name: variant_name,
            fields: hfields, spread: hspread, ty: enum_type,
            effects: variant_construct_effects, span: span
        },
        subst: s, effects: effects
    }
}

// ============================================================
// infer_match
// ============================================================

fn collect_exact_pattern_bindings(
    env: TypeEnv, pattern: Pattern, mut seen: Set<Str>,
    mut out: List<HPatternBinding>
) {
    match pattern {
        Pattern::Wildcard { .. } | Pattern::Literal { .. } => {},
        Pattern::Binding { name, .. } => {
            if name != "_" && !seen.contains(name) {
                let seen_name = name
                seen.insert(seen_name)
                let scheme = match env.lookup(name) {
                    some(value) => value,
                    none => panic(
                        "unreachable: inferred pattern binding is absent from its lexical scope")
                }
                let def_id = match scheme.def_id {
                    some(id) => id,
                    none => panic(
                        "unreachable: inferred pattern binding has no exact DefId")
                }
                let hir_binding_name = name
                out.push(HPatternBinding {
                    name: hir_binding_name, def_id: def_id, ty: scheme.ty
                })
            }
        },
        Pattern::Constructor { fields, .. } => {
            for field in fields {
                collect_exact_pattern_bindings(env, field, seen, out)
            }
        },
        Pattern::NamedConstructor { fields, .. } => {
            for field in fields {
                collect_exact_pattern_bindings(
                    env, field.pattern, seen, out)
            }
        },
        Pattern::TuplePattern { elements, .. } => {
            for element in elements {
                collect_exact_pattern_bindings(env, element, seen, out)
            }
        },
        Pattern::OrPattern { patterns, .. } => {
            for alternative in patterns {
                collect_exact_pattern_bindings(
                    env, alternative, seen, out)
            }
        }
    }
}

fn exact_pattern_bindings(
    env: TypeEnv, pattern: Pattern
) -> List<HPatternBinding> {
    let mut result: List<HPatternBinding> = []
    let mut seen: Set<Str> = set_new()
    collect_exact_pattern_bindings(env, pattern, seen, result)
    result
}

fn infer_match(mut ctx: InferCtx, scrutinee: Expr, arms: List<MatchArm>, span: Span, subst: UnionFind) -> InferResult {
    let initial_subst = subst
    let scrut_r = infer_expr(ctx, scrutinee, initial_subst)
    let mut s = scrut_r.subst
    let mut effects = scrut_r.effects
    let result_type = ctx.env.fresh_var()
    let mut harms: List<HMatchArm> = []
    // #180: Never is the bottom type and never constrains the match result.
    // Track whether any value-producing arm contributed to result_type so an
    // all-diverging match can still be typed Never after every arm is checked.
    let mut has_non_never_arm = false
    let scrutinee_reaches_value = expr_has_reachable_value(scrut_r.hexpr)

    for arm in arms {
        ctx.env.push_scope()
        let arm_result = some({
            let match_pattern = rewrite_bare_enum_bindings(ctx.env, arm.pattern)
            let pattern_subst = s
            s = bind_pattern(
                ctx, match_pattern, hexpr_type(scrut_r.hexpr), pattern_subst)
            let pattern_bindings = exact_pattern_bindings(
                ctx.env, match_pattern)

            let mut guard_hexpr: HExpr? = none
            let mut guard_reaches_value = true
            match arm.guard {
                some(g) => {
                    let guard_subst = s
                    let gr = infer_expr(ctx, g, guard_subst)
                    s = gr.subst
                    guard_reaches_value = expr_has_reachable_value(gr.hexpr)
                    if guard_reaches_value {
                        s = unify_at(ctx.sink, ctx.env,
                            hexpr_type(gr.hexpr), BOOL, s, arm.span)
                    }
                    if scrutinee_reaches_value {
                        let me = merge_effects(ctx.sink, ctx.env,
                            effects, gr.effects, s, arm.span)
                        effects = me.0
                        s = me.1
                    }
                    guard_hexpr = some(gr.hexpr)
                },
                none => {}
            }

            let body_subst = s
            let body_is_unreachable = !scrutinee_reaches_value ||
                !guard_reaches_value
            // The child is still checked internally. Exact callable contracts
            // inside it remain diagnostics; only its result edge is neutral
            // when the scrutinee/guard proves that no value can escape.
            let body_r = infer_expr(ctx, arm.body, body_subst)
            s = body_r.subst
            if !body_is_unreachable {
                let me = merge_effects(ctx.sink, ctx.env,
                    effects, body_r.effects, s, arm.span)
                effects = me.0
                s = me.1
            }
            // Never arms must never bind result_type, including when the first
            // source arm diverges.  Binding the fresh result variable here
            // permanently poisons a later value-producing arm as Never and lets
            // ANF prune every following statement as unreachable.
            if !body_is_unreachable &&
               expr_has_reachable_value(body_r.hexpr) {
                let match_notes: List<DiagnosticNote> = [
                    DiagnosticNote { message: "match arms must all have the same type", span: some(arm.span) },
                    DiagnosticNote { message: "this arm has type '${type_to_string(apply_subst(s, hexpr_type(body_r.hexpr)))}'", span: some(hexpr_span(body_r.hexpr)) }
                ]
                s = unify_at_noted(ctx.sink, ctx.env, hexpr_type(body_r.hexpr), result_type, s, arm.span, match_notes)
                has_non_never_arm = true
            }

            harms.push(HMatchArm { pattern: match_pattern,
                bindings: pattern_bindings, guard: guard_hexpr,
                body: body_r.hexpr, span: arm.span })
            true
        }) catch { _ => none }
        ctx.env.pop_scope()
        match arm_result {
            none => fail.raise(CompileError {}),
            _ => {}
        }
    }

    let scrut_type_resolved = apply_subst(s, hexpr_type(scrut_r.hexpr))
    let missing = check_exhaustive(ctx.env, harms, scrut_type_resolved, s)
    match missing {
        some(m) => {
            let msg = if m == "_" {
                "Non-exhaustive match: non-finite type '${type_to_string(scrut_type_resolved)}' requires a wildcard '_' or binding pattern"
            } else {
                "Non-exhaustive match on type ${type_to_string(scrut_type_resolved)}: missing pattern for ${m}"
            }
            let _ = type_error(ctx.sink, E0601,
                msg,
                span, DiagnosticContext::PatternError { detail: "missing: ${m}" })
        },
        none => {}
    }

    let final_type = if has_non_never_arm {
        apply_subst(s, result_type)
    } else {
        NEVER
    }
    let match_effects = effects
    InferResult {
        hexpr: HExpr::MatchExpr { scrutinee: scrut_r.hexpr, arms: harms, ty: final_type, effects: match_effects, span: span },
        subst: s, effects: effects
    }
}

// ============================================================
// infer_if
// ============================================================

fn infer_if(mut ctx: InferCtx, condition: Expr, then_branch: Expr, else_branch: Expr?, span: Span, subst: UnionFind) -> InferResult {
    let initial_subst = subst
    let cond_r = infer_expr(ctx, condition, initial_subst)
    let mut s = cond_r.subst
    let mut effects = cond_r.effects
    let condition_reaches_value = expr_has_reachable_value(cond_r.hexpr)
    if condition_reaches_value {
        s = unify_at(ctx.sink, ctx.env,
            hexpr_type(cond_r.hexpr), BOOL, s, span)
    }

    let then_r = infer_block(ctx, then_branch, some(s))
    s = then_r.subst
    if condition_reaches_value {
        let me = merge_effects(
            ctx.sink, ctx.env, effects, then_r.effects, s, span)
        effects = me.0
        s = me.1
    }

    let mut else_hexpr: HExpr? = none
    let mut result_type: Type = if condition_reaches_value { UNIT } else { NEVER }

    match else_branch {
        some(eb) => match eb {
            Expr::Block { .. } => {
                let else_r = infer_block(ctx, eb, some(s))
                s = else_r.subst
                if condition_reaches_value {
                    let me2 = merge_effects(
                        ctx.sink, ctx.env, effects, else_r.effects, s, span)
                    effects = me2.0
                    s = me2.1
                    let then_type = apply_subst(
                        s, hexpr_type(then_r.hexpr))
                    let else_type = apply_subst(
                        s, hexpr_type(else_r.hexpr))
                    let then_reaches_value =
                        expr_has_reachable_value(then_r.hexpr)
                    let else_reaches_value =
                        expr_has_reachable_value(else_r.hexpr)
                    if !then_reaches_value && else_reaches_value {
                        result_type = else_type
                    } else if then_reaches_value && !else_reaches_value {
                        result_type = then_type
                    } else if then_reaches_value && else_reaches_value {
                        let if_notes: List<DiagnosticNote> = [
                            DiagnosticNote { message: "then branch has type '${type_to_string(then_type)}'", span: some(hexpr_span(then_r.hexpr)) },
                            DiagnosticNote { message: "else branch has type '${type_to_string(else_type)}'", span: some(hexpr_span(else_r.hexpr)) }
                        ]
                        s = unify_at_noted(ctx.sink, ctx.env,
                            hexpr_type(then_r.hexpr),
                            hexpr_type(else_r.hexpr), s, span, if_notes)
                        result_type = apply_subst(
                            s, hexpr_type(then_r.hexpr))
                    } else {
                        result_type = NEVER
                    }
                }
                else_hexpr = some(else_r.hexpr)
            },
            Expr::IfExpr { condition: ec, then_branch: etb, else_branch: eeb, span: espan } => {
                let else_if_span = espan
                let else_block_span = espan
                let else_if_r = infer_if(ctx, ec, etb, eeb, else_if_span, s)
                s = else_if_r.subst
                if condition_reaches_value {
                    let me2 = merge_effects(ctx.sink, ctx.env,
                        effects, else_if_r.effects, s, span)
                    effects = me2.0
                    s = me2.1
                    let then_type = apply_subst(
                        s, hexpr_type(then_r.hexpr))
                    let else_type = apply_subst(
                        s, hexpr_type(else_if_r.hexpr))
                    let then_reaches_value =
                        expr_has_reachable_value(then_r.hexpr)
                    let else_reaches_value =
                        expr_has_reachable_value(else_if_r.hexpr)
                    if !then_reaches_value && else_reaches_value {
                        result_type = else_type
                    } else if then_reaches_value && !else_reaches_value {
                        result_type = then_type
                    } else if then_reaches_value && else_reaches_value {
                        let elif_notes: List<DiagnosticNote> = [
                            DiagnosticNote { message: "then branch has type '${type_to_string(then_type)}'", span: some(hexpr_span(then_r.hexpr)) },
                            DiagnosticNote { message: "else branch has type '${type_to_string(else_type)}'", span: some(hexpr_span(else_if_r.hexpr)) }
                        ]
                        s = unify_at_noted(ctx.sink, ctx.env,
                            hexpr_type(then_r.hexpr),
                            hexpr_type(else_if_r.hexpr), s, span,
                            elif_notes)
                        result_type = apply_subst(
                            s, hexpr_type(then_r.hexpr))
                    } else {
                        result_type = NEVER
                    }
                }
                else_hexpr = some(HExpr::Block {
                    stmts: [], tail: some(else_if_r.hexpr),
                    ty: hexpr_type(else_if_r.hexpr), effects: else_if_r.effects,
                    span: else_block_span
                })
            },
            _ => { panic("unreachable: unexpected else branch form in infer_if") }
        },
        none => {}
    }

    let if_effects = effects
    InferResult {
        hexpr: HExpr::IfExpr {
            condition: cond_r.hexpr, then_branch: then_r.hexpr, else_branch: else_hexpr,
            ty: result_type, effects: if_effects, span: span
        },
        subst: s, effects: effects
    }
}

// ============================================================
// infer_string_interp
// ============================================================

fn is_interpolatable_type(t: Type) -> Bool {
    match t {
        Type::IntType => true,
        Type::FloatType => true,
        Type::StrType => true,
        Type::BoolType => true,
        // TypeVar means the type is not yet resolved — allow it (may resolve later)
        Type::TypeVar { .. } => true,
        // ErrorType — already has an error, don't cascade
        Type::ErrorType => true,
        _ => false,
    }
}

fn infer_string_interp(mut ctx: InferCtx, parts: List<StringInterpPart>, span: Span, subst: UnionFind) -> InferResult {
    let mut s = subst
    let mut effects: EffectRow = EMPTY_ROW
    let mut hparts: List<HStringInterpPart> = []

    for part in parts {
        match part {
            StringInterpPart::LitPart(str_val) => {
                let literal_value = str_val
                hparts.push(HStringInterpPart::Literal(literal_value))
            },
            StringInterpPart::ExprPart(expr) => {
                let r = infer_expr(ctx, expr, s)
                s = r.subst
                let me = merge_effects(ctx.sink, ctx.env, effects, r.effects, s, span)
                effects = me.0
                s = me.1
                // #184: check that interpolated expression type is Str/Int/Float/Bool
                let resolved = apply_subst(s, hexpr_type(r.hexpr))
                if is_interpolatable_type(resolved) == false {
                    let _ = type_error(ctx.sink, E0309,
                        "string interpolation requires Str, Int, Float, or Bool, got ${type_to_string(resolved)}",
                        hexpr_span(r.hexpr),
                        DiagnosticContext::TypeMismatch {
                            expected: "Str | Int | Float | Bool",
                            actual: type_to_string(resolved),
                            expression: none
                        })
                }
                hparts.push(HStringInterpPart::Expression(r.hexpr))
            }
        }
    }

    let interpolation_effects = effects
    InferResult {
        hexpr: HExpr::StringInterp { parts: hparts, ty: STR, effects: interpolation_effects, span: span },
        subst: s, effects: effects
    }
}

// ============================================================
// infer_catch
// ============================================================

fn infer_catch(mut ctx: InferCtx, expr: Expr, arms: List<MatchArm>, span: Span, subst: UnionFind) -> InferResult {
    let initial_subst = subst
    let expr_r = infer_expr(ctx, expr, initial_subst)
    let mut s = expr_r.subst
    let mut effects = expr_r.effects

    // Extract error type from the body's fail effects, unifying if multiple
    let mut error_type: Type = ctx.env.fresh_var()
    let mut found_fail = false
    for eff in effects.effects {
        match eff {
            Effect::FailEffect { error_type: et } => {
                if found_fail {
                    s = unify_at(ctx.sink, ctx.env, error_type, et, s, span)
                } else {
                    error_type = et
                    found_fail = true
                }
            },
            _ => {}
        }
    }

    // Warn only when the body's effect row is closed (no open tail) and has no fail effect.
    // An open tail means the body may have fail effects from polymorphic call sites.
    let resolved_row = apply_subst_row(s, effects)
    let has_open_tail = match resolved_row.tail {
        some(_) => true,
        none => false
    }
    if found_fail == false && has_open_tail == false {
        let warn = make_diag(W0001, Severity::SevWarning,
            "catch on expression with no fail effect; handler will never execute",
            span,
            DiagnosticContext::OtherContext { detail: some("body has no fail effect") })
        ctx.sink.report(warn)
    }

    let result_type = ctx.env.fresh_var()
    let mut has_non_never_result = false
    if expr_has_reachable_value(expr_r.hexpr) {
        s = unify_at(ctx.sink, ctx.env,
            hexpr_type(expr_r.hexpr), result_type, s, span)
        has_non_never_result = true
    }
    let mut harms: List<HMatchArm> = []

    for arm in arms {
        ctx.env.push_scope()
        let arm_result = some({
            let catch_pattern = rewrite_bare_enum_bindings(ctx.env, arm.pattern)
            let pattern_subst = s
            s = bind_pattern(ctx, catch_pattern, error_type, pattern_subst)
            let pattern_bindings = exact_pattern_bindings(
                ctx.env, catch_pattern)

            let mut guard_hexpr: HExpr? = none
            let mut guard_reaches_value = true
            match arm.guard {
                some(g) => {
                    let guard_subst = s
                    let gr = infer_expr(ctx, g, guard_subst)
                    s = gr.subst
                    guard_reaches_value =
                        expr_has_reachable_value(gr.hexpr)
                    if guard_reaches_value {
                        s = unify_at(ctx.sink, ctx.env,
                            hexpr_type(gr.hexpr), BOOL, s, arm.span)
                    }
                    let me = merge_effects(ctx.sink, ctx.env, effects, gr.effects, s, arm.span)
                    effects = me.0
                    s = me.1
                    guard_hexpr = some(gr.hexpr)
                },
                none => {}
            }

            let body_subst = s
            // Keep the dependent child fully typechecked, but a diverging
            // guard has no edge that can contribute its effects or result to
            // the enclosing Catch expression.
            let body_r = infer_expr(ctx, arm.body, body_subst)
            s = body_r.subst
            if guard_reaches_value {
                let me = merge_effects(ctx.sink, ctx.env,
                    effects, body_r.effects, s, arm.span)
                effects = me.0
                s = me.1
                if expr_has_reachable_value(body_r.hexpr) {
                    s = unify_at(ctx.sink, ctx.env,
                        hexpr_type(body_r.hexpr), result_type, s, arm.span)
                    has_non_never_result = true
                }
            }

            harms.push(HMatchArm { pattern: catch_pattern,
                bindings: pattern_bindings, guard: guard_hexpr,
                body: body_r.hexpr, span: arm.span })
            true
        }) catch { _ => none }
        ctx.env.pop_scope()
        match arm_result {
            none => fail.raise(CompileError {}),
            _ => {}
        }
    }

    // Check exhaustiveness of catch arms against the error type
    let error_type_resolved = apply_subst(s, error_type)
    let missing = check_exhaustive(ctx.env, harms, error_type_resolved, s)
    match missing {
        some(m) => {
            let msg = if m == "_" {
                "Non-exhaustive catch: non-finite error type '${type_to_string(error_type_resolved)}' requires a wildcard '_' or binding pattern"
            } else {
                "Non-exhaustive catch on error type ${type_to_string(error_type_resolved)}: missing pattern for ${m}"
            }
            let _ = type_error(ctx.sink, E0601,
                msg,
                span, DiagnosticContext::PatternError { detail: "missing: ${m}" })
        },
        none => {}
    }

    // catch always fully consumes the fail effect
    effects = remove_fail_effect(effects)

    let final_type = if has_non_never_result {
        apply_subst(s, result_type)
    } else {
        NEVER
    }
    let catch_effects = effects
    InferResult {
        hexpr: HExpr::TryCatch { body: expr_r.hexpr, arms: harms, ty: final_type, effects: catch_effects, span: span },
        subst: s, effects: effects
    }
}

// ============================================================
// infer_handle
// ============================================================

fn infer_handle(mut ctx: InferCtx, body: Expr, handlers: List<EffectHandler>, span: Span, subst: UnionFind) -> InferResult {
    let initial_subst = subst
    let body_r = infer_expr(ctx, body, initial_subst)
    let mut s = body_r.subst
    let mut effects = body_r.effects
    // #251: an abort arm is an alternate exit from the handled body, so its
    // value participates in the handle result. Keep the concrete body type as
    // the initial join candidate so a Never abort arm cannot bind an otherwise
    // unconstrained body TypeVar to Never (the #180 bottom-poisoning class).
    let mut result_type = hexpr_type(body_r.hexpr)

    // #251: populated lazily only for an abort handler so ordinary
    // tail-resumptive handles retain their existing (#258) checker behavior.
    let mut body_fail_error_type: Type? = none
    let mut body_fail_types_extracted = false

    let mut hhandlers: List<HEffectHandler> = []
    let mut handled_effects: Set<Str> = set_new()
    // Tail-resumptive arm closures capture the OUTER evidence for
    // their handled effect, while abort arms run after the current handler has
    // been deactivated. Both kinds of arm effects therefore escape unchanged
    // and must be merged only AFTER the handled body row has had this handle's
    // effects removed. Keep the rows separate so #251's abort-result contract
    // remains visibly isolated from the tail-resumptive result contract below.
    let mut tail_arm_effect_rows: List<EffectRow> = []
    let mut abort_arm_effect_rows: List<EffectRow> = []
    // One runtime evidence value backs every operation arm for a canonical
    // effect in this handle. Share its type arguments even when the body is
    // pure or contains only an unknown open tail.
    let mut handler_inst_type_args_by_effect: Map<Str, List<Type>> = map_new()

    for handler in handlers {
        ctx.env.push_scope()
        // Tail-resumptive arms are lowered to closures; #251 abort arms execute
        // inline after the current handler is inactive. Infer both at one deeper
        // lambda depth so mutable outer captures use the same shared cell in
        // either lowering. Save/restore the exact enclosing depth, and keep all
        // fallible arm setup inside the bracket, so nested handlers and failed
        // inference cannot leak scope state.
        let enclosing_lambda_depth = ctx.lambda_depth
        ctx.lambda_depth = enclosing_lambda_depth + 1
        let handler_result = some({
            let effect_def = ctx.env.types.effects.get(handler.effect_name)
            let canonical_effect_name = match effect_def {
                some(ed) => ed.name,
                none => handler.effect_name
            }
            let canonical_effect_name_for_display = canonical_effect_name
            let canonical_effect_name_for_hir = canonical_effect_name
            let canonical_effect_name_for_set = canonical_effect_name
            let is_abort_handler = match effect_def {
                some(ed) => match ed.built_in_kind {
                    some(BuiltInKind::BkFail) => handler.op_name == "raise",
                    _ => false
                },
                none => false
            }

            // fail.raise receives the error payload raised by the handled body.
            // Extract concrete fail label(s) exactly as infer_catch does and
            // unify duplicates. Apply the current substitution first because
            // an earlier HOF call may already have expanded the body's row tail.
            if is_abort_handler && !body_fail_types_extracted {
                let resolved_body_effects = apply_subst_row(s, effects)
                for eff in resolved_body_effects.effects {
                    match eff {
                        Effect::FailEffect { error_type: et } => {
                            match body_fail_error_type {
                                some(existing) => {
                                    s = unify_at(ctx.sink, ctx.env, existing, et, s, span)
                                },
                                none => {
                                    let body_fail_type = et
                                    body_fail_error_type = some(body_fail_type)
                                }
                            }
                        },
                        _ => {}
                    }
                }
                body_fail_types_extracted = true
            }

            // Instantiate effect type params once per canonical effect for this
            // handle. Every operation arm rebuilds its declaration-variable map
            // from the shared instance.
            let mut handler_inst_map: Map<Int, Type> = map_new()
            let mut handler_inst_type_args: List<Type> = []
            match effect_def {
                some(ed) => {
                    match handler_inst_type_args_by_effect.get(canonical_effect_name) {
                        some(shared_type_args) => {
                            handler_inst_type_args = shared_type_args
                        },
                        none => {
                            for _tpv in ed.type_param_vars {
                                handler_inst_type_args.push(ctx.env.fresh_var())
                            }
                            let effect_instance_name = canonical_effect_name
                            let shared_instance_type_args =
                                handler_inst_type_args
                            handler_inst_type_args_by_effect.insert(
                                effect_instance_name,
                                shared_instance_type_args
                            )
                        }
                    }
                    let mut shared_type_arg_index = 0
                    for tpv in ed.type_param_vars {
                        match handler_inst_type_args.get(shared_type_arg_index) {
                            some(shared_type_arg) => {
                                let handler_type_param = tpv
                                let handler_shared_type_arg = shared_type_arg
                                handler_inst_map.insert(
                                    handler_type_param, handler_shared_type_arg)
                            },
                            none => {}
                        }
                        shared_type_arg_index = shared_type_arg_index + 1
                    }
                },
                none => {}
            }

            // The operation signature used by the arm must be the instance
            // performed by the handled body, not an unrelated fresh instance.
            // Body-row merging already unifies repeated labels of the same
            // canonical custom effect; connect every matching concrete label
            // to this arm's instantiation before binding its params/result.
            match effect_def {
                some(ed) => {
                    let resolved_body_effects_for_handler = apply_subst_row(s, effects)
                    for body_effect in resolved_body_effects_for_handler.effects {
                        match body_effect {
                            Effect::CustomEffect { name, type_args } => {
                                if name == canonical_effect_name {
                                    let mut type_arg_index = 0
                                    for handler_type_arg in handler_inst_type_args {
                                        match type_args.get(type_arg_index) {
                                            some(body_type_arg) => {
                                                s = unify_at(
                                                    ctx.sink, ctx.env,
                                                    handler_type_arg, body_type_arg,
                                                    s, handler.span
                                                )
                                            },
                                            none => {}
                                        }
                                        type_arg_index = type_arg_index + 1
                                    }
                                }
                            },
                            _ => {}
                        }
                    }
                },
                none => {}
            }

            let mut op_def: EffectOpDef? = none
            match effect_def {
                some(ed) => { op_def = ed.ops.find(fn(o) { o.name == handler.op_name }) },
                none => {}
            }

            // The instantiated fail.raise parameter is the single payload
            // contract shared by the handled body's concrete fail<E> row, the
            // source annotation (if any), and the arm-local binding.
            let mut abort_payload_type: Type? = none
            if is_abort_handler {
                match op_def {
                    some(od) => {
                        match od.params.first() {
                            some(odt) => {
                                let payload_type = apply_subst_map(handler_inst_map, odt)
                                match body_fail_error_type {
                                    some(body_error_type) => {
                                        s = unify_at(ctx.sink, ctx.env, payload_type, body_error_type, s, handler.span)
                                    },
                                    none => {}
                                }
                                abort_payload_type = some(payload_type)
                            },
                            none => {}
                        }
                    },
                    none => {}
                }
            }

            let abort_payload_type_for_tail = abort_payload_type
            let abort_payload_type_for_param = abort_payload_type
            if is_abort_handler {
                // An abort handler proves that every open contribution to the
                // body row contains the same fail<payload> contract. Split any
                // open tail into that handled fail label plus a fresh residual,
                // even when the body also has an explicit fail label: otherwise
                // a callback tail could later instantiate to fail<Other>.
                //
                // Effect rows currently have no lacks/optional-label constraint,
                // so this is intentionally an exact (and conservative) callback
                // effect requirement. The residual remains polymorphic and is
                // propagated after fail is filtered from this handle.
                let resolved_body_effects = apply_subst_row(s, effects)
                match (abort_payload_type_for_tail, resolved_body_effects.tail) {
                    (some(payload_type), some(body_tail)) => {
                        let residual_tail = ctx.env.fresh_var_id()
                        let fail_payload_type = payload_type
                        let body_fail_payload_type = payload_type
                        let required_tail = Type::EffectRowType {
                            effects: [Effect::FailEffect {
                                error_type: fail_payload_type
                            }],
                            tail: some(residual_tail)
                        }
                        s = unify_at(
                            ctx.sink, ctx.env,
                            Type::TypeVar { id: body_tail, name: none },
                            required_tail, s, handler.span
                        )
                        body_fail_error_type = some(body_fail_payload_type)
                    },
                    _ => {}
                }
            }

            let mut hparams: List<HParam> = []
            let mut hi = 0
            for p in handler.params {
                let mut pt = match p.type_annotation {
                    some(ta) => resolve_type_expr(ctx, ta),
                    none => match op_def {
                        some(od) => match od.params.get(hi) {
                            some(odt) => apply_subst_map(handler_inst_map, odt),
                            none => ctx.env.fresh_var()
                        },
                        none => ctx.env.fresh_var()
                    }
                }
                if is_abort_handler && hi == 0 {
                    match abort_payload_type_for_param {
                        some(payload_type) => {
                            let mut payload_notes: List<DiagnosticNote> = [
                                DiagnosticNote {
                                    message: "abort handler payload type must match handled fail error type",
                                    span: some(handler.span)
                                },
                                DiagnosticNote {
                                    message: "handler payload parameter has type '${type_to_string(apply_subst(s, pt))}'",
                                    span: some(p.span)
                                }
                            ]
                            match body_fail_error_type {
                                some(body_error_type) => {
                                    payload_notes.push(DiagnosticNote {
                                        message: "handled body raises '${type_to_string(apply_subst(s, body_error_type))}'",
                                        span: some(hexpr_span(body_r.hexpr))
                                    })
                                },
                                none => {}
                            }
                            s = unify_at_noted(ctx.sink, ctx.env, pt, payload_type, s, p.span, payload_notes)
                            pt = apply_subst(s, payload_type)
                        },
                        none => {}
                    }
                }
                let handler_param_type = pt
                ctx.env.bind_mono(p.name, handler_param_type)
                let param_scheme = match ctx.env.lookup(p.name) {
                    some(value) => value,
                    none => panic(
                        "unreachable: handler parameter binding is missing")
                }
                let param_def_id = match param_scheme.def_id {
                    some(id) => id,
                    none => panic(
                        "unreachable: handler parameter has no exact DefId")
                }
                let param_span_def_id = param_def_id
                let hparam_def_id = param_def_id
                ctx.env.record_def_span(param_span_def_id, p.span)
                hparams.push(HParam {
                    name: p.name, ty: pt, def_id: some(hparam_def_id),
                    flags: hparam_flags(false, PARAM_OWNERSHIP_BORROW)
                })
                hi = hi + 1
            }

            let mut resume_binding: HPatternBinding? = none
            match handler.resume_name {
                some(rn) => {
                    let resume_param = match op_def {
                        some(od) => apply_subst_map(handler_inst_map, od.return_type),
                        none => ctx.env.fresh_var()
                    }
                    let resume_ret = ctx.env.fresh_var()
                    let resume_type = Type::FnType {
                        params: [resume_param], return_type: resume_ret,
                        meta: fn_meta(EMPTY_ROW, CALLABLE_BORROW_OWNED)
                    }
                    let resume_binding_name = rn
                    let resume_binding_type = resume_type
                    ctx.env.bind_mono(resume_binding_name, resume_binding_type)
                    let resume_scheme = match ctx.env.lookup(rn) {
                        some(value) => value,
                        none => panic(
                            "unreachable: handler resume binding is missing")
                    }
                    let resume_def_id = match resume_scheme.def_id {
                        some(id) => id,
                        none => panic(
                            "unreachable: handler resume binding has no exact DefId")
                    }
                    let resume_span_def_id = resume_def_id
                    let resume_hir_def_id = resume_def_id
                    let resume_hir_name = rn
                    ctx.env.record_def_span(resume_span_def_id, handler.span)
                    resume_binding = some(HPatternBinding {
                        name: resume_hir_name, def_id: resume_hir_def_id,
                        ty: resume_type
                    })
                },
                none => {}
            }

            let handler_body_subst = s
            let hbr = infer_expr(ctx, handler.body, handler_body_subst)
            s = hbr.subst
            if is_abort_handler {
                abort_arm_effect_rows.push(hbr.effects)

                // #251/#180: Never is bottom, but unify binds TypeVars before
                // applying the Never shortcut. Join explicitly so an abort arm
                // that re-raises does not poison a polymorphic normal result,
                // while a Never body can still recover to the arm's value type.
                let resolved_result = apply_subst(s, result_type)
                let resolved_arm = apply_subst(s, hexpr_type(hbr.hexpr))
                let result_is_never = match resolved_result { Type::NeverType => true, _ => false }
                let arm_is_never = match resolved_arm { Type::NeverType => true, _ => false }
                if result_is_never && !arm_is_never {
                    result_type = hexpr_type(hbr.hexpr)
                } else {
                    if !result_is_never && !arm_is_never {
                        let handle_notes: List<DiagnosticNote> = [
                            DiagnosticNote { message: "abort handler arm and handled body must produce the same type", span: some(handler.span) },
                            DiagnosticNote { message: "handled body has type '${type_to_string(resolved_result)}'", span: some(hexpr_span(body_r.hexpr)) },
                            DiagnosticNote { message: "abort arm has type '${type_to_string(resolved_arm)}'", span: some(hexpr_span(hbr.hexpr)) }
                        ]
                        s = unify_at_noted(ctx.sink, ctx.env, hexpr_type(hbr.hexpr), result_type, s, handler.span, handle_notes)
                    }
                }
            } else {
                tail_arm_effect_rows.push(hbr.effects)

                // A tail-resumptive arm is the implementation of this effect
                // operation: its body value is returned directly as the resume
                // value. Resolve bottom before ordinary unification so a Never
                // arm cannot bind a still-fresh shared operation type variable.
                // Either concrete-vs-Never direction remains valid.
                match op_def {
                    some(od) => {
                        let op_return_type = apply_subst_map(handler_inst_map, od.return_type)
                        let resolved_op_return = apply_subst(s, op_return_type)
                        let resolved_arm = apply_subst(s, hexpr_type(hbr.hexpr))
                        let op_return_is_never = match resolved_op_return {
                            Type::NeverType => true,
                            _ => false
                        }
                        let arm_is_never = match resolved_arm {
                            Type::NeverType => true,
                            _ => false
                        }
                        // #265: a Unit-returning operation's resume value
                        // carries no information. The arm result is discarded
                        // exactly like a statement-position value, so it
                        // imposes no contract on the arm's type.
                        let op_return_is_unit = match resolved_op_return {
                            Type::UnitType => true,
                            _ => false
                        }
                        let effect_display = nominal_display_name(
                            canonical_effect_name_for_display)
                        let tail_arm_notes: List<DiagnosticNote> = [
                            DiagnosticNote {
                                message: "tail-resumptive handler arm result must match effect operation return type",
                                span: some(handler.span)
                            },
                            DiagnosticNote {
                                message: "effect operation '${effect_display}.${handler.op_name}' returns '${type_to_string(resolved_op_return)}'",
                                span: some(handler.span)
                            },
                            DiagnosticNote {
                                message: "handler arm has type '${type_to_string(resolved_arm)}'",
                                span: some(hexpr_span(hbr.hexpr))
                            }
                        ]
                        if !op_return_is_never && !arm_is_never && !op_return_is_unit {
                            s = unify_at_noted(
                                ctx.sink, ctx.env,
                                hexpr_type(hbr.hexpr), op_return_type,
                                s, handler.span, tail_arm_notes
                            )
                        }
                    },
                    none => {}
                }
            }
            hhandlers.push(HEffectHandler {
                effect_name: canonical_effect_name_for_hir,
                op_name: handler.op_name,
                is_abortive: is_abort_handler,
                params: hparams, resume_binding: resume_binding,
                body: hbr.hexpr
            })
            handled_effects.insert(canonical_effect_name_for_set)
            true
        }) catch { _ => none }
        ctx.lambda_depth = enclosing_lambda_depth
        ctx.env.pop_scope()

        match handler_result {
            some(_) => {},
            none => fail.raise(CompileError {})
        }
    }

    let resolved_effects = apply_subst_row(s, effects)
    let mut filtered_effects: List<Effect> = []
    for e in resolved_effects.effects {
        let should_keep = match e {
            Effect::IoEffect => !handled_effects.contains("io"),
            Effect::CustomEffect { name, .. } => !handled_effects.contains(name),
            Effect::FailEffect { .. } => !handled_effects.contains("fail"),
            Effect::MutEffect { .. } => !handled_effects.contains("mut"),
            // UnsafeEffect cannot be handled — only discharged by unsafe {}
            Effect::UnsafeEffect => true
        }
        if should_keep {
            let filtered_effect = e
            filtered_effects.push(filtered_effect)
        }
    }
    effects = EffectRow { effects: filtered_effects, tail: resolved_effects.tail }

    // #258: merge explicit tail-arm rows only after filtering the handled
    // body's row. In particular, do not re-filter a same-effect re-perform:
    // explicit arms capture outer evidence, so that operation propagates.
    for arm_effects in tail_arm_effect_rows {
        let me = merge_effects(ctx.sink, ctx.env, effects, arm_effects, s, span)
        effects = me.0
        s = me.1
    }

    // #251: the abort arm executes outside the current handler. Merge its row
    // verbatim after filtering the body row so io/custom effects and a re-raised
    // fail escape to the enclosing signature/handler instead of being swallowed.
    for arm_effects in abort_arm_effect_rows {
        let me = merge_effects(ctx.sink, ctx.env, effects, arm_effects, s, span)
        effects = me.0
        s = me.1
    }
    effects = apply_subst_row(s, effects)

    let handle_effects = effects
    InferResult {
        hexpr: HExpr::HandleExpr {
            body: body_r.hexpr, handlers: hhandlers,
            ty: apply_subst(s, result_type), effects: handle_effects, span: span
        },
        subst: s, effects: effects
    }
}

// ============================================================
// infer_lambda
// ============================================================

fn infer_lambda(mut ctx: InferCtx, params: List<Param>, body: Expr, span: Span, subst: UnionFind, expected_param_types: List<Type>?) -> InferResult {
    let lambda_def_id = ctx.env.fresh_def_id()
    ctx.env.push_scope()
    ctx.lambda_depth = ctx.lambda_depth + 1
    let mut s = subst
    let mut hparams: List<HParam> = []
    let mut param_types: List<Type> = []
    let lambda_ownership = fresh_callable_ownership_inference_term(
        ctx.env.types.ownership_metadata)
    record_callable_ownership(ctx.env.types.ownership_metadata,
        lambda_def_id, lambda_ownership, CALLABLE_SOURCE_BODY_INFERRED)

    let mut pi = 0
    for p in params {
        let pt = match p.type_annotation {
            some(ta) => resolve_type_expr(ctx, ta),
            none => ctx.env.fresh_var()
        }
        match expected_param_types {
            some(epts) => {
                if p.type_annotation.is_none() {
                    match epts.get(pi) {
                        some(expected_t) => { s = unify_at(ctx.sink, ctx.env, pt, expected_t, s, span) },
                        none => {}
                    }
                }
            },
            none => {}
        }
        ctx.env.bind_mono(p.name, pt)
        let lam_scheme = ctx.env.lookup(p.name)
        match lam_scheme {
            some(ls) => {
                match ls.def_id {
                    some(did) => {
                        let param_span_def_id = did
                        let lambda_param_def_id = did
                        let mutable_var_def_id = did
                        let mutable_param_def_id = did
                        let let_param_def_id = did
                        ctx.env.record_def_span(param_span_def_id, p.span)
                        ctx.var_lambda_depth.insert(
                            lambda_param_def_id, ctx.lambda_depth)
                        if p.is_mutable {
                            ctx.env.scope.mutable_vars.insert(mutable_var_def_id)
                            ctx.env.scope.mut_param_defs.insert(
                                mutable_param_def_id)
                        } else {
                            ctx.env.scope.let_defs.insert(let_param_def_id)
                        }
                    },
                    none => {}
                }
                let ownership_mode = if p.is_move {
                    PARAM_OWNERSHIP_MOVE
                } else if p.is_mutable {
                    PARAM_OWNERSHIP_MUT_BORROW
                } else {
                    PARAM_OWNERSHIP_BORROW
                }
                let hparam_type = pt
                hparams.push(HParam {
                    name: p.name, ty: hparam_type, def_id: ls.def_id,
                    flags: hparam_flags_with_force(
                        p.is_mutable, ownership_mode, p.is_move)
                })
            },
            none => {
                let ownership_mode = if p.is_move {
                    PARAM_OWNERSHIP_MOVE
                } else if p.is_mutable {
                    PARAM_OWNERSHIP_MUT_BORROW
                } else {
                    PARAM_OWNERSHIP_BORROW
                }
                let hparam_type = pt
                hparams.push(HParam {
                    name: p.name, ty: hparam_type, def_id: none,
                    flags: hparam_flags_with_force(
                        p.is_mutable, ownership_mode, p.is_move)
                })
            }
        }
        param_types.push(pt)
        pi = pi + 1
    }

    let body_subst = s
    let body_result = some(infer_lambda_body_firebreak(
        ctx, body, body_subst)) catch { _ => none }
    ctx.lambda_depth = ctx.lambda_depth - 1
    ctx.env.pop_scope()

    match body_result {
        some(body_r) => {
            s = body_r.subst
            let mut applied_params: List<Type> = []
            for pt in param_types { applied_params.push(apply_subst(s, pt)) }
            let applied_ret = apply_subst(s, hexpr_type(body_r.hexpr))

            let fn_return_type = applied_ret
            let fn_type = Type::FnType {
                params: applied_params, return_type: fn_return_type,
                meta: fn_meta(body_r.effects, lambda_ownership)
            }

            let mut final_hparams: List<HParam> = []
            for hp in hparams {
                final_hparams.push(HParam {
                    name: hp.name, ty: apply_subst(s, hp.ty),
                    def_id: hp.def_id, flags: hp.flags
                })
            }

            InferResult {
                hexpr: HExpr::Lambda {
                    def_id: lambda_def_id,
                    params: final_hparams, return_type: applied_ret,
                    body: body_r.hexpr, ty: fn_type, effects: EMPTY_ROW, span: span
                },
                subst: s, effects: EMPTY_ROW
            }
        },
        none => fail.raise(CompileError {})
    }
}

// The catch boundary may only borrow lambda inputs. Materialize the exact
// whole body and substitution in a named parameter scope before inference.
fn infer_lambda_body_firebreak(
    mut ctx: InferCtx, body: Expr, body_subst: UnionFind
) -> InferResult {
    let inferred_body = body
    let inferred_body_subst = body_subst
    infer_expr(ctx, inferred_body, inferred_body_subst)
}

// ============================================================
// infer_list_literal
// ============================================================

fn infer_list_literal(mut ctx: InferCtx, elements: List<Expr>, span: Span, subst: UnionFind) -> InferResult {
    if elements.len() == 0 {
        let elem_type = ctx.env.fresh_var()
        let list_type = Type::StructType { name: BUILTIN_LIST, type_params: [elem_type] }
        return InferResult {
            hexpr: HExpr::ListLit { elements: [], ty: list_type, effects: EMPTY_ROW, span: span },
            subst: subst, effects: EMPTY_ROW
        }
    }
    let mut s = subst
    let mut helements: List<HExpr> = []
    let mut elem_type: Type = ctx.env.fresh_var()
    let mut combined_effects: EffectRow = EMPTY_ROW
    for el in elements {
        let r = infer_expr(ctx, el, s)
        s = r.subst
        s = unify_at(ctx.sink, ctx.env, apply_subst(s, hexpr_type(r.hexpr)), apply_subst(s, elem_type), s, span)
        elem_type = apply_subst(s, elem_type)
        helements.push(r.hexpr)
        let me = merge_effects(ctx.sink, ctx.env, combined_effects, r.effects, s, span)
        combined_effects = me.0
        s = me.1
    }
    let list_type = Type::StructType { name: BUILTIN_LIST, type_params: [apply_subst(s, elem_type)] }
    let list_effects = combined_effects
    InferResult {
        hexpr: HExpr::ListLit { elements: helements, ty: list_type, effects: list_effects, span: span },
        subst: s, effects: combined_effects
    }
}
