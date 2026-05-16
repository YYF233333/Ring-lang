// Ring-lang Type Checker — Public entry point
// Takes an AST Program, performs type inference + effect inference + exhaustiveness checks,
// and returns a fully-typed HIR Program.

import { Program } from "../ast/index.js";
import { HProgram } from "../hir/index.js";
import { InferEngine } from "./infer.js";

export { TypeCheckError } from "./infer.js";
export { UnificationError } from "./unify.js";

/**
 * Type-check a program: AST -> HIR.
 * Throws TypeCheckError or UnificationError on type errors.
 */
export function check(program: Program): HProgram {
  const engine = new InferEngine();
  return engine.check(program);
}
