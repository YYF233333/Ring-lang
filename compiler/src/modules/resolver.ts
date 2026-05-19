// Ring-lang Module Resolver
// Discovers .ring files via `use` declarations, builds a dependency graph,
// and topologically sorts modules (leaves first, entry last).

import * as fs from "node:fs";
import * as path from "node:path";
import { Parser } from "../parser/parser.js";
import { CollectingSink } from "../diagnostics/index.js";

// ============================================================
// Types
// ============================================================

export interface ModuleId {
  path_segments: string[];  // e.g. ["checker", "env"]
  file_path: string;        // absolute file path
}

export interface ModuleGraph {
  entry: ModuleId;
  modules: Map<string, ModuleId>;       // "checker::env" → ModuleId
  dependencies: Map<string, string[]>;  // module key → dependency module keys
  topo_order: string[];                 // topological order (leaves first)
}

// ============================================================
// Utility functions
// ============================================================

/** Join path segments with "::" to form a module key. */
export function module_key(segments: string[]): string {
  return segments.join("::");
}

/** Join path segments with "$" to form a JS-safe prefix. */
export function module_prefix(segments: string[]): string {
  return segments.join("$");
}

/**
 * Resolve a `use` path to an absolute file path.
 * `use foo::bar` → `<project_root>/foo/bar.ring`
 * `use foo`      → `<project_root>/foo.ring`
 * Returns null if the file does not exist.
 */
export function resolve_module_file(
  use_path_segments: string[],
  project_root: string,
): string | null {
  const relative = path.join(...use_path_segments) + ".ring";
  const absolute = path.resolve(project_root, relative);
  if (fs.existsSync(absolute)) {
    return absolute;
  }
  return null;
}

// ============================================================
// build_module_graph
// ============================================================

/**
 * Build a complete module dependency graph starting from an entry file.
 *
 * Algorithm:
 * 1. BFS from entry file, parsing each .ring file to extract `use` declarations.
 * 2. Resolve each `use` path to a file. If not found → return error.
 * 3. After BFS completes, topologically sort with Kahn's algorithm.
 * 4. If topo sort doesn't include all modules → cycle detected.
 */
export function build_module_graph(
  entry_file: string,
): ModuleGraph | { error: string; cycle?: string[] } {
  const abs_entry = path.resolve(entry_file);
  const project_root = path.dirname(abs_entry);

  // Entry module: path_segments = [filename without .ring]
  const entry_basename = path.basename(abs_entry, ".ring");
  const entry_id: ModuleId = {
    path_segments: [entry_basename],
    file_path: abs_entry,
  };
  const entry_key = module_key(entry_id.path_segments);

  const modules = new Map<string, ModuleId>();
  const dependencies = new Map<string, string[]>();

  modules.set(entry_key, entry_id);
  dependencies.set(entry_key, []);

  // BFS queue of module keys to process
  const queue: string[] = [entry_key];

  while (queue.length > 0) {
    const current_key = queue.shift()!;
    const current_mod = modules.get(current_key)!;

    // Parse the file
    const source = fs.readFileSync(current_mod.file_path, "utf-8");
    const sink = new CollectingSink();
    const ast = Parser.parse(source, current_mod.file_path, sink);

    // Extract use declarations
    const deps: string[] = [];
    for (const use_decl of ast.uses) {
      const segments = use_decl.path.segments;
      const dep_key = module_key(segments);

      // Skip if already registered as a dependency of this module
      if (deps.includes(dep_key)) {
        continue;
      }

      // Resolve file
      const resolved = resolve_module_file(segments, project_root);
      if (resolved === null) {
        return {
          error: `Module not found: '${dep_key}' (referenced from '${current_key}')`,
        };
      }

      const abs_resolved = path.resolve(resolved);

      // Register module if new
      if (!modules.has(dep_key)) {
        const dep_id: ModuleId = {
          path_segments: [...segments],
          file_path: abs_resolved,
        };
        modules.set(dep_key, dep_id);
        dependencies.set(dep_key, []);
        queue.push(dep_key);
      }

      deps.push(dep_key);
    }

    dependencies.set(current_key, deps);
  }

  // Topological sort (Kahn's algorithm) — leaves first, entry last.
  // dep_count tracks how many unresolved dependencies each module has.
  // A module is "ready" when all its dependencies have been processed (count = 0).
  const dep_count = new Map<string, number>();
  for (const [key, deps] of dependencies) {
    dep_count.set(key, deps.length);
  }

  const topo_order: string[] = [];
  const ready: string[] = [];

  // Seed with modules that have zero dependencies (leaves)
  for (const [key, count] of dep_count) {
    if (count === 0) {
      ready.push(key);
    }
  }

  while (ready.length > 0) {
    const node = ready.shift()!;
    topo_order.push(node);

    // For each module that depends on `node`, decrement its dep_count
    for (const [key, deps] of dependencies) {
      if (deps.includes(node)) {
        const new_count = dep_count.get(key)! - 1;
        dep_count.set(key, new_count);
        if (new_count === 0) {
          ready.push(key);
        }
      }
    }
  }

  if (topo_order.length !== modules.size) {
    // Cycle detected — find the modules involved
    const in_cycle: string[] = [];
    for (const [key, count] of dep_count) {
      if (count > 0) {
        in_cycle.push(key);
      }
    }
    return {
      error: `Circular dependency detected among modules: ${in_cycle.join(", ")}`,
      cycle: in_cycle,
    };
  }

  return {
    entry: entry_id,
    modules,
    dependencies,
    topo_order,
  };
}
