import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { Program } from "../ast/index.js";
import { HProgram } from "../hir/index.js";
import { DiagnosticSink, CollectingSink } from "../diagnostics/index.js";
import { InferEngine } from "./infer.js";
import { TypeEnv } from "./env.js";
import { ModuleExports } from "../modules/exports.js";
import { Parser } from "../parser/parser.js";
import { register_hof_intrinsics } from "./builtins.js";

export { UnificationError } from "./unify.js";
export { TypeEnv } from "./env.js";

export interface CheckResult {
  program: HProgram;
  env: TypeEnv;
}

const STD_FILES = ["io.ring", "list.ring", "map.ring", "set.ring", "str.ring", "num.ring", "fs.ring", "path.ring", "process.ring"];

function find_std_dir(): string | null {
  const this_file = fileURLToPath(import.meta.url);
  const this_dir = path.dirname(this_file);
  const candidates = [
    path.resolve(this_dir, "../../../std"),
    path.resolve(this_dir, "../../../../std"),
    path.resolve(process.cwd(), "std"),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(dir)) return dir;
  }
  return null;
}

function load_prelude(engine: InferEngine): void {
  const std_dir = find_std_dir();
  if (!std_dir) return;
  for (const file of STD_FILES) {
    const file_path = path.join(std_dir, file);
    if (!fs.existsSync(file_path)) continue;
    const source = fs.readFileSync(file_path, "utf-8");
    const sink = new CollectingSink();
    try {
      const ast = Parser.parse(source, file_path, sink);
      if (sink.has_errors()) continue;
      for (const decl of ast.decls) {
        engine.register_decl_public(decl);
      }
    } catch (e) {
      console.error(`[ring] warning: failed to load stdlib file ${file}: ${e instanceof Error ? e.message : e}`);
    }
  }
}

export function check(program: Program, sink?: DiagnosticSink): CheckResult {
  const s = sink ?? new CollectingSink();
  const engine = new InferEngine(s);
  load_prelude(engine);
  register_hof_intrinsics(engine.env);
  const hprogram = engine.check(program);
  return { program: hprogram, env: engine.env };
}

export function check_module(
  program: Program,
  module_exports: ModuleExports[],
  sink?: DiagnosticSink,
): CheckResult {
  const s = sink ?? new CollectingSink();
  const engine = new InferEngine(s);
  load_prelude(engine);
  register_hof_intrinsics(engine.env);
  engine.inject_module_exports(module_exports);
  engine.resolve_uses(program.uses, module_exports);
  const hprogram = engine.check(program);
  return { program: hprogram, env: engine.env };
}
