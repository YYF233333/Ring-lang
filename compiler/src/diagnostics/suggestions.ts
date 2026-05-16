import { Diagnostic, Suggestion } from "./index.js";

export function enrich(diagnostics: readonly Diagnostic[]): Diagnostic[] {
  return diagnostics.map(d => {
    const suggestions = suggest(d);
    return suggestions.length > 0 ? { ...d, suggestions } : { ...d };
  });
}

function suggest(_d: Diagnostic): Suggestion[] {
  // Framework placeholder — rules added incrementally in future sessions
  return [];
}
