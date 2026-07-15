use types::{Type}
use ast::{Program, Decl, UseDecl, UseImport, NamedImport}
use hir::{HProgram, HDecl, compare_by_first, variant_ctor_name}
use env::{TypeEnv, TypeScheme, StructDef, EnumDef, EffectDef, TraitDef, ImplEntry, EffectAliasDef}
use infer_register::{prefix_decl_name, module_prefix_decl_name}

// ============================================================
// ModuleExports — the public interface of a compiled module
// ============================================================

pub struct ModuleExports {
    pub module_key: Str,
    pub module_prefix: Str,
    pub values: Map<Str, TypeScheme>,
    pub value_origins: Map<Str, Str>,
    pub types: Map<Str, TypeDef>,
    pub effects: Map<Str, EffectDef>,
    pub effect_aliases: Map<Str, EffectAliasDef>,
    pub traits: Map<Str, TraitDef>,
    pub trait_impls: List<ImplEntry>,
    pub impl_methods: Map<Str, Map<Str, TypeScheme>>,
    pub inherent_methods: Map<Str, List<Str>>,
    pub struct_field_orders: Map<Str, List<Str>>,
    pub extern_values: Set<Str>,
    pub mut_methods: Map<Str, Set<Str>>,
    pub fn_mut_params: Map<Str, List<Bool>>
}

pub enum TypeDef {
    StructDef_(StructDef),
    EnumDef_(EnumDef)
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
    source: Str, local: Str, env: TypeEnv, fn_mut_params_map: Map<Str, List<Bool>>,
    mut values: Map<Str, TypeScheme>, mut value_origins: Map<Str, Str>,
    mut types: Map<Str, TypeDef>, mut effects: Map<Str, EffectDef>,
    mut effect_aliases: Map<Str, EffectAliasDef>, mut traits: Map<Str, TraitDef>,
    mut impl_methods: Map<Str, Map<Str, TypeScheme>>,
    mut inherent_methods: Map<Str, List<Str>>, mut struct_field_orders: Map<Str, List<Str>>,
    mut mut_methods: Map<Str, Set<Str>>, mut fn_mut_params: Map<Str, List<Bool>>
) {
    match env.lookup(source) {
        some(scheme) => {
            values.insert(local, scheme)
            value_origins.insert(local, source)
            match fn_mut_params_map.get(source) {
                some(flags) => { fn_mut_params.insert(local, flags) }, none => {}
            }
        },
        none => {}
    }
    match env.types.structs.get(source) {
        some(def) => {
            types.insert(local, TypeDef::StructDef_(def))
            let mut fields: List<Str> = []
            for field in def.fields { fields.push(field.name) }
            struct_field_orders.insert(local, fields)
            match env.trait_reg.impl_methods.get(def.name) {
                some(methods) => { impl_methods.insert(def.name, map_clone(methods)) }, none => {}
            }
            match env.trait_reg.mut_methods.get(def.name) {
                some(methods) => { mut_methods.insert(def.name, methods) }, none => {}
            }
        },
        none => {}
    }
    match env.types.enums.get(source) {
        some(def) => {
            types.insert(local, TypeDef::EnumDef_(def))
            match env.trait_reg.impl_methods.get(def.name) {
                some(methods) => { impl_methods.insert(def.name, map_clone(methods)) }, none => {}
            }
            match env.trait_reg.mut_methods.get(def.name) {
                some(methods) => { mut_methods.insert(def.name, methods) }, none => {}
            }
        },
        none => {}
    }
    match env.types.effects.get(source) {
        some(def) => { effects.insert(local, def) }, none => {}
    }
    match env.types.effect_aliases.get(source) {
        some(def) => { effect_aliases.insert(local, def) }, none => {}
    }
    match env.trait_reg.traits.get(source) {
        some(def) => { traits.insert(local, def) }, none => {}
    }
}

fn extract_decl_export(
    decl: Decl,
    env: TypeEnv,
    fn_mut_params_map: Map<Str, List<Bool>>,
    program: Program,
    mut values: Map<Str, TypeScheme>,
    mut value_origins: Map<Str, Str>,
    mut types: Map<Str, TypeDef>,
    mut effects: Map<Str, EffectDef>,
    mut effect_aliases: Map<Str, EffectAliasDef>,
    mut traits: Map<Str, TraitDef>,
    mut impl_methods: Map<Str, Map<Str, TypeScheme>>,
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
                let display = export_display_name(name)
                match env.lookup(name) {
                    some(scheme) => {
                        values.insert(display, scheme)
                        value_origins.insert(display, name)
                    },
                    none => {},
                }
                match fn_mut_params_map.get(name) {
                    some(flags) => { fn_mut_params.insert(display, flags) },
                    none => {},
                }
            }
        },
        Decl::Struct { name, is_pub, .. } => {
            if is_pub {
                let display = export_display_name(name)
                match env.types.structs.get(name) {
                    some(sdef) => {
                        types.insert(display, TypeDef::StructDef_(sdef))
                        let mut field_names: List<Str> = []
                        for f in sdef.fields { field_names.push(f.name) }
                        struct_field_orders.insert(display, field_names)
                    },
                    none => {},
                }
            }
        },
        Decl::Enum { name, is_pub, .. } => {
            if is_pub {
                let display = export_display_name(name)
                match env.types.enums.get(name) {
                    some(edef) => {
                        types.insert(display, TypeDef::EnumDef_(edef))
                        for v in edef.variants {
                            match env.lookup(v.name) {
                                some(vscheme) => {
                                    values.insert(v.name, vscheme)
                                    value_origins.insert(v.name, variant_ctor_name(edef.name, v.name))
                                },
                                none => {},
                            }
                        }
                    },
                    none => {},
                }
            }
        },
        Decl::Effect { name, is_pub, .. } => {
            if is_pub {
                let display = export_display_name(name)
                match env.types.effects.get(name) {
                    some(effdef) => { effects.insert(display, effdef) },
                    none => {},
                }
            }
        },
        Decl::EffectAlias { name, is_pub, .. } => {
            if is_pub {
                let display = export_display_name(name)
                match env.types.effect_aliases.get(name) {
                    some(adef) => { effect_aliases.insert(display, adef) },
                    none => {},
                }
            }
        },
        Decl::Trait { name, is_pub, .. } => {
            if is_pub {
                let display = export_display_name(name)
                match env.trait_reg.traits.get(name) {
                    some(tdef) => { traits.insert(display, tdef) },
                    none => {},
                }
            }
        },
        Decl::Impl { target_type, trait_name, methods, .. } => {
            match env.trait_reg.impl_methods.get(target_type) {
                some(methods_map) => {
                    impl_methods.insert(target_type, map_clone(methods_map))
                },
                none => {},
            }
            match env.trait_reg.mut_methods.get(target_type) {
                some(ms) => { mut_methods.insert(target_type, ms) },
                none => {},
            }
            for m in methods {
                match m {
                    Decl::Fn { name: mname, .. } => {
                        let full_name = "${target_type}_${mname}"
                        match fn_mut_params_map.get(full_name) {
                            some(flags) => { fn_mut_params.insert(full_name, flags) },
                            none => {},
                        }
                    },
                    _ => {},
                }
            }
            // Inherent methods — only at top level (mod-block nested impls
            // don't do the pub-type scan, preserving existing behaviour)
            if is_top_level {
                match trait_name {
                    none => {
                        let mut is_pub_type = false
                        for d in program.decls {
                            match d {
                                Decl::Struct { name, is_pub, .. } => {
                                    if name == export_display_name(target_type) && is_pub { is_pub_type = true }
                                },
                                Decl::Enum { name, is_pub, .. } => {
                                    if name == export_display_name(target_type) && is_pub { is_pub_type = true }
                                },
                                _ => {},
                            }
                        }
                        if is_pub_type {
                            let mut method_names: List<Str> = []
                            for m in methods {
                                match m {
                                    Decl::Fn { name, .. } => method_names.push(name),
                                    _ => {},
                                }
                            }
                            match inherent_methods.get(target_type) {
                                some(existing) => existing.extend(method_names),
                                none => { inherent_methods.insert(target_type, method_names) },
                            }
                        }
                    },
                    some(_) => {},
                }
            }
        },
        Decl::ExternFn { name, is_pub, .. } => {
            if is_pub {
                let display = export_display_name(name)
                extern_values.insert(display)
                match env.lookup(name) {
                    some(scheme) => {
                        values.insert(display, scheme)
                        value_origins.insert(display, name)
                    },
                    none => {},
                }
            }
        },
        Decl::ExternType { name, is_pub, .. } => {
            if is_pub {
                let display = export_display_name(name)
                match env.types.structs.get(name) {
                    some(sdef) => { types.insert(display, TypeDef::StructDef_(sdef)) },
                    none => {},
                }
            }
        },
        Decl::Const { name, is_pub, .. } => {
            if is_pub {
                let display = export_display_name(name)
                match env.lookup(name) {
                    some(scheme) => {
                        values.insert(display, scheme)
                        value_origins.insert(display, name)
                    },
                    none => {},
                }
            }
        },
        Decl::ModBlock { name: mod_name, uses: mod_uses, decls: mod_decls, is_pub: mpub, .. } => {
            if mpub {
                for subdecl in mod_decls {
                    let prefixed = prefix_decl_name(mod_name, subdecl)
                    extract_decl_export(prefixed, env, fn_mut_params_map, program,
                        values, value_origins, types, effects, effect_aliases, traits,
                        impl_methods, inherent_methods, struct_field_orders,
                        extern_values, mut_methods, fn_mut_params, false)
                }
                let facade = export_display_name(mod_name)
                for use_decl in mod_uses {
                    if !use_decl.is_pub { continue }
                    match inline_use_source_prefix(mod_name, use_decl) {
                        some(source_prefix) => match use_decl.imports {
                            UseImport::NamedItems { names } => {
                                for item in names {
                                    let local_name = match item.alias { some(a) => a, none => item.name }
                                    copy_inline_export(append_identity(source_prefix, item.name), "${facade}::${local_name}",
                                        env, fn_mut_params_map, values, value_origins, types, effects, effect_aliases, traits,
                                        impl_methods, inherent_methods, struct_field_orders, mut_methods, fn_mut_params)
                                }
                            },
                            UseImport::Module => {
                                let path = use_decl.path.segments
                                let item_name = path.get(path.len() - 1).unwrap_or("")
                                copy_inline_export(append_identity(source_prefix, item_name), "${facade}::${item_name}",
                                    env, fn_mut_params_map, values, value_origins, types, effects, effect_aliases, traits,
                                    impl_methods, inherent_methods, struct_field_orders, mut_methods, fn_mut_params)
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
    source: ModuleExports, source_name: Str, local_name: Str,
    mut values: Map<Str, TypeScheme>, mut value_origins: Map<Str, Str>,
    mut types: Map<Str, TypeDef>, mut effects: Map<Str, EffectDef>,
    mut effect_aliases: Map<Str, EffectAliasDef>, mut traits: Map<Str, TraitDef>,
    mut struct_field_orders: Map<Str, List<Str>>, mut extern_values: Set<Str>,
    mut fn_mut_params: Map<Str, List<Bool>>,
    mut impl_methods: Map<Str, Map<Str, TypeScheme>>,
    mut inherent_methods: Map<Str, List<Str>>, mut mut_methods: Map<Str, Set<Str>>
) {
    match source.values.get(source_name) {
        some(scheme) => {
            values.insert(local_name, scheme)
            match source.value_origins.get(source_name) {
                some(origin) => { value_origins.insert(local_name, origin) },
                none => {}
            }
        },
        none => {}
    }
    match source.types.get(source_name) {
        some(def) => {
            types.insert(local_name, def)
            let canonical_type = match def {
                TypeDef::StructDef_(sdef) => sdef.name,
                TypeDef::EnumDef_(edef) => edef.name
            }
            match source.impl_methods.get(canonical_type) {
                some(methods) => { impl_methods.insert(canonical_type, map_clone(methods)) }, none => {}
            }
            match source.inherent_methods.get(canonical_type) {
                some(methods) => { inherent_methods.insert(canonical_type, list_clone(methods)) }, none => {}
            }
            match source.mut_methods.get(canonical_type) {
                some(methods) => { mut_methods.insert(canonical_type, methods) }, none => {}
            }
        },
        none => {}
    }
    match source.effects.get(source_name) {
        some(def) => { effects.insert(local_name, def) }, none => {}
    }
    match source.effect_aliases.get(source_name) {
        some(def) => { effect_aliases.insert(local_name, def) }, none => {}
    }
    match source.traits.get(source_name) {
        some(def) => { traits.insert(local_name, def) }, none => {}
    }
    match source.struct_field_orders.get(source_name) {
        some(fields) => { struct_field_orders.insert(local_name, fields) }, none => {}
    }
    if source.extern_values.contains(source_name) { extern_values.insert(local_name) }
    match source.fn_mut_params.get(source_name) {
        some(flags) => { fn_mut_params.insert(local_name, flags) }, none => {}
    }
}

pub fn extract_exports(
    module_key: Str,
    module_prefix: Str,
    program: Program,
    hprogram: HProgram,
    env: TypeEnv,
    fn_mut_params_map: Map<Str, List<Bool>>,
    available_modules: List<ModuleExports>
) -> ModuleExports {
    let mut values: Map<Str, TypeScheme> = map_new()
    let mut value_origins: Map<Str, Str> = map_new()
    let mut types: Map<Str, TypeDef> = map_new()
    let mut effects: Map<Str, EffectDef> = map_new()
    let mut effect_aliases: Map<Str, EffectAliasDef> = map_new()
    let mut traits: Map<Str, TraitDef> = map_new()
    let mut impl_methods: Map<Str, Map<Str, TypeScheme>> = map_new()
    let mut inherent_methods: Map<Str, List<Str>> = map_new()
    let mut struct_field_orders: Map<Str, List<Str>> = map_new()
    let mut extern_values: Set<Str> = set_new()
    let mut mut_methods: Map<Str, Set<Str>> = map_new()
    let mut fn_mut_params: Map<Str, List<Bool>> = map_new()
    for decl in program.decls {
        let canonical_decl = module_prefix_decl_name(module_prefix, decl)
        extract_decl_export(canonical_decl, env, fn_mut_params_map, program,
            values, value_origins, types, effects, effect_aliases, traits,
            impl_methods, inherent_methods, struct_field_orders,
            extern_values, mut_methods, fn_mut_params, true)
    }

    // Handle pub use re-exports from the dependency export objects themselves.
    // Payloads and origins are forwarded verbatim; only the facade lookup key
    // changes.  This covers named, aliased, whole-module, and transitive uses.
    let mut module_map: Map<Str, ModuleExports> = map_new()
    for mod_ in available_modules { module_map.insert(mod_.module_key, mod_) }
    for use_decl in program.uses {
        if use_decl.is_pub {
            let mod_key = use_decl.path.segments.join("::")
            match module_map.get(mod_key) {
                some(source) => match use_decl.imports {
                    UseImport::NamedItems { names } => {
                        for item in names {
                            let local_name = match item.alias { some(a) => a, none => item.name }
                            copy_exported_name(source, item.name, local_name,
                                values, value_origins, types, effects, effect_aliases, traits,
                                struct_field_orders, extern_values, fn_mut_params,
                                impl_methods, inherent_methods, mut_methods)
                            // Importing an enum also imports its constructors.
                            match source.types.get(item.name) {
                                some(TypeDef::EnumDef_(edef)) => {
                                    for v in edef.variants {
                                        copy_exported_name(source, v.name, v.name,
                                            values, value_origins, types, effects, effect_aliases, traits,
                                            struct_field_orders, extern_values, fn_mut_params,
                                            impl_methods, inherent_methods, mut_methods)
                                    }
                                },
                                _ => {}
                            }
                        }
                    },
                    UseImport::Module => {
                        let mut names: Set<Str> = set_new()
                        for entry in source.values.entries() { let (name, _) = entry; names.insert(name) }
                        for entry in source.types.entries() { let (name, _) = entry; names.insert(name) }
                        for entry in source.effects.entries() { let (name, _) = entry; names.insert(name) }
                        for entry in source.effect_aliases.entries() { let (name, _) = entry; names.insert(name) }
                        for entry in source.traits.entries() { let (name, _) = entry; names.insert(name) }
                        let mut sorted_names = names.to_list()
                        sorted_names.sort()
                        for name in sorted_names {
                            copy_exported_name(source, name, name,
                                values, value_origins, types, effects, effect_aliases, traits,
                                struct_field_orders, extern_values, fn_mut_params,
                                impl_methods, inherent_methods, mut_methods)
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
                trait_impls.push(impl_)
            }
        }
    }

    ModuleExports {
        module_key: module_key,
        module_prefix: module_prefix,
        values: values,
        value_origins: value_origins,
        types: types,
        effects: effects,
        effect_aliases: effect_aliases,
        traits: traits,
        trait_impls: trait_impls,
        impl_methods: impl_methods,
        inherent_methods: inherent_methods,
        struct_field_orders: struct_field_orders,
        extern_values: extern_values,
        mut_methods: mut_methods,
        fn_mut_params: fn_mut_params
    }
}

