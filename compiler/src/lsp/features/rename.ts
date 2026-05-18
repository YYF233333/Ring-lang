import { WorkspaceEdit, Position } from "vscode-languageserver";
import { DocumentState } from "../document-manager.js";
import { get_references } from "./references.js";

const BUILTINS = new Set(["print", "assert", "exit", "panic", "some", "none", "Cell"]);

export function get_rename_edits(state: DocumentState, position: Position, new_name: string): WorkspaceEdit | null {
  if (!state.checkResult) return null;
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(new_name)) return null;
  const refs = get_references(state, position);
  if (refs.length === 0) return null;

  // Extract identifier name at cursor
  const lines = state.source.split("\n");
  const line = lines[position.line] ?? "";
  let start = position.character;
  while (start > 0 && /\w/.test(line[start - 1])) start--;
  let end = position.character;
  while (end < line.length && /\w/.test(line[end])) end++;
  const name = line.slice(start, end);
  if (BUILTINS.has(name)) return null;

  return {
    changes: {
      [state.uri]: refs.map(ref => ({ range: ref.range, newText: new_name })),
    },
  };
}
