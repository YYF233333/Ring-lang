use types::{Type, Effect, EffectRow,
    INT, FLOAT, STR, BOOL, UNIT, NEVER, ANY, EMPTY_ROW,
    type_to_string, types_equal,
    type_to_builtin_name}
use ast::{Expr, Pattern, Span, NamedPatternField}
use hir::{HExpr, HStmt, TraitDispatch, DictRef,
    variant_js_name, trait_dict_name, trait_bound_param_name,
    hexpr_type}
use diagnostics::{DiagnosticContext, DiagnosticNote}
use codes::{E0201, E0205, E0208, E0303, E0307, E0308, E0504, E0705}
use union_find::{UnionFind, uf_find, uf_lookup}
use env::{TypeEnv, TypeScheme,
    apply_subst, has_impl, lookup_variant}
use infer_ctx::{InferCtx, InferResult, FnBoundsEntry,
    type_error, unify_at, build_scheme_var_map, resolve_relative_qualifier}


pub struct MethodLookupResult {
    method_type: Type?,
    method_scheme: TypeScheme?
}


pub struct StmtResult {
    hstmt: HStmt,
    subst: UnionFind,
    effects: EffectRow
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
                            if types_equal(resolved_pt, resolved_st) {
                                match hargs.get(ai) {
                                    some(harg) => match harg {
                                        HExpr::Ident { def_id: some(did), .. } => {
                                            if !ctx.env.scope.mut_param_defs.contains(did) {
                                                cancel_types.push(resolved_st)
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
                    if types_equal(ct, resolved_st) {
                        keep = false
                    }
                }
            },
            _ => {}
        }
        if keep {
            filtered.push(e)
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
            let root = find_root_expr(receiver)
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
            let root = find_root_expr(receiver)
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
        Expr::FieldAccess { receiver, .. } => find_root_expr(receiver),
        Expr::IndexExpr { receiver, .. } => find_root_expr(receiver),
        _ => e
    }
}

// B-056: Get def_id of root variable in an assignment target (AST level).
pub fn get_assign_target_root_def_id(ctx: InferCtx, target: Expr) -> Int? {
    let root = find_root_expr(target)
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
                            resolved_qualifier = some(prefix)
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
                    let t = ctx.env.instantiate(ms)
                    return InferResult {
                        hexpr: HExpr::Ident { name: qualified_name, resolved_name: none, def_id: ms.def_id, dict_closure_dicts: none, ty: t, effects: EMPTY_ROW, span: span },
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
                                let t = ctx.env.instantiate(fs)
                                return InferResult {
                                    hexpr: HExpr::Ident { name: full_qualified, resolved_name: none, def_id: fs.def_id, dict_closure_dicts: none, ty: t, effects: EMPTY_ROW, span: span },
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
            // Auto-boxing: mark mutable vars captured by closures
            match s.def_id {
                some(did) => {
                    if ctx.env.scope.mutable_vars.contains(did) {
                        match ctx.var_lambda_depth.get(did) {
                            some(def_depth) => {
                                if ctx.lambda_depth > def_depth {
                                    ctx.boxed_vars.insert(did)
                                }
                            },
                            none => {}
                        }
                    }
                },
                none => {}
            }
            let mut resolved_name: Str? = none
            let mut enum_name: Str? = none
            // Check if this name was imported via use alias (e.g. use super::value)
            // If so, use the qualified name in HIR for correct codegen
            let actual_name = match ctx.use_aliases.get(name) {
                some(qualified) => qualified,
                none => name
            }
            match resolved_qualifier {
                some(q) => {
                    match ctx.env.types.enums.get(q) {
                        some(enum_def) => {
                            if enum_def.variant_index.contains_key(name) {
                                enum_name = some(enum_def.name)
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
                hexpr: HExpr::Ident { name: actual_name, resolved_name: resolved_name, def_id: s.def_id, dict_closure_dicts: none, ty: t, effects: EMPTY_ROW, span: span },
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
            sorted_tp_scope.sort_by(fn(a, b) { if a.0 < b.0 { -1 } else if a.0 > b.0 { 1 } else { 0 } })
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

pub fn is_tuple_type(t: Type) -> Bool {
    match t { Type::TupleType { .. } => true, _ => false }
}

pub fn resolve_trait_dispatch(ctx: InferCtx, resolved: Type, trait_name: Str, error_code: Str, subst: UnionFind, span: Span, op: Str, is_builtin: Bool) -> TraitDispatch {
    if is_builtin { return TraitDispatch::Builtin }

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
                "Type does not implement ${trait_name}, cannot use '${op}'",
                span, DiagnosticContext::TraitError { detail: "type does not implement ${trait_name}" })
            TraitDispatch::Builtin
        },
        Type::StructType { name, type_params, .. } => {
            if has_impl(ctx.env.trait_reg, name, trait_name) {
                let extra_dicts = resolve_trait_extra_dicts(ctx, type_params, subst, trait_name)
                return TraitDispatch::Direct { dict: trait_dict_name(name, trait_name), extra_dicts: match extra_dicts { some(d) => d, none => [] } }
            }
            let _ = type_error(ctx.sink, error_code,
                "Type '${type_to_string(resolved)}' does not implement ${trait_name}, cannot use '${op}'",
                span, DiagnosticContext::TraitError { detail: "type '${type_to_string(resolved)}' does not implement ${trait_name}" })
            TraitDispatch::Builtin
        },
        Type::EnumType { name, type_params, .. } => {
            if has_impl(ctx.env.trait_reg, name, trait_name) {
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

pub fn resolve_trait_extra_dicts(ctx: InferCtx, type_args: List<Type>, subst: UnionFind, trait_name: Str) -> List<DictRef>? {
    if type_args.len() == 0 { return none }
    let mut dicts: List<DictRef> = []
    for arg in type_args {
        let resolved = apply_subst(subst, arg)
        let dict = resolve_type_to_dict_ref(ctx, resolved, subst, trait_name)
        match dict {
            some(d) => dicts.push(d),
            none => { return none }
        }
    }
    some(dicts)
}

pub fn resolve_type_to_dict_ref(ctx: InferCtx, t: Type, subst: UnionFind, trait_name: Str) -> DictRef? {
    match type_to_builtin_name(t) {
        some(builtin_name) => match t {
            Type::StructType { .. } => {},
            Type::EnumType { .. } => {},
            _ => { return some(DictRef::Static(trait_dict_name(builtin_name, trait_name))) }
        },
        none => {}
    }
    match t {
        Type::TypeVar { id, .. } => {
            let bound = ctx.current_fn_bounds.find(fn(fb) {
                fb.type_param_var_id == id && fb.trait_name == trait_name
            })
            match bound {
                some(b) => some(DictRef::Simple(trait_bound_param_name(b.type_param_name, trait_name))),
                none => none
            }
        },
        Type::StructType { name, type_params, .. } => {
            if has_impl(ctx.env.trait_reg, name, trait_name) {
                if type_params.len() > 0 {
                    let inner = resolve_trait_extra_dicts(ctx, type_params, subst, trait_name)
                    match inner {
                        some(inner_dicts) => some(DictRef::Wrapped {
                            dict: trait_dict_name(name, trait_name),
                            trait_name: trait_name,
                            inner_dicts: inner_dicts
                        }),
                        none => some(DictRef::Static(trait_dict_name(name, trait_name)))
                    }
                } else {
                    some(DictRef::Static(trait_dict_name(name, trait_name)))
                }
            } else { none }
        },
        Type::EnumType { name, type_params, .. } => {
            if has_impl(ctx.env.trait_reg, name, trait_name) {
                if type_params.len() > 0 {
                    let inner = resolve_trait_extra_dicts(ctx, type_params, subst, trait_name)
                    match inner {
                        some(inner_dicts) => some(DictRef::Wrapped {
                            dict: trait_dict_name(name, trait_name),
                            trait_name: trait_name,
                            inner_dicts: inner_dicts
                        }),
                        none => some(DictRef::Static(trait_dict_name(name, trait_name)))
                    }
                } else {
                    some(DictRef::Static(trait_dict_name(name, trait_name)))
                }
            } else { none }
        },
        _ => none
    }
}

// ============================================================
// Dict closure resolution for function arguments
// ============================================================

pub fn resolve_arg_dict_closure(ctx: InferCtx, harg: HExpr, s: UnionFind) -> HExpr {
    match harg {
        HExpr::Ident { name, resolved_name, def_id, ty, effects, span, .. } => {
            let arg_scheme = ctx.env.lookup(name)
            match arg_scheme {
                some(as_) => {
                    if as_.bounds.len() == 0 { return harg }
                    let var_map = build_scheme_var_map(as_, ty)
                    let mut dicts: List<Str> = []
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

pub fn resolve_arg_bound_dict(ctx: InferCtx, concrete: Type, trait_name: Str, mut dicts: List<Str>) {
    match concrete {
        Type::StructType { name, .. } => {
            if has_impl(ctx.env.trait_reg, name, trait_name) {
                dicts.push(trait_dict_name(name, trait_name))
            }
        },
        Type::EnumType { name, .. } => {
            if has_impl(ctx.env.trait_reg, name, trait_name) {
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
                    if has_impl(ctx.env.trait_reg, prim_name, trait_name) {
                        dicts.push(trait_dict_name(prim_name, trait_name))
                    }
                },
                none => {}
            }
        }
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
        Type::StructType { name, .. } => { type_name = some(name) },
        Type::EnumType { name, .. } => { type_name = some(name) },
        _ => {
            match type_to_builtin_name(recv_type) {
                some(n) => { type_name = some(n) },
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
        Type::StructType { name, .. } => { type_name = some(name) },
        Type::EnumType { name, .. } => { type_name = some(name) },
        _ => {
            match type_to_builtin_name(recv_type) {
                some(n) => { type_name = some(n) },
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
            some(scheme) => MethodLookupResult {
                method_type: some(ctx.env.instantiate(scheme)),
                method_scheme: some(scheme)
            },
            none => MethodLookupResult { method_type: none, method_scheme: none }
        },
        none => MethodLookupResult { method_type: none, method_scheme: none }
    }
}

pub fn lookup_trait_method(mut ctx: InferCtx, type_name: Str, method: Str, span: Span) -> Type? {
    let mut found_type: Type? = none
    let mut found_trait_name: Str? = none
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
        },
        none => {}
    }
    found_type
}

// ============================================================
// rewrite_bare_enum_bindings
// ============================================================

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
                                    Pattern::Constructor { name: name, qualifier: none, fields: empty_pats, span: span }
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
                new_elems.push(rewrite_bare_enum_bindings(env, elem))
            }
            Pattern::TuplePattern { elements: new_elems, span: span }
        },
        Pattern::Constructor { name, qualifier, fields, span } => {
            let mut new_fields: List<Pattern> = []
            for f in fields {
                new_fields.push(rewrite_bare_enum_bindings(env, f))
            }
            Pattern::Constructor { name: name, qualifier: qualifier, fields: new_fields, span: span }
        },
        Pattern::NamedConstructor { name, qualifier, fields, rest, span } => {
            let mut new_fields: List<NamedPatternField> = []
            for f in fields {
                new_fields.push(NamedPatternField { name: f.name, pattern: rewrite_bare_enum_bindings(env, f.pattern), span: f.span })
            }
            Pattern::NamedConstructor { name: name, qualifier: qualifier, fields: new_fields, rest: rest, span: span }
        },
        Pattern::OrPattern { patterns, span } => {
            let mut new_pats: List<Pattern> = []
            for p in patterns {
                new_pats.push(rewrite_bare_enum_bindings(env, p))
            }
            Pattern::OrPattern { patterns: new_pats, span: span }
        },
        _ => pattern,
    }
}
