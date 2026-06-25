use types::{Type}
use ast::{Program, Decl, UseImport, NamedImport}
use hir::{HProgram, HDecl}
use env::{TypeEnv, TypeScheme, StructDef, EnumDef, EffectDef, TraitDef, ImplEntry, EffectAliasDef}
use infer_register::{prefix_decl_name}

// ============================================================
// ModuleExports — the public interface of a compiled module
// ============================================================

pub struct ModuleExports {
    pub module_key: Str,
    pub module_prefix: Str,
    pub values: Map<Str, TypeScheme>,
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

// ============================================================
// extract_decl_export — recursive helper for extract_exports
// Handles a single declaration, inserting its public exports
// into the collector maps. For ModBlock decls, recurses to
// support arbitrary nesting depth.
// ============================================================

fn extract_decl_export(
    decl: Decl,
    env: TypeEnv,
    fn_mut_params_map: Map<Str, List<Bool>>,
    program: Program,
    mut values: Map<Str, TypeScheme>,
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
                match env.lookup(name) {
                    some(scheme) => { values.insert(name, scheme) },
                    none => {},
                }
                match fn_mut_params_map.get(name) {
                    some(flags) => { fn_mut_params.insert(name, flags) },
                    none => {},
                }
            }
        },
        Decl::Struct { name, is_pub, .. } => {
            if is_pub {
                match env.types.structs.get(name) {
                    some(sdef) => {
                        types.insert(name, TypeDef::StructDef_(sdef))
                        let mut field_names: List<Str> = []
                        for f in sdef.fields { field_names.push(f.name) }
                        struct_field_orders.insert(name, field_names)
                    },
                    none => {},
                }
            }
        },
        Decl::Enum { name, is_pub, .. } => {
            if is_pub {
                match env.types.enums.get(name) {
                    some(edef) => {
                        types.insert(name, TypeDef::EnumDef_(edef))
                        for v in edef.variants {
                            match env.lookup(v.name) {
                                some(vscheme) => { values.insert(v.name, vscheme) },
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
                match env.types.effects.get(name) {
                    some(effdef) => { effects.insert(name, effdef) },
                    none => {},
                }
            }
        },
        Decl::EffectAlias { name, is_pub, .. } => {
            if is_pub {
                match env.types.effect_aliases.get(name) {
                    some(adef) => { effect_aliases.insert(name, adef) },
                    none => {},
                }
            }
        },
        Decl::Trait { name, is_pub, .. } => {
            if is_pub {
                match env.trait_reg.traits.get(name) {
                    some(tdef) => { traits.insert(name, tdef) },
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
                                    if name == target_type && is_pub { is_pub_type = true }
                                },
                                Decl::Enum { name, is_pub, .. } => {
                                    if name == target_type && is_pub { is_pub_type = true }
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
                extern_values.insert(name)
                match env.lookup(name) {
                    some(scheme) => { values.insert(name, scheme) },
                    none => {},
                }
            }
        },
        Decl::ExternType { name, is_pub, .. } => {
            if is_pub {
                match env.types.structs.get(name) {
                    some(sdef) => { types.insert(name, TypeDef::StructDef_(sdef)) },
                    none => {},
                }
            }
        },
        Decl::Const { name, is_pub, .. } => {
            if is_pub {
                match env.lookup(name) {
                    some(scheme) => { values.insert(name, scheme) },
                    none => {},
                }
            }
        },
        Decl::ModBlock { name: mod_name, decls: mod_decls, is_pub: mpub, .. } => {
            if mpub {
                for subdecl in mod_decls {
                    let prefixed = prefix_decl_name(mod_name, subdecl)
                    extract_decl_export(prefixed, env, fn_mut_params_map, program,
                        values, types, effects, effect_aliases, traits,
                        impl_methods, inherent_methods, struct_field_orders,
                        extern_values, mut_methods, fn_mut_params, false)
                }
            }
        },
        _ => {},
    }
}

// ============================================================
// extract_exports
// ============================================================

pub fn extract_exports(
    module_key: Str,
    module_prefix: Str,
    program: Program,
    hprogram: HProgram,
    env: TypeEnv,
    fn_mut_params_map: Map<Str, List<Bool>>
) -> ModuleExports {
    let mut values: Map<Str, TypeScheme> = map_new()
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
        extract_decl_export(decl, env, fn_mut_params_map, program,
            values, types, effects, effect_aliases, traits,
            impl_methods, inherent_methods, struct_field_orders,
            extern_values, mut_methods, fn_mut_params, true)
    }

    // Filter trait impls
    let mut trait_impls: List<ImplEntry> = []
    let mut sorted_trait_impls = env.trait_reg.trait_impls.entries()
    sorted_trait_impls.sort_by(fn(a, b) { if a.0 < b.0 { -1 } else if a.0 > b.0 { 1 } else { 0 } })
    for map_entry in sorted_trait_impls {
        let (_, impl_list) = map_entry
        for impl_ in impl_list {
            if types.contains_key(impl_.target_type_name) || traits.contains_key(impl_.trait_name) {
                trait_impls.push(impl_)
            }
        }
    }

    // Handle pub use re-exports
    for use_decl in program.uses {
        if use_decl.is_pub {
            match use_decl.imports {
                UseImport::NamedItems { names } => {
                    for item in names {
                        let local_name = match item.alias {
                            some(a) => a,
                            none => item.name,
                        }
                        match env.lookup(local_name) {
                            some(scheme) => { values.insert(local_name, scheme) },
                            none => {},
                        }
                        match env.types.structs.get(local_name) {
                            some(sdef) => {
                                types.insert(local_name, TypeDef::StructDef_(sdef))
                                let mut fnames: List<Str> = []
                                for f in sdef.fields { fnames.push(f.name) }
                                struct_field_orders.insert(local_name, fnames)
                            },
                            none => {},
                        }
                        match env.types.enums.get(local_name) {
                            some(edef) => { types.insert(local_name, TypeDef::EnumDef_(edef)) },
                            none => {},
                        }
                        match env.types.effects.get(local_name) {
                            some(effdef) => { effects.insert(local_name, effdef) },
                            none => {},
                        }
                        match env.trait_reg.traits.get(local_name) {
                            some(tdef) => { traits.insert(local_name, tdef) },
                            none => {},
                        }
                    }
                },
                _ => {},
            }
        }
    }

    ModuleExports {
        module_key: module_key,
        module_prefix: module_prefix,
        values: values,
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

