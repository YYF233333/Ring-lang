use ast::{Program}
use parser::{parse}
use diagnostics::{CollectingSink, new_collecting_sink}

// ============================================================
// Types
// ============================================================

pub struct ModuleId {
    pub path_segments: List<Str>,
    pub file_path: Str
}

pub struct ModuleGraph {
    pub entry: ModuleId,
    pub modules: Map<Str, ModuleId>,
    pub dependencies: Map<Str, List<Str>>,
    pub topo_order: List<Str>
}

pub struct GraphError {
    pub message: Str,
    pub cycle: List<Str>?
}

// ============================================================
// Utility functions
// ============================================================

pub fn module_key(segments: List<Str>) -> Str {
    segments.join("::")
}

pub fn module_prefix(segments: List<Str>) -> Str {
    segments.join("$")
}

pub fn resolve_module_file(use_path_segments: List<Str>, project_root: Str) -> Str? {
    let relative = path_join(use_path_segments.join("/"), ".ring")
    // Fix: join segments as path then add .ring
    var path_part = ""
    for i in 0..use_path_segments.len() {
        match use_path_segments.get(i) {
            some(seg) => {
                if i == 0 { path_part = seg }
                else { path_part = path_join(path_part, seg) }
            },
            none => {},
        }
    }
    let ring_file = "${path_part}.ring"
    let absolute = path_resolve(path_join(project_root, ring_file))
    if file_exists(absolute) { some(absolute) } else { none }
}

// ============================================================
// build_module_graph
// ============================================================

pub fn build_module_graph(entry_file: Str) -> ModuleGraph? {
    let abs_entry = path_resolve(entry_file)
    let project_root = path_dirname(abs_entry)

    let entry_basename = path_basename(abs_entry).replace(".ring", "")
    let entry_id = ModuleId {
        path_segments: [entry_basename],
        file_path: abs_entry
    }
    let entry_key = module_key(entry_id.path_segments)

    var modules: Map<Str, ModuleId> = map_new()
    var dependencies: Map<Str, List<Str>> = map_new()

    modules.insert(entry_key, entry_id)
    let empty_deps: List<Str> = [""]; empty_deps.clear()
    dependencies.insert(entry_key, empty_deps)

    var queue: List<Str> = [entry_key]

    while queue.len() > 0 {
        match queue.shift() {
            some(current_key) => {
                match modules.get(current_key) {
                    some(current_mod) => {
                        let source = read_file(current_mod.file_path)
                        let resolve_sink = new_collecting_sink()
                        let ast = parse(source, current_mod.file_path, resolve_sink)

                        var deps: List<Str> = [""]; deps.clear()
                        for use_decl in ast.uses {
                            let segments = use_decl.path.segments
                            let dep_key = module_key(segments)

                            if deps.contains(dep_key) { } else {
                                match resolve_module_file(segments, project_root) {
                                    some(resolved) => {
                                        let abs_resolved = path_resolve(resolved)
                                        match modules.get(dep_key) {
                                            none => {
                                                let dep_id = ModuleId {
                                                    path_segments: list_clone(segments),
                                                    file_path: abs_resolved
                                                }
                                                modules.insert(dep_key, dep_id)
                                                let empty: List<Str> = [""]; empty.clear()
                                                dependencies.insert(dep_key, empty)
                                                queue.push(dep_key)
                                            },
                                            some(_) => {},
                                        }
                                        deps.push(dep_key)
                                    },
                                    none => {
                                        // Module not found — return none
                                        return none
                                    },
                                }
                            }
                        }
                        dependencies.insert(current_key, deps)
                    },
                    none => {},
                }
            },
            none => {},
        }
    }

    // Topological sort (Kahn's algorithm)
    var dep_count: Map<Str, Int> = map_new()
    for entry in dependencies.entries() {
        let (key, deps) = entry
        dep_count.insert(key, deps.len())
    }

    var topo_order: List<Str> = [""]; topo_order.clear()
    var ready: List<Str> = [""]; ready.clear()

    for entry in dep_count.entries() {
        let (key, count) = entry
        if count == 0 { ready.push(key) }
    }

    while ready.len() > 0 {
        match ready.shift() {
            some(node) => {
                topo_order.push(node)
                for entry in dependencies.entries() {
                    let (key, deps) = entry
                    if deps.contains(node) {
                        match dep_count.get(key) {
                            some(c) => {
                                let new_count = c - 1
                                dep_count.insert(key, new_count)
                                if new_count == 0 { ready.push(key) }
                            },
                            none => {},
                        }
                    }
                }
            },
            none => {},
        }
    }

    if topo_order.len() != modules.len() {
        // Cycle detected
        return none
    }

    some(ModuleGraph {
        entry: ModuleId { path_segments: [entry_basename], file_path: abs_entry },
        modules: modules,
        dependencies: dependencies,
        topo_order: topo_order
    })
}
