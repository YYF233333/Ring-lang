use types::{Type, Effect, EffectRow, effect_kind_name, is_option_type}
use ast::{TypeParam, UseDecl, UseImport, NamedImport}
use hir::{HExpr, HStmt, HDecl, HParam, HProgram, HStructField, HEnumVariant,
    HTraitMethod, TraitBound, HEffectOp, DerivedImpl, HStringInterpPart,
    evidence_param_name, trait_dict_name, trait_bound_param_name,
    compare_by_first, hexpr_type, hexpr_effects}
use codegen_llvm_ctx::{LlvmCtx, StructFieldInfo, EnumTypeInfo, EnumVariantInfo,
    ExternFnInfo, ExternParamMarshall, ExternRetMarshall,
    fresh_name, get_or_declare_runtime_fn, get_rt_fn_type,
    llvm_mangle_fn, llvm_mangle_fn_with_prefix, llvm_mangle_method,
    get_or_assign_typeid}
use codegen_llvm_expr::{gen_llvm_expr, build_default_evidence_all}
use codegen_llvm_decl::{emit_llvm_decl, register_struct_info, register_enum_info, emit_derived_impls_llvm}
use codegen_ctx::{extract_effect_names}
use codegen::{collect_fn_callees}

// Re-declare LLVM types and functions to avoid ESM cross-module import issues
extern type LLVMContextRef
extern type LLVMModuleRef
extern type LLVMBuilderRef
extern type LLVMTypeRef
extern type LLVMValueRef
extern type LLVMBasicBlockRef
extern type LLVMTargetRef
extern type LLVMTargetMachineRef
extern type LLVMTargetDataRef
extern type LLVMPassBuilderOptionsRef

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
extern fn LLVMCreateTargetDataLayout(tm: LLVMTargetMachineRef) -> LLVMTargetDataRef
extern fn LLVMCopyStringRepOfTargetData(td: LLVMTargetDataRef) -> Str
extern fn LLVMDisposeTargetData(td: LLVMTargetDataRef) -> Unit
extern fn LLVMTargetMachineEmitToFile(tm: LLVMTargetMachineRef, m: LLVMModuleRef, filename: Str, file_type: Int) -> Int
extern fn LLVMCreatePassBuilderOptions() -> LLVMPassBuilderOptionsRef
extern fn LLVMDisposePassBuilderOptions(opts: LLVMPassBuilderOptionsRef) -> Unit
extern fn LLVMRunPasses(m: LLVMModuleRef, passes: Str, tm: LLVMTargetMachineRef, opts: LLVMPassBuilderOptionsRef) -> Int

// Additional LLVM functions for Perceus RC drop function generation
extern fn LLVMBuildLoad2(builder: LLVMBuilderRef, ty: LLVMTypeRef, ptr: LLVMValueRef, name: Str) -> LLVMValueRef
extern fn LLVMBuildBr(builder: LLVMBuilderRef, dest: LLVMBasicBlockRef) -> LLVMValueRef
extern fn LLVMBuildRetVoid(builder: LLVMBuilderRef) -> LLVMValueRef
extern fn LLVMBuildSwitch(builder: LLVMBuilderRef, val: LLVMValueRef, default_dest: LLVMBasicBlockRef, num_cases: Int) -> LLVMValueRef
extern fn LLVMAddCase(switch_val: LLVMValueRef, on_val: LLVMValueRef, dest: LLVMBasicBlockRef) -> Unit

// B-117: Attribute API for nonnull / nounwind
extern type LLVMAttributeRef
extern fn LLVMAddAttributeAtIndex(fn_val: LLVMValueRef, attr_index: Int, attr: LLVMAttributeRef) -> Unit
extern fn LLVMGetEnumAttributeKindForName(name: Str, s_len: Int) -> Int
extern fn LLVMCreateEnumAttribute(ctx: LLVMContextRef, kind_id: Int, val: Int) -> LLVMAttributeRef

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

    // Memory allocation (Perceus RC: ring_alloc with typeid header)
    get_or_declare_runtime_fn(ctx, "ring_alloc", [i64, i64], ptr)

    // Perceus RC: reference counting
    get_or_declare_runtime_fn(ctx, "ring_dup", [ptr], void)
    get_or_declare_runtime_fn(ctx, "ring_drop", [ptr], void)
    get_or_declare_runtime_fn(ctx, "ring_register_drop", [i64, ptr], void)
    get_or_declare_runtime_fn(ctx, "ring_register_never_drop", [i64], void)

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
    get_or_declare_runtime_fn(ctx, "ring_list_pop", [ptr], ptr)
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
    get_or_declare_runtime_fn(ctx, "ring_map_is_empty", [ptr], i64)
    get_or_declare_runtime_fn(ctx, "ring_map_for_each", [ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_map_fold", [ptr, ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_map_filter", [ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_map_any", [ptr, ptr], i64)
    get_or_declare_runtime_fn(ctx, "ring_map_map_values", [ptr, ptr], ptr)

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
    get_or_declare_runtime_fn(ctx, "ring_map_int_is_empty", [ptr], i64)
    get_or_declare_runtime_fn(ctx, "ring_map_int_for_each", [ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_map_int_clone", [ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_map_int_from", [ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_map_int_clear", [ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_map_int_fold", [ptr, ptr, ptr], ptr)

    // Set
    get_or_declare_runtime_fn(ctx, "ring_set_new", [], ptr)
    get_or_declare_runtime_fn(ctx, "ring_set_add", [ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_set_has", [ptr, ptr], i64)
    get_or_declare_runtime_fn(ctx, "ring_set_delete", [ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_set_to_list", [ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_set_len", [ptr], i64)
    get_or_declare_runtime_fn(ctx, "ring_set_is_empty", [ptr], i64)
    get_or_declare_runtime_fn(ctx, "ring_set_from_list", [ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_set_for_each", [ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_set_fold", [ptr, ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_set_filter", [ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_set_any", [ptr, ptr], i64)
    get_or_declare_runtime_fn(ctx, "ring_set_all", [ptr, ptr], i64)

    // Set<Int>
    get_or_declare_runtime_fn(ctx, "ring_set_int_new", [], ptr)
    get_or_declare_runtime_fn(ctx, "ring_set_int_add", [ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_set_int_has", [ptr, ptr], i64)
    get_or_declare_runtime_fn(ctx, "ring_set_int_delete", [ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_set_int_to_list", [ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_set_int_len", [ptr], i64)
    get_or_declare_runtime_fn(ctx, "ring_set_int_is_empty", [ptr], i64)
    get_or_declare_runtime_fn(ctx, "ring_set_int_from_list", [ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_set_int_for_each", [ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_set_int_clone", [ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_set_int_union", [ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_set_int_intersect", [ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_set_int_difference", [ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_set_int_clear", [ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_set_int_fold", [ptr, ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_set_int_filter", [ptr, ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_set_int_any", [ptr, ptr], i64)
    get_or_declare_runtime_fn(ctx, "ring_set_int_all", [ptr, ptr], i64)

    // Catch / raise (setjmp/longjmp based)
    get_or_declare_runtime_fn(ctx, "ring_catch_push", [], ptr)
    get_or_declare_runtime_fn(ctx, "ring_catch_get_buf", [ptr], ptr)
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

    // B-099: LLVM-C extern fn marshalling helpers
    let i32 = ctx.i32_type
    get_or_declare_runtime_fn(ctx, "ring_str_to_cstr", [ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_str_len_u32", [ptr], i32)
    get_or_declare_runtime_fn(ctx, "ring_list_data", [ptr], ptr)
    get_or_declare_runtime_fn(ctx, "ring_list_size_u32", [ptr], i32)

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
            HDecl::Fn { name, params, effects, trait_bounds, body, .. } => {
                forward_declare_fn(ctx, name, params, effects, trait_bounds, prefix, some(body))
            },
            HDecl::Impl { target_type, methods, .. } => {
                for method in methods {
                    match method {
                        HDecl::Fn { name: mn, params: mp, effects: me, trait_bounds: mtb, body: mb, .. } => {
                            let mangled = llvm_mangle_method(target_type, mn)
                            // #177: use qualified key matching scan_fn_effects
                            let qualified = "${target_type}_${mn}"
                            forward_declare_fn_with_name(ctx, mangled, qualified, mp, me, mtb, some(mb))
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
            HDecl::ExternFn { name, params, return_type, .. } => {
                forward_declare_extern_fn(ctx, name, params, return_type)
            },
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
                if ctx.functions.get(const_fn_name).is_none() {
                    let fn_ty = LLVMFunctionType(ctx.ptr_type, [], 0)
                    let fn_val = LLVMAddFunction(ctx.module, const_fn_name, fn_ty)
                    ctx.functions.insert(const_fn_name, fn_val)
                    ctx.fn_types.insert(const_fn_name, fn_ty)
                    // No evidence params for consts
                    let mut empty_ev: List<Str> = []
                    ctx.fn_evidence_params.insert(const_fn_name, empty_ev)
                }
            },
            HDecl::Trait { name: trait_name, methods: trait_methods, .. } => {
                // B-141: forward-declare LLVM functions for default trait method bodies.
                // Each default body becomes __<Trait>_<method>(self_dict, ...supertrait_dicts, ...params, ...evidence).
                // Supertrait dict params mirror the JS backend's emit_trait_decl: the
                // body may call supertrait methods via __ring_self_<Supertrait>, so we
                // pass those dicts as extra parameters after self_dict.
                let all_supers = collect_all_supertraits_llvm(ctx, trait_name)
                for tm in trait_methods {
                    if tm.has_default {
                        match tm.body {
                            some(_) => {
                                let default_fn_name = "__${trait_name}_${tm.name}"
                                if ctx.functions.get(default_fn_name).is_none() {
                                    let ptr = ctx.ptr_type
                                    let mut param_types: List<LLVMTypeRef> = []
                                    // First param: self_dict (the trait dict for dispatch)
                                    param_types.push(ptr)
                                    // Supertrait dict params
                                    for st in all_supers { param_types.push(ptr) }
                                    // Regular params (includes self)
                                    for p in tm.params { param_types.push(ptr) }
                                    // Evidence params from method effects
                                    let ev_params = compute_evidence_params(tm.effects)
                                    for ep in ev_params { param_types.push(ptr) }
                                    let fn_ty = LLVMFunctionType(ptr, param_types, 0)
                                    let fn_val = LLVMAddFunction(ctx.module, default_fn_name, fn_ty)
                                    ctx.functions.insert(default_fn_name, fn_val)
                                    ctx.fn_types.insert(default_fn_name, fn_ty)
                                    ctx.fn_evidence_params.insert(default_fn_name, ev_params)
                                }
                            },
                            none => {},
                        }
                    }
                }
            },
            HDecl::Test { .. } => {},
            HDecl::Sig { .. } => {},
        }
    }
}

// ============================================================
// B-117: apply_fn_attributes — nonnull (params) + nounwind (function)
// ============================================================

fn has_fail_effect(effects: EffectRow) -> Bool {
    for e in effects.effects {
        match e {
            Effect::FailEffect { .. } => { return true },
            _ => {},
        }
    }
    false
}

// Recursively check if an HIR expression tree contains TryCatch or HandleExpr.
// These nodes generate _setjmp calls, so the enclosing function must NOT be
// marked nounwind — even if its declared effects don't include fail.
fn body_contains_try_or_handle(expr: HExpr) -> Bool {
    match expr {
        HExpr::TryCatch { .. } => true,
        HExpr::HandleExpr { .. } => true,
        HExpr::Block { stmts, tail, .. } => {
            for s in stmts {
                match s {
                    HStmt::Let { init, .. } => {
                        if body_contains_try_or_handle(init) { return true }
                    },
                    HStmt::Var { init, .. } => {
                        if body_contains_try_or_handle(init) { return true }
                    },
                    HStmt::ExprStmt { expr, .. } => {
                        if body_contains_try_or_handle(expr) { return true }
                    },
                    HStmt::Assign { target, value, .. } => {
                        if body_contains_try_or_handle(target) { return true }
                        if body_contains_try_or_handle(value) { return true }
                    },
                    HStmt::While { condition, body: wb, .. } => {
                        if body_contains_try_or_handle(condition) { return true }
                        if body_contains_try_or_handle(wb) { return true }
                    },
                    HStmt::ForIn { iterable, body: fb, .. } => {
                        if body_contains_try_or_handle(iterable) { return true }
                        if body_contains_try_or_handle(fb) { return true }
                    },
                    HStmt::Return { value, .. } => {
                        match value {
                            some(v) => { if body_contains_try_or_handle(v) { return true } },
                            none => {},
                        }
                    },
                    HStmt::LetDestructure { init, .. } => {
                        if body_contains_try_or_handle(init) { return true }
                    },
                    HStmt::IfLet { expr, then_block, else_block, .. } => {
                        if body_contains_try_or_handle(expr) { return true }
                        if body_contains_try_or_handle(then_block) { return true }
                        match else_block {
                            some(eb) => { if body_contains_try_or_handle(eb) { return true } },
                            none => {},
                        }
                    },
                    _ => {},
                }
            }
            match tail {
                some(t) => body_contains_try_or_handle(t),
                none => false,
            }
        },
        HExpr::IfExpr { condition, then_branch, else_branch, .. } => {
            if body_contains_try_or_handle(condition) { return true }
            if body_contains_try_or_handle(then_branch) { return true }
            match else_branch {
                some(eb) => body_contains_try_or_handle(eb),
                none => false,
            }
        },
        HExpr::MatchExpr { scrutinee, arms, .. } => {
            if body_contains_try_or_handle(scrutinee) { return true }
            for arm in arms {
                if body_contains_try_or_handle(arm.body) { return true }
                match arm.guard {
                    some(g) => { if body_contains_try_or_handle(g) { return true } },
                    none => {},
                }
            }
            false
        },
        HExpr::Call { callee, args, .. } => {
            if body_contains_try_or_handle(callee) { return true }
            for a in args {
                if body_contains_try_or_handle(a) { return true }
            }
            false
        },
        HExpr::Lambda { body, .. } => body_contains_try_or_handle(body),
        HExpr::BinOp { left, right, .. } => {
            body_contains_try_or_handle(left) || body_contains_try_or_handle(right)
        },
        HExpr::UnaryOp { operand, .. } => body_contains_try_or_handle(operand),
        HExpr::FieldAccess { receiver, .. } => body_contains_try_or_handle(receiver),
        HExpr::IndexExpr { receiver, index, .. } => {
            body_contains_try_or_handle(receiver) || body_contains_try_or_handle(index)
        },
        HExpr::StringInterp { parts, .. } => {
            for p in parts {
                match p {
                    HStringInterpPart::Expression(e) => {
                        if body_contains_try_or_handle(e) { return true }
                    },
                    HStringInterpPart::Literal(_) => {},
                }
            }
            false
        },
        HExpr::ReturnExpr { value, .. } => {
            match value {
                some(v) => body_contains_try_or_handle(v),
                none => false,
            }
        },
        HExpr::Clone { inner, .. } => body_contains_try_or_handle(inner),
        _ => false,
    }
}

fn apply_fn_attributes(ctx: LlvmCtx, fn_val: LLVMValueRef, params: List<HParam>, effects: EffectRow, body: HExpr?) {
    // nounwind: function-level attribute if no fail effect.
    // Functions with fail effect may longjmp, so they can unwind.
    // Defensive guard: even if declared effects don't include fail, a body
    // containing TryCatch or HandleExpr generates _setjmp calls — marking
    // such a function nounwind lets LLVM O2 break setjmp/longjmp semantics.
    let has_setjmp = match body {
        some(b) => body_contains_try_or_handle(b),
        none => false,
    }
    if has_fail_effect(effects) == false && has_setjmp == false {
        let nounwind_kind = LLVMGetEnumAttributeKindForName("nounwind", 8)
        if nounwind_kind > 0 {
            let nounwind_attr = LLVMCreateEnumAttribute(ctx.context, nounwind_kind, 0)
            // attr_index -1 = LLVMAttributeFunctionIndex
            LLVMAddAttributeAtIndex(fn_val, 0 - 1, nounwind_attr)
        }
    }

    // nonnull: per-parameter attribute for non-Option params
    // In uniform boxing, all Ring values are pointers. Non-Option values are
    // guaranteed non-null (Int/Bool use tagged pointers which are still non-null).
    let nonnull_kind = LLVMGetEnumAttributeKindForName("nonnull", 6)
    if nonnull_kind > 0 {
        let nonnull_attr = LLVMCreateEnumAttribute(ctx.context, nonnull_kind, 0)
        let mut idx = 0
        for p in params {
            if is_option_type(p.ty) == false {
                // LLVM param indices start at 1 (0 = return value)
                LLVMAddAttributeAtIndex(fn_val, idx + 1, nonnull_attr)
            }
            idx = idx + 1
        }
    }
}

fn forward_declare_fn(mut ctx: LlvmCtx, name: Str, params: List<HParam>, effects: EffectRow, trait_bounds: List<TraitBound>, prefix: Str?, body: HExpr?) {
    let mangled = match prefix {
        some(p) => llvm_mangle_fn_with_prefix(p, name),
        none => llvm_mangle_fn(name),
    }
    forward_declare_fn_with_name(ctx, mangled, name, params, effects, trait_bounds, body)
}

fn forward_declare_fn_with_name(mut ctx: LlvmCtx, mangled: Str, name: Str, params: List<HParam>, effects: EffectRow, trait_bounds: List<TraitBound>, body: HExpr?) {
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

    // Dedup: skip if already declared (multi-module imports can re-declare).
    // Map.insert drops old value, but LLVMValueRef is extern — ring_drop would
    // free a non-Ring pointer → heap corruption.
    if ctx.functions.get(mangled).is_some() {
        return
    }

    // Return type is always ptr (uniform boxing)
    let fn_ty = LLVMFunctionType(ptr, param_types, 0)
    let fn_val = LLVMAddFunction(ctx.module, mangled, fn_ty)

    // B-117: apply nonnull / nounwind attributes
    apply_fn_attributes(ctx, fn_val, params, effective_effects, body)

    ctx.functions.insert(mangled, fn_val)
    ctx.fn_types.insert(mangled, fn_ty)
}

// ============================================================
// B-099: forward_declare_extern_fn — declare LLVM-C extern fn with C-ABI types
// ============================================================
//
// When --target=llvm compiles the compiler itself to native, LLVM-C extern fns
// (LLVMBuildRet, etc.) must be declared with their real C-ABI signatures rather
// than uniform boxing.  This function:
//   1. Translates each Ring param type to C-ABI LLVM type(s)
//   2. Emits an LLVMAddFunction with the C-ABI signature
//   3. Stores an ExternFnInfo with per-param marshalling descriptors
//   4. The info is consulted at call sites (gen_direct_call) to emit marshalling

fn is_extern_type_ref(ty: Type, ctx: LlvmCtx) -> Bool {
    match ty {
        Type::StructType { name, type_params } => {
            type_params.len() == 0 && ctx.extern_types.contains(name)
        },
        _ => false,
    }
}

fn is_list_type(ty: Type) -> Bool {
    match ty {
        Type::StructType { name, type_params } => {
            name == "List" && type_params.len() >= 1
        },
        _ => false,
    }
}

fn forward_declare_extern_fn(mut ctx: LlvmCtx, name: Str, params: List<HParam>, return_type: Type) {
    // Skip extern fns that are already declared as runtime fns (print, panic, etc.)
    // — those use the Ring uniform-boxing ABI via ring_runtime.cpp.
    // Only LLVM-C functions (starting with "LLVM") need C-ABI declarations.
    if !name.starts_with("LLVM") {
        return
    }

    // Also skip if already declared (multiple modules re-declare the same extern fns)
    if ctx.extern_fn_infos.get(name).is_some() {
        return
    }

    let ptr = ctx.ptr_type
    let i32_ty = ctx.i32_type
    let i64_ty = ctx.i64_type
    let void_ty = ctx.void_type
    let dbl_ty = ctx.double_type

    // Build C-ABI parameter types and marshalling descriptors
    let mut c_param_types: List<LLVMTypeRef> = []
    let mut param_marshalls: List<ExternParamMarshall> = []

    // Special-case: LLVMConstStringInContext has a Str param that needs
    // (cstr, len) expansion (the addon inserts the length automatically)
    let is_const_string = name == "LLVMConstStringInContext"

    for p in params {
        let ty = p.ty
        if is_extern_type_ref(ty, ctx) {
            // Opaque extern type ref → ptr passthrough
            c_param_types.push(ptr)
            param_marshalls.push(ExternParamMarshall::PassthroughPtr)
        } else {
            match ty {
                Type::StrType => {
                    if is_const_string && p.name == "str" {
                        // Special: LLVMConstStringInContext str → (cstr, len)
                        c_param_types.push(ptr)    // const char*
                        c_param_types.push(i32_ty) // unsigned len
                        param_marshalls.push(ExternParamMarshall::StrToCstrAndLen)
                    } else {
                        // Normal Str → const char*
                        c_param_types.push(ptr)
                        param_marshalls.push(ExternParamMarshall::StrToCstr)
                    }
                },
                Type::IntType => {
                    // Most LLVM-C APIs use unsigned/int (32-bit) for Int params.
                    // Exceptions that use uint64_t / int64_t / size_t:
                    let needs_i64 = (name == "LLVMConstInt" && p.name == "val")
                        || (name == "LLVMArrayType2" && p.name == "count")
                        || (name == "LLVMGetEnumAttributeKindForName" && p.name == "s_len")
                        || (name == "LLVMCreateEnumAttribute" && p.name == "val")
                    if needs_i64 {
                        c_param_types.push(i64_ty)
                        param_marshalls.push(ExternParamMarshall::IntToI64)
                    } else {
                        c_param_types.push(i32_ty)
                        param_marshalls.push(ExternParamMarshall::IntToI32)
                    }
                },
                Type::FloatType => {
                    c_param_types.push(dbl_ty)
                    param_marshalls.push(ExternParamMarshall::FloatToDouble)
                },
                _ => {
                    // Check for List<T> — expands to (T*, count)
                    if is_list_type(ty) {
                        c_param_types.push(ptr)    // T* data
                        // LLVMConstArray2 uses uint64_t for count; most others use unsigned
                        if name == "LLVMConstArray2" {
                            c_param_types.push(i64_ty)
                            param_marshalls.push(ExternParamMarshall::ListToDataAndCountI64)
                        } else {
                            c_param_types.push(i32_ty)
                            param_marshalls.push(ExternParamMarshall::ListToDataAndCount)
                        }
                    } else {
                        // Unknown type — treat as passthrough ptr (covers any
                        // remaining opaque types the StructType match didn't catch)
                        c_param_types.push(ptr)
                        param_marshalls.push(ExternParamMarshall::PassthroughPtr)
                    }
                },
            }
        }
    }

    // Determine C return type and marshalling
    let mut ret_marshall = ExternRetMarshall::RetPtr
    let mut c_ret_type = ptr

    match return_type {
        Type::UnitType => {
            c_ret_type = void_ty
            ret_marshall = ExternRetMarshall::RetVoid
        },
        Type::IntType => {
            // C functions returning int/LLVMBool → i32
            c_ret_type = i32_ty
            ret_marshall = ExternRetMarshall::RetIntToBoxed
        },
        Type::StrType => {
            // C functions returning const char* (e.g. LLVMPrintModuleToString)
            c_ret_type = ptr
            ret_marshall = ExternRetMarshall::RetStrFromCstr
        },
        _ => {
            // Opaque ref (extern type) or any other — ptr passthrough
            c_ret_type = ptr
            ret_marshall = ExternRetMarshall::RetPtr
        },
    }

    // Special handling for output-param functions — these have different
    // actual C signatures from what Ring declares.
    let is_special = if name == "LLVMGetTargetFromTriple" { "LLVMGetTargetFromTriple" }
        else { if name == "LLVMTargetMachineEmitToFile" { "LLVMTargetMachineEmitToFile" }
        else { if name == "LLVMVerifyModule" { "LLVMVerifyModule" }
        else { if name == "LLVMRunPasses" { "LLVMRunPasses" }
        else { if name == "LLVMAddIncoming" { "LLVMAddIncoming" }
        else { "" } } } } }

    if is_special == "LLVMGetTargetFromTriple" {
        // C: LLVMBool LLVMGetTargetFromTriple(const char*, LLVMTargetRef*, char**)
        // Ring: (triple: Str) -> LLVMTargetRef
        // We build the real C signature.
        let real_param_types: List<LLVMTypeRef> = [ptr, ptr, ptr]  // cstr, target*, error*
        let real_ret = i32_ty  // LLVMBool
        let fn_ty = LLVMFunctionType(real_ret, real_param_types, 0)
        let fn_val = LLVMAddFunction(ctx.module, name, fn_ty)
        ctx.extern_fn_infos.insert(name, ExternFnInfo {
            c_fn_val: fn_val,
            c_fn_type: fn_ty,
            param_marshalls: param_marshalls,
            ret_marshall: ret_marshall,
            is_special: is_special
        })
        return
    }

    if is_special == "LLVMTargetMachineEmitToFile" {
        // C: LLVMBool LLVMTargetMachineEmitToFile(TM, Module, char*, FileType, char**)
        // Ring: (tm, m, filename: Str, file_type: Int) -> Int
        // The actual C sig has an extra char** error output param.
        let real_param_types: List<LLVMTypeRef> = [ptr, ptr, ptr, i32_ty, ptr]
        let real_ret = i32_ty
        let fn_ty = LLVMFunctionType(real_ret, real_param_types, 0)
        let fn_val = LLVMAddFunction(ctx.module, name, fn_ty)
        ctx.extern_fn_infos.insert(name, ExternFnInfo {
            c_fn_val: fn_val,
            c_fn_type: fn_ty,
            param_marshalls: param_marshalls,
            ret_marshall: ret_marshall,
            is_special: is_special
        })
        return
    }

    if is_special == "LLVMVerifyModule" {
        // C: LLVMBool LLVMVerifyModule(LLVMModuleRef, Action, char**)
        // Ring: (module, action: Int) -> Int
        let real_param_types: List<LLVMTypeRef> = [ptr, i32_ty, ptr]
        let real_ret = i32_ty
        let fn_ty = LLVMFunctionType(real_ret, real_param_types, 0)
        let fn_val = LLVMAddFunction(ctx.module, name, fn_ty)
        ctx.extern_fn_infos.insert(name, ExternFnInfo {
            c_fn_val: fn_val,
            c_fn_type: fn_ty,
            param_marshalls: param_marshalls,
            ret_marshall: ret_marshall,
            is_special: is_special
        })
        return
    }

    if is_special == "LLVMRunPasses" {
        // C: LLVMErrorRef LLVMRunPasses(Module, const char* passes, TM, Options)
        // Ring: (m, passes: Str, tm, opts) -> Int
        // LLVMErrorRef is a pointer (NULL on success). The addon returns 0/1.
        let real_param_types: List<LLVMTypeRef> = [ptr, ptr, ptr, ptr]  // module, cstr, tm, opts
        let real_ret = ptr  // LLVMErrorRef = void*
        let fn_ty = LLVMFunctionType(real_ret, real_param_types, 0)
        let fn_val = LLVMAddFunction(ctx.module, name, fn_ty)
        ctx.extern_fn_infos.insert(name, ExternFnInfo {
            c_fn_val: fn_val,
            c_fn_type: fn_ty,
            param_marshalls: param_marshalls,
            ret_marshall: ret_marshall,
            is_special: is_special
        })
        return
    }

    if is_special == "LLVMAddIncoming" {
        // C: void LLVMAddIncoming(LLVMValueRef Phi, LLVMValueRef* Vals, LLVMBasicBlockRef* Blocks, unsigned Count)
        // Ring: (phi, vals: List<LLVMValueRef>, blocks: List<LLVMBasicBlockRef>) -> Unit
        // Two Lists share ONE count — must not emit two separate counts.
        let real_param_types: List<LLVMTypeRef> = [ptr, ptr, ptr, i32_ty]
        let real_ret = void_ty
        let fn_ty = LLVMFunctionType(real_ret, real_param_types, 0)
        let fn_val = LLVMAddFunction(ctx.module, name, fn_ty)
        ctx.extern_fn_infos.insert(name, ExternFnInfo {
            c_fn_val: fn_val,
            c_fn_type: fn_ty,
            param_marshalls: param_marshalls,
            ret_marshall: ExternRetMarshall::RetVoid,
            is_special: is_special
        })
        return
    }

    // Normal extern fn — use the computed C-ABI types
    let fn_ty = LLVMFunctionType(c_ret_type, c_param_types, 0)
    let fn_val = LLVMAddFunction(ctx.module, name, fn_ty)
    ctx.extern_fn_infos.insert(name, ExternFnInfo {
        c_fn_val: fn_val,
        c_fn_type: fn_ty,
        param_marshalls: param_marshalls,
        ret_marshall: ret_marshall,
        is_special: ""
    })
}

// ============================================================
// forward_declare_enum_ctors — declare enum variant constructors in first pass
// ============================================================

fn forward_declare_enum_ctors(mut ctx: LlvmCtx, name: Str, variants: List<HEnumVariant>) {
    let ptr = ctx.ptr_type
    for v in variants {
        let ctor_name = "ring_${name}_${v.name}"
        if ctx.functions.get(ctor_name).is_some() {
            continue
        }
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
    option_variants.insert("some", EnumVariantInfo { tag: 0, field_count: 1, field_names: ["value"], field_rc_skip: [false] })
    option_variants.insert("none", EnumVariantInfo { tag: 1, field_count: 0, field_names: [], field_rc_skip: [] })
    ctx.enum_types.insert("Option", EnumTypeInfo {
        variants: option_variants, max_fields: 1, llvm_type: option_ty
    })

    // Option_some: (ptr) -> ptr
    let some_fn_ty = LLVMFunctionType(ptr, [ptr], 0)
    let some_fn = LLVMAddFunction(ctx.module, "ring_Option_some", some_fn_ty)
    ctx.functions.insert("ring_Option_some", some_fn)
    ctx.fn_types.insert("ring_Option_some", some_fn_ty)

    // Option_none: () -> ptr
    // B-104 D6 (#153): DECLARATION ONLY — the body lives in ring_runtime.cpp,
    // which returns the lazy memoised none SINGLETON (never-drop typeid
    // OPTION_NONE), mirroring the JS backend's frozen module-level Option_none.
    // Pre-D6 a body was emitted here that ring_alloc'd a fresh tag-1 OPTION per
    // call — D5 measured it at 64.2M live=born=100% @2.382B self-compile
    // (nothing ever drops a none: HIR/perceus treat `none` as a borrow of a
    // module singleton, which is now what every call site actually gets).
    let none_fn_ty = LLVMFunctionType(ptr, [], 0)
    let none_fn = LLVMAddFunction(ctx.module, "ring_Option_none", none_fn_ty)
    ctx.functions.insert("ring_Option_none", none_fn)
    ctx.fn_types.insert("ring_Option_none", none_fn_ty)

    // Generate Option_some body
    let some_entry = LLVMAppendBasicBlockInContext(ctx.context, some_fn, "entry")
    LLVMPositionBuilderAtEnd(ctx.builder, some_entry)
    let some_size = LLVMSizeOf(option_ty)
    let alloc_fn = get_or_declare_runtime_fn(ctx, "ring_alloc", [ctx.i64_type, ctx.i64_type], ptr)
    let alloc_ty = get_rt_fn_type(ctx, "ring_alloc")
    let option_typeid = LLVMConstInt(i64, 8, 0)  // RING_TYPEID_OPTION
    let some_ptr = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [some_size, option_typeid], "opt")
    let some_tag_ptr = LLVMBuildStructGEP2(ctx.builder, option_ty, some_ptr, 0, "tag")
    discard(LLVMBuildStore(ctx.builder, LLVMConstInt(i64, 0, 0), some_tag_ptr))
    let some_val_ptr = LLVMBuildStructGEP2(ctx.builder, option_ty, some_ptr, 1, "val")
    discard(LLVMBuildStore(ctx.builder, LLVMGetParam(some_fn, 0), some_val_ptr))
    discard(LLVMBuildRet(ctx.builder, some_ptr))

    // (no Option_none body — see the D6 declaration note above)

    // Result<T, E>: { Ok(T), Err(E) } → { i64 tag, ptr payload }
    let result_ty = LLVMStructTypeInContext(ctx.context, [i64, ptr], 0)
    let mut result_variants: Map<Str, EnumVariantInfo> = map_new()
    result_variants.insert("Ok", EnumVariantInfo { tag: 0, field_count: 1, field_names: ["value"], field_rc_skip: [false] })
    result_variants.insert("Err", EnumVariantInfo { tag: 1, field_count: 1, field_names: ["value"], field_rc_skip: [false] })
    ctx.enum_types.insert("Result", EnumTypeInfo {
        variants: result_variants, max_fields: 1, llvm_type: result_ty
    })

    // Result_Ok and Result_Err constructors
    let result_tid = get_or_assign_typeid(ctx, "Result")
    let result_typeid = LLVMConstInt(i64, result_tid, 0)
    let ok_fn_ty = LLVMFunctionType(ptr, [ptr], 0)
    let ok_fn = LLVMAddFunction(ctx.module, "ring_Result_Ok", ok_fn_ty)
    ctx.functions.insert("ring_Result_Ok", ok_fn)
    ctx.fn_types.insert("ring_Result_Ok", ok_fn_ty)
    let ok_entry = LLVMAppendBasicBlockInContext(ctx.context, ok_fn, "entry")
    LLVMPositionBuilderAtEnd(ctx.builder, ok_entry)
    let ok_ptr = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [LLVMSizeOf(result_ty), result_typeid], "res")
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
    let err_ptr = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [LLVMSizeOf(result_ty), result_typeid], "res")
    let err_tag_ptr = LLVMBuildStructGEP2(ctx.builder, result_ty, err_ptr, 0, "tag")
    discard(LLVMBuildStore(ctx.builder, LLVMConstInt(i64, 1, 0), err_tag_ptr))
    let err_val_ptr = LLVMBuildStructGEP2(ctx.builder, result_ty, err_ptr, 1, "val")
    discard(LLVMBuildStore(ctx.builder, LLVMGetParam(err_fn, 0), err_val_ptr))
    discard(LLVMBuildRet(ctx.builder, err_ptr))
}

// ============================================================
// compute_transitive_effect_closure — propagate effects through call graph
// B-089 G-b: mirrors codegen.ring:108-151 (JS backend had this, LLVM didn't)
// ============================================================

fn compute_transitive_effect_closure(decls: List<HDecl>, mut local_fn_effects: Map<Str, EffectRow>) {
    if local_fn_effects.len() == 0 { return }
    let mut local_names: Set<Str> = set_new()
    collect_local_names_rec(decls, local_names)
    let mut fn_callees: Map<Str, Set<Str>> = map_new()
    collect_fn_callees(decls, local_names, fn_callees)
    let mut changed = true
    while changed {
        changed = false
        let mut sorted_callees = fn_callees.entries()
        sorted_callees.sort_by(compare_by_first)
        for entry in sorted_callees {
            let (name, callees) = entry
            let mut sorted_callee_names = callees.to_list()
            sorted_callee_names.sort()
            for callee in sorted_callee_names {
                match local_fn_effects.get(callee) {
                    some(callee_effects) => {
                        match local_fn_effects.get(name) {
                            none => {
                                let mut effs: List<Effect> = []
                                for e in callee_effects.effects { effs.push(e) }
                                local_fn_effects.insert(name, EffectRow { effects: effs, tail: none })
                                changed = true
                            },
                            some(current) => {
                                for e in callee_effects.effects {
                                    let ename = effect_kind_name(e)
                                    let mut found = false
                                    for ce in current.effects {
                                        if effect_kind_name(ce) == ename { found = true }
                                    }
                                    if found == false {
                                        current.effects.push(e)
                                        changed = true
                                    }
                                }
                            },
                        }
                    },
                    none => {},
                }
            }
        }
    }
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
            HDecl::Impl { target_type, methods, .. } => {
                for m in methods {
                    match m {
                        HDecl::Fn { name: mn, effects: me, .. } => {
                            if me.effects.len() > 0 {
                                // #177: use qualified key to avoid collision between
                                // same-named methods in different impl blocks.
                                let key = "${target_type}_${mn}"
                                local_fn_effects.insert(key, me)
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

fn scan_trait_decls(decls: List<HDecl>, mut trait_method_order: Map<Str, List<Str>>, mut trait_supertraits: Map<Str, List<Str>>) {
    for decl in decls {
        match decl {
            HDecl::Trait { name, methods, supertraits, .. } => {
                let mut method_names: List<Str> = []
                for m in methods {
                    method_names.push(m.name)
                }
                trait_method_order.insert(name, method_names)
                trait_supertraits.insert(name, supertraits)
            },
            HDecl::ModBlock { decls: md, .. } => {
                scan_trait_decls(md, trait_method_order, trait_supertraits)
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
        trait_method_order.insert("Ord", ["cmp"])
    }
    if trait_method_order.get("Debug").is_none() {
        trait_method_order.insert("Debug", ["debug"])
    }
}

// Collect all transitive supertraits for a given trait. Mirrors the JS
// backend's collect_all_supertraits_codegen: if Top: Mid and Mid: Base,
// returns ["Mid", "Base"] for "Top".
pub fn collect_all_supertraits_llvm(ctx: LlvmCtx, trait_name: Str) -> List<Str> {
    let mut result: List<Str> = []
    let mut visited: Set<Str> = set_new()
    let mut stack: List<Str> = []
    match ctx.trait_supertraits.get(trait_name) {
        some(supers) => {
            for st in supers { stack.push(st) }
        },
        none => {},
    }
    while stack.len() > 0 {
        let current = stack.pop().unwrap()
        if visited.contains(current) { continue }
        visited.insert(current)
        result.push(current)
        match ctx.trait_supertraits.get(current) {
            some(parent_supers) => {
                for ps in parent_supers { stack.push(ps) }
            },
            none => {},
        }
    }
    result
}

// B-090: collect each effect's ops in declaration order into the registry so
// gen_handle_expr (evidence-struct construction) and gen_effect_op (dispatch)
// agree on slot layout via effect_op_slot. Mirrors the JS backend's
// emit_effect_decl(ctx.effect_ops.insert). Recurses into ModBlocks like the
// other scan passes.
fn register_effect_ops_llvm(decls: List<HDecl>, mut effect_ops: Map<Str, List<HEffectOp>>) {
    for decl in decls {
        match decl {
            HDecl::Effect { name, ops, .. } => {
                effect_ops.insert(name, ops)
            },
            HDecl::ModBlock { decls: md, .. } => {
                register_effect_ops_llvm(md, effect_ops)
            },
            _ => {},
        }
    }
}

// ============================================================
// scan_fn_mut_params — collect per-function mut value-type param flags (#B-087 gap 5)
// ============================================================

// A value type (Int/Float/Bool/Str) is the only kind a `mut` param boxes into a CELL.
// Reference types (List/Map/Set/struct/enum) already share via the ptr, so a mut on
// them needs no cell. Mirrors codegen.ring's is_codegen_value_type.
fn llvm_is_value_type(t: Type) -> Bool {
    match t {
        Type::IntType => true,
        Type::FloatType => true,
        Type::BoolType => true,
        Type::StrType => true,
        _ => false,
    }
}

fn mut_param_flags(params: List<HParam>) -> List<Bool> {
    let mut flags: List<Bool> = []
    for p in params {
        // self and non-mut params are never boxed; only mut value-type params are.
        if p.name == "self" || !p.is_mutable {
            flags.push(false)
        } else {
            flags.push(llvm_is_value_type(p.ty))
        }
    }
    flags
}

fn scan_fn_mut_params_llvm(decls: List<HDecl>, mut fn_mut_params: Map<Str, List<Bool>>) {
    for decl in decls {
        match decl {
            HDecl::Fn { name, params, .. } => {
                fn_mut_params.insert(name, mut_param_flags(params))
            },
            HDecl::Impl { target_type, methods, .. } => {
                for m in methods {
                    match m {
                        HDecl::Fn { name: mn, params: mp, .. } => {
                            // UFCS key (Type_method) for method-call dispatch lookup.
                            let ufcs_name = "${target_type}_${mn}"
                            fn_mut_params.insert(ufcs_name, mut_param_flags(mp))
                        },
                        _ => {},
                    }
                }
            },
            HDecl::ModBlock { decls: md, .. } => {
                scan_fn_mut_params_llvm(md, fn_mut_params)
            },
            _ => {},
        }
    }
}

// ============================================================
// emit_drop_functions — generate per-type drop_T functions and register them
// ============================================================

fn emit_drop_functions(mut ctx: LlvmCtx) {
    let ptr = ctx.ptr_type
    let i64 = ctx.i64_type
    let void = ctx.void_type

    let drop_fn = get_or_declare_runtime_fn(ctx, "ring_drop", [ptr], void)
    let drop_ty = get_rt_fn_type(ctx, "ring_drop")
    let register_fn = get_or_declare_runtime_fn(ctx, "ring_register_drop", [i64, ptr], void)
    let register_ty = get_rt_fn_type(ctx, "ring_register_drop")

    // Generate drop functions for user structs
    let mut struct_names = ctx.struct_types.keys()
    struct_names.sort()
    for sname in struct_names {
        // B-102 R-clean: Type-DAG structs get a normal recursive ring_drop_T
        // (per-field GEP + ring_drop), so the Type DAG is reclaimed by RC like any
        // other data.  (A1's never-drop skip is removed.)
        match ctx.struct_types.get(sname) {
            some(info) => {
                let drop_name = "ring_drop_${sname}"
                // drop_T: (ptr) -> void
                let fn_ty = LLVMFunctionType(void, [ptr], 0)
                let fn_val = LLVMAddFunction(ctx.module, drop_name, fn_ty)

                let saved_fn = ctx.current_fn
                ctx.current_fn = some(fn_val)
                let entry = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "entry")
                LLVMPositionBuilderAtEnd(ctx.builder, entry)

                let data_ptr = LLVMGetParam(fn_val, 0)

                // For each field, GEP + load + ring_drop.
                // B-104 D1 rule ① (audit #139): skip fields whose Ring type is
                // (or transitively contains) an extern handle — ring_drop on a
                // raw foreign pointer reads a garbage header / frees foreign
                // memory (LlvmCtx.builder, .named_values : Map<Str, LLVMValueRef>,
                // .current_fn : LLVMValueRef?, …).  Leak instead (crash-free;
                // foreign handles are owned by the foreign API).
                for i in 0..info.field_names.len() {
                    let skip = match info.field_rc_skip.get(i) { some(s) => s, none => false }
                    if skip == false {
                        let field_ptr = LLVMBuildStructGEP2(ctx.builder, info.llvm_type, data_ptr, i, fresh_name(ctx, "fp"))
                        let field_val = LLVMBuildLoad2(ctx.builder, ptr, field_ptr, fresh_name(ctx, "fv"))
                        discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [field_val], ""))
                    }
                }

                discard(LLVMBuildRetVoid(ctx.builder))
                ctx.current_fn = saved_fn

                // Register: ring_register_drop(typeid, drop_fn_ptr)
                let tid = get_or_assign_typeid(ctx, sname)
                let tid_val = LLVMConstInt(i64, tid, 0)
                // Registration calls are emitted into a global init function below
                ctx.dict_globals.insert(drop_name, fn_val)
            },
            none => {},
        }
    }

    // Generate drop functions for user enums
    let mut enum_names = ctx.enum_types.keys()
    enum_names.sort()
    for ename in enum_names {
        // Skip built-in enums (Option, Result) — they use generic ring_drop recursion
        if ename == "Option" { continue }
        if ename == "Result" { continue }
        // B-102 R-clean: Type-DAG enums (Type / Effect / EffectRow) get a normal
        // recursive ring_drop_T (per-variant per-field ring_drop).  (A1's
        // never-drop skip is removed.)

        match ctx.enum_types.get(ename) {
            some(enum_info) => {
                let drop_name = "ring_drop_${ename}"
                let fn_ty = LLVMFunctionType(void, [ptr], 0)
                let fn_val = LLVMAddFunction(ctx.module, drop_name, fn_ty)

                let saved_fn = ctx.current_fn
                ctx.current_fn = some(fn_val)
                let entry = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "entry")
                LLVMPositionBuilderAtEnd(ctx.builder, entry)

                let data_ptr = LLVMGetParam(fn_val, 0)

                // Read tag (field 0)
                let tag_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, data_ptr, 0, "tag_ptr")
                let tag_val = LLVMBuildLoad2(ctx.builder, i64, tag_ptr, "tag")

                // Build switch over variants
                let done_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "done")
                let default_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "default")

                // Collect variant info to build switch
                let mut variant_keys = enum_info.variants.keys()
                variant_keys.sort()
                let num_variants = variant_keys.len()

                if num_variants == 0 {
                    discard(LLVMBuildBr(ctx.builder, done_bb))
                } else {
                    let switch_val = LLVMBuildSwitch(ctx.builder, tag_val, default_bb, num_variants)
                    for vname in variant_keys {
                        match enum_info.variants.get(vname) {
                            some(vi) => {
                                let variant_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "v_${vname}")
                                LLVMAddCase(switch_val, LLVMConstInt(i64, vi.tag, 0), variant_bb)

                                LLVMPositionBuilderAtEnd(ctx.builder, variant_bb)
                                // Drop each field (fields start at index 1 in the enum struct).
                                // B-104 D1 rule ①: skip extern-containing payload
                                // fields (same rationale as the struct loop above).
                                for fi in 0..vi.field_count {
                                    let skip = match vi.field_rc_skip.get(fi) { some(s) => s, none => false }
                                    if skip == false {
                                        let fp = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, data_ptr, fi + 1, fresh_name(ctx, "efp"))
                                        let fv = LLVMBuildLoad2(ctx.builder, ptr, fp, fresh_name(ctx, "efv"))
                                        discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [fv], ""))
                                    }
                                }
                                discard(LLVMBuildBr(ctx.builder, done_bb))
                            },
                            none => {},
                        }
                    }
                }

                // Default: just branch to done
                LLVMPositionBuilderAtEnd(ctx.builder, default_bb)
                discard(LLVMBuildBr(ctx.builder, done_bb))

                LLVMPositionBuilderAtEnd(ctx.builder, done_bb)
                discard(LLVMBuildRetVoid(ctx.builder))
                ctx.current_fn = saved_fn

                ctx.dict_globals.insert(drop_name, fn_val)
            },
            none => {},
        }
    }
}

// emit_drop_registrations — called from C main after runtime init
// Registers all per-type drop functions with the RC runtime.
fn emit_drop_registrations(mut ctx: LlvmCtx) {
    let ptr = ctx.ptr_type
    let i64 = ctx.i64_type
    let void = ctx.void_type

    let register_fn = get_or_declare_runtime_fn(ctx, "ring_register_drop", [i64, ptr], void)
    let register_ty = get_rt_fn_type(ctx, "ring_register_drop")

    // Register struct drop functions
    // B-102 R-clean: Type-DAG types now have a normal recursive drop_T registered
    // here like any other type (A1's never-drop registration is removed).
    let mut struct_names_reg = ctx.struct_types.keys()
    struct_names_reg.sort()
    for sname in struct_names_reg {
        let drop_name = "ring_drop_${sname}"
        match ctx.dict_globals.get(drop_name) {
            some(drop_fn_val) => {
                let tid = get_or_assign_typeid(ctx, sname)
                let tid_val = LLVMConstInt(i64, tid, 0)
                discard(LLVMBuildCall2(ctx.builder, register_ty, register_fn, [tid_val, drop_fn_val], ""))
            },
            none => {},
        }
    }

    // Register enum drop functions
    let mut enum_names_reg = ctx.enum_types.keys()
    enum_names_reg.sort()
    for ename in enum_names_reg {
        if ename == "Option" { continue }
        if ename == "Result" { continue }
        let drop_name = "ring_drop_${ename}"
        match ctx.dict_globals.get(drop_name) {
            some(drop_fn_val) => {
                let tid = get_or_assign_typeid(ctx, ename)
                let tid_val = LLVMConstInt(i64, tid, 0)
                discard(LLVMBuildCall2(ctx.builder, register_ty, register_fn, [tid_val, drop_fn_val], ""))
            },
            none => {},
        }
    }
}

// ============================================================
// emit_c_main_common — shared C main() body for single-file
// and multi-module entry points (#201)
// ============================================================

fn emit_c_main_common(mut ctx: LlvmCtx, ring_main_name: Str, warn_no_main: Bool) {
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

    // Register per-type drop functions with RC runtime
    emit_drop_registrations(ctx)

    // B-100 Fix 2: pre-populate derived dict globals before Ring code runs.
    // Lazy getters (ring_dict_init___<name>) check `if @g == null { ... }`;
    // by storing the proper dict now, we prevent them from falling through
    // to ring_get_builtin_dict (tag-only comparison).
    for ddb in ctx.derived_dict_builds {
        let (dict_global, dfn, dfn_ty) = ddb
        let built = LLVMBuildCall2(ctx.builder, dfn_ty, dfn, [], "ddb")
        discard(LLVMBuildStore(ctx.builder, built, dict_global))
    }

    // B-097: build default evidence structs (needs a function context for gen_lambda)
    ctx.current_fn = some(main_fn)
    ctx.current_fn_name = "main"
    build_default_evidence_all(ctx)

    // Call ring_main() — find it in our functions map
    match ctx.functions.get(ring_main_name) {
        some(ring_main_fn) => {
            // Check if ring_main needs evidence params (io, etc.)
            let mut call_args: List<LLVMValueRef> = []
            match ctx.fn_evidence_params.get(ring_main_name) {
                some(ev_params) => {
                    // B-097: pass default evidence for effects that have it,
                    // null for io/fail/unknown effects (runtime handles those)
                    for ep in ev_params {
                        // ep is like "__ring_ev_Logger" — extract effect name
                        let effect_name = ep.slice(10, ep.len())
                        match ctx.default_evidence.get(effect_name) {
                            some(def_ev) => call_args.push(def_ev),
                            none => call_args.push(LLVMConstPointerNull(ptr)),
                        }
                    }
                },
                none => {},
            }
            let ring_main_ty = match ctx.fn_types.get(ring_main_name) {
                some(t) => t,
                none => panic("LLVM codegen: ring_main fn type not found: ${ring_main_name}"),
            }
            discard(LLVMBuildCall2(ctx.builder, ring_main_ty, ring_main_fn, call_args, ""))
        },
        none => {
            if warn_no_main {
                eprintln("Warning: no main function found in entry module")
            }
            // Single-file mode: no main function is OK for library modules
        },
    }

    ctx.current_fn = none
    ctx.current_fn_name = ""

    // return 0
    let zero = LLVMConstInt(i32_ty, 0, 0)
    discard(LLVMBuildRet(ctx.builder, zero))
}

// ============================================================
// emit_c_main — generate C main() wrapper that calls Ring main
// ============================================================

fn emit_c_main(mut ctx: LlvmCtx) {
    let ring_main_name = llvm_mangle_fn("main")
    emit_c_main_common(ctx, ring_main_name, false)
}

// ============================================================
// init_llvm_context — shared LLVM initialization for both
// single-file and multi-module entry points (#191)
// ============================================================

fn init_llvm_context(module_name: Str) -> LlvmCtx {
    // 1. Initialize LLVM target
    LLVMInitializeX86TargetInfo()
    LLVMInitializeX86Target()
    LLVMInitializeX86TargetMC()
    LLVMInitializeX86AsmPrinter()

    // 2. Create context, module, builder
    let context = LLVMContextCreate()
    let module = LLVMModuleCreateWithNameInContext(module_name, context)
    let builder = LLVMCreateBuilderInContext(context)

    // 3. Set target triple and data layout
    let triple = LLVMGetDefaultTargetTriple()
    LLVMSetTarget(module, triple)

    let target = LLVMGetTargetFromTriple(triple)
    // opt=2 (Default), reloc=0 (Default), code_model=0 (Default)
    let tm = LLVMCreateTargetMachine(target, triple, "generic", "", 2, 0, 0)

    // #182: Set data layout from target machine so LLVMSizeOf etc. return
    // correct values for the host target.
    let td = LLVMCreateTargetDataLayout(tm)
    let layout_str = LLVMCopyStringRepOfTargetData(td)
    LLVMSetDataLayout(module, layout_str)
    LLVMDisposeTargetData(td)

    // 4. Cache basic types
    let ptr_type = LLVMPointerTypeInContext(context, 0)
    let i64_type = LLVMInt64TypeInContext(context)
    let i32_type = LLVMInt32TypeInContext(context)
    let i8_type = LLVMInt8TypeInContext(context)
    let i1_type = LLVMInt1TypeInContext(context)
    let void_type = LLVMVoidTypeInContext(context)
    let double_type = LLVMDoubleTypeInContext(context)

    // 5. Build LlvmCtx
    LlvmCtx {
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
        static_dict_defs: map_new(),
        dict_singletons: map_new(),
        trait_method_order: map_new(),
        trait_supertraits: map_new(),
        module_prefix: none,
        imports_map: map_new(),
        local_names: set_new(),
        tmp_counter: 0,
        lambda_counter: 0,
        match_counter: 0,
        current_fn: none,
        current_fn_name: "",
        loop_break_bb: none,
        loop_continue_bb: none,
        next_user_typeid: 64,
        type_to_typeid: map_new(),
        boxed_vars: set_new(),
        fn_mut_params: map_new(),
        effect_ops: map_new(),
        default_evidence: map_new(),
        derived_dict_builds: [],
        extern_types: set_new(),
        extern_fn_infos: map_new(),
        handle_cleanup_stack: []
    }
}

// ============================================================
// finalize_llvm_module — shared finalization pipeline: dump IR,
// verify, optimize, emit object file, cleanup (#191)
// ============================================================

fn finalize_llvm_module(ctx: LlvmCtx, output_path: Str) -> Unit {
    let module = ctx.module
    let tm = ctx.target_machine

    // 1. Dump IR for debugging
    let ir = LLVMPrintModuleToString(module)
    write_file("ring_output.ll", ir)

    // 2. Verify module (action=2: ReturnStatusAction, prints to stderr)
    let verify_result = LLVMVerifyModule(module, 2)
    if verify_result != 0 {
        eprintln("LLVM module verification failed (${verify_result} errors) — attempting emit anyway")
    }

    // 3. Run LLVM optimization passes (B-126)
    let pass_opts = LLVMCreatePassBuilderOptions()
    let pass_result = LLVMRunPasses(module, "default<O2>", tm, pass_opts)
    if pass_result != 0 {
        eprintln("LLVM optimization pass pipeline failed")
    }
    LLVMDisposePassBuilderOptions(pass_opts)

    // 4. Emit object file (file_type: 1 = Object file)
    let emit_result = LLVMTargetMachineEmitToFile(tm, module, output_path, 1)
    if emit_result != 0 {
        eprintln("Failed to emit object file: ${output_path}")
    } else {
        print("Compiled: ${output_path}")
    }

    // 5. Cleanup
    LLVMDisposeBuilder(ctx.builder)
    LLVMDisposeTargetMachine(tm)
    LLVMDisposeModule(module)
    LLVMContextDispose(ctx.context)
}

// ============================================================
// generate_llvm — main entry point (single-file)
// ============================================================

pub fn generate_llvm(program: HProgram, output_path: Str) -> Unit {
    let mut ctx = init_llvm_context("ring_module")

    // B-091: thread the auto-boxed mut-cell def_ids through so Var/read/write
    // codegen routes them through a shared heap cell (write-through capture).
    for did in program.boxed_vars { ctx.boxed_vars.insert(did) }

    // B-144: use program-level extern type names (global set, covers use-imports).
    for en in program.extern_type_names { ctx.extern_types.insert(en) }

    // B-104 D4: static dict singleton definitions (resolve_static_dict_by_name
    // builds wrapped instances from these).
    for sd in program.static_dicts { ctx.static_dict_defs.insert(sd.name, sd) }

    // Register built-in types (Option, Result — not in HDecl, handled by runtime)
    register_builtin_enums(ctx)

    // Scan function effects and trait declarations
    scan_fn_effects(program.decls, ctx.local_fn_effects)
    scan_trait_decls(program.decls, ctx.trait_method_order, ctx.trait_supertraits)
    scan_fn_mut_params_llvm(program.decls, ctx.fn_mut_params)
    // B-090: register effect-op declaration order so gen_handle_expr /
    // gen_effect_op share the evidence-struct slot layout via effect_op_slot.
    register_effect_ops_llvm(program.decls, ctx.effect_ops)

    // Compute transitive effect closure (B-089 G-b: mirrors codegen.ring:108-151)
    compute_transitive_effect_closure(program.decls, ctx.local_fn_effects)

    // Declare runtime functions
    declare_runtime_fns(ctx)

    // First pass: forward declare all Ring functions
    forward_declare_functions(ctx, program.decls)

    // B-100: emit auto-derived trait impls (Eq, Clone, Debug) BEFORE body pass.
    // Method calls in function bodies need ring_<Type>_clone etc. in ctx.functions.
    emit_derived_impls_llvm(ctx, program.derived_impls)

    // Second pass: generate all function bodies
    for decl in program.decls {
        emit_llvm_decl(ctx, decl)
    }

    // Generate per-type drop functions and register them
    emit_drop_functions(ctx)

    // Generate C main() wrapper
    emit_c_main(ctx)

    // Finalize: verify, optimize, emit, cleanup
    finalize_llvm_module(ctx, output_path)
}

// ============================================================
// generate_llvm_project — multi-module entry point
// All modules' HIR merged into a single LLVM Module.
// modules: List of (module_prefix, HProgram) in topo order
// entry_prefix: module prefix of the entry module (contains main)
// ============================================================

pub fn generate_llvm_project(modules: List<(Str, HProgram, List<UseDecl>)>, entry_prefix: Str, output_path: Str) -> Unit {
    let mut ctx = init_llvm_context("ring_project")

    // Register built-in types
    register_builtin_enums(ctx)

    // Scan all modules for function effects and trait declarations
    for m in modules {
        let (prefix, program, _uses) = m
        scan_fn_effects(program.decls, ctx.local_fn_effects)
        scan_trait_decls(program.decls, ctx.trait_method_order, ctx.trait_supertraits)
        scan_fn_mut_params_llvm(program.decls, ctx.fn_mut_params)
        // B-090: register effect-op declaration order (shared by all modules).
        register_effect_ops_llvm(program.decls, ctx.effect_ops)
        // B-144: use program-level extern type names (global set, covers use-imports).
        for en in program.extern_type_names { ctx.extern_types.insert(en) }
        // B-104 D4: union of all modules' static dict singleton definitions.
        // Instance names deterministically encode their structure
        // (dict_instance_name), so same-name entries from different modules are
        // identical — map insert dedupes.
        for sd in program.static_dicts { ctx.static_dict_defs.insert(sd.name, sd) }
        // #134: do NOT union boxed_vars across modules here.  def_ids are minted
        // per-module (each module is checked with a fresh InferCtx whose
        // next_def_id restarts at 0 — see checker.ring::new_infer_ctx), so a
        // global union makes a boxed mut-cell def_id from one module spuriously
        // mark a same-numbered plain local in another (e.g. lexer's `high` param
        // of code_in_range got double-unboxed).  boxed_vars is set per-module in
        // the body-generation pass below instead.
    }

    // Compute transitive effect closure across all modules (B-089 G-b)
    let mut all_decls: List<HDecl> = []
    for m in modules {
        let (_prefix, program, _uses) = m
        for d in program.decls { all_decls.push(d) }
    }
    compute_transitive_effect_closure(all_decls, ctx.local_fn_effects)

    // Declare runtime functions
    declare_runtime_fns(ctx)

    // First pass: forward declare all Ring functions in all modules
    for m in modules {
        let (prefix, program, _uses) = m
        forward_declare_functions_with_prefix(ctx, program.decls, some(prefix))
    }

    // Emit derived impls for all modules (before body pass)
    for m in modules {
        let (prefix, program, _uses) = m
        emit_derived_impls_llvm(ctx, program.derived_impls)
    }

    // Second pass: generate all function bodies for all modules
    for m in modules {
        let (prefix, program, uses) = m
        ctx.module_prefix = some(prefix)
        ctx.boxed_vars = program.boxed_vars
        ctx.local_names = collect_local_names(program.decls)
        ctx.imports_map = build_imports_map(uses)
        for decl in program.decls {
            emit_llvm_decl(ctx, decl)
        }
    }

    // Clear module prefix
    ctx.module_prefix = none

    // Generate per-type drop functions and register them
    emit_drop_functions(ctx)

    // Generate C main() wrapper — look for main in the entry module
    emit_c_main_project(ctx, entry_prefix)

    // Finalize: verify, optimize, emit, cleanup
    finalize_llvm_module(ctx, output_path)
}

// ============================================================
// emit_c_main_project — entry point for multi-module projects
// ============================================================

fn emit_c_main_project(mut ctx: LlvmCtx, entry_prefix: Str) {
    let ring_main_name = llvm_mangle_fn_with_prefix(entry_prefix, "main")
    emit_c_main_common(ctx, ring_main_name, true)
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
            HDecl::Impl { target_type, methods, .. } => {
                for m in methods {
                    match m {
                        HDecl::Fn { name: mn, .. } => {
                            // #177: qualified key matching scan_fn_effects
                            names.insert("${target_type}_${mn}")
                        },
                        _ => {},
                    }
                }
            },
            HDecl::Effect { name, .. } => { names.insert(name) },
            HDecl::ModBlock { decls: md, .. } => { collect_local_names_rec(md, names) },
            HDecl::Test { .. } => {},
            HDecl::Sig { .. } => {},
        }
    }
}
