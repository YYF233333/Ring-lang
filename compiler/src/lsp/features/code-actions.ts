import { CodeAction, CodeActionKind, Range } from "vscode-languageserver";
import { DocumentState } from "../document-manager.js";
import { span_to_range } from "../utils.js";

function ranges_overlap(a: Range, b: Range): boolean {
  if (a.end.line < b.start.line) return false;
  if (a.start.line > b.end.line) return false;
  if (a.end.line === b.start.line && a.end.character < b.start.character) return false;
  if (a.start.line === b.end.line && a.start.character > b.end.character) return false;
  return true;
}

export function get_code_actions(state: DocumentState, range: Range): CodeAction[] {
  const actions: CodeAction[] = [];
  for (const diag of state.diagnostics) {
    const diag_range = span_to_range(diag.span);
    if (!ranges_overlap(diag_range, range)) continue;
    for (const suggestion of diag.suggestions) {
      if (suggestion.replacement !== undefined && suggestion.span) {
        actions.push({
          title: suggestion.message,
          kind: CodeActionKind.QuickFix,
          diagnostics: [{ range: diag_range, severity: 1, code: diag.code, source: "ring", message: diag.message }],
          edit: { changes: { [state.uri]: [{ range: span_to_range(suggestion.span), newText: suggestion.replacement }] } },
        });
      }
    }
  }
  return actions;
}
