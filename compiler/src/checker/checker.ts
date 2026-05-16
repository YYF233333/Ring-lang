import { Program } from "../ast/index.js";
import { HProgram } from "../hir/index.js";
import { DiagnosticSink, CollectingSink } from "../diagnostics/index.js";
import { InferEngine } from "./infer.js";

export { UnificationError } from "./unify.js";

export function check(program: Program, sink?: DiagnosticSink): HProgram {
  const s = sink ?? new CollectingSink();
  const engine = new InferEngine(s);
  return engine.check(program);
}
