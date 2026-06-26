use types::{Type}
use ast::{Program, UseDecl}
use hir::{HProgram}
use diagnostics::{CollectingSink, Diagnostic, new_collecting_sink}
use formatter::{format_human, format_llm}
use env::{TypeEnv}
use checker::{check_module}
use codegen_llvm::{generate_llvm, generate_llvm_project}
use resolver::{ModuleGraph, ModuleId, module_key, module_prefix,
    build_module_graph}
use exports::{ModuleExports, extract_exports}
use perceus::{perceus_transform, perceus_transform_mutated}
use verify_rc::{RcFinding, verify_rc_program, rc_fatal_count, format_rc_findings}

pub struct CompileProjectResult {
    pub js: Str,
    pub success: Bool
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

fn compile_phases(entry_file: Str, error_format: Str) -> CompilePhaseResult? {
    match build_module_graph(entry_file, error_format) {
        none => none,
        some(graph) => {
            let mut module_asts: Map<Str, Program> = map_new()
            let mut module_hirs: Map<Str, HProgram> = map_new()
            let mut module_exports_map: Map<Str, ModuleExports> = map_new()

            // Use cached ASTs from resolver (already parsed during graph construction)
            for key in graph.topo_order {
                match graph.asts.get(key) {
                    some(ast) => { module_asts.insert(key, ast) },
                    none => {},
                }
            }

            // Check all modules in topological order
            let mut check_ok = true
            // B-145: store each module's type env so the extern-type union below
            // can filter by StructDef.is_extern, avoiding bare-name collisions.
            let mut module_envs: Map<Str, TypeEnv> = map_new()
            for key in graph.topo_order {
                if check_ok {
                    match module_asts.get(key) {
                        some(ast) => {
                            let sink = new_collecting_sink()
                            let deps = match graph.dependencies.get(key) {
                                some(dk) => dk,
                                none => empty_str_list(),
                            }
                            let mut dep_exports: List<ModuleExports> = empty_module_exports_list()
                            for dk in deps {
                                match module_exports_map.get(dk) {
                                    some(e) => dep_exports.push(e),
                                    none => {},
                                }
                            }
                            let result = check_module(ast, dep_exports, sink)
                            if sink.has_errors() {
                                let mod_file = match graph.modules.get(key) { some(m) => m.file_path, none => "" }
                                if error_format == "llm" {
                                    eprintln(format_llm(sink.diagnostics(), mod_file))
                                } else {
                                    let src = read_file(mod_file)
                                    eprintln(format_human(sink.diagnostics(), src))
                                }
                                check_ok = false
                            } else {
                                // Surface check warnings (non-error diagnostics) without failing the build
                                if sink.items.len() > 0 {
                                    let mod_file = match graph.modules.get(key) { some(m) => m.file_path, none => "" }
                                    if error_format == "llm" {
                                        eprintln(format_llm(sink.diagnostics(), mod_file))
                                    } else {
                                        let src = read_file(mod_file)
                                        eprintln(format_human(sink.diagnostics(), src))
                                    }
                                }
                                module_hirs.insert(key, result.program)
                                module_envs.insert(key, result.env)
                                match graph.modules.get(key) {
                                    some(mod_) => {
                                        let prefix = module_prefix(mod_.path_segments)
                                        let exp = extract_exports(key, prefix, ast, result.program, result.env, result.fn_mut_params)
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

            // B-144 + B-145: compute per-module extern type names.
            // Step 1: collect the global union of all modules' extern type names
            // (same as B-144 — covers use-imported extern types).
            let mut global_externs: Set<Str> = set_new()
            for key in graph.topo_order {
                match module_hirs.get(key) {
                    some(hir) => {
                        for en in hir.extern_type_names { global_externs.insert(en) }
                    },
                    none => {},
                }
            }
            // Step 2: for each module, intersect global_externs with the module's
            // own type env — only include names where StructDef.is_extern is true.
            // This prevents bare-name collisions: if module B has `struct Foo`
            // (is_extern=false), "Foo" from the global set is excluded even if
            // module A declared `extern type Foo`.
            for key in graph.topo_order {
                match (module_hirs.get(key), module_envs.get(key)) {
                    (some(hir), some(env)) => {
                        let mut filtered: Set<Str> = set_new()
                        for en in global_externs {
                            match env.types.structs.get(en) {
                                some(sdef) => {
                                    if sdef.is_extern {
                                        filtered.insert(en)
                                    }
                                },
                                none => {
                                    // Name not in this module's type env at all —
                                    // the module never sees this type, safe to
                                    // include (won't match any StructType.name).
                                    filtered.insert(en)
                                },
                            }
                        }
                        module_hirs.insert(key, HProgram {
                            decls: hir.decls,
                            derived_impls: hir.derived_impls,
                            boxed_vars: hir.boxed_vars,
                            static_dicts: hir.static_dicts,
                            extern_type_names: filtered
                        })
                    },
                    _ => {},
                }
            }

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

pub fn compile_project(entry_file: Str, error_format: Str) -> CompileProjectResult {
    match compile_phases(entry_file, error_format) {
        none => CompileProjectResult { js: "", success: false },
        some(_) => CompileProjectResult { js: "", success: true },
    }
}

// ============================================================
// LLVM multi-file compilation mode
// All modules compiled into a single LLVM Module → single .o file
// ============================================================

pub struct LlvmCompileResult {
    pub success: Bool
}

pub fn compile_project_llvm(entry_file: Str, output_path: Str, error_format: Str) -> LlvmCompileResult {
    match compile_phases(entry_file, error_format) {
        none => LlvmCompileResult { success: false },
        some(phases) => {
            let entry_key = module_key(phases.graph.entry.path_segments)

            // Build list of (module_prefix, HProgram, uses) in topo order
            let mut modules: List<(Str, HProgram, List<UseDecl>)> = []
            let mut entry_prefix = ""

            for key in phases.graph.topo_order {
                match (phases.graph.modules.get(key), phases.module_hirs.get(key), phases.module_asts.get(key)) {
                    (some(mod_), some(hir), some(ast)) => {
                        let prefix = module_prefix(mod_.path_segments)
                        let rc_hir = perceus_transform(hir)
                        modules.push((prefix, rc_hir, ast.uses))
                        if key == entry_key {
                            entry_prefix = prefix
                        }
                    },
                    (some(mod_), some(hir), none) => {
                        let prefix = module_prefix(mod_.path_segments)
                        let rc_hir = perceus_transform(hir)
                        modules.push((prefix, rc_hir, []))
                        if key == entry_key {
                            entry_prefix = prefix
                        }
                    },
                    _ => {},
                }
            }

            generate_llvm_project(modules, entry_prefix, output_path)
            LlvmCompileResult { success: true }
        },
    }
}

// ============================================================
// B-104 D2: multi-file static RC verification
// Runs the same per-module perceus_transform as compile_project_llvm, then
// the verify_rc linear check on each module's post-RC HIR.
// ============================================================

pub struct RcProjectVerifyResult {
    pub success: Bool,
    pub fatal: Int,
    pub exempt: Int,
    pub report: Str
}

pub fn verify_project_rc(entry_file: Str, mutate: Str, strict: Bool, error_format: Str) -> RcProjectVerifyResult {
    match compile_phases(entry_file, error_format) {
        none => RcProjectVerifyResult { success: false, fatal: 0, exempt: 0, report: "" },
        some(phases) => {
            let mut all: List<RcFinding> = []
            for key in phases.graph.topo_order {
                match phases.module_hirs.get(key) {
                    some(hir) => {
                        let rc_hir = perceus_transform_mutated(hir, mutate)
                        for f in verify_rc_program(rc_hir) { all.push(f) }
                    },
                    none => {},
                }
            }
            let fatal = rc_fatal_count(all)
            RcProjectVerifyResult {
                success: true,
                fatal: fatal,
                exempt: all.len() - fatal,
                report: format_rc_findings(all, strict)
            }
        },
    }
}

fn empty_module_exports_list() -> List<ModuleExports> {
    let mut x: List<ModuleExports> = []
    x
}

fn empty_str_list() -> List<Str> {
    let mut x: List<Str> = []
    x
}
