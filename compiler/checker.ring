use types::{Type, UNIT}
use ast::{Program, Decl, UseDecl, UseImport, NamedImport, Span, TypeParam}
use hir::{HDecl, HProgram}
use diagnostics::{Severity, DiagnosticContext, CollectingSink, Diagnostic, new_collecting_sink, make_diag}
use env::{TypeEnv, TypeScheme, StructDef, EnumDef, EffectDef, TraitDef, ImplEntry, new_type_env, add_impl}
use builtins::{register_builtins, register_hof_intrinsics}
use infer_decl::{check as infer_check, check_prelude_decl}
use dict_lower::{lower_dicts}
use andor_lower::{lower_andor}
use infer_ctx::{InferCtx}
use infer_register::{register_decl_public}
use exports::{ModuleExports, TypeDef}
use codes::{E0702, E0703, E0705, E0707}
use parser::{parse}
use union_find::{UnionFind}
use unify::{empty_subst}

pub struct CheckResult {
    pub program: HProgram,
    pub env: TypeEnv,
    pub fn_mut_params: Map<Str, List<Bool>>
}

const STD_FILES: List<Str> =
    ["io.ring", "iterator.ring", "list.ring", "map.ring", "set.ring", "str.ring", "num.ring", "result.ring", "fs.ring", "path.ring", "process.ring"]

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

fn load_prelude(mut ctx: InferCtx) -> List<HDecl> {
    let mut prelude_hdecls: List<HDecl> = []
    match find_std_dir() {
        some(std_dir) => {
            // Phase 1: collect and register all prelude declarations
            let mut all_prelude_decls: List<Decl> = []
            for file in (STD_FILES) {
                let file_path = path_join(std_dir, file)
                if file_exists(file_path) {
                    let source = read_file(file_path)
                    let prelude_sink = new_collecting_sink()
                    let ast = parse(source, file_path, prelude_sink)
                    for decl in ast.decls {
                        register_decl_public(ctx, decl)
                        all_prelude_decls.push(decl)
                    }
                }
            }
            // Phase 2: compile struct/enum/trait declarations, non-extern impl methods, and top-level functions
            for decl in all_prelude_decls {
                match decl {
                    Decl::Struct { .. } => {
                        let result = some(check_prelude_decl(ctx, decl)) catch { _ => none }
                        match result {
                            some(hd) => { prelude_hdecls.push(hd) },
                            none => {}
                        }
                    },
                    Decl::Enum { .. } => {
                        let result = some(check_prelude_decl(ctx, decl)) catch { _ => none }
                        match result {
                            some(hd) => { prelude_hdecls.push(hd) },
                            none => {}
                        }
                    },
                    Decl::Trait { .. } => {
                        let result = some(check_prelude_decl(ctx, decl)) catch { _ => none }
                        match result {
                            some(hd) => { prelude_hdecls.push(hd) },
                            none => {}
                        }
                    },
                    Decl::Impl { target_type, type_params, trait_name, methods, span } => {
                        // Filter to only Fn methods — ExternFn methods are already handled
                        // by the runtime and cannot be looked up via check_extern_fn_decl
                        // because they're registered in impl_methods_map, not the main scope.
                        let mut fn_methods: List<Decl> = []
                        for m in methods {
                            match m { Decl::Fn { .. } => { fn_methods.push(m) }, _ => {} }
                        }
                        if fn_methods.len() > 0 {
                            let filtered_decl = Decl::Impl {
                                target_type: target_type,
                                type_params: type_params,
                                trait_name: trait_name,
                                methods: fn_methods,
                                span: span
                            }
                            let result = some(check_prelude_decl(ctx, filtered_decl)) catch { _ => none }
                            match result {
                                some(hd) => { prelude_hdecls.push(hd) },
                                none => {}
                            }
                        }
                    },
                    Decl::Fn { .. } => {
                        let result = some(check_prelude_decl(ctx, decl)) catch { _ => none }
                        match result {
                            some(hd) => { prelude_hdecls.push(hd) },
                            none => {}
                        }
                    },
                    _ => {}
                }
            }
        },
        none => {},
    }
    prelude_hdecls
}

fn new_infer_ctx(sink: CollectingSink) -> InferCtx {
    let mut env = new_type_env()
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
        loop_depth: 0,
        mod_path_stack: [],
        use_aliases: map_new(),
        boxed_vars: set_new(),
        lambda_depth: 0,
        var_lambda_depth: map_new(),
        fn_mut_params: map_new(),
        effect_default_deps: map_new(),
        qualified_assoc_scope: map_new(),
        fn_defaults: map_new(),
        fn_min_arity: map_new()
    }
}

pub fn check(program: Program, sink: CollectingSink) -> CheckResult {
    let mut ctx = new_infer_ctx(sink)
    let prelude_hdecls = load_prelude(ctx)
    let hprogram = infer_check(ctx, program)
    // Prepend prelude hdecls to the program's decls
    let mut all_decls = list_clone(prelude_hdecls)
    for d in hprogram.decls { all_decls.push(d) }
    // B-104 D7: lower `&&`/`||` to if-else (andor_lower), then B-104 D4:
    // first-class the dict evidence (static singleton set + local
    // constructions for dynamic wrapped dicts) — both before perceus/codegen.
    let assembled = HProgram { decls: all_decls, derived_impls: hprogram.derived_impls, boxed_vars: hprogram.boxed_vars, static_dicts: [], extern_type_names: hprogram.extern_type_names }
    CheckResult {
        program: lower_dicts(lower_andor(assembled)),
        env: ctx.env,
        fn_mut_params: ctx.fn_mut_params
    }
}

pub fn check_module(program: Program, module_exports: List<ModuleExports>, sink: CollectingSink) -> CheckResult {
    let mut ctx = new_infer_ctx(sink)
    let prelude_hdecls = load_prelude(ctx)
    inject_module_exports(ctx, module_exports)
    resolve_uses(ctx, program.uses, module_exports)
    let hprogram = infer_check(ctx, program)
    // Prepend prelude hdecls to the program's decls
    let mut all_decls = list_clone(prelude_hdecls)
    for d in hprogram.decls { all_decls.push(d) }
    // B-104 D7 + D4: see check() above.
    let assembled = HProgram { decls: all_decls, derived_impls: hprogram.derived_impls, boxed_vars: hprogram.boxed_vars, static_dicts: [], extern_type_names: hprogram.extern_type_names }
    CheckResult {
        program: lower_dicts(lower_andor(assembled)),
        env: ctx.env,
        fn_mut_params: ctx.fn_mut_params
    }
}

fn inject_module_exports(mut ctx: InferCtx, exports: List<ModuleExports>) {
    for mod_ in exports {
        let mut sorted_types = mod_.types.entries()
        sorted_types.sort_by(fn(a, b) { if a.0 < b.0 { -1 } else if a.0 > b.0 { 1 } else { 0 } })
        for entry in sorted_types {
            let (name, def) = entry
            match def {
                TypeDef::StructDef_(sdef) => {
                    ctx.env.types.structs.insert(name, sdef)
                },
                TypeDef::EnumDef_(edef) => {
                    ctx.env.types.enums.insert(name, edef)
                    for v in edef.variants {
                        ctx.env.types.variant_to_enum.insert(v.name, name)
                    }
                },
            }
        }
        let mut sorted_effects = mod_.effects.entries()
        sorted_effects.sort_by(fn(a, b) { if a.0 < b.0 { -1 } else if a.0 > b.0 { 1 } else { 0 } })
        for entry in sorted_effects {
            let (name, effdef) = entry
            ctx.env.types.effects.insert(name, effdef)
        }
        let mut sorted_aliases = mod_.effect_aliases.entries()
        sorted_aliases.sort_by(fn(a, b) { if a.0 < b.0 { -1 } else if a.0 > b.0 { 1 } else { 0 } })
        for entry in sorted_aliases {
            let (name, adef) = entry
            ctx.env.types.effect_aliases.insert(name, adef)
        }
        let mut sorted_traits = mod_.traits.entries()
        sorted_traits.sort_by(fn(a, b) { if a.0 < b.0 { -1 } else if a.0 > b.0 { 1 } else { 0 } })
        for entry in sorted_traits {
            let (name, tdef) = entry
            ctx.env.trait_reg.traits.insert(name, tdef)
        }
        for impl_ in mod_.trait_impls {
            add_impl(ctx.env.trait_reg, impl_)
        }
        let mut sorted_impl_methods = mod_.impl_methods.entries()
        sorted_impl_methods.sort_by(fn(a, b) { if a.0 < b.0 { -1 } else if a.0 > b.0 { 1 } else { 0 } })
        for entry in sorted_impl_methods {
            let (type_name, methods) = entry
            match ctx.env.trait_reg.impl_methods.get(type_name) {
                some(existing) => {
                    let mut sorted_meths = methods.entries()
                    sorted_meths.sort_by(fn(a, b) { if a.0 < b.0 { -1 } else if a.0 > b.0 { 1 } else { 0 } })
                    for mentry in sorted_meths {
                        let (method_name, scheme) = mentry
                        existing.insert(method_name, scheme)
                    }
                },
                none => {
                    ctx.env.trait_reg.impl_methods.insert(type_name, map_clone(methods))
                },
            }
        }
        // Inject mut_methods
        let mut sorted_mut = mod_.mut_methods.entries()
        sorted_mut.sort_by(fn(a, b) { if a.0 < b.0 { -1 } else if a.0 > b.0 { 1 } else { 0 } })
        for entry in sorted_mut {
            let (type_name, method_set) = entry
            match ctx.env.trait_reg.mut_methods.get(type_name) {
                some(existing) => {
                    for m in method_set.to_list() {
                        existing.insert(m)
                    }
                },
                none => {
                    let mut new_set: Set<Str> = set_new()
                    for m in method_set.to_list() {
                        new_set.insert(m)
                    }
                    ctx.env.trait_reg.mut_methods.insert(type_name, new_set)
                },
            }
        }
        // Inject fn_mut_params
        let mut sorted_fmp = mod_.fn_mut_params.entries()
        sorted_fmp.sort_by(fn(a, b) { if a.0 < b.0 { -1 } else if a.0 > b.0 { 1 } else { 0 } })
        for entry in sorted_fmp {
            let (fn_name, flags) = entry
            ctx.fn_mut_params.insert(fn_name, flags)
        }
    }
}

fn resolve_uses(mut ctx: InferCtx, uses: List<UseDecl>, available_modules: List<ModuleExports>) {
    let mut module_map: Map<Str, ModuleExports> = map_new()
    for mod_ in available_modules {
        module_map.insert(mod_.module_key, mod_)
    }

    // Track which module each imported name came from, for ambiguity detection
    let mut import_origins: Map<Str, Str> = map_new()

    for use_decl in uses {
        // Reject relative paths (self::/super::) at file level
        let first_seg = use_decl.path.segments.get(0).unwrap_or("")
        if first_seg == "self" || first_seg == "super" {
            let d = make_diag(
                E0705, Severity::SevError,
                "Cannot use '${first_seg}::' at file level — relative paths are only supported inside mod blocks",
                use_decl.path.span,
                DiagnosticContext::OtherContext { detail: some("relative path out of scope") }
            )
            ctx.sink.report(d)
            continue
        }

        let mod_key = use_decl.path.segments.join("::")
        match module_map.get(mod_key) {
            none => {
                let d = make_diag(
                    E0702, Severity::SevError,
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
                            let mut found = false

                            // Check for ambiguous import before binding
                            match import_origins.get(local_name) {
                                some(prev_mod) => {
                                    if prev_mod != mod_key {
                                        let d = make_diag(
                                            E0707, Severity::SevError,
                                            "Ambiguous name '${local_name}': imported from both module '${prev_mod}' and module '${mod_key}'. Use qualified name (${prev_mod}::${local_name} / ${mod_key}::${local_name}) to disambiguate",
                                            item.span,
                                            DiagnosticContext::OtherContext { detail: some("ambiguous import") }
                                        )
                                        ctx.sink.report(d)
                                        continue
                                    }
                                },
                                none => {}
                            }

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
                            if mod_.effect_aliases.contains_key(item.name) { found = true }
                            if mod_.traits.contains_key(item.name) { found = true }

                            if found == false {
                                let d = make_diag(
                                    E0703, Severity::SevError,
                                    "Symbol '${item.name}' not found in module '${mod_key}'",
                                    item.span,
                                    DiagnosticContext::OtherContext { detail: some("symbol not found") }
                                )
                                ctx.sink.report(d)
                            } else {
                                import_origins.insert(local_name, mod_key)
                            }
                        }
                    },
                    UseImport::Module => {
                        let mut sorted_mod_values = mod_.values.entries()
                        sorted_mod_values.sort_by(fn(a, b) { if a.0 < b.0 { -1 } else if a.0 > b.0 { 1 } else { 0 } })
                        for entry in sorted_mod_values {
                            let (name, scheme) = entry
                            // Check for ambiguous wildcard import
                            match import_origins.get(name) {
                                some(prev_mod) => {
                                    if prev_mod != mod_key {
                                        let d = make_diag(
                                            E0707, Severity::SevError,
                                            "Ambiguous name '${name}': imported from both module '${prev_mod}' and module '${mod_key}'. Use qualified name to disambiguate",
                                            use_decl.path.span,
                                            DiagnosticContext::OtherContext { detail: some("ambiguous import") }
                                        )
                                        ctx.sink.report(d)
                                        continue
                                    }
                                },
                                none => {}
                            }
                            ctx.env.bind(name, scheme)
                            import_origins.insert(name, mod_key)
                        }
                        let mut sorted_mod_types = mod_.types.entries()
                        sorted_mod_types.sort_by(fn(a, b) { if a.0 < b.0 { -1 } else if a.0 > b.0 { 1 } else { 0 } })
                        for entry in sorted_mod_types {
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
