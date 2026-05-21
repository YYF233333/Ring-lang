use types::{Type, Effect, EffectRow, RecordField, StructField,
    INT, FLOAT, STR, BOOL, UNIT, NEVER, ANY, EMPTY_ROW,
    type_to_string, types_equal, make_option_type, type_to_builtin_name,
    row_merge}
use ast::{Span, Pattern, TypeExpr, RecordTypeField, NamedPatternField, span_zero}
use hir::{HExpr, HStmt, HParam, trait_dict_name, trait_bound_param_name,
    BUILTIN_INT, BUILTIN_FLOAT, BUILTIN_STR, BUILTIN_BOOL, BUILTIN_OPTION}
use diagnostics::{DiagnosticContext, Diagnostic, CollectingSink, Severity, make_diag}
use codes::{E0201, E0204, E0301, E0302, E0503}
use env::{TypeEnv, TypeScheme, SchemeBound, new_type_env, mono, apply_subst, apply_subst_row}
use unify::{UnificationError, empty_subst, unify, occurs_in}

// ============================================================
// InferResult — return type for expression inference
// ============================================================

pub struct InferResult {
    pub hexpr: HExpr,
    pub subst: Map<Int, Type>,
    pub effects: EffectRow
}

// ============================================================
// Fn bounds entry type
// ============================================================

pub struct FnBoundsEntry {
    pub type_param_var_id: Int,
    pub trait_name: Str,
    pub type_param_name: Str
}

// ============================================================
// CompileError (raised via fail effect, caught at declaration level)
// ============================================================

pub struct CompileError {}

// ============================================================
// InferCtx — mutable type inference context
// ============================================================

pub struct InferCtx {
    pub env: TypeEnv,
    pub subst: Map<Int, Type>,
    pub sink: CollectingSink,
    pub type_param_scope: Map<Str, Type>,
    pub current_fn_return_type: Type?,
    pub current_fn_bounds: List<FnBoundsEntry>,
    pub fn_bounds_stack: List<List<FnBoundsEntry>>,
    pub loop_depth: Int
}

pub fn new_infer_ctx(sink: CollectingSink) -> InferCtx {
    InferCtx {
        env: new_type_env(),
        subst: empty_subst(),
        sink: sink,
        type_param_scope: map_new(),
        current_fn_return_type: none,
        current_fn_bounds: [],
        fn_bounds_stack: [],
        loop_depth: 0
    }
}

// ============================================================
// Error helper
// ============================================================

pub fn type_error(sink: CollectingSink, code: Str, message: Str, span: Span, context: DiagnosticContext) -> Type {
    let diag = make_diag(code, Severity::SevError, message, span, context)
    sink.report(diag)
    Type::ErrorType
}

// ============================================================
// Unification / effect helpers
// ============================================================

pub fn merge_effects(env: TypeEnv, a: EffectRow, b: EffectRow, s: Map<Int, Type>) -> (EffectRow, Map<Int, Type>) {
    let m = row_merge(a, b)
    var result_s = s
    match m.tails_to_unify {
        some(pair) => {
            let (ta, tb) = pair
            result_s = unify(
                Type::TypeVar { id: ta, name: none },
                Type::TypeVar { id: tb, name: none },
                s, env
            )
        },
        none => {}
    }
    let out = (m.row, result_s)
    out
}

pub fn unify_at(sink: CollectingSink, env: TypeEnv, t1: Type, t2: Type, s: Map<Int, Type>, span: Span) -> Map<Int, Type> {
    unify(t1, t2, s, env) catch {
        e => {
            let code = if e.is_occurs_check { E0302 } else { E0301 }
            let _ = type_error(sink, code, e.message, span, DiagnosticContext::TypeMismatch {
                expected: type_to_string(apply_subst(s, t1)),
                actual: type_to_string(apply_subst(s, t2)),
                expression: none
            })
            s
        }
    }
}

// ============================================================
// Free type variable collection
// ============================================================

pub fn free_type_vars(t: Type, subst: Map<Int, Type>) -> Set<Int> {
    let resolved = apply_subst(subst, t)
    let result: Set<Int> = set_new()
    collect_free_vars(resolved, result)
    result
}

pub fn collect_free_vars(t: Type, result: Set<Int>) {
    match t {
        Type::IntType => {},
        Type::FloatType => {},
        Type::StrType => {},
        Type::BoolType => {},
        Type::UnitType => {},
        Type::NeverType => {},
        Type::AnyType => {},
        Type::ErrorType => {},
        Type::TypeVar { id, .. } => { result.insert(id) },
        Type::FnType { params, return_type, effects } => {
            for p in params { collect_free_vars(p, result) }
            collect_free_vars(return_type, result)
            match effects.tail {
                some(tail_id) => { result.insert(tail_id) },
                none => {}
            }
            for e in effects.effects {
                match e {
                    Effect::FailEffect { error_type } => collect_free_vars(error_type, result),
                    Effect::CustomEffect { type_args, .. } => {
                        for a in type_args { collect_free_vars(a, result) }
                    },
                    _ => {}
                }
            }
        },
        Type::StructType { type_params, .. } => {
            for tp in type_params { collect_free_vars(tp, result) }
        },
        Type::EnumType { type_params, .. } => {
            for tp in type_params { collect_free_vars(tp, result) }
        },
        Type::GenericType { base, args } => {
            collect_free_vars(base, result)
            for a in args { collect_free_vars(a, result) }
        },
        Type::RecordType { fields, tail, .. } => {
            for f in fields { collect_free_vars(f.ty, result) }
            match tail { some(t_id) => { result.insert(t_id) }, none => {} }
        },
        Type::TupleType { elements } => {
            for e in elements { collect_free_vars(e, result) }
        },
        Type::EffectRowType { effects, tail } => {
            match tail { some(t_id) => { result.insert(t_id) }, none => {} }
            for e in effects {
                match e {
                    Effect::FailEffect { error_type } => collect_free_vars(error_type, result),
                    Effect::CustomEffect { type_args, .. } => {
                        for a in type_args { collect_free_vars(a, result) }
                    },
                    _ => {}
                }
            }
        }
    }
}

pub fn free_type_vars_in_env(env: TypeEnv, subst: Map<Int, Type>) -> Set<Int> {
    let result: Set<Int> = set_new()
    for scope in env.scope.scopes {
        for entry in scope.variables.entries() {
            let (_, scheme) = entry
            let ftv = free_type_vars(scheme.ty, subst)
            let quantified: Set<Int> = set_new()
            for v in scheme.type_vars {
                let resolved = apply_subst(subst, Type::TypeVar { id: v, name: none })
                match resolved {
                    Type::TypeVar { id, .. } => { quantified.insert(id) },
                    _ => { quantified.insert(v) }
                }
            }
            for v in ftv {
                if !quantified.contains(v) { result.insert(v) }
            }
        }
    }
    result
}

// ============================================================
// Generalization
// ============================================================

pub fn generalize(env: TypeEnv, t: Type, subst: Map<Int, Type>) -> TypeScheme {
    let resolved = apply_subst(subst, t)
    let ftv_type = free_type_vars(resolved, empty_subst())
    let ftv_env = free_type_vars_in_env(env, subst)
    var type_vars: List<Int> = []
    for v in ftv_type {
        if !ftv_env.contains(v) { type_vars.push(v) }
    }
    var bounds: List<SchemeBound> = []
    for tv in type_vars {
        match env.scope.var_bounds.get(tv) {
            some(traits) => {
                for trait_name in traits {
                    bounds.push(SchemeBound { type_var: tv, trait_name: trait_name })
                }
            },
            none => {}
        }
    }
    TypeScheme { ty: resolved, type_vars: type_vars, bounds: bounds, def_id: none }
}

// ============================================================
// Fn effects update
// ============================================================

pub fn update_fn_effects(env: TypeEnv, name: Str, effects: EffectRow) {
    match env.lookup(name) {
        some(scheme) => match scheme.ty {
            Type::FnType { params, return_type, .. } => {
                let new_type = Type::FnType { params: params, return_type: return_type, effects: effects }
                env.rebind(name, TypeScheme { ..scheme, ty: new_type })
            },
            _ => {}
        },
        none => {}
    }
}

// ============================================================
// Scheme var map + dict resolution
// ============================================================

pub fn build_scheme_var_map(scheme: TypeScheme, instantiated_type: Type) -> Map<Int, Type> {
    let result: Map<Int, Type> = map_new()
    match (scheme.ty, instantiated_type) {
        (Type::FnType { params: sp, return_type: sr, .. },
         Type::FnType { params: ip, return_type: ir, .. }) => {
            var i = 0
            let limit = if sp.len() < ip.len() { sp.len() } else { ip.len() }
            while i < limit {
                match (sp.get(i), ip.get(i)) {
                    (some(s_param), some(i_param)) =>
                        collect_var_mappings(s_param, i_param, scheme.type_vars, result),
                    _ => {}
                }
                i = i + 1
            }
            collect_var_mappings(sr, ir, scheme.type_vars, result)
        },
        _ => {}
    }
    result
}

fn collect_var_mappings(scheme_type: Type, inst_type: Type, type_vars: List<Int>, result: Map<Int, Type>) {
    match scheme_type {
        Type::TypeVar { id, .. } => {
            if type_vars.contains(id) {
                result.insert(id, inst_type)
            }
        },
        Type::StructType { name: sn, type_params: stp, .. } => match inst_type {
            Type::StructType { name: in_, type_params: itp, .. } => {
                if sn == in_ {
                    var i = 0
                    let limit = if stp.len() < itp.len() { stp.len() } else { itp.len() }
                    while i < limit {
                        match (stp.get(i), itp.get(i)) {
                            (some(s), some(inst)) => collect_var_mappings(s, inst, type_vars, result),
                            _ => {}
                        }
                        i = i + 1
                    }
                }
            },
            _ => {}
        },
        Type::EnumType { name: sn, type_params: stp, .. } => match inst_type {
            Type::EnumType { name: in_, type_params: itp, .. } => {
                if sn == in_ {
                    var i = 0
                    let limit = if stp.len() < itp.len() { stp.len() } else { itp.len() }
                    while i < limit {
                        match (stp.get(i), itp.get(i)) {
                            (some(s), some(inst)) => collect_var_mappings(s, inst, type_vars, result),
                            _ => {}
                        }
                        i = i + 1
                    }
                }
            },
            _ => {}
        },
        _ => {}
    }
}

pub fn resolve_dicts_from_scheme(
    sink: CollectingSink, env: TypeEnv,
    current_fn_bounds: List<FnBoundsEntry>,
    scheme: TypeScheme, callee_type: Type, s: Map<Int, Type>, span: Span
) -> List<Str> {
    if scheme.bounds.len() == 0 { return [] }
    let var_map = build_scheme_var_map(scheme, callee_type)
    var resolved_dicts: List<Str> = []
    for bound in scheme.bounds {
        var found = false
        match var_map.get(bound.type_var) {
            some(fresh_var) => {
                let concrete = apply_subst(s, fresh_var)
                match concrete {
                    Type::StructType { name, .. } => {
                        if env.trait_reg.trait_impls.any(fn(impl_) {
                            impl_.target_type_name == name && impl_.trait_name == bound.trait_name
                        }) {
                            resolved_dicts.push(trait_dict_name(name, bound.trait_name))
                            found = true
                        }
                    },
                    Type::EnumType { name, .. } => {
                        if env.trait_reg.trait_impls.any(fn(impl_) {
                            impl_.target_type_name == name && impl_.trait_name == bound.trait_name
                        }) {
                            resolved_dicts.push(trait_dict_name(name, bound.trait_name))
                            found = true
                        }
                    },
                    Type::TypeVar { id, .. } => {
                        let matching = current_fn_bounds.find(fn(fb) {
                            fb.type_param_var_id == id && fb.trait_name == bound.trait_name
                        })
                        match matching {
                            some(fb) => {
                                resolved_dicts.push(trait_bound_param_name(fb.type_param_name, fb.trait_name))
                                found = true
                            },
                            none => {}
                        }
                    },
                    _ => {}
                }
                if !found {
                    match type_to_builtin_name(concrete) {
                        some(prim_name) => {
                            if env.trait_reg.trait_impls.any(fn(impl_) {
                                impl_.target_type_name == prim_name && impl_.trait_name == bound.trait_name
                            }) {
                                resolved_dicts.push(trait_dict_name(prim_name, bound.trait_name))
                                found = true
                            }
                        },
                        none => {}
                    }
                }
            },
            none => {}
        }
        if !found {
            let _ = type_error(sink, E0503,
                "Type does not satisfy trait bound '${bound.trait_name}'",
                span, DiagnosticContext::TraitError { detail: "type does not satisfy '${bound.trait_name}'" })
        }
    }
    resolved_dicts
}

// ============================================================
// Type expression resolution
// ============================================================

pub fn resolve_type_expr(ctx: InferCtx, texpr: TypeExpr) -> Type {
    match texpr {
        TypeExpr::Named { name, type_args, span } =>
            resolve_named_type(ctx, name, type_args, span),
        TypeExpr::FnType { params, return_type, .. } => {
            var resolved_params: List<Type> = []
            for p in params { resolved_params.push(resolve_type_expr(ctx, p)) }
            let ret = resolve_type_expr(ctx, return_type)
            Type::FnType { params: resolved_params, return_type: ret, effects: EMPTY_ROW }
        },
        TypeExpr::OptionType { inner, .. } =>
            make_option_type(resolve_type_expr(ctx, inner)),
        TypeExpr::RecordType { fields, rest, .. } => {
            var resolved_fields: List<RecordField> = []
            for f in fields {
                resolved_fields.push(RecordField { name: f.name, ty: resolve_type_expr(ctx, f.ty) })
            }
            match rest {
                some(rest_name) => {
                    let tail_var = ctx.env.fresh_var()
                    match tail_var {
                        Type::TypeVar { id, .. } => {
                            ctx.type_param_scope.insert(rest_name, tail_var)
                            Type::RecordType { fields: resolved_fields, tail: some(id), tail_name: some(rest_name) }
                        },
                        _ => Type::RecordType { fields: resolved_fields, tail: none, tail_name: none }
                    }
                },
                none => Type::RecordType { fields: resolved_fields, tail: none, tail_name: none }
            }
        },
        TypeExpr::TupleType { elements, .. } => {
            var resolved_elems: List<Type> = []
            for e in elements { resolved_elems.push(resolve_type_expr(ctx, e)) }
            Type::TupleType { elements: resolved_elems }
        }
    }
}

pub fn resolve_self_type(ctx: InferCtx, name: Str) -> Type {
    resolve_named_type(ctx, name, [], span_zero())
}

pub fn resolve_named_type(ctx: InferCtx, name: Str, type_args: List<TypeExpr>, span: Span) -> Type {
    if (name == BUILTIN_INT) { return INT }
    if (name == BUILTIN_FLOAT) { return FLOAT }
    if (name == BUILTIN_STR) { return STR }
    if (name == BUILTIN_BOOL) { return BOOL }
    if name == "Never" { return NEVER }
    if name == "Unit" { return UNIT }

    // Check type parameter scope
    match ctx.type_param_scope.get(name) {
        some(tp) => { return tp },
        none => {}
    }

    // Option<T>
    if name == BUILTIN_OPTION && type_args.len() == 1 {
        match type_args.get(0) {
            some(arg) => { return make_option_type(resolve_type_expr(ctx, arg)) },
            none => {}
        }
    }

    // Known struct
    if ctx.env.types.structs.contains_key(name) {
        match ctx.env.types.structs.get(name) {
            some(def) => {
                if type_args.len() > 0 && type_args.len() != def.type_params.len() {
                    let _ = type_error(ctx.sink, E0301,
                        "Type '${name}' expects ${def.type_params.len().to_str()} type argument(s), got ${type_args.len().to_str()}",
                        span, DiagnosticContext::TypeMismatch {
                            expected: "${def.type_params.len().to_str()} type args",
                            actual: "${type_args.len().to_str()} type args",
                            expression: none
                        })
                }
                var resolved_params: List<Type> = []
                if type_args.len() > 0 {
                    for a in type_args { resolved_params.push(resolve_type_expr(ctx, a)) }
                } else {
                    for _ in def.type_params { resolved_params.push(ctx.env.fresh_var()) }
                }
                return Type::StructType {
                    name: name,
                    type_params: resolved_params,
                    fields: def.fields
                }
            },
            none => {}
        }
    }

    // Known enum
    if ctx.env.types.enums.contains_key(name) {
        match ctx.env.types.enums.get(name) {
            some(def) => {
                if type_args.len() > 0 && type_args.len() != def.type_params.len() {
                    let _ = type_error(ctx.sink, E0301,
                        "Type '${name}' expects ${def.type_params.len().to_str()} type argument(s), got ${type_args.len().to_str()}",
                        span, DiagnosticContext::TypeMismatch {
                            expected: "${def.type_params.len().to_str()} type args",
                            actual: "${type_args.len().to_str()} type args",
                            expression: none
                        })
                }
                var resolved_params: List<Type> = []
                if type_args.len() > 0 {
                    for a in type_args { resolved_params.push(resolve_type_expr(ctx, a)) }
                } else {
                    for _ in def.type_params { resolved_params.push(ctx.env.fresh_var()) }
                }
                return Type::EnumType {
                    name: name,
                    type_params: resolved_params,
                    variants: def.variants
                }
            },
            none => {}
        }
    }

    // Type alias
    match ctx.env.types.type_aliases.get(name) {
        some(alias) => {
            if type_args.len() > 0 && type_args.len() != alias.type_params.len() {
                let _ = type_error(ctx.sink, E0301,
                    "Type '${name}' expects ${alias.type_params.len().to_str()} type argument(s), got ${type_args.len().to_str()}",
                    span, DiagnosticContext::TypeMismatch {
                        expected: "${alias.type_params.len().to_str()} type args",
                        actual: "${type_args.len().to_str()} type args",
                        expression: none
                    })
            }
            if alias.type_param_vars.len() == 0 { return alias.ty }
            var resolved_args: List<Type> = []
            for a in type_args { resolved_args.push(resolve_type_expr(ctx, a)) }
            let mapping: Map<Int, Type> = map_new()
            var i = 0
            let limit = if alias.type_param_vars.len() < resolved_args.len() { alias.type_param_vars.len() } else { resolved_args.len() }
            while i < limit {
                match (alias.type_param_vars.get(i), resolved_args.get(i)) {
                    (some(var_id), some(arg)) => { mapping.insert(var_id, arg) },
                    _ => {}
                }
                i = i + 1
            }
            return apply_subst(mapping, alias.ty)
        },
        none => {}
    }

    type_error(ctx.sink, E0204, "Unknown type: ${name}", span,
        DiagnosticContext::OtherContext { detail: some("unknown type '${name}'") })
}

// ============================================================
// Pattern binding
// ============================================================

pub fn bind_pattern(ctx: InferCtx, pattern: Pattern, expected_type: Type, subst: Map<Int, Type>) {
    match pattern {
        Pattern::Wildcard { .. } => {},
        Pattern::Binding { name, span } => {
            ctx.env.bind_mono(name, apply_subst(subst, expected_type))
            match ctx.env.lookup(name) {
                some(scheme) => match scheme.def_id {
                    some(did) => ctx.env.record_def_span(did, span),
                    none => {}
                },
                none => {}
            }
        },
        Pattern::Constructor { name, qualifier, fields, span } =>
            bind_constructor_pattern(ctx, name, qualifier, fields, expected_type, subst, span),
        Pattern::Literal { .. } => {},
        Pattern::NamedConstructor { name, qualifier, fields, span, .. } =>
            bind_named_constructor_pattern(ctx, name, qualifier, fields, expected_type, subst, span),
        Pattern::TuplePattern { elements, span } => {
            let resolved = apply_subst(subst, expected_type)
            match resolved {
                Type::TupleType { elements: type_elems } => {
                    if elements.len() != type_elems.len() {
                        let _ = type_error(ctx.sink, E0301,
                            "Tuple pattern has ${elements.len().to_str()} elements but type has ${type_elems.len().to_str()}",
                            span, DiagnosticContext::OtherContext { detail: some("tuple arity mismatch") })
                    }
                    var i = 0
                    while i < elements.len() {
                        match (elements.get(i), type_elems.get(i)) {
                            (some(pat), some(ty)) => bind_pattern(ctx, pat, ty, subst),
                            _ => {}
                        }
                        i = i + 1
                    }
                },
                _ => { let _ = type_error(ctx.sink, E0301,
                    "Tuple pattern requires tuple type, got ${type_to_string(resolved)}",
                    span, DiagnosticContext::TypeMismatch { expected: "tuple", actual: type_to_string(resolved), expression: none }) }
            }
        }
    }
}

fn bind_constructor_pattern(
    ctx: InferCtx, name: Str, qualifier: Str?, fields: List<Pattern>,
    expected_type: Type, subst: Map<Int, Type>, span: Span
) {
    let enum_name = resolve_pattern_enum(ctx, name, qualifier, span)
    match enum_name {
        some(ename) => match ctx.env.types.enums.get(ename) {
            some(enum_def) => {
                let variant = enum_def.variants.find(fn(v) { v.name == name })
                match variant {
                    some(v) => {
                        let resolved_expected = apply_subst(subst, expected_type)
                        match resolved_expected {
                            Type::EnumType { name: rname, .. } => {
                                if rname != ename {
                                    let _ = type_error(ctx.sink, E0301,
                                        "variant '${name}' belongs to enum '${ename}', not '${rname}'",
                                        span, DiagnosticContext::TypeMismatch { expected: rname, actual: ename, expression: none })
                                }
                            },
                            Type::TypeVar { .. } => {},
                            _ => { let _ = type_error(ctx.sink, E0301,
                                "cannot destructure type '${type_to_string(resolved_expected)}' with constructor pattern '${name}'",
                                span, DiagnosticContext::PatternError { detail: "constructor pattern on non-enum type" }) }
                        }
                        let inst_map = build_instantiation_map(enum_def.type_param_vars, resolved_expected)
                        var i = 0
                        while i < fields.len() && i < v.fields.len() {
                            match (fields.get(i), v.fields.get(i)) {
                                (some(fpat), some(ftype)) => {
                                    let field_type = if inst_map.len() > 0 { apply_subst(inst_map, ftype) } else { ftype }
                                    bind_pattern(ctx, fpat, field_type, subst)
                                },
                                _ => {}
                            }
                            i = i + 1
                        }
                    },
                    none => {}
                }
            },
            none => {}
        },
        none => {}
    }
}

fn bind_named_constructor_pattern(
    ctx: InferCtx, name: Str, qualifier: Str?, fields: List<NamedPatternField>,
    expected_type: Type, subst: Map<Int, Type>, span: Span
) {
    let enum_name = resolve_pattern_enum(ctx, name, qualifier, span)
    match enum_name {
        some(ename) => match ctx.env.types.enums.get(ename) {
            some(enum_def) => {
                let variant = enum_def.variants.find(fn(v) { v.name == name })
                match variant {
                    some(v) => match v.field_names {
                        some(vfield_names) => {
                            let resolved_expected = apply_subst(subst, expected_type)
                            match resolved_expected {
                                Type::EnumType { name: rname, .. } => {
                                    if rname != ename {
                                        let _ = type_error(ctx.sink, E0301,
                                            "variant '${name}' belongs to enum '${ename}', not '${rname}'",
                                            span, DiagnosticContext::TypeMismatch { expected: rname, actual: ename, expression: none })
                                    }
                                },
                                _ => {}
                            }
                            let inst_map = build_instantiation_map(enum_def.type_param_vars, resolved_expected)
                            for field in fields {
                                let field_idx = vfield_names.index_of(field.name)
                                match field_idx {
                                    some(idx) => match v.fields.get(idx) {
                                        some(ftype) => {
                                            let field_type = if inst_map.len() > 0 { apply_subst(inst_map, ftype) } else { ftype }
                                            bind_pattern(ctx, field.pattern, field_type, subst)
                                        },
                                        none => {}
                                    },
                                    none => { let _ = type_error(ctx.sink, E0301,
                                        "variant '${name}' has no field '${field.name}'",
                                        field.span, DiagnosticContext::OtherContext { detail: some("unknown field '${field.name}'") }) }
                                }
                            }
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
}

fn resolve_pattern_enum(ctx: InferCtx, variant_name: Str, qualifier: Str?, span: Span) -> Str? {
    match qualifier {
        some(q) => match ctx.env.types.enums.get(q) {
            some(enum_def) => {
                if enum_def.variants.any(fn(v) { v.name == variant_name }) {
                    some(q)
                } else {
                    type_error(ctx.sink, E0201,
                        "'${q}' has no variant '${variant_name}'",
                        span, DiagnosticContext::UndefinedVariable { name: variant_name, scope_locals: none })
                    none
                }
            },
            none => {
                type_error(ctx.sink, E0201,
                    "'${q}' has no variant '${variant_name}'",
                    span, DiagnosticContext::UndefinedVariable { name: variant_name, scope_locals: none })
                none
            }
        },
        none => ctx.env.types.variant_to_enum.get(variant_name)
    }
}

fn build_instantiation_map(type_param_vars: List<Int>, resolved_expected: Type) -> Map<Int, Type> {
    let inst_map: Map<Int, Type> = map_new()
    match resolved_expected {
        Type::EnumType { type_params, .. } => {
            var i = 0
            while i < type_param_vars.len() && i < type_params.len() {
                match (type_param_vars.get(i), type_params.get(i)) {
                    (some(var_id), some(tp)) => { inst_map.insert(var_id, tp) },
                    _ => {}
                }
                i = i + 1
            }
        },
        _ => {}
    }
    inst_map
}

// ============================================================
// Effect removal helpers
// ============================================================

pub fn remove_fail_effect(row: EffectRow) -> EffectRow {
    let filtered = row.effects.filter(fn(e) {
        match e { Effect::FailEffect { .. } => false, _ => true }
    })
    EffectRow { effects: filtered, tail: row.tail }
}

pub fn remove_specific_fail_effect(row: EffectRow, target: Type, subst: Map<Int, Type>) -> EffectRow {
    let resolved_target = apply_subst(subst, target)
    let filtered = row.effects.filter(fn(e) {
        match e {
            Effect::FailEffect { error_type } =>
                !types_equal(apply_subst(subst, error_type), resolved_target),
            _ => true
        }
    })
    EffectRow { effects: filtered, tail: row.tail }
}
