import {
  Diagnostic as LspDiagnostic,
  DiagnosticSeverity,
  DiagnosticRelatedInformation,
  Location,
} from "vscode-languageserver";
import { Diagnostic, Severity } from "../../diagnostics/index.js";
import { span_to_range } from "../utils.js";

const SEVERITY_MAP: Record<Severity, DiagnosticSeverity> = {
  error: DiagnosticSeverity.Error,
  warning: DiagnosticSeverity.Warning,
  info: DiagnosticSeverity.Information,
  hint: DiagnosticSeverity.Hint,
};

export function convert_diagnostics(diagnostics: readonly Diagnostic[]): LspDiagnostic[] {
  return diagnostics.map(d => {
    const lsp: LspDiagnostic = {
      range: span_to_range(d.span),
      severity: SEVERITY_MAP[d.severity],
      code: d.code,
      source: "ring",
      message: d.message,
    };

    if (d.notes.length > 0) {
      lsp.relatedInformation = d.notes
        .filter(n => n.span !== undefined)
        .map((n): DiagnosticRelatedInformation => ({
          location: Location.create(n.span!.file, span_to_range(n.span!)),
          message: n.message,
        }));
    }

    return lsp;
  });
}
