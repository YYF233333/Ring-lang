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
import { find_ident_at_position } from "./definition.js";

// ============================================================
// Collect ALL HIdent occurrences matching a target def_id or name
// ============================================================

type MatchFn = (name: string, def_id?: number) => boolean;

function collect_idents_in_expr(expr: HExpr, matches: MatchFn, uri: string, out: Location[]): void {
  switch (expr.kind) {
    case "ident":
      if (matches(expr.name, expr.def_id)) {
        out.push({ uri, range: span_to_range(expr.span) });
      }
      return;

    case "int_lit":
    case "float_lit":
    case "str_lit":
    case "bool_lit":
      return;

    case "bin_op":
      collect_idents_in_expr(expr.left, matches, uri, out);
      collect_idents_in_expr(expr.right, matches, uri, out);
      return;

    case "unary_op":
      collect_idents_in_expr(expr.operand, matches, uri, out);
      return;

    case "call":
      collect_idents_in_expr(expr.callee, matches, uri, out);
      for (const arg of expr.args) collect_idents_in_expr(arg, matches, uri, out);
      return;

    case "field_access":
      collect_idents_in_expr(expr.receiver, matches, uri, out);
      return;

    case "struct_lit":
      for (const field of expr.fields) collect_idents_in_expr(field.value, matches, uri, out);
      return;

    case "match_expr":
      collect_idents_in_expr(expr.scrutinee, matches, uri, out);
      for (const arm of expr.arms) {
        if (arm.guard) collect_idents_in_expr(arm.guard, matches, uri, out);
        collect_idents_in_expr(arm.body, matches, uri, out);
      }
      return;

    case "block":
      collect_idents_in_block(expr, matches, uri, out);
      return;

    case "if_expr":
      collect_idents_in_expr(expr.condition, matches, uri, out);
      collect_idents_in_block(expr.then_branch, matches, uri, out);
      if (expr.else_branch) {
        if (expr.else_branch.kind === "if_expr") {
          collect_idents_in_expr(expr.else_branch, matches, uri, out);
        } else {
          collect_idents_in_block(expr.else_branch, matches, uri, out);
        }
      }
      return;

    case "string_interp":
      for (const part of expr.parts) {
        if (typeof part !== "string") collect_idents_in_expr(part, matches, uri, out);
      }
      return;

    case "try_catch":
      collect_idents_in_expr(expr.body, matches, uri, out);
      collect_idents_in_expr(expr.handler, matches, uri, out);
      return;

    case "handle_expr":
      collect_idents_in_expr(expr.body, matches, uri, out);
      for (const handler of expr.handlers) {
        collect_idents_in_expr(handler.body, matches, uri, out);
      }
      return;

    case "lambda":
      collect_idents_in_expr(expr.body, matches, uri, out);
      return;

    case "effect_op":
      for (const arg of expr.args) collect_idents_in_expr(arg, matches, uri, out);
      return;

    case "option_unwrap":
      collect_idents_in_expr(expr.expr, matches, uri, out);
      return;

    case "try_block":
      collect_idents_in_expr(expr.body, matches, uri, out);
      return;

    case "option_or":
      collect_idents_in_expr(expr.expr, matches, uri, out);
      collect_idents_in_expr(expr.default_value, matches, uri, out);
      return;

    case "range":
      collect_idents_in_expr(expr.start, matches, uri, out);
      collect_idents_in_expr(expr.end, matches, uri, out);
      return;

    case "list_lit":
      for (const el of expr.elements) collect_idents_in_expr(el, matches, uri, out);
      return;
    case "tuple_lit":
      for (const el of expr.elements) collect_idents_in_expr(el, matches, uri, out);
      return;
  }
}

function collect_idents_in_stmt(stmt: HStmt, matches: MatchFn, uri: string, out: Location[]): void {
  switch (stmt.kind) {
    case "let_stmt":
    case "var_stmt":
      if (matches(stmt.name, stmt.def_id)) {
        out.push({ uri, range: span_to_range(stmt.name_span) });
      }
      collect_idents_in_expr(stmt.init, matches, uri, out);
      return;

    case "assign_stmt":
      collect_idents_in_expr(stmt.target, matches, uri, out);
      collect_idents_in_expr(stmt.value, matches, uri, out);
      return;

    case "expr_stmt":
      collect_idents_in_expr(stmt.expr, matches, uri, out);
      return;

    case "return_stmt":
      if (stmt.value) collect_idents_in_expr(stmt.value, matches, uri, out);
      return;

    case "while_stmt":
      collect_idents_in_expr(stmt.condition, matches, uri, out);
      collect_idents_in_block(stmt.body, matches, uri, out);
      return;

    case "for_in_stmt":
      if (matches(stmt.binding, stmt.def_id)) {
        out.push({ uri, range: span_to_range(stmt.binding_span) });
      }
      collect_idents_in_expr(stmt.iterable, matches, uri, out);
      collect_idents_in_block(stmt.body, matches, uri, out);
      return;

    case "break_stmt":
    case "continue_stmt":
      return;

    case "let_destructure":
      for (const b of stmt.bindings) {
        if (b.name !== "_" && matches(b.name, b.def_id)) {
          // For bindings in let_destructure, highlight the pattern element span
          const el = stmt.pattern.elements.find(e => e.kind === "binding" && e.name === b.name);
          if (el) out.push({ uri, range: span_to_range(el.span) });
        }
      }
      collect_idents_in_expr(stmt.init, matches, uri, out);
      return;

    case "if_let":
      collect_idents_in_expr(stmt.expr, matches, uri, out);
      collect_idents_in_block(stmt.then_block, matches, uri, out);
      if (stmt.else_block) collect_idents_in_block(stmt.else_block, matches, uri, out);
      return;
  }
}

function collect_idents_in_block(block: HBlock, matches: MatchFn, uri: string, out: Location[]): void {
  for (const stmt of block.stmts) {
    collect_idents_in_stmt(stmt, matches, uri, out);
  }
  if (block.tail) {
    collect_idents_in_expr(block.tail, matches, uri, out);
  }
}

function collect_idents_in_fn(fn: HFnDecl, matches: MatchFn, uri: string, out: Location[]): void {
  if (matches(fn.name, fn.def_id)) {
    out.push({ uri, range: span_to_range(fn.span) });
  }
  collect_idents_in_block(fn.body, matches, uri, out);
}

function collect_idents_in_impl(impl: HImplDecl, matches: MatchFn, uri: string, out: Location[]): void {
  for (const method of impl.methods) {
    collect_idents_in_fn(method, matches, uri, out);
  }
}

function collect_all_references(decls: HDecl[], matches: MatchFn, uri: string): Location[] {
  const out: Location[] = [];
  for (const decl of decls) {
    switch (decl.kind) {
      case "fn_decl":
        collect_idents_in_fn(decl, matches, uri, out);
        break;
      case "impl_decl":
        collect_idents_in_impl(decl, matches, uri, out);
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

  const ident = find_ident_at_position(program.decls, position);
  if (ident === null) return [];

  // Use def_id for scope-aware matching when available
  const matches: MatchFn = ident.def_id !== undefined
    ? (_name, did) => did === ident.def_id
    : (name, _did) => name === ident.name;

  return collect_all_references(program.decls, matches, state.uri);
}
