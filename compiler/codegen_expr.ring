use types::{Type, Effect, EffectRow, type_to_builtin_name, effect_kind_name}
use ast::{Pattern, BinOp, UnaryOp}
use hir::{HExpr, HStmt, HMatchArm, HParam, HStructFieldInit,
    HStringInterpPart, HEffectHandler, DictRef, TraitDispatch,
    evidence_param_name, trait_dict_name,
    ENUM_TAG_FIELD, OPTION_SOME_TAG, OPTION_NONE_TAG, OPTION_PAYLOAD_FIELD,
    RUNTIME_EFFECT_ABORT, RUNTIME_MATCH_FAIL,
    BUILTIN_LIST, BUILTIN_MAP, BUILTIN_SET, BUILTIN_OPTION,
    hexpr_type}
use codegen_ctx::{CodegenCtx, emit, emit_raw, push_indent, pop_indent,
    qualify, safe_ident, get_evidence_params, is_imported_name, LIST_HOF_JS_METHOD}
use codegen_stmt::{gen_pattern_condition, gen_pattern_bindings, pattern_is_catchall,
    emit_block_body, emit_block_in_stmt_context, emit_stmt, emit_in_stmt_context}

// ============================================================
// Main expression dispatch
// ============================================================

pub fn gen_expr(mut ctx: CodegenCtx, expr: HExpr) -> Str {
    match expr {
        HExpr::IntLit { value, .. } => value.to_str(),
        HExpr::FloatLit { value, .. } => value.to_str(),
        HExpr::StrLit { value, .. } => json_stringify(value),
        HExpr::BoolLit { value, .. } => if value { "true" } else { "false" },
        // B-104 D4: local construction of a DYNAMIC wrapped dict (dict_lower's
        // `let __ring_dictlocal_N = …` init).  Same wrapper-object shape the
        // Wrapped DictRef used to emit inline — behavior-identical for JS.
        HExpr::DictConstruct { base_dict, trait_name, inner, .. } => {
            let d = qualify(ctx, base_dict)
            let mut inner_strs: List<Str> = []
            for i in inner { inner_strs.push(dict_ref_to_js(ctx, i)) }
            wrapped_dict_js(d, trait_name, inner_strs)
        },
        HExpr::Ident { name, resolved_name, def_id, ty, dict_closure_dicts, .. } => {
            let qname = match resolved_name {
                some(rn) => qualify(ctx, rn),
                none => qualify(ctx, name),
            }
            // Auto-boxing: access .value for boxed variables.
            // Skip for cross-module references: their def_ids come from a foreign
            // id-space and can collide with local boxed_vars def_ids (#B-077).
            let is_imported = is_imported_name(ctx, name)
            let boxed_qname = match def_id {
                some(did) => if !is_imported && ctx.boxed_vars.contains(did) { "${qname}.value" } else { qname },
                none => qname
            }
            match dict_closure_dicts {
                some(dicts) => {
                    if dicts.len() > 0 {
                        match ty {
                            Type::FnType { params, effects, .. } => {
                                let mut p_names: List<Str> = []
                                for i in 0..params.len() { p_names.push("__ring_a${i}") }
                                let dict_args = dicts.join(", ")
                                let ev_args = get_callee_evidence_args(ctx, ty, none)
                                let mut all_call: List<Str> = []
                                all_call.extend(p_names)
                                all_call.push(dict_args)
                                if ev_args.len() > 0 { all_call.push(ev_args) }
                                let call_str = all_call.join(", ")
                                let params_str = p_names.join(", ")
                                "((${params_str}) => ${boxed_qname}(${call_str}))"
                            },
                            _ => boxed_qname,
                        }
                    } else {
                        boxed_qname
                    }
                },
                none => boxed_qname,
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
            let mut arg_strs: List<Str> = []
            for a in args { arg_strs.push(gen_expr(ctx, a)) }
            let joined = arg_strs.join(", ")
            "${ev_name}.${op_name}(${joined})"
        },
        HExpr::RangeExpr { start, end, inclusive, .. } => {
            let s = gen_expr(ctx, start)
            let e = gen_expr(ctx, end)
            let incl = if inclusive { "true" } else { "false" }
            "{ start: ${s}, end: ${e}, inclusive: ${incl} }"
        },
        HExpr::ListLit { elements, .. } => {
            let mut elems: List<Str> = []
            for e in elements { elems.push(gen_expr(ctx, e)) }
            let joined = elems.join(", ")
            "[${joined}]"
        },
        HExpr::TupleLit { elements, .. } => {
            let mut elems: List<Str> = []
            for e in elements { elems.push(gen_expr(ctx, e)) }
            let joined = elems.join(", ")
            "[${joined}]"
        },
        HExpr::IndexExpr { receiver, index, .. } => {
            let r = gen_expr(ctx, receiver)
            let i = gen_expr(ctx, index)
            let recv_ty = hexpr_type(receiver)
            match recv_ty {
                Type::StructType { name, .. } => {
                    if name == BUILTIN_MAP {
                        "__ring_map_index(${r}, ${i})"
                    } else {
                        // List and other array-like types
                        "__ring_index(${r}, ${i})"
                    }
                },
                Type::StrType => "__ring_str_index(${r}, ${i})",
                _ => "__ring_index(${r}, ${i})"
            }
        },
        // B-098: Clone is an LLVM-only Perceus node (RC dup); the JS backend is GC'd
        // and never runs the Perceus pass, so this is unreachable — pass the inner
        // expression through transparently for exhaustiveness.
        HExpr::Clone { inner, .. } => gen_expr(ctx, inner),
        // B-113: return in match arm expression position — emit as JS return statement.
        // gen_match always uses the labeled-block pattern (B-055), so return in arm
        // bodies is handled by emit_branch_as_assign.
        HExpr::ReturnExpr { value, .. } => match value {
            some(v) => {
                let v_js = gen_expr(ctx, v)
                emit(ctx, "return ${v_js};")
                "undefined"
            },
            none => {
                emit(ctx, "return;")
                "undefined"
            }
        },
    }
}

// ============================================================
// Auto-boxing: generate a mut param argument
// ============================================================

// For mut value-type params at call sites:
// - If arg is a boxed Ident, pass the box itself (not .value)
// - Otherwise, wrap in {value: expr}
fn gen_mut_arg(mut ctx: CodegenCtx, arg: HExpr) -> Str {
    match arg {
        HExpr::Ident { name, resolved_name, def_id, .. } => {
            // Skip boxed_vars for cross-module references (def_id collision, #B-077)
            let is_imported = is_imported_name(ctx, name)
            match def_id {
                some(did) => {
                    if !is_imported && ctx.boxed_vars.contains(did) {
                        // Already boxed — pass the box itself (raw name, no .value)
                        match resolved_name {
                            some(rn) => qualify(ctx, rn),
                            none => qualify(ctx, name)
                        }
                    } else {
                        // Not boxed — wrap in temporary box
                        let v = gen_expr(ctx, arg)
                        "{value: ${v}}"
                    }
                },
                none => {
                    let v = gen_expr(ctx, arg)
                    "{value: ${v}}"
                }
            }
        },
        _ => {
            let v = gen_expr(ctx, arg)
            "{value: ${v}}"
        }
    }
}

// ============================================================
// BinOp — eq/ord dispatch extracted before fallback
// ============================================================

fn gen_binop(mut ctx: CodegenCtx, op: BinOp, left: HExpr, right: HExpr, eq_dispatch: TraitDispatch?, ord_dispatch: TraitDispatch?) -> Str {
    // Check eq dispatch: unwrap option, check op, early return
    match try_eq_dispatch(ctx, op, left, right, eq_dispatch) {
        some(result) => { return result },
        none => {},
    }
    // Check ord dispatch: unwrap option, check op, early return
    match try_ord_dispatch(ctx, op, left, right, ord_dispatch) {
        some(result) => { return result },
        none => {},
    }
    // Fallback: plain JS operator
    let l = gen_expr(ctx, left)
    let r = gen_expr(ctx, right)
    // Int division: JS `/` always yields float, so wrap in Math.trunc for IntType
    if op == BinOp::Div {
        match hexpr_type(left) {
            Type::IntType => { return "Math.trunc(${l} / ${r})" },
            _ => {},
        }
    }
    let js_op = match op {
        BinOp::Eq => "===",
        BinOp::Neq => "!==",
        _ => binop_str(op),
    }
    "(${l} ${js_op} ${r})"
}

fn try_eq_dispatch(mut ctx: CodegenCtx, op: BinOp, left: HExpr, right: HExpr, eq_dispatch: TraitDispatch?) -> Str? {
    match eq_dispatch {
        some(dispatch) => {
            let is_eq_op = op == BinOp::Eq || op == BinOp::Neq
            if is_eq_op {
                return some(gen_eq_dispatch(ctx, op, left, right, dispatch))
            }
        },
        none => {},
    }
    none
}

fn try_ord_dispatch(mut ctx: CodegenCtx, op: BinOp, left: HExpr, right: HExpr, ord_dispatch: TraitDispatch?) -> Str? {
    match ord_dispatch {
        some(dispatch) => {
            let is_ord_op = op == BinOp::Lt || op == BinOp::Gt || op == BinOp::Lte || op == BinOp::Gte
            if is_ord_op {
                return some(gen_ord_dispatch(ctx, op, left, right, dispatch))
            }
        },
        none => {},
    }
    none
}

fn binop_str(op: BinOp) -> Str {
    match op {
        BinOp::Add => "+", BinOp::Sub => "-", BinOp::Mul => "*", BinOp::Div => "/", BinOp::Mod => "%",
        BinOp::Eq => "===", BinOp::Neq => "!==",
        BinOp::Lt => "<", BinOp::Lte => "<=", BinOp::Gt => ">", BinOp::Gte => ">=",
        // B-104 D7: `&&`/`||` are rewritten to IfExpr by andor_lower (checker
        // end) — gen_if's ternary/statement-if is the single lowering path.
        BinOp::And => panic("JS codegen: BinOp::And must be lowered by andor_lower"),
        BinOp::Or => panic("JS codegen: BinOp::Or must be lowered by andor_lower"),
    }
}

fn is_tuple_field(s: Str) -> Bool {
    if s.len() == 0 { return false }
    match parse_int(s) {
        some(n) => n >= 0,
        none => false,
    }
}

// ============================================================
// Eq / Ord dispatch
// ============================================================

fn gen_eq_dispatch(mut ctx: CodegenCtx, op: BinOp, left: HExpr, right: HExpr, dispatch: TraitDispatch) -> Str {
    let l = gen_expr(ctx, left)
    let r = gen_expr(ctx, right)
    let is_ne = op == BinOp::Neq

    match dispatch {
        TraitDispatch::Builtin => match hexpr_type(left) {
            Type::TupleType { elements } => if is_ne { "(!__ring_tuple_eq(${l}, ${r}))" } else { "__ring_tuple_eq(${l}, ${r})" },
            _ => if is_ne { "(${l} !== ${r})" } else { "(${l} === ${r})" },
        },
        TraitDispatch::Direct { dict, extra_dicts } => {
            let d = qualify(ctx, dict)
            let extra = extra_dicts_ref_str(ctx, extra_dicts)
            let eq_call = "${d}.eq(${l}, ${r}${extra})"
            if is_ne { "(!${eq_call})" } else { eq_call }
        },
        TraitDispatch::Dict { param } => {
            let eq_call = "${param}.eq(${l}, ${r})"
            if is_ne { "(!${eq_call})" } else { eq_call }
        },
    }
}

fn gen_ord_dispatch(mut ctx: CodegenCtx, op: BinOp, left: HExpr, right: HExpr, dispatch: TraitDispatch) -> Str {
    let l = gen_expr(ctx, left)
    let r = gen_expr(ctx, right)

    match dispatch {
        TraitDispatch::Builtin => {
            let op_str = binop_str(op)
            "(${l} ${op_str} ${r})"
        },
        TraitDispatch::Direct { dict, extra_dicts } => {
            let d = qualify(ctx, dict)
            let extra = extra_dicts_ref_str(ctx, extra_dicts)
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

// B-104 D4: the wrapper-dict object literal for a parameterized type's trait
// dict (base dict's methods partially applied with the inner dicts).  Shared by
// the inline forms (DictRef::Wrapped residuals, HExpr::DictConstruct) and the
// module-level static instance consts (codegen.ring emit from HDictDef).
pub fn wrapped_dict_js(d: Str, trait_name: Str, inner_strs: List<Str>) -> Str {
    let inner_args = inner_strs.join(", ")
    match trait_name {
        "Eq" => "{ eq: (__a, __b) => ${d}.eq(__a, __b, ${inner_args}), ne: (__a, __b) => ${d}.ne(__a, __b, ${inner_args}) }",
        "Clone" => "{ clone: (__a) => ${d}.clone(__a, ${inner_args}) }",
        "Debug" => "{ debug: (__a) => ${d}.debug(__a, ${inner_args}) }",
        "Ord" => "{ cmp: (__a, __b) => ${d}.cmp(__a, __b, ${inner_args}) }",
        _ => d,
    }
}

fn dict_ref_to_js(ctx: CodegenCtx, dr: DictRef) -> Str {
    match dr {
        DictRef::Simple(name) => qualify(ctx, name),
        // A module-level static dict singleton (plain dict const / builtin
        // preamble dict / dict_lower instance const) — reference by name.
        DictRef::Static(name) => qualify(ctx, name),
        DictRef::Wrapped { dict, trait_name, inner_dicts } => {
            let d = qualify(ctx, dict)
            let mut inner_strs: List<Str> = []
            for inner in inner_dicts {
                inner_strs.push(dict_ref_to_js(ctx, inner))
            }
            wrapped_dict_js(d, trait_name, inner_strs)
        },
    }
}

fn extra_dicts_ref_str(ctx: CodegenCtx, dicts: List<DictRef>) -> Str {
    if dicts.len() > 0 {
        let mut parts: List<Str> = []
        for d in dicts {
            parts.push(dict_ref_to_js(ctx, d))
        }
        let joined = parts.join(", ")
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
                        let mut caller_effect_names = set_new()
                        match ctx.current_fn_effects {
                            some(cfe) => {
                                for e in cfe.effects {
                                    caller_effect_names.insert(effect_kind_name(e))
                                }
                            },
                            none => {},
                        }
                        if ctx.in_try_fail { caller_effect_names.insert("fail") }
                        let mut needed: List<Effect> = []
                        for e in actual_effects.effects {
                            if caller_effect_names.contains(effect_kind_name(e)) {
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

fn gen_call(mut ctx: CodegenCtx, callee: HExpr, args: List<HExpr>, resolved_dicts: List<DictRef>, dict_dispatch: DictDispatchInfo?) -> Str {
    match dict_dispatch {
        some(dd) => {
            let mut skip_first_arg = false
            let receiver_arg = match callee {
                HExpr::FieldAccess { receiver, .. } => gen_expr(ctx, receiver),
                _ => {
                    match args.get(0) {
                        some(a) => {
                            skip_first_arg = true
                            gen_expr(ctx, a)
                        },
                        none => gen_expr(ctx, callee),
                    }
                },
            }
            let mut other_args: List<Str> = []
            let mut arg_idx = 0
            for a in args {
                if skip_first_arg && arg_idx == 0 {
                    arg_idx = arg_idx + 1
                } else {
                    other_args.push(gen_expr(ctx, a))
                    arg_idx = arg_idx + 1
                }
            }
            let mut all: List<Str> = []
            all.push(receiver_arg)
            all.extend(other_args)
            // #77: Forward evidence params for dict dispatch calls with effects
            let ev_args = get_callee_evidence_args(ctx, hexpr_type(callee), none)
            if ev_args.len() > 0 { all.push(ev_args) }
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
                    if (name == BUILTIN_LIST) {
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
                            let init = gen_first_arg_or_undefined(ctx, args)
                            let cb = gen_lambda_capture_evidence(ctx, args, 1)
                            return "${r}.reduce(${cb}, ${init})"
                        }
                        if method == "find" { return gen_list_find_expr(ctx, receiver, args, "__a[__i]") }
                        if method == "find_index" { return gen_list_find_expr(ctx, receiver, args, "__i") }
                        if method == "sort_by" {
                            let r = gen_expr(ctx, receiver)
                            let cb = gen_lambda_capture_evidence(ctx, args, 0)
                            return "${r}.sort(${cb})"
                        }
                    }
                    // Map/Set inline HOFs share the iteration-pattern helpers below;
                    // each container lists only the methods it actually inlines.
                    if (name == BUILTIN_MAP) {
                        if method == "map_values" {
                            let r = gen_expr(ctx, receiver)
                            let cb = gen_lambda_capture_evidence(ctx, args, 0)
                            return gen_hof_collect_expr(map_hof_shape(), "__r.set(__k, __f(__v))", r, cb)
                        }
                        if method == "filter" { return gen_hof_filter(ctx, map_hof_shape(), receiver, args) }
                        if method == "fold" { return gen_hof_fold(ctx, map_hof_shape(), receiver, args) }
                        if method == "any" { return gen_hof_any(ctx, map_hof_shape(), receiver, args) }
                    }
                    if (name == BUILTIN_SET) {
                        if method == "filter" { return gen_hof_filter(ctx, set_hof_shape(), receiver, args) }
                        if method == "fold" { return gen_hof_fold(ctx, set_hof_shape(), receiver, args) }
                        if method == "any" { return gen_hof_any(ctx, set_hof_shape(), receiver, args) }
                        if method == "all" { return gen_hof_all(ctx, set_hof_shape(), receiver, args) }
                    }
                },
                Type::EnumType { name, .. } => {
                    if (name == BUILTIN_OPTION) {
                        let tag_f = ENUM_TAG_FIELD
                        let some_t = OPTION_SOME_TAG
                        let pay_f = OPTION_PAYLOAD_FIELD
                        if method == "map" {
                            return gen_option_hof(ctx, receiver, args, "{ ${tag_f}: \"${some_t}\", ${pay_f}: __f(__o.${pay_f}) }", "__o")
                        }
                        if method == "and_then" {
                            return gen_option_hof(ctx, receiver, args, "__f(__o.${pay_f})", "__o")
                        }
                        if method == "unwrap_or_else" {
                            return gen_option_hof(ctx, receiver, args, "__o.${pay_f}", "__f()")
                        }
                        if method == "to_fail" {
                            let r = gen_expr(ctx, receiver)
                            let err_arg = gen_first_arg_or_undefined(ctx, args)
                            let ev = evidence_param_name("fail")
                            return "((v) => v.${tag_f} === \"${some_t}\" ? v.${pay_f} : ${ev}.raise(${err_arg}))(${r})"
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
                                    // Use dict-based dispatch: dict.method(...)
                                    // This handles both explicit and default trait methods (#84)
                                    let dict = trait_dict_name(qualify(ctx, tn), safe_ident(trait_name))
                                    "${dict}.${safe_ident(method)}"
                                },
                                none => "${qualify(ctx, tn)}_${safe_ident(method)}",
                            }
                            let r = gen_expr(ctx, receiver)
                            // UFCS: lookup mut param flags; args[0] in fn_mut_params is self (always false),
                            // subsequent params correspond to args[1..]
                            let ufcs_fn_name = "${qualify(ctx, tn)}_${safe_ident(method)}"
                            let ufcs_mut_flags = ctx.fn_mut_params.get(ufcs_fn_name)
                            let mut arg_strs: List<Str> = []
                            let mut ufcs_ai = 0
                            for a in args {
                                // ufcs_ai+1 because fn_mut_params[0] is self
                                let is_mut_p = match ufcs_mut_flags {
                                    some(flags) => match flags.get(ufcs_ai + 1) { some(f) => f, none => false },
                                    none => false
                                }
                                if is_mut_p {
                                    arg_strs.push(gen_mut_arg(ctx, a))
                                } else {
                                    arg_strs.push(gen_expr(ctx, a))
                                }
                                ufcs_ai = ufcs_ai + 1
                            }
                            let all_args = if arg_strs.len() > 0 {
                                let joined = arg_strs.join(", ")
                                "${r}, ${joined}"
                            } else { r }
                            let mut dict_parts: List<Str> = []
                            for d in resolved_dicts { dict_parts.push(dict_ref_to_js(ctx, d)) }
                            let dict_str = dict_parts.join(", ")
                            let ev_args = get_callee_evidence_args(ctx, callee_type, none)
                            let mut parts: List<Str> = []
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
    // Lookup mut param flags for call-site boxing
    let mut_flags: List<Bool>? = match cn {
        some(cname) => ctx.fn_mut_params.get(cname),
        none => none
    }
    let mut arg_strs: List<Str> = []
    let mut argi = 0
    for a in args {
        let is_mut_param = match mut_flags {
            some(flags) => match flags.get(argi) { some(f) => f, none => false },
            none => false
        }
        if is_mut_param {
            arg_strs.push(gen_mut_arg(ctx, a))
        } else {
            arg_strs.push(gen_expr(ctx, a))
        }
        argi = argi + 1
    }
    let args_str = arg_strs.join(", ")
    let mut dict_parts: List<Str> = []
    for d in resolved_dicts { dict_parts.push(dict_ref_to_js(ctx, d)) }
    let dict_str = dict_parts.join(", ")
    let ev_args = get_callee_evidence_args(ctx, hexpr_type(callee), cn)
    let mut all_parts: List<Str> = []
    if args_str.len() > 0 { all_parts.push(args_str) }
    if dict_str.len() > 0 { all_parts.push(dict_str) }
    if ev_args.len() > 0 { all_parts.push(ev_args) }
    let all_str = all_parts.join(", ")
    "${callee_str}(${all_str})"
}

// ============================================================
// Inline HOF helpers — shared iteration patterns (#28)
// ============================================================

// How to iterate a JS container inside an inline-HOF IIFE: the loop
// binding, how element values reach the user callback, and how matching
// elements are collected into a fresh result container (`__r`).
struct HofIterShape {
    container_var: Str, // IIFE parameter holding the container
    binding: Str,       // per-element for-of binding
    cb_args: Str,       // arguments forwarded to the user callback
    result_ctor: Str,   // empty result-container constructor
    result_add: Str,    // statement inserting the current element into __r
}

fn map_hof_shape() -> HofIterShape {
    HofIterShape {
        container_var: "__m",
        binding: "[__k, __v]",
        cb_args: "__k, __v",
        result_ctor: "new Map()",
        result_add: "__r.set(__k, __v)",
    }
}

fn set_hof_shape() -> HofIterShape {
    HofIterShape {
        container_var: "__s",
        binding: "__x",
        cb_args: "__x",
        result_ctor: "new Set()",
        result_add: "__r.add(__x)",
    }
}

// First call argument, or "undefined" when absent (fold init, to_fail payload)
fn gen_first_arg_or_undefined(mut ctx: CodegenCtx, args: List<HExpr>) -> Str {
    match args.get(0) {
        some(a) => gen_expr(ctx, a),
        none => "undefined",
    }
}

// Collect loop: build a fresh container, run `element_stmt` per element
fn gen_hof_collect_expr(sh: HofIterShape, element_stmt: Str, receiver: Str, cb: Str) -> Str {
    let cv = sh.container_var
    "((${cv}, __f) => { const __r = ${sh.result_ctor}; for (const ${sh.binding} of ${cv}) ${element_stmt}; return __r; })(${receiver}, ${cb})"
}

// filter: collect the elements the callback accepts
fn gen_hof_filter(mut ctx: CodegenCtx, sh: HofIterShape, receiver: HExpr, args: List<HExpr>) -> Str {
    let r = gen_expr(ctx, receiver)
    let cb = gen_lambda_capture_evidence(ctx, args, 0)
    gen_hof_collect_expr(sh, "if (__f(${sh.cb_args})) ${sh.result_add}", r, cb)
}

// fold: args[0] is the initial accumulator, args[1] the combine callback
fn gen_hof_fold(mut ctx: CodegenCtx, sh: HofIterShape, receiver: HExpr, args: List<HExpr>) -> Str {
    let r = gen_expr(ctx, receiver)
    let init = gen_first_arg_or_undefined(ctx, args)
    let cb = gen_lambda_capture_evidence(ctx, args, 1)
    let cv = sh.container_var
    "((${cv}, __a, __f) => { for (const ${sh.binding} of ${cv}) __a = __f(__a, ${sh.cb_args}); return __a; })(${r}, ${init}, ${cb})"
}

// any: early-exit true on the first element the callback accepts
fn gen_hof_any(mut ctx: CodegenCtx, sh: HofIterShape, receiver: HExpr, args: List<HExpr>) -> Str {
    let r = gen_expr(ctx, receiver)
    let cb = gen_lambda_capture_evidence(ctx, args, 0)
    let cv = sh.container_var
    "((${cv}, __f) => { for (const ${sh.binding} of ${cv}) if (__f(${sh.cb_args})) return true; return false; })(${r}, ${cb})"
}

// all: early-exit false on the first element the callback rejects
fn gen_hof_all(mut ctx: CodegenCtx, sh: HofIterShape, receiver: HExpr, args: List<HExpr>) -> Str {
    let r = gen_expr(ctx, receiver)
    let cb = gen_lambda_capture_evidence(ctx, args, 0)
    let cv = sh.container_var
    "((${cv}, __f) => { for (const ${sh.binding} of ${cv}) if (!__f(${sh.cb_args})) return false; return true; })(${r}, ${cb})"
}

// List find/find_index: findIndex + option-wrap; `found` is the some-payload
// and may reference __a (the array) and __i (the found index)
fn gen_list_find_expr(mut ctx: CodegenCtx, receiver: HExpr, args: List<HExpr>, found: Str) -> Str {
    let r = gen_expr(ctx, receiver)
    let cb = gen_lambda_capture_evidence(ctx, args, 0)
    let tag_f = ENUM_TAG_FIELD
    let some_t = OPTION_SOME_TAG
    let none_t = OPTION_NONE_TAG
    let pay_f = OPTION_PAYLOAD_FIELD
    "((__a) => { const __i = __a.findIndex(${cb}); return __i >= 0 ? { ${tag_f}: \"${some_t}\", ${pay_f}: ${found} } : { ${tag_f}: \"${none_t}\" }; })(${r})"
}

// Option map/and_then/unwrap_or_else share one shape: test the tag, then
// pick a some-branch / none-branch expression over __o (option) and __f (callback)
fn gen_option_hof(mut ctx: CodegenCtx, receiver: HExpr, args: List<HExpr>, on_some: Str, on_none: Str) -> Str {
    let r = gen_expr(ctx, receiver)
    let cb = gen_lambda_capture_evidence(ctx, args, 0)
    let tag_f = ENUM_TAG_FIELD
    let some_t = OPTION_SOME_TAG
    "((__o, __f) => __o.${tag_f} === \"${some_t}\" ? ${on_some} : ${on_none})(${r}, ${cb})"
}

// ============================================================
// Struct literal
// ============================================================

fn gen_struct_lit(mut ctx: CodegenCtx, name: Str, fields: List<HStructFieldInit>, spread: HExpr?) -> Str {
    let qname = qualify(ctx, name)
    match ctx.struct_field_order.get(qname) {
        some(declared_order) => {
            let mut field_map: Map<Str, HExpr> = map_new()
            for f in fields { field_map.insert(f.name, f.value) }
            match spread {
                some(sp) => gen_spread_struct(ctx, sp, qname, declared_order, field_map, true),
                none => {
                    let mut args: List<Str> = []
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
                    let mut field_map: Map<Str, HExpr> = map_new()
                    for f in fields { field_map.insert(f.name, f.value) }
                    let mut order: List<Str> = []
                    for f in fields { order.push(f.name) }
                    gen_spread_struct(ctx, sp, qname, order, field_map, true)
                },
                none => {
                    let mut args: List<Str> = []
                    for f in fields { args.push(gen_expr(ctx, f.value)) }
                    let joined = args.join(", ")
                    "new ${qname}(${joined})"
                },
            }
        },
    }
}

fn gen_spread_struct(mut ctx: CodegenCtx, spread: HExpr, ctor_name: Str, field_order: List<Str>, field_map: Map<Str, HExpr>, use_new: Bool) -> Str {
    let is_simple = match spread {
        HExpr::Ident { .. } => true,
        HExpr::FieldAccess { .. } => true,
        _ => false,
    }
    if is_simple {
        let base = gen_expr(ctx, spread)
        let mut args: List<Str> = []
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
        let mut args: List<Str> = []
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

fn gen_named_variant_construct(mut ctx: CodegenCtx, enum_name: Str, variant_name: Str, fields: List<HStructFieldInit>, spread: HExpr?, ty: Type) -> Str {
    let js_name = "${qualify(ctx, enum_name)}_${variant_name}"
    let mut field_map: Map<Str, HExpr> = map_new()
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
                                    let mut args: List<Str> = []
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

    let mut args: List<Str> = []
    for f in fields { args.push(gen_expr(ctx, f.value)) }
    let joined = args.join(", ")
    "${js_name}(${joined})"
}

// ============================================================
// Match expression (expression-mode — IIFE)
// ============================================================

fn gen_match(mut ctx: CodegenCtx, scrutinee: HExpr, arms: List<HMatchArm>) -> Str {
    // B-055: All match expressions use labeled-block + temp variable pattern.
    // No IIFE — avoids closure allocation.  The emitted statements go into
    // ctx.lines; callers that build string expressions (gen_lambda, etc.)
    // save/restore ctx.lines to capture them.
    let tmp = "__ring_blk${ctx.block_counter}"
    ctx.block_counter = ctx.block_counter + 1
    let label = "__ring_match${ctx.match_counter}"
    ctx.match_counter = ctx.match_counter + 1
    let scrut_js = gen_expr(ctx, scrutinee)
    emit(ctx, "let ${tmp};")
    emit(ctx, "${label}: {")
    push_indent(ctx)
    let scrut_var = "__ring_m${ctx.match_counter - 1}"
    emit(ctx, "const ${scrut_var} = ${scrut_js};")

    for arm in arms {
        let cond = gen_pattern_condition(ctx, scrut_var, arm.pattern)
        let bindings_str = gen_pattern_bindings(ctx, scrut_var, arm.pattern)
        match arm.guard {
            none => {
                if cond == "true" {
                    if bindings_str.len() > 0 { emit(ctx, bindings_str.trim()) }
                    emit_branch_as_assign(ctx, arm.body, tmp)
                    emit(ctx, "break ${label};")
                } else {
                    emit(ctx, "if (${cond}) {")
                    push_indent(ctx)
                    if bindings_str.len() > 0 { emit(ctx, bindings_str.trim()) }
                    emit_branch_as_assign(ctx, arm.body, tmp)
                    emit(ctx, "break ${label};")
                    pop_indent(ctx)
                    emit(ctx, "}")
                }
            },
            some(guard) => {
                emit(ctx, "if (${cond}) {")
                push_indent(ctx)
                if bindings_str.len() > 0 { emit(ctx, bindings_str.trim()) }
                let guard_js = gen_expr(ctx, guard)
                emit(ctx, "if (${guard_js}) {")
                push_indent(ctx)
                emit_branch_as_assign(ctx, arm.body, tmp)
                emit(ctx, "break ${label};")
                pop_indent(ctx)
                emit(ctx, "}")
                pop_indent(ctx)
                emit(ctx, "}")
            },
        }
    }

    let mut has_catchall = false
    for a in arms {
        match a.guard { some(_) => {}, none => {
            if pattern_is_catchall(a.pattern) { has_catchall = true }
        }}
    }
    if has_catchall == false {
        let mf = RUNTIME_MATCH_FAIL
        emit(ctx, "${mf}(${scrut_var});")
    }

    pop_indent(ctx)
    emit(ctx, "}")
    tmp
}

// ============================================================
// Return detection helpers
// ============================================================

// Check if an expression tree contains a return statement.
// Does NOT descend into lambda bodies (they have their own return context).
fn expr_contains_return(expr: HExpr) -> Bool {
    match expr {
        HExpr::Block { stmts, tail, .. } => {
            if stmts_contain_return(stmts) { return true }
            match tail {
                some(t) => expr_contains_return(t),
                none => false,
            }
        },
        HExpr::IfExpr { condition, then_branch, else_branch, .. } => {
            if expr_contains_return(condition) { return true }
            if expr_contains_return(then_branch) { return true }
            match else_branch {
                some(eb) => expr_contains_return(eb),
                none => false,
            }
        },
        HExpr::MatchExpr { scrutinee, arms, .. } => {
            if expr_contains_return(scrutinee) { return true }
            for arm in arms {
                if expr_contains_return(arm.body) { return true }
            }
            false
        },
        // Lambda has its own return context — do NOT recurse into it
        HExpr::Lambda { .. } => false,
        // B-113: ReturnExpr is itself a return in expression position
        HExpr::ReturnExpr { .. } => true,
        _ => false,
    }
}

// Check if any statement in the list contains a return (including nested blocks).
// Does NOT descend into lambda bodies.
fn stmts_contain_return(stmts: List<HStmt>) -> Bool {
    for stmt in stmts {
        match stmt {
            HStmt::Return { .. } => { return true },
            HStmt::While { body, .. } => {
                if expr_contains_return(body) { return true }
            },
            HStmt::ForIn { body, .. } => {
                if expr_contains_return(body) { return true }
            },
            HStmt::ExprStmt { expr, .. } => {
                if expr_contains_return(expr) { return true }
            },
            HStmt::Let { init, .. } => {
                if expr_contains_return(init) { return true }
            },
            HStmt::Var { init, .. } => {
                if expr_contains_return(init) { return true }
            },
            HStmt::IfLet { then_block, else_block, .. } => {
                if expr_contains_return(then_block) { return true }
                match else_block {
                    some(eb) => { if expr_contains_return(eb) { return true } },
                    none => {},
                }
            },
            _ => {},
        }
    }
    false
}

// Check if a block expression (or if/match expression) contains return at any depth.
fn block_expr_contains_return(stmts: List<HStmt>, tail: HExpr?) -> Bool {
    if stmts_contain_return(stmts) { return true }
    match tail {
        some(t) => expr_contains_return(t),
        none => false,
    }
}

// ============================================================
// Block expression (expression-mode — IIFE)
// ============================================================

fn gen_block_expr(mut ctx: CodegenCtx, stmts: List<HStmt>, tail: HExpr?, block: HExpr) -> Str {
    match tail {
        some(t) => {
            if stmts.len() == 0 {
                return gen_expr(ctx, t)
            }
        },
        none => {},
    }
    // When the block contains a `return`, avoid IIFE wrapping — emit
    // statements inline and assign the tail expression to a temp variable.
    if block_expr_contains_return(stmts, tail) {
        for stmt in stmts {
            emit_stmt(ctx, stmt)
        }
        match tail {
            some(t) => {
                let tmp = "__ring_blk${ctx.block_counter}"
                ctx.block_counter = ctx.block_counter + 1
                let tail_val = gen_expr(ctx, t)
                emit(ctx, "let ${tmp} = ${tail_val};")
                return tmp
            },
            none => {
                return "undefined"
            },
        }
    }
    let saved_lines = ctx.lines
    let saved_indent = ctx.indent_level
    ctx.lines = []
    ctx.indent_level = 1
    emit_block_body(ctx, block)
    let body_lines = ctx.lines
    ctx.lines = saved_lines
    ctx.indent_level = saved_indent
    let mut result: List<Str> = []
    result.push("(function() {")
    result.extend(body_lines)
    result.push("})()")
    result.join("\n")
}

// ============================================================
// If expression (expression-mode — ternary)
// ============================================================

fn if_expr_contains_return(then_branch: HExpr, else_branch: HExpr?) -> Bool {
    if expr_contains_return(then_branch) { return true }
    match else_branch {
        some(eb) => expr_contains_return(eb),
        none => false,
    }
}

// Emit an `else if` branch that assigns its value to `tmp`.
// INVARIANT: caller must emit `}` to close the preceding block before calling this.
// This function emits `else if (...) { ... }` and handles chained else-if / else.
fn emit_if_as_assign(mut ctx: CodegenCtx, condition: HExpr, then_branch: HExpr, else_branch: HExpr?, tmp: Str) {
    let cond = gen_expr(ctx, condition)
    emit(ctx, "else if (${cond}) {")
    push_indent(ctx)
    emit_branch_as_assign(ctx, then_branch, tmp)
    pop_indent(ctx)
    match else_branch {
        none => emit(ctx, "}"),
        some(eb) => match eb {
            HExpr::IfExpr { condition: ec, then_branch: et, else_branch: ee, .. } => {
                emit(ctx, "}")
                emit_if_as_assign(ctx, ec, et, ee, tmp)
            },
            _ => {
                emit(ctx, "} else {")
                push_indent(ctx)
                emit_branch_as_assign(ctx, eb, tmp)
                pop_indent(ctx)
                emit(ctx, "}")
            },
        },
    }
}

fn emit_branch_as_assign(mut ctx: CodegenCtx, branch: HExpr, tmp: Str) {
    match branch {
        HExpr::Block { stmts, tail, .. } => {
            for stmt in stmts {
                emit_stmt(ctx, stmt)
            }
            match tail {
                some(t) => {
                    let v = gen_expr(ctx, t)
                    emit(ctx, "${tmp} = ${v};")
                },
                none => {},
            }
        },
        // B-113: ReturnExpr already emits `return` — skip the tmp assignment
        // (the return exits the function, making subsequent code dead).
        HExpr::ReturnExpr { value, .. } => match value {
            some(v) => {
                let v_js = gen_expr(ctx, v)
                emit(ctx, "return ${v_js};")
            },
            none => emit(ctx, "return;"),
        },
        _ => {
            let v = gen_expr(ctx, branch)
            emit(ctx, "${tmp} = ${v};")
        },
    }
}

fn gen_if(mut ctx: CodegenCtx, condition: HExpr, then_branch: HExpr, else_branch: HExpr?) -> Str {
    // When any branch contains `return`, use statement-mode if with a temp variable
    // instead of ternary, to avoid IIFE capturing the return.
    if if_expr_contains_return(then_branch, else_branch) {
        let tmp = "__ring_blk${ctx.block_counter}"
        ctx.block_counter = ctx.block_counter + 1
        emit(ctx, "let ${tmp};")
        let cond = gen_expr(ctx, condition)
        emit(ctx, "if (${cond}) {")
        push_indent(ctx)
        emit_branch_as_assign(ctx, then_branch, tmp)
        pop_indent(ctx)
        match else_branch {
            none => emit(ctx, "}"),
            some(eb) => match eb {
                HExpr::IfExpr { condition: ec, then_branch: et, else_branch: ee, .. } => {
                    emit(ctx, "}")
                    emit_if_as_assign(ctx, ec, et, ee, tmp)
                },
                _ => {
                    emit(ctx, "} else {")
                    push_indent(ctx)
                    emit_branch_as_assign(ctx, eb, tmp)
                    pop_indent(ctx)
                    emit(ctx, "}")
                },
            },
        }
        return tmp
    }
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

fn gen_block_as_value(mut ctx: CodegenCtx, block: HExpr) -> Str {
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
    let mut result: List<Str> = []
    let mut i = 0
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

fn gen_string_interp(mut ctx: CodegenCtx, parts: List<HStringInterpPart>) -> Str {
    let mut result: List<Str> = []
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
// Try/catch expression
// ============================================================

fn gen_catch_pattern_condition(ctx: CodegenCtx, target: Str, pat: Pattern) -> Str {
    gen_pattern_condition(ctx, target, pat)
}

fn gen_try_catch(mut ctx: CodegenCtx, body: HExpr, arms: List<HMatchArm>) -> Str {
    let saved_in_try = ctx.in_try_fail
    ctx.in_try_fail = true
    // B-055: Save/restore to capture emit()-based expressions in try body
    let saved_lines_body = ctx.lines
    let saved_indent_body = ctx.indent_level
    ctx.lines = []
    ctx.indent_level = 2
    let body_js = gen_expr(ctx, body)
    let body_extra_lines = ctx.lines
    ctx.lines = saved_lines_body
    ctx.indent_level = saved_indent_body
    ctx.in_try_fail = saved_in_try

    let ev = evidence_param_name("fail")
    let ea = RUNTIME_EFFECT_ABORT
    let q = "\""

    // Generate arm code — each arm may emit statements (B-055)
    let mut arm_conds: List<Str> = []
    let mut arm_bindings_list: List<Str> = []
    let mut arm_body_jss: List<Str> = []
    let mut arm_body_lines_list: List<List<Str>> = []
    let mut arm_guard_jss: List<Str> = []
    for arm in arms {
        let cond = gen_catch_pattern_condition(ctx, "__ring_err", arm.pattern)
        let bindings = gen_pattern_bindings(ctx, "__ring_err", arm.pattern)
        let saved_a = ctx.lines
        let saved_ai = ctx.indent_level
        ctx.lines = []
        ctx.indent_level = 2
        let arm_body_js = gen_expr(ctx, arm.body)
        let arm_body_lines = ctx.lines
        ctx.lines = saved_a
        ctx.indent_level = saved_ai

        let mut guard_js = ""
        match arm.guard {
            some(g) => { guard_js = " && (${gen_expr(ctx, g)})" },
            none => {}
        }

        arm_conds.push(cond)
        arm_bindings_list.push(bindings)
        arm_body_jss.push(arm_body_js)
        arm_body_lines_list.push(arm_body_lines)
        arm_guard_jss.push(guard_js)
    }

    // Check if any arm or body emitted extra lines — if so, use multi-line format
    let mut has_extra = body_extra_lines.len() > 0
    if !has_extra {
        for abl in arm_body_lines_list {
            if abl.len() > 0 { has_extra = true }
        }
    }

    if has_extra {
        // Multi-line format to accommodate emitted statements
        let mut r: List<Str> = []
        r.push("(function() {")
        r.push("  const ${ev} = { raise: (__ring_err) => { throw new ${ea}(${q}fail${q}, __ring_err); } };")
        r.push("  try {")
        r.extend(body_extra_lines)
        r.push("    return ${body_js};")
        r.push("  } catch (__ring_e) {")
        r.push("    if (__ring_e instanceof ${ea} && __ring_e.effect === ${q}fail${q}) {")
        r.push("      const __ring_err = __ring_e.value;")
        for i in 0..arm_conds.len() {
            let lines = arm_body_lines_list[i]
            let cond_s = arm_conds[i]
            let bind_s = arm_bindings_list[i]
            let bodyj_s = arm_body_jss[i]
            let guardj_s = arm_guard_jss[i]
            if lines.len() > 0 {
                r.push("      if (${cond_s}${guardj_s}) {")
                r.push("        ${bind_s}")
                r.extend(lines)
                r.push("        return ${bodyj_s};")
                r.push("      }")
            } else {
                r.push("      if (${cond_s}${guardj_s}) { ${bind_s}return ${bodyj_s}; }")
            }
        }
        r.push("      throw __ring_e;")
        r.push("    }")
        r.push("    throw __ring_e;")
        r.push("  }")
        r.push("})()")
        return r.join("\n")
    }

    // Compact single-line format (no emitted statements)
    let mut arm_js: List<Str> = []
    for i in 0..arm_conds.len() {
        arm_js.push("if (${arm_conds[i]}${arm_guard_jss[i]}) { ${arm_bindings_list[i]}return ${arm_body_jss[i]}; }")
    }

    let mut p: List<Str> = []
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
    let mut first = true
    for aj in arm_js {
        if first { p.push(aj); first = false }
        else { p.push(" else ${aj}") }
    }

    // Always re-throw unmatched errors as runtime safety net
    if arm_js.len() > 0 {
        p.push(" else { throw __ring_e; }")
    } else {
        p.push("throw __ring_e;")
    }

    p.push(" } throw __ring_e; } })()")
    p.join("")
}

// ============================================================
// Handle expression
// ============================================================

fn gen_handle(mut ctx: CodegenCtx, body: HExpr, handlers: List<HEffectHandler>) -> Str {
    let mut by_effect: Map<Str, List<HEffectHandler>> = map_new()
    for h in handlers {
        match by_effect.get(h.effect_name) {
            some(existing) => existing.push(h),
            none => {
                by_effect.insert(h.effect_name, [h])
            },
        }
    }

    let mut ev_decls: List<Str> = []
    let mut has_abort = false
    let mut abort_effect_names: List<Str> = []
    let q = "\""

    let mut sorted_by_effect = by_effect.entries()
    sorted_by_effect.sort_by(fn(a, b) { if a.0 < b.0 { -1 } else if a.0 > b.0 { 1 } else { 0 } })
    for entry in sorted_by_effect {
        let (effect_name, hs) = entry
        let ev_name = evidence_param_name(effect_name)
        let mut handled_op_names: Set<Str> = set_new()
        // Use let + sequential field assignment to avoid TDZ when
        // a default body references sibling ops on the same evidence object (#80)
        ev_decls.push("let ${ev_name} = {};")
        for h in hs {
            handled_op_names.insert(h.op_name)
            let mut params: List<Str> = []
            for p in h.params { params.push(safe_ident(p.name)) }
            let params_str = params.join(", ")
            // B-055: Save/restore to capture emit()-based expressions in handler body
            let saved_hb = ctx.lines
            let saved_hbi = ctx.indent_level
            ctx.lines = []
            ctx.indent_level = 1
            let b = gen_expr(ctx, h.body)
            let hb_lines = ctx.lines
            ctx.lines = saved_hb
            ctx.indent_level = saved_hbi
            let is_abort = effect_name == "fail" && h.op_name == "raise"
            if is_abort {
                has_abort = true
                abort_effect_names.push(effect_name)
                let ea = RUNTIME_EFFECT_ABORT
                if hb_lines.len() > 0 {
                    let mut hb_parts: List<Str> = []
                    hb_parts.push("${ev_name}.${h.op_name} = (${params_str}) => {")
                    hb_parts.extend(hb_lines)
                    hb_parts.push("  throw new ${ea}(${q}${effect_name}${q}, ${b});")
                    hb_parts.push("};")
                    ev_decls.push(hb_parts.join("\n"))
                } else {
                    ev_decls.push("${ev_name}.${h.op_name} = (${params_str}) => { throw new ${ea}(${q}${effect_name}${q}, ${b}); };")
                }
            } else {
                if hb_lines.len() > 0 {
                    let mut hb_parts: List<Str> = []
                    hb_parts.push("${ev_name}.${h.op_name} = (${params_str}) => {")
                    hb_parts.extend(hb_lines)
                    hb_parts.push("  return ${b};")
                    hb_parts.push("};")
                    ev_decls.push(hb_parts.join("\n"))
                } else {
                    ev_decls.push("${ev_name}.${h.op_name} = (${params_str}) => (${b});")
                }
            }
        }
        // Merge default bodies for unhandled ops (#72)
        match ctx.effect_ops.get(effect_name) {
            some(all_ops) => {
                for op in all_ops {
                    if op.has_default && !handled_op_names.contains(op.name) {
                        match op.default_body {
                            some(dbody) => {
                                let mut dparams: List<Str> = []
                                for p in op.params { dparams.push(safe_ident(p.name)) }
                                let dparams_str = dparams.join(", ")
                                // B-055: Save/restore for default handler body
                                let saved_db = ctx.lines
                                let saved_dbi = ctx.indent_level
                                ctx.lines = []
                                ctx.indent_level = 1
                                let db = gen_expr(ctx, dbody)
                                let db_lines = ctx.lines
                                ctx.lines = saved_db
                                ctx.indent_level = saved_dbi
                                if db_lines.len() > 0 {
                                    let mut db_parts: List<Str> = []
                                    db_parts.push("${ev_name}.${safe_ident(op.name)} = (${dparams_str}) => {")
                                    db_parts.extend(db_lines)
                                    db_parts.push("  return ${db};")
                                    db_parts.push("};")
                                    ev_decls.push(db_parts.join("\n"))
                                } else {
                                    ev_decls.push("${ev_name}.${safe_ident(op.name)} = (${dparams_str}) => (${db});")
                                }
                            },
                            none => {},
                        }
                    }
                }
            },
            none => {},
        }
    }

    let mut ev_param_names: List<Str> = []
    let mut sorted_by_eff = by_effect.entries()
    sorted_by_eff.sort_by(fn(a, b) { if a.0 < b.0 { -1 } else if a.0 > b.0 { 1 } else { 0 } })
    for entry in sorted_by_eff {
        let (ename, _) = entry
        ev_param_names.push(evidence_param_name(ename))
    }
    ev_param_names.sort()
    let ev_args = ev_param_names.join(", ")
    let body_code = gen_handle_body(ctx, body, ev_args)
    let decls = ev_decls.join(" ")
    let ea = RUNTIME_EFFECT_ABORT

    if has_abort {
        // Build effect name check condition
        let mut effect_checks: List<Str> = []
        for en in abort_effect_names {
            effect_checks.push("__ring_e.effect === ${q}${en}${q}")
        }
        let effect_cond = effect_checks.join(" || ")
        let mut p: List<Str> = []
        p.push("(function() { ")
        p.push(decls)
        p.push(" try { return ")
        p.push(body_code)
        p.push("; } catch (__ring_e) { if (__ring_e instanceof ")
        p.push(ea)
        p.push(" && (${effect_cond})")
        p.push(") return __ring_e.value; throw __ring_e; } })()")
        p.join("")
    } else {
        "(function() { ${decls} return ${body_code}; })()"
    }
}

fn gen_handle_body(mut ctx: CodegenCtx, expr: HExpr, ev_params: Str) -> Str {
    match expr {
        HExpr::Block { stmts, tail, .. } => {
            match tail {
                some(t) => {
                    if stmts.len() == 0 {
                        // B-055: Save/restore to capture emit()-based match/if in handle body
                        let saved_lines = ctx.lines
                        let saved_indent = ctx.indent_level
                        ctx.lines = []
                        ctx.indent_level = 1
                        let b = gen_expr(ctx, t)
                        let inner_lines = ctx.lines
                        ctx.lines = saved_lines
                        ctx.indent_level = saved_indent
                        if inner_lines.len() == 0 {
                            return "(function(${ev_params}) { return ${b}; })(${ev_params})"
                        } else {
                            let mut r: List<Str> = []
                            r.push("(function(${ev_params}) {")
                            r.extend(inner_lines)
                            r.push("  return ${b};")
                            r.push("})(${ev_params})")
                            return r.join("\n")
                        }
                    }
                },
                none => {},
            }
            let saved_lines = ctx.lines
            let saved_indent = ctx.indent_level
            ctx.lines = []
            ctx.indent_level = 1
            emit_block_body(ctx, expr)
            let body_lines = ctx.lines
            ctx.lines = saved_lines
            ctx.indent_level = saved_indent
            let mut result: List<Str> = []
            result.push("(function(${ev_params}) {")
            result.extend(body_lines)
            result.push("})(${ev_params})")
            result.join("\n")
        },
        _ => {
            // B-055: Save/restore to capture emit()-based match/if in handle body
            let saved_lines = ctx.lines
            let saved_indent = ctx.indent_level
            ctx.lines = []
            ctx.indent_level = 1
            let b = gen_expr(ctx, expr)
            let inner_lines = ctx.lines
            ctx.lines = saved_lines
            ctx.indent_level = saved_indent
            if inner_lines.len() == 0 {
                "(function(${ev_params}) { return ${b}; })(${ev_params})"
            } else {
                let mut r: List<Str> = []
                r.push("(function(${ev_params}) {")
                r.extend(inner_lines)
                r.push("  return ${b};")
                r.push("})(${ev_params})")
                r.join("\n")
            }
        },
    }
}

// ============================================================
// Lambda
// ============================================================

fn gen_lambda(mut ctx: CodegenCtx, params: List<HParam>, body: HExpr, ty: Type) -> Str {
    let mut p_names: List<Str> = []
    for p in params { p_names.push(safe_ident(p.name)) }
    let mut ev_params: List<Str> = []
    match ty {
        Type::FnType { effects, .. } => { ev_params = get_evidence_params(effects) },
        _ => {},
    }
    let mut all: List<Str> = []
    all.extend(p_names)
    all.extend(ev_params)
    let all_str = all.join(", ")
    // B-055: Save/restore ctx.lines so that emit()-based expressions
    // (match labeled-block, if-with-return, block-with-return) inside
    // the lambda body are captured into the lambda function body rather
    // than leaking to the enclosing scope.
    let saved_lines = ctx.lines
    let saved_indent = ctx.indent_level
    ctx.lines = []
    ctx.indent_level = 1
    let b = gen_expr(ctx, body)
    let body_lines = ctx.lines
    ctx.lines = saved_lines
    ctx.indent_level = saved_indent
    if body_lines.len() == 0 {
        "(function(${all_str}) { return ${b}; })"
    } else {
        let mut result: List<Str> = []
        result.push("(function(${all_str}) {")
        result.extend(body_lines)
        result.push("  return ${b};")
        result.push("})")
        result.join("\n")
    }
}

fn gen_lambda_capture_evidence(mut ctx: CodegenCtx, args: List<HExpr>, idx: Int) -> Str {
    match args.get(idx) {
        some(arg) => match arg {
            HExpr::Lambda { params, body, .. } => {
                let mut p_names: List<Str> = []
                for p in params { p_names.push(safe_ident(p.name)) }
                let params_str = p_names.join(", ")
                // B-055: Save/restore to capture emit()-based expressions in lambda body
                let saved_lines = ctx.lines
                let saved_indent = ctx.indent_level
                ctx.lines = []
                ctx.indent_level = 1
                let b = gen_expr(ctx, body)
                let body_lines = ctx.lines
                ctx.lines = saved_lines
                ctx.indent_level = saved_indent
                if body_lines.len() == 0 {
                    "(function(${params_str}) { return ${b}; })"
                } else {
                    let mut result: List<Str> = []
                    result.push("(function(${params_str}) {")
                    result.extend(body_lines)
                    result.push("  return ${b};")
                    result.push("})")
                    result.join("\n")
                }
            },
            _ => {
                let fn_expr = gen_expr(ctx, arg)
                let arg_type = hexpr_type(arg)
                match arg_type {
                    Type::FnType { params, .. } => {
                        let arity = params.len()
                        let mut p_names: List<Str> = []
                        for i in 0..arity { p_names.push("__ring_a${i}") }
                        let ev_args = get_callee_evidence_args(ctx, arg_type, none)
                        let mut all: List<Str> = []
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
