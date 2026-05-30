use types::{Type, Effect, EffectRow, effect_kind_name}
use ast::{TypeParam, UseDecl, UseImport, NamedImport}
use hir::{HExpr, HStmt, HDecl, HParam, HProgram, HStructField, HEnumVariant,
    HTraitMethod, TraitBound, HEffectOp,
    evidence_param_name, trait_dict_name, trait_bound_param_name,
    hexpr_type, hexpr_effects}
use codegen_llvm_ctx::{LlvmCtx, StructFieldInfo, EnumTypeInfo, EnumVariantInfo,
    fresh_name, get_or_declare_runtime_fn, get_rt_fn_type,
    llvm_mangle_fn, llvm_mangle_fn_with_prefix, llvm_mangle_method}
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
    get_or_declare_runtime_fn(ctx, "ring_str_get", [ptr, i64], ptr)
    get_or_declare_runtime_fn(ctx, "ring_str_contains", [ptr, ptr], i64)
    get_or_declare_runtime_fn(ctx, "ring_str_starts_with", [ptr, ptr], i64)
    get_or_declare_runtime_fn(ctx, "ring_str_ends_with", [ptr, ptr], i64)
    get_or_declare_runtime_fn(ctx, "ring_str_slice", [ptr, i64, i64], ptr)
    get_or_declare_runtime_fn(ctx, "ring_str_split", [ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_str_replace", [ptr, ptr, ptr], ptr)

    // StringBuilder
    get_or_declare_runtime_fn(ctx, "ring_sb_new", [], ptr)
    get_or_declare_runtime_fn(ctx, "ring_sb_add", [ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_sb_to_str", [ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_sb_len", [ptr], i64)

    // Int/Float/Bool to Str — match C signatures: int64_t, double, ptr (boxed bool)
    get_or_declare_runtime_fn(ctx, "ring_int_to_str", [i64], ptr)
    get_or_declare_runtime_fn(ctx, "ring_float_to_str", [dbl], ptr)
    get_or_declare_runtime_fn(ctx, "ring_bool_to_str", [i64], ptr)

    // IO — C runtime returns void* (nullptr) for all of these
    get_or_declare_runtime_fn(ctx, "ring_print", [ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_eprintln", [ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_panic", [ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_exit", [ptr], ptr)

    // Memory allocation (for struct/enum construction)
    get_or_declare_runtime_fn(ctx, "malloc", [i64], ptr)

    // List
    get_or_declare_runtime_fn(ctx, "ring_list_new", [], ptr)
    get_or_declare_runtime_fn(ctx, "ring_list_push", [ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_list_get", [ptr, i64], ptr)
    get_or_declare_runtime_fn(ctx, "ring_list_len", [ptr], i64)
    get_or_declare_runtime_fn(ctx, "ring_list_join", [ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_list_concat", [ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_list_slice", [ptr, i64, i64], ptr)
    get_or_declare_runtime_fn(ctx, "ring_list_reverse", [ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_list_sort", [ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_list_sort_default", [ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_list_pop", [ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_list_contains", [ptr, ptr], i64)
    get_or_declare_runtime_fn(ctx, "ring_list_index_of", [ptr, ptr], i64)
    get_or_declare_runtime_fn(ctx, "ring_list_is_empty", [ptr], i64)
    get_or_declare_runtime_fn(ctx, "ring_list_first", [ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_list_last", [ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_list_map", [ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_list_filter", [ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_list_for_each", [ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_list_set", [ptr, i64, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_list_any", [ptr, ptr], i64)
    get_or_declare_runtime_fn(ctx, "ring_list_all", [ptr, ptr], i64)
    get_or_declare_runtime_fn(ctx, "ring_list_find", [ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_list_flat_map", [ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_list_enumerate", [ptr], ptr)

    // Map
    get_or_declare_runtime_fn(ctx, "ring_map_new", [], ptr)
    get_or_declare_runtime_fn(ctx, "ring_map_get", [ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_map_set", [ptr, ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_map_has", [ptr, ptr], i64)
    get_or_declare_runtime_fn(ctx, "ring_map_delete", [ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_map_keys", [ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_map_values", [ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_map_entries", [ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_map_len", [ptr], i64)
    get_or_declare_runtime_fn(ctx, "ring_map_for_each", [ptr, ptr], ptr)

    // Map<Int>
    get_or_declare_runtime_fn(ctx, "ring_map_int_new", [], ptr)
    get_or_declare_runtime_fn(ctx, "ring_map_int_get", [ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_map_int_get_opt", [ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_map_int_set", [ptr, ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_map_int_has", [ptr, ptr], i64)
    get_or_declare_runtime_fn(ctx, "ring_map_int_delete", [ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_map_int_keys", [ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_map_int_values", [ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_map_int_entries", [ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_map_int_len", [ptr], i64)
    get_or_declare_runtime_fn(ctx, "ring_map_int_for_each", [ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_map_int_clone", [ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_map_int_from", [ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_map_int_clear", [ptr], ptr)

    // Set
    get_or_declare_runtime_fn(ctx, "ring_set_new", [], ptr)
    get_or_declare_runtime_fn(ctx, "ring_set_add", [ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_set_has", [ptr, ptr], i64)
    get_or_declare_runtime_fn(ctx, "ring_set_delete", [ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_set_to_list", [ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_set_len", [ptr], i64)
    get_or_declare_runtime_fn(ctx, "ring_set_from_list", [ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_set_for_each", [ptr, ptr], ptr)

    // Set<Int>
    get_or_declare_runtime_fn(ctx, "ring_set_int_new", [], ptr)
    get_or_declare_runtime_fn(ctx, "ring_set_int_add", [ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_set_int_has", [ptr, ptr], i64)
    get_or_declare_runtime_fn(ctx, "ring_set_int_delete", [ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_set_int_to_list", [ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_set_int_len", [ptr], i64)
    get_or_declare_runtime_fn(ctx, "ring_set_int_from_list", [ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_set_int_for_each", [ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_set_int_clone", [ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_set_int_union", [ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_set_int_intersect", [ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_set_int_difference", [ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_set_int_clear", [ptr], ptr)

    // Catch / raise (setjmp/longjmp based)
    get_or_declare_runtime_fn(ctx, "ring_catch_push", [], ptr)
    get_or_declare_runtime_fn(ctx, "ring_catch_setjmp", [ptr], i64)
    get_or_declare_runtime_fn(ctx, "ring_catch_pop", [], void)
    get_or_declare_runtime_fn(ctx, "ring_catch_get_error", [ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_raise", [ptr], void)

    // Args
    get_or_declare_runtime_fn(ctx, "ring_args", [], ptr)

    // File IO
    get_or_declare_runtime_fn(ctx, "ring_read_file", [ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_write_file", [ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_file_exists", [ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_delete_file", [ptr], ptr)

    // Path
    get_or_declare_runtime_fn(ctx, "ring_path_join", [ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_path_resolve", [ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_path_dirname", [ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_path_basename", [ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_path_extname", [ptr], ptr)

    // Collection clone/from
    get_or_declare_runtime_fn(ctx, "ring_list_clone", [ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_map_clone", [ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_set_clone", [ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_map_from", [ptr], ptr)

    // Parse
    get_or_declare_runtime_fn(ctx, "ring_parse_int", [ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_parse_float", [ptr], ptr)

    // String (additional)
    get_or_declare_runtime_fn(ctx, "ring_str_trim", [ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_str_trim_start", [ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_str_trim_end", [ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_str_to_upper", [ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_str_to_lower", [ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_str_char_at", [ptr, i64], ptr)
    get_or_declare_runtime_fn(ctx, "ring_str_index_of", [ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_str_last_index_of", [ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_str_is_empty", [ptr], i64)
    get_or_declare_runtime_fn(ctx, "ring_str_pad_start", [ptr, i64, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_str_pad_end", [ptr, i64, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_str_repeat", [ptr, i64], ptr)
    get_or_declare_runtime_fn(ctx, "ring_str_char_code_at", [ptr, i64], ptr)
    get_or_declare_runtime_fn(ctx, "ring_str_join", [ptr, ptr], ptr)

    // StringBuilder (additional)
    get_or_declare_runtime_fn(ctx, "ring_sb_line", [ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_sb_add_int", [ptr, i64], ptr)

    // Set (additional)
    get_or_declare_runtime_fn(ctx, "ring_set_union", [ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_set_intersect", [ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_set_difference", [ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_set_clear", [ptr], ptr)

    // List (additional)
    get_or_declare_runtime_fn(ctx, "ring_list_shift", [ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_list_clear", [ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_list_extend", [ptr, ptr], ptr)

    // Map (additional)
    get_or_declare_runtime_fn(ctx, "ring_map_clear", [ptr], ptr)

    // Misc
    get_or_declare_runtime_fn(ctx, "ring_assert", [i64, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_json_stringify", [ptr], ptr)

    // CWD
    get_or_declare_runtime_fn(ctx, "ring_cwd", [], ptr)

    // Effect workaround
    get_or_declare_runtime_fn(ctx, "__ring_raise_fail", [ptr], ptr)

    // Option methods
    get_or_declare_runtime_fn(ctx, "ring_Option_unwrap_or", [ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_Option_unwrap", [ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_Option_is_some", [ptr], i64)
    get_or_declare_runtime_fn(ctx, "ring_Option_is_none", [ptr], i64)
    get_or_declare_runtime_fn(ctx, "ring_Option_map", [ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_Option_unwrap_or_else", [ptr, ptr], ptr)
}

// ============================================================
// forward_declare_functions — first pass over all decls
// ============================================================

fn forward_declare_functions(mut ctx: LlvmCtx, decls: List<HDecl>) {
    forward_declare_functions_with_prefix(ctx, decls, none)
}

fn forward_declare_functions_with_prefix(mut ctx: LlvmCtx, decls: List<HDecl>, prefix: Str?) {
    for decl in decls {
        match decl {
            HDecl::Fn { name, params, effects, trait_bounds, .. } => {
                forward_declare_fn(ctx, name, params, effects, trait_bounds, prefix)
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
                forward_declare_functions_with_prefix(ctx, mod_decls, prefix)
            },
            HDecl::ExternType { .. } => {},
            HDecl::TypeAlias { .. } => {},
            HDecl::Const { name, .. } => {
                // Forward-declare const as a zero-arg function (lazy getter)
                let const_fn_name = match prefix {
                    some(p) => llvm_mangle_fn_with_prefix(p, name),
                    none => llvm_mangle_fn(name),
                }
                let fn_ty = LLVMFunctionType(ctx.ptr_type, [], 0)
                let fn_val = LLVMAddFunction(ctx.module, const_fn_name, fn_ty)
                ctx.functions.insert(const_fn_name, fn_val)
                ctx.fn_types.insert(const_fn_name, fn_ty)
                // No evidence params for consts
                let mut empty_ev: List<Str> = []
                ctx.fn_evidence_params.insert(const_fn_name, empty_ev)
            },
            HDecl::Trait { .. } => {},
            HDecl::Test { .. } => {},
            HDecl::Sig { .. } => {},
        }
    }
}

fn forward_declare_fn(mut ctx: LlvmCtx, name: Str, params: List<HParam>, effects: EffectRow, trait_bounds: List<TraitBound>, prefix: Str?) {
    let mangled = match prefix {
        some(p) => llvm_mangle_fn_with_prefix(p, name),
        none => llvm_mangle_fn(name),
    }
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
// scan_trait_decls — collect trait method ordering for dict generation
// ============================================================

fn scan_trait_decls(decls: List<HDecl>, mut trait_method_order: Map<Str, List<Str>>) {
    for decl in decls {
        match decl {
            HDecl::Trait { name, methods, .. } => {
                let mut method_names: List<Str> = []
                for m in methods {
                    method_names.push(m.name)
                }
                trait_method_order.insert(name, method_names)
            },
            HDecl::ModBlock { decls: md, .. } => {
                scan_trait_decls(md, trait_method_order)
            },
            _ => {},
        }
    }
    // Register built-in traits that are not in HDecl
    if trait_method_order.get("Eq").is_none() {
        trait_method_order.insert("Eq", ["eq", "ne"])
    }
    if trait_method_order.get("Clone").is_none() {
        trait_method_order.insert("Clone", ["clone"])
    }
    if trait_method_order.get("Ord").is_none() {
        trait_method_order.insert("Ord", ["compare"])
    }
    if trait_method_order.get("Debug").is_none() {
        trait_method_order.insert("Debug", ["debug"])
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

    // Call ring_runtime_init(argc, argv) to set up process args
    let argc_val = LLVMGetParam(main_fn, 0)
    let argv_val = LLVMGetParam(main_fn, 1)
    let init_name = "ring_runtime_init"
    match ctx.functions.get(init_name) {
        some(init_fn) => {
            let init_ty = match ctx.fn_types.get(init_name) {
                some(t) => t,
                none => {
                    let init_params: List<LLVMTypeRef> = [i32_ty, ptr]
                    LLVMFunctionType(ctx.void_type, init_params, 0)
                },
            }
            discard(LLVMBuildCall2(ctx.builder, init_ty, init_fn, [argc_val, argv_val], ""))
        },
        none => {
            let init_params: List<LLVMTypeRef> = [i32_ty, ptr]
            let init_ty = LLVMFunctionType(ctx.void_type, init_params, 0)
            let init_fn = LLVMAddFunction(ctx.module, init_name, init_ty)
            discard(LLVMBuildCall2(ctx.builder, init_ty, init_fn, [argc_val, argv_val], ""))
        },
    }

    // Call ring_main() — find it in our functions map
    let ring_main_name = llvm_mangle_fn("main")
    match ctx.functions.get(ring_main_name) {
        some(ring_main_fn) => {
            // Check if ring_main needs evidence params (io, etc.)
            let mut call_args: List<LLVMValueRef> = []
            match ctx.fn_evidence_params.get(ring_main_name) {
                some(ev_params) => {
                    // Pass null for each evidence param — top-level default evidence
                    // io/mut/fail all use null at top level (runtime handles IO directly)
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
        dict_globals: map_new(),
        trait_method_order: map_new(),
        module_prefix: none,
        imports_map: map_new(),
        local_names: set_new(),
        tmp_counter: 0,
        lambda_counter: 0,
        current_fn: none,
        loop_break_bb: none,
        loop_continue_bb: none
    }

    // 6. Register built-in types (Option, Result — not in HDecl, handled by runtime)
    register_builtin_enums(ctx)

    // 7. Scan function effects and trait declarations
    scan_fn_effects(program.decls, ctx.local_fn_effects)
    scan_trait_decls(program.decls, ctx.trait_method_order)

    // 7b. Declare runtime functions
    declare_runtime_fns(ctx)

    // 8. First pass: forward declare all Ring functions
    forward_declare_functions(ctx, program.decls)

    // 9. Second pass: generate all function bodies
    for decl in program.decls {
        emit_llvm_decl(ctx, decl)
    }

    // 10. Generate C main() wrapper
    emit_c_main(ctx)

    // 11. Dump IR for debugging
    let ir = LLVMPrintModuleToString(module)
    write_file("ring_output.ll", ir)
    // Skip LLVMVerifyModule — N-API addon throws on failure instead of returning status.
    // Verification will be re-enabled when the addon is fixed or when targeting self-hosting.

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

// ============================================================
// generate_llvm_project — multi-module entry point
// All modules' HIR merged into a single LLVM Module.
// modules: List of (module_prefix, HProgram) in topo order
// entry_prefix: module prefix of the entry module (contains main)
// ============================================================

pub fn generate_llvm_project(modules: List<(Str, HProgram, List<UseDecl>)>, entry_prefix: Str, output_path: Str) -> Unit {
    // 1. Initialize LLVM target
    LLVMInitializeX86TargetInfo()
    LLVMInitializeX86Target()
    LLVMInitializeX86TargetMC()
    LLVMInitializeX86AsmPrinter()

    // 2. Create context, module, builder
    let context = LLVMContextCreate()
    let module = LLVMModuleCreateWithNameInContext("ring_project", context)
    let builder = LLVMCreateBuilderInContext(context)

    // 3. Set target triple and data layout
    let triple = LLVMGetDefaultTargetTriple()
    LLVMSetTarget(module, triple)

    let target = LLVMGetTargetFromTriple(triple)
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
        dict_globals: map_new(),
        trait_method_order: map_new(),
        module_prefix: none,
        imports_map: map_new(),
        local_names: set_new(),
        tmp_counter: 0,
        lambda_counter: 0,
        current_fn: none,
        loop_break_bb: none,
        loop_continue_bb: none
    }

    // 6. Register built-in types
    register_builtin_enums(ctx)

    // 7. Scan all modules for function effects and trait declarations
    for m in modules {
        let (prefix, program, _uses) = m
        scan_fn_effects(program.decls, ctx.local_fn_effects)
        scan_trait_decls(program.decls, ctx.trait_method_order)
    }

    // 7b. Declare runtime functions
    declare_runtime_fns(ctx)

    // 8. First pass: forward declare all Ring functions in all modules
    for m in modules {
        let (prefix, program, _uses) = m
        forward_declare_functions_with_prefix(ctx, program.decls, some(prefix))
    }

    // 9. Second pass: generate all function bodies for all modules
    for m in modules {
        let (prefix, program, uses) = m
        // Set the current module context
        ctx.module_prefix = some(prefix)
        // Collect local names for this module
        ctx.local_names = collect_local_names(program.decls)
        // Build imports map from use declarations
        ctx.imports_map = build_imports_map(uses)
        for decl in program.decls {
            emit_llvm_decl(ctx, decl)
        }
    }

    // Clear module prefix
    ctx.module_prefix = none

    // 10. Generate C main() wrapper — look for main in the entry module
    emit_c_main_project(ctx, entry_prefix)

    // 11. Dump IR for debugging
    let ir = LLVMPrintModuleToString(module)
    write_file("ring_output.ll", ir)

    // 11b. Verify module (action=2: ReturnStatusAction, prints to stderr)
    let verify_result = LLVMVerifyModule(module, 2)
    if verify_result != 0 {
        eprintln("LLVM module verification failed (${verify_result} errors) — attempting emit anyway")
    }

    // 12. Emit object file
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

// ============================================================
// emit_c_main_project — entry point for multi-module projects
// ============================================================

fn emit_c_main_project(mut ctx: LlvmCtx, entry_prefix: Str) {
    let i32_ty = ctx.i32_type
    let ptr = ctx.ptr_type

    let main_params: List<LLVMTypeRef> = [i32_ty, ptr]
    let main_ty = LLVMFunctionType(i32_ty, main_params, 0)
    let main_fn = LLVMAddFunction(ctx.module, "main", main_ty)

    let entry = LLVMAppendBasicBlockInContext(ctx.context, main_fn, "entry")
    LLVMPositionBuilderAtEnd(ctx.builder, entry)

    // Call ring_runtime_init(argc, argv) to set up process args
    let argc_val = LLVMGetParam(main_fn, 0)
    let argv_val = LLVMGetParam(main_fn, 1)
    let init_name = "ring_runtime_init"
    let init_params: List<LLVMTypeRef> = [i32_ty, ptr]
    let init_ty = LLVMFunctionType(ctx.void_type, init_params, 0)
    let init_fn = LLVMAddFunction(ctx.module, init_name, init_ty)
    discard(LLVMBuildCall2(ctx.builder, init_ty, init_fn, [argc_val, argv_val], ""))

    // Look for ring_<prefix>$_main
    let ring_main_name = llvm_mangle_fn_with_prefix(entry_prefix, "main")
    match ctx.functions.get(ring_main_name) {
        some(ring_main_fn) => {
            let mut call_args: List<LLVMValueRef> = []
            match ctx.fn_evidence_params.get(ring_main_name) {
                some(ev_params) => {
                    for ep in ev_params {
                        call_args.push(LLVMConstPointerNull(ptr))
                    }
                },
                none => {},
            }
            let ring_main_ty = match ctx.fn_types.get(ring_main_name) {
                some(t) => t,
                none => panic("LLVM codegen: ring_main fn type not found (project mode)"),
            }
            discard(LLVMBuildCall2(ctx.builder, ring_main_ty, ring_main_fn, call_args, ""))
        },
        none => {
            eprintln("Warning: no main function found in entry module")
        },
    }

    let zero = LLVMConstInt(i32_ty, 0, 0)
    discard(LLVMBuildRet(ctx.builder, zero))
}

// ============================================================
// build_imports_map — map imported names to mangled LLVM names
// ============================================================

fn build_imports_map(uses: List<UseDecl>) -> Map<Str, Str> {
    let mut imap: Map<Str, Str> = map_new()
    for u in uses {
        let module_name = u.path.segments.join("_")
        match u.imports {
            UseImport::NamedItems { names } => {
                for ni in names {
                    let local_name = match ni.alias {
                        some(a) => a,
                        none => ni.name,
                    }
                    let qualified = llvm_mangle_fn_with_prefix(module_name, ni.name)
                    imap.insert(local_name, qualified)
                }
            },
            UseImport::Module => {
                // Whole-module import — not used for function resolution
            },
        }
    }
    imap
}

// ============================================================
// collect_local_names — gather all declared names in a module
// ============================================================

fn collect_local_names(decls: List<HDecl>) -> Set<Str> {
    let mut names: Set<Str> = set_new()
    collect_local_names_rec(decls, names)
    names
}

fn collect_local_names_rec(decls: List<HDecl>, mut names: Set<Str>) {
    for decl in decls {
        match decl {
            HDecl::Fn { name, .. } => { names.insert(name) },
            HDecl::Struct { name, .. } => { names.insert(name) },
            HDecl::Enum { name, .. } => { names.insert(name) },
            HDecl::Const { name, .. } => { names.insert(name) },
            HDecl::Trait { name, .. } => { names.insert(name) },
            HDecl::ExternFn { name, .. } => { names.insert(name) },
            HDecl::ExternType { name, .. } => { names.insert(name) },
            HDecl::TypeAlias { name, .. } => { names.insert(name) },
            HDecl::Impl { .. } => {},
            HDecl::Effect { name, .. } => { names.insert(name) },
            HDecl::ModBlock { decls: md, .. } => { collect_local_names_rec(md, names) },
            HDecl::Test { .. } => {},
            HDecl::Sig { .. } => {},
        }
    }
}
