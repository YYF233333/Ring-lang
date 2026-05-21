use types::{Type, Effect, EffectRow, StructField, EnumVariant,
    INT, FLOAT, STR, BOOL, UNIT, NEVER, ANY, EMPTY_ROW,
    type_to_string, types_equal, make_option_type, is_option_type, option_inner,
    type_to_builtin_name, effect_row}
use ast::{Program, Decl, Expr, Stmt, Param, MatchArm, StructFieldInit,
    EffectHandler, StringInterpPart, Pattern, BinOp, UnaryOp, TypeExpr,
    TypeParam, TypeBound, Span, UseDecl, DestructureBinding, span_zero,
    NamedPatternField, EffectOpDecl}
use hir::{HExpr, HStmt, HDecl, HParam, HMatchArm, HEffectHandler,
    HStructFieldInit, HStringInterpPart, HProgram, DerivedImpl,
    TraitDispatch, DictDispatchInfo, TraitBound,
    HStructField, HEnumVariant, HEffectOp, HTraitMethod,
    HForInDestructure, HLetDestructureBinding,
    variant_js_name, trait_dict_name, trait_bound_param_name,
    BUILTIN_RANGE, BUILTIN_LIST, BUILTIN_MAP, BUILTIN_SET,
    hexpr_type, hexpr_effects, hexpr_span}
use diagnostics::{DiagnosticContext, CollectingSink}
use codes::{E0201, E0203, E0205, E0206, E0301, E0303, E0304, E0305,
    E0307, E0308, E0402, E0504, E0601}
use union_find::{UnionFind, uf_find, uf_lookup}
use env::{TypeEnv, TypeScheme, SchemeBound, StructDef, EnumDef, EffectDef,
    EffectOpDef, TraitDef, TraitMethodDef, ImplEntry, TypeAliasDef,
    BuiltInKind, mono, apply_subst, apply_subst_row, apply_subst_map}
use unify::{unify}
use infer_ctx::{InferCtx, InferResult, FnBoundsEntry, CompileError,
    type_error, merge_effects, unify_at, update_fn_effects,
    resolve_type_expr, resolve_self_type, resolve_named_type,
    bind_pattern, build_scheme_var_map, resolve_dicts_from_scheme,
    remove_fail_effect, remove_specific_fail_effect,
    generalize}
use exhaustive::{check_exhaustive}


struct MethodLookupResult {
    method_type: Type?,
    method_scheme: TypeScheme?
}


// ============================================================
// Resolve substitution var chain
// ============================================================

fn resolve_var_id(id: Int, sub: UnionFind) -> Int {
    match uf_lookup(sub, id) {
        some(resolved) => match resolved {
            Type::TypeVar { id: new_id, .. } => resolve_var_id(new_id, sub),
            _ => id
        },
        none => uf_find(sub, id)
    }
}

// ============================================================
// Block inference (from infer-stmt.ts)
// ============================================================

pub fn infer_block(var ctx: InferCtx, body: Expr, initial_subst: UnionFind?) -> InferResult {
    match body {
        Expr::Block { stmts, tail, span } => {
            var subst = match initial_subst { some(s) => s, none => ctx.subst }
            var effects: EffectRow = EMPTY_ROW
            var hstmts: List<HStmt> = []

            for stmt in stmts {
                let sr = infer_stmt(ctx, stmt, subst)
                subst = sr.subst
                let me = merge_effects(ctx.env, effects, sr.effects, subst)
                effects = me.0
                subst = me.1
                hstmts.push(sr.hstmt)
            }

            var tail_hexpr: HExpr? = none
            var block_type: Type = UNIT

            match tail {
                some(t) => {
                    let tr = infer_expr(ctx, t, subst)
                    subst = tr.subst
                    let me = merge_effects(ctx.env, effects, tr.effects, subst)
                    effects = me.0
                    subst = me.1
                    tail_hexpr = some(tr.hexpr)
                    block_type = hexpr_type(tr.hexpr)
                },
                none => {}
            }

            let hblock = HExpr::Block {
                stmts: hstmts, tail: tail_hexpr,
                ty: block_type, effects: effects, span: span
            }
            InferResult { hexpr: hblock, subst: subst, effects: effects }
        },
        _ => panic("infer_block called with non-block expression")
    }
}

// ============================================================
// Statement inference result helper
// ============================================================

struct StmtResult {
    hstmt: HStmt,
    subst: UnionFind,
    effects: EffectRow
}

// ============================================================
// Statement inference (from infer-stmt.ts)
// ============================================================

pub fn infer_stmt(var ctx: InferCtx, stmt: Stmt, subst: UnionFind) -> StmtResult {
    match stmt {
        Stmt::Let { name, name_span, type_annotation, init, span } => {
            let init_r = infer_expr(ctx, init, subst)
            var s = init_r.subst
            var var_type = hexpr_type(init_r.hexpr)
            match type_annotation {
                some(ta) => {
                    let annotated = resolve_type_expr(ctx, ta)
                    s = unify_at(ctx.sink, ctx.env, var_type, annotated, s, span)
                    var_type = apply_subst(s, annotated)
                },
                none => {}
            }
            let resolved = apply_subst(s, var_type)
            let scheme = generalize(ctx.env, resolved, s)
            ctx.env.bind(name, scheme)
            match scheme.def_id {
                some(did) => ctx.env.record_def_span(did, name_span),
                none => {}
            }
            StmtResult {
                hstmt: HStmt::Let { name: name, name_span: name_span, def_id: scheme.def_id, ty: resolved, init: init_r.hexpr, span: span },
                subst: s,
                effects: init_r.effects
            }
        },
        Stmt::Var { name, name_span, type_annotation, init, span } => {
            let init_r = infer_expr(ctx, init, subst)
            var s = init_r.subst
            var var_type = hexpr_type(init_r.hexpr)
            match type_annotation {
                some(ta) => {
                    let annotated = resolve_type_expr(ctx, ta)
                    s = unify_at(ctx.sink, ctx.env, var_type, annotated, s, span)
                    var_type = apply_subst(s, annotated)
                },
                none => {}
            }
            ctx.env.bind_mono(name, apply_subst(s, var_type))
            let var_scheme = ctx.env.lookup(name)
            match var_scheme {
                some(vs) => {
                    match vs.def_id {
                        some(did) => {
                            ctx.env.record_def_span(did, name_span)
                            ctx.env.scope.mutable_vars.insert(did)
                        },
                        none => {}
                    }
                    StmtResult {
                        hstmt: HStmt::Var { name: name, name_span: name_span, def_id: vs.def_id, ty: apply_subst(s, var_type), init: init_r.hexpr, span: span },
                        subst: s,
                        effects: init_r.effects
                    }
                },
                none => panic("var_stmt: lookup failed")
            }
        },
        Stmt::Assign { target, value, span } => {
            check_assign_target_mutable(ctx, target)
            let target_r = infer_expr(ctx, target, subst)
            let value_r = infer_expr(ctx, value, target_r.subst)
            var s = unify_at(ctx.sink, ctx.env, hexpr_type(target_r.hexpr), hexpr_type(value_r.hexpr), value_r.subst, span)
            let me = merge_effects(ctx.env, target_r.effects, value_r.effects, s)
            s = me.1
            StmtResult {
                hstmt: HStmt::Assign { target: target_r.hexpr, value: value_r.hexpr, span: span },
                subst: s,
                effects: me.0
            }
        },
        Stmt::ExprStmt { expr, span, .. } => {
            let r = infer_expr(ctx, expr, subst)
            StmtResult {
                hstmt: HStmt::ExprStmt { expr: r.hexpr, span: span },
                subst: r.subst,
                effects: r.effects
            }
        },
        Stmt::Return { value, span } => match value {
            some(v) => {
                let r = infer_expr(ctx, v, subst)
                var s = r.subst
                match ctx.current_fn_return_type {
                    some(ret_type) => {
                        s = unify_at(ctx.sink, ctx.env, hexpr_type(r.hexpr), ret_type, s, span)
                    },
                    none => {}
                }
                StmtResult {
                    hstmt: HStmt::Return { value: some(r.hexpr), span: span },
                    subst: s,
                    effects: r.effects
                }
            },
            none => {
                var s = subst
                match ctx.current_fn_return_type {
                    some(ret_type) => {
                        s = unify_at(ctx.sink, ctx.env, UNIT, ret_type, s, span)
                    },
                    none => {}
                }
                StmtResult {
                    hstmt: HStmt::Return { value: none, span: span },
                    subst: s,
                    effects: EMPTY_ROW
                }
            }
        },
        Stmt::While { condition, body, span } => {
            let cond_r = infer_expr(ctx, condition, subst)
            var s = unify_at(ctx.sink, ctx.env, hexpr_type(cond_r.hexpr), BOOL, cond_r.subst, span)
            ctx.env.push_scope()
            ctx.loop_depth = ctx.loop_depth + 1
            let body_result = some(infer_block(ctx, body, some(s))) catch { _ => none }
            ctx.loop_depth = ctx.loop_depth - 1
            ctx.env.pop_scope()
            match body_result {
                some(body_r) => {
                    s = body_r.subst
                    let me = merge_effects(ctx.env, cond_r.effects, body_r.effects, s)
                    StmtResult {
                        hstmt: HStmt::While { condition: cond_r.hexpr, body: body_r.hexpr, span: span },
                        subst: me.1,
                        effects: me.0
                    }
                },
                none => fail.raise(CompileError {})
            }
        },
        Stmt::ForIn { binding, binding_span, destructure, iterable, body, span } => {
            let iter_r = infer_expr(ctx, iterable, subst)
            var s = iter_r.subst
            let iter_type = apply_subst(s, hexpr_type(iter_r.hexpr))
            let is_destructure = destructure.is_some()
            var element_type: Type = ctx.env.fresh_var()
            match iter_type {
                Type::EnumType { name, type_params, .. } => {
                    if name == BUILTIN_RANGE && type_params.len() > 0 {
                        element_type = match type_params.first() { some(t) => t, none => INT }
                    } else {
                        let _ = type_error(ctx.sink, E0301,
                            "for..in requires an iterable type (Range, List, Set, or Map), got ${type_to_string(iter_type)}",
                            span, DiagnosticContext::OtherContext { detail: some("Supported iterables: range expressions (0..10), List<T>, Set<T>, Map<K,V>") })
                    }
                },
                Type::StructType { name, type_params, .. } => {
                    if name == BUILTIN_LIST && type_params.len() > 0 {
                        element_type = match type_params.first() { some(t) => t, none => element_type }
                    } else if name == BUILTIN_SET && type_params.len() > 0 {
                        element_type = match type_params.first() { some(t) => t, none => element_type }
                    } else if name == BUILTIN_MAP && type_params.len() >= 2 {
                        if !is_destructure {
                            let _ = type_error(ctx.sink, E0301,
                                "Map is not directly iterable with for..in. Use 'for (k, v) in map { ... }' instead.",
                                span, DiagnosticContext::OtherContext { detail: some("Map requires destructuring: for (k, v) in map") })
                        }
                        match (type_params.get(0), type_params.get(1)) {
                            (some(kt), some(vt)) => {
                                element_type = Type::TupleType { elements: [kt, vt] }
                            },
                            _ => {}
                        }
                    } else {
                        let _ = type_error(ctx.sink, E0301,
                            "for..in requires an iterable type (Range, List, Set, or Map), got ${type_to_string(iter_type)}",
                            span, DiagnosticContext::OtherContext { detail: some("Supported iterables: range expressions (0..10), List<T>, Set<T>, Map<K,V>") })
                    }
                },
                _ => {
                    let _ = type_error(ctx.sink, E0301,
                        "for..in requires an iterable type (Range, List, Set, or Map), got ${type_to_string(iter_type)}",
                        span, DiagnosticContext::OtherContext { detail: some("Supported iterables: range expressions (0..10), List<T>, Set<T>, Map<K,V>") })
                }
            }

            ctx.env.push_scope()
            var hdestructure: List<HForInDestructure>? = none
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
                    var hd: List<HForInDestructure> = []
                    var di = 0
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
                                ctx.env.bind_mono(dname, elem_t)
                                let dscheme = ctx.env.lookup(dname)
                                match dscheme {
                                    some(ds) => {
                                        match (ds.def_id, destr.spans.get(di)) {
                                            (some(did), some(dspan)) => ctx.env.record_def_span(did, dspan),
                                            _ => {}
                                        }
                                        hd.push(HForInDestructure { name: dname, def_id: ds.def_id })
                                    },
                                    none => { hd.push(HForInDestructure { name: dname, def_id: none }) }
                                }
                            },
                            none => {}
                        }
                        di = di + 1
                    }
                    hdestructure = some(hd)
                },
                none => {
                    ctx.env.bind_mono(binding, element_type)
                }
            }
            let binding_scheme = ctx.env.lookup(binding)
            match binding_scheme {
                some(bs) => match bs.def_id {
                    some(did) => ctx.env.record_def_span(did, binding_span),
                    none => {}
                },
                none => {}
            }
            ctx.loop_depth = ctx.loop_depth + 1
            let body_result = some(infer_block(ctx, body, some(s))) catch { _ => none }
            ctx.loop_depth = ctx.loop_depth - 1
            ctx.env.pop_scope()
            match body_result {
                some(body_r) => {
                    s = body_r.subst
                    let me = merge_effects(ctx.env, iter_r.effects, body_r.effects, s)
                    StmtResult {
                        hstmt: HStmt::ForIn {
                            binding: binding, binding_span: binding_span,
                            def_id: match binding_scheme { some(bs) => bs.def_id, none => none },
                            destructure: hdestructure,
                            iterable: iter_r.hexpr, body: body_r.hexpr, span: span
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
            StmtResult { hstmt: HStmt::Break { span: span }, subst: subst, effects: EMPTY_ROW }
        },
        Stmt::Continue { span } => {
            if ctx.loop_depth == 0 {
                let _ = type_error(ctx.sink, E0206, "'continue' can only be used inside a loop", span,
                    DiagnosticContext::OtherContext { detail: some("continue outside loop") })
            }
            StmtResult { hstmt: HStmt::Continue { span: span }, subst: subst, effects: EMPTY_ROW }
        },
        Stmt::LetDestructure { pattern, init, span } => {
            let init_r = infer_expr(ctx, init, subst)
            var s = init_r.subst
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
                    var bindings: List<HLetDestructureBinding> = []
                    var bi = 0
                    while bi < pat_elements.len() {
                        match pat_elements.get(bi) {
                            some(p) => {
                                let elem_type = match tuple_elements.get(bi) { some(et) => et, none => UNIT }
                                match p {
                                    Pattern::Binding { name, span: pspan } => {
                                        ctx.env.bind_mono(name, elem_type)
                                        let bscheme = ctx.env.lookup(name)
                                        match bscheme {
                                            some(bs) => {
                                                match bs.def_id {
                                                    some(did) => ctx.env.record_def_span(did, pspan),
                                                    none => {}
                                                }
                                                bindings.push(HLetDestructureBinding { name: name, def_id: bs.def_id, ty: elem_type })
                                            },
                                            none => {
                                                bindings.push(HLetDestructureBinding { name: name, def_id: none, ty: elem_type })
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
                    StmtResult {
                        hstmt: HStmt::LetDestructure { pattern: pattern, bindings: bindings, init: init_r.hexpr, span: span },
                        subst: s,
                        effects: init_r.effects
                    }
                },
                _ => {
                    let _ = type_error(ctx.sink, E0301,
                        "let destructuring requires tuple pattern",
                        span, DiagnosticContext::OtherContext { detail: some("not a tuple pattern") })
                    StmtResult {
                        hstmt: HStmt::ExprStmt { expr: HExpr::IntLit { value: 0, ty: UNIT, effects: EMPTY_ROW, span: span }, span: span },
                        subst: s,
                        effects: init_r.effects
                    }
                }
            }
        },
        Stmt::IfLet { pattern, expr, then_block, else_block, span } => {
            let expr_r = infer_expr(ctx, expr, subst)
            var s = expr_r.subst
            let expr_type = apply_subst(s, hexpr_type(expr_r.hexpr))

            ctx.env.push_scope()
            let then_result = some({
                bind_pattern(ctx, pattern, expr_type, s)
                infer_block(ctx, then_block, some(s))
            }) catch { _ => none }
            ctx.env.pop_scope()

            match then_result {
                some(then_r) => {
                    s = then_r.subst
                    var combined = merge_effects(ctx.env, expr_r.effects, then_r.effects, s)
                    var combined_effects = combined.0
                    s = combined.1

                    var else_hblock: HExpr? = none
                    match else_block {
                        some(eb) => {
                            ctx.env.push_scope()
                            let else_result = some(infer_block(ctx, eb, some(s))) catch { _ => none }
                            ctx.env.pop_scope()
                            match else_result {
                                some(else_r) => {
                                    s = else_r.subst
                                    else_hblock = some(else_r.hexpr)
                                    let me2 = merge_effects(ctx.env, combined_effects, else_r.effects, s)
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
                            pattern: pattern, expr: expr_r.hexpr,
                            then_block: then_r.hexpr, else_block: else_hblock, span: span
                        },
                        subst: s,
                        effects: combined_effects
                    }
                },
                none => fail.raise(CompileError {})
            }
        }
    }
}

fn check_assign_target_mutable(ctx: InferCtx, target: Expr) {
    match target {
        Expr::Ident { name, span, .. } => {
            let scheme = ctx.env.lookup(name)
            match scheme {
                some(s) => match s.def_id {
                    some(did) => {
                        if !ctx.env.scope.mutable_vars.contains(did) {
                            let _ = type_error(ctx.sink, E0205,
                                "Cannot assign to immutable variable '${name}' (declared with 'let'). Use 'var' for mutable bindings.",
                                span, DiagnosticContext::OtherContext { detail: some("'${name}' is declared with 'let'") })
                        }
                    },
                    none => {}
                },
                none => {}
            }
        },
        Expr::FieldAccess { receiver, span, .. } => {
            let root = find_root_expr(receiver)
            match root {
                Expr::Ident { name, span: rspan, .. } => {
                    let scheme = ctx.env.lookup(name)
                    match scheme {
                        some(s) => match s.def_id {
                            some(did) => {
                                if !ctx.env.scope.mutable_vars.contains(did) {
                                    let _ = type_error(ctx.sink, E0205,
                                        "Cannot assign to field of immutable variable '${name}'. Use 'var' for mutable bindings.",
                                        span, DiagnosticContext::OtherContext { detail: some("'${name}' is not mutable") })
                                }
                            },
                            none => {}
                        },
                        none => {}
                    }
                },
                _ => {}
            }
        },
        _ => {}
    }
}

fn find_root_expr(e: Expr) -> Expr {
    match e {
        Expr::FieldAccess { receiver, .. } => find_root_expr(receiver),
        _ => e
    }
}

// ============================================================
// Expression inference dispatch (from infer.ts)
// ============================================================

pub fn infer_expr(var ctx: InferCtx, expr: Expr, subst: UnionFind) -> InferResult {
    match expr {
        Expr::IntLit { value, span } =>
            InferResult {
                hexpr: HExpr::IntLit { value: value, ty: INT, effects: EMPTY_ROW, span: span },
                subst: subst, effects: EMPTY_ROW
            },
        Expr::FloatLit { value, span } =>
            InferResult {
                hexpr: HExpr::FloatLit { value: value, ty: FLOAT, effects: EMPTY_ROW, span: span },
                subst: subst, effects: EMPTY_ROW
            },
        Expr::StrLit { value, span } =>
            InferResult {
                hexpr: HExpr::StrLit { value: value, ty: STR, effects: EMPTY_ROW, span: span },
                subst: subst, effects: EMPTY_ROW
            },
        Expr::BoolLit { value, span } =>
            InferResult {
                hexpr: HExpr::BoolLit { value: value, ty: BOOL, effects: EMPTY_ROW, span: span },
                subst: subst, effects: EMPTY_ROW
            },
        Expr::Ident { name, qualifier, span } =>
            infer_ident(ctx, name, span, subst, qualifier),
        Expr::BinOp { op, left, right, span } =>
            infer_bin_op(ctx, op, left, right, span, subst),
        Expr::UnaryOp { op, operand, span } =>
            infer_unary_op(ctx, op, operand, span, subst),
        Expr::Call { callee, args, span, .. } =>
            infer_call(ctx, callee, args, span, subst),
        Expr::MethodCall { receiver, method, args, span, .. } =>
            infer_method_call(ctx, receiver, method, args, span, subst),
        Expr::FieldAccess { receiver, field, span } =>
            infer_field_access(ctx, receiver, field, span, subst),
        Expr::StructLit { name, qualifier, fields, spread, span, .. } =>
            infer_struct_lit(ctx, name, fields, spread, span, subst, qualifier),
        Expr::MatchExpr { scrutinee, arms, span } =>
            infer_match(ctx, scrutinee, arms, span, subst),
        Expr::Block { .. } =>
            infer_block(ctx, expr, some(subst)),
        Expr::IfExpr { condition, then_branch, else_branch, span } =>
            infer_if(ctx, condition, then_branch, else_branch, span, subst),
        Expr::StringInterp { parts, span } =>
            infer_string_interp(ctx, parts, span, subst),
        Expr::CatchExpr { expr: catch_expr, arms, span } =>
            infer_catch(ctx, catch_expr, arms, span, subst),
        Expr::HandleExpr { body, handlers, span } =>
            infer_handle(ctx, body, handlers, span, subst),
        Expr::Lambda { params, body, span, .. } =>
            infer_lambda(ctx, params, body, span, subst, none),
        Expr::ListLit { elements, span } =>
            infer_list_literal(ctx, elements, span, subst),
        Expr::TupleLit { elements, span } => {
            var s = subst
            var helements: List<HExpr> = []
            var combined_effects: EffectRow = EMPTY_ROW
            for el in elements {
                let r = infer_expr(ctx, el, s)
                s = r.subst
                helements.push(r.hexpr)
                let me = merge_effects(ctx.env, combined_effects, r.effects, s)
                combined_effects = me.0
                s = me.1
            }
            var elem_types: List<Type> = []
            for he in helements { elem_types.push(apply_subst(s, hexpr_type(he))) }
            let tuple_type = Type::TupleType { elements: elem_types }
            InferResult {
                hexpr: HExpr::TupleLit { elements: helements, ty: tuple_type, effects: combined_effects, span: span },
                subst: s, effects: combined_effects
            }
        },
        Expr::Range { start, end, inclusive, span } => {
            let start_r = infer_expr(ctx, start, subst)
            var s = unify_at(ctx.sink, ctx.env, hexpr_type(start_r.hexpr), INT, start_r.subst, span)
            let end_r = infer_expr(ctx, end, s)
            s = unify_at(ctx.sink, ctx.env, hexpr_type(end_r.hexpr), INT, end_r.subst, span)
            let me = merge_effects(ctx.env, start_r.effects, end_r.effects, s)
            var range_effects = me.0
            s = me.1
            let range_type = Type::EnumType { name: BUILTIN_RANGE, type_params: [INT], variants: [] }
            InferResult {
                hexpr: HExpr::RangeExpr {
                    start: start_r.hexpr, end: end_r.hexpr, inclusive: inclusive,
                    ty: range_type, effects: range_effects, span: span
                },
                subst: s, effects: range_effects
            }
        }
    }
}

// ============================================================
// infer_ident (from infer-expr.ts)
// ============================================================

fn infer_ident(var ctx: InferCtx, name: Str, span: Span, subst: UnionFind, qualifier: Str?) -> InferResult {
    // Try module-qualified lookup first: qualifier::name
    match qualifier {
        some(q) => {
            let qualified_name = "${q}::${name}"
            let mod_scheme = ctx.env.lookup(qualified_name)
            match mod_scheme {
                some(ms) => {
                    let t = ctx.env.instantiate(ms)
                    return InferResult {
                        hexpr: HExpr::Ident { name: qualified_name, resolved_name: none, def_id: ms.def_id, dict_closure_dicts: none, ty: t, effects: EMPTY_ROW, span: span },
                        subst: subst, effects: EMPTY_ROW
                    }
                },
                none => {}
            }
        },
        none => {}
    }

    let scheme = ctx.env.lookup(name)
    match scheme {
        none => {
            match qualifier {
                some(q) => {
                    let _ = type_error(ctx.sink, E0201, "'${q}' has no member '${name}'", span,
                        DiagnosticContext::UndefinedVariable { name: name, scope_locals: none })
                    return InferResult {
                        hexpr: HExpr::Ident { name: name, resolved_name: none, def_id: none, dict_closure_dicts: none, ty: Type::ErrorType, effects: EMPTY_ROW, span: span },
                        subst: subst, effects: EMPTY_ROW
                    }
                },
                none => {}
            }
            let _ = type_error(ctx.sink, E0201, "Undefined variable: ${name}", span,
                DiagnosticContext::UndefinedVariable { name: name, scope_locals: none })
            InferResult {
                hexpr: HExpr::Ident { name: name, resolved_name: none, def_id: none, dict_closure_dicts: none, ty: Type::ErrorType, effects: EMPTY_ROW, span: span },
                subst: subst, effects: EMPTY_ROW
            }
        },
        some(s) => {
            let t = ctx.env.instantiate(s)
            var resolved_name: Str? = none
            var enum_name: Str? = none
            match qualifier {
                some(q) => {
                    match ctx.env.types.enums.get(q) {
                        some(enum_def) => {
                            if enum_def.variants.any(fn(v) { v.name == name }) {
                                enum_name = some(q)
                            } else {
                                let _ = type_error(ctx.sink, E0201, "'${q}' has no variant '${name}'", span,
                                    DiagnosticContext::UndefinedVariable { name: name, scope_locals: none })
                            }
                        },
                        none => { let _ = type_error(ctx.sink, E0201, "'${q}' has no variant '${name}'", span,
                            DiagnosticContext::UndefinedVariable { name: name, scope_locals: none }) }
                    }
                },
                none => { enum_name = ctx.env.types.variant_to_enum.get(name) }
            }
            match enum_name {
                some(en) => { resolved_name = some(variant_js_name(en, name)) },
                none => {}
            }
            InferResult {
                hexpr: HExpr::Ident { name: name, resolved_name: resolved_name, def_id: s.def_id, dict_closure_dicts: none, ty: t, effects: EMPTY_ROW, span: span },
                subst: subst, effects: EMPTY_ROW
            }
        }
    }
}

// ============================================================
// infer_bin_op (from infer-expr.ts)
// ============================================================

fn infer_bin_op(var ctx: InferCtx, op: BinOp, left: Expr, right: Expr, span: Span, subst: UnionFind) -> InferResult {
    let lr = infer_expr(ctx, left, subst)
    let rr = infer_expr(ctx, right, lr.subst)
    var s = rr.subst
    var result_type: Type = UNIT
    var eq_dispatch: TraitDispatch? = none
    var ord_dispatch: TraitDispatch? = none

    match op {
        BinOp::Add => { result_type = infer_numeric_op(ctx, lr.hexpr, rr.hexpr, s, span, "+"); s = unify_at(ctx.sink, ctx.env, hexpr_type(lr.hexpr), hexpr_type(rr.hexpr), s, span) },
        BinOp::Sub => { result_type = infer_numeric_op(ctx, lr.hexpr, rr.hexpr, s, span, "-"); s = unify_at(ctx.sink, ctx.env, hexpr_type(lr.hexpr), hexpr_type(rr.hexpr), s, span) },
        BinOp::Mul => { result_type = infer_numeric_op(ctx, lr.hexpr, rr.hexpr, s, span, "*"); s = unify_at(ctx.sink, ctx.env, hexpr_type(lr.hexpr), hexpr_type(rr.hexpr), s, span) },
        BinOp::Div => { result_type = infer_numeric_op(ctx, lr.hexpr, rr.hexpr, s, span, "/"); s = unify_at(ctx.sink, ctx.env, hexpr_type(lr.hexpr), hexpr_type(rr.hexpr), s, span) },
        BinOp::Mod => { result_type = infer_numeric_op(ctx, lr.hexpr, rr.hexpr, s, span, "%"); s = unify_at(ctx.sink, ctx.env, hexpr_type(lr.hexpr), hexpr_type(rr.hexpr), s, span) },
        BinOp::Eq => {
            s = unify_at(ctx.sink, ctx.env, hexpr_type(lr.hexpr), hexpr_type(rr.hexpr), s, span)
            result_type = BOOL
            let resolved = apply_subst(s, hexpr_type(lr.hexpr))
            let is_builtin = is_primitive_eq(resolved) || is_tuple_type(resolved)
            eq_dispatch = some(resolve_trait_dispatch(ctx, resolved, "Eq", E0307, s, span, "==", is_builtin))
        },
        BinOp::Neq => {
            s = unify_at(ctx.sink, ctx.env, hexpr_type(lr.hexpr), hexpr_type(rr.hexpr), s, span)
            result_type = BOOL
            let resolved = apply_subst(s, hexpr_type(lr.hexpr))
            let is_builtin = is_primitive_eq(resolved) || is_tuple_type(resolved)
            eq_dispatch = some(resolve_trait_dispatch(ctx, resolved, "Eq", E0307, s, span, "!=", is_builtin))
        },
        BinOp::Lt => {
            s = unify_at(ctx.sink, ctx.env, hexpr_type(lr.hexpr), hexpr_type(rr.hexpr), s, span)
            result_type = BOOL
            let resolved = apply_subst(s, hexpr_type(lr.hexpr))
            ord_dispatch = some(resolve_trait_dispatch(ctx, resolved, "Ord", E0308, s, span, "<", is_primitive_ord(resolved)))
        },
        BinOp::Lte => {
            s = unify_at(ctx.sink, ctx.env, hexpr_type(lr.hexpr), hexpr_type(rr.hexpr), s, span)
            result_type = BOOL
            let resolved = apply_subst(s, hexpr_type(lr.hexpr))
            ord_dispatch = some(resolve_trait_dispatch(ctx, resolved, "Ord", E0308, s, span, "<=", is_primitive_ord(resolved)))
        },
        BinOp::Gt => {
            s = unify_at(ctx.sink, ctx.env, hexpr_type(lr.hexpr), hexpr_type(rr.hexpr), s, span)
            result_type = BOOL
            let resolved = apply_subst(s, hexpr_type(lr.hexpr))
            ord_dispatch = some(resolve_trait_dispatch(ctx, resolved, "Ord", E0308, s, span, ">", is_primitive_ord(resolved)))
        },
        BinOp::Gte => {
            s = unify_at(ctx.sink, ctx.env, hexpr_type(lr.hexpr), hexpr_type(rr.hexpr), s, span)
            result_type = BOOL
            let resolved = apply_subst(s, hexpr_type(lr.hexpr))
            ord_dispatch = some(resolve_trait_dispatch(ctx, resolved, "Ord", E0308, s, span, ">=", is_primitive_ord(resolved)))
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

    let me = merge_effects(ctx.env, lr.effects, rr.effects, s)
    var effects = me.0
    s = me.1
    InferResult {
        hexpr: HExpr::BinOp { op: op, left: lr.hexpr, right: rr.hexpr, eq_dispatch: eq_dispatch, ord_dispatch: ord_dispatch, ty: result_type, effects: effects, span: span },
        subst: s, effects: effects
    }
}

fn infer_numeric_op(ctx: InferCtx, left: HExpr, right: HExpr, s: UnionFind, span: Span, op_str: Str) -> Type {
    let resolved = apply_subst(s, hexpr_type(left))
    match resolved {
        Type::TypeVar { .. } => {
            let _ = unify_at(ctx.sink, ctx.env, resolved, INT, s, span)
            INT
        },
        Type::IntType => INT,
        Type::FloatType => FLOAT,
        _ => type_error(ctx.sink, E0303,
            "Operator ${op_str} requires numeric types, got ${type_to_string(resolved)}",
            span, DiagnosticContext::TypeMismatch { expected: "Int or Float", actual: type_to_string(resolved), expression: none })
    }
}

fn is_primitive_eq(t: Type) -> Bool {
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

fn is_primitive_ord(t: Type) -> Bool {
    match t {
        Type::IntType => true,
        Type::FloatType => true,
        Type::StrType => true,
        Type::BoolType => true,
        _ => false
    }
}

fn is_tuple_type(t: Type) -> Bool {
    match t { Type::TupleType { .. } => true, _ => false }
}

fn resolve_trait_dispatch(ctx: InferCtx, resolved: Type, trait_name: Str, error_code: Str, subst: UnionFind, span: Span, op: Str, is_builtin: Bool) -> TraitDispatch {
    if is_builtin { return TraitDispatch::Builtin }

    match resolved {
        Type::TypeVar { id, .. } => {
            let bound = ctx.current_fn_bounds.find(fn(fb) {
                fb.type_param_var_id == id && fb.trait_name == trait_name
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
                "Type does not implement ${trait_name}, cannot use '${op}'",
                span, DiagnosticContext::TraitError { detail: "type does not implement ${trait_name}" })
            TraitDispatch::Builtin
        },
        Type::StructType { name, type_params, .. } => {
            if ctx.env.trait_reg.trait_impls.any(fn(i) { i.target_type_name == name && i.trait_name == trait_name }) {
                let extra_dicts = resolve_trait_extra_dicts(ctx, type_params, subst, trait_name)
                return TraitDispatch::Direct { dict: trait_dict_name(name, trait_name), extra_dicts: match extra_dicts { some(d) => d, none => [] } }
            }
            let _ = type_error(ctx.sink, error_code,
                "Type '${type_to_string(resolved)}' does not implement ${trait_name}, cannot use '${op}'",
                span, DiagnosticContext::TraitError { detail: "type '${type_to_string(resolved)}' does not implement ${trait_name}" })
            TraitDispatch::Builtin
        },
        Type::EnumType { name, type_params, .. } => {
            if ctx.env.trait_reg.trait_impls.any(fn(i) { i.target_type_name == name && i.trait_name == trait_name }) {
                let extra_dicts = resolve_trait_extra_dicts(ctx, type_params, subst, trait_name)
                return TraitDispatch::Direct { dict: trait_dict_name(name, trait_name), extra_dicts: match extra_dicts { some(d) => d, none => [] } }
            }
            let _ = type_error(ctx.sink, error_code,
                "Type '${type_to_string(resolved)}' does not implement ${trait_name}, cannot use '${op}'",
                span, DiagnosticContext::TraitError { detail: "type '${type_to_string(resolved)}' does not implement ${trait_name}" })
            TraitDispatch::Builtin
        },
        _ => {
            let _ = type_error(ctx.sink, error_code,
                "Type '${type_to_string(resolved)}' does not implement ${trait_name}, cannot use '${op}'",
                span, DiagnosticContext::TraitError { detail: "type '${type_to_string(resolved)}' does not implement ${trait_name}" })
            TraitDispatch::Builtin
        }
    }
}

fn resolve_trait_extra_dicts(ctx: InferCtx, type_args: List<Type>, subst: UnionFind, trait_name: Str) -> List<Str>? {
    if type_args.len() == 0 { return none }
    var dicts: List<Str> = []
    for arg in type_args {
        let resolved = apply_subst(subst, arg)
        let dict = resolve_type_to_trait_dict(ctx, resolved, trait_name)
        match dict {
            some(d) => dicts.push(d),
            none => { return none }
        }
    }
    some(dicts)
}

fn resolve_type_to_trait_dict(ctx: InferCtx, t: Type, trait_name: Str) -> Str? {
    match type_to_builtin_name(t) {
        some(builtin_name) => match t {
            Type::StructType { .. } => {},
            Type::EnumType { .. } => {},
            _ => { return some(trait_dict_name(builtin_name, trait_name)) }
        },
        none => {}
    }
    match t {
        Type::TypeVar { id, .. } => {
            let bound = ctx.current_fn_bounds.find(fn(fb) {
                fb.type_param_var_id == id && fb.trait_name == trait_name
            })
            match bound {
                some(b) => some(trait_bound_param_name(b.type_param_name, trait_name)),
                none => none
            }
        },
        Type::StructType { name, .. } => {
            if ctx.env.trait_reg.trait_impls.any(fn(i) { i.target_type_name == name && i.trait_name == trait_name }) {
                some(trait_dict_name(name, trait_name))
            } else { none }
        },
        Type::EnumType { name, .. } => {
            if ctx.env.trait_reg.trait_impls.any(fn(i) { i.target_type_name == name && i.trait_name == trait_name }) {
                some(trait_dict_name(name, trait_name))
            } else { none }
        },
        _ => none
    }
}

// ============================================================
// infer_unary_op
// ============================================================

fn infer_unary_op(var ctx: InferCtx, op: UnaryOp, operand: Expr, span: Span, subst: UnionFind) -> InferResult {
    let r = infer_expr(ctx, operand, subst)
    var s = r.subst
    var result_type: Type = UNIT
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

fn infer_call(var ctx: InferCtx, callee: Expr, args: List<Expr>, span: Span, subst: UnionFind) -> InferResult {
    let callee_r = infer_expr(ctx, callee, subst)
    var s = callee_r.subst
    var effects = callee_r.effects

    // Resolve callee type for lambda bidirectional inference
    let callee_fn_type: Type? = match apply_subst(s, hexpr_type(callee_r.hexpr)) {
        Type::FnType { .. } => some(apply_subst(s, hexpr_type(callee_r.hexpr))),
        _ => none
    }

    var hargs: List<HExpr> = []
    var arg_types: List<Type> = []
    var ai = 0
    for arg in args {
        var ar: InferResult = match arg {
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
                                                infer_lambda(ctx, lparams, lbody, lspan, s, some(exp_params))
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
        let me = merge_effects(ctx.env, effects, ar.effects, s)
        effects = me.0
        s = me.1
        hargs.push(ar.hexpr)
        arg_types.push(hexpr_type(ar.hexpr))
        ai = ai + 1
    }

    let ret_var = ctx.env.fresh_var()
    let effect_tail = ctx.env.fresh_var_id()
    let expected_fn = Type::FnType {
        params: arg_types,
        return_type: ret_var,
        effects: EffectRow { effects: [], tail: some(effect_tail) }
    }

    s = unify_at(ctx.sink, ctx.env, hexpr_type(callee_r.hexpr), expected_fn, s, span)
    let resolved_callee_type = apply_subst(s, hexpr_type(callee_r.hexpr))

    match resolved_callee_type {
        Type::FnType { effects: fn_effects, .. } => {
            let me = merge_effects(ctx.env, effects, fn_effects, s)
            effects = me.0
            s = me.1
        },
        _ => {}
    }

    let result_type = apply_subst(s, ret_var)

    var resolved_dicts: List<Str> = []
    match callee {
        Expr::Ident { name: callee_name, .. } => {
            match ctx.env.lookup(callee_name) {
                some(callee_scheme) => {
                    if callee_scheme.bounds.len() > 0 {
                        resolved_dicts = resolve_dicts_from_scheme(ctx.sink, ctx.env, ctx.current_fn_bounds, callee_scheme, hexpr_type(callee_r.hexpr), s, span)
                    }
                },
                none => {}
            }
        },
        _ => {}
    }

    // Post-process: resolve dict_closure_dicts for ident args
    var final_hargs: List<HExpr> = []
    for harg in hargs {
        final_hargs.push(resolve_arg_dict_closure(ctx, harg, s))
    }

    InferResult {
        hexpr: HExpr::Call {
            callee: callee_r.hexpr, args: final_hargs, type_args: [],
            resolved_dicts: resolved_dicts, dict_dispatch: none,
            ty: result_type, effects: effects, span: span
        },
        subst: s, effects: effects
    }
}

fn resolve_arg_dict_closure(ctx: InferCtx, harg: HExpr, s: UnionFind) -> HExpr {
    match harg {
        HExpr::Ident { name, resolved_name, def_id, ty, effects, span, .. } => {
            let arg_scheme = ctx.env.lookup(name)
            match arg_scheme {
                some(as_) => {
                    if as_.bounds.len() == 0 { return harg }
                    let var_map = build_scheme_var_map(as_, ty)
                    var dicts: List<Str> = []
                    for bound in as_.bounds {
                        match var_map.get(bound.type_var) {
                            some(fresh_var) => {
                                let concrete = apply_subst(s, fresh_var)
                                resolve_arg_bound_dict(ctx, concrete, bound.trait_name, dicts)
                            },
                            none => {}
                        }
                    }
                    if dicts.len() > 0 {
                        HExpr::Ident { name: name, resolved_name: resolved_name, def_id: def_id,
                            dict_closure_dicts: some(dicts), ty: ty, effects: effects, span: span }
                    } else { harg }
                },
                none => harg
            }
        },
        _ => harg
    }
}

fn resolve_arg_bound_dict(ctx: InferCtx, concrete: Type, trait_name: Str, var dicts: List<Str>) {
    match concrete {
        Type::StructType { name, .. } => {
            if ctx.env.trait_reg.trait_impls.any(fn(impl_) { impl_.target_type_name == name && impl_.trait_name == trait_name }) {
                dicts.push(trait_dict_name(name, trait_name))
            }
        },
        Type::EnumType { name, .. } => {
            if ctx.env.trait_reg.trait_impls.any(fn(impl_) { impl_.target_type_name == name && impl_.trait_name == trait_name }) {
                dicts.push(trait_dict_name(name, trait_name))
            }
        },
        Type::TypeVar { id, .. } => {
            let matching = ctx.current_fn_bounds.find(fn(fb) {
                fb.type_param_var_id == id && fb.trait_name == trait_name
            })
            match matching {
                some(fb) => dicts.push(trait_bound_param_name(fb.type_param_name, fb.trait_name)),
                none => {}
            }
        },
        _ => {
            match type_to_builtin_name(concrete) {
                some(prim_name) => {
                    if ctx.env.trait_reg.trait_impls.any(fn(impl_) { impl_.target_type_name == prim_name && impl_.trait_name == trait_name }) {
                        dicts.push(trait_dict_name(prim_name, trait_name))
                    }
                },
                none => {}
            }
        }
    }
}

// ============================================================
// infer_method_call
// ============================================================

fn infer_method_call(var ctx: InferCtx, receiver: Expr, method: Str, args: List<Expr>, span: Span, subst: UnionFind) -> InferResult {
    // Check if receiver is an effect module
    match receiver {
        Expr::Ident { name: recv_name, .. } => {
            match ctx.env.types.effects.get(recv_name) {
                some(_) => { return infer_effect_op(ctx, recv_name, method, args, span, subst) },
                none => {}
            }
        },
        _ => {}
    }

    let recv_r = infer_expr(ctx, receiver, subst)
    var s = recv_r.subst
    var effects = recv_r.effects
    let recv_type = apply_subst(s, hexpr_type(recv_r.hexpr))

    var method_type: Type? = none
    var method_scheme: TypeScheme? = none

    // Look up method in impl for struct/enum
    match recv_type {
        Type::StructType { name, .. } => {
            let r = lookup_impl_method(ctx, name, method)
            method_type = r.method_type
            method_scheme = r.method_scheme
        },
        Type::EnumType { name, .. } => {
            let r = lookup_impl_method(ctx, name, method)
            method_type = r.method_type
            method_scheme = r.method_scheme
        },
        _ => {}
    }

    // Method lookup for primitive types
    if method_type.is_none() {
        match type_to_builtin_name(recv_type) {
            some(prim_name) => {
                let r = lookup_impl_method(ctx, prim_name, method)
                method_type = r.method_type
                method_scheme = r.method_scheme
            },
            none => {}
        }
    }

    // Check trait impls
    if method_type.is_none() {
        match type_to_builtin_name(recv_type) {
            some(type_name) => {
                method_type = lookup_trait_method(ctx, type_name, method, span)
            },
            none => {}
        }
    }

    // Check fn bounds for type variable receivers
    var dict_dispatch: DictDispatchInfo? = none
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
                                        method_type = some(ctx.env.instantiate(TypeScheme { ty: found_method.ty, type_vars: trait_def.type_param_vars, bounds: [], def_id: none }))
                                        dict_dispatch = some(DictDispatchInfo { dict_param: trait_bound_param_name(fb.type_param_name, fb.trait_name), method: method })
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

    // Early receiver-method unification for bidirectional type checking
    match method_type {
        some(mt) => match mt {
            Type::FnType { params: mt_params, .. } => {
                if mt_params.len() > 0 {
                    match mt_params.first() {
                        some(first_param) => { s = unify_at(ctx.sink, ctx.env, hexpr_type(recv_r.hexpr), first_param, s, span) },
                        none => {}
                    }
                }
            },
            _ => {}
        },
        none => {}
    }

    // Infer arguments with lambda type propagation
    var hargs: List<HExpr> = []
    var ai = 0
    for arg in args {
        var ar: InferResult = match arg {
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
                                                infer_lambda(ctx, lparams, lbody, lspan, s, some(exp_params))
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
        let me = merge_effects(ctx.env, effects, ar.effects, s)
        effects = me.0
        s = me.1
        hargs.push(ar.hexpr)
        ai = ai + 1
    }

    var result_type: Type = ctx.env.fresh_var()
    match method_type {
        some(mt) => match mt {
            Type::FnType { params: mt_params, return_type: mt_ret, effects: mt_effects, .. } => {
                var i = 0
                for harg in hargs {
                    if i + 1 < mt_params.len() {
                        match mt_params.get(i + 1) {
                            some(expected_param) => { s = unify_at(ctx.sink, ctx.env, hexpr_type(harg), expected_param, s, span) },
                            none => {}
                        }
                    }
                    i = i + 1
                }
                result_type = apply_subst(s, mt_ret)
                let me = merge_effects(ctx.env, effects, mt_effects, s)
                effects = me.0
                s = me.1
            },
            _ => {
                match recv_type {
                    Type::TypeVar { .. } => {},
                    _ => { let _ = type_error(ctx.sink, E0305,
                        "Type '${type_to_string(recv_type)}' has no method '${method}'",
                        span, DiagnosticContext::OtherContext { detail: some("no method '${method}' on type '${type_to_string(recv_type)}'") }) }
                }
            }
        },
        none => {
            match recv_type {
                Type::TypeVar { .. } => {},
                _ => { let _ = type_error(ctx.sink, E0305,
                    "Type '${type_to_string(recv_type)}' has no method '${method}'",
                    span, DiagnosticContext::OtherContext { detail: some("no method '${method}' on type '${type_to_string(recv_type)}'") }) }
            }
        }
    }

    var resolved_dicts: List<Str> = []
    match method_scheme {
        some(ms) => {
            if ms.bounds.len() > 0 {
                match method_type {
                    some(mt) => {
                        resolved_dicts = resolve_dicts_from_scheme(ctx.sink, ctx.env, ctx.current_fn_bounds, ms, mt, s, span)
                    },
                    none => {}
                }
            }
        },
        none => {}
    }

    let callee_type = match method_type { some(mt) => mt, none => ctx.env.fresh_var() }
    InferResult {
        hexpr: HExpr::Call {
            callee: HExpr::FieldAccess { receiver: recv_r.hexpr, field: method, ty: callee_type, effects: EMPTY_ROW, span: span },
            args: hargs, type_args: [], resolved_dicts: resolved_dicts,
            dict_dispatch: dict_dispatch, ty: result_type, effects: effects, span: span
        },
        subst: s, effects: effects
    }
}

fn lookup_impl_method(var ctx: InferCtx, type_name: Str, method: Str) -> MethodLookupResult {
    match ctx.env.trait_reg.impl_methods.get(type_name) {
        some(impl_methods) => match impl_methods.get(method) {
            some(scheme) => MethodLookupResult {
                method_type: some(ctx.env.instantiate(scheme)),
                method_scheme: some(scheme)
            },
            none => MethodLookupResult { method_type: none, method_scheme: none }
        },
        none => MethodLookupResult { method_type: none, method_scheme: none }
    }
}

fn lookup_trait_method(var ctx: InferCtx, type_name: Str, method: Str, span: Span) -> Type? {
    var found_type: Type? = none
    var found_trait_name: Str? = none
    for impl_entry in ctx.env.trait_reg.trait_impls {
        if impl_entry.target_type_name == type_name {
            match ctx.env.trait_reg.traits.get(impl_entry.trait_name) {
                some(trait_def) => {
                    let tm = trait_def.methods.find(fn(m) { m.name == method })
                    match tm {
                        some(found_method) => {
                            match found_trait_name {
                                some(prev_trait) => {
                                    let _ = type_error(ctx.sink, E0504,
                                        "Ambiguous method '${method}' on '${type_name}': found in trait '${prev_trait}' and '${impl_entry.trait_name}'",
                                        span, DiagnosticContext::OtherContext { detail: some("disambiguate by calling TraitName::${method}") })
                                    return found_type
                                },
                                none => {
                                    found_type = some(ctx.env.instantiate(TypeScheme { ty: found_method.ty, type_vars: trait_def.type_param_vars, bounds: [], def_id: none }))
                                    found_trait_name = some(impl_entry.trait_name)
                                }
                            }
                        },
                        none => {}
                    }
                },
                none => {}
            }
        }
    }
    found_type
}

// ============================================================
// infer_effect_op
// ============================================================

fn infer_effect_op(var ctx: InferCtx, effect_name: Str, op_name: Str, args: List<Expr>, span: Span, subst: UnionFind) -> InferResult {
    let effect_def_opt = ctx.env.types.effects.get(effect_name)
    match effect_def_opt {
        none => {
            let _ = type_error(ctx.sink, E0402,
                "Unknown effect: ${effect_name}",
                span, DiagnosticContext::OtherContext { detail: some("effect '${effect_name}' not found") })
            return InferResult {
                hexpr: HExpr::EffectOp { effect_name: effect_name, op_name: op_name, args: [], ty: Type::ErrorType, effects: EMPTY_ROW, span: span },
                subst: subst, effects: EMPTY_ROW
            }
        },
        _ => {}
    }
    let effect_def = match effect_def_opt { some(ed) => ed, none => panic("unreachable") }
    let op_opt = effect_def.ops.find(fn(o) { o.name == op_name })
    match op_opt {
        none => {
            let _ = type_error(ctx.sink, E0402,
                "Effect ${effect_name} has no operation ${op_name}",
                span, DiagnosticContext::OtherContext { detail: some("no operation '${op_name}' on effect '${effect_name}'") })
            return InferResult {
                hexpr: HExpr::EffectOp { effect_name: effect_name, op_name: op_name, args: [], ty: Type::ErrorType, effects: EMPTY_ROW, span: span },
                subst: subst, effects: EMPTY_ROW
            }
        },
        _ => {}
    }
    let op = match op_opt { some(o) => o, none => panic("unreachable") }

    if args.len() != op.params.len() {
        let _ = type_error(ctx.sink, E0301,
            "Effect operation '${effect_name}.${op_name}' expects ${op.params.len().to_str()} argument(s), got ${args.len().to_str()}",
            span, DiagnosticContext::TypeMismatch { expected: "${op.params.len().to_str()} args", actual: "${args.len().to_str()} args", expression: none })
    }

    var s = subst
    var effects: EffectRow = EMPTY_ROW
    var hargs: List<HExpr> = []

    var i = 0
    for arg in args {
        let ar = infer_expr(ctx, arg, s)
        s = ar.subst
        let me = merge_effects(ctx.env, effects, ar.effects, s)
        effects = me.0
        s = me.1
        hargs.push(ar.hexpr)
        match op.params.get(i) {
            some(param_type) => { s = unify_at(ctx.sink, ctx.env, hexpr_type(ar.hexpr), param_type, s, span) },
            none => {}
        }
        i = i + 1
    }

    var eff: Effect = Effect::CustomEffect { name: effect_name, type_args: [] }
    match effect_def.built_in_kind {
        some(bik) => match bik {
            BuiltInKind::BkIo => { eff = Effect::IoEffect },
            BuiltInKind::BkFail => {
                let error_type = if hargs.len() > 0 { apply_subst(s, hexpr_type(match hargs.first() { some(h) => h, none => panic("unreachable") })) } else { UNIT }
                eff = Effect::FailEffect { error_type: error_type }
            },
            BuiltInKind::BkMut => { eff = Effect::MutEffect { state_type: ctx.env.fresh_var() } }
        },
        none => {}
    }

    let me = merge_effects(ctx.env, effects, effect_row([eff]), s)
    effects = me.0
    s = me.1

    InferResult {
        hexpr: HExpr::EffectOp { effect_name: effect_name, op_name: op_name, args: hargs, ty: op.return_type, effects: effects, span: span },
        subst: s, effects: effects
    }
}

// ============================================================
// infer_field_access
// ============================================================

fn infer_field_access(var ctx: InferCtx, receiver: Expr, field: Str, span: Span, subst: UnionFind) -> InferResult {
    let recv_r = infer_expr(ctx, receiver, subst)
    let s = recv_r.subst
    let recv_type = apply_subst(s, hexpr_type(recv_r.hexpr))

    var field_type: Type = ctx.env.fresh_var()
    match recv_type {
        Type::StructType { name, type_params, .. } => {
            match ctx.env.types.structs.get(name) {
                some(struct_def) => {
                    let f = struct_def.fields.find(fn(f_) { f_.name == field })
                    match f {
                        some(found_field) => {
                            let inst_map: Map<Int, Type> = map_new()
                            var fi = 0
                            while fi < struct_def.type_param_vars.len() && fi < type_params.len() {
                                match (struct_def.type_param_vars.get(fi), type_params.get(fi)) {
                                    (some(var_id), some(tp)) => inst_map.insert(var_id, tp),
                                    _ => {}
                                }
                                fi = fi + 1
                            }
                            field_type = apply_subst_map(inst_map, found_field.ty)
                        },
                        none => { let _ = type_error(ctx.sink, E0304,
                            "Struct ${name} has no field ${field}",
                            span, DiagnosticContext::MissingField { field: field, ty: name, available: none }) }
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
                    none => { let _ = type_error(ctx.sink, E0304,
                        "Record type has no field '${field}'",
                        span, DiagnosticContext::MissingField { field: field, ty: "record", available: none }) }
                }
            }
        },
        Type::TupleType { elements } => {
            match parse_int(field) {
                none => { let _ = type_error(ctx.sink, E0304,
                    "Cannot access named field '${field}' on tuple type; use .0, .1, etc.",
                    span, DiagnosticContext::MissingField { field: field, ty: "tuple", available: none }) },
                some(i) => {
                    if i >= elements.len() {
                        let _ = type_error(ctx.sink, E0304,
                            "Tuple index ${field} out of bounds; tuple has ${elements.len().to_str()} elements",
                            span, DiagnosticContext::MissingField { field: field, ty: "tuple", available: none })
                    }
                    match elements.get(i) {
                        some(t) => { field_type = t },
                        none => panic("unreachable: tuple index bounds already checked")
                    }
                }
            }
        },
        Type::TypeVar { .. } => {},
        _ => { let _ = type_error(ctx.sink, E0304,
            "Cannot access field '${field}' on type ${type_to_string(recv_type)}",
            span, DiagnosticContext::MissingField { field: field, ty: type_to_string(recv_type), available: none }) }
    }

    InferResult {
        hexpr: HExpr::FieldAccess { receiver: recv_r.hexpr, field: field, ty: field_type, effects: recv_r.effects, span: span },
        subst: s, effects: recv_r.effects
    }
}

// ============================================================
// infer_struct_lit
// ============================================================

fn infer_struct_lit(var ctx: InferCtx, name: Str, fields: List<StructFieldInit>, spread: Expr?, span: Span, subst: UnionFind, qualifier: Str?) -> InferResult {
    // Try module-qualified struct lookup: qualifier::name
    match qualifier {
        some(q) => {
            let qualified_name = "${q}::${name}"
            let mod_struct = ctx.env.types.structs.get(qualified_name)
            match mod_struct {
                some(_) => {
                    return infer_struct_lit(ctx, qualified_name, fields, spread, span, subst, none)
                },
                none => {}
            }
        },
        none => {}
    }

    // Check for named enum variant
    var variant_enum: Str? = none
    match qualifier {
        some(q) => match ctx.env.types.enums.get(q) {
            some(enum_def) => {
                if enum_def.variants.any(fn(v) { v.name == name }) { variant_enum = some(q) }
            },
            none => {}
        },
        none => { variant_enum = ctx.env.types.variant_to_enum.get(name) }
    }
    if variant_enum.is_none() && qualifier.is_some() {
        match qualifier {
            some(q) => { let _ = type_error(ctx.sink, E0201, "'${q}' has no variant '${name}'", span,
                DiagnosticContext::UndefinedVariable { name: name, scope_locals: none }) },
            none => {}
        }
    }
    match variant_enum {
        some(ve) => match ctx.env.types.enums.get(ve) {
            some(enum_def) => {
                let variant = enum_def.variants.find(fn(v) { v.name == name })
                match variant {
                    some(v) => match v.field_names {
                        some(_) => { return infer_named_variant_construct(ctx, ve, name, v, enum_def, fields, spread, span, subst) },
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
    let struct_def = match struct_def_opt { some(sd) => sd, none => panic("unreachable") }

    let inst_map: Map<Int, Type> = map_new()
    var type_param_types: List<Type> = []
    var tpi = 0
    while tpi < struct_def.type_param_vars.len() {
        match struct_def.type_param_vars.get(tpi) {
            some(var_id) => {
                let tv = ctx.env.fresh_var()
                inst_map.insert(var_id, tv)
                type_param_types.push(tv)
            },
            none => {}
        }
        tpi = tpi + 1
    }

    var s = subst
    var effects: EffectRow = EMPTY_ROW
    var hfields: List<HStructFieldInit> = []

    var hspread: HExpr? = none
    match spread {
        some(sp) => {
            let sr = infer_expr(ctx, sp, s)
            s = sr.subst
            let me = merge_effects(ctx.env, effects, sr.effects, s)
            effects = me.0
            s = me.1
            var spread_fields: List<StructField> = []
            for f in struct_def.fields {
                spread_fields.push(StructField { name: f.name, ty: apply_subst_map(inst_map, f.ty), is_pub: f.is_pub })
            }
            let spread_type = Type::StructType { name: name, type_params: type_param_types, fields: spread_fields }
            s = unify_at(ctx.sink, ctx.env, hexpr_type(sr.hexpr), spread_type, s, span)
            hspread = some(sr.hexpr)
        },
        none => {}
    }

    for field in fields {
        let fr = infer_expr(ctx, field.value, s)
        s = fr.subst
        let me = merge_effects(ctx.env, effects, fr.effects, s)
        effects = me.0
        s = me.1
        let def_field = struct_def.fields.find(fn(f) { f.name == field.name })
        match def_field {
            some(df) => {
                let ft = apply_subst_map(inst_map, df.ty)
                s = unify_at(ctx.sink, ctx.env, hexpr_type(fr.hexpr), ft, s, span)
            },
            none => { let _ = type_error(ctx.sink, E0203,
                "Struct '${name}' has no field '${field.name}'",
                field.span, DiagnosticContext::MissingField { field: field.name, ty: name, available: none }) }
        }
        hfields.push(HStructFieldInit { name: field.name, value: fr.hexpr })
    }

    if spread.is_none() {
        let provided: Set<Str> = set_new()
        for f in fields { provided.insert(f.name) }
        for df in struct_def.fields {
            if !provided.contains(df.name) {
                let _ = type_error(ctx.sink, E0203,
                    "Missing field '${df.name}' in struct literal '${name}'",
                    span, DiagnosticContext::MissingField { field: df.name, ty: name, available: none })
            }
        }
    }

    let struct_type = Type::StructType {
        name: name, type_params: type_param_types,
        fields: struct_def.fields
    }

    InferResult {
        hexpr: HExpr::StructLit { name: name, type_args: [], fields: hfields, spread: hspread, ty: struct_type, effects: effects, span: span },
        subst: s, effects: effects
    }
}

fn infer_named_variant_construct(var ctx: InferCtx, enum_name: Str, variant_name: Str, variant: EnumVariant, enum_def: EnumDef, fields: List<StructFieldInit>, spread: Expr?, span: Span, subst: UnionFind) -> InferResult {
    let field_names = match variant.field_names { some(fn_) => fn_, none => [] }

    let inst_map: Map<Int, Type> = map_new()
    var type_param_types: List<Type> = []
    var tpi = 0
    while tpi < enum_def.type_param_vars.len() {
        match enum_def.type_param_vars.get(tpi) {
            some(var_id) => {
                let tv = ctx.env.fresh_var()
                inst_map.insert(var_id, tv)
                type_param_types.push(tv)
            },
            none => {}
        }
        tpi = tpi + 1
    }

    var s = subst
    var effects: EffectRow = EMPTY_ROW
    var hfields: List<HStructFieldInit> = []

    var hspread: HExpr? = none
    match spread {
        some(sp) => {
            let sr = infer_expr(ctx, sp, s)
            s = sr.subst
            let me = merge_effects(ctx.env, effects, sr.effects, s)
            effects = me.0
            s = me.1
            let spread_enum_type = Type::EnumType { name: enum_name, type_params: type_param_types, variants: enum_def.variants }
            s = unify_at(ctx.sink, ctx.env, hexpr_type(sr.hexpr), spread_enum_type, s, span)
            hspread = some(sr.hexpr)
        },
        none => {}
    }

    for field in fields {
        let fr = infer_expr(ctx, field.value, s)
        s = fr.subst
        let me = merge_effects(ctx.env, effects, fr.effects, s)
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
            none => { let _ = type_error(ctx.sink, E0203,
                "Variant '${variant_name}' has no field '${field.name}'",
                field.span, DiagnosticContext::MissingField { field: field.name, ty: variant_name, available: none }) }
        }
        hfields.push(HStructFieldInit { name: field.name, value: fr.hexpr })
    }

    if spread.is_none() {
        let provided: Set<Str> = set_new()
        for f in fields { provided.insert(f.name) }
        for fn_name in field_names {
            if !provided.contains(fn_name) {
                let _ = type_error(ctx.sink, E0203,
                    "Missing field '${fn_name}' in variant '${variant_name}'",
                    span, DiagnosticContext::MissingField { field: fn_name, ty: variant_name, available: none })
            }
        }
    }

    let enum_type = Type::EnumType { name: enum_name, type_params: type_param_types, variants: enum_def.variants }

    InferResult {
        hexpr: HExpr::NamedVariantConstruct {
            enum_name: enum_name, variant_name: variant_name,
            fields: hfields, spread: hspread, ty: enum_type, effects: effects, span: span
        },
        subst: s, effects: effects
    }
}

// ============================================================
// infer_match
// ============================================================

fn infer_match(var ctx: InferCtx, scrutinee: Expr, arms: List<MatchArm>, span: Span, subst: UnionFind) -> InferResult {
    let scrut_r = infer_expr(ctx, scrutinee, subst)
    var s = scrut_r.subst
    var effects = scrut_r.effects
    let result_type = ctx.env.fresh_var()
    var harms: List<HMatchArm> = []

    for arm in arms {
        ctx.env.push_scope()
        let arm_result = some({
            var match_pattern = arm.pattern
            match arm.pattern {
                Pattern::Binding { name: pat_name, span: pspan } => {
                    match ctx.env.types.variant_to_enum.get(pat_name) {
                        some(ve) => match ctx.env.types.enums.get(ve) {
                            some(edef) => {
                                let v = edef.variants.find(fn(v_) { v_.name == pat_name })
                                match v {
                                    some(found_v) => {
                                        if found_v.fields.len() == 0 {
                                            let _ep = [0]; _ep.clear(); let empty_pats = _ep.map(fn(i: Int) -> Pattern { panic("unreachable") })
                                            match_pattern = Pattern::Constructor { name: pat_name, qualifier: none, fields: empty_pats, span: pspan }
                                        }
                                    },
                                    none => {}
                                }
                            },
                            none => {}
                        },
                        none => {}
                    }
                },
                _ => {}
            }
            bind_pattern(ctx, match_pattern, hexpr_type(scrut_r.hexpr), s)

            var guard_hexpr: HExpr? = none
            match arm.guard {
                some(g) => {
                    let gr = infer_expr(ctx, g, s)
                    s = gr.subst
                    s = unify_at(ctx.sink, ctx.env, hexpr_type(gr.hexpr), BOOL, s, arm.span)
                    let me = merge_effects(ctx.env, effects, gr.effects, s)
                    effects = me.0
                    s = me.1
                    guard_hexpr = some(gr.hexpr)
                },
                none => {}
            }

            let body_r = infer_expr(ctx, arm.body, s)
            s = body_r.subst
            let me = merge_effects(ctx.env, effects, body_r.effects, s)
            effects = me.0
            s = me.1
            s = unify_at(ctx.sink, ctx.env, hexpr_type(body_r.hexpr), result_type, s, arm.span)

            harms.push(HMatchArm { pattern: match_pattern, guard: guard_hexpr, body: body_r.hexpr, span: arm.span })
            true
        }) catch { _ => none }
        ctx.env.pop_scope()
        match arm_result {
            none => fail.raise(CompileError {}),
            _ => {}
        }
    }

    let scrut_type_resolved = apply_subst(s, hexpr_type(scrut_r.hexpr))
    let missing = check_exhaustive(harms, scrut_type_resolved, s)
    match missing {
        some(m) => { let _ = type_error(ctx.sink, E0601,
            "Non-exhaustive match on type ${type_to_string(scrut_type_resolved)}: missing pattern for ${m}",
            span, DiagnosticContext::PatternError { detail: "missing: ${m}" }) },
        none => {}
    }

    let final_type = apply_subst(s, result_type)
    InferResult {
        hexpr: HExpr::MatchExpr { scrutinee: scrut_r.hexpr, arms: harms, ty: final_type, effects: effects, span: span },
        subst: s, effects: effects
    }
}

// ============================================================
// infer_if
// ============================================================

fn infer_if(var ctx: InferCtx, condition: Expr, then_branch: Expr, else_branch: Expr?, span: Span, subst: UnionFind) -> InferResult {
    let cond_r = infer_expr(ctx, condition, subst)
    var s = cond_r.subst
    s = unify_at(ctx.sink, ctx.env, hexpr_type(cond_r.hexpr), BOOL, s, span)
    var effects = cond_r.effects

    let then_r = infer_block(ctx, then_branch, some(s))
    s = then_r.subst
    let me = merge_effects(ctx.env, effects, then_r.effects, s)
    effects = me.0
    s = me.1

    var else_hexpr: HExpr? = none
    var result_type: Type = UNIT

    match else_branch {
        some(eb) => match eb {
            Expr::Block { .. } => {
                let else_r = infer_block(ctx, eb, some(s))
                s = else_r.subst
                let me2 = merge_effects(ctx.env, effects, else_r.effects, s)
                effects = me2.0
                s = me2.1
                s = unify_at(ctx.sink, ctx.env, hexpr_type(then_r.hexpr), hexpr_type(else_r.hexpr), s, span)
                result_type = apply_subst(s, hexpr_type(then_r.hexpr))
                else_hexpr = some(else_r.hexpr)
            },
            Expr::IfExpr { condition: ec, then_branch: etb, else_branch: eeb, span: espan } => {
                let else_if_r = infer_if(ctx, ec, etb, eeb, espan, s)
                s = else_if_r.subst
                let me2 = merge_effects(ctx.env, effects, else_if_r.effects, s)
                effects = me2.0
                s = me2.1
                s = unify_at(ctx.sink, ctx.env, hexpr_type(then_r.hexpr), hexpr_type(else_if_r.hexpr), s, span)
                result_type = apply_subst(s, hexpr_type(then_r.hexpr))
                else_hexpr = some(HExpr::Block {
                    stmts: [], tail: some(else_if_r.hexpr),
                    ty: hexpr_type(else_if_r.hexpr), effects: else_if_r.effects, span: espan
                })
            },
            _ => { result_type = UNIT }
        },
        none => {}
    }

    InferResult {
        hexpr: HExpr::IfExpr {
            condition: cond_r.hexpr, then_branch: then_r.hexpr, else_branch: else_hexpr,
            ty: result_type, effects: effects, span: span
        },
        subst: s, effects: effects
    }
}

// ============================================================
// infer_string_interp
// ============================================================

fn infer_string_interp(var ctx: InferCtx, parts: List<StringInterpPart>, span: Span, subst: UnionFind) -> InferResult {
    var s = subst
    var effects: EffectRow = EMPTY_ROW
    var hparts: List<HStringInterpPart> = []

    for part in parts {
        match part {
            StringInterpPart::LitPart(str_val) => hparts.push(HStringInterpPart::Literal(str_val)),
            StringInterpPart::ExprPart(expr) => {
                let r = infer_expr(ctx, expr, s)
                s = r.subst
                let me = merge_effects(ctx.env, effects, r.effects, s)
                effects = me.0
                s = me.1
                hparts.push(HStringInterpPart::Expression(r.hexpr))
            }
        }
    }

    InferResult {
        hexpr: HExpr::StringInterp { parts: hparts, ty: STR, effects: effects, span: span },
        subst: s, effects: effects
    }
}

// ============================================================
// infer_catch
// ============================================================

fn infer_catch(var ctx: InferCtx, expr: Expr, arms: List<MatchArm>, span: Span, subst: UnionFind) -> InferResult {
    let expr_r = infer_expr(ctx, expr, subst)
    var s = expr_r.subst
    var effects = expr_r.effects

    // Extract error type from the body's fail effects, unifying if multiple
    var error_type: Type = ctx.env.fresh_var()
    var found_fail = false
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

    let result_type = ctx.env.fresh_var()
    s = unify_at(ctx.sink, ctx.env, hexpr_type(expr_r.hexpr), result_type, s, span)
    var harms: List<HMatchArm> = []
    var has_catch_all = false

    for arm in arms {
        ctx.env.push_scope()
        let arm_result = some({
            bind_pattern(ctx, arm.pattern, error_type, s)

            var guard_hexpr: HExpr? = none
            match arm.guard {
                some(g) => {
                    let gr = infer_expr(ctx, g, s)
                    s = gr.subst
                    s = unify_at(ctx.sink, ctx.env, hexpr_type(gr.hexpr), BOOL, s, arm.span)
                    let me = merge_effects(ctx.env, effects, gr.effects, s)
                    effects = me.0
                    s = me.1
                    guard_hexpr = some(gr.hexpr)
                },
                none => {}
            }

            let body_r = infer_expr(ctx, arm.body, s)
            s = body_r.subst
            let me = merge_effects(ctx.env, effects, body_r.effects, s)
            effects = me.0
            s = me.1
            s = unify_at(ctx.sink, ctx.env, hexpr_type(body_r.hexpr), result_type, s, arm.span)

            // Check if this arm is a catch-all (wildcard or binding without guard)
            match arm.pattern {
                Pattern::Wildcard { .. } => match arm.guard {
                    none => { has_catch_all = true },
                    _ => {}
                },
                Pattern::Binding { .. } => match arm.guard {
                    none => { has_catch_all = true },
                    _ => {}
                },
                _ => {}
            }

            harms.push(HMatchArm { pattern: arm.pattern, guard: guard_hexpr, body: body_r.hexpr, span: arm.span })
            true
        }) catch { _ => none }
        ctx.env.pop_scope()
        match arm_result {
            none => fail.raise(CompileError {}),
            _ => {}
        }
    }

    // If catch-all exists, remove fail effect; otherwise fail propagates
    if has_catch_all {
        effects = remove_fail_effect(effects)
    }

    let final_type = apply_subst(s, result_type)
    InferResult {
        hexpr: HExpr::TryCatch { body: expr_r.hexpr, arms: harms, ty: final_type, effects: effects, span: span },
        subst: s, effects: effects
    }
}

// ============================================================
// infer_handle
// ============================================================

fn infer_handle(var ctx: InferCtx, body: Expr, handlers: List<EffectHandler>, span: Span, subst: UnionFind) -> InferResult {
    let body_r = infer_expr(ctx, body, subst)
    var s = body_r.subst
    var effects = body_r.effects

    var hhandlers: List<HEffectHandler> = []
    let handled_effects: Set<Str> = set_new()

    for handler in handlers {
        ctx.env.push_scope()
        let effect_def = ctx.env.types.effects.get(handler.effect_name)
        var op_def: EffectOpDef? = none
        match effect_def {
            some(ed) => { op_def = ed.ops.find(fn(o) { o.name == handler.op_name }) },
            none => {}
        }

        var hparams: List<HParam> = []
        var hi = 0
        for p in handler.params {
            let pt = match p.type_annotation {
                some(ta) => resolve_type_expr(ctx, ta),
                none => match op_def {
                    some(od) => match od.params.get(hi) { some(odt) => odt, none => ctx.env.fresh_var() },
                    none => ctx.env.fresh_var()
                }
            }
            ctx.env.bind_mono(p.name, pt)
            hparams.push(HParam { name: p.name, ty: pt, def_id: none, is_mutable: false })
            hi = hi + 1
        }

        match handler.resume_name {
            some(rn) => {
                let resume_param = match op_def { some(od) => od.return_type, none => ctx.env.fresh_var() }
                let resume_ret = ctx.env.fresh_var()
                ctx.env.bind_mono(rn, Type::FnType { params: [resume_param], return_type: resume_ret, effects: EMPTY_ROW })
            },
            none => {}
        }

        let handler_body_result = some(infer_expr(ctx, handler.body, s)) catch { _ => none }
        ctx.env.pop_scope()

        match handler_body_result {
            some(hbr) => {
                s = hbr.subst
                hhandlers.push(HEffectHandler {
                    effect_name: handler.effect_name, op_name: handler.op_name,
                    params: hparams, resume_name: handler.resume_name, body: hbr.hexpr
                })
            },
            none => fail.raise(CompileError {})
        }

        handled_effects.insert(handler.effect_name)
    }

    let resolved_effects = apply_subst_row(s, effects)
    var filtered_effects: List<Effect> = []
    for e in resolved_effects.effects {
        let should_keep = match e {
            Effect::IoEffect => !handled_effects.contains("io"),
            Effect::CustomEffect { name, .. } => !handled_effects.contains(name),
            Effect::FailEffect { .. } => !handled_effects.contains("fail"),
            Effect::MutEffect { .. } => !handled_effects.contains("mut")
        }
        if should_keep { filtered_effects.push(e) }
    }
    effects = EffectRow { effects: filtered_effects, tail: resolved_effects.tail }

    InferResult {
        hexpr: HExpr::HandleExpr {
            body: body_r.hexpr, handlers: hhandlers,
            ty: hexpr_type(body_r.hexpr), effects: effects, span: span
        },
        subst: s, effects: effects
    }
}

// ============================================================
// infer_lambda
// ============================================================

fn infer_lambda(var ctx: InferCtx, params: List<Param>, body: Expr, span: Span, subst: UnionFind, expected_param_types: List<Type>?) -> InferResult {
    ctx.env.push_scope()
    var s = subst
    var hparams: List<HParam> = []
    var param_types: List<Type> = []

    var pi = 0
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
                        ctx.env.record_def_span(did, p.span)
                        if p.is_mutable { ctx.env.scope.mutable_vars.insert(did) }
                    },
                    none => {}
                }
                hparams.push(HParam { name: p.name, ty: pt, def_id: ls.def_id, is_mutable: p.is_mutable })
            },
            none => {
                hparams.push(HParam { name: p.name, ty: pt, def_id: none, is_mutable: p.is_mutable })
            }
        }
        param_types.push(pt)
        pi = pi + 1
    }

    let body_result = some(infer_expr(ctx, body, s)) catch { _ => none }
    ctx.env.pop_scope()

    match body_result {
        some(body_r) => {
            s = body_r.subst
            var applied_params: List<Type> = []
            for pt in param_types { applied_params.push(apply_subst(s, pt)) }
            let applied_ret = apply_subst(s, hexpr_type(body_r.hexpr))

            let fn_type = Type::FnType { params: applied_params, return_type: applied_ret, effects: body_r.effects }

            var final_hparams: List<HParam> = []
            for hp in hparams {
                final_hparams.push(HParam { name: hp.name, ty: apply_subst(s, hp.ty), def_id: hp.def_id, is_mutable: hp.is_mutable })
            }

            InferResult {
                hexpr: HExpr::Lambda {
                    params: final_hparams, return_type: applied_ret,
                    body: body_r.hexpr, ty: fn_type, effects: EMPTY_ROW, span: span
                },
                subst: s, effects: EMPTY_ROW
            }
        },
        none => fail.raise(CompileError {})
    }
}

// ============================================================
// infer_list_literal
// ============================================================

fn infer_list_literal(var ctx: InferCtx, elements: List<Expr>, span: Span, subst: UnionFind) -> InferResult {
    if elements.len() == 0 {
        let elem_type = ctx.env.fresh_var()
        let list_type = Type::StructType { name: BUILTIN_LIST, type_params: [elem_type], fields: [] }
        return InferResult {
            hexpr: HExpr::ListLit { elements: [], ty: list_type, effects: EMPTY_ROW, span: span },
            subst: subst, effects: EMPTY_ROW
        }
    }
    var s = subst
    var helements: List<HExpr> = []
    var elem_type: Type = ctx.env.fresh_var()
    var combined_effects: EffectRow = EMPTY_ROW
    for el in elements {
        let r = infer_expr(ctx, el, s)
        s = r.subst
        s = unify_at(ctx.sink, ctx.env, apply_subst(s, hexpr_type(r.hexpr)), apply_subst(s, elem_type), s, span)
        elem_type = apply_subst(s, elem_type)
        helements.push(r.hexpr)
        let me = merge_effects(ctx.env, combined_effects, r.effects, s)
        combined_effects = me.0
        s = me.1
    }
    let list_type = Type::StructType { name: BUILTIN_LIST, type_params: [apply_subst(s, elem_type)], fields: [] }
    InferResult {
        hexpr: HExpr::ListLit { elements: helements, ty: list_type, effects: combined_effects, span: span },
        subst: s, effects: combined_effects
    }
}
