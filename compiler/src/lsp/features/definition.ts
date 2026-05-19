import { Location, Position } from "vscode-languageserver";
import { DocumentState } from "../document-manager.js";
import { span_to_range, contains_position } from "../utils.js";
import { HDecl } from "../../hir/index.js";
import {
  Decl, FnDecl, Stmt, Expr, BlockExpr, Span,
} from "../../ast/index.js";
import { walk_program } from "../hir-visitor.js";

// ============================================================
// HIR traversal — find the HIdent name at cursor position
// ============================================================

export interface IdentInfo {
  name: string;
  def_id?: number;
}

export function find_ident_at_position(decls: HDecl[], pos: Position): IdentInfo | null {
  let result: IdentInfo | null = null;

  walk_program({ decls }, {
    enter_stmt(stmt) {
      if ((stmt.kind === "let_stmt" || stmt.kind === "var_stmt") &&
          contains_position(stmt.span, pos)) {
        result = { name: stmt.name, def_id: stmt.def_id };
      }
    },
    enter_expr(expr) {
      if (expr.kind === "ident" && contains_position(expr.span, pos)) {
        result = { name: expr.name, def_id: expr.def_id };
      }
    },
  });

  return result;
}

// ============================================================
// Symbol table — built from AST declarations + local bindings
// ============================================================

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
    case "range":
      collect_symbols_from_ast_expr(expr.start, table);
      collect_symbols_from_ast_expr(expr.end, table);
      return;
    case "list_lit":
      for (const el of expr.elements) collect_symbols_from_ast_expr(el, table);
      return;
    case "tuple_lit":
      for (const el of expr.elements) collect_symbols_from_ast_expr(el, table);
      return;
  }
}

function collect_symbols_from_ast_stmt(stmt: Stmt, table: SymbolTable): void {
  switch (stmt.kind) {
    case "let_stmt":
    case "var_stmt":
      table.set(stmt.name, stmt.name_span);
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
    case "while_stmt":
      collect_symbols_from_ast_expr(stmt.condition, table);
      collect_symbols_from_ast_block(stmt.body, table);
      return;
    case "for_in_stmt":
      table.set(stmt.binding, stmt.binding_span);
      collect_symbols_from_ast_expr(stmt.iterable, table);
      collect_symbols_from_ast_block(stmt.body, table);
      return;
    case "break_stmt":
    case "continue_stmt":
      return;
    case "let_destructure":
      for (const el of stmt.pattern.elements) {
        if (el.kind === "binding") table.set(el.name, el.span);
      }
      collect_symbols_from_ast_expr(stmt.init, table);
      return;
    case "if_let":
      collect_symbols_from_ast_expr(stmt.expr, table);
      collect_symbols_from_ast_block(stmt.then_block, table);
      if (stmt.else_block) collect_symbols_from_ast_block(stmt.else_block, table);
      return;
  }
}

function collect_symbols_from_ast_block(block: BlockExpr, table: SymbolTable): void {
  for (const stmt of block.stmts) collect_symbols_from_ast_stmt(stmt, table);
  if (block.tail) collect_symbols_from_ast_expr(block.tail, table);
}

function collect_symbols_from_fn(fn: FnDecl, table: SymbolTable): void {
  for (const param of fn.params) table.set(param.name, param.span);
  collect_symbols_from_ast_block(fn.body, table);
}

function build_symbol_table(ast: readonly Decl[]): SymbolTable {
  const table: SymbolTable = new Map();
  for (const decl of ast) {
    switch (decl.kind) {
      case "fn_decl":
        table.set(decl.name, decl.span);
        collect_symbols_from_fn(decl, table);
        break;
      case "struct_decl":
        table.set(decl.name, decl.span);
        for (const field of decl.fields) table.set(field.name, field.span);
        break;
      case "enum_decl":
        table.set(decl.name, decl.span);
        for (const variant of decl.variants) table.set(variant.name, variant.span);
        break;
      case "trait_decl":
        table.set(decl.name, decl.span);
        for (const method of decl.methods) table.set(method.name, method.span);
        break;
      case "effect_decl":
        table.set(decl.name, decl.span);
        break;
      case "impl_decl":
        for (const method of decl.methods) {
          table.set(`${decl.target_type}.${method.name}`, method.span);
          table.set(method.name, method.span);
          if (method.kind !== "extern_fn_decl") {
            collect_symbols_from_fn(method, table);
          }
        }
        break;
      case "test_decl":
        collect_symbols_from_ast_block(decl.body, table);
        break;
      case "extern_fn_decl":
        table.set(decl.name, decl.span);
        break;
      case "extern_type_decl":
        table.set(decl.name, decl.span);
        break;
      case "type_alias_decl":
        table.set(decl.name, decl.span);
        break;
    }
  }
  return table;
}

// ============================================================
// Public API
// ============================================================

export function get_definition(state: DocumentState, position: Position): Location | null {
  if (!state.checkResult || !state.ast) return null;

  const { program, env } = state.checkResult;

  const ident = find_ident_at_position(program.decls, position);
  if (ident === null) return null;

  if (ident.def_id !== undefined) {
    const def_span = env.def_spans.get(ident.def_id);
    if (def_span) {
      return { uri: state.uri, range: span_to_range(def_span) };
    }
  }

  const symbol_table = build_symbol_table(state.ast.decls);
  const def_span = symbol_table.get(ident.name);
  if (!def_span) return null;

  return { uri: state.uri, range: span_to_range(def_span) };
}
