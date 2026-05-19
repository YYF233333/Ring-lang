import * as fs from "node:fs";
import { fileURLToPath } from "node:url";
import { Parser } from "../parser/parser.js";
import { check, check_module, CheckResult } from "../checker/checker.js";
import { CollectingSink, Diagnostic } from "../diagnostics/index.js";
import { Program } from "../ast/index.js";
import { build_module_graph, module_prefix } from "../modules/resolver.js";
import { extract_exports, ModuleExports } from "../modules/exports.js";

export interface DocumentState {
  uri: string;
  version: number;
  source: string;
  ast: Program | null;
  checkResult: CheckResult | null;
  diagnostics: Diagnostic[];
}

export class DocumentManager {
  private documents = new Map<string, DocumentState>();

  open(uri: string, version: number, source: string): DocumentState {
    const state = this.compile(uri, version, source);
    this.documents.set(uri, state);
    return state;
  }

  update(uri: string, version: number, source: string): DocumentState {
    const state = this.compile(uri, version, source);
    this.documents.set(uri, state);
    return state;
  }

  close(uri: string): void {
    this.documents.delete(uri);
  }

  get(uri: string): DocumentState | undefined {
    return this.documents.get(uri);
  }

  private compile(uri: string, version: number, source: string): DocumentState {
    const sink = new CollectingSink();
    let ast: Program | null = null;
    let checkResult: CheckResult | null = null;

    try {
      ast = Parser.parse(source, uri, sink);

      if (ast.uses.length > 0) {
        checkResult = this.compile_with_modules(uri, ast, sink);
      } else {
        checkResult = check(ast, sink);
      }
    } catch {
      // Compilation may throw on severe errors; diagnostics are still in sink
    }

    return {
      uri,
      version,
      source,
      ast,
      checkResult,
      diagnostics: [...sink.diagnostics()],
    };
  }

  private compile_with_modules(uri: string, ast: Program, sink: CollectingSink): CheckResult | null {
    let filePath: string;
    try {
      filePath = uri.startsWith("file://") ? fileURLToPath(uri) : uri;
    } catch {
      return check(ast, sink);
    }

    if (!fs.existsSync(filePath)) return check(ast, sink);

    const graph_result = build_module_graph(filePath);
    if ("error" in graph_result) return check(ast, sink);

    const graph = graph_result;
    const entry_key = graph.topo_order[graph.topo_order.length - 1];
    const dep_exports: ModuleExports[] = [];

    for (const key of graph.topo_order) {
      if (key === entry_key) break;
      const mod = graph.modules.get(key)!;
      const mod_source = fs.readFileSync(mod.file_path, "utf-8");
      const mod_sink = new CollectingSink();
      try {
        const mod_ast = Parser.parse(mod_source, mod.file_path, mod_sink);
        const { program: hir, env } = check_module(mod_ast, dep_exports, mod_sink);
        if ([...mod_sink.diagnostics()].some(d => d.severity === "error")) continue;
        const prefix = module_prefix(mod.path_segments);
        dep_exports.push(extract_exports(key, prefix, mod_ast, hir, env));
      } catch {
        continue;
      }
    }

    return check_module(ast, dep_exports, sink);
  }
}
