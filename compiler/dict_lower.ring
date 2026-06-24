// ============================================================
// dict_lower.ring — B-104 D4 (#151): dict evidence HIR first-classing
// ============================================================
//
// Runs once per module at the end of checking (checker.ring), BEFORE perceus
// and BOTH backends, so dict construction and lifetime are visible to the RC
// pass / verifier and lowered identically by JS and LLVM codegen.
//
// Input invariant (established by infer / infer_ctx at DictRef creation):
//   * DictRef::Static(name)  — a plain static dict (trait_dict_name sites).
//   * DictRef::Simple(name)  — a dict PARAM reference (trait_bound_param_name
//     sites).  Borrow of a binding in scope.
//   * DictRef::Wrapped{..}   — a parameterized type's dict resolution.
//
// This pass rewrites every use site (Call.resolved_dicts and BinOp
// eq/ord_dispatch extra_dicts):
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
//   * Ident.dict_closure_dicts (List<Str> names) and derive FieldAction
//     extra_dicts (List<Str>) — name-based references; the LLVM resolver's
//     name chain returns memoised singletons for static names, params resolve
//     from scope.  No per-use construction remains after D4's LLVM side.
//   * BinOp dispatch extra_dicts with a DYNAMIC inner stay Wrapped: the JS
//     backend builds the wrapper inline (GC reclaims); the LLVM backend
//     ignores extra_dicts in Eq/Ord dispatch (pre-existing functional gap,
//     reported — nothing is constructed, so nothing leaks).

use ast::{Span}
use types::{Type, EffectRow, EMPTY_ROW}
use hir::{HProgram, HDecl, HStmt, HExpr, HMatchArm, HStructFieldInit,
    HStringInterpPart, HEffectHandler, HTraitMethod, DictRef, TraitDispatch,
    HDictDef, dict_instance_name, hexpr_type, hexpr_effects, hexpr_span}

pub fn lower_dicts(program: HProgram) -> HProgram {
    let mut defs: List<HDictDef> = []
    let mut seen: Set<Str> = set_new()
    // Per-program gensym for dict locals (names are function-scoped at codegen,
    // but a global counter is simplest and collision-free).
    let mut counter: List<Int> = [0]
    let mut new_decls: List<HDecl> = []
    for d in program.decls {
        new_decls.push(dl_decl(d, defs, seen, counter))
    }
    HProgram {
        decls: new_decls,
        derived_impls: program.derived_impls,
        boxed_vars: program.boxed_vars,
        static_dicts: defs
    }
}

fn dl_decl(d: HDecl, mut defs: List<HDictDef>, mut seen: Set<Str>, mut counter: List<Int>) -> HDecl {
    match d {
        HDecl::Fn { name, def_id, type_params, params, return_type, effects, body, is_pub, trait_bounds, span } =>
            HDecl::Fn { name: name, def_id: def_id, type_params: type_params, params: params,
                return_type: return_type, effects: effects,
                body: dl_expr(body, defs, seen, counter),
                is_pub: is_pub, trait_bounds: trait_bounds, span: span },
        HDecl::Impl { target_type, type_params, trait_name, methods, assoc_types, span } => {
            let mut new_methods: List<HDecl> = []
            for m in methods { new_methods.push(dl_decl(m, defs, seen, counter)) }
            HDecl::Impl { target_type: target_type, type_params: type_params, trait_name: trait_name,
                methods: new_methods, assoc_types: assoc_types, span: span }
        },
        HDecl::Test { description, body, span } =>
            HDecl::Test { description: description, body: dl_expr(body, defs, seen, counter), span: span },
        HDecl::Const { name, def_id, ty, init, is_pub, span } =>
            HDecl::Const { name: name, def_id: def_id, ty: ty,
                init: dl_expr(init, defs, seen, counter), is_pub: is_pub, span: span },
        HDecl::ModBlock { name, decls, is_pub, span } => {
            let mut new_inner: List<HDecl> = []
            for md in decls { new_inner.push(dl_decl(md, defs, seen, counter)) }
            HDecl::ModBlock { name: name, decls: new_inner, is_pub: is_pub, span: span }
        },
        HDecl::Trait { name, type_params, methods, supertraits, assoc_types, is_pub, span } => {
            // Default method bodies are real HIR (checked by infer) — lower them too.
            let mut new_methods: List<HTraitMethod> = []
            for tm in methods {
                let new_body = match tm.body {
                    some(b) => some(dl_expr(b, defs, seen, counter)),
                    none => none,
                }
                new_methods.push(HTraitMethod { name: tm.name, params: tm.params,
                    return_type: tm.return_type, effects: tm.effects, has_default: tm.has_default, body: new_body })
            }
            HDecl::Trait { name: name, type_params: type_params, methods: new_methods,
                supertraits: supertraits, assoc_types: assoc_types, is_pub: is_pub, span: span }
        },
        HDecl::Struct { name, type_params, fields, is_pub, span } =>
            HDecl::Struct { name: name, type_params: type_params, fields: fields, is_pub: is_pub, span: span },
        HDecl::Enum { name, type_params, variants, is_pub, span } =>
            HDecl::Enum { name: name, type_params: type_params, variants: variants, is_pub: is_pub, span: span },
        HDecl::Effect { name, type_params, ops, is_pub, span } =>
            HDecl::Effect { name: name, type_params: type_params, ops: ops, is_pub: is_pub, span: span },
        HDecl::ExternFn { name, def_id, type_params, params, return_type, effects, is_pub, span } =>
            HDecl::ExternFn { name: name, def_id: def_id, type_params: type_params, params: params, return_type: return_type, effects: effects, is_pub: is_pub, span: span },
        HDecl::ExternType { name, type_params, is_pub, span } =>
            HDecl::ExternType { name: name, type_params: type_params, is_pub: is_pub, span: span },
        HDecl::TypeAlias { name, ty, is_pub, span } =>
            HDecl::TypeAlias { name: name, ty: ty, is_pub: is_pub, span: span },
        HDecl::Sig { name, members, is_pub, span } =>
            HDecl::Sig { name: name, members: members, is_pub: is_pub, span: span },
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
        DictRef::Simple(name) => DictRef::Simple(name),
        DictRef::Static(name) => {
            dl_register(defs, seen, HDictDef { name: name, base_dict: name, trait_name: "", inner: [] })
            DictRef::Static(name)
        },
        DictRef::Wrapped { dict, trait_name, inner_dicts } => {
            let mut inner_refs: List<DictRef> = []
            for i in inner_dicts {
                inner_refs.push(dl_ref_dyn(i, defs, seen, counter, lets, span))
            }
            let mut all_static = true
            let mut inner_names: List<Str> = []
            for r in inner_refs {
                match r {
                    DictRef::Static(n) => inner_names.push(n),
                    _ => { all_static = false },
                }
            }
            if all_static {
                let inst = dict_instance_name(dict, inner_names)
                dl_register(defs, seen, HDictDef { name: inst, base_dict: dict, trait_name: trait_name, inner: inner_names })
                DictRef::Static(inst)
            } else {
                counter.set(0, counter[0] + 1)
                let lname = "__ring_dictlocal_${counter[0]}"
                let construct = HExpr::DictConstruct {
                    base_dict: dict, trait_name: trait_name, inner: inner_refs,
                    ty: Type::TupleType { elements: [] }, effects: EMPTY_ROW, span: span
                }
                lets.push(HStmt::Let { name: lname, name_span: span, def_id: none,
                    ty: Type::TupleType { elements: [] }, init: construct, span: span })
                DictRef::Simple(lname)
            }
        },
    }
}

// Rewrite a DictRef in a position that CANNOT host local constructions (BinOp
// dispatch extra_dicts): all-static wrapped → Static(instance); a dynamic
// wrapped keeps its Wrapped shell (inners still individually rewritten).
fn dl_ref_static_only(dr: DictRef, mut defs: List<HDictDef>, mut seen: Set<Str>) -> DictRef {
    match dr {
        DictRef::Simple(name) => DictRef::Simple(name),
        DictRef::Static(name) => {
            dl_register(defs, seen, HDictDef { name: name, base_dict: name, trait_name: "", inner: [] })
            DictRef::Static(name)
        },
        DictRef::Wrapped { dict, trait_name, inner_dicts } => {
            let mut inner_refs: List<DictRef> = []
            for i in inner_dicts {
                inner_refs.push(dl_ref_static_only(i, defs, seen))
            }
            let mut all_static = true
            let mut inner_names: List<Str> = []
            for r in inner_refs {
                match r {
                    DictRef::Static(n) => inner_names.push(n),
                    _ => { all_static = false },
                }
            }
            if all_static {
                let inst = dict_instance_name(dict, inner_names)
                dl_register(defs, seen, HDictDef { name: inst, base_dict: dict, trait_name: trait_name, inner: inner_names })
                DictRef::Static(inst)
            } else {
                DictRef::Wrapped { dict: dict, trait_name: trait_name, inner_dicts: inner_refs }
            }
        },
    }
}

fn dl_dispatch(d: TraitDispatch?, mut defs: List<HDictDef>, mut seen: Set<Str>) -> TraitDispatch? {
    match d {
        some(td) => match td {
            TraitDispatch::Direct { dict, extra_dicts } => {
                dl_register(defs, seen, HDictDef { name: dict, base_dict: dict, trait_name: "", inner: [] })
                let mut new_extra: List<DictRef> = []
                for ed in extra_dicts { new_extra.push(dl_ref_static_only(ed, defs, seen)) }
                some(TraitDispatch::Direct { dict: dict, extra_dicts: new_extra })
            },
            _ => some(td),
        },
        none => none,
    }
}

// ============================================================
// Structural walkers
// ============================================================

fn dl_expr(e: HExpr, mut defs: List<HDictDef>, mut seen: Set<Str>, mut counter: List<Int>) -> HExpr {
    match e {
        HExpr::IntLit { value, ty, effects, span } =>
            HExpr::IntLit { value: value, ty: ty, effects: effects, span: span },
        HExpr::FloatLit { value, ty, effects, span } =>
            HExpr::FloatLit { value: value, ty: ty, effects: effects, span: span },
        HExpr::StrLit { value, ty, effects, span } =>
            HExpr::StrLit { value: value, ty: ty, effects: effects, span: span },
        HExpr::BoolLit { value, ty, effects, span } =>
            HExpr::BoolLit { value: value, ty: ty, effects: effects, span: span },
        HExpr::Ident { name, resolved_name, def_id, dict_closure_dicts, ty, effects, span } =>
            HExpr::Ident { name: name, resolved_name: resolved_name, def_id: def_id, dict_closure_dicts: dict_closure_dicts, ty: ty, effects: effects, span: span },
        HExpr::BinOp { op, left, right, eq_dispatch, ord_dispatch, ty, effects, span } =>
            HExpr::BinOp { op: op,
                left: dl_expr(left, defs, seen, counter),
                right: dl_expr(right, defs, seen, counter),
                eq_dispatch: dl_dispatch(eq_dispatch, defs, seen),
                ord_dispatch: dl_dispatch(ord_dispatch, defs, seen),
                ty: ty, effects: effects, span: span },
        HExpr::UnaryOp { op, operand, ty, effects, span } =>
            HExpr::UnaryOp { op: op, operand: dl_expr(operand, defs, seen, counter), ty: ty, effects: effects, span: span },
        HExpr::Call { callee, args, type_args, resolved_dicts, dict_dispatch, ty, effects, span } => {
            let new_callee = dl_expr(callee, defs, seen, counter)
            let mut new_args: List<HExpr> = []
            for a in args { new_args.push(dl_expr(a, defs, seen, counter)) }
            let mut lets: List<HStmt> = []
            let mut new_dicts: List<DictRef> = []
            for dr in resolved_dicts {
                new_dicts.push(dl_ref_dyn(dr, defs, seen, counter, lets, span))
            }
            let call = HExpr::Call { callee: new_callee, args: new_args, type_args: type_args,
                resolved_dicts: new_dicts, dict_dispatch: dict_dispatch,
                ty: ty, effects: effects, span: span }
            if lets.len() == 0 {
                call
            } else {
                // The dict local(s) live exactly for the call: constructed
                // above it, scope-end-dropped by Perceus right after it.
                HExpr::Block { stmts: lets, tail: some(call), ty: ty, effects: effects, span: span }
            }
        },
        HExpr::FieldAccess { receiver, field, ty, effects, span } =>
            HExpr::FieldAccess { receiver: dl_expr(receiver, defs, seen, counter), field: field, ty: ty, effects: effects, span: span },
        HExpr::StructLit { name, type_args, fields, spread, ty, effects, span } => {
            let mut new_fields: List<HStructFieldInit> = []
            for f in fields {
                new_fields.push(HStructFieldInit { name: f.name, value: dl_expr(f.value, defs, seen, counter) })
            }
            let new_spread = match spread {
                some(s) => some(dl_expr(s, defs, seen, counter)),
                none => none,
            }
            HExpr::StructLit { name: name, type_args: type_args, fields: new_fields, spread: new_spread, ty: ty, effects: effects, span: span }
        },
        HExpr::NamedVariantConstruct { enum_name, variant_name, fields, spread, ty, effects, span } => {
            let mut new_fields: List<HStructFieldInit> = []
            for f in fields {
                new_fields.push(HStructFieldInit { name: f.name, value: dl_expr(f.value, defs, seen, counter) })
            }
            let new_spread = match spread {
                some(s) => some(dl_expr(s, defs, seen, counter)),
                none => none,
            }
            HExpr::NamedVariantConstruct { enum_name: enum_name, variant_name: variant_name, fields: new_fields, spread: new_spread, ty: ty, effects: effects, span: span }
        },
        HExpr::MatchExpr { scrutinee, arms, ty, effects, span } =>
            HExpr::MatchExpr { scrutinee: dl_expr(scrutinee, defs, seen, counter),
                arms: dl_arms(arms, defs, seen, counter), ty: ty, effects: effects, span: span },
        HExpr::Block { stmts, tail, ty, effects, span } => {
            let mut new_stmts: List<HStmt> = []
            for s in stmts { new_stmts.push(dl_stmt(s, defs, seen, counter)) }
            let new_tail = match tail {
                some(t) => some(dl_expr(t, defs, seen, counter)),
                none => none,
            }
            HExpr::Block { stmts: new_stmts, tail: new_tail, ty: ty, effects: effects, span: span }
        },
        HExpr::IfExpr { condition, then_branch, else_branch, ty, effects, span } => {
            let new_else = match else_branch {
                some(eb) => some(dl_expr(eb, defs, seen, counter)),
                none => none,
            }
            HExpr::IfExpr { condition: dl_expr(condition, defs, seen, counter),
                then_branch: dl_expr(then_branch, defs, seen, counter),
                else_branch: new_else, ty: ty, effects: effects, span: span }
        },
        HExpr::StringInterp { parts, ty, effects, span } => {
            let mut new_parts: List<HStringInterpPart> = []
            for p in parts {
                match p {
                    HStringInterpPart::Literal(s) => new_parts.push(HStringInterpPart::Literal(s)),
                    HStringInterpPart::Expression(ex) => new_parts.push(HStringInterpPart::Expression(dl_expr(ex, defs, seen, counter))),
                }
            }
            HExpr::StringInterp { parts: new_parts, ty: ty, effects: effects, span: span }
        },
        HExpr::TryCatch { body, arms, ty, effects, span } =>
            HExpr::TryCatch { body: dl_expr(body, defs, seen, counter),
                arms: dl_arms(arms, defs, seen, counter), ty: ty, effects: effects, span: span },
        HExpr::HandleExpr { body, handlers, ty, effects, span } => {
            let mut new_handlers: List<HEffectHandler> = []
            for h in handlers {
                new_handlers.push(HEffectHandler { effect_name: h.effect_name, op_name: h.op_name,
                    params: h.params, resume_name: h.resume_name,
                    body: dl_expr(h.body, defs, seen, counter) })
            }
            HExpr::HandleExpr { body: dl_expr(body, defs, seen, counter), handlers: new_handlers, ty: ty, effects: effects, span: span }
        },
        HExpr::Lambda { params, return_type, body, ty, effects, span } =>
            HExpr::Lambda { params: params, return_type: return_type,
                body: dl_expr(body, defs, seen, counter), ty: ty, effects: effects, span: span },
        HExpr::EffectOp { effect_name, op_name, args, ty, effects, span } => {
            let mut new_args: List<HExpr> = []
            for a in args { new_args.push(dl_expr(a, defs, seen, counter)) }
            HExpr::EffectOp { effect_name: effect_name, op_name: op_name, args: new_args, ty: ty, effects: effects, span: span }
        },
        HExpr::RangeExpr { start, end, inclusive, ty, effects, span } =>
            HExpr::RangeExpr { start: dl_expr(start, defs, seen, counter),
                end: dl_expr(end, defs, seen, counter), inclusive: inclusive, ty: ty, effects: effects, span: span },
        HExpr::ListLit { elements, ty, effects, span } => {
            let mut new_elems: List<HExpr> = []
            for el in elements { new_elems.push(dl_expr(el, defs, seen, counter)) }
            HExpr::ListLit { elements: new_elems, ty: ty, effects: effects, span: span }
        },
        HExpr::TupleLit { elements, ty, effects, span } => {
            let mut new_elems: List<HExpr> = []
            for el in elements { new_elems.push(dl_expr(el, defs, seen, counter)) }
            HExpr::TupleLit { elements: new_elems, ty: ty, effects: effects, span: span }
        },
        HExpr::IndexExpr { receiver, index, ty, effects, span } =>
            HExpr::IndexExpr { receiver: dl_expr(receiver, defs, seen, counter),
                index: dl_expr(index, defs, seen, counter), ty: ty, effects: effects, span: span },
        // Created by this pass only — never present in input HIR.
        HExpr::DictConstruct { base_dict, trait_name, inner, ty, effects, span } =>
            HExpr::DictConstruct { base_dict: base_dict, trait_name: trait_name, inner: inner, ty: ty, effects: effects, span: span },
        // Clone is inserted by perceus (runs after this pass) — never present.
        HExpr::Clone { inner, ty, effects, span } =>
            HExpr::Clone { inner: dl_expr(inner, defs, seen, counter), ty: ty, effects: effects, span: span },
        // B-113: return in expression position (match arm)
        HExpr::ReturnExpr { value, ty, effects, span } => match value {
            some(v) => HExpr::ReturnExpr { value: some(dl_expr(v, defs, seen, counter)), ty: ty, effects: effects, span: span },
            none => HExpr::ReturnExpr { value: none, ty: ty, effects: effects, span: span },
        },
    }
}

fn dl_arms(arms: List<HMatchArm>, mut defs: List<HDictDef>, mut seen: Set<Str>, mut counter: List<Int>) -> List<HMatchArm> {
    let mut out: List<HMatchArm> = []
    for arm in arms {
        let new_guard = match arm.guard {
            some(g) => some(dl_expr(g, defs, seen, counter)),
            none => none,
        }
        out.push(HMatchArm { pattern: arm.pattern, guard: new_guard,
            body: dl_expr(arm.body, defs, seen, counter), span: arm.span })
    }
    out
}

fn dl_stmt(s: HStmt, mut defs: List<HDictDef>, mut seen: Set<Str>, mut counter: List<Int>) -> HStmt {
    match s {
        HStmt::Let { name, name_span, def_id, ty, init, span } =>
            HStmt::Let { name: name, name_span: name_span, def_id: def_id, ty: ty,
                init: dl_expr(init, defs, seen, counter), span: span },
        HStmt::Var { name, name_span, def_id, ty, init, span } =>
            HStmt::Var { name: name, name_span: name_span, def_id: def_id, ty: ty,
                init: dl_expr(init, defs, seen, counter), span: span },
        HStmt::Assign { target, value, span } =>
            HStmt::Assign { target: dl_expr(target, defs, seen, counter),
                value: dl_expr(value, defs, seen, counter), span: span },
        HStmt::ExprStmt { expr, span } =>
            HStmt::ExprStmt { expr: dl_expr(expr, defs, seen, counter), span: span },
        HStmt::Return { value, span } => {
            let new_value = match value {
                some(v) => some(dl_expr(v, defs, seen, counter)),
                none => none,
            }
            HStmt::Return { value: new_value, span: span }
        },
        HStmt::While { condition, body, span } =>
            HStmt::While { condition: dl_expr(condition, defs, seen, counter),
                body: dl_expr(body, defs, seen, counter), span: span },
        HStmt::ForIn { binding, binding_span, def_id, destructure, iterable, body, iterable_type_name, iter_type_name, span } =>
            HStmt::ForIn { binding: binding, binding_span: binding_span, def_id: def_id,
                destructure: destructure,
                iterable: dl_expr(iterable, defs, seen, counter),
                body: dl_expr(body, defs, seen, counter),
                iterable_type_name: iterable_type_name, iter_type_name: iter_type_name, span: span },
        HStmt::Break { span } => HStmt::Break { span: span },
        HStmt::Continue { span } => HStmt::Continue { span: span },
        HStmt::LetDestructure { pattern, bindings, init, span } =>
            HStmt::LetDestructure { pattern: pattern, bindings: bindings,
                init: dl_expr(init, defs, seen, counter), span: span },
        HStmt::IfLet { pattern, expr, then_block, else_block, span } => {
            let new_else = match else_block {
                some(eb) => some(dl_expr(eb, defs, seen, counter)),
                none => none,
            }
            HStmt::IfLet { pattern: pattern, expr: dl_expr(expr, defs, seen, counter),
                then_block: dl_expr(then_block, defs, seen, counter), else_block: new_else, span: span }
        },
        // RC ops are inserted by perceus (after this pass) — never present.
        HStmt::Drop { name, ty, span } => HStmt::Drop { name: name, ty: ty, span: span },
        HStmt::Dup { name, ty, span } => HStmt::Dup { name: name, ty: ty, span: span },
    }
}
