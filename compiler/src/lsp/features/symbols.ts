import { DocumentSymbol, SymbolKind } from "vscode-languageserver";
import { DocumentState } from "../document-manager.js";
import { span_to_range } from "../utils.js";
import { Decl } from "../../ast/index.js";

function decl_to_symbol(decl: Decl): DocumentSymbol {
  switch (decl.kind) {
    case "fn_decl":
      return { name: decl.name, kind: SymbolKind.Function, range: span_to_range(decl.span), selectionRange: span_to_range(decl.span) };
    case "struct_decl":
      return {
        name: decl.name, kind: SymbolKind.Struct, range: span_to_range(decl.span), selectionRange: span_to_range(decl.span),
        children: decl.fields.map(f => ({ name: f.name, kind: SymbolKind.Field, range: span_to_range(f.span), selectionRange: span_to_range(f.span) })),
      };
    case "enum_decl":
      return {
        name: decl.name, kind: SymbolKind.Enum, range: span_to_range(decl.span), selectionRange: span_to_range(decl.span),
        children: decl.variants.map(v => ({ name: v.name, kind: SymbolKind.EnumMember, range: span_to_range(v.span), selectionRange: span_to_range(v.span) })),
      };
    case "trait_decl":
      return {
        name: decl.name, kind: SymbolKind.Interface, range: span_to_range(decl.span), selectionRange: span_to_range(decl.span),
        children: decl.methods.map(m => ({ name: m.name, kind: SymbolKind.Method, range: span_to_range(m.span), selectionRange: span_to_range(m.span) })),
      };
    case "impl_decl":
      return {
        name: `impl ${decl.trait_name ? `${decl.trait_name} for ` : ""}${decl.target_type}`,
        kind: SymbolKind.Class, range: span_to_range(decl.span), selectionRange: span_to_range(decl.span),
        children: decl.methods.map(m => ({ name: m.name, kind: SymbolKind.Method, range: span_to_range(m.span), selectionRange: span_to_range(m.span) })),
      };
    case "effect_decl":
      return {
        name: decl.name, kind: SymbolKind.Event, range: span_to_range(decl.span), selectionRange: span_to_range(decl.span),
        children: decl.ops.map(op => ({ name: op.name, kind: SymbolKind.Method, range: span_to_range(op.span), selectionRange: span_to_range(op.span) })),
      };
    case "test_decl":
      return { name: `test "${decl.description}"`, kind: SymbolKind.Function, range: span_to_range(decl.span), selectionRange: span_to_range(decl.span) };
  }
}

export function get_document_symbols(state: DocumentState): DocumentSymbol[] {
  if (!state.ast) return [];
  return state.ast.decls.map(decl_to_symbol);
}
