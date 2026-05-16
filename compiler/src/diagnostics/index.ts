import { Span } from "../ast/index.js";

export type Severity = "error" | "warning" | "info" | "hint";

export interface DiagnosticNote {
  message: string;
  span?: Span;
}

export type DiagnosticContext =
  | { kind: "type_mismatch"; expected: string; actual: string; expression?: string }
  | { kind: "undefined_variable"; name: string; scope_locals?: string[] }
  | { kind: "missing_field"; field: string; type: string; available?: string[] }
  | { kind: "effect_unhandled"; effect: string; in_function?: string }
  | { kind: "parse_error"; token: string; expected?: string[] }
  | { kind: "pattern_error"; detail: string }
  | { kind: "trait_error"; detail: string }
  | { kind: "other"; detail?: string };

export interface Suggestion {
  message: string;
  replacement?: string;
  span?: Span;
}

export interface Diagnostic {
  severity: Severity;
  code: string;
  message: string;
  span: Span;
  notes: DiagnosticNote[];
  context: DiagnosticContext;
  suggestions: Suggestion[];
}

export interface DiagnosticSink {
  report(diagnostic: Diagnostic): void;
  has_errors(): boolean;
  diagnostics(): readonly Diagnostic[];
}

export class CollectingSink implements DiagnosticSink {
  private items: Diagnostic[] = [];

  report(d: Diagnostic): void {
    this.items.push(d);
  }

  has_errors(): boolean {
    return this.items.some(d => d.severity === "error");
  }

  diagnostics(): readonly Diagnostic[] {
    return this.items;
  }

  clear(): void {
    this.items = [];
  }
}

export function make_diagnostic(
  code: string,
  severity: Severity,
  message: string,
  span: Span,
  context: DiagnosticContext,
  notes: DiagnosticNote[] = [],
): Diagnostic {
  return { severity, code, message, span, notes, context, suggestions: [] };
}
