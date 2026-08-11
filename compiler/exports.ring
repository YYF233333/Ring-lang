use types::{Type, EnumVariant, OwnershipMetadata, EMPTY_ROW,
    CALLABLE_MOVE_OWNED, fn_meta, freeze_callable_ownership_type,
    validate_callable_ownership_metadata,
    require_exact_callable_ownership_term}
use ast::{Program, Decl, UseDecl, UseImport, NamedImport}
use hir::{HProgram, HDecl, ValueBindingKind, ModuleImplFact, compare_by_first,
    variant_ctor_name}
use env::{TypeEnv, TypeScheme, StructDef, EnumDef, EffectDef, TraitDef, ImplEntry,
    TypeAliasDef, EffectAliasDef, SigDef, MethodOrigin,
    exact_scheme_value_origin, freeze_scheme_ownership,
    freeze_struct_def_ownership, freeze_enum_def_ownership,
    freeze_effect_def_ownership, freeze_trait_def_ownership,
    freeze_impl_entry_ownership, freeze_sig_def_ownership}
use infer_register::{prefix_decl_name, module_prefix_decl_name}

// ============================================================
// ModuleExports — the public interface of a compiled module
// ============================================================

pub struct ModuleExports {
    pub module_key: Str,
    pub module_prefix: Str,
    pub values: Map<Str, TypeScheme>,
    pub value_origins: Map<Str, Str>,
    // Exact registration kind for public value bindings. Absence is a local
    // borrow; variant constructors use variant_ctor_origins independently.
    pub value_binding_kinds: Map<Str, ValueBindingKind>,
    // Export lookup spelling -> canonical variant constructor symbol. This is
    // separate from value_origins because only genuine constructor bindings
    // may influence codegen/ownership classification.
    pub variant_ctor_origins: Map<Str, Str>,
    pub types: Map<Str, TypeDef>,
    pub type_aliases: Map<Str, TypeAliasDef>,
    pub effects: Map<Str, EffectDef>,
    pub effect_aliases: Map<Str, EffectAliasDef>,
    pub traits: Map<Str, TraitDef>,
    pub sigs: Map<Str, SigDef>,
    pub trait_impls: List<ImplEntry>,
    pub impl_methods: Map<Str, Map<Str, TypeScheme>>,
    pub method_origins: Map<Str, Map<Str, MethodOrigin>>,
    pub inherent_methods: Map<Str, List<Str>>,
    pub struct_field_orders: Map<Str, List<Str>>,
    pub extern_values: Set<Str>,
    pub mut_methods: Map<Str, Set<Str>>,
    pub fn_mut_params: Map<Str, List<Bool>>,
    // One shadow bundle carries callable descriptors/contracts/provenance and
    // nominal shapes across module boundaries.
    pub ownership_metadata: OwnershipMetadata
}

pub enum TypeDef {
    StructDef_(StructDef),
    EnumDef_(EnumDef)
}

fn validate_export_callable_identity(
    metadata: OwnershipMetadata, def_id: Int?, ty: Type
) {
    match (def_id, ty) {
        (some(id), Type::FnType { meta, .. }) => {
            let by_def = match metadata.callable_by_def_id.get(id) {
                some(term) => require_exact_callable_ownership_term(
                    metadata, term),
                none => panic(
                    "unreachable: exported callable has no DefId ownership contract")
            }
            if !metadata.callable_state_by_def_id.contains_key(id) {
                panic(
                    "unreachable: exported callable has no DefId ownership source")
            }
            let by_type = require_exact_callable_ownership_term(
                metadata, meta.ownership_term)
            if by_def != by_type {
                panic(
                    "unreachable: exported callable DefId/type ownership contract mismatch")
            }
        },
        (none, Type::FnType { .. }) => panic(
            "unreachable: exported callable has no exact DefId"),
        _ => {}
    }
}

fn validate_export_const_getter_identity(
    metadata: OwnershipMetadata, def_id: Int?
) {
    let id = match def_id {
        some(value) => value,
        none => panic(
            "unreachable: exported const getter has no exact DefId")
    }
    match metadata.callable_by_def_id.get(id) {
        some(term) => {
            let _ = require_exact_callable_ownership_term(metadata, term)
        },
        none => panic(
            "unreachable: exported const getter has no DefId ownership contract")
    }
    if !metadata.callable_state_by_def_id.contains_key(id) {
        panic(
            "unreachable: exported const getter has no DefId ownership source")
    }
}

fn validate_module_exports_callable_identities(exports: ModuleExports) {
    let metadata = exports.ownership_metadata
    for entry in exports.values.entries() {
        validate_export_callable_identity(
            metadata, entry.1.def_id, entry.1.ty)
        match exports.value_binding_kinds.get(entry.0) {
            some(ValueBindingKind::ConstGetter) =>
                validate_export_const_getter_identity(
                    metadata, entry.1.def_id),
            _ => {}
        }
    }
    for target in exports.impl_methods.entries() {
        for method in target.1.entries() {
            validate_export_callable_identity(
                metadata, method.1.def_id, method.1.ty)
        }
    }
    for trait_entry in exports.traits.entries() {
        for method in trait_entry.1.methods {
            validate_export_callable_identity(
                metadata, some(method.def_id), method.ty)
        }
    }
    for sig_entry in exports.sigs.entries() {
        for member in sig_entry.1.members.entries() {
            validate_export_callable_identity(
                metadata, member.1.def_id, member.1.ty)
        }
    }
    for impl_ in exports.trait_impls {
        for method in impl_.method_schemes.entries() {
            validate_export_callable_identity(
                metadata, method.1.def_id, method.1.ty)
        }
    }
}

// ModuleExports is a final checker boundary, not a second inference arena.
// Re-freezing is intentionally idempotent and recursively validates every
// callable term reachable from an exported registry payload.
pub fn freeze_module_exports_ownership(
    mut exports: ModuleExports
) -> ModuleExports {
    let metadata = exports.ownership_metadata
    validate_callable_ownership_metadata(metadata)
    validate_module_exports_callable_identities(exports)
    for entry in exports.values.entries() {
        exports.values.insert(entry.0,
            freeze_scheme_ownership(metadata, entry.1))
    }
    for entry in exports.types.entries() {
        let frozen = match entry.1 {
            TypeDef::StructDef_(def) => TypeDef::StructDef_(
                freeze_struct_def_ownership(metadata, def)),
            TypeDef::EnumDef_(def) => TypeDef::EnumDef_(
                freeze_enum_def_ownership(metadata, def))
        }
        exports.types.insert(entry.0, frozen)
    }
    for entry in exports.type_aliases.entries() {
        exports.type_aliases.insert(entry.0,
            TypeAliasDef { ..entry.1,
                ty: freeze_callable_ownership_type(metadata, entry.1.ty) })
    }
    for entry in exports.effects.entries() {
        exports.effects.insert(entry.0,
            freeze_effect_def_ownership(metadata, entry.1))
    }
    for entry in exports.traits.entries() {
        exports.traits.insert(entry.0,
            freeze_trait_def_ownership(metadata, entry.1))
    }
    for entry in exports.sigs.entries() {
        exports.sigs.insert(entry.0,
            freeze_sig_def_ownership(metadata, entry.1))
    }
    exports.trait_impls = exports.trait_impls.map(fn(impl_) {
        freeze_impl_entry_ownership(metadata, impl_)
    })
    for target in exports.impl_methods.entries() {
        let mut methods: Map<Str, TypeScheme> = map_new()
        for method in target.1.entries() {
            methods.insert(method.0,
                freeze_scheme_ownership(metadata, method.1))
        }
        exports.impl_methods.insert(target.0, methods)
    }
    validate_callable_ownership_metadata(metadata)
    validate_module_exports_callable_identities(exports)
    exports
}

fn export_display_name(identity: Str) -> Str {
    let parts = identity.split("$$_")
    if parts.len() > 1 { parts.get(1).unwrap_or(identity) } else { identity }
}

// ============================================================
// extract_decl_export — recursive helper for extract_exports
// Handles a single declaration, inserting its public exports
// into the collector maps. For ModBlock decls, recurses to
// support arbitrary nesting depth.
// ============================================================

fn append_identity(prefix: Str, name: Str) -> Str {
    if prefix.ends_with("$$_") { "${prefix}${name}" } else { "${prefix}::${name}" }
}

fn identity_leaf(identity: Str) -> Str {
    let inline_parts = identity.split("::")
    let inline_leaf = inline_parts.get(inline_parts.len() - 1).unwrap_or(identity)
    let file_parts = inline_leaf.split("$$_")
    file_parts.get(file_parts.len() - 1).unwrap_or(inline_leaf)
}

// Raw extern identities deliberately omit the file/inline owner. A fallback
// from an exact canonical source is therefore valid only when the current
// file's AST proves that the complete `$$_mod::...::item` path ends at an
// ExternType declaration. Matching the leaf alone would let a prelude extern
// or an unrelated sibling satisfy a private inline re-export.
fn decl_path_is_extern_type(
    decls: List<Decl>, path: List<Str>, path_index: Int
) -> Bool {
    if path_index < 0 || path_index >= path.len() { return false }
    let expected = path.get(path_index).unwrap_or("")
    let is_leaf = path_index == path.len() - 1
    for decl in decls {
        if is_leaf {
            match decl {
                Decl::ExternType { name, .. } => {
                    if name == expected { return true }
                },
                _ => {}
            }
        } else {
            match decl {
                Decl::ModBlock { name, decls: nested, .. } => {
                    if name == expected &&
                       decl_path_is_extern_type(
                           nested, path, path_index + 1) {
                        return true
                    }
                },
                _ => {}
            }
        }
    }
    false
}

fn program_declares_exact_extern_source(
    program: Program, source: Str
) -> Bool {
    let identity_parts = source.split("$$_")
    if identity_parts.len() != 2 { return false }
    let relative = identity_parts.get(1).unwrap_or("")
    if relative == "" { return false }
    let path = relative.split("::")
    if path.len() == 0 { return false }
    decl_path_is_extern_type(program.decls, path, 0)
}

fn declared_value_kind(kinds: Map<Int, ValueBindingKind>, scheme: TypeScheme) -> ValueBindingKind? {
    match scheme.def_id {
        some(def_id) => kinds.get(def_id),
        none => none
    }
}

// Resolve a positional constructor through its unshadowable canonical payload.
// ModuleExports carries the current checker's ownership metadata, so a callable
// scheme must retain the matching checker-local DefId until a consumer rebinds
// the canonical origin into its own environment.
fn exact_variant_ctor_def_id_result_firebreak(def_id: Int) -> Int? {
    let exact_def_id = def_id
    some(exact_def_id)
}

fn exact_variant_ctor_def_id(
    env: TypeEnv, def: EnumDef, variant: EnumVariant
) -> Int? {
    if variant.field_names.is_some() || variant.fields.len() == 0 {
        return none
    }
    let ctor_origin = variant_ctor_name(def.name, variant.name)
    match env.lookup(ctor_origin) {
        some(scheme) => match (scheme.def_id, scheme.ty) {
            (some(def_id), Type::FnType { .. }) => {
                match env.types.variant_ctor_origins.get(def_id) {
                    some(origin) => {
                        if origin != ctor_origin {
                            panic("unreachable: enum constructor origin was replaced")
                        }
                    },
                    none => panic(
                        "unreachable: enum constructor has no exact origin")
                }
                exact_variant_ctor_def_id_result_firebreak(def_id)
            },
            _ => panic(
                "unreachable: positional enum constructor has no exact callable identity")
        },
        none => panic(
            "unreachable: canonical enum constructor is not registered")
    }
}

// Reconstruct an enum constructor from its canonical definition. Looking up the
// variant leaf in the value environment is unsound: a later module-local value
// with the same spelling may shadow that leaf while the public enum must still
// export its own constructor. Positional constructors recover only the DefId of
// the exact canonical payload; their type is still rebuilt from EnumDef.
fn variant_ctor_scheme(
    env: TypeEnv, def: EnumDef, variant: EnumVariant
) -> TypeScheme {
    let enum_params = def.type_param_vars.map(fn(id) {
        Type::TypeVar { id: id, name: none }
    })
    let enum_name = def.name
    let enum_type = Type::EnumType {
        name: enum_name, type_params: enum_params
    }
    let ctor_type = if variant.field_names.is_some() || variant.fields.len() == 0 {
        enum_type
    } else {
        let ctor_params = variant.fields
        Type::FnType {
            params: ctor_params, return_type: enum_type,
            meta: fn_meta(EMPTY_ROW, CALLABLE_MOVE_OWNED)
        }
    }
    let scheme_type_vars = def.type_param_vars
    TypeScheme {
        ty: ctor_type,
        type_vars: scheme_type_vars,
        bounds: [],
        def_id: exact_variant_ctor_def_id(env, def, variant)
    }
}

// Resolve a relative pub-use inside an inline module to the same canonical
// identity scheme used by registration (file-prefix$$_inline::item).
fn inline_use_source_prefix(mod_identity: Str, use_decl: UseDecl) -> Str? {
    let path = use_decl.path.segments
    if path.len() == 0 { return none }
    let first = path.get(0).unwrap_or("")
    if first != "self" && first != "super" { return none }

    let identity_parts = mod_identity.split("$$_")
    if identity_parts.len() < 2 { return none }
    let root = "${identity_parts.get(0).unwrap_or("")}$$_"
    let mut inline_parts = identity_parts.get(1).unwrap_or("").split("::")

    let mut index = 1
    if first == "super" {
        if inline_parts.len() == 0 { return none }
        inline_parts.pop()
        while index < path.len() && path.get(index).unwrap_or("") == "super" {
            if inline_parts.len() == 0 { return none }
            inline_parts.pop()
            index = index + 1
        }
    }

    let remaining_end = match use_decl.imports {
        UseImport::NamedItems { .. } => path.len(),
        UseImport::Module => path.len() - 1
    }
    while index < remaining_end {
        inline_parts.push(path.get(index).unwrap_or(""))
        index = index + 1
    }
    if inline_parts.len() == 0 { some(root) } else { some("${root}${inline_parts.join("::")}") }
}

fn copy_inline_export(
    source: Str, local: Str, env: TypeEnv, fn_mut_params_map: Map<Str, List<Bool>>, program: Program,
    mut values: Map<Str, TypeScheme>, mut value_origins: Map<Str, Str>,
    exact_value_origins: Map<Int, Str>,
    exact_value_binding_kinds: Map<Int, ValueBindingKind>,
    mut value_binding_kinds: Map<Str, ValueBindingKind>,
    mut variant_ctor_origins: Map<Str, Str>,
    mut types: Map<Str, TypeDef>, mut type_aliases: Map<Str, TypeAliasDef>, mut effects: Map<Str, EffectDef>,
    mut effect_aliases: Map<Str, EffectAliasDef>, mut traits: Map<Str, TraitDef>,
    mut sigs: Map<Str, SigDef>,
    mut impl_methods: Map<Str, Map<Str, TypeScheme>>,
    mut method_origins: Map<Str, Map<Str, MethodOrigin>>,
    mut inherent_methods: Map<Str, List<Str>>, mut struct_field_orders: Map<Str, List<Str>>,
    mut extern_values: Set<Str>, mut mut_methods: Map<Str, Set<Str>>,
    mut fn_mut_params: Map<Str, List<Bool>>
) {
    let fn_mut_source = source
    let struct_source = source
    let extern_decl_source = source
    let extern_abi_source = source
    let enum_source = source
    let type_alias_source = source
    let effect_source = source
    let effect_alias_source = source
    let trait_source = source
    let sig_source = source
    match env.lookup(source) {
        some(scheme) => {
            let exact_origin = exact_scheme_value_origin(
                exact_value_origins, scheme, source)
            let value_local = local
            let stored_scheme = scheme
            values.insert(value_local, stored_scheme)
            let origin_local = local
            let stored_exact_origin = exact_origin
            value_origins.insert(origin_local, stored_exact_origin)
            match declared_value_kind(exact_value_binding_kinds, scheme) {
                some(kind) => {
                    let kind_local = local
                    let stored_kind = kind
                    value_binding_kinds.insert(kind_local, stored_kind)
                    match kind {
                        ValueBindingKind::ExternCallable => {
                            let extern_local = local
                            extern_values.insert(extern_local)
                        },
                        _ => {}
                    }
                },
                none => {}
            }
            match scheme.def_id {
                some(def_id) => match env.types.variant_ctor_origins.get(def_id) {
                    some(origin) => {
                        let ctor_local = local
                        let stored_ctor_origin = origin
                        variant_ctor_origins.insert(
                            ctor_local, stored_ctor_origin)
                    },
                    none => {}
                },
                none => {}
            }
            match fn_mut_params_map.get(fn_mut_source) {
                some(flags) => {
                    let fn_mut_local = local
                    let stored_flags = flags
                    fn_mut_params.insert(fn_mut_local, stored_flags)
                },
                none => match fn_mut_params_map.get(exact_origin) {
                    some(flags) => {
                        let fn_mut_local = local
                        let stored_flags = flags
                        fn_mut_params.insert(fn_mut_local, stored_flags)
                    },
                    none => {}
                }
            }
        },
        none => {
            // Every file/inline extern now has a canonical declaration
            // identity in the environment. A leaf fallback here would allow
            // an unrelated same-spelled extern to leak across module scopes.
        }
    }
    match env.types.structs.get(struct_source) {
        some(def) => {
            let struct_local = local
            let stored_struct_def = def
            types.insert(struct_local, TypeDef::StructDef_(stored_struct_def))
            let mut fields: List<Str> = []
            for field in def.fields { fields.push(field.name) }
            let field_order_local = local
            struct_field_orders.insert(field_order_local, fields)
            match env.trait_reg.impl_methods.get(def.name) {
                some(methods) => {
                    let impl_target = def.name
                    impl_methods.insert(impl_target, map_clone(methods))
                }, none => {}
            }
            match env.trait_reg.method_origins.get(def.name) {
                some(origins) => {
                    let origin_target = def.name
                    method_origins.insert(origin_target, map_clone(origins))
                }, none => {}
            }
            match env.trait_reg.mut_methods.get(def.name) {
                some(methods) => {
                    let mut_target = def.name
                    let stored_mut_methods = methods
                    mut_methods.insert(mut_target, stored_mut_methods)
                }, none => {}
            }
        },
        none => {
            // Extern types retain a raw ABI identity. Permit that lookup only
            // after the complete canonical source path is proven against this
            // file's recursive AST; never infer ownership from a unique leaf.
            if program_declares_exact_extern_source(
                    program, extern_decl_source) {
                let abi_name = identity_leaf(extern_abi_source)
                match env.types.extern_structs.get(abi_name) {
                    some(def) => {
                        if def.is_extern {
                            let extern_local = local
                            let stored_extern_def = def
                            types.insert(
                                extern_local,
                                TypeDef::StructDef_(stored_extern_def))
                        }
                    },
                    none => {}
                }
            }
        }
    }
    match env.types.enums.get(enum_source) {
        some(def) => {
            let enum_local = local
            let stored_enum_def = def
            types.insert(enum_local, TypeDef::EnumDef_(stored_enum_def))
            // A facade enum must carry its constructors even when the source
            // inline module itself is private. Reconstruct the registration
            // scheme from the canonical EnumDef instead of consulting the
            // unqualified variant binding, which may belong to a same-spelled
            // variant from another enum. The fully-qualified facade binding
            // gives inference an exact lookup; the legacy leaf binding keeps
            // named enum imports compatible when it is not already occupied.
            for variant in def.variants {
                let ctor_def = def
                let ctor_variant = variant
                let ctor_scheme = variant_ctor_scheme(
                    env, ctor_def, ctor_variant)
                let ctor_origin = variant_ctor_name(def.name, variant.name)
                let facade_ctor = "${local}::${variant.name}"
                let facade_value_name = facade_ctor
                let facade_scheme = ctor_scheme
                values.insert(facade_value_name, facade_scheme)
                let facade_origin_name = facade_ctor
                let facade_origin = ctor_origin
                value_origins.insert(facade_origin_name, facade_origin)
                if variant.field_names.is_none() {
                    let facade_ctor_origin = ctor_origin
                    variant_ctor_origins.insert(
                        facade_ctor, facade_ctor_origin)
                }
                if !values.contains_key(variant.name) {
                    let variant_value_name = variant.name
                    values.insert(variant_value_name, ctor_scheme)
                    let variant_origin_name = variant.name
                    let variant_origin = ctor_origin
                    value_origins.insert(
                        variant_origin_name, variant_origin)
                    if variant.field_names.is_none() {
                        let variant_ctor_name_ = variant.name
                        variant_ctor_origins.insert(
                            variant_ctor_name_, ctor_origin)
                    }
                }
            }
            match env.trait_reg.impl_methods.get(def.name) {
                some(methods) => {
                    let impl_target = def.name
                    impl_methods.insert(impl_target, map_clone(methods))
                }, none => {}
            }
            match env.trait_reg.method_origins.get(def.name) {
                some(origins) => {
                    let origin_target = def.name
                    method_origins.insert(origin_target, map_clone(origins))
                }, none => {}
            }
            match env.trait_reg.mut_methods.get(def.name) {
                some(methods) => {
                    let mut_target = def.name
                    let stored_mut_methods = methods
                    mut_methods.insert(mut_target, stored_mut_methods)
                }, none => {}
            }
        },
        none => {}
    }
    match env.types.type_aliases.get(type_alias_source) {
        some(def) => {
            let alias_local = local
            let stored_alias_def = def
            type_aliases.insert(alias_local, stored_alias_def)
        }, none => {}
    }
    match env.types.effects.get(effect_source) {
        some(def) => {
            let effect_local = local
            let stored_effect_def = def
            effects.insert(effect_local, stored_effect_def)
        }, none => {}
    }
    match env.types.effect_aliases.get(effect_alias_source) {
        some(def) => {
            let effect_alias_local = local
            let stored_effect_alias_def = def
            effect_aliases.insert(
                effect_alias_local, stored_effect_alias_def)
        }, none => {}
    }
    match env.trait_reg.traits.get(trait_source) {
        some(def) => {
            let trait_local = local
            let stored_trait_def = def
            traits.insert(trait_local, stored_trait_def)
        }, none => {}
    }
    match env.types.sigs.get(sig_source) {
        some(def) => {
            let sig_local = local
            let stored_sig_def = def
            sigs.insert(sig_local, stored_sig_def)
        }, none => {}
    }
}

fn prefix_export_subdecl_firebreak(mod_name: Str, decl: Decl) -> Decl {
    let current_mod_name = mod_name
    let current_decl = decl
    prefix_decl_name(current_mod_name, current_decl)
}

fn extract_decl_export(
    decl: Decl,
    env: TypeEnv,
    fn_mut_params_map: Map<Str, List<Bool>>,
    program: Program,
    mut values: Map<Str, TypeScheme>,
    mut value_origins: Map<Str, Str>,
    exact_value_origins: Map<Int, Str>,
    exact_value_binding_kinds: Map<Int, ValueBindingKind>,
    mut value_binding_kinds: Map<Str, ValueBindingKind>,
    mut variant_ctor_origins: Map<Str, Str>,
    mut types: Map<Str, TypeDef>,
    mut type_aliases: Map<Str, TypeAliasDef>,
    mut effects: Map<Str, EffectDef>,
    mut effect_aliases: Map<Str, EffectAliasDef>,
    mut traits: Map<Str, TraitDef>,
    mut sigs: Map<Str, SigDef>,
    mut impl_methods: Map<Str, Map<Str, TypeScheme>>,
    mut method_origins: Map<Str, Map<Str, MethodOrigin>>,
    mut inherent_methods: Map<Str, List<Str>>,
    mut struct_field_orders: Map<Str, List<Str>>,
    mut extern_values: Set<Str>,
    mut mut_methods: Map<Str, Set<Str>>,
    mut fn_mut_params: Map<Str, List<Bool>>,
    is_top_level: Bool
) {
    match decl {
        Decl::Fn { name, is_pub, .. } => {
            if is_pub {
                let fn_display_source = name
                let display = export_display_name(fn_display_source)
                match env.lookup(name) {
                    some(scheme) => {
                        let value_display = display
                        let stored_scheme = scheme
                        values.insert(value_display, stored_scheme)
                        let origin_display = display
                        let origin_name = name
                        value_origins.insert(origin_display, origin_name)
                        let kind_display = display
                        value_binding_kinds.insert(
                            kind_display, ValueBindingKind::DirectCallable)
                    },
                    none => {},
                }
                match fn_mut_params_map.get(name) {
                    some(flags) => {
                        let stored_flags = flags
                        fn_mut_params.insert(display, stored_flags)
                    },
                    none => {},
                }
            }
        },
        Decl::Struct { name, is_pub, .. } => {
            if is_pub {
                let struct_display_source = name
                let display = export_display_name(struct_display_source)
                match env.types.structs.get(name) {
                    some(sdef) => {
                        let type_display = display
                        let stored_struct_def = sdef
                        types.insert(
                            type_display, TypeDef::StructDef_(stored_struct_def))
                        let mut field_names: List<Str> = []
                        for f in sdef.fields { field_names.push(f.name) }
                        struct_field_orders.insert(
                            display, field_names)
                    },
                    none => {},
                }
            }
        },
        Decl::Enum { name, is_pub, .. } => {
            if is_pub {
                let enum_display_source = name
                let display = export_display_name(enum_display_source)
                match env.types.enums.get(name) {
                    some(edef) => {
                        let stored_enum_def = edef
                        types.insert(
                            display, TypeDef::EnumDef_(stored_enum_def))
                        // The module's final leaf scope may contain an unrelated
                        // same-spelled private fn/const. Export the enum's exact
                        // constructor scheme and identity from EnumDef instead.
                        for v in edef.variants {
                            let ctor_def = edef
                            let ctor_variant = v
                            let ctor_scheme = variant_ctor_scheme(
                                env, ctor_def, ctor_variant)
                            let ctor_origin = variant_ctor_name(edef.name, v.name)
                            let value_name = v.name
                            values.insert(value_name, ctor_scheme)
                            let origin_name = v.name
                            let stored_ctor_origin = ctor_origin
                            value_origins.insert(
                                origin_name, stored_ctor_origin)
                            // Fieldless and positional constructors lower via
                            // Ident/Call and therefore need provenance. Named
                            // construction uses its dedicated HIR node.
                            if v.field_names.is_none() {
                                let ctor_name = v.name
                                variant_ctor_origins.insert(
                                    ctor_name, ctor_origin)
                            }
                        }
                    },
                    none => {},
                }
            }
        },
        Decl::Effect { name, is_pub, .. } => {
            if is_pub {
                let effect_display_source = name
                let display = export_display_name(effect_display_source)
                match env.types.effects.get(name) {
                    some(effdef) => {
                        let stored_effect_def = effdef
                        effects.insert(display, stored_effect_def)
                    },
                    none => {},
                }
            }
        },
        Decl::EffectAlias { name, is_pub, .. } => {
            if is_pub {
                let effect_alias_display_source = name
                let display = export_display_name(
                    effect_alias_display_source)
                match env.types.effect_aliases.get(name) {
                    some(adef) => {
                        let stored_alias_def = adef
                        effect_aliases.insert(display, stored_alias_def)
                    },
                    none => {},
                }
            }
        },
        Decl::Trait { name, is_pub, .. } => {
            if is_pub {
                let trait_display_source = name
                let display = export_display_name(trait_display_source)
                match env.trait_reg.traits.get(name) {
                    some(tdef) => {
                        let stored_trait_def = tdef
                        traits.insert(display, stored_trait_def)
                    },
                    none => {},
                }
            }
        },
        Decl::Sig { name, is_pub, .. } => {
            if is_pub {
                let sig_display_source = name
                let display = export_display_name(sig_display_source)
                match env.types.sigs.get(name) {
                    some(sigdef) => {
                        let stored_sig_def = sigdef
                        sigs.insert(display, stored_sig_def)
                    },
                    none => {},
                }
            }
        },
        // Decl::Impl is intentionally absent here: impl exports are driven by
        // the checker's persisted ModuleImplFact list (export_impl_facts),
        // whose targets were resolved while the namespace frames were live.
        Decl::ExternFn { name, is_pub, .. } => {
            if is_pub {
                let extern_fn_display_source = name
                let display = export_display_name(
                    extern_fn_display_source)
                let extern_display = display
                extern_values.insert(extern_display)
                match env.lookup(name) {
                    some(scheme) => {
                        let value_display = display
                        let stored_scheme = scheme
                        values.insert(value_display, stored_scheme)
                        let origin_display = display
                        let origin_name = name
                        value_origins.insert(origin_display, origin_name)
                        value_binding_kinds.insert(
                            display, ValueBindingKind::ExternCallable)
                    },
                    none => {},
                }
            }
        },
        Decl::ExternType { name, is_pub, .. } => {
            if is_pub {
                let extern_type_display_source = name
                let display = export_display_name(
                    extern_type_display_source)
                let abi_name = identity_leaf(name)
                match env.types.extern_structs.get(abi_name) {
                    some(sdef) => {
                        if sdef.is_extern {
                            let stored_extern_def = sdef
                            types.insert(
                                display,
                                TypeDef::StructDef_(stored_extern_def))
                        }
                    },
                    none => {},
                }
            }
        },
        Decl::TypeAlias { name, is_pub, .. } => {
            if is_pub {
                let type_alias_display_source = name
                let display = export_display_name(
                    type_alias_display_source)
                match env.types.type_aliases.get(name) {
                    some(adef) => {
                        let stored_alias_def = adef
                        type_aliases.insert(display, stored_alias_def)
                    },
                    none => {},
                }
            }
        },
        Decl::Const { name, is_pub, .. } => {
            if is_pub {
                let const_display_source = name
                let display = export_display_name(const_display_source)
                match env.lookup(name) {
                    some(scheme) => {
                        let value_display = display
                        let stored_scheme = scheme
                        values.insert(value_display, stored_scheme)
                        let origin_display = display
                        let origin_name = name
                        value_origins.insert(origin_display, origin_name)
                        value_binding_kinds.insert(
                            display, ValueBindingKind::ConstGetter)
                    },
                    none => {},
                }
            }
        },
        Decl::ModBlock { name: mod_name, uses: mod_uses, decls: mod_decls, is_pub: mpub, .. } => {
            if mpub {
                for subdecl in mod_decls {
                    let prefixed = prefix_export_subdecl_firebreak(
                        mod_name, subdecl)
                    extract_decl_export(prefixed, env, fn_mut_params_map, program,
                        values, value_origins, exact_value_origins,
                        exact_value_binding_kinds, value_binding_kinds,
                        variant_ctor_origins,
                        types, type_aliases, effects, effect_aliases, traits, sigs,
                        impl_methods, method_origins, inherent_methods, struct_field_orders,
                        extern_values, mut_methods, fn_mut_params, false)
                }
                let facade_module_name = mod_name
                let facade = export_display_name(facade_module_name)
                for use_decl in mod_uses {
                    if !use_decl.is_pub { continue }
                    match inline_use_source_prefix(mod_name, use_decl) {
                        some(source_prefix) => match use_decl.imports {
                            UseImport::NamedItems { names } => {
                                for item in names {
                                    let local_name = match item.alias { some(a) => a, none => item.name }
                                    copy_inline_export(append_identity(source_prefix, item.name), "${facade}::${local_name}",
                                        env, fn_mut_params_map, program, values, value_origins,
                                        exact_value_origins, exact_value_binding_kinds,
                                        value_binding_kinds, variant_ctor_origins,
                                        types, type_aliases, effects, effect_aliases, traits, sigs,
                                        impl_methods, method_origins, inherent_methods, struct_field_orders, extern_values, mut_methods, fn_mut_params)
                                }
                            },
                            UseImport::Module => {
                                let path = use_decl.path.segments
                                let item_name = path.get(path.len() - 1).unwrap_or("")
                                let local_name = match use_decl.alias { some(a) => a, none => item_name }
                                copy_inline_export(append_identity(source_prefix, item_name), "${facade}::${local_name}",
                                    env, fn_mut_params_map, program, values, value_origins,
                                    exact_value_origins, exact_value_binding_kinds,
                                    value_binding_kinds, variant_ctor_origins,
                                    types, type_aliases, effects, effect_aliases, traits, sigs,
                                    impl_methods, method_origins, inherent_methods, struct_field_orders, extern_values, mut_methods, fn_mut_params)
                            }
                        },
                        none => {}
                    }
                }
            }
        },
        _ => {},
    }
}

// ============================================================
// extract_exports
// ============================================================

fn copy_exported_name(
    source: ModuleExports, env: TypeEnv,
    source_name: Str, local_name: Str,
    mut values: Map<Str, TypeScheme>, mut value_origins: Map<Str, Str>,
    mut value_binding_kinds: Map<Str, ValueBindingKind>,
    mut variant_ctor_origins: Map<Str, Str>,
    mut types: Map<Str, TypeDef>, mut type_aliases: Map<Str, TypeAliasDef>, mut effects: Map<Str, EffectDef>,
    mut effect_aliases: Map<Str, EffectAliasDef>, mut traits: Map<Str, TraitDef>,
    mut sigs: Map<Str, SigDef>,
    mut struct_field_orders: Map<Str, List<Str>>, mut extern_values: Set<Str>,
    mut fn_mut_params: Map<Str, List<Bool>>,
    mut impl_methods: Map<Str, Map<Str, TypeScheme>>,
    mut method_origins: Map<Str, Map<Str, MethodOrigin>>,
    mut inherent_methods: Map<Str, List<Str>>, mut mut_methods: Map<Str, Set<Str>>
) {
    match source.values.get(source_name) {
        some(_) => {
            match source.value_origins.get(source_name) {
                some(origin) => {
                    // Dependency injection allocated a checker-local DefId for
                    // this canonical origin. Re-exports must publish that
                    // scheme together with the current module's metadata; a
                    // foreign scheme DefId would no longer key this bundle.
                    match env.lookup(origin) {
                        some(local_scheme) => {
                            let value_local_name = local_name
                            let stored_local_scheme = local_scheme
                            values.insert(
                                value_local_name, stored_local_scheme)
                        },
                        none => panic(
                            "unreachable: re-export canonical value is not hydrated")
                    }
                    let origin_local_name = local_name
                    let stored_origin = origin
                    value_origins.insert(origin_local_name, stored_origin)
                },
                none => panic(
                    "unreachable: re-exported value has no canonical origin")
            }
            match source.value_binding_kinds.get(source_name) {
                some(kind) => {
                    let kind_local_name = local_name
                    let stored_kind = kind
                    value_binding_kinds.insert(kind_local_name, stored_kind)
                },
                none => {}
            }
            match source.variant_ctor_origins.get(source_name) {
                some(origin) => {
                    let ctor_local_name = local_name
                    let stored_ctor_origin = origin
                    variant_ctor_origins.insert(
                        ctor_local_name, stored_ctor_origin)
                },
                none => {}
            }
        },
        none => {}
    }
    match source.types.get(source_name) {
        some(def) => {
            let type_local_name = local_name
            let stored_type_def = def
            types.insert(type_local_name, stored_type_def)
            let canonical_type = match def {
                TypeDef::StructDef_(sdef) => sdef.name,
                TypeDef::EnumDef_(edef) => edef.name
            }
            match source.impl_methods.get(canonical_type) {
                some(methods) => {
                    let mut localized: Map<Str, TypeScheme> = map_new()
                    let mut method_entries = methods.entries()
                    method_entries.sort_by(compare_by_first)
                    for method_entry in method_entries {
                        let (method_name, _) = method_entry
                        let current_methods = env.trait_reg.impl_methods.get(
                            canonical_type)
                        let current_origins = env.trait_reg.method_origins.get(
                            canonical_type)
                        let source_origins = source.method_origins.get(
                            canonical_type)
                        let stored_local_scheme = match (
                                current_methods, current_origins,
                                source_origins) {
                            (some(local_methods), some(local_origins),
                             some(exported_origins)) =>
                                match (local_methods.get(method_name),
                                       local_origins.get(method_name),
                                       exported_origins.get(method_name)) {
                                    (some(local_scheme), some(local_origin),
                                     some(exported_origin)) => {
                                        if local_origin.origin != exported_origin.origin {
                                            panic("unreachable: re-export method origin was replaced")
                                        }
                                        local_scheme
                                    },
                                    _ => panic("unreachable: re-export method is not hydrated")
                                },
                            _ => panic("unreachable: re-export method registry is missing")
                        }
                        let localized_method_name = method_name
                        localized.insert(
                            localized_method_name, stored_local_scheme)
                    }
                    let impl_target = canonical_type
                    impl_methods.insert(impl_target, localized)
                },
                none => {}
            }
            match source.method_origins.get(canonical_type) {
                some(origins) => {
                    let origin_target = canonical_type
                    method_origins.insert(origin_target, map_clone(origins))
                }, none => {}
            }
            match source.inherent_methods.get(canonical_type) {
                some(methods) => {
                    let inherent_target = canonical_type
                    inherent_methods.insert(
                        inherent_target, list_clone(methods))
                }, none => {}
            }
            match source.mut_methods.get(canonical_type) {
                some(methods) => {
                    let mut_target = canonical_type
                    let stored_mut_methods = methods
                    mut_methods.insert(mut_target, stored_mut_methods)
                }, none => {}
            }
        },
        none => {}
    }
    match source.type_aliases.get(source_name) {
        some(def) => {
            let alias_local_name = local_name
            let stored_alias_def = def
            type_aliases.insert(alias_local_name, stored_alias_def)
        }, none => {}
    }
    match source.effects.get(source_name) {
        some(def) => {
            let effect_local_name = local_name
            let stored_effect_def = def
            effects.insert(effect_local_name, stored_effect_def)
        }, none => {}
    }
    match source.effect_aliases.get(source_name) {
        some(def) => {
            let effect_alias_local_name = local_name
            let stored_effect_alias_def = def
            effect_aliases.insert(
                effect_alias_local_name, stored_effect_alias_def)
        }, none => {}
    }
    match source.traits.get(source_name) {
        some(def) => match env.trait_reg.traits.get(def.name) {
            some(local_def) => {
                let trait_local_name = local_name
                let stored_trait_def = local_def
                traits.insert(trait_local_name, stored_trait_def)
            },
            none => panic("unreachable: re-export trait is not hydrated")
        },
        none => {}
    }
    match source.sigs.get(source_name) {
        some(def) => match env.types.sigs.get(def.name) {
            some(local_def) => {
                let sig_local_name = local_name
                let stored_sig_def = local_def
                sigs.insert(sig_local_name, stored_sig_def)
            },
            none => panic("unreachable: re-export sig is not hydrated")
        },
        none => {}
    }
    match source.struct_field_orders.get(source_name) {
        some(fields) => {
            let field_order_local_name = local_name
            let stored_fields = fields
            struct_field_orders.insert(
                field_order_local_name, stored_fields)
        }, none => {}
    }
    if source.extern_values.contains(source_name) {
        let extern_local_name = local_name
        extern_values.insert(extern_local_name)
    }
    match source.fn_mut_params.get(source_name) {
        some(flags) => {
            let fn_mut_local_name = local_name
            let stored_flags = flags
            fn_mut_params.insert(fn_mut_local_name, stored_flags)
        }, none => {}
    }
}

// Export the methods of every user-declared impl block. The canonical target
// in each ModuleImplFact was resolved by the checker while the module's
// namespace frames were live (check_impl_decl -> resolve_nominal_identity),
// so this consumes the registration result directly instead of replaying
// lexical resolution against the rolled-back environment.
fn export_impl_facts(
    impl_facts: List<ModuleImplFact>,
    env: TypeEnv,
    fn_mut_params_map: Map<Str, List<Bool>>,
    program: Program,
    mut impl_methods: Map<Str, Map<Str, TypeScheme>>,
    mut method_origins: Map<Str, Map<Str, MethodOrigin>>,
    mut inherent_methods: Map<Str, List<Str>>,
    mut mut_methods: Map<Str, Set<Str>>,
    mut fn_mut_params: Map<Str, List<Bool>>
) {
    for fact in impl_facts {
        match env.trait_reg.impl_methods.get(fact.target) {
            some(methods_map) => {
                let impl_target = fact.target
                impl_methods.insert(impl_target, map_clone(methods_map))
            },
            none => {
                // Registration and checking resolve the target through the
                // same live frames, so a fact with methods but no registry
                // entry means the two passes disagreed. Exports only run on
                // modules with zero user errors — never paper over it.
                if fact.method_names.len() > 0 {
                    panic("internal: impl methods for '${fact.target}' missing from registration")
                }
            }
        }
        match env.trait_reg.method_origins.get(fact.target) {
            some(origins) => {
                let origin_target = fact.target
                method_origins.insert(origin_target, map_clone(origins))
            },
            none => {}
        }
        match env.trait_reg.mut_methods.get(fact.target) {
            some(ms) => {
                let mut_target = fact.target
                let stored_mut_methods = ms
                mut_methods.insert(mut_target, stored_mut_methods)
            },
            none => {}
        }
        for mname in fact.method_names {
            let full_name = "${fact.target}_${mname}"
            match fn_mut_params_map.get(full_name) {
                some(flags) => {
                    let stored_flags = flags
                    fn_mut_params.insert(full_name, stored_flags)
                },
                none => {}
            }
        }
        // Inherent-method name lists — only for top-level impls of pub types
        // (mod-block nested impls never did the pub-type scan; preserved).
        if fact.is_top_level && !fact.is_trait_impl {
            let mut is_pub_type = false
            for d in program.decls {
                match d {
                    Decl::Struct { name, is_pub, .. } => {
                        if name == export_display_name(fact.target) && is_pub { is_pub_type = true }
                    },
                    Decl::Enum { name, is_pub, .. } => {
                        if name == export_display_name(fact.target) && is_pub { is_pub_type = true }
                    },
                    _ => {}
                }
            }
            if is_pub_type {
                let mut method_names: List<Str> = []
                for m in fact.method_names {
                    let exported_method_name = m
                    method_names.push(exported_method_name)
                }
                match inherent_methods.get(fact.target) {
                    some(existing) => existing.extend(method_names),
                    none => {
                        let inherent_target = fact.target
                        inherent_methods.insert(inherent_target, method_names)
                    }
                }
            }
        }
    }
}

fn module_prefix_export_decl_firebreak(
    module_prefix: Str, decl: Decl
) -> Decl {
    let current_module_prefix = module_prefix
    let current_decl = decl
    module_prefix_decl_name(current_module_prefix, current_decl)
}

fn append_exported_impl_firebreak(
    mut trait_impls: List<ImplEntry>, impl_: ImplEntry
) {
    let current_impl = impl_
    trait_impls.push(current_impl)
}

pub fn extract_exports(
    module_key: Str,
    module_prefix: Str,
    program: Program,
    hprogram: HProgram,
    env: TypeEnv,
    fn_mut_params_map: Map<Str, List<Bool>>,
    exact_value_origins: Map<Int, Str>,
    exact_value_binding_kinds: Map<Int, ValueBindingKind>,
    impl_facts: List<ModuleImplFact>,
    available_modules: List<ModuleExports>
) -> ModuleExports {
    let mut values: Map<Str, TypeScheme> = map_new()
    let mut value_origins: Map<Str, Str> = map_new()
    let mut value_binding_kinds: Map<Str, ValueBindingKind> = map_new()
    let mut variant_ctor_origins: Map<Str, Str> = map_new()
    let mut types: Map<Str, TypeDef> = map_new()
    let mut type_aliases: Map<Str, TypeAliasDef> = map_new()
    let mut effects: Map<Str, EffectDef> = map_new()
    let mut effect_aliases: Map<Str, EffectAliasDef> = map_new()
    let mut traits: Map<Str, TraitDef> = map_new()
    let mut sigs: Map<Str, SigDef> = map_new()
    let mut impl_methods: Map<Str, Map<Str, TypeScheme>> = map_new()
    let mut method_origins: Map<Str, Map<Str, MethodOrigin>> = map_new()
    let mut inherent_methods: Map<Str, List<Str>> = map_new()
    let mut struct_field_orders: Map<Str, List<Str>> = map_new()
    let mut extern_values: Set<Str> = set_new()
    let mut mut_methods: Map<Str, Set<Str>> = map_new()
    let mut fn_mut_params: Map<Str, List<Bool>> = map_new()
    for decl in program.decls {
        let canonical_decl = module_prefix_export_decl_firebreak(
            module_prefix, decl)
        extract_decl_export(canonical_decl, env, fn_mut_params_map, program,
            values, value_origins, exact_value_origins,
            exact_value_binding_kinds, value_binding_kinds,
            variant_ctor_origins,
            types, type_aliases, effects, effect_aliases, traits, sigs,
            impl_methods, method_origins, inherent_methods, struct_field_orders,
            extern_values, mut_methods, fn_mut_params, true)
    }
    export_impl_facts(impl_facts, env, fn_mut_params_map, program,
        impl_methods, method_origins, inherent_methods, mut_methods, fn_mut_params)

    // Handle pub use re-exports from dependency export objects. Canonical
    // origins are forwarded while callable schemes are rebound through this
    // checker's local registries, so the facade's metadata and DefIds agree.
    // This covers named, aliased, whole-module, and transitive uses.
    let mut module_map: Map<Str, ModuleExports> = map_new()
    for mod_ in available_modules {
        let stored_module_key = mod_.module_key
        let stored_module = mod_
        module_map.insert(stored_module_key, stored_module)
    }
    for use_decl in program.uses {
        if use_decl.is_pub {
            let mod_key = use_decl.path.segments.join("::")
            match module_map.get(mod_key) {
                some(source) => match use_decl.imports {
                    UseImport::NamedItems { names } => {
                        for item in names {
                            let local_name = match item.alias { some(a) => a, none => item.name }
                            copy_exported_name(source, env, item.name, local_name,
                                values, value_origins, value_binding_kinds,
                                variant_ctor_origins,
                                types, type_aliases, effects, effect_aliases, traits, sigs,
                                struct_field_orders, extern_values, fn_mut_params,
                                impl_methods, method_origins, inherent_methods, mut_methods)
                            // Importing an enum also imports its constructors.
                            match source.types.get(item.name) {
                                some(TypeDef::EnumDef_(edef)) => {
                                    for v in edef.variants {
                                        copy_exported_name(source, env, v.name, v.name,
                                            values, value_origins, value_binding_kinds,
                                            variant_ctor_origins,
                                            types, type_aliases, effects, effect_aliases, traits, sigs,
                                            struct_field_orders, extern_values, fn_mut_params,
                                            impl_methods, method_origins, inherent_methods, mut_methods)
                                    }
                                },
                                _ => {}
                            }
                        }
                    },
                    UseImport::Module => {
                        let mut names: Set<Str> = set_new()
                        for entry in source.values.entries() {
                            let (name, _) = entry
                            let exported_name = name
                            names.insert(exported_name)
                        }
                        for entry in source.types.entries() {
                            let (name, _) = entry
                            let exported_name = name
                            names.insert(exported_name)
                        }
                        for entry in source.type_aliases.entries() {
                            let (name, _) = entry
                            let exported_name = name
                            names.insert(exported_name)
                        }
                        for entry in source.effects.entries() {
                            let (name, _) = entry
                            let exported_name = name
                            names.insert(exported_name)
                        }
                        for entry in source.effect_aliases.entries() {
                            let (name, _) = entry
                            let exported_name = name
                            names.insert(exported_name)
                        }
                        for entry in source.traits.entries() {
                            let (name, _) = entry
                            let exported_name = name
                            names.insert(exported_name)
                        }
                        for entry in source.sigs.entries() {
                            let (name, _) = entry
                            let exported_name = name
                            names.insert(exported_name)
                        }
                        let mut sorted_names = names.to_list()
                        sorted_names.sort()
                        for name in sorted_names {
                            copy_exported_name(source, env, name, name,
                                values, value_origins, value_binding_kinds,
                                variant_ctor_origins,
                                types, type_aliases, effects, effect_aliases, traits, sigs,
                                struct_field_orders, extern_values, fn_mut_params,
                                impl_methods, method_origins, inherent_methods, mut_methods)
                        }
                    }
                },
                none => {}
            }
        }
    }

    // Filter by canonical payload identity after re-exports have been applied.
    // A facade may rename Foo to Bar, but its ImplEntry must still travel with
    // StructDef.name/EnumDef.name rather than the display spelling.
    let mut exported_type_ids: Set<Str> = set_new()
    for entry in types.entries() {
        let (_, def) = entry
        match def {
            TypeDef::StructDef_(sdef) => exported_type_ids.insert(sdef.name),
            TypeDef::EnumDef_(edef) => exported_type_ids.insert(edef.name)
        }
    }
    let mut exported_trait_ids: Set<Str> = set_new()
    for entry in traits.entries() {
        let (_, def) = entry
        exported_trait_ids.insert(def.name)
    }
    let mut trait_impls: List<ImplEntry> = []
    let mut sorted_trait_impls = env.trait_reg.trait_impls.entries()
    sorted_trait_impls.sort_by(compare_by_first)
    for map_entry in sorted_trait_impls {
        let (_, impl_list) = map_entry
        for impl_ in impl_list {
            if exported_type_ids.contains(impl_.target_type_name) ||
               exported_trait_ids.contains(impl_.trait_name) {
                append_exported_impl_firebreak(trait_impls, impl_)
            }
        }
    }

    freeze_module_exports_ownership(ModuleExports {
        module_key: module_key,
        module_prefix: module_prefix,
        values: values,
        value_origins: value_origins,
        value_binding_kinds: value_binding_kinds,
        variant_ctor_origins: variant_ctor_origins,
        types: types,
        type_aliases: type_aliases,
        effects: effects,
        effect_aliases: effect_aliases,
        traits: traits,
        sigs: sigs,
        trait_impls: trait_impls,
        impl_methods: impl_methods,
        method_origins: method_origins,
        inherent_methods: inherent_methods,
        struct_field_orders: struct_field_orders,
        extern_values: extern_values,
        mut_methods: mut_methods,
        fn_mut_params: fn_mut_params,
        ownership_metadata: env.types.ownership_metadata
    })
}

