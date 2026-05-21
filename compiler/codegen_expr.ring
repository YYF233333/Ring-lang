use types::{Type, Effect, EffectRow, type_to_builtin_name}
use ast::{Pattern, BinOp, UnaryOp}
use hir::{HExpr, HStmt, HMatchArm, HParam, HStructFieldInit,
    HStringInterpPart, HEffectHandler,
    evidence_param_name, trait_dict_name,
    ENUM_TAG_FIELD, OPTION_SOME_TAG, OPTION_NONE_TAG, OPTION_PAYLOAD_FIELD,
    RUNTIME_EFFECT_ABORT, RUNTIME_MATCH_FAIL,
    BUILTIN_LIST, BUILTIN_MAP, BUILTIN_SET, BUILTIN_OPTION,
    hexpr_type}
use codegen_ctx::{CodegenCtx, emit, emit_raw, push_indent, pop_indent,
    qualify, safe_ident, get_evidence_params, LIST_HOF_JS_METHOD}
use codegen_stmt::{gen_pattern_condition, gen_pattern_bindings,
    emit_block_body, emit_block_in_stmt_context}

// ============================================================
// Main expression dispatch
// ============================================================

pub fn gen_expr(var ctx: CodegenCtx, expr: HExpr) -> Str {
    match expr {
        HExpr::IntLit { value, .. } => value.to_str(),
        HExpr::FloatLit { value, .. } => value.to_str(),
        HExpr::StrLit { value, .. } => json_stringify(value),
        HExpr::BoolLit { value, .. } => if value { "true" } else { "false" },
        HExpr::Ident { name, resolved_name, ty, dict_closure_dicts, .. } => {
            let qname = match resolved_name {
                some(rn) => qualify(ctx, rn),
                none => qualify(ctx, name),
            }
            match dict_closure_dicts {
                some(dicts) => {
                    if dicts.len() > 0 {
                        match ty {
                            Type::FnType { params, effects, .. } => {
                                var p_names: List<Str> = [""]; p_names.clear()
                                for i in 0..params.len() { p_names.push("__ring_a${i}") }
                                let dict_args = dicts.join(", ")
                                let ev_args = get_callee_evidence_args(ctx, ty, none)
                                var all_call: List<Str> = [""]; all_call.clear()
                                all_call.extend(p_names)
                                all_call.push(dict_args)
                                if ev_args.len() > 0 { all_call.push(ev_args) }
                                let call_str = all_call.join(", ")
                                let params_str = p_names.join(", ")
                                "((${params_str}) => ${qname}(${call_str}))"
                            },
                            _ => qname,
                        }
                    } else {
                        qname
                    }
                },
                none => qname,
            }
        },
        HExpr::BinOp { op, left, right, eq_dispatch, ord_dispatch, ty, .. } =>
            gen_binop(ctx, op, left, right, eq_dispatch, ord_dispatch),
        HExpr::UnaryOp { op, operand, .. } => {
            let o = gen_expr(ctx, operand)
            let op_str = match op { UnaryOp::Neg => "-", UnaryOp::Not => "!" }
            "(${op_str}${o})"
        },
        HExpr::Call { callee, args, type_args, resolved_dicts, dict_dispatch, .. } =>
            gen_call(ctx, callee, args, resolved_dicts, dict_dispatch),
        HExpr::FieldAccess { receiver, field, .. } => {
            let r = gen_expr(ctx, receiver)
            if is_tuple_field(field) {
                "${r}[${field}]"
            } else {
                "${r}.${field}"
            }
        },
        HExpr::StructLit { name, fields, spread, .. } =>
            gen_struct_lit(ctx, name, fields, spread),
        HExpr::NamedVariantConstruct { enum_name, variant_name, fields, spread, ty, .. } =>
            gen_named_variant_construct(ctx, enum_name, variant_name, fields, spread, ty),
        HExpr::MatchExpr { scrutinee, arms, .. } =>
            gen_match(ctx, scrutinee, arms),
        HExpr::Block { stmts, tail, .. } =>
            gen_block_expr(ctx, stmts, tail, expr),
        HExpr::IfExpr { condition, then_branch, else_branch, .. } =>
            gen_if(ctx, condition, then_branch, else_branch),
        HExpr::StringInterp { parts, .. } =>
            gen_string_interp(ctx, parts),
        HExpr::TryCatch { body, arms, .. } =>
            gen_try_catch(ctx, body, arms),
        HExpr::HandleExpr { body, handlers, .. } =>
            gen_handle(ctx, body, handlers),
        HExpr::Lambda { params, body, ty, .. } =>
            gen_lambda(ctx, params, body, ty),
        HExpr::EffectOp { effect_name, op_name, args, .. } => {
            let ev_name = evidence_param_name(effect_name)
            var arg_strs: List<Str> = [""]; arg_strs.clear()
            for a in args { arg_strs.push(gen_expr(ctx, a)) }
            let joined = arg_strs.join(", ")
            "${ev_name}.${op_name}(${joined})"
        },
        HExpr::OptionUnwrap { expr: inner, .. } =>
            gen_option_unwrap(ctx, inner),
        HExpr::TryBlock { body, .. } =>
            gen_try_block(ctx, body),
        HExpr::OptionOr { expr: inner, default_value, .. } => {
            let e = gen_expr(ctx, inner)
            let d = gen_expr(ctx, default_value)
            let tag_f = ENUM_TAG_FIELD()
            let some_t = OPTION_SOME_TAG()
            let pay_f = OPTION_PAYLOAD_FIELD()
            var p: List<Str> = [""]; p.clear()
            p.push("((v) => v.")
            p.push(tag_f)
            p.push(" === \"")
            p.push(some_t)
            p.push("\" ? v.")
            p.push(pay_f)
            p.push(" : ")
            p.push(d)
            p.push(")(")
            p.push(e)
            p.push(")")
            p.join("")
        },
        HExpr::RangeExpr { start, end, .. } => {
            let s = gen_expr(ctx, start)
            let e = gen_expr(ctx, end)
            "{ start: ${s}, end: ${e} }"
        },
        HExpr::ListLit { elements, .. } => {
            var elems: List<Str> = [""]; elems.clear()
            for e in elements { elems.push(gen_expr(ctx, e)) }
            let joined = elems.join(", ")
            "[${joined}]"
        },
        HExpr::TupleLit { elements, .. } => {
            var elems: List<Str> = [""]; elems.clear()
            for e in elements { elems.push(gen_expr(ctx, e)) }
            let joined = elems.join(", ")
            "[${joined}]"
        },
    }
}

// ============================================================
// BinOp — eq/ord dispatch extracted before fallback
// ============================================================

fn gen_binop(var ctx: CodegenCtx, op: BinOp, left: HExpr, right: HExpr, eq_dispatch: TraitDispatch?, ord_dispatch: TraitDispatch?) -> Str {
    // Check eq dispatch: unwrap option, check op, early return
    var eq_result = try_eq_dispatch(ctx, op, left, right, eq_dispatch)
    if eq_result.len() > 0 { return eq_result }
    // Check ord dispatch: unwrap option, check op, early return
    var ord_result = try_ord_dispatch(ctx, op, left, right, ord_dispatch)
    if ord_result.len() > 0 { return ord_result }
    // Fallback: plain JS operator
    let js_op = match op {
        BinOp::Eq => "===",
        BinOp::Neq => "!==",
        _ => binop_str(op),
    }
    let l = gen_expr(ctx, left)
    let r = gen_expr(ctx, right)
    "(${l} ${js_op} ${r})"
}

fn try_eq_dispatch(var ctx: CodegenCtx, op: BinOp, left: HExpr, right: HExpr, eq_dispatch: TraitDispatch?) -> Str {
    match eq_dispatch {
        some(dispatch) => {
            let is_eq_op = (op == BinOp::Eq) || (op == BinOp::Neq)
            if is_eq_op {
                return gen_eq_dispatch(ctx, op, left, right, dispatch)
            }
        },
        none => {},
    }
    ""
}

fn try_ord_dispatch(var ctx: CodegenCtx, op: BinOp, left: HExpr, right: HExpr, ord_dispatch: TraitDispatch?) -> Str {
    match ord_dispatch {
        some(dispatch) => {
            let is_ord_op = (op == BinOp::Lt) || (op == BinOp::Gt) || (op == BinOp::Lte) || (op == BinOp::Gte)
            if is_ord_op {
                return gen_ord_dispatch(ctx, op, left, right, dispatch)
            }
        },
        none => {},
    }
    ""
}

fn binop_str(op: BinOp) -> Str {
    match op {
        BinOp::Add => "+", BinOp::Sub => "-", BinOp::Mul => "*", BinOp::Div => "/", BinOp::Mod => "%",
        BinOp::Eq => "===", BinOp::Neq => "!==",
        BinOp::Lt => "<", BinOp::Lte => "<=", BinOp::Gt => ">", BinOp::Gte => ">=",
        BinOp::And => "&&", BinOp::Or => "||",
    }
}

fn is_tuple_field(s: Str) -> Bool {
    if s.len() == 0 { return false }
    match s.char_at(0) {
        some(c) => c == "0" || c == "1" || c == "2" || c == "3" || c == "4" ||
                   c == "5" || c == "6" || c == "7" || c == "8" || c == "9",
        none => false
    }
}

// ============================================================
// Eq / Ord dispatch
// ============================================================

fn gen_eq_dispatch(var ctx: CodegenCtx, op: BinOp, left: HExpr, right: HExpr, dispatch: TraitDispatch) -> Str {
    let l = gen_expr(ctx, left)
    let r = gen_expr(ctx, right)
    let is_ne = op == BinOp::Neq

    match dispatch {
        TraitDispatch::Builtin => if is_ne { "(${l} !== ${r})" } else { "(${l} === ${r})" },
        TraitDispatch::Direct { dict, extra_dicts } => {
            let d = qualify(ctx, dict)
            let extra = extra_dicts_str(extra_dicts)
            let eq_call = "${d}.eq(${l}, ${r}${extra})"
            if is_ne { "(!${eq_call})" } else { eq_call }
        },
        TraitDispatch::Dict { param } => {
            let eq_call = "${param}.eq(${l}, ${r})"
            if is_ne { "(!${eq_call})" } else { eq_call }
        },
    }
}

fn gen_ord_dispatch(var ctx: CodegenCtx, op: BinOp, left: HExpr, right: HExpr, dispatch: TraitDispatch) -> Str {
    let l = gen_expr(ctx, left)
    let r = gen_expr(ctx, right)

    match dispatch {
        TraitDispatch::Builtin => {
            let op_str = binop_str(op)
            "(${l} ${op_str} ${r})"
        },
        TraitDispatch::Direct { dict, extra_dicts } => {
            let d = qualify(ctx, dict)
            let extra = extra_dicts_str(extra_dicts)
            let cmp_call = "${d}.cmp(${l}, ${r}${extra})"
            match op {
                BinOp::Lt => "(${cmp_call} < 0)",
                BinOp::Lte => "(${cmp_call} <= 0)",
                BinOp::Gt => "(${cmp_call} > 0)",
                BinOp::Gte => "(${cmp_call} >= 0)",
                _ => "(${l} ${binop_str(op)} ${r})",
            }
        },
        TraitDispatch::Dict { param } => {
            let cmp_call = "${param}.cmp(${l}, ${r})"
            match op {
                BinOp::Lt => "(${cmp_call} < 0)",
                BinOp::Lte => "(${cmp_call} <= 0)",
                BinOp::Gt => "(${cmp_call} > 0)",
                BinOp::Gte => "(${cmp_call} >= 0)",
                _ => "(${l} ${binop_str(op)} ${r})",
            }
        },
    }
}

fn extra_dicts_str(dicts: List<Str>) -> Str {
    if dicts.len() > 0 {
        let joined = dicts.join(", ")
        ", ${joined}"
    } else { "" }
}

// ============================================================
// Call expression
// ============================================================

fn get_callee_evidence_args(ctx: CodegenCtx, callee_type: Type, callee_name: Str?) -> Str {
    match callee_type {
        Type::FnType { effects, .. } => {
            if effects.effects.len() > 0 {
                return get_evidence_params(effects).join(", ")
            }
        },
        _ => {},
    }
    match callee_name {
        some(cn) => {
            match ctx.local_fn_effects.get(cn) {
                some(actual_effects) => {
                    if actual_effects.effects.len() > 0 {
                        var caller_effect_names = set_new()
                        match ctx.current_fn_effects {
                            some(cfe) => {
                                for e in cfe.effects {
                                    caller_effect_names.insert(callee_eff_name(e))
                                }
                            },
                            none => {},
                        }
                        if ctx.in_try_fail { caller_effect_names.insert("fail") }
                        var needed: List<Effect> = [Effect::IoEffect]; needed.clear()
                        for e in actual_effects.effects {
                            if caller_effect_names.contains(callee_eff_name(e)) {
                                needed.push(e)
                            }
                        }
                        if needed.len() > 0 {
                            return get_evidence_params(EffectRow { effects: needed, tail: none }).join(", ")
                        }
                    }
                },
                none => {},
            }
        },
        none => {},
    }
    ""
}

fn callee_eff_name(e: Effect) -> Str {
    match e {
        Effect::IoEffect => "io",
        Effect::FailEffect { .. } => "fail",
        Effect::MutEffect => "mut",
        Effect::CustomEffect { name, .. } => name,
    }
}

fn gen_call(var ctx: CodegenCtx, callee: HExpr, args: List<HExpr>, resolved_dicts: List<Str>, dict_dispatch: DictDispatchInfo?) -> Str {
    match dict_dispatch {
        some(dd) => {
            let receiver_arg = match callee {
                HExpr::FieldAccess { receiver, .. } => gen_expr(ctx, receiver),
                _ => {
                    match args.get(0) {
                        some(a) => gen_expr(ctx, a),
                        none => gen_expr(ctx, callee),
                    }
                },
            }
            var other_args: List<Str> = [""]; other_args.clear()
            for a in args { other_args.push(gen_expr(ctx, a)) }
            var all: List<Str> = [""]; all.clear()
            all.push(receiver_arg)
            all.extend(other_args)
            let all_str = all.join(", ")
            let meth = safe_ident(dd.method)
            return "${dd.dict_param}.${meth}(${all_str})"
        },
        none => {},
    }

    // UFCS method call detection
    match callee {
        HExpr::FieldAccess { receiver, field, ty: callee_type, .. } => {
            let recv_type = hexpr_type(receiver)
            let method = field

            // Inline List HOF
            match recv_type {
                Type::StructType { name, .. } => {
                    if name == BUILTIN_LIST() {
                        match LIST_HOF_JS_METHOD(method) {
                            some(js_method) => {
                                let r = gen_expr(ctx, receiver)
                                let cb = gen_lambda_capture_evidence(ctx, args, 0)
                                return "${r}.${js_method}(${cb})"
                            },
                            none => {},
                        }
                        if method == "fold" {
                            let r = gen_expr(ctx, receiver)
                            let init = match args.get(0) { some(a) => gen_expr(ctx, a), none => "undefined" }
                            let cb = gen_lambda_capture_evidence(ctx, args, 1)
                            return "${r}.reduce(${cb}, ${init})"
                        }
                        if method == "find" {
                            let r = gen_expr(ctx, receiver)
                            let cb = gen_lambda_capture_evidence(ctx, args, 0)
                            return gen_find_expr(r, cb)
                        }
                        if method == "find_index" {
                            let r = gen_expr(ctx, receiver)
                            let cb = gen_lambda_capture_evidence(ctx, args, 0)
                            return gen_find_index_expr(r, cb)
                        }
                        if method == "sort_by" {
                            let r = gen_expr(ctx, receiver)
                            let cb = gen_lambda_capture_evidence(ctx, args, 0)
                            return "${r}.sort(${cb})"
                        }
                    }
                    if name == BUILTIN_MAP() {
                        if method == "map_values" {
                            let r = gen_expr(ctx, receiver)
                            let cb = gen_lambda_capture_evidence(ctx, args, 0)
                            return "((__m, __f) => { const __r = new Map(); for (const [__k, __v] of __m) __r.set(__k, __f(__v)); return __r; })(${r}, ${cb})"
                        }
                        if method == "filter" {
                            let r = gen_expr(ctx, receiver)
                            let cb = gen_lambda_capture_evidence(ctx, args, 0)
                            return "((__m, __f) => { const __r = new Map(); for (const [__k, __v] of __m) if (__f(__k, __v)) __r.set(__k, __v); return __r; })(${r}, ${cb})"
                        }
                        if method == "fold" {
                            let r = gen_expr(ctx, receiver)
                            let init = match args.get(0) { some(a) => gen_expr(ctx, a), none => "undefined" }
                            let cb = gen_lambda_capture_evidence(ctx, args, 1)
                            return "((__m, __a, __f) => { for (const [__k, __v] of __m) __a = __f(__a, __k, __v); return __a; })(${r}, ${init}, ${cb})"
                        }
                        if method == "any" {
                            let r = gen_expr(ctx, receiver)
                            let cb = gen_lambda_capture_evidence(ctx, args, 0)
                            return "((__m, __f) => { for (const [__k, __v] of __m) if (__f(__k, __v)) return true; return false; })(${r}, ${cb})"
                        }
                    }
                    if name == BUILTIN_SET() {
                        if method == "filter" {
                            let r = gen_expr(ctx, receiver)
                            let cb = gen_lambda_capture_evidence(ctx, args, 0)
                            return "((__s, __f) => { const __r = new Set(); for (const __x of __s) if (__f(__x)) __r.add(__x); return __r; })(${r}, ${cb})"
                        }
                        if method == "fold" {
                            let r = gen_expr(ctx, receiver)
                            let init = match args.get(0) { some(a) => gen_expr(ctx, a), none => "undefined" }
                            let cb = gen_lambda_capture_evidence(ctx, args, 1)
                            return "((__s, __a, __f) => { for (const __x of __s) __a = __f(__a, __x); return __a; })(${r}, ${init}, ${cb})"
                        }
                        if method == "any" {
                            let r = gen_expr(ctx, receiver)
                            let cb = gen_lambda_capture_evidence(ctx, args, 0)
                            return "((__s, __f) => { for (const __x of __s) if (__f(__x)) return true; return false; })(${r}, ${cb})"
                        }
                        if method == "all" {
                            let r = gen_expr(ctx, receiver)
                            let cb = gen_lambda_capture_evidence(ctx, args, 0)
                            return "((__s, __f) => { for (const __x of __s) if (!__f(__x)) return false; return true; })(${r}, ${cb})"
                        }
                    }
                },
                Type::EnumType { name, .. } => {
                    if name == BUILTIN_OPTION() {
                        if method == "map" {
                            let r = gen_expr(ctx, receiver)
                            let cb = gen_lambda_capture_evidence(ctx, args, 0)
                            return gen_option_map_expr(r, cb)
                        }
                        if method == "and_then" {
                            let r = gen_expr(ctx, receiver)
                            let cb = gen_lambda_capture_evidence(ctx, args, 0)
                            return gen_option_and_then_expr(r, cb)
                        }
                    }
                },
                _ => {},
            }

            // UFCS impl method dispatch
            let type_name = type_to_builtin_name(recv_type)
            match type_name {
                some(tn) => {
                    let impl_key = "${qualify(ctx, tn)}.${method}"
                    match ctx.impl_methods.get(impl_key) {
                        some(trait_opt) => {
                            let fn_name = match trait_opt {
                                some(trait_name) => {
                                    let dict = trait_dict_name(qualify(ctx, tn), safe_ident(trait_name))
                                    "${dict}_${safe_ident(method)}"
                                },
                                none => "${qualify(ctx, tn)}_${safe_ident(method)}",
                            }
                            let r = gen_expr(ctx, receiver)
                            var arg_strs: List<Str> = [""]; arg_strs.clear()
                            for a in args { arg_strs.push(gen_expr(ctx, a)) }
                            let all_args = if arg_strs.len() > 0 {
                                let joined = arg_strs.join(", ")
                                "${r}, ${joined}"
                            } else { r }
                            var dict_parts: List<Str> = [""]; dict_parts.clear()
                            for d in resolved_dicts { dict_parts.push(qualify(ctx, d)) }
                            let dict_str = dict_parts.join(", ")
                            let ev_args = get_callee_evidence_args(ctx, callee_type, none)
                            var parts: List<Str> = [""]; parts.clear()
                            parts.push(all_args)
                            if dict_str.len() > 0 { parts.push(dict_str) }
                            if ev_args.len() > 0 { parts.push(ev_args) }
                            let final_args = parts.join(", ")
                            return "${fn_name}(${final_args})"
                        },
                        none => {},
                    }
                },
                none => {},
            }
        },
        _ => {},
    }

    // Regular call with dict args + evidence
    let callee_str = gen_expr(ctx, callee)
    let cn = match callee {
        HExpr::Ident { name, .. } => some(name),
        _ => none,
    }
    var arg_strs: List<Str> = [""]; arg_strs.clear()
    for a in args { arg_strs.push(gen_expr(ctx, a)) }
    let args_str = arg_strs.join(", ")
    var dict_parts: List<Str> = [""]; dict_parts.clear()
    for d in resolved_dicts { dict_parts.push(qualify(ctx, d)) }
    let dict_str = dict_parts.join(", ")
    let ev_args = get_callee_evidence_args(ctx, hexpr_type(callee), cn)
    var all_parts: List<Str> = [""]; all_parts.clear()
    if args_str.len() > 0 { all_parts.push(args_str) }
    if dict_str.len() > 0 { all_parts.push(dict_str) }
    if ev_args.len() > 0 { all_parts.push(ev_args) }
    let all_str = all_parts.join(", ")
    "${callee_str}(${all_str})"
}

// Helper: generate find expression with option wrapping
fn gen_find_expr(receiver: Str, cb: Str) -> Str {
    var p: List<Str> = [""]; p.clear()
    p.push("((__a) => { const __i = __a.findIndex(")
    p.push(cb)
    p.push("); return __i >= 0 ? { _tag: \"some\", _0: __a[__i] } : { _tag: \"none\" }; })(")
    p.push(receiver)
    p.push(")")
    p.join("")
}

// Helper: generate find_index expression with option wrapping
fn gen_find_index_expr(receiver: Str, cb: Str) -> Str {
    var p: List<Str> = [""]; p.clear()
    p.push("((__a) => { const __i = __a.findIndex(")
    p.push(cb)
    p.push("); return __i >= 0 ? { _tag: \"some\", _0: __i } : { _tag: \"none\" }; })(")
    p.push(receiver)
    p.push(")")
    p.join("")
}

// Helper: Option.map codegen
fn gen_option_map_expr(receiver: Str, cb: Str) -> Str {
    var p: List<Str> = [""]; p.clear()
    p.push("((__o, __f) => __o._tag === \"some\" ? { _tag: \"some\", _0: __f(__o._0) } : __o)(")
    p.push(receiver)
    p.push(", ")
    p.push(cb)
    p.push(")")
    p.join("")
}

// Helper: Option.and_then codegen
fn gen_option_and_then_expr(receiver: Str, cb: Str) -> Str {
    var p: List<Str> = [""]; p.clear()
    p.push("((__o, __f) => __o._tag === \"some\" ? __f(__o._0) : __o)(")
    p.push(receiver)
    p.push(", ")
    p.push(cb)
    p.push(")")
    p.join("")
}

// ============================================================
// Struct literal
// ============================================================

fn gen_struct_lit(var ctx: CodegenCtx, name: Str, fields: List<HStructFieldInit>, spread: HExpr?) -> Str {
    let qname = qualify(ctx, name)
    match ctx.struct_field_order.get(qname) {
        some(declared_order) => {
            var field_map: Map<Str, HExpr> = map_new()
            for f in fields { field_map.insert(f.name, f.value) }
            match spread {
                some(sp) => gen_spread_struct(ctx, sp, qname, declared_order, field_map, true),
                none => {
                    var args: List<Str> = [""]; args.clear()
                    for fn_ in declared_order {
                        match field_map.get(fn_) {
                            some(v) => args.push(gen_expr(ctx, v)),
                            none => args.push("undefined"),
                        }
                    }
                    let joined = args.join(", ")
                    "new ${qname}(${joined})"
                },
            }
        },
        none => {
            match spread {
                some(sp) => {
                    var field_map: Map<Str, HExpr> = map_new()
                    for f in fields { field_map.insert(f.name, f.value) }
                    var order: List<Str> = [""]; order.clear()
                    for f in fields { order.push(f.name) }
                    gen_spread_struct(ctx, sp, qname, order, field_map, true)
                },
                none => {
                    var args: List<Str> = [""]; args.clear()
                    for f in fields { args.push(gen_expr(ctx, f.value)) }
                    let joined = args.join(", ")
                    "new ${qname}(${joined})"
                },
            }
        },
    }
}

fn gen_spread_struct(var ctx: CodegenCtx, spread: HExpr, ctor_name: Str, field_order: List<Str>, field_map: Map<Str, HExpr>, use_new: Bool) -> Str {
    let is_simple = match spread {
        HExpr::Ident { .. } => true,
        HExpr::FieldAccess { .. } => true,
        _ => false,
    }
    if is_simple {
        let base = gen_expr(ctx, spread)
        var args: List<Str> = [""]; args.clear()
        for fn_ in field_order {
            match field_map.get(fn_) {
                some(v) => args.push(gen_expr(ctx, v)),
                none => {
                    let sf = safe_ident(fn_)
                    args.push("${base}.${sf}")
                },
            }
        }
        let joined = args.join(", ")
        if use_new { "new ${ctor_name}(${joined})" } else { "${ctor_name}(${joined})" }
    } else {
        var args: List<Str> = [""]; args.clear()
        for fn_ in field_order {
            match field_map.get(fn_) {
                some(v) => args.push(gen_expr(ctx, v)),
                none => {
                    let sf = safe_ident(fn_)
                    args.push("__su.${sf}")
                },
            }
        }
        let joined = args.join(", ")
        let sp_js = gen_expr(ctx, spread)
        let call = if use_new { "new ${ctor_name}(${joined})" } else { "${ctor_name}(${joined})" }
        "((__su) => ${call})(${sp_js})"
    }
}

// ============================================================
// Named variant construct
// ============================================================

fn gen_named_variant_construct(var ctx: CodegenCtx, enum_name: Str, variant_name: Str, fields: List<HStructFieldInit>, spread: HExpr?, ty: Type) -> Str {
    let js_name = "${qualify(ctx, enum_name)}_${variant_name}"
    var field_map: Map<Str, HExpr> = map_new()
    for f in fields { field_map.insert(f.name, f.value) }

    match ty {
        Type::EnumType { variants, .. } => {
            for v in variants {
                if v.name == variant_name {
                    match v.field_names {
                        some(fnames) => {
                            match spread {
                                some(sp) => { return gen_spread_struct(ctx, sp, js_name, fnames, field_map, false) },
                                none => {
                                    var args: List<Str> = [""]; args.clear()
                                    for n in fnames {
                                        match field_map.get(n) {
                                            some(v_) => args.push(gen_expr(ctx, v_)),
                                            none => args.push("undefined"),
                                        }
                                    }
                                    let joined = args.join(", ")
                                    return "${js_name}(${joined})"
                                },
                            }
                        },
                        none => {},
                    }
                }
            }
        },
        _ => {},
    }

    var args: List<Str> = [""]; args.clear()
    for f in fields { args.push(gen_expr(ctx, f.value)) }
    let joined = args.join(", ")
    "${js_name}(${joined})"
}

// ============================================================
// Match expression (expression-mode — IIFE)
// ============================================================

fn gen_match(var ctx: CodegenCtx, scrutinee: HExpr, arms: List<HMatchArm>) -> Str {
    let scrut = gen_expr(ctx, scrutinee)
    var parts: List<Str> = [""]; parts.clear()
    parts.push("(function() {")
    parts.push("  const __ring_m = ${scrut};")

    for arm in arms {
        let cond = gen_pattern_condition("__ring_m", arm.pattern)
        let bindings = gen_pattern_bindings("__ring_m", arm.pattern)
        let body = gen_expr(ctx, arm.body)
        match arm.guard {
            none => {
                if cond == "true" {
                    parts.push("  ${bindings}return ${body};")
                } else {
                    parts.push("  if (${cond}) { ${bindings}return ${body}; }")
                }
            },
            some(g) => {
                let guard_js = gen_expr(ctx, g)
                parts.push("  if (${cond}) { ${bindings}if (${guard_js}) { return ${body}; } }")
            },
        }
    }

    var has_catchall = false
    for a in arms {
        match a.pattern {
            Pattern::Wildcard { .. } => match a.guard { none => { has_catchall = true }, some(_) => {} },
            Pattern::Binding { .. } => match a.guard { none => { has_catchall = true }, some(_) => {} },
            _ => {},
        }
    }
    if has_catchall == false {
        let mf = RUNTIME_MATCH_FAIL()
        parts.push("  ${mf}(__ring_m);")
    }

    parts.push("})()")
    parts.join("\n")
}

// ============================================================
// Block expression (expression-mode — IIFE)
// ============================================================

fn gen_block_expr(var ctx: CodegenCtx, stmts: List<HStmt>, tail: HExpr?, block: HExpr) -> Str {
    match tail {
        some(t) => {
            if stmts.len() == 0 {
                return gen_expr(ctx, t)
            }
        },
        none => {},
    }
    let saved_lines = ctx.lines
    let saved_indent = ctx.indent_level
    ctx.lines = [""]; ctx.lines.clear()
    ctx.indent_level = 1
    emit_block_body(ctx, block)
    let body_lines = ctx.lines
    ctx.lines = saved_lines
    ctx.indent_level = saved_indent
    var result: List<Str> = [""]; result.clear()
    result.push("(function() {")
    result.extend(body_lines)
    result.push("})()")
    result.join("\n")
}

// ============================================================
// If expression (expression-mode — ternary)
// ============================================================

fn gen_if(var ctx: CodegenCtx, condition: HExpr, then_branch: HExpr, else_branch: HExpr?) -> Str {
    let cond = gen_expr(ctx, condition)
    let then_val = gen_block_as_value(ctx, then_branch)
    match else_branch {
        none => "(${cond} ? ${then_val} : undefined)",
        some(eb) => match eb {
            HExpr::IfExpr { condition: ec, then_branch: et, else_branch: ee, .. } => {
                let else_val = gen_if(ctx, ec, et, ee)
                "(${cond} ? ${then_val} : ${else_val})"
            },
            _ => {
                let else_val = gen_block_as_value(ctx, eb)
                "(${cond} ? ${then_val} : ${else_val})"
            },
        },
    }
}

fn gen_block_as_value(var ctx: CodegenCtx, block: HExpr) -> Str {
    match block {
        HExpr::Block { stmts, tail, .. } => {
            match tail {
                some(t) => {
                    if stmts.len() == 0 { return gen_expr(ctx, t) }
                },
                none => {},
            }
            gen_block_expr(ctx, stmts, tail, block)
        },
        _ => gen_expr(ctx, block),
    }
}

// ============================================================
// String interpolation
// ============================================================

fn escape_for_template_literal(s: Str) -> Str {
    var result: List<Str> = [""]; result.clear()
    var i = 0
    while i < s.len() {
        let ch = s.char_at(i).unwrap_or("")
        if ch == "\\" {
            result.push("\\\\")
        } else if ch == "`" {
            result.push("\\`")
        } else if ch == "\r" {
            result.push("\\r")
        } else if ch == "\$" {
            let next = if i + 1 < s.len() { s.char_at(i + 1).unwrap_or("") } else { "" }
            if next == "{" {
                result.push("\\\$")
            } else {
                result.push(ch)
            }
        } else {
            result.push(ch)
        }
        i = i + 1
    }
    result.join("")
}

fn gen_string_interp(var ctx: CodegenCtx, parts: List<HStringInterpPart>) -> Str {
    var result: List<Str> = [""]; result.clear()
    result.push("`")
    for p in parts {
        match p {
            HStringInterpPart::Literal(s) => {
                result.push(escape_for_template_literal(s))
            },
            HStringInterpPart::Expression(e) => {
                let expr_str = gen_expr(ctx, e)
                result.push("\${")
                result.push(expr_str)
                result.push("}")
            },
        }
    }
    result.push("`")
    result.join("")
}

// ============================================================
// OptionUnwrap helper
// ============================================================

fn gen_option_unwrap(var ctx: CodegenCtx, inner: HExpr) -> Str {
    let e = gen_expr(ctx, inner)
    let ev = evidence_param_name("fail")
    let tag_f = ENUM_TAG_FIELD()
    let some_t = OPTION_SOME_TAG()
    let pay_f = OPTION_PAYLOAD_FIELD()
    var p: List<Str> = [""]; p.clear()
    p.push("((v) => v.")
    p.push(tag_f)
    p.push(" === \"")
    p.push(some_t)
    p.push("\" ? v.")
    p.push(pay_f)
    p.push(" : ")
    p.push(ev)
    p.push(".raise(undefined))(")
    p.push(e)
    p.push(")")
    p.join("")
}

// ============================================================
// TryBlock helper
// ============================================================

fn gen_try_block(var ctx: CodegenCtx, body: HExpr) -> Str {
    let saved_in_try = ctx.in_try_fail
    ctx.in_try_fail = true
    let b = gen_expr(ctx, body)
    ctx.in_try_fail = saved_in_try
    let ev = evidence_param_name("fail")
    let tag = ENUM_TAG_FIELD()
    let stag = OPTION_SOME_TAG()
    let ntag = OPTION_NONE_TAG()
    let pf = OPTION_PAYLOAD_FIELD()
    let ea = RUNTIME_EFFECT_ABORT()
    let q = "\""
    var p: List<Str> = [""]; p.clear()
    p.push("(function() { const ")
    p.push(ev)
    p.push(" = { raise: (__ring_err) => { throw new ")
    p.push(ea)
    p.push("(")
    p.push(q)
    p.push("fail")
    p.push(q)
    p.push(", __ring_err); } }; try { return { ")
    p.push(tag)
    p.push(": ")
    p.push(q)
    p.push(stag)
    p.push(q)
    p.push(", ")
    p.push(pf)
    p.push(": ")
    p.push(b)
    p.push(" }; } catch (__ring_e) { if (__ring_e instanceof ")
    p.push(ea)
    p.push(" && __ring_e.effect === ")
    p.push(q)
    p.push("fail")
    p.push(q)
    p.push(") return { ")
    p.push(tag)
    p.push(": ")
    p.push(q)
    p.push(ntag)
    p.push(q)
    p.push(" }; throw __ring_e; } })()")
    p.join("")
}

// ============================================================
// Try/catch expression
// ============================================================

fn gen_catch_pattern_condition(ctx: CodegenCtx, target: Str, pat: Pattern) -> Str {
    // For catch arms, NamedConstructor patterns for structs need instanceof checks,
    // while enum variant patterns (Constructor/NamedConstructor) use _tag checks.
    match pat {
        Pattern::NamedConstructor { name, fields, .. } => {
            // Check if this is a struct (not an enum variant) by looking at struct_field_order
            if ctx.struct_field_order.contains_key(name) {
                let qualified_name = qualify(ctx, safe_ident(name))
                let inst_check = "${target} instanceof ${qualified_name}"
                var sub_conds: List<Str> = []
                for f in fields {
                    let sname = safe_ident(f.name)
                    let sub = gen_pattern_condition("${target}.${sname}", f.pattern)
                    if sub != "true" { sub_conds.push(sub) }
                }
                if sub_conds.len() == 0 { inst_check }
                else {
                    let joined = sub_conds.join(" && ")
                    "${inst_check} && ${joined}"
                }
            } else {
                // Enum variant — use _tag check (same as gen_pattern_condition)
                gen_pattern_condition(target, pat)
            }
        },
        _ => gen_pattern_condition(target, pat)
    }
}

fn gen_try_catch(var ctx: CodegenCtx, body: HExpr, arms: List<HMatchArm>) -> Str {
    let body_has_fail = has_fail_effect(body)
    let saved_in_try = ctx.in_try_fail
    if body_has_fail { ctx.in_try_fail = true }
    let body_js = gen_expr(ctx, body)
    ctx.in_try_fail = saved_in_try

    if body_has_fail == false { return body_js }

    let ev = evidence_param_name("fail")
    let ea = RUNTIME_EFFECT_ABORT()
    let q = "\""

    // Generate arm code
    var arm_js: List<Str> = []
    var has_catch_all = false
    for arm in arms {
        let cond = gen_catch_pattern_condition(ctx, "__ring_err", arm.pattern)
        let bindings = gen_pattern_bindings("__ring_err", arm.pattern)
        let arm_body_js = gen_expr(ctx, arm.body)

        // Check for guard
        var guard_js = ""
        match arm.guard {
            some(g) => { guard_js = " && (${gen_expr(ctx, g)})" },
            none => {}
        }

        // Check if catch-all
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

        arm_js.push("if (${cond}${guard_js}) { ${bindings}return ${arm_body_js}; }")
    }

    var p: List<Str> = []
    p.push("(function() { const ")
    p.push(ev)
    p.push(" = { raise: (__ring_err) => { throw new ")
    p.push(ea)
    p.push("(")
    p.push(q)
    p.push("fail")
    p.push(q)
    p.push(", __ring_err); } }; try { return ")
    p.push(body_js)
    p.push("; } catch (__ring_e) { if (__ring_e instanceof ")
    p.push(ea)
    p.push(" && __ring_e.effect === ")
    p.push(q)
    p.push("fail")
    p.push(q)
    p.push(") { const __ring_err = __ring_e.value; ")

    // Emit arm chain
    var first = true
    for aj in arm_js {
        if first { p.push(aj); first = false }
        else { p.push(" else ${aj}") }
    }

    // If no catch-all, re-throw
    if has_catch_all == false {
        if arm_js.len() > 0 {
            p.push(" else { throw __ring_e; }")
        } else {
            p.push("throw __ring_e;")
        }
    }

    p.push(" } throw __ring_e; } })()")
    p.join("")
}

fn has_fail_effect(expr: HExpr) -> Bool {
    match expr {
        HExpr::IntLit { effects, .. } => check_fail(effects),
        HExpr::FloatLit { effects, .. } => check_fail(effects),
        HExpr::StrLit { effects, .. } => check_fail(effects),
        HExpr::BoolLit { effects, .. } => check_fail(effects),
        HExpr::Ident { effects, .. } => check_fail(effects),
        HExpr::BinOp { effects, .. } => check_fail(effects),
        HExpr::UnaryOp { effects, .. } => check_fail(effects),
        HExpr::Call { effects, .. } => check_fail(effects),
        HExpr::FieldAccess { effects, .. } => check_fail(effects),
        HExpr::StructLit { effects, .. } => check_fail(effects),
        HExpr::NamedVariantConstruct { effects, .. } => check_fail(effects),
        HExpr::MatchExpr { effects, .. } => check_fail(effects),
        HExpr::Block { effects, .. } => check_fail(effects),
        HExpr::IfExpr { effects, .. } => check_fail(effects),
        HExpr::StringInterp { effects, .. } => check_fail(effects),
        HExpr::TryCatch { effects, .. } => check_fail(effects),
        HExpr::HandleExpr { effects, .. } => check_fail(effects),
        HExpr::Lambda { effects, .. } => check_fail(effects),
        HExpr::EffectOp { effects, .. } => check_fail(effects),
        HExpr::OptionUnwrap { effects, .. } => check_fail(effects),
        HExpr::TryBlock { effects, .. } => check_fail(effects),
        HExpr::OptionOr { effects, .. } => check_fail(effects),
        HExpr::RangeExpr { effects, .. } => check_fail(effects),
        HExpr::ListLit { effects, .. } => check_fail(effects),
        HExpr::TupleLit { effects, .. } => check_fail(effects),
    }
}

fn check_fail(effects: EffectRow) -> Bool {
    for e in effects.effects {
        match e {
            Effect::FailEffect { .. } => { return true },
            _ => {},
        }
    }
    false
}

// ============================================================
// Handle expression
// ============================================================

fn gen_handle(var ctx: CodegenCtx, body: HExpr, handlers: List<HEffectHandler>) -> Str {
    var by_effect: Map<Str, List<HEffectHandler>> = map_new()
    for h in handlers {
        match by_effect.get(h.effect_name) {
            some(existing) => existing.push(h),
            none => {
                by_effect.insert(h.effect_name, [h])
            },
        }
    }

    var ev_decls: List<Str> = [""]; ev_decls.clear()
    var has_abort = false
    let q = "\""

    for entry in by_effect.entries() {
        let (effect_name, hs) = entry
        var entries: List<Str> = [""]; entries.clear()
        for h in hs {
            var params: List<Str> = [""]; params.clear()
            for p in h.params { params.push(safe_ident(p.name)) }
            let params_str = params.join(", ")
            let b = gen_expr(ctx, h.body)
            let is_abort = effect_name == "fail" && h.op_name == "raise"
            if is_abort {
                has_abort = true
                let ea = RUNTIME_EFFECT_ABORT()
                var ep: List<Str> = [""]; ep.clear()
                ep.push(h.op_name)
                ep.push(": (")
                ep.push(params_str)
                ep.push(") => { throw new ")
                ep.push(ea)
                ep.push("(")
                ep.push(q)
                ep.push(effect_name)
                ep.push(q)
                ep.push(", ")
                ep.push(b)
                ep.push("); }")
                entries.push(ep.join(""))
            } else {
                var ep: List<Str> = [""]; ep.clear()
                ep.push(h.op_name)
                ep.push(": (")
                ep.push(params_str)
                ep.push(") => (")
                ep.push(b)
                ep.push(")")
                entries.push(ep.join(""))
            }
        }
        let ev_name = evidence_param_name(effect_name)
        let entries_str = entries.join(", ")
        ev_decls.push("const ${ev_name} = { ${entries_str} };")
    }

    var ev_param_names: List<Str> = [""]; ev_param_names.clear()
    for entry in by_effect.entries() {
        let (ename, _) = entry
        ev_param_names.push(evidence_param_name(ename))
    }
    ev_param_names.sort()
    let ev_args = ev_param_names.join(", ")
    let body_code = gen_handle_body(ctx, body, ev_args)
    let decls = ev_decls.join(" ")
    let ea = RUNTIME_EFFECT_ABORT()

    if has_abort {
        var p: List<Str> = [""]; p.clear()
        p.push("(function() { ")
        p.push(decls)
        p.push(" try { return ")
        p.push(body_code)
        p.push("; } catch (__ring_e) { if (__ring_e instanceof ")
        p.push(ea)
        p.push(") return __ring_e.value; throw __ring_e; } })()")
        p.join("")
    } else {
        "(function() { ${decls} return ${body_code}; })()"
    }
}

fn gen_handle_body(var ctx: CodegenCtx, expr: HExpr, ev_params: Str) -> Str {
    match expr {
        HExpr::Block { stmts, tail, .. } => {
            match tail {
                some(t) => {
                    if stmts.len() == 0 {
                        let b = gen_expr(ctx, t)
                        return "(function(${ev_params}) { return ${b}; })(${ev_params})"
                    }
                },
                none => {},
            }
            let saved_lines = ctx.lines
            let saved_indent = ctx.indent_level
            ctx.lines = [""]; ctx.lines.clear()
            ctx.indent_level = 1
            emit_block_body(ctx, expr)
            let body_lines = ctx.lines
            ctx.lines = saved_lines
            ctx.indent_level = saved_indent
            var result: List<Str> = [""]; result.clear()
            result.push("(function(${ev_params}) {")
            result.extend(body_lines)
            result.push("})(${ev_params})")
            result.join("\n")
        },
        _ => {
            let b = gen_expr(ctx, expr)
            "(function(${ev_params}) { return ${b}; })(${ev_params})"
        },
    }
}

// ============================================================
// Lambda
// ============================================================

fn gen_lambda(var ctx: CodegenCtx, params: List<HParam>, body: HExpr, ty: Type) -> Str {
    var p_names: List<Str> = [""]; p_names.clear()
    for p in params { p_names.push(safe_ident(p.name)) }
    var ev_params: List<Str> = [""]; ev_params.clear()
    match ty {
        Type::FnType { effects, .. } => { ev_params = get_evidence_params(effects) },
        _ => {},
    }
    var all: List<Str> = [""]; all.clear()
    all.extend(p_names)
    all.extend(ev_params)
    let all_str = all.join(", ")
    let b = gen_expr(ctx, body)
    "(function(${all_str}) { return ${b}; })"
}

fn gen_lambda_capture_evidence(var ctx: CodegenCtx, args: List<HExpr>, idx: Int) -> Str {
    match args.get(idx) {
        some(arg) => match arg {
            HExpr::Lambda { params, body, .. } => {
                var p_names: List<Str> = [""]; p_names.clear()
                for p in params { p_names.push(safe_ident(p.name)) }
                let params_str = p_names.join(", ")
                let b = gen_expr(ctx, body)
                "(function(${params_str}) { return ${b}; })"
            },
            _ => {
                let fn_expr = gen_expr(ctx, arg)
                let arg_type = hexpr_type(arg)
                match arg_type {
                    Type::FnType { params, .. } => {
                        let arity = params.len()
                        var p_names: List<Str> = [""]; p_names.clear()
                        for i in 0..arity { p_names.push("__ring_a${i}") }
                        let ev_args = get_callee_evidence_args(ctx, arg_type, none)
                        var all: List<Str> = [""]; all.clear()
                        all.extend(p_names)
                        if ev_args.len() > 0 { all.push(ev_args) }
                        let all_str = all.join(", ")
                        let params_str = p_names.join(", ")
                        "(function(${params_str}) { return ${fn_expr}(${all_str}); })"
                    },
                    _ => fn_expr,
                }
            },
        },
        none => "undefined",
    }
}
