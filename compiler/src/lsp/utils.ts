import { Position as RingPosition, Span } from "../ast/index.js";
import { Position as LspPosition, Range } from "vscode-languageserver";
import { Type, EffectRow, type_to_string, effect_row_to_string } from "../types/index.js";

export function position_to_lsp(pos: RingPosition): LspPosition {
  return { line: pos.line - 1, character: pos.column };
}

export function span_to_range(span: Span): Range {
  return {
    start: position_to_lsp(span.start),
    end: position_to_lsp(span.end),
  };
}

export function offset_to_position(source: string, offset: number): LspPosition {
  let line = 0;
  let last_line_start = 0;
  for (let i = 0; i < offset && i < source.length; i++) {
    if (source[i] === "\n") {
      line++;
      last_line_start = i + 1;
    }
  }
  return { line, character: offset - last_line_start };
}

export function contains_position(span: Span, pos: LspPosition): boolean {
  const ring_line = pos.line + 1;
  const ring_col = pos.character;
  const { start, end } = span;
  if (ring_line < start.line || ring_line > end.line) return false;
  if (ring_line === start.line && ring_col < start.column) return false;
  if (ring_line === end.line && ring_col >= end.column) return false;
  return true;
}

export function format_type_for_hover(type: Type, effects: EffectRow): string {
  const type_str = type_to_string(type);
  const eff_str = effect_row_to_string(effects);
  return eff_str ? `${type_str} / ${eff_str}` : type_str;
}
