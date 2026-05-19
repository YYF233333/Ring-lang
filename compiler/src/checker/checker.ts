import { Program } from "../ast/index.js";
import { HProgram } from "../hir/index.js";
import { DiagnosticSink, CollectingSink } from "../diagnostics/index.js";
import { InferEngine } from "./infer.js";
import { TypeEnv } from "./env.js";
import { ModuleExports } from "../modules/exports.js";

export { UnificationError } from "./unify.js";
export { TypeEnv } from "./env.js";

export interface CheckResult {
  program: HProgram;
  env: TypeEnv;
}

export function check(program: Program, sink?: DiagnosticSink): CheckResult {
  const s = sink ?? new CollectingSink();
  const engine = new InferEngine(s);
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
  engine.inject_module_exports(module_exports);
  engine.resolve_uses(program.uses, module_exports);
  const hprogram = engine.check(program);
  return { program: hprogram, env: engine.env };
}
