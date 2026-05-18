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
import {
  Decl,
  FnDecl,
  Stmt,
  Expr,
  BlockExpr,
  Span,
} from "../../ast/index.js";

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
// HIR traversal — find the HIdent name at cursor position
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

    case "bin_op": {
      return find_ident_in_expr(expr.left, pos) ?? find_ident_in_expr(expr.right, pos);
    }

    case "unary_op": {
      return find_ident_in_expr(expr.operand, pos);
    }

    case "call": {
      const callee = find_ident_in_expr(expr.callee, pos);
      if (callee !== null) return callee;
      for (const arg of expr.args) {
        const r = find_ident_in_expr(arg, pos);
        if (r !== null) return r;
      }
      return null;
    }

    case "field_access": {
      return find_ident_in_expr(expr.receiver, pos);
    }

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

    case "block": {
      return find_ident_in_block(expr, pos);
    }

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

    case "try_catch": {
      return find_ident_in_expr(expr.body, pos) ?? find_ident_in_expr(expr.handler, pos);
    }

    case "handle_expr": {
      const body = find_ident_in_expr(expr.body, pos);
      if (body !== null) return body;
      for (const handler of expr.handlers) {
        const r = find_ident_in_expr(handler.body, pos);
        if (r !== null) return r;
      }
      return null;
    }

    case "lambda": {
      return find_ident_in_expr(expr.body, pos);
    }

    case "effect_op": {
      for (const arg of expr.args) {
        const r = find_ident_in_expr(arg, pos);
        if (r !== null) return r;
      }
      return null;
    }

    case "option_unwrap": {
      return find_ident_in_expr(expr.expr, pos);
    }

    case "try_block": {
      return find_ident_in_expr(expr.body, pos);
    }

    case "option_or": {
      return find_ident_in_expr(expr.expr, pos) ?? find_ident_in_expr(expr.default_value, pos);
    }
  }
}

function find_ident_in_stmt(stmt: HStmt, pos: Position): string | null {
  switch (stmt.kind) {
    case "let_stmt":
    case "var_stmt": {
      if (!contains_position(stmt.span, pos)) return null;
      return find_ident_in_expr(stmt.init, pos) ?? stmt.name;
    }

    case "assign_stmt": {
      if (!contains_position(stmt.span, pos)) return null;
      return find_ident_in_expr(stmt.target, pos) ?? find_ident_in_expr(stmt.value, pos);
    }

    case "expr_stmt": {
      if (!contains_position(stmt.span, pos)) return null;
      return find_ident_in_expr(stmt.expr, pos);
    }

    case "return_stmt": {
      if (!contains_position(stmt.span, pos)) return null;
      if (stmt.value) return find_ident_in_expr(stmt.value, pos);
      return null;
    }
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

function find_ident_in_fn(fn: HFnDecl, pos: Position): string | null {
  if (!contains_position(fn.span, pos)) return null;
  return find_ident_in_block(fn.body, pos);
}

function find_ident_in_impl(impl: HImplDecl, pos: Position): string | null {
  if (!contains_position(impl.span, pos)) return null;
  for (const method of impl.methods) {
    const r = find_ident_in_fn(method, pos);
    if (r !== null) return r;
  }
  return null;
}

function find_ident_at_position(decls: HDecl[], pos: Position): string | null {
  for (const decl of decls) {
    let result: string | null = null;
    switch (decl.kind) {
      case "fn_decl":
        result = find_ident_in_fn(decl, pos);
        break;
      case "impl_decl":
        result = find_ident_in_impl(decl, pos);
        break;
      case "struct_decl":
      case "enum_decl":
      case "effect_decl":
      case "test_decl":
      case "trait_decl":
        break;
    }
    if (result !== null) return result;
  }
  return null;
}

// ============================================================
// Symbol table — built from AST declarations + local bindings
// ============================================================

/** Maps identifier name → its definition Span */
type SymbolTable = Map<string, Span>;

function collect_symbols_from_ast_expr(expr: Expr, table: SymbolTable): void {
  switch (expr.kind) {
    case "int_lit":
    case "float_lit":
    case "str_lit":
    case "bool_lit":
    case "ident":
      return;

    case "bin_op":
      collect_symbols_from_ast_expr(expr.left, table);
      collect_symbols_from_ast_expr(expr.right, table);
      return;

    case "unary_op":
      collect_symbols_from_ast_expr(expr.operand, table);
      return;

    case "call":
      collect_symbols_from_ast_expr(expr.callee, table);
      for (const arg of expr.args) collect_symbols_from_ast_expr(arg, table);
      return;

    case "method_call":
      collect_symbols_from_ast_expr(expr.receiver, table);
      for (const arg of expr.args) collect_symbols_from_ast_expr(arg, table);
      return;

    case "field_access":
      collect_symbols_from_ast_expr(expr.receiver, table);
      return;

    case "struct_lit":
      for (const field of expr.fields) collect_symbols_from_ast_expr(field.value, table);
      return;

    case "match_expr":
      collect_symbols_from_ast_expr(expr.scrutinee, table);
      for (const arm of expr.arms) {
        if (arm.guard) collect_symbols_from_ast_expr(arm.guard, table);
        collect_symbols_from_ast_expr(arm.body, table);
      }
      return;

    case "block":
      collect_symbols_from_ast_block(expr, table);
      return;

    case "if_expr":
      collect_symbols_from_ast_expr(expr.condition, table);
      collect_symbols_from_ast_block(expr.then_branch, table);
      if (expr.else_branch) {
        if (expr.else_branch.kind === "if_expr") {
          collect_symbols_from_ast_expr(expr.else_branch, table);
        } else {
          collect_symbols_from_ast_block(expr.else_branch, table);
        }
      }
      return;

    case "string_interp":
      for (const part of expr.parts) {
        if (typeof part !== "string") collect_symbols_from_ast_expr(part, table);
      }
      return;

    case "or_expr":
      collect_symbols_from_ast_expr(expr.expr, table);
      collect_symbols_from_ast_expr(expr.default_value, table);
      return;

    case "catch_expr":
      collect_symbols_from_ast_expr(expr.expr, table);
      collect_symbols_from_ast_expr(expr.handler, table);
      return;

    case "handle_expr":
      collect_symbols_from_ast_expr(expr.body, table);
      for (const handler of expr.handlers) {
        collect_symbols_from_ast_expr(handler.body, table);
      }
      return;

    case "lambda":
      for (const param of expr.params) {
        table.set(param.name, param.span);
      }
      collect_symbols_from_ast_expr(expr.body, table);
      return;

    case "option_unwrap":
      collect_symbols_from_ast_expr(expr.expr, table);
      return;

    case "try_block":
      collect_symbols_from_ast_expr(expr.body, table);
      return;
  }
}

function collect_symbols_from_ast_stmt(stmt: Stmt, table: SymbolTable): void {
  switch (stmt.kind) {
    case "let_stmt":
    case "var_stmt":
      table.set(stmt.name, stmt.span);
      collect_symbols_from_ast_expr(stmt.init, table);
      return;

    case "assign_stmt":
      collect_symbols_from_ast_expr(stmt.target, table);
      collect_symbols_from_ast_expr(stmt.value, table);
      return;

    case "expr_stmt":
      collect_symbols_from_ast_expr(stmt.expr, table);
      return;

    case "return_stmt":
      if (stmt.value) collect_symbols_from_ast_expr(stmt.value, table);
      return;
  }
}

function collect_symbols_from_ast_block(block: BlockExpr, table: SymbolTable): void {
  for (const stmt of block.stmts) {
    collect_symbols_from_ast_stmt(stmt, table);
  }
  if (block.tail) collect_symbols_from_ast_expr(block.tail, table);
}

function collect_symbols_from_fn(fn: FnDecl, table: SymbolTable): void {
  // Function params are local bindings
  for (const param of fn.params) {
    table.set(param.name, param.span);
  }
  collect_symbols_from_ast_block(fn.body, table);
}

function build_symbol_table(ast: readonly Decl[]): SymbolTable {
  const table: SymbolTable = new Map();

  for (const decl of ast) {
    switch (decl.kind) {
      case "fn_decl":
        // The function name itself maps to the fn declaration span
        table.set(decl.name, decl.span);
        // Also collect local bindings inside the function body
        collect_symbols_from_fn(decl, table);
        break;

      case "struct_decl":
        table.set(decl.name, decl.span);
        for (const field of decl.fields) {
          table.set(field.name, field.span);
        }
        break;

      case "enum_decl":
        table.set(decl.name, decl.span);
        for (const variant of decl.variants) {
          table.set(variant.name, variant.span);
        }
        break;

      case "trait_decl":
        table.set(decl.name, decl.span);
        for (const method of decl.methods) {
          table.set(method.name, method.span);
        }
        break;

      case "effect_decl":
        table.set(decl.name, decl.span);
        break;

      case "impl_decl":
        for (const method of decl.methods) {
          // Register as "TypeName.methodName" and plain "methodName"
          table.set(`${decl.target_type}.${method.name}`, method.span);
          table.set(method.name, method.span);
          collect_symbols_from_fn(method, table);
        }
        break;

      case "test_decl":
        collect_symbols_from_ast_block(decl.body, table);
        break;
    }
  }

  return table;
}

// ============================================================
// Public API
// ============================================================

export function get_definition(state: DocumentState, position: Position): Location | null {
  // Need both HIR (to identify what the cursor is on) and AST (for definition spans)
  if (!state.checkResult || !state.ast) return null;

  const { program } = state.checkResult;

  // Step 1: find which identifier the cursor is on
  const ident_name = find_ident_at_position(program.decls, position);
  if (ident_name === null) return null;

  // Step 2: look up the definition span in the symbol table built from AST
  const symbol_table = build_symbol_table(state.ast.decls);
  const def_span = symbol_table.get(ident_name);
  if (!def_span) return null;

  return {
    uri: state.uri,
    range: span_to_range(def_span),
  };
}
