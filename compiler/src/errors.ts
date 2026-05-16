import { Diagnostic } from "./diagnostics/index.js";

export class CompileError extends Error {
  public diagnostics: Diagnostic[];

  constructor(diagnostics: Diagnostic[]) {
    const msg = diagnostics
      .map(d => `${d.code}: ${d.message} (${d.span.file}:${d.span.start.line}:${d.span.start.column})`)
      .join("\n");
    super(msg);
    this.name = "CompileError";
    this.diagnostics = diagnostics;
  }
}

export function assertNever(x: never, context: string): never {
  throw new Error(`${context}: ${(x as { kind?: string }).kind ?? x}`);
}
