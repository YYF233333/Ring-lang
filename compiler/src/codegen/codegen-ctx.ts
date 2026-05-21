// CodegenCtx interface + shared utilities extracted from CodeGenerator.
// All sub-file functions take `ctx: CodegenCtx` as first parameter instead of `this`.

import type { HTraitDecl, HExpr, HStmt, HBlock } from "../hir/index.js";
import type { EffectRow, Effect } from "../types/index.js";
import { evidence_param_name } from "../hir/index.js";
import { assertNever } from "../errors.js";

// ============================================================
// JS reserved words — shared across codegen
// ============================================================

const JS_RESERVED = new Set([
  "abstract", "arguments", "await", "boolean", "break", "byte", "case", "catch",
  "char", "class", "const", "continue", "debugger", "default", "delete", "do",
  "double", "else", "enum", "eval", "export", "extends", "false", "final",
  "finally", "float", "for", "function", "goto", "if", "implements", "import",
  "in", "instanceof", "int", "interface", "let", "long", "native", "new",
  "null", "package", "private", "protected", "public", "return", "short",
  "static", "super", "switch", "synchronized", "this", "throw", "throws",
  "transient", "true", "try", "typeof", "undefined", "var", "void",
  "volatile", "while", "with", "yield",
  // JS built-in global names — prevent user types from shadowing these
  "Object", "Array", "Map", "Set", "String", "Number", "Boolean", "Symbol",
  "Promise", "Error", "RegExp", "Date", "Math", "JSON", "Proxy", "Reflect",
  "WeakMap", "WeakSet", "WeakRef", "BigInt", "ArrayBuffer", "DataView",
  "Int8Array", "Uint8Array", "Float32Array", "Float64Array",
]);

export function safe_ident(name: string): string {
  if (JS_RESERVED.has(name)) return `_${name}`;
  return name;
}

// ============================================================
// CodegenOptions — public configuration
// ============================================================

export interface CodegenOptions {
  module_prefix?: string;               // e.g. "parser" — prefix for this module's declarations
  imports_map?: Map<string, string>;     // local name → qualified JS name for imports
  skip_preamble?: boolean;              // skip runtime code + Option constructors
  skip_main_call?: boolean;             // skip main() auto-invocation
  external_struct_fields?: Map<string, string[]>;     // pre-populated struct field orders from deps
  external_impl_methods?: Map<string, string | undefined>; // pre-populated impl methods from deps
  module_imports?: string[];    // pre-formatted JS import statements (ESM mode)
  module_exports?: string[];    // names to export (ESM mode)
}

// ============================================================
// CodegenCtx — the interface that CodeGenerator implements
// ============================================================

export interface CodegenCtx {
  lines: string[];
  indent_level: number;
  impl_methods: Map<string, string | undefined>;
  struct_field_order: Map<string, string[]>;
  trait_decls: Map<string, HTraitDecl>;
  match_counter: number;
  dt_counter: number;
  loop_counter: number;
  module_prefix?: string;
  imports_map?: Map<string, string>;
  skip_preamble: boolean;
  skip_main_call: boolean;
  local_names: Set<string>;
  local_fn_effects: Map<string, EffectRow>;
  current_fn_effects?: EffectRow;
  in_try_fail: boolean;
  module_imports?: string[];
  module_exports?: string[];

  // Utility methods
  emit(line: string): void;
  emit_raw(text: string): void;
  push_indent(): void;
  pop_indent(): void;
  qualify(name: string): string;

  // Cross-module callbacks
  gen_expr(expr: HExpr): string;
  emit_stmt(stmt: HStmt): void;
  emit_in_stmt_context(expr: HExpr, mode: "return" | "discard"): void;
  emit_block_in_stmt_context(block: HBlock, mode: "return" | "discard"): void;
  emit_block_body(block: HBlock): void;
  gen_stmt_inline(stmt: HStmt): string;
}

// ============================================================
// Effect name extraction utilities
// ============================================================

function effect_name(e: Effect): string {
  switch (e.kind) {
    case "io": return "io";
    case "fail": return "fail";
    case "mut": return "mut";
    case "custom": return e.name;
    default: return assertNever(e, "effect_name");
  }
}

export function extract_effect_names(effects: EffectRow): string[] {
  const names: string[] = [];
  for (const e of effects.effects) {
    const n = effect_name(e);
    if (!names.includes(n)) names.push(n);
  }
  names.sort();
  return names;
}

export function get_evidence_params(effects: EffectRow): string[] {
  return extract_effect_names(effects).map(n => evidence_param_name(n));
}

// ============================================================
// List HOF JS method mapping — shared between codegen-expr
// ============================================================

export const LIST_HOF_JS: Record<string, string> = {
  map: "map", filter: "filter", flat_map: "flatMap",
  any: "some", all: "every",
};
