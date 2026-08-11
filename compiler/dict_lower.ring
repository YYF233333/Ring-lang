// ============================================================
// dict_lower.ring — B-104 D4 (#151): dict evidence HIR first-classing
// ============================================================
//
// Runs once per module at the end of checking (checker.ring), BEFORE perceus
// and BOTH backends, so dict construction and lifetime are visible to the RC
// pass / verifier and lowered identically by codegen.
//
// Input invariant (established by infer / infer_ctx at DictRef creation):
//   * DictRef::Static(name)  — a plain static dict (trait_dict_name sites).
//   * DictRef::Simple(name)  — a dict PARAM reference (trait_bound_param_name
//     sites).  Borrow of a binding in scope.
//   * DictRef::Wrapped{..}   — a parameterized type's dict resolution.
//
// This pass rewrites every use site (Call.resolved_dicts,
// Ident.dict_closure_dicts, and BinOp eq/ord_dispatch extra_dicts):
//   1. Static(name) plain refs  → registered in HProgram.static_dicts
//      (footprint; LLVM memoises the singleton on first use).
//   2. Wrapped with ALL-STATIC inners → ONE module-level singleton instance
//      (HDictDef with inner != []), use site becomes Static(instance_name)
//      — a borrow.  This kills the per-call-site fresh TUPLE+closures+STR
//      synthesis that was ≈28-38% of native residual live (#151).
//   3. Wrapped with ANY dynamic inner (dict param / nested dynamic) → a LOCAL
//      construction: the consuming Call is wrapped in a Block
//        { let __ring_dictlocal_N = HExpr::DictConstruct{..}; tail: Call }
//      and the use site becomes Simple(__ring_dictlocal_N).  The binding is
//      FRESH-OWNED — the ordinary Perceus scope-end drop reclaims it, and the
//      D2 verifier accounts it like any owned local (no exemption class).
//
// NOT rewritten (documented residuals):
//   * BinOp dispatch extra_dicts with a DYNAMIC inner stay Wrapped: codegen
//     ignores extra_dicts in Eq/Ord dispatch (pre-existing functional gap,
//     reported — nothing is constructed, so nothing leaks).
//
// Derived FieldAction extra_dicts are lowered with the static-only rule:
// all-static wrappers become module singletons; dynamic wrappers remain
// first-class DictRefs and are constructed/dropped inside synthetic methods.

use ast::{Span}
use types::{Type, EffectRow, EMPTY_ROW}
use hir::{HProgram, HDecl, HStmt, HExpr, HMatchArm, HStructFieldInit,
    HStringInterpPart, HEffectHandler, HEffectOp, HTraitMethod, DictRef, TraitDispatch,
    HDictDef, DerivedImpl, DerivedField, DerivedVariant, FieldAction,
    dict_instance_name, hexpr_type, hexpr_effects, hexpr_span,
    synthetic_def_id, SYNTHETIC_DICT_DEF_ID_BASE,
    validate_hir_binder_def_ids}

pub fn lower_dicts(program: HProgram) -> HProgram {
    let mut defs: List<HDictDef> = []
    let mut seen: Set<Str> = set_new()
    // Per-program gensym for dict locals (names are function-scoped at codegen,
    // but a global counter is simplest and collision-free).
    let mut counter: List<Int> = [0]
    let mut new_decls: List<HDecl> = []
    for d in program.decls {
        let decl_ = d
        new_decls.push(dl_decl(decl_, defs, seen, counter))
    }
    let mut new_derived_impls: List<DerivedImpl> = []
    for di in program.derived_impls {
        let derived_impl = di
        new_derived_impls.push(dl_derived_impl(derived_impl, defs, seen))
    }
    let lowered = HProgram {
        decls: new_decls,
        derived_impls: new_derived_impls,
        boxed_vars: program.boxed_vars,
        static_dicts: defs,
        extern_type_names: program.extern_type_names,
        ownership_metadata: program.ownership_metadata
    }
    validate_hir_binder_def_ids(lowered)
    lowered
}

fn dl_derived_action(action: FieldAction, mut defs: List<HDictDef>,
                     mut seen: Set<Str>) -> FieldAction {
    match action {
        FieldAction::Call { extra_dicts, .. } => {
            let mut lowered: List<DictRef> = []
            for dr in extra_dicts {
                let dict_ref = dr
                lowered.push(dl_ref_static_only(dict_ref, defs, seen))
            }
            FieldAction::Call { ..action, extra_dicts: lowered }
        },
        FieldAction::Tuple { element_actions } => {
            let mut lowered: List<FieldAction> = []
            for elem in element_actions {
                let action_ = elem
                lowered.push(dl_derived_action(action_, defs, seen))
            }
            FieldAction::Tuple { ..action, element_actions: lowered }
        },
        FieldAction::Identity | FieldAction::FloatIdentity |
        FieldAction::BoolIdentity | FieldAction::FnLiteral => action,
    }
}

fn dl_derived_fields(fields: List<DerivedField>, mut defs: List<HDictDef>,
                     mut seen: Set<Str>) -> List<DerivedField> {
    let mut lowered: List<DerivedField> = []
    for field in fields {
        let action_ = field.action
        lowered.push(DerivedField { ..field,
            action: dl_derived_action(action_, defs, seen) })
    }
    lowered
}

fn dl_derived_impl(di: DerivedImpl, mut defs: List<HDictDef>,
                   mut seen: Set<Str>) -> DerivedImpl {
    let struct_fields = match di.struct_fields {
        some(fields) => some(dl_derived_fields(fields, defs, seen)),
        none => none,
    }
    let enum_variants = match di.enum_variants {
        some(variants) => {
            let mut lowered: List<DerivedVariant> = []
            for variant in variants {
                let fields_ = variant.fields
                lowered.push(DerivedVariant { ..variant,
                    fields: dl_derived_fields(fields_, defs, seen),
                })
            }
            some(lowered)
        },
        none => none,
    }
    DerivedImpl { ..di,
        struct_fields: struct_fields,
        enum_variants: enum_variants,
    }
}

fn dl_decl(d: HDecl, mut defs: List<HDictDef>, mut seen: Set<Str>, mut counter: List<Int>) -> HDecl {
    match d {
        HDecl::Fn { body, .. } => {
            let body_ = body
            HDecl::Fn { ..d, body: dl_expr(body_, defs, seen, counter) }
        },
        HDecl::Impl { methods, .. } => {
            let mut new_methods: List<HDecl> = []
            for m in methods {
                let method_ = m
                new_methods.push(dl_decl(method_, defs, seen, counter))
            }
            HDecl::Impl { ..d, methods: new_methods }
        },
        HDecl::Test { body, .. } => {
            let body_ = body
            HDecl::Test { ..d, body: dl_expr(body_, defs, seen, counter) }
        },
        HDecl::Const { init, .. } => {
            let init_ = init
            HDecl::Const { ..d, init: dl_expr(init_, defs, seen, counter) }
        },
        HDecl::ModBlock { decls, .. } => {
            let mut new_inner: List<HDecl> = []
            for md in decls {
                let decl_ = md
                new_inner.push(dl_decl(decl_, defs, seen, counter))
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
                        some(dl_expr(body_, defs, seen, counter))
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
                        some(dl_expr(body_, defs, seen, counter))
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
// DictRef classification / rewriting
// ============================================================

fn dl_register(mut defs: List<HDictDef>, mut seen: Set<Str>, def: HDictDef) {
    if seen.contains(def.name) == false {
        seen.insert(def.name)
        defs.push(def)
    }
}

// Rewrite a DictRef in a position that CAN host local constructions (a Call's
// resolved_dicts).  Dynamic wrapped dicts become `let __ring_dictlocal_N =
// DictConstruct{..}` statements appended to `lets` + a Simple(local) borrow.
fn dl_ref_dyn(dr: DictRef, mut defs: List<HDictDef>, mut seen: Set<Str>,
              mut counter: List<Int>, mut lets: List<HStmt>, span: Span) -> DictRef {
    match dr {
        DictRef::Simple(_) => dr,
        DictRef::Static(name) => {
            let def_name = name
            let base_name = name
            let result_name = name
            dl_register(defs, seen, HDictDef { name: def_name,
                base_dict: base_name, trait_name: "", inner: [] })
            DictRef::Static(result_name)
        },
        DictRef::Wrapped { dict, trait_name, inner_dicts } => {
            let mut inner_refs: List<DictRef> = []
            for i in inner_dicts {
                let inner_ = i
                inner_refs.push(dl_ref_dyn(
                    inner_, defs, seen, counter, lets, span))
            }
            let mut all_static = true
            let mut inner_names: List<Str> = []
            for r in inner_refs {
                match r {
                    DictRef::Static(n) => {
                        let inner_name = n
                        inner_names.push(inner_name)
                    },
                    _ => { all_static = false },
                }
            }
            if all_static {
                let instance_dict = dict
                let instance_inner = inner_names
                let inst = dict_instance_name(instance_dict, instance_inner)
                let def_name = inst
                let result_name = inst
                let base_dict = dict
                let def_trait = trait_name
                let def_inner = inner_names
                dl_register(defs, seen, HDictDef { name: def_name,
                    base_dict: base_dict, trait_name: def_trait,
                    inner: def_inner })
                DictRef::Static(result_name)
            } else {
                counter.set(0, counter[0] + 1)
                let ordinal = counter[0]
                let lname = "__ring_dictlocal_${ordinal}"
                let local_def_id = synthetic_def_id(
                    SYNTHETIC_DICT_DEF_ID_BASE, ordinal)
                let construct_dict = dict
                let construct_trait = trait_name
                let construct_inner = inner_refs
                let construct_span = span
                let construct = HExpr::DictConstruct {
                    base_dict: construct_dict, trait_name: construct_trait,
                    inner: construct_inner,
                    ty: Type::TupleType { elements: [] }, effects: EMPTY_ROW,
                    span: construct_span
                }
                let binding_name = lname
                let result_name = lname
                let name_span = span
                let stmt_span = span
                lets.push(HStmt::Let { name: binding_name, name_span: name_span,
                    def_id: some(local_def_id),
                    ty: Type::TupleType { elements: [] }, init: construct,
                    span: stmt_span })
                DictRef::Simple(result_name)
            }
        },
    }
}

// Rewrite a DictRef in a position that CANNOT host local constructions (BinOp
// dispatch extra_dicts): all-static wrapped → Static(instance); a dynamic
// wrapped keeps its Wrapped shell (inners still individually rewritten).
fn dl_ref_static_only(dr: DictRef, mut defs: List<HDictDef>, mut seen: Set<Str>) -> DictRef {
    match dr {
        DictRef::Simple(_) => dr,
        DictRef::Static(name) => {
            let def_name = name
            let base_name = name
            let result_name = name
            dl_register(defs, seen, HDictDef { name: def_name,
                base_dict: base_name, trait_name: "", inner: [] })
            DictRef::Static(result_name)
        },
        DictRef::Wrapped { dict, trait_name, inner_dicts } => {
            let mut inner_refs: List<DictRef> = []
            for i in inner_dicts {
                let inner_ = i
                inner_refs.push(dl_ref_static_only(inner_, defs, seen))
            }
            let mut all_static = true
            let mut inner_names: List<Str> = []
            for r in inner_refs {
                match r {
                    DictRef::Static(n) => {
                        let inner_name = n
                        inner_names.push(inner_name)
                    },
                    _ => { all_static = false },
                }
            }
            if all_static {
                let instance_dict = dict
                let instance_inner = inner_names
                let inst = dict_instance_name(instance_dict, instance_inner)
                let def_name = inst
                let result_name = inst
                let base_dict = dict
                let def_trait = trait_name
                let def_inner = inner_names
                dl_register(defs, seen, HDictDef { name: def_name,
                    base_dict: base_dict, trait_name: def_trait,
                    inner: def_inner })
                DictRef::Static(result_name)
            } else {
                DictRef::Wrapped { ..dr, inner_dicts: inner_refs }
            }
        },
    }
}

fn dl_dispatch(d: TraitDispatch?, mut defs: List<HDictDef>, mut seen: Set<Str>) -> TraitDispatch? {
    match d {
        some(td) => match td {
            TraitDispatch::Direct { dict, extra_dicts } => {
                let def_name = dict
                let base_dict = dict
                dl_register(defs, seen, HDictDef { name: def_name,
                    base_dict: base_dict, trait_name: "", inner: [] })
                let mut new_extra: List<DictRef> = []
                for ed in extra_dicts {
                    let dict_ref = ed
                    new_extra.push(dl_ref_static_only(dict_ref, defs, seen))
                }
                some(TraitDispatch::Direct { ..td, extra_dicts: new_extra })
            },
            TraitDispatch::Tuple { elements, .. } => {
                let mut lowered_elements: List<TraitDispatch> = []
                for element in elements {
                    let element_ = element
                    match dl_dispatch(some(element_), defs, seen) {
                        some(lowered) => {
                            let lowered_ = lowered
                            lowered_elements.push(lowered_)
                        },
                        none => panic("dict_lower: tuple dispatch element disappeared"),
                    }
                }
                some(TraitDispatch::Tuple { ..td,
                    elements: lowered_elements })
            },
            _ => {
                let dispatch = td
                some(dispatch)
            },
        },
        none => none,
    }
}

// ============================================================
// Structural walkers
// ============================================================

fn dl_expr(e: HExpr, mut defs: List<HDictDef>, mut seen: Set<Str>, mut counter: List<Int>) -> HExpr {
    match e {
        HExpr::IntLit { .. } | HExpr::FloatLit { .. } |
        HExpr::StrLit { .. } | HExpr::BoolLit { .. } => e,
        HExpr::Ident { dict_closure_dicts, span, .. } => {
            let mut lets: List<HStmt> = []
            let lowered_dicts = match dict_closure_dicts {
                some(dicts) => {
                    let mut lowered: List<DictRef> = []
                    for dr in dicts {
                        let dict_ref = dr
                        lowered.push(dl_ref_dyn(
                            dict_ref, defs, seen, counter, lets, span))
                    }
                    some(lowered)
                },
                none => none,
            }
            let block_ty = hexpr_type(e)
            let block_effects = hexpr_effects(e)
            let block_span = hexpr_span(e)
            let ident = HExpr::Ident { ..e,
                dict_closure_dicts: lowered_dicts }
            if lets.len() == 0 {
                ident
            } else {
                // A dynamic wrapped dict is constructed exactly once, then
                // captured (dup) by the closure wrapper.  The local's ordinary
                // scope drop balances the construction reference.
                HExpr::Block {
                    stmts: lets, tail: some(ident),
                    ty: block_ty, effects: block_effects, span: block_span
                }
            }
        },
        HExpr::BinOp { left, right, eq_dispatch, ord_dispatch, .. } => {
            let left_ = left
            let right_ = right
            let eq_dispatch_ = eq_dispatch
            let ord_dispatch_ = ord_dispatch
            HExpr::BinOp { ..e,
                left: dl_expr(left_, defs, seen, counter),
                right: dl_expr(right_, defs, seen, counter),
                eq_dispatch: dl_dispatch(eq_dispatch_, defs, seen),
                ord_dispatch: dl_dispatch(ord_dispatch_, defs, seen) }
        },
        HExpr::UnaryOp { operand, .. } => {
            let operand_ = operand
            HExpr::UnaryOp { ..e,
                operand: dl_expr(operand_, defs, seen, counter) }
        },
        HExpr::Call { callee, args, resolved_dicts, span, .. } => {
            let callee_ = callee
            let new_callee = dl_expr(callee_, defs, seen, counter)
            let mut new_args: List<HExpr> = []
            for a in args {
                let arg_ = a
                new_args.push(dl_expr(arg_, defs, seen, counter))
            }
            let mut lets: List<HStmt> = []
            let mut new_dicts: List<DictRef> = []
            for dr in resolved_dicts {
                let dict_ref = dr
                new_dicts.push(dl_ref_dyn(
                    dict_ref, defs, seen, counter, lets, span))
            }
            let block_ty = hexpr_type(e)
            let block_effects = hexpr_effects(e)
            let block_span = hexpr_span(e)
            let call = HExpr::Call { ..e, callee: new_callee,
                args: new_args, resolved_dicts: new_dicts }
            if lets.len() == 0 {
                call
            } else {
                // The dict local(s) live exactly for the call: constructed
                // above it, scope-end-dropped by Perceus right after it.
                HExpr::Block { stmts: lets, tail: some(call),
                    ty: block_ty, effects: block_effects, span: block_span }
            }
        },
        HExpr::FieldAccess { receiver, .. } => {
            let receiver_ = receiver
            HExpr::FieldAccess { ..e,
                receiver: dl_expr(receiver_, defs, seen, counter) }
        },
        HExpr::StructLit { fields, spread, .. } => {
            let mut new_fields: List<HStructFieldInit> = []
            for f in fields {
                let field_value = f.value
                new_fields.push(HStructFieldInit { ..f,
                    value: dl_expr(field_value, defs, seen, counter) })
            }
            let new_spread = match spread {
                some(s) => {
                    let spread_ = s
                    some(dl_expr(spread_, defs, seen, counter))
                },
                none => none,
            }
            HExpr::StructLit { ..e, fields: new_fields, spread: new_spread }
        },
        HExpr::NamedVariantConstruct { fields, spread, .. } => {
            let mut new_fields: List<HStructFieldInit> = []
            for f in fields {
                let field_value = f.value
                new_fields.push(HStructFieldInit { ..f,
                    value: dl_expr(field_value, defs, seen, counter) })
            }
            let new_spread = match spread {
                some(s) => {
                    let spread_ = s
                    some(dl_expr(spread_, defs, seen, counter))
                },
                none => none,
            }
            HExpr::NamedVariantConstruct { ..e, fields: new_fields,
                spread: new_spread }
        },
        HExpr::MatchExpr { scrutinee, arms, .. } => {
            let scrutinee_ = scrutinee
            let arms_ = arms
            HExpr::MatchExpr { ..e,
                scrutinee: dl_expr(scrutinee_, defs, seen, counter),
                arms: dl_arms(arms_, defs, seen, counter) }
        },
        HExpr::Block { stmts, tail, .. } => {
            let mut new_stmts: List<HStmt> = []
            for s in stmts {
                let stmt_ = s
                new_stmts.push(dl_stmt(stmt_, defs, seen, counter))
            }
            let new_tail = match tail {
                some(t) => {
                    let tail_ = t
                    some(dl_expr(tail_, defs, seen, counter))
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
                    some(dl_expr(else_, defs, seen, counter))
                },
                none => none,
            }
            HExpr::IfExpr { ..e,
                condition: dl_expr(condition_, defs, seen, counter),
                then_branch: dl_expr(then_branch_, defs, seen, counter),
                else_branch: new_else }
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
                            dl_expr(expression_, defs, seen, counter)))
                    },
                }
            }
            HExpr::StringInterp { ..e, parts: new_parts }
        },
        HExpr::TryCatch { body, arms, .. } => {
            let body_ = body
            let arms_ = arms
            HExpr::TryCatch { ..e,
                body: dl_expr(body_, defs, seen, counter),
                arms: dl_arms(arms_, defs, seen, counter) }
        },
        HExpr::HandleExpr { body, handlers, .. } => {
            let body_ = body
            let mut new_handlers: List<HEffectHandler> = []
            for h in handlers {
                let handler_body = h.body
                new_handlers.push(HEffectHandler { ..h,
                    body: dl_expr(handler_body, defs, seen, counter) })
            }
            HExpr::HandleExpr { ..e,
                body: dl_expr(body_, defs, seen, counter),
                handlers: new_handlers }
        },
        HExpr::Lambda { body, .. } => {
            let body_ = body
            HExpr::Lambda { ..e,
                body: dl_expr(body_, defs, seen, counter) }
        },
        HExpr::EffectOp { args, .. } => {
            let mut new_args: List<HExpr> = []
            for a in args {
                let arg_ = a
                new_args.push(dl_expr(arg_, defs, seen, counter))
            }
            HExpr::EffectOp { ..e, args: new_args }
        },
        HExpr::RangeExpr { start, end, .. } => {
            let start_ = start
            let end_ = end
            HExpr::RangeExpr { ..e,
                start: dl_expr(start_, defs, seen, counter),
                end: dl_expr(end_, defs, seen, counter) }
        },
        HExpr::ListLit { elements, .. } => {
            let mut new_elems: List<HExpr> = []
            for el in elements {
                let element_ = el
                new_elems.push(dl_expr(element_, defs, seen, counter))
            }
            HExpr::ListLit { ..e, elements: new_elems }
        },
        HExpr::TupleLit { elements, .. } => {
            let mut new_elems: List<HExpr> = []
            for el in elements {
                let element_ = el
                new_elems.push(dl_expr(element_, defs, seen, counter))
            }
            HExpr::TupleLit { ..e, elements: new_elems }
        },
        HExpr::IndexExpr { receiver, index, .. } => {
            let receiver_ = receiver
            let index_ = index
            HExpr::IndexExpr { ..e,
                receiver: dl_expr(receiver_, defs, seen, counter),
                index: dl_expr(index_, defs, seen, counter) }
        },
        // Created by this pass only — never present in input HIR.
        HExpr::DictConstruct { .. } => e,
        // Clone is inserted by perceus (runs after this pass) — never present.
        HExpr::Clone { inner, .. } => {
            let inner_ = inner
            HExpr::Clone { ..e,
                inner: dl_expr(inner_, defs, seen, counter) }
        },
        HExpr::Take { .. } => e,
        // B-113: return in expression position (match arm)
        HExpr::ReturnExpr { value, .. } => match value {
            some(v) => {
                let value_ = v
                HExpr::ReturnExpr { ..e,
                    value: some(dl_expr(value_, defs, seen, counter)) }
            },
            none => e,
        },
        // B-125: unsafe block — recurse into body
        HExpr::UnsafeBlock { body, .. } => {
            let body_ = body
            HExpr::UnsafeBlock { ..e,
                body: dl_expr(body_, defs, seen, counter) }
        },
    }
}

fn dl_arms(arms: List<HMatchArm>, mut defs: List<HDictDef>, mut seen: Set<Str>, mut counter: List<Int>) -> List<HMatchArm> {
    let mut out: List<HMatchArm> = []
    for arm in arms {
        let new_guard = match arm.guard {
            some(g) => {
                let guard_ = g
                some(dl_expr(guard_, defs, seen, counter))
            },
            none => none,
        }
        let body_ = arm.body
        out.push(HMatchArm { ..arm, guard: new_guard,
            body: dl_expr(body_, defs, seen, counter) })
    }
    out
}

fn dl_stmt(s: HStmt, mut defs: List<HDictDef>, mut seen: Set<Str>, mut counter: List<Int>) -> HStmt {
    match s {
        HStmt::Let { init, .. } => {
            let init_ = init
            HStmt::Let { ..s, init: dl_expr(init_, defs, seen, counter) }
        },
        HStmt::Var { init, .. } => {
            let init_ = init
            HStmt::Var { ..s, init: dl_expr(init_, defs, seen, counter) }
        },
        HStmt::Assign { target, value, .. } => {
            let target_ = target
            let value_ = value
            HStmt::Assign { ..s,
                target: dl_expr(target_, defs, seen, counter),
                value: dl_expr(value_, defs, seen, counter) }
        },
        HStmt::ExprStmt { expr, .. } => {
            let expr_ = expr
            HStmt::ExprStmt { ..s,
                expr: dl_expr(expr_, defs, seen, counter) }
        },
        HStmt::Return { value, .. } => {
            let new_value = match value {
                some(v) => {
                    let value_ = v
                    some(dl_expr(value_, defs, seen, counter))
                },
                none => none,
            }
            HStmt::Return { ..s, value: new_value }
        },
        HStmt::While { condition, body, .. } => {
            let condition_ = condition
            let body_ = body
            HStmt::While { ..s,
                condition: dl_expr(condition_, defs, seen, counter),
                body: dl_expr(body_, defs, seen, counter) }
        },
        HStmt::ForIn { iterable, body, .. } => {
            let iterable_ = iterable
            let body_ = body
            HStmt::ForIn { ..s,
                iterable: dl_expr(iterable_, defs, seen, counter),
                body: dl_expr(body_, defs, seen, counter) }
        },
        HStmt::Break { .. } | HStmt::Continue { .. } => s,
        HStmt::LetDestructure { init, .. } => {
            let init_ = init
            HStmt::LetDestructure { ..s,
                init: dl_expr(init_, defs, seen, counter) }
        },
        HStmt::IfLet { expr, then_block, else_block, .. } => {
            let expr_ = expr
            let then_block_ = then_block
            let new_else = match else_block {
                some(eb) => {
                    let else_ = eb
                    some(dl_expr(else_, defs, seen, counter))
                },
                none => none,
            }
            HStmt::IfLet { ..s,
                expr: dl_expr(expr_, defs, seen, counter),
                then_block: dl_expr(then_block_, defs, seen, counter),
                else_block: new_else }
        },
        // RC ops are inserted by perceus (after this pass) — never present.
        HStmt::Drop { .. } => s
    }
}
