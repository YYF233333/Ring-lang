use types::{Type, Effect, EffectRow, StructField, EnumVariant, OwnershipShape,
    EMPTY_ROW, type_to_builtin_name, type_to_string,
    effect_to_string, nominal_display_name, fn_meta, ownership_shapes_equal,
    BUILTIN_RANGE, BUILTIN_LIST, BUILTIN_MAP, BUILTIN_SET,
    BUILTIN_OPTION, BUILTIN_CELL,
    BUILTIN_PTR,
    CALLABLE_BORROW_OWNED, CALLABLE_MOVE_OWNED,
    CALLABLE_FIRST_MUT_BORROW_OWNED, CALLABLE_MOVE_BORROW_OWNED,
    CALLABLE_BORROW_MUT_BORROW_OWNED,
    CALLABLE_MUT_BORROW_MOVE_OWNED, CALLABLE_SLOT_MOVE_OWNED,
    CALLABLE_SOURCE_DECLARED, CALLABLE_SOURCE_BUILTIN,
    CALLABLE_SOURCE_CONSERVATIVE_INTERFACE,
    CALLABLE_RESULT_ROLE_NONE, CALLABLE_RESULT_ROLE_FRESH_OWNED_SLOT,
    PARAM_OWNERSHIP_BORROW, PARAM_OWNERSHIP_MUT_BORROW,
    PARAM_OWNERSHIP_MOVE, intern_callable_param_modes,
    record_callable_ownership,
    fresh_callable_ownership_inference_term}
use ast::{Decl, Span, TypeParam, Param, TypeExpr, EffectOpDecl, StructFieldDecl,
    EnumVariantDecl, NamedEnumField, TypeBound, span_zero, EffectExpr, SigMember,
    UseDecl, UseImport}
use env::{TypeEnv, TypeScheme, SchemeBound, AssocConstraintEntry, StructDef, EnumDef, EffectDef, EffectOpDef,
    TraitDef, TraitMethodDef, ImplEntry, ImplDictBound, TypeAliasDef, FnBound, SigDef,
    EffectAliasDef, AssocTypeDef, MethodOrigin, mono, apply_subst, apply_subst_effect_map,
    apply_subst_map, add_impl, has_impl, find_impl, impl_origin, impl_decl_origin,
    install_method_scheme, specialize_trait_method_scheme, build_type_var_map,
    new_local_callable_scheme, trait_is_authoritative_drop}
use diagnostics::{DiagnosticContext}
use codes::{E0207, E0406, E0501, E0502, E0503, E0504, E0505, E0506, E0507, E0508, E0509, E0510, E0511, E0513, E0514, E0801}
use hir::{compare_by_first, module_item_identity, variant_ctor_name, ValueBindingKind}
use infer_ctx::{InferCtx, FnBoundsEntry, CompileError, type_error, resolve_type_expr, resolve_self_type, resolve_effect_expr,
    record_value_origin, record_variant_ctor_origin, record_value_binding_kind,
    resolve_dict_ref_for_type,
    resolve_mod_uses, bind_exact_import_alias,
    enter_project_root_frame, enter_project_child_frame,
    refresh_project_namespace_frame, exit_project_namespace_frame}
use infer_helpers::{is_value_type}

fn callable_param_modes(params: List<Param>) -> List<Int> {
    let mut modes: List<Int> = []
    for param in params {
        modes.push(if param.is_move {
            PARAM_OWNERSHIP_MOVE
        } else if param.is_mutable {
            PARAM_OWNERSHIP_MUT_BORROW
        } else {
            PARAM_OWNERSHIP_BORROW
        })
    }
    modes
}

fn interface_callable_ownership(
    mut env: TypeEnv, params: List<Param>
) -> Int {
    intern_callable_param_modes(
        env.types.ownership_metadata, callable_param_modes(params))
}

// Called only by checker::load_prelude after it has resolved the final local
// DefId and attached an unspellable prelude origin.  Generic extern
// registration must never consult this raw ABI spelling table.
pub fn exact_prelude_extern_ownership(
    mut env: TypeEnv, name: Str, params: List<Param>
) -> Int {
    if name == "ring_slot_alloc" {
        return CALLABLE_BORROW_OWNED
    }
    if name == "ring_slot_dealloc" {
        return CALLABLE_MOVE_BORROW_OWNED
    }
    if name == "ring_slot_read" {
        return CALLABLE_BORROW_OWNED
    }
    if name == "ring_slot_take" {
        return CALLABLE_FIRST_MUT_BORROW_OWNED
    }
    if name == "ring_slot_write" {
        return CALLABLE_MUT_BORROW_MOVE_OWNED
    }
    if name == "ring_slot_replace" {
        return CALLABLE_FIRST_MUT_BORROW_OWNED
    }
    if name == "ring_slot_swap" {
        return CALLABLE_FIRST_MUT_BORROW_OWNED
    }
    if name == "ring_slot_move" {
        return CALLABLE_SLOT_MOVE_OWNED
    }
    if name == "ring_slot_drop" {
        return CALLABLE_FIRST_MUT_BORROW_OWNED
    }
    interface_callable_ownership(env, params)
}

pub fn exact_prelude_extern_source(name: Str) -> Int {
    if name == "ring_slot_alloc" || name == "ring_slot_dealloc" ||
       name == "ring_slot_read" || name == "ring_slot_take" ||
       name == "ring_slot_write" || name == "ring_slot_replace" ||
       name == "ring_slot_swap" || name == "ring_slot_move" ||
       name == "ring_slot_drop" {
        CALLABLE_SOURCE_BUILTIN
    } else {
        CALLABLE_SOURCE_DECLARED
    }
}

// Called at the same exact-prelude trust boundary as the ABI ownership table
// above.  The raw spelling never escapes this registration step: consumers use
// only the freshly resolved prelude DefId stored in OwnershipMetadata.
pub fn exact_prelude_extern_result_role(name: Str) -> Int {
    if name == "ring_slot_read" || name == "ring_slot_take" {
        CALLABLE_RESULT_ROLE_FRESH_OWNED_SLOT
    } else {
        CALLABLE_RESULT_ROLE_NONE
    }
}

// ============================================================
// Public entry points
// ============================================================

// The source prelude owns the runtime collection identities that user modules
// are forbidden to redeclare.  Keep this as a narrow, explicit trust boundary:
// List/Map/Set may install their pure-Ring definitions here, while Ptr and every
// ordinary registration path retain the reserved-name rejection below.
pub fn register_prelude_decl_public(mut ctx: InferCtx, decl: Decl) {
    match decl {
        Decl::Struct { name, type_params, fields, span, .. } => {
            if name == BUILTIN_LIST || name == BUILTIN_MAP ||
               name == BUILTIN_SET {
                let definition_name = name
                preregister_struct_definition(ctx, definition_name, type_params)
            } else {
                preregister_struct(ctx, name, type_params, span)
            }
            complete_struct_fields(ctx, name, fields)
        },
        _ => register_decl(ctx, decl)
    }
}

pub fn insert_mod_aliases(mut ctx: InferCtx, mod_name: Str, decls: List<Decl>, guard: Bool) {
    for d in decls {
        match d {
            Decl::Struct { name, .. } => {
                let qualified = "${mod_name}::${name}"
                if !guard || !ctx.env.types.structs.contains_key(name) {
                    match ctx.env.types.structs.get(qualified) {
                        some(sdef) => {
                            let alias_name = name
                            let alias_def = sdef
                            ctx.env.types.structs.insert(alias_name, alias_def)
                        },
                        none => {}
                    }
                }
            },
            Decl::Enum { name, .. } => {
                let qualified = "${mod_name}::${name}"
                if !guard || !ctx.env.types.enums.contains_key(name) {
                    match ctx.env.types.enums.get(qualified) {
                        some(edef) => {
                            let alias_name = name
                            let alias_def = edef
                            ctx.env.types.enums.insert(alias_name, alias_def)
                        },
                        none => {}
                    }
                }
            },
            Decl::Trait { name, .. } => {
                let qualified = "${mod_name}::${name}"
                if !guard || !ctx.env.trait_reg.traits.contains_key(name) {
                    match ctx.env.trait_reg.traits.get(qualified) {
                        some(tdef) => {
                            let alias_name = name
                            let alias_def = tdef
                            ctx.env.trait_reg.traits.insert(alias_name, alias_def)
                        },
                        none => {}
                    }
                }
            },
            Decl::Effect { name, .. } => {
                let qualified = "${mod_name}::${name}"
                if !guard || !ctx.env.types.effects.contains_key(name) {
                    match ctx.env.types.effects.get(qualified) {
                        some(edef) => {
                            let alias_name = name
                            let alias_def = edef
                            ctx.env.types.effects.insert(alias_name, alias_def)
                        },
                        none => {}
                    }
                }
            },
            Decl::EffectAlias { name, .. } => {
                let qualified = "${mod_name}::${name}"
                if !guard || !ctx.env.types.effect_aliases.contains_key(name) {
                    match ctx.env.types.effect_aliases.get(qualified) {
                        some(adef) => {
                            let alias_name = name
                            let alias_def = adef
                            ctx.env.types.effect_aliases.insert(alias_name, alias_def)
                        },
                        none => {}
                    }
                }
            },
            Decl::TypeAlias { name, .. } => {
                let qualified = "${mod_name}::${name}"
                if !guard || !ctx.env.types.type_aliases.contains_key(name) {
                    match ctx.env.types.type_aliases.get(qualified) {
                        some(adef) => {
                            let alias_name = name
                            let alias_def = adef
                            ctx.env.types.type_aliases.insert(alias_name, alias_def)
                        },
                        none => {}
                    }
                }
            },
            Decl::ExternType { name, .. } => {
                let qualified = "${mod_name}::${name}"
                match ctx.env.types.structs.get(qualified) {
                    some(def) => {
                        if !guard || !ctx.env.types.structs.contains_key(name) {
                            let alias_name = name
                            let alias_def = def
                            ctx.env.types.structs.insert(alias_name, alias_def)
                        }
                    },
                    none => match ctx.env.types.structs.get(name) {
                        some(def) => {
                            // Extern types keep their raw ABI identity, while
                            // relative imports still need a qualified source key.
                            let qualified_alias = qualified
                            let qualified_def = def
                            ctx.env.types.structs.insert(
                                qualified_alias, qualified_def)
                        },
                        none => {}
                    }
                }
            },
            Decl::Sig { name, .. } => {
                let qualified = "${mod_name}::${name}"
                if !guard || !ctx.env.types.sigs.contains_key(name) {
                    match ctx.env.types.sigs.get(qualified) {
                        some(def) => {
                            let alias_name = name
                            let alias_def = def
                            ctx.env.types.sigs.insert(alias_name, alias_def)
                        },
                        none => {}
                    }
                }
            },
            _ => {}
        }
    }
}

pub fn prefix_decl_name(mod_name: Str, decl: Decl) -> Decl {
    match decl {
        Decl::Fn { name, type_params, params, return_type, declared_effects, body, is_pub, is_abstract, span } => {
            let result_type_params = type_params
            let result_params = params
            let result_return_type = return_type
            let result_declared_effects = declared_effects
            let result_body = body
            let result_span = span
            Decl::Fn {
                name: "${mod_name}::${name}",
                type_params: result_type_params, params: result_params,
                return_type: result_return_type,
                declared_effects: result_declared_effects, body: result_body,
                is_pub: is_pub, is_abstract: is_abstract, span: result_span
            }
        },
        Decl::Struct { name, type_params, fields, is_pub, span } => {
            let result_type_params = type_params
            let result_fields = fields
            let result_span = span
            Decl::Struct {
                name: "${mod_name}::${name}",
                type_params: result_type_params, fields: result_fields,
                is_pub: is_pub, span: result_span
            }
        },
        Decl::Enum { name, type_params, variants, is_pub, span } => {
            let result_type_params = type_params
            let result_variants = variants
            let result_span = span
            Decl::Enum {
                name: "${mod_name}::${name}",
                type_params: result_type_params, variants: result_variants,
                is_pub: is_pub, span: result_span
            }
        },
        Decl::ExternFn { name, type_params, params, return_type, declared_effects, is_pub, span } => {
            let result_type_params = type_params
            let result_params = params
            let result_return_type = return_type
            let result_declared_effects = declared_effects
            let result_span = span
            Decl::ExternFn {
                name: "${mod_name}::${name}",
                type_params: result_type_params, params: result_params,
                return_type: result_return_type,
                declared_effects: result_declared_effects,
                is_pub: is_pub, span: result_span
            }
        },
        Decl::Const { name, type_annotation, init, is_pub, span } => {
            let result_type_annotation = type_annotation
            let result_init = init
            let result_span = span
            Decl::Const {
                name: "${mod_name}::${name}",
                type_annotation: result_type_annotation, init: result_init,
                is_pub: is_pub, span: result_span
            }
        },
        Decl::Sig { name, members, is_pub, span } => {
            let result_members = members
            let result_span = span
            Decl::Sig {
                name: "${mod_name}::${name}", members: result_members,
                is_pub: is_pub, span: result_span
            }
        },
        Decl::Impl { target_type, type_params, trait_name, methods, span } => {
            let prefixed_target = if target_type.contains("::") {
                target_type
            } else {
                "${mod_name}::${target_type}"
            }
            let result_type_params = type_params
            let result_trait_name = trait_name
            let result_methods = methods
            let result_span = span
            Decl::Impl {
                target_type: prefixed_target, type_params: result_type_params,
                trait_name: result_trait_name, methods: result_methods,
                span: result_span
            }
        },
        Decl::Trait { name, type_params, supertraits, methods, is_pub, span } => {
            let result_type_params = type_params
            let result_supertraits = supertraits
            let result_methods = methods
            let result_span = span
            Decl::Trait {
                name: "${mod_name}::${name}",
                type_params: result_type_params,
                supertraits: result_supertraits, methods: result_methods,
                is_pub: is_pub, span: result_span
            }
        },
        Decl::Effect { name, type_params, ops, is_pub, span } => {
            let result_type_params = type_params
            let result_ops = ops
            let result_span = span
            Decl::Effect {
                name: "${mod_name}::${name}",
                type_params: result_type_params, ops: result_ops,
                is_pub: is_pub, span: result_span
            }
        },
        Decl::ExternType { name, type_params, is_pub, span } => {
            let result_type_params = type_params
            let result_span = span
            Decl::ExternType {
                name: "${mod_name}::${name}",
                type_params: result_type_params,
                is_pub: is_pub, span: result_span
            }
        },
        Decl::TypeAlias { name, type_params, type_expr, is_pub, span } => {
            let result_type_params = type_params
            let result_type_expr = type_expr
            let result_span = span
            Decl::TypeAlias {
                name: "${mod_name}::${name}",
                type_params: result_type_params, type_expr: result_type_expr,
                is_pub: is_pub, span: result_span
            }
        },
        Decl::EffectAlias { name, type_params, effects, is_pub, span } => {
            let result_type_params = type_params
            let result_effects = effects
            let result_span = span
            Decl::EffectAlias {
                name: "${mod_name}::${name}",
                type_params: result_type_params, effects: result_effects,
                is_pub: is_pub, span: result_span
            }
        },
        Decl::ModBlock { name, uses, decls, required_effects, is_pub, span } => {
            let result_uses = uses
            let result_decls = decls
            let result_required_effects = required_effects
            let result_span = span
            Decl::ModBlock {
                name: "${mod_name}::${name}", uses: result_uses,
                decls: result_decls,
                required_effects: result_required_effects,
                is_pub: is_pub, span: result_span
            }
        },
        Decl::AssocType { .. } => decl,  // Associated types are nested inside trait/impl, not prefixed
        _ => decl
    }
}

// Qualify a file-module's top-level declaration with its canonical identity.
// Unlike prefix_decl_name (inline `mod` scoping), this preserves the resolver's
// module boundary and cannot collide after backend identifier sanitization.
pub fn module_prefix_decl_name(module_prefix: Str, decl: Decl) -> Decl {
    match decl {
        Decl::Fn { name, type_params, params, return_type, declared_effects, body, is_pub, is_abstract, span } => {
            let result_type_params = type_params
            let result_params = params
            let result_return_type = return_type
            let result_declared_effects = declared_effects
            let result_body = body
            let result_span = span
            Decl::Fn {
                name: module_item_identity(module_prefix, name),
                type_params: result_type_params, params: result_params,
                return_type: result_return_type,
                declared_effects: result_declared_effects, body: result_body,
                is_pub: is_pub, is_abstract: is_abstract, span: result_span
            }
        },
        Decl::Struct { name, type_params, fields, is_pub, span } => {
            let result_type_params = type_params
            let result_fields = fields
            let result_span = span
            Decl::Struct {
                name: module_item_identity(module_prefix, name),
                type_params: result_type_params, fields: result_fields,
                is_pub: is_pub, span: result_span
            }
        },
        Decl::Enum { name, type_params, variants, is_pub, span } => {
            let result_type_params = type_params
            let result_variants = variants
            let result_span = span
            Decl::Enum {
                name: module_item_identity(module_prefix, name),
                type_params: result_type_params, variants: result_variants,
                is_pub: is_pub, span: result_span
            }
        },
        Decl::ExternFn { name, type_params, params, return_type, declared_effects, is_pub, span } =>
            // The declaration participates in the same exact module identity
            // scheme as Ring functions. HIR stores its foreign ABI leaf
            // separately, so aliases/re-exports never collapse back to `name`.
            {
                let result_type_params = type_params
                let result_params = params
                let result_return_type = return_type
                let result_declared_effects = declared_effects
                let result_span = span
                Decl::ExternFn {
                    name: module_item_identity(module_prefix, name),
                    type_params: result_type_params, params: result_params,
                    return_type: result_return_type,
                    declared_effects: result_declared_effects,
                    is_pub: is_pub, span: result_span
                }
            },
        Decl::Const { name, type_annotation, init, is_pub, span } => {
            let result_type_annotation = type_annotation
            let result_init = init
            let result_span = span
            Decl::Const {
                name: module_item_identity(module_prefix, name),
                type_annotation: result_type_annotation, init: result_init,
                is_pub: is_pub, span: result_span
            }
        },
        Decl::Sig { name, members, is_pub, span } => {
            let result_members = members
            let result_span = span
            Decl::Sig {
                name: module_item_identity(module_prefix, name),
                members: result_members, is_pub: is_pub, span: result_span
            }
        },
        Decl::Impl { target_type, type_params, trait_name, methods, span } => {
            // Keep the source spelling until registration.  At that point all
            // local/imported aliases are installed, so the target can be
            // resolved to the definition's exact nominal identity.
            let result_target_type = target_type
            let result_type_params = type_params
            let result_trait_name = trait_name
            let result_methods = methods
            let result_span = span
            Decl::Impl {
                target_type: result_target_type,
                type_params: result_type_params,
                trait_name: result_trait_name, methods: result_methods,
                span: result_span
            }
        },
        Decl::Trait { name, type_params, supertraits, methods, is_pub, span } => {
            let result_type_params = type_params
            let result_supertraits = supertraits
            let result_methods = methods
            let result_span = span
            Decl::Trait {
                name: module_item_identity(module_prefix, name),
                type_params: result_type_params,
                supertraits: result_supertraits, methods: result_methods,
                is_pub: is_pub, span: result_span
            }
        },
        Decl::Effect { name, type_params, ops, is_pub, span } => {
            let result_type_params = type_params
            let result_ops = ops
            let result_span = span
            Decl::Effect {
                name: module_item_identity(module_prefix, name),
                type_params: result_type_params, ops: result_ops,
                is_pub: is_pub, span: result_span
            }
        },
        Decl::ExternType { name, type_params, is_pub, span } =>
            // Extern types denote foreign ABI identities shared across modules
            // (for example LLVMBuilderRef). Keep their declared ABI spelling.
            {
                let result_name = name
                let result_type_params = type_params
                let result_span = span
                Decl::ExternType {
                    name: result_name, type_params: result_type_params,
                    is_pub: is_pub, span: result_span
                }
            },
        Decl::TypeAlias { name, type_params, type_expr, is_pub, span } => {
            let result_type_params = type_params
            let result_type_expr = type_expr
            let result_span = span
            Decl::TypeAlias {
                name: module_item_identity(module_prefix, name),
                type_params: result_type_params, type_expr: result_type_expr,
                is_pub: is_pub, span: result_span
            }
        },
        Decl::EffectAlias { name, type_params, effects, is_pub, span } => {
            let result_type_params = type_params
            let result_effects = effects
            let result_span = span
            Decl::EffectAlias {
                name: module_item_identity(module_prefix, name),
                type_params: result_type_params, effects: result_effects,
                is_pub: is_pub, span: result_span
            }
        },
        Decl::ModBlock { name, uses, decls, required_effects, is_pub, span } => {
            let result_uses = uses
            let result_decls = decls
            let result_required_effects = required_effects
            let result_span = span
            Decl::ModBlock {
                name: module_item_identity(module_prefix, name),
                uses: result_uses, decls: result_decls,
                required_effects: result_required_effects,
                is_pub: is_pub, span: result_span
            }
        },
        Decl::AssocType { .. } => decl,
        _ => decl
    }
}

// Shared 5-pass ModBlock registration strategy.
// When deferred_struct_names/deferred_enum_names are provided (some), operates in phase1 mode
// (preregister struct/enum only, defer field/variant completion).
// When none, operates in register_decl mode (complete struct/enum immediately).
fn inline_mod_leaf(name: Str) -> Str {
    let inline_parts = name.split("::")
    let inline_leaf = inline_parts.get(inline_parts.len() - 1).unwrap_or(name)
    let file_parts = inline_leaf.split("$$_")
    file_parts.get(file_parts.len() - 1).unwrap_or(inline_leaf)
}

struct IndexedDecl {
    decl_index: Int,
    decl: Decl
}

// Project registration walks the exact resolver frame tree once per disjoint
// declaration phase.  The barriers make every type namespace available before
// any value signature is registered without retrying or re-registering a decl.
enum ProjectRegistrationPhase {
    NominalPhase,
    TraitPhase,
    EffectPhase,
    EffectAliasPhase,
    ExternTypePhase,
    TypeAliasSigPhase,
    ValuePhase,
}

fn project_decl_matches_phase(
    decl: Decl, phase: ProjectRegistrationPhase
) -> Bool {
    match phase {
        ProjectRegistrationPhase::NominalPhase => match decl {
            Decl::Struct { .. } | Decl::Enum { .. } => true,
            _ => false
        },
        ProjectRegistrationPhase::TraitPhase => match decl {
            Decl::Trait { .. } => true,
            _ => false
        },
        ProjectRegistrationPhase::EffectPhase => match decl {
            Decl::Effect { .. } => true,
            _ => false
        },
        ProjectRegistrationPhase::EffectAliasPhase => match decl {
            Decl::EffectAlias { .. } => true,
            _ => false
        },
        ProjectRegistrationPhase::ExternTypePhase => match decl {
            Decl::ExternType { .. } => true,
            _ => false
        },
        ProjectRegistrationPhase::TypeAliasSigPhase => match decl {
            // Keep aliases and signatures in one source-ordered frame pass.
            Decl::TypeAlias { .. } | Decl::Sig { .. } => true,
            _ => false
        },
        ProjectRegistrationPhase::ValuePhase => match decl {
            Decl::Struct { .. } | Decl::Enum { .. } |
            Decl::Trait { .. } | Decl::Effect { .. } |
            Decl::EffectAlias { .. } | Decl::ExternType { .. } |
            Decl::TypeAlias { .. } | Decl::Sig { .. } |
            Decl::ModBlock { .. } => false,
            _ => true
        }
    }
}

fn index_decls(decls: List<Decl>) -> List<IndexedDecl> {
    let mut indexed: List<IndexedDecl> = []
    for decl_index in 0..decls.len() {
        match decls.get(decl_index) {
            some(decl) => {
                let indexed_decl = decl
                indexed.push(IndexedDecl {
                    decl_index: decl_index,
                    decl: indexed_decl
                })
            },
            none => {}
        }
    }
    indexed
}

// Source order must not decide whether `mod facade { use super::origin... }`
// can see a sibling. Order sibling ModBlocks by their direct super::module
// dependencies; cycles retain source order and are diagnosed during checking.
fn order_inline_mod_blocks(decls: List<Decl>) -> List<Decl> {
    let mut pending: List<Decl> = []
    let mut sibling_names: Set<Str> = set_new()
    for decl in decls {
        match decl {
            Decl::ModBlock { name, .. } => {
                let pending_decl = decl
                pending.push(pending_decl)
                sibling_names.insert(inline_mod_leaf(name))
            },
            _ => {}
        }
    }

    let mut ordered: List<Decl> = []
    let mut completed: Set<Str> = set_new()
    while pending.len() > 0 {
        let mut next: List<Decl> = []
        let mut progressed = false
        for decl in pending {
            let mut ready = true
            match decl {
                Decl::ModBlock { uses, .. } => {
                    for use_decl in uses {
                        let parts = use_decl.path.segments
                        if parts.len() > 1 && parts.get(0).unwrap_or("") == "super" &&
                           parts.get(1).unwrap_or("") != "super" {
                            let dep = parts.get(1).unwrap_or("")
                            if sibling_names.contains(dep) && !completed.contains(dep) {
                                ready = false
                            }
                        }
                    }
                },
                _ => {}
            }
            if ready {
                match decl {
                    Decl::ModBlock { name, .. } => { completed.insert(inline_mod_leaf(name)) },
                    _ => {}
                }
                let ordered_decl = decl
                ordered.push(ordered_decl)
                progressed = true
            } else {
                let deferred_decl = decl
                next.push(deferred_decl)
            }
        }
        if !progressed {
            for decl in next {
                let ordered_decl = decl
                ordered.push(ordered_decl)
            }
            next = []
        }
        pending = next
    }
    ordered
}

// Project registration may reorder sibling modules for dependency readiness,
// but the resolver-frame adapter must retain each module's original AST site.
fn order_indexed_inline_mod_blocks(
    decls: List<IndexedDecl>
) -> List<IndexedDecl> {
    let mut pending: List<IndexedDecl> = []
    let mut sibling_names: Set<Str> = set_new()
    for item in decls {
        match item.decl {
            Decl::ModBlock { name, .. } => {
                let pending_item = item
                pending.push(pending_item)
                sibling_names.insert(inline_mod_leaf(name))
            },
            _ => {}
        }
    }

    let mut ordered: List<IndexedDecl> = []
    let mut completed: Set<Str> = set_new()
    while pending.len() > 0 {
        let mut next: List<IndexedDecl> = []
        let mut progressed = false
        for item in pending {
            let mut ready = true
            match item.decl {
                Decl::ModBlock { uses, .. } => {
                    for use_decl in uses {
                        let parts = use_decl.path.segments
                        if parts.len() > 1 &&
                           parts.get(0).unwrap_or("") == "super" &&
                           parts.get(1).unwrap_or("") != "super" {
                            let dep = parts.get(1).unwrap_or("")
                            if sibling_names.contains(dep) &&
                               !completed.contains(dep) {
                                ready = false
                            }
                        }
                    }
                },
                _ => {}
            }
            if ready {
                match item.decl {
                    Decl::ModBlock { name, .. } => {
                        completed.insert(inline_mod_leaf(name))
                    },
                    _ => {}
                }
                let ordered_item = item
                ordered.push(ordered_item)
                progressed = true
            } else {
                let deferred_item = item
                next.push(deferred_item)
            }
        }
        if !progressed {
            for item in next {
                let ordered_item = item
                ordered.push(ordered_item)
            }
            next = []
        }
        pending = next
    }
    ordered
}

fn register_mod_block_items_legacy(
    mut ctx: InferCtx, mod_name: Str, mod_uses: List<UseDecl>, mod_decls: List<Decl>,
    deferred_struct_names: List<Str>?, deferred_enum_names: List<Str>?
) {
    // Imports are lexically visible to every declaration in the inline module,
    // including signatures registered before bodies are checked. Keep the
    // registration path stack identical to check_mod_decl so self/super paths
    // resolve to the same canonical identities in both phases.
    let segments = mod_name.split("::")
    let simple_name = segments.get(segments.len() - 1).unwrap_or(mod_name)
    ctx.mod_path_stack.push(simple_name)
    resolve_mod_uses(ctx, mod_uses, false)

    // Pass 1a: register struct/enum types first
    for d in mod_decls {
        match d {
            Decl::Struct { .. } => {
                let struct_decl = d
                let prefixed = prefix_decl_name(mod_name, struct_decl)
                register_mod_item(ctx, prefixed, deferred_struct_names, deferred_enum_names)
            },
            Decl::Enum { .. } => {
                let enum_decl = d
                let prefixed = prefix_decl_name(mod_name, enum_decl)
                register_mod_item(ctx, prefixed, deferred_struct_names, deferred_enum_names)
            },
            _ => {}
        }
    }
    // Incremental aliases: struct/enum short names available for trait bounds
    insert_mod_aliases(ctx, mod_name, mod_decls, true)
    // Pass 1b-1: traits -- alias after each so supertraits resolve by short name (#83)
    for d in mod_decls {
        match d {
            Decl::Trait { .. } => {
                let trait_decl = d
                let prefixed = prefix_decl_name(mod_name, trait_decl)
                register_mod_item(ctx, prefixed, deferred_struct_names, deferred_enum_names)
                // Incremental alias: makes this trait's short name available
                // for subsequent traits' supertrait lookup (#83)
                insert_mod_aliases(ctx, mod_name, mod_decls, true)
            },
            _ => {}
        }
    }
    // Pass 1b-2: effects must exist under their short names before effect
    // alias bodies are canonicalized. Otherwise `{Signal}` is stored raw and
    // can later rebind to a consumer's same-spelled effect.
    for d in mod_decls {
        match d {
            Decl::Effect { .. } => {
                let effect_decl = d
                let prefixed = prefix_decl_name(mod_name, effect_decl)
                register_mod_item(ctx, prefixed, deferred_struct_names, deferred_enum_names)
            },
            _ => {}
        }
    }
    insert_mod_aliases(ctx, mod_name, mod_decls, true)
    // Pass 1b-3: effect aliases remain source ordered so an earlier alias may
    // feed a later alias, but every body sees all concrete effects above.
    for d in mod_decls {
        match d {
            Decl::EffectAlias { .. } => {
                let effect_alias_decl = d
                let prefixed = prefix_decl_name(mod_name, effect_alias_decl)
                register_mod_item(ctx, prefixed, deferred_struct_names, deferred_enum_names)
                insert_mod_aliases(ctx, mod_name, mod_decls, true)
            },
            _ => {}
        }
    }
    // Pass 1b-4: opaque extern types.
    for d in mod_decls {
        match d {
            Decl::ExternType { .. } => {
                let extern_type_decl = d
                let prefixed = prefix_decl_name(mod_name, extern_type_decl)
                register_mod_item(ctx, prefixed, deferred_struct_names, deferred_enum_names)
            },
            _ => {}
        }
    }
    // Pass 1b-5: aliases/signatures must exist before any value declaration
    // resolves its parameter/return types. Refresh short aliases after each
    // declaration so source-ordered alias chains can feed the next alias;
    // functions remain declaration-order independent from all aliases.
    for d in mod_decls {
        match d {
            Decl::TypeAlias { .. } => {
                let type_alias_decl = d
                let prefixed = prefix_decl_name(mod_name, type_alias_decl)
                register_mod_item(ctx, prefixed, deferred_struct_names, deferred_enum_names)
                insert_mod_aliases(ctx, mod_name, mod_decls, true)
            },
            Decl::Sig { .. } => {
                let sig_decl = d
                let prefixed = prefix_decl_name(mod_name, sig_decl)
                register_mod_item(ctx, prefixed, deferred_struct_names, deferred_enum_names)
                insert_mod_aliases(ctx, mod_name, mod_decls, true)
            },
            _ => {}
        }
    }
    // Final aliases: all names available for remaining declarations
    insert_mod_aliases(ctx, mod_name, mod_decls, true)
    // Pass 2: register everything else (functions, impls, consts, etc.)
    for d in mod_decls {
        match d {
            Decl::Struct { .. } => {},
            Decl::Enum { .. } => {},
            Decl::Trait { .. } => {},
            Decl::Effect { .. } => {},
            Decl::EffectAlias { .. } => {},
            Decl::ExternType { .. } => {},
            Decl::TypeAlias { .. } => {},
            Decl::Sig { .. } => {},
            Decl::ModBlock { .. } => {},
            _ => {
                let value_decl = d
                let prefixed = prefix_decl_name(mod_name, value_decl)
                register_mod_item(ctx, prefixed, deferred_struct_names, deferred_enum_names)
            }
        }
    }
    for d in order_inline_mod_blocks(mod_decls) {
        let mod_block_decl = d
        let prefixed = prefix_decl_name(mod_name, mod_block_decl)
        register_mod_item(ctx, prefixed, deferred_struct_names, deferred_enum_names)
    }
    let _ = ctx.mod_path_stack.pop()
}

fn register_project_mod_local_item(
    mut ctx: InferCtx, mod_name: Str, item: IndexedDecl,
    deferred_struct_names: List<Str>, deferred_enum_names: List<Str>
) {
    match item.decl {
        // Extern types are foreign ABI identities, not inline-module
        // nominals.  The project plan owns every visible spelling; retain only
        // the raw source definition here so frame refresh can install and
        // later remove the exact leaf/display alias.
        Decl::ExternType { name, type_params, .. } => {
            register_project_extern_type(ctx, name, type_params)
        },
        Decl::ModBlock { .. } =>
            panic("unreachable: project ModBlock reached local phase dispatcher"),
        _ => {
            let prefixed = prefix_decl_name(mod_name, item.decl)
            let struct_names_for_phase = deferred_struct_names
            let enum_names_for_phase = deferred_enum_names
            register_phase1(
                ctx, prefixed,
                struct_names_for_phase, enum_names_for_phase)
        }
    }
    refresh_project_namespace_frame(ctx)
}

// Project inline registration is driven exclusively by the installed plan.
// The child frame is recovered from its exact parent/decl site, and every
// phase keeps the original decl_index even when sibling ModBlocks are
// dependency-reordered. ModBlocks recurse here and never reach the legacy
// monolithic registration helper.
fn register_project_mod_block_phase(
    mut ctx: InferCtx, mod_name: Str, mod_decls: List<Decl>,
    deferred_struct_names: List<Str>, deferred_enum_names: List<Str>,
    decl_index: Int, phase: ProjectRegistrationPhase
) {
    if !enter_project_child_frame(ctx, decl_index) {
        panic("unreachable: resolver plan missing inline registration frame")
    }
    project_push_mod_path(ctx, mod_name)
    let indexed = index_decls(mod_decls)

    for item in indexed {
        if project_decl_matches_phase(item.decl, phase) {
            register_project_mod_local_item(
                ctx, mod_name, item,
                deferred_struct_names, deferred_enum_names)
        }
    }

    for item in order_indexed_inline_mod_blocks(indexed) {
        let canonical_decl = prefix_decl_name(mod_name, item.decl)
        match canonical_decl {
            Decl::ModBlock {
                name: nested_name, decls: nested_decls, ..
            } => {
                register_project_mod_block_phase(
                    ctx, nested_name, nested_decls,
                    deferred_struct_names, deferred_enum_names,
                    item.decl_index, phase)
                refresh_project_namespace_frame(ctx)
            },
            _ => panic("unreachable: ordered project child is not a ModBlock")
        }
    }

    let _ = ctx.mod_path_stack.pop()
    let _ = exit_project_namespace_frame(ctx)
}

fn register_mod_block_items(
    mut ctx: InferCtx, mod_name: Str, mod_uses: List<UseDecl>,
    mod_decls: List<Decl>,
    deferred_struct_names: List<Str>?, deferred_enum_names: List<Str>?
) {
    // This entry point is retained only for the single-file legacy pipeline.
    // Project callers use the phase-aware exact-frame traversal above.
    register_mod_block_items_legacy(
        ctx, mod_name, mod_uses, mod_decls,
        deferred_struct_names, deferred_enum_names)
}

// Dispatch a single declaration to the appropriate registration function.
// When deferred lists are provided, operates in phase1 mode; otherwise in register_decl mode.
fn register_mod_item(
    mut ctx: InferCtx, decl: Decl,
    deferred_struct_names: List<Str>?, deferred_enum_names: List<Str>?
) {
    match deferred_struct_names {
        some(dsn) => match deferred_enum_names {
            some(den) => {
                let struct_names_for_phase = dsn
                let enum_names_for_phase = den
                register_phase1(
                    ctx, decl,
                    struct_names_for_phase, enum_names_for_phase)
            },
            none => register_decl(ctx, decl)
        },
        none => register_decl(ctx, decl)
    }
}

fn register_phase1(mut ctx: InferCtx, decl: Decl, mut deferred_struct_names: List<Str>, mut deferred_enum_names: List<Str>) {
    match decl {
        Decl::Struct { name, type_params, fields, span, .. } => {
            preregister_struct(ctx, name, type_params, span)
            let deferred_struct_name = name
            deferred_struct_names.push(deferred_struct_name)
        },
        Decl::Enum { name, type_params, variants, span, .. } => {
            let preregistered_enum_name = name
            preregister_enum(ctx, preregistered_enum_name, type_params, span)
            let deferred_enum_name = name
            deferred_enum_names.push(deferred_enum_name)
        },
        Decl::ModBlock { name: mod_name, uses: mod_uses, decls: mod_decls, .. } => {
            register_mod_block_items(ctx, mod_name, mod_uses, mod_decls, some(deferred_struct_names), some(deferred_enum_names))
        },
        _ => register_decl(ctx, decl)
    }
}

fn register_phase2_struct(mut ctx: InferCtx, decl: Decl) {
    match decl {
        Decl::Struct { name, type_params, fields, span, .. } =>
            complete_struct_fields(ctx, name, fields),
        Decl::ModBlock { name: mod_name, decls: mod_decls, .. } => {
            for d in mod_decls {
                let struct_decl = d
                let prefixed = prefix_decl_name(mod_name, struct_decl)
                register_phase2_struct(ctx, prefixed)
            }
        },
        _ => {}
    }
}

fn register_phase2_enum(mut ctx: InferCtx, decl: Decl) {
    match decl {
        Decl::Enum { name, type_params, variants, span, .. } => {
            let completed_enum_name = name
            complete_enum_variants(
                ctx, completed_enum_name, type_params, variants)
        },
        Decl::ModBlock { name: mod_name, decls: mod_decls, .. } => {
            for d in mod_decls {
                let enum_decl = d
                let prefixed = prefix_decl_name(mod_name, enum_decl)
                register_phase2_enum(ctx, prefixed)
            }
        },
        _ => {}
    }
}

pub fn register_decls_two_phase(mut ctx: InferCtx, decls: List<Decl>) {
    ctx.file_extern_types = set_new()
    for decl in decls {
        match decl {
            Decl::ExternType { name, .. } => {
                let extern_type_name = name
                ctx.file_extern_types.insert(extern_type_name)
            },
            _ => {}
        }
    }
    let mut deferred_struct_names: List<Str> = []
    let mut deferred_enum_names: List<Str> = []

    for decl in decls {
        let result = some({
            let struct_names_for_phase = deferred_struct_names
            let enum_names_for_phase = deferred_enum_names
            register_phase1(
                ctx, decl,
                struct_names_for_phase, enum_names_for_phase)
        }) catch { _ => none }
    }

    for decl in decls {
        let result = some(register_phase2_struct(ctx, decl)) catch { _ => none }
    }
    for decl in decls {
        let result = some(register_phase2_enum(ctx, decl)) catch { _ => none }
    }

    // Phase 3: process delegates (after struct/enum fields are complete)
    for decl in decls {
        register_phase3_delegate(ctx, decl)
    }
}

// Register a resolver file-module under canonical declaration identities while
// retaining source-level short aliases in this module's checker environment.
// Imported canonical definitions may coexist; aliases are deliberately local.
fn register_project_root_local_item(
    mut ctx: InferCtx, item: IndexedDecl,
    deferred_struct_names: List<Str>,
    deferred_enum_names: List<Str>
) {
    match item.decl {
        // module_prefix_decl_name deliberately preserves the raw ABI spelling.
        // Do not route project externs through the legacy visible registry:
        // the root frame installs that spelling transactionally.
        Decl::ExternType { name, type_params, .. } =>
            register_project_extern_type(ctx, name, type_params),
        Decl::ModBlock { .. } =>
            panic("unreachable: project ModBlock reached root local dispatcher"),
        _ => {
            let struct_names_for_phase = deferred_struct_names
            let enum_names_for_phase = deferred_enum_names
            register_phase1(
                ctx, item.decl,
                struct_names_for_phase, enum_names_for_phase)
        }
    }
    refresh_project_namespace_frame(ctx)
}

fn register_project_root_phase(
    mut ctx: InferCtx, qualified: List<IndexedDecl>,
    deferred_struct_names: List<Str>,
    deferred_enum_names: List<Str>,
    phase: ProjectRegistrationPhase
) {
    for item in qualified {
        if project_decl_matches_phase(item.decl, phase) {
            register_project_root_local_item(
                ctx, item, deferred_struct_names, deferred_enum_names)
        }
    }
    for item in order_indexed_inline_mod_blocks(qualified) {
        match item.decl {
            Decl::ModBlock { name, decls, .. } => {
                register_project_mod_block_phase(
                    ctx, name, decls,
                    deferred_struct_names, deferred_enum_names,
                    item.decl_index, phase)
                refresh_project_namespace_frame(ctx)
            },
            _ => panic("unreachable: ordered project root child is not a ModBlock")
        }
    }
}

fn project_push_mod_path(mut ctx: InferCtx, mod_name: Str) {
    let segments = mod_name.split("::")
    let simple_name = segments.get(segments.len() - 1).unwrap_or(mod_name)
    ctx.mod_path_stack.push(simple_name)
}

fn register_project_phase2_struct(
    mut ctx: InferCtx, item: IndexedDecl
) {
    match item.decl {
        Decl::ModBlock { name, decls, .. } => {
            if !enter_project_child_frame(ctx, item.decl_index) {
                panic("unreachable: resolver plan missing phase2 struct frame")
            }
            project_push_mod_path(ctx, name)
            for child in index_decls(decls) {
                let qualified_child = IndexedDecl {
                    decl_index: child.decl_index,
                    decl: prefix_decl_name(name, child.decl)
                }
                register_project_phase2_struct(ctx, qualified_child)
            }
            let _ = ctx.mod_path_stack.pop()
            let _ = exit_project_namespace_frame(ctx)
        },
        _ => {
            register_phase2_struct(ctx, item.decl)
            refresh_project_namespace_frame(ctx)
        }
    }
}

fn register_project_phase2_enum(
    mut ctx: InferCtx, item: IndexedDecl
) {
    match item.decl {
        Decl::ModBlock { name, decls, .. } => {
            if !enter_project_child_frame(ctx, item.decl_index) {
                panic("unreachable: resolver plan missing phase2 enum frame")
            }
            project_push_mod_path(ctx, name)
            for child in index_decls(decls) {
                let qualified_child = IndexedDecl {
                    decl_index: child.decl_index,
                    decl: prefix_decl_name(name, child.decl)
                }
                register_project_phase2_enum(ctx, qualified_child)
            }
            let _ = ctx.mod_path_stack.pop()
            let _ = exit_project_namespace_frame(ctx)
        },
        _ => {
            register_phase2_enum(ctx, item.decl)
            // Enum completion creates canonical constructor schemes; refresh
            // the current exact frame before any later signature/delegate pass.
            refresh_project_namespace_frame(ctx)
        }
    }
}

fn register_project_phase3_delegate(
    mut ctx: InferCtx, item: IndexedDecl
) {
    match item.decl {
        Decl::ModBlock { name, decls, .. } => {
            if !enter_project_child_frame(ctx, item.decl_index) {
                panic("unreachable: resolver plan missing phase3 delegate frame")
            }
            project_push_mod_path(ctx, name)
            for child in index_decls(decls) {
                let qualified_child = IndexedDecl {
                    decl_index: child.decl_index,
                    decl: prefix_decl_name(name, child.decl)
                }
                register_project_phase3_delegate(ctx, qualified_child)
            }
            let _ = ctx.mod_path_stack.pop()
            let _ = exit_project_namespace_frame(ctx)
        },
        _ => {
            register_phase3_delegate(ctx, item.decl)
            refresh_project_namespace_frame(ctx)
        }
    }
}

fn register_project_module_decls_two_phase(
    mut ctx: InferCtx, module_prefix: Str, decls: List<Decl>
) -> List<Decl> {
    ctx.file_extern_types = set_new()
    for decl in decls {
        match decl {
            Decl::ExternType { name, .. } => {
                let extern_type_name = name
                ctx.file_extern_types.insert(extern_type_name)
            },
            _ => {}
        }
    }

    let mut qualified: List<IndexedDecl> = []
    for item in index_decls(decls) {
        qualified.push(IndexedDecl {
            decl_index: item.decl_index,
            decl: module_prefix_decl_name(module_prefix, item.decl)
        })
    }
    if !enter_project_root_frame(ctx) {
        panic("unreachable: resolver plan missing file root registration frame")
    }

    let mut deferred_struct_names: List<Str> = []
    let mut deferred_enum_names: List<Str> = []

    register_project_root_phase(
        ctx, qualified, deferred_struct_names, deferred_enum_names,
        ProjectRegistrationPhase::NominalPhase)
    register_project_root_phase(
        ctx, qualified, deferred_struct_names, deferred_enum_names,
        ProjectRegistrationPhase::TraitPhase)
    register_project_root_phase(
        ctx, qualified, deferred_struct_names, deferred_enum_names,
        ProjectRegistrationPhase::EffectPhase)
    register_project_root_phase(
        ctx, qualified, deferred_struct_names, deferred_enum_names,
        ProjectRegistrationPhase::EffectAliasPhase)
    register_project_root_phase(
        ctx, qualified, deferred_struct_names, deferred_enum_names,
        ProjectRegistrationPhase::ExternTypePhase)
    register_project_root_phase(
        ctx, qualified, deferred_struct_names, deferred_enum_names,
        ProjectRegistrationPhase::TypeAliasSigPhase)
    register_project_root_phase(
        ctx, qualified, deferred_struct_names, deferred_enum_names,
        ProjectRegistrationPhase::ValuePhase)

    for item in qualified {
        register_project_phase2_struct(ctx, item)
    }
    for item in qualified {
        register_project_phase2_enum(ctx, item)
    }
    for item in qualified {
        register_project_phase3_delegate(ctx, item)
    }
    refresh_project_namespace_frame(ctx)
    let _ = exit_project_namespace_frame(ctx)

    let mut result: List<Decl> = []
    for item in qualified { result.push(item.decl) }
    result
}

pub fn register_module_decls_two_phase(mut ctx: InferCtx, module_prefix: Str, decls: List<Decl>) -> List<Decl> {
    if ctx.project_namespace_file_key.is_some() {
        return register_project_module_decls_two_phase(
            ctx, module_prefix, decls)
    }
    ctx.file_extern_types = set_new()
    for decl in decls {
        match decl {
            Decl::ExternType { name, .. } => {
                record_module_extern_type_firebreak(ctx, name)
            },
            _ => {}
        }
    }
    let mut qualified: List<Decl> = []
    for decl in decls {
        qualified.push(qualify_module_decl_firebreak(module_prefix, decl))
    }

    let mut deferred_struct_names: List<Str> = []
    let mut deferred_enum_names: List<Str> = []

    // Nominal declarations must all exist before any field/payload/signature is
    // resolved.  Their alias keys are display names; StructDef/EnumDef.name is
    // already canonical and therefore drives unification and backend metadata.
    for decl in qualified {
        match decl {
            Decl::Struct { .. } => register_module_phase1_firebreak(
                ctx, decl, deferred_struct_names, deferred_enum_names),
            Decl::Enum { .. } => register_module_phase1_firebreak(
                ctx, decl, deferred_struct_names, deferred_enum_names),
            _ => {}
        }
    }
    insert_file_module_aliases(ctx, module_prefix, decls, false)

    // Match inline-module registration ordering: traits first, then effects and
    // opaque/type declarations, then values and impls.
    for decl in qualified {
        match decl {
            Decl::Trait { .. } => {
                register_module_phase1_firebreak(
                    ctx, decl, deferred_struct_names, deferred_enum_names)
                insert_file_module_aliases(ctx, module_prefix, decls, false)
            },
            _ => {}
        }
    }
    // Install all concrete effects before canonicalizing any effect-alias body.
    // The alias body must capture this module's exact effect identity rather
    // than retain a raw leaf that a downstream decoy can rebind.
    for decl in qualified {
        match decl {
            Decl::Effect { .. } => register_module_phase1_firebreak(
                ctx, decl, deferred_struct_names, deferred_enum_names),
            _ => {}
        }
    }
    insert_file_module_aliases(ctx, module_prefix, decls, false)
    for decl in qualified {
        match decl {
            Decl::EffectAlias { .. } => {
                register_module_phase1_firebreak(
                    ctx, decl, deferred_struct_names, deferred_enum_names)
                insert_file_module_aliases(ctx, module_prefix, decls, false)
            },
            _ => {}
        }
    }
    for decl in qualified {
        match decl {
            Decl::ExternType { .. } => register_module_phase1_firebreak(
                ctx, decl, deferred_struct_names, deferred_enum_names),
            Decl::TypeAlias { .. } => register_module_phase1_firebreak(
                ctx, decl, deferred_struct_names, deferred_enum_names),
            Decl::Sig { .. } => register_module_phase1_firebreak(
                ctx, decl, deferred_struct_names, deferred_enum_names),
            _ => {}
        }
    }
    insert_file_module_aliases(ctx, module_prefix, decls, false)
    for decl in qualified {
        match decl {
            Decl::Struct { .. } => {}, Decl::Enum { .. } => {}, Decl::Trait { .. } => {},
            Decl::Effect { .. } => {}, Decl::EffectAlias { .. } => {},
            Decl::ExternType { .. } => {}, Decl::TypeAlias { .. } => {}, Decl::Sig { .. } => {},
            Decl::ModBlock { .. } => {},
            _ => register_module_phase1_firebreak(
                ctx, decl, deferred_struct_names, deferred_enum_names)
        }
    }
    for decl in order_inline_mod_blocks(qualified) {
        register_module_phase1_firebreak(
            ctx, decl, deferred_struct_names, deferred_enum_names)
    }

    for decl in qualified { register_phase2_struct(ctx, decl) }
    for decl in qualified { register_phase2_enum(ctx, decl) }
    for decl in qualified { register_phase3_delegate(ctx, decl) }

    // Value schemes exist only after the final registration pass.  Binding the
    // short alias and recording its canonical origin makes HExpr::Ident exact.
    insert_file_module_aliases(ctx, module_prefix, decls, true)
    qualified
}

fn record_module_extern_type_firebreak(mut ctx: InferCtx, name: Str) {
    let registered_name = name
    ctx.file_extern_types.insert(registered_name)
}

fn qualify_module_decl_firebreak(module_prefix: Str, decl: Decl) -> Decl {
    let qualified_prefix = module_prefix
    let qualified_decl = decl
    module_prefix_decl_name(qualified_prefix, qualified_decl)
}

fn register_module_phase1_firebreak(
    mut ctx: InferCtx, decl: Decl,
    deferred_struct_names: List<Str>, deferred_enum_names: List<Str>
) {
    let current_decl = decl
    let current_struct_names = deferred_struct_names
    let current_enum_names = deferred_enum_names
    register_phase1(
        ctx, current_decl, current_struct_names, current_enum_names)
}

fn insert_struct_registry_entry_firebreak(
    mut ctx: InferCtx, name: Str, def: StructDef
) {
    let entry_name = name
    let entry_def = def
    ctx.env.types.structs.insert(entry_name, entry_def)
}

fn insert_enum_registry_entry_firebreak(
    mut ctx: InferCtx, name: Str, def: EnumDef
) {
    let entry_name = name
    let entry_def = def
    ctx.env.types.enums.insert(entry_name, entry_def)
}

fn insert_trait_registry_entry_firebreak(
    mut ctx: InferCtx, name: Str, def: TraitDef
) {
    let entry_name = name
    let entry_def = def
    ctx.env.trait_reg.traits.insert(entry_name, entry_def)
}

fn insert_effect_registry_entry_firebreak(
    mut ctx: InferCtx, name: Str, def: EffectDef
) {
    let entry_name = name
    let entry_def = def
    ctx.env.types.effects.insert(entry_name, entry_def)
}

fn insert_effect_alias_registry_entry_firebreak(
    mut ctx: InferCtx, name: Str, def: EffectAliasDef
) {
    let entry_name = name
    let entry_def = def
    ctx.env.types.effect_aliases.insert(entry_name, entry_def)
}

fn insert_type_alias_registry_entry_firebreak(
    mut ctx: InferCtx, name: Str, def: TypeAliasDef
) {
    let entry_name = name
    let entry_def = def
    ctx.env.types.type_aliases.insert(entry_name, entry_def)
}

fn insert_sig_registry_entry_firebreak(
    mut ctx: InferCtx, name: Str, def: SigDef
) {
    let entry_name = name
    let entry_def = def
    ctx.env.types.sigs.insert(entry_name, entry_def)
}

fn insert_file_module_aliases(mut ctx: InferCtx, module_prefix: Str, decls: List<Decl>, include_values: Bool) {
    for decl in decls {
        match decl {
            Decl::Struct { name, .. } => {
                let canonical = module_item_identity(module_prefix, name)
                match ctx.env.types.structs.get(canonical) {
                    some(def) => insert_struct_registry_entry_firebreak(
                        ctx, name, def),
                    none => {}
                }
            },
            Decl::Enum { name, .. } => {
                let canonical = module_item_identity(module_prefix, name)
                match ctx.env.types.enums.get(canonical) {
                    some(def) => insert_enum_registry_entry_firebreak(
                        ctx, name, def),
                    none => {}
                }
            },
            Decl::Trait { name, .. } => {
                let canonical = module_item_identity(module_prefix, name)
                match ctx.env.trait_reg.traits.get(canonical) {
                    some(def) => insert_trait_registry_entry_firebreak(
                        ctx, name, def),
                    none => {}
                }
            },
            Decl::Effect { name, .. } => {
                let canonical = module_item_identity(module_prefix, name)
                match ctx.env.types.effects.get(canonical) {
                    some(def) => insert_effect_registry_entry_firebreak(
                        ctx, name, def),
                    none => {}
                }
            },
            Decl::EffectAlias { name, .. } => {
                let canonical = module_item_identity(module_prefix, name)
                match ctx.env.types.effect_aliases.get(canonical) {
                    some(def) => insert_effect_alias_registry_entry_firebreak(
                        ctx, name, def),
                    none => {}
                }
            },
            Decl::ExternType { name, .. } => {
                match ctx.env.types.extern_structs.get(name) {
                    some(def) => insert_struct_registry_entry_firebreak(
                        ctx, name, def),
                    none => {}
                }
            },
            Decl::TypeAlias { name, .. } => {
                let canonical = module_item_identity(module_prefix, name)
                match ctx.env.types.type_aliases.get(canonical) {
                    some(def) => insert_type_alias_registry_entry_firebreak(
                        ctx, name, def),
                    none => {}
                }
            },
            Decl::Sig { name, .. } => {
                let canonical = module_item_identity(module_prefix, name)
                match ctx.env.types.sigs.get(canonical) {
                    some(def) => insert_sig_registry_entry_firebreak(
                        ctx, name, def),
                    none => {}
                }
            },
            Decl::Fn { name, .. } => {
                if include_values {
                    let canonical = module_item_identity(module_prefix, name)
                    let _ = bind_exact_import_alias(
                        ctx, name, canonical, true)
                }
            },
            Decl::ExternFn { name, .. } => {
                if include_values {
                    let canonical = module_item_identity(module_prefix, name)
                    let _ = bind_exact_import_alias(
                        ctx, name, canonical, true)
                }
            },
            Decl::Const { name, .. } => {
                if include_values {
                    let canonical = module_item_identity(module_prefix, name)
                    let _ = bind_exact_import_alias(
                        ctx, name, canonical, true)
                }
            },
            Decl::ModBlock { name, uses, decls: mod_decls, .. } => {
                let canonical_mod = module_item_identity(module_prefix, name)
                insert_inline_display_aliases(ctx, name, canonical_mod,
                    uses, mod_decls, include_values)
            },
            _ => {}
        }
    }
}

fn insert_inline_display_aliases(
    mut ctx: InferCtx, display_mod: Str, canonical_mod: Str,
    uses: List<UseDecl>, decls: List<Decl>, include_values: Bool
) {
    // resolve_mod_uses has already materialised every public relative import
    // under `${canonical_mod}::<local>`. Display aliases consume that exact
    // key instead of re-resolving the use path or guessing its source leaf.
    for use_decl in uses {
        if use_decl.is_pub {
            match use_decl.imports {
                UseImport::NamedItems { names } => {
                    for item in names {
                        let local = match item.alias {
                            some(alias) => alias,
                            none => item.name
                        }
                        let _ = bind_exact_import_alias(ctx,
                            "${display_mod}::${local}",
                            "${canonical_mod}::${local}", include_values)
                    }
                },
                UseImport::Module => {
                    let path = use_decl.path.segments
                    if path.len() > 0 {
                        let leaf = path.get(path.len() - 1).unwrap_or("")
                        let local = match use_decl.alias {
                            some(alias) => alias,
                            none => leaf
                        }
                        let _ = bind_exact_import_alias(ctx,
                            "${display_mod}::${local}",
                            "${canonical_mod}::${local}", include_values)
                    }
                }
            }
        }
    }
    for decl in decls {
        match decl {
            Decl::Struct { name, .. } => {
                let display = "${display_mod}::${name}"
                let canonical = "${canonical_mod}::${name}"
                match ctx.env.types.structs.get(canonical) {
                    some(def) => insert_struct_registry_entry_firebreak(
                        ctx, display, def),
                    none => {}
                }
            },
            Decl::Enum { name, .. } => {
                let display = "${display_mod}::${name}"
                let canonical = "${canonical_mod}::${name}"
                match ctx.env.types.enums.get(canonical) {
                    some(def) => insert_enum_registry_entry_firebreak(
                        ctx, display, def),
                    none => {}
                }
            },
            Decl::Trait { name, .. } => {
                let display = "${display_mod}::${name}"
                let canonical = "${canonical_mod}::${name}"
                match ctx.env.trait_reg.traits.get(canonical) {
                    some(def) => insert_trait_registry_entry_firebreak(
                        ctx, display, def),
                    none => {}
                }
            },
            Decl::Effect { name, .. } => {
                let display = "${display_mod}::${name}"
                let canonical = "${canonical_mod}::${name}"
                match ctx.env.types.effects.get(canonical) {
                    some(def) => insert_effect_registry_entry_firebreak(
                        ctx, display, def),
                    none => {}
                }
            },
            Decl::EffectAlias { name, .. } => {
                let display = "${display_mod}::${name}"
                let canonical = "${canonical_mod}::${name}"
                match ctx.env.types.effect_aliases.get(canonical) {
                    some(def) => insert_effect_alias_registry_entry_firebreak(
                        ctx, display, def),
                    none => {}
                }
            },
            Decl::TypeAlias { name, .. } => {
                let display = "${display_mod}::${name}"
                let canonical = "${canonical_mod}::${name}"
                match ctx.env.types.type_aliases.get(canonical) {
                    some(def) => insert_type_alias_registry_entry_firebreak(
                        ctx, display, def),
                    none => {}
                }
            },
            Decl::ExternType { name, .. } => {
                let display = "${display_mod}::${name}"
                let canonical = "${canonical_mod}::${name}"
                match ctx.env.types.structs.get(canonical) {
                    some(def) => insert_struct_registry_entry_firebreak(
                        ctx, display, def),
                    none => match ctx.env.types.structs.get(name) {
                        some(def) => insert_struct_registry_entry_firebreak(
                            ctx, display, def),
                        none => {}
                    }
                }
            },
            Decl::Sig { name, .. } => {
                let display = "${display_mod}::${name}"
                let canonical = "${canonical_mod}::${name}"
                match ctx.env.types.sigs.get(canonical) {
                    some(def) => insert_sig_registry_entry_firebreak(
                        ctx, display, def),
                    none => {}
                }
            },
            Decl::Fn { name, .. } => {
                if include_values {
                    let display = "${display_mod}::${name}"
                    let canonical = "${canonical_mod}::${name}"
                    let _ = bind_exact_import_alias(
                        ctx, display, canonical, true)
                }
            },
            Decl::ExternFn { name, .. } => {
                if include_values {
                    let display = "${display_mod}::${name}"
                    let canonical = "${canonical_mod}::${name}"
                    let _ = bind_exact_import_alias(
                        ctx, display, canonical, true)
                }
            },
            Decl::Const { name, .. } => {
                if include_values {
                    let display = "${display_mod}::${name}"
                    let canonical = "${canonical_mod}::${name}"
                    let _ = bind_exact_import_alias(
                        ctx, display, canonical, true)
                }
            },
            Decl::ModBlock { name, uses: nested_uses, decls: nested, .. } => {
                insert_inline_display_aliases(ctx, "${display_mod}::${name}",
                    "${canonical_mod}::${name}", nested_uses, nested, include_values)
            },
            _ => {}
        }
    }
}

struct NormalizedImplBounds {
    scheme_bounds: List<SchemeBound>,
    dict_bounds: List<ImplDictBound>
}

// Keep method-scheme evidence and ImplEntry's runtime dictionary requirements
// in one canonical order. General impl registration retains the legacy shape
// that cannot carry TypeBound type_args or assoc_constraints; iteration
// protocol impls reject those predicates before reaching this normalization.
fn normalize_impl_bounds(
    ctx: InferCtx, type_params: List<TypeParam>, impl_tv_ids: List<Int>
) -> NormalizedImplBounds {
    let mut scheme_bounds: List<SchemeBound> = []
    let mut dict_bounds: List<ImplDictBound> = []
    let mut tp_idx = 0
    for tp in type_params {
        for b in tp.bounds {
            if tp_idx < impl_tv_ids.len() {
                let tv_id = impl_tv_ids.get(tp_idx).unwrap()
                let bound_trait = resolve_trait_identity(ctx, b.trait_name)
                let scheme_bound_trait = bound_trait
                scheme_bounds.push(SchemeBound {
                    type_var: tv_id,
                    trait_name: scheme_bound_trait,
                    assoc_constraints: []
                })
                let dict_bound_trait = bound_trait
                dict_bounds.push(ImplDictBound {
                    type_param_index: tp_idx,
                    trait_name: dict_bound_trait
                })
                let supers = collect_all_supertraits(ctx, bound_trait)
                for st_name in supers {
                    append_normalized_supertrait_bounds_firebreak(
                        scheme_bounds, dict_bounds, tv_id, tp_idx, st_name)
                }
            }
        }
        tp_idx = tp_idx + 1
    }
    NormalizedImplBounds {
        scheme_bounds: scheme_bounds,
        dict_bounds: dict_bounds
    }
}

fn append_normalized_supertrait_bounds_firebreak(
    mut scheme_bounds: List<SchemeBound>, mut dict_bounds: List<ImplDictBound>,
    type_var: Int, type_param_index: Int, trait_name: Str
) {
    let scheme_type_var = type_var
    let scheme_trait_name = trait_name
    scheme_bounds.push(SchemeBound {
        type_var: scheme_type_var,
        trait_name: scheme_trait_name,
        assoc_constraints: []
    })
    let dict_type_param_index = type_param_index
    let dict_trait_name = trait_name
    dict_bounds.push(ImplDictBound {
        type_param_index: dict_type_param_index,
        trait_name: dict_trait_name
    })
}

fn append_delegate_impl_type_var_firebreak(
    mut impl_tv_ids: List<Int>, id: Int
) {
    let current_id = id
    impl_tv_ids.push(current_id)
}

fn resolve_delegate_target_identity_firebreak(
    ctx: InferCtx, target_type: Str
) -> Str {
    let current_target_type = target_type
    resolve_nominal_identity(ctx, current_target_type)
}

fn prefix_delegate_decl_firebreak(mod_name: Str, decl: Decl) -> Decl {
    let current_mod_name = mod_name
    let current_decl = decl
    prefix_decl_name(current_mod_name, current_decl)
}

fn register_phase3_delegate(mut ctx: InferCtx, decl: Decl) {
    match decl {
        Decl::Impl { target_type, type_params, methods, span, .. } => {
            // Check if any methods are delegates
            let mut has_delegates = false
            for m in methods {
                match m { Decl::Delegate { .. } => { has_delegates = true }, _ => {} }
            }
            if has_delegates {
                // Reconstruct the impl type-parameter scope for registration.
                let saved = map_clone(ctx.type_param_scope)
                let mut impl_tv_ids: List<Int> = []
                for tp in type_params {
                    let tv = ctx.env.fresh_var()
                    match tv {
                        Type::TypeVar { id, .. } => {
                            append_delegate_impl_type_var_firebreak(
                                impl_tv_ids, id)
                        },
                        _ => {}
                    }
                    ctx.type_param_scope.insert(tp.name, tv)
                }

                let impl_bounds = normalize_impl_bounds(ctx, type_params, impl_tv_ids)

                let canonical_target = resolve_delegate_target_identity_firebreak(
                    ctx, target_type)
                for m in methods {
                    match m {
                        Decl::Delegate { field, trait_names, span: dspan } => {
                            register_delegate(ctx, impl_tv_ids, canonical_target,
                                field, trait_names, dspan,
                                impl_bounds.scheme_bounds, impl_bounds.dict_bounds,
                                type_params)
                        },
                        _ => {}
                    }
                }

                ctx.type_param_scope = saved
            }
        },
        Decl::ModBlock { name: mod_name, decls: mod_decls, .. } => {
            for d in mod_decls {
                let prefixed = prefix_delegate_decl_firebreak(mod_name, d)
                register_phase3_delegate(ctx, prefixed)
            }
        },
        _ => {}
    }
}

// ============================================================
// Struct registration
// ============================================================

fn reject_reserved_ownership_nominal(
    mut ctx: InferCtx, name: Str, span: Span
) -> Bool {
    if name != BUILTIN_PTR && name != BUILTIN_LIST &&
       name != BUILTIN_MAP && name != BUILTIN_SET {
        return false
    }
    let _ = type_error(ctx.sink, E0207,
        "Duplicate definition: '${name}' is a reserved builtin type",
        span, DiagnosticContext::OtherContext {
            detail: some("builtin ownership identities cannot be redeclared")
        })
    true
}

fn preregister_struct(
    mut ctx: InferCtx, name: Str, type_params: List<TypeParam>, span: Span
) {
    if reject_reserved_ownership_nominal(ctx, name, span) { return }
    preregister_struct_definition_firebreak(ctx, name, type_params)
}

fn preregister_struct_definition_firebreak(
    mut ctx: InferCtx, name: Str, type_params: List<TypeParam>
) {
    let definition_name = name
    let definition_type_params = type_params
    preregister_struct_definition(
        ctx, definition_name, definition_type_params)
}

fn append_struct_type_var_id_firebreak(
    mut tp_vars: List<Int>, id: Int
) {
    let current_id = id
    tp_vars.push(current_id)
}

fn bind_struct_type_param_firebreak(
    mut ctx: InferCtx, tp_name: Str, tp_var: Int
) {
    let scope_name = tp_name
    let scope_var_id = tp_var
    ctx.type_param_scope.insert(
        scope_name, Type::TypeVar { id: scope_var_id, name: none })
}

fn preregister_struct_definition(
    mut ctx: InferCtx, name: Str, type_params: List<TypeParam>
) {
    let mut tp_names: List<Str> = []
    let mut tp_vars: List<Int> = []
    for tp in type_params {
        tp_names.push(tp.name)
        let tv = ctx.env.fresh_var()
        match tv {
            Type::TypeVar { id, .. } => {
                append_struct_type_var_id_firebreak(tp_vars, id)
            },
            _ => {}
        }
        ctx.type_param_scope.insert(tp.name, tv)
    }
    let definition_name = name
    let def = StructDef { name: definition_name, type_params: tp_names, type_param_vars: tp_vars, fields: [], is_extern: false }
    ctx.env.types.structs.insert(name, def)
}

fn complete_struct_fields(mut ctx: InferCtx, name: Str, fields: List<StructFieldDecl>) {
    match ctx.env.types.structs.get(name) {
        some(def) => {
            let saved = map_clone(ctx.type_param_scope)
            let mut i = 0
            while i < def.type_params.len() {
                match (def.type_params.get(i), def.type_param_vars.get(i)) {
                    (some(tp_name), some(tp_var)) =>
                        bind_struct_type_param_firebreak(ctx, tp_name, tp_var),
                    _ => {}
                }
                i = i + 1
            }
            for f in fields {
                def.fields.push(StructField {
                    name: f.name,
                    ty: resolve_type_expr(ctx, f.type_annotation),
                    is_pub: f.is_pub
                })
            }
            ctx.type_param_scope = saved
        },
        none => {}
    }
}

// ============================================================
// Enum registration
// ============================================================

fn append_enum_type_var_id_firebreak(
    mut tv_ids: List<Int>, id: Int
) {
    let current_id = id
    tv_ids.push(current_id)
}

fn bind_enum_type_param_firebreak(
    mut ctx: InferCtx, mut tv_types: List<Type>, tp_name: Str, tv: Type
) {
    let scope_name = tp_name
    let scope_tv = tv
    ctx.type_param_scope.insert(scope_name, scope_tv)
    let list_tv = tv
    tv_types.push(list_tv)
}

fn record_enum_variant_index_firebreak(
    mut def: EnumDef, variant_name: Str, variant_index: Int
) {
    let index_name = variant_name
    let index_value = variant_index
    def.variant_index.insert(index_name, index_value)
}

fn enum_variant_ctor_name_firebreak(
    enum_name: Str, variant_name: Str
) -> Str {
    let current_enum_name = enum_name
    let current_variant_name = variant_name
    variant_ctor_name(current_enum_name, current_variant_name)
}

fn record_variant_enum_identity_firebreak(
    mut ctx: InferCtx, variant_name: Str, enum_name: Str
) {
    let current_variant_name = variant_name
    let current_enum_name = enum_name
    ctx.env.types.variant_to_enum.insert(
        current_variant_name, current_enum_name)
}

fn bind_variant_constructor_firebreak(
    mut ctx: InferCtx, variant_name: Str,
    enum_type: Type, tv_ids: List<Int>
) {
    let current_variant_name = variant_name
    let current_enum_type = enum_type
    let current_tv_ids = tv_ids
    bind_variant_constructor(
        ctx, current_variant_name, current_enum_type, current_tv_ids)
}

fn bind_payload_variant_constructor_firebreak(
    mut ctx: InferCtx, variant_name: Str, fields: List<Type>,
    enum_type: Type, tv_ids: List<Int>
) {
    let current_fields = fields
    let current_enum_type = enum_type
    let fn_type = Type::FnType {
        params: current_fields, return_type: current_enum_type,
        meta: fn_meta(EMPTY_ROW, CALLABLE_MOVE_OWNED)
    }
    let current_tv_ids = tv_ids
    let local_scheme = new_local_callable_scheme(ctx.env,
        TypeScheme {
            ty: fn_type, type_vars: current_tv_ids,
            bounds: [], def_id: none
        }, CALLABLE_SOURCE_DECLARED)
    let current_variant_name = variant_name
    ctx.env.bind(current_variant_name, local_scheme)
}

fn bind_variant_scheme_alias_firebreak(
    mut ctx: InferCtx, binding_name: Str, scheme: TypeScheme
) {
    let current_binding_name = binding_name
    let current_scheme = scheme
    ctx.env.bind(current_binding_name, current_scheme)
}

fn record_variant_leaf_origin_firebreak(
    mut ctx: InferCtx, variant_name: Str, ctor_payload: Str
) {
    let leaf_variant_name = variant_name
    let leaf_ctor_payload = ctor_payload
    record_variant_ctor_origin(
        ctx, leaf_variant_name, leaf_ctor_payload)
}

fn record_canonical_variant_origin_firebreak(
    mut ctx: InferCtx, ctor_payload: Str
) {
    let canonical_ctor_name = ctor_payload
    let canonical_ctor_payload = ctor_payload
    record_variant_ctor_origin(
        ctx, canonical_ctor_name, canonical_ctor_payload)
}

fn preregister_enum(
    mut ctx: InferCtx, name: Str, type_params: List<TypeParam>, span: Span
) {
    if reject_reserved_ownership_nominal(ctx, name, span) { return }
    let mut tp_names: List<Str> = []
    let mut tv_ids: List<Int> = []
    for tp in type_params {
        tp_names.push(tp.name)
        let tv = ctx.env.fresh_var()
        match tv {
            Type::TypeVar { id, .. } => {
                append_enum_type_var_id_firebreak(tv_ids, id)
            },
            _ => {}
        }
        ctx.type_param_scope.insert(tp.name, tv)
    }
    let definition_name = name
    let def = EnumDef { name: definition_name, type_params: tp_names, type_param_vars: tv_ids, variants: [], variant_index: map_new() }
    ctx.env.types.enums.insert(name, def)
}

fn complete_enum_variants(mut ctx: InferCtx, name: Str, type_params: List<TypeParam>, variants: List<EnumVariantDecl>) {
    match ctx.env.types.enums.get(name) {
        some(def) => {
            let project_active = ctx.project_namespace_file_key.is_some()
            let saved = map_clone(ctx.type_param_scope)
            let mut tv_types: List<Type> = []
            let mut i = 0
            while i < def.type_params.len() {
                match (def.type_params.get(i), def.type_param_vars.get(i)) {
                    (some(tp_name), some(tp_var)) => {
                        let tv = Type::TypeVar { id: tp_var, name: none }
                        bind_enum_type_param_firebreak(
                            ctx, tv_types, tp_name, tv)
                    },
                    _ => {}
                }
                i = i + 1
            }

            let mut vi = 0
            for v in variants {
                match v.named_fields {
                    some(nf) => {
                        if nf.len() > 0 {
                            let mut field_types: List<Type> = []
                            let mut field_names: List<Str> = []
                            for f in nf {
                                field_types.push(resolve_type_expr(ctx, f.type_expr))
                                field_names.push(f.name)
                            }
                            def.variants.push(EnumVariant { name: v.name, fields: field_types, field_names: some(field_names) })
                        } else {
                            let mut field_types: List<Type> = []
                            for f in v.fields { field_types.push(resolve_type_expr(ctx, f)) }
                            def.variants.push(EnumVariant { name: v.name, fields: field_types, field_names: none })
                        }
                    },
                    none => {
                        let mut field_types: List<Type> = []
                        for f in v.fields { field_types.push(resolve_type_expr(ctx, f)) }
                        def.variants.push(EnumVariant { name: v.name, fields: field_types, field_names: none })
                    }
                }
                record_enum_variant_index_firebreak(def, v.name, vi)
                vi = vi + 1
            }

            let enum_definition_name = name
            let enum_type = Type::EnumType {
                name: enum_definition_name, type_params: tv_types
            }
            let tv_ids = def.type_param_vars
            for variant in def.variants {
                let ctor_payload = enum_variant_ctor_name_firebreak(
                    name, variant.name)
                let binding_name = if project_active {
                    let project_ctor_payload = ctor_payload
                    project_ctor_payload
                } else {
                    variant.name
                }
                if !project_active {
                    record_variant_enum_identity_firebreak(
                        ctx, variant.name, name)
                }
                if variant.field_names.is_some() {
                    bind_variant_constructor_firebreak(
                        ctx, binding_name, enum_type, tv_ids)
                } else if variant.fields.len() == 0 {
                    bind_variant_constructor_firebreak(
                        ctx, binding_name, enum_type, tv_ids)
                } else {
                    bind_payload_variant_constructor_firebreak(
                        ctx, binding_name, variant.fields, enum_type, tv_ids)
                }
                if !project_active {
                    // The single-file pipeline still binds the historical leaf
                    // first. Mirror its exact scheme under the canonical
                    // payload without changing legacy visibility.
                    match ctx.env.lookup(variant.name) {
                        some(scheme) => {
                            let alias_scheme = TypeScheme {
                                ty: scheme.ty,
                                type_vars: scheme.type_vars,
                                bounds: scheme.bounds,
                                def_id: none
                            }
                            let local_scheme = match scheme.ty {
                                Type::FnType { .. } =>
                                    new_local_callable_scheme(
                                        ctx.env, alias_scheme,
                                        CALLABLE_SOURCE_DECLARED),
                                _ => alias_scheme
                            }
                            bind_variant_scheme_alias_firebreak(
                                ctx, ctor_payload, local_scheme)
                        },
                        none => {}
                    }
                }
                // Bare fieldless variants and positional payload constructors
                // both lower through Ident/Call codegen and need an exact
                // canonical constructor symbol. Named-field variants lower via
                // HExpr::NamedVariantConstruct instead.
                if variant.field_names.is_none() {
                    if !project_active {
                        record_variant_leaf_origin_firebreak(
                            ctx, variant.name, ctor_payload)
                    }
                    record_canonical_variant_origin_firebreak(
                        ctx, ctor_payload)
                }
            }

            ctx.type_param_scope = saved
        },
        none => {}
    }
}

fn bind_variant_constructor(mut ctx: InferCtx, variant_name: Str, enum_type: Type, tv_ids: List<Int>) {
    if tv_ids.len() > 0 {
        ctx.env.bind(variant_name, TypeScheme { ty: enum_type, type_vars: tv_ids, bounds: [], def_id: none })
    } else {
        ctx.env.bind_mono(variant_name, enum_type)
    }
}

// ============================================================
// Effect registration
// ============================================================

fn append_effect_type_var_id_firebreak(
    mut tp_vars: List<Int>, id: Int
) {
    let current_id = id
    tp_vars.push(current_id)
}

fn register_effect(mut ctx: InferCtx, name: Str, type_params: List<TypeParam>, ops: List<EffectOpDecl>) {
    let saved = map_clone(ctx.type_param_scope)
    let mut tp_names: List<Str> = []
    let mut tp_vars: List<Int> = []
    for tp in type_params {
        tp_names.push(tp.name)
        let tv = ctx.env.fresh_var()
        match tv {
            Type::TypeVar { id, .. } => {
                append_effect_type_var_id_firebreak(tp_vars, id)
            },
            _ => {}
        }
        ctx.type_param_scope.insert(tp.name, tv)
    }
    let mut effect_ops: List<EffectOpDef> = []
    for op in ops {
        let mut param_types: List<Type> = []
        for p in op.params {
            match p.type_annotation {
                some(ta) => param_types.push(resolve_type_expr(ctx, ta)),
                none => param_types.push(ctx.env.fresh_var())
            }
        }
        let ret = resolve_type_expr(ctx, op.return_type)
        let op_has_default = op.body.is_some()
        effect_ops.push(EffectOpDef { name: op.name, params: param_types, return_type: ret, has_default: op_has_default })
    }
    let mut all_defaults = true
    for eop in effect_ops {
        if !eop.has_default { all_defaults = false }
    }
    if effect_ops.len() == 0 { all_defaults = false }
    ctx.type_param_scope = saved
    let registry_name = name
    ctx.env.types.effects.insert(registry_name, EffectDef { name: name, type_params: tp_names, type_param_vars: tp_vars, ops: effect_ops, built_in_kind: none, all_have_defaults: all_defaults })
}

// ============================================================
// Trait registration
// ============================================================

// Recursively collect all supertraits (transitive closure).
// For example, if Top: Mid, Mid: Base, then collect_all_supertraits(_, "Top") = ["Mid", "Base"]
pub fn collect_all_supertraits(ctx: InferCtx, trait_name: Str) -> List<Str> {
    let mut result: List<Str> = []
    let mut visited: Set<Str> = set_new()
    let mut stack: List<Str> = []
    match ctx.env.trait_reg.traits.get(trait_name) {
        some(tdef) => {
            for st in tdef.supertraits {
                let supertrait_for_stack = st
                stack.push(supertrait_for_stack)
            }
        },
        none => {}
    }
    while stack.len() > 0 {
        let current = stack.pop().unwrap()
        if visited.contains(current) { continue }
        let current_for_visited = current
        let current_for_result = current
        let current_for_lookup = current
        visited.insert(current_for_visited)
        result.push(current_for_result)
        match ctx.env.trait_reg.traits.get(current_for_lookup) {
            some(parent_def) => {
                for parent_st in parent_def.supertraits {
                    let parent_supertrait_for_stack = parent_st
                    stack.push(parent_supertrait_for_stack)
                }
            },
            none => {}
        }
    }
    result
}

pub fn resolve_trait_identity(ctx: InferCtx, trait_name: Str) -> Str {
    match ctx.env.trait_reg.traits.get(trait_name) {
        some(def) => def.name,
        none => trait_name
    }
}

pub fn resolve_nominal_identity(ctx: InferCtx, type_name: Str) -> Str {
    match ctx.env.types.structs.get(type_name) {
        some(def) => def.name,
        none => match ctx.env.types.enums.get(type_name) {
            some(def) => def.name,
            none => type_name
        }
    }
}

fn false_flags(count: Int) -> List<Bool> {
    let mut flags: List<Bool> = []
    let mut index = 0
    while index < count {
        flags.push(false)
        index = index + 1
    }
    flags
}

fn is_runtime_owned_nominal(name: Str) -> Bool {
    name == BUILTIN_LIST || name == BUILTIN_MAP || name == BUILTIN_SET ||
        name == BUILTIN_RANGE || name == BUILTIN_CELL ||
        name == BUILTIN_OPTION
}

pub fn direct_drop_target_has_codegen_glue(ctx: InferCtx, target_type: Str) -> Bool {
    if is_runtime_owned_nominal(target_type) { return false }
    match ctx.env.types.structs.get(target_type) {
        some(def) => !def.is_extern,
        none => ctx.env.types.enums.contains_key(target_type)
    }
}

fn mark_direct_drop_shape(mut ctx: InferCtx, target_type: Str) {
    let param_count = match ctx.env.types.structs.get(target_type) {
        some(def) => {
            if def.is_extern || is_runtime_owned_nominal(target_type) {
                panic("unreachable: invalid direct Drop struct reached shape publication")
            }
            def.type_param_vars.len()
        },
        none => match ctx.env.types.enums.get(target_type) {
            some(def) => {
                if is_runtime_owned_nominal(target_type) {
                    panic("unreachable: invalid direct Drop enum reached shape publication")
                }
                def.type_param_vars.len()
            },
            none => panic(
                "unreachable: direct Drop target has no codegen nominal")
        }
    }
    match ctx.env.types.ownership_metadata.ownership_shapes.get(target_type) {
        some(existing) => {
            if existing.param_deps.len() != param_count {
                panic("unreachable: direct Drop ownership shape arity mismatch")
            }
            ctx.env.types.ownership_metadata.ownership_shapes.insert(
                target_type, OwnershipShape {
                    direct_drop: true,
                    may_own: true,
                    param_deps: existing.param_deps
                })
        },
        none => ctx.env.types.ownership_metadata.ownership_shapes.insert(
            target_type, OwnershipShape {
                direct_drop: true,
                may_own: true,
                param_deps: false_flags(param_count)
            })
    }
}

fn merge_shape_contribution(
    mut target: OwnershipShape, source: OwnershipShape
) {
    if source.may_own || source.direct_drop { target.may_own = true }
    if target.param_deps.len() != source.param_deps.len() {
        panic("unreachable: ownership contribution arity mismatch")
    }
    let mut index = 0
    while index < target.param_deps.len() {
        match source.param_deps.get(index) {
            some(depends) => if depends { target.param_deps.set(index, true) },
            none => {}
        }
        index = index + 1
    }
}

fn type_param_index(params: List<Int>, id: Int) -> Int? {
    let mut index = 0
    while index < params.len() {
        match params.get(index) {
            some(candidate) => if candidate == id { return some(index) },
            none => {}
        }
        index = index + 1
    }
    none
}

fn ownership_contribution(
    ctx: InferCtx, ty: Type, owner_params: List<Int>
) -> OwnershipShape {
    let mut result = OwnershipShape {
        direct_drop: false,
        may_own: false,
        param_deps: false_flags(owner_params.len())
    }
    match ty {
        Type::IntType | Type::FloatType | Type::StrType | Type::BoolType |
        Type::UnitType | Type::NeverType | Type::FnType { .. } |
        Type::EffectRowType { .. } | Type::PtrType { .. } => {},
        Type::AnyType | Type::ErrorType => { result.may_own = true },
        Type::TypeVar { id, .. } => match type_param_index(owner_params, id) {
            some(index) => result.param_deps.set(index, true),
            none => { result.may_own = true }
        },
        Type::StructType { name, type_params } => {
            merge_nominal_contribution(ctx, result, name, type_params,
                owner_params)
        },
        Type::EnumType { name, type_params } => {
            merge_nominal_contribution(ctx, result, name, type_params,
                owner_params)
        },
        Type::GenericType { base, args } => match base {
            Type::StructType { name, .. } =>
                merge_nominal_contribution(ctx, result, name, args,
                    owner_params),
            Type::EnumType { name, .. } =>
                merge_nominal_contribution(ctx, result, name, args,
                    owner_params),
            _ => {
                let nested = ownership_contribution(ctx, base, owner_params)
                merge_shape_contribution(result, nested)
            }
        },
        Type::RecordType { fields, tail, .. } => {
            // Open rows fail closed: an as-yet-unknown field may own even when
            // every field in the known prefix is scalar.
            if tail.is_some() { result.may_own = true }
            for field in fields {
                let nested = ownership_contribution(ctx, field.ty, owner_params)
                merge_shape_contribution(result, nested)
            }
        },
        Type::TupleType { elements } => {
            for element in elements {
                let nested = ownership_contribution(ctx, element, owner_params)
                merge_shape_contribution(result, nested)
            }
        }
    }
    result
}

fn merge_nominal_contribution(
    ctx: InferCtx, mut result: OwnershipShape, name: Str,
    args: List<Type>, owner_params: List<Int>
) {
    match ctx.env.types.ownership_metadata.ownership_shapes.get(name) {
        some(shape) => {
            if shape.may_own || shape.direct_drop { result.may_own = true }
            let mut index = 0
            while index < shape.param_deps.len() {
                match shape.param_deps.get(index) {
                    some(depends) => if depends {
                        match args.get(index) {
                            some(actual) => {
                                let nested = ownership_contribution(
                                    ctx, actual, owner_params)
                                merge_shape_contribution(result, nested)
                            },
                            none => { result.may_own = true }
                        }
                    },
                    none => {}
                }
                index = index + 1
            }
        },
        none => { result.may_own = true }
    }
}

fn ensure_shape(mut ctx: InferCtx, name: Str, param_count: Int) {
    match ctx.env.types.ownership_metadata.ownership_shapes.get(name) {
        some(shape) => {
            if shape.param_deps.len() != param_count ||
               (shape.direct_drop && !shape.may_own) {
                panic("unreachable: imported ownership shape is invalid")
            }
        },
        none => ctx.env.types.ownership_metadata.ownership_shapes.insert(
            name, OwnershipShape {
                direct_drop: false,
                may_own: false,
                param_deps: false_flags(param_count)
            })
    }
}

fn seed_hidden_slot_dependencies(
    name: Str, param_count: Int, mut deps: List<Bool>
) {
    if name == BUILTIN_LIST || name == BUILTIN_SET {
        if param_count != 1 {
            panic("unreachable: builtin collection arity drift")
        }
        deps.set(0, true)
    } else if name == BUILTIN_MAP {
        if param_count != 2 {
            panic("unreachable: builtin Map arity drift")
        }
        deps.set(0, true)
        deps.set(1, true)
    }
}

fn solve_struct_shape(mut ctx: InferCtx, def: StructDef) -> Bool {
    let old = ctx.env.types.ownership_metadata.ownership_shapes.get(
        def.name).unwrap_or(OwnershipShape {
            direct_drop: false, may_own: false,
            param_deps: false_flags(def.type_param_vars.len())
        })
    let mut next = OwnershipShape {
        direct_drop: old.direct_drop,
        may_own: old.may_own || old.direct_drop,
        param_deps: list_clone(old.param_deps)
    }
    // Runtime-backed collections store elements in hidden slots not present in
    // StructDef.fields.  Seed those exact builtin identities on every solver
    // round, independently of the published summary being recomputed.
    seed_hidden_slot_dependencies(
        def.name, def.type_param_vars.len(), next.param_deps)
    for field in def.fields {
        let contribution = ownership_contribution(
            ctx, field.ty, def.type_param_vars)
        merge_shape_contribution(next, contribution)
    }
    if !ownership_shapes_equal(old, next) {
        ctx.env.types.ownership_metadata.ownership_shapes.insert(def.name, next)
        true
    } else {
        false
    }
}

fn solve_enum_shape(mut ctx: InferCtx, def: EnumDef) -> Bool {
    let old = ctx.env.types.ownership_metadata.ownership_shapes.get(
        def.name).unwrap_or(OwnershipShape {
            direct_drop: false, may_own: false,
            param_deps: false_flags(def.type_param_vars.len())
        })
    let mut next = OwnershipShape {
        direct_drop: old.direct_drop,
        may_own: old.may_own || old.direct_drop,
        param_deps: list_clone(old.param_deps)
    }
    for variant in def.variants {
        for field in variant.fields {
            let contribution = ownership_contribution(
                ctx, field, def.type_param_vars)
            merge_shape_contribution(next, contribution)
        }
    }
    if !ownership_shapes_equal(old, next) {
        ctx.env.types.ownership_metadata.ownership_shapes.insert(def.name, next)
        true
    } else {
        false
    }
}

// Publish nominal ownership summaries only after the monotone recursive SCC
// has converged. The fuel is the total number of lattice bits plus one: every
// changing round must set at least one previously-false bit.
pub fn solve_ownership_shapes(mut ctx: InferCtx) {
    let mut structs = ctx.env.types.structs.entries()
    structs.sort_by(compare_by_first)
    let mut enums = ctx.env.types.enums.entries()
    enums.sort_by(compare_by_first)
    let mut fuel = 1
    for entry in structs {
        let (_, def) = entry
        ensure_shape(ctx, def.name, def.type_param_vars.len())
        fuel = fuel + def.type_param_vars.len() + 1
    }
    for entry in enums {
        let (_, def) = entry
        ensure_shape(ctx, def.name, def.type_param_vars.len())
        fuel = fuel + def.type_param_vars.len() + 1
    }

    let mut changed = true
    while changed {
        if fuel <= 0 {
            panic("unreachable: ownership shape solver did not converge")
        }
        fuel = fuel - 1
        changed = false
        for entry in structs {
            let (_, def) = entry
            if solve_struct_shape(ctx, def) { changed = true }
        }
        for entry in enums {
            let (_, def) = entry
            if solve_enum_shape(ctx, def) { changed = true }
        }
    }
}

fn insert_trait_self_scope_firebreak(mut ctx: InferCtx, self_type: Type) {
    let scoped_self_type = self_type
    ctx.type_param_scope.insert("Self", scoped_self_type)
}

fn insert_qualified_assoc_scope_firebreak(
    mut ctx: InferCtx, qualified_name: Str, assoc_type: Type
) {
    let scoped_assoc_name = qualified_name
    let scoped_assoc_type = assoc_type
    ctx.qualified_assoc_scope.insert(scoped_assoc_name, scoped_assoc_type)
}

fn append_trait_self_param_type_firebreak(
    mut param_types: List<Type>, self_type: Type
) {
    let param_self_type = self_type
    param_types.push(param_self_type)
}

fn insert_default_assoc_type_firebreak(
    mut assoc_type_map: Map<Str, Type>, assoc_name: Str,
    default_type: Type
) {
    let default_assoc_name = assoc_name
    let default_assoc_type = default_type
    assoc_type_map.insert(default_assoc_name, default_assoc_type)
}

fn append_trait_type_arg_firebreak(
    mut trait_type_args: List<Type>, type_arg: Type
) {
    let current_type_arg = type_arg
    trait_type_args.push(current_type_arg)
}

fn append_impl_type_arg_firebreak(
    mut impl_type_args: List<Type>, type_arg: Type
) {
    let current_type_arg = type_arg
    impl_type_args.push(current_type_arg)
}

fn append_impl_self_param_type_firebreak(
    mut param_types: List<Type>, self_type: Type
) {
    let param_self_type = self_type
    param_types.push(param_self_type)
}

fn register_trait(mut ctx: InferCtx, name: Str, type_params: List<TypeParam>, supertraits: List<TypeBound>, methods: List<Decl>, span: Span) {
    let trait_def_id = ctx.env.fresh_def_id()
    let saved = map_clone(ctx.type_param_scope)
    let saved_qualified_assoc = map_clone(ctx.qualified_assoc_scope)
    let mut tp_names: List<Str> = []
    let mut tp_vars: List<Int> = []
    for tp in type_params {
        tp_names.push(tp.name)
        let tv = ctx.env.fresh_var()
        match tv {
            Type::TypeVar { id, .. } => {
                let type_param_var_id = id
                tp_vars.push(type_param_var_id)
            },
            _ => {}
        }
        ctx.type_param_scope.insert(tp.name, tv)
    }

    // Validate and collect supertrait names
    let mut supertrait_names: List<Str> = []
    for st in supertraits {
        if !ctx.env.trait_reg.traits.contains_key(st.trait_name) {
            let trait_display = nominal_display_name(st.trait_name)
            let _ = type_error(ctx.sink, E0501,
                "Unknown supertrait: ${trait_display}", span,
                DiagnosticContext::TraitError { detail: "unknown supertrait '${trait_display}'" })
        } else {
            supertrait_names.push(resolve_trait_identity(ctx, st.trait_name))
        }
    }

    // Detect cyclic supertrait inheritance via DFS
    for st_name in supertrait_names {
        let trait_name_for_visited = name
        let trait_name_for_diagnostic = name
        let supertrait_for_stack = st_name
        let mut visited: Set<Str> = set_new()
        visited.insert(trait_name_for_visited)
        let mut stack: List<Str> = [supertrait_for_stack]
        while stack.len() > 0 {
            let current = stack.pop().unwrap()
            if visited.contains(current) {
                let current_for_display = current
                let name_display = nominal_display_name(
                    trait_name_for_diagnostic)
                let current_display = nominal_display_name(
                    current_for_display)
                let _ = type_error(ctx.sink, E0506,
                    "Cyclic supertrait inheritance: '${name_display}' -> '${current_display}'", span,
                    DiagnosticContext::TraitError { detail: "cyclic supertrait inheritance" })
                break
            }
            let current_for_visited = current
            let current_for_lookup = current
            visited.insert(current_for_visited)
            match ctx.env.trait_reg.traits.get(current_for_lookup) {
                some(parent_def) => {
                    for parent_st in parent_def.supertraits {
                        let parent_supertrait_for_stack = parent_st
                        stack.push(parent_supertrait_for_stack)
                    }
                },
                none => {}
            }
        }
    }

    let self_var = ctx.env.fresh_var()

    // Collect associated types first, inject into type_param_scope
    let mut assoc_type_defs: List<AssocTypeDef> = []
    for method in methods {
        match method {
            Decl::AssocType { name: aname, bounds: abounds, value: avalue, .. } => {
                let assoc_name_for_type_var = aname
                let assoc_name_for_scope = aname
                let assoc_name_for_definition = aname
                // Create a named type variable for this associated type
                // so error messages show "Item" instead of "?NNN"
                let at_var_id = ctx.env.fresh_var_id()
                let at_var = Type::TypeVar {
                    id: at_var_id, name: some(assoc_name_for_type_var)
                }
                ctx.type_param_scope.insert(assoc_name_for_scope, at_var)
                let mut bound_names: List<Str> = []
                for b in abounds {
                    bound_names.push(resolve_trait_identity(ctx, b.trait_name))
                }
                let default_ty = match avalue {
                    some(v) => some(resolve_type_expr(ctx, v)),
                    none => none
                }
                assoc_type_defs.push(AssocTypeDef {
                    name: assoc_name_for_definition,
                    bounds: bound_names,
                    default_type: default_ty,
                    var_id: at_var_id
                })
            },
            _ => {}
        }
    }

    // Inject Self into type_param_scope so Self::Item resolves in trait method signatures
    insert_trait_self_scope_firebreak(ctx, self_var)
    // Inject Self::Item into qualified_assoc_scope
    for atd in assoc_type_defs {
        match ctx.type_param_scope.get(atd.name) {
            some(at_ty) => insert_qualified_assoc_scope_firebreak(
                ctx, "Self::${atd.name}", at_ty),
            none => {}
        }
    }

    let mut trait_methods: List<TraitMethodDef> = []
    for method in methods {
        match method {
            Decl::Fn { name: mname, type_params: method_tps, params, return_type, declared_effects, is_abstract, .. } => {
                let trait_method_name = mname
                let trait_method_type_params = method_tps
                let mut param_types: List<Type> = []
                let mut param_muts: List<Bool> = []
                for p in params {
                    param_muts.push(p.is_mutable)
                    if p.name == "self" {
                        append_trait_self_param_type_firebreak(
                            param_types, self_var)
                    } else {
                        match p.type_annotation {
                            some(ta) => param_types.push(resolve_type_expr(ctx, ta)),
                            none => param_types.push(ctx.env.fresh_var())
                        }
                    }
                }
                let ret = match return_type {
                    some(rt) => resolve_type_expr(ctx, rt),
                    none => ctx.env.fresh_var()
                }
                // #77: Resolve declared effects so delegate forwarding can propagate evidence
                let method_effects = match declared_effects {
                    some(de) => resolve_declared_effects(ctx, de),
                    none => EMPTY_ROW
                }
                let ownership = if is_abstract {
                    interface_callable_ownership(ctx.env, params)
                } else {
                    fresh_callable_ownership_inference_term(
                        ctx.env.types.ownership_metadata)
                }
                let fn_type = Type::FnType {
                    params: param_types, return_type: ret,
                    meta: fn_meta(method_effects, ownership)
                }
                let method_scheme = new_local_callable_scheme(ctx.env,
                    TypeScheme {
                        ty: fn_type, type_vars: [], bounds: [], def_id: none
                    }, CALLABLE_SOURCE_DECLARED)
                let method_def_id = match method_scheme.def_id {
                    some(id) => id,
                    none => panic("unreachable: trait method has no local DefId")
                }
                trait_methods.push(TraitMethodDef {
                    name: trait_method_name,
                    def_id: method_def_id,
                    ty: method_scheme.ty,
                    has_default: !is_abstract,
                    param_mutabilities: param_muts,
                    method_type_params: trait_method_type_params
                })
            },
            _ => {}
        }
    }

    ctx.type_param_scope = saved
    ctx.qualified_assoc_scope = saved_qualified_assoc
    let trait_registry_key = name
    let trait_definition_name = name
    ctx.env.trait_reg.traits.insert(trait_registry_key, TraitDef {
        name: trait_definition_name, def_id: trait_def_id,
        type_params: tp_names, type_param_vars: tp_vars,
        methods: trait_methods, supertraits: supertrait_names,
        assoc_types: assoc_type_defs
    })
}

// ============================================================
// Impl registration
// ============================================================

fn reject_unsupported_protocol_impl_bounds(
    mut ctx: InferCtx, trait_name: Str?, type_params: List<TypeParam>
) {
    let is_iteration_protocol = match trait_name {
        some(name) => name == "Iterable" || name == "Iterator",
        none => false
    }
    if !is_iteration_protocol { return }
    for tp in type_params {
        for bound in tp.bounds {
            if bound.type_args.len() > 0 || bound.assoc_constraints.len() > 0 {
                let _ = type_error(ctx.sink, E0503,
                    "Iteration protocol impl bound '${tp.name}: ${nominal_display_name(bound.trait_name)}' uses nested type arguments or associated constraints that exact dictionary evidence cannot preserve",
                    bound.span, DiagnosticContext::TraitError {
                        detail: "nested impl predicates are not yet representable in ImplEntry"
                    })
            }
        }
    }
}

pub fn first_impl_trait_bound_span(
    type_params: List<TypeParam>
) -> Span? {
    for type_param in type_params {
        for bound in type_param.bounds { return some(bound.span) }
    }
    none
}

fn resolve_impl_target_identity_firebreak(
    ctx: InferCtx, target_type: Str
) -> Str {
    let canonical_target_input = target_type
    resolve_nominal_identity(ctx, canonical_target_input)
}

fn register_impl(mut ctx: InferCtx, target_type: Str, type_params: List<TypeParam>, trait_name: Str?, methods: List<Decl>, span: Span) {
    let canonical_target_type = resolve_impl_target_identity_firebreak(
        ctx, target_type)
    let impl_span = span
    register_impl_canonical(
        ctx, canonical_target_type, type_params, trait_name, methods, impl_span)
}

fn register_impl_canonical(mut ctx: InferCtx, target_type: Str, type_params: List<TypeParam>, trait_name: Str?, methods: List<Decl>, span: Span) {
    let resolved_trait_name = match trait_name {
        some(name) => {
            let trait_name_for_resolution = name
            let canonical_trait_name = resolve_trait_identity(
                ctx, trait_name_for_resolution)
            some(canonical_trait_name)
        },
        none => none
    }
    let trait_name_for_drop_role = resolved_trait_name
    let is_authoritative_drop = trait_is_authoritative_drop(
        ctx.env.trait_reg, trait_name_for_drop_role)
    // Reject invalid destructor declarations before minting impl type vars,
    // callable DefIds, method schemes, or ownership metadata.  Error recovery
    // for these declarations must leave the registries indistinguishable from
    // a program in which the impl was absent.
    if is_authoritative_drop &&
            !direct_drop_target_has_codegen_glue(ctx, target_type) {
        let _ = type_error(ctx.sink, E0801,
            "Drop may only be implemented for a user struct or enum with generated runtime glue",
            span, DiagnosticContext::TraitError {
                detail: "primitive, runtime collection, and extern targets have no user destructor glue"
            })
        return
    }
    if is_authoritative_drop {
        match first_impl_trait_bound_span(type_params) {
            some(bound_span) => {
                let _ = type_error(ctx.sink, E0801,
                    "Drop impl trait bounds are not supported",
                    bound_span, DiagnosticContext::TraitError {
                        detail: "runtime destructor glue has no stored dictionary evidence for a bounded generic Drop impl"
                    })
                return
            },
            none => {}
        }
    }
    if is_authoritative_drop {
        let trait_name_for_drop_validation = resolved_trait_name
        match trait_name_for_drop_validation {
            some(drop_trait_name) => match ctx.env.trait_reg.traits.get(
                    drop_trait_name) {
                some(drop_trait) => {
                    for method in methods {
                        match method {
                            Decl::ExternFn { name, span: method_span, .. } => {
                                let mut is_drop_slot = false
                                for trait_method in drop_trait.methods {
                                    if trait_method.name == name {
                                        is_drop_slot = true
                                    }
                                }
                                if is_drop_slot {
                                    let _ = type_error(ctx.sink, E0801,
                                        "Drop destructor must be an ordinary Ring function body",
                                        method_span,
                                        DiagnosticContext::TraitError {
                                            detail: "an extern function cannot own and destroy a complete runtime allocation"
                                        })
                                    return
                                }
                            },
                            _ => {}
                        }
                    }
                },
                none => panic(
                    "unreachable: authoritative Drop trait identity is not registered")
            },
            none => panic(
                "unreachable: authoritative Drop identity has no trait name")
        }
    }
    let target_type_for_origin = target_type
    let trait_name_for_origin = resolved_trait_name
    let origin_span = span
    let origin = impl_decl_origin(
        target_type_for_origin, trait_name_for_origin, type_params, origin_span)
    let trait_name_for_bound_validation = resolved_trait_name
    reject_unsupported_protocol_impl_bounds(
        ctx, trait_name_for_bound_validation, type_params)

    let saved = map_clone(ctx.type_param_scope)
    let saved_qualified_assoc = map_clone(ctx.qualified_assoc_scope)
    let mut impl_tv_ids: List<Int> = []
    for tp in type_params {
        let tv = ctx.env.fresh_var()
        match tv {
            Type::TypeVar { id, .. } => {
                let impl_type_var_id = id
                impl_tv_ids.push(impl_type_var_id)
            },
            _ => {}
        }
        ctx.type_param_scope.insert(tp.name, tv)
    }

    let impl_bounds = normalize_impl_bounds(ctx, type_params, impl_tv_ids)

    // Collect associated type assignments from impl
    let mut assoc_type_map: Map<Str, Type> = map_new()
    for method in methods {
        match method {
            Decl::AssocType { name: aname, value: avalue, span: aspan, .. } => {
                match avalue {
                    some(v) => {
                        let assoc_name_for_map = aname
                        let assoc_name_for_scope = aname
                        let resolved_ty = resolve_type_expr(ctx, v)
                        let assoc_map_ty = resolved_ty
                        let assoc_scope_ty = resolved_ty
                        assoc_type_map.insert(
                            assoc_name_for_map, assoc_map_ty)
                        // Also inject into type_param_scope so method signatures can reference it
                        ctx.type_param_scope.insert(
                            assoc_name_for_scope, assoc_scope_ty)
                    },
                    none => {
                        // impl must provide a value
                        let _ = type_error(ctx.sink, E0510,
                            "Associated type '${aname}' must have a value in impl",
                            aspan, DiagnosticContext::TraitError { detail: "missing associated type value" })
                    }
                }
            },
            _ => {}
        }
    }

    // Inject Self into type_param_scope so Self::Item resolves in impl method signatures
    let impl_self_type = resolve_impl_self_type(ctx, target_type, type_params)
    let scoped_impl_self_type = impl_self_type
    ctx.type_param_scope.insert("Self", scoped_impl_self_type)
    // Inject Self::Item into qualified_assoc_scope
    let mut sorted_assoc_map = assoc_type_map.entries()
    sorted_assoc_map.sort_by(compare_by_first)
    for entry in sorted_assoc_map {
        let (aname, aty) = entry
        insert_qualified_assoc_scope_firebreak(
            ctx, "Self::${aname}", aty)
    }

    let mut exact_method_schemes: Map<Str, TypeScheme> = map_new()
    let mut declared_method_names: Set<Str> = set_new()
    for method in methods {
        match method {
            Decl::Fn { name: mname, type_params: mtps, params, return_type, declared_effects, span: mspan, .. } => {
                if declared_method_names.contains(mname) {
                    let target_type_for_duplicate_method_display = target_type
                    let _ = type_error(ctx.sink, E0504,
                        "Duplicate method '${mname}' in impl for '${nominal_display_name(target_type_for_duplicate_method_display)}'",
                        mspan, DiagnosticContext::TraitError {
                            detail: "an impl block may declare each method name only once"
                        })
                } else {
                    let declared_method_name = mname
                    let registered_method_name = mname
                    let exact_method_name = mname
                    let method_target_type = target_type
                    declared_method_names.insert(declared_method_name)
                    let scheme = register_impl_method(
                        ctx, impl_tv_ids, method_target_type,
                        registered_method_name,
                        mtps, params,
                        return_type, declared_effects, impl_bounds.scheme_bounds,
                        saved, type_params, false)
                    exact_method_schemes.insert(exact_method_name, scheme)
                }
            },
            Decl::ExternFn { name: mname, type_params: mtps, params, return_type, declared_effects, span: mspan, .. } => {
                if declared_method_names.contains(mname) {
                    let target_type_for_duplicate_extern_display = target_type
                    let _ = type_error(ctx.sink, E0504,
                        "Duplicate method '${mname}' in impl for '${nominal_display_name(target_type_for_duplicate_extern_display)}'",
                        mspan, DiagnosticContext::TraitError {
                            detail: "an impl block may declare each method name only once"
                        })
                } else {
                    let declared_method_name = mname
                    let registered_method_name = mname
                    let exact_method_name = mname
                    let method_target_type = target_type
                    declared_method_names.insert(declared_method_name)
                    let scheme = register_impl_method(
                        ctx, impl_tv_ids, method_target_type,
                        registered_method_name,
                        mtps, params,
                        return_type, declared_effects, impl_bounds.scheme_bounds,
                        saved, type_params, true)
                    exact_method_schemes.insert(exact_method_name, scheme)
                }
            },
            Decl::Delegate { .. } => {},  // Deferred to register_phase3_delegate (needs complete struct fields)
            Decl::AssocType { .. } => {},  // Already handled above
            _ => {}
        }
    }

    let trait_name_for_registration = resolved_trait_name
    match trait_name_for_registration {
        some(tname) => {
            let trait_display = nominal_display_name(tname)
            let target_type_for_display = target_type
            let target_display = nominal_display_name(target_type_for_display)
            match ctx.env.trait_reg.traits.get(tname) {
                some(trait_def) => {
                    if is_authoritative_drop {
                        let target_type_for_drop_shape = target_type
                        mark_direct_drop_shape(ctx, target_type_for_drop_shape)
                    }
                    let target_type_for_impl_lookup = target_type
                    match find_impl(
                            ctx.env.trait_reg,
                            target_type_for_impl_lookup, tname) {
                        some(existing) => {
                            if existing.origin != origin {
                                let _ = type_error(ctx.sink, E0504,
                                    "Duplicate impl '${trait_display}' for '${target_display}'",
                                    span, DiagnosticContext::TraitError {
                                        detail: "distinct impl origins provide the same target/trait pair"
                                    })
                            }
                        },
                        none => {}
                    }
                    let mut impl_method_names: Set<Str> = set_new()
                    for m in methods {
                        match m {
                            Decl::Fn { name: mn, .. } => {
                                let method_name_for_set = mn
                                impl_method_names.insert(method_name_for_set)
                            },
                            Decl::ExternFn { name: mn, .. } => {
                                let method_name_for_set = mn
                                impl_method_names.insert(method_name_for_set)
                            },
                            _ => {}
                        }
                    }
                    for tm in trait_def.methods {
                        if !tm.has_default && !impl_method_names.contains(tm.name) {
                            let _ = type_error(ctx.sink, E0502,
                                "Missing method '${tm.name}' in impl ${trait_display} for ${target_display}",
                                span, DiagnosticContext::TraitError { detail: "missing method '${tm.name}'" })
                        }
                    }

                    // Validate associated types
                    let mut impl_assoc_names: Set<Str> = set_new()
                    let mut sorted_assoc_map2 = assoc_type_map.entries()
                    sorted_assoc_map2.sort_by(compare_by_first)
                    for entry in sorted_assoc_map2 {
                        let (aname, _) = entry
                        let assoc_name_for_set = aname
                        impl_assoc_names.insert(assoc_name_for_set)
                    }
                    // Check: every trait assoc type is provided (or has default)
                    for atdef in trait_def.assoc_types {
                        if !impl_assoc_names.contains(atdef.name) {
                            match atdef.default_type {
                                some(dt) => {
                                    // Use the default
                                    insert_default_assoc_type_firebreak(
                                        assoc_type_map, atdef.name, dt)
                                },
                                none => {
                                    let _ = type_error(ctx.sink, E0510,
                                        "Missing associated type '${atdef.name}' in impl ${trait_display} for ${target_display}",
                                        span, DiagnosticContext::TraitError { detail: "missing associated type '${atdef.name}'" })
                                }
                            }
                        }
                    }
                    // Check: no extra assoc types in impl that trait doesn't declare
                    let mut trait_assoc_names: Set<Str> = set_new()
                    for atdef in trait_def.assoc_types {
                        trait_assoc_names.insert(atdef.name)
                    }
                    let mut sorted_assoc_map3 = assoc_type_map.entries()
                    sorted_assoc_map3.sort_by(compare_by_first)
                    for entry in sorted_assoc_map3 {
                        let (aname, _) = entry
                        if !trait_assoc_names.contains(aname) {
                            let _ = type_error(ctx.sink, E0514,
                                "Unexpected associated type '${aname}' in impl ${trait_display} for ${target_display}; trait '${trait_display}' does not declare it",
                                span, DiagnosticContext::TraitError { detail: "unexpected associated type '${aname}'" })
                        }
                    }

                    // Validate associated type bounds are satisfied
                    for atdef in trait_def.assoc_types {
                        if atdef.bounds.len() > 0 {
                            match assoc_type_map.get(atdef.name) {
                                some(concrete_ty) => {
                                    let concrete_name_input = concrete_ty
                                    let concrete_display_input = concrete_ty
                                    let concrete_name = type_to_builtin_name(
                                        concrete_name_input)
                                    match concrete_name {
                                        some(cname) => {
                                            for bound_trait in atdef.bounds {
                                                if !has_impl(ctx.env.trait_reg, cname, bound_trait) {
                                                    let bound_display = nominal_display_name(bound_trait)
                                                    let concrete_display = nominal_display_name(cname)
                                                    let _ = type_error(ctx.sink, E0513,
                                                        "Associated type '${atdef.name}' requires '${bound_display}', but '${type_to_string(concrete_display_input)}' does not implement it",
                                                        span, DiagnosticContext::TraitError { detail: "associated type bound '${bound_display}' not satisfied by '${concrete_display}'" })
                                                }
                                            }
                                        },
                                        none => {}  // TypeVar or other non-named types: skip bound check
                                    }
                                },
                                none => {}  // Missing assoc type already reported via E0510
                            }
                        }
                    }

                    // Validate supertrait impls exist (recursively)
                    let all_supertraits = collect_all_supertraits(ctx, tname)
                    for required_st in all_supertraits {
                        let target_type_for_supertrait_check = target_type
                        if !has_impl(
                                ctx.env.trait_reg,
                                target_type_for_supertrait_check,
                                required_st) {
                            let required_display = nominal_display_name(required_st)
                            let _ = type_error(ctx.sink, E0505,
                                "Type '${target_display}' does not implement supertrait '${required_display}' required by '${trait_display}'",
                                span, DiagnosticContext::TraitError { detail: "missing supertrait impl '${required_display}'" })
                        }
                    }

                    // An omitted default method is still owned by this exact
                    // impl. Specialize the trait declaration through Self,
                    // associated types, and impl type variables before either
                    // exact or ordinary lookup can observe it.
                    let mut trait_type_args: List<Type> = []
                    let mut trait_index = 0
                    while trait_index < trait_def.type_params.len() {
                        match trait_def.type_params.get(trait_index) {
                            some(type_param_name) =>
                                match ctx.type_param_scope.get(type_param_name) {
                                    some(actual) =>
                                        append_trait_type_arg_firebreak(
                                            trait_type_args, actual),
                                    none => match trait_def.type_param_vars.get(trait_index) {
                                        some(source_id) => {
                                            let fallback_type_param_name =
                                                type_param_name
                                            trait_type_args.push(
                                                Type::TypeVar {
                                                    id: source_id,
                                                    name: some(
                                                        fallback_type_param_name)
                                                })
                                        },
                                        none => {}
                                    }
                                },
                            none => {}
                        }
                        trait_index = trait_index + 1
                    }
                    for trait_method in trait_def.methods {
                        if trait_method.has_default &&
                           !impl_method_names.contains(trait_method.name) {
                            let specialized_self_type = impl_self_type
                            let specialized = specialize_trait_method_scheme(
                                ctx.env.types.ownership_metadata,
                                trait_def, trait_method,
                                specialized_self_type,
                                trait_type_args, impl_tv_ids,
                                assoc_type_map,
                                impl_bounds.scheme_bounds)
                            exact_method_schemes.insert(
                                trait_method.name,
                                new_local_callable_scheme(
                                    ctx.env, specialized,
                                    CALLABLE_SOURCE_CONSERVATIVE_INTERFACE))
                        }
                    }

                    let mut tp_names: List<Str> = []
                    for tp in type_params { tp_names.push(tp.name) }
                    // Keep method_names as the explicit-body set. Defaults
                    // live in method_schemes but still need this distinction
                    // when delegate HIR chooses direct versus dict dispatch.
                    let mut method_names = impl_method_names.to_list()
                    method_names.sort()
                    let trait_name_for_impl_entry = tname
                    let target_type_for_impl_entry = target_type
                    let origin_for_impl_entry = origin
                    let span_for_impl_entry = span
                    add_impl(ctx.env.trait_reg, ImplEntry {
                        trait_name: trait_name_for_impl_entry,
                        target_type_name: target_type_for_impl_entry,
                        type_params: tp_names, method_names: method_names,
                        dict_bounds: impl_bounds.dict_bounds,
                        assoc_types: map_clone(assoc_type_map),
                        method_schemes: map_clone(exact_method_schemes),
                        is_authoritative_drop: is_authoritative_drop,
                        origin: origin_for_impl_entry,
                        span: span_for_impl_entry
                    })
                },
                none => { let _ = type_error(ctx.sink, E0501,
                    "Unknown trait: ${trait_display}", span,
                    DiagnosticContext::TraitError { detail: "unknown trait '${trait_display}'" }) }
            }
        },
        none => {}
    }

    let mut sorted_exact_methods = exact_method_schemes.entries()
    sorted_exact_methods.sort_by(compare_by_first)
    for entry in sorted_exact_methods {
        let (method_name, scheme) = entry
        let target_type_for_install = target_type
        let origin_for_install = origin
        let trait_name_for_install = resolved_trait_name
        let span_for_install = span
        let _ = install_method_scheme(
            ctx.env.trait_reg, ctx.sink,
            target_type_for_install, method_name, scheme,
            MethodOrigin {
                origin: origin_for_install,
                trait_name: trait_name_for_install,
                is_authoritative_drop: is_authoritative_drop,
                span: span_for_install
            })
    }

    ctx.type_param_scope = saved
    ctx.qualified_assoc_scope = saved_qualified_assoc
}

// Construct the self type for an impl method, using the impl's type params
// from type_param_scope instead of creating unrelated fresh vars.
// This ensures the self type shares the same type variables as the rest of
// the method signature, so instantiation correctly replaces all occurrences.
fn resolve_impl_self_type(mut ctx: InferCtx, target_type: Str, impl_type_params: List<TypeParam>) -> Type {
    if impl_type_params.len() == 0 {
        return resolve_self_type(ctx, target_type)
    }
    let mut impl_tp_types: List<Type> = []
    for tp in impl_type_params {
        match ctx.type_param_scope.get(tp.name) {
            some(tv) => append_impl_type_arg_firebreak(
                impl_tp_types, tv),
            none => impl_tp_types.push(ctx.env.fresh_var())
        }
    }
    match ctx.env.types.structs.get(target_type) {
        some(def) => Type::StructType { name: def.name, type_params: impl_tp_types },
        none => match ctx.env.types.enums.get(target_type) {
            some(def) => Type::EnumType { name: def.name, type_params: impl_tp_types },
            none => resolve_self_type(ctx, target_type)
        }
    }
}

fn register_impl_method(
    mut ctx: InferCtx, impl_tv_ids: List<Int>,
    target_type: Str, mname: Str, mtps: List<TypeParam>, params: List<Param>,
    return_type: TypeExpr?, declared_effects: List<EffectExpr>?, impl_scheme_bounds: List<SchemeBound>, outer_saved: Map<Str, Type>,
    impl_type_params: List<TypeParam>, is_extern: Bool
) -> TypeScheme {
    let saved_method = map_clone(ctx.type_param_scope)
    let mut method_tv_ids: List<Int> = []
    for mtp in mtps {
        let tv = ctx.env.fresh_var()
        match tv {
            Type::TypeVar { id, .. } => {
                let method_type_var_id = id
                method_tv_ids.push(method_type_var_id)
            },
            _ => {}
        }
        ctx.type_param_scope.insert(mtp.name, tv)
    }

    let self_type = resolve_impl_self_type(ctx, target_type, impl_type_params)
    let mut param_types: List<Type> = []
    for p in params {
        match p.type_annotation {
            some(ta) => param_types.push(resolve_type_expr(ctx, ta)),
            none => if p.name == "self" {
                append_impl_self_param_type_firebreak(
                    param_types, self_type)
            } else {
                param_types.push(ctx.env.fresh_var())
            }
        }
    }
    let ret = match return_type { some(rt) => resolve_type_expr(ctx, rt), none => ctx.env.fresh_var() }

    let mut all_tvs = list_clone(impl_tv_ids)
    for mtv in method_tv_ids {
        let method_type_var_id = mtv
        all_tvs.push(method_type_var_id)
    }

    // Non-extern methods: filter unused type variables from outer scope
    if !is_extern {
        let mut declared_names: Set<Str> = set_new()
        let mut sorted_tp_scope = ctx.type_param_scope.entries()
        sorted_tp_scope.sort_by(compare_by_first)
        for entry in sorted_tp_scope {
            let (tpname, _) = entry
            if outer_saved.contains_key(tpname) {
                let declared_type_param_name = tpname
                declared_names.insert(declared_type_param_name)
            }
        }
        for entry in sorted_tp_scope {
            let (tpname, tv) = entry
            if !outer_saved.contains_key(tpname) && !declared_names.contains(tpname) {
                match tv { Type::TypeVar { id, .. } => {
                    if !all_tvs.contains(id) {
                        let additional_type_var_id = id
                        all_tvs.push(additional_type_var_id)
                    }
                }, _ => {} }
            }
        }
    }

    let impl_m_effects = match declared_effects {
        some(de) => resolve_declared_effects(ctx, de),
        none => infer_hof_effect_row(param_types)
    }
    let ownership = if is_extern {
        interface_callable_ownership(ctx.env, params)
    } else {
        fresh_callable_ownership_inference_term(
            ctx.env.types.ownership_metadata)
    }
    let fn_type = Type::FnType {
        params: param_types, return_type: ret,
        meta: fn_meta(impl_m_effects, ownership)
    }
    collect_effect_tail_vars(fn_type, all_tvs)
    let scheme = new_local_callable_scheme(ctx.env, TypeScheme {
        ty: fn_type, type_vars: all_tvs,
        bounds: impl_scheme_bounds, def_id: none
    }, CALLABLE_SOURCE_DECLARED)

    // Track mut self methods
    if params.len() > 0 {
        match params.first() {
            some(first_p) => {
                if first_p.name == "self" && first_p.is_mutable {
                    let mut mut_set = match ctx.env.trait_reg.mut_methods.get(target_type) {
                        some(s) => s,
                        none => {
                            let mut new_set: Set<Str> = set_new()
                            let new_set_for_registry = new_set
                            let new_set_for_result = new_set
                            ctx.env.trait_reg.mut_methods.insert(
                                target_type, new_set_for_registry)
                            new_set_for_result
                        }
                    }
                    mut_set.insert(mname)
                }
            },
            none => {}
        }
    }

    ctx.type_param_scope = saved_method
    scheme
}

// ============================================================
// Delegate registration
// ============================================================

fn remap_delegate_scheme_bounds(
    mut ctx: InferCtx, bounds: List<SchemeBound>,
    mapping: Map<Int, Type>, wrapper_fn_bounds: List<FnBoundsEntry>,
    span: Span
) -> List<SchemeBound> {
    let mut remapped: List<SchemeBound> = []
    for bound in bounds {
        let owner = apply_subst_map(mapping, Type::TypeVar {
            id: bound.type_var, name: none
        })
        match owner {
            Type::TypeVar { id: mapped_id, .. } => {
                let mut constraints: List<AssocConstraintEntry> = []
                for constraint in bound.assoc_constraints {
                    constraints.push(AssocConstraintEntry {
                        name: constraint.name,
                        ty: apply_subst_map(mapping, constraint.ty)
                    })
                }
                remapped.push(SchemeBound {
                    type_var: mapped_id,
                    trait_name: bound.trait_name,
                    assoc_constraints: constraints
                })
            },
            _ => {
                if bound.assoc_constraints.len() > 0 {
                    let _ = type_error(ctx.sink, E0503,
                        "Delegated method bound '${nominal_display_name(bound.trait_name)}' with associated constraints cannot be discharged for concrete owner '${type_to_string(owner)}'",
                        span, DiagnosticContext::TraitError {
                            detail: "delegate concrete bound discharge cannot prove associated constraints"
                        })
                } else {
                    match resolve_dict_ref_for_type(
                        ctx.env, wrapper_fn_bounds, owner, ctx.subst,
                        bound.trait_name
                    ) {
                        some(_) => {},
                        none => {
                            let _ = type_error(ctx.sink, E0503,
                                "Delegated impl bound '${nominal_display_name(bound.trait_name)}' is not satisfied by concrete owner '${type_to_string(owner)}'",
                                span, DiagnosticContext::TraitError {
                                    detail: "delegate concrete bound has no static trait evidence"
                                })
                        }
                    }
                }
            }
        }
    }
    remapped
}

fn specialize_delegate_method_scheme(
    mut ctx: InferCtx, field_scheme: TypeScheme,
    field_var_map: Map<Int, Type>, self_type: Type,
    impl_tv_ids: List<Int>, impl_scheme_bounds: List<SchemeBound>,
    wrapper_fn_bounds: List<FnBoundsEntry>, span: Span
) -> TypeScheme {
    let mapped_type = apply_subst_map(field_var_map, field_scheme.ty)
    let specialized_type = match mapped_type {
        Type::FnType { params, return_type, meta } => {
            let mut forwarded_params: List<Type> = []
            let mut first = true
            for param in params {
                if first {
                    let forwarded_self_type = self_type
                    forwarded_params.push(forwarded_self_type)
                    first = false
                } else {
                    let forwarded_param = param
                    forwarded_params.push(forwarded_param)
                }
            }
            let forwarded_return_type = return_type
            let forwarded_meta = meta
            Type::FnType {
                params: forwarded_params,
                return_type: forwarded_return_type,
                meta: forwarded_meta
            }
        },
        _ => mapped_type
    }

    let mut type_vars = list_clone(impl_tv_ids)
    for source_id in field_scheme.type_vars {
        let mapped_owner = apply_subst_map(field_var_map, Type::TypeVar {
            id: source_id, name: none
        })
        match mapped_owner {
            Type::TypeVar { id: mapped_id, .. } => {
                if !type_vars.contains(mapped_id) {
                    let delegated_type_var = mapped_id
                    type_vars.push(delegated_type_var)
                }
            },
            _ => {}
        }
    }

    let mut bounds = remap_delegate_scheme_bounds(
        ctx, field_scheme.bounds, field_var_map,
        wrapper_fn_bounds, span)
    for impl_bound in impl_scheme_bounds {
        let mut already = false
        for existing in bounds {
            if existing.type_var == impl_bound.type_var &&
               existing.trait_name == impl_bound.trait_name {
                already = true
            }
        }
        if !already {
            let delegated_impl_bound = impl_bound
            bounds.push(delegated_impl_bound)
        }
    }
    TypeScheme {
        ty: specialized_type,
        type_vars: type_vars,
        bounds: bounds,
        def_id: none
    }
}

fn remap_delegate_dict_bounds(
    mut ctx: InferCtx, source_bounds: List<ImplDictBound>,
    source_type_args: List<Type>, mapping: Map<Int, Type>,
    impl_tv_ids: List<Int>, wrapper_fn_bounds: List<FnBoundsEntry>,
    span: Span
) -> List<ImplDictBound> {
    let mut remapped: List<ImplDictBound> = []
    for source_bound in source_bounds {
        match source_type_args.get(source_bound.type_param_index) {
            some(source_arg) => {
                let mapped_owner = apply_subst_map(mapping, source_arg)
                match mapped_owner {
                    Type::TypeVar { id: mapped_id, .. } => {
                        let mut mapped_index = 0 - 1
                        let mut index = 0
                        while index < impl_tv_ids.len() {
                            match impl_tv_ids.get(index) {
                                some(wrapper_id) => {
                                    if wrapper_id == mapped_id {
                                        mapped_index = index
                                    }
                                },
                                none => {}
                            }
                            index = index + 1
                        }
                        if mapped_index >= 0 {
                            let duplicate = remapped.any(fn(existing) {
                                existing.type_param_index == mapped_index &&
                                    existing.trait_name == source_bound.trait_name
                            })
                            if !duplicate {
                                remapped.push(ImplDictBound {
                                    type_param_index: mapped_index,
                                    trait_name: source_bound.trait_name
                                })
                            }
                        } else {
                            let _ = type_error(ctx.sink, E0503,
                                "Delegated impl bound '${nominal_display_name(source_bound.trait_name)}' does not map to a wrapper impl type parameter",
                                span, DiagnosticContext::TraitError {
                                    detail: "delegate dictionary bound owner is not representable"
                                })
                        }
                    },
                    _ => {
                        match resolve_dict_ref_for_type(
                            ctx.env, wrapper_fn_bounds, mapped_owner, ctx.subst,
                            source_bound.trait_name
                        ) {
                            some(_) => {},
                            none => {
                                let _ = type_error(ctx.sink, E0503,
                                    "Delegated impl bound '${nominal_display_name(source_bound.trait_name)}' is not satisfied by concrete owner '${type_to_string(mapped_owner)}'",
                                    span, DiagnosticContext::TraitError {
                                        detail: "delegate concrete bound has no static trait evidence"
                                    })
                            }
                        }
                    }
                }
            },
            none => {
                let _ = type_error(ctx.sink, E0503,
                    "Delegated impl bound '${nominal_display_name(source_bound.trait_name)}' has no exact source type parameter",
                    span, DiagnosticContext::TraitError {
                        detail: "delegate source impl predicate is incomplete"
                    })
            }
        }
    }
    remapped
}

// Present both delegate-bound remappers with one exact view of the wrapper
// impl's runtime evidence. ImplDictBound owns the canonical parameter index;
// the matching registration-time var id and source name define the dictionary
// parameter that resolve_dict_ref_for_type may recursively consume.
fn build_delegate_wrapper_fn_bounds(
    mut ctx: InferCtx, impl_dict_bounds: List<ImplDictBound>,
    impl_tv_ids: List<Int>, impl_type_params: List<TypeParam>,
    span: Span
) -> List<FnBoundsEntry> {
    let mut fn_bounds: List<FnBoundsEntry> = []
    for dict_bound in impl_dict_bounds {
        match (impl_tv_ids.get(dict_bound.type_param_index),
               impl_type_params.get(dict_bound.type_param_index)) {
            (some(type_var_id), some(type_param)) => {
                fn_bounds.push(FnBoundsEntry {
                    type_param_var_id: type_var_id,
                    trait_name: dict_bound.trait_name,
                    type_param_name: type_param.name
                })
            },
            _ => {
                let _ = type_error(ctx.sink, E0503,
                    "Delegated wrapper bound '${nominal_display_name(dict_bound.trait_name)}' has no exact wrapper type parameter evidence",
                    span, DiagnosticContext::TraitError {
                        detail: "delegate wrapper dictionary bound is incomplete"
                    })
            }
        }
    }
    fn_bounds
}

fn register_delegate(
    mut ctx: InferCtx, impl_tv_ids: List<Int>,
    target_type: Str, field: Str, trait_names: List<Str>, span: Span,
    impl_scheme_bounds: List<SchemeBound>, impl_dict_bounds: List<ImplDictBound>,
    impl_type_params: List<TypeParam>
) {
    let wrapper_fn_bounds = build_delegate_wrapper_fn_bounds(
        ctx, impl_dict_bounds, impl_tv_ids, impl_type_params, span)
    // 1. Validate field exists on target struct
    let target_display = nominal_display_name(target_type)
    match ctx.env.types.structs.get(target_type) {
        none => {
            let _ = type_error(ctx.sink, E0507,
                "delegate can only be used on struct types, '${target_display}' is not a struct",
                span, DiagnosticContext::TraitError { detail: "delegate on non-struct type" })
        },
        some(struct_def) => {
            let impl_self_type = resolve_impl_self_type(
                ctx, target_type, impl_type_params)
            let mut declared_params: List<Type> = []
            let mut declared_index = 0
            for declared_id in struct_def.type_param_vars {
                let declared_name = match struct_def.type_params.get(declared_index) {
                    some(name) => {
                        let resolved_declared_name = name
                        some(resolved_declared_name)
                    },
                    none => none
                }
                declared_params.push(Type::TypeVar {
                    id: declared_id, name: declared_name
                })
                declared_index = declared_index + 1
            }
            let declared_self_type = Type::StructType {
                name: struct_def.name, type_params: declared_params
            }
            let field_owner_map = build_type_var_map(
                ctx.env.types.ownership_metadata,
                declared_self_type, impl_self_type,
                struct_def.type_param_vars)
            let mut field_type: Type? = none
            for f in struct_def.fields {
                if f.name == field {
                    field_type = some(apply_subst_map(field_owner_map, f.ty))
                }
            }
            match field_type {
                none => {
                    let _ = type_error(ctx.sink, E0507,
                        "field '${field}' not found in struct '${target_display}'",
                        span, DiagnosticContext::TraitError { detail: "delegate field not found" })
                },
                some(ft) => {
                    // Get the field type name for looking up trait impls
                    let mut field_type_name: Str? = none
                    match ft {
                        Type::StructType { name, .. } => {
                            let resolved_struct_name = name
                            field_type_name = some(resolved_struct_name)
                        },
                        Type::EnumType { name, .. } => {
                            let resolved_enum_name = name
                            field_type_name = some(resolved_enum_name)
                        },
                        _ => {
                            let _ = type_error(ctx.sink, E0507,
                                "delegate field '${field}' must have a named type (struct or enum)",
                                span, DiagnosticContext::TraitError { detail: "delegate field has unnamed type" })
                        }
                    }
                    match field_type_name {
                        none => {},
                        some(ftn) => {
                            let delegated_target_type = target_type
                            let delegated_span = span
                            register_delegate_traits(ctx, impl_tv_ids, delegated_target_type,
                                field, trait_names, delegated_span, impl_scheme_bounds, impl_dict_bounds,
                                wrapper_fn_bounds, impl_type_params, ftn, ft)
                        }
                    }
                }
            }
        }
    }
}

fn register_delegate_traits(
    mut ctx: InferCtx, impl_tv_ids: List<Int>,
    target_type: Str, field: Str, trait_names: List<Str>, span: Span,
    impl_scheme_bounds: List<SchemeBound>, impl_dict_bounds: List<ImplDictBound>,
    wrapper_fn_bounds: List<FnBoundsEntry>,
    impl_type_params: List<TypeParam>, field_type_name: Str, ft: Type
) {
    for tname in trait_names {
        let delegate_trait_name = tname
        let canonical_trait = resolve_trait_identity(ctx, delegate_trait_name)
        let trait_display = nominal_display_name(canonical_trait)
        let field_type_display = nominal_display_name(field_type_name)
        let target_display = nominal_display_name(target_type)
        let authoritative_trait = canonical_trait
        let mut reaches_authoritative_drop = trait_is_authoritative_drop(
            ctx.env.trait_reg, some(authoritative_trait))
        if !reaches_authoritative_drop {
            let drop_supertrait_source = canonical_trait
            for supertrait in collect_all_supertraits(
                    ctx, drop_supertrait_source) {
                let authoritative_supertrait = supertrait
                if trait_is_authoritative_drop(
                        ctx.env.trait_reg, some(authoritative_supertrait)) {
                    reaches_authoritative_drop = true
                }
            }
        }
        if reaches_authoritative_drop {
            let _ = type_error(ctx.sink, E0801,
                "authoritative Drop cannot be delegated",
                span, DiagnosticContext::TraitError {
                    detail: "runtime glue recursively destroys fields after the user destructor, so forwarding Drop would destroy the delegated field twice"
                })
            continue
        }
        let registered_trait = canonical_trait
        match ctx.env.trait_reg.traits.get(registered_trait) {
            none => {
                let _ = type_error(ctx.sink, E0501,
                    "Unknown trait: ${trait_display}",
                    span, DiagnosticContext::TraitError { detail: "unknown trait '${trait_display}'" })
            },
            some(trait_def) => {
                // Validate that the field type implements the trait
                let field_impl_trait = canonical_trait
                if !has_impl(
                        ctx.env.trait_reg, field_type_name,
                        field_impl_trait) {
                    let _ = type_error(ctx.sink, E0508,
                        "type '${field_type_display}' (field '${field}') does not implement trait '${trait_display}'",
                        span, DiagnosticContext::TraitError { detail: "delegate field type missing trait impl" })
                } else {
                    // Check for conflict: same trait already implemented (hand-written) for this type
                    let target_impl_trait = canonical_trait
                    if has_impl(
                            ctx.env.trait_reg, target_type,
                            target_impl_trait) {
                        let _ = type_error(ctx.sink, E0509,
                            "trait '${trait_display}' is already implemented for '${target_display}'; cannot delegate the same trait",
                            span, DiagnosticContext::TraitError { detail: "delegate conflicts with existing impl" })
                        continue
                    }
                    // Collect all traits to register: the explicit trait + its supertraits
                    let explicit_trait = canonical_trait
                    let mut all_traits_to_register: List<Str> = [explicit_trait]
                    let supertrait_source = canonical_trait
                    let supers = collect_all_supertraits(
                        ctx, supertrait_source)
                    for st_name in supers {
                        let registered_supertrait = st_name
                        all_traits_to_register.push(registered_supertrait)
                    }

                    let self_type = resolve_impl_self_type(ctx, target_type, impl_type_params)

                    for reg_tname in all_traits_to_register {
                        // Check if this trait (or supertrait) is already implemented
                        if has_impl(ctx.env.trait_reg, target_type, reg_tname) { continue }

                        // Validate that the field type implements this trait
                        if !has_impl(ctx.env.trait_reg, field_type_name, reg_tname) { continue }

                        match ctx.env.trait_reg.traits.get(reg_tname) {
                            none => {},
                            some(reg_trait_def) => {
                                let field_impl = find_impl(
                                    ctx.env.trait_reg, field_type_name, reg_tname)
                                let mut field_var_map: Map<Int, Type> = map_new()
                                let mut field_impl_type_args: List<Type> = []
                                match field_impl {
                                    some(found) => {
                                        // Derive one canonical source-impl-var
                                        // mapping from the exact field method
                                        // receiver and the wrapper's actual
                                        // field type (for example Source<A>
                                        // against Source<T>).
                                        for trait_method in reg_trait_def.methods {
                                            match found.method_schemes.get(
                                                trait_method.name) {
                                                some(field_scheme) =>
                                                    match field_scheme.ty {
                                                        Type::FnType { params, .. } =>
                                                            match params.first() {
                                                                some(field_receiver) => {
                                                                    if field_impl_type_args.len() == 0 {
                                                                        match field_receiver {
                                                                            Type::StructType { name, type_params } => {
                                                                                if name == field_type_name {
                                                                                    field_impl_type_args = list_clone(type_params)
                                                                                }
                                                                            },
                                                                            Type::EnumType { name, type_params } => {
                                                                                if name == field_type_name {
                                                                                    field_impl_type_args = list_clone(type_params)
                                                                                }
                                                                            },
                                                                            _ => {}
                                                                        }
                                                                    }
                                                                    let candidate = build_type_var_map(
                                                                        ctx.env.types.ownership_metadata,
                                                                        field_receiver, ft,
                                                                        field_scheme.type_vars)
                                                                    let mut source_ids = candidate.keys()
                                                                    source_ids.sort()
                                                                    for source_id in source_ids {
                                                                        match candidate.get(source_id) {
                                                                            some(mapped) => {
                                                                                let mapped_source_id = source_id
                                                                                let mapped_source_type = mapped
                                                                                field_var_map.insert(
                                                                                    mapped_source_id,
                                                                                    mapped_source_type)
                                                                            },
                                                                            none => {}
                                                                        }
                                                                    }
                                                                },
                                                                none => {}
                                                            },
                                                        _ => {}
                                                    },
                                                none => {}
                                            }
                                        }
                                    },
                                    none => {}
                                }

                                let mut field_assoc_types: Map<Str, Type> = map_new()
                                match field_impl {
                                    some(found) => {
                                        let mut assoc_entries = found.assoc_types.entries()
                                        assoc_entries.sort_by(compare_by_first)
                                        for assoc_entry in assoc_entries {
                                            let (assoc_name, assoc_type) = assoc_entry
                                            let delegated_assoc_name = assoc_name
                                            field_assoc_types.insert(
                                                delegated_assoc_name,
                                                apply_subst_map(
                                                    field_var_map, assoc_type))
                                        }
                                    },
                                    none => {}
                                }

                                let mut tp_names: List<Str> = []
                                for tp in impl_type_params { tp_names.push(tp.name) }
                                let mut delegated_dict_bounds = list_clone(impl_dict_bounds)
                                match field_impl {
                                    some(found) => {
                                        let mapped_dict_bounds = remap_delegate_dict_bounds(
                                            ctx, found.dict_bounds,
                                            field_impl_type_args, field_var_map,
                                            impl_tv_ids, wrapper_fn_bounds, span)
                                        for mapped_bound in mapped_dict_bounds {
                                            let mut duplicate = false
                                            for existing in delegated_dict_bounds {
                                                if existing.type_param_index ==
                                                        mapped_bound.type_param_index &&
                                                   existing.trait_name ==
                                                        mapped_bound.trait_name {
                                                    duplicate = true
                                                }
                                            }
                                            if !duplicate {
                                                let delegated_bound = mapped_bound
                                                delegated_dict_bounds.push(
                                                    delegated_bound)
                                            }
                                        }
                                    },
                                    none => {}
                                }
                                let mut exact_method_schemes: Map<Str, TypeScheme> = map_new()
                                let origin_trait_name = reg_tname
                                let origin = impl_origin(
                                    target_type, some(origin_trait_name), span)

                                // Every forwarding scheme is the exact field
                                // scheme under the same structural mapping.
                                for tm in reg_trait_def.methods {
                                    let resolved_method_scheme = match field_impl {
                                        some(found) => found.method_schemes.get(tm.name),
                                        none => none
                                    }
                                    match resolved_method_scheme {
                                        some(field_scheme) => {
                                            let delegated_self_type = self_type
                                            let specialized = specialize_delegate_method_scheme(
                                                ctx, field_scheme, field_var_map,
                                                delegated_self_type, impl_tv_ids,
                                                impl_scheme_bounds,
                                                wrapper_fn_bounds, span)
                                            let scheme = new_local_callable_scheme(
                                                ctx.env, specialized,
                                                CALLABLE_SOURCE_CONSERVATIVE_INTERFACE)
                                            let indexed_scheme = scheme
                                            exact_method_schemes.insert(
                                                tm.name, indexed_scheme)
                                            let installed_scheme = scheme
                                            let method_origin = origin
                                            let method_trait_name = reg_tname
                                            let method_span = span
                                            let _ = install_method_scheme(
                                                ctx.env.trait_reg, ctx.sink,
                                                target_type, tm.name,
                                                installed_scheme,
                                                MethodOrigin {
                                                    origin: method_origin,
                                                    trait_name:
                                                        some(method_trait_name),
                                                    is_authoritative_drop: false,
                                                    span: method_span
                                                })
                                        },
                                        none => {
                                            let _ = type_error(ctx.sink, E0508,
                                                "type '${field_type_display}' has no exact '${nominal_display_name(reg_tname)}::${tm.name}' scheme to delegate",
                                                span, DiagnosticContext::TraitError {
                                                    detail: "delegate source method evidence is missing"
                                                })
                                        }
                                    }
                                }

                                let mut method_names = exact_method_schemes.keys()
                                method_names.sort()

                                let impl_trait_name = reg_tname
                                let impl_target_type = target_type
                                let impl_origin_value = origin
                                let impl_span = span
                                add_impl(ctx.env.trait_reg, ImplEntry {
                                    trait_name: impl_trait_name,
                                    target_type_name: impl_target_type,
                                    type_params: tp_names,
                                    method_names: method_names,
                                    dict_bounds: delegated_dict_bounds,
                                    assoc_types: map_clone(field_assoc_types),
                                    method_schemes: exact_method_schemes,
                                    is_authoritative_drop: false,
                                    origin: impl_origin_value,
                                    span: impl_span
                                })
                            }
                        }
                    }
                }
            }
        }
    }
}

fn expand_effect_exprs(mut ctx: InferCtx, decl_effects: List<EffectExpr>, mut expanding: Set<Str>) -> List<Effect> {
    let mut effects: List<Effect> = []
    for eff in decl_effects {
        match ctx.env.types.effect_aliases.get(eff.name) {
            some(alias_def) => {
                // Cycle detection
                if expanding.contains(eff.name) {
                    let effect_display = nominal_display_name(eff.name)
                    let _ = type_error(ctx.sink, E0406,
                        "Cyclic effect alias: '${effect_display}' references itself", eff.span,
                        DiagnosticContext::OtherContext { detail: some("cyclic effect alias") })
                } else {
                    expanding.insert(eff.name)

                    // Save any existing type_param_scope entries that alias type params might shadow
                    let mut saved_scope: List<(Str, Type?)> = []
                    let mut vi = 0
                    for tp_name in alias_def.type_params {
                        let saved_type_param_name = tp_name
                        saved_scope.push((saved_type_param_name,
                            ctx.type_param_scope.get(tp_name)))
                        // Install alias's fresh type vars into type_param_scope
                        match alias_def.type_param_vars.get(vi) {
                            some(var_id) => {
                                let scoped_type_param_name = tp_name
                                ctx.type_param_scope.insert(
                                    scoped_type_param_name,
                                    Type::TypeVar {
                                        id: var_id, name: none
                                    })
                            },
                            none => {}
                        }
                        vi = vi + 1
                    }

                    // Recursively expand the alias body effects using the fresh type vars in scope
                    let expanded = expand_effect_exprs(ctx, alias_def.effects, expanding)

                    // Restore saved type_param_scope entries
                    for entry in saved_scope {
                        match entry {
                            (name, some(prev_type)) => {
                                let restored_name = name
                                let restored_type = prev_type
                                ctx.type_param_scope.insert(
                                    restored_name, restored_type)
                            },
                            (name, none) => { ctx.type_param_scope.remove(name) }
                        }
                    }

                    // Build substitution map: alias type_param_vars -> resolved call-site type args
                    let mut subst_map: Map<Int, Type> = map_new()
                    let mut si = 0
                    while si < alias_def.type_param_vars.len() && si < eff.type_args.len() {
                        match (alias_def.type_param_vars.get(si), eff.type_args.get(si)) {
                            (some(var_id), some(ta)) => {
                                let substitution_var_id = var_id
                                subst_map.insert(
                                    substitution_var_id,
                                    resolve_type_expr(ctx, ta))
                            },
                            _ => {}
                        }
                        si = si + 1
                    }

                    // Apply type var substitution to each expanded effect
                    for e in expanded {
                        effects.push(apply_subst_effect_map(subst_map, e))
                    }

                    expanding.remove(eff.name)
                }
            },
            none => {
                effects.push(resolve_effect_expr(ctx, eff))
            }
        }
    }
    effects
}

fn collect_effect_tail_vars(ty: Type, mut vars: List<Int>) {
    match ty {
        Type::FnType { params, return_type, meta } => {
            match meta.effects.tail {
                some(t_id) => {
                    if !vars.contains(t_id) {
                        let effect_tail_var = t_id
                        vars.push(effect_tail_var)
                    }
                },
                none => {}
            }
            for p in params { collect_effect_tail_vars(p, vars) }
            collect_effect_tail_vars(return_type, vars)
        },
        Type::StructType { type_params, .. } => {
            for tp in type_params { collect_effect_tail_vars(tp, vars) }
        },
        Type::EnumType { type_params, .. } => {
            for tp in type_params { collect_effect_tail_vars(tp, vars) }
        },
        Type::TupleType { elements } => {
            for e in elements { collect_effect_tail_vars(e, vars) }
        },
        Type::GenericType { base, args } => {
            collect_effect_tail_vars(base, vars)
            for a in args { collect_effect_tail_vars(a, vars) }
        },
        _ => {}
    }
}

fn infer_hof_effect_row(param_types: List<Type>) -> EffectRow {
    for pt in param_types {
        match pt {
            Type::FnType { meta, .. } => match meta.effects.tail {
                some(t_id) => {
                    let effect_tail_var = t_id
                    return EffectRow {
                        effects: [], tail: some(effect_tail_var)
                    }
                },
                none => {}
            },
            _ => {}
        }
    }
    EMPTY_ROW
}

pub fn resolve_declared_effects(mut ctx: InferCtx, decl_effects: List<EffectExpr>) -> EffectRow {
    let mut expanding: Set<Str> = set_new()
    let effects = expand_effect_exprs(ctx, decl_effects, expanding)
    // Deduplicate effects after alias expansion (e.g. {IO, io} -> [io, fail<Str>, io] -> [io, fail<Str>])
    let mut deduped: List<Effect> = []
    let mut seen: Set<Str> = set_new()
    for eff in effects {
        let key = effect_to_string(eff)
        if !seen.contains(key) {
            seen.insert(key)
            let deduped_effect = eff
            deduped.push(deduped_effect)
        }
    }
    EffectRow { effects: deduped, tail: none }
}

// ============================================================
// Function registration
// ============================================================

fn check_duplicate_def(ctx: InferCtx, name: Str, span: Span) {
    match ctx.env.lookup(name) {
        some(existing) => match existing.def_id {
            some(did) => match ctx.env.scope.def_spans.get(did) {
                some(_) => {
                    let display = nominal_display_name(name)
                    let _ = type_error(ctx.sink, E0207,
                        "Duplicate definition: '${display}' is already defined", span,
                        DiagnosticContext::TypeMismatch { expected: "unique name", actual: display, expression: none })
                },
                none => {}
            },
            none => {}
        },
        none => {}
    }
}

// Inject associated type variables into type_param_scope for type params with bounds.
// This makes T::Item references resolve during registration (Pass 1).
// Also resolves assoc_constraints (e.g., T: Trait<Item = Int>) by directly binding the
// associated type name to the concrete type.
pub fn inject_assoc_types_from_bounds(mut ctx: InferCtx, type_params: List<TypeParam>) {
    for tp in type_params {
        for b in tp.bounds {
            // First, handle explicit assoc constraints (Item = Int)
            for ac in b.assoc_constraints {
                let concrete_ty = resolve_type_expr(ctx, ac.ty)
                let unqualified_assoc_ty = concrete_ty
                let qualified_assoc_ty = concrete_ty
                ctx.type_param_scope.insert(ac.name, unqualified_assoc_ty)
                // Also insert into qualified_assoc_scope for disambiguation
                ctx.qualified_assoc_scope.insert(
                    "${tp.name}::${ac.name}", qualified_assoc_ty)
            }
            // Then, inject remaining associated types from trait definition
            match ctx.env.trait_reg.traits.get(b.trait_name) {
                some(tdef) => {
                    for atdef in tdef.assoc_types {
                        // Only inject if not already in scope (avoid overwriting constraints)
                        if !ctx.type_param_scope.contains_key(atdef.name) {
                            let at_var = ctx.env.fresh_var()
                            let unqualified_at_var = at_var
                            let qualified_at_var = at_var
                            ctx.type_param_scope.insert(
                                atdef.name, unqualified_at_var)
                            ctx.qualified_assoc_scope.insert(
                                "${tp.name}::${atdef.name}",
                                qualified_at_var)
                        } else {
                            // Already in scope (another type param's bound injected it).
                            // Still inject into qualified_assoc_scope with this type param's own fresh var.
                            let at_var = ctx.env.fresh_var()
                            ctx.qualified_assoc_scope.insert("${tp.name}::${atdef.name}", at_var)
                        }
                    }
                },
                none => {}
            }
        }
    }
}

// Shared helper for register_fn and register_extern_fn.
// - check_dup: call check_duplicate_def (true for fn, false for extern fn)
// - track_mut_params: track fn_mut_params (true for fn, false for extern fn)
// - track_fn_bounds: build fn_bounds_list and insert into scope (true for fn, false for extern fn)
fn register_fn_common(
    mut ctx: InferCtx, name: Str, type_params: List<TypeParam>,
    params: List<Param>, return_type: TypeExpr?, declared_effects: List<EffectExpr>?,
    span: Span, check_dup: Bool, track_mut_params: Bool, track_fn_bounds: Bool
) {
    let duplicate_check_name = name
    let mut_params_name = name
    let function_bounds_name = name
    let callable_name = name
    let callable_kind_name = name
    if check_dup { check_duplicate_def(ctx, duplicate_check_name, span) }

    let mut type_vars: List<Int> = []
    let saved = map_clone(ctx.type_param_scope)
    let saved_qualified = map_clone(ctx.qualified_assoc_scope)
    for tp in type_params {
        let tv = ctx.env.fresh_var()
        match tv {
            Type::TypeVar { id, .. } => {
                let type_var_id = id
                type_vars.push(type_var_id)
            },
            _ => {}
        }
        ctx.type_param_scope.insert(tp.name, tv)
    }

    // Inject associated types from type param bounds into type_param_scope
    // so that T::Item references in return types / param types resolve correctly.
    inject_assoc_types_from_bounds(ctx, type_params)

    let mut param_types: List<Type> = []
    if track_mut_params {
        let mut mut_flags: List<Bool> = []
        for p in params {
            let pt = match p.type_annotation {
                some(ta) => resolve_type_expr(ctx, ta),
                none => ctx.env.fresh_var()
            }
            let registered_param_type = pt
            param_types.push(registered_param_type)
            // Register fn_mut_params: only flag mut value-type params (not self)
            if p.name == "self" || !p.is_mutable {
                mut_flags.push(false)
            } else {
                mut_flags.push(is_value_type(pt))
            }
        }
        ctx.fn_mut_params.insert(mut_params_name, mut_flags)
    } else {
        for p in params {
            match p.type_annotation {
                some(ta) => param_types.push(resolve_type_expr(ctx, ta)),
                none => param_types.push(ctx.env.fresh_var())
            }
        }
    }
    let ret = match return_type { some(rt) => resolve_type_expr(ctx, rt), none => ctx.env.fresh_var() }

    let mut declared_names: Set<Str> = set_new()
    for tp in type_params { declared_names.insert(tp.name) }
    let mut sorted_tp_scope3 = ctx.type_param_scope.entries()
    sorted_tp_scope3.sort_by(compare_by_first)
    for entry in sorted_tp_scope3 {
        let (tpname, tv) = entry
        if !saved.contains_key(tpname) && !declared_names.contains(tpname) {
            match tv {
                Type::TypeVar { id, .. } => {
                    let inferred_type_var_id = id
                    type_vars.push(inferred_type_var_id)
                },
                _ => {}
            }
        }
    }

    let effects = match declared_effects {
        some(de) => resolve_declared_effects(ctx, de),
        none => infer_hof_effect_row(param_types)
    }
    let ownership = if track_fn_bounds {
        fresh_callable_ownership_inference_term(
            ctx.env.types.ownership_metadata)
    } else {
        interface_callable_ownership(ctx.env, params)
    }
    let fn_type = Type::FnType {
        params: param_types, return_type: ret,
        meta: fn_meta(effects, ownership)
    }
    collect_effect_tail_vars(fn_type, type_vars)

    let mut fn_bounds_list: List<FnBound> = []
    let mut scheme_bounds: List<SchemeBound> = []
    for tp in type_params {
        let tv = ctx.type_param_scope.get(tp.name)
        for b in tp.bounds {
            let bound_trait = resolve_trait_identity(ctx, b.trait_name)
            if !ctx.env.trait_reg.traits.contains_key(bound_trait) {
                let trait_display = nominal_display_name(bound_trait)
                let _ = type_error(ctx.sink, E0501,
                    "Unknown trait: ${trait_display}", tp.span,
                    DiagnosticContext::TraitError { detail: "unknown trait '${trait_display}'" })
            }
            if track_fn_bounds {
                let function_bound_trait = bound_trait
                fn_bounds_list.push(FnBound {
                    type_param: tp.name,
                    trait_name: function_bound_trait
                })
            }
            // Build associated type constraint entries from bound's assoc_constraints
            let mut assoc_entries: List<AssocConstraintEntry> = []
            for ac in b.assoc_constraints {
                let concrete_ty = resolve_type_expr(ctx, ac.ty)
                assoc_entries.push(AssocConstraintEntry { name: ac.name, ty: concrete_ty })
            }
            // B-100 Fix 3: also record IMPLICIT associated type vars from the
            // trait definition.  When the scheme is instantiated at a call site,
            // check_assoc_constraints unifies these TypeVars with the concrete
            // associated types from the impl, so that return types depending on
            // associated types (e.g. T::Item) resolve to concrete types.
            let associated_type_trait = bound_trait
            match ctx.env.trait_reg.traits.get(
                    associated_type_trait) {
                some(tdef) => {
                    for atdef in tdef.assoc_types {
                        let already = assoc_entries.any(fn(e) { e.name == atdef.name })
                        if !already {
                            let qk = "${tp.name}::${atdef.name}"
                            match ctx.qualified_assoc_scope.get(qk) {
                                some(at_var) => {
                                    let associated_type_var = at_var
                                    assoc_entries.push(
                                        AssocConstraintEntry {
                                            name: atdef.name,
                                            ty: associated_type_var
                                        })
                                },
                                none => {},
                            }
                        }
                    }
                },
                none => {},
            }
            match tv {
                some(t) => match t { Type::TypeVar { id, .. } => {
                    let scheme_bound_trait = bound_trait
                    scheme_bounds.push(SchemeBound {
                        type_var: id,
                        trait_name: scheme_bound_trait,
                        assoc_constraints: assoc_entries
                    })
                }, _ => {} },
                none => {}
            }
            // Expand supertrait bounds: if T: Ord and Ord: Eq, add T: Eq too
            let supertrait_source = bound_trait
            let supers = collect_all_supertraits(ctx, supertrait_source)
            for st_name in supers {
                if track_fn_bounds {
                    let function_supertrait = st_name
                    fn_bounds_list.push(FnBound {
                        type_param: tp.name,
                        trait_name: function_supertrait
                    })
                }
                match tv {
                    some(t) => match t { Type::TypeVar { id, .. } => {
                        let scheme_supertrait = st_name
                        scheme_bounds.push(SchemeBound {
                            type_var: id,
                            trait_name: scheme_supertrait,
                            assoc_constraints: []
                        })
                    }, _ => {} },
                    none => {}
                }
            }
        }
    }
    if track_fn_bounds && fn_bounds_list.len() > 0 {
        ctx.env.scope.fn_bounds.insert(
            function_bounds_name, fn_bounds_list)
    }

    ctx.type_param_scope = saved
    ctx.qualified_assoc_scope = saved_qualified

    let has_type_vars = type_vars.len() > 0
    let scheme_type_vars = type_vars
    let raw_scheme = TypeScheme {
        ty: fn_type,
        type_vars: if has_type_vars { scheme_type_vars } else { [] },
        bounds: if has_type_vars { scheme_bounds } else { [] },
        def_id: none
    }
    let local_scheme = new_local_callable_scheme(
        ctx.env, raw_scheme, CALLABLE_SOURCE_DECLARED)
    ctx.env.bind(callable_name, local_scheme)
    let callable_kind = if track_fn_bounds {
        ValueBindingKind::DirectCallable
    } else {
        ValueBindingKind::ExternCallable
    }
    record_value_binding_kind(ctx, callable_kind_name, callable_kind)
    match local_scheme.def_id {
        some(did) => {
            let callable_def_id = did
            ctx.env.record_def_span(callable_def_id, span)
        },
        none => panic("unreachable: registered callable has no local DefId")
    }
}

fn register_fn(mut ctx: InferCtx, name: Str, type_params: List<TypeParam>, params: List<Param>, return_type: TypeExpr?, declared_effects: List<EffectExpr>?, span: Span) {
    let function_name = name
    let function_span = span
    register_fn_common(ctx, function_name, type_params, params,
        return_type, declared_effects, function_span, true, true, true)
}

fn register_extern_fn(mut ctx: InferCtx, name: Str, type_params: List<TypeParam>, params: List<Param>, return_type: TypeExpr?, declared_effects: List<EffectExpr>?, span: Span) {
    let extern_function_name = name
    let extern_function_span = span
    register_fn_common(ctx, extern_function_name, type_params, params,
        return_type, declared_effects, extern_function_span,
        false, false, false)
}

fn register_extern_type_common(
    mut ctx: InferCtx, name: Str, type_params: List<TypeParam>,
    install_visible_name: Bool
) {
    let mut tp_names: List<Str> = []
    let saved = map_clone(ctx.type_param_scope)
    let mut tp_vars: List<Int> = []
    for tp in type_params {
        tp_names.push(tp.name)
        let tv = ctx.env.fresh_var()
        match tv {
            Type::TypeVar { id, .. } => {
                let type_param_var_id = id
                tp_vars.push(type_param_var_id)
            },
            _ => {}
        }
        ctx.type_param_scope.insert(tp.name, tv)
    }
    ctx.type_param_scope = saved
    // is_extern: true marks this as an opaque FFI type so trait derivation skips
    // it (B-074). An opaque type has no fields to compare/clone/order/debug, and
    // a derived dict would reference a non-existent runtime constructor.
    let extern_definition_name = name
    let def = StructDef {
        name: extern_definition_name,
        type_params: tp_names, type_param_vars: tp_vars,
        fields: [], is_extern: true
    }
    if install_visible_name {
        let visible_type_name = name
        let visible_type_def = def
        ctx.env.types.structs.insert(
            visible_type_name, visible_type_def)
    }
    let extern_type_name = name
    let extern_type_def = def
    ctx.env.types.extern_structs.insert(
        extern_type_name, extern_type_def)
}

fn register_project_extern_type(
    mut ctx: InferCtx, name: Str, type_params: List<TypeParam>
) {
    let project_extern_type_name = name
    register_extern_type_common(
        ctx, project_extern_type_name, type_params, false)
}

fn register_extern_type(mut ctx: InferCtx, name: Str, type_params: List<TypeParam>) {
    let extern_type_name = name
    register_extern_type_common(ctx, extern_type_name, type_params, true)
}

fn register_type_alias(mut ctx: InferCtx, name: Str, type_params: List<TypeParam>, type_expr: TypeExpr) {
    let saved = map_clone(ctx.type_param_scope)
    let mut tp_vars: List<Int> = []
    for tp in type_params {
        let tv = ctx.env.fresh_var()
        match tv {
            Type::TypeVar { id, .. } => {
                let type_alias_var_id = id
                tp_vars.push(type_alias_var_id)
            },
            _ => {}
        }
        ctx.type_param_scope.insert(tp.name, tv)
    }
    let resolved = resolve_type_expr(ctx, type_expr)
    ctx.type_param_scope = saved
    let mut tp_names: List<Str> = []
    for tp in type_params { tp_names.push(tp.name) }
    let type_alias_key = name
    let type_alias_name = name
    ctx.env.types.type_aliases.insert(type_alias_key, TypeAliasDef {
        name: type_alias_name, type_params: tp_names,
        type_param_vars: tp_vars, ty: resolved
    })
}

fn register_const(mut ctx: InferCtx, name: Str, type_annotation: TypeExpr?, span: Span) {
    check_duplicate_def(ctx, name, span)
    match type_annotation {
        some(texpr) => {
            let ty = resolve_type_expr(ctx, texpr)
            let annotated_const_name = name
            ctx.env.bind_mono(annotated_const_name, ty)
        },
        none => {
            let tv = ctx.env.fresh_var()
            let inferred_const_name = name
            ctx.env.bind_mono(inferred_const_name, tv)
        }
    }
    let const_lookup_name = name
    match ctx.env.lookup(const_lookup_name) {
        some(s) => match s.def_id {
            some(did) => {
                let const_def_id = did
                ctx.env.record_def_span(const_def_id, span)
                // A const reference is an explicit zero-argument getter Call.
                // The getter itself always returns an owned value: scalar
                // consts are rebuilt, callable consts build a fresh wrapper,
                // and memoised Str/enum consts are immortal runtime values.
                record_callable_ownership(
                    ctx.env.types.ownership_metadata, did,
                    CALLABLE_BORROW_OWNED, CALLABLE_SOURCE_DECLARED)
            },
            none => {}
        },
        none => {}
    }
    let const_binding_name = name
    record_value_binding_kind(
        ctx, const_binding_name, ValueBindingKind::ConstGetter)
}

fn register_sig(mut ctx: InferCtx, name: Str, members: List<SigMember>, is_pub: Bool) {
    let saved = map_clone(ctx.type_param_scope)
    let mut sig_members: Map<Str, TypeScheme> = map_new()
    for m in members {
        let mut type_vars: List<Int> = []
        let msaved = map_clone(ctx.type_param_scope)
        for tp in m.type_params {
            let tv = ctx.env.fresh_var()
            match tv {
                Type::TypeVar { id, .. } => {
                    let signature_type_var_id = id
                    type_vars.push(signature_type_var_id)
                },
                _ => {}
            }
            ctx.type_param_scope.insert(tp.name, tv)
        }
        let mut param_types: List<Type> = []
        let ownership = interface_callable_ownership(ctx.env, m.params)
        for p in m.params {
            match p.type_annotation {
                some(ta) => param_types.push(resolve_type_expr(ctx, ta)),
                none => param_types.push(ctx.env.fresh_var())
            }
        }
        let ret = match m.return_type {
            some(rt) => resolve_type_expr(ctx, rt),
            none => ctx.env.fresh_var()
        }
        let fn_type = Type::FnType {
            params: param_types, return_type: ret,
            meta: fn_meta(EMPTY_ROW, ownership)
        }
        sig_members.insert(m.name, new_local_callable_scheme(ctx.env,
            TypeScheme {
                ty: fn_type, type_vars: type_vars, bounds: [], def_id: none
            }, CALLABLE_SOURCE_CONSERVATIVE_INTERFACE))
        ctx.type_param_scope = msaved
    }
    ctx.type_param_scope = saved
    let signature_key = name
    let signature_name = name
    ctx.env.types.sigs.insert(signature_key, SigDef {
        name: signature_name, members: sig_members, is_pub: is_pub
    })
}

// ============================================================
// Effect alias registration
// ============================================================

fn canonicalize_effect_alias_body(ctx: InferCtx, effects: List<EffectExpr>) -> List<EffectExpr> {
    let mut result: List<EffectExpr> = []
    for eff in effects {
        let canonical_name = match ctx.env.types.effects.get(eff.name) {
            some(def) => def.name,
            none => match ctx.env.types.effect_aliases.get(eff.name) {
                some(def) => def.name,
                none => eff.name
            }
        }
        result.push(EffectExpr { name: canonical_name, type_args: eff.type_args, span: eff.span })
    }
    result
}

fn register_effect_alias(mut ctx: InferCtx, name: Str, type_params: List<TypeParam>, effects: List<EffectExpr>, span: Span) {
    if ctx.env.types.effect_aliases.contains_key(name) {
        let display = nominal_display_name(name)
        let _ = type_error(ctx.sink, E0207,
            "Duplicate definition: effect alias '${display}' is already defined", span,
            DiagnosticContext::OtherContext { detail: some("duplicate effect alias") })
    } else {
        let mut tp_names: List<Str> = []
        let mut tp_vars: List<Int> = []
        for tp in type_params {
            tp_names.push(tp.name)
            let tv = ctx.env.fresh_var()
            match tv {
                Type::TypeVar { id, .. } => {
                    let effect_alias_var_id = id
                    tp_vars.push(effect_alias_var_id)
                },
                _ => {}
            }
        }
        let canonical_effects = canonicalize_effect_alias_body(ctx, effects)
        let effect_alias_key = name
        let effect_alias_name = name
        ctx.env.types.effect_aliases.insert(effect_alias_key, EffectAliasDef {
            name: effect_alias_name,
            type_params: tp_names,
            type_param_vars: tp_vars,
            effects: canonical_effects,
            span: span
        })
    }
}

// ============================================================
// Dispatch: register individual declaration
// ============================================================

fn register_decl(mut ctx: InferCtx, decl: Decl) {
    match decl {
        Decl::Struct { name, type_params, fields, span, .. } => {
            preregister_struct(ctx, name, type_params, span)
            complete_struct_fields(ctx, name, fields)
        },
        Decl::Enum { name, type_params, variants, span, .. } => {
            let preregistered_enum_name = name
            preregister_enum(ctx, preregistered_enum_name,
                type_params, span)
            let completed_enum_name = name
            complete_enum_variants(
                ctx, completed_enum_name, type_params, variants)
        },
        Decl::Effect { name, type_params, ops, .. } => {
            let effect_name = name
            register_effect(ctx, effect_name, type_params, ops)
        },
        Decl::Impl { target_type, type_params, trait_name, methods, span } =>
            register_impl(ctx, target_type, type_params, trait_name, methods, span),
        Decl::Fn { name, type_params, params, return_type, declared_effects, span, .. } =>
            register_fn(ctx, name, type_params, params, return_type, declared_effects, span),
        Decl::Test { .. } => {},
        Decl::Trait { name, type_params, supertraits, methods, span, .. } => {
            let trait_name = name
            register_trait(
                ctx, trait_name, type_params, supertraits, methods, span)
        },
        Decl::ExternFn { name, type_params, params, return_type, declared_effects, span, .. } =>
            register_extern_fn(ctx, name, type_params, params, return_type, declared_effects, span),
        Decl::ExternType { name, type_params, .. } =>
            register_extern_type(ctx, name, type_params),
        Decl::TypeAlias { name, type_params, type_expr, .. } => {
            let type_alias_name = name
            register_type_alias(
                ctx, type_alias_name, type_params, type_expr)
        },
        Decl::Const { name, type_annotation, span, .. } => {
            let const_name = name
            let const_span = span
            register_const(ctx, const_name, type_annotation, const_span)
        },
        Decl::Sig { name, members, is_pub, .. } => {
            let signature_name = name
            register_sig(ctx, signature_name, members, is_pub)
        },
        Decl::EffectAlias { name, type_params, effects, span, .. } => {
            let effect_alias_name = name
            let effect_alias_span = span
            register_effect_alias(ctx, effect_alias_name, type_params,
                effects, effect_alias_span)
        },
        Decl::Delegate { .. } => {},  // Only valid inside impl blocks, handled by register_impl
        Decl::AssocType { .. } => {},  // Only valid inside trait/impl blocks
        Decl::ModBlock { name: mod_name, uses: mod_uses, decls: mod_decls, .. } => {
            register_mod_block_items(ctx, mod_name, mod_uses, mod_decls, none, none)
        }
    }
}
