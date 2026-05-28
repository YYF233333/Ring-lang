use types::{Type, Effect, EffectRow, effect_kind_name}

// Re-declare LLVM opaque types to avoid cross-module ESM import issues.
// These match the declarations in llvm_ffi.ring and unify to the same types.
extern type LLVMContextRef
extern type LLVMModuleRef
extern type LLVMBuilderRef
extern type LLVMTypeRef
extern type LLVMValueRef
extern type LLVMBasicBlockRef
extern type LLVMTargetMachineRef

// Re-declare LLVM functions used by utility functions
extern fn LLVMFunctionType(ret: LLVMTypeRef, params: List<LLVMTypeRef>, is_var_arg: Int) -> LLVMTypeRef
extern fn LLVMAddFunction(m: LLVMModuleRef, name: Str, fn_ty: LLVMTypeRef) -> LLVMValueRef

// ============================================================
// Shared data structures for LLVM codegen
// ============================================================

pub struct StructFieldInfo {
    pub field_names: List<Str>,
    pub llvm_type: LLVMTypeRef
}

pub struct EnumVariantInfo {
    pub tag: Int,
    pub field_count: Int
}

pub struct EnumTypeInfo {
    pub variants: Map<Str, EnumVariantInfo>,
    pub max_fields: Int,
    pub llvm_type: LLVMTypeRef
}

pub struct LlvmCtx {
    pub context: LLVMContextRef,
    pub module: LLVMModuleRef,
    pub builder: LLVMBuilderRef,
    pub target_machine: LLVMTargetMachineRef,

    // Type cache
    pub ptr_type: LLVMTypeRef,
    pub i64_type: LLVMTypeRef,
    pub i32_type: LLVMTypeRef,
    pub i8_type: LLVMTypeRef,
    pub i1_type: LLVMTypeRef,
    pub void_type: LLVMTypeRef,
    pub double_type: LLVMTypeRef,

    // Value mappings
    pub named_values: Map<Str, LLVMValueRef>,
    pub functions: Map<Str, LLVMValueRef>,
    pub fn_types: Map<Str, LLVMTypeRef>,
    pub struct_types: Map<Str, StructFieldInfo>,
    pub enum_types: Map<Str, EnumTypeInfo>,

    // Runtime function cache
    pub rt_fns: Map<Str, LLVMValueRef>,
    pub rt_fn_types: Map<Str, LLVMTypeRef>,

    // Compiler metadata
    pub local_fn_effects: Map<Str, EffectRow>,
    pub fn_evidence_params: Map<Str, List<Str>>,

    // Counters
    pub tmp_counter: Int,

    // Current function being codegen'd
    pub current_fn: LLVMValueRef?
}

// ============================================================
// LLVM name mangling
// ============================================================

pub fn llvm_mangle_fn(name: Str) -> Str {
    "ring_${name}"
}

pub fn llvm_mangle_method(type_name: Str, method_name: Str) -> Str {
    "ring_${type_name}_${method_name}"
}

// ============================================================
// Fresh temporary name
// ============================================================

pub fn fresh_name(mut ctx: LlvmCtx, prefix: Str) -> Str {
    let n = ctx.tmp_counter
    ctx.tmp_counter = ctx.tmp_counter + 1
    "${prefix}${n}"
}

// ============================================================
// get_or_declare_runtime_fn — lazy declaration of runtime functions
// ============================================================

pub fn get_or_declare_runtime_fn(mut ctx: LlvmCtx, name: Str, param_types: List<LLVMTypeRef>, ret_type: LLVMTypeRef) -> LLVMValueRef {
    match ctx.rt_fns.get(name) {
        some(f) => f,
        none => {
            let fn_ty = LLVMFunctionType(ret_type, param_types, 0)
            let fn_val = LLVMAddFunction(ctx.module, name, fn_ty)
            ctx.rt_fns.insert(name, fn_val)
            ctx.rt_fn_types.insert(name, fn_ty)
            fn_val
        },
    }
}

pub fn get_rt_fn_type(ctx: LlvmCtx, name: Str) -> LLVMTypeRef {
    match ctx.rt_fn_types.get(name) {
        some(t) => t,
        none => panic("LLVM codegen: runtime function type not found: ${name}"),
    }
}
