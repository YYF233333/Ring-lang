use types::{Type, Effect, EffectRow, effect_kind_name, type_to_builtin_name}
use ast::{BinOp, UnaryOp}
use hir::{HExpr, HStmt, HMatchArm, HParam, HStructFieldInit,
    HStringInterpPart, HEffectHandler, DictRef, TraitDispatch,
    evidence_param_name, trait_dict_name,
    BUILTIN_INT, BUILTIN_FLOAT, BUILTIN_STR, BUILTIN_BOOL,
    BUILTIN_LIST, BUILTIN_MAP, BUILTIN_SET, BUILTIN_OPTION,
    hexpr_type, hexpr_effects}
use codegen_llvm_ctx::{LlvmCtx, StructFieldInfo, EnumTypeInfo, EnumVariantInfo,
    fresh_name, get_or_declare_runtime_fn, get_rt_fn_type,
    llvm_mangle_fn, llvm_mangle_method}
use codegen_llvm_stmt::{emit_llvm_stmt}
use codegen_ctx::{extract_effect_names}

// Re-declare LLVM types and functions to avoid ESM cross-module import issues
extern type LLVMContextRef
extern type LLVMModuleRef
extern type LLVMBuilderRef
extern type LLVMTypeRef
extern type LLVMValueRef
extern type LLVMBasicBlockRef

extern fn LLVMConstInt(ty: LLVMTypeRef, val: Int, sign_extend: Int) -> LLVMValueRef
extern fn LLVMConstReal(ty: LLVMTypeRef, val: Float) -> LLVMValueRef
extern fn LLVMConstNull(ty: LLVMTypeRef) -> LLVMValueRef
extern fn LLVMConstPointerNull(ty: LLVMTypeRef) -> LLVMValueRef
extern fn LLVMGetParam(fn_val: LLVMValueRef, index: Int) -> LLVMValueRef
extern fn LLVMCountParams(fn_val: LLVMValueRef) -> Int
extern fn LLVMAppendBasicBlockInContext(ctx: LLVMContextRef, fn_val: LLVMValueRef, name: Str) -> LLVMBasicBlockRef
extern fn LLVMGetInsertBlock(builder: LLVMBuilderRef) -> LLVMBasicBlockRef
extern fn LLVMPositionBuilderAtEnd(builder: LLVMBuilderRef, bb: LLVMBasicBlockRef) -> Unit
extern fn LLVMBuildAdd(builder: LLVMBuilderRef, lhs: LLVMValueRef, rhs: LLVMValueRef, name: Str) -> LLVMValueRef
extern fn LLVMBuildSub(builder: LLVMBuilderRef, lhs: LLVMValueRef, rhs: LLVMValueRef, name: Str) -> LLVMValueRef
extern fn LLVMBuildMul(builder: LLVMBuilderRef, lhs: LLVMValueRef, rhs: LLVMValueRef, name: Str) -> LLVMValueRef
extern fn LLVMBuildSDiv(builder: LLVMBuilderRef, lhs: LLVMValueRef, rhs: LLVMValueRef, name: Str) -> LLVMValueRef
extern fn LLVMBuildSRem(builder: LLVMBuilderRef, lhs: LLVMValueRef, rhs: LLVMValueRef, name: Str) -> LLVMValueRef
extern fn LLVMBuildFAdd(builder: LLVMBuilderRef, lhs: LLVMValueRef, rhs: LLVMValueRef, name: Str) -> LLVMValueRef
extern fn LLVMBuildFSub(builder: LLVMBuilderRef, lhs: LLVMValueRef, rhs: LLVMValueRef, name: Str) -> LLVMValueRef
extern fn LLVMBuildFMul(builder: LLVMBuilderRef, lhs: LLVMValueRef, rhs: LLVMValueRef, name: Str) -> LLVMValueRef
extern fn LLVMBuildFDiv(builder: LLVMBuilderRef, lhs: LLVMValueRef, rhs: LLVMValueRef, name: Str) -> LLVMValueRef
extern fn LLVMBuildICmp(builder: LLVMBuilderRef, predicate: Int, lhs: LLVMValueRef, rhs: LLVMValueRef, name: Str) -> LLVMValueRef
extern fn LLVMBuildFCmp(builder: LLVMBuilderRef, predicate: Int, lhs: LLVMValueRef, rhs: LLVMValueRef, name: Str) -> LLVMValueRef
extern fn LLVMBuildAlloca(builder: LLVMBuilderRef, ty: LLVMTypeRef, name: Str) -> LLVMValueRef
extern fn LLVMBuildLoad2(builder: LLVMBuilderRef, ty: LLVMTypeRef, ptr: LLVMValueRef, name: Str) -> LLVMValueRef
extern fn LLVMBuildStore(builder: LLVMBuilderRef, val: LLVMValueRef, ptr: LLVMValueRef) -> LLVMValueRef
extern fn LLVMBuildGEP2(builder: LLVMBuilderRef, ty: LLVMTypeRef, ptr: LLVMValueRef, indices: List<LLVMValueRef>, name: Str) -> LLVMValueRef
extern fn LLVMBuildStructGEP2(builder: LLVMBuilderRef, ty: LLVMTypeRef, ptr: LLVMValueRef, index: Int, name: Str) -> LLVMValueRef
extern fn LLVMBuildBr(builder: LLVMBuilderRef, dest: LLVMBasicBlockRef) -> LLVMValueRef
extern fn LLVMBuildCondBr(builder: LLVMBuilderRef, cond: LLVMValueRef, then_bb: LLVMBasicBlockRef, else_bb: LLVMBasicBlockRef) -> LLVMValueRef
extern fn LLVMBuildRet(builder: LLVMBuilderRef, val: LLVMValueRef) -> LLVMValueRef
extern fn LLVMBuildCall2(builder: LLVMBuilderRef, fn_ty: LLVMTypeRef, fn_val: LLVMValueRef, args: List<LLVMValueRef>, name: Str) -> LLVMValueRef
extern fn LLVMBuildTrunc(builder: LLVMBuilderRef, val: LLVMValueRef, dest_ty: LLVMTypeRef, name: Str) -> LLVMValueRef
extern fn LLVMBuildZExt(builder: LLVMBuilderRef, val: LLVMValueRef, dest_ty: LLVMTypeRef, name: Str) -> LLVMValueRef
extern fn LLVMBuildPhi(builder: LLVMBuilderRef, ty: LLVMTypeRef, name: Str) -> LLVMValueRef
extern fn LLVMAddIncoming(phi: LLVMValueRef, vals: List<LLVMValueRef>, blocks: List<LLVMBasicBlockRef>) -> Unit
extern fn LLVMBuildGlobalStringPtr(builder: LLVMBuilderRef, str: Str, name: Str) -> LLVMValueRef
extern fn LLVMBuildUnreachable(builder: LLVMBuilderRef) -> LLVMValueRef
extern fn LLVMBuildBitCast(builder: LLVMBuilderRef, val: LLVMValueRef, dest_ty: LLVMTypeRef, name: Str) -> LLVMValueRef
extern fn LLVMFunctionType(ret: LLVMTypeRef, params: List<LLVMTypeRef>, is_var_arg: Int) -> LLVMTypeRef
extern fn LLVMAddFunction(m: LLVMModuleRef, name: Str, fn_ty: LLVMTypeRef) -> LLVMValueRef
extern fn LLVMStructTypeInContext(ctx: LLVMContextRef, elems: List<LLVMTypeRef>, packed: Int) -> LLVMTypeRef
extern fn LLVMSizeOf(ty: LLVMTypeRef) -> LLVMValueRef

// ============================================================
// Main expression dispatch
// ============================================================

pub fn gen_llvm_expr(mut ctx: LlvmCtx, expr: HExpr) -> LLVMValueRef {
    match expr {
        HExpr::IntLit { value, .. } => gen_int_lit(ctx, value),
        HExpr::FloatLit { value, .. } => gen_float_lit(ctx, value),
        HExpr::StrLit { value, .. } => gen_str_lit(ctx, value),
        HExpr::BoolLit { value, .. } => gen_bool_lit(ctx, value),
        HExpr::Ident { name, resolved_name, .. } => gen_ident(ctx, name, resolved_name),
        HExpr::BinOp { op, left, right, ty, .. } => gen_binop(ctx, op, left, right, ty),
        HExpr::UnaryOp { op, operand, ty, .. } => gen_unaryop(ctx, op, operand, ty),
        HExpr::Call { callee, args, dict_dispatch, ty, effects, .. } =>
            gen_call(ctx, callee, args, ty, effects),
        HExpr::FieldAccess { receiver, field, ty, .. } =>
            gen_field_access(ctx, receiver, field, ty),
        HExpr::StructLit { name, fields, .. } =>
            gen_struct_lit(ctx, name, fields),
        HExpr::Block { stmts, tail, .. } =>
            gen_block(ctx, stmts, tail),
        HExpr::IfExpr { condition, then_branch, else_branch, .. } =>
            gen_if_expr(ctx, condition, then_branch, else_branch),
        HExpr::StringInterp { parts, .. } =>
            gen_string_interp(ctx, parts),
        HExpr::Lambda { .. } =>
            LLVMConstPointerNull(ctx.ptr_type),
        HExpr::MatchExpr { .. } =>
            LLVMConstPointerNull(ctx.ptr_type),
        HExpr::NamedVariantConstruct { .. } =>
            LLVMConstPointerNull(ctx.ptr_type),
        HExpr::TryCatch { .. } =>
            LLVMConstPointerNull(ctx.ptr_type),
        HExpr::HandleExpr { .. } =>
            LLVMConstPointerNull(ctx.ptr_type),
        HExpr::EffectOp { .. } =>
            LLVMConstPointerNull(ctx.ptr_type),
        HExpr::RangeExpr { .. } =>
            LLVMConstPointerNull(ctx.ptr_type),
        HExpr::ListLit { .. } =>
            LLVMConstPointerNull(ctx.ptr_type),
        HExpr::TupleLit { .. } =>
            LLVMConstPointerNull(ctx.ptr_type),
        HExpr::IndexExpr { .. } =>
            LLVMConstPointerNull(ctx.ptr_type),
    }
}

// ============================================================
// Literals
// ============================================================

fn gen_int_lit(mut ctx: LlvmCtx, value: Int) -> LLVMValueRef {
    let raw = LLVMConstInt(ctx.i64_type, value, 1)
    let box_fn = get_or_declare_runtime_fn(ctx, "ring_box_int", [ctx.i64_type], ctx.ptr_type)
    let box_fn_ty = get_rt_fn_type(ctx, "ring_box_int")
    LLVMBuildCall2(ctx.builder, box_fn_ty, box_fn, [raw], fresh_name(ctx, "int"))
}

fn gen_float_lit(mut ctx: LlvmCtx, value: Float) -> LLVMValueRef {
    let raw = LLVMConstReal(ctx.double_type, value)
    let box_fn = get_or_declare_runtime_fn(ctx, "ring_box_float", [ctx.double_type], ctx.ptr_type)
    let box_fn_ty = get_rt_fn_type(ctx, "ring_box_float")
    LLVMBuildCall2(ctx.builder, box_fn_ty, box_fn, [raw], fresh_name(ctx, "flt"))
}

fn gen_str_lit(mut ctx: LlvmCtx, value: Str) -> LLVMValueRef {
    let global_str = LLVMBuildGlobalStringPtr(ctx.builder, value, fresh_name(ctx, "str"))
    let from_cstr_fn = get_or_declare_runtime_fn(ctx, "ring_str_from_cstr", [ctx.ptr_type], ctx.ptr_type)
    let from_cstr_ty = get_rt_fn_type(ctx, "ring_str_from_cstr")
    LLVMBuildCall2(ctx.builder, from_cstr_ty, from_cstr_fn, [global_str], fresh_name(ctx, "s"))
}

fn gen_bool_lit(mut ctx: LlvmCtx, value: Bool) -> LLVMValueRef {
    let raw = if value { LLVMConstInt(ctx.i64_type, 1, 0) } else { LLVMConstInt(ctx.i64_type, 0, 0) }
    let box_fn = get_or_declare_runtime_fn(ctx, "ring_box_bool", [ctx.i64_type], ctx.ptr_type)
    let box_fn_ty = get_rt_fn_type(ctx, "ring_box_bool")
    LLVMBuildCall2(ctx.builder, box_fn_ty, box_fn, [raw], fresh_name(ctx, "bool"))
}

// ============================================================
// Identifiers
// ============================================================

fn gen_ident(mut ctx: LlvmCtx, name: Str, resolved_name: Str?) -> LLVMValueRef {
    let lookup_name = match resolved_name {
        some(rn) => rn,
        none => name,
    }
    // First check local variables
    match ctx.named_values.get(lookup_name) {
        some(alloca) => {
            LLVMBuildLoad2(ctx.builder, ctx.ptr_type, alloca, fresh_name(ctx, lookup_name))
        },
        none => {
            match ctx.named_values.get(name) {
                some(alloca) => {
                    LLVMBuildLoad2(ctx.builder, ctx.ptr_type, alloca, fresh_name(ctx, name))
                },
                none => {
                    // Try as function reference: first with resolved_name, then bare name
                    let mangled_resolved = llvm_mangle_fn(lookup_name)
                    match ctx.functions.get(mangled_resolved) {
                        some(fn_val) => call_zero_arg_or_return(ctx, fn_val, mangled_resolved),
                        none => {
                            let mangled_bare = llvm_mangle_fn(name)
                            match ctx.functions.get(mangled_bare) {
                                some(fn_val) => call_zero_arg_or_return(ctx, fn_val, mangled_bare),
                                none => panic("LLVM codegen: undefined variable '${name}' (resolved: '${lookup_name}')"),
                            }
                        },
                    }
                },
            }
        },
    }
}

fn call_zero_arg_or_return(mut ctx: LlvmCtx, fn_val: LLVMValueRef, mangled: Str) -> LLVMValueRef {
    // Zero-arg constructors (like Option_none) need to be called
    match ctx.fn_types.get(mangled) {
        some(fn_ty) => {
            let param_count = LLVMCountParams(fn_val)
            if param_count == 0 {
                LLVMBuildCall2(ctx.builder, fn_ty, fn_val, [], fresh_name(ctx, "ctor"))
            } else {
                fn_val
            }
        },
        none => fn_val,
    }
}

// ============================================================
// Binary operations
// ============================================================

fn is_int_type(ty: Type) -> Bool {
    match ty {
        Type::IntType => true,
        _ => false,
    }
}

fn is_float_type(ty: Type) -> Bool {
    match ty {
        Type::FloatType => true,
        _ => false,
    }
}

fn is_str_type(ty: Type) -> Bool {
    match ty {
        Type::StrType => true,
        _ => false,
    }
}

fn is_bool_type(ty: Type) -> Bool {
    match ty {
        Type::BoolType => true,
        _ => false,
    }
}

fn operand_type_from_binop(left: HExpr) -> Type {
    hexpr_type(left)
}

fn gen_binop(mut ctx: LlvmCtx, op: BinOp, left: HExpr, right: HExpr, result_ty: Type) -> LLVMValueRef {
    let op_type = operand_type_from_binop(left)

    // Short-circuit And/Or
    match op {
        BinOp::And => { return gen_and(ctx, left, right) },
        BinOp::Or => { return gen_or(ctx, left, right) },
        _ => {},
    }

    let lhs = gen_llvm_expr(ctx, left)
    let rhs = gen_llvm_expr(ctx, right)

    if is_int_type(op_type) {
        gen_int_binop(ctx, op, lhs, rhs)
    } else {
        if is_float_type(op_type) {
            gen_float_binop(ctx, op, lhs, rhs)
        } else {
            if is_str_type(op_type) {
                gen_str_binop(ctx, op, lhs, rhs)
            } else {
                if is_bool_type(op_type) {
                    gen_bool_binop(ctx, op, lhs, rhs)
                } else {
                    // Fallback: try int operations
                    gen_int_binop(ctx, op, lhs, rhs)
                }
            }
        }
    }
}

fn gen_int_binop(mut ctx: LlvmCtx, op: BinOp, lhs: LLVMValueRef, rhs: LLVMValueRef) -> LLVMValueRef {
    let unbox_fn = get_or_declare_runtime_fn(ctx, "ring_unbox_int", [ctx.ptr_type], ctx.i64_type)
    let unbox_ty = get_rt_fn_type(ctx, "ring_unbox_int")
    let lhs_raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [lhs], fresh_name(ctx, "l"))
    let rhs_raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [rhs], fresh_name(ctx, "r"))

    match op {
        BinOp::Add => {
            let result = LLVMBuildAdd(ctx.builder, lhs_raw, rhs_raw, fresh_name(ctx, "add"))
            box_int(ctx, result)
        },
        BinOp::Sub => {
            let result = LLVMBuildSub(ctx.builder, lhs_raw, rhs_raw, fresh_name(ctx, "sub"))
            box_int(ctx, result)
        },
        BinOp::Mul => {
            let result = LLVMBuildMul(ctx.builder, lhs_raw, rhs_raw, fresh_name(ctx, "mul"))
            box_int(ctx, result)
        },
        BinOp::Div => {
            let result = LLVMBuildSDiv(ctx.builder, lhs_raw, rhs_raw, fresh_name(ctx, "div"))
            box_int(ctx, result)
        },
        BinOp::Mod => {
            let result = LLVMBuildSRem(ctx.builder, lhs_raw, rhs_raw, fresh_name(ctx, "mod"))
            box_int(ctx, result)
        },
        // Int comparisons: LLVMIntPredicate: 32=eq, 33=ne, 38=sgt, 39=sge, 40=slt, 41=sle
        BinOp::Eq => {
            let cmp = LLVMBuildICmp(ctx.builder, 32, lhs_raw, rhs_raw, fresh_name(ctx, "eq"))
            let ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, fresh_name(ctx, "ext"))
            box_bool(ctx, ext)
        },
        BinOp::Neq => {
            let cmp = LLVMBuildICmp(ctx.builder, 33, lhs_raw, rhs_raw, fresh_name(ctx, "ne"))
            let ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, fresh_name(ctx, "ext"))
            box_bool(ctx, ext)
        },
        BinOp::Lt => {
            let cmp = LLVMBuildICmp(ctx.builder, 40, lhs_raw, rhs_raw, fresh_name(ctx, "lt"))
            let ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, fresh_name(ctx, "ext"))
            box_bool(ctx, ext)
        },
        BinOp::Lte => {
            let cmp = LLVMBuildICmp(ctx.builder, 41, lhs_raw, rhs_raw, fresh_name(ctx, "le"))
            let ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, fresh_name(ctx, "ext"))
            box_bool(ctx, ext)
        },
        BinOp::Gt => {
            let cmp = LLVMBuildICmp(ctx.builder, 38, lhs_raw, rhs_raw, fresh_name(ctx, "gt"))
            let ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, fresh_name(ctx, "ext"))
            box_bool(ctx, ext)
        },
        BinOp::Gte => {
            let cmp = LLVMBuildICmp(ctx.builder, 39, lhs_raw, rhs_raw, fresh_name(ctx, "ge"))
            let ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, fresh_name(ctx, "ext"))
            box_bool(ctx, ext)
        },
        BinOp::And => panic("LLVM codegen: And should be handled by short-circuit"),
        BinOp::Or => panic("LLVM codegen: Or should be handled by short-circuit"),
    }
}

fn gen_float_binop(mut ctx: LlvmCtx, op: BinOp, lhs: LLVMValueRef, rhs: LLVMValueRef) -> LLVMValueRef {
    let unbox_fn = get_or_declare_runtime_fn(ctx, "ring_unbox_float", [ctx.ptr_type], ctx.double_type)
    let unbox_ty = get_rt_fn_type(ctx, "ring_unbox_float")
    let lhs_raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [lhs], fresh_name(ctx, "l"))
    let rhs_raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [rhs], fresh_name(ctx, "r"))

    match op {
        BinOp::Add => {
            let result = LLVMBuildFAdd(ctx.builder, lhs_raw, rhs_raw, fresh_name(ctx, "fadd"))
            box_float(ctx, result)
        },
        BinOp::Sub => {
            let result = LLVMBuildFSub(ctx.builder, lhs_raw, rhs_raw, fresh_name(ctx, "fsub"))
            box_float(ctx, result)
        },
        BinOp::Mul => {
            let result = LLVMBuildFMul(ctx.builder, lhs_raw, rhs_raw, fresh_name(ctx, "fmul"))
            box_float(ctx, result)
        },
        BinOp::Div => {
            let result = LLVMBuildFDiv(ctx.builder, lhs_raw, rhs_raw, fresh_name(ctx, "fdiv"))
            box_float(ctx, result)
        },
        // Float comparisons: LLVMRealPredicate: 1=oeq, 6=one, 2=ogt, 3=oge, 4=olt, 5=ole
        BinOp::Eq => {
            let cmp = LLVMBuildFCmp(ctx.builder, 1, lhs_raw, rhs_raw, fresh_name(ctx, "feq"))
            let ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, fresh_name(ctx, "ext"))
            box_bool(ctx, ext)
        },
        BinOp::Neq => {
            let cmp = LLVMBuildFCmp(ctx.builder, 6, lhs_raw, rhs_raw, fresh_name(ctx, "fne"))
            let ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, fresh_name(ctx, "ext"))
            box_bool(ctx, ext)
        },
        BinOp::Lt => {
            let cmp = LLVMBuildFCmp(ctx.builder, 4, lhs_raw, rhs_raw, fresh_name(ctx, "flt"))
            let ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, fresh_name(ctx, "ext"))
            box_bool(ctx, ext)
        },
        BinOp::Lte => {
            let cmp = LLVMBuildFCmp(ctx.builder, 5, lhs_raw, rhs_raw, fresh_name(ctx, "fle"))
            let ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, fresh_name(ctx, "ext"))
            box_bool(ctx, ext)
        },
        BinOp::Gt => {
            let cmp = LLVMBuildFCmp(ctx.builder, 2, lhs_raw, rhs_raw, fresh_name(ctx, "fgt"))
            let ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, fresh_name(ctx, "ext"))
            box_bool(ctx, ext)
        },
        BinOp::Gte => {
            let cmp = LLVMBuildFCmp(ctx.builder, 3, lhs_raw, rhs_raw, fresh_name(ctx, "fge"))
            let ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, fresh_name(ctx, "ext"))
            box_bool(ctx, ext)
        },
        _ => panic("LLVM codegen: unsupported float binop"),
    }
}

fn gen_str_binop(mut ctx: LlvmCtx, op: BinOp, lhs: LLVMValueRef, rhs: LLVMValueRef) -> LLVMValueRef {
    match op {
        BinOp::Eq => {
            let eq_fn = get_or_declare_runtime_fn(ctx, "ring_str_eq", [ctx.ptr_type, ctx.ptr_type], ctx.i64_type)
            let eq_ty = get_rt_fn_type(ctx, "ring_str_eq")
            let result = LLVMBuildCall2(ctx.builder, eq_ty, eq_fn, [lhs, rhs], fresh_name(ctx, "seq"))
            box_bool(ctx, result)
        },
        BinOp::Neq => {
            let eq_fn = get_or_declare_runtime_fn(ctx, "ring_str_eq", [ctx.ptr_type, ctx.ptr_type], ctx.i64_type)
            let eq_ty = get_rt_fn_type(ctx, "ring_str_eq")
            let result = LLVMBuildCall2(ctx.builder, eq_ty, eq_fn, [lhs, rhs], fresh_name(ctx, "seq"))
            // Negate: eq_result XOR 1
            let one = LLVMConstInt(ctx.i64_type, 1, 0)
            let neg = LLVMBuildSub(ctx.builder, one, result, fresh_name(ctx, "neg"))
            box_bool(ctx, neg)
        },
        BinOp::Lt => {
            let lt_fn = get_or_declare_runtime_fn(ctx, "ring_str_lt", [ctx.ptr_type, ctx.ptr_type], ctx.i64_type)
            let lt_ty = get_rt_fn_type(ctx, "ring_str_lt")
            let result = LLVMBuildCall2(ctx.builder, lt_ty, lt_fn, [lhs, rhs], fresh_name(ctx, "slt"))
            box_bool(ctx, result)
        },
        _ => panic("LLVM codegen: unsupported str binop"),
    }
}

fn gen_bool_binop(mut ctx: LlvmCtx, op: BinOp, lhs: LLVMValueRef, rhs: LLVMValueRef) -> LLVMValueRef {
    let unbox_fn = get_or_declare_runtime_fn(ctx, "ring_unbox_bool", [ctx.ptr_type], ctx.i64_type)
    let unbox_ty = get_rt_fn_type(ctx, "ring_unbox_bool")
    let lhs_raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [lhs], fresh_name(ctx, "lb"))
    let rhs_raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [rhs], fresh_name(ctx, "rb"))

    match op {
        BinOp::Eq => {
            let cmp = LLVMBuildICmp(ctx.builder, 32, lhs_raw, rhs_raw, fresh_name(ctx, "beq"))
            let ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, fresh_name(ctx, "ext"))
            box_bool(ctx, ext)
        },
        BinOp::Neq => {
            let cmp = LLVMBuildICmp(ctx.builder, 33, lhs_raw, rhs_raw, fresh_name(ctx, "bne"))
            let ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, fresh_name(ctx, "ext"))
            box_bool(ctx, ext)
        },
        _ => panic("LLVM codegen: unsupported bool binop"),
    }
}

// ============================================================
// Short-circuit And / Or
// ============================================================

fn gen_and(mut ctx: LlvmCtx, left: HExpr, right: HExpr) -> LLVMValueRef {
    let current_fn = match ctx.current_fn {
        some(f) => f,
        none => panic("LLVM codegen: gen_and outside function"),
    }

    let lhs = gen_llvm_expr(ctx, left)
    let lhs_bool = unbox_to_i1(ctx, lhs)

    let rhs_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "and.rhs")
    let merge_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "and.merge")
    let lhs_end_bb = LLVMGetInsertBlock(ctx.builder)

    LLVMBuildCondBr(ctx.builder, lhs_bool, rhs_bb, merge_bb)

    LLVMPositionBuilderAtEnd(ctx.builder, rhs_bb)
    let rhs = gen_llvm_expr(ctx, right)
    let rhs_end_bb = LLVMGetInsertBlock(ctx.builder)
    LLVMBuildBr(ctx.builder, merge_bb)

    LLVMPositionBuilderAtEnd(ctx.builder, merge_bb)
    let false_val = gen_bool_lit(ctx, false)
    let phi = LLVMBuildPhi(ctx.builder, ctx.ptr_type, fresh_name(ctx, "and"))
    LLVMAddIncoming(phi, [false_val, rhs], [lhs_end_bb, rhs_end_bb])
    phi
}

fn gen_or(mut ctx: LlvmCtx, left: HExpr, right: HExpr) -> LLVMValueRef {
    let current_fn = match ctx.current_fn {
        some(f) => f,
        none => panic("LLVM codegen: gen_or outside function"),
    }

    let lhs = gen_llvm_expr(ctx, left)
    let lhs_bool = unbox_to_i1(ctx, lhs)

    let rhs_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "or.rhs")
    let merge_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "or.merge")
    let lhs_end_bb = LLVMGetInsertBlock(ctx.builder)

    LLVMBuildCondBr(ctx.builder, lhs_bool, merge_bb, rhs_bb)

    LLVMPositionBuilderAtEnd(ctx.builder, rhs_bb)
    let rhs = gen_llvm_expr(ctx, right)
    let rhs_end_bb = LLVMGetInsertBlock(ctx.builder)
    LLVMBuildBr(ctx.builder, merge_bb)

    LLVMPositionBuilderAtEnd(ctx.builder, merge_bb)
    let true_val = gen_bool_lit(ctx, true)
    let phi = LLVMBuildPhi(ctx.builder, ctx.ptr_type, fresh_name(ctx, "or"))
    LLVMAddIncoming(phi, [true_val, rhs], [lhs_end_bb, rhs_end_bb])
    phi
}

// ============================================================
// Unary operations
// ============================================================

fn gen_unaryop(mut ctx: LlvmCtx, op: UnaryOp, operand: HExpr, ty: Type) -> LLVMValueRef {
    let val = gen_llvm_expr(ctx, operand)
    match op {
        UnaryOp::Neg => {
            if is_int_type(ty) {
                let unbox_fn = get_or_declare_runtime_fn(ctx, "ring_unbox_int", [ctx.ptr_type], ctx.i64_type)
                let unbox_ty = get_rt_fn_type(ctx, "ring_unbox_int")
                let raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [val], fresh_name(ctx, "un"))
                let zero = LLVMConstInt(ctx.i64_type, 0, 0)
                let neg = LLVMBuildSub(ctx.builder, zero, raw, fresh_name(ctx, "neg"))
                box_int(ctx, neg)
            } else {
                let unbox_fn = get_or_declare_runtime_fn(ctx, "ring_unbox_float", [ctx.ptr_type], ctx.double_type)
                let unbox_ty = get_rt_fn_type(ctx, "ring_unbox_float")
                let raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [val], fresh_name(ctx, "un"))
                let zero = LLVMConstReal(ctx.double_type, 0.0)
                let neg = LLVMBuildFSub(ctx.builder, zero, raw, fresh_name(ctx, "fneg"))
                box_float(ctx, neg)
            }
        },
        UnaryOp::Not => {
            let unbox_fn = get_or_declare_runtime_fn(ctx, "ring_unbox_bool", [ctx.ptr_type], ctx.i64_type)
            let unbox_ty = get_rt_fn_type(ctx, "ring_unbox_bool")
            let raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [val], fresh_name(ctx, "un"))
            let one = LLVMConstInt(ctx.i64_type, 1, 0)
            let neg = LLVMBuildSub(ctx.builder, one, raw, fresh_name(ctx, "not"))
            box_bool(ctx, neg)
        },
    }
}

// ============================================================
// Function calls
// ============================================================

fn gen_call(mut ctx: LlvmCtx, callee: HExpr, args: List<HExpr>, result_ty: Type, effects: EffectRow) -> LLVMValueRef {
    // Evaluate all args first
    let mut arg_vals: List<LLVMValueRef> = []
    for a in args {
        arg_vals.push(gen_llvm_expr(ctx, a))
    }

    // Determine function to call
    match callee {
        HExpr::Ident { name, resolved_name, .. } => {
            let call_name = match resolved_name {
                some(rn) => rn,
                none => name,
            }
            gen_direct_call(ctx, call_name, arg_vals)
        },
        HExpr::FieldAccess { receiver, field, .. } => {
            // Method call: receiver.method(args)
            let recv_val = gen_llvm_expr(ctx, receiver)
            let recv_type = hexpr_type(receiver)
            gen_method_call(ctx, recv_val, recv_type, field, arg_vals)
        },
        _ => {
            LLVMConstPointerNull(ctx.ptr_type)
        },
    }
}

fn gen_direct_call(mut ctx: LlvmCtx, name: Str, mut arg_vals: List<LLVMValueRef>) -> LLVMValueRef {
    // Check for known extern fn → runtime mapping
    let rt_name = extern_fn_to_runtime(name)
    match rt_name {
        some(rtn) => {
            return gen_runtime_call(ctx, rtn, arg_vals)
        },
        none => {},
    }

    // Look up in functions map
    let mangled = llvm_mangle_fn(name)
    match ctx.functions.get(mangled) {
        some(fn_val) => {
            // Add evidence params (null for now)
            match ctx.fn_evidence_params.get(mangled) {
                some(ev_params) => {
                    for ep in ev_params {
                        arg_vals.push(LLVMConstPointerNull(ctx.ptr_type))
                    }
                },
                none => {},
            }
            let fn_ty = match ctx.fn_types.get(mangled) {
                some(t) => t,
                none => panic("LLVM codegen: fn type not found for ${mangled}"),
            }
            LLVMBuildCall2(ctx.builder, fn_ty, fn_val, arg_vals, fresh_name(ctx, "call"))
        },
        none => {
            panic("LLVM codegen: undefined function '${name}' (mangled: ${mangled})")
        },
    }
}

fn gen_runtime_call(mut ctx: LlvmCtx, name: Str, args: List<LLVMValueRef>) -> LLVMValueRef {
    // Runtime calls for print, panic, etc.
    match ctx.rt_fns.get(name) {
        some(fn_val) => {
            let fn_ty = get_rt_fn_type(ctx, name)
            // Check if this is a void-returning function
            if is_void_runtime_fn(name) {
                LLVMBuildCall2(ctx.builder, fn_ty, fn_val, args, "")
                LLVMConstPointerNull(ctx.ptr_type)
            } else {
                LLVMBuildCall2(ctx.builder, fn_ty, fn_val, args, fresh_name(ctx, "rt"))
            }
        },
        none => {
            panic("LLVM codegen: unknown runtime function '${name}'")
        },
    }
}

fn is_void_runtime_fn(name: Str) -> Bool {
    if name == "ring_print" { true }
    else { if name == "ring_eprintln" { true }
    else { if name == "ring_panic" { true }
    else { if name == "ring_exit" { true }
    else { if name == "ring_sb_add" { true }
    else { if name == "ring_list_push" { true }
    else { false } } } } } }
}

// Map Ring extern fn names to C runtime names
fn extern_fn_to_runtime(name: Str) -> Str? {
    if name == "print" { some("ring_print") }
    else { if name == "panic" { some("ring_panic") }
    else { if name == "eprintln" { some("ring_eprintln") }
    else { if name == "exit" || name == "exit_process" { some("ring_exit") }
    else { if name == "argv" { some("ring_args") }
    else { if name == "string_builder" { some("ring_sb_new") }
    else { if name == "map_new" { some("ring_map_new") }
    else { if name == "set_new" { some("ring_set_new") }
    else { none } } } } } } } }
}

// ============================================================
// Method calls — dispatch to runtime
// ============================================================

fn gen_method_call(mut ctx: LlvmCtx, recv: LLVMValueRef, recv_type: Type, method: Str, args: List<LLVMValueRef>) -> LLVMValueRef {
    let type_name = match type_to_builtin_name(recv_type) {
        some(n) => n,
        none => {
            // User-defined type — look up as mangled method
            match recv_type {
                Type::StructType { name, .. } => name,
                Type::EnumType { name, .. } => name,
                _ => "Unknown",
            }
        },
    }

    // Build full runtime call args: receiver first, then remaining args
    let mut call_args: List<LLVMValueRef> = [recv]
    for a in args {
        call_args.push(a)
    }

    // Special case: Str.len returns i64 and needs boxing
    if type_name == "Str" && method == "len" {
        let len_fn = get_or_declare_runtime_fn(ctx, "ring_str_len", [ctx.ptr_type], ctx.i64_type)
        let len_ty = get_rt_fn_type(ctx, "ring_str_len")
        let raw_len = LLVMBuildCall2(ctx.builder, len_ty, len_fn, [recv], fresh_name(ctx, "len"))
        return box_int(ctx, raw_len)
    }

    // Map to runtime function name
    let rt_method = method_to_runtime(type_name, method)
    match rt_method {
        some(rt_name) => {
            // Try to get it, or declare it dynamically
            let fn_val = ensure_runtime_method(ctx, rt_name, call_args.len())
            let fn_ty = get_rt_fn_type(ctx, rt_name)
            if is_void_runtime_fn(rt_name) {
                LLVMBuildCall2(ctx.builder, fn_ty, fn_val, call_args, "")
                LLVMConstPointerNull(ctx.ptr_type)
            } else {
                LLVMBuildCall2(ctx.builder, fn_ty, fn_val, call_args, fresh_name(ctx, "mc"))
            }
        },
        none => {
            // User-defined impl method
            let mangled = llvm_mangle_method(type_name, method)
            match ctx.functions.get(mangled) {
                some(fn_val) => {
                    // Add evidence params
                    match ctx.fn_evidence_params.get(mangled) {
                        some(ev_params) => {
                            for ep in ev_params {
                                call_args.push(LLVMConstPointerNull(ctx.ptr_type))
                            }
                        },
                        none => {},
                    }
                    let fn_ty = match ctx.fn_types.get(mangled) {
                        some(t) => t,
                        none => panic("LLVM codegen: fn type not found for method ${mangled}"),
                    }
                    LLVMBuildCall2(ctx.builder, fn_ty, fn_val, call_args, fresh_name(ctx, "mc"))
                },
                none => {
                    // Stub: method not yet implemented, return null
                    LLVMConstPointerNull(ctx.ptr_type)
                },
            }
        },
    }
}

fn method_to_runtime(type_name: Str, method: Str) -> Str? {
    // Str methods (len handled specially in gen_method_call)
    if type_name == "Str" && method == "contains" { some("ring_str_contains") }
    else { if type_name == "Str" && method == "starts_with" { some("ring_str_starts_with") }
    else { if type_name == "Str" && method == "ends_with" { some("ring_str_ends_with") }
    else { if type_name == "Str" && method == "slice" { some("ring_str_slice") }
    else { if type_name == "Str" && method == "split" { some("ring_str_split") }
    else { if type_name == "Str" && method == "replace" { some("ring_str_replace") }
    // Int methods
    else { if type_name == "Int" && method == "to_str" { some("ring_int_to_str") }
    // Float methods
    else { if type_name == "Float" && method == "to_str" { some("ring_float_to_str") }
    // StringBuilder methods
    else { if type_name == "StringBuilder" && method == "add" { some("ring_sb_add") }
    else { if type_name == "StringBuilder" && method == "to_str" { some("ring_sb_to_str") }
    // List methods
    else { if type_name == "List" && method == "push" { some("ring_list_push") }
    else { if type_name == "List" && method == "len" { some("ring_list_len") }
    else { if type_name == "List" && method == "get" { some("ring_list_get") }
    else { if type_name == "List" && method == "join" { some("ring_list_join") }
    else { none } } } } } } } } } } } } } }
}

fn ensure_runtime_method(mut ctx: LlvmCtx, name: Str, arg_count: Int) -> LLVMValueRef {
    match ctx.rt_fns.get(name) {
        some(f) => f,
        none => {
            // Dynamically declare — most runtime methods take ptr args and return ptr
            let ptr = ctx.ptr_type
            let mut param_types: List<LLVMTypeRef> = []
            for i in 0..arg_count {
                param_types.push(ptr)
            }
            // Void-returning methods
            if is_void_runtime_fn(name) {
                get_or_declare_runtime_fn(ctx, name, param_types, ctx.void_type)
            } else {
                get_or_declare_runtime_fn(ctx, name, param_types, ptr)
            }
        },
    }
}

// ============================================================
// Field access
// ============================================================

fn gen_field_access(mut ctx: LlvmCtx, receiver: HExpr, field: Str, ty: Type) -> LLVMValueRef {
    let recv_val = gen_llvm_expr(ctx, receiver)
    let recv_type = hexpr_type(receiver)

    let type_name = match recv_type {
        Type::StructType { name, .. } => name,
        _ => panic("LLVM codegen: field access on non-struct type"),
    }

    match ctx.struct_types.get(type_name) {
        some(info) => {
            // Find field index
            let mut field_idx = -1
            for i in 0..info.field_names.len() {
                if info.field_names[i] == field {
                    field_idx = i
                }
            }
            if field_idx < 0 {
                panic("LLVM codegen: field '${field}' not found in struct '${type_name}'")
            }
            // GEP into struct to get field pointer, then load
            let field_ptr = LLVMBuildStructGEP2(ctx.builder, info.llvm_type, recv_val, field_idx, fresh_name(ctx, "fp"))
            LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, fresh_name(ctx, field))
        },
        none => {
            panic("LLVM codegen: struct type '${type_name}' not registered")
        },
    }
}

// ============================================================
// Struct literal
// ============================================================

fn gen_struct_lit(mut ctx: LlvmCtx, name: Str, fields: List<HStructFieldInit>) -> LLVMValueRef {
    match ctx.struct_types.get(name) {
        some(info) => {
            // Allocate struct: malloc(sizeof(struct_type))
            let size = LLVMSizeOf(info.llvm_type)
            let malloc_fn = get_or_declare_runtime_fn(ctx, "malloc", [ctx.i64_type], ctx.ptr_type)
            let malloc_ty = get_rt_fn_type(ctx, "malloc")
            let struct_ptr = LLVMBuildCall2(ctx.builder, malloc_ty, malloc_fn, [size], fresh_name(ctx, "s"))

            // Store each field in the correct position
            for f in fields {
                let val = gen_llvm_expr(ctx, f.value)
                // Find field index
                let mut field_idx = -1
                for i in 0..info.field_names.len() {
                    if info.field_names[i] == f.name {
                        field_idx = i
                    }
                }
                if field_idx < 0 {
                    panic("LLVM codegen: field '${f.name}' not found in struct '${name}'")
                }
                let field_ptr = LLVMBuildStructGEP2(ctx.builder, info.llvm_type, struct_ptr, field_idx, fresh_name(ctx, "fp"))
                LLVMBuildStore(ctx.builder, val, field_ptr)
            }

            struct_ptr
        },
        none => {
            panic("LLVM codegen: struct type '${name}' not registered for literal")
        },
    }
}

// ============================================================
// Block expression
// ============================================================

fn gen_block(mut ctx: LlvmCtx, stmts: List<HStmt>, tail: HExpr?) -> LLVMValueRef {
    for stmt in stmts {
        emit_llvm_stmt(ctx, stmt)
    }
    match tail {
        some(t) => gen_llvm_expr(ctx, t),
        none => LLVMConstPointerNull(ctx.ptr_type),
    }
}

// ============================================================
// If expression
// ============================================================

fn gen_if_expr(mut ctx: LlvmCtx, condition: HExpr, then_branch: HExpr, else_branch: HExpr?) -> LLVMValueRef {
    let current_fn = match ctx.current_fn {
        some(f) => f,
        none => panic("LLVM codegen: if expr outside function"),
    }

    let cond_val = gen_llvm_expr(ctx, condition)
    let cond_i1 = unbox_to_i1(ctx, cond_val)

    let then_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "if.then")
    let else_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "if.else")
    let merge_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "if.merge")

    LLVMBuildCondBr(ctx.builder, cond_i1, then_bb, else_bb)

    // Then branch
    LLVMPositionBuilderAtEnd(ctx.builder, then_bb)
    let then_val = gen_llvm_expr(ctx, then_branch)
    let then_end_bb = LLVMGetInsertBlock(ctx.builder)
    LLVMBuildBr(ctx.builder, merge_bb)

    // Else branch
    LLVMPositionBuilderAtEnd(ctx.builder, else_bb)
    let else_val = match else_branch {
        some(eb) => gen_llvm_expr(ctx, eb),
        none => LLVMConstPointerNull(ctx.ptr_type),
    }
    let else_end_bb = LLVMGetInsertBlock(ctx.builder)
    LLVMBuildBr(ctx.builder, merge_bb)

    // Merge
    LLVMPositionBuilderAtEnd(ctx.builder, merge_bb)
    let phi = LLVMBuildPhi(ctx.builder, ctx.ptr_type, fresh_name(ctx, "if"))
    LLVMAddIncoming(phi, [then_val, else_val], [then_end_bb, else_end_bb])
    phi
}

// ============================================================
// String interpolation
// ============================================================

fn gen_string_interp(mut ctx: LlvmCtx, parts: List<HStringInterpPart>) -> LLVMValueRef {
    // Create a StringBuilder
    let sb_new_fn = get_or_declare_runtime_fn(ctx, "ring_sb_new", [], ctx.ptr_type)
    let sb_new_ty = get_rt_fn_type(ctx, "ring_sb_new")
    let sb = LLVMBuildCall2(ctx.builder, sb_new_ty, sb_new_fn, [], fresh_name(ctx, "sb"))

    let sb_add_fn = get_or_declare_runtime_fn(ctx, "ring_sb_add", [ctx.ptr_type, ctx.ptr_type], ctx.void_type)
    let sb_add_ty = get_rt_fn_type(ctx, "ring_sb_add")

    for part in parts {
        match part {
            HStringInterpPart::Literal(s) => {
                let str_val = gen_str_lit(ctx, s)
                LLVMBuildCall2(ctx.builder, sb_add_ty, sb_add_fn, [sb, str_val], "")
            },
            HStringInterpPart::Expression(e) => {
                let val = gen_llvm_expr(ctx, e)
                // Convert value to string based on its type
                let expr_type = hexpr_type(e)
                let str_val = convert_to_str(ctx, val, expr_type)
                LLVMBuildCall2(ctx.builder, sb_add_ty, sb_add_fn, [sb, str_val], "")
            },
        }
    }

    // Convert StringBuilder to Str
    let sb_to_str_fn = get_or_declare_runtime_fn(ctx, "ring_sb_to_str", [ctx.ptr_type], ctx.ptr_type)
    let sb_to_str_ty = get_rt_fn_type(ctx, "ring_sb_to_str")
    LLVMBuildCall2(ctx.builder, sb_to_str_ty, sb_to_str_fn, [sb], fresh_name(ctx, "interp"))
}

fn convert_to_str(mut ctx: LlvmCtx, val: LLVMValueRef, ty: Type) -> LLVMValueRef {
    if is_str_type(ty) {
        val
    } else {
        if is_int_type(ty) {
            let to_str_fn = get_or_declare_runtime_fn(ctx, "ring_int_to_str", [ctx.ptr_type], ctx.ptr_type)
            let to_str_ty = get_rt_fn_type(ctx, "ring_int_to_str")
            LLVMBuildCall2(ctx.builder, to_str_ty, to_str_fn, [val], fresh_name(ctx, "its"))
        } else {
            if is_float_type(ty) {
                let to_str_fn = get_or_declare_runtime_fn(ctx, "ring_float_to_str", [ctx.ptr_type], ctx.ptr_type)
                let to_str_ty = get_rt_fn_type(ctx, "ring_float_to_str")
                LLVMBuildCall2(ctx.builder, to_str_ty, to_str_fn, [val], fresh_name(ctx, "fts"))
            } else {
                if is_bool_type(ty) {
                    let to_str_fn = get_or_declare_runtime_fn(ctx, "ring_bool_to_str", [ctx.ptr_type], ctx.ptr_type)
                    let to_str_ty = get_rt_fn_type(ctx, "ring_bool_to_str")
                    LLVMBuildCall2(ctx.builder, to_str_ty, to_str_fn, [val], fresh_name(ctx, "bts"))
                } else {
                    // Default: try int_to_str as fallback
                    let to_str_fn = get_or_declare_runtime_fn(ctx, "ring_int_to_str", [ctx.ptr_type], ctx.ptr_type)
                    let to_str_ty = get_rt_fn_type(ctx, "ring_int_to_str")
                    LLVMBuildCall2(ctx.builder, to_str_ty, to_str_fn, [val], fresh_name(ctx, "ts"))
                }
            }
        }
    }
}

// ============================================================
// Helper: boxing
// ============================================================

pub fn box_int(mut ctx: LlvmCtx, raw: LLVMValueRef) -> LLVMValueRef {
    let box_fn = get_or_declare_runtime_fn(ctx, "ring_box_int", [ctx.i64_type], ctx.ptr_type)
    let box_ty = get_rt_fn_type(ctx, "ring_box_int")
    LLVMBuildCall2(ctx.builder, box_ty, box_fn, [raw], fresh_name(ctx, "bi"))
}

pub fn box_float(mut ctx: LlvmCtx, raw: LLVMValueRef) -> LLVMValueRef {
    let box_fn = get_or_declare_runtime_fn(ctx, "ring_box_float", [ctx.double_type], ctx.ptr_type)
    let box_ty = get_rt_fn_type(ctx, "ring_box_float")
    LLVMBuildCall2(ctx.builder, box_ty, box_fn, [raw], fresh_name(ctx, "bf"))
}

pub fn box_bool(mut ctx: LlvmCtx, raw: LLVMValueRef) -> LLVMValueRef {
    let box_fn = get_or_declare_runtime_fn(ctx, "ring_box_bool", [ctx.i64_type], ctx.ptr_type)
    let box_ty = get_rt_fn_type(ctx, "ring_box_bool")
    LLVMBuildCall2(ctx.builder, box_ty, box_fn, [raw], fresh_name(ctx, "bb"))
}

// ============================================================
// Helper: unbox bool to i1
// ============================================================

pub fn unbox_to_i1(mut ctx: LlvmCtx, val: LLVMValueRef) -> LLVMValueRef {
    let unbox_fn = get_or_declare_runtime_fn(ctx, "ring_unbox_bool", [ctx.ptr_type], ctx.i64_type)
    let unbox_ty = get_rt_fn_type(ctx, "ring_unbox_bool")
    let raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [val], fresh_name(ctx, "ub"))
    LLVMBuildTrunc(ctx.builder, raw, ctx.i1_type, fresh_name(ctx, "i1"))
}
