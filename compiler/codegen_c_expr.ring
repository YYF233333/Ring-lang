// B-163 C backend — expression + statement emission (steps 2-3).
// Port of codegen_llvm_expr.ring / codegen_llvm_stmt.ring onto plain C text.
//
// Emission protocol: gen_c_expr emits C statements into ctx.cur_body and
// returns a C expression string holding the value.  Pure constants (Int/Bool
// literals, RING_UNIT) are returned inline; everything else is materialised
// into a hoisted temporary so evaluation ORDER exactly mirrors the LLVM
// backend's SSA sequencing (plan §2.1: statement-ised expressions + temps).
//
// Constructs beyond steps 1-3 (match, struct/enum construction & field
// access, closures, trait dicts, effect handlers) compile to a runtime-panic
// stub — the emitted C always compiles; executing an unported construct
// panics with a precise message.  This is required because single-file
// compilation prepends the whole std prelude to program.decls (checker.ring
// load_prelude), so prelude bodies flow through this backend from step 1.

use types::{Type, EffectRow, type_to_builtin_name, BUILTIN_RANGE}
use ast::{BinOp, UnaryOp, Pattern}
use hir::{HExpr, HStmt, HParam, HMatchArm, HStringInterpPart, HForInDestructure,
    HLetDestructureBinding, DictRef, TraitDispatch, DictDispatchInfo,
    hexpr_type, is_fresh_owned_bool_value}
use codegen_c_ctx::{CCtx, CFnInfo, c_emit, c_raw, fresh_tmp, fresh_i64,
    fresh_dbl, fresh_label, c_local, c_mangle_fn, c_mangle_method,
    c_global_cstr, c_interned_cstr, c_stub_stmt, c_stub_expr,
    c_line_directive, rt_use, rt_known_arity}

// ============================================================
// Type predicate helpers (ports of the codegen_llvm_expr private ones)
// ============================================================

fn is_int_type(ty: Type) -> Bool {
    match ty { Type::IntType => true, _ => false }
}

fn is_float_type(ty: Type) -> Bool {
    match ty { Type::FloatType => true, _ => false }
}

fn is_str_type(ty: Type) -> Bool {
    match ty { Type::StrType => true, _ => false }
}

fn is_bool_type(ty: Type) -> Bool {
    match ty { Type::BoolType => true, _ => false }
}

fn is_unit_type(ty: Type) -> Bool {
    match ty { Type::UnitType => true, _ => false }
}

fn is_int_set(ty: Type) -> Bool {
    match ty {
        Type::StructType { name, type_params } =>
            name == "Set" && type_params.len() == 1 && match type_params[0] {
                Type::IntType => true,
                _ => false,
            },
        _ => false,
    }
}

// B-134 port: structural validation for builtin collection dispatch.
fn is_builtin_collection(ty: Type) -> Bool {
    match ty {
        Type::StructType { name, type_params } => {
            if name == "List" { type_params.len() == 1 }
            else if name == "Map" { type_params.len() == 2 }
            else if name == "Set" { type_params.len() == 1 }
            else { false }
        },
        _ => false,
    }
}

fn is_boxed_def_c(ctx: CCtx, def_id: Int?) -> Bool {
    match def_id {
        some(did) => ctx.boxed_vars.contains(did),
        none => false,
    }
}

// ============================================================
// Main expression dispatch
// ============================================================

pub fn gen_c_expr(mut ctx: CCtx, expr: HExpr) -> Str {
    match expr {
        HExpr::IntLit { value, .. } => "RING_INT(${value})",
        HExpr::FloatLit { value, .. } => {
            rt_use(ctx, "ring_box_float", 1)
            let t = fresh_tmp(ctx)
            // Float→text via the runtime's shortest-round-trip formatter
            // (ring_float_to_str semantics); C's decimal→double conversion
            // reads it back to the identical IEEE value.
            c_emit(ctx, "${t} = ring_box_float(${value});")
            t
        },
        HExpr::StrLit { value, .. } => gen_c_str_lit(ctx, value),
        HExpr::BoolLit { value, .. } => if value { "RING_TRUE" } else { "RING_FALSE" },
        HExpr::Ident { name, resolved_name, def_id, dict_closure_dicts, ty, .. } =>
            gen_c_ident(ctx, name, resolved_name, def_id, dict_closure_dicts, ty),
        HExpr::BinOp { op, left, right, eq_dispatch, ord_dispatch, ty, .. } =>
            gen_c_binop(ctx, op, left, right, eq_dispatch, ord_dispatch, ty),
        HExpr::UnaryOp { op, operand, ty, .. } => gen_c_unaryop(ctx, op, operand, ty),
        HExpr::Call { callee, args, resolved_dicts, dict_dispatch, ty, .. } =>
            gen_c_call(ctx, callee, args, resolved_dicts, dict_dispatch, ty),
        HExpr::FieldAccess { receiver, field, ty, .. } =>
            gen_c_field_access(ctx, receiver, field, ty),
        HExpr::StructLit { name, .. } =>
            c_stub_expr(ctx, "struct literal (${name})"),
        HExpr::NamedVariantConstruct { enum_name, variant_name, .. } =>
            c_stub_expr(ctx, "enum construction (${enum_name}::${variant_name})"),
        HExpr::MatchExpr { .. } =>
            c_stub_expr(ctx, "match expression"),
        HExpr::Block { stmts, tail, .. } => gen_c_block(ctx, stmts, tail),
        HExpr::IfExpr { condition, then_branch, else_branch, .. } =>
            gen_c_if_expr(ctx, condition, then_branch, else_branch),
        HExpr::StringInterp { parts, .. } => gen_c_string_interp(ctx, parts),
        HExpr::TryCatch { .. } => c_stub_expr(ctx, "try/catch"),
        HExpr::HandleExpr { .. } => c_stub_expr(ctx, "effect handler"),
        HExpr::Lambda { .. } => c_stub_expr(ctx, "lambda/closure"),
        HExpr::EffectOp { effect_name, op_name, .. } =>
            c_stub_expr(ctx, "effect op (${effect_name}.${op_name})"),
        HExpr::RangeExpr { start, end, inclusive, .. } =>
            gen_c_range_expr(ctx, start, end, inclusive),
        HExpr::ListLit { elements, .. } => gen_c_list_lit(ctx, elements),
        HExpr::TupleLit { elements, .. } => gen_c_list_lit(ctx, elements),
        HExpr::IndexExpr { receiver, index, .. } => gen_c_index_expr(ctx, receiver, index),
        HExpr::DictConstruct { .. } => c_stub_expr(ctx, "dynamic trait dict construction"),
        HExpr::Clone { inner, .. } => {
            // Perceus value-level clone: eval, ring_dup, yield the same ptr.
            let v = gen_c_expr(ctx, inner)
            rt_use(ctx, "ring_dup", 1)
            c_emit(ctx, "ring_dup(${v});")
            v
        },
        HExpr::UnsafeBlock { body, .. } => gen_c_expr(ctx, body),
        HExpr::ReturnExpr { value, .. } => {
            // return in expression position (B-113).  handle/try cleanup stack
            // is a step-6 concern (no handle/catch emitted before then).
            match value {
                some(v) => {
                    let val = gen_c_expr(ctx, v)
                    c_emit(ctx, "return ${val};")
                },
                none => c_emit(ctx, "return RING_UNIT;"),
            }
            // Unreachable placeholder (any following C statements are dead).
            "RING_UNIT"
        },
    }
}

fn gen_c_str_lit(mut ctx: CCtx, value: Str) -> Str {
    let g = c_global_cstr(ctx, value)
    rt_use(ctx, "ring_str_from_cstr", 1)
    let t = fresh_tmp(ctx)
    c_emit(ctx, "${t} = ring_str_from_cstr(${g});")
    t
}

// ============================================================
// Identifiers
// ============================================================

fn gen_c_ident(mut ctx: CCtx, name: Str, resolved_name: Str?, def_id: Int?, dict_closure_dicts: List<Str>?, ty: Type) -> Str {
    // #B-087 gap 1: polymorphic function used as first-class value with dicts
    // needs a dict-capturing closure wrapper — step 5.
    match dict_closure_dicts {
        some(dicts) => {
            if dicts.len() > 0 {
                return c_stub_expr(ctx, "fn value with trait dicts (${name})")
            }
        },
        none => {},
    }
    let lookup_name = match resolved_name {
        some(rn) => rn,
        none => name,
    }
    let boxed = is_boxed_def_c(ctx, def_id)
    let found = match ctx.named_values.get(lookup_name) {
        some(cv) => some(cv),
        none => ctx.named_values.get(name),
    }
    match found {
        some(cv) => {
            let t = fresh_tmp(ctx)
            if boxed {
                // B-091 mut-cell: the variable holds the CELL pointer.
                c_emit(ctx, "${t} = *(void**)${cv};")
            } else {
                c_emit(ctx, "${t} = ${cv};")
            }
            t
        },
        none => {
            // Module-level function / const reference.
            let mangled = c_mangle_fn(lookup_name)
            let fn_info = match ctx.functions.get(mangled) {
                some(fi) => some(fi),
                none => ctx.functions.get(c_mangle_fn(name)),
            }
            match fn_info {
                some(fi) => {
                    if fi.total_params == 0 {
                        // Zero-arg const getter / ctor — call it.
                        let t = fresh_tmp(ctx)
                        c_emit(ctx, "${t} = ${fi.c_name}();")
                        t
                    } else {
                        // Bare function value (dictless).  The uniform closure
                        // call ABI is step 5; hand out the raw fn pointer so
                        // the reference itself is representable.
                        let t = fresh_tmp(ctx)
                        c_emit(ctx, "${t} = (void*)${fi.c_name};")
                        t
                    }
                },
                none => panic("C codegen: undefined variable '${name}' (resolved: '${lookup_name}')"),
            }
        },
    }
}

// ============================================================
// Binary operations
// ============================================================

fn gen_c_binop(mut ctx: CCtx, op: BinOp, left: HExpr, right: HExpr, eq_dispatch: TraitDispatch?, ord_dispatch: TraitDispatch?, result_ty: Type) -> Str {
    let op_type = hexpr_type(left)

    // B-104 D7: `&&`/`||` are rewritten to IfExpr by andor_lower before codegen.
    match op {
        BinOp::And => panic("C codegen: BinOp::And must be lowered by andor_lower"),
        BinOp::Or => panic("C codegen: BinOp::Or must be lowered by andor_lower"),
        _ => {},
    }

    // Trait-dispatched Eq/Ord (non-Builtin) — dict dispatch is step 5.
    let is_eq_op = match op { BinOp::Eq => true, BinOp::Neq => true, _ => false }
    let is_ord_op = match op {
        BinOp::Lt => true, BinOp::Lte => true, BinOp::Gt => true, BinOp::Gte => true, _ => false,
    }
    if is_eq_op {
        match eq_dispatch {
            some(d) => match d {
                TraitDispatch::Builtin => {},
                _ => { return c_stub_expr(ctx, "Eq trait dispatch") },
            },
            none => {},
        }
    }
    if is_ord_op {
        match ord_dispatch {
            some(d) => match d {
                TraitDispatch::Builtin => {},
                _ => { return c_stub_expr(ctx, "Ord trait dispatch") },
            },
            none => {},
        }
    }

    let lhs = gen_c_expr(ctx, left)
    let rhs = gen_c_expr(ctx, right)

    if is_int_type(op_type) {
        gen_c_int_binop(ctx, op, lhs, rhs)
    } else if is_float_type(op_type) {
        gen_c_float_binop(ctx, op, lhs, rhs)
    } else if is_str_type(op_type) {
        gen_c_str_binop(ctx, op, lhs, rhs)
    } else if is_bool_type(op_type) {
        gen_c_bool_binop(ctx, op, lhs, rhs)
    } else {
        // Fallback: integer ops (LLVM backend parity).
        gen_c_int_binop(ctx, op, lhs, rhs)
    }
}

// B-148 port: zero-divisor guard before sdiv/srem (UB on both backends).
fn emit_c_divzero_guard(mut ctx: CCtx, rhs: Str) {
    let g = c_interned_cstr(ctx, "integer division by zero")
    rt_use(ctx, "ring_panic", 1)
    rt_use(ctx, "ring_str_from_cstr", 1)
    c_emit(ctx, "if (RING_UNTAG(${rhs}) == 0) { ring_panic(ring_str_from_cstr(${g})); }")
}

fn gen_c_int_binop(mut ctx: CCtx, op: BinOp, lhs: Str, rhs: Str) -> Str {
    let t = fresh_tmp(ctx)
    // RING_IADD/… wrap in unsigned space — LLVM add/sub/mul (no nsw) parity,
    // avoiding C signed-overflow UB.
    match op {
        BinOp::Add => c_emit(ctx, "${t} = RING_INT(RING_IADD(RING_UNTAG(${lhs}), RING_UNTAG(${rhs})));"),
        BinOp::Sub => c_emit(ctx, "${t} = RING_INT(RING_ISUB(RING_UNTAG(${lhs}), RING_UNTAG(${rhs})));"),
        BinOp::Mul => c_emit(ctx, "${t} = RING_INT(RING_IMUL(RING_UNTAG(${lhs}), RING_UNTAG(${rhs})));"),
        BinOp::Div => {
            emit_c_divzero_guard(ctx, rhs)
            c_emit(ctx, "${t} = RING_INT(RING_UNTAG(${lhs}) / RING_UNTAG(${rhs}));")
        },
        BinOp::Mod => {
            emit_c_divzero_guard(ctx, rhs)
            c_emit(ctx, "${t} = RING_INT(RING_UNTAG(${lhs}) % RING_UNTAG(${rhs}));")
        },
        BinOp::Eq => c_emit(ctx, "${t} = RING_BOOL(RING_UNTAG(${lhs}) == RING_UNTAG(${rhs}));"),
        BinOp::Neq => c_emit(ctx, "${t} = RING_BOOL(RING_UNTAG(${lhs}) != RING_UNTAG(${rhs}));"),
        BinOp::Lt => c_emit(ctx, "${t} = RING_BOOL(RING_UNTAG(${lhs}) < RING_UNTAG(${rhs}));"),
        BinOp::Lte => c_emit(ctx, "${t} = RING_BOOL(RING_UNTAG(${lhs}) <= RING_UNTAG(${rhs}));"),
        BinOp::Gt => c_emit(ctx, "${t} = RING_BOOL(RING_UNTAG(${lhs}) > RING_UNTAG(${rhs}));"),
        BinOp::Gte => c_emit(ctx, "${t} = RING_BOOL(RING_UNTAG(${lhs}) >= RING_UNTAG(${rhs}));"),
        BinOp::And => panic("C codegen: BinOp::And lowered by andor_lower — unreachable"),
        BinOp::Or => panic("C codegen: BinOp::Or lowered by andor_lower — unreachable"),
    }
    t
}

fn gen_c_float_binop(mut ctx: CCtx, op: BinOp, lhs: Str, rhs: Str) -> Str {
    rt_use(ctx, "ring_unbox_float", 1)
    // Unbox once into double temps (evaluation order parity with LLVM).
    let ld = fresh_dbl(ctx)
    let rd = fresh_dbl(ctx)
    c_emit(ctx, "${ld} = ring_unbox_float(${lhs});")
    c_emit(ctx, "${rd} = ring_unbox_float(${rhs});")
    let t = fresh_tmp(ctx)
    match op {
        BinOp::Add => { rt_use(ctx, "ring_box_float", 1); c_emit(ctx, "${t} = ring_box_float(${ld} + ${rd});") },
        BinOp::Sub => { rt_use(ctx, "ring_box_float", 1); c_emit(ctx, "${t} = ring_box_float(${ld} - ${rd});") },
        BinOp::Mul => { rt_use(ctx, "ring_box_float", 1); c_emit(ctx, "${t} = ring_box_float(${ld} * ${rd});") },
        BinOp::Div => { rt_use(ctx, "ring_box_float", 1); c_emit(ctx, "${t} = ring_box_float(${ld} / ${rd});") },
        BinOp::Mod => { rt_use(ctx, "ring_box_float", 1); c_emit(ctx, "${t} = ring_box_float(fmod(${ld}, ${rd}));") },
        BinOp::Eq => c_emit(ctx, "${t} = RING_BOOL(${ld} == ${rd});"),
        // LLVM ONE (ordered-not-equal): NaN operands compare false.
        // C `!=` is UNordered-true, so use (a<b || a>b).
        BinOp::Neq => c_emit(ctx, "${t} = RING_BOOL(${ld} < ${rd} || ${ld} > ${rd});"),
        BinOp::Lt => c_emit(ctx, "${t} = RING_BOOL(${ld} < ${rd});"),
        BinOp::Lte => c_emit(ctx, "${t} = RING_BOOL(${ld} <= ${rd});"),
        BinOp::Gt => c_emit(ctx, "${t} = RING_BOOL(${ld} > ${rd});"),
        BinOp::Gte => c_emit(ctx, "${t} = RING_BOOL(${ld} >= ${rd});"),
        _ => panic("C codegen: unsupported float binop"),
    }
    t
}

fn gen_c_str_binop(mut ctx: CCtx, op: BinOp, lhs: Str, rhs: Str) -> Str {
    let t = fresh_tmp(ctx)
    match op {
        BinOp::Eq => {
            rt_use(ctx, "ring_str_eq", 2)
            c_emit(ctx, "${t} = RING_BOOL(ring_str_eq(${lhs}, ${rhs}));")
        },
        BinOp::Neq => {
            rt_use(ctx, "ring_str_eq", 2)
            c_emit(ctx, "${t} = RING_BOOL(1 - ring_str_eq(${lhs}, ${rhs}));")
        },
        BinOp::Lt => {
            rt_use(ctx, "ring_str_lt", 2)
            c_emit(ctx, "${t} = RING_BOOL(ring_str_lt(${lhs}, ${rhs}));")
        },
        BinOp::Gt => {
            rt_use(ctx, "ring_str_lt", 2)
            c_emit(ctx, "${t} = RING_BOOL(ring_str_lt(${rhs}, ${lhs}));")
        },
        BinOp::Lte => {
            // a <= b  ≡  !(b < a)
            rt_use(ctx, "ring_str_lt", 2)
            c_emit(ctx, "${t} = RING_BOOL(1 - ring_str_lt(${rhs}, ${lhs}));")
        },
        BinOp::Gte => {
            // a >= b  ≡  !(a < b)
            rt_use(ctx, "ring_str_lt", 2)
            c_emit(ctx, "${t} = RING_BOOL(1 - ring_str_lt(${lhs}, ${rhs}));")
        },
        _ => panic("C codegen: unsupported str binop"),
    }
    t
}

fn gen_c_bool_binop(mut ctx: CCtx, op: BinOp, lhs: Str, rhs: Str) -> Str {
    let t = fresh_tmp(ctx)
    match op {
        BinOp::Eq => c_emit(ctx, "${t} = RING_BOOL(RING_UNTAG(${lhs}) == RING_UNTAG(${rhs}));"),
        BinOp::Neq => c_emit(ctx, "${t} = RING_BOOL(RING_UNTAG(${lhs}) != RING_UNTAG(${rhs}));"),
        _ => panic("C codegen: unsupported bool binop"),
    }
    t
}

// ============================================================
// Unary operations
// ============================================================

fn gen_c_unaryop(mut ctx: CCtx, op: UnaryOp, operand: HExpr, ty: Type) -> Str {
    let v = gen_c_expr(ctx, operand)
    let t = fresh_tmp(ctx)
    match op {
        UnaryOp::Neg => {
            if is_int_type(ty) {
                c_emit(ctx, "${t} = RING_INT(RING_INEG(RING_UNTAG(${v})));")
            } else {
                rt_use(ctx, "ring_unbox_float", 1)
                rt_use(ctx, "ring_box_float", 1)
                c_emit(ctx, "${t} = ring_box_float(0.0 - ring_unbox_float(${v}));")
            }
        },
        UnaryOp::Not => {
            c_emit(ctx, "${t} = RING_BOOL(1 - RING_UNTAG(${v}));")
        },
    }
    t
}

// ============================================================
// Calls
// ============================================================

// #B-087 gap 5 port: mut value-type args are passed as a shared CELL.
fn c_lookup_call_mut_flags(ctx: CCtx, callee: HExpr) -> List<Bool>? {
    match callee {
        HExpr::Ident { name, resolved_name, .. } => {
            let call_name = match resolved_name {
                some(rn) => rn,
                none => name,
            }
            ctx.fn_mut_params.get(call_name)
        },
        HExpr::FieldAccess { receiver, field, .. } => {
            let recv_type = hexpr_type(receiver)
            let type_name = match type_to_builtin_name(recv_type) {
                some(n) => n,
                none => match recv_type {
                    Type::StructType { name, .. } => name,
                    Type::EnumType { name, .. } => name,
                    _ => "",
                },
            }
            if type_name == "" {
                none
            } else {
                let ufcs_name = "${type_name}_${field}"
                match ctx.fn_mut_params.get(ufcs_name) {
                    some(flags) => {
                        // Drop the leading self flag so the list aligns with args.
                        let mut shifted: List<Bool> = []
                        let mut i = 1
                        while i < flags.len() {
                            match flags.get(i) {
                                some(f) => shifted.push(f),
                                none => {},
                            }
                            i = i + 1
                        }
                        some(shifted)
                    },
                    none => none,
                }
            }
        },
        _ => none,
    }
}

fn gen_c_mut_arg(mut ctx: CCtx, arg: HExpr) -> Str {
    match arg {
        HExpr::Ident { name, resolved_name, def_id, .. } => {
            if is_boxed_def_c(ctx, def_id) {
                // Already a shared cell: pass the cell pointer itself.
                let lookup_name = match resolved_name {
                    some(rn) => rn,
                    none => name,
                }
                let found = match ctx.named_values.get(lookup_name) {
                    some(cv) => some(cv),
                    none => ctx.named_values.get(name),
                }
                match found {
                    some(cv) => {
                        let t = fresh_tmp(ctx)
                        c_emit(ctx, "${t} = ${cv};")
                        t
                    },
                    none => {
                        let v = gen_c_expr(ctx, arg)
                        gen_c_cell_alloc(ctx, v)
                    },
                }
            } else {
                let v = gen_c_expr(ctx, arg)
                gen_c_cell_alloc(ctx, v)
            }
        },
        _ => {
            let v = gen_c_expr(ctx, arg)
            gen_c_cell_alloc(ctx, v)
        },
    }
}

// B-091 mut-cell: single-slot heap cell { void* value }, typeid 14 (CELL).
pub fn gen_c_cell_alloc(mut ctx: CCtx, init_val: Str) -> Str {
    rt_use(ctx, "ring_alloc", 2)
    let t = fresh_tmp(ctx)
    c_emit(ctx, "${t} = ring_alloc((int64_t)sizeof(void*), 14);")
    c_emit(ctx, "*(void**)${t} = ${init_val};")
    t
}

fn c_resolve_dict_ref(mut ctx: CCtx, dr: DictRef) -> Str {
    // Step-5 placeholder: Simple refs resolve through scope (dict params /
    // dict locals when present); Static/Wrapped singletons need the memoised
    // getter machinery — pass NULL until step 5 (dispatch through them is a
    // stub anyway).
    match dr {
        DictRef::Simple(n) => {
            match ctx.named_values.get(n) {
                some(cv) => cv,
                none => "RING_UNIT",
            }
        },
        _ => "RING_UNIT",
    }
}

fn c_lookup_evidence(mut ctx: CCtx, ep_name: Str) -> Str {
    // Evidence param in scope → pass it; default evidence (B-097) is step 6 —
    // NULL for io/fail/unhandled effects (runtime handles those).
    match ctx.named_values.get(ep_name) {
        some(cv) => cv,
        none => "RING_UNIT",
    }
}

fn gen_c_call(mut ctx: CCtx, callee: HExpr, args: List<HExpr>, resolved_dicts: List<DictRef>, dict_dispatch: DictDispatchInfo?, result_ty: Type) -> Str {
    // Dict dispatch (trait method through dict param) — step 5.
    match dict_dispatch {
        some(_) => { return c_stub_expr(ctx, "trait dict dispatch call") },
        none => {},
    }

    let mut_flags = c_lookup_call_mut_flags(ctx, callee)

    // Evaluate all args first (mut value-type positions box into cells).
    let mut arg_vals: List<Str> = []
    let mut argi = 0
    for a in args {
        let is_mut = match mut_flags {
            some(flags) => match flags.get(argi) { some(f) => f, none => false },
            none => false,
        }
        if is_mut {
            arg_vals.push(gen_c_mut_arg(ctx, a))
        } else {
            arg_vals.push(gen_c_expr(ctx, a))
        }
        argi = argi + 1
    }

    let mut dict_vals: List<Str> = []
    for dr in resolved_dicts {
        dict_vals.push(c_resolve_dict_ref(ctx, dr))
    }

    let raw = match callee {
        HExpr::Ident { name, resolved_name, .. } => {
            let call_name = match resolved_name {
                some(rn) => rn,
                none => name,
            }
            // #132 print parity: coerce scalar args to Str.
            if call_name == "print" && args.len() == 1 {
                match args.get(0) {
                    some(arg0) => {
                        let arg_ty = hexpr_type(arg0)
                        if is_int_type(arg_ty) || is_float_type(arg_ty) || is_bool_type(arg_ty) {
                            match arg_vals.get(0) {
                                some(av) => {
                                    let coerced = convert_c_to_str(ctx, av, arg_ty)
                                    rt_use(ctx, "ring_print", 1)
                                    let t = fresh_tmp(ctx)
                                    c_emit(ctx, "${t} = ring_print(${coerced});")
                                    return if is_unit_type(result_ty) { "RING_UNIT" } else { t }
                                },
                                none => {},
                            }
                        }
                    },
                    none => {},
                }
            }
            let final_name = if call_name == "set_new" && is_int_set(result_ty) {
                "set_int_new"
            } else if call_name == "set_from" && is_int_set(result_ty) {
                "set_int_from"
            } else {
                call_name
            }
            gen_c_direct_call(ctx, final_name, arg_vals, dict_vals)
        },
        HExpr::FieldAccess { receiver, field, .. } => {
            let recv_val = gen_c_expr(ctx, receiver)
            let recv_type = hexpr_type(receiver)
            gen_c_method_call(ctx, recv_val, recv_type, field, arg_vals, dict_vals)
        },
        _ => {
            // Closure value call — uniform closure ABI is step 5.
            c_stub_expr(ctx, "closure call")
        },
    }
    // B-118: Unit-typed call results must be null, never the ABI
    // receiver-return accident.
    if is_unit_type(result_ty) {
        "RING_UNIT"
    } else {
        raw
    }
}

// Ring extern fn name → C runtime name (verbatim port of extern_fn_to_runtime).
fn extern_fn_to_runtime_c(name: Str) -> Str? {
    if name == "print" { return some("ring_print") }
    if name == "panic" { return some("ring_panic") }
    if name == "eprintln" { return some("ring_eprintln") }
    if name == "exit" || name == "exit_process" { return some("ring_exit") }
    if name == "argv" { return some("ring_args") }
    if name == "map_new" { return some("ring_map_new") }
    if name == "set_new" { return some("ring_set_new") }
    if name == "read_file" { return some("ring_read_file") }
    if name == "write_file" { return some("ring_write_file") }
    if name == "file_exists" { return some("ring_file_exists") }
    if name == "delete_file" { return some("ring_delete_file") }
    if name == "path_join" { return some("ring_path_join") }
    if name == "path_resolve" { return some("ring_path_resolve") }
    if name == "path_dirname" { return some("ring_path_dirname") }
    if name == "path_basename" { return some("ring_path_basename") }
    if name == "path_extname" { return some("ring_path_extname") }
    if name == "cwd" { return some("ring_cwd") }
    if name == "parse_int" { return some("ring_parse_int") }
    if name == "parse_float" { return some("ring_parse_float") }
    if name == "set_from" { return some("ring_set_from_list") }
    if name == "map_from" { return some("ring_map_from") }
    if name == "__ring_raise_fail" { return some("__ring_raise_fail") }
    if name == "set_int_new" { return some("ring_set_int_new") }
    if name == "set_int_from" { return some("ring_set_int_from_list") }
    if name == "Cell" { return some("ring_Cell_new") }
    // B-125: Ptr<T> builtins
    if name == "alloc" { return some("ring_raw_alloc") }
    if name == "dealloc" { return some("ring_raw_dealloc") }
    if name == "ptr_copy" { return some("ring_ptr_copy") }
    // B-152: StringBuilder RIIR bridge functions
    if name == "ring_str_as_ptr" { return some("ring_str_as_ptr") }
    if name == "ring_str_from_ptr" { return some("ring_str_from_ptr") }
    if name == "ring_buf_alloc" { return some("ring_buf_alloc") }
    if name == "ring_buf_dealloc" { return some("ring_buf_dealloc") }
    if name == "ring_buf_grow" { return some("ring_buf_grow") }
    if name == "ring_buf_copy_at" { return some("ring_buf_copy_at") }
    if name == "ring_buf_set_byte" { return some("ring_buf_set_byte") }
    if name == "ring_buf_get_byte" { return some("ring_buf_get_byte") }
    if name == "ring_buf_alloc_zeroed" { return some("ring_buf_alloc_zeroed") }
    none
}

// Runtime functions with a void return in the C ABI.
fn is_void_runtime_fn_c(name: Str) -> Bool {
    if name == "ring_catch_pop" { true }
    else if name == "ring_raise" { true }
    else if name == "ring_raw_dealloc" { true }
    else if name == "ring_ptr_copy" { true }
    else if name == "ring_dup" { true }
    else if name == "ring_drop" { true }
    else { false }
}

// Emit a runtime call; returns the value expression (RING_UNIT for void fns).
fn gen_c_runtime_call(mut ctx: CCtx, name: Str, args: List<Str>) -> Str {
    rt_use(ctx, name, args.len())
    if is_void_runtime_fn_c(name) {
        c_emit(ctx, "${name}(${args.join(", ")});")
        "RING_UNIT"
    } else {
        let t = fresh_tmp(ctx)
        c_emit(ctx, "${t} = ${name}(${args.join(", ")});")
        t
    }
}

fn gen_c_direct_call(mut ctx: CCtx, name: Str, arg_vals: List<Str>, dict_vals: List<Str>) -> Str {
    // B-125: ptr_from_addr — pure codegen identity (untag Int → raw address).
    if name == "ptr_from_addr" {
        let a = match arg_vals.get(0) { some(v) => v, none => panic("ptr_from_addr: missing arg") }
        let t = fresh_tmp(ctx)
        c_emit(ctx, "${t} = (void*)(intptr_t)RING_UNTAG(${a});")
        return t
    }

    // Known extern fn → runtime mapping.
    match extern_fn_to_runtime_c(name) {
        some(rtn) => { return gen_c_runtime_call(ctx, rtn, arg_vals) },
        none => {},
    }

    // Ring function lookup.
    let mangled = c_mangle_fn(name)
    match ctx.functions.get(mangled) {
        some(fi) => {
            let mut call_args: List<Str> = []
            for a in arg_vals { call_args.push(a) }
            for dv in dict_vals { call_args.push(dv) }
            match ctx.fn_evidence_params.get(mangled) {
                some(ev_params) => {
                    for ep in ev_params {
                        call_args.push(c_lookup_evidence(ctx, ep))
                    }
                },
                none => {},
            }
            let t = fresh_tmp(ctx)
            c_emit(ctx, "${t} = ${fi.c_name}(${call_args.join(", ")});")
            t
        },
        none => {
            // Closure variable (lambda param) — step 5.
            match ctx.named_values.get(name) {
                some(_) => c_stub_expr(ctx, "closure call (${name})"),
                none => {
                    // Runtime fallback: ring_<name> if it's a known runtime fn.
                    let rt_fallback = "ring_${name}"
                    match rt_known_arity(rt_fallback) {
                        some(_) => {
                            if rt_fallback == "ring_assert" {
                                let first = match arg_vals.get(0) { some(v) => v, none => panic("ring_assert: missing arg 0") }
                                let second = match arg_vals.get(1) { some(v) => v, none => panic("ring_assert: missing arg 1") }
                                return gen_c_runtime_call(ctx, "ring_assert", ["RING_COND(${first})", second])
                            }
                            gen_c_runtime_call(ctx, rt_fallback, arg_vals)
                        },
                        none => {
                            // B-152: unknown extern fn — declare with the uniform
                            // boxed ABI and let the linker resolve.
                            gen_c_runtime_call(ctx, name, arg_vals)
                        },
                    }
                },
            }
        },
    }
}

// ============================================================
// Method calls (ports of method_to_runtime + the unbox/box tables)
// ============================================================

fn rt_method_returns_i64_c(name: Str) -> Bool {
    // In the C backend every entry below returns int64_t (see rt_sig);
    // call sites re-box via RING_INT / RING_BOOL.
    if name == "ring_str_len" { return true }
    if name == "ring_str_contains" { return true }
    if name == "ring_str_starts_with" { return true }
    if name == "ring_str_ends_with" { return true }
    if name == "ring_str_eq" { return true }
    if name == "ring_str_lt" { return true }
    if name == "ring_str_is_empty" { return true }
    if name == "ring_list_len" { return true }
    if name == "ring_list_is_empty" { return true }
    if name == "ring_list_any" { return true }
    if name == "ring_list_all" { return true }
    if name == "ring_Option_is_some" { return true }
    if name == "ring_Option_is_none" { return true }
    if name == "ring_map_has" { return true }
    if name == "ring_map_len" { return true }
    if name == "ring_set_has" { return true }
    if name == "ring_set_len" { return true }
    if name == "ring_sb_len" { return true }
    if name == "ring_map_is_empty" { return true }
    if name == "ring_set_int_has" { return true }
    if name == "ring_set_int_len" { return true }
    if name == "ring_set_is_empty" { return true }
    if name == "ring_set_int_is_empty" { return true }
    if name == "ring_map_any" { return true }
    if name == "ring_set_any" { return true }
    if name == "ring_set_all" { return true }
    if name == "ring_set_int_any" { return true }
    if name == "ring_set_int_all" { return true }
    false
}

fn rt_method_returns_bool_c(name: Str) -> Bool {
    if name == "ring_str_contains" { return true }
    if name == "ring_str_starts_with" { return true }
    if name == "ring_str_ends_with" { return true }
    if name == "ring_str_eq" { return true }
    if name == "ring_str_lt" { return true }
    if name == "ring_list_is_empty" { return true }
    if name == "ring_map_has" { return true }
    if name == "ring_set_has" { return true }
    if name == "ring_list_any" { return true }
    if name == "ring_list_all" { return true }
    if name == "ring_Option_is_some" { return true }
    if name == "ring_Option_is_none" { return true }
    if name == "ring_set_int_has" { return true }
    if name == "ring_map_is_empty" { return true }
    if name == "ring_set_is_empty" { return true }
    if name == "ring_set_int_is_empty" { return true }
    if name == "ring_str_is_empty" { return true }
    if name == "ring_map_any" { return true }
    if name == "ring_set_any" { return true }
    if name == "ring_set_all" { return true }
    if name == "ring_set_int_any" { return true }
    if name == "ring_set_int_all" { return true }
    false
}

fn rt_method_int_arg_count_c(name: Str) -> Int {
    if name == "ring_list_get" { return 1 }
    if name == "ring_list_get_opt" { return 1 }
    if name == "ring_str_get" { return 1 }
    if name == "ring_str_slice" { return 2 }
    if name == "ring_list_slice" { return 2 }
    if name == "ring_list_set" { return 1 }
    if name == "ring_str_char_at" { return 1 }
    if name == "ring_str_char_code_at" { return 1 }
    if name == "ring_str_pad_start" { return 1 }
    if name == "ring_str_pad_end" { return 1 }
    if name == "ring_str_repeat" { return 1 }
    if name == "ring_sb_add_int" { return 1 }
    0
}

fn rt_method_needs_recv_unbox_int_c(name: Str) -> Bool {
    name == "ring_int_to_str"
}

fn rt_method_needs_recv_unbox_float_c(name: Str) -> Bool {
    name == "ring_float_to_str"
}

fn rt_method_needs_recv_unbox_bool_c(name: Str) -> Bool {
    name == "ring_bool_to_str"
}

fn method_to_runtime_c(type_name: Str, method: Str) -> Str? {
    // Str methods
    if type_name == "Str" && method == "len" { return some("ring_str_len") }
    if type_name == "Str" && method == "contains" { return some("ring_str_contains") }
    if type_name == "Str" && method == "starts_with" { return some("ring_str_starts_with") }
    if type_name == "Str" && method == "ends_with" { return some("ring_str_ends_with") }
    if type_name == "Str" && method == "slice" { return some("ring_str_slice") }
    if type_name == "Str" && method == "split" { return some("ring_str_split") }
    if type_name == "Str" && method == "replace" { return some("ring_str_replace") }
    if type_name == "Str" && method == "get" { return some("ring_str_get") }
    if type_name == "Str" && method == "trim" { return some("ring_str_trim") }
    if type_name == "Str" && method == "trim_start" { return some("ring_str_trim_start") }
    if type_name == "Str" && method == "trim_end" { return some("ring_str_trim_end") }
    if type_name == "Str" && method == "to_upper" { return some("ring_str_to_upper") }
    if type_name == "Str" && method == "to_lower" { return some("ring_str_to_lower") }
    if type_name == "Str" && method == "char_at" { return some("ring_str_char_at") }
    if type_name == "Str" && method == "char_code_at" { return some("ring_str_char_code_at") }
    if type_name == "Str" && method == "index_of" { return some("ring_str_index_of") }
    if type_name == "Str" && method == "pad_start" { return some("ring_str_pad_start") }
    if type_name == "Str" && method == "pad_end" { return some("ring_str_pad_end") }
    if type_name == "Str" && method == "repeat" { return some("ring_str_repeat") }
    if type_name == "Str" && method == "is_empty" { return some("ring_str_is_empty") }
    if type_name == "Str" && method == "last_index_of" { return some("ring_str_last_index_of") }
    // Scalar to_str
    if type_name == "Int" && method == "to_str" { return some("ring_int_to_str") }
    if type_name == "Float" && method == "to_str" { return some("ring_float_to_str") }
    if type_name == "Bool" && method == "to_str" { return some("ring_bool_to_str") }
    // B-152 P2: List methods are pure Ring — no entries (fall through to
    // the Ring-compiled impl methods).
    // B-152 P3: Map method calls still route through C++ bootstrap shims.
    if type_name == "Map" && method == "get" { return some("ring_map_get_opt") }
    if type_name == "Map" && method == "insert" { return some("ring_map_set") }
    if type_name == "Map" && method == "contains_key" { return some("ring_map_has") }
    if type_name == "Map" && method == "keys" { return some("ring_map_keys") }
    if type_name == "Map" && method == "values" { return some("ring_map_values") }
    if type_name == "Map" && method == "entries" { return some("ring_map_entries") }
    if type_name == "Map" && method == "len" { return some("ring_map_len") }
    if type_name == "Map" && method == "remove" { return some("ring_map_delete") }
    if type_name == "Map" && method == "is_empty" { return some("ring_map_is_empty") }
    if type_name == "Map" && method == "for_each" { return some("ring_map_for_each") }
    if type_name == "Map" && method == "clear" { return some("ring_map_clear") }
    if type_name == "Map" && method == "fold" { return some("ring_map_fold") }
    if type_name == "Map" && method == "filter" { return some("ring_map_filter") }
    if type_name == "Map" && method == "any" { return some("ring_map_any") }
    if type_name == "Map" && method == "map_values" { return some("ring_map_map_values") }
    // Set methods
    if type_name == "Set" && method == "add" { return some("ring_set_add") }
    if type_name == "Set" && method == "insert" { return some("ring_set_add") }
    if type_name == "Set" && method == "has" { return some("ring_set_has") }
    if type_name == "Set" && method == "contains" { return some("ring_set_has") }
    if type_name == "Set" && method == "to_list" { return some("ring_set_to_list") }
    if type_name == "Set" && method == "len" { return some("ring_set_len") }
    if type_name == "Set" && method == "is_empty" { return some("ring_set_is_empty") }
    if type_name == "Set" && method == "from_list" { return some("ring_set_from_list") }
    if type_name == "Set" && method == "for_each" { return some("ring_set_for_each") }
    if type_name == "Set" && method == "remove" { return some("ring_set_delete") }
    if type_name == "Set" && method == "clear" { return some("ring_set_clear") }
    if type_name == "Set" && method == "union" { return some("ring_set_union") }
    if type_name == "Set" && method == "intersect" { return some("ring_set_intersect") }
    if type_name == "Set" && method == "difference" { return some("ring_set_difference") }
    if type_name == "Set" && method == "fold" { return some("ring_set_fold") }
    if type_name == "Set" && method == "filter" { return some("ring_set_filter") }
    if type_name == "Set" && method == "any" { return some("ring_set_any") }
    if type_name == "Set" && method == "all" { return some("ring_set_all") }
    // Option methods
    if type_name == "Option" && method == "unwrap_or" { return some("ring_Option_unwrap_or") }
    if type_name == "Option" && method == "unwrap" { return some("ring_Option_unwrap") }
    if type_name == "Option" && method == "is_some" { return some("ring_Option_is_some") }
    if type_name == "Option" && method == "is_none" { return some("ring_Option_is_none") }
    if type_name == "Option" && method == "map" { return some("ring_Option_map") }
    if type_name == "Option" && method == "and_then" { return some("ring_Option_and_then") }
    if type_name == "Option" && method == "unwrap_or_else" { return some("ring_Option_unwrap_or_else") }
    if type_name == "Option" && method == "to_fail" { return some("ring_Option_to_fail") }
    // Cell methods
    if type_name == "Cell" && method == "get" { return some("ring_Cell_get") }
    if type_name == "Cell" && method == "set" { return some("ring_Cell_set") }
    if type_name == "Cell" && method == "update" { return some("ring_Cell_update") }
    none
}

// B-125 Ptr<T> methods — inline C (no runtime call), port of gen_ptr_method.
fn gen_c_ptr_method(mut ctx: CCtx, recv: Str, recv_type: Type, method: Str, args: List<Str>) -> Str {
    if method == "read" {
        let t = fresh_tmp(ctx)
        c_emit(ctx, "${t} = *(void**)${recv};")
        let pointee_ty = match recv_type {
            Type::PtrType { pointee } => pointee,
            _ => Type::AnyType,
        }
        let needs_dup = match pointee_ty {
            Type::IntType => false,
            Type::FloatType => false,
            Type::BoolType => false,
            Type::UnitType => false,
            Type::PtrType { .. } => false,
            _ => true,
        }
        if needs_dup {
            rt_use(ctx, "ring_dup", 1)
            c_emit(ctx, "ring_dup(${t});")
        }
        return t
    }
    if method == "take" {
        let t = fresh_tmp(ctx)
        c_emit(ctx, "${t} = *(void**)${recv};")
        return t
    }
    if method == "write" {
        let v = match args.get(0) { some(a) => a, none => panic("Ptr.write: missing arg") }
        c_emit(ctx, "*(void**)${recv} = ${v};")
        return "RING_UNIT"
    }
    if method == "offset" {
        let i = match args.get(0) { some(a) => a, none => panic("Ptr.offset: missing arg") }
        let t = fresh_tmp(ctx)
        c_emit(ctx, "${t} = (void*)((void**)${recv} + RING_UNTAG(${i}));")
        return t
    }
    if method == "cast" {
        return recv
    }
    if method == "addr" {
        let t = fresh_tmp(ctx)
        c_emit(ctx, "${t} = RING_INT((int64_t)(intptr_t)${recv});")
        return t
    }
    eprintln("C codegen warning: unknown Ptr method '${method}', generating panic")
    c_stub_expr(ctx, "Ptr method (${method})")
}

fn gen_c_method_call(mut ctx: CCtx, recv: Str, recv_type: Type, method: Str, args: List<Str>, dict_vals: List<Str>) -> Str {
    let type_name = match type_to_builtin_name(recv_type) {
        some(n) => n,
        none => {
            match recv_type {
                Type::StructType { name, .. } => name,
                Type::EnumType { name, .. } => name,
                _ => "Unknown",
            }
        },
    }

    if type_name == "Ptr" {
        return gen_c_ptr_method(ctx, recv, recv_type, method, args)
    }

    // B-134: only dispatch to runtime builtins for structurally-valid
    // builtin collections.
    let rt_method = if (type_name == "List" || type_name == "Map" || type_name == "Set") && !is_builtin_collection(recv_type) {
        none
    } else {
        method_to_runtime_c(type_name, method)
    }
    match rt_method {
        some(base_rt_name) => {
            // Int-keyed Set dispatch (B-152 P3: Map is unified, Set is not yet).
            let rt_name = if is_int_set(recv_type) {
                match method {
                    "add" => "ring_set_int_add",
                    "insert" => "ring_set_int_add",
                    "has" => "ring_set_int_has",
                    "contains" => "ring_set_int_has",
                    "to_list" => "ring_set_int_to_list",
                    "len" => "ring_set_int_len",
                    "from_list" => "ring_set_int_from_list",
                    "for_each" => "ring_set_int_for_each",
                    "remove" => "ring_set_int_delete",
                    "clear" => "ring_set_int_clear",
                    "clone" => "ring_set_int_clone",
                    "is_empty" => "ring_set_int_is_empty",
                    "union" => "ring_set_int_union",
                    "intersect" => "ring_set_int_intersect",
                    "difference" => "ring_set_int_difference",
                    "fold" => "ring_set_int_fold",
                    "filter" => "ring_set_int_filter",
                    "any" => "ring_set_int_any",
                    "all" => "ring_set_int_all",
                    _ => base_rt_name,
                }
            } else { base_rt_name }

            let mut call_args: List<Str> = []
            // Receiver (unboxed for Int/Float/Bool to_str).
            if rt_method_needs_recv_unbox_int_c(rt_name) {
                call_args.push("RING_UNTAG(${recv})")
            } else if rt_method_needs_recv_unbox_float_c(rt_name) {
                rt_use(ctx, "ring_unbox_float", 1)
                call_args.push("ring_unbox_float(${recv})")
            } else if rt_method_needs_recv_unbox_bool_c(rt_name) {
                call_args.push("RING_UNTAG(${recv})")
            } else {
                call_args.push(recv)
            }
            // Leading N args unbox to int64_t; the rest stay boxed.
            let int_arg_count = rt_method_int_arg_count_c(rt_name)
            let mut ai = 0
            for a in args {
                if ai < int_arg_count {
                    call_args.push("RING_UNTAG(${a})")
                } else {
                    call_args.push(a)
                }
                ai = ai + 1
            }
            // NULL-pad missing trailing args (checker allows fewer args for
            // extern methods, e.g. sb.line()) up to the declared C arity.
            match rt_known_arity(rt_name) {
                some(expected) => {
                    while call_args.len() < expected {
                        call_args.push("RING_UNIT")
                    }
                },
                none => {},
            }
            rt_use(ctx, rt_name, call_args.len())
            if is_void_runtime_fn_c(rt_name) {
                c_emit(ctx, "${rt_name}(${call_args.join(", ")});")
                "RING_UNIT"
            } else if rt_method_returns_bool_c(rt_name) {
                let t = fresh_tmp(ctx)
                c_emit(ctx, "${t} = RING_BOOL(${rt_name}(${call_args.join(", ")}));")
                t
            } else if rt_method_returns_i64_c(rt_name) {
                let t = fresh_tmp(ctx)
                c_emit(ctx, "${t} = RING_INT(${rt_name}(${call_args.join(", ")}));")
                t
            } else {
                let t = fresh_tmp(ctx)
                c_emit(ctx, "${t} = ${rt_name}(${call_args.join(", ")});")
                t
            }
        },
        none => {
            // User/prelude impl method: ring_<Type>_<method>.
            let mangled = c_mangle_method(type_name, method)
            match ctx.functions.get(mangled) {
                some(fi) => {
                    let mut call_args: List<Str> = [recv]
                    for a in args { call_args.push(a) }
                    for dv in dict_vals { call_args.push(dv) }
                    match ctx.fn_evidence_params.get(mangled) {
                        some(ev_params) => {
                            for ep in ev_params {
                                call_args.push(c_lookup_evidence(ctx, ep))
                            }
                        },
                        none => {},
                    }
                    let t = fresh_tmp(ctx)
                    c_emit(ctx, "${t} = ${fi.c_name}(${call_args.join(", ")});")
                    t
                },
                none => {
                    eprintln("C codegen warning: unknown method '${type_name}.${method}' (mangled: ${mangled}), generating panic")
                    c_stub_expr(ctx, "missing method ${type_name}.${method}")
                },
            }
        },
    }
}

// ============================================================
// Field access — steps 1-3 cover TUPLE access only (tuples are runtime
// lists); struct/enum/record field access is step 4.
// ============================================================

fn gen_c_field_access(mut ctx: CCtx, receiver: HExpr, field: Str, ty: Type) -> Str {
    let recv_val = gen_c_expr(ctx, receiver)
    let recv_type = hexpr_type(receiver)
    match recv_type {
        Type::TupleType { .. } => {
            let idx = match parse_int(field) {
                some(n) => n,
                none => panic("C codegen: non-numeric tuple field: ${field}"),
            }
            rt_use(ctx, "ring_list_get", 2)
            let t = fresh_tmp(ctx)
            // Tuple field read is a BORROW (B-098); escapes are Clone-wrapped.
            c_emit(ctx, "${t} = ring_list_get(${recv_val}, ${idx});")
            t
        },
        Type::RecordType { .. } => c_stub_expr(ctx, "record field access (.${field})"),
        _ => c_stub_expr(ctx, "struct field access (.${field})"),
    }
}

// ============================================================
// Block / if expressions
// ============================================================

fn gen_c_block(mut ctx: CCtx, stmts: List<HStmt>, tail: HExpr?) -> Str {
    for stmt in stmts {
        emit_c_stmt(ctx, stmt)
    }
    match tail {
        some(t) => gen_c_expr(ctx, t),
        none => "RING_UNIT",
    }
}

fn gen_c_if_expr(mut ctx: CCtx, condition: HExpr, then_branch: HExpr, else_branch: HExpr?) -> Str {
    let cond = gen_c_expr(ctx, condition)
    let res = fresh_tmp(ctx)
    c_emit(ctx, "if (RING_COND(${cond})) {")
    ctx.indent = ctx.indent + 1
    let then_val = gen_c_expr(ctx, then_branch)
    c_emit(ctx, "${res} = ${then_val};")
    ctx.indent = ctx.indent - 1
    c_emit(ctx, "} else {")
    ctx.indent = ctx.indent + 1
    let else_val = match else_branch {
        some(eb) => gen_c_expr(ctx, eb),
        none => "RING_UNIT",
    }
    c_emit(ctx, "${res} = ${else_val};")
    ctx.indent = ctx.indent - 1
    c_emit(ctx, "}")
    res
}

// ============================================================
// String interpolation (runtime std::string StringBuilder — same shims the
// LLVM backend uses; B-104 D9 temp drops replicated)
// ============================================================

fn gen_c_string_interp(mut ctx: CCtx, parts: List<HStringInterpPart>) -> Str {
    rt_use(ctx, "ring_sb_new", 0)
    rt_use(ctx, "ring_sb_add", 2)
    rt_use(ctx, "ring_sb_to_str", 1)
    rt_use(ctx, "ring_drop", 1)
    let sb = fresh_tmp(ctx)
    c_emit(ctx, "${sb} = ring_sb_new();")
    for part in parts {
        match part {
            HStringInterpPart::Literal(s) => {
                let sv = gen_c_str_lit(ctx, s)
                c_emit(ctx, "ring_sb_add(${sb}, ${sv});")
                // D9: fresh literal string — drop after the copy-append.
                c_emit(ctx, "ring_drop(${sv});")
            },
            HStringInterpPart::Expression(e) => {
                let v = gen_c_expr(ctx, e)
                let expr_type = hexpr_type(e)
                let sv = convert_c_to_str(ctx, v, expr_type)
                c_emit(ctx, "ring_sb_add(${sb}, ${sv});")
                // D9: drop ONLY codegen-synthesised conversions; Str parts are
                // pass-through (D1-managed — dropping here would double-free).
                if !is_str_type(expr_type) {
                    c_emit(ctx, "ring_drop(${sv});")
                }
            },
        }
    }
    let res = fresh_tmp(ctx)
    c_emit(ctx, "${res} = ring_sb_to_str(${sb});")
    c_emit(ctx, "ring_drop(${sb});")
    res
}

fn convert_c_to_str(mut ctx: CCtx, val: Str, ty: Type) -> Str {
    if is_str_type(ty) {
        val
    } else if is_int_type(ty) {
        rt_use(ctx, "ring_int_to_str", 1)
        let t = fresh_tmp(ctx)
        c_emit(ctx, "${t} = ring_int_to_str(RING_UNTAG(${val}));")
        t
    } else if is_float_type(ty) {
        rt_use(ctx, "ring_unbox_float", 1)
        rt_use(ctx, "ring_float_to_str", 1)
        let t = fresh_tmp(ctx)
        c_emit(ctx, "${t} = ring_float_to_str(ring_unbox_float(${val}));")
        t
    } else if is_bool_type(ty) {
        rt_use(ctx, "ring_bool_to_str", 1)
        let t = fresh_tmp(ctx)
        c_emit(ctx, "${t} = ring_bool_to_str(RING_UNTAG(${val}));")
        t
    } else {
        panic("C codegen: convert_to_str called with unsupported type")
    }
}

// ============================================================
// Range / list / tuple literals, indexing
// ============================================================

// Range value layout mirrors gen_range_expr: 3 boxed slots
// { start, end, inclusive } tagged as TUPLE (typeid 10).
fn gen_c_range_expr(mut ctx: CCtx, start: HExpr, end: HExpr, inclusive: Bool) -> Str {
    rt_use(ctx, "ring_alloc", 2)
    let t = fresh_tmp(ctx)
    c_emit(ctx, "${t} = ring_alloc((int64_t)(3 * sizeof(void*)), 10);")
    let sv = gen_c_expr(ctx, start)
    let ev = gen_c_expr(ctx, end)
    let iv = if inclusive { "RING_TRUE" } else { "RING_FALSE" }
    c_emit(ctx, "((void**)${t})[0] = ${sv};")
    c_emit(ctx, "((void**)${t})[1] = ${ev};")
    c_emit(ctx, "((void**)${t})[2] = ${iv};")
    t
}

fn gen_c_list_lit(mut ctx: CCtx, elements: List<HExpr>) -> Str {
    rt_use(ctx, "ring_list_new", 0)
    rt_use(ctx, "ring_list_push", 2)
    let t = fresh_tmp(ctx)
    c_emit(ctx, "${t} = ring_list_new();")
    for elem in elements {
        let v = gen_c_expr(ctx, elem)
        c_emit(ctx, "ring_list_push(${t}, ${v});")
    }
    t
}

fn gen_c_index_expr(mut ctx: CCtx, receiver: HExpr, index: HExpr) -> Str {
    let recv_val = gen_c_expr(ctx, receiver)
    let idx_val = gen_c_expr(ctx, index)
    let recv_type = hexpr_type(receiver)
    let type_name = match type_to_builtin_name(recv_type) {
        some(n) => n,
        none => "Unknown",
    }
    let t = fresh_tmp(ctx)
    if type_name == "List" && is_builtin_collection(recv_type) {
        rt_use(ctx, "ring_list_get", 2)
        c_emit(ctx, "${t} = ring_list_get(${recv_val}, RING_UNTAG(${idx_val}));")
    } else if type_name == "Str" {
        rt_use(ctx, "ring_str_get", 2)
        c_emit(ctx, "${t} = ring_str_get(${recv_val}, RING_UNTAG(${idx_val}));")
    } else if type_name == "Map" && is_builtin_collection(recv_type) {
        rt_use(ctx, "ring_map_get", 2)
        c_emit(ctx, "${t} = ring_map_get(${recv_val}, ${idx_val});")
    } else {
        rt_use(ctx, "ring_list_get", 2)
        c_emit(ctx, "${t} = ring_list_get(${recv_val}, RING_UNTAG(${idx_val}));")
    }
    t
}

// ============================================================
// Statement dispatch
// ============================================================

pub fn emit_c_stmt(mut ctx: CCtx, stmt: HStmt) {
    match stmt {
        HStmt::Let { name, init, span, .. } => {
            c_line_directive(ctx, span)
            let val = gen_c_expr(ctx, init)
            let cv = c_local(ctx, name)
            c_emit(ctx, "${cv} = ${val};")
        },
        HStmt::Var { name, def_id, init, span, .. } => {
            c_line_directive(ctx, span)
            let val = gen_c_expr(ctx, init)
            // B-091: closure-written `let mut` is auto-boxed into a shared cell.
            let stored = if is_boxed_def_c(ctx, def_id) { gen_c_cell_alloc(ctx, val) } else { val }
            let cv = c_local(ctx, name)
            c_emit(ctx, "${cv} = ${stored};")
        },
        HStmt::Assign { target, value, span } => {
            c_line_directive(ctx, span)
            emit_c_assign(ctx, target, value)
        },
        HStmt::ExprStmt { expr, span } => {
            c_line_directive(ctx, span)
            let v = gen_c_expr(ctx, expr)
            // Value already materialised (or a pure constant) — discard.
            discard_c(v)
        },
        HStmt::Return { value, span } => {
            c_line_directive(ctx, span)
            // handle/try cleanup stack is a step-6 concern (#173).
            match value {
                some(v) => {
                    let val = gen_c_expr(ctx, v)
                    c_emit(ctx, "return ${val};")
                },
                none => c_emit(ctx, "return RING_UNIT;"),
            }
        },
        HStmt::While { condition, body, span } => {
            c_line_directive(ctx, span)
            emit_c_while(ctx, condition, body)
        },
        HStmt::ForIn { binding, destructure, iterable, body, span, .. } => {
            c_line_directive(ctx, span)
            emit_c_for_in(ctx, binding, destructure, iterable, body)
        },
        HStmt::Break { .. } => {
            if ctx.in_loop {
                c_emit(ctx, "break;")
            }
        },
        HStmt::Continue { .. } => {
            if ctx.in_loop {
                c_emit(ctx, ctx.loop_continue_stmt)
            }
        },
        HStmt::LetDestructure { bindings, init, span, .. } => {
            c_line_directive(ctx, span)
            emit_c_let_destructure(ctx, bindings, init)
        },
        HStmt::IfLet { span, .. } => {
            c_line_directive(ctx, span)
            // Constructor-pattern if-let needs enum tag access — step 4.
            c_stub_stmt(ctx, "if-let statement")
        },
        // Perceus RC ops (post-RC HIR input — mandatory from step 2 on).
        HStmt::Drop { name, .. } => {
            match ctx.named_values.get(name) {
                some(cv) => {
                    rt_use(ctx, "ring_drop", 1)
                    c_emit(ctx, "ring_drop(${cv});")
                },
                none => {
                    eprintln("[rc-warn] C codegen Drop: variable '${name}' not found")
                },
            }
        },
        HStmt::Dup { name, .. } => {
            match ctx.named_values.get(name) {
                some(cv) => {
                    rt_use(ctx, "ring_dup", 1)
                    c_emit(ctx, "ring_dup(${cv});")
                },
                none => {
                    eprintln("[rc-warn] C codegen Dup: variable '${name}' not found")
                },
            }
        },
    }
}

// Consume a value expression (parity with codegen_llvm_expr::discard).
fn discard_c(v: Str) {
    // intentionally empty
}

fn emit_c_assign(mut ctx: CCtx, target: HExpr, value: HExpr) {
    // RHS first (self-reads like `x = x + 1` must see the old value).
    let val = gen_c_expr(ctx, value)
    match target {
        HExpr::Ident { name, resolved_name, def_id, .. } => {
            let lookup = match resolved_name {
                some(rn) => rn,
                none => name,
            }
            let boxed = is_boxed_def_c(ctx, def_id)
            let found = match ctx.named_values.get(lookup) {
                some(cv) => some(cv),
                none => ctx.named_values.get(name),
            }
            match found {
                some(cv) => {
                    if boxed {
                        c_emit(ctx, "*(void**)${cv} = ${val};")
                    } else {
                        c_emit(ctx, "${cv} = ${val};")
                    }
                },
                none => panic("C codegen: assign to undefined variable '${name}'"),
            }
        },
        HExpr::FieldAccess { field, .. } => {
            // Struct field stores are step 4.
            c_stub_stmt(ctx, "struct field assignment (.${field})")
        },
        _ => panic("C codegen: unsupported assignment target"),
    }
}

// ============================================================
// While loop.  Shape:
//   while (1) { <cond stmts>; flag = RING_COND(c); [drop c]; if (!flag) break; <body> }
// Ring continue → C continue (falls back to the cond re-evaluation, same as
// LLVM's cond_bb target); Ring break → C break.
// ============================================================

fn emit_c_while(mut ctx: CCtx, condition: HExpr, body: HExpr) {
    c_emit(ctx, "while (1) {")
    ctx.indent = ctx.indent + 1
    let cond = gen_c_expr(ctx, condition)
    let flag = fresh_i64(ctx)
    c_emit(ctx, "${flag} = RING_COND(${cond});")
    // B-104 D1 Stage 2: fresh-owned condition box is dropped per evaluation.
    if is_fresh_owned_bool_value(condition) {
        rt_use(ctx, "ring_drop", 1)
        c_emit(ctx, "ring_drop(${cond});")
    }
    c_emit(ctx, "if (!${flag}) break;")

    let saved_cont = ctx.loop_continue_stmt
    let saved_in_loop = ctx.in_loop
    ctx.loop_continue_stmt = "continue;"
    ctx.in_loop = true
    discard_c(gen_c_expr(ctx, body))
    ctx.loop_continue_stmt = saved_cont
    ctx.in_loop = saved_in_loop

    ctx.indent = ctx.indent - 1
    c_emit(ctx, "}")
}

// ============================================================
// ForIn — three shapes (direct range / range variable / list-backed),
// ports of emit_for_in_range_direct / _range_var / _list.
// Ring continue → goto the increment label (binding-box drop + counter++,
// mirroring LLVM's incr_bb); Ring break → C break (skips the incr — the
// current binding box leaks, the documented B-104b residual).
// ============================================================

fn emit_c_for_in(mut ctx: CCtx, binding: Str, destructure: List<HForInDestructure>?, iterable: HExpr, body: HExpr) {
    match iterable {
        HExpr::RangeExpr { start, end, inclusive, .. } => {
            emit_c_for_range_direct(ctx, binding, start, end, inclusive, body)
            return
        },
        _ => {},
    }
    let iter_htype = hexpr_type(iterable)
    let is_range = match iter_htype {
        Type::EnumType { name, .. } => name == BUILTIN_RANGE,
        _ => false,
    }
    if is_range {
        emit_c_for_range_var(ctx, binding, iterable, body)
    } else {
        emit_c_for_list(ctx, binding, destructure, iterable, body)
    }
}

fn emit_c_for_range_direct(mut ctx: CCtx, binding: Str, start: HExpr, end: HExpr, inclusive: Bool, body: HExpr) {
    let sv = gen_c_expr(ctx, start)
    let ev = gen_c_expr(ctx, end)
    let s_raw = fresh_i64(ctx)
    let e_raw = fresh_i64(ctx)
    c_emit(ctx, "${s_raw} = RING_UNTAG(${sv});")
    c_emit(ctx, "${e_raw} = RING_UNTAG(${ev});")
    // B-104b: the bound boxes are OWNED and fully consumed by the untag.
    rt_use(ctx, "ring_drop", 1)
    c_emit(ctx, "ring_drop(${sv});")
    c_emit(ctx, "ring_drop(${ev});")

    let ci = fresh_i64(ctx)
    c_emit(ctx, "${ci} = ${s_raw};")
    let cmp = if inclusive { "<=" } else { "<" }
    let incr_label = fresh_label(ctx, "incr")

    c_emit(ctx, "while (1) {")
    ctx.indent = ctx.indent + 1
    c_emit(ctx, "if (!(${ci} ${cmp} ${e_raw})) break;")
    let bv = c_local(ctx, binding)
    c_emit(ctx, "${bv} = RING_INT(${ci});")

    let saved_cont = ctx.loop_continue_stmt
    let saved_in_loop = ctx.in_loop
    ctx.loop_continue_stmt = "goto ${incr_label};"
    ctx.in_loop = true
    discard_c(gen_c_expr(ctx, body))
    ctx.loop_continue_stmt = saved_cont
    ctx.in_loop = saved_in_loop

    c_raw(ctx, "${incr_label}:;")
    // B-104b: per-iteration counter box drop (normal path AND continue).
    c_emit(ctx, "ring_drop(${bv});")
    c_emit(ctx, "${ci} = ${ci} + 1;")
    ctx.indent = ctx.indent - 1
    c_emit(ctx, "}")
}

// Range stored in a variable: unbox { start, end, inclusive } slots, fold
// inclusivity into the bound (end - (1 - incl)), loop with <=.
fn emit_c_for_range_var(mut ctx: CCtx, binding: Str, iterable: HExpr, body: HExpr) {
    let rv = gen_c_expr(ctx, iterable)
    let sb = fresh_tmp(ctx)
    let eb = fresh_tmp(ctx)
    let ib = fresh_tmp(ctx)
    c_emit(ctx, "${sb} = ((void**)${rv})[0];")
    c_emit(ctx, "${eb} = ((void**)${rv})[1];")
    c_emit(ctx, "${ib} = ((void**)${rv})[2];")
    let s_raw = fresh_i64(ctx)
    let bound = fresh_i64(ctx)
    c_emit(ctx, "${s_raw} = RING_UNTAG(${sb});")
    c_emit(ctx, "${bound} = RING_UNTAG(${eb}) - (1 - RING_UNTAG(${ib}));")

    let ci = fresh_i64(ctx)
    c_emit(ctx, "${ci} = ${s_raw};")
    let incr_label = fresh_label(ctx, "incr")

    c_emit(ctx, "while (1) {")
    ctx.indent = ctx.indent + 1
    c_emit(ctx, "if (!(${ci} <= ${bound})) break;")
    let bv = c_local(ctx, binding)
    c_emit(ctx, "${bv} = RING_INT(${ci});")

    let saved_cont = ctx.loop_continue_stmt
    let saved_in_loop = ctx.in_loop
    ctx.loop_continue_stmt = "goto ${incr_label};"
    ctx.in_loop = true
    discard_c(gen_c_expr(ctx, body))
    ctx.loop_continue_stmt = saved_cont
    ctx.in_loop = saved_in_loop

    c_raw(ctx, "${incr_label}:;")
    rt_use(ctx, "ring_drop", 1)
    c_emit(ctx, "ring_drop(${bv});")
    c_emit(ctx, "${ci} = ${ci} + 1;")
    ctx.indent = ctx.indent - 1
    c_emit(ctx, "}")
}

// Index-based list iteration; Set/Map iterables are converted to a fresh
// list first (dropped at loop exit — B-104 D1 Stage 2 parity).
fn emit_c_for_list(mut ctx: CCtx, binding: Str, destructure: List<HForInDestructure>?, iterable: HExpr, body: HExpr) {
    let raw = gen_c_expr(ctx, iterable)
    let mut collection_converted = false
    let lv = match hexpr_type(iterable) {
        Type::StructType { name, type_params } => {
            if name == "Set" && type_params.len() == 1 {
                let is_int_elem = match type_params[0] {
                    Type::IntType => true,
                    _ => false,
                }
                let conv_name = if is_int_elem { "ring_set_int_to_list" } else { "ring_set_to_list" }
                rt_use(ctx, conv_name, 1)
                collection_converted = true
                let t = fresh_tmp(ctx)
                c_emit(ctx, "${t} = ${conv_name}(${raw});")
                t
            } else if name == "Map" && type_params.len() == 2 {
                let is_int_key = match type_params[0] {
                    Type::IntType => true,
                    _ => false,
                }
                let conv_name = if is_int_key { "ring_map_int_entries" } else { "ring_map_entries" }
                rt_use(ctx, conv_name, 1)
                collection_converted = true
                let t = fresh_tmp(ctx)
                c_emit(ctx, "${t} = ${conv_name}(${raw});")
                t
            } else {
                raw
            }
        },
        _ => raw,
    }

    rt_use(ctx, "ring_list_len", 1)
    rt_use(ctx, "ring_list_get", 2)
    let len = fresh_i64(ctx)
    c_emit(ctx, "${len} = ring_list_len(${lv});")
    let idx = fresh_i64(ctx)
    c_emit(ctx, "${idx} = 0;")
    let incr_label = fresh_label(ctx, "incr")

    c_emit(ctx, "while (1) {")
    ctx.indent = ctx.indent + 1
    c_emit(ctx, "if (!(${idx} < ${len})) break;")
    let elem = fresh_tmp(ctx)
    c_emit(ctx, "${elem} = ring_list_get(${lv}, ${idx});")

    match destructure {
        some(ds) => {
            if ds.len() > 0 {
                for i in 0..ds.len() {
                    match ds.get(i) {
                        some(d) => {
                            let dv = c_local(ctx, d.name)
                            c_emit(ctx, "${dv} = ring_list_get(${elem}, ${i});")
                        },
                        none => {},
                    }
                }
            } else {
                let bv = c_local(ctx, binding)
                c_emit(ctx, "${bv} = ${elem};")
            }
        },
        none => {
            let bv = c_local(ctx, binding)
            c_emit(ctx, "${bv} = ${elem};")
        },
    }

    let saved_cont = ctx.loop_continue_stmt
    let saved_in_loop = ctx.in_loop
    ctx.loop_continue_stmt = "goto ${incr_label};"
    ctx.in_loop = true
    discard_c(gen_c_expr(ctx, body))
    ctx.loop_continue_stmt = saved_cont
    ctx.in_loop = saved_in_loop

    c_raw(ctx, "${incr_label}:;")
    c_emit(ctx, "${idx} = ${idx} + 1;")
    ctx.indent = ctx.indent - 1
    c_emit(ctx, "}")
    if collection_converted {
        rt_use(ctx, "ring_drop", 1)
        c_emit(ctx, "ring_drop(${lv});")
    }
}

// ============================================================
// LetDestructure — tuple (runtime list) element extraction.
// ============================================================

fn emit_c_let_destructure(mut ctx: CCtx, bindings: List<HLetDestructureBinding>, init: HExpr) {
    let val = gen_c_expr(ctx, init)
    rt_use(ctx, "ring_list_get", 2)
    for i in 0..bindings.len() {
        match bindings.get(i) {
            some(b) => {
                if b.name != "_" {
                    let bv = c_local(ctx, b.name)
                    c_emit(ctx, "${bv} = ring_list_get(${val}, ${i});")
                }
            },
            none => {},
        }
    }
}
