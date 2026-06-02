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

use ast::{Span, Position, Pattern, NamedPatternField}
use hir::{HDecl, HStmt, HExpr, HParam, HProgram, HMatchArm,
    HStructFieldInit, HStringInterpPart, HEffectHandler,
    HForInDestructure, HLetDestructureBinding,
    hexpr_type, hexpr_span, hexpr_effects}
use types::{Type, EffectRow}

// ============================================================
// Synthetic span for inserted Drop/Dup nodes
// ============================================================

fn synthetic_span() -> Span {
    let pos = Position { line: 0, column: 0, offset: 0 }
    Span { file: "<perceus>", start: pos, end: pos }
}

// ============================================================
// Collect all variable references in an expression (names only)
// This is used to determine which variables are "used" in an expr.
// ============================================================

fn collect_expr_vars(expr: HExpr, mut out: Set<Str>) {
    match expr {
        HExpr::Ident { name, .. } => { out.insert(name) },
        HExpr::BinOp { left, right, .. } => {
            collect_expr_vars(left, out)
            collect_expr_vars(right, out)
        },
        HExpr::UnaryOp { operand, .. } => {
            collect_expr_vars(operand, out)
        },
        HExpr::Call { callee, args, .. } => {
            collect_expr_vars(callee, out)
            for a in args { collect_expr_vars(a, out) }
        },
        HExpr::FieldAccess { receiver, .. } => {
            collect_expr_vars(receiver, out)
        },
        HExpr::StructLit { fields, spread, .. } => {
            for f in fields { collect_expr_vars(f.value, out) }
            match spread {
                some(s) => collect_expr_vars(s, out),
                none => {},
            }
        },
        HExpr::NamedVariantConstruct { fields, spread, .. } => {
            for f in fields { collect_expr_vars(f.value, out) }
            match spread {
                some(s) => collect_expr_vars(s, out),
                none => {},
            }
        },
        HExpr::MatchExpr { scrutinee, arms, .. } => {
            collect_expr_vars(scrutinee, out)
            for arm in arms {
                collect_expr_vars(arm.body, out)
                match arm.guard {
                    some(g) => collect_expr_vars(g, out),
                    none => {},
                }
            }
        },
        HExpr::Block { stmts, tail, .. } => {
            for s in stmts { collect_stmt_vars(s, out) }
            match tail {
                some(t) => collect_expr_vars(t, out),
                none => {},
            }
        },
        HExpr::IfExpr { condition, then_branch, else_branch, .. } => {
            collect_expr_vars(condition, out)
            collect_expr_vars(then_branch, out)
            match else_branch {
                some(eb) => collect_expr_vars(eb, out),
                none => {},
            }
        },
        HExpr::StringInterp { parts, .. } => {
            for p in parts {
                match p {
                    HStringInterpPart::Expression(e) => collect_expr_vars(e, out),
                    HStringInterpPart::Literal(_) => {},
                }
            }
        },
        HExpr::TryCatch { body, arms, .. } => {
            collect_expr_vars(body, out)
            for arm in arms { collect_expr_vars(arm.body, out) }
        },
        HExpr::HandleExpr { body, handlers, .. } => {
            collect_expr_vars(body, out)
            for h in handlers { collect_expr_vars(h.body, out) }
        },
        HExpr::Lambda { body, .. } => {
            collect_expr_vars(body, out)
        },
        HExpr::EffectOp { args, .. } => {
            for a in args { collect_expr_vars(a, out) }
        },
        HExpr::RangeExpr { start, end, .. } => {
            collect_expr_vars(start, out)
            collect_expr_vars(end, out)
        },
        HExpr::ListLit { elements, .. } => {
            for e in elements { collect_expr_vars(e, out) }
        },
        HExpr::TupleLit { elements, .. } => {
            for e in elements { collect_expr_vars(e, out) }
        },
        HExpr::IndexExpr { receiver, index, .. } => {
            collect_expr_vars(receiver, out)
            collect_expr_vars(index, out)
        },
        HExpr::IntLit { .. } => {},
        HExpr::FloatLit { .. } => {},
        HExpr::StrLit { .. } => {},
        HExpr::BoolLit { .. } => {},
    }
}

fn collect_stmt_vars(stmt: HStmt, mut out: Set<Str>) {
    match stmt {
        HStmt::Let { init, .. } => collect_expr_vars(init, out),
        HStmt::Var { init, .. } => collect_expr_vars(init, out),
        HStmt::Assign { target, value, .. } => {
            collect_expr_vars(target, out)
            collect_expr_vars(value, out)
        },
        HStmt::ExprStmt { expr, .. } => collect_expr_vars(expr, out),
        HStmt::Return { value, .. } => {
            match value {
                some(v) => collect_expr_vars(v, out),
                none => {},
            }
        },
        HStmt::While { condition, body, .. } => {
            collect_expr_vars(condition, out)
            collect_expr_vars(body, out)
        },
        HStmt::ForIn { iterable, body, .. } => {
            collect_expr_vars(iterable, out)
            collect_expr_vars(body, out)
        },
        HStmt::LetDestructure { init, .. } => collect_expr_vars(init, out),
        HStmt::IfLet { expr, then_block, else_block, .. } => {
            collect_expr_vars(expr, out)
            collect_expr_vars(then_block, out)
            match else_block {
                some(eb) => collect_expr_vars(eb, out),
                none => {},
            }
        },
        HStmt::Break { .. } => {},
        HStmt::Continue { .. } => {},
        HStmt::Drop { .. } => {},
        HStmt::Dup { .. } => {},
    }
}

// ============================================================
// Collect pattern binding names
// ============================================================

fn pattern_binding_names(pat: Pattern, mut out: List<Str>) {
    match pat {
        Pattern::Wildcard { .. } => {},
        Pattern::Literal { .. } => {},
        Pattern::Binding { name, .. } => out.push(name),
        Pattern::Constructor { fields, .. } => {
            for f in fields { pattern_binding_names(f, out) }
        },
        Pattern::NamedConstructor { fields, .. } => {
            for f in fields { pattern_binding_names(f.pattern, out) }
        },
        Pattern::TuplePattern { elements, .. } => {
            for e in elements { pattern_binding_names(e, out) }
        },
        Pattern::OrPattern { patterns, .. } => {
            // All sub-patterns bind the same names; collect from first
            if patterns.len() > 0 {
                match patterns.get(0) {
                    some(p) => pattern_binding_names(p, out),
                    none => {},
                }
            }
        },
    }
}

// ============================================================
// Collect all locally-defined variable names in statements/expressions
// Used to distinguish local variables (need RC) from globals (skip RC).
// ============================================================

fn collect_local_defs_stmts(stmts: List<HStmt>, mut out: Set<Str>) {
    for stmt in stmts {
        match stmt {
            HStmt::Let { name, .. } => { out.insert(name) },
            HStmt::Var { name, .. } => { out.insert(name) },
            HStmt::LetDestructure { pattern, bindings, .. } => {
                for b in bindings { out.insert(b.name) }
            },
            HStmt::ForIn { binding, body, .. } => {
                out.insert(binding)
                collect_local_defs_expr(body, out)
            },
            HStmt::While { body, .. } => {
                collect_local_defs_expr(body, out)
            },
            HStmt::IfLet { pattern, then_block, else_block, .. } => {
                let mut pat_names: List<Str> = []
                pattern_binding_names(pattern, pat_names)
                for pn in pat_names { out.insert(pn) }
                collect_local_defs_expr(then_block, out)
                match else_block {
                    some(e) => collect_local_defs_expr(e, out),
                    none => {},
                }
            },
            HStmt::ExprStmt { expr, .. } => {
                collect_local_defs_expr(expr, out)
            },
            HStmt::Return { value, .. } => {
                match value {
                    some(v) => collect_local_defs_expr(v, out),
                    none => {},
                }
            },
            HStmt::Assign { value, .. } => {
                collect_local_defs_expr(value, out)
            },
            HStmt::Break { .. } => {},
            HStmt::Continue { .. } => {},
            HStmt::Drop { .. } => {},
            HStmt::Dup { .. } => {},
        }
    }
}

fn collect_local_defs_expr(expr: HExpr, mut out: Set<Str>) {
    match expr {
        HExpr::Block { stmts, tail, .. } => {
            collect_local_defs_stmts(stmts, out)
            match tail {
                some(t) => collect_local_defs_expr(t, out),
                none => {},
            }
        },
        HExpr::IfExpr { then_branch, else_branch, .. } => {
            collect_local_defs_expr(then_branch, out)
            match else_branch {
                some(e) => collect_local_defs_expr(e, out),
                none => {},
            }
        },
        HExpr::MatchExpr { arms, .. } => {
            for arm in arms {
                let mut pat_names: List<Str> = []
                pattern_binding_names(arm.pattern, pat_names)
                for pn in pat_names { out.insert(pn) }
                collect_local_defs_expr(arm.body, out)
            }
        },
        HExpr::TryCatch { body, arms, .. } => {
            collect_local_defs_expr(body, out)
            for arm in arms {
                let mut pat_names: List<Str> = []
                pattern_binding_names(arm.pattern, pat_names)
                for pn in pat_names { out.insert(pn) }
                collect_local_defs_expr(arm.body, out)
            }
        },
        HExpr::Lambda { .. } => {
            // Lambda has its own scope — do not collect its internals
        },
        _ => {},
    }
}

// ============================================================
// Main entry: transform all declarations
// ============================================================

pub fn perceus_transform(program: HProgram) -> HProgram {
    let new_decls = transform_decls(program.decls)
    HProgram {
        decls: new_decls,
        derived_impls: program.derived_impls,
        boxed_vars: program.boxed_vars
    }
}

fn transform_decls(decls: List<HDecl>) -> List<HDecl> {
    let mut result: List<HDecl> = []
    for d in decls {
        result.push(transform_decl(d))
    }
    result
}

fn transform_decl(decl: HDecl) -> HDecl {
    match decl {
        HDecl::Fn { name, def_id, type_params, params, return_type, effects, body, is_pub, trait_bounds, span } => {
            let new_body = transform_fn_body(params, body)
            HDecl::Fn {
                name: name, def_id: def_id, type_params: type_params,
                params: params, return_type: return_type, effects: effects,
                body: new_body, is_pub: is_pub, trait_bounds: trait_bounds, span: span
            }
        },
        HDecl::Impl { target_type, type_params, trait_name, methods, assoc_types, span } => {
            let new_methods = transform_decls(methods)
            HDecl::Impl {
                target_type: target_type, type_params: type_params,
                trait_name: trait_name, methods: new_methods,
                assoc_types: assoc_types, span: span
            }
        },
        HDecl::Test { description, body, span } => {
            // Transform test bodies as parameterless functions
            let new_body = transform_fn_body([], body)
            HDecl::Test { description: description, body: new_body, span: span }
        },
        HDecl::Const { name, def_id, ty, init, is_pub, span } => {
            // Transform const initializer.
            // B-081: const init root is a flush point. locals is empty here, so
            // dups will be empty in practice, but the flush makes the invariant
            // explicit and is harmless (flush_dups_into_expr is a no-op on []).
            let live: Set<Str> = set_new()
            let locals: Set<Str> = set_new()
            let result = rc_expr(init, live, locals)
            let init_flushed = flush_dups_into_expr(result.expr, result.dups)
            HDecl::Const { name: name, def_id: def_id, ty: ty, init: init_flushed, is_pub: is_pub, span: span }
        },
        HDecl::ModBlock { name, decls: mod_decls, is_pub, span } => {
            HDecl::ModBlock { name: name, decls: transform_decls(mod_decls), is_pub: is_pub, span: span }
        },
        // Non-function declarations pass through unchanged
        HDecl::Struct { .. } => decl,
        HDecl::Enum { .. } => decl,
        HDecl::Effect { .. } => decl,
        HDecl::Trait { .. } => decl,
        HDecl::ExternFn { .. } => decl,
        HDecl::ExternType { .. } => decl,
        HDecl::TypeAlias { .. } => decl,
        HDecl::Sig { .. } => decl,
    }
}

// ============================================================
// Transform a function body: analyze body, then drop unused params
// ============================================================

fn transform_fn_body(params: List<HParam>, body: HExpr) -> HExpr {
    // Collect all locally-defined variable names in this function
    let mut locals: Set<Str> = set_new()
    for p in params { locals.insert(p.name) }
    collect_local_defs_expr(body, locals)

    let live: Set<Str> = set_new()
    let result = rc_expr(body, live, locals)
    let remaining_live = result.live

    // B-081: the function body root is a statement-sequence boundary. Any dups
    // the body reports must be emitted at the function entry (after param drops,
    // before the body executes). Flush them into the body expression first.
    let body_flushed = flush_dups_into_expr(result.expr, result.dups)

    // Parameters that were NOT consumed in the body need to be dropped.
    // Insert drops at the beginning of the function body.
    let mut param_drops: List<HStmt> = []
    for p in params {
        if remaining_live.contains(p.name) == false {
            param_drops.push(HStmt::Drop { name: p.name, ty: p.ty, span: synthetic_span() })
        }
    }

    if param_drops.len() == 0 {
        return body_flushed
    }

    // Wrap body in a block that starts with param drops
    match body_flushed {
        HExpr::Block { stmts, tail, ty, effects, span } => {
            let new_stmts = param_drops.concat(stmts)
            HExpr::Block { stmts: new_stmts, tail: tail, ty: ty, effects: effects, span: span }
        },
        _ => {
            // Wrap non-block body: drops + original expr as tail
            let ty = hexpr_type(body_flushed)
            let effects = hexpr_effects(body_flushed)
            let span = hexpr_span(body_flushed)
            HExpr::Block { stmts: param_drops, tail: some(body_flushed), ty: ty, effects: effects, span: span }
        },
    }
}

// hexpr_effects is imported from hir

// ============================================================
// Result type for RC transformations
// ============================================================

struct RcResult {
    expr: HExpr,
    live: Set<Str>,
    // Names of variables that must be `dup`-ed before this expression is
    // evaluated.  B-081: instead of wrapping non-last-use Idents in a Block
    // (which breaks codegen assumptions about callee / assign-target shapes),
    // a non-last-use reports the dup need upward via `dups`.  The dup is then
    // emitted as a statement-level HStmt::Dup at the nearest statement-sequence
    // boundary, or flushed into a conditional branch body before that branch.
    // List (not Set): the same variable may need dup-ing multiple times within
    // one expression (e.g. f(x, x, x) needs 2 dups).
    dups: List<Str>
}

struct RcStmtsResult {
    stmts: List<HStmt>,
    live: Set<Str>
}

// ============================================================
// RC transform for a list of statements (backward traversal)
// ============================================================

fn rc_stmts(stmts: List<HStmt>, live: Set<Str>, locals: Set<Str>) -> RcStmtsResult {
    // Process statements from last to first.
    // We iterate forward over a reversed copy, building the result list,
    // then reverse the result at the end.
    let mut result: List<HStmt> = []
    let mut cur_live = live

    // Walk backward: index from len-1 down to 0
    let mut i = stmts.len() - 1
    while i >= 0 {
        match stmts.get(i) {
            some(stmt) => {
                let r = rc_stmt(stmt, cur_live, locals)
                // r.stmts are in forward order for this stmt position;
                // prepend them (they go before anything we've accumulated)
                // Since we're building backward, we push them and reverse later
                let mut j = r.stmts.len() - 1
                while j >= 0 {
                    match r.stmts.get(j) {
                        some(s) => result.push(s),
                        none => {},
                    }
                    j = j - 1
                }
                cur_live = r.live
            },
            none => {},
        }
        i = i - 1
    }

    result.reverse()
    RcStmtsResult { stmts: result, live: cur_live }
}

// ============================================================
// RC transform for a single statement
// Returns: (replacement stmts, updated live set)
// ============================================================

fn rc_stmt(stmt: HStmt, live: Set<Str>, locals: Set<Str>) -> RcStmtsResult {
    match stmt {
        HStmt::Let { name, name_span, def_id, ty, init, span } => {
            // Process the initializer expression
            let init_result = rc_expr(init, live, locals)
            let mut cur_live = init_result.live

            // The variable `name` is defined here.
            // If cur_live contains `name`, it means the variable is used later (backward analysis).
            // If not, the variable is never used after this point → insert Drop right after Let.
            // B-081: flush the initializer's reported dups as statements emitted
            // BEFORE the Let (so they execute before the init is evaluated).
            let mut out: List<HStmt> = dups_to_stmts(init_result.dups)
            out.push(HStmt::Let { name: name, name_span: name_span, def_id: def_id, ty: ty, init: init_result.expr, span: span })

            if cur_live.contains(name) {
                // Variable is used later — remove from live set (it was just defined)
                cur_live.remove(name)
            } else {
                // Variable is never used → drop immediately after definition
                out.push(HStmt::Drop { name: name, ty: ty, span: synthetic_span() })
            }

            RcStmtsResult { stmts: out, live: cur_live }
        },

        HStmt::Var { name, name_span, def_id, ty, init, span } => {
            let init_result = rc_expr(init, live, locals)
            let mut cur_live = init_result.live
            let mut out: List<HStmt> = dups_to_stmts(init_result.dups)
            out.push(HStmt::Var { name: name, name_span: name_span, def_id: def_id, ty: ty, init: init_result.expr, span: span })

            if cur_live.contains(name) {
                cur_live.remove(name)
            } else {
                out.push(HStmt::Drop { name: name, ty: ty, span: synthetic_span() })
            }

            RcStmtsResult { stmts: out, live: cur_live }
        },

        HStmt::Assign { target, value, span } => {
            // Target is an L-value (write destination) — do NOT rc_expr it.
            // Only the value (R-value) is consumed.
            let val_result = rc_expr(value, live, locals)
            // B-081: flush the value's reported dups before the old-value Drop
            // and the Assign itself.
            let mut out: List<HStmt> = dups_to_stmts(val_result.dups)

            // Drop the old value before the assignment overwrites it
            match target {
                HExpr::Ident { name, ty, .. } => {
                    out.push(HStmt::Drop { name: name, ty: ty, span: synthetic_span() })
                },
                _ => {},
            }
            out.push(HStmt::Assign { target: target, value: val_result.expr, span: span })

            RcStmtsResult { stmts: out, live: val_result.live }
        },

        HStmt::ExprStmt { expr, span } => {
            let r = rc_expr(expr, live, locals)
            // B-081: flush reported dups before the expression statement.
            let mut out: List<HStmt> = dups_to_stmts(r.dups)
            out.push(HStmt::ExprStmt { expr: r.expr, span: span })
            RcStmtsResult { stmts: out, live: r.live }
        },

        HStmt::Return { value, span } => {
            match value {
                some(v) => {
                    let r = rc_expr(v, live, locals)
                    // On return, drop all live variables (they won't be used after).
                    // B-081: flush the return value's reported dups before both
                    // the drop-all-live and the Return.
                    let mut out: List<HStmt> = dups_to_stmts(r.dups)
                    for name in r.live {
                        // We don't have the type info for these vars easily here,
                        // so use UnitType as a placeholder. The LLVM codegen for Drop
                        // uses the variable's actual runtime type via the refcount header.
                        out.push(HStmt::Drop { name: name, ty: Type::UnitType, span: synthetic_span() })
                    }
                    out.push(HStmt::Return { value: some(r.expr), span: span })
                    // After return, live set is empty (dead code)
                    RcStmtsResult { stmts: out, live: set_new() }
                },
                none => {
                    // void return — drop all live variables
                    let mut out: List<HStmt> = []
                    for name in live {
                        out.push(HStmt::Drop { name: name, ty: Type::UnitType, span: synthetic_span() })
                    }
                    out.push(HStmt::Return { value: none, span: span })
                    RcStmtsResult { stmts: out, live: set_new() }
                },
            }
        },

        HStmt::While { condition, body, span } => {
            // Conservative for loops: any external variable used inside the loop
            // body or condition gets a Dup before the loop, since each iteration
            // may consume it.
            let mut loop_vars: Set<Str> = set_new()
            collect_expr_vars(condition, loop_vars)
            collect_expr_vars(body, loop_vars)

            // Transform body and condition
            let body_result = rc_expr(body, live, locals)
            let cond_result = rc_expr(condition, body_result.live, locals)
            let mut cur_live = cond_result.live

            // B-081: condition and body are re-evaluated each iteration, so any
            // dups they report must be flushed INTO those expressions (so they
            // execute per iteration), not hoisted before the loop.  This is
            // orthogonal to the conservative loop-var dup below: the conservative
            // dup handles loop-carried consumption (dup once outside the loop for
            // values consumed across iterations); the flush handles multi-use
            // balancing within a single iteration.  They do not double-dup.
            let cond_flushed = flush_dups_into_expr(cond_result.expr, cond_result.dups)
            let body_flushed = flush_dups_into_expr(body_result.expr, body_result.dups)

            // External vars used in the loop that are still live → need Dup
            let mut out: List<HStmt> = []
            for v in loop_vars {
                if cur_live.contains(v) {
                    out.push(HStmt::Dup { name: v, ty: Type::UnitType, span: synthetic_span() })
                }
            }

            out.push(HStmt::While { condition: cond_flushed, body: body_flushed, span: span })
            RcStmtsResult { stmts: out, live: cur_live }
        },

        HStmt::ForIn { binding, binding_span, def_id, destructure, iterable, body, iterable_type_name, iter_type_name, span } => {
            // Similar to While — conservative Dup for external vars
            let mut loop_vars: Set<Str> = set_new()
            collect_expr_vars(iterable, loop_vars)
            collect_expr_vars(body, loop_vars)

            let body_result = rc_expr(body, live, locals)
            let iter_result = rc_expr(iterable, body_result.live, locals)
            let mut cur_live = iter_result.live

            // Remove the binding variable (it's defined by the for-in)
            cur_live.remove(binding)
            match destructure {
                some(ds) => {
                    for d in ds { cur_live.remove(d.name) }
                },
                none => {},
            }

            // B-081: the iterable is evaluated exactly once (before the loop),
            // so its dups are emitted before the ForIn statement (alongside the
            // conservative loop-var dup).  The body is re-evaluated per
            // iteration, so its dups flush INTO the body expression.
            let mut out: List<HStmt> = dups_to_stmts(iter_result.dups)
            for v in loop_vars {
                if cur_live.contains(v) {
                    out.push(HStmt::Dup { name: v, ty: Type::UnitType, span: synthetic_span() })
                }
            }

            let body_flushed = flush_dups_into_expr(body_result.expr, body_result.dups)
            out.push(HStmt::ForIn {
                binding: binding, binding_span: binding_span, def_id: def_id,
                destructure: destructure, iterable: iter_result.expr,
                body: body_flushed, iterable_type_name: iterable_type_name,
                iter_type_name: iter_type_name, span: span
            })
            RcStmtsResult { stmts: out, live: cur_live }
        },

        HStmt::Break { span } => {
            RcStmtsResult { stmts: [HStmt::Break { span: span }], live: live }
        },

        HStmt::Continue { span } => {
            RcStmtsResult { stmts: [HStmt::Continue { span: span }], live: live }
        },

        HStmt::LetDestructure { pattern, bindings, init, span } => {
            let init_result = rc_expr(init, live, locals)
            let mut cur_live = init_result.live

            // Collect binding names
            let mut bound: List<Str> = []
            for b in bindings { bound.push(b.name) }

            // B-081: flush the init's reported dups before the destructure.
            let mut out: List<HStmt> = dups_to_stmts(init_result.dups)
            out.push(HStmt::LetDestructure { pattern: pattern, bindings: bindings, init: init_result.expr, span: span })

            // Drop any bound variables that are not live
            for b in bindings {
                if cur_live.contains(b.name) {
                    cur_live.remove(b.name)
                } else {
                    out.push(HStmt::Drop { name: b.name, ty: b.ty, span: synthetic_span() })
                }
            }

            RcStmtsResult { stmts: out, live: cur_live }
        },

        HStmt::IfLet { pattern, expr, then_block, else_block, span } => {
            // Conditional-evaluation boundary: then/else are conditionally
            // evaluated, so their dups flush INTO each branch body (before
            // balancing).  The scrutinee (always evaluated) emits its dups as
            // statements before the IfLet.
            let then_result = rc_expr(then_block, set_clone(live), locals)
            let else_result = match else_block {
                some(eb) => {
                    let r = rc_expr(eb, set_clone(live), locals)
                    some(r)
                },
                none => none,
            }

            let live_then = then_result.live
            let live_else = match else_result {
                some(r) => r.live,
                none => set_clone(live),
            }

            // Flush branch dups before balancing.
            let then_flushed = flush_dups_into_expr(then_result.expr, then_result.dups)

            // Branch balance: insert drops for variables live in one branch but not the other
            let balanced_then = balance_branch(then_flushed, live_then, live_else)
            let balanced_else = match else_result {
                some(r) => {
                    let else_flushed = flush_dups_into_expr(r.expr, r.dups)
                    some(balance_branch(else_flushed, live_else, live_then))
                },
                none => {
                    // No else branch — need to drop vars that are live in then but not here
                    let drops = make_drop_list(live_then.difference(live_else))
                    if drops.len() > 0 {
                        let ty = hexpr_type(then_result.expr)
                        let effects = hexpr_effects(then_result.expr)
                        some(HExpr::Block { stmts: drops, tail: none, ty: Type::UnitType,
                            effects: effects, span: synthetic_span() })
                    } else {
                        none
                    }
                },
            }

            let merged_live = live_then.union(live_else)

            // Collect bindings introduced by pattern
            let mut pat_names: List<Str> = []
            pattern_binding_names(pattern, pat_names)
            let mut final_live = merged_live
            for pn in pat_names { final_live.remove(pn) }

            // Transform the scrutinee expression
            let expr_result = rc_expr(expr, final_live, locals)

            // B-081: flush the scrutinee's reported dups before the IfLet stmt.
            let mut out: List<HStmt> = dups_to_stmts(expr_result.dups)
            out.push(HStmt::IfLet {
                pattern: pattern, expr: expr_result.expr,
                then_block: balanced_then, else_block: balanced_else, span: span
            })

            RcStmtsResult {
                stmts: out,
                live: expr_result.live
            }
        },

        // Drop and Dup should not appear in input (we are inserting them)
        HStmt::Drop { .. } => RcStmtsResult { stmts: [stmt], live: live },
        HStmt::Dup { .. } => RcStmtsResult { stmts: [stmt], live: live },
    }
}

// ============================================================
// RC transform for expressions
// ============================================================

fn rc_expr(expr: HExpr, mut live: Set<Str>, locals: Set<Str>) -> RcResult {
    match expr {
        HExpr::Ident { name, resolved_name, def_id, dict_closure_dicts, ty, effects, span } => {
            // Only track RC for locally-defined variables (params + let/var bindings).
            // Global functions, extern fns, trait methods etc. are not heap-allocated
            // owned values and must not be wrapped in Dup/Drop.
            if !locals.contains(name) {
                RcResult { expr: expr, live: live, dups: [] }
            } else if live.contains(name) {
                // Non-last use of a local variable — need Dup.
                // B-081: do NOT wrap in a Block.  Return the bare Ident and
                // report the dup need upward via `dups`; it will be emitted as
                // a statement-level HStmt::Dup at the nearest boundary.
                RcResult { expr: expr, live: live, dups: [name] }
            } else {
                // Last use — consume without Dup. Add to live set.
                live.insert(name)
                RcResult {
                    expr: HExpr::Ident { name: name, resolved_name: resolved_name,
                        def_id: def_id, dict_closure_dicts: dict_closure_dicts,
                        ty: ty, effects: effects, span: span },
                    live: live,
                    dups: []
                }
            }
        },

        HExpr::IntLit { .. } => RcResult { expr: expr, live: live, dups: [] },
        HExpr::FloatLit { .. } => RcResult { expr: expr, live: live, dups: [] },
        HExpr::StrLit { .. } => RcResult { expr: expr, live: live, dups: [] },
        HExpr::BoolLit { .. } => RcResult { expr: expr, live: live, dups: [] },

        HExpr::BinOp { op, left, right, eq_dispatch, ord_dispatch, ty, effects, span } => {
            // Process right first, then left (right-to-left evaluation for backward analysis)
            let r_result = rc_expr(right, live, locals)
            let l_result = rc_expr(left, r_result.live, locals)

            // Short-circuit operators (&&, ||): the RHS is conditionally
            // evaluated, so its dups must be flushed INTO the RHS expression
            // rather than reported upward.  Only the (unconditional) LHS dups
            // propagate.  Non-short-circuit operators evaluate both sides
            // unconditionally, so their dups concatenate (left ++ right, the
            // backward-traversal order is right-then-left but evaluation /
            // reporting order is left-to-right).
            match op {
                BinOp::And => {
                    let new_right = flush_dups_into_expr(r_result.expr, r_result.dups)
                    RcResult {
                        expr: HExpr::BinOp { op: op, left: l_result.expr, right: new_right,
                            eq_dispatch: eq_dispatch, ord_dispatch: ord_dispatch,
                            ty: ty, effects: effects, span: span },
                        live: l_result.live,
                        dups: l_result.dups
                    }
                },
                BinOp::Or => {
                    let new_right = flush_dups_into_expr(r_result.expr, r_result.dups)
                    RcResult {
                        expr: HExpr::BinOp { op: op, left: l_result.expr, right: new_right,
                            eq_dispatch: eq_dispatch, ord_dispatch: ord_dispatch,
                            ty: ty, effects: effects, span: span },
                        live: l_result.live,
                        dups: l_result.dups
                    }
                },
                _ => {
                    RcResult {
                        expr: HExpr::BinOp { op: op, left: l_result.expr, right: r_result.expr,
                            eq_dispatch: eq_dispatch, ord_dispatch: ord_dispatch,
                            ty: ty, effects: effects, span: span },
                        live: l_result.live,
                        dups: l_result.dups.concat(r_result.dups)
                    }
                },
            }
        },

        HExpr::UnaryOp { op, operand, ty, effects, span } => {
            let r = rc_expr(operand, live, locals)
            RcResult {
                expr: HExpr::UnaryOp { op: op, operand: r.expr, ty: ty, effects: effects, span: span },
                live: r.live,
                dups: r.dups
            }
        },

        HExpr::Call { callee, args, type_args, resolved_dicts, dict_dispatch, ty, effects, span } => {
            // Process args right-to-left, then callee
            let mut cur_live = live
            let mut new_args: List<HExpr> = []
            // Collect arg dups in reverse (backward traversal); reversed to
            // forward order below.  All args are evaluated unconditionally.
            let mut arg_dups_rev: List<Str> = []
            // Build in reverse order
            let mut i = args.len() - 1
            while i >= 0 {
                match args.get(i) {
                    some(a) => {
                        let r = rc_expr(a, cur_live, locals)
                        new_args.push(r.expr)
                        for d in r.dups { arg_dups_rev.push(d) }
                        cur_live = r.live
                    },
                    none => {},
                }
                i = i - 1
            }
            new_args.reverse()
            arg_dups_rev.reverse()

            let callee_result = rc_expr(callee, cur_live, locals)
            RcResult {
                expr: HExpr::Call { callee: callee_result.expr, args: new_args,
                    type_args: type_args, resolved_dicts: resolved_dicts,
                    dict_dispatch: dict_dispatch, ty: ty, effects: effects, span: span },
                live: callee_result.live,
                dups: arg_dups_rev.concat(callee_result.dups)
            }
        },

        HExpr::FieldAccess { receiver, field, ty, effects, span } => {
            let r = rc_expr(receiver, live, locals)
            RcResult {
                expr: HExpr::FieldAccess { receiver: r.expr, field: field, ty: ty, effects: effects, span: span },
                live: r.live,
                dups: r.dups
            }
        },

        HExpr::StructLit { name, type_args, fields, spread, ty, effects, span } => {
            let mut cur_live = live
            // Process spread first (if any). All subexprs unconditionally evaluated.
            let mut spread_dups: List<Str> = []
            let new_spread = match spread {
                some(s) => {
                    let r = rc_expr(s, cur_live, locals)
                    cur_live = r.live
                    spread_dups = r.dups
                    some(r.expr)
                },
                none => none,
            }
            // Process fields right-to-left
            let mut new_fields: List<HStructFieldInit> = []
            let mut field_dups_rev: List<Str> = []
            let mut i = fields.len() - 1
            while i >= 0 {
                match fields.get(i) {
                    some(f) => {
                        let r = rc_expr(f.value, cur_live, locals)
                        new_fields.push(HStructFieldInit { name: f.name, value: r.expr })
                        for d in r.dups { field_dups_rev.push(d) }
                        cur_live = r.live
                    },
                    none => {},
                }
                i = i - 1
            }
            new_fields.reverse()
            field_dups_rev.reverse()

            RcResult {
                expr: HExpr::StructLit { name: name, type_args: type_args, fields: new_fields,
                    spread: new_spread, ty: ty, effects: effects, span: span },
                live: cur_live,
                dups: spread_dups.concat(field_dups_rev)
            }
        },

        HExpr::NamedVariantConstruct { enum_name, variant_name, fields, spread, ty, effects, span } => {
            let mut cur_live = live
            let mut spread_dups: List<Str> = []
            let new_spread = match spread {
                some(s) => {
                    let r = rc_expr(s, cur_live, locals)
                    cur_live = r.live
                    spread_dups = r.dups
                    some(r.expr)
                },
                none => none,
            }
            let mut new_fields: List<HStructFieldInit> = []
            let mut field_dups_rev: List<Str> = []
            let mut i = fields.len() - 1
            while i >= 0 {
                match fields.get(i) {
                    some(f) => {
                        let r = rc_expr(f.value, cur_live, locals)
                        new_fields.push(HStructFieldInit { name: f.name, value: r.expr })
                        for d in r.dups { field_dups_rev.push(d) }
                        cur_live = r.live
                    },
                    none => {},
                }
                i = i - 1
            }
            new_fields.reverse()
            field_dups_rev.reverse()

            RcResult {
                expr: HExpr::NamedVariantConstruct { enum_name: enum_name, variant_name: variant_name,
                    fields: new_fields, spread: new_spread, ty: ty, effects: effects, span: span },
                live: cur_live,
                dups: spread_dups.concat(field_dups_rev)
            }
        },

        HExpr::Block { stmts, tail, ty, effects, span } => {
            // Statement-sequence boundary: absorb dups here, report none upward.
            // Process tail first (it's the last thing evaluated).
            let mut cur_live = live
            let mut tail_dups: List<Str> = []
            let new_tail = match tail {
                some(t) => {
                    let r = rc_expr(t, cur_live, locals)
                    cur_live = r.live
                    tail_dups = r.dups
                    some(r.expr)
                },
                none => none,
            }
            // Then process statements backward
            let stmts_result = rc_stmts(stmts, cur_live, locals)

            // The tail's dups must execute after all statements but before the
            // tail expression — append them to the end of the statement list.
            let final_stmts = stmts_result.stmts.concat(dups_to_stmts(tail_dups))

            RcResult {
                expr: HExpr::Block { stmts: final_stmts, tail: new_tail,
                    ty: ty, effects: effects, span: span },
                live: stmts_result.live,
                dups: []
            }
        },

        HExpr::IfExpr { condition, then_branch, else_branch, ty, effects, span } => {
            // Conditional-evaluation boundary: the then/else bodies are only
            // conditionally evaluated, so their dups must be flushed INTO the
            // branch body (before balancing).  Only the condition (always
            // evaluated) reports its dups upward.
            let then_result = rc_expr(then_branch, set_clone(live), locals)
            let else_result = match else_branch {
                some(eb) => {
                    let r = rc_expr(eb, set_clone(live), locals)
                    some(r)
                },
                none => none,
            }

            let live_then = then_result.live
            let live_else = match else_result {
                some(r) => r.live,
                none => set_clone(live),
            }

            // Flush dups into each branch body BEFORE balancing.
            let then_flushed = flush_dups_into_expr(then_result.expr, then_result.dups)
            let balanced_then = balance_branch(then_flushed, live_then, live_else)
            let balanced_else = match else_result {
                some(r) => {
                    let else_flushed = flush_dups_into_expr(r.expr, r.dups)
                    some(balance_branch(else_flushed, live_else, live_then))
                },
                none => else_branch,
            }

            let merged_live = live_then.union(live_else)

            // Transform condition with merged live set
            let cond_result = rc_expr(condition, merged_live, locals)

            RcResult {
                expr: HExpr::IfExpr { condition: cond_result.expr,
                    then_branch: balanced_then, else_branch: balanced_else,
                    ty: ty, effects: effects, span: span },
                live: cond_result.live,
                dups: cond_result.dups
            }
        },

        HExpr::MatchExpr { scrutinee, arms, ty, effects, span } => {
            // Conditional-evaluation boundary: each arm's body and guard are
            // only conditionally evaluated, so their dups are flushed INTO the
            // respective expressions.  Only the scrutinee (always evaluated)
            // reports its dups upward.
            let mut arm_results: List<(HMatchArm, Set<Str>)> = []
            for arm in arms {
                let arm_live = set_clone(live)
                let body_result = rc_expr(arm.body, arm_live, locals)
                let guard_result = match arm.guard {
                    some(g) => {
                        let r = rc_expr(g, body_result.live, locals)
                        some(r)
                    },
                    none => none,
                }

                let mut arm_final_live = match guard_result {
                    some(r) => r.live,
                    none => body_result.live,
                }

                // Remove pattern-bound variables from live set
                let mut pat_names: List<Str> = []
                pattern_binding_names(arm.pattern, pat_names)
                for pn in pat_names { arm_final_live.remove(pn) }

                // Flush body and guard dups into their own expressions.
                let body_flushed = flush_dups_into_expr(body_result.expr, body_result.dups)
                let new_guard = match guard_result {
                    some(r) => some(flush_dups_into_expr(r.expr, r.dups)),
                    none => none,
                }
                let new_arm = HMatchArm {
                    pattern: arm.pattern, guard: new_guard,
                    body: body_flushed, span: arm.span
                }
                arm_results.push((new_arm, arm_final_live))
            }

            // Compute merged live = union of all arm live sets
            let mut merged_live: Set<Str> = set_new()
            for ar in arm_results {
                merged_live = merged_live.union(ar.1)
            }

            // Balance each arm: drop vars that are in merged but not in this arm's live
            let mut balanced_arms: List<HMatchArm> = []
            for ar in arm_results {
                let arm = ar.0
                let arm_live = ar.1
                let need_drop = merged_live.difference(arm_live)
                if need_drop.len() > 0 {
                    let drops = make_drop_list(need_drop)
                    let balanced_body = prepend_stmts_to_expr(arm.body, drops)
                    balanced_arms.push(HMatchArm {
                        pattern: arm.pattern, guard: arm.guard,
                        body: balanced_body, span: arm.span
                    })
                } else {
                    balanced_arms.push(arm)
                }
            }

            // Transform scrutinee
            let scrut_result = rc_expr(scrutinee, merged_live, locals)

            RcResult {
                expr: HExpr::MatchExpr { scrutinee: scrut_result.expr, arms: balanced_arms,
                    ty: ty, effects: effects, span: span },
                live: scrut_result.live,
                dups: scrut_result.dups
            }
        },

        HExpr::StringInterp { parts, ty, effects, span } => {
            let mut cur_live = live
            // Process parts right-to-left. All parts evaluated unconditionally.
            let mut new_parts: List<HStringInterpPart> = []
            let mut part_dups_rev: List<Str> = []
            let mut i = parts.len() - 1
            while i >= 0 {
                match parts.get(i) {
                    some(p) => {
                        match p {
                            HStringInterpPart::Expression(e) => {
                                let r = rc_expr(e, cur_live, locals)
                                new_parts.push(HStringInterpPart::Expression(r.expr))
                                for d in r.dups { part_dups_rev.push(d) }
                                cur_live = r.live
                            },
                            HStringInterpPart::Literal(s) => {
                                new_parts.push(HStringInterpPart::Literal(s))
                            },
                        }
                    },
                    none => {},
                }
                i = i - 1
            }
            new_parts.reverse()
            part_dups_rev.reverse()

            RcResult {
                expr: HExpr::StringInterp { parts: new_parts, ty: ty, effects: effects, span: span },
                live: cur_live,
                dups: part_dups_rev
            }
        },

        HExpr::TryCatch { body, arms, ty, effects, span } => {
            // Conditional-evaluation boundary: body and each catch arm body are
            // conditionally evaluated, so their dups are flushed into their own
            // expressions. Report no dups upward.
            let body_result = rc_expr(body, set_clone(live), locals)
            let body_flushed = flush_dups_into_expr(body_result.expr, body_result.dups)
            let mut arm_results: List<(HMatchArm, Set<Str>)> = []

            for arm in arms {
                let arm_live = set_clone(live)
                let body_r = rc_expr(arm.body, arm_live, locals)
                let arm_body_flushed = flush_dups_into_expr(body_r.expr, body_r.dups)
                let mut arm_final = body_r.live
                let mut pat_names: List<Str> = []
                pattern_binding_names(arm.pattern, pat_names)
                for pn in pat_names { arm_final.remove(pn) }
                arm_results.push((HMatchArm { pattern: arm.pattern, guard: arm.guard, body: arm_body_flushed, span: arm.span }, arm_final))
            }

            // Merge all branch live sets
            let mut merged = body_result.live
            for ar in arm_results { merged = merged.union(ar.1) }

            // Balance body and arms
            let balanced_body = balance_branch(body_flushed, body_result.live, merged)
            let mut balanced_arms: List<HMatchArm> = []
            for ar in arm_results {
                let need_drop = merged.difference(ar.1)
                if need_drop.len() > 0 {
                    let drops = make_drop_list(need_drop)
                    balanced_arms.push(HMatchArm { pattern: ar.0.pattern, guard: ar.0.guard,
                        body: prepend_stmts_to_expr(ar.0.body, drops), span: ar.0.span })
                } else {
                    balanced_arms.push(ar.0)
                }
            }

            RcResult {
                expr: HExpr::TryCatch { body: balanced_body, arms: balanced_arms, ty: ty, effects: effects, span: span },
                live: merged,
                dups: []
            }
        },

        HExpr::HandleExpr { body, handlers, ty, effects, span } => {
            // Conditional-evaluation boundary: body and handlers are flushed in
            // their own expressions; report no dups upward.
            let body_result = rc_expr(body, live, locals)
            let body_flushed = flush_dups_into_expr(body_result.expr, body_result.dups)
            let mut new_handlers: List<HEffectHandler> = []
            for h in handlers {
                let h_live: Set<Str> = set_new()
                // Handler has its own scope with its own locals
                let mut h_locals: Set<Str> = set_new()
                for hp in h.params { h_locals.insert(hp.name) }
                match h.resume_name {
                    some(rn) => h_locals.insert(rn),
                    none => {},
                }
                collect_local_defs_expr(h.body, h_locals)
                let h_result = rc_expr(h.body, h_live, h_locals)
                let h_body_flushed = flush_dups_into_expr(h_result.expr, h_result.dups)
                new_handlers.push(HEffectHandler {
                    effect_name: h.effect_name, op_name: h.op_name,
                    params: h.params, resume_name: h.resume_name,
                    body: h_body_flushed
                })
            }
            RcResult {
                expr: HExpr::HandleExpr { body: body_flushed, handlers: new_handlers,
                    ty: ty, effects: effects, span: span },
                live: body_result.live,
                dups: []
            }
        },

        HExpr::Lambda { params, return_type, body, ty, effects, span } => {
            // Lambda has its own locals scope
            let mut lambda_locals: Set<Str> = set_new()
            for p in params { lambda_locals.insert(p.name) }
            collect_local_defs_expr(body, lambda_locals)

            // Lambda captures: every free variable reference from outer scope needs Dup.
            // Transform the lambda body in its own scope.
            let inner_live: Set<Str> = set_new()
            let body_result = rc_expr(body, inner_live, lambda_locals)

            // Variables in body_result.live that are NOT lambda params are captures.
            // They need Dup in the outer scope.
            let mut param_names: Set<Str> = set_new()
            for p in params { param_names.insert(p.name) }

            let mut outer_live = live
            for v in body_result.live {
                if param_names.contains(v) == false {
                    // This is a captured variable — it needs a Dup in outer scope
                    // Mark it as live in the outer scope (it was already live, needs Dup)
                    outer_live.insert(v)
                }
            }

            // Build new body with param drops for unused params
            // (transform_fn_body collects its own locals internally)
            let new_body = transform_fn_body(params, body)

            RcResult {
                expr: HExpr::Lambda { params: params, return_type: return_type,
                    body: new_body, ty: ty, effects: effects, span: span },
                live: outer_live,
                dups: []
            }
        },

        HExpr::EffectOp { effect_name, op_name, args, ty, effects, span } => {
            let mut cur_live = live
            let mut new_args: List<HExpr> = []
            let mut arg_dups_rev: List<Str> = []
            let mut i = args.len() - 1
            while i >= 0 {
                match args.get(i) {
                    some(a) => {
                        let r = rc_expr(a, cur_live, locals)
                        new_args.push(r.expr)
                        for d in r.dups { arg_dups_rev.push(d) }
                        cur_live = r.live
                    },
                    none => {},
                }
                i = i - 1
            }
            new_args.reverse()
            arg_dups_rev.reverse()
            RcResult {
                expr: HExpr::EffectOp { effect_name: effect_name, op_name: op_name,
                    args: new_args, ty: ty, effects: effects, span: span },
                live: cur_live,
                dups: arg_dups_rev
            }
        },

        HExpr::RangeExpr { start, end, inclusive, ty, effects, span } => {
            let end_r = rc_expr(end, live, locals)
            let start_r = rc_expr(start, end_r.live, locals)
            RcResult {
                expr: HExpr::RangeExpr { start: start_r.expr, end: end_r.expr,
                    inclusive: inclusive, ty: ty, effects: effects, span: span },
                live: start_r.live,
                dups: start_r.dups.concat(end_r.dups)
            }
        },

        HExpr::ListLit { elements, ty, effects, span } => {
            let mut cur_live = live
            let mut new_elems: List<HExpr> = []
            let mut elem_dups_rev: List<Str> = []
            let mut i = elements.len() - 1
            while i >= 0 {
                match elements.get(i) {
                    some(e) => {
                        let r = rc_expr(e, cur_live, locals)
                        new_elems.push(r.expr)
                        for d in r.dups { elem_dups_rev.push(d) }
                        cur_live = r.live
                    },
                    none => {},
                }
                i = i - 1
            }
            new_elems.reverse()
            elem_dups_rev.reverse()
            RcResult {
                expr: HExpr::ListLit { elements: new_elems, ty: ty, effects: effects, span: span },
                live: cur_live,
                dups: elem_dups_rev
            }
        },

        HExpr::TupleLit { elements, ty, effects, span } => {
            let mut cur_live = live
            let mut new_elems: List<HExpr> = []
            let mut elem_dups_rev: List<Str> = []
            let mut i = elements.len() - 1
            while i >= 0 {
                match elements.get(i) {
                    some(e) => {
                        let r = rc_expr(e, cur_live, locals)
                        new_elems.push(r.expr)
                        for d in r.dups { elem_dups_rev.push(d) }
                        cur_live = r.live
                    },
                    none => {},
                }
                i = i - 1
            }
            new_elems.reverse()
            elem_dups_rev.reverse()
            RcResult {
                expr: HExpr::TupleLit { elements: new_elems, ty: ty, effects: effects, span: span },
                live: cur_live,
                dups: elem_dups_rev
            }
        },

        HExpr::IndexExpr { receiver, index, ty, effects, span } => {
            let idx_r = rc_expr(index, live, locals)
            let recv_r = rc_expr(receiver, idx_r.live, locals)
            RcResult {
                expr: HExpr::IndexExpr { receiver: recv_r.expr, index: idx_r.expr,
                    ty: ty, effects: effects, span: span },
                live: recv_r.live,
                dups: recv_r.dups.concat(idx_r.dups)
            }
        },
    }
}

// ============================================================
// Helper: create Drop stmts for a set of variable names
// ============================================================

fn make_drop_list(names: Set<Str>) -> List<HStmt> {
    let mut drops: List<HStmt> = []
    for name in names {
        drops.push(HStmt::Drop { name: name, ty: Type::UnitType, span: synthetic_span() })
    }
    drops
}

// ============================================================
// Helper: balance a branch — insert drops for vars in other_live but not my_live
// ============================================================

fn balance_branch(body: HExpr, my_live: Set<Str>, other_live: Set<Str>) -> HExpr {
    let need_drop = other_live.difference(my_live)
    if need_drop.len() == 0 {
        return body
    }
    let drops = make_drop_list(need_drop)
    prepend_stmts_to_expr(body, drops)
}

// ============================================================
// Helper: prepend statements to an expression (wrapping in Block if needed)
// ============================================================

fn prepend_stmts_to_expr(expr: HExpr, stmts: List<HStmt>) -> HExpr {
    if stmts.len() == 0 { return expr }

    match expr {
        HExpr::Block { stmts: existing, tail, ty, effects, span } => {
            let new_stmts = stmts.concat(existing)
            HExpr::Block { stmts: new_stmts, tail: tail, ty: ty, effects: effects, span: span }
        },
        _ => {
            let ty = hexpr_type(expr)
            let effects = hexpr_effects(expr)
            let span = hexpr_span(expr)
            HExpr::Block { stmts: stmts, tail: some(expr), ty: ty, effects: effects, span: span }
        },
    }
}

// ============================================================
// B-081 helpers: convert reported dup needs into statement-level Dup nodes
// ============================================================

// Turn a list of variable names into a list of HStmt::Dup statements.
// Dup's ty is UnitType: codegen looks up the variable by name in named_values
// and ignores the ty field (same convention as the While/ForIn loop-var dups
// and make_drop_list).
fn dups_to_stmts(dups: List<Str>) -> List<HStmt> {
    let mut out: List<HStmt> = []
    for name in dups {
        out.push(HStmt::Dup { name: name, ty: Type::UnitType, span: synthetic_span() })
    }
    out
}

// Flush reported dups into an expression: prepend the dup statements so they
// execute immediately before `expr` is evaluated.  Used at conditional-branch
// boundaries (if/match arms, short-circuit RHS, loop bodies) where the dup
// must not escape to the surrounding statement level.
fn flush_dups_into_expr(expr: HExpr, dups: List<Str>) -> HExpr {
    prepend_stmts_to_expr(expr, dups_to_stmts(dups))
}
