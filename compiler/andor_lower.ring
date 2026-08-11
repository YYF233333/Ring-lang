// ============================================================
// andor_lower.ring — B-104 D7: `&&` / `||` lowered to if-else
// ============================================================
//
// Runs once per module at the end of checking (checker.ring), BEFORE
// dict_lower / perceus and BOTH backends, so And/Or never reach the RC pass,
// the verifier, or either codegen as BinOps (dict_lower.ring precedent).
//
//   a && b   →   if a { b } else { false }
//   a || b   →   if a { true } else { b }
//
// Short-circuit semantics are preserved by construction (an IfExpr branch is
// evaluated only on its taken edge).  Motivation (D5 attribution, 2026-06-12):
// the LLVM gen_and/gen_or phi yielded the RHS operand box VERBATIM on the
// taken edge — possibly a borrow — so the result could never be dropped
// (x-andor, ≈69M = 31% of native residual live @2.382B) and an entire family
// of RC special cases existed solely to keep that phi from being freed
// (anf_cond_in_own_scope on the RHS, the non-blanket W3a branch recursion,
// the D2-#3 visible-owned gate instance, is_fresh_owned_bool_value's And/Or
// arm).  Post-lower the arms are ordinary branch blocks:
//   * arm-internal owned temporaries materialise + scope-end-drop inside the
//     branch (D1 machinery — the same leak D5 measured under the old form);
//   * the phi value follows the ordinary IfExpr accounting — droppable-init
//     recursion at bindings, value-position materialisation when all arms are
//     fresh (anf_should_materialize's IfExpr arm), codegen post-unbox drop in
//     while-cond/guard positions (is_fresh_owned_bool_value recursion);
//   * a borrow arm (`a && obj.flag`) keeps the conservative x-cf-value
//     posture — exactly the old And/Or leak-direction conservatism, now with
//     no bespoke machinery.
//
// Codegen emits IfExpr lowering for these: output SHAPE changes, behavior
// does not (`a && b` on Ring Bools ≡ `a ? b : false`).  No HIR node kinds
// are added or removed — BinOp::And/Or simply no longer occur downstream of
// the checker (downstream arms panic).

use ast::{Span, BinOp}
use types::{Type, EffectRow, EMPTY_ROW}
use hir::{HProgram, HDecl, HStmt, HExpr, HMatchArm, HStructFieldInit,
    HStringInterpPart, HEffectHandler, HEffectOp, HTraitMethod}

pub fn lower_andor(program: HProgram) -> HProgram {
    let mut new_decls: List<HDecl> = []
    for d in program.decls {
        let decl_ = d
        new_decls.push(al_decl(decl_))
    }
    HProgram {
        decls: new_decls,
        derived_impls: program.derived_impls,
        boxed_vars: program.boxed_vars,
        static_dicts: program.static_dicts,
        extern_type_names: program.extern_type_names,
        ownership_metadata: program.ownership_metadata
    }
}

fn al_decl(d: HDecl) -> HDecl {
    match d {
        HDecl::Fn { body, .. } => {
            let body_ = body
            HDecl::Fn { ..d, body: al_expr(body_) }
        },
        HDecl::Impl { methods, .. } => {
            let mut new_methods: List<HDecl> = []
            for m in methods {
                let method_ = m
                new_methods.push(al_decl(method_))
            }
            HDecl::Impl { ..d, methods: new_methods }
        },
        HDecl::Test { body, .. } => {
            let body_ = body
            HDecl::Test { ..d, body: al_expr(body_) }
        },
        HDecl::Const { init, .. } => {
            let init_ = init
            HDecl::Const { ..d, init: al_expr(init_) }
        },
        HDecl::ModBlock { decls, .. } => {
            let mut new_inner: List<HDecl> = []
            for md in decls {
                let decl_ = md
                new_inner.push(al_decl(decl_))
            }
            HDecl::ModBlock { ..d, decls: new_inner }
        },
        HDecl::Trait { methods, .. } => {
            // Default method bodies are real HIR (checked by infer) — lower them too.
            let mut new_methods: List<HTraitMethod> = []
            for tm in methods {
                let new_body = match tm.body {
                    some(b) => {
                        let body_ = b
                        some(al_expr(body_))
                    },
                    none => none,
                }
                new_methods.push(HTraitMethod { ..tm, body: new_body })
            }
            HDecl::Trait { ..d, methods: new_methods }
        },
        HDecl::Effect { ops, .. } => {
            let mut new_ops: List<HEffectOp> = []
            for op in ops {
                let new_default_body = match op.default_body {
                    some(body) => {
                        let body_ = body
                        some(al_expr(body_))
                    },
                    none => none,
                }
                new_ops.push(HEffectOp { ..op, default_body: new_default_body })
            }
            HDecl::Effect { ..d, ops: new_ops }
        },
        HDecl::Struct { .. } | HDecl::Enum { .. } |
        HDecl::ExternFn { .. } | HDecl::ExternType { .. } |
        HDecl::TypeAlias { .. } | HDecl::Sig { .. } => d,
    }
}

// ============================================================
// Structural walkers
// ============================================================

fn al_expr(e: HExpr) -> HExpr {
    match e {
        HExpr::IntLit { .. } | HExpr::FloatLit { .. } |
        HExpr::StrLit { .. } | HExpr::BoolLit { .. } |
        HExpr::Ident { .. } => e,
        HExpr::BinOp { op, left, right, eq_dispatch, ord_dispatch, ty, effects, span } => {
            let left_ = left
            let right_ = right
            let new_left = al_expr(left_)
            let new_right = al_expr(right_)
            match op {
                // a && b → if a { b } else { false }.  The else arm is a fresh
                // BoolLit (a per-evaluation box at LLVM, reclaimed by the same
                // accounting as the then arm); ty/effects of the whole phi are
                // the BinOp's (Bool, union of operand effects).
                BinOp::And => {
                    let result_ty = ty
                    let result_effects = effects
                    let result_span = span
                    let literal_span = span
                    HExpr::IfExpr {
                        condition: new_left,
                        then_branch: new_right,
                        else_branch: some(HExpr::BoolLit { value: false,
                            ty: Type::BoolType, effects: EMPTY_ROW,
                            span: literal_span }),
                        ty: result_ty, effects: result_effects,
                        span: result_span
                    }
                },
                // a || b → if a { true } else { b }.
                BinOp::Or => {
                    let result_ty = ty
                    let result_effects = effects
                    let result_span = span
                    let literal_span = span
                    HExpr::IfExpr {
                        condition: new_left,
                        then_branch: HExpr::BoolLit { value: true,
                            ty: Type::BoolType, effects: EMPTY_ROW,
                            span: literal_span },
                        else_branch: some(new_right),
                        ty: result_ty, effects: result_effects,
                        span: result_span
                    }
                },
                _ => HExpr::BinOp { ..e, left: new_left, right: new_right },
            }
        },
        HExpr::UnaryOp { operand, .. } => {
            let operand_ = operand
            HExpr::UnaryOp { ..e, operand: al_expr(operand_) }
        },
        HExpr::Call { callee, args, .. } => {
            let callee_ = callee
            let new_callee = al_expr(callee_)
            let mut new_args: List<HExpr> = []
            for a in args {
                let arg_ = a
                new_args.push(al_expr(arg_))
            }
            HExpr::Call { ..e, callee: new_callee, args: new_args }
        },
        HExpr::FieldAccess { receiver, .. } => {
            let receiver_ = receiver
            HExpr::FieldAccess { ..e, receiver: al_expr(receiver_) }
        },
        HExpr::StructLit { fields, spread, .. } => {
            let mut new_fields: List<HStructFieldInit> = []
            for f in fields {
                new_fields.push(HStructFieldInit { name: f.name, value: al_expr(f.value) })
            }
            let new_spread = match spread {
                some(s) => {
                    let spread_ = s
                    some(al_expr(spread_))
                },
                none => none,
            }
            HExpr::StructLit { ..e, fields: new_fields, spread: new_spread }
        },
        HExpr::NamedVariantConstruct { fields, spread, .. } => {
            let mut new_fields: List<HStructFieldInit> = []
            for f in fields {
                new_fields.push(HStructFieldInit { name: f.name, value: al_expr(f.value) })
            }
            let new_spread = match spread {
                some(s) => {
                    let spread_ = s
                    some(al_expr(spread_))
                },
                none => none,
            }
            HExpr::NamedVariantConstruct { ..e, fields: new_fields,
                spread: new_spread }
        },
        HExpr::MatchExpr { scrutinee, arms, .. } => {
            let scrutinee_ = scrutinee
            let arms_ = arms
            HExpr::MatchExpr { ..e, scrutinee: al_expr(scrutinee_),
                arms: al_arms(arms_) }
        },
        HExpr::Block { stmts, tail, .. } => {
            let mut new_stmts: List<HStmt> = []
            for s in stmts {
                let stmt_ = s
                new_stmts.push(al_stmt(stmt_))
            }
            let new_tail = match tail {
                some(t) => {
                    let tail_ = t
                    some(al_expr(tail_))
                },
                none => none,
            }
            HExpr::Block { ..e, stmts: new_stmts, tail: new_tail }
        },
        HExpr::IfExpr { condition, then_branch, else_branch, .. } => {
            let condition_ = condition
            let then_branch_ = then_branch
            let new_else = match else_branch {
                some(eb) => {
                    let else_ = eb
                    some(al_expr(else_))
                },
                none => none,
            }
            HExpr::IfExpr { ..e, condition: al_expr(condition_),
                then_branch: al_expr(then_branch_), else_branch: new_else }
        },
        HExpr::StringInterp { parts, .. } => {
            let mut new_parts: List<HStringInterpPart> = []
            for p in parts {
                match p {
                    HStringInterpPart::Literal(_) => {
                        let literal_ = p
                        new_parts.push(literal_)
                    },
                    HStringInterpPart::Expression(ex) => {
                        let expression_ = ex
                        new_parts.push(HStringInterpPart::Expression(
                            al_expr(expression_)))
                    },
                }
            }
            HExpr::StringInterp { ..e, parts: new_parts }
        },
        HExpr::TryCatch { body, arms, .. } => {
            let body_ = body
            let arms_ = arms
            HExpr::TryCatch { ..e, body: al_expr(body_), arms: al_arms(arms_) }
        },
        HExpr::HandleExpr { body, handlers, .. } => {
            let body_ = body
            let mut new_handlers: List<HEffectHandler> = []
            for h in handlers {
                let handler_body = h.body
                new_handlers.push(HEffectHandler { ..h,
                    body: al_expr(handler_body) })
            }
            HExpr::HandleExpr { ..e, body: al_expr(body_),
                handlers: new_handlers }
        },
        HExpr::Lambda { body, .. } => {
            let body_ = body
            HExpr::Lambda { ..e, body: al_expr(body_) }
        },
        HExpr::EffectOp { args, .. } => {
            let mut new_args: List<HExpr> = []
            for a in args {
                let arg_ = a
                new_args.push(al_expr(arg_))
            }
            HExpr::EffectOp { ..e, args: new_args }
        },
        HExpr::RangeExpr { start, end, .. } => {
            let start_ = start
            let end_ = end
            HExpr::RangeExpr { ..e, start: al_expr(start_), end: al_expr(end_) }
        },
        HExpr::ListLit { elements, .. } => {
            let mut new_elems: List<HExpr> = []
            for el in elements {
                let element_ = el
                new_elems.push(al_expr(element_))
            }
            HExpr::ListLit { ..e, elements: new_elems }
        },
        HExpr::TupleLit { elements, .. } => {
            let mut new_elems: List<HExpr> = []
            for el in elements {
                let element_ = el
                new_elems.push(al_expr(element_))
            }
            HExpr::TupleLit { ..e, elements: new_elems }
        },
        HExpr::IndexExpr { receiver, index, .. } => {
            let receiver_ = receiver
            let index_ = index
            HExpr::IndexExpr { ..e, receiver: al_expr(receiver_),
                index: al_expr(index_) }
        },
        // Created by dict_lower, which runs AFTER this pass — never present.
        HExpr::DictConstruct { .. } => e,
        // Clone is inserted by perceus (runs after this pass) — never present.
        HExpr::Clone { inner, .. } => {
            let inner_ = inner
            HExpr::Clone { ..e, inner: al_expr(inner_) }
        },
        HExpr::Take { .. } => e,
        // B-113: return in expression position (match arm)
        HExpr::ReturnExpr { value, .. } => match value {
            some(v) => {
                let value_ = v
                HExpr::ReturnExpr { ..e, value: some(al_expr(value_)) }
            },
            none => e,
        },
        // B-125: unsafe block — recurse into body
        HExpr::UnsafeBlock { body, .. } => {
            let body_ = body
            HExpr::UnsafeBlock { ..e, body: al_expr(body_) }
        },
    }
}

fn al_arms(arms: List<HMatchArm>) -> List<HMatchArm> {
    let mut out: List<HMatchArm> = []
    for arm in arms {
        let new_guard = match arm.guard {
            some(g) => {
                let guard_ = g
                some(al_expr(guard_))
            },
            none => none,
        }
        let body_ = arm.body
        out.push(HMatchArm { ..arm, guard: new_guard,
            body: al_expr(body_) })
    }
    out
}

fn al_stmt(s: HStmt) -> HStmt {
    match s {
        HStmt::Let { init, .. } => {
            let init_ = init
            HStmt::Let { ..s, init: al_expr(init_) }
        },
        HStmt::Var { init, .. } => {
            let init_ = init
            HStmt::Var { ..s, init: al_expr(init_) }
        },
        HStmt::Assign { target, value, .. } => {
            let target_ = target
            let value_ = value
            HStmt::Assign { ..s, target: al_expr(target_),
                value: al_expr(value_) }
        },
        HStmt::ExprStmt { expr, .. } => {
            let expr_ = expr
            HStmt::ExprStmt { ..s, expr: al_expr(expr_) }
        },
        HStmt::Return { value, .. } => {
            let new_value = match value {
                some(v) => {
                    let value_ = v
                    some(al_expr(value_))
                },
                none => none,
            }
            HStmt::Return { ..s, value: new_value }
        },
        HStmt::While { condition, body, .. } => {
            let condition_ = condition
            let body_ = body
            HStmt::While { ..s, condition: al_expr(condition_),
                body: al_expr(body_) }
        },
        HStmt::ForIn { iterable, body, .. } => {
            let iterable_ = iterable
            let body_ = body
            HStmt::ForIn { ..s, iterable: al_expr(iterable_),
                body: al_expr(body_) }
        },
        HStmt::Break { .. } | HStmt::Continue { .. } => s,
        HStmt::LetDestructure { init, .. } => {
            let init_ = init
            HStmt::LetDestructure { ..s, init: al_expr(init_) }
        },
        HStmt::IfLet { expr, then_block, else_block, .. } => {
            let expr_ = expr
            let then_block_ = then_block
            let new_else = match else_block {
                some(eb) => {
                    let else_ = eb
                    some(al_expr(else_))
                },
                none => none,
            }
            HStmt::IfLet { ..s, expr: al_expr(expr_),
                then_block: al_expr(then_block_), else_block: new_else }
        },
        // RC ops are inserted by perceus (after this pass) — never present.
        HStmt::Drop { .. } => s
    }
}
