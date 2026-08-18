// ============================================================
// verify_rc.ring — B-104 D2: static Perceus RC leak/UAF verifier
// ============================================================
//
// A linear check over the POST-RC HIR (the output of perceus_transform),
// translating the Perceus well-formedness judgment (Koka POPL'21 "Perceus:
// Garbage Free Reference Counting with Reuse", §2.4 linear resource calculus:
// Δ | Γ ⊢ e — every owned variable is consumed exactly once, borrowed
// variables are never consumed) to Ring's clone-all-escape RC model
// (design.md §7.11).  Three judgments:
//
//   (1) LEAK: every OWNED value — a fresh production (constructor / literal /
//       non-borrow call / arith box / Clone dup) or an owned binding — is
//       consumed EXACTLY ONCE: by an escape (struct/variant field, list/tuple
//       element, sink arg, range bound, assign/let slot, return) or by an
//       explicit HStmt::Drop.  An owned value nobody consumes is a leak.
//   (2) UAF: every Drop targets an owned, live value — dropping a borrow
//       (parameter, pattern projection, non-droppable init)
//       or an already-dropped/moved value is a use-after-free; so is an
//       ESCAPE of a bare borrow (an owner-bearing value stored without a
//       Clone) and any read after drop/move.
//   (3) BALANCE: sibling branches leave enclosing binding states identical
//       (the #134 per-path imbalance class, caught statically), and loop
//       bodies are state-neutral for enclosing bindings.
//
// Passing = a compile-time proof of 0 leaks + 0 UAF **at the HIR level**,
// modulo (a) the DOCUMENTED EXEMPTION CLASSES below — D1's deliberate
// leak-direction conservatisms, each reported (non-fatal) and counted — and
// (b) the CODEGEN-LEVEL BOUNDARY: drops that exist only in codegen-emitted
// code and are invisible in HIR (see rc_verify_boundary_note).
//
// ── Exemption classes (leak-direction, documented; non-fatal) ─────────────
//   (x-fold-arg retired 2026-06-12 — #150 closed by the ring_list_fold
//    empty-path dup; fold args materialise like any call args now.)
//   (x-andor retired 2026-06-13 — B-104 D7: andor_lower rewrites `&&`/`||`
//    to IfExpr at checker end; the phi either materialises + scope-end-drops
//    (all-fresh arms) or falls under the existing x-cf-value posture (mixed
//    arms).  No And/Or BinOp reaches post-RC HIR.)
//   x-cf-value          a control-flow value (if/match/block tail) that is an
//                       owned temporary in a non-consuming position (discarded
//                       statement value / borrow position / mixed-ownership
//                       init — W3a's non-blanket recursion; D1 保守保留).
//   x-effect-value      EffectOp / TryCatch / HandleExpr values are never
//                       owned by their binding (abort-path aliasing, B-002).
//   x-overwrite-field   `s.f = v` overwrites without dropping the old field
//                       value (codegen L0 field-store convention; the B-109 ①
//                       struct-field reassignment leak class).
//   x-overwrite-var     non-scalar mut-var reassignment leaks the old value
//                       (W4 covers scalars only; non-scalar lvalues deferred).
//   x-overwrite-boxed   auto-boxed mut cell writes leak the old cell value
//                       (B-091: the write mutates cell.value, no drop).
//   x-overwrite-param   assignment to a (mut) parameter overwrites a borrow.
//   x-shadow-overwrite  re-binding a live owned name (flat shared alloca)
//                       leaks the previous value.
//   x-discard           `let _ = <owned>` discards without a drop.
//   NOT REPORTED (excluded from the account by rule, design.md §7.11):
//     Unit-typed values (D1 rule ②), extern-handle / contains-extern values
//     (D1 rule ① / audit #139), TypeVar/ErrorType values (unknown-ownership
//     guard, audit #149), NeverType values (no value ever exists).
//
// ── Codegen-level boundary (HIR cannot see these; documented, not findings) ─
//   * while-cond / match-guard Bool boxes: dropped by codegen post-unbox
//     (emit_while / emit_match_arm_body, gated on is_fresh_owned_bool_value —
//     the verifier ACCEPTS an owned condition value exactly when that
//     predicate is true, i.e. when the codegen drop is guaranteed).
//   * Set-iteration conversion list (for-in over a Set lowers through a
//     temporary list; dropped by codegen — Stage 2 F round).
//   * range-loop counter/bound boxes and each fresh iteration binding
//     (emit_for_in_range_direct/var drop them on normal and continue edges —
//     B-104b); a literal RangeExpr iterable is therefore accepted inline.
//     Perceus emits an exact HIR Drop on break/return, which skip the backend
//     increment-label cleanup; Take-cleared slots make either cleanup a no-op.
//   * String interpolation SB + intermediate strings: gen_string_interp
//     drops the SB after ring_sb_to_str, and drops each codegen-synthesised
//     intermediate string (literal parts from ring_str_from_cstr, non-Str
//     expression parts from convert_to_str) after ring_sb_add.  Str-typed
//     expression parts are NOT dropped here (pass-through — D1 manages them).
//   (the former "#151 codegen-synthesised Eq/Ord dicts" entry is RETIRED —
//    B-104 D4 made dict evidence first-class: static dicts are never-drop
//    module singletons (borrows, outside the account by construction) and
//    dynamic wrapped dicts are HIR-visible DictConstruct locals in the normal
//    LEAK/UAF/BALANCE account above.  No exemption class replaces it.)
//   * handler evidence structs (B-096: dropped at codegen level by
//     emit_evidence_drops, invisible to this HIR check) / catch closures
//     and closure env capture dups (balanced by drop_closure_env).
//   * abort paths: fail.raise / handler-abort longjmp skips the in-flight
//     scope-end drops at runtime — a DYNAMIC effect invisible to (and out of
//     scope for) this static check; design-accepted leak, B-002.
//
// ── What this verifier deliberately does NOT re-derive ─────────────────────
//   The per-function return-mode classification of ring_runtime.cpp builtins
//   (FRESH/BORROW/SCALAR/NULL-NEVER) is the shared ground truth established
//   by B-103 (evidence table in perceus.ring, predicates in hir.ring).  The
//   verifier consumes it via exact DefId return descriptors / is_str_index — its
//   independent value is the structural ACCOUNTING
//   (exactly-once over every position and path), not the leaf table, whose
//   completeness is validated by ASan (the B-103 safety net).
//
// v_droppable_init below mirrors perceus.is_droppable_init for POST-RC HIR
// (Block tails may have been hoisted into `let __rc_scope_N` + Ident tail) —
// keep the two in sync; a drift shows up immediately as self-verify findings.

use ast::{Span, Position}
use types::{Type, OwnershipMetadata,
    PARAM_OWNERSHIP_MOVE, PARAM_OWNERSHIP_UNKNOWN,
    RETURN_OWNERSHIP_OWNED, RETURN_OWNERSHIP_BORROWED,
    RETURN_OWNERSHIP_UNKNOWN,
    CALLABLE_RESULT_ROLE_NONE,
    CALLABLE_RESULT_ROLE_FRESH_OWNED_SLOT,
    CALLABLE_RESULT_ROLE_UNKNOWN,
    callable_param_ownership, callable_param_requires_force,
    callable_return_ownership, type_may_own}
use hir::{HDecl, HStmt, HExpr, HParam, HProgram, HMatchArm,
    HPatternBinding, HStructFieldInit,
    HStringInterpPart, HEffectHandler, hexpr_type, hexpr_span,
    is_rc_excluded_type, type_is_physical_rc_eligible,
    type_has_logical_transfer_value,
    type_crosses_logical_owning_edge_by_value,
    is_fresh_owned_bool_value,
    is_nullary_variant_ctor_ident, is_option_none_ctor_ident,
    is_materialized_fn_value,
    move_edge_has_reachable_bare_binding,
    expr_has_reachable_value, hmatch_arm_body_is_reachable,
    stmt_reaches_next, hparam_ownership,
    hparam_is_external_drop_owner, collect_exact_free_bindings,
    is_synthetic_rc_def_id, BUILTIN_RANGE}
use perceus::{rc_name_skippable, is_str_index, is_unresolved_var_type,
    expr_diverges, stmt_diverges,
    is_scalar_type, is_materializable_fn_value}

// Value classes (what an expression's value IS, ownership-wise)
const CLS_OWNED: Int = 0     // fresh / dup'd — somebody must consume it exactly once
const CLS_BORROW: Int = 1    // aliases a reference owned elsewhere
const CLS_EXCLUDED: Int = 2  // outside the RC account (Unit / extern / TypeVar / Never)
const CLS_OPAQUE: Int = 3    // ownership not statically determined (effect
                             // values, mixed control flow) — leak-direction

// Consumption modes (what the PARENT position does with the value)
const M_CONSUMED: Int = 0    // parent takes ownership (escape/sink/slot)
const M_BORROWED: Int = 1    // parent only reads

// Binding kinds
const K_OWNED: Int = 0       // droppable owned local — exactly-once consumption
const K_BORROW: Int = 1      // param / pattern projection / destructure
const K_NONOWNED: Int = 2    // local the pass deliberately does not drop
const K_LOOP_FRESH: Int = 3  // Range iteration value; backend cleanup owns slot
const K_OPTION_CLEANUP: Int = 4 // exact `var Option = none`; S′ cleanup account

// Binding states (owned bindings)
const S_LIVE: Int = 0
const S_DROPPED: Int = 1
const S_MOVED: Int = 2
// A forward control-flow join proved that the same exact owned slot is LIVE
// on at least one reachable edge and MOVED on another.  The native Take path
// clears its slot to null, so a single unconditional Drop safely consumes this
// state; every other operation remains invalid until that Drop.
const S_MAYBE_MOVED: Int = 3
// Dedicated state domain for K_OPTION_CLEANUP. The initial immortal `none` and
// every later assignment both require the same explicit wrapper-slot Drop;
// Take clears the native slot but exit cleanup remains structurally mandatory.
const S_OPTION_PENDING: Int = 4
const S_OPTION_DROPPED: Int = 5
const S_OPTION_MOVED: Int = 6
const S_OPTION_MAYBE_MOVED: Int = 7

pub struct RcFinding {
    pub class: Str,
    pub fatal: Bool,
    pub message: Str,
    pub fn_name: Str,
    pub span: Span
}

struct VCtx {
    names: List<Str>,
    def_ids: List<Int?>,
    kinds: List<Int>,
    states: List<Int>,
    spans: List<Span>,
    frames: List<Int>,
    loop_bases: List<Int>,
    // Continue edges are verified separately from break/return divergence.
    // Each enclosing loop remembers the list base at entry and consumes only
    // the snapshots appended by its own innermost continue statements.
    continue_snapshots: List<List<Int>>,
    // Break exits the target loop and therefore has a distinct post-loop edge.
    // Preserve it until that loop validates enclosing binding state instead of
    // letting the unconditional loop-exit restore erase a nested mutation.
    break_snapshots: List<List<Int>>,
    ownership: OwnershipMetadata,
    callable_slots: Map<Int, Int>,
    boxed: Set<Int>,
    externs: Set<Str>,
    findings: List<RcFinding>,
    fn_name: Str
}

// ============================================================
// Entry points
// ============================================================

pub fn verify_rc_program(program: HProgram) -> List<RcFinding> {
    // B-144: use program-level extern type names (global set, covers use-imports).
    let externs = program.extern_type_names
    let mut findings: List<RcFinding> = []
    v_verify_result_role_totality(program.ownership_metadata, findings)
    verify_decls(program.decls, program.boxed_vars, externs,
        program.ownership_metadata, findings)
    findings
}

fn v_result_role_is_valid(role: Int) -> Bool {
    role == CALLABLE_RESULT_ROLE_NONE ||
        role == CALLABLE_RESULT_ROLE_FRESH_OWNED_SLOT ||
        role == CALLABLE_RESULT_ROLE_UNKNOWN
}

fn v_role_metadata_finding(mut findings: List<RcFinding>, message: Str) {
    findings.push(RcFinding {
        class: "uaf-call-result-role", fatal: true, message: message,
        fn_name: "<ownership-metadata>", span: synthetic_vspan()
    })
}

// Independent verifier-side totality check.  Producer code is not reused:
// every callable contract must have exactly one valid direct and returned role,
// and neither role table may contain an authority-less extra DefId.
fn v_verify_result_role_totality(
    metadata: OwnershipMetadata, mut findings: List<RcFinding>
) {
    for def_id in metadata.callable_by_def_id.keys() {
        match metadata.callable_result_role_by_def_id.get(def_id) {
            some(role) => if !v_result_role_is_valid(role) {
                v_role_metadata_finding(findings,
                    "callable DefId ${def_id.to_str()} has an invalid direct result role")
            },
            none => v_role_metadata_finding(findings,
                "callable DefId ${def_id.to_str()} is missing its direct result role")
        }
        match metadata.returned_callable_result_role_by_def_id.get(def_id) {
            some(role) => if !v_result_role_is_valid(role) {
                v_role_metadata_finding(findings,
                    "callable DefId ${def_id.to_str()} has an invalid returned result role")
            },
            none => v_role_metadata_finding(findings,
                "callable DefId ${def_id.to_str()} is missing its returned result role")
        }
    }
    for def_id in metadata.callable_result_role_by_def_id.keys() {
        if !metadata.callable_by_def_id.contains_key(def_id) {
            v_role_metadata_finding(findings,
                "direct result role DefId ${def_id.to_str()} has no callable contract")
        }
    }
    for def_id in metadata.returned_callable_result_role_by_def_id.keys() {
        if !metadata.callable_by_def_id.contains_key(def_id) {
            v_role_metadata_finding(findings,
                "returned result role DefId ${def_id.to_str()} has no callable contract")
        }
    }
}

pub fn rc_fatal_count(findings: List<RcFinding>) -> Int {
    let mut n = 0
    for f in findings { if f.fatal { n = n + 1 } }
    n
}

pub fn rc_verify_boundary_note() -> Str {
    "note: HIR-level proof. Codegen-level drops are outside this check (documented boundary): while-cond/guard box (codegen post-unbox drop), Set-iteration list + range-loop bounds (codegen drops), string interpolation SB + intermediate strings (gen_string_interp drops), handler evidence (B-096 codegen emit_evidence_drops) / catch closures, abort paths (longjmp skips scope drops — B-002)."
}

// Format findings: fatal lines always one-per-finding; exempt (documented)
// classes aggregate to per-class counts unless `strict`.
pub fn format_rc_findings(findings: List<RcFinding>, strict: Bool) -> Str {
    let mut lines: List<Str> = []
    let mut class_names: List<Str> = []
    let mut class_counts: List<Int> = []
    for f in findings {
        if f.fatal || strict {
            lines.push("${f.span.file}:${f.span.start.line}:${f.span.start.column} rc-verify[${f.class}] ${f.message}")
        }
        if f.fatal == false {
            let mut idx = 0 - 1
            let mut i = 0
            while i < class_names.len() {
                if class_names[i] == f.class { idx = i }
                i = i + 1
            }
            if idx >= 0 {
                class_counts.set(idx, class_counts[idx] + 1)
            } else {
                class_names.push(f.class)
                class_counts.push(1)
            }
        }
    }
    let fatal = rc_fatal_count(findings)
    let exempt = findings.len() - fatal
    if exempt > 0 {
        let mut parts: List<Str> = []
        let mut i = 0
        while i < class_names.len() {
            parts.push("${class_names[i]}=${class_counts[i]}")
            i = i + 1
        }
        let joined = parts.join(" ")
        lines.push("rc-verify exempt classes: ${joined}")
    }
    lines.push("RC verify: ${fatal} errors, ${exempt} exempt (documented) findings")
    lines.push(rc_verify_boundary_note())
    lines.join("\n")
}

fn verify_decls(
    decls: List<HDecl>, boxed: Set<Int>, externs: Set<Str>,
    ownership: OwnershipMetadata, mut findings: List<RcFinding>
) {
    for d in decls {
        match d {
            HDecl::Fn { name, params, body, .. } => {
                let scope_boxed = boxed
                let scope_externs = externs
                let scope_ownership = ownership
                let scope_findings = findings
                v_fn_scope(params, body, name, scope_boxed, scope_externs,
                    scope_ownership, scope_findings)
            },
            HDecl::Impl { methods, .. } => {
                let impl_boxed = boxed
                let impl_externs = externs
                let impl_ownership = ownership
                let impl_findings = findings
                verify_decls(methods, impl_boxed, impl_externs,
                    impl_ownership, impl_findings)
            },
            HDecl::Test { description, body, .. } => {
                let no_params: List<HParam> = []
                let test_boxed = boxed
                let test_externs = externs
                let test_ownership = ownership
                let test_findings = findings
                v_fn_scope(no_params, body, "test ${description}", test_boxed,
                    test_externs, test_ownership, test_findings)
            },
            HDecl::Const { name, init, .. } => {
                // A const owns its value for the program lifetime — the init is
                // consumed by the global slot, never dropped.  Not a leak.
                let const_boxed = boxed
                let const_externs = externs
                let const_ownership = ownership
                let const_findings = findings
                let const_label = "const ${name}"
                let mut ctx = v_new_ctx(
                    const_boxed, const_externs, const_ownership,
                    const_findings, const_label)
                let _ = v_consume(init, ctx)
            },
            HDecl::ModBlock { decls: mod_decls, .. } => {
                let module_boxed = boxed
                let module_externs = externs
                let module_ownership = ownership
                let module_findings = findings
                verify_decls(mod_decls, module_boxed, module_externs,
                    module_ownership, module_findings)
            },
            HDecl::Struct { .. } => {},
            HDecl::Enum { .. } => {},
            HDecl::Effect { name, ops, .. } => {
                for op in ops {
                    match op.default_body {
                        some(body) => {
                            let effect_boxed = boxed
                            let effect_externs = externs
                            let effect_ownership = ownership
                            let effect_findings = findings
                            v_fn_scope(op.params, body,
                                "effect ${name}.${op.name} default",
                                effect_boxed, effect_externs,
                                effect_ownership, effect_findings)
                        },
                        none => {},
                    }
                }
            },
            HDecl::Trait { .. } => {},
            HDecl::ExternFn { .. } => {},
            HDecl::ExternType { .. } => {},
            HDecl::TypeAlias { .. } => {},
            HDecl::Sig { .. } => {},
        }
    }
}

// A function/test/lambda/handler body: fresh scope, params borrow, body value
// is consumed by the caller (clone-all-escape return convention).
fn v_fn_scope(
    params: List<HParam>, body: HExpr, label: Str,
    boxed: Set<Int>, externs: Set<Str>, ownership: OwnershipMetadata,
    mut findings: List<RcFinding>
) {
    let context_boxed = boxed
    let context_externs = externs
    let context_ownership = ownership
    let context_findings = findings
    let context_label = label
    let mut ctx = v_new_ctx(
        context_boxed, context_externs, context_ownership,
        context_findings, context_label)
    v_push_frame(ctx)
    for p in params {
        let kind = v_param_kind(p, externs)
        v_bind_def(ctx, p.name, p.def_id, kind, synthetic_vspan())
        v_bind_callable_contract(
            ctx, p.def_id, p.ty, synthetic_vspan())
    }
    match body {
        HExpr::Block { .. } => {
            v_block(body, M_CONSUMED, ctx)
        },
        _ => {
            v_consume(body, ctx)
            ((0, false))
        },
    }
    v_pop_frame(ctx)
}

fn v_new_ctx(
    boxed: Set<Int>, externs: Set<Str>, ownership: OwnershipMetadata,
    mut findings: List<RcFinding>, label: Str
) -> VCtx {
    let names: List<Str> = []
    let def_ids: List<Int?> = []
    let kinds: List<Int> = []
    let states: List<Int> = []
    let spans: List<Span> = []
    let frames: List<Int> = []
    let loop_bases: List<Int> = []
    let continue_snapshots: List<List<Int>> = []
    let break_snapshots: List<List<Int>> = []
    VCtx {
        names: names, def_ids: def_ids,
        kinds: kinds, states: states, spans: spans,
        frames: frames, loop_bases: loop_bases,
        continue_snapshots: continue_snapshots,
        break_snapshots: break_snapshots,
        ownership: ownership, callable_slots: map_new(),
        boxed: boxed, externs: externs, findings: findings, fn_name: label
    }
}

fn synthetic_vspan() -> Span {
    let pos = Position { line: 0, column: 0, offset: 0 }
    let start_pos = pos
    let end_pos = pos
    Span { file: "<verify-rc>", start: start_pos, end: end_pos }
}

fn v_param_kind(param: HParam, externs: Set<Str>) -> Int {
    if hparam_ownership(param) != PARAM_OWNERSHIP_MOVE ||
       hparam_is_external_drop_owner(param) {
        return K_BORROW
    }
    // Move always remains a logical slot contract. Only the physical cleanup
    // account changes for direct-excluded/contains-extern parameter types.
    if type_is_physical_rc_eligible(param.ty, externs) {
        K_OWNED
    } else {
        K_NONOWNED
    }
}
fn v_callable_id_from_type(ty: Type) -> Int? {
    match ty {
        Type::FnType { meta, .. } => some(meta.ownership_term),
        _ => none
    }
}
fn v_bind_callable_contract(
    mut ctx: VCtx, def_id: Int?, ty: Type, span: Span
) {
    v_bind_callable_contract_with_provenance(
        ctx, def_id, ty, span, false)
}

// A handler resume binding is the only compiler-created callable capability
// whose contract may still be carried solely by its frozen FnType. Ordinary
// source binders must have exact DefId-keyed metadata; otherwise the verifier
// would silently manufacture authority from a type annotation after RC.
fn v_bind_resume_callable_contract(
    mut ctx: VCtx, def_id: Int?, ty: Type, span: Span
) {
    v_bind_callable_contract_with_provenance(
        ctx, def_id, ty, span, true)
}

fn v_bind_callable_contract_with_provenance(
    mut ctx: VCtx, def_id: Int?, ty: Type, span: Span,
    allow_resume_type_fallback: Bool
) {
    match def_id {
        some(id) => {
            let ownership_id = match ctx.ownership.callable_by_def_id.get(id) {
                some(exact) => {
                    let exact_ownership = exact
                    some(exact_ownership)
                },
                none => match v_callable_id_from_type(ty) {
                    some(type_contract) => {
                        if allow_resume_type_fallback {
                            let resume_type_contract = type_contract
                            some(resume_type_contract)
                        } else {
                            let missing_contract_span = span
                            v_report(ctx, "uaf-call-contract", true,
                                "ordinary callable binding DefId ${id.to_str()} has no exact ownership descriptor",
                                missing_contract_span)
                            none
                        }
                    },
                    none => none
                }
            }
            match ownership_id {
                some(exact) => {
                    let slot_id = id
                    let exact_ownership = exact
                    ctx.callable_slots.insert(slot_id, exact_ownership)
                },
                none => { ctx.callable_slots.remove(id) }
            }
        },
        none => {}
    }
}

fn v_bind_pattern_bindings(
    mut ctx: VCtx, bindings: List<HPatternBinding>, span: Span
) {
    for binding in bindings {
        let binding_name = binding.name
        let binding_def_id = binding.def_id
        let binding_slot_id = binding.def_id
        let binding_span = span
        v_bind_def(ctx, binding_name, some(binding_def_id),
            K_BORROW, binding_span)
        v_bind_callable_contract(
            ctx, some(binding_slot_id), binding.ty, binding_span)
    }
}

fn v_callable_ownership_id(ctx: VCtx, def_id: Int) -> Int? {
    match ctx.callable_slots.get(def_id) {
        some(id) => {
            let ownership_id = id
            some(ownership_id)
        },
        none => ctx.ownership.callable_by_def_id.get(def_id)
    }
}

fn v_call_param_transfer(
    mut ctx: VCtx, callee_def_id: Int?, index: Int, span: Span
) -> (Int, Bool) {
    match callee_def_id {
        some(def_id) => match v_callable_ownership_id(ctx, def_id) {
            some(ownership_id) => {
                let mode = callable_param_ownership(
                    ctx.ownership, ownership_id, index)
                if mode == PARAM_OWNERSHIP_UNKNOWN {
                    (PARAM_OWNERSHIP_UNKNOWN, false)
                } else if mode == PARAM_OWNERSHIP_MOVE {
                    match callable_param_requires_force(
                            ctx.ownership, def_id, index) {
                        some(force) => (mode, force),
                        none => {
                            let missing_strength_span = span
                            v_report(ctx, "uaf-call-contract", true,
                                "exact Move call edge has no transfer-strength authority",
                                missing_strength_span)
                            (PARAM_OWNERSHIP_UNKNOWN, false)
                        }
                    }
                } else {
                    (mode, false)
                }
            },
            none => {
                let missing_span = span
                v_report(ctx, "uaf-call-contract", true,
                    "exact callable DefId has no ownership descriptor",
                    missing_span)
                (PARAM_OWNERSHIP_UNKNOWN, false)
            }
        },
        none => {
            let missing_span = span
            v_report(ctx, "uaf-call-contract", true,
                "call has no exact callable DefId", missing_span)
            (PARAM_OWNERSHIP_UNKNOWN, false)
        }
    }
}

fn v_call_edge(
    expr: HExpr, expected_mode: Int, force: Bool,
    mut ctx: VCtx, span: Span
) {
    let has_take = v_is_transfer_expr(expr)
    let invalidates = expected_mode == PARAM_OWNERSHIP_MOVE &&
        if force {
            type_has_logical_transfer_value(hexpr_type(expr))
        } else {
            type_crosses_logical_owning_edge_by_value(
                hexpr_type(expr), ctx.externs)
        }
    if invalidates {
        if move_edge_has_reachable_bare_binding(expr, true) {
            let missing_take_span = span
            v_report(ctx, "uaf-call-missing-take", true,
                "Move call edge reads a complete binding without an exact Take",
                missing_take_span)
        }
        v_consume(expr, ctx)
    } else if has_take {
        let unexpected_take_span = span
        v_report(ctx, "uaf-call-unexpected-take", true,
            "non-invalidating call edge unexpectedly transfers ownership",
            unexpected_take_span)
        v_consume(expr, ctx)
    } else {
        v_borrow(expr, "", ctx)
    }
}

// ============================================================
// Binding environment
// ============================================================

fn v_report(mut ctx: VCtx, class: Str, fatal: Bool, msg: Str, span: Span) {
    ctx.findings.push(RcFinding {
        class: class, fatal: fatal,
        message: "in ${ctx.fn_name}: ${msg}",
        fn_name: ctx.fn_name, span: span
    })
}

fn v_push_frame(mut ctx: VCtx) {
    ctx.frames.push(ctx.names.len())
}

fn v_pop_frame(mut ctx: VCtx) {
    let base = match ctx.frames.pop() { some(b) => b, none => 0 }
    while ctx.names.len() > base {
        ctx.names.pop()
        ctx.def_ids.pop()
        ctx.kinds.pop()
        ctx.states.pop()
        ctx.spans.pop()
    }
}

fn v_frame_base(ctx: VCtx) -> Int {
    let n = ctx.frames.len()
    if n == 0 { 0 } else { ctx.frames[n - 1] }
}

// Innermost binding index for a name, or -1.
fn v_lookup(ctx: VCtx, name: Str) -> Int {
    let mut i = ctx.names.len() - 1
    let mut found = 0 - 1
    while i >= 0 && found < 0 {
        if ctx.names[i] == name { found = i }
        i = i - 1
    }
    found
}

fn v_lookup_def(ctx: VCtx, def_id: Int) -> Int {
    let mut index = ctx.def_ids.len() - 1
    while index >= 0 {
        match ctx.def_ids[index] {
            some(candidate) => if candidate == def_id { return index },
            none => {}
        }
        index = index - 1
    }
    0 - 1
}

// Bind one exact HIR slot. Optional identity remains only for legacy/backend
// evidence parameters; every source/synthetic cleanup-visible binding arrives
// with a DefId and same-spelled shadows therefore occupy distinct entries.
fn v_bind_def(
    mut ctx: VCtx, name: Str, def_id: Int?, kind: Int, span: Span
) {
    if rc_name_skippable(name) {
        return
    }
    let overwrite_span = span
    let mismatch_span = span
    let stored_span = span
    let idx = match def_id {
        some(id) => v_lookup_def(ctx, id),
        none => v_lookup(ctx, name)
    }
    if idx >= 0 {
        if ctx.kinds[idx] == K_OWNED &&
           ctx.states[idx] == S_MAYBE_MOVED {
            let rebind_span = span
            v_report(ctx, "rc-imbalance", true,
                "re-binding '${name}' overwrites an owned slot whose value is live on only some reachable paths",
                rebind_span)
        }
        if ctx.kinds[idx] == K_OWNED && ctx.states[idx] == S_LIVE {
            v_report(ctx, "x-shadow-overwrite", false,
                "re-binding '${name}' overwrites a live owned value (shared alloca; previous value leaks)", overwrite_span)
        }
        if ctx.kinds[idx] != kind && (ctx.kinds[idx] == K_OWNED || kind == K_OWNED) {
            v_report(ctx, "uaf-shadow-mismatch", true,
                "re-binding '${name}' flips droppability on the shared alloca (scope-end drop may free a non-owned value)", mismatch_span)
        }
        ctx.kinds.set(idx, kind)
        ctx.states.set(idx, S_LIVE)
    } else {
        ctx.names.push(name)
        ctx.def_ids.push(def_id)
        ctx.kinds.push(kind)
        ctx.states.push(S_LIVE)
        ctx.spans.push(stored_span)
    }
}

fn v_snapshot(ctx: VCtx) -> List<Int> {
    ctx.states.concat([])
}

fn v_restore(mut ctx: VCtx, snap: List<Int>) {
    let mut i = 0
    while i < ctx.states.len() && i < snap.len() {
        ctx.states.set(i, snap[i])
        i = i + 1
    }
}

fn v_states_equal(a: List<Int>, b: List<Int>, upto: Int) -> Bool {
    let mut i = 0
    let mut eq = true
    while i < upto && i < a.len() && i < b.len() {
        if a[i] != b[i] { eq = false }
        i = i + 1
    }
    eq
}

fn v_state_is_known(state: Int) -> Bool {
    state == S_LIVE || state == S_DROPPED || state == S_MOVED ||
    state == S_MAYBE_MOVED || state == S_OPTION_PENDING ||
    state == S_OPTION_DROPPED || state == S_OPTION_MOVED ||
    state == S_OPTION_MAYBE_MOVED
}

// Join one exact logical slot across reachable forward edges.  Only an owned
// LIVE/MOVED uncertainty is representable: Take nulls the moved edge, so one
// common Drop is safe.  DROPPED mixtures, non-owned mixtures, and Range-loop
// slot mixtures remain contradictions.  The MOVED recovery state is used only
// after the caller has emitted a fatal imbalance finding.
fn v_join_binding_state(kind: Int, left: Int, right: Int) -> (Int, Bool) {
    if !v_state_is_known(left) || !v_state_is_known(right) {
        panic("unreachable: RC verifier encountered an unknown binding state")
    }
    if kind == K_OPTION_CLEANUP {
        if left == right { return ((left, true)) }
        let left_pending = left == S_OPTION_PENDING ||
            left == S_OPTION_MOVED || left == S_OPTION_MAYBE_MOVED
        let right_pending = right == S_OPTION_PENDING ||
            right == S_OPTION_MOVED || right == S_OPTION_MAYBE_MOVED
        if left_pending && right_pending {
            return ((S_OPTION_MAYBE_MOVED, true))
        }
        return ((S_OPTION_MAYBE_MOVED, false))
    }
    if kind != K_OWNED &&
       (left == S_MAYBE_MOVED || right == S_MAYBE_MOVED) {
        panic("unreachable: non-owned RC slot entered MAYBE_MOVED state")
    }
    if left == right {
        return ((left, true))
    }
    let left_pending = left == S_LIVE || left == S_MOVED ||
        left == S_MAYBE_MOVED
    let right_pending = right == S_LIVE || right == S_MOVED ||
        right == S_MAYBE_MOVED
    if kind == K_OWNED && left_pending && right_pending {
        return ((S_MAYBE_MOVED, true))
    }
    ((S_MOVED, false))
}

fn v_join_forward_states(
    left: List<Int>, right: List<Int>, kinds: List<Int>, upto: Int
) -> (List<Int>, Bool) {
    if left.len() < upto || right.len() < upto || kinds.len() < upto {
        panic("unreachable: RC verifier state join shape mismatch")
    }
    let mut result = left.concat([])
    let mut valid = true
    let mut index = 0
    while index < upto {
        let joined = v_join_binding_state(
            kinds[index], left[index], right[index])
        result.set(index, joined.0)
        if !joined.1 { valid = false }
        index = index + 1
    }
    ((result, valid))
}

// Guard-false continues into the next arm after evaluating the guard, while a
// pattern miss preserves the incoming state.  Preserve LIVE/MOVED uncertainty
// for owned slots so a later unconditional Drop can discharge it exactly.
fn v_join_fallthrough_states(
    incoming: List<Int>, guarded: List<Int>, kinds: List<Int>, upto: Int
) -> (List<Int>, Bool) {
    v_join_forward_states(incoming, guarded, kinds, upto)
}

fn v_check_continue_backedges(
    mut ctx: VCtx, base: Int, entry: List<Int>, span: Span
) {
    let mut index = base
    while index < ctx.continue_snapshots.len() {
        match ctx.continue_snapshots.get(index) {
            some(snapshot) => if !v_states_equal(
                    entry, snapshot, entry.len()) {
                let continue_span = span
                v_report(ctx, "rc-imbalance", true,
                    "continue edge leaves enclosing RC binding states changed",
                    continue_span)
            },
            none => {}
        }
        index = index + 1
    }
    while ctx.continue_snapshots.len() > base {
        ctx.continue_snapshots.pop()
    }
}

fn v_check_break_edges(
    mut ctx: VCtx, base: Int, exit_state: List<Int>, span: Span
) -> List<Int> {
    let upto = exit_state.len()
    let mut merged = exit_state.concat([])
    let mut index = base
    while index < ctx.break_snapshots.len() {
        match ctx.break_snapshots.get(index) {
            some(snapshot) => {
                let joined = v_join_forward_states(
                    merged, snapshot, ctx.kinds, upto)
                if !joined.1 {
                    let break_span = span
                    v_report(ctx, "rc-imbalance", true,
                        "break edge leaves incompatible enclosing RC binding states",
                        break_span)
                }
                merged = joined.0
            },
            none => {}
        }
        index = index + 1
    }
    while ctx.break_snapshots.len() > base {
        ctx.break_snapshots.pop()
    }
    merged
}

// Lambda/handler construction reads every captured outer slot immediately.
// Their bodies are verified in isolated function scopes, so check availability
// against the construction-site state before entering that isolated scope.
fn v_check_exact_capture_reads(body: HExpr, mut ctx: VCtx) {
    let mut candidates: Set<Int> = set_new()
    for candidate in ctx.def_ids {
        match candidate {
            some(def_id) => {
                let candidate_def_id = def_id
                candidates.insert(candidate_def_id)
            },
            none => {}
        }
    }
    for capture in collect_exact_free_bindings(body, candidates) {
        let capture_def_id = capture.def_id
        let index = v_lookup_def(ctx, capture_def_id)
        if index >= 0 {
            let state = ctx.states[index]
            if !v_state_is_known(state) {
                panic("unreachable: RC verifier capture read saw unknown state")
            }
            let readable = if ctx.kinds[index] == K_OPTION_CLEANUP {
                state == S_OPTION_PENDING
            } else {
                state == S_LIVE
            }
            if !readable {
                let capture_span = capture.span
                v_report(ctx, "uaf-use-after-drop", true,
                    "capture of '${capture.name}' reads an owned slot that is not live on every reachable path",
                    capture_span)
            }
        }
    }
}

// ============================================================
// Type-level account exclusion (design.md §7.11 D1 rules ①② + #149 guard)
// ============================================================

fn v_type_excluded(ty: Type, externs: Set<Str>) -> Bool {
    if is_rc_excluded_type(ty, externs) {
        true
    } else if is_unresolved_var_type(ty) {
        true
    } else {
        match ty {
            Type::NeverType => true,
            _ => false,
        }
    }
}

// ============================================================
// POST-RC droppable-init classification
// ============================================================
//
// Mirror of perceus.is_droppable_init (the pass's PRE-RC binding-drop
// decision), adapted to POST-RC shapes — the ONE structural difference: a
// dropping block's tail has been hoisted by rc_block_inner into a fresh
// `let __rc_scope_N = <escape-processed tail>` and the syntactic tail is a
// bare Ident, so a Block-tail Ident classifies via the init of the LAST
// same-named Let/Var among the block's direct statements (the hoist), exactly
// like hir.is_fresh_owned_bool_value's post-RC Block arm.  (The pass-side
// `Ident => true` arm means "owner-bearing, will be Clone-wrapped at the
// escape"; post-RC that Clone is visible directly.)  KEEP IN SYNC with
// perceus.is_droppable_init — a drift shows up as self-verify findings.
fn v_exact_call_result_role(
    ownership: OwnershipMetadata, expr: HExpr
) -> Int? {
    match expr {
        HExpr::Call { callee_def_id, .. } => match callee_def_id {
            some(def_id) => match ownership.callable_result_role_by_def_id.get(
                    def_id) {
                some(role) => {
                    let exact_result_role = role
                    some(exact_result_role)
                },
                none => some(CALLABLE_RESULT_ROLE_UNKNOWN)
            },
            none => some(CALLABLE_RESULT_ROLE_UNKNOWN)
        },
        _ => none
    }
}

// Verifier-side fail-closed lookup. Production Perceus/codegen deliberately
// use hir.call_returns_borrowed, whose panic enforces their already-validated
// total metadata contract. The verifier must instead retain a fatal finding
// when a test mutation (or malformed input) removes that authority, without
// inventing a return mode from the FnType/name and without panicking before
// the findings can be emitted.
fn v_exact_call_return_ownership(
    ownership: OwnershipMetadata, callee_def_id: Int?
) -> Int {
    match callee_def_id {
        some(def_id) => match ownership.callable_by_def_id.get(def_id) {
            some(ownership_term) => callable_return_ownership(
                ownership, ownership_term),
            none => RETURN_OWNERSHIP_UNKNOWN
        },
        none => RETURN_OWNERSHIP_UNKNOWN
    }
}

// The shared production predicates below are intentionally strict. Guard
// their structurally recursive Call leaves so verify_rc can report missing
// exact metadata and continue conservatively instead of invoking a panic-only
// production contract. Only the wrapper shapes traversed by those predicates
// are followed; eager operands are classified independently by v_expr.
fn v_callable_return_contracts_total(
    expr: HExpr, ownership: OwnershipMetadata
) -> Bool {
    if !expr_has_reachable_value(expr) { return true }
    match expr {
        HExpr::Call { callee_def_id, .. } =>
            v_exact_call_return_ownership(ownership, callee_def_id) !=
                RETURN_OWNERSHIP_UNKNOWN,
        HExpr::Block { tail, .. } => match tail {
            some(value) => v_callable_return_contracts_total(value, ownership),
            none => true
        },
        HExpr::IfExpr { then_branch, else_branch, .. } => match else_branch {
            some(other) => v_callable_return_contracts_total(
                    then_branch, ownership) &&
                v_callable_return_contracts_total(other, ownership),
            none => true
        },
        HExpr::MatchExpr { arms, .. } => {
            for arm in arms {
                if !v_callable_return_contracts_total(arm.body, ownership) {
                    return false
                }
            }
            true
        },
        HExpr::UnsafeBlock { body, .. } =>
            v_callable_return_contracts_total(body, ownership),
        _ => true
    }
}

// Independent post-RC producer lattice. The only neutral value is the exact
// immortal Option::none constructor: a common Drop is a runtime no-op on that
// path and releases an owned `some(...)` sibling. Opaque producers never become
// droppable merely by sharing a control-flow node with an owner.
const V_DROP_PRODUCER_OWNED: Int = 0
const V_DROP_PRODUCER_NOOP_NONE: Int = 1
const V_DROP_PRODUCER_OPAQUE: Int = 2

fn v_merge_droppable_branch_classes(classes: List<Int?>) -> Int {
    let mut saw_value = false
    let mut saw_owned = false
    for maybe_class in classes {
        match maybe_class {
            some(class) => {
                saw_value = true
                if class == V_DROP_PRODUCER_OPAQUE {
                    return V_DROP_PRODUCER_OPAQUE
                }
                if class == V_DROP_PRODUCER_OWNED {
                    saw_owned = true
                }
            },
            none => {}
        }
    }
    if !saw_value {
        V_DROP_PRODUCER_OPAQUE
    } else if saw_owned {
        V_DROP_PRODUCER_OWNED
    } else {
        V_DROP_PRODUCER_NOOP_NONE
    }
}

fn v_droppable_branch_producer_class(
    body: HExpr, externs: Set<Str>, ownership: OwnershipMetadata
) -> Int? {
    if expr_diverges(body) {
        none
    } else {
        some(v_droppable_producer_class(body, externs, ownership))
    }
}

fn v_droppable_producer_class(
    init: HExpr, externs: Set<Str>, ownership: OwnershipMetadata
) -> Int {
    if !type_is_physical_rc_eligible(hexpr_type(init), externs) {
        return V_DROP_PRODUCER_OPAQUE
    }
    if is_option_none_ctor_ident(init) {
        return V_DROP_PRODUCER_NOOP_NONE
    }
    match init {
        HExpr::IfExpr { then_branch, else_branch, .. } => match else_branch {
            some(other) => v_merge_droppable_branch_classes([
                v_droppable_branch_producer_class(
                    then_branch, externs, ownership),
                v_droppable_branch_producer_class(
                    other, externs, ownership)
            ]),
            none => V_DROP_PRODUCER_OPAQUE
        },
        HExpr::MatchExpr { arms, .. } => {
            let mut classes: List<Int?> = []
            for arm in arms {
                classes.push(v_droppable_branch_producer_class(
                    arm.body, externs, ownership))
            }
            v_merge_droppable_branch_classes(classes)
        },
        HExpr::Block { stmts, tail, .. } => match tail {
            some(value) => match value {
                HExpr::Ident { def_id, .. } => match def_id {
                    some(id) => match v_block_local_init(stmts, id) {
                        some(local_init) => v_droppable_producer_class(
                            local_init, externs, ownership),
                                    none => if is_option_none_ctor_ident(value) {
                                        V_DROP_PRODUCER_NOOP_NONE
                                    } else if is_nullary_variant_ctor_ident(value) ||
                                              is_materialized_fn_value(value) {
                                        V_DROP_PRODUCER_OWNED
                                    } else {
                                        V_DROP_PRODUCER_OPAQUE
                                    }
                                },
                                none => if is_option_none_ctor_ident(value) {
                                    V_DROP_PRODUCER_NOOP_NONE
                                } else if is_nullary_variant_ctor_ident(value) ||
                                          is_materialized_fn_value(value) {
                                    V_DROP_PRODUCER_OWNED
                                } else {
                                    V_DROP_PRODUCER_OPAQUE
                    }
                },
                _ => v_droppable_producer_class(
                    value, externs, ownership)
            },
            none => V_DROP_PRODUCER_OPAQUE
        },
        _ => if v_droppable_leaf_init(init, externs, ownership) {
            V_DROP_PRODUCER_OWNED
        } else {
            V_DROP_PRODUCER_OPAQUE
        }
    }
}

fn v_droppable_init(
    init: HExpr, externs: Set<Str>, ownership: OwnershipMetadata
) -> Bool {
    v_droppable_producer_class(init, externs, ownership) ==
        V_DROP_PRODUCER_OWNED
}

fn v_droppable_leaf_init(
    init: HExpr, externs: Set<Str>, ownership: OwnershipMetadata
) -> Bool {
    let ty = hexpr_type(init)
    if !type_is_physical_rc_eligible(ty, externs) {
        return false
    }
    // Exact Option::none construction yields the immortal runtime singleton;
    // it is intentionally outside binding Drop accounting.
    if is_option_none_ctor_ident(init) {
        return false
    }
    // Exact slot ABI leaf: read/take results are owned even when an impl-level
    // K/V remains an unnamed TypeVar after zonk.
    match v_exact_call_result_role(ownership, init) {
        some(role) => if role == CALLABLE_RESULT_ROLE_FRESH_OWNED_SLOT {
            return true
        },
        none => {}
    }
    // A post-RC Clone is an explicit ring_dup and therefore owns its result;
    // do not let the audit #149 TypeVar guard erase that ownership proof.
    match init {
        HExpr::Clone { .. } | HExpr::Take { .. } => return true,
        _ => {}
    }
    if is_unresolved_var_type(ty) {
        return false
    }
    if is_materialized_fn_value(init) {
        return true
    }
    match init {
        HExpr::Ident { .. } => true,
        HExpr::FieldAccess { .. } => true,
        HExpr::IndexExpr { .. } => true,
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
        HExpr::Call { .. } => true,
        // B-104 D4: a dict construction is fresh-owned (mirrors
        // perceus.is_droppable_init) — the dict_lower binding is dropped at
        // scope end (runtime drop_dict).
        HExpr::DictConstruct { .. } => true,
        // B-104 D7: `&&`/`||` are lowered to IfExpr before RC — every BinOp
        // here is eager arith/compare with a fresh boxed result.
        HExpr::BinOp { .. } => true,
        HExpr::UnaryOp { .. } => true,
        HExpr::IfExpr { .. } | HExpr::MatchExpr { .. } |
        HExpr::Block { .. } => panic(
            "unreachable: verifier control-flow droppability bypassed producer lattice"),
        _ => false,
    }
}

// The init of the LAST direct Let/Var binding with this exact DefId in a
// statement list. Name-only lookup would let a same-spelled outer binding
// impersonate a pass-created hoist.
fn v_block_local_init(stmts: List<HStmt>, def_id: Int) -> HExpr? {
    let mut found: HExpr? = none
    for s in stmts {
        match s {
            HStmt::Let { def_id: binding_def_id, init, .. } => {
                match binding_def_id {
                    some(actual_def_id) => {
                        if actual_def_id == def_id {
                            let matched_init = init
                            found = some(matched_init)
                        }
                    },
                    none => {}
                }
            },
            HStmt::Var { def_id: binding_def_id, init, .. } => {
                match binding_def_id {
                    some(actual_def_id) => {
                        if actual_def_id == def_id {
                            let matched_init = init
                            found = some(matched_init)
                        }
                    },
                    none => {}
                }
            },
            _ => {},
        }
        if !stmt_reaches_next(s) { return found }
    }
    found
}

// Recover the value producer that preceded Perceus's synthetic tail hoist. The
// verifier does not trust membership in Perceus's cleanup list: it independently
// follows the exact synthetic DefId back to its direct Let initializer; the
// verifier-side predicate below then re-derives the no-op proof independently.
fn v_original_block_tail(stmts: List<HStmt>, tail: HExpr?) -> HExpr? {
    match tail {
        some(value) => {
            let tail_def_id = match value {
                HExpr::Ident { def_id, .. } => def_id,
                HExpr::Take { source_def_id, .. } => some(source_def_id),
                _ => none
            }
            match tail_def_id {
                some(def_id) => if is_synthetic_rc_def_id(def_id) {
                    match v_block_local_init(stmts, def_id) {
                        some(init) => some(init),
                        none => some(value)
                    }
                } else { some(value) },
                none => some(value)
            }
        },
        none => none
    }
}

fn v_block_tail_is_synthetic(stmts: List<HStmt>, tail: HExpr?) -> Bool {
    match tail {
        some(value) => {
            let tail_def_id = match value {
                HExpr::Ident { def_id, .. } => def_id,
                HExpr::Take { source_def_id, .. } => some(source_def_id),
                _ => none
            }
            match tail_def_id {
                some(def_id) => is_synthetic_rc_def_id(def_id) &&
                    v_block_local_init(stmts, def_id).is_some(),
                none => false
            }
        },
        none => false
    }
}

// Independent verifier-side owner-bearing decision. Unknown call authority is
// fail-closed instead of invoking Perceus's panic-only production predicate.
fn v_tail_is_owner_bearing(
    expr: HExpr, ownership: OwnershipMetadata
) -> Bool {
    let nullary_variant_ctor = is_nullary_variant_ctor_ident(expr)
    let option_none_ctor = is_option_none_ctor_ident(expr)
    let materialized_fn_value = is_materialized_fn_value(expr)
    match expr {
        HExpr::Ident { .. } => !nullary_variant_ctor &&
            !option_none_ctor && !materialized_fn_value,
        HExpr::FieldAccess { .. } => true,
        HExpr::IndexExpr { receiver, .. } => !is_str_index(receiver),
        HExpr::Call { callee_def_id, .. } =>
            v_exact_call_return_ownership(ownership, callee_def_id) !=
                RETURN_OWNERSHIP_OWNED,
        _ => false
    }
}

// Recompute the no-op escape proof from post-RC HIR without trusting Perceus's
// cleanup decision. In a borrowed parent, a Clone found only after following a
// synthetic cleanup hoist may have been inserted by the very decision under
// audit, so inspect its inner producer instead of accepting it circularly.
fn v_escape_is_noop_on_reachable_tail(
    expr: HExpr, ownership: OwnershipMetadata,
    reject_synthetic_clone: Bool
) -> Bool {
    if !expr_has_reachable_value(expr) { return true }
    match expr {
        HExpr::Clone { inner, .. } => if reject_synthetic_clone {
            v_escape_is_noop_on_reachable_tail(
                inner, ownership, reject_synthetic_clone)
        } else { true },
        HExpr::Take { .. } => true,
        HExpr::IfExpr { then_branch, else_branch, .. } => {
            if !v_escape_is_noop_on_reachable_tail(
                    then_branch, ownership, reject_synthetic_clone) {
                return false
            }
            match else_branch {
                some(other) => v_escape_is_noop_on_reachable_tail(
                    other, ownership, reject_synthetic_clone),
                none => true
            }
        },
        HExpr::MatchExpr { arms, .. } => {
            for arm in arms {
                if expr_has_reachable_value(arm.body) &&
                   !v_escape_is_noop_on_reachable_tail(
                        arm.body, ownership, reject_synthetic_clone) {
                    return false
                }
            }
            true
        },
        HExpr::Block { stmts, tail, .. } =>
            match v_original_block_tail(stmts, tail) {
            some(value) => v_escape_is_noop_on_reachable_tail(
                value, ownership, reject_synthetic_clone),
            none => true
        },
        HExpr::UnsafeBlock { body, .. } =>
            v_escape_is_noop_on_reachable_tail(
                body, ownership, reject_synthetic_clone),
        HExpr::TryCatch { .. } | HExpr::HandleExpr { .. } |
        HExpr::EffectOp { .. } => false,
        _ => !v_tail_is_owner_bearing(expr, ownership)
    }
}

fn v_block_option_cleanup_eligible(
    stmts: List<HStmt>, tail: HExpr?, mode: Int,
    ownership: OwnershipMetadata
) -> Bool {
    let synthetic = v_block_tail_is_synthetic(stmts, tail)
    match v_original_block_tail(stmts, tail) {
        some(value) => v_escape_is_noop_on_reachable_tail(
            value, ownership, synthetic && mode == M_BORROWED),
        none => true
    }
}

fn v_is_option_cleanup_var(
    name: Str, def_id: Int?, ty: Type, init: HExpr, block_eligible: Bool,
    boxed: Set<Int>, externs: Set<Str>
) -> Bool {
    if rc_name_skippable(name) || !block_eligible ||
       !type_is_physical_rc_eligible(ty, externs) ||
       !is_option_none_ctor_ident(init) {
        return false
    }
    match def_id {
        some(id) => !boxed.contains(id),
        none => false
    }
}

// ============================================================
// Position handlers
// ============================================================

// CONSUMED position: the parent takes ownership.  A bare BORROW here means the
// pass escaped an owner-bearing value without a Clone — the sink's later drop
// frees a reference owned elsewhere (UAF direction).
fn v_consume(expr: HExpr, mut ctx: VCtx) -> Int {
    let cls = v_expr(expr, M_CONSUMED, ctx)
    if cls == CLS_BORROW {
        v_report(ctx, "uaf-escaped-borrow", true,
            "a borrowed value escapes into an owning position without a Clone", hexpr_span(expr))
    }
    cls
}

// BORROWED position: the parent only reads.  An OWNED value here has no
// consumer — a leak.  `exempt` names the documented exemption class; "" means
// the position is supposed to be fully covered by the ANF pass → fatal.
fn v_borrow(expr: HExpr, exempt: Str, mut ctx: VCtx) -> Int {
    let missed_materialization =
        exempt == "" &&
        v_callable_return_contracts_total(expr, ctx.ownership) &&
        is_materializable_fn_value(expr, ctx.externs, ctx.ownership)
    let cls = v_expr(expr, M_BORROWED, ctx)
    if missed_materialization {
        v_report(ctx, "leak-temp", true,
            "fresh callable control-flow value survived ANF in a read position", hexpr_span(expr))
    } else if cls == CLS_OWNED {
        if exempt == "" {
            v_report(ctx, "leak-temp", true,
                "owned temporary is never consumed (no binding, no drop) in a read position", hexpr_span(expr))
        } else {
            let exempt_class = exempt
            v_report(ctx, exempt_class, false,
                "owned value in a non-consuming position (documented leak class)", hexpr_span(expr))
        }
    }
    cls
}

// CONDITION position (while-cond / match-guard): the only positions where an
// owned value may legitimately stay inline — codegen drops the Bool box right
// after its unbox, gated on is_fresh_owned_bool_value (Stage 2 E round).  The
// verifier accepts an owned condition exactly when that predicate certifies
// the codegen drop; anything else owned here is a real gap.
fn v_cond(expr: HExpr, mut ctx: VCtx) {
    let cls = v_expr(expr, M_BORROWED, ctx)
    if cls == CLS_OWNED {
        if !v_callable_return_contracts_total(expr, ctx.ownership) ||
           is_fresh_owned_bool_value(ctx.ownership, expr) == false {
            v_report(ctx, "leak-temp", true,
                "owned condition value not covered by the codegen post-unbox drop", hexpr_span(expr))
        }
    }
}

// ============================================================
// Expressions
// ============================================================

fn v_is_transfer_expr(expr: HExpr) -> Bool {
    match expr {
        HExpr::Take { .. } => true,
        // Fresh producers are normalised by the ownership planner to one
        // deterministic slot whose block tail is the exact Take.
        HExpr::Block { tail, .. } => match tail {
            some(value) => v_is_transfer_expr(value),
            none => false
        },
        _ => false
    }
}

// Independent post-RC spread check.  A direct binding/projection is a valid
// borrowed source.  Every inline fresh producer should already have become an
// ANF binding whose later Drop is visible to the ordinary linear account.
const V_SPREAD_SOURCE_ALL_BORROW: Int = 0
const V_SPREAD_SOURCE_ALL_FRESH: Int = 1
const V_SPREAD_SOURCE_MIXED_OR_UNKNOWN: Int = 2
const V_SPREAD_SOURCE_NO_REACHABLE_VALUE: Int = 3

fn v_merge_spread_source_classifications(left: Int, right: Int) -> Int {
    if left == V_SPREAD_SOURCE_NO_REACHABLE_VALUE { return right }
    if right == V_SPREAD_SOURCE_NO_REACHABLE_VALUE { return left }
    if left == V_SPREAD_SOURCE_MIXED_OR_UNKNOWN ||
       right == V_SPREAD_SOURCE_MIXED_OR_UNKNOWN {
        return V_SPREAD_SOURCE_MIXED_OR_UNKNOWN
    }
    if left == right { left } else { V_SPREAD_SOURCE_MIXED_OR_UNKNOWN }
}

fn v_spread_match_arm_classification(
    arm: HMatchArm, mut ctx: VCtx
) -> Int {
    match arm {
        HMatchArm { guard, body, .. } => {
            match guard {
                some(value) => if !expr_has_reachable_value(value) {
                    return V_SPREAD_SOURCE_NO_REACHABLE_VALUE
                },
                none => {}
            }
            v_spread_branch_classification(body, ctx)
        }
    }
}

fn v_spread_block_local_classification(
    stmts: List<HStmt>, target_id: Int, mut ctx: VCtx, fuel: Int
) -> Int? {
    if fuel <= 0 { return some(V_SPREAD_SOURCE_MIXED_OR_UNKNOWN) }
    for stmt in stmts {
        match stmt {
            HStmt::Let { def_id: some(local_id), init, .. } => {
                if local_id == target_id {
                    let identity_init = init
                    let classification_init = init
                    match identity_init {
                        HExpr::Take { source_def_id, .. } =>
                            return match v_spread_block_local_classification(
                                    stmts, source_def_id, ctx, fuel - 1) {
                                some(value) => {
                                    let stored_classification = value
                                    some(stored_classification)
                                },
                                // A Take from an exact slot outside this block
                                // is the post-plan proof that the local received
                                // one whole owned value.
                                none => some(V_SPREAD_SOURCE_ALL_FRESH)
                            },
                        HExpr::Ident { .. } =>
                            return some(V_SPREAD_SOURCE_MIXED_OR_UNKNOWN),
                        _ => return some(v_spread_source_classification(
                            classification_init, ctx))
                    }
                }
            },
            HStmt::Var { def_id: some(local_id), .. } => {
                if local_id == target_id {
                    return some(V_SPREAD_SOURCE_MIXED_OR_UNKNOWN)
                }
            },
            _ => {}
        }
    }
    none
}

fn v_spread_block_source_classification(
    stmts: List<HStmt>, tail: HExpr?, mut ctx: VCtx
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
            let fallback = v_spread_source_classification(
                classification_value, ctx)
            (local_id, fallback)
        },
        none => return V_SPREAD_SOURCE_MIXED_OR_UNKNOWN
    }
    let mut classification = initial_classification
    match tail_local_id {
        some(target_id) => {
            let search_fuel = stmts.len() + 1
            match v_spread_block_local_classification(
                stmts, target_id, ctx, search_fuel) {
            some(init_classification) => {
                classification = if init_classification ==
                        V_SPREAD_SOURCE_ALL_FRESH ||
                        init_classification ==
                        V_SPREAD_SOURCE_NO_REACHABLE_VALUE {
                    init_classification
                } else {
                    V_SPREAD_SOURCE_MIXED_OR_UNKNOWN
                }
            },
            none => {}
            }
        },
        none => {}
    }
    classification
}

fn v_spread_source_classification(
    expr: HExpr, mut ctx: VCtx
) -> Int {
    let reachability_expr = expr
    let typed_expr = expr
    let option_expr = expr
    let role_expr = expr
    let shape_expr = expr
    if !expr_has_reachable_value(reachability_expr) {
        return V_SPREAD_SOURCE_NO_REACHABLE_VALUE
    }
    let ty = hexpr_type(typed_expr)
    if !type_is_physical_rc_eligible(ty, ctx.externs) ||
       is_option_none_ctor_ident(option_expr) {
        return V_SPREAD_SOURCE_ALL_BORROW
    }
    match v_exact_call_result_role(ctx.ownership, role_expr) {
        some(role) => {
            if role == CALLABLE_RESULT_ROLE_FRESH_OWNED_SLOT {
                return V_SPREAD_SOURCE_ALL_FRESH
            } else if role == CALLABLE_RESULT_ROLE_UNKNOWN &&
                      is_unresolved_var_type(ty) {
                return V_SPREAD_SOURCE_MIXED_OR_UNKNOWN
            }
        },
        none => {}
    }
    if is_unresolved_var_type(ty) {
        return V_SPREAD_SOURCE_MIXED_OR_UNKNOWN
    }
    match shape_expr {
        HExpr::Ident { .. } | HExpr::FieldAccess { .. } |
        HExpr::IndexExpr { .. } | HExpr::Take { .. } =>
            V_SPREAD_SOURCE_ALL_BORROW,
        HExpr::Call { callee_def_id, .. } => {
            let return_ownership = v_exact_call_return_ownership(
                ctx.ownership, callee_def_id)
            if return_ownership == RETURN_OWNERSHIP_BORROWED {
                V_SPREAD_SOURCE_ALL_BORROW
            } else if return_ownership == RETURN_OWNERSHIP_OWNED {
                V_SPREAD_SOURCE_ALL_FRESH
            } else {
                V_SPREAD_SOURCE_MIXED_OR_UNKNOWN
            }
        },
        HExpr::StructLit { .. } |
        HExpr::NamedVariantConstruct { .. } |
        HExpr::ListLit { .. } | HExpr::TupleLit { .. } |
        HExpr::RangeExpr { .. } | HExpr::StringInterp { .. } |
        HExpr::Lambda { .. } | HExpr::DictConstruct { .. } |
        HExpr::BinOp { .. } | HExpr::UnaryOp { .. } |
        HExpr::IntLit { .. } | HExpr::FloatLit { .. } |
        HExpr::StrLit { .. } | HExpr::BoolLit { .. } |
        HExpr::Clone { .. } => V_SPREAD_SOURCE_ALL_FRESH,
        HExpr::Block { stmts, tail, .. } =>
            v_spread_block_source_classification(stmts, tail, ctx),
        HExpr::IfExpr { then_branch, else_branch, .. } => {
            let mut classification =
                v_spread_branch_classification(then_branch, ctx)
            match else_branch {
                some(other) => {
                    classification = v_merge_spread_source_classifications(
                        classification,
                        v_spread_branch_classification(other, ctx))
                },
                none => return V_SPREAD_SOURCE_MIXED_OR_UNKNOWN
            }
            classification
        },
        HExpr::MatchExpr { arms, .. } => {
            let mut classification = V_SPREAD_SOURCE_NO_REACHABLE_VALUE
            for arm in arms {
                classification = v_merge_spread_source_classifications(
                    classification,
                    v_spread_match_arm_classification(arm, ctx))
            }
            classification
        },
        HExpr::UnsafeBlock { body, .. } =>
            v_spread_source_classification(body, ctx),
        _ => V_SPREAD_SOURCE_MIXED_OR_UNKNOWN
    }
}

fn v_spread_branch_classification(
    body: HExpr, mut ctx: VCtx
) -> Int {
    if expr_diverges(body) {
        V_SPREAD_SOURCE_NO_REACHABLE_VALUE
    } else {
        v_spread_source_classification(body, ctx)
    }
}

fn v_expr(expr: HExpr, mode: Int, mut ctx: VCtx) -> Int {
    let nullary_variant_ctor = is_nullary_variant_ctor_ident(expr)
    let option_none_ctor = is_option_none_ctor_ident(expr)
    let materialized_fn_value = is_materialized_fn_value(expr)
    match expr {
        HExpr::IntLit { ty, .. } => v_cls_of_fresh(ty, ctx.externs),
        HExpr::FloatLit { ty, .. } => v_cls_of_fresh(ty, ctx.externs),
        HExpr::StrLit { ty, .. } => v_cls_of_fresh(ty, ctx.externs),
        HExpr::BoolLit { ty, .. } => v_cls_of_fresh(ty, ctx.externs),

        HExpr::Ident { name, def_id, ty, span, .. } => {
            // Inference represents a fieldless enum construction as an Ident,
            // but both native backends call its zero-argument constructor.  It
            // is therefore a fresh owned production, not a binding/global read.
            // Option::none is distinct: exact identity selects the immortal
            // runtime singleton, so it is outside the physical RC account.
            if option_none_ctor {
                CLS_EXCLUDED
            } else if nullary_variant_ctor || materialized_fn_value {
                v_cls_of_fresh(ty, ctx.externs)
            } else {
                v_ident(name, def_id, ty, span, mode, ctx)
            }
        },

        HExpr::Take { name, source_def_id, ty, span, .. } => {
            let index = v_lookup_def(ctx, source_def_id)
            if index < 0 {
                let take_span = span
                v_report(ctx, "uaf-take-unknown", true,
                    "Take of '${name}' has no exact in-scope DefId slot",
                    take_span)
                CLS_OPAQUE
            } else if ctx.kinds[index] == K_BORROW {
                let take_span = span
                v_report(ctx, "uaf-take-borrow", true,
                    "Take of borrowed binding '${name}'", take_span)
                CLS_BORROW
            } else if ctx.kinds[index] == K_OPTION_CLEANUP {
                if ctx.states[index] != S_OPTION_PENDING {
                    let take_span = span
                    v_report(ctx, "uaf-double-take", true,
                        "second Take of cleanup-active Option '${name}' on the same path",
                        take_span)
                    CLS_BORROW
                } else {
                    if mode != M_CONSUMED {
                        let take_span = span
                        v_report(ctx, "leak-take-position", true,
                            "Take of '${name}' appears in a non-consuming position",
                            take_span)
                    }
                    ctx.states.set(index, S_OPTION_MOVED)
                    CLS_OWNED
                }
            } else if ctx.states[index] != S_LIVE {
                let take_span = span
                v_report(ctx, "uaf-double-take", true,
                    "second Take of '${name}' on the same path", take_span)
                CLS_BORROW
            } else {
                if mode != M_CONSUMED {
                    let take_span = span
                    v_report(ctx, "leak-take-position", true,
                        "Take of '${name}' appears in a non-consuming position",
                        take_span)
                }
                ctx.states.set(index, S_MOVED)
                if ctx.kinds[index] == K_OWNED ||
                   ctx.kinds[index] == K_LOOP_FRESH {
                    CLS_OWNED
                } else if v_type_excluded(ty, ctx.externs) ||
                          !type_is_physical_rc_eligible(ty, ctx.externs) {
                    CLS_EXCLUDED
                } else {
                    // A deliberately non-droppable control-flow binding can
                    // still be invalidated exactly; its RC class remains
                    // outside the verifier's proof.
                    CLS_OPAQUE
                }
            }
        },

        HExpr::BinOp { left, right, ty, .. } => {
            // Eager arith/compare: operands are consuming-borrows (the op
            // unboxes them; post-ANF they are materialised Idents/borrows).
            // `&&`/`||` never reach post-RC HIR (B-104 D7: andor_lower rewrites
            // them to IfExpr at checker end) — an unexpected one would surface
            // here as a leak-temp finding on its owned RHS.
            v_borrow(left, "", ctx)
            v_borrow(right, "", ctx)
            v_cls_of_fresh(ty, ctx.externs)
        },

        HExpr::UnaryOp { operand, ty, .. } => {
            v_borrow(operand, "", ctx)
            v_cls_of_fresh(ty, ctx.externs)
        },

        HExpr::Call { callee, callee_def_id, args, ty, span, .. } => {
            // ANF materialises every fresh callee (including checker-marked
            // wrappers and Call-produced closures). Any owned callee still
            // inline here is therefore a fatal accounting gap.
            let is_method = match callee {
                HExpr::FieldAccess { receiver, .. } => {
                    let receiver_transfer = v_call_param_transfer(
                        ctx, callee_def_id, 0, span)
                    v_call_edge(receiver, receiver_transfer.0,
                        receiver_transfer.1, ctx, span)
                    true
                },
                _ => {
                    v_borrow(callee, "", ctx)
                    false
                }
            }
            if !is_method && args.len() == 0 {
                let _ = v_call_param_transfer(ctx, callee_def_id, 0, span)
            }
            let result_role = match callee_def_id {
                some(def_id) => match ctx.ownership
                        .callable_result_role_by_def_id.get(def_id) {
                    some(role) => role,
                    none => {
                        let missing_exact_result_role_span = span
                        v_report(ctx, "uaf-call-result-role", true,
                            "exact callable DefId has no semantic result role",
                            missing_exact_result_role_span)
                        CALLABLE_RESULT_ROLE_UNKNOWN
                    }
                },
                none => {
                    let missing_call_def_id_span = span
                    v_report(ctx, "uaf-call-result-role", true,
                        "call has no exact DefId for semantic result role",
                        missing_call_def_id_span)
                    CALLABLE_RESULT_ROLE_UNKNOWN
                }
            }
            let mut index = 0
            for a in args {
                let descriptor_index = index + if is_method { 1 } else { 0 }
                let expected_transfer = v_call_param_transfer(
                    ctx, callee_def_id, descriptor_index, span)
                v_call_edge(a, expected_transfer.0,
                    expected_transfer.1, ctx, span)
                index = index + 1
            }
            if result_role == CALLABLE_RESULT_ROLE_FRESH_OWNED_SLOT {
                CLS_OWNED
            } else if result_role == CALLABLE_RESULT_ROLE_UNKNOWN &&
                      is_unresolved_var_type(ty) {
                let unresolved_result_role_span = span
                v_report(ctx, "uaf-call-result-role", true,
                    "unresolved generic call result has unknown semantic ownership role",
                    unresolved_result_role_span)
                CLS_OPAQUE
            } else {
                let return_ownership = v_exact_call_return_ownership(
                    ctx.ownership, callee_def_id)
                if return_ownership == RETURN_OWNERSHIP_BORROWED {
                    CLS_BORROW
                } else if return_ownership == RETURN_OWNERSHIP_OWNED {
                    v_cls_of_fresh(ty, ctx.externs)
                } else {
                    CLS_OPAQUE
                }
            }
        },

        HExpr::FieldAccess { receiver, ty, .. } => {
            v_borrow(receiver, "", ctx)
            if v_type_excluded(ty, ctx.externs) { CLS_EXCLUDED } else { CLS_BORROW }
        },

        // B-104 D4: a dict construction is a FRESH owned TUPLE-of-closures.  It
        // is a leaf — its inner DictRefs are borrows of dict params / locals /
        // module singletons (no sub-expressions to account).  It enters the
        // normal LEAK/UAF/BALANCE account: dict_lower binds it via `let
        // __ring_dictlocal_N`, perceus scope-end-drops the binding (exactly-once
        // consumption); an unconsumed construct is reported like any owned temp.
        HExpr::DictConstruct { ty, .. } => v_cls_of_fresh(ty, ctx.externs),

        HExpr::IndexExpr { receiver, index, ty, .. } => {
            v_borrow(receiver, "", ctx)
            v_borrow(index, "", ctx)
            if v_type_excluded(ty, ctx.externs) {
                CLS_EXCLUDED
            } else {
                // D1 rule ③: str[i] allocates a fresh 1-char string; list/map
                // indexing returns a borrowed element pointer.
                if is_str_index(receiver) { v_cls_of_fresh(ty, ctx.externs) } else { CLS_BORROW }
            }
        },

        HExpr::StructLit { fields, spread, ty, span, .. } => {
            let mut fields_reachable = true
            match spread {
                some(s) => {
                    let materialization_check = s
                    let borrow_source = s
                    let classification = v_spread_source_classification(
                        materialization_check, ctx)
                    if classification == V_SPREAD_SOURCE_ALL_FRESH {
                        let leaked_spread_span = span
                        v_report(ctx, "leak-spread-source", true,
                            "fresh spread source was not materialized into one cleanup-visible binding",
                            leaked_spread_span)
                    } else if classification ==
                              V_SPREAD_SOURCE_MIXED_OR_UNKNOWN {
                        let invalid_spread_span = span
                        v_report(ctx, "invalid-spread-source", true,
                            "spread source has mixed or unknown ownership across reachable branches",
                            invalid_spread_span)
                    }
                    v_borrow(borrow_source, "", ctx)
                    if classification ==
                            V_SPREAD_SOURCE_NO_REACHABLE_VALUE {
                        fields_reachable = false
                    }
                    CLS_EXCLUDED
                },
                none => CLS_EXCLUDED,
            }
            if fields_reachable {
                for f in fields { v_consume(f.value, ctx) }
            }
            v_cls_of_fresh(ty, ctx.externs)
        },

        HExpr::NamedVariantConstruct { fields, spread, ty, span, .. } => {
            let mut fields_reachable = true
            match spread {
                some(s) => {
                    let materialization_check = s
                    let borrow_source = s
                    let classification = v_spread_source_classification(
                        materialization_check, ctx)
                    if classification == V_SPREAD_SOURCE_ALL_FRESH {
                        let leaked_variant_spread_span = span
                        v_report(ctx, "leak-spread-source", true,
                            "fresh variant spread source was not materialized into one cleanup-visible binding",
                            leaked_variant_spread_span)
                    } else if classification ==
                              V_SPREAD_SOURCE_MIXED_OR_UNKNOWN {
                        let invalid_variant_spread_span = span
                        v_report(ctx, "invalid-spread-source", true,
                            "variant spread source has mixed or unknown ownership across reachable branches",
                            invalid_variant_spread_span)
                    }
                    v_borrow(borrow_source, "", ctx)
                    if classification ==
                            V_SPREAD_SOURCE_NO_REACHABLE_VALUE {
                        fields_reachable = false
                    }
                    CLS_EXCLUDED
                },
                none => CLS_EXCLUDED,
            }
            if fields_reachable {
                for f in fields { v_consume(f.value, ctx) }
            }
            v_cls_of_fresh(ty, ctx.externs)
        },

        HExpr::ListLit { elements, ty, .. } => {
            for e in elements { v_consume(e, ctx) }
            v_cls_of_fresh(ty, ctx.externs)
        },

        HExpr::TupleLit { elements, ty, .. } => {
            for e in elements { v_consume(e, ctx) }
            v_cls_of_fresh(ty, ctx.externs)
        },

        HExpr::RangeExpr { start, end, ty, .. } => {
            v_consume(start, ctx)
            v_consume(end, ctx)
            v_cls_of_fresh(ty, ctx.externs)
        },

        HExpr::StringInterp { parts, ty, .. } => {
            for p in parts {
                match p {
                    HStringInterpPart::Expression(e) => { v_borrow(e, "", ctx) },
                    HStringInterpPart::Literal(s) => 0,
                }
            }
            v_cls_of_fresh(ty, ctx.externs)
        },

        HExpr::Lambda { params, body, ty, .. } => {
            // Fresh function scope.  Captures are dup'd by gen_lambda at
            // construction and released by drop_closure_env (balanced — B-098
            // closure model); inside the body, captured outer names come
            // through the env, so the body is verified in isolation.
            let capture_body = body
            let scope_body = body
            v_check_exact_capture_reads(capture_body, ctx)
            v_fn_scope(params, scope_body, "${ctx.fn_name}/<lambda>",
                ctx.boxed, ctx.externs, ctx.ownership, ctx.findings)
            v_cls_of_fresh(ty, ctx.externs)
        },

        HExpr::Clone { inner, ty, span, .. } => {
            v_expr(inner, M_BORROWED, ctx)
            if type_may_own(ctx.ownership, ty) {
                let clone_span = span
                v_report(ctx, "uaf-clone-owner-bearing", true,
                    "implicit Clone duplicates an owner-bearing value",
                    clone_span)
            }
            // Clone is an explicit ring_dup.  Unit/extern exclusions still
            // apply, but an unnamed TypeVar result remains provably owned.
            if !type_is_physical_rc_eligible(ty, ctx.externs) {
                CLS_EXCLUDED
            } else {
                CLS_OWNED
            }
        },

        HExpr::Block { .. } => {
            let r = v_block(expr, mode, ctx)
            r.0
        },

        HExpr::IfExpr { condition, then_branch, else_branch, ty, span, .. } => {
            v_borrow(condition, "", ctx)
            let snap0 = v_snapshot(ctx)
            let rt = v_cf_branch(then_branch, mode, ctx)
            let snap_t = v_snapshot(ctx)
            v_restore(ctx, snap0)
            let re = match else_branch {
                some(eb) => v_cf_branch(eb, mode, ctx),
                none => ((CLS_EXCLUDED, false)),
            }
            let snap_e = v_snapshot(ctx)
            v_merge_two(ctx, rt.1, snap_t, re.1, snap_e, snap0, span)
            v_cf_class(ty, [rt, re], mode, ctx)
        },

        HExpr::MatchExpr { scrutinee, arms, ty, span, .. } => {
            v_borrow(scrutinee, "", ctx)
            let snap0 = v_snapshot(ctx)
            let mut results: List<(Int, Bool)> = []
            let mut ref_snap: List<Int> = []
            let mut have_ref = false
            let mut next_arm_snap = snap0
            for arm in arms {
                let incoming = next_arm_snap
                v_restore(ctx, incoming)
                v_push_frame(ctx)
                v_bind_pattern_bindings(ctx, arm.bindings, arm.span)
                let guard_reaches_value =
                    hmatch_arm_body_is_reachable(arm)
                match arm.guard {
                    some(g) => {
                        v_cond(g, ctx)
                        if guard_reaches_value {
                            let guard_join = v_join_fallthrough_states(
                                incoming, v_snapshot(ctx), ctx.kinds,
                                snap0.len())
                            if !guard_join.1 {
                                let guard_span = arm.span
                                v_report(ctx, "rc-imbalance", true,
                                    "match guard fall-through leaves incompatible enclosing RC binding states",
                                    guard_span)
                            }
                            next_arm_snap = guard_join.0
                        }
                    },
                    none => {},
                }
                if guard_reaches_value {
                    let r = v_cf_branch(arm.body, mode, ctx)
                    v_pop_frame(ctx)
                    let arm_diverges = r.1
                    let arm_result = r
                    results.push(arm_result)
                    if arm_diverges == false {
                        if have_ref {
                            let cur = v_snapshot(ctx)
                            let joined = v_join_forward_states(
                                ref_snap, cur, ctx.kinds, snap0.len())
                            if !joined.1 {
                                let imbalance_span = span
                                v_report(ctx, "rc-imbalance", true,
                                    "match arms leave incompatible enclosing RC binding states",
                                    imbalance_span)
                            }
                            ref_snap = joined.0
                        } else {
                            ref_snap = v_snapshot(ctx)
                            have_ref = true
                        }
                    }
                } else {
                    // The guard was fully checked, but no guard-false or arm-
                    // body edge exists. Pattern miss alone reaches later arms.
                    v_pop_frame(ctx)
                }
            }
            if have_ref { v_restore(ctx, ref_snap) } else { v_restore(ctx, snap0) }
            v_cf_class(ty, results, mode, ctx)
        },

        HExpr::TryCatch { body, arms, ty, span, .. } => {
            // The try/catch value is never owned by its consumer (abort-path
            // aliasing — B-002; is_droppable_init excludes TryCatch).  Arms run
            // from an aborted mid-body state: approximate with the entry state
            // and discard their state effects.
            // #167: after each arm, check that enclosing owned bindings were not
            // dropped/moved — a catch arm that consumes an outer binding causes
            // double-free (scope-end will drop it again).
            let snap0 = v_snapshot(ctx)
            v_cf_branch(body, mode, ctx)
            let snap_body = v_snapshot(ctx)
            let mut next_arm_snap = snap0
            for arm in arms {
                let incoming = next_arm_snap
                v_restore(ctx, incoming)
                v_push_frame(ctx)
                v_bind_pattern_bindings(ctx, arm.bindings, arm.span)
                let guard_reaches_value =
                    hmatch_arm_body_is_reachable(arm)
                match arm.guard {
                    some(g) => {
                        v_cond(g, ctx)
                        if guard_reaches_value {
                            let guard_join = v_join_fallthrough_states(
                                incoming, v_snapshot(ctx), ctx.kinds,
                                snap0.len())
                            if !guard_join.1 {
                                let guard_span = arm.span
                                v_report(ctx, "rc-imbalance", true,
                                    "catch guard fall-through leaves incompatible enclosing RC binding states",
                                    guard_span)
                            }
                            next_arm_snap = guard_join.0
                        }
                    },
                    none => {},
                }
                if guard_reaches_value {
                    let arm_result = v_cf_branch(arm.body, mode, ctx)
                    v_pop_frame(ctx)
                    if !arm_result.1 {
                        // #167: only a normally returning arm rejoins the outer
                        // scope; detect it altering any enclosing cleanup state.
                        let snap_arm = v_snapshot(ctx)
                        let mut ci = 0
                        while ci < snap0.len() && ci < snap_arm.len() {
                            let ordinary_owned_changed =
                                snap0[ci] == S_LIVE && snap_arm[ci] != S_LIVE
                            let option_cleanup_changed =
                                ctx.kinds[ci] == K_OPTION_CLEANUP &&
                                snap_arm[ci] != snap0[ci]
                            if ordinary_owned_changed || option_cleanup_changed {
                                v_report(ctx, "rc-imbalance", true,
                                    "catch arm drops/moves enclosing owned binding '${ctx.names[ci]}' — scope-end will double-free (#167 class)", arm.span)
                            }
                            ci = ci + 1
                        }
                    }
                } else {
                    // Pattern miss can continue, but the diverging guard has
                    // no false edge and its dependent catch body never runs.
                    v_pop_frame(ctx)
                }
            }
            v_restore(ctx, snap_body)
            if v_type_excluded(ty, ctx.externs) { CLS_EXCLUDED } else { CLS_OPAQUE }
        },

        HExpr::HandleExpr { body, handlers, ty, .. } => {
            let snap0 = v_snapshot(ctx)
            v_cf_branch(body, mode, ctx)
            let snap_body = v_snapshot(ctx)
            for h in handlers {
                v_restore(ctx, snap0)
                let capture_body = h.body
                let handler_for_scope = h
                v_check_exact_capture_reads(capture_body, ctx)
                v_handler_scope(handler_for_scope, ctx)
            }
            v_restore(ctx, snap_body)
            if v_type_excluded(ty, ctx.externs) { CLS_EXCLUDED } else { CLS_OPAQUE }
        },

        HExpr::EffectOp { args, ty, .. } => {
            // Args are borrow-passed to the handler closure; fresh-owned args
            // are materialised by ANF (Stage 2 D round) → bare owned arg = gap.
            for a in args { v_borrow(a, "", ctx) }
            if v_type_excluded(ty, ctx.externs) { CLS_EXCLUDED } else { CLS_OPAQUE }
        },

        // B-113: return in expression position (match arm).
        // The return value is consumed (escaped to the caller), and the path
        // diverges — same accounting as HStmt::Return in v_stmt.
        HExpr::ReturnExpr { value, span, .. } => {
            match value {
                some(v) => { let _ = v_consume(v, ctx) },
                none => {},
            }
            // #187: check enclosing owned bindings are dropped before return
            // (mirrors HStmt::Return logic in v_stmt).
            let mut i = 0
            while i < ctx.names.len() {
                if (ctx.kinds[i] == K_OWNED ||
                    ctx.kinds[i] == K_LOOP_FRESH) &&
                   (ctx.states[i] == S_LIVE ||
                    ctx.states[i] == S_MAYBE_MOVED) {
                    let return_span = span
                    v_report(ctx, "leak-return", true,
                        "owned binding '${ctx.names[i]}' is live (not dropped) at this return", return_span)
                }
                if ctx.kinds[i] == K_OPTION_CLEANUP &&
                   ctx.states[i] != S_OPTION_DROPPED {
                    let return_span = span
                    v_report(ctx, "leak-option-exit", true,
                        "cleanup-active Option binding '${ctx.names[i]}' has no exit Drop at this return",
                        return_span)
                }
                i = i + 1
            }
            CLS_EXCLUDED
        },

        // B-125: unsafe block — transparent wrapper, verify the body
        HExpr::UnsafeBlock { body, ty, .. } => {
            v_cf_branch(body, mode, ctx)
            if v_type_excluded(ty, ctx.externs) { CLS_EXCLUDED } else { CLS_OPAQUE }
        },
    }
}
fn v_cls_of_fresh(ty: Type, externs: Set<Str>) -> Int {
    if v_type_excluded(ty, externs) ||
       !type_is_physical_rc_eligible(ty, externs) {
        CLS_EXCLUDED
    } else {
        CLS_OWNED
    }
}

// (v_andor retired 2026-06-13 — B-104 D7: `&&`/`||` are lowered to IfExpr by
//  andor_lower at checker end and never reach post-RC HIR; the x-andor
//  exemption class retired with it.)

// Identifier read/move.
fn v_ident(
    name: Str, def_id: Int?, ty: Type, span: Span,
    mode: Int, mut ctx: VCtx
) -> Int {
    let idx = match def_id {
        some(id) => v_lookup_def(ctx, id),
        none => v_lookup(ctx, name)
    }
    if idx < 0 {
        // Module-level fn / const / enum-variant reference: reads borrow; the
        // pass Clone-wraps owner-bearing escapes, so a bare consumed global is
        // flagged by v_consume via the BORROW class.
        if v_type_excluded(ty, ctx.externs) {
            return CLS_EXCLUDED
        }
        return CLS_BORROW
    }

    if ctx.kinds[idx] == K_OPTION_CLEANUP {
        if ctx.states[idx] != S_OPTION_PENDING {
            let read_span = span
            v_report(ctx, "uaf-use-after-drop", true,
                "read of cleanup-active Option '${name}' after Drop/Take on at least one reachable path",
                read_span)
        }
        // This slot is an existing owner read. A consuming edge must carry the
        // ownership planner's exact Take/Clone; a bare Ident remains a borrow.
        return CLS_BORROW
    }

    // Exact logical slot state is authoritative before any physical RC/type
    // exclusion. Otherwise a Ptr/extern K_NONOWNED slot could hide a read after
    // Take merely because its payload lies outside the RC account.
    if ctx.states[idx] == S_DROPPED {
        let read_span = span
        v_report(ctx, "uaf-use-after-drop", true,
            "read of '${name}' after its Drop", read_span)
        if !type_is_physical_rc_eligible(ty, ctx.externs) {
            return CLS_EXCLUDED
        }
        return CLS_BORROW
    }
    if ctx.states[idx] == S_MOVED {
        let read_span = span
        v_report(ctx, "uaf-use-after-drop", true,
            "read of '${name}' after its value was moved out", read_span)
        if !type_is_physical_rc_eligible(ty, ctx.externs) {
            return CLS_EXCLUDED
        }
        return CLS_BORROW
    }
    if ctx.states[idx] == S_MAYBE_MOVED {
        let read_span = span
        v_report(ctx, "uaf-use-after-drop", true,
            "read of '${name}' whose value is live on only some reachable paths",
            read_span)
        if !type_is_physical_rc_eligible(ty, ctx.externs) {
            return CLS_EXCLUDED
        }
        return CLS_BORROW
    }

    if ctx.kinds[idx] == K_OWNED {
        if mode == M_CONSUMED {
            // Pass-synthesised move (`__rc_scope_N` hoist / W4 tmp): the
            // binding's value transfers to the consumer.
            ctx.states.set(idx, S_MOVED)
            CLS_OWNED
        } else {
            CLS_BORROW
        }
    } else {
        if ctx.kinds[idx] == K_NONOWNED && mode == M_CONSUMED {
            // Verbatim move of a non-owned local (And/Or hoist etc.): content
            // ownership is unknown; the leak was reported at its binding.
            ctx.states.set(idx, S_MOVED)
            CLS_OPAQUE
        } else if v_type_excluded(ty, ctx.externs) ||
                  !type_is_physical_rc_eligible(ty, ctx.externs) {
            CLS_EXCLUDED
        } else {
            CLS_BORROW
        }
    }
}

// A control-flow branch / arm body walked in the parent's mode; in a
// non-consuming position an owned branch value has no consumer — the
// documented x-cf-value class (discarded / borrowed control-flow values).
fn v_cf_branch(body: HExpr, mode: Int, mut ctx: VCtx) -> (Int, Bool) {
    let r = v_branch(body, mode, ctx)
    if mode == M_BORROWED && r.0 == CLS_OWNED && r.1 == false {
        v_report(ctx, "x-cf-value", false,
            "control-flow branch yields an owned value in a non-consuming position (documented leak)", hexpr_span(body))
    }
    r
}

fn v_branch(body: HExpr, mode: Int, mut ctx: VCtx) -> (Int, Bool) {
    match body {
        HExpr::Block { .. } => v_block(body, mode, ctx),
        _ => {
            let cls = if mode == M_CONSUMED { v_consume(body, ctx) } else { v_expr(body, M_BORROWED, ctx) }
            ((cls, expr_diverges(body)))
        },
    }
}

// Combined class of a control-flow expression from its branch results.
fn v_cf_class(ty: Type, results: List<(Int, Bool)>, mode: Int, ctx: VCtx) -> Int {
    if v_type_excluded(ty, ctx.externs) {
        return CLS_EXCLUDED
    }
    if mode == M_BORROWED {
        // Owned branch values were reported per-branch (x-cf-value); the
        // expression's value in a read position is at most a borrow.
        return CLS_OPAQUE
    }
    let mut all_owned = true
    let mut any = false
    for r in results {
        if r.1 == false {
            any = true
            if r.0 != CLS_OWNED && r.0 != CLS_EXCLUDED { all_owned = false }
        }
    }
    if any && all_owned { CLS_OWNED } else { CLS_OPAQUE }
}

// Two-way branch state merge (if/else, if-let).
fn v_merge_two(mut ctx: VCtx, t_div: Bool, snap_t: List<Int>, e_div: Bool, snap_e: List<Int>, snap0: List<Int>, span: Span) {
    if t_div && e_div {
        v_restore(ctx, snap0)
    } else if t_div {
        v_restore(ctx, snap_e)
    } else if e_div {
        v_restore(ctx, snap_t)
    } else {
        let joined = v_join_forward_states(
            snap_t, snap_e, ctx.kinds, snap0.len())
        if !joined.1 {
            let imbalance_span = span
            v_report(ctx, "rc-imbalance", true,
                "branches leave incompatible enclosing RC binding states",
                imbalance_span)
        }
        v_restore(ctx, joined.0)
    }
}

fn v_handler_scope(h: HEffectHandler, mut ctx: VCtx) {
    // Handler arms become closures at codegen; bodies are their own function
    // scope with borrowed op params (and the resume binding, when present).
    let mut hctx = v_new_ctx(ctx.boxed, ctx.externs, ctx.ownership,
        ctx.findings,
        "${ctx.fn_name}/handler ${h.effect_name}.${h.op_name}")
    v_push_frame(hctx)
    for p in h.params {
        let kind = v_param_kind(p, ctx.externs)
        v_bind_def(hctx, p.name, p.def_id, kind, synthetic_vspan())
        v_bind_callable_contract(
            hctx, p.def_id, p.ty, synthetic_vspan())
    }
    match h.resume_binding {
        some(binding) => {
            v_bind_def(hctx, binding.name, some(binding.def_id),
                K_BORROW, synthetic_vspan())
            v_bind_resume_callable_contract(
                hctx, some(binding.def_id), binding.ty,
                synthetic_vspan())
        },
        none => {},
    }
    match h.body {
        HExpr::Block { .. } => {
            v_block(h.body, M_CONSUMED, hctx)
        },
        _ => {
            v_consume(h.body, hctx)
            ((0, false))
        },
    }
    v_pop_frame(hctx)
}

// ============================================================
// Blocks and statements
// ============================================================

fn v_block(block: HExpr, mode: Int, mut ctx: VCtx) -> (Int, Bool) {
    match block {
        HExpr::Block { stmts, tail, .. } => {
            let option_cleanup_eligible = v_block_option_cleanup_eligible(
                stmts, tail, mode, ctx.ownership)
            v_push_frame(ctx)
            let mut diverged = false
            for s in stmts {
                if diverged == false {
                    // Verify the terminating statement itself, including its
                    // Return/Never operand and required cleanup, then stop at
                    // the same HIR boundary used by planning and RC lowering.
                    v_stmt(s, option_cleanup_eligible, ctx)
                    if !stmt_reaches_next(s) { diverged = true }
                }
            }
            let mut cls = CLS_EXCLUDED
            if diverged == false {
                match tail {
                    some(t) => {
                        cls = v_block_tail(t, mode, ctx)
                        if expr_diverges(t) { diverged = true }
                    },
                    none => {},
                }
            }
            if diverged == false {
                v_check_frame_leaks(ctx)
            }
            v_pop_frame(ctx)
            ((cls, diverged))
        },
        _ => {
            let cls = if mode == M_CONSUMED { v_consume(block, ctx) } else { v_expr(block, M_BORROWED, ctx) }
            ((cls, expr_diverges(block)))
        },
    }
}

// A block tail.  POST-RC SHAPE: a dropping block's tail was hoisted into
// `let __rc_scope_N = <escape-processed tail>` and the syntactic tail is a
// bare Ident of THIS block's binding — that read is a MOVE-OUT (the value
// transfers to the parent) regardless of the parent's mode (the tail-escape
// invariant made it owned).  Any other tail follows the parent's mode.
fn v_block_tail(t: HExpr, mode: Int, mut ctx: VCtx) -> Int {
    let base = v_frame_base(ctx)
    match t {
        HExpr::Ident { name, def_id, .. } => {
            let idx = match def_id {
                some(id) => v_lookup_def(ctx, id),
                none => v_lookup(ctx, name)
            }
            if idx >= base && idx >= 0 {
                if ctx.kinds[idx] == K_OWNED && ctx.states[idx] == S_LIVE {
                    ctx.states.set(idx, S_MOVED)
                    CLS_OWNED
                } else {
                    if ctx.kinds[idx] == K_NONOWNED && ctx.states[idx] == S_LIVE {
                        ctx.states.set(idx, S_MOVED)
                        CLS_OPAQUE
                    } else {
                        v_expr(t, M_BORROWED, ctx)
                    }
                }
            } else {
                if mode == M_CONSUMED { v_consume(t, ctx) } else { v_expr(t, M_BORROWED, ctx) }
            }
        },
        _ => {
            if mode == M_CONSUMED { v_consume(t, ctx) } else { v_expr(t, mode, ctx) }
        },
    }
}

fn v_check_frame_leaks(mut ctx: VCtx) {
    let base = v_frame_base(ctx)
    let mut i = base
    while i < ctx.names.len() {
        if ctx.kinds[i] == K_OWNED &&
           (ctx.states[i] == S_LIVE ||
            ctx.states[i] == S_MAYBE_MOVED) {
            v_report(ctx, "leak-binding", true,
                "owned binding '${ctx.names[i]}' is never consumed (no drop/move) on the fall-through path", ctx.spans[i])
        }
        if ctx.kinds[i] == K_OPTION_CLEANUP &&
           ctx.states[i] != S_OPTION_DROPPED {
            v_report(ctx, "leak-option-exit", true,
                "cleanup-active Option binding '${ctx.names[i]}' has no exit Drop on the fall-through path",
                ctx.spans[i])
        }
        i = i + 1
    }
}

fn v_stmt(
    stmt: HStmt, option_cleanup_eligible: Bool, mut ctx: VCtx
) -> Bool {
    match stmt {
        HStmt::Let { name, def_id, ty, init, span, .. } => {
            v_let_like(name, def_id, ty, init, span, ctx)
            false
        },
        HStmt::Var { name, def_id, ty, init, span, .. } => {
            if v_is_option_cleanup_var(name, def_id, ty, init,
                    option_cleanup_eligible, ctx.boxed, ctx.externs) {
                let _ = v_consume(init, ctx)
                v_bind_def(ctx, name, def_id, K_OPTION_CLEANUP, span)
                let index = match def_id {
                    some(id) => v_lookup_def(ctx, id),
                    none => 0 - 1
                }
                if index < 0 {
                    panic("unreachable: verifier Option cleanup slot was not bound")
                }
                ctx.states.set(index, S_OPTION_PENDING)
                v_bind_callable_contract(ctx, def_id, ty, span)
            } else {
                v_let_like(name, def_id, ty, init, span, ctx)
            }
            false
        },
        HStmt::Assign { target, value, span } => {
            v_assign(target, value, span, ctx)
            false
        },
        HStmt::ExprStmt { expr, .. } => {
            // Discarded statement value: ANF materialises fresh non-control-flow
            // values (the binding is scope-end-dropped); control-flow report
            // their owned tails as x-cf-value internally.
            v_borrow(expr, "", ctx)
            stmt_diverges(stmt)
        },
        HStmt::Return { value, span } => {
            match value {
                some(v) => { v_consume(v, ctx) },
                none => CLS_EXCLUDED,
            }
            // The pass emits drops for the FULL visible owned set before the
            // Return — every owned binding still LIVE here was missed.
            let mut i = 0
            while i < ctx.names.len() {
                if (ctx.kinds[i] == K_OWNED ||
                    ctx.kinds[i] == K_LOOP_FRESH) &&
                   (ctx.states[i] == S_LIVE ||
                    ctx.states[i] == S_MAYBE_MOVED) {
                    let return_span = span
                    v_report(ctx, "leak-return", true,
                        "owned binding '${ctx.names[i]}' is live (not dropped) at this return", return_span)
                }
                if ctx.kinds[i] == K_OPTION_CLEANUP &&
                   ctx.states[i] != S_OPTION_DROPPED {
                    let return_span = span
                    v_report(ctx, "leak-option-exit", true,
                        "cleanup-active Option binding '${ctx.names[i]}' has no exit Drop at this return",
                        return_span)
                }
                i = i + 1
            }
            true
        },
        HStmt::While { condition, body, span } => {
            // The condition is part of the repeating region: every body and
            // continue back-edge returns to the state before it is evaluated.
            let loop_head = v_snapshot(ctx)
            v_cond(condition, ctx)
            // A zero-iteration/false-condition exit observes condition effects.
            let loop_exit = v_snapshot(ctx)
            ctx.loop_bases.push(ctx.names.len())
            let continue_base = ctx.continue_snapshots.len()
            let break_base = ctx.break_snapshots.len()
            let body_result = v_block(body, M_BORROWED, ctx)
            // A loop body must be state-neutral for enclosing bindings (it may
            // run zero or N times) on every normal/continue back-edge.
            let cur = v_snapshot(ctx)
            if !body_result.1 &&
               v_states_equal(loop_head, cur, loop_head.len()) == false {
                let imbalance_span = span
                v_report(ctx, "rc-imbalance", true,
                    "loop condition/body leaves enclosing RC binding states changed", imbalance_span)
            }
            let continue_span = span
            v_check_continue_backedges(
                ctx, continue_base, loop_head, continue_span)
            let break_span = span
            let merged_exit = v_check_break_edges(
                ctx, break_base, loop_exit, break_span)
            v_restore(ctx, merged_exit)
            ctx.loop_bases.pop()
            false
        },
        HStmt::ForIn { binding, def_id, destructure, iterable, body, span, .. } => {
            let iterable_is_range = match hexpr_type(iterable) {
                Type::EnumType { name, .. } => name == BUILTIN_RANGE,
                _ => false
            }
            if !iterable_is_range {
                panic("unreachable: non-Range for-in reached RC verification")
            }
            match iterable {
                // A literal RangeExpr iterable is lowered by emit_for_in_range_direct
                // (a direct counting loop that drops its own counter/bound boxes —
                // B-104b); its owned value is accepted inline.
                HExpr::RangeExpr { .. } => { v_expr(iterable, M_BORROWED, ctx) },
                _ => { v_borrow(iterable, "", ctx) },
            }
            ctx.loop_bases.push(ctx.names.len())
            let continue_base = ctx.continue_snapshots.len()
            let break_base = ctx.break_snapshots.len()
            let snap0 = v_snapshot(ctx)
            v_push_frame(ctx)
            let loop_binding = binding
            let loop_def_id = def_id
            let binding_span = span
            v_bind_def(
                ctx, loop_binding, loop_def_id, K_LOOP_FRESH, binding_span)
            match destructure {
                some(_) => panic(
                    "unreachable: Range for-in destructure reached RC verification"),
                none => {}
            }
            let body_result = v_block(body, M_BORROWED, ctx)
            if !body_result.1 {
                v_check_loop_fresh_normal_edge(ctx, span)
            }
            v_check_loop_fresh_continue_edges(ctx, continue_base, span)
            v_pop_frame(ctx)
            let cur = v_snapshot(ctx)
            if !body_result.1 &&
               v_states_equal(snap0, cur, snap0.len()) == false {
                let imbalance_span = span
                v_report(ctx, "rc-imbalance", true,
                    "loop body leaves enclosing RC binding states changed", imbalance_span)
            }
            let continue_span = span
            v_check_continue_backedges(
                ctx, continue_base, snap0, continue_span)
            let break_span = span
            let merged_exit = v_check_break_edges(
                ctx, break_base, snap0, break_span)
            v_restore(ctx, merged_exit)
            ctx.loop_bases.pop()
            false
        },
        HStmt::Break { span } => {
            v_check_loop_exit(ctx, span, "break", true)
            ctx.break_snapshots.push(v_snapshot(ctx))
            true
        },
        HStmt::Continue { span } => {
            v_check_loop_exit(ctx, span, "continue", false)
            ctx.continue_snapshots.push(v_snapshot(ctx))
            true
        },
        HStmt::LetDestructure { bindings, init, span, .. } => {
            // The destructure PROJECTS borrows out of the init (no ownership
            // taken); a fresh init was materialised by ANF (Stage 2 C2).
            v_borrow(init, "", ctx)
            for b in bindings {
                let binding_span = span
                v_bind_def(ctx, b.name, b.def_id, K_BORROW, binding_span)
                v_bind_callable_contract(
                    ctx, b.def_id, b.ty, binding_span)
            }
            false
        },
        HStmt::IfLet { bindings, expr, then_block, else_block, span, .. } => {
            v_borrow(expr, "", ctx)
            let snap0 = v_snapshot(ctx)
            v_push_frame(ctx)
            let binding_span = span
            v_bind_pattern_bindings(ctx, bindings, binding_span)
            let rt = v_block(then_block, M_BORROWED, ctx)
            v_pop_frame(ctx)
            let snap_t = v_snapshot(ctx)
            v_restore(ctx, snap0)
            let re = match else_block {
                some(eb) => v_block(eb, M_BORROWED, ctx),
                none => ((CLS_EXCLUDED, false)),
            }
            let snap_e = v_snapshot(ctx)
            let merge_span = span
            v_merge_two(
                ctx, rt.1, snap_t, re.1, snap_e, snap0, merge_span)
            rt.1 && re.1
        },
        HStmt::Drop { name, def_id, span, .. } => {
            let drop_span = span
            v_drop(name, def_id, drop_span, ctx)
            false
        }
    }
}

fn v_let_like(
    name: Str, def_id: Int?, ty: Type, init: HExpr,
    span: Span, mut ctx: VCtx
) {
    let cls = v_consume(init, ctx)
    if rc_name_skippable(name) {
        if cls == CLS_OWNED {
            let discard_span = span
            v_report(ctx, "x-discard", false,
                "`_` discards an owned value without a drop (documented leak)", discard_span)
        }
        return
    }
    let bind_span = if span.file == "<perceus>" { hexpr_span(init) } else { span }
    let owned_binding_name = name
    let nonowned_binding_name = name
    let report_binding_name = name
    let owned_binding_def_id = def_id
    let nonowned_binding_def_id = def_id
    let contract_def_id = def_id
    let owned_bind_span = bind_span
    let nonowned_bind_span = bind_span
    let owned_report_span = bind_span
    let opaque_report_span = bind_span
    if v_droppable_init(init, ctx.externs, ctx.ownership) {
        v_bind_def(ctx, owned_binding_name, owned_binding_def_id,
            K_OWNED, owned_bind_span)
    } else {
        v_bind_def(ctx, nonowned_binding_name, nonowned_binding_def_id,
            K_NONOWNED, nonowned_bind_span)
        // D1 rule ①: a contains-extern binding is non-droppable BY RULE (its
        // deep drop would reach the foreign handle) — documented, not a finding.
        if !type_is_physical_rc_eligible(
                hexpr_type(init), ctx.externs) {
            return
        }
        // Document the non-owned content when it is (or may be) owned:
        if cls == CLS_OWNED {
            v_report(ctx, "x-cf-value", false,
                "owned value bound by a non-droppable binding '${report_binding_name}' (documented leak)", owned_report_span)
        } else {
            if cls == CLS_OPAQUE {
                v_report(ctx, v_opaque_exempt_class(init), false,
                    "possibly-owned value bound by non-droppable binding '${report_binding_name}' (documented leak class)", opaque_report_span)
            }
        }
    }
    v_bind_callable_contract(ctx, contract_def_id, ty, bind_span)
}

fn v_opaque_exempt_class(init: HExpr) -> Str {
    match init {
        // (BinOp is never OPAQUE post-D7 — `&&`/`||` were the only opaque
        //  BinOps and andor_lower retired them; falls to the catch-all.)
        HExpr::EffectOp { .. } => "x-effect-value",
        HExpr::TryCatch { .. } => "x-effect-value",
        HExpr::HandleExpr { .. } => "x-effect-value",
        HExpr::IfExpr { .. } => "x-cf-value",
        HExpr::MatchExpr { .. } => "x-cf-value",
        HExpr::Block { .. } => "x-cf-value",
        HExpr::Ident { .. } => "x-cf-value",
        _ => "x-cf-value",
    }
}

fn v_assign(target: HExpr, value: HExpr, span: Span, mut ctx: VCtx) {
    match target {
        HExpr::Ident { name, def_id, ty, .. } => {
            v_consume(value, ctx)
            let idx = match def_id {
                some(id) => v_lookup_def(ctx, id),
                none => v_lookup(ctx, name)
            }
            if idx < 0 {
                return
            }
            if ctx.kinds[idx] == K_OPTION_CLEANUP {
                if ctx.states[idx] != S_OPTION_DROPPED {
                    let overwrite_span = span
                    v_report(ctx, "leak-option-reassign", true,
                        "cleanup-active Option '${name}' is assigned before its old wrapper slot is Dropped",
                        overwrite_span)
                }
                ctx.states.set(idx, S_OPTION_PENDING)
                v_bind_callable_contract(ctx, def_id, ty, span)
                return
            }
            if ctx.kinds[idx] == K_BORROW {
                let overwrite_span = span
                v_report(ctx, "x-overwrite-param", false,
                    "assignment to borrowed binding '${name}' overwrites a value owned elsewhere (documented)", overwrite_span)
                return
            }
            if ctx.states[idx] == S_MAYBE_MOVED {
                if ctx.kinds[idx] != K_OWNED {
                    panic("unreachable: non-owned RC slot entered MAYBE_MOVED state")
                }
                let overwrite_span = span
                v_report(ctx, "rc-imbalance", true,
                    "assignment to '${name}' overwrites an owned slot whose value is live on only some reachable paths",
                    overwrite_span)
            }
            if ctx.states[idx] == S_LIVE && ctx.kinds[idx] == K_OWNED {
                // Old value overwritten while live.
                let boxed_var = match def_id { some(d) => ctx.boxed.contains(d), none => false }
                if v_type_excluded(ty, ctx.externs) ||
                   !type_is_physical_rc_eligible(ty, ctx.externs) {
                    // outside the account
                } else if boxed_var {
                    let overwrite_span = span
                    v_report(ctx, "x-overwrite-boxed", false,
                        "write to auto-boxed mut cell '${name}' leaks the old cell value (B-091, documented)", overwrite_span)
                } else if is_scalar_type(ty) {
                    // W4 guarantees [materialise RHS, Drop old, Assign] for plain
                    // scalar vars — a live-state scalar overwrite means the W4
                    // drop is missing (pass regression).
                    let overwrite_span = span
                    v_report(ctx, "leak-scalar-reassign", true,
                        "scalar mut-var '${name}' reassigned without the W4 old-value drop", overwrite_span)
                } else {
                    let overwrite_span = span
                    v_report(ctx, "x-overwrite-var", false,
                        "non-scalar mut-var '${name}' reassignment leaks the old value (W4 scalar-only, documented)", overwrite_span)
                }
            }
            // The write re-arms the slot (W4 drop→assign revive included).
            ctx.states.set(idx, S_LIVE)
            v_bind_callable_contract(ctx, def_id, ty, span)
        },
        HExpr::FieldAccess { receiver, field, ty, .. } => {
            v_borrow(receiver, "", ctx)
            v_consume(value, ctx)
            if !v_type_excluded(ty, ctx.externs) &&
               type_is_physical_rc_eligible(ty, ctx.externs) {
                let overwrite_span = span
                v_report(ctx, "x-overwrite-field", false,
                    "field '${field}' overwrite does not drop the old value (codegen field-store convention; B-109 ① class)", overwrite_span)
            }
        },
        HExpr::IndexExpr { receiver, index, .. } => {
            // list[i] = v / map[k] = v lower to the runtime set/insert family,
            // which store-then-drop the old slot value (D1 rule ④) — accounted.
            v_borrow(receiver, "", ctx)
            v_borrow(index, "", ctx)
            let _ = v_consume(value, ctx)
        },
        _ => {
            let _ = v_consume(value, ctx)
        },
    }
}

fn v_drop(name: Str, def_id: Int, span: Span, mut ctx: VCtx) {
    let idx = v_lookup_def(ctx, def_id)
    if idx < 0 {
        let drop_span = span
        v_report(ctx, "uaf-drop-unknown", true,
            "Drop of '${name}' which is not in scope", drop_span)
        return
    }
    if ctx.kinds[idx] == K_OPTION_CLEANUP {
        if ctx.states[idx] == S_OPTION_DROPPED {
            let drop_span = span
            v_report(ctx, "uaf-double-drop", true,
                "second Drop of cleanup-active Option '${name}' on the same path",
                drop_span)
            return
        }
        ctx.states.set(idx, S_OPTION_DROPPED)
        return
    }
    if ctx.kinds[idx] == K_BORROW {
        let drop_span = span
        v_report(ctx, "uaf-drop-borrow", true,
            "Drop of borrowed binding '${name}' (param/pattern/for-in projection) — frees a reference owned elsewhere", drop_span)
        return
    }
    if ctx.kinds[idx] == K_NONOWNED {
        let drop_span = span
        v_report(ctx, "uaf-drop-borrow", true,
            "Drop of non-droppable binding '${name}' (And-Or/effect/excluded init — possibly a borrow)", drop_span)
        return
    }
    if ctx.states[idx] == S_DROPPED {
        let drop_span = span
        v_report(ctx, "uaf-double-drop", true,
            "second Drop of '${name}' on the same path", drop_span)
        return
    }
    if ctx.states[idx] == S_MOVED {
        // Take clears the native slot to null. Perceus deliberately emits the
        // same unconditional reverse-order cleanup on every path; dropping the
        // cleared slot is the required no-op, not a second ownership consume.
        ctx.states.set(idx, S_DROPPED)
        return
    }
    if ctx.states[idx] == S_MAYBE_MOVED {
        if ctx.kinds[idx] != K_OWNED {
            panic("unreachable: non-owned RC slot entered MAYBE_MOVED state")
        }
        // Take clears the moved edge to null; this exact common Drop consumes
        // the live edge and is a no-op on the moved edge.
        ctx.states.set(idx, S_DROPPED)
        return
    }
    ctx.states.set(idx, S_DROPPED)
}

fn v_check_loop_fresh_normal_edge(mut ctx: VCtx, span: Span) {
    let base = v_frame_base(ctx)
    let mut i = base
    while i < ctx.names.len() {
        if ctx.kinds[i] == K_LOOP_FRESH &&
           ctx.states[i] == S_DROPPED {
            let edge_span = span
            v_report(ctx, "uaf-loop-auto-drop", true,
                "fresh Range binding '${ctx.names[i]}' is explicitly dropped on a normal edge before backend loop cleanup",
                edge_span)
        }
        i = i + 1
    }
}

fn v_check_loop_fresh_continue_edges(
    mut ctx: VCtx, base: Int, span: Span
) {
    let frame_base = v_frame_base(ctx)
    let mut snapshot_index = base
    while snapshot_index < ctx.continue_snapshots.len() {
        match ctx.continue_snapshots.get(snapshot_index) {
            some(snapshot) => {
                let mut i = frame_base
                while i < ctx.kinds.len() && i < snapshot.len() {
                    if ctx.kinds[i] == K_LOOP_FRESH &&
                       snapshot[i] == S_DROPPED {
                        let edge_span = span
                        v_report(ctx, "uaf-loop-auto-drop", true,
                            "fresh Range binding '${ctx.names[i]}' is explicitly dropped on a continue edge before backend loop cleanup",
                            edge_span)
                    }
                    i = i + 1
                }
            },
            none => {}
        }
        snapshot_index = snapshot_index + 1
    }
}

// Break/Continue exit the innermost loop without running the loop body's
// block-end drops. Break also skips a Range increment-label cleanup, whereas
// Continue reaches it; require the special binding to be cleared only on Break.
fn v_check_loop_exit(
    mut ctx: VCtx, span: Span, what: Str,
    require_loop_fresh_cleanup: Bool
) {
    let n = ctx.loop_bases.len()
    if n == 0 {
        return
    }
    let base = ctx.loop_bases[n - 1]
    let mut i = base
    while i < ctx.names.len() {
        if (ctx.kinds[i] == K_OWNED ||
            (require_loop_fresh_cleanup &&
             ctx.kinds[i] == K_LOOP_FRESH)) &&
           (ctx.states[i] == S_LIVE ||
            ctx.states[i] == S_MAYBE_MOVED) {
            let exit_span = span
            v_report(ctx, "leak-loop-exit", true,
                "owned binding '${ctx.names[i]}' is live (not dropped) at this ${what}", exit_span)
        }
        if ctx.kinds[i] == K_OPTION_CLEANUP &&
           ctx.states[i] != S_OPTION_DROPPED {
            let exit_span = span
            v_report(ctx, "leak-option-exit", true,
                "cleanup-active Option binding '${ctx.names[i]}' has no exit Drop at this ${what}",
                exit_span)
        }
        i = i + 1
    }
}
