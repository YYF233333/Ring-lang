// Perceus RC L0: dup/drop insertion pass
// Reference: Koka Perceus (POPL'21) — backward liveness + branch-balancing
//
// Core idea: walk each function body backward to determine the *last use* of
// every owned variable.  Last use = consume (no dup needed).  Non-last use =
// dup required.  On scope exit, dead variables get a drop.
//
// L0 simplifications:
//   - All values are owned (uniform boxing) — every let/var/param needs RC.
//   - Conservative for loops: external vars used in loop body always dup.
//   - Lambda captures: always dup.
//   - Complex nested exprs: conservatively dup.

use ast::{Span, Position, Pattern, BinOp}
use hir::{HDecl, HStmt, HExpr, HParam, HProgram, HMatchArm,
    HStructFieldInit, HStringInterpPart, HEffectHandler, HEffectOp,
    HPatternBinding,
    hexpr_type, hexpr_span, hexpr_effects,
    type_is_physical_rc_eligible, type_has_logical_transfer_value,
    type_crosses_logical_owning_edge_by_value,
    call_returns_borrowed, hparam_ownership,
    hparam_is_external_drop_owner,
    is_nullary_variant_ctor_ident, is_option_none_ctor_ident,
    is_materialized_fn_value,
    move_edge_has_reachable_bare_binding,
    expr_has_reachable_value, stmt_reaches_next,
    hexpr_callable_source_def_ids,
    synthetic_def_id, is_synthetic_anf_def_id, is_synthetic_rc_def_id,
    SYNTHETIC_ANF_DEF_ID_BASE, SYNTHETIC_RC_DEF_ID_BASE,
    validate_hir_binder_def_ids}
use types::{Type, EffectRow, OwnershipMetadata, CallableOwnershipState,
    PARAM_OWNERSHIP_MOVE, PARAM_OWNERSHIP_UNKNOWN,
    CALLABLE_RESULT_ROLE_NONE,
    CALLABLE_RESULT_ROLE_FRESH_OWNED_SLOT,
    CALLABLE_RESULT_ROLE_UNKNOWN,
    callable_param_ownership, callable_param_requires_force, type_may_own,
    validate_callable_ownership_metadata,
    project_synthetic_anf_callable_metadata,
    project_synthetic_rc_callable_metadata}

// ============================================================
// Synthetic span for pass-inserted ANF/RC nodes.
// Duplication is represented by HExpr::Clone rather than a statement node.
// ============================================================

fn synthetic_span() -> Span {
    let pos = Position { line: 0, column: 0, offset: 0 }
    let start = pos
    let end = pos
    Span { file: "<perceus>", start: start, end: end }
}

fn mutate_missing_call_edge_take(
    expr: HExpr, control: List<Int>
) -> HExpr? {
    if control.get(1) != some(1) { return none }
    match expr {
        HExpr::Take { name, source_def_id, ty, effects, span } => {
            let ident_name = name
            let ident_def_id = source_def_id
            let ident_ty = ty
            let ident_effects = effects
            let ident_span = span
            some(HExpr::Ident {
                name: ident_name, resolved_name: none,
                def_id: some(ident_def_id), dict_closure_dicts: none,
                ty: ident_ty, effects: ident_effects, span: ident_span
            })
        },
        _ => none
    }
}

fn mutation_borrowed_param_ident(params: List<HParam>) -> HExpr? {
    match params.get(0) {
        some(HParam { name, ty, def_id: some(def_id), .. }) => {
            let ident_name = name
            let ident_def_id = def_id
            let ident_ty = ty
            some(HExpr::Ident {
                name: ident_name, resolved_name: none,
                def_id: some(ident_def_id),
                dict_closure_dicts: none, ty: ident_ty,
                effects: EffectRow { effects: [], tail: none },
                span: synthetic_span()
            })
        },
        _ => none
    }
}

// Test-only post-plan mutation. The replacement Ident reuses an exact HParam
// DefId already present in HIR; it does not invent callable identity or alter
// semantic ownership metadata. The dedicated fixture puts its borrowed
// aggregate parameter first and has two fresh If branches before mutation.
fn mutate_mixed_spread_source(source: HExpr, borrowed: HExpr) -> HExpr {
    match source {
        HExpr::IfExpr { condition, then_branch,
                        else_branch: some(_), ty, effects, span } => {
            let final_condition = condition
            let final_then = then_branch
            let final_ty = ty
            let final_effects = effects
            let final_span = span
            HExpr::IfExpr { condition: final_condition,
                then_branch: final_then,
                else_branch: some(borrowed), ty: final_ty,
                effects: final_effects, span: final_span }
        },
        HExpr::MatchExpr { scrutinee, arms, ty, effects, span } => {
            let arms_view = arms
            match arms_view.get(0) {
                some(first) => {
                    let final_scrutinee = scrutinee
                    let final_ty = ty
                    let final_effects = effects
                    let final_span = span
                    let mut replaced: List<HMatchArm> = [
                        HMatchArm { ..first, body: borrowed }
                    ]
                    let remaining = arms_view.slice(1, arms_view.len())
                    replaced.extend(remaining)
                    HExpr::MatchExpr { scrutinee: final_scrutinee,
                        arms: replaced, ty: final_ty,
                        effects: final_effects, span: final_span }
                },
                none => {
                    let final_scrutinee = scrutinee
                    let final_ty = ty
                    let final_effects = effects
                    let final_span = span
                    HExpr::MatchExpr { scrutinee: final_scrutinee,
                        arms: arms_view, ty: final_ty,
                        effects: final_effects, span: final_span }
                }
            }
        },
        HExpr::Block { stmts, tail: some(value), ty, effects, span } => {
            let final_stmts = stmts
            let source_value = value
            let final_ty = ty
            let final_effects = effects
            let final_span = span
            HExpr::Block { stmts: final_stmts,
                tail: some(mutate_mixed_spread_source(
                    source_value, borrowed)),
                ty: final_ty, effects: final_effects, span: final_span }
        },
        HExpr::UnsafeBlock { body, ty, effects, span } => {
            let source_body = body
            let final_ty = ty
            let final_effects = effects
            let final_span = span
            HExpr::UnsafeBlock {
                body: mutate_mixed_spread_source(
                    source_body, borrowed),
                ty: final_ty, effects: final_effects, span: final_span
            }
        },
        _ => source
    }
}

fn mutate_mixed_spread_expr(expr: HExpr, borrowed: HExpr) -> HExpr {
    match expr {
        HExpr::Block { stmts, tail: some(value), ty, effects, span } => {
            let final_stmts = stmts
            let source_value = value
            let final_ty = ty
            let final_effects = effects
            let final_span = span
            HExpr::Block { stmts: final_stmts,
                tail: some(mutate_mixed_spread_expr(
                    source_value, borrowed)),
                ty: final_ty, effects: final_effects, span: final_span }
        },
        HExpr::StructLit { name, type_args, fields,
                           spread: some(source), ty, effects, span } => {
            let final_name = name
            let final_type_args = type_args
            let final_fields = fields
            let source_value = source
            let borrowed_value = borrowed
            let final_ty = ty
            let final_effects = effects
            let final_span = span
            HExpr::StructLit { name: final_name,
                type_args: final_type_args, fields: final_fields,
                spread: some(mutate_mixed_spread_source(
                    source_value, borrowed_value)),
                ty: final_ty, effects: final_effects, span: final_span }
        },
        HExpr::NamedVariantConstruct { enum_name, variant_name, fields,
                                       spread: some(source), ty,
                                       effects, span } => {
            let final_enum_name = enum_name
            let final_variant_name = variant_name
            let final_fields = fields
            let source_value = source
            let borrowed_value = borrowed
            let final_ty = ty
            let final_effects = effects
            let final_span = span
            HExpr::NamedVariantConstruct { enum_name: final_enum_name,
                variant_name: final_variant_name, fields: final_fields,
                spread: some(mutate_mixed_spread_source(
                    source_value, borrowed_value)),
                ty: final_ty, effects: final_effects, span: final_span }
        },
        _ => expr
    }
}

fn mutate_mixed_spread_decl(decl: HDecl) -> HDecl {
    match decl {
        HDecl::Fn { params, body, .. } => match mutation_borrowed_param_ident(
                params) {
            some(borrowed) => {
                let source_body = body
                HDecl::Fn { ..decl,
                    body: mutate_mixed_spread_expr(
                        source_body, borrowed) }
            },
            none => decl
        },
        _ => decl
    }
}

fn mutate_mixed_spread_sources(program: HProgram) -> HProgram {
    let mut decls: List<HDecl> = []
    for decl in program.decls {
        let source_decl = decl
        decls.push(mutate_mixed_spread_decl(source_decl))
    }
    HProgram {
        decls: decls,
        derived_impls: program.derived_impls,
        boxed_vars: program.boxed_vars,
        static_dicts: program.static_dicts,
        extern_type_names: program.extern_type_names,
        ownership_metadata: program.ownership_metadata
    }
}

// B-084 #131(a): the wildcard `_` is never bound to a real named_values slot
// (codegen's destructure / for-in / let lowering deliberately skips `_`), so an
// HStmt::Drop naming `_` is unrunnable RC noise (a fail-safe codegen skip +
// rc-warn); duplication is represented by HExpr::Clone, not a named statement.
// `_` also has no observable binding to release — it is a discard, the value
// flows through the enclosing scrutinee's own RC. Centralise the skip so every
// drop emission site is consistent.
// (pub: shared with verify_rc.ring — the B-104 D2 static verifier mirrors the
// same skip so `_` never enters its binding account.)
pub fn rc_name_skippable(name: Str) -> Bool {
    name == "_"
}

// ============================================================
// Main entry: transform all declarations
// ============================================================

pub fn perceus_transform(program: HProgram) -> HProgram {
    perceus_transform_mutated(program, "")
}

// B-104 D2 TEST-ONLY entry: the static leak verifier's negative tests need a
// deliberately-degraded RC pipeline to prove the verifier catches regressions
// (a correct pass produces verifiable output, so leak/UAF inputs cannot be
// constructed from source alone).  `mutate` selects a degradation:
//   ""            — no mutation (the normal pipeline; perceus_transform).
//   "skip-anf"    — skip the ANF/materialize pre-pass: fresh-owned operand/arg/
//                   scrutinee temporaries stay unbound → the verifier must
//                   report leak-temp (the B-109 ② call-result temp class).
//   "drop-params" — append a Drop for every function parameter to the function
//                   body: params are BORROWS (L1 point 4) → the verifier must
//                   report uaf-drop-borrow.
//   "missing-take"— replace every Move call-edge Take with the underlying bare
//                   Ident after planning → the verifier must independently
//                   report uaf-call-missing-take for both physical-RC owned
//                   and direct/contains-extern K_NONOWNED slots.
//   "strip-callable-metadata"
//                 — after RC planning, remove every DefId-keyed callable
//                   descriptor. The verifier must fail closed at ordinary
//                   callable parameter/let/assignment binders instead of
//                   recovering authority from their FnType annotations.
//   "strip-callable-result-roles"
//                 — retain callable descriptors but remove both total result
//                   role maps; verifier totality must fail independently.
//   "strip-anf-callable-metadata"
//                 — remove only synthetic-ANF callable contracts after the
//                   projection step. This proves ANF temps cannot fall back to
//                   their FnType while ordinary callable contracts remain.
//   "strip-anf-callable-result-roles"
//                 — retain synthetic-ANF descriptors/state but remove only
//                   their direct/returned result roles.
//   "missing-slot-result-drop"
//                 — give only Perceus a private all-NONE result-role view;
//                   verifier retains the authoritative FRESH slot role and
//                   must detect the missing materialization/drop.
//   "skip-spread-materialization"
//                 — leave fresh spread producers inline; verifier must report
//                   leak-spread-source instead of sharing ANF's classifier.
//   "mixed-spread-source"
//                 — after ownership planning, replace one reachable fresh
//                   branch in each test-fixture spread with the function's
//                   exact borrowed parameter DefId. Perceus preserves that
//                   mixed source only for this mutation so verifier must report
//                   its own invalid-spread-source finding.
//   "strip-range-break-cleanup"
//                 — omit the Range counter's edge Drop before Break; verifier
//                   must report leak-loop-exit.
//   "inject-range-continue-cleanup"
//                 — incorrectly emit that Drop before Continue; verifier must
//                   report uaf-loop-auto-drop before backend cleanup.
// Reached only via the `--rc-mutate=` CLI flag (verify path); the build/run
// pipelines call perceus_transform and cannot be mutated.
pub fn perceus_transform_mutated(program: HProgram, mutate: Str) -> HProgram {
    // B-104: ANF/materialize pre-pass — hoist every FRESH-OWNED intermediate
    // temporary (call args / operands / conditions / subexprs that are not bound
    // by a `let`) into a `let __anf_N = <expr>` statement so the clone-all-escape
    // RC machinery below reclaims it via the normal scope-end-drop (its `let`
    // binding is droppable per is_droppable_init).  Without this, intermediate
    // owned temporaries (`i < len`, `i + 1`, the `g(x)` in `f(g(x))`, every boxed
    // Int/Bool/Option/Str call-arg) have no binding and no one drops them — the
    // diagnosed 88% never-freed leak (live ≈ allocs 1:1).  Run BEFORE the RC pass.
    //
    // B-144: use the program-level extern type names (global set collected at
    // checker phase, covers use-imported extern types across modules).
    let planned_program = if mutate == "mixed-spread-source" {
        mutate_mixed_spread_sources(program)
    } else {
        program
    }
    let externs = planned_program.extern_type_names
    let source_ownership = planned_program.ownership_metadata
    // This mutation degrades only Perceus's private view.  The returned HIR
    // keeps the authoritative total role tables so verify_rc can independently
    // detect the missing materialisation/drop.
    let anf_input_ownership = if mutate == "missing-slot-result-drop" {
        ownership_metadata_with_none_result_roles(source_ownership)
    } else {
        source_ownership
    }
    let anf_result = if mutate == "skip-anf" {
        AnfNormalization {
            program: planned_program, callable_projections: [] }
    } else {
        anf_normalize(planned_program, externs, anf_input_ownership,
            mutate == "skip-spread-materialization",
            mutate == "mixed-spread-source")
    }
    let mut anf_program = anf_result.program
    let source_with_anf = apply_anf_callable_projections(
        source_ownership, anf_result.callable_projections)
    // The missing-slot mutation intentionally gives only Perceus a private
    // all-NONE role view. Rebuild it after ANF publication so its four DefId
    // tables remain total for every new synthetic callable identity.
    let input_ownership = if mutate == "missing-slot-result-drop" {
        ownership_metadata_with_none_result_roles(source_with_anf)
    } else {
        source_with_anf
    }
    // B-091: `boxed_vars` (def_ids of `let mut` vars auto-boxed for write-through
    // closure capture) is threaded through the RC pass so the Assign old-value
    // Drop is suppressed for them — a boxed write mutates `cell.value`, it does
    // NOT consume/free the shared cell pointer.
    let ownership = input_ownership
    // Index 0 is the ordinary RC gensym. Remaining cells are test-only mutation
    // controls, kept outside semantic metadata so no boxed Map/struct alias can
    // leak them: missing-Take, missing Range Break cleanup, and premature Range
    // Continue cleanup respectively.
    let mut rc_gensym = RcState {
        counters: [0,
            if mutate == "missing-take" { 1 } else { 0 },
            if mutate == "strip-range-break-cleanup" { 1 } else { 0 },
            if mutate == "inject-range-continue-cleanup" { 1 } else { 0 }],
        callable_projections: []
    }
    let new_decls = transform_decls(anf_program.decls,
        anf_program.boxed_vars, externs, ownership, rc_gensym)
    let mutated_decls = if mutate == "drop-params" { mutate_drop_params(new_decls) } else { new_decls }
    let source_with_rc = apply_rc_callable_projections(
        source_with_anf, rc_gensym.callable_projections)
    let output_ownership = if mutate == "strip-callable-metadata" {
        ownership_metadata_without_callable_contracts(source_with_rc)
    } else if mutate == "strip-callable-result-roles" {
        ownership_metadata_without_result_roles(source_with_rc)
    } else if mutate == "strip-anf-callable-metadata" {
        ownership_metadata_without_synthetic_anf_callable_contracts(
            source_with_rc)
    } else if mutate == "strip-anf-callable-result-roles" {
        ownership_metadata_without_synthetic_anf_result_roles(source_with_rc)
    } else {
        source_with_rc
    }
    let transformed = HProgram {
        decls: mutated_decls,
        derived_impls: anf_program.derived_impls,
        boxed_vars: anf_program.boxed_vars,
        static_dicts: anf_program.static_dicts,
        extern_type_names: anf_program.extern_type_names,
        ownership_metadata: output_ownership
    }
    // Non-metadata mutations must not alter or smuggle control through the
    // returned semantic truth.  This runtime assertion executes immediately
    // before the caller enters verify_rc.
    if mutate != "strip-callable-metadata" &&
       mutate != "strip-callable-result-roles" &&
       mutate != "strip-anf-callable-metadata" &&
       mutate != "strip-anf-callable-result-roles" {
        validate_callable_ownership_metadata(transformed.ownership_metadata)
    }
    validate_hir_binder_def_ids(transformed)
    transformed
}

fn ownership_metadata_with_role_maps(
    metadata: OwnershipMetadata, direct_roles: Map<Int, Int>,
    returned_roles: Map<Int, Int>, callable_by_def_id: Map<Int, Int>,
    callable_states: Map<Int, CallableOwnershipState>
) -> OwnershipMetadata {
    let mut role_spines: Map<Int, List<Int>> = map_new()
    for def_id in callable_by_def_id.keys() {
        match (direct_roles.get(def_id), returned_roles.get(def_id)) {
            (some(direct), some(returned)) => {
                let mut spine = metadata.callable_result_role_spine_by_def_id
                    .get(def_id).unwrap_or([direct, returned])
                while spine.len() < 2 { spine.push(CALLABLE_RESULT_ROLE_NONE) }
                spine.set(0, direct)
                spine.set(1, returned)
                role_spines.insert(def_id, spine)
            },
            _ => {}
        }
    }
    OwnershipMetadata {
        callable_descriptors: metadata.callable_descriptors,
        callable_by_def_id: callable_by_def_id,
        callable_state_by_def_id: callable_states,
        callable_result_role_by_def_id: direct_roles,
        returned_callable_result_role_by_def_id: returned_roles,
        callable_result_role_spine_by_def_id: role_spines,
        callable_inference_parents: metadata.callable_inference_parents,
        callable_inference_solutions: metadata.callable_inference_solutions,
        next_callable_inference_term: metadata.next_callable_inference_term,
        ownership_shapes: metadata.ownership_shapes
    }
}

fn ownership_metadata_with_none_result_roles(
    metadata: OwnershipMetadata
) -> OwnershipMetadata {
    let mut direct: Map<Int, Int> = map_new()
    let mut returned: Map<Int, Int> = map_new()
    for def_id in metadata.callable_by_def_id.keys() {
        let direct_def_id = def_id
        let returned_def_id = def_id
        direct.insert(direct_def_id, CALLABLE_RESULT_ROLE_NONE)
        returned.insert(returned_def_id, CALLABLE_RESULT_ROLE_NONE)
    }
    ownership_metadata_with_role_maps(metadata, direct, returned,
        metadata.callable_by_def_id, metadata.callable_state_by_def_id)
}

fn ownership_metadata_without_callable_contracts(
    metadata: OwnershipMetadata
) -> OwnershipMetadata {
    ownership_metadata_with_role_maps(metadata, map_new(), map_new(),
        map_new(), map_new())
}

fn ownership_metadata_without_result_roles(
    metadata: OwnershipMetadata
) -> OwnershipMetadata {
    ownership_metadata_with_role_maps(metadata, map_new(), map_new(),
        metadata.callable_by_def_id, metadata.callable_state_by_def_id)
}

fn ownership_metadata_without_synthetic_anf_callable_contracts(
    metadata: OwnershipMetadata
) -> OwnershipMetadata {
    let mut callable_by_def_id: Map<Int, Int> = map_new()
    let mut callable_states: Map<Int, CallableOwnershipState> = map_new()
    let mut direct_roles: Map<Int, Int> = map_new()
    let mut returned_roles: Map<Int, Int> = map_new()
    for def_id in metadata.callable_by_def_id.keys() {
        if !is_synthetic_anf_def_id(def_id) {
            let callable_term = match metadata.callable_by_def_id.get(def_id) {
                some(term) => term,
                none => panic("unreachable: callable metadata key disappeared")
            }
            let callable_state = match metadata.callable_state_by_def_id.get(
                    def_id) {
                some(state) => state,
                none => panic("unreachable: callable state is not total")
            }
            let direct_role = match metadata.callable_result_role_by_def_id.get(
                    def_id) {
                some(role) => role,
                none => panic("unreachable: direct callable role is not total")
            }
            let returned_role = match metadata
                    .returned_callable_result_role_by_def_id.get(def_id) {
                some(role) => role,
                none => panic("unreachable: returned callable role is not total")
            }
            let callable_term_def_id = def_id
            let callable_state_def_id = def_id
            let direct_role_def_id = def_id
            let returned_role_def_id = def_id
            callable_by_def_id.insert(callable_term_def_id, callable_term)
            callable_states.insert(callable_state_def_id, callable_state)
            direct_roles.insert(direct_role_def_id, direct_role)
            returned_roles.insert(returned_role_def_id, returned_role)
        }
    }
    ownership_metadata_with_role_maps(metadata, direct_roles, returned_roles,
        callable_by_def_id, callable_states)
}

fn ownership_metadata_without_synthetic_anf_result_roles(
    metadata: OwnershipMetadata
) -> OwnershipMetadata {
    let mut direct_roles: Map<Int, Int> = map_new()
    let mut returned_roles: Map<Int, Int> = map_new()
    for def_id in metadata.callable_by_def_id.keys() {
        if !is_synthetic_anf_def_id(def_id) {
            let direct_role = match metadata.callable_result_role_by_def_id.get(
                    def_id) {
                some(role) => role,
                none => panic("unreachable: direct callable role is not total")
            }
            let returned_role = match metadata
                    .returned_callable_result_role_by_def_id.get(def_id) {
                some(role) => role,
                none => panic("unreachable: returned callable role is not total")
            }
            let direct_role_def_id = def_id
            let returned_role_def_id = def_id
            direct_roles.insert(direct_role_def_id, direct_role)
            returned_roles.insert(returned_role_def_id, returned_role)
        }
    }
    ownership_metadata_with_role_maps(metadata, direct_roles, returned_roles,
        metadata.callable_by_def_id, metadata.callable_state_by_def_id)
}

// Ownership planning has already rejected opaque callables.  Perceus still
// reads the exact descriptor at each call edge because a Move projection or a
// borrowed-return call needs its independent non-linear owner materialised
// here, by the sole Clone-producing pass.
fn perceus_call_param_mode(
    ownership: OwnershipMetadata, callee_def_id: Int?, index: Int
) -> Int {
    let def_id = match callee_def_id {
        some(id) => id,
        none => panic("unreachable: Perceus call has no exact callable DefId")
    }
    let ownership_id = match ownership.callable_by_def_id.get(def_id) {
        some(id) => id,
        none => panic(
            "unreachable: Perceus call has no exact ownership descriptor")
    }
    let mode = callable_param_ownership(ownership, ownership_id, index)
    if mode == PARAM_OWNERSHIP_UNKNOWN {
        panic("unreachable: Perceus call parameter ownership is unknown")
    }
    mode
}

fn perceus_move_edge_requires_invalidation(
    ownership: OwnershipMetadata, callee_def_id: Int?, index: Int,
    ty: Type, externs: Set<Str>
) -> Bool {
    let def_id = match callee_def_id {
        some(id) => id,
        none => panic("unreachable: Perceus Move edge has no exact callable DefId")
    }
    let force = match callable_param_requires_force(
            ownership, def_id, index) {
        some(value) => value,
        none => panic(
            "unreachable: Perceus Move edge has no transfer-strength authority")
    }
    if force {
        type_has_logical_transfer_value(ty)
    } else {
        type_crosses_logical_owning_edge_by_value(ty, externs)
    }
}

fn assert_perceus_move_edge(expr: HExpr) {
    if move_edge_has_reachable_bare_binding(expr, false) {
        panic("unreachable: Perceus Move binding edge has no exact Take")
    }
}

// B-104 D2 TEST-ONLY (see perceus_transform_mutated): append a Drop of every
// parameter to each function body — a deliberate violation of "all parameters
// borrow" (the callee never drops a parameter) for the verifier's
// uaf-drop-borrow negative test.
fn mutate_drop_params(decls: List<HDecl>) -> List<HDecl> {
    let mut out: List<HDecl> = []
    for d in decls {
        match d {
            HDecl::Fn { params, body, .. } => {
                let params_ = params
                let body_ = body
                out.push(HDecl::Fn { ..d,
                    body: mutate_append_param_drops(body_, params_) })
            },
            _ => {
                let decl_ = d
                out.push(decl_)
            },
        }
    }
    out
}

fn mutate_append_param_drops(body: HExpr, params: List<HParam>) -> HExpr {
    match body {
        HExpr::Block { stmts, .. } => {
            let mut new_stmts = stmts.concat([])
            for p in params {
                let param_def_id = match p.def_id {
                    some(id) => id,
                    none => panic(
                        "unreachable: RC mutation parameter has no exact DefId")
                }
                new_stmts.push(HStmt::Drop { name: p.name,
                    def_id: param_def_id, ty: Type::UnitType,
                    span: synthetic_span() })
            }
            HExpr::Block { ..body, stmts: new_stmts }
        },
        _ => body,
    }
}

// ============================================================
// B-104: ANF / materialize pre-pass
// ============================================================
//
// Goal: give every FRESH-OWNED intermediate temporary a `let` binding so the
// clone-all-escape RC pass below reclaims it via scope-end-drop.  An intermediate
// temporary is a sub-expression in a NON-binding position (a call/ctor argument,
// an arithmetic/comparison operand, a loop/branch condition, an interpolation
// piece, …) that allocates a fresh owned value (boxed Int/Bool, Option, Str,
// container, struct/variant) and whose result has no `let` to own it — so the
// RC pass never drops it and it leaks (the diagnosed live≈allocs 1:1).
//
// Strategy: walk each statement list, and for every hoistable sub-expression
// position materialise the value into a fresh `let __anf_N = <expr>` emitted
// immediately before the using statement, replacing the sub-expression with an
// Ident referencing __anf_N.  The RC pass then sees a droppable `let` (Call /
// BinOp / UnaryOp / constructor / StringInterp / Lambda all satisfy
// is_droppable_init) and inserts the scope-end Drop.  This is plain A-normal-form
// applied only to fresh-owned subexprs; it does NOT introduce backward-liveness
// (the #134 risk) — it reuses the existing forward scope-end-drop.
//
// HARD RULES (a violation = UAF or changed behaviour):
//   R1 ONLY materialise FRESH-OWNED compounds: BinOp / UnaryOp / exact-owned Call /
//      StructLit / NamedVariantConstruct / ListLit / TupleLit / RangeExpr /
//      StringInterp / Lambda.  NEVER Ident / FieldAccess / IndexExpr /
//      a Call whose exact DefId descriptor returns Borrowed — those are BORROWS;
//      materialise+drop would UAF.  Literals are skipped (no heap to reclaim) but
//      they are harmless if bound; we skip them for cleanliness.
//   R2 DO NOT hoist past a short-circuit / branch boundary.  The RIGHT operand of
//      `&&` / `||` and the per-branch values of if/match are evaluated
//      conditionally; their temporaries are materialised INSIDE a self-contained
//      scope (a Block tail, or the branch body block), never lifted to the outer
//      statement list.
//   R3 LOOP conditions materialise + drop PER ITERATION.  `while c`'s `c` is
//      re-evaluated each round; its temporaries are wrapped in a Block so the
//      scope-end Drop runs every iteration (lifting them to before the loop would
//      evaluate once and leak each round).
//   R4 EVALUATION ORDER preserved: multiple operands materialise left→right, and a
//      child's own nested hoists precede the child's own materialisation.
//   R5 ESCAPE handled downstream: a materialised binding that later escapes is
//      Clone'd by clone-all-escape and its `let` is scope-dropped — no special
//      casing here.

struct AnfCallableProjection {
    target_def_id: Int,
    expected_ownership_term: Int,
    source_def_ids: List<Int>
}

struct AnfState {
    counters: List<Int>,
    callable_projections: List<AnfCallableProjection>
}

struct AnfNormalization {
    program: HProgram,
    callable_projections: List<AnfCallableProjection>
}

struct RcCallableProjection {
    target_def_id: Int,
    expected_ownership_term: Int,
    source_def_ids: List<Int>
}

struct RcState {
    counters: List<Int>,
    callable_projections: List<RcCallableProjection>
}

fn apply_anf_callable_projections(
    mut metadata: OwnershipMetadata,
    projections: List<AnfCallableProjection>
) -> OwnershipMetadata {
    for projection in projections {
        if !is_synthetic_anf_def_id(projection.target_def_id) {
            panic("unreachable: ANF callable projection target is outside the synthetic ANF namespace")
        }
        for source_def_id in projection.source_def_ids {
            if source_def_id < 0 &&
               !is_synthetic_anf_def_id(source_def_id) {
                panic("unreachable: ANF callable projection source is in a foreign synthetic DefId namespace")
            }
        }
        project_synthetic_anf_callable_metadata(
            metadata, projection.target_def_id,
            projection.expected_ownership_term,
            projection.source_def_ids)
    }
    // Each projection is checked against all four authoritative tables while
    // it is published.  The transform exit below performs the single global
    // metadata validation after RC planning, so repeating that full-table scan
    // here would only duplicate an O(metadata) barrier for every module.
    metadata
}

fn apply_rc_callable_projections(
    mut metadata: OwnershipMetadata,
    projections: List<RcCallableProjection>
) -> OwnershipMetadata {
    for projection in projections {
        if !is_synthetic_rc_def_id(projection.target_def_id) {
            panic("unreachable: RC callable projection target is outside the synthetic RC namespace")
        }
        for source_def_id in projection.source_def_ids {
            if source_def_id < 0 &&
               !is_synthetic_anf_def_id(source_def_id) &&
               !is_synthetic_rc_def_id(source_def_id) {
                panic("unreachable: RC callable projection source is in a foreign synthetic DefId namespace")
            }
        }
        project_synthetic_rc_callable_metadata(
            metadata, projection.target_def_id,
            projection.expected_ownership_term,
            projection.source_def_ids)
    }
    metadata
}

fn record_rc_callable_projection(
    expr: HExpr, target_def_id: Int, mut state: RcState
) {
    match hexpr_type(expr) {
        Type::FnType { meta, .. } => {
            let source_def_ids = match hexpr_callable_source_def_ids(expr) {
                some(ids) => ids,
                none => panic(
                    "unreachable: RC callable hoist has no exact producer DefId set")
            }
            state.callable_projections.push(RcCallableProjection {
                target_def_id: target_def_id,
                expected_ownership_term: meta.ownership_term,
                source_def_ids: source_def_ids
            })
        },
        _ => {}
    }
}

fn anf_normalize(
    program: HProgram, externs: Set<Str>, ownership: OwnershipMetadata,
    skip_spread_materialization: Bool, allow_mixed_spread_mutation: Bool
) -> AnfNormalization {
    // Per-program monotonic temp counter (single-element mutable cell, same idiom
    // as perceus's gensym).  Identical across runs of the same source, so it does
    // not perturb double-bootstrap byte-equivalence.
    let mut counter = AnfState {
        counters: [0,
            if skip_spread_materialization { 1 } else { 0 },
            if allow_mixed_spread_mutation { 1 } else { 0 }],
        callable_projections: []
    }
    let mut new_decls: List<HDecl> = []
    for d in program.decls {
        let decl_ = d
        new_decls.push(anf_decl(decl_, externs, ownership, counter))
    }
    let normalized_program = HProgram {
        decls: new_decls,
        derived_impls: program.derived_impls,
        boxed_vars: program.boxed_vars,
        static_dicts: program.static_dicts,
        extern_type_names: program.extern_type_names,
        ownership_metadata: program.ownership_metadata
    }
    AnfNormalization { program: normalized_program,
        callable_projections: counter.callable_projections }
}

fn fresh_anf_tmp(mut counter: AnfState) -> (Str, Int) {
    let n = match counter.counters.get(0) { some(v) => v, none => 0 }
    let ordinal = n + 1
    counter.counters.set(0, ordinal)
    ("__anf_${ordinal}",
        synthetic_def_id(SYNTHETIC_ANF_DEF_ID_BASE, ordinal))
}

fn anf_decl(
    decl: HDecl, externs: Set<Str>, ownership: OwnershipMetadata,
    mut counter: AnfState
) -> HDecl {
    match decl {
        HDecl::Fn { body, .. } => {
            let body_ = body
            HDecl::Fn { ..decl,
                body: anf_fn_body(body_, externs, ownership, counter) }
        },
        HDecl::Impl { methods, .. } => {
            let mut new_methods: List<HDecl> = []
            for m in methods {
                let method_ = m
                new_methods.push(anf_decl(method_, externs, ownership, counter))
            }
            HDecl::Impl { ..decl, methods: new_methods }
        },
        HDecl::Test { body, .. } => {
            let body_ = body
            HDecl::Test { ..decl,
                body: anf_fn_body(body_, externs, ownership, counter) }
        },
        HDecl::Const { init, .. } => {
            // Const init is in escape position with no enclosing statement list to
            // hoist into; normalise its nested subexprs into a Block tail if any
            // materialisation is needed.
            let init_ = init
            HDecl::Const { ..decl, init: anf_value_in_own_scope(
                init_, externs, ownership, counter) }
        },
        HDecl::ModBlock { decls: mod_decls, .. } => {
            let mut new_mod: List<HDecl> = []
            for md in mod_decls {
                let decl_ = md
                new_mod.push(anf_decl(decl_, externs, ownership, counter))
            }
            HDecl::ModBlock { ..decl, decls: new_mod }
        },
        HDecl::Struct { .. } => decl,
        HDecl::Enum { .. } => decl,
        HDecl::Effect { ops, .. } => {
            let mut new_ops: List<HEffectOp> = []
            for op in ops {
                let new_default_body = match op.default_body {
                    some(body) => {
                        let body_ = body
                        some(anf_fn_body(body_, externs, ownership, counter))
                    },
                    none => none,
                }
                new_ops.push(HEffectOp { ..op,
                    default_body: new_default_body })
            }
            HDecl::Effect { ..decl, ops: new_ops }
        },
        HDecl::Trait { .. } => decl,
        HDecl::ExternFn { .. } => decl,
        HDecl::ExternType { .. } => decl,
        HDecl::TypeAlias { .. } => decl,
        HDecl::Sig { .. } => decl,
    }
}

// A function/lambda body: a Block (or a single tail expr) in escape position.
fn anf_fn_body(
    body: HExpr, externs: Set<Str>, ownership: OwnershipMetadata,
    mut counter: AnfState
) -> HExpr {
    anf_block_expr(body, externs, ownership, counter)
}

// Whether an expression is a FRESH-OWNED compound that should be materialised when
// it sits in a hoistable (non-binding) position (R1). A descriptor-Borrowed Call
// is excluded — its result aliases a live reference, so binding+dropping it would UAF.
// SYNC NOTE (#205): anf_should_materialize and is_droppable_init (below, ~line
// 1658) both classify HExpr variants but answer DIFFERENT questions:
//   - anf_should_materialize: "Is this a fresh-owned value in OPERAND position
//     that should be hoisted to a temporary for scope-end drop?"
//   - is_droppable_init: "Is this value in BINDING position safe to scope-end
//     drop, considering rc_escape will Clone-wrap borrows?"
// They share a common preamble (rc-excluded / extern-handle / TypeVar guards)
// and agree on 12+ "fresh constructor" variants (BinOp, UnaryOp, StructLit,
// ListLit, TupleLit, RangeExpr, StringInterp, Lambda, IntLit, FloatLit,
// StrLit, BoolLit → true in both).  INTENTIONAL divergences:
//   - Ident/FieldAccess/non-Str IndexExpr/Clone: NOT materialized (borrows in
//     operand position → UAF), but IS droppable (rc_escape Clone-wraps them)
//   - Call (exact descriptor returns Borrowed): NOT materialized, IS droppable
//   - MatchExpr/Block/DictConstruct: NOT materialized (conservative), IS
//     droppable (binding position needs branch-recursive analysis)
// When adding a NEW HExpr variant, update BOTH functions.
//
// Callable control flow is the one deliberately stronger case: a function
// value can be certified fresh when every value-producing path creates a
// wrapper/lambda or returns a fresh Call result. Diverging paths produce no
// value and therefore do not veto that proof. Keep this helper public so the
// post-RC verifier rejects any such shape that survives ANF in a borrow site.
pub fn is_materializable_fn_value(
    expr: HExpr, externs: Set<Str>, ownership: OwnershipMetadata
) -> Bool {
    let ty = hexpr_type(expr)
    let is_fn = match ty { Type::FnType { .. } => true, _ => false }
    if is_fn == false {
        return false
    }
    if !type_is_physical_rc_eligible(ty, externs) {
        return false
    }
    if is_unresolved_var_type(ty) || expr_diverges(expr) {
        return false
    }
    match expr {
        HExpr::Ident { dict_closure_dicts, .. } =>
            dict_closure_dicts.is_some(),
        HExpr::Lambda { .. } => true,
        HExpr::Call { callee_def_id, .. } =>
            call_returns_borrowed(ownership, callee_def_id) == false,
        HExpr::Clone { .. } => true,
        HExpr::Take { .. } => false,
        HExpr::Block { tail, .. } => match tail {
            some(value) => is_materializable_fn_value(
                value, externs, ownership),
            none => false
        },
        HExpr::IfExpr { then_branch, else_branch, .. } => match else_branch {
            some(value) =>
                is_materializable_fn_branch(
                    then_branch, externs, ownership) &&
                is_materializable_fn_branch(value, externs, ownership),
            none => false
        },
        HExpr::MatchExpr { arms, .. } => {
            let mut all = arms.len() > 0
            for arm in arms {
                if is_materializable_fn_branch(
                        arm.body, externs, ownership) == false {
                    all = false
                }
            }
            all
        },
        HExpr::UnsafeBlock { body, .. } =>
            is_materializable_fn_value(body, externs, ownership),
        _ => false
    }
}

fn is_materializable_fn_branch(
    body: HExpr, externs: Set<Str>, ownership: OwnershipMetadata
) -> Bool {
    if expr_diverges(body) {
        true
    } else {
        is_materializable_fn_value(body, externs, ownership)
    }
}

fn anf_should_materialize(
    expr: HExpr, externs: Set<Str>, ownership: OwnershipMetadata
) -> Bool {
    // B-104 D1 rule ② (Unit) + rule ① (extern, audit #139), both TYPE-level:
    //   ② a Unit-typed expression has no value semantics (checker-guaranteed).
    //     At the ABI level a Unit-typed builtin call
    //     may accidentally return a live pointer (the receiver-returning
    //     mutators — `return list;` etc., classification table below), so
    //     binding + scope-end-dropping it would free the caller's container.
    //     Never materialise Unit.
    //   ① a value whose type IS an extern handle, or transitively CONTAINS one
    //     (List<LLVMTypeRef>, LLVMValueRef?, …), must never be materialised —
    //     the materialised `let __anf` would be scope-end-dropped, and dropping
    //     it ring_drops a raw foreign pointer (garbage header read / foreign
    //     free → heap corruption).
    // Leave both inline: borrowed by the consumer, never dropped (the pre-D1
    // status quo for these values — crash-free).
    let ty = hexpr_type(expr)
    if !type_is_physical_rc_eligible(ty, externs) {
        return false
    }
    // Option::none is an exact global constructor Ident, but unlike ordinary
    // nullary variants the runtime returns an immortal singleton.  It has no
    // fresh reference to materialise or scope-end-drop.
    if is_option_none_ctor_ident(expr) {
        return false
    }
    // The slot bridge contract is stronger than an unresolved generic result:
    // read duplicates and take moves out, so both always produce an owned
    // reference.  Impl-level K/V variables are not always name-labelled by
    // zonk, therefore this exact leaf must override the unnamed-TypeVar guard.
    match exact_call_result_role(expr, ownership) {
        some(role) => {
            if role == CALLABLE_RESULT_ROLE_FRESH_OWNED_SLOT {
                return true
            } else if role == CALLABLE_RESULT_ROLE_UNKNOWN &&
                      is_unresolved_var_type(ty) {
                panic("unreachable: Perceus received an unresolved call result with unknown semantic role")
            }
        },
        none => {}
    }
    // B-104 D1 Stage 2 — UNKNOWN-OWNERSHIP guard (audit #149): an expression
    // whose HIR type is an unresolved TypeVar must never be materialised.  The
    // type-level Unit exclusion (rule ②) cannot see through it: an UNANNOTATED
    // Ring fn's return type is over-generalised to a free var (checker hole,
    // audit #149 — `let x: Str = tp([1])` type-checks), so a call like `tp(a)`
    // whose body tail is a receiver-returning Unit builtin (`xs.push(v)` —
    // moved verbatim, un-dup'd, because Unit is rc-excluded) hands back the
    // LIVE RECEIVER pointer typed as a TypeVar.  Materialise + scope-end-drop
    // would double-free the caller's container (ASan-proven: `let r = tp(a)`
    // UAF on the pre-guard compiler).  Ownership of a TypeVar-typed value is
    // unknowable here → leak-direction: not materialised, not droppable (see
    // the same guard in is_droppable_init).  Clone-on-escape stays allowed
    // (an extra dup on a live pointer only pins — crash-free).
    if is_unresolved_var_type(ty) {
        return false
    }
    // A checker-marked module function value allocates a fresh wrapper closure
    // at codegen.  The explicit some([]) marker is just as owned as a bounded
    // some(dicts) wrapper; control-flow/Block forms share this classification
    // through hir.is_materialized_fn_value.
    if is_materializable_fn_value(expr, externs, ownership) {
        return true
    }
    let nullary_variant_ctor = is_nullary_variant_ctor_ident(expr)
    match expr {
        // Arithmetic / comparison BinOps box a FRESH result (gen_int_binop /
        // gen_*_binop → box_int/box_bool/box_float) — materialise.  `&&`/`||`
        // never reach this pass (B-104 D7: andor_lower rewrites them to IfExpr
        // at checker end), retiring the And/Or phi-verbatim borrow hazard this
        // arm used to guard against (the old gen_and/gen_or yielded the RHS
        // operand box VERBATIM on the taken edge — possibly a borrow, the
        // register_impl_method/is_mutable ASan UAF).
        HExpr::BinOp { .. } => true,
        HExpr::UnaryOp { .. } => true,
        HExpr::Call { callee_def_id, .. } =>
            call_returns_borrowed(ownership, callee_def_id) == false,
        HExpr::StructLit { .. } => true,
        HExpr::NamedVariantConstruct { .. } => true,
        HExpr::ListLit { .. } => true,
        HExpr::TupleLit { .. } => true,
        HExpr::RangeExpr { .. } => true,
        HExpr::StringInterp { .. } => true,
        HExpr::Lambda { .. } => true,
        // B-104 task-1: scalar literals are NOT free — uniform-BOXED (B-080 unboxing
        // not done), so every IntLit / StrLit / BoolLit / FloatLit is a FRESH heap box
        // (gen_int_lit → box_int, gen_str_lit → ring_str_new, etc.).  A literal in an
        // operand position (`f(5)`, `code: E0301` as arg, `acc + 1`'s `1`, an interp
        // piece) is borrowed by the consumer and never dropped → leak (the residual
        // tid=0 INT / tid=3 STR / tid=2 BOOL bulk).  Materialise + scope-end-drop them.
        //
        // PHI-ALIAS note (B-104 D7 update): branch TAILS (if/match/block, incl.
        // the arms andor_lower produces from `&&`/`||`) go through
        // anf_tail_value → anf_expr (no top-level materialise), so a literal
        // that becomes a branch phi value is never separately bound — the phi
        // consumer (binding drop / codegen post-unbox drop / IfExpr value
        // materialisation below) releases it exactly once.  The only
        // materialisation site is a genuine eager operand (call arg / arith
        // operand / condition / interp piece), whose box is consumed by the
        // operation, not aliased back out as the enclosing expression's value.
        // R5 escape (a materialised literal that later escapes, e.g.
        // `let x = f(5)` where 5 is the only arg path) is handled by
        // clone-all-escape exactly as for any other fresh-owned binding.
        HExpr::IntLit { .. } => true,
        HExpr::FloatLit { .. } => true,
        HExpr::StrLit { .. } => true,
        HExpr::BoolLit { .. } => true,
        // A fieldless variant has Ident syntax in HIR, but codegen invokes its
        // zero-argument constructor and returns a FRESH enum box.  In operand
        // position it therefore needs the same ANF binding + scope-end Drop as
        // every other fresh constructor.
        HExpr::Ident { .. } => nullary_variant_ctor,
        // B-104 D1 rule ③: IndexExpr refined by RECEIVER type.  `s[i]` on a Str
        // lowers to ring_str_get, which allocates a NEW 1-char string
        // (ring_runtime.cpp: ring_alloc + placement-new — verified) — a FRESH
        // owned value, NOT a borrow into the receiver.  Before this rule it rode
        // the blanket IndexExpr borrow classification: never materialised (leak
        // in every operand position — the lexer's per-char `src[i]` flood, a
        // dominant tid=3 STR share) and Clone-wrapped on escape (the dup
        // escaped, the original 1-char string leaked).  List indexing
        // (ring_list_get) returns the element pointer WITHOUT a dup — a true
        // borrow — and keeps the conservative path (generic/TypeVar receivers
        // too).  Map indexing is lowered during inference to the owned
        // map_get_panic Ring call, whose ring_slot_read duplicates the value.
        HExpr::IndexExpr { receiver, .. } => is_str_index(receiver),
        // B-104 D7: a value-position IfExpr whose EVERY non-diverging branch
        // tail is itself materialisable (fresh-owned) — materialise the whole
        // phi so the branch box is reclaimed by the scope-end drop.  This is
        // what closes the lowered `a && b` in ONE-SHOT condition / operand
        // positions (`if a && b {…}`, `f(a && b)`, `!(a && b)`): post-lower
        // the phi is an IfExpr with fresh arms (comparison / call / BoolLit),
        // hoisted to `let __anf_N = if a { b } else { false }` and scope-end-
        // dropped (the types.ring:386 if-cond class, ≈23.3M @2.382B).  A
        // borrow arm (Ident / FieldAccess tail) vetoes — the phi may alias
        // state owned elsewhere; it stays inline under the conservative
        // x-cf-value posture, exactly the old And/Or conservatism.  While-cond
        // / match-guard positions never reach here (anf_cond_in_own_scope
        // normalises the cond top-level via anf_expr, not anf_operand); their
        // phi box is dropped by the codegen post-unbox drop gated on
        // is_fresh_owned_bool_value.  MatchExpr values deliberately keep the
        // no-materialise posture (pre-existing conservatism, not D7 scope).
        HExpr::IfExpr { then_branch, else_branch, .. } => {
            match else_branch {
                none => false,
                some(eb) => anf_branch_materializable(
                    then_branch, externs, ownership)
                    && anf_branch_materializable(eb, externs, ownership),
            }
        },
        // NEVER materialise: Ident / FieldAccess / non-Str IndexExpr (borrows),
        // Match/Block control-flow (handled structurally), EffectOp /
        // HandleExpr / TryCatch / Clone.
        _ => false,
    }
}

// B-104 D7: whether a branch body yields a value that is itself materialisable
// — the all-fresh branch recursion for value-position IfExpr materialisation.
// Mirrors is_droppable_branch_value's divergence handling (a diverging branch
// yields no value, so it never vetoes) and bottoms out on the same
// anf_should_materialize leaf classification.
fn anf_branch_materializable(
    body: HExpr, externs: Set<Str>, ownership: OwnershipMetadata
) -> Bool {
    if expr_diverges(body) {
        true
    } else {
        match body {
            HExpr::Block { tail, .. } => match tail {
                some(t) => anf_should_materialize(t, externs, ownership),
                none => false,
            },
            _ => anf_should_materialize(body, externs, ownership),
        }
    }
}

// Spread reads fields from its source and therefore needs the source to remain
// live until the constructor has copied its final uncovered field.  A direct
// binding/projection stays a borrow; a proven fresh source is bound exactly
// once so normal scope cleanup drops it after the constructor expression.
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

fn spread_match_arm_source_classification(
    arm: HMatchArm, externs: Set<Str>, ownership: OwnershipMetadata
) -> Int {
    match arm {
        HMatchArm { guard, body, .. } => {
            match guard {
                some(value) => if !expr_has_reachable_value(value) {
                    return SPREAD_SOURCE_NO_REACHABLE_VALUE
                },
                none => {}
            }
            spread_branch_source_classification(body, externs, ownership)
        }
    }
}

// Keep the iterator body's HStmt payload in a named-function frame.  Besides
// making the ownership edge explicit, this prevents the C bootstrap from
// treating a nested `init` pattern binding as an undefined iterator capture.
fn spread_block_local_stmt_classification(
    stmt: HStmt, stmts: List<HStmt>, target_id: Int,
    externs: Set<Str>, ownership: OwnershipMetadata, fuel: Int
) -> Int? {
    match stmt {
        HStmt::Let { def_id: some(local_id), init, .. } => {
            if local_id == target_id {
                let identity_init = init
                let classification_init = init
                match identity_init {
                    HExpr::Take { source_def_id, .. } => {
                        match spread_block_local_init_classification(
                                stmts, source_def_id, externs,
                                ownership, fuel - 1) {
                            some(local_classification) => {
                                let result = local_classification
                                return some(result)
                            },
                            // A planned Take whose exact source is outside
                            // this block is the authoritative whole-binding
                            // ownership edge into the local slot.
                            none => return some(SPREAD_SOURCE_ALL_FRESH)
                        }
                    },
                    HExpr::Ident { .. } =>
                        return some(SPREAD_SOURCE_MIXED_OR_UNKNOWN),
                    _ => return some(spread_source_classification(
                        classification_init, externs, ownership))
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
    none
}

fn spread_block_local_init_classification(
    stmts: List<HStmt>, target_id: Int, externs: Set<Str>,
    ownership: OwnershipMetadata, fuel: Int
) -> Int? {
    if fuel <= 0 { return some(SPREAD_SOURCE_MIXED_OR_UNKNOWN) }
    for stmt in stmts {
        match spread_block_local_stmt_classification(
                stmt, stmts, target_id, externs,
                ownership, fuel) {
            some(classification) => {
                let result = classification
                return some(result)
            },
            none => {}
        }
    }
    none
}

fn spread_block_source_classification(
    stmts: List<HStmt>, tail: HExpr?, externs: Set<Str>,
    ownership: OwnershipMetadata
) -> Int {
    let (tail_local_id, tail_is_take, initial_classification) = match tail {
        some(value) => {
            let identity_value = value
            let classification_value = value
            let (local_id, is_take) = match identity_value {
                HExpr::Ident { def_id, .. } => {
                    let result_def_id = def_id
                    (result_def_id, false)
                },
                HExpr::Take { source_def_id, .. } => {
                    let result_source_def_id = source_def_id
                    (some(result_source_def_id), true)
                },
                _ => (none, false)
            }
            let fallback = spread_source_classification(
                classification_value, externs, ownership)
            let result_local_id = local_id
            (result_local_id, is_take, fallback)
        },
        none => return SPREAD_SOURCE_MIXED_OR_UNKNOWN
    }
    let mut classification = initial_classification
    match tail_local_id {
        some(target_id) => {
            let search_fuel = stmts.len() + 1
            match spread_block_local_init_classification(
                    stmts, target_id, externs, ownership, search_fuel) {
                some(init_classification) => {
                    classification = if init_classification ==
                            SPREAD_SOURCE_NO_REACHABLE_VALUE {
                        SPREAD_SOURCE_NO_REACHABLE_VALUE
                    } else if tail_is_take && init_classification ==
                              SPREAD_SOURCE_ALL_FRESH {
                        SPREAD_SOURCE_ALL_FRESH
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

fn spread_source_classification(
    expr: HExpr, externs: Set<Str>, ownership: OwnershipMetadata
) -> Int {
    let reachability_expr = expr
    let typed_expr = expr
    let option_expr = expr
    let role_expr = expr
    let shape_expr = expr
    if !expr_has_reachable_value(reachability_expr) {
        return SPREAD_SOURCE_NO_REACHABLE_VALUE
    }
    let ty = hexpr_type(typed_expr)
    if !type_is_physical_rc_eligible(ty, externs) ||
       is_option_none_ctor_ident(option_expr) {
        return SPREAD_SOURCE_ALL_BORROW
    }
    match exact_call_result_role(role_expr, ownership) {
        some(role) => {
            if role == CALLABLE_RESULT_ROLE_FRESH_OWNED_SLOT {
                return SPREAD_SOURCE_ALL_FRESH
            } else if role == CALLABLE_RESULT_ROLE_UNKNOWN &&
                      is_unresolved_var_type(ty) {
                return SPREAD_SOURCE_MIXED_OR_UNKNOWN
            }
        },
        none => {}
    }
    if is_unresolved_var_type(ty) {
        return SPREAD_SOURCE_MIXED_OR_UNKNOWN
    }
    match shape_expr {
        HExpr::Ident { .. } | HExpr::FieldAccess { .. } |
        HExpr::IndexExpr { .. } | HExpr::Take { .. } =>
            SPREAD_SOURCE_ALL_BORROW,
        HExpr::Clone { .. } | HExpr::DictConstruct { .. } =>
            SPREAD_SOURCE_ALL_FRESH,
        HExpr::Call { callee_def_id, .. } =>
            if call_returns_borrowed(ownership, callee_def_id) {
                SPREAD_SOURCE_ALL_BORROW
            } else {
                SPREAD_SOURCE_ALL_FRESH
            },
        HExpr::Block { stmts, tail, .. } =>
            spread_block_source_classification(
                stmts, tail, externs, ownership),
        HExpr::IfExpr { then_branch, else_branch, .. } => {
            let mut classification = spread_branch_source_classification(
                then_branch, externs, ownership)
            match else_branch {
                some(other) => {
                    classification = merge_spread_source_classifications(
                        classification, spread_branch_source_classification(
                            other, externs, ownership))
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
                        arm, externs, ownership))
            }
            classification
        },
        HExpr::UnsafeBlock { body, .. } =>
            spread_source_classification(body, externs, ownership),
        _ => if anf_should_materialize(expr, externs, ownership) {
            SPREAD_SOURCE_ALL_FRESH
        } else {
            SPREAD_SOURCE_MIXED_OR_UNKNOWN
        }
    }
}

fn spread_branch_source_classification(
    body: HExpr, externs: Set<Str>, ownership: OwnershipMetadata
) -> Int {
    if expr_diverges(body) {
        SPREAD_SOURCE_NO_REACHABLE_VALUE
    } else {
        spread_source_classification(body, externs, ownership)
    }
}

fn anf_spread_source(
    expr: HExpr, mut hoists: List<HStmt>, externs: Set<Str>,
    ownership: OwnershipMetadata, mut counter: AnfState
) -> HExpr {
    let source_expr = expr
    let normalized = anf_expr(
        source_expr, hoists, externs, ownership, counter)
    let materialize_check = normalized
    let materialize_value = normalized
    let result_value = normalized
    let skip = counter.counters.get(1) == some(1)
    let allow_mixed = counter.counters.get(2) == some(1)
    let classification = spread_source_classification(
        materialize_check, externs, ownership)
    if classification == SPREAD_SOURCE_ALL_FRESH && !skip {
        return anf_materialize(materialize_value, hoists, counter)
    }
    if classification == SPREAD_SOURCE_MIXED_OR_UNKNOWN && !allow_mixed {
        panic("unreachable: Perceus received a mixed or unknown spread source")
    }
    result_value
}

// B-104 D1 rule ③ helper: whether an IndexExpr's receiver is a Str, making the
// index read a FRESH single-char string (ring_str_get allocates) rather than a
// borrowed element pointer.  Conservative on anything but a literal StrType
// (TypeVar / generic receivers stay classified as borrows — crash-free leak).
// (pub: shared with verify_rc.ring's value classification.)
pub fn is_str_index(receiver: HExpr) -> Bool {
    match hexpr_type(receiver) {
        Type::StrType => true,
        _ => false,
    }
}

// B-104 D1 Stage 2 — UNKNOWN-OWNERSHIP type (audit #149): an UNNAMED TypeVar
// (or an ErrorType from checker recovery) gives no ownership information — the
// value could be the Unit ABI accident (a live receiver pointer moved verbatim
// because Unit is rc-excluded), which a drop would double-free.  A NAMED TypeVar
// is different: zonk labels declared generic parameters (T/K/V/U), whose value
// ownership follows the normal Ring call/read contract.  Keeping those values
// droppable is required for generic slot reads/takes and callback results to
// balance their owned references.  Only unnamed inference holes stay in the
// conservative leak direction; Clone on escape remains allowed.
// (pub: shared with verify_rc.ring's unknown-ownership guard.)
pub fn is_unresolved_var_type(ty: Type) -> Bool {
    match ty {
        Type::TypeVar { name, .. } => name.is_none(),
        Type::ErrorType => true,
        _ => false,
    }
}

// Exact semantic result role lookup.  Registration is the only place that may
// recognize a prelude ABI spelling; Perceus consumes the frozen, total DefId
// table and never inspects the callee expression or its arity.
fn exact_call_result_role(
    expr: HExpr, ownership: OwnershipMetadata
) -> Int? {
    match expr {
        HExpr::Call { callee_def_id, .. } => {
            let def_id = match callee_def_id {
                some(id) => id,
                none => panic(
                    "unreachable: Perceus call has no exact callable DefId")
            }
            match ownership.callable_result_role_by_def_id.get(def_id) {
                some(role) => {
                    let result = role
                    some(result)
                },
                none => panic(
                    "unreachable: Perceus call has no total semantic result role")
            }
        },
        _ => none,
    }
}

// Materialise `expr` (already normalised) into a fresh `let __anf_N = expr`
// appended to `hoists`, returning an Ident referencing it.  Caller guarantees
// anf_should_materialize(expr) — i.e. fresh-owned, droppable.
fn anf_materialize(
    expr: HExpr, mut hoists: List<HStmt>, mut counter: AnfState
) -> HExpr {
    let (tmp, tmp_def_id) = fresh_anf_tmp(counter)
    let projection_ty = hexpr_type(expr)
    match projection_ty {
        Type::FnType { meta, .. } => {
            let source_def_ids = match hexpr_callable_source_def_ids(expr) {
                some(ids) => ids,
                none => panic(
                    "unreachable: materialized callable has no exact producer DefId set")
            }
            counter.callable_projections.push(AnfCallableProjection {
                target_def_id: tmp_def_id,
                expected_ownership_term: meta.ownership_term,
                source_def_ids: source_def_ids
            })
        },
        _ => {}
    }
    let t = hexpr_type(expr)
    let e = hexpr_effects(expr)
    let s = hexpr_span(expr)
    let binding_name = tmp
    let ident_name = tmp
    let binding_def_id = tmp_def_id
    let ident_def_id = tmp_def_id
    let binding_ty = t
    let ident_ty = t
    hoists.push(HStmt::Let { name: binding_name,
        name_span: synthetic_span(), def_id: some(binding_def_id),
        ty: binding_ty, init: expr,
        span: synthetic_span() })
    HExpr::Ident { name: ident_name, resolved_name: none,
        def_id: some(ident_def_id),
        dict_closure_dicts: none, ty: ident_ty, effects: e, span: s }
}

// Normalise a sub-expression that sits in a CONSUMING operand position — one where
// the value is read/unboxed and the operation produces a FRESH result that CANNOT
// alias the operand (arith/compare BinOp operand, UnaryOp operand, if/while
// condition, index expression, interpolation piece).  Here materialise+scope-drop
// is SOUND: the fresh-owned box is consumed by the op (box_int/box_bool/unbox/
// stringify) and never aliased back out as the enclosing expression's value, so the
// caller's scope-end Drop is balanced. Recurse, then materialise if fresh-owned
// (R1/R4). The same rule is now used for non-borrow callee expressions.
//
// This now covers EVERY operand position, including CALL / EFFECTOP arguments
// and the MATCH scrutinee.  The historical alias hazards are all closed: a match
// arm that returns the scrutinee is Clone-wrapped by rc_escape (W2), and the last
// verbatim-arg-returning callee (`fold` on an empty list) was closed at the
// runtime by the #150 dup-on-empty (B-104 D1 Stage 3) — no callee hands back an
// un-dup'd argument any more, so materialise+scope-drop is sound everywhere.
fn anf_operand(
    expr: HExpr, mut hoists: List<HStmt>, externs: Set<Str>,
    ownership: OwnershipMetadata, mut counter: AnfState
) -> HExpr {
    let expr_ = expr
    let normalized = anf_expr(expr_, hoists, externs, ownership, counter)
    let materialize_check = normalized
    let materialize_value = normalized
    let result_value = normalized
    if anf_should_materialize(materialize_check, externs, ownership) {
        anf_materialize(materialize_value, hoists, counter)
    } else {
        result_value
    }
}

// A Block (or non-block single expr) used as a function/branch/loop body or value.
// Normalises its statement list and tail in place; no hoisting escapes the block.
fn anf_block_expr(
    body: HExpr, externs: Set<Str>, ownership: OwnershipMetadata,
    mut counter: AnfState
) -> HExpr {
    match body {
        HExpr::Block { stmts, tail, .. } => {
            let stmt_result = anf_stmt_list(
                stmts, externs, ownership, counter)
            let new_stmts = stmt_result.0
            let new_tail = if stmt_result.1 {
                match tail {
                // The tail is in escape position; its OWN nested subexprs are
                // hoisted into a trailing fragment appended to this block (the
                // hoists precede the tail value, preserving order + scope).
                some(t) => {
                    let mut tail_hoists: List<HStmt> = []
                    let nt = anf_tail_value(
                        t, tail_hoists, externs, ownership, counter)
                    if tail_hoists.len() == 0 {
                        (new_stmts, some(nt))
                    } else {
                        let mut merged = new_stmts.concat([])
                        for h in tail_hoists {
                            let hoist = h
                            merged.push(hoist)
                        }
                        (merged, some(nt))
                    }
                },
                none => (new_stmts, none),
                }
            } else {
                // The ownership planner normally prunes this already. Keep
                // ANF defensive when handed an earlier/unplanned HIR snapshot.
                (new_stmts, none)
            }
            HExpr::Block { ..body, stmts: new_tail.0, tail: new_tail.1 }
        },
        // Single-expression body (no block): treat as a tail value in its own
        // scope (materialised temps wrap into a Block so they are scope-dropped).
        _ => anf_value_in_own_scope(body, externs, ownership, counter),
    }
}

// A value expression that has NO enclosing statement list to hoist into (a const
// init, a single-expr body).  If normalising it produces hoists, wrap them in a
// fresh Block whose tail is the value — the temps are then scope-end-dropped by
// the RC pass.  The value itself is NOT materialised (it is the escaping result).
fn anf_value_in_own_scope(
    expr: HExpr, externs: Set<Str>, ownership: OwnershipMetadata,
    mut counter: AnfState
) -> HExpr {
    let mut hoists: List<HStmt> = []
    let result_ty = hexpr_type(expr)
    let result_effects = hexpr_effects(expr)
    let result_span = hexpr_span(expr)
    let nv = anf_tail_value(expr, hoists, externs, ownership, counter)
    if hoists.len() == 0 {
        nv
    } else {
        HExpr::Block { stmts: hoists, tail: some(nv),
            ty: result_ty, effects: result_effects, span: result_span }
    }
}

// Normalise an expression in TAIL / escape position (a block tail, a let init, an
// assign/return value): recurse into its subexprs (which DO hoist into `hoists`),
// but DO NOT materialise the expression itself — it escapes into the owning slot
// and the RC pass handles that binding directly.  Control-flow tails (if/match/
// block) recurse into their branches structurally (R2).
fn anf_tail_value(
    expr: HExpr, mut hoists: List<HStmt>, externs: Set<Str>,
    ownership: OwnershipMetadata, mut counter: AnfState
) -> HExpr {
    let expr_ = expr
    anf_expr(expr_, hoists, externs, ownership, counter)
}

// Normalise a statement list, returning a new list with __anf_ hoists inserted
// before each statement that needs them.
fn anf_stmt_list(
    stmts: List<HStmt>, externs: Set<Str>, ownership: OwnershipMetadata,
    mut counter: AnfState
) -> (List<HStmt>, Bool) {
    let mut out: List<HStmt> = []
    for s in stmts {
        let transformed_stmt = s
        let reachability_stmt = s
        for ns in anf_stmt(transformed_stmt, externs, ownership, counter) {
            let stmt_ = ns
            out.push(stmt_)
        }
        if !stmt_reaches_next(reachability_stmt) { return ((out, false)) }
    }
    ((out, true))
}

// Normalise a single statement, returning [hoisted lets..., transformed stmt].
fn anf_stmt(
    stmt: HStmt, externs: Set<Str>, ownership: OwnershipMetadata,
    mut counter: AnfState
) -> List<HStmt> {
    match stmt {
        HStmt::Let { init, .. } => {
            let mut hoists: List<HStmt> = []
            let init_ = init
            let new_init = anf_tail_value(
                init_, hoists, externs, ownership, counter)
            hoists.push(HStmt::Let { ..stmt, init: new_init })
            hoists
        },
        HStmt::Var { init, .. } => {
            let mut hoists: List<HStmt> = []
            let init_ = init
            let new_init = anf_tail_value(
                init_, hoists, externs, ownership, counter)
            hoists.push(HStmt::Var { ..stmt, init: new_init })
            hoists
        },
        HStmt::Assign { target, value, .. } => {
            let mut hoists: List<HStmt> = []
            // The target is a write destination (lvalue) — recurse to normalise any
            // index/receiver subexprs, but it is not a value to materialise.
            let target_ = target
            let value_ = value
            let new_target = anf_lvalue(
                target_, hoists, externs, ownership, counter)
            let new_value = anf_tail_value(
                value_, hoists, externs, ownership, counter)
            hoists.push(HStmt::Assign { ..stmt,
                target: new_target, value: new_value })
            hoists
        },
        HStmt::ExprStmt { expr, .. } => {
            let mut hoists: List<HStmt> = []
            // Statement position: the value is DISCARDED — the textbook "parent
            // drops it" fresh-owned temporary (B-104 D1 Stage 2).  A non-Unit
            // fresh result (`xs.pop()`, `compute()` for side effects) previously
            // had no owner and leaked.  Materialise the top expression
            // (anf_operand): `let __anf = xs.pop()` → scope-end drop reclaims it.
            // Zero churn for the common cases: Unit-typed calls (print / push /
            // insert — rule ②) and descriptor-Borrowed calls fail
            // anf_should_materialize and stay plain statements; control-flow
            // statements (if/match/block) are normalised structurally as before
            // (their discarded branch values stay borrows — residual).  A
            // NeverType call (panic/exit) materialises harmlessly (the drop is
            // unreachable).
            let expr_ = expr
            let new_expr = anf_operand(
                expr_, hoists, externs, ownership, counter)
            hoists.push(HStmt::ExprStmt { ..stmt, expr: new_expr })
            hoists
        },
        HStmt::Return { value, .. } => {
            match value {
                some(v) => {
                    let mut hoists: List<HStmt> = []
                    let value_ = v
                    let new_v = anf_tail_value(
                        value_, hoists, externs, ownership, counter)
                    hoists.push(HStmt::Return { ..stmt, value: some(new_v) })
                    hoists
                },
                none => [stmt],
            }
        },
        HStmt::While { condition, body, .. } => {
            // R3: the condition is re-evaluated each iteration.  Materialised temps
            // from the condition must be dropped PER ITERATION, so they wrap into a
            // Block whose tail is the condition (the Block is re-run each round, and
            // the RC pass scope-end-drops its temps each round).  They must NOT be
            // hoisted before the loop.
            let condition_ = condition
            let body_ = body
            let new_cond = anf_cond_in_own_scope(
                condition_, externs, ownership, counter)
            let new_body = anf_block_expr(body_, externs, ownership, counter)
            [HStmt::While { ..stmt,
                condition: new_cond, body: new_body }]
        },
        HStmt::ForIn { iterable, body, .. } => {
            // The iterable is evaluated ONCE before the loop → its temps may hoist
            // before the ForIn statement.  The body is its own per-iteration scope.
            //
            // B-104 D1 Stage 2 — ITERABLE position: a fresh-owned iterable
            // (`for e in m.entries()`, `for x in xs.filter(p)`, `for v in
            // make_list()`) was read by the loop and never dropped.  Materialise
            // it: `let __anf = m.entries(); for e in __anf` — the loop binding
            // borrows __anf's elements (B-098 read-borrow), element escapes are
            // Clone-wrapped, and __anf is scope-end-dropped AFTER the loop (a
            // `return` inside the body drops the full owned set incl. __anf).
            // Same Clone-wrap balance as the W2 scrutinee.
            //
            // EXCEPTION — a literal RangeExpr iterable stays INLINE: emit_for_in
            // pattern-matches the RangeExpr form structurally to lower a direct
            // counting loop (no range struct) with its own per-iteration counter
            // + bound drops (B-104b).  Materialising it would reroute through
            // the heavier range-var path for zero RC gain (the direct lowering
            // already drops the bound boxes).
            let mut hoists: List<HStmt> = []
            let iterable_ = iterable
            let new_iter = match iterable_ {
                HExpr::RangeExpr { .. } => anf_expr(
                    iterable_, hoists, externs, ownership, counter),
                _ => anf_operand(
                    iterable_, hoists, externs, ownership, counter),
            }
            let body_ = body
            let new_body = anf_block_expr(body_, externs, ownership, counter)
            hoists.push(HStmt::ForIn { ..stmt,
                iterable: new_iter, body: new_body })
            hoists
        },
        HStmt::LetDestructure { init, .. } => {
            // B-104 D1 Stage 2 — DESTRUCTURE INIT position: `let (a, b) = f()` /
            // `let (a, b) = (x, y)`.  The destructure only PROJECTS borrows out
            // of the init value (codegen emit_let_destructure: ring_list_get
            // loads, no dup; bindings are excluded from the owned set), so a
            // fresh init had NO owner and leaked (the TUPLE-typeid residual).
            // Materialise it: `let __anf = f(); let (a, b) = __anf` — the
            // bindings borrow __anf's slots, escapes of them Clone-wrap, and
            // __anf is scope-end-dropped.  Paired with the rc_stmt change that
            // processes the init as a BORROW (rc_expr) instead of rc_escape —
            // see rc_stmt's LetDestructure arm.
            let mut hoists: List<HStmt> = []
            let init_ = init
            let new_init = anf_operand(
                init_, hoists, externs, ownership, counter)
            hoists.push(HStmt::LetDestructure { ..stmt, init: new_init })
            hoists
        },
        HStmt::IfLet { expr, then_block, else_block, .. } => {
            // Scrutinee evaluated once → hoist before the IfLet.  Branch blocks are
            // their own scopes (R2).
            //
            // B-104 D1 Stage 2 — IF-LET SCRUTINEE position (W2 extension): a
            // fresh-owned scrutinee (`if let some(v) = m.get(k)`) was read by the
            // pattern test and never dropped.  Materialise it (anf_operand) —
            // identical reasoning to the W2 MatchExpr scrutinee: pattern bindings
            // PROJECT borrows of __anf (excluded from owned, never dropped), any
            // escape of a binding/projection is Clone-wrapped, and __anf's
            // scope-end Drop (after both branches) releases the original —
            // dup-before-drop balanced.  Borrow scrutinees (Ident/field/index)
            // fail anf_should_materialize and stay inline.
            let mut hoists: List<HStmt> = []
            let expr_ = expr
            let then_block_ = then_block
            let new_expr = anf_operand(
                expr_, hoists, externs, ownership, counter)
            let new_then = anf_block_expr(
                then_block_, externs, ownership, counter)
            let new_else = match else_block {
                some(eb) => {
                    let else_ = eb
                    some(anf_block_expr(
                        else_, externs, ownership, counter))
                },
                none => none,
            }
            hoists.push(HStmt::IfLet { ..stmt, expr: new_expr,
                then_block: new_then, else_block: new_else })
            hoists
        },
        HStmt::Break { .. } | HStmt::Continue { .. } => [stmt],
        // Drop is not present in the input HIR to the ANF pass (perceus runs
        // after); pass it through idempotently if ever seen.
        HStmt::Drop { .. } => [stmt]
    }
}

// A while-cond / match-guard that is evaluated potentially repeatedly (loop
// cond) or in a position where its temps must be self-contained: normalise it,
// and if any temps are produced, wrap them in a Block whose tail is the
// condition value so they are scope-end-dropped at each evaluation (R3).
// (If-conds are one-shot eager operands — they go through anf_operand instead.)
fn anf_cond_in_own_scope(
    cond: HExpr, externs: Set<Str>, ownership: OwnershipMetadata,
    mut counter: AnfState
) -> HExpr {
    let mut hoists: List<HStmt> = []
    let type_input = cond
    let effects_input = cond
    let span_input = cond
    let transform_input = cond
    let result_ty = hexpr_type(type_input)
    let result_effects = hexpr_effects(effects_input)
    let result_span = hexpr_span(span_input)
    let nc = anf_expr(transform_input, hoists, externs, ownership, counter)
    if hoists.len() == 0 {
        nc
    } else {
        HExpr::Block { stmts: hoists, tail: some(nc),
            ty: result_ty, effects: result_effects, span: result_span }
    }
}

// Normalise an lvalue (Assign target): descend into receiver/index subexprs but
// never materialise — a write destination is a place, not an owned value.
fn anf_lvalue(
    expr: HExpr, mut hoists: List<HStmt>, externs: Set<Str>,
    ownership: OwnershipMetadata, mut counter: AnfState
) -> HExpr {
    match expr {
        HExpr::FieldAccess { receiver, .. } => {
            let receiver_ = receiver
            HExpr::FieldAccess { ..expr, receiver: anf_lvalue(
                    receiver_, hoists, externs, ownership, counter) }
        },
        HExpr::IndexExpr { receiver, index, .. } => {
            // The index expression IS a read operand — it can be materialised.
            let receiver_ = receiver
            let index_ = index
            HExpr::IndexExpr { ..expr, receiver: anf_lvalue(
                    receiver_, hoists, externs, ownership, counter),
                index: anf_operand(
                    index_, hoists, externs, ownership, counter) }
        },
        // Ident lvalue (plain variable) — nothing to normalise.
        HExpr::Ident { .. } => expr,
        // Other HExpr variants are unreachable as lvalues.
        _ => expr,
    }
}

// The core expression normaliser.  Recurses into every sub-expression; hoistable
// operand positions go through anf_operand (which may materialise), tail/escape
// positions through anf_tail_value/anf_expr (no top-level materialisation), and
// control-flow branches are normalised structurally (no hoisting across the
// boundary — R2).  `hoists` accumulates `let __anf_N` statements emitted before
// the enclosing statement.
fn anf_expr(
    expr: HExpr, mut hoists: List<HStmt>, externs: Set<Str>,
    ownership: OwnershipMetadata, mut counter: AnfState
) -> HExpr {
    match expr {
        // Leaves — nothing to normalise.
        HExpr::IntLit { .. } | HExpr::FloatLit { .. } |
        HExpr::StrLit { .. } | HExpr::BoolLit { .. } |
        HExpr::Ident { .. } => expr,
        // B-104 D4: a dict construction is a leaf (its inners are DictRefs, not
        // sub-expressions) and is ALWAYS the init of a dict_lower-synthesised
        // `let __ring_dictlocal_N` — already bound, nothing to materialise.
        HExpr::DictConstruct { .. } => expr,

        HExpr::BinOp { op, left, right, .. } => {
            // B-104 D7: `&&`/`||` never reach this pass — andor_lower (checker
            // end) rewrites them to IfExpr, whose branch blocks are their own
            // materialisation scopes (the R2 lazy boundary that
            // anf_cond_in_own_scope used to provide for the RHS here).
            match op {
                BinOp::And => panic("perceus: BinOp::And must be lowered by andor_lower"),
                BinOp::Or => panic("perceus: BinOp::Or must be lowered by andor_lower"),
                _ => {},
            }
            // Eager arithmetic/comparison: both operands always evaluated
            // left→right → materialise fresh-owned operands (R4).
            let left_ = left
            let right_ = right
            let new_left = anf_operand(
                left_, hoists, externs, ownership, counter)
            let new_right = anf_operand(
                right_, hoists, externs, ownership, counter)
            HExpr::BinOp { ..expr, left: new_left, right: new_right }
        },

        HExpr::UnaryOp { operand, .. } => {
            let operand_ = operand
            HExpr::UnaryOp { ..expr, operand: anf_operand(
                    operand_, hoists, externs, ownership, counter) }
        },

        HExpr::Call { callee, callee_def_id, args, .. } => {
            // Borrow/MutBorrow edges keep the historical operand
            // materialisation: the caller owns and later drops any fresh temp.
            // Move edges are escape positions instead.  Their top value must
            // stay inline so a Take/fresh producer transfers directly, while a
            // non-linear projection can be Clone-wrapped exactly once by RC.
            let mut is_method = false
            let callee_ = callee
            let new_callee = match callee_ {
                HExpr::FieldAccess { receiver, field, ty: callee_ty,
                                     effects: callee_effects,
                                     span: callee_span } => {
                    is_method = true
                    let mode = perceus_call_param_mode(
                        ownership, callee_def_id, 0)
                    let receiver_ = receiver
                    let new_receiver = if mode == PARAM_OWNERSHIP_MOVE {
                        anf_tail_value(receiver_, hoists, externs,
                            ownership, counter)
                    } else {
                        anf_operand(receiver_, hoists, externs,
                            ownership, counter)
                    }
                    HExpr::FieldAccess { ..callee_, receiver: new_receiver }
                },
                _ => anf_callee(
                    callee_, hoists, externs, ownership, counter)
            }
            let mut new_args: List<HExpr> = []
            let mut index = 0
            for a in args {
                let arg_ = a
                let descriptor_index = index + if is_method { 1 } else { 0 }
                let mode = perceus_call_param_mode(
                    ownership, callee_def_id, descriptor_index)
                if mode == PARAM_OWNERSHIP_MOVE {
                    new_args.push(anf_tail_value(
                        arg_, hoists, externs, ownership, counter))
                } else {
                    new_args.push(anf_operand(
                        arg_, hoists, externs, ownership, counter))
                }
                index = index + 1
            }
            HExpr::Call { ..expr, callee: new_callee, args: new_args }
        },

        HExpr::FieldAccess { receiver, .. } => {
            // B-104 D1 Stage 2 — RECEIVER position: a FRESH-OWNED receiver
            // (`f(x).method()`, `make().field`, `s.char_at(i).unwrap_or("")`'s
            // char_at Option — the lexer per-char leak) was read in place and
            // never dropped.  Materialise it (anf_operand): `let __anf = f(x);
            // __anf.method()` — scope-end-dropped like any owned binding.
            //
            // SOUNDNESS (why a projection/method result never dangles):
            //   * The projection (FieldAccess/IndexExpr) and every borrow-
            //     returning method result (from exact DefId metadata) are OWNER-
            //     BEARING — any escape of them is Clone-wrapped by rc_escape, so
            //     a binding/sink owns an independent dup before __anf's scope-end
            //     drop runs.  Non-escaping uses are transient borrows consumed
            //     within the statement, strictly before the scope-end drop.
            //   * A borrow tail of a DROPPING block (cond wrappers: while-cond /
            //     guards / &&-RHS) is Clone-wrapped by the rc_block_inner
            //     tail-escape invariant — the one position where a borrow of the
            //     materialised receiver outlives the block's own drops.
            //   * Fresh receivers of Unit-typed mutators (`f(x).push(v)`) are
            //     reclaimed (the receiver-returning ABI result is excluded by
            //     rule ② everywhere).
            //   * Borrow receivers (Ident / FieldAccess chains / non-Str index /
            //     descriptor-Borrowed calls) fail anf_should_materialize and stay
            //     in-place reads — unchanged.
            // Evaluation order preserved: the receiver's hoist precedes the
            // args' hoists (anf_callee runs before the args loop in the Call arm).
            let receiver_ = receiver
            HExpr::FieldAccess { ..expr, receiver: anf_operand(
                    receiver_, hoists, externs, ownership, counter) }
        },

        HExpr::IndexExpr { receiver, index, .. } => {
            // Read: receiver follows the same Stage 2 receiver-position rule as
            // FieldAccess above (`f(x)[0]` materialises f(x); the element read
            // borrows __anf, Clone-wrapped on escape, dropped at scope end);
            // index is a read operand.
            let receiver_ = receiver
            let index_ = index
            HExpr::IndexExpr { ..expr, receiver: anf_operand(
                    receiver_, hoists, externs, ownership, counter),
                index: anf_operand(
                    index_, hoists, externs, ownership, counter) }
        },

        HExpr::StructLit { fields, spread, .. } => {
            // C evaluates the spread source before explicit field values. A
            // fresh source becomes an outer hoist before field hoists. A
            // borrowed source must stay inline and must never acquire an owner
            // Drop, so keep each field's nested hoists in that field's own
            // scope. A source with no reachable value physically prunes fields.
            let mut source_classification = SPREAD_SOURCE_ALL_BORROW
            let new_spread = match spread {
                some(s) => {
                    let spread_ = s
                    source_classification = spread_source_classification(
                        spread_, externs, ownership)
                    some(anf_spread_source(
                        spread_, hoists, externs, ownership, counter))
                },
                none => none,
            }
            // Each field value escapes into the struct → tail/escape position; its
            // OWN nested subexprs hoist, but the field value itself is not
            // materialised (it is stored directly into the struct by the RC pass).
            let mut new_fields: List<HStructFieldInit> = []
            if source_classification !=
                    SPREAD_SOURCE_NO_REACHABLE_VALUE {
                for f in fields {
                    let field_value = f.value
                    let new_value = if source_classification ==
                            SPREAD_SOURCE_ALL_FRESH {
                        anf_tail_value(field_value, hoists, externs,
                            ownership, counter)
                    } else {
                        anf_value_in_own_scope(field_value, externs,
                            ownership, counter)
                    }
                    new_fields.push(HStructFieldInit { ..f,
                        value: new_value })
                }
            }
            HExpr::StructLit { ..expr,
                fields: new_fields, spread: new_spread }
        },

        HExpr::NamedVariantConstruct { fields, spread, .. } => {
            let mut source_classification = SPREAD_SOURCE_ALL_BORROW
            let new_spread = match spread {
                some(s) => {
                    let spread_ = s
                    source_classification = spread_source_classification(
                        spread_, externs, ownership)
                    some(anf_spread_source(
                        spread_, hoists, externs, ownership, counter))
                },
                none => none,
            }
            let mut new_fields: List<HStructFieldInit> = []
            if source_classification !=
                    SPREAD_SOURCE_NO_REACHABLE_VALUE {
                for f in fields {
                    let field_value = f.value
                    let new_value = if source_classification ==
                            SPREAD_SOURCE_ALL_FRESH {
                        anf_tail_value(field_value, hoists, externs,
                            ownership, counter)
                    } else {
                        anf_value_in_own_scope(field_value, externs,
                            ownership, counter)
                    }
                    new_fields.push(HStructFieldInit { ..f,
                        value: new_value })
                }
            }
            HExpr::NamedVariantConstruct { ..expr,
                fields: new_fields, spread: new_spread }
        },

        HExpr::ListLit { elements, .. } => {
            let mut new_elems: List<HExpr> = []
            for e in elements {
                let element_ = e
                new_elems.push(anf_tail_value(
                    element_, hoists, externs, ownership, counter))
            }
            HExpr::ListLit { ..expr, elements: new_elems }
        },

        HExpr::TupleLit { elements, .. } => {
            let mut new_elems: List<HExpr> = []
            for e in elements {
                let element_ = e
                new_elems.push(anf_tail_value(
                    element_, hoists, externs, ownership, counter))
            }
            HExpr::TupleLit { ..expr, elements: new_elems }
        },

        HExpr::RangeExpr { start, end, .. } => {
            let start_ = start
            let end_ = end
            HExpr::RangeExpr { ..expr, start: anf_tail_value(
                    start_, hoists, externs, ownership, counter),
                end: anf_tail_value(
                    end_, hoists, externs, ownership, counter) }
        },

        HExpr::StringInterp { parts, .. } => {
            // Interpolated expressions are read (stringified) operands — materialise
            // each fresh-owned piece so it is reclaimed (the boxed temps that feed
            // string building are a notable Str-leak source).
            let mut new_parts: List<HStringInterpPart> = []
            for p in parts {
                match p {
                    HStringInterpPart::Expression(e) => {
                        let expression_ = e
                        new_parts.push(HStringInterpPart::Expression(anf_operand(
                            expression_, hoists, externs, ownership, counter)))
                    },
                    HStringInterpPart::Literal(_) => {
                        let literal_ = p
                        new_parts.push(literal_)
                    },
                }
            }
            HExpr::StringInterp { ..expr, parts: new_parts }
        },

        HExpr::Block { .. } => {
            // A nested block expression: it is its own scope (R2) — normalise its
            // statements/tail in place; nothing escapes to the outer `hoists`.
            anf_block_expr(expr, externs, ownership, counter)
        },

        HExpr::IfExpr { condition, then_branch, else_branch, .. } => {
            // Condition is ALWAYS evaluated → its temps hoist into the enclosing
            // statement list (R4).  Each branch is its own scope (R2) — branch
            // values are materialised inside the branch block, never lifted out.
            let condition_ = condition
            let then_branch_ = then_branch
            let new_cond = anf_operand(
                condition_, hoists, externs, ownership, counter)
            let new_then = anf_block_expr(
                then_branch_, externs, ownership, counter)
            let new_else = match else_branch {
                some(eb) => {
                    let else_ = eb
                    some(anf_block_expr(
                        else_, externs, ownership, counter))
                },
                none => none,
            }
            HExpr::IfExpr { ..expr, condition: new_cond,
                then_branch: new_then, else_branch: new_else }
        },

        HExpr::MatchExpr { scrutinee, arms, .. } => {
            // B-104 W2: materialise a FRESH-OWNED scrutinee (`match map.get(k) {…}`,
            // `match find(…) {…}` — the dominant residual OPTION leak: fresh Option
            // temporaries read once by the match and never dropped).  anf_operand
            // hoists `let __anf = <scrutinee>` before the enclosing statement, so the
            // RC pass scope-end-drops it.  Only fresh-owned scrutinees materialise
            // (anf_should_materialize): an Ident / FieldAccess / IndexExpr scrutinee is
            // a borrow and stays inline.
            //
            // SOUND WITHOUT match-arm return-value analysis — the earlier `_ => scrut`
            // double-free fear is already neutralised by clone-all-escape.  When the
            // match is in escape position, EACH arm tail is rc_escape'd individually:
            // an arm that returns the scrutinee (`x => x`), a pattern binding (`some(v)
            // => v`, a borrow projection of the scrutinee's interior), or any owner-
            // bearing projection is Clone-wrapped (ring_dup) → the result binding owns
            // a FRESH dup, and the scrutinee's scope-end Drop releases the original —
            // balanced (rc bumped before either drop, drop order-independent).  When
            // the match is NOT in escape position (statement / borrow arg), arm tails
            // are borrows and nothing else takes ownership, so the scrutinee's single
            // scope-end Drop is still balanced.  Same Clone-wrap balance that makes
            // W1's unwrap_or arg safe.  A match never MOVES the scrutinee out
            // un-dup'd — arm tails always route through rc_escape, which Clones
            // owner-bearing returns.  ASan-verified
            // (real_program matches + self-compile).
            // Arm bodies + guards are their own scopes (R2).
            let scrutinee_ = scrutinee
            let new_scrutinee = anf_operand(
                scrutinee_, hoists, externs, ownership, counter)
            let mut new_arms: List<HMatchArm> = []
            for arm in arms {
                let new_guard = match arm.guard {
                    some(g) => {
                        let guard_ = g
                        some(anf_cond_in_own_scope(
                            guard_, externs, ownership, counter))
                    },
                    none => none,
                }
                let arm_body = arm.body
                let new_body = anf_block_expr(
                    arm_body, externs, ownership, counter)
                new_arms.push(HMatchArm { ..arm,
                    guard: new_guard, body: new_body })
            }
            HExpr::MatchExpr { ..expr,
                scrutinee: new_scrutinee, arms: new_arms }
        },

        HExpr::TryCatch { body, arms, .. } => {
            // body + catch arms are their own scopes (R2); abort-path RC is out of
            // scope (B-002).
            let body_ = body
            let new_body = anf_block_expr(body_, externs, ownership, counter)
            let mut new_arms: List<HMatchArm> = []
            for arm in arms {
                let new_guard = match arm.guard {
                    some(g) => {
                        let guard_ = g
                        some(anf_cond_in_own_scope(
                            guard_, externs, ownership, counter))
                    },
                    none => none,
                }
                let arm_body = arm.body
                let new_body_arm = anf_block_expr(
                    arm_body, externs, ownership, counter)
                new_arms.push(HMatchArm { ..arm,
                    guard: new_guard, body: new_body_arm })
            }
            HExpr::TryCatch { ..expr, body: new_body, arms: new_arms }
        },

        HExpr::HandleExpr { body, handlers, .. } => {
            let body_ = body
            let new_body = anf_block_expr(body_, externs, ownership, counter)
            let mut new_handlers: List<HEffectHandler> = []
            for h in handlers {
                let handler_body = h.body
                let h_body = anf_block_expr(
                    handler_body, externs, ownership, counter)
                new_handlers.push(HEffectHandler { ..h, body: h_body })
            }
            HExpr::HandleExpr { ..expr,
                body: new_body, handlers: new_handlers }
        },

        HExpr::Lambda { body, .. } => {
            // The lambda body is its own function scope.  Captures are dup'd by
            // gen_lambda; perceus handles the body.  Normalise the body in place.
            let body_ = body
            HExpr::Lambda { ..expr,
                body: anf_block_expr(body_, externs, ownership, counter) }
        },

        HExpr::EffectOp { args, .. } => {
            // B-104 D1 Stage 2 — EFFECT-OP ARG position (closes the W1-era
            // conservative hold-out).  Args are BORROW-passed to the handler
            // closure (gen_effect_op → gen_closure_call; closure params are
            // never dropped by the callee), so a fresh-owned arg had no owner
            // and leaked.  Materialise + scope-end-drop is SOUND here, unlike
            // the old fear of "handler returns an arg verbatim":
            //   * a TAIL-RESUMPTIVE handler arm is transformed with
            //     rc_block_root(escape=true) — an arm returning its parameter
            //     (`Echo.echo(s) => s`) has the tail Clone-wrapped at the
            //     escape, so the op's result is an independent dup, balancing
            //     the materialised arg's scope-end drop (the same Clone-wrap
            //     balance as W1's unwrap_or and the W2 scrutinee).  A handler
            //     STORING an arg likewise Clones at the escape.
            //   * an ABORT op (fail.raise → ring_raise, longjmp) never returns:
            //     the materialised __anf's scope-end drop is skipped by the
            //     longjmp → leak, not UAF — identical to the pre-existing
            //     abort-path posture (B-002); the catch arm's projections of
            //     the raised value stay valid (the owner binding is simply
            //     never released).
            let mut new_args: List<HExpr> = []
            for a in args {
                let arg_ = a
                new_args.push(anf_operand(
                    arg_, hoists, externs, ownership, counter))
            }
            HExpr::EffectOp { ..expr, args: new_args }
        },

        // Ownership planning may insert the unique dup proof before ANF.  The
        // proof node stays in place, while its borrowed inner is still fully
        // normalised (including any required operand hoists).
        HExpr::Clone { inner, .. } => {
            let inner_ = inner
            HExpr::Clone { ..expr, inner: anf_expr(
                inner_, hoists, externs, ownership, counter) }
        },

        // Ownership planning precedes ANF. Take is already one atomic
        // materialising read/clear operation and must not be split or cloned.
        HExpr::Take { .. } => expr,

        // B-113: return in expression position (match arm).
        // Normalise the return value as a tail value (same as HStmt::Return in anf_stmt).
        HExpr::ReturnExpr { value, .. } => match value {
            some(v) => {
                let value_ = v
                let new_v = anf_tail_value(
                    value_, hoists, externs, ownership, counter)
                HExpr::ReturnExpr { ..expr, value: some(new_v) }
            },
            none => expr,
        },
        // B-125: unsafe block — transparent, normalise the body
        HExpr::UnsafeBlock { body, .. } => {
            let body_ = body
            HExpr::UnsafeBlock { ..expr, body: anf_block_expr(
                    body_, externs, ownership, counter) }
        },
    }
}

// Normalise a callee expression. Ordinary Ident/FieldAccess callees are borrow
// reads, but a checker-marked wrapper (including a dynamic-dict Block wrapper)
// and any other provably fresh callee Call must be materialised so the closure
// pair/env is scope-end-dropped after the immediate invocation.
fn anf_callee(
    callee: HExpr, mut hoists: List<HStmt>, externs: Set<Str>,
    ownership: OwnershipMetadata, mut counter: AnfState
) -> HExpr {
    let normalized = anf_borrow(
        callee, hoists, externs, ownership, counter)
    if is_materializable_fn_value(normalized, externs, ownership) ||
       anf_should_materialize(normalized, externs, ownership) {
        anf_materialize(normalized, hoists, counter)
    } else {
        normalized
    }
}

// Normalise an expression on the residual NO-MATERIALISE path: recurse into its
// subexprs (which still hoist their own fresh operands), but NEVER materialise
// the top expression. Since B-104 D1 Stage 2 (receiver positions now go through
// anf_operand — see the FieldAccess/IndexExpr arms) this helper first normalises:
//   * the CALLEE expression itself; anf_callee then materialises a fresh Call or
//     checker-marked wrapper while leaving Ident/method borrows in place;
//   * a STRUCT/VARIANT SPREAD source: the dedicated spread ANF path first proves
//     one uniform source class. Fresh sources are materialised exactly once and
//     scope-dropped after codegen duplicates uncovered fields; direct borrowed
//     sources remain unowned reads. Mixed/unknown control flow is rejected by
//     ownership before normal Perceus entry.
fn anf_borrow(
    expr: HExpr, mut hoists: List<HStmt>, externs: Set<Str>,
    ownership: OwnershipMetadata, mut counter: AnfState
) -> HExpr {
    let expr_ = expr
    anf_expr(expr_, hoists, externs, ownership, counter)
}

fn transform_decls(
    decls: List<HDecl>, boxed: Set<Int>, externs: Set<Str>,
    drop_types: OwnershipMetadata, mut gensym: RcState
) -> List<HDecl> {
    let mut result: List<HDecl> = []
    for d in decls {
        let decl_ = d
        result.push(transform_decl(
            decl_, boxed, externs, drop_types, gensym))
    }
    result
}

fn transform_decl(
    decl: HDecl, boxed: Set<Int>, externs: Set<Str>,
    drop_types: OwnershipMetadata, mut gensym: RcState
) -> HDecl {
    match decl {
        HDecl::Fn { params, body, .. } => {
            let params_ = params
            let body_ = body
            let new_body = transform_fn_body(
                params_, body_, boxed, externs, drop_types, gensym)
            HDecl::Fn { ..decl, body: new_body }
        },
        HDecl::Impl { methods, .. } => {
            let methods_ = methods
            let new_methods = transform_decls(
                methods_, boxed, externs, drop_types, gensym)
            HDecl::Impl { ..decl, methods: new_methods }
        },
        HDecl::Test { body, .. } => {
            // Transform test bodies as parameterless functions
            let body_ = body
            let new_body = transform_fn_body(
                [], body_, boxed, externs, drop_types, gensym)
            HDecl::Test { ..decl, body: new_body }
        },
        HDecl::Const { init, .. } => {
            // B-098: the const owns its value → the initialiser is in escape
            // position, with an empty enclosing owned scope (no locals at top level).
            let owned: List<OwnedSlot> = []
            let init_ = init
            let new_init = rc_escape(
                init_, owned, boxed, externs, drop_types, gensym, 0 - 1)
            HDecl::Const { ..decl, init: new_init }
        },
        HDecl::ModBlock { decls: mod_decls, .. } => {
            let decls_ = mod_decls
            HDecl::ModBlock { ..decl,
                decls: transform_decls(decls_, boxed, externs,
                    drop_types, gensym) }
        },
        // Non-function declarations pass through unchanged
        HDecl::Struct { .. } => decl,
        HDecl::Enum { .. } => decl,
        HDecl::Effect { ops, .. } => {
            let mut new_ops: List<HEffectOp> = []
            for op in ops {
                let new_default_body = match op.default_body {
                    some(body) => {
                        let params_ = op.params
                        let body_ = body
                        some(transform_fn_body(
                            params_, body_, boxed, externs,
                            drop_types, gensym))
                    },
                    none => none,
                }
                new_ops.push(HEffectOp { ..op,
                    default_body: new_default_body })
            }
            HDecl::Effect { ..decl, ops: new_ops }
        },
        HDecl::Trait { .. } => decl,
        HDecl::ExternFn { .. } => decl,
        HDecl::ExternType { .. } => decl,
        HDecl::TypeAlias { .. } => decl,
        HDecl::Sig { .. } => decl,
    }
}

// ============================================================
// B-098: L1 borrow-inference engine (clone-all-escape model)
// Reference: Koka Perceus (POPL'21) borrowing extension, conservative variant.
//
// Replaces the L0 always-own + backward-liveness + branch-balancing model.  The
// new model (design.md §7.11):
//   1. READS BORROW — a read (Ident / field / index / container .get) does NOT
//      ring_dup; codegen returns the bare (borrowed) pointer.
//   2. ESCAPE = CLONE-OR-MOVE — at an escape point (a sink that takes ownership:
//      container push, struct/variant field, list/tuple element, return /
//      function tail, let initialiser, closure capture) the escaping value is:
//        * wrapped in HExpr::Clone if it has an INDEPENDENT OWNER (Ident binding /
//          FieldAccess / IndexExpr / container .get — the source still owns its
//          reference), giving the sink its own owned reference; or
//        * left as-is (MOVE) if it is a FRESH TEMPORARY (call result / literal /
//          struct/variant construction / binop / closure / fresh container), the
//          sink becoming the sole owner.
//   3. SCOPE-END-DROP-ONCE — every owned local binding is dropped exactly once at
//      the end of the block that defines it (the normal fall-through path).  An
//      explicit `return` clones its value (if owner-bearing) and then drops every
//      owned local in scope; the block-end drops on that path are unreachable
//      (return diverges), so there is no double-free.  NO per-path branch
//      balancing — branches only READ outer locals (borrow), so the outer local
//      drops exactly once at the outer block end regardless of which branch ran.
//      This is what eliminates the #134 loop/conditional-move double-free at the
//      root: a binding is never consumed per-path, so there is no imbalance to
//      "balance" with spurious drops.
//   4. ALL PARAMETERS BORROW — the callee never drops a parameter; a parameter
//      that escapes is cloned (the caller retains ownership).  move-parameter
//      inference (§7.3) is a pure optimisation, deferred.
//   5. NO last-use → move (deferred to L3 reuse): even a last-use owner-bearing
//      escape is cloned then scope-end-dropped.  More churn than a perfect
//      analysis, but fewer dups than always-own (reads ≫ escapes) and crash-free.
//
// `owned` (List<OwnedSlot>): exact owned bindings currently in scope, in
// definition order (outermost block first). Threaded by value so siblings do
// not share scope state. DefId keeps same-spelled shadows as distinct cleanup
// slots; a return drops the full visible set in reverse order. Range iteration
// slots are included with backend_loop_cleanup=true: only break/return emit their
// HIR Drop, because normal/continue reach the backend increment-label cleanup.
// ============================================================

struct OwnedSlot {
    name: Str,
    def_id: Int,
    // Range iteration slots are real per-iteration owners, but normal and
    // continue edges are cleaned by the backend increment block. Perceus only
    // emits their cleanup on edges that skip that block (break/return).
    backend_loop_cleanup: Bool
}

fn owned_slot_equal(a: OwnedSlot, b: OwnedSlot) -> Bool {
    a.def_id == b.def_id
}

fn owned_contains(slots: List<OwnedSlot>, candidate: OwnedSlot) -> Bool {
    for slot in slots {
        if owned_slot_equal(slot, candidate) { return true }
    }
    false
}

fn owned_find_def_id(slots: List<OwnedSlot>, def_id: Int) -> OwnedSlot? {
    for slot in slots {
        if slot.def_id == def_id {
            let found = slot
            return some(found)
        }
    }
    none
}

fn transform_fn_body(
    params: List<HParam>, body: HExpr, boxed: Set<Int>,
    externs: Set<Str>, drop_types: OwnershipMetadata,
    mut gensym: RcState
) -> HExpr {
    // Borrow/MutBorrow parameters remain caller-owned. Move parameters are
    // callee-owned slots and therefore enter the same reverse-order cleanup
    // account as locals; an explicit Take clears the slot before that cleanup.
    let mut owned: List<OwnedSlot> = []
    for param in params {
        if hparam_ownership(param) == PARAM_OWNERSHIP_MOVE &&
           !hparam_is_external_drop_owner(param) &&
           type_is_physical_rc_eligible(param.ty, externs) &&
           !rc_name_skippable(param.name) {
            let def_id = match param.def_id {
                some(id) => id,
                none => panic(
                    "unreachable: Move parameter has no cleanup DefId")
            }
            let param_name = param.name
            owned.push(OwnedSlot { name: param_name, def_id: def_id,
                backend_loop_cleanup: false })
        }
    }
    // One program-global traversal counter supplies both an unspellable name
    // and a disjoint negative DefId for every RC hoist.
    // loop_base = -1: not inside a loop (break/continue cannot occur).
    let transformed = rc_block_root(
        body, true, owned, boxed, externs, drop_types, gensym, 0 - 1)
    add_fn_param_cleanup(transformed, owned, drop_types, gensym)
}

fn add_fn_param_cleanup(
    body: HExpr, owned_params: List<OwnedSlot>,
    drop_types: OwnershipMetadata, mut gensym: RcState
) -> HExpr {
    if owned_params.len() == 0 { return body }
    let fallback_ty = hexpr_type(body)
    let fallback_effects = hexpr_effects(body)
    let fallback_span = hexpr_span(body)
    let (stmts, tail, ty, effects, span) = match body {
        HExpr::Block { stmts, tail, ty, effects, span } => {
            let stmts_ = stmts
            let tail_ = tail
            let ty_ = ty
            let effects_ = effects
            let span_ = span
            (stmts_, tail_, ty_, effects_, span_)
        },
        _ => ([], some(body), fallback_ty, fallback_effects, fallback_span)
    }
    if block_diverges(stmts, tail) {
        let result_stmts = stmts
        let result_tail = tail
        let result_ty = ty
        let result_effects = effects
        let result_span = span
        return HExpr::Block { stmts: result_stmts, tail: result_tail,
            ty: result_ty, effects: result_effects, span: result_span }
    }
    let mut final_stmts = stmts
    match tail {
        some(value) => {
            let (tmp, tmp_def_id) = fresh_scope_tmp(gensym)
            record_rc_callable_projection(value, tmp_def_id, gensym)
            let value_ty = hexpr_type(value)
            let value_effects = hexpr_effects(value)
            let value_span = hexpr_span(value)
            let binding_name = tmp
            let result_name = tmp
            let binding_def_id = tmp_def_id
            let result_def_id = tmp_def_id
            let binding_ty = value_ty
            let result_value_ty = value_ty
            let value_ = value
            final_stmts.push(HStmt::Let { name: binding_name,
                name_span: synthetic_span(), def_id: some(binding_def_id),
                ty: binding_ty, init: value_, span: synthetic_span() })
            for drop_stmt in drops_for(owned_params) {
                let cleanup = drop_stmt
                final_stmts.push(cleanup)
            }
            let result_ty = ty
            let result_effects = effects
            let result_span = span
            HExpr::Block { stmts: final_stmts,
                tail: some(HExpr::Ident { name: result_name,
                    resolved_name: none, def_id: some(result_def_id),
                    dict_closure_dicts: none, ty: result_value_ty,
                    effects: value_effects, span: value_span }),
                ty: result_ty, effects: result_effects, span: result_span }
        },
        none => {
            for drop_stmt in drops_for(owned_params) {
                let cleanup = drop_stmt
                final_stmts.push(cleanup)
            }
            let result_ty = ty
            let result_effects = effects
            let result_span = span
            HExpr::Block { stmts: final_stmts, tail: none,
                ty: result_ty, effects: result_effects, span: result_span }
        }
    }
}

// hexpr_effects is imported from hir

// ============================================================
// Owner classification (clone-all-escape)
// ============================================================
//
// A value "has an independent owner" — i.e. the source still holds a reference
// after this value is produced — exactly when it is a READ of an existing owned
// location: an Ident binding, a FieldAccess / IndexExpr projection, or a
// container-element read (.get).  These all alias a reference owned elsewhere,
// so escaping them needs a Clone (the runtime read returns a BORROW after the
// always-own dup is reverted).  Everything else is a FRESH TEMPORARY (call
// result, literal, struct/variant construction, binop, range, fresh container,
// closure, string-interp, .values()/.entries() which build owned containers):
// it has no other owner, so the sink moves it in (no clone — cloning would leak).
fn is_owner_bearing(
    expr: HExpr, ownership: OwnershipMetadata
) -> Bool {
    // Module callable markers are productions, not reads: evaluating them
    // allocates a fresh {thunk, env} pair. Clone-wrapping would dup the fresh
    // pair and strand its original construction reference.
    if is_materialized_fn_value(expr) {
        return false
    }
    let nullary_variant_ctor = is_nullary_variant_ctor_ident(expr)
    let option_none_ctor = is_option_none_ctor_ident(expr)
    match expr {
        // Ordinary identifiers read an existing owner.  A fieldless variant is
        // the one Ident-shaped exception: codegen calls a constructor, so the
        // result is fresh and must move without an escape Clone. Option::none
        // is the second exception: its exact constructor Ident evaluates to an
        // immortal singleton, outside the physical RC account.
        HExpr::Ident { .. } =>
            nullary_variant_ctor == false && option_none_ctor == false,
        HExpr::FieldAccess { .. } => true,
        // B-104 D1 rule ③: `s[i]` on a Str is NOT owner-bearing — ring_str_get
        // returns a FRESH 1-char string (new ring_alloc, verified), so an escape
        // MOVES it (the sink becomes sole owner; Clone-wrapping would dup the
        // fresh string and leak the original, the pre-rule behaviour).  List/Map
        // indexing returns a borrowed element pointer → owner-bearing (escape
        // Clones) as before.
        HExpr::IndexExpr { receiver, .. } => is_str_index(receiver) == false,
        HExpr::Call { callee_def_id, .. } =>
            call_returns_borrowed(ownership, callee_def_id),
        _ => false,
    }
}

// A method call whose result is a BORROW of (an inner reference of) its receiver
// or an argument, returned WITHOUT a dup by the runtime — so escaping it needs a
// Clone, AND scope-end-dropping its binding would free a reference owned elsewhere.
//
// ═════════════════════════════════════════════════════════════════════════════
// B-103 COMPLETE ring_runtime.cpp RETURN-MODE CLASSIFICATION (2026-06-11)
// ═════════════════════════════════════════════════════════════════════════════
// Total enumeration of every extern "C" function in ring_runtime.cpp by return
// mode, with the source evidence (does the body alloc/dup before returning?).
// This table is THE drop-decision foundation for the B-104 D1 total drop pass:
// a temporary is droppable iff its producer is FRESH; a BORROW producer's result
// must never be dropped un-Cloned.  Four modes:
//   FRESH    — returns a pointer freshly ring_alloc'd (or with element/payload
//              ownership transferred/dup'd in).  Caller solely owns it.
//   BORROW   — returns a pointer INTO an argument/receiver (or the arg itself)
//              without a dup.  Caller owns nothing.
//   SCALAR   — returns i64/double/void: no RC meaning.
//   NULL/NEVER — returns nullptr (ring_drop(null) is a no-op → RC-inert) or
//              never returns (exit/panic/longjmp).
//
// ── BORROW returners (every one MUST have an exact builtin DefId descriptor, by
//    is_owner_bearing's Ident/FieldAccess/IndexExpr arms, or — for the
//    Unit-typed receiver-returning mutators — by the D1 rule ② type-level
//    Unit exclusion) ─────────────────────────────────────────────────────────
//   ring_Option_unwrap        .unwrap          → Some payload slot (no dup).
//   ring_Option_unwrap_or     .unwrap_or       → payload slot, or the `default`
//                                                ARGUMENT verbatim on None.
//   ring_Option_to_fail       .to_fail         → payload slot (None raises).
//   ring_list_get             list[i] / tuple .0 / for-in   → element ptr, no dup
//                             (HIR: IndexExpr / tuple FieldAccess — covered by
//                              is_owner_bearing's IndexExpr/FieldAccess arms, NOT
//                              by a field name here).
//   RECEIVER-RETURNING MUTATORS (B-103 Wave A → B-104 D1 rule ② re-mechanised):
//   each returns its RECEIVER (arg 0) verbatim — `return list;` / `return sb;`
//   — no dup.  Pure Ring Map/Set mutators also return Unit.  At
//   the LLVM ABI the result IS the live container, so a `let x = xs.push(v)`
//   binding scope-end-dropped would free the caller's container → UAF.
//   B-103 guarded this by LISTING the 9 field names below in this predicate
//   (Clone-wrap balanced the drop) — at a leak-side cost: a USER method sharing
//   a listed name but returning a real fresh value got Clone-wrapped (leak),
//   and a fn-tail mutator result's Clone dup-pinned the receiver.  D1 rule ②
//   (2026-06-11 user decision) replaces the name grain with the TYPE-level
//   Unit rule: every one of these calls is Unit-typed (all relevant std declarations
//   verified `-> Unit`: List.push/extend/clear/set, Map.insert/remove/clear,
//   Set.insert/remove/clear, SB.add/line/add_int), and Unit-typed values are
//   excluded from Clone (rc_escape), Drop/owned (is_droppable_init) and
//   materialisation (anf_should_materialize) — so the binding holds the raw
//   receiver pointer and never drops it: same UAF protection, zero churn, and
//   user methods with these names are no longer misclassified.  The names are
//   therefore REMOVED from the predicate; the ABI evidence stays recorded here
//   (D1's total pass must keep treating their results as non-droppable, which
//   the Unit type rule does for every position).
//   Residual (accepted, see worker_feedback): a Unit value flowing into an RC
//   SINK (`[xs.push(v)]` — a List<Unit>) would store the receiver un-dup'd and
//   the sink's drop would free it; pathological, not expressible in real code
//   paths today.  The principled long-term fix is codegen emitting null for
//   Unit-typed values instead of the receiver-return ABI accident.
//     .push    ring_list_push                  → `return list;`
//     .set     ring_list_set                   → `return list;`
//     .insert  Map.insert / Set.insert → Unit (pure Ring methods mutate their
//              Map-backed receiver)
//     .remove  Map.remove / Set.remove → Unit (pure Ring)
//     .add     ring_sb_add                     → `return sb;`
//     .clear   ring_list_clear / Map.clear / Set.clear → Unit or receiver per
//              the type-level rule
//     .extend  ring_list_extend                → `return list;` (the OTHER list's
//              elements are dup'd inside the runtime — B-102 layer 5)
//     .line / .add_int  ring_sb_line / ring_sb_add_int → `return sb;`
//              (currently unmapped in method_to_runtime — native panic-stub, see
//              audit-report — but std/str.ring declares them; classified now so
//              the mapping fix cannot reopen a UAF.)
//   ring_catch_get_error — returns the raised error ptr held by the frame
//              (codegen-internal: catch lowering only; never an HIR call).
//
// ── FRESH returners (safe to drop; is_droppable_init(Call)=true reclaims) ─────
//   Str ops (alloc a new std::string block): ring_str_new / from_cstr / concat /
//     slice / split (fresh list of fresh strs) / join / replace / trim /
//     trim_start / trim_end / to_upper / to_lower / pad_start / pad_end / repeat
//     / ring_int_to_str / float_to_str / bool_to_str / ring_str_get (str[i]
//     allocs a NEW 1-char string — FRESH; classified per-receiver by D1 rule ③:
//     is_owner_bearing / anf_should_materialize special-case Str-receiver
//     IndexExpr as fresh, see is_str_index) / ring_list_join /
//     ring_cwd / ring_read_file / ring_path_join / resolve
//     / dirname / basename / extname.
//   Option builders (fresh 2-slot block; payload dup'd or ownership-transferred):
//     ring_list_get_opt and pure Ring Map.get (dup payload),
//     ring_list_first / last / find (dup payload — B-103), ring_list_find_index /
//     ring_str_char_at / char_code_at / index_of / last_index_of / ring_parse_int
//     / parse_float (fresh boxed payload), ring_list_pop / shift (payload
//     OWNERSHIP TRANSFERRED out of the vector — vec erases its ref, no dup
//     needed), ring_Option_map (wraps the closure's owned result),
//     ring_Option_unwrap_or_else (Some duplicates the payload; None forwards
//     the callback's owned result, so both paths satisfy Owned).
//   Container builders: ring_list_new / pure Ring map_new / set_new /
//     sb_new / ring_args / pure Ring Map keys/values/entries
//     (ring_slot_read duplicates elements) / pure Ring Set to_list/from_list /
//     union/intersect/difference/clone (implemented through Map/List ownership
//     paths) / ring_list_clone / pure Ring map_clone (dup elements/values — B-103 /
//     #135) / ring_list_map (owns closure results) / ring_list_filter / concat /
//     slice / reverse / sort / sort_default / flat_map / pure Ring map_from
//     (dup shared elements/values — B-103 Wave A: these copied
//     source-owned pointers into the fresh container WITHOUT a dup, so dropping
//     both source and result deep-dropped the same elements → latent double-free,
//     masked only while the leak régime never dropped the source) / ring_sb_to_str.
//   Boxers (codegen-internal): ring_box_int / box_float / box_bool, the Eq/Ord
//     dict closure shims ring_cl_eq_* / cl_ne_* / cl_cmp_* (fresh boxed results),
//     ring_file_exists (fresh bool box), ring_alloc itself, ring_catch_push
//     (codegen-internal).
//   ring_get_builtin_dict — B-104 D4 re-annotation (was: "fresh TUPLE dict of
//     fresh closures", the #151 per-call-site leak class): now allocates a
//     never-drop DICT_STATIC singleton and is reachable ONLY from the
//     codegen's memoised getters (ring_dict_init_<name>) — at most one
//     execution per dict name per process.  Never an HIR-visible call; no
//     perceus classification applies.
//   ring_try — returns the body/catch closure's result (owned by Ring-fn
//     convention).  HIR surface = TryCatch, conservatively excluded from
//     is_droppable_init (abort-path aliasing, B-002).
//
// ── SCALAR returners (i64/double — no RC meaning) ─────────────────────────────
//   ring_unbox_int / unbox_float / unbox_bool (codegen-internal; HIR never sees
//   an "unbox call" — unboxing is emitted inside arith/compare/cond lowering),
//   ring_str_len / eq / lt / contains / starts_with / ends_with / is_empty,
//   ring_list_len / contains / index_of / is_empty / any / all,
//   ring_sb_len, ring_Option_is_some / is_none.  Map/Set scalar results are
//   pure Ring calls.
//
// ── NULL / NEVER returners (RC-inert: ring_drop(null) is a no-op) ─────────────
//   null:  ring_print / eprintln / write_file / delete_file / assert /
//          ring_list_for_each.  Set.for_each is pure Ring.
//   never: ring_panic / exit / match_fail / ring_raise / __ring_raise_fail
//          (longjmp/exit).
//   void:  ring_dup / drop / register_drop / register_never_drop / runtime_init /
//          ring_catch_pop (codegen-internal plumbing).
//
// ── Static (not extern, runtime-internal only) ────────────────────────────────
//   ring_enum_some / enum_none (FRESH; HIR surface = variant-ctor call, whose
//   ownership edges are explicit Take nodes), ring_make_closure /
//   make_eq_dict / make_ord_dict (FRESH, dict plumbing), drop_* destructors.
//
// NOTE: `.get()` is NOT here — list.get / map.get build a FRESH owned Option
// (ring_*_get_opt, which ring_dup's the element into the Option), so their result
// is a fresh owned temporary, not a borrow.  `.first` / `.last` (B-103: now
// ring_dup in ring_list_first/last) and `.values()` / `.entries()` / `.keys()` /
// `.pop` / `.shift` likewise build FRESH owned containers — not borrows.
//
// Safety is exact-identity keyed: builtin registration records these modes on
// their DefIds, while same-spelled user methods keep their independently solved
// Owned/Borrowed result descriptor. Missing metadata fails loudly before RC.
//
// ⚠️ THE PREDICATE ITSELF NOW LIVES IN hir.ring (B-104 D1 Stage 2): the LLVM
// codegen's condition-box drops (emit_while / match-guard post-unbox,
// is_fresh_owned_bool_value) need the same classification, and cross-stage
// contracts belong in hir.ring.  THIS TABLE REMAINS THE EVIDENCE RECORD —
// update it together with the builtin descriptors consumed by
// hir.call_returns_borrowed.

// B-104 W1 arg-returning classification (is_arg_returning_call, sole member
// `fold`) — RETIRED 2026-06-12 (B-104 D1 Stage 3, audit #150).  ring_list_fold
// now dups `init` on the empty-list path, so no runtime callee returns an
// argument verbatim with a MOVED result any more: every call result is OWNED
// on every path, all call args materialise (anf_operand), and the anf_arg
// conservative mechanism is deleted.  The B-103 completeness audit's two exempt
// classes stand unchanged (descriptor-Borrowed projections balance via escape
// Clone; receiver-returning mutators are excluded type-level by
// D1 rule ②), and Ring-level functions still always return OWNED
// (clone-all-escape, the B-103 "no fixpoint needed" theorem).  Decision record:
// design.md appendix decision table「fold 空表 verbatim-init 修复方向」; full
// pre-retirement evidence text: git history (this block, pre-2026-06-12).

// ─────────────────────────────────────────────────────────────────────────────
// B-101 DEAD ROAD (Wave A,证伪 2026-06-05) — DO NOT re-introduce a function-level
// drop-WHITELIST for the substitution family.  Recorded here so the trap is not
// re-dug.
//
// The tempting fix for the apply_subst-family LEAK (§7.11-correction-#2: "Call
// result conservatively not dropped") is a DUAL of exact return descriptors: a
// whitelist of calls whose result is a FRESH, UNSHARED owned value, safe to
// scope-end-drop.  Wave A proved this whitelist must be EMPTY:
//   - apply_subst / apply_subst_map (env.ring): scalar `=> t` arms and the
//     unresolved-TypeVar `if root == id { t }` arm return the INPUT verbatim
//     (alias); StructType `{ fields: fields }` / EnumType `{ variants: variants }`
//     reuse the input's substructure (alias); ErrorType `=> t` aliases.
//   - apply_subst_row / apply_subst_effect(_map): `_ => e` passes the input
//     Effect through (alias of an element).
//   - zonk_type / zonk_row: wrap apply_subst + label_vars, same passthroughs.
// Type tree is a deliberately-shared IMMUTABLE DAG, so NO function-level grain can
// certify "every arm fresh".  Mis-listing → drop of live shared state → UAF/CRASH;
// omitting → leak.
//
// B-102 R-clean (2026-06-07) — the substitution aliasing is resolved NOT by a
// call-level whitelist but by clone-all-escape itself: each place that stores an
// EXISTING Type substructure into a freshly-built Type is an escape position, so
// rc_escape Clone-wraps it (ring_dup).  A scalar `=> t` return aliases the
// borrowed param `t`, but `t` is in TAIL (escape) position → rc_escape Clones it,
// so the caller's `let x = apply_subst(...)` owns a fresh dup, balanced by the
// scope-end drop_T.  StructType `{ fields: fields }` Clone-wraps `fields` (a
// borrowed List<StructField>): the new Type owns its own shallow reference,
// released by the recursive drop_T symmetrically.  No function-level escape
// analysis, no never-drop special case — Type is ordinary RC'd data again.
//
// B-103 (2026-06-07) — the ban above still holds (no per-call FRESH-vs-aliased
// whitelist), but is_droppable_init's Call arm now returns `true` UNIVERSALLY, not
// just for descriptor-Borrowed calls. This is sound WITHOUT a whitelist precisely because
// of the clone-all-escape reasoning above: every apply_subst-family return value
// reaches its caller's `let x = ...` already Clone-wrapped (the aliased arm's value
// is in tail/escape position → rc_escape Clones it), so `x` owns a FRESH dup,
// safely released by the scope-end drop_T.  The flood of 167 `let x = apply_subst`
// bindings is thereby reclaimed (G-a memory gate) with no function-grain analysis.
// ─────────────────────────────────────────────────────────────────────────────

// Wrap an escaping expression: clone it iff it has an independent owner; the
// inner expression is processed in VALUE (borrow) position so its own reads do
// not clone.  Carries inner's type/effects/span on the Clone node.
fn rc_escape(expr: HExpr, owned: List<OwnedSlot>, boxed: Set<Int>, externs: Set<Str>, drop_types: OwnershipMetadata, mut gensym: RcState, loop_base: Int) -> HExpr {
    // B-102 R-clean: Type-DAG values participate in normal clone-all-escape RC —
    // an escaping owner-bearing Type substructure is Clone-wrapped (ring_dup) so
    // the new parent Type owns its own (shallow) reference, symmetric with the
    // recursive drop_T that releases it.  (A1's never-drop special case is removed.)
    //
    // B-104 D1 rule ① (audit #139) + rule ② (Unit), both TYPE-level:
    //   ① a direct extern handle OR a value containing one never Clones. A
    //     direct ring_dup would touch foreign memory; cloning a container would
    //     manufacture another owner whose eventual deep Drop reaches its raw
    //     payload. Both therefore escape without physical RC work.
    //   ② a Unit-typed value never Clones — Unit has no value semantics, and at
    //     the LLVM ABI a Unit-typed mutator call result IS the receiver
    //     (`return list;`), so Cloning it ring_dup-pins the caller's container
    //     (the B-103 leak-side cost this rule eliminates).  MOVE instead; the
    //     binding/sink is RC-inert because Unit is excluded from droppability
    //     and materialisation everywhere (is_rc_excluded_type).
    //
    // Take is the sole move proof. It already carries an owned value and clears
    // its exact source slot in native lowering, so cloning it would duplicate a
    // linear resource and violate the callable contract.
    match expr {
        HExpr::Clone { ty, .. } => {
            if type_may_own(drop_types, ty) {
                panic("unreachable: Perceus received owner-bearing HExpr::Clone")
            }
            // Ownership planning may already have materialised a non-linear
            // borrowed escape.  Clone is the ownership operation itself, so
            // the RC pass must be idempotent at this boundary.
            let clone_expr = expr
            return rc_expr(clone_expr, true, owned, boxed,
                externs, drop_types, gensym, loop_base)
        },
        HExpr::Take { .. } => {
            let take_expr = expr
            return rc_expr(take_expr, true, owned, boxed,
                externs, drop_types, gensym, loop_base)
        },
        _ => {}
    }
    if is_owner_bearing(expr, drop_types) &&
       type_is_physical_rc_eligible(hexpr_type(expr), externs) {
        if type_may_own(drop_types, hexpr_type(expr)) {
            panic("unreachable: owner-bearing escape reached Perceus without Take")
        }
        let clone_ty = hexpr_type(expr)
        let clone_effects = hexpr_effects(expr)
        let clone_span = hexpr_span(expr)
        let inner_input = expr
        let inner = rc_expr(inner_input, false, owned, boxed, externs,
            drop_types, gensym, loop_base)
        HExpr::Clone {
            inner: inner,
            ty: clone_ty,
            effects: clone_effects,
            span: clone_span
        }
    } else {
        // Fresh temporary: move (no clone).  Recurse so nested escape positions
        // inside it (struct fields, list elements, container-sink args, branch
        // bodies, etc.) are still handled.
        let fresh_expr = expr
        rc_expr(fresh_expr, true, owned, boxed, externs, drop_types, gensym,
            loop_base)
    }
}

// ============================================================
// Block transform (the unit that owns and drops local bindings)
// ============================================================
//
// `escape`: whether the block's VALUE escapes into an owned slot (function tail,
//   let initialiser block, escape-position if/match arm).  When true the tail is
//   cloned if owner-bearing.  When false the value is a borrow (statement /
//   condition / call-arg position).
//
// Scope-end-drop-once: bindings defined directly by this block's statements are
// dropped at the block's end (fall-through path).  To run those drops AFTER the
// tail value is computed (so a returned/used local is not freed before use), the
// tail is hoisted into a fresh `let __rc_scope_N`, then the locals drop, then the
// hoist temp becomes the new tail.  A diverging block (ends in return/break/
// continue) skips the block-end drops: they are unreachable, and a `return`
// inside has already dropped the full owned set.

fn rc_block_root(body: HExpr, escape: Bool, owned: List<OwnedSlot>, boxed: Set<Int>, externs: Set<Str>, drop_types: OwnershipMetadata, mut gensym: RcState, loop_base: Int) -> HExpr {
    match body {
        HExpr::Block { stmts, tail, .. } => {
            let stmts_ = stmts
            let tail_ = tail
            let res = rc_block_inner(stmts_, tail_, escape, owned, boxed,
                externs, drop_types, gensym, loop_base)
            HExpr::Block { ..body, stmts: res.0, tail: res.1 }
        },
        _ => {
            // Non-block body (single expression): it is the tail in escape (return)
            // position.  No block-local bindings to drop.
            rc_escape_or_value(body, escape, owned, boxed, externs, drop_types, gensym, loop_base)
        },
    }
}

// Process a block's statement list + tail.  Returns (new_stmts, new_tail).
fn rc_block_inner(stmts: List<HStmt>, tail: HExpr?, escape: Bool, owned: List<OwnedSlot>, boxed: Set<Int>, externs: Set<Str>, drop_types: OwnershipMetadata, mut gensym: RcState, loop_base: Int) -> (List<HStmt>, HExpr?) {
    // Bindings defined directly by these statements (not nested loop/branch scopes).
    let block_locals = direct_block_locals(stmts, externs, drop_types)

    // The owned set visible to each statement = enclosing owned ++ the bindings of
    // THIS block declared BEFORE that statement.  This must be built INCREMENTALLY
    // (not the full block_locals up front): a binding only becomes visible from its
    // `let` onward.  Codegen lowers every same-named local to one shared function-
    // entry alloca, so a `return` placed in an EARLIER statement that drops a
    // not-yet-declared name would free that alloca's stale/garbage contents — and,
    // when an outer block-local name collides with an inner-branch local of the same
    // name (e.g. two `let mut result` in disjoint `parse_type_expr` arms), the outer
    // declaration would be dropped in a branch where it was never constructed
    // (native self-compile UAF in resolve_type_expr's parsed TypeExpr, B-102 layer 3).
    // Names already in `owned` (a shadowing inner binding) are NOT re-added: the one
    // shared alloca must be dropped exactly once per control-flow path.
    //
    // NB: `concat` builds a FRESH list — we must NOT alias the caller's `owned`
    // (List is a reference type), or pushing a this-block local would mutate the
    // enclosing block's owned set and leak the name into sibling branches' drop
    // sets (B-102 layer 4: `let a` in an `if` arm leaking into a later arm's
    // `return`, freeing the never-initialised alloca).
    let mut visible_owned = owned.concat([])
    let mut new_stmts: List<HStmt> = []
    let mut reaches_tail = true
    for s in stmts {
        let rc_input = s
        let reachability_input = s
        let local_input = s
        // A statement (or any early return inside it) sees only locals already declared.
        for ns in rc_stmt(rc_input, visible_owned, boxed, externs,
                drop_types, gensym, loop_base) {
            let stmt_ = ns
            new_stmts.push(stmt_)
        }
        let reaches_next = stmt_reaches_next(reachability_input)
        // After processing, this statement's own droppable binding (if any,
        // and not already owned by an enclosing scope) becomes visible only
        // when its initializer returns normally.
        if reaches_next {
            for n in stmt_droppable_locals(
                    local_input, externs, drop_types) {
                if !owned_contains(visible_owned, n) {
                    let owned_local = n
                    visible_owned.push(owned_local)
                }
            }
        } else {
            reaches_tail = false
            break
        }
    }

    // This block's own fresh bindings (dropped at block end, fall-through path).
    // DefId identity means a same-spelled shadow has its own C slot and cleanup;
    // only the same exact binding is suppressed. Computed before the tail so
    // the tail's escape mode can depend on it.
    let mut own_block_locals: List<OwnedSlot> = []
    for n in block_locals {
        if !owned_contains(owned, n) {
            let owned_local = n
            own_block_locals.push(owned_local)
        }
    }

    // B-104 D1 (Stage 2) — DROPPING-BLOCK TAIL-ESCAPE INVARIANT: a block that
    // emits scope-end drops must hand its parent an OWNED tail value, even in a
    // borrow (escape=false) position.  The block-end machinery evaluates the tail
    // FIRST (hoisted into __rc_scope_N), then runs the local drops, then yields
    // the hoisted value — so a tail that is (or, through control-flow arms,
    // yields) a BORROW of one of the dropped locals would dangle the moment the
    // drops run, and the parent (e.g. a while-condition's ring_unbox_bool) reads
    // freed memory.  Processing the tail in ESCAPE position Clone-wraps every
    // owner-bearing tail (rc_escape; control-flow tails inherit escape down to
    // their arm tails), so the hoisted value owns an independent reference that
    // survives the local drops.  ASan-proven hole this closes (pre-existing since
    // W2): `while match make(i) { some(p) => p.flag, none => false }` — the
    // materialised scrutinee `__anf = make(i)` is dropped at the cond-block end,
    // freeing the solely-owned payload whose `.flag` box the taken arm just
    // returned → heap-use-after-free in ring_unbox_bool.  Cost: in a true borrow
    // position the Clone'd tail dup has no consumer and leaks (bounded, one per
    // block evaluation, only when the block has droppable locals AND the tail is
    // owner-bearing) — crash-free direction, mirroring clone-all-escape's bias.
    // A no-drop block keeps borrow tails verbatim (zero churn, nothing freed).
    let tail_escape = if own_block_locals.len() > 0 { true } else { escape }

    // The tail sees every block-local (all `let`s precede the tail).
    let new_tail = if reaches_tail {
        match tail {
            some(t) => {
                let tail_ = t
                some(rc_escape_or_value(tail_, tail_escape, visible_owned,
                    boxed, externs, drop_types, gensym, loop_base))
            },
            none => none,
        }
    } else {
        none
    }
    if own_block_locals.len() == 0 {
        ((new_stmts, new_tail))
    } else if block_diverges(new_stmts, new_tail) {
        // Diverging block: a return/break/continue already handled cleanup; the
        // block-end drops are unreachable.  Do not emit them (would be dead code
        // / double-free on the diverging path).
        ((new_stmts, new_tail))
    } else {
        let drops = drops_for(own_block_locals)
        match new_tail {
            some(t) => {
                // Hoist the tail so the drops run AFTER it is evaluated.
                let (tmp, tmp_def_id) = fresh_scope_tmp(gensym)
                record_rc_callable_projection(t, tmp_def_id, gensym)
                let tt = hexpr_type(t)
                let te = hexpr_effects(t)
                let ts = hexpr_span(t)
                let binding_name = tmp
                let result_name = tmp
                let binding_def_id = tmp_def_id
                let result_def_id = tmp_def_id
                let binding_ty = tt
                let result_ty = tt
                let tail_ = t
                new_stmts.push(HStmt::Let { name: binding_name,
                    name_span: synthetic_span(),
                    def_id: some(binding_def_id), ty: binding_ty,
                    init: tail_, span: synthetic_span() })
                for d in drops {
                    let cleanup = d
                    new_stmts.push(cleanup)
                }
                // The hoist slot is created by this pass, after ownership
                // planning.  When the ORIGINAL parent position consumes the
                // block value, publish that transfer as an exact Take of the
                // synthetic slot.  A borrow parent can still force
                // tail_escape=true merely to keep the value alive across the
                // local drops; that path must remain an Ident borrow.
                //
                // The missing-Take mutation deliberately restores the old bare
                // Ident on the consuming edge so verify_rc independently proves
                // this post-planner transfer contract.
                let tmp_tail = if escape && gensym.counters.get(1) != some(1) {
                    HExpr::Take { name: result_name,
                        source_def_id: result_def_id, ty: result_ty,
                        effects: te, span: ts }
                } else {
                    HExpr::Ident { name: result_name,
                        resolved_name: none, def_id: some(result_def_id),
                        dict_closure_dicts: none, ty: result_ty,
                        effects: te, span: ts }
                }
                ((new_stmts, some(tmp_tail)))
            },
            none => {
                // No tail value: drops simply run at block end.
                for d in drops {
                    let cleanup = d
                    new_stmts.push(cleanup)
                }
                ((new_stmts, none))
            },
        }
    }
}

// Dispatch an expression that is itself the tail/value of a block or branch.
// In escape position, owner-bearing exprs clone; in value position they borrow.
fn rc_escape_or_value(expr: HExpr, escape: Bool, owned: List<OwnedSlot>, boxed: Set<Int>, externs: Set<Str>, drop_types: OwnershipMetadata, mut gensym: RcState, loop_base: Int) -> HExpr {
    if escape {
        let escape_expr = expr
        rc_escape(escape_expr, owned, boxed, externs, drop_types, gensym,
            loop_base)
    } else {
        let value_expr = expr
        rc_expr(value_expr, false, owned, boxed, externs, drop_types, gensym,
            loop_base)
    }
}

// Fresh hoist-temp name generator.  `gensym` is a single-element mutable List
// cell threaded through the pass (Ring has no module-level mutable global); the
// counter is monotonic for one compilation and identical across runs of the same
// source, so double-bootstrap byte-equivalence is preserved.  The reserved
// `__rc_scope_` prefix never collides with a user binding.
fn fresh_scope_tmp(mut gensym: RcState) -> (Str, Int) {
    let n = match gensym.counters.get(0) { some(v) => v, none => 0 }
    let ordinal = n + 1
    gensym.counters.set(0, ordinal)
    ("__rc_scope_${ordinal}",
        synthetic_def_id(SYNTHETIC_RC_DEF_ID_BASE, ordinal))
}

// Direct (non-nested) OWNED-AND-DROPPABLE bindings introduced by a statement
// list.  A `let`/`var` is scope-end-dropped only when its initialiser is
// GUARANTEED to be a fresh, unshared owned value:
//   * a fresh constructor (struct / variant / list / tuple / range / lambda /
//     literal / string-interp) — allocates a new object this scope solely owns; or
//   * an owner-bearing read (Ident / field / index / .unwrap…) — rc_escape wraps
//     it in a fresh Clone, which this scope solely owns.
// A Call / EffectOp result is NOT dropped: a callee may legitimately return a
// value that SHARES substructure with caller-visible state (the compiler's HIR /
// inference graphs are DAGs, not trees — e.g. an inference helper returning an
// InferResult whose `.subst` aliases the threaded UnionFind, or pass-through HIR
// nodes), so a scope-end drop of such a binding would free still-live shared
// state (observed as native self-compile UAF, B-098 GATE 1).  Leaking these
// bindings is crash-free and still far below always-own (reads no longer dup);
// tightening them to precise ownership is L3 reuse / B-096 scope.  Other binders
// (LetDestructure / match-if-let patterns) project BORROWS and are never dropped
// (handled by their exclusion from `owned`). Range for-in bindings are the one
// exception: each iteration creates a fresh owner tracked with edge-sensitive
// backend_loop_cleanup semantics.
fn direct_block_locals(
    stmts: List<HStmt>, externs: Set<Str>, ownership: OwnershipMetadata
) -> List<OwnedSlot> {
    let mut out: List<OwnedSlot> = []
    for s in stmts {
        let locals_stmt = s
        let reachability_stmt = s
        for n in stmt_droppable_locals(
                locals_stmt, externs, ownership) {
            let membership_slot = n
            if !owned_contains(out, membership_slot) {
                let output_slot = n
                out.push(output_slot)
            }
        }
        if !stmt_reaches_next(reachability_stmt) { return out }
    }
    out
}

// The droppable owned local(s) a SINGLE statement introduces (0 or 1).  Same
// classification as direct_block_locals, factored out so rc_block_inner can grow
// the visible-owned set incrementally (a binding is only droppable from its `let`
// onward — see rc_block_inner).
fn stmt_droppable_locals(
    s: HStmt, externs: Set<Str>, ownership: OwnershipMetadata
) -> List<OwnedSlot> {
    match s {
        HStmt::Let { name, def_id, init, .. } => {
            // B-102 R-clean: Type-DAG bindings participate in normal RC — a
            // droppable Type binding is scope-end-dropped (recursive drop_T), and
            // its owner-bearing init was Clone-wrapped at the escape site, so the
            // drop releases the binding's own (dup'd) reference.  (A1's
            // is_type_dag_type suppression is removed.)
            let skippable_name = name
            if rc_name_skippable(skippable_name) == false &&
               is_droppable_init(init, externs, ownership) {
                let output_name = name
                let exact = match def_id {
                    some(id) => id,
                    none => panic(
                        "unreachable: cleanup-visible let has no exact DefId")
                }
                [OwnedSlot { name: output_name, def_id: exact,
                    backend_loop_cleanup: false }]
            } else { [] }
        },
        HStmt::Var { name, def_id, init, .. } => {
            let skippable_name = name
            if rc_name_skippable(skippable_name) == false &&
               is_droppable_init(init, externs, ownership) {
                let output_name = name
                let exact = match def_id {
                    some(id) => id,
                    none => panic(
                        "unreachable: cleanup-visible var has no exact DefId")
                }
                [OwnedSlot { name: output_name, def_id: exact,
                    backend_loop_cleanup: false }]
            } else { [] }
        },
        _ => [],
    }
}

// Whether a `let`/`var` initialiser yields a fresh, solely-owned value safe to
// scope-end-drop (see direct_block_locals).  Classified on the ORIGINAL (pre-
// rc_escape) init, since rc_escape is a pure function of it: an owner-bearing
// init becomes a fresh Clone (droppable); a fresh constructor stays itself
// (droppable); a Call/EffectOp result may alias shared state (NOT droppable);
// Block/If/Match are conservatively NOT droppable (their value may be a Call
// result on some path).
// SYNC NOTE (#205): is_droppable_init and anf_should_materialize (above, ~line
// 248) both classify HExpr variants.  See the SYNC NOTE on
// anf_should_materialize for the shared/divergent variant table.
// When adding a NEW HExpr variant, update BOTH functions.
// Binding-position producer classification.  Option::none is the one neutral
// value: it is the exact process-wide never-drop singleton, so a common Drop is
// a no-op on that path while still reclaiming an owned `some(...)` sibling.
// Every other non-owned producer remains opaque; in particular Unit, externs,
// unresolved values, and ordinary effect/control aliases are never promoted by
// this lattice.
const DROP_PRODUCER_OWNED: Int = 0
const DROP_PRODUCER_NOOP_NONE: Int = 1
const DROP_PRODUCER_OPAQUE: Int = 2

fn merge_droppable_branch_classes(classes: List<Int?>) -> Int {
    let mut saw_value = false
    let mut saw_owned = false
    for maybe_class in classes {
        match maybe_class {
            some(class) => {
                saw_value = true
                if class == DROP_PRODUCER_OPAQUE {
                    return DROP_PRODUCER_OPAQUE
                }
                if class == DROP_PRODUCER_OWNED {
                    saw_owned = true
                }
            },
            none => {}
        }
    }
    if !saw_value {
        DROP_PRODUCER_OPAQUE
    } else if saw_owned {
        DROP_PRODUCER_OWNED
    } else {
        DROP_PRODUCER_NOOP_NONE
    }
}

fn droppable_branch_producer_class(
    body: HExpr, externs: Set<Str>, ownership: OwnershipMetadata
) -> Int? {
    if expr_diverges(body) {
        none
    } else {
        match body {
            HExpr::Block { tail, .. } => match tail {
                some(value) => some(droppable_producer_class(
                    value, externs, ownership)),
                none => some(DROP_PRODUCER_OPAQUE)
            },
            _ => some(droppable_producer_class(body, externs, ownership))
        }
    }
}

fn droppable_producer_class(
    init: HExpr, externs: Set<Str>, ownership: OwnershipMetadata
) -> Int {
    if !type_is_physical_rc_eligible(hexpr_type(init), externs) {
        return DROP_PRODUCER_OPAQUE
    }
    if is_option_none_ctor_ident(init) {
        return DROP_PRODUCER_NOOP_NONE
    }
    match init {
        HExpr::IfExpr { then_branch, else_branch, .. } => match else_branch {
            some(other) => merge_droppable_branch_classes([
                droppable_branch_producer_class(
                    then_branch, externs, ownership),
                droppable_branch_producer_class(
                    other, externs, ownership)
            ]),
            none => DROP_PRODUCER_OPAQUE
        },
        HExpr::MatchExpr { arms, .. } => {
            let mut classes: List<Int?> = []
            for arm in arms {
                classes.push(droppable_branch_producer_class(
                    arm.body, externs, ownership))
            }
            merge_droppable_branch_classes(classes)
        },
        HExpr::Block { tail, .. } => match tail {
            some(value) => droppable_producer_class(
                value, externs, ownership),
            none => DROP_PRODUCER_OPAQUE
        },
        _ => if is_droppable_leaf_init(init, externs, ownership) {
            DROP_PRODUCER_OWNED
        } else {
            DROP_PRODUCER_OPAQUE
        }
    }
}

fn is_droppable_init(
    init: HExpr, externs: Set<Str>, ownership: OwnershipMetadata
) -> Bool {
    droppable_producer_class(init, externs, ownership) ==
        DROP_PRODUCER_OWNED
}

fn is_droppable_leaf_init(
    init: HExpr, externs: Set<Str>, ownership: OwnershipMetadata
) -> Bool {
    // B-104 D1 rule ② (Unit) + rule ① (extern, audit #139), both TYPE-level:
    //   ② a Unit-typed binding is never dropped: Unit has no value semantics
    //     (checker-guaranteed), and at the LLVM ABI a Unit-typed builtin call
    //     may accidentally return a live pointer — the receiver-returning
    //     mutators (`let x = xs.push(v)` → result IS the caller's container,
    //     `return list;`), so dropping it would free a live container → UAF.
    //     This TYPE-level rule replaces the B-103 name-grain listing of the 9
    //     mutator field names in the retired spelling classifier (push/set/insert/
    //     remove/add/clear/extend/line/add_int — all declared `-> Unit` in std,
    //     verified per declaration), eliminating its leak-side cost: a USER
    //     method that shares a listed name but returns a real value is no
    //     longer Clone-wrapped (its result now moves + drops normally), and a
    //     fn-tail mutator result no longer dup-pins the receiver.
    //   ① a binding whose type IS an extern handle (`let b =
    //     LLVMCreateBuilder(...)`) must never be scope-end-dropped — ring_drop
    //     on a raw foreign pointer reads a garbage header / frees foreign
    //     memory.  A binding whose type transitively CONTAINS an extern handle
    //     (`let saved = ctx.current_fn` : LLVMValueRef?, `let pts:
    //     List<LLVMTypeRef> = []`, a struct with handle fields) must not be
    //     dropped either: its DEEP drop (drop_option / drop_list / drop_T field
    //     recursion at the runtime level) would reach the foreign pointer.
    //     Both leak instead — crash-free direction; foreign handles are owned
    //     by the foreign API (LLVMContextDispose et al.), not by Ring RC.
    let ty = hexpr_type(init)
    if !type_is_physical_rc_eligible(ty, externs) {
        return false
    }
    // ring_Option_none returns the immortal runtime singleton.  Its exact
    // constructor Ident is neither a local owner read (which rc_escape would
    // Clone) nor a fresh allocation, so a binding must never Drop it.
    if is_option_none_ctor_ident(init) {
        return false
    }
    // Same exact owned-slot override as anf_should_materialize.  In pure
    // List/Map impl bodies the K/V result may still be an unnamed TypeVar, but
    // the bridge has already dup'd/moved an independent reference.
    match exact_call_result_role(init, ownership) {
        some(role) => {
            if role == CALLABLE_RESULT_ROLE_FRESH_OWNED_SLOT {
                return true
            } else if role == CALLABLE_RESULT_ROLE_UNKNOWN &&
                      is_unresolved_var_type(ty) {
                panic("unreachable: droppable call has unknown semantic result role")
            }
        },
        none => {}
    }
    // B-104 D1 Stage 2 — UNKNOWN-OWNERSHIP guard (audit #149, mirrors
    // anf_should_materialize): a binding whose type is an unresolved TypeVar is
    // never scope-end-dropped.  The #149 checker hole over-generalises an
    // unannotated fn's return to a free var, so `let r = tp(a)` (where tp's
    // body tail is a receiver-returning Unit builtin, moved verbatim un-dup'd)
    // binds the LIVE container typed as a TypeVar — dropping r double-frees it
    // (ASan-proven on the pre-guard compiler).  Leak direction; concrete
    // (zonked) types are unaffected.
    if is_unresolved_var_type(ty) {
        return false
    }
    if is_materialized_fn_value(init) {
        return true
    }
    match init {
        // Owner-bearing reads → rc_escape wraps in a fresh Clone.
        //
        // B-101 element-read-projection UAF audit: a `let x = list[i]` /
        // `let x = obj.field` binds an element/field READ.  The runtime read
        // (ring_list_get / struct-GEP) returns a BORROW (no dup — B-098).
        // Naively scope-end-dropping x would free the container's element
        // → UAF.  But these are owner-bearing, so rc_stmt's rc_escape wraps the init
        // in HExpr::Clone (gen_clone → ring_dup): the binding then owns an
        // INDEPENDENT dup'd reference, NOT the container's element.  The scope-end
        // Drop releases that dup (rc N+1 → N); the container's own reference (and its
        // later element drop) is untouched.  Balanced — NO UAF, NO leak.  (This is
        // why is_droppable_init and is_owner_bearing agree on these arms: every
        // droppable-as-owner-bearing init is Clone-wrapped before it is dropped.)
        //
        // B-104 D1 rule ③: a Str-receiver IndexExpr (`let c = s[i]`) is droppable
        // on the OTHER ground — it is a FRESH 1-char string (ring_str_get
        // allocates; not owner-bearing, so rc_escape MOVES it into the binding),
        // released by the same scope-end Drop.  Both IndexExpr cases are
        // droppable; they differ only in whether the init was Clone-wrapped.
        HExpr::Ident { .. } => true,
        HExpr::FieldAccess { .. } => true,
        HExpr::IndexExpr { .. } => true,
        // Fresh constructors / literals → newly allocated, solely owned.
        HExpr::StructLit { .. } => true,
        HExpr::NamedVariantConstruct { .. } => true,
        HExpr::ListLit { .. } => true,
        HExpr::TupleLit { .. } => true,
        HExpr::RangeExpr { .. } => true,
        HExpr::Lambda { .. } => true,
        HExpr::StringInterp { .. } => true,
        HExpr::IntLit { .. } => true,
        HExpr::FloatLit { .. } => true,
        HExpr::StrLit { .. } => true,
        HExpr::BoolLit { .. } => true,
        HExpr::Clone { .. } => true,
        HExpr::Take { .. } => true,
        // B-103: every Call result is droppable.  Two sub-cases, both safe:
        //   (a) exact descriptor-Borrowed call: is_owner_bearing(Call) is
        //       also true, so rc_stmt's rc_escape wraps the init in HExpr::Clone
        //       (ring_dup) — the binding owns a fresh dup, and the scope-end Drop
        //       releases that dup, NOT the borrowed source.  Balanced.
        //   (b) OWNED-returning call (apply_subst & the 167-site substitution flood,
        //       map_new, list_clone, .get/.first/.last/.values/.entries, string
        //       ops, ctor calls, …): the result is a fresh, solely-owned value moved
        //       into the binding; the scope-end Drop releases it (rc N→N-1).  This is
        //       what finally RECLAIMS the apply_subst transients (G-a memory gate).
        // PRE-CONDITION: exact callee return descriptors
        // (+ the owned-container-constructor dups in ring_runtime.cpp: list_first/
        // last — B-103, and pure Ring Map ring_slot_read paths) must be COMPLETE,
        // else a missed
        // borrow leaf would be scope-end-dropped → UAF.  ASan (real_program ×3 +
        // self-compile) is the completeness safety net: an over-free pinpoints the
        // missed descriptor, which is then fixed at builtin registration.
        HExpr::Call { .. } => true,
        // B-104: arithmetic/comparison BinOp + UnaryOp results are FRESH owned
        // (builtin arith/compare/negate box a new value via box_int/box_bool/
        // box_float; user operator overloads lower to Call, covered above) — never a
        // borrow, so safe to scope-end-drop.  Reclaims the boxed Int/Bool arithmetic
        // flood (diag: tid=0 INT 86M + tid=2 BOOL 43M live).
        //
        // (The old `&&`/`||` exception is RETIRED — B-104 D7: andor_lower
        // rewrites them to IfExpr at checker end, so the phi-verbatim borrow
        // hazard (`let x = a && obj.is_mutable` aliasing obj's box) is
        // structurally gone: an IfExpr init classifies via the branch-value
        // recursion below, and its borrow arm tails are Clone-wrapped by
        // rc_escape — the binding always owns its value.)
        HExpr::BinOp { .. } => true,
        HExpr::UnaryOp { .. } => true,
        HExpr::IfExpr { .. } | HExpr::MatchExpr { .. } |
        HExpr::Block { .. } => panic(
            "unreachable: control-flow droppability bypassed producer lattice"),
        // B-104 D4: a dict construction (dict_lower's `let __ring_dictlocal_N`
        // init) is a FRESH TUPLE-of-closures the binding solely owns — the
        // scope-end drop (runtime drop_dict, typeid DICT_DYN) reclaims it.  Its
        // inner DictRefs are borrows (params / singletons), not owned by it at
        // the HIR level (the runtime env-dup balances the env-drop internally).
        HExpr::DictConstruct { .. } => true,
        // EffectOp / HandleExpr / TryCatch: value may alias resumed/handler state or
        // sit on an abort path (B-002) — conservatively NOT dropped (leak, crash-free).
        _ => false,
    }
}

// B-104 D2: the owned bindings declared inside the innermost loop body — the
// set a break/continue edge must drop (the loop-scoped suffix of the visible
// owned list).  loop_base < 0 = not inside a loop (break/continue cannot
// occur there; checker enforces loop context).
fn loop_scoped_owned(
    owned: List<OwnedSlot>, loop_base: Int,
    include_backend_loop_cleanup: Bool
) -> List<OwnedSlot> {
    if loop_base < 0 {
        []
    } else {
        let mut result: List<OwnedSlot> = []
        for slot in owned.slice(loop_base, owned.len()) {
            if include_backend_loop_cleanup || !slot.backend_loop_cleanup {
                let output = slot
                result.push(output)
            }
        }
        result
    }
}

// Build unconditional cleanup in reverse declaration order. A slot cleared by
// Take is null, so the same Drop node is valid on moved and non-moved paths.
fn drops_for(names: List<OwnedSlot>) -> List<HStmt> {
    let mut out: List<HStmt> = []
    let mut index = names.len()
    while index > 0 {
        index = index - 1
        match names.get(index) {
            some(slot) => {
                let skippable_name = slot.name
                let drop_name = slot.name
                let drop_def_id = slot.def_id
                if rc_name_skippable(skippable_name) == false {
                    out.push(HStmt::Drop { name: drop_name,
                        def_id: drop_def_id, ty: Type::UnitType,
                        span: synthetic_span() })
                }
            },
            none => {}
        }
    }
    out
}

// Whether a transformed statement list + tail diverges (ends in return/break/
// continue on every path), so block-end drops would be unreachable.
fn block_diverges(stmts: List<HStmt>, tail: HExpr?) -> Bool {
    for s in stmts {
        if !stmt_reaches_next(s) { return true }
    }
    match tail {
        some(t) => !expr_has_reachable_value(t),
        none => false,
    }
}

// Exact owned-local reassignment. The planner rejects owner-bearing borrowed,
// boxed and projection targets; visible `owned` membership below is the final
// cleanup authority for the remaining Ident target.
fn reassign_drop_def_id(target: HExpr, boxed: Set<Int>) -> Int? {
    match target {
        HExpr::Ident { def_id: some(did), .. } => {
            if !boxed.contains(did) {
                let result_def_id = did
                some(result_def_id)
            } else { none }
        },
        _ => none,
    }
}

// (pub: shared with verify_rc.ring's overwrite accounting.)
pub fn is_scalar_type(ty: Type) -> Bool {
    match ty {
        Type::IntType => true,
        Type::FloatType => true,
        Type::BoolType => true,
        _ => false,
    }
}

// ============================================================
// Statement transform
// ============================================================

fn rc_stmt(stmt: HStmt, owned: List<OwnedSlot>, boxed: Set<Int>, externs: Set<Str>, drop_types: OwnershipMetadata, mut gensym: RcState, loop_base: Int) -> List<HStmt> {
    match stmt {
        HStmt::Let { init, .. } => {
            // The binding takes ownership of its initialiser → escape position.
            let init_ = init
            let new_init = rc_escape(init_, owned, boxed, externs,
                drop_types, gensym, loop_base)
            [HStmt::Let { ..stmt, init: new_init }]
        },
        HStmt::Var { init, .. } => {
            let init_ = init
            let new_init = rc_escape(init_, owned, boxed, externs,
                drop_types, gensym, loop_base)
            [HStmt::Var { ..stmt, init: new_init }]
        },
        HStmt::Assign { target, value, .. } => {
            // The R-value escapes into the assigned location (it takes ownership).
            // The L-value (target) is a write destination — not rc-transformed.
            let value_type_input = value
            let value_effects_input = value
            let value_span_input = value
            let value_transform_input = value
            let vt = hexpr_type(value_type_input)
            let value_effects = hexpr_effects(value_effects_input)
            let value_span = hexpr_span(value_span_input)
            let new_value = rc_escape(value_transform_input, owned, boxed,
                externs, drop_types, gensym, loop_base)
            // Materialise RHS first (it may read or Take the target), then Drop
            // the exact old slot, then store. A self-move Take clears the slot,
            // making the intervening Drop(NULL) a no-op.
            let lookup_target = target
            let result_target = target
            let w4_target = match reassign_drop_def_id(lookup_target, boxed) {
                some(def_id) => owned_find_def_id(owned, def_id),
                none => none,
            }
            match w4_target {
                some(drop_slot) => {
                    let (tmp, tmp_def_id) = fresh_scope_tmp(gensym)
                    record_rc_callable_projection(
                        new_value, tmp_def_id, gensym)
                    let binding_name = tmp
                    let result_name = tmp
                    let binding_def_id = tmp_def_id
                    let result_def_id = tmp_def_id
                    let binding_ty = vt
                    let result_ty = vt
                    let drop_name = drop_slot.name
                    let drop_def_id = drop_slot.def_id
                    let tmp_id = HExpr::Ident {
                        name: result_name, resolved_name: none,
                        def_id: some(result_def_id),
                        dict_closure_dicts: none, ty: result_ty,
                        effects: value_effects, span: value_span
                    }
                    [
                        HStmt::Let { name: binding_name,
                            name_span: synthetic_span(),
                            def_id: some(binding_def_id),
                            ty: binding_ty, init: new_value,
                            span: synthetic_span() },
                        HStmt::Drop { name: drop_name,
                            def_id: drop_def_id, ty: Type::UnitType,
                            span: synthetic_span() },
                        HStmt::Assign { ..stmt,
                            target: result_target, value: tmp_id },
                    ]
                },
                none => [HStmt::Assign { ..stmt,
                    target: result_target, value: new_value }],
            }
        },
        HStmt::ExprStmt { expr, .. } => {
            // Statement position: the value is discarded (borrow / fresh-temp that
            // leaks if unowned — acceptable; usually a Unit-returning call).
            let expr_ = expr
            let new_expr = rc_expr(expr_, false, owned, boxed, externs,
                drop_types, gensym, loop_base)
            [HStmt::ExprStmt { ..stmt, expr: new_expr }]
        },
        HStmt::Return { value, .. } => {
            match value {
                some(v) => {
                    // Clone the returned value if owner-bearing (the caller takes
                    // ownership; the source local is then dropped below), then drop
                    // every owned local in scope.  Order matters: the Clone bumps
                    // the rc, so the subsequent drops leave the returned object with
                    // the caller's reference.  Diverges → block-end drops unreachable.
                    let value_type_input = v
                    let value_effects_input = v
                    let value_span_input = v
                    let value_transform_input = v
                    let tt = hexpr_type(value_type_input)
                    let te = hexpr_effects(value_effects_input)
                    let ts = hexpr_span(value_span_input)
                    let new_v = rc_escape(value_transform_input, owned, boxed,
                        externs, drop_types, gensym, loop_base)
                    let mut out: List<HStmt> = []
                    // Hoist the (cloned) return value so the drops run AFTER it.
                    let (tmp, tmp_def_id) = fresh_scope_tmp(gensym)
                    record_rc_callable_projection(new_v, tmp_def_id, gensym)
                    let binding_name = tmp
                    let result_name = tmp
                    let binding_def_id = tmp_def_id
                    let result_def_id = tmp_def_id
                    let binding_ty = tt
                    let result_ty = tt
                    out.push(HStmt::Let { name: binding_name,
                        name_span: synthetic_span(),
                        def_id: some(binding_def_id), ty: binding_ty,
                        init: new_v, span: synthetic_span() })
                    for d in drops_for(owned) {
                        let cleanup = d
                        out.push(cleanup)
                    }
                    let tmp_id = HExpr::Ident { name: result_name,
                        resolved_name: none, def_id: some(result_def_id),
                        dict_closure_dicts: none, ty: result_ty,
                        effects: te, span: ts }
                    out.push(HStmt::Return { ..stmt, value: some(tmp_id) })
                    out
                },
                none => {
                    // void return — drop all owned locals in scope.
                    let mut out: List<HStmt> = []
                    for d in drops_for(owned) {
                        let cleanup = d
                        out.push(cleanup)
                    }
                    out.push(stmt)
                    out
                },
            }
        },
        HStmt::While { condition, body, .. } => {
            // Condition is a borrow (boolean test).  The body is its own scope: its
            // bindings drop per-iteration at the body's block end.  No loop-carried
            // dup is needed — reads borrow, escapes clone, so the loop neither
            // consumes nor leaks outer locals (this is what kills the #134
            // conditional-loop double-free at the root).
            let condition_ = condition
            let body_ = body
            let new_cond = rc_expr(condition_, false, owned, boxed, externs,
                drop_types, gensym, loop_base)
            // B-104 D2: the body opens a NEW loop scope — bindings declared past
            // this point (visible_owned index >= owned.len()) are loop-scoped and
            // must be dropped on break/continue edges (see the Break/Continue arms).
            let new_body = rc_block_root(body_, false, owned, boxed, externs,
                drop_types, gensym, owned.len())
            [HStmt::While { ..stmt,
                condition: new_cond, body: new_body }]
        },
        HStmt::ForIn { binding, def_id, destructure, iterable, body, .. } => {
            // Inference lowers every non-Range iterable through protocol calls;
            // the only surviving ForIn is a Range loop (literal or range-typed
            // value). Codegen creates a
            // fresh boxed counter binding each iteration and owns its normal/
            // continue cleanup at the increment label. Track that binding as a
            // special enclosing owner so return/break edges that skip the label
            // emit a Drop, while ordinary block-end/continue cleanup filters it.
            // An exact Take clears the slot, so either cleanup remains a no-op.
            match destructure {
                some(_) => panic(
                    "unreachable: Range for-in destructure reached Perceus"),
                none => {}
            }
            let iterable_ = iterable
            let body_ = body
            let new_iter = rc_expr(iterable_, false, owned, boxed, externs,
                drop_types, gensym, loop_base)
            let range_loop_base = owned.len()
            let mut range_owned = owned.concat([])
            if !rc_name_skippable(binding) {
                let range_def_id = match def_id {
                    some(id) => id,
                    none => panic(
                        "unreachable: Range for-in binding has no exact cleanup DefId")
                }
                let range_name = binding
                range_owned.push(OwnedSlot { name: range_name,
                    def_id: range_def_id, backend_loop_cleanup: true })
            }
            // B-104 D2: the body opens a NEW loop scope — bindings declared past
            // range_loop_base are loop-scoped. Break drops all of them; Continue
            // drops ordinary locals only, then reaches the backend Range cleanup.
            let new_body = rc_block_root(body_, false, range_owned, boxed,
                externs, drop_types, gensym, range_loop_base)
            [HStmt::ForIn { ..stmt,
                iterable: new_iter, body: new_body }]
        },
        // B-104 D2 fix-forward (verifier finding leak-loop-exit, 264 sites in the
        // compiler alone): a break/continue edge jumps past the loop body's
        // block-end drops, so every owned binding declared INSIDE the innermost
        // loop (visible_owned[loop_base..]) leaked — once per break, once per
        // ITERATION for continue (`for x { let s = f(); if skip(s) { continue } }`
        // leaked s every skipped round).  Mirror the Return-path drops: drop the
        // loop-scoped owned set, then exit.  Exactly-once on both edges: the
        // break/continue path runs these drops and skips the block-end drops
        // (codegen jumps to exit/latch); the fall-through path skips these (they
        // are inside the diverging branch) and runs the block-end drops.
        // Enclosing (pre-loop) bindings are untouched — the loop exit continues
        // into code that still uses them.
        HStmt::Break { .. } => {
            let mut out: List<HStmt> = []
            let include_backend_cleanup =
                gensym.counters.get(2) != some(1)
            for d in drops_for(loop_scoped_owned(
                    owned, loop_base, include_backend_cleanup)) {
                let cleanup = d
                out.push(cleanup)
            }
            out.push(stmt)
            out
        },
        HStmt::Continue { .. } => {
            let mut out: List<HStmt> = []
            let include_backend_cleanup =
                gensym.counters.get(3) == some(1)
            for d in drops_for(loop_scoped_owned(
                    owned, loop_base, include_backend_cleanup)) {
                let cleanup = d
                out.push(cleanup)
            }
            out.push(stmt)
            out
        },
        HStmt::LetDestructure { init, .. } => {
            // B-104 D1 Stage 2: the destructure does NOT take ownership of the
            // init — codegen (emit_let_destructure) PROJECTS each element via
            // ring_list_get (a borrow load, no dup) into the binding allocas,
            // and the bindings are excluded from the owned set (never dropped).
            // So the init is a BORROW read, not an escape.  The previous
            // rc_escape here Clone-wrapped an owner-bearing init (`let (a, b) =
            // pair`), producing an anonymous dup nobody dropped — a refcount
            // pin that leaked the tuple on every destructure of a named value.
            // Fresh inits are materialised by the ANF pass (`let __anf = f();
            // let (a, b) = __anf`) so the borrow source is an owned, scope-end-
            // dropped binding; binding escapes are Clone-wrapped as usual
            // (dup-before-drop balance, same as the W2 scrutinee).
            let init_ = init
            let new_init = rc_expr(init_, false, owned, boxed, externs,
                drop_types, gensym, loop_base)
            [HStmt::LetDestructure { ..stmt, init: new_init }]
        },
        HStmt::IfLet { expr, then_block, else_block, .. } => {
            // Scrutinee is a borrow.  Pattern bindings PROJECT borrows from the
            // scrutinee (codegen loads them without a dup), so they are NOT owned
            // and are excluded from the branch's owned set — no scope-end drop, no
            // double-free with the scrutinee.  No branch balancing.
            let expr_ = expr
            let then_block_ = then_block
            let new_expr = rc_expr(expr_, false, owned, boxed, externs,
                drop_types, gensym, loop_base)
            let new_then = rc_block_root(then_block_, false, owned, boxed,
                externs, drop_types, gensym, loop_base)
            let new_else = match else_block {
                some(eb) => {
                    let else_ = eb
                    some(rc_block_root(else_, false, owned, boxed, externs,
                        drop_types, gensym, loop_base))
                },
                none => none,
            }
            [HStmt::IfLet { ..stmt, expr: new_expr,
                then_block: new_then, else_block: new_else }]
        },
        // Drop is inserted by this pass; pass through if seen (idempotent).
        HStmt::Drop { .. } => [stmt]
    }
}

// ============================================================
// Expression transform
//   escape = whether THIS expression's value escapes into an owned slot.
//   owned  = owned local bindings in scope (for nested return drops).
// ============================================================

fn rc_expr(expr: HExpr, escape: Bool, owned: List<OwnedSlot>, boxed: Set<Int>, externs: Set<Str>, drop_types: OwnershipMetadata, mut gensym: RcState, loop_base: Int) -> HExpr {
    match expr {
        // Leaves: nothing to transform.  Owner-bearing leaves (Ident) are cloned
        // by rc_escape at the escape site, never here (here = value position).
        HExpr::Ident { .. } | HExpr::IntLit { .. } |
        HExpr::FloatLit { .. } | HExpr::StrLit { .. } |
        HExpr::BoolLit { .. } => expr,
        // B-104 D4: a dict construction is a FRESH value (leaf — its inners are
        // DictRef borrows of params/locals/singletons, not sub-expressions).
        // It only occurs as a dict_lower-synthesised Let init: the binding is
        // owned (is_droppable_init → true) and scope-end-dropped.
        HExpr::DictConstruct { .. } => expr,

        HExpr::BinOp { left, right, .. } => {
            // Operands are borrows (read for the operation; comparison/arith does
            // not take ownership).
            let left_ = left
            let right_ = right
            let new_left = rc_expr(left_, false, owned, boxed, externs,
                drop_types, gensym, loop_base)
            let new_right = rc_expr(right_, false, owned, boxed, externs,
                drop_types, gensym, loop_base)
            HExpr::BinOp { ..expr, left: new_left, right: new_right }
        },

        HExpr::UnaryOp { operand, .. } => {
            let operand_ = operand
            let new_operand = rc_expr(operand_, false, owned, boxed,
                externs, drop_types, gensym, loop_base)
            HExpr::UnaryOp { ..expr, operand: new_operand }
        },

        HExpr::Call { callee, callee_def_id, args, .. } => {
            // The exact descriptor, not a callee spelling, determines every
            // edge.  A planner Take/fresh producer moves through rc_escape
            // unchanged.  A borrowed non-linear projection or borrowed-return
            // call is cloned here, making Perceus the sole Clone producer.
            let mut is_method = false
            let callee_ = callee
            let new_callee = match callee_ {
                HExpr::FieldAccess { receiver, .. } => {
                    is_method = true
                    let mode = perceus_call_param_mode(
                        drop_types, callee_def_id, 0)
                    let receiver_ty = hexpr_type(receiver)
                    let invalidates = mode == PARAM_OWNERSHIP_MOVE &&
                        perceus_move_edge_requires_invalidation(
                            drop_types, callee_def_id, 0,
                            receiver_ty, externs)
                    let assert_receiver = receiver
                    let mutation_receiver = receiver
                    let escape_receiver = receiver
                    let borrow_receiver = receiver
                    let new_receiver = if invalidates {
                        assert_perceus_move_edge(assert_receiver)
                        match mutate_missing_call_edge_take(
                                mutation_receiver, gensym.counters) {
                            some(raw) => {
                                let raw_ = raw
                                rc_expr(raw_, false, owned, boxed, externs,
                                    drop_types, gensym, loop_base)
                            },
                            none => rc_escape(escape_receiver, owned, boxed,
                                externs, drop_types, gensym, loop_base)
                        }
                    } else {
                        rc_expr(borrow_receiver, false, owned, boxed, externs,
                            drop_types, gensym, loop_base)
                    }
                    HExpr::FieldAccess { ..callee_, receiver: new_receiver }
                },
                _ => rc_expr(callee_, false, owned, boxed, externs,
                    drop_types, gensym, loop_base)
            }
            let mut new_args: List<HExpr> = []
            let mut index = 0
            for a in args {
                let assert_arg = a
                let mutation_arg = a
                let escape_arg = a
                let borrow_arg = a
                let descriptor_index = index + if is_method { 1 } else { 0 }
                let mode = perceus_call_param_mode(
                    drop_types, callee_def_id, descriptor_index)
                let arg_ty = hexpr_type(a)
                let invalidates = mode == PARAM_OWNERSHIP_MOVE &&
                    perceus_move_edge_requires_invalidation(
                        drop_types, callee_def_id, descriptor_index,
                        arg_ty, externs)
                if invalidates {
                    assert_perceus_move_edge(assert_arg)
                    match mutate_missing_call_edge_take(
                            mutation_arg, gensym.counters) {
                        some(raw) => {
                            let raw_ = raw
                            new_args.push(rc_expr(raw_, false, owned, boxed,
                                externs, drop_types, gensym, loop_base))
                        },
                        none => new_args.push(rc_escape(escape_arg, owned, boxed,
                            externs, drop_types, gensym, loop_base))
                    }
                } else {
                    new_args.push(rc_expr(borrow_arg, false, owned, boxed, externs,
                        drop_types, gensym, loop_base))
                }
                index = index + 1
            }
            HExpr::Call { ..expr, callee: new_callee, args: new_args }
        },

        HExpr::FieldAccess { receiver, .. } => {
            // Read: receiver is a borrow.  (If this field access itself escapes,
            // rc_escape wraps the whole node in Clone before we get here in value
            // position — so here the result is just a borrow.)
            let receiver_ = receiver
            let new_receiver = rc_expr(receiver_, false, owned, boxed,
                externs, drop_types, gensym, loop_base)
            HExpr::FieldAccess { ..expr, receiver: new_receiver }
        },

        HExpr::StructLit { fields, spread, .. } => {
            // Runtime evaluates the spread source first. ANF has already
            // materialized every fresh producer; an inline source is therefore
            // a proven borrow (or unreachable) and is visited without escape.
            let new_spread = match spread {
                some(s) => {
                    let spread_ = s
                    some(rc_expr(spread_, false, owned, boxed, externs,
                        drop_types, gensym, loop_base))
                },
                none => none,
            }
            // Each field value escapes into the new struct (the struct owns it).
            let mut new_fields: List<HStructFieldInit> = []
            for f in fields {
                let value_ = f.value
                let new_value = rc_escape(value_, owned, boxed, externs,
                    drop_types, gensym, loop_base)
                new_fields.push(HStructFieldInit { ..f, value: new_value })
            }
            HExpr::StructLit { ..expr,
                fields: new_fields, spread: new_spread }
        },

        HExpr::NamedVariantConstruct { fields, spread, .. } => {
            let new_spread = match spread {
                some(s) => {
                    let spread_ = s
                    some(rc_expr(spread_, false, owned, boxed, externs,
                        drop_types, gensym, loop_base))
                },
                none => none,
            }
            let mut new_fields: List<HStructFieldInit> = []
            for f in fields {
                let value_ = f.value
                let new_value = rc_escape(value_, owned, boxed, externs,
                    drop_types, gensym, loop_base)
                new_fields.push(HStructFieldInit { ..f, value: new_value })
            }
            HExpr::NamedVariantConstruct { ..expr,
                fields: new_fields, spread: new_spread }
        },

        HExpr::Block { stmts, tail, .. } => {
            // A nested block: it owns its own bindings (dropped at its block end)
            // and its value carries this expression's escape position.
            let stmts_ = stmts
            let tail_ = tail
            let res = rc_block_inner(stmts_, tail_, escape, owned, boxed,
                externs, drop_types, gensym, loop_base)
            HExpr::Block { ..expr, stmts: res.0, tail: res.1 }
        },

        HExpr::IfExpr { condition, then_branch, else_branch, .. } => {
            // Condition borrows.  Branches inherit this expression's escape
            // position; each branch is its own scope (block-end drops its locals).
            // No branch balancing: outer locals are only read (borrow) in branches,
            // so they drop once at the OUTER block end regardless of branch taken.
            let condition_ = condition
            let then_branch_ = then_branch
            let new_cond = rc_expr(condition_, false, owned, boxed, externs,
                drop_types, gensym, loop_base)
            let new_then = rc_block_root(then_branch_, escape, owned, boxed,
                externs, drop_types, gensym, loop_base)
            let new_else = match else_branch {
                some(eb) => {
                    let else_ = eb
                    some(rc_block_root(else_, escape, owned, boxed, externs,
                        drop_types, gensym, loop_base))
                },
                none => none,
            }
            HExpr::IfExpr { ..expr, condition: new_cond,
                then_branch: new_then, else_branch: new_else }
        },

        HExpr::MatchExpr { scrutinee, arms, .. } => {
            // Scrutinee borrows.  Each arm body inherits escape.  Arm pattern
            // bindings PROJECT borrows from the scrutinee (loaded without a dup),
            // so they are NOT owned — excluded from the arm's owned set (no
            // scope-end drop, no double-free with the scrutinee).  No balancing:
            // outer owned locals are only read in arms, dropping once at the
            // OUTER block end regardless of which arm runs.
            let scrutinee_ = scrutinee
            let new_scrutinee = rc_expr(scrutinee_, false, owned, boxed,
                externs, drop_types, gensym, loop_base)
            let mut new_arms: List<HMatchArm> = []
            for arm in arms {
                // Guard borrows (boolean test).
                let new_guard = match arm.guard {
                    some(g) => {
                        let guard_ = g
                        some(rc_expr(guard_, false, owned, boxed, externs,
                            drop_types, gensym, loop_base))
                    },
                    none => none,
                }
                let body_ = arm.body
                let new_body = rc_block_root(body_, escape, owned, boxed,
                    externs, drop_types, gensym, loop_base)
                new_arms.push(HMatchArm { ..arm,
                    guard: new_guard, body: new_body })
            }
            HExpr::MatchExpr { ..expr,
                scrutinee: new_scrutinee, arms: new_arms }
        },

        HExpr::StringInterp { parts, .. } => {
            // Interpolated parts are read (stringified) — borrows.
            let mut new_parts: List<HStringInterpPart> = []
            for p in parts {
                match p {
                    HStringInterpPart::Expression(e) => {
                        let expr_ = e
                        new_parts.push(HStringInterpPart::Expression(rc_expr(
                            expr_, false, owned, boxed, externs, drop_types,
                            gensym, loop_base)))
                    },
                    HStringInterpPart::Literal(s) => {
                        let literal = s
                        new_parts.push(HStringInterpPart::Literal(literal))
                    },
                }
            }
            HExpr::StringInterp { ..expr, parts: new_parts }
        },

        HExpr::TryCatch { body, arms, .. } => {
            // body + catch arms inherit escape; each is its own scope.  abort-path
            // RC (longjmp) is out of B-098 scope (B-002 drop-aware unwind); on the
            // normal path the body/arm blocks drop their own locals.
            let body_ = body
            let new_body = rc_block_root(body_, escape, owned, boxed, externs,
                drop_types, gensym, loop_base)
            let mut new_arms: List<HMatchArm> = []
            for arm in arms {
                // catch-arm pattern bindings project borrows from the caught error
                // value — not owned, excluded from the arm's owned set.
                // Guard borrows (boolean test).
                let new_guard = match arm.guard {
                    some(g) => {
                        let guard_ = g
                        some(rc_expr(guard_, false, owned, boxed, externs,
                            drop_types, gensym, loop_base))
                    },
                    none => none,
                }
                let arm_body_ = arm.body
                let new_body_arm = rc_block_root(arm_body_, escape, owned,
                    boxed, externs, drop_types, gensym, loop_base)
                new_arms.push(HMatchArm { ..arm,
                    guard: new_guard, body: new_body_arm })
            }
            HExpr::TryCatch { ..expr, body: new_body, arms: new_arms }
        },

        HExpr::HandleExpr { body, handlers, .. } => {
            // body inherits escape.  Each handler arm becomes a closure at codegen
            // (gen_handle_expr → build_handler_evidence).  B-098 closure model:
            // captures are owned and DUP'd at construction by gen_lambda (not in
            // the body), so perceus only needs to transform the body in its own
            // scope.  B-096: evidence structs are dropped at handle scope end by
            // codegen (emit_evidence_drops); perceus doesn't see them (codegen-only
            // construct).
            let body_ = body
            let new_body = rc_block_root(body_, escape, owned, boxed, externs,
                drop_types, gensym, loop_base)
            let mut new_handlers: List<HEffectHandler> = []
            for h in handlers {
                // Handler arm body is its own (closure) scope — no outer owned
                // locals are in scope inside (captures are accessed through the env,
                // not `owned`).  The arm body's value is the resume/abort value →
                // escape position.
                let params_ = h.params
                let handler_body_ = h.body
                let h_body = transform_fn_body(params_, handler_body_, boxed,
                    externs, drop_types, gensym)
                new_handlers.push(HEffectHandler { ..h, body: h_body })
            }
            HExpr::HandleExpr { ..expr,
                body: new_body, handlers: new_handlers }
        },

        HExpr::Lambda { params, body, .. } => {
            // Conservative closure model (B-098 all-owned captures): every captured
            // outer owned local is DUP'd at CONSTRUCTION by gen_lambda (the env
            // takes its own reference), released when the env dies (B-084
            // drop_closure_env).  leak-free + crash-free: binding rc=1 → capture dup
            // → 2 → env drop → 1 → binding scope-end drop → 0.  Perceus therefore
            // does not touch captures here; it transforms the lambda as a fresh
            // function scope, including cleanup for solver-inferred Move params.
            let params_ = params
            let body_ = body
            let new_body = transform_fn_body(params_, body_, boxed, externs,
                drop_types, gensym)
            HExpr::Lambda { ..expr, body: new_body }
        },

        HExpr::EffectOp { args, .. } => {
            // Effect-op args: treat like ordinary call args — borrow (the handler
            // closure receives them; full effect-arg ownership is B-096 scope).
            let mut new_args: List<HExpr> = []
            for a in args {
                let arg_ = a
                new_args.push(rc_expr(arg_, false, owned, boxed, externs,
                    drop_types, gensym, loop_base))
            }
            HExpr::EffectOp { ..expr, args: new_args }
        },

        HExpr::RangeExpr { start, end, .. } => {
            // Range stores start/end into a fresh range struct → they escape.
            let start_ = start
            let end_ = end
            let new_start = rc_escape(start_, owned, boxed, externs,
                drop_types, gensym, loop_base)
            let new_end = rc_escape(end_, owned, boxed, externs,
                drop_types, gensym, loop_base)
            HExpr::RangeExpr { ..expr, start: new_start, end: new_end }
        },

        HExpr::ListLit { elements, .. } => {
            // Each element escapes into the new list (the list owns it).
            let mut new_elems: List<HExpr> = []
            for e in elements {
                let element_ = e
                new_elems.push(rc_escape(element_, owned, boxed, externs,
                    drop_types, gensym, loop_base))
            }
            HExpr::ListLit { ..expr, elements: new_elems }
        },

        HExpr::TupleLit { elements, .. } => {
            let mut new_elems: List<HExpr> = []
            for e in elements {
                let element_ = e
                new_elems.push(rc_escape(element_, owned, boxed, externs,
                    drop_types, gensym, loop_base))
            }
            HExpr::TupleLit { ..expr, elements: new_elems }
        },

        HExpr::IndexExpr { receiver, index, .. } => {
            // Read: receiver + index are borrows.  (Escape wrapping of the whole
            // index result happens in rc_escape before reaching value position.)
            let receiver_ = receiver
            let index_ = index
            let new_receiver = rc_expr(receiver_, false, owned, boxed,
                externs, drop_types, gensym, loop_base)
            let new_index = rc_expr(index_, false, owned, boxed, externs,
                drop_types, gensym, loop_base)
            HExpr::IndexExpr { ..expr,
                receiver: new_receiver, index: new_index }
        },

        // A planned Clone is already the unique dup proof.  Recurse through its
        // inner in value/borrow position, but never route the node through
        // rc_escape again.
        HExpr::Clone { inner, .. } => {
            let inner_ = inner
            let new_inner = rc_expr(inner_, false, owned, boxed, externs,
                drop_types, gensym, loop_base)
            HExpr::Clone { ..expr, inner: new_inner }
        },

        HExpr::Take { .. } => expr,

        // B-113: return in expression position (match arm).
        // Same drop semantics as HStmt::Return in rc_stmt: escape the return value,
        // drop all owned locals, emit ReturnExpr.  The result is wrapped in a Block
        // that hoists the value + drops, then has the ReturnExpr as the tail
        // (unreachable for the surrounding match, but structurally sound).
        HExpr::ReturnExpr { value, ty, effects, span } => match value {
            some(v) => {
                let value_type_input = v
                let value_effects_input = v
                let value_span_input = v
                let value_transform_input = v
                let tt = hexpr_type(value_type_input)
                let te = hexpr_effects(value_effects_input)
                let ts = hexpr_span(value_span_input)
                let new_v = rc_escape(value_transform_input, owned, boxed,
                    externs, drop_types, gensym, loop_base)
                let mut out: List<HStmt> = []
                let (tmp, tmp_def_id) = fresh_scope_tmp(gensym)
                record_rc_callable_projection(new_v, tmp_def_id, gensym)
                let binding_name = tmp
                let result_name = tmp
                let binding_def_id = tmp_def_id
                let result_def_id = tmp_def_id
                let binding_ty = tt
                let result_ty = tt
                let return_ty = ty
                let block_ty = ty
                let return_effects = effects
                let block_effects = effects
                let return_span = span
                let block_span = span
                out.push(HStmt::Let { name: binding_name,
                    name_span: synthetic_span(),
                    def_id: some(binding_def_id), ty: binding_ty,
                    init: new_v, span: synthetic_span() })
                for d in drops_for(owned) {
                    let cleanup = d
                    out.push(cleanup)
                }
                let tmp_id = HExpr::Ident { name: result_name,
                    resolved_name: none, def_id: some(result_def_id),
                    dict_closure_dicts: none, ty: result_ty,
                    effects: te, span: ts }
                let ret_expr = HExpr::ReturnExpr { value: some(tmp_id),
                    ty: return_ty, effects: return_effects,
                    span: return_span }
                HExpr::Block { stmts: out, tail: some(ret_expr),
                    ty: block_ty, effects: block_effects, span: block_span }
            },
            none => {
                let return_ty = ty
                let block_ty = ty
                let return_effects = effects
                let block_effects = effects
                let return_span = span
                let block_span = span
                let mut out: List<HStmt> = []
                for d in drops_for(owned) {
                    let cleanup = d
                    out.push(cleanup)
                }
                let ret_expr = HExpr::ReturnExpr { value: none,
                    ty: return_ty, effects: return_effects,
                    span: return_span }
                HExpr::Block { stmts: out, tail: some(ret_expr),
                    ty: block_ty, effects: block_effects, span: block_span }
            }
        },
        // B-125: unsafe block — transparent, recurse into body
        HExpr::UnsafeBlock { body, .. } => {
            let body_ = body
            let new_body = rc_block_root(body_, escape, owned, boxed, externs,
                drop_types, gensym, loop_base)
            HExpr::UnsafeBlock { ..expr, body: new_body }
        },
    }
}

// ============================================================
// Divergence analysis (#134, retained for B-098): a control path that
// unconditionally transfers away — return / break / continue — never reaches the
// enclosing block end.  Such a path is EXEMPT from scope-end drops: a `return`
// has already dropped the full owned set, and break/continue drop the
// loop-scoped owned set themselves (B-104 D2, see the Break/Continue arms),
// so prepending block-end drops on the diverging path would be dead code (and
// on the return path would double-free what the return already released).
// ============================================================

// (pub: shared with verify_rc.ring's path accounting.)
pub fn stmt_diverges(stmt: HStmt) -> Bool {
    !stmt_reaches_next(stmt)
}

// (pub: shared with verify_rc.ring's path accounting.)
pub fn expr_diverges(expr: HExpr) -> Bool {
    !expr_has_reachable_value(expr)
}
