import { Hover, Position } from "vscode-languageserver";
import { DocumentState } from "../document-manager.js";
import { format_type_for_hover } from "../utils.js";
import { type_to_string } from "../../types/index.js";
import {
  HDecl,
  HExpr,
  HStmt,
  HBlock,
  HFnDecl,
  HImplDecl,
} from "../../hir/index.js";
import { Span } from "../../ast/index.js";

// ============================================================
// Position containment (Ring 1-based lines vs LSP 0-based lines)
// ============================================================

/**
 * Returns true if the LSP position (0-based line) falls within the Ring span.
 * Ring spans: line is 1-based, column is 0-based.
 * LSP position: line is 0-based, character is 0-based.
 */
function contains_position(span: Span, pos: Position): boolean {
  // Convert LSP 0-based line to Ring 1-based
  const ring_line = pos.line + 1;
  const ring_col = pos.character;

  const { start, end } = span;

  if (ring_line < start.line || ring_line > end.line) return false;
  if (ring_line === start.line && ring_col < start.column) return false;
  if (ring_line === end.line && ring_col >= end.column) return false;
  return true;
}

// ============================================================
// HIR traversal — find the smallest node containing position
// ============================================================

/** Result from walking the HIR: the best-fit node's type string and span. */
interface HoverCandidate {
  type_str: string;
  span: Span;
}

function walk_expr(expr: HExpr, pos: Position): HoverCandidate | null {
  if (!contains_position(expr.span, pos)) return null;

  // Attempt to find a deeper (more specific) match first, then fall back to
  // the expression itself.
  let deeper: HoverCandidate | null = null;

  switch (expr.kind) {
    case "int_lit":
    case "float_lit":
    case "str_lit":
    case "bool_lit":
      // Leaf nodes — no children to recurse into
      break;

    case "ident":
      // Leaf node
      break;

    case "bin_op": {
      deeper = walk_expr(expr.left, pos) ?? walk_expr(expr.right, pos);
      break;
    }

    case "unary_op": {
      deeper = walk_expr(expr.operand, pos);
      break;
    }

    case "call": {
      deeper = walk_expr(expr.callee, pos);
      if (!deeper) {
        for (const arg of expr.args) {
          deeper = walk_expr(arg, pos);
          if (deeper) break;
        }
      }
      break;
    }

    case "field_access": {
      deeper = walk_expr(expr.receiver, pos);
      break;
    }

    case "struct_lit": {
      for (const field of expr.fields) {
        deeper = walk_expr(field.value, pos);
        if (deeper) break;
      }
      break;
    }

    case "match_expr": {
      deeper = walk_expr(expr.scrutinee, pos);
      if (!deeper) {
        for (const arm of expr.arms) {
          if (arm.guard) {
            deeper = walk_expr(arm.guard, pos);
            if (deeper) break;
          }
          deeper = walk_expr(arm.body, pos);
          if (deeper) break;
        }
      }
      break;
    }

    case "block": {
      deeper = walk_block(expr, pos);
      break;
    }

    case "if_expr": {
      deeper = walk_expr(expr.condition, pos);
      if (!deeper) deeper = walk_block(expr.then_branch, pos);
      if (!deeper && expr.else_branch) {
        if (expr.else_branch.kind === "if_expr") {
          deeper = walk_expr(expr.else_branch, pos);
        } else {
          deeper = walk_block(expr.else_branch, pos);
        }
      }
      break;
    }

    case "string_interp": {
      for (const part of expr.parts) {
        if (typeof part !== "string") {
          deeper = walk_expr(part, pos);
          if (deeper) break;
        }
      }
      break;
    }

    case "try_catch": {
      deeper = walk_expr(expr.body, pos) ?? walk_expr(expr.handler, pos);
      break;
    }

    case "handle_expr": {
      deeper = walk_expr(expr.body, pos);
      if (!deeper) {
        for (const handler of expr.handlers) {
          deeper = walk_expr(handler.body, pos);
          if (deeper) break;
        }
      }
      break;
    }

    case "lambda": {
      deeper = walk_expr(expr.body, pos);
      break;
    }

    case "effect_op": {
      for (const arg of expr.args) {
        deeper = walk_expr(arg, pos);
        if (deeper) break;
      }
      break;
    }

    case "option_unwrap": {
      deeper = walk_expr(expr.expr, pos);
      break;
    }

    case "try_block": {
      deeper = walk_expr(expr.body, pos);
      break;
    }

    case "option_or": {
      deeper = walk_expr(expr.expr, pos) ?? walk_expr(expr.default_value, pos);
      break;
    }
  }

  if (deeper) return deeper;

  // This expression is the best match — return it
  return {
    type_str: format_type_for_hover(expr.type, expr.effects),
    span: expr.span,
  };
}

function walk_stmt(stmt: HStmt, pos: Position): HoverCandidate | null {
  switch (stmt.kind) {
    case "let_stmt":
    case "var_stmt": {
      if (!contains_position(stmt.span, pos)) return null;
      const deeper = walk_expr(stmt.init, pos);
      if (deeper) return deeper;
      // Hovering on the binding name itself — show the declared type
      return { type_str: type_to_string(stmt.type), span: stmt.span };
    }

    case "assign_stmt": {
      if (!contains_position(stmt.span, pos)) return null;
      return walk_expr(stmt.target, pos) ?? walk_expr(stmt.value, pos);
    }

    case "expr_stmt": {
      if (!contains_position(stmt.span, pos)) return null;
      return walk_expr(stmt.expr, pos);
    }

    case "return_stmt": {
      if (!contains_position(stmt.span, pos)) return null;
      if (stmt.value) return walk_expr(stmt.value, pos);
      return null;
    }
  }
}

function walk_block(block: HBlock, pos: Position): HoverCandidate | null {
  for (const stmt of block.stmts) {
    const result = walk_stmt(stmt, pos);
    if (result) return result;
  }
  if (block.tail) {
    return walk_expr(block.tail, pos);
  }
  return null;
}


function walk_fn_decl(fn: HFnDecl, pos: Position): HoverCandidate | null {
  if (!contains_position(fn.span, pos)) return null;

  // Try the body first for a deeper match
  const body_result = walk_block(fn.body, pos);
  if (body_result) return body_result;

  // Hovering somewhere on the fn declaration (name, params, return type)
  // Show the full function signature
  const params = fn.params
    .map(p => `${p.name}: ${type_to_string(p.type)}`)
    .join(", ");
  const ret = type_to_string(fn.return_type);
  const type_str = `fn ${fn.name}(${params}) -> ${ret}`;
  return { type_str, span: fn.span };
}

function walk_impl_decl(impl: HImplDecl, pos: Position): HoverCandidate | null {
  if (!contains_position(impl.span, pos)) return null;
  for (const method of impl.methods) {
    const result = walk_fn_decl(method, pos);
    if (result) return result;
  }
  return null;
}

function walk_decl(decl: HDecl, pos: Position): HoverCandidate | null {
  switch (decl.kind) {
    case "fn_decl":
      return walk_fn_decl(decl, pos);

    case "impl_decl":
      return walk_impl_decl(decl, pos);

    case "struct_decl":
    case "enum_decl":
    case "effect_decl":
    case "test_decl":
    case "trait_decl":
      // For now these declaration types are not traversed for hover
      return null;
  }
}

// ============================================================
// Public API
// ============================================================

export function get_hover(state: DocumentState, position: Position): Hover | null {
  if (!state.checkResult) return null;

  const { program } = state.checkResult;
  let best: HoverCandidate | null = null;

  for (const decl of program.decls) {
    const result = walk_decl(decl, position);
    if (result) {
      best = result;
      break;
    }
  }

  if (!best) return null;

  // contents is a plain MarkedString (string) so that callers can use
  // .toString() to get the display text. LSP clients treat a plain string
  // as markdown hover text.
  return {
    contents: `\`\`\`ring\n${best.type_str}\n\`\`\``,
  };
}
