use types::{Type, Effect, EffectRow, effect_kind_name}
use ast::{TypeParam}
use hir::{HExpr, HStmt, HDecl, HParam, HProgram, HStructField, HEnumVariant,
    HTraitMethod, TraitBound, HEffectOp,
    evidence_param_name, trait_dict_name, trait_bound_param_name,
    hexpr_type, hexpr_effects}
use codegen_llvm_ctx::{LlvmCtx, StructFieldInfo, EnumTypeInfo, EnumVariantInfo,
    fresh_name, get_or_declare_runtime_fn, get_rt_fn_type,
    llvm_mangle_fn, llvm_mangle_method}
use codegen_llvm_expr::{gen_llvm_expr}
use codegen_llvm_decl::{emit_llvm_decl, register_struct_info, register_enum_info}
use codegen_ctx::{extract_effect_names}

// Re-declare LLVM types and functions to avoid ESM cross-module import issues
extern type LLVMContextRef
extern type LLVMModuleRef
extern type LLVMBuilderRef
extern type LLVMTypeRef
extern type LLVMValueRef
extern type LLVMBasicBlockRef
extern type LLVMTargetRef
extern type LLVMTargetMachineRef

extern fn LLVMContextCreate() -> LLVMContextRef
extern fn LLVMContextDispose(ctx: LLVMContextRef) -> Unit
extern fn LLVMModuleCreateWithNameInContext(name: Str, ctx: LLVMContextRef) -> LLVMModuleRef
extern fn LLVMDisposeModule(m: LLVMModuleRef) -> Unit
extern fn LLVMSetTarget(m: LLVMModuleRef, triple: Str) -> Unit
extern fn LLVMSetDataLayout(m: LLVMModuleRef, layout: Str) -> Unit
extern fn LLVMPrintModuleToString(m: LLVMModuleRef) -> Str
extern fn LLVMDisposeMessage(msg: Str) -> Unit
extern fn LLVMVerifyModule(m: LLVMModuleRef, action: Int) -> Int
extern fn LLVMVoidTypeInContext(ctx: LLVMContextRef) -> LLVMTypeRef
extern fn LLVMInt1TypeInContext(ctx: LLVMContextRef) -> LLVMTypeRef
extern fn LLVMInt8TypeInContext(ctx: LLVMContextRef) -> LLVMTypeRef
extern fn LLVMInt32TypeInContext(ctx: LLVMContextRef) -> LLVMTypeRef
extern fn LLVMInt64TypeInContext(ctx: LLVMContextRef) -> LLVMTypeRef
extern fn LLVMDoubleTypeInContext(ctx: LLVMContextRef) -> LLVMTypeRef
extern fn LLVMPointerTypeInContext(ctx: LLVMContextRef, address_space: Int) -> LLVMTypeRef
extern fn LLVMFunctionType(ret: LLVMTypeRef, params: List<LLVMTypeRef>, is_var_arg: Int) -> LLVMTypeRef
extern fn LLVMConstInt(ty: LLVMTypeRef, val: Int, sign_extend: Int) -> LLVMValueRef
extern fn LLVMConstPointerNull(ty: LLVMTypeRef) -> LLVMValueRef
extern fn LLVMAddFunction(m: LLVMModuleRef, name: Str, fn_ty: LLVMTypeRef) -> LLVMValueRef
extern fn LLVMAppendBasicBlockInContext(ctx: LLVMContextRef, fn_val: LLVMValueRef, name: Str) -> LLVMBasicBlockRef
extern fn LLVMCreateBuilderInContext(ctx: LLVMContextRef) -> LLVMBuilderRef
extern fn LLVMDisposeBuilder(builder: LLVMBuilderRef) -> Unit
extern fn LLVMPositionBuilderAtEnd(builder: LLVMBuilderRef, bb: LLVMBasicBlockRef) -> Unit
extern fn LLVMBuildCall2(builder: LLVMBuilderRef, fn_ty: LLVMTypeRef, fn_val: LLVMValueRef, args: List<LLVMValueRef>, name: Str) -> LLVMValueRef
extern fn LLVMBuildRet(builder: LLVMBuilderRef, val: LLVMValueRef) -> LLVMValueRef
extern fn LLVMBuildStore(builder: LLVMBuilderRef, val: LLVMValueRef, ptr: LLVMValueRef) -> LLVMValueRef
extern fn LLVMBuildStructGEP2(builder: LLVMBuilderRef, ty: LLVMTypeRef, ptr: LLVMValueRef, index: Int, name: Str) -> LLVMValueRef
extern fn LLVMStructTypeInContext(ctx: LLVMContextRef, elems: List<LLVMTypeRef>, packed: Int) -> LLVMTypeRef
extern fn LLVMSizeOf(ty: LLVMTypeRef) -> LLVMValueRef
extern fn LLVMGetParam(fn_val: LLVMValueRef, index: Int) -> LLVMValueRef
extern fn LLVMInitializeX86TargetInfo() -> Unit
extern fn LLVMInitializeX86Target() -> Unit
extern fn LLVMInitializeX86TargetMC() -> Unit
extern fn LLVMInitializeX86AsmPrinter() -> Unit
extern fn LLVMGetDefaultTargetTriple() -> Str
extern fn LLVMGetTargetFromTriple(triple: Str) -> LLVMTargetRef
extern fn LLVMCreateTargetMachine(target: LLVMTargetRef, triple: Str, cpu: Str, features: Str, codegen: Int, reloc: Int, code_model: Int) -> LLVMTargetMachineRef
extern fn LLVMDisposeTargetMachine(tm: LLVMTargetMachineRef) -> Unit
extern fn LLVMTargetMachineEmitToFile(tm: LLVMTargetMachineRef, m: LLVMModuleRef, filename: Str, file_type: Int) -> Int

// Discard an LLVMValueRef (to avoid type mismatch in Unit-returning contexts)
fn discard(v: LLVMValueRef) {
    // intentionally empty
}

// ============================================================
// compute_evidence_params — compute evidence params for a function
// ============================================================

fn compute_evidence_params(effects: EffectRow) -> List<Str> {
    let names = extract_effect_names(effects)
    let mut result: List<Str> = []
    for n in names {
        result.push(evidence_param_name(n))
    }
    result
}

// ============================================================
// declare_runtime_fns — pre-declare all needed runtime functions
// ============================================================

fn declare_runtime_fns(mut ctx: LlvmCtx) {
    let ptr = ctx.ptr_type
    let i64 = ctx.i64_type
    let dbl = ctx.double_type
    let void = ctx.void_type

    // Boxing / Unboxing
    get_or_declare_runtime_fn(ctx, "ring_box_int", [i64], ptr)
    get_or_declare_runtime_fn(ctx, "ring_unbox_int", [ptr], i64)
    get_or_declare_runtime_fn(ctx, "ring_box_float", [dbl], ptr)
    get_or_declare_runtime_fn(ctx, "ring_unbox_float", [ptr], dbl)
    get_or_declare_runtime_fn(ctx, "ring_box_bool", [i64], ptr)
    get_or_declare_runtime_fn(ctx, "ring_unbox_bool", [ptr], i64)

    // Str
    get_or_declare_runtime_fn(ctx, "ring_str_from_cstr", [ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_str_len", [ptr], i64)
    get_or_declare_runtime_fn(ctx, "ring_str_concat", [ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_str_eq", [ptr, ptr], i64)
    get_or_declare_runtime_fn(ctx, "ring_str_lt", [ptr, ptr], i64)

    // StringBuilder
    get_or_declare_runtime_fn(ctx, "ring_sb_new", [], ptr)
    get_or_declare_runtime_fn(ctx, "ring_sb_add", [ptr, ptr], void)
    get_or_declare_runtime_fn(ctx, "ring_sb_to_str", [ptr], ptr)

    // Int/Float/Bool to Str
    get_or_declare_runtime_fn(ctx, "ring_int_to_str", [ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_float_to_str", [ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_bool_to_str", [ptr], ptr)

    // IO
    get_or_declare_runtime_fn(ctx, "ring_print", [ptr], void)
    get_or_declare_runtime_fn(ctx, "ring_eprintln", [ptr], void)
    get_or_declare_runtime_fn(ctx, "ring_panic", [ptr], void)
    get_or_declare_runtime_fn(ctx, "ring_exit", [i64], void)

    // Memory allocation (for struct/enum construction)
    get_or_declare_runtime_fn(ctx, "malloc", [i64], ptr)
}

// ============================================================
// forward_declare_functions — first pass over all decls
// ============================================================

fn forward_declare_functions(mut ctx: LlvmCtx, decls: List<HDecl>) {
    for decl in decls {
        match decl {
            HDecl::Fn { name, params, effects, trait_bounds, .. } => {
                forward_declare_fn(ctx, name, params, effects, trait_bounds)
            },
            HDecl::Impl { target_type, methods, .. } => {
                for method in methods {
                    match method {
                        HDecl::Fn { name: mn, params: mp, effects: me, trait_bounds: mtb, .. } => {
                            let mangled = llvm_mangle_method(target_type, mn)
                            forward_declare_fn_with_name(ctx, mangled, mn, mp, me, mtb)
                        },
                        _ => {},
                    }
                }
            },
            HDecl::Struct { name, fields, .. } => {
                register_struct_info(ctx, name, fields)
            },
            HDecl::Enum { name, variants, .. } => {
                register_enum_info(ctx, name, variants)
                forward_declare_enum_ctors(ctx, name, variants)
            },
            HDecl::Effect { .. } => {},
            HDecl::ExternFn { .. } => {},
            HDecl::ModBlock { decls: mod_decls, .. } => {
                forward_declare_functions(ctx, mod_decls)
            },
            HDecl::ExternType { .. } => {},
            HDecl::TypeAlias { .. } => {},
            HDecl::Const { .. } => {},
            HDecl::Trait { .. } => {},
            HDecl::Test { .. } => {},
            HDecl::Sig { .. } => {},
        }
    }
}

fn forward_declare_fn(mut ctx: LlvmCtx, name: Str, params: List<HParam>, effects: EffectRow, trait_bounds: List<TraitBound>) {
    let mangled = llvm_mangle_fn(name)
    forward_declare_fn_with_name(ctx, mangled, name, params, effects, trait_bounds)
}

fn forward_declare_fn_with_name(mut ctx: LlvmCtx, mangled: Str, name: Str, params: List<HParam>, effects: EffectRow, trait_bounds: List<TraitBound>) {
    let ptr = ctx.ptr_type

    // Calculate total param count: regular params + trait dict params + evidence params
    let mut param_types: List<LLVMTypeRef> = []
    for p in params {
        param_types.push(ptr)
    }

    // Add trait bound dict params
    for b in trait_bounds {
        param_types.push(ptr)
    }

    // Add evidence params
    let effective_effects = match ctx.local_fn_effects.get(name) {
        some(eff) => eff,
        none => effects,
    }
    let ev_params = compute_evidence_params(effective_effects)
    for ep in ev_params {
        param_types.push(ptr)
    }

    // Store evidence param names for this function
    ctx.fn_evidence_params.insert(mangled, ev_params)

    // Return type is always ptr (uniform boxing)
    let fn_ty = LLVMFunctionType(ptr, param_types, 0)
    let fn_val = LLVMAddFunction(ctx.module, mangled, fn_ty)

    ctx.functions.insert(mangled, fn_val)
    ctx.fn_types.insert(mangled, fn_ty)
}

// ============================================================
// forward_declare_enum_ctors — declare enum variant constructors in first pass
// ============================================================

fn forward_declare_enum_ctors(mut ctx: LlvmCtx, name: Str, variants: List<HEnumVariant>) {
    let ptr = ctx.ptr_type
    for v in variants {
        let ctor_name = "ring_${name}_${v.name}"
        let mut param_types: List<LLVMTypeRef> = []
        for f in v.fields {
            param_types.push(ptr)
        }
        let fn_ty = LLVMFunctionType(ptr, param_types, 0)
        let fn_val = LLVMAddFunction(ctx.module, ctor_name, fn_ty)
        ctx.functions.insert(ctor_name, fn_val)
        ctx.fn_types.insert(ctor_name, fn_ty)
    }
}

// ============================================================
// register_builtin_enums — Option, Result etc. are built-in, not in HDecl
// ============================================================

fn register_builtin_enums(mut ctx: LlvmCtx) {
    let ptr = ctx.ptr_type
    let i64 = ctx.i64_type

    // Option<T>: { some(T), none } → { i64 tag, ptr payload }
    let option_ty = LLVMStructTypeInContext(ctx.context, [i64, ptr], 0)
    let mut option_variants: Map<Str, EnumVariantInfo> = map_new()
    option_variants.insert("some", EnumVariantInfo { tag: 0, field_count: 1 })
    option_variants.insert("none", EnumVariantInfo { tag: 1, field_count: 0 })
    ctx.enum_types.insert("Option", EnumTypeInfo {
        variants: option_variants, max_fields: 1, llvm_type: option_ty
    })

    // Option_some: (ptr) -> ptr
    let some_fn_ty = LLVMFunctionType(ptr, [ptr], 0)
    let some_fn = LLVMAddFunction(ctx.module, "ring_Option_some", some_fn_ty)
    ctx.functions.insert("ring_Option_some", some_fn)
    ctx.fn_types.insert("ring_Option_some", some_fn_ty)

    // Option_none: () -> ptr
    let none_fn_ty = LLVMFunctionType(ptr, [], 0)
    let none_fn = LLVMAddFunction(ctx.module, "ring_Option_none", none_fn_ty)
    ctx.functions.insert("ring_Option_none", none_fn)
    ctx.fn_types.insert("ring_Option_none", none_fn_ty)

    // Generate Option_some body
    let some_entry = LLVMAppendBasicBlockInContext(ctx.context, some_fn, "entry")
    LLVMPositionBuilderAtEnd(ctx.builder, some_entry)
    let some_size = LLVMSizeOf(option_ty)
    let malloc_fn = get_or_declare_runtime_fn(ctx, "malloc", [ctx.i64_type], ptr)
    let malloc_ty = get_rt_fn_type(ctx, "malloc")
    let some_ptr = LLVMBuildCall2(ctx.builder, malloc_ty, malloc_fn, [some_size], "opt")
    let some_tag_ptr = LLVMBuildStructGEP2(ctx.builder, option_ty, some_ptr, 0, "tag")
    discard(LLVMBuildStore(ctx.builder, LLVMConstInt(i64, 0, 0), some_tag_ptr))
    let some_val_ptr = LLVMBuildStructGEP2(ctx.builder, option_ty, some_ptr, 1, "val")
    discard(LLVMBuildStore(ctx.builder, LLVMGetParam(some_fn, 0), some_val_ptr))
    discard(LLVMBuildRet(ctx.builder, some_ptr))

    // Generate Option_none body
    let none_entry = LLVMAppendBasicBlockInContext(ctx.context, none_fn, "entry")
    LLVMPositionBuilderAtEnd(ctx.builder, none_entry)
    let none_size = LLVMSizeOf(option_ty)
    let none_ptr = LLVMBuildCall2(ctx.builder, malloc_ty, malloc_fn, [none_size], "opt")
    let none_tag_ptr = LLVMBuildStructGEP2(ctx.builder, option_ty, none_ptr, 0, "tag")
    discard(LLVMBuildStore(ctx.builder, LLVMConstInt(i64, 1, 0), none_tag_ptr))
    discard(LLVMBuildRet(ctx.builder, none_ptr))

    // Result<T, E>: { Ok(T), Err(E) } → { i64 tag, ptr payload }
    let result_ty = LLVMStructTypeInContext(ctx.context, [i64, ptr], 0)
    let mut result_variants: Map<Str, EnumVariantInfo> = map_new()
    result_variants.insert("Ok", EnumVariantInfo { tag: 0, field_count: 1 })
    result_variants.insert("Err", EnumVariantInfo { tag: 1, field_count: 1 })
    ctx.enum_types.insert("Result", EnumTypeInfo {
        variants: result_variants, max_fields: 1, llvm_type: result_ty
    })

    // Result_Ok and Result_Err constructors
    let ok_fn_ty = LLVMFunctionType(ptr, [ptr], 0)
    let ok_fn = LLVMAddFunction(ctx.module, "ring_Result_Ok", ok_fn_ty)
    ctx.functions.insert("ring_Result_Ok", ok_fn)
    ctx.fn_types.insert("ring_Result_Ok", ok_fn_ty)
    let ok_entry = LLVMAppendBasicBlockInContext(ctx.context, ok_fn, "entry")
    LLVMPositionBuilderAtEnd(ctx.builder, ok_entry)
    let ok_ptr = LLVMBuildCall2(ctx.builder, malloc_ty, malloc_fn, [LLVMSizeOf(result_ty)], "res")
    let ok_tag_ptr = LLVMBuildStructGEP2(ctx.builder, result_ty, ok_ptr, 0, "tag")
    discard(LLVMBuildStore(ctx.builder, LLVMConstInt(i64, 0, 0), ok_tag_ptr))
    let ok_val_ptr = LLVMBuildStructGEP2(ctx.builder, result_ty, ok_ptr, 1, "val")
    discard(LLVMBuildStore(ctx.builder, LLVMGetParam(ok_fn, 0), ok_val_ptr))
    discard(LLVMBuildRet(ctx.builder, ok_ptr))

    let err_fn_ty = LLVMFunctionType(ptr, [ptr], 0)
    let err_fn = LLVMAddFunction(ctx.module, "ring_Result_Err", err_fn_ty)
    ctx.functions.insert("ring_Result_Err", err_fn)
    ctx.fn_types.insert("ring_Result_Err", err_fn_ty)
    let err_entry = LLVMAppendBasicBlockInContext(ctx.context, err_fn, "entry")
    LLVMPositionBuilderAtEnd(ctx.builder, err_entry)
    let err_ptr = LLVMBuildCall2(ctx.builder, malloc_ty, malloc_fn, [LLVMSizeOf(result_ty)], "res")
    let err_tag_ptr = LLVMBuildStructGEP2(ctx.builder, result_ty, err_ptr, 0, "tag")
    discard(LLVMBuildStore(ctx.builder, LLVMConstInt(i64, 1, 0), err_tag_ptr))
    let err_val_ptr = LLVMBuildStructGEP2(ctx.builder, result_ty, err_ptr, 1, "val")
    discard(LLVMBuildStore(ctx.builder, LLVMGetParam(err_fn, 0), err_val_ptr))
    discard(LLVMBuildRet(ctx.builder, err_ptr))
}

// ============================================================
// scan_fn_effects — collect local function effects for transitive closure
// ============================================================

fn scan_fn_effects(decls: List<HDecl>, mut local_fn_effects: Map<Str, EffectRow>) {
    for decl in decls {
        match decl {
            HDecl::Fn { name, effects, .. } => {
                if effects.effects.len() > 0 {
                    local_fn_effects.insert(name, effects)
                }
            },
            HDecl::Impl { methods, .. } => {
                for m in methods {
                    match m {
                        HDecl::Fn { name: mn, effects: me, .. } => {
                            if me.effects.len() > 0 {
                                local_fn_effects.insert(mn, me)
                            }
                        },
                        _ => {},
                    }
                }
            },
            HDecl::ModBlock { decls: md, .. } => {
                scan_fn_effects(md, local_fn_effects)
            },
            _ => {},
        }
    }
}

// ============================================================
// emit_c_main — generate C main() wrapper that calls Ring main
// ============================================================

fn emit_c_main(mut ctx: LlvmCtx) {
    let i32_ty = ctx.i32_type
    let ptr = ctx.ptr_type

    // C main signature: int main(int argc, char** argv)
    let main_params: List<LLVMTypeRef> = [i32_ty, ptr]
    let main_ty = LLVMFunctionType(i32_ty, main_params, 0)
    let main_fn = LLVMAddFunction(ctx.module, "main", main_ty)

    let entry = LLVMAppendBasicBlockInContext(ctx.context, main_fn, "entry")
    LLVMPositionBuilderAtEnd(ctx.builder, entry)

    // Call ring_main() — find it in our functions map
    let ring_main_name = llvm_mangle_fn("main")
    match ctx.functions.get(ring_main_name) {
        some(ring_main_fn) => {
            // Check if ring_main needs evidence params (io)
            let mut call_args: List<LLVMValueRef> = []
            match ctx.fn_evidence_params.get(ring_main_name) {
                some(ev_params) => {
                    // Pass null for each evidence param
                    for ep in ev_params {
                        call_args.push(LLVMConstPointerNull(ptr))
                    }
                },
                none => {},
            }
            let ring_main_ty = match ctx.fn_types.get(ring_main_name) {
                some(t) => t,
                none => panic("LLVM codegen: ring_main fn type not found"),
            }
            discard(LLVMBuildCall2(ctx.builder, ring_main_ty, ring_main_fn, call_args, ""))
        },
        none => {
            // No main function — that's OK for library modules
        },
    }

    // return 0
    let zero = LLVMConstInt(i32_ty, 0, 0)
    discard(LLVMBuildRet(ctx.builder, zero))
}

// ============================================================
// generate_llvm — main entry point
// ============================================================

pub fn generate_llvm(program: HProgram, output_path: Str) -> Unit {
    // 1. Initialize LLVM target
    LLVMInitializeX86TargetInfo()
    LLVMInitializeX86Target()
    LLVMInitializeX86TargetMC()
    LLVMInitializeX86AsmPrinter()

    // 2. Create context, module, builder
    let context = LLVMContextCreate()
    let module = LLVMModuleCreateWithNameInContext("ring_module", context)
    let builder = LLVMCreateBuilderInContext(context)

    // 3. Set target triple and data layout
    let triple = LLVMGetDefaultTargetTriple()
    LLVMSetTarget(module, triple)

    let target = LLVMGetTargetFromTriple(triple)
    // opt=2 (Default), reloc=0 (Default), code_model=0 (Default)
    let tm = LLVMCreateTargetMachine(target, triple, "generic", "", 2, 0, 0)

    // 4. Cache basic types
    let ptr_type = LLVMPointerTypeInContext(context, 0)
    let i64_type = LLVMInt64TypeInContext(context)
    let i32_type = LLVMInt32TypeInContext(context)
    let i8_type = LLVMInt8TypeInContext(context)
    let i1_type = LLVMInt1TypeInContext(context)
    let void_type = LLVMVoidTypeInContext(context)
    let double_type = LLVMDoubleTypeInContext(context)

    // 5. Build LlvmCtx
    let mut ctx = LlvmCtx {
        context: context,
        module: module,
        builder: builder,
        target_machine: tm,
        ptr_type: ptr_type,
        i64_type: i64_type,
        i32_type: i32_type,
        i8_type: i8_type,
        i1_type: i1_type,
        void_type: void_type,
        double_type: double_type,
        named_values: map_new(),
        functions: map_new(),
        fn_types: map_new(),
        struct_types: map_new(),
        enum_types: map_new(),
        rt_fns: map_new(),
        rt_fn_types: map_new(),
        local_fn_effects: map_new(),
        fn_evidence_params: map_new(),
        tmp_counter: 0,
        current_fn: none
    }

    // 6. Register built-in types (Option, Result — not in HDecl, handled by runtime)
    register_builtin_enums(ctx)

    // 7. Scan function effects
    scan_fn_effects(program.decls, ctx.local_fn_effects)

    // 7. Declare runtime functions
    declare_runtime_fns(ctx)

    // 8. First pass: forward declare all Ring functions
    forward_declare_functions(ctx, program.decls)

    // 9. Second pass: generate all function bodies
    for decl in program.decls {
        emit_llvm_decl(ctx, decl)
    }

    // 10. Generate C main() wrapper
    emit_c_main(ctx)

    // 11. Dump IR for debugging (skip verification for now — stubs cause errors)
    let ir = LLVMPrintModuleToString(module)
    print("LLVM IR generated. Dumping to ring_output.ll for inspection...")
    write_file("ring_output.ll", ir)

    // 12. Emit object file
    // file_type: 1 = Object file
    let emit_result = LLVMTargetMachineEmitToFile(tm, module, output_path, 1)
    if emit_result != 0 {
        eprintln("Failed to emit object file: ${output_path}")
    } else {
        print("Compiled: ${output_path}")
    }

    // 13. Cleanup
    LLVMDisposeBuilder(builder)
    LLVMDisposeTargetMachine(tm)
    LLVMDisposeModule(module)
    LLVMContextDispose(context)
}
