// Shared HIR tree walker for LSP features.
// Centralizes the 20+ case switch over HExpr/HStmt variants.
import {
  HExpr, HStmt, HBlock, HDecl, HProgram,
  HFnDecl, HImplDecl,
} from "../hir/index.js";

export type WalkAction = "stop" | void;

export interface HirVisitor {
  enter_expr?(expr: HExpr): WalkAction;
  enter_stmt?(stmt: HStmt): WalkAction;
  enter_fn?(fn: HFnDecl): WalkAction;
  enter_impl?(impl: HImplDecl): WalkAction;
}

export function walk_program(program: HProgram, v: HirVisitor): void {
  for (const decl of program.decls) {
    if (walk_decl(decl, v) === "stop") return;
  }
}

export function walk_decl(decl: HDecl, v: HirVisitor): WalkAction {
  switch (decl.kind) {
    case "fn_decl":
      return walk_fn(decl, v);
    case "impl_decl":
      return walk_impl(decl, v);
    case "test_decl":
      return walk_block(decl.body, v);
    case "extern_fn_decl":
      return;
    case "extern_type_decl":
      return;
    default:
      return;
  }
}

export function walk_fn(fn: HFnDecl, v: HirVisitor): WalkAction {
  if (v.enter_fn) {
    if (v.enter_fn(fn) === "stop") return "stop";
  }
  return walk_block(fn.body, v);
}

export function walk_impl(impl: HImplDecl, v: HirVisitor): WalkAction {
  if (v.enter_impl) {
    if (v.enter_impl(impl) === "stop") return "stop";
  }
  for (const method of impl.methods) {
    if (method.kind === "extern_fn_decl") continue;
    if (walk_fn(method, v) === "stop") return "stop";
  }
}

export function walk_block(block: HBlock, v: HirVisitor): WalkAction {
  for (const stmt of block.stmts) {
    if (walk_stmt(stmt, v) === "stop") return "stop";
  }
  if (block.tail) {
    return walk_expr(block.tail, v);
  }
}

export function walk_stmt(stmt: HStmt, v: HirVisitor): WalkAction {
  if (v.enter_stmt) {
    if (v.enter_stmt(stmt) === "stop") return "stop";
  }
  switch (stmt.kind) {
    case "let_stmt":
    case "var_stmt":
      return walk_expr(stmt.init, v);
    case "assign_stmt":
      if (walk_expr(stmt.target, v) === "stop") return "stop";
      return walk_expr(stmt.value, v);
    case "expr_stmt":
      return walk_expr(stmt.expr, v);
    case "return_stmt":
      if (stmt.value) return walk_expr(stmt.value, v);
      return;
    case "while_stmt":
      if (walk_expr(stmt.condition, v) === "stop") return "stop";
      return walk_block(stmt.body, v);
    case "for_in_stmt":
      if (walk_expr(stmt.iterable, v) === "stop") return "stop";
      return walk_block(stmt.body, v);
    case "break_stmt":
    case "continue_stmt":
      return;
    case "let_destructure":
      return walk_expr(stmt.init, v);
    case "if_let":
      if (walk_expr(stmt.expr, v) === "stop") return "stop";
      if (walk_block(stmt.then_block, v) === "stop") return "stop";
      if (stmt.else_block) return walk_block(stmt.else_block, v);
      return;
  }
}

export function walk_expr(expr: HExpr, v: HirVisitor): WalkAction {
  if (v.enter_expr) {
    if (v.enter_expr(expr) === "stop") return "stop";
  }
  switch (expr.kind) {
    case "int_lit":
    case "float_lit":
    case "str_lit":
    case "bool_lit":
    case "ident":
      return;
    case "bin_op":
      if (walk_expr(expr.left, v) === "stop") return "stop";
      return walk_expr(expr.right, v);
    case "unary_op":
      return walk_expr(expr.operand, v);
    case "call":
      if (walk_expr(expr.callee, v) === "stop") return "stop";
      for (const arg of expr.args) {
        if (walk_expr(arg, v) === "stop") return "stop";
      }
      return;
    case "field_access":
      return walk_expr(expr.receiver, v);
    case "struct_lit":
      for (const f of expr.fields) {
        if (walk_expr(f.value, v) === "stop") return "stop";
      }
      return;
    case "match_expr":
      if (walk_expr(expr.scrutinee, v) === "stop") return "stop";
      for (const arm of expr.arms) {
        if (arm.guard && walk_expr(arm.guard, v) === "stop") return "stop";
        if (walk_expr(arm.body, v) === "stop") return "stop";
      }
      return;
    case "block":
      return walk_block(expr, v);
    case "if_expr":
      if (walk_expr(expr.condition, v) === "stop") return "stop";
      if (walk_block(expr.then_branch, v) === "stop") return "stop";
      if (expr.else_branch) {
        if (expr.else_branch.kind === "block") {
          return walk_block(expr.else_branch, v);
        }
        return walk_expr(expr.else_branch, v);
      }
      return;
    case "string_interp":
      for (const part of expr.parts) {
        if (typeof part !== "string") {
          if (walk_expr(part, v) === "stop") return "stop";
        }
      }
      return;
    case "try_catch":
      if (walk_expr(expr.body, v) === "stop") return "stop";
      return walk_expr(expr.handler, v);
    case "handle_expr":
      if (walk_expr(expr.body, v) === "stop") return "stop";
      for (const h of expr.handlers) {
        if (walk_expr(h.body, v) === "stop") return "stop";
      }
      return;
    case "lambda":
      return walk_expr(expr.body, v);
    case "effect_op":
      for (const arg of expr.args) {
        if (walk_expr(arg, v) === "stop") return "stop";
      }
      return;
    case "option_unwrap":
      return walk_expr(expr.expr, v);
    case "try_block":
      return walk_expr(expr.body, v);
    case "option_or":
      if (walk_expr(expr.expr, v) === "stop") return "stop";
      return walk_expr(expr.default_value, v);
    case "range":
      if (walk_expr(expr.start, v) === "stop") return "stop";
      return walk_expr(expr.end, v);
    case "list_lit":
    case "tuple_lit":
      for (const el of expr.elements) {
        if (walk_expr(el, v) === "stop") return "stop";
      }
      return;
  }
}
