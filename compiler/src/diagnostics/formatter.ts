import { Diagnostic } from "./index.js";

export function format_human(diagnostics: readonly Diagnostic[], source: string): string {
  const lines = source.split("\n");
  const parts: string[] = [];

  for (const d of diagnostics) {
    parts.push(`${d.severity}[${d.code}]: ${d.message}`);
    parts.push(`  --> ${d.span.file}:${d.span.start.line}:${d.span.start.column}`);
    parts.push("   |");

    const line_num = d.span.start.line;
    const source_line = lines[line_num - 1];
    if (source_line !== undefined) {
      const gutter = String(line_num).padStart(3, " ");
      parts.push(`${gutter} | ${source_line}`);

      const underline_start = d.span.start.column;
      const underline_len = d.span.start.line === d.span.end.line
        ? Math.max(1, d.span.end.column - d.span.start.column)
        : Math.max(1, source_line.length - underline_start);
      const padding = " ".repeat(underline_start);
      const carets = "^".repeat(underline_len);

      const hint = format_hint(d);
      parts.push(`${"   "} | ${padding}${carets}${hint ? " " + hint : ""}`);
    }

    parts.push("   |");
    parts.push("");
  }

  return parts.join("\n");
}

function format_hint(d: Diagnostic): string {
  switch (d.context.kind) {
    case "type_mismatch":
      return `expected ${d.context.expected}, got ${d.context.actual}`;
    case "undefined_variable":
      return "not found in this scope";
    case "missing_field":
      return `field '${d.context.field}' not found`;
    default:
      return "";
  }
}

export interface LlmOutput {
  version: number;
  file: string;
  diagnostics: LlmDiagnostic[];
}

export interface LlmDiagnostic {
  code: string;
  severity: string;
  message: string;
  span: { line: number; col: number; end_line: number; end_col: number };
  context: Record<string, unknown>;
  suggestions: { message: string; replacement?: string }[];
}

export function format_llm(diagnostics: readonly Diagnostic[], file: string): string {
  const output: LlmOutput = {
    version: 1,
    file,
    diagnostics: diagnostics.map(d => ({
      code: d.code,
      severity: d.severity,
      message: d.message,
      span: {
        line: d.span.start.line,
        col: d.span.start.column,
        end_line: d.span.end.line,
        end_col: d.span.end.column,
      },
      context: d.context as unknown as Record<string, unknown>,
      suggestions: d.suggestions.map(s => ({
        message: s.message,
        ...(s.replacement !== undefined ? { replacement: s.replacement } : {}),
      })),
    })),
  };
  return JSON.stringify(output, null, 2);
}
