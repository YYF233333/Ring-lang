import { CompletionItem, CompletionItemKind, Position } from "vscode-languageserver";
import { DocumentState } from "../document-manager.js";
import { type_to_string, Type } from "../../types/index.js";
import { TypeEnv } from "../../checker/env.js";
import {
  HDecl, HExpr, HStmt, HBlock, HFnDecl, HImplDecl,
} from "../../hir/index.js";
import { Span } from "../../ast/index.js";

// ============================================================
// Ring-lang keywords for completion
// ============================================================

const KEYWORDS: string[] = [
  "fn", "let", "var", "if", "else", "match", "return",
  "struct", "enum", "impl", "trait", "handle", "with",
  "effect", "true", "false", "try", "catch", "or",
  "pub", "for", "in",
];

// ============================================================
// Position helpers
// ============================================================

/**
 * Given the source text and a cursor (0-based line, 0-based character),
 * return the text on that line up to (but not including) the cursor character.
 */
function line_prefix(source: string, pos: Position): string {
  const lines = source.split("\n");
  const line = lines[pos.line] ?? "";
  return line.slice(0, pos.character);
}

/**
 * Returns true if the LSP position (0-based line) falls within the Ring span.
 * Ring spans: line is 1-based, column is 0-based.
 */
function span_ends_before(span: Span, pos: Position): boolean {
  // True if the span ends at or before the LSP cursor position
  const ring_line = pos.line + 1;
  const end = span.end;
  if (end.line < ring_line) return true;
  if (end.line === ring_line && end.column <= pos.character) return true;
  return false;
}

// ============================================================
// HIR walk — find expression type at a position (for dot completion)
// ============================================================

/**
 * Walk HIR to find the type of an expression whose span ends at/before
 * the cursor's position, and is the rightmost such expression (i.e., the
 * receiver immediately before the dot).
 */
function find_receiver_type(
  expr: HExpr,
  dot_pos: Position,
): Type | null {
  // For a field_access, the receiver is what we want for dot completion.
  // The field_access receiver ends right before the dot.
  if (expr.kind === "field_access") {
    const recv = expr.receiver;
    // The receiver's span should end at or before the dot position
    if (span_ends_before(recv.span, dot_pos)) {
      // Recursively check for deeper matches first
      const deeper = find_receiver_type(recv, dot_pos);
      if (deeper) return deeper;
      return recv.type;
    }
  }

  // Recurse into children to find a match
  return walk_expr_for_receiver(expr, dot_pos);
}

function walk_expr_for_receiver(expr: HExpr, pos: Position): Type | null {
  switch (expr.kind) {
    case "int_lit":
    case "float_lit":
    case "str_lit":
    case "bool_lit":
    case "ident":
      return null;

    case "bin_op":
      return find_receiver_type(expr.left, pos) ?? find_receiver_type(expr.right, pos);

    case "unary_op":
      return find_receiver_type(expr.operand, pos);

    case "call":
      return find_receiver_type(expr.callee, pos) ??
        expr.args.reduce<Type | null>((acc, a) => acc ?? find_receiver_type(a, pos), null);

    case "field_access":
      return find_receiver_type(expr.receiver, pos);

    case "struct_lit":
      return expr.fields.reduce<Type | null>(
        (acc, f) => acc ?? find_receiver_type(f.value, pos), null,
      );

    case "match_expr":
      return find_receiver_type(expr.scrutinee, pos) ??
        expr.arms.reduce<Type | null>((acc, arm) => {
          if (acc) return acc;
          if (arm.guard) {
            const g = find_receiver_type(arm.guard, pos);
            if (g) return g;
          }
          return find_receiver_type(arm.body, pos);
        }, null);

    case "block":
      return walk_block_for_receiver(expr, pos);

    case "if_expr": {
      const c = find_receiver_type(expr.condition, pos);
      if (c) return c;
      const t = walk_block_for_receiver(expr.then_branch, pos);
      if (t) return t;
      if (expr.else_branch) {
        if (expr.else_branch.kind === "if_expr") {
          return find_receiver_type(expr.else_branch, pos);
        }
        return walk_block_for_receiver(expr.else_branch, pos);
      }
      return null;
    }

    case "string_interp":
      return expr.parts.reduce<Type | null>(
        (acc, p) => typeof p === "string" ? acc : (acc ?? find_receiver_type(p, pos)), null,
      );

    case "try_catch":
      return find_receiver_type(expr.body, pos) ?? find_receiver_type(expr.handler, pos);

    case "handle_expr":
      return find_receiver_type(expr.body, pos) ??
        expr.handlers.reduce<Type | null>((acc, h) => acc ?? find_receiver_type(h.body, pos), null);

    case "lambda":
      return find_receiver_type(expr.body, pos);

    case "effect_op":
      return expr.args.reduce<Type | null>((acc, a) => acc ?? find_receiver_type(a, pos), null);

    case "option_unwrap":
      return find_receiver_type(expr.expr, pos);

    case "try_block":
      return find_receiver_type(expr.body, pos);

    case "option_or":
      return find_receiver_type(expr.expr, pos) ?? find_receiver_type(expr.default_value, pos);
  }
}

function walk_stmt_for_receiver(stmt: HStmt, pos: Position): Type | null {
  switch (stmt.kind) {
    case "let_stmt":
    case "var_stmt":
      return find_receiver_type(stmt.init, pos);
    case "assign_stmt":
      return find_receiver_type(stmt.target, pos) ?? find_receiver_type(stmt.value, pos);
    case "expr_stmt":
      return find_receiver_type(stmt.expr, pos);
    case "return_stmt":
      return stmt.value ? find_receiver_type(stmt.value, pos) : null;
  }
}

function walk_block_for_receiver(block: HBlock, pos: Position): Type | null {
  for (const stmt of block.stmts) {
    const r = walk_stmt_for_receiver(stmt, pos);
    if (r) return r;
  }
  if (block.tail) return find_receiver_type(block.tail, pos);
  return null;
}

function walk_fn_decl_for_receiver(fn: HFnDecl, pos: Position): Type | null {
  return walk_block_for_receiver(fn.body, pos);
}

function walk_impl_decl_for_receiver(impl: HImplDecl, pos: Position): Type | null {
  for (const method of impl.methods) {
    const r = walk_fn_decl_for_receiver(method, pos);
    if (r) return r;
  }
  return null;
}

function walk_decl_for_receiver(decl: HDecl, pos: Position): Type | null {
  switch (decl.kind) {
    case "fn_decl":
      return walk_fn_decl_for_receiver(decl, pos);
    case "impl_decl":
      return walk_impl_decl_for_receiver(decl, pos);
    case "struct_decl":
    case "enum_decl":
    case "effect_decl":
    case "test_decl":
    case "trait_decl":
      return null;
  }
}

// ============================================================
// Dot completion — from receiver type, return fields + methods
// ============================================================

function fields_and_methods_for_type(type: Type, env: TypeEnv): CompletionItem[] {
  const items: CompletionItem[] = [];

  if (type.kind === "struct") {
    for (const field of type.fields) {
      items.push({
        label: field.name,
        kind: CompletionItemKind.Field,
        detail: type_to_string(field.type),
      });
    }
    const methods = env.impl_methods.get(type.name);
    if (methods) {
      for (const [method_name, scheme] of methods) {
        items.push({
          label: method_name,
          kind: CompletionItemKind.Method,
          detail: type_to_string(scheme.type),
        });
      }
    }
  } else if (type.kind === "enum") {
    const methods = env.impl_methods.get(type.name);
    if (methods) {
      for (const [method_name, scheme] of methods) {
        items.push({
          label: method_name,
          kind: CompletionItemKind.Method,
          detail: type_to_string(scheme.type),
        });
      }
    }
  }

  return items;
}

// ============================================================
// General scope completion — variables + keywords + type names
// ============================================================

function scope_completions(env: TypeEnv): CompletionItem[] {
  const items: CompletionItem[] = [];
  const seen = new Set<string>();

  // All variables from all scopes (innermost first, no duplicates)
  for (let i = env.scopes.length - 1; i >= 0; i--) {
    for (const [name, scheme] of env.scopes[i].variables) {
      if (!seen.has(name)) {
        seen.add(name);
        const t = scheme.type;
        const is_fn = t.kind === "fn";
        items.push({
          label: name,
          kind: is_fn ? CompletionItemKind.Function : CompletionItemKind.Variable,
          detail: type_to_string(t),
        });
      }
    }
  }

  // Struct type names
  for (const [name] of env.structs) {
    if (!seen.has(name)) {
      seen.add(name);
      items.push({ label: name, kind: CompletionItemKind.Struct });
    }
  }

  // Enum type names
  for (const [name] of env.enums) {
    if (!seen.has(name)) {
      seen.add(name);
      items.push({ label: name, kind: CompletionItemKind.Enum });
    }
  }

  return items;
}

function keyword_completions(): CompletionItem[] {
  return KEYWORDS.map(kw => ({
    label: kw,
    kind: CompletionItemKind.Keyword,
  }));
}

// ============================================================
// Public API
// ============================================================

export function get_completions(state: DocumentState, position: Position): CompletionItem[] {
  // If we have no type information, return keywords only
  if (!state.checkResult) {
    return keyword_completions();
  }

  const { env, program } = state.checkResult;
  const prefix = line_prefix(state.source, position);

  // Detect dot completion: the line prefix ends with "identifier."
  // (possibly with whitespace between identifier and dot)
  const dot_match = prefix.match(/\w[\w\d]*\s*\.\s*$/);
  if (dot_match) {
    // Walk the HIR to find the receiver type.
    // The dot is at position character (prefix.length - trailing_whitespace - 1),
    // but we use the cursor position itself — the receiver ends before the dot.
    // We pass the cursor position and look for a field_access whose receiver
    // ends at or before that position.
    let receiver_type: Type | null = null;
    for (const decl of program.decls) {
      receiver_type = walk_decl_for_receiver(decl, position);
      if (receiver_type) break;
    }

    if (receiver_type) {
      const results = fields_and_methods_for_type(receiver_type, env);
      if (results.length > 0) return results;
    }
  }

  // General completion: scope variables + keywords + type names
  return [...scope_completions(env), ...keyword_completions()];
}
