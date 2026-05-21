use types::{Type}
use ast::{Program, Decl}
use hir::{HProgram, HDecl, trait_dict_name}
use diagnostics::{CollectingSink, Diagnostic, new_collecting_sink}
use env::{TypeEnv}
use checker::{CheckResult, check as check_single}
use codegen::{generate}
use codegen_ctx::{safe_ident}
use runtime::{RUNTIME_CODE, RUNTIME_EXPORT_NAMES, runtime_esm_code}
use resolver::{ModuleGraph, ModuleId, module_key, module_prefix,
    build_module_graph}
use exports::{ModuleExports, TypeDef, extract_exports}
use parser::{parse}

pub struct CompileProjectResult {
    pub js: Str,
    pub success: Bool
}

pub struct EsmCompileResult {
    pub success: Bool,
    pub entry_js_path: Str
}

// ============================================================
// Shared resolve → parse → check pipeline
// ============================================================

struct CompilePhaseResult {
    graph: ModuleGraph,
    module_asts: Map<Str, Program>,
    module_hirs: Map<Str, HProgram>,
    module_exports_map: Map<Str, ModuleExports>
}

fn compile_phases(entry_file: Str) -> CompilePhaseResult? {
    match build_module_graph(entry_file) {
        none => none,
        some(graph) => {
            var module_asts: Map<Str, Program> = map_new()
            var module_hirs: Map<Str, HProgram> = map_new()
            var module_exports_map: Map<Str, ModuleExports> = map_new()

            // Parse all modules
            var parse_ok = true
            for key in graph.topo_order {
                if parse_ok {
                    match graph.modules.get(key) {
                        some(mod_) => {
                            let source = read_file(mod_.file_path)
                            let ast = parse(source, mod_.file_path)
                            module_asts.insert(key, ast)
                        },
                        none => { parse_ok = false },
                    }
                }
            }
            if parse_ok == false { return none }

            // Check all modules in topological order
            var check_ok = true
            for key in graph.topo_order {
                if check_ok {
                    match module_asts.get(key) {
                        some(ast) => {
                            // For now, use single-file check (multi-module inject_module_exports needs Batch 5 completion)
                            let sink = new_collecting_sink()
                            let result = check_single(ast, sink)
                            if sink.has_errors() {
                                check_ok = false
                            } else {
                                module_hirs.insert(key, result.program)
                                match graph.modules.get(key) {
                                    some(mod_) => {
                                        let prefix = module_prefix(mod_.path_segments)
                                        let exp = extract_exports(key, prefix, ast, result.program, result.env)
                                        module_exports_map.insert(key, exp)
                                    },
                                    none => {},
                                }
                            }
                        },
                        none => { check_ok = false },
                    }
                }
            }
            if check_ok == false { return none }

            some(CompilePhaseResult {
                graph: graph,
                module_asts: module_asts,
                module_hirs: module_hirs,
                module_exports_map: module_exports_map
            })
        },
    }
}

// ============================================================
// Bundle mode
// ============================================================

pub fn compile_project(entry_file: Str) -> CompileProjectResult {
    match compile_phases(entry_file) {
        none => CompileProjectResult { js: "", success: false },
        some(phases) => {
            let entry_key = module_key(phases.graph.entry.path_segments)
            var js_parts: List<Str> = [""]; js_parts.clear()
            var is_first = true

            for key in phases.graph.topo_order {
                match (phases.graph.modules.get(key), phases.module_hirs.get(key)) {
                    (some(mod_), some(hir)) => {
                        let prefix = module_prefix(mod_.path_segments)
                        let imports_map = build_imports_map(phases.graph, phases.module_exports_map, key)
                        let esf = build_external_struct_fields(phases.graph, phases.module_exports_map, key)
                        let eim = build_external_impl_methods(phases.graph, phases.module_exports_map, key)
                        let skip_preamble = is_first == false
                        let skip_main = key != entry_key
                        let module_js = generate(hir, skip_preamble, skip_main,
                            some(prefix), some(imports_map), some(esf), some(eim), none, none)
                        js_parts.push("// === module: ${key} ===")
                        js_parts.push(module_js)
                        js_parts.push("")
                        is_first = false
                    },
                    _ => {},
                }
            }

            CompileProjectResult {
                js: js_parts.join("\n"),
                success: true
            }
        },
    }
}

// ============================================================
// ESM multi-file output mode
// ============================================================

pub fn compile_project_esm(entry_file: Str, out_dir: Str) -> EsmCompileResult {
    match compile_phases(entry_file) {
        none => EsmCompileResult { success: false, entry_js_path: "" },
        some(phases) => {
            let entry_key = module_key(phases.graph.entry.path_segments)
            // Write runtime
            let runtime_path = path_join(out_dir, "__ring_runtime.js")
            write_file(runtime_path, runtime_esm_code())

            var entry_js_path = ""

            for key in phases.graph.topo_order {
                match (phases.graph.modules.get(key), phases.module_hirs.get(key), phases.module_asts.get(key)) {
                    (some(mod_), some(hir), some(ast)) => {
                        let mod_relative = mod_.file_path.replace(".ring", ".js")
                        let mod_out_path = path_join(out_dir, path_basename(mod_relative))

                        // Build imports
                        let imports_map = build_imports_map(phases.graph, phases.module_exports_map, key)
                        let esf = build_external_struct_fields(phases.graph, phases.module_exports_map, key)
                        let eim = build_external_impl_methods(phases.graph, phases.module_exports_map, key)

                        // Build import lines
                        var import_lines: List<Str> = [""]; import_lines.clear()
                        let runtime_names = RUNTIME_EXPORT_NAMES()
                        let rnames_joined = runtime_names.join(", ")
                        import_lines.push("import { ${rnames_joined} } from \"./__ring_runtime.js\";")

                        // Build export names
                        var export_names: List<Str> = [""]; export_names.clear()
                        for decl in ast.decls {
                            match decl {
                                Decl::Fn { name, is_pub, .. } => { if is_pub { export_names.push(safe_ident(name)) } },
                                Decl::Struct { name, is_pub, .. } => { if is_pub { export_names.push(safe_ident(name)) } },
                                Decl::Enum { name, is_pub, variants, .. } => {
                                    if is_pub {
                                        for v in variants {
                                            let sn = safe_ident(name)
                                            export_names.push("${sn}_${v.name}")
                                        }
                                    }
                                },
                                _ => {},
                            }
                        }

                        let skip_main = key != entry_key
                        let module_js = generate(hir, true, skip_main,
                            none, some(imports_map), some(esf), some(eim),
                            some(import_lines), some(export_names))
                        write_file(mod_out_path, module_js)

                        if key == entry_key { entry_js_path = mod_out_path }
                    },
                    _ => {},
                }
            }

            EsmCompileResult {
                success: true,
                entry_js_path: entry_js_path
            }
        },
    }
}

// ============================================================
// Helper functions for cross-module metadata
// ============================================================

fn build_imports_map(graph: ModuleGraph, exports_map: Map<Str, ModuleExports>, key: Str) -> Map<Str, Str> {
    var imports_map: Map<Str, Str> = map_new()
    match graph.dependencies.get(key) {
        some(deps) => {
            for dk in deps {
                match exports_map.get(dk) {
                    some(dep_exports) => {
                        let dep_prefix = dep_exports.module_prefix
                        for entry in dep_exports.values.entries() {
                            let (name, _) = entry
                            if dep_exports.extern_values.contains(name) {
                                imports_map.insert(name, safe_ident(name))
                            } else {
                                let si = safe_ident(name)
                                imports_map.insert(name, "${dep_prefix}$${si}")
                            }
                        }
                        for entry in dep_exports.types.entries() {
                            let (name, type_def) = entry
                            let si = safe_ident(name)
                            imports_map.insert(name, "${dep_prefix}$${si}")
                            match type_def {
                                TypeDef::EnumDef_(edef) => {
                                    for v in edef.variants {
                                        let variant_js = "${dep_prefix}$${si}_${v.name}"
                                        imports_map.insert("${name}_${v.name}", variant_js)
                                    }
                                },
                                _ => {},
                            }
                        }
                        // Import trait dict names
                        for impl_ in dep_exports.trait_impls {
                            let dict_name = "${impl_.target_type_name}_${impl_.trait_name}"
                            let si_tn = safe_ident(impl_.target_type_name)
                            let si_tr = safe_ident(impl_.trait_name)
                            imports_map.insert(dict_name, "${dep_prefix}$${si_tn}_${si_tr}")
                        }
                    },
                    none => {},
                }
            }
        },
        none => {},
    }
    imports_map
}

fn build_external_struct_fields(graph: ModuleGraph, exports_map: Map<Str, ModuleExports>, key: Str) -> Map<Str, List<Str>> {
    var result: Map<Str, List<Str>> = map_new()
    match graph.dependencies.get(key) {
        some(deps) => {
            for dk in deps {
                match exports_map.get(dk) {
                    some(dep_exports) => {
                        let dep_prefix = dep_exports.module_prefix
                        for entry in dep_exports.struct_field_orders.entries() {
                            let (name, fields) = entry
                            let si = safe_ident(name)
                            result.insert("${dep_prefix}$${si}", fields)
                        }
                    },
                    none => {},
                }
            }
        },
        none => {},
    }
    result
}

fn build_external_impl_methods(graph: ModuleGraph, exports_map: Map<Str, ModuleExports>, key: Str) -> Map<Str, Str?> {
    var result: Map<Str, Str?> = map_new()
    match graph.dependencies.get(key) {
        some(deps) => {
            for dk in deps {
                match exports_map.get(dk) {
                    some(dep_exports) => {
                        let dep_prefix = dep_exports.module_prefix
                        for entry in dep_exports.impl_methods.entries() {
                            let (type_name, methods) = entry
                            let si = safe_ident(type_name)
                            for mentry in methods.entries() {
                                let (mname, _) = mentry
                                result.insert("${dep_prefix}$${si}.${mname}", none)
                            }
                        }
                    },
                    none => {},
                }
            }
        },
        none => {},
    }
    result
}
