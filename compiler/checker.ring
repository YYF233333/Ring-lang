use types::{Type, UNIT}
use ast::{Program, UseDecl, UseImport, NamedImport}
use hir::{HProgram}
use diagnostics::{Severity, DiagnosticContext, CollectingSink, Diagnostic, new_collecting_sink, make_diag}
use env::{TypeEnv, TypeScheme, StructDef, EnumDef, EffectDef, TraitDef, ImplEntry, new_type_env}
use builtins::{register_builtins, register_hof_intrinsics}
use infer::{check as infer_check}
use infer_ctx::{InferCtx}
use infer_register::{register_decl_public}
use exports::{ModuleExports, TypeDef}
use codes::{E0702, E0703}
use parser::{parse}
use unify::{empty_subst}

pub struct CheckResult {
    pub program: HProgram,
    pub env: TypeEnv
}

fn STD_FILES() -> List<Str> {
    ["io.ring", "list.ring", "map.ring", "set.ring", "str.ring", "num.ring", "fs.ring", "path.ring", "process.ring"]
}

fn find_std_dir() -> Str? {
    let candidates = [
        path_resolve(path_join(path_dirname(path_resolve(".")), "std")),
        path_resolve("std")
    ]
    for dir in candidates {
        if file_exists(dir) { return some(dir) }
    }
    none
}

fn load_prelude(var ctx: InferCtx) {
    match find_std_dir() {
        some(std_dir) => {
            for file in STD_FILES() {
                let file_path = path_join(std_dir, file)
                if file_exists(file_path) {
                    let source = read_file(file_path)
                    let prelude_sink = new_collecting_sink()
                    let ast = parse(source, file_path, prelude_sink)
                    for decl in ast.decls {
                        register_decl_public(ctx, decl)
                    }
                }
            }
        },
        none => {},
    }
}

fn new_infer_ctx(sink: CollectingSink) -> InferCtx {
    var env = new_type_env()
    register_builtins(env)
    register_hof_intrinsics(env)

    InferCtx {
        env: env,
        subst: empty_subst(),
        sink: sink,
        type_param_scope: map_new(),
        current_fn_return_type: none,
        current_fn_bounds: [],
        fn_bounds_stack: [],
        loop_depth: 0
    }
}

pub fn check(program: Program, sink: CollectingSink) -> CheckResult {
    var ctx = new_infer_ctx(sink)
    load_prelude(ctx)
    let hprogram = infer_check(ctx, program)
    CheckResult { program: hprogram, env: ctx.env }
}

pub fn check_module(program: Program, module_exports: List<ModuleExports>, sink: CollectingSink) -> CheckResult {
    var ctx = new_infer_ctx(sink)
    load_prelude(ctx)
    inject_module_exports(ctx, module_exports)
    resolve_uses(ctx, program.uses, module_exports)
    let hprogram = infer_check(ctx, program)
    CheckResult { program: hprogram, env: ctx.env }
}

fn inject_module_exports(var ctx: InferCtx, exports: List<ModuleExports>) {
    for mod_ in exports {
        for entry in mod_.types.entries() {
            let (name, def) = entry
            match def {
                TypeDef::StructDef_(sdef) => {
                    ctx.env.structs.insert(name, sdef)
                },
                TypeDef::EnumDef_(edef) => {
                    ctx.env.enums.insert(name, edef)
                    for v in edef.variants {
                        ctx.env.variant_to_enum.insert(v.name, name)
                    }
                },
            }
        }
        for entry in mod_.effects.entries() {
            let (name, effdef) = entry
            ctx.env.effects.insert(name, effdef)
        }
        for entry in mod_.traits.entries() {
            let (name, tdef) = entry
            ctx.env.traits.insert(name, tdef)
        }
        for impl_ in mod_.trait_impls {
            ctx.env.trait_impls.push(impl_)
        }
        for entry in mod_.impl_methods.entries() {
            let (type_name, methods) = entry
            match ctx.env.impl_methods.get(type_name) {
                some(existing) => {
                    for mentry in methods.entries() {
                        let (method_name, scheme) = mentry
                        existing.insert(method_name, scheme)
                    }
                },
                none => {
                    ctx.env.impl_methods.insert(type_name, map_clone(methods))
                },
            }
        }
    }
}

fn resolve_uses(var ctx: InferCtx, uses: List<UseDecl>, available_modules: List<ModuleExports>) {
    var module_map: Map<Str, ModuleExports> = map_new()
    for mod_ in available_modules {
        module_map.insert(mod_.module_key, mod_)
    }

    for use_decl in uses {
        let mod_key = use_decl.path.segments.join("::")
        match module_map.get(mod_key) {
            none => {
                let d = make_diag(
                    E0702(), Severity::SevError,
                    "Module '${mod_key}' not found",
                    use_decl.path.span,
                    DiagnosticContext::OtherContext { detail: some("module not found") }
                )
                ctx.sink.report(d)
            },
            some(mod_) => {
                match use_decl.imports {
                    UseImport::NamedItems { names } => {
                        for item in names {
                            let local_name = match item.alias {
                                some(a) => a,
                                none => item.name,
                            }
                            var found = false

                            match mod_.values.get(item.name) {
                                some(scheme) => {
                                    ctx.env.bind(local_name, scheme)
                                    found = true
                                },
                                none => {},
                            }

                            match mod_.types.get(item.name) {
                                some(tdef) => {
                                    found = true
                                    match tdef {
                                        TypeDef::EnumDef_(edef) => {
                                            for v in edef.variants {
                                                match mod_.values.get(v.name) {
                                                    some(vscheme) => { ctx.env.bind(v.name, vscheme) },
                                                    none => {},
                                                }
                                            }
                                        },
                                        _ => {},
                                    }
                                },
                                none => {},
                            }

                            if mod_.effects.contains_key(item.name) { found = true }
                            if mod_.traits.contains_key(item.name) { found = true }

                            if found == false {
                                let d = make_diag(
                                    E0703(), Severity::SevError,
                                    "Symbol '${item.name}' not found in module '${mod_key}'",
                                    item.span,
                                    DiagnosticContext::OtherContext { detail: some("symbol not found") }
                                )
                                ctx.sink.report(d)
                            }
                        }
                    },
                    UseImport::Module => {
                        for entry in mod_.values.entries() {
                            let (name, scheme) = entry
                            ctx.env.bind(name, scheme)
                        }
                        for entry in mod_.types.entries() {
                            let (_, tdef) = entry
                            match tdef {
                                TypeDef::EnumDef_(edef) => {
                                    for v in edef.variants {
                                        match mod_.values.get(v.name) {
                                            some(vscheme) => { ctx.env.bind(v.name, vscheme) },
                                            none => {},
                                        }
                                    }
                                },
                                _ => {},
                            }
                        }
                    },
                }
            },
        }
    }
}
