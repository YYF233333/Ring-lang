import { Location, Position } from "vscode-languageserver";
import { DocumentState } from "../document-manager.js";
import { span_to_range } from "../utils.js";
import {
  HExpr,
  HStmt,
  HBlock,
  HDecl,
  HFnDecl,
  HImplDecl,
} from "../../hir/index.js";
import { Span } from "../../ast/index.js";

// ============================================================
// Position containment (Ring 1-based lines vs LSP 0-based lines)
// ============================================================

function contains_position(span: Span, pos: Position): boolean {
  const ring_line = pos.line + 1;
  const ring_col = pos.character;

  const { start, end } = span;
  if (ring_line < start.line || ring_line > end.line) return false;
  if (ring_line === start.line && ring_col < start.column) return false;
  if (ring_line === end.line && ring_col >= end.column) return false;
  return true;
}

// ============================================================
// Step 1: Find the identifier name at cursor position (reuse pattern from definition.ts)
// ============================================================

function find_ident_in_expr(expr: HExpr, pos: Position): string | null {
  if (!contains_position(expr.span, pos)) return null;

  switch (expr.kind) {
    case "ident":
      return expr.name;

    case "int_lit":
    case "float_lit":
    case "str_lit":
    case "bool_lit":
      return null;

    case "bin_op":
      return find_ident_in_expr(expr.left, pos) ?? find_ident_in_expr(expr.right, pos);

    case "unary_op":
      return find_ident_in_expr(expr.operand, pos);

    case "call": {
      const callee = find_ident_in_expr(expr.callee, pos);
      if (callee !== null) return callee;
      for (const arg of expr.args) {
        const r = find_ident_in_expr(arg, pos);
        if (r !== null) return r;
      }
      return null;
    }

    case "field_access":
      return find_ident_in_expr(expr.receiver, pos);

    case "struct_lit": {
      for (const field of expr.fields) {
        const r = find_ident_in_expr(field.value, pos);
        if (r !== null) return r;
      }
      return null;
    }

    case "match_expr": {
      const scrutinee = find_ident_in_expr(expr.scrutinee, pos);
      if (scrutinee !== null) return scrutinee;
      for (const arm of expr.arms) {
        if (arm.guard) {
          const g = find_ident_in_expr(arm.guard, pos);
          if (g !== null) return g;
        }
        const b = find_ident_in_expr(arm.body, pos);
        if (b !== null) return b;
      }
      return null;
    }

    case "block":
      return find_ident_in_block(expr, pos);

    case "if_expr": {
      const cond = find_ident_in_expr(expr.condition, pos);
      if (cond !== null) return cond;
      const then = find_ident_in_block(expr.then_branch, pos);
      if (then !== null) return then;
      if (expr.else_branch) {
        if (expr.else_branch.kind === "if_expr") {
          return find_ident_in_expr(expr.else_branch, pos);
        } else {
          return find_ident_in_block(expr.else_branch, pos);
        }
      }
      return null;
    }

    case "string_interp": {
      for (const part of expr.parts) {
        if (typeof part !== "string") {
          const r = find_ident_in_expr(part, pos);
          if (r !== null) return r;
        }
      }
      return null;
    }

    case "try_catch":
      return find_ident_in_expr(expr.body, pos) ?? find_ident_in_expr(expr.handler, pos);

    case "handle_expr": {
      const body = find_ident_in_expr(expr.body, pos);
      if (body !== null) return body;
      for (const handler of expr.handlers) {
        const r = find_ident_in_expr(handler.body, pos);
        if (r !== null) return r;
      }
      return null;
    }

    case "lambda":
      return find_ident_in_expr(expr.body, pos);

    case "effect_op": {
      for (const arg of expr.args) {
        const r = find_ident_in_expr(arg, pos);
        if (r !== null) return r;
      }
      return null;
    }

    case "option_unwrap":
      return find_ident_in_expr(expr.expr, pos);

    case "try_block":
      return find_ident_in_expr(expr.body, pos);

    case "option_or":
      return find_ident_in_expr(expr.expr, pos) ?? find_ident_in_expr(expr.default_value, pos);
  }
}

function find_ident_in_stmt(stmt: HStmt, pos: Position): string | null {
  switch (stmt.kind) {
    case "let_stmt":
    case "var_stmt":
      if (!contains_position(stmt.span, pos)) return null;
      return find_ident_in_expr(stmt.init, pos) ?? stmt.name;

    case "assign_stmt":
      if (!contains_position(stmt.span, pos)) return null;
      return find_ident_in_expr(stmt.target, pos) ?? find_ident_in_expr(stmt.value, pos);

    case "expr_stmt":
      if (!contains_position(stmt.span, pos)) return null;
      return find_ident_in_expr(stmt.expr, pos);

    case "return_stmt":
      if (!contains_position(stmt.span, pos)) return null;
      if (stmt.value) return find_ident_in_expr(stmt.value, pos);
      return null;
  }
}

function find_ident_in_block(block: HBlock, pos: Position): string | null {
  for (const stmt of block.stmts) {
    const r = find_ident_in_stmt(stmt, pos);
    if (r !== null) return r;
  }
  if (block.tail) {
    return find_ident_in_expr(block.tail, pos);
  }
  return null;
}

function find_ident_at_position(decls: HDecl[], pos: Position): string | null {
  for (const decl of decls) {
    switch (decl.kind) {
      case "fn_decl": {
        if (!contains_position(decl.span, pos)) break;
        const r = find_ident_in_block(decl.body, pos);
        if (r !== null) return r;
        break;
      }
      case "impl_decl": {
        if (!contains_position(decl.span, pos)) break;
        for (const method of decl.methods) {
          if (!contains_position(method.span, pos)) continue;
          const r = find_ident_in_block(method.body, pos);
          if (r !== null) return r;
        }
        break;
      }
      case "struct_decl":
      case "enum_decl":
      case "effect_decl":
      case "test_decl":
      case "trait_decl":
        break;
    }
  }
  return null;
}

// ============================================================
// Step 2: Collect ALL HIdent occurrences matching target_name
// ============================================================

function collect_idents_in_expr(expr: HExpr, target: string, uri: string, out: Location[]): void {
  switch (expr.kind) {
    case "ident":
      if (expr.name === target) {
        out.push({ uri, range: span_to_range(expr.span) });
      }
      return;

    case "int_lit":
    case "float_lit":
    case "str_lit":
    case "bool_lit":
      return;

    case "bin_op":
      collect_idents_in_expr(expr.left, target, uri, out);
      collect_idents_in_expr(expr.right, target, uri, out);
      return;

    case "unary_op":
      collect_idents_in_expr(expr.operand, target, uri, out);
      return;

    case "call":
      collect_idents_in_expr(expr.callee, target, uri, out);
      for (const arg of expr.args) collect_idents_in_expr(arg, target, uri, out);
      return;

    case "field_access":
      collect_idents_in_expr(expr.receiver, target, uri, out);
      return;

    case "struct_lit":
      for (const field of expr.fields) collect_idents_in_expr(field.value, target, uri, out);
      return;

    case "match_expr":
      collect_idents_in_expr(expr.scrutinee, target, uri, out);
      for (const arm of expr.arms) {
        if (arm.guard) collect_idents_in_expr(arm.guard, target, uri, out);
        collect_idents_in_expr(arm.body, target, uri, out);
      }
      return;

    case "block":
      collect_idents_in_block(expr, target, uri, out);
      return;

    case "if_expr":
      collect_idents_in_expr(expr.condition, target, uri, out);
      collect_idents_in_block(expr.then_branch, target, uri, out);
      if (expr.else_branch) {
        if (expr.else_branch.kind === "if_expr") {
          collect_idents_in_expr(expr.else_branch, target, uri, out);
        } else {
          collect_idents_in_block(expr.else_branch, target, uri, out);
        }
      }
      return;

    case "string_interp":
      for (const part of expr.parts) {
        if (typeof part !== "string") collect_idents_in_expr(part, target, uri, out);
      }
      return;

    case "try_catch":
      collect_idents_in_expr(expr.body, target, uri, out);
      collect_idents_in_expr(expr.handler, target, uri, out);
      return;

    case "handle_expr":
      collect_idents_in_expr(expr.body, target, uri, out);
      for (const handler of expr.handlers) {
        collect_idents_in_expr(handler.body, target, uri, out);
      }
      return;

    case "lambda":
      collect_idents_in_expr(expr.body, target, uri, out);
      return;

    case "effect_op":
      for (const arg of expr.args) collect_idents_in_expr(arg, target, uri, out);
      return;

    case "option_unwrap":
      collect_idents_in_expr(expr.expr, target, uri, out);
      return;

    case "try_block":
      collect_idents_in_expr(expr.body, target, uri, out);
      return;

    case "option_or":
      collect_idents_in_expr(expr.expr, target, uri, out);
      collect_idents_in_expr(expr.default_value, target, uri, out);
      return;
  }
}

function collect_idents_in_stmt(stmt: HStmt, target: string, uri: string, out: Location[]): void {
  switch (stmt.kind) {
    case "let_stmt":
    case "var_stmt":
      // Include the binding site itself if the name matches
      if (stmt.name === target) {
        out.push({ uri, range: span_to_range(stmt.span) });
      }
      collect_idents_in_expr(stmt.init, target, uri, out);
      return;

    case "assign_stmt":
      collect_idents_in_expr(stmt.target, target, uri, out);
      collect_idents_in_expr(stmt.value, target, uri, out);
      return;

    case "expr_stmt":
      collect_idents_in_expr(stmt.expr, target, uri, out);
      return;

    case "return_stmt":
      if (stmt.value) collect_idents_in_expr(stmt.value, target, uri, out);
      return;
  }
}

function collect_idents_in_block(block: HBlock, target: string, uri: string, out: Location[]): void {
  for (const stmt of block.stmts) {
    collect_idents_in_stmt(stmt, target, uri, out);
  }
  if (block.tail) {
    collect_idents_in_expr(block.tail, target, uri, out);
  }
}

function collect_idents_in_fn(fn: HFnDecl, target: string, uri: string, out: Location[]): void {
  // Include the fn declaration itself if the name matches
  if (fn.name === target) {
    out.push({ uri, range: span_to_range(fn.span) });
  }
  collect_idents_in_block(fn.body, target, uri, out);
}

function collect_idents_in_impl(impl: HImplDecl, target: string, uri: string, out: Location[]): void {
  for (const method of impl.methods) {
    collect_idents_in_fn(method, target, uri, out);
  }
}

function collect_all_references(decls: HDecl[], target: string, uri: string): Location[] {
  const out: Location[] = [];
  for (const decl of decls) {
    switch (decl.kind) {
      case "fn_decl":
        collect_idents_in_fn(decl, target, uri, out);
        break;
      case "impl_decl":
        collect_idents_in_impl(decl, target, uri, out);
        break;
      case "struct_decl":
      case "enum_decl":
      case "effect_decl":
      case "test_decl":
      case "trait_decl":
        break;
    }
  }
  return out;
}

// ============================================================
// Public API
// ============================================================

export function get_references(state: DocumentState, position: Position): Location[] {
  if (!state.checkResult) return [];

  const { program } = state.checkResult;

  // Step 1: find which identifier the cursor is on
  const target_name = find_ident_at_position(program.decls, position);
  if (target_name === null) return [];

  // Step 2: collect all occurrences across the entire HIR
  return collect_all_references(program.decls, target_name, state.uri);
}
