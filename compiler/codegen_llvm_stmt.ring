use types::{Type}
use hir::{HExpr, HStmt, hexpr_type}
use codegen_llvm_ctx::{LlvmCtx, fresh_name}

// Re-declare LLVM types and functions to avoid ESM import issues
extern type LLVMTypeRef
extern type LLVMValueRef
extern type LLVMBasicBlockRef
extern type LLVMContextRef
extern type LLVMBuilderRef

extern fn LLVMBuildAlloca(builder: LLVMBuilderRef, ty: LLVMTypeRef, name: Str) -> LLVMValueRef
extern fn LLVMBuildLoad2(builder: LLVMBuilderRef, ty: LLVMTypeRef, ptr: LLVMValueRef, name: Str) -> LLVMValueRef
extern fn LLVMBuildStore(builder: LLVMBuilderRef, val: LLVMValueRef, ptr: LLVMValueRef) -> LLVMValueRef
extern fn LLVMBuildBr(builder: LLVMBuilderRef, dest: LLVMBasicBlockRef) -> LLVMValueRef
extern fn LLVMBuildRet(builder: LLVMBuilderRef, val: LLVMValueRef) -> LLVMValueRef
extern fn LLVMAppendBasicBlockInContext(ctx: LLVMContextRef, fn_val: LLVMValueRef, name: Str) -> LLVMBasicBlockRef
extern fn LLVMPositionBuilderAtEnd(builder: LLVMBuilderRef, bb: LLVMBasicBlockRef) -> Unit
extern fn LLVMGetInsertBlock(builder: LLVMBuilderRef) -> LLVMBasicBlockRef
extern fn LLVMBuildCondBr(builder: LLVMBuilderRef, cond: LLVMValueRef, then_bb: LLVMBasicBlockRef, else_bb: LLVMBasicBlockRef) -> LLVMValueRef
extern fn LLVMConstPointerNull(ty: LLVMTypeRef) -> LLVMValueRef
extern fn LLVMBuildStructGEP2(builder: LLVMBuilderRef, ty: LLVMTypeRef, ptr: LLVMValueRef, index: Int, name: Str) -> LLVMValueRef

// Forward declaration to break circular dependency with codegen_llvm_expr
extern fn gen_llvm_expr(mut ctx: LlvmCtx, expr: HExpr) -> LLVMValueRef
extern fn unbox_to_i1(mut ctx: LlvmCtx, val: LLVMValueRef) -> LLVMValueRef

// Discard an LLVMValueRef (to avoid type mismatch in Unit-returning match arms)
fn discard(v: LLVMValueRef) {
    // intentionally empty — just consume the value
}

// ============================================================
// Statement dispatch
// ============================================================

pub fn emit_llvm_stmt(mut ctx: LlvmCtx, stmt: HStmt) {
    match stmt {
        HStmt::Let { name, init, .. } => {
            let val = gen_llvm_expr(ctx, init)
            let alloca = LLVMBuildAlloca(ctx.builder, ctx.ptr_type, name)
            discard(LLVMBuildStore(ctx.builder, val, alloca))
            ctx.named_values.insert(name, alloca)
        },
        HStmt::Var { name, init, .. } => {
            let val = gen_llvm_expr(ctx, init)
            let alloca = LLVMBuildAlloca(ctx.builder, ctx.ptr_type, name)
            discard(LLVMBuildStore(ctx.builder, val, alloca))
            ctx.named_values.insert(name, alloca)
        },
        HStmt::Assign { target, value, .. } => {
            emit_assign(ctx, target, value)
        },
        HStmt::ExprStmt { expr, .. } => {
            discard(gen_llvm_expr(ctx, expr))
        },
        HStmt::Return { value, .. } => {
            emit_return(ctx, value)
        },
        HStmt::While { condition, body, .. } => {
            emit_while(ctx, condition, body)
        },
        HStmt::ForIn { .. } => {
            // Stub: not yet implemented, skip (functions using this won't work at runtime)
        },
        HStmt::Break { .. } => {
            // Stub: not yet implemented
        },
        HStmt::Continue { .. } => {
            // Stub: not yet implemented
        },
        HStmt::LetDestructure { .. } => {
            // Stub: not yet implemented
        },
        HStmt::IfLet { .. } => {
            // Stub: not yet implemented
        },
    }
}

fn emit_assign(mut ctx: LlvmCtx, target: HExpr, value: HExpr) {
    let val = gen_llvm_expr(ctx, value)
    match target {
        HExpr::Ident { name, resolved_name, .. } => {
            let lookup = match resolved_name {
                some(rn) => rn,
                none => name,
            }
            match ctx.named_values.get(lookup) {
                some(alloca) => {
                    discard(LLVMBuildStore(ctx.builder, val, alloca))
                },
                none => {
                    match ctx.named_values.get(name) {
                        some(alloca) => {
                            discard(LLVMBuildStore(ctx.builder, val, alloca))
                        },
                        none => panic("LLVM codegen: assign to undefined variable '${name}'"),
                    }
                },
            }
        },
        HExpr::FieldAccess { receiver, field, .. } => {
            let recv_val = gen_llvm_expr(ctx, receiver)
            let recv_type = hexpr_type(receiver)
            let type_name = match recv_type {
                Type::StructType { name, .. } => name,
                _ => panic("LLVM codegen: field assign on non-struct type"),
            }
            match ctx.struct_types.get(type_name) {
                some(info) => {
                    let mut field_idx = -1
                    for i in 0..info.field_names.len() {
                        if info.field_names[i] == field {
                            field_idx = i
                        }
                    }
                    if field_idx < 0 {
                        panic("LLVM codegen: field '${field}' not found in struct '${type_name}'")
                    }
                    let field_ptr = LLVMBuildStructGEP2(ctx.builder, info.llvm_type, recv_val, field_idx, fresh_name(ctx, "fp"))
                    discard(LLVMBuildStore(ctx.builder, val, field_ptr))
                },
                none => panic("LLVM codegen: struct type '${type_name}' not registered"),
            }
        },
        _ => panic("LLVM codegen: unsupported assignment target"),
    }
}

fn emit_return(mut ctx: LlvmCtx, value: HExpr?) {
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
}

fn emit_while(mut ctx: LlvmCtx, condition: HExpr, body: HExpr) {
    let current_fn = match ctx.current_fn {
        some(f) => f,
        none => panic("LLVM codegen: while outside function"),
    }
    let cond_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "while.cond")
    let body_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "while.body")
    let merge_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "while.merge")

    discard(LLVMBuildBr(ctx.builder, cond_bb))

    LLVMPositionBuilderAtEnd(ctx.builder, cond_bb)
    let cond_val = gen_llvm_expr(ctx, condition)
    let cond_i1 = unbox_to_i1(ctx, cond_val)
    discard(LLVMBuildCondBr(ctx.builder, cond_i1, body_bb, merge_bb))

    LLVMPositionBuilderAtEnd(ctx.builder, body_bb)
    discard(gen_llvm_expr(ctx, body))
    discard(LLVMBuildBr(ctx.builder, cond_bb))

    LLVMPositionBuilderAtEnd(ctx.builder, merge_bb)
}
