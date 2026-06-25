use types::{Type, EffectRow}
use ast::{TypeParam}
use hir::{HExpr, HStmt, HDecl, HParam, HStructField, HEnumVariant,
    HTraitMethod, TraitBound, HEffectOp,
    DerivedImpl, DerivedField, DerivedVariant, FieldAction, TypeKind,
    evidence_param_name, trait_dict_name, trait_bound_param_name,
    default_method_self_name,
    hexpr_type, hexpr_effects, type_contains_extern_handle}
use codegen_llvm_ctx::{LlvmCtx, StructFieldInfo, EnumTypeInfo, EnumVariantInfo,
    fresh_name, get_or_declare_runtime_fn, get_rt_fn_type,
    llvm_mangle_fn, llvm_mangle_fn_with_prefix, llvm_mangle_method,
    get_or_assign_typeid, RING_TYPEID_DICT_STATIC}
use codegen_llvm_expr::{gen_llvm_expr, emit_memoised_dict_getter, emit_memoised_const_body,
    box_bool, unbox_int, box_int, get_or_create_dict_global, resolve_static_dict_by_name}
use codegen_ctx::{extract_effect_names}

// Collect all transitive supertraits for a given trait. Local copy to avoid
// circular dependency with codegen_llvm.ring.
fn collect_all_supertraits_llvm(ctx: LlvmCtx, trait_name: Str) -> List<Str> {
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
extern fn LLVMCountParams(fn_val: LLVMValueRef) -> Int
extern fn LLVMAppendBasicBlockInContext(ctx: LLVMContextRef, fn_val: LLVMValueRef, name: Str) -> LLVMBasicBlockRef
extern fn LLVMPositionBuilderAtEnd(builder: LLVMBuilderRef, bb: LLVMBasicBlockRef) -> Unit
extern fn LLVMGetInsertBlock(builder: LLVMBuilderRef) -> LLVMBasicBlockRef
extern fn LLVMBuildAlloca(builder: LLVMBuilderRef, ty: LLVMTypeRef, name: Str) -> LLVMValueRef
extern fn LLVMBuildStore(builder: LLVMBuilderRef, val: LLVMValueRef, ptr: LLVMValueRef) -> LLVMValueRef
extern fn LLVMBuildRet(builder: LLVMBuilderRef, val: LLVMValueRef) -> LLVMValueRef
extern fn LLVMBuildUnreachable(builder: LLVMBuilderRef) -> LLVMValueRef
extern fn LLVMBuildCall2(builder: LLVMBuilderRef, fn_ty: LLVMTypeRef, fn_val: LLVMValueRef, args: List<LLVMValueRef>, name: Str) -> LLVMValueRef
extern fn LLVMFunctionType(ret: LLVMTypeRef, params: List<LLVMTypeRef>, is_var_arg: Int) -> LLVMTypeRef
extern fn LLVMAddFunction(m: LLVMModuleRef, name: Str, fn_ty: LLVMTypeRef) -> LLVMValueRef
extern fn LLVMStructTypeInContext(ctx: LLVMContextRef, elems: List<LLVMTypeRef>, packed: Int) -> LLVMTypeRef
extern fn LLVMSizeOf(ty: LLVMTypeRef) -> LLVMValueRef
extern fn LLVMBuildStructGEP2(builder: LLVMBuilderRef, ty: LLVMTypeRef, ptr: LLVMValueRef, index: Int, name: Str) -> LLVMValueRef
extern fn LLVMBuildLoad2(builder: LLVMBuilderRef, ty: LLVMTypeRef, ptr: LLVMValueRef, name: Str) -> LLVMValueRef
extern fn LLVMBuildBr(builder: LLVMBuilderRef, dest: LLVMBasicBlockRef) -> LLVMValueRef
extern fn LLVMBuildCondBr(builder: LLVMBuilderRef, cond: LLVMValueRef, then_bb: LLVMBasicBlockRef, else_bb: LLVMBasicBlockRef) -> LLVMValueRef
extern fn LLVMBuildPhi(builder: LLVMBuilderRef, ty: LLVMTypeRef, name: Str) -> LLVMValueRef
extern fn LLVMAddIncoming(phi: LLVMValueRef, vals: List<LLVMValueRef>, blocks: List<LLVMBasicBlockRef>) -> Unit
extern fn LLVMBuildICmp(builder: LLVMBuilderRef, op: Int, lhs: LLVMValueRef, rhs: LLVMValueRef, name: Str) -> LLVMValueRef
extern fn LLVMBuildFCmp(builder: LLVMBuilderRef, predicate: Int, lhs: LLVMValueRef, rhs: LLVMValueRef, name: Str) -> LLVMValueRef
extern fn LLVMBuildZExt(builder: LLVMBuilderRef, val: LLVMValueRef, dest_ty: LLVMTypeRef, name: Str) -> LLVMValueRef
extern fn LLVMBuildSub(builder: LLVMBuilderRef, lhs: LLVMValueRef, rhs: LLVMValueRef, name: Str) -> LLVMValueRef
extern fn LLVMBuildPtrToInt(builder: LLVMBuilderRef, val: LLVMValueRef, dest_ty: LLVMTypeRef, name: Str) -> LLVMValueRef
extern fn LLVMBuildAnd(builder: LLVMBuilderRef, lhs: LLVMValueRef, rhs: LLVMValueRef, name: Str) -> LLVMValueRef
extern fn LLVMBuildGlobalStringPtr(builder: LLVMBuilderRef, str: Str, name: Str) -> LLVMValueRef
extern fn LLVMBuildShl(builder: LLVMBuilderRef, lhs: LLVMValueRef, rhs: LLVMValueRef, name: Str) -> LLVMValueRef
extern fn LLVMBuildOr(builder: LLVMBuilderRef, lhs: LLVMValueRef, rhs: LLVMValueRef, name: Str) -> LLVMValueRef
extern fn LLVMBuildIntToPtr(builder: LLVMBuilderRef, val: LLVMValueRef, dest_ty: LLVMTypeRef, name: Str) -> LLVMValueRef
extern fn LLVMBuildAShr(builder: LLVMBuilderRef, lhs: LLVMValueRef, rhs: LLVMValueRef, name: Str) -> LLVMValueRef
extern fn LLVMBuildTrunc(builder: LLVMBuilderRef, val: LLVMValueRef, dest_ty: LLVMTypeRef, name: Str) -> LLVMValueRef
extern fn LLVMBuildSwitch(builder: LLVMBuilderRef, val: LLVMValueRef, default_dest: LLVMBasicBlockRef, num_cases: Int) -> LLVMValueRef
extern fn LLVMAddCase(switch_val: LLVMValueRef, on_val: LLVMValueRef, dest: LLVMBasicBlockRef) -> Unit

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
            // B-141: generate forwarding stubs for default trait methods that the
            // impl doesn't override. This makes direct calls like cat.greet() work
            // (the compiler may emit these as direct method calls, not dict dispatch).
            // Generate trait dictionary if this is a trait impl, then emit
            // forwarding stubs for default methods (stubs must come AFTER dict
            // so resolve_static_dict_by_name finds the proper memoised getter,
            // not the ring_get_builtin_dict fallback).
            match trait_name {
                some(tn) => {
                    emit_trait_dict(ctx, target_type, tn, methods)
                    emit_default_method_stubs(ctx, target_type, tn, methods)
                },
                none => {},
            }
        },
        HDecl::Effect { .. } => {
            // Effect declarations don't generate code directly
        },
        HDecl::Test { .. } => {
            // Tests not compiled in LLVM mode
        },
        HDecl::Trait { name: trait_name, methods: trait_methods, .. } => {
            // B-141: emit LLVM function bodies for default trait methods.
            emit_trait_default_methods(ctx, trait_name, trait_methods)
        },
        HDecl::ExternFn { .. } => {
            // Extern functions are already handled as runtime declarations
        },
        HDecl::ExternType { .. } => {},
        HDecl::TypeAlias { .. } => {},
        HDecl::Const { name, init, .. } => {
            // Generate const as a zero-arg function that returns the init value
            emit_const_body(ctx, name, init)
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
        none => {
            // Use module prefix if set
            match ctx.module_prefix {
                some(prefix) => llvm_mangle_fn_with_prefix(prefix, name),
                none => llvm_mangle_fn(name),
            }
        },
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
    let saved_fn_name = ctx.current_fn_name
    ctx.current_fn_name = mangled

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
    ctx.current_fn_name = saved_fn_name
}

// ============================================================
// B-141: Default trait method body emission
// ============================================================
//
// For each trait method with a default body, emit an LLVM function
// __<Trait>_<method>(self_dict, self, ...params, ...evidence) that compiles
// the default body. Inside the body, self.method() calls dispatch through
// self_dict (the HIR already annotates these with DictDispatchInfo pointing
// to __ring_self_<Trait>), so we register self_dict under that name in
// named_values.

fn emit_trait_default_methods(mut ctx: LlvmCtx, trait_name: Str, methods: List<HTraitMethod>) {
    for method in methods {
        if !method.has_default { continue }
        match method.body {
            some(body) => {
                let default_fn_name = "__${trait_name}_${method.name}"
                match ctx.functions.get(default_fn_name) {
                    some(fn_val) => {
                        emit_one_default_method(ctx, fn_val, default_fn_name, trait_name, method, body)
                    },
                    none => {},  // not forward-declared, skip
                }
            },
            none => {},
        }
    }
}

fn emit_one_default_method(mut ctx: LlvmCtx, fn_val: LLVMValueRef, default_fn_name: Str, trait_name: Str, method: HTraitMethod, body: HExpr) {
    // Save and set current function
    let saved_fn = ctx.current_fn
    ctx.current_fn = some(fn_val)
    let saved_fn_name = ctx.current_fn_name
    ctx.current_fn_name = default_fn_name
    let saved_named = ctx.named_values
    ctx.named_values = map_new()

    // Create entry basic block
    let entry = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "entry")
    LLVMPositionBuilderAtEnd(ctx.builder, entry)

    // Parameter layout: (self_dict, ...supertrait_dicts, ...method_params, ...evidence_params)
    let mut param_idx = 0

    // Param 0: self_dict — register under __ring_self_<Trait> so that
    // DictDispatchInfo references in the body find it in named_values.
    let self_dict_name = default_method_self_name(trait_name)
    let dict_alloca = LLVMBuildAlloca(ctx.builder, ctx.ptr_type, self_dict_name)
    LLVMBuildStore(ctx.builder, LLVMGetParam(fn_val, param_idx), dict_alloca)
    ctx.named_values.insert(self_dict_name, dict_alloca)
    param_idx = param_idx + 1

    // Supertrait dict params — register each under __ring_self_<SuperTrait>
    // so the body can dispatch supertrait methods (e.g. self.get_name() from
    // a Nameable supertrait inside a Greetable default method).
    let all_supers = collect_all_supertraits_llvm(ctx, trait_name)
    for st in all_supers {
        let st_dict_name = default_method_self_name(st)
        let st_alloca = LLVMBuildAlloca(ctx.builder, ctx.ptr_type, st_dict_name)
        LLVMBuildStore(ctx.builder, LLVMGetParam(fn_val, param_idx), st_alloca)
        ctx.named_values.insert(st_dict_name, st_alloca)
        param_idx = param_idx + 1
    }

    // Regular params (including self)
    for p in method.params {
        let alloca = LLVMBuildAlloca(ctx.builder, ctx.ptr_type, p.name)
        LLVMBuildStore(ctx.builder, LLVMGetParam(fn_val, param_idx), alloca)
        ctx.named_values.insert(p.name, alloca)
        param_idx = param_idx + 1
    }

    // Evidence params from method effects
    let ev_names = extract_effect_names(method.effects)
    for en in ev_names {
        let ep_name = evidence_param_name(en)
        let alloca = LLVMBuildAlloca(ctx.builder, ctx.ptr_type, ep_name)
        LLVMBuildStore(ctx.builder, LLVMGetParam(fn_val, param_idx), alloca)
        ctx.named_values.insert(ep_name, alloca)
        param_idx = param_idx + 1
    }

    // Generate body
    let body_val = gen_llvm_expr(ctx, body)
    LLVMBuildRet(ctx.builder, body_val)

    // Restore state
    ctx.named_values = saved_named
    ctx.current_fn = saved_fn
    ctx.current_fn_name = saved_fn_name
}

// ============================================================
// B-141: Default method stub generation for impl
// ============================================================
//
// When an impl doesn't override a trait's default method, the compiler may
// still emit direct calls like cat.greet() as ring_Cat_greet(self). We need
// a forwarding function ring_Cat_greet(self, ...evidence) that calls the
// default body __Greet_greet(dict, self, ...evidence) with the impl's dict.

fn emit_default_method_stubs(mut ctx: LlvmCtx, target_type: Str, trait_name: Str, impl_methods: List<HDecl>) {
    // Collect explicitly-implemented method names
    let mut impl_method_names: Set<Str> = set_new()
    for m in impl_methods {
        match m {
            HDecl::Fn { name, .. } => { impl_method_names.insert(name) },
            _ => {},
        }
    }

    // Get the trait's method order
    if ctx.trait_method_order.get(trait_name).is_none() { return }
    let method_order = match ctx.trait_method_order.get(trait_name) {
        some(order) => order,
        none => [],
    }

    // Collect transitive supertraits for this trait
    let all_supers = collect_all_supertraits_llvm(ctx, trait_name)
    let super_count = all_supers.len()

    // For each trait method not in the impl, check for default function
    for method_name in method_order {
        if impl_method_names.contains(method_name) { continue }

        let default_fn_name = "__${trait_name}_${method_name}"
        match ctx.functions.get(default_fn_name) {
            some(default_fn) => {
                // This method has a default. Generate ring_<Type>_<method> stub.
                let mangled = llvm_mangle_method(target_type, method_name)

                // Skip if already declared (e.g. from another pass)
                if ctx.functions.get(mangled).is_some() { continue }

                // The default fn has params: (self_dict, ...supertrait_dicts, ...method_params, ...evidence)
                // The stub has params: (...method_params, ...evidence) — same minus self_dict and supertrait dicts.
                let default_arity = LLVMCountParams(default_fn)
                let stub_arity = default_arity - 1 - super_count  // minus self_dict and supertrait dicts

                let mut stub_param_types: List<LLVMTypeRef> = []
                for i in 0..stub_arity {
                    stub_param_types.push(ctx.ptr_type)
                }
                let stub_fn_ty = LLVMFunctionType(ctx.ptr_type, stub_param_types, 0)
                let stub_fn = LLVMAddFunction(ctx.module, mangled, stub_fn_ty)
                ctx.functions.insert(mangled, stub_fn)
                ctx.fn_types.insert(mangled, stub_fn_ty)

                // Copy evidence param info from the default fn
                match ctx.fn_evidence_params.get(default_fn_name) {
                    some(ev_params) => {
                        ctx.fn_evidence_params.insert(mangled, ev_params)
                    },
                    none => {},
                }

                // Emit stub body: call __Greet_greet(dict, supertrait_dicts..., params...)
                let saved_block = LLVMGetInsertBlock(ctx.builder)
                let entry = LLVMAppendBasicBlockInContext(ctx.context, stub_fn, "entry")
                LLVMPositionBuilderAtEnd(ctx.builder, entry)

                // Get the trait dict via resolve_static_dict_by_name
                let dict_name = trait_dict_name(target_type, trait_name)
                let dict_ptr = resolve_static_dict_by_name(ctx, dict_name)

                // Build call args: dict_ptr + supertrait dicts + all stub params
                let default_fn_ty = match ctx.fn_types.get(default_fn_name) {
                    some(t) => t,
                    none => {
                        let mut pts: List<LLVMTypeRef> = []
                        for i in 0..default_arity { pts.push(ctx.ptr_type) }
                        LLVMFunctionType(ctx.ptr_type, pts, 0)
                    },
                }
                let mut call_args: List<LLVMValueRef> = [dict_ptr]
                // Resolve supertrait dicts for the concrete target type
                for st in all_supers {
                    let st_dict_name = trait_dict_name(target_type, st)
                    let st_dict_ptr = resolve_static_dict_by_name(ctx, st_dict_name)
                    call_args.push(st_dict_ptr)
                }
                for i in 0..stub_arity {
                    call_args.push(LLVMGetParam(stub_fn, i))
                }
                let result = LLVMBuildCall2(ctx.builder, default_fn_ty, default_fn, call_args, fresh_name(ctx, "dflt"))
                LLVMBuildRet(ctx.builder, result)

                LLVMPositionBuilderAtEnd(ctx.builder, saved_block)
            },
            none => {},
        }
    }
}

// ============================================================
// Const body emission (emits as zero-arg getter function)
// ============================================================

// B-104 D9 Part 2: a const whose VALUE TYPE is a user enum (e.g.
// `const UNIT: Type = Type::UnitType`).  A fieldless variant value resolves to
// an Ident (bind_mono — not a NamedVariantConstruct node), and codegen lowers
// the const getter to a `ring_<Enum>_<Variant>()` constructor call; matching on
// the init HExpr shape is therefore unreliable, so we key off the value type.
// An enum const is an IMMUTABLE module-level value (const semantics) — sharing
// one process-wide singleton is always correct (the JS backend already does, as
// a module `const`).  The compiler's enum consts are exactly the 7 `Type`
// scalar consts (UNIT/INT/STR/BOOL/FLOAT/NEVER/ANY = Type::UnitType/IntType/…),
// all zero-field; payload-bearing enum consts (none in the compiler) would also
// be safe — the bounded one-per-const payload simply stays immortal, same as
// the value itself.
fn is_enum_const_type(ty: Type) -> Bool {
    match ty {
        Type::EnumType { .. } => true,
        _ => false,
    }
}

fn emit_const_body(mut ctx: LlvmCtx, name: Str, init: HExpr) {
    let const_fn_name = match ctx.module_prefix {
        some(prefix) => llvm_mangle_fn_with_prefix(prefix, name),
        none => llvm_mangle_fn(name),
    }

    match ctx.functions.get(const_fn_name) {
        some(fn_val) => {
            // B-104 D6 (#154): a Str const's getter is a lazy memoised
            // SINGLETON (never-drop typeid via ring_const_intern) — the LLVM
            // mirror of the JS backend's module-level `const`.  Use sites
            // already borrow (perceus treats const Idents as owner-bearing
            // borrows; pre-D6 the per-access fresh re-evaluation is what
            // leaked).  Non-Str consts keep the per-access form: scalar boxes
            // are FRESH-owned and correctly dropped at use sites today — not a
            // leak class, and not worth the singleton-aliasing surface.
            let is_str_const = match hexpr_type(init) {
                Type::StrType => true,
                _ => false,
            }
            // B-104 D9 Part 2: an enum-typed const (the compiler's `Type` scalar
            // consts UNIT/INT/STR/BOOL/FLOAT/NEVER/ANY = Type::UnitType/IntType/…)
            // is a heap value that pre-D9 was re-constructed fresh on EVERY
            // access — and never dropped, because use sites borrow it like a
            // module-level value (JS-backend `const` semantics).  D8 attributed
            // Type::UnitType ≈22.7M live @2.382B self-compile (98.7% pure leak;
            // the recursive `unwrap_or(UNIT)` leaves in type_to_string).
            // Singletonise it the same way as D6 Str consts: a lazy memoised
            // getter interned via ring_unit_intern (dedicated never-drop typeid).
            // Other heap consts (EffectRow EMPTY_ROW, List/Set method tables) are
            // NOT singletonised here — value semantics over their mutable
            // interiors make the aliasing surface non-trivial; deferred unless
            // re-measure shows them dominant.  Plain scalar consts (Int/Float/
            // Bool) keep the per-access form: their boxes are FRESH-owned and
            // correctly dropped at use sites today — not a leak class.
            let is_enum_const = is_enum_const_type(hexpr_type(init))
            if is_str_const {
                emit_memoised_const_body(ctx, fn_val, const_fn_name, init, "ring_const_intern")
            } else if is_enum_const {
                emit_memoised_const_body(ctx, fn_val, const_fn_name, init, "ring_unit_intern")
            } else {
                let saved_fn = ctx.current_fn
                ctx.current_fn = some(fn_val)

                let saved_named = ctx.named_values
                ctx.named_values = map_new()

                let entry = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "entry")
                LLVMPositionBuilderAtEnd(ctx.builder, entry)

                let val = gen_llvm_expr(ctx, init)
                LLVMBuildRet(ctx.builder, val)

                ctx.named_values = saved_named
                ctx.current_fn = saved_fn
            }
        },
        none => {
            // Not forward-declared, skip
        },
    }
}

// ============================================================
// Struct info registration + constructor generation
// ============================================================

pub fn register_struct_info(mut ctx: LlvmCtx, name: Str, fields: List<HStructField>) {
    let mut field_names: List<Str> = []
    let mut field_types: List<LLVMTypeRef> = []
    // B-104 D1 rule ① (audit #139): mark fields whose Ring type is (or
    // transitively contains) an extern handle — emit_drop_functions must not
    // ring_drop them (raw foreign pointers / containers thereof).
    let mut field_rc_skip: List<Bool> = []
    for f in fields {
        field_names.push(f.name)
        field_types.push(ctx.ptr_type)
        field_rc_skip.push(type_contains_extern_handle(f.ty, ctx.extern_types))
    }
    let struct_ty = LLVMStructTypeInContext(ctx.context, field_types, 0)
    ctx.struct_types.insert(name, StructFieldInfo {
        field_names: field_names,
        field_rc_skip: field_rc_skip,
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

    // Allocate struct via ring_alloc with typeid
    let size = LLVMSizeOf(struct_info.llvm_type)
    let alloc_fn = get_or_declare_runtime_fn(ctx, "ring_alloc", [ctx.i64_type, ctx.i64_type], ctx.ptr_type)
    let alloc_ty = get_rt_fn_type(ctx, "ring_alloc")
    let typeid_val = LLVMConstInt(ctx.i64_type, get_or_assign_typeid(ctx, name), 0)
    let struct_ptr = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [size, typeid_val], "s")

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
        let fnames = match v.field_names {
            some(names) => names,
            none => {
                let mut ns: List<Str> = []
                for j in 0..fc { ns.push("") }
                ns
            },
        }
        // B-104 D1 rule ① (audit #139): same extern-containment skip flags as
        // register_struct_info, per payload field.
        let mut frs: List<Bool> = []
        for ft in v.fields {
            frs.push(type_contains_extern_handle(ft, ctx.extern_types))
        }
        variant_map.insert(v.name, EnumVariantInfo { tag: tag, field_count: fc, field_names: fnames, field_rc_skip: frs })
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

        // Allocate enum struct via ring_alloc with typeid
        let size = LLVMSizeOf(enum_info.llvm_type)
        let alloc_fn = get_or_declare_runtime_fn(ctx, "ring_alloc", [ctx.i64_type, ctx.i64_type], ctx.ptr_type)
        let alloc_ty = get_rt_fn_type(ctx, "ring_alloc")
        let enum_typeid_val = LLVMConstInt(ctx.i64_type, get_or_assign_typeid(ctx, name), 0)
        let enum_ptr = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [size, enum_typeid_val], "e")

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

// ============================================================
// Trait dictionary generation
// ============================================================

fn emit_trait_dict(mut ctx: LlvmCtx, target_type: Str, trait_name: Str, methods: List<HDecl>) {
    // Build dict name following hir.ring convention: __Type_Trait
    let dict_name = trait_dict_name(target_type, trait_name)

    // Collect impl method names in order
    let mut impl_methods: List<Str> = []
    for m in methods {
        match m {
            HDecl::Fn { name, .. } => impl_methods.push(name),
            _ => {},
        }
    }

    // Get trait method order if available
    let method_order = match ctx.trait_method_order.get(trait_name) {
        some(order) => order,
        none => impl_methods,
    }

    let method_count = method_order.len()
    if method_count == 0 { return }

    // B-104 D4: the RAW build function ring_dict_build_<dictname>() -> ptr —
    // allocates the dict struct and fills the method closure slots.  It is
    // wrapped below in the memoised singleton getter ring_dict_init_<dictname>
    // (one construction per process; use sites borrow the singleton).
    let build_fn_name = "ring_dict_build_${dict_name}"
    let build_fn_ty = LLVMFunctionType(ctx.ptr_type, [], 0)
    let build_fn = LLVMAddFunction(ctx.module, build_fn_name, build_fn_ty)
    ctx.functions.insert(build_fn_name, build_fn)
    ctx.fn_types.insert(build_fn_name, build_fn_ty)

    let saved_fn = ctx.current_fn
    ctx.current_fn = some(build_fn)
    let entry = LLVMAppendBasicBlockInContext(ctx.context, build_fn, "entry")
    LLVMPositionBuilderAtEnd(ctx.builder, entry)

    // Dict struct type (B-104 D4 layout): { i64 method_count, ptr m0, ... }
    // — method slot i at struct index i+1, matching load_dict_method /
    // gen_dict_dispatch_call / build_wrapped_dict / the runtime dict makers.
    let mut dict_elem_types: List<LLVMTypeRef> = [ctx.i64_type]
    for i in 0..method_count {
        dict_elem_types.push(ctx.ptr_type)
    }
    let dict_struct_ty = LLVMStructTypeInContext(ctx.context, dict_elem_types, 0)

    // Allocate via ring_alloc with the DICT_STATIC typeid: impl dicts are
    // module singletons — the runtime registers the typeid never-drop, so any
    // stray dup/drop on one is a no-op (defense in depth).
    let dict_size = LLVMSizeOf(dict_struct_ty)
    let alloc_fn = get_or_declare_runtime_fn(ctx, "ring_alloc", [ctx.i64_type, ctx.i64_type], ctx.ptr_type)
    let alloc_ty = get_rt_fn_type(ctx, "ring_alloc")
    let dict_typeid = LLVMConstInt(ctx.i64_type, RING_TYPEID_DICT_STATIC, 0)
    let dict_ptr = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [dict_size, dict_typeid], "dict")
    let count_slot = LLVMBuildStructGEP2(ctx.builder, dict_struct_ty, dict_ptr, 0, "dcnt")
    LLVMBuildStore(ctx.builder, LLVMConstInt(ctx.i64_type, method_count, 0), count_slot)

    // Closure struct type: { fn_ptr, env_ptr }
    let closure_ty = LLVMStructTypeInContext(ctx.context, [ctx.ptr_type, ctx.ptr_type], 0)
    let closure_size = LLVMSizeOf(closure_ty)

    // For each method in the trait, find the corresponding impl method and create a closure
    for i in 0..method_count {
        match method_order.get(i) {
            some(method_name) => {
                let _ = emit_dict_method_slot(ctx, target_type, trait_name, method_name, dict_struct_ty, dict_ptr, closure_ty, closure_size, alloc_fn, alloc_ty, i)
            },
            none => {},
        }
    }

    LLVMBuildRet(ctx.builder, dict_ptr)
    ctx.current_fn = saved_fn

    // B-104 D4: wrap the build fn in the memoised getter (registered as
    // ring_dict_init_<dictname>) and expose it via dict_globals so
    // resolve_static_dict_by_name finds the SINGLETON, not a fresh build.
    let getter = emit_memoised_dict_getter(ctx, dict_name, build_fn, build_fn_ty)
    ctx.dict_globals.insert(dict_name, getter)
}

fn emit_dict_method_slot(mut ctx: LlvmCtx, target_type: Str, trait_name: Str, method_name: Str, dict_struct_ty: LLVMTypeRef, dict_ptr: LLVMValueRef, closure_ty: LLVMTypeRef, closure_size: LLVMValueRef, alloc_fn: LLVMValueRef, alloc_ty: LLVMTypeRef, slot_idx: Int) {
    let mangled = llvm_mangle_method(target_type, method_name)
    let closure_typeid = LLVMConstInt(ctx.i64_type, 7, 0)  // RING_TYPEID_CLOSURE
    match ctx.functions.get(mangled) {
        some(method_fn) => {
            // The dict slot must conform to the uniform closure ABI: a RingClosure
            // { fn_ptr, env_ptr } whose fn_ptr is called as fn(env, args...). But the
            // impl method `ring_<Type>_<method>` is generated with the *direct* ABI
            // fn(self, args...) — it has no leading env parameter. Storing the bare
            // method fn here makes gen_closure_call pass env (=null) as the receiver,
            // corrupting `self` (B-092: crashes in str_from_cstr on self.<field>).
            // Emit a thin env-first thunk that drops env and forwards to the method,
            // mirroring the runtime's ring_cl_eq_str(env, a, b) wrappers.
            let thunk_fn = emit_dict_method_thunk(ctx, mangled, method_fn)

            // Create a closure: { thunk_fn, null_env }
            let closure_ptr = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [closure_size, closure_typeid], fresh_name(ctx, "cls"))
            let fn_slot = LLVMBuildStructGEP2(ctx.builder, closure_ty, closure_ptr, 0, fresh_name(ctx, "fps"))
            LLVMBuildStore(ctx.builder, thunk_fn, fn_slot)
            let env_slot = LLVMBuildStructGEP2(ctx.builder, closure_ty, closure_ptr, 1, fresh_name(ctx, "eps"))
            LLVMBuildStore(ctx.builder, LLVMConstPointerNull(ctx.ptr_type), env_slot)

            // Store closure in dict slot (B-104 D4 layout: slot i at index i+1).
            let slot_ptr = LLVMBuildStructGEP2(ctx.builder, dict_struct_ty, dict_ptr, slot_idx + 1, fresh_name(ctx, "ds"))
            LLVMBuildStore(ctx.builder, closure_ptr, slot_ptr)
        },
        none => {
            // B-141: try default trait method function __<Trait>_<method>
            let default_fn_name = "__${trait_name}_${method_name}"
            match ctx.functions.get(default_fn_name) {
                some(default_fn) => {
                    // The default function has signature:
                    //   __<Trait>_<method>(self_dict, ...supertrait_dicts, self, ...args, ...evidence)
                    // The closure ABI calls:  thunk(env, self, ...args)
                    // We use env = dict_ptr (the impl's own dict) so the default
                    // body can dispatch self.other_method() through it.
                    //
                    // The thunk forwards env as self_dict, resolves supertrait
                    // dicts statically for the concrete target_type, and passes
                    // remaining params.
                    let thunk_fn = emit_default_method_thunk(ctx, default_fn_name, default_fn, target_type, trait_name)

                    let closure_ptr = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [closure_size, closure_typeid], fresh_name(ctx, "cls"))
                    let fn_slot = LLVMBuildStructGEP2(ctx.builder, closure_ty, closure_ptr, 0, fresh_name(ctx, "fps"))
                    LLVMBuildStore(ctx.builder, thunk_fn, fn_slot)
                    // env = dict_ptr: the impl's own dict, so default body's
                    // self.method() dispatch finds the concrete methods.
                    let env_slot = LLVMBuildStructGEP2(ctx.builder, closure_ty, closure_ptr, 1, fresh_name(ctx, "eps"))
                    LLVMBuildStore(ctx.builder, dict_ptr, env_slot)

                    let slot_ptr = LLVMBuildStructGEP2(ctx.builder, dict_struct_ty, dict_ptr, slot_idx + 1, fresh_name(ctx, "ds"))
                    LLVMBuildStore(ctx.builder, closure_ptr, slot_ptr)
                },
                none => {
                    // Method not found and no default — store null closure
                    let slot_ptr = LLVMBuildStructGEP2(ctx.builder, dict_struct_ty, dict_ptr, slot_idx + 1, fresh_name(ctx, "ds"))
                    LLVMBuildStore(ctx.builder, LLVMConstPointerNull(ctx.ptr_type), slot_ptr)
                },
            }
        },
    }
}

// Emit (once) an env-first thunk wrapping a direct-ABI impl method, so it can be
// stored in a trait dict and invoked through the uniform closure ABI fn(env, args...).
// The thunk has type (env, p0, ..., p_{n-1}) -> ptr where n is the method's param
// count; it ignores env and tail-forwards (p0, ..., p_{n-1}) to the method.
fn emit_dict_method_thunk(mut ctx: LlvmCtx, mangled: Str, method_fn: LLVMValueRef) -> LLVMValueRef {
    let thunk_name = "${mangled}__dictthunk"
    // Reuse if already emitted (one impl method may seed multiple dict inits).
    match ctx.functions.get(thunk_name) {
        some(existing) => { return existing },
        none => {},
    }

    let method_arity = LLVMCountParams(method_fn)

    // Thunk param types: leading env ptr + one ptr per method param.
    let mut thunk_param_types: List<LLVMTypeRef> = [ctx.ptr_type]
    for i in 0..method_arity {
        thunk_param_types.push(ctx.ptr_type)
    }
    let thunk_ty = LLVMFunctionType(ctx.ptr_type, thunk_param_types, 0)
    let thunk_fn = LLVMAddFunction(ctx.module, thunk_name, thunk_ty)
    ctx.functions.insert(thunk_name, thunk_fn)
    ctx.fn_types.insert(thunk_name, thunk_ty)

    // Method fn type: (p0, ..., p_{n-1}) -> ptr.
    let method_ty = match ctx.fn_types.get(mangled) {
        some(t) => t,
        none => {
            let mut method_param_types: List<LLVMTypeRef> = []
            for i in 0..method_arity {
                method_param_types.push(ctx.ptr_type)
            }
            LLVMFunctionType(ctx.ptr_type, method_param_types, 0)
        },
    }

    // Emit the thunk body in its own block, then restore the builder position so the
    // surrounding dict-init emission continues uninterrupted.
    let saved_block = LLVMGetInsertBlock(ctx.builder)
    let entry = LLVMAppendBasicBlockInContext(ctx.context, thunk_fn, "entry")
    LLVMPositionBuilderAtEnd(ctx.builder, entry)

    // Forward thunk params 1..arity (skip param 0 = env) to the method.
    let mut fwd_args: List<LLVMValueRef> = []
    for i in 0..method_arity {
        fwd_args.push(LLVMGetParam(thunk_fn, i + 1))
    }
    let call_res = LLVMBuildCall2(ctx.builder, method_ty, method_fn, fwd_args, fresh_name(ctx, "tk"))
    LLVMBuildRet(ctx.builder, call_res)

    LLVMPositionBuilderAtEnd(ctx.builder, saved_block)
    thunk_fn
}

// B-141: emit a thunk for a default trait method that FORWARDS env (= dict ptr)
// as the first argument to the default body function, unlike emit_dict_method_thunk
// which drops env. The default fn expects
// (self_dict, ...supertrait_dicts, params..., evidence...). The thunk is called from
// a closure as (env, params..., evidence...) where env = self_dict. For supertrait
// dicts, the thunk resolves them statically (it knows the target_type at creation time).
// The thunk name is per target_type to avoid collisions across different concrete types.
fn emit_default_method_thunk(mut ctx: LlvmCtx, default_fn_name: Str, default_fn: LLVMValueRef, target_type: Str, trait_name: Str) -> LLVMValueRef {
    let thunk_name = "${default_fn_name}__defaultthunk_${target_type}"
    // Reuse if already emitted
    match ctx.functions.get(thunk_name) {
        some(existing) => { return existing },
        none => {},
    }

    let all_supers = collect_all_supertraits_llvm(ctx, trait_name)
    let super_count = all_supers.len()

    let default_arity = LLVMCountParams(default_fn)
    // The default fn takes (self_dict, supertrait_dicts..., params..., evidence...) = default_arity params.
    // The thunk takes (env, params..., evidence...) — env replaces self_dict,
    // supertrait dicts are resolved statically inside the thunk.
    // So thunk arity = default_arity - super_count.
    let thunk_arity = default_arity - super_count
    let mut thunk_param_types: List<LLVMTypeRef> = []
    for i in 0..thunk_arity {
        thunk_param_types.push(ctx.ptr_type)
    }
    let thunk_ty = LLVMFunctionType(ctx.ptr_type, thunk_param_types, 0)
    let thunk_fn = LLVMAddFunction(ctx.module, thunk_name, thunk_ty)
    ctx.functions.insert(thunk_name, thunk_fn)
    ctx.fn_types.insert(thunk_name, thunk_ty)

    let default_ty = match ctx.fn_types.get(default_fn_name) {
        some(t) => t,
        none => {
            let mut pts: List<LLVMTypeRef> = []
            for i in 0..default_arity { pts.push(ctx.ptr_type) }
            LLVMFunctionType(ctx.ptr_type, pts, 0)
        },
    }

    let saved_block = LLVMGetInsertBlock(ctx.builder)
    let entry = LLVMAppendBasicBlockInContext(ctx.context, thunk_fn, "entry")
    LLVMPositionBuilderAtEnd(ctx.builder, entry)

    // Build call args: env (=self_dict) + resolved supertrait dicts + remaining params
    let mut fwd_args: List<LLVMValueRef> = []
    // param 0 = env = self_dict
    fwd_args.push(LLVMGetParam(thunk_fn, 0))
    // Resolve supertrait dicts statically for the concrete target_type
    for st in all_supers {
        let st_dict_name = trait_dict_name(target_type, st)
        let st_dict_ptr = resolve_static_dict_by_name(ctx, st_dict_name)
        fwd_args.push(st_dict_ptr)
    }
    // Remaining params (self, args..., evidence...)
    for i in 1..thunk_arity {
        fwd_args.push(LLVMGetParam(thunk_fn, i))
    }
    let call_res = LLVMBuildCall2(ctx.builder, default_ty, default_fn, fwd_args, fresh_name(ctx, "dtk"))
    LLVMBuildRet(ctx.builder, call_res)

    LLVMPositionBuilderAtEnd(ctx.builder, saved_block)
    thunk_fn
}

// ============================================================
// B-100 Fix 2: LLVM codegen for auto-derived trait impls
// ============================================================
//
// The JS backend processes program.derived_impls via codegen_derive.ring to
// emit JS eq/ne/clone/debug/cmp functions and their dicts. The LLVM backend
// was missing this — derived-impl dicts fell through to
// ring_get_builtin_dict's tag-only comparison, breaking multi-field struct Eq.
//
// This pass emits LLVM IR for each DerivedImpl, generating the method
// functions + trait dict (reusing the existing emit_trait_dict infrastructure).

pub fn emit_derived_impls_llvm(mut ctx: LlvmCtx, derived_impls: List<DerivedImpl>) {
    for di in derived_impls {
        match di.trait_name {
            "Eq" => emit_derived_eq_llvm(ctx, di),
            "Clone" => emit_derived_clone_llvm(ctx, di),
            "Debug" => emit_derived_debug_llvm(ctx, di),
            "Ord" => emit_derived_ord_llvm(ctx, di),
            _ => {},
        }
    }
}

// ── Eq ────────────────────────────────────────────────────────

fn emit_derived_eq_llvm(mut ctx: LlvmCtx, di: DerivedImpl) {
    let type_name = di.type_name
    match di.type_kind {
        TypeKind::StructKind => match di.struct_fields {
            some(fields) => {
                emit_struct_eq_fn(ctx, type_name, fields, di.bounds)
                emit_struct_ne_fn(ctx, type_name)
                emit_derived_trait_dict(ctx, type_name, "Eq")
            },
            none => {},
        },
        TypeKind::EnumKind => match di.enum_variants {
            some(variants) => {
                emit_enum_eq_fn(ctx, type_name, variants, di.bounds)
                emit_struct_ne_fn(ctx, type_name)
                emit_derived_trait_dict(ctx, type_name, "Eq")
            },
            none => {},
        },
    }
}

// Build a trait dict for a derived impl. Unlike emit_trait_dict, this handles
// the case where a fallback dict getter already exists (created lazily by
// get_or_create_static_dict_getter during the main decl pass). It builds the
// real dict struct and stores it in the dict_global so the existing getter
// finds it pre-populated and skips the ring_get_builtin_dict fallback.
fn emit_derived_trait_dict(mut ctx: LlvmCtx, target_type: Str, trait_name: Str) {
    let dict_name = trait_dict_name(target_type, trait_name)

    // Get the method order for this trait
    if ctx.trait_method_order.get(trait_name).is_none() { return }
    let method_order = match ctx.trait_method_order.get(trait_name) {
        some(order) => order,
        none => panic("unreachable"),
    }
    let method_count = method_order.len()
    if method_count == 0 { return }

    // Check if a proper dict init (with build fn) already exists — skip if so
    // (e.g. user-written impl already generated a proper dict).
    let build_fn_name = "ring_dict_build_${dict_name}"
    match ctx.functions.get(build_fn_name) {
        some(_) => { return },  // proper dict already exists
        none => {},
    }

    // Build the dict struct: { i64 count, ptr slot0, ... }
    let build_fn_ty = LLVMFunctionType(ctx.ptr_type, [], 0)
    let build_fn = LLVMAddFunction(ctx.module, build_fn_name, build_fn_ty)
    ctx.functions.insert(build_fn_name, build_fn)
    ctx.fn_types.insert(build_fn_name, build_fn_ty)

    let saved_fn = ctx.current_fn
    let saved_bb = LLVMGetInsertBlock(ctx.builder)
    ctx.current_fn = some(build_fn)
    let entry = LLVMAppendBasicBlockInContext(ctx.context, build_fn, "entry")
    LLVMPositionBuilderAtEnd(ctx.builder, entry)

    let mut dict_elem_types: List<LLVMTypeRef> = [ctx.i64_type]
    for i in 0..method_count { dict_elem_types.push(ctx.ptr_type) }
    let dict_struct_ty = LLVMStructTypeInContext(ctx.context, dict_elem_types, 0)

    let dict_size = LLVMSizeOf(dict_struct_ty)
    let alloc_fn = get_or_declare_runtime_fn(ctx, "ring_alloc", [ctx.i64_type, ctx.i64_type], ctx.ptr_type)
    let alloc_ty = get_rt_fn_type(ctx, "ring_alloc")
    let dict_typeid = LLVMConstInt(ctx.i64_type, RING_TYPEID_DICT_STATIC, 0)
    let dict_ptr = LLVMBuildCall2(ctx.builder, alloc_ty, alloc_fn, [dict_size, dict_typeid], "dict")
    let count_slot = LLVMBuildStructGEP2(ctx.builder, dict_struct_ty, dict_ptr, 0, "dcnt")
    LLVMBuildStore(ctx.builder, LLVMConstInt(ctx.i64_type, method_count, 0), count_slot)

    let closure_ty = LLVMStructTypeInContext(ctx.context, [ctx.ptr_type, ctx.ptr_type], 0)
    let closure_size = LLVMSizeOf(closure_ty)

    for i in 0..method_count {
        match method_order.get(i) {
            some(method_name) => {
                let _ = emit_dict_method_slot(ctx, target_type, trait_name, method_name, dict_struct_ty, dict_ptr, closure_ty, closure_size, alloc_fn, alloc_ty, i)
            },
            none => {},
        }
    }

    LLVMBuildRet(ctx.builder, dict_ptr)
    ctx.current_fn = saved_fn

    // B-104 D4: wrap the build fn in the memoised getter (registered as
    // ring_dict_init_<dictname>) and expose it via dict_globals so
    // resolve_dict_for_derived finds the SINGLETON, not a fresh build.
    // This mirrors emit_trait_dict — without it, nested generic structs'
    // derived eq/cmp/debug fall through to ring_get_builtin_dict (#178).
    let getter = emit_memoised_dict_getter(ctx, dict_name, build_fn, build_fn_ty)
    ctx.dict_globals.insert(dict_name, getter)

    ctx.current_fn = saved_fn
    LLVMPositionBuilderAtEnd(ctx.builder, saved_bb)
}

// Emit ring_<Type>_eq(self, other, ...dict_params) -> Bool for a struct.
// Short-circuits: returns false as soon as any field differs.
// For generic structs, trailing dict params carry the Eq dicts for type parameters.
fn emit_struct_eq_fn(mut ctx: LlvmCtx, type_name: Str, fields: List<DerivedField>, bounds: List<TraitBound>) {
    let mangled = llvm_mangle_method(type_name, "eq")
    // Skip if already generated (e.g. user-written impl)
    match ctx.functions.get(mangled) {
        some(_) => { return },
        none => {},
    }

    // Collect dict params for Eq bounds (e.g. A: Eq → "__ring_A_Eq")
    let dict_params = collect_trait_dict_params(bounds, "Eq")

    // Function type: (self: ptr, other: ptr, dict0: ptr, ...) -> ptr
    let mut param_types: List<LLVMTypeRef> = [ctx.ptr_type, ctx.ptr_type]
    for dp in dict_params { param_types.push(ctx.ptr_type) }
    let fn_ty = LLVMFunctionType(ctx.ptr_type, param_types, 0)
    let fn_val = LLVMAddFunction(ctx.module, mangled, fn_ty)
    ctx.functions.insert(mangled, fn_val)
    ctx.fn_types.insert(mangled, fn_ty)

    let saved_fn = ctx.current_fn
    let saved_bb = LLVMGetInsertBlock(ctx.builder)
    ctx.current_fn = some(fn_val)

    let entry = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "entry")
    LLVMPositionBuilderAtEnd(ctx.builder, entry)

    // Map dict params to named_values so resolve_dict_for_derived can find them
    setup_derived_dict_params(ctx, fn_val, dict_params, 2)

    let self_val = LLVMGetParam(fn_val, 0)
    let other_val = LLVMGetParam(fn_val, 1)

    // Zero fields → always equal
    if fields.len() == 0 {
        LLVMBuildRet(ctx.builder, box_bool(ctx, LLVMConstInt(ctx.i64_type, 1, 0)))
        ctx.current_fn = saved_fn
        LLVMPositionBuilderAtEnd(ctx.builder, saved_bb)
        return
    }

    // Look up the struct field info for GEP
    if ctx.struct_types.get(type_name).is_none() {
        // Struct not registered — fall back to trivially true (shouldn't happen)
        LLVMBuildRet(ctx.builder, box_bool(ctx, LLVMConstInt(ctx.i64_type, 1, 0)))
        ctx.current_fn = saved_fn
        LLVMPositionBuilderAtEnd(ctx.builder, saved_bb)
        return
    }
    let struct_info = match ctx.struct_types.get(type_name) {
        some(info) => info,
        none => panic("unreachable"),
    }

    // For each field, generate comparison + short-circuit branch.
    // Chain: entry → cmp0 → cmp1 → ... → ret_true
    //                  ↘        ↘
    //                ret_false  ret_false
    let ret_false_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "ret.false")
    let ret_true_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "ret.true")

    for fi in 0..fields.len() {
        let field = fields[fi]
        // Find field index in struct layout
        let field_idx = find_field_index(struct_info.field_names, field.name)
        if field_idx < 0 { continue }  // shouldn't happen

        // Load self.field and other.field via GEP
        let self_fp = LLVMBuildStructGEP2(ctx.builder, struct_info.llvm_type, self_val, field_idx, fresh_name(ctx, "sf"))
        let self_fv = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, self_fp, fresh_name(ctx, "sv"))
        let other_fp = LLVMBuildStructGEP2(ctx.builder, struct_info.llvm_type, other_val, field_idx, fresh_name(ctx, "of"))
        let other_fv = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, other_fp, fresh_name(ctx, "ov"))

        // Compare based on field action
        let eq_i1 = emit_field_eq_cmp(ctx, self_fv, other_fv, field.action)

        // Branch: if not equal → ret_false, else → next field (or ret_true)
        let next_bb = if fi + 1 < fields.len() {
            LLVMAppendBasicBlockInContext(ctx.context, fn_val, "cmp.${fi + 1}")
        } else {
            ret_true_bb
        }
        discard(LLVMBuildCondBr(ctx.builder, eq_i1, next_bb, ret_false_bb))
        LLVMPositionBuilderAtEnd(ctx.builder, next_bb)
    }

    // ret_true block (we're already positioned here after the last field)
    // If fields.len() > 0, the last branch went to ret_true_bb and we're there.
    LLVMBuildRet(ctx.builder, box_bool(ctx, LLVMConstInt(ctx.i64_type, 1, 0)))

    // ret_false block
    LLVMPositionBuilderAtEnd(ctx.builder, ret_false_bb)
    LLVMBuildRet(ctx.builder, box_bool(ctx, LLVMConstInt(ctx.i64_type, 0, 0)))

    ctx.current_fn = saved_fn
    LLVMPositionBuilderAtEnd(ctx.builder, saved_bb)
}

// Emit ring_<Type>_eq for enums.
// Compares tag first, then fields per variant.
fn emit_enum_eq_fn(mut ctx: LlvmCtx, type_name: Str, variants: List<DerivedVariant>, bounds: List<TraitBound>) {
    let mangled = llvm_mangle_method(type_name, "eq")
    match ctx.functions.get(mangled) {
        some(_) => { return },
        none => {},
    }

    // Collect dict params for Eq bounds
    let dict_params = collect_trait_dict_params(bounds, "Eq")

    let mut param_types: List<LLVMTypeRef> = [ctx.ptr_type, ctx.ptr_type]
    for dp in dict_params { param_types.push(ctx.ptr_type) }
    let fn_ty = LLVMFunctionType(ctx.ptr_type, param_types, 0)
    let fn_val = LLVMAddFunction(ctx.module, mangled, fn_ty)
    ctx.functions.insert(mangled, fn_val)
    ctx.fn_types.insert(mangled, fn_ty)

    let saved_fn = ctx.current_fn
    let saved_bb = LLVMGetInsertBlock(ctx.builder)
    ctx.current_fn = some(fn_val)

    let entry = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "entry")
    LLVMPositionBuilderAtEnd(ctx.builder, entry)

    // Map dict params to named_values
    setup_derived_dict_params(ctx, fn_val, dict_params, 2)

    let self_val = LLVMGetParam(fn_val, 0)
    let other_val = LLVMGetParam(fn_val, 1)

    // Compare tags: read i64 at offset 0 (enum layout = { i64 tag, ptr field0, ... })
    if ctx.enum_types.get(type_name).is_none() {
        // Fallback: trivially true (shouldn't happen for registered enums)
        LLVMBuildRet(ctx.builder, box_bool(ctx, LLVMConstInt(ctx.i64_type, 1, 0)))
        ctx.current_fn = saved_fn
        LLVMPositionBuilderAtEnd(ctx.builder, saved_bb)
        return
    }
    let enum_info = match ctx.enum_types.get(type_name) {
        some(info) => info,
        none => panic("unreachable"),
    }
    let tag_ty = LLVMStructTypeInContext(ctx.context, [ctx.i64_type], 0)
    let self_tag_ptr = LLVMBuildStructGEP2(ctx.builder, tag_ty, self_val, 0, fresh_name(ctx, "stp"))
    let self_tag = LLVMBuildLoad2(ctx.builder, ctx.i64_type, self_tag_ptr, fresh_name(ctx, "stv"))
    let other_tag_ptr = LLVMBuildStructGEP2(ctx.builder, tag_ty, other_val, 0, fresh_name(ctx, "otp"))
    let other_tag = LLVMBuildLoad2(ctx.builder, ctx.i64_type, other_tag_ptr, fresh_name(ctx, "otv"))

    let tags_eq = LLVMBuildICmp(ctx.builder, 32, self_tag, other_tag, fresh_name(ctx, "teq"))

    // Check if any variant has fields that need comparing
    let mut any_fields = false
    for v in variants {
        if v.fields.len() > 0 { any_fields = true }
    }

    if !any_fields {
        // All variants are field-less — tag comparison is sufficient
        let result = LLVMBuildICmp(ctx.builder, 32, self_tag, other_tag, fresh_name(ctx, "eq"))
        // Convert i1 to i64 for box_bool
        let ext = LLVMBuildSub(ctx.builder, LLVMConstInt(ctx.i64_type, 0, 0), LLVMConstInt(ctx.i64_type, 0, 0), fresh_name(ctx, "z"))
        let _ = ext  // unused
        // Tags are i64, box the comparison result
        let tags_equal = LLVMBuildICmp(ctx.builder, 32, self_tag, other_tag, fresh_name(ctx, "te"))
        // Convert i1 to i64: zext
        let as_i64 = LLVMBuildSub(ctx.builder, LLVMConstInt(ctx.i64_type, 1, 0), LLVMConstInt(ctx.i64_type, 0, 0), fresh_name(ctx, "one"))
        // We need to select: if tags_equal then 1 else 0
        // Use a branch + phi since we don't have LLVMBuildSelect declared
        let true_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "eq.true")
        let false_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "eq.false")
        let merge_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "eq.merge")
        discard(LLVMBuildCondBr(ctx.builder, tags_eq, true_bb, false_bb))

        LLVMPositionBuilderAtEnd(ctx.builder, true_bb)
        let true_val = box_bool(ctx, LLVMConstInt(ctx.i64_type, 1, 0))
        let true_end = LLVMGetInsertBlock(ctx.builder)
        discard(LLVMBuildBr(ctx.builder, merge_bb))

        LLVMPositionBuilderAtEnd(ctx.builder, false_bb)
        let false_val = box_bool(ctx, LLVMConstInt(ctx.i64_type, 0, 0))
        let false_end = LLVMGetInsertBlock(ctx.builder)
        discard(LLVMBuildBr(ctx.builder, merge_bb))

        LLVMPositionBuilderAtEnd(ctx.builder, merge_bb)
        let phi = LLVMBuildPhi(ctx.builder, ctx.ptr_type, fresh_name(ctx, "res"))
        LLVMAddIncoming(phi, [true_val, false_val], [true_end, false_end])
        LLVMBuildRet(ctx.builder, phi)
    } else {
        // Enum with fields — tags differ → false, tags same → switch per variant
        let tags_diff_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "eq.diff")
        let tags_same_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "eq.same")
        discard(LLVMBuildCondBr(ctx.builder, tags_eq, tags_same_bb, tags_diff_bb))

        // Tags differ: return false
        LLVMPositionBuilderAtEnd(ctx.builder, tags_diff_bb)
        LLVMBuildRet(ctx.builder, box_bool(ctx, LLVMConstInt(ctx.i64_type, 0, 0)))

        // Tags same: switch on tag value, compare fields per variant
        LLVMPositionBuilderAtEnd(ctx.builder, tags_same_bb)
        let ret_true_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "eq.ret.true")
        let ret_false_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "eq.ret.false")

        // Default case for switch (shouldn't be reached) — return true
        let default_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "eq.default")
        let switch_val = LLVMBuildSwitch(ctx.builder, self_tag, default_bb, variants.len())

        for vi in 0..variants.len() {
            let variant = variants[vi]
            let var_tag = match enum_info.variants.get(variant.name) {
                some(vinfo) => vinfo.tag,
                none => vi,
            }

            let case_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "eq.v.${variant.name}")
            LLVMAddCase(switch_val, LLVMConstInt(ctx.i64_type, var_tag, 0), case_bb)
            LLVMPositionBuilderAtEnd(ctx.builder, case_bb)

            if variant.fields.len() == 0 {
                // No fields — tags match so they are equal
                discard(LLVMBuildBr(ctx.builder, ret_true_bb))
            } else {
                // Compare each field with short-circuit
                for fi in 0..variant.fields.len() {
                    let field = variant.fields[fi]
                    // Enum layout: { i64 tag, ptr field0, ptr field1, ... }
                    // Field GEP index = fi + 1 (tag is at index 0)
                    let self_fp = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, self_val, fi + 1, fresh_name(ctx, "sf"))
                    let self_fv = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, self_fp, fresh_name(ctx, "sv"))
                    let other_fp = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, other_val, fi + 1, fresh_name(ctx, "of"))
                    let other_fv = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, other_fp, fresh_name(ctx, "ov"))

                    let eq_i1 = emit_field_eq_cmp(ctx, self_fv, other_fv, field.action)

                    let next_bb = if fi + 1 < variant.fields.len() {
                        LLVMAppendBasicBlockInContext(ctx.context, fn_val, "eq.v.${variant.name}.f${fi + 1}")
                    } else {
                        ret_true_bb
                    }
                    discard(LLVMBuildCondBr(ctx.builder, eq_i1, next_bb, ret_false_bb))
                    LLVMPositionBuilderAtEnd(ctx.builder, next_bb)
                }
            }
        }

        // Default: return true (shouldn't be reached for well-formed enums)
        LLVMPositionBuilderAtEnd(ctx.builder, default_bb)
        discard(LLVMBuildBr(ctx.builder, ret_true_bb))

        // ret_true block
        LLVMPositionBuilderAtEnd(ctx.builder, ret_true_bb)
        LLVMBuildRet(ctx.builder, box_bool(ctx, LLVMConstInt(ctx.i64_type, 1, 0)))

        // ret_false block
        LLVMPositionBuilderAtEnd(ctx.builder, ret_false_bb)
        LLVMBuildRet(ctx.builder, box_bool(ctx, LLVMConstInt(ctx.i64_type, 0, 0)))
    }

    ctx.current_fn = saved_fn
    LLVMPositionBuilderAtEnd(ctx.builder, saved_bb)
}

// Emit ring_<Type>_ne(self, other, ...dicts) -> Bool — always defined as !eq(self, other, ...dicts).
// The ne function mirrors eq's signature (including trailing dict params for generic types)
// and forwards all params to eq.
fn emit_struct_ne_fn(mut ctx: LlvmCtx, type_name: Str) {
    let mangled_ne = llvm_mangle_method(type_name, "ne")
    match ctx.functions.get(mangled_ne) {
        some(_) => { return },
        none => {},
    }

    let mangled_eq = llvm_mangle_method(type_name, "eq")
    if ctx.functions.get(mangled_eq).is_none() { return }
    let eq_fn = match ctx.functions.get(mangled_eq) {
        some(f) => f,
        none => panic("unreachable"),
    }
    let eq_fn_ty = match ctx.fn_types.get(mangled_eq) {
        some(t) => t,
        none => LLVMFunctionType(ctx.ptr_type, [ctx.ptr_type, ctx.ptr_type], 0),
    }

    // ne must have the same signature as eq (including trailing dict params)
    let eq_arity = LLVMCountParams(eq_fn)
    let mut ne_param_types: List<LLVMTypeRef> = []
    for i in 0..eq_arity { ne_param_types.push(ctx.ptr_type) }
    let fn_ty = LLVMFunctionType(ctx.ptr_type, ne_param_types, 0)
    let fn_val = LLVMAddFunction(ctx.module, mangled_ne, fn_ty)
    ctx.functions.insert(mangled_ne, fn_val)
    ctx.fn_types.insert(mangled_ne, fn_ty)

    let saved_fn = ctx.current_fn
    let saved_bb = LLVMGetInsertBlock(ctx.builder)
    ctx.current_fn = some(fn_val)

    let entry = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "entry")
    LLVMPositionBuilderAtEnd(ctx.builder, entry)

    // Forward all params (self, other, ...dicts) to eq
    let mut eq_args: List<LLVMValueRef> = []
    for i in 0..eq_arity {
        eq_args.push(LLVMGetParam(fn_val, i))
    }

    // Call eq(self, other, ...dicts) and negate
    let eq_result = LLVMBuildCall2(ctx.builder, eq_fn_ty, eq_fn, eq_args, fresh_name(ctx, "eqr"))
    // Unbox bool, negate (1 - val), rebox
    let raw = unbox_int(ctx, eq_result)
    let one = LLVMConstInt(ctx.i64_type, 1, 0)
    let neg = LLVMBuildSub(ctx.builder, one, raw, fresh_name(ctx, "neg"))
    let result = box_bool(ctx, neg)
    LLVMBuildRet(ctx.builder, result)

    ctx.current_fn = saved_fn
    LLVMPositionBuilderAtEnd(ctx.builder, saved_bb)
}

// Compare two field values and return an i1 result.
fn emit_field_eq_cmp(mut ctx: LlvmCtx, lhs: LLVMValueRef, rhs: LLVMValueRef, action: FieldAction) -> LLVMValueRef {
    match action {
        FieldAction::Identity => {
            // Identity covers Int, Str, Unit (tagged or heap Str).
            emit_identity_eq_cmp(ctx, lhs, rhs)
        },
        FieldAction::FloatIdentity => {
            // Float is heap-allocated (ring_box_float). Unbox both and FCmp OEQ.
            emit_float_identity_eq_cmp(ctx, lhs, rhs)
        },
        FieldAction::BoolIdentity => {
            // Bool is tagged (like Int). Raw ptrtoint compare is correct.
            let lhs_int = llvm_ptrtoint(ctx, lhs)
            let rhs_int = llvm_ptrtoint(ctx, rhs)
            LLVMBuildICmp(ctx.builder, 32, lhs_int, rhs_int, fresh_name(ctx, "beq"))
        },
        FieldAction::Call { dict_name, extra_dicts } => {
            // Call the dict's eq method on the two values.
            // Resolve the dict, load eq closure (slot 0), call it.
            emit_dict_eq_call(ctx, lhs, rhs, dict_name, extra_dicts)
        },
        FieldAction::Tuple { element_actions } => {
            // Tuple fields: compare element by element.
            // For simplicity, use the runtime's ring_list_get for element access.
            emit_tuple_eq_cmp(ctx, lhs, rhs, element_actions)
        },
        FieldAction::FnLiteral => {
            // Functions can't be compared — always true (shouldn't happen for Eq)
            LLVMBuildICmp(ctx.builder, 32,
                LLVMConstInt(ctx.i64_type, 0, 0),
                LLVMConstInt(ctx.i64_type, 0, 0),
                fresh_name(ctx, "ftrue"))
        },
    }
}

// Identity compare: handles tagged pointers (Int) and heap objects (Str).
// Uses the tag bit (bit 0) to distinguish: tagged → raw ptrtoint compare,
// heap → ring_str_eq.  Float and Bool have dedicated FieldAction variants
// (FloatIdentity, BoolIdentity) and no longer reach here.
fn emit_identity_eq_cmp(mut ctx: LlvmCtx, lhs: LLVMValueRef, rhs: LLVMValueRef) -> LLVMValueRef {
    let current_fn = match ctx.current_fn {
        some(f) => f,
        none => panic("LLVM codegen: emit_identity_eq_cmp outside function"),
    }

    // Convert pointers to integers for tag checking
    let lhs_int = llvm_ptrtoint(ctx, lhs)
    let rhs_int = llvm_ptrtoint(ctx, rhs)
    let one = LLVMConstInt(ctx.i64_type, 1, 0)
    let lhs_tag = llvm_and(ctx, lhs_int, one)

    // 32 = LLVMIntEQ
    let is_tagged = LLVMBuildICmp(ctx.builder, 32, lhs_tag, one, fresh_name(ctx, "tag"))

    let tagged_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "eq.tagged")
    let heap_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "eq.heap")
    let merge_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "eq.merge")

    discard(LLVMBuildCondBr(ctx.builder, is_tagged, tagged_bb, heap_bb))

    // Tagged path: raw ptrtoint compare (correct for Int and Bool)
    LLVMPositionBuilderAtEnd(ctx.builder, tagged_bb)
    let tagged_eq = LLVMBuildICmp(ctx.builder, 32, lhs_int, rhs_int, fresh_name(ctx, "teq"))
    let tagged_end = LLVMGetInsertBlock(ctx.builder)
    discard(LLVMBuildBr(ctx.builder, merge_bb))

    // Heap path: call ring_str_eq (correct for Str — the only Identity heap type
    // that appears in Eq derivation; Unit is also tagged in practice).
    LLVMPositionBuilderAtEnd(ctx.builder, heap_bb)
    let eq_fn = get_or_declare_runtime_fn(ctx, "ring_str_eq", [ctx.ptr_type, ctx.ptr_type], ctx.i64_type)
    let eq_ty = get_rt_fn_type(ctx, "ring_str_eq")
    let heap_result = LLVMBuildCall2(ctx.builder, eq_ty, eq_fn, [lhs, rhs], fresh_name(ctx, "heq"))
    // ring_str_eq returns i64 (1 or 0), convert to i1: result != 0
    let heap_eq = LLVMBuildICmp(ctx.builder, 33, heap_result, LLVMConstInt(ctx.i64_type, 0, 0), fresh_name(ctx, "hne"))
    let heap_end = LLVMGetInsertBlock(ctx.builder)
    discard(LLVMBuildBr(ctx.builder, merge_bb))

    // Merge: phi of the two i1 results
    LLVMPositionBuilderAtEnd(ctx.builder, merge_bb)
    let phi = LLVMBuildPhi(ctx.builder, ctx.i1_type, fresh_name(ctx, "feq"))
    LLVMAddIncoming(phi, [tagged_eq, heap_eq], [tagged_end, heap_end])
    phi
}

// Float identity eq: unbox both via ring_unbox_float, compare with FCmp OEQ.
fn emit_float_identity_eq_cmp(mut ctx: LlvmCtx, lhs: LLVMValueRef, rhs: LLVMValueRef) -> LLVMValueRef {
    let unbox_fn = get_or_declare_runtime_fn(ctx, "ring_unbox_float", [ctx.ptr_type], ctx.double_type)
    let unbox_ty = get_rt_fn_type(ctx, "ring_unbox_float")
    let lhs_raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [lhs], fresh_name(ctx, "lf"))
    let rhs_raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [rhs], fresh_name(ctx, "rf"))
    // 1 = LLVMRealOEQ (ordered and equal)
    LLVMBuildFCmp(ctx.builder, 1, lhs_raw, rhs_raw, fresh_name(ctx, "feq"))
}

// Dict-dispatched eq: resolve the dict, call its eq closure.
fn emit_dict_eq_call(mut ctx: LlvmCtx, lhs: LLVMValueRef, rhs: LLVMValueRef, dict_name: Str, extra_dicts: List<Str>) -> LLVMValueRef {
    // Resolve the dict by name — try dict_globals first (emit_trait_dict registered
    // its getter there), otherwise fall back to get_or_create_static_dict_getter.
    let dict_ptr = resolve_dict_for_derived(ctx, dict_name)

    // Load eq closure from dict slot 0 (B-104 D4 layout: { i64 count, ptr eq, ptr ne, ... }).
    let dict_struct_ty = LLVMStructTypeInContext(ctx.context, [ctx.i64_type, ctx.ptr_type, ctx.ptr_type, ctx.ptr_type, ctx.ptr_type], 0)
    let slot_ptr = LLVMBuildStructGEP2(ctx.builder, dict_struct_ty, dict_ptr, 1, fresh_name(ctx, "eqs"))
    let eq_closure = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, slot_ptr, fresh_name(ctx, "eqc"))

    // Call the closure: fn(env, lhs, rhs, ...extra_dicts) -> ptr (boxed Bool)
    // For nested generic structs, extra_dicts carries type-param dicts that the
    // callee's derived eq method needs (e.g. B_mid<T>.eq needs __ring_T_Eq).
    let closure_ty = LLVMStructTypeInContext(ctx.context, [ctx.ptr_type, ctx.ptr_type], 0)
    let fn_ptr_slot = LLVMBuildStructGEP2(ctx.builder, closure_ty, eq_closure, 0, fresh_name(ctx, "fps"))
    let fn_ptr = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, fn_ptr_slot, fresh_name(ctx, "fp"))
    let env_slot = LLVMBuildStructGEP2(ctx.builder, closure_ty, eq_closure, 1, fresh_name(ctx, "eps"))
    let env_ptr = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, env_slot, fresh_name(ctx, "ep"))

    // Build argument list: env, lhs, rhs, then resolved extra dicts
    let mut call_args: List<LLVMValueRef> = [env_ptr, lhs, rhs]
    let mut call_param_types: List<LLVMTypeRef> = [ctx.ptr_type, ctx.ptr_type, ctx.ptr_type]
    for ed in extra_dicts {
        call_args.push(resolve_dict_for_derived(ctx, ed))
        call_param_types.push(ctx.ptr_type)
    }
    let call_fn_ty = LLVMFunctionType(ctx.ptr_type, call_param_types, 0)
    let result = LLVMBuildCall2(ctx.builder, call_fn_ty, fn_ptr, call_args, fresh_name(ctx, "deq"))

    // Unbox the Bool result to i1
    let raw = unbox_int(ctx, result)
    // 33 = LLVMIntNE — raw != 0
    LLVMBuildICmp(ctx.builder, 33, raw, LLVMConstInt(ctx.i64_type, 0, 0), fresh_name(ctx, "di1"))
}

// Tuple eq: compare each element using ring_list_get.
fn emit_tuple_eq_cmp(mut ctx: LlvmCtx, lhs: LLVMValueRef, rhs: LLVMValueRef, element_actions: List<FieldAction>) -> LLVMValueRef {
    if element_actions.len() == 0 {
        // Empty tuple — always equal
        return LLVMBuildICmp(ctx.builder, 32,
            LLVMConstInt(ctx.i64_type, 0, 0),
            LLVMConstInt(ctx.i64_type, 0, 0),
            fresh_name(ctx, "ttrue"))
    }

    let current_fn = match ctx.current_fn {
        some(f) => f,
        none => panic("LLVM codegen: emit_tuple_eq_cmp outside function"),
    }

    let get_fn = get_or_declare_runtime_fn(ctx, "ring_list_get", [ctx.ptr_type, ctx.i64_type], ctx.ptr_type)
    let get_ty = get_rt_fn_type(ctx, "ring_list_get")

    let ret_false_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "tup.false")
    let ret_true_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "tup.true")

    for i in 0..element_actions.len() {
        let idx_val = LLVMConstInt(ctx.i64_type, i, 0)
        let lhs_elem = LLVMBuildCall2(ctx.builder, get_ty, get_fn, [lhs, idx_val], fresh_name(ctx, "le"))
        let rhs_elem = LLVMBuildCall2(ctx.builder, get_ty, get_fn, [rhs, idx_val], fresh_name(ctx, "re"))

        let elem_eq = emit_field_eq_cmp(ctx, lhs_elem, rhs_elem, element_actions[i])

        let next_bb = if i + 1 < element_actions.len() {
            LLVMAppendBasicBlockInContext(ctx.context, current_fn, "tup.${i + 1}")
        } else {
            ret_true_bb
        }
        discard(LLVMBuildCondBr(ctx.builder, elem_eq, next_bb, ret_false_bb))
        LLVMPositionBuilderAtEnd(ctx.builder, next_bb)
    }

    // At ret_true_bb now — but we need to return i1, not build a return.
    // The caller of emit_tuple_eq_cmp expects an i1 value. So we need a different approach.
    // Use a phi merge instead of return.
    let merge_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "tup.merge")
    let true_end = LLVMGetInsertBlock(ctx.builder)
    discard(LLVMBuildBr(ctx.builder, merge_bb))

    LLVMPositionBuilderAtEnd(ctx.builder, ret_false_bb)
    let false_end = LLVMGetInsertBlock(ctx.builder)
    discard(LLVMBuildBr(ctx.builder, merge_bb))

    LLVMPositionBuilderAtEnd(ctx.builder, merge_bb)
    let phi = LLVMBuildPhi(ctx.builder, ctx.i1_type, fresh_name(ctx, "teq"))
    let true_i1 = LLVMBuildICmp(ctx.builder, 32, LLVMConstInt(ctx.i64_type, 0, 0), LLVMConstInt(ctx.i64_type, 0, 0), fresh_name(ctx, "t"))
    let false_i1 = LLVMBuildICmp(ctx.builder, 33, LLVMConstInt(ctx.i64_type, 0, 0), LLVMConstInt(ctx.i64_type, 0, 0), fresh_name(ctx, "f"))
    LLVMAddIncoming(phi, [true_i1, false_i1], [true_end, false_end])
    phi
}

// Collect dict parameter names for a derived impl filtered by trait name.
// Returns names like "__ring_A_Eq" for each bound `A: Eq`.
fn collect_trait_dict_params(bounds: List<TraitBound>, trait_name: Str) -> List<Str> {
    let mut params: List<Str> = []
    for b in bounds {
        if b.trait_name == trait_name {
            params.push(trait_bound_param_name(b.type_param, b.trait_name))
        }
    }
    params
}

// Set up dict parameters for a derived method function.
// Adds trailing dict params to the function, creates allocas, stores params in named_values.
// Returns the next param index after all dict params.
fn setup_derived_dict_params(mut ctx: LlvmCtx, fn_val: LLVMValueRef, dict_params: List<Str>, start_idx: Int) {
    let mut param_idx = start_idx
    for dp in dict_params {
        let alloca = LLVMBuildAlloca(ctx.builder, ctx.ptr_type, dp)
        LLVMBuildStore(ctx.builder, LLVMGetParam(fn_val, param_idx), alloca)
        ctx.named_values.insert(dp, alloca)
        param_idx = param_idx + 1
    }
}

// Resolve a dict by name for derived impls.
fn resolve_dict_for_derived(mut ctx: LlvmCtx, name: Str) -> LLVMValueRef {
    // Check if this is a type-param dict passed as a function parameter
    // (e.g. "__ring_A_Eq" for a generic struct's derived Eq).
    match ctx.named_values.get(name) {
        some(alloca) => { return LLVMBuildLoad2(ctx.builder, ctx.ptr_type, alloca, fresh_name(ctx, "dp")) },
        none => {},
    }

    let init_fn_name = "ring_dict_init_${name}"
    match ctx.functions.get(init_fn_name) {
        some(init_fn) => {
            let init_fn_ty = match ctx.fn_types.get(init_fn_name) {
                some(t) => t,
                none => LLVMFunctionType(ctx.ptr_type, [], 0),
            }
            LLVMBuildCall2(ctx.builder, init_fn_ty, init_fn, [], fresh_name(ctx, "dict"))
        },
        none => {
            match ctx.dict_globals.get(name) {
                some(getter_fn) => {
                    let ft = LLVMFunctionType(ctx.ptr_type, [], 0)
                    LLVMBuildCall2(ctx.builder, ft, getter_fn, [], fresh_name(ctx, "dict"))
                },
                none => {
                    // Build a runtime request for the dict (builtin fallback).
                    let name_str = gen_str_lit_simple(ctx, name)
                    let bd_fn = get_or_declare_runtime_fn(ctx, "ring_get_builtin_dict", [ctx.ptr_type], ctx.ptr_type)
                    let bd_ty = get_rt_fn_type(ctx, "ring_get_builtin_dict")
                    LLVMBuildCall2(ctx.builder, bd_ty, bd_fn, [name_str], fresh_name(ctx, "bd"))
                },
            }
        },
    }
}

// Simple string literal generation (for dict name resolution).
fn gen_str_lit_simple(mut ctx: LlvmCtx, s: Str) -> LLVMValueRef {
    let str_fn = get_or_declare_runtime_fn(ctx, "ring_str_from_cstr", [ctx.ptr_type], ctx.ptr_type)
    let str_ty = get_rt_fn_type(ctx, "ring_str_from_cstr")
    // Build a global constant string
    let c_str = LLVMBuildGlobalStringPtr(ctx.builder, s, fresh_name(ctx, "str"))
    LLVMBuildCall2(ctx.builder, str_ty, str_fn, [c_str], fresh_name(ctx, "sl"))
}

// ── Clone ────────────────────────────────────────────────────
//
// ── Ord ──────────────────────────────────────────────────────

fn emit_derived_ord_llvm(mut ctx: LlvmCtx, di: DerivedImpl) {
    let type_name = di.type_name
    match di.type_kind {
        TypeKind::StructKind => match di.struct_fields {
            some(fields) => {
                emit_struct_cmp_fn(ctx, type_name, fields, di.bounds)
                emit_derived_trait_dict(ctx, type_name, "Ord")
            },
            none => {},
        },
        TypeKind::EnumKind => match di.enum_variants {
            some(variants) => {
                emit_enum_cmp_fn(ctx, type_name, variants, di.bounds)
                emit_derived_trait_dict(ctx, type_name, "Ord")
            },
            none => {},
        },
    }
}

// Emit ring_<Type>_cmp(self, other, ...dict_params) -> Int for a struct.
// Compares fields lexicographically: returns the first non-zero comparison.
fn emit_struct_cmp_fn(mut ctx: LlvmCtx, type_name: Str, fields: List<DerivedField>, bounds: List<TraitBound>) {
    let mangled = llvm_mangle_method(type_name, "cmp")
    match ctx.functions.get(mangled) {
        some(_) => { return },
        none => {},
    }

    // Collect dict params for Ord bounds
    let dict_params = collect_trait_dict_params(bounds, "Ord")

    let mut param_types: List<LLVMTypeRef> = [ctx.ptr_type, ctx.ptr_type]
    for dp in dict_params { param_types.push(ctx.ptr_type) }
    let fn_ty = LLVMFunctionType(ctx.ptr_type, param_types, 0)
    let fn_val = LLVMAddFunction(ctx.module, mangled, fn_ty)
    ctx.functions.insert(mangled, fn_val)
    ctx.fn_types.insert(mangled, fn_ty)

    let saved_fn = ctx.current_fn
    let saved_bb = LLVMGetInsertBlock(ctx.builder)
    ctx.current_fn = some(fn_val)

    let entry = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "entry")
    LLVMPositionBuilderAtEnd(ctx.builder, entry)

    // Map dict params to named_values
    setup_derived_dict_params(ctx, fn_val, dict_params, 2)

    let self_val = LLVMGetParam(fn_val, 0)
    let other_val = LLVMGetParam(fn_val, 1)

    // Zero fields -> always equal
    if fields.len() == 0 {
        LLVMBuildRet(ctx.builder, box_int(ctx, LLVMConstInt(ctx.i64_type, 0, 0)))
        ctx.current_fn = saved_fn
        LLVMPositionBuilderAtEnd(ctx.builder, saved_bb)
        return
    }

    if ctx.struct_types.get(type_name).is_none() {
        LLVMBuildRet(ctx.builder, box_int(ctx, LLVMConstInt(ctx.i64_type, 0, 0)))
        ctx.current_fn = saved_fn
        LLVMPositionBuilderAtEnd(ctx.builder, saved_bb)
        return
    }
    let struct_info = match ctx.struct_types.get(type_name) {
        some(info) => info,
        none => panic("unreachable"),
    }

    // For each field, compute cmp result. If non-zero, return it immediately.
    // Chain: entry -> cmp0 -> check0 -> cmp1 -> check1 -> ... -> ret_last
    //                           \         \
    //                          ret_nz    ret_nz
    for fi in 0..fields.len() {
        let field = fields[fi]
        let field_idx = find_field_index(struct_info.field_names, field.name)
        if field_idx < 0 { continue }

        let self_fp = LLVMBuildStructGEP2(ctx.builder, struct_info.llvm_type, self_val, field_idx, fresh_name(ctx, "sf"))
        let self_fv = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, self_fp, fresh_name(ctx, "sv"))
        let other_fp = LLVMBuildStructGEP2(ctx.builder, struct_info.llvm_type, other_val, field_idx, fresh_name(ctx, "of"))
        let other_fv = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, other_fp, fresh_name(ctx, "ov"))

        // Get cmp result as boxed Int (-1/0/1)
        let cmp_val = emit_field_cmp(ctx, self_fv, other_fv, field.action)

        if fi < fields.len() - 1 {
            // Not the last field: check if result is non-zero, if so return it
            let raw = unbox_int(ctx, cmp_val)
            let is_zero = LLVMBuildICmp(ctx.builder, 32, raw, LLVMConstInt(ctx.i64_type, 0, 0), fresh_name(ctx, "iz"))
            let ret_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "ret.nz.${fi}")
            let next_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "cmp.${fi + 1}")
            discard(LLVMBuildCondBr(ctx.builder, is_zero, next_bb, ret_bb))

            LLVMPositionBuilderAtEnd(ctx.builder, ret_bb)
            discard(LLVMBuildRet(ctx.builder, cmp_val))

            LLVMPositionBuilderAtEnd(ctx.builder, next_bb)
        } else {
            // Last field: return its result directly
            discard(LLVMBuildRet(ctx.builder, cmp_val))
        }
    }

    ctx.current_fn = saved_fn
    LLVMPositionBuilderAtEnd(ctx.builder, saved_bb)
}

// Emit ring_<Type>_cmp for enums.
// Compares tag first, then fields per variant if tags are equal.
fn emit_enum_cmp_fn(mut ctx: LlvmCtx, type_name: Str, variants: List<DerivedVariant>, bounds: List<TraitBound>) {
    let mangled = llvm_mangle_method(type_name, "cmp")
    match ctx.functions.get(mangled) {
        some(_) => { return },
        none => {},
    }

    // Collect dict params for Ord bounds
    let dict_params = collect_trait_dict_params(bounds, "Ord")

    let mut param_types: List<LLVMTypeRef> = [ctx.ptr_type, ctx.ptr_type]
    for dp in dict_params { param_types.push(ctx.ptr_type) }
    let fn_ty = LLVMFunctionType(ctx.ptr_type, param_types, 0)
    let fn_val = LLVMAddFunction(ctx.module, mangled, fn_ty)
    ctx.functions.insert(mangled, fn_val)
    ctx.fn_types.insert(mangled, fn_ty)

    let saved_fn = ctx.current_fn
    let saved_bb = LLVMGetInsertBlock(ctx.builder)
    ctx.current_fn = some(fn_val)

    let entry = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "entry")
    LLVMPositionBuilderAtEnd(ctx.builder, entry)

    // Map dict params to named_values
    setup_derived_dict_params(ctx, fn_val, dict_params, 2)

    let self_val = LLVMGetParam(fn_val, 0)
    let other_val = LLVMGetParam(fn_val, 1)

    // Load enum type info for field GEP
    if ctx.enum_types.get(type_name).is_none() {
        // Fallback: return 0 (shouldn't happen for registered enums)
        LLVMBuildRet(ctx.builder, box_int(ctx, LLVMConstInt(ctx.i64_type, 0, 0)))
        ctx.current_fn = saved_fn
        LLVMPositionBuilderAtEnd(ctx.builder, saved_bb)
        return
    }
    let enum_info = match ctx.enum_types.get(type_name) {
        some(info) => info,
        none => panic("unreachable"),
    }

    // Load tags
    let tag_ty = LLVMStructTypeInContext(ctx.context, [ctx.i64_type], 0)
    let self_tag_ptr = LLVMBuildStructGEP2(ctx.builder, tag_ty, self_val, 0, fresh_name(ctx, "stp"))
    let self_tag = LLVMBuildLoad2(ctx.builder, ctx.i64_type, self_tag_ptr, fresh_name(ctx, "stv"))
    let other_tag_ptr = LLVMBuildStructGEP2(ctx.builder, tag_ty, other_val, 0, fresh_name(ctx, "otp"))
    let other_tag = LLVMBuildLoad2(ctx.builder, ctx.i64_type, other_tag_ptr, fresh_name(ctx, "otv"))

    // Compare tags
    let tags_eq = LLVMBuildICmp(ctx.builder, 32, self_tag, other_tag, fresh_name(ctx, "teq"))

    let tags_diff_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "tags.diff")
    let tags_same_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "tags.same")

    discard(LLVMBuildCondBr(ctx.builder, tags_eq, tags_same_bb, tags_diff_bb))

    // Tags differ: return tag comparison result (-1 or 1)
    LLVMPositionBuilderAtEnd(ctx.builder, tags_diff_bb)
    // 40 = LLVMIntSLT (signed less-than)
    let self_lt = LLVMBuildICmp(ctx.builder, 40, self_tag, other_tag, fresh_name(ctx, "slt"))
    let lt_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "tag.lt")
    let gt_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "tag.gt")
    let tag_merge = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "tag.merge")
    discard(LLVMBuildCondBr(ctx.builder, self_lt, lt_bb, gt_bb))

    LLVMPositionBuilderAtEnd(ctx.builder, lt_bb)
    // Use two's complement for -1: on 64-bit, -1 = 0xFFFFFFFFFFFFFFFF
    // LLVMConstInt with sign_extend=1 sign-extends from the given bit width
    let neg_one = LLVMConstInt(ctx.i64_type, 0 - 1, 1)
    let lt_val = box_int(ctx, neg_one)
    let lt_end = LLVMGetInsertBlock(ctx.builder)
    discard(LLVMBuildBr(ctx.builder, tag_merge))

    LLVMPositionBuilderAtEnd(ctx.builder, gt_bb)
    let gt_val = box_int(ctx, LLVMConstInt(ctx.i64_type, 1, 0))
    let gt_end = LLVMGetInsertBlock(ctx.builder)
    discard(LLVMBuildBr(ctx.builder, tag_merge))

    LLVMPositionBuilderAtEnd(ctx.builder, tag_merge)
    let tag_phi = LLVMBuildPhi(ctx.builder, ctx.ptr_type, fresh_name(ctx, "tcmp"))
    LLVMAddIncoming(tag_phi, [lt_val, gt_val], [lt_end, gt_end])
    LLVMBuildRet(ctx.builder, tag_phi)

    // Tags same: switch on tag value, compare fields per variant
    LLVMPositionBuilderAtEnd(ctx.builder, tags_same_bb)

    // Default case for switch — return 0 (equal)
    let cmp_default_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "cmp.default")
    let cmp_switch = LLVMBuildSwitch(ctx.builder, self_tag, cmp_default_bb, variants.len())

    for vi in 0..variants.len() {
        let variant = variants[vi]
        let var_tag = match enum_info.variants.get(variant.name) {
            some(vinfo) => vinfo.tag,
            none => vi,
        }

        let case_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "cmp.v.${variant.name}")
        LLVMAddCase(cmp_switch, LLVMConstInt(ctx.i64_type, var_tag, 0), case_bb)
        LLVMPositionBuilderAtEnd(ctx.builder, case_bb)

        if variant.fields.len() == 0 {
            // No fields — tags match so equal → return 0
            discard(LLVMBuildRet(ctx.builder, box_int(ctx, LLVMConstInt(ctx.i64_type, 0, 0))))
        } else {
            // Compare each field with short-circuit (non-zero → return immediately)
            for fi in 0..variant.fields.len() {
                let field = variant.fields[fi]
                // Enum layout: { i64 tag, ptr field0, ptr field1, ... }
                let self_fp = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, self_val, fi + 1, fresh_name(ctx, "sf"))
                let self_fv = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, self_fp, fresh_name(ctx, "sv"))
                let other_fp = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, other_val, fi + 1, fresh_name(ctx, "of"))
                let other_fv = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, other_fp, fresh_name(ctx, "ov"))

                let cmp_val = emit_field_cmp(ctx, self_fv, other_fv, field.action)

                if fi < variant.fields.len() - 1 {
                    // Not the last field: if non-zero, return it
                    let raw = unbox_int(ctx, cmp_val)
                    let is_zero = LLVMBuildICmp(ctx.builder, 32, raw, LLVMConstInt(ctx.i64_type, 0, 0), fresh_name(ctx, "iz"))
                    let ret_nz_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "cmp.v.${variant.name}.ret.${fi}")
                    let next_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "cmp.v.${variant.name}.f${fi + 1}")
                    discard(LLVMBuildCondBr(ctx.builder, is_zero, next_bb, ret_nz_bb))

                    LLVMPositionBuilderAtEnd(ctx.builder, ret_nz_bb)
                    discard(LLVMBuildRet(ctx.builder, cmp_val))

                    LLVMPositionBuilderAtEnd(ctx.builder, next_bb)
                } else {
                    // Last field: return its result directly
                    discard(LLVMBuildRet(ctx.builder, cmp_val))
                }
            }
        }
    }

    // Default: return 0 (shouldn't be reached for well-formed enums)
    LLVMPositionBuilderAtEnd(ctx.builder, cmp_default_bb)
    LLVMBuildRet(ctx.builder, box_int(ctx, LLVMConstInt(ctx.i64_type, 0, 0)))

    ctx.current_fn = saved_fn
    LLVMPositionBuilderAtEnd(ctx.builder, saved_bb)
}

// Compare two field values for Ord and return a boxed Int (-1/0/1).
fn emit_field_cmp(mut ctx: LlvmCtx, lhs: LLVMValueRef, rhs: LLVMValueRef, action: FieldAction) -> LLVMValueRef {
    match action {
        FieldAction::Identity => {
            emit_identity_cmp(ctx, lhs, rhs)
        },
        FieldAction::FloatIdentity => {
            // Float Ord: unbox both, FCmp to produce -1/0/1.
            emit_float_identity_cmp(ctx, lhs, rhs)
        },
        FieldAction::BoolIdentity => {
            // Bool Ord: tagged pointers, same as Int — unbox and signed compare.
            emit_identity_cmp(ctx, lhs, rhs)
        },
        FieldAction::Call { dict_name, extra_dicts } => {
            emit_dict_cmp_call(ctx, lhs, rhs, dict_name, extra_dicts)
        },
        FieldAction::Tuple { element_actions } => {
            // Tuple cmp: compare elements sequentially
            emit_tuple_cmp(ctx, lhs, rhs, element_actions)
        },
        FieldAction::FnLiteral => {
            // Functions can't be compared — return 0 (shouldn't happen for Ord)
            box_int(ctx, LLVMConstInt(ctx.i64_type, 0, 0))
        },
    }
}

// Float identity cmp for Ord: unbox both via ring_unbox_float, compare to produce -1/0/1.
fn emit_float_identity_cmp(mut ctx: LlvmCtx, lhs: LLVMValueRef, rhs: LLVMValueRef) -> LLVMValueRef {
    let current_fn = match ctx.current_fn {
        some(f) => f,
        none => panic("LLVM codegen: emit_float_identity_cmp outside function"),
    }

    let unbox_fn = get_or_declare_runtime_fn(ctx, "ring_unbox_float", [ctx.ptr_type], ctx.double_type)
    let unbox_ty = get_rt_fn_type(ctx, "ring_unbox_float")
    let lhs_raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [lhs], fresh_name(ctx, "lf"))
    let rhs_raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [rhs], fresh_name(ctx, "rf"))

    // 4 = LLVMRealOLT (ordered less-than)
    let is_lt = LLVMBuildFCmp(ctx.builder, 4, lhs_raw, rhs_raw, fresh_name(ctx, "flt"))
    // 2 = LLVMRealOGT (ordered greater-than)
    let is_gt = LLVMBuildFCmp(ctx.builder, 2, lhs_raw, rhs_raw, fresh_name(ctx, "fgt"))

    let lt_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "fcmp.lt")
    let gt_check_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "fcmp.gtchk")
    let gt_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "fcmp.gt")
    let eq_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "fcmp.eq")
    let merge_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "fcmp.merge")

    discard(LLVMBuildCondBr(ctx.builder, is_lt, lt_bb, gt_check_bb))

    LLVMPositionBuilderAtEnd(ctx.builder, lt_bb)
    let neg_one = LLVMConstInt(ctx.i64_type, 0 - 1, 1)
    let lt_val = box_int(ctx, neg_one)
    let lt_end = LLVMGetInsertBlock(ctx.builder)
    discard(LLVMBuildBr(ctx.builder, merge_bb))

    LLVMPositionBuilderAtEnd(ctx.builder, gt_check_bb)
    discard(LLVMBuildCondBr(ctx.builder, is_gt, gt_bb, eq_bb))

    LLVMPositionBuilderAtEnd(ctx.builder, gt_bb)
    let gt_val = box_int(ctx, LLVMConstInt(ctx.i64_type, 1, 0))
    let gt_end = LLVMGetInsertBlock(ctx.builder)
    discard(LLVMBuildBr(ctx.builder, merge_bb))

    LLVMPositionBuilderAtEnd(ctx.builder, eq_bb)
    let eq_val = box_int(ctx, LLVMConstInt(ctx.i64_type, 0, 0))
    let eq_end = LLVMGetInsertBlock(ctx.builder)
    discard(LLVMBuildBr(ctx.builder, merge_bb))

    LLVMPositionBuilderAtEnd(ctx.builder, merge_bb)
    let phi = LLVMBuildPhi(ctx.builder, ctx.ptr_type, fresh_name(ctx, "fcmp"))
    LLVMAddIncoming(phi, [lt_val, gt_val, eq_val], [lt_end, gt_end, eq_end])
    phi
}

// Identity compare for Ord: handles tagged pointers (Int/Bool) and heap objects (Str).
// Tagged: unbox, signed compare, produce -1/0/1.
// Heap: call ring_cl_cmp_str (as a direct runtime helper).
fn emit_identity_cmp(mut ctx: LlvmCtx, lhs: LLVMValueRef, rhs: LLVMValueRef) -> LLVMValueRef {
    let current_fn = match ctx.current_fn {
        some(f) => f,
        none => panic("LLVM codegen: emit_identity_cmp outside function"),
    }

    // Check if tagged (low bit set)
    let lhs_int = llvm_ptrtoint(ctx, lhs)
    let rhs_int = llvm_ptrtoint(ctx, rhs)
    let one = LLVMConstInt(ctx.i64_type, 1, 0)
    let lhs_tag = llvm_and(ctx, lhs_int, one)
    let is_tagged = LLVMBuildICmp(ctx.builder, 32, lhs_tag, one, fresh_name(ctx, "tag"))

    let tagged_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "cmp.tagged")
    let heap_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "cmp.heap")
    let merge_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "cmp.merge")

    discard(LLVMBuildCondBr(ctx.builder, is_tagged, tagged_bb, heap_bb))

    // Tagged path: unbox both, signed compare, produce -1/0/1
    LLVMPositionBuilderAtEnd(ctx.builder, tagged_bb)
    let lhs_unboxed = LLVMBuildAShr(ctx.builder, lhs_int, one, fresh_name(ctx, "lu"))
    let rhs_unboxed = LLVMBuildAShr(ctx.builder, rhs_int, one, fresh_name(ctx, "ru"))
    // lt = lhs < rhs (signed)
    let is_lt = LLVMBuildICmp(ctx.builder, 40, lhs_unboxed, rhs_unboxed, fresh_name(ctx, "lt"))
    let is_gt = LLVMBuildICmp(ctx.builder, 38, lhs_unboxed, rhs_unboxed, fresh_name(ctx, "gt"))
    // Branch: lt -> -1, gt -> 1, else -> 0
    let t_lt_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "t.lt")
    let t_gt_check_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "t.gtchk")
    let t_gt_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "t.gt")
    let t_eq_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "t.eq")
    let t_merge_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "t.merge")

    discard(LLVMBuildCondBr(ctx.builder, is_lt, t_lt_bb, t_gt_check_bb))

    LLVMPositionBuilderAtEnd(ctx.builder, t_lt_bb)
    let neg_one = LLVMConstInt(ctx.i64_type, 0 - 1, 1)
    let t_lt_val = box_int(ctx, neg_one)
    let t_lt_end = LLVMGetInsertBlock(ctx.builder)
    discard(LLVMBuildBr(ctx.builder, t_merge_bb))

    LLVMPositionBuilderAtEnd(ctx.builder, t_gt_check_bb)
    discard(LLVMBuildCondBr(ctx.builder, is_gt, t_gt_bb, t_eq_bb))

    LLVMPositionBuilderAtEnd(ctx.builder, t_gt_bb)
    let t_gt_val = box_int(ctx, LLVMConstInt(ctx.i64_type, 1, 0))
    let t_gt_end = LLVMGetInsertBlock(ctx.builder)
    discard(LLVMBuildBr(ctx.builder, t_merge_bb))

    LLVMPositionBuilderAtEnd(ctx.builder, t_eq_bb)
    let t_eq_val = box_int(ctx, LLVMConstInt(ctx.i64_type, 0, 0))
    let t_eq_end = LLVMGetInsertBlock(ctx.builder)
    discard(LLVMBuildBr(ctx.builder, t_merge_bb))

    LLVMPositionBuilderAtEnd(ctx.builder, t_merge_bb)
    let tagged_result = LLVMBuildPhi(ctx.builder, ctx.ptr_type, fresh_name(ctx, "tres"))
    LLVMAddIncoming(tagged_result, [t_lt_val, t_gt_val, t_eq_val], [t_lt_end, t_gt_end, t_eq_end])
    let tagged_end = LLVMGetInsertBlock(ctx.builder)
    discard(LLVMBuildBr(ctx.builder, merge_bb))

    // Heap path: call ring_cl_cmp_str(null_env, lhs, rhs) -> boxed Int
    LLVMPositionBuilderAtEnd(ctx.builder, heap_bb)
    let cmp_fn = get_or_declare_runtime_fn(ctx, "ring_cl_cmp_str", [ctx.ptr_type, ctx.ptr_type, ctx.ptr_type], ctx.ptr_type)
    let cmp_ty = get_rt_fn_type(ctx, "ring_cl_cmp_str")
    let null_env = LLVMConstPointerNull(ctx.ptr_type)
    let heap_result = LLVMBuildCall2(ctx.builder, cmp_ty, cmp_fn, [null_env, lhs, rhs], fresh_name(ctx, "hcmp"))
    let heap_end = LLVMGetInsertBlock(ctx.builder)
    discard(LLVMBuildBr(ctx.builder, merge_bb))

    // Merge
    LLVMPositionBuilderAtEnd(ctx.builder, merge_bb)
    let phi = LLVMBuildPhi(ctx.builder, ctx.ptr_type, fresh_name(ctx, "fcmp"))
    LLVMAddIncoming(phi, [tagged_result, heap_result], [tagged_end, heap_end])
    phi
}

// Dict-dispatched cmp: resolve the dict, call its cmp closure.
fn emit_dict_cmp_call(mut ctx: LlvmCtx, lhs: LLVMValueRef, rhs: LLVMValueRef, dict_name: Str, extra_dicts: List<Str>) -> LLVMValueRef {
    let dict_ptr = resolve_dict_for_derived(ctx, dict_name)

    // Load cmp closure from dict slot 0 (Ord dict has only one method: cmp).
    let dict_struct_ty = LLVMStructTypeInContext(ctx.context, [ctx.i64_type, ctx.ptr_type], 0)
    let slot_ptr = LLVMBuildStructGEP2(ctx.builder, dict_struct_ty, dict_ptr, 1, fresh_name(ctx, "cmps"))
    let cmp_closure = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, slot_ptr, fresh_name(ctx, "cmpc"))

    // Call the closure: fn(env, lhs, rhs, ...extra_dicts) -> ptr (boxed Int)
    // For nested generic structs, extra_dicts carries type-param dicts that the
    // callee's derived cmp method needs.
    let closure_ty = LLVMStructTypeInContext(ctx.context, [ctx.ptr_type, ctx.ptr_type], 0)
    let fn_ptr_slot = LLVMBuildStructGEP2(ctx.builder, closure_ty, cmp_closure, 0, fresh_name(ctx, "fps"))
    let fn_ptr = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, fn_ptr_slot, fresh_name(ctx, "fp"))
    let env_slot = LLVMBuildStructGEP2(ctx.builder, closure_ty, cmp_closure, 1, fresh_name(ctx, "eps"))
    let env_ptr = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, env_slot, fresh_name(ctx, "ep"))

    // Build argument list: env, lhs, rhs, then resolved extra dicts
    let mut call_args: List<LLVMValueRef> = [env_ptr, lhs, rhs]
    let mut call_param_types: List<LLVMTypeRef> = [ctx.ptr_type, ctx.ptr_type, ctx.ptr_type]
    for ed in extra_dicts {
        call_args.push(resolve_dict_for_derived(ctx, ed))
        call_param_types.push(ctx.ptr_type)
    }
    let call_fn_ty = LLVMFunctionType(ctx.ptr_type, call_param_types, 0)
    LLVMBuildCall2(ctx.builder, call_fn_ty, fn_ptr, call_args, fresh_name(ctx, "dcmp"))
}

// Tuple cmp: compare each element using ring_list_get, short-circuit on non-zero.
fn emit_tuple_cmp(mut ctx: LlvmCtx, lhs: LLVMValueRef, rhs: LLVMValueRef, element_actions: List<FieldAction>) -> LLVMValueRef {
    if element_actions.len() == 0 {
        return box_int(ctx, LLVMConstInt(ctx.i64_type, 0, 0))
    }

    let current_fn = match ctx.current_fn {
        some(f) => f,
        none => panic("LLVM codegen: emit_tuple_cmp outside function"),
    }

    let list_get_fn = get_or_declare_runtime_fn(ctx, "ring_list_get", [ctx.ptr_type, ctx.i64_type], ctx.ptr_type)
    let list_get_ty = get_rt_fn_type(ctx, "ring_list_get")

    // For a single element, just compare directly
    if element_actions.len() == 1 {
        let idx = LLVMConstInt(ctx.i64_type, 0, 0)
        let l_elem = LLVMBuildCall2(ctx.builder, list_get_ty, list_get_fn, [lhs, idx], fresh_name(ctx, "le"))
        let r_elem = LLVMBuildCall2(ctx.builder, list_get_ty, list_get_fn, [rhs, idx], fresh_name(ctx, "re"))
        return emit_field_cmp(ctx, l_elem, r_elem, element_actions[0])
    }

    // Multiple elements: use alloca + branch for short-circuiting.
    // Store result in alloca, branch to exit on first non-zero.
    let result_alloca = LLVMBuildAlloca(ctx.builder, ctx.ptr_type, fresh_name(ctx, "tcr"))
    let zero_boxed = box_int(ctx, LLVMConstInt(ctx.i64_type, 0, 0))
    LLVMBuildStore(ctx.builder, zero_boxed, result_alloca)

    let exit_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "tc.exit")

    for i in 0..element_actions.len() {
        let idx = LLVMConstInt(ctx.i64_type, i, 0)
        let l_elem = LLVMBuildCall2(ctx.builder, list_get_ty, list_get_fn, [lhs, idx], fresh_name(ctx, "le"))
        let r_elem = LLVMBuildCall2(ctx.builder, list_get_ty, list_get_fn, [rhs, idx], fresh_name(ctx, "re"))
        let cmp_val = emit_field_cmp(ctx, l_elem, r_elem, element_actions[i])
        LLVMBuildStore(ctx.builder, cmp_val, result_alloca)

        if i < element_actions.len() - 1 {
            let raw = unbox_int(ctx, cmp_val)
            let is_zero = LLVMBuildICmp(ctx.builder, 32, raw, LLVMConstInt(ctx.i64_type, 0, 0), fresh_name(ctx, "iz"))
            let next_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "tc.next.${i}")
            // Non-zero → exit early; zero → continue to next element
            discard(LLVMBuildCondBr(ctx.builder, is_zero, next_bb, exit_bb))
            LLVMPositionBuilderAtEnd(ctx.builder, next_bb)
        } else {
            // Last element: fall through to exit
            discard(LLVMBuildBr(ctx.builder, exit_bb))
        }
    }

    LLVMPositionBuilderAtEnd(ctx.builder, exit_bb)
    LLVMBuildLoad2(ctx.builder, ctx.ptr_type, result_alloca, fresh_name(ctx, "tcres"))
}

// ── Clone ────────────────────────────────────────────────────

// Ring's Clone semantics under Perceus RC: clone = ring_dup (RC increment).
// This is correct because Ring values are immutable (copy-on-write via RC),
// so a shallow RC dup gives the same observable semantics as a deep copy.
// For struct/enum, we emit a `clone(self) -> ptr` that calls ring_dup(self).

fn emit_derived_clone_llvm(mut ctx: LlvmCtx, di: DerivedImpl) {
    let type_name = di.type_name
    emit_clone_fn(ctx, type_name)
    emit_derived_trait_dict(ctx, type_name, "Clone")
}

fn emit_clone_fn(mut ctx: LlvmCtx, type_name: Str) {
    let mangled = llvm_mangle_method(type_name, "clone")
    match ctx.functions.get(mangled) {
        some(_) => { return },
        none => {},
    }

    // clone(self) -> ptr
    let fn_ty = LLVMFunctionType(ctx.ptr_type, [ctx.ptr_type], 0)
    let fn_val = LLVMAddFunction(ctx.module, mangled, fn_ty)
    ctx.functions.insert(mangled, fn_val)
    ctx.fn_types.insert(mangled, fn_ty)

    let saved_fn = ctx.current_fn
    let saved_bb = LLVMGetInsertBlock(ctx.builder)
    ctx.current_fn = some(fn_val)

    let entry = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "entry")
    LLVMPositionBuilderAtEnd(ctx.builder, entry)

    let self_val = LLVMGetParam(fn_val, 0)
    // ring_dup increments the refcount; return self (same pointer, now shared)
    let dup_fn = get_or_declare_runtime_fn(ctx, "ring_dup", [ctx.ptr_type], ctx.void_type)
    let dup_ty = get_rt_fn_type(ctx, "ring_dup")
    discard(LLVMBuildCall2(ctx.builder, dup_ty, dup_fn, [self_val], ""))
    LLVMBuildRet(ctx.builder, self_val)

    ctx.current_fn = saved_fn
    LLVMPositionBuilderAtEnd(ctx.builder, saved_bb)
}

// ── Debug ────────────────────────────────────────────────────
//
// Debug generates a string representation:
//   struct Point { x: 1, y: 2 }  →  "Point { x: 1, y: 2 }"
//   enum Color::Red              →  "Red"
//   enum Shape::Circle(7)        →  "Circle(7)"
//
// Uses ring_sb_new / ring_sb_add / ring_sb_to_str for string building.

fn emit_derived_debug_llvm(mut ctx: LlvmCtx, di: DerivedImpl) {
    let type_name = di.type_name
    match di.type_kind {
        TypeKind::StructKind => match di.struct_fields {
            some(fields) => emit_struct_debug_fn(ctx, type_name, fields, di.bounds),
            none => {},
        },
        TypeKind::EnumKind => match di.enum_variants {
            some(variants) => emit_enum_debug_fn(ctx, type_name, variants, di.bounds),
            none => {},
        },
    }
    emit_derived_trait_dict(ctx, type_name, "Debug")
}

fn emit_struct_debug_fn(mut ctx: LlvmCtx, type_name: Str, fields: List<DerivedField>, bounds: List<TraitBound>) {
    let mangled = llvm_mangle_method(type_name, "debug")
    match ctx.functions.get(mangled) {
        some(_) => { return },
        none => {},
    }

    // Collect dict params for Debug bounds
    let dict_params = collect_trait_dict_params(bounds, "Debug")

    // debug(self, ...dict_params) -> ptr (Str)
    let mut param_types: List<LLVMTypeRef> = [ctx.ptr_type]
    for dp in dict_params { param_types.push(ctx.ptr_type) }
    let fn_ty = LLVMFunctionType(ctx.ptr_type, param_types, 0)
    let fn_val = LLVMAddFunction(ctx.module, mangled, fn_ty)
    ctx.functions.insert(mangled, fn_val)
    ctx.fn_types.insert(mangled, fn_ty)

    let saved_fn = ctx.current_fn
    let saved_bb = LLVMGetInsertBlock(ctx.builder)
    ctx.current_fn = some(fn_val)

    let entry = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "entry")
    LLVMPositionBuilderAtEnd(ctx.builder, entry)

    // Map dict params to named_values
    setup_derived_dict_params(ctx, fn_val, dict_params, 1)

    let self_val = LLVMGetParam(fn_val, 0)

    if fields.len() == 0 {
        // Zero fields: return "TypeName"
        let result = gen_str_lit_simple(ctx, type_name)
        LLVMBuildRet(ctx.builder, result)
        ctx.current_fn = saved_fn
        LLVMPositionBuilderAtEnd(ctx.builder, saved_bb)
        return
    }

    // Build string: "TypeName { field1: val1, field2: val2, ... }"
    let sb_new_fn = get_or_declare_runtime_fn(ctx, "ring_sb_new", [], ctx.ptr_type)
    let sb_new_ty = get_rt_fn_type(ctx, "ring_sb_new")
    let sb = LLVMBuildCall2(ctx.builder, sb_new_ty, sb_new_fn, [], fresh_name(ctx, "sb"))

    let sb_add_fn = get_or_declare_runtime_fn(ctx, "ring_sb_add", [ctx.ptr_type, ctx.ptr_type], ctx.ptr_type)
    let sb_add_ty = get_rt_fn_type(ctx, "ring_sb_add")

    let drop_fn = get_or_declare_runtime_fn(ctx, "ring_drop", [ctx.ptr_type], ctx.void_type)
    let drop_ty = get_rt_fn_type(ctx, "ring_drop")

    // Add "TypeName { "
    let prefix = gen_str_lit_simple(ctx, "${type_name} { ")
    discard(LLVMBuildCall2(ctx.builder, sb_add_ty, sb_add_fn, [sb, prefix], fresh_name(ctx, "sba")))
    discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [prefix], ""))

    // Look up struct field info for GEP
    if ctx.struct_types.get(type_name).is_none() {
        // Fallback: just return type_name
        let result = gen_str_lit_simple(ctx, type_name)
        discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [sb], ""))
        LLVMBuildRet(ctx.builder, result)
        ctx.current_fn = saved_fn
        LLVMPositionBuilderAtEnd(ctx.builder, saved_bb)
        return
    }
    let struct_info = match ctx.struct_types.get(type_name) {
        some(info) => info,
        none => panic("unreachable"),
    }

    for fi in 0..fields.len() {
        let field = fields[fi]

        // Add ", " separator after first field
        if fi > 0 {
            let sep = gen_str_lit_simple(ctx, ", ")
            discard(LLVMBuildCall2(ctx.builder, sb_add_ty, sb_add_fn, [sb, sep], fresh_name(ctx, "sba")))
            discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [sep], ""))
        }

        // Add "field_name: "
        let label = gen_str_lit_simple(ctx, "${field.name}: ")
        discard(LLVMBuildCall2(ctx.builder, sb_add_ty, sb_add_fn, [sb, label], fresh_name(ctx, "sba")))
        discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [label], ""))

        // Load field value
        let field_idx = find_field_index(struct_info.field_names, field.name)
        let field_ptr = LLVMBuildStructGEP2(ctx.builder, struct_info.llvm_type, self_val, field_idx, fresh_name(ctx, "fp"))
        let field_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, fresh_name(ctx, "fv"))

        // Convert to debug string and add
        let str_val = emit_debug_field_to_str(ctx, field_val, field.action)
        discard(LLVMBuildCall2(ctx.builder, sb_add_ty, sb_add_fn, [sb, str_val], fresh_name(ctx, "sba")))
        // Drop the temporary string if it was freshly allocated
        discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [str_val], ""))
    }

    // Add " }"
    let suffix = gen_str_lit_simple(ctx, " }")
    discard(LLVMBuildCall2(ctx.builder, sb_add_ty, sb_add_fn, [sb, suffix], fresh_name(ctx, "sba")))
    discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [suffix], ""))

    // Convert sb to string
    let sb_to_str_fn = get_or_declare_runtime_fn(ctx, "ring_sb_to_str", [ctx.ptr_type], ctx.ptr_type)
    let sb_to_str_ty = get_rt_fn_type(ctx, "ring_sb_to_str")
    let result = LLVMBuildCall2(ctx.builder, sb_to_str_ty, sb_to_str_fn, [sb], fresh_name(ctx, "dbg"))
    discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [sb], ""))
    LLVMBuildRet(ctx.builder, result)

    ctx.current_fn = saved_fn
    LLVMPositionBuilderAtEnd(ctx.builder, saved_bb)
}

fn emit_enum_debug_fn(mut ctx: LlvmCtx, type_name: Str, variants: List<DerivedVariant>, bounds: List<TraitBound>) {
    let mangled = llvm_mangle_method(type_name, "debug")
    match ctx.functions.get(mangled) {
        some(_) => { return },
        none => {},
    }

    // Collect dict params for Debug bounds
    let dict_params = collect_trait_dict_params(bounds, "Debug")

    // debug(self, ...dict_params) -> ptr (Str)
    let mut param_types: List<LLVMTypeRef> = [ctx.ptr_type]
    for dp in dict_params { param_types.push(ctx.ptr_type) }
    let fn_ty = LLVMFunctionType(ctx.ptr_type, param_types, 0)
    let fn_val = LLVMAddFunction(ctx.module, mangled, fn_ty)
    ctx.functions.insert(mangled, fn_val)
    ctx.fn_types.insert(mangled, fn_ty)

    let saved_fn = ctx.current_fn
    let saved_bb = LLVMGetInsertBlock(ctx.builder)
    ctx.current_fn = some(fn_val)

    let entry = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "entry")
    LLVMPositionBuilderAtEnd(ctx.builder, entry)

    // Map dict params to named_values
    setup_derived_dict_params(ctx, fn_val, dict_params, 1)

    let self_val = LLVMGetParam(fn_val, 0)

    // Read tag from enum: layout = { i64 tag, ptr field0, ... }
    if ctx.enum_types.get(type_name).is_none() {
        // Fallback: return "UnknownEnum"
        let result = gen_str_lit_simple(ctx, type_name)
        LLVMBuildRet(ctx.builder, result)
        ctx.current_fn = saved_fn
        LLVMPositionBuilderAtEnd(ctx.builder, saved_bb)
        return
    }
    let enum_info = match ctx.enum_types.get(type_name) {
        some(info) => info,
        none => panic("unreachable"),
    }

    let tag_ty = LLVMStructTypeInContext(ctx.context, [ctx.i64_type], 0)
    let tag_ptr = LLVMBuildStructGEP2(ctx.builder, tag_ty, self_val, 0, fresh_name(ctx, "tp"))
    let tag_val = LLVMBuildLoad2(ctx.builder, ctx.i64_type, tag_ptr, fresh_name(ctx, "tv"))

    // Default block for switch
    let default_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "dbg.default")
    let switch_val = LLVMBuildSwitch(ctx.builder, tag_val, default_bb, variants.len())

    let merge_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "dbg.merge")
    let mut incoming_vals: List<LLVMValueRef> = []
    let mut incoming_bbs: List<LLVMBasicBlockRef> = []

    for vi in 0..variants.len() {
        let variant = variants[vi]
        // Find the variant info to get its tag value
        let var_tag = match enum_info.variants.get(variant.name) {
            some(vinfo) => vinfo.tag,
            none => vi,  // fallback to index
        }

        let case_bb = LLVMAppendBasicBlockInContext(ctx.context, fn_val, "dbg.${variant.name}")
        LLVMAddCase(switch_val, LLVMConstInt(ctx.i64_type, var_tag, 0), case_bb)
        LLVMPositionBuilderAtEnd(ctx.builder, case_bb)

        let case_result = if variant.fields.len() == 0 {
            // Unit variant: just return the variant name
            gen_str_lit_simple(ctx, variant.name)
        } else {
            // Variant with fields: "Name(field0, field1)" or "Name { f: v }"
            emit_enum_variant_debug_str(ctx, self_val, type_name, variant, enum_info)
        }

        incoming_vals.push(case_result)
        let end_bb = LLVMGetInsertBlock(ctx.builder)
        incoming_bbs.push(end_bb)
        discard(LLVMBuildBr(ctx.builder, merge_bb))
    }

    // Default: return type_name
    LLVMPositionBuilderAtEnd(ctx.builder, default_bb)
    let default_result = gen_str_lit_simple(ctx, type_name)
    incoming_vals.push(default_result)
    incoming_bbs.push(default_bb)
    discard(LLVMBuildBr(ctx.builder, merge_bb))

    // Merge: phi of all variant results
    LLVMPositionBuilderAtEnd(ctx.builder, merge_bb)
    let phi = LLVMBuildPhi(ctx.builder, ctx.ptr_type, fresh_name(ctx, "dbgr"))
    LLVMAddIncoming(phi, incoming_vals, incoming_bbs)
    LLVMBuildRet(ctx.builder, phi)

    ctx.current_fn = saved_fn
    LLVMPositionBuilderAtEnd(ctx.builder, saved_bb)
}

fn emit_enum_variant_debug_str(mut ctx: LlvmCtx, self_val: LLVMValueRef, type_name: Str, variant: DerivedVariant, enum_info: EnumTypeInfo) -> LLVMValueRef {
    let sb_new_fn = get_or_declare_runtime_fn(ctx, "ring_sb_new", [], ctx.ptr_type)
    let sb_new_ty = get_rt_fn_type(ctx, "ring_sb_new")
    let sb = LLVMBuildCall2(ctx.builder, sb_new_ty, sb_new_fn, [], fresh_name(ctx, "sb"))

    let sb_add_fn = get_or_declare_runtime_fn(ctx, "ring_sb_add", [ctx.ptr_type, ctx.ptr_type], ctx.ptr_type)
    let sb_add_ty = get_rt_fn_type(ctx, "ring_sb_add")

    let drop_fn = get_or_declare_runtime_fn(ctx, "ring_drop", [ctx.ptr_type], ctx.void_type)
    let drop_ty = get_rt_fn_type(ctx, "ring_drop")

    if variant.has_named_fields {
        // Named fields: "Name { f1: v1, f2: v2 }"
        let prefix = gen_str_lit_simple(ctx, "${variant.name} { ")
        discard(LLVMBuildCall2(ctx.builder, sb_add_ty, sb_add_fn, [sb, prefix], fresh_name(ctx, "sba")))
        discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [prefix], ""))
    } else {
        // Positional fields: "Name(v0, v1)"
        let prefix = gen_str_lit_simple(ctx, "${variant.name}(")
        discard(LLVMBuildCall2(ctx.builder, sb_add_ty, sb_add_fn, [sb, prefix], fresh_name(ctx, "sba")))
        discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [prefix], ""))
    }

    // Get variant layout from enum_info (for field access we use enum_info.llvm_type)
    if enum_info.variants.get(variant.name).is_none() {
        let sb_to_str_fn = get_or_declare_runtime_fn(ctx, "ring_sb_to_str", [ctx.ptr_type], ctx.ptr_type)
        let sb_to_str_ty = get_rt_fn_type(ctx, "ring_sb_to_str")
        let result = LLVMBuildCall2(ctx.builder, sb_to_str_ty, sb_to_str_fn, [sb], fresh_name(ctx, "dbg"))
        discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [sb], ""))
        return result
    }

    for fi in 0..variant.fields.len() {
        let field = variant.fields[fi]

        if fi > 0 {
            let sep = gen_str_lit_simple(ctx, ", ")
            discard(LLVMBuildCall2(ctx.builder, sb_add_ty, sb_add_fn, [sb, sep], fresh_name(ctx, "sba")))
            discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [sep], ""))
        }

        if variant.has_named_fields {
            let label = gen_str_lit_simple(ctx, "${field.name}: ")
            discard(LLVMBuildCall2(ctx.builder, sb_add_ty, sb_add_fn, [sb, label], fresh_name(ctx, "sba")))
            discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [label], ""))
        }

        // Load field value: enum layout = { i64 tag, ptr field0, ptr field1, ... }
        // Field index in struct = fi + 1 (tag at index 0)
        let field_ptr = LLVMBuildStructGEP2(ctx.builder, enum_info.llvm_type, self_val, fi + 1, fresh_name(ctx, "efp"))
        let field_val = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, field_ptr, fresh_name(ctx, "efv"))

        let str_val = emit_debug_field_to_str(ctx, field_val, field.action)
        discard(LLVMBuildCall2(ctx.builder, sb_add_ty, sb_add_fn, [sb, str_val], fresh_name(ctx, "sba")))
        discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [str_val], ""))
    }

    // Close bracket
    let suffix = if variant.has_named_fields {
        gen_str_lit_simple(ctx, " }")
    } else {
        gen_str_lit_simple(ctx, ")")
    }
    discard(LLVMBuildCall2(ctx.builder, sb_add_ty, sb_add_fn, [sb, suffix], fresh_name(ctx, "sba")))
    discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [suffix], ""))

    let sb_to_str_fn = get_or_declare_runtime_fn(ctx, "ring_sb_to_str", [ctx.ptr_type], ctx.ptr_type)
    let sb_to_str_ty = get_rt_fn_type(ctx, "ring_sb_to_str")
    let result = LLVMBuildCall2(ctx.builder, sb_to_str_ty, sb_to_str_fn, [sb], fresh_name(ctx, "dbg"))
    discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [sb], ""))
    result
}

// Convert a field value to its debug string representation.
// Identity: tagged (Int) → int_to_str, heap (Str) → pass through
// FloatIdentity: unbox float → ring_float_to_str
// BoolIdentity: unbox tagged → ring_bool_to_str
// Call: invoke the field's Debug dict
// FnLiteral: "<fn>"
fn emit_debug_field_to_str(mut ctx: LlvmCtx, val: LLVMValueRef, action: FieldAction) -> LLVMValueRef {
    match action {
        FieldAction::Identity => emit_identity_to_debug_str(ctx, val),
        FieldAction::FloatIdentity => {
            // Float: unbox via ring_unbox_float, then ring_float_to_str.
            let unbox_fn = get_or_declare_runtime_fn(ctx, "ring_unbox_float", [ctx.ptr_type], ctx.double_type)
            let unbox_ty = get_rt_fn_type(ctx, "ring_unbox_float")
            let raw = LLVMBuildCall2(ctx.builder, unbox_ty, unbox_fn, [val], fresh_name(ctx, "uf"))
            let to_str_fn = get_or_declare_runtime_fn(ctx, "ring_float_to_str", [ctx.double_type], ctx.ptr_type)
            let to_str_ty = get_rt_fn_type(ctx, "ring_float_to_str")
            LLVMBuildCall2(ctx.builder, to_str_ty, to_str_fn, [raw], fresh_name(ctx, "fts"))
        },
        FieldAction::BoolIdentity => {
            // Bool: unbox tagged int, then ring_bool_to_str.
            let raw = unbox_int(ctx, val)
            let to_str_fn = get_or_declare_runtime_fn(ctx, "ring_bool_to_str", [ctx.i64_type], ctx.ptr_type)
            let to_str_ty = get_rt_fn_type(ctx, "ring_bool_to_str")
            LLVMBuildCall2(ctx.builder, to_str_ty, to_str_fn, [raw], fresh_name(ctx, "bts"))
        },
        FieldAction::Call { dict_name, extra_dicts } => {
            emit_dict_debug_call(ctx, val, dict_name, extra_dicts)
        },
        FieldAction::Tuple { element_actions } => {
            // Tuple: "(v0, v1, ...)"
            emit_tuple_debug_str(ctx, val, element_actions)
        },
        FieldAction::FnLiteral => gen_str_lit_simple(ctx, "<fn>"),
    }
}

// Convert a primitive identity value to debug string.
// Tagged (bit 0 == 1) → Int → ring_int_to_str
// Non-tagged → Str → pass through (ring_dup to own it so caller can drop)
fn emit_identity_to_debug_str(mut ctx: LlvmCtx, val: LLVMValueRef) -> LLVMValueRef {
    let current_fn = match ctx.current_fn {
        some(f) => f,
        none => panic("LLVM codegen: emit_identity_to_debug_str outside function"),
    }

    let val_int = llvm_ptrtoint(ctx, val)
    let one = LLVMConstInt(ctx.i64_type, 1, 0)
    let tag_bit = llvm_and(ctx, val_int, one)
    let is_tagged = LLVMBuildICmp(ctx.builder, 32, tag_bit, one, fresh_name(ctx, "tag"))

    let tagged_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "dbg.tagged")
    let heap_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "dbg.heap")
    let merge_bb = LLVMAppendBasicBlockInContext(ctx.context, current_fn, "dbg.merge")

    discard(LLVMBuildCondBr(ctx.builder, is_tagged, tagged_bb, heap_bb))

    // Tagged path: unbox and convert to string via ring_int_to_str
    LLVMPositionBuilderAtEnd(ctx.builder, tagged_bb)
    let raw = unbox_int(ctx, val)
    let to_str_fn = get_or_declare_runtime_fn(ctx, "ring_int_to_str", [ctx.i64_type], ctx.ptr_type)
    let to_str_ty = get_rt_fn_type(ctx, "ring_int_to_str")
    let tagged_result = LLVMBuildCall2(ctx.builder, to_str_ty, to_str_fn, [raw], fresh_name(ctx, "its"))
    let tagged_end = LLVMGetInsertBlock(ctx.builder)
    discard(LLVMBuildBr(ctx.builder, merge_bb))

    // Heap path: it's a Str — ring_dup so caller can drop uniformly
    LLVMPositionBuilderAtEnd(ctx.builder, heap_bb)
    let dup_fn = get_or_declare_runtime_fn(ctx, "ring_dup", [ctx.ptr_type], ctx.void_type)
    let dup_ty = get_rt_fn_type(ctx, "ring_dup")
    discard(LLVMBuildCall2(ctx.builder, dup_ty, dup_fn, [val], ""))
    let heap_end = LLVMGetInsertBlock(ctx.builder)
    discard(LLVMBuildBr(ctx.builder, merge_bb))

    LLVMPositionBuilderAtEnd(ctx.builder, merge_bb)
    let phi = LLVMBuildPhi(ctx.builder, ctx.ptr_type, fresh_name(ctx, "dstr"))
    LLVMAddIncoming(phi, [tagged_result, val], [tagged_end, heap_end])
    phi
}

// Call a type's Debug dict to get its debug string.
fn emit_dict_debug_call(mut ctx: LlvmCtx, val: LLVMValueRef, dict_name: Str, extra_dicts: List<Str>) -> LLVMValueRef {
    let dict_ptr = resolve_dict_for_derived(ctx, dict_name)

    // Debug dict layout: { i64 count, ptr debug_closure }.
    // debug is at slot index 0 → struct index 1.
    let dict_struct_ty = LLVMStructTypeInContext(ctx.context, [ctx.i64_type, ctx.ptr_type], 0)
    let slot_ptr = LLVMBuildStructGEP2(ctx.builder, dict_struct_ty, dict_ptr, 1, fresh_name(ctx, "dbs"))
    let debug_closure = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, slot_ptr, fresh_name(ctx, "dbc"))

    // Call closure: fn(env, self, ...extra_dicts) -> ptr (Str)
    // For nested generic structs, extra_dicts carries type-param dicts that the
    // callee's derived debug method needs.
    let closure_ty = LLVMStructTypeInContext(ctx.context, [ctx.ptr_type, ctx.ptr_type], 0)
    let fn_ptr_slot = LLVMBuildStructGEP2(ctx.builder, closure_ty, debug_closure, 0, fresh_name(ctx, "fps"))
    let fn_ptr = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, fn_ptr_slot, fresh_name(ctx, "fp"))
    let env_slot = LLVMBuildStructGEP2(ctx.builder, closure_ty, debug_closure, 1, fresh_name(ctx, "eps"))
    let env_ptr = LLVMBuildLoad2(ctx.builder, ctx.ptr_type, env_slot, fresh_name(ctx, "ep"))

    // Build argument list: env, val, then resolved extra dicts
    let mut call_args: List<LLVMValueRef> = [env_ptr, val]
    let mut call_param_types: List<LLVMTypeRef> = [ctx.ptr_type, ctx.ptr_type]
    for ed in extra_dicts {
        call_args.push(resolve_dict_for_derived(ctx, ed))
        call_param_types.push(ctx.ptr_type)
    }
    let call_fn_ty = LLVMFunctionType(ctx.ptr_type, call_param_types, 0)
    LLVMBuildCall2(ctx.builder, call_fn_ty, fn_ptr, call_args, fresh_name(ctx, "dbr"))
}

// Build "(v0, v1, ...)" debug string for tuple fields.
fn emit_tuple_debug_str(mut ctx: LlvmCtx, val: LLVMValueRef, element_actions: List<FieldAction>) -> LLVMValueRef {
    if element_actions.len() == 0 {
        return gen_str_lit_simple(ctx, "()")
    }

    let sb_new_fn = get_or_declare_runtime_fn(ctx, "ring_sb_new", [], ctx.ptr_type)
    let sb_new_ty = get_rt_fn_type(ctx, "ring_sb_new")
    let sb = LLVMBuildCall2(ctx.builder, sb_new_ty, sb_new_fn, [], fresh_name(ctx, "sb"))

    let sb_add_fn = get_or_declare_runtime_fn(ctx, "ring_sb_add", [ctx.ptr_type, ctx.ptr_type], ctx.ptr_type)
    let sb_add_ty = get_rt_fn_type(ctx, "ring_sb_add")
    let drop_fn = get_or_declare_runtime_fn(ctx, "ring_drop", [ctx.ptr_type], ctx.void_type)
    let drop_ty = get_rt_fn_type(ctx, "ring_drop")
    let get_fn = get_or_declare_runtime_fn(ctx, "ring_list_get", [ctx.ptr_type, ctx.i64_type], ctx.ptr_type)
    let get_ty = get_rt_fn_type(ctx, "ring_list_get")

    let open_paren = gen_str_lit_simple(ctx, "(")
    discard(LLVMBuildCall2(ctx.builder, sb_add_ty, sb_add_fn, [sb, open_paren], fresh_name(ctx, "sba")))
    discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [open_paren], ""))

    for i in 0..element_actions.len() {
        if i > 0 {
            let sep = gen_str_lit_simple(ctx, ", ")
            discard(LLVMBuildCall2(ctx.builder, sb_add_ty, sb_add_fn, [sb, sep], fresh_name(ctx, "sba")))
            discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [sep], ""))
        }
        let idx_val = LLVMConstInt(ctx.i64_type, i, 0)
        let elem = LLVMBuildCall2(ctx.builder, get_ty, get_fn, [val, idx_val], fresh_name(ctx, "te"))
        let elem_str = emit_debug_field_to_str(ctx, elem, element_actions[i])
        discard(LLVMBuildCall2(ctx.builder, sb_add_ty, sb_add_fn, [sb, elem_str], fresh_name(ctx, "sba")))
        discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [elem_str], ""))
    }

    let close_paren = gen_str_lit_simple(ctx, ")")
    discard(LLVMBuildCall2(ctx.builder, sb_add_ty, sb_add_fn, [sb, close_paren], fresh_name(ctx, "sba")))
    discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [close_paren], ""))

    let sb_to_str_fn = get_or_declare_runtime_fn(ctx, "ring_sb_to_str", [ctx.ptr_type], ctx.ptr_type)
    let sb_to_str_ty = get_rt_fn_type(ctx, "ring_sb_to_str")
    let result = LLVMBuildCall2(ctx.builder, sb_to_str_ty, sb_to_str_fn, [sb], fresh_name(ctx, "dbg"))
    discard(LLVMBuildCall2(ctx.builder, drop_ty, drop_fn, [sb], ""))
    result
}

// Helper: find field index by name
fn find_field_index(field_names: List<Str>, target: Str) -> Int {
    for i in 0..field_names.len() {
        if field_names[i] == target { return i }
    }
    0 - 1
}

// Helper: ptrtoint
fn llvm_ptrtoint(mut ctx: LlvmCtx, val: LLVMValueRef) -> LLVMValueRef {
    LLVMBuildPtrToInt(ctx.builder, val, ctx.i64_type, fresh_name(ctx, "p2i"))
}

// Helper: bitwise AND
fn llvm_and(mut ctx: LlvmCtx, lhs: LLVMValueRef, rhs: LLVMValueRef) -> LLVMValueRef {
    LLVMBuildAnd(ctx.builder, lhs, rhs, fresh_name(ctx, "and"))
}

// Discard an LLVMValueRef (avoid unused warnings)
fn discard(v: LLVMValueRef) {}
