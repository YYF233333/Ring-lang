use types::{Type, Effect, EffectRow, effect_kind_name, type_to_builtin_name, type_to_string}
use ast::{BinOp, UnaryOp, Pattern, LiteralValue, NamedPatternField}
use hir::{HExpr, HStmt, HMatchArm, HParam, HStructFieldInit,
    HStringInterpPart, HEffectHandler, HEffectOp, DictRef, DictDispatchInfo, TraitDispatch,
    evidence_param_name, trait_dict_name, trait_bound_param_name,
    BUILTIN_INT, BUILTIN_FLOAT, BUILTIN_STR, BUILTIN_BOOL,
    BUILTIN_LIST, BUILTIN_MAP, BUILTIN_SET, BUILTIN_OPTION,
    BUILTIN_RANGE,
    effect_op_slot,
    hexpr_type, hexpr_effects, is_fresh_owned_bool_value,
    is_extern_handle_type}
use codegen_llvm_ctx::{LlvmCtx, StructFieldInfo, EnumTypeInfo, EnumVariantInfo,
    ExternFnInfo, ExternParamMarshall, ExternRetMarshall,
    fresh_name, get_or_declare_runtime_fn, get_rt_fn_type,
    llvm_mangle_fn, llvm_mangle_fn_with_prefix, llvm_mangle_method,
    llvm_resolve_fn, build_entry_alloca,
    get_or_assign_typeid, RING_TYPEID_CELL, RING_TYPEID_CLOSURE_ENV,
    RING_TYPEID_DICT_STATIC, RING_TYPEID_DICT_DYN}
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
// B-104 D4: module-level globals for the static dict singleton memo cells.
extern fn LLVMAddGlobal(m: LLVMModuleRef, ty: LLVMTypeRef, name: Str) -> LLVMValueRef
extern fn LLVMSetInitializer(global: LLVMValueRef, val: LLVMValueRef) -> Unit
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
extern fn LLVMBuildSwitch(builder: LLVMBuilderRef, val: LLVMValueRef, else_bb: LLVMBasicBlockRef, num_cases: Int) -> LLVMValueRef
extern fn LLVMAddCase(switch_val: LLVMValueRef, on_val: LLVMValueRef, dest: LLVMBasicBlockRef) -> Unit
extern fn LLVMBuildIntToPtr(builder: LLVMBuilderRef, val: LLVMValueRef, dest_ty: LLVMTypeRef, name: Str) -> LLVMValueRef
extern fn LLVMBuildPtrToInt(builder: LLVMBuilderRef, val: LLVMValueRef, dest_ty: LLVMTypeRef, name: Str) -> LLVMValueRef
// B-080: bitwise ops for tagged-pointer inline encoding
extern fn LLVMBuildShl(builder: LLVMBuilderRef, lhs: LLVMValueRef, rhs: LLVMValueRef, name: Str) -> LLVMValueRef
extern fn LLVMBuildAShr(builder: LLVMBuilderRef, lhs: LLVMValueRef, rhs: LLVMValueRef, name: Str) -> LLVMValueRef
extern fn LLVMBuildOr(builder: LLVMBuilderRef, lhs: LLVMValueRef, rhs: LLVMValueRef, name: Str) -> LLVMValueRef
// B-089 G-b: attribute API for _setjmp returns_twice
extern type LLVMAttributeRef
extern fn LLVMAddAttributeAtIndex(fn_val: LLVMValueRef, attr_index: Int, attr: LLVMAttributeRef) -> Unit
extern fn LLVMGetEnumAttributeKindForName(name: Str, s_len: Int) -> Int
extern fn LLVMCreateEnumAttribute(ctx: LLVMContextRef, kind_id: Int, val: Int) -> LLVMAttributeRef

// ============================================================
// Type-aware map/set dispatch helpers
// ============================================================

fn is_int_keyed_map(ty: Type) -> Bool {
    match ty {
        Type::StructType { name, type_params } =>
            name == "Map" && type_params.len() == 2 && match type_params[0] {
                Type::IntType => true,
                _ => false,
            },
        _ => false,
    }
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

// B-134: Validate that a StructType claiming to be List/Map/Set has the correct
// structural signature (type_params count). Returns false for user
// structs that happen to share a builtin collection name.
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

// ============================================================
// Main expression dispatch
// ============================================================

pub fn gen_llvm_expr(mut ctx: LlvmCtx, expr: HExpr) -> LLVMValueRef {
    match expr {
        HExpr::IntLit { value, .. } => gen_int_lit(ctx, value),
        HExpr::FloatLit { value, .. } => gen_float_lit(ctx, value),
        HExpr::StrLit { value, .. } => gen_str_lit(ctx, value),
        HExpr::BoolLit { value, .. } => gen_bool_lit(ctx, value),
        HExpr::Ident { name, resolved_name, def_id, dict_closure_dicts, ty, .. } => gen_ident(ctx, name, resolved_name, def_id, dict_closure_dicts, ty),
        HExpr::BinOp { op, left, right, eq_dispatch, ord_dispatch, ty, .. } => gen_binop(ctx, op, left, right, eq_dispatch, ord_dispatch, ty),
        HExpr::UnaryOp { op, operand, ty, .. } => gen_unaryop(ctx, op, operand, ty),
        HExpr::Call { callee, args, resolved_dicts, dict_dispatch, ty, effects, .. } =>
            gen_call(ctx, callee, args, resolved_dicts, dict_dispatch, ty, effects),
        // B-104 D4: local construction of a DYNAMIC wrapped dict (dict_lower's
        // `let __ring_dictlocal_N = …` init) — a fresh owned value, reclaimed
        // by the binding's Perceus scope-end drop.
        HExpr::DictConstruct { base_dict, trait_name, inner, .. } =>
            build_wrapped_dict(ctx, base_dict, trait_name, inner),
        HExpr::FieldAccess { receiver, field, ty, .. } =>
            gen_field_access(ctx, receiver, field, ty),
        HExpr::StructLit { name, fields, spread, .. } =>
            gen_struct_lit(ctx, name, fields, spread),
        HExpr::Block { stmts, tail, .. } =>
            gen_block(ctx, stmts, tail),
        HExpr::IfExpr { condition, then_branch, else_branch, .. } =>
            gen_if_expr(ctx, condition, then_branch, else_branch),
        HExpr::StringInterp { parts, .. } =>
            gen_string_interp(ctx, parts),
        HExpr::Lambda { params, return_type, body, ty, .. } =>
            gen_lambda(ctx, params, return_type, body, ty),
        HExpr::MatchExpr { scrutinee, arms, ty, .. } =>
            gen_match_expr(ctx, scrutinee, arms, ty),
        HExpr::NamedVariantConstruct { enum_name, variant_name, fields, .. } =>
            gen_named_variant_construct(ctx, enum_name, variant_name, fields),
        HExpr::TryCatch { body, arms, .. } =>
            gen_try_catch(ctx, body, arms),
        HExpr::HandleExpr { body, handlers, .. } =>
            gen_handle_expr(ctx, body, handlers),
        HExpr::EffectOp { effect_name, op_name, args, .. } =>
            gen_effect_op(ctx, effect_name, op_name, args),
        HExpr::RangeExpr { start, end, inclusive, .. } =>
            gen_range_expr(ctx, start, end, inclusive),
        HExpr::ListLit { elements, .. } =>
            gen_list_lit(ctx, elements),
        HExpr::TupleLit { elements, .. } =>
            gen_tuple_lit(ctx, elements),
        HExpr::IndexExpr { receiver, index, ty, .. } =>
            gen_index_expr(ctx, receiver, index, ty),
        HExpr::Clone { inner, .. } =>
            gen_clone(ctx, inner),
        // B-113: return in match arm expression position — emit LLVM ret.
        // Same logic as emit_return in codegen_llvm_stmt.ring.
        HExpr::ReturnExpr { value, .. } => {
            match value {
                some(v) => {
                    let val = gen_llvm_expr(ctx, v)
                    discard(LLVMBuildRet(ctx.builder, val))
                },
                none => {
                    let null = LLVMConstPointerNull(ctx.ptr_type)
                    discard(LLVMBuildRet(ctx.builder, null))
                },
            }
            // Create a dead block after return so subsequent code doesn't pollute the terminated block
            match ctx.current_fn {
                some(f) => {
                    let dead_bb = LLVMAppendBasicBlockInContext(ctx.context, f, "after.ret")
                    LLVMPositionBuilderAtEnd(ctx.builder, dead_bb)
                },
                none => {},
            }
            // Return a null pointer as placeholder (unreachable).
            LLVMConstPointerNull(ctx.ptr_type)
        },
    }
}

// ============================================================
// B-098: value-level clone (clone-all-escape borrow model)
// ============================================================
//
// Perceus wraps an escaping value that already has an independent owner (an
// Ident binding, a FieldAccess / IndexExpr projection, or a container read
// result) in `Clone{inner}`.  Under the borrow model, reads do NOT dup, so the
// projected/read value is a borrow that still belongs to its source aggregate.
// When such a value escapes into an owned slot (container push, struct field,
// return, let binding, closure capture), it needs its own owned reference, or
// the sink and the source would double-free the one allocation.  Lowering:
// evaluate inner, ring_dup the result, return the (now owned) pointer.
fn gen_clone(mut ctx: LlvmCtx, inner: HExpr) -> LLVMValueRef {
    let val = gen_llvm_expr(ctx, inner)
    gen_dup_value(ctx, val)
}

// ============================================================
// Literals
// ============================================================

fn gen_int_lit(mut ctx: LlvmCtx, value: Int) -> LLVMValueRef {
    // B-080: inline tagged pointer — (val << 1) | 1, constant-folded to inttoptr.
    let raw = LLVMConstInt(ctx.i64_type, value, 1)
    let shifted = LLVMBuildShl(ctx.builder, raw, LLVMConstInt(ctx.i64_type, 1, 0), fresh_name(ctx, "sh"))
    let tagged = LLVMBuildOr(ctx.builder, shifted, LLVMConstInt(ctx.i64_type, 1, 0), fresh_name(ctx, "tg"))
    LLVMBuildIntToPtr(ctx.builder, tagged, ctx.ptr_type, fresh_name(ctx, "int"))
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
    // B-080: inline tagged pointer — true = inttoptr 3, false = inttoptr 1.
    let val = if value { LLVMConstInt(ctx.i64_type, 3, 0) } else { LLVMConstInt(ctx.i64_type, 1, 0) }
    LLVMBuildIntToPtr(ctx.builder, val, ctx.ptr_type, fresh_name(ctx, "bool"))
}

// ============================================================
// Identifiers
// ============================================================

// B-091: boxed mut-cell support.  A `let mut` variable that a closure writes
// through is auto-boxed (def_id ∈ ctx.boxed_vars) into a single-slot heap cell
// `{ ptr value }` so the outer scope and the captured closure env share one
// mutable container.  The variable's alloca holds the CELL pointer; reads load
// `cell.value`, writes store into it, and closures capture the (shared) cell
// pointer.  Mirrors the JS backend's `let c = {value: init}` + `c.value`.

pub fn is_boxed_def(ctx: LlvmCtx, def_id: Int?) -> Bool {
    match def_id {
        some(did) => ctx.boxed_vars.contains(did),
        none => false,
    }
}

// The cell's LLVM struct type: { ptr value }.
fn cell_struct_ty(ctx: LlvmCtx) -> LLVMTypeRef {
    LLVMStructTypeInContext(ctx.context, [ctx.ptr_type], 0)
}

// Allocate a fresh mut-cell holding `init_val` and return the cell pointer.
pub fn build_cell_alloc(mut ctx: LlvmCtx, init_val: LLVMValueRef) -> LLVMValueRef {
    let cell_ty = cell_struct_ty(ctx)
    let size = LLVMSizeOf(cell_ty)
    let alloc_fn = get_or_declare_runtime_fn(ctx, "ring_alloc", [ctx.i64_type, ctx.i64_type], ctx.ptr_type)
    let alloc_ty = get_rt_fn_type(ctx, "ring_alloc")
    let typeid_val = LLVMConstInt(ctx.i64_type, RING_TYPEID_CELL, 0)
    let cell_ptr = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [size, typeid_val], fresh_name(ctx, "cell"))
    let value_slot = LLVMBuildStructGEP2(ctx.builder, cell_ty, cell_ptr, 0, fresh_name(ctx, "cellv"))
    discard(LLVMBuildStore(ctx.builder, init_val, value_slot))
    cell_ptr
}

// Read `cell.value` given the cell pointer.  Borrow semantics (no dup), matching
// the field-access read convention used elsewhere in the L0 backend.
fn build_cell_load(mut ctx: LlvmCtx, cell_ptr: LLVMValueRef, name: Str) -> LLVMValueRef {
    let cell_ty = cell_struct_ty(ctx)
    let value_slot = LLVMBuildStructGEP2(ctx.builder, cell_ty, cell_ptr, 0, fresh_name(ctx, "cellr"))
    LLVMBuildLoad2(ctx.builder, ctx.ptr_type, value_slot, fresh_name(ctx, name))
}

// Store `new_val` into `cell.value`.  Leak-on-overwrite, matching the struct
// field-assign convention in the L0 backend (no drop of the old value).
pub fn build_cell_store(mut ctx: LlvmCtx, cell_ptr: LLVMValueRef, new_val: LLVMValueRef) {
    let cell_ty = cell_struct_ty(ctx)
    let value_slot = LLVMBuildStructGEP2(ctx.builder, cell_ty, cell_ptr, 0, fresh_name(ctx, "cellw"))
    discard(LLVMBuildStore(ctx.builder, new_val, value_slot))
}

fn gen_ident(mut ctx: LlvmCtx, name: Str, resolved_name: Str?, def_id: Int?, dict_closure_dicts: List<Str>?, ty: Type) -> LLVMValueRef {
    // #B-087 gap 1: a polymorphic function used as a first-class value carries
    // dict_closure_dicts (the resolved trait dicts for its bounds). The function is
    // generated with the dicts as trailing params (fn(args, dict...)), but a bare
    // function value would be called through the uniform closure ABI fn(env, args)
    // without supplying the dicts. So we build a real closure {fn_ptr, env_ptr} whose
    // fn_ptr is a thunk that drops env and forwards (args, captured dicts) to the real
    // function. Mirrors the JS backend's `(p0..) => fn(p0.., dict..)` wrapper.
    match dict_closure_dicts {
        some(dicts) => {
            if dicts.len() > 0 {
                let lk = match resolved_name { some(rn) => rn, none => name }
                return gen_dict_closure_wrapper(ctx, lk, name, dicts, ty)
            }
        },
        none => {},
    }
    let lookup_name = match resolved_name {
        some(rn) => rn,
        none => name,
    }
    let boxed = is_boxed_def(ctx, def_id)
    // First check local variables
    match ctx.named_values.get(lookup_name) {
        some(alloca) => {
            let cur = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, alloca, fresh_name(ctx, lookup_name))
            if boxed { build_cell_load(ctx, cur, lookup_name) } else { cur }
        },
        none => {
            match ctx.named_values.get(name) {
                some(alloca) => {
                    let cur = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, alloca, fresh_name(ctx, name))
                    if boxed { build_cell_load(ctx, cur, name) } else { cur }
                },
                none => {
                    match ty {
                        Type::FnType { .. } => {
                            return gen_dict_closure_wrapper(ctx, lookup_name, name, [], ty)
                        },
                        _ => {},
                    }
                    // Try module-aware resolution: imports_map → module_prefix → bare
                    let mangled_resolved = llvm_resolve_fn(ctx, lookup_name)
                    match ctx.functions.get(mangled_resolved) {
                        some(fn_val) => call_zero_arg_or_return(ctx, fn_val, mangled_resolved),
                        none => {
                            // Try bare mangling (for builtins and cross-module names)
                            let mangled_bare = llvm_mangle_fn(name)
                            match ctx.functions.get(mangled_bare) {
                                some(fn_val) => call_zero_arg_or_return(ctx, fn_val, mangled_bare),
                                none => {
                                    // Also try with module prefix on name
                                    let mangled_name_resolved = llvm_resolve_fn(ctx, name)
                                    match ctx.functions.get(mangled_name_resolved) {
                                        some(fn_val) => call_zero_arg_or_return(ctx, fn_val, mangled_name_resolved),
                                        none => {
                                            // Last resort: try bare lookup_name
                                            let mangled_lu = llvm_mangle_fn(lookup_name)
                                            match ctx.functions.get(mangled_lu) {
                                                some(fn_val) => call_zero_arg_or_return(ctx, fn_val, mangled_lu),
                                                none => {
                                            // Last resort: precise cross-module lookup
                                            // (imports_map → prefix enumeration → suffix fallback)
                                            let found = find_fn_precise(ctx, name)
                                            match found {
                                                some(fi) => call_zero_arg_or_return(ctx, fi.fn_val, fi.fn_mangled),
                                                none => {
                                                    let found2 = find_fn_precise(ctx, lookup_name)
                                                    match found2 {
                                                        some(fi2) => call_zero_arg_or_return(ctx, fi2.fn_val, fi2.fn_mangled),
                                                        none => panic("LLVM codegen: undefined variable '${name}' (resolved: '${lookup_name}')"),
                                                    }
                                                },
                                            }
                                        },
                                            }
                                        },
                                    }
                                },
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

// #B-087 gap 1: build a closure value for a polymorphic function used as a first-class
// value. The function `real_fn` is generated as fn(args, dict0..dictM, ev0..evK) -> ptr
// (direct ABI). A bare function value is invoked through the uniform closure ABI
// fn(env, args) without dicts. We therefore emit a thunk
//   ring_<fn>__dictwrap(env, p0..pN) -> ptr
// that loads the captured dicts/evidence from env and forwards
//   real_fn(p0..pN, dict0..dictM, ev0..evK)
// then return a {fn_ptr=thunk, env_ptr} closure pair (typeid 7). B-104 D4: the env
// stores the resolved dicts as OWNED counted slots (ring_dup'd; static singletons
// are never-drop no-ops, a dynamic dict-param-backed dict gets a real reference
// released by drop_closure_env) followed by UNcounted evidence slots (handler-
// scoped lifetime, B-096). Mirrors the JS backend's
// `(p0..) => fn(p0.., dict.., ev..)` wrapper (codegen_expr.ring:38-62).
fn gen_dict_closure_wrapper(mut ctx: LlvmCtx, lookup_name: Str, name: Str, dict_names: List<Str>, ty: Type) -> LLVMValueRef {
    // Resolve the real function.
    let mangled = llvm_resolve_fn(ctx, lookup_name)
    let found = find_function_in_ctx(ctx, mangled, name)
    let fn_info = match found {
        some(fi) => fi,
        none => panic("LLVM codegen: dict-closure wrapper: function '${name}' not found"),
    }
    let real_fn = fn_info.fn_val
    let real_fn_ty = match ctx.fn_types.get(fn_info.fn_mangled) {
        some(t) => t,
        none => panic("LLVM codegen: dict-closure wrapper: fn type not found for ${fn_info.fn_mangled}"),
    }

    // Param count of the FUNCTION VALUE (without dicts/evidence) from its FnType.
    let param_count = match ty {
        Type::FnType { params, .. } => params.len(),
        _ => 0,
    }

    // Resolve the dicts at this site (current scope) into LLVMValueRefs.
    let mut dict_vals: List<LLVMValueRef> = []
    for dn in dict_names {
        dict_vals.push(resolve_dict_ref(ctx, DictRef::Simple(dn)))
    }

    // Evidence values for the function's effects (looked up in current scope).
    let mut ev_vals: List<LLVMValueRef> = []
    match ctx.fn_evidence_params.get(fn_info.fn_mangled) {
        some(ev_params) => {
            for ep in ev_params { ev_vals.push(lookup_evidence(ctx, ep)) }
        },
        none => {},
    }

    let captured_count = dict_vals.len() + ev_vals.len()

    // Env layout: { i64 count, dict0..dictD-1, ev0..evK-1 }.
    // B-104 D4 RC honesty: count = dict_count — the dict slots are OWNED
    // (ring_dup'd at store below; static singletons no-op, a dict-param-backed
    // dynamic dict gets a real reference), released by drop_closure_env when
    // the wrapper closure dies.  Evidence slots stay OUTSIDE the counted
    // window (stored after the dicts, never dropped) — evidence lifetime is
    // handler-scoped, not closure-owned (B-096 posture).
    let mut env_elem_types: List<LLVMTypeRef> = [ctx.i64_type]
    for i in 0..captured_count { env_elem_types.push(ctx.ptr_type) }
    let env_ty = LLVMStructTypeInContext(ctx.context, env_elem_types, 0)

    // Thunk signature: fn(env, p0..pN) -> ptr.
    let thunk_name = fresh_name(ctx, "ring_dictwrap_")
    let mut thunk_param_types: List<LLVMTypeRef> = [ctx.ptr_type]
    for i in 0..param_count { thunk_param_types.push(ctx.ptr_type) }
    let thunk_ty = LLVMFunctionType(ctx.ptr_type, thunk_param_types, 0)
    let thunk_fn = LLVMAddFunction(ctx.module, thunk_name, thunk_ty)

    // Emit the thunk body (save/restore builder position).
    let saved_fn = ctx.current_fn
    let saved_named = ctx.named_values
    let saved_bb = LLVMGetInsertBlock(ctx.builder)
    ctx.current_fn = some(thunk_fn)
    ctx.named_values = map_new()

    let entry = LLVMAppendBasicBlockInContext(ctx.context, thunk_fn, "entry")
    LLVMPositionBuilderAtEnd(ctx.builder, entry)

    let env_param = LLVMGetParam(thunk_fn, 0)
    // Forward args: p0..pN, then dicts/evidence loaded from env.
    let mut call_args: List<LLVMValueRef> = []
    for i in 0..param_count { call_args.push(LLVMGetParam(thunk_fn, i + 1)) }
    for i in 0..captured_count {
        let slot = LLVMBuildStructGEP2(ctx.builder, env_ty, env_param, i + 1, fresh_name(ctx, "ws"))
        call_args.push(LLVMBuildLoad2(ctx.builder, ctx.ptr_type, slot, fresh_name(ctx, "wd")))
    }
    let ret = LLVMBuildCall2(ctx.builder, real_fn_ty, real_fn, call_args, fresh_name(ctx, "wcall"))
    discard(LLVMBuildRet(ctx.builder, ret))

    // Restore state.
    ctx.named_values = saved_named
    ctx.current_fn = saved_fn
    LLVMPositionBuilderAtEnd(ctx.builder, saved_bb)

    // Allocate env and store count + captured dicts/evidence.
    let alloc_fn = get_or_declare_runtime_fn(ctx, "ring_alloc", [ctx.i64_type, ctx.i64_type], ctx.ptr_type)
    let alloc_ty = get_rt_fn_type(ctx, "ring_alloc")
    let env_size = LLVMSizeOf(env_ty)
    let env_typeid = LLVMConstInt(ctx.i64_type, RING_TYPEID_CLOSURE_ENV, 0)
    let env_alloc = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [env_size, env_typeid], fresh_name(ctx, "wenv"))
    let count_slot = LLVMBuildStructGEP2(ctx.builder, env_ty, env_alloc, 0, fresh_name(ctx, "wcnt"))
    discard(LLVMBuildStore(ctx.builder, LLVMConstInt(ctx.i64_type, dict_vals.len(), 0), count_slot))
    let mut slot_idx = 0
    for dv in dict_vals {
        // Own the dict reference (no-op for static singletons).
        discard(gen_dup_value(ctx, dv))
        let slot = LLVMBuildStructGEP2(ctx.builder, env_ty, env_alloc, slot_idx + 1, fresh_name(ctx, "wstore"))
        discard(LLVMBuildStore(ctx.builder, dv, slot))
        slot_idx = slot_idx + 1
    }
    for ev in ev_vals {
        let slot = LLVMBuildStructGEP2(ctx.builder, env_ty, env_alloc, slot_idx + 1, fresh_name(ctx, "wstore"))
        discard(LLVMBuildStore(ctx.builder, ev, slot))
        slot_idx = slot_idx + 1
    }

    // Closure pair { fn_ptr=thunk, env_ptr } (typeid 7).
    let closure_ty = LLVMStructTypeInContext(ctx.context, [ctx.ptr_type, ctx.ptr_type], 0)
    let closure_size = LLVMSizeOf(closure_ty)
    let closure_typeid = LLVMConstInt(ctx.i64_type, 7, 0)
    let closure_ptr = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [closure_size, closure_typeid], fresh_name(ctx, "wcls"))
    let fp_slot = LLVMBuildStructGEP2(ctx.builder, closure_ty, closure_ptr, 0, fresh_name(ctx, "wfp"))
    discard(LLVMBuildStore(ctx.builder, thunk_fn, fp_slot))
    let ep_slot = LLVMBuildStructGEP2(ctx.builder, closure_ty, closure_ptr, 1, fresh_name(ctx, "wep"))
    discard(LLVMBuildStore(ctx.builder, env_alloc, ep_slot))
    closure_ptr
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

fn is_unit_type(ty: Type) -> Bool {
    match ty {
        Type::UnitType => true,
        _ => false,
    }
}

fn operand_type_from_binop(left: HExpr) -> Type {
    hexpr_type(left)
}

fn gen_binop(mut ctx: LlvmCtx, op: BinOp, left: HExpr, right: HExpr, eq_dispatch: TraitDispatch?, ord_dispatch: TraitDispatch?, result_ty: Type) -> LLVMValueRef {
    let op_type = operand_type_from_binop(left)

    // B-104 D7: `&&`/`||` are rewritten to IfExpr by andor_lower (checker end)
    // and never reach codegen as BinOps.
    match op {
        BinOp::And => panic("LLVM codegen: BinOp::And must be lowered by andor_lower"),
        BinOp::Or => panic("LLVM codegen: BinOp::Or must be lowered by andor_lower"),
        _ => {},
    }

    // Trait-dispatched comparisons (Eq / Ord). The checker resolves a dispatch when
    // the operand type is a generic type variable, a user struct/enum, or otherwise
    // requires the trait. This MUST take precedence over the primitive fallback —
    // otherwise a generic `x == item` would be miscompiled as an integer compare,
    // which silently fails for heap-allocated (non-SSO) strings and for structs.
    let is_eq_op = match op { BinOp::Eq => true, BinOp::Neq => true, _ => false }
    let is_ord_op = match op {
        BinOp::Lt => true, BinOp::Lte => true, BinOp::Gt => true, BinOp::Gte => true, _ => false,
    }
    if is_eq_op {
        match eq_dispatch {
            some(d) => match d {
                TraitDispatch::Builtin => {},
                _ => { return gen_eq_dispatch_llvm(ctx, op, left, right, d) },
            },
            none => {},
        }
    }
    if is_ord_op {
        match ord_dispatch {
            some(d) => match d {
                TraitDispatch::Builtin => {},
                _ => { return gen_ord_dispatch_llvm(ctx, op, left, right, d) },
            },
            none => {},
        }
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

// Resolve the dict value for a trait dispatch (Eq/Ord).
fn resolve_dispatch_dict(mut ctx: LlvmCtx, dispatch: TraitDispatch, trait_name_hint: Str?) -> LLVMValueRef {
    match dispatch {
        TraitDispatch::Dict { param } => {
            match ctx.named_values.get(param) {
                some(alloca) => LLVMBuildLoad2(ctx.builder, ctx.ptr_type, alloca, fresh_name(ctx, "dp")),
                none => LLVMConstPointerNull(ctx.ptr_type),
            }
        },
        TraitDispatch::Direct { dict, extra_dicts } => {
            if extra_dicts.len() == 0 {
                resolve_dict_ref(ctx, DictRef::Simple(dict))
            } else {
                // B-121 gap 1: extra_dicts non-empty — build a wrapped dict so
                // inner type-param dicts are bound (matching the call-path
                // mechanism).  trait_name_hint is required; if absent, fall back
                // to base-only resolution (pre-existing behaviour).
                match trait_name_hint {
                    some(tn) => build_wrapped_dict(ctx, dict, tn, extra_dicts),
                    none => resolve_dict_ref(ctx, DictRef::Simple(dict)),
                }
            }
        },
        TraitDispatch::Builtin => LLVMConstPointerNull(ctx.ptr_type),
    }
}

// Load a method closure from a dict struct slot.  B-104 D4 dict layout is
// count-prefixed: { i64 method_count, ptr m0, ptr m1, ... } — method slot i
// lives at struct index i+1 (must match emit_trait_dict / build_wrapped_dict /
// ring_make_eq_dict / ring_make_ord_dict).
fn load_dict_method(mut ctx: LlvmCtx, dict_ptr: LLVMValueRef, slot: Int) -> LLVMValueRef {
    let dict_struct_ty = LLVMStructTypeInContext(ctx.context, [ctx.i64_type, ctx.ptr_type, ctx.ptr_type, ctx.ptr_type, ctx.ptr_type], 0)
    let slot_ptr = LLVMBuildStructGEP2(ctx.builder, dict_struct_ty, dict_ptr, slot + 1, fresh_name(ctx, "ms"))
    LLVMBuildLoad2(ctx.builder, ctx.ptr_type, slot_ptr, fresh_name(ctx, "mc"))
}

// Eq dispatch: call the dict's eq closure (method slot 0) on (lhs, rhs).
fn gen_eq_dispatch_llvm(mut ctx: LlvmCtx, op: BinOp, left: HExpr, right: HExpr, dispatch: TraitDispatch) -> LLVMValueRef {
    let lhs = gen_llvm_expr(ctx, left)
    let rhs = gen_llvm_expr(ctx, right)
    let dict_ptr = resolve_dispatch_dict(ctx, dispatch, some("Eq"))
    let eq_closure = load_dict_method(ctx, dict_ptr, 0)
    let result = gen_closure_call(ctx, eq_closure, [lhs, rhs])
    match op {
        BinOp::Neq => {
            // B-080: inline untag
            let raw = unbox_int(ctx, result)
            // B-104 D4: the eq closure's Bool box is INTERNAL on the Neq path —
            // unboxed then replaced by a fresh negated box.  Drop it (the shim /
            // Ring impl returns an OWNED fresh box; same family as the
            // while-cond post-unbox drop).  B-080: ring_drop early-returns for
            // tagged scalars, so this is a harmless no-op — kept for correctness
            // if the dispatch path ever returns a boxed value.
            let drop_fn = get_or_declare_runtime_fn(ctx, "ring_drop", [ctx.ptr_type], ctx.void_type)
            let drop_ty = get_rt_fn_type(ctx, "ring_drop")
            discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [result], ""))
            let one = LLVMConstInt(ctx.i64_type, 1, 0)
            let neg = LLVMBuildSub(ctx.builder, one, raw, fresh_name(ctx, "neg"))
            box_bool(ctx, neg)
        },
        _ => result,
    }
}

// Ord dispatch: call the dict's cmp closure (method slot 0); compare result to 0.
fn gen_ord_dispatch_llvm(mut ctx: LlvmCtx, op: BinOp, left: HExpr, right: HExpr, dispatch: TraitDispatch) -> LLVMValueRef {
    let lhs = gen_llvm_expr(ctx, left)
    let rhs = gen_llvm_expr(ctx, right)
    let dict_ptr = resolve_dispatch_dict(ctx, dispatch, some("Ord"))
    let cmp_closure = load_dict_method(ctx, dict_ptr, 0)
    let cmp_result = gen_closure_call(ctx, cmp_closure, [lhs, rhs])
    // B-080: inline untag
    let raw = unbox_int(ctx, cmp_result)
    // B-104 D4 (#151 probe D): the cmp INT box is INTERNAL — unboxed here and
    // replaced by a fresh Bool box below; it leaked once per Ord dispatch.
    // B-080: ring_drop early-returns for tagged scalars — kept for correctness.
    let cmp_drop_fn = get_or_declare_runtime_fn(ctx, "ring_drop", [ctx.ptr_type], ctx.void_type)
    let cmp_drop_ty = get_rt_fn_type(ctx, "ring_drop")
    discard(LLVMBuildCall2(ctx.builder, cmp_drop_ty, cmp_drop_fn, [cmp_result], ""))
    let zero = LLVMConstInt(ctx.i64_type, 0, 0)
    let pred = match op {
        BinOp::Lt => 40,
        BinOp::Lte => 41,
        BinOp::Gt => 38,
        BinOp::Gte => 39,
        _ => 32,
    }
    let cmp = LLVMBuildICmp(ctx.builder, pred, raw, zero, fresh_name(ctx, "ocmp"))
    let ext = LLVMBuildZExt(ctx.builder, cmp, ctx.i64_type, fresh_name(ctx, "ext"))
    box_bool(ctx, ext)
}

fn gen_int_binop(mut ctx: LlvmCtx, op: BinOp, lhs: LLVMValueRef, rhs: LLVMValueRef) -> LLVMValueRef {
    // B-080: inline untag
    let lhs_raw = unbox_int(ctx, lhs)
    let rhs_raw = unbox_int(ctx, rhs)

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
        BinOp::And => panic("LLVM codegen: BinOp::And lowered by andor_lower — unreachable"),
        BinOp::Or => panic("LLVM codegen: BinOp::Or lowered by andor_lower — unreachable"),
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
        BinOp::Gt => {
            let lt_fn = get_or_declare_runtime_fn(ctx, "ring_str_lt", [ctx.ptr_type, ctx.ptr_type], ctx.i64_type)
            let lt_ty = get_rt_fn_type(ctx, "ring_str_lt")
            let result = LLVMBuildCall2(ctx.builder, lt_ty, lt_fn, [rhs, lhs], fresh_name(ctx, "sgt"))
            box_bool(ctx, result)
        },
        _ => panic("LLVM codegen: unsupported str binop"),
    }
}

fn gen_bool_binop(mut ctx: LlvmCtx, op: BinOp, lhs: LLVMValueRef, rhs: LLVMValueRef) -> LLVMValueRef {
    // B-080: inline untag
    let lhs_raw = unbox_int(ctx, lhs)
    let rhs_raw = unbox_int(ctx, rhs)

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

// (gen_and / gen_or retired 2026-06-13 — B-104 D7: andor_lower rewrites
//  `&&`/`||` to IfExpr at checker end; gen_if_expr is the single phi path.
//  The old phi yielded the RHS operand box VERBATIM on the taken edge —
//  undroppable, the x-andor leak class.)

// ============================================================
// Unary operations
// ============================================================

fn gen_unaryop(mut ctx: LlvmCtx, op: UnaryOp, operand: HExpr, ty: Type) -> LLVMValueRef {
    let val = gen_llvm_expr(ctx, operand)
    match op {
        UnaryOp::Neg => {
            if is_int_type(ty) {
                // B-080: inline untag
                let raw = unbox_int(ctx, val)
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
            // B-080: inline untag
            let raw = unbox_int(ctx, val)
            let one = LLVMConstInt(ctx.i64_type, 1, 0)
            let neg = LLVMBuildSub(ctx.builder, one, raw, fresh_name(ctx, "not"))
            box_bool(ctx, neg)
        },
    }
}

// ============================================================
// Function calls
// ============================================================

// #B-087 gap 5 (#103): return the mut value-type flag list for this call's args,
// aligned to the `args` list (i.e. excluding the receiver/self). For a bare Ident
// callee, fn_mut_params is keyed by the call name and already aligns with args. For
// a method call (FieldAccess), the scanned flags include self at index 0, so we drop
// the leading flag to align with the receiver-less args. Returns none when the callee
// has no recorded mut params (the common case → no boxing overhead).
fn lookup_call_mut_flags(ctx: LlvmCtx, callee: HExpr) -> List<Bool>? {
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
                        // Drop the leading self flag so the list aligns with `args`.
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

// #B-087 gap 5 (#103): produce the value to pass for a `mut` value-type argument.
// The callee expects a CELL pointer (ptr-to-box) it can write through. If the arg is
// an Ident whose def is already auto-boxed (boxed_vars — a `let mut` written through
// by a closure), its alloca already holds the shared cell; pass that cell directly so
// the callee's writes are observed by the caller. Otherwise wrap the evaluated value
// in a fresh cell (mirrors the JS backend's `{value: expr}` temporary box: a fresh
// cell still gives correct in-callee mutation semantics; write-back to a non-boxed
// caller var is not expected, matching JS).
fn gen_mut_arg_llvm(mut ctx: LlvmCtx, arg: HExpr) -> LLVMValueRef {
    match arg {
        HExpr::Ident { name, resolved_name, def_id, .. } => {
            if is_boxed_def(ctx, def_id) {
                // Already a shared cell: load the cell pointer from its alloca (do NOT
                // go through build_cell_load, which would read field 0). The alloca
                // holds the cell ptr itself.
                let lookup_name = match resolved_name {
                    some(rn) => rn,
                    none => name,
                }
                match ctx.named_values.get(lookup_name) {
                    some(alloca) => LLVMBuildLoad2(ctx.builder, ctx.ptr_type, alloca, fresh_name(ctx, "mcell")),
                    none => match ctx.named_values.get(name) {
                        some(alloca) => LLVMBuildLoad2(ctx.builder, ctx.ptr_type, alloca, fresh_name(ctx, "mcell")),
                        none => {
                            // Fallback: evaluate and box fresh.
                            let v = gen_llvm_expr(ctx, arg)
                            build_cell_alloc(ctx, v)
                        },
                    },
                }
            } else {
                let v = gen_llvm_expr(ctx, arg)
                build_cell_alloc(ctx, v)
            }
        },
        _ => {
            let v = gen_llvm_expr(ctx, arg)
            build_cell_alloc(ctx, v)
        },
    }
}

fn gen_call(mut ctx: LlvmCtx, callee: HExpr, args: List<HExpr>, resolved_dicts: List<DictRef>, dict_dispatch: DictDispatchInfo?, result_ty: Type, effects: EffectRow) -> LLVMValueRef {
    // Handle dict dispatch (trait method call through dict parameter)
    match dict_dispatch {
        some(dd) => {
            // B-118: Unit-returning dict dispatch calls must emit null, not the
            // runtime's ABI return value (which may be the receiver pointer).
            let raw = gen_dict_dispatch_call(ctx, callee, args, dd)
            if is_unit_type(result_ty) {
                return LLVMConstPointerNull(ctx.ptr_type)
            }
            return raw
        },
        none => {},
    }

    // #B-087 gap 5 (#103): determine which args land in a `mut` value-type param so
    // they are passed as a shared CELL (ptr-to-box) instead of the bare boxed value.
    // The callee receives those params as a cell and reads/writes go through field 0,
    // so a reassignment `x = new_val` writes through to the caller's cell. Look up the
    // flag list by callee name (bare fn) or UFCS Type_method (method call).
    let mut_flags = lookup_call_mut_flags(ctx, callee)

    // Evaluate all args first (boxing mut value-type positions into cells).
    let mut arg_vals: List<LLVMValueRef> = []
    let mut argi = 0
    for a in args {
        let is_mut = match mut_flags {
            some(flags) => match flags.get(argi) { some(f) => f, none => false },
            none => false,
        }
        if is_mut {
            arg_vals.push(gen_mut_arg_llvm(ctx, a))
        } else {
            arg_vals.push(gen_llvm_expr(ctx, a))
        }
        argi = argi + 1
    }

    // Resolve dict refs into LLVMValueRef
    let dict_vals = resolve_dict_refs(ctx, resolved_dicts)

    // Determine function to call
    let raw = match callee {
        HExpr::Ident { name, resolved_name, .. } => {
            let call_name = match resolved_name {
                some(rn) => rn,
                none => name,
            }
            // #132 print parity: `print<T>` accepts any type and the JS oracle
            // stringifies it (console.log). The runtime ring_print expects its arg
            // to already be a Str (casts to std::string*), so a boxed Int/Float/Bool
            // would crash / mis-print. Coerce a non-Str arg to its Str rendering via
            // the same convert_to_str path string interpolation uses. (resolved_name
            // for the builtin is "print"; guard on a single arg.)
            if call_name == "print" && args.len() == 1 {
                match args.get(0) {
                    some(arg0) => {
                        let arg_ty = hexpr_type(arg0)
                        // Only coerce the scalar boxed primitives (Int/Float/Bool):
                        // these are the cases ring_print would mis-cast. Str passes
                        // through; other types (struct/list/enum) keep prior behavior
                        // (structural display is out of #132's scope).
                        if is_int_type(arg_ty) || is_float_type(arg_ty) || is_bool_type(arg_ty) {
                            match arg_vals.get(0) {
                                some(av) => {
                                    let coerced = convert_to_str(ctx, av, arg_ty)
                                    return gen_runtime_call(ctx, "ring_print", [coerced])
                                },
                                none => {},
                            }
                        }
                    },
                    none => {},
                }
            }
            let final_name = if call_name == "map_new" && is_int_keyed_map(result_ty) {
                "map_int_new"
            } else { if call_name == "set_new" && is_int_set(result_ty) {
                "set_int_new"
            } else { if call_name == "map_from" && is_int_keyed_map(result_ty) {
                "map_int_from"
            } else { if call_name == "set_from" && is_int_set(result_ty) {
                "set_int_from"
            } else { call_name } } } }
            gen_direct_call(ctx, final_name, arg_vals, dict_vals)
        },
        HExpr::FieldAccess { receiver, field, .. } => {
            // Method call: receiver.method(args)
            let recv_val = gen_llvm_expr(ctx, receiver)
            let recv_type = hexpr_type(receiver)
            gen_method_call(ctx, recv_val, recv_type, field, arg_vals, dict_vals)
        },
        _ => {
            // Unknown callee — might be a closure
            let closure_val = gen_llvm_expr(ctx, callee)
            gen_closure_call(ctx, closure_val, arg_vals)
        },
    }
    // B-118: Unit-typed call results must be null, not the runtime's ABI
    // return value.  Mutator functions (List.push etc.) return the receiver
    // pointer for convenience, but that is an ABI accident — a Unit value
    // must never carry a live object pointer that RC might try to free.
    if is_unit_type(result_ty) {
        return LLVMConstPointerNull(ctx.ptr_type)
    }
    raw
}

// ============================================================
// Resolve DictRef list to LLVM values
// ============================================================

fn resolve_dict_refs(mut ctx: LlvmCtx, dicts: List<DictRef>) -> List<LLVMValueRef> {
    let mut result: List<LLVMValueRef> = []
    for d in dicts {
        result.push(resolve_dict_ref(ctx, d))
    }
    result
}

fn resolve_dict_ref(mut ctx: LlvmCtx, dr: DictRef) -> LLVMValueRef {
    match dr {
        DictRef::Simple(name) => {
            // A scope reference: dict parameter (__ring_T_Eq) or dict_lower's
            // local dict binding (__ring_dictlocal_N).  Name-based legacy
            // callers (dict_closure_dicts / derive extra_dicts strings) also
            // funnel here, so unknown names fall through to the static chain.
            match ctx.named_values.get(name) {
                some(alloca) => LLVMBuildLoad2(ctx.builder, ctx.ptr_type, alloca, fresh_name(ctx, "dict")),
                none => resolve_static_dict_by_name(ctx, name),
            }
        },
        // B-104 D4: module-level static dict singleton reference (borrow).
        DictRef::Static(name) => resolve_static_dict_by_name(ctx, name),
        DictRef::Wrapped { dict, trait_name, inner_dicts } => {
            // #B-087 gap 2: a wrapped dict for a parameterized type whose trait impl
            // needs the inner type-param dicts bound. Build a real wrapper dict (see
            // build_wrapped_dict). Previously returned null → dispatch crash.
            // Post-dict_lower this survives only in BinOp dispatch extra_dicts
            // (which the LLVM Eq/Ord dispatch ignores — pre-existing gap).
            build_wrapped_dict(ctx, dict, trait_name, inner_dicts)
        },
    }
}

// Resolve a STATIC dict by name — B-104 D4: every path returns the MEMOISED
// MODULE SINGLETON (one construction per dict per process):
//   * impl dicts: ring_dict_init_<name> (emit_trait_dict — memoised internally
//     via the @__ring_dictg_<name> global);
//   * wrapped instances / builtin primitive dicts: a synthesised memoised
//     getter of the same name (get_or_create_static_dict_getter).
// This kills the per-call-site fresh TUPLE+closures+name-STR synthesis (#151).
pub fn resolve_static_dict_by_name(mut ctx: LlvmCtx, name: Str) -> LLVMValueRef {
    let init_fn_name = "ring_dict_init_${name}"
    match ctx.functions.get(init_fn_name) {
        some(init_fn) => {
            let init_fn_ty = match ctx.fn_types.get(init_fn_name) {
                some(t) => t,
                none => {
                    // Fallback: create a () -> ptr type
                    LLVMFunctionType(ctx.ptr_type, [], 0)
                },
            }
            // Call the init function to get the dict
            LLVMBuildCall2(ctx.builder, init_fn_ty, init_fn, [], fresh_name(ctx, "dict"))
        },
        none => {
            // Check dict_globals
            match ctx.dict_globals.get(name) {
                some(init_fn) => {
                    let ft = LLVMFunctionType(ctx.ptr_type, [], 0)
                    LLVMBuildCall2(ctx.builder, ft, init_fn, [], fresh_name(ctx, "dict"))
                },
                none => {
                    let getter = get_or_create_static_dict_getter(ctx, name)
                    let ft = LLVMFunctionType(ctx.ptr_type, [], 0)
                    LLVMBuildCall2(ctx.builder, ft, getter, [], fresh_name(ctx, "dict"))
                },
            }
        },
    }
}

// B-104 D4: the module-level global ptr (@__ring_dictg_<name>, init null)
// backing a static dict singleton's memoised getter.
pub fn get_or_create_dict_global(mut ctx: LlvmCtx, name: Str) -> LLVMValueRef {
    match ctx.dict_singletons.get(name) {
        some(g) => g,
        none => {
            let g = LLVMAddGlobal(ctx.module, ctx.ptr_type, "__ring_dictg_${name}")
            LLVMSetInitializer(g, LLVMConstPointerNull(ctx.ptr_type))
            ctx.dict_singletons.insert(name, g)
            g
        },
    }
}

// B-104 D4: wrap a raw dict BUILD function (ring_dict_build_<name>, emitted by
// emit_trait_dict for impl dicts) in the memoised singleton getter
// `ring_dict_init_<name>`: { if @g == null { @g = build() }; return @g }.
// Registered under the init name so resolve_static_dict_by_name finds it.
pub fn emit_memoised_dict_getter(mut ctx: LlvmCtx, name: Str, build_fn: LLVMValueRef, build_fn_ty: LLVMTypeRef) -> LLVMValueRef {
    let fname = "ring_dict_init_${name}"
    match ctx.functions.get(fname) {
        some(existing) => { return existing },
        none => {},
    }
    let fn_ty = LLVMFunctionType(ctx.ptr_type, [], 0)
    let fn_val = LLVMAddFunction(ctx.module, fname, fn_ty)
    ctx.functions.insert(fname, fn_val)
    ctx.fn_types.insert(fname, fn_ty)
    let g = get_or_create_dict_global(ctx, name)

    let saved_fn = ctx.current_fn
    let saved_bb = LLVMGetInsertBlock(ctx.builder)
    ctx.current_fn = some(fn_val)

    let entry = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "entry")
    let build_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "build")
    let done_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "done")

    LLVMPositionBuilderAtEnd(ctx.builder, entry)
    let cached = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, g, fresh_name(ctx, "dc"))
    // 32 = LLVMIntEQ
    let isnull = LLVMBuildICmp(ctx.builder, 32, cached, LLVMConstPointerNull(ctx.ptr_type), fresh_name(ctx, "dn"))
    discard(LLVMBuildCondBr(ctx.builder, isnull, build_bb, done_bb))

    LLVMPositionBuilderAtEnd(ctx.builder, build_bb)
    let built = LLVMBuildCall2(ctx.builder, build_fn_ty, build_fn, [], fresh_name(ctx, "db"))
    discard(LLVMBuildStore(ctx.builder, built, g))
    discard(LLVMBuildBr(ctx.builder, done_bb))

    LLVMPositionBuilderAtEnd(ctx.builder, done_bb)
    let result = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, g, fresh_name(ctx, "dv"))
    discard(LLVMBuildRet(ctx.builder, result))

    ctx.current_fn = saved_fn
    LLVMPositionBuilderAtEnd(ctx.builder, saved_bb)
    fn_val
}

// B-104 D6 (#154): emit a Str const's getter body as a lazy memoised SINGLETON
// (D4 dict-getter shape).  Pre-D6 the zero-arg const fn re-evaluated its
// initialiser on EVERY access (ring_str_from_cstr fresh alloc; D5 measured the
// BUILTIN_* getters at ≈29.6M live @2.382B self-compile — call sites correctly
// treat a const access as a borrow of a module-level value, mirroring the JS
// backend's module-level `const`, so nobody ever dropped the fresh copies).
// Getter shape:
//   entry: %c = load @__ring_constg_<fn> ; br (%c == null), build, done
//   build: %v = ring_const_intern(<init expr>) ; store %v, @g ; br done
//   done:  ret load @g
// The intern fn (intern_fn_name) retags the once-built value with a never-drop
// typeid (defense in depth: stray dup/drop on the singleton are no-ops; data
// layout untouched).  B-104 D6: ring_const_intern → CONST_STATIC for Str consts.
// B-104 D9 Part 2: ring_unit_intern → CONST_HEAP_STATIC for zero-field enum
// consts (Type::UnitType & the other Type scalar consts).
pub fn emit_memoised_const_body(mut ctx: LlvmCtx, fn_val: LLVMValueRef, mangled: Str, init: HExpr, intern_fn_name: Str) {
    let g = LLVMAddGlobal(ctx.module, ctx.ptr_type, "__ring_constg_${mangled}")
    LLVMSetInitializer(g, LLVMConstPointerNull(ctx.ptr_type))

    let saved_fn = ctx.current_fn
    let saved_named = ctx.named_values
    ctx.current_fn = some(fn_val)
    ctx.named_values = map_new()

    let entry = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "entry")
    let build_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "build")
    let done_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "done")

    LLVMPositionBuilderAtEnd(ctx.builder, entry)
    let cached = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, g, fresh_name(ctx, "cc"))
    // 32 = LLVMIntEQ
    let isnull = LLVMBuildICmp(ctx.builder, 32, cached, LLVMConstPointerNull(ctx.ptr_type), fresh_name(ctx, "cn"))
    discard(LLVMBuildCondBr(ctx.builder, isnull, build_bb, done_bb))

    LLVMPositionBuilderAtEnd(ctx.builder, build_bb)
    let built = gen_llvm_expr(ctx, init)
    let intern_fn = get_or_declare_runtime_fn(ctx, intern_fn_name, [ctx.ptr_type], ctx.ptr_type)
    let intern_ty = get_rt_fn_type(ctx, intern_fn_name)
    let interned = LLVMBuildCall2(ctx.builder, intern_ty, intern_fn, [built], fresh_name(ctx, "ci"))
    discard(LLVMBuildStore(ctx.builder, interned, g))
    discard(LLVMBuildBr(ctx.builder, done_bb))

    LLVMPositionBuilderAtEnd(ctx.builder, done_bb)
    let result = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, g, fresh_name(ctx, "cv"))
    discard(LLVMBuildRet(ctx.builder, result))

    ctx.named_values = saved_named
    ctx.current_fn = saved_fn
}

// B-104 D4: synthesise (once) the memoised getter `ring_dict_init_<name>` for a
// static dict with no impl-generated init function:
//   * a dict_lower wrapped INSTANCE (static_dict_defs entry with inner != []):
//     built via build_wrapped_dict with the DICT_STATIC typeid;
//   * a builtin primitive dict (__Int_Eq / __Str_Ord / enum tag-Eq fallback):
//     built via the runtime's ring_get_builtin_dict (its name STR is now
//     allocated ONCE, inside the getter — the per-use fresh STR is gone).
// Getter shape (lazy first-use; no init-order concerns, inners resolve
// recursively through their own getters):
//   entry: %c = load @g ; br (%c == null), build, done
//   build: %v = <construct> ; store %v, @g ; br done
//   done:  ret load @g
// PLAIN footprint entries (inner == []) deliberately fall to the builtin path —
// routing one into build_wrapped_dict would yield a 0-slot dict (dispatch crash).
fn get_or_create_static_dict_getter(mut ctx: LlvmCtx, name: Str) -> LLVMValueRef {
    let fname = "ring_dict_init_${name}"
    match ctx.functions.get(fname) {
        some(existing) => { return existing },
        none => {},
    }
    let fn_ty = LLVMFunctionType(ctx.ptr_type, [], 0)
    let fn_val = LLVMAddFunction(ctx.module, fname, fn_ty)
    ctx.functions.insert(fname, fn_val)
    ctx.fn_types.insert(fname, fn_ty)
    let g = get_or_create_dict_global(ctx, name)

    // Emit the getter body (save/restore the surrounding emission state — the
    // getter is created on demand from inside another function's body).
    let saved_fn = ctx.current_fn
    let saved_named = ctx.named_values
    let saved_bb = LLVMGetInsertBlock(ctx.builder)
    ctx.current_fn = some(fn_val)
    ctx.named_values = map_new()

    let entry = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "entry")
    let build_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "build")
    let done_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "done")

    LLVMPositionBuilderAtEnd(ctx.builder, entry)
    let cached = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, g, fresh_name(ctx, "dc"))
    // 32 = LLVMIntEQ
    let isnull = LLVMBuildICmp(ctx.builder, 32, cached, LLVMConstPointerNull(ctx.ptr_type), fresh_name(ctx, "dn"))
    discard(LLVMBuildCondBr(ctx.builder, isnull, build_bb, done_bb))

    LLVMPositionBuilderAtEnd(ctx.builder, build_bb)
    let inst_def = match ctx.static_dict_defs.get(name) {
        some(def) => if def.inner.len() > 0 { some(def) } else { none },
        none => none,
    }
    let value = match inst_def {
        some(def) => {
            let mut inner_refs: List<DictRef> = []
            for inn in def.inner { inner_refs.push(DictRef::Static(inn)) }
            build_wrapped_dict_typed(ctx, def.base_dict, def.trait_name, inner_refs, RING_TYPEID_DICT_STATIC)
        },
        none => {
            let name_str = gen_str_lit(ctx, name)
            let bd_fn = get_or_declare_runtime_fn(ctx, "ring_get_builtin_dict", [ctx.ptr_type], ctx.ptr_type)
            let bd_ty = get_rt_fn_type(ctx, "ring_get_builtin_dict")
            LLVMBuildCall2(ctx.builder, bd_ty, bd_fn, [name_str], fresh_name(ctx, "bd"))
        },
    }
    discard(LLVMBuildStore(ctx.builder, value, g))
    discard(LLVMBuildBr(ctx.builder, done_bb))

    LLVMPositionBuilderAtEnd(ctx.builder, done_bb)
    let result = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, g, fresh_name(ctx, "dv"))
    discard(LLVMBuildRet(ctx.builder, result))

    ctx.named_values = saved_named
    ctx.current_fn = saved_fn
    LLVMPositionBuilderAtEnd(ctx.builder, saved_bb)
    fn_val
}

// #B-087 gap 2: construct a wrapper trait dict for a parameterized type (e.g.
// Pair<Int, Str>) whose Eq impl method `ring_Pair_eq(self, other, A_Eq, B_Eq)` takes
// the inner type-param dicts as trailing params. A consumer that dispatches through
// this dict only passes (self, other), so we cannot store the base method directly.
// Instead, for each trait method we emit a thunk
//   ring_<Type>_<m>__wrapthunk(env, a0..aK) -> ptr
// that loads the inner dicts captured in env and calls the real method
//   ring_<Type>_<m>(a0..aK, inner0..innerM).
// The wrapper dict has the count-prefixed dict layout { i64 count, ptr-per-method },
// each method slot a { thunk, env } closure. Mirrors codegen_expr.ring's
// dict_ref_to_js wrapper.
//
// B-104 D4 RC honesty: the per-method thunk envs hold the inner dicts with
// count=inner_count and a ring_dup per slot — so a DYNAMIC wrapped dict
// (typeid DICT_DYN, dict_lower's DictConstruct) is FULLY reclaimed by its
// scope-end drop (drop_dict → drop_closure → drop_closure_env → releases the
// dup'd inner refs), and a dict-param-backed inner stays alive as long as any
// wrapped dict referencing it does.  For STATIC instances (typeid DICT_STATIC,
// built once inside a memoised getter) the dup/drop legs are no-ops
// (never-drop typeid) — same construction code, zero cost.
fn build_wrapped_dict(mut ctx: LlvmCtx, dict_name: Str, trait_name: Str, inner_dicts: List<DictRef>) -> LLVMValueRef {
    build_wrapped_dict_typed(ctx, dict_name, trait_name, inner_dicts, RING_TYPEID_DICT_DYN)
}

fn build_wrapped_dict_typed(mut ctx: LlvmCtx, dict_name: Str, trait_name: Str, inner_dicts: List<DictRef>, dict_tid: Int) -> LLVMValueRef {
    // Resolve the inner dicts at this site.
    let mut inner_vals: List<LLVMValueRef> = []
    for d in inner_dicts {
        inner_vals.push(resolve_dict_ref(ctx, d))
    }

    // Recover the target type name from the dict name "__<Type>_<Trait>".
    let target_type = wrapped_dict_target_type(dict_name, trait_name)

    // Trait method order determines the slots (must match emit_trait_dict).
    let method_order = match ctx.trait_method_order.get(trait_name) {
        some(order) => order,
        none => [],
    }
    let method_count = method_order.len()

    // Dict struct: { i64 method_count, one ptr (RingClosure) per method }.
    let mut dict_elem_types: List<LLVMTypeRef> = [ctx.i64_type]
    for i in 0..method_count { dict_elem_types.push(ctx.ptr_type) }
    let dict_struct_ty = LLVMStructTypeInContext(ctx.context, dict_elem_types, 0)

    let alloc_fn = get_or_declare_runtime_fn(ctx, "ring_alloc", [ctx.i64_type, ctx.i64_type], ctx.ptr_type)
    let alloc_ty = get_rt_fn_type(ctx, "ring_alloc")
    let dict_size = LLVMSizeOf(dict_struct_ty)
    let dict_typeid = LLVMConstInt(ctx.i64_type, dict_tid, 0)
    let dict_ptr = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [dict_size, dict_typeid], fresh_name(ctx, "wdict"))
    let dict_cnt_slot = LLVMBuildStructGEP2(ctx.builder, dict_struct_ty, dict_ptr, 0, fresh_name(ctx, "wdc"))
    discard(LLVMBuildStore(ctx.builder, LLVMConstInt(ctx.i64_type, method_count, 0), dict_cnt_slot))

    let closure_ty = LLVMStructTypeInContext(ctx.context, [ctx.ptr_type, ctx.ptr_type], 0)
    let closure_size = LLVMSizeOf(closure_ty)
    let closure_typeid = LLVMConstInt(ctx.i64_type, 7, 0)

    let inner_count = inner_vals.len()

    for i in 0..method_count {
        match method_order.get(i) {
            some(method_name) => {
                let mangled = llvm_mangle_method(target_type, method_name)
                match ctx.functions.get(mangled) {
                    some(method_fn) => {
                        // Base method arity includes the trailing inner dicts; the
                        // dispatch passes (arity - inner_count) leading args.
                        let base_arity = LLVMCountParams(method_fn)
                        let dispatch_arity = base_arity - inner_count
                        let thunk_fn = emit_wrapped_method_thunk(ctx, mangled, method_fn, method_name, dispatch_arity, inner_count)

                        // env: { i64 count(=inner_count), inner0, inner1, ... }.
                        // B-104 D4 RC honesty: count covers the inner-dict slots
                        // and each stored inner is ring_dup'd — drop_closure_env
                        // releases them when the (dynamic) dict dies.  Static
                        // singleton inners: dup/drop are never-drop no-ops.
                        let mut env_elem_types: List<LLVMTypeRef> = [ctx.i64_type]
                        for j in 0..inner_count { env_elem_types.push(ctx.ptr_type) }
                        let env_ty = LLVMStructTypeInContext(ctx.context, env_elem_types, 0)
                        let env_size = LLVMSizeOf(env_ty)
                        let env_typeid = LLVMConstInt(ctx.i64_type, RING_TYPEID_CLOSURE_ENV, 0)
                        let env_alloc = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [env_size, env_typeid], fresh_name(ctx, "wmenv"))
                        let cnt_slot = LLVMBuildStructGEP2(ctx.builder, env_ty, env_alloc, 0, fresh_name(ctx, "wmc"))
                        discard(LLVMBuildStore(ctx.builder, LLVMConstInt(ctx.i64_type, inner_count, 0), cnt_slot))
                        let mut sj = 0
                        for iv in inner_vals {
                            discard(gen_dup_value(ctx, iv))
                            let s = LLVMBuildStructGEP2(ctx.builder, env_ty, env_alloc, sj + 1, fresh_name(ctx, "wmi"))
                            discard(LLVMBuildStore(ctx.builder, iv, s))
                            sj = sj + 1
                        }

                        // closure { thunk, env }
                        let closure_ptr = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [closure_size, closure_typeid], fresh_name(ctx, "wmcls"))
                        let fp = LLVMBuildStructGEP2(ctx.builder, closure_ty, closure_ptr, 0, fresh_name(ctx, "wmfp"))
                        discard(LLVMBuildStore(ctx.builder, thunk_fn, fp))
                        let ep = LLVMBuildStructGEP2(ctx.builder, closure_ty, closure_ptr, 1, fresh_name(ctx, "wmep"))
                        discard(LLVMBuildStore(ctx.builder, env_alloc, ep))

                        let slot = LLVMBuildStructGEP2(ctx.builder, dict_struct_ty, dict_ptr, i + 1, fresh_name(ctx, "wmds"))
                        discard(LLVMBuildStore(ctx.builder, closure_ptr, slot))
                    },
                    none => {
                        let slot = LLVMBuildStructGEP2(ctx.builder, dict_struct_ty, dict_ptr, i + 1, fresh_name(ctx, "wmds"))
                        discard(LLVMBuildStore(ctx.builder, LLVMConstPointerNull(ctx.ptr_type), slot))
                    },
                }
            },
            none => {},
        }
    }

    dict_ptr
}

// Recover "<Type>" from a dict name "__<Type>_<Trait>" by stripping the leading "__"
// and the trailing "_<trait_name>".
fn wrapped_dict_target_type(dict_name: Str, trait_name: Str) -> Str {
    let mut s = dict_name
    if s.starts_with("__") { s = s.slice(2, s.len()) }
    let suffix = "_${trait_name}"
    if s.ends_with(suffix) {
        s.slice(0, s.len() - suffix.len())
    } else {
        s
    }
}

// Emit the per-method wrapper thunk: fn(env, a0..a_{K-1}) -> ptr that loads the inner
// dicts captured in env (slots 1..inner_count) and calls the real method
// ring_<Type>_<m>(a0.., inner0..). Memoized by name (one impl method + inner-dict set
// → at most one thunk per distinct wrapped-dict construction site is fine; we include
// the inner_count to disambiguate, but the method mangling + suffix already differs
// from the plain dict thunk).
fn emit_wrapped_method_thunk(mut ctx: LlvmCtx, mangled: Str, method_fn: LLVMValueRef, method_name: Str, dispatch_arity: Int, inner_count: Int) -> LLVMValueRef {
    let thunk_name = "${mangled}__wrapthunk"
    match ctx.functions.get(thunk_name) {
        some(existing) => { return existing },
        none => {},
    }

    // Thunk: (env, a0..a_{K-1}) -> ptr.
    let mut thunk_param_types: List<LLVMTypeRef> = [ctx.ptr_type]
    for i in 0..dispatch_arity { thunk_param_types.push(ctx.ptr_type) }
    let thunk_ty = LLVMFunctionType(ctx.ptr_type, thunk_param_types, 0)
    let thunk_fn = LLVMAddFunction(ctx.module, thunk_name, thunk_ty)
    ctx.functions.insert(thunk_name, thunk_fn)
    ctx.fn_types.insert(thunk_name, thunk_ty)

    // env struct type (must match build_wrapped_dict's env layout).
    let mut env_elem_types: List<LLVMTypeRef> = [ctx.i64_type]
    for j in 0..inner_count { env_elem_types.push(ctx.ptr_type) }
    let env_ty = LLVMStructTypeInContext(ctx.context, env_elem_types, 0)

    // Real method fn type (a0.., inner0..) -> ptr.
    let method_ty = match ctx.fn_types.get(mangled) {
        some(t) => t,
        none => {
            let mut mp: List<LLVMTypeRef> = []
            for i in 0..(dispatch_arity + inner_count) { mp.push(ctx.ptr_type) }
            LLVMFunctionType(ctx.ptr_type, mp, 0)
        },
    }

    let saved_block = LLVMGetInsertBlock(ctx.builder)
    let entry = LLVMAppendBasicBlockInContext(ctx.context, thunk_fn, "entry")
    LLVMPositionBuilderAtEnd(ctx.builder, entry)

    let env_param = LLVMGetParam(thunk_fn, 0)
    let mut fwd_args: List<LLVMValueRef> = []
    // Leading dispatch args (skip param 0 = env).
    for i in 0..dispatch_arity { fwd_args.push(LLVMGetParam(thunk_fn, i + 1)) }
    // Inner dicts loaded from env (slots 1..inner_count).
    for j in 0..inner_count {
        let s = LLVMBuildStructGEP2(ctx.builder, env_ty, env_param, j + 1, fresh_name(ctx, "wti"))
        fwd_args.push(LLVMBuildLoad2(ctx.builder, ctx.ptr_type, s, fresh_name(ctx, "wtd")))
    }
    let res = LLVMBuildCall2(ctx.builder, method_ty, method_fn, fwd_args, fresh_name(ctx, "wtcall"))
    discard(LLVMBuildRet(ctx.builder, res))

    LLVMPositionBuilderAtEnd(ctx.builder, saved_block)
    thunk_fn
}

// ============================================================
// Dict dispatch call (trait method through dict parameter)
// ============================================================

fn gen_dict_dispatch_call(mut ctx: LlvmCtx, callee: HExpr, args: List<HExpr>, dd: DictDispatchInfo) -> LLVMValueRef {
    // Dict dispatch: call dd.dict_param.method(receiver, args...)
    // The dict is a struct of closure pointers, one per method.
    // We need to: 1) load the dict, 2) GEP to the method slot, 3) call through closure

    // Get receiver from callee (if FieldAccess) or first arg
    let mut recv_val: LLVMValueRef? = none
    let mut other_arg_start = 0
    match callee {
        HExpr::FieldAccess { receiver, .. } => {
            recv_val = some(gen_llvm_expr(ctx, receiver))
        },
        _ => {
            match args.get(0) {
                some(a) => {
                    recv_val = some(gen_llvm_expr(ctx, a))
                    other_arg_start = 1
                },
                none => {},
            }
        },
    }

    // Build call args: receiver first, then remaining args
    let mut call_args: List<LLVMValueRef> = []
    match recv_val {
        some(rv) => call_args.push(rv),
        none => {},
    }
    for i in other_arg_start..args.len() {
        match args.get(i) {
            some(a) => call_args.push(gen_llvm_expr(ctx, a)),
            none => {},
        }
    }

    // Look up the dict parameter in named_values; if missing (delegate-expanded
    // static dict name), fall back to resolve_static_dict_by_name (B-121 gap 2,
    // matching resolve_dict_ref's DictRef::Simple none branch).
    let dict_ptr = match ctx.named_values.get(dd.dict_param) {
        some(dict_alloca) => LLVMBuildLoad2(ctx.builder, ctx.ptr_type, dict_alloca, fresh_name(ctx, "dp")),
        none => resolve_static_dict_by_name(ctx, dd.dict_param),
    }
    let method_idx = get_trait_method_index(ctx, dd.dict_param, dd.method)

    // Build dict struct type (B-104 D4 count-prefixed layout: { i64
    // method_count, ptr m0, ... }).  We don't know the exact slot count,
    // but a conservative 4-slot type suffices for the GEP — method slot
    // i lives at struct index i+1.
    let dict_struct_ty = LLVMStructTypeInContext(ctx.context, [ctx.i64_type, ctx.ptr_type, ctx.ptr_type, ctx.ptr_type, ctx.ptr_type], 0)

    // GEP to the method slot
    let method_slot_ptr = LLVMBuildStructGEP2(ctx.builder, dict_struct_ty, dict_ptr, method_idx + 1, fresh_name(ctx, "ms"))
    let closure_ptr = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, method_slot_ptr, fresh_name(ctx, "cp"))

    // Call through closure (same as gen_closure_call)
    gen_closure_call(ctx, closure_ptr, call_args)
}

// Get the index of a method within a trait's dict struct.
// Dict params are named __ring_<typeparam>_<Trait> (see trait_bound_param_name).
// The authoritative slot ordering lives in ctx.trait_method_order (populated by
// scan_trait_decls, with builtins Eq/Clone/Ord/Debug pre-seeded) and MUST match the
// order emit_trait_dict uses when filling the dict — otherwise multi-method user
// traits dispatch to the wrong slot.
fn get_trait_method_index(mut ctx: LlvmCtx, dict_param: Str, method: Str) -> Int {
    match trait_name_from_dict_param(dict_param) {
        some(trait_name) => {
            match ctx.trait_method_order.get(trait_name) {
                some(order) => {
                    let mut idx = 0
                    for m in order {
                        if m == method { return idx }
                        idx = idx + 1
                    }
                    // Method not in recorded order — fall through to builtin guess.
                    get_builtin_method_index(method)
                },
                none => get_builtin_method_index(method),
            }
        },
        none => get_builtin_method_index(method),
    }
}

// Extract the trait name from a dict param name __ring_<typeparam>_<Trait>.
// typeparam is a single type-variable token (no underscore), so the trait name is
// everything after the first underscore past the "__ring_" prefix.
fn trait_name_from_dict_param(dict_param: Str) -> Str? {
    let prefix = "__ring_"
    if !dict_param.starts_with(prefix) { return none }
    let rest = dict_param.slice(prefix.len(), dict_param.len())
    // rest = "<typeparam>_<Trait>" — split off the first segment (typeparam).
    match rest.index_of("_") {
        some(us) => some(rest.slice(us + 1, rest.len())),
        none => none,
    }
}

// Fallback ordering for built-in traits (alphabetical, matching JS backend):
// Eq: eq=0, ne=1; Clone: clone=0; Ord: compare=0; Debug: debug=0.
fn get_builtin_method_index(method: Str) -> Int {
    if method == "eq" { 0 }
    else { if method == "ne" { 1 }
    else { if method == "clone" { 0 }
    else { if method == "compare" { 0 }
    else { if method == "debug" { 0 }
    else { 0 } } } } } // fallback to 0
}

fn gen_closure_call(mut ctx: LlvmCtx, closure_ptr: LLVMValueRef, arg_vals: List<LLVMValueRef>) -> LLVMValueRef {
    // Closure is a struct { fn_ptr: ptr, env_ptr: ptr }
    let closure_ty = LLVMStructTypeInContext(ctx.context, [ctx.ptr_type, ctx.ptr_type], 0)
    let fn_ptr_slot = LLVMBuildStructGEP2(ctx.builder, closure_ty, closure_ptr, 0, fresh_name(ctx, "fps"))
    let fn_ptr = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, fn_ptr_slot, fresh_name(ctx, "fp"))
    let env_ptr_slot = LLVMBuildStructGEP2(ctx.builder, closure_ty, closure_ptr, 1, fresh_name(ctx, "eps"))
    let env_ptr = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, env_ptr_slot, fresh_name(ctx, "ep"))

    // Build call args: env_ptr first, then regular args
    let mut call_args: List<LLVMValueRef> = [env_ptr]
    for a in arg_vals {
        call_args.push(a)
    }

    // Build fn type: (env_ptr, args...) -> ptr
    let mut fn_param_types: List<LLVMTypeRef> = [ctx.ptr_type]
    for a in arg_vals {
        fn_param_types.push(ctx.ptr_type)
    }
    let fn_ty = LLVMFunctionType(ctx.ptr_type, fn_param_types, 0)
    LLVMBuildCall2(ctx.builder, fn_ty, fn_ptr, call_args, fresh_name(ctx, "cc"))
}

// ============================================================
// B-099: gen_extern_fn_call — emit a marshalled call to an LLVM-C extern fn
// ============================================================
//
// arg_vals are the BOXED Ring values (uniform ptr).  This function unboxes /
// converts each one per the ExternFnInfo's param_marshalls, calls the C-ABI
// function, and boxes the result back for Ring.

fn gen_extern_fn_call(mut ctx: LlvmCtx, name: Str, arg_vals: List<LLVMValueRef>, info: ExternFnInfo) -> LLVMValueRef {
    // Handle special output-param functions
    if info.is_special == "LLVMGetTargetFromTriple" {
        return gen_extern_LLVMGetTargetFromTriple(ctx, arg_vals, info)
    }
    if info.is_special == "LLVMTargetMachineEmitToFile" {
        return gen_extern_LLVMTargetMachineEmitToFile(ctx, arg_vals, info)
    }
    if info.is_special == "LLVMVerifyModule" {
        return gen_extern_LLVMVerifyModule(ctx, arg_vals, info)
    }
    if info.is_special == "LLVMRunPasses" {
        return gen_extern_LLVMRunPasses(ctx, arg_vals, info)
    }
    if info.is_special == "LLVMAddIncoming" {
        return gen_extern_LLVMAddIncoming(ctx, arg_vals, info)
    }

    // Normal case: marshall each Ring arg to C-ABI
    let mut c_args: List<LLVMValueRef> = []
    let mut arg_idx = 0
    for marshall in info.param_marshalls {
        let arg_val = match arg_vals.get(arg_idx) {
            some(v) => v,
            none => panic("LLVM codegen B-099: arg index ${arg_idx} out of bounds for extern fn '${name}'"),
        }
        match marshall {
            ExternParamMarshall::PassthroughPtr => {
                c_args.push(arg_val)
            },
            ExternParamMarshall::StrToCstr => {
                let cstr_fn = get_or_declare_runtime_fn(ctx, "ring_str_to_cstr", [ctx.ptr_type], ctx.ptr_type)
                let cstr_ty = get_rt_fn_type(ctx, "ring_str_to_cstr")
                let cstr = LLVMBuildCall2(ctx.builder, cstr_ty, cstr_fn, [arg_val], fresh_name(ctx, "cstr"))
                c_args.push(cstr)
            },
            ExternParamMarshall::StrToCstrAndLen => {
                // Expand to (cstr, len)
                let cstr_fn = get_or_declare_runtime_fn(ctx, "ring_str_to_cstr", [ctx.ptr_type], ctx.ptr_type)
                let cstr_ty = get_rt_fn_type(ctx, "ring_str_to_cstr")
                let cstr = LLVMBuildCall2(ctx.builder, cstr_ty, cstr_fn, [arg_val], fresh_name(ctx, "cstr"))
                c_args.push(cstr)
                let len_fn = get_or_declare_runtime_fn(ctx, "ring_str_len_u32", [ctx.ptr_type], ctx.i32_type)
                let len_ty = get_rt_fn_type(ctx, "ring_str_len_u32")
                let len_val = LLVMBuildCall2(ctx.builder, len_ty, len_fn, [arg_val], fresh_name(ctx, "slen"))
                c_args.push(len_val)
            },
            ExternParamMarshall::IntToI32 => {
                let raw = unbox_int(ctx, arg_val)
                let truncated = LLVMBuildTrunc(ctx.builder, raw, ctx.i32_type, fresh_name(ctx, "i32"))
                c_args.push(truncated)
            },
            ExternParamMarshall::IntToI64 => {
                let raw = unbox_int(ctx, arg_val)
                c_args.push(raw)
            },
            ExternParamMarshall::FloatToDouble => {
                let unbox_fn = get_or_declare_runtime_fn(ctx, "ring_unbox_float", [ctx.ptr_type], ctx.double_type)
                let unbox_ty = get_rt_fn_type(ctx, "ring_unbox_float")
                let raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [arg_val], fresh_name(ctx, "f64"))
                c_args.push(raw)
            },
            ExternParamMarshall::ListToDataAndCount => {
                // Expand to (data_ptr, u32 count)
                let data_fn = get_or_declare_runtime_fn(ctx, "ring_list_data", [ctx.ptr_type], ctx.ptr_type)
                let data_ty = get_rt_fn_type(ctx, "ring_list_data")
                let data_ptr = LLVMBuildCall2(ctx.builder, data_ty, data_fn, [arg_val], fresh_name(ctx, "ldata"))
                c_args.push(data_ptr)
                let size_fn = get_or_declare_runtime_fn(ctx, "ring_list_size_u32", [ctx.ptr_type], ctx.i32_type)
                let size_ty = get_rt_fn_type(ctx, "ring_list_size_u32")
                let size_val = LLVMBuildCall2(ctx.builder, size_ty, size_fn, [arg_val], fresh_name(ctx, "lsize"))
                c_args.push(size_val)
            },
            ExternParamMarshall::ListToDataAndCountI64 => {
                // Expand to (data_ptr, u64 count) — for LLVMConstArray2
                let data_fn = get_or_declare_runtime_fn(ctx, "ring_list_data", [ctx.ptr_type], ctx.ptr_type)
                let data_ty = get_rt_fn_type(ctx, "ring_list_data")
                let data_ptr = LLVMBuildCall2(ctx.builder, data_ty, data_fn, [arg_val], fresh_name(ctx, "ldata"))
                c_args.push(data_ptr)
                let len_fn = get_or_declare_runtime_fn(ctx, "ring_list_len", [ctx.ptr_type], ctx.i64_type)
                let len_ty = get_rt_fn_type(ctx, "ring_list_len")
                let len_val = LLVMBuildCall2(ctx.builder, len_ty, len_fn, [arg_val], fresh_name(ctx, "llen"))
                c_args.push(len_val)
            },
        }
        arg_idx = arg_idx + 1
    }

    // Emit the C-ABI call
    let call_name = match info.ret_marshall {
        ExternRetMarshall::RetVoid => "",
        _ => fresh_name(ctx, "ext"),
    }
    let c_result = LLVMBuildCall2(ctx.builder, info.c_fn_type, info.c_fn_val, c_args, call_name)

    // Marshall return value back to Ring
    match info.ret_marshall {
        ExternRetMarshall::RetPtr => c_result,
        ExternRetMarshall::RetVoid => LLVMConstPointerNull(ctx.ptr_type),
        ExternRetMarshall::RetIntToBoxed => {
            // C i32 → sext to i64 → box_int
            let ext = LLVMBuildZExt(ctx.builder, c_result, ctx.i64_type, fresh_name(ctx, "iext"))
            box_int(ctx, ext)
        },
        ExternRetMarshall::RetStrFromCstr => {
            // C returns const char* → ring_str_from_cstr
            let from_cstr_fn = get_or_declare_runtime_fn(ctx, "ring_str_from_cstr", [ctx.ptr_type], ctx.ptr_type)
            let from_cstr_ty = get_rt_fn_type(ctx, "ring_str_from_cstr")
            LLVMBuildCall2(ctx.builder, from_cstr_ty, from_cstr_fn, [c_result], fresh_name(ctx, "rstr"))
        },
    }
}

// ============================================================
// B-099: Special output-param extern fn call handlers
// ============================================================

// LLVMGetTargetFromTriple: Ring (triple: Str) -> LLVMTargetRef
// C: LLVMBool LLVMGetTargetFromTriple(const char*, LLVMTargetRef*, char**)
fn gen_extern_LLVMGetTargetFromTriple(mut ctx: LlvmCtx, arg_vals: List<LLVMValueRef>, info: ExternFnInfo) -> LLVMValueRef {
    let triple_val = match arg_vals.get(0) {
        some(v) => v,
        none => panic("LLVM codegen B-099: LLVMGetTargetFromTriple missing triple arg"),
    }
    // Convert Ring Str to C string
    let cstr_fn = get_or_declare_runtime_fn(ctx, "ring_str_to_cstr", [ctx.ptr_type], ctx.ptr_type)
    let cstr_ty = get_rt_fn_type(ctx, "ring_str_to_cstr")
    let triple_cstr = LLVMBuildCall2(ctx.builder, cstr_ty, cstr_fn, [triple_val], fresh_name(ctx, "tcstr"))

    // Alloca for output params: LLVMTargetRef* and char**
    let target_alloca = LLVMBuildAlloca(ctx.builder, ctx.ptr_type, fresh_name(ctx, "target_out"))
    let err_alloca = LLVMBuildAlloca(ctx.builder, ctx.ptr_type, fresh_name(ctx, "err_out"))
    // Initialize to null
    discard(LLVMBuildStore(ctx.builder, LLVMConstPointerNull(ctx.ptr_type), target_alloca))
    discard(LLVMBuildStore(ctx.builder, LLVMConstPointerNull(ctx.ptr_type), err_alloca))

    // Call: LLVMBool result = LLVMGetTargetFromTriple(triple_cstr, &target, &err)
    let c_args: List<LLVMValueRef> = [triple_cstr, target_alloca, err_alloca]
    let result = LLVMBuildCall2(ctx.builder, info.c_fn_type, info.c_fn_val, c_args, fresh_name(ctx, "gtt"))

    // Check result — if non-zero, panic with error message
    // For simplicity, just load and return the target (mirrors addon behavior which panics on error)
    // The addon panics: if(result) { throw error }; return target
    // We match that: if error, the caller gets a null target and downstream LLVM calls will fail
    // TODO: could emit a conditional panic here

    // Load the target from the output alloca
    LLVMBuildLoad2(ctx.builder, ctx.ptr_type, target_alloca, fresh_name(ctx, "target"))
}

// LLVMTargetMachineEmitToFile: Ring (tm, m, filename: Str, file_type: Int) -> Int
// C: LLVMBool LLVMTargetMachineEmitToFile(TM, Module, char*, CodeGenFileType, char**)
fn gen_extern_LLVMTargetMachineEmitToFile(mut ctx: LlvmCtx, arg_vals: List<LLVMValueRef>, info: ExternFnInfo) -> LLVMValueRef {
    let tm_val = match arg_vals.get(0) { some(v) => v, none => panic("B-099: TMEF missing tm") }
    let m_val = match arg_vals.get(1) { some(v) => v, none => panic("B-099: TMEF missing module") }
    let filename_val = match arg_vals.get(2) { some(v) => v, none => panic("B-099: TMEF missing filename") }
    let filetype_val = match arg_vals.get(3) { some(v) => v, none => panic("B-099: TMEF missing filetype") }

    // Marshall args
    let cstr_fn = get_or_declare_runtime_fn(ctx, "ring_str_to_cstr", [ctx.ptr_type], ctx.ptr_type)
    let cstr_ty = get_rt_fn_type(ctx, "ring_str_to_cstr")
    let filename_cstr = LLVMBuildCall2(ctx.builder, cstr_ty, cstr_fn, [filename_val], fresh_name(ctx, "fcstr"))
    let filetype_raw = unbox_int(ctx, filetype_val)
    let filetype_i32 = LLVMBuildTrunc(ctx.builder, filetype_raw, ctx.i32_type, fresh_name(ctx, "ft32"))

    // Alloca for error output
    let err_alloca = LLVMBuildAlloca(ctx.builder, ctx.ptr_type, fresh_name(ctx, "emit_err"))
    discard(LLVMBuildStore(ctx.builder, LLVMConstPointerNull(ctx.ptr_type), err_alloca))

    // Call: LLVMBool result = LLVMTargetMachineEmitToFile(tm, m, filename, filetype, &err)
    let c_args: List<LLVMValueRef> = [tm_val, m_val, filename_cstr, filetype_i32, err_alloca]
    let result = LLVMBuildCall2(ctx.builder, info.c_fn_type, info.c_fn_val, c_args, fresh_name(ctx, "emit"))

    // Box result (C i32) back to Ring Int
    let ext = LLVMBuildZExt(ctx.builder, result, ctx.i64_type, fresh_name(ctx, "iext"))
    box_int(ctx, ext)
}

// LLVMVerifyModule: Ring (module, action: Int) -> Int
// C: LLVMBool LLVMVerifyModule(LLVMModuleRef, LLVMVerifierFailureAction, char**)
fn gen_extern_LLVMVerifyModule(mut ctx: LlvmCtx, arg_vals: List<LLVMValueRef>, info: ExternFnInfo) -> LLVMValueRef {
    let m_val = match arg_vals.get(0) { some(v) => v, none => panic("B-099: VM missing module") }
    let action_val = match arg_vals.get(1) { some(v) => v, none => panic("B-099: VM missing action") }

    // Marshall action: Ring Int → i32
    let action_raw = unbox_int(ctx, action_val)
    let action_i32 = LLVMBuildTrunc(ctx.builder, action_raw, ctx.i32_type, fresh_name(ctx, "act32"))

    // Alloca for error output
    let err_alloca = LLVMBuildAlloca(ctx.builder, ctx.ptr_type, fresh_name(ctx, "verify_err"))
    discard(LLVMBuildStore(ctx.builder, LLVMConstPointerNull(ctx.ptr_type), err_alloca))

    // Call: LLVMBool result = LLVMVerifyModule(m, action, &err)
    let c_args: List<LLVMValueRef> = [m_val, action_i32, err_alloca]
    let result = LLVMBuildCall2(ctx.builder, info.c_fn_type, info.c_fn_val, c_args, fresh_name(ctx, "verify"))

    // Box result back to Ring Int
    let ext = LLVMBuildZExt(ctx.builder, result, ctx.i64_type, fresh_name(ctx, "iext"))
    box_int(ctx, ext)
}

// LLVMRunPasses: Ring (m, passes: Str, tm, opts) -> Int
// C: LLVMErrorRef LLVMRunPasses(Module, const char*, TM, Options)
// LLVMErrorRef is a pointer: NULL = success, non-null = error.
// The addon returns 0 on success, 1 on error; we match that.
fn gen_extern_LLVMRunPasses(mut ctx: LlvmCtx, arg_vals: List<LLVMValueRef>, info: ExternFnInfo) -> LLVMValueRef {
    let m_val = match arg_vals.get(0) { some(v) => v, none => panic("B-099: RP missing module") }
    let passes_val = match arg_vals.get(1) { some(v) => v, none => panic("B-099: RP missing passes") }
    let tm_val = match arg_vals.get(2) { some(v) => v, none => panic("B-099: RP missing tm") }
    let opts_val = match arg_vals.get(3) { some(v) => v, none => panic("B-099: RP missing opts") }

    // Marshall passes: Ring Str → const char*
    let cstr_fn = get_or_declare_runtime_fn(ctx, "ring_str_to_cstr", [ctx.ptr_type], ctx.ptr_type)
    let cstr_ty = get_rt_fn_type(ctx, "ring_str_to_cstr")
    let passes_cstr = LLVMBuildCall2(ctx.builder, cstr_ty, cstr_fn, [passes_val], fresh_name(ctx, "pcstr"))

    // Call: LLVMErrorRef err = LLVMRunPasses(m, passes_cstr, tm, opts)
    let c_args: List<LLVMValueRef> = [m_val, passes_cstr, tm_val, opts_val]
    let err_ptr = LLVMBuildCall2(ctx.builder, info.c_fn_type, info.c_fn_val, c_args, fresh_name(ctx, "rp"))

    // Convert LLVMErrorRef to Ring Int: NULL → 0, non-null → 1
    // Compare err_ptr != null
    let null_ptr = LLVMConstPointerNull(ctx.ptr_type)
    // 33 = LLVMIntNE
    let is_err = LLVMBuildICmp(ctx.builder, 33, err_ptr, null_ptr, fresh_name(ctx, "iserr"))
    let result = LLVMBuildZExt(ctx.builder, is_err, ctx.i64_type, fresh_name(ctx, "rperr"))
    box_int(ctx, result)
}

// LLVMAddIncoming: Ring (phi, vals: List<LLVMValueRef>, blocks: List<LLVMBasicBlockRef>) -> Unit
// C: void LLVMAddIncoming(LLVMValueRef Phi, LLVMValueRef* Vals, LLVMBasicBlockRef* Blocks, unsigned Count)
// Two Lists share ONE count — must extract data ptrs from both but count from only one.
fn gen_extern_LLVMAddIncoming(mut ctx: LlvmCtx, arg_vals: List<LLVMValueRef>, info: ExternFnInfo) -> LLVMValueRef {
    let phi_val = match arg_vals.get(0) { some(v) => v, none => panic("B-099: AddIncoming missing phi") }
    let vals_list = match arg_vals.get(1) { some(v) => v, none => panic("B-099: AddIncoming missing vals") }
    let blocks_list = match arg_vals.get(2) { some(v) => v, none => panic("B-099: AddIncoming missing blocks") }

    let data_fn = get_or_declare_runtime_fn(ctx, "ring_list_data", [ctx.ptr_type], ctx.ptr_type)
    let data_ty = get_rt_fn_type(ctx, "ring_list_data")
    let size_fn = get_or_declare_runtime_fn(ctx, "ring_list_size_u32", [ctx.ptr_type], ctx.i32_type)
    let size_ty = get_rt_fn_type(ctx, "ring_list_size_u32")

    let vals_data = LLVMBuildCall2(ctx.builder, data_ty, data_fn, [vals_list], fresh_name(ctx, "vdata"))
    let blocks_data = LLVMBuildCall2(ctx.builder, data_ty, data_fn, [blocks_list], fresh_name(ctx, "bdata"))
    let count = LLVMBuildCall2(ctx.builder, size_ty, size_fn, [vals_list], fresh_name(ctx, "cnt"))

    let c_args: List<LLVMValueRef> = [phi_val, vals_data, blocks_data, count]
    LLVMBuildCall2(ctx.builder, info.c_fn_type, info.c_fn_val, c_args, "")
    LLVMConstPointerNull(ctx.ptr_type)
}

fn gen_direct_call(mut ctx: LlvmCtx, name: Str, mut arg_vals: List<LLVMValueRef>, dict_vals: List<LLVMValueRef>) -> LLVMValueRef {
    // Check for known extern fn → runtime mapping
    let rt_name = extern_fn_to_runtime(name)
    match rt_name {
        some(rtn) => {
            return gen_runtime_call(ctx, rtn, arg_vals)
        },
        none => {},
    }

    // B-099: Check for LLVM-C extern fn with C-ABI marshalling
    match ctx.extern_fn_infos.get(name) {
        some(info) => {
            return gen_extern_fn_call(ctx, name, arg_vals, info)
        },
        none => {},
    }

    // Look up in functions map — try module-aware resolution first
    let mangled = llvm_resolve_fn(ctx, name)
    let found_fn = find_function_in_ctx(ctx, mangled, name)
    match found_fn {
        some(fn_info) => {
            // Add trait dict params
            for dv in dict_vals {
                arg_vals.push(dv)
            }

            // Add evidence params — look up from named_values, fall back to null
            match ctx.fn_evidence_params.get(fn_info.fn_mangled) {
                some(ev_params) => {
                    for ep in ev_params {
                        arg_vals.push(lookup_evidence(ctx, ep))
                    }
                },
                none => {},
            }
            let fn_ty = match ctx.fn_types.get(fn_info.fn_mangled) {
                some(t) => t,
                none => panic("LLVM codegen: fn type not found for ${fn_info.fn_mangled}"),
            }
            LLVMBuildCall2(ctx.builder, fn_ty, fn_info.fn_val, arg_vals, fresh_name(ctx, "call"))
        },
        none => {
            // Not a known function — might be a closure variable (lambda parameter)
            match ctx.named_values.get(name) {
                some(alloca) => {
                    let closure_ptr = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, alloca, fresh_name(ctx, "clos"))
                    gen_closure_call(ctx, closure_ptr, arg_vals)
                },
                none => {
                    // Try runtime function with ring_ prefix as final fallback
                    let rt_fallback = "ring_${name}"
                    match ctx.rt_fns.get(rt_fallback) {
                        some(_) => {
                            return gen_runtime_call(ctx, rt_fallback, arg_vals)
                        },
                        none => {},
                    }
                    eprintln("LLVM codegen warning: unknown function '${name}', generating panic")
                    let panic_fn = get_or_declare_runtime_fn(ctx, "ring_panic", [ctx.ptr_type], ctx.ptr_type)
                    let panic_ty = get_rt_fn_type(ctx, "ring_panic")
                    let msg = LLVMBuildGlobalStringPtr(ctx.builder, "LLVM: missing function '${name}'", fresh_name(ctx, "panicmsg"))
                    let str_fn = get_or_declare_runtime_fn(ctx, "ring_str_from_cstr", [ctx.ptr_type], ctx.ptr_type)
                    let str_ty = get_rt_fn_type(ctx, "ring_str_from_cstr")
                    let str_val = LLVMBuildCall2(ctx.builder, str_ty, str_fn, [msg], fresh_name(ctx, "ps"))
                    discard(LLVMBuildCall2(ctx.builder, panic_ty, panic_fn, [str_val], ""))
                    LLVMConstPointerNull(ctx.ptr_type)
                },
            }
        },
    }
}

struct FnLookupResult {
    fn_val: LLVMValueRef,
    fn_mangled: Str
}

// Precise function lookup: resolve by name using module infrastructure,
// falling back to suffix match only as last resort.
fn find_fn_precise(ctx: LlvmCtx, name: Str) -> FnLookupResult? {
    // 1. Precise match via llvm_resolve_fn (checks imports_map, module_prefix, bare)
    let resolved = llvm_resolve_fn(ctx, name)
    let step1 = ctx.functions.get(resolved)
    match step1 {
        some(fn_val) => { return some(FnLookupResult { fn_val: fn_val, fn_mangled: resolved }) },
        none => {},
    }
    // 2. Bare mangling (for builtins / unqualified names)
    let plain = llvm_mangle_fn(name)
    let step2 = ctx.functions.get(plain)
    match step2 {
        some(fn_val) => { return some(FnLookupResult { fn_val: fn_val, fn_mangled: plain }) },
        none => {},
    }
    // 3. Try all known module prefixes via imports_map values' prefixes
    //    e.g. if imports_map has "foo" → "ring_mod$$_foo", try "ring_mod$$_<name>"
    let step3 = find_fn_by_prefix_enumeration(ctx, name)
    match step3 {
        some(result) => { return some(result) },
        none => {},
    }
    // 4. Suffix fallback (last resort) — find first function ending with $$_<name>
    find_fn_by_suffix(ctx, name)
}

// Try all known module prefixes from imports_map to find a function
fn find_fn_by_prefix_enumeration(ctx: LlvmCtx, name: Str) -> FnLookupResult? {
    let mut seen_prefixes: Set<Str> = set_new()
    let mut sorted_imports = ctx.imports_map.entries()
    sorted_imports.sort_by(fn(a, b) { if a.0 < b.0 { -1 } else if a.0 > b.0 { 1 } else { 0 } })
    for entry in sorted_imports {
        let (_, qualified) = entry
        // Extract prefix: everything before "$$_"
        let maybe_idx = qualified.index_of("$$_")
        match maybe_idx {
            some(sep_idx) => {
                let prefix_part = qualified.slice(0, sep_idx)
                if !seen_prefixes.contains(prefix_part) {
                    seen_prefixes.insert(prefix_part)
                    let candidate = "${prefix_part}$$_${name}"
                    let found = ctx.functions.get(candidate)
                    match found {
                        some(fn_val) => { return some(FnLookupResult { fn_val: fn_val, fn_mangled: candidate }) },
                        none => {},
                    }
                }
            },
            none => {},
        }
    }
    none
}

// Last-resort suffix match for cross-module resolution
fn find_fn_by_suffix(ctx: LlvmCtx, name: Str) -> FnLookupResult? {
    let suffix = "$$_${name}"
    let mut sorted_fns = ctx.functions.entries()
    sorted_fns.sort_by(fn(a, b) { if a.0 < b.0 { -1 } else if a.0 > b.0 { 1 } else { 0 } })
    for entry in sorted_fns {
        let (fn_name, fn_val) = entry
        if fn_name.ends_with(suffix) {
            return some(FnLookupResult { fn_val: fn_val, fn_mangled: fn_name })
        }
    }
    none
}

// Helper to find a function in ctx using multiple resolution strategies
fn find_function_in_ctx(ctx: LlvmCtx, mangled: Str, name: Str) -> FnLookupResult? {
    match ctx.functions.get(mangled) {
        some(fn_val) => some(FnLookupResult { fn_val: fn_val, fn_mangled: mangled }),
        none => {
            // Try bare mangling
            let bare = llvm_mangle_fn(name)
            match ctx.functions.get(bare) {
                some(fn_val) => some(FnLookupResult { fn_val: fn_val, fn_mangled: bare }),
                none => {
                    // Precise cross-module lookup (imports_map → prefix enumeration → suffix fallback)
                    find_fn_precise(ctx, name)
                },
            }
        },
    }
}

// ============================================================
// Evidence lookup — find evidence param in current scope or use default (null)
// ============================================================

fn lookup_evidence(mut ctx: LlvmCtx, ev_param_name: Str) -> LLVMValueRef {
    // Look up the evidence parameter in current scope's named_values
    match ctx.named_values.get(ev_param_name) {
        some(alloca) => LLVMBuildLoad2(ctx.builder, ctx.ptr_type, alloca, fresh_name(ctx, "ev")),
        none => {
            // B-097: not in scope — try default evidence before falling back to null.
            // Extract effect name from "__ring_ev_<name>" (prefix is 10 chars).
            let effect_name = ev_param_name.slice(10, ev_param_name.len())
            match ctx.default_evidence.get(effect_name) {
                some(def_ev) => def_ev,
                none => {
                    // No default evidence — use null ptr (io/fail/non-default effects)
                    LLVMConstPointerNull(ctx.ptr_type)
                },
            }
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
    // ring_catch_pop and ring_raise are the only truly void-returning C functions
    if name == "ring_catch_pop" { true }
    else { if name == "ring_raise" { true }
    else { false } }
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
    else { if name == "read_file" { some("ring_read_file") }
    else { if name == "write_file" { some("ring_write_file") }
    else { if name == "file_exists" { some("ring_file_exists") }
    else { if name == "delete_file" { some("ring_delete_file") }
    else { if name == "path_join" { some("ring_path_join") }
    else { if name == "path_resolve" { some("ring_path_resolve") }
    else { if name == "path_dirname" { some("ring_path_dirname") }
    else { if name == "path_basename" { some("ring_path_basename") }
    else { if name == "path_extname" { some("ring_path_extname") }
    else { if name == "cwd" { some("ring_cwd") }
    else { if name == "parse_int" { some("ring_parse_int") }
    else { if name == "parse_float" { some("ring_parse_float") }
    else { if name == "set_from" { some("ring_set_from_list") }
    else { if name == "list_new" { some("ring_list_new") }
    else { if name == "map_from" { some("ring_map_from") }
    else { if name == "__ring_raise_fail" { some("__ring_raise_fail") }
    else { if name == "map_int_new" { some("ring_map_int_new") }
    else { if name == "set_int_new" { some("ring_set_int_new") }
    else { if name == "map_int_from" { some("ring_map_int_from") }
    else { if name == "set_int_from" { some("ring_set_int_from_list") }
    else { if name == "Cell" { some("ring_Cell_new") }
    else { none } } } } } } } } } } } } } } } } } } } } } } } } } } } } }
}

// ============================================================
// Method calls — dispatch to runtime
// ============================================================

// Check if a runtime method returns i64 (needs boxing to Int)
fn rt_method_returns_i64(name: Str) -> Bool {
    if name == "ring_str_len" { true }
    else { if name == "ring_str_contains" { true }
    else { if name == "ring_str_starts_with" { true }
    else { if name == "ring_str_ends_with" { true }
    else { if name == "ring_str_eq" { true }
    else { if name == "ring_str_lt" { true }
    else { if name == "ring_list_len" { true }
    else { if name == "ring_list_is_empty" { true }
    else { if name == "ring_map_has" { true }
    else { if name == "ring_map_len" { true }
    else { if name == "ring_set_has" { true }
    else { if name == "ring_set_len" { true }
    else { if name == "ring_sb_len" { true }
    else { if name == "ring_map_int_has" { true }
    else { if name == "ring_map_int_len" { true }
    else { if name == "ring_set_int_has" { true }
    else { if name == "ring_set_int_len" { true }
    else { if name == "ring_map_is_empty" { true }
    else { if name == "ring_set_is_empty" { true }
    else { if name == "ring_map_int_is_empty" { true }
    else { if name == "ring_set_int_is_empty" { true }
    else { false } } } } } } } } } } } } } } } } } } } } }
}

// Check if a runtime method returns bool (i64 that needs boxing to Bool)
fn rt_method_returns_bool(name: Str) -> Bool {
    if name == "ring_str_contains" { true }
    else { if name == "ring_str_starts_with" { true }
    else { if name == "ring_str_ends_with" { true }
    else { if name == "ring_list_is_empty" { true }
    else { if name == "ring_map_has" { true }
    else { if name == "ring_set_has" { true }
    else { if name == "ring_list_any" { true }
    else { if name == "ring_list_all" { true }
    else { if name == "ring_Option_is_some" { true }
    else { if name == "ring_Option_is_none" { true }
    else { if name == "ring_map_int_has" { true }
    else { if name == "ring_set_int_has" { true }
    else { if name == "ring_map_is_empty" { true }
    else { if name == "ring_set_is_empty" { true }
    else { if name == "ring_map_int_is_empty" { true }
    else { if name == "ring_set_int_is_empty" { true }
    else { if name == "ring_str_is_empty" { true }
    else { false } } } } } } } } } } } } } } } } }
}

// Number of LEADING (post-receiver) args that must be unboxed from ptr to i64.
// For these runtime methods the int args always come first; any remaining args stay
// boxed (ptr). E.g. pad_start(length: Int, fill: Str) -> (ptr, i64, ptr): only the
// first arg is unboxed, the fill string is passed as a ptr.
fn rt_method_int_arg_count(name: Str) -> Int {
    if name == "ring_list_get" { 1 }
    else { if name == "ring_list_get_opt" { 1 }
    else { if name == "ring_str_get" { 1 }
    else { if name == "ring_str_slice" { 2 }
    else { if name == "ring_list_slice" { 2 }
    else { if name == "ring_list_set" { 1 }
    else { if name == "ring_str_char_at" { 1 }
    else { if name == "ring_str_char_code_at" { 1 }
    else { if name == "ring_str_pad_start" { 1 }
    else { if name == "ring_str_pad_end" { 1 }
    else { if name == "ring_str_repeat" { 1 }
    else { if name == "ring_sb_add_int" { 1 }
    else { 0 } } } } } } } } } } } }
}

// Method needs receiver unboxed to i64 (Int.to_str)
fn rt_method_needs_recv_unbox_int(name: Str) -> Bool {
    if name == "ring_int_to_str" { true }
    else { false }
}

// Method needs receiver unboxed to double (Float.to_str)
fn rt_method_needs_recv_unbox_float(name: Str) -> Bool {
    if name == "ring_float_to_str" { true }
    else { false }
}

fn rt_method_needs_recv_unbox_bool(name: Str) -> Bool {
    if name == "ring_bool_to_str" { true }
    else { false }
}

fn gen_method_call(mut ctx: LlvmCtx, recv: LLVMValueRef, recv_type: Type, method: Str, args: List<LLVMValueRef>, dict_vals: List<LLVMValueRef>) -> LLVMValueRef {
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

    // Map to runtime function name
    // B-134: Only dispatch to runtime builtins if the collection type has the
    // correct structural signature (prevents user structs named List/Map/Set
    // from being misrouted to C runtime functions).
    let rt_method = if (type_name == "List" || type_name == "Map" || type_name == "Set") && !is_builtin_collection(recv_type) {
        none
    } else {
        method_to_runtime(type_name, method)
    }
    match rt_method {
        some(base_rt_name) => {
            // Dispatch to int-keyed variants if applicable
            let rt_name = if is_int_keyed_map(recv_type) {
                match method {
                    "get" => "ring_map_int_get_opt",
                    "insert" => "ring_map_int_set",
                    "contains_key" => "ring_map_int_has",
                    "keys" => "ring_map_int_keys",
                    "values" => "ring_map_int_values",
                    "entries" => "ring_map_int_entries",
                    "len" => "ring_map_int_len",
                    "remove" => "ring_map_int_delete",
                    "for_each" => "ring_map_int_for_each",
                    "clear" => "ring_map_int_clear",
                    "clone" => "ring_map_int_clone",
                    "is_empty" => "ring_map_int_is_empty",
                    _ => base_rt_name,
                }
            } else { if is_int_set(recv_type) {
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
                    _ => base_rt_name,
                }
            } else { base_rt_name } }
            // Build call args with proper unboxing
            let mut call_args: List<LLVMValueRef> = []

            // Handle receiver
            if rt_method_needs_recv_unbox_int(rt_name) {
                // B-080: inline untag
                let raw = unbox_int(ctx, recv)
                call_args.push(raw)
            } else {
                if rt_method_needs_recv_unbox_float(rt_name) {
                    let unbox_fn = get_or_declare_runtime_fn(ctx, "ring_unbox_float", [ctx.ptr_type], ctx.double_type)
                    let unbox_ty = get_rt_fn_type(ctx, "ring_unbox_float")
                    let raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [recv], fresh_name(ctx, "uf"))
                    call_args.push(raw)
                } else {
                    if rt_method_needs_recv_unbox_bool(rt_name) {
                        // B-080: inline untag
                        let raw = unbox_int(ctx, recv)
                        call_args.push(raw)
                    } else {
                        call_args.push(recv)
                    }
                }
            }

            // Handle remaining args - the leading N need unboxing from ptr to i64,
            // the rest stay boxed (ptr).
            let int_arg_count = rt_method_int_arg_count(rt_name)
            let mut ai_idx = 0
            for a in args {
                if ai_idx < int_arg_count {
                    // B-080: inline untag
                    let raw = unbox_int(ctx, a)
                    call_args.push(raw)
                } else {
                    call_args.push(a)
                }
                ai_idx = ai_idx + 1
            }

            // Get or ensure the runtime function
            let fn_val = ensure_runtime_method(ctx, rt_name, call_args.len())
            let fn_ty = get_rt_fn_type(ctx, rt_name)

            if is_void_runtime_fn(rt_name) {
                LLVMBuildCall2(ctx.builder, fn_ty, fn_val, call_args, "")
                LLVMConstPointerNull(ctx.ptr_type)
            } else {
                if rt_method_returns_bool(rt_name) {
                    let raw = LLVMBuildCall2(ctx.builder, fn_ty, fn_val, call_args, fresh_name(ctx, "rb"))
                    box_bool(ctx, raw)
                } else {
                    if rt_method_returns_i64(rt_name) {
                        let raw = LLVMBuildCall2(ctx.builder, fn_ty, fn_val, call_args, fresh_name(ctx, "ri"))
                        box_int(ctx, raw)
                    } else {
                        LLVMBuildCall2(ctx.builder, fn_ty, fn_val, call_args, fresh_name(ctx, "mc"))
                    }
                }
            }
        },
        none => {
            // User-defined impl method
            let mut call_args: List<LLVMValueRef> = [recv]
            for a in args {
                call_args.push(a)
            }
            let mangled = llvm_mangle_method(type_name, method)
            match ctx.functions.get(mangled) {
                some(fn_val) => {
                    // Add trait dict params
                    for dv in dict_vals {
                        call_args.push(dv)
                    }

                    // Add evidence params — look up from scope
                    match ctx.fn_evidence_params.get(mangled) {
                        some(ev_params) => {
                            for ep in ev_params {
                                call_args.push(lookup_evidence(ctx, ep))
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
                    eprintln("LLVM codegen warning: unknown method '${type_name}.${method}' (mangled: ${mangled}), generating panic")
                    let panic_fn = get_or_declare_runtime_fn(ctx, "ring_panic", [ctx.ptr_type], ctx.ptr_type)
                    let panic_ty = get_rt_fn_type(ctx, "ring_panic")
                    let msg = LLVMBuildGlobalStringPtr(ctx.builder, "LLVM: missing method '${type_name}.${method}'", fresh_name(ctx, "panicmsg"))
                    let str_fn = get_or_declare_runtime_fn(ctx, "ring_str_from_cstr", [ctx.ptr_type], ctx.ptr_type)
                    let str_ty = get_rt_fn_type(ctx, "ring_str_from_cstr")
                    let str_val = LLVMBuildCall2(ctx.builder, str_ty, str_fn, [msg], fresh_name(ctx, "ps"))
                    discard(LLVMBuildCall2(ctx.builder, panic_ty, panic_fn, [str_val], ""))
                    LLVMConstPointerNull(ctx.ptr_type)
                },
            }
        },
    }
}

fn method_to_runtime(type_name: Str, method: Str) -> Str? {
    // Str methods
    if type_name == "Str" && method == "len" { some("ring_str_len") }
    else { if type_name == "Str" && method == "contains" { some("ring_str_contains") }
    else { if type_name == "Str" && method == "starts_with" { some("ring_str_starts_with") }
    else { if type_name == "Str" && method == "ends_with" { some("ring_str_ends_with") }
    else { if type_name == "Str" && method == "slice" { some("ring_str_slice") }
    else { if type_name == "Str" && method == "split" { some("ring_str_split") }
    else { if type_name == "Str" && method == "replace" { some("ring_str_replace") }
    else { if type_name == "Str" && method == "get" { some("ring_str_get") }
    else { if type_name == "Str" && method == "trim" { some("ring_str_trim") }
    else { if type_name == "Str" && method == "trim_start" { some("ring_str_trim_start") }
    else { if type_name == "Str" && method == "trim_end" { some("ring_str_trim_end") }
    else { if type_name == "Str" && method == "to_upper" { some("ring_str_to_upper") }
    else { if type_name == "Str" && method == "to_lower" { some("ring_str_to_lower") }
    else { if type_name == "Str" && method == "char_at" { some("ring_str_char_at") }
    else { if type_name == "Str" && method == "char_code_at" { some("ring_str_char_code_at") }
    else { if type_name == "Str" && method == "index_of" { some("ring_str_index_of") }
    else { if type_name == "Str" && method == "pad_start" { some("ring_str_pad_start") }
    else { if type_name == "Str" && method == "pad_end" { some("ring_str_pad_end") }
    else { if type_name == "Str" && method == "repeat" { some("ring_str_repeat") }
    else { if type_name == "Str" && method == "is_empty" { some("ring_str_is_empty") }
    else { if type_name == "Str" && method == "last_index_of" { some("ring_str_last_index_of") }
    // Int methods
    else { if type_name == "Int" && method == "to_str" { some("ring_int_to_str") }
    // Float methods
    else { if type_name == "Float" && method == "to_str" { some("ring_float_to_str") }
    // Bool methods
    else { if type_name == "Bool" && method == "to_str" { some("ring_bool_to_str") }
    // StringBuilder methods
    else { if type_name == "StringBuilder" && method == "add" { some("ring_sb_add") }
    else { if type_name == "StringBuilder" && method == "to_str" { some("ring_sb_to_str") }
    else { if type_name == "StringBuilder" && method == "len" { some("ring_sb_len") }
    else { if type_name == "StringBuilder" && method == "line" { some("ring_sb_line") }
    else { if type_name == "StringBuilder" && method == "add_int" { some("ring_sb_add_int") }
    // List methods
    else { if type_name == "List" && method == "push" { some("ring_list_push") }
    else { if type_name == "List" && method == "len" { some("ring_list_len") }
    else { if type_name == "List" && method == "get" { some("ring_list_get_opt") }
    else { if type_name == "List" && method == "join" { some("ring_list_join") }
    else { if type_name == "List" && method == "concat" { some("ring_list_concat") }
    else { if type_name == "List" && method == "slice" { some("ring_list_slice") }
    else { if type_name == "List" && method == "reverse" { some("ring_list_reverse") }
    else { if type_name == "List" && method == "sort_by" { some("ring_list_sort") }
    else { if type_name == "List" && method == "is_empty" { some("ring_list_is_empty") }
    else { if type_name == "List" && method == "first" { some("ring_list_first") }
    else { if type_name == "List" && method == "last" { some("ring_list_last") }
    else { if type_name == "List" && method == "pop" { some("ring_list_pop") }
    else { if type_name == "List" && method == "set" { some("ring_list_set") }
    // NOTE: contains / index_of / sort are intentionally NOT mapped to runtime
    // functions. They live in bounded impl blocks (impl<T: Eq/Ord> List) and must
    // dispatch through trait dicts. Falling through routes to the generated Ring impls.
    else { if type_name == "List" && method == "map" { some("ring_list_map") }
    else { if type_name == "List" && method == "filter" { some("ring_list_filter") }
    else { if type_name == "List" && method == "for_each" { some("ring_list_for_each") }
    else { if type_name == "List" && method == "any" { some("ring_list_any") }
    else { if type_name == "List" && method == "all" { some("ring_list_all") }
    else { if type_name == "List" && method == "find" { some("ring_list_find") }
    else { if type_name == "List" && method == "find_index" { some("ring_list_find_index") }
    else { if type_name == "List" && method == "fold" { some("ring_list_fold") }
    else { if type_name == "List" && method == "flat_map" { some("ring_list_flat_map") }
    else { if type_name == "List" && method == "clear" { some("ring_list_clear") }
    else { if type_name == "List" && method == "shift" { some("ring_list_shift") }
    else { if type_name == "List" && method == "extend" { some("ring_list_extend") }
    // Map methods
    else { if type_name == "Map" && method == "get" { some("ring_map_get_opt") }
    else { if type_name == "Map" && method == "insert" { some("ring_map_set") }
    else { if type_name == "Map" && method == "contains_key" { some("ring_map_has") }
    else { if type_name == "Map" && method == "keys" { some("ring_map_keys") }
    else { if type_name == "Map" && method == "values" { some("ring_map_values") }
    else { if type_name == "Map" && method == "entries" { some("ring_map_entries") }
    else { if type_name == "Map" && method == "len" { some("ring_map_len") }
    else { if type_name == "Map" && method == "remove" { some("ring_map_delete") }
    else { if type_name == "Map" && method == "is_empty" { some("ring_map_is_empty") }
    else { if type_name == "Map" && method == "for_each" { some("ring_map_for_each") }
    else { if type_name == "Map" && method == "clear" { some("ring_map_clear") }
    // NOTE: Map.clone / List.clone / Set.clone are compiler-internal (HExpr::Clone
    // from Perceus RC), not user-callable methods — they are NOT in this table.
    // NOTE: Map.fold — no runtime symbol exists (#138); falls through to user-impl panic-stub
    // Set methods
    else { if type_name == "Set" && method == "add" { some("ring_set_add") }
    else { if type_name == "Set" && method == "insert" { some("ring_set_add") }
    else { if type_name == "Set" && method == "has" { some("ring_set_has") }
    else { if type_name == "Set" && method == "contains" { some("ring_set_has") }
    else { if type_name == "Set" && method == "to_list" { some("ring_set_to_list") }
    else { if type_name == "Set" && method == "len" { some("ring_set_len") }
    else { if type_name == "Set" && method == "is_empty" { some("ring_set_is_empty") }
    else { if type_name == "Set" && method == "from_list" { some("ring_set_from_list") }
    else { if type_name == "Set" && method == "for_each" { some("ring_set_for_each") }
    else { if type_name == "Set" && method == "remove" { some("ring_set_delete") }
    else { if type_name == "Set" && method == "clear" { some("ring_set_clear") }
    else { if type_name == "Set" && method == "union" { some("ring_set_union") }
    else { if type_name == "Set" && method == "intersect" { some("ring_set_intersect") }
    else { if type_name == "Set" && method == "difference" { some("ring_set_difference") }
    // NOTE: Set.fold — no runtime symbol exists (#138); falls through to user-impl panic-stub
    // Option methods
    else { if type_name == "Option" && method == "unwrap_or" { some("ring_Option_unwrap_or") }
    else { if type_name == "Option" && method == "unwrap" { some("ring_Option_unwrap") }
    else { if type_name == "Option" && method == "is_some" { some("ring_Option_is_some") }
    else { if type_name == "Option" && method == "is_none" { some("ring_Option_is_none") }
    else { if type_name == "Option" && method == "map" { some("ring_Option_map") }
    else { if type_name == "Option" && method == "unwrap_or_else" { some("ring_Option_unwrap_or_else") }
    else { if type_name == "Option" && method == "to_fail" { some("ring_Option_to_fail") }
    // Cell methods
    else { if type_name == "Cell" && method == "get" { some("ring_Cell_get") }
    else { if type_name == "Cell" && method == "set" { some("ring_Cell_set") }
    else { if type_name == "Cell" && method == "update" { some("ring_Cell_update") }
    else { none } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } }
}

fn ensure_runtime_method(mut ctx: LlvmCtx, name: Str, arg_count: Int) -> LLVMValueRef {
    match ctx.rt_fns.get(name) {
        some(f) => f,
        none => {
            let ptr = ctx.ptr_type
            // param index 0 is the receiver (ptr); args follow. The leading
            // `int_count` args are i64, the rest stay ptr.
            let int_count = rt_method_int_arg_count(name)
            let mut param_types: List<LLVMTypeRef> = []
            for i in 0..arg_count {
                if i > 0 && (i - 1) < int_count {
                    param_types.push(ctx.i64_type)
                } else {
                    param_types.push(ptr)
                }
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

// B-098: ring_dup(val); return val.  This is the lowering primitive for the
// value-level clone (HExpr::Clone, gen_clone): the borrow-inference pass wraps an
// escaping owner-bearing value (Ident / field / index / container read) in Clone,
// and codegen bumps its refcount so the sink owns an independent reference.  Under
// the clone-all-escape model READS no longer dup — only escapes do (here) — so
// there is no always-own field/read dup left to balance (that L0 patch is
// reverted in B-098).
fn gen_dup_value(mut ctx: LlvmCtx, val: LLVMValueRef) -> LLVMValueRef {
    let dup_fn = get_or_declare_runtime_fn(ctx, "ring_dup", [ctx.ptr_type], ctx.void_type)
    let dup_ty = get_rt_fn_type(ctx, "ring_dup")
    discard(LLVMBuildCall2(ctx.builder, dup_ty, dup_fn, [val], ""))
    val
}

fn gen_field_access(mut ctx: LlvmCtx, receiver: HExpr, field: Str, ty: Type) -> LLVMValueRef {
    let recv_val = gen_llvm_expr(ctx, receiver)
    let recv_type = hexpr_type(receiver)

    // Handle tuple field access (field is a numeric index like "0", "1")
    // Tuples are represented as Lists (runtime arrays), so use ring_list_get
    match recv_type {
        Type::TupleType { .. } => {
            let field_idx = match parse_int(field) {
                some(n) => n,
                none => panic("LLVM codegen: non-numeric tuple field: ${field}"),
            }
            let get_fn = get_or_declare_runtime_fn(ctx, "ring_list_get", [ctx.ptr_type, ctx.i64_type], ctx.ptr_type)
            let get_ty = get_rt_fn_type(ctx, "ring_list_get")
            let idx_val = LLVMConstInt(ctx.i64_type, field_idx, 0)
            // B-098: tuple field read is a BORROW (ring_list_get no longer dups);
            // the borrow-inference pass clones it if it escapes.
            return LLVMBuildCall2(ctx.builder, get_ty, get_fn, [recv_val, idx_val], fresh_name(ctx, "t"))
        },
        _ => {},
    }

    let type_name = match recv_type {
        Type::StructType { name, .. } => name,
        Type::EnumType { name, .. } => name,
        _ => panic("LLVM codegen: field access on non-struct type: ${type_to_string(recv_type)}, field: ${field}"),
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
            // GEP into struct to get field pointer, then load.
            // B-098: a struct field read is a BORROW (no dup); the field value
            // still belongs to the struct.  If it escapes, the borrow-inference
            // pass wraps it in HExpr::Clone (gen_clone) to bump the refcount.
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

fn gen_struct_lit(mut ctx: LlvmCtx, name: Str, fields: List<HStructFieldInit>, spread: HExpr?) -> LLVMValueRef {
    match ctx.struct_types.get(name) {
        some(info) => {
            let size = LLVMSizeOf(info.llvm_type)
            let alloc_fn = get_or_declare_runtime_fn(ctx, "ring_alloc", [ctx.i64_type, ctx.i64_type], ctx.ptr_type)
            let alloc_ty = get_rt_fn_type(ctx, "ring_alloc")
            let typeid_val = LLVMConstInt(ctx.i64_type, get_or_assign_typeid(ctx, name), 0)
            let struct_ptr = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [size, typeid_val], fresh_name(ctx, "s"))

            // If spread expression exists, copy all fields from it first.
            // B-098: the spread COPIES the source struct's field pointers into the
            // NEW struct (which will be dropped via drop_<T>, freeing every field).
            // Those copied fields alias the source's owned references, so the new
            // struct must take its OWN reference (ring_dup) to avoid a double-free
            // when both structs are dropped — UNLESS the field is immediately
            // overridden by an explicit field init below (then the spread copy is
            // dead; skip the dup to avoid leaking it).
            match spread {
                some(spread_expr) => {
                    let mut overridden: Set<Str> = set_new()
                    for f in fields { overridden.insert(f.name) }
                    let spread_val = gen_llvm_expr(ctx, spread_expr)
                    for i in 0..info.field_names.len() {
                        let src_ptr = LLVMBuildStructGEP2(ctx.builder, info.llvm_type, spread_val, i, fresh_name(ctx, "sfp"))
                        let src_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, src_ptr, fresh_name(ctx, "sfv"))
                        if overridden.contains(info.field_names[i]) == false {
                            discard(gen_dup_value(ctx, src_val))
                        }
                        let dst_ptr = LLVMBuildStructGEP2(ctx.builder, info.llvm_type, struct_ptr, i, fresh_name(ctx, "dfp"))
                        discard(LLVMBuildStore(ctx.builder, src_val, dst_ptr))
                    }
                },
                none => {},
            }

            // Store explicitly specified fields (overriding spread values)
            for f in fields {
                let val = gen_llvm_expr(ctx, f.value)
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

    let sb_add_fn = get_or_declare_runtime_fn(ctx, "ring_sb_add", [ctx.ptr_type, ctx.ptr_type], ctx.ptr_type)
    let sb_add_ty = get_rt_fn_type(ctx, "ring_sb_add")

    // B-104 D9 Part 1: codegen-level drop for interp temporaries.
    // ring_sb_add copies content (*sb += *s) — str_val ownership stays with caller.
    // ring_sb_to_str copies sb content to a new string — sb itself still alive.
    let drop_fn = get_or_declare_runtime_fn(ctx, "ring_drop", [ctx.ptr_type], ctx.void_type)
    let drop_ty = get_rt_fn_type(ctx, "ring_drop")

    for part in parts {
        match part {
            HStringInterpPart::Literal(s) => {
                let str_val = gen_str_lit(ctx, s)
                LLVMBuildCall2(ctx.builder, sb_add_ty, sb_add_fn, [sb, str_val], fresh_name(ctx, "sba"))
                // D9: gen_str_lit calls ring_str_from_cstr → FRESH allocation; drop after sb_add.
                discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [str_val], ""))
            },
            HStringInterpPart::Expression(e) => {
                let val = gen_llvm_expr(ctx, e)
                // Convert value to string based on its type
                let expr_type = hexpr_type(e)
                let str_val = convert_to_str(ctx, val, expr_type)
                LLVMBuildCall2(ctx.builder, sb_add_ty, sb_add_fn, [sb, str_val], fresh_name(ctx, "sba"))
                // D9: drop str_val ONLY when convert_to_str allocated a new string
                // (int_to_str / float_to_str / bool_to_str).  When is_str_type,
                // convert_to_str is pass-through (returns val itself) — that value
                // is D1-managed; dropping it here = double-drop = UAF.
                if !is_str_type(expr_type) {
                    discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [str_val], ""))
                }
            },
        }
    }

    // Convert StringBuilder to Str
    let sb_to_str_fn = get_or_declare_runtime_fn(ctx, "ring_sb_to_str", [ctx.ptr_type], ctx.ptr_type)
    let sb_to_str_ty = get_rt_fn_type(ctx, "ring_sb_to_str")
    let result = LLVMBuildCall2(ctx.builder, sb_to_str_ty, sb_to_str_fn, [sb], fresh_name(ctx, "interp"))
    // D9: drop the StringBuilder itself after extracting the result string.
    discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [sb], ""))
    result
}

fn convert_to_str(mut ctx: LlvmCtx, val: LLVMValueRef, ty: Type) -> LLVMValueRef {
    if is_str_type(ty) {
        val
    } else {
        if is_int_type(ty) {
            // B-080: inline untag
            let raw = unbox_int(ctx, val)
            let to_str_fn = get_or_declare_runtime_fn(ctx, "ring_int_to_str", [ctx.i64_type], ctx.ptr_type)
            let to_str_ty = get_rt_fn_type(ctx, "ring_int_to_str")
            LLVMBuildCall2(ctx.builder, to_str_ty, to_str_fn, [raw], fresh_name(ctx, "its"))
        } else {
            if is_float_type(ty) {
                // ring_float_to_str takes double, need to unbox first
                let unbox_fn = get_or_declare_runtime_fn(ctx, "ring_unbox_float", [ctx.ptr_type], ctx.double_type)
                let unbox_ty = get_rt_fn_type(ctx, "ring_unbox_float")
                let raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [val], fresh_name(ctx, "uf"))
                let to_str_fn = get_or_declare_runtime_fn(ctx, "ring_float_to_str", [ctx.double_type], ctx.ptr_type)
                let to_str_ty = get_rt_fn_type(ctx, "ring_float_to_str")
                LLVMBuildCall2(ctx.builder, to_str_ty, to_str_fn, [raw], fresh_name(ctx, "fts"))
            } else {
                if is_bool_type(ty) {
                    // B-080: inline untag
                    let raw = unbox_int(ctx, val)
                    let to_str_fn = get_or_declare_runtime_fn(ctx, "ring_bool_to_str", [ctx.i64_type], ctx.ptr_type)
                    let to_str_ty = get_rt_fn_type(ctx, "ring_bool_to_str")
                    LLVMBuildCall2(ctx.builder, to_str_ty, to_str_fn, [raw], fresh_name(ctx, "bts"))
                } else {
                    // Default: pass as ptr, try ring_int_to_str after unbox
                    // B-080: inline untag
                    let raw = unbox_int(ctx, val)
                    let to_str_fn = get_or_declare_runtime_fn(ctx, "ring_int_to_str", [ctx.i64_type], ctx.ptr_type)
                    let to_str_ty = get_rt_fn_type(ctx, "ring_int_to_str")
                    LLVMBuildCall2(ctx.builder, to_str_ty, to_str_fn, [raw], fresh_name(ctx, "ts"))
                }
            }
        }
    }
}

// ============================================================
// Helper: boxing
// ============================================================

pub fn box_int(mut ctx: LlvmCtx, raw: LLVMValueRef) -> LLVMValueRef {
    // B-080: inline tagged pointer — (val << 1) | 1, then inttoptr.
    let shifted = LLVMBuildShl(ctx.builder, raw, LLVMConstInt(ctx.i64_type, 1, 0), fresh_name(ctx, "sh"))
    let tagged = LLVMBuildOr(ctx.builder, shifted, LLVMConstInt(ctx.i64_type, 1, 0), fresh_name(ctx, "tg"))
    LLVMBuildIntToPtr(ctx.builder, tagged, ctx.ptr_type, fresh_name(ctx, "bi"))
}

pub fn box_float(mut ctx: LlvmCtx, raw: LLVMValueRef) -> LLVMValueRef {
    let box_fn = get_or_declare_runtime_fn(ctx, "ring_box_float", [ctx.double_type], ctx.ptr_type)
    let box_ty = get_rt_fn_type(ctx, "ring_box_float")
    LLVMBuildCall2(ctx.builder, box_ty, box_fn, [raw], fresh_name(ctx, "bf"))
}

pub fn box_bool(mut ctx: LlvmCtx, raw: LLVMValueRef) -> LLVMValueRef {
    // B-080: inline tagged pointer — (val << 1) | 1, then inttoptr.
    let shifted = LLVMBuildShl(ctx.builder, raw, LLVMConstInt(ctx.i64_type, 1, 0), fresh_name(ctx, "sh"))
    let tagged = LLVMBuildOr(ctx.builder, shifted, LLVMConstInt(ctx.i64_type, 1, 0), fresh_name(ctx, "tg"))
    LLVMBuildIntToPtr(ctx.builder, tagged, ctx.ptr_type, fresh_name(ctx, "bb"))
}

// ============================================================
// Helper: unbox bool to i1
// ============================================================

pub fn unbox_to_i1(mut ctx: LlvmCtx, val: LLVMValueRef) -> LLVMValueRef {
    // B-080: inline untag — ptrtoint, ashr 1, trunc to i1.
    let raw = LLVMBuildPtrToInt(ctx.builder, val, ctx.i64_type, fresh_name(ctx, "ub"))
    let shifted = LLVMBuildAShr(ctx.builder, raw, LLVMConstInt(ctx.i64_type, 1, 0), fresh_name(ctx, "sh"))
    LLVMBuildTrunc(ctx.builder, shifted, ctx.i1_type, fresh_name(ctx, "i1"))
}

// B-080: inline untag for Int — ptrtoint, ashr 1 → i64 value.
pub fn unbox_int(mut ctx: LlvmCtx, val: LLVMValueRef) -> LLVMValueRef {
    let raw = LLVMBuildPtrToInt(ctx.builder, val, ctx.i64_type, fresh_name(ctx, "ui"))
    LLVMBuildAShr(ctx.builder, raw, LLVMConstInt(ctx.i64_type, 1, 0), fresh_name(ctx, "uv"))
}

// Discard an LLVMValueRef (to avoid type mismatch in Unit-returning match arms)
fn discard(v: LLVMValueRef) {
    // intentionally empty — just consume the value
}

// ============================================================
// Match expression
// ============================================================

fn gen_match_expr(mut ctx: LlvmCtx, scrutinee: HExpr, arms: List<HMatchArm>, result_ty: Type) -> LLVMValueRef {
    let current_fn = match ctx.current_fn {
        some(f) => f,
        none => panic("LLVM codegen: match expr outside function"),
    }

    let scrut_val = gen_llvm_expr(ctx, scrutinee)
    let scrut_ty = hexpr_type(scrutinee)
    ctx.match_counter = ctx.match_counter + 1

    // Check if scrutinee is an enum type
    let enum_name = match scrut_ty {
        Type::EnumType { name, .. } => some(name),
        _ => none,
    }

    let merge_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.merge")
    let default_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.default")

    // A switch routes each tag to exactly one case with no fall-through between
    // cases. That is incompatible with guards: a false guard must fall through to
    // the NEXT arm, which may share the same constructor/tag. So any match that
    // contains a guarded arm — enum or not — is lowered via the if-else chain
    // (gen_match_if_else), which emits explicit tag tests and re-tests each arm's
    // pattern+guard on fall-through, exactly matching the JS oracle. The switch is
    // kept purely as an optimization for guard-free enum matches.
    //
    // Also incompatible with the switch: duplicate constructor tags. A match like
    //   match e { Neg(Lit(n)) => ..., Neg(inner) => ... }
    // has two arms for the Neg tag. LLVMAddCase with the same tag value twice is
    // undefined behavior (the second case is silently ignored), so the second arm
    // becomes unreachable. Detect this and fall back to the if-else chain.
    let mut any_guard = false
    let mut has_dup_tag = false
    let mut seen_ctors: List<Str> = []
    for arm in arms {
        match arm.guard { some(_) => { any_guard = true }, none => {} }
        let ctor_name = match arm.pattern {
            Pattern::Constructor { name, .. } => some(name),
            Pattern::NamedConstructor { name, .. } => some(name),
            _ => none,
        }
        match ctor_name {
            some(cn) => {
                if seen_ctors.contains(cn) {
                    has_dup_tag = true
                }
                seen_ctors.push(cn)
            },
            none => {},
        }
    }
    if any_guard || has_dup_tag {
        return gen_match_if_else(ctx, scrut_val, scrut_ty, arms, merge_bb, default_bb, current_fn)
    }

    // For enum types: extract tag and use switch
    match enum_name {
        some(ename) => {
            match ctx.enum_types.get(ename) {
                some(enum_info) => {
                    // Extract tag: GEP to field 0 (i64), load
                    let tag_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, scrut_val, 0, fresh_name(ctx, "tp"))
                    let tag_val = LLVMBuildLoad2(ctx.builder, ctx.i64_type, tag_ptr, fresh_name(ctx, "tag"))

                    let switch_val = LLVMBuildSwitch(ctx.builder, tag_val, default_bb, arms.len())

                    let mut phi_vals: List<LLVMValueRef> = []
                    let mut phi_bbs: List<LLVMBasicBlockRef> = []
                    let mut has_wildcard = false

                    for arm in arms {
                        let is_wild = match arm.pattern {
                            Pattern::Wildcard { .. } => true,
                            Pattern::Binding { .. } => true,
                            _ => false,
                        }
                        if is_wild {
                            has_wildcard = true
                            // Wildcard/binding: emit body into the default block
                            gen_match_arm_wildcard(ctx, arm, scrut_val, default_bb, merge_bb, phi_vals, phi_bbs)
                        } else {
                            gen_match_arm_enum(ctx, arm, scrut_val, ename, enum_info, switch_val, merge_bb, current_fn, phi_vals, phi_bbs)
                        }
                    }

                    // Default block: if no wildcard, report non-exhaustive match
                    // with the enum name and the actual runtime tag.
                    if !has_wildcard {
                        LLVMPositionBuilderAtEnd(ctx.builder, default_bb)
                        let mf_fn = get_or_declare_runtime_fn(ctx, "ring_match_fail", [ctx.ptr_type, ctx.i64_type, ctx.i64_type, ctx.ptr_type], ctx.ptr_type)
                        let mf_ty = get_rt_fn_type(ctx, "ring_match_fail")
                        let ename_str = gen_str_lit(ctx, "${ename} in ${ctx.current_fn_name}")
                        let site_val = LLVMConstInt(ctx.i64_type, ctx.match_counter, 0)
                        discard(LLVMBuildCall2(ctx.builder, mf_ty, mf_fn, [ename_str, tag_val, site_val, scrut_val], fresh_name(ctx, "mf")))
                        discard(LLVMBuildUnreachable(ctx.builder))
                    }

                    // Merge
                    LLVMPositionBuilderAtEnd(ctx.builder, merge_bb)
                    if phi_vals.len() > 0 {
                        let phi = LLVMBuildPhi(ctx.builder, ctx.ptr_type, fresh_name(ctx, "mr"))
                        LLVMAddIncoming(phi, phi_vals, phi_bbs)
                        phi
                    } else {
                        LLVMConstPointerNull(ctx.ptr_type)
                    }
                },
                none => {
                    // Enum not registered — fallback to if-else chain
                    gen_match_if_else(ctx, scrut_val, scrut_ty, arms, merge_bb, default_bb, current_fn)
                },
            }
        },
        none => {
            // Non-enum: use if-else chain for literal/binding/wildcard patterns
            gen_match_if_else(ctx, scrut_val, scrut_ty, arms, merge_bb, default_bb, current_fn)
        },
    }
}

fn gen_match_arm_enum(mut ctx: LlvmCtx, arm: HMatchArm, scrut_val: LLVMValueRef, enum_name: Str, enum_info: EnumTypeInfo, switch_val: LLVMValueRef, merge_bb: LLVMBasicBlockRef, current_fn: LLVMValueRef, mut phi_vals: List<LLVMValueRef>, mut phi_bbs: List<LLVMBasicBlockRef>) {
    match arm.pattern {
        Pattern::Constructor { name, fields, .. } => {
            match enum_info.variants.get(name) {
                some(vi) => {
                    let arm_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.arm.${name}")
                    LLVMAddCase(switch_val, LLVMConstInt(ctx.i64_type, vi.tag, 0), arm_bb)

                    LLVMPositionBuilderAtEnd(ctx.builder, arm_bb)
                    // Bind pattern variables: fields at index 1, 2, ... in enum struct
                    for i in 0..fields.len() {
                        match fields.get(i) {
                            some(field_pat) => {
                                match field_pat {
                                    Pattern::Binding { name: bname, .. } => {
                                        let field_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, scrut_val, i + 1, fresh_name(ctx, "ef"))
                                        let field_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, fresh_name(ctx, bname))
                                        let alloca = build_entry_alloca(ctx, ctx.ptr_type, bname)
                                        discard(LLVMBuildStore(ctx.builder, field_val, alloca))
                                        ctx.named_values.insert(bname, alloca)
                                    },
                                    Pattern::Wildcard { .. } => {},
                                    _ => {
                                        // For nested patterns, extract field and bind as unnamed for now
                                        let field_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, scrut_val, i + 1, fresh_name(ctx, "ef"))
                                        let field_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, fresh_name(ctx, "fv"))
                                        // Recursively bind nested patterns
                                        bind_nested_pattern(ctx, field_val, field_pat)
                                    },
                                }
                            },
                            none => {},
                        }
                    }

                    let body_val = gen_llvm_expr(ctx, arm.body)
                    let arm_end_bb = LLVMGetInsertBlock(ctx.builder)
                    discard(LLVMBuildBr(ctx.builder, merge_bb))
                    phi_vals.push(body_val)
                    phi_bbs.push(arm_end_bb)
                },
                none => {},
            }
        },
        Pattern::NamedConstructor { name, fields: named_fields, .. } => {
            match enum_info.variants.get(name) {
                some(vi) => {
                    let arm_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.arm.${name}")
                    LLVMAddCase(switch_val, LLVMConstInt(ctx.i64_type, vi.tag, 0), arm_bb)

                    LLVMPositionBuilderAtEnd(ctx.builder, arm_bb)
                    // Named constructor fields: bind by field name
                    // Look up each pattern field's position in the variant's declared field list
                    for i in 0..named_fields.len() {
                        match named_fields.get(i) {
                            some(nf) => {
                                let mut field_idx = i
                                for fi in 0..vi.field_names.len() {
                                    if vi.field_names[fi] == nf.name {
                                        field_idx = fi
                                    }
                                }
                                match nf.pattern {
                                    Pattern::Binding { name: bname, .. } => {
                                        let field_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, scrut_val, field_idx + 1, fresh_name(ctx, "ef"))
                                        let field_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, fresh_name(ctx, bname))
                                        let alloca = build_entry_alloca(ctx, ctx.ptr_type, bname)
                                        discard(LLVMBuildStore(ctx.builder, field_val, alloca))
                                        ctx.named_values.insert(bname, alloca)
                                    },
                                    Pattern::Wildcard { .. } => {},
                                    _ => {
                                        let field_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, scrut_val, field_idx + 1, fresh_name(ctx, "ef"))
                                        let field_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, fresh_name(ctx, "fv"))
                                        bind_nested_pattern(ctx, field_val, nf.pattern)
                                    },
                                }
                            },
                            none => {},
                        }
                    }

                    let body_val = gen_llvm_expr(ctx, arm.body)
                    let arm_end_bb = LLVMGetInsertBlock(ctx.builder)
                    discard(LLVMBuildBr(ctx.builder, merge_bb))
                    phi_vals.push(body_val)
                    phi_bbs.push(arm_end_bb)
                },
                none => {},
            }
        },
        Pattern::Wildcard { .. } => {
            // Wildcard/binding arms in enum match are now handled by the caller
            // via gen_match_arm_wildcard. This branch should not be reached.
        },
        Pattern::Binding { name: bname, .. } => {
            // Wildcard/binding arms in enum match are now handled by the caller
            // via gen_match_arm_wildcard. This branch should not be reached.
        },
        Pattern::OrPattern { patterns, .. } => {
            // An OR pattern (A | B | ...) over enum variants: route every
            // alternative's tag to the same arm body. Alternatives are field-less
            // variants (field bindings across alternatives are not supported).
            let arm_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.arm.or")
            for alt in patterns {
                let alt_name = match alt {
                    Pattern::Constructor { name, .. } => some(name),
                    Pattern::NamedConstructor { name, .. } => some(name),
                    _ => none,
                }
                match alt_name {
                    some(an) => match enum_info.variants.get(an) {
                        some(vi) => { LLVMAddCase(switch_val, LLVMConstInt(ctx.i64_type, vi.tag, 0), arm_bb) },
                        none => {},
                    },
                    none => {},
                }
            }
            LLVMPositionBuilderAtEnd(ctx.builder, arm_bb)
            let body_val = gen_llvm_expr(ctx, arm.body)
            let arm_end_bb = LLVMGetInsertBlock(ctx.builder)
            discard(LLVMBuildBr(ctx.builder, merge_bb))
            phi_vals.push(body_val)
            phi_bbs.push(arm_end_bb)
        },
        _ => {
            // Other pattern types in enum context - should not normally occur
            // since wildcards/bindings are handled by gen_match_arm_wildcard
        },
    }
}

// Handle wildcard/binding arm in enum match — emits body into default_bb
fn gen_match_arm_wildcard(mut ctx: LlvmCtx, arm: HMatchArm, scrut_val: LLVMValueRef, default_bb: LLVMBasicBlockRef, merge_bb: LLVMBasicBlockRef, mut phi_vals: List<LLVMValueRef>, mut phi_bbs: List<LLVMBasicBlockRef>) {
    LLVMPositionBuilderAtEnd(ctx.builder, default_bb)

    // If it's a binding pattern, bind the scrutinee value
    match arm.pattern {
        Pattern::Binding { name: bname, .. } => {
            let alloca = build_entry_alloca(ctx, ctx.ptr_type, bname)
            discard(LLVMBuildStore(ctx.builder, scrut_val, alloca))
            ctx.named_values.insert(bname, alloca)
        },
        _ => {},
    }

    let body_val = gen_llvm_expr(ctx, arm.body)
    let arm_end_bb = LLVMGetInsertBlock(ctx.builder)
    discard(LLVMBuildBr(ctx.builder, merge_bb))
    phi_vals.push(body_val)
    phi_bbs.push(arm_end_bb)
}

// Helper to bind nested patterns recursively
fn bind_nested_pattern(mut ctx: LlvmCtx, val: LLVMValueRef, pat: Pattern) {
    match pat {
        Pattern::Binding { name, .. } => {
            let alloca = build_entry_alloca(ctx, ctx.ptr_type, name)
            discard(LLVMBuildStore(ctx.builder, val, alloca))
            ctx.named_values.insert(name, alloca)
        },
        Pattern::Wildcard { .. } => {},
        Pattern::Constructor { name, qualifier, fields, .. } => {
            // Nested enum: name is the variant name, qualifier might be the enum name
            // Look up the enum type that contains this variant
            let enum_info = find_enum_by_variant(ctx, name, qualifier)
            match enum_info {
                some(ei) => {
                    for i in 0..fields.len() {
                        match fields.get(i) {
                            some(fp) => {
                                let field_ptr = LLVMBuildStructGEP2(ctx.builder, ei.llvm_type, val, i + 1, fresh_name(ctx, "nf"))
                                let field_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, fresh_name(ctx, "nv"))
                                bind_nested_pattern(ctx, field_val, fp)
                            },
                            none => {},
                        }
                    }
                },
                none => {},
            }
        },
        Pattern::TuplePattern { elements, .. } => {
            // Tuple is represented as list — use ring_list_get
            let get_fn = get_or_declare_runtime_fn(ctx, "ring_list_get", [ctx.ptr_type, ctx.i64_type], ctx.ptr_type)
            let get_ty = get_rt_fn_type(ctx, "ring_list_get")
            for i in 0..elements.len() {
                match elements.get(i) {
                    some(ep) => {
                        let idx = LLVMConstInt(ctx.i64_type, i, 0)
                        let elem = LLVMBuildCall2(ctx.builder, get_ty, get_fn, [val, idx], fresh_name(ctx, "te"))
                        bind_nested_pattern(ctx, elem, ep)
                    },
                    none => {},
                }
            }
        },
        Pattern::NamedConstructor { name, qualifier, fields, .. } => {
            let enum_info = find_enum_by_variant(ctx, name, qualifier)
            match enum_info {
                some(ei) => {
                    // Bind by FIELD NAME (not pattern position): a named-constructor pattern may
                    // list fields in any order, so map each pattern field to its declared slot.
                    let fnames = match ei.variants.get(name) {
                        some(vi) => vi.field_names,
                        none => [],
                    }
                    for i in 0..fields.len() {
                        match fields.get(i) {
                            some(nf) => {
                                let mut field_idx = i
                                for fi in 0..fnames.len() {
                                    if fnames[fi] == nf.name {
                                        field_idx = fi
                                    }
                                }
                                let field_ptr = LLVMBuildStructGEP2(ctx.builder, ei.llvm_type, val, field_idx + 1, fresh_name(ctx, "nf"))
                                let field_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, fresh_name(ctx, "nv"))
                                bind_nested_pattern(ctx, field_val, nf.pattern)
                            },
                            none => {},
                        }
                    }
                },
                none => {
                    // Not an enum — try struct types (e.g. catch arm on a plain struct error)
                    match ctx.struct_types.get(name) {
                        some(si) => {
                            for i in 0..fields.len() {
                                match fields.get(i) {
                                    some(nf) => {
                                        let mut field_idx = i
                                        for fi in 0..si.field_names.len() {
                                            if si.field_names[fi] == nf.name {
                                                field_idx = fi
                                            }
                                        }
                                        let field_ptr = LLVMBuildStructGEP2(ctx.builder, si.llvm_type, val, field_idx, fresh_name(ctx, "sf"))
                                        let field_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, fresh_name(ctx, "sv"))
                                        bind_nested_pattern(ctx, field_val, nf.pattern)
                                    },
                                    none => {},
                                }
                            }
                        },
                        none => {},
                    }
                },
            }
        },
        _ => {},
    }
}

// Emit the guard check (if any) and the arm body, branching to merge_bb on
// success. The builder must already be positioned at the block where the
// pattern matched and its variables are bound. When the arm has a guard, the
// guard is evaluated here; a false guard falls through to next_bb (re-testing
// the following arm's pattern+guard), mirroring the JS oracle. Arms without a
// guard branch unconditionally to the body, preserving prior behavior.
fn emit_match_arm_body(mut ctx: LlvmCtx, arm: HMatchArm, merge_bb: LLVMBasicBlockRef, next_bb: LLVMBasicBlockRef, current_fn: LLVMValueRef, mut phi_vals: List<LLVMValueRef>, mut phi_bbs: List<LLVMBasicBlockRef>) {
    match arm.guard {
        some(g) => {
            let body_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.body")
            let guard_val = gen_llvm_expr(ctx, g)
            let guard_i1 = unbox_to_i1(ctx, guard_val)
            // B-104 D1 Stage 2 — guard box drop (same as emit_while's
            // condition drop): a fresh-owned Bool guard box (`v > 0` →
            // box_bool; a dropping guard-block's Clone-wrapped tail) is fully
            // consumed by the unbox above and would otherwise leak per guard
            // evaluation.  Emitted post-unbox, pre-branch, so BOTH edges
            // (taken body / fall-through to the next arm test) see the box
            // released exactly once.  is_fresh_owned_bool_value (hir.ring)
            // keeps borrows (Ident guards, unwrap-family calls, And/Or phis)
            // un-dropped.
            if is_fresh_owned_bool_value(g) {
                let gdrop_fn = get_or_declare_runtime_fn(ctx, "ring_drop", [ctx.ptr_type], ctx.void_type)
                let gdrop_ty = get_rt_fn_type(ctx, "ring_drop")
                discard(LLVMBuildCall2(ctx.builder, gdrop_ty, gdrop_fn, [guard_val], ""))
            }
            discard(LLVMBuildCondBr(ctx.builder, guard_i1, body_bb, next_bb))
            LLVMPositionBuilderAtEnd(ctx.builder, body_bb)
        },
        none => {},
    }
    let body_val = gen_llvm_expr(ctx, arm.body)
    let arm_end_bb = LLVMGetInsertBlock(ctx.builder)
    discard(LLVMBuildBr(ctx.builder, merge_bb))
    phi_vals.push(body_val)
    phi_bbs.push(arm_end_bb)
}

// Non-enum match: if-else chain.
// Also used for enum matches that contain at least one guarded arm: a switch
// gives each tag exactly one target with no fall-through between cases, but a
// false guard must fall through to the NEXT arm (which may share the same
// constructor/tag), so guarded enum matches are lowered through this chain
// instead of via gen_match_arm_enum's switch. Constructor / NamedConstructor /
// OrPattern arms therefore emit explicit tag tests here.
fn gen_match_if_else(mut ctx: LlvmCtx, scrut_val: LLVMValueRef, scrut_ty: Type, arms: List<HMatchArm>, merge_bb: LLVMBasicBlockRef, default_bb: LLVMBasicBlockRef, current_fn: LLVMValueRef) -> LLVMValueRef {
    let mut phi_vals: List<LLVMValueRef> = []
    let mut phi_bbs: List<LLVMBasicBlockRef> = []
    // open_block tracks whether the builder is currently positioned at a basic
    // block that has NOT yet been given a terminator. Only such a block needs the
    // trailing `br default_bb`. Appending it to an already-terminated block produces
    // invalid IR ("terminator in the middle of a basic block").
    let mut open_block = false

    let mut remaining_arms = arms
    let total = arms.len()
    for i in 0..total {
        match arms.get(i) {
            some(arm) => {
                let is_last = i == total - 1
                // A guarded arm is never an unconditional match even when its
                // pattern is irrefutable (wildcard/binding): a false guard must
                // be able to fall through to the next arm, so it always needs a
                // next_bb. Compute one up front for the irrefutable cases.
                let has_guard = match arm.guard { some(_) => true, none => false }
                match arm.pattern {
                    Pattern::Wildcard { .. } => {
                        open_block = false
                        // An unguarded wildcard is irrefutable and matches
                        // unconditionally (no fall-through), so it needs no fresh
                        // next_bb — default_bb is used as the (unreachable) guard-
                        // false target placeholder only when guarded+last. A fresh
                        // fall-through block is allocated only for a guarded non-
                        // last wildcard.
                        let next_bb = if has_guard && is_last == false { LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.next") } else { default_bb }
                        let arm_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.wild")
                        discard(LLVMBuildBr(ctx.builder, arm_bb))
                        LLVMPositionBuilderAtEnd(ctx.builder, arm_bb)
                        emit_match_arm_body(ctx, arm, merge_bb, next_bb, current_fn, phi_vals, phi_bbs)
                        if has_guard && is_last == false {
                            LLVMPositionBuilderAtEnd(ctx.builder, next_bb)
                            open_block = true
                        }
                    },
                    Pattern::Binding { name: bname, .. } => {
                        open_block = false
                        let next_bb = if has_guard && is_last == false { LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.next") } else { default_bb }
                        let arm_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.bind")
                        discard(LLVMBuildBr(ctx.builder, arm_bb))
                        LLVMPositionBuilderAtEnd(ctx.builder, arm_bb)
                        let alloca = build_entry_alloca(ctx, ctx.ptr_type, bname)
                        discard(LLVMBuildStore(ctx.builder, scrut_val, alloca))
                        ctx.named_values.insert(bname, alloca)
                        emit_match_arm_body(ctx, arm, merge_bb, next_bb, current_fn, phi_vals, phi_bbs)
                        if has_guard && is_last == false {
                            LLVMPositionBuilderAtEnd(ctx.builder, next_bb)
                            open_block = true
                        }
                    },
                    Pattern::Literal { value, .. } => {
                        let arm_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.lit")
                        let next_bb = if is_last { default_bb } else { LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.next") }

                        // Generate condition
                        let cond_i1 = gen_literal_pattern_cond(ctx, scrut_val, scrut_ty, value)
                        discard(LLVMBuildCondBr(ctx.builder, cond_i1, arm_bb, next_bb))

                        LLVMPositionBuilderAtEnd(ctx.builder, arm_bb)
                        emit_match_arm_body(ctx, arm, merge_bb, next_bb, current_fn, phi_vals, phi_bbs)

                        if is_last == false {
                            // Non-last: builder moves to the (empty, unterminated) fall-through block.
                            LLVMPositionBuilderAtEnd(ctx.builder, next_bb)
                            open_block = true
                        } else {
                            // Last: cond-false already branches to default_bb; builder stays on the
                            // terminated arm block, so no trailing br is needed.
                            open_block = false
                        }
                    },
                    Pattern::Constructor { name: cname, qualifier, fields, .. } => {
                        // Enum constructor in if-else chain (taken for guarded enum
                        // matches). Test the runtime tag, then bind fields.
                        let next_bb = if is_last { default_bb } else { LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.next") }
                        let arm_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.ctor.${cname}")
                        gen_ctor_tag_test(ctx, scrut_val, cname, qualifier, arm_bb, next_bb, current_fn)
                        LLVMPositionBuilderAtEnd(ctx.builder, arm_bb)
                        bind_constructor_fields(ctx, scrut_val, cname, qualifier, fields)
                        emit_match_arm_body(ctx, arm, merge_bb, next_bb, current_fn, phi_vals, phi_bbs)
                        if is_last == false {
                            LLVMPositionBuilderAtEnd(ctx.builder, next_bb)
                            open_block = true
                        } else {
                            open_block = false
                        }
                    },
                    Pattern::NamedConstructor { name: cname, qualifier, fields: nfields, .. } => {
                        let next_bb = if is_last { default_bb } else { LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.next") }
                        let arm_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.ctor.${cname}")
                        gen_ctor_tag_test(ctx, scrut_val, cname, qualifier, arm_bb, next_bb, current_fn)
                        LLVMPositionBuilderAtEnd(ctx.builder, arm_bb)
                        bind_named_constructor_fields(ctx, scrut_val, cname, qualifier, nfields)
                        emit_match_arm_body(ctx, arm, merge_bb, next_bb, current_fn, phi_vals, phi_bbs)
                        if is_last == false {
                            LLVMPositionBuilderAtEnd(ctx.builder, next_bb)
                            open_block = true
                        } else {
                            open_block = false
                        }
                    },
                    Pattern::OrPattern { patterns, .. } => {
                        // OR pattern over enum variants in the if-else chain:
                        // match if ANY alternative's tag matches. Chain the tag
                        // tests so the first match jumps to arm_bb; all-miss goes
                        // to next_bb. Field-less alternatives only (same constraint
                        // as the switch path).
                        let next_bb = if is_last { default_bb } else { LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.next") }
                        let arm_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.or")
                        let palts = patterns
                        let nalts = palts.len()
                        for k in 0..nalts {
                            match palts.get(k) {
                                some(alt) => {
                                    let alt_ref = match alt {
                                        Pattern::Constructor { name: an, qualifier: aq, .. } => some((an, aq)),
                                        Pattern::NamedConstructor { name: an, qualifier: aq, .. } => some((an, aq)),
                                        _ => none,
                                    }
                                    match alt_ref {
                                        some(ar) => {
                                            let (an, aq) = ar
                                            // On the last alternative, a miss goes to next_bb;
                                            // earlier misses go to a fresh test block.
                                            let miss_bb = if k == nalts - 1 { next_bb } else { LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.or.alt") }
                                            gen_ctor_tag_test(ctx, scrut_val, an, aq, arm_bb, miss_bb, current_fn)
                                            LLVMPositionBuilderAtEnd(ctx.builder, miss_bb)
                                        },
                                        none => {},
                                    }
                                },
                                none => {},
                            }
                        }
                        // Builder is now at the last miss target (== next_bb). Emit the body.
                        LLVMPositionBuilderAtEnd(ctx.builder, arm_bb)
                        emit_match_arm_body(ctx, arm, merge_bb, next_bb, current_fn, phi_vals, phi_bbs)
                        if is_last == false {
                            LLVMPositionBuilderAtEnd(ctx.builder, next_bb)
                            open_block = true
                        } else {
                            open_block = false
                        }
                    },
                    Pattern::TuplePattern { elements, .. } => {
                        let get_fn = get_or_declare_runtime_fn(ctx, "ring_list_get", [ctx.ptr_type, ctx.i64_type], ctx.ptr_type)
                        let get_ty = get_rt_fn_type(ctx, "ring_list_get")
                        let next_bb = if is_last { default_bb } else { LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.next") }

                        // Phase 1: Check constructor sub-patterns' tags AND literal
                        // sub-patterns' values. Both tuple-style (Constructor) and
                        // struct-style (NamedConstructor) sub-patterns must verify the
                        // element's tag — otherwise an arm like
                        // `(Type::FnType { .. }, Type::FnType { .. })` would match ANY pair of
                        // values, reading the wrong fields out of the actual variant.
                        // #B-087 (B-088 hedged #2): a literal element such as `(0, s)` must
                        // also compare the element against the literal — previously skipped,
                        // so `(0, s)` matched ANY first element (every arm collapsed to the
                        // first literal arm).
                        for j in 0..elements.len() {
                            match elements.get(j) {
                                some(elem_pat) => {
                                    let ctor_ref = match elem_pat {
                                        Pattern::Constructor { name: cname, qualifier, .. } => some((cname, qualifier)),
                                        Pattern::NamedConstructor { name: cname, qualifier, .. } => some((cname, qualifier)),
                                        _ => none,
                                    }
                                    match ctor_ref {
                                        some(cref) => {
                                            let (cname, qualifier) = cref
                                            let idx = LLVMConstInt(ctx.i64_type, j, 0)
                                            let elem_val = LLVMBuildCall2(ctx.builder, get_ty, get_fn, [scrut_val, idx], fresh_name(ctx, "tc"))
                                            let ei = find_enum_by_variant(ctx, cname, qualifier)
                                            match ei {
                                                some(enum_info) => match enum_info.variants.get(cname) {
                                                    some(vi) => {
                                                        let tag_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, elem_val, 0, fresh_name(ctx, "tp"))
                                                        let tag_val = LLVMBuildLoad2(ctx.builder, ctx.i64_type, tag_ptr, fresh_name(ctx, "tv"))
                                                        let expected = LLVMConstInt(ctx.i64_type, vi.tag, 0)
                                                        let cmp = LLVMBuildICmp(ctx.builder, 32, tag_val, expected, fresh_name(ctx, "tc"))
                                                        let pass_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "tuple.check")
                                                        discard(LLVMBuildCondBr(ctx.builder, cmp, pass_bb, next_bb))
                                                        LLVMPositionBuilderAtEnd(ctx.builder, pass_bb)
                                                    },
                                                    none => {},
                                                },
                                                none => {},
                                            }
                                        },
                                        none => {
                                            // Literal element: compare the tuple element against the literal.
                                            match elem_pat {
                                                Pattern::Literal { value, .. } => {
                                                    let idx = LLVMConstInt(ctx.i64_type, j, 0)
                                                    let elem_val = LLVMBuildCall2(ctx.builder, get_ty, get_fn, [scrut_val, idx], fresh_name(ctx, "tl"))
                                                    let elem_ty = tuple_element_type(scrut_ty, j)
                                                    let cmp = gen_literal_pattern_cond(ctx, elem_val, elem_ty, value)
                                                    let pass_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "tuple.litcheck")
                                                    discard(LLVMBuildCondBr(ctx.builder, cmp, pass_bb, next_bb))
                                                    LLVMPositionBuilderAtEnd(ctx.builder, pass_bb)
                                                },
                                                _ => {},
                                            }
                                        },
                                    }
                                },
                                none => {},
                            }
                        }

                        // Phase 2: All checks passed — bind variables
                        for j in 0..elements.len() {
                            match elements.get(j) {
                                some(elem_pat) => match elem_pat {
                                    Pattern::Binding { name: bname, .. } => {
                                        let idx = LLVMConstInt(ctx.i64_type, j, 0)
                                        let field_val = LLVMBuildCall2(ctx.builder, get_ty, get_fn, [scrut_val, idx], fresh_name(ctx, bname))
                                        let alloca = build_entry_alloca(ctx, ctx.ptr_type, bname)
                                        discard(LLVMBuildStore(ctx.builder, field_val, alloca))
                                        ctx.named_values.insert(bname, alloca)
                                    },
                                    Pattern::Wildcard { .. } => {},
                                    _ => {
                                        let idx = LLVMConstInt(ctx.i64_type, j, 0)
                                        let field_val = LLVMBuildCall2(ctx.builder, get_ty, get_fn, [scrut_val, idx], fresh_name(ctx, "tv"))
                                        bind_nested_pattern(ctx, field_val, elem_pat)
                                    },
                                },
                                none => {},
                            }
                        }

                        emit_match_arm_body(ctx, arm, merge_bb, next_bb, current_fn, phi_vals, phi_bbs)
                        if is_last == false {
                            LLVMPositionBuilderAtEnd(ctx.builder, next_bb)
                            open_block = true
                        } else {
                            open_block = false
                        }
                    },
                    _ => {
                        // For other patterns in non-enum context, bind any pattern
                        // variables and treat the pattern as irrefutable. Without a
                        // guard it matches unconditionally; only a false guard falls
                        // through to the next arm. A fresh fall-through block is
                        // allocated only when this arm can actually fall through
                        // (guarded non-last); otherwise default_bb is the (unused or
                        // exhaustion) placeholder.
                        open_block = false
                        let next_bb = if has_guard && is_last == false { LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.next") } else { default_bb }
                        let arm_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "match.other")
                        discard(LLVMBuildBr(ctx.builder, arm_bb))
                        LLVMPositionBuilderAtEnd(ctx.builder, arm_bb)
                        bind_nested_pattern(ctx, scrut_val, arm.pattern)
                        emit_match_arm_body(ctx, arm, merge_bb, next_bb, current_fn, phi_vals, phi_bbs)
                        if has_guard && is_last == false {
                            LLVMPositionBuilderAtEnd(ctx.builder, next_bb)
                            open_block = true
                        }
                    },
                }
            },
            none => {},
        }
    }

    // Connect the trailing fall-through to default_bb only when the builder is at an
    // open (unterminated) block. Arms that already terminated their block (wildcard,
    // binding, or a last literal/tuple whose cond-false targets default_bb directly)
    // leave open_block=false, so we must not append a second terminator here.
    if open_block {
        discard(LLVMBuildBr(ctx.builder, default_bb))
    }

    // Always fill default_bb with panic + unreachable
    // (if wildcard was handled, default_bb is unreachable but still needs a terminator)
    LLVMPositionBuilderAtEnd(ctx.builder, default_bb)
    let panic_fn = get_or_declare_runtime_fn(ctx, "ring_panic", [ctx.ptr_type], ctx.ptr_type)
    let panic_ty = get_rt_fn_type(ctx, "ring_panic")
    let msg = gen_str_lit(ctx, "match exhaustion failure #${ctx.match_counter}")
    LLVMBuildCall2(ctx.builder, panic_ty, panic_fn, [msg], fresh_name(ctx, "mp"))
    discard(LLVMBuildUnreachable(ctx.builder))

    // Merge
    LLVMPositionBuilderAtEnd(ctx.builder, merge_bb)
    if phi_vals.len() > 0 {
        let phi = LLVMBuildPhi(ctx.builder, ctx.ptr_type, fresh_name(ctx, "mr"))
        LLVMAddIncoming(phi, phi_vals, phi_bbs)
        phi
    } else {
        LLVMConstPointerNull(ctx.ptr_type)
    }
}

// Helper: emit a runtime-tag test for an enum constructor in the if-else chain.
// If the scrutinee's tag equals the variant's tag, branch to match_bb, else to
// miss_bb. Used by guarded enum matches (which can't use the switch path because
// a false guard must fall through to the next arm). If the variant cannot be
// resolved, branch unconditionally to match_bb (best-effort, mirrors the
// switch path's silent skip).
fn gen_ctor_tag_test(mut ctx: LlvmCtx, scrut_val: LLVMValueRef, cname: Str, qualifier: Str?, match_bb: LLVMBasicBlockRef, miss_bb: LLVMBasicBlockRef, current_fn: LLVMValueRef) {
    let ei = find_enum_by_variant(ctx, cname, qualifier)
    match ei {
        some(enum_info) => match enum_info.variants.get(cname) {
            some(vi) => {
                let tag_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, scrut_val, 0, fresh_name(ctx, "tp"))
                let tag_val = LLVMBuildLoad2(ctx.builder, ctx.i64_type, tag_ptr, fresh_name(ctx, "tag"))
                let expected = LLVMConstInt(ctx.i64_type, vi.tag, 0)
                let cmp = LLVMBuildICmp(ctx.builder, 32, tag_val, expected, fresh_name(ctx, "tc"))
                discard(LLVMBuildCondBr(ctx.builder, cmp, match_bb, miss_bb))
            },
            none => { discard(LLVMBuildBr(ctx.builder, match_bb)) },
        },
        none => { discard(LLVMBuildBr(ctx.builder, match_bb)) },
    }
}

// Helper: bind a positional constructor pattern's fields (after its tag was
// verified). Mirrors the field-binding logic of gen_match_arm_enum's switch
// path so the if-else chain produces identical bindings.
fn bind_constructor_fields(mut ctx: LlvmCtx, scrut_val: LLVMValueRef, cname: Str, qualifier: Str?, fields: List<Pattern>) {
    let ei = find_enum_by_variant(ctx, cname, qualifier)
    match ei {
        some(enum_info) => {
            for i in 0..fields.len() {
                match fields.get(i) {
                    some(field_pat) => {
                        match field_pat {
                            Pattern::Binding { name: bname, .. } => {
                                let field_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, scrut_val, i + 1, fresh_name(ctx, "ef"))
                                let field_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, fresh_name(ctx, bname))
                                let alloca = build_entry_alloca(ctx, ctx.ptr_type, bname)
                                discard(LLVMBuildStore(ctx.builder, field_val, alloca))
                                ctx.named_values.insert(bname, alloca)
                            },
                            Pattern::Wildcard { .. } => {},
                            _ => {
                                let field_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, scrut_val, i + 1, fresh_name(ctx, "ef"))
                                let field_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, fresh_name(ctx, "fv"))
                                bind_nested_pattern(ctx, field_val, field_pat)
                            },
                        }
                    },
                    none => {},
                }
            }
        },
        none => {},
    }
}

// Helper: bind a named-constructor pattern's fields by field name (after its
// tag was verified). Mirrors gen_match_arm_enum's named-constructor path.
fn bind_named_constructor_fields(mut ctx: LlvmCtx, scrut_val: LLVMValueRef, cname: Str, qualifier: Str?, named_fields: List<NamedPatternField>) {
    let ei = find_enum_by_variant(ctx, cname, qualifier)
    match ei {
        some(enum_info) => match enum_info.variants.get(cname) {
            some(vi) => {
                for i in 0..named_fields.len() {
                    match named_fields.get(i) {
                        some(nf) => {
                            let mut field_idx = i
                            for fi in 0..vi.field_names.len() {
                                if vi.field_names[fi] == nf.name {
                                    field_idx = fi
                                }
                            }
                            match nf.pattern {
                                Pattern::Binding { name: bname, .. } => {
                                    let field_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, scrut_val, field_idx + 1, fresh_name(ctx, "ef"))
                                    let field_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, fresh_name(ctx, bname))
                                    let alloca = build_entry_alloca(ctx, ctx.ptr_type, bname)
                                    discard(LLVMBuildStore(ctx.builder, field_val, alloca))
                                    ctx.named_values.insert(bname, alloca)
                                },
                                Pattern::Wildcard { .. } => {},
                                _ => {
                                    let field_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, scrut_val, field_idx + 1, fresh_name(ctx, "ef"))
                                    let field_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, fresh_name(ctx, "fv"))
                                    bind_nested_pattern(ctx, field_val, nf.pattern)
                                },
                            }
                        },
                        none => {},
                    }
                }
            },
            none => {},
        },
        none => {},
    }
}

// Helper: find enum type info by variant name (or qualifier if present)
fn find_enum_by_variant(ctx: LlvmCtx, variant_name: Str, qualifier: Str?) -> EnumTypeInfo? {
    // If qualifier is present, use it as the enum name directly
    match qualifier {
        some(q) => {
            match ctx.enum_types.get(q) {
                some(ei) => { return some(ei) },
                none => {},
            }
        },
        none => {},
    }
    // Try variant name as enum name (for enum types where variant name = type name)
    match ctx.enum_types.get(variant_name) {
        some(ei) => { return some(ei) },
        none => {},
    }
    // Search all registered enums for this variant
    let mut sorted_enums = ctx.enum_types.entries()
    sorted_enums.sort_by(fn(a, b) { if a.0 < b.0 { -1 } else if a.0 > b.0 { 1 } else { 0 } })
    for entry in sorted_enums {
        let (ename, einfo) = entry
        match einfo.variants.get(variant_name) {
            some(_) => { return some(einfo) },
            none => {},
        }
    }
    none
}

// Helper: get LLVM struct type for a tuple of N elements (all ptr)
fn get_tuple_llvm_type(mut ctx: LlvmCtx, count: Int) -> LLVMTypeRef {
    let mut elem_types: List<LLVMTypeRef> = []
    for i in 0..count {
        elem_types.push(ctx.ptr_type)
    }
    LLVMStructTypeInContext(ctx.context, elem_types, 0)
}

// Element type at position `idx` of a tuple scrutinee type (for literal sub-pattern
// comparison). Falls back to ErrorType when not a tuple / out of range — harmless
// because gen_literal_pattern_cond dispatches on the LiteralValue, not this type.
fn tuple_element_type(ty: Type, idx: Int) -> Type {
    match ty {
        Type::TupleType { elements } => match elements.get(idx) {
            some(t) => t,
            none => Type::ErrorType,
        },
        _ => Type::ErrorType,
    }
}

fn gen_literal_pattern_cond(mut ctx: LlvmCtx, scrut_val: LLVMValueRef, scrut_ty: Type, value: LiteralValue) -> LLVMValueRef {
    match value {
        LiteralValue::IntVal(n) => {
            // B-080: inline untag
            let raw = unbox_int(ctx, scrut_val)
            let lit = LLVMConstInt(ctx.i64_type, n, 1)
            LLVMBuildICmp(ctx.builder, 32, raw, lit, fresh_name(ctx, "eq"))
        },
        LiteralValue::BoolVal(b) => {
            // B-080: inline untag
            let raw = unbox_int(ctx, scrut_val)
            let lit = if b { LLVMConstInt(ctx.i64_type, 1, 0) } else { LLVMConstInt(ctx.i64_type, 0, 0) }
            LLVMBuildICmp(ctx.builder, 32, raw, lit, fresh_name(ctx, "eq"))
        },
        LiteralValue::StrVal(s) => {
            let lit_str = gen_str_lit(ctx, s)
            let eq_fn = get_or_declare_runtime_fn(ctx, "ring_str_eq", [ctx.ptr_type, ctx.ptr_type], ctx.i64_type)
            let eq_ty = get_rt_fn_type(ctx, "ring_str_eq")
            let result = LLVMBuildCall2(ctx.builder, eq_ty, eq_fn, [scrut_val, lit_str], fresh_name(ctx, "seq"))
            LLVMBuildTrunc(ctx.builder, result, ctx.i1_type, fresh_name(ctx, "i1"))
        },
        LiteralValue::FloatVal(f) => {
            let unbox_fn = get_or_declare_runtime_fn(ctx, "ring_unbox_float", [ctx.ptr_type], ctx.double_type)
            let unbox_ty = get_rt_fn_type(ctx, "ring_unbox_float")
            let raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [scrut_val], fresh_name(ctx, "uf"))
            let lit = LLVMConstReal(ctx.double_type, f)
            LLVMBuildFCmp(ctx.builder, 1, raw, lit, fresh_name(ctx, "feq"))
        },
    }
}

// ============================================================
// Named variant construction (enum literal)
// ============================================================

fn gen_named_variant_construct(mut ctx: LlvmCtx, enum_name: Str, variant_name: Str, fields: List<HStructFieldInit>) -> LLVMValueRef {
    match ctx.enum_types.get(enum_name) {
        some(enum_info) => {
            match enum_info.variants.get(variant_name) {
                some(vi) => {
                    // Allocate enum struct via ring_alloc with typeid
                    let size = LLVMSizeOf(enum_info.llvm_type)
                    let alloc_fn = get_or_declare_runtime_fn(ctx, "ring_alloc", [ctx.i64_type, ctx.i64_type], ctx.ptr_type)
                    let alloc_ty = get_rt_fn_type(ctx, "ring_alloc")
                    let enum_tid_val = LLVMConstInt(ctx.i64_type, get_or_assign_typeid(ctx, enum_name), 0)
                    let enum_ptr = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [size, enum_tid_val], fresh_name(ctx, "ev"))

                    // Store tag (field 0)
                    let tag_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, enum_ptr, 0, fresh_name(ctx, "tag"))
                    discard(LLVMBuildStore(ctx.builder, LLVMConstInt(ctx.i64_type, vi.tag, 0), tag_ptr))

                    // Store fields by name lookup in variant's field list
                    for i in 0..fields.len() {
                        match fields.get(i) {
                            some(f) => {
                                let val = gen_llvm_expr(ctx, f.value)
                                let mut field_idx = i
                                for fi in 0..vi.field_names.len() {
                                    if vi.field_names[fi] == f.name {
                                        field_idx = fi
                                    }
                                }
                                let field_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, enum_ptr, field_idx + 1, fresh_name(ctx, "ef"))
                                discard(LLVMBuildStore(ctx.builder, val, field_ptr))
                            },
                            none => {},
                        }
                    }

                    enum_ptr
                },
                none => {
                    panic("LLVM codegen: variant '${variant_name}' not found in enum '${enum_name}'")
                },
            }
        },
        none => {
            // Try as constructor call (ring_EnumName_VariantName)
            let ctor_name = "ring_${enum_name}_${variant_name}"
            match ctx.functions.get(ctor_name) {
                some(fn_val) => {
                    let mut args: List<LLVMValueRef> = []
                    for f in fields {
                        args.push(gen_llvm_expr(ctx, f.value))
                    }
                    let fn_ty = match ctx.fn_types.get(ctor_name) {
                        some(t) => t,
                        none => panic("LLVM codegen: fn type not found for ${ctor_name}"),
                    }
                    LLVMBuildCall2(ctx.builder, fn_ty, fn_val, args, fresh_name(ctx, "vc"))
                },
                none => {
                    panic("LLVM codegen: enum '${enum_name}' not registered for variant construct")
                },
            }
        },
    }
}

// ============================================================
// List literal
// ============================================================

fn gen_list_lit(mut ctx: LlvmCtx, elements: List<HExpr>) -> LLVMValueRef {
    let new_fn = get_or_declare_runtime_fn(ctx, "ring_list_new", [], ctx.ptr_type)
    let new_ty = get_rt_fn_type(ctx, "ring_list_new")
    let list = LLVMBuildCall2(ctx.builder, new_ty, new_fn, [], fresh_name(ctx, "ls"))

    let push_fn = get_or_declare_runtime_fn(ctx, "ring_list_push", [ctx.ptr_type, ctx.ptr_type], ctx.ptr_type)
    let push_ty = get_rt_fn_type(ctx, "ring_list_push")

    for elem in elements {
        let val = gen_llvm_expr(ctx, elem)
        LLVMBuildCall2(ctx.builder, push_ty, push_fn, [list, val], fresh_name(ctx, "lp"))
    }

    list
}

// ============================================================
// Tuple literal (represented as List, same as JS backend)
// ============================================================

fn gen_tuple_lit(mut ctx: LlvmCtx, elements: List<HExpr>) -> LLVMValueRef {
    // Tuples are represented as Lists (same as JS backend)
    gen_list_lit(ctx, elements)
}

// ============================================================
// Index expression
// ============================================================

fn gen_index_expr(mut ctx: LlvmCtx, receiver: HExpr, index: HExpr, ty: Type) -> LLVMValueRef {
    let recv_val = gen_llvm_expr(ctx, receiver)
    let idx_val = gen_llvm_expr(ctx, index)
    let recv_type = hexpr_type(receiver)

    let type_name = match type_to_builtin_name(recv_type) {
        some(n) => n,
        none => "Unknown",
    }

    // B-080: inline untag index to i64

    // B-134: structural validation — only dispatch to builtin runtime for true
    // builtin List/Map (not user structs that share the name).
    if type_name == "List" && is_builtin_collection(recv_type) {
        let raw_idx = unbox_int(ctx, idx_val)
        let get_fn = get_or_declare_runtime_fn(ctx, "ring_list_get", [ctx.ptr_type, ctx.i64_type], ctx.ptr_type)
        let get_ty = get_rt_fn_type(ctx, "ring_list_get")
        LLVMBuildCall2(ctx.builder, get_ty, get_fn, [recv_val, raw_idx], fresh_name(ctx, "lg"))
    } else {
        if type_name == "Str" {
            let raw_idx = unbox_int(ctx, idx_val)
            let get_fn = get_or_declare_runtime_fn(ctx, "ring_str_get", [ctx.ptr_type, ctx.i64_type], ctx.ptr_type)
            let get_ty = get_rt_fn_type(ctx, "ring_str_get")
            LLVMBuildCall2(ctx.builder, get_ty, get_fn, [recv_val, raw_idx], fresh_name(ctx, "sg"))
        } else {
            if type_name == "Map" && is_builtin_collection(recv_type) {
                // Map subscript — use int-keyed variant if applicable
                let map_get_name = if is_int_keyed_map(recv_type) { "ring_map_int_get" } else { "ring_map_get" }
                let get_fn = get_or_declare_runtime_fn(ctx, map_get_name, [ctx.ptr_type, ctx.ptr_type], ctx.ptr_type)
                let get_ty = get_rt_fn_type(ctx, map_get_name)
                LLVMBuildCall2(ctx.builder, get_ty, get_fn, [recv_val, idx_val], fresh_name(ctx, "mg"))
            } else {
                // Fallback: try list_get
                let raw_idx = unbox_int(ctx, idx_val)
                let get_fn = get_or_declare_runtime_fn(ctx, "ring_list_get", [ctx.ptr_type, ctx.i64_type], ctx.ptr_type)
                let get_ty = get_rt_fn_type(ctx, "ring_list_get")
                LLVMBuildCall2(ctx.builder, get_ty, get_fn, [recv_val, raw_idx], fresh_name(ctx, "ig"))
            }
        }
    }
}

// ============================================================
// Range expression
// ============================================================

fn gen_range_expr(mut ctx: LlvmCtx, start: HExpr, end: HExpr, inclusive: Bool) -> LLVMValueRef {
    // Range is represented as a struct { start: Int, end: Int, inclusive: Bool }
    // We'll use the same layout as a 3-element list [start, end, inclusive_flag]
    // But for LLVM it's simpler to use a struct with i64/i64/i64
    let range_ty = LLVMStructTypeInContext(ctx.context, [ctx.ptr_type, ctx.ptr_type, ctx.ptr_type], 0)
    let size = LLVMSizeOf(range_ty)
    let alloc_fn = get_or_declare_runtime_fn(ctx, "ring_alloc", [ctx.i64_type, ctx.i64_type], ctx.ptr_type)
    let alloc_ty = get_rt_fn_type(ctx, "ring_alloc")
    let range_typeid = LLVMConstInt(ctx.i64_type, 10, 0)  // RING_TYPEID_TUPLE (range is tuple-like)
    let range_ptr = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [size, range_typeid], fresh_name(ctx, "rng"))

    let start_val = gen_llvm_expr(ctx, start)
    let end_val = gen_llvm_expr(ctx, end)
    let incl_val = gen_bool_lit(ctx, inclusive)

    let start_ptr = LLVMBuildStructGEP2(ctx.builder, range_ty, range_ptr, 0, fresh_name(ctx, "rs"))
    discard(LLVMBuildStore(ctx.builder, start_val, start_ptr))
    let end_ptr = LLVMBuildStructGEP2(ctx.builder, range_ty, range_ptr, 1, fresh_name(ctx, "re"))
    discard(LLVMBuildStore(ctx.builder, end_val, end_ptr))
    let incl_ptr = LLVMBuildStructGEP2(ctx.builder, range_ty, range_ptr, 2, fresh_name(ctx, "ri"))
    discard(LLVMBuildStore(ctx.builder, incl_val, incl_ptr))

    range_ptr
}

// ============================================================
// Lambda (closure)
// ============================================================

// B-144: build the set of capture names whose HIR type is an extern handle.
// These must NOT be dup'd/drop'd — they're raw foreign pointers outside Ring RC.
// Walks the body expression collecting Ident types for names in the capture list.
fn collect_extern_capture_names(expr: HExpr, captures: List<Str>, externs: Set<Str>, mut out: Set<Str>) {
    match expr {
        HExpr::Ident { name, resolved_name, ty, .. } => {
            let lookup = match resolved_name { some(rn) => rn, none => name }
            let mut found = false
            for c in captures {
                if c == lookup || c == name { found = true }
            }
            if found && is_extern_handle_type(ty, externs) {
                out.insert(lookup)
            }
        },
        HExpr::BinOp { left, right, .. } => {
            collect_extern_capture_names(left, captures, externs, out)
            collect_extern_capture_names(right, captures, externs, out)
        },
        HExpr::UnaryOp { operand, .. } => {
            collect_extern_capture_names(operand, captures, externs, out)
        },
        HExpr::Call { callee, args, .. } => {
            collect_extern_capture_names(callee, captures, externs, out)
            for a in args { collect_extern_capture_names(a, captures, externs, out) }
        },
        HExpr::FieldAccess { receiver, .. } => {
            collect_extern_capture_names(receiver, captures, externs, out)
        },
        HExpr::Block { stmts, tail, .. } => {
            for s in stmts { collect_extern_capture_names_stmt(s, captures, externs, out) }
            match tail {
                some(t) => collect_extern_capture_names(t, captures, externs, out),
                none => {},
            }
        },
        HExpr::IfExpr { condition, then_branch, else_branch, .. } => {
            collect_extern_capture_names(condition, captures, externs, out)
            collect_extern_capture_names(then_branch, captures, externs, out)
            match else_branch {
                some(eb) => collect_extern_capture_names(eb, captures, externs, out),
                none => {},
            }
        },
        HExpr::MatchExpr { scrutinee, arms, .. } => {
            collect_extern_capture_names(scrutinee, captures, externs, out)
            for arm in arms { collect_extern_capture_names(arm.body, captures, externs, out) }
        },
        HExpr::StringInterp { parts, .. } => {
            for part in parts {
                match part {
                    HStringInterpPart::Expression(e) => collect_extern_capture_names(e, captures, externs, out),
                    _ => {},
                }
            }
        },
        HExpr::StructLit { fields, spread, .. } => {
            for f in fields { collect_extern_capture_names(f.value, captures, externs, out) }
            match spread {
                some(sp) => collect_extern_capture_names(sp, captures, externs, out),
                none => {},
            }
        },
        HExpr::ListLit { elements, .. } => {
            for e in elements { collect_extern_capture_names(e, captures, externs, out) }
        },
        HExpr::TupleLit { elements, .. } => {
            for e in elements { collect_extern_capture_names(e, captures, externs, out) }
        },
        HExpr::IndexExpr { receiver, index, .. } => {
            collect_extern_capture_names(receiver, captures, externs, out)
            collect_extern_capture_names(index, captures, externs, out)
        },
        HExpr::Lambda { body: lb, .. } => {
            collect_extern_capture_names(lb, captures, externs, out)
        },
        HExpr::NamedVariantConstruct { fields: nvc_fields, spread: nvc_spread, .. } => {
            for f in nvc_fields { collect_extern_capture_names(f.value, captures, externs, out) }
            match nvc_spread {
                some(sp) => collect_extern_capture_names(sp, captures, externs, out),
                none => {},
            }
        },
        HExpr::TryCatch { body: tc_body, arms: tc_arms, .. } => {
            collect_extern_capture_names(tc_body, captures, externs, out)
            for arm in tc_arms { collect_extern_capture_names(arm.body, captures, externs, out) }
        },
        HExpr::HandleExpr { body: he_body, .. } => {
            collect_extern_capture_names(he_body, captures, externs, out)
        },
        HExpr::EffectOp { args: eo_args, .. } => {
            for a in eo_args { collect_extern_capture_names(a, captures, externs, out) }
        },
        HExpr::RangeExpr { start: rs, end: re, .. } => {
            collect_extern_capture_names(rs, captures, externs, out)
            collect_extern_capture_names(re, captures, externs, out)
        },
        HExpr::Clone { inner, .. } => collect_extern_capture_names(inner, captures, externs, out),
        HExpr::ReturnExpr { value, .. } => match value {
            some(v) => collect_extern_capture_names(v, captures, externs, out),
            none => {},
        },
        _ => {},
    }
}

fn collect_extern_capture_names_stmt(stmt: HStmt, captures: List<Str>, externs: Set<Str>, mut out: Set<Str>) {
    match stmt {
        HStmt::Let { init, .. } => collect_extern_capture_names(init, captures, externs, out),
        HStmt::Var { init, .. } => collect_extern_capture_names(init, captures, externs, out),
        HStmt::Assign { target, value, .. } => {
            collect_extern_capture_names(target, captures, externs, out)
            collect_extern_capture_names(value, captures, externs, out)
        },
        HStmt::ExprStmt { expr, .. } => collect_extern_capture_names(expr, captures, externs, out),
        HStmt::Return { value, .. } => match value {
            some(v) => collect_extern_capture_names(v, captures, externs, out),
            none => {},
        },
        HStmt::While { condition, body, .. } => {
            collect_extern_capture_names(condition, captures, externs, out)
            collect_extern_capture_names(body, captures, externs, out)
        },
        HStmt::ForIn { iterable, body, .. } => {
            collect_extern_capture_names(iterable, captures, externs, out)
            collect_extern_capture_names(body, captures, externs, out)
        },
        HStmt::LetDestructure { init, .. } => {
            collect_extern_capture_names(init, captures, externs, out)
        },
        HStmt::IfLet { expr, then_block, else_block, .. } => {
            collect_extern_capture_names(expr, captures, externs, out)
            collect_extern_capture_names(then_block, captures, externs, out)
            match else_block {
                some(eb) => collect_extern_capture_names(eb, captures, externs, out),
                none => {},
            }
        },
        _ => {},
    }
}

fn gen_lambda(mut ctx: LlvmCtx, params: List<HParam>, return_type: Type, body: HExpr, ty: Type) -> LLVMValueRef {
    let current_fn = match ctx.current_fn {
        some(f) => f,
        none => panic("LLVM codegen: lambda outside function"),
    }

    // Generate a unique name for the lambda function
    let lambda_name = fresh_name(ctx, "ring_lambda_")
    ctx.lambda_counter = ctx.lambda_counter + 1

    // Collect captures: variables referenced in body that are not params and not global functions
    let mut captures: List<Str> = []
    collect_captures(ctx, body, params, captures)

    // B-144: identify captures whose HIR type is an extern handle — these must
    // NOT be dup'd at construction time (they are raw foreign pointers outside
    // Ring RC).  ring_drop on them is a no-op (B-099 foreign-pointer guard), so
    // drop_closure_env safely skips them at destruction time too.
    let mut extern_caps: Set<Str> = set_new()
    collect_extern_capture_names(body, captures, ctx.extern_types, extern_caps)

    // B-084: closure env layout is { i64 count, ptr cap0, ptr cap1, ... }.  The
    // leading count lets the runtime's generic drop_closure_env (typeid 15) iterate
    // and ring_drop every owned capture slot when the env dies, instead of the old
    // CLOSURE-typeid (7) reuse that only dropped slot[1] and leaked/mis-recursed the
    // rest.  Capture slots therefore live at GEP index i+1.
    let mut env_elem_types: List<LLVMTypeRef> = [ctx.i64_type]  // slot 0: capture count
    for c in captures {
        env_elem_types.push(ctx.ptr_type)
    }
    // Always at least { i64 count } even with no captures (closure pair needs an env).
    let env_ty = LLVMStructTypeInContext(ctx.context, env_elem_types, 0)

    // Create the lambda function: fn(env_ptr, param0, param1, ...) -> ptr
    let mut fn_param_types: List<LLVMTypeRef> = [ctx.ptr_type]  // env_ptr first
    for p in params {
        fn_param_types.push(ctx.ptr_type)
    }
    let fn_ty = LLVMFunctionType(ctx.ptr_type, fn_param_types, 0)
    let lambda_fn = LLVMAddFunction(ctx.module, lambda_name, fn_ty)

    // Save state (including insert block so we can restore after lambda body generation)
    let saved_fn = ctx.current_fn
    let saved_named = ctx.named_values
    let saved_bb = LLVMGetInsertBlock(ctx.builder)
    ctx.current_fn = some(lambda_fn)
    ctx.named_values = map_new()

    // Create entry block for lambda
    let entry = LLVMAppendBasicBlockInContext(ctx.context, lambda_fn, "entry")
    LLVMPositionBuilderAtEnd(ctx.builder, entry)

    // Bind env parameter (index 0)
    let env_ptr = LLVMGetParam(lambda_fn, 0)

    // Extract captures from env (slot i+1 — slot 0 is the i64 count, B-084)
    for i in 0..captures.len() {
        match captures.get(i) {
            some(cap_name) => {
                let cap_ptr = LLVMBuildStructGEP2(ctx.builder, env_ty, env_ptr, i + 1, fresh_name(ctx, "ce"))
                let cap_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, cap_ptr, fresh_name(ctx, cap_name))
                let alloca = build_entry_alloca(ctx, ctx.ptr_type, cap_name)
                discard(LLVMBuildStore(ctx.builder, cap_val, alloca))
                ctx.named_values.insert(cap_name, alloca)
            },
            none => {},
        }
    }

    // Bind regular params (starting at index 1)
    for i in 0..params.len() {
        match params.get(i) {
            some(p) => {
                let param_val = LLVMGetParam(lambda_fn, i + 1)
                let alloca = build_entry_alloca(ctx, ctx.ptr_type, p.name)
                discard(LLVMBuildStore(ctx.builder, param_val, alloca))
                ctx.named_values.insert(p.name, alloca)
            },
            none => {},
        }
    }

    // Generate body
    let body_val = gen_llvm_expr(ctx, body)
    discard(LLVMBuildRet(ctx.builder, body_val))

    // Restore state and position builder back at the calling function's block
    ctx.named_values = saved_named
    ctx.current_fn = saved_fn
    LLVMPositionBuilderAtEnd(ctx.builder, saved_bb)

    // At the call site: allocate env struct and store captures.
    // B-084: env uses its OWN typeid (RING_TYPEID_CLOSURE_ENV) so that when the
    // closure dies, drop_closure's ring_drop(env_ptr) dispatches to
    // drop_closure_env, which reads the leading count and ring_drops each owned
    // capture slot.  The closure PAIR below stays RING_TYPEID_CLOSURE (7).
    let env_size = LLVMSizeOf(env_ty)
    let alloc_fn = get_or_declare_runtime_fn(ctx, "ring_alloc", [ctx.i64_type, ctx.i64_type], ctx.ptr_type)
    let alloc_ty = get_rt_fn_type(ctx, "ring_alloc")
    let env_typeid = LLVMConstInt(ctx.i64_type, RING_TYPEID_CLOSURE_ENV, 0)
    let closure_typeid = LLVMConstInt(ctx.i64_type, 7, 0)  // RING_TYPEID_CLOSURE
    let env_alloc = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [env_size, env_typeid], fresh_name(ctx, "env"))

    // Store the capture count into slot 0 (B-084: drop_closure_env iterates it).
    let count_slot = LLVMBuildStructGEP2(ctx.builder, env_ty, env_alloc, 0, fresh_name(ctx, "cnt"))
    discard(LLVMBuildStore(ctx.builder, LLVMConstInt(ctx.i64_type, captures.len(), 0), count_slot))

    // Store each capture into env (slot i+1 — slot 0 is the count).
    // B-098: the borrow-inference model treats every closure capture as OWNED —
    // the env takes its OWN reference (ring_dup at construction), released by
    // drop_closure_env when the env dies.  This must happen HERE (construction
    // time, in the enclosing scope) and NOT inside the body: the enclosing scope
    // scope-end-drops the captured binding (e.g. `build()` returning the closure
    // drops its local `payload`), so without the construction dup the env would
    // hold a freed pointer.  rc balance: binding rc=1 → capture dup → 2 → env
    // drop → 1 → binding scope-end drop → 0.
    // B-144: extern handle captures skip dup — they are raw foreign pointers
    // outside Ring RC.  ring_drop on them is a no-op (B-099 guard), so
    // drop_closure_env harmlessly calls ring_drop on the stored value.
    for i in 0..captures.len() {
        match captures.get(i) {
            some(cap_name) => {
                // Load the captured variable from the current scope
                let cap_val = match ctx.named_values.get(cap_name) {
                    some(alloca) => LLVMBuildLoad2(ctx.builder, ctx.ptr_type, alloca, fresh_name(ctx, "cv")),
                    none => LLVMConstPointerNull(ctx.ptr_type),
                }
                // Own the capture: bump its refcount for the env's reference.
                // B-144: skip dup for extern handle captures (no RC header).
                if extern_caps.contains(cap_name) == false {
                    discard(gen_dup_value(ctx, cap_val))
                }
                let cap_ptr = LLVMBuildStructGEP2(ctx.builder, env_ty, env_alloc, i + 1, fresh_name(ctx, "ep"))
                discard(LLVMBuildStore(ctx.builder, cap_val, cap_ptr))
            },
            none => {},
        }
    }

    // Create closure pair: { fn_ptr, env_ptr }
    // RingClosure struct: { void* fn_ptr, void* env_ptr }
    let closure_ty = LLVMStructTypeInContext(ctx.context, [ctx.ptr_type, ctx.ptr_type], 0)
    let closure_size = LLVMSizeOf(closure_ty)
    let closure_ptr = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [closure_size, closure_typeid], fresh_name(ctx, "cls"))

    let fn_ptr_slot = LLVMBuildStructGEP2(ctx.builder, closure_ty, closure_ptr, 0, fresh_name(ctx, "fps"))
    discard(LLVMBuildStore(ctx.builder, lambda_fn, fn_ptr_slot))
    let env_ptr_slot = LLVMBuildStructGEP2(ctx.builder, closure_ty, closure_ptr, 1, fresh_name(ctx, "eps"))
    discard(LLVMBuildStore(ctx.builder, env_alloc, env_ptr_slot))

    closure_ptr
}

// Decide whether a bare variable name (no resolved_name) should be captured into
// the enclosing closure's env, and if so append it to `captures`. Factored out of
// collect_captures' Ident arm so the RC-stmt (Drop/Dup) path can reuse the exact
// same param/function/local classification — a Drop must capture the variable it
// names, otherwise the closure body cannot find it in named_values (B-084 #131).
fn consider_capture_name(ctx: LlvmCtx, name: Str, resolved_name: Str?, params: List<HParam>, mut captures: List<Str>) {
    let lookup_name = match resolved_name {
        some(rn) => rn,
        none => name,
    }
    // Check if it's a param
    let mut is_param = false
    for p in params {
        if p.name == lookup_name || p.name == name { is_param = true }
    }
    if is_param == false {
        // Check if it's a known function (not a capture)
        let mangled = llvm_resolve_fn(ctx, lookup_name)
        let is_fn = match ctx.functions.get(mangled) {
            some(_) => true,
            none => {
                let mangled2 = llvm_mangle_fn(name)
                match ctx.functions.get(mangled2) {
                    some(_) => true,
                    none => {
                        let mangled3 = llvm_resolve_fn(ctx, name)
                        match ctx.functions.get(mangled3) {
                            some(_) => true,
                            none => false,
                        }
                    },
                }
            },
        }
        if is_fn == false {
            // Check if it's a local variable (potential capture)
            let is_local = match ctx.named_values.get(lookup_name) {
                some(_) => true,
                none => match ctx.named_values.get(name) {
                    some(_) => true,
                    none => false,
                },
            }
            if is_local {
                // Add to captures if not already present
                let mut already = false
                for c in captures {
                    if c == lookup_name || c == name { already = true }
                }
                if already == false {
                    captures.push(lookup_name)
                }
            }
        }
    }
}

// #B-087 gap 3: capture the dict param a trait dispatch routes through, so a closure
// whose body does a generic ==/</method-call carries the dict in its env. Only the
// Dict variant names a param (Builtin/Direct resolve statically — no capture needed).
fn collect_dispatch_dict(ctx: LlvmCtx, dispatch: TraitDispatch?, params: List<HParam>, mut captures: List<Str>) {
    match dispatch {
        some(d) => match d {
            TraitDispatch::Dict { param } => consider_capture_name(ctx, param, none, params, captures),
            TraitDispatch::Direct { dict, extra_dicts } => {
                consider_capture_name(ctx, dict, none, params, captures)
                for ed in extra_dicts { collect_dictref_names(ctx, ed, params, captures) }
            },
            TraitDispatch::Builtin => {},
        },
        none => {},
    }
}

// #B-087 gap 3: capture the dict-param names a DictRef references (Simple → the name;
// Wrapped → the base dict plus its inner dicts, recursively).
fn collect_dictref_names(ctx: LlvmCtx, dr: DictRef, params: List<HParam>, mut captures: List<Str>) {
    match dr {
        DictRef::Simple(name) => consider_capture_name(ctx, name, none, params, captures),
        // B-104 D4: a module-level singleton — resolved globally, never captured.
        DictRef::Static(_) => {},
        DictRef::Wrapped { dict, inner_dicts, .. } => {
            consider_capture_name(ctx, dict, none, params, captures)
            for inner in inner_dicts { collect_dictref_names(ctx, inner, params, captures) }
        },
    }
}

// Collect variable names referenced in an expression that are not params or global functions
fn collect_captures(ctx: LlvmCtx, expr: HExpr, params: List<HParam>, mut captures: List<Str>) {
    match expr {
        HExpr::Ident { name, resolved_name, .. } => {
            consider_capture_name(ctx, name, resolved_name, params, captures)
        },
        HExpr::BinOp { left, right, eq_dispatch, ord_dispatch, .. } => {
            collect_captures(ctx, left, params, captures)
            collect_captures(ctx, right, params, captures)
            // #B-087 gap 3: a trait-dispatched ==/< inside a closure body resolves
            // through a dict param (TraitDispatch::Dict { param }). That param must be
            // captured into the closure env, else the lambda can't find it.
            collect_dispatch_dict(ctx, eq_dispatch, params, captures)
            collect_dispatch_dict(ctx, ord_dispatch, params, captures)
        },
        HExpr::UnaryOp { operand, .. } => {
            collect_captures(ctx, operand, params, captures)
        },
        HExpr::Call { callee, args, resolved_dicts, dict_dispatch, .. } => {
            collect_captures(ctx, callee, params, captures)
            for a in args { collect_captures(ctx, a, params, captures) }
            // #B-087 gap 3: a generic call inside a closure forwards dict params
            // (resolved_dicts) or dispatches through one (dict_dispatch); capture them.
            for d in resolved_dicts { collect_dictref_names(ctx, d, params, captures) }
            match dict_dispatch {
                some(dd) => consider_capture_name(ctx, dd.dict_param, none, params, captures),
                none => {},
            }
        },
        // B-104 D4: a dict construction inside a closure body references dict
        // params through its inner DictRefs — capture them (Static singletons
        // and block-local dict locals are filtered out by consider_capture_name
        // / the Static arm).
        HExpr::DictConstruct { inner, .. } => {
            for d in inner { collect_dictref_names(ctx, d, params, captures) }
        },
        HExpr::FieldAccess { receiver, .. } => {
            collect_captures(ctx, receiver, params, captures)
        },
        HExpr::Block { stmts, tail, .. } => {
            for s in stmts {
                collect_captures_stmt(ctx, s, params, captures)
            }
            match tail {
                some(t) => collect_captures(ctx, t, params, captures),
                none => {},
            }
        },
        HExpr::IfExpr { condition, then_branch, else_branch, .. } => {
            collect_captures(ctx, condition, params, captures)
            collect_captures(ctx, then_branch, params, captures)
            match else_branch {
                some(eb) => collect_captures(ctx, eb, params, captures),
                none => {},
            }
        },
        HExpr::MatchExpr { scrutinee, arms, .. } => {
            collect_captures(ctx, scrutinee, params, captures)
            for arm in arms { collect_captures(ctx, arm.body, params, captures) }
        },
        HExpr::StringInterp { parts, .. } => {
            for part in parts {
                match part {
                    HStringInterpPart::Expression(e) => collect_captures(ctx, e, params, captures),
                    _ => {},
                }
            }
        },
        HExpr::StructLit { fields, spread, .. } => {
            for f in fields { collect_captures(ctx, f.value, params, captures) }
            match spread {
                some(sp) => collect_captures(ctx, sp, params, captures),
                none => {},
            }
        },
        HExpr::ListLit { elements, .. } => {
            for e in elements { collect_captures(ctx, e, params, captures) }
        },
        HExpr::TupleLit { elements, .. } => {
            for e in elements { collect_captures(ctx, e, params, captures) }
        },
        HExpr::IndexExpr { receiver, index, .. } => {
            collect_captures(ctx, receiver, params, captures)
            collect_captures(ctx, index, params, captures)
        },
        HExpr::Lambda { body: lb, .. } => {
            collect_captures(ctx, lb, params, captures)
        },
        HExpr::NamedVariantConstruct { fields: nvc_fields, spread: nvc_spread, .. } => {
            for f in nvc_fields { collect_captures(ctx, f.value, params, captures) }
            match nvc_spread {
                some(sp) => collect_captures(ctx, sp, params, captures),
                none => {},
            }
        },
        HExpr::TryCatch { body: tc_body, arms: tc_arms, .. } => {
            collect_captures(ctx, tc_body, params, captures)
            for arm in tc_arms { collect_captures(ctx, arm.body, params, captures) }
        },
        HExpr::HandleExpr { body: he_body, .. } => {
            collect_captures(ctx, he_body, params, captures)
        },
        HExpr::EffectOp { effect_name: eo_eff, args: eo_args, .. } => {
            for a in eo_args { collect_captures(ctx, a, params, captures) }
            // B-090 (D3 natural nesting): a closure body that performs a non-fail
            // effect dispatches through that effect's evidence (gen_effect_op →
            // lookup_evidence(__ring_ev_<eff>)). That evidence param must be
            // captured into the closure env, else the lambda can't find it.
            // fail.raise routes through ring_raise (ambient setjmp), no evidence.
            if eo_eff != "fail" {
                consider_capture_name(ctx, evidence_param_name(eo_eff), none, params, captures)
            }
        },
        HExpr::RangeExpr { start: rs, end: re, .. } => {
            collect_captures(ctx, rs, params, captures)
            collect_captures(ctx, re, params, captures)
        },
        // B-098: a Clone-wrapped escape inside a closure body (e.g. the lambda
        // returns a captured outer local) still references its inner expression's
        // free variables — recurse so the capture is collected into the env.
        HExpr::Clone { inner, .. } => collect_captures(ctx, inner, params, captures),
        // B-113: return in expression position — recurse into the value to collect captures.
        HExpr::ReturnExpr { value, .. } => match value {
            some(v) => collect_captures(ctx, v, params, captures),
            none => {},
        },
        _ => {},
    }
}

fn collect_captures_stmt(ctx: LlvmCtx, stmt: HStmt, params: List<HParam>, mut captures: List<Str>) {
    match stmt {
        HStmt::Let { init, .. } => collect_captures(ctx, init, params, captures),
        HStmt::Var { init, .. } => collect_captures(ctx, init, params, captures),
        HStmt::Assign { target, value, .. } => {
            collect_captures(ctx, target, params, captures)
            collect_captures(ctx, value, params, captures)
        },
        HStmt::ExprStmt { expr, .. } => collect_captures(ctx, expr, params, captures),
        HStmt::Return { value, .. } => match value {
            some(v) => collect_captures(ctx, v, params, captures),
            none => {},
        },
        HStmt::While { condition, body, .. } => {
            collect_captures(ctx, condition, params, captures)
            collect_captures(ctx, body, params, captures)
        },
        HStmt::ForIn { iterable, body, .. } => {
            collect_captures(ctx, iterable, params, captures)
            collect_captures(ctx, body, params, captures)
        },
        HStmt::LetDestructure { init, .. } => {
            collect_captures(ctx, init, params, captures)
        },
        HStmt::IfLet { expr, then_block, else_block, .. } => {
            collect_captures(ctx, expr, params, captures)
            collect_captures(ctx, then_block, params, captures)
            match else_block {
                some(eb) => collect_captures(ctx, eb, params, captures),
                none => {},
            }
        },
        // B-084 #131: Perceus branch-balancing can place a Drop/Dup for an
        // outer-scope variable inside a branch that codegen lowers to a separate
        // closure (try/catch body+arms, handle body). The closure must capture
        // that variable so the RC op can load it from named_values; treat the
        // RC-stmt's target name as a use for capture purposes.
        HStmt::Drop { name, .. } => {
            consider_capture_name(ctx, name, none, params, captures)
        },
        HStmt::Dup { name, .. } => {
            consider_capture_name(ctx, name, none, params, captures)
        },
        _ => {},
    }
}

// ============================================================
// TryCatch — inline setjmp/longjmp (B-089 G-b)
// ============================================================

// Declare platform _setjmp with returns_twice attribute.
// Windows x64 ABI: _setjmp(jmp_buf*, frame_ptr*) -> i32.
// The second argument is the caller's frame pointer obtained via
// @llvm.frameaddress.p0(i32 0). Without it longjmp corrupts the stack
// (STATUS_BAD_STACK at self-compile scale).
fn get_or_declare_setjmp(mut ctx: LlvmCtx) -> (LLVMValueRef, LLVMTypeRef) {
    let name = "_setjmp"
    match ctx.rt_fns.get(name) {
        some(f) => {
            match ctx.rt_fn_types.get(name) {
                some(t) => (f, t),
                none => panic("LLVM codegen: _setjmp type not found"),
            }
        },
        none => {
            let fn_ty = LLVMFunctionType(ctx.i32_type, [ctx.ptr_type, ctx.ptr_type], 0)
            let fn_val = LLVMAddFunction(ctx.module, name, fn_ty)
            let rt_kind = LLVMGetEnumAttributeKindForName("returns_twice", 13)
            if rt_kind > 0 {
                let rt_attr = LLVMCreateEnumAttribute(ctx.context, rt_kind, 0)
                LLVMAddAttributeAtIndex(fn_val, 0 - 1, rt_attr)
            }
            ctx.rt_fns.insert(name, fn_val)
            ctx.rt_fn_types.insert(name, fn_ty)
            (fn_val, fn_ty)
        },
    }
}

// Declare @llvm.frameaddress.p0 intrinsic: (i32) -> ptr.
// Returns the frame pointer of the current function (level 0).
fn get_or_declare_frameaddress(mut ctx: LlvmCtx) -> (LLVMValueRef, LLVMTypeRef) {
    let name = "llvm.frameaddress.p0"
    match ctx.rt_fns.get(name) {
        some(f) => {
            match ctx.rt_fn_types.get(name) {
                some(t) => (f, t),
                none => panic("LLVM codegen: llvm.frameaddress.p0 type not found"),
            }
        },
        none => {
            let fn_ty = LLVMFunctionType(ctx.ptr_type, [ctx.i32_type], 0)
            let fn_val = LLVMAddFunction(ctx.module, name, fn_ty)
            ctx.rt_fns.insert(name, fn_val)
            ctx.rt_fn_types.insert(name, fn_ty)
            (fn_val, fn_ty)
        },
    }
}

fn gen_try_catch(mut ctx: LlvmCtx, body: HExpr, arms: List<HMatchArm>) -> LLVMValueRef {
    // Inline setjmp: body and catch arms execute in the current stack frame,
    // sharing all local allocas. This fixes the closure-capture-by-value bug
    // where `let mut` assignments inside the body were invisible to the outer
    // scope (closures copy the alloca value, not the alloca pointer).
    //
    // We call _setjmp DIRECTLY from the generated function (not via a C wrapper)
    // because setjmp's saved state includes the stack pointer — longjmp must
    // return into a frame that is still alive. A wrapper that returns before the
    // body runs leaves a dead frame → UB on longjmp.
    let current_fn = match ctx.current_fn {
        some(f) => f,
        none => panic("LLVM codegen: try-catch outside function"),
    }

    let sj = get_or_declare_setjmp(ctx)

    // ring_catch_push() -> frame ptr
    let push_fn = get_or_declare_runtime_fn(ctx, "ring_catch_push", [], ctx.ptr_type)
    let push_ty = get_rt_fn_type(ctx, "ring_catch_push")
    let frame = LLVMBuildCall2(ctx.builder, push_ty, push_fn, [], fresh_name(ctx, "frame"))

    // Get jmp_buf pointer from the catch frame
    let getbuf_fn = get_or_declare_runtime_fn(ctx, "ring_catch_get_buf", [ctx.ptr_type], ctx.ptr_type)
    let getbuf_ty = get_rt_fn_type(ctx, "ring_catch_get_buf")
    let buf_ptr = LLVMBuildCall2(ctx.builder, getbuf_ty, getbuf_fn, [frame], fresh_name(ctx, "buf"))

    // Call _setjmp directly from THIS function's frame (returns_twice)
    // Windows x64: pass frame pointer as second argument
    let fa = get_or_declare_frameaddress(ctx)
    let fp = LLVMBuildCall2(ctx.builder, fa.1, fa.0, [LLVMConstInt(ctx.i32_type, 0, 0)], fresh_name(ctx, "fp"))
    let sjresult = LLVMBuildCall2(ctx.builder, sj.1, sj.0, [buf_ptr, fp], fresh_name(ctx, "sj"))

    // cond = (sjresult == 0)
    let zero = LLVMConstInt(ctx.i32_type, 0, 0)
    let cond = LLVMBuildICmp(ctx.builder, 32, sjresult, zero, fresh_name(ctx, "sjcmp"))

    let normal_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "try.normal")
    let catch_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "try.catch")
    let merge_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "try.merge")

    discard(LLVMBuildCondBr(ctx.builder, cond, normal_bb, catch_bb))

    // --- normal path: execute body inline, then pop frame ---
    LLVMPositionBuilderAtEnd(ctx.builder, normal_bb)
    let body_val = gen_llvm_expr(ctx, body)
    let pop_fn = get_or_declare_runtime_fn(ctx, "ring_catch_pop", [], ctx.void_type)
    let pop_ty = get_rt_fn_type(ctx, "ring_catch_pop")
    discard(LLVMBuildCall2(ctx.builder, pop_ty, pop_fn, [], ""))
    let normal_end_bb = LLVMGetInsertBlock(ctx.builder)
    discard(LLVMBuildBr(ctx.builder, merge_bb))

    // --- catch path: get error, pop frame, run catch arms inline ---
    LLVMPositionBuilderAtEnd(ctx.builder, catch_bb)
    let get_err_fn = get_or_declare_runtime_fn(ctx, "ring_catch_get_error", [ctx.ptr_type], ctx.ptr_type)
    let get_err_ty = get_rt_fn_type(ctx, "ring_catch_get_error")
    let error_val = LLVMBuildCall2(ctx.builder, get_err_ty, get_err_fn, [frame], fresh_name(ctx, "err"))
    discard(LLVMBuildCall2(ctx.builder, pop_ty, pop_fn, [], ""))
    let catch_val = gen_catch_arms(ctx, error_val, arms)
    let catch_end_bb = LLVMGetInsertBlock(ctx.builder)
    discard(LLVMBuildBr(ctx.builder, merge_bb))

    // --- merge: phi ---
    LLVMPositionBuilderAtEnd(ctx.builder, merge_bb)
    let phi = LLVMBuildPhi(ctx.builder, ctx.ptr_type, fresh_name(ctx, "tryv"))
    LLVMAddIncoming(phi, [body_val, catch_val], [normal_end_bb, catch_end_bb])
    phi
}

fn gen_catch_arms(mut ctx: LlvmCtx, error_val: LLVMValueRef, arms: List<HMatchArm>) -> LLVMValueRef {
    if arms.len() == 0 {
        return LLVMConstPointerNull(ctx.ptr_type)
    }

    // Check if we need enum tag-based dispatch: multiple arms with Constructor
    // or NamedConstructor patterns require a switch, just like gen_match_expr.
    // Single arm or catch-all (Binding/Wildcard) uses the simple path.
    let mut has_constructor = false
    let mut constructor_count = 0
    for arm in arms {
        match arm.pattern {
            Pattern::Constructor { .. } => { has_constructor = true; constructor_count = constructor_count + 1 },
            Pattern::NamedConstructor { .. } => { has_constructor = true; constructor_count = constructor_count + 1 },
            _ => {},
        }
    }

    // Simple path: single arm or no constructors — bind and execute directly
    if !has_constructor || (arms.len() == 1) {
        let arm = arms[0]
        match arm.pattern {
            Pattern::Binding { name, .. } => {
                let alloca = build_entry_alloca(ctx, ctx.ptr_type, name)
                discard(LLVMBuildStore(ctx.builder, error_val, alloca))
                ctx.named_values.insert(name, alloca)
                return gen_llvm_expr(ctx, arm.body)
            },
            Pattern::Wildcard { .. } => {
                return gen_llvm_expr(ctx, arm.body)
            },
            Pattern::Constructor { name, fields, .. } => {
                bind_nested_pattern(ctx, error_val, arm.pattern)
                return gen_llvm_expr(ctx, arm.body)
            },
            Pattern::NamedConstructor { name, fields, .. } => {
                bind_nested_pattern(ctx, error_val, arm.pattern)
                return gen_llvm_expr(ctx, arm.body)
            },
            _ => {
                return gen_llvm_expr(ctx, arm.body)
            },
        }
    }

    // Multi-arm enum dispatch path: find the enum type from the first constructor arm
    let mut enum_info_opt: EnumTypeInfo? = none
    for arm in arms {
        match arm.pattern {
            Pattern::Constructor { name, qualifier, .. } => {
                enum_info_opt = find_enum_by_variant(ctx, name, qualifier)
            },
            Pattern::NamedConstructor { name, qualifier, .. } => {
                enum_info_opt = find_enum_by_variant(ctx, name, qualifier)
            },
            _ => {},
        }
        match enum_info_opt {
            some(_) => { break },
            none => {},
        }
    }

    match enum_info_opt {
        none => {
            // Fallback: if we can't find enum info, execute the first arm
            bind_nested_pattern(ctx, error_val, arms[0].pattern)
            return gen_llvm_expr(ctx, arms[0].body)
        },
        _ => {},
    }
    let enum_info = match enum_info_opt {
        some(ei) => ei,
        none => panic("LLVM codegen: catch enum_info unreachable"),
    }

    let current_fn = match ctx.current_fn {
        some(f) => f,
        none => panic("LLVM codegen: catch arms outside function"),
    }

    // Extract tag from error value: GEP to field 0 (i64), load
    let tag_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, error_val, 0, fresh_name(ctx, "ct_tp"))
    let tag_val = LLVMBuildLoad2(ctx.builder, ctx.i64_type, tag_ptr, fresh_name(ctx, "ct_tag"))

    let catch_merge_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "catch.merge")
    let catch_default_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "catch.default")

    let switch_val = LLVMBuildSwitch(ctx.builder, tag_val, catch_default_bb, arms.len())

    let mut phi_vals: List<LLVMValueRef> = []
    let mut phi_bbs: List<LLVMBasicBlockRef> = []
    let mut has_wildcard = false

    for arm in arms {
        match arm.pattern {
            Pattern::Wildcard { .. } => {
                has_wildcard = true
                // Emit wildcard body in the default block
                LLVMPositionBuilderAtEnd(ctx.builder, catch_default_bb)
                let body_val = gen_llvm_expr(ctx, arm.body)
                let end_bb = LLVMGetInsertBlock(ctx.builder)
                discard(LLVMBuildBr(ctx.builder, catch_merge_bb))
                phi_vals.push(body_val)
                phi_bbs.push(end_bb)
            },
            Pattern::Binding { name, .. } => {
                has_wildcard = true
                // Emit binding body in the default block
                LLVMPositionBuilderAtEnd(ctx.builder, catch_default_bb)
                let alloca = build_entry_alloca(ctx, ctx.ptr_type, name)
                discard(LLVMBuildStore(ctx.builder, error_val, alloca))
                ctx.named_values.insert(name, alloca)
                let body_val = gen_llvm_expr(ctx, arm.body)
                let end_bb = LLVMGetInsertBlock(ctx.builder)
                discard(LLVMBuildBr(ctx.builder, catch_merge_bb))
                phi_vals.push(body_val)
                phi_bbs.push(end_bb)
            },
            Pattern::Constructor { name, fields, .. } => {
                match enum_info.variants.get(name) {
                    some(vi) => {
                        let arm_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "catch.arm.${name}")
                        LLVMAddCase(switch_val, LLVMConstInt(ctx.i64_type, vi.tag, 0), arm_bb)

                        LLVMPositionBuilderAtEnd(ctx.builder, arm_bb)
                        // Bind positional fields at GEP index 1, 2, ... (index 0 is tag)
                        for i in 0..fields.len() {
                            match fields.get(i) {
                                some(field_pat) => {
                                    match field_pat {
                                        Pattern::Binding { name: bname, .. } => {
                                            let field_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, error_val, i + 1, fresh_name(ctx, "cf"))
                                            let field_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, fresh_name(ctx, bname))
                                            let alloca = build_entry_alloca(ctx, ctx.ptr_type, bname)
                                            discard(LLVMBuildStore(ctx.builder, field_val, alloca))
                                            ctx.named_values.insert(bname, alloca)
                                        },
                                        Pattern::Wildcard { .. } => {},
                                        _ => {
                                            let field_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, error_val, i + 1, fresh_name(ctx, "cf"))
                                            let field_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, fresh_name(ctx, "fv"))
                                            bind_nested_pattern(ctx, field_val, field_pat)
                                        },
                                    }
                                },
                                none => {},
                            }
                        }

                        let body_val = gen_llvm_expr(ctx, arm.body)
                        let arm_end_bb = LLVMGetInsertBlock(ctx.builder)
                        discard(LLVMBuildBr(ctx.builder, catch_merge_bb))
                        phi_vals.push(body_val)
                        phi_bbs.push(arm_end_bb)
                    },
                    none => {},
                }
            },
            Pattern::NamedConstructor { name, fields: named_fields, .. } => {
                match enum_info.variants.get(name) {
                    some(vi) => {
                        let arm_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "catch.arm.${name}")
                        LLVMAddCase(switch_val, LLVMConstInt(ctx.i64_type, vi.tag, 0), arm_bb)

                        LLVMPositionBuilderAtEnd(ctx.builder, arm_bb)
                        // Bind named fields by looking up position in variant's field list
                        for i in 0..named_fields.len() {
                            match named_fields.get(i) {
                                some(nf) => {
                                    let mut field_idx = i
                                    for fi in 0..vi.field_names.len() {
                                        if vi.field_names[fi] == nf.name {
                                            field_idx = fi
                                        }
                                    }
                                    match nf.pattern {
                                        Pattern::Binding { name: bname, .. } => {
                                            let field_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, error_val, field_idx + 1, fresh_name(ctx, "cf"))
                                            let field_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, fresh_name(ctx, bname))
                                            let alloca = build_entry_alloca(ctx, ctx.ptr_type, bname)
                                            discard(LLVMBuildStore(ctx.builder, field_val, alloca))
                                            ctx.named_values.insert(bname, alloca)
                                        },
                                        Pattern::Wildcard { .. } => {},
                                        _ => {
                                            let field_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, error_val, field_idx + 1, fresh_name(ctx, "cf"))
                                            let field_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, fresh_name(ctx, "fv"))
                                            bind_nested_pattern(ctx, field_val, nf.pattern)
                                        },
                                    }
                                },
                                none => {},
                            }
                        }

                        let body_val = gen_llvm_expr(ctx, arm.body)
                        let arm_end_bb = LLVMGetInsertBlock(ctx.builder)
                        discard(LLVMBuildBr(ctx.builder, catch_merge_bb))
                        phi_vals.push(body_val)
                        phi_bbs.push(arm_end_bb)
                    },
                    none => {},
                }
            },
            _ => {},
        }
    }

    // If no wildcard arm, default block is unreachable (exhaustive catch)
    if !has_wildcard {
        LLVMPositionBuilderAtEnd(ctx.builder, catch_default_bb)
        discard(LLVMBuildUnreachable(ctx.builder))
    }

    // Merge: phi all arm results
    LLVMPositionBuilderAtEnd(ctx.builder, catch_merge_bb)
    if phi_vals.len() > 0 {
        let phi = LLVMBuildPhi(ctx.builder, ctx.ptr_type, fresh_name(ctx, "cv"))
        LLVMAddIncoming(phi, phi_vals, phi_bbs)
        phi
    } else {
        LLVMConstPointerNull(ctx.ptr_type)
    }
}

// ============================================================
// B-097: build default evidence structs for effects with all-default ops
// ============================================================

// Build default evidence structs for every effect whose ops all have default
// bodies. Called from emit_c_main's entry block (we need a function context for
// gen_lambda). Each struct mirrors build_handler_evidence layout (N-slot
// { ptr, ... }) with every slot populated by the default body's closure.
//
// Stores the resulting evidence pointer in ctx.default_evidence so that:
//   - lookup_evidence can fall back to it (no-handler case)
//   - emit_c_main can pass it to ring_main instead of null
pub fn build_default_evidence_all(mut ctx: LlvmCtx) {
    let mut effect_names: List<Str> = []
    for entry in ctx.effect_ops.entries() {
        let (ename, ops) = entry
        let mut all_have_defaults = true
        for op in ops {
            if !op.has_default { all_have_defaults = false }
        }
        if all_have_defaults && ops.len() > 0 {
            effect_names.push(ename)
        }
    }
    effect_names.sort()

    for ename in effect_names {
        match ctx.effect_ops.get(ename) {
            some(ops) => {
                let n_slots = ops.len()
                // B-096: evidence layout = { i64 count, ptr slot0, ... }.
                let mut slot_types: List<LLVMTypeRef> = [ctx.i64_type]  // field 0 = count
                for i in 0..n_slots { slot_types.push(ctx.ptr_type) }
                let ev_ty = LLVMStructTypeInContext(ctx.context, slot_types, 0)
                let ev_size = LLVMSizeOf(ev_ty)

                // B-096: typeid 21 (RING_TYPEID_EVIDENCE). Default evidence is
                // process-lifetime — never explicitly dropped (the initial RC = 1
                // from ring_alloc is never decremented). Closures that capture
                // this pointer dup/drop around the initial ref; it never reaches 0.
                let alloc_fn = get_or_declare_runtime_fn(ctx, "ring_alloc", [ctx.i64_type, ctx.i64_type], ctx.ptr_type)
                let alloc_ty = get_rt_fn_type(ctx, "ring_alloc")
                let ev_typeid = LLVMConstInt(ctx.i64_type, 21, 0)  // RING_TYPEID_EVIDENCE
                let ev_ptr = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [ev_size, ev_typeid], fresh_name(ctx, "defev"))

                // Store count in field 0.
                let count_ptr = LLVMBuildStructGEP2(ctx.builder, ev_ty, ev_ptr, 0, fresh_name(ctx, "defevcnt"))
                discard(LLVMBuildStore(ctx.builder, LLVMConstInt(ctx.i64_type, n_slots, 0), count_ptr))

                // Store in default_evidence BEFORE generating closures so that
                // sibling op calls (e.g. increment's default body calling
                // Counter.get()) can find the evidence via lookup_evidence's
                // fallback. The struct is heap-allocated; slots are filled
                // below before any runtime call can happen.
                ctx.default_evidence.insert(ename, ev_ptr)

                // Also put an alloca in named_values so gen_lambda's
                // collect_captures can find and capture the evidence pointer.
                // This is needed for default bodies that call sibling ops —
                // the closure must capture the evidence ptr in its env.
                let ev_name = evidence_param_name(ename)
                let ev_alloca = build_entry_alloca(ctx, ctx.ptr_type, ev_name)
                discard(LLVMBuildStore(ctx.builder, ev_ptr, ev_alloca))
                ctx.named_values.insert(ev_name, ev_alloca)

                // Initialize each slot with the default body's closure.
                // Slots start at field index 1 (field 0 = count).
                for op in ops {
                    let slot_idx = effect_op_slot(ctx.effect_ops, ename, op.name)
                    let idx = if slot_idx >= 0 { slot_idx } else { 0 }
                    match op.default_body {
                        some(dbody) => {
                            let arm_ret_ty = op.return_type
                            let arm_closure = gen_lambda(ctx, op.params, arm_ret_ty, dbody, arm_ret_ty)
                            let slot = LLVMBuildStructGEP2(ctx.builder, ev_ty, ev_ptr, idx + 1, fresh_name(ctx, "defevs"))
                            discard(LLVMBuildStore(ctx.builder, arm_closure, slot))
                        },
                        none => {
                            // Should not happen (all_have_defaults), but defensively null-fill
                            let slot = LLVMBuildStructGEP2(ctx.builder, ev_ty, ev_ptr, idx + 1, fresh_name(ctx, "defevs"))
                            discard(LLVMBuildStore(ctx.builder, LLVMConstPointerNull(ctx.ptr_type), slot))
                        },
                    }
                }
            },
            none => {},
        }
    }
}

// ============================================================
// Handle expression — construct evidence structs
// ============================================================

fn gen_handle_expr(mut ctx: LlvmCtx, body: HExpr, handlers: List<HEffectHandler>) -> LLVMValueRef {
    // For each handler, create an evidence struct { fn_ptr }
    // Group handlers by effect name
    let mut by_effect: Map<Str, List<HEffectHandler>> = map_new()
    for h in handlers {
        match by_effect.get(h.effect_name) {
            some(existing) => existing.push(h),
            none => {
                by_effect.insert(h.effect_name, [h])
            },
        }
    }

    let mut has_fail_abort = false
    // B-096: track evidence allocas that need dropping (non-abort effects only).
    // We store the alloca LLVMValueRef directly rather than looking up by name
    // at drop time — nested handles for the same effect overwrite ctx.named_values,
    // so a name-based lookup would double-free the inner evidence instead of
    // dropping the outer.
    let mut ev_drop_allocas: List<LLVMValueRef> = []
    // Save outer evidence allocas so we can restore them after the handle scope
    // ends — otherwise code after the handle block (which may use the same effect
    // via default evidence) finds a stale alloca whose stored pointer was freed
    // by emit_evidence_drops (UAF crash — B-100 Fix 7).
    let mut saved_ev_entries: List<(Str, LLVMValueRef)> = []

    // For each effect, create an evidence object
    let mut sorted_by_effect = by_effect.entries()
    sorted_by_effect.sort_by(fn(a, b) { if a.0 < b.0 { -1 } else if a.0 > b.0 { 1 } else { 0 } })
    for entry in sorted_by_effect {
        let (effect_name, hs) = entry
        let ev_name = evidence_param_name(effect_name)

        // For fail.raise (abort handler), we need try-catch semantics
        let mut is_fail_abort = false
        for h in hs {
            if effect_name == "fail" && h.op_name == "raise" {
                has_fail_abort = true
                is_fail_abort = true
            }
        }

        // Save outer evidence alloca (if any) before overwriting, so we can
        // restore it after the handle scope — prevents UAF on default evidence.
        match ctx.named_values.get(ev_name) {
            some(outer_alloca) => saved_ev_entries.push((ev_name, outer_alloca)),
            none => {},
        }

        if is_fail_abort {
            // fail.raise routes through inline setjmp/ring_raise (longjmp), not
            // evidence — gen_effect_op never reads this slot. Keep the null
            // placeholder for ABI uniformity (callees still receive an evidence
            // ptr param for the effect).
            let alloca = build_entry_alloca(ctx, ctx.ptr_type, ev_name)
            discard(LLVMBuildStore(ctx.builder, LLVMConstPointerNull(ctx.ptr_type), alloca))
            ctx.named_values.insert(ev_name, alloca)
        } else {
            // B-090 (D1): build the real N-slot evidence struct. N = number of ops
            // declared on this effect (effect_op_slot). Slot k holds op k's
            // {fn_ptr, env} closure (mirrors JS oracle's `{op: closure}`).
            let ev_struct = build_handler_evidence(ctx, effect_name, hs)
            let alloca = build_entry_alloca(ctx, ctx.ptr_type, ev_name)
            discard(LLVMBuildStore(ctx.builder, ev_struct, alloca))
            ctx.named_values.insert(ev_name, alloca)
            ev_drop_allocas.push(alloca)
        }
    }

    if has_fail_abort {
        // Abort (fail.raise) handler: inline setjmp like gen_try_catch (B-089 G-b).
        // The catch path simply returns the error value (= the value passed to
        // fail.raise), no catch arms needed.
        let current_fn = match ctx.current_fn {
            some(f) => f,
            none => panic("LLVM codegen: handle expr outside function"),
        }

        let sj = get_or_declare_setjmp(ctx)

        let push_fn = get_or_declare_runtime_fn(ctx, "ring_catch_push", [], ctx.ptr_type)
        let push_ty = get_rt_fn_type(ctx, "ring_catch_push")
        let frame = LLVMBuildCall2(ctx.builder, push_ty, push_fn, [], fresh_name(ctx, "frame"))

        let getbuf_fn = get_or_declare_runtime_fn(ctx, "ring_catch_get_buf", [ctx.ptr_type], ctx.ptr_type)
        let getbuf_ty = get_rt_fn_type(ctx, "ring_catch_get_buf")
        let buf_ptr = LLVMBuildCall2(ctx.builder, getbuf_ty, getbuf_fn, [frame], fresh_name(ctx, "buf"))

        // Windows x64: pass frame pointer as second argument to _setjmp
        let fa = get_or_declare_frameaddress(ctx)
        let fp = LLVMBuildCall2(ctx.builder, fa.1, fa.0, [LLVMConstInt(ctx.i32_type, 0, 0)], fresh_name(ctx, "sj.fp"))
        let sjresult = LLVMBuildCall2(ctx.builder, sj.1, sj.0, [buf_ptr, fp], fresh_name(ctx, "sj"))

        let zero = LLVMConstInt(ctx.i32_type, 0, 0)
        let cond = LLVMBuildICmp(ctx.builder, 32, sjresult, zero, fresh_name(ctx, "sjcmp"))

        let normal_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "hdl.normal")
        let catch_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "hdl.catch")
        let merge_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "hdl.merge")

        discard(LLVMBuildCondBr(ctx.builder, cond, normal_bb, catch_bb))

        // --- normal path ---
        LLVMPositionBuilderAtEnd(ctx.builder, normal_bb)
        let body_val = gen_llvm_expr(ctx, body)
        let pop_fn = get_or_declare_runtime_fn(ctx, "ring_catch_pop", [], ctx.void_type)
        let pop_ty = get_rt_fn_type(ctx, "ring_catch_pop")
        discard(LLVMBuildCall2(ctx.builder, pop_ty, pop_fn, [], ""))
        // B-096: drop non-abort evidence structs on the normal path.
        emit_evidence_drops(ctx, ev_drop_allocas)
        let normal_end_bb = LLVMGetInsertBlock(ctx.builder)
        discard(LLVMBuildBr(ctx.builder, merge_bb))

        // --- catch path: error value IS the result ---
        LLVMPositionBuilderAtEnd(ctx.builder, catch_bb)
        let get_err_fn = get_or_declare_runtime_fn(ctx, "ring_catch_get_error", [ctx.ptr_type], ctx.ptr_type)
        let get_err_ty = get_rt_fn_type(ctx, "ring_catch_get_error")
        let error_val = LLVMBuildCall2(ctx.builder, get_err_ty, get_err_fn, [frame], fresh_name(ctx, "err"))
        discard(LLVMBuildCall2(ctx.builder, pop_ty, pop_fn, [], ""))
        // B-096: drop non-abort evidence structs on the catch path too.
        emit_evidence_drops(ctx, ev_drop_allocas)
        let catch_end_bb = LLVMGetInsertBlock(ctx.builder)
        discard(LLVMBuildBr(ctx.builder, merge_bb))

        // --- merge ---
        LLVMPositionBuilderAtEnd(ctx.builder, merge_bb)
        let phi = LLVMBuildPhi(ctx.builder, ctx.ptr_type, fresh_name(ctx, "hdlv"))
        LLVMAddIncoming(phi, [body_val, error_val], [normal_end_bb, catch_end_bb])
        // B-100 Fix 7: restore outer evidence allocas so post-handle code that
        // uses the same effect (e.g. via default evidence) doesn't hit a freed ptr.
        for saved in saved_ev_entries {
            let (sname, salloca) = saved
            ctx.named_values.insert(sname, salloca)
        }
        phi
    } else {
        // Non-abort handlers: just execute body with evidence set up
        let result = gen_llvm_expr(ctx, body)
        // B-096: drop evidence structs after the body completes.
        emit_evidence_drops(ctx, ev_drop_allocas)
        // B-100 Fix 7: restore outer evidence allocas so post-handle code that
        // uses the same effect (e.g. via default evidence) doesn't hit a freed ptr.
        for saved in saved_ev_entries {
            let (sname, salloca) = saved
            ctx.named_values.insert(sname, salloca)
        }
        result
    }
}

// B-096: emit ring_drop for each non-abort evidence struct at handle scope end.
// Takes the actual allocas (not names) to avoid double-free when nested handles
// for the same effect overwrite ctx.named_values.
fn emit_evidence_drops(mut ctx: LlvmCtx, ev_allocas: List<LLVMValueRef>) {
    if ev_allocas.len() > 0 {
        let drop_fn = get_or_declare_runtime_fn(ctx, "ring_drop", [ctx.ptr_type], ctx.void_type)
        let drop_ty = get_rt_fn_type(ctx, "ring_drop")
        for alloca in ev_allocas {
            let ev_ptr = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, alloca, fresh_name(ctx, "ev_drop"))
            discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [ev_ptr], ""))
        }
    }
}

// B-090 (D1): construct the evidence struct for one handled effect.
//
// B-096 layout: { i64 count, ptr slot0, ptr slot1, ... }
//   count = N = #ops declared on the effect
//   field 0 = count; field k+1 = closure for op k
//
// Slot k = the {fn_ptr, env} closure for op k (op order = declaration order,
// via effect_op_slot). Each handler arm becomes a closure built by gen_lambda
// (params = arm params, body = arm body), so it captures the surrounding scope
// exactly like the JS oracle's `(params) => (body)`. Tail-resumptive: the arm's
// return value IS the resume value, so gen_effect_op returns the closure call
// result directly.
//
// Unhandled ops (no arm in `hs`) keep a null slot — out of scope for B-090
// (default-body injection #72 is B-097). Well-typed in-scope code only performs
// handled ops, so the null slot is never GEP'd/loaded for those programs.
//
// B-096: typeid 21 (RING_TYPEID_EVIDENCE). drop_evidence reads the leading
// count and ring_drop's each non-null closure slot. Handler evidence is dropped
// at handle scope end (emit_evidence_drops). Default evidence (B-097) is
// process-lifetime, never explicitly dropped.
fn build_handler_evidence(mut ctx: LlvmCtx, effect_name: Str, hs: List<HEffectHandler>) -> LLVMValueRef {
    // Slot count = number of ops declared on the effect. Fall back to the
    // handler count only if the effect is unregistered (shouldn't happen for
    // checked code), so the struct is always large enough for every handled op.
    let n_slots = match ctx.effect_ops.get(effect_name) {
        some(ops) => ops.len(),
        none => hs.len(),
    }

    // B-096: evidence layout = { i64 count, ptr slot0, ptr slot1, ... }.
    // Leading count enables drop_evidence (runtime) to iterate and drop each
    // closure slot.  All GEP indices are +1 vs the old layout (field 0 = count).
    let mut slot_types: List<LLVMTypeRef> = [ctx.i64_type]  // field 0 = count
    for i in 0..n_slots { slot_types.push(ctx.ptr_type) }
    let ev_ty = LLVMStructTypeInContext(ctx.context, slot_types, 0)
    let ev_size = LLVMSizeOf(ev_ty)

    // B-096: typeid 21 (RING_TYPEID_EVIDENCE). drop_evidence reads the leading
    // count and ring_drop's each non-null closure slot.
    let alloc_fn = get_or_declare_runtime_fn(ctx, "ring_alloc", [ctx.i64_type, ctx.i64_type], ctx.ptr_type)
    let alloc_ty = get_rt_fn_type(ctx, "ring_alloc")
    let ev_typeid = LLVMConstInt(ctx.i64_type, 21, 0)  // RING_TYPEID_EVIDENCE
    let ev_ptr = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [ev_size, ev_typeid], fresh_name(ctx, "ev_st"))

    // Store count in field 0.
    let count_ptr = LLVMBuildStructGEP2(ctx.builder, ev_ty, ev_ptr, 0, fresh_name(ctx, "evcnt"))
    discard(LLVMBuildStore(ctx.builder, LLVMConstInt(ctx.i64_type, n_slots, 0), count_ptr))

    // Initialize every closure slot to null first (unhandled ops stay null).
    // Slots start at field index 1.
    for i in 0..n_slots {
        let slot = LLVMBuildStructGEP2(ctx.builder, ev_ty, ev_ptr, i + 1, fresh_name(ctx, "evs"))
        discard(LLVMBuildStore(ctx.builder, LLVMConstPointerNull(ctx.ptr_type), slot))
    }

    // Build a closure per handler arm and store it at its declared op slot.
    let mut handled_ops: Set<Str> = set_new()
    for h in hs {
        handled_ops.insert(h.op_name)
        let slot_idx = effect_op_slot(ctx.effect_ops, effect_name, h.op_name)
        // slot_idx == -1 only when the effect/op is unregistered (e.g. the
        // unregistered-effect fallback above used hs order). Map to the handler's
        // position within hs as a defensive fallback so codegen never GEPs OOB.
        let idx = if slot_idx >= 0 { slot_idx } else { 0 }
        // The arm body's return value is the resume value (tail-resumptive), so
        // the closure simply returns gen_expr(body). Lambda params = arm params.
        let arm_ret_ty = hexpr_type(h.body)
        let arm_closure = gen_lambda(ctx, h.params, arm_ret_ty, h.body, arm_ret_ty)
        let slot = LLVMBuildStructGEP2(ctx.builder, ev_ty, ev_ptr, idx + 1, fresh_name(ctx, "evset"))
        discard(LLVMBuildStore(ctx.builder, arm_closure, slot))
    }

    // B-097: merge default bodies for unhandled ops (mirrors JS gen_handle #72).
    // If the effect declares ops with default bodies that weren't explicitly
    // handled, inject their default body closures into the evidence struct.
    match ctx.effect_ops.get(effect_name) {
        some(all_ops) => {
            for op in all_ops {
                if op.has_default && !handled_ops.contains(op.name) {
                    match op.default_body {
                        some(dbody) => {
                            let didx = effect_op_slot(ctx.effect_ops, effect_name, op.name)
                            let slot_i = if didx >= 0 { didx } else { 0 }
                            let dret_ty = op.return_type
                            let dclosure = gen_lambda(ctx, op.params, dret_ty, dbody, dret_ty)
                            let dslot = LLVMBuildStructGEP2(ctx.builder, ev_ty, ev_ptr, slot_i + 1, fresh_name(ctx, "evdef"))
                            discard(LLVMBuildStore(ctx.builder, dclosure, dslot))
                        },
                        none => {},
                    }
                }
            }
        },
        none => {},
    }

    ev_ptr
}

// ============================================================
// Effect operation
// ============================================================

fn gen_effect_op(mut ctx: LlvmCtx, effect_name: Str, op_name: Str, args: List<HExpr>) -> LLVMValueRef {
    // For fail.raise: call ring_raise directly
    if effect_name == "fail" && op_name == "raise" {
        let mut arg_vals: List<LLVMValueRef> = []
        for a in args { arg_vals.push(gen_llvm_expr(ctx, a)) }
        let raise_fn = get_or_declare_runtime_fn(ctx, "ring_raise", [ctx.ptr_type], ctx.void_type)
        let raise_ty = get_rt_fn_type(ctx, "ring_raise")
        let error_val = if arg_vals.len() > 0 { arg_vals[0] } else { LLVMConstPointerNull(ctx.ptr_type) }
        LLVMBuildCall2(ctx.builder, raise_ty, raise_fn, [error_val], "")
        // After raise, code is unreachable (longjmp)
        discard(LLVMBuildUnreachable(ctx.builder))
        // But we need to return a value for type correctness
        // Create a dummy block for unreachable code after
        let current_fn_val = match ctx.current_fn {
            some(f) => f,
            none => panic("LLVM codegen: effect op outside function"),
        }
        let dummy_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn_val, "post.raise")
        LLVMPositionBuilderAtEnd(ctx.builder, dummy_bb)
        LLVMConstPointerNull(ctx.ptr_type)
    } else {
        // B-090 (D1): non-abort effect op — dispatch through the evidence struct.
        // B-096: evidence layout = { i64 count, ptr slot0, ptr slot1, ... }.
        // Slot effect_op_slot(effect, op) holds this op's {fn_ptr, env} closure.
        // GEP index = slot_idx + 1 (field 0 = count).
        let ev_name = evidence_param_name(effect_name)
        let mut arg_vals: List<LLVMValueRef> = []
        for a in args { arg_vals.push(gen_llvm_expr(ctx, a)) }

        // Evidence ptr: from the current handle's alloca or a forwarded fn param
        // (lookup_evidence handles both, falling back to null off-scope).
        let ev_val = lookup_evidence(ctx, ev_name)

        // Slot index = op's declaration order. The struct type used for the GEP
        // must have count + n_slots elements (same layout build_handler_evidence
        // allocated).
        let slot_idx = effect_op_slot(ctx.effect_ops, effect_name, op_name)
        let n_slots = match ctx.effect_ops.get(effect_name) {
            some(ops) => ops.len(),
            none => slot_idx + 1,
        }
        let idx = if slot_idx >= 0 { slot_idx } else { 0 }
        let mut slot_types: List<LLVMTypeRef> = [ctx.i64_type]  // field 0 = count
        for i in 0..n_slots { slot_types.push(ctx.ptr_type) }
        let ev_ty = LLVMStructTypeInContext(ctx.context, slot_types, 0)

        let slot_ptr = LLVMBuildStructGEP2(ctx.builder, ev_ty, ev_val, idx + 1, fresh_name(ctx, "evslot"))
        let closure_ptr = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, slot_ptr, fresh_name(ctx, "evcl"))
        gen_closure_call(ctx, closure_ptr, arg_vals)
    }
}
