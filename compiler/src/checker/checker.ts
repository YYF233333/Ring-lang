import { Program } from "../ast/index.js";
import { HProgram } from "../hir/index.js";
import { DiagnosticSink, CollectingSink } from "../diagnostics/index.js";
import { InferEngine } from "./infer.js";
import { TypeEnv } from "./env.js";
import { zonk_program } from "./zonk.js";

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
  const zonked = zonk_program(engine.subst, hprogram);
  return { program: zonked, env: engine.env };
}
