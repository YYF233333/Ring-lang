// Ring-lang Multi-file Compilation Orchestrator
// Resolves module graph → parses all → checks in topo order → codegen → bundle

import * as fs from "node:fs";
import { Parser } from "../parser/parser.js";
import { check_module } from "../checker/checker.js";
import { generate, safe_ident, CodegenOptions } from "../codegen/codegen.js";
import { CollectingSink, DiagnosticSink, Diagnostic, make_diagnostic } from "../diagnostics/index.js";
import { Program } from "../ast/index.js";
import { HProgram } from "../hir/index.js";
import { build_module_graph, module_key, module_prefix } from "./resolver.js";
import { ModuleExports, extract_exports } from "./exports.js";
import { CompileError } from "../errors.js";
import { E } from "../diagnostics/codes.js";

export interface CompileProjectResult {
  js: string;
  diagnostics: Diagnostic[];
  success: boolean;
}

export function compile_project(entry_file: string, sink: DiagnosticSink): CompileProjectResult {
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
    return { js: "", diagnostics: [...sink.diagnostics()], success: false };
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
      // Forward any parser warnings/info to the main sink
      for (const d of mod_sink.diagnostics()) {
        if (d.severity === "error") {
          sink.report(d);
        }
      }
      if (mod_sink.has_errors()) {
        return { js: "", diagnostics: [...sink.diagnostics()], success: false };
      }
      module_asts.set(key, ast);
    } catch {
      for (const d of mod_sink.diagnostics()) sink.report(d);
      return { js: "", diagnostics: [...sink.diagnostics()], success: false };
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
        return { js: "", diagnostics: [...sink.diagnostics()], success: false };
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
      return { js: "", diagnostics: [...sink.diagnostics()], success: false };
    }
  }

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
      // Import all exported values (functions, enum constructors)
      for (const [name] of dep_exports.values) {
        imports_map.set(name, `${dep_prefix}$${safe_ident(name)}`);
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
    const ast = module_asts.get(key)!;
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
