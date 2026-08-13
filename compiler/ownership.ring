// Ownership truth pass (#268/#269).
//
// The pass has two deliberately ordered stages:
//   1. solve body-inferred callable modes to a finite fixed point and publish
//      canonical content-addressed descriptors;
//   2. run DefId-keyed control-flow ownership planning and materialise every
//      complete-binding transfer as HExpr::Take.
//
// No consumer is allowed to recover either fact from a source spelling.

use types::{Type, EffectRow, OwnershipMetadata, CallableTransferLevel,
    PARAM_OWNERSHIP_BORROW, PARAM_OWNERSHIP_MUT_BORROW,
    PARAM_OWNERSHIP_MOVE, PARAM_OWNERSHIP_UNKNOWN,
    CALLABLE_UNKNOWN, CALLABLE_BORROW_OWNED,
    RETURN_OWNERSHIP_OWNED, RETURN_OWNERSHIP_BORROWED,
    CALLABLE_SOURCE_BODY_INFERRED,
    CALLABLE_SOURCE_CONSERVATIVE_INTERFACE,
    CALLABLE_SOURCE_CALL_CONSTRAINT,
    CALLABLE_SOURCE_ERROR_RECOVERY,
    CALLABLE_RESULT_ROLE_NONE, CALLABLE_RESULT_ROLE_FRESH_OWNED_SLOT,
    CALLABLE_RESULT_ROLE_UNKNOWN,
    callable_param_ownership, callable_return_ownership,
    intern_callable_ownership_descriptor, intern_callable_param_modes,
    record_callable_ownership, record_callable_ownership_with_transfer_levels,
    callable_transfer_level, clone_callable_transfer_levels,
    callable_transfer_levels_for_def_id, join_callable_transfer_levels,
    callable_param_requires_force, callable_interface_transfer_levels,
    set_callable_transfer_levels,
    validate_callable_ownership_metadata,
    callable_ownership_constraint_compatible,
    constrain_callable_ownership_terms,
    is_callable_ownership_inference_term,
    is_resolved_callable_ownership_term,
    resolve_callable_ownership_term,
    require_exact_callable_ownership_term,
    freeze_callable_ownership_type, freeze_callable_ownership_row,
    freeze_callable_ownership_metadata,
    type_may_own, fn_meta, set_callable_result_role,
    set_returned_callable_result_role, set_callable_result_role_spine,
    callable_result_role_is_valid}
use ast::{Span, Pattern, span_zero}
use hir::{HProgram, HDecl, HParam, HExpr, HStmt, HMatchArm, ValueBindingKind,
    HStructFieldInit, HStringInterpPart, HEffectHandler, HTraitMethod,
    HEffectOp, HForInDestructure, HLetDestructureBinding,
    HPatternBinding, HFreeBinding, HStructField, HEnumVariant,
    HAssocType, HSigMember,
    DictRef,
    hparam_is_mutable, hparam_ownership, hparam_is_declared_force,
    hparam_is_external_drop_owner, hparam_replace_ownership,
    hexpr_type, hexpr_effects, hexpr_span, compare_by_first,
    is_nullary_variant_ctor_ident, is_option_none_ctor_ident,
    is_materialized_fn_value,
    move_edge_has_reachable_bare_binding, expr_has_reachable_value,
    hmatch_arm_body_is_reachable, stmt_reaches_next,
    collect_exact_free_bindings,
    variant_ctor_name}
use env::{TypeEnv, TypeScheme, TraitDef, TraitMethodDef, ImplEntry, SigDef,
    freeze_type_env_ownership, apply_subst_map, lookup_variant}
use infer_helpers::{is_value_type}
use zonk::{freeze_ownership_expr}
use diagnostics::{CollectingSink, DiagnosticContext, Severity, make_diag}
use codes::{E0801}

struct CallableSolveState {
    def_id: Int,
    param_def_ids: List<Int?>,
    modes: List<Int>,
    // Fixed caller-invalidation authority captured before body inference.
    // Body evidence may raise modes to Move but must never raise this vector.
    force_params: List<Bool>,
    body: HExpr,
    return_callable_contract: Int?,
    return_callable_arity: Int,
    span: Span,
    // A local callable slot may name more than one exact callable across
    // assignments/branches. Keep the finite may-alias set keyed by local DefId;
    // Move dominates when any possible target consumes that parameter.
    alias_targets: Map<Int, List<Int>>,
    // Callable-typed parameters and opaque callable producers transport an
    // already-declared descriptor through their exact local slot. This is not
    // a callee-expression fallback: calls still resolve this map by DefId.
    callable_contracts: Map<Int, Int>,
    callable_arities: Map<Int, Int>,
    callable_types: Map<Int, Type>
}

struct CallableSolveTable {
    states: Map<Int, CallableSolveState>,
    order: List<Int>,
    // Binding DefIds are globally unique, so callable-value contracts and
    // may-alias edges are global as well. This lets a nested lambda resolve a
    // captured callable slot without consulting an expression type.
    alias_targets: Map<Int, List<Int>>,
    // Alias edges only grow. Keep their exact count with the graph so every
    // call argument can choose a sound traversal fuel without rescanning the
    // whole Map in each solver round.
    alias_edge_count: Int,
    alias_spans: Map<Int, Span>,
    callable_contracts: Map<Int, Int>,
    callable_arities: Map<Int, Int>,
    callable_types: Map<Int, Type>,
    // A callable-valued Call owns a fresh result DefId.  For local callees the
    // result aliases every exact callable returned by the callee body; for an
    // imported callee its finalized Fn return type is the authoritative
    // contract.  Keeping this edge explicit prevents `make()()` from falling
    // back to the pre-solve Borrow annotation.
    call_result_callees: Map<Int, Int>,
    call_result_spans: Map<Int, Span>,
    return_targets: Map<Int, List<Int>>,
    opaque_callable_returns: Map<Int, Bool>,
    // Complete value origins for lexical slots. Ordinary let/var/const origins
    // are collected once from HIR; pattern slots are replaced from structural
    // payload extraction during solving. This is the provenance authority for
    // callable values nested inside tuples/records/variants.
    value_origins: Map<Int, List<HExpr>>,
    opaque_value_origins: Map<Int, Bool>,
    // Type-only contracts retained solely so the solver can recover after it
    // has identified an unprovable container/projection producer. They are
    // never published as authoritative DefId metadata.
    untrusted_callable_slots: Map<Int, Bool>,
    // Sticky proof poison for a source path that was structurally opaque.  A
    // later assignment carrying some DefId must not wash this fact away; only
    // the producer-specific exact pattern/return analysis may remove it.
    opaque_callable_slots: Map<Int, Bool>,
    // Structural census and semantic collection deliberately use different
    // maps. Every retained call must be metadata-total; only a semantically
    // reachable call is allowed to turn an opaque producer into a user error.
    retained_callee_spans: Map<Int, Span>,
    reachable_callee_spans: Map<Int, Span>,
    // A module-level callable const is a durable identity and can be exposed by
    // `pub use` even when its own declaration is private. It must never carry
    // deterministic recovery as if that were producer authority.
    durable_callable_spans: Map<Int, Span>,
    diagnosed_callable_slots: Map<Int, Bool>,
    // A const DefId is the zero-argument getter in codegen metadata. When an
    // HDecl::Const has a FnType its stored callable is the getter's return
    // target, never an alias of the getter identity itself.
    const_getter_def_ids: Set<Int>,
    const_callable_types: Map<Int, Type>
}

// Alias contracts form a finite lattice. `BackEdge` is DFS-only fixed-point
// bottom; `NoBase` means a reachable opaque/untrusted leaf and is fail-closed
// poison. Conflating them would let an exact branch wash an opaque sibling.
enum CallableContractResolution {
    Exact { term: Int },
    Conflict { recovery: Int },
    NoBase,
    BackEdge
}

enum CallableTransferResolution {
    Exact { levels: List<CallableTransferLevel> },
    NoBase,
    BackEdge
}

enum CallableResultRoleResolution {
    Exact { role: Int },
    Unknown,
    BackEdge
}

// Ownership has several consumers that walk control expressions for different
// purposes.  Reachability is nevertheless one semantic boundary: eager values
// are visited first, and a Never value produces no dependent body child.  Keep
// that boundary as a single ordered enumeration so the callable solver,
// callable-return collector, and Take planner cannot drift independently.
const REACHABLE_CHILD_IF_CONDITION: Int = 0
const REACHABLE_CHILD_IF_THEN: Int = 1
const REACHABLE_CHILD_IF_ELSE: Int = 2
const REACHABLE_CHILD_MATCH_SCRUTINEE: Int = 3
const REACHABLE_CHILD_ARM_GUARD: Int = 4
const REACHABLE_CHILD_ARM_BODY: Int = 5

struct ReachableControlChild {
    kind: Int,
    arm_index: Int
}

fn enumerate_reachable_if_children(
    condition: HExpr, has_else: Bool
) -> List<ReachableControlChild> {
    let mut children: List<ReachableControlChild> = [
        ReachableControlChild {
            kind: REACHABLE_CHILD_IF_CONDITION, arm_index: -1
        }
    ]
    if expr_has_reachable_value(condition) {
        children.push(ReachableControlChild {
            kind: REACHABLE_CHILD_IF_THEN, arm_index: -1
        })
        if has_else {
            children.push(ReachableControlChild {
                kind: REACHABLE_CHILD_IF_ELSE, arm_index: -1
            })
        }
    }
    children
}

fn enumerate_reachable_arm_children(
    arms: List<HMatchArm>
) -> List<ReachableControlChild> {
    let mut children: List<ReachableControlChild> = []
    let mut arm_index = 0
    for arm in arms {
        let body_is_reachable = hmatch_arm_body_is_reachable(arm)
        match arm.guard {
            some(_) => {
                children.push(ReachableControlChild {
                    kind: REACHABLE_CHILD_ARM_GUARD,
                    arm_index: arm_index
                })
                if body_is_reachable {
                    children.push(ReachableControlChild {
                        kind: REACHABLE_CHILD_ARM_BODY,
                        arm_index: arm_index
                    })
                }
            },
            none => children.push(ReachableControlChild {
                kind: REACHABLE_CHILD_ARM_BODY,
                arm_index: arm_index
            })
        }
        arm_index = arm_index + 1
    }
    children
}

fn enumerate_reachable_match_children(
    scrutinee: HExpr, arms: List<HMatchArm>
) -> List<ReachableControlChild> {
    let mut children: List<ReachableControlChild> = [
        ReachableControlChild {
            kind: REACHABLE_CHILD_MATCH_SCRUTINEE, arm_index: -1
        }
    ]
    if !expr_has_reachable_value(scrutinee) { return children }
    for arm_child in enumerate_reachable_arm_children(arms) {
        children.push(ReachableControlChild {
            kind: arm_child.kind,
            arm_index: arm_child.arm_index
        })
    }
    children
}

// These small phase-boundary copies mirror hir::{hexpr_type,
// hexpr_effects,hexpr_span}. Pattern-matched HIR fields and Map values are
// borrowed views; returning or storing them must materialize an owned value
// without changing the ownership authority carried by the value itself.
fn copy_ownership_type(value: Type) -> Type {
    let copied = value
    copied
}

fn copy_ownership_effects(value: EffectRow) -> EffectRow {
    let copied = value
    copied
}

fn copy_ownership_span(value: Span) -> Span {
    let copied = value
    copied
}

fn mark_value_origin_opaque(
    mut table: CallableSolveTable, expr: HExpr
) {
    match expr {
        HExpr::Ident { def_id: some(def_id), .. } => {
            let opaque_def_id = def_id
            table.opaque_value_origins.insert(opaque_def_id, true)
        },
        HExpr::Take { source_def_id: def_id, .. } => {
            let opaque_def_id = def_id
            table.opaque_value_origins.insert(opaque_def_id, true)
        },
        HExpr::FieldAccess { receiver, .. } =>
            mark_value_origin_opaque(table, receiver),
        HExpr::IndexExpr { receiver, .. } =>
            mark_value_origin_opaque(table, receiver),
        HExpr::Clone { inner, .. } =>
            mark_value_origin_opaque(table, inner),
        _ => {}
    }
}

fn register_call_result(
    mut table: CallableSolveTable, result: Int?, callee: Int?,
    ty: Type, span: Span
) {
    match (result, ty) {
        (some(result_id), Type::FnType { params, meta, .. }) => {
            let contract_result_id = result_id
            table.callable_contracts.insert(
                contract_result_id, meta.ownership_term)
            let arity_result_id = result_id
            table.callable_arities.insert(arity_result_id, params.len())
            let span_result_id = result_id
            table.call_result_spans.insert(span_result_id, span)
            match callee {
                some(callee_id) => {
                    let callee_result_id = result_id
                    let result_callee_id = callee_id
                    table.call_result_callees.insert(
                        callee_result_id, result_callee_id)
                },
                none => {
                    let untrusted_result_id = result_id
                    table.untrusted_callable_slots.insert(
                        untrusted_result_id, true)
                    let opaque_result_id = result_id
                    table.opaque_callable_slots.insert(
                        opaque_result_id, true)
                }
            }
        },
        _ => {}
    }
}

fn append_value_origin(
    mut table: CallableSolveTable, target: Int?, source: HExpr
) {
    match target {
        some(def_id) => match table.value_origins.get(def_id) {
            some(origins) => origins.push(source),
            none => {
                let origin_def_id = def_id
                table.value_origins.insert(origin_def_id, [source])
            }
        },
        none => {}
    }
}

fn compare_int_key<T>(a: (Int, T), b: (Int, T)) -> Int {
    if a.0 < b.0 { -1 } else if a.0 > b.0 { 1 } else { 0 }
}

fn normalized_solver_mode(mode: Int) -> Int {
    if mode == PARAM_OWNERSHIP_MUT_BORROW {
        PARAM_OWNERSHIP_MUT_BORROW
    } else if mode == PARAM_OWNERSHIP_MOVE {
        PARAM_OWNERSHIP_MOVE
    } else {
        // Unknown is not permission to take. Body-less interfaces keep their
        // registered conservative contract; body-inferred declarations start
        // from the language default Borrow.
        PARAM_OWNERSHIP_BORROW
    }
}

fn initial_solver_param_mode(param: HParam) -> Int {
    // Mutability and the runtime Drop-owner role are independent HParam bits.
    // Body-inferred schemes begin with an unresolved ownership term, so the
    // callable solver must preserve these checker-verified ABI facts itself.
    if hparam_is_external_drop_owner(param) {
        return PARAM_OWNERSHIP_MOVE
    }
    let declared = normalized_solver_mode(hparam_ownership(param))
    if declared == PARAM_OWNERSHIP_MOVE {
        PARAM_OWNERSHIP_MOVE
    } else if hparam_is_mutable(param) {
        PARAM_OWNERSHIP_MUT_BORROW
    } else {
        declared
    }
}

fn new_callable_solve_state(
    def_id: Int, params: List<HParam>, return_type: Type,
    body: HExpr, span: Span
) -> CallableSolveState {
    let mut param_def_ids: List<Int?> = []
    let mut modes: List<Int> = []
    let mut force_params: List<Bool> = []
    let mut contracts: Map<Int, Int> = map_new()
    let mut arities: Map<Int, Int> = map_new()
    let mut callable_types: Map<Int, Type> = map_new()
    for param in params {
        param_def_ids.push(param.def_id)
        modes.push(initial_solver_param_mode(param))
        force_params.push(hparam_is_declared_force(param) ||
            hparam_is_external_drop_owner(param))
        let param_type_for_match = param.ty
        let param_type_for_store = param.ty
        match param.def_id {
            some(param_id) => match param_type_for_match {
                Type::FnType { params: callable_params, meta, .. } => {
                    let contract_param_id = param_id
                    contracts.insert(
                        contract_param_id, meta.ownership_term)
                    let arity_param_id = param_id
                    arities.insert(arity_param_id, callable_params.len())
                    let type_param_id = param_id
                    let callable_param_type = param_type_for_store
                    callable_types.insert(type_param_id, callable_param_type)
                },
                _ => {}
            },
            none => {}
        }
    }
    let return_contract = fn_type_ownership(return_type)
    let return_arity = match return_type {
        Type::FnType { params: returned_params, .. } => returned_params.len(),
        _ => 0
    }
    CallableSolveState {
        def_id: def_id, param_def_ids: param_def_ids,
        modes: modes, force_params: force_params, body: body,
        return_callable_contract: return_contract,
        return_callable_arity: return_arity, span: span,
        alias_targets: map_new(), callable_contracts: contracts,
        callable_arities: arities, callable_types: callable_types
    }
}

fn insert_callable_solve_state(
    mut table: CallableSolveTable, state: CallableSolveState
) {
    if table.states.contains_key(state.def_id) {
        panic("unreachable: duplicate callable solver DefId")
    }
    for entry in state.callable_contracts.entries() {
        let (def_id, ownership_id) = entry
        let contract_def_id = def_id
        let contract_ownership_id = ownership_id
        table.callable_contracts.insert(
            contract_def_id, contract_ownership_id)
    }
    for entry in state.callable_arities.entries() {
        let (def_id, arity) = entry
        let arity_def_id = def_id
        let callable_arity = arity
        table.callable_arities.insert(arity_def_id, callable_arity)
    }
    for entry in state.callable_types.entries() {
        let (def_id, callable_type) = entry
        let callable_type_def_id = def_id
        let stored_callable_type = callable_type
        table.callable_types.insert(
            callable_type_def_id, stored_callable_type)
    }
    let ordered_def_id = state.def_id
    table.states.insert(state.def_id, state)
    table.order.push(ordered_def_id)
}

fn record_retained_callee(
    mut table: CallableSolveTable, def_id: Int?, span: Span
) {
    match def_id {
        some(id) => if !table.retained_callee_spans.contains_key(id) {
            let retained_id = id
            table.retained_callee_spans.insert(retained_id, span)
        },
        none => {}
    }
}

fn record_reachable_callee(
    mut table: CallableSolveTable, def_id: Int?, span: Span
) {
    match def_id {
        some(id) => if !table.reachable_callee_spans.contains_key(id) {
            let reachable_id = id
            table.reachable_callee_spans.insert(reachable_id, span)
        },
        none => {}
    }
}

// Handler parameters and resume continuations are bodyless callable
// interfaces. Their exact FnType is authority for invoking that slot, but not
// proof of a nested callable identity returned by it.
fn register_structural_declared_callable_slot(
    mut table: CallableSolveTable, target: Int?, ty: Type
) {
    let type_for_match = ty
    let type_for_state = ty
    match (target, type_for_match) {
        (some(def_id), Type::FnType { params, meta, .. }) => {
            let contract_id = def_id
            table.callable_contracts.insert(contract_id, meta.ownership_term)
            let arity_id = def_id
            table.callable_arities.insert(arity_id, params.len())
            let type_id = def_id
            table.callable_types.insert(type_id, type_for_state)
        },
        _ => {}
    }
}

// Retained-HIR callable census is deliberately structural rather than
// semantic. Callable identity, fresh result DefIds and type-level ABI
// descriptors must remain total even in a dependent child that cannot run.
// Move/capture/argument/return effects remain exclusively in the reachable
// collector and solver below. In particular, this census never records an
// assignment into an existing slot.
fn discover_callable_definitions_stmt(
    stmt: HStmt, mut table: CallableSolveTable
) {
    match stmt {
        HStmt::Let { def_id, ty, init, .. } => {
            let definition_init = init
            let origin_init = init
            let alias_init = init
            let origin_def_id = def_id
            let alias_def_id = def_id
            let alias_ty = ty
            discover_callable_definitions_expr(definition_init, table)
            append_value_origin(table, origin_def_id, origin_init)
            register_callable_alias(
                table, alias_def_id, alias_ty, alias_init)
        },
        HStmt::Var { def_id, ty, init, .. } => {
            let definition_init = init
            let origin_init = init
            let alias_init = init
            let origin_def_id = def_id
            let alias_def_id = def_id
            let alias_ty = ty
            discover_callable_definitions_expr(definition_init, table)
            append_value_origin(table, origin_def_id, origin_init)
            register_callable_alias(
                table, alias_def_id, alias_ty, alias_init)
        },
        HStmt::ExprStmt { expr: init, .. } =>
            discover_callable_definitions_expr(init, table),
        HStmt::LetDestructure { pattern, bindings, init, .. } => {
            let definition_init = init
            let provenance_init = init
            discover_callable_definitions_expr(definition_init, table)
            register_destructure_provenance(
                table, pattern, bindings, provenance_init)
        },
        HStmt::Assign { target, value, .. } => {
            discover_callable_definitions_expr(target, table)
            discover_callable_definitions_expr(value, table)
        },
        HStmt::Return { value, .. } => match value {
            some(returned) =>
                discover_callable_definitions_expr(returned, table),
            none => {}
        },
        HStmt::While { condition, body, .. } => {
            discover_callable_definitions_expr(condition, table)
            discover_callable_definitions_expr(body, table)
        },
        HStmt::ForIn { iterable, body, .. } => {
            discover_callable_definitions_expr(iterable, table)
            discover_callable_definitions_expr(body, table)
        },
        HStmt::IfLet { pattern, bindings, expr,
                       then_block, else_block, .. } => {
            let definition_expr = expr
            let provenance_expr = expr
            discover_callable_definitions_expr(definition_expr, table)
            register_pattern_provenance(
                table, pattern, bindings, provenance_expr)
            discover_callable_definitions_expr(then_block, table)
            match else_block {
                some(branch) =>
                    discover_callable_definitions_expr(branch, table),
                none => {}
            }
        },
        HStmt::Break { .. } | HStmt::Continue { .. } |
        HStmt::Drop { .. } => {}
    }
}

fn discover_callable_definitions_expr(
    expr: HExpr, mut table: CallableSolveTable
) {
    match expr {
        HExpr::BinOp { left, right, .. } => {
            discover_callable_definitions_expr(left, table)
            discover_callable_definitions_expr(right, table)
        },
        HExpr::UnaryOp { operand, .. } =>
            discover_callable_definitions_expr(operand, table),
        HExpr::Call { callee, callee_def_id, callable_result_def_id,
                      args, ty, span, .. } => {
            let retained_callee_id = callee_def_id
            let result_callee_id = callee_def_id
            let result_def_id = callable_result_def_id
            let result_ty = ty
            let retained_span = span
            let result_span = span
            record_retained_callee(
                table, retained_callee_id, retained_span)
            register_call_result(table, result_def_id,
                result_callee_id, result_ty, result_span)
            discover_callable_definitions_expr(callee, table)
            for arg in args {
                discover_callable_definitions_expr(arg, table)
            }
        },
        HExpr::FieldAccess { receiver, .. } =>
            discover_callable_definitions_expr(receiver, table),
        HExpr::StructLit { fields, spread, .. } => {
            for field in fields {
                discover_callable_definitions_expr(field.value, table)
            }
            match spread {
                some(source) =>
                    discover_callable_definitions_expr(source, table),
                none => {}
            }
        },
        HExpr::NamedVariantConstruct { fields, spread, .. } => {
            for field in fields {
                discover_callable_definitions_expr(field.value, table)
            }
            match spread {
                some(source) =>
                    discover_callable_definitions_expr(source, table),
                none => {}
            }
        },
        HExpr::MatchExpr { scrutinee, arms, .. } => {
            let definition_scrutinee = scrutinee
            let provenance_scrutinee = scrutinee
            discover_callable_definitions_expr(
                definition_scrutinee, table)
            for arm in arms {
                register_pattern_provenance(table, arm.pattern,
                    arm.bindings, provenance_scrutinee)
                match arm.guard {
                    some(guard) =>
                        discover_callable_definitions_expr(guard, table),
                    none => {}
                }
                discover_callable_definitions_expr(arm.body, table)
            }
        },
        HExpr::TryCatch { body, arms, .. } => {
            discover_callable_definitions_expr(body, table)
            for arm in arms {
                // Catch payloads are provided by the effect runtime rather
                // than an HExpr producer. Preserve their declared callable
                // contracts for deterministic recovery without inventing a
                // payload identity.
                for binding in arm.bindings {
                    register_callable_contract(table,
                        some(binding.def_id), binding.ty)
                }
                match arm.guard {
                    some(guard) =>
                        discover_callable_definitions_expr(guard, table),
                    none => {}
                }
                discover_callable_definitions_expr(arm.body, table)
            }
        },
        HExpr::Block { stmts, tail, .. } => {
            for stmt in stmts {
                discover_callable_definitions_stmt(stmt, table)
            }
            match tail {
                some(value) =>
                    discover_callable_definitions_expr(value, table),
                none => {}
            }
        },
        HExpr::IfExpr { condition, then_branch, else_branch, .. } => {
            discover_callable_definitions_expr(condition, table)
            discover_callable_definitions_expr(then_branch, table)
            match else_branch {
                some(branch) =>
                    discover_callable_definitions_expr(branch, table),
                none => {}
            }
        },
        HExpr::StringInterp { parts, .. } => {
            for part in parts {
                match part {
                    HStringInterpPart::Expression(value) =>
                        discover_callable_definitions_expr(value, table),
                    HStringInterpPart::Literal(_) => {}
                }
            }
        },
        HExpr::HandleExpr { body, handlers, .. } => {
            discover_callable_definitions_expr(body, table)
            for handler in handlers {
                for param in handler.params {
                    register_structural_declared_callable_slot(
                        table, param.def_id, param.ty)
                }
                match handler.resume_binding {
                    some(binding) =>
                        register_structural_declared_callable_slot(
                            table, some(binding.def_id), binding.ty),
                    none => {}
                }
                discover_callable_definitions_expr(handler.body, table)
            }
        },
        HExpr::Lambda { def_id, params, return_type, body, span, .. } => {
            let state_body = body
            let nested_definition_body = body
            let semantic_body = body
            let state_span = span
            insert_callable_solve_state(table,
                new_callable_solve_state(
                    def_id, params, return_type, state_body, state_span))
            discover_callable_definitions_expr(
                nested_definition_body, table)
            collect_callable_expr(semantic_body, table)
        },
        HExpr::EffectOp { args, .. } => {
            for arg in args {
                discover_callable_definitions_expr(arg, table)
            }
        },
        HExpr::RangeExpr { start, end, .. } => {
            discover_callable_definitions_expr(start, table)
            discover_callable_definitions_expr(end, table)
        },
        HExpr::ListLit { elements, .. } => {
            for element in elements {
                discover_callable_definitions_expr(element, table)
            }
        },
        HExpr::TupleLit { elements, .. } => {
            for element in elements {
                discover_callable_definitions_expr(element, table)
            }
        },
        HExpr::IndexExpr { receiver, index, .. } => {
            discover_callable_definitions_expr(receiver, table)
            discover_callable_definitions_expr(index, table)
        },
        HExpr::Clone { inner, .. } =>
            discover_callable_definitions_expr(inner, table),
        HExpr::ReturnExpr { value, .. } => match value {
            some(returned) =>
                discover_callable_definitions_expr(returned, table),
            none => {}
        },
        HExpr::UnsafeBlock { body, .. } =>
            discover_callable_definitions_expr(body, table),
        HExpr::Take { .. } | HExpr::Ident { .. } |
        HExpr::DictConstruct { .. } | HExpr::IntLit { .. } |
        HExpr::FloatLit { .. } | HExpr::StrLit { .. } |
        HExpr::BoolLit { .. } => {}
    }
}

fn collect_callable_decl(
    decl: HDecl, mut table: CallableSolveTable
) {
    match decl {
        HDecl::Fn { def_id, params, return_type, body, span, .. } => match def_id {
            some(id) => {
                let state_body = body
                let definition_body = body
                let semantic_body = body
                let state_span = span
                insert_callable_solve_state(table,
                    new_callable_solve_state(
                        id, params, return_type, state_body, state_span))
                discover_callable_definitions_expr(definition_body, table)
                collect_callable_expr(semantic_body, table)
            },
            none => panic("unreachable: body callable has no DefId")
        },
        HDecl::Impl { methods, .. } => {
            for method in methods { collect_callable_decl(method, table) }
        },
        HDecl::ModBlock { decls, .. } => {
            for nested in decls { collect_callable_decl(nested, table) }
        },
        HDecl::Trait { methods, .. } => {
            for method in methods {
                match method.body {
                    some(body) => {
                        let body_span = hexpr_span(body)
                        let state_body = body
                        let definition_body = body
                        let semantic_body = body
                        insert_callable_solve_state(table,
                            new_callable_solve_state(
                                method.def_id, method.params,
                                method.return_type, state_body,
                                body_span))
                        discover_callable_definitions_expr(
                            definition_body, table)
                        collect_callable_expr(semantic_body, table)
                    },
                    none => {}
                }
            }
        },
        HDecl::Effect { ops, .. } => {
            for op in ops {
                for param in op.params {
                    register_structural_declared_callable_slot(
                        table, param.def_id, param.ty)
                }
                match op.default_body {
                    some(body) => {
                        let definition_body = body
                        let semantic_body = body
                        discover_callable_definitions_expr(
                            definition_body, table)
                        collect_callable_expr(semantic_body, table)
                    },
                    none => {}
                }
            }
        },
        HDecl::Test { body, .. } => {
            let definition_body = body
            let semantic_body = body
            discover_callable_definitions_expr(definition_body, table)
            collect_callable_expr(semantic_body, table)
        },
        HDecl::Const { def_id, ty, init, span, .. } => {
            let definition_init = init
            let origin_init = init
            let semantic_init = init
            discover_callable_definitions_expr(definition_init, table)
            append_value_origin(table, def_id, origin_init)
            // The DefId is the zero-argument getter. Its stored callable is a
            // return producer, so a getter Call yields the init identity
            // itself rather than the callable returned by invoking that init.
            register_callable_const_getter(table, def_id, ty, init, span)
            collect_callable_expr(semantic_init, table)
        },
        _ => {}
    }
}

fn collect_callable_stmt(stmt: HStmt, mut table: CallableSolveTable) {
    match stmt {
        HStmt::Let { def_id, init, .. } => {
            let origin_init = init
            match def_id {
                some(id) => if !table.value_origins.contains_key(id) {
                    let origin_id = id
                    append_value_origin(table, some(origin_id), origin_init)
                },
                none => {}
            }
            collect_callable_expr(init, table)
        },
        HStmt::Var { def_id, init, .. } => {
            let origin_init = init
            match def_id {
                some(id) => if !table.value_origins.contains_key(id) {
                    let origin_id = id
                    append_value_origin(table, some(origin_id), origin_init)
                },
                none => {}
            }
            collect_callable_expr(init, table)
        },
        HStmt::ExprStmt { expr: init, .. } =>
            collect_callable_expr(init, table),
        HStmt::LetDestructure { init, .. } =>
            collect_callable_expr(init, table),
        HStmt::Assign { target, value, .. } => {
            match target {
                HExpr::Ident { def_id, .. } => {
                    let origin_value = value
                    append_value_origin(table, def_id, origin_value)
                },
                // A projection/index write changes an interior payload without
                // rebuilding the root literal.  Static origins for that root
                // are no longer authoritative on every path.
                _ => mark_value_origin_opaque(table, target)
            }
            collect_callable_expr(target, table)
            collect_callable_expr(value, table)
        },
        HStmt::Return { value, .. } => match value {
            some(returned) => collect_callable_expr(returned, table),
            none => {}
        },
        HStmt::While { condition, body, .. } => {
            let reachability_condition = condition
            let semantic_condition = condition
            let condition_reaches_value =
                expr_has_reachable_value(reachability_condition)
            collect_callable_expr(semantic_condition, table)
            if condition_reaches_value {
                collect_callable_expr(body, table)
            }
        },
        HStmt::ForIn { iterable, body, .. } => {
            let reachability_iterable = iterable
            let semantic_iterable = iterable
            let iterable_reaches_value =
                expr_has_reachable_value(reachability_iterable)
            collect_callable_expr(semantic_iterable, table)
            if iterable_reaches_value {
                collect_callable_expr(body, table)
            }
        },
        HStmt::IfLet { expr, then_block, else_block, .. } => {
            let reachability_expr = expr
            let semantic_expr = expr
            let expr_reaches_value =
                expr_has_reachable_value(reachability_expr)
            collect_callable_expr(semantic_expr, table)
            if expr_reaches_value {
                collect_callable_expr(then_block, table)
                match else_block {
                    some(branch) => collect_callable_expr(branch, table),
                    none => {}
                }
            }
        },
        HStmt::Break { .. } | HStmt::Continue { .. } |
        HStmt::Drop { .. } => {}
    }
}

fn collect_callable_expr(expr: HExpr, mut table: CallableSolveTable) {
    match expr {
        HExpr::BinOp { left, right, .. } => {
            collect_callable_expr(left, table)
            collect_callable_expr(right, table)
        },
        HExpr::UnaryOp { operand, .. } =>
            collect_callable_expr(operand, table),
        HExpr::Call { callee, callee_def_id, callable_result_def_id,
                      args, ty, span, .. } => {
            let reachable_callee_id = callee_def_id
            let registered_callee_id = callee_def_id
            let reachable_span = span
            record_reachable_callee(
                table, reachable_callee_id, reachable_span)
            let registered_result_id = callable_result_def_id
            let registered_type = ty
            let registered_span = span
            register_call_result(table, registered_result_id,
                registered_callee_id, registered_type, registered_span)
            collect_callable_expr(callee, table)
            for arg in args { collect_callable_expr(arg, table) }
        },
        HExpr::FieldAccess { receiver, .. } =>
            collect_callable_expr(receiver, table),
        HExpr::StructLit { fields, spread, .. } => {
            for field in fields { collect_callable_expr(field.value, table) }
            match spread {
                some(source) => collect_callable_expr(source, table),
                none => {}
            }
        },
        HExpr::NamedVariantConstruct { fields, spread, .. } => {
            for field in fields { collect_callable_expr(field.value, table) }
            match spread {
                some(source) => collect_callable_expr(source, table),
                none => {}
            }
        },
        HExpr::MatchExpr { scrutinee, arms, .. } => {
            let children = enumerate_reachable_match_children(
                scrutinee, arms)
            for inferred_child in children {
                let child: ReachableControlChild = inferred_child
                if child.kind == REACHABLE_CHILD_MATCH_SCRUTINEE {
                    collect_callable_expr(scrutinee, table)
                } else if child.kind == REACHABLE_CHILD_ARM_GUARD {
                    let arm: HMatchArm = match arms.get(child.arm_index) {
                        some(value) => value,
                        none => panic(
                            "unreachable: reachable Match child has no arm")
                    }
                    match arm.guard {
                        some(guard) => collect_callable_expr(guard, table),
                        none => panic(
                            "unreachable: reachable guard child has no guard")
                    }
                } else if child.kind == REACHABLE_CHILD_ARM_BODY {
                    let arm: HMatchArm = match arms.get(child.arm_index) {
                        some(value) => value,
                        none => panic(
                            "unreachable: reachable Match child has no arm")
                    }
                    collect_callable_expr(arm.body, table)
                } else {
                    panic(
                        "unreachable: invalid Match reachable-child kind")
                }
            }
        },
        HExpr::Block { stmts, tail, .. } => {
            for stmt in stmts {
                collect_callable_stmt(stmt, table)
                // Dead assignments/origins must not add aliases to the global
                // callable solve table. The terminating stmt itself remains
                // visible so its return value and nested callables are known.
                if !stmt_reaches_next(stmt) { return }
            }
            match tail {
                some(value) => collect_callable_expr(value, table),
                none => {}
            }
        },
        HExpr::IfExpr { condition, then_branch, else_branch, .. } => {
            let has_else = match else_branch {
                some(_) => true,
                none => false
            }
            let children = enumerate_reachable_if_children(
                condition, has_else)
            for inferred_child in children {
                let child: ReachableControlChild = inferred_child
                if child.kind == REACHABLE_CHILD_IF_CONDITION {
                    collect_callable_expr(condition, table)
                } else if child.kind == REACHABLE_CHILD_IF_THEN {
                    collect_callable_expr(then_branch, table)
                } else if child.kind == REACHABLE_CHILD_IF_ELSE {
                    match else_branch {
                        some(branch) => collect_callable_expr(branch, table),
                        none => panic(
                            "unreachable: reachable else child has no branch")
                    }
                } else {
                    panic(
                        "unreachable: invalid If reachable-child kind")
                }
            }
        },
        HExpr::StringInterp { parts, .. } => {
            for part in parts {
                match part {
                    HStringInterpPart::Expression(value) =>
                        collect_callable_expr(value, table),
                    HStringInterpPart::Literal(_) => {}
                }
            }
        },
        HExpr::TryCatch { body, arms, .. } => {
            collect_callable_expr(body, table)
            for inferred_child in enumerate_reachable_arm_children(arms) {
                let child: ReachableControlChild = inferred_child
                let arm: HMatchArm = match arms.get(child.arm_index) {
                    some(value) => value,
                    none => panic(
                        "unreachable: reachable Catch child has no arm")
                }
                if child.kind == REACHABLE_CHILD_ARM_GUARD {
                    match arm.guard {
                        some(guard) => collect_callable_expr(guard, table),
                        none => panic(
                            "unreachable: reachable Catch guard has no guard")
                    }
                } else if child.kind == REACHABLE_CHILD_ARM_BODY {
                    collect_callable_expr(arm.body, table)
                } else {
                    panic("unreachable: invalid Catch reachable-child kind")
                }
            }
        },
        HExpr::HandleExpr { body, handlers, .. } => {
            collect_callable_expr(body, table)
            for handler in handlers {
                collect_callable_expr(handler.body, table)
            }
        },
        // The structural definition census already registered this exact
        // lambda and collected its body under a fresh callable CFG. Re-entering
        // here would duplicate its aliases into the construction context.
        HExpr::Lambda { .. } => {},
        HExpr::EffectOp { args, .. } => {
            for arg in args { collect_callable_expr(arg, table) }
        },
        HExpr::RangeExpr { start, end, .. } => {
            collect_callable_expr(start, table)
            collect_callable_expr(end, table)
        },
        HExpr::ListLit { elements, .. } => {
            for element in elements { collect_callable_expr(element, table) }
        },
        HExpr::TupleLit { elements, .. } => {
            for element in elements { collect_callable_expr(element, table) }
        },
        HExpr::IndexExpr { receiver, index, .. } => {
            collect_callable_expr(receiver, table)
            collect_callable_expr(index, table)
        },
        HExpr::Clone { inner, .. } => collect_callable_expr(inner, table),
        HExpr::ReturnExpr { value, .. } => match value {
            some(returned) => collect_callable_expr(returned, table),
            none => {}
        },
        HExpr::UnsafeBlock { body, .. } => collect_callable_expr(body, table),
        HExpr::Take { .. } | HExpr::Ident { .. } |
        HExpr::DictConstruct { .. } | HExpr::IntLit { .. } |
        HExpr::FloatLit { .. } | HExpr::StrLit { .. } |
        HExpr::BoolLit { .. } => {}
    }
}

fn fn_type_ownership(ty: Type) -> Int? {
    match ty {
        Type::FnType { meta, .. } => some(meta.ownership_term),
        _ => none
    }
}


fn join_solver_mode(left: Int?, right: Int?) -> Int? {
    match (left, right) {
        (none, value) => {
            let result_value = value
            result_value
        },
        (value, none) => {
            let result_value = value
            result_value
        },
        (some(a), some(b)) => {
            if a == PARAM_OWNERSHIP_MOVE || b == PARAM_OWNERSHIP_MOVE {
                some(PARAM_OWNERSHIP_MOVE)
            } else if a == PARAM_OWNERSHIP_MUT_BORROW ||
                      b == PARAM_OWNERSHIP_MUT_BORROW {
                some(PARAM_OWNERSHIP_MUT_BORROW)
            } else {
                some(PARAM_OWNERSHIP_BORROW)
            }
        }
    }
}

fn recompute_solver_alias_edge_count(table: CallableSolveTable) -> Int {
    let mut total = 0
    for entry in table.alias_targets.entries() {
        let (_, targets) = entry
        total = total + targets.len()
    }
    total
}

fn solver_alias_edge_count(table: CallableSolveTable) -> Int {
    table.alias_edge_count
}

fn validate_solver_alias_edge_count(table: CallableSolveTable) {
    if recompute_solver_alias_edge_count(table) != table.alias_edge_count {
        panic("unreachable: callable ownership alias edge count drifted")
    }
}

fn solver_mode_score(table: CallableSolveTable) -> Int {
    let mut total = 0
    for def_id in table.order {
        match table.states.get(def_id) {
            some(state) => {
                for mode in state.modes { total = total + mode }
            },
            none => {}
        }
    }
    total
}

fn solver_mode_for_def_id(
    table: CallableSolveTable, metadata: OwnershipMetadata,
    def_id: Int, index: Int, fuel: Int
) -> Int? {
    let mut result: Int? = none
    if fuel > 0 {
        match table.alias_targets.get(def_id) {
            some(targets) => {
            for target in targets {
                result = join_solver_mode(result, solver_mode_for_def_id(
                    table, metadata, target, index, fuel - 1))
            }
            },
            none => {}
        }
    }
    match table.states.get(def_id) {
        some(target_state) => {
            result = join_solver_mode(result, target_state.modes.get(index))
        },
        none => {}
    }
    match metadata.callable_by_def_id.get(def_id) {
        some(ownership_id) => {
            result = join_solver_mode(result, some(callable_param_ownership(
                metadata, ownership_id, index)))
        },
        none => {}
    }
    match table.callable_contracts.get(def_id) {
        some(ownership_id) => {
            result = join_solver_mode(result, some(callable_param_ownership(
                metadata, ownership_id, index)))
        },
        none => {}
    }
    result
}

fn solver_param_mode(
    table: CallableSolveTable, metadata: OwnershipMetadata,
    callee_def_id: Int?, index: Int
) -> Int {
    match callee_def_id {
        some(def_id) => {
            let exact_mode = solver_mode_for_def_id(
                table, metadata, def_id, index,
                solver_alias_edge_count(table) + 1)
            // The planner owns the user-facing E0801 for opaque/complex
            // callees.  Solver recovery must remain total so that diagnostic
            // input cannot panic before that check runs.
            exact_mode.unwrap_or(PARAM_OWNERSHIP_BORROW)
        },
        none => PARAM_OWNERSHIP_BORROW
    }
}

fn join_solver_force(left: Bool?, right: Bool?) -> Bool? {
    match (left, right) {
        (none, value) => value,
        (value, none) => value,
        (some(a), some(b)) => {
            let right_value = b
            some(a || right_value)
        }
    }
}

fn solver_force_for_def_id(
    table: CallableSolveTable, metadata: OwnershipMetadata,
    def_id: Int, index: Int, fuel: Int
) -> Bool? {
    let mut result: Bool? = none
    if fuel > 0 {
        match table.alias_targets.get(def_id) {
            some(targets) => {
                for target in targets {
                    result = join_solver_force(result, solver_force_for_def_id(
                        table, metadata, target, index, fuel - 1))
                }
            },
            none => {}
        }
    }
    match table.states.get(def_id) {
        some(target_state) => {
            result = join_solver_force(
                result, target_state.force_params.get(index))
        },
        none => {}
    }
    result = join_solver_force(result,
        callable_param_requires_force(metadata, def_id, index))
    // A callable-valued HParam/handler slot is an interface view. Its explicit
    // FnType Move contract is locally strengthened to FORCE even when an
    // OWNING producer such as `some` is supplied at a call site.
    match table.callable_contracts.get(def_id) {
        some(ownership_id) => if callable_param_ownership(
                metadata, ownership_id, index) == PARAM_OWNERSHIP_MOVE {
            result = join_solver_force(result, some(true))
        },
        none => {}
    }
    result
}

fn solver_param_transfer(
    table: CallableSolveTable, metadata: OwnershipMetadata,
    callee_def_id: Int?, index: Int
) -> Int {
    let mode = solver_param_mode(table, metadata, callee_def_id, index)
    if mode != PARAM_OWNERSHIP_MOVE { return TRANSFER_BORROW }
    match callee_def_id {
        some(def_id) => if solver_force_for_def_id(
                table, metadata, def_id, index,
                solver_alias_edge_count(table) + 1).unwrap_or(false) {
            TRANSFER_FORCE
        } else {
            TRANSFER_OWNING
        },
        none => TRANSFER_BORROW
    }
}

fn list_has_def_id(values: List<Int>, target: Int) -> Bool {
    for value in values { if value == target { return true } }
    false
}

// Collect every exact callable identity that may be produced by `expr`.
// `true` means the traversal proved that every value-producing path bottoms
// out in a DefId-bearing callable; `false` means the producer is opaque and no
// FnType annotation may be used as an ownership guess.  Solver aliasing and
// CFG planning deliberately share this one total HExpr traversal.
fn collect_callable_identity_sources(
    expr: HExpr, mut out: List<Int>
) -> Bool {
    // A branch which cannot produce a value contributes no callable identity
    // and therefore cannot make the surviving producer opaque.  This keeps
    // Never/return paths neutral while still requiring every reachable value
    // path to bottom out in exact DefId evidence.
    if !expr_has_reachable_value(expr) {
        return true
    }
    match expr {
        HExpr::Ident { def_id: some(source), .. } => {
            if list_has_def_id(out, source) == false {
                let stored_source = source
                out.push(stored_source)
            }
            true
        },
        HExpr::Ident { def_id: none, .. } => false,
        HExpr::Lambda { def_id, .. } => {
            if list_has_def_id(out, def_id) == false {
                let stored_def_id = def_id
                out.push(stored_def_id)
            }
            true
        },
        HExpr::Take { source_def_id, .. } => {
            if list_has_def_id(out, source_def_id) == false {
                let stored_source_def_id = source_def_id
                out.push(stored_source_def_id)
            }
            true
        },
        HExpr::IfExpr { condition, then_branch, else_branch, .. } => {
            let has_else = match else_branch {
                some(_) => true,
                none => false
            }
            let children = enumerate_reachable_if_children(
                condition, has_else)
            let mut then_is_child = false
            let mut else_is_child = false
            for inferred_child in children {
                let child: ReachableControlChild = inferred_child
                if child.kind == REACHABLE_CHILD_IF_CONDITION {
                } else if child.kind == REACHABLE_CHILD_IF_THEN {
                    then_is_child = true
                } else if child.kind == REACHABLE_CHILD_IF_ELSE {
                    else_is_child = true
                } else {
                    panic(
                        "unreachable: invalid If reachable-child kind")
                }
            }
            let mut exact = has_else
            if then_is_child {
                let identity_then = then_branch
                if collect_callable_identity_sources(identity_then, out) == false {
                    exact = false
                }
            }
            if else_is_child {
                match else_branch {
                    some(branch) => {
                        let identity_else = branch
                        if collect_callable_identity_sources(
                                identity_else, out) == false {
                            exact = false
                        }
                    },
                    none => panic(
                        "unreachable: reachable else child has no branch")
                }
            }
            exact
        },
        HExpr::MatchExpr { scrutinee, arms, .. } => {
            let children = enumerate_reachable_match_children(
                scrutinee, arms)
            let mut reachable_bodies: Set<Int> = set_new()
            for inferred_child in children {
                let child: ReachableControlChild = inferred_child
                if child.kind == REACHABLE_CHILD_MATCH_SCRUTINEE ||
                        child.kind == REACHABLE_CHILD_ARM_GUARD {
                } else if child.kind == REACHABLE_CHILD_ARM_BODY {
                    reachable_bodies.insert(child.arm_index)
                } else {
                    panic(
                        "unreachable: invalid Match reachable-child kind")
                }
            }
            let mut exact = arms.len() > 0
            let mut arm_index = 0
            for arm in arms {
                if reachable_bodies.contains(arm_index) {
                    let identity_body = arm.body
                    if collect_callable_identity_sources(
                            identity_body, out) == false {
                        exact = false
                    }
                }
                arm_index = arm_index + 1
            }
            exact
        },
        HExpr::Block { stmts, tail, .. } => {
            for stmt in stmts {
                if !stmt_reaches_next(stmt) { return false }
            }
            match tail {
                some(value) => collect_callable_identity_sources(value, out),
                none => false
            }
        },
        HExpr::Clone { inner, .. } =>
            collect_callable_identity_sources(inner, out),
        HExpr::UnsafeBlock { body, .. } =>
            collect_callable_identity_sources(body, out),
        HExpr::TryCatch { body, arms, .. } => {
            let mut exact = true
            let mut any = false
            if expr_has_reachable_value(body) {
                exact = collect_callable_identity_sources(body, out)
                any = true
            }
            for inferred_child in enumerate_reachable_arm_children(arms) {
                let child: ReachableControlChild = inferred_child
                if child.kind == REACHABLE_CHILD_ARM_BODY {
                    let arm: HMatchArm = match arms.get(child.arm_index) {
                        some(value) => value,
                        none => panic(
                            "unreachable: reachable Catch body has no arm")
                    }
                    if collect_callable_identity_sources(
                            arm.body, out) == false {
                        exact = false
                    }
                    any = true
                }
            }
            any && exact
        },
        HExpr::HandleExpr { body, handlers, .. } => {
            let mut exact = collect_callable_identity_sources(body, out)
            // Only fail.raise abort arms are alternate results of HandleExpr.
            // Tail-resumptive handler bodies produce the operation result and
            // re-enter `body`; they are not values of the handle expression.
            for handler in handlers {
                if handler.is_abortive &&
                   collect_callable_identity_sources(handler.body, out) == false {
                    exact = false
                }
            }
            exact
        },
        // A call may return a callable, but its result identity is not its
        // callee DefId. Container projections and effect operations likewise
        // need explicit payload provenance before they can participate here.
        HExpr::Call { callable_result_def_id: some(result_def_id), .. } => {
            if list_has_def_id(out, result_def_id) == false {
                let stored_result_def_id = result_def_id
                out.push(stored_result_def_id)
            }
            true
        },
        HExpr::Call { callable_result_def_id: none, .. } |
        HExpr::FieldAccess { .. } |
        HExpr::IndexExpr { .. } | HExpr::EffectOp { .. } |
        HExpr::StructLit { .. } | HExpr::NamedVariantConstruct { .. } |
        HExpr::ListLit { .. } | HExpr::TupleLit { .. } |
        HExpr::RangeExpr { .. } | HExpr::StringInterp { .. } |
        HExpr::ReturnExpr { .. } | HExpr::DictConstruct { .. } |
        HExpr::BinOp { .. } | HExpr::UnaryOp { .. } |
        HExpr::IntLit { .. } | HExpr::FloatLit { .. } |
        HExpr::StrLit { .. } | HExpr::BoolLit { .. } => false
    }
}

fn register_callable_source_ids(
    mut table: CallableSolveTable, target_id: Int,
    params: List<Type>, ownership_id: Int, sources: List<Int>, span: Span
) {
    let contract_target_id = target_id
    table.callable_contracts.insert(contract_target_id, ownership_id)
    let arity_target_id = target_id
    table.callable_arities.insert(arity_target_id, params.len())
    let span_target_id = target_id
    table.alias_spans.insert(span_target_id, span)
    let mut accepted = false
    match table.alias_targets.get(target_id) {
        some(existing) => {
            for source_id in sources {
                if source_id != target_id {
                    accepted = true
                    if list_has_def_id(existing, source_id) == false {
                        let accepted_source_id = source_id
                        existing.push(accepted_source_id)
                        table.alias_edge_count = table.alias_edge_count + 1
                    }
                }
            }
        },
        none => {
            let mut filtered: List<Int> = []
            for source_id in sources {
                if source_id != target_id {
                    accepted = true
                    if list_has_def_id(filtered, source_id) == false {
                        let accepted_source_id = source_id
                        filtered.push(accepted_source_id)
                    }
                }
            }
            if filtered.len() > 0 {
                table.alias_edge_count = table.alias_edge_count + filtered.len()
                let alias_target_id = target_id
                table.alias_targets.insert(alias_target_id, filtered)
            }
        }
    }
    if accepted && !table.opaque_callable_slots.contains_key(target_id) {
        let untrusted_target_id = target_id
        table.untrusted_callable_slots.remove(untrusted_target_id)
    }
}

fn register_callable_alias(
    mut table: CallableSolveTable,
    target: Int?, target_ty: Type, source: HExpr
) {
    match (target, target_ty) {
        (some(target_id), Type::FnType { params, meta, .. }) => {
            let mut sources: List<Int> = []
            let exact = collect_callable_identity_sources(source, sources)
            // Keep the declared contract only as error-recovery state. The
            // planner emits E0801 for this binding before any generated code
            // can consume a stale type-only contract.
            if exact == false || sources.len() == 0 {
                let contract_target_id = target_id
                table.callable_contracts.insert(
                    contract_target_id, meta.ownership_term)
                let arity_target_id = target_id
                table.callable_arities.insert(
                    arity_target_id, params.len())
                let untrusted_target_id = target_id
                table.untrusted_callable_slots.insert(
                    untrusted_target_id, true)
                let opaque_target_id = target_id
                table.opaque_callable_slots.insert(opaque_target_id, true)
                return
            }
            let alias_target_id = target_id
            register_callable_source_ids(table, alias_target_id, params,
                meta.ownership_term, sources, hexpr_span(source))
        },
        _ => {}
    }
}

fn register_callable_const_getter(
    mut table: CallableSolveTable,
    getter: Int?, stored_ty: Type, init: HExpr, span: Span
) {
    match (getter, stored_ty) {
        (some(getter_id), Type::FnType { .. }) => {
            let stored_type_getter_id = getter_id
            let stored_type = stored_ty
            table.const_callable_types.insert(
                stored_type_getter_id, stored_type)
            let durable_getter_id = getter_id
            table.durable_callable_spans.insert(
                durable_getter_id, copy_ownership_span(span))

            let mut sources: List<Int> = []
            let exact = collect_callable_identity_sources(init, sources)
            let mut filtered: List<Int> = []
            for source_id in sources {
                if source_id != getter_id &&
                   !list_has_def_id(filtered, source_id) {
                    let stored_source_id = source_id
                    filtered.push(stored_source_id)
                }
            }
            if exact && filtered.len() > 0 {
                let return_getter_id = getter_id
                table.return_targets.insert(return_getter_id, filtered)
                table.opaque_callable_returns.remove(getter_id)
            } else {
                let opaque_getter_id = getter_id
                table.opaque_callable_returns.insert(opaque_getter_id, true)
            }
        },
        _ => {}
    }
}

fn register_callable_contract(
    mut table: CallableSolveTable, target: Int?, ty: Type
) {
    let type_for_match = ty
    let type_for_state = ty
    match (target, type_for_match) {
        (some(def_id), Type::FnType { params, meta, .. }) => {
            let contract_def_id = def_id
            table.callable_contracts.insert(
                contract_def_id, meta.ownership_term)
            let arity_def_id = def_id
            table.callable_arities.insert(arity_def_id, params.len())
            let type_def_id = def_id
            table.callable_types.insert(type_def_id, type_for_state)
            let untrusted_def_id = def_id
            table.untrusted_callable_slots.insert(untrusted_def_id, true)
        },
        _ => {}
    }
}

const PAYLOAD_NO_MATCH: Int = 0
const PAYLOAD_EXACT: Int = 1
const PAYLOAD_OPAQUE: Int = 2

struct PatternPayloadPath {
    alternative_index: Int,
    ordinal: Int,
    indices: List<Int>
}

struct PatternPayloadPlan {
    paths: List<PatternPayloadPath>,
    missing_binding: Bool
}

struct ProjectedPatternPayload {
    alternative_index: Int,
    source_ordinal: Int,
    ordinal: Int,
    emission_ordinal: Int,
    value: HExpr
}

struct PatternPayloadSourceState {
    next_ordinal: Int,
    next_emission_ordinal: Int
}

const PAYLOAD_PATH_RELATION_DISJOINT: Int = 0
const PAYLOAD_PATH_RELATION_SAME: Int = 1
const PAYLOAD_PATH_RELATION_OVERLAP: Int = 2

const PAYLOAD_PATTERN_TUPLE: Int = 0
const PAYLOAD_PATTERN_POSITIONAL: Int = 1
const PAYLOAD_PATTERN_NAMED: Int = 2

const PAYLOAD_PRODUCER_TUPLE: Int = 0
const PAYLOAD_PRODUCER_POSITIONAL: Int = 1
const PAYLOAD_PRODUCER_NAMED_VARIANT: Int = 2
const PAYLOAD_PRODUCER_NAMED_STRUCT: Int = 3
const PAYLOAD_PRODUCER_UNKNOWN: Int = 4

const PAYLOAD_PATH_NO_MATCH: Int = 0
const PAYLOAD_PATH_CHILD: Int = 1
const PAYLOAD_PATH_WHOLE: Int = 2
const PAYLOAD_PATH_OPAQUE: Int = 3

fn classify_pattern_payload_constructor(
    pattern_kind: Int, pattern_name: Str, pattern_qualifier: Str?,
    pattern_arity: Int, producer_kind: Int, producer_name: Str,
    producer_ctor: Str, producer_arity: Int
) -> Int {
    if pattern_kind == PAYLOAD_PATTERN_TUPLE {
        if producer_kind != PAYLOAD_PRODUCER_TUPLE {
            return PAYLOAD_OPAQUE
        }
        return if pattern_arity == producer_arity {
            PAYLOAD_EXACT
        } else {
            PAYLOAD_NO_MATCH
        }
    }
    if pattern_kind == PAYLOAD_PATTERN_POSITIONAL {
        if producer_kind != PAYLOAD_PRODUCER_POSITIONAL {
            return PAYLOAD_OPAQUE
        }
        let qualifier_matches = match pattern_qualifier {
            some(expected_enum) => expected_enum == producer_name,
            none => true
        }
        return if qualifier_matches && pattern_arity == producer_arity &&
                  producer_ctor == variant_ctor_name(
                      producer_name, pattern_name) {
            PAYLOAD_EXACT
        } else {
            PAYLOAD_NO_MATCH
        }
    }
    if pattern_kind == PAYLOAD_PATTERN_NAMED {
        if producer_kind == PAYLOAD_PRODUCER_NAMED_VARIANT {
            let qualifier_matches = match pattern_qualifier {
                some(expected_enum) => expected_enum == producer_name,
                none => true
            }
            return if qualifier_matches && pattern_name == producer_ctor {
                PAYLOAD_EXACT
            } else {
                PAYLOAD_NO_MATCH
            }
        }
        if producer_kind == PAYLOAD_PRODUCER_NAMED_STRUCT {
            return if pattern_qualifier.is_none() &&
                      pattern_name == producer_name {
                PAYLOAD_EXACT
            } else {
                PAYLOAD_NO_MATCH
            }
        }
        return PAYLOAD_OPAQUE
    }
    PAYLOAD_OPAQUE
}

fn merge_payload_status(left: Int, right: Int) -> Int {
    if left == PAYLOAD_OPAQUE || right == PAYLOAD_OPAQUE {
        PAYLOAD_OPAQUE
    } else if left == PAYLOAD_EXACT || right == PAYLOAD_EXACT {
        PAYLOAD_EXACT
    } else {
        PAYLOAD_NO_MATCH
    }
}

fn copy_pattern_payload_indices(
    indices: List<Int>, next_index: Int
) -> List<Int> {
    let mut result: List<Int> = []
    for index in indices {
        let copied_index = index
        result.push(copied_index)
    }
    result.push(next_index)
    result
}

fn collect_pattern_payload_paths(
    pattern: Pattern, target: Str, alternative_index: Int,
    indices: List<Int>, fuel: Int, mut plan: PatternPayloadPlan
) {
    if fuel <= 0 {
        plan.missing_binding = true
        return
    }
    match pattern {
        Pattern::Binding { name, .. } => {
            if name == target {
                let path_alternative = alternative_index
                let path_ordinal = plan.paths.len()
                let path_indices = indices
                plan.paths.push(PatternPayloadPath {
                    alternative_index: path_alternative,
                    ordinal: path_ordinal,
                    indices: path_indices
                })
            }
        },
        Pattern::OrPattern { patterns, .. } => {
            let mut index = 0
            while index < patterns.len() {
                match patterns.get(index) {
                    some(alternative) => {
                        let before = plan.paths.len()
                        let path_index = index
                        let nested_indices = copy_pattern_payload_indices(
                            indices, path_index)
                        collect_pattern_payload_paths(
                            alternative, target, alternative_index,
                            nested_indices, fuel - 1, plan)
                        if plan.paths.len() == before {
                            plan.missing_binding = true
                        }
                    },
                    none => { plan.missing_binding = true }
                }
                index = index + 1
            }
            if patterns.len() == 0 { plan.missing_binding = true }
        },
        Pattern::TuplePattern { elements, .. } => {
            let mut index = 0
            while index < elements.len() {
                match elements.get(index) {
                    some(element) => {
                        if pattern_binds_name(element, target) {
                            let path_index = index
                            let child_indices = copy_pattern_payload_indices(
                                indices, path_index)
                            collect_pattern_payload_paths(
                                element, target, alternative_index,
                                child_indices, fuel - 1, plan)
                        }
                    },
                    none => {}
                }
                index = index + 1
            }
        },
        Pattern::Constructor { fields, .. } => {
            let mut index = 0
            while index < fields.len() {
                match fields.get(index) {
                    some(field) => {
                        if pattern_binds_name(field, target) {
                            let path_index = index
                            let child_indices = copy_pattern_payload_indices(
                                indices, path_index)
                            collect_pattern_payload_paths(
                                field, target, alternative_index,
                                child_indices, fuel - 1, plan)
                        }
                    },
                    none => {}
                }
                index = index + 1
            }
        },
        Pattern::NamedConstructor { fields, .. } => {
            let mut index = 0
            while index < fields.len() {
                match fields.get(index) {
                    some(field) => {
                        if pattern_binds_name(field.pattern, target) {
                            let path_index = index
                            let child_indices = copy_pattern_payload_indices(
                                indices, path_index)
                            collect_pattern_payload_paths(
                                field.pattern, target, alternative_index,
                                child_indices, fuel - 1, plan)
                        }
                    },
                    none => {}
                }
                index = index + 1
            }
        },
        Pattern::Wildcard { .. } | Pattern::Literal { .. } => {}
    }
}

fn build_or_pattern_payload_plan(
    root: Pattern, target: Str, fuel: Int
) -> PatternPayloadPlan {
    let mut plan = PatternPayloadPlan {
        paths: [], missing_binding: false
    }
    match root {
        Pattern::OrPattern { patterns, .. } => {
            let mut alternative_index = 0
            while alternative_index < patterns.len() {
                match patterns.get(alternative_index) {
                    some(alternative) => {
                        let before = plan.paths.len()
                        collect_pattern_payload_paths(
                            alternative, target, alternative_index,
                            [], fuel - 1, plan)
                        if plan.paths.len() == before {
                            plan.missing_binding = true
                        }
                    },
                    none => { plan.missing_binding = true }
                }
                alternative_index = alternative_index + 1
            }
            if patterns.len() == 0 { plan.missing_binding = true }
        },
        _ => { plan.missing_binding = true }
    }
    normalize_pattern_payload_plan(root, plan)
}

fn optional_pattern_payload_name_equal(left: Str?, right: Str?) -> Bool {
    match (left, right) {
        (some(a), some(b)) => a == b,
        (none, none) => true,
        _ => false
    }
}

fn pattern_payload_path_relation_from_non_or_nodes(
    left: Pattern, right: Pattern,
    left_indices: List<Int>, left_position: Int,
    right_indices: List<Int>, right_position: Int
) -> Int {
    match left {
        Pattern::Binding { name: left_name, .. } => match right {
            Pattern::Binding { name: right_name, .. } => {
                if left_position == left_indices.len() &&
                   right_position == right_indices.len() &&
                   left_name == right_name {
                    PAYLOAD_PATH_RELATION_SAME
                } else {
                    PAYLOAD_PATH_RELATION_OVERLAP
                }
            },
            _ => PAYLOAD_PATH_RELATION_OVERLAP
        },
        Pattern::TuplePattern { elements: left_elements, .. } =>
            match right {
                Pattern::Binding { .. } | Pattern::OrPattern { .. } =>
                    PAYLOAD_PATH_RELATION_OVERLAP,
                Pattern::TuplePattern {
                    elements: right_elements, ..
                } => {
                    match (left_indices.get(left_position),
                           right_indices.get(right_position)) {
                        (some(left_index), some(right_index)) => {
                            if left_elements.len() != right_elements.len() ||
                               left_index != right_index {
                                return PAYLOAD_PATH_RELATION_DISJOINT
                            }
                            match (left_elements.get(left_index),
                                   right_elements.get(right_index)) {
                                (some(left_child), some(right_child)) => {
                                    let relation_left_child = left_child
                                    let relation_right_child = right_child
                                    let child_relation =
                                        pattern_payload_path_relation_from_nodes(
                                            relation_left_child,
                                            relation_right_child,
                                            left_indices,
                                            left_position + 1,
                                            right_indices,
                                            right_position + 1)
                                    if child_relation ==
                                       PAYLOAD_PATH_RELATION_SAME {
                                        PAYLOAD_PATH_RELATION_SAME
                                    } else {
                                        PAYLOAD_PATH_RELATION_OVERLAP
                                    }
                                },
                                _ => PAYLOAD_PATH_RELATION_OVERLAP
                            }
                        },
                        _ => PAYLOAD_PATH_RELATION_OVERLAP
                    }
                },
                _ => PAYLOAD_PATH_RELATION_DISJOINT
            },
        Pattern::Constructor {
            name: left_name, qualifier: left_qualifier,
            fields: left_fields, ..
        } => match right {
            Pattern::Binding { .. } | Pattern::OrPattern { .. } =>
                PAYLOAD_PATH_RELATION_OVERLAP,
            Pattern::Constructor {
                name: right_name, qualifier: right_qualifier,
                fields: right_fields, ..
            } => {
                let names_compatible = left_name == right_name
                let left_qualifier_for_relation = left_qualifier
                let right_qualifier_for_relation = right_qualifier
                let qualifiers_compatible =
                    optional_pattern_payload_name_equal(
                        left_qualifier_for_relation,
                        right_qualifier_for_relation)
                let arities_compatible =
                    left_fields.len() == right_fields.len()
                let constructors_compatible = names_compatible &&
                    qualifiers_compatible && arities_compatible
                match (left_indices.get(left_position),
                       right_indices.get(right_position)) {
                    (some(left_index), some(right_index)) => {
                        if !constructors_compatible ||
                           left_index != right_index {
                            return PAYLOAD_PATH_RELATION_DISJOINT
                        }
                        match (left_fields.get(left_index),
                               right_fields.get(right_index)) {
                            (some(left_child), some(right_child)) => {
                                let relation_left_child = left_child
                                let relation_right_child = right_child
                                let child_relation =
                                    pattern_payload_path_relation_from_nodes(
                                        relation_left_child,
                                        relation_right_child,
                                        left_indices,
                                        left_position + 1,
                                        right_indices,
                                        right_position + 1)
                                if child_relation ==
                                   PAYLOAD_PATH_RELATION_SAME {
                                    PAYLOAD_PATH_RELATION_SAME
                                } else {
                                    PAYLOAD_PATH_RELATION_OVERLAP
                                }
                            },
                            _ => PAYLOAD_PATH_RELATION_OVERLAP
                        }
                    },
                    _ => PAYLOAD_PATH_RELATION_OVERLAP
                }
            },
            _ => PAYLOAD_PATH_RELATION_DISJOINT
        },
        Pattern::NamedConstructor {
            name: left_name, qualifier: left_qualifier,
            fields: left_fields, ..
        } => match right {
            Pattern::Binding { .. } | Pattern::OrPattern { .. } =>
                PAYLOAD_PATH_RELATION_OVERLAP,
            Pattern::NamedConstructor {
                name: right_name, qualifier: right_qualifier,
                fields: right_fields, ..
            } => {
                let names_compatible = left_name == right_name
                let left_qualifier_for_relation = left_qualifier
                let right_qualifier_for_relation = right_qualifier
                let qualifiers_compatible =
                    optional_pattern_payload_name_equal(
                        left_qualifier_for_relation,
                        right_qualifier_for_relation)
                let constructors_compatible =
                    names_compatible && qualifiers_compatible
                match (left_indices.get(left_position),
                       right_indices.get(right_position)) {
                    (some(left_index), some(right_index)) => {
                        if !constructors_compatible {
                            return PAYLOAD_PATH_RELATION_DISJOINT
                        }
                        match (left_fields.get(left_index),
                               right_fields.get(right_index)) {
                            (some(left_field), some(right_field)) => {
                                if left_field.name != right_field.name {
                                    return PAYLOAD_PATH_RELATION_DISJOINT
                                }
                                let relation_left_child = left_field.pattern
                                let relation_right_child = right_field.pattern
                                let child_relation =
                                    pattern_payload_path_relation_from_nodes(
                                        relation_left_child,
                                        relation_right_child,
                                        left_indices,
                                        left_position + 1,
                                        right_indices,
                                        right_position + 1)
                                if child_relation ==
                                   PAYLOAD_PATH_RELATION_SAME {
                                    PAYLOAD_PATH_RELATION_SAME
                                } else {
                                    PAYLOAD_PATH_RELATION_OVERLAP
                                }
                            },
                            _ => PAYLOAD_PATH_RELATION_OVERLAP
                        }
                    },
                    _ => PAYLOAD_PATH_RELATION_OVERLAP
                }
            },
            _ => PAYLOAD_PATH_RELATION_DISJOINT
        },
        Pattern::Wildcard { .. } => match right {
            Pattern::Binding { .. } | Pattern::Wildcard { .. } |
            Pattern::OrPattern { .. } => PAYLOAD_PATH_RELATION_OVERLAP,
            _ => PAYLOAD_PATH_RELATION_DISJOINT
        },
        Pattern::Literal { .. } => match right {
            Pattern::Binding { .. } | Pattern::Literal { .. } |
            Pattern::OrPattern { .. } => PAYLOAD_PATH_RELATION_OVERLAP,
            _ => PAYLOAD_PATH_RELATION_DISJOINT
        },
        Pattern::OrPattern { .. } => PAYLOAD_PATH_RELATION_OVERLAP
    }
}

fn pattern_payload_path_relation_from_nodes(
    left: Pattern, right: Pattern,
    left_indices: List<Int>, left_position: Int,
    right_indices: List<Int>, right_position: Int
) -> Int {
    match left {
        Pattern::OrPattern { patterns, .. } => {
            let index = left_indices.get(left_position).unwrap_or(-1)
            match patterns.get(index) {
                some(alternative) => {
                    let alternative_for_relation = alternative
                    pattern_payload_path_relation_from_nodes(
                        alternative_for_relation, right,
                        left_indices, left_position + 1,
                        right_indices, right_position)
                },
                none => PAYLOAD_PATH_RELATION_OVERLAP
            }
        },
        left_non_or => match right {
            Pattern::OrPattern { patterns, .. } => {
                let index = right_indices.get(right_position).unwrap_or(-1)
                match patterns.get(index) {
                    some(alternative) => {
                        let alternative_for_relation = alternative
                        pattern_payload_path_relation_from_nodes(
                            left_non_or, alternative_for_relation,
                            left_indices, left_position,
                            right_indices, right_position + 1)
                    },
                    none => PAYLOAD_PATH_RELATION_OVERLAP
                }
            },
            right_non_or => pattern_payload_path_relation_from_non_or_nodes(
                left_non_or, right_non_or,
                left_indices, left_position,
                right_indices, right_position)
        }
    }
}

fn pattern_payload_path_relation(
    root: Pattern, left: PatternPayloadPath, right: PatternPayloadPath
) -> Int {
    match root {
        Pattern::OrPattern { patterns, .. } => {
            match (patterns.get(left.alternative_index),
                   patterns.get(right.alternative_index)) {
                (some(left_alternative), some(right_alternative)) => {
                    let relation_left_alternative = left_alternative
                    let relation_right_alternative = right_alternative
                    pattern_payload_path_relation_from_nodes(
                        relation_left_alternative,
                        relation_right_alternative,
                        left.indices, 0, right.indices, 0)
                },
                _ => PAYLOAD_PATH_RELATION_OVERLAP
            }
        },
        _ => PAYLOAD_PATH_RELATION_OVERLAP
    }
}

fn normalize_pattern_payload_plan(
    root: Pattern, mut plan: PatternPayloadPlan
) -> PatternPayloadPlan {
    let mut normalized: List<PatternPayloadPath> = []
    while plan.paths.len() > 0 {
        match plan.paths.shift() {
            some(candidate) => {
                let mut keep = true
                let mut index = 0
                while index < normalized.len() {
                    match normalized.get(index) {
                        some(existing) => {
                            let relation = pattern_payload_path_relation(
                                root, existing, candidate)
                            if relation == PAYLOAD_PATH_RELATION_SAME {
                                keep = false
                                break
                            }
                            if relation == PAYLOAD_PATH_RELATION_OVERLAP {
                                plan.missing_binding = true
                                keep = false
                                break
                            }
                        },
                        none => {}
                    }
                    index = index + 1
                }
                if keep {
                    let normalized_path = candidate
                    normalized.push(normalized_path)
                }
            },
            none => {}
        }
    }
    plan.paths = normalized
    plan
}

fn match_pattern_payload_path_from_node(
    pattern: Pattern, indices: List<Int>, walk_position: Int,
    target_position: Int, producer_kind: Int,
    producer_name: Str, producer_ctor: Str, producer_arity: Int
) -> (Int, Int, Int) {
    if walk_position < target_position {
        match indices.get(walk_position) {
            some(index) => match pattern {
                Pattern::OrPattern { patterns, .. } =>
                    match patterns.get(index) {
                        some(child) => return
                            match_pattern_payload_path_from_node(
                                child, indices, walk_position + 1,
                                target_position, producer_kind,
                                producer_name, producer_ctor,
                                producer_arity),
                        none => return (PAYLOAD_PATH_OPAQUE,
                            target_position, -1)
                    },
                Pattern::TuplePattern { elements, .. } =>
                    match elements.get(index) {
                        some(child) => return
                            match_pattern_payload_path_from_node(
                                child, indices, walk_position + 1,
                                target_position, producer_kind,
                                producer_name, producer_ctor,
                                producer_arity),
                        none => return (PAYLOAD_PATH_OPAQUE,
                            target_position, -1)
                    },
                Pattern::Constructor { fields, .. } =>
                    match fields.get(index) {
                        some(child) => return
                            match_pattern_payload_path_from_node(
                                child, indices, walk_position + 1,
                                target_position, producer_kind,
                                producer_name, producer_ctor,
                                producer_arity),
                        none => return (PAYLOAD_PATH_OPAQUE,
                            target_position, -1)
                    },
                Pattern::NamedConstructor { fields, .. } =>
                    match fields.get(index) {
                        some(child) => return
                            match_pattern_payload_path_from_node(
                                child.pattern, indices,
                                walk_position + 1, target_position,
                                producer_kind, producer_name,
                                producer_ctor, producer_arity),
                        none => return (PAYLOAD_PATH_OPAQUE,
                            target_position, -1)
                    },
                _ => return (PAYLOAD_PATH_OPAQUE, target_position, -1)
            },
            none => return (PAYLOAD_PATH_OPAQUE, target_position, -1)
        }
    }

    match pattern {
        Pattern::OrPattern { patterns, .. } => {
            match indices.get(walk_position) {
                some(index) => match patterns.get(index) {
                    some(child) =>
                        match_pattern_payload_path_from_node(
                            child, indices, walk_position + 1,
                            target_position + 1, producer_kind,
                            producer_name, producer_ctor, producer_arity),
                    none => (PAYLOAD_PATH_OPAQUE, target_position, -1)
                },
                none => (PAYLOAD_PATH_OPAQUE, target_position, -1)
            }
        },
        Pattern::Binding { .. } => {
            if walk_position == indices.len() {
                (PAYLOAD_PATH_WHOLE, walk_position, -1)
            } else {
                (PAYLOAD_PATH_OPAQUE, walk_position, -1)
            }
        },
        Pattern::TuplePattern { elements, .. } => {
            let classification = classify_pattern_payload_constructor(
                PAYLOAD_PATTERN_TUPLE, "", none, elements.len(),
                producer_kind, producer_name, producer_ctor,
                producer_arity)
            if classification != PAYLOAD_EXACT {
                return (if classification == PAYLOAD_NO_MATCH {
                    PAYLOAD_PATH_NO_MATCH
                } else {
                    PAYLOAD_PATH_OPAQUE
                }, walk_position, -1)
            }
            match indices.get(walk_position) {
                some(index) => if elements.get(index).is_some() {
                    (PAYLOAD_PATH_CHILD, walk_position + 1, index)
                } else {
                    (PAYLOAD_PATH_OPAQUE, walk_position, -1)
                },
                none => (PAYLOAD_PATH_OPAQUE, walk_position, -1)
            }
        },
        Pattern::Constructor { name, qualifier, fields, .. } => {
            let classification = classify_pattern_payload_constructor(
                PAYLOAD_PATTERN_POSITIONAL, name, qualifier, fields.len(),
                producer_kind, producer_name, producer_ctor,
                producer_arity)
            if classification != PAYLOAD_EXACT {
                return (if classification == PAYLOAD_NO_MATCH {
                    PAYLOAD_PATH_NO_MATCH
                } else {
                    PAYLOAD_PATH_OPAQUE
                }, walk_position, -1)
            }
            match indices.get(walk_position) {
                some(index) => if fields.get(index).is_some() {
                    (PAYLOAD_PATH_CHILD, walk_position + 1, index)
                } else {
                    (PAYLOAD_PATH_OPAQUE, walk_position, -1)
                },
                none => (PAYLOAD_PATH_OPAQUE, walk_position, -1)
            }
        },
        Pattern::NamedConstructor {
            name, qualifier, fields, ..
        } => {
            let classification = classify_pattern_payload_constructor(
                PAYLOAD_PATTERN_NAMED, name, qualifier, fields.len(),
                producer_kind, producer_name, producer_ctor,
                producer_arity)
            if classification != PAYLOAD_EXACT {
                return (if classification == PAYLOAD_NO_MATCH {
                    PAYLOAD_PATH_NO_MATCH
                } else {
                    PAYLOAD_PATH_OPAQUE
                }, walk_position, -1)
            }
            match indices.get(walk_position) {
                some(index) => if fields.get(index).is_some() {
                    (PAYLOAD_PATH_CHILD, walk_position + 1, index)
                } else {
                    (PAYLOAD_PATH_OPAQUE, walk_position, -1)
                },
                none => (PAYLOAD_PATH_OPAQUE, walk_position, -1)
            }
        },
        Pattern::Wildcard { .. } | Pattern::Literal { .. } =>
            (PAYLOAD_PATH_OPAQUE, walk_position, -1)
    }
}

fn match_pattern_payload_path(
    root: Pattern, path: PatternPayloadPath, path_position: Int,
    producer_kind: Int, producer_name: Str, producer_ctor: Str,
    producer_arity: Int
) -> (Int, Int, Int) {
    match root {
        Pattern::OrPattern { patterns, .. } =>
            match patterns.get(path.alternative_index) {
                some(alternative) => match_pattern_payload_path_from_node(
                    alternative, path.indices, 0, path_position,
                    producer_kind, producer_name, producer_ctor,
                    producer_arity),
                none => (PAYLOAD_PATH_OPAQUE, path_position, -1)
            },
        _ => (PAYLOAD_PATH_OPAQUE, path_position, -1)
    }
}

fn pattern_payload_named_field_matches_from_node(
    pattern: Pattern, indices: List<Int>, walk_position: Int,
    target_position: Int, pattern_field_index: Int,
    field_name: Str
) -> Bool {
    if walk_position < target_position {
        match indices.get(walk_position) {
            some(index) => match pattern {
                Pattern::OrPattern { patterns, .. } =>
                    match patterns.get(index) {
                        some(child) => return
                            pattern_payload_named_field_matches_from_node(
                                child, indices, walk_position + 1,
                                target_position, pattern_field_index,
                                field_name),
                        none => return false
                    },
                Pattern::TuplePattern { elements, .. } =>
                    match elements.get(index) {
                        some(child) => return
                            pattern_payload_named_field_matches_from_node(
                                child, indices, walk_position + 1,
                                target_position, pattern_field_index,
                                field_name),
                        none => return false
                    },
                Pattern::Constructor { fields, .. } =>
                    match fields.get(index) {
                        some(child) => return
                            pattern_payload_named_field_matches_from_node(
                                child, indices, walk_position + 1,
                                target_position, pattern_field_index,
                                field_name),
                        none => return false
                    },
                Pattern::NamedConstructor { fields, .. } =>
                    match fields.get(index) {
                        some(child) => return
                            pattern_payload_named_field_matches_from_node(
                                child.pattern, indices, walk_position + 1,
                                target_position, pattern_field_index,
                                field_name),
                        none => return false
                    },
                _ => return false
            },
            none => return false
        }
    }
    match pattern {
        Pattern::OrPattern { patterns, .. } =>
            match indices.get(walk_position) {
                some(index) => match patterns.get(index) {
                    some(child) =>
                        pattern_payload_named_field_matches_from_node(
                            child, indices, walk_position + 1,
                            target_position + 1, pattern_field_index,
                            field_name),
                    none => false
                },
                none => false
            },
        Pattern::NamedConstructor { fields, .. } =>
            match fields.get(pattern_field_index) {
                some(field) => field.name == field_name,
                none => false
            },
        _ => false
    }
}

fn pattern_payload_named_field_matches(
    root: Pattern, path: PatternPayloadPath, path_position: Int,
    pattern_field_index: Int, field_name: Str
) -> Bool {
    match root {
        Pattern::OrPattern { patterns, .. } =>
            match patterns.get(path.alternative_index) {
                some(alternative) =>
                    pattern_payload_named_field_matches_from_node(
                        alternative, path.indices, 0, path_position,
                        pattern_field_index, field_name),
                none => false
            },
        _ => false
    }
}

fn compare_projected_pattern_payloads(
    left: ProjectedPatternPayload, right: ProjectedPatternPayload
) -> Int {
    if left.alternative_index < right.alternative_index { return -1 }
    if left.alternative_index > right.alternative_index { return 1 }
    if left.source_ordinal < right.source_ordinal { return -1 }
    if left.source_ordinal > right.source_ordinal { return 1 }
    if left.ordinal < right.ordinal { return -1 }
    if left.ordinal > right.ordinal { return 1 }
    if left.emission_ordinal < right.emission_ordinal { return -1 }
    if left.emission_ordinal > right.emission_ordinal { return 1 }
    0
}

fn apply_or_payload_paths_from_def_id(
    table: CallableSolveTable, root: Pattern, plan: PatternPayloadPlan,
    active: List<(Int, Int)>, def_id: Int, visited: List<Int>, fuel: Int,
    projection_source_ordinal: Int,
    mut source_state: PatternPayloadSourceState,
    mut projected: List<ProjectedPatternPayload>
) -> Int {
    if list_has_def_id(visited, def_id) { return PAYLOAD_OPAQUE }
    let mut status = if table.opaque_value_origins.contains_key(def_id) {
        PAYLOAD_OPAQUE
    } else {
        PAYLOAD_NO_MATCH
    }
    match table.value_origins.get(def_id) {
        some(origins) => {
            let next_visited = visited.concat([def_id])
            for origin in origins {
                let projected_origin = origin
                status = merge_payload_status(status,
                    apply_or_payload_paths(
                        table, root, plan, active, projected_origin,
                        next_visited, fuel - 1, projection_source_ordinal,
                        source_state, projected))
            }
            if origins.len() == 0 { status = PAYLOAD_OPAQUE }
        },
        none => { status = PAYLOAD_OPAQUE }
    }
    status
}

fn apply_or_indexed_payload_paths(
    table: CallableSolveTable, root: Pattern, plan: PatternPayloadPlan,
    active: List<(Int, Int)>, values: List<HExpr>,
    producer_kind: Int, producer_name: Str, producer_ctor: Str,
    visited: List<Int>, fuel: Int, projection_source_ordinal: Int,
    mut source_state: PatternPayloadSourceState,
    mut projected: List<ProjectedPatternPayload>
) -> Int {
    let mut status = PAYLOAD_NO_MATCH
    let producer_arity = values.len()
    for active_path in active {
        let (path_index, path_position) = active_path
        match plan.paths.get(path_index) {
            some(path) => {
                let (path_status, _, _) = match_pattern_payload_path(
                    root, path, path_position, producer_kind,
                    producer_name, producer_ctor, producer_arity)
                if path_status == PAYLOAD_PATH_OPAQUE {
                    status = PAYLOAD_OPAQUE
                }
            },
            none => { status = PAYLOAD_OPAQUE }
        }
    }

    let mut value_index = 0
    for value in values {
        let mut selected_path_index = -1
        let mut selected_next_position = -1
        let mut conflict = false
        for active_path in active {
            let (path_index, path_position) = active_path
            match plan.paths.get(path_index) {
                some(path) => {
                    let (path_status, next_position, child_index) =
                        match_pattern_payload_path(
                            root, path, path_position, producer_kind,
                            producer_name, producer_ctor, producer_arity)
                    if path_status == PAYLOAD_PATH_CHILD &&
                       child_index == value_index {
                        if selected_path_index >= 0 {
                            conflict = true
                        } else {
                            selected_path_index = path_index
                            selected_next_position = next_position
                        }
                    }
                },
                none => { conflict = true }
            }
        }
        if conflict {
            status = PAYLOAD_OPAQUE
        } else if selected_path_index >= 0 {
            let child_active = [(
                selected_path_index, selected_next_position)]
            let projected_value = value
            status = merge_payload_status(status,
                apply_or_payload_paths(
                    table, root, plan, child_active, projected_value,
                    visited, fuel - 1, projection_source_ordinal,
                    source_state, projected))
        }
        value_index = value_index + 1
    }
    status
}

fn apply_or_named_payload_paths(
    table: CallableSolveTable, root: Pattern, plan: PatternPayloadPlan,
    active: List<(Int, Int)>, fields: List<HStructFieldInit>, spread: HExpr?,
    producer_kind: Int, producer_name: Str, producer_ctor: Str,
    visited: List<Int>, fuel: Int, projection_source_ordinal: Int,
    mut source_state: PatternPayloadSourceState,
    mut projected: List<ProjectedPatternPayload>
) -> Int {
    let mut status = PAYLOAD_NO_MATCH
    let mut matched_paths: Set<Int> = set_new()
    for active_path in active {
        let (path_index, path_position) = active_path
        match plan.paths.get(path_index) {
            some(path) => {
                let (path_status, _, _) = match_pattern_payload_path(
                    root, path, path_position, producer_kind,
                    producer_name, producer_ctor, fields.len())
                if path_status == PAYLOAD_PATH_OPAQUE {
                    status = PAYLOAD_OPAQUE
                }
            },
            none => { status = PAYLOAD_OPAQUE }
        }
    }

    for field in fields {
        let mut selected_path_index = -1
        let mut selected_next_position = -1
        let mut conflict = false
        for active_path in active {
            let (path_index, path_position) = active_path
            if !matched_paths.contains(path_index) {
                match plan.paths.get(path_index) {
                    some(path) => {
                        let (path_status, next_position,
                             pattern_field_index) =
                            match_pattern_payload_path(
                                root, path, path_position, producer_kind,
                                producer_name, producer_ctor, fields.len())
                        if path_status == PAYLOAD_PATH_CHILD &&
                           pattern_payload_named_field_matches(
                               root, path, path_position,
                               pattern_field_index, field.name) {
                            if selected_path_index >= 0 {
                                conflict = true
                            } else {
                                selected_path_index = path_index
                                selected_next_position = next_position
                            }
                        }
                    },
                    none => { conflict = true }
                }
            }
        }
        if conflict {
            status = PAYLOAD_OPAQUE
        } else if selected_path_index >= 0 {
            let matched_path_id = selected_path_index
            matched_paths.insert(matched_path_id)
            let child_active = [(
                selected_path_index, selected_next_position)]
            let projected_value = field.value
            status = merge_payload_status(status,
                apply_or_payload_paths(
                    table, root, plan, child_active, projected_value,
                    visited, fuel - 1, projection_source_ordinal,
                    source_state, projected))
        }
    }

    let mut missing_path_index = -1
    let mut missing_path_position = -1
    let mut missing_count = 0
    for active_path in active {
        let (path_index, path_position) = active_path
        if !matched_paths.contains(path_index) {
            match plan.paths.get(path_index) {
                some(path) => {
                    let (path_status, _, _) = match_pattern_payload_path(
                        root, path, path_position, producer_kind,
                        producer_name, producer_ctor, fields.len())
                    if path_status == PAYLOAD_PATH_CHILD {
                        missing_count = missing_count + 1
                        if missing_count == 1 {
                            missing_path_index = path_index
                            missing_path_position = path_position
                        }
                    }
                },
                none => { status = PAYLOAD_OPAQUE }
            }
        }
    }
    if missing_count > 1 {
        status = PAYLOAD_OPAQUE
    } else if missing_count == 1 {
        match spread {
            some(base) => {
                let spread_active = [(
                    missing_path_index, missing_path_position)]
                let spread_value = base
                status = merge_payload_status(status,
                    apply_or_payload_paths(
                        table, root, plan, spread_active, spread_value,
                        visited, fuel - 1, projection_source_ordinal,
                        source_state, projected))
            },
            none => { status = PAYLOAD_OPAQUE }
        }
    }
    status
}

fn apply_or_payload_paths(
    table: CallableSolveTable, root: Pattern, plan: PatternPayloadPlan,
    active: List<(Int, Int)>, value: HExpr,
    visited: List<Int>, fuel: Int, projection_source_ordinal: Int,
    mut source_state: PatternPayloadSourceState,
    mut projected: List<ProjectedPatternPayload>
) -> Int {
    if !expr_has_reachable_value(value) { return PAYLOAD_NO_MATCH }
    if fuel <= 0 { return PAYLOAD_OPAQUE }

    // Once a path reaches its binding, the current value is the exact payload.
    // Project it before expanding aliases: named callable Idents intentionally
    // have no value-origin entry, but their DefId is the ownership authority.
    let mut whole_path_index = -1
    for active_path in active {
        let (path_index, path_position) = active_path
        match plan.paths.get(path_index) {
            some(path) => {
                let (path_status, _, _) = match_pattern_payload_path(
                    root, path, path_position,
                    PAYLOAD_PRODUCER_UNKNOWN, "", "", 0)
                if path_status == PAYLOAD_PATH_WHOLE {
                    if whole_path_index >= 0 { return PAYLOAD_OPAQUE }
                    whole_path_index = path_index
                }
            },
            none => return PAYLOAD_OPAQUE
        }
    }
    if whole_path_index >= 0 {
        let whole_source_ordinal = if projection_source_ordinal >= 0 {
            projection_source_ordinal
        } else {
            let next_ordinal = source_state.next_ordinal
            source_state.next_ordinal = source_state.next_ordinal + 1
            next_ordinal
        }
        match plan.paths.get(whole_path_index) {
            some(path) => {
                let emission_ordinal = source_state.next_emission_ordinal
                source_state.next_emission_ordinal =
                    source_state.next_emission_ordinal + 1
                let projected_value = value
                projected.push(ProjectedPatternPayload {
                    alternative_index: path.alternative_index,
                    source_ordinal: whole_source_ordinal,
                    ordinal: path.ordinal,
                    emission_ordinal: emission_ordinal,
                    value: projected_value
                })
                return PAYLOAD_EXACT
            },
            none => return PAYLOAD_OPAQUE
        }
    }

    // Resolve aliases and reachable value producers before applying any
    // alternative projection.  The Pattern plan is Borrow-only and may be
    // shared across these source edges; every HExpr edge is owned exactly once.
    match value {
        HExpr::Ident { def_id: some(def_id), .. } =>
            return apply_or_payload_paths_from_def_id(
                table, root, plan, active, def_id, visited, fuel,
                projection_source_ordinal, source_state, projected),
        HExpr::Take { source_def_id, .. } =>
            return apply_or_payload_paths_from_def_id(
                table, root, plan, active, source_def_id, visited, fuel,
                projection_source_ordinal, source_state, projected),
        HExpr::Ident { def_id: none, .. } => return PAYLOAD_OPAQUE,
        HExpr::Clone { inner, .. } => {
            let projected_inner = inner
            return apply_or_payload_paths(
                table, root, plan, active, projected_inner,
                visited, fuel - 1, projection_source_ordinal,
                source_state, projected)
        },
        HExpr::UnsafeBlock { body, .. } => {
            let projected_body = body
            return apply_or_payload_paths(
                table, root, plan, active, projected_body,
                visited, fuel - 1, projection_source_ordinal,
                source_state, projected)
        },
        HExpr::Block { stmts, tail, .. } => {
            for stmt in stmts {
                if !stmt_reaches_next(stmt) { return PAYLOAD_OPAQUE }
            }
            match tail {
                some(result) => {
                    let projected_result = result
                    return apply_or_payload_paths(
                        table, root, plan, active, projected_result,
                        visited, fuel - 1, projection_source_ordinal,
                        source_state, projected)
                },
                none => return PAYLOAD_OPAQUE
            }
        },
        HExpr::IfExpr { condition, then_branch, else_branch, .. } => {
            let has_else = match else_branch {
                some(_) => true,
                none => false
            }
            let children = enumerate_reachable_if_children(
                condition, has_else)
            let mut then_is_child = false
            let mut else_is_child = false
            for inferred_child in children {
                let child: ReachableControlChild = inferred_child
                if child.kind == REACHABLE_CHILD_IF_CONDITION {
                } else if child.kind == REACHABLE_CHILD_IF_THEN {
                    then_is_child = true
                } else if child.kind == REACHABLE_CHILD_IF_ELSE {
                    else_is_child = true
                } else {
                    panic(
                        "unreachable: invalid If reachable-child kind")
                }
            }
            let mut status = if has_else {
                PAYLOAD_NO_MATCH
            } else {
                PAYLOAD_OPAQUE
            }
            if then_is_child {
                let projected_then = then_branch
                status = merge_payload_status(status,
                    apply_or_payload_paths(
                        table, root, plan, active, projected_then,
                        visited, fuel - 1, projection_source_ordinal,
                        source_state, projected))
            }
            if else_is_child {
                match else_branch {
                    some(branch) => {
                        let projected_else = branch
                        status = merge_payload_status(status,
                            apply_or_payload_paths(
                                table, root, plan, active, projected_else,
                                visited, fuel - 1,
                                projection_source_ordinal,
                                source_state, projected))
                    },
                    none => panic(
                        "unreachable: reachable else child has no branch")
                }
            }
            return status
        },
        HExpr::MatchExpr { scrutinee, arms, .. } => {
            let children = enumerate_reachable_match_children(
                scrutinee, arms)
            let mut reachable_bodies: Set<Int> = set_new()
            for inferred_child in children {
                let child: ReachableControlChild = inferred_child
                if child.kind == REACHABLE_CHILD_MATCH_SCRUTINEE ||
                        child.kind == REACHABLE_CHILD_ARM_GUARD {
                } else if child.kind == REACHABLE_CHILD_ARM_BODY {
                    reachable_bodies.insert(child.arm_index)
                } else {
                    panic(
                        "unreachable: invalid Match reachable-child kind")
                }
            }
            let mut status = if arms.len() == 0 {
                PAYLOAD_OPAQUE
            } else {
                PAYLOAD_NO_MATCH
            }
            let mut arm_index = 0
            for arm in arms {
                if reachable_bodies.contains(arm_index) {
                    let projected_arm_body = arm.body
                    status = merge_payload_status(status,
                        apply_or_payload_paths(
                            table, root, plan, active, projected_arm_body,
                            visited, fuel - 1, projection_source_ordinal,
                            source_state, projected))
                }
                arm_index = arm_index + 1
            }
            return status
        },
        HExpr::TryCatch { body, arms, .. } => {
            let projected_try_body = body
            let mut status = apply_or_payload_paths(
                table, root, plan, active, projected_try_body,
                visited, fuel - 1, projection_source_ordinal,
                source_state, projected)
            for inferred_child in enumerate_reachable_arm_children(arms) {
                let child: ReachableControlChild = inferred_child
                if child.kind == REACHABLE_CHILD_ARM_BODY {
                    let arm: HMatchArm = match arms.get(child.arm_index) {
                        some(value) => value,
                        none => panic(
                            "unreachable: payload Catch body has no arm")
                    }
                    let projected_arm_body = arm.body
                    status = merge_payload_status(status,
                        apply_or_payload_paths(
                            table, root, plan, active, projected_arm_body,
                            visited, fuel - 1, projection_source_ordinal,
                            source_state, projected))
                }
            }
            return status
        },
        HExpr::HandleExpr { body, handlers, .. } => {
            let projected_handle_body = body
            let mut status = apply_or_payload_paths(
                table, root, plan, active, projected_handle_body,
                visited, fuel - 1, projection_source_ordinal,
                source_state, projected)
            for handler in handlers {
                if handler.is_abortive {
                    let projected_handler_body = handler.body
                    status = merge_payload_status(status,
                        apply_or_payload_paths(
                            table, root, plan, active,
                            projected_handler_body, visited, fuel - 1,
                            projection_source_ordinal,
                            source_state, projected))
                }
            }
            return status
        },
        _ => {}
    }

    let current_source_ordinal = if projection_source_ordinal >= 0 {
        projection_source_ordinal
    } else {
        let next_ordinal = source_state.next_ordinal
        source_state.next_ordinal = source_state.next_ordinal + 1
        next_ordinal
    }

    match value {
        HExpr::TupleLit { elements, .. } =>
            apply_or_indexed_payload_paths(
                table, root, plan, active, elements,
                PAYLOAD_PRODUCER_TUPLE, "", "", visited, fuel,
                current_source_ordinal, source_state, projected),
        HExpr::Call { callee, args, ty, .. } => {
            match callee {
                HExpr::Ident { resolved_name: some(resolved), .. } =>
                    match enum_name_from_type(ty) {
                        some(enum_name) => {
                            let producer_enum = enum_name
                            let producer_ctor = resolved
                            apply_or_indexed_payload_paths(
                                table, root, plan, active, args,
                                PAYLOAD_PRODUCER_POSITIONAL,
                                producer_enum, producer_ctor,
                                visited, fuel, current_source_ordinal,
                                source_state, projected)
                        },
                        none => apply_or_indexed_payload_paths(
                            table, root, plan, active, args,
                            PAYLOAD_PRODUCER_UNKNOWN, "", "",
                            visited, fuel, current_source_ordinal,
                            source_state, projected)
                    },
                _ => apply_or_indexed_payload_paths(
                    table, root, plan, active, args,
                    PAYLOAD_PRODUCER_UNKNOWN, "", "",
                    visited, fuel, current_source_ordinal,
                    source_state, projected)
            }
        },
        HExpr::NamedVariantConstruct {
            enum_name, variant_name, fields, spread, ..
        } => {
            let producer_enum = enum_name
            let producer_variant = variant_name
            apply_or_named_payload_paths(
                table, root, plan, active, fields, spread,
                PAYLOAD_PRODUCER_NAMED_VARIANT,
                producer_enum, producer_variant,
                visited, fuel, current_source_ordinal,
                source_state, projected)
        },
        HExpr::StructLit { name, fields, spread, .. } => {
            let producer_struct = name
            apply_or_named_payload_paths(
                table, root, plan, active, fields, spread,
                PAYLOAD_PRODUCER_NAMED_STRUCT,
                producer_struct, "", visited, fuel,
                current_source_ordinal, source_state, projected)
        },
        _ => PAYLOAD_OPAQUE
    }
}

fn apply_or_payload_plan(
    table: CallableSolveTable, root: Pattern, plan: PatternPayloadPlan,
    value: HExpr, visited: List<Int>, fuel: Int,
    mut source_state: PatternPayloadSourceState,
    mut projected: List<ProjectedPatternPayload>
) -> Int {
    let mut active: List<(Int, Int)> = []
    let mut path_index = 0
    while path_index < plan.paths.len() {
        active.push((path_index, 0))
        path_index = path_index + 1
    }
    let mut status = if active.len() == 0 {
        PAYLOAD_OPAQUE
    } else {
        apply_or_payload_paths(
            table, root, plan, active, value, visited, fuel,
            -1, source_state, projected)
    }
    if plan.missing_binding { status = PAYLOAD_OPAQUE }
    status
}

fn pattern_binds_name(pattern: Pattern, target: Str) -> Bool {
    match pattern {
        Pattern::Binding { name, .. } => name == target,
        Pattern::Constructor { fields, .. } => fields.any(fn(field) {
            pattern_binds_name(field, target)
        }),
        Pattern::NamedConstructor { fields, .. } => fields.any(fn(field) {
            pattern_binds_name(field.pattern, target)
        }),
        Pattern::TuplePattern { elements, .. } => elements.any(fn(element) {
            pattern_binds_name(element, target)
        }),
        Pattern::OrPattern { patterns, .. } => patterns.any(fn(alternative) {
            pattern_binds_name(alternative, target)
        }),
        Pattern::Wildcard { .. } | Pattern::Literal { .. } => false
    }
}

fn enum_name_from_type(ty: Type) -> Str? {
    match ty {
        Type::EnumType { name, .. } => {
            let result_name = name
            some(result_name)
        },
        Type::GenericType { base, .. } => match base {
            Type::EnumType { name, .. } => {
                let result_name = name
                some(result_name)
            },
            _ => none
        },
        _ => none
    }
}

fn field_init_value(fields: List<HStructFieldInit>, name: Str) -> HExpr? {
    for field in fields {
        if field.name == name { return some(field.value) }
    }
    none
}

fn collect_pattern_payloads_from_def_id(
    table: CallableSolveTable, pattern: Pattern, target: Str,
    def_id: Int, visited: List<Int>, fuel: Int, mut out: List<HExpr>
) -> Int {
    if list_has_def_id(visited, def_id) {
        return PAYLOAD_OPAQUE
    }
    let mut status = if table.opaque_value_origins.contains_key(def_id) {
        PAYLOAD_OPAQUE
    } else {
        PAYLOAD_NO_MATCH
    }
    match table.value_origins.get(def_id) {
        some(origins) => {
            let next_visited = visited.concat([def_id])
            for origin in origins {
                let origin_for_collect = origin
                status = merge_payload_status(status,
                    collect_pattern_payloads(table, pattern, target,
                        origin_for_collect, next_visited, fuel - 1, out))
            }
            if origins.len() == 0 { status = PAYLOAD_OPAQUE }
        },
        none => { status = PAYLOAD_OPAQUE }
    }
    status
}

// Structurally project every possible value corresponding to one exact pattern
// binder.  NO_MATCH means a known constructor cannot enter this arm; OPAQUE
// means some feasible producer lacks enough DefId-backed structure.  Aliases
// are expanded only through the value-origin table, never through FnType text.
fn collect_pattern_payloads(
    table: CallableSolveTable, pattern: Pattern, target: Str,
    value: HExpr, visited: List<Int>, fuel: Int, mut out: List<HExpr>
) -> Int {
    if !expr_has_reachable_value(value) { return PAYLOAD_NO_MATCH }
    if fuel <= 0 { return PAYLOAD_OPAQUE }
    if pattern_binds_name(pattern, target) == false {
        return PAYLOAD_NO_MATCH
    }

    match pattern {
        Pattern::Binding { name, .. } => {
            if name == target {
                out.push(value)
                return PAYLOAD_EXACT
            }
        },
        Pattern::OrPattern { patterns, span } => {
            let root_patterns = patterns
            let root_span = span
            let root = Pattern::OrPattern {
                patterns: root_patterns, span: root_span
            }
            let plan = build_or_pattern_payload_plan(root, target, fuel)
            let mut source_state = PatternPayloadSourceState {
                next_ordinal: 0, next_emission_ordinal: 0
            }
            let mut projected: List<ProjectedPatternPayload> = []
            let status = apply_or_payload_plan(
                table, root, plan, value, visited, fuel,
                source_state, projected)
            projected.sort_by(compare_projected_pattern_payloads)
            for payload in projected {
                let projected_value = payload.value
                out.push(projected_value)
            }
            return status
        },
        _ => {}
    }

    // Expand transparent/control-flow producers before pairing pattern shape.
    match value {
        HExpr::Ident { def_id: some(def_id), .. } =>
            return collect_pattern_payloads_from_def_id(
                table, pattern, target, def_id, visited, fuel, out),
        HExpr::Take { source_def_id: def_id, .. } =>
            return collect_pattern_payloads_from_def_id(
                table, pattern, target, def_id, visited, fuel, out),
        HExpr::Ident { def_id: none, .. } => return PAYLOAD_OPAQUE,
        HExpr::Clone { inner, .. } => {
            let inner_for_collect = inner
            return collect_pattern_payloads(
                table, pattern, target, inner_for_collect,
                visited, fuel - 1, out)
        },
        HExpr::UnsafeBlock { body, .. } => {
            let body_for_collect = body
            return collect_pattern_payloads(
                table, pattern, target, body_for_collect,
                visited, fuel - 1, out)
        },
        HExpr::Block { stmts, tail, .. } => {
            for stmt in stmts {
                if !stmt_reaches_next(stmt) { return PAYLOAD_OPAQUE }
            }
            match tail {
                some(result) => {
                    let result_for_collect = result
                    return collect_pattern_payloads(
                        table, pattern, target, result_for_collect,
                        visited, fuel - 1, out)
                },
                none => return PAYLOAD_OPAQUE
            }
        },
        HExpr::IfExpr { condition, then_branch, else_branch, .. } => {
            let has_else = match else_branch {
                some(_) => true,
                none => false
            }
            let children = enumerate_reachable_if_children(
                condition, has_else)
            let mut then_is_child = false
            let mut else_is_child = false
            for inferred_child in children {
                let child: ReachableControlChild = inferred_child
                if child.kind == REACHABLE_CHILD_IF_CONDITION {
                } else if child.kind == REACHABLE_CHILD_IF_THEN {
                    then_is_child = true
                } else if child.kind == REACHABLE_CHILD_IF_ELSE {
                    else_is_child = true
                } else {
                    panic(
                        "unreachable: invalid If reachable-child kind")
                }
            }
            let mut status = if has_else {
                PAYLOAD_NO_MATCH
            } else {
                PAYLOAD_OPAQUE
            }
            if then_is_child {
                let then_branch_for_collect = then_branch
                status = merge_payload_status(status,
                    collect_pattern_payloads(
                        table, pattern, target, then_branch_for_collect,
                        visited, fuel - 1, out))
            }
            if else_is_child {
                match else_branch {
                    some(branch) => {
                        let branch_for_collect = branch
                        status = merge_payload_status(status,
                            collect_pattern_payloads(
                                table, pattern, target,
                                branch_for_collect, visited, fuel - 1, out))
                    },
                    none => panic(
                        "unreachable: reachable else child has no branch")
                }
            }
            return status
        },
        HExpr::MatchExpr { scrutinee, arms, .. } => {
            let children = enumerate_reachable_match_children(
                scrutinee, arms)
            let mut reachable_bodies: Set<Int> = set_new()
            for inferred_child in children {
                let child: ReachableControlChild = inferred_child
                if child.kind == REACHABLE_CHILD_MATCH_SCRUTINEE ||
                        child.kind == REACHABLE_CHILD_ARM_GUARD {
                } else if child.kind == REACHABLE_CHILD_ARM_BODY {
                    reachable_bodies.insert(child.arm_index)
                } else {
                    panic(
                        "unreachable: invalid Match reachable-child kind")
                }
            }
            let mut status = if arms.len() == 0 {
                PAYLOAD_OPAQUE
            } else {
                PAYLOAD_NO_MATCH
            }
            let mut arm_index = 0
            for arm in arms {
                if reachable_bodies.contains(arm_index) {
                    let arm_body_for_collect = arm.body
                    status = merge_payload_status(status,
                        collect_pattern_payloads(
                            table, pattern, target, arm_body_for_collect,
                            visited, fuel - 1, out))
                }
                arm_index = arm_index + 1
            }
            return status
        },
        HExpr::TryCatch { body, arms, .. } => {
            let body_for_collect = body
            let mut status = collect_pattern_payloads(table, pattern, target,
                body_for_collect, visited, fuel - 1, out)
            for inferred_child in enumerate_reachable_arm_children(arms) {
                let child: ReachableControlChild = inferred_child
                if child.kind == REACHABLE_CHILD_ARM_BODY {
                    let arm: HMatchArm = match arms.get(child.arm_index) {
                        some(value) => value,
                        none => panic(
                            "unreachable: pattern-payload Catch body has no arm")
                    }
                    let arm_body_for_collect = arm.body
                    status = merge_payload_status(status,
                        collect_pattern_payloads(
                            table, pattern, target, arm_body_for_collect,
                            visited, fuel - 1, out))
                }
            }
            return status
        },
        HExpr::HandleExpr { body, handlers, .. } => {
            let body_for_collect = body
            let mut status = collect_pattern_payloads(table, pattern, target,
                body_for_collect, visited, fuel - 1, out)
            for handler in handlers {
                if handler.is_abortive {
                    let handler_body_for_collect = handler.body
                    status = merge_payload_status(status,
                        collect_pattern_payloads(table, pattern, target,
                            handler_body_for_collect, visited, fuel - 1, out))
                }
            }
            return status
        },
        _ => {}
    }

    match pattern {
        Pattern::TuplePattern { elements, .. } => match value {
            HExpr::TupleLit { elements: values, .. } => {
                let classification = classify_pattern_payload_constructor(
                    PAYLOAD_PATTERN_TUPLE, "", none, elements.len(),
                    PAYLOAD_PRODUCER_TUPLE, "", "", values.len())
                if classification != PAYLOAD_EXACT {
                    classification
                } else {
                    let mut status = PAYLOAD_NO_MATCH
                    let mut index = 0
                    while index < elements.len() {
                        match (elements.get(index), values.get(index)) {
                            (some(element_pattern), some(element_value)) => {
                                let nested_value = element_value
                                if pattern_binds_name(element_pattern, target) {
                                    status = merge_payload_status(status,
                                        collect_pattern_payloads(table,
                                            element_pattern, target,
                                            nested_value, visited,
                                            fuel - 1, out))
                                }
                            },
                            _ => {}
                        }
                        index = index + 1
                    }
                    status
                }
            },
            _ => classify_pattern_payload_constructor(
                PAYLOAD_PATTERN_TUPLE, "", none, elements.len(),
                PAYLOAD_PRODUCER_UNKNOWN, "", "", 0)
        },
        Pattern::Constructor { name, qualifier, fields, .. } => match value {
            HExpr::Call { callee, args, ty, .. } => match callee {
                HExpr::Ident { resolved_name: some(resolved), .. } =>
                    match enum_name_from_type(ty) {
                        some(enum_name) => {
                            let classification =
                                classify_pattern_payload_constructor(
                                    PAYLOAD_PATTERN_POSITIONAL, name,
                                    qualifier, fields.len(),
                                    PAYLOAD_PRODUCER_POSITIONAL, enum_name,
                                    resolved, args.len())
                            if classification != PAYLOAD_EXACT {
                                classification
                            } else {
                                let mut status = PAYLOAD_NO_MATCH
                                let mut index = 0
                                while index < fields.len() {
                                    match (fields.get(index), args.get(index)) {
                                        (some(field_pattern), some(field_value)) => {
                                            let positional_value = field_value
                                            if pattern_binds_name(
                                                    field_pattern, target) {
                                                status = merge_payload_status(
                                                    status,
                                                    collect_pattern_payloads(
                                                        table, field_pattern,
                                                        target, positional_value,
                                                        visited, fuel - 1, out))
                                            }
                                        },
                                        _ => {}
                                    }
                                    index = index + 1
                                }
                                status
                            }
                        },
                        none => classify_pattern_payload_constructor(
                            PAYLOAD_PATTERN_POSITIONAL, name, qualifier,
                            fields.len(), PAYLOAD_PRODUCER_UNKNOWN,
                            "", "", 0)
                    },
                _ => classify_pattern_payload_constructor(
                    PAYLOAD_PATTERN_POSITIONAL, name, qualifier,
                    fields.len(), PAYLOAD_PRODUCER_UNKNOWN, "", "", 0)
            },
            _ => classify_pattern_payload_constructor(
                PAYLOAD_PATTERN_POSITIONAL, name, qualifier, fields.len(),
                PAYLOAD_PRODUCER_UNKNOWN, "", "", 0)
        },
        Pattern::NamedConstructor {
            name, qualifier, fields: pattern_fields, rest, span
        } => match value {
            HExpr::NamedVariantConstruct {
                enum_name, variant_name, fields: value_fields, spread, ..
            } => {
                let classification = classify_pattern_payload_constructor(
                    PAYLOAD_PATTERN_NAMED, name, qualifier,
                    pattern_fields.len(), PAYLOAD_PRODUCER_NAMED_VARIANT,
                    enum_name, variant_name, value_fields.len())
                if classification != PAYLOAD_EXACT {
                    classification
                } else {
                    let mut status = PAYLOAD_NO_MATCH
                    for field in pattern_fields {
                        if pattern_binds_name(field.pattern, target) {
                            match field_init_value(value_fields, field.name) {
                                some(field_value) => {
                                    let named_variant_value = field_value
                                    status = merge_payload_status(status,
                                        collect_pattern_payloads(table,
                                            field.pattern, target,
                                            named_variant_value, visited,
                                            fuel - 1, out))
                                },
                                none => match spread {
                                    some(base) => {
                                        let spread_base = base
                                        let spread_pattern_name = name
                                        let spread_pattern_qualifier = qualifier
                                        let spread_pattern_fields = pattern_fields
                                        let spread_pattern_span = span
                                        status = merge_payload_status(status,
                                            collect_pattern_payloads(table,
                                                Pattern::NamedConstructor {
                                                    name: spread_pattern_name,
                                                    qualifier:
                                                        spread_pattern_qualifier,
                                                    fields: spread_pattern_fields,
                                                    rest: rest,
                                                    span: spread_pattern_span
                                                }, target, spread_base, visited,
                                                fuel - 1, out))
                                    },
                                    none => { status = PAYLOAD_OPAQUE }
                                }
                            }
                        }
                    }
                    status
                }
            },
            HExpr::StructLit { name: struct_name, fields: value_fields,
                               spread, .. } => {
                let classification = classify_pattern_payload_constructor(
                    PAYLOAD_PATTERN_NAMED, name, qualifier,
                    pattern_fields.len(), PAYLOAD_PRODUCER_NAMED_STRUCT,
                    struct_name, "", value_fields.len())
                if classification != PAYLOAD_EXACT {
                    classification
                } else {
                    let mut status = PAYLOAD_NO_MATCH
                    for field in pattern_fields {
                        if pattern_binds_name(field.pattern, target) {
                            match field_init_value(value_fields, field.name) {
                                some(field_value) => {
                                    let named_struct_value = field_value
                                    status = merge_payload_status(status,
                                        collect_pattern_payloads(table,
                                            field.pattern, target,
                                            named_struct_value, visited,
                                            fuel - 1, out))
                                },
                                none => match spread {
                                    some(base) => {
                                        let spread_base = base
                                        let spread_pattern_name = name
                                        let spread_pattern_fields = pattern_fields
                                        let spread_pattern_span = span
                                        status = merge_payload_status(status,
                                            collect_pattern_payloads(table,
                                                Pattern::NamedConstructor {
                                                    name: spread_pattern_name,
                                                    qualifier: none,
                                                    fields: spread_pattern_fields,
                                                    rest: rest,
                                                    span: spread_pattern_span
                                                }, target, spread_base, visited,
                                                fuel - 1, out))
                                    },
                                    none => { status = PAYLOAD_OPAQUE }
                                }
                            }
                        }
                    }
                    status
                }
            },
            _ => classify_pattern_payload_constructor(
                PAYLOAD_PATTERN_NAMED, name, qualifier,
                pattern_fields.len(), PAYLOAD_PRODUCER_UNKNOWN, "", "", 0)
        },
        Pattern::Binding { .. } | Pattern::OrPattern { .. } =>
            PAYLOAD_OPAQUE,
        Pattern::Wildcard { .. } | Pattern::Literal { .. } =>
            PAYLOAD_NO_MATCH
    }
}

fn register_pattern_binding_provenance(
    mut table: CallableSolveTable, pattern: Pattern,
    name: Str, target: Int?, ty: Type, source: HExpr
) {
    let contract_target = target
    let contract_type = ty
    register_callable_contract(table, contract_target, contract_type)
    let target_id = match target { some(id) => id, none => return }
    let mut payloads: List<HExpr> = []
    let mut visited: List<Int> = []
    let fuel = table.value_origins.entries().len() + 64
    let source_for_payloads = source
    let status = collect_pattern_payloads(
        table, pattern, name, source_for_payloads, visited, fuel, payloads)

    // Pattern DefIds are unique declaration sites, so replacement is stable
    // across solver rounds and cannot accumulate duplicate HIR producers.
    let origin_target_id = target_id
    let stored_payloads = payloads
    table.value_origins.insert(origin_target_id, stored_payloads)
    if status == PAYLOAD_OPAQUE {
        let opaque_origin_target_id = target_id
        table.opaque_value_origins.insert(opaque_origin_target_id, true)
    } else {
        let exact_origin_target_id = target_id
        table.opaque_value_origins.remove(exact_origin_target_id)
    }

    match ty {
        Type::FnType { params, meta, .. } => {
            let mut sources: List<Int> = []
            let mut exact = status == PAYLOAD_EXACT && payloads.len() > 0
            for payload in payloads {
                if collect_callable_identity_sources(payload, sources) == false {
                    exact = false
                }
            }
            if exact && sources.len() > 0 {
                // Unlike ordinary reassignment, one pattern binder has one
                // structural producer site. Exact payload proof is therefore
                // allowed to replace its provisional opaque recovery state.
                let exact_callable_target_id = target_id
                table.opaque_callable_slots.remove(exact_callable_target_id)
                register_callable_source_ids(table, target_id, params,
                    meta.ownership_term, sources, hexpr_span(source))
            } else {
                let opaque_callable_target_id = target_id
                table.opaque_callable_slots.insert(
                    opaque_callable_target_id, true)
            }
        },
        _ => {}
    }
}

fn register_pattern_provenance(
    mut table: CallableSolveTable, pattern: Pattern,
    bindings: List<HPatternBinding>, source: HExpr
) {
    for binding in bindings {
        register_pattern_binding_provenance(table, pattern, binding.name,
            some(binding.def_id), binding.ty, source)
    }
}

fn register_destructure_provenance(
    mut table: CallableSolveTable, pattern: Pattern,
    bindings: List<HLetDestructureBinding>, source: HExpr
) {
    for binding in bindings {
        register_pattern_binding_provenance(table, pattern, binding.name,
            binding.def_id, binding.ty, source)
    }
}

fn mark_param_move(mut state: CallableSolveState, expr: HExpr) {
    if is_nullary_variant_ctor_ident(expr) { return }
    match expr {
        HExpr::Ident { def_id: some(source_id), .. } => {
            let mut index = 0
            while index < state.param_def_ids.len() {
                match state.param_def_ids.get(index) {
                    some(some(param_id)) => if param_id == source_id {
                        state.modes.set(index, PARAM_OWNERSHIP_MOVE)
                    },
                    _ => {}
                }
                index = index + 1
            }
        },
        _ => {}
    }
}

// A tuple written directly as a Match scrutinee is a borrow-only inspection
// view, not an owning tuple construction.  Recurse through nested tuple views
// while leaving every non-tuple child to its own ordinary expression rules
// (constructor/call children still decide their argument transfers exactly).
fn solve_match_scrutinee_borrow_view(
    env: TypeEnv, mut table: CallableSolveTable,
    metadata: OwnershipMetadata, mut state: CallableSolveState,
    expr: HExpr
) {
    match expr {
        HExpr::TupleLit { elements, .. } => {
            for element in elements {
                solve_match_scrutinee_borrow_view(
                    env, table, metadata, state, element)
            }
        },
        _ => solve_expr(
            env, table, metadata, state, expr, TRANSFER_BORROW)
    }
}

fn solve_expr(
    env: TypeEnv, table: CallableSolveTable,
    metadata: OwnershipMetadata, mut state: CallableSolveState,
    expr: HExpr, transfer: Int
) {
    // AUTO is assignment aliasing: only a may-Drop value invalidates its
    // source. OWNING is return/aggregate storage: non-Copy values transfer but
    // scalars copy. FORCE is an already-declared Move callable edge, whose
    // contract invalidates even a scalar complete binding.
    if transfer_requires_binding_invalidation(
            env, metadata, transfer, hexpr_type(expr)) {
        mark_param_move(state, expr)
    }
    match expr {
        HExpr::BinOp { left, right, .. } => {
            solve_expr(env, table, metadata, state, left, TRANSFER_BORROW)
            solve_expr(env, table, metadata, state, right, TRANSFER_BORROW)
        },
        HExpr::UnaryOp { operand, .. } =>
            solve_expr(env, table, metadata, state, operand, TRANSFER_BORROW),
        HExpr::Call { callee, callee_def_id, args, .. } => {
            let is_method = match callee {
                HExpr::FieldAccess { receiver, .. } => {
                    let receiver_mode = solver_param_mode(
                        table, metadata, callee_def_id, 0)
                    if receiver_mode == PARAM_OWNERSHIP_MUT_BORROW {
                        mark_value_origin_opaque(table, receiver)
                    }
                    solve_expr(env, table, metadata, state, receiver,
                        solver_param_transfer(
                            table, metadata, callee_def_id, 0))
                    true
                },
                _ => {
                    solve_expr(env, table, metadata, state, callee,
                        TRANSFER_BORROW)
                    false
                }
            }
            let mut index = 0
            for arg in args {
                let descriptor_index = index + if is_method { 1 } else { 0 }
                let mode = solver_param_mode(
                    table, metadata, callee_def_id, descriptor_index)
                if mode == PARAM_OWNERSHIP_MUT_BORROW {
                    mark_value_origin_opaque(table, arg)
                }
                solve_expr(env, table, metadata, state, arg,
                    solver_param_transfer(
                        table, metadata, callee_def_id, descriptor_index))
                index = index + 1
            }
        },
        HExpr::FieldAccess { receiver, .. } =>
            solve_expr(env, table, metadata, state, receiver,
                TRANSFER_BORROW),
        HExpr::StructLit { fields, spread, .. } => {
            match spread {
                some(source) => {
                    let reachability_source = source
                    let solver_source = source
                    let source_reaches_value =
                        expr_has_reachable_value(reachability_source)
                    solve_expr(env, table, metadata, state,
                        solver_source, TRANSFER_BORROW)
                    if source_reaches_value {
                        for field in fields {
                            solve_expr(env, table, metadata, state,
                                field.value, TRANSFER_OWNING)
                        }
                    }
                },
                none => {
                    for field in fields {
                        solve_expr(env, table, metadata, state, field.value,
                            TRANSFER_OWNING)
                    }
                }
            }
        },
        HExpr::NamedVariantConstruct { fields, spread, .. } => {
            match spread {
                some(source) => {
                    let reachability_source = source
                    let solver_source = source
                    let source_reaches_value =
                        expr_has_reachable_value(reachability_source)
                    solve_expr(env, table, metadata, state,
                        solver_source, TRANSFER_BORROW)
                    if source_reaches_value {
                        for field in fields {
                            solve_expr(env, table, metadata, state,
                                field.value, TRANSFER_OWNING)
                        }
                    }
                },
                none => {
                    for field in fields {
                        solve_expr(env, table, metadata, state, field.value,
                            TRANSFER_OWNING)
                    }
                }
            }
        },
        HExpr::MatchExpr { scrutinee, arms, .. } => {
            let provenance_scrutinee = scrutinee
            let children = enumerate_reachable_match_children(
                scrutinee, arms)
            let mut registered_arms: Set<Int> = set_new()
            for inferred_child in children {
                let child: ReachableControlChild = inferred_child
                if child.kind == REACHABLE_CHILD_MATCH_SCRUTINEE {
                    solve_match_scrutinee_borrow_view(
                        env, table, metadata, state, scrutinee)
                } else {
                    let arm: HMatchArm = match arms.get(child.arm_index) {
                        some(value) => value,
                        none => panic(
                            "unreachable: reachable Match child has no arm")
                    }
                    if !registered_arms.contains(child.arm_index) {
                        register_pattern_provenance(table, arm.pattern,
                            arm.bindings, provenance_scrutinee)
                        registered_arms.insert(child.arm_index)
                    }
                    if child.kind == REACHABLE_CHILD_ARM_GUARD {
                        match arm.guard {
                            some(guard) => solve_expr(env, table, metadata,
                                state, guard, TRANSFER_BORROW),
                            none => panic(
                                "unreachable: reachable guard child has no guard")
                        }
                    } else if child.kind == REACHABLE_CHILD_ARM_BODY {
                        solve_expr(env, table, metadata, state, arm.body,
                            transfer)
                    } else {
                        panic(
                            "unreachable: invalid Match reachable-child kind")
                    }
                }
            }
        },
        HExpr::Block { stmts, tail, .. } => {
            for stmt in stmts {
                solve_stmt(env, table, metadata, state, stmt)
                // Solve the divergent statement itself (including a returned
                // value), then stop at the shared HIR reachability boundary.
                // A syntactic tail after Return/Never must not strengthen the
                // callable contract of its enclosing function.
                if !stmt_reaches_next(stmt) { return }
            }
            match tail {
                some(value) => solve_expr(env, table, metadata, state,
                    value, transfer),
                none => {}
            }
        },
        HExpr::IfExpr { condition, then_branch, else_branch, .. } => {
            let has_else = match else_branch {
                some(_) => true,
                none => false
            }
            let children = enumerate_reachable_if_children(
                condition, has_else)
            for inferred_child in children {
                let child: ReachableControlChild = inferred_child
                if child.kind == REACHABLE_CHILD_IF_CONDITION {
                    solve_expr(
                        env, table, metadata, state, condition,
                        TRANSFER_BORROW)
                } else if child.kind == REACHABLE_CHILD_IF_THEN {
                    solve_expr(env, table, metadata, state, then_branch,
                        transfer)
                } else if child.kind == REACHABLE_CHILD_IF_ELSE {
                    match else_branch {
                        some(branch) => solve_expr(
                            env, table, metadata, state, branch, transfer),
                        none => panic(
                            "unreachable: reachable else child has no branch")
                    }
                } else {
                    panic(
                        "unreachable: invalid If reachable-child kind")
                }
            }
        },
        HExpr::StringInterp { parts, .. } => {
            for part in parts {
                match part {
                    HStringInterpPart::Expression(value) => solve_expr(
                        env, table, metadata, state, value, TRANSFER_BORROW),
                    HStringInterpPart::Literal(_) => {}
                }
            }
        },
        HExpr::TryCatch { body, arms, .. } => {
            solve_expr(env, table, metadata, state, body, transfer)
            let children = enumerate_reachable_arm_children(arms)
            let mut registered_arms: Set<Int> = set_new()
            for inferred_child in children {
                let child: ReachableControlChild = inferred_child
                let arm: HMatchArm = match arms.get(child.arm_index) {
                    some(value) => value,
                    none => panic(
                        "unreachable: reachable Catch child has no arm")
                }
                if !registered_arms.contains(child.arm_index) {
                    for binding in arm.bindings {
                        register_callable_contract(table,
                            some(binding.def_id), binding.ty)
                    }
                    registered_arms.insert(child.arm_index)
                }
                if child.kind == REACHABLE_CHILD_ARM_GUARD {
                    match arm.guard {
                        some(guard) => solve_expr(env, table, metadata, state,
                            guard, TRANSFER_BORROW),
                        none => panic(
                            "unreachable: reachable Catch guard has no guard")
                    }
                } else if child.kind == REACHABLE_CHILD_ARM_BODY {
                    solve_expr(env, table, metadata, state, arm.body,
                        transfer)
                } else {
                    panic("unreachable: invalid Catch reachable-child kind")
                }
            }
        },
        HExpr::HandleExpr { body, .. } =>
            solve_expr(env, table, metadata, state, body, transfer),
        // A closure is a separate callable. Ordinary closures borrow captures;
        // capture transfer is rejected by the Take planner.
        HExpr::Lambda { .. } => {},
        HExpr::EffectOp { args, .. } => {
            for arg in args {
                solve_expr(env, table, metadata, state, arg, TRANSFER_BORROW)
            }
        },
        HExpr::RangeExpr { start, end, .. } => {
            solve_expr(env, table, metadata, state, start, TRANSFER_OWNING)
            solve_expr(env, table, metadata, state, end, TRANSFER_OWNING)
        },
        HExpr::ListLit { elements, .. } => {
            for element in elements {
                solve_expr(env, table, metadata, state, element,
                    TRANSFER_OWNING)
            }
        },
        HExpr::TupleLit { elements, .. } => {
            for element in elements {
                solve_expr(env, table, metadata, state, element,
                    TRANSFER_OWNING)
            }
        },
        HExpr::IndexExpr { receiver, index, .. } => {
            solve_expr(env, table, metadata, state, receiver,
                TRANSFER_BORROW)
            solve_expr(env, table, metadata, state, index, TRANSFER_BORROW)
        },
        HExpr::Clone { inner, .. } =>
            solve_expr(env, table, metadata, state, inner, TRANSFER_BORROW),
        HExpr::ReturnExpr { value, .. } => match value {
            some(returned) => solve_expr(
                env, table, metadata, state, returned, TRANSFER_OWNING),
            none => {}
        },
        HExpr::UnsafeBlock { body, .. } =>
            solve_expr(env, table, metadata, state, body, transfer),
        HExpr::Take { .. } | HExpr::Ident { .. } |
        HExpr::DictConstruct { .. } | HExpr::IntLit { .. } |
        HExpr::FloatLit { .. } | HExpr::StrLit { .. } |
        HExpr::BoolLit { .. } => {}
    }
}

fn solve_stmt(
    env: TypeEnv, table: CallableSolveTable,
    metadata: OwnershipMetadata, mut state: CallableSolveState,
    stmt: HStmt
) {
    match stmt {
        HStmt::Let { def_id, ty, init, .. } => {
            solve_expr(env, table, metadata, state, init, TRANSFER_AUTO)
            let alias_def_id = def_id
            let alias_type = ty
            register_callable_alias(table, alias_def_id, alias_type, init)
        },
        HStmt::Var { def_id, ty, init, .. } => {
            solve_expr(env, table, metadata, state, init, TRANSFER_AUTO)
            let alias_def_id = def_id
            let alias_type = ty
            register_callable_alias(table, alias_def_id, alias_type, init)
        },
        HStmt::Assign { target, value, .. } => {
            match target {
                HExpr::Ident { .. } => {},
                _ => mark_value_origin_opaque(table, target)
            }
            solve_expr(env, table, metadata, state, target, TRANSFER_BORROW)
            let value_transfer = match target {
                HExpr::Ident { .. } => TRANSFER_AUTO,
                _ => TRANSFER_OWNING
            }
            solve_expr(env, table, metadata, state, value, value_transfer)
            match target {
                HExpr::Ident { def_id, ty, .. } => {
                    let alias_def_id = def_id
                    let alias_type = ty
                    register_callable_alias(
                        table, alias_def_id, alias_type, value)
                },
                _ => {}
            }
        },
        HStmt::ExprStmt { expr, .. } =>
            solve_expr(env, table, metadata, state, expr, TRANSFER_BORROW),
        HStmt::Return { value, .. } => match value {
            some(returned) => solve_expr(
                env, table, metadata, state, returned, TRANSFER_OWNING),
            none => {}
        },
        HStmt::While { condition, body, .. } => {
            let reachability_condition = condition
            let solver_condition = condition
            let condition_reaches_value =
                expr_has_reachable_value(reachability_condition)
            solve_expr(env, table, metadata, state, solver_condition,
                TRANSFER_BORROW)
            if condition_reaches_value {
                solve_expr(env, table, metadata, state, body,
                    TRANSFER_BORROW)
            }
        },
        HStmt::ForIn { iterable, body, .. } => {
            let reachability_iterable = iterable
            let solver_iterable = iterable
            let iterable_reaches_value =
                expr_has_reachable_value(reachability_iterable)
            solve_expr(env, table, metadata, state, solver_iterable,
                TRANSFER_BORROW)
            if iterable_reaches_value {
                solve_expr(env, table, metadata, state, body,
                    TRANSFER_BORROW)
            }
        },
        HStmt::LetDestructure { pattern, bindings, init, .. } => {
            solve_expr(env, table, metadata, state, init, TRANSFER_BORROW)
            register_destructure_provenance(
                table, pattern, bindings, init)
        },
        HStmt::IfLet { pattern, bindings, expr,
                       then_block, else_block, .. } => {
            let reachability_expr = expr
            let solver_expr = expr
            let provenance_expr = expr
            let expr_reaches_value =
                expr_has_reachable_value(reachability_expr)
            solve_expr(env, table, metadata, state,
                solver_expr, TRANSFER_BORROW)
            if expr_reaches_value {
                register_pattern_provenance(
                    table, pattern, bindings, provenance_expr)
                solve_expr(env, table, metadata, state, then_block,
                    TRANSFER_BORROW)
                match else_block {
                    some(branch) => solve_expr(
                        env, table, metadata, state, branch,
                        TRANSFER_BORROW),
                    none => {}
                }
            }
        },
        HStmt::Break { .. } | HStmt::Continue { .. } |
        HStmt::Drop { .. } => {}
    }
}

fn direct_transfer_levels(
    ownership_term: Int, force_params: List<Bool>
) -> List<CallableTransferLevel> {
    let mut copied_forces: List<Bool> = []
    for force in force_params {
        let copied_force = force
        copied_forces.push(copied_force)
    }
    [callable_transfer_level(ownership_term, copied_forces)]
}

fn recovery_transfer_levels(
    ownership_term: Int, arity: Int
) -> List<CallableTransferLevel> {
    let mut forces: List<Bool> = []
    let mut index = 0
    while index < arity {
        forces.push(false)
        index = index + 1
    }
    direct_transfer_levels(ownership_term, forces)
}

fn publish_solved_callable_ownership(
    mut metadata: OwnershipMetadata, def_id: Int, exact: Int,
    source: Int, transfer_levels: List<CallableTransferLevel>,
    mut sink: CollectingSink, span: Span
) {
    match metadata.callable_by_def_id.get(def_id) {
        some(term) => {
            if callable_ownership_constraint_compatible(
                    metadata, term, exact) {
                if !constrain_callable_ownership_terms(
                        metadata, term, exact) {
                    panic("unreachable: callable ownership bind changed after preflight")
                }
            } else {
                report_ownership_error(sink,
                    "callable ownership contract mismatch", span,
                    "the body-inferred Borrow/MutBorrow/Move vector conflicts with its fixed callable type")
            }
        },
        none => {}
    }
    // Keep the DefId map exact after publication. FnType occurrences still
    // carry their shared inference term until the atomic recursive freeze.
    record_callable_ownership_with_transfer_levels(
        metadata, def_id, exact, source, transfer_levels)
}

fn type_with_ownership(ty: Type, ownership_id: Int) -> Type {
    match ty {
        Type::FnType { params, return_type, meta } => {
            let final_params = params
            let final_return_type = return_type
            Type::FnType {
                params: final_params, return_type: final_return_type,
                meta: fn_meta(meta.effects, ownership_id)
            }
        },
        _ => ty
    }
}

fn finalized_return_type(
    table: CallableSolveTable, def_id: Int, ty: Type
) -> Type {
    match table.states.get(def_id) {
        some(state) => match state.return_callable_contract {
            some(ownership_id) => type_with_ownership(ty, ownership_id),
            none => ty
        },
        none => ty
    }
}

fn finalized_callable_type(
    table: CallableSolveTable, metadata: OwnershipMetadata,
    def_id: Int, ty: Type
) -> Type {
    if table.const_getter_def_ids.contains(def_id) {
        match ty {
            Type::FnType { .. } => {
                let levels = match callable_transfer_levels_for_def_id(
                        metadata, def_id) {
                    some(value) => value,
                    none => panic(
                        "unreachable: callable const getter has no transfer spine")
                }
                if levels.len() < 2 {
                    panic(
                        "unreachable: callable const getter has no stored-callable transfer level")
                }
                return type_with_transfer_spine_at(ty, levels, 1)
            },
            _ => {}
        }
    }
    let outer = match metadata.callable_by_def_id.get(def_id) {
        some(ownership_id) => {
            let source_type = ty
            type_with_ownership(source_type, ownership_id)
        },
        none => ty
    }
    match outer {
        Type::FnType { params, return_type, meta } => {
            let final_params = params
            let source_return_type = return_type
            let final_meta = meta
            Type::FnType {
                params: final_params,
                return_type: finalized_return_type(
                    table, def_id, source_return_type),
                meta: final_meta
            }
        },
        _ => outer
    }
}

fn type_with_transfer_spine_at(
    ty: Type, levels: List<CallableTransferLevel>, level_index: Int
) -> Type {
    match ty {
        Type::FnType { params, return_type, meta } => {
            let final_params = params
            let recursive_return_type = return_type
            let final_effects = meta.effects
            let level_ownership_term = match levels.get(level_index) {
                some(value) => value.ownership_term,
                none => panic(
                    "unreachable: callable transfer spine is shorter than its type")
            }
            let recursive_levels = clone_callable_transfer_levels(levels)
            Type::FnType {
                params: final_params,
                return_type: type_with_transfer_spine_at(
                    recursive_return_type, recursive_levels, level_index + 1),
                meta: fn_meta(final_effects, level_ownership_term)
            }
        },
        _ => ty
    }
}

fn finalized_scheme(
    table: CallableSolveTable, metadata: OwnershipMetadata, scheme: TypeScheme
) -> TypeScheme {
    match (scheme.def_id, scheme) {
        (some(def_id), source_scheme) => TypeScheme { ..source_scheme,
            ty: finalized_callable_type(
                table, metadata, def_id, source_scheme.ty) },
        (none, source_scheme) => {
            let final_scheme = source_scheme
            final_scheme
        }
    }
}

fn insert_finalized_scheme_entry(
    mut destination: Map<Str, TypeScheme>,
    table: CallableSolveTable, metadata: OwnershipMetadata,
    entry: (Str, TypeScheme)
) {
    match entry {
        (name, scheme) => {
            let scheme_for_finalize = scheme
            let final_scheme = finalized_scheme(
                table, metadata, scheme_for_finalize)
            let name_for_insert = name
            destination.insert(name_for_insert, final_scheme)
        }
    }
}

fn finalize_callable_env(mut env: TypeEnv, table: CallableSolveTable) {
    let metadata = env.types.ownership_metadata
    for scope in env.scope.scopes {
        let entries = scope.variables.entries()
        for entry in entries {
            insert_finalized_scheme_entry(
                scope.variables, table, metadata, entry)
        }
    }
    let sig_entries = env.types.sigs.entries()
    for sig_entry in sig_entries {
        let (name, sig_def) = sig_entry
        let mut members: Map<Str, TypeScheme> = map_new()
        for member_entry in sig_def.members.entries() {
            insert_finalized_scheme_entry(
                members, table, metadata, member_entry)
        }
        let final_sig_name = name
        env.types.sigs.insert(
            final_sig_name, SigDef { ..sig_def, members: members })
    }
    let method_targets = env.trait_reg.impl_methods.entries()
    for target_entry in method_targets {
        let (target, methods) = target_entry
        let mut finalized: Map<Str, TypeScheme> = map_new()
        for method_entry in methods.entries() {
            insert_finalized_scheme_entry(
                finalized, table, metadata, method_entry)
        }
        let final_target = target
        env.trait_reg.impl_methods.insert(final_target, finalized)
    }
    let trait_entries = env.trait_reg.traits.entries()
    for trait_entry in trait_entries {
        let (name, trait_def) = trait_entry
        let mut methods: List<TraitMethodDef> = []
        for method in trait_def.methods {
            let ty = finalized_callable_type(
                table, metadata, method.def_id, method.ty)
            methods.push(TraitMethodDef { ..method, ty: ty })
        }
        let final_trait_name = name
        env.trait_reg.traits.insert(final_trait_name, TraitDef {
            ..trait_def, methods: methods
        })
    }
    let impl_targets = env.trait_reg.trait_impls.entries()
    for impl_entry in impl_targets {
        let (target, impls) = impl_entry
        let mut finalized_impls: List<ImplEntry> = []
        for impl_ in impls {
            let mut methods: Map<Str, TypeScheme> = map_new()
            for method_entry in impl_.method_schemes.entries() {
                insert_finalized_scheme_entry(
                    methods, table, metadata, method_entry)
            }
            finalized_impls.push(ImplEntry {
                ..impl_, method_schemes: methods
            })
        }
        let final_impl_target = target
        env.trait_reg.trait_impls.insert(final_impl_target, finalized_impls)
    }
}

fn final_param(param: HParam, mode: Int) -> HParam {
    hparam_replace_ownership(param, mode)
}

fn finalize_trait_method(
    table: CallableSolveTable, method: HTraitMethod
) -> HTraitMethod {
    match table.states.get(method.def_id) {
        some(state) => {
            let mut params: List<HParam> = []
            let mut index = 0
            for param in method.params {
                params.push(final_param(param,
                    state.modes.get(index).unwrap_or(
                        PARAM_OWNERSHIP_BORROW)))
                index = index + 1
            }
            HTraitMethod { ..method, params: params,
                return_type: finalized_return_type(
                    table, method.def_id, method.return_type) }
        },
        none => method
    }
}

fn finalize_decl_params(
    table: CallableSolveTable, decl: HDecl
) -> HDecl {
    match decl {
        HDecl::Fn { name, def_id, type_params, params, return_type, effects,
                    body, is_pub, trait_bounds, span } => {
            let mut final_params: List<HParam> = []
            match def_id {
                some(id) => match table.states.get(id) {
                    some(state) => {
                        let mut index = 0
                        for param in params {
                            final_params.push(final_param(param,
                                state.modes.get(index).unwrap_or(
                                    PARAM_OWNERSHIP_BORROW)))
                            index = index + 1
                        }
                    },
                    none => { final_params = params }
                },
                none => { final_params = params }
            }
            let final_return_type = match def_id {
                some(id) => {
                    let source_return_type = return_type
                    finalized_return_type(table, id, source_return_type)
                },
                none => return_type
            }
            let final_name = name
            let final_def_id = def_id
            let final_type_params = type_params
            let final_effects = effects
            let final_body = body
            let final_trait_bounds = trait_bounds
            let final_span = span
            HDecl::Fn { name: final_name, def_id: final_def_id,
                type_params: final_type_params, params: final_params,
                return_type: final_return_type, effects: final_effects,
                body: final_body, is_pub: is_pub,
                trait_bounds: final_trait_bounds, span: final_span }
        },
        HDecl::Impl { target_type, type_params, trait_name, methods,
                      assoc_types, span } => {
            let mut final_methods: List<HDecl> = []
            for method in methods {
                let final_method = method
                final_methods.push(finalize_decl_params(table, final_method))
            }
            let final_target_type = target_type
            let final_type_params = type_params
            let final_trait_name = trait_name
            let final_assoc_types = assoc_types
            let final_span = span
            HDecl::Impl { target_type: final_target_type,
                type_params: final_type_params,
                trait_name: final_trait_name, methods: final_methods,
                assoc_types: final_assoc_types, span: final_span }
        },
        HDecl::ModBlock { name, decls, is_pub, span } => {
            let mut final_decls: List<HDecl> = []
            for nested in decls {
                let final_nested = nested
                final_decls.push(finalize_decl_params(table, final_nested))
            }
            let final_name = name
            let final_span = span
            HDecl::ModBlock { name: final_name, decls: final_decls,
                is_pub: is_pub, span: final_span }
        },
        HDecl::Trait { name, type_params, methods, supertraits,
                       assoc_types, is_pub, span } => {
            let mut final_methods: List<HTraitMethod> = []
            for method in methods {
                let final_method = method
                final_methods.push(finalize_trait_method(table, final_method))
            }
            let final_name = name
            let final_type_params = type_params
            let final_supertraits = supertraits
            let final_assoc_types = assoc_types
            let final_span = span
            HDecl::Trait { name: final_name,
                type_params: final_type_params, methods: final_methods,
                supertraits: final_supertraits,
                assoc_types: final_assoc_types, is_pub: is_pub,
                span: final_span }
        },
        _ => decl
    }
}

fn freeze_hparam_ownership(
    metadata: OwnershipMetadata, param: HParam
) -> HParam {
    HParam { ..param,
        ty: freeze_callable_ownership_type(metadata, param.ty) }
}

fn freeze_hassoc_ownership(
    metadata: OwnershipMetadata, assoc: HAssocType
) -> HAssocType {
    HAssocType { ..assoc,
        concrete: match assoc.concrete {
            some(ty) => some(freeze_callable_ownership_type(metadata, ty)),
            none => none
        } }
}

fn freeze_htrait_method_ownership(
    metadata: OwnershipMetadata, method: HTraitMethod
) -> HTraitMethod {
    HTraitMethod { ..method,
        params: method.params.map(fn(param) {
            freeze_hparam_ownership(metadata, param)
        }),
        return_type: freeze_callable_ownership_type(
            metadata, method.return_type),
        effects: freeze_callable_ownership_row(metadata, method.effects),
        body: match method.body {
            some(body) => some(freeze_ownership_expr(metadata, body)),
            none => none
        } }
}

fn freeze_hdecl_ownership(
    metadata: OwnershipMetadata, decl: HDecl
) -> HDecl {
    match decl {
        HDecl::Fn { name, def_id, type_params, params, return_type,
                    effects, body, is_pub, trait_bounds, span } => {
            let final_name = name
            let final_def_id = def_id
            let final_type_params = type_params
            let final_trait_bounds = trait_bounds
            let final_span = span
            HDecl::Fn { name: final_name, def_id: final_def_id,
                type_params: final_type_params,
                params: params.map(fn(param) {
                    freeze_hparam_ownership(metadata, param)
                }),
                return_type: freeze_callable_ownership_type(
                    metadata, return_type),
                effects: freeze_callable_ownership_row(metadata, effects),
                body: freeze_ownership_expr(metadata, body),
                is_pub: is_pub, trait_bounds: final_trait_bounds,
                span: final_span }
        },
        HDecl::Struct { name, type_params, fields, is_pub, span } => {
            let final_name = name
            let final_type_params = type_params
            let final_span = span
            HDecl::Struct { name: final_name,
                type_params: final_type_params,
                fields: fields.map(fn(field) { HStructField { ..field,
                    ty: freeze_callable_ownership_type(
                        metadata, field.ty) } }),
                is_pub: is_pub, span: final_span }
        },
        HDecl::Enum { name, type_params, variants, is_pub, span } => {
            let final_name = name
            let final_type_params = type_params
            let final_span = span
            HDecl::Enum { name: final_name, type_params: final_type_params,
                variants: variants.map(fn(variant) {
                    HEnumVariant { ..variant,
                        fields: variant.fields.map(fn(field) {
                            freeze_callable_ownership_type(metadata, field)
                        }) }
                }), is_pub: is_pub, span: final_span }
        },
        HDecl::Impl { target_type, type_params, trait_name, methods,
                      assoc_types, span } => {
            let final_target_type = target_type
            let final_type_params = type_params
            let final_trait_name = trait_name
            let final_span = span
            HDecl::Impl { target_type: final_target_type,
                type_params: final_type_params, trait_name: final_trait_name,
                methods: methods.map(fn(method) {
                    let method_metadata = metadata
                    let final_method = method
                    freeze_hdecl_ownership(method_metadata, final_method)
                }),
                assoc_types: assoc_types.map(fn(assoc) {
                    freeze_hassoc_ownership(metadata, assoc)
                }), span: final_span }
        },
        HDecl::Effect { name, type_params, ops, is_pub, span } => {
            let final_name = name
            let final_type_params = type_params
            let final_span = span
            HDecl::Effect { name: final_name, type_params: final_type_params,
                ops: ops.map(fn(op) { HEffectOp { ..op,
                    params: op.params.map(fn(param) {
                        freeze_hparam_ownership(metadata, param)
                    }),
                    return_type: freeze_callable_ownership_type(
                        metadata, op.return_type),
                    default_body: match op.default_body {
                        some(body) => {
                            let body_metadata = metadata
                            some(freeze_ownership_expr(body_metadata, body))
                        },
                        none => none
                    } } }),
                is_pub: is_pub, span: final_span }
        },
        HDecl::Test { description, body, span } => {
            let final_description = description
            let final_span = span
            HDecl::Test { description: final_description,
                body: freeze_ownership_expr(metadata, body), span: final_span }
        },
        HDecl::Trait { name, type_params, methods, supertraits,
                       assoc_types, is_pub, span } => {
            let final_name = name
            let final_type_params = type_params
            let final_supertraits = supertraits
            let final_span = span
            HDecl::Trait { name: final_name,
                type_params: final_type_params,
                methods: methods.map(fn(method) {
                    let method_metadata = metadata
                    freeze_htrait_method_ownership(method_metadata, method)
                }), supertraits: final_supertraits,
                assoc_types: assoc_types.map(fn(assoc) {
                    freeze_hassoc_ownership(metadata, assoc)
                }), is_pub: is_pub, span: final_span }
        },
        HDecl::ExternFn { name, abi_name, def_id, type_params, params,
                          return_type, effects, is_pub, span } => {
            let final_name = name
            let final_abi_name = abi_name
            let final_def_id = def_id
            let final_type_params = type_params
            let final_span = span
            HDecl::ExternFn { name: final_name, abi_name: final_abi_name,
                def_id: final_def_id, type_params: final_type_params,
                params: params.map(fn(param) {
                    freeze_hparam_ownership(metadata, param)
                }),
                return_type: freeze_callable_ownership_type(
                    metadata, return_type),
                effects: freeze_callable_ownership_row(metadata, effects),
                is_pub: is_pub, span: final_span }
        },
        HDecl::ExternType { .. } => decl,
        HDecl::TypeAlias { name, ty, is_pub, span } => {
            let final_name = name
            let final_span = span
            HDecl::TypeAlias { name: final_name,
                ty: freeze_callable_ownership_type(metadata, ty),
                is_pub: is_pub, span: final_span }
        },
        HDecl::Const { name, def_id, ty, init, is_pub, span } => {
            let final_name = name
            let final_def_id = def_id
            let final_span = span
            HDecl::Const { name: final_name, def_id: final_def_id,
                ty: freeze_callable_ownership_type(metadata, ty),
                init: freeze_ownership_expr(metadata, init),
                is_pub: is_pub, span: final_span }
        },
        HDecl::ModBlock { name, decls, is_pub, span } => {
            let final_name = name
            let final_span = span
            HDecl::ModBlock { name: final_name,
                decls: decls.map(fn(nested) {
                    let nested_metadata = metadata
                    let final_nested = nested
                    freeze_hdecl_ownership(nested_metadata, final_nested)
                }), is_pub: is_pub, span: final_span }
        },
        HDecl::Sig { name, members, is_pub, span } => {
            let final_name = name
            let final_span = span
            HDecl::Sig { name: final_name,
                members: members.map(fn(member) { HSigMember {
                    ..member, fn_type: freeze_callable_ownership_type(
                        metadata, member.fn_type) } }),
                is_pub: is_pub, span: final_span }
        }
    }
}

fn require_retained_callable_metadata(
    metadata: OwnershipMetadata, def_id: Int
) {
    let term = match metadata.callable_by_def_id.get(def_id) {
        some(value) => value,
        none => panic(
            "unreachable: retained HIR callee has no ownership descriptor")
    }
    let _ = require_exact_callable_ownership_term(metadata, term)
    if !metadata.callable_state_by_def_id.contains_key(def_id) {
        panic("unreachable: retained HIR callee has no ownership source state")
    }
    match metadata.callable_result_role_by_def_id.get(def_id) {
        some(role) => if !callable_result_role_is_valid(role) {
            panic("unreachable: retained HIR callee has an invalid direct result role")
        },
        none => panic(
            "unreachable: retained HIR callee has no direct result role")
    }
    match metadata.returned_callable_result_role_by_def_id.get(def_id) {
        some(role) => if !callable_result_role_is_valid(role) {
            panic("unreachable: retained HIR callee has an invalid returned result role")
        },
        none => panic(
            "unreachable: retained HIR callee has no returned result role")
    }
}

fn require_retained_callable_identity(
    metadata: OwnershipMetadata, def_id: Int?
) {
    match def_id {
        some(id) => require_retained_callable_metadata(metadata, id),
        none => panic(
            "unreachable: retained callable definition has no exact DefId")
    }
}

fn require_retained_callable_binding(
    metadata: OwnershipMetadata, def_id: Int?, ty: Type
) {
    match ty {
        Type::FnType { .. } => require_retained_callable_identity(
            metadata, def_id),
        _ => {}
    }
}

fn validate_retained_callable_param_totality(
    metadata: OwnershipMetadata, param: HParam
) {
    require_retained_callable_binding(metadata, param.def_id, param.ty)
}

fn validate_retained_callable_arm_totality(
    metadata: OwnershipMetadata, arm: HMatchArm
) {
    for binding in arm.bindings {
        require_retained_callable_binding(
            metadata, some(binding.def_id), binding.ty)
    }
    match arm.guard {
        some(guard) => validate_retained_callable_expr_totality(
            metadata, guard),
        none => {}
    }
    validate_retained_callable_expr_totality(metadata, arm.body)
}

fn validate_retained_callable_handler_totality(
    metadata: OwnershipMetadata, handler: HEffectHandler
) {
    for param in handler.params {
        validate_retained_callable_param_totality(metadata, param)
    }
    match handler.resume_binding {
        some(binding) => require_retained_callable_binding(
            metadata, some(binding.def_id), binding.ty),
        none => {}
    }
    validate_retained_callable_expr_totality(metadata, handler.body)
}

fn validate_retained_callable_stmt_totality(
    metadata: OwnershipMetadata, stmt: HStmt
) {
    match stmt {
        HStmt::Let { def_id, ty, init, .. } |
        HStmt::Var { def_id, ty, init, .. } => {
            require_retained_callable_binding(metadata, def_id, ty)
            validate_retained_callable_expr_totality(metadata, init)
        },
        HStmt::ExprStmt { expr: init, .. } =>
            validate_retained_callable_expr_totality(metadata, init),
        HStmt::LetDestructure { bindings, init, .. } => {
            for binding in bindings {
                require_retained_callable_binding(
                    metadata, binding.def_id, binding.ty)
            }
            validate_retained_callable_expr_totality(metadata, init)
        },
        HStmt::Assign { target, value, .. } => {
            validate_retained_callable_expr_totality(metadata, target)
            validate_retained_callable_expr_totality(metadata, value)
        },
        HStmt::Return { value, .. } => match value {
            some(returned) => validate_retained_callable_expr_totality(
                metadata, returned),
            none => {}
        },
        HStmt::While { condition, body, .. } => {
            validate_retained_callable_expr_totality(metadata, condition)
            validate_retained_callable_expr_totality(metadata, body)
        },
        HStmt::ForIn { iterable, body, .. } => {
            validate_retained_callable_expr_totality(metadata, iterable)
            validate_retained_callable_expr_totality(metadata, body)
        },
        HStmt::IfLet { bindings, expr, then_block, else_block, .. } => {
            for binding in bindings {
                require_retained_callable_binding(
                    metadata, some(binding.def_id), binding.ty)
            }
            validate_retained_callable_expr_totality(metadata, expr)
            validate_retained_callable_expr_totality(metadata, then_block)
            match else_block {
                some(branch) => validate_retained_callable_expr_totality(
                    metadata, branch),
                none => {}
            }
        },
        HStmt::Break { .. } | HStmt::Continue { .. } |
        HStmt::Drop { .. } => {}
    }
}

fn validate_retained_callable_expr_totality(
    metadata: OwnershipMetadata, expr: HExpr
) {
    match expr {
        HExpr::BinOp { left, right, .. } => {
            validate_retained_callable_expr_totality(metadata, left)
            validate_retained_callable_expr_totality(metadata, right)
        },
        HExpr::UnaryOp { operand, .. } =>
            validate_retained_callable_expr_totality(metadata, operand),
        HExpr::Call { callee, callee_def_id, callable_result_def_id,
                      args, .. } => {
            match callee_def_id {
                some(def_id) => require_retained_callable_metadata(
                    metadata, def_id),
                none => {}
            }
            match callable_result_def_id {
                some(def_id) => require_retained_callable_metadata(
                    metadata, def_id),
                none => {}
            }
            validate_retained_callable_expr_totality(metadata, callee)
            for arg in args {
                validate_retained_callable_expr_totality(metadata, arg)
            }
        },
        HExpr::FieldAccess { receiver, .. } =>
            validate_retained_callable_expr_totality(metadata, receiver),
        HExpr::StructLit { fields, spread, .. } |
        HExpr::NamedVariantConstruct { fields, spread, .. } => {
            for field in fields {
                validate_retained_callable_expr_totality(
                    metadata, field.value)
            }
            match spread {
                some(source) => validate_retained_callable_expr_totality(
                    metadata, source),
                none => {}
            }
        },
        HExpr::MatchExpr { scrutinee, arms, .. } => {
            validate_retained_callable_expr_totality(metadata, scrutinee)
            for arm in arms {
                validate_retained_callable_arm_totality(metadata, arm)
            }
        },
        HExpr::Block { stmts, tail, .. } => {
            for stmt in stmts {
                validate_retained_callable_stmt_totality(metadata, stmt)
            }
            match tail {
                some(value) => validate_retained_callable_expr_totality(
                    metadata, value),
                none => {}
            }
        },
        HExpr::IfExpr { condition, then_branch, else_branch, .. } => {
            validate_retained_callable_expr_totality(metadata, condition)
            validate_retained_callable_expr_totality(metadata, then_branch)
            match else_branch {
                some(branch) => validate_retained_callable_expr_totality(
                    metadata, branch),
                none => {}
            }
        },
        HExpr::StringInterp { parts, .. } => {
            for part in parts {
                match part {
                    HStringInterpPart::Expression(value) =>
                        validate_retained_callable_expr_totality(
                            metadata, value),
                    HStringInterpPart::Literal(_) => {}
                }
            }
        },
        HExpr::TryCatch { body, arms, .. } => {
            validate_retained_callable_expr_totality(metadata, body)
            for arm in arms {
                validate_retained_callable_arm_totality(metadata, arm)
            }
        },
        HExpr::HandleExpr { body, handlers, .. } => {
            validate_retained_callable_expr_totality(metadata, body)
            for handler in handlers {
                validate_retained_callable_handler_totality(
                    metadata, handler)
            }
        },
        HExpr::Lambda { def_id, params, body, .. } => {
            require_retained_callable_metadata(metadata, def_id)
            for param in params {
                validate_retained_callable_param_totality(metadata, param)
            }
            validate_retained_callable_expr_totality(metadata, body)
        },
        HExpr::UnsafeBlock { body, .. } =>
            validate_retained_callable_expr_totality(metadata, body),
        HExpr::EffectOp { args, .. } => {
            for arg in args {
                validate_retained_callable_expr_totality(metadata, arg)
            }
        },
        HExpr::RangeExpr { start, end, .. } => {
            validate_retained_callable_expr_totality(metadata, start)
            validate_retained_callable_expr_totality(metadata, end)
        },
        HExpr::ListLit { elements, .. } |
        HExpr::TupleLit { elements, .. } => {
            for element in elements {
                validate_retained_callable_expr_totality(metadata, element)
            }
        },
        HExpr::IndexExpr { receiver, index, .. } => {
            validate_retained_callable_expr_totality(metadata, receiver)
            validate_retained_callable_expr_totality(metadata, index)
        },
        HExpr::Clone { inner, .. } =>
            validate_retained_callable_expr_totality(metadata, inner),
        HExpr::ReturnExpr { value, .. } => match value {
            some(returned) => validate_retained_callable_expr_totality(
                metadata, returned),
            none => {}
        },
        HExpr::Take { .. } | HExpr::Ident { .. } |
        HExpr::DictConstruct { .. } | HExpr::IntLit { .. } |
        HExpr::FloatLit { .. } | HExpr::StrLit { .. } |
        HExpr::BoolLit { .. } => {}
    }
}

fn validate_retained_callable_decl_totality(
    metadata: OwnershipMetadata, decl: HDecl
) {
    match decl {
        HDecl::Fn { def_id, params, body, .. } => {
            require_retained_callable_identity(metadata, def_id)
            for param in params {
                validate_retained_callable_param_totality(metadata, param)
            }
            validate_retained_callable_expr_totality(metadata, body)
        },
        HDecl::Test { body, .. } =>
            validate_retained_callable_expr_totality(metadata, body),
        HDecl::Impl { methods, .. } => {
            for method in methods {
                validate_retained_callable_decl_totality(metadata, method)
            }
        },
        HDecl::Effect { ops, .. } => {
            for op in ops {
                for param in op.params {
                    validate_retained_callable_param_totality(metadata, param)
                }
                match op.default_body {
                    some(body) => validate_retained_callable_expr_totality(
                        metadata, body),
                    none => {}
                }
            }
        },
        HDecl::Trait { methods, .. } => {
            for method in methods {
                require_retained_callable_metadata(metadata, method.def_id)
                for param in method.params {
                    validate_retained_callable_param_totality(metadata, param)
                }
                match method.body {
                    some(body) => validate_retained_callable_expr_totality(
                        metadata, body),
                    none => {}
                }
            }
        },
        HDecl::ExternFn { def_id, .. } => {
            require_retained_callable_identity(metadata, def_id)
            // Extern parameters are ABI signature components, not lexical HIR
            // binders: check_extern_fn_decl deliberately gives every HParam a
            // `none` DefId because there is no retained body that could call a
            // callable-valued parameter. The enclosing extern DefId owns the
            // exact descriptor and result-role authority.
        },
        HDecl::Const { def_id, init, .. } => {
            require_retained_callable_identity(metadata, def_id)
            validate_retained_callable_expr_totality(metadata, init)
        },
        HDecl::ModBlock { decls, .. } => {
            for nested in decls {
                validate_retained_callable_decl_totality(metadata, nested)
            }
        },
        HDecl::Struct { .. } | HDecl::Enum { .. } |
        HDecl::ExternType { .. } |
        HDecl::TypeAlias { .. } | HDecl::Sig { .. } => {}
    }
}

fn validate_retained_callable_program_totality(
    metadata: OwnershipMetadata, decls: List<HDecl>
) {
    for decl in decls {
        validate_retained_callable_decl_totality(metadata, decl)
    }
}

fn freeze_program_ownership(
    mut env: TypeEnv, program: HProgram
) -> HProgram {
    let provisional = env.types.ownership_metadata
    let frozen_decls = program.decls.map(fn(decl) {
        let decl_provisional = provisional
        let frozen_decl = decl
        freeze_hdecl_ownership(decl_provisional, frozen_decl)
    })
    let frozen_metadata = freeze_callable_ownership_metadata(provisional)
    let env_frozen_metadata = frozen_metadata
    freeze_type_env_ownership(env, provisional, env_frozen_metadata)
    let mut boxed_vars = program.boxed_vars
    let census_frozen_metadata = frozen_metadata
    collect_scalar_mut_borrow_boxes_decls(
        census_frozen_metadata, frozen_decls, boxed_vars)
    validate_retained_callable_program_totality(
        frozen_metadata, frozen_decls)
    let program_frozen_metadata = frozen_metadata
    let frozen = HProgram { ..program, decls: frozen_decls,
        boxed_vars: boxed_vars,
        ownership_metadata: program_frozen_metadata }
    validate_callable_ownership_metadata(frozen_metadata)
    frozen
}

// Scalar MutBorrow uses one shared CELL ABI.  Infer-time name metadata cannot
// prove a first-class callable, so finish the caller-visible box plan only
// after callable ownership has crossed the atomic freeze barrier.  Both
// parameter binders and call edges consume the same exact DefId descriptor.
fn frozen_callable_param_mode(
    metadata: OwnershipMetadata, callee_def_id: Int?, index: Int
) -> Int? {
    match callee_def_id {
        some(def_id) => match metadata.callable_by_def_id.get(def_id) {
            some(ownership_id) => {
                let mode = callable_param_ownership(
                    metadata, ownership_id, index)
                if mode == PARAM_OWNERSHIP_UNKNOWN { none } else { some(mode) }
            },
            none => none
        },
        none => none
    }
}

fn mark_scalar_mut_borrow_binding(
    metadata: OwnershipMetadata, callee_def_id: Int?, index: Int,
    value: HExpr, mut boxed_vars: Set<Int>
) {
    if !is_value_type(hexpr_type(value)) { return }
    match frozen_callable_param_mode(metadata, callee_def_id, index) {
        some(mode) => if mode == PARAM_OWNERSHIP_MUT_BORROW {
            match value {
                HExpr::Ident { def_id: some(def_id), .. } => {
                    let boxed_def_id = def_id
                    boxed_vars.insert(boxed_def_id)
                },
                _ => {}
            }
        },
        none => {}
    }
}

fn mark_scalar_mut_borrow_params(
    metadata: OwnershipMetadata, callable_def_id: Int?,
    params: List<HParam>, mut boxed_vars: Set<Int>
) {
    let mut index = 0
    for param in params {
        match frozen_callable_param_mode(
                metadata, callable_def_id, index) {
            some(mode) => if mode == PARAM_OWNERSHIP_MUT_BORROW &&
                    is_value_type(param.ty) {
                match param.def_id {
                    some(def_id) => {
                        let boxed_def_id = def_id
                        boxed_vars.insert(boxed_def_id)
                    },
                    none => {}
                }
            },
            none => {}
        }
        index = index + 1
    }
}

fn collect_scalar_mut_borrow_boxes_handler(
    metadata: OwnershipMetadata, handler: HEffectHandler,
    mut boxed_vars: Set<Int>
) {
    collect_scalar_mut_borrow_boxes_expr(
        metadata, handler.body, boxed_vars)
}

fn collect_scalar_mut_borrow_boxes_stmt(
    metadata: OwnershipMetadata, stmt: HStmt,
    mut boxed_vars: Set<Int>
) {
    match stmt {
        HStmt::Let { init: let_init, .. } =>
            collect_scalar_mut_borrow_boxes_expr(
                metadata, let_init, boxed_vars),
        HStmt::Var { init: var_init, .. } =>
            collect_scalar_mut_borrow_boxes_expr(
                metadata, var_init, boxed_vars),
        HStmt::ExprStmt { expr: expr_init, .. } =>
            collect_scalar_mut_borrow_boxes_expr(
                metadata, expr_init, boxed_vars),
        HStmt::LetDestructure { init: destructure_init, .. } =>
            collect_scalar_mut_borrow_boxes_expr(
                metadata, destructure_init, boxed_vars),
        HStmt::Assign { target, value, .. } => {
            collect_scalar_mut_borrow_boxes_expr(
                metadata, target, boxed_vars)
            collect_scalar_mut_borrow_boxes_expr(
                metadata, value, boxed_vars)
        },
        HStmt::Return { value, .. } => match value {
            some(returned) => collect_scalar_mut_borrow_boxes_expr(
                metadata, returned, boxed_vars),
            none => {}
        },
        HStmt::While { condition, body, .. } => {
            let reachability_condition = condition
            let semantic_condition = condition
            let condition_reaches_value =
                expr_has_reachable_value(reachability_condition)
            collect_scalar_mut_borrow_boxes_expr(
                metadata, semantic_condition, boxed_vars)
            if condition_reaches_value {
                collect_scalar_mut_borrow_boxes_expr(
                    metadata, body, boxed_vars)
            }
        },
        HStmt::ForIn { iterable, body, .. } => {
            let reachability_iterable = iterable
            let semantic_iterable = iterable
            let iterable_reaches_value =
                expr_has_reachable_value(reachability_iterable)
            collect_scalar_mut_borrow_boxes_expr(
                metadata, semantic_iterable, boxed_vars)
            if iterable_reaches_value {
                collect_scalar_mut_borrow_boxes_expr(
                    metadata, body, boxed_vars)
            }
        },
        HStmt::IfLet { expr, then_block, else_block, .. } => {
            let reachability_expr = expr
            let semantic_expr = expr
            let expr_reaches_value =
                expr_has_reachable_value(reachability_expr)
            collect_scalar_mut_borrow_boxes_expr(
                metadata, semantic_expr, boxed_vars)
            if expr_reaches_value {
                collect_scalar_mut_borrow_boxes_expr(
                    metadata, then_block, boxed_vars)
                match else_block {
                    some(branch) => collect_scalar_mut_borrow_boxes_expr(
                        metadata, branch, boxed_vars),
                    none => {}
                }
            }
        },
        HStmt::Break { .. } | HStmt::Continue { .. } |
        HStmt::Drop { .. } => {}
    }
}

fn collect_scalar_mut_borrow_boxes_expr(
    metadata: OwnershipMetadata, expr: HExpr,
    mut boxed_vars: Set<Int>
) {
    match expr {
        HExpr::BinOp { left, right, .. } => {
            collect_scalar_mut_borrow_boxes_expr(metadata, left, boxed_vars)
            collect_scalar_mut_borrow_boxes_expr(metadata, right, boxed_vars)
        },
        HExpr::UnaryOp { operand, .. } =>
            collect_scalar_mut_borrow_boxes_expr(
                metadata, operand, boxed_vars),
        HExpr::Call { callee, callee_def_id, args, .. } => {
            let descriptor_offset = match callee {
                HExpr::FieldAccess { receiver, .. } => {
                    mark_scalar_mut_borrow_binding(
                        metadata, callee_def_id, 0, receiver, boxed_vars)
                    1
                },
                _ => 0
            }
            collect_scalar_mut_borrow_boxes_expr(
                metadata, callee, boxed_vars)
            let mut index = 0
            for arg in args {
                mark_scalar_mut_borrow_binding(metadata, callee_def_id,
                    index + descriptor_offset, arg, boxed_vars)
                collect_scalar_mut_borrow_boxes_expr(
                    metadata, arg, boxed_vars)
                index = index + 1
            }
        },
        HExpr::FieldAccess { receiver, .. } =>
            collect_scalar_mut_borrow_boxes_expr(
                metadata, receiver, boxed_vars),
        HExpr::StructLit { fields, spread, .. } => {
            for field in fields {
                collect_scalar_mut_borrow_boxes_expr(
                    metadata, field.value, boxed_vars)
            }
            match spread {
                some(value) => collect_scalar_mut_borrow_boxes_expr(
                    metadata, value, boxed_vars),
                none => {}
            }
        },
        HExpr::NamedVariantConstruct { fields, spread, .. } => {
            for field in fields {
                collect_scalar_mut_borrow_boxes_expr(
                    metadata, field.value, boxed_vars)
            }
            match spread {
                some(value) => collect_scalar_mut_borrow_boxes_expr(
                    metadata, value, boxed_vars),
                none => {}
            }
        },
        HExpr::MatchExpr { scrutinee, arms, .. } => {
            let reachable_children = enumerate_reachable_match_children(
                scrutinee, arms)
            collect_scalar_mut_borrow_boxes_expr(
                metadata, scrutinee, boxed_vars)
            for inferred_child in reachable_children {
                let child: ReachableControlChild = inferred_child
                if child.kind == REACHABLE_CHILD_MATCH_SCRUTINEE {
                } else {
                    let arm: HMatchArm = match arms.get(child.arm_index) {
                        some(value) => value,
                        none => panic(
                            "unreachable: scalar-box Match child has no arm")
                    }
                    if child.kind == REACHABLE_CHILD_ARM_GUARD {
                        match arm.guard {
                            some(guard) =>
                                collect_scalar_mut_borrow_boxes_expr(
                                    metadata, guard, boxed_vars),
                            none => panic(
                                "unreachable: scalar-box guard child has no guard")
                        }
                    } else if child.kind == REACHABLE_CHILD_ARM_BODY {
                        collect_scalar_mut_borrow_boxes_expr(
                            metadata, arm.body, boxed_vars)
                    } else {
                        panic(
                            "unreachable: invalid scalar-box Match child kind")
                    }
                }
            }
        },
        HExpr::Block { stmts, tail, .. } => {
            for stmt in stmts {
                collect_scalar_mut_borrow_boxes_stmt(
                    metadata, stmt, boxed_vars)
                if !stmt_reaches_next(stmt) { return }
            }
            match tail {
                some(value) => collect_scalar_mut_borrow_boxes_expr(
                    metadata, value, boxed_vars),
                none => {}
            }
        },
        HExpr::IfExpr { condition, then_branch, else_branch, .. } => {
            let condition_reaches_value =
                expr_has_reachable_value(condition)
            collect_scalar_mut_borrow_boxes_expr(
                metadata, condition, boxed_vars)
            if condition_reaches_value {
                collect_scalar_mut_borrow_boxes_expr(
                    metadata, then_branch, boxed_vars)
                match else_branch {
                    some(branch) => collect_scalar_mut_borrow_boxes_expr(
                        metadata, branch, boxed_vars),
                    none => {}
                }
            }
        },
        HExpr::StringInterp { parts, .. } => {
            for part in parts {
                match part {
                    HStringInterpPart::Expression(value) =>
                        collect_scalar_mut_borrow_boxes_expr(
                            metadata, value, boxed_vars),
                    HStringInterpPart::Literal(_) => {}
                }
            }
        },
        HExpr::TryCatch { body, arms, .. } => {
            collect_scalar_mut_borrow_boxes_expr(
                metadata, body, boxed_vars)
            for inferred_child in enumerate_reachable_arm_children(arms) {
                let child: ReachableControlChild = inferred_child
                let arm: HMatchArm = match arms.get(child.arm_index) {
                    some(value) => value,
                    none => panic(
                        "unreachable: scalar-box Catch child has no arm")
                }
                if child.kind == REACHABLE_CHILD_ARM_GUARD {
                    match arm.guard {
                        some(guard) => collect_scalar_mut_borrow_boxes_expr(
                            metadata, guard, boxed_vars),
                        none => panic(
                            "unreachable: scalar-box Catch guard has no guard")
                    }
                } else if child.kind == REACHABLE_CHILD_ARM_BODY {
                    collect_scalar_mut_borrow_boxes_expr(
                        metadata, arm.body, boxed_vars)
                } else {
                    panic("unreachable: invalid Catch reachable-child kind")
                }
            }
        },
        HExpr::HandleExpr { body, handlers, .. } => {
            collect_scalar_mut_borrow_boxes_expr(
                metadata, body, boxed_vars)
            for handler in handlers {
                collect_scalar_mut_borrow_boxes_handler(
                    metadata, handler, boxed_vars)
            }
        },
        HExpr::Lambda { def_id, params, body, .. } => {
            let callable_def_id = def_id
            mark_scalar_mut_borrow_params(
                metadata, some(callable_def_id), params, boxed_vars)
            collect_scalar_mut_borrow_boxes_expr(
                metadata, body, boxed_vars)
        },
        HExpr::EffectOp { args, .. } => {
            for arg in args {
                collect_scalar_mut_borrow_boxes_expr(
                    metadata, arg, boxed_vars)
            }
        },
        HExpr::RangeExpr { start, end, .. } => {
            collect_scalar_mut_borrow_boxes_expr(
                metadata, start, boxed_vars)
            collect_scalar_mut_borrow_boxes_expr(
                metadata, end, boxed_vars)
        },
        HExpr::ListLit { elements: list_elements, .. } => {
            for element in list_elements {
                collect_scalar_mut_borrow_boxes_expr(
                    metadata, element, boxed_vars)
            }
        },
        HExpr::TupleLit { elements: tuple_elements, .. } => {
            for element in tuple_elements {
                collect_scalar_mut_borrow_boxes_expr(
                    metadata, element, boxed_vars)
            }
        },
        HExpr::IndexExpr { receiver, index, .. } => {
            collect_scalar_mut_borrow_boxes_expr(
                metadata, receiver, boxed_vars)
            collect_scalar_mut_borrow_boxes_expr(
                metadata, index, boxed_vars)
        },
        HExpr::Clone { inner, .. } =>
            collect_scalar_mut_borrow_boxes_expr(
                metadata, inner, boxed_vars),
        HExpr::ReturnExpr { value, .. } => match value {
            some(returned) => collect_scalar_mut_borrow_boxes_expr(
                metadata, returned, boxed_vars),
            none => {}
        },
        HExpr::UnsafeBlock { body, .. } =>
            collect_scalar_mut_borrow_boxes_expr(
                metadata, body, boxed_vars),
        HExpr::IntLit { .. } | HExpr::FloatLit { .. } |
        HExpr::StrLit { .. } | HExpr::BoolLit { .. } |
        HExpr::Ident { .. } | HExpr::DictConstruct { .. } |
        HExpr::Take { .. } => {}
    }
}

fn collect_scalar_mut_borrow_boxes_decls(
    metadata: OwnershipMetadata, decls: List<HDecl>,
    mut boxed_vars: Set<Int>
) {
    for decl in decls {
        match decl {
            HDecl::Fn { def_id, params, body, .. } => {
                mark_scalar_mut_borrow_params(
                    metadata, def_id, params, boxed_vars)
                collect_scalar_mut_borrow_boxes_expr(
                    metadata, body, boxed_vars)
            },
            HDecl::Impl { methods, .. } =>
                collect_scalar_mut_borrow_boxes_decls(
                    metadata, methods, boxed_vars),
            HDecl::Test { body, .. } =>
                collect_scalar_mut_borrow_boxes_expr(
                    metadata, body, boxed_vars),
            HDecl::Effect { ops, .. } => {
                for op in ops {
                    match op.default_body {
                        some(body) => collect_scalar_mut_borrow_boxes_expr(
                            metadata, body, boxed_vars),
                        none => {}
                    }
                }
            },
            HDecl::Trait { methods, .. } => {
                for method in methods {
                    mark_scalar_mut_borrow_params(metadata,
                        some(method.def_id), method.params, boxed_vars)
                    match method.body {
                        some(body) => collect_scalar_mut_borrow_boxes_expr(
                            metadata, body, boxed_vars),
                        none => {}
                    }
                }
            },
            HDecl::Const { init, .. } =>
                collect_scalar_mut_borrow_boxes_expr(
                    metadata, init, boxed_vars),
            HDecl::ModBlock { decls: inner, .. } =>
                collect_scalar_mut_borrow_boxes_decls(
                    metadata, inner, boxed_vars),
            HDecl::Struct { .. } | HDecl::Enum { .. } |
            HDecl::ExternFn { .. } | HDecl::ExternType { .. } |
            HDecl::TypeAlias { .. } | HDecl::Sig { .. } => {}
        }
    }
}

fn validate_trait_callable_contracts(
    env: TypeEnv, metadata: OwnershipMetadata, mut sink: CollectingSink
) {
    let mut impl_groups = env.trait_reg.trait_impls.entries()
    impl_groups.sort_by(compare_by_first)
    for group in impl_groups {
        let (_, impls) = group
        for impl_entry in impls {
            match env.trait_reg.traits.get(impl_entry.trait_name) {
                some(trait_def) => {
                    for trait_method in trait_def.methods {
                        match impl_entry.method_schemes.get(trait_method.name) {
                            some(impl_scheme) => match impl_scheme.def_id {
                                some(impl_def_id) => match (
                                    metadata.callable_by_def_id.get(impl_def_id),
                                    metadata.callable_by_def_id.get(
                                        trait_method.def_id)) {
                                    (some(actual_term), some(expected_term)) => {
                                        // An omitted default specialization
                                        // retains the trait method's inference
                                        // term. Publication overwrites the
                                        // declaration DefId with its exact
                                        // descriptor, while the specialization
                                        // still resolves through that term.
                                        let actual =
                                            require_exact_callable_ownership_term(
                                                metadata, actual_term)
                                        let expected =
                                            require_exact_callable_ownership_term(
                                                metadata, expected_term)
                                        if actual != expected {
                                            report_ownership_error(sink,
                                                "trait method ownership contract mismatch",
                                                impl_entry.span,
                                                "impl Borrow/MutBorrow/Move modes must exactly match the trait declaration")
                                        }
                                    },
                                    _ => panic(
                                        "unreachable: trait/impl callable ownership metadata is missing")
                                },
                                none => panic(
                                    "unreachable: trait impl method has no exact DefId")
                            },
                            none => {}
                        }
                    }
                },
                none => panic(
                    "unreachable: trait impl references an unknown trait DefId")
            }
        }
    }
}

fn validate_callable_alias_contracts(
    mut table: CallableSolveTable, metadata: OwnershipMetadata,
    mut sink: CollectingSink
) {
    let mut aliases = table.alias_targets.entries()
    aliases.sort_by(compare_int_key)
    for entry in aliases {
        let (slot_def_id, _) = entry
        let span = table.alias_spans.get(slot_def_id).unwrap_or(
            synthetic_ownership_span())
        match resolve_callable_contract_for_def_id(
                table, metadata, slot_def_id) {
            CallableContractResolution::Exact { .. } => match
                    resolve_callable_transfer_for_def_id(
                        table, metadata, slot_def_id) {
                CallableTransferResolution::Exact { .. } => {},
                _ => panic(
                    "unreachable: exact callable alias has no transfer authority")
            },
            CallableContractResolution::Conflict { recovery } => {
                let untrusted_slot_def_id = slot_def_id
                table.untrusted_callable_slots.insert(
                    untrusted_slot_def_id, true)
                let diagnosed_slot_def_id = slot_def_id
                table.diagnosed_callable_slots.insert(
                    diagnosed_slot_def_id, true)
                report_ownership_error(sink,
                    "callable alias has incompatible ownership targets",
                    span,
                    "parameter and return ownership must both match before targets may share one binding")
                // Diagnostics stop code generation, but the checker still
                // executes the freeze barrier. Publish the first exact base as
                // deterministic recovery so transitive aliases never turn a
                // user mismatch into a later ICE.
                publish_solved_callable_ownership(
                    metadata, slot_def_id, recovery,
                    CALLABLE_SOURCE_ERROR_RECOVERY,
                    recovery_transfer_levels(recovery,
                        table.callable_arities.get(slot_def_id).unwrap_or(0)),
                    sink, span)
            },
            CallableContractResolution::NoBase => {
                let untrusted_slot_def_id = slot_def_id
                table.untrusted_callable_slots.insert(
                    untrusted_slot_def_id, true)
                // Retained dead HIR still needs deterministic metadata, but an
                // interface-only producer that cannot run is not a semantic
                // call edge. Diagnose NoBase when this exact slot is invoked
                // on a reachable path or would otherwise cross an export
                // boundary as fake producer authority.
                let reachable_alias =
                    table.reachable_callee_spans.contains_key(slot_def_id)
                let durable_alias =
                    table.durable_callable_spans.contains_key(slot_def_id)
                if reachable_alias || durable_alias {
                    let diagnosed_slot_def_id = slot_def_id
                    table.diagnosed_callable_slots.insert(
                        diagnosed_slot_def_id, true)
                    if durable_alias && !reachable_alias {
                        report_ownership_error(sink,
                            "callable constant has no exact ownership source",
                            span,
                            "a durable callable value requires DefId-keyed producer provenance before it can be used or re-exported")
                    } else {
                        report_ownership_error(sink,
                            "callable alias has no exact ownership source",
                            span,
                            "bind or annotate the callable source before assigning it")
                    }
                }
                // NoBase is a proof failure, so even an exact-looking cached
                // constraint is not authoritative recovery.  In particular it
                // may still be an unresolved inference term; requiring it here
                // would turn a user-facing mismatch into an ICE.
                let recovery = CALLABLE_BORROW_OWNED
                publish_solved_callable_ownership(
                    metadata, slot_def_id, recovery,
                    CALLABLE_SOURCE_ERROR_RECOVERY,
                    recovery_transfer_levels(recovery,
                        table.callable_arities.get(slot_def_id).unwrap_or(0)),
                    sink, span)
            },
            CallableContractResolution::BackEdge => panic(
                "unreachable: callable alias resolution leaked DFS bottom")
        }
    }
}

fn resolved_callable_recovery_term(
    metadata: OwnershipMetadata, term: Int
) -> Int? {
    let resolved = resolve_callable_ownership_term(metadata, term)
    if resolved == CALLABLE_UNKNOWN ||
       !is_resolved_callable_ownership_term(metadata, resolved) {
        none
    } else {
        some(resolved)
    }
}

fn callable_recovery_contract_for_def_id(
    table: CallableSolveTable, metadata: OwnershipMetadata, def_id: Int
) -> Int {
    match table.callable_contracts.get(def_id) {
        some(term) => match resolved_callable_recovery_term(metadata, term) {
            some(exact) => return exact,
            none => {}
        },
        none => {}
    }
    match metadata.callable_by_def_id.get(def_id) {
        some(term) => match resolved_callable_recovery_term(metadata, term) {
            some(exact) => return exact,
            none => {}
        },
        none => {}
    }
    CALLABLE_BORROW_OWNED
}

fn synthetic_ownership_span() -> Span {
    span_zero()
}

fn collect_callable_return_stmt(
    stmt: HStmt, mut out: List<HExpr>
) {
    match stmt {
        HStmt::Return { value, .. } => match value {
            some(returned) => collect_callable_return_value(
                returned, true, out),
            none => {}
        },
        HStmt::Let { init, .. } =>
            collect_callable_return_value(init, false, out),
        HStmt::Var { init, .. } =>
            collect_callable_return_value(init, false, out),
        HStmt::ExprStmt { expr: init, .. } =>
            collect_callable_return_value(init, false, out),
        HStmt::LetDestructure { init, .. } =>
            collect_callable_return_value(init, false, out),
        HStmt::Assign { target, value, .. } => {
            collect_callable_return_value(target, false, out)
            collect_callable_return_value(value, false, out)
        },
        HStmt::While { condition, body, .. } => {
            let reachability_condition = condition
            let semantic_condition = condition
            let condition_reaches_value =
                expr_has_reachable_value(reachability_condition)
            collect_callable_return_value(semantic_condition, false, out)
            if condition_reaches_value {
                collect_callable_return_value(body, false, out)
            }
        },
        HStmt::ForIn { iterable, body, .. } => {
            let reachability_iterable = iterable
            let semantic_iterable = iterable
            let iterable_reaches_value =
                expr_has_reachable_value(reachability_iterable)
            collect_callable_return_value(semantic_iterable, false, out)
            if iterable_reaches_value {
                collect_callable_return_value(body, false, out)
            }
        },
        HStmt::IfLet { expr, then_block, else_block, .. } => {
            let reachability_expr = expr
            let semantic_expr = expr
            let expr_reaches_value =
                expr_has_reachable_value(reachability_expr)
            collect_callable_return_value(semantic_expr, false, out)
            if expr_reaches_value {
                collect_callable_return_value(then_block, false, out)
                match else_block {
                    some(branch) => collect_callable_return_value(
                        branch, false, out),
                    none => {}
                }
            }
        },
        HStmt::Break { .. } | HStmt::Continue { .. } |
        HStmt::Drop { .. } => {}
    }
}

fn collect_callable_return_value(
    expr: HExpr, is_tail: Bool, mut out: List<HExpr>
) {
    match expr {
        HExpr::Block { stmts, tail, .. } => {
            for stmt in stmts {
                collect_callable_return_stmt(stmt, out)
                // A Return/Never statement may itself contribute the real
                // returned callable. Nothing after that edge is a return
                // provenance candidate for this callable.
                if !stmt_reaches_next(stmt) { return }
            }
            match tail {
                some(value) => collect_callable_return_value(
                    value, is_tail, out),
                none => {}
            }
        },
        HExpr::IfExpr { condition, then_branch, else_branch, .. } => {
            let has_else = match else_branch {
                some(_) => true,
                none => false
            }
            let children = enumerate_reachable_if_children(
                condition, has_else)
            for inferred_child in children {
                let child: ReachableControlChild = inferred_child
                if child.kind == REACHABLE_CHILD_IF_CONDITION {
                    collect_callable_return_value(condition, false, out)
                } else if child.kind == REACHABLE_CHILD_IF_THEN {
                    collect_callable_return_value(then_branch, is_tail, out)
                } else if child.kind == REACHABLE_CHILD_IF_ELSE {
                    match else_branch {
                        some(branch) => collect_callable_return_value(
                            branch, is_tail, out),
                        none => panic(
                            "unreachable: reachable else child has no branch")
                    }
                } else {
                    panic(
                        "unreachable: invalid If reachable-child kind")
                }
            }
        },
        HExpr::MatchExpr { scrutinee, arms, .. } => {
            let children = enumerate_reachable_match_children(
                scrutinee, arms)
            for inferred_child in children {
                let child: ReachableControlChild = inferred_child
                if child.kind == REACHABLE_CHILD_MATCH_SCRUTINEE {
                    collect_callable_return_value(scrutinee, false, out)
                } else if child.kind == REACHABLE_CHILD_ARM_GUARD {
                    let arm: HMatchArm = match arms.get(child.arm_index) {
                        some(value) => value,
                        none => panic(
                            "unreachable: reachable Match child has no arm")
                    }
                    match arm.guard {
                        some(guard) => collect_callable_return_value(
                            guard, false, out),
                        none => panic(
                            "unreachable: reachable guard child has no guard")
                    }
                } else if child.kind == REACHABLE_CHILD_ARM_BODY {
                    let arm: HMatchArm = match arms.get(child.arm_index) {
                        some(value) => value,
                        none => panic(
                            "unreachable: reachable Match child has no arm")
                    }
                    collect_callable_return_value(arm.body, is_tail, out)
                } else {
                    panic(
                        "unreachable: invalid Match reachable-child kind")
                }
            }
        },
        HExpr::TryCatch { body, arms, .. } => {
            collect_callable_return_value(body, is_tail, out)
            for inferred_child in enumerate_reachable_arm_children(arms) {
                let child: ReachableControlChild = inferred_child
                let arm: HMatchArm = match arms.get(child.arm_index) {
                    some(value) => value,
                    none => panic(
                        "unreachable: callable-return Catch child has no arm")
                }
                if child.kind == REACHABLE_CHILD_ARM_GUARD {
                    match arm.guard {
                        some(guard) => collect_callable_return_value(
                            guard, false, out),
                        none => panic(
                            "unreachable: callable-return Catch guard has no guard")
                    }
                } else if child.kind == REACHABLE_CHILD_ARM_BODY {
                    collect_callable_return_value(arm.body, is_tail, out)
                } else {
                    panic("unreachable: invalid Catch reachable-child kind")
                }
            }
        },
        HExpr::UnsafeBlock { body, .. } =>
            collect_callable_return_value(body, is_tail, out),
        HExpr::ReturnExpr { value, .. } => match value {
            some(returned) => collect_callable_return_value(
                returned, true, out),
            none => {}
        },
        HExpr::Lambda { .. } => {
            if is_tail && fn_type_ownership(hexpr_type(expr)).is_some() {
                let return_candidate = expr
                out.push(return_candidate)
            }
        },
        HExpr::BinOp { left, right, .. } => {
            collect_callable_return_value(left, false, out)
            collect_callable_return_value(right, false, out)
        },
        HExpr::UnaryOp { operand, .. } =>
            collect_callable_return_value(operand, false, out),
        HExpr::Call { callee, args, .. } => {
            if is_tail && fn_type_ownership(hexpr_type(expr)).is_some() {
                let return_candidate = expr
                out.push(return_candidate)
            }
            collect_callable_return_value(callee, false, out)
            for arg in args {
                collect_callable_return_value(arg, false, out)
            }
        },
        HExpr::FieldAccess { receiver, .. } => {
            if is_tail && fn_type_ownership(hexpr_type(expr)).is_some() {
                let return_candidate = expr
                out.push(return_candidate)
            }
            collect_callable_return_value(receiver, false, out)
        },
        HExpr::StructLit { fields, spread, .. } => {
            for field in fields {
                collect_callable_return_value(field.value, false, out)
            }
            match spread {
                some(source) => collect_callable_return_value(
                    source, false, out),
                none => {}
            }
        },
        HExpr::NamedVariantConstruct { fields, spread, .. } => {
            for field in fields {
                collect_callable_return_value(field.value, false, out)
            }
            match spread {
                some(source) => collect_callable_return_value(
                    source, false, out),
                none => {}
            }
        },
        HExpr::StringInterp { parts, .. } => {
            for part in parts {
                match part {
                    HStringInterpPart::Expression(value) =>
                        collect_callable_return_value(value, false, out),
                    HStringInterpPart::Literal(_) => {}
                }
            }
        },
        HExpr::HandleExpr { body, .. } =>
            collect_callable_return_value(body, is_tail, out),
        HExpr::EffectOp { args, .. } => {
            for arg in args {
                collect_callable_return_value(arg, false, out)
            }
        },
        HExpr::RangeExpr { start, end, .. } => {
            collect_callable_return_value(start, false, out)
            collect_callable_return_value(end, false, out)
        },
        HExpr::ListLit { elements, .. } => {
            for element in elements {
                collect_callable_return_value(element, false, out)
            }
        },
        HExpr::TupleLit { elements, .. } => {
            for element in elements {
                collect_callable_return_value(element, false, out)
            }
        },
        HExpr::IndexExpr { receiver, index, .. } => {
            if is_tail && fn_type_ownership(hexpr_type(expr)).is_some() {
                let return_candidate = expr
                out.push(return_candidate)
            }
            collect_callable_return_value(receiver, false, out)
            collect_callable_return_value(index, false, out)
        },
        HExpr::Clone { inner, .. } => {
            if is_tail && fn_type_ownership(hexpr_type(expr)).is_some() {
                let return_candidate = expr
                out.push(return_candidate)
            }
            collect_callable_return_value(inner, false, out)
        },
        HExpr::Ident { .. } => {
            if is_tail && fn_type_ownership(hexpr_type(expr)).is_some() {
                let return_candidate = expr
                out.push(return_candidate)
            }
        },
        HExpr::Take { .. } => {
            if is_tail && fn_type_ownership(hexpr_type(expr)).is_some() {
                let return_candidate = expr
                out.push(return_candidate)
            }
        },
        HExpr::DictConstruct { .. } |
        HExpr::IntLit { .. } | HExpr::FloatLit { .. } |
        HExpr::StrLit { .. } | HExpr::BoolLit { .. } => {}
    }
}

fn append_solver_alias_target(
    mut table: CallableSolveTable, target_id: Int, source_id: Int
) {
    if target_id == source_id { return }
    match table.alias_targets.get(target_id) {
        some(existing) => if !list_has_def_id(existing, source_id) {
            existing.push(source_id)
            table.alias_edge_count = table.alias_edge_count + 1
        },
        none => {
            table.alias_targets.insert(target_id, [source_id])
            table.alias_edge_count = table.alias_edge_count + 1
        }
    }
}

// Return values are solver edges. A return FnType whose ownership term is still
// an inference term may be finalized from those edges; an exact term came from
// an explicit annotation and remains a fixed expected contract.
fn prepare_callable_return_edges(mut table: CallableSolveTable) {
    for def_id in table.order {
        match table.states.get(def_id) {
            some(state) => match state.return_callable_contract {
                some(_) => {
                    let mut returned: List<HExpr> = []
                    collect_callable_return_value(state.body, true, returned)
                    let mut sources: List<Int> = []
                    let mut exact = returned.len() > 0
                    for value in returned {
                        if collect_callable_identity_sources(value, sources) == false {
                            exact = false
                        }
                    }
                    if exact && sources.len() > 0 {
                        let return_def_id = def_id
                        table.return_targets.insert(return_def_id, sources)
                        table.opaque_callable_returns.remove(def_id)
                    } else {
                        let opaque_def_id = def_id
                        table.opaque_callable_returns.insert(
                            opaque_def_id, true)
                    }
                },
                none => {}
            },
            none => {}
        }
    }
}

fn collect_return_targets_for_callee(
    table: CallableSolveTable, def_id: Int, visited: List<Int>,
    fuel: Int, mut out: List<Int>
) -> Bool {
    if fuel <= 0 { return false }
    if table.untrusted_callable_slots.contains_key(def_id) ||
       table.opaque_callable_slots.contains_key(def_id) {
        return false
    }
    // An alias SCC back-edge is neutral. The top-level caller additionally
    // requires at least one concrete target, so a pure cycle cannot become
    // accidental proof.
    if list_has_def_id(visited, def_id) { return true }
    let next_visited = visited.concat([def_id])
    let mut found_route = false
    let mut all_exact = true
    match table.return_targets.get(def_id) {
        some(targets) => {
            found_route = targets.len() > 0
            for target in targets {
                if !list_has_def_id(out, target) {
                    let return_target = target
                    out.push(return_target)
                }
            }
        },
        none => {}
    }
    match table.alias_targets.get(def_id) {
        some(targets) => {
            if targets.len() > 0 { found_route = true }
            for target in targets {
                if !collect_return_targets_for_callee(table, target,
                        next_visited, fuel - 1, out) {
                    all_exact = false
                }
            }
        },
        none => {}
    }
    found_route && all_exact
}

fn local_callee_has_callable_return(
    table: CallableSolveTable, def_id: Int, visited: List<Int>, fuel: Int
) -> Bool {
    if fuel <= 0 || list_has_def_id(visited, def_id) { return false }
    if table.const_callable_types.contains_key(def_id) { return true }
    let next_visited = visited.concat([def_id])
    match table.states.get(def_id) {
        some(state) => if state.return_callable_contract.is_some() {
            return true
        },
        none => {}
    }
    match table.alias_targets.get(def_id) {
        some(targets) => {
            for target in targets {
                if local_callee_has_callable_return(
                        table, target, next_visited, fuel - 1) {
                    return true
                }
            }
        },
        none => {}
    }
    false
}

// A callable-valued Call may use its nested FnType as an exact return contract
// only when the callee itself carries durable implementation/interface
// authority. A callable parameter or conservative interface slot has merely a
// call-site constraint; matching surface descriptors cannot prove which
// callable identity it returns. Alias traversal is all-or-nothing so one
// opaque branch poisons the whole factory result.
fn callee_return_type_is_authoritative(
    table: CallableSolveTable, metadata: OwnershipMetadata,
    def_id: Int, visited: List<Int>, fuel: Int
) -> Bool {
    if fuel <= 0 || list_has_def_id(visited, def_id) { return false }
    if table.untrusted_callable_slots.contains_key(def_id) ||
       table.opaque_callable_slots.contains_key(def_id) {
        return false
    }
    let next_visited = visited.concat([def_id])
    match table.alias_targets.get(def_id) {
        some(targets) => if targets.len() > 0 {
            for target in targets {
                if !callee_return_type_is_authoritative(
                        table, metadata, target, next_visited, fuel - 1) {
                    return false
                }
            }
            return true
        },
        none => {}
    }
    // An authoritative callable-valued result can itself be invoked as a
    // factory. Follow its producer proof rather than promoting the result's
    // checker-local CALL_CONSTRAINT term.
    match table.call_result_callees.get(def_id) {
        some(callee_id) => return callee_return_type_is_authoritative(
            table, metadata, callee_id, next_visited, fuel - 1),
        none => {}
    }
    if table.states.contains_key(def_id) { return false }
    let term = match metadata.callable_by_def_id.get(def_id) {
        some(found) => found,
        none => return false
    }
    if term == CALLABLE_UNKNOWN ||
       is_callable_ownership_inference_term(term) {
        return false
    }
    let source_is_authoritative = match metadata.callable_state_by_def_id.get(
            def_id) {
        some(state) => state.source != CALLABLE_SOURCE_CALL_CONSTRAINT &&
            state.source != CALLABLE_SOURCE_CONSERVATIVE_INTERFACE &&
            state.source != CALLABLE_SOURCE_ERROR_RECOVERY,
        none => false
    }
    if !source_is_authoritative { return false }
    match metadata.returned_callable_result_role_by_def_id.get(def_id) {
        some(role) => role != CALLABLE_RESULT_ROLE_UNKNOWN,
        none => false
    }
}

fn refresh_call_result_edges(
    mut table: CallableSolveTable, metadata: OwnershipMetadata
) {
    let fuel = solver_alias_edge_count(table) + table.order.len() + 2
    for entry in table.call_result_callees.entries() {
        let (result_id, callee_id) = entry
        let mut targets: List<Int> = []
        let exact = collect_return_targets_for_callee(
            table, callee_id, [], fuel, targets)
        if exact && targets.len() > 0 {
            for target in targets {
                let alias_result_id = result_id
                let alias_target = target
                append_solver_alias_target(
                    table, alias_result_id, alias_target)
            }
            table.untrusted_callable_slots.remove(result_id)
            table.opaque_callable_slots.remove(result_id)
        } else if local_callee_has_callable_return(
                table, callee_id, [], fuel) {
            // A local body was available but its returned producer could not
            // be reduced to exact DefIds.  Do not publish the stale Call type.
            let untrusted_result_id = result_id
            table.untrusted_callable_slots.insert(untrusted_result_id, true)
            let opaque_result_id = result_id
            table.opaque_callable_slots.insert(opaque_result_id, true)
        } else if callee_return_type_is_authoritative(
                table, metadata, callee_id, [], fuel) {
            // Imported/bodyless authorities retain their frozen nested return
            // contract without inventing a local return-target edge.
            table.untrusted_callable_slots.remove(result_id)
            table.opaque_callable_slots.remove(result_id)
        } else {
            let untrusted_result_id = result_id
            table.untrusted_callable_slots.insert(untrusted_result_id, true)
            let opaque_result_id = result_id
            table.opaque_callable_slots.insert(opaque_result_id, true)
        }
    }
}

fn callable_value_contract(
    table: CallableSolveTable, metadata: OwnershipMetadata,
    expr: HExpr, arity: Int
) -> Int? {
    match expr {
        HExpr::Ident { def_id: some(def_id), .. } =>
            callable_contract_for_def_id(table, metadata, def_id),
        HExpr::Lambda { def_id, .. } =>
            metadata.callable_by_def_id.get(def_id),
        HExpr::Call { callable_result_def_id: some(def_id), .. } =>
            metadata.callable_by_def_id.get(def_id),
        HExpr::Call { callable_result_def_id: none, .. } |
        HExpr::FieldAccess { .. } | HExpr::IndexExpr { .. } => none,
        HExpr::Clone { inner, .. } =>
            callable_value_contract(table, metadata, inner, arity),
        _ => fn_type_ownership(hexpr_type(expr))
    }
}

fn merge_callable_contract_resolution(
    left: CallableContractResolution,
    right: CallableContractResolution
) -> CallableContractResolution {
    match (left, right) {
        (CallableContractResolution::NoBase, _) =>
            CallableContractResolution::NoBase,
        (_, CallableContractResolution::NoBase) =>
            CallableContractResolution::NoBase,
        (CallableContractResolution::Conflict { recovery }, _) =>
            CallableContractResolution::Conflict {
                recovery: recovery
            },
        (_, CallableContractResolution::Conflict { recovery }) =>
            CallableContractResolution::Conflict {
                recovery: recovery
            },
        (CallableContractResolution::BackEdge, value) => {
            let merged_value = value
            merged_value
        },
        (value, CallableContractResolution::BackEdge) => {
            let merged_value = value
            merged_value
        },
        (CallableContractResolution::Exact { term: first },
         CallableContractResolution::Exact { term: second }) => {
            if first == second {
                CallableContractResolution::Exact { term: first }
            } else {
                CallableContractResolution::Conflict { recovery: first }
            }
        }
    }
}

fn callable_contract_base(
    table: CallableSolveTable, metadata: OwnershipMetadata, def_id: Int
) -> CallableContractResolution {
    match table.states.get(def_id) {
        some(state) => return CallableContractResolution::Exact {
            term: intern_callable_param_modes(metadata, state.modes)
        },
        none => {}
    }
    // CALL_CONSTRAINT metadata and callable_contracts are recovery annotations,
    // not proof. An untrusted leaf must stay bottom even when either happens to
    // contain an exact-looking stale tag.
    if table.untrusted_callable_slots.contains_key(def_id) ||
       table.opaque_callable_slots.contains_key(def_id) {
        return CallableContractResolution::NoBase
    }
    match metadata.callable_by_def_id.get(def_id) {
        some(term) => return CallableContractResolution::Exact {
            term: require_exact_callable_ownership_term(metadata, term)
        },
        none => {}
    }
    match table.callable_contracts.get(def_id) {
        some(term) => CallableContractResolution::Exact {
            term: require_exact_callable_ownership_term(metadata, term)
        },
        none => CallableContractResolution::NoBase
    }
}

fn callable_contract_for_def_id_inner(
    table: CallableSolveTable, metadata: OwnershipMetadata,
    def_id: Int, active: List<Int>, mut settled: Set<Int>
) -> CallableContractResolution {
    // Back-edges are the expected representation of an alias SCC.  Returning
    // bottom here lets any concrete base reachable from another SCC edge flow
    // around the cycle instead of poisoning the whole component.
    if list_has_def_id(active, def_id) || settled.contains(def_id) {
        return CallableContractResolution::BackEdge
    }
    if table.opaque_callable_slots.contains_key(def_id) {
        return CallableContractResolution::NoBase
    }
    let next_active = active.concat([def_id])
    let mut result = CallableContractResolution::BackEdge
    let mut has_alias_edge = false
    match table.alias_targets.get(def_id) {
        some(targets) => {
            has_alias_edge = targets.len() > 0
            for target in targets {
                let next_target = target
                result = merge_callable_contract_resolution(result,
                    callable_contract_for_def_id_inner(
                        table, metadata, next_target, next_active, settled))
            }
        },
        none => {}
    }
    if !has_alias_edge {
        result = merge_callable_contract_resolution(result,
            callable_contract_base(table, metadata, def_id))
    }
    settled.insert(def_id)
    result
}

fn resolve_callable_contract_for_def_id(
    table: CallableSolveTable, metadata: OwnershipMetadata, def_id: Int
) -> CallableContractResolution {
    let mut settled: Set<Int> = set_new()
    let root_def_id = def_id
    match callable_contract_for_def_id_inner(
            table, metadata, root_def_id, [], settled) {
        CallableContractResolution::BackEdge =>
            CallableContractResolution::NoBase,
        result => {
            let final_result = result
            final_result
        }
    }
}

fn callable_contract_for_def_id(
    table: CallableSolveTable, metadata: OwnershipMetadata, def_id: Int
) -> Int? {
    match resolve_callable_contract_for_def_id(table, metadata, def_id) {
        CallableContractResolution::Exact { term } => {
            let exact_term = term
            some(exact_term)
        },
        CallableContractResolution::Conflict { .. } |
        CallableContractResolution::NoBase |
        CallableContractResolution::BackEdge => none
    }
}

fn returned_callable_transfer_levels(
    levels: List<CallableTransferLevel>
) -> List<CallableTransferLevel> {
    let mut result: List<CallableTransferLevel> = []
    let mut index = 1
    while index < levels.len() {
        match levels.get(index) {
            some(level) => {
                let mut forces: List<Bool> = []
                for force in level.force_params {
                    let copied_force = force
                    forces.push(copied_force)
                }
                result.push(callable_transfer_level(
                    level.ownership_term, forces))
            },
            none => panic(
                "unreachable: missing returned callable transfer level")
        }
        index = index + 1
    }
    result
}

fn merge_callable_transfer_resolution(
    metadata: OwnershipMetadata,
    left: CallableTransferResolution,
    right: CallableTransferResolution
) -> CallableTransferResolution {
    match (left, right) {
        (CallableTransferResolution::NoBase, _) |
        (_, CallableTransferResolution::NoBase) =>
            CallableTransferResolution::NoBase,
        (CallableTransferResolution::BackEdge, value) => value,
        (value, CallableTransferResolution::BackEdge) => value,
        (CallableTransferResolution::Exact { levels: first },
         CallableTransferResolution::Exact { levels: second }) =>
            CallableTransferResolution::Exact {
                levels: join_callable_transfer_levels(
                    metadata, first, second)
            }
    }
}

fn callable_transfer_base(
    table: CallableSolveTable, metadata: OwnershipMetadata, def_id: Int
) -> CallableTransferResolution {
    if table.untrusted_callable_slots.contains_key(def_id) ||
       table.opaque_callable_slots.contains_key(def_id) {
        return CallableTransferResolution::NoBase
    }
    match callable_transfer_levels_for_def_id(metadata, def_id) {
        some(levels) => if levels.len() > 0 {
            return CallableTransferResolution::Exact { levels: levels }
        },
        none => {}
    }
    match table.states.get(def_id) {
        some(state) => {
            let term = intern_callable_param_modes(metadata, state.modes)
            return CallableTransferResolution::Exact {
                levels: direct_transfer_levels(term, state.force_params)
            }
        },
        none => {}
    }
    match table.callable_types.get(def_id) {
        some(ty) => {
            let levels = callable_interface_transfer_levels(metadata, ty)
            if levels.len() > 0 {
                return CallableTransferResolution::Exact { levels: levels }
            }
        },
        none => {}
    }
    CallableTransferResolution::NoBase
}

fn callable_transfer_for_def_id_inner(
    table: CallableSolveTable, metadata: OwnershipMetadata,
    def_id: Int, active: List<Int>, mut settled: Set<Int>
) -> CallableTransferResolution {
    if list_has_def_id(active, def_id) || settled.contains(def_id) {
        return CallableTransferResolution::BackEdge
    }
    if table.opaque_callable_slots.contains_key(def_id) {
        return CallableTransferResolution::NoBase
    }
    let next_active = active.concat([def_id])
    let mut result = CallableTransferResolution::BackEdge
    let mut has_alias_edge = false
    match table.alias_targets.get(def_id) {
        some(targets) => {
            has_alias_edge = targets.len() > 0
            for target in targets {
                let target_def_id = target
                result = merge_callable_transfer_resolution(
                    metadata, result,
                    callable_transfer_for_def_id_inner(
                        table, metadata, target_def_id, next_active, settled))
            }
        },
        none => {}
    }
    if !has_alias_edge {
        match table.call_result_callees.get(def_id) {
            some(callee_id) => {
                let returned_resolution = match
                        callable_transfer_for_def_id_inner(
                            table, metadata, callee_id,
                            next_active, settled) {
                    CallableTransferResolution::Exact { levels } => {
                        let returned = returned_callable_transfer_levels(levels)
                        if returned.len() > 0 {
                            CallableTransferResolution::Exact {
                                levels: returned
                            }
                        } else {
                            CallableTransferResolution::NoBase
                        }
                    },
                    CallableTransferResolution::NoBase =>
                        CallableTransferResolution::NoBase,
                    CallableTransferResolution::BackEdge =>
                        CallableTransferResolution::BackEdge
                }
                result = merge_callable_transfer_resolution(
                    metadata, result, returned_resolution)
            },
            none => {
                result = merge_callable_transfer_resolution(
                    metadata, result,
                    callable_transfer_base(table, metadata, def_id))
            }
        }
    }
    settled.insert(def_id)
    result
}

fn resolve_callable_transfer_for_def_id(
    table: CallableSolveTable, metadata: OwnershipMetadata, def_id: Int
) -> CallableTransferResolution {
    let mut settled: Set<Int> = set_new()
    let root_def_id = def_id
    match callable_transfer_for_def_id_inner(
            table, metadata, root_def_id, [], settled) {
        CallableTransferResolution::BackEdge =>
            CallableTransferResolution::NoBase,
        result => result
    }
}

fn merge_callable_result_role_resolution(
    left: CallableResultRoleResolution,
    right: CallableResultRoleResolution
) -> CallableResultRoleResolution {
    match (left, right) {
        (CallableResultRoleResolution::Unknown, _) |
        (_, CallableResultRoleResolution::Unknown) =>
            CallableResultRoleResolution::Unknown,
        (CallableResultRoleResolution::BackEdge, value) => {
            let merged_value = value
            merged_value
        },
        (value, CallableResultRoleResolution::BackEdge) => {
            let merged_value = value
            merged_value
        },
        (CallableResultRoleResolution::Exact { role: first },
         CallableResultRoleResolution::Exact { role: second }) => {
            if first == second {
                CallableResultRoleResolution::Exact { role: first }
            } else {
                CallableResultRoleResolution::Unknown
            }
        }
    }
}

fn metadata_callable_result_role(
    metadata: OwnershipMetadata, def_id: Int, returned: Bool
) -> CallableResultRoleResolution {
    let role = if returned {
        metadata.returned_callable_result_role_by_def_id.get(def_id)
    } else {
        metadata.callable_result_role_by_def_id.get(def_id)
    }
    match role {
        some(value) => {
            if value == CALLABLE_RESULT_ROLE_NONE {
                CallableResultRoleResolution::Exact {
                    role: CALLABLE_RESULT_ROLE_NONE
                }
            } else if value == CALLABLE_RESULT_ROLE_FRESH_OWNED_SLOT {
                CallableResultRoleResolution::Exact {
                    role: CALLABLE_RESULT_ROLE_FRESH_OWNED_SLOT
                }
            } else if value == CALLABLE_RESULT_ROLE_UNKNOWN {
                CallableResultRoleResolution::Unknown
            } else {
                panic("unreachable: invalid callable result role")
            }
        },
        none => CallableResultRoleResolution::Unknown
    }
}

fn callable_result_role_for_def_id_inner(
    table: CallableSolveTable, metadata: OwnershipMetadata, def_id: Int,
    direct_active: List<Int>, returned_active: List<Int>
) -> CallableResultRoleResolution {
    if list_has_def_id(direct_active, def_id) {
        return CallableResultRoleResolution::BackEdge
    }
    if table.untrusted_callable_slots.contains_key(def_id) ||
       table.opaque_callable_slots.contains_key(def_id) {
        return CallableResultRoleResolution::Unknown
    }
    let next_direct = direct_active.concat([def_id])
    match table.alias_targets.get(def_id) {
        some(targets) => if targets.len() > 0 {
            let mut result = CallableResultRoleResolution::BackEdge
            for target in targets {
                result = merge_callable_result_role_resolution(result,
                    callable_result_role_for_def_id_inner(table, metadata,
                        target, next_direct, returned_active))
            }
            return match result {
                CallableResultRoleResolution::BackEdge =>
                    CallableResultRoleResolution::Unknown,
                value => {
                    let final_result = value
                    final_result
                }
            }
        },
        none => {}
    }
    // A callable-valued call receives a fresh synthetic DefId.  Imported
    // factories have no body-local alias edge, so instantiate their exact
    // returned-callable summary here.
    match table.call_result_callees.get(def_id) {
        some(callee_id) => return returned_callable_result_role_for_def_id_inner(
            table, metadata, callee_id, next_direct, returned_active),
        none => {}
    }
    metadata_callable_result_role(metadata, def_id, false)
}

fn returned_callable_result_role_for_def_id_inner(
    table: CallableSolveTable, metadata: OwnershipMetadata, def_id: Int,
    direct_active: List<Int>, returned_active: List<Int>
) -> CallableResultRoleResolution {
    if list_has_def_id(returned_active, def_id) {
        return CallableResultRoleResolution::BackEdge
    }
    if table.untrusted_callable_slots.contains_key(def_id) ||
       table.opaque_callable_slots.contains_key(def_id) {
        return CallableResultRoleResolution::Unknown
    }
    let next_returned = returned_active.concat([def_id])
    match table.alias_targets.get(def_id) {
        some(targets) => if targets.len() > 0 {
            let mut result = CallableResultRoleResolution::BackEdge
            for target in targets {
                result = merge_callable_result_role_resolution(result,
                    returned_callable_result_role_for_def_id_inner(
                        table, metadata, target, direct_active,
                        next_returned))
            }
            return match result {
                CallableResultRoleResolution::BackEdge =>
                    CallableResultRoleResolution::Unknown,
                value => {
                    let final_result = value
                    final_result
                }
            }
        },
        none => {}
    }
    if table.opaque_callable_returns.contains_key(def_id) {
        return CallableResultRoleResolution::Unknown
    }
    match table.return_targets.get(def_id) {
        some(targets) => if targets.len() > 0 {
            let mut result = CallableResultRoleResolution::BackEdge
            for target in targets {
                result = merge_callable_result_role_resolution(result,
                    callable_result_role_for_def_id_inner(table, metadata,
                        target, direct_active, next_returned))
            }
            return match result {
                CallableResultRoleResolution::BackEdge =>
                    CallableResultRoleResolution::Unknown,
                value => {
                    let final_result = value
                    final_result
                }
            }
        },
        none => {}
    }
    metadata_callable_result_role(metadata, def_id, true)
}

fn resolved_callable_result_role(
    resolution: CallableResultRoleResolution
) -> Int {
    match resolution {
        CallableResultRoleResolution::Exact { role } => role,
        CallableResultRoleResolution::Unknown |
        CallableResultRoleResolution::BackEdge =>
            CALLABLE_RESULT_ROLE_UNKNOWN
    }
}

fn callable_result_role_at_depth_inner(
    table: CallableSolveTable, metadata: OwnershipMetadata,
    def_id: Int, depth: Int, active: List<Str>, fuel: Int
) -> CallableResultRoleResolution {
    if fuel <= 0 { return CallableResultRoleResolution::Unknown }
    let key = "${def_id.to_str()}:${depth.to_str()}"
    if active.any(fn(existing) { existing == key }) {
        return CallableResultRoleResolution::BackEdge
    }
    if table.untrusted_callable_slots.contains_key(def_id) ||
       table.opaque_callable_slots.contains_key(def_id) ||
       (depth > 0 && table.opaque_callable_returns.contains_key(def_id)) {
        return CallableResultRoleResolution::Unknown
    }
    let next_active = active.concat([key])
    match table.alias_targets.get(def_id) {
        some(targets) => if targets.len() > 0 {
            let mut result = CallableResultRoleResolution::BackEdge
            for target in targets {
                result = merge_callable_result_role_resolution(
                    result, callable_result_role_at_depth_inner(
                        table, metadata, target, depth,
                        next_active, fuel - 1))
            }
            return match result {
                CallableResultRoleResolution::BackEdge =>
                    CallableResultRoleResolution::Unknown,
                value => value
            }
        },
        none => {}
    }
    // A call-result identity denotes the callable returned by its callee, so
    // every role lookup shifts one level into the callee's frozen summary.
    match table.call_result_callees.get(def_id) {
        some(callee_id) => return callable_result_role_at_depth_inner(
            table, metadata, callee_id, depth + 1,
            next_active, fuel - 1),
        none => {}
    }
    if depth > 0 {
        match table.return_targets.get(def_id) {
            some(targets) => if targets.len() > 0 {
                let mut result = CallableResultRoleResolution::BackEdge
                for target in targets {
                    result = merge_callable_result_role_resolution(
                        result, callable_result_role_at_depth_inner(
                            table, metadata, target, depth - 1,
                            next_active, fuel - 1))
                }
                return match result {
                    CallableResultRoleResolution::BackEdge =>
                        CallableResultRoleResolution::Unknown,
                    value => value
                }
            },
            none => {}
        }
    }
    match metadata.callable_result_role_spine_by_def_id.get(def_id) {
        some(spine) => match spine.get(depth) {
            some(role) => if callable_result_role_is_valid(role) {
                CallableResultRoleResolution::Exact { role: role }
            } else {
                panic("unreachable: invalid callable result role spine")
            },
            none => CallableResultRoleResolution::Unknown
        },
        none => if depth == 0 {
            metadata_callable_result_role(metadata, def_id, false)
        } else if depth == 1 {
            metadata_callable_result_role(metadata, def_id, true)
        } else {
            CallableResultRoleResolution::Unknown
        }
    }
}

fn publish_callable_result_roles(
    table: CallableSolveTable, mut metadata: OwnershipMetadata
) {
    // Snapshot every resolution before mutating either total role map, so
    // iteration order cannot turn an UNKNOWN SCC into an accidental NONE.
    let mut spines: Map<Int, List<Int>> = map_new()
    let mut def_ids = metadata.callable_by_def_id.keys()
    def_ids.sort()
    let fuel = solver_alias_edge_count(table) +
        table.call_result_callees.entries().len() +
        table.return_targets.entries().len() + table.order.len() + 8
    for def_id in def_ids {
        let mut depth_count = match callable_transfer_levels_for_def_id(
                metadata, def_id) {
            some(levels) => levels.len(),
            none => 0
        }
        if depth_count < 2 { depth_count = 2 }
        let mut roles: List<Int> = []
        let mut depth = 0
        while depth < depth_count {
            roles.push(resolved_callable_result_role(
                callable_result_role_at_depth_inner(
                    table, metadata, def_id, depth, [], fuel)))
            depth = depth + 1
        }
        spines.insert(def_id, roles)
    }
    for entry in spines.entries() {
        set_callable_result_role_spine(metadata, entry.0, entry.1)
    }
}

fn finalize_callable_return_contracts(
    table: CallableSolveTable, metadata: OwnershipMetadata,
    mut sink: CollectingSink
) {
    for def_id in table.order {
        match table.states.get(def_id) {
            some(found_state) => {
                let mut state = found_state
                match state.return_callable_contract {
                    some(declared_return_contract) => {
                    let mut expected: Int? = none
                    let mut expected_transfer:
                        List<CallableTransferLevel>? = none
                    match table.return_targets.get(def_id) {
                        some(targets) => {
                            for target in targets {
                                match callable_contract_for_def_id(
                                        table, metadata, target) {
                                    some(actual) => {
                                        let compatible = match expected {
                                            some(first) => {
                                                if first != actual {
                                                    report_ownership_error(sink,
                                                        "returned callable ownership contract mismatch",
                                                        state.span,
                                                        "all returned function values must have the same Borrow/MutBorrow/Move contract")
                                                    false
                                                } else { true }
                                            },
                                            none => {
                                                let expected_actual = actual
                                                expected = some(expected_actual)
                                                true
                                            }
                                        }
                                        if compatible {
                                            match resolve_callable_transfer_for_def_id(
                                                    table, metadata, target) {
                                                CallableTransferResolution::Exact {
                                                        levels } => {
                                                    let levels_for_join =
                                                        clone_callable_transfer_levels(levels)
                                                    let levels_for_first =
                                                        clone_callable_transfer_levels(levels)
                                                    expected_transfer = match
                                                            expected_transfer {
                                                        some(existing) => some(
                                                            join_callable_transfer_levels(
                                                                metadata,
                                                                existing,
                                                                levels_for_join)),
                                                        none => some(levels_for_first)
                                                    }
                                                },
                                                _ => report_ownership_error(sink,
                                                    "returned callable has no exact transfer authority",
                                                    state.span,
                                                    "returned function values must preserve producer-specific FORCE/OWNING provenance")
                                            }
                                        }
                                    },
                                    none => report_ownership_error(sink,
                                        "returned callable has no exact ownership contract",
                                        state.span,
                                        "bind or annotate the returned callable before returning it")
                                }
                            }
                        },
                        none => {}
                    }
                    if table.opaque_callable_returns.contains_key(def_id) {
                        report_ownership_error(sink,
                            "returned callable has no exact ownership contract",
                            state.span,
                            "bind or annotate the returned callable before returning it")
                    }
                    match expected {
                        some(final_contract) => {
                            if is_callable_ownership_inference_term(
                                    declared_return_contract) {
                                let inferred_final_contract = final_contract
                                state.return_callable_contract = some(
                                    inferred_final_contract)
                            } else {
                                let fixed_contract =
                                    require_exact_callable_ownership_term(
                                        metadata, declared_return_contract)
                                if fixed_contract != final_contract {
                                    report_ownership_error(sink,
                                        "returned callable ownership contract mismatch",
                                        state.span,
                                        "the returned callable must exactly match the explicit Borrow/MutBorrow/Move return annotation")
                                }
                                // Error recovery retains the declared
                                // authority; an actual producer must never
                                // rewrite a fixed public return contract.
                                state.return_callable_contract = some(
                                    fixed_contract)
                            }
                        },
                        none => {
                            if !table.opaque_callable_returns.contains_key(def_id) {
                                report_ownership_error(sink,
                                    "returned callable has no exact ownership contract",
                                    state.span,
                                    "bind or annotate the returned callable before returning it")
                            }
                            // Recovery remains exact so the mandatory freeze
                            // barrier cannot replace E0801 with an unrelated ICE.
                            state.return_callable_contract = some(
                                CALLABLE_BORROW_OWNED)
                        }
                    }
                    match expected_transfer {
                        some(returned_levels) => {
                            let mut combined = match
                                    callable_transfer_levels_for_def_id(
                                        metadata, def_id) {
                                some(levels) => levels,
                                none => panic(
                                    "unreachable: body callable has no direct transfer state")
                            }
                            if combined.len() != 1 {
                                panic("unreachable: body callable return transfer was finalized twice")
                            }
                            for returned_level in returned_levels {
                                let mut forces: List<Bool> = []
                                for force in returned_level.force_params {
                                    let copied_force = force
                                    forces.push(copied_force)
                                }
                                combined.push(callable_transfer_level(
                                    returned_level.ownership_term, forces))
                            }
                            let source = match metadata
                                    .callable_state_by_def_id.get(def_id) {
                                some(current) => current.source,
                                none => panic(
                                    "unreachable: body callable has no ownership state")
                            }
                            set_callable_transfer_levels(
                                metadata, def_id, source, combined)
                        },
                        none => {}
                    }
                    },
                    none => {}
                }
            },
            none => {}
        }
    }
}

fn callable_type_recovery_transfer_levels(
    metadata: OwnershipMetadata, ty: Type
) -> List<CallableTransferLevel> {
    match ty {
        Type::FnType { params, return_type, meta } => {
            let resolved = resolve_callable_ownership_term(
                metadata, meta.ownership_term)
            let exact = if resolved != CALLABLE_UNKNOWN &&
                    is_resolved_callable_ownership_term(metadata, resolved) {
                require_exact_callable_ownership_term(metadata, resolved)
            } else {
                if !constrain_callable_ownership_terms(
                        metadata, meta.ownership_term,
                        CALLABLE_BORROW_OWNED) {
                    panic("unreachable: callable const recovery term is incompatible with Borrow")
                }
                CALLABLE_BORROW_OWNED
            }
            let mut forces: List<Bool> = []
            for _param in params { forces.push(false) }
            let mut levels: List<CallableTransferLevel> = [
                callable_transfer_level(exact, forces)
            ]
            for returned_level in callable_type_recovery_transfer_levels(
                    metadata, return_type) {
                let stored_level = returned_level
                levels.push(stored_level)
            }
            levels
        },
        _ => []
    }
}

fn constrain_const_callable_type_spine_at(
    metadata: OwnershipMetadata, ty: Type,
    levels: List<CallableTransferLevel>, level_index: Int,
    mut sink: CollectingSink, span: Span
) -> Int {
    match ty {
        Type::FnType { params, return_type, meta } => {
            let level = match levels.get(level_index) {
                some(value) => value,
                none => panic(
                    "unreachable: callable const producer transfer spine is too short")
            }
            if level.force_params.len() != params.len() {
                panic(
                    "unreachable: callable const producer transfer arity disagrees with its type")
            }
            let actual = require_exact_callable_ownership_term(
                metadata, level.ownership_term)
            if callable_ownership_constraint_compatible(
                    metadata, meta.ownership_term, actual) {
                if !constrain_callable_ownership_terms(
                        metadata, meta.ownership_term, actual) {
                    panic("unreachable: callable const ownership bind changed after preflight")
                }
            } else {
                report_ownership_error(sink,
                    "callable ownership contract mismatch", span,
                    "the stored callable must match the const's explicit Borrow/MutBorrow/Move type")
            }
            constrain_const_callable_type_spine_at(
                metadata, return_type, levels, level_index + 1,
                sink, span)
        },
        _ => level_index
    }
}

fn const_callable_contract_resolution(
    table: CallableSolveTable, metadata: OwnershipMetadata,
    getter_def_id: Int
) -> CallableContractResolution {
    if table.opaque_callable_returns.contains_key(getter_def_id) {
        return CallableContractResolution::NoBase
    }
    let mut result = CallableContractResolution::BackEdge
    match table.return_targets.get(getter_def_id) {
        some(targets) => {
            for target in targets {
                result = merge_callable_contract_resolution(result,
                    resolve_callable_contract_for_def_id(
                        table, metadata, target))
            }
        },
        none => return CallableContractResolution::NoBase
    }
    match result {
        CallableContractResolution::BackEdge =>
            CallableContractResolution::NoBase,
        value => value
    }
}

fn const_callable_transfer_resolution(
    table: CallableSolveTable, metadata: OwnershipMetadata,
    getter_def_id: Int
) -> CallableTransferResolution {
    if table.opaque_callable_returns.contains_key(getter_def_id) {
        return CallableTransferResolution::NoBase
    }
    let mut result = CallableTransferResolution::BackEdge
    match table.return_targets.get(getter_def_id) {
        some(targets) => {
            for target in targets {
                result = merge_callable_transfer_resolution(
                    metadata, result,
                    resolve_callable_transfer_for_def_id(
                        table, metadata, target))
            }
        },
        none => return CallableTransferResolution::NoBase
    }
    match result {
        CallableTransferResolution::BackEdge =>
            CallableTransferResolution::NoBase,
        value => value
    }
}

fn getter_transfer_spine(
    returned_levels: List<CallableTransferLevel>
) -> List<CallableTransferLevel> {
    let mut levels: List<CallableTransferLevel> = [
        callable_transfer_level(CALLABLE_BORROW_OWNED, [])
    ]
    for returned_level in returned_levels {
        let mut forces: List<Bool> = []
        for force in returned_level.force_params {
            let copied_force = force
            forces.push(copied_force)
        }
        levels.push(callable_transfer_level(
            returned_level.ownership_term, forces))
    }
    levels
}

fn finalize_callable_const_getters(
    table: CallableSolveTable, mut metadata: OwnershipMetadata,
    mut sink: CollectingSink
) {
    let mut getters = table.const_callable_types.entries()
    getters.sort_by(compare_int_key)
    for entry in getters {
        let (getter_def_id, stored_ty) = entry
        let span = table.durable_callable_spans.get(getter_def_id).unwrap_or(
            synthetic_ownership_span())
        let returned_levels = match const_callable_contract_resolution(
                table, metadata, getter_def_id) {
            CallableContractResolution::Exact { .. } => match
                    const_callable_transfer_resolution(
                        table, metadata, getter_def_id) {
                CallableTransferResolution::Exact { levels } => levels,
                _ => {
                    report_ownership_error(sink,
                        "callable constant has no exact transfer authority",
                        span,
                        "a durable callable value must preserve its producer's complete transfer spine")
                    callable_type_recovery_transfer_levels(
                        metadata, stored_ty)
                }
            },
            CallableContractResolution::Conflict { .. } => {
                report_ownership_error(sink,
                    "callable constant has incompatible ownership targets",
                    span,
                    "all callable producers stored by one const must agree on Borrow/MutBorrow/Move")
                callable_type_recovery_transfer_levels(metadata, stored_ty)
            },
            CallableContractResolution::NoBase |
            CallableContractResolution::BackEdge => {
                report_ownership_error(sink,
                    "callable constant has no exact ownership source", span,
                    "a durable callable value requires DefId-keyed producer provenance before it can be used or re-exported")
                callable_type_recovery_transfer_levels(metadata, stored_ty)
            }
        }
        let consumed = constrain_const_callable_type_spine_at(
            metadata, stored_ty, returned_levels, 0, sink, span)
        if consumed != returned_levels.len() {
            panic(
                "unreachable: callable const producer transfer spine exceeds its type")
        }
        let source = match metadata.callable_state_by_def_id.get(
                getter_def_id) {
            some(state) => state.source,
            none => panic(
                "unreachable: callable const getter has no ownership state")
        }
        record_callable_ownership_with_transfer_levels(
            metadata, getter_def_id, CALLABLE_BORROW_OWNED, source,
            getter_transfer_spine(returned_levels))
    }
}

fn finalize_callable_const_getter_aliases(
    table: CallableSolveTable, mut metadata: OwnershipMetadata
) {
    let mut aliases = table.alias_targets.entries()
    aliases.sort_by(compare_int_key)
    for entry in aliases {
        let (alias_def_id, _) = entry
        if !table.const_getter_def_ids.contains(alias_def_id) ||
           table.const_callable_types.contains_key(alias_def_id) {
            continue
        }
        let exact = match resolve_callable_contract_for_def_id(
                table, metadata, alias_def_id) {
            CallableContractResolution::Exact { term } => term,
            _ => panic(
                "unreachable: exact const getter alias has no ownership contract")
        }
        if require_exact_callable_ownership_term(metadata, exact) !=
                CALLABLE_BORROW_OWNED {
            panic(
                "unreachable: const getter alias changed its zero-argument Borrow contract")
        }
        let levels = match resolve_callable_transfer_for_def_id(
                table, metadata, alias_def_id) {
            CallableTransferResolution::Exact { levels } => levels,
            _ => panic(
                "unreachable: exact const getter alias has no transfer authority")
        }
        let source = match metadata.callable_state_by_def_id.get(alias_def_id) {
            some(state) => state.source,
            none => panic(
                "unreachable: const getter alias has no ownership state")
        }
        record_callable_ownership_with_transfer_levels(
            metadata, alias_def_id, CALLABLE_BORROW_OWNED,
            source, levels)
    }
}

fn solve_callable_modes(
    mut env: TypeEnv, program: HProgram, mut sink: CollectingSink,
    value_binding_kinds: Map<Int, ValueBindingKind>,
    pre_solve_const_getter_aliases: Set<Int>,
    pre_solve_alias_targets: Map<Int, Int>,
    pre_solve_alias_arities: Map<Int, Int>,
    pre_solve_alias_contracts: Map<Int, Int>
) -> HProgram {
    let mut table = CallableSolveTable {
        states: map_new(), order: [], alias_targets: map_new(),
        alias_edge_count: 0,
        alias_spans: map_new(), callable_contracts: map_new(),
        callable_arities: map_new(), callable_types: map_new(),
        call_result_callees: map_new(),
        call_result_spans: map_new(), return_targets: map_new(),
        opaque_callable_returns: map_new(), value_origins: map_new(),
        opaque_value_origins: map_new(),
        untrusted_callable_slots: map_new(), opaque_callable_slots: map_new(),
        retained_callee_spans: map_new(), reachable_callee_spans: map_new(),
        durable_callable_spans: map_new(),
        diagnosed_callable_slots: map_new(), const_getter_def_ids: set_new(),
        const_callable_types: map_new()
    }
    for entry in value_binding_kinds.entries() {
        match entry.1 {
            ValueBindingKind::ConstGetter => {
                table.const_getter_def_ids.insert(entry.0)
            },
            _ => {}
        }
    }
    for alias_def_id in pre_solve_const_getter_aliases {
        let retained_getter_alias_def_id = alias_def_id
        table.const_getter_def_ids.insert(retained_getter_alias_def_id)
    }
    for decl in program.decls { collect_callable_decl(decl, table) }
    let mut pre_solve_aliases = pre_solve_alias_targets.entries()
    pre_solve_aliases.sort_by(compare_int_key)
    for entry in pre_solve_aliases {
        let (alias_def_id, source_def_id) = entry
        if table.const_getter_def_ids.contains(alias_def_id) {
            table.alias_spans.insert(alias_def_id, span_zero())
            append_solver_alias_target(table, alias_def_id, source_def_id)
            continue
        }
        let arity = match pre_solve_alias_arities.get(alias_def_id) {
            some(value) => value,
            none => panic(
                "unreachable: project callable alias has no recorded arity")
        }
        let alias_term = match pre_solve_alias_contracts.get(alias_def_id) {
            some(value) => value,
            none => panic(
                "unreachable: project callable alias has no ownership contract")
        }
        table.callable_contracts.insert(alias_def_id, alias_term)
        table.callable_arities.insert(alias_def_id, arity)
        table.alias_spans.insert(alias_def_id, span_zero())
        append_solver_alias_target(table, alias_def_id, source_def_id)
    }
    prepare_callable_return_edges(table)
    refresh_call_result_edges(table, env.types.ownership_metadata)
    validate_solver_alias_edge_count(table)
    // One extra round is reserved for aliases first discovered after an earlier
    // call site (for example across a loop back-edge). Mode changes themselves
    // are bounded by the total number of parameters.
    let mut fuel = 2
    for def_id in table.order {
        match table.states.get(def_id) {
            some(state) => { fuel = fuel + state.modes.len() * 2 },
            none => {}
        }
    }
    fuel = fuel + table.call_result_callees.entries().len() *
        (table.order.len() + 2)
    let mut changed = true
    while changed {
        if fuel <= 0 {
            panic("unreachable: callable ownership solver did not converge")
        }
        fuel = fuel - 1
        changed = false
        let round_modes_before = solver_mode_score(table)
        let round_aliases_before = solver_alias_edge_count(table)
        for def_id in table.order {
            match table.states.get(def_id) {
                some(state) => {
                    let before = list_clone(state.modes)
                    let aliases_before = solver_alias_edge_count(table)
                    solve_expr(env, table, env.types.ownership_metadata,
                        state, state.body, TRANSFER_OWNING)
                    if aliases_before != solver_alias_edge_count(table) {
                        changed = true
                    }
                    let mut index = 0
                    while index < before.len() {
                        if before.get(index) != state.modes.get(index) {
                            changed = true
                        }
                        index = index + 1
                    }
                },
                none => {}
            }
        }
        refresh_call_result_edges(table, env.types.ownership_metadata)
        validate_solver_alias_edge_count(table)
        if round_modes_before != solver_mode_score(table) ||
           round_aliases_before != solver_alias_edge_count(table) {
            changed = true
        }
    }

    // Publication is intentionally after convergence: no consumer can observe
    // a transient SCC descriptor.
    for def_id in table.order {
        match table.states.get(def_id) {
            some(state) => {
                let ownership_id = intern_callable_param_modes(
                    env.types.ownership_metadata, state.modes)
                publish_solved_callable_ownership(
                    env.types.ownership_metadata, def_id, ownership_id,
                    CALLABLE_SOURCE_BODY_INFERRED,
                    direct_transfer_levels(ownership_id, state.force_params),
                    sink, state.span)
            },
            none => {}
        }
    }
    finalize_callable_return_contracts(
        table, env.types.ownership_metadata, sink)
    validate_callable_alias_contracts(
        table, env.types.ownership_metadata, sink)
    // Publish exact callable-value slot contracts from the same converged
    // may-alias graph. A branch-assigned function value therefore keeps one
    // authoritative DefId contract even when its possible targets differ.
    let mut callable_slots = table.callable_arities.entries()
    callable_slots.sort_by(compare_int_key)
    for entry in callable_slots {
        let (slot_def_id, _) = entry
        if table.untrusted_callable_slots.contains_key(slot_def_id) {
            let diagnostic_span = match table.reachable_callee_spans.get(
                    slot_def_id) {
                some(value) => {
                    let reachable_span = copy_ownership_span(value)
                    some(reachable_span)
                },
                none => table.durable_callable_spans.get(slot_def_id)
            }
            match diagnostic_span {
                some(call_span) => if !table.diagnosed_callable_slots
                        .contains_key(slot_def_id) {
                    let diagnosed_slot_id = slot_def_id
                    table.diagnosed_callable_slots.insert(
                        diagnosed_slot_id, true)
                    if table.reachable_callee_spans.contains_key(slot_def_id) {
                        report_ownership_error(sink,
                            "callable call target has no exact ownership source",
                            call_span,
                            "a callable type constraint cannot replace DefId-keyed producer provenance")
                    } else {
                        report_ownership_error(sink,
                            "callable constant has no exact ownership source",
                            call_span,
                            "a durable callable value requires DefId-keyed producer provenance before it can be used or re-exported")
                    }
                },
                none => {}
            }
            // Retained dead HIR must stay total through validation and the
            // ownership planner. The planner physically removes dependent
            // dead children before RC/codegen. ERROR_RECOVERY is rejected by
            // every producer-authority check and therefore cannot make a
            // reachable path exact.
            let recovery = callable_recovery_contract_for_def_id(
                table, env.types.ownership_metadata, slot_def_id)
            let recovery_span = match table.call_result_spans.get(slot_def_id) {
                some(value) => value,
                none => table.alias_spans.get(slot_def_id).unwrap_or(
                    synthetic_ownership_span())
            }
            publish_solved_callable_ownership(
                env.types.ownership_metadata, slot_def_id, recovery,
                CALLABLE_SOURCE_ERROR_RECOVERY,
                recovery_transfer_levels(recovery,
                    table.callable_arities.get(slot_def_id).unwrap_or(0)),
                sink, recovery_span)
            continue
        }
        let ownership_id = match callable_contract_for_def_id(
                table, env.types.ownership_metadata, slot_def_id) {
            some(term) => term,
            none => panic(
                "unreachable: callable slot has no full exact ownership contract")
        }
        let transfer_levels = match resolve_callable_transfer_for_def_id(
                table, env.types.ownership_metadata, slot_def_id) {
            CallableTransferResolution::Exact { levels } => levels,
            _ => panic(
                "unreachable: callable slot has no full transfer authority")
        }
        publish_solved_callable_ownership(
            env.types.ownership_metadata, slot_def_id, ownership_id,
            CALLABLE_SOURCE_BODY_INFERRED,
            transfer_levels, sink,
            table.alias_spans.get(slot_def_id).unwrap_or(span_zero()))
    }
    finalize_callable_const_getters(
        table, env.types.ownership_metadata, sink)
    finalize_callable_const_getter_aliases(
        table, env.types.ownership_metadata)
    publish_callable_result_roles(table, env.types.ownership_metadata)
    validate_trait_callable_contracts(
        env, env.types.ownership_metadata, sink)
    finalize_callable_env(env, table)
    let mut decls: List<HDecl> = []
    for decl in program.decls {
        let final_decl = decl
        decls.push(finalize_decl_params(table, final_decl))
    }
    freeze_program_ownership(env, HProgram { ..program, decls: decls,
        ownership_metadata: env.types.ownership_metadata })
}

// ============================================================
// DefId CFG / Take planning
// ============================================================

const TRANSFER_BORROW: Int = 0
const TRANSFER_AUTO: Int = 1
const TRANSFER_OWNING: Int = 2
const TRANSFER_FORCE: Int = 3

// Binding invalidation is an exact-slot fact, deliberately independent from
// both the transfer-strength decision above and physical RC eligibility.
const INVALIDATION_READY: Int = 0
const INVALIDATION_NO_SLOT: Int = 1
const INVALIDATION_BORROWED: Int = 2
const INVALIDATION_BOXED: Int = 3
const INVALIDATION_BLOCKED: Int = 4
const INVALIDATION_ALREADY_MOVED: Int = 5

const SLOT_LIVE: Int = 0
const SLOT_MOVED: Int = 1
const SLOT_MAYBE_MOVED: Int = 2

struct FlowSnapshot {
    pub slots: Map<Int, Int>,
    pub moved_spans: Map<Int, Span>,
    pub callable_slots: Map<Int, Int>
}

struct MovePlan {
    pub slots: Map<Int, Int>,
    pub moved_spans: Map<Int, Span>,
    pub borrowed_slots: Map<Int, Bool>,
    pub callable_slots: Map<Int, Int>,
    // Exact outer slots that must remain live across a cleanup/capture
    // boundary (abort recovery, external Drop owner, or live handler env).
    pub blocked_takes: Map<Int, Bool>,
    pub reachable: Bool,
    pub loop_depth: Int,
    pub break_states: Map<Int, FlowSnapshot>,
    pub continue_states: Map<Int, FlowSnapshot>
}

fn new_move_plan() -> MovePlan {
    MovePlan {
        slots: map_new(), moved_spans: map_new(),
        borrowed_slots: map_new(), callable_slots: map_new(),
        blocked_takes: map_new(), reachable: true, loop_depth: 0,
        break_states: map_new(), continue_states: map_new()
    }
}

fn clone_move_plan(plan: MovePlan) -> MovePlan {
    MovePlan {
        slots: map_clone(plan.slots),
        moved_spans: map_clone(plan.moved_spans),
        borrowed_slots: map_clone(plan.borrowed_slots),
        callable_slots: map_clone(plan.callable_slots),
        blocked_takes: map_clone(plan.blocked_takes),
        reachable: plan.reachable, loop_depth: plan.loop_depth,
        break_states: clone_exit_states(plan.break_states),
        continue_states: clone_exit_states(plan.continue_states)
    }
}

// Adopt the semantic CFG result of a temporary planning context without
// leaking its contextual Take barriers into the surrounding expression.
fn adopt_move_plan_flow(mut target: MovePlan, source: MovePlan) {
    target.slots = source.slots
    target.moved_spans = source.moved_spans
    target.borrowed_slots = source.borrowed_slots
    target.callable_slots = source.callable_slots
    target.reachable = source.reachable
    target.loop_depth = source.loop_depth
    target.break_states = source.break_states
    target.continue_states = source.continue_states
}

fn flow_snapshot(plan: MovePlan) -> FlowSnapshot {
    FlowSnapshot {
        slots: map_clone(plan.slots),
        moved_spans: map_clone(plan.moved_spans),
        callable_slots: map_clone(plan.callable_slots)
    }
}

fn clone_flow_snapshot(snapshot: FlowSnapshot) -> FlowSnapshot {
    FlowSnapshot {
        slots: map_clone(snapshot.slots),
        moved_spans: map_clone(snapshot.moved_spans),
        callable_slots: map_clone(snapshot.callable_slots)
    }
}

fn clone_exit_states(
    states: Map<Int, FlowSnapshot>
) -> Map<Int, FlowSnapshot> {
    let mut result: Map<Int, FlowSnapshot> = map_new()
    for entry in states.entries() {
        let (depth, snapshot) = entry
        let result_depth = depth
        result.insert(result_depth, clone_flow_snapshot(snapshot))
    }
    result
}

fn join_flow_snapshots(
    left: FlowSnapshot, right: FlowSnapshot
) -> FlowSnapshot {
    let mut result = clone_flow_snapshot(left)
    for entry in right.slots.entries() {
        let (def_id, right_state) = entry
        match result.slots.get(def_id) {
            some(left_state) => {
                let joined = join_slot_state(left_state, right_state)
                let joined_slot_id = def_id
                let joined_slot_state = joined
                result.slots.insert(joined_slot_id, joined_slot_state)
                if joined == SLOT_LIVE {
                    result.moved_spans.remove(def_id)
                } else if !result.moved_spans.contains_key(def_id) {
                    match right.moved_spans.get(def_id) {
                        some(span) => {
                            let moved_slot_id = def_id
                            let moved_slot_span = span
                            result.moved_spans.insert(
                                moved_slot_id, moved_slot_span)
                        },
                        none => {}
                    }
                }
                match (left.callable_slots.get(def_id),
                       right.callable_slots.get(def_id)) {
                    (some(a), some(b)) => if a == b {
                        let callable_slot_id = def_id
                        let callable_ownership_id = a
                        result.callable_slots.insert(
                            callable_slot_id, callable_ownership_id)
                    } else {
                        result.callable_slots.remove(def_id)
                    },
                    _ => result.callable_slots.remove(def_id)
                }
            },
            none => {
                let new_slot_id = def_id
                let new_slot_state = right_state
                result.slots.insert(new_slot_id, new_slot_state)
                match right.moved_spans.get(def_id) {
                    some(span) => {
                        let moved_slot_id = def_id
                        let moved_slot_span = span
                        result.moved_spans.insert(
                            moved_slot_id, moved_slot_span)
                    },
                    none => {}
                }
                match right.callable_slots.get(def_id) {
                    some(id) => {
                        let callable_slot_id = def_id
                        let callable_ownership_id = id
                        result.callable_slots.insert(
                            callable_slot_id, callable_ownership_id)
                    },
                    none => {}
                }
            }
        }
    }
    result
}

fn join_exit_states(
    left: Map<Int, FlowSnapshot>, right: Map<Int, FlowSnapshot>
) -> Map<Int, FlowSnapshot> {
    let mut result = clone_exit_states(left)
    for entry in right.entries() {
        let (depth, snapshot) = entry
        match result.get(depth) {
            some(existing) => {
                let joined_depth = depth
                result.insert(joined_depth,
                    join_flow_snapshots(existing, snapshot))
            },
            none => {
                let new_depth = depth
                result.insert(new_depth, clone_flow_snapshot(snapshot))
            }
        }
    }
    result
}

fn record_loop_exit(mut plan: MovePlan, is_break: Bool) {
    if plan.loop_depth <= 0 {
        panic("unreachable: loop control edge has no enclosing loop")
    }
    let current = flow_snapshot(plan)
    if is_break {
        match plan.break_states.get(plan.loop_depth) {
            some(existing) => plan.break_states.insert(plan.loop_depth,
                join_flow_snapshots(existing, current)),
            none => plan.break_states.insert(plan.loop_depth, current)
        }
    } else {
        match plan.continue_states.get(plan.loop_depth) {
            some(existing) => plan.continue_states.insert(plan.loop_depth,
                join_flow_snapshots(existing, current)),
            none => plan.continue_states.insert(plan.loop_depth, current)
        }
    }
    plan.reachable = false
}

fn report_ownership_error(
    mut sink: CollectingSink, message: Str, span: Span, detail: Str
) {
    sink.report(make_diag(E0801, Severity::SevError, message, span,
        DiagnosticContext::OtherContext { detail: some(detail) }))
}

fn register_slot(
    mut plan: MovePlan, def_id: Int, borrowed: Bool,
    callable_ownership: Int?
) {
    let live_slot_id = def_id
    plan.slots.insert(live_slot_id, SLOT_LIVE)
    let moved_span_slot_id = def_id
    plan.moved_spans.remove(moved_span_slot_id)
    if borrowed {
        let borrowed_slot_id = def_id
        plan.borrowed_slots.insert(borrowed_slot_id, true)
    } else {
        let owned_slot_id = def_id
        plan.borrowed_slots.remove(owned_slot_id)
    }
    match callable_ownership {
        some(id) => {
            let callable_slot_id = def_id
            let callable_ownership_id = id
            plan.callable_slots.insert(
                callable_slot_id, callable_ownership_id)
        },
        none => {
            let noncallable_slot_id = def_id
            plan.callable_slots.remove(noncallable_slot_id)
        }
    }
}

fn register_pattern_slots(
    mut plan: MovePlan, metadata: OwnershipMetadata,
    bindings: List<HPatternBinding>,
    trust_declared_callable_contract: Bool
) {
    for binding in bindings {
        let exact = metadata.callable_by_def_id.get(binding.def_id)
        register_slot(plan, binding.def_id, true,
            if exact.is_some() {
                exact
            } else if trust_declared_callable_contract {
                callable_id_from_type(binding.ty)
            } else {
                match binding.ty {
                    Type::FnType { .. } => some(CALLABLE_UNKNOWN),
                    _ => none
                }
            })
    }
}

fn report_unproven_pattern_callables(
    metadata: OwnershipMetadata, bindings: List<HPatternBinding>,
    mut sink: CollectingSink, span: Span
) {
    for binding in bindings {
        match binding.ty {
            Type::FnType { .. } =>
                if metadata.callable_by_def_id.get(binding.def_id).is_none() {
                    report_ownership_error(sink,
                        "callable pattern binding has no exact payload ownership contract",
                        span,
                        "extracting a callable from a container requires explicit DefId-keyed payload provenance")
                },
            _ => {}
        }
    }
}

fn callable_id_from_type(ty: Type) -> Int? {
    match ty {
        Type::FnType { meta, .. } => some(meta.ownership_term),
        _ => none
    }
}

fn report_unproven_callable_value(
    ty: Type, contract: Int?, mut sink: CollectingSink, span: Span
) {
    if callable_id_from_type(ty).is_some() && contract.is_none() {
        report_ownership_error(sink,
            "callable value has no exact ownership identity", span,
            "bind only DefId-backed callable producers; type metadata is not ownership authority")
    }
}

fn callable_id_of_expr(
    metadata: OwnershipMetadata, plan: MovePlan, expr: HExpr
) -> Int? {
    let mut sources: List<Int> = []
    if collect_callable_identity_sources(expr, sources) == false ||
       sources.len() == 0 {
        return none
    }
    let mut has_result = false
    let mut result_id = CALLABLE_UNKNOWN
    for def_id in sources {
        let contract = match plan.callable_slots.get(def_id) {
            some(id) => {
                let exact_id = id
                some(exact_id)
            },
            none => metadata.callable_by_def_id.get(def_id)
        }
        match contract {
            some(actual) => {
                if has_result {
                    if result_id != actual { return none }
                } else {
                    let first_id = actual
                    result_id = first_id
                    has_result = true
                }
            },
            none => return none
        }
    }
    if has_result { some(result_id) } else { none }
}

fn call_param_mode(
    metadata: OwnershipMetadata, plan: MovePlan,
    callee_def_id: Int?, index: Int
) -> Int {
    let ownership_id = match callee_def_id {
        some(def_id) => match plan.callable_slots.get(def_id) {
            some(id) => {
                let exact_id = id
                some(exact_id)
            },
            none => metadata.callable_by_def_id.get(def_id)
        },
        none => none
    }
    match ownership_id {
        some(ownership_id) => {
            let mode = callable_param_ownership(
                metadata, ownership_id, index)
            if mode == PARAM_OWNERSHIP_UNKNOWN {
                PARAM_OWNERSHIP_BORROW
            } else {
                mode
            }
        },
        // Opaque/projection-produced callable bindings are diagnosed at their
        // binding site.  Keep planning total so malformed user input cannot
        // turn that E0801 into an internal compiler panic.
        none => PARAM_OWNERSHIP_BORROW
    }
}

fn call_param_transfer(
    metadata: OwnershipMetadata, plan: MovePlan,
    callee_def_id: Int?, index: Int
) -> Int {
    let mode = call_param_mode(metadata, plan, callee_def_id, index)
    if mode != PARAM_OWNERSHIP_MOVE { return TRANSFER_BORROW }
    match callee_def_id {
        some(def_id) => if callable_param_requires_force(
                metadata, def_id, index).unwrap_or(false) {
            TRANSFER_FORCE
        } else {
            TRANSFER_OWNING
        },
        none => TRANSFER_BORROW
    }
}

fn exact_call_ownership_id(
    metadata: OwnershipMetadata, plan: MovePlan,
    callee_def_id: Int?
) -> Int? {
    match callee_def_id {
        some(def_id) => match plan.callable_slots.get(def_id) {
            some(id) => {
                let exact_id = id
                some(exact_id)
            },
            none => metadata.callable_by_def_id.get(def_id)
        },
        none => none
    }
}

fn call_result_role_needs_resolution(ty: Type) -> Bool {
    match ty {
        Type::TypeVar { name, .. } => name.is_none(),
        _ => false
    }
}

fn validate_call_result_role(
    metadata: OwnershipMetadata, callee_def_id: Int?, ty: Type,
    mut sink: CollectingSink, span: Span
) {
    match callee_def_id {
        some(def_id) => {
            let role = match metadata.callable_result_role_by_def_id.get(
                    def_id) {
                some(value) => value,
                none => panic(
                    "unreachable: call has no total callable result role")
            }
            if role == CALLABLE_RESULT_ROLE_UNKNOWN &&
               call_result_role_needs_resolution(ty) {
                report_ownership_error(sink,
                    "callable result ownership role is unknown", span,
                    "all exact callable targets must agree before an unresolved generic result can enter RC accounting")
            }
        },
        none => {}
    }
}

fn call_result_needs_clone(
    metadata: OwnershipMetadata, plan: MovePlan,
    callee_def_id: Int?
) -> Bool {
    match exact_call_ownership_id(metadata, plan, callee_def_id) {
        some(ownership_id) => callable_return_ownership(
            metadata, ownership_id) != RETURN_OWNERSHIP_OWNED,
        none => false
    }
}

fn callable_parameter_type(callee_ty: Type, index: Int) -> Type? {
    match callee_ty {
        Type::FnType { params, .. } => params.get(index),
        _ => none
    }
}

fn validate_callable_argument(
    env: TypeEnv, metadata: OwnershipMetadata, plan: MovePlan,
    callee: HExpr, descriptor_index: Int, arg: HExpr,
    mut sink: CollectingSink, span: Span
) {
    match callable_parameter_type(hexpr_type(callee), descriptor_index) {
        some(Type::FnType { meta: expected, .. }) => {
            match callable_id_of_expr(metadata, plan, arg) {
                some(actual_id) => if actual_id != expected.ownership_term {
                    report_ownership_error(sink,
                        "callable ownership contract mismatch", span,
                        "higher-order arguments must have the exact Borrow/MutBorrow/Move contract")
                },
                none => report_ownership_error(sink,
                    "callable argument has no exact ownership contract", span,
                    "bind or annotate the callable before passing it")
            }
        },
        _ => {}
    }
}

fn slot_is_unavailable(plan: MovePlan, def_id: Int) -> Bool {
    match plan.slots.get(def_id) {
        some(state) => state == SLOT_MOVED || state == SLOT_MAYBE_MOVED,
        none => false
    }
}

fn check_ident_read(
    metadata: OwnershipMetadata, plan: MovePlan,
    mut sink: CollectingSink, name: Str, def_id: Int?, ty: Type,
    span: Span
) {
    if !plan.reachable { return }
    match def_id {
        some(id) => if slot_is_unavailable(plan, id) {
            report_ownership_error(sink,
                "use of moved value: '${name}'", span,
                "the exact binding DefId may already have been moved")
        },
        none => {}
    }
}

fn type_has_logical_transfer_value(ty: Type) -> Bool {
    match ty {
        // These carry no value that a logical binding invalidation can move.
        Type::UnitType | Type::NeverType |
        Type::EffectRowType { .. } | Type::ErrorType => false,
        // FORCE is a callable contract, not an RC classification. Scalars,
        // Ptr and direct extern handles still receive a Take so their exact
        // binding becomes unavailable; Perceus simply performs no RC work for
        // excluded types.
        Type::IntType | Type::FloatType | Type::BoolType |
        Type::StrType | Type::AnyType | Type::TypeVar { .. } |
        Type::FnType { .. } | Type::StructType { .. } |
        Type::EnumType { .. } | Type::GenericType { .. } |
        Type::RecordType { .. } | Type::TupleType { .. } |
        Type::PtrType { .. } => true
    }
}

fn type_crosses_owning_edge_by_value(env: TypeEnv, ty: Type) -> Bool {
    if !type_has_logical_transfer_value(ty) { return false }
    match ty {
        Type::IntType | Type::FloatType | Type::BoolType |
        Type::PtrType { .. } => false,
        Type::StructType { name, .. } => match env.types.structs.get(name) {
            some(def) => !def.is_extern,
            none => true
        },
        Type::GenericType { base, .. } =>
            type_crosses_owning_edge_by_value(env, base),
        _ => true
    }
}

// The sole type/edge decision for logical invalidation. Physical RC is not an
// input: FORCE invalidates Int/Ptr/extern/List<extern> slots alike, whereas an
// inferred OWNING edge copies scalar/direct-foreign values and AUTO transfers
// only a may-own value.
fn transfer_requires_binding_invalidation(
    env: TypeEnv, metadata: OwnershipMetadata, transfer: Int, ty: Type
) -> Bool {
    if transfer == TRANSFER_BORROW { return false }
    if transfer == TRANSFER_FORCE {
        return type_has_logical_transfer_value(ty)
    }
    if !type_crosses_owning_edge_by_value(env, ty) { return false }
    if transfer == TRANSFER_OWNING { return true }
    if transfer == TRANSFER_AUTO { return type_may_own(metadata, ty) }
    panic("unreachable: unknown ownership transfer strength")
}

fn binding_invalidation_status(
    plan: MovePlan, boxed_vars: Set<Int>, def_id: Int
) -> Int {
    if !plan.slots.contains_key(def_id) { return INVALIDATION_NO_SLOT }
    if plan.borrowed_slots.contains_key(def_id) {
        return INVALIDATION_BORROWED
    }
    if boxed_vars.contains(def_id) { return INVALIDATION_BOXED }
    if plan.blocked_takes.contains_key(def_id) {
        return INVALIDATION_BLOCKED
    }
    if slot_is_unavailable(plan, def_id) {
        return INVALIDATION_ALREADY_MOVED
    }
    INVALIDATION_READY
}

fn ordinary_closure_capture_allowed(
    metadata: OwnershipMetadata, ty: Type
) -> Bool {
    // Ordinary closures duplicate their env captures. Until an explicit
    // consume/FnOnce capture model exists, may-own is the only authority;
    // physical RC eligibility must not weaken this fail-closed decision.
    !type_may_own(metadata, ty)
}

fn exact_outer_slot_captures(
    plan: MovePlan, body: HExpr
) -> List<HFreeBinding> {
    let mut outer_slots: Set<Int> = set_new()
    for entry in plan.slots.entries() { outer_slots.insert(entry.0) }
    collect_exact_free_bindings(body, outer_slots)
}

fn check_exact_capture_reads(
    metadata: OwnershipMetadata, plan: MovePlan, body: HExpr,
    mut sink: CollectingSink
) -> List<HFreeBinding> {
    let captures = exact_outer_slot_captures(plan, body)
    for capture in captures {
        // Callable/effect-handler construction reads every env capture now.
        // This must precede any type policy so a moved Str/Int/Ptr cannot be
        // copied from a slot already cleared by Take.
        check_ident_read(metadata, plan, sink,
            capture.name, some(capture.def_id), capture.ty, capture.span)
    }
    captures
}

fn reject_owner_bearing_closure_captures(
    metadata: OwnershipMetadata, plan: MovePlan, body: HExpr,
    mut sink: CollectingSink
) -> List<HFreeBinding> {
    let captures = check_exact_capture_reads(
        metadata, plan, body, sink)
    for capture in captures {
        if !ordinary_closure_capture_allowed(metadata, capture.ty) {
            report_ownership_error(sink,
                "ordinary closure cannot capture owner-bearing value '${capture.name}'",
                capture.span,
                "ordinary closures may capture only non-may-own values until explicit consume/FnOnce capture semantics exist")
        }
    }
    captures
}

fn free_bindings_as_pattern_bindings(
    captures: List<HFreeBinding>
) -> List<HPatternBinding> {
    let mut result: List<HPatternBinding> = []
    for capture in captures {
        result.push(HPatternBinding {
            name: capture.name, def_id: capture.def_id, ty: capture.ty
        })
    }
    result
}

fn type_is_never(ty: Type) -> Bool {
    match ty {
        Type::NeverType => true,
        _ => false
    }
}

fn plan_ident_transfer(
    env: TypeEnv, metadata: OwnershipMetadata, mut plan: MovePlan,
    boxed_vars: Set<Int>, mut sink: CollectingSink,
    name: Str, resolved_name: Str?, def_id: Int?,
    dict_closure_dicts: List<DictRef>?,
    ty: Type, effects: EffectRow,
    span: Span, transfer: Int
) -> HExpr {
    check_ident_read(metadata, plan, sink, name, def_id, ty, span)
    if !transfer_requires_binding_invalidation(
            env, metadata, transfer, ty) {
        return HExpr::Ident { name: name, resolved_name: resolved_name,
            def_id: def_id, dict_closure_dicts: dict_closure_dicts,
            ty: ty, effects: effects, span: span }
    }
    if !plan.reachable {
        return HExpr::Ident { name: name, resolved_name: resolved_name,
            def_id: def_id, dict_closure_dicts: dict_closure_dicts,
            ty: ty, effects: effects, span: span }
    }
    match def_id {
        none => {
            report_ownership_error(sink,
                "cannot transfer '${name}' without exact binding identity",
                span, "ownership transfer requires a DefId-backed full binding")
            HExpr::Ident { name: name, resolved_name: resolved_name,
                def_id: none, dict_closure_dicts: dict_closure_dicts,
                ty: ty, effects: effects, span: span }
        },
        some(id) => {
            let status = binding_invalidation_status(plan, boxed_vars, id)
            if status != INVALIDATION_READY {
                // A normal owning escape is not a callable Move edge. A
                // borrowed, non-linear value may remain an Ident: Perceus
                // materializes its independent RC owner through the existing
                // clone-all-escape rule. FORCE still fails closed, and
                // owner-bearing/Drop values remain non-cloneable.
                if status == INVALIDATION_BORROWED &&
                   transfer == TRANSFER_OWNING &&
                   !type_may_own(metadata, ty) {
                    let borrowed_return_def_id = id
                    return HExpr::Ident { name: name,
                        resolved_name: resolved_name,
                        def_id: some(borrowed_return_def_id),
                        dict_closure_dicts: dict_closure_dicts,
                        ty: ty, effects: effects, span: span }
                }
                if status == INVALIDATION_NO_SLOT {
                    report_ownership_error(sink,
                        "cannot move captured value '${name}' from an ordinary closure",
                        span,
                        "ordinary closures may borrow or mut-borrow captures only")
                } else if status == INVALIDATION_BORROWED {
                    report_ownership_error(sink,
                        "cannot move borrowed value '${name}'", span,
                        "callee ownership mode is Borrow/MutBorrow")
                } else if status == INVALIDATION_BOXED {
                    report_ownership_error(sink,
                        "cannot move auto-boxed binding '${name}'", span,
                        "moving a shared closure cell is not a full-value transfer")
                } else if status == INVALIDATION_BLOCKED {
                    report_ownership_error(sink,
                        "cannot move protected outer value '${name}'",
                        span,
                        "the binding must remain live across an abort or handler-capture boundary")
                    // check_ident_read already emitted the exact moved/maybe-
                    // moved diagnostic before this classification.
                } else if status == INVALIDATION_ALREADY_MOVED {
                } else {
                    panic(
                        "unreachable: invalid binding invalidation status")
                }
                let returned_def_id = id
                return HExpr::Ident { name: name, resolved_name: resolved_name,
                    def_id: some(returned_def_id),
                    dict_closure_dicts: dict_closure_dicts,
                    ty: ty, effects: effects, span: span }
            }
            let moved_slot_id = id
            plan.slots.insert(moved_slot_id, SLOT_MOVED)
            let moved_span_id = id
            let recorded_span = span
            plan.moved_spans.insert(moved_span_id, recorded_span)
            let source_def_id = id
            let take_span = span
            HExpr::Take { name: name, source_def_id: source_def_id,
                ty: ty, effects: effects, span: take_span }
        }
    }
}

fn join_slot_state(left: Int, right: Int) -> Int {
    if left == right { left } else { SLOT_MAYBE_MOVED }
}

fn join_move_plans(
    mut target: MovePlan, left: MovePlan, right: MovePlan
) {
    target.break_states = join_exit_states(
        left.break_states, right.break_states)
    target.continue_states = join_exit_states(
        left.continue_states, right.continue_states)

    if !left.reachable && !right.reachable {
        target.reachable = false
        return
    }
    target.reachable = true
    let outer_entries = target.slots.entries()
    for entry in outer_entries {
        let (def_id, original) = entry
        let left_state = left.slots.get(def_id).unwrap_or(original)
        let right_state = right.slots.get(def_id).unwrap_or(original)
        let joined = if left.reachable && right.reachable {
            join_slot_state(left_state, right_state)
        } else if left.reachable {
            left_state
        } else {
            right_state
        }
        let joined_slot_id = def_id
        let joined_slot_state = joined
        target.slots.insert(joined_slot_id, joined_slot_state)
        if joined == SLOT_LIVE {
            target.moved_spans.remove(def_id)
        } else {
            let preferred = if left.reachable {
                left.moved_spans.get(def_id)
            } else {
                right.moved_spans.get(def_id)
            }
            match preferred {
                some(moved_span) => {
                    let moved_slot_id = def_id
                    let selected_moved_span = moved_span
                    target.moved_spans.insert(
                        moved_slot_id, selected_moved_span)
                },
                none => match right.moved_spans.get(def_id) {
                    some(moved_span) => {
                        let moved_slot_id = def_id
                        let fallback_moved_span = moved_span
                        target.moved_spans.insert(
                            moved_slot_id, fallback_moved_span)
                    },
                    none => {}
                }
            }
        }
        let left_callable = left.callable_slots.get(def_id)
        let right_callable = right.callable_slots.get(def_id)
        if left.reachable && right.reachable {
            match (left_callable, right_callable) {
                (some(a), some(b)) => if a == b {
                    let callable_slot_id = def_id
                    let callable_ownership_id = a
                    target.callable_slots.insert(
                        callable_slot_id, callable_ownership_id)
                } else {
                    target.callable_slots.remove(def_id)
                },
                _ => target.callable_slots.remove(def_id)
            }
        } else if left.reachable {
            match left_callable {
                some(id) => {
                    let callable_slot_id = def_id
                    let callable_ownership_id = id
                    target.callable_slots.insert(
                        callable_slot_id, callable_ownership_id)
                },
                none => target.callable_slots.remove(def_id)
            }
        } else {
            match right_callable {
                some(id) => {
                    let callable_slot_id = def_id
                    let callable_ownership_id = id
                    target.callable_slots.insert(
                        callable_slot_id, callable_ownership_id)
                },
                none => target.callable_slots.remove(def_id)
            }
        }
    }
}

fn block_current_slots(plan: MovePlan) -> Map<Int, Bool> {
    let mut result: Map<Int, Bool> = map_new()
    for entry in plan.slots.entries() {
        let (def_id, _) = entry
        let blocked_slot_id = def_id
        result.insert(blocked_slot_id, true)
    }
    result
}

fn join_plan_with_snapshot(
    mut plan: MovePlan, snapshot: FlowSnapshot
) {
    let outer_entries = plan.slots.entries()
    for entry in outer_entries {
        let (def_id, original) = entry
        let other = snapshot.slots.get(def_id).unwrap_or(original)
        let joined = join_slot_state(original, other)
        let joined_slot_id = def_id
        let joined_slot_state = joined
        plan.slots.insert(joined_slot_id, joined_slot_state)
        if joined == SLOT_LIVE {
            plan.moved_spans.remove(def_id)
        } else if !plan.moved_spans.contains_key(def_id) {
            match snapshot.moved_spans.get(def_id) {
                some(moved_span) => {
                    let moved_slot_id = def_id
                    let snapshot_moved_span = moved_span
                    plan.moved_spans.insert(
                        moved_slot_id, snapshot_moved_span)
                },
                none => {}
            }
        }
        match (plan.callable_slots.get(def_id),
               snapshot.callable_slots.get(def_id)) {
            (some(a), some(b)) => if a != b {
                plan.callable_slots.remove(def_id)
            },
            _ => plan.callable_slots.remove(def_id)
        }
    }
}

fn add_snapshot(
    current: FlowSnapshot?, value: FlowSnapshot
) -> FlowSnapshot? {
    match current {
        some(existing) => some(join_flow_snapshots(existing, value)),
        none => some(clone_flow_snapshot(value))
    }
}

fn validate_loop_backedge(
    entry: FlowSnapshot, backedge: FlowSnapshot,
    mut sink: CollectingSink, span: Span
) {
    for slot_entry in entry.slots.entries() {
        let (def_id, entry_state) = slot_entry
        let back_state = backedge.slots.get(def_id).unwrap_or(entry_state)
        if entry_state == SLOT_LIVE && back_state != SLOT_LIVE {
            let moved_span = backedge.moved_spans.get(def_id).unwrap_or(span)
            report_ownership_error(sink,
                "ownership transfer may repeat on a loop back-edge",
                moved_span,
                "move the value only on a path that exits the loop, or restore the binding before continue/fallthrough")
        }
    }
}

fn finish_loop_flow(
    mut plan: MovePlan, body_plan: MovePlan, depth: Int,
    entry: FlowSnapshot, mut sink: CollectingSink, span: Span
) {
    let mut backedge: FlowSnapshot? = none
    if body_plan.reachable {
        backedge = add_snapshot(backedge, flow_snapshot(body_plan))
    }
    match body_plan.continue_states.get(depth) {
        some(snapshot) => {
            backedge = add_snapshot(backedge, snapshot)
        },
        none => {}
    }
    match backedge {
        some(snapshot) => {
            validate_loop_backedge(entry, snapshot, sink, span)
            join_plan_with_snapshot(plan, snapshot)
        },
        none => {}
    }
    match body_plan.break_states.get(depth) {
        some(snapshot) => join_plan_with_snapshot(plan, snapshot),
        none => {}
    }

    // The current loop consumes its own break/continue edges. Any entries for
    // an enclosing loop were merely copied into the nested plan and remain.
    plan.break_states = clone_exit_states(body_plan.break_states)
    plan.break_states.remove(depth)
    plan.continue_states = clone_exit_states(body_plan.continue_states)
    plan.continue_states.remove(depth)
}

fn report_partial_transfer(
    metadata: OwnershipMetadata, transfer: Int, ty: Type,
    mut sink: CollectingSink, span: Span
) {
    if transfer != TRANSFER_BORROW && type_may_own(metadata, ty) {
        report_ownership_error(sink,
            "partial move is not supported; move a complete binding instead",
            span, "field/index/destructure/spread transfer is not representable")
    }
}

fn spread_field_is_overridden(
    fields: List<HStructFieldInit>, name: Str
) -> Bool {
    for field in fields { if field.name == name { return true } }
    false
}

fn nominal_type_arguments(ty: Type, expected_name: Str) -> List<Type> {
    match ty {
        Type::StructType { name, type_params } =>
            if name == expected_name {
                let result_type_params = type_params
                result_type_params
            } else { [] },
        Type::EnumType { name, type_params } =>
            if name == expected_name {
                let result_type_params = type_params
                result_type_params
            } else { [] },
        Type::GenericType { base, args } => match base {
            Type::StructType { name, .. } =>
                if name == expected_name {
                    let result_args = args
                    result_args
                } else { [] },
            Type::EnumType { name, .. } =>
                if name == expected_name {
                    let result_args = args
                    result_args
                } else { [] },
            _ => []
        },
        _ => []
    }
}

fn nominal_instantiation_map(
    type_param_vars: List<Int>, args: List<Type>
) -> Map<Int, Type> {
    let mut result: Map<Int, Type> = map_new()
    let mut index = 0
    while index < type_param_vars.len() && index < args.len() {
        match (type_param_vars.get(index), args.get(index)) {
            (some(var_id), some(arg)) => {
                let type_var_id = var_id
                let type_argument = arg
                result.insert(type_var_id, type_argument)
            },
            _ => {}
        }
        index = index + 1
    }
    result
}

fn struct_spread_has_uncovered_may_own_field(
    env: TypeEnv, metadata: OwnershipMetadata, name: Str, ty: Type,
    fields: List<HStructFieldInit>
) -> Bool {
    match env.types.structs.get(name) {
        some(def) => {
            let subst = nominal_instantiation_map(def.type_param_vars,
                nominal_type_arguments(ty, def.name))
            for field in def.fields {
                if !spread_field_is_overridden(fields, field.name) &&
                   type_may_own(metadata, apply_subst_map(subst, field.ty)) {
                    return true
                }
            }
            false
        },
        none => true
    }
}

fn variant_spread_has_uncovered_may_own_field(
    env: TypeEnv, metadata: OwnershipMetadata, enum_name: Str,
    variant_name: Str, ty: Type, fields: List<HStructFieldInit>
) -> Bool {
    match env.types.enums.get(enum_name) {
        some(def) => match lookup_variant(def, variant_name) {
            some(variant) => match variant.field_names {
                some(names) => {
                    if names.len() != variant.fields.len() { return true }
                    let subst = nominal_instantiation_map(def.type_param_vars,
                        nominal_type_arguments(ty, def.name))
                    let mut index = 0
                    while index < names.len() {
                        match (names.get(index), variant.fields.get(index)) {
                            (some(field_name), some(field_ty)) => {
                                if !spread_field_is_overridden(
                                        fields, field_name) &&
                                   type_may_own(metadata,
                                       apply_subst_map(subst, field_ty)) {
                                    return true
                                }
                            },
                            _ => return true
                        }
                        index = index + 1
                    }
                    false
                },
                none => variant.fields.len() > 0
            },
            none => true
        },
        none => true
    }
}

fn report_partial_spread_transfer(
    has_uncovered_may_own: Bool, mut sink: CollectingSink, span: Span
) {
    if has_uncovered_may_own {
        report_ownership_error(sink,
            "partial move is not supported; move a complete binding instead",
            span,
            "spread has an uncovered owner-bearing field; override every such field or transfer a complete binding")
    }
}

const SPREAD_SOURCE_ALL_BORROW: Int = 0
const SPREAD_SOURCE_ALL_FRESH: Int = 1
const SPREAD_SOURCE_MIXED_OR_UNKNOWN: Int = 2
const SPREAD_SOURCE_NO_REACHABLE_VALUE: Int = 3

fn merge_spread_source_classifications(left: Int, right: Int) -> Int {
    if left == SPREAD_SOURCE_NO_REACHABLE_VALUE { return right }
    if right == SPREAD_SOURCE_NO_REACHABLE_VALUE { return left }
    if left == SPREAD_SOURCE_MIXED_OR_UNKNOWN ||
       right == SPREAD_SOURCE_MIXED_OR_UNKNOWN {
        return SPREAD_SOURCE_MIXED_OR_UNKNOWN
    }
    if left == right { left } else { SPREAD_SOURCE_MIXED_OR_UNKNOWN }
}

fn spread_branch_source_classification(
    metadata: OwnershipMetadata, plan: MovePlan, boxed_vars: Set<Int>,
    expr: HExpr
) -> Int {
    spread_source_classification(metadata, plan, boxed_vars, expr)
}

fn spread_match_arm_source_classification(
    metadata: OwnershipMetadata, plan: MovePlan, boxed_vars: Set<Int>,
    arm: HMatchArm
) -> Int {
    match arm {
        HMatchArm { guard, body, .. } => {
            match guard {
                some(value) => if !expr_has_reachable_value(value) {
                    return SPREAD_SOURCE_NO_REACHABLE_VALUE
                },
                none => {}
            }
            spread_branch_source_classification(
                metadata, plan, boxed_vars, body)
        }
    }
}

fn spread_block_local_init_classification(
    metadata: OwnershipMetadata, plan: MovePlan, boxed_vars: Set<Int>,
    stmts: List<HStmt>, target_id: Int, fuel: Int
) -> Int? {
    if fuel <= 0 { return some(SPREAD_SOURCE_MIXED_OR_UNKNOWN) }
    for stmt in stmts {
        match stmt {
            HStmt::Let { def_id: some(local_id), init, .. } => {
                if local_id == target_id {
                    let identity_init = init
                    let classification_init = init
                    match identity_init {
                        HExpr::Ident { def_id: some(source_id), .. } => {
                            match spread_block_local_init_classification(
                                    metadata, plan, boxed_vars, stmts,
                                    source_id, fuel - 1) {
                                some(local_classification) =>
                                    {
                                        let result_classification =
                                            local_classification
                                        return some(result_classification)
                                    },
                                none => {
                                    let source_ty = hexpr_type(
                                        classification_init)
                                    return some(if type_may_own(
                                                metadata, source_ty) &&
                                            binding_invalidation_status(
                                                plan, boxed_vars, source_id) ==
                                                INVALIDATION_READY {
                                        SPREAD_SOURCE_ALL_FRESH
                                    } else {
                                        SPREAD_SOURCE_MIXED_OR_UNKNOWN
                                    })
                                }
                            }
                        },
                        HExpr::Take { source_def_id, .. } => {
                            match spread_block_local_init_classification(
                                    metadata, plan, boxed_vars, stmts,
                                    source_def_id, fuel - 1) {
                                some(local_classification) =>
                                    {
                                        let result_classification =
                                            local_classification
                                        return some(result_classification)
                                    },
                                none => {
                                    let source_ty = hexpr_type(
                                        classification_init)
                                    return some(if type_may_own(
                                                metadata, source_ty) &&
                                            binding_invalidation_status(
                                                plan, boxed_vars,
                                                source_def_id) ==
                                                INVALIDATION_READY {
                                        SPREAD_SOURCE_ALL_FRESH
                                    } else {
                                        SPREAD_SOURCE_MIXED_OR_UNKNOWN
                                    })
                                }
                            }
                        },
                        HExpr::Ident { def_id: none, .. } =>
                            return some(SPREAD_SOURCE_MIXED_OR_UNKNOWN),
                        _ => return some(spread_source_classification(
                            metadata, plan, boxed_vars,
                            classification_init))
                    }
                }
            },
            HStmt::Var { def_id: some(local_id), .. } => {
                if local_id == target_id {
                    return some(SPREAD_SOURCE_MIXED_OR_UNKNOWN)
                }
            },
            _ => {}
        }
    }
    none
}

fn spread_block_source_classification(
    metadata: OwnershipMetadata, plan: MovePlan, boxed_vars: Set<Int>,
    stmts: List<HStmt>, tail: HExpr?
) -> Int {
    let (tail_local_id, initial_classification) = match tail {
        some(value) => {
            let identity_value = value
            let classification_value = value
            let local_id = match identity_value {
                HExpr::Ident { def_id, .. } => def_id,
                HExpr::Take { source_def_id, .. } => {
                    let tail_source_def_id = source_def_id
                    some(tail_source_def_id)
                },
                _ => none
            }
            let fallback = spread_source_classification(
                metadata, plan, boxed_vars, classification_value)
            (local_id, fallback)
        },
        none => return SPREAD_SOURCE_MIXED_OR_UNKNOWN
    }
    let mut classification = initial_classification
    match tail_local_id {
        some(target_id) => {
            let search_fuel = stmts.len() + 1
            match spread_block_local_init_classification(
                    metadata, plan, boxed_vars, stmts, target_id,
                    search_fuel) {
                some(init_classification) => {
                    classification = if init_classification ==
                            SPREAD_SOURCE_ALL_FRESH {
                        SPREAD_SOURCE_ALL_FRESH
                    } else if init_classification ==
                              SPREAD_SOURCE_NO_REACHABLE_VALUE {
                        SPREAD_SOURCE_NO_REACHABLE_VALUE
                    } else {
                        SPREAD_SOURCE_MIXED_OR_UNKNOWN
                    }
                },
                none => {}
            }
        },
        none => {}
    }
    classification
}

// A spread of a fresh aggregate transfers its uncovered fields without
// implicitly cloning a user binding: C duplicates the uncovered references,
// then Perceus drops the one materialized source.  A borrowed binding or
// projection has no such source ownership and remains subject to the partial
// move rejection above.  This classification consumes only exact call
// descriptors and expression shape; spellings are never semantic authority.
fn spread_source_classification(
    metadata: OwnershipMetadata, plan: MovePlan, boxed_vars: Set<Int>,
    expr: HExpr
) -> Int {
    let reachability_expr = expr
    let classified_expr = expr
    if !expr_has_reachable_value(reachability_expr) {
        return SPREAD_SOURCE_NO_REACHABLE_VALUE
    }
    match classified_expr {
        HExpr::Call { callee_def_id, .. } => match exact_call_ownership_id(
                metadata, plan, callee_def_id) {
            some(ownership_id) => if callable_return_ownership(
                    metadata, ownership_id) == RETURN_OWNERSHIP_OWNED {
                SPREAD_SOURCE_ALL_FRESH
            } else {
                SPREAD_SOURCE_ALL_BORROW
            },
            none => SPREAD_SOURCE_MIXED_OR_UNKNOWN
        },
        HExpr::StructLit { .. } |
        HExpr::NamedVariantConstruct { .. } |
        HExpr::ListLit { .. } | HExpr::TupleLit { .. } |
        HExpr::RangeExpr { .. } | HExpr::StringInterp { .. } |
        HExpr::Lambda { .. } | HExpr::DictConstruct { .. } |
        HExpr::BinOp { .. } | HExpr::UnaryOp { .. } |
        HExpr::IntLit { .. } | HExpr::FloatLit { .. } |
        HExpr::StrLit { .. } | HExpr::BoolLit { .. } |
        HExpr::Clone { .. } => SPREAD_SOURCE_ALL_FRESH,
        HExpr::Ident { .. } | HExpr::FieldAccess { .. } |
        HExpr::IndexExpr { .. } | HExpr::Take { .. } =>
            SPREAD_SOURCE_ALL_BORROW,
        HExpr::Block { stmts, tail, .. } =>
            spread_block_source_classification(
                metadata, plan, boxed_vars, stmts, tail),
        HExpr::IfExpr { then_branch, else_branch, .. } => {
            let mut classification = spread_branch_source_classification(
                metadata, plan, boxed_vars, then_branch)
            match else_branch {
                some(other) => {
                    classification = merge_spread_source_classifications(
                        classification,
                        spread_branch_source_classification(
                            metadata, plan, boxed_vars, other))
                },
                none => return SPREAD_SOURCE_MIXED_OR_UNKNOWN
            }
            classification
        },
        HExpr::MatchExpr { arms, .. } => {
            let mut classification = SPREAD_SOURCE_NO_REACHABLE_VALUE
            for arm in arms {
                classification = merge_spread_source_classifications(
                    classification, spread_match_arm_source_classification(
                        metadata, plan, boxed_vars, arm))
            }
            classification
        },
        HExpr::UnsafeBlock { body, .. } =>
            spread_source_classification(
                metadata, plan, boxed_vars, body),
        _ => SPREAD_SOURCE_MIXED_OR_UNKNOWN
    }
}

fn report_nonuniform_spread_source(
    classification: Int, mut sink: CollectingSink, span: Span
) {
    if classification == SPREAD_SOURCE_MIXED_OR_UNKNOWN {
        report_ownership_error(sink,
            "spread source ownership is not uniform across reachable control-flow branches",
            span,
            "every reachable source branch must be proven all-fresh or all-borrowed before spread lowering")
    }
}

fn plan_block_expr(
    env: TypeEnv, metadata: OwnershipMetadata, mut plan: MovePlan,
    boxed_vars: Set<Int>, mut sink: CollectingSink,
    stmts: List<HStmt>, tail: HExpr?, ty: Type, effects: EffectRow,
    span: Span, transfer: Int
) -> HExpr {
    let mut declared: List<Int> = []
    let mut final_stmts: List<HStmt> = []
    let mut reaches_tail = true
    for stmt in stmts {
        let stmt_for_planning = stmt
        let stmt_for_reachability = stmt
        final_stmts.push(plan_stmt(env, metadata, plan, boxed_vars, sink,
            stmt_for_planning, declared))
        if !stmt_reaches_next(stmt_for_reachability) {
            reaches_tail = false
            break
        }
    }
    let final_tail = if reaches_tail {
        match tail {
            some(value) => {
                let planned_value = value
                some(plan_expr(env, metadata, plan, boxed_vars, sink,
                    planned_value, transfer))
            },
            none => none
        }
    } else {
        // Physical HIR pruning boundary: downstream RC/codegen/verifier never
        // receive the unreachable suffix or its syntactic tail.
        none
    }
    for def_id in declared {
        plan.slots.remove(def_id)
        plan.moved_spans.remove(def_id)
        plan.borrowed_slots.remove(def_id)
        plan.callable_slots.remove(def_id)
    }
    HExpr::Block { stmts: final_stmts, tail: final_tail,
        ty: ty, effects: effects, span: span }
}

fn plan_lambda_body(
    env: TypeEnv, metadata: OwnershipMetadata, boxed_vars: Set<Int>,
    mut sink: CollectingSink, params: List<HParam>,
    extra_bindings: List<HPatternBinding>, body: HExpr
) -> HExpr {
    let mut lambda_plan = new_move_plan()
    for param in params {
        match param.def_id {
            some(def_id) => {
                let external_drop_owner =
                    hparam_is_external_drop_owner(param)
                let registered_param_id = def_id
                register_slot(lambda_plan, registered_param_id,
                    hparam_ownership(param) != PARAM_OWNERSHIP_MOVE ||
                        external_drop_owner,
                    callable_id_from_type(param.ty))
                if external_drop_owner {
                    let blocked_param_id = def_id
                    lambda_plan.blocked_takes.insert(blocked_param_id, true)
                }
            },
            none => {}
        }
    }
    // Resume bindings are compiler-created callable capabilities whose
    // descriptor is part of the handler ABI, not a container projection.
    register_pattern_slots(lambda_plan, metadata, extra_bindings, true)
    let planned_body = body
    plan_expr(env, metadata, lambda_plan, boxed_vars, sink, planned_body,
        TRANSFER_OWNING)
}

// The retained-HIR census and validator run before ownership planning, so dead
// dependent children have already contributed every required DefId descriptor.
// They must not then flow into ANF/Perceus/codegen as ordinary expressions:
// those passes would demand Takes/boxing for code that cannot execute. A root
// that itself diverges is preserved as the sole statement; a child behind a
// diverging guard becomes an inert typed block.
fn backend_neutral_dead_child(expr: HExpr) -> HExpr {
    HExpr::Block { stmts: [], tail: none,
        ty: hexpr_type(expr), effects: hexpr_effects(expr),
        span: hexpr_span(expr) }
}

fn retain_only_diverging_root(
    root: HExpr, ty: Type, effects: EffectRow, span: Span
) -> HExpr {
    let root_span = hexpr_span(root)
    HExpr::Block {
        stmts: [HStmt::ExprStmt { expr: root, span: root_span }],
        tail: none, ty: ty, effects: effects, span: span
    }
}

// Default post-plan invariant for callable Move edges.  The shared HIR
// predicate ignores Return/Never-only value paths consistently with Perceus
// and the post-RC verifier.
fn assert_planned_transfer_edge(
    env: TypeEnv, metadata: OwnershipMetadata,
    expr: HExpr, transfer: Int, sink: CollectingSink
) {
    if transfer_requires_binding_invalidation(
            env, metadata, transfer, hexpr_type(expr)) &&
       !sink.has_errors() &&
       move_edge_has_reachable_bare_binding(expr, false) {
        panic("unreachable: callable transfer binding edge has no exact Take")
    }
}

// Preserve the same direct-Match tuple-view authority in the concrete move
// plan.  This must not be folded into the ordinary TupleLit arm: a tuple value
// constructed for storage/return or passed as an owning argument still owns
// its elements.
fn plan_match_scrutinee_borrow_view(
    mut env: TypeEnv, metadata: OwnershipMetadata, mut plan: MovePlan,
    boxed_vars: Set<Int>, mut sink: CollectingSink, move expr: HExpr
) -> HExpr {
    match expr {
        HExpr::TupleLit { elements, ty, effects, span } => {
            let mut final_elements: List<HExpr> = []
            for element in elements {
                let element_for_planning = element
                final_elements.push(plan_match_scrutinee_borrow_view(
                    env, metadata, plan, boxed_vars, sink,
                    element_for_planning))
            }
            HExpr::TupleLit { elements: final_elements,
                ty: ty, effects: effects, span: span }
        },
        _ => plan_expr(
            env, metadata, plan, boxed_vars, sink, expr, TRANSFER_BORROW)
    }
}

fn plan_expr(
    mut env: TypeEnv, metadata: OwnershipMetadata, mut plan: MovePlan,
    boxed_vars: Set<Int>, mut sink: CollectingSink,
    expr: HExpr, transfer: Int
) -> HExpr {
    match expr {
        HExpr::Ident { name, resolved_name, def_id, dict_closure_dicts,
                       ty, effects, span } => {
            if is_nullary_variant_ctor_ident(expr) ||
               is_option_none_ctor_ident(expr) ||
               is_materialized_fn_value(expr) {
                let result_name = name
                let result_resolved_name = resolved_name
                let result_def_id = def_id
                let result_dict_closure_dicts = dict_closure_dicts
                let result_ty = ty
                let result_effects = effects
                let result_span = span
                return HExpr::Ident { name: result_name,
                    resolved_name: result_resolved_name,
                    def_id: result_def_id,
                    dict_closure_dicts: result_dict_closure_dicts,
                    ty: result_ty, effects: result_effects,
                    span: result_span }
            }
            let transfer_name = name
            let transfer_resolved_name = resolved_name
            let transfer_def_id = def_id
            let transfer_dict_closure_dicts = dict_closure_dicts
            let transfer_ty = ty
            let transfer_effects = effects
            let transfer_span = span
            plan_ident_transfer(env, metadata, plan, boxed_vars, sink,
                transfer_name, transfer_resolved_name, transfer_def_id,
                transfer_dict_closure_dicts, transfer_ty, transfer_effects,
                transfer_span, transfer)
        },
        HExpr::BinOp { op, left, right, eq_dispatch, ord_dispatch,
                       ty, effects, span } => {
            let result_op = op
            let left_for_planning = left
            let right_for_planning = right
            let result_eq_dispatch = eq_dispatch
            let result_ord_dispatch = ord_dispatch
            let result_ty = ty
            let result_effects = effects
            let result_span = span
            HExpr::BinOp {
                op: result_op,
                left: plan_expr(env, metadata, plan, boxed_vars, sink,
                    left_for_planning, TRANSFER_BORROW),
                right: plan_expr(env, metadata, plan, boxed_vars, sink,
                    right_for_planning, TRANSFER_BORROW),
                eq_dispatch: result_eq_dispatch,
                ord_dispatch: result_ord_dispatch,
                ty: result_ty, effects: result_effects, span: result_span
            }
        },
        HExpr::UnaryOp { op, operand, ty, effects, span } => {
            let result_op = op
            let operand_for_planning = operand
            let result_ty = ty
            let result_effects = effects
            let result_span = span
            HExpr::UnaryOp { op: result_op,
                operand: plan_expr(env, metadata, plan, boxed_vars, sink,
                    operand_for_planning, TRANSFER_BORROW),
                ty: result_ty, effects: result_effects, span: result_span }
        },
        HExpr::Call { callee, callee_def_id, callable_result_def_id, args, type_args, resolved_dicts,
                       dict_dispatch, ty, effects, span } => {
            if callee_def_id.is_none() {
                report_ownership_error(sink,
                    "call has no exact callable identity", span,
                    "bind a complex callable producer before calling it")
            }
            let mut final_callee = callee
            let is_method = match callee {
                HExpr::FieldAccess { receiver, field, ty: callee_ty,
                                     effects: callee_effects,
                                     span: callee_span } => {
                    let receiver_for_planning = receiver
                    let result_field = field
                    let result_callee_ty = callee_ty
                    let result_callee_effects = callee_effects
                    let result_callee_span = callee_span
                    let receiver_transfer = match callee_def_id {
                        some(_) => call_param_transfer(
                            metadata, plan, callee_def_id, 0),
                        none => TRANSFER_BORROW
                    }
                    let planned_receiver = plan_expr(env, metadata, plan,
                        boxed_vars, sink, receiver_for_planning,
                        receiver_transfer)
                    assert_planned_transfer_edge(
                        env, metadata, planned_receiver,
                        receiver_transfer, sink)
                    final_callee = HExpr::FieldAccess {
                        receiver: planned_receiver,
                        field: result_field, ty: result_callee_ty,
                        effects: result_callee_effects,
                        span: result_callee_span
                    }
                    true
                },
                _ => {
                    let callee_for_planning = callee
                    final_callee = plan_expr(env, metadata, plan, boxed_vars,
                        sink, callee_for_planning, TRANSFER_BORROW)
                    false
                }
            }
            let mut final_args: List<HExpr> = []
            let mut index = 0
            for arg in args {
                let arg_for_planning = arg
                let descriptor_index = index + if is_method { 1 } else { 0 }
                validate_callable_argument(env, metadata, plan, callee,
                    descriptor_index, arg, sink, span)
                let arg_transfer = match callee_def_id {
                    some(_) => call_param_transfer(metadata, plan,
                        callee_def_id, descriptor_index),
                    none => TRANSFER_BORROW
                }
                let planned_arg = plan_expr(env, metadata, plan, boxed_vars,
                    sink, arg_for_planning, arg_transfer)
                assert_planned_transfer_edge(
                    env, metadata, planned_arg, arg_transfer, sink)
                final_args.push(planned_arg)
                index = index + 1
            }
            let result_ty = match callable_result_def_id {
                some(result_id) => match metadata.callable_by_def_id.get(
                        result_id) {
                    some(ownership_id) => {
                        let ty_for_ownership = ty
                        type_with_ownership(ty_for_ownership, ownership_id)
                    },
                    none => ty
                },
                none => ty
            }
            validate_call_result_role(
                metadata, callee_def_id, result_ty, sink, span)
            let result_callee_def_id = callee_def_id
            let result_callable_result_def_id = callable_result_def_id
            let result_type_args = type_args
            let result_resolved_dicts = resolved_dicts
            let result_dict_dispatch = dict_dispatch
            let result_expr_ty = result_ty
            let result_ty_for_never = result_ty
            let result_ty_for_ownership = result_ty
            let result_effects = effects
            let result_span = span
            let result = HExpr::Call { callee: final_callee,
                callee_def_id: result_callee_def_id,
                callable_result_def_id: result_callable_result_def_id,
                args: final_args,
                type_args: result_type_args,
                resolved_dicts: result_resolved_dicts,
                dict_dispatch: result_dict_dispatch, ty: result_expr_ty,
                effects: result_effects, span: result_span }
            if type_is_never(result_ty_for_never) {
                plan.reachable = false
            }
            let borrowed_result = call_result_needs_clone(
                metadata, plan, callee_def_id)
            if transfer != TRANSFER_BORROW && borrowed_result {
                if type_may_own(metadata, result_ty_for_ownership) {
                    report_ownership_error(sink,
                        "cannot transfer borrowed owner-bearing call result",
                        span,
                        "consume the owning container or return a genuinely owned value; implicit Clone is forbidden for Drop-bearing values")
                    result
                } else {
                    result
                }
            } else {
                result
            }
        },
        HExpr::FieldAccess { receiver, field, ty, effects, span } => {
            report_partial_transfer(metadata, transfer, ty, sink, span)
            let receiver_for_planning = receiver
            let result_field = field
            let result_ty = ty
            let result_effects = effects
            let result_span = span
            HExpr::FieldAccess {
                receiver: plan_expr(env, metadata, plan, boxed_vars, sink,
                    receiver_for_planning, TRANSFER_BORROW),
                field: result_field, ty: result_ty,
                effects: result_effects, span: result_span
            }
        },
        HExpr::StructLit { name, type_args, fields, spread,
                           ty, effects, span } => {
            // C evaluates the spread source before explicit field values.
            // Plan the same edge order so a later field Take cannot
            // retroactively invalidate a source that was already read.
            let spread_fields = fields
            let planned_fields = fields
            let final_spread = match spread {
                some(source) => {
                    let classification_source = source
                    let diagnostic_source = source
                    let planning_source = source
                    let classification = spread_source_classification(
                        metadata, plan, boxed_vars, classification_source)
                    report_nonuniform_spread_source(
                        classification, sink, hexpr_span(diagnostic_source))
                    report_partial_spread_transfer(
                        classification == SPREAD_SOURCE_ALL_BORROW &&
                            struct_spread_has_uncovered_may_own_field(
                                env, metadata, name, ty, spread_fields),
                        sink, hexpr_span(diagnostic_source))
                    let source_transfer = if classification ==
                            SPREAD_SOURCE_ALL_FRESH {
                        TRANSFER_OWNING
                    } else {
                        TRANSFER_BORROW
                    }
                    let final_source = plan_expr(
                        env, metadata, plan, boxed_vars, sink,
                        planning_source, source_transfer)
                    if classification ==
                            SPREAD_SOURCE_NO_REACHABLE_VALUE {
                        plan.reachable = false
                    }
                    some(final_source)
                },
                none => none
            }
            let mut final_fields: List<HStructFieldInit> = []
            if plan.reachable {
                for field in planned_fields {
                    final_fields.push(HStructFieldInit { name: field.name,
                        value: plan_expr(env, metadata, plan, boxed_vars, sink,
                            field.value, TRANSFER_OWNING) })
                }
            }
            let result_name = name
            let result_type_args = type_args
            let result_ty = ty
            let result_effects = effects
            let result_span = span
            HExpr::StructLit { name: result_name,
                type_args: result_type_args,
                fields: final_fields, spread: final_spread,
                ty: result_ty, effects: result_effects, span: result_span }
        },
        HExpr::NamedVariantConstruct { enum_name, variant_name, fields,
                                       spread, ty, effects, span } => {
            let spread_fields = fields
            let planned_fields = fields
            let final_spread = match spread {
                some(source) => {
                    let classification_source = source
                    let diagnostic_source = source
                    let planning_source = source
                    let classification = spread_source_classification(
                        metadata, plan, boxed_vars, classification_source)
                    report_nonuniform_spread_source(
                        classification, sink, hexpr_span(diagnostic_source))
                    report_partial_spread_transfer(
                        classification == SPREAD_SOURCE_ALL_BORROW &&
                            variant_spread_has_uncovered_may_own_field(
                                env, metadata, enum_name, variant_name, ty,
                                spread_fields),
                        sink, hexpr_span(diagnostic_source))
                    let source_transfer = if classification ==
                            SPREAD_SOURCE_ALL_FRESH {
                        TRANSFER_OWNING
                    } else {
                        TRANSFER_BORROW
                    }
                    let final_source = plan_expr(
                        env, metadata, plan, boxed_vars, sink,
                        planning_source, source_transfer)
                    if classification ==
                            SPREAD_SOURCE_NO_REACHABLE_VALUE {
                        plan.reachable = false
                    }
                    some(final_source)
                },
                none => none
            }
            let mut final_fields: List<HStructFieldInit> = []
            if plan.reachable {
                for field in planned_fields {
                    final_fields.push(HStructFieldInit { name: field.name,
                        value: plan_expr(env, metadata, plan, boxed_vars, sink,
                            field.value, TRANSFER_OWNING) })
                }
            }
            let result_enum_name = enum_name
            let result_variant_name = variant_name
            let result_ty = ty
            let result_effects = effects
            let result_span = span
            HExpr::NamedVariantConstruct { enum_name: result_enum_name,
                variant_name: result_variant_name, fields: final_fields,
                spread: final_spread, ty: result_ty,
                effects: result_effects, span: result_span }
        },
        HExpr::MatchExpr { scrutinee, arms, ty, effects, span } => {
            let scrutinee_reaches_value =
                expr_has_reachable_value(scrutinee)
            let reachable_children = enumerate_reachable_match_children(
                scrutinee, arms)
            let mut reachable_guards: Set<Int> = set_new()
            let mut reachable_bodies: Set<Int> = set_new()
            for inferred_child in reachable_children {
                let child: ReachableControlChild = inferred_child
                if child.kind == REACHABLE_CHILD_MATCH_SCRUTINEE {
                } else if child.kind == REACHABLE_CHILD_ARM_GUARD {
                    reachable_guards.insert(child.arm_index)
                } else if child.kind == REACHABLE_CHILD_ARM_BODY {
                    reachable_bodies.insert(child.arm_index)
                } else {
                    panic(
                        "unreachable: invalid Match reachable-child kind")
                }
            }
            let scrutinee_for_planning = scrutinee
            let final_scrutinee = plan_match_scrutinee_borrow_view(
                env, metadata, plan, boxed_vars, sink,
                scrutinee_for_planning)
            if !scrutinee_reaches_value {
                let result_ty = copy_ownership_type(ty)
                let result_effects = copy_ownership_effects(effects)
                let result_span = copy_ownership_span(span)
                return retain_only_diverging_root(
                    final_scrutinee, result_ty, result_effects, result_span)
            }
            let mut final_arms: List<HMatchArm> = []
            let mut aggregate = clone_move_plan(plan)
            let mut next_arm_plan = clone_move_plan(plan)
            let mut first = true
            let mut arm_index = 0
            for arm in arms {
                let mut arm_plan = clone_move_plan(next_arm_plan)
                let guard_is_child = reachable_guards.contains(arm_index)
                let body_is_child = reachable_bodies.contains(arm_index)
                if guard_is_child || body_is_child {
                    report_unproven_pattern_callables(
                        metadata, arm.bindings, sink, arm.span)
                    register_pattern_slots(
                        arm_plan, metadata, arm.bindings, false)
                }
                let preserved_guard = arm.guard
                let final_guard = if guard_is_child {
                    match arm.guard {
                    some(guard) => {
                        let guard_for_planning = guard
                        let value = plan_expr(env, metadata, arm_plan,
                            boxed_vars, sink, guard_for_planning,
                            TRANSFER_BORROW)
                        // Pattern miss preserves the incoming state; guard
                        // false preserves every effect of evaluating the guard
                        // before trying the next arm. A diverging guard has no
                        // false edge, so only pattern miss reaches later arms.
                        if body_is_child {
                            let mut fallthrough = clone_move_plan(
                                next_arm_plan)
                            join_move_plans(fallthrough,
                                next_arm_plan, arm_plan)
                            next_arm_plan = fallthrough
                        }
                        some(value)
                    },
                    none => panic(
                        "unreachable: reachable guard child has no guard")
                    }
                } else {
                    preserved_guard
                }
                let final_body = if body_is_child {
                    let value = plan_expr(env, metadata, arm_plan,
                        boxed_vars, sink, arm.body, transfer)
                    if first {
                        aggregate = arm_plan
                        first = false
                    } else {
                        let before = clone_move_plan(plan)
                        join_move_plans(before, aggregate, arm_plan)
                        aggregate = before
                    }
                    value
                } else {
                    backend_neutral_dead_child(arm.body)
                }
                final_arms.push(HMatchArm { pattern: arm.pattern,
                    bindings: arm.bindings, guard: final_guard,
                    body: final_body, span: arm.span })
                arm_index = arm_index + 1
            }
            if !first {
                join_move_plans(plan, aggregate, aggregate)
            } else {
                plan.reachable = false
            }
            let result_ty = ty
            let result_effects = effects
            let result_span = span
            HExpr::MatchExpr { scrutinee: final_scrutinee,
                arms: final_arms, ty: result_ty,
                effects: result_effects, span: result_span }
        },
        HExpr::Block { stmts, tail, ty, effects, span } => {
            let block_ty = ty
            let block_effects = effects
            let block_span = span
            plan_block_expr(env, metadata, plan, boxed_vars, sink,
                stmts, tail, block_ty, block_effects, block_span, transfer)
        },
        HExpr::IfExpr { condition, then_branch, else_branch,
                        ty, effects, span } => {
            let condition_reaches_value =
                expr_has_reachable_value(condition)
            let has_else = match else_branch {
                some(_) => true,
                none => false
            }
            let reachable_children = enumerate_reachable_if_children(
                condition, has_else)
            let condition_for_planning = condition
            let then_branch_for_planning = then_branch
            let final_condition = plan_expr(env, metadata, plan,
                boxed_vars, sink, condition_for_planning, TRANSFER_BORROW)
            if !condition_reaches_value {
                let result_ty = copy_ownership_type(ty)
                let result_effects = copy_ownership_effects(effects)
                let result_span = copy_ownership_span(span)
                return retain_only_diverging_root(
                    final_condition, result_ty, result_effects, result_span)
            }
            let mut then_plan = clone_move_plan(plan)
            let mut else_plan = clone_move_plan(plan)
            let mut final_then = then_branch
            let mut final_else = else_branch
            let mut then_is_child = false
            let mut else_is_child = false
            for inferred_child in reachable_children {
                let child: ReachableControlChild = inferred_child
                if child.kind == REACHABLE_CHILD_IF_CONDITION {
                } else if child.kind == REACHABLE_CHILD_IF_THEN {
                    then_is_child = true
                } else if child.kind == REACHABLE_CHILD_IF_ELSE {
                    else_is_child = true
                } else {
                    panic(
                        "unreachable: invalid If reachable-child kind")
                }
            }
            if then_is_child {
                let reachable_then = then_branch_for_planning
                final_then = plan_expr(env, metadata, then_plan,
                    boxed_vars, sink, reachable_then, transfer)
            }
            if else_is_child {
                final_else = match else_branch {
                    some(branch) => {
                        let branch_for_planning = branch
                        some(plan_expr(env, metadata, else_plan,
                            boxed_vars, sink, branch_for_planning,
                            transfer))
                    },
                    none => panic(
                        "unreachable: reachable else child has no branch")
                }
            }
            let has_body_child = then_is_child || else_is_child
            if has_body_child {
                join_move_plans(plan, then_plan, else_plan)
            }
            let result_ty = ty
            let result_effects = effects
            let result_span = span
            HExpr::IfExpr { condition: final_condition,
                then_branch: final_then, else_branch: final_else,
                ty: result_ty, effects: result_effects, span: result_span }
        },
        HExpr::StringInterp { parts, ty, effects, span } => {
            let mut final_parts: List<HStringInterpPart> = []
            for part in parts {
                match part {
                    HStringInterpPart::Expression(value) => {
                        let value_for_planning = value
                        final_parts.push(HStringInterpPart::Expression(
                            plan_expr(env, metadata, plan, boxed_vars, sink,
                                value_for_planning, TRANSFER_BORROW)))
                    },
                    HStringInterpPart::Literal(value) => {
                        let literal_value = value
                        final_parts.push(
                            HStringInterpPart::Literal(literal_value))
                    }
                }
            }
            let result_ty = ty
            let result_effects = effects
            let result_span = span
            HExpr::StringInterp { parts: final_parts,
                ty: result_ty, effects: result_effects, span: result_span }
        },
        HExpr::TryCatch { body, arms, ty, effects, span } => {
            let reachable_children = enumerate_reachable_arm_children(arms)
            let mut reachable_guards: Set<Int> = set_new()
            let mut reachable_bodies: Set<Int> = set_new()
            for inferred_child in reachable_children {
                let child: ReachableControlChild = inferred_child
                if child.kind == REACHABLE_CHILD_ARM_GUARD {
                    reachable_guards.insert(child.arm_index)
                } else if child.kind == REACHABLE_CHILD_ARM_BODY {
                    reachable_bodies.insert(child.arm_index)
                } else {
                    panic("unreachable: invalid Catch reachable-child kind")
                }
            }
            let mut body_plan = clone_move_plan(plan)
            body_plan.blocked_takes = block_current_slots(plan)
            let body_for_planning = body
            let final_body = plan_expr(env, metadata, body_plan,
                boxed_vars, sink, body_for_planning, transfer)
            let mut aggregate = body_plan
            let mut final_arms: List<HMatchArm> = []
            let mut next_arm_plan = clone_move_plan(plan)
            next_arm_plan.blocked_takes = block_current_slots(plan)
            let mut arm_index = 0
            for arm in arms {
                let mut arm_plan = clone_move_plan(next_arm_plan)
                report_unproven_pattern_callables(
                    metadata, arm.bindings, sink, arm.span)
                register_pattern_slots(
                    arm_plan, metadata, arm.bindings, false)
                let final_guard = match arm.guard {
                    some(guard) => {
                        if !reachable_guards.contains(arm_index) {
                            panic(
                                "unreachable: Catch guard missing reachability child")
                        }
                        let guard_for_planning = guard
                        let value = plan_expr(env, metadata, arm_plan,
                            boxed_vars, sink, guard_for_planning,
                            TRANSFER_BORROW)
                        // A guard that can produce a Bool has a false edge to
                        // the next arm. A diverging guard has only the pattern-
                        // miss edge, which preserves the incoming state.
                        if reachable_bodies.contains(arm_index) {
                            let mut fallthrough = clone_move_plan(
                                next_arm_plan)
                            join_move_plans(fallthrough,
                                next_arm_plan, arm_plan)
                            next_arm_plan = fallthrough
                        }
                        some(value)
                    },
                    none => none
                }
                let final_arm_body = if reachable_bodies.contains(arm_index) {
                    let value = plan_expr(env, metadata, arm_plan,
                        boxed_vars, sink, arm.body, transfer)
                    let before = clone_move_plan(plan)
                    join_move_plans(before, aggregate, arm_plan)
                    aggregate = before
                    value
                } else {
                    backend_neutral_dead_child(arm.body)
                }
                final_arms.push(HMatchArm { pattern: arm.pattern,
                    bindings: arm.bindings, guard: final_guard,
                    body: final_arm_body,
                    span: arm.span })
                arm_index = arm_index + 1
            }
            join_move_plans(plan, aggregate, aggregate)
            let result_ty = ty
            let result_effects = effects
            let result_span = span
            HExpr::TryCatch { body: final_body, arms: final_arms,
                ty: result_ty, effects: result_effects, span: result_span }
        },
        HExpr::HandleExpr { body, handlers, ty, effects, span } => {
            // Handler closures/evidence are constructed from the entry state,
            // before the handled body can run. Tail-resumptive evidence may
            // escape the handle through an effectful callable value, so an
            // exact may-own outer capture cannot be retained safely without
            // lifetime/consume semantics. Abort fail.raise arms execute on an
            // inline longjmp path and retain their existing entry-state model.
            let capture_entry_plan = clone_move_plan(plan)
            let mut captured_may_own_slots: Set<Int> = set_new()
            for handler in handlers {
                let is_abort_handler = handler.is_abortive
                for capture in check_exact_capture_reads(
                        metadata, capture_entry_plan,
                        handler.body, sink) {
                    if type_may_own(metadata, capture.ty) {
                        captured_may_own_slots.insert(capture.def_id)
                        if !is_abort_handler {
                            report_ownership_error(sink,
                                "tail-resumptive handler cannot capture owner-bearing value '${capture.name}'",
                                capture.span,
                                "handler evidence may escape; only non-may-own outer captures are supported until explicit lifetime/consume semantics exist")
                        }
                    }
                }
            }
            let mut has_abort_handler = false
            for handler in handlers {
                if handler.is_abortive {
                    has_abort_handler = true
                }
            }
            let final_body = if has_abort_handler {
                let entry_plan = clone_move_plan(plan)
                let mut body_plan = clone_move_plan(plan)
                body_plan.blocked_takes = block_current_slots(plan)
                let body_for_abort_planning = body
                let planned = plan_expr(env, metadata, body_plan,
                    boxed_vars, sink, body_for_abort_planning, transfer)
                // A fail.raise abort reaches the handler with every outer slot
                // in its entry state.  The normal body edge may be unreachable
                // (always-raise) or may carry ordinary inner state; join both
                // rather than treating body_plan.reachable as the reachability
                // of the complete handle expression.
                join_move_plans(plan, entry_plan, body_plan)
                planned
            } else {
                // Keep may-own captures blocked during recovery after the
                // fail-loud diagnostic above. This prevents a second ownership
                // contradiction from clearing the same outer slot.
                let mut body_plan = clone_move_plan(plan)
                for def_id in captured_may_own_slots {
                    let def_id_for_blocking = def_id
                    body_plan.blocked_takes.insert(
                        def_id_for_blocking, true)
                }
                let body_for_resumptive_planning = body
                let planned = plan_expr(env, metadata, body_plan, boxed_vars,
                    sink, body_for_resumptive_planning, transfer)
                adopt_move_plan_flow(plan, body_plan)
                planned
            }
            let mut final_handlers: List<HEffectHandler> = []
            for handler in handlers {
                let captures = exact_outer_slot_captures(
                    capture_entry_plan, handler.body)
                let mut extra_bindings: List<HPatternBinding> = []
                for capture in free_bindings_as_pattern_bindings(captures) {
                    let capture_for_binding = capture
                    extra_bindings.push(capture_for_binding)
                }
                match handler.resume_binding {
                    some(binding) => {
                        let resume_binding = binding
                        extra_bindings.push(resume_binding)
                    },
                    none => {}
                }
                let final_handler_body = plan_lambda_body(env, metadata,
                    boxed_vars, sink, handler.params,
                    extra_bindings, handler.body)
                final_handlers.push(HEffectHandler {
                    effect_name: handler.effect_name,
                    op_name: handler.op_name,
                    is_abortive: handler.is_abortive,
                    params: handler.params,
                    resume_binding: handler.resume_binding,
                    body: final_handler_body
                })
            }
            let result_ty = ty
            let result_effects = effects
            let result_span = span
            HExpr::HandleExpr { body: final_body,
                handlers: final_handlers, ty: result_ty,
                effects: result_effects, span: result_span }
        },
        HExpr::Lambda { def_id, params, return_type, body,
                        ty, effects, span } => {
            let captures = reject_owner_bearing_closure_captures(
                metadata, plan, body, sink)
            let ownership_id = match metadata.callable_by_def_id.get(def_id) {
                some(id) => id,
                none => panic(
                    "unreachable: lambda DefId has no solved ownership descriptor")
            }
            let mut final_params: List<HParam> = []
            let mut index = 0
            for param in params {
                final_params.push(final_param(param,
                    callable_param_ownership(metadata, ownership_id, index)))
                index = index + 1
            }
            let final_body = plan_lambda_body(env, metadata, boxed_vars,
                sink, final_params,
                free_bindings_as_pattern_bindings(captures), body)
            let result_return_type = return_type
            let result_ty = ty
            let result_effects = effects
            let result_span = span
            HExpr::Lambda { def_id: def_id,
                params: final_params,
                return_type: result_return_type, body: final_body,
                ty: type_with_ownership(result_ty, ownership_id),
                effects: result_effects, span: result_span }
        },
        HExpr::EffectOp { effect_name, op_name, is_abortive, args,
                          ty, effects, span } => {
            let mut final_args: List<HExpr> = []
            for arg in args {
                let arg_for_planning = arg
                final_args.push(plan_expr(env, metadata, plan, boxed_vars,
                    sink, arg_for_planning, TRANSFER_BORROW))
            }
            let result_effect_name = effect_name
            let result_op_name = op_name
            let result_ty = ty
            let ty_for_never_check = ty
            let result_effects = effects
            let result_span = span
            let result = HExpr::EffectOp {
                effect_name: result_effect_name,
                op_name: result_op_name, is_abortive: is_abortive,
                args: final_args, ty: result_ty,
                effects: result_effects, span: result_span }
            if type_is_never(ty_for_never_check) {
                plan.reachable = false
            }
            result
        },
        HExpr::RangeExpr { start, end, inclusive, ty, effects, span } => {
            let start_for_planning = start
            let end_for_planning = end
            let result_ty = ty
            let result_effects = effects
            let result_span = span
            HExpr::RangeExpr {
                start: plan_expr(env, metadata, plan, boxed_vars, sink,
                    start_for_planning, TRANSFER_OWNING),
                end: plan_expr(env, metadata, plan, boxed_vars, sink,
                    end_for_planning, TRANSFER_OWNING),
                inclusive: inclusive, ty: result_ty,
                effects: result_effects, span: result_span
            }
        },
        HExpr::ListLit { elements, ty, effects, span } => {
            let mut final_elements: List<HExpr> = []
            for element in elements {
                let element_for_planning = element
                final_elements.push(plan_expr(env, metadata, plan,
                    boxed_vars, sink, element_for_planning,
                    TRANSFER_OWNING))
            }
            let result_ty = ty
            let result_effects = effects
            let result_span = span
            HExpr::ListLit { elements: final_elements,
                ty: result_ty, effects: result_effects, span: result_span }
        },
        HExpr::TupleLit { elements, ty, effects, span } => {
            let mut final_elements: List<HExpr> = []
            for element in elements {
                let element_for_planning = element
                final_elements.push(plan_expr(env, metadata, plan,
                    boxed_vars, sink, element_for_planning,
                    TRANSFER_OWNING))
            }
            let result_ty = ty
            let result_effects = effects
            let result_span = span
            HExpr::TupleLit { elements: final_elements,
                ty: result_ty, effects: result_effects, span: result_span }
        },
        HExpr::IndexExpr { receiver, index, ty, effects, span } => {
            report_partial_transfer(metadata, transfer, ty, sink, span)
            let receiver_for_planning = receiver
            let index_for_planning = index
            let result_ty = ty
            let result_effects = effects
            let result_span = span
            HExpr::IndexExpr {
                receiver: plan_expr(env, metadata, plan, boxed_vars, sink,
                    receiver_for_planning, TRANSFER_BORROW),
                index: plan_expr(env, metadata, plan, boxed_vars, sink,
                    index_for_planning, TRANSFER_BORROW),
                ty: result_ty, effects: result_effects, span: result_span
            }
        },
        HExpr::Clone { .. } => panic(
            "unreachable: ownership planner input contains HExpr::Clone"),
        HExpr::Take { name, source_def_id, ty, effects, span } => {
            if !plan.slots.contains_key(source_def_id) {
                panic("unreachable: input Take does not name a live CFG slot")
            }
            if slot_is_unavailable(plan, source_def_id) {
                report_ownership_error(sink,
                    "use of moved value: '${name}'", span,
                    "duplicate Take for exact binding DefId")
            } else {
                let source_def_id_for_slot = source_def_id
                let source_def_id_for_span = source_def_id
                let moved_span = span
                plan.slots.insert(source_def_id_for_slot, SLOT_MOVED)
                plan.moved_spans.insert(source_def_id_for_span, moved_span)
            }
            let result_name = name
            let result_ty = ty
            let result_effects = effects
            let result_span = span
            HExpr::Take { name: result_name,
                source_def_id: source_def_id,
                ty: result_ty, effects: result_effects, span: result_span }
        },
        HExpr::ReturnExpr { value, ty, effects, span } => {
            let final_value = match value {
                some(returned) => {
                    let returned_for_planning = returned
                    some(plan_expr(env, metadata, plan, boxed_vars, sink,
                        returned_for_planning, TRANSFER_OWNING))
                },
                none => none
            }
            plan.reachable = false
            let result_ty = ty
            let result_effects = effects
            let result_span = span
            HExpr::ReturnExpr { value: final_value,
                ty: result_ty, effects: result_effects, span: result_span }
        },
        HExpr::UnsafeBlock { body, ty, effects, span } => {
            let body_for_planning = body
            let result_ty = ty
            let result_effects = effects
            let result_span = span
            HExpr::UnsafeBlock {
                body: plan_expr(env, metadata, plan, boxed_vars, sink,
                    body_for_planning, transfer),
                ty: result_ty, effects: result_effects, span: result_span
            }
        },
        HExpr::DictConstruct { .. } | HExpr::IntLit { .. } |
        HExpr::FloatLit { .. } | HExpr::StrLit { .. } |
        HExpr::BoolLit { .. } => expr
    }
}

fn plan_stmt(
    env: TypeEnv, metadata: OwnershipMetadata, mut plan: MovePlan,
    boxed_vars: Set<Int>, mut sink: CollectingSink,
    stmt: HStmt, mut declared: List<Int>
) -> HStmt {
    match stmt {
        HStmt::Let { name, name_span, def_id, ty, init, span } => {
            let ty_for_finalization = ty
            let ty_for_missing_def_id = ty
            let init_for_planning = init
            let result_name = name
            let result_name_span = name_span
            let result_def_id = def_id
            let result_span = span
            let callable = callable_id_of_expr(metadata, plan, init)
            report_unproven_callable_value(ty, callable, sink, span)
            let final_ty = match callable {
                some(ownership_id) =>
                    type_with_ownership(
                        ty_for_finalization, ownership_id),
                none => ty
            }
            let final_init = plan_expr(env, metadata, plan, boxed_vars,
                sink, init_for_planning, TRANSFER_AUTO)
            match def_id {
                some(id) => {
                    let id_for_declared = id
                    register_slot(plan, id, false, callable)
                    declared.push(id_for_declared)
                },
                none => if type_may_own(
                        metadata, ty_for_missing_def_id) {
                    panic("unreachable: ownership-visible let has no DefId")
                }
            }
            HStmt::Let { name: result_name,
                name_span: result_name_span,
                def_id: result_def_id, ty: final_ty,
                init: final_init, span: result_span }
        },
        HStmt::Var { name, name_span, def_id, ty, init, span } => {
            let ty_for_finalization = ty
            let ty_for_missing_def_id = ty
            let init_for_planning = init
            let result_name = name
            let result_name_span = name_span
            let result_def_id = def_id
            let result_span = span
            let callable = callable_id_of_expr(metadata, plan, init)
            report_unproven_callable_value(ty, callable, sink, span)
            let final_ty = match callable {
                some(ownership_id) =>
                    type_with_ownership(
                        ty_for_finalization, ownership_id),
                none => ty
            }
            let final_init = plan_expr(env, metadata, plan, boxed_vars,
                sink, init_for_planning, TRANSFER_AUTO)
            match def_id {
                some(id) => {
                    let id_for_declared = id
                    register_slot(plan, id, false, callable)
                    declared.push(id_for_declared)
                },
                none => if type_may_own(
                        metadata, ty_for_missing_def_id) {
                    panic("unreachable: ownership-visible var has no DefId")
                }
            }
            HStmt::Var { name: result_name,
                name_span: result_name_span,
                def_id: result_def_id, ty: final_ty,
                init: final_init, span: result_span }
        },
        HStmt::Assign { target, value, span } => {
            if type_may_own(metadata, hexpr_type(target)) {
                let target_is_owned_slot = match target {
                    HExpr::Ident { def_id: some(id), .. } =>
                        plan.slots.contains_key(id) &&
                        !plan.borrowed_slots.contains_key(id) &&
                        !boxed_vars.contains(id),
                    _ => false
                }
                if !target_is_owned_slot {
                    report_ownership_error(sink,
                        "cannot overwrite owner-bearing borrowed storage",
                        span,
                        "assign only to an owned local binding whose old value can be dropped exactly")
                }
            }
            let callable = callable_id_of_expr(metadata, plan, value)
            report_unproven_callable_value(
                hexpr_type(value), callable, sink, span)
            let value_transfer = match target {
                HExpr::Ident { .. } => TRANSFER_AUTO,
                _ => TRANSFER_OWNING
            }
            let value_for_planning = value
            let final_value = plan_expr(env, metadata, plan, boxed_vars,
                sink, value_for_planning, value_transfer)
            let final_target = match target {
                HExpr::Ident { name, resolved_name, def_id,
                               dict_closure_dicts, ty, effects,
                               span: target_span } => {
                    let result_name = name
                    let result_resolved_name = resolved_name
                    let result_def_id = def_id
                    let result_dict_closure_dicts = dict_closure_dicts
                    let ty_for_owned_target = ty
                    let ty_for_plain_target = ty
                    let result_effects = effects
                    let result_target_span = target_span
                    match def_id {
                        some(id) => if plan.slots.contains_key(id) {
                            let id_for_slot = id
                            let id_for_callable_slot = id
                            plan.slots.insert(id_for_slot, SLOT_LIVE)
                            plan.moved_spans.remove(id)
                            match callable {
                                some(ownership_id) => {
                                    let callable_ownership_id = ownership_id
                                    plan.callable_slots.insert(
                                        id_for_callable_slot,
                                        callable_ownership_id)
                                },
                                none => plan.callable_slots.remove(id)
                            }
                        },
                        none => {}
                    }
                    HExpr::Ident { name: result_name,
                        resolved_name: result_resolved_name,
                        def_id: result_def_id,
                        dict_closure_dicts: result_dict_closure_dicts,
                        ty: match callable {
                            some(ownership_id) =>
                                type_with_ownership(
                                    ty_for_owned_target, ownership_id),
                            none => ty_for_plain_target
                        },
                        effects: result_effects,
                        span: result_target_span }
                },
                _ => {
                    let target_for_planning = target
                    plan_expr(env, metadata, plan, boxed_vars, sink,
                        target_for_planning, TRANSFER_BORROW)
                }
            }
            let result_span = span
            HStmt::Assign { target: final_target,
                value: final_value, span: result_span }
        },
        HStmt::ExprStmt { expr, span } => {
            let expr_for_planning = expr
            let result_span = span
            HStmt::ExprStmt {
                expr: plan_expr(env, metadata, plan, boxed_vars, sink,
                    expr_for_planning, TRANSFER_BORROW),
                span: result_span
            }
        },
        HStmt::Return { value, span } => {
            let final_value = match value {
                some(returned) => {
                    let returned_for_planning = returned
                    some(plan_expr(env, metadata, plan, boxed_vars, sink,
                        returned_for_planning, TRANSFER_OWNING))
                },
                none => none
            }
            plan.reachable = false
            let result_span = span
            HStmt::Return { value: final_value, span: result_span }
        },
        HStmt::While { condition, body, span } => {
            // A while condition is part of the repeating region. Snapshot the
            // loop head before evaluating it so condition-side Takes are
            // checked against every normal/continue back-edge.
            let condition_for_reachability = condition
            let condition_for_planning = condition
            let body_for_planning = body
            let condition_reaches_value =
                expr_has_reachable_value(condition_for_reachability)
            let result_span = span
            let entry = flow_snapshot(plan)
            let final_condition = plan_expr(env, metadata, plan,
                boxed_vars, sink, condition_for_planning, TRANSFER_BORROW)
            if !condition_reaches_value {
                return HStmt::ExprStmt {
                    expr: final_condition, span: result_span
                }
            }
            let depth = plan.loop_depth + 1
            let mut body_plan = clone_move_plan(plan)
            body_plan.loop_depth = depth
            let final_body = plan_expr(env, metadata, body_plan,
                boxed_vars, sink, body_for_planning, TRANSFER_BORROW)
            finish_loop_flow(
                plan, body_plan, depth, entry, sink, span)
            HStmt::While { condition: final_condition,
                body: final_body, span: result_span }
        },
        HStmt::ForIn { binding, binding_span, def_id, destructure,
                       iterable, body, iterable_type_name, iter_type_name,
                       span } => {
            let iterable_for_reachability = iterable
            let iterable_for_planning = iterable
            let body_for_planning = body
            let iterable_reaches_value =
                expr_has_reachable_value(iterable_for_reachability)
            let result_binding = binding
            let result_binding_span = binding_span
            let result_def_id = def_id
            let result_destructure = destructure
            let result_iterable_type_name = iterable_type_name
            let result_iter_type_name = iter_type_name
            let result_span = span
            let final_iterable = plan_expr(env, metadata, plan,
                boxed_vars, sink, iterable_for_planning, TRANSFER_BORROW)
            if !iterable_reaches_value {
                return HStmt::ExprStmt {
                    expr: final_iterable, span: result_span
                }
            }
            let entry = flow_snapshot(plan)
            let depth = plan.loop_depth + 1
            let mut body_plan = clone_move_plan(plan)
            body_plan.loop_depth = depth
            // Inference lowers every non-Range for..in through explicit
            // Iterable/Iterator calls before ownership planning. The HStmt
            // that remains here is the direct Range loop: its binding is a
            // fresh complete value on every iteration, not a projection borrow.
            match def_id {
                some(id) => register_slot(body_plan, id, false, none),
                none => {}
            }
            match destructure {
                some(bindings) => {
                    for binding_ in bindings {
                        match binding_.def_id {
                            some(id) => register_slot(
                                body_plan, id, false, none),
                            none => {}
                        }
                    }
                },
                none => {}
            }
            let final_body = plan_expr(env, metadata, body_plan,
                boxed_vars, sink, body_for_planning, TRANSFER_BORROW)
            finish_loop_flow(
                plan, body_plan, depth, entry, sink, span)
            HStmt::ForIn { binding: result_binding,
                binding_span: result_binding_span, def_id: result_def_id,
                destructure: result_destructure, iterable: final_iterable,
                body: final_body,
                iterable_type_name: result_iterable_type_name,
                iter_type_name: result_iter_type_name, span: result_span }
        },
        HStmt::Break { .. } => {
            if plan.reachable { record_loop_exit(plan, true) }
            stmt
        },
        HStmt::Continue { .. } => {
            if plan.reachable { record_loop_exit(plan, false) }
            stmt
        },
        HStmt::LetDestructure { pattern, bindings, init, span } => {
            let init_for_planning = init
            let result_pattern = pattern
            let result_bindings = bindings
            let result_span = span
            if type_may_own(metadata, hexpr_type(init)) {
                report_ownership_error(sink,
                    "partial move through destructuring is not supported",
                    span, "bind the complete value and transfer that binding")
            }
            let final_init = plan_expr(env, metadata, plan, boxed_vars,
                sink, init_for_planning, TRANSFER_BORROW)
            for binding in bindings {
                match binding.def_id {
                    some(id) => {
                        let id_for_declared = id
                        match binding.ty {
                            Type::FnType { .. } =>
                                if metadata.callable_by_def_id.get(id).is_none() {
                                    report_ownership_error(sink,
                                        "callable destructuring binding has no exact payload ownership contract",
                                        span,
                                        "extracting a callable from a container requires explicit DefId-keyed payload provenance")
                                },
                            _ => {}
                        }
                        register_slot(plan, id, true,
                            metadata.callable_by_def_id.get(id))
                        declared.push(id_for_declared)
                    },
                    none => {}
                }
            }
            HStmt::LetDestructure { pattern: result_pattern,
                bindings: result_bindings,
                init: final_init, span: result_span }
        },
        HStmt::IfLet { pattern, bindings, expr, then_block,
                       else_block, span } => {
            let expr_for_reachability = expr
            let expr_for_planning = expr
            let then_block_for_planning = then_block
            let else_block_for_planning = else_block
            let expr_reaches_value =
                expr_has_reachable_value(expr_for_reachability)
            let result_pattern = pattern
            let result_bindings = bindings
            let result_span = span
            let final_expr = plan_expr(env, metadata, plan, boxed_vars,
                sink, expr_for_planning, TRANSFER_BORROW)
            if !expr_reaches_value {
                return HStmt::ExprStmt {
                    expr: final_expr, span: result_span
                }
            }
            let mut then_plan = clone_move_plan(plan)
            report_unproven_pattern_callables(
                metadata, bindings, sink, span)
            register_pattern_slots(
                then_plan, metadata, bindings, false)
            let final_then = plan_expr(env, metadata, then_plan,
                boxed_vars, sink, then_block_for_planning,
                TRANSFER_BORROW)
            let mut else_plan = clone_move_plan(plan)
            let final_else = match else_block_for_planning {
                some(branch) => {
                    let branch_for_planning = branch
                    some(plan_expr(env, metadata, else_plan,
                        boxed_vars, sink, branch_for_planning,
                        TRANSFER_BORROW))
                },
                none => none
            }
            join_move_plans(plan, then_plan, else_plan)
            HStmt::IfLet { pattern: result_pattern,
                bindings: result_bindings,
                expr: final_expr,
                then_block: final_then, else_block: final_else,
                span: result_span }
        },
        HStmt::Drop { .. } => stmt
    }
}

fn plan_body_with_params(
    env: TypeEnv, metadata: OwnershipMetadata, boxed_vars: Set<Int>,
    mut sink: CollectingSink, params: List<HParam>, body: HExpr
) -> HExpr {
    let mut plan = new_move_plan()
    for param in params {
        match param.def_id {
            some(def_id) => {
                let def_id_for_blocking = def_id
                let external_drop_owner =
                    hparam_is_external_drop_owner(param)
                register_slot(plan, def_id,
                    hparam_ownership(param) != PARAM_OWNERSHIP_MOVE ||
                        external_drop_owner,
                    callable_id_from_type(param.ty))
                if external_drop_owner {
                    plan.blocked_takes.insert(def_id_for_blocking, true)
                }
            },
            none => {}
        }
    }
    let body_for_planning = body
    plan_expr(env, metadata, plan, boxed_vars, sink,
        body_for_planning, TRANSFER_OWNING)
}

fn plan_trait_method(
    env: TypeEnv, metadata: OwnershipMetadata, boxed_vars: Set<Int>,
    mut sink: CollectingSink, method: HTraitMethod
) -> HTraitMethod {
    let body = match method.body {
        some(value) => some(plan_body_with_params(env, metadata, boxed_vars,
            sink, method.params, value)),
        none => none
    }
    HTraitMethod { ..method, body: body }
}

fn plan_decl(
    env: TypeEnv, metadata: OwnershipMetadata, boxed_vars: Set<Int>,
    mut sink: CollectingSink, decl: HDecl
) -> HDecl {
    match decl {
        HDecl::Fn { name, def_id, type_params, params, return_type, effects,
                    body, is_pub, trait_bounds, span } => {
            let result_name = name
            let result_def_id = def_id
            let result_type_params = type_params
            let result_params = params
            let params_for_planning = params
            let result_return_type = return_type
            let result_effects = effects
            let result_trait_bounds = trait_bounds
            let result_span = span
            HDecl::Fn {
                name: result_name, def_id: result_def_id,
                type_params: result_type_params,
                params: result_params,
                return_type: result_return_type,
                effects: result_effects,
                body: plan_body_with_params(env, metadata, boxed_vars, sink,
                    params_for_planning, body),
                is_pub: is_pub, trait_bounds: result_trait_bounds,
                span: result_span
            }
        },
        HDecl::Impl { target_type, type_params, trait_name, methods,
                      assoc_types, span } => {
            let mut final_methods: List<HDecl> = []
            for method in methods {
                let method_for_planning = method
                final_methods.push(plan_decl(env, metadata, boxed_vars,
                    sink, method_for_planning))
            }
            let result_target_type = target_type
            let result_type_params = type_params
            let result_trait_name = trait_name
            let result_assoc_types = assoc_types
            let result_span = span
            HDecl::Impl { target_type: result_target_type,
                type_params: result_type_params,
                trait_name: result_trait_name,
                methods: final_methods, assoc_types: result_assoc_types,
                span: result_span }
        },
        HDecl::ModBlock { name, decls, is_pub, span } => {
            let mut final_decls: List<HDecl> = []
            for nested in decls {
                let nested_for_planning = nested
                final_decls.push(plan_decl(env, metadata, boxed_vars,
                    sink, nested_for_planning))
            }
            let result_name = name
            let result_span = span
            HDecl::ModBlock { name: result_name, decls: final_decls,
                is_pub: is_pub, span: result_span }
        },
        HDecl::Trait { name, type_params, methods, supertraits,
                       assoc_types, is_pub, span } => {
            let mut final_methods: List<HTraitMethod> = []
            for method in methods {
                final_methods.push(plan_trait_method(env, metadata,
                    boxed_vars, sink, method))
            }
            let result_name = name
            let result_type_params = type_params
            let result_supertraits = supertraits
            let result_assoc_types = assoc_types
            let result_span = span
            HDecl::Trait { name: result_name,
                type_params: result_type_params,
                methods: final_methods, supertraits: result_supertraits,
                assoc_types: result_assoc_types, is_pub: is_pub,
                span: result_span }
        },
        HDecl::Effect { name, type_params, ops, is_pub, span } => {
            let mut final_ops: List<HEffectOp> = []
            for op in ops {
                let body = match op.default_body {
                    some(value) => some(plan_body_with_params(env, metadata,
                        boxed_vars, sink, op.params, value)),
                    none => none
                }
                final_ops.push(HEffectOp { ..op, default_body: body })
            }
            let result_name = name
            let result_type_params = type_params
            let result_span = span
            HDecl::Effect { name: result_name,
                type_params: result_type_params,
                ops: final_ops, is_pub: is_pub, span: result_span }
        },
        HDecl::Test { description, body, span } => {
            let result_description = description
            let result_span = span
            HDecl::Test {
                description: result_description,
                body: plan_body_with_params(env, metadata, boxed_vars,
                    sink, [], body),
                span: result_span
            }
        },
        HDecl::Const { name, def_id, ty, init, is_pub, span } => {
            let result_name = name
            let result_def_id = def_id
            let result_ty = ty
            let result_span = span
            HDecl::Const {
                name: result_name, def_id: result_def_id, ty: result_ty,
                init: plan_body_with_params(env, metadata, boxed_vars,
                    sink, [], init),
                is_pub: is_pub, span: result_span
            }
        },
        _ => decl
    }
}

fn plan_program_ownership(
    env: TypeEnv, program: HProgram, mut sink: CollectingSink
) -> HProgram {
    let metadata = program.ownership_metadata
    let mut decls: List<HDecl> = []
    for decl in program.decls {
        let decl_for_planning = decl
        decls.push(plan_decl(
            env, metadata, program.boxed_vars, sink, decl_for_planning))
    }
    validate_callable_ownership_metadata(metadata)
    HProgram { ..program, decls: decls }
}

pub fn solve_and_plan_ownership(
    mut env: TypeEnv, program: HProgram, mut sink: CollectingSink,
    value_binding_kinds: Map<Int, ValueBindingKind>,
    pre_solve_const_getter_aliases: Set<Int>,
    pre_solve_alias_targets: Map<Int, Int>,
    pre_solve_alias_arities: Map<Int, Int>,
    pre_solve_alias_contracts: Map<Int, Int>
) -> HProgram {
    let solved = solve_callable_modes(env, program, sink,
        value_binding_kinds, pre_solve_const_getter_aliases,
        pre_solve_alias_targets, pre_solve_alias_arities,
        pre_solve_alias_contracts)
    plan_program_ownership(env, solved, sink)
}
