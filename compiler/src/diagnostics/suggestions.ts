import { Diagnostic, Suggestion } from "./index.js";

export function enrich(diagnostics: readonly Diagnostic[]): Diagnostic[] {
  return diagnostics.map(d => {
    const suggestions = suggest(d);
    return suggestions.length > 0 ? { ...d, suggestions } : { ...d };
  });
}

function suggest(_d: Diagnostic): Suggestion[] {
  // TODO: add suggestion rules (e.g. "did you mean X?" for typos, auto-import hints)
  return [];
}
