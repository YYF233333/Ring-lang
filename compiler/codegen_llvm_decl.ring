use types::{Type, EffectRow}
use ast::{TypeParam}
use hir::{HExpr, HStmt, HDecl, HParam, HStructField, HEnumVariant,
    HTraitMethod, TraitBound, HEffectOp,
    evidence_param_name, trait_dict_name, trait_bound_param_name,
    hexpr_type, hexpr_effects}
use codegen_llvm_ctx::{LlvmCtx, StructFieldInfo, EnumTypeInfo, EnumVariantInfo,
    fresh_name, get_or_declare_runtime_fn, get_rt_fn_type,
    llvm_mangle_fn, llvm_mangle_method}
use codegen_llvm_expr::{gen_llvm_expr}
use codegen_ctx::{extract_effect_names}

// Re-declare LLVM types and functions to avoid ESM cross-module import issues
extern type LLVMContextRef
extern type LLVMModuleRef
extern type LLVMBuilderRef
extern type LLVMTypeRef
extern type LLVMValueRef
extern type LLVMBasicBlockRef

extern fn LLVMConstInt(ty: LLVMTypeRef, val: Int, sign_extend: Int) -> LLVMValueRef
extern fn LLVMConstPointerNull(ty: LLVMTypeRef) -> LLVMValueRef
extern fn LLVMGetParam(fn_val: LLVMValueRef, index: Int) -> LLVMValueRef
extern fn LLVMAppendBasicBlockInContext(ctx: LLVMContextRef, fn_val: LLVMValueRef, name: Str) -> LLVMBasicBlockRef
extern fn LLVMPositionBuilderAtEnd(builder: LLVMBuilderRef, bb: LLVMBasicBlockRef) -> Unit
extern fn LLVMBuildAlloca(builder: LLVMBuilderRef, ty: LLVMTypeRef, name: Str) -> LLVMValueRef
extern fn LLVMBuildStore(builder: LLVMBuilderRef, val: LLVMValueRef, ptr: LLVMValueRef) -> LLVMValueRef
extern fn LLVMBuildRet(builder: LLVMBuilderRef, val: LLVMValueRef) -> LLVMValueRef
extern fn LLVMBuildCall2(builder: LLVMBuilderRef, fn_ty: LLVMTypeRef, fn_val: LLVMValueRef, args: List<LLVMValueRef>, name: Str) -> LLVMValueRef
extern fn LLVMFunctionType(ret: LLVMTypeRef, params: List<LLVMTypeRef>, is_var_arg: Int) -> LLVMTypeRef
extern fn LLVMAddFunction(m: LLVMModuleRef, name: Str, fn_ty: LLVMTypeRef) -> LLVMValueRef
extern fn LLVMStructTypeInContext(ctx: LLVMContextRef, elems: List<LLVMTypeRef>, packed: Int) -> LLVMTypeRef
extern fn LLVMSizeOf(ty: LLVMTypeRef) -> LLVMValueRef
extern fn LLVMBuildStructGEP2(builder: LLVMBuilderRef, ty: LLVMTypeRef, ptr: LLVMValueRef, index: Int, name: Str) -> LLVMValueRef

// ============================================================
// Top-level declaration dispatch
// ============================================================

pub fn emit_llvm_decl(mut ctx: LlvmCtx, decl: HDecl) {
    match decl {
        HDecl::Fn { name, params, effects, body, trait_bounds, .. } => {
            emit_fn_body(ctx, name, params, effects, body, trait_bounds, none)
        },
        HDecl::Struct { name, fields, .. } => {
            // Struct type already registered in forward_declare pass
            // Generate constructor function
            emit_struct_constructor(ctx, name, fields)
        },
        HDecl::Enum { name, variants, .. } => {
            // Enum type already registered in forward_declare pass
            // Generate variant constructors
            emit_enum_constructors(ctx, name, variants)
        },
        HDecl::Impl { target_type, trait_name, methods, .. } => {
            for method in methods {
                match method {
                    HDecl::Fn { name: mn, params: mp, effects: me, body: mb, trait_bounds: mtb, .. } => {
                        emit_fn_body(ctx, mn, mp, me, mb, mtb, some(target_type))
                    },
                    _ => {},
                }
            }
        },
        HDecl::Effect { .. } => {
            // Effect declarations don't generate code directly
        },
        HDecl::Test { .. } => {
            // Tests not compiled in LLVM mode
        },
        HDecl::Trait { .. } => {
            // Trait declarations don't generate code directly (dict handled elsewhere)
        },
        HDecl::ExternFn { .. } => {
            // Extern functions are already handled as runtime declarations
        },
        HDecl::ExternType { .. } => {},
        HDecl::TypeAlias { .. } => {},
        HDecl::Const { name, init, .. } => {
            // Generate const as a global initialized via a constructor
            // For now, skip — Wave 2a focuses on hello.ring
            // panic("LLVM codegen: unsupported Const declaration")
        },
        HDecl::ModBlock { decls: mod_decls, .. } => {
            for subdecl in mod_decls {
                emit_llvm_decl(ctx, subdecl)
            }
        },
        HDecl::Sig { .. } => {},
    }
}

// ============================================================
// Function body emission
// ============================================================

fn emit_fn_body(mut ctx: LlvmCtx, name: Str, params: List<HParam>, effects: EffectRow, body: HExpr, trait_bounds: List<TraitBound>, impl_type: Str?) {
    let mangled = match impl_type {
        some(t) => llvm_mangle_method(t, name),
        none => llvm_mangle_fn(name),
    }

    let fn_val = match ctx.functions.get(mangled) {
        some(f) => f,
        none => {
            panic("LLVM codegen: function '${mangled}' not forward-declared")
        },
    }

    // Save and set current function
    let saved_fn = ctx.current_fn
    ctx.current_fn = some(fn_val)

    // Save current named_values
    let saved_named = ctx.named_values
    ctx.named_values = map_new()

    // Create entry basic block
    let entry = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "entry")
    LLVMPositionBuilderAtEnd(ctx.builder, entry)

    // Map parameters to allocas
    let mut param_idx = 0
    for p in params {
        let alloca = LLVMBuildAlloca(ctx.builder, ctx.ptr_type, p.name)
        LLVMBuildStore(ctx.builder, LLVMGetParam(fn_val, param_idx), alloca)
        ctx.named_values.insert(p.name, alloca)
        param_idx = param_idx + 1
    }

    // Map trait bound dict params
    for b in trait_bounds {
        let dict_name = trait_bound_param_name(b.type_param, b.trait_name)
        let alloca = LLVMBuildAlloca(ctx.builder, ctx.ptr_type, dict_name)
        LLVMBuildStore(ctx.builder, LLVMGetParam(fn_val, param_idx), alloca)
        ctx.named_values.insert(dict_name, alloca)
        param_idx = param_idx + 1
    }

    // Map evidence params
    let effective_effects = match ctx.local_fn_effects.get(name) {
        some(eff) => eff,
        none => effects,
    }
    let ev_names = extract_effect_names(effective_effects)
    for en in ev_names {
        let ep_name = evidence_param_name(en)
        let alloca = LLVMBuildAlloca(ctx.builder, ctx.ptr_type, ep_name)
        LLVMBuildStore(ctx.builder, LLVMGetParam(fn_val, param_idx), alloca)
        ctx.named_values.insert(ep_name, alloca)
        param_idx = param_idx + 1
    }

    // Generate body
    let body_val = gen_llvm_expr(ctx, body)

    // Return the body value
    LLVMBuildRet(ctx.builder, body_val)

    // Restore state
    ctx.named_values = saved_named
    ctx.current_fn = saved_fn
}

// ============================================================
// Struct info registration + constructor generation
// ============================================================

pub fn register_struct_info(mut ctx: LlvmCtx, name: Str, fields: List<HStructField>) {
    let mut field_names: List<Str> = []
    let mut field_types: List<LLVMTypeRef> = []
    for f in fields {
        field_names.push(f.name)
        field_types.push(ctx.ptr_type)
    }
    let struct_ty = LLVMStructTypeInContext(ctx.context, field_types, 0)
    ctx.struct_types.insert(name, StructFieldInfo {
        field_names: field_names,
        llvm_type: struct_ty
    })
}

fn emit_struct_constructor(mut ctx: LlvmCtx, name: Str, fields: List<HStructField>) {
    // Constructor function: ring_<Name>(field1, field2, ...) -> ptr
    let ctor_name = llvm_mangle_fn(name)

    // Check if already declared (it should not be, constructors are separate)
    match ctx.functions.get(ctor_name) {
        some(_) => {
            // Already exists — this can happen if a fn has the same name as the struct
            return
        },
        none => {},
    }

    let mut param_types: List<LLVMTypeRef> = []
    for f in fields {
        param_types.push(ctx.ptr_type)
    }
    let fn_ty = LLVMFunctionType(ctx.ptr_type, param_types, 0)
    let fn_val = LLVMAddFunction(ctx.module, ctor_name, fn_ty)
    ctx.functions.insert(ctor_name, fn_val)
    ctx.fn_types.insert(ctor_name, fn_ty)

    // Generate body
    let saved_fn = ctx.current_fn
    ctx.current_fn = some(fn_val)
    let entry = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "entry")
    LLVMPositionBuilderAtEnd(ctx.builder, entry)

    let struct_info = match ctx.struct_types.get(name) {
        some(info) => info,
        none => panic("LLVM codegen: struct '${name}' not registered"),
    }

    // Allocate struct
    let size = LLVMSizeOf(struct_info.llvm_type)
    let malloc_fn = get_or_declare_runtime_fn(ctx, "malloc", [ctx.i64_type], ctx.ptr_type)
    let malloc_ty = get_rt_fn_type(ctx, "malloc")
    let struct_ptr = LLVMBuildCall2(ctx.builder, malloc_ty, malloc_fn, [size], "s")

    // Store each field
    for i in 0..fields.len() {
        let param_val = LLVMGetParam(fn_val, i)
        let field_ptr = LLVMBuildStructGEP2(ctx.builder, struct_info.llvm_type, struct_ptr, i, "fp")
        LLVMBuildStore(ctx.builder, param_val, field_ptr)
    }

    LLVMBuildRet(ctx.builder, struct_ptr)
    ctx.current_fn = saved_fn
}

// ============================================================
// Enum info registration + variant constructor generation
// ============================================================

pub fn register_enum_info(mut ctx: LlvmCtx, name: Str, variants: List<HEnumVariant>) {
    let mut max_fields = 0
    let mut variant_map: Map<Str, EnumVariantInfo> = map_new()
    let mut tag = 0

    for v in variants {
        let fc = v.fields.len()
        if fc > max_fields {
            max_fields = fc
        }
        variant_map.insert(v.name, EnumVariantInfo { tag: tag, field_count: fc })
        tag = tag + 1
    }

    // Enum type: { i64 tag, ptr field0, ptr field1, ... }
    let mut elem_types: List<LLVMTypeRef> = [ctx.i64_type]
    for i in 0..max_fields {
        elem_types.push(ctx.ptr_type)
    }
    let enum_ty = LLVMStructTypeInContext(ctx.context, elem_types, 0)

    ctx.enum_types.insert(name, EnumTypeInfo {
        variants: variant_map,
        max_fields: max_fields,
        llvm_type: enum_ty
    })
}

fn emit_enum_constructors(mut ctx: LlvmCtx, name: Str, variants: List<HEnumVariant>) {
    let enum_info = match ctx.enum_types.get(name) {
        some(info) => info,
        none => panic("LLVM codegen: enum '${name}' not registered"),
    }

    for v in variants {
        let ctor_name = "ring_${name}_${v.name}"
        let variant_info = match enum_info.variants.get(v.name) {
            some(vi) => vi,
            none => panic("LLVM codegen: variant '${v.name}' not found in enum '${name}'"),
        }

        // Reuse forward-declared function (declared in first pass)
        let fn_val = match ctx.functions.get(ctor_name) {
            some(fv) => fv,
            none => panic("LLVM codegen: enum ctor '${ctor_name}' not forward-declared"),
        }

        // Generate body
        let saved_fn = ctx.current_fn
        ctx.current_fn = some(fn_val)
        let entry = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "entry")
        LLVMPositionBuilderAtEnd(ctx.builder, entry)

        // Allocate enum struct
        let size = LLVMSizeOf(enum_info.llvm_type)
        let malloc_fn = get_or_declare_runtime_fn(ctx, "malloc", [ctx.i64_type], ctx.ptr_type)
        let malloc_ty = get_rt_fn_type(ctx, "malloc")
        let enum_ptr = LLVMBuildCall2(ctx.builder, malloc_ty, malloc_fn, [size], "e")

        // Store tag (field 0)
        let tag_val = LLVMConstInt(ctx.i64_type, variant_info.tag, 0)
        let tag_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, enum_ptr, 0, "tag")
        LLVMBuildStore(ctx.builder, tag_val, tag_ptr)

        // Store fields (starting at index 1)
        for i in 0..v.fields.len() {
            let param_val = LLVMGetParam(fn_val, i)
            let field_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, enum_ptr, i + 1, "ef")
            LLVMBuildStore(ctx.builder, param_val, field_ptr)
        }

        LLVMBuildRet(ctx.builder, enum_ptr)
        ctx.current_fn = saved_fn
    }
}
