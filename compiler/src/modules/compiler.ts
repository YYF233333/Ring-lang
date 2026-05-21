// Ring-lang Multi-file Compilation Orchestrator
// Resolves module graph → parses all → checks in topo order → codegen → bundle

import * as fs from "node:fs";
import * as path from "node:path";
import { Parser } from "../parser/parser.js";
import { check_module } from "../checker/checker.js";
import { generate, safe_ident, CodegenOptions } from "../codegen/codegen.js";
import { RUNTIME_EXPORT_NAMES, runtime_esm_code } from "../codegen/runtime.js";
import { CollectingSink, DiagnosticSink, Diagnostic, make_diagnostic } from "../diagnostics/index.js";
import { Program } from "../ast/index.js";
import { HProgram, trait_dict_name } from "../hir/index.js";
import { build_module_graph, module_key, module_prefix } from "./resolver.js";
import type { ModuleGraph } from "./resolver.js";
import { ModuleExports, extract_exports } from "./exports.js";
import { CompileError } from "../errors.js";
import { E } from "../diagnostics/codes.js";

export interface CompileProjectResult {
  js: string;
  diagnostics: Diagnostic[];
  success: boolean;
}

export interface EsmCompileResult {
  success: boolean;
  diagnostics: Diagnostic[];
  entry_js_path: string;
}

// ============================================================
// Shared resolve → parse → check pipeline
// ============================================================

interface CompilePhaseResult {
  graph: ModuleGraph;
  module_asts: Map<string, Program>;
  module_hirs: Map<string, HProgram>;
  module_exports_map: Map<string, ModuleExports>;
}

function compile_phases(
  entry_file: string,
  sink: DiagnosticSink,
): CompilePhaseResult | null {
  // Step 1: Build dependency graph
  const graph_result = build_module_graph(entry_file);
  if ("error" in graph_result) {
    const is_cycle = graph_result.error.includes("Circular");
    const code = is_cycle ? E.E0704 : E.E0702;
    sink.report(make_diagnostic(
      code, "error", graph_result.error,
      { file: entry_file, start: { line: 1, column: 0, offset: 0 }, end: { line: 1, column: 0, offset: 0 } },
      { kind: "other", detail: graph_result.error },
    ));
    return null;
  }

  const graph = graph_result;
  const module_asts = new Map<string, Program>();
  const module_hirs = new Map<string, HProgram>();
  const module_exports_map = new Map<string, ModuleExports>();

  // Step 2: Parse all modules
  for (const key of graph.topo_order) {
    const mod = graph.modules.get(key)!;
    const source = fs.readFileSync(mod.file_path, "utf-8");
    const mod_sink = new CollectingSink();
    try {
      const ast = Parser.parse(source, mod.file_path, mod_sink);
      for (const d of mod_sink.diagnostics()) {
        if (d.severity === "error") sink.report(d);
      }
      if (mod_sink.has_errors()) return null;
      module_asts.set(key, ast);
    } catch (e) {
      for (const d of mod_sink.diagnostics()) sink.report(d);
      if (mod_sink.diagnostics().length === 0) {
        console.error(`[ring] warning: module ${mod.path_segments.join("::")} failed unexpectedly: ${e instanceof Error ? e.message : e}`);
      }
      return null;
    }
  }

  // Step 3: Check all modules in topological order
  for (const key of graph.topo_order) {
    const ast = module_asts.get(key)!;
    const mod_sink = new CollectingSink();
    const deps = graph.dependencies.get(key) ?? [];
    const dep_exports: ModuleExports[] = deps
      .map(dk => module_exports_map.get(dk))
      .filter((e): e is ModuleExports => e !== undefined);

    try {
      const { program: hir, env } = check_module(ast, dep_exports, mod_sink);
      if ([...mod_sink.diagnostics()].some(d => d.severity === "error")) {
        for (const d of mod_sink.diagnostics()) sink.report(d);
        return null;
      }
      module_hirs.set(key, hir);
      const mod = graph.modules.get(key)!;
      const prefix = module_prefix(mod.path_segments);
      const exports = extract_exports(key, prefix, ast, hir, env);
      module_exports_map.set(key, exports);
    } catch (e) {
      for (const d of mod_sink.diagnostics()) sink.report(d);
      if (e instanceof CompileError) {
        for (const d of e.diagnostics) {
          if (![...sink.diagnostics()].includes(d)) sink.report(d);
        }
      }
      return null;
    }
  }

  return { graph, module_asts, module_hirs, module_exports_map };
}

// ============================================================
// Bundle mode (existing behavior)
// ============================================================

export function compile_project(entry_file: string, sink: DiagnosticSink): CompileProjectResult {
  const phases = compile_phases(entry_file, sink);
  if (!phases) {
    return { js: "", diagnostics: [...sink.diagnostics()], success: false };
  }

  const { graph, module_asts, module_hirs, module_exports_map } = phases;

  // Step 4: Generate JS bundle
  const entry_key = module_key(graph.entry.path_segments);
  const js_parts: string[] = [];
  let is_first = true;

  for (const key of graph.topo_order) {
    const mod = graph.modules.get(key)!;
    const hir = module_hirs.get(key)!;
    const prefix = module_prefix(mod.path_segments);

    // Build imports map: local name -> qualified JS name
    const imports_map = new Map<string, string>();
    const deps = graph.dependencies.get(key) ?? [];
    for (const dk of deps) {
      const dep_exports = module_exports_map.get(dk)!;
      const dep_prefix = dep_exports.module_prefix;
      // Collect bare enum variant names for this dep
      const bundle_bare_variants = new Set<string>();
      for (const [, type_def] of dep_exports.types) {
        if ("variants" in type_def) {
          for (const v of type_def.variants) {
            bundle_bare_variants.add(v.name);
          }
        }
      }
      // Import all exported values (functions, enum constructors)
      // Extern fn names map to their raw JS name (not module-prefixed)
      for (const [name] of dep_exports.values) {
        if (dep_exports.extern_values.has(name)) {
          imports_map.set(name, safe_ident(name));
        } else if (bundle_bare_variants.has(name) && imports_map.has(name)) {
          // Bare variant name already mapped — skip to prevent overwrite
        } else {
          imports_map.set(name, `${dep_prefix}$${safe_ident(name)}`);
        }
      }
      // Import all exported type constructors (struct classes, enum factory functions)
      for (const [name, type_def] of dep_exports.types) {
        imports_map.set(name, `${dep_prefix}$${safe_ident(name)}`);
        // For enums, also import variant constructors
        if ("variants" in type_def) {
          for (const v of type_def.variants) {
            const variant_js_name = `${dep_prefix}$${safe_ident(name)}_${v.name}`;
            imports_map.set(`${name}_${v.name}`, variant_js_name);
          }
        }
      }
    }

    // Import trait dictionary names (Type_Trait -> dep$Type_Trait)
    for (const dk of deps) {
      const dep_exports = module_exports_map.get(dk)!;
      const dep_prefix = dep_exports.module_prefix;
      for (const impl of dep_exports.trait_impls) {
        const dict_name = `${impl.target_type_name}_${impl.trait_name}`;
        imports_map.set(dict_name, `${dep_prefix}$${safe_ident(impl.target_type_name)}_${safe_ident(impl.trait_name)}`);
      }
    }

    // Add use-alias entries to imports_map (`use mod::{name as alias}`)
    const bundle_ast = module_asts.get(key)!;
    for (const use_decl of bundle_ast.uses) {
      if (use_decl.imports.kind === "named") {
        for (const { name, alias } of use_decl.imports.names) {
          if (alias) {
            const existing = imports_map.get(name);
            if (existing) imports_map.set(alias, existing);
          }
        }
      }
    }

    // Build external struct fields + impl methods for cross-module codegen
    const external_struct_fields = new Map<string, string[]>();
    const external_impl_methods = new Map<string, string | undefined>();
    for (const dk of deps) {
      const dep_exports = module_exports_map.get(dk)!;
      const dep_prefix = dep_exports.module_prefix;
      for (const [name, fields] of dep_exports.struct_field_orders) {
        external_struct_fields.set(`${dep_prefix}$${safe_ident(name)}`, fields);
      }
      for (const [type_name, methods] of dep_exports.impl_methods) {
        for (const [mname] of methods) {
          external_impl_methods.set(`${dep_prefix}$${safe_ident(type_name)}.${mname}`, undefined);
        }
      }
    }

    const options: CodegenOptions = {
      module_prefix: prefix,
      imports_map,
      skip_preamble: !is_first,
      skip_main_call: key !== entry_key,
      external_struct_fields,
      external_impl_methods,
    };

    const module_js = generate(hir, options);
    js_parts.push(`// === module: ${key} ===`);
    js_parts.push(module_js);

    // Emit re-export aliases for `pub use` declarations.
    // When module "facade" has `pub use inner::greet`, we emit:
    //   const facade$greet = inner$greet;
    // so consumers that import from "facade" can reference facade$greet.
    const ast = bundle_ast;
    for (const use_decl of ast.uses) {
      if (!use_decl.is_pub) continue;
      const src_key = use_decl.path.segments.join("::");
      const src_exports = module_exports_map.get(src_key);
      if (!src_exports) continue;
      const src_prefix = src_exports.module_prefix;

      if (use_decl.imports.kind === "named") {
        for (const { name, alias } of use_decl.imports.names) {
          const local_name = alias ?? name;
          const src_js = `${src_prefix}$${safe_ident(name)}`;
          const local_js = `${prefix}$${safe_ident(local_name)}`;
          // Only emit alias if the source is different from this module's name
          if (src_js !== local_js) {
            js_parts.push(`const ${local_js} = ${src_js};`);
          }
          // For enum types, also alias variant constructors
          const type_def = src_exports.types.get(name);
          if (type_def && "variants" in type_def) {
            for (const v of type_def.variants) {
              const src_variant_js = `${src_prefix}$${safe_ident(name)}_${v.name}`;
              const local_variant_js = `${prefix}$${safe_ident(local_name)}_${v.name}`;
              if (src_variant_js !== local_variant_js) {
                js_parts.push(`const ${local_variant_js} = ${src_variant_js};`);
              }
            }
          }
        }
      } else {
        // kind === "module": re-export all exported values
        for (const [name] of src_exports.values) {
          const src_js = `${src_prefix}$${safe_ident(name)}`;
          const local_js = `${prefix}$${safe_ident(name)}`;
          if (src_js !== local_js) {
            js_parts.push(`const ${local_js} = ${src_js};`);
          }
        }
        for (const [name, type_def] of src_exports.types) {
          const src_js = `${src_prefix}$${safe_ident(name)}`;
          const local_js = `${prefix}$${safe_ident(name)}`;
          if (src_js !== local_js) {
            js_parts.push(`const ${local_js} = ${src_js};`);
          }
          if ("variants" in type_def) {
            for (const v of type_def.variants) {
              const src_v_js = `${src_prefix}$${safe_ident(name)}_${v.name}`;
              const local_v_js = `${prefix}$${safe_ident(name)}_${v.name}`;
              if (src_v_js !== local_v_js) {
                js_parts.push(`const ${local_v_js} = ${src_v_js};`);
              }
            }
          }
        }
      }
    }

    js_parts.push("");
    is_first = false;
  }

  return {
    js: js_parts.join("\n"),
    diagnostics: [...sink.diagnostics()],
    success: true,
  };
}

// ============================================================
// ESM multi-file output mode
// ============================================================

export function compile_project_esm(
  entry_file: string,
  out_dir: string,
  sink: DiagnosticSink,
): EsmCompileResult {
  const phases = compile_phases(entry_file, sink);
  if (!phases) {
    return { success: false, diagnostics: [...sink.diagnostics()], entry_js_path: "" };
  }

  const { graph, module_asts, module_hirs, module_exports_map } = phases;
  const entry_key = module_key(graph.entry.path_segments);
  const project_root = path.dirname(path.resolve(entry_file));

  fs.mkdirSync(out_dir, { recursive: true });

  // Write __ring_runtime.js
  const runtime_path = path.join(out_dir, "__ring_runtime.js");
  fs.writeFileSync(runtime_path, runtime_esm_code(), "utf-8");

  let entry_js_path = "";

  for (const key of graph.topo_order) {
    const mod = graph.modules.get(key)!;
    const hir = module_hirs.get(key)!;
    const ast = module_asts.get(key)!;

    // Compute this module's output path
    const mod_relative = path.relative(project_root, mod.file_path).replace(/\.ring$/, ".js");
    const mod_out_path = path.join(out_dir, mod_relative);
    const mod_out_dir = path.dirname(mod_out_path);
    fs.mkdirSync(mod_out_dir, { recursive: true });

    // Compute relative path from this module to __ring_runtime.js
    const depth = path.relative(out_dir, mod_out_dir).split(path.sep).filter(Boolean).length;
    const runtime_rel = (depth === 0 ? "./" : "../".repeat(depth)) + "__ring_runtime.js";

    // Build runtime import
    const runtime_import = `import { ${RUNTIME_EXPORT_NAMES.join(", ")} } from "${runtime_rel}";`;

    // Build cross-module imports
    const imports_map = new Map<string, string>();
    const module_import_lines: string[] = [runtime_import];
    const deps = graph.dependencies.get(key) ?? [];

    for (const dk of deps) {
      const dep_exports = module_exports_map.get(dk)!;
      const dep_prefix = dep_exports.module_prefix;
      const dep_mod = graph.modules.get(dk)!;
      const dep_relative = path.relative(project_root, dep_mod.file_path).replace(/\.ring$/, ".js");
      const dep_js_from_mod = compute_relative_import(mod_relative, dep_relative);

      const import_pairs: string[] = [];

      // Collect bare enum variant names — these don't have JS declarations
      // (codegen uses EnumName_VariantName form, resolved via resolved_name in HIR)
      const bare_variant_names = new Set<string>();
      for (const [, type_def] of dep_exports.types) {
        if ("variants" in type_def) {
          for (const v of type_def.variants) {
            bare_variant_names.add(v.name);
          }
        }
      }

      for (const [name] of dep_exports.values) {
        if (dep_exports.extern_values.has(name)) {
          imports_map.set(name, safe_ident(name));
        } else if (bare_variant_names.has(name)) {
          // Bare enum variant: add to imports_map for resolution but don't import.
          // Skip if already mapped — prevents variant names (e.g. HDecl::Effect)
          // from overwriting enum type names (e.g. types::Effect).
          if (!imports_map.has(name)) {
            const alias = `${dep_prefix}$${safe_ident(name)}`;
            imports_map.set(name, alias);
          }
        } else {
          const alias = `${dep_prefix}$${safe_ident(name)}`;
          imports_map.set(name, alias);
          import_pairs.push(`${safe_ident(name)} as ${alias}`);
        }
      }

      for (const [name, type_def] of dep_exports.types) {
        const alias = `${dep_prefix}$${safe_ident(name)}`;
        imports_map.set(name, alias);
        if ("variants" in type_def) {
          // Enum: codegen doesn't produce a function for the enum name itself,
          // only variant constructors. Don't import the enum name.
          for (const v of type_def.variants) {
            const vname = `${name}_${v.name}`;
            const valias = `${dep_prefix}$${safe_ident(name)}_${v.name}`;
            imports_map.set(vname, valias);
            import_pairs.push(`${safe_ident(name)}_${v.name} as ${valias}`);
          }
        } else {
          // Struct: codegen produces a constructor function with the struct name
          import_pairs.push(`${safe_ident(name)} as ${alias}`);
        }
      }

      for (const impl of dep_exports.trait_impls) {
        const dict_js = trait_dict_name(safe_ident(impl.target_type_name), safe_ident(impl.trait_name));
        const alias = `${dep_prefix}$${dict_js}`;
        imports_map.set(dict_js, alias);
        import_pairs.push(`${dict_js} as ${alias}`);
      }

      // Import inherent (non-trait) impl methods
      for (const [type_name, method_names] of dep_exports.inherent_methods) {
        for (const mname of method_names) {
          const method_js = `${safe_ident(type_name)}_${mname}`;
          const alias = `${dep_prefix}$${method_js}`;
          import_pairs.push(`${method_js} as ${alias}`);
        }
      }

      if (import_pairs.length > 0) {
        module_import_lines.push(`import { ${import_pairs.join(", ")} } from "${dep_js_from_mod}";`);
      }
    }

    // Add use-alias entries to imports_map (`use mod::{name as alias}`)
    for (const use_decl of ast.uses) {
      if (use_decl.imports.kind === "named") {
        for (const { name, alias } of use_decl.imports.names) {
          if (alias) {
            const existing = imports_map.get(name);
            if (existing) imports_map.set(alias, existing);
          }
        }
      }
    }

    // Resolve cross-module extern fn: if this module declares `extern fn X`
    // and another (non-dependency) module exports `X`, add a JS-level import.
    // This handles circular dependencies broken by extern fn declarations.
    for (const decl of ast.decls) {
      if (decl.kind !== "extern_fn_decl") continue;
      const name = decl.name;
      if (imports_map.has(name)) continue;
      for (const [other_key, other_exports] of module_exports_map) {
        if (other_key === key) continue;
        if (!other_exports.values.has(name)) continue;
        if (other_exports.extern_values.has(name)) continue;
        const other_mod = graph.modules.get(other_key)!;
        const other_rel = path.relative(project_root, other_mod.file_path).replace(/\.ring$/, ".js");
        const other_js_from_mod = compute_relative_import(mod_relative, other_rel);
        const other_prefix = other_exports.module_prefix;
        const alias = `${other_prefix}$${safe_ident(name)}`;
        imports_map.set(name, alias);
        module_import_lines.push(`import { ${safe_ident(name)} as ${alias} } from "${other_js_from_mod}";`);
        break;
      }
    }

    // Build export list from pub declarations
    const export_names: string[] = [];
    for (const decl of ast.decls) {
      if (!("is_pub" in decl) || !decl.is_pub) continue;
      switch (decl.kind) {
        case "fn_decl":
          export_names.push(safe_ident(decl.name));
          break;
        case "struct_decl":
          export_names.push(safe_ident(decl.name));
          break;
        case "enum_decl":
          // Enum codegen only produces variant constructors, not the enum name itself
          for (const v of decl.variants) {
            export_names.push(`${safe_ident(decl.name)}_${v.name}`);
          }
          break;
        case "trait_decl":
        case "effect_decl":
        case "extern_fn_decl":
        case "extern_type_decl":
          break;
      }
    }

    // Add impl-related exports for pub types
    for (const decl of ast.decls) {
      if (decl.kind !== "impl_decl") continue;
      const is_pub_type = ast.decls.some(d =>
        (d.kind === "struct_decl" || d.kind === "enum_decl") && d.is_pub && d.name === decl.target_type
      );
      if (!is_pub_type) continue;

      if (decl.trait_name) {
        // Trait impl: export the dict object only
        export_names.push(trait_dict_name(safe_ident(decl.target_type), safe_ident(decl.trait_name)));
      } else {
        // Inherent impl: export standalone method functions
        for (const method of decl.methods) {
          export_names.push(`${safe_ident(decl.target_type)}_${method.name}`);
        }
      }
    }

    // Add auto-derive dict names and method names to exports
    for (const impl of hir.derived_impls) {
      if (ast.decls.some(d =>
        (d.kind === "struct_decl" || d.kind === "enum_decl") && d.is_pub && d.name === impl.type_name
      )) {
        export_names.push(trait_dict_name(safe_ident(impl.type_name), safe_ident(impl.trait_name)));
      }
    }

    // Handle pub use re-exports: create local aliases and add to export list
    const reexport_aliases: string[] = [];
    for (const use_decl of ast.uses) {
      if (!use_decl.is_pub) continue;
      const src_key = use_decl.path.segments.join("::");
      const src_exports = module_exports_map.get(src_key);
      if (!src_exports) continue;
      const src_prefix = src_exports.module_prefix;

      if (use_decl.imports.kind === "named") {
        for (const { name, alias } of use_decl.imports.names) {
          const local_name = alias ?? name;
          const src_js = src_exports.extern_values.has(name)
            ? safe_ident(name)
            : `${src_prefix}$${safe_ident(name)}`;
          const local_js = safe_ident(local_name);
          if (local_js !== src_js) {
            reexport_aliases.push(`const ${local_js} = ${src_js};`);
          }
          export_names.push(local_js);
          const type_def = src_exports.types.get(name);
          if (type_def && "variants" in type_def) {
            for (const v of type_def.variants) {
              const src_v = `${src_prefix}$${safe_ident(name)}_${v.name}`;
              const local_v = `${safe_ident(local_name)}_${v.name}`;
              if (local_v !== src_v) {
                reexport_aliases.push(`const ${local_v} = ${src_v};`);
              }
              export_names.push(local_v);
            }
          }
        }
      } else {
        for (const [name] of src_exports.values) {
          if (src_exports.extern_values.has(name)) continue;
          const src_js = `${src_prefix}$${safe_ident(name)}`;
          const local_js = safe_ident(name);
          if (local_js !== src_js) {
            reexport_aliases.push(`const ${local_js} = ${src_js};`);
          }
          export_names.push(local_js);
        }
        for (const [name, type_def] of src_exports.types) {
          const src_js = `${src_prefix}$${safe_ident(name)}`;
          const local_js = safe_ident(name);
          if (local_js !== src_js) {
            reexport_aliases.push(`const ${local_js} = ${src_js};`);
          }
          export_names.push(local_js);
          if ("variants" in type_def) {
            for (const v of type_def.variants) {
              const src_v = `${src_prefix}$${safe_ident(name)}_${v.name}`;
              const local_v = `${safe_ident(name)}_${v.name}`;
              if (local_v !== src_v) {
                reexport_aliases.push(`const ${local_v} = ${src_v};`);
              }
              export_names.push(local_v);
            }
          }
        }
      }
    }

    // Append re-export aliases to module imports (they'll be emitted at top of file)
    for (const alias of reexport_aliases) {
      module_import_lines.push(alias);
    }

    // Build external metadata for cross-module codegen (same as bundle mode)
    const external_struct_fields = new Map<string, string[]>();
    const external_impl_methods = new Map<string, string | undefined>();
    for (const dk of deps) {
      const dep_exports = module_exports_map.get(dk)!;
      const dep_prefix = dep_exports.module_prefix;
      for (const [name, fields] of dep_exports.struct_field_orders) {
        external_struct_fields.set(`${dep_prefix}$${safe_ident(name)}`, fields);
      }
      for (const [type_name, methods] of dep_exports.impl_methods) {
        for (const [mname] of methods) {
          external_impl_methods.set(`${dep_prefix}$${safe_ident(type_name)}.${mname}`, undefined);
        }
      }
    }

    const options: CodegenOptions = {
      imports_map,
      skip_preamble: true,
      skip_main_call: key !== entry_key,
      external_struct_fields,
      external_impl_methods,
      module_imports: module_import_lines,
      module_exports: export_names,
    };

    const module_js = generate(hir, options);
    fs.writeFileSync(mod_out_path, module_js, "utf-8");

    if (key === entry_key) {
      entry_js_path = mod_out_path;
    }
  }

  return {
    success: true,
    diagnostics: [...sink.diagnostics()],
    entry_js_path,
  };
}

function compute_relative_import(from_relative: string, to_relative: string): string {
  const from_dir = path.dirname(from_relative);
  let rel = path.relative(from_dir, to_relative).replace(/\\/g, "/");
  if (!rel.startsWith(".")) rel = "./" + rel;
  return rel;
}
