use types::{Type}
use ast::{Program, Decl, UseImport, NamedImport}
use hir::{HProgram, HDecl}
use env::{TypeEnv, TypeScheme, StructDef, EnumDef, EffectDef, TraitDef, ImplEntry}

// ============================================================
// ModuleExports — the public interface of a compiled module
// ============================================================

pub struct ModuleExports {
    pub module_key: Str,
    pub module_prefix: Str,
    pub values: Map<Str, TypeScheme>,
    pub types: Map<Str, TypeDef>,
    pub effects: Map<Str, EffectDef>,
    pub traits: Map<Str, TraitDef>,
    pub trait_impls: List<ImplEntry>,
    pub impl_methods: Map<Str, Map<Str, TypeScheme>>,
    pub inherent_methods: Map<Str, List<Str>>,
    pub struct_field_orders: Map<Str, List<Str>>,
    pub extern_values: Set<Str>
}

pub enum TypeDef {
    StructDef_(StructDef),
    EnumDef_(EnumDef)
}

// ============================================================
// extract_exports
// ============================================================

pub fn extract_exports(
    module_key: Str,
    module_prefix: Str,
    program: Program,
    hprogram: HProgram,
    env: TypeEnv
) -> ModuleExports {
    var values: Map<Str, TypeScheme> = map_new()
    var types: Map<Str, TypeDef> = map_new()
    var effects: Map<Str, EffectDef> = map_new()
    var traits: Map<Str, TraitDef> = map_new()
    var impl_methods: Map<Str, Map<Str, TypeScheme>> = map_new()
    var inherent_methods: Map<Str, List<Str>> = map_new()
    var struct_field_orders: Map<Str, List<Str>> = map_new()
    var extern_values: Set<Str> = set_new()
    for decl in program.decls {
        match decl {
            Decl::Fn { name, is_pub, .. } => {
                if is_pub {
                    match env.lookup(name) {
                        some(scheme) => { values.insert(name, scheme) },
                        none => {},
                    }
                }
            },
            Decl::Struct { name, is_pub, .. } => {
                if is_pub {
                    match env.types.structs.get(name) {
                        some(sdef) => {
                            types.insert(name, TypeDef::StructDef_(sdef))
                            var field_names: List<Str> = [""]; field_names.clear()
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
                match trait_name {
                    none => {
                        // Inherent methods
                        var is_pub_type = false
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
                            var method_names: List<Str> = [""]; method_names.clear()
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
            _ => {},
        }
    }

    // Filter trait impls
    var trait_impls: List<ImplEntry> = []
    for impl_ in env.trait_reg.trait_impls {
        if types.contains_key(impl_.target_type_name) || traits.contains_key(impl_.trait_name) {
            trait_impls.push(impl_)
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
                                var fnames: List<Str> = [""]; fnames.clear()
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
        traits: traits,
        trait_impls: trait_impls,
        impl_methods: impl_methods,
        inherent_methods: inherent_methods,
        struct_field_orders: struct_field_orders,
        extern_values: extern_values
    }
}

