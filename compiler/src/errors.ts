// Ring-lang compiler diagnostics and error types

import { Span } from "./ast/index.js";

// ============================================================
// Severity levels
// ============================================================

export type Severity = "error" | "warning" | "info" | "hint";

// ============================================================
// Diagnostic
// ============================================================

export interface DiagnosticNote {
  message: string;
  span?: Span;
}

export interface Diagnostic {
  severity: Severity;
  message: string;
  span: Span;
  notes: DiagnosticNote[];
}

// ============================================================
// CompileError
// ============================================================

export class CompileError extends Error {
  public diagnostics: Diagnostic[];

  constructor(diagnostics: Diagnostic[]) {
    const msg = diagnostics.map(d => format_diagnostic(d)).join("\n\n");
    super(msg);
    this.name = "CompileError";
    this.diagnostics = diagnostics;
  }
}

// ============================================================
// Helper: create an error diagnostic at a given span
// ============================================================

export function error_at(span: Span, message: string, notes: DiagnosticNote[] = []): Diagnostic {
  return { severity: "error", message, span, notes };
}

export function warning_at(span: Span, message: string, notes: DiagnosticNote[] = []): Diagnostic {
  return { severity: "warning", message, span, notes };
}

// ============================================================
// format_diagnostic — human-readable formatting
// ============================================================

export function format_diagnostic(d: Diagnostic): string {
  const sev = d.severity.toUpperCase();
  const loc = `${d.span.file}:${d.span.start.line}:${d.span.start.column}`;
  let result = `${sev}: ${d.message}\n  --> ${loc}`;
  for (const note of d.notes) {
    if (note.span) {
      const nloc = `${note.span.file}:${note.span.start.line}:${note.span.start.column}`;
      result += `\n  note: ${note.message}\n    --> ${nloc}`;
    } else {
      result += `\n  note: ${note.message}`;
    }
  }
  return result;
}

// ============================================================
// format_diagnostic_llm — structured output for LLM consumption
// ============================================================

export interface LlmDiagnostic {
  severity: Severity;
  message: string;
  file: string;
  line: number;
  column: number;
  notes: string[];
}

// Exhaustive switch guard — causes a compile error when a new case is added but not handled.
export function assertNever(x: never, context: string): never {
  throw new Error(`${context}: ${(x as { kind?: string }).kind ?? x}`);
}

export function format_diagnostic_llm(d: Diagnostic): LlmDiagnostic {
  return {
    severity: d.severity,
    message: d.message,
    file: d.span.file,
    line: d.span.start.line,
    column: d.span.start.column,
    notes: d.notes.map(n => n.message),
  };
}
